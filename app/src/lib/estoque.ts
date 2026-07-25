import { supabase } from './supabaseClient'
import type { EstoqueCor, EstoqueItem } from './types'

export interface EstoqueRow extends EstoqueItem {
  menu_item: { id: string; name: string; category_id: string | null }
}

// Cor é sempre derivada, nunca armazenada — evita ficar dessincronizada da
// quantidade real (a mesma regra roda aqui e na trigger do banco).
export function deriveEstoqueCor(item: Pick<EstoqueItem, 'estoque_atual' | 'estoque_minimo'>): EstoqueCor {
  if (item.estoque_atual <= 0) return 'vermelho'
  if (item.estoque_atual <= item.estoque_minimo) return 'amarelo'
  return 'verde'
}

// Traz todo item do cardápio, com ou sem controle de estoque habilitado —
// itens sem linha em estoque_itens ainda aparecem na tela, com os campos
// zerados/desabilitados, prontos pro lojista ligar o controle quando quiser.
export async function fetchEstoque(businessId: string): Promise<EstoqueRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name, category_id, estoque_itens(*)')
    .eq('business_id', businessId)
    .order('name')
  if (error) throw error
  return (data ?? []).map((m: any) => {
    const linha = (m.estoque_itens?.[0] ?? null) as EstoqueItem | null
    return {
      item_id: m.id as string,
      business_id: businessId,
      estoque_atual: linha?.estoque_atual ?? 0,
      estoque_minimo: linha?.estoque_minimo ?? 0,
      estoque_habilitado: linha?.estoque_habilitado ?? false,
      updated_at: linha?.updated_at ?? '',
      menu_item: { id: m.id, name: m.name, category_id: m.category_id },
    }
  })
}

// Upsert parcial — cria a linha em estoque_itens na primeira vez que o
// lojista mexe num item (habilita controle, define quantidade ou mínimo).
export async function salvarEstoqueItem(
  businessId: string,
  itemId: string,
  patch: Partial<Pick<EstoqueItem, 'estoque_atual' | 'estoque_minimo' | 'estoque_habilitado'>>,
) {
  if (!supabase) return
  const { error } = await supabase
    .from('estoque_itens')
    .upsert(
      { item_id: itemId, business_id: businessId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: 'item_id' },
    )
  if (error) throw error
}

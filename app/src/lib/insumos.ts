import { supabase } from './supabaseClient'
import type { FichaTecnicaItem, Insumo } from './types'

export async function fetchInsumos(businessId: string): Promise<Insumo[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('insumos').select('*').eq('business_id', businessId).order('nome')
  if (error) throw error
  return (data as Insumo[]) ?? []
}

export async function salvarInsumo(
  businessId: string,
  patch: Partial<Omit<Insumo, 'id' | 'business_id' | 'created_at' | 'updated_at'>>,
  id?: string,
): Promise<Insumo> {
  if (!supabase) throw new Error('Supabase não configurado.')
  const payload = { ...patch, business_id: businessId, updated_at: new Date().toISOString() }
  const query = id
    ? supabase.from('insumos').update(payload).eq('id', id).select().single()
    : supabase.from('insumos').insert(payload).select().single()
  const { data, error } = await query
  if (error) throw error
  return data as Insumo
}

export async function excluirInsumo(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('insumos').delete().eq('id', id)
  if (error) throw error
}

// Mapa insumo_id -> nomes dos itens do cardápio que o usam na ficha técnica.
// Uma busca só (não uma por insumo) pra alimentar o "Usado em:" dos cards de
// Insumos sem sobrecarregar a tela com N requisições.
export async function fetchInsumoUsoPorItem(businessId: string): Promise<Record<string, string[]>> {
  if (!supabase) return {}
  const { data } = await supabase
    .from('ficha_tecnica_itens')
    .select('insumo_id, menu_items!inner(name, business_id)')
    .eq('menu_items.business_id', businessId)
  const mapa: Record<string, string[]> = {}
  for (const row of (data ?? []) as unknown as Array<{ insumo_id: string; menu_items: { name: string } | null }>) {
    if (!row.menu_items) continue
    ;(mapa[row.insumo_id] ??= []).push(row.menu_items.name)
  }
  return mapa
}

// insumo aninhado (nome/unidade/custo_unitario) pra exibir a lista da ficha
// técnica sem precisar de uma segunda busca separada por insumo.
export async function fetchFichaTecnica(menuItemId: string): Promise<FichaTecnicaItem[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('ficha_tecnica_itens')
    .select('*, insumo:insumos(id, nome, unidade, custo_unitario)')
    .eq('menu_item_id', menuItemId)
  if (error) throw error
  return (data as unknown as FichaTecnicaItem[]) ?? []
}

export async function salvarFichaTecnicaItem(menuItemId: string, insumoId: string, quantidade: number): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('ficha_tecnica_itens')
    .upsert({ menu_item_id: menuItemId, insumo_id: insumoId, quantidade }, { onConflict: 'menu_item_id,insumo_id' })
  if (error) throw error
}

export async function removerFichaTecnicaItem(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('ficha_tecnica_itens').delete().eq('id', id)
  if (error) throw error
}

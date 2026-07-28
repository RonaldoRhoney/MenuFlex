import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { checkPlanFeature } from '../../lib/planFeatures'
import {
  avaliarPedidosLiberados,
  itensSemFichaObrigatoria,
  progressoCardapio,
  progressoEmpresa,
  progressoEstoque,
  type AvaliacaoPedidos,
} from '../../lib/setupProgress'
import type { Business, EstoqueItem, Insumo, MenuItem, PlanFeatureRow } from '../../lib/types'
import FilaPedidos from './FilaPedidos'
import { SkeletonScreen } from '../../components/Skeleton'

interface PedidosGateProps {
  business: Business
  planFeatures: PlanFeatureRow[]
  onIrPara: (aba: 'minha_empresa' | 'cardapio' | 'estoque' | 'insumos') => void
}

// Fase 3 do Smart Setup Validation: só a ABA do admin fica atrás desse gate
// — o create_order() do cliente final nunca é bloqueado por isso, pra não
// perder venda real enquanto o lojista completa o cadastro.
export default function PedidosGate({ business, planFeatures, onIrPara }: PedidosGateProps) {
  const [avaliacao, setAvaliacao] = useState<AvaliacaoPedidos | null>(null)

  useEffect(() => {
    if (!supabase) {
      setAvaliacao({ liberado: true, pendencias: [] })
      return
    }
    let active = true
    async function avaliar() {
      const temDelivery = checkPlanFeature(planFeatures, business, 'delivery')
      const [{ data: items }, { data: estoqueItens }, { data: insumos }, { data: fichaItens }] = await Promise.all([
        supabase!.from('menu_items').select('*').eq('business_id', business.id),
        supabase!.from('estoque_itens').select('*').eq('business_id', business.id),
        supabase!.from('insumos').select('*').eq('business_id', business.id),
        supabase!
          .from('ficha_tecnica_itens')
          .select('menu_item_id, menu_items!inner(business_id)')
          .eq('menu_items.business_id', business.id),
      ])
      if (!active) return

      const qtdFichaPorItem: Record<string, number> = {}
      for (const linha of (fichaItens as { menu_item_id: string }[]) ?? []) {
        qtdFichaPorItem[linha.menu_item_id] = (qtdFichaPorItem[linha.menu_item_id] ?? 0) + 1
      }

      // Sem acesso a gestao_erp (Premium), ficha técnica é inalcançável pro
      // negócio — exigi-la travaria Pedidos pra sempre sem chance de resolver.
      // Só entra como requisito pra quem já tem acesso à feature.
      const temGestaoErp = checkPlanFeature(planFeatures, business, 'gestao_erp')
      const itensSemFicha = temGestaoErp
        ? itensSemFichaObrigatoria((items as MenuItem[]) ?? [], (estoqueItens as EstoqueItem[]) ?? [], qtdFichaPorItem)
        : []

      setAvaliacao(
        avaliarPedidosLiberados({
          empresa: progressoEmpresa(business, temDelivery),
          cardapio: progressoCardapio((items as MenuItem[]) ?? []),
          estoque: progressoEstoque((insumos as Insumo[]) ?? []),
          itensSemFicha,
        }),
      )
    }
    avaliar()
    return () => {
      active = false
    }
  }, [business, planFeatures])

  if (!avaliacao) return <SkeletonScreen />

  if (avaliacao.liberado) return <FilaPedidos business={business} />

  return (
    <div className="max-w-md space-y-4">
      <div className="border border-amber-500/40 bg-amber-500/[0.06] rounded-xl p-5">
        <h2 className="font-semibold mb-1">Quase lá!</h2>
        <p className="text-sm text-white/60 mb-4">
          Complete alguns itens da sua configuração pra liberar o acompanhamento de pedidos. Seus clientes continuam
          conseguindo pedir normalmente pelo cardápio enquanto isso.
        </p>
        <p className="text-xs text-white/40 mb-2">Faltam {avaliacao.pendencias.length} pendência(s):</p>
        <ul className="space-y-1.5 mb-4">
          {avaliacao.pendencias.map((p) => (
            <li key={p} className="text-sm text-white/70 flex items-start gap-2">
              <span className="text-amber-400 shrink-0">□</span>
              {p}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onIrPara('minha_empresa')}
            className="text-xs rounded-full border border-white/15 px-3 py-1.5 text-white/70 hover:border-white/30"
          >
            Minha Empresa
          </button>
          <button
            onClick={() => onIrPara('cardapio')}
            className="text-xs rounded-full border border-white/15 px-3 py-1.5 text-white/70 hover:border-white/30"
          >
            Cardápio
          </button>
          <button
            onClick={() => onIrPara('insumos')}
            className="text-xs rounded-full border border-white/15 px-3 py-1.5 text-white/70 hover:border-white/30"
          >
            Insumos
          </button>
        </div>
      </div>
    </div>
  )
}

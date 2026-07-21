import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { checkPlanFeature } from '../../lib/planFeatures'
import type { Business, Order, PlanFeatureRow } from '../../lib/types'

interface AnalyticsProps {
  business: Business
  planFeatures: PlanFeatureRow[]
}

export default function Analytics({ business, planFeatures }: AnalyticsProps) {
  const [orders, setOrders] = useState<Order[]>([])

  const podeBasico = checkPlanFeature(planFeatures, business.plan, 'analytics_basico')
  const podeAvancado = checkPlanFeature(planFeatures, business.plan, 'analytics_avancado')

  useEffect(() => {
    if (!supabase || !podeBasico) return
    supabase
      .from('orders')
      .select('*')
      .eq('business_id', business.id)
      .then(({ data }) => setOrders((data as Order[]) ?? []))
  }, [business.id, podeBasico])

  if (!podeBasico) {
    return <p className="text-sm text-white/40">Analytics disponível a partir do plano Básico.</p>
  }

  const totalPedidos = orders.length
  const faturamento = orders.filter((o) => o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0)
  const cancelados = orders.filter((o) => o.status === 'cancelado').length

  const porTipo = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.order_type] = (acc[o.order_type] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6 max-w-md">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-white/40">Pedidos</p>
          <p className="text-xl font-semibold">{totalPedidos}</p>
        </div>
        <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-white/40">Faturamento</p>
          <p className="text-xl font-semibold">R$ {faturamento.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>

      {podeAvancado ? (
        <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-medium mb-2">Pedidos por tipo</h3>
          {Object.entries(porTipo).map(([tipo, count]) => (
            <div key={tipo} className="flex justify-between text-sm mb-1">
              <span className="capitalize">{tipo}</span>
              <span>{count}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm mt-2 pt-2 border-t border-white/10">
            <span>Cancelados</span>
            <span>{cancelados}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-white/40">Relatórios avançados (por tipo de pedido, cancelamentos) disponíveis no Premium.</p>
      )}
    </div>
  )
}

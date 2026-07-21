import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { startAlertLoop, stopAlertLoop } from '../../lib/sound'
import type { Business, Order, OrderStatus } from '../../lib/types'

interface FilaPedidosProps {
  business: Business
}

const COLUNAS: { status: OrderStatus; label: string; next?: OrderStatus }[] = [
  { status: 'recebido', label: 'Recebido', next: 'preparo' },
  { status: 'preparo', label: 'Em preparo', next: 'pronto' },
  { status: 'pronto', label: 'Pronto', next: 'entregue' },
  { status: 'entregue', label: 'Entregue' },
]

export default function FilaPedidos({ business }: FilaPedidosProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [alerting, setAlerting] = useState(false)
  const alertingRef = useRef(false)

  useEffect(() => {
    if (!supabase) return
    let active = true

    supabase
      .from('orders')
      .select('*')
      .eq('business_id', business.id)
      .neq('status', 'cancelado')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (active) setOrders((data as Order[]) ?? [])
      })

    const channel = supabase
      .channel(`orders-${business.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `business_id=eq.${business.id}` },
        (payload) => {
          setOrders((prev) => [payload.new as Order, ...prev])
          alertingRef.current = true
          setAlerting(true)
          if (soundEnabled) startAlertLoop()
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `business_id=eq.${business.id}` },
        (payload) => {
          setOrders((prev) => prev.map((o) => (o.id === payload.new.id ? (payload.new as Order) : o)))
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase!.removeChannel(channel)
      stopAlertLoop()
    }
  }, [business.id, soundEnabled])

  function enableSound() {
    setSoundEnabled(true)
    if (alertingRef.current) startAlertLoop()
  }

  function ackAlert() {
    alertingRef.current = false
    setAlerting(false)
    stopAlertLoop()
  }

  async function advance(order: Order, next: OrderStatus) {
    if (!supabase) return
    await supabase.from('orders').update({ status: next }).eq('id', order.id)
  }

  return (
    <div>
      {!soundEnabled && (
        <button
          onClick={enableSound}
          className="w-full mb-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 py-2.5 text-sm font-medium"
        >
          🔔 Ativar alerta sonoro de novos pedidos (obrigatório no navegador — clique uma vez)
        </button>
      )}
      {alerting && (
        <div className="w-full mb-4 rounded-lg bg-brand text-white py-2.5 text-sm font-medium flex items-center justify-between px-4">
          <span>Novo pedido chegou!</span>
          <button onClick={ackAlert} className="underline">
            Confirmar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUNAS.map((col) => (
          <div key={col.status} className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
            <h3 className="font-medium text-sm mb-3 text-white/80">{col.label}</h3>
            <div className="space-y-2">
              {orders
                .filter((o) => o.status === col.status)
                .map((order) => (
                  <div key={order.id} className="bg-slate-900 border border-white/10 rounded-lg p-3">
                    <p className="text-xs text-white/40 mb-1">#{order.id.slice(0, 8)} · {order.order_type}</p>
                    <p className="font-medium text-sm mb-2">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                    {col.next && (
                      <button
                        onClick={() => advance(order, col.next!)}
                        className="text-xs bg-brand text-white rounded-full px-3 py-1"
                      >
                        Marcar {COLUNAS.find((c) => c.status === col.next)?.label}
                      </button>
                    )}
                  </div>
                ))}
              {orders.filter((o) => o.status === col.status).length === 0 && (
                <p className="text-xs text-white/30 py-2">Nenhum pedido aqui.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

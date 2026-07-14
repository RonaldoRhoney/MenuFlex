import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { OrderStatus } from '../../lib/types'

interface AcompanharPedidoProps {
  orderId: string
  onVoltarAoCardapio: () => void
}

const PASSOS: { status: OrderStatus; label: string }[] = [
  { status: 'recebido', label: 'Recebido' },
  { status: 'preparo', label: 'Em preparo' },
  { status: 'pronto', label: 'Pronto' },
  { status: 'entregue', label: 'Entregue' },
]

export default function AcompanharPedido({ orderId, onVoltarAoCardapio }: AcompanharPedidoProps) {
  const [status, setStatus] = useState<OrderStatus | null>(null)
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    if (!supabase) return

    let active = true

    supabase
      .rpc('get_public_order_status', { p_order_id: orderId })
      .then(({ data }) => {
        if (!active || !data || data.length === 0) return
        setStatus(data[0].status)
        setTotal(data[0].total)
      })

    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setStatus(payload.new.status as OrderStatus)
          setTotal(payload.new.total as number)
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase!.removeChannel(channel)
    }
  }, [orderId])

  const cancelado = status === 'cancelado'
  const stepIndex = PASSOS.findIndex((p) => p.status === status)

  return (
    <div className="max-w-md mx-auto px-4 py-10 text-center">
      <h1 className="text-xl font-semibold mb-1">Acompanhe seu pedido</h1>
      <p className="text-sm text-neutral-500 mb-8">Pedido #{orderId.slice(0, 8)}</p>

      {cancelado ? (
        <p className="text-red-600 font-medium">Este pedido foi cancelado.</p>
      ) : (
        <div className="flex justify-between mb-8">
          {PASSOS.map((passo, i) => (
            <div key={passo.status} className="flex-1 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  i <= stepIndex ? 'bg-brand text-white' : 'bg-neutral-200 text-neutral-400'
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-xs mt-2 ${i <= stepIndex ? 'text-neutral-900' : 'text-neutral-400'}`}>
                {passo.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {total !== null && (
        <p className="text-sm text-neutral-600 mb-8">Total: R$ {total.toFixed(2).replace('.', ',')}</p>
      )}

      <button onClick={onVoltarAoCardapio} className="text-sm text-brand-dark font-medium">
        Voltar ao cardápio
      </button>
    </div>
  )
}

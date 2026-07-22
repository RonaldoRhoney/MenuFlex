import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { OrderStatus } from '../../lib/types'

interface AcompanharPedidoProps {
  orderId: string
  onVoltarAoCardapio: () => void
  simulate?: boolean
  simulatedTotal?: number
}

const PASSOS: { status: OrderStatus; label: string }[] = [
  { status: 'recebido', label: 'Recebido' },
  { status: 'preparo', label: 'Em preparo' },
  { status: 'pronto', label: 'Pronto' },
  { status: 'entregue', label: 'Entregue' },
]

export default function AcompanharPedido({
  orderId,
  onVoltarAoCardapio,
  simulate,
  simulatedTotal,
}: AcompanharPedidoProps) {
  const [status, setStatus] = useState<OrderStatus | null>(simulate ? 'recebido' : null)
  const [total, setTotal] = useState<number | null>(simulate ? (simulatedTotal ?? 0) : null)

  // Sem banco ainda: avança o status sozinho, só pra demonstrar a tela por completo.
  useEffect(() => {
    if (!simulate) return
    const t1 = setTimeout(() => setStatus('preparo'), 3500)
    const t2 = setTimeout(() => setStatus('pronto'), 8000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [simulate])

  useEffect(() => {
    if (!supabase || simulate) return

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
  const progressoPercent = stepIndex <= 0 ? 0 : (stepIndex / (PASSOS.length - 1)) * 100

  return (
    <div className="max-w-md mx-auto px-4 py-10 text-center animate-fade-in">
      <h1 className="font-display text-2xl font-semibold tracking-tight mb-1.5">Acompanhe seu pedido</h1>
      <span className="inline-block font-mono text-xs tracking-wide bg-neutral-100 text-neutral-500 px-3 py-1 rounded-full mb-9">
        Pedido #{orderId.slice(0, 8)}
      </span>

      {cancelado ? (
        <p className="text-red-600 font-medium mb-8">Este pedido foi cancelado.</p>
      ) : (
        <div className="relative mb-9">
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-neutral-200" />
          <div
            className="absolute top-4 left-4 right-4 h-0.5 origin-left bg-brand transition-transform duration-700 ease-out"
            style={{ transform: `scaleX(${progressoPercent / 100})` }}
          />
          <div className="relative flex justify-between">
            {PASSOS.map((passo, i) => (
              <div key={passo.status} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-500 ${
                    i <= stepIndex ? 'bg-brand text-white' : 'bg-white border-2 border-neutral-200 text-neutral-400'
                  }`}
                >
                  {i < stepIndex ? '✓' : i + 1}
                </div>
                <span className={`text-xs mt-2 ${i <= stepIndex ? 'text-neutral-900 font-medium' : 'text-neutral-400'}`}>
                  {passo.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {total !== null && (
        <p className="text-sm text-neutral-600 mb-8">
          Total: <span className="font-display font-semibold text-neutral-900">R$ {total.toFixed(2).replace('.', ',')}</span>
        </p>
      )}

      <button onClick={onVoltarAoCardapio} className="text-sm text-brand-dark font-medium hover:text-brand-dark/80 transition-colors">
        Voltar ao cardápio
      </button>
    </div>
  )
}

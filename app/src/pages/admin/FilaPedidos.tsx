import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { startAlertLoop, stopAlertLoop } from '../../lib/sound'
import type { Business, Order, OrderStatus } from '../../lib/types'
import OrderDetailsModal from '../../components/admin/OrderDetailsModal'
import Toast, { type ToastData } from '../../components/admin/Toast'

// Tempo decorrido desde a criação do pedido — ajuda o lojista a notar visualmente
// o que está parado há mais tempo, sem depender de configurar um "tempo estimado"
// que o schema não tem hoje (evita inventar dado que não existe de verdade).
function tempoDecorrido(createdAt: string, agora: number): string {
  const min = Math.floor((agora - new Date(createdAt).getTime()) / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min}min`
  const h = Math.floor(min / 60)
  return `há ${h}h${min % 60 > 0 ? (min % 60) + 'min' : ''}`
}

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
  const [newOrderId, setNewOrderId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [agora, setAgora] = useState(() => Date.now())
  const [toast, setToast] = useState<ToastData | null>(null)
  const alertingRef = useRef(false)

  useEffect(() => {
    const tick = setInterval(() => setAgora(Date.now()), 30_000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    if (!supabase) return
    let active = true

    supabase
      .from('orders')
      .select('*, customer:customers(name, phone)')
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
          const novoPedido = payload.new as Order
          setOrders((prev) => [novoPedido, ...prev])
          setNewOrderId(novoPedido.id)
          setTimeout(() => setNewOrderId((cur) => (cur === novoPedido.id ? null : cur)), 1800)
          alertingRef.current = true
          setAlerting(true)
          if (soundEnabled) startAlertLoop()

          // O evento de INSERT do Realtime só traz as colunas cruas de
          // orders, sem o join até customers — busca à parte pra completar
          // nome/telefone no card sem esperar reload da tela inteira.
          supabase!
            .from('orders')
            .select('customer:customers(name, phone)')
            .eq('id', novoPedido.id)
            .single()
            .then(({ data }) => {
              const customer = (data as unknown as { customer: Order['customer'] } | null)?.customer ?? null
              setOrders((prev) => prev.map((o) => (o.id === novoPedido.id ? { ...o, customer } : o)))
            })
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `business_id=eq.${business.id}` },
        (payload) => {
          // Mesmo motivo do INSERT acima: o payload de UPDATE não traz o
          // join, então preserva o customer já carregado em vez de apagá-lo.
          setOrders((prev) =>
            prev.map((o) => (o.id === payload.new.id ? { ...(payload.new as Order), customer: o.customer } : o)),
          )
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
    const { error } = await supabase.from('orders').update({ status: next }).eq('id', order.id)
    if (error) {
      setToast({ mensagem: 'Não foi possível avançar o pedido. Tente de novo.', tipo: 'erro' })
    }
  }

  async function cancelar(order: Order) {
    if (!supabase) return
    if (!confirm('Cancelar este pedido? Se o estoque já tinha sido debitado (pedido em preparo ou depois), ele volta automaticamente.')) return
    const { error } = await supabase.from('orders').update({ status: 'cancelado' }).eq('id', order.id)
    if (error) {
      setToast({ mensagem: 'Não foi possível cancelar o pedido. Tente de novo.', tipo: 'erro' })
      return
    }
    setOrders((prev) => prev.filter((o) => o.id !== order.id))
    setToast({ mensagem: 'Pedido cancelado.', tipo: 'neutro' })
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
        <div className="w-full mb-4 rounded-lg bg-brand text-white py-2.5 text-sm font-medium flex items-center justify-between px-4 animate-pop-in">
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
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    role="button"
                    tabIndex={0}
                    className={`bg-slate-900 border border-white/10 rounded-lg p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 cursor-pointer animate-slide-up ${
                      order.id === newOrderId ? 'animate-highlight-new' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-white/40">#{order.id.slice(0, 8)} · {order.order_type}</p>
                      <p className={`text-xs ${col.next && agora - new Date(order.created_at).getTime() > 15 * 60_000 ? 'text-amber-400 font-medium' : 'text-white/30'}`}>
                        {tempoDecorrido(order.created_at, agora)}
                      </p>
                    </div>
                    {(order.customer?.name || order.customer?.phone) && (
                      <p className="text-sm font-medium leading-snug mb-0.5">
                        {order.customer?.name || 'Cliente'}
                        {order.customer?.phone && <span className="text-white/40 font-normal"> · {order.customer.phone}</span>}
                      </p>
                    )}
                    <p className="font-medium text-sm mb-2">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                    <div className="flex items-center gap-2">
                      {col.next && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            advance(order, col.next!)
                          }}
                          className="text-xs bg-brand text-white rounded-full px-3 py-1 transition-transform active:scale-90 hover:bg-brand-dark"
                        >
                          Marcar {COLUNAS.find((c) => c.status === col.next)?.label}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          cancelar(order)
                        }}
                        className="text-xs text-red-400/70 hover:text-red-400 px-2 py-1"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              {orders.filter((o) => o.status === col.status).length === 0 && (
                <p className="text-xs text-white/30 py-2">Nenhum pedido aqui.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}

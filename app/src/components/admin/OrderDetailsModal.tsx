import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabaseClient'
import type { Order } from '../../lib/types'

interface OrderDetailsModalProps {
  order: Order
  onClose: () => void
}

interface DetailedItem {
  id: string
  name: string
  quantity: number
  unit_price: number
  notes: string | null
}

interface CustomerInfo {
  name: string | null
  phone: string | null
}

export default function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  const [items, setItems] = useState<DetailedItem[]>([])
  const [customer, setCustomer] = useState<CustomerInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) return
    let active = true

    async function load() {
      const [itemsRes, orderRes] = await Promise.all([
        supabase!
          .from('order_items')
          .select('id, quantity, unit_price, notes, menu_items(name)')
          .eq('order_id', order.id),
        supabase!.from('orders').select('customers(name, phone)').eq('id', order.id).single(),
      ])
      if (!active) return
      setItems(
        ((itemsRes.data ?? []) as unknown as Array<{ id: string; quantity: number; unit_price: number; notes: string | null; menu_items: { name: string } | null }>).map(
          (i) => ({ id: i.id, name: i.menu_items?.name ?? 'Item removido do cardápio', quantity: i.quantity, unit_price: i.unit_price, notes: i.notes }),
        ),
      )
      const customersData = (orderRes.data as unknown as { customers: CustomerInfo | null } | null)?.customers ?? null
      setCustomer(customersData)
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [order.id])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Detalhes do pedido"
    >
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-5 animate-pop-in max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display font-semibold text-lg">Pedido #{order.id.slice(0, 8)}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-white/40 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>
        <p className="text-sm text-white/50 mb-4 capitalize">{order.order_type}</p>

        {loading ? (
          <p className="text-sm text-white/40">Carregando...</p>
        ) : (
          <>
            {(customer?.name || customer?.phone) && (
              <div className="mb-4 text-sm">
                {customer?.name && <p className="font-medium">{customer.name}</p>}
                {customer?.phone && <p className="text-white/50">{customer.phone}</p>}
              </div>
            )}

            {order.delivery_address && (
              <div className="mb-4 text-sm">
                <p className="text-white/40 text-xs mb-0.5">Endereço de entrega</p>
                <p>{order.delivery_address}</p>
              </div>
            )}

            <div className="space-y-2.5 mb-4">
              {items.map((item) => (
                <div key={item.id} className="bg-slate-950 border border-white/10 rounded-lg p-3">
                  <div className="flex justify-between items-center gap-3">
                    <span className="font-medium text-sm">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-sm text-white/70 shrink-0">
                      R$ {(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  {item.notes && <p className="text-xs text-white/40 mt-1">{item.notes}</p>}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-white/10">
              <span className="text-sm text-white/50">Total</span>
              <span className="font-semibold">R$ {order.total.toFixed(2).replace('.', ',')}</span>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

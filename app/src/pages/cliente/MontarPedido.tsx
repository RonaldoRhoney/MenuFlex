import { useState } from 'react'
import type { Business, CartItem, OrderType, PlanFeatureRow } from '../../lib/types'
import { checkPlanFeature } from '../../lib/planFeatures'

interface MontarPedidoProps {
  business: Business
  items: CartItem[]
  total: number
  planFeatures: PlanFeatureRow[]
  onSetQuantity: (menuItemId: string, quantity: number) => void
  onSetNotes: (menuItemId: string, notes: string) => void
  onBack: () => void
  onSubmit: (params: { orderType: OrderType; deliveryAddress: string; name: string; phone: string }) => Promise<void>
  submitting: boolean
  errorMessage: string | null
}

export default function MontarPedido({
  business,
  items,
  total,
  planFeatures,
  onSetQuantity,
  onSetNotes,
  onBack,
  onSubmit,
  submitting,
  errorMessage,
}: MontarPedidoProps) {
  const podeLocal = checkPlanFeature(planFeatures, business.plan, 'pedido_local')
  const podeDelivery = checkPlanFeature(planFeatures, business.plan, 'delivery')

  const [orderType, setOrderType] = useState<OrderType>('retirada')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const options: { value: OrderType; label: string }[] = [
    { value: 'retirada', label: 'Retirada' },
    ...(podeLocal ? [{ value: 'local' as OrderType, label: 'Consumir no local' }] : []),
    ...(podeDelivery ? [{ value: 'delivery' as OrderType, label: 'Delivery' }] : []),
  ]

  const canSubmit =
    items.length > 0 && name.trim().length > 0 && (orderType !== 'delivery' || deliveryAddress.trim().length > 0)

  return (
    <div className="max-w-2xl mx-auto px-4 pb-28 pt-6">
      <button onClick={onBack} className="text-sm text-neutral-500 mb-4">
        ← Voltar ao cardápio
      </button>
      <h1 className="text-xl font-semibold mb-4">Seu pedido</h1>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.menu_item_id} className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex justify-between items-center gap-3">
              <span className="font-medium">{item.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onSetQuantity(item.menu_item_id, item.quantity - 1)}
                  className="w-7 h-7 rounded-full border border-neutral-300"
                >
                  −
                </button>
                <span className="w-5 text-center">{item.quantity}</span>
                <button
                  onClick={() => onSetQuantity(item.menu_item_id, item.quantity + 1)}
                  className="w-7 h-7 rounded-full border border-neutral-300"
                >
                  +
                </button>
              </div>
            </div>
            <input
              value={item.notes}
              onChange={(e) => onSetNotes(item.menu_item_id, e.target.value)}
              placeholder="Observações (ex: sem cebola)"
              className="mt-2 w-full text-sm border border-neutral-200 rounded-lg px-3 py-1.5"
            />
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-medium mb-2">Tipo de pedido</h2>
        <div className="flex gap-2 flex-wrap">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setOrderType(opt.value)}
              className={`px-3 py-2 rounded-lg text-sm border ${
                orderType === opt.value ? 'bg-brand text-white border-brand' : 'border-neutral-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {orderType === 'delivery' && (
        <div className="mb-6">
          <label className="text-sm font-medium mb-1 block">Endereço de entrega</label>
          <textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            rows={2}
          />
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">Seu nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Telefone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {errorMessage && <p className="text-sm text-red-600 mb-4">{errorMessage}</p>}

      <div className="fixed bottom-0 inset-x-0 p-4 bg-white/95 backdrop-blur border-t border-neutral-200">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <span className="font-semibold">R$ {total.toFixed(2).replace('.', ',')}</span>
          <button
            disabled={!canSubmit || submitting}
            onClick={() => onSubmit({ orderType, deliveryAddress, name, phone })}
            className="rounded-xl bg-brand text-white px-6 py-3 font-medium disabled:opacity-40"
          >
            {submitting ? 'Enviando...' : 'Confirmar pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}

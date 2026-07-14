import { useState } from 'react'
import type { CartItem, MenuItem } from './types'

function buildLineId(menuItemId: string, optionsSummary: string) {
  return optionsSummary ? `${menuItemId}::${optionsSummary}` : menuItemId
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  const add = (
    menuItem: MenuItem,
    opts?: { unitPrice?: number; optionsSummary?: string; quantity?: number },
  ) => {
    const unitPrice = opts?.unitPrice ?? menuItem.price
    const optionsSummary = opts?.optionsSummary
    const addQuantity = opts?.quantity ?? 1
    const lineId = buildLineId(menuItem.id, optionsSummary ?? '')

    setItems((prev) => {
      const existing = prev.find((i) => i.line_id === lineId)
      if (existing) {
        return prev.map((i) => (i.line_id === lineId ? { ...i, quantity: i.quantity + addQuantity } : i))
      }
      return [
        ...prev,
        {
          line_id: lineId,
          menu_item_id: menuItem.id,
          name: menuItem.name,
          unit_price: unitPrice,
          quantity: addQuantity,
          notes: '',
          options_summary: optionsSummary,
        },
      ]
    })
  }

  const setQuantity = (lineId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0 ? prev.filter((i) => i.line_id !== lineId) : prev.map((i) => (i.line_id === lineId ? { ...i, quantity } : i)),
    )
  }

  const setNotes = (lineId: string, notes: string) => {
    setItems((prev) => prev.map((i) => (i.line_id === lineId ? { ...i, notes } : i)))
  }

  const clear = () => setItems([])

  const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)

  return { items, add, setQuantity, setNotes, clear, total }
}

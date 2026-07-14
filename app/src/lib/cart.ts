import { useState } from 'react'
import type { CartItem, MenuItem } from './types'

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  const add = (menuItem: MenuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menu_item_id === menuItem.id)
      if (existing) {
        return prev.map((i) =>
          i.menu_item_id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i,
        )
      }
      return [
        ...prev,
        { menu_item_id: menuItem.id, name: menuItem.name, unit_price: menuItem.price, quantity: 1, notes: '' },
      ]
    })
  }

  const setQuantity = (menuItemId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.menu_item_id !== menuItemId)
        : prev.map((i) => (i.menu_item_id === menuItemId ? { ...i, quantity } : i)),
    )
  }

  const setNotes = (menuItemId: string, notes: string) => {
    setItems((prev) => prev.map((i) => (i.menu_item_id === menuItemId ? { ...i, notes } : i)))
  }

  const clear = () => setItems([])

  const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)

  return { items, add, setQuantity, setNotes, clear, total }
}

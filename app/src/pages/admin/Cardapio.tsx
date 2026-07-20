import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { Business, MenuCategory, MenuItem } from '../../lib/types'
import ItemOptionsEditor from './ItemOptionsEditor'

interface CardapioAdminProps {
  business: Business
}

export default function CardapioAdmin({ business }: CardapioAdminProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newItem, setNewItem] = useState({ category_id: '', name: '', description: '', price: '' })
  const [itemComOpcoesAbertoId, setItemComOpcoesAbertoId] = useState<string | null>(null)

  async function reload() {
    if (!supabase) return
    const [{ data: cats }, { data: menuItems }] = await Promise.all([
      supabase.from('menu_categories').select('*').eq('business_id', business.id).order('order_index'),
      supabase.from('menu_items').select('*').eq('business_id', business.id).order('order_index'),
    ])
    setCategories((cats as MenuCategory[]) ?? [])
    setItems((menuItems as MenuItem[]) ?? [])
  }

  useEffect(() => {
    reload()
  }, [business.id])

  async function addCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase || !newCategoryName.trim()) return
    await supabase.from('menu_categories').insert({
      business_id: business.id,
      name: newCategoryName,
      order_index: categories.length,
    })
    setNewCategoryName('')
    reload()
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase || !newItem.name.trim() || !newItem.category_id) return
    await supabase.from('menu_items').insert({
      business_id: business.id,
      category_id: newItem.category_id,
      name: newItem.name,
      description: newItem.description || null,
      price: Number(newItem.price) || 0,
      order_index: items.filter((i) => i.category_id === newItem.category_id).length,
    })
    setNewItem({ category_id: newItem.category_id, name: '', description: '', price: '' })
    reload()
  }

  async function toggleAvailable(item: MenuItem) {
    if (!supabase) return
    await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id)
    reload()
  }

  async function deleteItem(id: string) {
    if (!supabase) return
    await supabase.from('menu_items').delete().eq('id', id)
    reload()
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-semibold mb-3">Categorias</h2>
        <form onSubmit={addCategory} className="flex gap-2 mb-3">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nova categoria (ex: Bebidas)"
            className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-brand text-white px-4 text-sm font-medium">Adicionar</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="text-sm bg-neutral-100 rounded-full px-3 py-1">
              {c.name}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Itens do cardápio</h2>
        <form onSubmit={addItem} className="grid grid-cols-2 gap-2 mb-4">
          <select
            value={newItem.category_id}
            onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}
            className="col-span-2 border border-neutral-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Categoria...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder="Nome do item"
            className="col-span-2 border border-neutral-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            placeholder="Descrição"
            className="col-span-2 border border-neutral-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            placeholder="Preço"
            type="number"
            step="0.01"
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-brand text-white px-4 text-sm font-medium">Adicionar item</button>
        </form>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-neutral-500">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setItemComOpcoesAbertoId(itemComOpcoesAbertoId === item.id ? null : item.id)
                    }
                    className="text-xs px-2 py-1 rounded-full bg-brand/10 text-brand-dark font-medium"
                  >
                    {itemComOpcoesAbertoId === item.id ? 'Fechar opções' : 'Opções'}
                  </button>
                  <button
                    onClick={() => toggleAvailable(item)}
                    className={`text-xs px-2 py-1 rounded-full ${
                      item.is_available ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-500'
                    }`}
                  >
                    {item.is_available ? 'Disponível' : 'Indisponível'}
                  </button>
                  <button onClick={() => deleteItem(item.id)} className="text-xs text-red-600">
                    Excluir
                  </button>
                </div>
              </div>
              {itemComOpcoesAbertoId === item.id && <ItemOptionsEditor menuItemId={item.id} />}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

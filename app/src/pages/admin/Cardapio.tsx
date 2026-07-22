import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { fetchBusinessSegmentIds, fetchSegments } from '../../lib/catalog'
import type { Business, MenuCategory, MenuItem, Segment } from '../../lib/types'
import ItemOptionsEditor from './ItemOptionsEditor'
import MontarCardapio from './MontarCardapio'

interface CardapioAdminProps {
  business: Business
}

interface CatalogSuggestion {
  id: string
  name: string
  description: string | null
  suggested_price: number | null
}

export default function CardapioAdmin({ business }: CardapioAdminProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newItem, setNewItem] = useState({ category_id: '', name: '', description: '', price: '' })
  const [itemComOpcoesAbertoId, setItemComOpcoesAbertoId] = useState<string | null>(null)
  const [sugestoes, setSugestoes] = useState<CatalogSuggestion[]>([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [segmentosDoNegocio, setSegmentosDoNegocio] = useState<Segment[]>([])
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false)

  useEffect(() => {
    async function loadSegmentos() {
      const [todos, idsDoNegocio] = await Promise.all([fetchSegments(), fetchBusinessSegmentIds(business.id)])
      setSegmentosDoNegocio(todos.filter((s) => idsDoNegocio.includes(s.id)))
    }
    loadSegmentos()
  }, [business.id])

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

  // Autocomplete do catálogo compartilhado — não é IA, é um dicionário
  // colaborativo (supabase/migrations/0010_catalogo_itens_cardapio.sql):
  // busca por nome parecido, ordenado pelo mais usado por todos os negócios.
  useEffect(() => {
    if (!supabase || newItem.name.trim().length < 2) {
      setSugestoes([])
      return
    }
    let active = true
    const timer = setTimeout(async () => {
      const { data } = await supabase!
        .from('menu_item_catalog')
        .select('id, name, description, suggested_price')
        .ilike('name', `%${newItem.name.trim()}%`)
        .order('usage_count', { ascending: false })
        .limit(6)
      if (active) setSugestoes((data as CatalogSuggestion[]) ?? [])
    }, 250)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [newItem.name])

  function escolherSugestao(s: CatalogSuggestion) {
    setNewItem({
      ...newItem,
      name: s.name,
      description: s.description ?? newItem.description,
      price: s.suggested_price != null ? String(s.suggested_price) : newItem.price,
    })
    setMostrarSugestoes(false)
  }

  // Contribui pro catálogo compartilhado: se o nome já existe (de qualquer
  // negócio), só soma popularidade; se é novo, entra na lista pra todo mundo.
  async function registrarNoCatalogo(name: string, description: string, price: number, categoryId: string) {
    if (!supabase) return
    const { data: existente } = await supabase
      .from('menu_item_catalog')
      .select('id, usage_count')
      .ilike('name', name)
      .maybeSingle()

    if (existente) {
      await supabase
        .from('menu_item_catalog')
        .update({ usage_count: existente.usage_count + 1, updated_at: new Date().toISOString() })
        .eq('id', existente.id)
    } else {
      const categoria = categories.find((c) => c.id === categoryId)?.name ?? null
      await supabase.from('menu_item_catalog').insert({
        name,
        description: description || null,
        suggested_price: price || null,
        category_hint: categoria,
        usage_count: 1,
      })
    }
  }

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
    const name = newItem.name.trim()
    const price = Number(newItem.price) || 0
    await supabase.from('menu_items').insert({
      business_id: business.id,
      category_id: newItem.category_id,
      name,
      description: newItem.description || null,
      price,
      order_index: items.filter((i) => i.category_id === newItem.category_id).length,
    })
    registrarNoCatalogo(name, newItem.description.trim(), price, newItem.category_id)
    setNewItem({ category_id: newItem.category_id, name: '', description: '', price: '' })
    setSugestoes([])
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

  if (mostrarCatalogo) {
    return (
      <MontarCardapio
        business={business}
        segments={segmentosDoNegocio}
        onDone={() => {
          setMostrarCatalogo(false)
          reload()
        }}
        onSkip={() => setMostrarCatalogo(false)}
        skipLabel="Voltar"
      />
    )
  }

  return (
    <div className="space-y-8">
      {segmentosDoNegocio.length > 0 && (
        <button
          onClick={() => setMostrarCatalogo(true)}
          className="w-full rounded-lg border border-brand/40 bg-brand/10 text-brand px-4 py-2.5 text-sm font-medium"
        >
          Adicionar do catálogo
        </button>
      )}

      <section>
        <h2 className="font-semibold mb-3">Categorias</h2>
        <form onSubmit={addCategory} className="flex gap-2 mb-3">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nova categoria (ex: Bebidas)"
            className="flex-1 border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
          />
          <button className="rounded-lg bg-brand text-white px-4 text-sm font-medium">Adicionar</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="text-sm bg-white/5 border border-white/10 rounded-full px-3 py-1">
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
            className="col-span-2 border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Categoria...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="col-span-2 relative">
            <input
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              onFocus={() => setMostrarSugestoes(true)}
              onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)}
              placeholder="Nome do item — comece a digitar pra ver sugestões"
              autoComplete="off"
              className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
            />
            {mostrarSugestoes && sugestoes.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-slate-900 border border-white/15 rounded-lg overflow-hidden shadow-xl">
                {sugestoes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={() => escolherSugestao(s)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{s.name}</span>
                    {s.suggested_price != null && (
                      <span className="text-xs text-white/40 shrink-0">
                        R$ {s.suggested_price.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            placeholder="Descrição"
            className="col-span-2 border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
          />
          <input
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            placeholder="Preço"
            type="number"
            step="0.01"
            className="border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
          />
          <button className="rounded-lg bg-brand text-white px-4 text-sm font-medium">Adicionar item</button>
        </form>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-slate-900 border border-white/10 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-white/40">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setItemComOpcoesAbertoId(itemComOpcoesAbertoId === item.id ? null : item.id)
                    }
                    className="text-xs px-2 py-1 rounded-full bg-brand/10 text-brand font-medium"
                  >
                    {itemComOpcoesAbertoId === item.id ? 'Fechar opções' : 'Opções'}
                  </button>
                  <button
                    onClick={() => toggleAvailable(item)}
                    className={`text-xs px-2 py-1 rounded-full ${
                      item.is_available ? 'bg-green-500/15 text-green-400' : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {item.is_available ? 'Disponível' : 'Indisponível'}
                  </button>
                  <button onClick={() => deleteItem(item.id)} className="text-xs text-red-400">
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

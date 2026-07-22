import { useState } from 'react'
import type { Business, MenuCategory, MenuItem } from '../../lib/types'
import ItemOptionsModal from '../../components/ItemOptionsModal'
import LiveClock from '../../components/LiveClock'

interface CardapioProps {
  business: Business
  categories: MenuCategory[]
  items: MenuItem[]
  onAdd: (item: MenuItem, opts?: { unitPrice?: number; optionsSummary?: string; quantity?: number }) => void
  cartCount: number
  onOpenCart: () => void
}

function scrollToCategory(id: string) {
  document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Cardapio({ business, categories, items, onAdd, cartCount, onOpenCart }: CardapioProps) {
  const [itemComOpcoes, setItemComOpcoes] = useState<MenuItem | null>(null)

  function handleAddClick(item: MenuItem) {
    if (item.option_groups && item.option_groups.length > 0) {
      setItemComOpcoes(item)
    } else {
      onAdd(item)
    }
  }

  const categoriasComItens = categories.filter(
    (cat) => items.filter((i) => i.category_id === cat.id && i.is_available).length > 0,
  )

  return (
    <div id="top" className="max-w-2xl mx-auto pb-28">
      <header className="relative overflow-hidden bg-neutral-900 text-white px-4 pt-5 pb-7 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-brand/25 blur-3xl"
        />
        <div className="relative flex justify-center mb-2">
          <LiveClock className="text-xs text-white/40" />
        </div>
        <h1 className="relative font-display text-3xl font-semibold tracking-tight">{business.name}</h1>
        {business.description && (
          <p className="relative text-sm text-white/50 mt-1.5 max-w-sm mx-auto">{business.description}</p>
        )}
        <span
          className={`relative inline-flex items-center gap-1.5 mt-3 text-xs font-medium px-3 py-1.5 rounded-full ${
            business.is_open ? 'bg-green-400/15 text-green-300' : 'bg-red-400/15 text-red-300'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${business.is_open ? 'bg-green-400' : 'bg-red-400'}`} />
          {business.is_open ? 'Aberto agora' : 'Fechado no momento'}
        </span>
      </header>

      {categoriasComItens.length > 1 && (
        <nav className="sticky top-0 z-10 bg-neutral-50/90 backdrop-blur border-b border-neutral-200/70 px-4 py-2.5 flex gap-2 overflow-x-auto">
          {categoriasComItens.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className="shrink-0 text-sm font-medium px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 text-neutral-600 hover:border-brand hover:text-brand-dark transition-colors"
            >
              {cat.name}
            </button>
          ))}
        </nav>
      )}

      <section id="cardapio" className="px-4 pt-6 space-y-9">
        {categoriasComItens.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id && i.is_available)
          return (
            <div key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-16">
              <h2 className="font-display text-xl font-semibold mb-3.5 tracking-tight">{cat.name}</h2>
              <div className="space-y-3">
                {catItems.map((item, i) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3.5 bg-white rounded-2xl p-3 border border-neutral-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fade-in"
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  >
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-neutral-500 line-clamp-2 mt-0.5">{item.description}</p>
                      )}
                      <span className="inline-block mt-1.5 text-sm font-semibold text-brand-dark">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddClick(item)}
                      disabled={!business.is_open}
                      className="shrink-0 rounded-full bg-brand text-white w-9 h-9 text-lg font-bold disabled:opacity-40 transition-transform active:scale-90 hover:scale-110"
                      aria-label={`Adicionar ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </section>

      {cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 p-4 animate-slide-up">
          <button
            onClick={onOpenCart}
            className="w-full max-w-2xl mx-auto block rounded-2xl bg-brand text-white py-3.5 font-medium shadow-lg transition-transform active:scale-[0.98] hover:shadow-xl"
          >
            Ver pedido ({cartCount} {cartCount === 1 ? 'item' : 'itens'})
          </button>
        </div>
      )}

      {itemComOpcoes && (
        <ItemOptionsModal
          item={itemComOpcoes}
          onClose={() => setItemComOpcoes(null)}
          onConfirm={({ unitPrice, optionsSummary, quantity }) => {
            onAdd(itemComOpcoes, { unitPrice, optionsSummary, quantity })
            setItemComOpcoes(null)
          }}
        />
      )}
    </div>
  )
}

import type { Business, MenuCategory, MenuItem } from '../../lib/types'

interface CardapioProps {
  business: Business
  categories: MenuCategory[]
  items: MenuItem[]
  onAdd: (item: MenuItem) => void
  cartCount: number
  onOpenCart: () => void
}

export default function Cardapio({ business, categories, items, onAdd, cartCount, onOpenCart }: CardapioProps) {
  return (
    <div id="top" className="max-w-2xl mx-auto pb-28">
      <header className="px-4 pt-8 pb-4 text-center">
        <h1 className="text-2xl font-semibold">{business.name}</h1>
        <span
          className={`inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full ${
            business.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {business.is_open ? 'Aberto agora' : 'Fechado no momento'}
        </span>
      </header>

      <section id="cardapio" className="px-4 space-y-8">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id && i.is_available)
          if (catItems.length === 0) return null
          return (
            <div key={cat.id}>
              <h2 className="text-lg font-semibold mb-3">{cat.name}</h2>
              <div className="space-y-3">
                {catItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-neutral-500 line-clamp-2">{item.description}</p>
                      )}
                      <span className="text-sm font-semibold text-brand-dark">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <button
                      onClick={() => onAdd(item)}
                      disabled={!business.is_open}
                      className="shrink-0 rounded-full bg-brand text-white w-9 h-9 text-lg font-bold disabled:opacity-40"
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
        <div className="fixed bottom-0 inset-x-0 p-4">
          <button
            onClick={onOpenCart}
            className="w-full max-w-2xl mx-auto block rounded-xl bg-brand text-white py-3 font-medium shadow-lg"
          >
            Ver pedido ({cartCount} {cartCount === 1 ? 'item' : 'itens'})
          </button>
        </div>
      )}
    </div>
  )
}

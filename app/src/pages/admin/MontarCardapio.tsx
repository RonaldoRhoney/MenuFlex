import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { fetchCatalogBySegments, publishCatalogSelections } from '../../lib/catalog'
import type { Business, MenuCategory, MenuItemCatalogEntry, Segment } from '../../lib/types'

interface MontarCardapioProps {
  business: Business
  segments: Segment[]
  onDone: () => void
  onSkip?: () => void
  skipLabel?: string
}

export default function MontarCardapio({
  business,
  segments,
  onDone,
  onSkip,
  skipLabel = 'Pular por agora',
}: MontarCardapioProps) {
  const [catalogo, setCatalogo] = useState<MenuItemCatalogEntry[]>([])
  const [categorias, setCategorias] = useState<MenuCategory[]>([])
  const [selecionados, setSelecionados] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      const segmentIds = segments.map((s) => s.id)
      const [itens, catsResult] = await Promise.all([
        fetchCatalogBySegments(segmentIds),
        supabase!.from('menu_categories').select('*').eq('business_id', business.id).order('order_index'),
      ])
      if (!active) return
      setCatalogo(itens)
      setCategorias((catsResult.data as MenuCategory[]) ?? [])
      setLoading(false)
    }
    if (supabase && segments.length > 0) load()
    else setLoading(false)
    return () => {
      active = false
    }
  }, [business.id, segments])

  const porSegmento = useMemo(() => {
    const grupos = new Map<string, Map<string, MenuItemCatalogEntry[]>>()
    for (const item of catalogo) {
      const segmentoNome = segments.find((s) => s.id === item.segment_id)?.name ?? 'Outros'
      const categoria = item.category_hint ?? 'Outros'
      if (!grupos.has(segmentoNome)) grupos.set(segmentoNome, new Map())
      const porCategoria = grupos.get(segmentoNome)!
      if (!porCategoria.has(categoria)) porCategoria.set(categoria, [])
      porCategoria.get(categoria)!.push(item)
    }
    return grupos
  }, [catalogo, segments])

  function toggle(item: MenuItemCatalogEntry) {
    setSelecionados((prev) => {
      const next = { ...prev }
      if (item.id in next) {
        delete next[item.id]
      } else {
        next[item.id] = item.suggested_price != null ? String(item.suggested_price) : ''
      }
      return next
    })
  }

  function setPrice(id: string, price: string) {
    setSelecionados((prev) => ({ ...prev, [id]: price }))
  }

  const totalSelecionados = Object.keys(selecionados).length

  async function salvar() {
    setSalvando(true)
    const selections = Object.entries(selecionados).map(([catalogId, price]) => ({
      catalogId,
      price: Number(price) || 0,
    }))
    await publishCatalogSelections(business.id, catalogo, categorias, selections)
    setSalvando(false)
    onDone()
  }

  if (loading) {
    return <div className="text-white/50 text-sm text-center py-10">Carregando catálogo...</div>
  }

  if (catalogo.length === 0) {
    return (
      <div className="text-center py-10 space-y-4">
        <p className="text-white/50 text-sm">Ainda não temos sugestões prontas pra esse segmento.</p>
        <button onClick={onSkip ?? onDone} className="rounded-lg bg-brand text-white px-4 py-2 text-sm font-medium">
          Continuar
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <h1 className="text-xl font-semibold mb-1">Monte seu cardápio</h1>
      <p className="text-sm text-white/50 mb-6">
        Marque o que você vende e ajuste o preço — o resto você edita depois em Cardápio.
      </p>

      <div className="space-y-8">
        {Array.from(porSegmento.entries()).map(([segmentoNome, categoriasDoSegmento]) => (
          <section key={segmentoNome}>
            <h2 className="font-semibold text-brand mb-3">{segmentoNome}</h2>
            <div className="space-y-6">
              {Array.from(categoriasDoSegmento.entries()).map(([categoriaNome, itens]) => (
                <div key={categoriaNome}>
                  <h3 className="text-sm font-medium text-white/60 mb-2">{categoriaNome}</h3>
                  <div className="space-y-2">
                    {itens.map((item) => {
                      const marcado = item.id in selecionados
                      return (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer ${
                            marcado ? 'border-brand bg-brand/5' : 'border-white/10 bg-slate-900'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={() => toggle(item)}
                            className="shrink-0"
                          />
                          {item.image_url && (
                            <img src={item.image_url} alt="" className="w-10 h-10 rounded-md object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-white/40 truncate">{item.description}</p>
                            )}
                          </div>
                          {marcado && (
                            <input
                              value={selecionados[item.id]}
                              onChange={(e) => setPrice(item.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              type="number"
                              step="0.01"
                              placeholder="Preço"
                              className="w-24 border border-white/15 bg-slate-950 rounded-lg px-2 py-1 text-sm shrink-0"
                            />
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-white/10 p-4 flex items-center justify-between gap-3">
        <span className="text-sm text-white/60">{totalSelecionados} produtos selecionados</span>
        <div className="flex gap-2">
          {onSkip && (
            <button onClick={onSkip} className="text-sm text-white/50 px-3">
              {skipLabel}
            </button>
          )}
          <button
            onClick={salvar}
            disabled={totalSelecionados === 0 || salvando}
            className="rounded-lg bg-brand text-white px-5 py-2.5 text-sm font-medium disabled:opacity-40"
          >
            {salvando ? 'Salvando...' : 'Salvar e publicar'}
          </button>
        </div>
      </div>
    </div>
  )
}

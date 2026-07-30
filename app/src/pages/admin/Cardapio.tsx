import { useRef, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { fetchBusinessSegmentIds, fetchSegments } from '../../lib/catalog'
import { uploadMenuItemPhoto } from '../../lib/imagePipeline'
import { checkPlanFeature } from '../../lib/planFeatures'
import type { Business, MenuCategory, MenuItem, PlanFeatureRow, Segment } from '../../lib/types'
import ItemOptionsEditor from './ItemOptionsEditor'
import ItemPhotoModal from '../../components/admin/ItemPhotoModal'
import FichaTecnicaEditor from './FichaTecnicaEditor'
import MontarCardapio from './MontarCardapio'
import { progressoCardapio } from '../../lib/setupProgress'
import ProgressBar from '../../components/admin/ProgressBar'

interface CardapioAdminProps {
  business: Business
  planFeatures: PlanFeatureRow[]
}

interface CatalogSuggestion {
  id: string
  name: string
  description: string | null
  suggested_price: number | null
}

export default function CardapioAdmin({ business, planFeatures }: CardapioAdminProps) {
  const podeErp = checkPlanFeature(planFeatures, business, 'gestao_erp')
  const [itemComFichaAbertoId, setItemComFichaAbertoId] = useState<string | null>(null)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newItem, setNewItem] = useState({ category_id: '', name: '', description: '', price: '' })
  const [itemComOpcoesAbertoId, setItemComOpcoesAbertoId] = useState<string | null>(null)
  const [sugestoes, setSugestoes] = useState<CatalogSuggestion[]>([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [segmentosDoNegocio, setSegmentosDoNegocio] = useState<Segment[]>([])
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false)
  const [newItemPhotoFile, setNewItemPhotoFile] = useState<File | null>(null)
  const [newItemPhotoPreview, setNewItemPhotoPreview] = useState<string | null>(null)
  const [uploadingNewItemPhoto, setUploadingNewItemPhoto] = useState(false)
  const [newItemPhotoError, setNewItemPhotoError] = useState<string | null>(null)
  const [itemComFotoAbertoId, setItemComFotoAbertoId] = useState<string | null>(null)
  const [tentouSalvarItem, setTentouSalvarItem] = useState(false)
  const newItemPhotoInputRef = useRef<HTMLInputElement>(null)

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

  // Fase 2 do Smart Setup Validation: foto/nome/categoria/preço/descrição
  // passam a ser obrigatórios pra CRIAR um item novo (itens já cadastrados
  // sem foto não são bloqueados retroativamente, só aparecem na barra de
  // progresso do Cardápio).
  function camposFaltandoNovoItem(): string[] {
    const faltando: string[] = []
    if (!newItem.name.trim()) faltando.push('nome')
    if (!newItem.category_id) faltando.push('categoria')
    if (!(Number(newItem.price) > 0)) faltando.push('preço')
    if (!newItem.description.trim()) faltando.push('descrição')
    if (!newItemPhotoFile) faltando.push('foto')
    return faltando
  }
  const itemValido = camposFaltandoNovoItem().length === 0

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    setTentouSalvarItem(true)
    if (!supabase || !itemValido) return
    const name = newItem.name.trim()
    const price = Number(newItem.price) || 0
    const { data: novoItem, error } = await supabase
      .from('menu_items')
      .insert({
        business_id: business.id,
        category_id: newItem.category_id,
        name,
        description: newItem.description || null,
        price,
        order_index: items.filter((i) => i.category_id === newItem.category_id).length,
      })
      .select()
      .single()
    if (error || !novoItem) return

    if (newItemPhotoFile) {
      setUploadingNewItemPhoto(true)
      setNewItemPhotoError(null)
      try {
        const image_url = await uploadMenuItemPhoto(business.id, novoItem.id, newItemPhotoFile)
        const { error: photoUpdateError } = await supabase.from('menu_items').update({ image_url }).eq('id', novoItem.id)
        if (photoUpdateError) throw photoUpdateError
      } catch (err) {
        // item já foi criado; a foto pode ser adicionada depois pelo botão "Foto"
        setNewItemPhotoError(err instanceof Error ? err.message : 'Erro ao enviar a foto')
      } finally {
        setUploadingNewItemPhoto(false)
      }
    }

    registrarNoCatalogo(name, newItem.description.trim(), price, newItem.category_id)
    setNewItem({ category_id: newItem.category_id, name: '', description: '', price: '' })
    setSugestoes([])
    setNewItemPhotoFile(null)
    setNewItemPhotoPreview(null)
    setTentouSalvarItem(false)
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

  const progresso = progressoCardapio(items)

  return (
    <div className="space-y-8">
      <ProgressBar label="Cardápio" percentual={progresso.percentual} faltando={progresso.faltando} />

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
            className={`col-span-2 border bg-slate-900 rounded-lg px-3 py-2 text-sm ${
              tentouSalvarItem && !newItem.category_id ? 'border-red-500' : 'border-white/15'
            }`}
          >
            <option value="">Categoria...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {tentouSalvarItem && !newItem.category_id && (
            <p className="col-span-2 text-xs text-red-400 -mt-1">⚠️ Complete este campo para continuar.</p>
          )}
          <div className="col-span-2 relative">
            <input
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              onFocus={() => setMostrarSugestoes(true)}
              onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)}
              placeholder="Nome do item — comece a digitar pra ver sugestões"
              autoComplete="off"
              className={`w-full border bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30 ${
                tentouSalvarItem && !newItem.name.trim() ? 'border-red-500' : 'border-white/15'
              }`}
            />
            {tentouSalvarItem && !newItem.name.trim() && (
              <p className="text-xs text-red-400 mt-1">⚠️ Complete este campo para continuar.</p>
            )}
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

          <div
            className={`col-span-2 flex items-center gap-3 border bg-slate-900 rounded-lg px-3 py-2.5 ${
              tentouSalvarItem && !newItemPhotoFile ? 'border-red-500' : 'border-white/15'
            }`}
          >
            <div className="w-14 h-14 rounded-lg bg-slate-950 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {newItemPhotoPreview ? (
                <img src={newItemPhotoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl opacity-40">📷</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs text-white/40 mb-1">Foto do produto (obrigatória)</p>
              <input
                ref={newItemPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setNewItemPhotoFile(file)
                  setNewItemPhotoPreview(URL.createObjectURL(file))
                }}
              />
              <button
                type="button"
                onClick={() => newItemPhotoInputRef.current?.click()}
                className="text-xs text-brand font-medium"
              >
                {newItemPhotoPreview ? 'Trocar foto' : 'Adicionar Foto'}
              </button>
            </div>
          </div>
          {tentouSalvarItem && !newItemPhotoFile && (
            <p className="col-span-2 text-xs text-red-400 -mt-1">
              ⚠️ A foto do produto é obrigatória, pois melhora a experiência do cliente e aumenta as chances de venda.
            </p>
          )}

          <input
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            placeholder="Descrição"
            className={`col-span-2 border bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30 ${
              tentouSalvarItem && !newItem.description.trim() ? 'border-red-500' : 'border-white/15'
            }`}
          />
          {tentouSalvarItem && !newItem.description.trim() && (
            <p className="col-span-2 text-xs text-red-400 -mt-1">⚠️ Complete este campo para continuar.</p>
          )}
          <input
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            placeholder="Preço"
            type="number"
            step="0.01"
            className={`border bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30 ${
              tentouSalvarItem && !(Number(newItem.price) > 0) ? 'border-red-500' : 'border-white/15'
            }`}
          />
          <button
            disabled={uploadingNewItemPhoto}
            title={!itemValido ? 'Complete os requisitos mínimos para continuar.' : undefined}
            className="rounded-lg bg-brand text-white px-4 text-sm font-medium disabled:opacity-50"
          >
            {uploadingNewItemPhoto ? 'Enviando foto...' : 'Adicionar item'}
          </button>
          {tentouSalvarItem && !(Number(newItem.price) > 0) && (
            <p className="text-xs text-red-400 -mt-1">⚠️ Complete este campo para continuar.</p>
          )}
          {newItemPhotoError && (
            <p className="col-span-2 text-xs text-red-400">
              Item criado, mas a foto falhou: {newItemPhotoError}
            </p>
          )}
        </form>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-slate-900 border border-white/10 rounded-lg overflow-hidden">
              <div className="flex items-start gap-3 p-3">
                <button
                  onClick={() => setItemComFotoAbertoId(item.id)}
                  className="w-12 h-12 rounded-lg bg-slate-950 border border-white/10 flex items-center justify-center overflow-hidden shrink-0"
                  title="Foto do produto"
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm opacity-40">📷</span>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    {/* line-clamp-2: quebra em até 2 linhas antes de cortar — nome do
                        produto tem prioridade máxima, nunca trunca numa linha só. */}
                    <p className="font-medium text-sm leading-snug line-clamp-2 break-words">{item.name}</p>
                    <button
                      onClick={() => toggleAvailable(item)}
                      className={`shrink-0 text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                        item.is_available ? 'bg-green-500/15 text-green-400' : 'bg-white/10 text-white/40'
                      }`}
                    >
                      {item.is_available ? 'Disponível' : 'Indisponível'}
                    </button>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
                <button
                  onClick={() =>
                    setItemComOpcoesAbertoId(itemComOpcoesAbertoId === item.id ? null : item.id)
                  }
                  className="text-xs px-2.5 py-1.5 rounded-full bg-brand/10 text-brand font-medium"
                >
                  {itemComOpcoesAbertoId === item.id ? 'Fechar opções' : 'Opções'}
                </button>
                {podeErp && (
                  <button
                    onClick={() => setItemComFichaAbertoId(itemComFichaAbertoId === item.id ? null : item.id)}
                    className="text-xs px-2.5 py-1.5 rounded-full bg-brand/10 text-brand font-medium"
                  >
                    {itemComFichaAbertoId === item.id ? 'Fechar ficha' : 'Ficha técnica'}
                  </button>
                )}
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-xs px-2.5 py-1.5 rounded-full text-red-400 hover:bg-red-500/10 ml-auto"
                >
                  Excluir
                </button>
              </div>
              {itemComOpcoesAbertoId === item.id && <ItemOptionsEditor menuItemId={item.id} />}
              {itemComFichaAbertoId === item.id && (
                <FichaTecnicaEditor
                  businessId={business.id}
                  menuItem={item}
                  onUpdated={(updated) => setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {itemComFotoAbertoId && (
        <ItemPhotoModal
          businessId={business.id}
          item={items.find((i) => i.id === itemComFotoAbertoId)!}
          onClose={() => setItemComFotoAbertoId(null)}
          onUpdated={(updated) => {
            setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
          }}
        />
      )}
    </div>
  )
}

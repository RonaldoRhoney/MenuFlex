import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { getCurrentPosition } from '../../lib/geo'
import type { Business, BusinessType } from '../../lib/types'

interface OnboardingProps {
  ownerId: string
  onCreated: (business: Business) => void
}

function slugify(name: string) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const TIPOS: { value: BusinessType; label: string }[] = [
  { value: 'lanche_rua', label: 'Lanche de rua' },
  { value: 'bar', label: 'Bar' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'hamburgueria', label: 'Hamburgueria' },
  { value: 'outro', label: 'Outro' },
]

// De acordo com o tipo escolhido, busca no catálogo colaborativo
// (menu_item_catalog) as categorias mais relevantes pra já deixar o
// cardápio com uma sugestão inicial, em vez do dono começar do zero. Não
// é IA — é o mesmo dicionário compartilhado do autocomplete de itens.
const CATEGORIAS_POR_TIPO: Record<BusinessType, string[]> = {
  lanche_rua: ['Lanches', 'Salgados', 'Acompanhamentos', 'Bebidas'],
  hamburgueria: ['Lanches', 'Acompanhamentos', 'Bebidas'],
  bar: ['Salgados', 'Acompanhamentos', 'Bebidas'],
  restaurante: ['Salgados', 'Acompanhamentos', 'Bebidas', 'Sobremesas'],
  outro: ['Bebidas'],
}

export default function Onboarding({ ownerId, onCreated }: OnboardingProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<BusinessType>('lanche_rua')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleLocate() {
    setLocating(true)
    setError(null)
    try {
      const pos = await getCurrentPosition()
      setLat(pos.coords.latitude)
      setLng(pos.coords.longitude)
    } catch {
      setError('Não foi possível pegar sua localização — você pode continuar sem ela e ajustar depois.')
    } finally {
      setLocating(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSubmitting(true)
    setError(null)
    const slug = slugify(name)
    const { data, error: insertError } = await supabase
      .from('businesses')
      .insert({
        owner_id: ownerId,
        name,
        slug,
        type,
        plan: 'free',
        lat,
        lng,
      })
      .select()
      .single()
    setSubmitting(false)
    if (insertError || !data) {
      setError(
        insertError?.message.includes('duplicate')
          ? 'Já existe um negócio com esse nome — tente um nome um pouco diferente.'
          : insertError?.message ?? 'Não foi possível criar o negócio agora.',
      )
      return
    }
    await sugerirCardapioInicial(data as Business)
    onCreated(data as Business)
  }

  // Best-effort: se falhar, o negócio já foi criado e o dono cadastra na mão —
  // nunca bloqueia o cadastro por causa da sugestão.
  async function sugerirCardapioInicial(business: Business) {
    if (!supabase) return
    try {
      const hints = CATEGORIAS_POR_TIPO[business.type]
      const { data: catalogo } = await supabase
        .from('menu_item_catalog')
        .select('name, description, suggested_price, category_hint')
        .in('category_hint', hints)
        .order('usage_count', { ascending: false })

      if (!catalogo || catalogo.length === 0) return

      const categoriasEncontradas = hints.filter((h) => catalogo.some((i) => i.category_hint === h))
      const { data: categoriasCriadas } = await supabase
        .from('menu_categories')
        .insert(categoriasEncontradas.map((name, order_index) => ({ business_id: business.id, name, order_index })))
        .select()
      if (!categoriasCriadas) return

      const itensParaCriar = categoriasCriadas.flatMap((cat) =>
        catalogo
          .filter((i) => i.category_hint === cat.name)
          .slice(0, 4)
          .map((i, order_index) => ({
            business_id: business.id,
            category_id: cat.id,
            name: i.name,
            description: i.description,
            price: i.suggested_price ?? 0,
            order_index,
          })),
      )
      if (itensParaCriar.length > 0) {
        await supabase.from('menu_items').insert(itensParaCriar)
      }
    } catch {
      // sugestão é best-effort — negócio já existe, dono segue cadastrando na mão
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-10 bg-slate-950 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-center mb-2">Cadastre seu negócio</h1>

        <div>
          <label className="text-sm font-medium mb-1 block">Nome do negócio</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as BusinessType)}
            className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-white/40 mt-1">
            Já criamos categorias e alguns itens sugeridos com base no tipo — você edita, remove ou completa depois.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={handleLocate}
            disabled={locating}
            className="w-full rounded-lg border border-white/15 bg-slate-900 py-2 text-sm"
          >
            {locating ? 'Localizando...' : lat ? 'Localização capturada ✓' : 'Usar minha localização atual'}
          </button>
          <p className="text-xs text-white/40 mt-1">
            Usada para sugerir a instalação do app a clientes por perto (raio conforme seu plano).
          </p>
        </div>

        <p className="text-xs text-white/40">
          Você começa no plano Free — dá pra fazer upgrade depois em Configurações.
        </p>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand text-white py-2.5 font-medium disabled:opacity-50"
        >
          {submitting ? 'Criando...' : 'Criar negócio'}
        </button>
      </form>
    </div>
  )
}

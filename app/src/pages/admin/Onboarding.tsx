import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { getCurrentPosition } from '../../lib/geo'
import { fetchSegments, legacyTypeFromSegmentSlugs, saveBusinessSegments } from '../../lib/catalog'
import type { Business, Segment } from '../../lib/types'
import MontarCardapio from './MontarCardapio'

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

export default function Onboarding({ ownerId, onCreated }: OnboardingProps) {
  const [name, setName] = useState('')
  const [segments, setSegments] = useState<Segment[]>([])
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([])
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [createdBusiness, setCreatedBusiness] = useState<Business | null>(null)

  useEffect(() => {
    fetchSegments().then(setSegments)
  }, [])

  function toggleSegment(id: string) {
    setSelectedSegmentIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

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
    if (!supabase || selectedSegmentIds.length === 0) return
    setSubmitting(true)
    setError(null)
    const slug = slugify(name)
    const selectedSlugs = segments.filter((s) => selectedSegmentIds.includes(s.id)).map((s) => s.slug)
    const { data, error: insertError } = await supabase
      .from('businesses')
      .insert({
        owner_id: ownerId,
        name,
        slug,
        type: legacyTypeFromSegmentSlugs(selectedSlugs),
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
    await saveBusinessSegments(data.id, selectedSegmentIds)
    setCreatedBusiness(data as Business)
  }

  if (createdBusiness) {
    const segmentosDoNegocio = segments.filter((s) => selectedSegmentIds.includes(s.id))
    return (
      <div className="min-h-full bg-slate-950 text-white px-4 py-10">
        <MontarCardapio
          business={createdBusiness}
          segments={segmentosDoNegocio}
          onDone={() => onCreated(createdBusiness)}
          onSkip={() => onCreated(createdBusiness)}
        />
      </div>
    )
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
          <label className="text-sm font-medium mb-1 block">Segmentos (marque um ou mais)</label>
          <div className="flex flex-wrap gap-2">
            {segments.map((s) => {
              const marcado = selectedSegmentIds.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSegment(s.id)}
                  className={`text-sm rounded-full px-3 py-1.5 border ${
                    marcado ? 'bg-brand border-brand text-white' : 'border-white/15 bg-slate-900 text-white/70'
                  }`}
                >
                  {s.name}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-white/40 mt-1">
            Depois de criar, sugerimos produtos prontos com base nos segmentos escolhidos — você marca o que
            vende e ajusta o preço.
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
          disabled={submitting || selectedSegmentIds.length === 0}
          className="w-full rounded-lg bg-brand text-white py-2.5 font-medium disabled:opacity-50"
        >
          {submitting ? 'Criando...' : 'Criar negócio'}
        </button>
      </form>
    </div>
  )
}

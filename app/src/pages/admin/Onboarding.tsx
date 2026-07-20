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
    onCreated(data as Business)
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-center mb-2">Cadastre seu negócio</h1>

        <div>
          <label className="text-sm font-medium mb-1 block">Nome do negócio</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as BusinessType)}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            type="button"
            onClick={handleLocate}
            disabled={locating}
            className="w-full rounded-lg border border-neutral-300 py-2 text-sm"
          >
            {locating ? 'Localizando...' : lat ? 'Localização capturada ✓' : 'Usar minha localização atual'}
          </button>
          <p className="text-xs text-neutral-500 mt-1">
            Usada para sugerir a instalação do app a clientes por perto (raio conforme seu plano).
          </p>
        </div>

        <p className="text-xs text-neutral-500">
          Você começa no plano Free — dá pra fazer upgrade depois em Configurações.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

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

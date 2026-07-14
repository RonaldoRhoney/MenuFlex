import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { checkPlanFeature } from '../../lib/planFeatures'
import type { Business, PlanFeatureRow, Plan } from '../../lib/types'

interface ConfiguracoesProps {
  business: Business
  planFeatures: PlanFeatureRow[]
  onUpdated: (business: Business) => void
}

const PLANOS: { value: Plan; label: string; preco: string }[] = [
  { value: 'free', label: 'Free', preco: 'R$ 0' },
  { value: 'basico', label: 'Básico', preco: 'R$ 19,90/mês' },
  { value: 'premium', label: 'Premium', preco: 'R$ 39,90/mês' },
]

export default function Configuracoes({ business, planFeatures, onUpdated }: ConfiguracoesProps) {
  const [isOpen, setIsOpen] = useState(business.is_open)
  const [accentColor, setAccentColor] = useState(business.theme_config?.accent ?? '#16a34a')
  const [saving, setSaving] = useState(false)

  const podeIdentidade = checkPlanFeature(planFeatures, business.plan, 'identidade_completa')
  const podeLogo = checkPlanFeature(planFeatures, business.plan, 'logo_propria')

  async function toggleOpen() {
    if (!supabase) return
    const next = !isOpen
    setIsOpen(next)
    const { data } = await supabase.from('businesses').update({ is_open: next }).eq('id', business.id).select().single()
    if (data) onUpdated(data as Business)
  }

  async function saveTheme() {
    if (!supabase || !(podeLogo || podeIdentidade)) return
    setSaving(true)
    const { data } = await supabase
      .from('businesses')
      .update({ theme_config: { ...business.theme_config, accent: accentColor } })
      .eq('id', business.id)
      .select()
      .single()
    setSaving(false)
    if (data) onUpdated(data as Business)
  }

  return (
    <div className="space-y-8 max-w-md">
      <section>
        <h2 className="font-semibold mb-3">Status do negócio</h2>
        <button
          onClick={toggleOpen}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {isOpen ? 'Aberto — clique para fechar' : 'Fechado — clique para abrir'}
        </button>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Identidade visual</h2>
        {podeLogo || podeIdentidade ? (
          <div className="flex items-center gap-3">
            <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10" />
            <button onClick={saveTheme} disabled={saving} className="rounded-lg bg-brand text-white px-4 py-2 text-sm">
              {saving ? 'Salvando...' : 'Salvar cor'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            Disponível a partir do plano Básico (logo própria) / Premium (identidade completa).
          </p>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-3">Plano atual: {business.plan}</h2>
        <div className="space-y-2">
          {PLANOS.map((p) => (
            <div
              key={p.value}
              className={`flex justify-between items-center rounded-lg border px-3 py-2 text-sm ${
                business.plan === p.value ? 'border-brand bg-brand/5' : 'border-neutral-200'
              }`}
            >
              <span>{p.label}</span>
              <span className="text-neutral-500">{p.preco}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          Upgrade de plano fora do escopo desta fase (pagamento é feito no balcão/entrega).
        </p>
      </section>
    </div>
  )
}

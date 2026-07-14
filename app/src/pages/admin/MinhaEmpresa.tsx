import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { checkPlanFeature } from '../../lib/planFeatures'
import type { Business, BusinessType, PlanFeatureRow } from '../../lib/types'

interface MinhaEmpresaProps {
  business: Business
  planFeatures: PlanFeatureRow[]
  onUpdated: (business: Business) => void
}

const TIPOS: { value: BusinessType; label: string }[] = [
  { value: 'lanche_rua', label: 'Lanche de rua' },
  { value: 'bar', label: 'Bar' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'hamburgueria', label: 'Hamburgueria' },
  { value: 'outro', label: 'Outro' },
]

export default function MinhaEmpresa({ business, planFeatures, onUpdated }: MinhaEmpresaProps) {
  const [name, setName] = useState(business.name)
  const [type, setType] = useState<BusinessType>(business.type)
  const [description, setDescription] = useState(business.description ?? '')
  const [address, setAddress] = useState(business.address ?? '')
  const [phone, setPhone] = useState(business.phone ?? '')
  const [openingHours, setOpeningHours] = useState(business.opening_hours ?? '')
  const [accentColor, setAccentColor] = useState(business.theme_config?.accent ?? '#f97316')

  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Logo e identidade visual entram a partir de qualquer plano pago (Básico libera
  // logo própria; Premium libera identidade completa) — mesma feature já usada em
  // Configurações antes dessa tela existir.
  const podePersonalizar =
    checkPlanFeature(planFeatures, business.plan, 'logo_propria') ||
    checkPlanFeature(planFeatures, business.plan, 'identidade_completa')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    setError(null)
    setSavedOk(false)
    const { data, error: updateError } = await supabase
      .from('businesses')
      .update({
        name,
        type,
        description: description || null,
        address: address || null,
        phone: phone || null,
        opening_hours: openingHours || null,
        theme_config: podePersonalizar ? { ...business.theme_config, accent: accentColor } : business.theme_config,
      })
      .eq('id', business.id)
      .select()
      .single()
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    if (data) {
      onUpdated(data as Business)
      setSavedOk(true)
    }
  }

  async function handleLogoUpload(file: File) {
    if (!supabase || !podePersonalizar) return
    setUploadingLogo(true)
    setError(null)
    try {
      const ext = file.name.split('.').pop()
      const path = `${business.id}/logo-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('menu-images').upload(path, file, {
        upsert: true,
      })
      if (uploadError) throw uploadError
      const { data: publicUrl } = supabase.storage.from('menu-images').getPublicUrl(path)
      const { data, error: updateError } = await supabase
        .from('businesses')
        .update({ logo_url: publicUrl.publicUrl })
        .eq('id', business.id)
        .select()
        .single()
      if (updateError) throw updateError
      if (data) onUpdated(data as Business)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-md">
      <section>
        <h2 className="font-semibold mb-3">Logo do negócio</h2>
        {podePersonalizar ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden shrink-0">
              {business.logo_url ? (
                <img src={business.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-neutral-400">Sem logo</span>
              )}
            </div>
            <label className="text-sm text-brand-dark font-medium cursor-pointer">
              {uploadingLogo ? 'Enviando...' : 'Enviar logo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingLogo}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleLogoUpload(file)
                }}
              />
            </label>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            Disponível a partir do plano Básico — faça upgrade em Configurações para enviar sua logo.
          </p>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-3">Dados do negócio</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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
            <label className="text-sm font-medium mb-1 block">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Uma frase sobre o seu negócio para o cliente ver no cardápio"
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Endereço</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro"
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Telefone / WhatsApp</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Horário de funcionamento</label>
            <input
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="Ex: Ter a Dom, 18h às 23h"
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Cor de destaque</h2>
        {podePersonalizar ? (
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="w-10 h-10"
          />
        ) : (
          <p className="text-sm text-neutral-500">Disponível a partir do plano Básico.</p>
        )}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {savedOk && <p className="text-sm text-green-600">Dados salvos.</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-brand text-white py-2.5 font-medium disabled:opacity-50"
      >
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </form>
  )
}

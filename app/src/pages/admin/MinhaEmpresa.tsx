import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { checkPlanFeature } from '../../lib/planFeatures'
import { fetchBusinessSegmentIds, fetchSegments, saveBusinessSegments } from '../../lib/catalog'
import type { Business, BusinessType, PlanFeatureRow, Segment } from '../../lib/types'
import ShareButton from '../../components/ShareButton'
import { fetchMinhasIndicacoes, type ReferralStats } from '../../lib/referral'
import { DEFAULTS, type ThemeConfig } from '../../lib/theme'
import { progressoEmpresa } from '../../lib/setupProgress'
import ProgressBar from '../../components/admin/ProgressBar'

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
  const [neighborhood, setNeighborhood] = useState(business.neighborhood ?? '')
  const [phone, setPhone] = useState(business.phone ?? '')
  const [openingHours, setOpeningHours] = useState(business.opening_hours ?? '')
  const [city, setCity] = useState(business.city ?? '')
  const [state, setState] = useState(business.state ?? '')
  const [pixKey, setPixKey] = useState(business.pix_key ?? '')
  const [instagram, setInstagram] = useState(business.instagram ?? '')
  const [facebook, setFacebook] = useState(business.facebook ?? '')
  const [deliveryFee, setDeliveryFee] = useState(business.delivery_fee?.toString() ?? '')
  // migra o campo antigo "accent" (única cor que existia antes) pra "destaque",
  // sem perder a cor que o lojista já tinha configurado.
  const accentAntigo = (business.theme_config as ThemeConfig & { accent?: string })?.accent
  const [theme, setTheme] = useState<ThemeConfig>({
    ...DEFAULTS,
    ...(accentAntigo ? { destaque: accentAntigo } : {}),
    ...business.theme_config,
  })

  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [segments, setSegments] = useState<Segment[]>([])
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([])
  const [savingSegments, setSavingSegments] = useState(false)
  const [segmentsSavedOk, setSegmentsSavedOk] = useState(false)

  const [indicacoes, setIndicacoes] = useState<ReferralStats | null>(null)

  useEffect(() => {
    fetchSegments().then(setSegments)
    fetchBusinessSegmentIds(business.id).then(setSelectedSegmentIds)
    fetchMinhasIndicacoes(business.id).then(setIndicacoes)
  }, [business.id])

  function toggleSegment(id: string) {
    setSelectedSegmentIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
    setSegmentsSavedOk(false)
  }

  // Segmentos ficam numa tabela própria (business_segments), separada do resto
  // do formulário — salva independente pra não misturar com a atualização dos
  // dados básicos do negócio.
  async function handleSaveSegments() {
    if (!supabase || selectedSegmentIds.length === 0) return
    setSavingSegments(true)
    await supabase.from('business_segments').delete().eq('business_id', business.id)
    await saveBusinessSegments(business.id, selectedSegmentIds)
    setSavingSegments(false)
    setSegmentsSavedOk(true)
  }

  // Logo e identidade visual entram a partir de qualquer plano pago (Básico libera
  // logo própria; Premium libera identidade completa) — mesma feature já usada em
  // Configurações antes dessa tela existir.
  const podePersonalizar =
    checkPlanFeature(planFeatures, business, 'logo_propria') ||
    checkPlanFeature(planFeatures, business, 'identidade_completa')

  const temDelivery = checkPlanFeature(planFeatures, business, 'delivery')
  // Calculado sobre o estado local do formulário (não só o já salvo) — o %
  // sobe em tempo real conforme o lojista digita, antes mesmo de salvar.
  const progresso = progressoEmpresa(
    {
      ...business,
      name,
      address,
      city,
      state,
      phone,
      opening_hours: openingHours,
      description,
      delivery_fee: deliveryFee ? Number(deliveryFee) : null,
    },
    temDelivery,
  )

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    setError(null)
    setSavedOk(false)
    const { data, error: updateError } = await supabase
      .from('businesses')
      .update({
        name: name.trim(),
        type,
        description: description.trim() || null,
        address: address.trim() || null,
        neighborhood: neighborhood.trim() || null,
        phone: phone.trim() || null,
        opening_hours: openingHours.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        pix_key: pixKey.trim() || null,
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
        delivery_fee: deliveryFee ? Number(deliveryFee) : null,
        theme_config: podePersonalizar ? theme : business.theme_config,
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
      // sem upsert: o nome já é único (timestamp), sempre um insert puro —
      // upsert exigiria uma policy de select que não existia (ver migration 0019)
      const { error: uploadError } = await supabase.storage.from('menu-images').upload(path, file)
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
    <div className="space-y-8 max-w-md">
      <ProgressBar label="Configuração da empresa" percentual={progresso.percentual} faltando={progresso.faltando} />

      <section className="bg-slate-900 border border-white/10 rounded-xl p-4 animate-fade-in">
        <h2 className="font-semibold mb-1">Indique o MenuFlex</h2>
        <p className="text-sm text-white/50 mb-3">Convide outros comerciantes e ajude mais empresas a venderem online.</p>
        {indicacoes && (indicacoes.cliques > 0 || indicacoes.cadastros > 0) && (
          <p className="text-xs text-white/40 mb-3">
            {indicacoes.cliques} {indicacoes.cliques === 1 ? 'clique' : 'cliques'} · {indicacoes.cadastros}{' '}
            {indicacoes.cadastros === 1 ? 'cadastro gerado' : 'cadastros gerados'}
          </p>
        )}
        <ShareButton business={business} label="Compartilhar agora" />
      </section>

      <form onSubmit={handleSave} className="space-y-8">
      <section>
        <h2 className="font-semibold mb-3">Logo do negócio</h2>
        {podePersonalizar ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border border-white/10 bg-slate-950 flex items-center justify-center overflow-hidden shrink-0">
              {business.logo_url ? (
                <img src={business.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-white/40">Sem logo</span>
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
          <p className="text-sm text-white/40">
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
              className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as BusinessType)}
              className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
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
              className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Endereço</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro"
              className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Bairro</label>
            <input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Ex: Umarizal"
              className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
            />
            <p className="text-xs text-white/40 mt-1">Usado só pra estatística agregada de onde a RhoneyInc está presente.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Cidade</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Belém"
                className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Estado</label>
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Ex: PA"
                maxLength={2}
                className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30 uppercase"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Telefone / WhatsApp</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Horário de funcionamento</label>
            <input
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="Ex: Ter a Dom, 18h às 23h"
              className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
            />
          </div>
          {temDelivery && (
            <div>
              <label className="text-sm font-medium mb-1 block">Taxa de entrega (R$)</label>
              <input
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                type="number"
                step="0.01"
                placeholder="Ex: 5.00"
                className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-1 block">Chave PIX (opcional)</label>
            <input
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Instagram (opcional)</label>
              <input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@seunegocio"
                className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Facebook (opcional)</label>
              <input
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="facebook.com/seunegocio"
                className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Segmentos</h2>
        <p className="text-xs text-white/40 mb-3">
          Define quais sugestões de produto aparecem em "Cardápio &gt; Adicionar do catálogo".
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
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
        <button
          type="button"
          onClick={handleSaveSegments}
          disabled={savingSegments || selectedSegmentIds.length === 0}
          className="rounded-lg border border-white/15 bg-slate-900 px-4 py-2 text-sm disabled:opacity-50"
        >
          {savingSegments ? 'Salvando...' : 'Salvar segmentos'}
        </button>
        {segmentsSavedOk && <p className="text-sm text-green-400 mt-2">Segmentos salvos.</p>}
      </section>

      <section>
        <h2 className="font-semibold mb-1">Identidade visual do cardápio</h2>
        <p className="text-xs text-white/40 mb-3">
          Essas cores aparecem só no cardápio público do seu negócio — o painel administrativo continua com o visual padrão do MenuFlex.
        </p>
        {podePersonalizar ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {(
              [
                ['primaria', 'Principal (banner)'],
                ['secundaria', 'Secundária'],
                ['destaque', 'Destaque'],
                ['fundo', 'Fundo'],
                ['cards', 'Cards'],
                ['botoes', 'Botões'],
                ['textos', 'Textos'],
                ['precos', 'Preços'],
                ['icones', 'Ícones'],
                ['badges', 'Badges'],
                ['avisos', 'Avisos'],
                ['botao_compra', 'Botão de compra'],
              ] as [keyof ThemeConfig, string][]
            ).map(([chave, label]) => (
              <label key={chave} className="flex flex-col items-center gap-1">
                <input
                  type="color"
                  value={theme[chave] ?? DEFAULTS[chave]}
                  onChange={(e) => setTheme((t) => ({ ...t, [chave]: e.target.value }))}
                  className="w-10 h-10"
                />
                <span className="text-[11px] text-white/50 text-center">{label}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/40">Disponível a partir do plano Básico.</p>
        )}
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {savedOk && <p className="text-sm text-green-400">Dados salvos.</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-brand text-white py-2.5 font-medium disabled:opacity-50"
      >
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </button>
      </form>
    </div>
  )
}

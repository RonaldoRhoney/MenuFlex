import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { Business, PlanFeatureRow, WhatsappApiProvider, WhatsappConfig, WhatsappEventType } from '../../lib/types'
import { fetchWhatsappConfig, fetchWhatsappStats, getCardapioLink, isValidWhatsappNumber, saveWhatsappConfig } from '../../lib/whatsapp'
import EnviarCardapioModal from '../../components/admin/EnviarCardapioModal'
import ShareCardapioButton from '../../components/ShareCardapioButton'

interface CardapioWhatsappProps {
  business: Business
  planFeatures: PlanFeatureRow[]
}

const PROVEDORES: { value: WhatsappApiProvider; label: string; disponivel: boolean }[] = [
  { value: 'none', label: 'Nenhuma (envio manual via link)', disponivel: true },
  { value: 'meta_cloud', label: 'Meta Cloud API — em breve', disponivel: false },
  { value: 'evolution_api', label: 'Evolution API — em breve', disponivel: false },
  { value: 'z_api', label: 'Z-API — em breve', disponivel: false },
  { value: 'twilio', label: 'Twilio — em breve', disponivel: false },
  { value: 'baileys', label: 'Baileys — em breve', disponivel: false },
  { value: '360dialog', label: '360Dialog — em breve', disponivel: false },
]

export default function CardapioWhatsapp({ business }: CardapioWhatsappProps) {
  const [config, setConfig] = useState<WhatsappConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const [whatsappNumber, setWhatsappNumber] = useState(business.whatsapp_number ?? '')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [autoMessage, setAutoMessage] = useState('')
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  const [autoSendMenuEnabled, setAutoSendMenuEnabled] = useState(false)
  const [apiProvider, setApiProvider] = useState<WhatsappApiProvider>('none')
  const [serviceHoursNote, setServiceHoursNote] = useState('')

  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [enviarModalAberto, setEnviarModalAberto] = useState(false)
  const [stats, setStats] = useState<Record<WhatsappEventType, number> | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      const [cfg, statsData] = await Promise.all([fetchWhatsappConfig(business.id), fetchWhatsappStats(business.id)])
      if (!active) return
      setConfig(cfg)
      setStats(statsData)
      if (cfg) {
        setWelcomeMessage(cfg.welcome_message)
        setAutoMessage(cfg.auto_message)
        setAutoReplyEnabled(cfg.auto_reply_enabled)
        setAutoSendMenuEnabled(cfg.auto_send_menu_enabled)
        setApiProvider(cfg.api_provider)
        setServiceHoursNote(cfg.human_service_hours_note ?? '')
      } else {
        setWelcomeMessage('Olá! 👋 Bem-vindo(a) ao {{Nome do Estabelecimento}}. Como posso ajudar?')
        setAutoMessage('Confira nosso cardápio digital: {{link}}')
      }
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [business.id])

  const link = getCardapioLink(business)
  const numeroValido = whatsappNumber.trim() === '' || isValidWhatsappNumber(whatsappNumber)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase || !numeroValido) return
    setSaving(true)
    setError(null)
    setSavedOk(false)

    const { error: businessError } = await supabase
      .from('businesses')
      .update({ whatsapp_number: whatsappNumber || null })
      .eq('id', business.id)

    if (businessError) {
      setSaving(false)
      setError(businessError.message)
      return
    }

    try {
      await saveWhatsappConfig(business.id, {
        welcome_message: welcomeMessage,
        auto_message: autoMessage,
        auto_reply_enabled: autoReplyEnabled,
        auto_send_menu_enabled: autoSendMenuEnabled,
        api_provider: apiProvider,
        human_service_hours_note: serviceHoursNote || null,
      })
      setSavedOk(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  async function copiarLink() {
    await navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (loading) return <p className="text-sm text-white/40">Carregando...</p>

  return (
    <div className="space-y-8 max-w-md">
      <section className="bg-slate-900 border border-white/10 rounded-xl p-4">
        <h2 className="font-semibold mb-1">Link do seu cardápio</h2>
        <p className="text-sm text-white/50 mb-3">Compartilhe este link — o cliente monta o pedido e finaliza direto pelo WhatsApp.</p>
        <div className="flex items-center gap-2 mb-3">
          <input readOnly value={link} className="flex-1 border border-white/15 bg-slate-950 rounded-lg px-3 py-2 text-xs text-white/70" />
          <button onClick={copiarLink} className="rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-xs shrink-0">
            {copiado ? 'Copiado ✅' : 'Copiar'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setEnviarModalAberto(true)}
            className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2"
          >
            📤 Enviar Cardápio
          </button>
          <ShareCardapioButton business={business} className="rounded-lg border border-white/15 bg-slate-950 text-sm font-medium px-4 py-2" />
        </div>
      </section>

      {stats && (
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-white/40">Cardápios enviados</p>
            <p className="text-2xl font-semibold">{stats.click_send}</p>
          </div>
          <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-white/40">Cardápio compartilhado</p>
            <p className="text-2xl font-semibold">{stats.share_click}</p>
          </div>
        </section>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        <section>
          <h2 className="font-semibold mb-3">Número de WhatsApp do estabelecimento</h2>
          <input
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="(91) 99999-9999"
            className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
          />
          {!numeroValido && <p className="text-xs text-red-400 mt-1">Número inválido — informe DDD + número.</p>}
          <p className="text-xs text-white/40 mt-1">Usado para gerar os links de envio e o botão de confirmação de pedido via WhatsApp.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-3">Mensagens</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Mensagem de boas-vindas</label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={3}
                className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Mensagem automática (envio do cardápio)</label>
              <textarea
                value={autoMessage}
                onChange={(e) => setAutoMessage(e.target.value)}
                rows={2}
                className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
              />
              <p className="text-xs text-white/40 mt-1">
                Use <code>{'{{Nome do Estabelecimento}}'}</code> e <code>{'{{link}}'}</code> — são substituídos automaticamente.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-semibold mb-3">Horário de atendimento humano</h2>
          <input
            value={serviceHoursNote}
            onChange={(e) => setServiceHoursNote(e.target.value)}
            placeholder="Ex: atendimento humano até às 22h"
            className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-white/30"
          />
          <p className="text-xs text-white/40 mt-1">A agenda de aberto/fechado do cardápio já é controlada em Configurações — isto é só uma observação complementar.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-3">Automação</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-3 bg-slate-900 border border-white/10 rounded-lg px-3 py-2.5">
              <span className="text-sm">
                Envio automático do cardápio
                <span className="block text-xs text-white/40">Salva sua preferência — hoje o envio ainda é feito pelo botão "Enviar Cardápio".</span>
              </span>
              <input
                type="checkbox"
                checked={autoSendMenuEnabled}
                onChange={(e) => setAutoSendMenuEnabled(e.target.checked)}
                className="shrink-0 w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between gap-3 bg-slate-900 border border-white/10 rounded-lg px-3 py-2.5">
              <span className="text-sm">
                Resposta automática
                <span className="block text-xs text-white/40">🚧 Em breve — exige conectar um provedor de API abaixo.</span>
              </span>
              <input
                type="checkbox"
                checked={autoReplyEnabled}
                onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                className="shrink-0 w-5 h-5"
              />
            </label>
            <div>
              <label className="text-sm font-medium mb-1 block">API utilizada</label>
              <select
                value={apiProvider}
                onChange={(e) => setApiProvider(e.target.value as WhatsappApiProvider)}
                className="w-full border border-white/15 bg-slate-900 rounded-lg px-3 py-2 text-sm"
              >
                {PROVEDORES.map((p) => (
                  <option key={p.value} value={p.value} disabled={!p.disponivel}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {savedOk && <p className="text-sm text-green-400">Configuração salva.</p>}

        <button type="submit" disabled={saving || !numeroValido} className="w-full rounded-lg bg-brand text-white py-2.5 font-medium disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar configuração'}
        </button>
      </form>

      {enviarModalAberto && <EnviarCardapioModal business={business} config={config} onClose={() => setEnviarModalAberto(false)} />}
    </div>
  )
}

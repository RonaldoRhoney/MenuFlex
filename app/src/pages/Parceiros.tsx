import { useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import { submitReferral, buildWhatsAppFallbackUrl, buildMailtoFallbackUrl, type ReferralInput } from '../lib/referrals'

const COMISSAO = '30%' // percentual de exemplo — ajustar conforme regra de negócio combinada

export default function Parceiros() {
  const [form, setForm] = useState<ReferralInput>({
    referrerName: '',
    referrerPhone: '',
    businessName: '',
    businessPhone: '',
    businessCity: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'offline'>('idle')
  const [error, setError] = useState<string | null>(null)

  function setField<K extends keyof ReferralInput>(key: K, value: ReferralInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStatus('sending')
    try {
      await submitReferral(form)
      setStatus('sent')
    } catch (err) {
      if (err instanceof Error && err.message === 'DB_NOT_READY') {
        setStatus('offline')
        return
      }
      setError(err instanceof Error ? err.message : 'Erro ao enviar indicação')
      setStatus('idle')
    }
  }

  const whatsappUrl = buildWhatsAppFallbackUrl(form)
  const mailtoUrl = buildMailtoFallbackUrl(form)
  const formValido =
    form.referrerName.trim() && form.referrerPhone.trim() && form.businessName.trim() && form.businessPhone.trim()

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 bg-slate-950 text-white">
        <nav className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-bold">M</span>
            <span className="font-semibold">MenuFlex</span>
          </Link>
          <Link to="/" className="text-sm text-white/70 hover:text-white">
            ← Voltar
          </Link>
        </nav>

        <div className="max-w-3xl mx-auto px-4 pt-10 pb-16 text-center">
          <span className="inline-block font-mono text-xs uppercase tracking-wider bg-brand/15 text-brand px-3 py-1 rounded-full mb-5">
            Programa de indicação
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
            Conhece um negócio que vai amar o MenuFlex? <span className="text-brand">Indique e ganhe.</span>
          </h1>
          <p className="text-white/60 max-w-xl mx-auto mb-2">
            Indique um lanche de rua, bar, restaurante ou hamburgueria — se o negócio assinar um
            plano pago (Básico ou Premium), você recebe <strong className="text-white">{COMISSAO} de comissão</strong> sobre
            o primeiro pagamento.
          </p>
          <p className="text-white/40 text-sm max-w-xl mx-auto">
            Sem limite de indicações. O pagamento da comissão é combinado diretamente com a RhoneyInc.
          </p>
        </div>

        <div className="max-w-md mx-auto px-4 pb-20">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            {status === 'sent' ? (
              <div className="text-center py-6">
                <p className="font-semibold mb-1">Indicação enviada!</p>
                <p className="text-sm text-white/60">
                  Vamos entrar em contato com {form.businessName} em breve. Obrigado por indicar!
                </p>
              </div>
            ) : status === 'offline' ? (
              <div className="text-center py-4">
                <p className="font-semibold mb-2">Ainda não estamos recebendo indicações pelo site.</p>
                <p className="text-sm text-white/60 mb-4">Mas você já pode nos mandar os dados direto:</p>
                <div className="flex flex-col gap-2">
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-brand text-white py-2.5 font-medium text-sm"
                    >
                      Enviar pelo WhatsApp
                    </a>
                  )}
                  <a
                    href={mailtoUrl}
                    className="rounded-lg border border-white/20 text-white py-2.5 font-medium text-sm"
                  >
                    Enviar por e-mail
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Seu nome</label>
                  <input
                    required
                    value={form.referrerName}
                    onChange={(e) => setField('referrerName', e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Seu WhatsApp</label>
                  <input
                    required
                    value={form.referrerPhone}
                    onChange={(e) => setField('referrerPhone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Nome do negócio indicado</label>
                  <input
                    required
                    value={form.businessName}
                    onChange={(e) => setField('businessName', e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Contato do negócio</label>
                  <input
                    required
                    value={form.businessPhone}
                    onChange={(e) => setField('businessPhone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Cidade</label>
                  <input
                    value={form.businessCity}
                    onChange={(e) => setField('businessCity', e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm"
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={!formValido || status === 'sending'}
                  className="w-full rounded-lg bg-brand text-white py-2.5 font-medium disabled:opacity-40 mt-2"
                >
                  {status === 'sending' ? 'Enviando...' : 'Enviar indicação'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

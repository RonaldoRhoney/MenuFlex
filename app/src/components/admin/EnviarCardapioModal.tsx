import { useState } from 'react'
import type { Business, WhatsappConfig } from '../../lib/types'
import { buildWaMeLink, getCardapioLink, isValidWhatsappNumber, substituirPlaceholders, trackWhatsappEvent } from '../../lib/whatsapp'

interface EnviarCardapioModalProps {
  business: Business
  config: WhatsappConfig | null
  onClose: () => void
}

export default function EnviarCardapioModal({ business, config, onClose }: EnviarCardapioModalProps) {
  const [numero, setNumero] = useState('')

  const link = getCardapioLink(business)
  const mensagemBase = config?.auto_message ?? 'Confira nosso cardápio digital: {{link}}'
  const mensagem = substituirPlaceholders(mensagemBase, business, link)
  const numeroValido = numero.trim().length > 0 && isValidWhatsappNumber(numero)

  function handleEnviar() {
    if (!numeroValido) return
    const url = buildWaMeLink(numero, mensagem)
    window.open(url, '_blank', 'noopener,noreferrer')
    trackWhatsappEvent(business.id, 'click_send').catch(() => {})
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Enviar Cardápio"
    >
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-5 animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display font-semibold text-lg">📤 Enviar Cardápio</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-white/40 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>
        <p className="text-sm text-white/50 mb-4">Informe o WhatsApp do cliente para abrir a conversa com o cardápio pronto.</p>

        <label className="text-sm font-medium mb-1 block">Número do WhatsApp do cliente</label>
        <input
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="(91) 99999-9999"
          className="w-full border border-white/15 bg-slate-950 rounded-lg px-3 py-2 text-sm placeholder:text-white/30 mb-4"
        />

        <div className="bg-slate-950 border border-white/10 rounded-lg p-3 mb-4">
          <p className="text-xs text-white/40 mb-1">Prévia da mensagem:</p>
          <p className="text-sm whitespace-pre-wrap">{mensagem}</p>
        </div>

        <button
          onClick={handleEnviar}
          disabled={!numeroValido}
          className="w-full rounded-lg bg-emerald-600 text-white py-2.5 font-medium disabled:opacity-40"
        >
          Abrir WhatsApp
        </button>
      </div>
    </div>
  )
}

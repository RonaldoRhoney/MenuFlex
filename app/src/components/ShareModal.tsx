import { useState } from 'react'
import { trackShareEvent } from '../lib/referral'

interface ShareModalProps {
  link: string
  onClose: () => void
}

const MENSAGEM_WHATSAPP =
  '🍽️ Estou utilizando o MenuFlex para gerenciar meu cardápio digital e facilitar os pedidos dos meus clientes.\n\nSe você possui restaurante, pizzaria, lanchonete, cafeteria, food truck ou qualquer outro negócio, vale muito a pena conhecer.\n\n🚀 Crie seu cardápio digital gratuitamente:'
const MENSAGEM_LINKEDIN =
  'Conheça o MenuFlex.\n\nUma plataforma moderna para criação de cardápios digitais, pedidos online e gestão inteligente para restaurantes e empresas de alimentação.'
const MENSAGEM_X = 'Conheça o MenuFlex.\n\nA forma mais moderna de criar cardápios digitais.'
const ASSUNTO_EMAIL = 'Conheça o MenuFlex'
const MENSAGEM_EMAIL =
  'Olá!\n\nEstou utilizando o MenuFlex para criar meu cardápio digital e gostei bastante.\n\nAchei que poderia ser útil para o seu negócio também.\n\nConfira:'

export default function ShareModal({ link, onClose }: ShareModalProps) {
  const [copiado, setCopiado] = useState(false)

  function abrir(url: string, evento: string) {
    trackShareEvent(evento)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function copiarLink() {
    await navigator.clipboard.writeText(link)
    trackShareEvent('share_copy')
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(link)}`

  const canais = [
    {
      nome: 'WhatsApp',
      emoji: '💬',
      cor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      onClick: () => abrir(`https://wa.me/?text=${encodeURIComponent(`${MENSAGEM_WHATSAPP}\n\n${link}`)}`, 'share_whatsapp'),
    },
    {
      nome: 'Facebook',
      emoji: '📘',
      cor: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
      onClick: () => abrir(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, 'share_facebook'),
    },
    {
      nome: 'LinkedIn',
      emoji: '💼',
      cor: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
      onClick: () =>
        abrir(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}&summary=${encodeURIComponent(MENSAGEM_LINKEDIN)}`, 'share_linkedin'),
    },
    {
      nome: 'X (Twitter)',
      emoji: '✖️',
      cor: 'bg-white/10 border-white/25 text-white/80',
      onClick: () => abrir(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${MENSAGEM_X}\n\n${link}`)}`, 'share_twitter'),
    },
    {
      nome: 'Telegram',
      emoji: '✈️',
      cor: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
      onClick: () => abrir(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(MENSAGEM_WHATSAPP)}`, 'share_telegram'),
    },
    {
      nome: 'E-mail',
      emoji: '✉️',
      cor: 'bg-white/10 border-white/25 text-white/80',
      onClick: () =>
        abrir(`mailto:?subject=${encodeURIComponent(ASSUNTO_EMAIL)}&body=${encodeURIComponent(`${MENSAGEM_EMAIL}\n\n${link}`)}`, 'share_email'),
    },
    {
      nome: 'Instagram',
      emoji: '📸',
      cor: 'bg-pink-500/10 border-pink-500/30 text-pink-300',
      // Instagram não tem API de compartilhamento de link direto — copia o
      // link e orienta o usuário a colar no story/bio, único caminho real.
      onClick: () => {
        copiarLink()
        trackShareEvent('share_instagram')
      },
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Compartilhe o MenuFlex"
    >
      <div
        className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-5 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display font-semibold text-lg">Compartilhe o MenuFlex</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-white/40 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>
        <p className="text-sm text-white/50 mb-4">Ajude outros comerciantes a modernizar seus negócios.</p>

        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {canais.map((c) => (
            <button
              key={c.nome}
              onClick={c.onClick}
              title={c.nome}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs transition-transform active:scale-90 hover:-translate-y-0.5 ${c.cor}`}
            >
              <span className="text-lg">{c.emoji}</span>
              <span className="truncate w-full text-center">{c.nome}</span>
            </button>
          ))}
        </div>

        <button
          onClick={copiarLink}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-slate-950 py-2.5 text-sm font-medium mb-4 transition-transform active:scale-95"
        >
          📋 {copiado ? 'Link copiado com sucesso ✅' : 'Copiar link'}
        </button>

        <div className="flex flex-col items-center gap-2 pt-3 border-t border-white/10">
          <img src={qrUrl} alt="QR Code do MenuFlex" width={140} height={140} className="rounded-lg bg-white p-2" />
          <a
            href={qrUrl}
            download="menuflex-qrcode.png"
            target="_blank"
            rel="noreferrer"
            onClick={() => trackShareEvent('share_qrcode')}
            className="text-xs text-white/50 underline"
          >
            Baixar QR Code
          </a>
        </div>
      </div>
    </div>
  )
}

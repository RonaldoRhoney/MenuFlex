import { useState } from 'react'
import type { Business } from '../lib/types'
import { getReferralLink, trackShareEvent } from '../lib/referral'
import ShareModal from './ShareModal'

interface ShareButtonProps {
  business: Business
  className?: string
  label?: string
}

// Prioridade de compartilhamento (nunca deixa o botão sem ação):
// 1. Web Share API nativa (Android/iPhone) — se o navegador suportar.
// 2. Modal próprio com link/QR/redes — fallback pra desktop.
export default function ShareButton({ business, className, label = '📤 Compartilhar MenuFlex' }: ShareButtonProps) {
  const [modalAberto, setModalAberto] = useState(false)
  const link = getReferralLink(business)

  async function compartilhar() {
    trackShareEvent('share_open')
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MenuFlex',
          text: 'Quero fazer um convite especial: conheça o MenuFlex — uma experiência simples e elegante para digitalizar seu cardápio e vender mais. Baixe o app e veja com seus próprios olhos.',
          url: link,
        })
        trackShareEvent('share_success')
      } catch {
        trackShareEvent('share_cancel')
      }
      return
    }
    setModalAberto(true)
  }

  return (
    <>
      <button
        onClick={compartilhar}
        className={className ?? 'rounded-full bg-brand text-white text-sm font-medium px-4 py-2 transition-transform active:scale-95 hover:bg-brand-dark'}
      >
        {label}
      </button>
      {modalAberto && <ShareModal link={link} onClose={() => setModalAberto(false)} />}
    </>
  )
}

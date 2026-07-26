import type { Business } from '../lib/types'
import { getCardapioLink, trackWhatsappEvent } from '../lib/whatsapp'
import ShareButton from './ShareButton'

interface ShareCardapioButtonProps {
  business: Business
  className?: string
  label?: string
}

const MENSAGEM_WHATSAPP = 'Olá! 😊 Confira nosso cardápio digital e monte seu pedido:'
const ASSUNTO_EMAIL = 'Nosso cardápio digital'
const MENSAGEM_EMAIL = 'Olá!\n\nSegue nosso cardápio digital — escolha seus produtos e envie seu pedido diretamente por lá.\n\nSerá um prazer atendê-lo(a)!'

// Compartilha o link do CARDÁPIO da loja (/loja/:slug) — não confundir com
// o ShareButton padrão, que compartilha o link de indicação da plataforma
// MenuFlex para outros comerciantes ("Indique o MenuFlex").
export default function ShareCardapioButton({ business, className, label = '📤 Compartilhar Cardápio' }: ShareCardapioButtonProps) {
  const link = getCardapioLink(business)

  return (
    <ShareButton
      business={business}
      className={className}
      label={label}
      link={link}
      nativeShareTitle={business.name}
      nativeShareText={`${MENSAGEM_WHATSAPP} ${business.name}`}
      modalTitulo="Compartilhar Cardápio"
      modalSubtitulo="Envie o cardápio digital para seus clientes."
      modalMensagens={{
        whatsapp: MENSAGEM_WHATSAPP,
        telegram: MENSAGEM_WHATSAPP,
        facebook: `${MENSAGEM_WHATSAPP} ${business.name}`,
        linkedin: `${MENSAGEM_WHATSAPP} ${business.name}`,
        x: `${MENSAGEM_WHATSAPP} ${business.name}`,
        emailAssunto: ASSUNTO_EMAIL,
        emailCorpo: MENSAGEM_EMAIL,
      }}
      modalQrAltText={`QR Code do cardápio de ${business.name}`}
      modalQrDownloadName={`cardapio-${business.slug}-qrcode.png`}
      eventoAbrir="share_cardapio_open"
      onShareOpen={() => trackWhatsappEvent(business.id, 'share_click').catch(() => {})}
    />
  )
}

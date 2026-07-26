// Prévia de link (WhatsApp/Facebook/Telegram/LinkedIn/etc.) por loja.
// A SPA é estática — index.html tem tags og: fixas, então crawlers (que não
// executam JS) sempre viam a marca genérica "MenuFlex" em vez do nome/logo
// da loja. Este middleware roda antes do rewrite pro index.html e, só para
// bots conhecidos, responde com um HTML mínimo com as tags og: corretas.
// Fail-open: qualquer erro/ausência de dado cai no `return` vazio, que
// deixa o fluxo normal (SPA) seguir intocado para todo mundo.
export const config = { matcher: '/loja/:slug*' }

const BOT_UA = /(whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|skypeuripreview)/i

export default async function middleware(request) {
  try {
    const ua = request.headers.get('user-agent') || ''
    if (!BOT_UA.test(ua)) return

    const url = new URL(request.url)
    const slug = url.pathname.split('/loja/')[1]?.split('/')[0]
    if (!slug) return

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/businesses?slug=eq.${encodeURIComponent(slug)}&select=name,description,logo_url`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
    )
    if (!res.ok) return
    const [business] = await res.json()
    if (!business) return

    const title = escapeHtml(business.name)
    const description = escapeHtml(business.description || 'Cardápio digital — monte seu pedido e finalize pelo WhatsApp.')
    const image = business.logo_url || 'https://menuflex.rhoneyinc.com/icons/icon-512.png'

    const html = `<!doctype html><html><head>
<meta charset="utf-8">
<title>${title}</title>
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:url" content="${url.origin}${url.pathname}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
</head><body></body></html>`

    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
  } catch {
    return
  }
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

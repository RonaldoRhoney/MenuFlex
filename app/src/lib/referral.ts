import { supabase } from './supabaseClient'
import type { Business } from './types'

export const SITE_URL = 'https://menuflex.rhoneyinc.com'
const REF_STORAGE_KEY = 'menuflex_ref'

export function getReferralLink(business: Business): string {
  return `${SITE_URL}/?ref=${business.id}`
}

// Analytics de compartilhamento — só dispara se o script já estiver carregado
// na página (nenhum dos três está configurado no MenuFlex hoje; isso é só o
// "gancho" pronto pra quando alguém configurar GA/Meta Pixel/TikTok Pixel).
export function trackShareEvent(evento: string) {
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    ttq?: { track: (name: string) => void }
  }
  w.gtag?.('event', evento)
  w.fbq?.('trackCustom', evento)
  w.ttq?.track(evento)
}

// Chamado quando alguém abre a home com ?ref=<business_id> — guarda em
// localStorage (sobrevive à navegação até o cadastro) e registra o clique
// via function serverless (nunca insert direto do cliente, ver 0016).
export function capturarIndicacao(refBusinessId: string | null) {
  if (!refBusinessId) return
  localStorage.setItem(REF_STORAGE_KEY, refBusinessId)
  fetch('/api/track-referral', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'click', referrer_business_id: refBusinessId }),
  }).catch(() => {})
}

// Chamado logo após um novo negócio ser criado (Onboarding.tsx) — se havia
// uma indicação guardada, registra o cadastro e limpa, pra não contar de novo.
export async function registrarCadastroIndicado(novoBusinessId: string) {
  const refBusinessId = localStorage.getItem(REF_STORAGE_KEY)
  if (!refBusinessId || !supabase) return
  localStorage.removeItem(REF_STORAGE_KEY)

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return

  fetch('/api/track-referral', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type: 'signup', referrer_business_id: refBusinessId, referred_business_id: novoBusinessId }),
  }).catch(() => {})
}

export interface ReferralStats {
  cliques: number
  cadastros: number
}

export async function fetchMinhasIndicacoes(businessId: string): Promise<ReferralStats> {
  if (!supabase) return { cliques: 0, cadastros: 0 }
  const [cliques, cadastros] = await Promise.all([
    supabase.from('referral_events').select('id', { count: 'exact', head: true }).eq('referrer_business_id', businessId).eq('event_type', 'click'),
    supabase.from('referral_events').select('id', { count: 'exact', head: true }).eq('referrer_business_id', businessId).eq('event_type', 'signup'),
  ])
  return { cliques: cliques.count ?? 0, cadastros: cadastros.count ?? 0 }
}

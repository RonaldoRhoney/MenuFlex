import { supabase } from './supabaseClient'
import type { Business, Plan } from './types'

// Fluxo de dinheiro: cliente paga via Checkout Pro do Mercado Pago (PIX, boleto ou
// cartão) → valor cai na conta Mercado Pago de rhoneyinc@gmail.com → saque via PIX
// pra conta Nubank do mesmo e-mail. O front nunca fala direto com o Mercado Pago:
// o access token da API é secreto e só pode viver no servidor.
export const PLAN_PRICES: Record<Exclude<Plan, 'free'>, number> = {
  basico: 19.9,
  premium: 39.9,
}

// Endpoint de uma função serverless (Vercel/Supabase Edge Function) ainda não criada —
// ela é quem, com o access token do Mercado Pago, cria a "preference" de pagamento e
// devolve a URL de checkout. Sem VITE_CHECKOUT_API_URL configurada, o upgrade fica
// indisponível (mostra aviso) em vez de quebrar a tela.
const CHECKOUT_API_URL = import.meta.env.VITE_CHECKOUT_API_URL as string | undefined

export const CHECKOUT_READY = Boolean(CHECKOUT_API_URL)

export async function startPlanUpgrade(business: Business, plan: Exclude<Plan, 'free'>): Promise<string> {
  if (!CHECKOUT_API_URL) {
    throw new Error(
      'Upgrade de plano ainda não está disponível — o checkout do Mercado Pago será ligado quando o backend estiver no ar.',
    )
  }

  const response = await fetch(CHECKOUT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      business_id: business.id,
      plan,
      amount: PLAN_PRICES[plan],
    }),
  })

  if (!response.ok) throw new Error('Não foi possível iniciar o pagamento. Tente novamente em instantes.')

  const { checkout_url } = await response.json()
  return checkout_url as string
}

export async function loadPlanPayments(businessId: string) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('plan_payments')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

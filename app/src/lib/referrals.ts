import { supabase, DB_READY } from './supabaseClient'

export interface ReferralInput {
  referrerName: string
  referrerPhone: string
  businessName: string
  businessPhone: string
  businessCity: string
}

// Número real da RhoneyInc ainda não definido — sem essa env var, a página /parceiros
// usa só o fallback de e-mail (mailto), nunca inventa um número de WhatsApp.
const REFERRAL_WHATSAPP = import.meta.env.VITE_REFERRAL_WHATSAPP as string | undefined

export function buildWhatsAppFallbackUrl(input: ReferralInput): string | null {
  if (!REFERRAL_WHATSAPP) return null
  const text = `Quero indicar um negócio pro MenuFlex!\nMeu nome: ${input.referrerName}\nMeu WhatsApp: ${input.referrerPhone}\nNegócio indicado: ${input.businessName}\nContato do negócio: ${input.businessPhone}\nCidade: ${input.businessCity}`
  return `https://wa.me/${REFERRAL_WHATSAPP}?text=${encodeURIComponent(text)}`
}

export function buildMailtoFallbackUrl(input: ReferralInput) {
  const subject = 'Indicação de parceiro — MenuFlex'
  const body = `Meu nome: ${input.referrerName}\nMeu WhatsApp: ${input.referrerPhone}\nNegócio indicado: ${input.businessName}\nContato do negócio: ${input.businessPhone}\nCidade: ${input.businessCity}`
  return `mailto:rhoneyinc@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export async function submitReferral(input: ReferralInput): Promise<void> {
  if (!DB_READY) {
    throw new Error('DB_NOT_READY')
  }
  const { error } = await supabase!.from('partner_referrals').insert({
    referrer_name: input.referrerName,
    referrer_phone: input.referrerPhone,
    business_name: input.businessName,
    business_phone: input.businessPhone,
    business_city: input.businessCity || null,
  })
  if (error) throw error
}

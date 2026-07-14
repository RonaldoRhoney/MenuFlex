import { supabase } from './supabaseClient'

export async function logConsent(consentType: string, granted: boolean, businessId?: string) {
  if (!supabase) return
  await supabase.from('consent_logs').insert({
    consent_type: consentType,
    granted,
    business_id: businessId ?? null,
  })
}

export async function requestDataDeletion(contactEmail: string, contactPhone: string, details: string) {
  if (!supabase) return
  const { error } = await supabase.from('data_deletion_requests').insert({
    contact_email: contactEmail || null,
    contact_phone: contactPhone || null,
    details: details || null,
  })
  if (error) throw error
}

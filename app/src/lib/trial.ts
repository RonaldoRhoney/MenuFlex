import { supabase } from './supabaseClient'

export interface TrialInfo {
  started_at: string
  ends_at: string
}

export async function fetchTrial(businessId: string): Promise<TrialInfo | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('trial_periods')
    .select('started_at, ends_at')
    .eq('business_id', businessId)
    .maybeSingle()
  return (data as TrialInfo) ?? null
}

export function isTrialAtivo(trial: TrialInfo | null | undefined): boolean {
  return !!trial && new Date(trial.ends_at) > new Date()
}

export function diasRestantes(trial: TrialInfo): number {
  const ms = new Date(trial.ends_at).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

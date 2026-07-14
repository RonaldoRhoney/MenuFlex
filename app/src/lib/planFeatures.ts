import { supabase } from './supabaseClient'
import type { Plan, PlanFeatureRow } from './types'

let cache: PlanFeatureRow[] | null = null

// Espelha check_plan_feature() do banco para liberar/esconder UI sem round-trip.
// A checagem que realmente vale é sempre a do banco (RLS + create_order()) —
// isto aqui é só para não mostrar botões que o backend vai recusar.
export async function loadPlanFeatures(): Promise<PlanFeatureRow[]> {
  if (cache) return cache
  if (!supabase) return []
  const { data, error } = await supabase.from('plan_features').select('*')
  if (error) throw error
  cache = data as PlanFeatureRow[]
  return cache
}

export function checkPlanFeature(features: PlanFeatureRow[], plan: Plan, featureKey: string): boolean {
  return features.some((f) => f.plan === plan && f.feature_key === featureKey && f.enabled)
}

export function getPlanUsageLimit(features: PlanFeatureRow[], plan: Plan, featureKey: string): number | null {
  const row = features.find((f) => f.plan === plan && f.feature_key === featureKey)
  return row?.usage_limit ?? null
}

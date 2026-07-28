import { supabase } from './supabaseClient'
import type { Business, PlanFeatureRow } from './types'
import { isTrialAtivo } from './trial'

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

// Trial ativo libera tudo, igual ao check_plan_feature() do banco
// (0022_smart_trial.sql) — mesmo espelho client-side, mesma regra.
export function checkPlanFeature(features: PlanFeatureRow[], business: Business, featureKey: string): boolean {
  if (isTrialAtivo(business.trial)) return true
  return features.some((f) => f.plan === business.plan && f.feature_key === featureKey && f.enabled)
}

// Sem override de trial aqui: usage_limit também guarda valores de
// configuração (ex.: raio em metros de instalacao_proximidade), não só tetos
// de contagem — "ilimitado" não faz sentido pra todo featureKey que usa isso.
export function getPlanUsageLimit(features: PlanFeatureRow[], business: Business, featureKey: string): number | null {
  const row = features.find((f) => f.plan === business.plan && f.feature_key === featureKey)
  return row?.usage_limit ?? null
}

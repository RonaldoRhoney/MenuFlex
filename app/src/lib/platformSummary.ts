import { supabase } from './supabaseClient'

export interface UsuarioPlataforma {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  role: string | null
  business_name: string | null
  business_slug: string | null
  business_plan: string | null
  completou_cadastro: boolean
}

export interface PlatformSummary {
  total_geral: number
  total_7d: number
  total_30d: number
  total_usuarios: number
  total_negocios: number
  dispositivos: { label: string; total: number }[]
  navegadores: { label: string; total: number }[]
  paises: { label: string; total: number }[]
  cidades: { label: string; total: number }[]
  bairros: { label: string; total: number }[]
  por_dia: { dia: string; total: number }[]
  usuarios: UsuarioPlataforma[]
  usuarios_resumo: { total: number; completos: number; pendentes: number }
  cadastros_por_dia: { dia: string; total: number }[]
  financeiro: {
    mrr_estimado: number
    negocios_por_plano: { free: number; basico: number; premium: number }
    pagamentos_por_status: { pending: number; approved: number; rejected: number }
    receita_aprovada_total: number
    receita_aprovada_30d: number
  }
  operacional: {
    pedidos_hoje: number
    pedidos_7d: number
    pedidos_30d: number
    ticket_medio_30d: number
    pedidos_por_status_30d: Record<string, number>
  }
}

export async function fetchPlatformSummary(): Promise<{ data: PlatformSummary | null; error: string | null }> {
  if (!supabase) return { data: null, error: 'Supabase não configurado.' }
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return { data: null, error: 'Sessão inválida.' }

  try {
    const resp = await fetch('/api/platform-summary', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const json = await resp.json()
    if (!resp.ok) return { data: null, error: json.error || 'Erro desconhecido.' }
    return { data: json as PlatformSummary, error: null }
  } catch {
    return { data: null, error: 'Não foi possível carregar as métricas agora.' }
  }
}

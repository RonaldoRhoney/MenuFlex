import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import BarChart from './BarChart'
import BarRank from './BarRank'

interface Summary {
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
}

function KpiCard({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 animate-fade-in">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent ? 'bg-brand' : 'bg-white/15'}`} />
      <p className={`text-2xl font-semibold tabular-nums ${accent ? 'text-brand' : ''}`}>{value}</p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
    </div>
  )
}

export default function PlatformMetrics() {
  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!supabase) return
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setError('Sessão inválida.')
        setLoading(false)
        return
      }
      try {
        const resp = await fetch('/api/platform-summary', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const json = await resp.json()
        if (!resp.ok) {
          setError(json.error || 'Erro desconhecido.')
          setLoading(false)
          return
        }
        setData(json as Summary)
      } catch {
        setError('Não foi possível carregar as métricas agora.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <p className="text-sm text-white/40">Carregando métricas...</p>
  if (error) return <p className="text-sm text-red-400">{error}</p>
  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <KpiCard label="Usuários" value={data.total_usuarios} accent />
        <KpiCard label="Negócios" value={data.total_negocios} accent />
        <KpiCard label="Acessos total" value={data.total_geral} />
        <KpiCard label="Últimos 7 dias" value={data.total_7d} />
        <KpiCard label="Últimos 30 dias" value={data.total_30d} />
      </div>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-2">Acessos · últimos 14 dias</h3>
        <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
          <BarChart data={data.por_dia} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-2">Dispositivos</h3>
          <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
            <BarRank items={data.dispositivos} />
          </div>
        </div>
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-2">Navegadores</h3>
          <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
            <BarRank items={data.navegadores} />
          </div>
        </div>
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-2">Países</h3>
          <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
            <BarRank items={data.paises} />
          </div>
        </div>
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-2">Cidades</h3>
          <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
            <BarRank items={data.cidades} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-2">
            Bairros dos negócios cadastrados
          </h3>
          <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
            <BarRank items={data.bairros} />
          </div>
        </div>
      </div>
    </div>
  )
}

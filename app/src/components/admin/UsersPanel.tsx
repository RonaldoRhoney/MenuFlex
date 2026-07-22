import type { PlatformSummary, UsuarioPlataforma } from '../../lib/platformSummary'
import PieChart from './PieChart'
import Heatmap from './Heatmap'

function formatarData(iso: string | null) {
  if (!iso) return 'Nunca'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function KpiCard({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3 relative overflow-hidden animate-fade-in">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent ? 'bg-brand' : 'bg-white/15'}`} />
      <p className={`text-2xl font-semibold tabular-nums ${accent ? 'text-brand' : ''}`}>{value}</p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
    </div>
  )
}

interface UsersPanelProps {
  usuarios: UsuarioPlataforma[]
  resumo: PlatformSummary['usuarios_resumo']
  cadastrosPorDia: PlatformSummary['cadastros_por_dia']
}

export default function UsersPanel({ usuarios, resumo, cadastrosPorDia }: UsersPanelProps) {
  if (usuarios.length === 0) {
    return <p className="text-sm text-white/40">Nenhum usuário cadastrado ainda.</p>
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <KpiCard label="Total de usuários" value={resumo.total} accent />
        <KpiCard label="Completaram cadastro do negócio" value={resumo.completos} />
        <KpiCard label="Pendentes (sem negócio)" value={resumo.pendentes} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-2">Conclusão do cadastro</h3>
          <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
            <PieChart
              data={[
                { label: 'Completou cadastro', value: resumo.completos, color: '#f97316' },
                { label: 'Só se cadastrou', value: resumo.pendentes, color: '#ffffff33' },
              ]}
            />
          </div>
        </div>
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-2">Cadastros · últimas 14 semanas</h3>
          <div className="rounded-lg border border-white/10 bg-slate-900 p-4 flex items-center">
            <Heatmap data={cadastrosPorDia} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-3">
          Todos os usuários ({usuarios.length})
        </h3>
        <div className="space-y-2">
          {usuarios.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 animate-fade-in"
            >
              <div className="min-w-0 flex items-center gap-2.5">
                <span
                  className={`shrink-0 w-2 h-2 rounded-full ${u.completou_cadastro ? 'bg-green-400' : 'bg-white/20'}`}
                  title={u.completou_cadastro ? 'Completou cadastro' : 'Pendente'}
                />
                <div className="min-w-0">
                  <p className="font-medium truncate">{u.email ?? '(sem e-mail)'}</p>
                  <p className="text-xs text-white/40 truncate">
                    {u.business_name ? (
                      <>
                        {u.role === 'owner' ? 'Dono de' : 'Equipe de'}{' '}
                        <span className="text-white/60">{u.business_name}</span>
                        {u.business_plan && <span className="capitalize"> · {u.business_plan}</span>}
                      </>
                    ) : (
                      'Sem negócio vinculado ainda'
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-white/40">Cadastro: {formatarData(u.created_at)}</p>
                <p className="text-xs text-white/40">Último acesso: {formatarData(u.last_sign_in_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

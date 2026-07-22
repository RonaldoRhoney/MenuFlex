import type { UsuarioPlataforma } from '../../lib/platformSummary'

function formatarData(iso: string | null) {
  if (!iso) return 'Nunca'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function UsersPanel({ usuarios }: { usuarios: UsuarioPlataforma[] }) {
  if (usuarios.length === 0) {
    return <p className="text-sm text-white/40">Nenhum usuário cadastrado ainda.</p>
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-white/40 mb-3">{usuarios.length} usuário(s) — donos e equipe dos negócios cadastrados</p>
      {usuarios.map((u) => (
        <div
          key={u.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 animate-fade-in"
        >
          <div className="min-w-0">
            <p className="font-medium truncate">{u.email ?? '(sem e-mail)'}</p>
            <p className="text-xs text-white/40 truncate">
              {u.business_name ? (
                <>
                  {u.role === 'owner' ? 'Dono de' : 'Equipe de'} <span className="text-white/60">{u.business_name}</span>
                  {u.business_plan && <span className="capitalize"> · {u.business_plan}</span>}
                </>
              ) : (
                'Sem negócio vinculado'
              )}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-white/40">Cadastro: {formatarData(u.created_at)}</p>
            <p className="text-xs text-white/40">Último acesso: {formatarData(u.last_sign_in_at)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

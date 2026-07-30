import { useState } from 'react'
import { diasRestantes, isTrialAtivo, type TrialInfo } from '../../lib/trial'
import { formatarData } from '../../lib/format'

interface TrialCountdownCardProps {
  businessId: string
  trial: TrialInfo
  onConhecerPlanos: () => void
}

// Minimizado fica salvo por negócio — "pode ser minimizado, nunca removido":
// o card sempre volta a existir (encolhido) na próxima visita, nunca some de vez.
function chaveMinimizado(businessId: string) {
  return `menuflex_trial_card_minimizado_${businessId}`
}

export default function TrialCountdownCard({ businessId, trial, onConhecerPlanos }: TrialCountdownCardProps) {
  const [minimizado, setMinimizado] = useState(() => localStorage.getItem(chaveMinimizado(businessId)) === '1')

  if (!isTrialAtivo(trial)) return null

  function alternarMinimizado() {
    const novo = !minimizado
    setMinimizado(novo)
    localStorage.setItem(chaveMinimizado(businessId), novo ? '1' : '0')
  }

  const dias = diasRestantes(trial)

  if (minimizado) {
    return (
      <button
        onClick={alternarMinimizado}
        className="w-full text-left text-xs px-3 py-1.5 bg-brand/10 text-brand font-medium border-b border-white/10"
      >
        ⏳ {dias} {dias === 1 ? 'dia' : 'dias'} de acesso Premium restantes — clique pra expandir
      </button>
    )
  }

  return (
    <div className="px-4 py-3 bg-brand/10 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
      <div>
        <p className="text-sm font-medium">
          Seu acesso Premium termina em <span className="text-brand">{dias} {dias === 1 ? 'dia' : 'dias'}</span>
        </p>
        <p className="text-xs text-white/40">
          Início: {formatarData(trial.started_at)} · Término: {formatarData(trial.ends_at)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onConhecerPlanos} className="text-xs rounded-full bg-brand text-white px-3 py-1.5 font-medium">
          Conhecer planos
        </button>
        <button onClick={alternarMinimizado} className="text-xs text-white/40 px-2" aria-label="Minimizar">
          ─
        </button>
      </div>
    </div>
  )
}

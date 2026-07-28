interface ProgressBarProps {
  label: string
  percentual: number
  faltando?: string[]
}

// Barra de progresso reutilizável do Smart Setup Validation — primeira
// versão extraída (antes só existia a barra feita à mão em AcompanharPedido.tsx).
export default function ProgressBar({ label, percentual, faltando }: ProgressBarProps) {
  const cor = percentual >= 75 ? 'bg-green-500' : percentual >= 40 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="border border-white/10 bg-slate-900 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm font-semibold tabular-nums">{percentual}%</p>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${cor}`}
          style={{ width: `${percentual}%` }}
        />
      </div>
      {faltando && faltando.length > 0 && percentual < 100 && (
        <p className="text-xs text-white/40 mt-2">Faltam: {faltando.join(', ')}</p>
      )}
    </div>
  )
}

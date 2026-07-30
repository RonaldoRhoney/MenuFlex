interface AvailabilityToggleProps {
  disponivel: boolean
  podeAlterar: boolean
  onClick: () => void
}

// Só o dono (podeAlterar) consegue interagir — pra staff, renderiza como
// badge estático (sem cursor pointer, sem hover), mas a informação continua
// visível igual, nunca escondida.
export default function AvailabilityToggle({ disponivel, podeAlterar, onClick }: AvailabilityToggleProps) {
  const classeBase =
    'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full transition-all duration-200 min-h-[36px]'
  const classeCor = disponivel
    ? 'bg-green-500/15 text-green-400'
    : 'bg-white/10 text-white/40'
  const classeInterativa = podeAlterar
    ? `cursor-pointer active:scale-95 ${disponivel ? 'hover:bg-green-500/25' : 'hover:bg-white/15'}`
    : 'cursor-default'

  if (!podeAlterar) {
    return (
      <span className={`${classeBase} ${classeCor} ${classeInterativa}`} aria-label={disponivel ? 'Disponível' : 'Indisponível'}>
        {disponivel ? '🟢 Disponível' : '⚪ Indisponível'}
      </span>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`${classeBase} ${classeCor} ${classeInterativa}`}
      aria-label={disponivel ? 'Marcar como indisponível' : 'Marcar como disponível'}
    >
      {disponivel ? '🟢 Disponível' : '⚪ Indisponível'}
    </button>
  )
}

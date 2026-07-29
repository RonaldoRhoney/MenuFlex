interface TutorialNavigationProps {
  isFirst: boolean
  isLast: boolean
  onAnterior: () => void
  onProximo: () => void
  onPular: () => void
}

export default function TutorialNavigation({ isFirst, isLast, onAnterior, onProximo, onPular }: TutorialNavigationProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex gap-2.5">
        <button
          onClick={onAnterior}
          disabled={isFirst}
          aria-label="Etapa anterior"
          className="flex-1 rounded-xl border border-white/15 text-white/70 disabled:opacity-30 py-3 text-sm font-medium transition-transform active:scale-95"
        >
          Anterior
        </button>
        <button
          onClick={onProximo}
          aria-label={isLast ? 'Finalizar tutorial' : 'Próxima etapa'}
          className="flex-1 rounded-xl bg-brand text-white py-3 text-sm font-semibold shadow-md shadow-brand/30 transition-transform active:scale-95 hover:bg-brand-dark"
        >
          {isLast ? 'Finalizar' : 'Próximo'}
        </button>
      </div>
      {!isLast && (
        <button onClick={onPular} className="w-full text-xs text-white/40 hover:text-white/60 py-1 transition-colors">
          Pular tutorial
        </button>
      )}
    </div>
  )
}

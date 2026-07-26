import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface TutorialStep {
  icon: ReactNode
  title: string
  description: string
}

interface TutorialModalProps {
  steps: TutorialStep[]
  onClose: () => void
  theme?: 'dark' | 'light'
}

export default function TutorialModal({ steps, onClose, theme = 'dark' }: TutorialModalProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const isFirst = stepIndex === 0

  const dark = theme === 'dark'
  const cardClass = dark ? 'bg-slate-900 border border-white/10 text-white' : 'bg-white border border-neutral-200 text-neutral-900'
  const bannerClass = dark
    ? 'bg-gradient-to-br from-brand/25 via-slate-900 to-slate-900'
    : 'bg-gradient-to-br from-brand/15 via-white to-white'
  const descriptionClass = dark ? 'text-white/60' : 'text-neutral-500'
  const stepLabelClass = dark ? 'text-brand' : 'text-brand-dark'
  const secondaryButtonClass = dark
    ? 'border border-white/15 text-white/70 disabled:opacity-30'
    : 'border border-neutral-200 text-neutral-600 disabled:opacity-30'
  const dotClass = (active: boolean) => (active ? 'bg-brand w-6' : dark ? 'bg-white/20 w-1.5' : 'bg-neutral-200 w-1.5')

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Como usar"
    >
      <div className={`w-full max-w-sm rounded-3xl overflow-hidden animate-pop-in shadow-2xl ${cardClass}`} onClick={(e) => e.stopPropagation()}>
        <div className={`relative pt-8 pb-7 px-6 text-center ${bannerClass}`}>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-xl leading-none transition-colors ${
              dark ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-neutral-400 hover:text-neutral-700 hover:bg-black/5'
            }`}
          >
            ×
          </button>

          <div
            key={stepIndex}
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-5 bg-brand text-white shadow-lg shadow-brand/30 animate-pop-in"
          >
            {step.icon}
          </div>

          <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${stepLabelClass}`}>
            Passo {stepIndex + 1} de {steps.length}
          </p>
          <h2 key={`title-${stepIndex}`} className="font-display text-2xl font-bold tracking-tight mb-2 animate-fade-in">
            {step.title}
          </h2>
          <p key={`desc-${stepIndex}`} className={`text-sm leading-relaxed animate-fade-in ${descriptionClass}`}>
            {step.description}
          </p>
        </div>

        <div className="px-6 pb-6 pt-5">
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {steps.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${dotClass(i === stepIndex)}`} />
            ))}
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => setStepIndex((i) => i - 1)}
              disabled={isFirst}
              className={`flex-1 rounded-xl py-3 text-sm font-medium transition-transform active:scale-95 ${secondaryButtonClass}`}
            >
              Anterior
            </button>
            <button
              onClick={() => (isLast ? onClose() : setStepIndex((i) => i + 1))}
              className="flex-1 rounded-xl bg-brand text-white py-3 text-sm font-semibold shadow-md shadow-brand/30 transition-transform active:scale-95 hover:bg-brand-dark"
            >
              {isLast ? 'Concluir' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

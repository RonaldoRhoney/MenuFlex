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
  const iconWrapClass = dark ? 'bg-white/5 text-brand' : 'bg-neutral-50 text-brand-dark'
  const descriptionClass = dark ? 'text-white/60' : 'text-neutral-500'
  const secondaryButtonClass = dark
    ? 'border border-white/15 text-white/70 disabled:opacity-30'
    : 'border border-neutral-200 text-neutral-600 disabled:opacity-30'
  const dotClass = (active: boolean) => (active ? 'bg-brand w-5' : dark ? 'bg-white/20' : 'bg-neutral-200')

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Como usar"
    >
      <div className={`w-full max-w-sm rounded-2xl p-6 animate-pop-in ${cardClass}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end mb-1">
          <button onClick={onClose} aria-label="Fechar" className={`text-xl leading-none ${dark ? 'text-white/40 hover:text-white' : 'text-neutral-400 hover:text-neutral-700'}`}>
            ×
          </button>
        </div>

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 ${iconWrapClass}`}>{step.icon}</div>

        <h2 className="font-display text-xl font-semibold text-center mb-2">{step.title}</h2>
        <p className={`text-sm text-center mb-6 ${descriptionClass}`}>{step.description}</p>

        <div className="flex items-center justify-center gap-1.5 mb-6">
          {steps.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === stepIndex ? 'w-5' : 'w-1.5'} ${dotClass(i === stepIndex)}`} />
          ))}
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => setStepIndex((i) => i - 1)}
            disabled={isFirst}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-transform active:scale-95 ${secondaryButtonClass}`}
          >
            Anterior
          </button>
          <button
            onClick={() => (isLast ? onClose() : setStepIndex((i) => i + 1))}
            className="flex-1 rounded-xl bg-brand text-white py-2.5 text-sm font-medium transition-transform active:scale-95 hover:bg-brand-dark"
          >
            {isLast ? 'Concluir' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

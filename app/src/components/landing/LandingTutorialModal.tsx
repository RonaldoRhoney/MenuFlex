import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import TutorialCategory from './TutorialCategory'
import TutorialCard from './TutorialCard'
import TutorialProgress from './TutorialProgress'
import TutorialNavigation from './TutorialNavigation'
import { PASSOS_CLIENTE, PASSOS_LOJISTA } from '../../lib/landingTutorialContent'

interface LandingTutorialModalProps {
  onClose: () => void
}

type Categoria = 'lojista' | 'cliente' | null

// "Como usar" da landing page: qualquer visitante conhece o fluxo completo
// (lojista ou cliente) sem precisar criar conta. Modal full-screen no
// desktop, bottom-sheet no mobile — mesma classe responsiva cobre os dois
// layouts pedidos, em vez de dois componentes separados.
export default function LandingTutorialModal({ onClose }: LandingTutorialModalProps) {
  const navigate = useNavigate()
  const [categoria, setCategoria] = useState<Categoria>(null)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const passos = categoria === 'lojista' ? PASSOS_LOJISTA : categoria === 'cliente' ? PASSOS_CLIENTE : []
  const isLast = stepIndex === passos.length - 1
  const isFirst = stepIndex === 0

  function irParaCategoria(c: 'lojista' | 'cliente') {
    setCategoria(c)
    setStepIndex(0)
  }

  function anterior() {
    if (isFirst) {
      setCategoria(null)
    } else {
      setStepIndex((i) => i - 1)
    }
  }

  function proximo() {
    if (!isLast) {
      setStepIndex((i) => i + 1)
      return
    }
    // Último card do lojista leva direto pro cadastro — o do cliente só fecha.
    if (categoria === 'lojista') {
      onClose()
      navigate('/admin?cadastro=1')
    } else {
      onClose()
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Como usar o MenuFlex"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl bg-slate-950 border border-white/10 text-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto animate-slide-up sm:animate-pop-in shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-slate-950/95 backdrop-blur border-b border-white/10">
          <p className="text-sm font-semibold text-white/70">Como usar o MenuFlex</p>
          <button
            onClick={onClose}
            aria-label="Fechar tutorial"
            className="w-8 h-8 rounded-full flex items-center justify-center text-xl leading-none text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            ×
          </button>
        </div>

        {categoria === null ? (
          <TutorialCategory onEscolher={irParaCategoria} />
        ) : (
          <div>
            <TutorialCard step={passos[stepIndex]} stepIndex={stepIndex} />
            <div className="px-6 pb-6 space-y-5">
              <TutorialProgress total={passos.length} atual={stepIndex} />
              <TutorialNavigation
                isFirst={false}
                isLast={isLast}
                onAnterior={anterior}
                onProximo={proximo}
                onPular={onClose}
              />
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

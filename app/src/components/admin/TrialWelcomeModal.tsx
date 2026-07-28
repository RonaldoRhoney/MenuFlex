import { createPortal } from 'react-dom'

interface TrialWelcomeModalProps {
  onClose: () => void
  onConhecerPlanos: () => void
}

export default function TrialWelcomeModal({ onClose, onConhecerPlanos }: TrialWelcomeModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in" role="dialog" aria-modal="true">
      <div className="max-w-sm w-full bg-slate-900 border border-white/10 rounded-2xl p-6 text-center animate-pop-in">
        <p className="text-4xl mb-3">🎉</p>
        <h2 className="text-xl font-semibold mb-2">Parabéns!</h2>
        <p className="text-sm text-white/60 mb-1">Seu primeiro pedido foi realizado com sucesso!</p>
        <p className="text-sm text-white/60 mb-6">
          A partir de hoje você tem acesso <strong className="text-white">completo</strong> ao MenuFlex pelos próximos
          60 dias. Explore todos os recursos e descubra como podemos ajudar seu negócio a vender mais e administrar
          melhor sua operação.
        </p>
        <div className="space-y-2">
          <button onClick={onClose} className="w-full rounded-lg bg-brand text-white py-2.5 font-medium">
            Explorar recursos
          </button>
          <button
            onClick={onConhecerPlanos}
            className="w-full rounded-lg border border-white/15 text-white/70 py-2.5 font-medium"
          >
            Conhecer planos
          </button>
          <button onClick={onClose} className="w-full text-xs text-white/40 py-1.5">
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

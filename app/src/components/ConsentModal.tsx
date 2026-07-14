interface ConsentModalProps {
  open: boolean
  onAccept: () => void
  onDecline: () => void
}

// Modal de consentimento LGPD — obrigatório antes de qualquer coleta de
// geolocalização (prompt de instalação por proximidade). Sem "aceitar", a
// geolocalização nunca é solicitada ao navegador.
export default function ConsentModal({ open, onAccept, onDecline }: ConsentModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-2">Usar sua localização?</h2>
        <p className="text-sm text-neutral-600 leading-relaxed mb-4">
          Se você permitir, o MenuFlex usa sua localização só para sugerir a instalação do
          app quando você estiver perto de um negócio cadastrado. Não guardamos sua
          localização exata, e você pode negar sem perder acesso ao cardápio. Isso segue a
          Lei Geral de Proteção de Dados (LGPD) — você pode pedir a exclusão desse
          consentimento a qualquer momento em "Privacidade".
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 rounded-lg border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700"
          >
            Agora não
          </button>
          <button
            onClick={onAccept}
            className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-medium text-white"
          >
            Permitir
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { createPortal } from 'react-dom'

interface AvailabilityConfirmModalProps {
  itemNome: string
  statusAtual: boolean
  salvando: boolean
  onCancel: () => void
  onConfirm: (motivo: string) => void
}

export default function AvailabilityConfirmModal({
  itemNome,
  statusAtual,
  salvando,
  onCancel,
  onConfirm,
}: AvailabilityConfirmModalProps) {
  const [motivo, setMotivo] = useState('')
  const tornarIndisponivel = statusAtual

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-slate-900 border border-white/10 p-6 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-semibold text-lg mb-2">
          {tornarIndisponivel ? 'Tornar produto indisponível?' : 'Disponibilizar produto novamente?'}
        </h2>
        <p className="text-sm text-white/60 mb-4">
          {tornarIndisponivel
            ? `Tem certeza que deseja tornar "${itemNome}" indisponível? Ele deixará de poder ser pedido pelos clientes.`
            : `Deseja disponibilizar "${itemNome}" novamente? Ele voltará a aparecer no cardápio pros clientes.`}
        </p>
        <label className="text-xs text-white/40 mb-1 block">Motivo (opcional)</label>
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ex: em manutenção, ingrediente em falta..."
          className="w-full border border-white/15 bg-slate-950 rounded-lg px-3 py-2 text-sm placeholder:text-white/30 mb-5"
        />
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            disabled={salvando}
            className="flex-1 rounded-xl border border-white/15 text-white/70 py-2.5 text-sm font-medium transition-transform active:scale-95 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(motivo.trim())}
            disabled={salvando}
            className="flex-1 rounded-xl bg-brand text-white py-2.5 text-sm font-semibold transition-transform active:scale-95 disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : tornarIndisponivel ? 'Confirmar' : 'Disponibilizar'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

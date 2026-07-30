import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export interface ToastData {
  mensagem: string
  tipo?: 'sucesso' | 'erro' | 'neutro'
}

interface ToastProps {
  toast: ToastData | null
  onClose: () => void
}

const CORES = {
  sucesso: 'border-green-500/30 bg-green-500/10 text-green-400',
  erro: 'border-red-500/30 bg-red-500/10 text-red-400',
  neutro: 'border-white/15 bg-slate-900 text-white',
}

// Toast reutilizável — primeiro uso deste padrão no projeto (antes o
// feedback era sempre texto inline tipo "Dados salvos." perto do botão).
export default function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null

  return createPortal(
    <div className="fixed bottom-5 inset-x-0 z-[100] flex justify-center px-4 pointer-events-none">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm font-medium shadow-lg animate-slide-up ${CORES[toast.tipo ?? 'neutro']}`}
      >
        {toast.mensagem}
      </div>
    </div>,
    document.body,
  )
}

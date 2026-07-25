import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

// Estado vazio padronizado — antes cada tela escrevia seu próprio texto
// solto ("Nenhum item aqui.", "Nenhum pedido aqui."); agora todas usam a
// mesma composição (ícone + título + descrição opcional + ação opcional),
// reaproveitando o animate-fade-in já existente no resto do app.
export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center text-center py-10 px-4 gap-2">
      {icon && <div className="text-white/20 mb-1">{icon}</div>}
      <p className="text-sm font-medium text-white/50">{title}</p>
      {description && <p className="text-xs text-white/30 max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

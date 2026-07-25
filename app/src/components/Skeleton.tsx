// Skeleton loading reutilizável — substitui os "Carregando..." em texto
// por um placeholder que já sugere o formato do conteúdo real, reduzindo
// a sensação de espera. Usa o mesmo tom neutro do resto do painel (slate),
// pulso sutil via CSS puro (sem dependência nova).
interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-lg bg-white/8 ${className}`} />
}

// Composição pronta pra tela cheia de carregamento (ex: painel inteiro
// enquanto resolve sessão/negócio) — evita repetir o mesmo layout em
// cada ponto de loading.
export function SkeletonScreen() {
  return (
    <div className="min-h-full flex flex-col gap-3 p-6 bg-slate-950">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-64" />
      <div className="flex flex-col gap-2 mt-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  )
}

// Linha de card, pro caso comum de lista de itens (estoque, pedidos, cardápio).
export function SkeletonRow() {
  return (
    <div className="border border-white/10 rounded-xl p-3 flex items-center gap-3">
      <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}

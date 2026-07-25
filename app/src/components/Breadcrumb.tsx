interface BreadcrumbProps {
  trail: string[]
}

// Breadcrumb simples pro painel administrativo — só texto, sem links (as
// abas do painel não têm sub-navegação profunda o bastante pra precisar
// de navegação clicável ainda); existe pra dar contexto de "onde eu
// estou" sem precisar olhar pra sidebar.
export default function Breadcrumb({ trail }: BreadcrumbProps) {
  return (
    <p className="text-xs text-white/40 flex items-center gap-1.5 mb-1">
      {trail.map((item, i) => (
        <span key={item} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-white/20">/</span>}
          <span className={i === trail.length - 1 ? 'text-white/70' : ''}>{item}</span>
        </span>
      ))}
    </p>
  )
}

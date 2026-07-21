interface BarRankProps {
  items: { label: string; total: number }[]
}

// Ranking horizontal (dispositivos, países, cidades, bairros) — barras finas,
// cor única de magnitude (não é identidade categórica, é ranking por contagem).
export default function BarRank({ items }: BarRankProps) {
  if (items.length === 0) {
    return <p className="text-sm text-white/40 py-4 text-center">Sem dados ainda.</p>
  }
  const max = items[0].total

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const pct = Math.max(3, Math.round((item.total / max) * 100))
        return (
          <div key={item.label} className="grid grid-cols-[1fr_2fr_auto] items-center gap-2.5 text-xs">
            <span className="truncate text-white/70" title={item.label}>
              {item.label}
            </span>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-white/40 font-mono tabular-nums">{item.total}</span>
          </div>
        )
      })}
    </div>
  )
}

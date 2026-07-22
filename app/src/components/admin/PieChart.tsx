import { useState } from 'react'

interface PieChartProps {
  data: { label: string; value: number; color: string }[]
}

// Pizza simples via SVG (sem lib externa) — poucos segmentos (2-4), então
// não precisa de nada mais sofisticado que arcos calculados na mão.
export default function PieChart({ data }: PieChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)

  if (total === 0) {
    return <p className="text-sm text-white/40 py-8 text-center">Sem dados ainda.</p>
  }

  const size = 160
  const r = 70
  const cx = size / 2
  const cy = size / 2

  let anguloAcumulado = -90
  const fatias = data
    .filter((d) => d.value > 0)
    .map((d, i) => {
      const fracao = d.value / total
      const anguloInicio = anguloAcumulado
      const anguloFim = anguloAcumulado + fracao * 360
      anguloAcumulado = anguloFim

      const rad = (deg: number) => (deg * Math.PI) / 180
      const x1 = cx + r * Math.cos(rad(anguloInicio))
      const y1 = cy + r * Math.sin(rad(anguloInicio))
      const x2 = cx + r * Math.cos(rad(anguloFim))
      const y2 = cy + r * Math.sin(rad(anguloFim))
      const largeArc = anguloFim - anguloInicio > 180 ? 1 : 0

      const path =
        fracao >= 0.999
          ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
          : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`

      return { ...d, path, pct: Math.round(fracao * 100), idx: i }
    })

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <div className="relative shrink-0">
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          {fatias.map((f) => (
            <path
              key={f.label}
              d={f.path}
              fill={f.color}
              opacity={hoverIdx === null || hoverIdx === f.idx ? 1 : 0.35}
              style={{ transition: 'opacity .15s ease', cursor: 'pointer' }}
              onMouseEnter={() => setHoverIdx(f.idx)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          ))}
        </svg>
      </div>
      <div className="space-y-1.5">
        {fatias.map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-2 text-sm cursor-pointer"
            onMouseEnter={() => setHoverIdx(f.idx)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ opacity: hoverIdx === null || hoverIdx === f.idx ? 1 : 0.5 }}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: f.color }} />
            <span className="text-white/70">{f.label}</span>
            <span className="text-white/40 font-mono tabular-nums text-xs">
              {f.value} · {f.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

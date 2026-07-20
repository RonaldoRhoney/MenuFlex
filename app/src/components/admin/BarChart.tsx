import { useState } from 'react'

interface BarChartProps {
  data: { dia: string; total: number }[]
}

// Gráfico de barras (não linha, de propósito): com poucos dias de dado, uma
// linha entre 1-2 pontos sugere uma "tendência" contínua que não existe —
// contagem discreta por dia é o job de barras, não de linha.
export default function BarChart({ data }: BarChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  if (data.length === 0) {
    return <p className="text-sm text-neutral-400 py-8 text-center">Sem dados ainda.</p>
  }

  const W = 640
  const H = 200
  const padL = 30
  const padR = 8
  const padT = 12
  const padB = 24
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const maxVal = Math.max(1, ...data.map((d) => d.total))
  const yTicks = 4

  const slot = plotW / data.length
  const barW = Math.max(4, Math.min(44, slot - 6))
  const xCenterAt = (i: number) => padL + slot * i + slot / 2
  const yAt = (v: number) => padT + plotH - (v / maxVal) * plotH
  const barRadius = Math.min(4, barW / 2)

  const labelEvery = Math.max(1, Math.ceil(data.length / 6))
  const hovered = hoverIdx !== null ? data[hoverIdx] : null

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" preserveAspectRatio="none">
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const v = Math.round((maxVal * i) / yTicks)
          const y = yAt(v)
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e5e5e5" strokeWidth={1} />
              <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#a3a3a3">
                {v}
              </text>
            </g>
          )
        })}

        {data.map((d, i) => {
          const x = xCenterAt(i) - barW / 2
          const y = yAt(d.total)
          const h = Math.max(1.5, padT + plotH - y)
          return (
            <rect
              key={d.dia}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={barRadius}
              fill="#f97316"
              opacity={hoverIdx === i ? 0.75 : 1}
              style={{ transition: 'opacity .15s ease' }}
            />
          )
        })}

        {data.map((d, i) => {
          if (i % labelEvery !== 0 && i !== data.length - 1) return null
          const [, mes, dia] = d.dia.split('-')
          return (
            <text key={d.dia} x={xCenterAt(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="#a3a3a3">
              {dia}/{mes}
            </text>
          )
        })}

        {data.map((d, i) => (
          <rect
            key={'hit-' + d.dia}
            x={padL + slot * i}
            y={padT}
            width={slot}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </svg>
      {hovered && (
        <div
          className="absolute pointer-events-none bg-neutral-900 text-white text-xs rounded-md px-2.5 py-1.5 -translate-x-1/2 -translate-y-full"
          style={{ left: `${(xCenterAt(hoverIdx!) / W) * 100}%`, top: `${(yAt(hovered.total) / H) * 100}%` }}
        >
          {hovered.dia.split('-').slice(1).reverse().join('/')}
          <strong className="block text-orange-300">
            {hovered.total} {hovered.total === 1 ? 'acesso' : 'acessos'}
          </strong>
        </div>
      )}
    </div>
  )
}

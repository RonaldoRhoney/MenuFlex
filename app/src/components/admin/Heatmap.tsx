import { useState } from 'react'

interface HeatmapProps {
  data: { dia: string; total: number }[]
  semanas?: number
}

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function corPorIntensidade(valor: number, max: number) {
  if (valor === 0) return 'rgba(255,255,255,0.06)'
  const t = Math.min(1, valor / max)
  // Interpola de laranja fraco a laranja forte (mesma cor da marca)
  const alpha = 0.25 + t * 0.75
  return `rgba(249,115,22,${alpha.toFixed(2)})`
}

// Mapa de calor estilo "contribuições" — cada quadrado é um dia, colunas são
// semanas. Bom pra ver padrão de cadastro ao longo do tempo de um jeito que
// uma lista de números não mostra (picos, sequências, dias parados).
export default function Heatmap({ data, semanas = 14 }: HeatmapProps) {
  const [hover, setHover] = useState<{ dia: string; total: number; x: number; y: number } | null>(null)

  const porDia = new Map(data.map((d) => [d.dia, d.total]))
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const totalDias = semanas * 7
  // Alinha o fim da grade no sábado da semana atual, pra colunas ficarem
  // completas (domingo a sábado) como num calendário de verdade.
  const fimSemana = new Date(hoje)
  fimSemana.setDate(hoje.getDate() + (6 - hoje.getDay()))

  const dias: { iso: string; total: number; futuro: boolean }[] = []
  for (let i = totalDias - 1; i >= 0; i--) {
    const d = new Date(fimSemana)
    d.setDate(fimSemana.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    dias.push({ iso, total: porDia.get(iso) ?? 0, futuro: d > hoje })
  }

  const semanasCols: typeof dias[] = []
  for (let i = 0; i < dias.length; i += 7) semanasCols.push(dias.slice(i, i + 7))

  const max = Math.max(1, ...data.map((d) => d.total))
  const cell = 13
  const gap = 3

  return (
    <div className="relative overflow-x-auto">
      <div className="flex gap-[3px]" style={{ width: 'fit-content' }}>
        {semanasCols.map((semana, si) => (
          <div key={si} className="flex flex-col gap-[3px]">
            {semana.map((d) => (
              <div
                key={d.iso}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const parentRect = e.currentTarget.closest('.relative')!.getBoundingClientRect()
                  setHover({
                    dia: d.iso,
                    total: d.total,
                    x: rect.left - parentRect.left + rect.width / 2,
                    y: rect.top - parentRect.top,
                  })
                }}
                onMouseLeave={() => setHover(null)}
                className="rounded-sm"
                style={{
                  width: cell,
                  height: cell,
                  background: d.futuro ? 'transparent' : corPorIntensidade(d.total, max),
                  cursor: d.futuro ? 'default' : 'pointer',
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-center mt-2.5 text-[10px] text-white/30">
        <span>Menos</span>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <span
            key={t}
            className="rounded-sm"
            style={{ width: cell - 3, height: cell - 3, background: t === 0 ? 'rgba(255,255,255,0.06)' : `rgba(249,115,22,${(0.25 + t * 0.75).toFixed(2)})` }}
          />
        ))}
        <span>Mais</span>
      </div>
      {hover && (
        <div
          className="absolute pointer-events-none bg-neutral-900 text-white text-xs rounded-md px-2.5 py-1.5 -translate-x-1/2 z-10 whitespace-nowrap"
          style={{ left: hover.x, top: hover.y - gap, transform: 'translate(-50%, -100%)' }}
        >
          {new Date(hover.dia + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          <strong className="block text-orange-300">
            {hover.total} {hover.total === 1 ? 'cadastro' : 'cadastros'}
          </strong>
        </div>
      )}
      <p className="sr-only">Dias da semana: {DIAS_SEMANA.join(', ')}</p>
    </div>
  )
}

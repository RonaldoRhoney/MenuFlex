import { useEffect, useState } from 'react'

// Horário local do negócio (Belém-PA) — fixo em America/Belem independente do fuso de
// quem está acessando, pra bater com o "opening_hours" cadastrado em Minha Empresa.
const formatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Belem',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

export default function LiveClock({ className = '' }: { className?: string }) {
  const [now, setNow] = useState(() => formatter.format(new Date()))

  useEffect(() => {
    const id = setInterval(() => setNow(formatter.format(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className={`font-mono tabular-nums ${className}`} aria-live="off">
      {now}
    </span>
  )
}

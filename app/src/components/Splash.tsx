import { useEffect, useState } from 'react'
import BrandArt from './BrandArt'

const AUTO_ADVANCE_MS = 2600

export default function Splash({ onContinue }: { onContinue: () => void }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(finish, AUTO_ADVANCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function finish() {
    setLeaving(true)
    setTimeout(onContinue, 250)
  }

  return (
    <div
      onClick={finish}
      className={`min-h-full flex flex-col items-center justify-center bg-slate-950 text-white px-4 cursor-pointer transition-opacity duration-250 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <BrandArt framed={false} className="max-w-[260px]" />
      <h1 className="text-2xl font-semibold mb-1">MenuFlex</h1>
      <p className="text-white/50 text-sm mb-10">Cardápio digital no bolso do cliente.</p>
      <p className="text-xs text-white/30 font-mono">toque para continuar</p>
    </div>
  )
}

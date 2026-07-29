import { useState } from 'react'

interface VideoPlayerProps {
  videoUrl?: string
  titulo: string
}

// Botão "Assistir demonstração" só monta o player (ou o placeholder) quando
// clicado — nenhum vídeo/iframe é carregado antes disso, então essa parte
// nunca pesa no carregamento inicial do tutorial.
export default function VideoPlayer({ videoUrl, titulo }: VideoPlayerProps) {
  const [aberto, setAberto] = useState(false)

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
      >
        <span className="w-6 h-6 rounded-full bg-brand/15 flex items-center justify-center text-xs">▶</span>
        Assistir demonstração
      </button>
    )
  }

  if (!videoUrl) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/[0.03] py-8 px-4 text-center">
        <span className="text-3xl block mb-2">🎬</span>
        <p className="text-sm text-white/50">Vídeo dessa etapa em produção — em breve por aqui.</p>
        <p className="text-xs text-white/30 mt-1">{titulo}</p>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-xl overflow-hidden aspect-video">
      <video src={videoUrl} controls autoPlay className="w-full h-full" title={titulo} />
    </div>
  )
}

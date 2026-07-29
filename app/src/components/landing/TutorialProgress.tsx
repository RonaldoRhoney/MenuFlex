interface TutorialProgressProps {
  total: number
  atual: number
}

export default function TutorialProgress({ total, atual }: TutorialProgressProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === atual ? 'bg-brand w-6' : 'bg-white/20 w-1.5'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-white/40">
        {atual + 1} de {total}
      </p>
    </div>
  )
}

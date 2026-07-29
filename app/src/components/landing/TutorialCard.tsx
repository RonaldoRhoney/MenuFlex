import VideoPlayer from './VideoPlayer'
import type { TutorialCardContent } from '../../lib/landingTutorialContent'

interface TutorialCardProps {
  step: TutorialCardContent
  stepIndex: number
}

export default function TutorialCard({ step, stepIndex }: TutorialCardProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-8 max-w-md mx-auto">
      <div
        key={stepIndex}
        className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mb-5 bg-brand text-white shadow-lg shadow-brand/30 animate-pop-in"
      >
        {step.icon}
      </div>
      <h3 key={`title-${stepIndex}`} className="font-display text-2xl font-bold tracking-tight mb-2 animate-fade-in">
        {step.title}
      </h3>
      <p key={`desc-${stepIndex}`} className="text-sm leading-relaxed text-white/60 animate-fade-in">
        {step.description}
      </p>
      <VideoPlayer videoUrl={step.videoUrl} titulo={step.title} />
    </div>
  )
}

import type { Step } from '@/store/useEvaluacion'

const STEPS = ['Datos', 'Fotos', 'Evaluación', 'Resultados', 'Informe'] as const

interface Props {
  current: Step
}

export function ProgressBar({ current }: Props) {
  return (
    <div className="flex gap-1 mb-5">
      {STEPS.map((label, i) => {
        const isCurrent = i === current
        const isPast = i < current
        const bg = isCurrent
          ? 'bg-ergo-orange text-white'
          : isPast
            ? 'bg-ergo-orange/40 text-white'
            : 'bg-ergo-cb text-ergo-muted'
        return (
          <div
            key={label}
            className={`flex-1 text-center px-1 py-2 rounded-xl text-xs font-${isCurrent ? 'bold' : 'medium'} ${bg}`}
          >
            {isPast ? '✓ ' : ''}
            {label}
          </div>
        )
      })}
    </div>
  )
}

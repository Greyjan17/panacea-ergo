import type { RiskLevel } from '@/types/ergo'
import { RISK_LEVEL_NAME } from '@/types/ergo'

interface Props {
  level: RiskLevel
  text: string
}

const RISK_COLOR: Record<RiskLevel, string> = {
  0: '#22C55E',
  1: '#84CC16',
  2: '#EAB308',
  3: '#F97316',
  4: '#EF4444',
}

export function Badge({ level, text }: Props) {
  const color = RISK_COLOR[level]
  return (
    <div
      className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg mt-2 border-[1.5px]"
      style={{ background: `${color}22`, borderColor: color }}
    >
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="font-bold text-sm" style={{ color }}>
        {text}
      </span>
      <span className="text-xs text-ergo-muted">— Riesgo {RISK_LEVEL_NAME[level]}</span>
    </div>
  )
}

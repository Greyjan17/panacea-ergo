import type { ReactNode } from 'react'

interface Props {
  title?: ReactNode
  children: ReactNode
  /** Color de acento (override). Por defecto usa naranja ERGO. */
  accent?: string
  className?: string
}

export function Card({ title, children, accent, className = '' }: Props) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 border mb-4 shadow-[0_2px_8px_rgba(139,69,19,0.08)] ${className}`}
      style={{ borderColor: accent ?? '#E8D5C0' }}
    >
      {title !== undefined && (
        <div
          className="font-bold text-[15px] mb-3.5 pb-2.5 border-b border-ergo-cb"
          style={{ color: accent ?? '#D2691E' }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

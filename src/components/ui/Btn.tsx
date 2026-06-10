import type { ReactNode } from 'react'

interface Props {
  label: ReactNode
  onClick: () => void
  disabled?: boolean
  variant?: 'solid' | 'outline'
  size?: 'sm' | 'md'
}

export function Btn({
  label,
  onClick,
  disabled = false,
  variant = 'solid',
  size = 'md',
}: Props) {
  const base =
    'rounded-lg font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60'
  const sizing = size === 'sm' ? 'px-4 py-1.5 text-[13px]' : 'px-6 py-3 text-[15px]'
  const visual =
    variant === 'outline'
      ? 'bg-transparent text-ergo-orange border-2 border-ergo-orange hover:bg-ergo-orange/5'
      : 'bg-ergo-orange text-white shadow-[0_3px_10px_rgba(210,105,30,0.35)] hover:bg-ergo-ob'

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizing} ${visual}`}>
      {label}
    </button>
  )
}

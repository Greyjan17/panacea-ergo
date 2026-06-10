interface Props {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}

export function Num({ label, value, onChange, min = 0, max = 999, step = 1 }: Props) {
  return (
    <div className="mb-2">
      <div className="text-[11px] text-ergo-muted mb-0.5 font-semibold">{label}</div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => {
          const v = Number(e.target.value)
          onChange(isNaN(v) ? min : v)
        }}
        className="w-full px-2.5 py-1.5 border border-ergo-cb rounded-lg bg-ergo-inp text-[13px] text-ergo-text focus:outline-none focus:border-ergo-orange"
      />
    </div>
  )
}

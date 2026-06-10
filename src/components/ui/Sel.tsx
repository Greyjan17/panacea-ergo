type Value = string | number

interface Props<V extends Value> {
  label: string
  value: V
  onChange: (v: V) => void
  options: ReadonlyArray<readonly [V, string]>
}

export function Sel<V extends Value>({ label, value, onChange, options }: Props<V>) {
  return (
    <div className="mb-2">
      <div className="text-[11px] text-ergo-muted mb-0.5 font-semibold">{label}</div>
      <select
        value={String(value)}
        onChange={e => {
          const raw = e.target.value
          // Preserva el tipo original: si el valor inicial es number, parsea
          const parsed = typeof value === 'number' ? (Number(raw) as V) : (raw as V)
          onChange(parsed)
        }}
        className="w-full px-2.5 py-1.5 border border-ergo-cb rounded-lg bg-ergo-inp text-xs text-ergo-text focus:outline-none focus:border-ergo-orange"
      >
        {options.map(([v, l]) => (
          <option key={String(v)} value={String(v)}>
            {l}
          </option>
        ))}
      </select>
    </div>
  )
}

interface Props {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}

export function Chk({ label, value, onChange }: Props) {
  return (
    <label className="flex items-center gap-1.5 text-xs mb-1.5 cursor-pointer text-ergo-mid select-none">
      <input
        type="checkbox"
        checked={value}
        onChange={e => onChange(e.target.checked)}
        className="w-3.5 h-3.5 accent-ergo-orange"
      />
      {label}
    </label>
  )
}

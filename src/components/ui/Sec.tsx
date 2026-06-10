interface Props {
  title: string
}

export function Sec({ title }: Props) {
  return (
    <div className="font-bold text-xs text-ergo-orange my-3 mb-1.5 pb-1 border-b-2 border-ergo-cb uppercase tracking-wide">
      {title}
    </div>
  )
}

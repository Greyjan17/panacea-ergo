import { Btn } from '@/components/ui'

interface Props {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
}

export function Nav({ onBack, onNext, nextLabel = 'Siguiente →', nextDisabled }: Props) {
  return (
    <div className="flex justify-between mt-5 pt-3.5 border-t border-ergo-cb">
      {onBack ? <Btn label="← Atrás" onClick={onBack} variant="outline" /> : <div />}
      {onNext && <Btn label={nextLabel} onClick={onNext} disabled={nextDisabled} />}
    </div>
  )
}

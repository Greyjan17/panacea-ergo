import { Btn } from '@/components/ui'
import { Informe } from '@/components/informe/Informe'
import { useEvaluacion } from '@/store/useEvaluacion'

export function Step4Informe() {
  const setStep = useEvaluacion(s => s.setStep)
  return (
    <div>
      <div className="noprint sticky top-0 z-20 bg-yellow-50 border-b border-yellow-200 px-4 py-3 mb-5 flex items-center justify-between rounded-xl">
        <div className="text-xs text-yellow-900">
          Vista de impresión. Usa{' '}
          <kbd className="bg-white border px-1 rounded text-[10px]">⌘ + P</kbd> o el botón.
        </div>
        <div className="flex gap-2">
          <Btn label="🖨 Imprimir / PDF" onClick={() => window.print()} size="sm" />
          <Btn label="← Resultados" variant="outline" onClick={() => setStep(3)} size="sm" />
        </div>
      </div>
      <Informe />
    </div>
  )
}

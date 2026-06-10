import { useMemo } from 'react'
import {
  Step0Datos,
  Step1Fotos,
  Step2Evaluacion,
  Step3Resultados,
  Step4Informe,
} from '@/components/steps'
import { Historial } from '@/components/historial/Historial'
import { Header } from '@/components/wizard/Header'
import { ProgressBar } from '@/components/wizard/ProgressBar'
import { useEvaluacion } from '@/store/useEvaluacion'

function useVista(): 'wizard' | 'historial' {
  return useMemo(() => {
    if (typeof window === 'undefined') return 'wizard'
    const v = new URLSearchParams(window.location.search).get('vista')
    return v === 'historial' ? 'historial' : 'wizard'
  }, [])
}

export function App() {
  const step = useEvaluacion(s => s.step)
  const vista = useVista()

  if (vista === 'historial') {
    return (
      <main className="min-h-screen p-5 max-w-5xl mx-auto">
        <div className="noprint">
          <Header />
          <div className="flex justify-between items-center mb-3">
            <a className="text-sm text-ergo-orange underline hover:text-ergo-ob" href="/">
              ← Volver al wizard
            </a>
          </div>
        </div>
        <Historial />
      </main>
    )
  }

  return (
    <main className="min-h-screen p-5 max-w-3xl mx-auto">
      <div className="noprint">
        <Header />
        <div className="flex justify-end mb-2">
          <a className="text-xs text-ergo-orange underline hover:text-ergo-ob" href="/?vista=historial">
            📚 Historial de evaluaciones →
          </a>
        </div>
        <ProgressBar current={step} />
      </div>
      {step === 0 && <Step0Datos />}
      {step === 1 && <Step1Fotos />}
      {step === 2 && <Step2Evaluacion />}
      {step === 3 && <Step3Resultados />}
      {step === 4 && <Step4Informe />}
    </main>
  )
}

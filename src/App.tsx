import {
  Step0Datos,
  Step1Fotos,
  Step2Evaluacion,
  Step3Resultados,
  Step4Informe,
} from '@/components/steps'
import { Header } from '@/components/wizard/Header'
import { ProgressBar } from '@/components/wizard/ProgressBar'
import { useEvaluacion } from '@/store/useEvaluacion'

export function App() {
  const step = useEvaluacion(s => s.step)

  return (
    <main className="min-h-screen p-5 max-w-3xl mx-auto">
      <div className="noprint">
        <Header />
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

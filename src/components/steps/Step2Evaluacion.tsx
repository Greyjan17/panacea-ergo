import { Suspense, lazy, useState } from 'react'
import { MMCPanel, NIOSHPanel, OWASPanel, REBAPanel, RULAPanel } from '@/components/panels'
import { Card } from '@/components/ui'
import { Nav } from '@/components/wizard/Nav'
import type { Method } from '@/types/ergo'
import { useEvaluacion } from '@/store/useEvaluacion'

// MediaPipe Pose es ~5MB. Solo se carga si el médico pide medir ángulos.
const PoseAnalyzer = lazy(() =>
  import('@/components/pose/PoseAnalyzer').then(m => ({ default: m.PoseAnalyzer })),
)

export function Step2Evaluacion() {
  const metodos = useEvaluacion(s => s.info.metodos)
  const setStep = useEvaluacion(s => s.setStep)
  const photos = useEvaluacion(s => s.photos)
  const [active, setActive] = useState<Method>(metodos[0] ?? 'REBA')
  const [poseOpen, setPoseOpen] = useState(false)

  const showPose = active === 'REBA' || active === 'RULA'

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4">
        {metodos.map(m => {
          const isActive = active === m
          return (
            <button
              key={m}
              onClick={() => setActive(m)}
              className={`px-5 py-2.5 rounded-full font-bold text-sm border-2 transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-ergo-header to-ergo-orange text-white border-transparent shadow-[0_3px_12px_rgba(210,105,30,0.35)]'
                  : 'bg-white text-ergo-mid border-ergo-cb hover:border-ergo-orange'
              }`}
            >
              {m}
            </button>
          )
        })}
      </div>

      {active === 'REBA' && <REBAPanel />}
      {active === 'RULA' && <RULAPanel />}
      {active === 'OWAS' && <OWASPanel />}
      {active === 'NIOSH' && <NIOSHPanel />}
      {active === 'MMC' && <MMCPanel />}

      {showPose && photos.length > 0 && (
        <Card title="📐 Medición Angular Objetiva (MediaPipe Pose)">
          {!poseOpen ? (
            <div className="text-center py-4">
              <p className="text-xs text-ergo-muted mb-3">
                Detecta 33 landmarks corporales en tus fotos y calcula ángulos
                articulares con precisión ±3-5°. <strong>Carga +4.8 MB de modelo</strong>{' '}
                — solo si lo necesitas.
              </p>
              <button
                onClick={() => setPoseOpen(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-emerald-700 to-emerald-500 shadow-[0_3px_10px_rgba(5,150,105,0.35)]"
              >
                Cargar análisis postural ahora
              </button>
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="text-center text-sm text-ergo-muted py-5">
                  ⏳ Cargando MediaPipe Pose (~5 MB)…
                </div>
              }
            >
              <PoseAnalyzer method={active} />
            </Suspense>
          )}
        </Card>
      )}

      <Nav
        onBack={() => setStep(1)}
        onNext={() => setStep(3)}
        nextLabel="Ver resultados →"
      />
    </div>
  )
}

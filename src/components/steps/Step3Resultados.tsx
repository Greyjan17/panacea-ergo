import { useMemo } from 'react'
import { Badge, Card } from '@/components/ui'
import { Nav } from '@/components/wizard/Nav'
import { calcMmc } from '@/lib/calc/mmc'
import { calcNiosh } from '@/lib/calc/niosh'
import { calcOwas } from '@/lib/calc/owas'
import { calcReba } from '@/lib/calc/reba'
import { calcRula } from '@/lib/calc/rula'
import { useEvaluacion } from '@/store/useEvaluacion'
import type { Method } from '@/types/ergo'

export function Step3Resultados() {
  const metodos = useEvaluacion(s => s.info.metodos)
  const reba = useEvaluacion(s => s.reba)
  const rula = useEvaluacion(s => s.rula)
  const owas = useEvaluacion(s => s.owas)
  const niosh = useEvaluacion(s => s.niosh)
  const mmc = useEvaluacion(s => s.mmc)
  const sexo = useEvaluacion(s => s.info.sexo)
  const setStep = useEvaluacion(s => s.setStep)

  const results = useMemo(() => {
    const out: Partial<Record<Method, ReturnType<typeof summarizeOne>>> = {}
    for (const m of metodos) {
      out[m] = summarizeOne(m, { reba, rula, owas, niosh, mmc }, sexo)
    }
    return out
  }, [metodos, reba, rula, owas, niosh, mmc, sexo])

  return (
    <Card title="📊 Resumen de Riesgo Ergonómico">
      {metodos.length === 0 ? (
        <p className="text-sm text-ergo-muted">
          No has seleccionado métodos en el Paso 1.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3.5">
          {metodos.map(m => {
            const r = results[m]
            if (!r) return null
            return (
              <div
                key={m}
                className="bg-ergo-bg border-2 rounded-xl p-4"
                style={{ borderColor: `${riskColor(r.level)}55` }}
              >
                <div className="font-extrabold text-base text-ergo-orange mb-2">{m}</div>
                <Badge level={r.level} text={r.headline} />
                <div className="text-[11px] text-ergo-muted mt-1.5">{r.detail}</div>
              </div>
            )
          })}
        </div>
      )}

      <Nav
        onBack={() => setStep(2)}
        onNext={() => setStep(4)}
        nextLabel="Generar informe →"
      />
    </Card>
  )
}

function riskColor(level: number): string {
  return ['#22C55E', '#84CC16', '#EAB308', '#F97316', '#EF4444'][level] ?? '#EF4444'
}

interface AllInputs {
  reba: ReturnType<typeof useEvaluacion.getState>['reba']
  rula: ReturnType<typeof useEvaluacion.getState>['rula']
  owas: ReturnType<typeof useEvaluacion.getState>['owas']
  niosh: ReturnType<typeof useEvaluacion.getState>['niosh']
  mmc: ReturnType<typeof useEvaluacion.getState>['mmc']
}

function summarizeOne(m: Method, inputs: AllInputs, sexo: 'masculino' | 'femenino') {
  if (m === 'REBA') {
    const r = calcReba(inputs.reba)
    return { level: r.level, headline: `Score ${r.fin}/15`, detail: `A:${r.sA} · B:${r.sB} · C:${r.sC}` }
  }
  if (m === 'RULA') {
    const r = calcRula(inputs.rula)
    return { level: r.level, headline: `Score ${r.fin}`, detail: `A:${r.sA} · B:${r.sB}` }
  }
  if (m === 'OWAS') {
    const r = calcOwas(inputs.owas)
    return { level: r.level, headline: `Cat.${r.cat} · Código ${r.code}`, detail: r.action }
  }
  if (m === 'NIOSH') {
    const r = calcNiosh(inputs.niosh)
    return { level: r.level, headline: `LI = ${r.LI.toFixed(2)}`, detail: `RWL = ${r.RWL.toFixed(2)} kg` }
  }
  // MMC
  const r = calcMmc(inputs.mmc, sexo)
  return {
    level: r.level,
    headline: `${inputs.mmc.peso}kg · Lím: ${r.limAp}kg`,
    detail: r.exc > 0
      ? `Excede ${r.exc.toFixed(1)}kg · ${r.nF} factor(es)`
      : `Dentro del límite · ${r.nF} factor(es)`,
  }
}

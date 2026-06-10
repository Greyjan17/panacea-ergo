import { useMemo } from 'react'
import { Card, Chk, Num, Sel } from '@/components/ui'
import { calcMmc, type FactorMMC, type MMCInput } from '@/lib/calc/mmc'
import { ISO_11228, RM_375 } from '@/lib/norma'
import { RISK_LEVEL_NAME } from '@/types/ergo'
import { useEvaluacion } from '@/store/useEvaluacion'

const FACTORES: ReadonlyArray<{ id: FactorMMC; label: string }> = [
  { id: 'peso', label: 'Peso excede límite normativo' },
  { id: 'freq', label: 'Alta frecuencia >4/min o >2h' },
  { id: 'dist', label: 'Distancia horizontal >50cm' },
  { id: 'alt', label: 'Encima hombros o bajo rodillas' },
  { id: 'asim', label: 'Torsión de tronco al levantar' },
  { id: 'agr', label: 'Agarre deficiente (sin asas)' },
  { id: 'esp', label: 'Espacio de trabajo restringido' },
  { id: 'ines', label: 'Carga inestable' },
  { id: 'sue', label: 'Superficie inestable' },
  { id: 'eq', label: 'Sin ayudas mecánicas' },
]

const RISK_COLOR: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: '#22C55E', 1: '#84CC16', 2: '#EAB308', 3: '#F97316', 4: '#EF4444',
}

export function MMCPanel() {
  const mmc = useEvaluacion(s => s.mmc)
  const sexo = useEvaluacion(s => s.info.sexo)
  const setMmc = useEvaluacion(s => s.setMmc)
  const result = useMemo(() => calcMmc(mmc, sexo), [mmc, sexo])

  const u = <K extends keyof MMCInput>(k: K, v: MMCInput[K]) => setMmc({ [k]: v } as Partial<MMCInput>)

  const toggleFactor = (id: FactorMMC) => {
    const next = mmc.factores.includes(id)
      ? mmc.factores.filter(x => x !== id)
      : [...mmc.factores, id]
    setMmc({ factores: next })
  }

  const ringColor = RISK_COLOR[result.level]

  return (
    <Card title="⚖️ MMC — Manejo Manual de Cargas">
      <div className="bg-orange-50 border border-ergo-orange/30 rounded-lg px-3.5 py-2.5 mb-3 text-xs text-ergo-mid">
        <strong className="text-ergo-orange">Normativa:</strong> RM N° 375-2008-TR · ISO 11228-1.
        Límite {sexo === 'femenino' ? 'mujer' : 'varón'}:{' '}
        <strong>{RM_375[sexo].general}kg</strong> (entrenado:{' '}
        {RM_375[sexo].entrenado}kg). ISO 11228-1 ({mmc.frec}): <strong>{result.limISO}kg</strong>.
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Num label="Peso real de la carga [kg]" value={mmc.peso} onChange={v => u('peso', v)} min={0} max={300} />
          <Sel
            label="Grupo del trabajador" value={mmc.grupo}
            onChange={v => u('grupo', v)}
            options={ISO_11228.map(x => [x.grupo, x.grupo] as const)}
          />
          <Sel
            label="Frecuencia de exposición" value={mmc.frec}
            onChange={v => u('frec', v as MMCInput['frec'])}
            options={[
              ['ocasional', 'Ocasional (<1/5min)'],
              ['frecuente', 'Frecuente (1-4/min)'],
              ['muyFrecuente', 'Muy frecuente (>4/min)'],
            ] as const}
          />
          <Sel
            label="Capacitación MMC" value={mmc.form}
            onChange={v => u('form', v as MMCInput['form'])}
            options={[['no', 'No — sin capacitación'], ['si', 'Sí — capacitado']] as const}
          />
        </div>
        <div>
          <div className="text-[11px] font-bold text-ergo-orange uppercase mb-1.5">
            Factores de riesgo adicionales
          </div>
          {FACTORES.map(f => (
            <Chk
              key={f.id} label={f.label}
              value={mmc.factores.includes(f.id)}
              onChange={() => toggleFactor(f.id)}
            />
          ))}
        </div>
      </div>

      {mmc.peso > 0 && (
        <div
          className="mt-3 p-3.5 rounded-xl border-2"
          style={{ background: `${ringColor}15`, borderColor: ringColor }}
        >
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={
                result.cumRM
                  ? { background: '#dcfce7', color: '#166534' }
                  : { background: '#fee2e2', color: '#991b1b' }
              }
            >
              RM 375: {result.cumRM ? '✓ CUMPLE' : '✗ INCUMPLE'} · {result.limRM}kg
            </span>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={
                result.cumISO
                  ? { background: '#dcfce7', color: '#166534' }
                  : { background: '#fee2e2', color: '#991b1b' }
              }
            >
              ISO 11228 ({mmc.frec}): {result.cumISO ? '✓ CUMPLE' : '✗ INCUMPLE'} · {result.limISO}kg
            </span>
          </div>
          <div className="font-extrabold text-[15px]" style={{ color: ringColor }}>
            {mmc.peso}kg — Límite RM 375: {result.limAp}kg
            {result.exc > 0
              ? ` — EXCEDE ${result.exc.toFixed(1)}kg (${result.pct.toFixed(0)}%)`
              : ' — DENTRO DEL LÍMITE'}
          </div>
          <div className="text-xs text-ergo-muted mt-1">
            Trabajador entrenado puede cargar hasta {result.limEnt}kg (RM 375 Art.4)
          </div>
          <div className="text-[13px] mt-1.5">
            Riesgo MMC:{' '}
            <strong style={{ color: ringColor }}>
              {RISK_LEVEL_NAME[result.level].toUpperCase()}
            </strong>{' '}
            · {result.nF} factor(es) adicional(es)
          </div>
          {mmc.form === 'no' && (
            <div className="mt-1.5 text-xs text-ergo-orange font-semibold">
              ⚠ Sin capacitación — agravante RM 375 Art.6
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

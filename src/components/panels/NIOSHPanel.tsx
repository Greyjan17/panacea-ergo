import { useMemo } from 'react'
import { Badge, Card, Num, Sel } from '@/components/ui'
import { calcNiosh, type NIOSHInput } from '@/lib/calc/niosh'
import { useEvaluacion } from '@/store/useEvaluacion'

export function NIOSHPanel() {
  const niosh = useEvaluacion(s => s.niosh)
  const setNiosh = useEvaluacion(s => s.setNiosh)
  const result = useMemo(() => calcNiosh(niosh), [niosh])

  const u = <K extends keyof NIOSHInput>(k: K, v: NIOSHInput[K]) => setNiosh({ [k]: v } as Partial<NIOSHInput>)

  return (
    <Card title="NIOSH — Ecuación de Levantamiento">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Num label="Peso L [kg]" value={niosh.L} onChange={v => u('L', v)} min={0} max={200} />
          <Num label="Distancia horizontal H [cm]" value={niosh.H} onChange={v => u('H', v)} min={1} max={100} />
          <Num label="Altura vertical V [cm]" value={niosh.V} onChange={v => u('V', v)} min={0} max={175} />
          <Num label="Desplazamiento D [cm]" value={niosh.D} onChange={v => u('D', v)} min={1} max={175} />
        </div>
        <div>
          <Num label="Ángulo asimetría A [°]" value={niosh.A} onChange={v => u('A', v)} min={0} max={135} />
          <Num label="Frecuencia F [lev/min]" value={niosh.F} onChange={v => u('F', v)} min={0} max={15} step={0.1} />
          <Sel
            label="Duración" value={niosh.dur}
            onChange={v => u('dur', v as NIOSHInput['dur'])}
            options={[['<1h', '< 1 hora'], ['1-2h', '1-2 horas'], ['2-8h', '2-8 horas']] as const}
          />
          <Sel
            label="Acoplamiento" value={niosh.coup}
            onChange={v => u('coup', v as NIOSHInput['coup'])}
            options={[['good', 'Bueno'], ['fair', 'Regular'], ['poor', 'Pobre']] as const}
          />
        </div>
      </div>

      <div className="grid grid-cols-6 gap-1.5 bg-ergo-bg rounded-lg p-2.5 mt-2">
        {(
          [
            ['HM', result.HM], ['VM', result.VM], ['DM', result.DM],
            ['AM', result.AM], ['FM', result.FM], ['CM', result.CM],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="text-center text-[11px]">
            <strong>{k}</strong>
            <br />
            {v.toFixed(3)}
          </div>
        ))}
      </div>

      <Badge level={result.level} text={`LI = ${result.LI.toFixed(2)}`} />
      <div className="text-xs text-ergo-muted mt-1">RWL = {result.RWL.toFixed(2)} kg</div>
    </Card>
  )
}

import { useMemo } from 'react'
import { Badge, Card, Chk, Sec, Sel } from '@/components/ui'
import { calcReba, type REBAInput } from '@/lib/calc/reba'
import { useEvaluacion } from '@/store/useEvaluacion'

export function REBAPanel() {
  const reba = useEvaluacion(s => s.reba)
  const setReba = useEvaluacion(s => s.setReba)
  const result = useMemo(() => calcReba(reba), [reba])

  const u = <K extends keyof REBAInput>(k: K, v: REBAInput[K]) => setReba({ [k]: v } as Partial<REBAInput>)

  return (
    <Card title="REBA — Rapid Entire Body Assessment">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Sec title="Cuello" />
          <Sel
            label="Posición" value={reba.neck}
            onChange={v => u('neck', v as REBAInput['neck'])}
            options={[[1, '1·0-20°'], [2, '2·>20° o ext']] as const}
          />
          <Chk label="Torsión" value={reba.neckT} onChange={v => u('neckT', v)} />
          <Chk label="Inclinación lateral" value={reba.neckS} onChange={v => u('neckS', v)} />

          <Sec title="Tronco" />
          <Sel
            label="Posición" value={reba.trunk}
            onChange={v => u('trunk', v as REBAInput['trunk'])}
            options={[[1, '1·Erecto'], [2, '2·0-20°'], [3, '3·20-60°'], [4, '4·>60°']] as const}
          />
          <Chk label="Torsión" value={reba.trunkT} onChange={v => u('trunkT', v)} />
          <Chk label="Inclinación" value={reba.trunkS} onChange={v => u('trunkS', v)} />

          <Sec title="Piernas" />
          <Sel
            label="Posición" value={reba.legs}
            onChange={v => u('legs', v as REBAInput['legs'])}
            options={[
              [1, '1·Bilateral'], [2, '2·Unilateral'],
              [3, '3·Flex 30-60°'], [4, '4·Flex >60°'],
            ] as const}
          />

          <Sec title="Carga" />
          <Sel
            label="Peso" value={reba.load}
            onChange={v => u('load', v as REBAInput['load'])}
            options={[[0, '0·<5kg'], [1, '1·5-10kg'], [2, '2·>10kg']] as const}
          />
          <Chk label="+1 Fuerza brusca" value={reba.shock} onChange={v => u('shock', v)} />
        </div>

        <div>
          <Sec title="Brazo Superior" />
          <Sel
            label="Posición" value={reba.ua}
            onChange={v => u('ua', v as REBAInput['ua'])}
            options={[
              [1, '1·-20/20°'], [2, '2·20-45°'], [3, '3·45-90°'], [4, '4·>90°'],
            ] as const}
          />
          <Chk label="Hombro elevado" value={reba.shr} onChange={v => u('shr', v)} />
          <Chk label="Abducido" value={reba.abd} onChange={v => u('abd', v)} />
          <Chk label="Apoyado (resta 1)" value={reba.sup} onChange={v => u('sup', v)} />

          <Sec title="Brazo Inferior" />
          <Sel
            label="Posición" value={reba.la}
            onChange={v => u('la', v as REBAInput['la'])}
            options={[[1, '1·60-100°'], [2, '2·Fuera rango']] as const}
          />

          <Sec title="Muñeca" />
          <Sel
            label="Posición" value={reba.wrist}
            onChange={v => u('wrist', v as REBAInput['wrist'])}
            options={[[1, '1·0-15°'], [2, '2·>15°']] as const}
          />
          <Chk label="Torsión" value={reba.wristT} onChange={v => u('wristT', v)} />

          <Sec title="Modificadores" />
          <Sel
            label="Acoplamiento" value={reba.coup}
            onChange={v => u('coup', v as REBAInput['coup'])}
            options={[
              [0, '0·Bueno'], [1, '1·Regular'], [2, '2·Malo'], [3, '3·Inaceptable'],
            ] as const}
          />
          <Sel
            label="Actividad" value={reba.act}
            onChange={v => u('act', v as REBAInput['act'])}
            options={[
              [0, '0·Normal'], [1, '1·Estático'], [2, '2·Repetitivo'], [3, '3·Cambios rápidos'],
            ] as const}
          />
        </div>
      </div>
      <Badge level={result.level} text={`Score ${result.fin}/15`} />
      <div className="text-xs text-ergo-muted mt-1">
        A:{result.sA} · B:{result.sB} · C:{result.sC}
      </div>
    </Card>
  )
}

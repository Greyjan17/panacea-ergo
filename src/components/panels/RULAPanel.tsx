import { useMemo } from 'react'
import { Badge, Card, Chk, Sec, Sel } from '@/components/ui'
import { calcRula, type RULAInput } from '@/lib/calc/rula'
import { useEvaluacion } from '@/store/useEvaluacion'

export function RULAPanel() {
  const rula = useEvaluacion(s => s.rula)
  const setRula = useEvaluacion(s => s.setRula)
  const result = useMemo(() => calcRula(rula), [rula])

  const u = <K extends keyof RULAInput>(k: K, v: RULAInput[K]) => setRula({ [k]: v } as Partial<RULAInput>)

  return (
    <Card title="RULA — Rapid Upper Limb Assessment">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Sec title="Grupo A" />
          <Sel
            label="Brazo superior" value={rula.ua}
            onChange={v => u('ua', v as RULAInput['ua'])}
            options={[
              [1, '1·-20/20°'], [2, '2·20-45°'], [3, '3·45-90°'], [4, '4·>90°'],
            ] as const}
          />
          <Chk label="Hombro elevado" value={rula.shr} onChange={v => u('shr', v)} />
          <Chk label="Apoyado" value={rula.sup} onChange={v => u('sup', v)} />
          <Sel
            label="Brazo inferior" value={rula.la}
            onChange={v => u('la', v as RULAInput['la'])}
            options={[[1, '1·60-100°'], [2, '2·Fuera rango']] as const}
          />
          <Chk label="Línea media" value={rula.mid} onChange={v => u('mid', v)} />
          <Sel
            label="Muñeca" value={rula.wrist}
            onChange={v => u('wrist', v as RULAInput['wrist'])}
            options={[[1, '1·Neutra'], [2, '2·0-15°'], [3, '3·>15°']] as const}
          />
          <Chk label="Torsión muñeca" value={rula.wristT} onChange={v => u('wristT', v)} />
          <Sel
            label="Músculo A" value={rula.mA}
            onChange={v => u('mA', v as RULAInput['mA'])}
            options={[[0, '0·Normal'], [1, '1·Estático']] as const}
          />
          <Sel
            label="Fuerza A" value={rula.fA}
            onChange={v => u('fA', v as RULAInput['fA'])}
            options={[
              [0, '0·<2kg'], [1, '1·2-10kg'], [2, '2·>10kg'], [3, '3·Brusco'],
            ] as const}
          />
        </div>

        <div>
          <Sec title="Grupo B" />
          <Sel
            label="Cuello" value={rula.neck}
            onChange={v => u('neck', v as RULAInput['neck'])}
            options={[
              [1, '1·0-10°'], [2, '2·10-20°'], [3, '3·>20°'], [4, '4·Ext'],
            ] as const}
          />
          <Chk label="Torsión" value={rula.neckT} onChange={v => u('neckT', v)} />
          <Chk label="Inclinación" value={rula.neckS} onChange={v => u('neckS', v)} />
          <Sel
            label="Tronco" value={rula.trunk}
            onChange={v => u('trunk', v as RULAInput['trunk'])}
            options={[
              [1, '1·Erecto'], [2, '2·0-20°'], [3, '3·20-60°'], [4, '4·>60°'],
            ] as const}
          />
          <Chk label="Torsión" value={rula.trunkT} onChange={v => u('trunkT', v)} />
          <Chk label="Inclinación" value={rula.trunkS} onChange={v => u('trunkS', v)} />
          <Sel
            label="Piernas" value={rula.legs}
            onChange={v => u('legs', v as RULAInput['legs'])}
            options={[[1, '1·Bilateral'], [2, '2·Unilateral']] as const}
          />
          <Sel
            label="Músculo B" value={rula.mB}
            onChange={v => u('mB', v as RULAInput['mB'])}
            options={[[0, '0·Normal'], [1, '1·Estático']] as const}
          />
          <Sel
            label="Fuerza B" value={rula.fB}
            onChange={v => u('fB', v as RULAInput['fB'])}
            options={[
              [0, '0·<2kg'], [1, '1·2-10kg'], [2, '2·>10kg'], [3, '3·Brusco'],
            ] as const}
          />
        </div>
      </div>
      <Badge level={result.level} text={`Score ${result.fin}`} />
      <div className="text-xs text-ergo-muted mt-1">A:{result.sA} · B:{result.sB}</div>
    </Card>
  )
}

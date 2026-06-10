import { useMemo } from 'react'
import { Badge, Card, Sel } from '@/components/ui'
import { calcOwas, type OWASInput } from '@/lib/calc/owas'
import { useEvaluacion } from '@/store/useEvaluacion'

export function OWASPanel() {
  const owas = useEvaluacion(s => s.owas)
  const setOwas = useEvaluacion(s => s.setOwas)
  const result = useMemo(() => calcOwas(owas), [owas])

  const u = <K extends keyof OWASInput>(k: K, v: OWASInput[K]) => setOwas({ [k]: v } as Partial<OWASInput>)

  return (
    <Card title="OWAS — Ovako Working Posture Analysis">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Sel
            label="Espalda" value={owas.back}
            onChange={v => u('back', v as OWASInput['back'])}
            options={[
              [1, '1·Recta'], [2, '2·Doblada'],
              [3, '3·Girada'], [4, '4·Doblada+girada'],
            ] as const}
          />
          <Sel
            label="Brazos" value={owas.arms}
            onChange={v => u('arms', v as OWASInput['arms'])}
            options={[
              [1, '1·Bajo hombros'], [2, '2·Uno sobre'], [3, '3·Ambos sobre'],
            ] as const}
          />
        </div>
        <div>
          <Sel
            label="Piernas" value={owas.legs}
            onChange={v => u('legs', v as OWASInput['legs'])}
            options={[
              [1, '1·Sentado'], [2, '2·De pie'], [3, '3·Peso en una'],
              [4, '4·Flex rodillas'], [5, '5·Una rodilla'],
              [6, '6·Arrodillado'], [7, '7·Caminando'],
            ] as const}
          />
          <Sel
            label="Carga" value={owas.load}
            onChange={v => u('load', v as OWASInput['load'])}
            options={[[1, '1·<10kg'], [2, '2·10-20kg'], [3, '3·>20kg']] as const}
          />
        </div>
      </div>
      <Badge level={result.level} text={`Cat.${result.cat} · Código ${result.code}`} />
      <div className="text-xs text-ergo-muted mt-1">{result.action}</div>
    </Card>
  )
}

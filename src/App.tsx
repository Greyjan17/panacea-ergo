import { useMemo, useState } from 'react'
import { Badge, Btn, Card, Chk, Num, Sec, Sel } from '@/components/ui'
import { calcReba, type REBAInput } from '@/lib/calc/reba'

const DEFAULT_REBA: REBAInput = {
  neck: 1, neckT: false, neckS: false,
  trunk: 1, trunkT: false, trunkS: false,
  legs: 1, load: 0, shock: false,
  ua: 1, shr: false, abd: false, sup: false,
  la: 1, wrist: 1, wristT: false,
  coup: 0, act: 0,
}

export function App() {
  const [reba, setReba] = useState<REBAInput>(DEFAULT_REBA)
  // useMemo evita re-cálculo en cada render cuando un estado no relacionado cambia.
  const result = useMemo(() => calcReba(reba), [reba])
  const u = <K extends keyof REBAInput>(k: K, v: REBAInput[K]) =>
    setReba(p => ({ ...p, [k]: v }))

  return (
    <main className="min-h-screen p-5 max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-ergo-header to-ergo-orange rounded-2xl p-6 mb-5 shadow-[0_4px_20px_rgba(139,69,19,0.3)]">
        <div className="text-[11px] text-white/75 font-semibold tracking-widest uppercase mb-1">
          PANACEA MEDICINA OCUPACIONAL
        </div>
        <div className="text-[22px] font-extrabold text-white leading-tight">
          ERGO v3 — Demo F3 (componentes UI)
        </div>
        <div className="text-xs text-white/80 mt-1">
          Dr. W. Ochoa Cuadros · CMP 102517 · RNE/RNA 13334
        </div>
      </div>

      <Card title="REBA — Demo de componentes UI tipados">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Sec title="Cuello" />
            <Sel
              label="Posición"
              value={reba.neck}
              onChange={v => u('neck', v as REBAInput['neck'])}
              options={[[1, '1·0-20°'], [2, '2·>20° o ext']] as const}
            />
            <Chk label="Torsión" value={reba.neckT} onChange={v => u('neckT', v)} />
            <Chk label="Inclinación lateral" value={reba.neckS} onChange={v => u('neckS', v)} />

            <Sec title="Tronco" />
            <Sel
              label="Posición"
              value={reba.trunk}
              onChange={v => u('trunk', v as REBAInput['trunk'])}
              options={[
                [1, '1·Erecto'], [2, '2·0-20°'], [3, '3·20-60°'], [4, '4·>60°'],
              ] as const}
            />
            <Chk label="Torsión" value={reba.trunkT} onChange={v => u('trunkT', v)} />
            <Chk label="Inclinación" value={reba.trunkS} onChange={v => u('trunkS', v)} />

            <Sec title="Carga" />
            <Sel
              label="Peso"
              value={reba.load}
              onChange={v => u('load', v as REBAInput['load'])}
              options={[[0, '0·<5kg'], [1, '1·5-10kg'], [2, '2·>10kg']] as const}
            />
            <Chk label="+1 Fuerza brusca" value={reba.shock} onChange={v => u('shock', v)} />
          </div>

          <div>
            <Sec title="Brazo Superior" />
            <Sel
              label="Posición"
              value={reba.ua}
              onChange={v => u('ua', v as REBAInput['ua'])}
              options={[
                [1, '1·-20/20°'], [2, '2·20-45°'], [3, '3·45-90°'], [4, '4·>90°'],
              ] as const}
            />
            <Chk label="Hombro elevado" value={reba.shr} onChange={v => u('shr', v)} />
            <Chk label="Abducido" value={reba.abd} onChange={v => u('abd', v)} />
            <Chk label="Apoyado (resta 1)" value={reba.sup} onChange={v => u('sup', v)} />

            <Sec title="Modificadores" />
            <Sel
              label="Acoplamiento"
              value={reba.coup}
              onChange={v => u('coup', v as REBAInput['coup'])}
              options={[[0, '0·Bueno'], [1, '1·Regular'], [2, '2·Malo'], [3, '3·Inaceptable']] as const}
            />
            <Sel
              label="Actividad"
              value={reba.act}
              onChange={v => u('act', v as REBAInput['act'])}
              options={[
                [0, '0·Normal'], [1, '1·Estático'], [2, '2·Repetitivo'], [3, '3·Cambios rápidos'],
              ] as const}
            />

            <div className="mt-4 text-[11px] text-ergo-muted">
              Demo de validación: inputs tipados → cálculo puro → Badge de riesgo.
            </div>
            <div className="text-[11px] text-ergo-muted">
              A:{result.sA} · B:{result.sB} · C:{result.sC} · Final:{result.fin}/15
            </div>
            <Badge level={result.level} text={`Score REBA ${result.fin}/15`} />
            <div className="mt-3 flex gap-2">
              <Btn label="Resetear" variant="outline" onClick={() => setReba(DEFAULT_REBA)} />
              <Num
                label="Demo Num"
                value={0}
                onChange={() => undefined}
                min={0}
                max={10}
              />
            </div>
          </div>
        </div>
      </Card>
    </main>
  )
}

import { describe, expect, it } from 'vitest'
import { calcReba, rebaPiernas, type REBAInput } from '@/lib/calc/reba'

const base: REBAInput = {
  neck: 1, neckT: false, neckS: false,
  trunk: 1, trunkT: false, trunkS: false,
  legs: 1, load: 0, shock: false,
  ua: 1, shr: false, abd: false, sup: false,
  la: 1, wrist: 1, wristT: false,
  coup: 0, act: 0,
}

describe('REBA', () => {
  it('postura totalmente erguida sin carga → nivel 0 (inapreciable)', () => {
    const r = calcReba(base)
    expect(r.fin).toBe(1)
    expect(r.level).toBe(0)
  })

  it('worst-case con todos los agravantes → score saturado a 15', () => {
    const r = calcReba({
      neck: 2, neckT: true, neckS: true,
      trunk: 4, trunkT: true, trunkS: true,
      legs: 2, knee: 2, load: 2, shock: true,
      ua: 6, shr: true, abd: true, sup: false,
      la: 2, wrist: 3, wristT: true,
      coup: 3, act: 3, actStatic: true, actRepeat: true, actRapid: true,
    })
    expect(r.fin).toBe(15)
    expect(r.level).toBe(4)
  })

  it('flexión tronco 20-60° + carga >10kg + brazo 45-90° → nivel medio', () => {
    const r = calcReba({ ...base, trunk: 3, load: 2, ua: 3 })
    expect(r.fin).toBeGreaterThanOrEqual(4)
    expect(r.fin).toBeLessThanOrEqual(7)
    expect(r.level).toBe(2)
  })

  it('brazo elevado >90° + carga >10kg + shock → nivel medio', () => {
    const r = calcReba({ ...base, ua: 4, load: 2, shock: true })
    expect(r.level).toBeGreaterThanOrEqual(2)
  })

  it('brazo apoyado (sup=true) reduce el score vs sin apoyo', () => {
    const conApoyo = calcReba({ ...base, ua: 3, sup: true })
    const sinApoyo = calcReba({ ...base, ua: 3, sup: false })
    expect(conApoyo.fin).toBeLessThanOrEqual(sinApoyo.fin)
  })

  it('actividad: cada condición suma +1 (Hignett & McAtamney 2000)', () => {
    const sin = calcReba({ ...base, trunk: 3 })
    expect(calcReba({ ...base, trunk: 3, actRepeat: true }).fin).toBe(sin.fin + 1)
    expect(calcReba({ ...base, trunk: 3, actRapid: true }).fin).toBe(sin.fin + 1)
    expect(calcReba({ ...base, trunk: 3, actStatic: true, actRepeat: true, actRapid: true }).fin).toBe(sin.fin + 3)
  })

  it('actividad en registros antiguos (selección única 1-3) equivale a +1', () => {
    const sin = calcReba({ ...base, trunk: 3 })
    expect(calcReba({ ...base, trunk: 3, act: 2 }).fin).toBe(sin.fin + 1)
    expect(calcReba({ ...base, trunk: 3, act: 3 }).fin).toBe(sin.fin + 1)
  })

  it('piernas = apoyo + flexión de rodillas', () => {
    expect(rebaPiernas({ legs: 1, knee: 0 }).score).toBe(1)
    expect(rebaPiernas({ legs: 1, knee: 1 }).score).toBe(2) // bilateral, rodillas 30-60°
    expect(rebaPiernas({ legs: 1, knee: 2 }).score).toBe(3) // bilateral, rodillas >60°
    expect(rebaPiernas({ legs: 2, knee: 1 }).score).toBe(3)
    expect(rebaPiernas({ legs: 2, knee: 2 }).score).toBe(4)
  })

  it('piernas en registros antiguos (código 3-4) conservan su puntaje y quedan marcadas', () => {
    expect(rebaPiernas({ legs: 3 })).toEqual({ base: null, rodillas: 1, score: 3, legado: true })
    expect(rebaPiernas({ legs: 4 })).toEqual({ base: null, rodillas: 2, score: 4, legado: true })
  })

  it('niveles de riesgo respetan los rangos publicados (fin → level)', () => {
    // Validamos la función de mapeo de score → level usando casos calibrados
    expect(calcReba(base).level).toBe(0)                                                 // fin=1
    expect(calcReba({ ...base, trunk: 3, load: 2, ua: 3 }).level).toBe(2)                // fin=4..7
    expect(calcReba({ ...base, trunk: 4, load: 2, ua: 4, neck: 2, legs: 3 }).level).toBeGreaterThanOrEqual(3) // fin>=8
  })
})

// Valores de referencia: Hignett S, McAtamney L. Applied Ergonomics 2000;31:201-205.
describe('REBA — reglas de referencia', () => {
  it('torsión + inclinación lateral del tronco suman +1 (no +2)', () => {
    const una = calcReba({ ...base, trunk: 2, trunkT: true })
    const ambas = calcReba({ ...base, trunk: 2, trunkT: true, trunkS: true })
    expect(ambas.sA).toBe(una.sA)
  })

  it('torsión + inclinación lateral del cuello suman +1 (no +2)', () => {
    const una = calcReba({ ...base, neck: 1, neckS: true })
    const ambas = calcReba({ ...base, neck: 1, neckT: true, neckS: true })
    expect(ambas.sA).toBe(una.sA)
  })

  it('Tabla C: A=6, B=9 → 9', () => {
    // A=6: tronco 5 (4+torsión), cuello 1, piernas 2 → Tabla A 6
    // B=9: brazo 6 (4+hombro+abd), antebrazo 2, muñeca 3 (2+torsión) → Tabla B 9
    const r = calcReba({
      ...base,
      trunk: 4, trunkT: true, legs: 2,
      ua: 4, shr: true, abd: true, la: 2, wrist: 2, wristT: true,
    })
    expect(r.sA).toBe(6)
    expect(r.sB).toBe(9)
    expect(r.sC).toBe(9)
  })
})

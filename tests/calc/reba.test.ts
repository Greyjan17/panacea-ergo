import { describe, expect, it } from 'vitest'
import { calcReba, type REBAInput } from '@/lib/calc/reba'

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
      legs: 4, load: 2, shock: true,
      ua: 6, shr: true, abd: true, sup: false,
      la: 2, wrist: 3, wristT: true,
      coup: 3, act: 3,
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

  it('actividad repetitiva +2 incrementa el score final', () => {
    const sin = calcReba({ ...base, trunk: 3 })
    const con = calcReba({ ...base, trunk: 3, act: 2 })
    expect(con.fin).toBe(sin.fin + 2)
  })

  it('niveles de riesgo respetan los rangos publicados (fin → level)', () => {
    // Validamos la función de mapeo de score → level usando casos calibrados
    expect(calcReba(base).level).toBe(0)                                                 // fin=1
    expect(calcReba({ ...base, trunk: 3, load: 2, ua: 3 }).level).toBe(2)                // fin=4..7
    expect(calcReba({ ...base, trunk: 4, load: 2, ua: 4, neck: 2, legs: 3 }).level).toBeGreaterThanOrEqual(3) // fin>=8
  })
})

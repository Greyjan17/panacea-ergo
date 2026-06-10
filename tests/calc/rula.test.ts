import { describe, expect, it } from 'vitest'
import { calcRula, type RULAInput } from '@/lib/calc/rula'

const base: RULAInput = {
  ua: 1, shr: false, sup: false,
  la: 1, mid: false,
  wrist: 1, wristT: false,
  mA: 0, fA: 0,
  neck: 1, neckT: false, neckS: false,
  trunk: 1, trunkT: false, trunkS: false,
  legs: 1, mB: 0, fB: 0,
}

describe('RULA', () => {
  it('postura óptima → score bajo, aceptable', () => {
    const r = calcRula(base)
    expect(r.fin).toBeLessThanOrEqual(2)
    expect(r.level).toBe(0)
  })

  it('worst-case con todos los agravantes → score 7', () => {
    const r = calcRula({
      ua: 4, shr: true, sup: false,
      la: 2, mid: true,
      wrist: 3, wristT: true,
      mA: 1, fA: 3,
      neck: 4, neckT: true, neckS: true,
      trunk: 4, trunkT: true, trunkS: true,
      legs: 2, mB: 1, fB: 3,
    })
    expect(r.fin).toBe(7)
    expect(r.level).toBe(4)
  })

  it('flexión brazo + neck → al menos investigar (nivel 1+)', () => {
    const r = calcRula({ ...base, ua: 3, neck: 3 })
    expect(r.level).toBeGreaterThanOrEqual(1)
  })

  it('fuerza A >10kg incrementa el score A', () => {
    const sin = calcRula({ ...base, ua: 2 })
    const con = calcRula({ ...base, ua: 2, fA: 2 })
    expect(con.sA).toBe(sin.sA + 2)
  })

  it('brazo apoyado reduce el score A', () => {
    const sin = calcRula({ ...base, ua: 3, sup: false })
    const con = calcRula({ ...base, ua: 3, sup: true })
    expect(con.sA).toBeLessThanOrEqual(sin.sA)
  })
})

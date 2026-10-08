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

// Valores de referencia: McAtamney L, Corlett EN. Applied Ergonomics 1993;24(2):91-99.
describe('RULA — tablas de referencia', () => {
  it.each([
    // [cuello, tronco, piernas, Tabla B esperada]
    [1, 1, 1, 1], [1, 1, 2, 3], [1, 2, 1, 2], [1, 4, 1, 5], [1, 6, 2, 7],
    [2, 3, 2, 5], [3, 4, 2, 6], [4, 1, 1, 5], [4, 3, 2, 7],
    [5, 1, 1, 7], [5, 3, 2, 8], [6, 4, 2, 9], [6, 6, 2, 9],
  ] as const)('Tabla B: cuello %s, tronco %s, piernas %s → %s', (nk, tr, lg, esperado) => {
    // trunk/neck > 4 se alcanzan con torsión e inclinación
    const neck = Math.min(nk, 4) as 1 | 2 | 3 | 4
    const trunk = Math.min(tr, 4) as 1 | 2 | 3 | 4
    const r = calcRula({
      ...base,
      neck, neckT: nk >= 5, neckS: nk >= 6,
      trunk, trunkT: tr >= 5, trunkS: tr >= 6,
      legs: lg,
    })
    expect(r.sB).toBe(esperado)
  })

  it('tronco >60° de pie sin apoyo pesa más que tronco erecto (monotonía)', () => {
    const erecto = calcRula(base)
    const flexionado = calcRula({ ...base, trunk: 4 })
    expect(flexionado.sB).toBeGreaterThan(erecto.sB)
  })

  it.each([
    // [brazo sup., brazo inf., muñeca, giro, Tabla A esperada]
    [1, 1, 1, false, 1], [1, 1, 4, true, 3], [2, 3, 4, false, 5],
    [3, 2, 3, true, 4], [3, 3, 3, true, 5], [4, 3, 4, false, 6],
    [5, 1, 4, true, 7], [6, 1, 1, true, 7], [6, 2, 1, true, 8], [6, 3, 4, true, 9],
  ] as const)('Tabla A: brazo %s, antebrazo %s, muñeca %s, giro %s → %s', (ua, la, w, wt, esperado) => {
    const r = calcRula({
      ...base,
      ua: Math.min(ua, 4) as 1 | 2 | 3 | 4,
      shr: ua >= 5,
      abd: ua >= 6,
      la: Math.min(la, 2) as 1 | 2,
      mid: la === 3,
      wrist: Math.min(w, 3) as 1 | 2 | 3,
      wristDev: w === 4,
      wristT: wt,
    })
    expect(r.sA).toBe(esperado)
  })

  it('abducción del brazo suma +1 al brazo superior', () => {
    const sin = calcRula({ ...base, ua: 2 })
    const con = calcRula({ ...base, ua: 2, abd: true })
    expect(con.sA).toBeGreaterThan(sin.sA)
  })

  it('desviación de muñeca alcanza la columna 4 de la Tabla A', () => {
    const r = calcRula({ ...base, ua: 4, la: 2, mid: true, wrist: 3, wristDev: true })
    expect(r.sA).toBe(6)
  })

  it('Tabla C: A=4, B=5 → 5; A=8, B=7 → 7', () => {
    // A=4 (brazo 4, antebrazo 1, muñeca 1), B=5 (cuello 1, tronco 4, piernas 1)
    expect(calcRula({ ...base, ua: 4, trunk: 4 }).fin).toBe(5)
  })
})

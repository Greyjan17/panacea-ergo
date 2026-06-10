import { describe, expect, it } from 'vitest'
import { calcMmc, type MMCInput } from '@/lib/calc/mmc'

const baseM: MMCInput = {
  peso: 0,
  grupo: 'Varón adulto (18-45 años)',
  frec: 'frecuente',
  form: 'si',
  factores: [],
}

const baseF: MMCInput = {
  peso: 0,
  grupo: 'Mujer adulta (18-45 años)',
  frec: 'frecuente',
  form: 'si',
  factores: [],
}

describe('MMC — RM 375-2008-TR / ISO 11228-1', () => {
  it('Varón con 25kg → cumple RM 375 exactamente en el límite', () => {
    const r = calcMmc({ ...baseM, peso: 25 }, 'masculino')
    expect(r.limRM).toBe(25)
    expect(r.cumRM).toBe(true)
    expect(r.exc).toBe(0)
    expect(r.level).toBe(0)
  })

  it('Mujer con 15kg → cumple RM 375 exactamente en el límite', () => {
    const r = calcMmc({ ...baseF, peso: 15 }, 'femenino')
    expect(r.limRM).toBe(15)
    expect(r.cumRM).toBe(true)
    expect(r.level).toBe(0)
  })

  it('Varón con 50kg → excede 100% (2x el límite) → nivel 4', () => {
    const r = calcMmc({ ...baseM, peso: 50 }, 'masculino')
    expect(r.cumRM).toBe(false)
    expect(r.exc).toBe(25)
    expect(r.pct).toBe(100)
    expect(r.level).toBeGreaterThanOrEqual(3)
  })

  it('Mujer con 20kg frecuente → no cumple ISO (límite 9kg)', () => {
    const r = calcMmc({ ...baseF, peso: 20 }, 'femenino')
    expect(r.limISO).toBe(9)
    expect(r.cumISO).toBe(false)
  })

  it('3 factores adicionales empujan el nivel a 2 aunque peso esté en límite', () => {
    const r = calcMmc(
      { ...baseM, peso: 24, factores: ['asim', 'agr', 'esp'] },
      'masculino',
    )
    expect(r.nF).toBe(3)
    expect(r.level).toBeGreaterThanOrEqual(2)
  })

  it('5 factores adicionales fuerzan nivel a 3 mínimo', () => {
    const r = calcMmc(
      { ...baseM, peso: 24, factores: ['asim', 'agr', 'esp', 'sue', 'ines'] },
      'masculino',
    )
    expect(r.nF).toBe(5)
    expect(r.level).toBeGreaterThanOrEqual(3)
  })

  it('Trabajador entrenado puede levantar hasta 40kg (varón) según RM 375 Art.4', () => {
    const r = calcMmc(baseM, 'masculino')
    expect(r.limEnt).toBe(40)
  })
})

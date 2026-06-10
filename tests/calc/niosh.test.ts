import { describe, expect, it } from 'vitest'
import { calcNiosh, type NIOSHInput } from '@/lib/calc/niosh'

const base: NIOSHInput = {
  L: 10, H: 25, V: 75, D: 25, A: 0, F: 1, dur: '2-8h', coup: 'good',
}

describe('NIOSH', () => {
  it('condiciones ideales (H=25, V=75, F≤0.2, sin asimetría) → todos los multiplicadores = 1', () => {
    const r = calcNiosh({ ...base, F: 0.1 })  // F≤0.2 da bucket 0 con FM=1 en 2-8h
    expect(r.HM).toBeCloseTo(1, 3)
    expect(r.VM).toBeCloseTo(1, 3)
    expect(r.AM).toBeCloseTo(1, 3)
    expect(r.FM).toBe(1)
    expect(r.CM).toBe(1)
    expect(r.RWL).toBeCloseTo(23, 1)  // 23 × 1 × 1 × 1 × 1 × 1 × 1 = 23 kg (LC base)
  })

  it('frecuencia 1/min en jornada larga 2-8h → FM=0.94 (penalización moderada)', () => {
    const r = calcNiosh(base)  // F=1, dur=2-8h
    expect(r.FM).toBeCloseTo(0.94, 2)
    expect(r.RWL).toBeCloseTo(23 * 0.94, 1)
  })

  it('LI ≤ 1 con carga aceptable → nivel 0', () => {
    const r = calcNiosh({ ...base, L: 20 })
    expect(r.LI).toBeLessThanOrEqual(1)
    expect(r.level).toBe(0)
  })

  it('LI > 3 con carga excesiva → nivel 4', () => {
    const r = calcNiosh({ ...base, L: 80 })
    expect(r.LI).toBeGreaterThan(3)
    expect(r.level).toBe(4)
  })

  it('asimetría 90° reduce AM a ~0.71', () => {
    const r = calcNiosh({ ...base, A: 90 })
    expect(r.AM).toBeCloseTo(1 - 0.0032 * 90, 3)
  })

  it('acoplamiento poor → CM=0.9', () => {
    const r = calcNiosh({ ...base, coup: 'poor' })
    expect(r.CM).toBe(0.9)
  })

  it('frecuencia >10/min en duración corta → FM=0 → LI=999 (carga prohibitiva)', () => {
    const r = calcNiosh({ ...base, F: 11, dur: '<1h' })
    expect(r.FM).toBe(0)
    expect(r.LI).toBe(999)
    expect(r.level).toBe(4)
  })

  it('L=0 sin carga real → LI=0 (no riesgo)', () => {
    const r = calcNiosh({ ...base, L: 0 })
    expect(r.LI).toBe(0)
    expect(r.level).toBe(0)
  })
})

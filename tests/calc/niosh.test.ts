import { describe, expect, it } from 'vitest'
import { calcNiosh, type NIOSHInput } from '@/lib/calc/niosh'

// Valores de referencia: Waters TR et al. Ergonomics 1993;36(7):749-776 (tablas 5 y 7).
const base: NIOSHInput = {
  L: 10, H: 25, V: 75, D: 25, A: 0, F: 0.2, dur: '<1h', coup: 'good',
}

describe('NIOSH', () => {
  it('condiciones ideales (H=25, V=75, D≤25, F≤0.2, ≤1h) → todos los multiplicadores = 1, RWL = 23 kg', () => {
    const r = calcNiosh(base)
    expect(r.HM).toBe(1)
    expect(r.VM).toBe(1)
    expect(r.DM).toBe(1)
    expect(r.AM).toBe(1)
    expect(r.FM).toBe(1)
    expect(r.CM).toBe(1)
    expect(r.RWL).toBeCloseTo(23, 5)
  })

  it.each([
    // [F, duración, V, FM esperado]
    [0.2, '2-8h', 75, 0.85],
    [1, '<1h', 75, 0.94],
    [1, '1-2h', 75, 0.88],
    [1, '2-8h', 75, 0.75],
    [5, '<1h', 75, 0.8],
    [5, '2-8h', 75, 0.35],
    [9, '2-8h', 50, 0],
    [9, '2-8h', 100, 0.15],
    [11, '1-2h', 50, 0],
    [11, '1-2h', 100, 0.23],
    [13, '<1h', 50, 0],
    [13, '<1h', 100, 0.34],
    [16, '<1h', 100, 0],
  ] as const)('FM tabla 5: F=%s, %s, V=%s → %s', (F, dur, V, fm) => {
    expect(calcNiosh({ ...base, F, dur, V }).FM).toBe(fm)
  })

  it('jornada larga penaliza más que jornada corta a igual frecuencia', () => {
    const corta = calcNiosh({ ...base, F: 4, dur: '<1h' })
    const larga = calcNiosh({ ...base, F: 4, dur: '2-8h' })
    expect(larga.RWL).toBeLessThan(corta.RWL)
  })

  it('frecuencia intermedia usa la fila superior (conservador): F=1.5 → fila F=2', () => {
    expect(calcNiosh({ ...base, F: 1.5, dur: '2-8h' }).FM).toBe(0.65)
  })

  it('DM = 1 para D ≤ 25 cm y 0.82 + 4.5/D para D > 25', () => {
    expect(calcNiosh({ ...base, D: 10 }).DM).toBe(1)
    expect(calcNiosh({ ...base, D: 100 }).DM).toBeCloseTo(0.865, 3)
  })

  it('HM = 25/H; H > 63 cm → 0', () => {
    expect(calcNiosh({ ...base, H: 50 }).HM).toBeCloseTo(0.5, 5)
    expect(calcNiosh({ ...base, H: 64 }).HM).toBe(0)
  })

  it('V > 175 cm → VM 0; D > 175 cm → DM 0; A > 135° → AM 0', () => {
    expect(calcNiosh({ ...base, V: 180 }).VM).toBe(0)
    expect(calcNiosh({ ...base, D: 180 }).DM).toBe(0)
    expect(calcNiosh({ ...base, A: 140 }).AM).toBe(0)
  })

  it('asimetría 90° → AM = 0.712', () => {
    expect(calcNiosh({ ...base, A: 90 }).AM).toBeCloseTo(0.712, 3)
  })

  it('acoplamiento (tabla 7): regular 0.95 si V<75, 1.00 si V≥75; malo 0.90', () => {
    expect(calcNiosh({ ...base, coup: 'fair', V: 50 }).CM).toBe(0.95)
    expect(calcNiosh({ ...base, coup: 'fair', V: 75 }).CM).toBe(1)
    expect(calcNiosh({ ...base, coup: 'poor' }).CM).toBe(0.9)
  })

  it('caso calculado: L=15, H=40, V=30, D=60, A=30, F=2, 1-2h, regular', () => {
    const r = calcNiosh({ L: 15, H: 40, V: 30, D: 60, A: 30, F: 2, dur: '1-2h', coup: 'fair' })
    // 23 × 0.625 × 0.865 × 0.895 × 0.904 × 0.84 × 0.95
    expect(r.RWL).toBeCloseTo(23 * 0.625 * 0.865 * 0.895 * 0.904 * 0.84 * 0.95, 4)
    expect(r.RWL).toBeCloseTo(7.99, 1)
    expect(r.LI).toBeCloseTo(15 / r.RWL, 5)
    expect(r.level).toBe(2)
  })

  it('LI ≤ 1 → nivel 0; LI > 3 → nivel 4', () => {
    expect(calcNiosh({ ...base, L: 20 }).level).toBe(0)
    expect(calcNiosh({ ...base, L: 80 }).level).toBe(4)
  })

  it('FM = 0 con carga → LI = 999 (levantamiento no aceptable)', () => {
    const r = calcNiosh({ ...base, F: 9, V: 50, dur: '2-8h' })
    expect(r.LI).toBe(999)
    expect(r.level).toBe(4)
  })

  it('L=0 sin carga real → LI=0', () => {
    expect(calcNiosh({ ...base, L: 0 }).LI).toBe(0)
  })
})

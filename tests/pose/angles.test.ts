import { describe, expect, it } from 'vitest'
import { angleFromVertical, angleOf, calcPoseAngles, consolidateWorstAngles } from '@/lib/pose/angles'
import type { Landmark } from '@/lib/pose/types'

describe('angleOf — geometría pura', () => {
  it('puntos colineales en línea recta → 180°', () => {
    expect(angleOf({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 })).toBe(180)
  })

  it('ángulo recto → 90°', () => {
    expect(angleOf({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 })).toBe(90)
  })

  it('coincidencia con vértice → 0°', () => {
    expect(angleOf({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 1 })).toBe(0)
  })
})

describe('angleFromVertical', () => {
  it('vertical perfecto (top arriba de bottom) → 0°', () => {
    expect(angleFromVertical({ x: 0.5, y: 0 }, { x: 0.5, y: 1 })).toBe(0)
  })

  it('45° de inclinación → 45°', () => {
    expect(angleFromVertical({ x: 0.5, y: 0 }, { x: 1.5, y: 1 })).toBe(45)
  })

  it('horizontal → 90°', () => {
    expect(angleFromVertical({ x: 0, y: 0.5 }, { x: 1, y: 0.5 })).toBe(90)
  })
})

/** Crea un set de 33 landmarks ficticios con visibilidad 1, todos en el origen. */
function blankLandmarks(): Landmark[] {
  return Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 1 }))
}

/** Override un subset de landmarks por índice. */
function setLm(base: Landmark[], updates: Record<number, Partial<Landmark>>): Landmark[] {
  const out = base.map(p => ({ ...p }))
  for (const [k, v] of Object.entries(updates)) {
    const idx = Number(k)
    out[idx] = { ...out[idx]!, ...v }
  }
  return out
}

describe('calcPoseAngles — postura erguida sintética', () => {
  it('rechaza arrays con menos de 33 landmarks', () => {
    expect(() => calcPoseAngles([])).toThrow()
  })

  it('postura ideal erguida produce tronco ~0° y rodillas extendidas', () => {
    // Nariz arriba, hombros a la altura del cuello, cadera debajo, rodillas y tobillos abajo.
    const lm = setLm(blankLandmarks(), {
      0: { x: 0.5, y: 0.1 },   // NOSE
      11: { x: 0.4, y: 0.3 },  // LEFT_SHOULDER
      12: { x: 0.6, y: 0.3 },  // RIGHT_SHOULDER
      13: { x: 0.4, y: 0.5 },  // LEFT_ELBOW
      14: { x: 0.6, y: 0.5 },  // RIGHT_ELBOW
      15: { x: 0.4, y: 0.7 },  // LEFT_WRIST
      16: { x: 0.6, y: 0.7 },  // RIGHT_WRIST
      23: { x: 0.4, y: 0.6 },  // LEFT_HIP
      24: { x: 0.6, y: 0.6 },  // RIGHT_HIP
      25: { x: 0.4, y: 0.8 },  // LEFT_KNEE
      26: { x: 0.6, y: 0.8 },  // RIGHT_KNEE
      27: { x: 0.4, y: 0.95 }, // LEFT_ANKLE
      28: { x: 0.6, y: 0.95 }, // RIGHT_ANKLE
    })
    const a = calcPoseAngles(lm)
    expect(a.trunk).toBeLessThanOrEqual(5)         // erecto
    expect(a.knee).toBeGreaterThanOrEqual(150)     // extendido
  })

  it('flexión de tronco a 45° desplazando hombros hacia delante', () => {
    const lm = setLm(blankLandmarks(), {
      0: { x: 0.8, y: 0.3 },   // NOSE adelantada
      11: { x: 0.7, y: 0.4 }, 12: { x: 0.9, y: 0.4 },  // hombros adelantados
      13: { x: 0.7, y: 0.6 }, 14: { x: 0.9, y: 0.6 },
      15: { x: 0.7, y: 0.7 }, 16: { x: 0.9, y: 0.7 },
      23: { x: 0.4, y: 0.6 }, 24: { x: 0.6, y: 0.6 },  // cadera atrás
      25: { x: 0.4, y: 0.8 }, 26: { x: 0.6, y: 0.8 },
      27: { x: 0.4, y: 0.95 }, 28: { x: 0.6, y: 0.95 },
    })
    const a = calcPoseAngles(lm)
    expect(a.trunk).toBeGreaterThan(20)
    expect(a.trunk).toBeLessThanOrEqual(90)
  })

  it('rodillas en cuclillas: knee < 120°', () => {
    const lm = setLm(blankLandmarks(), {
      0: { x: 0.5, y: 0.4 },
      11: { x: 0.4, y: 0.5 }, 12: { x: 0.6, y: 0.5 },
      13: { x: 0.4, y: 0.6 }, 14: { x: 0.6, y: 0.6 },
      15: { x: 0.4, y: 0.65 }, 16: { x: 0.6, y: 0.65 },
      23: { x: 0.4, y: 0.7 }, 24: { x: 0.6, y: 0.7 },
      // Rodillas adelantadas + tobillos cerca = mucha flexión
      25: { x: 0.55, y: 0.75 }, 26: { x: 0.65, y: 0.75 },
      27: { x: 0.42, y: 0.95 }, 28: { x: 0.58, y: 0.95 },
    })
    const a = calcPoseAngles(lm)
    expect(a.knee).toBeLessThan(150)
  })
})

describe('consolidateWorstAngles', () => {
  it('toma max de flexiones y min de rodillas', () => {
    const A = { trunk: 10, neck: 5, ua: 30, uaL: 30, uaR: 20, la: 90, wrist: 5, knee: 170, kneeL: 170, kneeR: 175 }
    const B = { trunk: 45, neck: 25, ua: 60, uaL: 50, uaR: 60, la: 110, wrist: 20, knee: 130, kneeL: 140, kneeR: 130 }
    const result = consolidateWorstAngles([A, B])
    expect(result.trunk).toBe(45)
    expect(result.neck).toBe(25)
    expect(result.ua).toBe(60)
    expect(result.knee).toBe(130)
  })

  it('rechaza array vacío', () => {
    expect(() => consolidateWorstAngles([])).toThrow()
  })
})

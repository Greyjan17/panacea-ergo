import { describe, expect, it } from 'vitest'
import { AIParseError, mergeWorstCase, parseAIResponse } from '@/lib/ai/parser'

describe('parseAIResponse — REBA', () => {
  it('acepta JSON estructurado válido', () => {
    const r = parseAIResponse('REBA', {
      values: { trunk: 3, neck: 2, ua: 4, load: 1, shock: true },
      hallazgos: 'Flexión lumbar marcada con carga mediana',
      confidence: 0.92,
    })
    expect(r.values.trunk).toBe(3)
    expect(r.values.shock).toBe(true)
    expect(r.hallazgos).toContain('Flexión')
    expect(r.confidence).toBeCloseTo(0.92)
  })

  it('rechaza valores fuera de rango con error tipado', () => {
    expect(() =>
      parseAIResponse('REBA', { values: { trunk: 99 } }),
    ).toThrow(AIParseError)
  })

  it('rechaza claves desconocidas (strict)', () => {
    expect(() =>
      parseAIResponse('REBA', { values: { trunk: 2, hackeo: 999 } }),
    ).toThrow(AIParseError)
  })

  it('confidence default 0 cuando no viene', () => {
    const r = parseAIResponse('REBA', { values: { trunk: 1 } })
    expect(r.confidence).toBe(0)
    expect(r.hallazgos).toBe('')
  })
})

describe('parseAIResponse — RULA / OWAS / NIOSH', () => {
  it('RULA respeta rangos de músculo y fuerza', () => {
    const r = parseAIResponse('RULA', {
      values: { ua: 3, mA: 1, fA: 2, neck: 2, trunk: 3 },
    })
    expect(r.values.mA).toBe(1)
  })

  it('OWAS acepta legs hasta 7 (caminando)', () => {
    const r = parseAIResponse('OWAS', {
      values: { back: 2, arms: 1, legs: 7, load: 1 },
    })
    expect(r.values.legs).toBe(7)
  })

  it('NIOSH valida enum dur', () => {
    expect(() =>
      parseAIResponse('NIOSH', { values: { dur: 'invalido' } }),
    ).toThrow(AIParseError)
  })

  it('NIOSH acepta floats razonables', () => {
    const r = parseAIResponse('NIOSH', {
      values: { L: 12.5, H: 30, V: 70, D: 40, A: 30, F: 0.5, dur: '1-2h', coup: 'fair' },
    })
    expect(r.values.L).toBeCloseTo(12.5)
    expect(r.values.coup).toBe('fair')
  })
})

describe('mergeWorstCase', () => {
  it('toma el MAX de números (peor postura gana)', () => {
    const merged = mergeWorstCase<{ trunk: number; ua: number }>([
      { trunk: 2, ua: 3 },
      { trunk: 4, ua: 1 },
      { trunk: 1, ua: 2 },
    ])
    expect(merged.trunk).toBe(4)
    expect(merged.ua).toBe(3)
  })

  it('OR para booleans (cualquiera detecta = se marca)', () => {
    const merged = mergeWorstCase<{ shock: boolean; sup: boolean }>([
      { shock: false, sup: true },
      { shock: true, sup: false },
    ])
    expect(merged.shock).toBe(true)
    expect(merged.sup).toBe(true)
  })

  it('ignora undefined', () => {
    const merged = mergeWorstCase<{ trunk?: number }>([{}, { trunk: 3 }, {}])
    expect(merged.trunk).toBe(3)
  })

  it('último gana para strings', () => {
    const merged = mergeWorstCase<{ dur: string }>([
      { dur: '<1h' }, { dur: '2-8h' },
    ])
    expect(merged.dur).toBe('2-8h')
  })
})

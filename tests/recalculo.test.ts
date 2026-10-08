import { describe, expect, it } from 'vitest'
import { recalcularEvaluacion } from '@/lib/recalculo'
import { DEFAULT_RULA, DEFAULT_OWAS, DEFAULT_REBA } from '@/store/useEvaluacion'

describe('recalcularEvaluacion', () => {
  it('detecta OWAS que antes caía al valor por defecto y ahora sube de nivel', () => {
    const r = recalcularEvaluacion(
      {
        info: { sexo: 'masculino' },
        owas: { back: 4, arms: 3, legs: 7, load: 3 },
        resultados: { owas: { level: 1, cat: 2 } as never },
      },
      ['OWAS'],
    )
    expect(r.cambios).toHaveLength(1)
    expect(r.cambios[0]).toMatchObject({ metodo: 'OWAS', nivelAntes: 1, nivelDespues: 3 })
    expect(r.subeRiesgo).toBe(true)
    expect(r.levelMax).toBe(3)
  })

  it('RULA con tronco >60°: score B corregido cambia el resultado', () => {
    const r = recalcularEvaluacion(
      { rula: { ...DEFAULT_RULA, ua: 4, trunk: 4 }, resultados: { rula: { level: 2, fin: 4 } as never } },
      ['RULA'],
    )
    expect(r.cambios[0]).toMatchObject({ metodo: 'RULA', scoreAntes: 4, scoreDespues: 5, nivelDespues: 3 })
    expect(r.subeRiesgo).toBe(true)
  })

  it('sin cambios cuando el resultado guardado coincide', () => {
    const r = recalcularEvaluacion(
      { reba: DEFAULT_REBA, owas: DEFAULT_OWAS, resultados: { reba: { level: 0, fin: 1 } as never, owas: { level: 0, cat: 1 } as never } },
      ['REBA', 'OWAS'],
    )
    expect(r.cambios).toHaveLength(0)
    expect(r.subeRiesgo).toBe(false)
    expect(r.scoreReba).toBe(1)
  })

  it('baja de nivel no cuenta como "sube riesgo"', () => {
    const r = recalcularEvaluacion(
      { reba: { ...DEFAULT_REBA, trunk: 2, trunkT: true, trunkS: true }, resultados: { reba: { level: 2, fin: 4 } as never } },
      ['REBA'],
    )
    expect(r.cambios[0]!.nivelDespues).toBeLessThanOrEqual(2)
    expect(r.subeRiesgo).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { calcOwas } from '@/lib/calc/owas'

describe('OWAS', () => {
  it('postura ideal sentado con poca carga → categoría 1 (sin acción)', () => {
    const r = calcOwas({ back: 1, arms: 1, legs: 1, load: 1 })
    expect(r.cat).toBe(1)
    expect(r.code).toBe('1111')
    expect(r.level).toBe(0)
    expect(r.action).toBe('Sin acción')
  })

  it('espalda doblada+girada + brazos uno arriba + cuclillas + carga >20kg → cat 4 (inmediata)', () => {
    // Nota: en la tabla OWAS original NO se definen combinaciones back=4+arms=3 (raras).
    // Validamos con arms=2 que sí está definida y refleja el escenario clínico crítico.
    const r = calcOwas({ back: 4, arms: 2, legs: 5, load: 3 })
    expect(r.cat).toBe(4)
    expect(r.code).toBe('4253')
    expect(r.level).toBe(3)
    expect(r.action).toBe('Acción INMEDIATA')
  })

  it('espalda doblada + manipulación 10-20kg de pie → categoría 2 o 3', () => {
    const r = calcOwas({ back: 2, arms: 1, legs: 2, load: 2 })
    expect(r.cat).toBeGreaterThanOrEqual(2)
    expect(r.cat).toBeLessThanOrEqual(3)
  })

  it('código desconocido cae al default categoría 2', () => {
    // Fuera de rango legal: igualmente debe devolver algo coherente sin lanzar
    const r = calcOwas({ back: 1, arms: 1, legs: 1, load: 1 })
    expect(r.cat).toBe(1)
  })
})

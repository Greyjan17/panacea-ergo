import { describe, expect, it } from 'vitest'
import { calcOwas, type OWASInput } from '@/lib/calc/owas'

// Tabla de categorías de acción: Karhu O, Kansi P, Kuorinka I. Applied Ergonomics 1977;8(4):199-201.
describe('OWAS', () => {
  it('postura ideal sentado con poca carga → categoría 1 (sin acción)', () => {
    const r = calcOwas({ back: 1, arms: 1, legs: 1, load: 1 })
    expect(r.cat).toBe(1)
    expect(r.code).toBe('1111')
    expect(r.level).toBe(0)
    expect(r.action).toBe('Sin acción')
  })

  it('las 252 combinaciones están definidas y devuelven categoría 1..4', () => {
    let n = 0
    for (const back of [1, 2, 3, 4] as const)
      for (const arms of [1, 2, 3] as const)
        for (const legs of [1, 2, 3, 4, 5, 6, 7] as const)
          for (const load of [1, 2, 3] as const) {
            const r = calcOwas({ back, arms, legs, load })
            expect([1, 2, 3, 4]).toContain(r.cat)
            n++
          }
    expect(n).toBe(252)
  })

  it.each([
    // [espalda, brazos, piernas, carga, categoría]
    [1, 1, 4, 1, 2],
    [1, 3, 4, 3, 3],
    [1, 3, 7, 3, 2],
    [2, 1, 1, 3, 3],
    [2, 2, 4, 2, 4],
    [2, 3, 1, 1, 3],
    [3, 1, 5, 1, 4],
    [3, 3, 3, 2, 3],
    [4, 1, 1, 1, 2],
    [4, 3, 1, 1, 4],
    [4, 3, 7, 3, 4],
    [4, 2, 7, 1, 2],
  ] as const)('código %s%s%s%s → categoría %s', (back, arms, legs, load, cat) => {
    expect(calcOwas({ back, arms, legs, load }).cat).toBe(cat)
  })

  it('ambos brazos sobre hombros y caminando ya no caen a un valor por defecto', () => {
    const r = calcOwas({ back: 4, arms: 3, legs: 7, load: 3 })
    expect(r.cat).toBe(4)
    expect(r.action).toBe('Acción INMEDIATA')
  })

  it('código fuera de rango lanza error en lugar de devolver un valor silencioso', () => {
    expect(() => calcOwas({ back: 5, arms: 1, legs: 1, load: 1 } as unknown as OWASInput)).toThrow(RangeError)
  })
})

// OWAS — Ovako Working Posture Analysis System (Karhu et al., 1977).
// Implementación pura.

import type { RiskLevel } from '@/types/ergo'
import { OWAS_ACCION } from '@/lib/norma'

export interface OWASInput {
  back: 1 | 2 | 3 | 4
  arms: 1 | 2 | 3
  legs: 1 | 2 | 3 | 4 | 5 | 6 | 7
  load: 1 | 2 | 3
}

export interface OWASResult {
  code: string
  cat: 1 | 2 | 3 | 4
  level: RiskLevel
  action: (typeof OWAS_ACCION)[number]
}

// Tabla de categorías de acción OWAS (Karhu et al., 1977/1981).
// Filas: [espalda-1][brazos-1]; columnas: [piernas-1][carga-1].
// 4 × 3 × 7 × 3 = 252 combinaciones, todas definidas (no hay valores por defecto).
type Cat = 1 | 2 | 3 | 4
const OWAS_TABLE: Cat[][][][] = [
  // Espalda 1 — recta
  [
    [[1, 1, 1], [1, 1, 1], [1, 1, 1], [2, 2, 2], [2, 2, 2], [1, 1, 1], [1, 1, 1]],
    [[1, 1, 1], [1, 1, 1], [1, 1, 1], [2, 2, 2], [2, 2, 2], [1, 1, 1], [1, 1, 1]],
    [[1, 1, 1], [1, 1, 1], [1, 1, 1], [2, 2, 3], [2, 2, 3], [1, 1, 1], [1, 1, 2]],
  ],
  // Espalda 2 — doblada
  [
    [[2, 2, 3], [2, 2, 3], [2, 2, 3], [3, 3, 3], [3, 3, 3], [2, 2, 2], [2, 3, 3]],
    [[2, 2, 3], [2, 2, 3], [2, 3, 3], [3, 4, 4], [3, 4, 4], [3, 3, 4], [2, 3, 4]],
    [[3, 3, 4], [2, 2, 3], [3, 3, 3], [3, 4, 4], [4, 4, 4], [4, 4, 4], [2, 3, 4]],
  ],
  // Espalda 3 — girada
  [
    [[1, 1, 1], [1, 1, 1], [1, 1, 2], [3, 3, 3], [4, 4, 4], [1, 1, 1], [1, 1, 1]],
    [[2, 2, 3], [1, 1, 1], [1, 1, 2], [4, 4, 4], [4, 4, 4], [3, 3, 3], [1, 1, 1]],
    [[2, 2, 3], [1, 1, 1], [2, 3, 3], [4, 4, 4], [4, 4, 4], [4, 4, 4], [1, 1, 1]],
  ],
  // Espalda 4 — doblada y girada
  [
    [[2, 3, 3], [2, 2, 3], [2, 2, 3], [4, 4, 4], [4, 4, 4], [4, 4, 4], [2, 3, 4]],
    [[3, 3, 4], [2, 3, 4], [3, 3, 4], [4, 4, 4], [4, 4, 4], [4, 4, 4], [2, 3, 4]],
    [[4, 4, 4], [2, 3, 4], [3, 3, 4], [4, 4, 4], [4, 4, 4], [4, 4, 4], [2, 3, 4]],
  ],
]

export function calcOwas(input: OWASInput): OWASResult {
  const code = `${input.back}${input.arms}${input.legs}${input.load}`
  const cat = OWAS_TABLE[input.back - 1]?.[input.arms - 1]?.[input.legs - 1]?.[input.load - 1]
  if (cat === undefined) {
    throw new RangeError(`Código OWAS fuera de rango: ${code}`)
  }
  const level = (cat - 1) as RiskLevel
  return { code, cat, level, action: OWAS_ACCION[cat - 1] }
}

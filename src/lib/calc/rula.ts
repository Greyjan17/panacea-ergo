// RULA — Rapid Upper Limb Assessment (McAtamney & Corlett, 1993).
// Implementación pura. Las tablas A, B y C corresponden a la publicación original.

import type { RiskLevel } from '@/types/ergo'

export interface RULAInput {
  // Grupo A
  ua: 1 | 2 | 3 | 4
  shr: boolean
  sup: boolean
  la: 1 | 2
  mid: boolean
  wrist: 1 | 2 | 3
  wristT: boolean
  mA: 0 | 1
  fA: 0 | 1 | 2 | 3
  // Grupo B
  neck: 1 | 2 | 3 | 4
  neckT: boolean
  neckS: boolean
  trunk: 1 | 2 | 3 | 4
  trunkT: boolean
  trunkS: boolean
  legs: 1 | 2
  mB: 0 | 1
  fB: 0 | 1 | 2 | 3
}

export interface RULAResult {
  sA: number
  sB: number
  fin: number
  level: RiskLevel
}

// Tabla A RULA: [brazoSup-1][brazoInf-1][muñeca-1][torsión 0|1]
const TABLE_A: number[][][][] = [
  [
    [[1, 2], [2, 2], [2, 3], [3, 3]],
    [[2, 2], [2, 2], [3, 3], [3, 3]],
    [[2, 3], [3, 3], [3, 3], [4, 4]],
  ],
  [
    [[2, 3], [3, 3], [3, 4], [4, 4]],
    [[3, 3], [3, 3], [3, 4], [4, 4]],
    [[3, 4], [4, 4], [4, 4], [5, 5]],
  ],
  [
    [[3, 3], [4, 4], [4, 4], [5, 5]],
    [[3, 4], [4, 4], [4, 5], [5, 5]],
    [[4, 4], [4, 4], [4, 5], [5, 6]],
  ],
  [
    [[4, 4], [4, 4], [4, 5], [5, 5]],
    [[4, 4], [4, 4], [4, 5], [5, 5]],
    [[4, 5], [5, 5], [5, 6], [6, 7]],
  ],
  [
    [[5, 5], [5, 5], [5, 6], [6, 7]],
    [[5, 6], [6, 6], [6, 7], [7, 7]],
    [[6, 6], [6, 7], [7, 7], [7, 8]],
  ],
  [
    [[7, 8], [7, 8], [7, 8], [8, 9]],
    [[8, 9], [8, 9], [8, 9], [9, 9]],
    [[9, 9], [9, 9], [9, 9], [9, 9]],
  ],
]

// Tabla B RULA: [cuello-1][tronco+piernas como columna]
const TABLE_B: number[][] = [
  [1, 3, 2, 3, 3, 4, 5, 5, 6, 6, 7, 7],
  [2, 3, 2, 3, 4, 5, 5, 6, 6, 7, 7, 7],
  [3, 4, 3, 4, 4, 5, 6, 6, 7, 7, 7, 7],
  [5, 5, 4, 5, 5, 6, 7, 7, 7, 7, 8, 8],
  [7, 7, 5, 6, 6, 7, 7, 8, 8, 8, 8, 8],
  [8, 8, 7, 7, 7, 8, 8, 9, 9, 9, 9, 9],
]

// Tabla C RULA: [scoreA-1][scoreB-1]
const TABLE_C: number[][] = [
  [1, 2, 3, 3, 4, 5, 5],
  [2, 2, 3, 4, 4, 5, 5],
  [3, 3, 3, 4, 4, 5, 6],
  [3, 3, 3, 4, 5, 6, 6],
  [4, 4, 4, 5, 6, 7, 7],
  [4, 4, 5, 6, 6, 7, 7],
  [5, 5, 6, 6, 7, 7, 7],
  [5, 5, 6, 7, 7, 7, 7],
]

const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x))

function finalLevel(fin: number): RiskLevel {
  if (fin <= 2) return 0
  if (fin <= 3) return 1
  if (fin <= 4) return 2
  if (fin <= 6) return 3
  return 4
}

export function calcRula(input: RULAInput): RULAResult {
  const ua = clamp(input.ua + (input.shr ? 1 : 0) - (input.sup ? 1 : 0), 1, 6)
  const la = clamp(input.la + (input.mid ? 1 : 0), 1, 3)
  const w = clamp(input.wrist, 1, 3)
  const wt = input.wristT ? 1 : 0
  const sA =
    (TABLE_A[ua - 1]?.[la - 1]?.[w - 1]?.[wt] ?? 9) +
    clamp(input.mA, 0, 1) +
    clamp(input.fA, 0, 3)

  const nk = clamp(input.neck + (input.neckT ? 1 : 0) + (input.neckS ? 1 : 0), 1, 6)
  const tr = clamp(input.trunk + (input.trunkT ? 1 : 0) + (input.trunkS ? 1 : 0), 1, 6)
  const lg = clamp(input.legs, 1, 2)
  // En la implementación original v2.1 el índice de columna es: tr + (lg-1)*6 - 1
  const sB =
    (TABLE_B[nk - 1]?.[tr + (lg - 1) * 6 - 1] ?? 9) +
    clamp(input.mB, 0, 1) +
    clamp(input.fB, 0, 3)

  const fin = TABLE_C[Math.min(Math.max(sA - 1, 0), 7)]?.[Math.min(Math.max(sB - 1, 0), 6)] ?? 7

  return { sA, sB, fin, level: finalLevel(fin) }
}

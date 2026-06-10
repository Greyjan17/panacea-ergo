// REBA — Rapid Entire Body Assessment (Hignett & McAtamney, 2000).
// Implementación pura, sin dependencias, testeable en aislamiento.
//
// Las tablas A, B y C corresponden a la publicación original:
//   Hignett S, McAtamney L. Applied Ergonomics 2000;31:201-205
//
// Convenciones de inputs:
//  - `trunk`: 1=erecto, 2=0-20°, 3=20-60°, 4=>60°
//  - `neck`:  1=0-20°, 2=>20° o extensión
//  - `legs`:  1=bilateral, 2=unilateral, 3=flex 30-60°, 4=flex >60°
//  - `ua`:    1=-20/20°, 2=20-45°, 3=45-90°, 4=>90°
//  - `la`:    1=60-100°, 2=fuera de rango
//  - `wrist`: 1=0-15°, 2=>15°

import type { RiskLevel } from '@/types/ergo'

export interface REBAInput {
  // Grupo A
  neck: 1 | 2
  neckT: boolean
  neckS: boolean
  trunk: 1 | 2 | 3 | 4
  trunkT: boolean
  trunkS: boolean
  legs: 1 | 2 | 3 | 4
  load: 0 | 1 | 2
  shock: boolean
  // Grupo B
  ua: 1 | 2 | 3 | 4 | 5 | 6
  shr: boolean
  abd: boolean
  sup: boolean
  la: 1 | 2
  wrist: 1 | 2 | 3
  wristT: boolean
  // Modificadores finales
  coup: 0 | 1 | 2 | 3
  act: 0 | 1 | 2 | 3
}

export interface REBAResult {
  sA: number
  sB: number
  sC: number
  fin: number
  level: RiskLevel
}

// Tabla A REBA: [tronco-1][cuello-1][piernas-1]
const TABLE_A: number[][][] = [
  [[1, 2, 3, 4], [1, 2, 3, 4], [3, 3, 5, 6]],
  [[2, 3, 4, 5], [3, 4, 5, 6], [4, 5, 6, 7]],
  [[2, 4, 5, 6], [4, 5, 6, 7], [5, 6, 7, 8]],
  [[3, 5, 6, 7], [5, 6, 7, 8], [6, 7, 8, 9]],
  [[4, 6, 7, 8], [6, 7, 8, 9], [7, 8, 9, 9]],
]

// Tabla B REBA: [brazoSup-1][brazoInf-1][muñeca-1]
const TABLE_B: number[][][] = [
  [[1, 2, 2], [1, 2, 3]],
  [[1, 2, 3], [2, 3, 4]],
  [[3, 4, 5], [4, 5, 5]],
  [[4, 5, 5], [5, 6, 7]],
  [[6, 7, 8], [7, 8, 8]],
  [[7, 8, 8], [8, 9, 9]],
]

// Tabla C REBA: [scoreA-1][scoreB-1]
const TABLE_C: number[][] = [
  [1, 1, 1, 2, 3, 3, 4, 5, 6, 7, 7, 7],
  [1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 7, 8],
  [2, 3, 3, 3, 4, 5, 6, 7, 7, 8, 8, 8],
  [3, 4, 4, 4, 5, 6, 7, 8, 8, 9, 9, 9],
  [4, 4, 4, 5, 6, 7, 8, 8, 9, 9, 9, 9],
  [6, 6, 6, 7, 8, 8, 9, 9, 10, 10, 10, 10],
  [7, 7, 7, 8, 9, 9, 9, 10, 10, 11, 11, 11],
  [8, 8, 8, 9, 10, 10, 10, 10, 10, 11, 11, 11],
  [9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12, 12],
  [10, 10, 10, 11, 11, 11, 11, 12, 12, 12, 12, 12],
  [11, 11, 11, 11, 12, 12, 12, 12, 12, 12, 12, 12],
  [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
]

const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x))

function finalLevel(fin: number): RiskLevel {
  if (fin <= 1) return 0
  if (fin <= 3) return 1
  if (fin <= 7) return 2
  if (fin <= 10) return 3
  return 4
}

export function calcReba(input: REBAInput): REBAResult {
  // Ajustes al tronco
  const trunkFin = clamp(
    input.trunk + (input.trunkT ? 1 : 0) + (input.trunkS ? 1 : 0),
    1,
    5,
  )
  // Ajustes al cuello
  const neckFin = clamp(
    input.neck + (input.neckT ? 1 : 0) + (input.neckS ? 1 : 0),
    1,
    3,
  )
  const legsFin = clamp(input.legs, 1, 4)

  const scoreTA = TABLE_A[trunkFin - 1]?.[neckFin - 1]?.[legsFin - 1] ?? 9
  const sA = clamp(
    scoreTA + clamp(input.load, 0, 2) + (input.shock ? 1 : 0),
    0,
    12,
  )

  // Ajustes al brazo superior
  const uaFin = clamp(
    input.ua + (input.shr ? 1 : 0) + (input.abd ? 1 : 0) - (input.sup ? 1 : 0),
    1,
    6,
  )
  const laFin = clamp(input.la, 1, 2)
  const wristFin = clamp(input.wrist + (input.wristT ? 1 : 0), 1, 3)

  const scoreTB = TABLE_B[uaFin - 1]?.[laFin - 1]?.[wristFin - 1] ?? 9
  const sB = clamp(scoreTB + clamp(input.coup, 0, 3), 0, 12)

  const sC = TABLE_C[Math.min(sA - 1, 11)]?.[Math.min(sB - 1, 11)] ?? 12
  const fin = clamp(sC + clamp(input.act, 0, 3), 0, 15)

  return { sA, sB, sC, fin, level: finalLevel(fin) }
}

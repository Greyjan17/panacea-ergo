// REBA — Rapid Entire Body Assessment (Hignett & McAtamney, 2000).
// Implementación pura, sin dependencias, testeable en aislamiento.
//
// Las tablas A, B y C corresponden a la publicación original:
//   Hignett S, McAtamney L. Applied Ergonomics 2000;31:201-205
//
// Convenciones de inputs:
//  - `trunk`: 1=erecto, 2=0-20°, 3=20-60°, 4=>60°
//  - `neck`:  1=0-20°, 2=>20° o extensión
//  - `legs`:  1=apoyo bilateral/caminando/sentado, 2=unilateral o inestable
//             (3 y 4 = códigos antiguos que mezclaban apoyo y rodillas; ver rebaPiernas)
//  - `knee`:  flexión de rodillas, se SUMA a `legs`: 0=<30° o sentado, 1=30-60°, 2=>60°
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
  /** Flexión de rodillas (+1 si 30-60°, +2 si >60°, no sentado). Ausente en registros antiguos. */
  knee?: 0 | 1 | 2
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
  /** Registros antiguos: lista de selección única (1 estático, 2 repetitivo, 3 cambios rápidos). */
  act: 0 | 1 | 2 | 3
  /** Actividad: cada condición suma +1 (Hignett & McAtamney 2000). */
  actStatic?: boolean
  actRepeat?: boolean
  actRapid?: boolean
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
  [6, 6, 6, 7, 8, 8, 9, 9, 9, 10, 10, 10],
  [7, 7, 7, 8, 9, 9, 9, 10, 10, 11, 11, 11],
  [8, 8, 8, 9, 10, 10, 10, 10, 10, 11, 11, 11],
  [9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12, 12],
  [10, 10, 10, 11, 11, 11, 11, 12, 12, 12, 12, 12],
  [11, 11, 11, 11, 12, 12, 12, 12, 12, 12, 12, 12],
  [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
]

const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x))

export interface RebaPiernas {
  /** 1 bilateral, 2 unilateral; null en registros antiguos (no se registró el apoyo). */
  base: 1 | 2 | null
  rodillas: 0 | 1 | 2
  score: number
  legado: boolean
}

/**
 * Puntaje de piernas REBA = apoyo (1 bilateral, 2 unilateral) + flexión de rodillas (+1 30-60°, +2 >60°).
 * Los registros antiguos usaban un solo código 1-4 (3 = rodillas 30-60°, 4 = >60°) sin registrar el apoyo:
 * conservan su puntaje original y quedan marcados como `legado` para revisión.
 */
export function rebaPiernas(input: Pick<REBAInput, 'legs' | 'knee'>): RebaPiernas {
  if (input.knee === undefined && input.legs >= 3) {
    return { base: null, rodillas: (input.legs - 2) as 1 | 2, score: input.legs, legado: true }
  }
  const base = (input.legs >= 2 ? 2 : 1) as 1 | 2
  const rodillas = clamp(input.knee ?? 0, 0, 2) as 0 | 1 | 2
  return { base, rodillas, score: clamp(base + rodillas, 1, 4), legado: false }
}

/**
 * Puntaje de actividad REBA: +1 por cada condición presente (estático >1 min, repetitivo >4/min,
 * cambios rápidos o base inestable). Los registros antiguos marcaban UNA sola condición en una
 * lista (valores 1-3), por lo que cualquier valor >0 equivale a +1.
 */
export function rebaActividad(input: Pick<REBAInput, 'act' | 'actStatic' | 'actRepeat' | 'actRapid'>): number {
  if (input.actStatic !== undefined || input.actRepeat !== undefined || input.actRapid !== undefined) {
    return (input.actStatic ? 1 : 0) + (input.actRepeat ? 1 : 0) + (input.actRapid ? 1 : 0)
  }
  return input.act > 0 ? 1 : 0
}

function finalLevel(fin: number): RiskLevel {
  if (fin <= 1) return 0
  if (fin <= 3) return 1
  if (fin <= 7) return 2
  if (fin <= 10) return 3
  return 4
}

export function calcReba(input: REBAInput): REBAResult {
  // Ajustes al tronco
  // Torsión o inclinación lateral: +1 (no acumulativo, Hignett & McAtamney 2000)
  const trunkFin = clamp(
    input.trunk + (input.trunkT || input.trunkS ? 1 : 0),
    1,
    5,
  )
  // Ajustes al cuello
  const neckFin = clamp(
    input.neck + (input.neckT || input.neckS ? 1 : 0),
    1,
    3,
  )
  const legsFin = rebaPiernas(input).score

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
  const fin = clamp(sC + rebaActividad(input), 0, 15)

  return { sA, sB, sC, fin, level: finalLevel(fin) }
}

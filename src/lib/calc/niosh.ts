// NIOSH — Ecuación revisada de levantamiento (Waters et al., 1993).
// RWL = LC × HM × VM × DM × AM × FM × CM
// LI  = L / RWL  (Lifting Index)

import type { RiskLevel } from '@/types/ergo'

export type NIOSHDuracion = '<1h' | '1-2h' | '2-8h'
export type NIOSHAcoplamiento = 'good' | 'fair' | 'poor'

export interface NIOSHInput {
  L: number // peso real levantado (kg)
  H: number // distancia horizontal mano-tobillos (cm)
  V: number // altura vertical inicial (cm)
  D: number // desplazamiento vertical (cm)
  A: number // ángulo de asimetría (°)
  F: number // frecuencia (lev/min)
  dur: NIOSHDuracion
  coup: NIOSHAcoplamiento
}

export interface NIOSHResult {
  HM: number
  VM: number
  DM: number
  AM: number
  FM: number
  CM: number
  RWL: number
  LI: number
  level: RiskLevel
}

// Tabla de multiplicador de frecuencia FM (Waters et al., 1993, tabla 5).
// Filas por frecuencia (lev/min); cada celda: [V<75 cm, V≥75 cm].
// Duración: '<1h' = ≤1 h, '1-2h' = >1 a ≤2 h, '2-8h' = >2 a ≤8 h.
const FM_FREQS = [0.2, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const
const FM_TABLE: Record<NIOSHDuracion, ReadonlyArray<readonly [number, number]>> = {
  '<1h': [
    [1, 1], [0.97, 0.97], [0.94, 0.94], [0.91, 0.91], [0.88, 0.88], [0.84, 0.84],
    [0.8, 0.8], [0.75, 0.75], [0.7, 0.7], [0.6, 0.6], [0.52, 0.52], [0.45, 0.45],
    [0.41, 0.41], [0.37, 0.37], [0, 0.34], [0, 0.31], [0, 0.28],
  ],
  '1-2h': [
    [0.95, 0.95], [0.92, 0.92], [0.88, 0.88], [0.84, 0.84], [0.79, 0.79], [0.72, 0.72],
    [0.6, 0.6], [0.5, 0.5], [0.42, 0.42], [0.35, 0.35], [0.3, 0.3], [0.26, 0.26],
    [0, 0.23], [0, 0.21], [0, 0], [0, 0], [0, 0],
  ],
  '2-8h': [
    [0.85, 0.85], [0.81, 0.81], [0.75, 0.75], [0.65, 0.65], [0.55, 0.55], [0.45, 0.45],
    [0.35, 0.35], [0.27, 0.27], [0.22, 0.22], [0.18, 0.18], [0, 0.15], [0, 0.13],
    [0, 0], [0, 0], [0, 0], [0, 0], [0, 0],
  ],
}

/** FM para la frecuencia dada; frecuencias intermedias usan la fila superior (criterio conservador). */
function frequencyMultiplier(F: number, dur: NIOSHDuracion, V: number): number {
  const idx = FM_FREQS.findIndex(f => F <= f)
  if (idx === -1) return 0 // >15 lev/min
  const row = FM_TABLE[dur][idx]!
  return V < 75 ? row[0] : row[1]
}

function liLevel(LI: number): RiskLevel {
  if (LI <= 1) return 0
  if (LI <= 1.5) return 1
  if (LI <= 2) return 2
  if (LI <= 3) return 3
  return 4
}

export function calcNiosh(input: NIOSHInput): NIOSHResult {
  const { H, V, D, A } = input
  // Fuera de los límites de la ecuación el multiplicador es 0 (levantamiento no aceptable).
  const HM = H > 63 ? 0 : H <= 25 ? 1 : 25 / H
  const VM = V > 175 || V < 0 ? 0 : 1 - 0.003 * Math.abs(V - 75)
  const DM = D > 175 ? 0 : D <= 25 ? 1 : 0.82 + 4.5 / D
  const AM = A > 135 ? 0 : 1 - 0.0032 * Math.max(A, 0)
  const FM = frequencyMultiplier(input.F, input.dur, V)
  const CM = input.coup === 'good' ? 1 : input.coup === 'fair' ? (V < 75 ? 0.95 : 1) : 0.9
  const RWL = 23 * HM * VM * DM * AM * FM * CM
  const LI = RWL > 0.01 ? input.L / RWL : input.L > 0 ? 999 : 0
  return { HM, VM, DM, AM, FM, CM, RWL, LI, level: liLevel(LI) }
}

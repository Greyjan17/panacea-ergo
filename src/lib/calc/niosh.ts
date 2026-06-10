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

// FM table: filas por duración, columnas por bucket de frecuencia
const FM_TABLE: Record<NIOSHDuracion, number[]> = {
  '<1h':  [0.85, 0.81, 0.75, 0.65, 0.55, 0.45, 0, 0, 0, 0, 0, 0, 0],
  '1-2h': [0.95, 0.92, 0.88, 0.84, 0.79, 0.72, 0.6, 0.5, 0.42, 0.35, 0.3, 0.26, 0.23],
  '2-8h': [1, 0.97, 0.94, 0.91, 0.88, 0.84, 0.8, 0.75, 0.7, 0.6, 0.52, 0.45, 0],
}

function frequencyIndex(F: number): number {
  if (F <= 0.2) return 0
  if (F <= 0.5) return 1
  if (F <= 1) return 2
  if (F <= 2) return 3
  if (F <= 3) return 4
  if (F <= 4) return 5
  if (F <= 5) return 6
  if (F <= 6) return 7
  if (F <= 7) return 8
  if (F <= 8) return 9
  if (F <= 9) return 10
  if (F <= 10) return 11
  return 12
}

function liLevel(LI: number): RiskLevel {
  if (LI <= 1) return 0
  if (LI <= 1.5) return 1
  if (LI <= 2) return 2
  if (LI <= 3) return 3
  return 4
}

export function calcNiosh(input: NIOSHInput): NIOSHResult {
  const HM = Math.min(25 / Math.max(input.H, 1), 1)
  const VM = Math.max(1 - 0.003 * Math.abs(input.V - 75), 0)
  const DM = input.D < 25 ? 0.87 : Math.min(0.82 + 4.5 / input.D, 1)
  const AM = Math.max(1 - 0.0032 * input.A, 0)
  const FM = FM_TABLE[input.dur]?.[frequencyIndex(input.F)] ?? 0.45
  const CM = input.coup === 'good' ? 1 : input.coup === 'fair' ? 0.95 : 0.9
  const RWL = 23 * HM * VM * DM * AM * FM * CM
  const LI = RWL > 0.01 ? input.L / RWL : input.L > 0 ? 999 : 0
  return { HM, VM, DM, AM, FM, CM, RWL, LI, level: liLevel(LI) }
}

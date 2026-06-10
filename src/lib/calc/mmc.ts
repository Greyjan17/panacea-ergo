// MMC — Manejo Manual de Cargas conforme a:
//   RM N° 375-2008-TR (Perú)
//   ISO 11228-1:2003

import type { Frecuencia, RiskLevel, Sexo } from '@/types/ergo'
import { ISO_11228, RM_375 } from '@/lib/norma'

export type FactorMMC =
  | 'peso'
  | 'freq'
  | 'dist'
  | 'alt'
  | 'asim'
  | 'agr'
  | 'esp'
  | 'ines'
  | 'sue'
  | 'eq'

export interface MMCInput {
  peso: number
  grupo: string
  frec: Frecuencia
  form: 'si' | 'no'
  factores: FactorMMC[]
}

export interface MMCResult {
  limRM: number
  limEnt: number
  limISO: number
  limAp: number
  exc: number
  pct: number
  nF: number
  level: RiskLevel
  cumRM: boolean
  cumISO: boolean
}

export function calcMmc(input: MMCInput, sexo: Sexo): MMCResult {
  const rm = RM_375[sexo]
  const row =
    ISO_11228.find(x => x.grupo === input.grupo) ??
    (sexo === 'masculino' ? ISO_11228[0]! : ISO_11228[3]!)
  const isoLim =
    input.frec === 'ocasional'
      ? row.ocasional
      : input.frec === 'frecuente'
        ? row.frecuente
        : row.muyFrecuente
  const limAp = rm.general
  const exc = Math.max(input.peso - limAp, 0)
  const pct = limAp > 0 ? ((input.peso / limAp - 1) * 100) : 0

  let level: RiskLevel =
    input.peso <= limAp
      ? 0
      : input.peso <= limAp * 1.2
        ? 1
        : input.peso <= limAp * 1.5
          ? 2
          : input.peso <= limAp * 2
            ? 3
            : 4

  const nF = input.factores.length
  if (nF >= 3 && level < 2) level = 2
  if (nF >= 5 && level < 3) level = 3

  return {
    limRM: rm.general,
    limEnt: rm.entrenado,
    limISO: isoLim,
    limAp,
    exc,
    pct,
    nF,
    level,
    cumRM: input.peso <= rm.general,
    cumISO: input.peso <= isoLim,
  }
}

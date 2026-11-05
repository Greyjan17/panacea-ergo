// MMC — Manejo Manual de Cargas conforme a:
//   RM N° 375-2008-TR (Perú)
//   ISO 11228-1:2021 (masa de referencia por sexo y edad)

import type { Frecuencia, RiskLevel, Sexo } from '@/types/ergo'
import { isoGrupo, RM_375 } from '@/lib/norma'

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
  /** Trabajadora gestante: RM 375-2008-TR, Título III, num. 12 prohíbe la manipulación manual de cargas. */
  gestante?: boolean
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
  /** true si aplica la prohibición por embarazo (num. 12). */
  gestante: boolean
}

export function calcMmc(input: MMCInput, sexo: Sexo): MMCResult {
  const rm = RM_375[sexo]
  // Masa de referencia ISO 11228-1:2021. La frecuencia no reduce este valor de forma fija:
  // en tareas repetitivas el límite ajustado se calcula con el método NIOSH.
  const isoLim = isoGrupo(input.grupo, sexo).mref
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

  // Gestante: la norma no fija un límite menor, prohíbe la tarea (reubicación).
  const gestante = sexo === 'femenino' && input.gestante === true
  if (gestante) level = 4

  return {
    limRM: rm.general,
    limEnt: rm.entrenado,
    limISO: isoLim,
    limAp,
    exc,
    pct,
    nF,
    level,
    cumRM: !gestante && input.peso <= rm.general,
    cumISO: !gestante && input.peso <= isoLim,
    gestante,
  }
}

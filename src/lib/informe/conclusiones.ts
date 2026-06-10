// Generador de conclusiones dinámicas para el informe.

import type { REBAInput, REBAResult } from '@/lib/calc/reba'
import type { RULAInput, RULAResult } from '@/lib/calc/rula'
import type { OWASInput, OWASResult } from '@/lib/calc/owas'
import type { NIOSHInput, NIOSHResult } from '@/lib/calc/niosh'
import type { MMCInput, MMCResult } from '@/lib/calc/mmc'
import { REBA_RIESGO, RULA_ACCION } from '@/lib/norma'

export interface ConclusionesInput {
  reba?: { input: REBAInput; result: REBAResult }
  rula?: { input: RULAInput; result: RULAResult }
  owas?: { input: OWASInput; result: OWASResult }
  niosh?: { input: NIOSHInput; result: NIOSHResult }
  mmc?: { input: MMCInput; result: MMCResult }
}

export function getConclusiones(input: ConclusionesInput): string[] {
  const { reba, rula, owas, niosh, mmc } = input
  const out: string[] = []

  const maxLvl = Math.max(
    reba?.result.level ?? 0,
    rula?.result.level ?? 0,
    owas?.result.level ?? 0,
    niosh?.result.level ?? 0,
    mmc?.result.level ?? 0,
  )

  if (reba) {
    const niv =
      REBA_RIESGO.find(x => reba.result.fin <= x.max) ?? REBA_RIESGO[REBA_RIESGO.length - 1]!
    const factores: string[] = []
    if (reba.input.trunk >= 3) {
      factores.push(`flexión tronco ${reba.input.trunk === 4 ? '>60°' : '20-60°'}`)
    }
    if (reba.input.legs >= 3) {
      factores.push(`postura en ${reba.input.legs === 4 ? 'cuclillas' : 'semisquatting'}`)
    }
    if (reba.input.ua >= 3) {
      factores.push(`elevación brazo ${reba.input.ua === 4 ? '>90°' : '45-90°'}`)
    }
    if (reba.input.coup >= 2) {
      factores.push('agarre deficiente')
    }
    const detalle = factores.length ? ` Factores: ${factores.join(', ')}.` : ''
    out.push(
      `REBA: ${reba.result.fin}/15 — Nivel ${reba.result.level} (${niv.nivel}). ${niv.accion}.${detalle}`,
    )
  }

  if (rula) {
    const acc =
      RULA_ACCION.find(x => rula.result.fin <= x.max) ?? RULA_ACCION[RULA_ACCION.length - 1]!
    out.push(`RULA: Score ${rula.result.fin} — ${acc.nivel} (${acc.accion}).`)
  }

  if (owas) {
    out.push(`OWAS: Código ${owas.result.code}, Cat.${owas.result.cat} — ${owas.result.action}.`)
  }

  if (niosh) {
    const li = niosh.result.LI
    const riesgo =
      li <= 1 ? 'aceptable' : li <= 1.5 ? 'moderado' : li <= 2 ? 'incrementado' : li <= 3 ? 'significativo' : 'inaceptable'
    out.push(
      `NIOSH: LI=${li.toFixed(2)}, RWL=${niosh.result.RWL.toFixed(2)}kg — Riesgo ${riesgo}.`,
    )
  }

  if (mmc && mmc.input.peso > 0) {
    out.push(
      `MMC: ${mmc.input.peso}kg — RM375: ${mmc.result.cumRM ? 'cumple' : 'INCUMPLE'} (${mmc.result.limRM}kg), ` +
        `ISO: ${mmc.result.cumISO ? 'cumple' : 'INCUMPLE'} (${mmc.result.limISO}kg). ` +
        `${mmc.result.nF} factores adicionales.`,
    )
  }

  // TME probables
  const tme: string[] = []
  if ((reba && reba.input.trunk >= 3) || (owas && owas.input.back >= 2)) {
    tme.push('lumbalgia/hernia discal lumbar')
  }
  if (reba && reba.input.ua >= 3) {
    tme.push('tendinopatía manguito rotador')
  }
  if (reba && reba.input.wrist >= 2) {
    tme.push('síndrome túnel carpiano')
  }
  if (reba && reba.input.legs >= 3) {
    tme.push('condropatía rotuliana')
  }
  if (tme.length && maxLvl >= 2) {
    out.push(`TME probables: ${tme.join(', ')}.`)
  }

  out.push(
    maxLvl >= 4
      ? 'Se requiere intervención INMEDIATA.'
      : maxLvl >= 3
        ? 'Se requiere intervención a corto plazo.'
        : maxLvl >= 2
          ? 'Implementar medidas correctivas y re-evaluar.'
          : 'Riesgo bajo, mantener vigilancia periódica.',
  )

  return out
}

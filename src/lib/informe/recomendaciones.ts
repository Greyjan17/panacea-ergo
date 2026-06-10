// Generador de recomendaciones dinámicas para el informe.
// Función pura: dadas las entradas + cálculos, devuelve listas categorizadas.

import type { REBAInput, REBAResult } from '@/lib/calc/reba'
import type { RULAInput, RULAResult } from '@/lib/calc/rula'
import type { OWASInput, OWASResult } from '@/lib/calc/owas'
import type { NIOSHInput, NIOSHResult } from '@/lib/calc/niosh'
import type { MMCInput, MMCResult } from '@/lib/calc/mmc'

export interface RecomendacionesInput {
  reba?: { input: REBAInput; result: REBAResult }
  rula?: { input: RULAInput; result: RULAResult }
  owas?: { input: OWASInput; result: OWASResult }
  niosh?: { input: NIOSHInput; result: NIOSHResult }
  mmc?: { input: MMCInput; result: MMCResult }
  /** Límite aplicable (kg) — desde RM 375. */
  limAp: number
}

export interface Recomendaciones {
  ingenieria: string[]
  administrativas: string[]
  vigilancia: string[]
}

export function getRecomendaciones(input: RecomendacionesInput): Recomendaciones {
  const { reba, rula, owas, niosh, mmc, limAp } = input
  const ing: string[] = []
  const adm: string[] = []
  const vig: string[] = []

  const maxLvl = Math.max(
    reba?.result.level ?? 0,
    rula?.result.level ?? 0,
    owas?.result.level ?? 0,
    niosh?.result.level ?? 0,
    mmc?.result.level ?? 0,
  )

  // ── Ingeniería ────────────────────────────────────────────────────────
  if (reba && reba.input.trunk >= 3) {
    ing.push(
      'Instalar mesa/plataforma elevada (70-90cm) para eliminar flexión de tronco durante manipulación.',
    )
  }
  if (reba && reba.input.trunk >= 2) {
    ing.push('Reorganizar acopio entre rodillas y hombros del operador (60-130cm).')
  }
  if ((mmc && !mmc.result.cumRM) || (niosh && niosh.result.LI > 1)) {
    ing.push(`Implementar ayuda mecánica para cargas superiores a ${limAp}kg.`)
  }
  if (reba && reba.input.coup >= 2) {
    ing.push('Proveer contenedores con asideros ergonómicos.')
  }
  if (reba && reba.input.ua >= 3) {
    ing.push('Reducir altura de zona de depósito para evitar elevación de brazos >45°.')
  }
  if (reba && reba.input.legs >= 3) {
    ing.push('Elevar zona de trabajo para eliminar cuclillas/flexión extrema de rodillas.')
  }
  if (owas && owas.result.cat >= 3) {
    ing.push('Rediseñar estación para postura erguida con acceso frontal.')
  }
  if (niosh && niosh.result.LI > 3) {
    ing.push('Reducir distancia horizontal y vertical de levantamiento.')
  }
  if (ing.length === 0) {
    ing.push('Mantener condiciones actuales con monitoreo periódico.')
  }

  // ── Administrativas ───────────────────────────────────────────────────
  if (reba || niosh || mmc) {
    adm.push(
      'Capacitación en técnica de levantamiento: rodillas flexionadas, carga pegada al cuerpo, espalda neutra.',
    )
  }
  if (mmc || niosh) {
    adm.push(`Límite individual: máximo ${limAp}kg. Cargas mayores requieren trabajo en equipo.`)
  }
  if (maxLvl >= 2) {
    adm.push('Rotación de tareas: máximo 30 minutos continuos de manipulación manual.')
  }
  if (maxLvl >= 3) {
    adm.push('Pausas activas obligatorias de 5 minutos cada hora.')
  } else if (maxLvl >= 2) {
    adm.push('Pausas activas de 5 minutos cada 2 horas.')
  }
  if (mmc && mmc.input.form === 'no') {
    adm.push('Capacitación inmediata en MMC — agravante RM 375 Art.6.')
  }
  if (rula && rula.result.level >= 3) {
    adm.push('Micro-pausas de 30s cada 15min para extremidades superiores.')
  }

  // ── Vigilancia médica ─────────────────────────────────────────────────
  if (reba && reba.input.trunk >= 3) {
    vig.push('Evaluación columna lumbar: Lasègue, Schober, palpación L4-L5/L5-S1.')
  }
  if (reba && reba.input.ua >= 3) {
    vig.push('Evaluación hombros: Neer, Hawkins, Jobe.')
  }
  if (reba && reba.input.wrist >= 2) {
    vig.push('Evaluación muñecas: Phalen, Tinel.')
  }
  if (reba && reba.input.legs >= 3) {
    vig.push('Evaluación rodillas: Clarke, McMurray.')
  }
  vig.push('Cuestionario Nórdico (NMQ) para detección temprana.')
  vig.push(
    maxLvl >= 3
      ? 'Re-evaluación ergonómica en 60 días post-medidas.'
      : maxLvl >= 2
        ? 'Re-evaluación en 90 días.'
        : 'Re-evaluación semestral.',
  )

  return { ingenieria: ing, administrativas: adm, vigilancia: vig }
}

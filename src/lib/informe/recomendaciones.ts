// Generador de recomendaciones dinámicas para el informe.
// Función pura: dadas las entradas + cálculos, devuelve listas categorizadas.

import { rebaPiernas, type REBAInput, type REBAResult } from '@/lib/calc/reba'
import type { RULAInput, RULAResult } from '@/lib/calc/rula'
import type { OWASInput, OWASResult } from '@/lib/calc/owas'
import type { NIOSHInput, NIOSHResult } from '@/lib/calc/niosh'
import type { MMCInput, MMCResult } from '@/lib/calc/mmc'
import type { ROSAInput, ROSAResult } from '@/lib/calc/rosa'

export interface RecomendacionesInput {
  reba?: { input: REBAInput; result: REBAResult }
  rula?: { input: RULAInput; result: RULAResult }
  owas?: { input: OWASInput; result: OWASResult }
  niosh?: { input: NIOSHInput; result: NIOSHResult }
  mmc?: { input: MMCInput; result: MMCResult }
  rosa?: { input: ROSAInput; result: ROSAResult }
  /** Límite aplicable (kg) — desde RM 375. */
  limAp: number
}

export interface Recomendaciones {
  ingenieria: string[]
  administrativas: string[]
  vigilancia: string[]
}

export function getRecomendaciones(input: RecomendacionesInput): Recomendaciones {
  const { reba, rula, owas, niosh, mmc, rosa, limAp } = input
  const ing: string[] = []
  const adm: string[] = []
  const vig: string[] = []

  const maxLvl = Math.max(
    reba?.result.level ?? 0,
    rula?.result.level ?? 0,
    owas?.result.level ?? 0,
    niosh?.result.level ?? 0,
    mmc?.result.level ?? 0,
    rosa?.result.level ?? 0,
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
  if (reba && rebaPiernas(reba.input).rodillas >= 1) {
    ing.push('Elevar zona de trabajo para eliminar cuclillas/flexión extrema de rodillas.')
  }
  if (owas && owas.result.cat >= 3) {
    ing.push('Rediseñar estación para postura erguida con acceso frontal.')
  }
  if (niosh && niosh.result.LI > 3) {
    ing.push('Reducir distancia horizontal y vertical de levantamiento.')
  }
  if (rosa) {
    const i = rosa.input
    if (i.altura > 1 || i.alturaEspacio || i.profundidad > 1 || i.respaldo > 1 || i.reposabrazos > 1 ||
        i.alturaNoReg || i.profundidadNoReg || i.respaldoNoAjust || i.reposaNoAjust) {
      ing.push('Silla regulable en altura y profundidad, con respaldo con apoyo lumbar reclinable (95-110°) y reposabrazos ajustables; reposapiés si los pies no apoyan.')
    }
    if (i.pantalla > 1 || i.pantallaGiro || (i.pantallaLejos && i.pantalla === 2)) {
      ing.push('Ubicar la pantalla de frente, a 45-75 cm de los ojos, con el borde superior a la altura de los ojos.')
    }
    if (i.pantallaBrillos) ing.push('Eliminar brillos y reflejos: reorientar la pantalla respecto a ventanas y luminarias.')
    if (i.pantallaDocs) ing.push('Proveer atril o portadocumentos a la altura de la pantalla.')
    if (i.telefonoCuello || i.telefonoSinManos || i.telefono > 1) ing.push('Proveer auricular o manos libres y acercar el teléfono a menos de 30 cm.')
    if (i.mouse > 1 || i.mouseAlturas || i.mousePinza || i.mouseReposa) ing.push('Mouse de tamaño adecuado, a la misma altura que el teclado y alineado con el hombro.')
    if (i.teclado > 1 || i.tecladoDesv || i.tecladoAlto || i.tecladoNoAjust || i.respaldoMesaAlta) ing.push('Teclado a la altura de los codos con muñecas neutras (bandeja regulable o mesa de altura adecuada).')
    if (i.tecladoAlcance) ing.push('Reubicar los objetos de uso frecuente dentro del área de alcance cómodo.')
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
  if (maxLvl >= 2 && (reba || niosh || mmc || owas)) {
    adm.push('Rotación de tareas: máximo 30 minutos continuos de manipulación manual.')
  }
  if (rosa) {
    adm.push('Capacitación en ajuste del puesto de oficina (silla, pantalla, teclado y mouse).')
    if (rosa.result.level >= 2) adm.push('Pausas visuales y de estiramiento de 5 minutos por cada hora de trabajo continuo con pantalla.')
  }
  if (maxLvl >= 3) {
    adm.push('Pausas activas obligatorias de 5 minutos cada hora.')
  } else if (maxLvl >= 2) {
    adm.push('Pausas activas de 5 minutos cada 2 horas.')
  }
  if (mmc && mmc.result.gestante) {
    adm.push('Reubicar a la trabajadora gestante en un puesto sin manipulación manual de cargas (RM 375-2008-TR, Título III, num. 12).')
  }
  if (mmc && mmc.input.form === 'no') {
    adm.push('Capacitación inmediata en técnicas de MMC — exigida por RM 375-2008-TR, Título III, num. 13.')
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
  if (reba && rebaPiernas(reba.input).rodillas >= 1) {
    vig.push('Evaluación rodillas: Clarke, McMurray.')
  }
  if (rosa && (rosa.input.pantalla > 1 || rosa.input.pantallaGiro || rosa.input.telefonoCuello)) {
    vig.push('Evaluación de columna cervical y hombros.')
  }
  if (rosa) {
    vig.push('Evaluación de agudeza visual (trabajo con pantalla de visualización de datos).')
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

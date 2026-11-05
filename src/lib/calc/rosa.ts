// ROSA — Rapid Office Strain Assessment (Sonne, Villalta & Andrews, 2012).
// Implementación pura. Diagramas de puntuación y Tablas A–E según la publicación original,
// cotejadas con la transcripción de Ergonautas (UPV): ergonautas.upv.es/metodos/rosa/rosa-ayuda.php

import type { RiskLevel } from '@/types/ergo'

/** Tiempo de uso diario del elemento: -1 (<1 h total o <30 min seguidos) · 0 (1-4 h o 30-60 min) · +1 (>4 h o >1 h seguida). */
export type ROSATiempo = -1 | 0 | 1

export interface ROSAInput {
  // Silla
  /** 1 rodillas ~90° · 2 asiento muy bajo o muy alto · 3 pies sin contacto con el suelo */
  altura: 1 | 2 | 3
  alturaEspacio: boolean // espacio insuficiente para las piernas bajo la mesa (+1)
  alturaNoReg: boolean // altura no regulable (+1)
  /** 1 ~8 cm entre asiento y corva · 2 asiento muy largo o muy corto */
  profundidad: 1 | 2
  profundidadNoReg: boolean // (+1)
  /** 1 codos apoyados en línea con hombros relajados · 2 muy altos o muy bajos */
  reposabrazos: 1 | 2
  reposaSeparados: boolean // (+1)
  reposaDuro: boolean // superficie dura o dañada (+1)
  reposaNoAjust: boolean // (+1)
  /** 1 reclinado 95-110° con apoyo lumbar · 2 sin apoyo lumbar, ángulo fuera de rango o sin respaldo */
  respaldo: 1 | 2
  respaldoMesaAlta: boolean // superficie de trabajo demasiado alta, hombros encogidos (+1)
  respaldoNoAjust: boolean // (+1)
  tSilla: ROSATiempo
  // Pantalla
  /** 1 a 45-75 cm y borde superior a la altura de los ojos · 2 muy baja (30° bajo los ojos) · 3 muy alta (extensión de cuello) */
  pantalla: 1 | 2 | 3
  pantallaGiro: boolean // desviada lateralmente, gira el cuello (+1)
  pantallaDocs: boolean // maneja documentos sin atril (+1)
  pantallaBrillos: boolean // (+1)
  /** Muy lejos (>75 cm). Solo suma si la pantalla está muy baja (pantalla = 2). */
  pantallaLejos: boolean
  tPantalla: ROSATiempo
  // Teléfono
  /** 1 auricular o una mano con cuello neutro, a ≤30 cm · 2 a más de 30 cm */
  telefono: 1 | 2
  telefonoCuello: boolean // sujeto entre cuello y hombro (+2)
  telefonoSinManos: boolean // sin función manos libres (+1)
  tTelefono: ROSATiempo
  // Mouse
  /** 1 alineado con el hombro · 2 no alineado o lejos del cuerpo */
  mouse: 1 | 2
  mousePinza: boolean // muy pequeño, agarre en pinza (+1)
  mouseAlturas: boolean // mouse y teclado a diferentes alturas (+2)
  mouseReposa: boolean // reposamanos duro o puntos de presión (+1)
  tMouse: ROSATiempo
  // Teclado
  /** 1 muñecas rectas y hombros relajados · 2 muñecas extendidas >15° */
  teclado: 1 | 2
  tecladoDesv: boolean // muñecas desviadas lateralmente (+1)
  tecladoAlto: boolean // teclado muy alto, hombros encogidos (+1)
  tecladoAlcance: boolean // alcanzar objetos alejados o sobre la cabeza (+1)
  tecladoNoAjust: boolean // teclado o plataforma no ajustables (+1)
  tTeclado: ROSATiempo
}

export interface ROSAResult {
  silla: number
  pantalla: number
  telefono: number
  mouse: number
  teclado: number
  /** Tabla B (pantalla y teléfono) */
  pantallaTelefono: number
  /** Tabla C (mouse y teclado) */
  mouseTeclado: number
  /** Tabla D: puntuación de pantalla y periféricos */
  perifericos: number
  /** Tabla E: puntuación final ROSA (1-10) */
  fin: number
  /** Nivel de actuación ROSA 0-4 */
  nivelActuacion: 0 | 1 | 2 | 3 | 4
  level: RiskLevel
}

// Tabla A: [alturaAsiento + profundidad (2-8) - 2][reposabrazos + respaldo (2-9) - 2]
const TABLE_A: number[][] = [
  [2, 2, 3, 4, 5, 6, 7, 8],
  [2, 2, 3, 4, 5, 6, 7, 8],
  [3, 3, 3, 4, 5, 6, 7, 8],
  [4, 4, 4, 4, 5, 6, 7, 8],
  [5, 5, 5, 5, 6, 7, 8, 9],
  [6, 6, 6, 7, 7, 8, 8, 9],
  [7, 7, 7, 8, 8, 9, 9, 9],
]

// Tabla B: [teléfono (0-6)][pantalla (0-7)]
const TABLE_B: number[][] = [
  [1, 1, 1, 2, 3, 4, 5, 6],
  [1, 1, 2, 2, 3, 4, 5, 6],
  [1, 2, 2, 3, 3, 4, 6, 7],
  [2, 2, 3, 3, 4, 5, 6, 8],
  [3, 3, 4, 4, 5, 6, 7, 8],
  [4, 4, 5, 5, 6, 7, 8, 9],
  [5, 5, 6, 7, 8, 8, 9, 9],
]

// Tabla C: [mouse (0-7)][teclado (0-7)]
const TABLE_C: number[][] = [
  [1, 1, 1, 2, 3, 4, 5, 6],
  [1, 1, 2, 3, 4, 5, 6, 7],
  [1, 2, 2, 3, 4, 5, 6, 7],
  [2, 3, 3, 3, 5, 6, 7, 8],
  [3, 4, 4, 5, 5, 6, 7, 8],
  [4, 5, 5, 6, 6, 7, 8, 9],
  [5, 6, 6, 7, 7, 8, 8, 9],
  [6, 7, 7, 8, 8, 9, 9, 9],
]

// Tabla D y Tabla E siguen la misma regla: resultado = max(fila, columna).
// Se escriben completas para poder cotejarlas celda a celda con la publicación.
// Tabla D: [Tabla B (1-9) - 1][Tabla C (1-9) - 1]
const TABLE_D: number[][] = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [2, 2, 3, 4, 5, 6, 7, 8, 9],
  [3, 3, 3, 4, 5, 6, 7, 8, 9],
  [4, 4, 4, 4, 5, 6, 7, 8, 9],
  [5, 5, 5, 5, 5, 6, 7, 8, 9],
  [6, 6, 6, 6, 6, 6, 7, 8, 9],
  [7, 7, 7, 7, 7, 7, 7, 8, 9],
  [8, 8, 8, 8, 8, 8, 8, 8, 9],
  [9, 9, 9, 9, 9, 9, 9, 9, 9],
]

// Tabla E: [silla (1-10) - 1][pantalla y periféricos (1-10) - 1]
const TABLE_E: number[][] = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  [2, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  [3, 3, 3, 4, 5, 6, 7, 8, 9, 10],
  [4, 4, 4, 4, 5, 6, 7, 8, 9, 10],
  [5, 5, 5, 5, 5, 6, 7, 8, 9, 10],
  [6, 6, 6, 6, 6, 6, 7, 8, 9, 10],
  [7, 7, 7, 7, 7, 7, 7, 8, 9, 10],
  [8, 8, 8, 8, 8, 8, 8, 8, 9, 10],
  [9, 9, 9, 9, 9, 9, 9, 9, 9, 10],
  [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
]

const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x))
const b = (x: boolean | undefined, pts = 1): number => (x ? pts : 0)

// Niveles de actuación ROSA: 1 → 0 · 2-4 → 1 · 5 → 2 · 6-8 → 3 · 9-10 → 4.
// Coinciden con la escala común 0-4 por acción (ver types/ergo.ts).
function nivel(fin: number): 0 | 1 | 2 | 3 | 4 {
  if (fin <= 1) return 0
  if (fin <= 4) return 1
  if (fin === 5) return 2
  if (fin <= 8) return 3
  return 4
}

export function calcRosa(i: ROSAInput): ROSAResult {
  // Silla
  const altura = i.altura + b(i.alturaEspacio) + b(i.alturaNoReg)
  const prof = i.profundidad + b(i.profundidadNoReg)
  const repo = i.reposabrazos + b(i.reposaSeparados) + b(i.reposaDuro) + b(i.reposaNoAjust)
  const resp = i.respaldo + b(i.respaldoMesaAlta) + b(i.respaldoNoAjust)
  const a = TABLE_A[clamp(altura + prof, 2, 8) - 2]![clamp(repo + resp, 2, 9) - 2]!
  const silla = clamp(a + i.tSilla, 1, 10)

  // Pantalla y teléfono
  const pantalla = clamp(
    i.pantalla + b(i.pantallaGiro) + b(i.pantallaDocs) + b(i.pantallaBrillos) +
      b(i.pantallaLejos && i.pantalla === 2) + i.tPantalla,
    0, 7,
  )
  const telefono = clamp(i.telefono + b(i.telefonoCuello, 2) + b(i.telefonoSinManos) + i.tTelefono, 0, 6)
  const pantallaTelefono = TABLE_B[telefono]![pantalla]!

  // Mouse y teclado
  const mouse = clamp(i.mouse + b(i.mousePinza) + b(i.mouseAlturas, 2) + b(i.mouseReposa) + i.tMouse, 0, 7)
  const teclado = clamp(
    i.teclado + b(i.tecladoDesv) + b(i.tecladoAlto) + b(i.tecladoAlcance) + b(i.tecladoNoAjust) + i.tTeclado,
    0, 7,
  )
  const mouseTeclado = TABLE_C[mouse]![teclado]!

  const perifericos = TABLE_D[clamp(pantallaTelefono, 1, 9) - 1]![clamp(mouseTeclado, 1, 9) - 1]!
  const fin = TABLE_E[silla - 1]![clamp(perifericos, 1, 10) - 1]!
  const nivelActuacion = nivel(fin)

  return {
    silla, pantalla, telefono, mouse, teclado,
    pantallaTelefono, mouseTeclado, perifericos, fin,
    nivelActuacion, level: nivelActuacion as RiskLevel,
  }
}

export const ROSA_ACTUACION: Record<0 | 1 | 2 | 3 | 4, { riesgo: string; accion: string }> = {
  0: { riesgo: 'Inapreciable', accion: 'No es necesaria actuación.' },
  1: { riesgo: 'Mejorable', accion: 'Pueden mejorarse algunos elementos del puesto.' },
  2: { riesgo: 'Alto', accion: 'Es necesaria la actuación.' },
  3: { riesgo: 'Muy alto', accion: 'Es necesaria la actuación cuanto antes.' },
  4: { riesgo: 'Extremo', accion: 'Es necesaria la actuación urgentemente.' },
}

// Normativa peruana e internacional aplicable.
// Fuentes:
//  - RM N° 375-2008-TR (Perú): límites de carga manual (Título III, num. 4 varones y num. 5 mujeres)
//  - ISO 11228-1:2021: ergonomía — manipulación manual (masas de referencia, cuadro de condiciones críticas y Anexo B)

export const RM_375 = {
  masculino: { general: 25, entrenado: 40 },
  femenino: { general: 15, entrenado: 24 },
} as const

export interface ISOGrupo {
  grupo: string
  sexo: 'masculino' | 'femenino'
  /** Masa de referencia (kg): por encima de ella el levantamiento es condición crítica. */
  mref: number
}

// ISO 11228-1:2021, cuadro de condiciones críticas (texto oficial): mujeres 20-45 años 20 kg;
// mujeres <20 o >45 años 15 kg; varones 20-45 años 25 kg; varones <20 o >45 años 20 kg.
// La norma NO fija límites fijos por frecuencia: en tareas repetitivas el límite se obtiene
// ajustando la masa de referencia por frecuencia y posición (método tipo NIOSH, Anexo C).
export const ISO_11228: ISOGrupo[] = [
  { grupo: 'Varón de 20 a 45 años', sexo: 'masculino', mref: 25 },
  { grupo: 'Varón menor de 20 o mayor de 45 años', sexo: 'masculino', mref: 20 },
  { grupo: 'Mujer de 20 a 45 años', sexo: 'femenino', mref: 20 },
  { grupo: 'Mujer menor de 20 o mayor de 45 años', sexo: 'femenino', mref: 15 },
]

/** Nombres de grupo de versiones anteriores (evaluaciones guardadas) → grupo ISO 11228-1:2021. */
const GRUPO_ANTERIOR: Record<string, string> = {
  'Varón adulto (18-45 años)': 'Varón de 20 a 45 años',
  'Varón joven (16-18 años)': 'Varón menor de 20 o mayor de 45 años',
  'Varón mayor (>45 años)': 'Varón menor de 20 o mayor de 45 años',
  'Mujer adulta (18-45 años)': 'Mujer de 20 a 45 años',
  'Mujer joven (16-18 años)': 'Mujer menor de 20 o mayor de 45 años',
  'Mujer mayor (>45 años)': 'Mujer menor de 20 o mayor de 45 años',
}

/** Grupo ISO del trabajador; si no coincide con su sexo, se usa el grupo de 20-45 años de su sexo. */
export function isoGrupo(nombre: string, sexo: 'masculino' | 'femenino'): ISOGrupo {
  const n = GRUPO_ANTERIOR[nombre] ?? nombre
  const g = ISO_11228.find(x => x.grupo === n)
  if (g && g.sexo === sexo) return g
  return ISO_11228.find(x => x.sexo === sexo)!
}

export interface RebaRiesgo {
  max: number
  nivel: string
  accion: string
}

export const REBA_RIESGO: RebaRiesgo[] = [
  { max: 1, nivel: 'Inapreciable', accion: 'Sin acción necesaria' },
  { max: 3, nivel: 'Bajo', accion: 'Puede requerirse acción' },
  { max: 7, nivel: 'Medio', accion: 'Acción necesaria' },
  { max: 10, nivel: 'Alto', accion: 'Acción necesaria pronto' },
  { max: 15, nivel: 'Muy Alto', accion: 'Acción INMEDIATA' },
]

// Niveles de acción RULA (McAtamney & Corlett 1993): 1-2 / 3-4 / 5-6 / 7.
export const RULA_ACCION = [
  { max: 2, nivel: 'Aceptable', accion: 'Postura aceptable si no se mantiene ni se repite por periodos largos' },
  { max: 4, nivel: 'Investigar', accion: 'Investigar; pueden requerirse cambios' },
  { max: 6, nivel: 'Cambios pronto', accion: 'Investigar y cambiar pronto' },
  { max: 99, nivel: 'Urgente', accion: 'Investigar y cambiar INMEDIATAMENTE' },
] as const

export const OWAS_ACCION = [
  'Sin acción',
  'Acción en futuro próximo',
  'Acción cuanto antes',
  'Acción INMEDIATA',
] as const

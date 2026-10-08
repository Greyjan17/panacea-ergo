// Normativa peruana e internacional aplicable.
// Fuentes:
//  - RM N° 375-2008-TR (Perú): límites de carga manual (Título III, num. 4 varones y num. 5 mujeres)
//  - ISO 11228-1:2003: ergonomía — manipulación manual

export const RM_375 = {
  masculino: { general: 25, entrenado: 40 },
  femenino: { general: 15, entrenado: 24 },
} as const

export interface ISOGrupo {
  grupo: string
  ocasional: number
  frecuente: number
  muyFrecuente: number
}

export const ISO_11228: ISOGrupo[] = [
  { grupo: 'Varón adulto (18-45 años)', ocasional: 25, frecuente: 15, muyFrecuente: 10 },
  { grupo: 'Varón joven (16-18 años)', ocasional: 20, frecuente: 13, muyFrecuente: 8 },
  { grupo: 'Varón mayor (>45 años)', ocasional: 20, frecuente: 13, muyFrecuente: 8 },
  { grupo: 'Mujer adulta (18-45 años)', ocasional: 15, frecuente: 9, muyFrecuente: 6 },
  { grupo: 'Mujer joven (16-18 años)', ocasional: 13, frecuente: 8, muyFrecuente: 5 },
  { grupo: 'Mujer mayor (>45 años)', ocasional: 13, frecuente: 8, muyFrecuente: 5 },
]

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

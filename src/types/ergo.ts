// Escala común 0-4 para comparar métodos (y para level_max), alineada por la ACCIÓN que pide cada método:
//   0 sin acción · 1 puede requerirse acción · 2 acción necesaria · 3 acción pronto · 4 acción inmediata
//   REBA 1 / 2-3 / 4-7 / 8-10 / 11-15 · RULA 1-2 / 3-4 / — / 5-6 / 7 · OWAS cat.1 / — / cat.2 / cat.3 / cat.4
export type RiskLevel = 0 | 1 | 2 | 3 | 4
export const RISK_LEVEL_NAME: Record<RiskLevel, string> = {
  0: 'Inapreciable',
  1: 'Bajo',
  2: 'Medio',
  3: 'Alto',
  4: 'Muy Alto',
}

export type Sexo = 'masculino' | 'femenino'

export type Frecuencia = 'ocasional' | 'frecuente' | 'muyFrecuente'

export type Method = 'REBA' | 'RULA' | 'OWAS' | 'NIOSH' | 'MMC'

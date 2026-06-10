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

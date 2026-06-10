// Mapeo de ángulos medidos a niveles REBA y RULA según los rangos publicados.

import type { PoseAngles } from './types'

export interface REBALevels {
  trunk: 1 | 2 | 3 | 4
  neck: 1 | 2
  ua: 1 | 2 | 3 | 4
  la: 1 | 2
  wrist: 1 | 2
  legs: 1 | 3 | 4
}

export interface RULALevels {
  trunk: 1 | 2 | 3 | 4
  neck: 1 | 2 | 3
  ua: 1 | 2 | 3 | 4
  la: 1 | 2
  wrist: 1 | 2 | 3
}

export function mapAnglesToREBA(a: PoseAngles): REBALevels {
  return {
    trunk: a.trunk <= 5 ? 1 : a.trunk <= 20 ? 2 : a.trunk <= 60 ? 3 : 4,
    neck: a.neck <= 20 ? 1 : 2,
    ua: a.ua <= 20 ? 1 : a.ua <= 45 ? 2 : a.ua <= 90 ? 3 : 4,
    la: a.la >= 60 && a.la <= 100 ? 1 : 2,
    wrist: a.wrist <= 15 ? 1 : 2,
    // Piernas: REBA tiene 4 niveles; sin dato lateral confiable mapeamos 1/3/4
    legs: a.knee >= 150 ? 1 : a.knee >= 120 ? 3 : 4,
  }
}

export function mapAnglesToRULA(a: PoseAngles): RULALevels {
  return {
    trunk: a.trunk <= 5 ? 1 : a.trunk <= 20 ? 2 : a.trunk <= 60 ? 3 : 4,
    neck: a.neck <= 10 ? 1 : a.neck <= 20 ? 2 : 3,
    ua: a.ua <= 20 ? 1 : a.ua <= 45 ? 2 : a.ua <= 90 ? 3 : 4,
    la: a.la >= 60 && a.la <= 100 ? 1 : 2,
    wrist: a.wrist <= 5 ? 1 : a.wrist <= 15 ? 2 : 3,
  }
}

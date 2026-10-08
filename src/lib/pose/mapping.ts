// Mapeo de ángulos medidos a niveles REBA y RULA según los rangos publicados.

import type { PoseAngles } from './types'

export interface REBALevels {
  trunk: 1 | 2 | 3 | 4
  neck: 1 | 2
  ua: 1 | 2 | 3 | 4
  la: 1 | 2
  wrist: 1 | 2
  /** Flexión de rodillas REBA (+0/+1/+2). El tipo de apoyo no se mide: lo define el evaluador. */
  knee: 0 | 1 | 2
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
    // Rodillas: ángulo articular 180° = extendida; flexión = 180 - ángulo.
    knee: a.knee >= 150 ? 0 : a.knee >= 120 ? 1 : 2,
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

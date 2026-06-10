// Cálculo de ángulos a partir de landmarks 2D normalizados.
// Geometría pura — sin dependencias DOM, testeable en Node.

import { PL, type Landmark, type PoseAngles } from './types'

/** Ángulo en B formado por los puntos A-B-C (grados, 0..180). */
export function angleOf(
  a: Pick<Landmark, 'x' | 'y'>,
  b: Pick<Landmark, 'x' | 'y'>,
  c: Pick<Landmark, 'x' | 'y'>,
): number {
  const ab = { x: a.x - b.x, y: a.y - b.y }
  const cb = { x: c.x - b.x, y: c.y - b.y }
  const dot = ab.x * cb.x + ab.y * cb.y
  const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y)
  const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y)
  if (magAB === 0 || magCB === 0) return 0
  const cosA = Math.max(-1, Math.min(1, dot / (magAB * magCB)))
  return Math.round((Math.acos(cosA) * 180) / Math.PI)
}

/** Ángulo respecto a la vertical (Y- positivo = arriba en imagen). */
export function angleFromVertical(
  top: Pick<Landmark, 'x' | 'y'>,
  bottom: Pick<Landmark, 'x' | 'y'>,
): number {
  const dx = top.x - bottom.x
  const dy = top.y - bottom.y // Y crece hacia abajo en imagen
  return Math.round(Math.abs((Math.atan2(dx, -dy) * 180) / Math.PI))
}

/** Punto medio entre dos landmarks. */
export function midpoint(a: Landmark, b: Landmark): Pick<Landmark, 'x' | 'y'> {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/**
 * Extrae todos los ángulos relevantes de una postura.
 * Lanza si faltan landmarks críticos (visibility < umbral).
 */
export function calcPoseAngles(lm: ReadonlyArray<Landmark>): PoseAngles {
  if (lm.length < 33) {
    throw new Error(`Esperaba 33 landmarks, recibí ${lm.length}`)
  }
  const get = (idx: number): Landmark => {
    const p = lm[idx]
    if (!p) throw new Error(`Landmark ${idx} no disponible`)
    return p
  }

  const ls = get(PL.LEFT_SHOULDER), rs = get(PL.RIGHT_SHOULDER)
  const le = get(PL.LEFT_ELBOW),    re = get(PL.RIGHT_ELBOW)
  const lw = get(PL.LEFT_WRIST),    rw = get(PL.RIGHT_WRIST)
  const lh = get(PL.LEFT_HIP),      rh = get(PL.RIGHT_HIP)
  const lk = get(PL.LEFT_KNEE),     rk = get(PL.RIGHT_KNEE)
  const la = get(PL.LEFT_ANKLE),    ra = get(PL.RIGHT_ANKLE)
  const nose = get(PL.NOSE)

  const midSh = midpoint(ls, rs)
  const midHp = midpoint(lh, rh)

  // Tronco: ángulo del eje cadera→hombro respecto a la vertical
  const trunk = angleFromVertical(midSh, midHp)

  // Cuello: ángulo nariz-hombro_medio-cadera_medio
  // 180° = nariz alineada con el eje del tronco (sin flexión); menor = más flexión cervical
  const neckRaw = angleOf(nose, midSh, midHp)
  const neckFlex = Math.max(0, 180 - neckRaw)

  // Brazos superiores: cadera→hombro→codo, izq y der; quedarse con el peor (mayor)
  const uaL = angleOf(lh, ls, le)
  const uaR = angleOf(rh, rs, re)
  const ua = Math.max(uaL, uaR)

  // Antebrazo: hombro→codo→muñeca; peor lado
  const laL = angleOf(ls, le, lw)
  const laR = angleOf(rs, re, rw)
  const laAng = Math.max(laL, laR)

  // Muñeca: aproximación — desviación respecto al antebrazo
  // Se mide como `|180 - ángulo(codo, muñeca, punto-bajo-muñeca)|`.
  const downL = { x: lw.x, y: lw.y + 0.1 }
  const downR = { x: rw.x, y: rw.y + 0.1 }
  const wristL = Math.abs(180 - angleOf(le, lw, downL))
  const wristR = Math.abs(180 - angleOf(re, rw, downR))
  const wrist = Math.max(wristL, wristR)

  // Rodillas: cadera→rodilla→tobillo. Menor ángulo = más flexión.
  const kneeL = angleOf(lh, lk, la)
  const kneeR = angleOf(rh, rk, ra)
  const knee = Math.min(kneeL, kneeR)

  return {
    trunk: Math.round(trunk),
    neck: Math.round(neckFlex),
    ua: Math.round(ua),
    uaL: Math.round(uaL),
    uaR: Math.round(uaR),
    la: Math.round(laAng),
    wrist: Math.round(wrist),
    knee: Math.round(knee),
    kneeL: Math.round(kneeL),
    kneeR: Math.round(kneeR),
  }
}

/**
 * Consolida múltiples mediciones (varias fotos) tomando la peor postura por segmento.
 * Para flexión-mayor-peor (trunk, neck, ua, la, wrist): max.
 * Para flexión-menor-peor (knee): min.
 */
export function consolidateWorstAngles(measurements: ReadonlyArray<PoseAngles>): PoseAngles {
  if (measurements.length === 0) {
    throw new Error('No hay mediciones para consolidar')
  }
  const first = measurements[0]!
  return measurements.reduce<PoseAngles>(
    (acc, m) => ({
      trunk: Math.max(acc.trunk, m.trunk),
      neck: Math.max(acc.neck, m.neck),
      ua: Math.max(acc.ua, m.ua),
      uaL: Math.max(acc.uaL, m.uaL),
      uaR: Math.max(acc.uaR, m.uaR),
      la: Math.max(acc.la, m.la),
      wrist: Math.max(acc.wrist, m.wrist),
      knee: Math.min(acc.knee, m.knee),
      kneeL: Math.min(acc.kneeL, m.kneeL),
      kneeR: Math.min(acc.kneeR, m.kneeR),
    }),
    first,
  )
}

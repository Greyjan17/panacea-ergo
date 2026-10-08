// Interpretación clínica de los ángulos medidos.
// Genera hallazgos categóricos con severidad para el informe.
// Describen exposición postural (lo observable en la foto), no diagnósticos.

import type { PoseAngles } from './types'

export type RiskTag = 'alto' | 'medio' | 'bajo'

export interface Finding {
  seg: 'Tronco' | 'Cuello' | 'Brazo sup.' | 'Brazo inf.' | 'Muñeca' | 'Rodillas'
  ang: number
  risk: RiskTag
  desc: string
}

export function interpretAngles(a: PoseAngles): Finding[] {
  const findings: Finding[] = []

  // Tronco
  if (a.trunk > 60) {
    findings.push({
      seg: 'Tronco', ang: a.trunk, risk: 'alto',
      desc: `Flexión ${a.trunk}° — flexión marcada de tronco, alta carga sobre la columna lumbar (asociada a mayor riesgo de lumbalgia).`,
    })
  } else if (a.trunk > 20) {
    findings.push({
      seg: 'Tronco', ang: a.trunk, risk: 'medio',
      desc: `Flexión ${a.trunk}° — flexión moderada de tronco, sobrecarga de la musculatura lumbar.`,
    })
  } else if (a.trunk > 5) {
    findings.push({
      seg: 'Tronco', ang: a.trunk, risk: 'bajo',
      desc: `Flexión ${a.trunk}° — postura levemente comprometida.`,
    })
  }

  // Cuello
  if (a.neck > 20) {
    findings.push({
      seg: 'Cuello', ang: a.neck, risk: 'medio',
      desc: `Flexión cervical ${a.neck}° — flexión cervical sostenida (asociada a mayor riesgo de cervicalgia).`,
    })
  } else if (a.neck > 10) {
    findings.push({
      seg: 'Cuello', ang: a.neck, risk: 'bajo',
      desc: `Flexión cervical ${a.neck}° — flexión cervical leve.`,
    })
  }

  // Brazo superior
  if (a.ua > 90) {
    findings.push({
      seg: 'Brazo sup.', ang: a.ua, risk: 'alto',
      desc: `Elevación ${a.ua}° — brazo por encima del hombro (asociada a mayor riesgo de tendinopatía del manguito rotador).`,
    })
  } else if (a.ua > 45) {
    findings.push({
      seg: 'Brazo sup.', ang: a.ua, risk: 'medio',
      desc: `Elevación ${a.ua}° — elevación moderada del brazo, sobrecarga del hombro (manguito rotador).`,
    })
  }

  // Brazo inferior (rango funcional 60-100°)
  if (a.la < 60 || a.la > 100) {
    findings.push({
      seg: 'Brazo inf.', ang: a.la, risk: 'medio',
      desc: `Ángulo ${a.la}° fuera del rango funcional 60-100° — postura del codo fuera del rango neutro.`,
    })
  }

  // Muñeca
  if (a.wrist > 15) {
    findings.push({
      seg: 'Muñeca', ang: a.wrist, risk: 'medio',
      desc: `Flexión/extensión ${a.wrist}° de muñeca (asociada a mayor riesgo de trastornos como el túnel carpiano).`,
    })
  }

  // Rodillas (ángulo bajo = mucha flexión)
  if (a.knee < 120) {
    findings.push({
      seg: 'Rodillas', ang: a.knee, risk: 'alto',
      desc: `Flexión ${180 - a.knee}° (ángulo ${a.knee}°) — flexión marcada de rodillas, sobrecarga patelofemoral.`,
    })
  } else if (a.knee < 150) {
    findings.push({
      seg: 'Rodillas', ang: a.knee, risk: 'medio',
      desc: `Flexión ${180 - a.knee}° (ángulo ${a.knee}°) — semiflexión de rodillas, sobrecarga patelofemoral.`,
    })
  }

  return findings
}

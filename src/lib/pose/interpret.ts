// Interpretación clínica de los ángulos medidos.
// Genera hallazgos categóricos con severidad para el informe.

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
      desc: `Flexión ${a.trunk}° — compromiso biomecánico severo L4-L5/L5-S1. Riesgo de hernia discal lumbar.`,
    })
  } else if (a.trunk > 20) {
    findings.push({
      seg: 'Tronco', ang: a.trunk, risk: 'medio',
      desc: `Flexión ${a.trunk}° — carga en zona media-distal lumbar. Sobrecarga paravertebral.`,
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
      desc: `Flexión cervical ${a.neck}° — tensión suboccipital, riesgo de cervicalgia tensional.`,
    })
  } else if (a.neck > 10) {
    findings.push({
      seg: 'Cuello', ang: a.neck, risk: 'bajo',
      desc: `Flexión cervical ${a.neck}° — posición funcional con leve compromiso.`,
    })
  }

  // Brazo superior
  if (a.ua > 90) {
    findings.push({
      seg: 'Brazo sup.', ang: a.ua, risk: 'alto',
      desc: `Elevación ${a.ua}° — abducción extrema, riesgo elevado de síndrome del manguito rotador.`,
    })
  } else if (a.ua > 45) {
    findings.push({
      seg: 'Brazo sup.', ang: a.ua, risk: 'medio',
      desc: `Elevación ${a.ua}° — sobrecarga del manguito rotador y tendón supraespinoso.`,
    })
  }

  // Brazo inferior (rango funcional 60-100°)
  if (a.la < 60 || a.la > 100) {
    findings.push({
      seg: 'Brazo inf.', ang: a.la, risk: 'medio',
      desc: `Ángulo ${a.la}° fuera del rango funcional 60-100° — tensión en tendón bicipital.`,
    })
  }

  // Muñeca
  if (a.wrist > 15) {
    findings.push({
      seg: 'Muñeca', ang: a.wrist, risk: 'medio',
      desc: `Desviación ${a.wrist}° — riesgo de síndrome del túnel carpiano.`,
    })
  }

  // Rodillas (ángulo bajo = mucha flexión)
  if (a.knee < 120) {
    findings.push({
      seg: 'Rodillas', ang: a.knee, risk: 'alto',
      desc: `Flexión ${180 - a.knee}° (ángulo ${a.knee}°) — sobrecarga patelofemoral bilateral severa.`,
    })
  } else if (a.knee < 150) {
    findings.push({
      seg: 'Rodillas', ang: a.knee, risk: 'medio',
      desc: `Flexión ${180 - a.knee}° (ángulo ${a.knee}°) — semisquatting, sobrecarga patelofemoral.`,
    })
  }

  return findings
}

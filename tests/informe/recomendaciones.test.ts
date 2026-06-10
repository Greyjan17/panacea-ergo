import { describe, expect, it } from 'vitest'
import { getRecomendaciones } from '@/lib/informe/recomendaciones'
import { calcReba, type REBAInput } from '@/lib/calc/reba'
import { calcMmc, type MMCInput } from '@/lib/calc/mmc'

const idealReba: REBAInput = {
  neck: 1, neckT: false, neckS: false,
  trunk: 1, trunkT: false, trunkS: false,
  legs: 1, load: 0, shock: false,
  ua: 1, shr: false, abd: false, sup: false,
  la: 1, wrist: 1, wristT: false,
  coup: 0, act: 0,
}

const idealMmc: MMCInput = {
  peso: 0,
  grupo: 'Varón adulto (18-45 años)',
  frec: 'frecuente',
  form: 'no',
  factores: [],
}

describe('getRecomendaciones — clínica dinámica', () => {
  it('postura ideal sin métodos peligrosos → fallback "Mantener condiciones"', () => {
    const r = getRecomendaciones({
      reba: { input: idealReba, result: calcReba(idealReba) },
      limAp: 25,
    })
    expect(r.ingenieria).toContain('Mantener condiciones actuales con monitoreo periódico.')
  })

  it('flexión severa de tronco recomienda plataforma elevada', () => {
    const input = { ...idealReba, trunk: 4 as const }
    const r = getRecomendaciones({
      reba: { input, result: calcReba(input) },
      limAp: 25,
    })
    expect(r.ingenieria.join(' ')).toMatch(/plataforma|mesa.*elevada/i)
    expect(r.vigilancia.join(' ')).toMatch(/Lasègue|Schober/i)
  })

  it('brazo elevado 45-90° recomienda evaluar Neer/Hawkins/Jobe', () => {
    const input = { ...idealReba, ua: 3 as const }
    const r = getRecomendaciones({
      reba: { input, result: calcReba(input) },
      limAp: 25,
    })
    expect(r.vigilancia.join(' ')).toMatch(/Neer|Hawkins|Jobe/i)
  })

  it('sin capacitación MMC añade recomendación administrativa específica', () => {
    const input = { ...idealMmc, peso: 30, form: 'no' as const }
    const r = getRecomendaciones({
      mmc: { input, result: calcMmc(input, 'masculino') },
      limAp: 25,
    })
    expect(r.administrativas.join(' ')).toMatch(/Capacitación inmediata en MMC/)
  })

  it('nivel alto añade pausas activas obligatorias cada hora', () => {
    const input = { ...idealReba, trunk: 4 as const, load: 2 as const, ua: 4 as const, neck: 2 as const }
    const r = getRecomendaciones({
      reba: { input, result: calcReba(input) },
      limAp: 25,
    })
    expect(r.administrativas.join(' ')).toMatch(/Pausas activas obligatorias de 5 minutos cada hora/)
  })

  it('siempre incluye Cuestionario Nórdico y plazo de re-evaluación', () => {
    const r = getRecomendaciones({
      reba: { input: idealReba, result: calcReba(idealReba) },
      limAp: 25,
    })
    expect(r.vigilancia.some(x => x.includes('Cuestionario Nórdico'))).toBe(true)
    expect(r.vigilancia.some(x => x.includes('Re-evaluación'))).toBe(true)
  })
})

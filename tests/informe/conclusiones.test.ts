import { describe, expect, it } from 'vitest'
import { getConclusiones } from '@/lib/informe/conclusiones'
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

describe('getConclusiones — narrativa clínica', () => {
  it('postura ideal con un solo método → riesgo bajo cierre', () => {
    const c = getConclusiones({
      reba: { input: idealReba, result: calcReba(idealReba) },
    })
    expect(c.at(-1)).toMatch(/Riesgo bajo|vigilancia/i)
  })

  it('REBA con flexión severa lista factores específicos', () => {
    const input = { ...idealReba, trunk: 4 as const, ua: 4 as const, coup: 3 as const }
    const c = getConclusiones({ reba: { input, result: calcReba(input) } })
    const rebaLine = c.find(x => x.startsWith('REBA'))
    expect(rebaLine).toMatch(/flexión tronco/i)
    expect(rebaLine).toMatch(/elevación brazo/i)
    expect(rebaLine).toMatch(/agarre deficiente/i)
  })

  it('TME probables se incluyen solo si nivel >= 2', () => {
    const inputBajo = { ...idealReba }
    const conBajo = getConclusiones({ reba: { input: inputBajo, result: calcReba(inputBajo) } })
    expect(conBajo.some(x => x.startsWith('TME probables'))).toBe(false)

    const inputAlto = { ...idealReba, trunk: 4 as const, load: 2 as const, ua: 4 as const }
    const conAlto = getConclusiones({
      reba: { input: inputAlto, result: calcReba(inputAlto) },
    })
    expect(conAlto.some(x => /TME probables.*lumbalgia/i.test(x))).toBe(true)
  })

  it('MMC con peso > 0 e INCUMPLE muestra ambos estándares', () => {
    const input: MMCInput = {
      peso: 30,
      grupo: 'Varón adulto (18-45 años)',
      frec: 'frecuente',
      form: 'no',
      factores: [],
    }
    const c = getConclusiones({ mmc: { input, result: calcMmc(input, 'masculino') } })
    const mmcLine = c.find(x => x.startsWith('MMC'))
    expect(mmcLine).toMatch(/RM375.*INCUMPLE/i)
    expect(mmcLine).toMatch(/ISO.*INCUMPLE/i)
  })

  it('cierre escalado por máximo nivel de los métodos', () => {
    const niv4 = { ...idealReba, trunk: 4 as const, load: 2 as const, ua: 4 as const, neck: 2 as const, legs: 3 as const, coup: 3 as const, act: 3 as const }
    const c = getConclusiones({ reba: { input: niv4, result: calcReba(niv4) } })
    expect(c.at(-1)).toMatch(/INMEDIATA/i)
  })
})

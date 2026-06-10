import { describe, expect, it } from 'vitest'
import { interpretAngles } from '@/lib/pose/interpret'
import type { PoseAngles } from '@/lib/pose/types'

const base: PoseAngles = {
  trunk: 0, neck: 0, ua: 0, uaL: 0, uaR: 0,
  la: 80, wrist: 0, knee: 175, kneeL: 175, kneeR: 175,
}

describe('interpretAngles — hallazgos clínicos', () => {
  it('postura ideal → 0 hallazgos', () => {
    expect(interpretAngles(base)).toHaveLength(0)
  })

  it('flexión severa de tronco menciona L4-L5', () => {
    const f = interpretAngles({ ...base, trunk: 70 })
    expect(f[0]?.seg).toBe('Tronco')
    expect(f[0]?.risk).toBe('alto')
    expect(f[0]?.desc).toContain('L4-L5')
  })

  it('brazo elevado >90° identifica manguito rotador', () => {
    const f = interpretAngles({ ...base, ua: 100 })
    const m = f.find(x => x.seg === 'Brazo sup.')
    expect(m?.risk).toBe('alto')
    expect(m?.desc).toMatch(/manguito rotador/i)
  })

  it('muñeca >15° identifica túnel carpiano', () => {
    const f = interpretAngles({ ...base, wrist: 20 })
    const m = f.find(x => x.seg === 'Muñeca')
    expect(m?.risk).toBe('medio')
    expect(m?.desc).toMatch(/túnel carpiano/i)
  })

  it('rodillas en cuclillas profundas identifica patelofemoral severo', () => {
    const f = interpretAngles({ ...base, knee: 100 })
    const m = f.find(x => x.seg === 'Rodillas')
    expect(m?.risk).toBe('alto')
    expect(m?.desc).toMatch(/patelofemoral/i)
  })

  it('flexión cervical 25° genera hallazgo medio', () => {
    const f = interpretAngles({ ...base, neck: 25 })
    const m = f.find(x => x.seg === 'Cuello')
    expect(m?.risk).toBe('medio')
  })

  it('todos los hallazgos críticos se reportan juntos', () => {
    const f = interpretAngles({
      ...base, trunk: 70, ua: 100, wrist: 20, knee: 100, neck: 25,
    })
    expect(f.length).toBeGreaterThanOrEqual(5)
    expect(f.filter(x => x.risk === 'alto').length).toBeGreaterThanOrEqual(3)
  })
})

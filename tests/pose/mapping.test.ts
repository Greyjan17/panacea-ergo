import { describe, expect, it } from 'vitest'
import { mapAnglesToREBA, mapAnglesToRULA } from '@/lib/pose/mapping'
import type { PoseAngles } from '@/lib/pose/types'

const base: PoseAngles = {
  trunk: 0, neck: 0, ua: 0, uaL: 0, uaR: 0,
  la: 80, wrist: 0, knee: 175, kneeL: 175, kneeR: 175,
}

describe('mapAnglesToREBA — rangos publicados', () => {
  it('postura ideal → todos los niveles en 1', () => {
    const r = mapAnglesToREBA(base)
    expect(r.trunk).toBe(1)
    expect(r.neck).toBe(1)
    expect(r.ua).toBe(1)
    expect(r.la).toBe(1)
    expect(r.wrist).toBe(1)
    expect(r.legs).toBe(1)
  })

  it('tronco 30° → nivel 3 (20-60°)', () => {
    expect(mapAnglesToREBA({ ...base, trunk: 30 }).trunk).toBe(3)
  })

  it('tronco 70° → nivel 4 (>60°)', () => {
    expect(mapAnglesToREBA({ ...base, trunk: 70 }).trunk).toBe(4)
  })

  it('brazo a 100° → nivel 4 (>90°)', () => {
    expect(mapAnglesToREBA({ ...base, ua: 100 }).ua).toBe(4)
  })

  it('rodillas en 100° (mucha flexión) → nivel 4', () => {
    expect(mapAnglesToREBA({ ...base, knee: 100 }).legs).toBe(4)
  })
})

describe('mapAnglesToRULA — escala más fina en muñeca y cuello', () => {
  it('cuello 15° → nivel 2 (RULA), pero 1 en REBA', () => {
    expect(mapAnglesToRULA({ ...base, neck: 15 }).neck).toBe(2)
    expect(mapAnglesToREBA({ ...base, neck: 15 }).neck).toBe(1)
  })

  it('muñeca 10° → nivel 2 (RULA), 1 en REBA', () => {
    expect(mapAnglesToRULA({ ...base, wrist: 10 }).wrist).toBe(2)
    expect(mapAnglesToREBA({ ...base, wrist: 10 }).wrist).toBe(1)
  })

  it('muñeca 25° → nivel 3 (RULA)', () => {
    expect(mapAnglesToRULA({ ...base, wrist: 25 }).wrist).toBe(3)
  })
})

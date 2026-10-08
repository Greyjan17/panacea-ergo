import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mem = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
})

const { expiringLocalStorage, DRAFT_TTL_MS } = await import('@/store/useEvaluacion')

describe('borrador local con caducidad', () => {
  beforeEach(() => { mem.clear(); vi.useFakeTimers() })
  afterEach(() => vi.useRealTimers())

  it('devuelve el borrador dentro del plazo', () => {
    expiringLocalStorage.setItem('k', '{"a":1}')
    vi.advanceTimersByTime(DRAFT_TTL_MS - 1000)
    expect(expiringLocalStorage.getItem('k')).toBe('{"a":1}')
  })

  it('descarta y borra el borrador vencido', () => {
    expiringLocalStorage.setItem('k', '{"a":1}')
    vi.advanceTimersByTime(DRAFT_TTL_MS + 1000)
    expect(expiringLocalStorage.getItem('k')).toBeNull()
    expect(mem.has('k')).toBe(false)
  })

  it('acepta borradores en el formato anterior (sin fecha)', () => {
    mem.set('k', '{"state":{},"version":1}')
    expect(expiringLocalStorage.getItem('k')).toBe('{"state":{},"version":1}')
  })
})

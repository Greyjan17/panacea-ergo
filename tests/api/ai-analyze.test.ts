import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const parse = vi.fn()
vi.mock('@anthropic-ai/sdk', async importOriginal => {
  const real = await importOriginal<typeof import('@anthropic-ai/sdk')>()
  class Fake { beta = { messages: { parse } } }
  Object.assign(Fake, real.default)
  return { default: Fake }
})

const { default: handler } = await import('../../api/ai/analyze')

function call(body: unknown, auth = 'Bearer secreto') {
  const out: { status?: number; json?: Record<string, unknown> } = {}
  const res = {
    status(s: number) { out.status = s; return this },
    json(j: Record<string, unknown>) { out.json = j; return this },
  } as unknown as VercelResponse
  const req = { method: 'POST', headers: { authorization: auth }, query: {}, body } as unknown as VercelRequest
  return handler(req, res).then(() => out)
}

const foto = { label: 'Lateral', mediaType: 'image/jpeg', data: 'AAAA' }

describe('/api/ai/analyze', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_KEY', 'secreto')
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test')
    parse.mockReset()
  })
  afterEach(() => vi.unstubAllEnvs())

  it('rechaza sin clave de acceso', async () => {
    expect((await call({ method: 'REBA', photos: [foto] }, 'Bearer otra')).status).toBe(401)
  })

  it('503 si falta ANTHROPIC_API_KEY', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    expect((await call({ method: 'REBA', photos: [foto] })).status).toBe(503)
  })

  it('400 con método no soportado o sin fotos', async () => {
    expect((await call({ method: 'MMC', photos: [foto] })).status).toBe(400)
    expect((await call({ method: 'REBA', photos: [] })).status).toBe(400)
  })

  it('devuelve la propuesta sin los campos no determinables (null)', async () => {
    parse.mockResolvedValue({
      stop_reason: 'end_turn',
      parsed_output: {
        values: { back: 2, arms: null, legs: 4 },
        hallazgos: 'Espalda flexionada.',
        confianza: 'media',
      },
    })
    const r = await call({ method: 'OWAS', photos: [foto] })
    expect(r.status).toBe(200)
    expect(r.json).toEqual({ values: { back: 2, legs: 4 }, hallazgos: 'Espalda flexionada.', confidence: 0.6 })
    const args = parse.mock.calls[0]![0]
    expect(args.model).toBe('claude-opus-5-5')
    expect(args.messages[0].content.some((b: { type: string }) => b.type === 'image')).toBe(true)
  })

  it('422 si la IA declina', async () => {
    parse.mockResolvedValue({ stop_reason: 'refusal', parsed_output: null })
    expect((await call({ method: 'REBA', photos: [foto] })).status).toBe(422)
  })
})

describe('filtrarValores', () => {
  it('descarta valores fuera de rango y tipos incorrectos', async () => {
    const { filtrarValores } = await import('../../api/ai/analyze')
    expect(filtrarValores('REBA', { trunk: 5, neck: 2, trunkT: true, legs: null, ua: 2.5, wristT: 'si' }))
      .toEqual({ neck: 2, trunkT: true })
  })
})

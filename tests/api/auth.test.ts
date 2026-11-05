import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHash } from 'node:crypto'

// Base de datos simulada: responde según el texto de la consulta.
const db = vi.hoisted(() => ({
  fallos: 0,
  usuarios: [] as Array<{ id: string; nombre: string; rol: string; key_hash: string; activo: boolean }>,
  accesos: [] as unknown[],
}))

vi.mock('../../api/_lib/db', () => ({
  hasDb: () => true,
  sql: () => (strings: TemplateStringsArray, ...vals: unknown[]) => {
    const q = strings.join('?')
    if (q.includes('count(*)')) return Promise.resolve([{ n: db.fallos }])
    if (q.includes('FROM usuarios')) {
      return Promise.resolve(db.usuarios.filter(u => u.key_hash === vals[0] && u.activo))
    }
    if (q.includes('INSERT INTO intentos_fallidos')) { db.fallos++; return Promise.resolve([]) }
    if (q.includes('INSERT INTO accesos')) { db.accesos.push(vals); return Promise.resolve([]) }
    return Promise.resolve([])
  },
}))
vi.mock('../../api/_lib/schema', () => ({ ensureSchema: () => Promise.resolve() }))

const { requireUser, audit } = await import('../../api/_lib/auth')

const sha = (s: string) => createHash('sha256').update(s).digest('hex')

function run(key: string, admin = false) {
  const out: { status?: number } = {}
  const res = {
    status(s: number) { out.status = s; return this },
    json() { return this },
  } as unknown as VercelResponse
  const req = { headers: { authorization: `Bearer ${key}`, 'x-forwarded-for': '1.2.3.4' } } as unknown as VercelRequest
  return requireUser(req, res, { admin }).then(user => ({ user, status: out.status }))
}

describe('requireUser — claves personales, bloqueo y roles', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_KEY', 'clave-admin')
    db.fallos = 0
    db.accesos = []
    db.usuarios = [
      { id: 'u1', nombre: 'Evaluadora Uno', rol: 'evaluador', key_hash: sha('clave-eva'), activo: true },
      { id: 'u2', nombre: 'Ex evaluador', rol: 'evaluador', key_hash: sha('clave-baja'), activo: false },
    ]
  })
  afterEach(() => vi.unstubAllEnvs())

  it('ADMIN_KEY entra como administrador', async () => {
    const r = await run('clave-admin', true)
    expect(r.user).toMatchObject({ rol: 'admin', nombre: 'Administrador' })
  })

  it('clave personal activa entra con su nombre', async () => {
    expect((await run('clave-eva')).user).toMatchObject({ id: 'u1', nombre: 'Evaluadora Uno' })
  })

  it('clave personal sin rol admin no accede a rutas de administrador (403)', async () => {
    const r = await run('clave-eva', true)
    expect(r.user).toBeNull()
    expect(r.status).toBe(403)
  })

  it('clave desactivada es rechazada y cuenta como intento fallido', async () => {
    const r = await run('clave-baja')
    expect(r.status).toBe(401)
    expect(db.fallos).toBe(1)
  })

  it('tras 10 intentos fallidos se bloquea la IP aunque la clave sea correcta (429)', async () => {
    db.fallos = 10
    const r = await run('clave-admin')
    expect(r.status).toBe(429)
    expect(r.user).toBeNull()
  })

  it('audit registra quién hizo qué', async () => {
    const req = { headers: { 'x-forwarded-for': '1.2.3.4' } } as unknown as VercelRequest
    await audit(req, { id: 'u1', nombre: 'Evaluadora Uno', rol: 'evaluador' }, 'ver', 'e1')
    expect(db.accesos).toHaveLength(1)
    expect(db.accesos[0]).toEqual(['u1', 'Evaluadora Uno', 'ver', 'e1', null, '1.2.3.4'])
  })
})

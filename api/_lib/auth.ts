// Autenticación por clave personal (header Authorization: Bearer).
// - ADMIN_KEY (variable de entorno) = administrador.
// - Cada evaluador tiene su propia clave (tabla usuarios, solo se guarda su hash SHA-256)
//   y se puede desactivar sin afectar a los demás.
// - Límite: 10 intentos fallidos por IP cada 15 minutos.
// - Cada acceso a datos queda registrado en la tabla accesos (Ley 29733).
// No se acepta la clave por query string: quedaría en logs, historial y Referer.

import { createHash, timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hasDb, sql } from './db.js'
import { ensureSchema } from './schema.js'

export interface Usuario {
  id: string | null
  nombre: string
  rol: 'admin' | 'evaluador'
}

const digest = (s: string) => createHash('sha256').update(s).digest()
export const hashKey = (s: string): string => digest(s).toString('hex')

const MAX_FALLOS = 10

export function clientIp(req: VercelRequest): string {
  const xf = req.headers['x-forwarded-for']
  const v = Array.isArray(xf) ? xf[0] : xf
  return (v?.split(',')[0] ?? '').trim() || 'desconocida'
}

export async function requireUser(
  req: VercelRequest,
  res: VercelResponse,
  opts: { admin?: boolean } = {},
): Promise<Usuario | null> {
  const expected = process.env.ADMIN_KEY
  if (!expected) {
    console.error('ADMIN_KEY no configurada en el servidor')
    res.status(500).json({ error: 'Servidor no configurado' })
    return null
  }
  const auth = req.headers.authorization ?? ''
  const provided = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : ''
  const ip = clientIp(req)
  const db = hasDb()

  try {
    if (db) {
      await ensureSchema()
      const rows = (await sql()`
        SELECT count(*)::int AS n FROM intentos_fallidos
        WHERE ip = ${ip} AND ts > now() - interval '15 minutes'
      `) as Array<{ n: number }>
      if ((rows[0]?.n ?? 0) >= MAX_FALLOS) {
        res.status(429).json({ error: 'Demasiados intentos fallidos. Espere 15 minutos.' })
        return null
      }
    }

    let user: Usuario | null = null
    // Comparación en tiempo constante sobre hashes de igual longitud.
    if (provided && timingSafeEqual(digest(provided), digest(expected))) {
      user = { id: null, nombre: 'Administrador', rol: 'admin' }
    } else if (provided && db) {
      const rows = (await sql()`
        SELECT id, nombre, rol FROM usuarios WHERE key_hash = ${hashKey(provided)} AND activo LIMIT 1
      `) as Usuario[]
      user = rows[0] ?? null
    }

    if (!user) {
      if (db) {
        await sql()`INSERT INTO intentos_fallidos (ip) VALUES (${ip})`
        await sql()`DELETE FROM intentos_fallidos WHERE ts < now() - interval '1 day'`
      }
      res.status(401).json({ error: 'No autorizado' })
      return null
    }
    if (opts.admin && user.rol !== 'admin') {
      res.status(403).json({ error: 'Requiere una clave de administrador' })
      return null
    }
    return user
  } catch (err) {
    console.error('auth', err)
    res.status(500).json({ error: 'Error de autenticación' })
    return null
  }
}

/** Registra un acceso a datos. Nunca interrumpe la petición si falla. */
export async function audit(
  req: VercelRequest,
  user: Usuario,
  accion: string,
  evaluacionId: string | null = null,
  detalle: string | null = null,
): Promise<void> {
  if (!hasDb()) return
  try {
    await sql()`
      INSERT INTO accesos (usuario_id, usuario_nombre, accion, evaluacion_id, detalle, ip)
      VALUES (${user.id}, ${user.nombre}, ${accion}, ${evaluacionId}, ${detalle}, ${clientIp(req)})
    `
  } catch (err) {
    console.error('audit', err)
  }
}

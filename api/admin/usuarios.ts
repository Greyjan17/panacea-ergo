// GET   /api/admin/usuarios → lista de claves personales (sin las claves).
// POST  /api/admin/usuarios → crea un usuario y devuelve su clave UNA sola vez.
// PATCH /api/admin/usuarios → activa o desactiva un usuario ({ id, activo }).
// Solo administrador.

import { randomBytes } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { audit, hashKey, requireUser } from '../_lib/auth.js'
import { sql } from '../_lib/db.js'

const PostSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  rol: z.enum(['admin', 'evaluador']).default('evaluador'),
})

const PatchSchema = z.object({
  id: z.string().uuid(),
  activo: z.boolean(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res, { admin: true })
  if (!user) return

  try {
    if (req.method === 'GET') {
      const rows = await sql()`
        SELECT id, creado_en, nombre, rol, activo FROM usuarios ORDER BY activo DESC, creado_en DESC
      `
      res.status(200).json({ usuarios: rows })
      return
    }

    if (req.method === 'POST') {
      const parsed = PostSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'Datos inválidos' })
        return
      }
      const clave = randomBytes(24).toString('base64url')
      const rows = await sql()`
        INSERT INTO usuarios (nombre, rol, key_hash)
        VALUES (${parsed.data.nombre}, ${parsed.data.rol}, ${hashKey(clave)})
        RETURNING id, creado_en, nombre, rol, activo
      `
      await audit(req, user, 'usuario_crear', null, `${parsed.data.nombre} (${parsed.data.rol})`)
      res.status(201).json({ usuario: rows[0], clave })
      return
    }

    if (req.method === 'PATCH') {
      const parsed = PatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'Datos inválidos' })
        return
      }
      const rows = (await sql()`
        UPDATE usuarios SET activo = ${parsed.data.activo} WHERE id = ${parsed.data.id}::uuid RETURNING nombre
      `) as Array<{ nombre: string }>
      if (rows.length === 0) {
        res.status(404).json({ error: 'Usuario no encontrado' })
        return
      }
      await audit(req, user, parsed.data.activo ? 'usuario_activar' : 'usuario_desactivar', null, rows[0]!.nombre)
      res.status(200).json({ ok: true })
      return
    }

    res.status(405).json({ error: 'Método no permitido' })
  } catch (err) {
    console.error('/api/admin/usuarios', err)
    res.status(500).json({ error: 'Error en la gestión de usuarios' })
  }
}

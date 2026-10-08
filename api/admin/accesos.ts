// GET /api/admin/accesos → últimos accesos registrados (quién, qué, cuándo, desde qué IP).
// Solo administrador.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUser } from '../_lib/auth.js'
import { sql } from '../_lib/db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await requireUser(req, res, { admin: true }))) return
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido' })
    return
  }
  try {
    const rows = await sql()`
      SELECT ts, usuario_nombre, accion, evaluacion_id, detalle, ip
      FROM accesos ORDER BY ts DESC LIMIT 300
    `
    res.status(200).json({ accesos: rows })
  } catch (err) {
    console.error('/api/admin/accesos', err)
    res.status(500).json({ error: 'Error al leer el registro de accesos' })
  }
}

// GET /api/evaluaciones/:id → recupera una evaluación con su payload completo.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_lib/auth'
import { sql } from '../_lib/db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req, res)) return

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido' })
    return
  }

  const id = typeof req.query.id === 'string' ? req.query.id : null
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    res.status(400).json({ error: 'ID inválido' })
    return
  }

  try {
    const rows = await sql()`
      SELECT id, creado_en, empresa, trabajador, dni, puesto, evaluador,
             fecha_evaluacion, metodos, level_max, score_reba, payload
      FROM evaluaciones
      WHERE id = ${id}::uuid
      LIMIT 1
    `
    if (rows.length === 0) {
      res.status(404).json({ error: 'Evaluación no encontrada' })
      return
    }
    res.status(200).json({ evaluacion: rows[0] })
  } catch (err) {
    console.error('GET /api/evaluaciones/:id', err)
    res.status(500).json({ error: 'Error al recuperar la evaluación' })
  }
}

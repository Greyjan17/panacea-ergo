// GET   /api/evaluaciones/:id → recupera una evaluación con su payload completo.
// PATCH /api/evaluaciones/:id → actualiza resultados tras un recálculo (level_max, score_reba, payload).

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { requireAdmin } from '../_lib/auth.js'
import { sql } from '../_lib/db.js'

const PatchSchema = z.object({
  level_max: z.number().int().min(0).max(4),
  score_reba: z.number().int().min(0).max(15).nullable(),
  // Un recálculo debe conservar el historial de resultados anteriores.
  payload: z.record(z.unknown()).refine(p => Array.isArray(p.recalculos) && p.recalculos.length > 0),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req, res)) return

  if (req.method !== 'GET' && req.method !== 'PATCH') {
    res.status(405).json({ error: 'Método no permitido' })
    return
  }

  const id = typeof req.query.id === 'string' ? req.query.id : null
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    res.status(400).json({ error: 'ID inválido' })
    return
  }

  if (req.method === 'PATCH') {
    const parsed = PatchSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos' })
      return
    }
    const e = parsed.data
    try {
      const rows = await sql()`
        UPDATE evaluaciones
        SET level_max = ${e.level_max}, score_reba = ${e.score_reba},
            payload = ${JSON.stringify(e.payload)}::jsonb
        WHERE id = ${id}::uuid
        RETURNING id
      `
      if (rows.length === 0) {
        res.status(404).json({ error: 'Evaluación no encontrada' })
        return
      }
      res.status(200).json({ ok: true })
    } catch (err) {
      console.error('PATCH /api/evaluaciones/:id', err)
      res.status(500).json({ error: 'Error al actualizar la evaluación' })
    }
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

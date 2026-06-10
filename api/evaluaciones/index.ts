// POST /api/evaluaciones      → crea nueva evaluación
// GET  /api/evaluaciones?q=…  → lista paginada (busca empresa/trabajador/puesto)

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { requireAdmin } from '../_lib/auth.js'
import { sql } from '../_lib/db.js'

const PostSchema = z.object({
  empresa: z.string().min(1).max(200),
  trabajador: z.string().max(200).optional().default(''),
  dni: z.string().max(20).optional().default(''),
  puesto: z.string().max(200).optional().default(''),
  evaluador: z.string().min(1).max(200),
  fecha_evaluacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  metodos: z.array(z.string()).default([]),
  level_max: z.number().int().min(0).max(4).default(0),
  score_reba: z.number().int().min(0).max(15).nullable().optional(),
  payload: z.record(z.unknown()),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req, res)) return

  if (req.method === 'POST') {
    const parsed = PostSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues })
      return
    }
    const e = parsed.data
    try {
      const rows = await sql()`
        INSERT INTO evaluaciones (
          empresa, trabajador, dni, puesto, evaluador,
          fecha_evaluacion, metodos, level_max, score_reba, payload
        ) VALUES (
          ${e.empresa}, ${e.trabajador}, ${e.dni}, ${e.puesto}, ${e.evaluador},
          ${e.fecha_evaluacion}, ${e.metodos}, ${e.level_max},
          ${e.score_reba ?? null}, ${JSON.stringify(e.payload)}::jsonb
        )
        RETURNING id, creado_en
      `
      res.status(201).json({ ok: true, evaluacion: rows[0] })
    } catch (err) {
      console.error('POST /api/evaluaciones', err)
      res.status(500).json({ error: 'Error al guardar la evaluación' })
    }
    return
  }

  if (req.method === 'GET') {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    try {
      const rows = q
        ? await sql()`
            SELECT id, creado_en, empresa, trabajador, dni, puesto, evaluador,
                   fecha_evaluacion, metodos, level_max, score_reba
            FROM evaluaciones
            WHERE to_tsvector('spanish', coalesce(empresa,'') || ' ' || coalesce(trabajador,'') || ' ' || coalesce(puesto,''))
                  @@ plainto_tsquery('spanish', ${q})
               OR dni ILIKE ${'%' + q + '%'}
            ORDER BY fecha_evaluacion DESC, creado_en DESC
            LIMIT ${limit}
          `
        : await sql()`
            SELECT id, creado_en, empresa, trabajador, dni, puesto, evaluador,
                   fecha_evaluacion, metodos, level_max, score_reba
            FROM evaluaciones
            ORDER BY fecha_evaluacion DESC, creado_en DESC
            LIMIT ${limit}
          `
      res.status(200).json({ evaluaciones: rows, total: rows.length })
    } catch (err) {
      console.error('GET /api/evaluaciones', err)
      res.status(500).json({ error: 'Error al listar evaluaciones' })
    }
    return
  }

  res.status(405).json({ error: 'Método no permitido' })
}

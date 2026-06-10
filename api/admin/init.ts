// POST /api/admin/init — aplica la migración 001_init.sql.
// Idempotente: usa CREATE TABLE IF NOT EXISTS. Requiere ADMIN_KEY.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_lib/auth.js'
import { sql } from '../_lib/db.js'

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS evaluaciones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  empresa         TEXT NOT NULL,
  trabajador      TEXT,
  dni             TEXT,
  puesto          TEXT,
  evaluador       TEXT NOT NULL,
  fecha_evaluacion DATE NOT NULL,
  metodos         TEXT[] NOT NULL DEFAULT '{}',
  level_max       SMALLINT NOT NULL DEFAULT 0,
  score_reba      SMALLINT,
  payload         JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS evaluaciones_empresa_idx       ON evaluaciones (empresa);
CREATE INDEX IF NOT EXISTS evaluaciones_evaluador_idx     ON evaluaciones (evaluador);
CREATE INDEX IF NOT EXISTS evaluaciones_fecha_idx         ON evaluaciones (fecha_evaluacion DESC);
CREATE INDEX IF NOT EXISTS evaluaciones_dni_idx           ON evaluaciones (dni);
CREATE INDEX IF NOT EXISTS evaluaciones_search_idx
  ON evaluaciones
  USING GIN (to_tsvector('spanish', coalesce(empresa,'') || ' ' || coalesce(trabajador,'') || ' ' || coalesce(puesto,'')));
`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req, res)) return
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST únicamente' })
    return
  }
  try {
    // Ejecutamos cada statement por separado (sql tag no soporta múltiples en uno).
    const statements = SCHEMA_SQL.split(/;\s*\n/).map(s => s.trim()).filter(Boolean)
    for (const stmt of statements) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sql() as any)(stmt)
    }
    // Comprobar resultado
    const rows = (await (sql() as unknown as (q: string) => Promise<Record<string, unknown>[]>)(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
    )) as Array<{ table_name: string }>
    res.status(200).json({
      ok: true,
      applied: statements.length,
      tables: rows.map(r => r.table_name),
    })
  } catch (err) {
    console.error('/api/admin/init', err)
    res.status(500).json({ error: (err as Error).message })
  }
}

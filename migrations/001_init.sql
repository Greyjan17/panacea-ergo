-- PANACEA ERGO — Esquema mínimo para historial de evaluaciones ergonómicas.
-- Una sola tabla, sin foreign keys, JSONB para los slices del store.
--
-- Aplicar:  psql $DATABASE_URL -f migrations/001_init.sql

CREATE TABLE IF NOT EXISTS evaluaciones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Identificación rápida (para listas y búsqueda)
  empresa         TEXT NOT NULL,
  trabajador      TEXT,
  dni             TEXT,
  puesto          TEXT,
  evaluador       TEXT NOT NULL,
  fecha_evaluacion DATE NOT NULL,
  metodos         TEXT[] NOT NULL DEFAULT '{}',
  -- Niveles de riesgo (0..4) para filtros y orden
  level_max       SMALLINT NOT NULL DEFAULT 0,
  score_reba      SMALLINT,
  -- Cuerpo completo: estado del store al momento de guardar.
  -- Contiene info, reba/rula/owas/niosh/mmc inputs y resultados precomputados.
  payload         JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS evaluaciones_empresa_idx       ON evaluaciones (empresa);
CREATE INDEX IF NOT EXISTS evaluaciones_evaluador_idx     ON evaluaciones (evaluador);
CREATE INDEX IF NOT EXISTS evaluaciones_fecha_idx         ON evaluaciones (fecha_evaluacion DESC);
CREATE INDEX IF NOT EXISTS evaluaciones_dni_idx           ON evaluaciones (dni);

-- Habilitar búsqueda full-text sobre empresa+trabajador+puesto (en español)
CREATE INDEX IF NOT EXISTS evaluaciones_search_idx
  ON evaluaciones
  USING GIN (to_tsvector('spanish', coalesce(empresa,'') || ' ' || coalesce(trabajador,'') || ' ' || coalesce(puesto,'')));

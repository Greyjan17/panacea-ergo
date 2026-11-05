-- PANACEA ERGO — tablas de seguridad (las crea api/_lib/schema.ts automáticamente).
CREATE TABLE IF NOT EXISTS usuarios (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
  nombre     TEXT NOT NULL,
  rol        TEXT NOT NULL DEFAULT 'evaluador' CHECK (rol IN ('admin', 'evaluador')),
  key_hash   TEXT NOT NULL UNIQUE,
  activo     BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS accesos (
  id              BIGSERIAL PRIMARY KEY,
  ts              TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario_id      UUID,
  usuario_nombre  TEXT NOT NULL,
  accion          TEXT NOT NULL,
  evaluacion_id   UUID,
  detalle         TEXT,
  ip              TEXT
);

CREATE INDEX IF NOT EXISTS accesos_ts_idx ON accesos (ts DESC);

CREATE TABLE IF NOT EXISTS intentos_fallidos (
  ip  TEXT NOT NULL,
  ts  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS intentos_ip_ts_idx ON intentos_fallidos (ip, ts DESC);

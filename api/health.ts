// Healthcheck: sin imports externos, solo verifica que las functions corren.

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  // Diagnóstico: listar TODAS las claves que parezcan env vars de la app
  const keys = Object.keys(process.env)
    .filter(k => /ADMIN|KEY|DATABASE|POSTGRES|NEON/i.test(k))
    .sort()
    .map(k => ({ name: k, len: (process.env[k] ?? '').length }))
  res.status(200).json({
    ok: true,
    hasDatabaseUrl: typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.length > 0,
    hasAdminKey: typeof process.env.ADMIN_KEY === 'string' && process.env.ADMIN_KEY.length > 0,
    nodeVersion: process.version,
    ts: new Date().toISOString(),
    envKeys: keys,
  })
}

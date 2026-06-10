// Healthcheck: sin imports externos, solo verifica que las functions corren.

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    hasDatabaseUrl: typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.length > 0,
    hasAdminKey: typeof process.env.ADMIN_KEY === 'string' && process.env.ADMIN_KEY.length > 0,
    nodeVersion: process.version,
    ts: new Date().toISOString(),
  })
}

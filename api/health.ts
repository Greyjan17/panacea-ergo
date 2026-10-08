// Healthcheck: sin imports externos, solo verifica que las functions corren.

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    ts: new Date().toISOString(),
  })
}

// Autenticación simple por admin key (header o query param).
// Pensada para uso individual del médico evaluador.

import type { VercelRequest, VercelResponse } from '@vercel/node'

export function requireAdmin(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.ADMIN_KEY
  if (!expected) {
    res.status(500).json({ error: 'ADMIN_KEY no configurada en el servidor' })
    return false
  }
  const auth = req.headers.authorization ?? ''
  const provided =
    auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) :
    typeof req.query.k === 'string' ? req.query.k :
    null
  if (provided !== expected) {
    res.status(401).json({ error: 'No autorizado' })
    return false
  }
  return true
}

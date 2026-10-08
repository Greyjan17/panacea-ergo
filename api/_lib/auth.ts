// Autenticación simple por admin key (solo header Authorization: Bearer).
// Pensada para uso individual del médico evaluador.
// No se acepta la clave por query string: quedaría en logs, historial y Referer.

import { createHash, timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const digest = (s: string) => createHash('sha256').update(s).digest()

export function requireAdmin(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.ADMIN_KEY
  if (!expected) {
    console.error('ADMIN_KEY no configurada en el servidor')
    res.status(500).json({ error: 'Servidor no configurado' })
    return false
  }
  const auth = req.headers.authorization ?? ''
  const provided = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : ''
  // Comparación en tiempo constante sobre hashes de igual longitud.
  if (!provided || !timingSafeEqual(digest(provided), digest(expected))) {
    res.status(401).json({ error: 'No autorizado' })
    return false
  }
  return true
}

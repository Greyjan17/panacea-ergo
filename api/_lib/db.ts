// Cliente Neon serverless — usa la connection string de Vercel Marketplace.
// Se inicializa una sola vez por instancia y se reutiliza entre invocaciones.

import { neon } from '@neondatabase/serverless'

let _sql: ReturnType<typeof neon> | null = null

export function sql(): ReturnType<typeof neon> {
  if (_sql) return _sql
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL no configurada. Conecta Neon en Vercel Marketplace.')
  }
  _sql = neon(url)
  return _sql
}

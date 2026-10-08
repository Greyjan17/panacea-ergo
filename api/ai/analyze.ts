// POST /api/ai/analyze — proxy autenticado hacia el Worker de IA (Cloudflare).
// El navegador nunca ve la URL ni el secreto del Worker: solo esta función,
// protegida con ADMIN_KEY, puede invocarlo enviando el header X-Panacea-Secret.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { requireAdmin } from '../_lib/auth.js'

const BodySchema = z.object({
  // ~4 MB de base64 (límite de cuerpo de Vercel: 4.5 MB)
  imageBase64: z.string().min(1).max(4_000_000),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  method: z.enum(['REBA', 'RULA', 'OWAS', 'NIOSH', 'MMC']),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req, res)) return
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST únicamente' })
    return
  }

  const workerUrl = process.env.AI_WORKER_URL
  const workerSecret = process.env.AI_WORKER_SECRET
  if (!workerUrl || !workerSecret) {
    console.error('/api/ai/analyze: AI_WORKER_URL o AI_WORKER_SECRET no configurados')
    res.status(503).json({ error: 'Análisis IA no disponible' })
    return
  }

  const parsed = BodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' })
    return
  }

  try {
    const upstream = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Panacea-Secret': workerSecret },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(55_000),
    })
    const data = await upstream.json().catch(() => ({}))
    if (!upstream.ok) {
      console.error('/api/ai/analyze: Worker respondió', upstream.status, data)
      res.status(502).json({ error: 'El servicio de IA no respondió correctamente' })
      return
    }
    res.status(200).json(data)
  } catch (err) {
    console.error('/api/ai/analyze', err)
    res.status(502).json({ error: 'El servicio de IA no respondió' })
  }
}

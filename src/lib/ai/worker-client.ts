// Cliente HTTP del análisis de imágenes ergonómicas con IA.
// Llama al proxy autenticado /api/ai/analyze, que reenvía al Worker de Cloudflare
// ({ imageBase64, mediaType, method } → texto). El navegador nunca contacta al
// Worker directamente. Esta capa devuelve una estructura tipada lista para el parser.

import type { Method } from '@/types/ergo'
import type { AIRawResponse } from './parser'

const DEFAULT_ENDPOINT = '/api/ai/analyze'

export interface AnalyzeArgs {
  /** dataURL base64 (con o sin prefijo `data:image/...;base64,`). */
  imageDataUrl: string
  method: Method
  /** Admin key del backend (Authorization: Bearer). */
  adminKey: string
  /** Override del endpoint (tests). */
  endpoint?: string
  /** AbortController para cancelar peticiones en curso. */
  signal?: AbortSignal
}

export class WorkerError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'WorkerError'
  }
}

export async function analyzeImage({
  imageDataUrl,
  method,
  adminKey,
  endpoint = DEFAULT_ENDPOINT,
  signal,
}: AnalyzeArgs): Promise<AIRawResponse> {
  const base64 = imageDataUrl.includes(',') ? imageDataUrl.split(',')[1]! : imageDataUrl
  const mediaType =
    imageDataUrl.startsWith('data:') ? imageDataUrl.split(';')[0]!.slice(5) : 'image/jpeg'

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminKey}` },
    body: JSON.stringify({ imageBase64: base64, mediaType, method }),
    signal,
  })

  if (!res.ok) {
    throw new WorkerError(res.status, `Worker respondió ${res.status}`)
  }

  // El Worker puede devolver JSON estructurado o `{ result: "texto" }` legacy.
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>

  if (typeof data.values === 'object' && data.values !== null) {
    return data as AIRawResponse
  }
  // Legacy: el Worker actual devuelve { result: "texto" }.
  if (typeof data.result === 'string') {
    return { raw: data.result }
  }
  if (typeof data.error === 'string') {
    throw new WorkerError(res.status, data.error)
  }
  throw new WorkerError(res.status, 'Respuesta del Worker no reconocida')
}

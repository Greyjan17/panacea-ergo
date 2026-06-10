// Cliente HTTP del Worker de Cloudflare que analiza imágenes ergonómicas con IA.
// El Worker existente (v2.1) acepta { imageBase64, mediaType, method } y devuelve texto.
// Esta capa lo invoca y devuelve una estructura tipada lista para el parser.

import type { Method } from '@/types/ergo'
import type { AIRawResponse } from './parser'

const DEFAULT_WORKER_URL = 'https://panacea-ergo-ai.wences18.workers.dev'

export interface AnalyzeArgs {
  /** dataURL base64 (con o sin prefijo `data:image/...;base64,`). */
  imageDataUrl: string
  method: Method
  /** Override por entorno o sesión. */
  workerUrl?: string
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
  workerUrl = DEFAULT_WORKER_URL,
  signal,
}: AnalyzeArgs): Promise<AIRawResponse> {
  const base64 = imageDataUrl.includes(',') ? imageDataUrl.split(',')[1]! : imageDataUrl
  const mediaType =
    imageDataUrl.startsWith('data:') ? imageDataUrl.split(';')[0]!.slice(5) : 'image/jpeg'

  const res = await fetch(workerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

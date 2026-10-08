// Cliente del análisis postural con IA (/api/ai/analyze, protegido con la admin key).
// Devuelve una propuesta que el parser valida antes de mostrarla al médico.

import type { AIRawResponse } from './parser'

export type MetodoIA = 'REBA' | 'RULA' | 'OWAS'

export interface FotoIA {
  /** dataURL (`data:image/jpeg;base64,...`). */
  url: string
  label: string
}

export class AIRequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'AIRequestError'
  }
}

export async function analizarFotos(
  method: MetodoIA,
  fotos: FotoIA[],
  adminKey: string,
  signal?: AbortSignal,
): Promise<AIRawResponse> {
  const photos = fotos.slice(0, 3).map(f => ({
    label: f.label,
    mediaType: f.url.startsWith('data:') ? f.url.slice(5, f.url.indexOf(';')) : 'image/jpeg',
    data: f.url.includes(',') ? f.url.slice(f.url.indexOf(',') + 1) : f.url,
  }))
  const res = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminKey}` },
    body: JSON.stringify({ method, photos }),
    signal,
  })
  const data = (await res.json().catch(() => ({}))) as AIRawResponse & { error?: string }
  if (!res.ok) throw new AIRequestError(res.status, data.error ?? `Error ${res.status}`)
  return data
}

// Cliente HTTP del backend de historial.
// El admin key se persiste en localStorage tras el primer ingreso vía ?k=.

const KEY_STORAGE = 'panacea-ergo-admin-key'

export function readAdminKey(): string {
  // 1) localStorage si ya fue establecido antes
  // 2) URL search ?k= (en cuyo caso lo persiste)
  if (typeof window === 'undefined') return ''
  const fromUrl = new URLSearchParams(window.location.search).get('k')
  if (fromUrl) {
    try { localStorage.setItem(KEY_STORAGE, fromUrl) } catch {}
    return fromUrl
  }
  try {
    return localStorage.getItem(KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

export function clearAdminKey() {
  try { localStorage.removeItem(KEY_STORAGE) } catch {}
}

export interface EvaluacionResumen {
  id: string
  creado_en: string
  empresa: string
  trabajador: string | null
  dni: string | null
  puesto: string | null
  evaluador: string
  fecha_evaluacion: string
  metodos: string[]
  level_max: number
  score_reba: number | null
}

export interface EvaluacionCompleta extends EvaluacionResumen {
  payload: Record<string, unknown>
}

export interface SaveBody {
  empresa: string
  trabajador?: string
  dni?: string
  puesto?: string
  evaluador: string
  fecha_evaluacion: string
  metodos: string[]
  level_max: number
  score_reba?: number | null
  payload: Record<string, unknown>
}

const BASE = '/api/evaluaciones'

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { msg = (await res.json()).error || msg } catch {}
    throw new Error(msg)
  }
  return res.json() as Promise<T>
}

export async function guardarEvaluacion(body: SaveBody, key: string): Promise<{ id: string }> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  })
  const j = await jsonOrThrow<{ ok: boolean; evaluacion: { id: string } }>(res)
  return { id: j.evaluacion.id }
}

export async function listarEvaluaciones(key: string, q = ''): Promise<EvaluacionResumen[]> {
  const url = q ? `${BASE}?q=${encodeURIComponent(q)}` : BASE
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
  })
  const j = await jsonOrThrow<{ evaluaciones: EvaluacionResumen[] }>(res)
  return j.evaluaciones
}

export async function obtenerEvaluacion(id: string, key: string): Promise<EvaluacionCompleta> {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  const j = await jsonOrThrow<{ evaluacion: EvaluacionCompleta }>(res)
  return j.evaluacion
}

// Cliente HTTP del backend de historial.
// La clave personal se ingresa en la app (nunca por URL) y se guarda en este navegador.

const KEY_STORAGE = 'panacea-ergo-admin-key'

export function readAdminKey(): string {
  if (typeof window === 'undefined') return ''
  // Limpieza: versiones antiguas aceptaban ?k= en la URL; ya no se usa y se retira de la barra.
  const url = new URL(window.location.href)
  if (url.searchParams.has('k')) {
    url.searchParams.delete('k')
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
  }
  try {
    return localStorage.getItem(KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

/** Pide la clave personal y la guarda en este navegador. Devuelve '' si se cancela. */
export function pedirClave(mensaje = 'Ingrese su clave personal de acceso:'): string {
  const k = (prompt(mensaje) ?? '').trim()
  if (!k) return ''
  try { localStorage.setItem(KEY_STORAGE, k) } catch {}
  return k
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

export async function listarEvaluaciones(key: string, q = '', limit = 50): Promise<EvaluacionResumen[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (q) params.set('q', q)
  const url = `${BASE}?${params}`
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

export async function actualizarEvaluacion(
  id: string,
  body: { level_max: number; score_reba: number | null; payload: Record<string, unknown> },
  key: string,
): Promise<void> {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  })
  await jsonOrThrow<{ ok: boolean }>(res)
}

export async function borrarEvaluacion(id: string, key: string): Promise<void> {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${key}` },
  })
  await jsonOrThrow<{ ok: boolean }>(res)
}

// ─── Administración: usuarios y registro de accesos ─────────────────────

export interface UsuarioAcceso {
  id: string
  creado_en: string
  nombre: string
  rol: 'admin' | 'evaluador'
  activo: boolean
}

export interface RegistroAcceso {
  ts: string
  usuario_nombre: string
  accion: string
  evaluacion_id: string | null
  detalle: string | null
  ip: string | null
}

const auth = (key: string) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${key}` })

/** Lanza un error con `status` para distinguir "no es administrador" (401/403). */
export async function listarUsuarios(key: string): Promise<UsuarioAcceso[]> {
  const res = await fetch('/api/admin/usuarios', { headers: auth(key) })
  if (res.status === 401 || res.status === 403) throw Object.assign(new Error('no-admin'), { status: res.status })
  return (await jsonOrThrow<{ usuarios: UsuarioAcceso[] }>(res)).usuarios
}

export async function crearUsuario(
  nombre: string,
  rol: 'admin' | 'evaluador',
  key: string,
): Promise<{ usuario: UsuarioAcceso; clave: string }> {
  const res = await fetch('/api/admin/usuarios', { method: 'POST', headers: auth(key), body: JSON.stringify({ nombre, rol }) })
  return jsonOrThrow(res)
}

export async function cambiarUsuario(id: string, activo: boolean, key: string): Promise<void> {
  const res = await fetch('/api/admin/usuarios', { method: 'PATCH', headers: auth(key), body: JSON.stringify({ id, activo }) })
  await jsonOrThrow<{ ok: boolean }>(res)
}

export async function listarAccesos(key: string): Promise<RegistroAcceso[]> {
  const res = await fetch('/api/admin/accesos', { headers: auth(key) })
  return (await jsonOrThrow<{ accesos: RegistroAcceso[] }>(res)).accesos
}

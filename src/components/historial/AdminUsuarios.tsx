// Panel de administración: claves personales por evaluador y registro de accesos.
// Solo se muestra si la clave actual es de administrador (el servidor responde 401/403 si no).

import { useEffect, useState } from 'react'
import { Btn } from '@/components/ui'
import {
  cambiarUsuario,
  crearUsuario,
  listarAccesos,
  listarUsuarios,
  type RegistroAcceso,
  type UsuarioAcceso,
} from '@/lib/api/historial'

const ACCION: Record<string, string> = {
  listar: 'Listó el historial', ver: 'Abrió evaluación', crear: 'Guardó evaluación',
  actualizar: 'Recalculó evaluación', borrar: 'Eliminó evaluación', ia_analizar: 'Análisis IA de fotos',
  usuario_crear: 'Creó usuario', usuario_activar: 'Activó usuario', usuario_desactivar: 'Desactivó usuario',
}

export function AdminUsuarios({ adminKey }: { adminKey: string }) {
  const [esAdmin, setEsAdmin] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const [usuarios, setUsuarios] = useState<UsuarioAcceso[]>([])
  const [accesos, setAccesos] = useState<RegistroAcceso[]>([])
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState<'evaluador' | 'admin'>('evaluador')
  const [nueva, setNueva] = useState<{ nombre: string; clave: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargar = async () => {
    try {
      setUsuarios(await listarUsuarios(adminKey))
      setEsAdmin(true)
      setAccesos(await listarAccesos(adminKey))
    } catch (e) {
      if ((e as { status?: number }).status) setEsAdmin(false)
      else setError((e as Error).message)
    }
  }

  useEffect(() => {
    void cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey])

  if (!esAdmin) return null

  const crear = async () => {
    setError(null)
    try {
      const r = await crearUsuario(nombre.trim(), rol, adminKey)
      setNueva({ nombre: r.usuario.nombre, clave: r.clave })
      setNombre('')
      await cargar()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const alternar = async (u: UsuarioAcceso) => {
    if (u.activo && !confirm(`¿Desactivar la clave de ${u.nombre}? Dejará de tener acceso de inmediato.`)) return
    try {
      await cambiarUsuario(u.id, !u.activo, adminKey)
      await cargar()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="border border-ergo-cb rounded-lg p-3 mb-3 text-xs">
      <button className="font-bold text-ergo-orange underline" onClick={() => setAbierto(!abierto)}>
        🔐 Usuarios y registro de accesos {abierto ? '▲' : '▼'}
      </button>
      {abierto && (
        <div className="mt-3">
          {error && <div className="bg-red-50 border border-red-300 text-red-800 rounded px-2 py-1 mb-2">{error}</div>}

          <div className="font-semibold mb-1">Crear clave personal</div>
          <div className="flex gap-2 mb-2">
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Nombre del evaluador"
              className="flex-1 px-2 py-1.5 border border-ergo-cb rounded bg-ergo-inp"
            />
            <select value={rol} onChange={e => setRol(e.target.value as 'evaluador' | 'admin')} className="border border-ergo-cb rounded px-2">
              <option value="evaluador">Evaluador</option>
              <option value="admin">Administrador</option>
            </select>
            <Btn label="Crear" size="sm" onClick={() => void crear()} />
          </div>
          {nueva && (
            <div className="bg-amber-50 border border-amber-300 rounded p-2 mb-3">
              Clave de <strong>{nueva.nombre}</strong> (cópiela ahora: no se volverá a mostrar):
              <div className="font-mono text-sm mt-1 select-all break-all">{nueva.clave}</div>
              <button className="underline mt-1" onClick={() => setNueva(null)}>Ya la copié</button>
            </div>
          )}

          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-ergo-bg"><th className="text-left px-2 py-1">Usuario</th><th className="px-2">Rol</th><th className="px-2">Estado</th><th></th></tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="border-b border-ergo-cb">
                  <td className="px-2 py-1">{u.nombre}</td>
                  <td className="px-2 text-center">{u.rol === 'admin' ? 'Administrador' : 'Evaluador'}</td>
                  <td className="px-2 text-center">{u.activo ? 'Activo' : 'Desactivado'}</td>
                  <td className="px-2 text-right">
                    <button className="underline" onClick={() => void alternar(u)}>{u.activo ? 'Desactivar' : 'Reactivar'}</button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr><td colSpan={4} className="px-2 py-2 text-ergo-muted">Aún no hay claves personales; solo existe la clave de administrador.</td></tr>
              )}
            </tbody>
          </table>

          <div className="font-semibold mb-1">Registro de accesos (últimos 300)</div>
          <div className="max-h-64 overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-ergo-bg"><th className="text-left px-2 py-1">Fecha</th><th className="text-left px-2">Usuario</th><th className="text-left px-2">Acción</th><th className="text-left px-2">Detalle</th><th className="text-left px-2">IP</th></tr>
              </thead>
              <tbody>
                {accesos.map((a, i) => (
                  <tr key={i} className="border-b border-ergo-cb">
                    <td className="px-2 py-1 font-mono whitespace-nowrap">{new Date(a.ts).toLocaleString('es-PE')}</td>
                    <td className="px-2">{a.usuario_nombre}</td>
                    <td className="px-2">{ACCION[a.accion] ?? a.accion}</td>
                    <td className="px-2">{a.detalle ?? (a.evaluacion_id ? a.evaluacion_id.slice(0, 8) : '')}</td>
                    <td className="px-2 font-mono">{a.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

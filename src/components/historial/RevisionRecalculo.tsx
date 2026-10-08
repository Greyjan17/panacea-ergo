// Revisión del historial con las fórmulas corregidas (v3.1).
// Recalcula en el navegador cada evaluación guardada, muestra cuáles cambian
// y permite actualizarlas conservando los resultados anteriores.

import { useState } from 'react'
import { Btn } from '@/components/ui'
import { actualizarEvaluacion, listarEvaluaciones, obtenerEvaluacion } from '@/lib/api/historial'
import {
  construirPayloadRecalculado,
  recalcularEvaluacion,
  type PayloadGuardado,
  type Recalculo,
} from '@/lib/recalculo'
import type { Method } from '@/types/ergo'

const NIVEL = ['Inapreciable', 'Bajo', 'Medio', 'Alto', 'Muy alto']
const MAX = 200

interface Fila {
  id: string
  fecha: string
  empresa: string
  trabajador: string
  levelMax: number
  payload: PayloadGuardado
  r: Recalculo
}

export function RevisionRecalculo({ adminKey, onDone }: { adminKey: string; onDone: () => void }) {
  const [estado, setEstado] = useState<'inicio' | 'revisando' | 'listo' | 'aplicando' | 'aplicado'>('inicio')
  const [progreso, setProgreso] = useState('')
  const [filas, setFilas] = useState<Fila[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const revisar = async () => {
    setEstado('revisando')
    setError(null)
    try {
      const lista = await listarEvaluaciones(adminKey, '', MAX)
      setTotal(lista.length)
      const out: Fila[] = []
      for (const [i, it] of lista.entries()) {
        setProgreso(`Revisando ${i + 1} de ${lista.length}…`)
        const ev = await obtenerEvaluacion(it.id, adminKey)
        const payload = ev.payload as PayloadGuardado
        const r = recalcularEvaluacion(payload, it.metodos as Method[])
        if (r.cambios.length > 0) {
          out.push({
            id: it.id, fecha: it.fecha_evaluacion, empresa: it.empresa,
            trabajador: it.trabajador ?? '', levelMax: it.level_max, payload, r,
          })
        }
      }
      out.sort((a, b) => Number(b.r.subeRiesgo) - Number(a.r.subeRiesgo))
      setFilas(out)
      setEstado('listo')
    } catch (e) {
      setError((e as Error).message)
      setEstado('inicio')
    }
  }

  const aplicar = async () => {
    if (!confirm(
      `Se actualizarán ${filas.length} evaluación(es) con los resultados corregidos.\n` +
      'Los resultados anteriores quedan guardados dentro de cada evaluación.\n\n¿Continuar?',
    )) return
    setEstado('aplicando')
    setError(null)
    try {
      for (const [i, f] of filas.entries()) {
        setProgreso(`Actualizando ${i + 1} de ${filas.length}…`)
        await actualizarEvaluacion(
          f.id,
          {
            level_max: f.r.levelMax,
            score_reba: f.r.scoreReba,
            payload: construirPayloadRecalculado(f.payload, f.r, f.levelMax),
          },
          adminKey,
        )
      }
      setEstado('aplicado')
      onDone()
    } catch (e) {
      setError(`Se detuvo la actualización: ${(e as Error).message}. Puede volver a revisar y continuar.`)
      setEstado('listo')
    }
  }

  const suben = filas.filter(f => f.r.subeRiesgo).length

  return (
    <div className="border-2 border-ergo-orange rounded-xl p-4 mb-4 bg-orange-50/40">
      <div className="font-bold text-sm mb-1">🩺 Revisión con fórmulas corregidas</div>

      {estado === 'inicio' && (
        <>
          <p className="text-xs text-ergo-muted mb-3">
            Se corrigieron errores en RULA, OWAS, NIOSH y REBA. Este paso recalcula todas las
            evaluaciones guardadas y le muestra cuáles cambian. No modifica nada hasta que usted lo confirme.
          </p>
          <Btn label="Revisar evaluaciones guardadas" size="sm" onClick={() => void revisar()} />
        </>
      )}

      {(estado === 'revisando' || estado === 'aplicando') && (
        <div className="text-sm text-ergo-muted">{progreso}</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg px-3 py-2 my-2 text-xs">{error}</div>
      )}

      {estado === 'listo' && filas.length === 0 && (
        <p className="text-sm">✅ Revisadas {total} evaluaciones: ninguna cambia. No hay nada que hacer.</p>
      )}

      {estado === 'listo' && filas.length > 0 && (
        <>
          <p className="text-sm mb-2">
            Revisadas {total} evaluaciones: <strong>{filas.length}</strong> cambian.{' '}
            {suben > 0 && (
              <span className="text-red-700 font-bold">
                {suben} SUBEN de nivel de riesgo (marcadas ▲): reemita esos informes.
              </span>
            )}
          </p>
          <table className="w-full border-collapse text-xs mb-3">
            <thead>
              <tr className="bg-ergo-orange text-white">
                <th className="px-2 py-1 text-left"></th>
                <th className="px-2 py-1 text-left">Fecha</th>
                <th className="px-2 py-1 text-left">Empresa</th>
                <th className="px-2 py-1 text-left">Trabajador</th>
                <th className="px-2 py-1 text-left">Cambio</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(f => (
                <tr key={f.id} className={`border-b border-ergo-cb ${f.r.subeRiesgo ? 'bg-red-50' : ''}`}>
                  <td className="px-2 py-1 font-bold text-red-700">{f.r.subeRiesgo ? '▲' : ''}</td>
                  <td className="px-2 py-1 font-mono">{f.fecha}</td>
                  <td className="px-2 py-1">{f.empresa}</td>
                  <td className="px-2 py-1">{f.trabajador || '—'}</td>
                  <td className="px-2 py-1">
                    {f.r.cambios.map(c => (
                      <div key={c.metodo}>
                        {c.metodo}: {c.nivelAntes === null ? '?' : NIVEL[c.nivelAntes]} → <strong>{NIVEL[c.nivelDespues]}</strong>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {total >= MAX && (
            <p className="text-xs text-ergo-muted mb-2">Se revisaron las {MAX} más recientes; repita tras actualizar.</p>
          )}
          <div className="flex gap-2 flex-wrap">
            <Btn label={`Actualizar ${filas.length} evaluación(es)`} size="sm" onClick={() => void aplicar()} />
            <Btn label="Imprimir lista" size="sm" variant="outline" onClick={() => window.print()} />
          </div>
        </>
      )}

      {estado === 'aplicado' && (
        <p className="text-sm">
          ✅ {filas.length} evaluación(es) actualizadas. Al pulsar <em>Abrir</em> en cada una verá el informe corregido.
        </p>
      )}
    </div>
  )
}

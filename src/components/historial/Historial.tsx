import { useEffect, useState } from 'react'
import { Btn, Card } from '@/components/ui'
import {
  clearAdminKey,
  listarEvaluaciones,
  obtenerEvaluacion,
  readAdminKey,
  type EvaluacionResumen,
} from '@/lib/api/historial'
import { useEvaluacion } from '@/store/useEvaluacion'

const RISK_COLOR = ['#22C55E', '#84CC16', '#EAB308', '#F97316', '#EF4444'] as const

export function Historial() {
  const setStep = useEvaluacion(s => s.setStep)
  const resetAll = useEvaluacion(s => s.resetAll)
  const setInfo = useEvaluacion(s => s.setInfo)
  const setReba = useEvaluacion(s => s.setReba)
  const setRula = useEvaluacion(s => s.setRula)
  const setOwas = useEvaluacion(s => s.setOwas)
  const setNiosh = useEvaluacion(s => s.setNiosh)
  const setMmc = useEvaluacion(s => s.setMmc)

  const [items, setItems] = useState<EvaluacionResumen[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const adminKey = readAdminKey()

  const cargar = async (search: string) => {
    if (!adminKey) {
      setError('Sin admin key. Abre la app con ?k=… al menos una vez.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const list = await listarEvaluaciones(adminKey, search)
      setItems(list)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void cargar('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const abrir = async (id: string) => {
    try {
      const ev = await obtenerEvaluacion(id, adminKey)
      const p = ev.payload as {
        info?: unknown
        reba?: unknown
        rula?: unknown
        owas?: unknown
        niosh?: unknown
        mmc?: unknown
      }
      resetAll()
      if (p.info) setInfo(p.info as Parameters<typeof setInfo>[0])
      if (p.reba) setReba(p.reba as Parameters<typeof setReba>[0])
      if (p.rula) setRula(p.rula as Parameters<typeof setRula>[0])
      if (p.owas) setOwas(p.owas as Parameters<typeof setOwas>[0])
      if (p.niosh) setNiosh(p.niosh as Parameters<typeof setNiosh>[0])
      if (p.mmc) setMmc(p.mmc as Parameters<typeof setMmc>[0])
      setStep(4)
      window.history.pushState({}, '', '/')
      window.location.reload()
    } catch (e) {
      alert(`Error al abrir: ${(e as Error).message}`)
    }
  }

  return (
    <Card title="📚 Historial de evaluaciones">
      <div className="flex gap-2 mb-3">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') void cargar(q)
          }}
          placeholder="Buscar por empresa, trabajador, DNI o puesto…"
          className="flex-1 px-3 py-2 border border-ergo-cb rounded-lg bg-ergo-inp text-sm focus:outline-none focus:border-ergo-orange"
        />
        <Btn label="Buscar" size="sm" onClick={() => void cargar(q)} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg px-3 py-2 mb-3 text-xs">
          {error}
        </div>
      )}

      {loading && <div className="text-sm text-ergo-muted">Cargando…</div>}

      {!loading && items.length === 0 && !error && (
        <div className="text-center py-10 text-sm text-ergo-muted">
          Sin evaluaciones guardadas todavía.
          <br />
          Genera una desde la pestaña <strong>Informe</strong> y dale a <em>Guardar en historial</em>.
        </div>
      )}

      {items.length > 0 && (
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-ergo-orange text-white">
              <th className="px-2 py-1.5 text-left">Fecha</th>
              <th className="px-2 py-1.5 text-left">Empresa · Puesto</th>
              <th className="px-2 py-1.5 text-left">Trabajador</th>
              <th className="px-2 py-1.5 text-center">Métodos</th>
              <th className="px-2 py-1.5 text-center">REBA</th>
              <th className="px-2 py-1.5 text-center">Nivel</th>
              <th className="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id} className="border-b border-ergo-cb hover:bg-ergo-bg">
                <td className="px-2 py-1.5 font-mono">{it.fecha_evaluacion}</td>
                <td className="px-2 py-1.5">
                  <div className="font-semibold">{it.empresa}</div>
                  <div className="text-ergo-muted">{it.puesto || '—'}</div>
                </td>
                <td className="px-2 py-1.5">
                  <div>{it.trabajador || '—'}</div>
                  <div className="text-ergo-muted">{it.dni || '—'}</div>
                </td>
                <td className="px-2 py-1.5 text-center">{it.metodos.join(', ') || '—'}</td>
                <td className="px-2 py-1.5 text-center font-bold text-ergo-orange">
                  {it.score_reba != null ? `${it.score_reba}/15` : '—'}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
                    style={{ background: RISK_COLOR[Math.min(4, Math.max(0, it.level_max)) as 0 | 1 | 2 | 3 | 4] }}
                  >
                    {it.level_max}
                  </span>
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => void abrir(it.id)}
                    className="text-ergo-orange font-semibold underline hover:text-ergo-ob"
                  >
                    Abrir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-4 flex justify-between items-center text-[11px] text-ergo-muted">
        <span>{items.length > 0 ? `${items.length} evaluación(es) cargada(s)` : ''}</span>
        <button
          onClick={() => {
            if (confirm('¿Cerrar sesión y olvidar el admin key en este navegador?')) {
              clearAdminKey()
              window.location.reload()
            }
          }}
          className="underline"
        >
          Cerrar sesión
        </button>
      </div>
    </Card>
  )
}

// Análisis postural de las fotos con IA. La IA solo PROPONE códigos:
// el médico revisa la propuesta y decide si la aplica al formulario.

import { useState } from 'react'
import { Btn, Chk } from '@/components/ui'
import { analizarFotos, type MetodoIA } from '@/lib/ai/client'
import { parseAIResponse } from '@/lib/ai/parser'
import { readAdminKey } from '@/lib/api/historial'
import { useEvaluacion } from '@/store/useEvaluacion'

const NOMBRES: Record<string, string> = {
  trunk: 'Tronco', trunkT: 'Tronco: torsión', trunkS: 'Tronco: inclinación lateral',
  neck: 'Cuello', neckT: 'Cuello: torsión', neckS: 'Cuello: inclinación lateral',
  legs: 'Piernas: apoyo', knee: 'Rodillas: flexión', ua: 'Brazo', shr: 'Hombro elevado', abd: 'Brazo abducido',
  sup: 'Brazo apoyado', la: 'Antebrazo', mid: 'Cruza línea media',
  wrist: 'Muñeca', wristT: 'Muñeca: torsión/giro', wristDev: 'Muñeca: desviación',
  back: 'Espalda', arms: 'Brazos',
}

const fmt = (v: unknown) => (v === true ? 'Sí' : v === false ? 'No' : String(v))

interface Propuesta {
  values: Record<string, unknown>
  hallazgos: string
  confidence: number
}

export function AIAnalyzer({ method }: { method: MetodoIA }) {
  const photos = useEvaluacion(s => s.photos)
  const consentimiento = useEvaluacion(s => s.info.consentimientoIA ?? false)
  const setInfo = useEvaluacion(s => s.setInfo)
  const setReba = useEvaluacion(s => s.setReba)
  const setRula = useEvaluacion(s => s.setRula)
  const setOwas = useEvaluacion(s => s.setOwas)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [propuesta, setPropuesta] = useState<Propuesta | null>(null)
  const [aplicada, setAplicada] = useState(false)

  const analizar = async () => {
    let key = readAdminKey()
    if (!key) {
      const k = prompt('Ingrese su clave de acceso (la misma del Historial):')
      if (!k) return
      try { localStorage.setItem('panacea-ergo-admin-key', k) } catch {}
      key = k
    }
    setLoading(true)
    setError(null)
    setPropuesta(null)
    setAplicada(false)
    try {
      const raw = await analizarFotos(method, photos, key)
      const r = parseAIResponse(method, raw)
      setPropuesta({ values: r.values as Record<string, unknown>, hallazgos: r.hallazgos, confidence: r.confidence })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const aplicar = () => {
    if (!propuesta) return
    const v = propuesta.values
    if (method === 'REBA') setReba(v as Parameters<typeof setReba>[0])
    if (method === 'RULA') setRula(v as Parameters<typeof setRula>[0])
    if (method === 'OWAS') setOwas(v as Parameters<typeof setOwas>[0])
    setAplicada(true)
  }

  const entradas = propuesta ? Object.entries(propuesta.values) : []
  const conf = propuesta
    ? propuesta.confidence >= 0.8 ? 'Alta' : propuesta.confidence >= 0.5 ? 'Media' : 'Baja'
    : ''

  return (
    <div>
      <p className="text-xs text-ergo-muted mb-3">
        La IA observa las fotos (máx. 3) y <strong>propone</strong> los códigos posturales de {method}.
        Usted revisa la propuesta y decide si aplicarla. Carga, fuerza, agarre y actividad se completan a mano.
      </p>

      <Chk
        label="Cuento con el consentimiento informado del trabajador para analizar sus fotos con IA (Ley 29733)"
        value={consentimiento}
        onChange={v => setInfo({ consentimientoIA: v })}
      />

      <div className="mt-3">
        <Btn
          label={loading ? 'Analizando… (hasta 1 minuto)' : `Analizar fotos con IA (${method})`}
          size="sm"
          disabled={!consentimiento || loading || photos.length === 0}
          onClick={() => void analizar()}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg px-3 py-2 mt-3 text-xs">{error}</div>
      )}

      {propuesta && (
        <div className="mt-4 border border-ergo-cb rounded-lg p-3 bg-white">
          <div className="text-sm font-bold mb-2">
            Propuesta de la IA · confianza {conf}
          </div>
          {entradas.length === 0 ? (
            <p className="text-xs text-ergo-muted">La IA no pudo determinar ningún código con estas fotos.</p>
          ) : (
            <table className="w-full text-xs border-collapse mb-2">
              <tbody>
                {entradas.map(([k, v]) => (
                  <tr key={k} className="border-b border-ergo-cb">
                    <td className="py-1 pr-2">{NOMBRES[k] ?? k}</td>
                    <td className="py-1 font-bold">{fmt(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {propuesta.hallazgos && (
            <p className="text-xs text-ergo-mid mb-3"><strong>Hallazgos:</strong> {propuesta.hallazgos}</p>
          )}
          {aplicada ? (
            <p className="text-xs text-emerald-700 font-bold">
              ✅ Aplicado al formulario. Revise cada campo arriba y corrija lo que no coincida con su observación.
            </p>
          ) : (
            entradas.length > 0 && (
              <div className="flex gap-2">
                <Btn label="Aplicar al formulario" size="sm" onClick={aplicar} />
                <Btn label="Descartar" size="sm" variant="outline" onClick={() => setPropuesta(null)} />
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

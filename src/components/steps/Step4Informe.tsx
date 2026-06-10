import { useState } from 'react'
import { Btn } from '@/components/ui'
import { Informe } from '@/components/informe/Informe'
import { calcMmc } from '@/lib/calc/mmc'
import { calcNiosh } from '@/lib/calc/niosh'
import { calcOwas } from '@/lib/calc/owas'
import { calcReba } from '@/lib/calc/reba'
import { calcRula } from '@/lib/calc/rula'
import { guardarEvaluacion, readAdminKey } from '@/lib/api/historial'
import { useEvaluacion } from '@/store/useEvaluacion'

export function Step4Informe() {
  const setStep = useEvaluacion(s => s.setStep)
  const info = useEvaluacion(s => s.info)
  const reba = useEvaluacion(s => s.reba)
  const rula = useEvaluacion(s => s.rula)
  const owas = useEvaluacion(s => s.owas)
  const niosh = useEvaluacion(s => s.niosh)
  const mmc = useEvaluacion(s => s.mmc)

  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const guardar = async () => {
    const key = readAdminKey()
    if (!key) {
      const k = prompt(
        'Ingresa el admin key (te lo dio Wences al configurar el backend).\n' +
          'Se guardará en este navegador para próximas evaluaciones.',
      )
      if (!k) return
      try { localStorage.setItem('panacea-ergo-admin-key', k) } catch {}
    }
    const adminKey = readAdminKey()
    if (!adminKey) return

    setSaving(true)
    setError(null)
    setSavedId(null)

    try {
      const ri = {
        reba: info.metodos.includes('REBA') ? calcReba(reba) : null,
        rula: info.metodos.includes('RULA') ? calcRula(rula) : null,
        owas: info.metodos.includes('OWAS') ? calcOwas(owas) : null,
        niosh: info.metodos.includes('NIOSH') ? calcNiosh(niosh) : null,
        mmc: info.metodos.includes('MMC') ? calcMmc(mmc, info.sexo) : null,
      }
      const levelMax = Math.max(
        ri.reba?.level ?? 0,
        ri.rula?.level ?? 0,
        ri.owas?.level ?? 0,
        ri.niosh?.level ?? 0,
        ri.mmc?.level ?? 0,
      )
      const { id } = await guardarEvaluacion(
        {
          empresa: info.empresa,
          trabajador: info.trabajador,
          dni: info.dni,
          puesto: info.puesto,
          evaluador: info.evaluador,
          fecha_evaluacion: info.fecha,
          metodos: info.metodos,
          level_max: levelMax,
          score_reba: ri.reba?.fin ?? null,
          payload: { info, reba, rula, owas, niosh, mmc, resultados: ri },
        },
        adminKey,
      )
      setSavedId(id)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="noprint sticky top-0 z-20 bg-yellow-50 border-b border-yellow-200 px-4 py-3 mb-5 flex items-center justify-between flex-wrap gap-2 rounded-xl">
        <div className="text-xs text-yellow-900">
          Vista de impresión. <kbd className="bg-white border px-1 rounded text-[10px]">⌘ + P</kbd> o botón.
        </div>
        <div className="flex gap-2 flex-wrap">
          <Btn label="🖨 Imprimir / PDF" onClick={() => window.print()} size="sm" />
          <Btn
            label={saving ? '⏳ Guardando…' : savedId ? '✓ Guardada' : '💾 Guardar en historial'}
            onClick={() => void guardar()}
            disabled={saving || !!savedId}
            variant="outline"
            size="sm"
          />
          <Btn label="← Resultados" variant="outline" onClick={() => setStep(3)} size="sm" />
        </div>
      </div>

      {error && (
        <div className="noprint bg-red-50 border border-red-300 text-red-800 rounded-xl px-3 py-2 mb-3 text-xs">
          No se pudo guardar: <strong>{error}</strong>
          <br />
          Si es la primera vez, asegúrate de que el backend esté configurado (Neon + DATABASE_URL + ADMIN_KEY).
        </div>
      )}
      {savedId && (
        <div className="noprint bg-green-50 border border-green-300 text-green-800 rounded-xl px-3 py-2 mb-3 text-xs">
          ✓ Evaluación guardada con ID <code className="font-mono">{savedId.slice(0, 8)}…</code>. Consúltala
          en{' '}
          <a className="underline font-bold" href="/?vista=historial">
            Historial
          </a>
          .
        </div>
      )}

      <Informe />
    </div>
  )
}

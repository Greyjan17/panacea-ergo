import { useState } from 'react'
import { Btn } from '@/components/ui'
import { calcPoseAngles, consolidateWorstAngles } from '@/lib/pose/angles'
import { interpretAngles, type Finding } from '@/lib/pose/interpret'
import { detectLandmarks } from '@/lib/pose/loadMediaPipe'
import { mapAnglesToREBA, mapAnglesToRULA } from '@/lib/pose/mapping'
import { drawSkeleton } from '@/lib/pose/skeleton'
import type { Landmark, PoseAngles } from '@/lib/pose/types'
import { useEvaluacion } from '@/store/useEvaluacion'
import type { Method } from '@/types/ergo'

interface Props {
  method: Method
}

interface PerPhotoResult {
  idx: number
  label: string
  angles: PoseAngles
  skeleton: string
}

interface PoseData {
  worst: PoseAngles
  perPhoto: PerPhotoResult[]
  best: PerPhotoResult
  findings: Finding[]
  totalAnalyzed: number
}

export function PoseAnalyzer({ method }: Props) {
  const photos = useEvaluacion(s => s.photos)
  const setReba = useEvaluacion(s => s.setReba)
  const setRula = useEvaluacion(s => s.setRula)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PoseData | null>(null)

  const analyze = async () => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const results: PerPhotoResult[] = []
      const errors: string[] = []
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i]!
        try {
          const lm: Landmark[] = await detectLandmarks(p.url)
          const angles = calcPoseAngles(lm)
          const skeleton = await drawSkeleton(p.url, lm)
          results.push({ idx: i, label: p.label, angles, skeleton })
        } catch (e) {
          errors.push(`${p.label}: ${(e as Error).message}`)
        }
      }
      if (results.length === 0) {
        throw new Error(
          `No se detectó persona en ninguna foto. ${errors.length ? errors.join(' · ') : ''}`,
        )
      }
      const worst = consolidateWorstAngles(results.map(r => r.angles))

      // Peor postura individual = la que tendría score REBA estimado más alto
      let best = results[0]!
      let bestScore = -1
      for (const r of results) {
        const m = mapAnglesToREBA(r.angles)
        const score = m.trunk + m.neck + m.ua + m.la + m.wrist + m.legs
        if (score > bestScore) {
          bestScore = score
          best = r
        }
      }

      setData({
        worst,
        perPhoto: results,
        best,
        findings: interpretAngles(worst),
        totalAnalyzed: results.length,
      })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const applyToForm = () => {
    if (!data) return
    if (method === 'REBA') {
      const m = mapAnglesToREBA(data.worst)
      setReba({
        trunk: m.trunk, neck: m.neck, ua: m.ua, la: m.la, wrist: m.wrist, legs: m.legs,
      })
    } else if (method === 'RULA') {
      const m = mapAnglesToRULA(data.worst)
      setRula({
        trunk: m.trunk, neck: m.neck, ua: m.ua, la: m.la, wrist: m.wrist,
      })
    }
  }

  return (
    <div>
      <Btn
        label={loading ? '⏳ Analizando…' : `📐 Detectar landmarks en ${photos.length} foto(s)`}
        onClick={() => void analyze()}
        disabled={loading || photos.length === 0}
      />

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      {data && (
        <div className="mt-4 rounded-xl border-2 border-emerald-500 overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-700 to-emerald-500 text-white px-4 py-2.5 font-bold text-[13px]">
            📐 Resultado integral — {data.totalAnalyzed} foto(s) · peor postura: {data.best.label}
          </div>

          <div className="p-3.5">
            <img
              src={data.best.skeleton}
              alt="Esqueleto detectado"
              className="block max-w-full max-h-[280px] mx-auto rounded border border-ergo-cb mb-3"
            />

            <table className="w-full text-xs border-collapse mb-3">
              <thead>
                <tr className="bg-emerald-600 text-white">
                  <th className="text-left px-2 py-1">Segmento</th>
                  <th className="text-center px-2 py-1">Ángulo</th>
                  <th className="text-center px-2 py-1">{method}</th>
                  <th className="text-left px-2 py-1">Criterio</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ['Tronco', data.worst.trunk, criterioTrunk(data.worst.trunk)],
                    ['Cuello', data.worst.neck, criterioNeck(data.worst.neck)],
                    ['Brazo sup.', data.worst.ua, criterioUA(data.worst.ua)],
                    ['Brazo inf.', data.worst.la, criterioLA(data.worst.la)],
                    ['Muñeca', data.worst.wrist, criterioWrist(data.worst.wrist)],
                    ['Rodillas', data.worst.knee, criterioKnee(data.worst.knee)],
                  ] as const
                ).map(([seg, ang, crit], i) => {
                  const niv = mapToNivel(seg, ang, method)
                  return (
                    <tr key={seg} className={`border-b border-ergo-cb ${i % 2 === 0 ? 'bg-ergo-bg' : 'bg-white'}`}>
                      <td className="px-2 py-1 font-semibold">{seg}</td>
                      <td className="px-2 py-1 text-center font-bold text-emerald-600">{ang}°</td>
                      <td className="px-2 py-1 text-center font-bold text-ergo-orange">{niv}</td>
                      <td className="px-2 py-1 text-ergo-muted">{crit}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {data.findings.length > 0 && (
              <div className="bg-red-50 border-[1.5px] border-red-400 rounded-xl p-3 mb-3">
                <div className="font-bold text-xs text-red-900 mb-1.5">
                  Hallazgos clínicos por medición angular:
                </div>
                {data.findings.map((f, i) => (
                  <div key={i} className="flex gap-2 items-start text-xs mb-1.5">
                    <span
                      className="text-white px-2 rounded-full font-bold flex-shrink-0 mt-0.5"
                      style={{ background: f.risk === 'alto' ? '#EF4444' : f.risk === 'medio' ? '#F97316' : '#84CC16' }}
                    >
                      {f.risk.toUpperCase()}
                    </span>
                    <span>
                      <strong>{f.seg}:</strong> {f.desc}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {(method === 'REBA' || method === 'RULA') && (
              <Btn
                label={`✅ Aplicar al formulario ${method}`}
                onClick={applyToForm}
              />
            )}

            <div className="text-[10px] text-ergo-muted mt-3 text-center">
              MediaPipe Pose · BlazePose GHUM 3D · Complexity 2 · Precisión ±3-5°
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const criterioTrunk = (v: number) =>
  v <= 5 ? 'Erecto' : v <= 20 ? '0-20°' : v <= 60 ? '20-60°' : '>60°'
const criterioNeck = (v: number) =>
  v <= 10 ? '0-10°' : v <= 20 ? '10-20°' : '>20°'
const criterioUA = (v: number) =>
  v <= 20 ? '-20/20°' : v <= 45 ? '20-45°' : v <= 90 ? '45-90°' : '>90°'
const criterioLA = (v: number) => (v >= 60 && v <= 100 ? '60-100°' : 'Fuera rango')
const criterioWrist = (v: number) => (v <= 15 ? '0-15°' : '>15°')
const criterioKnee = (v: number) =>
  v >= 150 ? 'Extendidas' : v >= 120 ? 'Flex 30-60°' : 'Flex >60°'

function mapToNivel(
  seg: 'Tronco' | 'Cuello' | 'Brazo sup.' | 'Brazo inf.' | 'Muñeca' | 'Rodillas',
  ang: number,
  method: Method,
): number | string {
  const fakeAngles: PoseAngles = {
    trunk: 0, neck: 0, ua: 0, uaL: 0, uaR: 0,
    la: 80, wrist: 0, knee: 175, kneeL: 175, kneeR: 175,
  }
  if (seg === 'Tronco') fakeAngles.trunk = ang
  if (seg === 'Cuello') fakeAngles.neck = ang
  if (seg === 'Brazo sup.') fakeAngles.ua = ang
  if (seg === 'Brazo inf.') fakeAngles.la = ang
  if (seg === 'Muñeca') fakeAngles.wrist = ang
  if (seg === 'Rodillas') fakeAngles.knee = ang
  const r = method === 'REBA' ? mapAnglesToREBA(fakeAngles) : mapAnglesToRULA(fakeAngles)
  if (seg === 'Tronco') return r.trunk
  if (seg === 'Cuello') return r.neck
  if (seg === 'Brazo sup.') return r.ua
  if (seg === 'Brazo inf.') return r.la
  if (seg === 'Muñeca') return r.wrist
  if (seg === 'Rodillas') return method === 'REBA' ? (r as ReturnType<typeof mapAnglesToREBA>).legs : '—'
  return '—'
}

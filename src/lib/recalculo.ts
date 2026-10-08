// Recalcula una evaluación guardada con las fórmulas vigentes y la compara con
// los resultados almacenados. Pura: sin acceso a red ni a base de datos.

import { calcReba, type REBAInput } from '@/lib/calc/reba'
import { calcRula, type RULAInput } from '@/lib/calc/rula'
import { calcOwas, type OWASInput } from '@/lib/calc/owas'
import { calcNiosh, type NIOSHInput } from '@/lib/calc/niosh'
import { calcMmc, type MMCInput } from '@/lib/calc/mmc'
import type { Method, Sexo } from '@/types/ergo'

export const VERSION_CALCULO = '3.1.0'

export interface PayloadGuardado {
  info?: { sexo?: Sexo; metodos?: Method[] }
  reba?: REBAInput
  rula?: RULAInput
  owas?: OWASInput
  niosh?: NIOSHInput
  mmc?: MMCInput
  resultados?: Partial<Record<'reba' | 'rula' | 'owas' | 'niosh' | 'mmc', { level?: number } | null>>
  [k: string]: unknown
}

export interface CambioMetodo {
  metodo: Method
  nivelAntes: number | null
  nivelDespues: number
  /** Puntuación principal del método (REBA/RULA fin, OWAS cat, NIOSH LI, MMC kg). */
  scoreAntes: number | null
  scoreDespues: number
}

export interface Recalculo {
  resultados: NonNullable<PayloadGuardado['resultados']>
  levelMax: number
  scoreReba: number | null
  cambios: CambioMetodo[]
  /** true si algún método sube de nivel de riesgo: el informe emitido infravaloraba el riesgo. */
  subeRiesgo: boolean
}

const KEYS: Record<Method, 'reba' | 'rula' | 'owas' | 'niosh' | 'mmc'> = {
  REBA: 'reba', RULA: 'rula', OWAS: 'owas', NIOSH: 'niosh', MMC: 'mmc',
}

function score(m: Method, r: unknown): number | null {
  if (!r || typeof r !== 'object') return null
  const o = r as Record<string, unknown>
  const v = m === 'OWAS' ? o.cat : m === 'NIOSH' ? o.LI : m === 'MMC' ? o.pct : o.fin
  return typeof v === 'number' ? v : null
}

export function recalcularEvaluacion(payload: PayloadGuardado, metodos: Method[]): Recalculo {
  const sexo: Sexo = payload.info?.sexo ?? 'masculino'
  const nuevos: Recalculo['resultados'] = {
    reba: null, rula: null, owas: null, niosh: null, mmc: null,
  }
  if (metodos.includes('REBA') && payload.reba) nuevos.reba = calcReba(payload.reba)
  if (metodos.includes('RULA') && payload.rula) nuevos.rula = calcRula(payload.rula)
  if (metodos.includes('OWAS') && payload.owas) nuevos.owas = calcOwas(payload.owas)
  if (metodos.includes('NIOSH') && payload.niosh) nuevos.niosh = calcNiosh(payload.niosh)
  if (metodos.includes('MMC') && payload.mmc) nuevos.mmc = calcMmc(payload.mmc, sexo)

  const cambios: CambioMetodo[] = []
  for (const m of metodos) {
    const k = KEYS[m]
    const despues = nuevos[k] as { level: number } | null
    if (!despues) continue
    const antes = payload.resultados?.[k] ?? null
    const nivelAntes = typeof antes?.level === 'number' ? antes.level : null
    const scoreAntes = score(m, antes)
    const scoreDespues = score(m, despues)!
    const mismoScore = scoreAntes !== null && Math.abs(scoreAntes - scoreDespues) < 1e-9
    if (nivelAntes !== despues.level || !mismoScore) {
      cambios.push({ metodo: m, nivelAntes, nivelDespues: despues.level, scoreAntes, scoreDespues })
    }
  }

  const levelMax = Math.max(0, ...Object.values(nuevos).map(r => (r as { level?: number } | null)?.level ?? 0))
  return {
    resultados: nuevos,
    levelMax,
    scoreReba: (nuevos.reba as { fin?: number } | null)?.fin ?? null,
    cambios,
    subeRiesgo: cambios.some(c => c.nivelAntes === null || c.nivelDespues > c.nivelAntes),
  }
}

/** Payload actualizado: nuevos resultados + registro del recálculo con los resultados anteriores. */
export function construirPayloadRecalculado(
  payload: PayloadGuardado,
  r: Recalculo,
  levelMaxAnterior: number,
): PayloadGuardado {
  const previos = Array.isArray(payload.recalculos) ? payload.recalculos : []
  return {
    ...payload,
    resultados: r.resultados,
    recalculos: [
      ...previos,
      {
        fecha: new Date().toISOString(),
        version: VERSION_CALCULO,
        motivo: 'Corrección de tablas RULA/OWAS/NIOSH/REBA',
        resultadosAnteriores: payload.resultados ?? null,
        levelMaxAnterior,
      },
    ],
  }
}

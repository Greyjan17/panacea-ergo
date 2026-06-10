// Parser de respuestas del Worker IA.
// El Worker original devuelve texto libre (formato semi-estructurado por método).
// Esta capa valida con Zod, normaliza tipos y entrega valores listos para mergear
// en los inputs REBA/RULA/OWAS/NIOSH.

import { z } from 'zod'
import type { Method } from '@/types/ergo'

// ─── Schemas por método ─────────────────────────────────────────────────

export const REBAParsedSchema = z
  .object({
    neck: z.number().int().min(1).max(2).optional(),
    neckT: z.boolean().optional(),
    neckS: z.boolean().optional(),
    trunk: z.number().int().min(1).max(4).optional(),
    trunkT: z.boolean().optional(),
    trunkS: z.boolean().optional(),
    legs: z.number().int().min(1).max(4).optional(),
    load: z.number().int().min(0).max(2).optional(),
    shock: z.boolean().optional(),
    ua: z.number().int().min(1).max(6).optional(),
    shr: z.boolean().optional(),
    abd: z.boolean().optional(),
    sup: z.boolean().optional(),
    la: z.number().int().min(1).max(2).optional(),
    wrist: z.number().int().min(1).max(3).optional(),
    wristT: z.boolean().optional(),
    coup: z.number().int().min(0).max(3).optional(),
    act: z.number().int().min(0).max(3).optional(),
  })
  .strict()

export const RULAParsedSchema = z
  .object({
    ua: z.number().int().min(1).max(4).optional(),
    shr: z.boolean().optional(),
    sup: z.boolean().optional(),
    la: z.number().int().min(1).max(2).optional(),
    mid: z.boolean().optional(),
    wrist: z.number().int().min(1).max(3).optional(),
    wristT: z.boolean().optional(),
    mA: z.number().int().min(0).max(1).optional(),
    fA: z.number().int().min(0).max(3).optional(),
    neck: z.number().int().min(1).max(4).optional(),
    neckT: z.boolean().optional(),
    neckS: z.boolean().optional(),
    trunk: z.number().int().min(1).max(4).optional(),
    trunkT: z.boolean().optional(),
    trunkS: z.boolean().optional(),
    legs: z.number().int().min(1).max(2).optional(),
    mB: z.number().int().min(0).max(1).optional(),
    fB: z.number().int().min(0).max(3).optional(),
  })
  .strict()

export const OWASParsedSchema = z
  .object({
    back: z.number().int().min(1).max(4).optional(),
    arms: z.number().int().min(1).max(3).optional(),
    legs: z.number().int().min(1).max(7).optional(),
    load: z.number().int().min(1).max(3).optional(),
  })
  .strict()

export const NIOSHParsedSchema = z
  .object({
    L: z.number().min(0).max(200).optional(),
    H: z.number().min(1).max(100).optional(),
    V: z.number().min(0).max(175).optional(),
    D: z.number().min(1).max(175).optional(),
    A: z.number().min(0).max(135).optional(),
    F: z.number().min(0).max(15).optional(),
    dur: z.enum(['<1h', '1-2h', '2-8h']).optional(),
    coup: z.enum(['good', 'fair', 'poor']).optional(),
  })
  .strict()

export type REBAParsed = z.infer<typeof REBAParsedSchema>
export type RULAParsed = z.infer<typeof RULAParsedSchema>
export type OWASParsed = z.infer<typeof OWASParsedSchema>
export type NIOSHParsed = z.infer<typeof NIOSHParsedSchema>

const SCHEMAS = {
  REBA: REBAParsedSchema,
  RULA: RULAParsedSchema,
  OWAS: OWASParsedSchema,
  NIOSH: NIOSHParsedSchema,
} as const

export interface AIRawResponse {
  /** Si el Worker ya responde JSON estructurado, este es el camino feliz. */
  values?: unknown
  /** Hallazgos clínicos en texto libre extraídos por la IA. */
  hallazgos?: string
  /** Confianza reportada por el Worker (0..1). */
  confidence?: number
  /** Texto crudo legacy (compat con v2.1). El parser legacy aplica regex. */
  raw?: string
}

export interface ParseResult<P> {
  values: P
  hallazgos: string
  confidence: number
}

export class AIParseError extends Error {
  readonly issues: z.ZodIssue[]
  constructor(message: string, issues: z.ZodIssue[]) {
    super(message)
    this.name = 'AIParseError'
    this.issues = issues
  }
}

/**
 * Parsea respuesta del Worker para un método dado.
 * 1) Si `values` viene como JSON → valida con Zod.
 * 2) Si solo viene `raw` → aplica parser legacy (TODO en F6).
 */
export function parseAIResponse<M extends Exclude<Method, 'MMC'>>(
  method: M,
  response: AIRawResponse,
): ParseResult<
  M extends 'REBA' ? REBAParsed : M extends 'RULA' ? RULAParsed : M extends 'OWAS' ? OWASParsed : NIOSHParsed
> {
  const schema = SCHEMAS[method]
  const candidate = response.values ?? {}
  const result = schema.safeParse(candidate)
  if (!result.success) {
    throw new AIParseError(
      `Respuesta IA inválida para ${method}: ${result.error.issues.map(i => i.path.join('.') + ': ' + i.message).join('; ')}`,
      result.error.issues,
    )
  }
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values: result.data as any,
    hallazgos: response.hallazgos ?? '',
    confidence: typeof response.confidence === 'number' ? response.confidence : 0,
  }
}

/**
 * Merge "peor postura gana" para consolidar múltiples fotos:
 *  - números: máximo
 *  - booleans: OR
 *  - strings/enums: la última gana (en duda, último valor del Worker)
 */
export function mergeWorstCase<T extends Record<string, unknown>>(
  partials: ReadonlyArray<Partial<T>>,
): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const p of partials) {
    for (const [k, v] of Object.entries(p)) {
      if (v === undefined) continue
      const cur = out[k]
      if (typeof v === 'boolean') {
        out[k] = Boolean(cur) || v
      } else if (typeof v === 'number') {
        out[k] = typeof cur === 'number' ? Math.max(cur, v) : v
      } else {
        out[k] = v
      }
    }
  }
  return out as Partial<T>
}

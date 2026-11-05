// POST /api/ai/analyze — análisis postural de fotos con Claude (visión).
// Requiere clave de acceso (ver _lib/auth.ts) y ANTHROPIC_API_KEY en Vercel.
//
// Devuelve una PROPUESTA de códigos posturales para REBA, RULA u OWAS; el médico
// la revisa y decide si la aplica al formulario. Solo se evalúa la postura visible:
// carga, fuerza, acoplamiento y actividad no se infieren de una foto.

import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { z as z4 } from 'zod/v4'
import { audit, requireUser } from '../_lib/auth.js'

const MODEL = 'claude-opus-5-5'

const BodySchema = z.object({
  method: z.enum(['REBA', 'RULA', 'OWAS']),
  // Fotos ya comprimidas en el navegador (≤800 px JPEG). Límite de cuerpo de Vercel: 4.5 MB.
  photos: z
    .array(
      z.object({
        label: z.string().max(60),
        mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
        data: z.string().min(1).max(1_400_000),
      }),
    )
    .min(1)
    .max(3),
})

type Metodo = z.infer<typeof BodySchema>['method']

// Campos que la IA puede proponer: [mín, máx] para códigos enteros, 'bool' para modificadores.
// Los rangos se verifican aquí (el esquema de salida solo garantiza el tipo): un valor
// fuera de rango se descarta como "no determinable" en lugar de invalidar toda la respuesta.
type Campo = readonly [number, number] | 'bool'
const CAMPOS: Record<Metodo, Record<string, Campo>> = {
  REBA: {
    trunk: [1, 4], trunkT: 'bool', trunkS: 'bool',
    neck: [1, 2], neckT: 'bool', neckS: 'bool',
    legs: [1, 2], knee: [0, 2],
    ua: [1, 4], shr: 'bool', abd: 'bool', sup: 'bool',
    la: [1, 2],
    wrist: [1, 2], wristT: 'bool',
  },
  RULA: {
    ua: [1, 4], shr: 'bool', abd: 'bool', sup: 'bool',
    la: [1, 2], mid: 'bool',
    wrist: [1, 3], wristDev: 'bool', wristT: 'bool',
    neck: [1, 4], neckT: 'bool', neckS: 'bool',
    trunk: [1, 4], trunkT: 'bool', trunkS: 'bool',
    legs: [1, 2],
  },
  OWAS: { back: [1, 4], arms: [1, 3], legs: [1, 7] },
}

// Cada campo admite null: la IA debe dejarlo vacío si la foto no permite determinarlo.
const outputSchema = (m: Metodo) =>
  z4.object({
    values: z4.object(
      Object.fromEntries(
        Object.entries(CAMPOS[m]).map(([k, c]) => [
          k,
          c === 'bool' ? z4.boolean().nullable() : z4.number().int().nullable(),
        ]),
      ),
    ),
    hallazgos: z4.string(),
    confianza: z4.string(),
  })

/** Conserva solo valores dentro de rango; null o fuera de rango = no determinable. */
export function filtrarValores(m: Metodo, values: Record<string, unknown>): Record<string, number | boolean> {
  const out: Record<string, number | boolean> = {}
  for (const [k, c] of Object.entries(CAMPOS[m])) {
    const v = values[k]
    if (c === 'bool' ? typeof v === 'boolean' : Number.isInteger(v) && (v as number) >= c[0] && (v as number) <= c[1]) {
      out[k] = v as number | boolean
    }
  }
  return out
}

const CODIGOS: Record<Metodo, string> = {
  REBA: `REBA (Hignett & McAtamney 2000). Códigos:
- trunk: 1 erecto; 2 flexión 0-20° o extensión 0-20°; 3 flexión 20-60° o extensión >20°; 4 flexión >60°. trunkT: torsión; trunkS: inclinación lateral.
- neck: 1 flexión 0-20°; 2 flexión >20° o extensión. neckT: torsión; neckS: inclinación lateral.
- legs: 1 apoyo bilateral, caminando o sentado; 2 apoyo unilateral o inestable. knee (se suma a legs): 0 rodillas con flexión <30° o sentado; 1 flexión 30-60°; 2 flexión >60° (no sentado).
- ua (brazo): 1 extensión/flexión hasta 20°; 2 extensión >20° o flexión 20-45°; 3 flexión 45-90°; 4 flexión >90°. shr: hombro elevado; abd: brazo abducido o rotado; sup: brazo apoyado o persona inclinada a favor de la gravedad.
- la (antebrazo): 1 flexión 60-100°; 2 flexión <60° o >100°.
- wrist: 1 flexión/extensión 0-15°; 2 >15°. wristT: desviación o torsión.`,
  RULA: `RULA (McAtamney & Corlett 1993). Códigos:
- ua (brazo): 1 extensión/flexión hasta 20°; 2 extensión >20° o flexión 20-45°; 3 flexión 45-90°; 4 flexión >90°. shr: hombro elevado; abd: brazo abducido; sup: brazo apoyado o persona inclinada.
- la (antebrazo): 1 flexión 60-100°; 2 flexión <60° o >100°. mid: trabaja cruzando la línea media o hacia el lado del cuerpo.
- wrist: 1 neutra; 2 flexión/extensión 0-15°; 3 >15°. wristDev: desviación radial o cubital. wristT: giro de muñeca cerca del final del rango.
- neck: 1 flexión 0-10°; 2 flexión 10-20°; 3 flexión >20°; 4 extensión. neckT: torsión; neckS: inclinación lateral.
- trunk: 1 sentado bien apoyado o erecto; 2 flexión 0-20°; 3 flexión 20-60°; 4 flexión >60°. trunkT: torsión; trunkS: inclinación lateral.
- legs: 1 piernas y pies bien apoyados y equilibrados; 2 no.`,
  OWAS: `OWAS (Karhu et al. 1977). Códigos:
- back: 1 recta; 2 doblada; 3 girada; 4 doblada y girada.
- arms: 1 ambos brazos bajo el nivel de los hombros; 2 un brazo a la altura o sobre los hombros; 3 ambos brazos a la altura o sobre los hombros.
- legs: 1 sentado; 2 de pie con ambas piernas rectas; 3 de pie con el peso en una pierna recta; 4 de pie con ambas rodillas flexionadas; 5 de pie con el peso en una pierna flexionada; 6 arrodillado (una o ambas rodillas); 7 caminando.`,
}

const SYSTEM = `Eres un asistente de ergonomía ocupacional que apoya a un médico evaluador.
Analizas fotografías de un trabajador en su puesto y propones los códigos posturales del método indicado.

Reglas:
- Si hay varias fotos, propone la postura MÁS desfavorable observada (criterio conservador).
- Usa null en cualquier campo que la foto no permita determinar con razonable seguridad (lado oculto, encuadre, ropa holgada). Nunca inventes.
- Para los modificadores booleanos usa true solo si se ve claramente; false si claramente no; null si no se puede saber.
- No evalúes peso de la carga, fuerza, agarre ni frecuencia: no son observables en una foto.
- En "hallazgos" escribe en español, en 2-5 frases, qué observas en cada segmento y qué foto respalda cada código. Menciona las limitaciones de la imagen.
- "confianza" (exactamente "alta", "media" o "baja"): alta si la vista es clara y perpendicular al plano del movimiento; media si hay estimación; baja si la imagen limita mucho la evaluación.`

let client: Anthropic | null = null

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res)
  if (!user) return
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST únicamente' })
    return
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('/api/ai/analyze: ANTHROPIC_API_KEY no configurada')
    res.status(503).json({ error: 'Análisis IA no configurado (falta ANTHROPIC_API_KEY en Vercel)' })
    return
  }

  const parsed = BodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' })
    return
  }
  const { method, photos } = parsed.data

  const content: Anthropic.Beta.BetaContentBlockParam[] = []
  for (const p of photos) {
    content.push({ type: 'text', text: `Foto: ${p.label}` })
    content.push({ type: 'image', source: { type: 'base64', media_type: p.mediaType, data: p.data } })
  }
  content.push({ type: 'text', text: `Propón los códigos posturales para ${method}.\n\n${CODIGOS[method]}` })

  try {
    client ??= new Anthropic()
    const msg = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'high', format: betaZodOutputFormat(outputSchema(method)) },
      system: SYSTEM,
      messages: [{ role: 'user', content }],
    })

    if (msg.stop_reason === 'refusal') {
      res.status(422).json({ error: 'La IA no pudo analizar estas fotos. Complete el formulario manualmente.' })
      return
    }
    const out = msg.parsed_output
    if (!out) {
      console.error('/api/ai/analyze: salida no parseable', msg.stop_reason)
      res.status(502).json({ error: 'Respuesta de la IA no válida. Intente de nuevo.' })
      return
    }

    // Lo no determinable se omite: el formulario conserva lo que el médico tenga.
    const values = filtrarValores(method, out.values as Record<string, unknown>)
    const c = out.confianza.trim().toLowerCase()
    const confidence = c === 'alta' ? 0.9 : c === 'media' ? 0.6 : 0.3
    await audit(req, user, 'ia_analizar', null, `${method} · ${photos.length} foto(s)`)
    res.status(200).json({ values, hallazgos: out.hallazgos, confidence })
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error('/api/ai/analyze: ANTHROPIC_API_KEY inválida')
      res.status(503).json({ error: 'La clave de IA configurada en Vercel no es válida' })
    } else if (err instanceof Anthropic.RateLimitError) {
      res.status(429).json({ error: 'Servicio de IA saturado. Intente en un minuto.' })
    } else if (err instanceof Anthropic.APIError) {
      console.error('/api/ai/analyze: API', err.status, err.message)
      res.status(502).json({ error: 'El servicio de IA no respondió correctamente' })
    } else {
      console.error('/api/ai/analyze', err)
      res.status(502).json({ error: 'El servicio de IA no respondió' })
    }
  }
}

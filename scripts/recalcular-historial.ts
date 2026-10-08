// Recalcula el historial de evaluaciones con las fórmulas corregidas (v3.1).
//
// Uso:
//   DATABASE_URL=... npx vite-node scripts/recalcular-historial.ts            # solo informe (no modifica nada)
//   DATABASE_URL=... npx vite-node scripts/recalcular-historial.ts --apply    # actualiza la base de datos
//
// Siempre genera recalculo-historial.csv. Con --apply, cada evaluación que cambia
// actualiza level_max, score_reba y payload.resultados, y conserva los resultados
// anteriores en payload.recalculos[] (trazabilidad médico-legal).

import { writeFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'
import { construirPayloadRecalculado, recalcularEvaluacion, type PayloadGuardado } from '../src/lib/recalculo'
import type { Method } from '../src/types/ergo'

const NIVEL = ['Inapreciable', 'Bajo', 'Medio', 'Alto', 'Muy alto']
const apply = process.argv.includes('--apply')
const url = process.env.DATABASE_URL
if (!url) {
  console.error('Falta DATABASE_URL')
  process.exit(1)
}
const sql = neon(url)

interface Fila {
  id: string
  empresa: string
  trabajador: string | null
  dni: string | null
  fecha_evaluacion: string
  metodos: Method[]
  level_max: number
  payload: PayloadGuardado
}

const filas = (await sql`
  SELECT id, empresa, trabajador, dni, fecha_evaluacion::text, metodos, level_max, payload
  FROM evaluaciones ORDER BY fecha_evaluacion, creado_en
`) as Fila[]

const csv = ['id;fecha;empresa;trabajador;dni;metodo;nivel_antes;nivel_despues;score_antes;score_despues;sube_riesgo']
const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
let conCambios = 0
let suben = 0
let errores = 0

for (const f of filas) {
  let r
  try {
    r = recalcularEvaluacion(f.payload, f.metodos)
  } catch (err) {
    errores++
    console.error(`✗ ${f.id} (${f.empresa}): ${(err as Error).message}`)
    continue
  }
  if (r.cambios.length === 0) continue
  conCambios++
  if (r.subeRiesgo) suben++

  for (const c of r.cambios) {
    csv.push([
      f.id, f.fecha_evaluacion, esc(f.empresa), esc(f.trabajador), esc(f.dni), c.metodo,
      c.nivelAntes === null ? '' : NIVEL[c.nivelAntes], NIVEL[c.nivelDespues],
      c.scoreAntes?.toFixed(2) ?? '', c.scoreDespues.toFixed(2),
      c.nivelAntes === null || c.nivelDespues > c.nivelAntes ? 'SI' : 'no',
    ].join(';'))
  }
  const marca = r.subeRiesgo ? '▲' : '·'
  console.log(`${marca} ${f.fecha_evaluacion} ${f.empresa} — ${f.trabajador ?? ''}: ` +
    r.cambios.map(c => `${c.metodo} ${c.nivelAntes ?? '?'}→${c.nivelDespues}`).join(', '))

  if (apply) {
    const payload = construirPayloadRecalculado(f.payload, r, f.level_max)
    await sql`
      UPDATE evaluaciones
      SET level_max = ${r.levelMax}, score_reba = ${r.scoreReba}, payload = ${JSON.stringify(payload)}::jsonb
      WHERE id = ${f.id}::uuid
    `
  }
}

writeFileSync('recalculo-historial.csv', '﻿' + csv.join('\n') + '\n')
console.log(`\nEvaluaciones: ${filas.length} · con cambios: ${conCambios} · suben de nivel: ${suben} · errores: ${errores}`)
console.log('Detalle: recalculo-historial.csv')
console.log(apply ? 'Base de datos actualizada.' : 'Modo informe: no se modificó nada. Use --apply para actualizar.')

import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { calcMmc } from '@/lib/calc/mmc'
import { calcNiosh } from '@/lib/calc/niosh'
import { calcOwas } from '@/lib/calc/owas'
import { calcReba } from '@/lib/calc/reba'
import { calcRula } from '@/lib/calc/rula'
import { getConclusiones } from '@/lib/informe/conclusiones'
import { getRecomendaciones } from '@/lib/informe/recomendaciones'
import { ISO_11228, REBA_RIESGO, RM_375 } from '@/lib/norma'
import { RISK_LEVEL_NAME, type RiskLevel } from '@/types/ergo'
import { useEvaluacion } from '@/store/useEvaluacion'

const RISK_COLOR: Record<RiskLevel, string> = {
  0: '#22C55E', 1: '#84CC16', 2: '#EAB308', 3: '#F97316', 4: '#EF4444',
}

export function Informe() {
  const info = useEvaluacion(s => s.info)
  const photos = useEvaluacion(s => s.photos)
  const reba = useEvaluacion(s => s.reba)
  const rula = useEvaluacion(s => s.rula)
  const owas = useEvaluacion(s => s.owas)
  const niosh = useEvaluacion(s => s.niosh)
  const mmc = useEvaluacion(s => s.mmc)

  const ri = useMemo(() => {
    const out: {
      reba?: ReturnType<typeof calcReba>
      rula?: ReturnType<typeof calcRula>
      owas?: ReturnType<typeof calcOwas>
      niosh?: ReturnType<typeof calcNiosh>
      mmc?: ReturnType<typeof calcMmc>
    } = {}
    if (info.metodos.includes('REBA')) out.reba = calcReba(reba)
    if (info.metodos.includes('RULA')) out.rula = calcRula(rula)
    if (info.metodos.includes('OWAS')) out.owas = calcOwas(owas)
    if (info.metodos.includes('NIOSH')) out.niosh = calcNiosh(niosh)
    if (info.metodos.includes('MMC')) out.mmc = calcMmc(mmc, info.sexo)
    return out
  }, [info.metodos, info.sexo, reba, rula, owas, niosh, mmc])

  const limAp = RM_375[info.sexo].general
  const isoRow = ISO_11228.find(x => x.grupo === mmc.grupo) ?? ISO_11228[0]!

  const recos = useMemo(
    () =>
      getRecomendaciones({
        reba: ri.reba ? { input: reba, result: ri.reba } : undefined,
        rula: ri.rula ? { input: rula, result: ri.rula } : undefined,
        owas: ri.owas ? { input: owas, result: ri.owas } : undefined,
        niosh: ri.niosh ? { input: niosh, result: ri.niosh } : undefined,
        mmc: ri.mmc ? { input: mmc, result: ri.mmc } : undefined,
        limAp,
      }),
    [ri, reba, rula, owas, niosh, mmc, limAp],
  )

  const conclusiones = useMemo(
    () =>
      getConclusiones({
        reba: ri.reba ? { input: reba, result: ri.reba } : undefined,
        rula: ri.rula ? { input: rula, result: ri.rula } : undefined,
        owas: ri.owas ? { input: owas, result: ri.owas } : undefined,
        niosh: ri.niosh ? { input: niosh, result: ri.niosh } : undefined,
        mmc: ri.mmc ? { input: mmc, result: ri.mmc } : undefined,
      }),
    [ri, reba, rula, owas, niosh, mmc],
  )

  const hoy = new Date().toLocaleDateString('es-PE', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const ref = `PANACEA-ERGO-${Date.now().toString(36).toUpperCase()}`
  let secNum = 0
  const next = () => ++secNum

  return (
    <article className="bg-white max-w-[800px] mx-auto p-8 lg:p-12 print:p-0 border border-ergo-cb rounded-2xl text-[13px] text-ergo-text leading-relaxed">
      {/* Header */}
      <header className="bg-gradient-to-br from-ergo-header to-ergo-orange rounded-xl p-5 mb-6 text-white flex justify-between items-center gap-4 print:rounded-none">
        <div>
          <div className="text-[10px] opacity-80 tracking-widest uppercase">PANACEA MEDICINA OCUPACIONAL</div>
          <div className="text-xl font-extrabold mt-0.5">INFORME DE EVALUACIÓN ERGONÓMICA</div>
          <div className="text-xs opacity-85 mt-1">
            {info.metodos.map(m => `Método ${m}`).join(' · ')}
          </div>
        </div>
        <div className="text-right text-[11px] opacity-90">
          <div className="font-bold">{info.evaluador}</div>
          <div>CMP 102517 · RNE/RNA 13334</div>
          <div>contacto@sermedpa.com</div>
          <div className="mt-1">{info.fecha}</div>
        </div>
      </header>

      {/* Score REBA destacado */}
      {ri.reba && (() => {
        const niv = REBA_RIESGO.find(x => ri.reba!.fin <= x.max) ?? REBA_RIESGO[4]!
        const color = RISK_COLOR[ri.reba.level]
        return (
          <div
            className="border-[3px] rounded-xl px-5 py-4 mb-6 text-center"
            style={{ borderColor: color, background: `${color}10` }}
          >
            <div className="text-[26px] font-extrabold" style={{ color }}>
              PUNTUACIÓN REBA FINAL: {ri.reba.fin} / 15
            </div>
            <div className="text-[15px] font-bold mt-1" style={{ color }}>
              NIVEL {ri.reba.level} — RIESGO {RISK_LEVEL_NAME[ri.reba.level].toUpperCase()} — {niv.accion.toUpperCase()}
            </div>
          </div>
        )
      })()}

      {/* Datos del puesto */}
      <section className="bg-ergo-bg rounded-xl p-4 mb-5">
        <div className="font-bold text-ergo-orange mb-2.5 uppercase text-[11px] tracking-wide">Datos del Puesto</div>
        <table className="w-full border-collapse text-xs">
          <tbody>
            {(
              [
                ['Empresa', info.empresa],
                ['Trabajador', info.trabajador],
                ['DNI', info.dni],
                ['Sexo', info.sexo === 'masculino' ? 'Masculino' : 'Femenino'],
                ['Cargo', info.cargo],
                ['Puesto', info.puesto],
                ['Área', info.area],
                ['Tarea', info.tarea],
                ['Evaluador', info.evaluador],
                ['Especialidad', 'Medicina Ocupacional y del Medio Ambiente — UPCH'],
                ['Fecha', info.fecha],
              ] as const
            ).map(([l, v]) => (
              <tr key={l} className="border-b border-ergo-cb">
                <td className="px-2 py-1 text-ergo-muted font-semibold w-2/5">{l}</td>
                <td className="px-2 py-1">{v || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Fotos */}
      {photos.length > 0 && (
        <section className="mb-5">
          <div className="font-bold text-ergo-orange mb-2.5 uppercase text-[11px] tracking-wide">
            Registro Fotográfico
          </div>
          <div className="flex gap-2 flex-wrap">
            {photos.map((p, i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-ergo-cb">
                <img src={p.url} alt={p.label} className="w-[120px] h-[95px] object-cover block" />
                <div className="bg-ergo-bg px-1.5 py-0.5 text-[10px] text-ergo-muted text-center">{p.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Introducción */}
      {(() => {
        const n = next()
        return (
          <Section title={`${n}. Introducción y Metodología`}>
            <p>
              La presente evaluación ergonómica fue realizada mediante {info.metodos.length > 1 ? 'los métodos' : 'el método'}{' '}
              <strong>{info.metodos.join(', ')}</strong>, herramienta(s) validada(s) internacionalmente para la valoración del
              riesgo postural en el ámbito ocupacional.
            </p>
            <p className="mt-2">
              Marco normativo aplicado: <strong>RM N° 375-2008-TR</strong> (Norma Básica de Ergonomía, Perú) e{' '}
              <strong>ISO 11228-1:2003</strong>.
            </p>
            {ri.mmc && (
              <p className="mt-1.5 text-xs text-ergo-mid">
                Límites RM 375: <strong>Varón 25 kg</strong> (entrenado 40 kg) · <strong>Mujer 15 kg</strong> (entrenada 25 kg).
                ISO 11228-1 · {mmc.grupo}: ocasional {isoRow.ocasional}kg / frecuente {isoRow.frecuente}kg /
                muy frecuente {isoRow.muyFrecuente}kg.
              </p>
            )}
          </Section>
        )
      })()}

      {/* Descripción del puesto */}
      {(() => {
        const n = next()
        return (
          <Section title={`${n}. Descripción del Puesto de Trabajo`}>
            <div className="bg-ergo-bg rounded-lg p-3 text-xs">
              <strong>Empresa:</strong> {info.empresa || '—'} · <strong>Área:</strong> {info.area || '—'} ·{' '}
              <strong>Cargo:</strong> {info.cargo || '—'} · <strong>Puesto:</strong> {info.puesto || '—'}
            </div>
            {info.tarea && (
              <p className="mt-2 text-xs">
                <strong>Tarea evaluada:</strong> {info.tarea}
              </p>
            )}
            {ri.mmc && mmc.peso > 0 && (
              <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs">
                <strong className="text-ergo-orange">Características de la carga:</strong>
                <ul className="pl-5 mt-1.5 list-disc leading-relaxed">
                  <li>Peso por unidad: <strong>{mmc.peso} kg</strong></li>
                  <li>
                    Frecuencia: <strong>{mmc.frec}</strong>
                    {mmc.frec === 'muyFrecuente' && ' (>4/min)'}
                    {mmc.frec === 'frecuente' && ' (1-4/min)'}
                  </li>
                  <li>
                    Capacitación MMC: <strong>{mmc.form === 'si' ? 'Sí' : 'No (agravante RM 375 Art.6)'}</strong>
                  </li>
                </ul>
              </div>
            )}
          </Section>
        )
      })()}

      {/* Resultados REBA */}
      {ri.reba && <RebaTabla nro={next()} input={reba} result={ri.reba} mmc={ri.mmc ? { input: mmc, result: ri.mmc } : undefined} limAp={limAp} />}

      {/* Resultados RULA */}
      {ri.rula && (
        <Section title={`${next()}. Resultados RULA`}>
          <Table head={['Segmento', 'Valor', 'Descripción']}>
            {(
              [
                ['Brazo superior (A)', rula.ua, ['-20/20°', '20-45°', '45-90°', '>90°'][rula.ua - 1]],
                ['Brazo inferior (A)', rula.la, ['60-100°', 'Fuera rango'][rula.la - 1]],
                ['Muñeca (A)', rula.wrist, ['Neutra', '0-15°', '>15°'][rula.wrist - 1]],
                ['Cuello (B)', rula.neck, ['0-10°', '10-20°', '>20°', 'Extensión'][rula.neck - 1]],
                ['Tronco (B)', rula.trunk, ['Erecto', '0-20°', '20-60°', '>60°'][rula.trunk - 1]],
                ['Score A', ri.rula.sA, 'Incluye músculo y fuerza'],
                ['Score B', ri.rula.sB, 'Incluye músculo y fuerza'],
              ] as const
            ).map(([seg, v, desc], i) => (
              <Row key={i} cells={[seg, v ?? '—', desc]} />
            ))}
            <FinalRow
              level={ri.rula.level}
              cells={['SCORE FINAL RULA', ri.rula.fin, `Score ${ri.rula.fin}`]}
            />
          </Table>
        </Section>
      )}

      {/* Resultados OWAS */}
      {ri.owas && (
        <Section title={`${next()}. Resultados OWAS`}>
          <Table head={['Dígito', 'Segmento', 'Valor', 'Descripción']}>
            <Row cells={['1°', 'Espalda', owas.back, ['', 'Recta', 'Doblada', 'Girada', 'Doblada+girada'][owas.back] ?? '—']} />
            <Row cells={['2°', 'Brazos', owas.arms, ['', 'Bajo hombros', 'Uno sobre', 'Ambos sobre'][owas.arms] ?? '—']} />
            <Row
              cells={[
                '3°', 'Piernas', owas.legs,
                ['', 'Sentado', 'De pie', 'Peso en una', 'Flex rodillas', 'Una rodilla', 'Arrodillado', 'Caminando'][owas.legs] ?? '—',
              ]}
            />
            <Row cells={['4°', 'Carga', owas.load, ['', '<10kg', '10-20kg', '>20kg'][owas.load] ?? '—']} />
            <FinalRow
              level={ri.owas.level}
              cells={[`CÓDIGO: ${ri.owas.code}`, '', `Cat.${ri.owas.cat}`, ri.owas.action]}
            />
          </Table>
        </Section>
      )}

      {/* Resultados NIOSH */}
      {ri.niosh && (
        <Section title={`${next()}. Resultados NIOSH`}>
          <Table head={['Factor', 'Valor', 'Multiplicador']}>
            <Row cells={['H — Dist. horizontal', `${niosh.H}cm`, ri.niosh.HM.toFixed(3)]} />
            <Row cells={['V — Altura vertical', `${niosh.V}cm`, ri.niosh.VM.toFixed(3)]} />
            <Row cells={['D — Desplazamiento', `${niosh.D}cm`, ri.niosh.DM.toFixed(3)]} />
            <Row cells={['A — Ángulo asimetría', `${niosh.A}°`, ri.niosh.AM.toFixed(3)]} />
            <Row cells={['F — Frecuencia', `${niosh.F}/min`, ri.niosh.FM.toFixed(3)]} />
            <Row cells={['C — Acoplamiento', niosh.coup, ri.niosh.CM.toFixed(3)]} />
            <FinalRow
              level={ri.niosh.level}
              cells={[
                `RWL = 23×HM×VM×DM×AM×FM×CM`,
                `${ri.niosh.RWL.toFixed(2)} kg`,
                `LI = ${ri.niosh.LI.toFixed(2)}`,
              ]}
            />
          </Table>
        </Section>
      )}

      {/* Resultados MMC */}
      {ri.mmc && mmc.peso > 0 && (
        <Section title={`${next()}. MMC — RM N° 375-2008-TR / ISO 11228-1`}>
          <Table>
            <Row cells={['Peso manipulado', `${mmc.peso} kg`]} />
            <Row cells={['Sexo', info.sexo === 'masculino' ? 'Masculino' : 'Femenino']} />
            <Row cells={['Grupo', mmc.grupo]} />
            <Row cells={['Frecuencia', mmc.frec]} />
            <Row cells={['Límite RM 375', `${ri.mmc.limRM} kg (entrenado: ${ri.mmc.limEnt} kg)`]} />
            <Row cells={[`Límite ISO 11228 (${mmc.frec})`, `${ri.mmc.limISO} kg`]} />
            <Row
              cells={[
                'Exceso',
                ri.mmc.exc > 0 ? `${ri.mmc.exc.toFixed(1)} kg (${ri.mmc.pct.toFixed(0)}%)` : 'Dentro del límite',
              ]}
            />
            <Row cells={['Capacitación', mmc.form === 'si' ? 'Sí' : 'No (agravante Art.6)']} />
            <Row cells={['Factores adicionales', `${ri.mmc.nF} identificados`]} />
            <FinalRow
              level={ri.mmc.level}
              cells={[
                'RESULTADO MMC',
                `RM 375: ${ri.mmc.cumRM ? '✓' : '✗'} · ISO: ${ri.mmc.cumISO ? '✓' : '✗'} · ${RISK_LEVEL_NAME[ri.mmc.level].toUpperCase()}`,
              ]}
            />
          </Table>
        </Section>
      )}

      {/* Interpretación REBA */}
      {ri.reba && (
        <Section title="Interpretación del Nivel de Riesgo REBA">
          <Table head={['Puntuación', 'Nivel', 'Riesgo', 'Acción']}>
            {(
              [
                ['1', 0, 'Inapreciable', 'No requiere acción'],
                ['2-3', 1, 'Bajo', 'Puede requerirse acción'],
                ['4-7', 2, 'Medio', 'Se requiere acción'],
                ['8-10', 3, 'Alto', 'Acción pronto'],
                ['11-15', 4, 'Muy Alto', 'ACTUACIÓN INMEDIATA'],
              ] as const
            ).map(([pts, lvl, rsk, acc]) => {
              const active = ri.reba!.level === lvl
              return (
                <tr
                  key={lvl}
                  className="border-b border-ergo-cb"
                  style={active ? { background: `${RISK_COLOR[lvl as RiskLevel]}33`, fontWeight: 700 } : undefined}
                >
                  <td className="px-2 py-1 text-center">{pts}</td>
                  <td className="px-2 py-1 text-center font-bold">{lvl}</td>
                  <td className="px-2 py-1 font-bold" style={{ color: RISK_COLOR[lvl as RiskLevel] }}>
                    {rsk}
                  </td>
                  <td className="px-2 py-1">{acc}</td>
                </tr>
              )
            })}
          </Table>
        </Section>
      )}

      {/* Recomendaciones */}
      {(() => {
        const n = next()
        return (
          <Section title={`${n}. Recomendaciones Ergonómicas`}>
            <Subsection title={`${n}.1 Medidas de Ingeniería`} items={recos.ingenieria} />
            <Subsection title={`${n}.2 Medidas Administrativas`} items={recos.administrativas} />
            <Subsection title={`${n}.3 Vigilancia Médica`} items={recos.vigilancia} />
          </Section>
        )
      })()}

      {/* Conclusiones */}
      {(() => {
        const n = next()
        return (
          <Section title={`${n}. Conclusiones`}>
            <ol className="pl-5 text-xs list-decimal leading-loose">
              {conclusiones.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ol>
          </Section>
        )
      })()}

      {/* Disclaimer */}
      <div className="bg-yellow-50 border-[1.5px] border-yellow-600 rounded-xl p-4 text-[11px] text-yellow-900 leading-relaxed mb-5">
        <div className="font-bold text-xs mb-1.5">NOTA LEGAL Y METODOLÓGICA</div>
        <p>
          <strong>Alcance:</strong> esta evaluación constituye un apoyo computacional al juicio
          clínico del médico ocupacional firmante. <strong>NO sustituye</strong> la inspección
          física del puesto de trabajo, la entrevista al trabajador, ni la medición de variables
          ambientales que pudieran aplicar (ruido, vibración, iluminación, agentes químicos).
        </p>
        <p className="mt-1.5">
          <strong>Responsabilidad:</strong> la interpretación clínica, el juicio profesional y la
          responsabilidad técnico-legal recaen <strong>exclusivamente en el evaluador firmante</strong>.
          Los valores numéricos provienen de tablas validadas internacionalmente; los hallazgos
          cualitativos y las recomendaciones han sido revisados por el médico antes de su emisión.
        </p>
        <p className="mt-1.5">
          <strong>Marco normativo:</strong> RM N° 375-2008-TR (vigente desde 28/11/2008, Norma
          Básica de Ergonomía y de Procedimiento de Evaluación de Riesgo Disergonómico) ·
          ISO 11228-1:2003 (Ergonomics — Manual handling — Lifting and carrying) ·
          Ley N° 29783 — Ley de Seguridad y Salud en el Trabajo.
        </p>
        <p className="mt-1.5">
          <strong>Herramienta:</strong> PANACEA ERGO 3.0 (código fuente auditable). Tablas:
          REBA (Hignett &amp; McAtamney, 2000), RULA (McAtamney &amp; Corlett, 1993),
          OWAS (Karhu et al., 1977), NIOSH (Waters et al., 1993).
        </p>
      </div>

      {/* Firma */}
      <Firma info={info} ri={ri} mmc={mmc} hoy={hoy} ref={ref} />
    </article>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes locales — sin re-exportar para evitar accoplamiento.
// ─────────────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <div className="font-bold text-ergo-orange text-sm mb-2.5 pb-1 border-b-2 border-ergo-orange">
        {title}
      </div>
      {children}
    </section>
  )
}

function Subsection({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="mb-3">
      <div className="font-bold text-ergo-mid text-xs mb-1.5">{title}</div>
      <ul className="pl-5 text-xs list-disc leading-relaxed">
        {items.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  )
}

function Table({
  head,
  children,
}: {
  head?: ReadonlyArray<string>
  children: React.ReactNode
}) {
  return (
    <table className="w-full border-collapse text-xs mb-2">
      {head && (
        <thead>
          <tr className="bg-ergo-orange text-white">
            {head.map((h, i) => (
              <th key={i} className="px-2 py-1.5 text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>{children}</tbody>
    </table>
  )
}

function Row({ cells }: { cells: ReadonlyArray<React.ReactNode> }) {
  return (
    <tr className="border-b border-ergo-cb">
      {cells.map((c, i) => (
        <td key={i} className="px-2 py-1">
          {c}
        </td>
      ))}
    </tr>
  )
}

function FinalRow({
  level,
  cells,
}: {
  level: RiskLevel
  cells: ReadonlyArray<React.ReactNode>
}) {
  return (
    <tr style={{ background: RISK_COLOR[level], color: 'white', fontWeight: 700 }}>
      {cells.map((c, i) => (
        <td key={i} className="px-2 py-2 text-sm">
          {c}
        </td>
      ))}
    </tr>
  )
}

function RebaTabla({
  nro,
  input,
  result,
  mmc,
  limAp,
}: {
  nro: number
  input: ReturnType<typeof useEvaluacion.getState>['reba']
  result: ReturnType<typeof calcReba>
  mmc?: { input: ReturnType<typeof useEvaluacion.getState>['mmc']; result: ReturnType<typeof calcMmc> }
  limAp: number
}) {
  const dT = input.trunk === 1 ? 'Erecto'
    : input.trunk === 2 ? 'Flexión 0-20°'
    : input.trunk === 3 ? 'Flexión 20-60°'
    : `Flexión >60°${input.trunkT ? ', con torsión' : ''}`
  const dN = input.neck === 1 ? 'Flexión 0-20°' : 'Flexión >20°, tensión suboccipital'
  const dL = input.legs === 1 ? 'Bilateral estable'
    : input.legs === 2 ? 'Unilateral'
    : input.legs === 3 ? 'Flex rodillas 30-60°' : 'Flex rodillas >60°'
  const dC = input.load === 0 ? '<5kg'
    : input.load === 1 ? '5-10kg' : `>10kg${input.shock ? ' + shock' : ''}`
  const dUA = input.ua === 1 ? '-20/20°'
    : input.ua === 2 ? '20-45°'
    : input.ua === 3 ? '45-90°, sobrecarga manguito'
    : '>90°, riesgo manguito rotador'
  const dLA = input.la === 1 ? '60-100° funcional' : 'Fuera rango, tensión bicipital'
  const dW = input.wrist === 1 ? 'Neutra 0-15°' : `>15°${input.wristT ? ' con torsión' : ''}`
  const dAg = ['Bueno', 'Regular', 'Malo — sin asas', 'Inaceptable'][input.coup]

  const niv = REBA_RIESGO.find(x => result.fin <= x.max) ?? REBA_RIESGO[4]!
  const color = RISK_COLOR[result.level]

  return (
    <Section title={`${nro}. Resultados REBA`}>
      <div className="font-bold text-xs mb-1.5 text-ergo-mid">Grupo A — Tronco, Cuello y Piernas</div>
      <Table head={['Segmento', 'Hallazgo', 'Nivel']}>
        <Row cells={['Tronco', dT, input.trunk]} />
        <Row cells={['Cuello', dN, input.neck]} />
        <Row cells={['Piernas', dL, input.legs]} />
        <Row cells={['Carga', dC, `+${input.load}${input.shock ? '+1' : ''}`]} />
        <tr style={{ background: '#D2691E33', fontWeight: 700 }}>
          <td colSpan={2} className="px-2 py-1.5">SCORE GRUPO A</td>
          <td className="px-2 py-1.5 text-center text-ergo-orange text-base">{result.sA}</td>
        </tr>
      </Table>

      <div className="font-bold text-xs mb-1.5 text-ergo-mid">Grupo B — Brazo, Antebrazo y Muñeca</div>
      <Table head={['Segmento', 'Hallazgo', 'Nivel']}>
        <Row cells={['Brazo Superior', dUA, input.ua]} />
        <Row cells={['Brazo Inferior', dLA, input.la]} />
        <Row cells={['Muñeca', dW, `${input.wrist}${input.wristT ? '+1' : ''}`]} />
        <Row cells={['Agarre', dAg, `+${input.coup}`]} />
        <tr style={{ background: '#D2691E33', fontWeight: 700 }}>
          <td colSpan={2} className="px-2 py-1.5">SCORE GRUPO B</td>
          <td className="px-2 py-1.5 text-center text-ergo-orange text-base">{result.sB}</td>
        </tr>
      </Table>

      <Table>
        <Row cells={['Tabla A', result.sA]} />
        <Row cells={['Tabla B', result.sB]} />
        <Row cells={['Tabla C', result.sC]} />
        <Row cells={[`Actividad (+${input.act})`, input.act]} />
        <FinalRow
          level={result.level}
          cells={[
            'PUNTUACIÓN REBA FINAL',
            `${result.fin}/15 — NIVEL ${result.level} — ${RISK_LEVEL_NAME[result.level].toUpperCase()}`,
          ]}
        />
      </Table>

      <div
        className="border-[1.5px] rounded-xl p-3.5 text-xs leading-relaxed"
        style={{ background: `${color}12`, borderColor: color }}
      >
        <div className="font-bold text-[13px] mb-1.5" style={{ color }}>
          Interpretación clínica — Nivel {result.level} ({niv.nivel})
        </div>
        <p>
          Puntuación <strong>{result.fin}/15</strong> — <strong>Nivel {result.level} ({niv.nivel})</strong>:{' '}
          {result.level >= 3 ? 'intervención inmediata' : 'acción correctiva requerida'}.
          Probabilidad de TME: <strong>{result.level >= 3 ? 'elevada' : 'moderada'}</strong>.
        </p>
        {result.level >= 2 && (
          <>
            <p className="mt-2"><strong>TME con mayor riesgo:</strong></p>
            <ul className="pl-5 mt-1 list-disc leading-relaxed">
              {input.trunk >= 3 && (
                <li>
                  Lumbalgia crónica / hernia discal (L4-L5, L5-S1) por flexión{' '}
                  {input.trunk === 4 ? '>60°' : '20-60°'}
                </li>
              )}
              {input.ua >= 3 && (
                <li>
                  Síndrome del manguito rotador por elevación{' '}
                  {input.ua === 4 ? '>90°' : '45-90°'}
                </li>
              )}
              {input.wrist >= 2 && (
                <li>Síndrome del túnel carpiano por desviación &gt;15°{input.wristT ? ' con torsión' : ''}</li>
              )}
              {input.legs >= 3 && <li>Condropatía rotuliana por postura en cuclillas/semisquatting</li>}
              {input.neck >= 2 && <li>Cervicalgia tensional por flexión cervical &gt;20°</li>}
            </ul>
          </>
        )}
        {mmc && mmc.input.peso > 0 && input.trunk >= 3 && (
          <div className="mt-2.5 p-2.5 bg-white rounded-lg border border-ergo-orange/30 text-xs">
            <strong className="text-ergo-orange">Marco normativo:</strong> RM 375 límite {limAp}kg en
            postura ideal. Con tronco {input.trunk === 4 ? '>60°' : '20-60°'}, el límite biomecánico se
            reduce a 10-15kg. Los {mmc.input.peso}kg representan sobrecarga relativa.
          </div>
        )}
      </div>
    </Section>
  )
}

function Firma({
  info,
  ri,
  mmc,
  hoy,
  ref: refId,
}: {
  info: ReturnType<typeof useEvaluacion.getState>['info']
  ri: {
    reba?: ReturnType<typeof calcReba>
    rula?: ReturnType<typeof calcRula>
    owas?: ReturnType<typeof calcOwas>
    niosh?: ReturnType<typeof calcNiosh>
    mmc?: ReturnType<typeof calcMmc>
  }
  mmc: ReturnType<typeof useEvaluacion.getState>['mmc']
  hoy: string
  ref: string
}) {
  // QR generado en cliente (sin dependencia de api.qrserver.com).
  const qrPayload = useMemo(
    () =>
      JSON.stringify({
        app: 'PANACEA ERGO 3.0',
        evaluador: info.evaluador,
        emp: info.empresa,
        trab: info.trabajador,
        fecha: info.fecha,
        metodos: info.metodos,
        reba: ri.reba?.fin ?? null,
        rula: ri.rula?.fin ?? null,
        owas: ri.owas?.code ?? null,
        niosh: ri.niosh?.LI.toFixed(2) ?? null,
        mmc: ri.mmc ? `${mmc.peso}kg` : null,
      }),
    [info, ri, mmc.peso],
  )
  const [qrUrl, setQrUrl] = useState<string>('')
  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(qrPayload, { width: 180, margin: 1, errorCorrectionLevel: 'M' })
      .then(url => {
        if (!cancelled) setQrUrl(url)
      })
      .catch(() => setQrUrl(''))
    return () => {
      cancelled = true
    }
  }, [qrPayload])
  const generado = new Date().toISOString().replace('T', ' ').slice(0, 19)

  return (
    <footer className="border-t-2 border-ergo-cb pt-5 flex justify-between items-end gap-4 flex-wrap">
      <div className="flex gap-3 items-end">
        <img src={qrUrl} alt="QR de verificación" width={80} height={80} className="rounded border border-ergo-cb" />
        <div className="text-[11px] text-ergo-muted leading-tight">
          <div>PANACEA ERGO 3.0</div>
          <div>Normativa: RM 375-2008-TR · ISO 11228-1</div>
          <div>Documento confidencial — uso médico ocupacional</div>
          <div className="mt-1.5 font-mono text-[10px]">Generado: {generado} UTC</div>
          <div className="text-[9px] mt-0.5">QR: datos del informe para verificación</div>
        </div>
      </div>
      <div className="text-center">
        <div className="border-t border-ergo-text pt-2 w-[260px]">
          <div className="font-extrabold text-sm">{info.evaluador}</div>
          <div className="text-[11px] text-ergo-muted">Médico Especialista en Medicina Ocupacional</div>
          <div className="text-[11px] text-ergo-muted">y del Medio Ambiente — UPCH</div>
          <div className="text-[11px] text-ergo-orange font-semibold">CMP 102517 · RNE/RNA 13334</div>
          <div className="text-[11px] text-ergo-muted">Panacea Medicina Ocupacional · Arequipa, {hoy}</div>
          <div className="text-[10px] text-ergo-muted font-mono mt-1">Ref: {refId}</div>
        </div>
      </div>
    </footer>
  )
}

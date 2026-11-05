import { useMemo } from 'react'
import { Badge, Card, Chk, Sec, Sel } from '@/components/ui'
import { calcRosa, ROSA_ACTUACION, type ROSAInput, type ROSATiempo } from '@/lib/calc/rosa'
import { useEvaluacion } from '@/store/useEvaluacion'

const TIEMPO = [
  [-1, '−1 · <1 h/día o <30 min seguidos'],
  [0, '0 · 1-4 h/día o 30-60 min seguidos'],
  [1, '+1 · >4 h/día o >1 h seguida'],
] as const

export function ROSAPanel() {
  const rosa = useEvaluacion(s => s.rosa)
  const setRosa = useEvaluacion(s => s.setRosa)
  const r = useMemo(() => calcRosa(rosa), [rosa])

  const u = <K extends keyof ROSAInput>(k: K, v: ROSAInput[K]) => setRosa({ [k]: v } as Partial<ROSAInput>)
  const t = (k: 'tSilla' | 'tPantalla' | 'tTelefono' | 'tMouse' | 'tTeclado', label: string) => (
    <Sel label={label} value={rosa[k]} onChange={v => u(k, v as ROSATiempo)} options={TIEMPO} />
  )

  return (
    <Card title="ROSA · Rapid Office Strain Assessment (puestos de oficina con pantalla)">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Sec title={`Silla · ${r.silla}`} />
          <Sel
            label="Altura del asiento" value={rosa.altura}
            onChange={v => u('altura', v as ROSAInput['altura'])}
            options={[
              [1, '1·Rodillas a ~90°'], [2, '2·Asiento muy bajo o muy alto'], [3, '3·Pies sin contacto con el suelo'],
            ] as const}
          />
          <Chk label="Espacio insuficiente para las piernas bajo la mesa (+1)" value={rosa.alturaEspacio} onChange={v => u('alturaEspacio', v)} />
          <Chk label="Altura no regulable (+1)" value={rosa.alturaNoReg} onChange={v => u('alturaNoReg', v)} />
          <Sel
            label="Profundidad del asiento" value={rosa.profundidad}
            onChange={v => u('profundidad', v as ROSAInput['profundidad'])}
            options={[[1, '1·~8 cm entre asiento y corva'], [2, '2·Asiento muy largo o muy corto']] as const}
          />
          <Chk label="Profundidad no regulable (+1)" value={rosa.profundidadNoReg} onChange={v => u('profundidadNoReg', v)} />
          <Sel
            label="Reposabrazos" value={rosa.reposabrazos}
            onChange={v => u('reposabrazos', v as ROSAInput['reposabrazos'])}
            options={[[1, '1·Codos apoyados, hombros relajados'], [2, '2·Muy altos o muy bajos (o sin reposabrazos)']] as const}
          />
          <Chk label="Demasiado separados (+1)" value={rosa.reposaSeparados} onChange={v => u('reposaSeparados', v)} />
          <Chk label="Superficie dura o dañada (+1)" value={rosa.reposaDuro} onChange={v => u('reposaDuro', v)} />
          <Chk label="No ajustables (+1)" value={rosa.reposaNoAjust} onChange={v => u('reposaNoAjust', v)} />
          <Sel
            label="Respaldo" value={rosa.respaldo}
            onChange={v => u('respaldo', v as ROSAInput['respaldo'])}
            options={[
              [1, '1·Reclinado 95-110° con apoyo lumbar'],
              [2, '2·Sin apoyo lumbar, ángulo fuera de rango o sin respaldo'],
            ] as const}
          />
          <Chk label="Mesa demasiado alta, hombros encogidos (+1)" value={rosa.respaldoMesaAlta} onChange={v => u('respaldoMesaAlta', v)} />
          <Chk label="Respaldo no ajustable (+1)" value={rosa.respaldoNoAjust} onChange={v => u('respaldoNoAjust', v)} />
          {t('tSilla', 'Tiempo de uso de la silla')}

          <Sec title={`Teléfono · ${r.telefono}`} />
          <Sel
            label="Teléfono" value={rosa.telefono}
            onChange={v => u('telefono', v as ROSAInput['telefono'])}
            options={[[1, '1·Auricular o a una mano, cuello neutro, a ≤30 cm'], [2, '2·A más de 30 cm']] as const}
          />
          <Chk label="Sujeto entre cuello y hombro (+2)" value={rosa.telefonoCuello} onChange={v => u('telefonoCuello', v)} />
          <Chk label="Sin manos libres (+1)" value={rosa.telefonoSinManos} onChange={v => u('telefonoSinManos', v)} />
          {t('tTelefono', 'Tiempo de uso del teléfono')}
        </div>

        <div>
          <Sec title={`Pantalla · ${r.pantalla}`} />
          <Sel
            label="Pantalla" value={rosa.pantalla}
            onChange={v => u('pantalla', v as ROSAInput['pantalla'])}
            options={[
              [1, '1·A 45-75 cm, borde superior a la altura de los ojos'],
              [2, '2·Muy baja (30° bajo los ojos)'],
              [3, '3·Muy alta (extensión de cuello)'],
            ] as const}
          />
          <Chk label="Desviada lateralmente, gira el cuello (+1)" value={rosa.pantallaGiro} onChange={v => u('pantallaGiro', v)} />
          <Chk label="Documentos sin atril (+1)" value={rosa.pantallaDocs} onChange={v => u('pantallaDocs', v)} />
          <Chk label="Brillos o reflejos (+1)" value={rosa.pantallaBrillos} onChange={v => u('pantallaBrillos', v)} />
          <Chk label="Muy lejos, >75 cm (+1, solo si está muy baja)" value={rosa.pantallaLejos} onChange={v => u('pantallaLejos', v)} />
          {t('tPantalla', 'Tiempo de uso de la pantalla')}

          <Sec title={`Mouse · ${r.mouse}`} />
          <Sel
            label="Mouse" value={rosa.mouse}
            onChange={v => u('mouse', v as ROSAInput['mouse'])}
            options={[[1, '1·Alineado con el hombro'], [2, '2·No alineado o lejos del cuerpo']] as const}
          />
          <Chk label="Muy pequeño, agarre en pinza (+1)" value={rosa.mousePinza} onChange={v => u('mousePinza', v)} />
          <Chk label="Mouse y teclado a diferentes alturas (+2)" value={rosa.mouseAlturas} onChange={v => u('mouseAlturas', v)} />
          <Chk label="Reposamanos duro o puntos de presión (+1)" value={rosa.mouseReposa} onChange={v => u('mouseReposa', v)} />
          {t('tMouse', 'Tiempo de uso del mouse')}

          <Sec title={`Teclado · ${r.teclado}`} />
          <Sel
            label="Teclado" value={rosa.teclado}
            onChange={v => u('teclado', v as ROSAInput['teclado'])}
            options={[[1, '1·Muñecas rectas, hombros relajados'], [2, '2·Muñecas extendidas >15°']] as const}
          />
          <Chk label="Muñecas desviadas lateralmente (+1)" value={rosa.tecladoDesv} onChange={v => u('tecladoDesv', v)} />
          <Chk label="Teclado muy alto, hombros encogidos (+1)" value={rosa.tecladoAlto} onChange={v => u('tecladoAlto', v)} />
          <Chk label="Alcanza objetos lejanos o sobre la cabeza (+1)" value={rosa.tecladoAlcance} onChange={v => u('tecladoAlcance', v)} />
          <Chk label="Teclado o plataforma no ajustables (+1)" value={rosa.tecladoNoAjust} onChange={v => u('tecladoNoAjust', v)} />
          {t('tTeclado', 'Tiempo de uso del teclado')}
        </div>
      </div>
      <Badge level={r.level} text={`ROSA ${r.fin}/10 · ${ROSA_ACTUACION[r.nivelActuacion].riesgo}`} />
      <div className="text-xs text-ergo-muted mt-1">
        Silla {r.silla} · Pantalla-teléfono {r.pantallaTelefono} · Mouse-teclado {r.mouseTeclado} · Periféricos {r.perifericos} ·{' '}
        {ROSA_ACTUACION[r.nivelActuacion].accion}
      </div>
    </Card>
  )
}

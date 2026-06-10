import { Card } from '@/components/ui'
import { Nav } from '@/components/wizard/Nav'
import type { Method } from '@/types/ergo'
import { useEvaluacion } from '@/store/useEvaluacion'

const METHODS: Method[] = ['REBA', 'RULA', 'OWAS', 'NIOSH', 'MMC']

const FIELDS: ReadonlyArray<['empresa' | 'trabajador' | 'dni' | 'cargo' | 'puesto' | 'area' | 'tarea' | 'evaluador', string]> = [
  ['empresa', 'Empresa / Cliente'],
  ['trabajador', 'Trabajador'],
  ['dni', 'DNI'],
  ['cargo', 'Cargo'],
  ['puesto', 'Puesto de Trabajo'],
  ['area', 'Área / Sección'],
  ['tarea', 'Tarea Evaluada'],
  ['evaluador', 'Evaluador'],
]

const inputClass =
  'w-full px-3 py-2 border border-ergo-cb rounded-lg bg-ergo-inp text-[13px] text-ergo-text focus:outline-none focus:border-ergo-orange'

export function Step0Datos() {
  const info = useEvaluacion(s => s.info)
  const setInfo = useEvaluacion(s => s.setInfo)
  const toggleMethod = useEvaluacion(s => s.toggleMethod)
  const setStep = useEvaluacion(s => s.setStep)

  const canNext = info.empresa.trim().length > 0 && info.metodos.length > 0

  return (
    <Card title="📋 Datos del Puesto de Trabajo">
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(([k, label]) => (
          <div key={k}>
            <div className="text-[11px] text-ergo-muted mb-1 font-semibold">{label}</div>
            <input
              value={info[k]}
              onChange={e => setInfo({ [k]: e.target.value })}
              className={inputClass}
            />
          </div>
        ))}
        <div>
          <div className="text-[11px] text-ergo-muted mb-1 font-semibold">Sexo</div>
          <select
            value={info.sexo}
            onChange={e => setInfo({ sexo: e.target.value as 'masculino' | 'femenino' })}
            className={inputClass}
          >
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
          </select>
        </div>
        <div>
          <div className="text-[11px] text-ergo-muted mb-1 font-semibold">Fecha</div>
          <input
            type="date"
            value={info.fecha}
            onChange={e => setInfo({ fecha: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[11px] text-ergo-muted mb-2 font-bold uppercase tracking-wide">
          Métodos a aplicar:
        </div>
        <div className="flex gap-2.5 flex-wrap">
          {METHODS.map(m => {
            const active = info.metodos.includes(m)
            return (
              <button
                key={m}
                onClick={() => toggleMethod(m)}
                className={`px-5 py-2 rounded-full border-2 font-bold text-sm transition-all ${
                  active
                    ? 'bg-gradient-to-br from-ergo-header to-ergo-orange text-white border-transparent shadow-[0_3px_10px_rgba(210,105,30,0.3)]'
                    : 'bg-white text-ergo-mid border-ergo-cb hover:border-ergo-orange'
                }`}
              >
                {m}
                {m === 'MMC' ? ' ⚖️' : ''}
              </button>
            )
          })}
        </div>
      </div>

      <Nav
        onNext={() => setStep(1)}
        nextLabel="Siguiente: Fotos →"
        nextDisabled={!canNext}
      />
    </Card>
  )
}

import { useEvaluacion } from '@/store/useEvaluacion'

export function Header() {
  const resetAll = useEvaluacion(s => s.resetAll)
  const onNew = () => {
    if (
      confirm(
        '¿Iniciar una nueva evaluación? Se borrarán los datos actuales (incluyendo fotos). Imprime o exporta el informe antes si lo necesitas.',
      )
    ) {
      resetAll()
    }
  }
  return (
    <div className="bg-gradient-to-br from-ergo-header to-ergo-orange rounded-2xl px-6 py-5 mb-5 shadow-[0_4px_20px_rgba(139,69,19,0.3)] flex justify-between items-start gap-3">
      <div>
        <div className="text-[11px] text-white/75 font-semibold tracking-widest uppercase mb-1">
          PANACEA MEDICINA OCUPACIONAL
        </div>
        <div className="text-[22px] font-extrabold text-white leading-tight mb-1">
          ERGO — Evaluación Ergonómica Integral
        </div>
        <div className="text-xs text-white/80">
          Dr. W. Ochoa Cuadros · CMP 102517 · RNE/RNA 13334
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className="bg-white/15 rounded-xl px-3.5 py-2 text-center">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-white font-semibold">Autoguardado</span>
          </div>
          <div className="text-[10px] text-white/70 mt-0.5">REBA·RULA·OWAS·NIOSH·MMC</div>
        </div>
        <button
          onClick={onNew}
          className="text-[11px] text-white/80 hover:text-white underline"
          title="Borra la evaluación actual y empieza de cero"
        >
          + Nueva evaluación
        </button>
      </div>
    </div>
  )
}

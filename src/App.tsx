import { useState } from 'react'
import { MMCPanel, NIOSHPanel, OWASPanel, REBAPanel, RULAPanel } from '@/components/panels'
import type { Method } from '@/types/ergo'
import { useEvaluacion } from '@/store/useEvaluacion'

const METHODS: Method[] = ['REBA', 'RULA', 'OWAS', 'NIOSH', 'MMC']

export function App() {
  const [active, setActive] = useState<Method>('REBA')
  const sexo = useEvaluacion(s => s.info.sexo)
  const setInfo = useEvaluacion(s => s.setInfo)

  return (
    <main className="min-h-screen p-5 max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-ergo-header to-ergo-orange rounded-2xl p-5 mb-5 shadow-[0_4px_20px_rgba(139,69,19,0.3)] flex justify-between items-start gap-3">
        <div>
          <div className="text-[11px] text-white/75 font-semibold tracking-widest uppercase mb-1">
            PANACEA MEDICINA OCUPACIONAL
          </div>
          <div className="text-[20px] font-extrabold text-white leading-tight">
            ERGO v3 — Demo F4 (paneles + Zustand)
          </div>
          <div className="text-xs text-white/80 mt-1">
            Dr. W. Ochoa Cuadros · CMP 102517 · RNE/RNA 13334
          </div>
        </div>
        <div className="bg-white/15 rounded-lg px-3 py-2 text-center">
          <div className="text-[10px] text-white/80">Sexo del trabajador</div>
          <select
            value={sexo}
            onChange={e => setInfo({ sexo: e.target.value as 'masculino' | 'femenino' })}
            className="bg-white/0 text-white font-bold text-sm border-0 focus:outline-none cursor-pointer"
          >
            <option value="masculino" className="text-ergo-text">Masculino</option>
            <option value="femenino" className="text-ergo-text">Femenino</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {METHODS.map(m => {
          const isActive = active === m
          return (
            <button
              key={m}
              onClick={() => setActive(m)}
              className={`px-5 py-2.5 rounded-full font-bold text-sm border-2 transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-ergo-header to-ergo-orange text-white border-transparent shadow-[0_3px_12px_rgba(210,105,30,0.35)]'
                  : 'bg-white text-ergo-mid border-ergo-cb hover:border-ergo-orange'
              }`}
            >
              {m}
              {m === 'MMC' ? ' ⚖️' : ''}
            </button>
          )
        })}
      </div>

      {active === 'REBA' && <REBAPanel />}
      {active === 'RULA' && <RULAPanel />}
      {active === 'OWAS' && <OWASPanel />}
      {active === 'NIOSH' && <NIOSHPanel />}
      {active === 'MMC' && <MMCPanel />}

      <div className="mt-6 text-center text-[11px] text-ergo-muted">
        Estado en Zustand · cálculos memoizados · cambios en un panel no re-renderizan los otros
      </div>
    </main>
  )
}

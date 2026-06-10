import { create } from 'zustand'
import type { Method, Sexo } from '@/types/ergo'
import type { REBAInput } from '@/lib/calc/reba'
import type { RULAInput } from '@/lib/calc/rula'
import type { OWASInput } from '@/lib/calc/owas'
import type { NIOSHInput } from '@/lib/calc/niosh'
import type { MMCInput } from '@/lib/calc/mmc'

export interface EvaluacionInfo {
  empresa: string
  trabajador: string
  dni: string
  sexo: Sexo
  cargo: string
  puesto: string
  area: string
  tarea: string
  fecha: string
  evaluador: string
  metodos: Method[]
}

export const DEFAULT_INFO: EvaluacionInfo = {
  empresa: '',
  trabajador: '',
  dni: '',
  sexo: 'masculino',
  cargo: '',
  puesto: '',
  area: '',
  tarea: '',
  fecha: new Date().toISOString().slice(0, 10),
  evaluador: 'Dr. Wenceslao Ochoa Cuadros',
  metodos: [],
}

export const DEFAULT_REBA: REBAInput = {
  neck: 1, neckT: false, neckS: false,
  trunk: 1, trunkT: false, trunkS: false,
  legs: 1, load: 0, shock: false,
  ua: 1, shr: false, abd: false, sup: false,
  la: 1, wrist: 1, wristT: false,
  coup: 0, act: 0,
}

export const DEFAULT_RULA: RULAInput = {
  ua: 1, shr: false, sup: false,
  la: 1, mid: false,
  wrist: 1, wristT: false,
  mA: 0, fA: 0,
  neck: 1, neckT: false, neckS: false,
  trunk: 1, trunkT: false, trunkS: false,
  legs: 1, mB: 0, fB: 0,
}

export const DEFAULT_OWAS: OWASInput = { back: 1, arms: 1, legs: 1, load: 1 }

export const DEFAULT_NIOSH: NIOSHInput = {
  L: 0, H: 25, V: 75, D: 25, A: 0, F: 1, dur: '2-8h', coup: 'good',
}

export const DEFAULT_MMC: MMCInput = {
  peso: 0,
  grupo: 'Varón adulto (18-45 años)',
  frec: 'frecuente',
  form: 'no',
  factores: [],
}

interface State {
  info: EvaluacionInfo
  reba: REBAInput
  rula: RULAInput
  owas: OWASInput
  niosh: NIOSHInput
  mmc: MMCInput
}

interface Actions {
  setInfo: (patch: Partial<EvaluacionInfo>) => void
  toggleMethod: (m: Method) => void
  setReba: (patch: Partial<REBAInput>) => void
  setRula: (patch: Partial<RULAInput>) => void
  setOwas: (patch: Partial<OWASInput>) => void
  setNiosh: (patch: Partial<NIOSHInput>) => void
  setMmc: (patch: Partial<MMCInput>) => void
  resetReba: () => void
  resetRula: () => void
  resetOwas: () => void
  resetNiosh: () => void
  resetMmc: () => void
}

export type EvaluacionStore = State & Actions

export const useEvaluacion = create<EvaluacionStore>(set => ({
  info: DEFAULT_INFO,
  reba: DEFAULT_REBA,
  rula: DEFAULT_RULA,
  owas: DEFAULT_OWAS,
  niosh: DEFAULT_NIOSH,
  mmc: DEFAULT_MMC,

  setInfo: patch => set(s => ({ info: { ...s.info, ...patch } })),
  toggleMethod: m =>
    set(s => ({
      info: {
        ...s.info,
        metodos: s.info.metodos.includes(m)
          ? s.info.metodos.filter(x => x !== m)
          : [...s.info.metodos, m],
      },
    })),

  setReba: patch => set(s => ({ reba: { ...s.reba, ...patch } })),
  setRula: patch => set(s => ({ rula: { ...s.rula, ...patch } })),
  setOwas: patch => set(s => ({ owas: { ...s.owas, ...patch } })),
  setNiosh: patch => set(s => ({ niosh: { ...s.niosh, ...patch } })),
  setMmc: patch => set(s => ({ mmc: { ...s.mmc, ...patch } })),

  resetReba: () => set({ reba: DEFAULT_REBA }),
  resetRula: () => set({ rula: DEFAULT_RULA }),
  resetOwas: () => set({ owas: DEFAULT_OWAS }),
  resetNiosh: () => set({ niosh: DEFAULT_NIOSH }),
  resetMmc: () => set({ mmc: DEFAULT_MMC }),
}))

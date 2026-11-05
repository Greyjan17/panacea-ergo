import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
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
  /** Consentimiento informado del trabajador para analizar sus fotos con IA (Ley 29733). */
  consentimientoIA?: boolean
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
  consentimientoIA: false,
}

export const DEFAULT_REBA: REBAInput = {
  neck: 1, neckT: false, neckS: false,
  trunk: 1, trunkT: false, trunkS: false,
  legs: 1, knee: 0, load: 0, shock: false,
  ua: 1, shr: false, abd: false, sup: false,
  la: 1, wrist: 1, wristT: false,
  coup: 0, act: 0, actStatic: false, actRepeat: false, actRapid: false,
}

export const DEFAULT_RULA: RULAInput = {
  ua: 1, shr: false, abd: false, sup: false,
  la: 1, mid: false,
  wrist: 1, wristDev: false, wristT: false,
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
  gestante: false,
}

export interface Photo {
  /** dataURL JPEG/PNG (comprimida a max 800px) */
  url: string
  name: string
  /** Lateral / Anterior / Posterior / Adicional N */
  label: string
}

export type Step = 0 | 1 | 2 | 3 | 4

interface State {
  step: Step
  info: EvaluacionInfo
  photos: Photo[]
  reba: REBAInput
  rula: RULAInput
  owas: OWASInput
  niosh: NIOSHInput
  mmc: MMCInput
}

interface Actions {
  setStep: (s: Step) => void
  setInfo: (patch: Partial<EvaluacionInfo>) => void
  toggleMethod: (m: Method) => void
  addPhoto: (p: Photo) => void
  removePhoto: (idx: number) => void
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
  resetAll: () => void
}

export type EvaluacionStore = State & Actions

/** Vigencia del borrador local: contiene datos personales (nombre, DNI). */
export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000

/**
 * localStorage con caducidad: el borrador se descarta pasadas DRAFT_TTL_MS
 * desde el último guardado, para no dejar datos del trabajador indefinidamente
 * en equipos compartidos.
 */
export const expiringLocalStorage: StateStorage = {
  getItem: name => {
    const raw = localStorage.getItem(name)
    if (raw === null) return null
    try {
      const wrapped = JSON.parse(raw) as { savedAt?: unknown; value?: unknown }
      if (typeof wrapped.savedAt === 'number' && typeof wrapped.value === 'string') {
        if (Date.now() - wrapped.savedAt > DRAFT_TTL_MS) {
          localStorage.removeItem(name)
          return null
        }
        return wrapped.value
      }
    } catch {
      return null
    }
    return raw // formato anterior sin fecha: se reescribe con fecha en el próximo guardado
  },
  setItem: (name, value) => {
    localStorage.setItem(name, JSON.stringify({ savedAt: Date.now(), value }))
  },
  removeItem: name => localStorage.removeItem(name),
}

/**
 * Estado persistente en localStorage (caduca a las 24 h, ver expiringLocalStorage):
 *  - info, step, métodos, inputs de cada método
 *  - NO se persisten las photos (dataURLs JPEG pueden ocupar varios MB
 *    y romper la cuota de 5MB de localStorage).
 */
export const useEvaluacion = create<EvaluacionStore>()(
  persist(
    set => ({
  step: 0,
  info: DEFAULT_INFO,
  photos: [],
  reba: DEFAULT_REBA,
  rula: DEFAULT_RULA,
  owas: DEFAULT_OWAS,
  niosh: DEFAULT_NIOSH,
  mmc: DEFAULT_MMC,

  setStep: s => set({ step: s }),
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
  addPhoto: p => set(s => ({ photos: [...s.photos, p] })),
  removePhoto: idx => set(s => ({ photos: s.photos.filter((_, i) => i !== idx) })),

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
  resetAll: () =>
    set({
      step: 0,
      info: DEFAULT_INFO,
      photos: [],
      reba: DEFAULT_REBA,
      rula: DEFAULT_RULA,
      owas: DEFAULT_OWAS,
      niosh: DEFAULT_NIOSH,
      mmc: DEFAULT_MMC,
    }),
    }),
    {
      name: 'panacea-ergo-evaluacion-v1',
      storage: createJSONStorage(() => expiringLocalStorage),
      partialize: state => ({
        step: state.step,
        info: state.info,
        reba: state.reba,
        rula: state.rula,
        owas: state.owas,
        niosh: state.niosh,
        mmc: state.mmc,
      }),
      version: 1,
    },
  ),
)

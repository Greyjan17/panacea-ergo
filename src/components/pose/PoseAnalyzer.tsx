// Placeholder del análisis pose con MediaPipe.
// El bundle de MediaPipe (~5 MB) se importará aquí en F5b.
// Por ahora valida que el code splitting de Vite separa este chunk correctamente.

import type { Method } from '@/types/ergo'

interface Props {
  method: Method
}

export function PoseAnalyzer({ method }: Props) {
  return (
    <div className="text-center py-6 px-4 bg-emerald-50 border border-emerald-200 rounded-xl">
      <div className="text-3xl mb-2">📐</div>
      <p className="text-sm text-emerald-800 font-semibold mb-1">
        PoseAnalyzer cargado dinámicamente (chunk separado)
      </p>
      <p className="text-xs text-emerald-700">
        Próxima entrega F5b: integración real de MediaPipe Pose para método {method}.
      </p>
    </div>
  )
}

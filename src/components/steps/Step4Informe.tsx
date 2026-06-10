import { Btn, Card } from '@/components/ui'
import { Nav } from '@/components/wizard/Nav'
import { useEvaluacion } from '@/store/useEvaluacion'

export function Step4Informe() {
  const setStep = useEvaluacion(s => s.setStep)
  const info = useEvaluacion(s => s.info)

  return (
    <Card title="📄 Informe Imprimible">
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-5 text-sm text-yellow-900 leading-relaxed">
        <strong>F6 entregará:</strong> el informe profesional imprimible idéntico al v2.1
        — encabezado, datos del puesto, tablas REBA/RULA/OWAS/NIOSH/MMC,
        recomendaciones dinámicas (ingeniería + administrativas + vigilancia),
        firma con CMP/RNA, QR de verificación y disclaimer legal.
      </div>

      <div className="mt-4 text-xs text-ergo-muted">
        Por ahora, datos capturados: <strong>{info.empresa || '—'}</strong> · trabajador{' '}
        <strong>{info.trabajador || '—'}</strong> · {info.metodos.length} método(s) activo(s).
      </div>

      <div className="mt-4 flex gap-2">
        <Btn label="🖨 Imprimir (placeholder)" onClick={() => window.print()} />
        <Btn label="← Volver a Resultados" variant="outline" onClick={() => setStep(3)} />
      </div>

      <Nav onBack={() => setStep(3)} />
    </Card>
  )
}

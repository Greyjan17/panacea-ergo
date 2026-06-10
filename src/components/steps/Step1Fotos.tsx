import { useRef } from 'react'
import { Card } from '@/components/ui'
import { Nav } from '@/components/wizard/Nav'
import { compressImage } from '@/lib/photos/compress'
import { useEvaluacion } from '@/store/useEvaluacion'

const PRESET_LABELS = ['Lateral', 'Anterior', 'Posterior'] as const

export function Step1Fotos() {
  const photos = useEvaluacion(s => s.photos)
  const addPhoto = useEvaluacion(s => s.addPhoto)
  const removePhoto = useEvaluacion(s => s.removePhoto)
  const setStep = useEvaluacion(s => s.setStep)
  const fileRef = useRef<HTMLInputElement>(null)

  const onSelectFiles = async (files: FileList | null) => {
    if (!files) return
    const start = photos.length
    for (let i = 0; i < files.length; i++) {
      const file = files[i]!
      const url = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload = ev => res(String(ev.target?.result ?? ''))
        r.onerror = () => rej(new Error('No se pudo leer el archivo'))
        r.readAsDataURL(file)
      })
      const compressed = await compressImage(url).catch(() => url)
      const idx = start + i
      const label =
        idx < PRESET_LABELS.length ? PRESET_LABELS[idx]! : `Adicional ${idx + 1}`
      addPhoto({ url: compressed, name: file.name, label })
    }
  }

  return (
    <Card title="📸 Fotografías del Puesto">
      <p className="text-ergo-muted text-[13px] mb-3.5">
        Sube fotos del trabajador — la IA y MediaPipe Pose las analizarán en el paso siguiente.
      </p>

      <button
        onClick={() => fileRef.current?.click()}
        className="w-full border-2 border-dashed border-ergo-orange/50 rounded-xl py-8 text-center bg-orange-50/40 hover:bg-orange-50 transition-colors mb-3.5"
      >
        <div className="text-3xl mb-2">📷</div>
        <div className="font-bold text-ergo-orange text-[15px]">
          Subir fotos del trabajador
        </div>
        <div className="text-xs text-ergo-muted mt-1">
          Lateral · Anterior · Posterior · JPG · PNG · WEBP
        </div>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => {
          void onSelectFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {photos.length > 0 && (
        <div className="flex gap-2.5 flex-wrap">
          {photos.map((p, i) => (
            <div key={`${i}-${p.name}`} className="relative rounded-lg overflow-hidden border-[3px] border-ergo-orange">
              <img src={p.url} alt={p.label} className="w-[120px] h-[120px] object-cover block" />
              <div className="bg-ergo-header/85 px-2 py-1 text-[11px] text-white font-bold text-center">
                {p.label}
              </div>
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500 text-white font-bold text-xs leading-none"
                title="Eliminar"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <Nav
        onBack={() => setStep(0)}
        onNext={() => setStep(2)}
        nextLabel="Siguiente: Evaluación →"
      />
    </Card>
  )
}

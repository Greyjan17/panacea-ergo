// Dibujo del esqueleto detectado sobre la imagen original.
// Devuelve un dataURL JPEG listo para mostrar o incluir en el informe.

import { SKELETON_CONNECTIONS, type Landmark } from './types'

export interface DrawSkeletonOpts {
  /** Color de las líneas del esqueleto. */
  strokeColor?: string
  /** Color de los puntos articulares. */
  jointColor?: string
  /** Visibility mínima para dibujar un landmark. */
  minVisibility?: number
  /** Calidad del JPEG resultante (0..1). */
  quality?: number
}

export async function drawSkeleton(
  imageUrl: string,
  landmarks: ReadonlyArray<Landmark>,
  opts: DrawSkeletonOpts = {},
): Promise<string> {
  const strokeColor = opts.strokeColor ?? '#00FF88'
  const jointColor = opts.jointColor ?? '#FF4444'
  const minVis = opts.minVisibility ?? 0.5
  const quality = opts.quality ?? 0.85

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2D no disponible'))
        return
      }

      ctx.drawImage(img, 0, 0)
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = Math.max(2, img.width / 200)

      for (const [a, b] of SKELETON_CONNECTIONS) {
        const pa = landmarks[a]
        const pb = landmarks[b]
        if (!pa || !pb || pa.visibility < minVis || pb.visibility < minVis) continue
        ctx.beginPath()
        ctx.moveTo(pa.x * img.width, pa.y * img.height)
        ctx.lineTo(pb.x * img.width, pb.y * img.height)
        ctx.stroke()
      }

      const r = Math.max(3, img.width / 150)
      for (const p of landmarks) {
        if (p.visibility < minVis) continue
        ctx.beginPath()
        ctx.arc(p.x * img.width, p.y * img.height, r, 0, 2 * Math.PI)
        ctx.fillStyle = jointColor
        ctx.fill()
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = Math.max(2, img.width / 200)
      }

      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = imageUrl
  })
}

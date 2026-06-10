// Carga dinámica del modelo @mediapipe/pose desde CDN.
// El SDK se carga vía <script> porque no es ESM-friendly. Se cachea el promise.

import type { Landmark } from './types'

const MEDIAPIPE_VERSION = '0.5.1675469404'
const SCRIPT_URLS = [
  `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${MEDIAPIPE_VERSION}/pose.js`,
]
const ASSET_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${MEDIAPIPE_VERSION}/`

interface PoseResults {
  poseLandmarks?: Landmark[]
}

interface PoseInstance {
  setOptions: (opts: {
    modelComplexity?: 0 | 1 | 2
    smoothLandmarks?: boolean
    enableSegmentation?: boolean
    minDetectionConfidence?: number
    minTrackingConfidence?: number
  }) => void
  onResults: (cb: (res: PoseResults) => void) => void
  send: (input: { image: HTMLCanvasElement | HTMLImageElement }) => Promise<void>
  close: () => void
}

interface PoseConstructor {
  new (cfg: { locateFile: (file: string) => string }): PoseInstance
}

declare global {
  interface Window {
    Pose?: PoseConstructor
  }
}

let loaderPromise: Promise<PoseConstructor> | null = null

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.crossOrigin = 'anonymous'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`No se pudo cargar ${src}`))
    document.head.appendChild(s)
  })
}

export function loadMediaPipePose(): Promise<PoseConstructor> {
  if (loaderPromise) return loaderPromise
  loaderPromise = (async () => {
    for (const url of SCRIPT_URLS) {
      await loadScript(url)
    }
    if (!window.Pose) {
      throw new Error('MediaPipe Pose no quedó disponible tras la carga')
    }
    return window.Pose
  })().catch(err => {
    loaderPromise = null
    throw err
  })
  return loaderPromise
}

/**
 * Detecta landmarks en una imagen dada (dataURL).
 * Lanza si MediaPipe no encuentra una persona con confianza suficiente.
 */
export async function detectLandmarks(imageUrl: string): Promise<Landmark[]> {
  const PoseCtor = await loadMediaPipePose()
  const pose = new PoseCtor({ locateFile: (file: string) => `${ASSET_BASE}${file}` })
  pose.setOptions({
    modelComplexity: 2,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })

  try {
    const landmarks = await new Promise<Landmark[]>((resolve, reject) => {
      const timeout = window.setTimeout(
        () => reject(new Error('Timeout esperando a MediaPipe Pose')),
        30000,
      )
      pose.onResults((res: PoseResults) => {
        window.clearTimeout(timeout)
        if (!res.poseLandmarks || res.poseLandmarks.length < 33) {
          reject(new Error('No se detectó persona en la imagen'))
          return
        }
        resolve(res.poseLandmarks)
      })

      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas 2D no disponible'))
          return
        }
        ctx.drawImage(img, 0, 0)
        try {
          await pose.send({ image: canvas })
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)))
        }
      }
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
      img.src = imageUrl
    })
    return landmarks
  } finally {
    pose.close()
  }
}

// Tipos para landmarks de MediaPipe Pose (BlazePose GHUM 3D, complexity 2).

export interface Landmark {
  /** Coordenada normalizada 0..1 (X = ancho de imagen). */
  x: number
  /** Coordenada normalizada 0..1 (Y = alto de imagen, hacia abajo). */
  y: number
  /** Profundidad estimada (no normalizada igual que x/y). */
  z?: number
  /** Confianza 0..1 del modelo. */
  visibility: number
}

/** Índices de los 33 landmarks de MediaPipe Pose. */
export const PL = {
  NOSE: 0,
  LEFT_EYE: 2,
  RIGHT_EYE: 5,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const

/** Conexiones del esqueleto para dibujo. */
export const SKELETON_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER],
  [PL.LEFT_SHOULDER, PL.LEFT_ELBOW],
  [PL.LEFT_ELBOW, PL.LEFT_WRIST],
  [PL.RIGHT_SHOULDER, PL.RIGHT_ELBOW],
  [PL.RIGHT_ELBOW, PL.RIGHT_WRIST],
  [PL.LEFT_SHOULDER, PL.LEFT_HIP],
  [PL.RIGHT_SHOULDER, PL.RIGHT_HIP],
  [PL.LEFT_HIP, PL.RIGHT_HIP],
  [PL.LEFT_HIP, PL.LEFT_KNEE],
  [PL.LEFT_KNEE, PL.LEFT_ANKLE],
  [PL.RIGHT_HIP, PL.RIGHT_KNEE],
  [PL.RIGHT_KNEE, PL.RIGHT_ANKLE],
  [PL.NOSE, PL.LEFT_SHOULDER],
  [PL.NOSE, PL.RIGHT_SHOULDER],
]

/** Ángulos medidos consolidados de una postura. */
export interface PoseAngles {
  /** Flexión de tronco respecto a la vertical (°). */
  trunk: number
  /** Flexión cervical (°). */
  neck: number
  /** Brazo superior — peor lado (°). */
  ua: number
  /** Brazo superior izquierdo (°). */
  uaL: number
  /** Brazo superior derecho (°). */
  uaR: number
  /** Antebrazo — ángulo en el codo (°). */
  la: number
  /** Desviación de muñeca (°). */
  wrist: number
  /** Rodilla — peor lado (menor = más flexión, °). */
  knee: number
  kneeL: number
  kneeR: number
}

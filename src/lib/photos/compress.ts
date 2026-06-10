/**
 * Comprime una imagen (dataURL) a un máximo de N píxeles por lado, JPEG calidad configurable.
 * Pure DOM API — fácil de testear en jsdom si se necesita en el futuro.
 */
export function compressImage(url: string, maxSide = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.onload = () => {
      let { width: w, height: h } = img
      if (w > maxSide || h > maxSide) {
        if (w > h) {
          h = Math.round((h * maxSide) / w)
          w = maxSide
        } else {
          w = Math.round((w * maxSide) / h)
          h = maxSide
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas no disponible'))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = url
  })
}

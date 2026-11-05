// Il campione di una trama per i fogli della casa: un canvas piccolo per (colore, trama), disegnato una volta. Torna un url.
import { disegnaTrama } from '../scena3d/trame-pure.js'

const campioni = {}
export function campioneTrama(colore, trama) {
  const k = colore + trama
  if (!campioni[k] && typeof document !== 'undefined') {
    const cv = document.createElement('canvas'); cv.width = cv.height = 48
    disegnaTrama(cv.getContext('2d'), 48, colore, trama); campioni[k] = cv.toDataURL()
  }
  return campioni[k]
}

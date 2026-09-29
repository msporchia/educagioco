// canvas alla risoluzione vera, coordinate portate a un mondo fisso 100×100: un pittore non legge mai canvas.width (vedi docs/apprendimento/quiz-moduli.md). Pennello condiviso con grafica/tela.js (castello).
import { pennello } from '../../grafica/tela.js'

export const LATO = 100

// una scena senza pittore lascia il riquadro vuoto: meglio di un gioco morto
export function dipingi(canvas, pittori, scena, { fondo = null } = {}) {
  const lato = Math.max(1, Math.round(canvas.clientWidth || canvas.width || 120))
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1
  canvas.width = Math.floor(lato * dpr)
  canvas.height = Math.floor(lato * dpr)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, lato, lato)
  if (fondo) { ctx.fillStyle = fondo; ctx.fillRect(0, 0, lato, lato) }

  const s = lato / LATO
  ctx.scale(s, s)
  const p = pennello(ctx, { W: LATO, H: LATO, S: 1 })
  const pittore = pittori?.[scena?.che]
  if (pittore) pittore(p, scena)
  return p
}

/* La faccia di una merce per i pezzi di HTML sopra la scena (il «+1» che vola): una tela col pezzo dell'atlante della fattoria di
   sempre, come `viste/Faccia.vue` ma senza Vue. Torna null se la merce aspetta il suo disegno (allora vale l'emoji). Una sola
   immagine per tutti, caricata alla prima richiesta. Vedi docs/fattoria3d/merci-e-ricette.md. */
import { ATLANTE, PEZZI } from '../../fattoria/dati/atlante.js'
import { pezzoDi } from '../dati/ricette.js'

let immagine = null
const aspettano = []

function carica() {
  if (immagine) return immagine
  immagine = new Image()
  immagine.onload = () => { for (const f of aspettano.splice(0)) f() }
  immagine.src = ATLANTE
  return immagine
}

/** Una tela lato×lato con la merce `k`, o null se non ha il disegno. La tela si riempie appena l'immagine c'è. */
export function tela(k, lato = 28) {
  const nome = pezzoDi(k), p = nome && PEZZI[nome]
  if (!p || typeof document === 'undefined') return null
  const dpr = Math.min(3, Math.max(1, Math.round(globalThis.devicePixelRatio || 1)))
  const c = document.createElement('canvas')
  c.width = c.height = lato * dpr
  c.style.cssText = `width:${lato}px;height:${lato}px;image-rendering:pixelated;vertical-align:middle;margin-right:3px`
  const disegna = () => {
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false
    let z = Math.min(c.width / p[2], c.height / p[3])
    if (z >= 2) z = Math.floor(z)
    const w = Math.round(p[2] * z), h = Math.round(p[3] * z)
    g.drawImage(immagine, p[0], p[1], p[2], p[3], Math.round((c.width - w) / 2), Math.round(c.height - h), w, h)
  }
  const img = carica()
  if (img.complete && img.naturalWidth) disegna(); else aspettano.push(disegna)
  return c
}

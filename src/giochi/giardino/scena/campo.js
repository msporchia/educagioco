// Il campo del giardino: disegna una Partita (il motore) sul canvas. Non conosce
// le regole né i prezzi: legge quello che il motore ha già deciso (posizioni,
// vita, quali celle sono libere). Per ora le figure sono emoji (provvisorie: la
// grafica dipinta viene dopo, docs/giardino/regole.md). La scala sta nella
// trasformazione del contesto, una volta per fotogramma (docs/core/grafica.md).
import { CAMPO, ALTEZZA } from '../dati/regole.js'
import { PIANTE } from '../dati/piante.js'
import { ZOMBI } from '../dati/zombi.js'

const L = CAMPO.colonne * CAMPO.cella
const A = ALTEZZA + CAMPO.casa

export class Campo {
  constructor(canvas) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.s = 1; this.ox = 0; this.oy = 0
  }

  // la tela prende la grandezza che ha sullo schermo; il mondo ci sta dentro per intero
  adatta() {
    const r = this.cv.getBoundingClientRect()
    const dpr = Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1)
    this.cv.width = Math.max(1, Math.round(r.width * dpr))
    this.cv.height = Math.max(1, Math.round(r.height * dpr))
    this.dpr = dpr
    this.s = Math.min(this.cv.width / L, this.cv.height / A)
    this.ox = (this.cv.width - L * this.s) / 2
    this.oy = (this.cv.height - A * this.s) / 2
  }

  // dal tocco (pixel della pagina) al mondo
  mondo(clientX, clientY) {
    const r = this.cv.getBoundingClientRect()
    const k = this.cv.width / r.width
    return { x: ((clientX - r.left) * k - this.ox) / this.s, y: ((clientY - r.top) * k - this.oy) / this.s }
  }

  disegna(p, ora, { piazza = false } = {}) {
    const c = this.ctx
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.clearRect(0, 0, this.cv.width, this.cv.height)
    c.setTransform(this.s, 0, 0, this.s, this.ox, this.oy)
    this.prato(p)
    if (piazza) this.libere(p)
    this.carretti(p)
    this.piante(p, ora)
    this.colpi(p)
    this.zombi(p, ora)
    this.soli(p, ora)
  }

  prato(p) {
    const c = this.ctx
    for (let r = 0; r < CAMPO.righe; r++) for (let k = 0; k < CAMPO.colonne; k++) {
      const aperta = p.corsie.includes(k)
      c.fillStyle = !aperta ? '#1f4d2a' : (r + k) % 2 ? '#2f6b3b' : '#35773f'
      c.fillRect(k * CAMPO.cella, r * CAMPO.cella, CAMPO.cella, CAMPO.cella)
    }
    c.fillStyle = '#6b4a2a'; c.fillRect(0, ALTEZZA, L, CAMPO.casa)
    c.font = `16px "Emoji Gioco", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#e8d3a8'
    for (let k = 0; k < CAMPO.colonne; k++) c.fillText('🏠', k * CAMPO.cella + CAMPO.cella / 2, ALTEZZA + CAMPO.casa / 2 + 1)
  }

  libere(p) {
    const c = this.ctx
    c.fillStyle = 'rgba(255,255,255,.2)'
    for (let r = CAMPO.rigaMin; r < CAMPO.righe; r++) for (const k of p.corsie)
      if (!p.cella(k, r)) c.fillRect(k * CAMPO.cella + 2, r * CAMPO.cella + 2, CAMPO.cella - 4, CAMPO.cella - 4)
  }

  // il carretto di ogni corsia, in fondo: se c'è, spazza via chi arriva
  carretti(p) {
    const c = this.ctx
    c.font = `20px "Emoji Gioco", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'
    for (const k of p.corsie) if (p.carretti[k]) c.fillText('🚜', k * CAMPO.cella + CAMPO.cella / 2, ALTEZZA - 12)
  }

  piante(p, ora) {
    const c = this.ctx
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `40px "Emoji Gioco", system-ui, sans-serif`
    for (const x of p.piante) {
      const P = PIANTE[x.id]
      const ferita = x.vita / P.vita
      c.globalAlpha = ferita >= 1 ? 1 : 0.5 + 0.5 * ferita
      const oscilla = P.sole ? Math.sin(ora * 2 + x.c) * 1.5 : 0
      c.fillText(P.emoji, x.c * CAMPO.cella + CAMPO.cella / 2 + oscilla, x.r * CAMPO.cella + CAMPO.cella / 2 + 2)
    }
    c.globalAlpha = 1
  }

  colpi(p) {
    const c = this.ctx
    for (const k of p.colpi) {
      c.fillStyle = k.gelo ? '#9be3ff' : '#b6f08a'
      c.beginPath(); c.arc(k.c * CAMPO.cella + CAMPO.cella / 2, k.y, 5, 0, 7); c.fill()
    }
  }

  zombi(p, ora) {
    const c = this.ctx
    c.textAlign = 'center'; c.textBaseline = 'middle'
    for (const z of p.zombi) {
      const Z = ZOMBI[z.tipo]
      const x = z.c * CAMPO.cella + CAMPO.cella / 2 + Math.sin(ora * 4 + z.y * 0.05) * 1.5
      c.font = `${Z.grande ? 60 : 40}px "Emoji Gioco", system-ui, sans-serif`
      c.fillText(Z.emoji, x, z.y)
      if (Z.cono) { c.font = `18px "Emoji Gioco", system-ui, sans-serif`; c.fillText('🚧', x, z.y - 22) }
      if (z.lento > 0) { c.fillStyle = 'rgba(155,227,255,.35)'; c.beginPath(); c.arc(x, z.y, 26, 0, 7); c.fill() }
      const w = Z.grande ? 44 : 32
      c.fillStyle = '#000a'; c.fillRect(x - w / 2, z.y - (Z.grande ? 40 : 30), w, 4)
      c.fillStyle = '#e65b4b'; c.fillRect(x - w / 2, z.y - (Z.grande ? 40 : 30), w * Math.max(0, z.vita) / Z.vita, 4)
    }
  }

  soli(p) {
    const c = this.ctx
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `34px "Emoji Gioco", system-ui, sans-serif`
    for (const s of p.raccolte) {
      c.globalAlpha = s.vita < 2 ? s.vita / 2 : 1
      c.fillStyle = 'rgba(255,226,122,.35)'; c.beginPath(); c.arc(s.x, s.y, 26, 0, 7); c.fill()
      c.fillText('☀️', s.x, s.y)
    }
    c.globalAlpha = 1
  }
}

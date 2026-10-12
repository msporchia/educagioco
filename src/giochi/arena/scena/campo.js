// Il campo dell'arena: disegna una Partita (il motore) sul canvas, con gli
// sprite del castello. Non conosce le regole né i prezzi: legge quello che
// il motore ha già deciso (posizioni, vita, livelli, eventi).
// La corsia è verticale come nel motore (y lungo la corsia, x di lato): il nemico
// in alto, chi gioca in basso. I castelli ai due capi lasciano la corsia libera
// per manovrare. Le creature del foglio guardano di lato (di schiena non esiste
// niente): in campo guardano dalla parte della loro squadra.
import { CAMPO, TRUPPE } from '../dati/regole.js'
import { carica, componi, immagineScena } from '../../castello/scena/vestito.js'
import { PEZZI as SCENE } from '../../castello/dati/vestiti.js'
import { PEZZI } from '../../castello/dati/figure.js'
import { caricaFigure, immagineFigure } from '../../castello/scena/pittori.js'
import { CREATURA, SCALA, fotogramma } from './figure.js'

// la carta del terreno, a celle da 64, in verticale: l'acqua attraversa le due righe
// di mezzo da un bordo all'altro, e la strada (due colonne) la passa
const MAPPA = [
  '^^,++.^^',
  ',.d++..,',
  '.,.++d..',
  '..d++...',
  ',..++.d.',
  '~~~++~~~',
  '~~~++~~~',
  ',.d++...',
  '..,++.d.',
  '.d.++,..',
  ',..++..,',
  '^^.++.^^',
]
const IO = '#3d8bff', NEM = '#ff5a4d'

export class Campo {
  constructor(canvas, { vestito = 'bosco' } = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.vestito = vestito
    this.pronto = false
    this.effetti = []
    this.s = 1; this.ox = 0; this.oy = 0
  }

  async prepara() {
    await Promise.all([carica(this.vestito), caricaFigure()])
    this.pronto = true
  }

  /* la tela prende la misura che il contenitore le dà; il mondo sta 3:2 */
  adatta() {
    const dpr = window.devicePixelRatio || 1
    const w = this.cv.clientWidth, h = this.cv.clientHeight
    if (!w || !h) return
    this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr)
    this.k = this.cv.width / w
    this.s = Math.min(w / CAMPO.W, h / CAMPO.H)
    this.ox = (w - CAMPO.W * this.s) / 2
    this.oy = (h - CAMPO.H * this.s) / 2
  }

  /* dal motore allo schermo: stesse coordinate, scalate */
  X(x) { return this.ox + x * this.s }
  Y(y) { return this.oy + y * this.s }
  /* una misura sul campo, in pixel dello schermo, a scala 0.85 (campo largo 306) */
  m(v) { return v * this.s / 0.85 }

  /* gli eventi del motore diventano effetti a tempo */
  eventi(lista, ora) {
    for (const e of lista) {
      const durata = { colpo: 0.18, crollo: 0.7, cura: 0.7, costruita: 0.6, potenziata: 0.6, squadra: 0.4, miniera: 0.7, castello: 0.7, bomba: 0.8, bombaPronta: 0.1 }[e.tipo] || 0.4
      this.effetti.push({ ...e, t0: ora, durata })
    }
  }

  disegna(p, ora) {
    const c = this.ctx
    c.setTransform(this.k, 0, 0, this.k, 0, 0)
    const W = this.cv.width / this.k, H = this.cv.height / this.k
    c.clearRect(0, 0, W, H)
    c.imageSmoothingEnabled = true
    this.sfondo(c, W, H)
    if (!this.pronto) return
    for (const lato of ['io', 'nem']) this.base(c, p, lato)
    for (const cs of p.caserme) this.caserma(c, p, cs, ora)
    for (const mu of p.muri) this.muro(c, mu)
    const ord = [...p.unita].sort((a, b) => this.Y(a.y) - this.Y(b.y))
    for (const u of ord) if (!u.vola) this.truppa(c, u, ora)
    for (const u of ord) if (u.vola) this.truppa(c, u, ora)
    this.fx(c, ora)
  }

  sfondo(c, W, H) {
    c.fillStyle = '#5f9a3c'; c.fillRect(0, 0, W, H)
    const mappa = this.pronto ? componi(MAPPA, this.vestito) : null
    if (mappa) c.drawImage(mappa, this.ox, this.oy, CAMPO.W * this.s, CAMPO.H * this.s)
  }

  /* un pezzo del foglio delle figure, col piede in (x, y) */
  pezzo(c, nome, x, y, scala, specchia = false, alpha = 1) {
    const [sx, sy, w, h] = PEZZI[nome]
    const lw = w * scala, lh = h * scala
    c.globalAlpha = alpha
    if (specchia) {
      c.save(); c.translate(x, y - lh); c.scale(-1, 1)
      c.drawImage(immagineFigure(), sx, sy, w, h, -lw / 2, 0, lw, lh); c.restore()
    } else c.drawImage(immagineFigure(), sx, sy, w, h, x - lw / 2, y - lh, lw, lh)
    c.globalAlpha = 1
    return lh
  }

  barra(c, x, y, w, q, colore) {
    q = Math.max(0, Math.min(1, q))
    c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x - w / 2 - 1, y - 1, w + 2, 5)
    c.fillStyle = colore || (q > 0.5 ? '#38c172' : q > 0.25 ? '#ffc93c' : '#ff5c7a')
    c.fillRect(x - w / 2, y, w * q, 3)
  }

  ombra(c, x, y, rx, ry, a = 0.28) {
    c.fillStyle = `rgba(0,0,0,${a})`
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill()
  }

  /* la base: il castello di chi gioca, la bocca da cui escono i mostri per il nemico */
  base(c, p, lato) {
    const re = p.castello(lato)
    const sc = SCENE[this.vestito], img = immagineScena(this.vestito)
    const x = this.X(re.x), y = this.Y(re.y)
    const [nome, k] = lato === 'io' ? ['castello', 0.4] : ['bocca', 0.62]
    const [sx, sy, w, h] = sc[nome]
    const lw = w * k * this.s / 0.85, lh = h * k * this.s / 0.85
    this.ombra(c, x, y + lh * 0.38, lw * 0.4, lh * 0.1)
    if (re.hp > 0) c.drawImage(img, sx, sy, w, h, x - lw / 2, y + lh * 0.3 - lh, lw, lh)
    else this.ombra(c, x, y, lw * 0.3, lh * 0.1, 0.5)
    if (re.hp < re.max) this.barra(c, x, y - lh * 0.62, this.m(34), re.hp / re.max)
    this.livello(c, x, y + lh * 0.3 + this.m(8), re.liv, lato)
  }

  livello(c, x, y, liv, lato) {
    c.font = `bold ${this.m(8)}px "Emoji Gioco", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'
    const w = this.m(18), h = this.m(10)
    c.fillStyle = lato === 'io' ? IO : NEM
    c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, h / 2); c.fill()
    c.fillStyle = '#fff'; c.fillText(liv, x, y + 0.5)
  }

  /* una caserma: una capanna col tetto della sua squadra e la creatura sopra */
  caserma(c, p, cs, ora) {
    const x = this.X(cs.x), y = this.Y(cs.y), col = cs.lato === 'io' ? IO : NEM
    const m = v => this.m(v)
    this.ombra(c, x, y + m(11), m(19), m(5))
    c.save()
    if (cs.fl > 0) c.globalAlpha = 0.7
    c.fillStyle = '#8a5a2b'; c.fillRect(x - m(13), y - m(5), m(26), m(15))            // le pareti
    c.fillStyle = '#6b4220'; c.fillRect(x - m(4), y + m(1), m(8), m(9))               // la porta
    c.fillStyle = col                                                                  // il tetto
    c.beginPath(); c.moveTo(x - m(17), y - m(4)); c.lineTo(x, y - m(17)); c.lineTo(x + m(17), y - m(4)); c.closePath(); c.fill()
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.stroke()
    c.restore()
    // l'emblema sul tetto: piccolo e FERMO (il primo fotogramma), serve solo a dire di chi è
    this.pezzo(c, fotogramma(cs.id, 0, false, 0), x, y - m(5), SCALA[cs.id] * 0.36 * this.s / 0.85, cs.lato === 'nem')
    this.livello(c, x, y + m(15), cs.liv, cs.lato)
    if (cs.hp < cs.max) this.barra(c, x, y - m(22), m(26), cs.hp / cs.max)     // la vita si vede solo se è ferita
    if (cs.riposo > 0) { c.font = `${m(11)}px "Emoji Gioco", system-ui, sans-serif`; c.textAlign = 'center'; c.fillText('💤', x + m(16), y - m(8)) }
  }

  /* il muro attraversa la corsia; se crolla resta un cumulo di sassi */
  muro(c, mu) {
    const x = this.X(mu.x), y = this.Y(mu.y), m = v => this.m(v)
    const w = m(54), h = m(12)
    if (mu.hp <= 0) {
      c.fillStyle = '#8b8478'
      for (const [dx, dy, r] of [[-16, -2, 6], [-5, 3, 7], [7, -3, 6], [17, 2, 5]]) {
        c.beginPath(); c.ellipse(x + m(dx), y + m(dy), m(r), m(r * 0.6), 0, 0, 7); c.fill()
      }
      return
    }
    this.ombra(c, x, y + h / 2 + m(2), w * 0.5, m(4))
    c.save()
    if (mu.fl > 0) c.globalAlpha = 0.7
    c.fillStyle = '#9a8f80'; c.fillRect(x - w / 2, y - h / 2, w, h)
    c.strokeStyle = '#5c5448'; c.lineWidth = 1
    for (let i = 0; i < 6; i++) {
      const xx = x - w / 2 + i * w / 6
      c.beginPath(); c.moveTo(xx, y - h / 2); c.lineTo(xx, y + h / 2); c.stroke()
    }
    c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.stroke()
    c.strokeStyle = mu.lato === 'io' ? IO : NEM; c.lineWidth = 2; c.strokeRect(x - w / 2, y - h / 2, w, h)
    c.restore()
    if (mu.hp < mu.max) this.barra(c, x, y - h / 2 - m(6), m(26), mu.hp / mu.max)
  }

  truppa(c, u, ora) {
    const k = TRUPPE[u.id], m = v => this.m(v)
    const x = this.X(u.x), y = this.Y(u.y) + m(6)
    const alto = u.vola ? m(14) + Math.sin(ora * 2.6 + u.x * 0.05) * m(2) : 0
    const col = u.lato === 'io' ? IO : NEM
    this.ombra(c, x, y, m(7) * (u.vola ? 0.7 : 1), m(2.5), u.vola ? 0.2 : 0.3)
    c.strokeStyle = col; c.lineWidth = 2
    c.beginPath(); c.ellipse(x, y, m(7) * (u.vola ? 0.7 : 1), m(2.5), 0, 0, 7); c.stroke()
    // un colpo è uno scatto in avanti, una corsa è un saltello
    const verso = u.lato === 'io' ? -1 : 1
    const scatto = u.colpo > 0 ? Math.sin(u.colpo / 0.25 * Math.PI) * m(4) * verso : 0
    const salto = u.cammina ? Math.abs(Math.sin(ora * 9 + u.x)) * m(2) : 0
    const nasce = u.nasce > 0 ? 1 - u.nasce / 0.8 : 1
    const sfasa = u.x * 0.07 + u.y * 0.05
    const lh = this.pezzo(c, fotogramma(u.id, ora, u.cammina, sfasa), x, y - alto - salto + scatto,
      SCALA[u.id] * this.s / 0.85 * (0.6 + 0.4 * nasce), u.lato === 'nem', u.fl > 0 ? 0.6 : 1)
    if (u.hp < u.max) this.barra(c, x, y - alto - lh - m(5), m(15), u.hp / u.max)
    if (u.nasce > 0) {
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.5
      c.beginPath(); c.arc(x, y, m(5) + u.nasce * m(14), 0, 7); c.stroke()
    }
  }

  fx(c, ora) {
    this.effetti = this.effetti.filter(e => ora - e.t0 < e.durata)
    for (const e of this.effetti) {
      const q = (ora - e.t0) / e.durata
      if (e.tipo === 'colpo') {
        const x1 = this.X(e.x1), y1 = this.Y(e.y1), x2 = this.X(e.x2), y2 = this.Y(e.y2)
        const a = Math.min(1, q * 1.6), b = Math.max(0, a - 0.4)
        c.strokeStyle = e.lato === 'io' ? 'rgba(170,215,255,.95)' : 'rgba(255,175,150,.95)'; c.lineWidth = 2
        c.beginPath(); c.moveTo(x1 + (x2 - x1) * b, y1 + (y2 - y1) * b); c.lineTo(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a); c.stroke()
        if (e.scoppio && q > 0.5) {
          c.fillStyle = `rgba(255,200,80,${0.4 * (1 - q)})`
          c.beginPath(); c.arc(x2, y2, this.m(e.scoppio * 0.7) * (0.5 + q * 0.5), 0, 7); c.fill()
        }
      } else {
        const x = this.X(e.x), y = this.Y(e.y)
        if (e.tipo === 'cura') {
          c.strokeStyle = `rgba(110,240,140,${1 - q})`; c.lineWidth = 3
          c.beginPath(); c.arc(x, y, this.m(10) + q * this.m(26), 0, 7); c.stroke()
          c.fillStyle = `rgba(110,240,140,${1 - q})`; c.font = `bold ${this.m(14)}px "Emoji Gioco", system-ui, sans-serif`
          c.textAlign = 'center'; c.fillText('+', x, y - q * this.m(24))
        } else if (e.tipo === 'crollo') {
          c.fillStyle = `rgba(150,140,120,${0.7 * (1 - q)})`
          for (let i = 0; i < 5; i++) { const a = i * 1.26; c.beginPath(); c.arc(x + Math.cos(a) * q * this.m(20), y + Math.sin(a) * q * this.m(14), this.m(7) * (1 - q * 0.5), 0, 7); c.fill() }
        } else if (['costruita', 'potenziata', 'castello', 'miniera'].includes(e.tipo)) {
          c.strokeStyle = `rgba(255,220,90,${1 - q})`; c.lineWidth = 3
          c.beginPath(); c.arc(x, y, this.m(8) + q * this.m(24), 0, 7); c.stroke()
        } else if (e.tipo === 'bomba') {
          const r = this.m(e.raggio) * (0.35 + 0.65 * Math.min(1, q * 2.2))
          c.fillStyle = `rgba(255,170,60,${0.55 * (1 - q)})`; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill()
          c.strokeStyle = `rgba(255,240,170,${1 - q})`; c.lineWidth = 4; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke()
          c.fillStyle = `rgba(80,60,50,${0.5 * (1 - q)})`
          for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.4; c.beginPath(); c.arc(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6 - q * this.m(14), this.m(8) * (1 - q * 0.5), 0, 7); c.fill() }
        } else if (e.tipo === 'squadra') {
          c.fillStyle = `rgba(255,255,255,${0.35 * (1 - q)})`
          c.beginPath(); c.arc(x, y, this.m(8) + q * this.m(12), 0, 7); c.fill()
        }
      }
    }
  }
}

// Il campo dell'arena: disegna una Partita (il motore) sul canvas, con gli
// sprite del castello. Non conosce le regole né i prezzi: legge quello che
// il motore ha già deciso (posizioni, vita, livelli, eventi).
// La corsia è orizzontale: chi gioca sta a sinistra, il nemico a destra. Il
// motore la conta in verticale (y lungo la corsia, x di lato): qui si ruota.
import { CAMPO, TRUPPE } from '../dati/regole.js'
import { carica, componi, immagineScena } from '../../castello/scena/vestito.js'
import { PEZZI as SCENE } from '../../castello/dati/vestiti.js'
import { PEZZI } from '../../castello/dati/figure.js'
import { caricaFigure, immagineFigure } from '../../castello/scena/pittori.js'
import { stadioDi } from '../../../data/ops.js'
import { CREATURA, SCALA, fotogramma } from './figure.js'

// la carta del terreno, a celle da 64: acqua in mezzo (colonne 5-6), e la strada
// che la attraversa nelle due righe di mezzo
const MAPPA = [
  '^^,..d~~.d,^',
  ',..,..~~.,..',
  '.d..,.~~..d.',
  '++++++++++++',
  '++++++++++++',
  '.d..,.~~..d.',
  ',..,..~~.,..',
  '^^,..d~~.d,^',
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
    this.s = Math.min(w / CAMPO.H, h / CAMPO.W)
    this.ox = (w - CAMPO.H * this.s) / 2
    this.oy = (h - CAMPO.W * this.s) / 2
  }

  /* dal motore allo schermo: y lungo la corsia diventa x (al contrario), x di lato diventa y */
  px(y) { return this.ox + (CAMPO.H - y) * this.s }
  py(x) { return this.oy + x * this.s }
  /* una misura sul campo, in pixel dello schermo, a larghezza 390 */
  m(v) { return v * this.s / 0.722 }

  /* gli eventi del motore diventano effetti a tempo */
  eventi(lista, ora) {
    for (const e of lista) {
      const durata = { colpo: 0.18, crollo: 0.7, cura: 0.7, costruita: 0.6, potenziata: 0.6, muro: 0.5, squadra: 0.4, miniera: 0.7, torretta: 0.7 }[e.tipo] || 0.4
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
    for (const t of p.torri) if (t.tipo === 'p') this.torretta(c, t, ora)
    for (const mu of p.muri) this.muro(c, mu)
    const ord = [...p.unita].sort((a, b) => this.py(a.x) - this.py(b.x))
    for (const u of ord) if (!u.vola) this.truppa(c, u, ora)
    for (const u of ord) if (u.vola) this.truppa(c, u, ora)
    this.fx(c, ora)
  }

  sfondo(c, W, H) {
    c.fillStyle = '#5f9a3c'; c.fillRect(0, 0, W, H)
    const mappa = this.pronto ? componi(MAPPA, this.vestito) : null
    if (mappa) c.drawImage(mappa, this.ox, this.oy, CAMPO.H * this.s, CAMPO.W * this.s)
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
    const re = p.re(lato)
    const sc = SCENE[this.vestito], img = immagineScena(this.vestito)
    const x = this.px(re.y), y = this.py(re.x)
    const [nome, k] = lato === 'io' ? ['castello', 0.4] : ['bocca', 0.62]
    const [sx, sy, w, h] = sc[nome]
    const lw = w * k * this.s / 0.722, lh = h * k * this.s / 0.722
    this.ombra(c, x, y + lh * 0.38, lw * 0.4, lh * 0.1)
    if (re.hp > 0) c.drawImage(img, sx, sy, w, h, x - lw / 2, y + lh * 0.45 - lh, lw, lh)
    else this.ombra(c, x, y, lw * 0.3, lh * 0.1, 0.5)
    this.barra(c, x, y - lh * 0.62, this.m(34), re.hp / re.max)
  }

  torretta(c, t, ora) {
    const x = this.px(t.y), y = this.py(t.x)
    const nome = `torre:arciere:${stadioDi(t.liv)}:`
    this.ombra(c, x, y + this.m(4), this.m(13), this.m(4))
    if (t.hp <= 0) return
    const lh = this.pezzo(c, nome, x, y + this.m(6), 0.4 * this.s / 0.722, false, t.fl > 0 ? 0.65 : 1)
    this.barra(c, x, y + this.m(6) - lh - this.m(5), this.m(26), t.hp / t.max)
    this.livello(c, x, y + this.m(6) + this.m(9), t.liv, t.lato)
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
    const x = this.px(cs.y), y = this.py(cs.x), col = cs.lato === 'io' ? IO : NEM
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
    this.pezzo(c, fotogramma(cs.id, ora, false, cs.posto), x, y - m(13), SCALA[cs.id] * 0.5 * this.s / 0.722, cs.lato === 'nem')
    this.barra(c, x, y - m(34), m(26), cs.hp / cs.max)
    this.livello(c, x, y + m(15), cs.liv, cs.lato)
    // la prossima squadra: una barra sottile che si riempie (e in costruzione, gialla)
    const ferma = cs.t > cs.ciclo
    this.barra(c, x, y + m(21), m(26), 1 - cs.t / cs.ciclo, ferma ? '#ffd24a' : '#7ee08c')
    if (cs.riposo > 0) { c.font = `${m(11)}px "Emoji Gioco", system-ui, sans-serif`; c.textAlign = 'center'; c.fillText('💤', x + m(16), y - m(8)) }
  }

  muro(c, mu) {
    const x = this.px(mu.y), y = this.py(mu.x), m = v => this.m(v)
    const w = m(11), h = m(52)
    this.ombra(c, x, y + h / 2 + m(2), m(14), m(4))
    c.save()
    if (mu.fl > 0) c.globalAlpha = 0.7
    c.fillStyle = '#9a8f80'; c.fillRect(x - w / 2, y - h / 2, w, h)
    c.strokeStyle = '#5c5448'; c.lineWidth = 1
    for (let i = 0; i < 7; i++) {
      const yy = y - h / 2 + i * h / 7
      c.beginPath(); c.moveTo(x - w / 2, yy); c.lineTo(x + w / 2, yy); c.stroke()
      c.beginPath(); c.moveTo(x + (i % 2 ? -w / 4 : w / 4), yy); c.lineTo(x + (i % 2 ? -w / 4 : w / 4), yy + h / 7); c.stroke()
    }
    c.strokeStyle = mu.lato === 'io' ? IO : NEM; c.lineWidth = 2; c.strokeRect(x - w / 2, y - h / 2, w, h)
    c.restore()
    this.barra(c, x, y - h / 2 - m(6), m(22), mu.hp / mu.max)
  }

  truppa(c, u, ora) {
    const k = TRUPPE[u.id], m = v => this.m(v)
    const x = this.px(u.y), y = this.py(u.x) + m(6)
    const alto = u.vola ? m(14) + Math.sin(ora * 2.6 + u.x * 0.05) * m(2) : 0
    const col = u.lato === 'io' ? IO : NEM
    this.ombra(c, x, y, m(7) * (u.vola ? 0.7 : 1), m(2.5), u.vola ? 0.2 : 0.3)
    c.strokeStyle = col; c.lineWidth = 2
    c.beginPath(); c.ellipse(x, y, m(7) * (u.vola ? 0.7 : 1), m(2.5), 0, 0, 7); c.stroke()
    // un colpo è uno scatto in avanti, una corsa è un saltello
    const verso = u.lato === 'io' ? 1 : -1
    const scatto = u.colpo > 0 ? Math.sin(u.colpo / 0.25 * Math.PI) * m(4) * verso : 0
    const salto = u.cammina ? Math.abs(Math.sin(ora * 9 + u.x)) * m(2) : 0
    const nasce = u.nasce > 0 ? 1 - u.nasce / 0.8 : 1
    const sfasa = u.x * 0.07 + u.y * 0.05
    const lh = this.pezzo(c, fotogramma(u.id, ora, u.cammina, sfasa), x + scatto, y - alto - salto,
      SCALA[u.id] * this.s / 0.722 * (0.6 + 0.4 * nasce), u.lato === 'nem', u.fl > 0 ? 0.6 : 1)
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
        const x1 = this.px(e.y1), y1 = this.py(e.x1), x2 = this.px(e.y2), y2 = this.py(e.x2)
        const a = Math.min(1, q * 1.6), b = Math.max(0, a - 0.4)
        c.strokeStyle = e.lato === 'io' ? 'rgba(170,215,255,.95)' : 'rgba(255,175,150,.95)'; c.lineWidth = 2
        c.beginPath(); c.moveTo(x1 + (x2 - x1) * b, y1 + (y2 - y1) * b); c.lineTo(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a); c.stroke()
        if (e.scoppio && q > 0.5) {
          c.fillStyle = `rgba(255,200,80,${0.4 * (1 - q)})`
          c.beginPath(); c.arc(x2, y2, this.m(e.scoppio * 0.7) * (0.5 + q * 0.5), 0, 7); c.fill()
        }
      } else {
        const x = this.px(e.y), y = this.py(e.x)
        if (e.tipo === 'cura') {
          c.strokeStyle = `rgba(110,240,140,${1 - q})`; c.lineWidth = 3
          c.beginPath(); c.arc(x, y, this.m(10) + q * this.m(26), 0, 7); c.stroke()
          c.fillStyle = `rgba(110,240,140,${1 - q})`; c.font = `bold ${this.m(14)}px "Emoji Gioco", system-ui, sans-serif`
          c.textAlign = 'center'; c.fillText('+', x, y - q * this.m(24))
        } else if (e.tipo === 'crollo') {
          c.fillStyle = `rgba(150,140,120,${0.7 * (1 - q)})`
          for (let i = 0; i < 5; i++) { const a = i * 1.26; c.beginPath(); c.arc(x + Math.cos(a) * q * this.m(20), y + Math.sin(a) * q * this.m(14), this.m(7) * (1 - q * 0.5), 0, 7); c.fill() }
        } else if (['costruita', 'potenziata', 'muro', 'torretta', 'miniera'].includes(e.tipo)) {
          c.strokeStyle = `rgba(255,220,90,${1 - q})`; c.lineWidth = 3
          c.beginPath(); c.arc(x, y, this.m(8) + q * this.m(24), 0, 7); c.stroke()
        } else if (e.tipo === 'squadra') {
          c.fillStyle = `rgba(255,255,255,${0.35 * (1 - q)})`
          c.beginPath(); c.arc(x, y, this.m(8) + q * this.m(12), 0, 7); c.fill()
        }
      }
    }
  }
}

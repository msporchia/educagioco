// Il campo dell'arena: disegna una Partita (il motore) sul canvas, con gli
// sprite del castello. Non conosce le regole né i prezzi: legge quello che
// il motore ha già deciso (posizioni, vita, livelli, eventi).
// La corsia è verticale come nel motore (y lungo la corsia, x di lato): il nemico
// in alto, chi gioca in basso. I castelli ai due capi lasciano la corsia libera
// per manovrare. Le creature del foglio guardano di lato (di schiena non esiste
// niente): in campo guardano dalla parte della loro squadra.
import { CAMPO, TRUPPE, POSTI } from '../dati/regole.js'
import { carica, componi, immagineScena } from '../../castello/scena/vestito.js'
import { PEZZI as SCENE } from '../../castello/dati/vestiti.js'
import { PEZZI } from '../../castello/dati/figure.js'
import { caricaFigure, immagineFigure } from '../../castello/scena/pittori.js'
import { SCALA, fotogramma, arco } from './figure.js'
import { disegnaEdificio } from './edifici.js'

// La carta del terreno, a celle da 64 (16 × 24): celle piccole, così il campo è largo e le
// figure piccole. La strada sono due colonne, il fiume due righe (y 247–292, dov'è l'acqua del
// motore). Le due metà di chi gioca sono solo prato, con gli alberi sul bordo: ci stanno le
// cittadelle.
const ZOOM = 0.5
const ZT = ZOOM * 1.2                    // le truppe: un po' più grandi del terreno
const ZE = 0.75                          // castello ed edifici: più grandi delle truppe
const MAPPA = Array.from({ length: 24 }, (_, y) => Array.from({ length: 16 }, (_, x) => {
  if (x === 7 || x === 8) return '+'
  if (y === 11 || y === 12) return '~'
  if (y <= 9 || y >= 14) return x === 0 || x === 15 ? '^' : '_'
  const h = ((x * 73856093) ^ (y * 19349663)) >>> 0
  const bordo = Math.min(x, 15 - x)
  if (bordo === 0 && h % 4 === 0) return '^'
  if (bordo > 1 && h % 11 === 0) return 'd'
  return h % 3 ? '.' : ','
}).join(''))
const IO = '#3d8bff', NEM = '#ff5a4d'

export class Campo {
  constructor(canvas, { vestito = 'bosco' } = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.vestito = vestito
    this.pronto = false
    this.effetti = []
    this.s = 1; this.ox = 0; this.oy = 0
    this.nate = new WeakMap()          // quando è comparsa ogni caserma, per farla spuntare
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
  m(v) { return v * this.s / 0.85 * ZT }
  /* una misura di un edificio */
  me(v) { return v * this.s / 0.85 * ZE }
  /* le scritte e le barre dei castelli rimpiccioliscono meno delle figure: si devono leggere */
  mi(v) { return v * this.s / 0.85 * Math.max(ZOOM, 0.75) }

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
    this.ponte(c)
    this.piazzole(c)
    // castelli, caserme e porte dall'alto in basso, così chi sta davanti copre chi sta dietro
    const edifici = [...p.castelli.map(e => [e.y, () => this.base(c, p, e.lato)]),
      ...p.caserme.map(e => [e.y + 10, () => this.caserma(c, p, e, ora)]), ...p.muri.map(e => [e.y, () => this.muro(c, e)])]
    for (const [, disegna] of edifici.sort((a, b) => a[0] - b[0])) disegna()
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
  pezzo(c, nome, x, y, scala, specchia = false, alpha = 1, foglio = immagineFigure()) {
    const [sx, sy, w, h] = PEZZI[nome]
    const lw = w * scala, lh = h * scala
    c.globalAlpha = alpha
    if (specchia) {
      c.save(); c.translate(x, y - lh); c.scale(-1, 1)
      c.drawImage(foglio, sx, sy, w, h, -lw / 2, 0, lw, lh); c.restore()
    } else c.drawImage(foglio, sx, sy, w, h, x - lw / 2, y - lh, lw, lh)
    c.globalAlpha = 1
    return lh
  }

  /* il foglio delle figure tutto del colore di una squadra, per il contorno (si fa una volta) */
  tinta(lato) {
    this._tinte ||= {}
    if (this._tinte[lato]) return this._tinte[lato]
    const img = immagineFigure(), cv = document.createElement('canvas')
    cv.width = img.width; cv.height = img.height
    const x = cv.getContext('2d'); x.drawImage(img, 0, 0)
    x.globalCompositeOperation = 'source-in'; x.fillStyle = lato === 'io' ? '#4f9dff' : '#ff4a3d'; x.fillRect(0, 0, cv.width, cv.height)
    return (this._tinte[lato] = cv)
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
    /* il castello sta sul bordo e se ne vede solo un pezzo, la cima (il nemico, in alto, la base):
       è l'obiettivo finale, non deve prendere campo */
    const re = p.castello(lato)
    const sc = SCENE[this.vestito], img = immagineScena(this.vestito)
    const [sx, sy, w, h] = sc.castello
    const lw = w * 0.56 * this.s / 0.85 * ZE, lh = h * 0.56 * this.s / 0.85 * ZE
    const x = this.X(re.x), piede = lato === 'io' ? this.Y(CAMPO.H + 60) : this.Y(60)
    if (re.hp > 0) {
      if (lato === 'nem') c.drawImage(this.castelloNemico(img, sx, sy, w, h), x - lw / 2, piede - lh, lw, lh)
      else c.drawImage(img, sx, sy, w, h, x - lw / 2, piede - lh, lw, lh)
    } else this.ombra(c, x, lato === 'io' ? this.Y(CAMPO.H) : this.Y(0), lw * 0.4, lh * 0.1, 0.5)
    // la vita del castello: una barra grande dalla parte del campo, sempre accesa (con la vita scritta)
    const by = lato === 'io' ? piede - lh - this.mi(18) : piede + this.mi(6)
    this.barraCastello(c, x, by, re, lato)
    this.livello(c, x + this.mi(66), by + this.mi(6.5), re.liv, lato)
  }

  /* il castello del nemico è lo stesso, coi colori scambiati: tetti rossi, stendardi blu */
  castelloNemico(img, sx, sy, w, h) {
    if (this._nem) return this._nem
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h
    const x = cv.getContext('2d'); x.drawImage(img, sx, sy, w, h, 0, 0, w, h)
    const d = x.getImageData(0, 0, w, h), a = d.data
    for (let i = 0; i < a.length; i += 4) {
      const r = a[i], g = a[i + 1], b = a[i + 2]
      if (b > r + 70 && b > g + 30) { a[i] = b; a[i + 1] = Math.round(g * 0.55); a[i + 2] = Math.round(r * 0.7) }      // il blu diventa rosso
      else if (r > g + 60 && r > b + 60) { a[i] = Math.round(b * 0.8); a[i + 1] = Math.round(g * 1.1); a[i + 2] = r }  // e il rosso blu
    }
    x.putImageData(d, 0, 0)
    return (this._nem = cv)
  }

  barraCastello(c, x, y, re, lato) {
    const w = this.mi(104), h = this.mi(13), q = Math.max(0, re.hp / re.max)
    c.fillStyle = 'rgba(0,0,0,.65)'
    c.beginPath(); c.roundRect(x - w / 2 - 2, y - 2, w + 4, h + 4, h / 2 + 2); c.fill()
    c.fillStyle = lato === 'io' ? IO : NEM
    if (q > 0) { c.beginPath(); c.roundRect(x - w / 2, y, Math.max(h, w * q), h, h / 2); c.fill() }
    c.fillStyle = '#fff'; c.font = `bold ${this.mi(10)}px "Emoji Gioco", system-ui, sans-serif`
    c.textAlign = 'center'; c.textBaseline = 'middle'
    c.shadowColor = '#000'; c.shadowBlur = 3
    c.fillText(`${Math.ceil(re.hp)}`, x, y + h / 2 + 0.5)
    c.shadowBlur = 0
  }

  livello(c, x, y, liv, lato) {
    c.font = `bold ${this.mi(8)}px "Emoji Gioco", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'
    const w = this.mi(18), h = this.mi(10)
    c.fillStyle = lato === 'io' ? IO : NEM
    c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, h / 2); c.fill()
    c.fillStyle = '#fff'; c.fillText(liv, x, y + 0.5)
  }

  /* il ponte: assi di legno sull'acqua, con le sponde */
  ponte(c) {
    const m = v => this.m(v)
    const x0 = this.X(CAMPO.corsia - 26), x1 = this.X(CAMPO.corsia + 26)
    const y0 = this.Y(CAMPO.fiume.alto - 8), y1 = this.Y(CAMPO.fiume.basso + 8)
    this.ombra(c, (x0 + x1) / 2, y1, (x1 - x0) * 0.55, m(5), 0.25)
    c.fillStyle = '#7a5130'; c.fillRect(x0, y0, x1 - x0, y1 - y0)
    for (let y = y0, i = 0; y < y1; y += m(6), i++) {
      c.fillStyle = i % 2 ? '#a8713f' : '#9a6636'
      c.fillRect(x0 + m(2), y + m(0.6), x1 - x0 - m(4), m(5))
    }
    for (const x of [x0, x1]) {
      c.fillStyle = '#5b3a1f'; c.fillRect(x - m(3), y0, m(5), y1 - y0)
      for (let y = y0; y <= y1 + 1; y += (y1 - y0) / 3) { c.fillStyle = '#4a2f18'; c.fillRect(x - m(4), y - m(4), m(7), m(7)) }
    }
  }

  /* i posti delle caserme: una base stabile sempre in vista, la piazzola del castello a torri.
     Vuota aspetta la caserma, e quando la caserma crolla resta lì. */
  piazzole(c) {
    const sc = SCENE[this.vestito], img = immagineScena(this.vestito)
    for (const lato of ['io', 'nem']) POSTI.forEach(([px, py], i) => {
      const [sx, sy, w, h] = sc['piazzola:' + (i % 2)]
      const lw = this.me(70), lh = lw * h / w
      const y = this.Y(lato === 'io' ? py : CAMPO.H - py) + this.me(9)
      this.ombra(c, this.X(px) + 2, y + lh * 0.42, lw * 0.5, lh * 0.14, 0.25)
      c.drawImage(img, sx, sy, w, h, this.X(px) - lw / 2, y - lh / 2, lw, lh)
    })
  }

  /* una caserma: l'edificio della sua truppa (scena/edifici.js), che spunta dalla sua piazzola quando
     nasce; sopra lo stemma della truppa, sotto il livello */
  caserma(c, p, cs, ora) {
    if (!this.nate.has(cs)) this.nate.set(cs, p.t < 1 ? -99 : ora)
    const q = Math.min(1, (ora - this.nate.get(cs)) / 0.7)
    const k = q < 1 ? Math.max(0.05, 1 + 2.7 * (q - 1) ** 3 + 1.7 * (q - 1) ** 2) : 1                  // spunta con un rimbalzo
    const x = this.X(cs.x), y = this.Y(cs.y) + this.me(10), col = cs.lato === 'io' ? IO : NEM
    const scuro = cs.lato === 'io' ? '#1f4f9e' : '#a32a22'
    const u = v => this.me(v) * 1.2 * k
    if (q < 1) {                                                                      // la polvere del cantiere
      c.fillStyle = `rgba(230,215,180,${0.7 * (1 - q)})`
      for (let i = 0; i < 6; i++) { const a = i * 1.05; c.beginPath(); c.arc(x + Math.cos(a) * this.me(14 + 18 * q), y + Math.sin(a) * this.me(4 + 6 * q), this.me(8) * (1 - q * 0.6), 0, 7); c.fill() }
    }
    this.ombra(c, x + u(3), y + u(1), u(28), u(5), 0.3)
    c.save()
    if (cs.fl > 0) c.globalAlpha = 0.7
    const alto = disegnaEdificio(c, { ed: cs.ed, id: cs.id, stadio: cs.liv >= 5 ? 2 : 1, x, y, u, col, scuro, ora })
    c.restore()
    // lo stemma: la truppa ferma, su uno scudo tondo davanti
    if (k > 0.6) {
      c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.arc(x + u(20), y - u(14), u(6.5), 0, 7); c.fill()
      c.strokeStyle = scuro; c.lineWidth = 2; c.stroke()
      const fg = fotogramma(cs.id, 0, false, 0), sc = SCALA[cs.id] * 0.3 * this.s / 0.85 * ZE * k
      this.pezzo(c, fg, x + u(20), y - u(8.5), sc, cs.lato === 'nem')
      if (cs.id === 'scheletri') arco(c, x + u(20), y - u(8.5), PEZZI[fg][2] * sc, PEZZI[fg][3] * sc, cs.lato === 'nem')
    }
    this.livello(c, x, y + this.mi(6), cs.liv, cs.lato)
    if (cs.hp < cs.max) this.barra(c, x, y - u(alto) - this.me(4), u(34), cs.hp / cs.max)     // la vita si vede solo se è ferita
    if (cs.riposo > 0) { c.font = `${u(11)}px "Emoji Gioco", system-ui, sans-serif`; c.textAlign = 'center'; c.fillText('💤', x - u(24), y - u(20)) }
  }

  /* la porta in fondo al ponte: due torrette e il portone che si rompe; crollata, resta il cumulo */
  muro(c, mu) {
    const S = this.s, x = this.X(mu.x), y = this.Y(mu.y), col = mu.lato === 'io' ? IO : NEM
    const mezza = 24 * S, alto = 13 * S
    const torre = tx => {
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(tx - 6 * S + 2, y - alto + 3, 12 * S, alto + 4 * S)
      c.fillStyle = '#9c9486'; c.fillRect(tx - 6 * S, y - alto - 2 * S, 12 * S, alto + 6 * S)
      c.fillStyle = '#c7bfb0'; for (const d of [-6, -1.5, 3]) c.fillRect(tx + d * S, y - alto - 5 * S, 3 * S, 3 * S)
      c.fillStyle = col; c.fillRect(tx - 6 * S, y - alto - 2 * S, 12 * S, 1.8 * S)
    }
    if (mu.hp <= 0) {
      c.fillStyle = '#8b8478'
      for (const [dx, dy, r] of [[-10, 2, 5], [-2, 5, 6], [6, 1, 5], [12, 4, 4]]) {
        c.beginPath(); c.ellipse(x + dx * S, y + dy * S, r * S, r * 0.6 * S, 0, 0, 7); c.fill()
      }
    } else {
      c.save()
      if (mu.fl > 0) c.globalAlpha = 0.7
      c.fillStyle = '#6b4424'; c.fillRect(x - mezza + 4 * S, y - alto + 2 * S, 2 * mezza - 8 * S, alto + 2 * S)
      c.strokeStyle = '#4a2e17'; c.lineWidth = Math.max(1, S * 0.8)
      for (let d = -mezza + 9 * S; d < mezza - 5 * S; d += 5 * S) { c.beginPath(); c.moveTo(x + d, y - alto + 2 * S); c.lineTo(x + d, y + 4 * S); c.stroke() }
      c.fillStyle = '#3b3b40'; c.fillRect(x - mezza + 4 * S, y - 3 * S, 2 * mezza - 8 * S, 1.6 * S)
      c.fillStyle = col; c.fillRect(x - mezza + 4 * S, y - alto + 2 * S, 2 * mezza - 8 * S, 1.8 * S)
      c.restore()
    }
    torre(x - mezza); torre(x + mezza)
    if (mu.hp > 0 && mu.hp < mu.max) this.barra(c, x, y - alto - 9 * S, this.m(40), mu.hp / mu.max)
  }

  truppa(c, u, ora) {
    const k = TRUPPE[u.id], m = v => this.m(v)
    const x = this.X(u.x), y = this.Y(u.y) + m(6)
    const alto = u.vola ? m(14) + Math.sin(ora * 2.6 + u.x * 0.05) * m(2) : 0
    const col = u.lato === 'io' ? IO : NEM
    // sotto i piedi un disco pieno del colore della squadra
    c.fillStyle = col; c.globalAlpha = u.vola ? 0.45 : 0.75
    c.beginPath(); c.ellipse(x, y, m(7) * (u.vola ? 0.7 : 1), m(2.6), 0, 0, 7); c.fill(); c.globalAlpha = 1
    // un colpo è uno scatto in avanti, una corsa è un saltello
    const verso = u.lato === 'io' ? -1 : 1
    const scatto = u.colpo > 0 ? Math.sin(u.colpo / 0.25 * Math.PI) * m(4) * verso : 0
    const salto = u.cammina ? Math.abs(Math.sin(ora * 9 + u.x)) * m(2) : 0
    const nasce = u.nasce > 0 ? 1 - u.nasce / 0.8 : 1
    const sfasa = u.x * 0.07 + u.y * 0.05
    const fg = fotogramma(u.id, ora, u.cammina, sfasa), sc = SCALA[u.id] * this.s / 0.85 * ZT * (0.6 + 0.4 * nasce)
    const py = y - alto - salto + scatto, d = 1.3
    // il contorno: la stessa figura tinta del colore della squadra, spostata di un pelo ai quattro lati
    for (const [dx, dy] of [[-d, 0], [d, 0], [0, -d], [0, d]]) this.pezzo(c, fg, x + dx, py + dy, sc, u.lato === 'nem', 1, this.tinta(u.lato))
    const lh = this.pezzo(c, fg, x, py, sc, u.lato === 'nem', u.fl > 0 ? 0.6 : 1)
    if (u.id === 'scheletri') {
      const [, , w, h] = PEZZI[fg]
      arco(c, x, py, w * sc, h * sc, u.lato === 'nem', u.colpo > 0 ? Math.sin(u.colpo / 0.25 * Math.PI) : 0)
    }
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

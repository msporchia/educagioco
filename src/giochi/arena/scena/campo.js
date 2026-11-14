// Il campo dell'arena: disegna una Partita (il motore) sul canvas, con gli
// sprite del castello. Non conosce le regole né i prezzi: legge quello che
// il motore ha già deciso (posizioni, vita, livelli, eventi).
// La corsia è verticale come nel motore (y lungo la corsia, x di lato): il nemico
// in alto, chi gioca in basso. I castelli ai due capi lasciano la corsia libera
// per manovrare. Le creature del foglio guardano di lato (di schiena non esiste
// niente): in campo guardano dalla parte della loro squadra.
import { CAMPO, TRUPPE, POSTI, EDIFICIO_DI } from '../dati/regole.js'
import { PEZZI as DIPINTE, ATLANTE as FOGLIO_CASERME, PIAZZOLA } from '../dati/caserme-dipinte.js'
import { PEZZI as FORTEZZE, ATLANTE as FOGLIO_FORTEZZE } from '../dati/fortezze-dipinte.js'
import { PEZZI as OPERE, ATLANTE as FOGLIO_OPERE } from '../dati/opere-disegnate.js'
import { PEZZI as VESTITE, ATLANTE as FOGLIO_TRUPPE } from '../dati/truppe-dipinte.js'
import { PEZZI } from '../../castello/dati/figure.js'
import { caricaFigure, immagineFigure } from '../../castello/scena/pittori.js'
import { SCALA, fotogramma, fotogrammiDi, arco, armiPronte } from './figure.js'
import { PONTE_DIPINTO } from '../dati/terreni-pronti.js'
import { disegnaEdificio } from './edifici.js'
import { Terreno } from './terreno.js'
import { Atmosfera } from './atmosfera.js'

// Tutto è piccolo e il campo è largo: `ZOOM` è la misura delle figure rispetto al mondo.
const ZOOM = 0.5
// quanto mondo si vede almeno, di lato: le piazzole coi loro bordi. Il resto dello schermo è terreno in più (docs/arena/grafica.md)
const LARGO_MINIMO = 276
// in partita non si disegna niente che si possa preparare (docs/arena/grafica.md): gli atlanti si caricano e si ricolorano una volta sola
const atlanti = {}
const ZT = ZOOM * 1.2                    // le truppe: un po' più grandi del terreno
const ZE = 0.75                          // castello ed edifici: più grandi delle truppe
const TAGLIA = 0.7                       // gli edifici sulle piazzole, rispetto al castello: i posti restano quelli, il campo respira
const IO = '#3d8bff', NEM = '#ff5a4d'

export class Campo {
  constructor(canvas, { vestito = 'bosco' } = {}) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.terreno = new Terreno(vestito)
    this.aria = new Atmosfera(this.terreno.a)
    this.pronto = false
    this.effetti = []
    this.s = 1; this.ox = 0; this.oy = 0; this.k = 1
    this.nate = new WeakMap()          // quando è comparsa ogni caserma, per farla spuntare
    this.rovine = new Map()            // 'lato:posto' → l'edificio crollato lì: ne resta il rudere
    this.caserme = null                // le caserme dipinte: { io, nem } (il nemico col blu fatto rosso)
    this.fortezze = null               // castello, porta e ponte dipinti del posto, se il foglio è arrivato: come sopra
    this.opere = null                  // i pezzi disegnati a monte, che ci sono sempre: come sopra
    this.figure = new Map()            // le truppe già pronte alla misura dello schermo: vedi `figura`
  }

  /* se un'immagine non arriva (cache che si sta rinnovando, memoria corta) si riprova: il campo non resta
     verde per sempre */
  async prepara() {
    for (let giro = 0; ; giro++) {
      try {
        await Promise.all([caricaFigure(), armiPronte(), this.caricaAtlanti(), this.terreno.prepara()])
        break
      } catch (e) {
        if (giro >= 5) throw e
        await new Promise(ok => setTimeout(ok, 800 * (giro + 1)))
      }
    }
    this.pronto = true
    this.preparaFigure()
  }

  /* un atlante e la sua copia col blu della squadra fatto rosso; se l'immagine non arriva, null */
  atlante(src) {
    if (typeof Image === 'undefined' || !src) return Promise.resolve(null)
    return (atlanti[src] ||= new Promise(ok => {
      const img = new Image()
      img.onload = () => ok({ io: img, nem: this.ricolora(img) })
      img.onerror = () => { delete atlanti[src]; ok(null) }
      img.src = src
    }))
  }

  async caricaAtlanti() {
    [this.caserme, this.fortezze, this.opere, this.truppe] = await Promise.all([FOGLIO_CASERME, FOGLIO_FORTEZZE, FOGLIO_OPERE, FOGLIO_TRUPPE].map(src => this.atlante(src)))
    if (!this.opere || !this.truppe) throw new Error('atlante delle opere o delle truppe non caricato')     // `prepara` riprova
  }

  /* un pezzo per questo posto: il dipinto se c'è, se no quello disegnato a monte. `@` sta per il posto. Torna [atlante, rettangolo] */
  fortezza(nome) {
    const n = nome.replace('@', this.terreno.chiave)
    if (this.fortezze && FORTEZZE[n]) return [this.fortezze, FORTEZZE[n]]
    return this.opere && OPERE[n] ? [this.opere, OPERE[n]] : [null, null]
  }

  /* il blu della squadra diventa rosso: tutto quello del nemico. Il rosso del foglio resta dov'è: è il fuoco, e il drago */
  ricolora(img, sx = 0, sy = 0, w = img.width, h = img.height) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h
    const x = cv.getContext('2d'); x.drawImage(img, sx, sy, w, h, 0, 0, w, h)
    const d = x.getImageData(0, 0, w, h), a = d.data
    for (let i = 0; i < a.length; i += 4) {
      const r = a[i], g = a[i + 1], b = a[i + 2]
      if (b > r + 70 && b > g + 30) { a[i] = b; a[i + 1] = Math.round(g * 0.55); a[i + 2] = Math.round(r * 0.7) }
    }
    x.putImageData(d, 0, 0)
    return cv
  }

  /* un pezzo delle caserme dipinte, con la piazzola larga `larga` e centrata in (x, piede);
     torna l'altezza a schermo, o 0 se non c'è (e allora si disegna in codice) */
  dipinta(c, nome, x, piede, larga, lato, k = 1) {
    const dipinto = DIPINTE[nome]
    const p = dipinto || OPERE[nome], foglio = dipinto ? this.caserme : this.opere
    if (!p || !foglio) return 0
    const [sx, sy, w, h, cx, pd] = p, sc = larga / PIAZZOLA * k
    c.drawImage(foglio[lato], sx, sy, w, h, x - cx * sc, piede - pd * sc, w * sc, h * sc)
    return h * sc
  }

  /* dove sta il piede di una piazzola, a schermo */
  piede(lato, py) { return this.Y(lato === 'io' ? py : CAMPO.H - py) + this.ma(30) }

  /* la tela prende la misura che il contenitore le dà. Il mondo non si stira mai: la scala è una, il campo sta in altezza
     (i castelli spuntano dai due bordi) e di lato si vede quanto terreno lo schermo lascia */
  adatta() {
    const dpr = window.devicePixelRatio || 1
    const w = this.cv.clientWidth, h = this.cv.clientHeight
    if (!w || !h) return
    this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr)
    this.k = this.cv.width / w
    this.s = Math.min(w / LARGO_MINIMO, h / CAMPO.H)
    this.ox = (w - CAMPO.W * this.s) / 2
    this.oy = (h - CAMPO.H * this.s) / 2
    this.terreno.scorda()
    this.figure.clear()
    if (this.pronto) this.preparaFigure()
  }

  /* dal motore allo schermo: stesse coordinate, scalate */
  X(x) { return this.ox + x * this.s }
  Y(y) { return this.oy + y * this.s }
  /* una misura sul campo, in pixel dello schermo, a scala 0.85 (campo largo 306) */
  m(v) { return v * this.s / 0.85 * ZT }
  /* una misura di un edificio */
  me(v) { return v * this.s / 0.85 * ZE }
  /* gli edifici sulle piazzole */
  ma(v) { return this.me(v) * TAGLIA }
  /* le scritte e le barre dei castelli rimpiccioliscono meno delle figure: si devono leggere */
  mi(v) { return v * this.s / 0.85 * Math.max(ZOOM, 0.75) }

  /* gli eventi del motore diventano effetti a tempo */
  eventi(lista, ora) {
    for (const e of lista) {
      const durata = { colpo: 0.18, crollo: 0.7, cura: 0.7, costruita: 0.6, potenziata: 0.6, squadra: 0.4, miniera: 0.7, castello: 0.7, bomba: 0.8, bombaPronta: 0.1 }[e.tipo] || 0.4
      this.effetti.push({ ...e, t0: ora, durata })
      if (e.tipo === 'crollo' && e.che === 'caserma') this.rovine.set(`${e.lato}:${e.posto}`, EDIFICIO_DI[e.id])
      if (e.tipo === 'crollo' && e.che === 'miniera') this.rovine.set(`${e.lato}:${e.posto}`, 'miniera')
      // un crollo grosso e la bomba si sentono: il quadro trema un attimo (ma il mondo resta dov'è)
      if (e.tipo === 'bomba' || e.tipo === 'crollo') this.scossa = { t0: ora, forza: e.tipo === 'bomba' ? 5 : 3 }
    }
  }

  disegna(p, ora) {
    const c = this.ctx
    c.setTransform(this.k, 0, 0, this.k, 0, 0)
    const W = this.cv.width / this.k, H = this.cv.height / this.k
    c.clearRect(0, 0, W, H)
    c.imageSmoothingEnabled = true
    if (this.scossa) {
      const q = (ora - this.scossa.t0) / 0.32
      if (q >= 1) this.scossa = null
      else c.translate(Math.sin(ora * 71) * this.scossa.forza * (1 - q), Math.cos(ora * 57) * this.scossa.forza * (1 - q))
    }
    // ogni due secondi circa: se la tela del terreno si è svuotata, si rifà
    if (this.pronto && ora - (this.controllo || 0) > 2) { this.controllo = ora; this.terreno.controlla() }
    this.sfondo(c, W, H)
    if (!this.pronto) return
    this.aria.sotto(c, W, H, this.s, v => this.X(v), v => this.Y(v), ora)
    this.piazzole(c, p)
    // castelli, caserme e porte dall'alto in basso, così chi sta davanti copre chi sta dietro
    const edifici = [...p.castelli.map(e => [e.y, () => this.base(c, p, e.lato, ora)]),
      ...p.caserme.map(e => [e.y + 10, () => this.caserma(c, p, e, ora)]), ...p.miniere.map(e => [e.y + 10, () => this.miniera(c, p, e, ora)]),
      ...p.muri.map(e => [e.y, () => this.muro(c, e, ora)])]
    for (const [, disegna] of edifici.sort((a, b) => a[0] - b[0])) disegna()
    const ord = [...p.unita].sort((a, b) => this.Y(a.y) - this.Y(b.y))
    for (const u of ord) if (!u.vola) this.truppa(c, u, ora)
    for (const u of ord) if (u.vola) this.truppa(c, u, ora)
    this.fx(c, ora)
    this.aria.sopra(c, W, H, this.s, ora)
  }

  sfondo(c, W, H) {
    c.fillStyle = this.terreno.a.tinta; c.fillRect(0, 0, W, H)
    if (this.pronto) this.terreno.disegna(c, { W, H, k: this.k, s: this.s, X: v => this.X(v), Y: v => this.Y(v), sopra: t => this.ponte(t) })
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

  /* Una truppa già pronta alla misura dello schermo, con l'arco in mano e girata dalla parte giusta: a fotogramma è un disegno
     solo e senza scala. Con centinaia di figure è questo che pesa. Si rifanno quando cambia la misura. */
  figura(id, fg, lato) {
    const chiave = `${lato}:${fg}:${id}`
    let f = this.figure.get(chiave)
    if (f) return f
    const [sx, sy, w, h] = VESTITE[fg], k = this.k, sc = SCALA[id] * this.s / 0.85 * ZT * k
    const lw = w * sc, lh = h * sc, specchia = lato === 'nem'
    const extra = id === 'scheletri' ? lh * 0.5 : 0                       // l'arco esce dalla figura
    const mezzo = Math.ceil(lw / 2 + extra + 1), cv = document.createElement('canvas')
    cv.width = mezzo * 2; cv.height = Math.ceil(lh + 2)
    const piede = cv.height - 1, q = cv.getContext('2d')
    q.translate(mezzo, piede)
    if (specchia) q.scale(-1, 1)
    q.drawImage(this.truppe[lato], sx, sy, w, h, -lw / 2, -lh, lw, lh)
    if (specchia) q.scale(-1, 1)
    if (id === 'scheletri') arco(q, 0, 0, lw, lh, specchia, 0)
    f = { cv, piede: piede / k, alto: lh / k }
    this.figure.set(chiave, f)
    return f
  }

  /* tutte le pose di tutte le truppe, prima che serva: durante la battaglia non si prepara niente */
  preparaFigure() {
    for (const id of Object.keys(TRUPPE)) for (const fg of fotogrammiDi(id)) for (const lato of ['io', 'nem']) this.figura(id, fg, lato)
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

  /* il castello sta sul bordo e se ne vede solo un pezzo, la cima (il nemico, in alto, la base):
     è l'obiettivo finale, non deve prendere campo */
  base(c, p, lato, ora) {
    const re = p.castello(lato)
    const [foglio, pezzo] = this.fortezza('castello:@')
    const [sx, sy, w, h] = pezzo
    const lw = w * 0.56 * this.s / 0.85 * ZE, lh = h * 0.56 * this.s / 0.85 * ZE
    const x = this.X(re.x), piede = lato === 'io' ? this.Y(CAMPO.H + 60) : this.Y(60)
    if (re.hp > 0) {
      c.drawImage(foglio[lato], sx, sy, w, h, x - lw / 2, piede - lh, lw, lh)
      const y = lato === 'io' ? this.Y(CAMPO.H - 2) : piede - lh * 0.05
      for (const v of [-1, 1]) {
        const bx = x + v * lw * 0.62
        c.fillStyle = '#2b2118'; c.fillRect(bx - 1, y - this.me(58), 2, this.me(58))
        this.bandiera(c, bx, y - this.me(36), this.me(24), v, lato, ora)
      }
    } else this.ombra(c, x, lato === 'io' ? this.Y(CAMPO.H) : this.Y(0), lw * 0.4, lh * 0.1, 0.5)
    // la vita del castello: una barra grande dalla parte del campo, sempre accesa (con la vita scritta)
    const by = lato === 'io' ? piede - lh - this.mi(18) : piede + this.mi(6)
    this.barraCastello(c, x, by, re, lato)
    this.livello(c, x + this.mi(66), by + this.mi(6.5), re.liv, lato)
  }

  /* una bandiera che sventola: quattro fotogrammi già pronti, col tempo e non coi fotogrammi; `y` è il piede dell'asta */
  bandiera(c, x, y, alta, verso, lato, ora) {
    const [sx, sy, w, h] = OPERE[`stendardo:${verso > 0 ? 'd' : 's'}:${Math.floor(ora * 2.7 + x) & 3}`]
    const k = alta / h, ax = (verso > 0 ? 2 : 14) / 16 * w
    c.drawImage(this.opere[lato], sx, sy, w, h, x - ax * k, y - alta, w * k, alta)
  }

  /* la vita del castello: una targa di ferro con l'orlo d'oro, il numero in mezzo */
  barraCastello(c, x, y, re, lato) {
    const w = this.mi(112), h = this.mi(14), q = Math.max(0, re.hp / re.max), r = h * 0.28
    c.fillStyle = '#ffd97a'
    c.beginPath(); c.roundRect(x - w / 2 - 3, y - 3, w + 6, h + 6, r + 3); c.fill()
    c.fillStyle = '#1a1420'
    c.beginPath(); c.roundRect(x - w / 2 - 1.5, y - 1.5, w + 3, h + 3, r + 1); c.fill()
    if (q > 0) {
      const g = c.createLinearGradient(0, y, 0, y + h)
      if (lato === 'io') { g.addColorStop(0, '#7cc0ff'); g.addColorStop(0.5, IO); g.addColorStop(1, '#1f4f9e') }
      else { g.addColorStop(0, '#ff9c8a'); g.addColorStop(0.5, NEM); g.addColorStop(1, '#a32a22') }
      c.fillStyle = g
      c.beginPath(); c.roundRect(x - w / 2, y, Math.max(h * 0.6, w * q), h, r); c.fill()
    }
    c.fillStyle = '#fff'; c.font = `bold ${this.mi(10.5)}px "Emoji Gioco", system-ui, sans-serif`
    c.textAlign = 'center'; c.textBaseline = 'middle'
    c.shadowColor = '#000'; c.shadowBlur = 3
    c.fillText(`${Math.ceil(re.hp)}`, x, y + h / 2 + 0.5)
    c.shadowBlur = 0
  }

  /* il livello: uno scudetto del colore della squadra, orlato d'oro */
  livello(c, x, y, liv, lato) {
    c.font = `bold ${this.mi(8.5)}px "Emoji Gioco", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'
    const w = this.mi(15), h = this.mi(15), t = y - h * 0.5
    const scudo = (d) => {
      c.beginPath(); c.moveTo(x - w / 2 - d, t - d); c.lineTo(x + w / 2 + d, t - d); c.lineTo(x + w / 2 + d, t + h * 0.58)
      c.quadraticCurveTo(x + w / 2 + d, t + h * 0.86 + d, x, t + h + d * 1.6)
      c.quadraticCurveTo(x - w / 2 - d, t + h * 0.86 + d, x - w / 2 - d, t + h * 0.58); c.closePath(); c.fill()
    }
    c.fillStyle = '#ffd97a'; scudo(1.4)
    c.fillStyle = lato === 'io' ? '#1f4f9e' : '#a32a22'; scudo(0)
    c.fillStyle = '#fff'; c.fillText(liv, x, y - h * 0.04)
  }

  /* il ponte: una volta sola, dentro la tela del terreno. Il pezzo è più alto del fiume di 12 per parte: le spalle */
  ponte(c) {
    if (PONTE_DIPINTO.includes(this.terreno.chiave)) return
    const [foglio, [sx, sy, w, h]] = this.fortezza('ponte:@')
    const alto = (CAMPO.fiume.basso - CAMPO.fiume.alto + 24) * this.s, largo = alto * w / h
    c.drawImage(foglio.io, sx, sy, w, h, this.X(CAMPO.corsia) - largo / 2, this.Y(CAMPO.fiume.alto - 12), largo, alto)
  }

  /* i posti delle caserme: una base stabile sempre in vista, la piazzola del castello a torri.
     Vuota aspetta la caserma, e quando la caserma crolla resta lì. */
  piazzole(c, p) {
    for (const lato of ['io', 'nem']) POSTI.forEach(([px, py], i) => {
      // dipinte: la piazzola vuota del foglio, o il rudere della caserma crollata lì
      if (p.miniere.some(m => m.lato === lato && m.posto === i)) { this.rovine.delete(`${lato}:${i}`) }   // la miniera ci sta sopra, sulla piazzola
      if (this.caserme) {
        if (p.caserme.some(cs => cs.lato === lato && cs.posto === i)) return
        const rovina = this.rovine.get(`${lato}:${i}`), x = this.X(px), piede = this.piede(lato, py)
        if (rovina !== 'miniera') return void this.dipinta(c, rovina ? `${rovina}:rudere` : 'vuota', x, piede, this.ma(70), lato)
        this.dipinta(c, 'vuota', x, piede, this.ma(70), lato)
        this.dipinta(c, 'miniera:rudere', x, piede, this.ma(70), lato)
      }
    })
  }

  /* una miniera sulla sua piazzola; sotto il livello, sopra la vita se è ferita */
  miniera(c, p, m, ora) {
    if (!this.nate.has(m)) this.nate.set(m, p.t < 1 ? -99 : ora)
    const q = Math.min(1, (ora - this.nate.get(m)) / 0.7), k = q < 1 ? Math.max(0.05, q) : 1
    const x = this.X(m.x), piede = this.piede(m.lato, m.lato === 'io' ? m.y : CAMPO.H - m.y), stadio = m.liv >= 5 ? 2 : 1
    c.save()
    if (m.fl > 0) c.globalAlpha = 0.7
    this.dipinta(c, `miniera:${stadio}`, x, piede, this.ma(70), m.lato, k)
    c.restore()
    this.livello(c, x, piede + this.mi(4), m.liv, m.lato)
    if (m.hp < m.max) this.barra(c, x, piede - this.ma(54), this.ma(40), m.hp / m.max)
    if (m.riposo > 0) { c.font = `${this.me(13)}px "Emoji Gioco", system-ui, sans-serif`; c.textAlign = 'center'; c.fillText('💤', x - this.ma(30), piede - this.ma(30)) }
  }

  /* una caserma: l'edificio della sua truppa (scena/edifici.js), che spunta dalla sua piazzola quando
     nasce; sopra lo stemma della truppa, sotto il livello */
  caserma(c, p, cs, ora) {
    if (!this.nate.has(cs)) this.nate.set(cs, p.t < 1 ? -99 : ora)
    const q = Math.min(1, (ora - this.nate.get(cs)) / 0.7)
    const k = q < 1 ? Math.max(0.05, 1 + 2.7 * (q - 1) ** 3 + 1.7 * (q - 1) ** 2) : 1                  // spunta con un rimbalzo
    const x = this.X(cs.x), y = this.Y(cs.y) + this.ma(10), col = cs.lato === 'io' ? IO : NEM
    const scuro = cs.lato === 'io' ? '#1f4f9e' : '#a32a22'
    const u = v => this.ma(v) * 1.2 * k
    if (q < 1) {                                                                      // la polvere del cantiere
      c.fillStyle = `rgba(230,215,180,${0.7 * (1 - q)})`
      for (let i = 0; i < 6; i++) { const a = i * 1.05; c.beginPath(); c.arc(x + Math.cos(a) * this.ma(14 + 18 * q), y + Math.sin(a) * this.ma(4 + 6 * q), this.ma(8) * (1 - q * 0.6), 0, 7); c.fill() }
    }
    const stadio = cs.liv >= 5 ? 2 : 1
    const piede = this.piede(cs.lato, cs.lato === 'io' ? cs.y : CAMPO.H - cs.y)
    c.save()
    if (cs.fl > 0) c.globalAlpha = 0.7
    // dipinta se c'è il pezzo (strumenti/sprite/caserme-arena.py), se no disegnata in codice
    const alta = this.dipinta(c, `${cs.ed}:${cs.id}:${stadio}`, x, piede, this.ma(70), cs.lato, k)
    if (!alta) this.ombra(c, x + u(3), y + u(1), u(28), u(5), 0.3)
    const alto = alta ? 0 : disegnaEdificio(c, { ed: cs.ed, id: cs.id, stadio, x, y, u, col, scuro, ora })
    c.restore()
    if (alta) {
      this.livello(c, x, piede + this.mi(4), cs.liv, cs.lato)
      if (cs.hp < cs.max) this.barra(c, x, piede - alta - this.ma(6), this.ma(40), cs.hp / cs.max)
      if (cs.riposo > 0) { c.font = `${this.me(13)}px "Emoji Gioco", system-ui, sans-serif`; c.textAlign = 'center'; c.fillText('💤', x - this.ma(30), piede - alta * 0.6) }
      return
    }
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

  /* la porta in fondo al ponte: intera, rotta o crollata, e gli stendardi sulle torri finché regge.
     Quella di chi gioca la vediamo da dietro (`:dietro`), se il posto ce l'ha */
  muro(c, mu, ora) {
    const x = this.X(mu.x), stato = mu.hp <= 0 ? 'crollata' : mu.hp / mu.max < 0.5 ? 'rotta' : 'intera'
    const dietro = mu.lato === 'io' && this.fortezza(`porta:@:${stato}:dietro`)
    const [foglio, [sx, sy, w, h]] = dietro?.[0] ? dietro : this.fortezza(`porta:@:${stato}`)
    const largo = 70 * this.s, alto = largo * h / w, piede = this.Y(mu.y) + 6 * this.s
    c.save()
    if (mu.fl > 0) c.globalAlpha = 0.72
    c.drawImage(foglio[mu.lato], sx, sy, w, h, x - largo / 2, piede - alto, largo, alto)
    c.restore()
    if (mu.hp <= 0) return
    // la porta dipinta ha le sue bandiere: quelle in codice solo sulla porta disegnata a monte
    if (foglio !== this.fortezze) for (const v of [-1, 1]) this.bandiera(c, x + v * 24 * this.s, piede - 27 * this.s, 12 * this.s, v, mu.lato, ora)
    if (mu.hp < mu.max) this.barra(c, x, piede - alto - 5, this.m(40), mu.hp / mu.max)
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
    const f = this.figura(u.id, fotogramma(u.id, ora, u.cammina, sfasa), u.lato), py = y - alto - salto + scatto
    const dentro = 0.6 + 0.4 * nasce, lw = f.cv.width / this.k * dentro, lh = f.alto * dentro
    if (u.fl > 0) c.globalAlpha = 0.72
    c.drawImage(f.cv, x - lw / 2, py - f.piede * dentro, lw, f.cv.height / this.k * dentro)
    c.globalAlpha = 1
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
          for (let i = 0; i < 7; i++) { const a = i * 0.9; c.beginPath(); c.arc(x + Math.cos(a) * q * this.m(28), y + Math.sin(a) * q * this.m(18), this.m(9) * (1 - q * 0.5), 0, 7); c.fill() }
          // le schegge saltano e ricadono
          c.fillStyle = `rgba(70,58,50,${1 - q})`
          for (let i = 0; i < 9; i++) {
            const a = i * 0.7 + 0.3, d = q * this.m(30 + (i % 3) * 8)
            c.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6 - Math.sin(q * Math.PI) * this.m(20), this.m(3), this.m(3))
          }
        } else if (['costruita', 'potenziata', 'castello', 'miniera'].includes(e.tipo)) {
          c.strokeStyle = `rgba(255,220,90,${1 - q})`; c.lineWidth = 3
          c.beginPath(); c.arc(x, y, this.m(8) + q * this.m(24), 0, 7); c.stroke()
        } else if (e.tipo === 'bomba') {
          const r = this.m(e.raggio) * (0.35 + 0.65 * Math.min(1, q * 2.2))
          c.fillStyle = `rgba(255,170,60,${0.55 * (1 - q)})`; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill()
          c.strokeStyle = `rgba(255,240,170,${1 - q})`; c.lineWidth = 4; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke()
          c.strokeStyle = `rgba(255,255,255,${0.7 * (1 - q)})`; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * 1.45, 0, 7); c.stroke()
          if (q < 0.2) { c.fillStyle = `rgba(255,255,230,${0.5 * (1 - q * 5)})`; c.fillRect(0, 0, this.cv.width, this.cv.height) }
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

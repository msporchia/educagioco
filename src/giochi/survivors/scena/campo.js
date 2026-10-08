// Il campo: riceve una scena già decisa (partita.scena()) e la
// dipinge, senza sapere niente di regole. Il mondo non ha bordi:
// l'eroe sta sempre al centro dello schermo ed è il prato a scorrere
// sotto (`cx, cy` porta da mondo a schermo). Niente librerie (Pixi o
// Konva peserebbero 100-450 KB, il build resta un HTML unico).
// Fondale e creature vengono dai fogli dipinti; colpi ed effetti sono
// disegnati qui. Vedi docs/survivors/grafica.md.
import { MOSTRI } from '../dati/mostri.js'
import { OGGETTI } from '../dati/oggetti.js'
import { scenario } from '../dati/scenari.js'
import { caricaFigure, figurePronte, disegnaFigura, figuraDi, disegnaEroe } from './figure.js'
import { caricaFondale, fondalePronto, disegnaFondo, figureOstacolo, disegnaPezzo } from './fondale.js'

/* Il caso ripetibile dell'erba: lo stesso ciuffo deve stare sempre nello
   stesso punto del mondo, o il prato «bolle» mentre si cammina. */
function seme(i, j, k = 0) {
  let s = (i * 374761393 + j * 668265263 + k * 1442695041) | 0
  s = Math.imul(s ^ s >>> 13, 1274126177)
  return ((s ^ s >>> 16) >>> 0) / 4294967296
}

const POLVERE = '#e9dcae'     // le briciole sotto i piedi: polvere, non scintille

export class Campo {
  constructor(tela) {
    this.tela = tela
    this.ctx = tela?.getContext ? tela.getContext('2d') : null
    this.larghezza = 0
    this.altezza = 0
    this.misura()
    if (this.ctx) caricaFigure()
  }

  /* Il canvas alla risoluzione vera dello schermo: su un telefono
     moderno un canvas a un pixel per punto si vede sfocato. */
  misura() {
    const t = this.tela
    if (!t || !this.ctx) return this
    const r = t.getBoundingClientRect()
    const l = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height))
    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1)
    t.width = Math.floor(l * dpr)
    t.height = Math.floor(h * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.larghezza = l
    this.altezza = h
    this.velo = null
    return this
  }

  disegna(s) {
    const ctx = this.ctx
    if (!ctx) return
    const W = this.larghezza, H = this.altezza
    const veste = scenario(s.scenario)
    caricaFondale(s.scenario)
    ctx.imageSmoothingEnabled = false
    /* lo scossone di quando si è presi: forte all'inizio, poi niente */
    let sx = 0, sy = 0, forza = s.dolore > 0.55 ? (s.dolore - 0.55) / 0.45 * 7 : 0
    for (const ef of s.effetti)                      // e quello, più forte, della bomba
      if (ef.che === 'esplosione') forza = Math.max(forza, 14 * Math.max(0, ef.vita / ef.tot - 0.4) / 0.6)
    if (forza) { sx = Math.sin(s.tempo * 91) * forza; sy = Math.cos(s.tempo * 77) * forza }
    const cx = Math.round(W / 2 - s.eroe.x + sx), cy = Math.round(H / 2 - s.eroe.y + sy)
    const x0 = s.eroe.x - W / 2 - 20, x1 = s.eroe.x + W / 2 + 20
    const y0 = s.eroe.y - H / 2 - 20, y1 = s.eroe.y + H / 2 + 20

    const dipinto = fondalePronto(s.scenario)
    if (!dipinto) this.terreno(veste, s.eroe, cx, cy)
    ctx.save()
    ctx.translate(cx, cy)
    if (dipinto) disegnaFondo(ctx, s.terreno, s.scenario, x0, y0, x1, y1)

    if (s.gelo) this.aloneGelo(s.eroe, s.gelo, s.tempo)
    // si disegna solo quello che sta nello schermo: il filtro sta qui e
    // non nel motore, le regole muovono tutti i mostri lo stesso
    const dentro = (o, m = 60) => o.x > x0 - m && o.x < x1 + m && o.y > y0 - m && o.y < y1 + m
    for (const g of s.gemme) if (dentro(g, 30)) this.gemma(g, s.risucchio, s.eroe)
    for (const o of s.oggetti || []) if (dentro(o, 40)) this.oggetto(o, s.tempo)
    if (s.risucchio) this.risucchio(s.eroe, s.tempo)

    /* in ordine di profondità: chi sta più in basso passa davanti, e gli
       alberi sono in fila coi mostri */
    const fila = []
    for (const n of s.nemici) if (dentro(n)) fila.push({ y: n.y + n.r * 0.85, n })
    fila.push({ y: s.eroe.y + 15, eroe: true })
    for (const o of s.terreno ? s.terreno.dentro(x0 - 60, y0 - 10, x1 + 60, y1 + 140) : []) {
      if (!dipinto) { this.ostacoloPiatto(o, veste); continue }
      for (const f of figureOstacolo(o, s.scenario)) fila.push({ y: f.y, f })
    }
    fila.sort((a, b) => a.y - b.y)
    const e = s.eroe
    for (const c of fila) {
      if (c.n) this.mostro(c.n, s)
      else if (c.eroe) this.eroe(e, s.tempo)
      else {
        /* chi passa dietro un albero lo vede trasparente: l'eroe non sparisce mai */
        const copre = c.f.y > e.y && c.f.y - e.y < 70 && Math.abs(c.f.x - e.x) < 30
        disegnaPezzo(ctx, c.f.bioma || s.scenario, c.f.nome, c.f.x, c.f.y, c.f.scala, copre ? 0.45 : 1)
      }
    }

    for (const c of s.colpi) this.freccia(c)
    for (const p of s.palle) this.palla(p, s.tempo)
    for (const ef of s.effetti) this.effetto(ef, H, s)

    ctx.restore()
    this.atmosfera(veste, s.scenario)
    // di un muro in arrivo non si disegna niente apposta: capire da che
    // parte scansarsi è il gioco (nasceMuro nel motore)
    if (s.dolore) this.dolore(s.dolore)
  }

  // il fondo di ripiego, mentre il foglio si decodifica: erba, chiazze e
  // puntini col colore dello scenario della tappa
  terreno(veste, eroe, cx, cy) {
    const ctx = this.ctx, W = this.larghezza, H = this.altezza
    ctx.fillStyle = veste.terra
    ctx.fillRect(0, 0, W, H)
    const passo = 44
    const i0 = Math.floor((eroe.x - W / 2) / passo) - 1, i1 = Math.floor((eroe.x + W / 2) / passo) + 1
    const j0 = Math.floor((eroe.y - H / 2) / passo) - 1, j1 = Math.floor((eroe.y + H / 2) / passo) + 1
    ctx.lineCap = 'round'
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const a = seme(i, j, 1), b = seme(i, j, 2), c = seme(i, j, 3)
      const x = i * passo + a * passo + cx, y = j * passo + b * passo + cy
      if (c < 0.62) {
        ctx.strokeStyle = c < 0.3 ? veste.ciuffo[0] : veste.ciuffo[1]
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 2, y - 5, x - 4, y - 9)
        ctx.moveTo(x + 2, y); ctx.quadraticCurveTo(x + 3, y - 5, x + 6, y - 8)
        ctx.stroke()
      }
    }
  }

  ostacoloPiatto(o, veste) {
    this.ellisse(o.x, o.y, o.rx, o.ry, o.tipo === 'acqua' ? '#3b8fc4' : veste.ciuffo[0])
  }

  /* il bordo scuro che dà profondità; nella notte e nella grotta il buio
     vero, con la luce intorno all'eroe. La notte tinge tutto di blu
     (moltiplicando): il fondale è quello del giorno, macchie comprese */
  atmosfera(veste, chiave) {
    const ctx = this.ctx, W = this.larghezza, H = this.altezza
    const k = `${chiave}:${W}x${H}`
    if (!this.velo || this.velo.k !== k) {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * (veste.buio ? 0.22 : 0.42),
                                         W / 2, H / 2, Math.max(W, H) * 0.72)
      g.addColorStop(0, 'rgba(0,0,0,0)')
      g.addColorStop(1, veste.buio ? 'rgba(8,10,40,0.62)' : 'rgba(0,0,0,0.26)')
      let notte = null
      if (chiave === 'notte') {
        notte = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.12,
                                         W / 2, H / 2, Math.max(W, H) * 0.6)
        notte.addColorStop(0, '#d8dcff'); notte.addColorStop(1, '#4a5596')
      }
      this.velo = { k, g, notte }
    }
    if (this.velo.notte) {
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillStyle = this.velo.notte
      ctx.fillRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'source-over'
    }
    ctx.fillStyle = this.velo.g
    ctx.fillRect(0, 0, W, H)
  }

  cerchio(x, y, r, col) {
    const ctx = this.ctx
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29); ctx.fill()
  }

  ellisse(x, y, rx, ry, col) {
    const ctx = this.ctx
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.29); ctx.fill()
  }

  /* un alone che si somma alla luce sotto: le cose che brillano */
  bagliore(x, y, r, col, alfa = 1) {
    const ctx = this.ctx
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = alfa
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29); ctx.fill()
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  aloneGelo(eroe, r, tempo) {
    const ctx = this.ctx
    const g = ctx.createRadialGradient(eroe.x, eroe.y, r * 0.2, eroe.x, eroe.y, r)
    g.addColorStop(0, '#bff0ff10'); g.addColorStop(0.75, '#8fe0ff45'); g.addColorStop(1, '#6ecdff70')
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(eroe.x, eroe.y, r, 0, 6.29); ctx.fill()
    ctx.strokeStyle = '#d8f6ffcc'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(eroe.x, eroe.y, r, 0, 6.29); ctx.stroke()
    ctx.font = '14px "Emoji Gioco", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    for (let i = 0; i < 4; i++) {
      const a = tempo * 0.7 + i * 1.57
      ctx.fillText('❄️', eroe.x + Math.cos(a) * r * 0.86, eroe.y + Math.sin(a) * r * 0.86)
    }
  }

  eroe(e, tempo) {
    const ctx = this.ctx
    const x = e.x, y = e.y
    const dondolo = e.fermo ? 0 : Math.sin(e.passi * 0.06) * 2
    const s = e.raggio / 15
    const lampeggia = e.lampeggia && Math.floor(tempo * 12) % 2 === 0
    this.ellisse(x, y + 15 * s, 13 * s, 5 * s, '#00000040')
    const dipinto = disegnaEroe(ctx, { x, y: y + 16 * s, fermo: e.fermo, passi: e.passi, t: tempo,
                                       guarda: e.guarda, alfa: lampeggia ? 0.4 : 1 })
    ctx.save(); ctx.translate(x, y + dondolo); ctx.scale(s * e.guarda, s)
    ctx.globalAlpha = lampeggia ? 0.4 : 1

    if (e.spine) {                                     // le spine si vedono
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * 6.283 + tempo
        ctx.fillStyle = '#ffd257'
        ctx.beginPath()
        ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16 - 2)
        ctx.lineTo(Math.cos(a + 0.28) * 11, Math.sin(a + 0.28) * 11 - 2)
        ctx.lineTo(Math.cos(a - 0.28) * 11, Math.sin(a - 0.28) * 11 - 2)
        ctx.closePath(); ctx.fill()
      }
    }
    if (!dipinto) {                                    // il bambino disegnato, finché l'atlante non c'è
      ctx.fillStyle = '#3a5fc8'                          // gambe
      ctx.fillRect(-6, 4, 4.5, 8); ctx.fillRect(1.5, 4, 4.5, 8)
      ctx.fillStyle = '#7b4a2a'                          // scarpe
      ctx.fillRect(-6.5, 11, 5.5, 3.5); ctx.fillRect(1, 11, 5.5, 3.5)
      ctx.fillStyle = '#ff9f1c'                          // tunica
      ctx.beginPath(); ctx.roundRect(-9, -6, 18, 13, 5); ctx.fill()
      ctx.fillStyle = '#ffcf70'
      ctx.beginPath(); ctx.roundRect(-9, -6, 18, 5, 3); ctx.fill()
      this.cerchio(0, -12, 8.5, '#ffd9a8')               // testa
      ctx.fillStyle = '#6b3f22'                          // capelli
      ctx.beginPath(); ctx.arc(0, -13, 8.6, Math.PI * 1.03, Math.PI * 2.05); ctx.fill()
      this.cerchio(2.6, -11.5, 1.5, '#20242e')
      this.cerchio(-3.2, -11.5, 1.5, '#20242e')
      ctx.strokeStyle = '#c9622e'; ctx.lineWidth = 1.4   // bocca
      ctx.beginPath(); ctx.arc(0, -9, 2.6, 0.3, 2.84); ctx.stroke()
    }
    ctx.restore()

    /* la freccina ai piedi: dove guardano le armi direzionali. C'è solo
       quando ce n'è una, così chi non le ha non si chiede cosa sia */
    if (e.rotta !== null && e.rotta !== undefined) {
      ctx.save(); ctx.translate(x, y + 17 * s); ctx.rotate(e.rotta)
      ctx.globalAlpha = 0.85
      ctx.fillStyle = '#fff3c4'
      ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(13, -5); ctx.lineTo(13, 5); ctx.closePath(); ctx.fill()
      ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(14, 0); ctx.stroke()
      ctx.restore()
    }

    // l'arco, sempre puntato dove si spara
    ctx.save(); ctx.translate(x, y); ctx.rotate(e.mira)
    ctx.globalAlpha = lampeggia ? 0.4 : 1
    ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 3.2 * s; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.arc(14 * s, 0, 9 * s, -1.15, 1.15); ctx.stroke()
    ctx.strokeStyle = '#f4e6c8'; ctx.lineWidth = 1.2 * s
    ctx.beginPath()
    ctx.moveTo(14 * s + Math.cos(-1.15) * 9 * s, Math.sin(-1.15) * 9 * s)
    ctx.lineTo(10 * s, 0)
    ctx.lineTo(14 * s + Math.cos(1.15) * 9 * s, Math.sin(1.15) * 9 * s)
    ctx.stroke()
    ctx.restore()
    ctx.globalAlpha = 1
  }

  // un mostro: la creatura dipinta che fa le sue veci in questo scenario
  // (figure.js), o un cerchio con gli occhi finché il foglio non c'è
  mostro(n, s) {
    const ctx = this.ctx
    const m = MOSTRI[n.tipo] || MOSTRI.melma
    /* chi è in fila si lascia dietro una scia: è quello che fa leggere
       la fila come una cosa che passa, non come una folla che viene */
    if (n.rotta) {
      for (let k = 1; k <= 3; k++) {
        ctx.globalAlpha = 0.2 - k * 0.05
        this.cerchio(n.x - n.rotta.x * k * n.r * 0.9, n.y - n.rotta.y * k * n.r * 0.9,
                     n.r * (0.7 - k * 0.15), m.colore)
      }
      ctx.globalAlpha = 1
    }
    const vx = n.vx ?? (s.eroe.x - n.x), vy = n.vy ?? (s.eroe.y - n.y)
    const fatto = figurePronte() && disegnaFigura(ctx, figuraDi(s.scenario, n.tipo), {
      x: n.x, y: n.y, r: n.r, vx, vy, t: n.fase / 6,
      bianco: n.lampo > 0.3 ? n.lampo : 0, gelo: n.gelato > 0 ? 1 : 0,
    })
    let testa = n.y - n.r
    if (fatto) testa = fatto.testa
    else {
      this.ellisse(n.x, n.y + n.r * 0.85, n.r * 0.85, n.r * 0.3, '#00000030')
      this.cerchio(n.x, n.y, n.r, n.lampo > 0.35 ? '#ffffff' : m.colore)
      for (const lato of [-1, 1]) {
        this.cerchio(n.x + lato * n.r * 0.32, n.y - n.r * 0.1, n.r * 0.26, '#fff')
        this.cerchio(n.x + lato * n.r * 0.32, n.y - n.r * 0.1, n.r * 0.13, '#1a1d26')
      }
    }
    // la barra della vita solo per chi ne ha tanta
    if (n.vitaMax >= 4 && n.vita < n.vitaMax) {
      const w = n.r * 1.7, q = Math.max(0, n.vita / n.vitaMax)
      ctx.fillStyle = '#00000066'; ctx.fillRect(n.x - w / 2 - 1, testa - 7, w + 2, 6)
      ctx.fillStyle = q > 0.5 ? '#7bf07b' : q > 0.25 ? '#ffc93c' : '#ff5c7a'
      ctx.fillRect(n.x - w / 2, testa - 6, w * q, 4)
    }
  }

  // tre frecce che si distinguono a colpo d'occhio: bianca la normale,
  // dorata quella fortunata, azzurra quella che gela
  freccia(c) {
    const ctx = this.ctx
    if (c.lancia) return this.lancia(c)
    const col = c.gelida ? '#9fe4ff' : c.oro ? '#ffd257' : '#fff6d8'
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a)
    const L = c.r * 2.6
    /* la scia: si somma alla luce, quindi sul buio si accende */
    const g = ctx.createLinearGradient(-L * 4, 0, 0, 0)
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, col)
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = 0.55
    ctx.strokeStyle = g; ctx.lineWidth = c.r * 1.3; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(-L * 4, 0); ctx.lineTo(0, 0); ctx.stroke()
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = Math.max(1.6, c.r * 0.45)
    ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(L * 0.5, 0); ctx.stroke()
    ctx.fillStyle = col
    ctx.beginPath(); ctx.moveTo(L * 1.05, 0); ctx.lineTo(L * 0.3, -c.r * 0.8); ctx.lineTo(L * 0.3, c.r * 0.8)
    ctx.closePath(); ctx.fill()
    ctx.fillStyle = c.oro ? '#ffb703' : c.gelida ? '#7fd4ff' : '#ff5470'
    for (const lato of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(-L * 0.7, 0); ctx.lineTo(-L * 1.05, lato * c.r * 0.7)
      ctx.lineTo(-L * 0.85, 0); ctx.closePath(); ctx.fill()
    }
    ctx.restore()
    if (c.oro || c.gelida) this.bagliore(c.x, c.y, c.r * 3, col, 0.6)
  }

  // più lunga e grossa di una freccia: si deve vedere che è un'altra arma
  lancia(c) {
    const ctx = this.ctx
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a)
    const L = 30
    const g = ctx.createLinearGradient(-L * 2.6, 0, -L * 0.5, 0)
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,240,200,0.8)')
    ctx.globalCompositeOperation = 'lighter'
    ctx.strokeStyle = g; ctx.lineWidth = 10; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(-L * 2.6, 0); ctx.lineTo(-L * 0.5, 0); ctx.stroke()
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(L * 0.55, 0); ctx.stroke()
    ctx.strokeStyle = '#d9c1a0'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(-L, -1); ctx.lineTo(L * 0.55, -1); ctx.stroke()
    ctx.fillStyle = '#e8eef5'
    ctx.beginPath(); ctx.moveTo(L, 0); ctx.lineTo(L * 0.45, -6); ctx.lineTo(L * 0.55, 0)
    ctx.lineTo(L * 0.45, 6); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#ff5470'
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(-L - 7, s * 5); ctx.lineTo(-L - 9, 0); ctx.closePath(); ctx.fill()
    }
    ctx.restore()
    this.bagliore(c.x + Math.cos(c.a) * L, c.y + Math.sin(c.a) * L, 14, '#ffffff', 0.5)
  }

  // una cometa: un sasso infuocato con la coda, che fa vedere da che
  // parte gira (la coda sta dietro, ad `a - 90°`: sottrarre la
  // metterebbe davanti e la cometa sembrerebbe girare al contrario)
  palla(p, tempo) {
    const r = p.r || 15
    const coda = p.a - 1.5708
    this.bagliore(p.x, p.y, r * 3.2, '#ff8a3c', 0.7)
    for (let k = 1; k <= 7; k++) {
      const d = k * r * 0.55
      const q = 1 - k / 8
      const tremo = Math.sin(tempo * 30 + k * 2.1) * r * 0.12
      this.bagliore(p.x + Math.cos(coda) * d + tremo, p.y + Math.sin(coda) * d - tremo,
                    r * q * 1.1, k > 3 ? '#ff6b1f' : '#ffd27a', 0.9)
    }
    this.cerchio(p.x, p.y, r * 0.92, '#ffe6b0')
    this.cerchio(p.x - r * 0.22, p.y - r * 0.26, r * 0.42, '#fffdf2')
    const ctx = this.ctx
    ctx.strokeStyle = '#ff6b1f'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.92, 0, 6.29); ctx.stroke()
  }

  effetto(e, H, s) {
    const ctx = this.ctx
    const q = Math.max(0, e.vita / e.tot)          // da 1 a 0
    if (e.che === 'briciola') {
      if (e.colore === POLVERE) {                   // la polvere: morbida, si allarga
        ctx.globalAlpha = q * 0.5
        this.cerchio(e.x, e.y, e.r * (1.8 - q), e.colore)
        ctx.globalAlpha = 1
        return
      }
      /* una scintilla: una riga lungo la sua corsa che si somma alla luce */
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = q
      ctx.strokeStyle = e.colore; ctx.lineWidth = e.r * 0.9; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(e.x, e.y)
      ctx.lineTo(e.x - (e.vx || 0) * 0.045, e.y - (e.vy || 0) * 0.045); ctx.stroke()
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    } else if (e.che === 'anello') {
      const p = 1 - q
      const r = e.r0 + (e.r - e.r0) * (1 - (1 - p) * (1 - p))
      ctx.globalCompositeOperation = 'lighter'
      /* un velo sul bordo interno, mai al centro: l'anello parte
         dall'eroe, e un disco pieno lo coprirebbe */
      if (r > 30) {
        ctx.globalAlpha = q * 0.25
        const g = ctx.createRadialGradient(e.x, e.y, r * 0.75, e.x, e.y, r)
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, e.colore)
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, 6.29); ctx.fill()
      }
      ctx.globalAlpha = q
      ctx.strokeStyle = e.colore; ctx.lineWidth = 8 * q + 1.5
      ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, 6.29); ctx.stroke()
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    } else if (e.che === 'fendente') {
      /* la lama passa da un lato all'altro: una falce chiara col filo
         bianco davanti e la scia che sbiadisce dietro */
      const p = 1 - q
      const giro = Math.min(1, p * 2.2)
      const da = e.a - e.apertura, fino = da + 2 * e.apertura * giro
      const R = e.r * (1.02 - 0.08 * q)
      ctx.globalCompositeOperation = 'lighter'
      for (let k = 0; k < 6; k++) {
        const a0 = fino - (k + 1) * 0.22, a1 = fino - k * 0.22
        if (a1 < da) break
        ctx.globalAlpha = q * (0.55 - k * 0.08)
        ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 16 - k * 2
        ctx.beginPath(); ctx.arc(e.x, e.y, R - 8, Math.max(da, a0), a1); ctx.stroke()
      }
      ctx.globalAlpha = q
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.arc(e.x, e.y, R, da, fino); ctx.stroke()
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    } else if (e.che === 'saetta') {
      /* il fulmine: spezzato, coi rami, e lo scoppio di luce dove cade.
         Si ridisegna a ogni fotogramma diverso: trema */
      const t = Math.floor(e.vita * 60)
      const punti = [[e.x + (seme(t, 1) - 0.5) * 40, e.y - H]]
      for (let k = 1; k <= 7; k++)
        punti.push([e.x + (seme(t, k, 3) - 0.5) * 34 * (1 - k / 8), e.y - H * (1 - k / 7)])
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      for (const [w, col, al] of [[14, '#8f9bff', 0.35], [6, '#fff59a', 0.8], [2.2, '#ffffff', 1]]) {
        ctx.globalAlpha = q * al
        ctx.strokeStyle = col; ctx.lineWidth = w
        ctx.beginPath(); punti.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
        ctx.stroke()
      }
      ctx.globalAlpha = q * 0.7
      ctx.strokeStyle = '#fff59a'; ctx.lineWidth = 2
      for (let k = 2; k <= 5; k += 3) {                // due rami
        const [bx, by] = punti[k]
        const lato = seme(t, k, 9) < 0.5 ? -1 : 1
        ctx.beginPath(); ctx.moveTo(bx, by)
        ctx.lineTo(bx + lato * 24, by + H * 0.06); ctx.lineTo(bx + lato * 34, by + H * 0.13); ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      this.bagliore(e.x, e.y, 46, '#fff59a', q)
      this.bagliore(e.x, e.y, 20, '#ffffff', q)
    } else if (e.che === 'morte') {
      /* la creatura si schiaccia, s'imbianca e sparisce in uno sbuffo */
      const p = 1 - q
      const m = MOSTRI[e.tipo] || MOSTRI.melma
      this.bagliore(e.x, e.y, e.r * (1.4 + p * 1.6), m.colore, q * 0.8)
      if (figurePronte())
        disegnaFigura(ctx, figuraDi(s.scenario, e.tipo), {
          x: e.x, y: e.y, r: e.r, vx: e.verso || 1, vy: 0, t: 0,
          bianco: Math.max(0, 1 - p * 2.5), schiaccia: Math.min(1, p * 1.6), alfa: q, ombra: false,
        })
      ctx.globalAlpha = q * 0.5
      for (let k = 0; k < 5; k++) {
        const a = k * 1.256 + e.x * 0.01
        this.cerchio(e.x + Math.cos(a) * e.r * p * 1.4, e.y + Math.sin(a) * e.r * p * 0.7 - p * 6,
                     e.r * 0.35 * q + 1.5, '#ffffff')
      }
      ctx.globalAlpha = 1
    } else if (e.che === 'esplosione') {
      /* la bomba: un lampo bianco, la palla di fuoco, l'onda che corre
         fino al bordo di quello che prende */
      const p = 1 - q
      if (p < 0.15) {
        ctx.globalAlpha = (0.15 - p) / 0.15 * 0.8
        ctx.fillStyle = '#fffbe6'
        ctx.fillRect(e.x - 2000, e.y - 2000, 4000, 4000)
        ctx.globalAlpha = 1
      }
      this.bagliore(e.x, e.y, e.r * (0.4 + p * 0.5), '#ffb347', q)
      this.bagliore(e.x, e.y, e.r * 0.3 * (1 - p), '#ffffff', q)
      ctx.globalCompositeOperation = 'lighter'
      const onda = e.r * Math.min(1, p * 2.2)
      ctx.globalAlpha = q
      ctx.strokeStyle = '#ffe2a0'; ctx.lineWidth = 14 * q + 2
      ctx.beginPath(); ctx.arc(e.x, e.y, onda, 0, 6.29); ctx.stroke()
      ctx.strokeStyle = '#ff6b3c'; ctx.lineWidth = 5 * q + 1
      ctx.beginPath(); ctx.arc(e.x, e.y, onda * 0.82, 0, 6.29); ctx.stroke()
      for (let k = 0; k < 16; k++) {                   // le schegge
        const a = k * 0.3927 + 0.2
        const d = e.r * (0.2 + p * 1.1) * (0.7 + seme(k, 7) * 0.5)
        ctx.strokeStyle = k % 2 ? '#ffd257' : '#ff8a3c'; ctx.lineWidth = 3
        ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * d * 0.8, e.y + Math.sin(a) * d * 0.8)
        ctx.lineTo(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d); ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    } else if (e.che === 'luce') {
      /* salire di livello: una colonna di luce sull'eroe, e stelline che salgono */
      const p = 1 - q
      ctx.globalCompositeOperation = 'lighter'
      const g = ctx.createLinearGradient(0, e.y - H * 0.6, 0, e.y + 10)
      g.addColorStop(0, 'rgba(255,233,138,0)'); g.addColorStop(1, 'rgba(255,233,138,0.4)')
      ctx.fillStyle = g
      const w = 30 + 24 * Math.sin(p * 3.14)
      for (const [k, a] of [[1, 0.35], [0.6, 0.5], [0.25, 0.9]]) {   // tre strati: il fascio sfuma ai lati
        ctx.globalAlpha = q * a
        ctx.fillRect(e.x - w * k / 2, e.y - H * 0.6, w * k, H * 0.6 + 10)
      }
      ctx.globalAlpha = q
      for (let k = 0; k < 8; k++) {
        const x = e.x + Math.sin(k * 2.4 + p * 6) * 22
        const y = e.y + 10 - p * (90 + k * 14)
        this.cerchio(x, y, 2.4, '#fff3b0')
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  // una gemma: un cristallo che brilla. Quando la calamita trovata a
  // terra sta tirando, lascia una scia verso l'eroe
  gemma(g, tirata = false, eroe = null) {
    const ctx = this.ctx
    const s = 5 + Math.min(4, g.val) * 0.8
    const oro = g.val > 1
    const col = oro ? '#ffd257' : '#4fc3ff'
    const su = Math.sin(g.fase) * 1.6
    if (tirata && eroe) {
      const dx = eroe.x - g.x, dy = eroe.y - g.y, d = Math.hypot(dx, dy) || 1
      ctx.globalAlpha = 0.45
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(g.x, g.y)
      ctx.lineTo(g.x - dx / d * Math.min(26, d), g.y - dy / d * Math.min(26, d)); ctx.stroke()
      ctx.globalAlpha = 1
    }
    this.ellisse(g.x, g.y + s * 1.3, s * 0.7, s * 0.25, '#00000033')
    this.bagliore(g.x, g.y - su, s * 2.6, col, 0.55)
    const x = g.x, y = g.y - su
    ctx.fillStyle = oro ? '#e0a020' : '#1f8fd6'                 // il lato in ombra
    ctx.beginPath(); ctx.moveTo(x, y - s * 1.3); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s * 1.3); ctx.closePath(); ctx.fill()
    ctx.fillStyle = col                                         // il lato in luce
    ctx.beginPath(); ctx.moveTo(x, y - s * 1.3); ctx.lineTo(x - s, y); ctx.lineTo(x, y + s * 1.3); ctx.closePath(); ctx.fill()
    ctx.fillStyle = oro ? '#fff2b8' : '#d4f4ff'
    ctx.beginPath(); ctx.moveTo(x, y - s * 1.3); ctx.lineTo(x - s * 0.5, y - s * 0.2); ctx.lineTo(x, y); ctx.closePath(); ctx.fill()
    const lampo = Math.sin(g.fase * 1.3)                        // ogni tanto un luccichio
    if (lampo > 0.9) {
      const l = (lampo - 0.9) * 10 * s
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.moveTo(x + s * 0.4 - l, y - s * 0.5); ctx.lineTo(x + s * 0.4 + l, y - s * 0.5)
      ctx.moveTo(x + s * 0.4, y - s * 0.5 - l); ctx.lineTo(x + s * 0.4, y - s * 0.5 + l); ctx.stroke()
    }
  }

  // un oggetto a terra: disegnato e non emoji, con un alone che pulsa
  // (si vede da lontano) e lampeggia negli ultimi due secondi prima di sparire
  oggetto(o, tempo) {
    const ctx = this.ctx
    const scheda = OGGETTI[o.tipo]
    if (!scheda) return
    if (o.resta < 2 && Math.floor(tempo * 8) % 2 === 0) return
    const su = Math.sin(o.fase) * 3
    const x = o.x, y = o.y - 6 + su
    this.ellisse(o.x, o.y + 9, 11, 4, '#00000030')
    this.bagliore(x, y, 30, scheda.colore, 0.45 + 0.2 * Math.sin(o.fase * 2))
    ctx.save(); ctx.translate(x, y)
    if (o.tipo === 'cuore') {
      ctx.fillStyle = scheda.colore
      ctx.beginPath()
      ctx.moveTo(0, 9)
      ctx.bezierCurveTo(-14, -2, -8, -13, 0, -6)
      ctx.bezierCurveTo(8, -13, 14, -2, 0, 9)
      ctx.fill()
      this.ellisse(-4, -5, 2.5, 1.6, '#ffffffaa')
    } else if (o.tipo === 'calamita') {
      /* una U rossa con le punte chiare: il ferro di cavallo che tutti
         riconoscono */
      ctx.strokeStyle = scheda.colore; ctx.lineWidth = 6; ctx.lineCap = 'butt'
      ctx.beginPath(); ctx.arc(0, -2, 8, Math.PI, 0); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(-8, 8); ctx.moveTo(8, -2); ctx.lineTo(8, 8); ctx.stroke()
      ctx.fillStyle = '#e8f4ff'
      ctx.fillRect(-11, 5, 6, 5); ctx.fillRect(5, 5, 6, 5)
    } else if (o.tipo === 'bomba') {
      /* la bomba dei fumetti: palla nera, lucido, miccia con la scintilla */
      this.cerchio(0, 2, 9, '#2b2f3a')
      this.cerchio(-3, -1, 3, '#5d6476')
      ctx.fillStyle = '#6b7080'; ctx.fillRect(-3, -9, 6, 4)
      ctx.strokeStyle = '#c9a46a'; ctx.lineWidth = 2; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(4, -14, 8, -12); ctx.stroke()
      this.bagliore(8, -12, 7 + 2 * Math.sin(tempo * 20), '#ffd257', 1)
      this.cerchio(8, -12, 1.8, '#fff6c0')
    } else if (o.tipo === 'cassa') {
      ctx.fillStyle = scheda.colore
      ctx.beginPath(); ctx.roundRect(-11, -8, 22, 18, 3); ctx.fill()
      ctx.fillStyle = '#8a5a2b'
      ctx.fillRect(-11, -1, 22, 3)
      ctx.fillRect(-2, -8, 4, 18)
      ctx.fillStyle = '#ffe98a'
      ctx.beginPath(); ctx.roundRect(-4, -4, 8, 8, 2); ctx.fill()
      this.cerchio(0, 0, 1.6, '#8a5a2b')
    }
    ctx.restore()
  }

  /* la calamita trovata a terra sta tirando: un cerchio che si allarga
     intorno all'eroe, così si capisce perché tutto vola da lui */
  risucchio(eroe, tempo) {
    const ctx = this.ctx
    const q = (tempo * 1.4) % 1
    ctx.globalAlpha = 0.35 * (1 - q)
    ctx.strokeStyle = OGGETTI.calamita.colore; ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(eroe.x, eroe.y, 40 + 160 * (1 - q), 0, 6.29); ctx.stroke()
    ctx.globalAlpha = 1
  }

  /* il bordo rosso quando si è appena presi: a schermo pieno di roba, un
     cuore che sparisce in cima non lo vede nessuno */
  dolore(q) {
    const ctx = this.ctx, W = this.larghezza, H = this.altezza
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.28,
                                       W / 2, H / 2, Math.max(W, H) * 0.7)
    g.addColorStop(0, '#ff000000')
    g.addColorStop(1, `rgba(255,40,60,${0.45 * q})`)
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  }
}

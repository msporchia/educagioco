/* ═══════════════════════════════════════════════════════════════════
   IL CAMPO — quello che si vede, e nient'altro

   Riceve una scena già decisa (`partita.scena()`) e la dipinge. Qui
   dentro non c'è una regola: non si sa quanto vale una gemma, quanti
   cuori restano, cosa costa una carta. Si sa che quel mostro è un fungo
   e che l'alone di ghiaccio ha raggio 86, e li si disegna.

   Il mondo non ha bordi: l'eroe sta sempre al centro dello schermo ed è
   il prato a scorrere sotto. Da qui la sola riga di conto che c'è in
   questo file — `cx, cy`, che porta da mondo a schermo.

   Niente librerie: Pixi o Konva peserebbero da 100 a 450 KB e il build
   deve restare un HTML unico.
   ═══════════════════════════════════════════════════════════════════ */
import { MOSTRI } from '../dati/mostri.js'
import { scenario } from '../dati/scenari.js'

/* Il caso ripetibile dell'erba: lo stesso ciuffo deve stare sempre nello
   stesso punto del mondo, o il prato «bolle» mentre si cammina. */
function seme(i, j, k = 0) {
  let s = (i * 374761393 + j * 668265263 + k * 1442695041) | 0
  s = Math.imul(s ^ s >>> 13, 1274126177)
  return ((s ^ s >>> 16) >>> 0) / 4294967296
}

const mescola = (a, b, q) => {
  const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16))
  const A = p(a), B = p(b)
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * q).toString(16).padStart(2, '0')).join('')
}

export class Campo {
  constructor(tela) {
    this.tela = tela
    this.ctx = tela?.getContext ? tela.getContext('2d') : null
    this.larghezza = 0
    this.altezza = 0
    this.misura()
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
    return this
  }

  disegna(s) {
    const ctx = this.ctx
    if (!ctx) return
    const W = this.larghezza, H = this.altezza
    const veste = scenario(s.scenario)
    const cx = W / 2 - s.eroe.x, cy = H / 2 - s.eroe.y     // da mondo a schermo

    this.terreno(veste, s.eroe, cx, cy)
    ctx.save()
    ctx.translate(cx, cy)

    if (s.gelo) this.aloneGelo(s.eroe, s.gelo, s.tempo)
    /* ── si disegna solo quello che sta nello schermo ──
       Il campo non ha muri: chi non hai ucciso ti segue anche da tre
       schermate di distanza, e quando la marea è alta sono centinaia di
       mostri che nessuno sta guardando. Disegnarli costava un mostro
       intero per ognuno — corpo, ombra, occhi, zampe — per niente. Il
       filtro sta qui e non nel motore: le regole li muovono tutti lo
       stesso, cambia solo chi finisce sul vetro. */
    const dentro = (o, m = 60) => {
      const px = o.x + cx, py = o.y + cy
      return px > -m && px < W + m && py > -m && py < H + m
    }
    for (const g of s.gemme) if (dentro(g, 30)) this.gemma(g)
    /* ordinati per profondità: chi sta più in basso passa davanti */
    const ordinati = s.nemici.filter(n => dentro(n)).sort((a, b) => a.y - b.y)
    for (const n of ordinati) this.mostro(n, s.eroe)
    this.eroe(s.eroe, s.tempo)
    for (const c of s.colpi) this.freccia(c)
    for (const p of s.palle) this.palla(p)
    for (const e of s.effetti) this.effetto(e, H)

    ctx.restore()
    if (s.dolore) this.dolore(s.dolore)
  }

  /* ═══════════ il fondo ═══════════
     Erba, chiazze e puntini che scorrono col mondo. I colori arrivano
     dallo scenario della tappa: la stessa funzione fa il prato, la neve e
     la grotta senza sapere cosa siano. */
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
      if ((i + j) % 2 === 0) {                       // chiazze appena diverse
        ctx.fillStyle = veste.chiazza
        ctx.beginPath(); ctx.ellipse(x, y, 26, 18, a * 3, 0, 6.29); ctx.fill()
      }
      if (c < 0.62) {                                // un ciuffo a V
        ctx.strokeStyle = c < 0.3 ? veste.ciuffo[0] : veste.ciuffo[1]
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 2, y - 5, x - 4, y - 9)
        ctx.moveTo(x + 2, y); ctx.quadraticCurveTo(x + 3, y - 5, x + 6, y - 8)
        ctx.stroke()
      } else if (c < 0.70) {                         // un fiorellino (o un sasso, o una stella)
        const col = veste.puntini[Math.floor(a * 3)]
        for (let k = 0; k < 5; k++) {
          const t = k / 5 * 6.29
          this.cerchio(x + Math.cos(t) * 3, y + Math.sin(t) * 3, 2.2, col)
        }
        this.cerchio(x, y, 1.6, veste.ciuffo[0])
      }
    }
  }

  cerchio(x, y, r, col) {
    const ctx = this.ctx
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29); ctx.fill()
  }

  ellisse(x, y, rx, ry, col) {
    const ctx = this.ctx
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.29); ctx.fill()
  }

  /* ═══════════ l'alone di ghiaccio ═══════════ */
  aloneGelo(eroe, r, tempo) {
    const ctx = this.ctx
    const g = ctx.createRadialGradient(eroe.x, eroe.y, r * 0.2, eroe.x, eroe.y, r)
    g.addColorStop(0, '#bff0ff10'); g.addColorStop(0.75, '#8fe0ff45'); g.addColorStop(1, '#6ecdff70')
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(eroe.x, eroe.y, r, 0, 6.29); ctx.fill()
    ctx.strokeStyle = '#d8f6ffcc'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(eroe.x, eroe.y, r, 0, 6.29); ctx.stroke()
    ctx.font = '14px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    for (let i = 0; i < 4; i++) {
      const a = tempo * 0.7 + i * 1.57
      ctx.fillText('❄️', eroe.x + Math.cos(a) * r * 0.86, eroe.y + Math.sin(a) * r * 0.86)
    }
  }

  /* ═══════════ l'eroe: un bambino arciere ═══════════ */
  eroe(e, tempo) {
    const ctx = this.ctx
    const x = e.x, y = e.y
    const dondolo = e.fermo ? 0 : Math.sin(e.passi * 0.06) * 2
    const s = e.raggio / 15
    const lampeggia = e.lampeggia && Math.floor(tempo * 12) % 2 === 0
    this.ellisse(x, y + 15 * s, 13 * s, 5 * s, '#00000033')
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
    ctx.restore()

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

  /* ═══════════ un mostro ═══════════
     Il corpo è diverso per tipo apposta: un cerchio uguale per tutti li
     faceva sembrare tutti la stessa palla con gli occhi, e un bambino
     impara «quello grigio non muore» guardandolo, non leggendolo. */
  mostro(n, eroe) {
    const ctx = this.ctx
    const m = MOSTRI[n.tipo] || MOSTRI.melma
    const salto = Math.abs(Math.sin(n.fase * 0.5)) * 3
    const x = n.x, y = n.y - salto
    this.ellisse(n.x, n.y + n.r * 0.85, n.r * 0.85, n.r * 0.3, '#00000030')
    const colore = n.lampo > 0.35 ? '#ffffff'
      : (n.gelato ? mescola(m.colore, '#9fe4ff', 0.55) : m.colore)
    const scuro = n.gelato ? '#4a9dc8' : m.scuro

    if (n.tipo === 'pipistrello') {                     // ali che sbattono
      const ap = Math.sin(n.fase) * 5
      ctx.fillStyle = scuro
      for (const lato of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.quadraticCurveTo(x + lato * n.r * 1.6, y - 8 - ap, x + lato * n.r * 2.0, y + 2)
        ctx.quadraticCurveTo(x + lato * n.r * 1.1, y + 2 + ap, x, y + 4)
        ctx.closePath(); ctx.fill()
      }
    }
    if (n.tipo === 'moscerino') {                       // due alucce che frullano
      const ap = Math.sin(n.fase * 2.2) * 3
      ctx.fillStyle = '#ffffff88'
      for (const lato of [-1, 1])
        this.ellisse(x + lato * n.r * 0.9, y - 3 - ap * 0.3, n.r * 0.75, n.r * 0.34, '#ffffff88')
    }
    if (n.tipo === 'ragno') {                           // otto zampe che frugano
      ctx.strokeStyle = scuro; ctx.lineWidth = 2.2; ctx.lineCap = 'round'
      for (const lato of [-1, 1]) {
        for (let k = 0; k < 4; k++) {
          const su = (k - 1.5) * 0.42
          const piega = Math.sin(n.fase * 1.6 + k * 1.7) * 3
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.quadraticCurveTo(x + lato * n.r * 1.4, y + su * n.r - piega,
                               x + lato * n.r * 1.9, y + su * n.r * 1.5 + piega)
          ctx.stroke()
        }
      }
    }
    if (n.tipo === 'cinghiale') {                       // zanne e groppa ispida
      ctx.fillStyle = scuro
      for (const lato of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(x + lato * n.r * 0.75, y + n.r * 0.25)
        ctx.quadraticCurveTo(x + lato * n.r * 1.25, y + n.r * 0.1,
                             x + lato * n.r * 1.05, y - n.r * 0.45)
        ctx.lineTo(x + lato * n.r * 0.72, y + n.r * 0.05)
        ctx.closePath(); ctx.fill()
      }
      ctx.beginPath()
      for (let k = 0; k <= 4; k++) {
        const px = x - n.r * 0.7 + (k / 4) * n.r * 1.4
        ctx.moveTo(px, y - n.r * 0.75); ctx.lineTo(px + 2, y - n.r * 1.15)
      }
      ctx.strokeStyle = scuro; ctx.lineWidth = 3; ctx.stroke()
    }
    if (n.tipo === 'spettro') {                         // codina ondulata
      ctx.fillStyle = colore
      ctx.beginPath()
      ctx.moveTo(x - n.r, y)
      ctx.lineTo(x - n.r, y + n.r * 0.9)
      for (let k = 0; k <= 4; k++) {
        const px = x - n.r + (k / 4) * n.r * 2
        ctx.lineTo(px, y + n.r * (0.9 + 0.35 * Math.sin(n.fase + k)))
      }
      ctx.lineTo(x + n.r, y); ctx.closePath(); ctx.fill()
    }

    let occhiY = -0.1
    if (n.tipo === 'fungo') {                           // gambo chiaro e cappello a pois
      ctx.fillStyle = n.lampo > 0.35 ? '#fff' : '#f6efdc'
      ctx.beginPath()
      ctx.roundRect(x - n.r * 0.52, y - n.r * 0.1, n.r * 1.04, n.r * 1.15, n.r * 0.4)
      ctx.fill()
      ctx.fillStyle = colore
      ctx.beginPath(); ctx.ellipse(x, y - n.r * 0.1, n.r * 1.15, n.r * 0.9, 0, Math.PI, 0); ctx.fill()
      ctx.fillRect(x - n.r * 1.15, y - n.r * 0.16, n.r * 2.3, n.r * 0.1)
      for (const [dx, dy] of [[-0.55, -0.42], [0.5, -0.38], [0, -0.68], [-0.05, -0.2]])
        this.ellisse(x + dx * n.r, y + dy * n.r, n.r * 0.2, n.r * 0.16, '#fff6e0')
      occhiY = 0.42
    } else if (n.tipo === 'roccia') {                   // un sasso spigoloso
      ctx.fillStyle = colore; ctx.beginPath()
      const spigoli = [[-1, -.35], [-.55, -.95], [.4, -1], [1, -.25], [.75, .8], [-.35, 1], [-.95, .5]]
      spigoli.forEach(([dx, dy], i) => {
        const px = x + dx * n.r, py = y + dy * n.r
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
      })
      ctx.closePath(); ctx.fill()
      ctx.strokeStyle = scuro; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(x - n.r * 0.75, y - n.r * 0.55); ctx.lineTo(x - n.r * 0.3, y - n.r * 0.15)
      ctx.lineTo(x - n.r * 0.6, y + n.r * 0.55); ctx.stroke()
    } else if (n.tipo === 'colosso') {                  // un bestione a placche
      this.cerchio(x, y, n.r, colore)
      ctx.fillStyle = scuro
      ctx.beginPath()
      ctx.ellipse(x, y - n.r * 0.55, n.r * 0.95, n.r * 0.45, 0, Math.PI, 0)
      ctx.fill()
      for (const lato of [-1, 1])                       // spallacci
        this.ellisse(x + lato * n.r * 0.82, y - n.r * 0.1, n.r * 0.42, n.r * 0.5, scuro)
      ctx.strokeStyle = '#ffffff33'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(x, y, n.r * 0.62, 0.5, 2.4); ctx.stroke()
    } else if (n.tipo === 'melma') {                    // una gelatina che si schiaccia
      const molla = Math.sin(n.fase * 0.5) * 0.08
      this.ellisse(x, y + n.r * 0.1, n.r * (1.08 - molla), n.r * (0.92 + molla), colore)
    } else {
      this.cerchio(x, y, n.r, colore)
    }
    if (n.tipo !== 'fungo')                             // il lucido dà volume
      this.ellisse(x - n.r * 0.3, y - n.r * 0.42, n.r * 0.34, n.r * 0.24, '#ffffff55')

    // occhi che guardano l'eroe
    const a = Math.atan2(eroe.y - n.y, eroe.x - n.x)
    const ox = Math.cos(a) * n.r * 0.16, oy = Math.sin(a) * n.r * 0.16
    const ro = n.r * (n.tipo === 'fungo' ? 0.21 : 0.27)
    for (const lato of [-1, 1]) {
      const ex = x + lato * ro * 1.2, ey = y + n.r * occhiY
      this.cerchio(ex, ey, ro, '#fff')
      this.cerchio(ex + ox, ey + oy, ro * 0.52, '#1a1d26')
    }
    // barra della vita solo per chi ne ha tanta
    if (n.vitaMax >= 4 && n.vita < n.vitaMax) {
      const w = n.r * 1.7
      ctx.fillStyle = '#00000055'; ctx.fillRect(x - w / 2, y - n.r - 8, w, 4)
      ctx.fillStyle = '#7bf07b'
      ctx.fillRect(x - w / 2, y - n.r - 8, w * Math.max(0, n.vita / n.vitaMax), 4)
    }
  }

  /* ═══════════ una freccia ═══════════ */
  freccia(c) {
    const ctx = this.ctx
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a)
    const L = c.r * 2.6
    /* tre frecce diverse, e si distinguono a colpo d'occhio: bianca la
       normale, dorata quella fortunata che fa il doppio, azzurra quella
       che gela — se non si vedesse, il dardo di ghiaccio sarebbe una
       carta che il bambino paga senza sapere se sta funzionando */
    const asta = c.gelida ? '#bfefff' : c.oro ? '#ffd257' : '#fff3c4'
    const punta = c.gelida ? '#7fd4ff' : c.oro ? '#ffb703' : '#ffffff'
    ctx.strokeStyle = asta
    ctx.lineWidth = c.r * 0.7; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(L * 0.5, 0); ctx.stroke()
    ctx.fillStyle = punta
    ctx.beginPath(); ctx.moveTo(L, 0); ctx.lineTo(L * 0.1, -c.r * 0.85); ctx.lineTo(L * 0.1, c.r * 0.85)
    ctx.closePath(); ctx.fill()
    ctx.globalAlpha = 0.35
    ctx.strokeStyle = c.gelida ? '#9fe4ff' : c.oro ? '#ffd25755' : '#ffffff55'
    ctx.lineWidth = c.r * 1.5
    ctx.beginPath(); ctx.moveTo(-L * 2.4, 0); ctx.lineTo(-L, 0); ctx.stroke()
    ctx.globalAlpha = 1
    ctx.restore()
  }

  /* ═══════════ una cometa in orbita ═══════════
     Era un'emoji del pallone appiccicata sul campo. Adesso è un sasso
     infuocato con la coda: la coda è la parte che conta, perché è quella
     che fa vedere **da che parte gira** — e un bambino che lo vede sa
     dove mettersi per travolgere quello che lo insegue. */
  palla(p) {
    const ctx = this.ctx
    const r = p.r || 15
    /* La cometa gira con l'angolo che cresce (`orbita` in `partita.js`),
       quindi va verso `a + 90°` e la coda le sta **dietro**, a
       `a − 90°`. I pezzi si sommano lungo quella direzione: sottrarli
       li metterebbe davanti al sasso, e la cometa sembrerebbe girare
       dalla parte sbagliata — che è l'unica cosa che questo disegno
       deve dire giusta. */
    const coda = p.a - 1.5708
    ctx.save()
    ctx.globalAlpha = 0.5
    for (let k = 1; k <= 5; k++) {
      const d = k * r * 0.62
      const q = 1 - k / 6
      this.cerchio(p.x + Math.cos(coda) * d, p.y + Math.sin(coda) * d,
                   r * q * 0.78, k > 2 ? '#ff9f4a' : '#ffd9a0')
    }
    ctx.globalAlpha = 1
    this.cerchio(p.x, p.y, r * 1.25, '#ff8a3c66')      // l'alone che scotta
    this.cerchio(p.x, p.y, r * 0.92, '#ffe6b0')
    this.cerchio(p.x - r * 0.22, p.y - r * 0.26, r * 0.42, '#fffdf2')
    ctx.strokeStyle = '#ff6b1f'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.92, 0, 6.29); ctx.stroke()
    ctx.restore()
  }

  /* ═══════════ le cosine che volano via ═══════════ */
  effetto(e, H) {
    const ctx = this.ctx
    if (e.che === 'briciola') {
      ctx.globalAlpha = Math.max(0, e.vita / e.tot)
      this.cerchio(e.x, e.y, e.r, e.colore)
      ctx.globalAlpha = 1
    } else if (e.che === 'anello') {
      const q = 1 - e.vita / e.tot
      ctx.globalAlpha = e.vita / e.tot
      ctx.strokeStyle = e.colore; ctx.lineWidth = 7 * (1 - q) + 2
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r0 + (e.r - e.r0) * q, 0, 6.29); ctx.stroke()
      ctx.globalAlpha = 1
    } else if (e.che === 'saetta') {
      ctx.globalAlpha = e.vita / e.tot
      ctx.strokeStyle = '#fff59a'; ctx.lineWidth = 5; ctx.lineJoin = 'round'
      ctx.beginPath(); ctx.moveTo(e.x, e.y - H)
      for (let k = 1; k <= 6; k++)
        ctx.lineTo(e.x + (k % 2 ? 12 : -12) * (1 - k / 7), e.y - H * (1 - k / 6))
      ctx.stroke()
      this.cerchio(e.x, e.y, 20, '#fff59a88')
      ctx.globalAlpha = 1
    }
  }

  /* ═══════════ una gemma di esperienza ═══════════ */
  gemma(g) {
    const ctx = this.ctx
    const s = 6 + Math.min(4, g.val) + Math.sin(g.fase) * 0.8
    const oro = g.val > 1
    ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(0.78)
    ctx.fillStyle = oro ? '#ffd257' : '#4fc3ff'
    ctx.fillRect(-s / 2, -s / 2, s, s)
    ctx.fillStyle = oro ? '#fff2b8' : '#b6ecff'
    ctx.fillRect(-s / 2, -s / 2, s * 0.45, s * 0.45)
    ctx.restore()
    ctx.globalAlpha = 0.25
    this.cerchio(g.x, g.y, s, oro ? '#ffd257' : '#4fc3ff')
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

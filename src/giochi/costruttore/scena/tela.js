/* ═══════════════════════════════════════════════════════════════════
   IL CANTIERE DISEGNATO

   Riceve un **quadro** già deciso e lo disegna, sessanta volte al
   secondo finché serve. Non sa cosa sia un livello, un ordine o un
   programma: sa che c'è una griglia con del terreno, dei mattoni, un
   disegno in trasparenza, un robot che va da una cella a un'altra, un
   omino e una bandiera.

     quadro = {
       w, h, suolo: [...], mattoni: Map(k → colore), bersaglio: Map,
       robot: { x, y }, robotDa: { x, y } | null, dal: ms,   // il passo in corso
       durata: ms, come: 'passo'|'sale'|'cade', verso: ±1,     // quanto dura, e com'è
       omino: { x, y, come } | null, ominoDa, bandiera: { x, y } | null,
       posa: { x, y, dal } | null,        // il mattone appena messo: fa «pop»
       guarda: { x, y, esito, dal } | null,  // l'occhio del robot su una cella
       fermo: { x, y } | null,            // dove il robot si è fermato per un errore
       confronto: { mancano, troppi, sbagliati } | null,
       esito: 'splash'|'muro'|'caduta'|… | null,  // come è finita la prova dell'omino
     }

   Il robot è disegnato e non preso da un foglio: è un muratore di
   latta, geometrico per natura, e i poligoni qui non sono un ripiego —
   sono lo stile giusto (vedi la memoria sul tetto della resa grafica).
   ═══════════════════════════════════════════════════════════════════ */
import { colore } from '../dati/colori.js'

const CIELO = '#d9eefb'
const CIELO_BASSO = '#eef7fd'
const ERBA = '#6fbf4a', ERBA_SCURA = '#4f9a33'
const TERRA = '#a8744a', TERRA_SCURA = '#8a5c37', SASSO = '#c49a70'
const ACQUA = '#4f9fdc', ACQUA_LUCE = '#9fd0f3', ACQUA_SCURA = '#3a7fb8'

export class Tela {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.quadro = null
    this.cella = 24
    this.raf = 0
    this.vivo = true
    this.giro = this.giro.bind(this)
    this.raf = requestAnimationFrame(this.giro)
  }

  ferma() {
    this.vivo = false
    cancelAnimationFrame(this.raf)
  }

  /* La misura della cella la decide chi monta la tela (sa quanto posto
     c'è); qui si prepara il canvas per il `devicePixelRatio`. */
  misura(larghezza, altezzaMassima, w, h) {
    const cella = Math.max(10, Math.floor(Math.min(larghezza / w, altezzaMassima / h)))
    this.cella = cella
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    this.dpr = dpr
    this.canvas.width = Math.round(cella * w * dpr)
    this.canvas.height = Math.round(cella * h * dpr)
    this.canvas.style.width = `${cella * w}px`
    this.canvas.style.height = `${cella * h}px`
    return cella
  }

  aggiorna(quadro) { this.quadro = quadro }

  giro(t) {
    if (!this.vivo) return
    if (this.quadro) this.disegna(this.quadro, t)
    this.raf = requestAnimationFrame(this.giro)
  }

  disegna(q, t) {
    const { ctx, cella: c } = this
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    const W = q.w * c, H = q.h * c
    /* il cielo: due fasce, più chiaro in basso verso l'orizzonte */
    ctx.fillStyle = CIELO
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = CIELO_BASSO
    ctx.fillRect(0, H * 0.55, W, H * 0.45)
    this.nuvole(q, t)

    for (let y = 0; y < q.h; y++) for (let x = 0; x < q.w; x++) {
      const s = q.suolo[y * q.w + x]
      if (s === 'terreno') this.terreno(q, x, y)
      else if (s === 'acqua') this.acqua(q, x, y, t)
    }
    this.griglia(q)

    /* il disegno in trasparenza, sotto i mattoni veri */
    for (const [k, col] of q.bersaglio) {
      if (q.mattoni.has(k)) continue
      this.fantasma(k % q.w, Math.floor(k / q.w), col, q, t)
    }
    for (const [k, col] of q.mattoni) this.mattone(k % q.w, Math.floor(k / q.w), col, q, t)
    if (q.confronto) this.errori(q, t)
    if (q.bandiera) this.bandiera(q.bandiera.x, q.bandiera.y, t)
    if (q.omino) this.omino(q, t)
    if (q.guarda) this.occhiata(q, t)
    this.robot(q, t)
  }

  /* ── il fondo ── */
  nuvole(q, t) {
    const { ctx, cella: c } = this
    ctx.fillStyle = 'rgba(255,255,255,.75)'
    const W = q.w * c
    for (const [x0, y0, r] of [[0.18, 0.12, 0.9], [0.62, 0.2, 0.7], [0.9, 0.08, 0.6]]) {
      const x = ((x0 * W + t * 0.004 * c) % (W + 3 * c)) - c
      const y = y0 * q.h * c
      ctx.beginPath()
      ctx.arc(x, y, r * c * 0.55, 0, Math.PI * 2)
      ctx.arc(x + r * c * 0.5, y + 2, r * c * 0.45, 0, Math.PI * 2)
      ctx.arc(x - r * c * 0.5, y + 3, r * c * 0.38, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  terreno(q, x, y) {
    const { ctx, cella: c } = this
    const px = x * c, py = y * c
    const sopra = y > 0 ? q.suolo[(y - 1) * q.w + x] : 'aria'
    ctx.fillStyle = TERRA
    ctx.fillRect(px, py, c, c)
    /* due sassolini fissi per cella: la terra non è una tinta unita, ma
       non deve nemmeno tremolare — la posizione viene dalla cella */
    ctx.fillStyle = (x + y) % 2 ? SASSO : TERRA_SCURA
    const a = ((x * 7 + y * 13) % 5) / 5, b = ((x * 11 + y * 3) % 7) / 7
    ctx.fillRect(px + c * (0.15 + a * 0.6), py + c * (0.35 + b * 0.4), c * 0.12, c * 0.1)
    ctx.fillRect(px + c * (0.6 - a * 0.4), py + c * (0.7 - b * 0.3), c * 0.09, c * 0.08)
    if (sopra !== 'terreno') {
      ctx.fillStyle = ERBA
      ctx.fillRect(px, py, c, c * 0.28)
      ctx.fillStyle = ERBA_SCURA
      ctx.fillRect(px, py + c * 0.24, c, c * 0.06)
      for (let k = 0; k < 3; k++) ctx.fillRect(px + c * (0.15 + k * 0.32), py - c * 0.06, c * 0.06, c * 0.1)
    }
  }

  acqua(q, x, y, t) {
    const { ctx, cella: c } = this
    const px = x * c, py = y * c
    const sopra = y > 0 ? q.suolo[(y - 1) * q.w + x] : 'aria'
    ctx.fillStyle = sopra === 'acqua' ? ACQUA_SCURA : ACQUA
    ctx.fillRect(px, py, c, c)
    if (sopra !== 'acqua') {
      ctx.fillStyle = ACQUA_LUCE
      const onda = Math.sin(t / 400 + x) * c * 0.05
      ctx.fillRect(px, py + c * 0.1 + onda, c, c * 0.08)
      ctx.fillRect(px + c * 0.2, py + c * 0.35 - onda, c * 0.4, c * 0.05)
    }
  }

  /* la griglia si vede appena: serve a contare i passi, non a decorare */
  griglia(q) {
    const { ctx, cella: c } = this
    ctx.strokeStyle = 'rgba(40,70,110,.08)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = 1; x < q.w; x++) { ctx.moveTo(x * c + 0.5, 0); ctx.lineTo(x * c + 0.5, q.h * c) }
    for (let y = 1; y < q.h; y++) { ctx.moveTo(0, y * c + 0.5); ctx.lineTo(q.w * c, y * c + 0.5) }
    ctx.stroke()
  }

  /* ── i mattoni ── */
  mattone(x, y, chiave, q, t) {
    const { ctx, cella: c } = this
    const col = colore(chiave) || colore('rosso')
    let s = 1
    if (q.posa && q.posa.x === x && q.posa.y === y) {
      const f = Math.min(1, (t - q.posa.dal) / 180)
      s = f < 1 ? 0.6 + 0.55 * Math.sin(f * Math.PI * 0.75) : 1
    }
    const px = x * c + (c * (1 - s)) / 2, py = y * c + (c * (1 - s)) / 2, l = c * s
    const m = Math.max(1, l * 0.08)
    ctx.fillStyle = col.ombra
    ctx.fillRect(px, py, l, l)
    ctx.fillStyle = col.tinta
    ctx.fillRect(px, py, l - m, l - m)
    ctx.fillStyle = col.luce
    ctx.fillRect(px, py, l - m, m)
    ctx.fillRect(px, py, m, l - m)
    /* la malta: una riga orizzontale e due mezzi giunti sfalsati */
    ctx.fillStyle = col.ombra
    ctx.fillRect(px + m, py + l * 0.5 - m / 2, l - 2 * m, Math.max(1, m * 0.7))
    ctx.fillRect(px + l * 0.5, py + m, Math.max(1, m * 0.7), l * 0.5 - m)
    ctx.fillRect(px + l * 0.25, py + l * 0.5, Math.max(1, m * 0.7), l * 0.5 - m)
    ctx.fillRect(px + l * 0.75, py + l * 0.5, Math.max(1, m * 0.7), l * 0.5 - m)
  }

  fantasma(x, y, chiave, q, t) {
    const { ctx, cella: c } = this
    const col = colore(chiave) || colore('rosso')
    const px = x * c, py = y * c
    /* quelli che mancano a fine prova lampeggiano: il disegno che chiede
       ancora un mattone si vede senza doverlo leggere */
    const manca = q.confronto && q.confronto.mancano.some(p => p.x === x && p.y === y)
    const a = manca ? 0.3 + 0.3 * (0.5 + 0.5 * Math.sin(t / 150)) : 0.22
    ctx.globalAlpha = a
    ctx.fillStyle = col.tinta
    ctx.fillRect(px + 2, py + 2, c - 4, c - 4)
    ctx.globalAlpha = 1
    ctx.strokeStyle = col.ombra
    ctx.lineWidth = Math.max(1, c * 0.06)
    ctx.setLineDash([c * 0.18, c * 0.12])
    ctx.strokeRect(px + 2.5, py + 2.5, c - 5, c - 5)
    ctx.setLineDash([])
  }

  errori(q, t) {
    const { ctx, cella: c } = this
    const croce = (x, y) => {
      const px = x * c, py = y * c
      ctx.strokeStyle = '#c0262d'
      ctx.lineWidth = Math.max(2, c * 0.12)
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(px + c * 0.2, py + c * 0.2); ctx.lineTo(px + c * 0.8, py + c * 0.8)
      ctx.moveTo(px + c * 0.8, py + c * 0.2); ctx.lineTo(px + c * 0.2, py + c * 0.8)
      ctx.stroke()
    }
    const pulsa = 0.6 + 0.4 * Math.sin(t / 160)
    ctx.globalAlpha = pulsa
    for (const p of q.confronto.troppi) croce(p.x, p.y)
    for (const p of q.confronto.sbagliati) croce(p.x, p.y)
    ctx.globalAlpha = 1
  }

  /* ── la bandiera, l'omino ── */
  bandiera(x, y, t) {
    const { ctx, cella: c } = this
    const px = x * c, py = y * c
    ctx.fillStyle = '#5d4b3a'
    ctx.fillRect(px + c * 0.28, py + c * 0.05, c * 0.08, c * 0.95)
    const sv = Math.sin(t / 250) * c * 0.06
    ctx.fillStyle = '#e03a3a'
    ctx.beginPath()
    ctx.moveTo(px + c * 0.36, py + c * 0.08)
    ctx.lineTo(px + c * 0.9, py + c * 0.22 + sv)
    ctx.lineTo(px + c * 0.36, py + c * 0.42)
    ctx.closePath()
    ctx.fill()
  }

  omino(q, t) {
    const { ctx, cella: c } = this
    let { x, y } = q.omino
    if (q.ominoDa && q.durata) {
      const f = Math.min(1, (t - q.dal) / q.durata)
      x = q.ominoDa.x + (x - q.ominoDa.x) * f
      y = q.ominoDa.y + (y - q.ominoDa.y) * f
    }
    const px = x * c, py = y * c
    const passo = Math.floor(t / 140) % 2
    const bagnato = q.esito === 'splash'
    const giu = q.esito === 'caduta'
    ctx.save()
    if (giu) { ctx.translate(px + c / 2, py + c * 0.8); ctx.rotate(Math.PI / 2); ctx.translate(-(px + c / 2), -(py + c * 0.8)) }
    /* le gambe */
    ctx.fillStyle = '#3b4a6b'
    ctx.fillRect(px + c * 0.36, py + c * 0.66, c * 0.1, c * (passo ? 0.3 : 0.26))
    ctx.fillRect(px + c * 0.54, py + c * 0.66, c * 0.1, c * (passo ? 0.26 : 0.3))
    /* il corpo e la testa */
    ctx.fillStyle = '#e8743b'
    ctx.fillRect(px + c * 0.32, py + c * 0.38, c * 0.36, c * 0.32)
    ctx.fillStyle = '#f5c9a0'
    ctx.beginPath()
    ctx.arc(px + c * 0.5, py + c * 0.26, c * 0.16, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#3a2a1e'
    ctx.fillRect(px + c * 0.34, py + c * 0.08, c * 0.32, c * 0.08)
    ctx.fillStyle = '#222'
    ctx.fillRect(px + c * 0.53, py + c * 0.24, c * 0.05, c * 0.05)
    ctx.restore()
    if (bagnato) {
      ctx.fillStyle = ACQUA_LUCE
      for (let k = 0; k < 4; k++) {
        const a = t / 200 + k * 1.6
        ctx.beginPath()
        ctx.arc(px + c * 0.5 + Math.cos(a) * c * 0.4, py + c * 0.2 - Math.abs(Math.sin(a)) * c * 0.3, c * 0.07, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  /* l'occhio del robot su una cella: il riquadro verde se la risposta è
     sì, grigio se è no — la condizione si vede, non solo il suo esito */
  occhiata(q, t) {
    const { ctx, cella: c } = this
    const g = q.guarda
    if (t - g.dal > 700) return
    const px = g.x * c, py = g.y * c
    ctx.strokeStyle = g.esito ? '#2f9e44' : '#868e96'
    ctx.lineWidth = Math.max(2, c * 0.1)
    ctx.strokeRect(px + 1.5, py + 1.5, c - 3, c - 3)
  }

  /* ── il robot ──
     Un muratore a due gambe, non un drone: cammina, sale un gradino,
     cade. L'occhio guarda da che parte sta andando (`verso`), le gambe
     si alternano mentre cammina e si stringono mentre cade. */
  robot(q, t) {
    const { ctx, cella: c } = this
    let { x, y } = q.robot
    let f = 1
    if (q.robotDa && q.durata) {
      f = Math.min(1, (t - q.dal) / q.durata)
      /* la caduta accelera, il passo è morbido */
      const e = q.come === 'cade' ? f * f : f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2
      x = q.robotDa.x + (x - q.robotDa.x) * e
      y = q.robotDa.y + (y - q.robotDa.y) * e
    }
    const inMoto = q.robotDa && f < 1
    const cade = inMoto && q.come === 'cade'
    const cammina = inMoto && !cade
    /* un saltello a metà passo, e quando sale sul gradino */
    const salto = cammina ? Math.sin(f * Math.PI) * c * (q.come === 'sale' ? 0.12 : 0.06) : 0
    const px = x * c, py = y * c - salto
    const cx = px + c / 2
    const v = q.verso || 1

    /* le gambe */
    ctx.fillStyle = '#3d4450'
    const fase = cammina ? Math.sin(f * Math.PI * 2) : 0
    const lg = c * 0.1, alt = c * 0.2
    if (cade) {
      ctx.fillRect(cx - c * 0.1, py + c * 0.78, lg, alt)
      ctx.fillRect(cx + c * 0.0, py + c * 0.78, lg, alt)
    } else {
      ctx.fillRect(cx - c * 0.16 + fase * c * 0.05, py + c * 0.78, lg, alt)
      ctx.fillRect(cx + c * 0.06 - fase * c * 0.05, py + c * 0.78, lg, alt)
    }
    /* il corpo: giallo cantiere */
    ctx.fillStyle = '#f5b82e'
    ctx.strokeStyle = '#8a6112'
    ctx.lineWidth = Math.max(1, c * 0.05)
    ctx.beginPath()
    /* `roundRect` manca sui Safari prima del 16: lì il robot è squadrato,
       ma c'è */
    if (ctx.roundRect) ctx.roundRect(cx - c * 0.26, py + c * 0.42, c * 0.52, c * 0.38, c * 0.08)
    else ctx.rect(cx - c * 0.26, py + c * 0.42, c * 0.52, c * 0.38)
    ctx.fill()
    ctx.stroke()
    /* il braccio, verso dove guarda; alzato mentre cade */
    ctx.fillStyle = '#8a6112'
    if (cade) ctx.fillRect(cx + v * c * 0.24, py + c * 0.28, c * 0.07, c * 0.2)
    else ctx.fillRect(cx + v * c * 0.24, py + c * 0.52, c * 0.14, c * 0.07)
    /* la testa, con lo schermo e l'occhio */
    ctx.fillStyle = '#e9edf2'
    ctx.strokeStyle = '#4a5260'
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(cx - c * 0.22, py + c * 0.1, c * 0.44, c * 0.32, c * 0.08)
    else ctx.rect(cx - c * 0.22, py + c * 0.1, c * 0.44, c * 0.32)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#23303d'
    ctx.beginPath()
    ctx.arc(cx + v * c * 0.07, py + c * 0.26, c * 0.07, 0, Math.PI * 2)
    ctx.fill()
    /* l'antenna, con la lucina */
    ctx.fillStyle = '#4a5260'
    ctx.fillRect(cx - c * 0.015, py + c * 0.01, c * 0.03, c * 0.1)
    ctx.fillStyle = q.fermo ? '#c0262d' : '#ff8a3d'
    ctx.beginPath()
    ctx.arc(cx, py + c * 0.02, c * 0.05, 0, Math.PI * 2)
    ctx.fill()
    if (q.fermo) {
      ctx.fillStyle = '#c0262d'
      ctx.beginPath()
      ctx.arc(cx + c * 0.36, py + c * 0.08, c * 0.16, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${Math.round(c * 0.26)}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('!', cx + c * 0.36, py + c * 0.09)
    }
  }
}

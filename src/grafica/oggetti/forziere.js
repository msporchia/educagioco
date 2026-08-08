/* ═══════════════════════════════════════════════════════════════════
   IL FORZIERE

   L'unica ricompensa del gioco, e per questo sta in un file suo: non è
   un oggetto di scena, è **un momento**. Un cambio di stato non basta:
   quando si apre deve succedere *qualcosa*. Il tempo `t` va da 0 a 1 e
   lo fa scorrere il gioco; sopra 1 il forziere resta aperto e continua
   solo a luccicare.

     0.00 – 0.18   trema, come se dentro spingessero
     0.18          lampo, e il coperchio parte
     0.18 – 0.55   il coperchio si spalanca, esce la luce
     0.20 – 1.00   diamanti e monete schizzano fuori e ricadono
     1.00 –        oro in vista, scintille lente

   Le gemme non hanno stato: posizione e rotazione si calcolano da `t`
   e da un numero fisso per gemma. Così il gioco può tornare indietro,
   mettere in pausa o rifare l'apertura senza che nulla si scomponga.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, buio, capsula, poligono, tondo } from '../comune.js'
import { scintilla } from '../segni.js'

const GEMME = [
  { c: '#7fe0ff', l: '#e8fbff', tipo: 'gemma' },
  { c: '#ff5a7a', l: '#ffc2cf', tipo: 'gemma' },
  { c: '#4fe08a', l: '#c6ffde', tipo: 'gemma' },
  { c: '#f7c945', l: '#fff0b8', tipo: 'moneta' },
  { c: '#c9a2ff', l: '#efe2ff', tipo: 'gemma' },
  { c: '#f7c945', l: '#fff0b8', tipo: 'moneta' },
]

function gemma(q, x, y, r, G, spin) {
  const b = buio(G.c, 0.42)
  if (G.tipo === 'moneta') {
    const larg = Math.abs(Math.cos(spin))
    tondo(q, x, y, Math.max(r * 0.18, r * larg), r, G.c, b, r * 0.28)
    if (larg > 0.4) tondo(q, x, y, r * larg * 0.55, r * 0.55, G.l)
    return
  }
  const w = r * 0.9
  poligono(q, [[x - w * 0.5, y - r], [x + w * 0.5, y - r], [x + w, y - r * 0.25],
               [x, y + r], [x - w, y - r * 0.25]], G.c, b, r * 0.22)
  poligono(q, [[x - w * 0.5, y - r], [x + w * 0.5, y - r], [x + w * 0.15, y - r * 0.25],
               [x - w * 0.35, y - r * 0.25]], G.l)
  poligono(q, [[x - w, y - r * 0.25], [x - w * 0.35, y - r * 0.25], [x, y + r]],
           mescola(G.c, '#ffffff', 0.3))
}

/* il momento intero. Sta fuori dalla tabella dei pittori anche come
   funzione a sé perché una schermata di vittoria può volerlo grande in
   mezzo allo schermo, senza una griglia intorno. */
export function apriForziere(p, x, y, t, S = p.S) {
  const s = S * 1.15
  const tt = Math.max(0, t)
  const ap = Math.min(1, Math.max(0, (tt - 0.18) / 0.37))
  const spalanca = 1 - (1 - ap) * (1 - ap)          // frenata dolce in fondo
  const tremo = tt < 0.18 ? Math.sin(tt * 90) * 0.9 * s * (1 - tt / 0.18) : 0
  const legno = '#8a5a30', legnoS = '#6a4222', ferro = '#c9a83c', bordo = '#3a2312'
  const ombraLuce = Math.min(1, Math.max(0, (tt - 0.18) / 0.25))
  const orologio = p.tempo || 0

  p.ellisse(x, y + 1 * s, 11 * s, 3.4 * s, '#00000030')

  p.in(x + tremo, y, q => {
    /* il coperchio: una cassa vera, non un'assicella. Cardine sul retro
       a sinistra, cupola piena con le sue fasce di ferro, e dentro il
       velluto rosso — quando si alza è il velluto che si vede, ed è
       lui a dire «questo è un coperchio» invece di «questa è una
       tavola che vola». */
    const coperchio = () => q.in(-9 * s, -9 * s, r => {
      r.ctx.rotate(-spalanca * 1.22)
      const c = r.ctx
      const cupola = (m, alt) => {
        c.beginPath()
        c.moveTo(m, 0.4 * s)
        c.lineTo(m, -1.8 * s)
        c.quadraticCurveTo(9 * s, -alt, 18 * s - m, -1.8 * s)
        c.lineTo(18 * s - m, 0.4 * s)
        c.closePath()
      }
      cupola(0, 9.6 * s)
      c.fillStyle = legno; c.fill()
      c.strokeStyle = bordo; c.lineWidth = 0.9 * s; c.lineJoin = 'round'; c.stroke()
      c.save(); cupola(0, 9.6 * s); c.clip()
      for (const dx of [3.2, 13.2]) r.rett(dx * s, -9 * s, 1.7 * s, 10 * s, ferro)
      r.rett(0, -1.9 * s, 18 * s, 1.5 * s, legnoS)
      r.rett(0, -0.6 * s, 18 * s, 1 * s, ferro)
      c.restore()
      // il velluto: si scopre solo quando il coperchio si alza davvero
      if (spalanca > 0.1) q.velo(Math.min(1, (spalanca - 0.1) * 3), () => {
        cupola(1.6 * s, 7.4 * s)
        const g = c.createLinearGradient(0, -6 * s, 0, 0)
        g.addColorStop(0, '#b8433f'); g.addColorStop(1, '#7a2422')
        c.fillStyle = g; c.fill()
        c.strokeStyle = '#e8c569'; c.lineWidth = 0.7 * s; c.stroke()
      })
    })

    if (spalanca > 0.12) coperchio()

    // il vano scuro e l'oro che ci sta dentro
    q.rett(-8.6 * s, -9 * s, 17.2 * s, 5 * s, '#2a1a10')
    if (spalanca > 0.05) {
      const h = 1.4 + spalanca * 1.6
      q.velo(1, () => {
        for (let i = -2; i <= 2; i++)
          tondo(q, i * 2.9 * s, -8 * s + Math.abs(i) * 0.4 * s, 2.4 * s, h * s, '#f7c945', '#b48800', 0.6 * s)
        for (let i = -1; i <= 1; i++)
          tondo(q, i * 3.4 * s, -9.4 * s, 2 * s, h * 0.8 * s, '#ffe27a')
      })
    }

    // la luce che esce: un cono largo più il bagliore intorno
    if (ombraLuce > 0) {
      const puls = 0.55 + 0.45 * Math.sin(orologio * 4)
      p.velo(ombraLuce * (t > 1 ? 0.35 : 0.75 - Math.max(0, tt - 0.6) * 0.4), () => {
        const g = q.ctx.createLinearGradient(0, -9 * s, 0, -34 * s)
        g.addColorStop(0, '#fff3c4cc'); g.addColorStop(1, '#fff3c400')
        q.ctx.fillStyle = g
        q.ctx.beginPath()
        q.ctx.moveTo(-8 * s, -9 * s); q.ctx.lineTo(8 * s, -9 * s)
        q.ctx.lineTo(17 * s, -34 * s); q.ctx.lineTo(-17 * s, -34 * s)
        q.ctx.closePath(); q.ctx.fill()
        const r = q.ctx.createRadialGradient(0, -9 * s, 1 * s, 0, -9 * s, 16 * s * (0.8 + puls * 0.2))
        r.addColorStop(0, '#fff6d0aa'); r.addColorStop(1, '#fff6d000')
        q.ctx.fillStyle = r
        q.ctx.beginPath(); q.ctx.arc(0, -9 * s, 17 * s, 0, 6.29); q.ctx.fill()
      })
    }

    // la cassa, davanti a tutto: copre il fondo del vano
    capsula(q, 0, -4.4 * s, 9 * s, 4.6 * s, 1.2 * s, legno, bordo, 0.9 * s)
    q.rett(-9 * s, -5.4 * s, 18 * s, 1.4 * s, legnoS)
    for (const dx of [-6, 0, 6]) q.rett(dx * s - 0.8 * s, -9 * s, 1.6 * s, 9 * s, ferro)
    q.rett(-9 * s, -1.4 * s, 18 * s, 1.4 * s, ferro)
    // la serratura: salta via quando il forziere si apre
    if (spalanca < 0.35) {
      const salto = spalanca * 10 * s
      q.velo(1 - spalanca * 2.6, () => {
        capsula(q, 0, -4.6 * s - salto, 1.9 * s, 2 * s, 0.6 * s, '#e8c569', '#8a6412', 0.7 * s)
        tondo(q, 0, -4.6 * s - salto, 0.6 * s, 0.6 * s, '#3a2312')
      })
    }
    if (spalanca < 0.05 && tt > 0) {
      // prima di aprirsi ha un alone che cresce: sta per succedere qualcosa
      p.velo(tt / 0.18 * 0.5, () => tondo(q, 0, -6 * s, 13 * s, 9 * s, '#fff3c433'))
    }

    // il lampo del momento in cui scatta
    if (tt > 0.14 && tt < 0.4) {
      const f = (tt - 0.14) / 0.26
      p.velo(1 - f, () => {
        q.ctx.strokeStyle = '#fffbe8'; q.ctx.lineWidth = (2 - f * 1.7) * s
        q.ctx.beginPath(); q.ctx.ellipse(0, -9 * s, (5 + f * 19) * s, (2.4 + f * 9) * s, 0, 0, 6.29)
        q.ctx.stroke()
        for (let i = 0; i < 6; i++) {                      // e sei raggi corti
          const a = i / 6 * 6.29 + 0.5
          const r0 = (9 + f * 11) * s, r1 = (14 + f * 15) * s
          q.linea([{ x: Math.cos(a) * r0, y: -9 * s + Math.sin(a) * r0 * 0.55 },
                   { x: Math.cos(a) * r1, y: -9 * s + Math.sin(a) * r1 * 0.55 }],
                  '#fffbe8', (1.5 - f) * s)
        }
      })
    }

    /* le gemme: quattordici, ognuna con il suo angolo e la sua spinta.
       Salgono, ricadono e si posano ai piedi del forziere. */
    for (let i = 0; i < 14; i++) {
      const G = GEMME[i % GEMME.length]
      const ang = -2.6 + (i * 2.31) % 1.9          // ventaglio verso l'alto
      const forza = 0.72 + ((i * 7) % 5) * 0.11
      const rit = (i % 5) * 0.035
      const u = (tt - 0.2 - rit) / (0.62 - rit * 0.4)
      if (u <= 0) continue
      const uu = Math.min(u, 1.35)
      const vx = Math.cos(ang) * (i % 2 ? 1 : -1) * (i % 3 ? 1 : 0.6)
      const gx = vx * uu * 26 * forza * s
      const gy = -9 * s - (Math.sin(-ang) * uu * 40 * forza - 34 * uu * uu) * s
      const posa = Math.min(gy, -0.5 * s)
      const r = (1.7 + (i % 3) * 0.5) * s
      gemma(q, gx, posa, r, G, i * 1.3 + uu * 9)
      if (u < 1) scintilla(p, x + tremo + gx, y + posa, r * 1.2, (u * 2) % 1)
    }
  })

  // le scintille lente di quando è tutto finito
  if (tt >= 0.9) for (let i = 0; i < 4; i++) {
    const f = ((orologio * 0.55) + i * 0.25) % 1
    scintilla(p, x + Math.cos(i * 2.4) * 12 * s, y - 12 * s + Math.sin(i * 1.7) * 6 * s, 2.2 * s, f)
  }
}

export function forziere(p, cosa, S = p.S) {
  const t = cosa.aperto ? Math.max(1, cosa.apertura ?? 1) : (cosa.apertura ?? 0)
  apriForziere(p, cosa.x, cosa.y, t, S)
}

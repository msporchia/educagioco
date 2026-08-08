/* ═══════════════════════════════════════════════════════════════════
   IL FONDALE — quello che non cambia per tutta la partita.

   Prato, strada, bosco e piazzole: `tela.dipingiFondale` li dipinge una
   volta su una tela nascosta e poi li ricopia. Qui c'è solo *cosa*
   dipingere.

   Tutto è seminato: stesso seme, stesso bosco. Un fondale che cambia a
   ogni ridisegno è un fondale sbagliato.
   ═══════════════════════════════════════════════════════════════════ */
import { seminato } from '../tela.js'

function prato(p, vicino, caso) {
  const { ctx, W, H, S } = p
  const g = ctx.createLinearGradient(0, 0, W * 0.3, H)
  g.addColorStop(0, '#8fd07a'); g.addColorStop(0.5, '#7ac468'); g.addColorStop(1, '#63b05c')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  // chiazze larghe di due verdi appena diversi: è già terreno dipinto
  for (let i = 0; i < 130; i++) {
    const rx = (12 + caso() * 40) * S
    p.velo(0.10 + caso() * 0.12, () => {
      ctx.fillStyle = caso() > 0.5 ? '#a3dd8a' : '#4f9c53'
      ctx.beginPath()
      ctx.ellipse(caso() * W, caso() * H, rx, rx * (0.4 + caso() * 0.35), caso() * 3, 0, 6.29)
      ctx.fill()
    })
  }
  // ciuffi d'erba a V, mai sulla strada
  ctx.lineCap = 'round'
  for (let i = 0, quanti = Math.round(W * H / 900); i < quanti; i++) {
    const x = caso() * W, y = caso() * H
    if (vicino(x, y) < 22 * S) continue
    const h = (4 + caso() * 5) * S
    ctx.strokeStyle = caso() > 0.35 ? '#4f9c53' : '#a8e08a'
    ctx.lineWidth = 1.2 * S
    ctx.beginPath(); ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x - 1.5 * S, y - h * 0.6, x - 3 * S, y - h); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x + 1.5 * S, y)
    ctx.quadraticCurveTo(x + 2 * S, y - h * 0.5, x + 3.6 * S, y - h * 0.8); ctx.stroke()
  }
  for (let i = 0; i < 45; i++) {
    const x = caso() * W, y = caso() * H
    if (vicino(x, y) < 26 * S) continue
    const col = ['#fff6d8', '#ffd9e8', '#ffe9a0'][Math.floor(caso() * 3)]
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * 6.29
      p.ellisse(x + Math.cos(a) * 1.9 * S, y + Math.sin(a) * 1.9 * S, 1.4 * S, 1.4 * S, col)
    }
    p.ellisse(x, y, 1 * S, 1 * S, '#e8a33c')
  }
}

function strada(p, via, caso) {
  const { ctx, S } = p
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.save(); ctx.translate(0, 3 * S)
  p.linea(via.punti, '#00000022', 34 * S)
  ctx.restore()
  p.linea(via.punti, '#8a6742', 34 * S)      // scarpata
  p.linea(via.punti, '#a5814f', 30 * S)      // terra
  p.linea(via.punti, '#d9bb8c', 24 * S)      // battuto chiaro
  // ghiaia sul battuto e ciottoli sul ciglio
  for (let d = 0; d < via.lunghezza; d += 3 * S) {
    const a = via.puntoA(d), n = via.normaleA(d)
    for (let k = 0; k < 2; k++) {
      const o = (caso() * 2 - 1) * 10 * S
      p.velo(0.10 + caso() * 0.16, () =>
        p.ellisse(a.x + n.x * o, a.y + n.y * o, (1 + caso() * 2.2) * S, (0.8 + caso() * 1.5) * S,
                  caso() > 0.5 ? '#b4884f' : '#f0dcb8'))
    }
    if (caso() > 0.82) for (const lato of [-1, 1]) {
      const o = lato * (13 + caso() * 2) * S
      const x = a.x + n.x * o, y = a.y + n.y * o
      const rx = (2.2 + caso() * 1.4) * S, ry = (1.7 + caso()) * S
      p.ellisse(x, y + 1 * S, rx, ry, '#6f5a45')
      p.ellisse(x, y, rx, ry, caso() > 0.5 ? '#c9bda8' : '#a99c86')
    }
  }
}

function albero(p, x, y, s) {
  p.ellisse(x, y + 2 * s, 9 * s, 3.4 * s, '#00000025')
  p.rett(x - 1.6 * s, y - 6 * s, 3.2 * s, 7 * s, '#7a5433')
  const chiome = [[0, -13, 9], [-6, -9, 7], [6, -9.5, 7], [0, -19, 6.6], [-4, -16, 5.6], [4, -16.5, 5.6]]
  for (const [dx, dy, r] of chiome) p.ellisse(x + dx * s, y + dy * s, r * s, r * s * 0.92, '#2f7a45')
  for (const [dx, dy, r] of chiome)
    p.ellisse(x + dx * s - r * s * 0.22, y + dy * s - r * s * 0.26, r * s * 0.62, r * s * 0.55, '#49a75c')
  p.ellisse(x - 3 * s, y - 20 * s, 3 * s, 2.4 * s, '#6fc46a')
}

function cespuglio(p, x, y, s) {
  p.ellisse(x, y + 2 * s, 8 * s, 2.6 * s, '#00000020')
  p.ellisse(x - 3 * s, y, 4.4 * s, 4 * s, '#2f7a45')
  p.ellisse(x + 3 * s, y, 4.6 * s, 4.2 * s, '#2f7a45')
  p.ellisse(x, y - 2 * s, 5.2 * s, 4.6 * s, '#3d9051')
  p.ellisse(x - 1 * s, y - 3 * s, 3 * s, 2.4 * s, '#5fb96b')
}

function sasso(p, x, y, s) {
  p.ellisse(x, y + 2 * s, 7 * s, 2.6 * s, '#00000022')
  p.ellisse(x, y, 6 * s, 4.4 * s, '#8d8478')
  p.ellisse(x - 1.4 * s, y - 1.2 * s, 3.6 * s, 2.4 * s, '#b8b0a2')
}

/* la piazzola: terra spianata con un giro di sassi. Ferma non chiede
   niente, e resta sotto la torre quando ci si costruisce sopra. */
function piazzola(p, x, y, caso) {
  const S = p.S
  p.ellisse(x, y, 15 * S, 9.5 * S, '#00000018')
  p.ellisse(x, y - 0.6 * S, 13.5 * S, 8.2 * S, '#c3a97f')
  p.ellisse(x, y - 1.4 * S, 11 * S, 6.4 * S, '#d8c19a')
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * 6.29 + caso() * 0.3
    p.ellisse(x + Math.cos(a) * 12.5 * S, y - 0.6 * S + Math.sin(a) * 7.6 * S,
              1.9 * S, 1.5 * S, i % 2 ? '#a99c86' : '#8d8478')
  }
}

/* Il fondale intero. Torna la funzione che `tela.dipingiFondale` vuole:
   il gioco dice *dov'è* la strada, non come si dipinge. */
export function campo({ via, postazioni, seme = 1 }) {
  return p => {
    const { W, H, S, ctx } = p
    const caso = seminato(seme * 7919 + 13)
    // distanza dalla strada, per non piantare alberi in mezzo al passaggio
    const lungoStrada = via.campiona(8)
    const vicino = (x, y) => {
      let m = Infinity
      for (const c of lungoStrada) {
        const d = (c.x - x) ** 2 + (c.y - y) ** 2
        if (d < m) m = d
      }
      return Math.sqrt(m)
    }
    prato(p, vicino, caso)
    strada(p, via, caso)
    // il bosco, dipinto dall'alto in basso perché chi sta davanti copra
    const roba = []
    for (let i = 0; i < 46; i++) {
      const x = caso() * W, y = caso() * H
      if (vicino(x, y) < 34 * S) continue
      if (postazioni.some(q => Math.hypot(q.x - x, q.y - y) < 30 * S)) continue
      roba.push({ x, y, s: (0.55 + caso() * 0.4) * S * 1.3, che: caso() })
    }
    roba.sort((a, b) => a.y - b.y)
    for (const r of roba) {
      if (r.che > 0.74) sasso(p, r.x, r.y, r.s * 0.85)
      else if (r.che > 0.52) cespuglio(p, r.x, r.y, r.s)
      else albero(p, r.x, r.y, r.s)
    }
    for (const q of postazioni) piazzola(p, q.x, q.y, caso)
    // vignettatura: il centro resta chiaro, i bordi si chiudono
    const v = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.28, W * 0.5, H * 0.5, H * 1.05)
    v.addColorStop(0, '#00000000'); v.addColorStop(1, '#1c3a1a3a')
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H)
  }
}

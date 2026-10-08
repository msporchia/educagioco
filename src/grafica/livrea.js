// La vernice della nave: i disegni sulle ali, gli stemmi, il pacco regalo.
// Solo pittori: i colori li ha già scelti l'hangar (src/data/hangar.js).
// Non importa spazio.js (è lui che importa questo file).

const TAU = Math.PI * 2
const INCHIOSTRO = '#1b1f27'

export function traccia(ctx, punti, R) {
  ctx.beginPath()
  punti.forEach(([x, y], i) => i ? ctx.lineTo(x * R, y * R) : ctx.moveTo(x * R, y * R))
  ctx.closePath()
}

// rettangolo tondo senza roundRect (Safari < 16)
export function tondo(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// ---- i disegni sulle ali ----
// Ognuno scrive per l'ala destra (x > 0); per la sinistra `dipingiAla` specchia la tela.
const cuoreP = (c, s) => {
  c.moveTo(0, s * 0.85)
  c.bezierCurveTo(-s * 1.2, 0, -s * 0.6, -s, 0, -s * 0.35)
  c.bezierCurveTo(s * 0.6, -s, s * 1.2, 0, 0, s * 0.85)
  c.closePath()
}
const stellaP = (c, s, dente = 0.42) => {
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? s * dente : s
    i ? c.lineTo(Math.cos(a) * d, Math.sin(a) * d) : c.moveTo(Math.cos(a) * d, Math.sin(a) * d)
  }
  c.closePath()
}

const DISEGNI = {
  fiamme(c, R) {
    for (const [y0, l] of [[0, 0.95], [0.26, 1.15], [0.52, 0.85]]) {
      c.beginPath(); c.moveTo(0.3 * R, (y0 - 0.07) * R)
      c.quadraticCurveTo((0.3 + l * 0.5) * R, (y0 - 0.16) * R, (0.3 + l) * R, (y0 + 0.02) * R)
      c.quadraticCurveTo((0.3 + l * 0.55) * R, (y0 + 0.01) * R, (0.3 + l * 0.7) * R, (y0 + 0.12) * R)
      c.quadraticCurveTo((0.3 + l * 0.35) * R, (y0 + 0.07) * R, 0.3 * R, (y0 + 0.1) * R)
      c.fill()
    }
  },
  strisce(c, R) { for (const k of [0, 1]) c.fillRect((0.5 + k * 0.3) * R, -R, 0.12 * R, 2 * R) },
  punte(c, R) { c.fillRect(0.9 * R, -R, R, 2 * R) },
  scacchi(c, R) {
    const q = R * 0.16
    for (let i = -10; i < 10; i++) for (let j = -8; j < 8; j++) if ((i + j) % 2 === 0) c.fillRect(i * q, j * q, q, q)
  },
  pois(c, R) {
    for (const [x, y] of [[0.55, 0.2], [0.85, 0.45], [0.7, 0.62], [1.05, 0.3], [1.15, 0.62], [0.55, 0.5], [1.0, 0.85]]) {
      c.beginPath(); c.arc(x * R, y * R, R * 0.07, 0, TAU); c.fill()
    }
  },
  onde(c, R) {   // tre onde lungo l'ala: un tratto continuo, spesso, che si legge anche piccolo
    c.lineWidth = Math.max(1.4, R * 0.075); c.lineCap = 'round'; c.strokeStyle = c.fillStyle
    for (const base of [0.55, 0.82, 1.09]) {
      c.beginPath()
      for (let y = -0.4; y <= 1.1; y += 0.06) {
        const x = base + Math.sin(y * 9 + base * 5) * 0.06
        y === -0.4 ? c.moveTo(x * R, y * R) : c.lineTo(x * R, y * R)
      }
      c.stroke()
    }
  },
  zigzag(c, R) {
    c.lineWidth = Math.max(1.4, R * 0.085); c.lineJoin = 'miter'; c.miterLimit = 4; c.strokeStyle = c.fillStyle
    for (const y0 of [0.1, 0.42]) {
      c.beginPath()
      for (let i = 0; i <= 8; i++) {
        const x = (0.3 + i * 0.16) * R, y = (y0 + (i % 2 ? 0.1 : -0.1)) * R
        i ? c.lineTo(x, y) : c.moveTo(x, y)
      }
      c.stroke()
    }
  },
  stelline(c, R) {
    for (const [x, y, k] of [[0.6, 0.1, 1], [0.95, 0.3, 0.8], [0.72, 0.5, 0.7], [1.15, 0.55, 1], [0.55, 0.78, 0.7], [1.0, 0.85, 0.8], [0.85, -0.05, 0.6]]) {
      c.save(); c.translate(x * R, y * R); c.beginPath(); stellaP(c, R * 0.11 * k, 0.45); c.fill(); c.restore()
    }
  },
  banda(c, R) {   // una fascia larga di traverso, parallela al bordo d'attacco
    c.lineWidth = R * 0.16; c.lineCap = 'butt'; c.strokeStyle = c.fillStyle
    c.beginPath(); c.moveTo(0.2 * R, 0.1 * R); c.lineTo(1.5 * R, 1.0 * R); c.stroke()
  },
  cuori(c, R) {
    for (const [x, y, k] of [[0.6, 0.2, 1], [0.95, 0.4, 0.85], [0.72, 0.58, 0.75], [1.1, 0.7, 1], [0.58, 0.85, 0.7], [1.15, 0.12, 0.7]]) {
      c.save(); c.translate(x * R, y * R); c.beginPath(); cuoreP(c, R * 0.1 * k); c.fill(); c.restore()
    }
  },
  squame(c, R) {   // file di archetti sfalsate, come le squame di un pesce
    const r = R * 0.13
    c.lineWidth = Math.max(1.2, R * 0.05); c.lineCap = 'round'; c.strokeStyle = c.fillStyle
    for (let j = -2; j < 9; j++) {
      for (let i = -1; i < 12; i++) {
        const x = (0.2 + i * 0.2) * R + (j % 2 ? r : 0), y = (-0.3 + j * 0.13) * R
        c.beginPath(); c.arc(x, y, r, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke()
      }
    }
  },
  gessato(c, R) {   // righe sottili, in orizzontale (le strisce sono in verticale)
    c.lineWidth = Math.max(1, R * 0.04); c.strokeStyle = c.fillStyle
    for (let y = -0.5; y < 1.2; y += 0.12) { c.beginPath(); c.moveTo(0, y * R); c.lineTo(2 * R, y * R); c.stroke() }
  },
}

export const DISEGNI_ALA = Object.keys(DISEGNI)

// `punti` è l'ala già specchiata, come la traccia disegnaNave; si dipinge DENTRO, anche strappata.
export function dipingiAla(ctx, punti, R, verso, livrea) {
  const f = livrea && DISEGNI[livrea.disegno]
  if (!f) return
  ctx.save()
  traccia(ctx, punti, R); ctx.clip()
  ctx.scale(verso, 1)
  ctx.fillStyle = livrea.colDisegno || '#fff'
  f(ctx, R)
  ctx.restore()
}

// ---- gli stemmi ----
// Ogni stemma è un elenco di parti da riempire (prima il bordo, poi il colore: così il
// contorno resta solo fuori e le parti sovrapposte non si cancellano) più dettagli.
const trattoP = (c, col, lw, fn) => {   // un tratto con il suo bordo
  c.lineCap = 'round'; c.lineJoin = 'round'
  c.strokeStyle = INCHIOSTRO; c.lineWidth = lw * 1.9; c.beginPath(); fn(c); c.stroke()
  c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); fn(c); c.stroke()
}
function pieno(c, col, bordo, parti) {
  c.lineJoin = 'round'; c.strokeStyle = INCHIOSTRO; c.lineWidth = bordo
  for (const p of parti) { c.beginPath(); p(c); c.stroke() }
  c.fillStyle = col
  for (const p of parti) { c.beginPath(); p(c); c.fill() }
}
const ell = (x, y, rx, ry, rot = 0) => c => { c.moveTo(x + rx, y); c.ellipse(x, y, rx, ry, rot, 0, TAU) }
const poli = pts => c => { pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath() }
const linea = (c, col, w, ...segmenti) => {
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath()
  for (const [x0, y0, x1, y1] of segmenti) { c.moveTo(x0, y0); c.lineTo(x1, y1) }
  c.stroke()
}

const STEMMI = {
  stella: (c, s, col, b) => pieno(c, col, b, [c => stellaP(c, s)]),
  fulmine: (c, s, col, b) => pieno(c, col, b, [poli([[s * 0.2, -s], [-s * 0.55, s * 0.1], [-s * 0.05, s * 0.1], [-s * 0.25, s], [s * 0.55, -s * 0.15], [s * 0.05, -s * 0.15]])]),
  cuore: (c, s, col, b) => pieno(c, col, b, [c => cuoreP(c, s)]),
  corona(c, s, col, b) {
    pieno(c, col, b, [poli([[-s, s * 0.6], [-s, -s * 0.5], [-s * 0.5, 0], [0, -s * 0.8], [s * 0.5, 0], [s, -s * 0.5], [s, s * 0.6]])])
    linea(c, INCHIOSTRO, Math.max(1, s * 0.12), [-s, s * 0.3, s, s * 0.3])
  },
  zampa(c, s, col, b) {
    pieno(c, col, b, [ell(0, s * 0.35, s * 0.5, s * 0.42),
      ...[[-0.62, -0.15], [-0.24, -0.6], [0.24, -0.6], [0.62, -0.15]].map(([x, y]) => ell(x * s, y * s, s * 0.2, s * 0.26))])
  },
  alieno(c, s, col, b) {
    pieno(c, col, b, [ell(0, 0, s * 0.8, s * 0.95)])
    c.fillStyle = INCHIOSTRO
    c.beginPath(); c.ellipse(-s * 0.3, -s * 0.05, s * 0.2, s * 0.32, -0.5, 0, TAU)
    c.moveTo(s * 0.5, -s * 0.05); c.ellipse(s * 0.3, -s * 0.05, s * 0.2, s * 0.32, 0.5, 0, TAU); c.fill()
  },
  pianeta(c, s, col, b) {
    pieno(c, col, b, [c => c.arc(0, 0, s * 0.62, 0, TAU)])
    trattoP(c, col, s * 0.16, c => c.ellipse(0, 0, s * 1.05, s * 0.3, -0.35, 0, TAU))
  },
  luna(c, s, col, b) {
    const f = 55 * Math.PI / 180, cx = s * 0.45
    const r2 = Math.hypot(s * Math.cos(f) - cx, s * Math.sin(f)), al = Math.atan2(s * Math.sin(f), s * Math.cos(f) - cx)
    pieno(c, col, b, [c => { c.arc(0, 0, s, -f, f, true); c.arc(cx, 0, r2, al, -al, false); c.closePath() }])
  },
  razzo(c, s, col, b) {
    pieno(c, col, b, [
      c => { c.moveTo(0, -s); c.quadraticCurveTo(s * 0.62, -s * 0.35, s * 0.4, s * 0.55); c.lineTo(-s * 0.4, s * 0.55); c.quadraticCurveTo(-s * 0.62, -s * 0.35, 0, -s); c.closePath() },
      poli([[s * 0.38, s * 0.05], [s * 0.9, s * 0.8], [s * 0.38, s * 0.55]]),
      poli([[-s * 0.38, s * 0.05], [-s * 0.9, s * 0.8], [-s * 0.38, s * 0.55]]),
      poli([[-s * 0.22, s * 0.55], [0, s * 1.05], [s * 0.22, s * 0.55]]),
    ])
    c.fillStyle = INCHIOSTRO; c.beginPath(); c.arc(0, -s * 0.2, s * 0.2, 0, TAU); c.fill()
  },
  fiore(c, s, col, b) {
    const petali = Array.from({ length: 5 }, (_, i) => {
      const a = -Math.PI / 2 + i * TAU / 5
      return ell(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.4, s * 0.4)
    })
    pieno(c, col, b, petali)
    c.fillStyle = INCHIOSTRO; c.beginPath(); c.arc(0, 0, s * 0.27, 0, TAU); c.fill()
  },
  fiocco(c, s, col, b) {
    pieno(c, col, b, [
      poli([[0, 0], [-s, -s * 0.6], [-s, s * 0.6]]), poli([[0, 0], [s, -s * 0.6], [s, s * 0.6]]),
      poli([[-s * 0.1, s * 0.1], [-s * 0.5, s], [-s * 0.1, s * 0.72]]), poli([[s * 0.1, s * 0.1], [s * 0.5, s], [s * 0.1, s * 0.72]]),
      ell(0, 0, s * 0.27, s * 0.27),
    ])
  },
  diamante(c, s, col, b) {
    pieno(c, col, b, [poli([[-s * 0.55, -s * 0.85], [s * 0.55, -s * 0.85], [s, -s * 0.2], [0, s * 0.95], [-s, -s * 0.2]])])
    const w = Math.max(1, s * 0.1)
    linea(c, INCHIOSTRO, w, [-s, -s * 0.2, s, -s * 0.2], [-s * 0.3, -s * 0.2, 0, s * 0.95], [s * 0.3, -s * 0.2, 0, s * 0.95],
      [-s * 0.3, -s * 0.2, -s * 0.55, -s * 0.85], [s * 0.3, -s * 0.2, s * 0.55, -s * 0.85])
  },
  sole(c, s, col, b) {
    const raggi = Array.from({ length: 8 }, (_, i) => {
      const a = i * TAU / 8
      return poli([[Math.cos(a - 0.26) * s * 0.58, Math.sin(a - 0.26) * s * 0.58], [Math.cos(a) * s, Math.sin(a) * s],
                   [Math.cos(a + 0.26) * s * 0.58, Math.sin(a + 0.26) * s * 0.58]])
    })
    pieno(c, col, b, [...raggi, c => c.arc(0, 0, s * 0.55, 0, TAU)])
  },
  ancora(c, s, col) {
    const w = s * 0.2
    trattoP(c, col, w, c => {
      c.moveTo(0, -s * 0.5); c.lineTo(0, s * 0.85)
      c.moveTo(-s * 0.45, -s * 0.2); c.lineTo(s * 0.45, -s * 0.2)
      c.moveTo(-s * 0.85, s * 0.1); c.arc(0, s * 0.1, s * 0.85, Math.PI, 0, true)
    })
    trattoP(c, col, w * 0.8, c => { c.moveTo(s * 0.2, -s * 0.78); c.arc(0, -s * 0.78, s * 0.2, 0, TAU) })
  },
  nota(c, s, col, b) {
    pieno(c, col, b, [
      ell(-s * 0.3, s * 0.62, s * 0.42, s * 0.3, -0.4),
      c => c.rect(s * 0.08, -s * 0.9, s * 0.2, s * 1.55),
      c => { c.moveTo(s * 0.28, -s * 0.9); c.quadraticCurveTo(s * 1.05, -s * 0.6, s * 0.7, -s * 0.05); c.lineTo(s * 0.28, -s * 0.4); c.closePath() },
    ])
  },
  quadrifoglio(c, s, col, b) {
    trattoP(c, col, s * 0.16, c => { c.moveTo(0, 0); c.quadraticCurveTo(s * 0.1, s * 0.6, s * 0.4, s * 0.95) })
    const foglie = [0, 1, 2, 3].map(k => c2 => {
      c2.save(); c2.rotate(k * Math.PI / 2); c2.translate(0, -s * 0.5); cuoreP(c2, s * 0.55); c2.restore()
    })
    pieno(c, col, b, foglie)
  },
  scudo(c, s, col, b) {
    const sagoma = c => {
      c.moveTo(-s * 0.8, -s * 0.8); c.lineTo(s * 0.8, -s * 0.8); c.lineTo(s * 0.8, s * 0.1)
      c.quadraticCurveTo(s * 0.8, s * 0.7, 0, s); c.quadraticCurveTo(-s * 0.8, s * 0.7, -s * 0.8, s * 0.1); c.closePath()
    }
    pieno(c, col, b, [sagoma])
    c.save(); c.beginPath(); sagoma(c); c.clip()
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, -s, s, s * 2)
    c.restore()
  },
}

export const STEMMI_ID = Object.keys(STEMMI)

export function disegnaStemma(ctx, id, x, y, s, col) {
  const f = STEMMI[id]
  if (!f) return
  ctx.save(); ctx.translate(x, y)
  f(ctx, s, col || '#fff', Math.max(1.6, s * 0.22))
  ctx.restore()
}

// ---- il pacco regalo del boss ----
export function disegnaPacco(ctx, x, y, s, aperto, t = 0) {
  ctx.save()
  if (aperto) {   // i raggi dietro, che girano piano
    ctx.save(); ctx.translate(x, y - s * 0.2); ctx.rotate(t * 0.25)
    for (let i = 0; i < 12; i++) {
      ctx.rotate(TAU / 12); ctx.fillStyle = i % 2 ? '#ffd94a22' : '#ffffff14'
      ctx.beginPath(); ctx.moveTo(-s * 0.22, 0); ctx.lineTo(0, -s * 2.6); ctx.lineTo(s * 0.22, 0); ctx.fill()
    }
    ctx.restore()
  }
  ctx.fillStyle = '#3a86ff'; ctx.strokeStyle = '#13285a'; ctx.lineWidth = Math.max(1.5, s * 0.065)
  tondo(ctx, x - s * 0.8, y - s * 0.2, s * 1.6, s, s * 0.13); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#ffd94a'; ctx.fillRect(x - s * 0.12, y - s * 0.2, s * 0.24, s)
  ctx.save()
  if (aperto) { ctx.translate(x - s * 0.9, y - s * 0.3); ctx.rotate(-0.5); ctx.translate(-(x - s * 0.9), -(y - s * 0.3)) }
  ctx.fillStyle = '#5b9bff'
  tondo(ctx, x - s * 0.9, y - s * 0.45, s * 1.8, s * 0.3, s * 0.13); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#ffd94a'; ctx.fillRect(x - s * 0.12, y - s * 0.45, s * 0.24, s * 0.3)
  ctx.restore()
  ctx.restore()
}

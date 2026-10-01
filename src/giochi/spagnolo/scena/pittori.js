// I disegnini della mappa del tesoro: uno per tappa (il campo `disegno` di
// dati/mondi.js), uno per mondo in arrivo, il libro e il cassetto. Stile da
// carta nautica: contorno a inchiostro e acquerello sopra. Ogni pittore
// disegna attorno a (0,0) dentro un quadrato di ±40 e riceve `c.t`, che
// sbiadisce i colori verso la pergamena quanto la tappa è poco imparata:
// così lo stesso disegno si riempie e sbiadisce col grado, senza saperlo.
// Una figura nuova è una riga qui (vedi docs/core/grafica.md, i pittori).

const GIRO = Math.PI * 2

// una forma chiusa: acquerello e poi inchiostro
function forma(p, c, traccia, colore, sp = 2.2) {
  const x = p.ctx
  x.beginPath(); traccia(x)
  if (colore) { x.fillStyle = c.t(colore); x.fill() }
  x.strokeStyle = c.inchiostro; x.lineWidth = sp; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke()
}
const tondo = (p, c, cx, cy, rx, ry, colore, sp) =>
  forma(p, c, x => x.ellipse(cx, cy, rx, ry, 0, 0, GIRO), colore, sp)
const poli = (p, c, punti, colore, sp) =>
  forma(p, c, x => { punti.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath() }, colore, sp)
const rettangolo = (p, c, x0, y0, w, h, colore, sp, r = 3) =>
  forma(p, c, x => x.roundRect(x0, y0, w, h, r), colore, sp)
function tratto(p, c, punti, sp = 2.2, colore = null) {
  const x = p.ctx
  x.beginPath(); punti.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)))
  x.strokeStyle = colore ? c.t(colore) : c.inchiostro; x.lineWidth = sp; x.lineCap = 'round'; x.stroke()
}
const punto = (p, c, x, y, r = 2.4) => { p.ctx.beginPath(); p.ctx.arc(x, y, r, 0, GIRO); p.ctx.fillStyle = c.inchiostro; p.ctx.fill() }
function scritta(p, c, t, x, y, dim, colore = null) {
  const k = p.ctx
  k.fillStyle = colore ? c.t(colore) : c.inchiostro
  k.font = `700 ${dim}px Georgia, 'Times New Roman', serif`
  k.textAlign = 'center'; k.textBaseline = 'middle'
  k.fillText(t, x, y)
}
function persona(p, c, x, y, s, veste, capelli) {
  forma(p, c, k => { k.moveTo(x - 11 * s, y + 30 * s); k.quadraticCurveTo(x - 12 * s, y + 4 * s, x, y + 3 * s)
                     k.quadraticCurveTo(x + 12 * s, y + 4 * s, x + 11 * s, y + 30 * s); k.closePath() }, veste)
  tondo(p, c, x, y - 6 * s, 8.5 * s, 9 * s, '#f3c9a0')
  forma(p, c, k => { k.ellipse(x, y - 11 * s, 9 * s, 5 * s, 0, Math.PI, GIRO) }, capelli, 1.6)
  punto(p, c, x - 3 * s, y - 6 * s, 1.3 * s); punto(p, c, x + 3 * s, y - 6 * s, 1.3 * s)
}

export const PITTORI = {
  /* ── le tappe ── */
  cane(p, c) {
    tondo(p, c, -20, -4, 9, 20, '#8a5a34')          // orecchie che pendono
    tondo(p, c, 20, -4, 9, 20, '#8a5a34')
    tondo(p, c, 0, 0, 22, 24, '#d9a066')
    tondo(p, c, 0, 12, 12, 9, '#f2dcc0')
    punto(p, c, -8, -4, 3); punto(p, c, 8, -4, 3)
    tondo(p, c, 0, 7, 5, 3.6, '#3a2618', 1.5)
    forma(p, c, k => { k.moveTo(-3, 16); k.quadraticCurveTo(0, 26, 3, 16) }, '#e8708a', 1.6)
  },
  'punto-di-domanda'(p, c) {
    forma(p, c, k => { k.ellipse(0, -4, 34, 28, 0, 0, GIRO) }, '#fff4d8')
    poli(p, c, [[-14, 18], [-22, 34], [-2, 22]], '#fff4d8')
    scritta(p, c, '?', 0, -2, 44, '#c0392b')
  },
  pennelli(p, c) {
    forma(p, c, k => { k.moveTo(-34, 0); k.bezierCurveTo(-34, -30, 28, -34, 34, -6)
                       k.bezierCurveTo(38, 10, 20, 8, 16, 16); k.bezierCurveTo(10, 30, -34, 30, -34, 0) }, '#e7c99a')
    tondo(p, c, -18, -10, 6, 6, '#e0463a'); tondo(p, c, -2, -18, 6, 6, '#f4c430')
    tondo(p, c, 14, -14, 6, 6, '#3a86d4'); tondo(p, c, -20, 8, 6, 6, '#3fa34d')
    tondo(p, c, 2, 14, 5, 5, '#fff', 1.6)          // il buco per il pollice
    tratto(p, c, [[6, 34], [30, 6]], 5, '#a0703c')
    poli(p, c, [[28, 8], [36, -4], [34, 12]], '#e0463a', 1.6)
  },
  dita(p, c) {
    const blocco = (x, y, n, col) => { rettangolo(p, c, x - 13, y - 13, 26, 26, col, 2.2, 4); scritta(p, c, n, x, y + 1, 18) }
    blocco(-16, 14, '1', '#f4c430'); blocco(14, 14, '2', '#6fb3e8'); blocco(-1, -12, '3', '#e98a7a')
  },
  zaino(p, c) {
    rettangolo(p, c, -24, -22, 48, 56, '#d4553f', 2.2, 12)
    forma(p, c, k => { k.moveTo(-10, -22); k.quadraticCurveTo(0, -38, 10, -22) }, null)
    rettangolo(p, c, -16, 6, 32, 20, '#e8826f', 2, 6)
    tratto(p, c, [[-16, 12], [16, 12]], 1.8)
    tratto(p, c, [[-24, -6], [24, -6]], 1.8)
  },
  torta(p, c) {
    rettangolo(p, c, -30, 2, 60, 26, '#e8b9d0', 2.2, 5)
    forma(p, c, k => { k.moveTo(-30, 8); for (let i = 0; i <= 6; i++) k.quadraticCurveTo(-25 + i * 10, 16, -20 + i * 10, 8); k.lineTo(30, 2); k.lineTo(-30, 2); k.closePath() }, '#fff5f0')
    rettangolo(p, c, -30, -8, 60, 12, '#f5deb3', 2.2, 4)
    rettangolo(p, c, -3, -28, 6, 20, '#8fc0e8', 1.8, 2)
    forma(p, c, k => { k.moveTo(0, -40); k.quadraticCurveTo(7, -32, 0, -28); k.quadraticCurveTo(-7, -32, 0, -40) }, '#f7a531', 1.5)
    tondo(p, c, -16, -12, 4, 4, '#e0463a', 1.4); tondo(p, c, 16, -12, 4, 4, '#e0463a', 1.4)
  },
  famiglia(p, c) {
    persona(p, c, -18, -6, 1, '#4f7fc4', '#5a3a22')
    persona(p, c, 16, -8, 1.05, '#d05a6e', '#7a4a1e')
    persona(p, c, 0, 12, 0.62, '#f4c430', '#3a2618')
  },
  cappello(p, c) {
    tondo(p, c, 0, 14, 38, 11, '#6f8f3f')
    forma(p, c, k => { k.moveTo(-22, 14); k.bezierCurveTo(-22, -30, 22, -30, 22, 14); k.closePath() }, '#86a84e')
    forma(p, c, k => { k.moveTo(-21, 4); k.quadraticCurveTo(0, 10, 21, 4); k.lineTo(21.6, 11); k.quadraticCurveTo(0, 17, -21.6, 11); k.closePath() }, '#c0392b', 1.8)
  },
  faccia(p, c) {
    tondo(p, c, -27, 2, 7, 10, '#f3c9a0'); tondo(p, c, 27, 2, 7, 10, '#f3c9a0')
    tondo(p, c, 0, 2, 26, 30, '#f7d4b0')
    forma(p, c, k => { k.ellipse(0, -16, 27, 16, 0, Math.PI, GIRO); k.lineTo(27, -10); k.quadraticCurveTo(0, -20, -27, -10); k.closePath() }, '#8a5a34')
    tondo(p, c, -10, 0, 6, 7, '#fff', 1.8); tondo(p, c, 10, 0, 6, 7, '#fff', 1.8)
    punto(p, c, -10, 1, 3); punto(p, c, 10, 1, 3)
    tratto(p, c, [[0, 4], [-3, 13], [2, 13]], 1.8)
    forma(p, c, k => { k.moveTo(-9, 20); k.quadraticCurveTo(0, 28, 9, 20) }, null, 2)
  },
  piatto(p, c) {
    tondo(p, c, 0, 6, 36, 22, '#f8f4ea')
    tondo(p, c, 0, 6, 24, 14, '#fffdf6', 1.4)
    poli(p, c, [[-16, 2], [10, -4], [12, 2]], '#ef8a2e', 1.8)
    tratto(p, c, [[10, -4], [16, -10]], 2, '#3fa34d'); tratto(p, c, [[11, -2], [18, -4]], 2, '#3fa34d')
    for (const [x, y] of [[-6, 12], [0, 14], [6, 11], [-1, 8]]) tondo(p, c, x, y, 3, 3, '#6cbf3f', 1.2)
    tratto(p, c, [[34, -24], [30, 20]], 3)
  },
  bandiera(p, c) {
    tratto(p, c, [[-22, 38], [-22, -36]], 3.4, '#8a5a34')
    forma(p, c, k => { k.moveTo(-22, -34); k.quadraticCurveTo(0, -42, 26, -30); k.lineTo(26, 0); k.quadraticCurveTo(0, -12, -22, -4); k.closePath() }, '#fdfaf0')
    const k = p.ctx
    k.save(); k.beginPath(); k.moveTo(-22, -34); k.quadraticCurveTo(0, -42, 26, -30); k.lineTo(26, 0)
    k.quadraticCurveTo(0, -12, -22, -4); k.closePath(); k.clip()
    k.fillStyle = c.t('#2b2b2b')
    for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++)
      if ((i + j) % 2) k.fillRect(-22 + i * 8.2, -42 + j * 8.4 + i * 1.1, 8.2, 8.4)
    k.restore()
    tondo(p, c, -22, 38, 12, 3.5, '#b99a6a', 1.4)
  },

  /* ── i mondi ── */
  lente(p, c) {
    tratto(p, c, [[12, 12], [32, 32]], 8, '#8a5a34')
    tondo(p, c, -6, -6, 24, 24, '#cfe8f5', 3)
    forma(p, c, k => { k.arc(-6, -6, 16, Math.PI * 1.1, Math.PI * 1.45) }, null, 3)
  },
  casetta(p, c) {
    poli(p, c, [[-28, -4], [0, -32], [28, -4]], '#c0392b')
    rettangolo(p, c, -22, -4, 44, 36, '#f2d9a8', 2.2, 1)
    rettangolo(p, c, -6, 12, 12, 20, '#8a5a34', 2, 2)
    rettangolo(p, c, 8, 2, 10, 10, '#9fd0ea', 1.8, 1)
  },
  scatola(p, c) {
    poli(p, c, [[-26, -6], [0, -16], [26, -6], [0, 4]], '#c8955c')
    poli(p, c, [[-26, -6], [0, 4], [0, 34], [-26, 22]], '#d9a86c')
    poli(p, c, [[26, -6], [0, 4], [0, 34], [26, 22]], '#b8854c')
    poli(p, c, [[-26, -6], [-34, -22], [-8, -30], [0, -16]], '#e0b47a', 1.8)
    tondo(p, c, 16, -28, 7, 7, '#e0463a', 1.8)
  },
  palla(p, c) {
    tondo(p, c, 0, 0, 30, 30, '#f4f0e6')
    poli(p, c, [[0, -11], [10, -4], [7, 8], [-7, 8], [-10, -4]], '#2b2b2b', 1.6)
    for (const a of [0, 1, 2, 3, 4]) {
      const r = a / 5 * GIRO - Math.PI / 2
      tratto(p, c, [[Math.cos(r) * 11, Math.sin(r) * 11], [Math.cos(r) * 28, Math.sin(r) * 28]], 1.6)
    }
  },
  sole(p, c) {
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * GIRO
      poli(p, c, [[Math.cos(a - 0.14) * 22, Math.sin(a - 0.14) * 22], [Math.cos(a) * 38, Math.sin(a) * 38],
                  [Math.cos(a + 0.14) * 22, Math.sin(a + 0.14) * 22]], '#f7a531', 1.6)
    }
    tondo(p, c, 0, 0, 22, 22, '#f9d648')
    punto(p, c, -7, -3, 2.4); punto(p, c, 7, -3, 2.4)
    forma(p, c, k => { k.moveTo(-8, 7); k.quadraticCurveTo(0, 14, 8, 7) }, null, 2)
  },
  coppia(p, c) {
    persona(p, c, -15, -4, 1.05, '#4f7fc4', '#5a3a22')
    persona(p, c, 15, -4, 1.05, '#d05a6e', '#c07a2a')
  },
  bicicletta(p, c) {
    tondo(p, c, -20, 12, 15, 15, null, 2.6); tondo(p, c, 20, 12, 15, 15, null, 2.6)
    tratto(p, c, [[-20, 12], [-4, -8], [14, -8], [20, 12]], 3, '#2e86c1')
    tratto(p, c, [[-4, -8], [0, 12], [14, -8]], 3, '#2e86c1')
    tratto(p, c, [[-8, -14], [2, -14]], 3.4)
    tratto(p, c, [[14, -8], [12, -18], [20, -20]], 2.6)
  },
  clessidra(p, c) {
    rettangolo(p, c, -24, -36, 48, 7, '#a0703c', 2, 2); rettangolo(p, c, -24, 29, 48, 7, '#a0703c', 2, 2)
    forma(p, c, k => { k.moveTo(-18, -29); k.lineTo(18, -29); k.quadraticCurveTo(16, -6, 3, 0)
                       k.quadraticCurveTo(16, 6, 18, 29); k.lineTo(-18, 29); k.quadraticCurveTo(-16, 6, -3, 0)
                       k.quadraticCurveTo(-16, -6, -18, -29) }, '#e6f2f8')
    poli(p, c, [[-9, -12], [9, -12], [0, -2]], '#e8c26a', 1.4)
    poli(p, c, [[-15, 28], [15, 28], [0, 14]], '#e8c26a', 1.4)
  },
  forziere(p, c) {
    forma(p, c, k => { k.moveTo(-32, -4); k.bezierCurveTo(-32, -30, 32, -30, 32, -4); k.closePath() }, '#a0602c')
    rettangolo(p, c, -32, -4, 64, 34, '#b8733a', 2.2, 2)
    rettangolo(p, c, -34, -6, 68, 6, '#e0b040', 1.8, 2)
    rettangolo(p, c, -6, -2, 12, 14, '#e0b040', 1.8, 2)
    tratto(p, c, [[-18, -24], [-18, 30]], 2); tratto(p, c, [[18, -24], [18, 30]], 2)
    tratto(p, c, [[-10, 16], [10, 26]], 3, '#c0392b'); tratto(p, c, [[10, 16], [-10, 26]], 3, '#c0392b')
  },
  // le feste: una zucca di Halloween
  zucca(p, c) {
    tondo(p, c, -13, 6, 15, 22, '#e07d24')
    tondo(p, c, 13, 6, 15, 22, '#e07d24')
    tondo(p, c, 0, 6, 15, 24, '#f2973a')
    forma(p, c, k => { k.moveTo(-3, -16); k.quadraticCurveTo(-1, -26, 6, -30); k.lineTo(8, -26); k.quadraticCurveTo(3, -22, 3, -16); k.closePath() }, '#5f8a3a', 1.8)
    poli(p, c, [[-12, -2], [-6, 4], [-14, 6]], '#4a2a10', 1.2)
    poli(p, c, [[12, -2], [6, 4], [14, 6]], '#4a2a10', 1.2)
    forma(p, c, k => { k.moveTo(-12, 14); k.quadraticCurveTo(0, 24, 12, 14); k.quadraticCurveTo(0, 18, -12, 14) }, '#4a2a10', 1.2)
  },

  /* ── il libro e il cassetto ── */
  libro(p, c) {
    forma(p, c, k => { k.moveTo(0, -18); k.quadraticCurveTo(-18, -26, -36, -20); k.lineTo(-36, 22)
                       k.quadraticCurveTo(-18, 16, 0, 24); k.closePath() }, '#fdf6e3')
    forma(p, c, k => { k.moveTo(0, -18); k.quadraticCurveTo(18, -26, 36, -20); k.lineTo(36, 22)
                       k.quadraticCurveTo(18, 16, 0, 24); k.closePath() }, '#fdf6e3')
    for (let i = 0; i < 4; i++) {
      tratto(p, c, [[-29, -11 + i * 8], [-7, -9 + i * 8]], 1.4)
      tratto(p, c, [[7, -9 + i * 8], [29, -11 + i * 8]], 1.4)
    }
    tratto(p, c, [[0, -18], [0, 24]], 2)
    tratto(p, c, [[22, -24], [22, -8]], 3, '#c0392b')
  },
  cassetto(p, c) {
    poli(p, c, [[-30, -12], [0, -24], [30, -12], [0, 0]], '#d9b07a')
    poli(p, c, [[-30, -12], [0, 0], [0, 30], [-30, 18]], '#c8955c')
    poli(p, c, [[30, -12], [0, 0], [0, 30], [30, 18]], '#b07c46')
    tratto(p, c, [[-30, 3], [0, 15]], 1.6); tratto(p, c, [[30, 3], [0, 15]], 1.6)
    tratto(p, c, [[-15, -18], [15, -6]], 4, '#e8d9a8')
  },
}

// quello che si mette sopra una tappa chiusa: un lucchetto piccolo in basso a destra
export function lucchetto(p, c, x, y) {
  const k = p.ctx
  k.save(); k.translate(x, y)
  forma(p, { ...c, t: s => s }, q => { q.arc(0, -5, 6, Math.PI, 0) }, null, 2.6)
  rettangolo(p, { ...c, t: s => s }, -8, -5, 16, 13, '#c9a227', 2, 2)
  k.restore()
}

export const DISEGNI = Object.keys(PITTORI)

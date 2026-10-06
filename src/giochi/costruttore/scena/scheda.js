// Il disegno della scheda del robot: i componenti di decoro come tracciati
// SVG, a strati. Dove sta ogni cosa lo decide motore/scheda.js; qui solo
// com'è fatta. Vedi docs/costruttore/scheda.md.

export const COLORI = {
  scheda: '#0d3b2c', serigrafia: '#3a7d63',
  spento: '#7a5b3d', rame: '#e8a24f', lucido: '#ffd9a3',
  led: '#ffc857', ledChiaro: '#fff0b3', ledNumero: '#4a3200',
  ledSpento: '#17332a', ledSpentoBordo: '#3d6a58', ledSpentoNumero: '#7aa391',
  chip: '#121815',
}
// il decoro è verde su verde: niente rame, niente led, niente che sembri da toccare
const FD = '#0a2a20', FS = '#1f6a50', FL = '#17533e', FM = '#256d52'

export const STRATI = [
  ['fondo', { fill: COLORI.scheda }],
  ['bus', { stroke: FL, sw: 3 }],
  ['filo', { stroke: FL, sw: 1.5 }],
  ['gamba', { stroke: FL, sw: 2 }],
  ['corpo', { fill: FD, stroke: FS, sw: 1.5 }],
  ['ombra', { fill: '#123b2f' }],
  ['scuro', { fill: '#071f17' }],
  ['tacca', { fill: FL }],
  ['segno', { fill: FM }],
  ['tratto', { stroke: FM, sw: 1.5 }],
  ['anello', { stroke: FL, sw: 1.5 }],
  ['via', { fill: FD, stroke: FS, sw: 1.5 }],
  ['foro', { fill: '#071f17', stroke: FS, sw: 2.5 }],
]

const n = v => Math.round(v * 10) / 10

/* una penna che scrive negli strati, spostata in (tx, ty) e girata di 0 o 90 gradi */
function penna() {
  const strati = Object.fromEntries(STRATI.map(([k]) => [k, []]))
  const scritte = []
  let tx = 0, ty = 0, giro = 0
  const p = (x, y) => (giro ? [tx - y, ty + x] : [tx + x, ty + y])
  const traccia = (strato, comandi) => {
    let d = ''
    for (const c of comandi) {
      if (c[0] === 'Z') { d += 'Z'; continue }
      if (c[0] === 'A') { const [x, y] = p(c[4], c[5]); d += `A${c[1]} ${c[1]} 0 ${c[2]} ${c[3]} ${n(x)} ${n(y)}`; continue }
      const [x, y] = p(c[1], c[2])
      d += `${c[0]}${n(x)} ${n(y)}`
    }
    strati[strato].push(d)
  }
  const rett = (strato, x, y, w, h, r = 0) => {
    r = Math.min(r, w / 2, h / 2)
    if (!r) return traccia(strato, [['M', x, y], ['L', x + w, y], ['L', x + w, y + h], ['L', x, y + h], ['Z']])
    traccia(strato, [['M', x + r, y], ['L', x + w - r, y], ['A', r, 0, 1, x + w, y + r], ['L', x + w, y + h - r],
                     ['A', r, 0, 1, x + w - r, y + h], ['L', x + r, y + h], ['A', r, 0, 1, x, y + h - r],
                     ['L', x, y + r], ['A', r, 0, 1, x + r, y], ['Z']])
  }
  const cerchio = (strato, x, y, r) =>
    traccia(strato, [['M', x - r, y], ['A', r, 0, 1, x + r, y], ['A', r, 0, 1, x - r, y], ['Z']])
  const linea = (strato, ...pp) => traccia(strato, pp.map((q, i) => [i ? 'L' : 'M', q[0], q[1]]))
  return {
    strati, scritte, rett, cerchio, linea, traccia,
    a(x, y, g = 0) { tx = x; ty = y; giro = g },
    scrivi(x, y, testo) { const [a, b] = p(x, y); scritte.push({ x: n(a), y: n(b), testo }) },
  }
}

/* ogni componente, centrato nell'origine (le misure stanno in motore/scheda.js) */
const DISEGNI = {
  resistenza(q) {
    q.linea('gamba', [-23, 0], [-12, 0]); q.linea('gamba', [12, 0], [23, 0])
    q.rett('corpo', -12, -5, 24, 10, 3)
    for (const x of [-6, -1, 4]) q.rett('segno', x, -5, 2.5, 10)
    q.cerchio('via', -23, 0, 3); q.cerchio('via', 23, 0, 3)
  },
  smd(q) { q.rett('corpo', -9, -4, 18, 8, 1); q.rett('segno', -13, -5, 5, 10); q.rett('segno', 8, -5, 5, 10) },
  elettrolitico(q) {
    q.cerchio('corpo', 0, 0, 11)
    q.traccia('ombra', [['M', 0, -11], ['A', 11, 0, 1, 0, 11], ['Z']])
    q.linea('tratto', [-5, 0], [-1, 0]); q.cerchio('tratto', 0, 0, 3)
  },
  ceramico(q) {
    q.linea('gamba', [-4, 4], [-4, 13]); q.linea('gamba', [4, 4], [4, 13])
    q.rett('corpo', -7, -13, 14, 17, 6)
    q.cerchio('via', -4, 14, 3); q.cerchio('via', 4, 14, 3)
  },
  transistor(q) {
    for (const x of [-6, 0, 6]) { q.linea('gamba', [x, 3], [x, 13]); q.cerchio('via', x, 14, 3) }
    q.traccia('corpo', [['M', -9, 3], ['L', -9, -3], ['A', 9, 0, 1, 9, -3], ['L', 9, 3], ['Z']])
  },
  quarzo(q) {
    q.linea('gamba', [-8, 8], [-8, 10]); q.linea('gamba', [8, 8], [8, 10])
    q.rett('corpo', -20, -8, 40, 16, 8); q.rett('tratto', -13, -4, 26, 8, 4)
  },
  diodo(q) {
    q.linea('gamba', [-21, 0], [-9, 0]); q.linea('gamba', [9, 0], [21, 0])
    q.rett('corpo', -9, -5, 18, 10, 2); q.rett('segno', 3, -5, 3, 10)
    q.cerchio('via', -21, 0, 3); q.cerchio('via', 21, 0, 3)
  },
  display(q) {
    for (let i = -2; i <= 2; i++) { q.rett('segno', -26, i * 10 - 2.5, 4, 5); q.rett('segno', 22, i * 10 - 2.5, 4, 5) }
    q.rett('corpo', -22, -26, 44, 52, 3); q.rett('scuro', -15, -19, 30, 38, 2)
    for (const s of [[-9, -14, 18, 3], [-9, -1.5, 18, 3], [-9, 11, 18, 3], [-12, -12, 3, 12], [9, -12, 3, 12], [-12, 1, 3, 12], [9, 1, 3, 12]])
      q.rett('tacca', ...s)
    q.cerchio('tacca', 13, 15, 1.6)
  },
  pettine(q) {
    q.rett('corpo', -38, -7, 76, 14, 2)
    for (let i = 0; i < 8; i++) { q.rett('scuro', -33 + i * 9.2, -4, 6, 8); q.cerchio('segno', -30 + i * 9.2, 0, 1.8) }
  },
  batteria(q) {
    q.cerchio('corpo', 0, 0, 23); q.cerchio('anello', 0, 0, 15); q.rett('segno', -4, -23, 8, 5)
    q.scrivi(0, 4, '3V')
  },
  dip(q) {
    for (let i = 0; i < 4; i++) { q.rett('tacca', -18 + i * 12 - 2.5, -20, 5, 6); q.rett('tacca', -18 + i * 12 - 2.5, 14, 5, 6) }
    q.rett('corpo', -24, -14, 48, 28, 3); q.cerchio('tratto', -17, -7, 2.5)
  },
  induttanza(q) { q.rett('corpo', -13, -13, 26, 26, 5); for (const r of [9, 6, 3]) q.cerchio('anello', 0, 0, r) },
  trimmer(q) { q.rett('corpo', -12, -12, 24, 24, 3); q.cerchio('tratto', 0, 0, 8); q.linea('tratto', [-6, -2], [6, 2]) },
}

const unisci = strati => Object.fromEntries(Object.entries(strati).map(([k, v]) => [k, v.join('')]))

/* il decoro di tutta la scheda: bus, fori, componenti coi loro fili, vie sparse, sigle */
export function disegnaDecoro(s) {
  const q = penna()
  q.a(0, 0)
  q.rett('fondo', 0, 0, s.W, s.H)
  for (const b of s.bus) q.linea('bus', ...b)
  for (const f of s.fili) { q.linea('filo', [f.x0, f.y], [f.x1, f.y]) }
  for (const [x, y] of s.vie) q.cerchio('via', x, y, 3)
  for (const [x, y] of s.fori) q.cerchio('foro', x, y, 8)
  const sigle = []
  for (const c of s.decoro) {
    q.a(c.x, c.y, c.rot ? 1 : 0)
    DISEGNI[c.tipo](q)
    if (c.sigla) sigle.push({ x: c.x, y: c.y + c.h / 2 + 11, testo: c.sigla })
  }
  return { strati: unisci(q.strati), scritte: [...q.scritte, ...sigle] }
}

/* i componenti sotto cui passa la pista: col fondo pieno, così la coprono */
export function disegnaCoperchi(s) {
  const q = penna()
  for (const c of s.coperchi) {
    q.a(c.x, c.y)
    q.rett('fondo', -c.w / 2, -c.h / 2, c.w, c.h, 4)
    DISEGNI[c.tipo](q)
  }
  return { strati: unisci(q.strati), scritte: q.scritte }
}

/* i piedini di un chip largo 2·mezzo: quattro per lato, otto sopra e sotto */
export function piediniChip(mezzo) {
  let d = ''
  const r = (x, y, w, h) => { d += `M${x} ${y}h${w}v${h}h${-w}Z` }
  for (const y of [-21, -7, 7, 21]) { r(-mezzo - 9, y - 3, 9, 6); r(mezzo, y - 3, 9, 6) }
  // in mezzo, sopra e sotto, ci sono le piazzole della pista
  for (let k = 1; k <= 4; k++) for (const v of [-1, 1]) {
    const x = n(v * k * 0.22 * mezzo)
    r(x - 3, -40, 6, 8); r(x - 3, 32, 6, 8)
  }
  return d
}

// una spezzata come tracciato SVG
export const tracciato = punti => punti.map((p, i) => `${i ? 'L' : 'M'}${n(p[0])} ${n(p[1])}`).join('')

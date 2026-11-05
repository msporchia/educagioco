// Il terreno di Castle Battle disegnato col programma, A MONTE: `npm run disegni:arena` lo fa punto per punto e ne salva
// l'immagine, che il gioco legge già pronta, e che ChatGPT ridipinge (docs/arena/grafica.md). Il gioco non importa questo file.
import { CAMPO, POSTI, TERRENI } from '../../../src/giochi/arena/dati/regole.js'
import { AMBIENTI, ambiente } from '../../../src/giochi/arena/scena/ambienti.js'
import { disegnaDecori, ombraDecoro, FIGURE } from './decori.js'

export const G = 2                       // punti del disegno per unità del mondo: la grana delle figure

/* quello che un test può guardare senza schermo: ogni posto ha i suoi colori e i suoi decori, e nessun decoro alto sta su una piazzola */
export function guastiDelTerreno() {
  const g = []
  for (const t of TERRENI) {
    const a = AMBIENTI[t]
    if (!a) { g.push(`${t}: manca l'ambientazione`); continue }
    if (!SUOLI[a.suolo] || !FIUMI[a.fiume]) g.push(`${t}: suolo o fiume sconosciuto`)
    for (const d of [...a.alti, ...a.bassi, ...(a.vicinoAcqua || [])]) if (!FIGURE[d]) g.push(`${t}: decoro sconosciuto ${d}`)
  }
  for (const [x, y] of CENTRI) if (libero(x, y, true) || libero(x, y, false)) g.push(`un decoro può stare sulla piazzola ${x},${y}`)
  if (libero(CAMPO.corsia, 100, false)) g.push('un decoro può stare sulla strada')
  if (libero(60, MEZZO, false)) g.push('un decoro può stare nel fiume')
  return g
}

/* il rumore: una tavola letta con l'interpolazione, così costa pochi conti anche su un telefono vecchio */
const T = 256
const tavola = (() => {
  const t = new Float32Array(T * T)
  let s = 1234567
  for (let i = 0; i < t.length; i++) { s = (Math.imul(s, 1664525) + 1013904223) | 0; t[i] = (s >>> 8) / 16777216 }
  return t
})()
function rumore(x, y) {
  const xf = Math.floor(x), yf = Math.floor(y)
  let fx = x - xf, fy = y - yf
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
  const x0 = xf & 255, x1 = (xf + 1) & 255, y0 = (yf & 255) << 8, y1 = ((yf + 1) & 255) << 8
  const a = tavola[y0 + x0], b = tavola[y0 + x1], c = tavola[y1 + x0], d = tavola[y1 + x1]
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}
const nuvola = (x, y) => rumore(x, y) * 0.55 + rumore(x * 2.1 + 9, y * 2.1 + 4) * 0.3 + rumore(x * 4.3 + 3, y * 4.3 + 7) * 0.15
const liscia = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t) }
export const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16)
/* il colore di una rampa, col retino fra un gradino e l'altro: è questo che fa «pixel art» e non sfumatura */
const tono = (r, v, b) => r[Math.max(0, Math.min(r.length - 1, Math.floor(v * (r.length - 1) + b)))]

const MEZZO = (CAMPO.fiume.alto + CAMPO.fiume.basso) / 2
const MEZZA = (CAMPO.fiume.basso - CAMPO.fiume.alto) / 2
const CENTRI = POSTI.flatMap(([x, y]) => [[x, y + 14], [x, CAMPO.H - y + 14]])

/* la strada e il fiume stanno dove li vuole il motore: al ponte sono dritti, lontano si muovono */
const stradaIn = y => CAMPO.corsia + (rumore(y / 60, 3.3) - 0.5) * 16 * liscia(46, 110, Math.abs(y - MEZZO))
function fiumeIn(x) {
  const lontano = liscia(36, 120, Math.abs(x - CAMPO.corsia))
  return { y: MEZZO + (Math.sin(x / 43) * 7 + (nuvola(x / 80, 2.2) - 0.5) * 22) * lontano, mezza: MEZZA + 1 + lontano * 12 }
}

/* il suolo di ogni posto */
const SUOLI = {
  colline(a, x, y, n, f, b) {
    const onda = Math.sin((y + n * 90) / 11 + Math.sin(x / 31) * 2) * 0.5 + 0.5
    if (rumore(x / 38 + 40, y / 38) > 0.66) return tono(a.macchia, 0.2 + n * 0.5 + f * 0.25, b)
    return tono(a.terra, 0.2 + n * 0.5 + onda * 0.12 + f * 0.14, b)
  },
  dune(a, x, y, n, f, b) {
    const w = y + 18 * Math.sin(x / 48) + n * 70
    const cresta = Math.sin(w / 5.2) * 0.5 + 0.5, grande = Math.sin(w / 37 + x / 90) * 0.5 + 0.5
    return tono(a.terra, 0.12 + grande * 0.46 + cresta * 0.2 + f * 0.1 + n * 0.1, b)
  },
  roccia(a, x, y, n, f, b) {
    const crepa = Math.abs(rumore(x / 18, y / 18) - 0.5), vena = Math.abs(rumore(x / 34 + 20, y / 34 + 5) - 0.5)
    if (vena < 0.011) return tono(a.macchia, 0.25 + f * 0.6, b)
    if (crepa < 0.016) return a.terra[0]
    const lastra = Math.floor(rumore(x / 18 + 3, y / 18 + 3) * 5) / 5
    return tono(a.terra, 0.14 + lastra * 0.4 + n * 0.24 + f * 0.12, b)
  },
  cenere(a, x, y, n, f, b) {
    const crepa = Math.abs(rumore(x / 22, y / 22) - 0.5)
    if (crepa < 0.013) return rumore(x / 60, y / 60 + 9) > 0.47 ? tono(a.macchia, 0.2 + f * 0.75, b) : a.terra[0]
    if (crepa < 0.024) return tono(a.macchia, 0.02, b * 0.6)
    return tono(a.terra, 0.1 + n * 0.5 + f * 0.2, b)
  },
}

/* l'acqua, o quello che ne fa le veci: dentro è quanto si è lontani dalla riva, 0-1 */
const FIUMI = {
  acqua(a, x, y, dentro, f, b) {
    const onda = Math.sin(y * 0.9 + x / 17 + rumore(x / 26, y / 9) * 7) * 0.5 + 0.5
    return tono(a.acqua, 0.72 - dentro * 0.6 + onda * 0.2 + f * 0.08, b)
  },
  baratro(a, x, y, dentro, f, b) {
    const nebbia = rumore(x / 34, y / 12 + 8)
    return tono(a.acqua, dentro < 0.28 ? 0.12 : 0.04 + nebbia * nebbia * 0.8 * liscia(0.3, 0.9, dentro), b)
  },
  brace(a, x, y, dentro, f, b) {
    const crosta = rumore(x / 12, y / 8), caldo = Math.abs(crosta - 0.5) < 0.1 ? 0.4 : 0
    return tono(a.acqua, 0.12 + dentro * 0.3 + caldo + f * 0.1, b)
  },
}

function selciato(a, x, y, d, f, b) {
  if (a.selciato === 'terra') {
    const solco = Math.abs(d - 8) < 1.6 ? -0.2 : 0
    return tono(a.strada, 0.52 + (rumore(x / 9, y / 9) - 0.5) * 0.5 + solco + f * 0.15, b)
  }
  const riga = Math.floor(y / 7), u = (x + (riga & 1) * 5) / 10, v = y / 7
  const fuga = u - Math.floor(u) < 0.12 || v - Math.floor(v) < 0.16
  if (fuga) return a.strada[0]
  return tono(a.strada, 0.3 + rumore(Math.floor(u) * 3.7, riga * 2.3) * 0.5 + f * 0.14, b)
}

/* il colore di un punto del mondo */
function punto(a, x, y, b) {
  const n = nuvola(x / 92, y / 92), f = rumore(x / 3.1, y / 3.1)
  const fiume = fiumeIn(x), d = Math.abs(y - fiume.y) - fiume.mezza
  if (d < 0) return FIUMI[a.fiume](a, x, y, Math.min(1, -d / fiume.mezza), f, b)
  if (d < 6 + f * 4) return tono(a.riva, 1 - d / 10 + (f - 0.5) * 0.4, b)
  const ds = Math.abs(x - stradaIn(y))
  if (ds < 15 + f * 3) return selciato(a, x, y, ds, f, b)
  let c = SUOLI[a.suolo](a, x, y, n, f, b)
  // attorno alle piazzole il terreno è battuto: ci si vede dove si costruisce
  let vicino = 1e9
  for (const [px, py] of CENTRI) { const dx = (x - px) / 46, dy = (y - py) / 30, q = dx * dx + dy * dy; if (q < vicino) vicino = q }
  if (vicino < 1 && (f + vicino * 1.3) < 1.05) c = tono(a.strada, 0.28 + n * 0.3, b)
  return c
}

const rampe = cache => cache.rampe ||= Object.fromEntries(['terra', 'macchia', 'strada', 'riva', 'acqua'].map(k => [k, cache[k].map(hex)]))

/* dove un decoro non deve stare: sulla strada, sul fiume, davanti a una piazzola, davanti a un castello o a una porta */
export function libero(x, y, alto) {
  const dx = Math.abs(x - CAMPO.corsia), metà = y > MEZZO ? y : CAMPO.H - y
  if (dx < 26 || Math.abs(y - fiumeIn(x).y) < fiumeIn(x).mezza + 10) return false
  if (dx < 92 && metà > 462) return false
  if (dx < 52 && Math.abs(metà - CAMPO.muro) < 34) return false
  for (const [px, py] of CENTRI) if (Math.abs(x - px) < 42 && Math.abs(y - py) < 34) return false
  // quello alto sta fuori dalla diagonale delle piazzole, dove non copre nessuno
  return !alto || metà < 304 ? (!alto || dx > 60) : dx > 112 + (metà - 344) * 0.2
}

/* la tela di un pezzo di mondo: { x, y, w, h } in unità */
export function dipingi(chiave, { x, y, w, h }, g = G) {
  const a = ambiente(chiave), r = rampe(a)
  const W = Math.ceil(w * g), H = Math.ceil(h * g)
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const c = cv.getContext('2d')
  const img = c.createImageData(W, H), dati = img.data
  const mondo = { ...a, ...r }
  for (let j = 0, i = 0; j < H; j++) {
    const wy = y + j / g
    for (let k = 0; k < W; k++, i += 4) {
      const col = punto(mondo, x + k / g, wy, BAYER[(j & 3) * 4 + (k & 3)])
      dati[i] = col[0]; dati[i + 1] = col[1]; dati[i + 2] = col[2]; dati[i + 3] = 255
    }
  }
  c.putImageData(img, 0, 0)
  decora(c, a, { x, y, w, h }, W, H, g)
  luce(c, a, W, H)
  return cv
}

/* i decori del mondo, tutti figli di una griglia fissa: chi vede di più vede anche di più cose, ma le stesse */
function decora(c, a, v, W, H, g) {
  const P = 21, lista = []
  for (let gy = Math.floor((v.y - 40) / P); gy * P < v.y + v.h + 50; gy++) {
    for (let gx = Math.floor((v.x - 40) / P); gx * P < v.x + v.w + 40; gx++) {
      const h = (Math.imul(gx * 73856093 ^ gy * 19349663, 2654435761) >>> 8) / 16777216
      const q = (h * 977) % 1, x = (gx + 0.15 + ((h * 53) % 1) * 0.7) * P, y = (gy + 0.15 + ((h * 131) % 1) * 0.7) * P
      const dx = Math.abs(x - CAMPO.corsia), bosco = rumore(x / 76 + 11, y / 76 + 6), acqua = Math.abs(y - fiumeIn(x).y) - fiumeIn(x).mezza
      // a macchie, con le radure in mezzo: in un posto pieno dappertutto l'occhio non si ferma da nessuna parte
      const alto = q < (0.14 + liscia(120, 170, dx) * 0.2) + liscia(0.46, 0.62, bosco) * 0.75 + (a.vicinoAcqua && acqua < 42 ? 0.55 : 0)
      if (!libero(x, y, alto)) continue
      if (!alto && h > 0.5) continue
      const nomi = alto ? (a.vicinoAcqua && acqua < 42 ? a.vicinoAcqua : a.alti) : a.bassi
      lista.push({ x, y, nome: nomi[Math.floor(q * 97) % nomi.length], alto, h })
    }
  }
  lista.sort((p, q) => p.y - q.y)
  const ombre = lista.filter(d => d.alto)
  c.save(); c.scale(g, g); c.translate(-v.x, -v.y)
  for (const d of ombre) ombraDecoro(c, d)
  c.restore()
  // le figure si fanno su una tela a parte e si taglia il bordo morbido: pixel pieni, come negli sprite
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const q = cv.getContext('2d')
  q.scale(g, g); q.translate(-v.x, -v.y)
  disegnaDecori(q, lista, a)
  const dati = q.getImageData(0, 0, W, H), p = dati.data
  for (let i = 3; i < p.length; i += 4) p[i] = p[i] > 110 ? 255 : 0
  q.putImageData(dati, 0, 0)
  c.drawImage(cv, 0, 0)
}

/* la luce del posto: da in alto a sinistra */
function luce(c, a, W, H) {
  const g = c.createLinearGradient(0, 0, W, H)
  a.luce.forEach((col, i) => g.addColorStop(i / (a.luce.length - 1), col))
  c.fillStyle = g; c.fillRect(0, 0, W, H)
}

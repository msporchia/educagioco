/* I PASCOLI del sentiero del cane: le bozze dei posti senza zaino, una
   per forma. Qui si costruisce e basta; se un posto regge lo dice il
   risolutore in `generatore.js`. Le pecore non partono mai su una cella
   d'incastro (il posto partirebbe già perso). Niente massi e niente
   salti: i pascoli li misura il risolutore svelto (`motore/svelto.js`).
   Vedi docs/passo-passo/sentiero.md. */
import { Livello, celleIncastro } from './livello.js'

const a = (rnd, n) => Math.floor(rnd() * n)
const tra = (rnd, da, fino) => da + a(rnd, fino - da + 1)
const vicini = ([x, y], [u, v]) => Math.abs(x - u) + Math.abs(y - v) <= 1
const VERSI4 = [[1, 0], [0, 1], [-1, 0], [0, -1]]

/* le pecore, il cane e l'osso su un posto già fatto. `dove(x, y)` dice
   dove una pecora può stare; le prime `inFila` stanno una accanto
   all'altra, in riga o in colonna (il gregge già mezzo riunito), le
   altre sparse, mai accanto a un'altra */
function popola(m, rnd, { pecore, dove = () => true, soglia = [], inFila = 0, doveCane = () => true }) {
  const H = m.length, W = m[0].length
  const incastro = celleIncastro(new Livello(m.map(r => r.join(''))))
  const buona = (x, y) => x >= 0 && y >= 0 && x < W && y < H && m[y][x] === '.' && !incastro[y * W + x] &&
    dove(x, y) && !soglia.some(s => s[0] === x && s[1] === y)
  const libere = pred => {
    const l = []
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (pred(m[y][x], x, y)) l.push([x, y])
    return l
  }
  const messe = []
  if (inFila > 1) {
    const [dx, dy] = VERSI4[a(rnd, 2)]
    const l = libere((c, x, y) => Array.from({ length: inFila }, (_, k) => buona(x + k * dx, y + k * dy)).every(Boolean))
    if (!l.length) return null
    const [x0, y0] = l[a(rnd, l.length)]
    for (let k = 0; k < inFila; k++) { messe.push([x0 + k * dx, y0 + k * dy]); m[y0 + k * dy][x0 + k * dx] = 'p' }
  }
  for (let n = messe.length; n < pecore; n++) {
    const l = libere((c, x, y) => buona(x, y) && !messe.some(p => vicini(p, [x, y])))
    if (!l.length) return null
    const p = l[a(rnd, l.length)]
    messe.push(p)
    m[p[1]][p[0]] = 'p'
  }
  const cani = libere((c, x, y) => c === '.' && doveCane(x, y) && !messe.some(p => vicini(p, [x, y])))
  if (!cani.length) return null
  const [cx, cy] = cani[a(rnd, cani.length)]
  m[cy][cx] = 'P'
  const ossi = libere(c => c === '.')
  if (!ossi.length) return null
  const [ox, oy] = ossi[a(rnd, ossi.length)]
  m[oy][ox] = 'c'
  return m
}

/* un prato pieno, con qualche cespuglio e sasso sparso */
function prato(rnd, W, H, ostacoli) {
  const m = Array.from({ length: H }, () => Array(W).fill('.'))
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    if (rnd() < ostacoli) m[y][x] = ['A', 'B', 'S'][a(rnd, 3)]
  return m
}

/* girato a caso: una forma si scrive in un verso solo */
function gira(m, rnd) {
  let r = m.map(riga => riga.join(''))
  const volte = a(rnd, 4)
  for (let k = 0; k < volte; k++) {
    const g = [...r[0]].map((_, x) => r.map(riga => riga[x]).reverse().join(''))
    if (g[0].length > 9 || g.length > 11) break
    r = g
  }
  return rnd() < 0.5 ? r.map(riga => [...riga].reverse().join('')) : r
}

/* il recinto in una tacca del bordo di sotto, larga uno o due, con la
   siepe ai lati; torna le celle davanti al cancello */
function tacca(m, rnd, largo) {
  const H = m.length, W = m[0].length
  const da = tra(rnd, 1, W - largo - 1)
  for (let x = da - 1; x <= da + largo; x++) m[H - 1][x] = x === da - 1 || x === da + largo ? 'B' : '#'
  const soglia = []
  for (let x = da; x < da + largo; x++) { m[H - 2][x] = '.'; soglia.push([x, H - 2]) }
  return soglia
}

/* ── il pascolo aperto ──
   Il recinto è una tacca nel bordo; il fuori qua e là sul bordo, e a
   volte una lastra di ghiaccio dove le pecore scivolano. */
export function bozzaAperto(g, rnd) {
  const W = tra(rnd, 6, 8), H = tra(rnd, 6, 7)
  const m = prato(rnd, W, H, 0)
  const fuori = rnd() < 0.5 ? 'A' : '~'
  for (let y = 0; y < H - 1; y++) for (let x = 0; x < W; x++)
    if ((x === 0 || y === 0 || x === W - 1) && rnd() < 0.16) m[y][x] = fuori
  if (g.ghiaccio) {
    const w = 2 + a(rnd, W - 3), h = 1 + a(rnd, H - 3)
    const x0 = 1 + a(rnd, Math.max(1, W - w - 1)), y0 = 1 + a(rnd, Math.max(1, H - h - 2))
    for (let y = y0; y < y0 + h && y < H - 2; y++) for (let x = x0; x < x0 + w && x < W - 1; x++)
      m[y][x] = rnd() < 0.1 ? 'O' : '*'
  }
  for (let y = 0; y < H - 1; y++) for (let x = 0; x < W; x++)
    if (m[y][x] === '.' && rnd() < 0.07) m[y][x] = ['A', 'B', 'S'][a(rnd, 3)]
  const soglia = tacca(m, rnd, rnd() < 0.5 ? 2 : 1)
  const lontano = (x, y) => soglia.every(([sx, sy]) => Math.abs(x - sx) + Math.abs(y - sy) >= 2)
  const out = popola(m, rnd, { pecore: g.pecore, soglia, dove: lontano, inFila: g.inFila })
  return out && gira(out, rnd)
}

/* ── il recinto col cancello ──
   Il recinto sta contro il bordo, chiuso dalla staccionata, e il
   cancello è di lato: le pecore non entrano spinte dritte, vanno portate
   attorno alla staccionata e girate verso il cancello. */
export function bozzaCancello(g, rnd) {
  const W = tra(rnd, 8, 9), H = tra(rnd, 6, 7)
  const m = prato(rnd, W, H, 0.05)
  const rw = tra(rnd, 1, 2)
  const x0 = tra(rnd, 3, W - rw - 3)  // davanti al cancello il cane deve poter stare
  /* il recinto: in fondo, largo rw, con la staccionata sopra e ai lati */
  for (let x = 0; x < W; x++) if (x < x0 - 1 || x > x0 + rw) m[H - 1][x] = rnd() < 0.5 ? '.' : 'A'
  for (let x = x0; x < x0 + rw; x++) { m[H - 1][x] = '#'; m[H - 2][x] = '-' }
  m[H - 1][x0 - 1] = '-'; m[H - 1][x0 + rw] = '-'
  m[H - 2][x0 - 1] = 'B'; m[H - 2][x0 + rw] = 'B'
  /* il cancello: di lato, a destra o a sinistra, al posto della staccionata */
  const destra = rnd() < 0.5
  const gx = destra ? x0 + rw : x0 - 1
  m[H - 1][gx] = '.'
  const fx = destra ? gx + 1 : gx - 1
  m[H - 1][fx] = '.'
  m[H - 2][fx] = '.'
  m[H - 1][destra ? fx + 1 : fx - 1] = '.'   // e dietro: il posto del cane che spinge
  const soglia = [[gx, H - 1], [fx, H - 1], [fx, H - 2]]
  const lontano = (x, y) => y < H - 2 && Math.abs(x - gx) + Math.abs(y - (H - 1)) >= 3
  const out = popola(m, rnd, { pecore: g.pecore, soglia, dove: lontano, inFila: g.inFila })
  return out && gira(out, rnd)
}

/* ── il ghiaccio e la galleria ──
   Una siepe taglia il prato in due: di qua il cane, di là le pecore, il
   recinto e il ghiaccio dove scivolano. Si passa solo dalla buca, e si
   sbuca alle loro spalle. */
export function bozzaGalleria(g, rnd) {
  const W = tra(rnd, 7, 8), H = tra(rnd, 7, 9)
  const m = prato(rnd, W, H, 0.04)
  const muro = tra(rnd, 1, 2)           // la siepe: dopo `muro` righe dal lato del cane
  for (let x = 0; x < W; x++) m[muro][x] = rnd() < 0.3 ? 'B' : 'A'
  /* le buche: una di qua, una di là */
  m[a(rnd, muro)][a(rnd, W)] = '1'
  m[tra(rnd, muro + 1, H - 3)][a(rnd, W)] = '1'
  /* il ghiaccio: una macchia fra le pecore e il recinto */
  const y0 = tra(rnd, muro + 1, H - 3), y1 = Math.min(H - 3, y0 + tra(rnd, 1, 3))
  const x0 = a(rnd, W - 2), x1 = Math.min(W - 1, x0 + tra(rnd, 2, W - 1))
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
    if (m[y][x] === '.' || m[y][x] === 'S') m[y][x] = rnd() < 0.08 ? 'O' : '*'
  const soglia = tacca(m, rnd, rnd() < 0.5 ? 2 : 1)
  const out = popola(m, rnd, { pecore: g.pecore, soglia, inFila: g.inFila,
                               dove: (x, y) => y > muro + 1 && y < H - 2, doveCane: (x, y) => y < muro })
  if (!out) return null
  /* il cane è finito di là? si ricomincia */
  if (out.findIndex(r => r.includes('P')) > muro) return null
  return gira(out, rnd)
}

/* ── il gregge da riunire ──
   Il recinto è in fondo a un corridoio stretto: le pecore sparse vanno
   messe in fila davanti all'imbocco e spinte dentro una dietro l'altra. */
export function bozzaCorridoio(g, rnd) {
  const W = tra(rnd, 6, 8), H = tra(rnd, 7, 9)
  const m = prato(rnd, W, H, 0.06)
  const lungo = tra(rnd, 2, 3)
  const cx = tra(rnd, 1, W - 2)
  for (let y = H - lungo; y < H; y++) {
    for (let x = 0; x < W; x++) if (x !== cx) m[y][x] = rnd() < 0.2 ? 'B' : 'A'
    m[y][cx] = y === H - 1 ? '#' : '.'
  }
  const bocca = [cx, H - lungo - 1]
  m[bocca[1]][cx] = '.'
  const dentro = (x, y) => y < H - lungo - 1 && Math.abs(x - cx) + Math.abs(y - bocca[1]) >= 2
  // il cane comincia nel prato, non dentro il corridoio
  const out = popola(m, rnd, { pecore: g.pecore, dove: dentro, soglia: [bocca], inFila: g.inFila,
                               doveCane: (x, y) => y < H - lungo })
  return out && gira(out, rnd)
}

export const BOZZE_DEL_PASCOLO = { aperto: bozzaAperto, cancello: bozzaCancello, galleria: bozzaGalleria,
                                   corridoio: bozzaCorridoio }

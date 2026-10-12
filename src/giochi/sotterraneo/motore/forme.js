// Le forme delle stanze del sotterraneo (docs/sotterraneo/piani.md). Una forma è una maschera di celle (1 = si cammina)
// dentro un riquadro `bw × bh`; il piano la posa dove gli dice il BSP. Niente canvas, niente piano: gira in Node.
// Ogni funzione prende `rnd` (il caso del piano) e dà null se la forma non ci sta nelle misure date.

export const FORME = ['rettangolo', 'elle', 'tu', 'croce', 'doppia', 'caverna', 'sala']

// da quante celle in su una stanza è «grande»: ci si può nascondere, e ha le colonne
export const CELLE_SALA = 70

const tra = (rnd, a, b) => a + Math.floor(rnd() * (b - a + 1))   // intero in [a, b]
const vuota = (w, h) => new Uint8Array(w * h)
const riempi = (m, w, x0, y0, x1, y1) => {   // [x0, x1) × [y0, y1)
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) m[y * w + x] = 1
}

// la maschera a specchio / trasposta: le forme si disegnano in un verso solo e poi si girano
function specchia(m, w, h, orizzontale, verticale) {
  const o = vuota(w, h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
    o[y * w + x] = m[(verticale ? h - 1 - y : y) * w + (orizzontale ? w - 1 - x : x)]
  return o
}
function trasponi(m, w, h) {
  const o = vuota(h, w)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o[x * h + y] = m[y * w + x]
  return o
}

// un'unica massa, senza celle che si toccano solo di spigolo: una stanza spezzata in due non è una stanza
export function connessa(m, w, h) {
  let prima = m.indexOf(1)
  if (prima < 0) return false
  const visti = new Uint8Array(w * h), coda = [prima]
  visti[prima] = 1
  for (let i = 0; i < coda.length; i++) {
    const x = coda[i] % w, y = (coda[i] / w) | 0
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = x + dx, b = y + dy
      if (a < 0 || b < 0 || a >= w || b >= h || visti[b * w + a] || !m[b * w + a]) continue
      visti[b * w + a] = 1; coda.push(b * w + a)
    }
  }
  return coda.length === m.reduce((n, c) => n + c, 0)
}

// la maschera → pochi rettangoli (le righe uguali una sotto l'altra si fondono): `pezzi` della stanza
export function pezziDa(m, w, h, x0, y0) {
  const pezzi = []
  let aperti = []   // rettangoli ancora allargabili in basso
  for (let y = 0; y <= h; y++) {
    const corse = []
    if (y < h) for (let x = 0; x < w;) {
      if (!m[y * w + x]) { x++; continue }
      let f = x; while (f < w && m[y * w + f]) f++
      corse.push([x, f]); x = f
    }
    const nuovi = []
    for (const p of aperti) {
      const i = corse.findIndex(c => c[0] === p.da && c[1] === p.a)
      if (i >= 0) { p.h++; nuovi.push(p); corse.splice(i, 1) } else pezzi.push({ x: x0 + p.da, y: y0 + p.y, w: p.a - p.da, h: p.h })
    }
    for (const [da, a] of corse) nuovi.push({ da, a, y, h: 1 })
    aperti = nuovi
  }
  return pezzi
}

const SU_MISURA = {
  rettangolo: (maxW, maxH, rnd) => {
    const w = Math.max(5, Math.min(maxW, 5 + Math.floor(rnd() * 6)))
    const h = Math.max(4, Math.min(maxH, 4 + Math.floor(rnd() * 5)))
    const m = vuota(w, h); riempi(m, w, 0, 0, w, h)
    return { w, h, m }
  },

  // una L: un rettangolo senza un angolo (il braccio più corto sta sempre sopra i tre)
  elle: (maxW, maxH, rnd) => {
    if (maxW < 7 || maxH < 6) return null
    const w = tra(rnd, 7, Math.min(11, maxW)), h = tra(rnd, 6, Math.min(9, maxH))
    const cw = tra(rnd, 3, w - 3), ch = tra(rnd, 2, h - 3)
    let m = vuota(w, h); riempi(m, w, 0, 0, w, h)
    for (let y = 0; y < ch; y++) for (let x = w - cw; x < w; x++) m[y * w + x] = 0
    return { w, h, m: specchia(m, w, h, rnd() < 0.5, rnd() < 0.5) }
  },

  // una T: una sbarra e un gambo al centro; si gira da tutte e quattro le parti
  tu: (maxW, maxH, rnd) => {
    const girata = rnd() < 0.5
    const [mL, mD] = girata ? [maxH, maxW] : [maxW, maxH]   // lunghezza della sbarra, profondità
    if (mL < 8 || mD < 6) return null
    const L = tra(rnd, 8, Math.min(11, mL)), D = tra(rnd, 6, Math.min(9, mD))
    const sbarra = tra(rnd, 2, 3), gambo = tra(rnd, 3, 4)
    const g0 = Math.floor((L - gambo) / 2) + tra(rnd, -1, 1)
    let m = vuota(L, D); riempi(m, L, 0, 0, L, sbarra); riempi(m, L, g0, sbarra, g0 + gambo, D)
    m = specchia(m, L, D, false, rnd() < 0.5)
    return girata ? { w: D, h: L, m: trasponi(m, L, D) } : { w: L, h: D, m }
  },

  // una croce: due bracci larghi tre che si incrociano non proprio al centro
  croce: (maxW, maxH, rnd) => {
    if (maxW < 9 || maxH < 8) return null
    const w = tra(rnd, 9, Math.min(12, maxW)), h = tra(rnd, 8, Math.min(10, maxH))
    const at = 3
    const ax = Math.floor((w - at) / 2) + tra(rnd, -1, 1), ay = Math.floor((h - at) / 2) + tra(rnd, -1, 1)
    const m = vuota(w, h); riempi(m, w, 0, ay, w, ay + at); riempi(m, w, ax, 0, ax + at, h)
    return { w, h, m }
  },

  // due rettangoli che si sovrappongono per un pezzo: una stanza a Z o a scala
  doppia: (maxW, maxH, rnd) => {
    if (maxW < 9 || maxH < 7) return null
    const w = tra(rnd, 9, Math.min(13, maxW)), h = tra(rnd, 7, Math.min(10, maxH))
    let aw = Math.round(w * (0.5 + rnd() * 0.25)), bw = Math.round(w * (0.5 + rnd() * 0.25))
    let ah = Math.round(h * (0.5 + rnd() * 0.25)), bh = Math.round(h * (0.5 + rnd() * 0.25))
    if (aw + bw < w + 2) bw = w + 2 - aw   // si toccano per almeno due celle, in larghezza e in altezza
    if (ah + bh < h + 2) bh = h + 2 - ah
    const m = vuota(w, h)
    riempi(m, w, 0, 0, aw, ah); riempi(m, w, w - bw, h - bh, w, h)
    return { w, h, m: specchia(m, w, h, rnd() < 0.5, false) }
  },

  // una caverna: i bordi vanno e vengono di una cella alla volta, mai una riga più stretta di quattro
  caverna: (maxW, maxH, rnd) => {
    if (maxW < 9 || maxH < 7) return null
    const w = tra(rnd, 9, Math.min(14, maxW)), h = tra(rnd, 7, Math.min(10, maxH))
    const m = vuota(w, h), tetto = Math.floor(w / 3)
    let da = tra(rnd, 0, 2), a = w - tra(rnd, 0, 2)
    for (let y = 0; y < h; y++) {
      da = Math.max(0, Math.min(tetto, da + tra(rnd, -1, 1)))
      a = Math.min(w, Math.max(w - tetto, a + tra(rnd, -1, 1)))
      // la prima e l'ultima riga sono mangiate dagli angoli: una caverna non ha spigoli
      const mangia = (y === 0 || y === h - 1) ? 2 : (y === 1 || y === h - 2) ? 1 : 0
      riempi(m, w, da + mangia, y, a - mangia, y + 1)
    }
    return { w, h, m }
  },

  // una sala grande: un rettangolo largo (le colonne le mette il piano)
  sala: (maxW, maxH, rnd) => {
    if (maxW < 9 || maxH < 7) return null
    const w = Math.min(maxW, tra(rnd, 12, 18)), h = Math.min(maxH, tra(rnd, 9, 13))
    const m = vuota(w, h); riempi(m, w, 0, 0, w, h)
    return { w, h, m }
  },
}

// la forma `nome` dentro uno spazio di `maxW × maxH` celle: { w, h, m, pezzi } o null se non ci sta
export function costruisci(nome, maxW, maxH, rnd) {
  const f = SU_MISURA[nome] && SU_MISURA[nome](maxW, maxH, rnd)
  if (!f || !connessa(f.m, f.w, f.h)) return null
  return f
}

// quante celle si camminano
export const celleDi = m => m.reduce((n, c) => n + c, 0)

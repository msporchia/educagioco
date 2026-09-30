// Il mare della mappa del tesoro, per chi ci naviga: dove c'è acqua
// abbastanza per la nave, dove attracca accanto a ogni tappa, e la rotta
// da un porto all'altro girando attorno alla terra. Puro, gira in Node
// (test/unita/inglese-isole). Le scelte in docs/lingue/mondi-vista.md.

export const NAVE = 12          // quanta acqua vuole la nave attorno a sé, in px
const PASSO = 8                 // il lato di una cella del mare

/* Il mare in una griglia: `spazio` è quanto è lontana la terra (o il bordo
   della carta) dal centro di ogni cella; `porto` segna le celle del mare
   aperto, quelle collegate fra loro, dove la nave può stare. */
export function creaMare(W, H, terra) {
  const nx = Math.ceil(W / PASSO), ny = Math.ceil(H / PASSO)
  const spazio = new Float32Array(nx * ny)
  const c = i => (i + 0.5) * PASSO
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++)
    spazio[j * nx + i] = terra(c(i), c(j)) ? 0 : 1e9
  // la distanza dalla terra: due passate di smusso (1 e √2)
  const R2 = Math.SQRT2 * PASSO
  const passa = (j0, j1, dj, i0, i1, di, vicini) => {
    for (let j = j0; j !== j1; j += dj) for (let i = i0; i !== i1; i += di) {
      let v = spazio[j * nx + i]
      if (!v) continue
      for (const [a, b, l] of vicini) {
        const x = i + a, y = j + b
        if (x < 0 || y < 0 || x >= nx || y >= ny) continue
        v = Math.min(v, spazio[y * nx + x] + l)
      }
      spazio[j * nx + i] = v
    }
  }
  passa(0, ny, 1, 0, nx, 1, [[-1, 0, PASSO], [0, -1, PASSO], [-1, -1, R2], [1, -1, R2]])
  passa(ny - 1, -1, -1, nx - 1, -1, -1, [[1, 0, PASSO], [0, 1, PASSO], [1, 1, R2], [-1, 1, R2]])
  // la terra sta al bordo della cella, non al centro; e il bordo della carta conta come costa
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i
    const bordo = Math.min(c(i), W - c(i), c(j), H - c(j)) + 6
    spazio[k] = Math.min(Math.max(0, spazio[k] - PASSO / 2), bordo)
  }
  // il mare aperto: il pezzo più grande di acqua navigabile
  const porto = new Uint8Array(nx * ny)
  let meglio = null
  const segno = new Int32Array(nx * ny).fill(-1)
  for (let s = 0; s < nx * ny; s++) {
    if (segno[s] >= 0 || spazio[s] < NAVE) continue
    const pila = [s], pezzo = []
    segno[s] = s
    while (pila.length) {
      const k = pila.pop(); pezzo.push(k)
      const i = k % nx, j = (k - i) / nx
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = i + a, y = j + b
        if (x < 0 || y < 0 || x >= nx || y >= ny) continue
        const q = y * nx + x
        if (segno[q] < 0 && spazio[q] >= NAVE) { segno[q] = s; pila.push(q) }
      }
    }
    if (!meglio || pezzo.length > meglio.length) meglio = pezzo
  }
  if (meglio) for (const k of meglio) porto[k] = 1
  return { passo: PASSO, nx, ny, W, H, spazio, porto }
}

const cella = (mare, x, y) => {
  const i = Math.floor(x / mare.passo), j = Math.floor(y / mare.passo)
  return i < 0 || j < 0 || i >= mare.nx || j >= mare.ny ? -1 : j * mare.nx + i
}
export const spazioIn = (mare, x, y) => { const k = cella(mare, x, y); return k < 0 ? 0 : mare.spazio[k] }
export const navigabile = (mare, x, y) => { const k = cella(mare, x, y); return k >= 0 && mare.porto[k] === 1 }

/* L'attracco di un nodo: il primo punto di mare aperto lungo un raggio che
   parte dal nodo. Il verso preferito è `lato` (la costa del porto
   dell'isola); gli altri costano di più quanto più se ne allontanano. */
export function attracco(mare, x, y, lato = 1) {
  let meglio = null
  for (let k = 0; k <= 12; k++) {
    for (const segno of k ? [1, -1] : [1]) {
      const dev = segno * k * Math.PI / 12
      const a = (lato > 0 ? 0 : Math.PI) + dev
      const dx = Math.cos(a), dy = Math.sin(a)
      for (let d = 10; d < 260; d += 3) {
        const px = x + dx * d, py = y + dy * d
        if (px < 0 || py < 0 || px > mare.W || py > mare.H) break
        if (navigabile(mare, px, py) && spazioIn(mare, px, py) >= NAVE + 2) {
          const costo = d * (1 + 0.7 * Math.abs(dev) / Math.PI)
          // al centro della cella: è lì che la rotta parte e arriva
          const cx = (Math.floor(px / mare.passo) + 0.5) * mare.passo, cy = (Math.floor(py / mare.passo) + 0.5) * mare.passo
          if (!meglio || costo < meglio.costo) meglio = { x: cx, y: cy, costo }
          break
        }
      }
    }
  }
  return meglio && { x: meglio.x, y: meglio.y }
}

/* La rotta da un punto di mare a un altro: A* sulle celle navigabili, che
   preferisce l'acqua larga; poi si tira il filo (i tratti diritti che
   restano in mare) e si arrotondano gli angoli. */
export function rotta(mare, da, a) {
  const { nx, ny, spazio, porto, passo } = mare
  const s = cella(mare, da.x, da.y), g = cella(mare, a.x, a.y)
  if (s < 0 || g < 0 || !porto[s] || !porto[g]) return null
  const gx = g % nx, gy = (g - gx) / nx
  const costo = new Float32Array(nx * ny).fill(Infinity)
  const da_ = new Int32Array(nx * ny).fill(-1)
  const chiuso = new Uint8Array(nx * ny)
  const mucchio = [] // [f, k]
  const spingi = (f, k) => {
    mucchio.push([f, k])
    let i = mucchio.length - 1
    while (i > 0) { const p = (i - 1) >> 1; if (mucchio[p][0] <= f) break; [mucchio[p], mucchio[i]] = [mucchio[i], mucchio[p]]; i = p }
  }
  const togli = () => {
    const top = mucchio[0], ult = mucchio.pop()
    if (mucchio.length) {
      mucchio[0] = ult
      let i = 0
      for (;;) {
        const l = 2 * i + 1, r = l + 1
        let m = i
        if (l < mucchio.length && mucchio[l][0] < mucchio[m][0]) m = l
        if (r < mucchio.length && mucchio[r][0] < mucchio[m][0]) m = r
        if (m === i) break
        ;[mucchio[m], mucchio[i]] = [mucchio[i], mucchio[m]]; i = m
      }
    }
    return top
  }
  const stima = k => { const i = k % nx, j = (k - i) / nx; return Math.hypot(i - gx, j - gy) * passo }
  costo[s] = 0; spingi(stima(s), s)
  while (mucchio.length) {
    const [, k] = togli()
    if (chiuso[k]) continue
    chiuso[k] = 1
    if (k === g) break
    const i = k % nx, j = (k - i) / nx
    for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
      if (!b && !c) continue
      const x = i + c, y = j + b
      if (x < 0 || y < 0 || x >= nx || y >= ny) continue
      const q = y * nx + x
      if (!porto[q] || chiuso[q]) continue
      const l = (b && c ? Math.SQRT2 : 1) * passo * (1 + 14 / Math.max(spazio[q], 1))
      if (costo[k] + l < costo[q]) { costo[q] = costo[k] + l; da_[q] = k; spingi(costo[q] + stima(q), q) }
    }
  }
  if (!chiuso[g]) return null
  const celle = []
  for (let k = g; k >= 0; k = da_[k]) celle.push(k)
  celle.reverse()
  const centro = k => { const i = k % nx; return [(i + 0.5) * passo, ((k - i) / nx + 0.5) * passo] }
  const grezza = [[da.x, da.y], ...celle.slice(1, -1).map(centro), [a.x, a.y]]
  // il filo tirato
  // un tratto diritto è buono se resta in acqua larga almeno `min`
  const libero = (p, q, min) => {
    const n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 3)
    for (let t = 1; t < n; t++) {
      const x = p[0] + (q[0] - p[0]) * t / n, y = p[1] + (q[1] - p[1]) * t / n
      if (spazioIn(mare, x, y) < min) return false
    }
    return true
  }
  const tirata = [grezza[0]]
  for (let i = 0; i < grezza.length - 1;) {
    let j = grezza.length - 1
    while (j > i + 1 && !libero(grezza[i], grezza[j], NAVE + 8)) j--
    tirata.push(grezza[j]); i = j
  }
  // gli angoli arrotondati (Chaikin), ma solo se restano in mare
  let liscia = tirata
  for (let giro = 0; giro < 3; giro++) {
    const nuova = [liscia[0]]
    for (let i = 0; i < liscia.length - 1; i++) {
      const [x1, y1] = liscia[i], [x2, y2] = liscia[i + 1]
      if (i > 0) nuova.push([x1 * 0.75 + x2 * 0.25, y1 * 0.75 + y2 * 0.25])
      if (i < liscia.length - 2) nuova.push([x1 * 0.25 + x2 * 0.75, y1 * 0.25 + y2 * 0.75])
    }
    nuova.push(liscia[liscia.length - 1])
    liscia = nuova
  }
  const buona = liscia.every((p, i) => i === 0 || libero(liscia[i - 1], p, NAVE - 3))
  return (buona ? liscia : tirata).map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10])
}

export function lunghezza(punti) {
  let l = 0
  for (let i = 1; i < punti.length; i++) l += Math.hypot(punti[i][0] - punti[i - 1][0], punti[i][1] - punti[i - 1][1])
  return l
}

// dove sta la nave a una frazione `t` (0..1) della rotta, e verso dove guarda
export function lungo(punti, t) {
  const tot = lunghezza(punti)
  let resto = Math.max(0, Math.min(1, t)) * tot
  for (let i = 1; i < punti.length; i++) {
    const [x1, y1] = punti[i - 1], [x2, y2] = punti[i]
    const l = Math.hypot(x2 - x1, y2 - y1)
    if (resto <= l || i === punti.length - 1) {
      const q = l ? Math.min(1, resto / l) : 1
      return { x: x1 + (x2 - x1) * q, y: y1 + (y2 - y1) * q, dx: x2 - x1, dy: y2 - y1 }
    }
    resto -= l
  }
  const [x, y] = punti[punti.length - 1]
  return { x, y, dx: 0, dy: 0 }
}

/* Quanto dura il viaggio: poco, anche per le traversate lunghe (un bambino
   ha toccato una tappa per giocarla, non per guardare la nave). */
export const DURATA_MAX = 1.3
export const durata = l => Math.min(DURATA_MAX, 0.45 + l / 1500)

// della rotta si tiene il pezzo che si vede: una nave che parte a mille
// pixel di distanza passerebbe il viaggio fuori dallo schermo
export function pezzoVisibile(punti, y0, y1, aria = 140) {
  let da = 0
  for (let i = punti.length - 1; i >= 0; i--) {
    const y = punti[i][1]
    if (y < y0 - aria || y > y1 + aria) { da = i; break }
  }
  return punti.slice(da)
}

/* Le rotte che partono dallo stesso porto fanno un pezzo di mare insieme:
   disegnate tutte, sarebbero binari paralleli. Qui ognuna tiene solo i
   `tratti` dove non ce n'è già una prima di lei (le battute per prime), e
   la rotta si legge come un ramo che si stacca. La nave usa `punti`. */
export function sfoltisci(rotte, vicino = 7) {
  const passo = 6
  const visti = new Set()
  const chiave = (x, y) => Math.floor(x / passo) + ',' + Math.floor(y / passo)
  const occupato = (x, y) => {
    const i = Math.floor(x / passo), j = Math.floor(y / passo), r = Math.ceil(vicino / passo)
    for (let b = -r; b <= r; b++) for (let a = -r; a <= r; a++) if (visti.has((i + a) + ',' + (j + b))) return true
    return false
  }
  const ordinate = rotte.map((r, k) => ({ r, k })).sort((a, b) => (b.r.battuto ? 1 : 0) - (a.r.battuto ? 1 : 0) || a.k - b.k)
  const out = new Array(rotte.length)
  for (const { r, k } of ordinate) {
    // ricampionata fitta, così il controllo non salta i pezzi
    const fitti = []
    for (let i = 1; i < r.punti.length; i++) {
      const [x1, y1] = r.punti[i - 1], [x2, y2] = r.punti[i]
      const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 3))
      for (let t = 0; t < n; t++) fitti.push([x1 + (x2 - x1) * t / n, y1 + (y2 - y1) * t / n])
    }
    fitti.push(r.punti[r.punti.length - 1])
    const tratti = []
    let ora = []
    for (const p of fitti) {
      if (occupato(p[0], p[1])) { if (ora.length > 3) tratti.push(ora); ora = [] }
      else ora.push(p)
    }
    if (ora.length > 3) tratti.push(ora)
    for (const p of fitti) visti.add(chiave(p[0], p[1]))
    out[k] = { ...r, tratti }
  }
  return out
}

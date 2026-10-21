// La strada «da cristiani» del mondo di sopra 3D: la scia verso la meta e il cammino a tocco preferiscono la strada vera, evitano
// l'erba stretta fra le case e gli ostacoli, e deviano dal tragitto più corto solo quanto serve (LIMITE). Pura: si dà una terra
// (motore/terra.js, che qui non si tocca) e una funzione `strada(x, y)` (0 = erba, >0 = strada: m.strada); gira in Node
// (unita/sotterraneo-meta-sopra). La regola e i numeri: docs/sotterraneo/mondo-3d-la-meta.md, «La strada vera»
const OTTO = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
const R2 = Math.SQRT2

// Quanto costa camminare su una cella (1 = come il più corto). `erba` e `strada`: la cella; `vicino`: in più a 1, 2, 3 celle
// (in diagonale conta, Chebyshev) da un ostacolo (casa, albero, masso, acqua, roccia), sull'erba e sulla strada. Un varco di tre
// celle fra due case ha sempre una cella a 1 e una a 2: costa tanto da non valere la pena se si gira attorno
const LIVELLI = [
  { erba: 1.7, strada: 1, vicino: [5, 1.5, 0.5], vicinoStrada: [0.7, 0.2, 0] },     // forte: il tragitto di difetto
  { erba: 1.25, strada: 1, vicino: [1.5, 0.4, 0.1], vicinoStrada: [0.2, 0, 0] },    // lieve: se il forte allunga troppo
]
// Il tragitto scelto non è più lungo di LIMITE volte il più corto (più un po' di margine sulle distanze brevi); se il forte
// sfora si prova il lieve, poi il più corto
export const LIMITE = 1.4
export const MARGINE = 4

// La funzione `strada` del mondo, sempre la stessa per lo stesso mondo (la cache dei costi la riconosce)
const STRADE = new WeakMap()
export function stradaDelMondo(m) {
  if (!STRADE.has(m)) STRADE.set(m, (x, y) => m.strada[y * m.W + x])
  return STRADE.get(m)
}

// Le cose per una terra, una volta (la terra si rifà solo quando si carica una zona): dove si cammina, e i costi dei livelli
const CACHE = new WeakMap()
export function costiDi(terra, strada) {
  const c = CACHE.get(terra)
  if (c && c.strada === strada) return c
  const { L, A, passa } = terra
  const ok = new Uint8Array(L * A)
  for (let y = 0; y < A; y++) for (let x = 0; x < L; x++) ok[y * L + x] = passa(x, y) ? 1 : 0
  const nuovo = { L, A, ok, strada, livelli: [] }
  CACHE.set(terra, nuovo)
  return nuovo
}

// La distanza (Chebyshev) dall'ostacolo più vicino, 1–3, o 9 se non ce n'è entro tre celle: solo per le celle dove si cammina
function vicinanza(c) {
  const { L, A, ok } = c
  const v = new Uint8Array(L * A).fill(9)
  const muro = (x, y) => x >= 0 && y >= 0 && x < L && y < A && !ok[y * L + x]
  for (let y = 0; y < A; y++) for (let x = 0; x < L; x++) {
    if (!ok[y * L + x]) continue
    let d = 9
    for (let r = 1; r <= 3 && d === 9; r++) {
      for (let i = -r; i <= r && d === 9; i++) {
        if (muro(x + i, y - r) || muro(x + i, y + r) || muro(x - r, y + i) || muro(x + r, y + i)) d = r
      }
    }
    v[y * L + x] = d
  }
  return v
}

// I costi per cella di un livello (0 forte, 1 lieve), calcolati una volta
export function costiDelLivello(c, livello) {
  if (c.livelli[livello]) return c.livelli[livello]
  if (!c.vic) c.vic = vicinanza(c)
  const { L, A, ok, strada, vic } = c, q = LIVELLI[livello]
  const w = new Float32Array(L * A).fill(1)
  for (let y = 0; y < A; y++) for (let x = 0; x < L; x++) {
    const k = y * L + x
    if (!ok[k]) continue
    const su = strada(x, y) > 0, d = vic[k]
    w[k] = (su ? q.strada : q.erba) + (d <= 3 ? (su ? q.vicinoStrada : q.vicino)[d - 1] : 0)
  }
  return (c.livelli[livello] = w)
}

// Dijkstra da `meta` con i costi `w` (null: tutto 1): per ogni cella il costo, la lunghezza in celle del tragitto e la cella dopo
// verso la meta. Con `finoA` si ferma quando quella cella è sistemata (il cammino a tocco non vuole tutto il campo)
function dijkstra(c, meta, w, finoA = -1) {
  const { L, A, ok } = c, N = L * A
  const D = new Float64Array(N).fill(Infinity), G = new Float32Array(N), P = new Int32Array(N).fill(-1)
  const k0 = meta.y * L + meta.x
  D[k0] = 0
  const hk = [0], hv = [k0]
  while (hk.length) {
    const d = hk[0], k = hv[0]
    const uk = hk.pop(), uv = hv.pop()
    if (hk.length) {
      hk[0] = uk; hv[0] = uv
      let i = 0
      for (;;) {
        const a = 2 * i + 1, b = a + 1
        let m = i
        if (a < hk.length && hk[a] < hk[m]) m = a
        if (b < hk.length && hk[b] < hk[m]) m = b
        if (m === i) break
        const tk = hk[m], tv = hv[m]; hk[m] = hk[i]; hv[m] = hv[i]; hk[i] = tk; hv[i] = tv; i = m
      }
    }
    if (d > D[k]) continue
    if (k === finoA) break
    const x = k % L, y = (k - x) / L, wk = w ? w[k] : 1
    for (let o = 0; o < 8; o++) {
      const dx = OTTO[o][0], dy = OTTO[o][1], nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= L || ny >= A) continue
      const nk = ny * L + nx
      if (!ok[nk]) continue
      const diag = dx && dy
      if (diag && (!ok[y * L + nx] || !ok[ny * L + x])) continue
      const lun = diag ? R2 : 1, nd = d + lun * (w ? (wk + w[nk]) / 2 : 1)
      if (nd < D[nk]) {
        D[nk] = nd; G[nk] = G[k] + lun; P[nk] = k
        let i = hk.length
        hk.push(nd); hv.push(nk)
        while (i > 0) { const p = (i - 1) >> 1; if (hk[p] <= hk[i]) break; const tk = hk[p], tv = hv[p]; hk[p] = hk[i]; hv[p] = hv[i]; hk[i] = tk; hv[i] = tv; i = p }
      }
    }
  }
  return { D, G, P }
}

// Le celle dopo `da` fino alla meta compresa, seguendo le cella-dopo del campo; [] se si è già lì, null se di lì non si arriva
function scendi(c, campo, da) {
  const { L } = c
  let k = da.y * L + da.x
  if (!Number.isFinite(campo.D[k])) return null
  const via = []
  while (campo.P[k] >= 0) { k = campo.P[k]; via.push({ x: k % L, y: (k - (k % L)) / L }) }
  return via
}

// Il campo verso `meta` (una cella dove si cammina): il tragitto forte se non allunga oltre il limite, se no il lieve, se no il
// più corto. `passi(x, y)` è la lunghezza in celle di quel tragitto (la distanza detta); `strada(da)` le sue celle;
// `liscia(da, via)` i punti dove girare davvero, senza tagliare fuori dalla strada dove la strada conviene
export function campoPesato(terra, meta, strada) {
  const c = costiDi(terra, strada)
  const { L, A, ok } = c
  if (!meta || !ok[meta.y * L + meta.x]) return null
  const corto = dijkstra(c, meta, null)
  const campi = [null, null, corto]   // forte, lieve (a richiesta), il più corto
  const campoDi = i => (campi[i] || (campi[i] = dijkstra(c, meta, costiDelLivello(c, i))))
  campoDi(0)
  // quale livello vale per questa cella: il più forte che non allunga oltre il limite
  const scelto = (x, y) => {
    if (x < 0 || y < 0 || x >= L || y >= A) return 2
    const k = y * L + x, g0 = corto.G[k]
    for (let i = 0; i < 2; i++) if (campoDi(i).G[k] <= g0 * LIMITE + MARGINE) return i
    return 2
  }
  const passi = (x, y) => (x >= 0 && y >= 0 && x < L && y < A && Number.isFinite(corto.D[y * L + x]) ? campi[scelto(x, y)].G[y * L + x] : Infinity)
  const via = da => (ok[da.y * L + da.x] ? scendi(c, campi[scelto(da.x, da.y)], da) : null)
  const w = i => (i < 2 ? costiDelLivello(c, i) : null)
  return { meta: { x: meta.x, y: meta.y }, passi, strada: via, livello: scelto, liscia: (da, v, i = scelto(da.x, da.y)) => lisciaPesata(terra, c, w(i), da, v) }
}

// Il tragitto a tocco da `da` ad `a`, stesse regole del campo ma si ferma appena arriva (celle dopo `da`, [] se già lì, null se non
// c'è strada) e il livello scelto per lisciare
export function stradaPesata(terra, strada, da, a) {
  const c = costiDi(terra, strada)
  const { L, ok } = c
  if (!ok[da.y * L + da.x] || !ok[a.y * L + a.x]) return null
  if (da.x === a.x && da.y === a.y) return { via: [], livello: 2, liscia: () => [] }
  const kd = da.y * L + da.x
  const corto = dijkstra(c, a, null, kd)
  if (!Number.isFinite(corto.D[kd])) return null
  let livello = 2, campo = corto
  for (let i = 0; i < 2; i++) {
    const f = dijkstra(c, a, costiDelLivello(c, i), kd)
    if (f.G[kd] <= corto.G[kd] * LIMITE + MARGINE) { livello = i; campo = f; break }
  }
  const via = scendi(c, campo, da)
  const w = livello < 2 ? costiDelLivello(c, livello) : null
  return { via, livello, liscia: v => lisciaPesata(terra, c, w, da, v) }
}

// si vede da p a q senza uscire dal prato? Come `libera` di motore/terra.js: la linea campionata e due righe parallele larghe un
// terzo di cella, così la scorciatoia non rade lo spigolo di una casa
function libera(c, p, q) {
  const { L, A, ok } = c
  const dx = q.x - p.x, dy = q.y - p.y, n = Math.ceil(Math.hypot(dx, dy) * 4)
  const lu = Math.hypot(dx, dy) || 1, ox = -dy / lu * 0.3, oy = dx / lu * 0.3
  for (let i = 0; i <= n; i++) {
    const t = i / (n || 1), x = p.x + 0.5 + dx * t, y = p.y + 0.5 + dy * t
    for (const s of [0, 1, -1]) {
      const cx = Math.floor(x + ox * s), cy = Math.floor(y + oy * s)
      if (cx < 0 || cy < 0 || cx >= L || cy >= A || !ok[cy * L + cx]) return false
    }
  }
  return true
}
// quanto costa andare dritto da p a q (la somma dei costi delle celle sulla linea, per la sua lunghezza)
function costoDritto(c, w, p, q) {
  const { L } = c
  const dx = q.x - p.x, dy = q.y - p.y, lu = Math.hypot(dx, dy), n = Math.max(1, Math.ceil(lu * 4))
  let s = 0
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n
    s += w[Math.floor(p.y + 0.5 + dy * t) * L + Math.floor(p.x + 0.5 + dx * t)]
  }
  return s * lu / n
}

// La strada a celle fa la scaletta; si tengono solo i punti dove si deve girare davvero: si va dritti solo se la linea è libera e non
// costa più di seguire la strada (di poco): una curva della strada non si taglia sull'erba, un rettilineo sì
function lisciaPesata(terra, c, w, da, via) {
  if (via.length < 2) return via.slice()
  if (!w) {   // il più corto: come motore/terra.js
    const fuori = []
    let ultimo = da
    for (let i = 0; i < via.length; i++) {
      const prossimo = via[i + 1]
      if (prossimo && libera(c, ultimo, prossimo)) continue
      fuori.push(via[i]); ultimo = via[i]
    }
    return fuori
  }
  const { L } = c
  const costo = (p, q) => ((p.x !== q.x && p.y !== q.y) ? R2 : 1) * (w[p.y * L + p.x] + w[q.y * L + q.x]) / 2
  const fuori = []
  let ultimo = da, costoVia = 0
  for (let i = 0; i < via.length; i++) {
    // la strada da `ultimo` a via[i + 1] passando per le celle: il suo costo cresce a ogni passo
    const prossimo = via[i + 1]
    costoVia += costo(i ? via[i - 1] : da, via[i])
    if (prossimo) {
      const costoPros = costoVia + costo(via[i], prossimo)
      if (libera(c, ultimo, prossimo) && costoDritto(c, w, ultimo, prossimo) <= costoPros * 1.04 + 0.1) continue
    }
    fuori.push(via[i]); ultimo = via[i]; costoVia = 0
  }
  return fuori
}

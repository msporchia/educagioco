// La forma delle mappe che il renderer sa disegnare (la pianta del gioco vero la traduce vero.js), la sala della
// vetrina, il cammino e il campo visivo che servono lì (nella discesa vera li fa il motore).
// Coordinate: la cella (x, y) occupa nel mondo [x, x+1] × [y, y+1] sul piano XZ; y cresce verso sud,
// cioè verso la telecamera. Le facce dei muri che si vedono sono quelle a sud.

// OGGETTO: una cosa di scena modellata (la fontana): non si attraversa, ma la vista ci passa sopra
export const ROCCIA = 0, PAVIMENTO = 1, COLONNA = 2, OGGETTO = 3

export function caso (seme) {
  let a = seme >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// La vetrina (?vetrina=1): una sala lunga sola, senza mostri, dove stanno in fila le cose modellate
// (vetrina.js). Stessa forma di quello che torna generaMappa, così il resto non sa la differenza.
export function generaVetrina (W = 50, H = 17) {
  const celle = new Uint8Array(W * H)
  const id = (x, y) => y * W + x
  const sala = { x: 2, y: 3, w: W - 4, h: 11, sala: true }
  for (let y = sala.y; y < sala.y + sala.h; y++) for (let x = sala.x; x < sala.x + sala.w; x++) celle[id(x, y)] = PAVIMENTO
  const pav = (x, y) => x >= 0 && y >= 0 && x < W && y < H && celle[id(x, y)] === PAVIMENTO
  const roccia = (x, y) => x < 0 || y < 0 || x >= W || y >= H || celle[id(x, y)] === ROCCIA
  const muri = []
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!roccia(x, y)) continue
    let tocca = false
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (pav(x + dx, y + dy)) tocca = true
    if (tocca) muri.push({ x, y })
  }
  // le torce a muro ogni sei celle, sfalsate rispetto alle cose (che stanno ogni tre)
  // le torce a muro dove non c'è una cosa appesa (le porte a 5–15, le macchie a 27–37, le stoffe a 43–46)
  const torce = [3, 17, 21, 32, 41, 47].map(x => ({ x, y: sala.y - 1 }))
  const fontana = { x: sala.x + sala.w - 4, y: sala.y + 7, stanza: sala }
  celle[id(fontana.x, fontana.y)] = OGGETTO
  return { W, H, celle, stanze: [sala], muri, colonne: [], torce, bracieri: [], arredi: [], mostri: [], partenza: { x: sala.x + 1, y: sala.y + 6 }, fontana, id, pav, roccia, vetrina: true }
}

// la strada più corta fra due celle (quattro direzioni, poi tagli in diagonale dove il passo è libero)
export function strada (m, da, a) {
  const { W, H, celle } = m
  if (!m.pav(a.x, a.y)) return null
  const prev = new Int32Array(W * H).fill(-1)
  const coda = [m.id(da.x, da.y)]
  prev[coda[0]] = coda[0]
  const passi = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
  for (let i = 0; i < coda.length; i++) {
    const c = coda[i]; const x = c % W, y = (c / W) | 0
    if (x === a.x && y === a.y) break
    for (const [dx, dy] of passi) {
      const nx = x + dx, ny = y + dy
      if (!m.pav(nx, ny)) continue
      if (dx && dy && (!m.pav(x + dx, y) || !m.pav(x, y + dy))) continue
      const n = m.id(nx, ny)
      if (prev[n] !== -1) continue
      prev[n] = c; coda.push(n)
    }
  }
  const fine = m.id(a.x, a.y)
  if (prev[fine] === -1) return null
  const via = []
  for (let c = fine; c !== prev[c]; c = prev[c]) via.push({ x: c % W, y: (c / W) | 0 })
  return via.reverse()
}

// cosa vede l'eroe: linee dal centro della sua cella, fermate dai muri e dalle colonne
export function campoVisivo (m, ex, ey, raggio, fuori) {
  const { W, H } = m
  fuori.fill(0)
  const x0 = Math.floor(ex), y0 = Math.floor(ey)
  for (let y = Math.max(0, y0 - raggio); y <= Math.min(H - 1, y0 + raggio); y++) {
    for (let x = Math.max(0, x0 - raggio); x <= Math.min(W - 1, x0 + raggio); x++) {
      const dx = x + 0.5 - ex, dy = y + 0.5 - ey
      const d = Math.hypot(dx, dy)
      if (d > raggio) continue
      const passi = Math.ceil(d * 4)
      let libero = true
      for (let i = 1; i < passi; i++) {
        const cx = Math.floor(ex + dx * i / passi), cy = Math.floor(ey + dy * i / passi)
        if (cx === x && cy === y) break
        const k = m.celle[m.id(cx, cy)]
        if (k !== PAVIMENTO && k !== OGGETTO) { libero = false; break }
      }
      if (libero) fuori[m.id(x, y)] = 1
    }
  }
}

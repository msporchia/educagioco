// La strada verso la meta del mondo di sopra (la porta della storia, la discesa di una missione, la taglia seguita), senza disegno:
// il campo delle distanze dalla meta sulla terra coi passaggi aperti, la strada da qualunque cella, le celle del velo che si apre
// attorno, le luci della scia e i passi detti. Gira in Node (unita/sotterraneo-meta-sopra). docs/sotterraneo/mondo-3d-la-meta.md
const OTTO = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
const R2 = Math.SQRT2

// Le distanze da `meta` (una cella dove si cammina) a ogni cella, con le regole dell'A* di motore/terra.js: otto direzioni, la
// diagonale costa √2 e si fa solo se le due celle di lato sono libere. Si fa una volta per meta (Dijkstra con un mucchio
// binario: 22 400 celle in pochi millisecondi); poi la strada da qualunque cella è una discesa, e i passi sono una lettura
export function campoVersoLaMeta(terra, meta) {
  const { L, A, passa } = terra
  if (!meta || !passa(meta.x, meta.y)) return null
  const D = new Float64Array(L * A).fill(Infinity)
  const k0 = meta.y * L + meta.x
  D[k0] = 0
  const mucchio = [[0, k0]]
  const su = i => { while (i > 0) { const p = (i - 1) >> 1; if (mucchio[p][0] <= mucchio[i][0]) break; [mucchio[p], mucchio[i]] = [mucchio[i], mucchio[p]]; i = p } }
  const giu = i => {
    for (;;) {
      const a = 2 * i + 1, b = a + 1
      let m = i
      if (a < mucchio.length && mucchio[a][0] < mucchio[m][0]) m = a
      if (b < mucchio.length && mucchio[b][0] < mucchio[m][0]) m = b
      if (m === i) return
      ;[mucchio[m], mucchio[i]] = [mucchio[i], mucchio[m]]; i = m
    }
  }
  while (mucchio.length) {
    const [d, k] = mucchio[0]
    const ultimo = mucchio.pop()
    if (mucchio.length) { mucchio[0] = ultimo; giu(0) }
    if (d > D[k]) continue
    const x = k % L, y = (k - x) / L
    for (const [dx, dy] of OTTO) {
      const nx = x + dx, ny = y + dy
      if (!passa(nx, ny)) continue
      if (dx && dy && (!passa(x + dx, y) || !passa(x, y + dy))) continue
      const nk = ny * L + nx, nd = d + (dx && dy ? R2 : 1)
      if (nd < D[nk]) { D[nk] = nd; mucchio.push([nd, nk]); su(mucchio.length - 1) }
    }
  }
  const passi = (x, y) => (x >= 0 && y >= 0 && x < L && y < A ? D[y * L + x] : Infinity)
  // le celle dopo `da` fino alla meta compresa ([] se si è già lì, null se di lì non ci si arriva). A parità si tiene la
  // direzione di prima: meno svolte, una scia diritta
  function strada(da) {
    if (!Number.isFinite(passi(da.x, da.y))) return null
    const via = []
    let x = da.x, y = da.y, vx = 0, vy = 0
    for (let n = 0; n < L * A && D[y * L + x] > 0; n++) {
      let mig = null
      for (const [dx, dy] of OTTO) {
        const nx = x + dx, ny = y + dy
        if (!passa(nx, ny) || (dx && dy && (!passa(x + dx, y) || !passa(x, y + dy)))) continue
        const v = D[ny * L + nx] + (dx && dy ? R2 : 1) + (dx === vx && dy === vy ? 0 : 1e-3)
        if (!mig || v < mig.v) mig = { v, dx, dy }
      }
      if (!mig) return null
      x += mig.dx; y += mig.dy; vx = mig.dx; vy = mig.dy
      via.push({ x, y })
    }
    return via
  }
  return { meta: { x: meta.x, y: meta.y }, D, passi, strada }
}

// Le celle del velo che si apre lungo la strada (gli indici, in ordine e senza doppioni): tutte quelle col centro entro `raggio`
// da una cella della strada. Si disegnano come viste, ma non si salvano (docs/sotterraneo/mondo-3d-la-meta.md, «Il velo»)
export function celleDelVelo(strada, W, H, raggio = 2.5) {
  const dentro = new Set(), r = Math.ceil(raggio)
  for (const c of strada) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = c.x + dx, y = c.y + dy
    if (x < 0 || y < 0 || x >= W || y >= H || dx * dx + dy * dy > raggio * raggio) continue
    dentro.add(y * W + x)
  }
  return [...dentro].sort((a, b) => a - b)
}

// Le luci della scia: un punto ogni `ogni` lungo la spezzata (in coordinate del mondo, il centro delle celle), dalla prima
// all'ultima; l'ultima luce è sempre la meta
export function luciDellaStrada(punti, ogni = 1.6) {
  if (!punti.length) return []
  const luci = []
  let resto = ogni * 0.5
  for (let i = 1; i < punti.length; i++) {
    const a = punti[i - 1], b = punti[i], lu = Math.hypot(b.x - a.x, b.z - a.z)
    let t = resto
    while (t <= lu) { luci.push({ x: a.x + (b.x - a.x) * t / lu, z: a.z + (b.z - a.z) * t / lu }); t += ogni }
    resto = t - lu
  }
  const fine = punti[punti.length - 1], ul = luci[luci.length - 1]
  // sulla meta c'è sempre una luce: se l'ultima le sta addosso ci si sposta, se no se ne aggiunge una
  if (ul && Math.hypot(ul.x - fine.x, ul.z - fine.z) <= ogni * 0.25) { ul.x = fine.x; ul.z = fine.z } else luci.push({ x: fine.x, z: fine.z })
  return luci
}

// La luce più vicina a (x, z) e quanto dista: la scia si accende da lì in avanti, e chi se n'è allontanato da fermo ne ha una nuova
export function piuVicina(luci, x, z) {
  let i = -1, d = Infinity
  for (let k = 0; k < luci.length; k++) { const q = Math.hypot(luci[k].x - x, luci[k].z - z); if (q < d) { d = q; i = k } }
  return { i, d }
}

// I passi detti al bambino: una cella è un passo, a cinque per volta (non cambia a ogni cella), «qui» quando ci si è
export const ARRIVATO_META = 3
export function passiDetti(n) {
  if (!Number.isFinite(n)) return ''
  if (n < ARRIVATO_META) return 'sei arrivato'
  if (n < 10) return 'qui vicino'
  return `a ${Math.round(n / 5) * 5} passi`
}

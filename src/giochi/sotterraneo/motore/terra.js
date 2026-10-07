// La terra di sopra senza disegno: dove si cammina, come ci si arriva, cosa si è visto. Gira in Node
// (unita/sotterraneo-terra). Le celle sono quelle della maschera (dati/terra-mappa.js); vedi
// docs/sotterraneo/terra-di-sopra.md.

const OTTO = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
const R2 = Math.SQRT2

// `maschera`: righe di '.' e '#'; `ostacoli`: celle in più dove non si passa (chi sta fermo in mezzo al prato)
export function creaTerra(maschera, { ostacoli = [] } = {}) {
  const A = maschera.length, L = maschera[0].length
  const fermi = new Set(ostacoli.map(([x, y]) => y * L + x))
  const dentro = (x, y) => x >= 0 && y >= 0 && x < L && y < A
  const passa = (x, y) => dentro(x, y) && maschera[y][x] === '.' && !fermi.has(y * L + x)

  // A* a otto direzioni: in diagonale solo se le due celle di lato sono libere, o si taglia l'angolo di una casa.
  // Torna le celle dopo `da` fino ad `a` compresa; [] se si è già lì, null se non c'è strada
  function strada(da, a) {
    if (da.x === a.x && da.y === a.y) return []
    if (!passa(a.x, a.y) || !passa(da.x, da.y)) return null
    const k0 = da.y * L + da.x, meta = a.y * L + a.x
    const g = new Map([[k0, 0]]), prima = new Map(), chiuse = new Set()
    const h = k => { const dx = Math.abs(k % L - a.x), dy = Math.abs(Math.floor(k / L) - a.y)
                     return Math.max(dx, dy) + (R2 - 1) * Math.min(dx, dy) }
    const aperte = [[h(k0), k0]]
    while (aperte.length) {
      let m = 0
      for (let i = 1; i < aperte.length; i++) if (aperte[i][0] < aperte[m][0]) m = i
      const [, k] = aperte.splice(m, 1)[0]
      if (k === meta) break
      if (chiuse.has(k)) continue
      chiuse.add(k)
      const x = k % L, y = Math.floor(k / L)
      for (const [dx, dy] of OTTO) {
        const nx = x + dx, ny = y + dy
        if (!passa(nx, ny)) continue
        if (dx && dy && (!passa(x + dx, y) || !passa(x, y + dy))) continue
        const nk = ny * L + nx, ng = g.get(k) + (dx && dy ? R2 : 1)
        if (g.has(nk) && g.get(nk) <= ng) continue
        g.set(nk, ng); prima.set(nk, k)
        aperte.push([ng + h(nk), nk])
      }
    }
    if (!prima.has(meta)) return null
    const via = []
    for (let k = meta; k !== k0; k = prima.get(k)) via.push({ x: k % L, y: Math.floor(k / L) })
    return via.reverse()
  }

  // tutte le celle raggiungibili da `da`, con la distanza in passi
  function raggiungibili(da) {
    const dist = new Map()
    if (!passa(da.x, da.y)) return dist
    const k0 = da.y * L + da.x
    dist.set(k0, 0)
    const coda = [k0]
    for (let i = 0; i < coda.length; i++) {
      const k = coda[i], x = k % L, y = Math.floor(k / L)
      for (const [dx, dy] of OTTO) {
        const nx = x + dx, ny = y + dy, nk = ny * L + nx
        if (!passa(nx, ny) || dist.has(nk)) continue
        if (dx && dy && (!passa(x + dx, y) || !passa(x, y + dy))) continue
        dist.set(nk, dist.get(k) + 1)
        coda.push(nk)
      }
    }
    return dist
  }

  // dove si arriva toccando `a`: la cella stessa se ci si arriva, se no la raggiungibile più vicina in linea d'aria
  // (a parità, quella con meno strada). Un tocco sull'acqua porta alla riva, non a niente.
  function arrivo(da, a) {
    const dist = raggiungibili(da)
    if (dist.has(a.y * L + a.x)) return { x: a.x, y: a.y }
    let meglio = null
    for (const [k, passi] of dist) {
      const x = k % L, y = Math.floor(k / L)
      const d = (x - a.x) ** 2 + (y - a.y) ** 2
      if (!meglio || d < meglio.d || (d === meglio.d && passi < meglio.passi)) meglio = { x, y, d, passi }
    }
    return meglio ? { x: meglio.x, y: meglio.y } : null
  }

  // si vede da qui a lì senza uscire dal prato? Si campiona la linea, e due righe parallele larghe un terzo di
  // cella, così la scorciatoia non rade lo spigolo di una staccionata
  function libera(p, q) {
    const dx = q.x - p.x, dy = q.y - p.y, n = Math.ceil(Math.hypot(dx, dy) * 4)
    const lu = Math.hypot(dx, dy) || 1, ox = -dy / lu * 0.3, oy = dx / lu * 0.3
    for (let i = 0; i <= n; i++) {
      const t = i / (n || 1), x = p.x + 0.5 + dx * t, y = p.y + 0.5 + dy * t
      for (const s of [0, 1, -1])
        if (!passa(Math.floor(x + ox * s), Math.floor(y + oy * s))) return false
    }
    return true
  }

  // la strada a celle fa la scaletta; si tengono solo i punti dove si deve girare davvero
  function liscia(da, via) {
    if (via.length < 2) return via.slice()
    const fuori = []
    let ultimo = da
    for (let i = 0; i < via.length; i++) {
      const prossimo = via[i + 1]
      if (prossimo && libera(ultimo, prossimo)) continue
      fuori.push(via[i])
      ultimo = via[i]
    }
    return fuori
  }

  return { L, A, passa, strada, raggiungibili, arrivo, liscia }
}

/* ── la nebbia: una cella vista è vista per sempre ── */

export const nebbiaNuova = (L, A) => new Uint8Array(L * A)

// le celle col centro entro `r` da (cx, cy), che è in celle; torna quelle appena scoperte
export function scopri(nebbia, L, A, cx, cy, r) {
  const nuove = []
  for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(A - 1, Math.ceil(cy + r)); y++)
    for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(L - 1, Math.ceil(cx + r)); x++) {
      const k = y * L + x
      if (nebbia[k] || (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 > r * r) continue
      nebbia[k] = 1
      nuove.push({ x, y })
    }
  return nuove
}

// in archivio un bit per cella, in esadecimale: 64×48 celle sono 768 caratteri
export function nebbiaInCodice(nebbia) {
  let s = ''
  for (let i = 0; i < nebbia.length; i += 4)
    s += ((nebbia[i] ? 8 : 0) | (nebbia[i + 1] ? 4 : 0) | (nebbia[i + 2] ? 2 : 0) | (nebbia[i + 3] ? 1 : 0)).toString(16)
  return s
}

// la mappa è stata più stretta (32 celle, prima di allargarsi a destra): quel codice si rimette nell'angolo
// in alto a sinistra, e le celle nuove sono nebbia
export const LARGHEZZE_VECCHIE = [32]

// un codice che non torna (altra mappa, altra misura) è una nebbia nuova, non un errore
export function nebbiaDaCodice(s, L, A) {
  const n = nebbiaNuova(L, A)
  if (typeof s !== 'string' || /[^0-9a-f]/.test(s)) return null
  const larga = [L, ...LARGHEZZE_VECCHIE.filter(v => v < L)].find(v => s.length === Math.ceil(v * A / 4))
  if (!larga) return null
  for (let i = 0; i < s.length; i++) {
    const v = parseInt(s[i], 16)
    for (let b = 0; b < 4 && i * 4 + b < larga * A; b++) {
      const k = i * 4 + b
      n[Math.floor(k / larga) * L + (k % larga)] = (v >> (3 - b)) & 1
    }
  }
  return n
}

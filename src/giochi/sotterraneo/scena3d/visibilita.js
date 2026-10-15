// Visto, ricordato, mai visto: la maschera del 3D si scrive dalla luce del motore (docs/sotterraneo/luce.md), una cella per
// texel. `ora` è quanto si vede adesso (sfuma verso la forza della cella in luce), `ric` se è già stata vista. Nello scontro i
// combattenti stanno dove il disegno li mette, anche fuori dal cono: lì la scena si accende (`palco`, luce di scena: il motore
// non ne sa niente). Niente regole: si copia quello che il motore ha deciso. Puro, senza three: unita/sotterraneo-3d.

export function nuovaVisibilita(W, H, pavimento) {
  const pav = new Uint8Array(W * H)
  for (const c of pavimento) pav[c.y * W + c.x] = 1
  return { W, H, ora: new Float32Array(W * H), ric: new Float32Array(W * H), meta: new Float32Array(W * H), pav, dati: new Uint8Array(W * H * 4) }
}

const RAGGIO_PALCO = 3

// `forza`: la Map cella → forza (corsa.forzaLuce), `visto`: le celle viste (corsa.visto), `palco`: i punti dei combattenti
// ({ x, z } in celle) o null; `k`: quanto avvicinarsi alla meta in questo fotogramma (0..1). Niente allocazioni
export function aggiornaVisibilita(v, { forza, visto, palco = null, k = 1 }) {
  const { W, ora, ric, meta } = v
  meta.fill(0)
  if (forza) for (const [i, f] of forza) if (i >= 0 && i < meta.length) meta[i] = Math.min(1, f * 1.3)
  if (palco) for (const p of palco) {
    const x0 = Math.max(0, Math.floor(p.x - RAGGIO_PALCO)), x1 = Math.min(W - 1, Math.floor(p.x + RAGGIO_PALCO))
    const y0 = Math.max(0, Math.floor(p.z - RAGGIO_PALCO)), y1 = Math.min(v.H - 1, Math.floor(p.z + RAGGIO_PALCO))
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(p.x - x - 0.5, p.z - y - 0.5)
      if (d < RAGGIO_PALCO) { const i = y * W + x; meta[i] = Math.max(meta[i], Math.min(1, (RAGGIO_PALCO - d) / 1.2)) }
    }
  }
  for (let i = 0; i < ora.length; i++) {
    ora[i] += (meta[i] - ora[i]) * k
    if (ora[i] < 0.002) ora[i] = 0
    ric[i] = visto && visto[i] ? 1 : 0   // il ricordo è del motore: la luce di scena non lo scrive
  }
  return v
}

// i texel: R = adesso, G = ricordato, B = pavimento (nebbia e polvere stanno solo sopra il pavimento)
export function scriviTexel(v) {
  const { ora, ric, pav, dati } = v
  for (let i = 0; i < ora.length; i++) {
    const q = i * 4
    dati[q] = ora[i] * 255; dati[q + 1] = ric[i] * 255; dati[q + 2] = pav[i] ? 255 : 0; dati[q + 3] = 255
  }
}

// quanto si vede adesso una cella (per le fiamme, le particelle, la fontana: vive solo qui)
export const vistaOra = (v, x, y) => (x < 0 || y < 0 || x >= v.W || y >= v.H ? 0 : v.ora[Math.floor(y) * v.W + Math.floor(x)])
export const ricordata = (v, x, y) => (x < 0 || y < 0 || x >= v.W || y >= v.H ? 0 : v.ric[Math.floor(y) * v.W + Math.floor(x)])

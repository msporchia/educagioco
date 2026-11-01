// La pianta di un piano tradotta in pezzi da costruire in 3D: quali celle hanno pavimento, quali rocce sono muri (alti, o
// bassi a parapetto), quali sono colonne, dove stanno l'acqua, le torce e dove si posa l'arredo. Legge il livello del motore
// come dato (`largo`, `alto`, `a()`, `stanze`, `robe`) e non lo cambia. Dato puro, gira in Node: unita/sotterraneo-3d.
// Coordinate: la cella (x, y) occupa nel mondo [x, x+1] × [y, y+1] sul piano XZ; y cresce verso sud, verso la telecamera.
import { ROCCIA, PAVIMENTO, PORTA, RELITTO, ACQUA } from '../dati/mondo.js'
import { torceAMuroDi, posaDi, OGNI_TORCIA } from '../motore/torce-a-muro.js'

// la posa dell'arredo e le torce a muro le sa il motore (motore/torce-a-muro.js): una ogni OGNI_TORCIA celle, e ogni tanto una si prende
export { posaDi, OGNI_TORCIA }

export function piantaDi(liv) {
  const W = liv.largo, H = liv.alto
  const id = (x, y) => y * W + x
  const tipo = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) tipo[id(x, y)] = liv.a(x, y)
  const roccia = (x, y) => x < 0 || y < 0 || x >= W || y >= H || tipo[id(x, y)] === ROCCIA
  // le colonne il motore le scava come roccia dentro una stanza (motore/livello.js, `colonne`): qui diventano colonne vere
  const colonna = new Uint8Array(W * H)
  const colonne = []
  for (const s of liv.stanze || []) for (const c of s.colonne || []) {
    if (c.x < 0 || c.y < 0 || c.x >= W || c.y >= H || colonna[id(c.x, c.y)] || !roccia(c.x, c.y)) continue
    colonna[id(c.x, c.y)] = 1
    colonne.push({ x: c.x, y: c.y })
  }
  // il pavimento: ogni cella che non è roccia, e sotto le colonne (la colonna sta su un pavimento)
  const pavimento = []
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!roccia(x, y) || colonna[id(x, y)]) pavimento.push({ x, y })
  // i muri: la roccia che tocca qualcosa che non è roccia (anche di spigolo). Un muro con il pavimento a nord sta fra la
  // telecamera e una stanza o un corridoio: è un parapetto basso, così l'eroe si vede sempre (docs/sotterraneo/grafica-3d.md)
  const muri = []
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!roccia(x, y) || colonna[id(x, y)]) continue
    let tocca = false
    for (let dy = -1; dy <= 1 && !tocca; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy
      if (!roccia(nx, ny) || (nx >= 0 && ny >= 0 && nx < W && ny < H && colonna[id(nx, ny)])) { tocca = true; break }
    }
    if (!tocca) continue
    const basso = y > 0 && (!roccia(x, y - 1) || !!colonna[id(x, y - 1)])
    muri.push({ x, y, basso })
  }
  const acqua = []
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (tipo[id(x, y)] === ACQUA) acqua.push({ x, y })

  // le torce del motore (con quella da prendere), o quelle di un livello che non le ha (le prove)
  const torce = liv.torce || torceAMuroDi(liv)
  return {
    W, H, tipo, colonna, pavimento, muri, colonne, acqua, torce,
    id,
    roccia,
    // si cammina (e la vista ci passa): pavimento e porte
    calpestabile: (x, y) => x >= 0 && y >= 0 && x < W && y < H && (tipo[id(x, y)] === PAVIMENTO || tipo[id(x, y)] === PORTA),
    // occupata da qualcosa che non si attraversa: roccia, colonna, relitto, acqua
    piena: (x, y) => roccia(x, y) || tipo[id(x, y)] === RELITTO || tipo[id(x, y)] === ACQUA,
  }
}

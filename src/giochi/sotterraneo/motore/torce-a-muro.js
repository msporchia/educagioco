// Le torce appese ai muri (docs/sotterraneo/luce.md, «Le torce appese»): dove stanno (una ogni OGNI_TORCIA celle sulla parete in alto
// di una stanza; il disegno le legge da qui, scena3d/pianta.js) e quale, ogni tanto, si stacca e si prende. Dato puro, gira in Node.
import { ROCCIA } from '../dati/mondo.js'
import { ORPELLI } from '../dati/orpelli.js'

// la posa di un pezzo d'arredo (dati/orpelli.js): lo dice la lista del suo scenario
const POSA = new Map()
for (const lista of Object.values(ORPELLI)) for (const o of lista) if (!POSA.has(o.pezzo)) POSA.set(o.pezzo, o.posa)
export const posaDi = pezzo => POSA.get(pezzo) || 'posato'

export const OGNI_TORCIA = 5
// quanti piani hanno una torcia da prendere, e mai nella stanza d'ingresso né in quella della scala (sono sulla strada di tutti)
export const PIANI_CON_LA_TORCIA = 0.85
export const NON_NELLE_STANZE = ['ingresso', 'uscita']
// la luce che fa da appesa: piena sotto di lei, e fino a ALONE_APPESA celle attorno (docs/sotterraneo/luce.md)
export const ALONE_APPESA = 2.6

// le torce del piano: { x, y } è la cella di muro, la stanza è sotto (y + 1); in ordine, lo stesso del disegno
export function torceAMuroDi(liv) {
  const W = liv.largo, H = liv.alto
  const id = (x, y) => y * W + x
  const roccia = (x, y) => x < 0 || y < 0 || x >= W || y >= H || liv.a(x, y) === ROCCIA
  const colonna = new Set()
  for (const s of liv.stanze || []) for (const c of s.colonne || []) if (c.x >= 0 && c.y >= 0 && c.x < W && c.y < H && roccia(c.x, c.y)) colonna.add(id(c.x, c.y))
  // l'arredo appeso sta sulla parete in alto: lì non si mette una torcia
  const appesi = new Set()
  for (const r of liv.robe || []) if (r.che === 'arredo' && ['appeso', 'contro'].includes(posaDi(r.pezzo))) appesi.add(id(r.x, r.y))
  const torce = []
  const prese = new Set()
  for (const s of liv.stanze || []) {
    for (let x = s.x + 1; x < s.x + s.w - 1; x += OGNI_TORCIA) {
      const y = s.y - 1
      // sul muro alto in cima alla stanza (sotto c'è pavimento, sopra roccia: un parapetto non regge niente)
      if (y < 1 || !roccia(x, y) || colonna.has(id(x, y)) || !roccia(x, y - 1) || roccia(x, s.y) || appesi.has(id(x, s.y))) continue
      if (prese.has(id(x, y))) continue
      prese.add(id(x, y))
      torce.push({ x, y, stanza: s.id })
    }
  }
  return torce
}

// un tiro dal seme del piano: non sposta niente del caso della discesa
function tiro(seme, sale) {
  let h = 2166136261
  for (const n of [seme, sale, 179424673]) h = Math.imul(h ^ (Math.floor(n) | 0), 16777619)
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d)
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39)
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296
}

// le torce del piano con quella da prendere segnata (`prendi`); `seme` è quello del piano. Una al più, e non in ogni piano
export function torceDelPiano(liv, seme) {
  const torce = torceAMuroDi(liv)
  if (tiro(seme, 1) >= PIANI_CON_LA_TORCIA) return torce
  const ruolo = new Map((liv.stanze || []).map(s => [s.id, s.ruolo]))
  const buone = torce.filter(t => !NON_NELLE_STANZE.includes(ruolo.get(t.stanza)))
  if (buone.length) buone[Math.floor(tiro(seme, 2) * buone.length)].prendi = true
  return torce
}

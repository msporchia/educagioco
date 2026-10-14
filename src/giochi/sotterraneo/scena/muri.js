// Com'è fatto un muro, cella per cella, guardando solo i vicini (gira in Node, unita/muri-sotterraneo). La
// regola: la roccia si vede da sopra (tetto, con bordo dove confina col calpestabile); sotto una cella di
// roccia che si cammina, si vede la faccia (alta una cella, col coronamento); di lato e in basso solo il
// bordo. Faccia alta una cella = qualunque muro sta in una cella di spessore (docs/sotterraneo/scenari.md).
// Angoli decisi per quarto di cella guardando tre vicini (i "quarti" di RPG Maker): 4 casi invece di 47 figure.

import { ROCCIA, PORTA, RELITTO, ACQUA } from '../dati/mondo.js'

// `pietra(x, y)`: fuori dal piano è roccia anche lei, compito di chi la passa
export const faccia = (pietra, x, y) => pietra(x, y) && !pietra(x, y + 1)
export const tetto = (pietra, x, y) => pietra(x, y) && pietra(x, y + 1)

export function genere(pietra, x, y) {
  if (!pietra(x, y)) return 'pavimento'
  return pietra(x, y + 1) ? 'tetto' : 'faccia'
}

// n/o/e: le tre strisce. angoli (no/ne in cima, so/se in fondo): in cima dove due strisce si incontrano o
// si cammina in diagonale senza nessuna; in fondo dove in diagonale sotto c'è una faccia (il coronamento
// incontra la striscia del muro accanto, o resta un dente)
export function bordiDelTetto(pietra, x, y) {
  const passa = (a, b) => !pietra(a, b)
  const aperto = (a, b) => !pietra(a, b) || !pietra(a, b + 1)
  const n = passa(x, y - 1)
  const o = aperto(x - 1, y)
  const e = aperto(x + 1, y)
  const angoli = []
  if ((n && o) || (!n && !o && passa(x - 1, y - 1))) angoli.push('no')
  if ((n && e) || (!n && !e && passa(x + 1, y - 1))) angoli.push('ne')
  // solo se sotto continua il tetto: sopra una fila di facce il coronamento è una riga sola, un blocco la spezzerebbe
  const sottoTetto = tetto(pietra, x, y + 1)
  if (!o && sottoTetto && faccia(pietra, x - 1, y + 1)) angoli.push('so')
  if (!e && sottoTetto && faccia(pietra, x + 1, y + 1)) angoli.push('se')
  return { n, o, e, angoli }
}

// una cella di roccia che sporge nel pavimento taglia in diagonale: roccia da due lati (n/o, n/e, s/o, s/e) e pavimento
// dai due opposti e fra loro. `no` e `ne` sono facce (sotto si cammina), `so` e `se` bordi. `buona(x, y)` dice se quel
// pavimento è di una stanza liscia (smussata, cappella, sala): una svolta di corridoio resta quadrata. Il pezzo
// diagonale ha il suo muro dall'altra parte: docs/sotterraneo/scenari.md, «I muri in diagonale». Non con una nicchia o una porta fra le otto celle intorno
export function taglio(pietra, x, y, buona = () => true) {
  if (!pietra(x, y) || !intornoBuono(pietra, x, y, buona)) return null
  const v = (dx, dy) => pietra(x + dx, y + dy)
  const lib = (dx, dy) => !v(dx, dy) && buona(x + dx, y + dy)
  if (v(0, -1) && v(-1, 0) && lib(1, 0) && lib(0, 1) && lib(1, 1)) return 'no'
  if (v(0, -1) && v(1, 0) && lib(-1, 0) && lib(0, 1) && lib(-1, 1)) return 'ne'
  if (v(0, 1) && v(-1, 0) && lib(1, 0) && lib(0, -1) && lib(1, -1)) return 'so'
  if (v(0, 1) && v(1, 0) && lib(-1, 0) && lib(0, -1) && lib(-1, -1)) return 'se'
  return null
}

const intornoBuono = (pietra, x, y, buona) => {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!pietra(x + dx, y + dy) && !buona(x + dx, y + dy)) return false
  return true
}

// l'angolo interno di una stanza liscia: una cella di pavimento con la roccia da due lati contigui e in diagonale, e il pavimento dagli altri
// due e in diagonale (il 270° del rettangolo). Si smussa con gli stessi pezzi del taglio, posati sul pavimento: la roccia entra nella cella.
// Non dove il muro accanto è già un taglio, né accanto a una nicchia o a una porta, e solo con due celle di muro dritto per lato (`trattiDelAngolo`). `buona` come per `taglio`
export function angoloInterno(pietra, x, y, buona = () => true) {
  if (pietra(x, y) || !buona(x, y) || !intornoBuono(pietra, x, y, buona)) return null
  const v = (dx, dy) => pietra(x + dx, y + dy)
  const lib = (dx, dy) => !v(dx, dy) && buona(x + dx, y + dy)
  const dritto = (dx, dy) => !taglio(pietra, x + dx, y + dy, buona)
  const prova = (sn, so) => v(0, sn) && v(so, 0) && v(so, sn) && lib(-so, 0) && lib(0, -sn) && lib(-so, -sn) && dritto(0, sn) && dritto(so, 0)
  const tipo = prova(-1, -1) ? 'no' : prova(-1, 1) ? 'ne' : prova(1, -1) ? 'so' : prova(1, 1) ? 'se' : null
  return tipo && trattiDelAngolo(pietra, x, y, tipo, buona).every(n => n >= 2) ? tipo : null
}

// il pavimento che un taglio lascia scoperto, dalla parte opposta alla roccia: da lì la tela prende com'è il pavimento
export const VICINA_DEL_TAGLIO = { no: [1, 1], ne: [-1, 1], so: [1, -1], se: [-1, -1] }

// una fila di facce finisce con uno spigolo dove accanto si cammina; dove c'è tetto o una porta non serve
export function capiDellaFaccia(pietra, porta, x, y) {
  return {
    sx: !pietra(x - 1, y) && !porta(x - 1, y),
    dx: !pietra(x + 1, y) && !porta(x + 1, y),
  }
}

// dal muro in cui sta: verticale = di fianco, orizzontale o incrocio = di fronte (ripiego). `chiuso` conta
// anche un'altra porta, o una colonna di porte accostate verrebbe di taglio in cima/fondo e di fronte in mezzo
export function versoDellaPorta(chiuso, x, y) {
  const muroInPiedi = chiuso(x, y - 1) && chiuso(x, y + 1)
  const muroSteso = chiuso(x - 1, y) && chiuso(x + 1, y)
  return muroInPiedi && !muroSteso ? 'fianco' : 'davanti'
}

// un numero fisso per cella: lo stesso piano si rivede sempre uguale, mai un disegno che cambia a caso
export function sorteDi(x, y, sale = 0) {
  let h = (Math.imul(x + 101, 73856093) ^ Math.imul(y + 211, 19349663) ^ Math.imul(sale + 7, 83492791)) >>> 0
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995) >>> 0; h ^= h >>> 15
  return h >>> 0
}

// i muri obliqui di un piano (`lisce`: le forme che si smussano); il pavimento di un relitto o di una pozza conta come quello della stanza che lo circonda
export function diagonaliDelPiano(liv, lisce) {
  const L = liv.largo, A = liv.alto
  const pietra = (x, y) => liv.a(x, y) === ROCCIA
  const stanze = liv.stanze || []
  const nicchie = new Set(stanze.flatMap(r => r.nicchie || []).map(n => n.y * L + n.x))
  const buona = (x, y) => {
    const a = liv.a(x, y)
    const s = stanze[liv.nelle ? liv.nelle[y * L + x] : -1] || (a === RELITTO || a === ACQUA ? liv.stanzaDi(x, y) : null)
    return !!s && a !== PORTA && !nicchie.has(y * L + x) && lisce.includes(s.forma)
  }
  const tagli = new Map(), sopra = new Set(), interni = new Map(), sopraInterni = new Set()
  for (let y = 0; y < A; y++) for (let x = 0; x < L; x++) {
    const t = taglio(pietra, x, y, buona)
    if (!t) continue
    tagli.set(y * L + x, t)
    if (t === 'no' || t === 'ne') sopra.add((y - 1) * L + x)
  }
  for (let y = 0; y < A; y++) for (let x = 0; x < L; x++) {
    const t = angoloInterno(pietra, x, y, buona)
    if (!t) continue
    interni.set(y * L + x, t)
    if (t === 'no' || t === 'ne') sopraInterni.add((y - 1) * L + x)
  }
  return { tagli, sopra, interni, sopraInterni, buona }
}

// le celle di muro dritto (fino a due) oltre l'angolo interno, lungo ognuno dei due muri: una nicchia, una porta o un taglio accorciano il conto
export function trattiDelAngolo(pietra, x, y, tipo, buona = () => true) {
  const [sn, so] = VERSI_ANGOLO[tipo]
  const lungo = (dx, dy, mx, my) => {
    let n = 0
    for (let k = 1; k <= 2; k++) {
      const [px, py] = [x + dx * k, y + dy * k]
      if (!pietra(px + mx, py + my) || pietra(px, py) || !buona(px, py) || taglio(pietra, px + mx, py + my, buona)) break
      n++
    }
    return n
  }
  return [lungo(-so, 0, 0, sn), lungo(0, -sn, so, 0)]
}
const VERSI_ANGOLO = { no: [-1, -1], ne: [-1, 1], so: [1, -1], se: [1, 1] }

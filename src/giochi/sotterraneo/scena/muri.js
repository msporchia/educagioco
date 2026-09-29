// Com'è fatto un muro, cella per cella, guardando solo i vicini (gira in Node, unita/muri-sotterraneo). La
// regola: la roccia si vede da sopra (tetto, con bordo dove confina col calpestabile); sotto una cella di
// roccia che si cammina, si vede la faccia (alta una cella, col coronamento); di lato e in basso solo il
// bordo. Faccia alta una cella = qualunque muro sta in una cella di spessore (docs/sotterraneo/scenari.md).
// Angoli decisi per quarto di cella guardando tre vicini (i "quarti" di RPG Maker): 4 casi invece di 47 figure.

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

/* I tipi di staccionata e il cancello: cosa si sceglie col pennello, da che livello, a che prezzo. Puro. Una staccionata sta in una cella intera (come
   una strada) e si lega alle vicine dello stesso tipo; il cancello è lo stesso pezzo, ma ci si cammina in mezzo. Il prezzo è per cella; il cancello costa
   in più `PREZZO_CANCELLO`. Il perché dei numeri è in docs/fattoria3d/staccionate.md; il metro è quello di docs/apprendimento/calibrazione.md
   (una moneta = dieci secondi di esercizio): la cella più cara, il muretto, costa 🪙 6; con il cancello 🪙 9. */

export const TIPI_STACCIONATA = {
  legno:   { nome: 'Legno basso',     prezzo: 2, liv: 2,  colore: '#8a5a33' },
  filo:    { nome: 'Filo e pali',     prezzo: 2, liv: 5,  colore: '#b9b6ae' },
  bianco:  { nome: 'Steccato bianco', prezzo: 3, liv: 8,  colore: '#f3efe6' },
  siepe:   { nome: 'Siepe',           prezzo: 4, liv: 12, colore: '#4a8a35' },
  muretto: { nome: 'Muretto di sassi', prezzo: 6, liv: 17, colore: '#a39b8c' },
}
/** Quanto costa in più un cancello (si mette su un pezzo che c'è già: si paga solo questo). */
export const PREZZO_CANCELLO = 3
export const TIPO_STACCIONATA_DI_BASE = 'legno'
export const TIPI_STACC = Object.keys(TIPI_STACCIONATA)

export const tipoStaccionataValido = t => Object.prototype.hasOwnProperty.call(TIPI_STACCIONATA, t)
/** Quanto costa una cella di quel tipo (col cancello, tutto il pezzo). */
export const prezzoStaccionata = (tipo, cancello = false) => TIPI_STACCIONATA[tipo].prezzo + (cancello ? PREZZO_CANCELLO : 0)

/** Il codice che si salva: 'legno' o 'legno.c' (cancello). */
export const codiceStaccionata = (tipo, cancello) => (cancello ? `${tipo}.c` : tipo)
/** Dal codice all'aspetto { tipo, cancello }, o `null` se non lo conosciamo (un tipo tolto o un testo guasto: la cella torna prato). */
export function staccionataDaCodice(codice) {
  if (typeof codice !== 'string') return null
  const [tipo, resto, altro] = codice.split('.')
  if (!tipoStaccionataValido(tipo) || altro !== undefined || (resto !== undefined && resto !== 'c')) return null
  return { tipo, cancello: resto === 'c' }
}

/** Cosa si apre a un livello (per l'avviso «Livello N»): gli id dei tipi. */
export function staccionateAl(livello) {
  return TIPI_STACC.filter(t => TIPI_STACCIONATA[t].liv === livello && livello > 1)
}

/* I tipi di strada e gli stili di bordo: cosa si sceglie col pennello, da che livello, a che prezzo. Puro. Una strada è un TIPO (il fondo)
   più un BORDO (la cornice sui lati che non toccano un'altra strada dello stesso tipo). Il prezzo di una cella è la somma dei due. Il perché
   dei numeri è in docs/fattoria3d/terreno.md «Le strade: tipi e bordi»; il metro è quello di docs/apprendimento/calibrazione.md
   (una moneta = dieci secondi di esercizio): la cella più cara costa 🪙 8, quattro minuti di esercizio ogni tre celle. */

export const TIPI_STRADA = {
  terra:     { nome: 'Terra battuta',  prezzo: 1, liv: 1,  colore: '#dcc796' },
  ghiaia:    { nome: 'Ghiaia',         prezzo: 2, liv: 3,  colore: '#a8a29a' },
  ciottoli:  { nome: 'Ciottoli bianchi', prezzo: 3, liv: 7,  colore: '#ece6d6' },
  lastricato: { nome: 'Lastricato',    prezzo: 4, liv: 12, colore: '#bdb8ae' },
  mattoni:   { nome: 'Mattoni',        prezzo: 6, liv: 20, colore: '#b5593f' },
}
export const BORDI_STRADA = {
  nessuno:  { nome: 'Nessuno',    prezzo: 0, liv: 1,  colore: '#c9b07c' },
  erba:     { nome: 'Ciuffi',     prezzo: 1, liv: 2,  colore: '#6fb044' },
  cordolo:  { nome: 'Cordolo',    prezzo: 1, liv: 5,  colore: '#cfcac0' },
  sassi:    { nome: 'Ciottolini', prezzo: 2, liv: 10, colore: '#e4dfd2' },
  steccato: { nome: 'Steccato',   prezzo: 2, liv: 15, colore: '#8a5a33' },
}
/** Quello che c'era prima dei tipi: ogni strada vecchia è questa. */
export const TIPO_DI_BASE = 'terra'
export const BORDO_DI_BASE = 'nessuno'
export const TIPI = Object.keys(TIPI_STRADA)
export const BORDI = Object.keys(BORDI_STRADA)

export const tipoValido = t => Object.prototype.hasOwnProperty.call(TIPI_STRADA, t)
export const bordoValido = b => Object.prototype.hasOwnProperty.call(BORDI_STRADA, b)
/** Quanto costa una cella di quel tipo e quel bordo. */
export const prezzoStrada = (tipo, bordo) => TIPI_STRADA[tipo].prezzo + BORDI_STRADA[bordo].prezzo
/** Il livello a cui la coppia è tutta aperta. */
export const livelloStrada = (tipo, bordo) => Math.max(TIPI_STRADA[tipo].liv, BORDI_STRADA[bordo].liv)

/** Il codice che si salva: 'ghiaia.cordolo'. */
export const codiceAspetto = (tipo, bordo) => `${tipo}.${bordo}`
/** Dal codice all'aspetto, o `null` se non lo conosciamo (un tipo tolto o un testo guasto: la strada torna quella di base). */
export function aspettoDaCodice(codice) {
  if (typeof codice !== 'string') return null
  const [tipo, bordo] = codice.split('.')
  return tipoValido(tipo) && bordoValido(bordo) ? { tipo, bordo } : null
}
export const eDiBase = a => a.tipo === TIPO_DI_BASE && a.bordo === BORDO_DI_BASE

/** Cosa si apre a un livello (per l'avviso «Livello N»): { tipi: [id], bordi: [id] }. */
export function stradeAl(livello) {
  return {
    tipi: TIPI.filter(t => TIPI_STRADA[t].liv === livello && livello > 1),
    bordi: BORDI.filter(b => BORDI_STRADA[b].liv === livello && livello > 1),
  }
}

/* Cosa è alla portata di un bambino, per TAPPA di campagna (non per domanda
   di quiz, quello è quiz/nucleo/classi.js): una domanda si pesca, una tappa
   si macina, quindi la finestra qui è stretta (`miraDi`) e non la campana
   larga dei quiz. Nessuna tappa esce mai dalla fila: cambia solo lo stato
   (PASSATA/IN_PORTATA/AVANTI), perché l'avanzamento è un indice e una fila
   accorciata sposterebbe i progressi di tutti. La testa si taglia solo a
   quello che la scuola ha già dato (`scuola:`, riaperta se il sapere è
   spento). Vedi docs/apprendimento/eta-e-portata.md. Gira in Node
   (test/unita/portata). */
import { livelloDegliAnni, anniDelLivello,
         LIVELLO_MIN, LIVELLO_MAX } from '../quiz/nucleo/classi.js'

export { livelloDegliAnni, anniDelLivello, LIVELLO_MIN, LIVELLO_MAX }

// costanti proprie e non importate da classi.js: sono due mestieri diversi che per caso condividevano un numero
// (vedi docs/apprendimento/calibrazione.md); se la mira dei quiz si muove, questi restano fermi finché non si decide qui
const MIRA_SOTTO = 12
const MIRA_SOPRA = 19

// non confondere con bersaglio() di classi.js, che interpola con la manopola 0..1: qui la finestra è la stessa per tutte
// «portata» e non «livello»: un nome nuovo si cerca prima nei motori (docs/apprendimento/eta-e-portata.md)
export const miraDi = eta => {
  if (eta == null) return null
  const qui = livelloDegliAnni(eta)
  return [qui - MIRA_SOTTO, qui + MIRA_SOPRA]
}

// stringhe e non numeri: finiscono in un v-if e in un test, e `stato === 'avanti'` si legge
export const PASSATA = 'passata'
export const IN_PORTATA = 'portata'
export const AVANTI = 'avanti'

const PELO = 1e-9 // lo stesso pelo di adatta(): una media di dieci noni fa 95.000000001

export function statoDellaTappa (tappa, { eta = null, spenti = [] } = {}) {
  const mira = miraDi(eta)
  if (!mira || tappa?.portata == null) return IN_PORTATA // senza età non si taglia niente: non sapere vuol dire dare tutto

  if (tappa.portata > mira[1] + PELO) return AVANTI
  if (tappa.portata < mira[0] - PELO) {
    const daScuola = tappa.scuola && !spenti.includes(tappa.scuola) // solo se la scuola l'ha già dato ed è ancora acceso
    return daScuola ? PASSATA : IN_PORTATA
  }
  return IN_PORTATA
}

// non filtra: tante voci quante ne arrivano, con gli indici veri della campagna (buoni per profile.campagne)
export const filaConPortata = (tappe = [], regole = {}) =>
  tappe.map((t, indice) => ({ ...t, indice, stato: statoDellaTappa(t, regole) }))

// la prima tappa non ancora saputa; se sono tutte PASSATA torna 0 (meglio la prima che l'ultima)
export function primaDaGiocare (tappe = [], regole = {}) {
  const i = filaConPortata(tappe, regole).findIndex(t => t.stato !== PASSATA)
  return i < 0 ? 0 : i
}

// se non resta nessuna tappa alla sua portata, la carta non ha niente da offrire; `fatte` esclude quelle già portate a casa
export function restaQualcosa (tappe = [], { fatte = 0, ...regole } = {}) {
  return filaConPortata(tappe, regole)
    .some(t => t.stato === IN_PORTATA && t.indice >= fatte)
}

// un gioco già cominciato non sparisce mai: `provato` è albo.provato, non un campo nuovo
export const giocoDaOffrire = (tappe = [], { provato = false, ...resto } = {}) =>
  provato || restaQualcosa(tappe, resto)

// minimo e massimo dei livelli delle sue tappe, solo per raccontarlo a un grande: nessuna decisione passa di qui
export function arcoDelGioco (tappe = []) {
  const l = tappe.map(t => t.portata).filter(x => x != null)
  if (!l.length) return null
  return { da: Math.min(...l), a: Math.max(...l),
           anniDa: anniDelLivello(Math.min(...l)), anniA: anniDelLivello(Math.max(...l)) }
}

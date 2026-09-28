/* La raffica: sbagliare non si paga, ma tirare a caso di fretta sì, e la
   penalità cresce con l'insistenza (vedi
   docs/apprendimento/la-domanda.md). Sta in un modulo e non nel
   componente perché Domanda.vue si rimonta a ogni domanda: un contatore
   lì nascerebbe a zero ogni volta. */

export const SCALA = [1500, 3000, 5000, 6000] // ms aggiunti alla 1ª·2ª·3ª·4ª risposta di fretta; dall'ultima è il tetto
export const PER_USCIRNE = 4 // giuste, non solo lette: per caso capita una volta su 250, letta non risale né azzera

let difila = 0
let giuste = 0

// torna i ms da aggiungere e a quante di fila siamo; `giusto` serve solo a uscirne, la penalità la decide diFretta
export function pesoDellaFretta(diFretta, giusto = false) {
  if (diFretta) {
    difila = Math.min(SCALA.length, difila + 1)
    giuste = 0
    return { attesa: SCALA[difila - 1], difila, mancano: PER_USCIRNE }
  }
  if (difila && giusto) {
    giuste++
    if (giuste >= PER_USCIRNE) { difila = 0; giuste = 0 }
  }
  return { attesa: 0, difila, mancano: difila ? PER_USCIRNE - giuste : 0 }
}

// per i test, e per chi cambia bambino: la raffica è di chi ha il telefono in mano adesso
export function azzeraLaFretta() { difila = 0; giuste = 0 }
export const quanteDiFila = () => difila
export const quanteNeMancano = () => (difila ? PER_USCIRNE - giuste : 0)

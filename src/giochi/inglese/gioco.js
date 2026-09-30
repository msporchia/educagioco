// Il manifesto dell'inglese a mondi: dato puro. Prende il posto della carta
// «English» di prima (stessa chiave, `inglese`): lo spagnolo resta su
// views/LinguaGame.vue. Vedi docs/lingue/mondi.md e
// docs/core/convenzione-giochi.md. Niente blocco `albo`: l'area «English»
// dell'albo c'è già (data/traguardi.js, store/progressi.js) e le chiavi SRS
// sono le stesse di prima.
import { MONDI, TAPPE, CHIAVE } from './dati/mondi.js'
import { travasate, quanteVinte } from './motore/travaso.js'

export { CHIAVE }

export default {
  chiave: CHIAVE,
  nome: 'English',
  icona: '🌐',
  che: 'parole, frasi e un libro in inglese',
  area: 'parole',
  come: 'domande',
  tappe: TAPPE.length,
  // niente `grandi`: il primo mondo è la prima elementare (portata 25), e chi
  // la carta la vede lo decide la portata delle tappe, come per gli altri giochi

  riassunto(av = {}) {
    const vinte = travasate((av && av.vinte) || {})
    const quante = quanteVinte(vinte)
    if (!quante) return `${TAPPE.length} tappe sulla mappa del tesoro`
    // il mondo più avanti in cui si è vinta almeno una tappa
    const dove = MONDI.filter(m => m.tappe.some(t => vinte[t.id])).pop()
    return `${quante} tapp${quante === 1 ? 'a' : 'e'} su ${TAPPE.length} · ${dove.nome}`
  },
}

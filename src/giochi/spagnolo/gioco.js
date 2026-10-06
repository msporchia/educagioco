// Il manifesto dello spagnolo a mondi: dato puro. Prende il posto della carta
// «Spagnolo» di prima (stessa chiave, `spagnolo`): il gioco di prima resta
// in views/LinguaGame.vue, in fondo alla mappa. Vedi docs/lingue/spagnolo.md e
// docs/core/convenzione-giochi.md. Niente blocco `albo`: l'area «Español»
// dell'albo c'è già (data/traguardi.js, store/progressi.js) e le chiavi SRS
// delle parole sono le stesse di prima.
import { MONDI, TAPPE, CHIAVE } from './dati/mondi.js'
import { travasate, quanteVinte } from './motore/travaso.js'

export { CHIAVE }

export default {
  chiave: CHIAVE,
  nome: 'Español',
  icona: '🇪🇸',
  che: 'parole, frasi e un libro in spagnolo',
  area: 'parole',
  come: 'domande',
  copertina: { fondo: '#f2c14e', disegno: '#e05a47', scena: 'onde' },
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

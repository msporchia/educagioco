/* ═══════════════════════════════════════════════════════════════════
   LA NAVIGAZIONE DEL GENERALE — dove si è e come ci si è arrivati.

   Due schermate: l'elenco delle prove e la partita. C'erano anche la
   scelta dell'avventura e i capitoli di una storia, ma le avventure non
   si sono mai aperte (`AVVENTURE_APERTE` è rimasta `false` dal primo
   giorno) e sono state tolte insieme ai loro livelli: una strada che
   nessuno percorre è codice che qualcuno deve tenere in piedi lo
   stesso. Il giorno che torneranno delle storie, torneranno con una
   schermata loro — e non è detto che sia quella di prima.

   `avvia(livello)` è quello che sa fare il gioco: prepara il piano, il
   mondo e la tela. Qui si decide QUALE livello e si cambia schermata.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { LIVELLI } from '../../data/generale.js'
import { dopoDi } from './fila.js'

export function creaNavigazione ({ avvia, aCasa, nome }) {
  const fase = ref('prove')        // 'prove' | 'gioco'
  const L = ref(0)                 // quale prova: la posizione nella fila, non una chiave

  function apri (i) { L.value = i; fase.value = 'gioco'; avvia(LIVELLI[i]) }

  /* il tasto ← della barra: dalla partita all'elenco, e dall'elenco a
     casa */
  function indietro () {
    if (fase.value === 'gioco') { fase.value = 'prove'; return }
    aCasa()
  }

  /* Cosa c'è dopo, e non è «l'indice dopo»: i livelli non ancora
     approvati stanno dietro il cancello dei giochi in prova, e la fila
     che si sta giocando può avere dei buchi. Il prossimo è la prossima
     riga che si VEDE — se no il ▶ di fine livello porterebbe dritto
     dentro una prova che l'elenco non mostra. */
  const dopo = computed(() => {
    const p = dopoDi(L.value)
    return p === null ? null : { tipo: 'prova', i: p }
  })

  function avanti () {
    const d = dopo.value
    if (!d) { indietro(); return }
    apri(d.i)
  }

  /* il numero che si legge nella barra */
  const numeroTappa = computed(() => L.value + 1)

  /* le prove sono l'unica strada, quindi la barra dice il nome del
     gioco, come in tutte le altre home */
  const titolo = computed(() => nome)

  return { fase, L, apri, indietro, avanti, dopo, numeroTappa, titolo }
}

/* ═══════════════════════════════════════════════════════════════════
   LA FILA DELLE PROVE, COM'È ADESSO — quali si vedono e quali sono
   aperte.

   Due cose che stavano in tre schermate diverse e devono dire la stessa
   cosa: QUALI livelli compaiono (dipende dal cancello dei giochi in
   prova) e QUALI si possono aprire (dipende da quelli già vinti).

   ── PERCHÉ NON BASTAVA `gen.tappa` ──
   Il lucchetto era «la posizione i è aperta se i ≤ quante ne hai
   fatte». Regge finché la fila è una sola. Da quando i livelli non
   ancora approvati stanno dietro il cancello, la fila che si vede ha
   dei buchi: chi ha vinto le prime tre (indici 0, 1, 2) si troverebbe
   davanti la quarta VISIBILE all'indice 6, e un conto fatto sulle
   posizioni la direbbe chiusa per sempre.

   Quindi il lucchetto si legge dalle STELLE, che stanno per livello e
   non contano le posizioni: si scorre la fila visibile e ci si ferma
   alla prima senza stelle — quella è aperta, le dopo no. La regola
   dell'interruttore dei genitori resta quella comune (`tappaAperta`),
   perché «apri tutto» deve continuare ad aprire tutto.

   `gen.tappa` non sparisce: resta la punta toccata nella fila piena,
   che è quello che guardano i contatori e la riga in home. Semplicemente
   non decide più chi è chiuso.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { fila } from '../../data/generale.js'
import { genProgresso, sperimentaliAccesi, tappaAperta } from '../../store/profile.js'

/* le righe da mostrare: `{ liv, i, titolo, prova, campagna }`, dove `i`
   è la posizione nella fila piena — cioè la chiave dei progressi */
export const FILA = computed(() => fila(sperimentaliAccesi()))

const stelleDi = i => genProgresso().stelle[i] || 0

/* fin dove si è arrivati NELLA FILA VISIBILE: quante righe di seguito,
   dalla prima, sono già state vinte. È l'indice della prima da fare. */
export const avanzamento = computed(() => {
  const righe = FILA.value
  let n = 0
  while (n < righe.length && stelleDi(righe[n].i) > 0) n++
  return n
})

/* `k` è la posizione NELLA FILA VISIBILE, non nella fila piena */
export const apribile = k => tappaAperta(k, avanzamento.value)

/* quante ne sono state vinte in tutto (anche saltando, se i genitori
   hanno aperto tutto) e quante ce ne sono: la riga «3 di 6» */
export const fatte = computed(() => FILA.value.filter(r => stelleDi(r.i) > 0).length)
export const quante = computed(() => FILA.value.length)

/* il tutorial è tutto quello che non è una campagna — e col cancello
   chiuso è più corto, perché le prove non ancora approvate non ci sono */
export const quanteTutorial = computed(() => FILA.value.filter(r => !r.campagna).length)

/* quella dopo, e non è «l'indice dopo»: è la prossima riga VISIBILE.
   Torna la posizione nella fila piena, che è quella con cui si apre un
   livello, o `null` se la fila è finita. */
export function dopoDi (i) {
  const righe = FILA.value
  const k = righe.findIndex(r => r.i === i)
  return k >= 0 && k + 1 < righe.length ? righe[k + 1].i : null
}

/* la campagna è finita: contando anche il livello appena vinto, ogni
   riga visibile ha almeno una stella. Sta qui e non nel profilo perché
   «tutti» dipende da quali si vedono, e quello lo sa questa fila. */
export const filaFinita = i =>
  FILA.value.every(r => r.i === i || stelleDi(r.i) > 0)

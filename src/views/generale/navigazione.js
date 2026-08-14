/* ═══════════════════════════════════════════════════════════════════
   LA NAVIGAZIONE DEL GENERALE — dove si è e come ci si è arrivati.

   Quattro schermate: la scelta dell'avventura (la prima), i capitoli di
   una storia, le quattordici prove sciolte, e la partita. Tenere questo
   conto qui dentro serve a una cosa sola: `GeneraleGame.vue` sa
   giocare un livello e non deve sapere da quale schermata è arrivato.
   Gli basta il `contesto`, che è l'unica differenza fra una prova e un
   capitolo — e serve solo alla fine, per segnare la vittoria dove va.

   `avvia(livello)` è quello che sa fare il gioco: prepara il piano, il
   mondo e la tela. Qui si decide QUALE livello e si cambia schermata.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { STORIA, AVVENTURE_APERTE } from '../../data/storie-generale.js'
import { mappaDi, giocabile } from '../../data/mappe-storie.js'
import { prossimi } from '../../store/storie.js'
import { LIVELLI } from '../../data/generale.js'
import { dopoDi } from './fila.js'

export function creaNavigazione ({ avvia, aCasa, nome }) {
  /* SENZA AVVENTURE SI ENTRA DALLE PROVE. Le storie sono spente
     (`AVVENTURE_APERTE`), e una schermata di scelta con una scelta sola
     è una porta girevole: si toglie di mezzo, e il ← delle prove torna
     dritto a casa invece che su una pagina vuota. */
  const fase = ref(AVVENTURE_APERTE ? 'avventure' : 'prove')  // 'avventure' | 'capitoli' | 'prove' | 'gioco'
  const storiaOra = ref('')        // quale avventura si sta guardando
  const contesto = ref(null)       // { tipo:'prova', i } | { tipo:'capitolo', storia, n, capId }
  const L = ref(0)                 // quale prova: le prove restano una fila

  function entra (l, ctx) { contesto.value = ctx; fase.value = 'gioco'; avvia(l) }

  function apri (i) { L.value = i; entra(LIVELLI[i], { tipo: 'prova', i }) }

  function apriCapitolo (n) {
    const l = mappaDi(storiaOra.value, n)
    if (!l) return
    const cap = STORIA[storiaOra.value]?.capitoli[n]
    entra(l, { tipo: 'capitolo', storia: storiaOra.value, n, capId: cap ? cap.id : String(n) })
  }

  const apriStoria = id => { storiaOra.value = id; fase.value = 'capitoli' }

  /* il tasto ← della barra: si torna al posto da cui si è entrati, e da
     lì alla scelta dell'avventura. Una schermata sola in mezzo. */
  function indietro () {
    if (fase.value === 'gioco') {
      fase.value = contesto.value && contesto.value.tipo === 'capitolo' ? 'capitoli' : 'prove'
      return
    }
    if (AVVENTURE_APERTE && (fase.value === 'capitoli' || fase.value === 'prove'))
      { fase.value = 'avventure'; return }
    aCasa()
  }

  /* Cosa c'è dopo, e **non è mai «il numero dopo»**: è quello che si è
     aperto adesso. Dentro una storia lo chiede a `prossimi()`, che oggi
     risponde con un capitolo solo e domani — coi rami — potrà risponderne
     due: in quel caso non si tira dritto, si torna alla mappa a scegliere. */
  const dopo = computed(() => {
    const c = contesto.value
    if (!c) return null
    if (c.tipo === 'capitolo') {
      const aperti = prossimi(c.storia).filter(x => giocabile(c.storia, x.n))
      return aperti.length === 1 ? { tipo: 'capitolo', n: aperti[0].n } : null
    }
    /* e nemmeno qui è «il numero dopo»: i livelli non ancora approvati
       stanno dietro il cancello dei giochi in prova, e la fila che si
       sta giocando ha dei buchi. Il prossimo è la prossima riga che si
       VEDE — se no il ▶ di fine livello porterebbe dritto dentro una
       prova che l'elenco non mostra. */
    const p = dopoDi(L.value)
    return p === null ? null : { tipo: 'prova', i: p }
  })

  function avanti () {
    const d = dopo.value
    if (!d) { indietro(); return }
    if (d.tipo === 'capitolo') apriCapitolo(d.n)
    else apri(d.i)
  }

  /* il numero che si legge nella barra: il capitolo, o la prova */
  const numeroTappa = computed(() =>
    (contesto.value && contesto.value.tipo === 'capitolo' ? contesto.value.n : L.value) + 1)

  /* «Le prove» solo se sono una delle strade: quando sono l'unica, la
     barra dice il nome del gioco, come in tutte le altre home */
  const titolo = computed(() =>
    fase.value === 'capitoli' ? (STORIA[storiaOra.value]?.nome || nome)
    : fase.value === 'prove' && AVVENTURE_APERTE ? 'Le prove' : nome)

  const inStoria = () => contesto.value && contesto.value.tipo === 'capitolo'

  return { fase, storiaOra, contesto, L, apri, apriCapitolo, apriStoria,
           indietro, avanti, dopo, numeroTappa, titolo, inStoria }
}

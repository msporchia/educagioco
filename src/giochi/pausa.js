/* ═══════════════════════════════════════════════════════════════════
   LA PAUSA, UNA SOLA

   Un gioco che gira su un orologio (`requestAnimationFrame`) si ferma
   già da sé quando la pagina sparisce — il browser non consegna più un
   fotogramma a una scheda nascosta. Il guasto non è quello: è **la
   ripresa**. Il telefono si riapre e la partita riparte nello stesso
   istante, senza preavviso, con il dito ancora sul tasto di accensione
   e il bambino che sta ancora capendo dove era rimasto. In Survivors
   costava il primo cuore, nella Corsa il primo mostro.

   E non c'era nessun modo di fermarsi **volendo**: la mamma chiama, e
   l'unica uscita era il tasto indietro, che nella Corsa butta via la
   gara (`allaMappa`). Un gioco senza pausa insegna a non cominciarlo
   quando manca poco a cena.

   Questo file è il pezzo comune: le condizioni che fermano un gioco
   sono le stesse per tutti, e finché ognuno se le scriveva in casa
   erano quattro copie che divergevano (la Corsa contava la festa,
   il Dungeon no).

   ── IL PATTO IN TRE RIGHE ────────────────────────────────────────

     const { inPausa, fermo, metti, togli, aiuto } = usaPausa()

     <Barra … pausa @pausa="metti()" @aiuto="aiuto" />
     <VeloPausa v-if="inPausa" @riprendi="togli" />

   e nel battito, dove prima c'era la somma scritta a mano:

     if (!fermo.value) p.avanza(dt)

   ── LE DUE COSE CHE NON SONO OVVIE ───────────────────────────────

   **Non si riprende mai da soli.** Tornare a vedere lo schermo mette
   in pausa e basta: il velo resta, e si riparte al tocco. È la stessa
   scelta che Survivors aveva già fatto a mano per la partita ripresa
   (`inAttesa`), e vale ancora di più qui — chi riapre l'app non sta
   guardando il gioco, sta guardando il telefono che si accende.

   **`fermo` non è `inPausa`.** `inPausa` è la pausa vera, quella che
   mostra il velo e che il bambino ha chiesto (o che gli è capitata
   posando il telefono). `fermo` è la somma di tutto quello che tiene
   ferma la partita e che un velo NON deve coprire, perché un velo sopra
   c'è già: il cartello di un traguardo (`state.festa`), il foglio del
   `?`, e quello che il gioco aggiunge di suo.

   ── `anche`, E L'UNICA TRAPPOLA ──────────────────────────────────

   `usaPausa({ anche: () => !!finale.value })` aggiunge una condizione
   del gioco. `fermo` è un `computed`, quindi **quello che `anche` legge
   dev'essere reattivo** (un `ref`, un `computed`): i motori vivono in
   uno `shallowRef` e i loro campi non lo sono — `p.finita`, `p.inPausa`
   cambiano senza che niente se ne accorga, e un computed che li legge
   resta indietro per sempre. Quelli si guardano dentro il battito, che
   ci passa sessanta volte al secondo:

     const bloccato = fermo.value || p.finita || p.inPausa

   ── I NOMI ───────────────────────────────────────────────────────

   `pausa` era già preso **due volte nei motori** — `inPausa` di
   Survivors (la sosta delle carte) e `this.pausa` del castello (il
   respiro fra un'ondata e l'altra) — e `sosta` è la partita lasciata a
   metà (`giochi/campagne.js`). Il pezzo puro qui dentro si chiama
   `Freno`, che non è preso da nessuno: un nome nuovo si cerca anche nei
   motori, non solo nei dati.

   ── COSA NON SI METTE IN PAUSA ───────────────────────────────────

   I giochi senza orologio: la fattoria e la cameretta sono posti dove
   non scorre niente, e un ⏸ lì è un tasto che non fa niente. Il
   Generale ha il suo Via/Stop dentro la partita, che è un'altra cosa —
   lì fermare il tempo È una mossa. E la domanda di quiz non si copre
   mai col velo: è già un velo sopra il gioco, e due veli uno sull'altro
   sono un gioco rotto.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { state } from '../store/profile.js'

/* ── la finestra cieca ──
   Un velo appena comparso non si lascia toccare per un pelo di tempo:
   il dito che ha premuto ⏸ si lascia dietro un `click`, e quel click
   arriva a chi sta sotto **in quel momento**, cioè al velo appena nato,
   che si toglierebbe da solo. È lo stesso numero della domanda
   (`quiz/Domanda.vue`), e sta qui perché adesso i posti che lo usano
   sono due. */
export const CIECA = 320

/* ══════════ la parte pura ══════════
   Gira in Node e si prova contando: `test/unita/pausa`. */

/* Tutto quello che tiene ferma una partita, in un posto solo. È un
   `or` di quattro cose e potrebbe stare dentro il computed — ma allora
   sarebbe scritto in undici giochi invece che qui, ed è esattamente
   com'era prima: chi ha aggiunto `state.festa` alla Corsa non l'ha
   aggiunto al Dungeon, e nessun test poteva vederlo. */
export function siFerma({ inPausa = false, festa = false, aiuto = false, anche = false } = {}) {
  return !!(inPausa || festa || aiuto || anche)
}

export class Freno {
  constructor() {
    this.ferma = false
    /* perché si è fermi: `voluta` (il tasto ⏸) o `schermo` (il telefono
       posato). Non cambia cosa si vede — il velo dice la stessa cosa in
       tutti e due i casi — ma è la differenza fra «l'ho chiesto io» e
       «è successo», e il giorno che una delle due volesse una frase sua
       il dato c'è già. */
    this.motivo = ''
  }

  get inPausa() { return this.ferma }

  /* Idempotente, e **il primo motivo vince**: chi ha premuto ⏸ e poi ha
     posato il telefono, quando torna è ancora in pausa perché l'ha
     chiesto lui. Torna `true` solo se ha cambiato qualcosa, così chi
     chiama può decidere di suonare o no. */
  metti({ auto = false } = {}) {
    if (this.ferma) return false
    this.ferma = true
    this.motivo = auto ? 'schermo' : 'voluta'
    return true
  }

  togli() {
    if (!this.ferma) return false
    this.ferma = false
    this.motivo = ''
    return true
  }

  /* Lo schermo che va e che torna. **Il ritorno non fa niente**, ed è
     la riga per cui esiste tutto il resto: riprendere da soli vuol dire
     consegnare una partita in corsa a chi ha appena acceso il telefono. */
  schermo(visibile) {
    if (!visibile) this.metti({ auto: true })
    return this.ferma
  }
}

/* ══════════ il vestito Vue ══════════ */

export function usaPausa({ anche = null } = {}) {
  const freno = new Freno()
  const inPausa = ref(false)
  const motivo = ref('')
  /* col foglio del `?` aperto la partita sta ferma: leggere come si
     gioca non deve costare la gara che si sta giocando. Lo dice la
     barra con `@aiuto`, e qui si somma alle altre condizioni invece di
     essere un `ref` che ogni gioco si dichiara per conto suo. */
  const aiutoAperto = ref(false)

  const rispecchia = () => { inPausa.value = freno.inPausa; motivo.value = freno.motivo }
  const metti = opzioni => { freno.metti(opzioni); rispecchia() }
  const togli = () => { freno.togli(); rispecchia() }
  const aiuto = v => { aiutoAperto.value = !!v }

  const fermo = computed(() => siFerma({
    inPausa: inPausa.value,
    festa: state.festa.length > 0,
    aiuto: aiutoAperto.value,
    anche: anche ? !!anche() : false,
  }))

  /* `pagehide` oltre a `visibilitychange` per la stessa ragione per cui
     ce l'ha `App.vue` (le sessioni): su iOS il primo non arriva sempre
     quando la scheda viene messa via. */
  function guarda(e) {
    if (e?.type === 'pagehide' || document.visibilityState === 'hidden') {
      freno.schermo(false)
      rispecchia()
    }
  }

  /* `visibilitychange` si ascolta sul `document`, che è dove viene
     lanciato (arriva anche alla finestra, ma solo perché risale); il
     `pagehide` invece è della finestra e basta. */
  onMounted(() => {
    document.addEventListener('visibilitychange', guarda)
    addEventListener('pagehide', guarda)
  })
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', guarda)
    removeEventListener('pagehide', guarda)
  })

  return { inPausa, motivo, fermo, aiutoAperto, metti, togli, aiuto }
}

<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA DOMANDA — il componente che i giochi mettono in scena.

   Riceve una domanda già fatta (`src/quiz/scelta.js` la produce) e la
   mostra: consegna, la cosa da guardare se c'è, i tasti delle risposte.
   Poi dice com'è andata e si toglie di mezzo.

     <Domanda :domanda="d.domanda" :pittori="d.pittori"
              :titolo="`${d.icona} ${d.nome}`" @risposto="incassa" />

   Segue la convenzione dei giochi nuovi: **non chiama nessun motore e
   non sa cosa sia una moneta**. Riceve quello che deve mostrare ed
   emette quello che è successo — `{ giusto, chiave, tempo, indice }` —
   e chi l'ha chiamato decide se quello vale una carta di
   potenziamento, una porta che si apre o niente.

   L'UNICA COSA CHE SCRIVE è il ripasso: la chiave del concetto e com'è
   andata, in `quiz/memoria.js`. Sta qui e non nei giochi perché i
   giochi la chiave non la guardano nemmeno — prendono `{ giusto }` e
   basta — e perché quattro giochi che si ricordano di annotare sono
   quattro posti dove dimenticarsene: infatti il `:key` della domanda
   se l'erano ricordato in uno su cinque. Non è il profilo che si tocca
   a mano (contatori, monete, livelli): è la stessa risposta che il
   componente ha appena visto, scritta dove serve a farla tornare.
   Chi non ha `origine` non annota — è una domanda mostrata fuori dal
   giro normale — e la palestra dei genitori (`gioco: 'prova'`) non
   annota mai: lì si guardano le domande, non si esercita nessuno.

   È il gemello Vue di `grafica/scheda.js`, che fa la stessa cosa in DOM
   puro per le palestre dei prototipi: là non c'è Vue e non ci deve
   essere, qui invece un overlay imperativo dentro un gioco reattivo
   sarebbe un corpo estraneo.

   UNA COSA SOLA DA SAPERE: il velo è `position: absolute`, così copre il
   riquadro del gioco e non tutto il telefono (la barra in cima resta
   dov'è). Chi lo mette in scena deve avere `position: relative` addosso,
   o la domanda esce dal posto sbagliato.

   LA SCHEDA SI ADATTA ALLO SCHERMO, non ha una taglia sola. I disegni
   (l'orologio, la figura da specchiare, i quadretti) erano fissi a 148 e
   118 pixel: su un telefono vecchio da 320×480 una domanda di geometria
   veniva alta 760 pixel e le ultime due risposte restavano fuori, senza
   nemmeno il modo di arrivarci. Adesso ogni misura è un `clamp()` legato
   a `--qz-h`, l'unità di altezza utile, e il velo scorre lo stesso —
   perché un carattere grosso di sistema o una consegna lunga possono
   sempre sforare, e allora si scrolla invece di perdere un pezzo.

   `--qz-h` vale `1vh`, cioè «ho tutto lo schermo». Un gioco che apre la
   domanda in un pannello più corto la stringe da fuori — il dungeon, che
   la tiene in fondo su tre quarti d'altezza, dichiara `--qz-h: .72vh` —
   e i disegni rimpiccioliscono di conseguenza.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { dipingi } from './grafica/riquadro.js'
import Giudizio from '../components/Giudizio.vue'
import { giudiziAccesi } from '../store/giudizi.js'
import { annota } from './memoria.js'
import { guardaComeVa } from './allarme.js'
import { serveLaDritta, troppoDiFretta, spiegazioneDi, attesaDellEsito, evidenziando, PONDERA }
  from './nucleo/domanda.js'
import { pesoDellaFretta } from './fretta.js'

const props = defineProps({
  domanda: { type: Object, required: true },
  pittori: { type: Object, default: () => ({}) },
  titolo: { type: String, default: '' },
  /* quanto resta a vedere l'esito prima di sparire */
  respiro: { type: Number, default: 1500 },
  /* Da dove viene la domanda: il pacchetto che `scelta.js` ha
     consegnato (`{ modulo, grado, materia, … }`) e il nome del gioco
     che l'ha chiesta. Non servono a mostrarla — la domanda si mette in
     scena benissimo senza — ma a chi la giudica troppo facile o troppo
     difficile: sono le due cose che rendono un giudizio azionabile
     invece che un «una domanda era difficile». Facoltativi: un gioco
     che non li passa mostra la domanda come sempre. */
  origine: { type: Object, default: null },
  gioco: { type: String, default: '' },
  /* ── l'attesa si può accorciare toccandola ──
     L'attesa dopo una risposta resta **quella del gioco**, barra
     compresa: si vede l'esito, si vede quanto manca, e quando la barra
     è piena si prosegue da soli. Cambiarla nel pannello vorrebbe dire
     guardare una messa in scena diversa da quella che riceve il
     bambino, che è esattamente quello che il pannello esiste per
     evitare.

     Questo aggiunge una cosa sola: chi guarda venti domande di fila può
     **toccare la barra** per andare avanti subito, invece di aspettare
     ogni volta. Nei giochi no, e non è una dimenticanza: lì il tocco
     che arriverebbe subito dopo una risposta è quasi sempre il fantasma
     di quello che ha appena risposto, e salterebbe l'esito da solo. */
  saltabile: { type: Boolean, default: false },
})
const emit = defineEmits(['risposto'])
let cieca = 0

const scelto = ref(-1)
const partenza = ref(0)
/* ── la finestra cieca ──
   Una domanda appena comparsa **non si lascia toccare** per un pelo di
   tempo. Non è pignoleria: i giochi che incatenano domande — il
   sotterraneo, il Dungeon, la Corsa, Survivors — la fanno comparire
   *nello stesso punto dello schermo* dove c'era quella di prima, e un
   tocco partito un attimo prima (o il click che il dito si lascia
   dietro, che arriva dopo il `touchend`) atterra sulla risposta nuova e
   la dà a caso. Da fuori si legge «ha premuto anche quella sotto, e me
   l'ha data sbagliata», ed è successo davvero.
   Trecento millisecondi: meno di quanto ci mette chiunque a leggere una
   domanda nuova, più di quanto ci mette un fantasma ad arrivare. */
const CIECA = 320
const pronta = ref(false)
/* Quanto manca alla prossima, per non lasciare l'attesa muta (vedi
   `scegli`): 0 = non si sta aspettando niente. */
const attesa = ref(0)
/* ── la risposta arrivata prima della lettura ──
   `nucleo/domanda.js` dice quanto tempo ci vuole a leggere *questa*
   domanda; sotto quel tempo, e sbagliando, si resta fermi più a lungo e
   la riga sotto lo dice. Non toglie niente di quello che il bambino ha:
   la penalità è il tempo, e il motivo per cui è il tempo sta scritto là.

   **Quanto in più lo decide la raffica** (`quiz/fretta.js`): un secondo
   e mezzo la prima volta, tre la seconda di fila, quattro e mezzo dalla
   terza. Una penalità fissa non funzionava — col pavimento dei quattro
   secondi sotto, un secondo e mezzo sopra si perde: 4,0 contro 5,5 non
   si distingue, e infatti non si distingueva. Il comportamento da
   spegnere non è il tocco affrettato, che capita a chiunque abbia il
   dito già in aria: è la fila di tocchi con cui si fa passare una
   domanda senza guardarla. */
const diFretta = ref(false)
/* Quanto si sta fermi dopo aver risposto lo decide `nucleo/domanda.js`
   (`attesaDellEsito`): un pavimento di quattro secondi dopo uno
   sbaglio, che cresce con le parole da leggere e non supera mai i
   dieci contando la fretta. Il conto sta là e non qui perché è una
   taratura, e una taratura chiusa dentro un `.vue` non la prova
   nessuno. Qui resta la metà che riguarda lo schermo: la barra si
   riempie per tutto il tempo, così l'attesa si vede passare invece di
   sembrare un gioco impuntato. */
/* il timer della prossima domanda e il modo di anticiparlo: non sono
   `ref` perché non si disegnano, e un `ref` che nessuno guarda è solo
   una cosa in più che può restare indietro */
let avanti = null
let salta = null
const tele = ref([])          // i canvas delle risposte disegnate
const teloSoggetto = ref(null)
/* ── LA LENTE ──
   Il disegno del soggetto sta in un riquadro largo al massimo 148 px:
   basta per un orologio, non per una griglia 6×6 con dentro le
   lettere, i numeri e un'emoji per casella — lì una cella è venti
   pixel, e «qual è la casella del cane» diventa una domanda sulla
   vista invece che sulle coordinate. Toccando il disegno si apre
   grande quanto lo schermo, e si chiude toccando ovunque.
   Solo il soggetto: sui tasti delle risposte il tocco È la risposta, e
   un tastino per ingrandire dentro un tasto che risponde è il modo di
   far dare una risposta a caso a chi voleva solo guardare meglio. */
const ingrandito = ref(false)
const teloZoom = ref(null)

const risposte = computed(() => props.domanda.risposte || [])
/* ── la frase col rilievo ──
   Un soggetto scritto può essere una frase con dentro la parola di cui
   si parla — «che parte del discorso è "lo" in questa frase?» — e la
   parola si ritaglia qui. Il taglio sta in `nucleo/domanda.js` perché
   la stessa frase la deve ritagliare uguale anche la scheda in DOM
   puro, e perché una regola dentro un `.vue` non si prova senza un
   browser. Nel dato non c'è nessun HTML: c'è la parola, e il grassetto
   lo mette la messa in scena. */
const frase = computed(() =>
  evidenziando(props.domanda.soggetto?.testo, props.domanda.soggetto?.evidenzia))
/* ═════ QUANTI TASTI IN RIGA, E PERCHÉ NON SI CONTANO I CARATTERI ═════
   Le risposte stanno affiancate finché ci stanno, e quando non ci stanno
   scendono una sotto l'altra. Prima la decisione era **una soglia a
   caratteri** — «se una risposta supera i 13, una colonna sola» — ed era
   cieca due volte.

   Cieca sul tasto: 13 caratteri in **tre** colonne su un telefono da 360
   px sono tre tasti da 90, e «insegniante» non ci sta in nessuno dei
   tre. Cieca sul verso: la griglia era `1fr 1fr 1fr`, ma un `1fr` non
   scende sotto il **min-content** della sua cella, e il min-content di
   un tasto con dentro una parola che non si spezza È quella parola.
   Quindi la colonna non si stringeva: si allargava la griglia, e i tasti
   uscivano di lato dalla carta. Misurato: tre volte «insegniante» in una
   carta larga 308 px fanno una griglia da 309 dentro un posto da 282, e
   il terzo tasto finisce oltre il bordo — cioè fuori dallo schermo di un
   telefono un filo più stretto, o con un carattere di sistema un filo
   più grosso.

   Adesso non c'è nessuna soglia. La fila sa **quanto largo deve poter
   essere un tasto** e ne mette in riga quanti ne stanno, fino a un tetto
   che è quello di sempre: due risposte affiancate, tre in fila, quattro
   a due a due. Quando non ce ne stanno, vanno a capo — e chi resta solo
   sull'ultima riga si prende tutta la larghezza invece di restare un
   mezzo tasto spaiato. La misura si dichiara in `ch`, che è l'unità
   giusta perché quello che deve starci dentro è testo:

     · la **parola più lunga** — quella non si spezza mai, e se non ci
       sta è lei a sfondare;
     · **metà della risposta più lunga** — cioè: una risposta si può
       leggere su due righe, non su cinque.

   Il resto lo fa `min-width: 0` più `overflow-wrap` sul tasto: da lì in
   poi un tasto può stringersi quanto vuole e il testo va a capo invece
   di uscire. Le due cose insieme sono la garanzia — la fila sceglie
   quanti tasti stanno bene in riga, e il tasto non può comunque
   sfondare quello che gli tocca.

   I disegni e le emoji non entrano nel conto: hanno una `max-width`
   loro, e il nome sotto la figura è una didascalia che va a capo da sé. */
const colonne = computed(() => (risposte.value.length === 3 ? 3 : 2))
const minTasto = computed(() => {
  const testi = risposte.value
    .map(r => (r.testo ?? '') + '')
    .filter(t => t.trim().length)
  if (!testi.length) return '0px'
  const parola = Math.max(...testi.flatMap(t => t.split(/\s+/).map(p => p.length)))
  const intera = Math.max(...testi.map(t => t.length))
  /* i 18 px sono il tasto intorno al testo — 8 di imbottitura per lato
     più il bordo — e ci vanno perché la misura è una `flex-basis`, che
     con `box-sizing: border-box` comprende anche quelli: senza, si
     direbbe quanto è larga la parola e non quanto è largo il tasto che
     la deve contenere */
  return `calc(${Math.max(parola, Math.ceil(intera / 2))}ch + 18px)`
})

/* ── LA SPIEGAZIONE È DOPPIA, E LE DUE METÀ RESTANO SEPARATE ──
   `perche` corregge la scelta appena fatta, `comeSiFa` insegna il
   metodo: vedi `nucleo/domanda.js`, che è dove sta la regola. Erano un
   `||` — il primo dei due che ci fosse — e siccome i moduli scritti
   bene hanno tutti e due, l'insegnamento non è mai arrivato a nessuno.
   A schermo vanno su due righe diverse apposta: un bambino deve vedere
   che una dice «ecco perché no» e l'altra «ecco come si fa». */
const spiegazione = computed(() => spiegazioneDi(props.domanda, scelto.value))

/* ── LA SCORCIATOIA, E QUANDO VA DETTA ──
   Una domanda che si può risolvere con una formula porta una `dritta`
   — «6 × 6 = 36: in un quadrato l'area è lato per lato» — e la dritta
   serve a **chi ha risposto giusto contando a dito**: quello lì la
   domanda l'ha saputa, ma per la strada lunga, e nessuno glielo dirà
   mai perché il gioco gli ha detto «Giusto!» ed è andato avanti.
   Quindi: si legge se si è sbagliato, e si legge dopo una risposta
   giusta **solo se è arrivata tardi**. Chi risponde in cinque secondi
   la strada corta ce l'ha già, e fermarlo per spiegargliela sarebbe
   una punizione per aver saputo.
   La soglia e la regola stanno in `nucleo/domanda.js`, pure: qui
   dentro non si potrebbero provare senza un browser. */
const quantoCiHaMesso = ref(0)
const dritta = computed(() => {
  if (scelto.value < 0) return ''
  const giusto = scelto.value === props.domanda.giusta
  return serveLaDritta(props.domanda, { giusto, tempo: quantoCiHaMesso.value })
    ? props.domanda.dritta : ''
})

function classe(i) {
  if (scelto.value < 0) return ''
  if (i === props.domanda.giusta) return 'giusta'
  if (i === scelto.value) return 'sbagliata'
  return 'spenta'
}

function scegli(i) {
  if (scelto.value >= 0 || !pronta.value) return
  scelto.value = i
  const giusto = i === props.domanda.giusta
  const tempo = (performance.now() - partenza.value) / 1000
  quantoCiHaMesso.value = tempo
  /* il ripasso si annota subito, non fra un secondo e mezzo: il gioco
     che sta sotto può chiudere la domanda appena arriva l'evento, e
     una risposta persa perché si è cambiato schermo è una risposta che
     il bambino ha dato e che non conta */
  if (props.origine && props.gioco !== 'prova') {
    annota({ chiave: props.domanda.chiave, giusto, tempo })
    /* e subito dopo si guarda com'è andata **quella tipologia** in
       generale: se è diventata un muro — otto tiri e meno di metà
       giuste — un grande se lo trova scritto nella posta. Non tocca
       niente e non aspetta: vedi `quiz/allarme.js`. */
    guardaComeVa(props.domanda.chiave)
  }
  /* Sbagliando si resta fermi più a lungo, perché c'è da leggere il
     perché. Ma un'attesa che non si vede è **indistinguibile da un gioco
     bloccato** — a un bambino col telefono in mano, due secondi di
     schermata ferma sono un tasto che non funziona, e infatti tocca di
     nuovo, e quel tocco finisce sulla domanda dopo. Per questo l'attesa
     si vede: la riga sotto la carta si riempie, e quando è piena si va
     avanti. È la stessa regola di «un errore non resta muto», applicata
     al tempo che passa. */
  /* indovinando si tira dritto, a meno che non ci sia una scorciatoia
     da leggere: allora si resta quanto basta per leggerla, che è la
     stessa attesa di quando si sbaglia */
  diFretta.value = troppoDiFretta(props.domanda, { giusto, tempo })
  /* il conto della raffica si aggiorna **a ogni risposta**, anche
     quando è stata letta: le risposte giuste sono il modo di uscirne
     (`quiz/fretta.js`, quattro) */
  const penale = pesoDellaFretta(diFretta.value, giusto)
  /* Quanto si sta fermi lo decidono **le righe che restano a schermo**:
     dopo uno sbaglio sono «Era questa», il perché e il come si fa, che
     insieme arrivano a venticinque parole e ogni tanto al doppio.
     «Era questa.» si conta anche lui — sono due parole, ma il conto le
     vuole tutte, se no la stessa funzione direbbe due cose diverse a
     seconda di chi la chiama. */
  const { perche, comeSiFa } = spiegazione.value
  const quanto = attesaDellEsito({
    righe: giusto ? [dritta.value] : ['Era questa.', perche, comeSiFa, dritta.value],
    pavimento: giusto
      ? (dritta.value ? props.respiro + 900 : Math.min(props.respiro, 700))
      : Math.max(PONDERA, props.respiro),
    penale: penale.attesa,
  })
  attesa.value = quanto
  const vaiAvanti = () => emit('risposto', {
    giusto,
    indice: i,
    chiave: props.domanda.chiave,
    tempo,
    /* «ha risposto prima di poterla leggere»: nessun gioco lo usa
       ancora, e sta nell'evento perché il giorno che uno volesse farne
       qualcosa il conto è già fatto qui e non va rifatto in quattro
       posti con quattro soglie diverse */
    diFretta: diFretta.value,
  })
  /* tenuto da parte per chi salta: `clearTimeout` senza questo
     manderebbe l'evento due volte, e il pannello scorrerebbe di due
     domande a ogni tocco */
  avanti = setTimeout(() => { avanti = null; vaiAvanti() }, quanto)
  salta = () => {
    if (!avanti) return
    clearTimeout(avanti)
    avanti = null
    vaiAvanti()
  }
}

/* il tocco che salta l'attesa: vale solo dopo aver risposto, e solo se
   chi ci ha messo la domanda l'ha chiesto */
/* Toccare la barra **accorcia l'attesa**, non aggiunge un evento: chi
   sta sotto riceve `risposto` come sempre, solo prima. Un secondo
   evento sembrava più espressivo e faceva avanzare di due domande per
   volta, perché il pannello ascoltava tutti e due — un difetto che si
   vede solo contando, e infatti l'ha trovato il contatore del giro. */
function saltaAttesa() {
  if (props.saltabile && salta) salta()
}

/* La lente si apre solo a domanda pronta: nei primi millisecondi il
   tocco che arriva è il fantasma di quello di prima (vedi `CIECA`), e
   una lente che si spalanca da sola nasconde la domanda appena
   comparsa. */
async function ingrandisci() {
  if (!pronta.value || !props.domanda.soggetto?.scena) return
  ingrandito.value = true
  await nextTick()
  if (teloZoom.value) dipingi(teloZoom.value, props.pittori, props.domanda.soggetto.scena)
}

/* Quello che si sa di questa domanda **adesso**: il tempo scorre e
   l'esito arriva dopo, quindi non è un oggetto ma una funzione, che i
   tre tasti chiamano nel momento in cui li tocchi. */
const daGiudicare = () => ({
  gioco: props.gioco,
  modulo: props.origine?.modulo || '',
  grado: props.origine?.grado ?? '',
  materia: props.origine?.materia || '',
  chiave: props.domanda.chiave || '',
  testo: props.domanda.testo || '',
  esito: scelto.value < 0 ? 'aperta'
    : scelto.value === props.domanda.giusta ? 'giusta' : 'sbagliata',
  tempo: partenza.value ? (performance.now() - partenza.value) / 1000 : 0,
})

/* ══════════ UNA DOMANDA NUOVA AZZERA TUTTO ══════════
   Questa è la riga che teneva bloccati i giochi, ed è il motivo per cui
   il difetto sembrava un problema di tocchi.

   Chi incatena domande — il sotterraneo, il Dungeon, la Corsa,
   Survivors — passa dalla domanda A alla B **senza mai spegnere il
   `v-if` in mezzo**: succede tutto dentro lo stesso giro di
   aggiornamento, quindi Vue non vede nessun momento in cui la domanda
   non c'è, non smonta niente e **riusa questa stessa istanza**. Con lei
   restano `scelto`, l'esito e i disegni di prima. Da fuori si vede
   esattamente quello che è stato riferito: la domanda nuova compare con
   un tasto **già colorato** — quello nello stesso posto di quello
   premuto un attimo prima, e di solito è «sbagliata» — e poi non va più
   avanti, perché `scegli()` trova una scelta già fatta ed esce senza
   dire niente. Il gioco è fermo per sempre, e senza nessun errore.

   Si azzera qui dentro e non con un `:key` in chi lo monta: la `key` va
   ricordata in ogni gioco, e il quinto gioco che nascerà se la
   dimenticherà come se l'erano dimenticata in quattro su cinque. Il
   contratto sta nel componente.

   I disegni si rifanno per lo stesso motivo, e dopo il layout: prima il
   canvas non sa quanto è largo, e un riquadro dipinto a misura
   sbagliata resta sgranato. */
async function inizia() {
  clearTimeout(cieca)
  scelto.value = -1
  quantoCiHaMesso.value = 0
  attesa.value = 0
  diFretta.value = false
  clearTimeout(avanti)
  avanti = null
  salta = null
  pronta.value = false
  ingrandito.value = false
  partenza.value = performance.now()
  cieca = setTimeout(() => { pronta.value = true }, CIECA)
  await nextTick()
  if (props.domanda.soggetto?.scena && teloSoggetto.value)
    dipingi(teloSoggetto.value, props.pittori, props.domanda.soggetto.scena)
  risposte.value.forEach((r, i) => {
    if (r.scena && tele.value[i]) dipingi(tele.value[i], props.pittori, r.scena)
  })
}

onMounted(inizia)
/* Sull'oggetto, non sulla chiave: due domande di fila possono avere la
   stessa `chiave` (la stessa tabellina chiesta due volte) e restare due
   domande diverse a cui si deve poter rispondere due volte. */
watch(() => props.domanda, inizia)

onUnmounted(() => clearTimeout(cieca))
</script>

<template>
  <div class="qz-velo">
    <div class="qz-carta">
      <!-- la riga in cima porta due cose che non c'entrano fra loro: di
           che materia è la domanda, e i tre tasti per giudicarla. I
           secondi ci sono solo se un grande li ha accesi, e allora la
           riga compare anche senza titolo. -->
      <div v-if="titolo || giudiziAccesi" class="qz-testa">
        <span>{{ titolo }}</span>
        <Giudizio :voce="daGiudicare" />
      </div>
      <div class="qz-consegna">{{ domanda.testo }}</div>

      <div v-if="domanda.soggetto" class="qz-soggetto" :class="{ nominato: domanda.soggetto.nome }">
        <!-- il disegno si tocca e si guarda grande: la lente in un
             angolo è lì per dire che si può, perché un canvas non
             sembra un tasto -->
        <button v-if="domanda.soggetto.scena" type="button" class="qz-guarda"
                aria-label="ingrandisci il disegno" @click="ingrandisci">
          <canvas ref="teloSoggetto" class="qz-telo-grande" />
          <span class="qz-lente" aria-hidden="true">🔍</span>
        </button>
        <span v-else-if="domanda.soggetto.emoji" class="qz-emoji">{{ domanda.soggetto.emoji }}</span>
        <!-- una frase con la parola in rilievo: i tre pezzi stanno
             attaccati apposta, uno spazio in più qui dentro si vedrebbe
             in mezzo alla frase -->
        <span v-else-if="frase.parola" class="qz-frase"
        >{{ frase.prima }}<b class="qz-spicca">{{ frase.parola }}</b>{{ frase.dopo }}</span>
        <span v-else>{{ domanda.soggetto.testo }}</span>
        <span v-if="domanda.soggetto.nome" class="qz-nome grande">{{ domanda.soggetto.nome }}</span>
      </div>

      <div class="qz-risposte"
           :style="{ '--qz-colonne': colonne, '--qz-min': minTasto }">
        <button v-for="(r, i) in risposte" :key="i" type="button"
                class="qz-tasto"
                :class="[classe(i), { emoji: r.emoji !== undefined, nominata: r.nome !== undefined }]"
                @click="scegli(i)">
          <canvas v-if="r.scena" :ref="el => (tele[i] = el)" class="qz-telo" />
          <span v-else-if="r.emoji !== undefined">{{ r.emoji }}</span>
          <template v-else>{{ r.testo }}</template>
          <span v-if="r.nome" class="qz-nome">{{ r.nome }}</span>
        </button>
      </div>

      <!-- l'attesa che si vede: comincia quando si è risposto e finisce
           quando arriva la prossima. Senza, quei due secondi sono un
           gioco fermo. -->
      <div v-if="attesa" class="qz-avanti" :class="{ saltabile }"
           @click="saltaAttesa">
        <i :style="{ animationDuration: attesa + 'ms' }"></i>
      </div>

      <div class="qz-esito">
        <template v-if="scelto >= 0">
          <span v-if="scelto === domanda.giusta" class="bene">Giusto!</span>
          <!-- ── tre righe, tre mestieri ──
               «Era questa» più il perché correggono **questa scelta**;
               «Si fa così» insegna il metodo, ed è l'unica delle tre
               che serve anche la volta dopo; la dritta dice che c'era
               una strada più corta. Messe in un paragrafo unico si
               leggono come una scusa lunga, e il metodo — che è la sola
               parte che vale qualcosa domani — finisce in coda. -->
          <template v-else><span class="male">Era questa.</span> {{ spiegazione.perche }}</template>
          <div v-if="spiegazione.comeSiFa" class="qz-come">
            <b>Si fa così:</b> {{ spiegazione.comeSiFa }}
          </div>
          <div v-if="dritta" class="qz-dritta">💡 {{ dritta }}</div>
          <!-- l'attesa più lunga non resta muta, o è un gioco che si è
               impuntato: si dice cos'è successo e cosa si vuole -->
          <!-- ── una riga, e non le regole del meccanismo ──
               Che l'attesa cresca insistendo, e che per uscirne servano
               quattro risposte giuste, sono cose che non si spiegano: si
               sentono. Quello che va detto è la cosa che il bambino può
               fare adesso — leggere la domanda — e quella sta tutta qui.
               La versione con «ancora 2 risposte giuste e non si aspetta
               più» diceva il vero e chiedeva di studiarsi un
               regolamento, nel momento in cui c'era già una spiegazione
               da leggere sopra. -->
          <div v-if="diFretta" class="qz-fretta">🐢 Troppo di fretta: leggi bene la domanda.</div>
        </template>
      </div>
    </div>

    <!-- ══════════ IL DISEGNO GRANDE, E PERCHÉ ESCE DA QUI ══════════
         Si chiude con un tocco qualunque — sul disegno, sulla consegna,
         sul nero intorno. Chiudere sul `click` e non sul `pointerup`
         non è un dettaglio: col secondo il dito si lascia dietro un
         click che atterrerebbe sul tasto rimasto sotto, e la risposta
         partirebbe da sola.

         Il `Teleport` invece è il rimedio a un guasto riferito da chi
         ci giocava: nel sotterraneo la lente **si apriva a metà
         schermo**, con la caverna che restava a vista sopra. Stava
         dentro il velo della domanda, cioè in fondo al pannello del
         gioco, e da lì un `position: fixed` non vuol dire affatto
         «tutto il telefono»: lo dice l'antenato più vicino che si sia
         dichiarato riferimento. I fogli del sotterraneo entrano in
         scena con una `transform` (`sot-sale`, `sot-cresce`), e una
         `transform` su un antenato **è** quella dichiarazione: la
         lente smetteva di essere lo schermo e diventava il pannello,
         ritagliata dentro il foglio in basso.

         E anche senza nessuna `transform` c'era la seconda metà: lo
         `z-index: 50` si spendeva **dentro** la pila del pannello che
         ospita la domanda (`.sot-foglio` è 10, `.sot-velo` 12), quindi
         qualunque cosa l'applicazione metta più in alto — la barra in
         cima, che è 20 — passava sopra la lente. Misurato: al centro
         della striscia in cima, sotto il dito c'era la barra.

         Appesa al `body` non c'è più niente in mezzo: nessun antenato
         da cui farsi ritagliare, nessuna pila in cui restare
         intrappolata. Il rimedio sta qui e non nei cinque giochi
         perché il difetto non è di un gioco: chi monta una domanda non
         deve sapere che esiste una lente, e finché lo doveva sapere
         bastava una riga di aspetto scritta in un `.css` di gioco per
         spostarla senza che se ne accorgesse nessuno. -->
    <Teleport to="body">
      <div v-if="ingrandito" class="qz-zoom" @click="ingrandito = false">
        <canvas ref="teloZoom" class="qz-telo-zoom" />
        <div class="qz-zoom-testo">{{ domanda.testo }}</div>
        <button type="button" class="qz-zoom-x" aria-label="chiudi">✕</button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.qz-velo {
  /* l'unità di altezza utile: quanto schermo ha davvero questa domanda.
     Chi la apre in un pannello più corto la ridefinisce da fuori. */
  --qz-h: 1vh;
  position: absolute; inset: 0; z-index: 40; display: flex;
  /* `flex-start` più `margin: auto` sulla carta: centrata quando ci
     sta, ma quando è più alta del velo scorre invece di farsi tagliare
     sopra e sotto (con `align-items: center` la cima è irraggiungibile) */
  align-items: flex-start; justify-content: center;
  padding: clamp(6px, calc(2 * var(--qz-h)), 16px);
  overflow-y: auto; overscroll-behavior: contain;
  background: rgba(6, 9, 18, .82); backdrop-filter: blur(3px);
  animation: qz-entra .18s ease;
}
@keyframes qz-entra { from { opacity: 0 } to { opacity: 1 } }
.qz-carta {
  margin: auto;
  width: 100%; max-width: 430px;
  padding: clamp(10px, calc(2 * var(--qz-h)), 20px)
           clamp(12px, 4vw, 18px)
           clamp(10px, calc(1.8 * var(--qz-h)), 18px);
  border-radius: 24px; color: #eaf0ff;
  background: linear-gradient(180deg, #223055 0%, #141c33 100%);
  border: 1px solid rgba(255, 255, 255, .13);
  box-shadow: 0 24px 60px rgba(0, 0, 0, .55);
}
.qz-avanti { height: 3px; border-radius: 999px; background: #ffffff14;
             overflow: hidden; margin-top: 8px }
.qz-avanti i { display: block; height: 100%; width: 0;
               background: linear-gradient(90deg, #ffd58a, #ffb43f);
               animation: qz-riempi linear forwards }
/* mentre si guarda, la barra si può toccare per non aspettare: un filo
   più alta, così il dito la prende */
.qz-avanti.saltabile { height: 7px; padding: 2px 0; background-clip: content-box;
                       cursor: pointer }
@keyframes qz-riempi { to { width: 100% } }

.qz-testa {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  font-size: 12.5px; letter-spacing: .06em; text-transform: uppercase;
  color: #ffd58a; font-weight: 700;
  margin-bottom: clamp(5px, calc(1.2 * var(--qz-h)), 12px);
}
.qz-consegna {
  font-size: clamp(15px, 4.4vw, 20px); font-weight: 650; line-height: 1.3;
  margin-bottom: clamp(7px, calc(1.5 * var(--qz-h)), 14px);
  /* una consegna può arrivare su più righe (le premesse di un
     ragionamento si leggono una alla volta): gli a capo si rispettano */
  white-space: pre-line;
}
.qz-soggetto {
  display: flex; align-items: center; justify-content: center;
  margin-bottom: clamp(8px, calc(1.7 * var(--qz-h)), 16px);
  padding: clamp(7px, calc(1.4 * var(--qz-h)), 14px);
  min-height: clamp(46px, calc(8 * var(--qz-h)), 74px);
  border-radius: 18px; background: rgba(255, 255, 255, .06);
  border: 1px solid rgba(255, 255, 255, .08);
  font-size: clamp(22px, 6vw, 30px); font-weight: 750; text-align: center;
}
/* Il soggetto è **la cosa da guardare**, e per i mazzi dove la figura È
   la domanda — «con che lettera comincia 🐝» — quaranta pixel sono
   pochi: a sei anni si guarda l'immagine, non la si sbircia. Grande
   quanto il riquadro concede, che è la stessa regola del disegno. */
.qz-emoji { font-size: clamp(38px, 11vw, 56px); }
/* ── LA FRASE DA LEGGERE ──
   Il corpo del soggetto è tarato su un'emoji o su una parola sola: sei
   parole a trenta pixel diventano tre righe, e una frase su tre righe
   non si legge, si scorre. Quindi più piccola e meno grassa della
   parola in rilievo, che invece resta grossa — è quella su cui si
   risponde, e deve saltare all'occhio senza doverla cercare.
   Il colore non basta da solo (c'è chi non lo distingue, e ci sono i
   telefoni al sole): sotto la parola c'è anche una riga. */
.qz-frase {
  font-size: clamp(16px, 4.6vw, 22px); font-weight: 600; line-height: 1.4;
}
.qz-spicca {
  color: #ffd58a; font-weight: 800;
  border-bottom: 2px solid #ffb43f; padding-bottom: 1px;
}
.qz-guarda {
  position: relative; display: block; padding: 0; border: 0; cursor: zoom-in;
  background: none; color: inherit; font: inherit; line-height: 0;
}
.qz-guarda:active { transform: scale(.97); }
.qz-lente {
  position: absolute; right: -6px; bottom: -6px;
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; line-height: 1;
  background: #223055; border: 1px solid rgba(255, 255, 255, .22);
  box-shadow: 0 2px 6px rgba(0, 0, 0, .45);
}
.qz-telo-grande {
  width: clamp(76px, calc(17 * var(--qz-h)), 148px);
  height: auto; aspect-ratio: 1;
}
/* ── I TASTI IN RIGA SI CONTANO DA SÉ ──
   Una fila che va a capo, non una griglia a colonne fisse, ed è per una
   ragione sola: **chi resta solo sull'ultima riga si prende tutta la
   larghezza**. Con la griglia le tre risposte dell'ortografia venivano
   due sopra e una sotto larga la metà, spaiata, sotto due tasti uguali;
   qui la terza è un tasto intero e la fila si legge come una scaletta.

   Il conto delle due variabili sta nello script, col perché per esteso:
   `--qz-colonne` è il **tetto** (due, o tre quando le risposte sono
   tre) e `--qz-min` la larghezza sotto la quale un tasto non si
   stringe. La `flex-basis` prende la più grande delle due — la fetta
   che toccherebbe a uno di `--qz-colonne`, oppure la misura del testo
   se è più larga — e da lì in poi decide il ritorno a capo. Il pixel in
   meno serve solo a un arrotondamento: senza, capita di mandare a capo
   l'ultimo tasto proprio quando ci starebbero tutti. */
.qz-risposte {
  --qz-gap: clamp(6px, calc(1.1 * var(--qz-h)), 10px);
  /* il corpo del carattere sta anche qui, e non solo sul tasto: `ch` si
     misura dove la variabile si usa, e con 16 px qui e 19 sul tasto la
     misura sarebbe corta di un quinto proprio sugli schermi larghi */
  font-size: clamp(16px, 4.4vw, 19px);
  display: flex; flex-wrap: wrap; gap: var(--qz-gap);
}
.qz-tasto {
  flex: 1 1 max(var(--qz-min, 0px),
                (100% - (var(--qz-colonne, 2) - 1) * var(--qz-gap))
                  / var(--qz-colonne, 2) - 1px);
  display: flex; align-items: center; justify-content: center;
  /* ── il tasto non sfonda mai il posto che gli tocca ──
     Un elemento flessibile non scende sotto il proprio min-content, e
     il min-content di un tasto è la parola più lunga che ci sta
     dentro: senza queste due righe una risposta come «insegniante»
     allarga il tasto invece di andare a capo, e la fila esce dalla
     carta. `anywhere` e non `break-word` apposta — solo il primo
     abbassa anche il min-content, cioè dice alla fila che quella
     parola, all'occorrenza, si può spezzare. */
  min-width: 0; overflow-wrap: anywhere;
  /* 42px è il dito, non l'estetica: sotto non si scende mai */
  min-height: clamp(42px, calc(7 * var(--qz-h)), 62px);
  padding: clamp(6px, calc(1.1 * var(--qz-h)), 12px) 8px; cursor: pointer;
  border-radius: 16px; border: 1px solid rgba(255, 255, 255, .14);
  background: rgba(255, 255, 255, .075); color: inherit;
  font: inherit; font-size: clamp(16px, 4.4vw, 19px); font-weight: 650;
  text-align: center;
  transition: transform .1s ease, background .12s ease, border-color .12s ease;
}
.qz-tasto.emoji { font-size: clamp(28px, 7.5vw, 40px); }
.qz-telo {
  width: 100%; max-width: clamp(52px, calc(13.5 * var(--qz-h)), 118px);
  aspect-ratio: 1; height: auto;
}
/* LA PAROLA SOTTO LA FIGURA. Un disegno di savana si riconosce molto
   prima di saperlo chiamare, e il nome è lì per la seconda metà: il
   tasto diventa una colonna, figura sopra e parola sotto.

   Il corpo del carattere si dichiara qui e non si eredita, apposta: un
   tasto a emoji ne porta addosso quaranta pixel, e il nome uscirebbe
   grande quanto l'icona — cioè sembrerebbe la risposta invece della
   sua didascalia. */
.qz-tasto.nominata { flex-direction: column; gap: clamp(2px, calc(.6 * var(--qz-h)), 5px); }
.qz-soggetto.nominato { flex-direction: column; gap: clamp(3px, calc(.8 * var(--qz-h)), 7px); }
.qz-nome {
  font-size: clamp(11px, 3.2vw, 14px); font-weight: 650; line-height: 1.2;
  text-align: center; opacity: .93;
}
.qz-nome.grande { font-size: clamp(13px, 3.8vw, 16px); }
.qz-tasto:active { transform: scale(.97); background: rgba(255, 255, 255, .13); }
.qz-tasto.giusta { background: rgba(78, 214, 128, .24); border-color: #4ed680; }
.qz-tasto.sbagliata { background: rgba(255, 105, 105, .2); border-color: #ff6969; }
.qz-tasto.spenta { opacity: .38; }
.qz-esito {
  margin-top: clamp(7px, calc(1.4 * var(--qz-h)), 14px);
  min-height: 20px; font-size: clamp(13px, 3.8vw, 15px);
  line-height: 1.4; color: #b9c6e6;
}
.qz-zoom {
  /* `fixed` e non `absolute`: il velo scorre quando la carta è più alta
     dello schermo, e un absolute scorrerebbe con lui — la lente si
     aprirebbe sopra la testa di chi ha scrollato in fondo. Fissa resta
     dov'è, e **appesa al `body`** (il `Teleport` nel template) è fissa
     rispetto allo schermo e non rispetto al pannello di un gioco: il
     perché per esteso sta lì.

     Lo `z-index` è alto apposta, e la scala è quella
     dell'applicazione: i veli dei giochi stanno fra 5 e 40, quelli di
     casa (le sorprese, il banco di prova, un traguardo) fra 60 e 80.
     Sopra tutti perché la lente è l'ultima cosa chiesta e nessuna di
     quelle deve tagliarla; sotto il 200 del cartello «gira il
     telefono», che vince sempre su tutto.

     `--qz-h` non si eredita più da chi ha aperto la domanda, e va
     bene così: un gioco dichiara quanto schermo ha concesso **alla
     carta**, mentre la lente lo schermo ce l'ha tutto. */
  --qz-h: 1vh;
  position: fixed; inset: 0; z-index: 100; cursor: zoom-out;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: clamp(6px, calc(1.5 * var(--qz-h)), 14px);
  padding: clamp(8px, calc(2 * var(--qz-h)), 18px);
  background: rgba(6, 9, 18, .96);
  animation: qz-entra .14s ease;
  /* così `cqh` qui sotto misura QUESTO riquadro e non la finestra */
  container-type: size;
}
/* Quadrato, e grande quanto il lato corto concede. Due righe e non una:
   la prima misura l'altezza con `--qz-h`, che è quanto il gioco dichiara
   di aver concesso alla domanda; la seconda misura il riquadro vero
   (`cqh`) e vince dove il browser la capisce. Serve tutte e due perché
   `--qz-h` è una dichiarazione e può non combaciare: un disegno più alto
   del riquadro esce sotto, e quello che si perde è metà griglia. */
.qz-telo-zoom {
  width: min(100%, calc(78 * var(--qz-h)));
  width: min(100%, 78cqh);
  height: auto; aspect-ratio: 1;
}
.qz-zoom-testo {
  max-width: 430px; text-align: center; white-space: pre-line;
  font-size: clamp(13px, 3.8vw, 16px); line-height: 1.35; color: #b9c6e6;
}
.qz-zoom-x {
  position: absolute; top: 8px; right: 10px;
  width: 40px; height: 40px; border-radius: 50%; cursor: pointer;
  border: 1px solid rgba(255, 255, 255, .16);
  background: rgba(255, 255, 255, .08); color: #eaf0ff;
  font: inherit; font-size: 18px; line-height: 1;
}
.qz-esito .bene { color: #7ee6a4; font-weight: 700; }
/* la scorciatoia sta su una riga sua, più chiara del perché: è un
   consiglio, non una correzione, e chi ha risposto giusto non deve
   leggerla come un rimprovero */
.qz-dritta {
  margin-top: 4px; color: #ffd79a;
  font-size: clamp(12px, 3.5vw, 14px); line-height: 1.35;
}
.qz-esito .male { color: #ffb0b0; font-weight: 700; }
/* ── COME SI FA ──
   Sta in un riquadro suo, con un filo di colore a sinistra, e le altre
   due righe no: è l'unica che parla del **prossimo** tentativo invece
   che di quello appena andato storto, e a occhio deve staccarsi dal
   rosso della correzione qui sopra e dall'ambra del consiglio qui
   sotto. Azzurro perché i due colori caldi sono già presi, e perché
   qui non c'è niente da rimproverare: si sta spiegando. */
.qz-come {
  margin-top: 6px; padding: 5px 10px 6px;
  border-left: 3px solid #6fc4ff; border-radius: 0 8px 8px 0;
  background: rgba(111, 196, 255, .1); color: #dbeaff;
  font-size: clamp(12.5px, 3.6vw, 14.5px); line-height: 1.4;
}
.qz-come b { color: #8fd0ff; font-weight: 750; }
/* la riga della fretta: dello stesso genere della dritta — un consiglio,
   non un rimprovero — e per questo non è rossa */
.qz-fretta { margin-top: 4px; font-size: 12.5px; color: #ffd9a0; }
</style>

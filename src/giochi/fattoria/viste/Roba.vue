<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL BAULE — L'ELENCO DI TUTTO, NON DI QUELLO CHE POSSIEDI

   Un posto solo dove si guarda «cosa c'è da avere e a che punto sono»,
   invece di un negozio da una parte e una cassapanca dall'altra: sono la
   stessa domanda fatta due volte. Ogni oggetto c'è sempre, e sopra c'è
   scritto o il prezzo o quanti ne hai.

   **Premere è già mettere giù.** Un gesto solo: si preme una cosa e la
   posa comincia — il foglio si toglie di mezzo e l'anteprima è già
   agganciata alla griglia, col suo ingombro vero. Se la cosa è già tua
   esce dal baule, se non lo è la si compra posandola: comprare e
   piazzare erano due gesti diversi, e il primo lasciava il bambino con
   una panchina invisibile in un magazzino che non aveva mai visto.

   Si chiamava «la roba», ed era il nome sbagliato per due motivi: non
   dice niente a un bambino, e detto ad alta voce suona male. «Il baule»
   invece si capisce a quattro anni — è la cassa dove stanno le tue cose,
   e da cui ne escono di nuove.

   ── PERCHÉ È DIVENTATO UNO SCAFFALE ───────────────────────────────
   Perché il catalogo è passato da trenta voci a duecento, e quello che
   reggeva trenta figurine non regge duecento. Tre cose sono cambiate, e
   tutte e tre per lo stesso motivo — **quello che si compra si sceglie
   guardando, non leggendo**:

     · **la figura è grande** e sta su un ripiano, non su un rettangolo
       vuoto. Le cose poggiano tutte sulla stessa riga e sono in scala
       fra loro (`Provino.vue`), quindi in uno scaffale si vede subito
       che una casa è una casa e un fiorellino è un fiorellino. Prima
       ogni pezzo era ingrandito per conto suo e le proporzioni erano a
       caso — quando non sbordava proprio dalla carta.
     · **quello che non ti puoi permettere dice di quanto** («manca
       🪙12») invece di essere solo pallido. È la regola dei tasti spenti
       di tutto il resto del gioco: uno spento senza il perché è uno
       rotto. E quel numero è la cosa che rimanda a fare esercizi, che è
       poi il senso di tutto il posto.
     · **una riga dice cosa c'è in questa linguetta.** Undici linguette
       sono troppe da imparare a memoria, e «Cortile» da solo non dice
       che lì dentro le cose si toccano e fanno qualcosa.

   Quello che invece **non** ci sta è un gettone delle monete: c'era, ed
   era il numero della barra in cima ripetuto trenta pixel più sotto. La
   barra non se ne va quando si apre il baule — il velo copre il gioco,
   non lei — quindi quel gettone costava una riga di scaffale per dire
   una cosa che era già a schermo.

   Non sa niente del profilo né delle monete vere: riceve `monete` e
   `magazzino` e manda fuori `tira`. Chi paga è `Gioco.vue`.
   ═══════════════════════════════════════════════════════════════════ */
import { computed, ref } from 'vue'
import { CATEGORIE } from '../dati/catalogo.js'
import { livelloDellaVoce } from '../dati/livelli.js'
import { IN_VENDITA } from '../dati/animali.js'
import Provino from './Provino.vue'

const props = defineProps({
  monete: { type: Number, default: 0 },
  magazzino: { type: Object, default: () => ({}) },
  bestie: { type: Array, default: () => [] },     // quelle già comprate
  /* `id → quanto costa adesso`, per le poche cose che rincarano a ogni
     copia: il campo. Chi non c'è dentro costa il prezzo di catalogo. Il
     conto è del motore (`quantoCosta`), qui si mostra e non si decide —
     la stessa divisione della ciotola e dei cartelli del bosco. */
  prezzi: { type: Object, default: () => ({}) },
  /* L'id della voce su cui aprirsi, se il baule è stato aperto da un
     consiglio («ti serve un campo»). Vuoto vuol dire: apriti dove ti
     apri sempre. */
  punta: { type: String, default: '' },
  /* Il livello della fattoria: quello che non è ancora arrivato **non
     sta qui**. Una voce spenta dentro un negozio è un tasto rotto — chi
     la vede prova a premerla e non succede niente — mentre la stessa
     voce dentro la pagina dei livelli, con scritto «al livello 4», è
     una cosa da desiderare. Il perché per esteso sta in
     `dati/livelli.js`. */
  livello: { type: Number, default: 99 },
  /* Gli id delle cose **uniche già in mappa** — i due silos. Un secondo
     silo dello stesso tipo non si può posare (il motore risponde
     «ne-hai-gia»), e una voce che non si può prendere è un tasto rotto:
     sparisce dallo scaffale, come sparisce quello che il livello non ha
     ancora aperto. Il conto lo fa il motore, che è l'unico a sapere
     cosa c'è in mappa; qui si mostra e non si decide. */
  posati: { type: Array, default: () => [] },
})
const emit = defineEmits(['tira', 'tiraBestia', 'chiudi'])

/* Gli animali si prendono come le altre cose — anche una bestia si posa
   dove vuoi tu, ed è così che finisce dentro un recinto — ma passano da
   un'uscita loro: prima di comparire chiedono un nome. */
const ANIMALI = 'animali'

/* ── LE TRE METÀ DEL BAULE ────────────────────────────────────────
   Duecento voci in undici linguette, e la carriola fiorita in mezzo al
   pollaio: chi cerca il mulino passava in rassegna il vivaio. Adesso in
   cima si sceglie **di cosa si sta parlando**, e le tre risposte sono
   tre modi diversi di spendere:

     🌾 **La fattoria** — quello che *fa* qualcosa: campi, macchine,
        silos, i recinti. Una linguetta sola, quindi non se ne mostra
        nessuna.
     🌸 **Decorazioni** — quello che sta lì e basta: alberi, fiori,
        panchine, laghetti, case.
     🐕 **Animali** — le bestie di casa, che si comprano e chiedono un
        nome.

   *Ribalta la divisione di prima*, che erano due metà con gli animali
   dentro «la fattoria», come una linguetta accanto ai recinti. Due
   difetti: le bestie non producono niente — stare nella metà di quello
   che lavora era una bugia — e sotto «la fattoria» finivano tre
   linguette (campi, cortile, animali) dove adesso ce n'è **una sola**,
   cioè nessuna scelta da fare. Meno sottogruppi, e le unità
   produttive tutte insieme.

   Si chiamava «Il bello», che è vero ma non è una parola che un bambino
   userebbe cercando una panchina. «Decorazioni» sì. */
const ZONE = [
  { chiave: 'lavoro', nome: 'La fattoria', icona: '🌾' },
  { chiave: 'bello', nome: 'Decorazioni', icona: '🌸' },
  { chiave: ANIMALI, nome: 'Animali', icona: '🐕' },
]
/* Il granaio **non è più una linguetta**, ed era: stava qui perché
   «cosa ho» è una domanda sola e il baule è il posto dove si va a farla.
   Sbagliato per due motivi. Finiva in mezzo alle cose da **comprare**,
   ed era l'unica che si guardava e basta; e faceva sembrare le scorte
   una schermata del gioco invece del contenuto di una cosa costruita.
   Adesso si tocca un silo — vedi `viste/Granaio.vue`. */

/* Una riga sotto il titolo per ogni linguetta. Non è decorazione: dice
   *cosa ci si fa* con la roba che c'è lì sotto, che è la sola cosa che
   una griglia di figurine non riesce a dire da sola. */
const DICE = {
  verde: 'Alberi, cespugli e sassi, ma dove vuoi tu.',
  fiori: 'Vasi e fioriere. I fiori piccoli si posano anche sull\'erba.',
  campi: 'La catena, in fila: il campo, i silos, il mulino, il fienile, i recinti.',
  bestiole: 'Cucce, nidi e bestioline. Stanno lì e basta, ma fanno compagnia.',
  raccolto: 'Cassette, ceste e balle di fieno: quello che viene dai campi.',
  acqua: 'Fontane, pozzi e laghetti. La fontana si muove da sola.',
  recinti: 'Per chiudere un pezzo di prato. Una bestia dentro ci resta.',
  case: 'Le cose grandi: costano tanto e si vedono da lontano.',
  arredo: 'Panchine, tavoli e lampioni, da sedersi e da guardare.',
}

/* ── APERTO SU UNA COSA PRECISA ───────────────────────────────────
   `punta` è l'id di una voce, e arriva da chi ha appena detto «ti serve
   un campo»: il baule si apre **dove quella cosa è**, metà giusta e
   linguetta giusta, con la voce accesa. Senza, il consiglio finiva in un
   baule di duecento cose aperto sulla prima linguetta, e trovare il
   campo restava un compito — che è esattamente quello che il consiglio
   doveva togliere di mezzo. */
const laCategoriaDi = id => (CATEGORIE.find(c => c.voci.some(v => v.id === id)) || null)
const suPunta = CATEGORIE.length ? laCategoriaDi(props.punta) : null

const zona = ref(suPunta ? (suPunta.zona || 'bello') : 'lavoro')
const categoria = ref(suPunta ? suPunta.chiave : CATEGORIE[0].chiave)
/* La linguetta aperta dev'essere una di quelle che ci sono **in questa
   metà**: cambiando metà, o al primo livello dove ce n'è una sola, una
   `ref` che punta altrove mostrerebbe uno scaffale vuoto. */
const scheda = computed(() =>
  schede.value.some(s => s.chiave === categoria.value)
    ? categoria.value : (schede.value[0] || {}).chiave)
/* Le bestie arrivate. Quelle che non lo sono non stanno qui per lo
   stesso motivo delle cose: si guardano nella pagina dei livelli. Sta
   **sopra** a chi la legge: `zone` la usa, e una `computed` dichiarata
   dopo quella che la chiama è una zona morta che aspetta il giorno in
   cui qualcuno legge `zone` durante il setup. */
const inVendita = computed(() => IN_VENDITA.filter(a => (a.liv || 1) <= props.livello))

/* Una metà senza niente dentro non si mostra: al primo livello le
   decorazioni non ci sono ancora e gli animali nemmeno, e un tasto che
   si apre su niente è un tasto rotto. Gli animali non hanno linguette,
   quindi si guarda direttamente se ce n'è uno in vendita. */
const zone = computed(() => ZONE.filter(z => z.chiave === ANIMALI
  ? inVendita.value.length : schedeDi(z.chiave).length))
const quantiNe = id => props.magazzino[id] || 0
const eMia = chi => props.bestie.some(b => (b.chi || b) === chi)

/* Quello che il livello ha già aperto e che si può ancora prendere.
   Una cosa unica già posata esce di scena; se invece è **nel baule** —
   comprata e non ancora messa giù — resta, o non ci sarebbe più modo di
   tirarla fuori. */
const vociDi = chiave => {
  const c = CATEGORIE.find(c => c.chiave === chiave)
  if (!c) return []
  return c.voci.filter(v => livelloDellaVoce(v) <= props.livello
    && !(v.unico && props.posati.includes(v.id) && !quantiNe(v.id)))
}

const schedeDi = quale => quale === ANIMALI ? []
  : CATEGORIE.filter(c => (c.zona || 'bello') === quale && vociDi(c.chiave).length)
const schede = computed(() => schedeDi(zona.value))

const costa = v => props.prezzi[v.id] ?? v.prezzo
/* Quanto manca per potersela permettere: zero vuol dire che si può. È
   il numero che sta al posto del tasto spento senza perché. */
const manca = v => Math.max(0, costa(v) - props.monete)

/* Premere **è** cominciare a posare: non si aspetta che il dito si
   sposti, perché quell'attesa era un gesto da imparare e nessuno l'ha
   imparato da solo. Chi si è appoggiato per sbaglio non ha comprato
   niente: la cosa resta appesa al dito e si posa dove la si vuole (o non
   si posa affatto, se la si lascia dove non ci sta). */
function giu(e, v) {
  if (!quantiNe(v.id) && manca(v)) return
  emit('tira', { voce: v, x: e.clientX, y: e.clientY })
}

function giuBestia(e, a) {
  if (eMia(a.chi) || a.prezzo > props.monete) return
  emit('tiraBestia', { bestia: a, x: e.clientX, y: e.clientY })
}
</script>

<template>
  <div class="fa-baule">
    <h2>Il baule</h2>

    <nav v-if="zone.length > 1" class="fa-zone">
      <button v-for="z in zone" :key="z.chiave"
              :class="['fa-zona', { viva: z.chiave === zona }]"
              @click="zona = z.chiave">
        <b>{{ z.icona }}</b> {{ z.nome }}</button>
    </nav>

    <!-- Le linguette compaiono **solo se sono più di una**: sotto «la
         fattoria» ce n'è una sola, e un tasto che non ha alternative
         non è una scelta — è una riga di schermo che dice il nome di
         quello che si sta già guardando. -->
    <nav v-if="schede.length > 1" class="fa-schede">
      <button v-for="c in schede" :key="c.chiave"
              :class="['fa-scheda', { viva: c.chiave === scheda }]"
              @click="categoria = c.chiave">
        <b>{{ c.icona }}</b><span>{{ c.nome }}</span></button>
    </nav>

    <p v-if="zona === 'animali'" class="fa-dice">Premi un animale e
       scegli <b>dove farlo arrivare</b>: poi gli dai un nome. Dentro un
       recinto ci resta.</p>
    <p v-else class="fa-dice">{{ DICE[scheda] || 'Premi una cosa e scegli dove metterla.' }}</p>

    <!-- `bestie` sono i record salvati (`{ chi, nome, … }`), non i nomi
         degli sprite: cercarci dentro una stringa non trovava mai
         niente, e un cane già comprato restava in vendita col suo
         prezzo. -->
    <div v-if="zona === 'animali'" class="fa-scaffale">
      <div v-for="a in inVendita" :key="a.chi"
           :class="['fa-voce', { presa: eMia(a.chi),
                                 cara: !eMia(a.chi) && a.prezzo > monete }]"
           @pointerdown="giuBestia($event, a)">
        <!-- il ripiano delle bestie è più alto degli altri: un cane è
             uno sprite 16×32, e in un riquadro da 54 l'ingrandimento
             intero che ci sta è ×1 — cioè la metà del posto sprecata.
             A 68 ci sta il ×2, e mezzo pixel di pixel art non esiste. -->
        <span class="fa-ripiano alto"><Provino :pezzo="a.chi + '_giu0'" :lato="68" /></span>
        <span class="fa-nome">{{ a.nome }}</span>
        <span v-if="eMia(a.chi)" class="fa-prezzo tuo">è tua</span>
        <span v-else-if="a.prezzo > monete" class="fa-prezzo manca">
          manca 🪙{{ a.prezzo - monete }}</span>
        <span v-else class="fa-prezzo">🪙{{ a.prezzo }}</span>
      </div>
    </div>

    <div v-else class="fa-scaffale">
      <div v-for="v in vociDi(scheda)" :key="v.id"
           :class="['fa-voce', { tua: quantiNe(v.id),
                                 cara: !quantiNe(v.id) && manca(v),
                                 indicata: v.id === punta,
                                 lavora: v.campo || v.macchina || v.silo }]"
           @pointerdown="giu($event, v)">
        <span class="fa-ripiano"><Provino :pezzo="v.pezzo" :lato="54" /></span>
        <span class="fa-nome">{{ v.nome }}</span>
        <span v-if="quantiNe(v.id)" class="fa-prezzo tuo">×{{ quantiNe(v.id) }}</span>
        <span v-else-if="manca(v)" class="fa-prezzo manca">manca 🪙{{ manca(v) }}</span>
        <span v-else class="fa-prezzo">🪙{{ costa(v) }}</span>
      </div>
    </div>

    <div class="fa-fila"><button class="fa-bot" @click="emit('chiudi')">Chiudi</button></div>
  </div>
</template>

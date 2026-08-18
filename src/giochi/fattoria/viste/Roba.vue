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
import { IN_VENDITA } from '../dati/animali.js'
import Provino from './Provino.vue'

const props = defineProps({
  monete: { type: Number, default: 0 },
  magazzino: { type: Object, default: () => ({}) },
  bestie: { type: Array, default: () => [] },     // quelle già comprate
  coltivazione: { type: Boolean, default: true }, // la variante dei genitori
})
const emit = defineEmits(['tira', 'tiraBestia', 'chiudi'])

/* Gli animali stanno nella stessa modale ma in una linguetta a parte.
   Si prendono come le altre cose — anche una bestia si posa dove vuoi
   tu, ed è così che finisce dentro un recinto — ma passano da un'uscita
   loro: prima di comparire chiedono un nome. */
const BESTIARIO = { chiave: 'animali', nome: 'Animali', icona: '🐕' }
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
  campi: 'Le quattro cose che lavorano. Il silo tiene il raccolto: toccalo per vederlo.',
  cortile: 'I recinti si toccano: dai da mangiare, e ti danno qualcosa.',
  bestiole: 'Cucce, nidi e bestioline. Stanno lì e basta, ma fanno compagnia.',
  raccolto: 'Cassette, ceste e balle di fieno: quello che viene dai campi.',
  acqua: 'Fontane, pozzi e laghetti. La fontana si muove da sola.',
  recinti: 'Per chiudere un pezzo di prato. Una bestia dentro ci resta.',
  case: 'Le cose grandi: costano tanto e si vedono da lontano.',
  arredo: 'Panchine, tavoli e lampioni, da sedersi e da guardare.',
}

const categoria = ref(CATEGORIE[0].chiave)
const quantiNe = id => props.magazzino[id] || 0
const eMia = chi => props.bestie.some(b => (b.chi || b) === chi)

/* A coltivazione spenta il baule non vende mulini, silos né recinti e
   non mostra il granaio: sarebbero cose che non fanno niente. Il campo
   invece **resta in vendita** — era già un orto prima che si potesse
   seminare, e togliere una voce di catalogo vorrebbe dire far sparire
   dal baule quello che qualcuno ha già comprato. */
const vociDi = chiave => {
  const c = CATEGORIE.find(c => c.chiave === chiave)
  if (!c) return []
  return props.coltivazione ? c.voci : c.voci.filter(v => !v.macchina && !v.silo)
}

const schede = computed(() =>
  [...CATEGORIE.filter(c => props.coltivazione || vociDi(c.chiave).length), BESTIARIO])

/* Quanto manca per potersela permettere: zero vuol dire che si può. È
   il numero che sta al posto del tasto spento senza perché. */
const manca = v => Math.max(0, v.prezzo - props.monete)

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

    <nav class="fa-schede">
      <button v-for="c in schede" :key="c.chiave"
              :class="['fa-scheda', { viva: c.chiave === categoria }]"
              @click="categoria = c.chiave">
        <b>{{ c.icona }}</b><span>{{ c.nome }}</span></button>
    </nav>

    <p v-if="categoria === 'animali'" class="fa-dice">Premi un animale e
       scegli <b>dove farlo arrivare</b>: poi gli dai un nome. Dentro un
       recinto ci resta.</p>
    <p v-else class="fa-dice">{{ DICE[categoria] || 'Premi una cosa e scegli dove metterla.' }}</p>

    <!-- `bestie` sono i record salvati (`{ chi, nome, … }`), non i nomi
         degli sprite: cercarci dentro una stringa non trovava mai
         niente, e un cane già comprato restava in vendita col suo
         prezzo. -->
    <div v-if="categoria === 'animali'" class="fa-scaffale">
      <div v-for="a in IN_VENDITA" :key="a.chi"
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
      <div v-for="v in vociDi(categoria)" :key="v.id"
           :class="['fa-voce', { tua: quantiNe(v.id),
                                 cara: !quantiNe(v.id) && manca(v),
                                 lavora: v.campo || v.macchina || v.silo }]"
           @pointerdown="giu($event, v)">
        <span class="fa-ripiano"><Provino :pezzo="v.pezzo" :lato="54" /></span>
        <span class="fa-nome">{{ v.nome }}</span>
        <span v-if="quantiNe(v.id)" class="fa-prezzo tuo">×{{ quantiNe(v.id) }}</span>
        <span v-else-if="manca(v)" class="fa-prezzo manca">manca 🪙{{ manca(v) }}</span>
        <span v-else class="fa-prezzo">🪙{{ v.prezzo }}</span>
      </div>
    </div>

    <div class="fa-fila"><button class="fa-bot" @click="emit('chiudi')">Chiudi</button></div>
  </div>
</template>

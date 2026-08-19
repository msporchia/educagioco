<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LE MACCHINE: LA ROBA DEL GRANAIO CHE DIVENTA UN'ALTRA ROBA

   Stessa forma di `Campo.vue` e per la stessa ragione: si tocca una cosa
   propria e si vede cosa ci si può fare. Tre stati — ferma (cosa faccio),
   sta lavorando (quanto manca), pronto (ritira) — e i costi a schermo
   prima di premere.

   ── PERCHÉ UNA MACCHINA E NON UN TASTO IN UN MENÙ ─────────────────
   Perché è **una cosa che si compra e si mette dove si vuole**, e costa
   più di trenta pappe: è lì il money pit della catena. Un tasto «macina»
   nascosto in un pannello sarebbe gratis, e la fattoria smetterebbe di
   essere il posto dove si spendono le monete guadagnate altrove.

   ── E UN RECINTO È UNA MACCHINA ANCHE LUI ─────────────────────────
   Stessi verbi, stesso pannello: dài da mangiare, aspetti, ritiri. Le
   uniche due cose che cambiano sono il **nome** — che arriva dal
   catalogo, perché un foglio che dice «Il mulino» sopra un pollaio è la
   cosa che fa smettere di credere a quello che c'è scritto — e le
   parole, che con degli animali dentro non possono essere quelle di un
   macinino. Non è un secondo pannello: è lo stesso, che sa di chi sta
   parlando.

   ── COSA MANCA SI DICE COL NUMERO ─────────────────────────────────
   Un tasto spento senza il perché è un tasto rotto. Qui il perché è
   sempre un numero — «ti serve 1 🌾 in più» — e lo calcola il motore
   (`cheMancaPer`), non questo file: la stessa divisione della ciotola,
   dove il prezzo si mostra e non si decide.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { PRODOTTI } from '../dati/coltivazioni.js'
import Merce from './Merce.vue'
import Passo from './Passo.vue'

const props = defineProps({
  /* quello che torna da `Fattoria.statoMacchina()` */
  stato: { type: Object, required: true },
  nome: { type: String, default: 'La macchina' },
  /* se là dentro ci sono degli animali: cambia solo come si dicono le
     cose, mai cosa fanno i tasti */
  bestie: { type: Boolean, default: false },
  /* le ricette di questa macchina, ognuna già con quello che le manca
     **e dove andarlo a prendere**:
     `{ ricetta, manca: [{ prodotto, quanti }], monete, passo }` */
  /* `{ ricetta, manca, monete, passo, hai }` — `hai` è quanto se ne ha
     già, di quello che entra e di quello che esce. Non risponde a
     «posso?» (a quello rispondono il tasto spento e il numero che
     manca) ma a **«mi serve?»**, che è la domanda vera davanti a una
     macchina con quattro ricette. */
  ricette: { type: Array, default: () => [] },
  ciSta: { type: Number, default: 99 },
  /* dove finisce quello che esce di qui: come si chiama, se c'è, e
     quanto costa. Un «metti un silo» che non dice quale manda a
     comprare quello sbagliato, e sono 120 monete. */
  silo: { type: String, default: 'silo' },
  senzaSilo: { type: Boolean, default: false },
  prezzoSilo: { type: Number, default: 0 },
  /* Il prossimo passo quando quello che è pronto non ha dove andare */
  passo: { type: Object, default: null },
})
const emit = defineEmits(['avvia', 'ritira', 'chiudi', 'passo'])

const r = computed(() => props.stato.ricetta)
const pieno = computed(() => !props.stato.ferma && props.stato.pronto &&
                            props.ciSta < (r.value ? r.value.resa : 0))
const prodotto = k => PRODOTTI[k] || { nome: k, emoji: '📦' }
const puo = v => !v.manca.length && !v.monete

/* ── LE CASELLE ───────────────────────────────────────────────────
   *Ribalta il disegno di prima*, che era «3 → 2»: due numeri e una
   freccia, cioè una formula. Una formula si legge, e leggere è
   esattamente quello che qui non si può dare per scontato.

   Adesso quello che serve è **una casella per pezzo**, e le caselle si
   accendono per quante ne hai: quattro caselle di foraggio, due accese,
   e non c'è niente da contare né da sottrarre — si vede il buco. È la
   stessa cosa che fanno i cuori nei giochi, ed è il motivo per cui
   funzionano a quattro anni.

   Una ricetta con due ingredienti diversi mette i due gruppi in fila.
   Oggi non ce n'è nessuna, ma il conto non lo sa e non deve saperlo. */
const caselle = v => Object.entries(v.ricetta.prende).flatMap(([k, n]) =>
  Array.from({ length: n }, (_, i) => ({ prodotto: k, i, piena: i < (v.hai[k] || 0) })))
</script>

<template>
  <div class="fa-foglio">
    <h2>{{ nome }}</h2>

    <!-- ── ferma: cosa faccio ── -->
    <template v-if="stato.ferma">
      <p v-if="bestie">Hanno fame. Dai loro il mangime che hai
         preparato, e dopo un po' ti danno qualcosa in cambio.</p>
      <p v-else>Metti dentro quello che hai raccolto e ne esce da
         mangiare per i tuoi animali.</p>
      <!-- ── LA RICETTA SI LEGGE COME UNA FRECCIA ──
           Quello che entra, quello che esce, e sotto il conto. Le figure
           sono quelle vere dell'atlante e sono grandi il doppio delle
           emoji di prima: un tasto di una macchina è il posto in cui si
           impara la catena, e a dodici pixel il grano e il mais sono la
           stessa macchia gialla. -->
      <div class="fa-ricette">
        <button v-for="v in ricette" :key="v.ricetta.id"
                :class="['fa-ricetta', puo(v) ? 'suo' : 'altrui']"
                :disabled="!puo(v)" @click="emit('avvia', v.ricetta)">
          <span class="fa-caselle">
            <span v-for="(q, i) in caselle(v)" :key="i"
                  :class="['fa-casella', { piena: q.piena }]">
              <Merce :merce="q.prodotto" :lato="26" />
            </span>
          </span>
          <span class="fa-esce">
            <b>→</b>
            <Merce :merce="v.ricetta.da" :lato="26" />
            <span class="fa-titolo">{{ v.ricetta.resa }} {{ v.ricetta.nome.toLowerCase() }}</span>
          </span>
          <em>ne hai {{ v.hai[v.ricetta.da] }}{{ v.ricetta.costo ? ' · 🪙' + v.ricetta.costo : ''
                }} · {{ v.ricetta.minuti }} min</em>
        </button>
      </div>
      <!-- Quello che manca, e **dove andarlo a prendere**. Il consiglio
           arriva già deciso dal motore (`motore/consiglio.js`) e risale
           la catena da solo: se manca il grano e i campi sono tutti
           occupati, il tasto propone di farne un altro invece di
           lasciare fermi davanti a un elenco di ingredienti. -->
      <!-- ── QUELLO CHE MANCA SI DICE COL SUO NOME E LA SUA FACCIA ──
           Diceva «ti serve ancora 4 🥬» sotto un tasto che mostrava una
           balla di fieno: la stessa merce, un'emoji sopra e un disegno
           sotto, e a schermo sembravano due cose diverse — «non si
           capisce cosa siano». L'emoji resta buona dove non c'è nessun
           disegno accanto a contraddirla (i cartelli, i consigli); qui
           accanto c'è, quindi si mette **quello vero**, e il nome
           scritto per esteso perché una figura da venti pixel dentro
           una frase si guarda ma non si legge. -->
      <template v-for="v in ricette.filter(v => !puo(v))" :key="v.ricetta.id">
        <p class="fa-piccolo fa-manca">
          <span>Per {{ v.ricetta.nome.toLowerCase() }} ti
            {{ v.manca.length + (v.monete ? 1 : 0) > 1 ? 'servono ancora' : 'serve ancora' }}</span>
          <b v-for="m in v.manca" :key="m.prodotto">{{ m.quanti }}
            <Merce :merce="m.prodotto" :lato="20" />
            {{ prodotto(m.prodotto).nome.toLowerCase() }}</b>
          <b v-if="v.monete">🪙{{ v.monete }}</b>
        </p>
        <Passo :passo="v.passo" @fai="a => emit('passo', a)" />
      </template>
    </template>

    <!-- ── sta lavorando ── -->
    <template v-else-if="!stato.pronto">
      <p>{{ bestie ? 'Ci stanno pensando' : 'Sta lavorando' }}. Finisce fra
         <b>{{ stato.manca }} {{ stato.manca === 1 ? 'minuto' : 'minuti' }}</b>.</p>
      <div class="fa-bisogni">
        <div class="fa-bisogno">
          <Merce :merce="r.da" :lato="26" />
          <span class="fa-livello">
            <i :style="{ width: Math.round(stato.quanto * 100) + '%', background: '#e0a33c' }"></i>
          </span>
          <em>{{ Math.round(stato.quanto * 100) }}%</em>
        </div>
      </div>
      <p class="fa-piccolo">Va avanti anche a gioco chiuso, e quando ha
         finito ti aspetta.</p>
    </template>

    <!-- ── pronto ── -->
    <template v-else>
      <p class="fa-pronto"><Merce :merce="r.da" :lato="48" />
         <b>È pronto!</b> Ci sono
         {{ r.resa }} {{ prodotto(r.da).nome.toLowerCase() }} da portare via.
         Ritirare non costa niente.</p>
      <p v-if="pieno && senzaSilo" class="fa-piccolo">Non hai ancora il
         <b>{{ silo.toLowerCase() }}</b> (🪙{{ prezzoSilo }}): senza, non c'è
         dove metterlo. Non si butta via niente.</p>
      <template v-else-if="pieno">
        <p class="fa-piccolo">Ti aspetta lì: non si butta via niente.</p>
        <Passo :passo="passo" @fai="a => emit('passo', a)" />
      </template>
    </template>

    <div class="fa-fila">
      <button class="fa-bot piano" @click="emit('chiudi')">Chiudi</button>
      <button v-if="!stato.ferma && stato.pronto" class="fa-bot forte"
              :disabled="pieno" @click="emit('ritira')">Ritira</button>
    </div>
  </div>
</template>

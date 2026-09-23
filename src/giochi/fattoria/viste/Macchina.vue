<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LE MACCHINE: LA ROBA DEL GRANAIO CHE DIVENTA UN'ALTRA ROBA

   Stessa forma di `Campo.vue` e per la stessa ragione: si tocca una cosa
   propria e si vede cosa ci si può fare. In cima **la fila**, sotto le
   ricette da metterci, in fondo il ritiro — e i costi a schermo prima
   di premere.

   ── LA FILA SI GUARDA, NON SI LEGGE ───────────────────────────────
   Una casella per posto (`dati/coda.js`), come le caselle di una
   ricetta: quella che lavora con la sua barra, quelle che aspettano con
   la ✕ per toglierle (e rendono tutto), le pronte col ✓, e i posti
   vuoti col ＋. Tre posti pieni e tre vuoti non si contano: si vede il
   buco. Il ＋ mette in fila **solo quando non c'è niente da scegliere**
   — la ricetta dell'ultimo pezzo, o l'unica che si può fare — se no
   sarebbe un tasto che decide al posto di chi preme; negli altri casi
   è un posto vuoto e basta, e si sceglie dalle ricette qui sotto.

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
import Chiudi from './Chiudi.vue'

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
  /* quanti dei pezzi pronti **entrano adesso** nel silo, e quale merce
     è rimasta fuori per prima (vuoto: nessuna) */
  siRitira: { type: Number, default: 0 },
  nonCiSta: { type: String, default: '' },
  /* dove finisce quello che è rimasto fuori: come si chiama, se c'è, e
     quanto costa. Un «metti un silo» che non dice quale manda a
     comprare quello sbagliato, e sono 120 monete. */
  silo: { type: String, default: 'silo' },
  senzaSilo: { type: Boolean, default: false },
  prezzoSilo: { type: Number, default: 0 },
  /* Il prossimo passo quando quello che è pronto non ha dove andare */
  passo: { type: Object, default: null },
})
const emit = defineEmits(['avvia', 'ritira', 'togli', 'ingrandisci', 'chiudi', 'passo',
                         'albero'])

const prodotto = k => PRODOTTI[k] || { nome: k, emoji: '📦' }
const puo = v => !v.manca.length && !v.monete

/* I posti della fila, pieni e vuoti, nell'ordine in cui escono. */
const posti = computed(() => {
  const coda = props.stato.coda || []
  return [...coda, ...Array.from({ length: props.stato.liberi || 0 }, () => null)]
})

/* Cosa mette in fila il ＋, se c'è una risposta sola: la ricetta
   dell'ultimo pezzo messo, se si può rifare, o l'unica che si può fare.
   Due o più possibili e nessun ultimo: il ＋ non sceglie. */
const ancora = computed(() => {
  const coda = props.stato.coda || []
  const ultima = coda.length ? coda[coda.length - 1].ricetta.id : null
  const buone = props.ricette.filter(puo)
  return buone.find(v => v.ricetta.id === ultima) || (buone.length === 1 ? buone[0] : null)
})

/* la faccia grande del ritiro: il primo pezzo pronto, che è il primo
   che esce — non quello che lavora, che può essere un'altra cosa */
const primoPronto = computed(() => (props.stato.coda || []).find(p => p.pronto) || null)

const minuti = n => `${n} ${n === 1 ? 'minuto' : 'minuti'}`

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
    <Chiudi @chiudi="$emit('chiudi')" />
    <h2>{{ nome }}</h2>

    <p v-if="stato.ferma && bestie">Hanno fame. Dai loro il mangime che hai
       preparato, e dopo un po' ti danno qualcosa in cambio.</p>
    <p v-else-if="stato.ferma">Metti dentro quello che hai raccolto e ne esce da
       mangiare per i tuoi animali. <b>Scegli cosa preparare.</b></p>
    <p v-else-if="stato.lavora">{{ bestie ? 'Ci stanno pensando' : 'Sta lavorando' }}:
       il prossimo è pronto fra <b>{{ minuti(stato.manca) }}</b>.
       <span v-if="stato.liberi">Puoi metterne altri in fila.</span></p>

    <!-- ── LA FILA ── -->
    <div class="fa-fila-posti" data-fila>
      <template v-for="(p, i) in posti" :key="p ? 'p' + p.i : 'v' + i">
        <div v-if="p" :class="['fa-posto', { lavora: p.lavora, pronto: p.pronto }]"
             :data-fila-posto="p.i">
          <Merce :merce="p.ricetta.da" :lato="30" />
          <span v-if="p.lavora" class="fa-livello">
            <i :style="{ width: Math.round(p.quanto * 100) + '%', background: '#e0a33c' }"></i>
          </span>
          <em v-if="p.pronto">✓</em>
          <em v-else-if="p.lavora">{{ p.manca }} min</em>
          <em v-else>⏳ {{ p.manca }} min</em>
          <!-- In fila e non partito: si toglie, e rende tutto. Quello
               che lavora no — è già dentro — e quello pronto si ritira. -->
          <button v-if="p.aspetta" type="button" class="fa-posto-via"
                  :data-fila-togli="p.i" aria-label="togli dalla fila"
                  @click="emit('togli', p.i)">✕</button>
        </div>
        <button v-else-if="ancora" type="button" class="fa-posto vuoto suo"
                data-fila-aggiungi @click="emit('avvia', ancora.ricetta)">
          <b>＋</b><Merce :merce="ancora.ricetta.da" :lato="18" />
        </button>
        <div v-else class="fa-posto vuoto"><b>＋</b></div>
      </template>
      <!-- Allungare la fila: il prezzo sta sul tasto, e al tetto il tasto
           non c'è più. -->
      <button v-if="stato.prezzoFila" type="button" class="fa-posto-piu"
              data-fila-ingrandisci @click="emit('ingrandisci')">
        +1 posto<br><b>🪙{{ stato.prezzoFila }}</b>
      </button>
    </div>

    <!-- ── pronti: si ritira quello che ci sta ── -->
    <template v-if="primoPronto">
      <!-- Cosa sia lo dice la figura, quindi la frase non lo ripete:
           «c'è 1 uovo» e «c'è 1 lana» vogliono due articoli diversi, e
           una frase che si compone da sola sbaglia il genere di
           qualcosa. -->
      <p class="fa-pronto"><Merce :merce="primoPronto.ricetta.da" :lato="48" />
         <b>{{ stato.pronti > 1 ? `Ce ne sono ${stato.pronti} pronti!` : 'È pronto!' }}</b>
         Ritirare non costa niente.</p>
      <p v-if="nonCiSta && senzaSilo" class="fa-piccolo">Non hai ancora il
         <b>{{ silo.toLowerCase() }}</b> (🪙{{ prezzoSilo }}): senza, non c'è
         dove metterlo. Non si butta via niente, e la fila intanto lavora.</p>
      <template v-else-if="nonCiSta">
        <p class="fa-piccolo">{{ siRitira ? 'Qualcosa non ci sta nel silo' : 'Nel silo non c\'è posto' }}:
           ti aspetta qui, e la fila intanto lavora.</p>
        <Passo :passo="passo" @fai="a => emit('passo', a)" />
      </template>
    </template>

    <p v-if="!stato.liberi" class="fa-piccolo">La fila è piena: ritira quello
       che è pronto{{ stato.prezzoFila ? ', o allungala' : '' }}.</p>

    <!-- ── cosa metterci ── -->
    <template v-if="stato.liberi">
      <!-- Nessuna ricetta: non dev'essere mai possibile — una macchina
           che arriva prima del suo primo lavoro è un tasto rotto che si
           è pagato, e `guastiDegliSblocchi` lo rifiuta — ma se succede
           il foglio lo **dice**, invece di restare muto sotto una frase
           che promette qualcosa. Il vuoto senza spiegazione è la cosa
           che fa credere che il gioco sia rotto. -->
      <p v-if="!ricette.length" class="fa-piccolo">Qui per adesso non c'è
         niente da preparare: le ricette arrivano coi livelli della
         fattoria.</p>
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
          <!-- L'ingrediente che manca **si preme**, e apre l'albero di
               quella merce: la strada intera, non solo il passo dopo. -->
          <button v-for="m in v.manca" :key="m.prodotto" type="button"
                  class="fa-manca-tasto" :data-albero-apri="m.prodotto"
                  @click="emit('albero', m.prodotto)">
            <b>{{ m.quanti }}
            <Merce :merce="m.prodotto" :lato="20" />
            {{ prodotto(m.prodotto).nome.toLowerCase() }}</b> 🌳</button>
          <b v-if="v.monete">🪙{{ v.monete }}</b>
        </p>
        <Passo :passo="v.passo" @fai="a => emit('passo', a)" />
      </template>
    </template>

    <div class="fa-fila">
      <button class="fa-bot piano" @click="emit('chiudi')">Chiudi</button>
      <button v-if="stato.pronto" class="fa-bot forte" data-ritira
              :disabled="!siRitira" @click="emit('ritira')">Ritira{{
                siRitira > 1 ? ` (${siRitira})` : '' }}</button>
    </div>
  </div>
</template>

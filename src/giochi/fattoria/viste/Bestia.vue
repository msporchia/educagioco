<script setup>
/* ═══════════════════════════════════════════════════════════════════
   COME STA, E COSA POSSO FARE PER LUI — IN TRE BLOCCHI

   Si tocca l'animale e si vede come sta. Il nome glielo si dà una volta,
   lo stato si guarda ogni volta: rinominare è rimasto, ma è un tastino
   in fondo.

   ── TRE BLOCCHI, UNO PER BISOGNO ──────────────────────────────────
   *Ribalta la forma di prima*, che era: tre barrette in cima, la
   ciotola in mezzo, una fila di tasti in fondo. Tutto vero e tutto
   sparso — dalla ciotola alle barrette non c'era nessun filo, e
   nessuno poteva capire quale tasto muovesse quale barretta.

   Adesso ogni bisogno è **un blocco**: la sua barra, e sotto solo le
   cose che quel bisogno lo riempiono. La pancia ha la ciotola, il pelo
   ha la spazzola e la copertina, il gioco ha la pallina. Non c'è niente
   da collegare a mente: quello che premi sta dentro la barra che si
   muove.

   ── QUELLO CHE NON HAI DICE COME SI FA ────────────────────────────
   La ciotola mostrava dieci cibi, sei dei quali spenti perché quella
   bestia non li mangia. Adesso mostra **solo i suoi**, e un cibo che
   non hai non è un tasto morto: premendolo si legge come si ottiene —
   «3 🌾 nel mulino (5 min)» — e **solo lì**, per chi non ha voglia di
   aspettare, compare l'offerta di comprarne uno a monete. L'ordine
   conta: prima come te lo fai, poi come lo compri. È la stessa regola
   di tutto il posto, dove coltivare conviene ma costa tempo vero.

   Non sa niente del profilo: riceve `stato`, `monete` e `granaio`, e
   manda fuori `nutri` e `coccola`. Chi paga è `Gioco.vue`.
   ═══════════════════════════════════════════════════════════════════ */
import { computed, ref } from 'vue'
import { BISOGNI, CHIAVI, comeSta, cibiPer, gestiPer } from '../dati/bisogni.js'
import { comeSiFa, PRODOTTI } from '../dati/coltivazioni.js'
import { laMacchina } from '../dati/catalogo.js'
import { famigliaDi } from '../dati/animali.js'
import Provino from './Provino.vue'

const props = defineProps({
  chi: { type: String, required: true },
  che: { type: String, default: '' },          // la razza, se non ha nome
  nome: { type: String, default: '' },
  stato: { type: Object, required: true },     // { pancia, pelo, gioco }
  monete: { type: Number, default: 0 },
  granaio: { type: Object, default: () => ({}) },  // per i cibi che si producono
})
const emit = defineEmits(['nutri', 'coccola', 'rinomina', 'chiudi'])

const famiglia = computed(() => famigliaDi(props.chi))
const pieno = k => (props.stato[k] ?? 0) > 0.93
/* Nella riga «gli piace…» stanno solo i cibi **suoi da comprare**: il
   mangime del mulino va bene per tutti, e infilarlo lì allungherebbe la
   frase senza dire niente su questa bestia. */
const suoi = computed(() => cibiPer(famiglia.value).filter(c => !c.da))

const quantiNe = prodotto => props.granaio[prodotto] || 0
/* Quanto ne hai: la scorta per quello che si produce, le monete per
   quello che si compra. Sono due cose diverse e si mostrano diverse. */
const ce = g => g.da ? quantiNe(g.da) > 0 : (g.prezzo || 0) <= props.monete
const puoi = (g, bisogno) => !pieno(bisogno) && ce(g)

/* I gesti di un bisogno, con quelli che hai davanti: chi può fare
   qualcosa adesso sta dove il dito arriva prima. */
const gesti = bisogno => gestiPer(bisogno, bisogno === 'pancia' ? famiglia.value : null)
  .slice()
  .sort((a, b) => (ce(b) ? 1 : 0) - (ce(a) ? 1 : 0))

/* ── quello che non hai: come si fa ──
   Uno solo aperto per volta, e ripremendo si chiude. Chi si è aperto la
   spiegazione del mangime e poi preme il pastone vede il pastone: due
   riquadri insieme farebbero saltare in su tutto il foglio. */
const spiega = ref(null)
function premi(g, bisogno) {
  if (puoi(g, bisogno)) { spiega.value = null; emit(g.che === 'cibo' ? 'nutri' : 'coccola', g); return }
  /* Pieno vuol dire «non adesso», non «non ce l'hai»: non c'è niente da
     spiegare, e aprire un riquadro direbbe la cosa sbagliata. */
  if (pieno(bisogno)) return
  spiega.value = spiega.value === g.id ? null : g.id
}

const aperto = computed(() => {
  if (!spiega.value) return null
  for (const k of CHIAVI)
    for (const g of gesti(k)) if (g.id === spiega.value) return { ...g, bisogno: k }
  return null
})
/* Come si ottiene la roba che manca. Un gesto che si paga in monete non
   ha niente da spiegare — mancano le monete, e quelle si fanno negli
   altri giochi — quindi lì il riquadro dice solo quello. */
const modi = computed(() => aperto.value && aperto.value.da ? comeSiFa(aperto.value.da) : [])
const dice = m => m.che === 'coltura'
  ? `semina ${m.nome.toLowerCase()} in un campo (${m.minuti} min) → ${m.resa} ${m.emoji}`
  : `${Object.entries(m.prende).map(([k, n]) => `${n} ${(PRODOTTI[k] || {}).emoji || k}`).join(' + ')}` +
    ` ${nomeDi(m.dove)} (${m.minuti} min) → ${m.resa} ${m.emoji}`
const nomeDi = dove => {
  const v = laMacchina(dove)
  return v ? `nel ${v.nome.toLowerCase()}` : ''
}
/* «Oppure comprane uno»: il cibo **suo** che si paga a monete e che
   riempie una fetta di pancia simile. Compare solo dentro il riquadro
   di uno che non hai, e mai prima: l'ordine è come te lo fai, poi come
   lo compri. */
/* **Prima si prende, poi si chiude.** Il tasto faceva
   `spiega = null; emit('nutri', invece)` in una riga sola del template,
   e `invece` è un computed che dipende da `spiega`: azzerato il primo,
   il secondo diventa `null` **prima** che l'emit lo legga, e chi
   riceveva un cibo nullo cadeva sul suo `.nome`. A schermo: il tasto
   che non fa niente e la schermata di guasto. Il rimedio è tenere il
   valore in una costante prima di toccare qualunque stato — vale per
   ogni handler che scrive e legge la stessa catena reattiva. */
function dagliInvece() {
  const cibo = invece.value
  if (!cibo) return
  spiega.value = null
  emit('nutri', cibo)
}

const invece = computed(() => {
  const a = aperto.value
  if (!a || a.che !== 'cibo' || !a.da) return null
  return suoi.value.slice().sort((x, y) =>
    Math.abs(x.quanto - a.quanto) - Math.abs(y.quanto - a.quanto))[0] || null
})
</script>

<template>
  <div class="fa-foglio">
    <h2>{{ nome || che }}</h2>
    <Provino :pezzo="chi + '_giu0'" :lato="64" />
    <p>{{ comeSta(stato, nome || che) }}</p>

    <section v-for="k in CHIAVI" :key="k" class="fa-blocco">
      <div class="fa-testa">
        <b>{{ BISOGNI[k].icona }} {{ BISOGNI[k].nome }}</b>
        <span class="fa-livello">
          <i :style="{ width: Math.round(stato[k] * 100) + '%', background: BISOGNI[k].colore }"></i>
        </span>
        <em>{{ pieno(k) ? 'a posto' : Math.round(stato[k] * 100) + '%' }}</em>
      </div>

      <p v-if="k === 'pancia'" class="fa-etichetta">gli piace
        {{ suoi.map(c => c.emoji + ' ' + c.nome.toLowerCase()).join(' e ') }}</p>

      <div class="fa-gesti">
        <button v-for="g in gesti(k)" :key="g.id"
                :class="['fa-cibo', { suo: puoi(g, k), altrui: !ce(g), viva: spiega === g.id }]"
                :disabled="pieno(k) && ce(g)"
                @click="premi(g, k)">
          <b>{{ g.emoji }}</b>
          <span>{{ g.nome }}</span>
          <em v-if="g.da">×{{ quantiNe(g.da) }}</em>
          <em v-else>🪙{{ g.prezzo }}</em>
        </button>
      </div>

      <!-- come si fa quello che manca, e solo dopo come si compra -->
      <div v-if="aperto && aperto.bisogno === k" class="fa-usi">
        <b>{{ aperto.emoji }} {{ aperto.nome }}: non ne hai</b>
        <p v-for="(m, i) in modi" :key="i">{{ dice(m) }}</p>
        <p v-if="!modi.length && aperto.prezzo">ti {{ aperto.prezzo - monete === 1 ? 'manca' : 'mancano' }}
          🪙{{ aperto.prezzo - monete }}: fai un po' di esercizi negli altri giochi.</p>
        <button v-if="invece && invece.prezzo <= monete" class="fa-cibo suo dentro"
                @click="dagliInvece">
          <b>{{ invece.emoji }}</b>
          <span>oppure {{ invece.nome.toLowerCase() }} adesso</span>
          <em>🪙{{ invece.prezzo }}</em>
        </button>
      </div>
    </section>

    <div class="fa-fila">
      <button class="fa-bot forte" @click="emit('chiudi')">Va bene</button>
    </div>
    <!-- il nome si dà una volta e si cambia di rado: sta in fondo, piccolo,
         dove non ruba il posto a quello che si fa ogni volta -->
    <button class="fa-minuto" @click="emit('rinomina')">cambia nome</button>
  </div>
</template>

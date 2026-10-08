<script setup>
/* Come sta una bestia, a blocchi (uno per bisogno, con solo le cose che lo riempiono) — vedi
   docs/fattoria/animali.md. stato è una fotografia (foto in dati/bisogni.js), non la bestia viva:
   il record del motore è sempre lo stesso oggetto e un foglio con prop identiche non si ridisegna. */
import { computed, ref } from 'vue'
import { BISOGNI, CHIAVI, comeSta, cibiPer, gestiPer } from '../dati/bisogni.js'
import { comeSiFa, PRODOTTI } from '../dati/coltivazioni.js'
import { laMacchina } from '../dati/catalogo.js'
import { famigliaDi } from '../dati/animali.js'
import Provino from './Provino.vue'
import Chiudi from './Chiudi.vue'

const props = defineProps({
  chi: { type: String, required: true },
  che: { type: String, default: '' },          // la razza, se non ha nome
  nome: { type: String, default: '' },
  stato: { type: Object, required: true },     // { pancia, pelo, gioco }
  monete: { type: Number, default: 0 },
  granaio: { type: Object, default: () => ({}) },  // per i cibi che si producono
  // c'è un addobbo della festa che non si ha ancora: «Vestilo» porta il segnalino
  festa: { type: Boolean, default: false },
})
const emit = defineEmits(['nutri', 'coccola', 'rinomina', 'vesti', 'chiudi'])

const famiglia = computed(() => famigliaDi(props.chi))
const pieno = k => (props.stato[k] ?? 0) > 0.93
// Solo i cibi suoi da comprare: il mangime del mulino va bene per tutti e non dice niente su questa bestia.
const suoi = computed(() => cibiPer(famiglia.value).filter(c => !c.da))

const quantiNe = prodotto => props.granaio[prodotto] || 0
// Quanto ne hai: la scorta per quello che si produce, le monete per quello che si compra.
const ce = g => g.da ? quantiNe(g.da) > 0 : (g.prezzo || 0) <= props.monete
const puoi = (g, bisogno) => !pieno(bisogno) && ce(g)

// I gesti di un bisogno: chi può fare qualcosa adesso sta dove il dito arriva prima.
const gesti = bisogno => gestiPer(bisogno, bisogno === 'pancia' ? famiglia.value : null)
  .slice()
  .sort((a, b) => (ce(b) ? 1 : 0) - (ce(a) ? 1 : 0))

// Quello che non hai: come si fa. Uno aperto per volta (ripremendo si chiude).
const spiega = ref(null)
function premi(g, bisogno) {
  if (puoi(g, bisogno)) { spiega.value = null; emit(g.che === 'cibo' ? 'nutri' : 'coccola', g); return }
  // Pieno vuol dire "non adesso", non "non ce l'hai": niente da spiegare.
  if (pieno(bisogno)) return
  spiega.value = spiega.value === g.id ? null : g.id
}

const aperto = computed(() => {
  if (!spiega.value) return null
  for (const k of CHIAVI)
    for (const g of gesti(k)) if (g.id === spiega.value) return { ...g, bisogno: k }
  return null
})
// Come si ottiene la roba che manca; un gesto pagato in monete non ha niente da spiegare.
const modi = computed(() => aperto.value && aperto.value.da ? comeSiFa(aperto.value.da) : [])
const dice = m => m.che === 'coltura'
  ? `semina ${m.nome.toLowerCase()} in un campo (${m.minuti} min) → ${m.resa} ${m.emoji}`
  : `${Object.entries(m.prende).map(([k, n]) => `${n} ${(PRODOTTI[k] || {}).emoji || k}`).join(' + ')}` +
    ` ${nomeDi(m.dove)} (${m.minuti} min) → ${m.resa} ${m.emoji}`
const nomeDi = dove => {
  const v = laMacchina(dove)
  return v ? `nel ${v.nome.toLowerCase()}` : ''
}
// "Oppure comprane uno": solo dentro il riquadro di uno che non hai. Prima si legge il cibo in una
// costante e poi si azzera spiega, se no invece (un computed su spiega) diventa null prima dell'emit.
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
    <Chiudi @chiudi="$emit('chiudi')" />
    <h2>{{ nome || che }}</h2>
    <Provino class="fa-ritratto" :pezzo="chi + '_giu0'" :lato="104" />
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
      <!-- Vestilo sta fra i tasti in fondo: non riempie nessuna barra. -->
      <!-- festa: c'è un cappello della festa che non ha ancora, e la bestia lo vorrebbe -->
      <button class="fa-bot piano fa-con-bollo" data-azione="vesti"
              @click="emit('vesti')">🎩 Vestilo<b v-if="festa" class="fa-bollo" data-festa>🎃</b></button>
      <button class="fa-bot forte" @click="emit('chiudi')">Va bene</button>
    </div>
    <!-- il nome si dà una volta e si cambia di rado -->
    <button class="fa-minuto" @click="emit('rinomina')">cambia nome</button>
  </div>
</template>

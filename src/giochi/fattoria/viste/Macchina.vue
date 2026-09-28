<script setup>
/* Le macchine: la fila, le ricette da metterci, il ritiro — un recinto è una macchina anche lui
   (stessi verbi, cambia solo nome e parole) — vedi docs/fattoria/macchine.md. */
import { computed } from 'vue'
import { PRODOTTI } from '../dati/coltivazioni.js'
import Merce from './Merce.vue'
import Passo from './Passo.vue'
import Chiudi from './Chiudi.vue'

const props = defineProps({
  // quello che torna da Fattoria.statoMacchina()
  stato: { type: Object, required: true },
  nome: { type: String, default: 'La macchina' },
  // se là dentro ci sono degli animali: cambia solo come si dicono le cose, mai cosa fanno i tasti
  bestie: { type: Boolean, default: false },
  // { ricetta, manca, monete, passo, hai }: hai risponde a "mi serve?", non a "posso?" (tasto spento + numero).
  ricette: { type: Array, default: () => [] },
  // quanti dei pezzi pronti entrano adesso nel silo, e quale merce è rimasta fuori per prima
  siRitira: { type: Number, default: 0 },
  nonCiSta: { type: String, default: '' },
  // dove finisce quello rimasto fuori: un "metti un silo" che non dice quale manda a comprare quello sbagliato
  silo: { type: String, default: 'silo' },
  senzaSilo: { type: Boolean, default: false },
  prezzoSilo: { type: Number, default: 0 },
  // Il prossimo passo quando quello che è pronto non ha dove andare
  passo: { type: Object, default: null },
})
const emit = defineEmits(['avvia', 'ritira', 'togli', 'ingrandisci', 'chiudi', 'passo',
                         'albero'])

const prodotto = k => PRODOTTI[k] || { nome: k, emoji: '📦' }
const puo = v => !v.manca.length && !v.monete

// I posti della fila, pieni e vuoti, nell'ordine in cui escono.
const posti = computed(() => {
  const coda = props.stato.coda || []
  return [...coda, ...Array.from({ length: props.stato.liberi || 0 }, () => null)]
})

// Cosa mette in fila il ＋, se c'è una risposta sola (l'ultima ricetta rifatta, o l'unica possibile).
const ancora = computed(() => {
  const coda = props.stato.coda || []
  const ultima = coda.length ? coda[coda.length - 1].ricetta.id : null
  const buone = props.ricette.filter(puo)
  return buone.find(v => v.ricetta.id === ultima) || (buone.length === 1 ? buone[0] : null)
})

// la faccia grande del ritiro: il primo pezzo pronto, non quello che lavora
const primoPronto = computed(() => (props.stato.coda || []).find(p => p.pronto) || null)

// Perché non ci si può mettere altro: con un solo posto di partenza, "fila piena" va detto per quello che è.
const perchePiena = computed(() => {
  const s = props.stato
  const oPosto = s.prezzoFila ? ', o aggiungi un posto' : ''
  if (s.pronto) return `Per metterci altro, ritira quello che è pronto${oPosto}.`
  if (s.posti === 1)
    return props.bestie
      ? 'Mangiano una pappa alla volta: per dargliene un\'altra intanto, aggiungi un posto.'
      : 'Fa una cosa alla volta: per metterci altro mentre lavora, aggiungi un posto.'
  return `La fila è piena: aspetta che finisca il primo${oPosto}.`
})

const minuti = n => `${n} ${n === 1 ? 'minuto' : 'minuti'}`

// Le caselle: una per pezzo (non una formula "3 → 2", che si legge e qui non si può dare per scontato).
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
          <!-- In fila e non partito: si toglie e rende tutto; quello pronto si ritira. -->
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
      <!-- Allungare la fila: il prezzo sta sul tasto, al tetto il tasto non c'è più. -->
      <button v-if="stato.prezzoFila" type="button" class="fa-posto-piu"
              data-fila-ingrandisci @click="emit('ingrandisci')">
        +1 posto<br><b>🪙{{ stato.prezzoFila }}</b>
      </button>
    </div>

    <!-- ── pronti: si ritira quello che ci sta ── -->
    <template v-if="primoPronto">
      <!-- Cosa sia lo dice la figura, la frase non lo ripete. -->
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

    <p v-if="!stato.liberi" class="fa-piccolo" data-fila-piena>{{ perchePiena }}</p>

    <!-- ── cosa metterci ── -->
    <template v-if="stato.liberi">
      <!-- Nessuna ricetta non dovrebbe mai succedere (guastiDegliSblocchi lo impedisce), ma se succede lo dice. -->
      <p v-if="!ricette.length" class="fa-piccolo">Qui per adesso non c'è
         niente da preparare: le ricette arrivano coi livelli della
         fattoria.</p>
      <!-- La ricetta si legge come una freccia: entra, esce, il conto sotto. -->
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
      <!-- Quello che manca, e dove andarlo a prendere (motore/consiglio.js). -->
      <!-- Quello che manca si dice col suo nome e la sua faccia vera, non l'emoji. -->
      <template v-for="v in ricette.filter(v => !puo(v))" :key="v.ricetta.id">
        <p class="fa-piccolo fa-manca">
          <span>Per {{ v.ricetta.nome.toLowerCase() }} ti
            {{ v.manca.length + (v.monete ? 1 : 0) > 1 ? 'servono ancora' : 'serve ancora' }}</span>
          <!-- L'ingrediente che manca si preme, e apre l'albero di quella merce. -->
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

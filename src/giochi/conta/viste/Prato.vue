<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL PRATO — dove si conta

   Riceve una domanda già decisa dal motore (`motore/scena.js`, tramite
   `Corsa`) e manda fuori un solo gesto: `rispondi(valore)`. Non decide
   mai se una risposta è giusta — quello lo sa solo `Corsa`, in
   `Gioco.vue` — e non genera mai una domanda nuova da sé.

   Il tocca-e-conta è tutto qui dentro, ed è scenografia: accende un
   numero sopra il gettone toccato, suona una nota che sale. Non manda
   niente fuori finché non si preme una risposta (o, nel modo «porta»,
   il tasto ✔) — è un aiuto per il bambino, non un modo di rispondere.

   `erroreSegnale` sale di uno ogni volta che la risposta data è
   sbagliata: la domanda resta la stessa (arriva identica da fuori), e
   qui si anima il «si conta insieme» — gli stessi gettoni, accesi in
   ordine, uno alla volta — prima di lasciare riprovare.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, reactive, watch, onBeforeUnmount } from 'vue'
import { suono } from '../../../audio.js'

const props = defineProps({
  domanda: { type: Object, required: true },
  erroreSegnale: { type: Number, default: 0 },
})
const emit = defineEmits(['rispondi'])

const PASSO = 450   // ms fra un numero e il prossimo, nel «conta insieme»
const bersagliato = gt => gt.bersaglio !== false

const contando = ref(false)      // sta girando il «conta insieme»?
const tocchi = reactive({})      // { [gruppo]: [idGettone in ordine di tocco] }
let fineConta = null

/* «uno in più»: si vede prima la scena com'era, poi arriva/scappa — e
   solo allora si può rispondere. «gli stessi»: si vede la fila, poi si
   sparpaglia. Sono gli unici due verbi con un tempo morto voluto, e i
   loro timer stanno qui vicino a quello del «conta insieme» perché sono
   la stessa famiglia di cose: puliscono tutte allo smontaggio. */
const sparpagliato = ref(false)
const arrivato = ref(false)
let timerSparpaglio = null, timerArrivo = null

function svuotaTocchi() { for (const k of Object.keys(tocchi)) delete tocchi[k] }

/* domanda nuova (una risposta giusta ne ha fatta arrivare un'altra):
   si riparte puliti */
watch(() => props.domanda, d => {
  svuotaTocchi()
  contando.value = false
  sparpagliato.value = false; arrivato.value = false
  clearTimeout(timerSparpaglio); clearTimeout(timerArrivo)
  if (d.verbo === 'stessi') timerSparpaglio = setTimeout(() => { sparpagliato.value = true }, 1300)
  if (d.verbo === 'piuUno') timerArrivo = setTimeout(() => {
    arrivato.value = true
    suono.nota(d.direzione === 'arriva' ? 700 : 380, d.direzione === 'arriva' ? 900 : 260, 0.16, 'triangle', 0.1)
  }, 1100)
}, { immediate: true })

/* stessa domanda, risposta sbagliata: un suono morbido — non il «no»
   aggressivo del gioco grande — e la cascata che conta al posto suo */
watch(() => props.erroreSegnale, n => {
  if (n === 0) return
  suono.nota(320, 260, 0.2, 'sine', 0.08)
  avviaContaInsieme()
})
onBeforeUnmount(() => { clearTimeout(fineConta); clearTimeout(timerSparpaglio); clearTimeout(timerArrivo) })

function avviaContaInsieme() {
  svuotaTocchi()
  contando.value = true
  const totale = props.domanda.gruppi.reduce((n, g) => n + g.gettoni.filter(bersagliato).length, 0)
  clearTimeout(fineConta)
  fineConta = setTimeout(() => { contando.value = false }, totale * PASSO + 700)
}

/* l'ordine in cui si accendono i numeri: dall'alto, da sinistra — come
   si leggerebbe la scena ad alta voce */
function ordineLettura(gruppo) {
  return gruppo.gettoni.filter(bersagliato).slice().sort((a, b) => a.y - b.y || a.x - b.x)
}
const indiceConta = (gruppo, gettone) =>
  contando.value ? ordineLettura(gruppo).findIndex(g => g.id === gettone.id) : -1

function numero(gruppo, gettone) {
  if (contando.value) { const i = indiceConta(gruppo, gettone); return i < 0 ? null : i + 1 }
  const i = (tocchi[gruppo.chiave] || []).indexOf(gettone.id)
  return i < 0 ? null : i + 1
}
const ritardoNumero = (gruppo, gettone) => {
  const i = indiceConta(gruppo, gettone)
  return i < 0 ? {} : { animationDelay: (i * PASSO) + 'ms' }
}

/* toccare un gettone non risponde: conta, e basta. Un gettone già
   contato si spegne, non si riconta. */
function tocca(gruppo, gettone) {
  if (contando.value) return
  const lista = tocchi[gruppo.chiave] || (tocchi[gruppo.chiave] = [])
  const i = lista.indexOf(gettone.id)
  if (i >= 0) { lista.splice(i, 1); suono.nota(280, 280, 0.08, 'sine', 0.07) }
  /* Sempre la stessa nota, non una scala che sale. Quello che il tocco
     deve insegnare è «uno e uno solo», e quello sta nel ritmo — mentre
     a che punto sia arrivato il conto lo dice il numero stampato sul
     gettone. Se salisse, l'informazione starebbe nel suono: chi ha
     l'audio spento perderebbe metà del gioco. */
  else { lista.push(gettone.id); suono.nota(560, 560, 0.1, 'triangle', 0.1) }
}
const contato = (gruppo, gettone) => (tocchi[gruppo.chiave] || []).includes(gettone.id)

function confermaPorta() {
  if (contando.value) return
  emit('rispondi', (tocchi.unico || []).length)
}

const prontaPerRispondere = d =>
  d.verbo === 'stessi' ? sparpagliato.value : d.verbo === 'piuUno' ? arrivato.value : true

function stileGettone(gettone) {
  const alt = sparpagliato.value && gettone.xAlt != null
  return { left: (alt ? gettone.xAlt : gettone.x) + '%', top: (alt ? gettone.yAlt : gettone.y) + '%' }
}
</script>

<template>
  <div class="ct-scena">
    <!-- la consegna: sempre leggibile per icone. Il testo sotto è per
         chi legge — un genitore, o un bambino più grande — e domani
         sarà anche la voce incisa: non c'è ancora, l'italiano manca
         in `src/data/voci.js`. -->
    <div class="ct-consegna">
      <div class="ct-icone em">
        <span v-for="(ic, i) in domanda.consegna.icone" :key="i">{{ ic }}</span>
      </div>
      <p class="ct-frase">{{ domanda.consegna.frase }}</p>
    </div>

    <div class="ct-campo" :class="{ 'ct-due': domanda.gruppi.length === 2 }">
      <div v-for="g in domanda.gruppi" :key="g.chiave" class="ct-gruppo" :data-gruppo="g.chiave">
        <button v-for="gt in g.gettoni" :key="gt.id" class="ct-gettone em"
                :class="{ 'ct-contato': contato(g, gt), 'ct-acceso': contando && indiceConta(g, gt) >= 0,
                          'ct-nuovo': gt.nuovo, 'ct-nuovo-qui': gt.nuovo && arrivato,
                          'ct-via': gt.via, 'ct-via-via': gt.via && arrivato }"
                :style="stileGettone(gt)" :disabled="contando"
                :aria-label="'gettone ' + gt.specie.uno" :data-specie="gt.specie.chiave"
                @click="tocca(g, gt)">
          {{ gt.specie.emoji }}
          <span v-if="numero(g, gt) != null" class="ct-numero" :style="ritardoNumero(g, gt)">{{ numero(g, gt) }}</span>
        </button>
      </div>
    </div>

    <div class="ct-risposte" v-if="prontaPerRispondere(domanda)">
      <template v-if="domanda.modo === 'cifre'">
        <button v-for="o in domanda.opzioni" :key="o.valore" class="ct-cifra em"
                :disabled="contando" @click="$emit('rispondi', o.valore)">{{ o.etichetta }}</button>
      </template>
      <template v-else-if="domanda.modo === 'confronto' || domanda.modo === 'inclusione'">
        <button v-for="o in domanda.opzioni" :key="o.valore" class="ct-scelta"
                :disabled="contando" @click="$emit('rispondi', o.valore)">
          <span class="em">{{ o.icone.join('') }}</span>
          <b>{{ o.etichetta }}</b>
        </button>
      </template>
      <button v-else-if="domanda.modo === 'porta'" class="ct-conferma"
              :disabled="contando" aria-label="conferma" @click="confermaPorta">✔</button>
    </div>
  </div>
</template>

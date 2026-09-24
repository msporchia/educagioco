<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA SCELTA DI UNA CASELLA

   Si apre sotto la riga, e cambia la riga **mentre si sceglie**: il
   numero nuovo si vede subito al suo posto, non dopo un «conferma».
   Cinque generi di casella:

     verso        le due frecce: a destra, a sinistra
     posto        dove va il mattone: sotto i piedi, in basso a destra o a sinistra
     colore       i quadratini dei colori del livello
     numero       un numero, o una lavagnetta, o un conto con una sola
                  operazione («h + 1»): le cifre da 0 a 10 e un ± per
                  andare oltre, i nomi da toccare, e i tre segni
     cond         «[sotto] c'è [il vuoto]», oppure «[h] è minore di [5]»
     lavagnetta   quale lavagnetta scrivere (o una nuova)
     lato         nel porto: da che parte prendere o posare, le quattro frecce
     valore       il valore di una lavagnetta: come un numero, e nel porto
                  anche un colore o quello che il robot legge (📖)

   Il porto aggiunge a numeri e colori la **lettura** (`{ leggi: lato }`),
   quando il livello la offre (`contesto.leggere`): è il valore che il
   programma non conosce prima, e che il robot va a prendere nel mondo.

   Le lavagnette dell'ordine hanno il lucchetto: si leggono e basta. Le
   misure del progetto sono tratteggiate: esistono solo dentro di lui.
   ═══════════ */
import { ref, computed, watch } from 'vue'
import { colore } from '../dati/colori.js'
import { DOVE, COSE, CONFRONTI, OPERAZIONI, LATI } from '../dati/scrivi.js'
import { VERSI_IN_PAROLE, POSTI_IN_PAROLE, DOVE_IN_PAROLE, COSE_IN_PAROLE, CONFRONTI_IN_PAROLE, numeroInParole,
         LATI_PRENDI, LATI_POSA, FRECCE }
  from './frasi.js'

const props = defineProps({
  tipo: { type: String, required: true },
  riga: { type: Object, required: true },
  campo: { type: String, required: true },
  /* { colori, nomi: { misure, lavagnette, ordine }, confronta,
       e per il porto: porto, versi, dove, cose, leggere } */
  contesto: { type: Object, required: true },
})
const emit = defineEmits(['scegli', 'chiudi', 'nuova-lavagnetta'])

const valoreDi = () => {
  const [testa, coda] = props.campo.split('.')
  const v = props.riga[testa]
  return coda !== undefined ? (v || [])[Number(coda)] : v
}
const copia = v => (v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v)

/* ── i numeri ── */
const expr = ref(copia(valoreDi()) || { vuoto: true })
/* quale dei due pezzi di un conto sta cambiando: `a` o `b` */
const lato = ref(expr.value && expr.value.op ? 'b' : 'a')
watch(() => [props.riga.id, props.campo], () => {
  expr.value = copia(valoreDi()) || { vuoto: true }
  lato.value = expr.value && expr.value.op ? 'b' : 'a'
  cond.value = copia(valoreDi()) || condVuota()
})

const pezzoAttivo = computed(() => (expr.value.op ? expr.value[lato.value] : expr.value))
function mettiPezzo(p) {
  if (expr.value.op) expr.value = { ...expr.value, [lato.value]: p }
  else expr.value = p
  emit('scegli', copia(expr.value))
}
const cifra = n => mettiPezzo({ n })
function passo(d) {
  const p = pezzoAttivo.value
  const n = typeof p.n === 'number' ? p.n : 0
  mettiPezzo({ n: Math.max(0, Math.min(99, n + d)) })
}
function conto(op) {
  if (expr.value.op) expr.value = { ...expr.value, op }
  else {
    /* dalla N si parte scegliendo il primo pezzo, da un numero il secondo */
    const primo = expr.value.vuoto
    expr.value = { op, a: expr.value, b: { n: op === '×' ? 2 : 1 } }
    lato.value = primo ? 'a' : 'b'
  }
  emit('scegli', copia(expr.value))
}
function senzaConto() {
  if (!expr.value.op) return
  expr.value = expr.value.a
  lato.value = 'a'
  emit('scegli', copia(expr.value))
}

const nomi = computed(() => ({ misure: [], lavagnette: [], ordine: [], misureColore: [], ordineColore: [],
                                ...(props.contesto.nomi || {}) }))

/* il cantiere ha due versi e le sue sei caselle da guardare, il porto
   quattro frecce, la mano, e le cose che il livello offre */
const versi = computed(() => props.contesto.versi || ['destra', 'sinistra'])
const doveLista = computed(() => props.contesto.dove || DOVE)
const coseLista = computed(() => props.contesto.cose || COSE)
const latiParole = computed(() => (props.riga.tipo === 'posa' ? LATI_POSA : LATI_PRENDI))
/* dove si può leggere: le quattro frecce e la mano */
const letture = [...LATI, 'mano']
/* le lavagnette del bambino portano un colore solo nel porto: lì il
   robot lo legge su una cassa e lo tiene da parte */
const nomiColore = computed(() => [...nomi.value.misureColore, ...nomi.value.ordineColore,
                                   ...(props.contesto.porto ? nomi.value.lavagnette : [])])
const colorato = c => ['mattone', 'cassa', 'cassone'].includes(c)

/* ── le condizioni ──
   Una domanda nuova non ha un posto né una cosa già scelti: si scrive
   nella riga solo quando il bambino li ha scelti tutti e due, se no
   «sotto i piedi c'è il vuoto» sarebbe di nuovo un valore di comodo che
   sembra l'unico possibile. */
const condVuota = () => ({ tipo: 'guarda', dove: null, cosa: null, c: true })
const cond = ref(copia(valoreDi()) || condVuota())
const completa = c => c.tipo === 'confronta' || (c.dove && c.cosa)
function cambiaCond(campo, v) {
  cond.value = { ...cond.value, [campo]: v }
  if (!cond.value.colore) delete cond.value.colore
  if (completa(cond.value)) emit('scegli', copia(cond.value))
}
/* cambiando la cosa, il colore resta solo se è ancora una cosa colorata */
function cambiaCosa(c) {
  const nuova = { ...cond.value, cosa: c }
  if (!colorato(c)) delete nuova.colore
  cond.value = nuova
  if (completa(cond.value)) emit('scegli', copia(cond.value))
}
function genere(t) {
  if (cond.value.tipo === t) return
  cond.value = t === 'guarda'
    ? condVuota()
    : { tipo: 'confronta', a: { v: tuttiNomi.value[0] || 'h' }, cmp: '<', b: { n: 1 } }
  if (completa(cond.value)) emit('scegli', copia(cond.value))
}
const tuttiNomi = computed(() => [...nomi.value.misure, ...nomi.value.lavagnette, ...nomi.value.ordine])

const scegli = v => { emit('scegli', v); emit('chiudi') }
</script>

<template>
  <div class="cst-scelta" :data-scelta="tipo" @click.stop>
    <button type="button" class="cst-chiudi cst-chiudi-piccola" aria-label="chiudi" data-chiudi @click="emit('chiudi')">✕</button>

    <!-- le frecce -->
    <div v-if="tipo === 'verso'" class="cst-fila">
      <button v-for="v in versi" :key="v" type="button" class="cst-chip cst-grosso"
              :class="{ 'cst-su': riga.verso === v }" :data-verso="v" @click="scegli(v)">{{ VERSI_IN_PAROLE[v] }}</button>
    </div>

    <!-- da che parte prendere o posare -->
    <div v-else-if="tipo === 'lato'" class="cst-fila">
      <button v-for="l in LATI" :key="l" type="button" class="cst-chip cst-grosso"
              :class="{ 'cst-su': riga.lato === l }" :data-lato="l" @click="scegli(l)">{{ latiParole[l] }}</button>
    </div>

    <!-- dove va il mattone -->
    <div v-else-if="tipo === 'posto'" class="cst-fila">
      <button v-for="(p, v) in POSTI_IN_PAROLE" :key="v" type="button" class="cst-chip cst-grosso"
              :class="{ 'cst-su': (riga.dove || 'sotto') === v }" :data-posto="v" @click="scegli(v)">{{ p }}</button>
    </div>

    <!-- i colori: quelli del livello, e i nomi che portano un colore -->
    <template v-else-if="tipo === 'colore'">
      <div class="cst-fila">
        <button v-for="c in contesto.colori" :key="c" type="button" class="cst-chip cst-colore"
                :class="{ 'cst-su': valoreDi() === c }" :data-colore="c"
                :style="{ '--cst-tinta': colore(c).tinta, '--cst-ombra': colore(c).ombra }" @click="scegli(c)">
          <i class="cst-quadretto"></i>{{ colore(c).nome }}
        </button>
      </div>
      <div v-if="nomi.misureColore.length || nomi.ordineColore.length || (contesto.porto && nomi.lavagnette.length)" class="cst-fila">
        <button v-for="m in nomi.misureColore" :key="'m' + m" type="button" class="cst-chip cst-nome cst-misura-chip"
                :class="{ 'cst-su': (valoreDi() || {}).v === m }" :data-nome="m" @click="scegli({ v: m })">{{ m }}</button>
        <button v-for="o in nomi.ordineColore" :key="'o' + o" type="button" class="cst-chip cst-nome cst-ordine-chip"
                :class="{ 'cst-su': (valoreDi() || {}).v === o }" :data-nome="o" @click="scegli({ v: o })">🔒 {{ o }}</button>
        <template v-if="contesto.porto">
          <button v-for="l in nomi.lavagnette" :key="'l' + l" type="button" class="cst-chip cst-nome"
                  :class="{ 'cst-su': (valoreDi() || {}).v === l }" :data-nome="l" @click="scegli({ v: l })">{{ l }}</button>
        </template>
      </div>
      <div v-if="contesto.leggere" class="cst-fila" data-leggi>
        <span class="cst-piccolo">📖 leggi:</span>
        <button v-for="l in letture" :key="'r' + l" type="button" class="cst-chip"
                :class="{ 'cst-su': (valoreDi() || {}).leggi === l }" :data-leggi="l"
                @click="scegli({ leggi: l })">{{ FRECCE[l] }}</button>
      </div>
    </template>

    <!-- un numero (o il valore di una lavagnetta, che nel porto può
         essere anche un colore) -->
    <template v-else-if="tipo === 'numero' || tipo === 'valore'">
      <div class="cst-conto">
        <template v-if="expr.op">
          <button type="button" class="cst-pezzo" :class="{ 'cst-su': lato === 'a' }" data-pezzo="a" @click="lato = 'a'">{{ numeroInParole(expr.a) }}</button>
          <b>{{ expr.op === '-' ? '−' : expr.op }}</b>
          <button type="button" class="cst-pezzo" :class="{ 'cst-su': lato === 'b' }" data-pezzo="b" @click="lato = 'b'">{{ numeroInParole(expr.b) }}</button>
        </template>
        <span v-else class="cst-pezzo cst-su">{{ numeroInParole(expr) }}</span>
      </div>
      <div class="cst-fila cst-cifre">
        <button v-for="n in 11" :key="n" type="button" class="cst-chip" :data-cifra="n - 1"
                :class="{ 'cst-su': pezzoAttivo.n === n - 1 }" @click="cifra(n - 1)">{{ n - 1 }}</button>
        <span class="cst-passo">
          <button type="button" class="cst-chip" aria-label="uno in meno" @click="passo(-1)">−</button>
          <button type="button" class="cst-chip" aria-label="uno in più" @click="passo(+1)">+</button>
        </span>
      </div>
      <div v-if="tuttiNomi.length" class="cst-fila">
        <button v-for="m in nomi.misure" :key="'m' + m" type="button" class="cst-chip cst-nome cst-misura-chip"
                :class="{ 'cst-su': pezzoAttivo.v === m }" :data-nome="m" @click="mettiPezzo({ v: m })">{{ m }}</button>
        <button v-for="l in nomi.lavagnette" :key="'l' + l" type="button" class="cst-chip cst-nome"
                :class="{ 'cst-su': pezzoAttivo.v === l }" :data-nome="l" @click="mettiPezzo({ v: l })">{{ l }}</button>
        <button v-for="o in nomi.ordine" :key="'o' + o" type="button" class="cst-chip cst-nome cst-ordine-chip"
                :class="{ 'cst-su': pezzoAttivo.v === o }" :data-nome="o" @click="mettiPezzo({ v: o })">🔒 {{ o }}</button>
      </div>
      <div v-if="contesto.leggere" class="cst-fila" data-leggi>
        <span class="cst-piccolo">📖 leggi:</span>
        <button v-for="l in letture" :key="'r' + l" type="button" class="cst-chip"
                :class="{ 'cst-su': pezzoAttivo.leggi === l }" :data-leggi="l"
                @click="mettiPezzo({ leggi: l })">{{ FRECCE[l] }}</button>
      </div>
      <!-- nel porto una lavagnetta può tenere un colore: sceglierlo
           prende il posto di tutto il valore, un colore non fa conti -->
      <div v-if="tipo === 'valore' && contesto.porto" class="cst-fila">
        <button v-for="c in contesto.colori" :key="'c' + c" type="button" class="cst-chip cst-colore"
                :class="{ 'cst-su': expr === c }" :data-colore="c"
                :style="{ '--cst-tinta': colore(c).tinta, '--cst-ombra': colore(c).ombra }" @click="scegli(c)">
          <i class="cst-quadretto"></i>{{ colore(c).nome }}
        </button>
      </div>
      <div v-if="tuttiNomi.length" class="cst-fila cst-segni">
        <span class="cst-piccolo">un conto:</span>
        <button v-for="op in OPERAZIONI" :key="op" type="button" class="cst-chip" :data-operazione="op"
                :class="{ 'cst-su': expr.op === op }" @click="conto(op)">{{ op === '-' ? '−' : op }}</button>
        <button v-if="expr.op" type="button" class="cst-chip" data-operazione="niente" @click="senzaConto">niente conto</button>
      </div>
      <button type="button" class="cst-fatto" data-azione="fatto" @click="emit('chiudi')">fatto</button>
    </template>

    <!-- una condizione -->
    <template v-else-if="tipo === 'cond'">
      <div v-if="contesto.confronta" class="cst-fila">
        <button type="button" class="cst-chip" :class="{ 'cst-su': cond.tipo !== 'confronta' }" @click="genere('guarda')">👀 il robot guarda</button>
        <button type="button" class="cst-chip" :class="{ 'cst-su': cond.tipo === 'confronta' }" data-genere="confronta" @click="genere('confronta')">⚖️ confronta due numeri</button>
      </div>
      <template v-if="cond.tipo !== 'confronta'">
        <div class="cst-fila">
          <button v-for="d in doveLista" :key="d" type="button" class="cst-chip" :class="{ 'cst-su': cond.dove === d }"
                  :data-dove="d" @click="cambiaCond('dove', d)">{{ DOVE_IN_PAROLE[d] }}</button>
        </div>
        <div class="cst-fila">
          <button type="button" class="cst-chip" :class="{ 'cst-su': cond.c !== false }" data-ce="si" @click="cambiaCond('c', true)">c'è</button>
          <button type="button" class="cst-chip" :class="{ 'cst-su': cond.c === false }" data-ce="no" @click="cambiaCond('c', false)">non c'è</button>
        </div>
        <div class="cst-fila">
          <button v-for="c in coseLista" :key="c" type="button" class="cst-chip" :class="{ 'cst-su': cond.cosa === c }"
                  :data-cosa="c" @click="cambiaCosa(c)">{{ COSE_IN_PAROLE[c] }}</button>
        </div>
        <!-- un mattone, una cassa, un cassone possono essere di un colore
             preciso: scritto, o il nome di chi lo porta («tinta») -->
        <div v-if="colorato(cond.cosa) && contesto.colori.length > 0" class="cst-fila" data-colori-domanda>
          <button type="button" class="cst-chip" :class="{ 'cst-su': !cond.colore }" data-colore-domanda="qualunque"
                  @click="cambiaCond('colore', null)">di qualunque colore</button>
          <button v-for="c in contesto.colori" :key="c" type="button" class="cst-chip cst-colore"
                  :class="{ 'cst-su': cond.colore === c }" :data-colore-domanda="c"
                  :style="{ '--cst-tinta': colore(c).tinta }" @click="cambiaCond('colore', c)">
            <i class="cst-quadretto"></i>{{ colore(c).nome }}
          </button>
          <button v-for="n in nomiColore" :key="'n' + n" type="button" class="cst-chip cst-nome"
                  :class="{ 'cst-su': (cond.colore || {}).v === n }" :data-colore-domanda="'nome:' + n"
                  @click="cambiaCond('colore', { v: n })">{{ n }}</button>
        </div>
      </template>
      <template v-else>
        <div class="cst-fila">
          <button v-for="n in tuttiNomi" :key="'a' + n" type="button" class="cst-chip cst-nome"
                  :class="{ 'cst-su': cond.a && cond.a.v === n }" @click="cambiaCond('a', { v: n })">{{ n }}</button>
        </div>
        <div class="cst-fila">
          <button v-for="c in CONFRONTI" :key="c" type="button" class="cst-chip" :class="{ 'cst-su': cond.cmp === c }"
                  :data-confronto="c" @click="cambiaCond('cmp', c)">{{ CONFRONTI_IN_PAROLE[c] }}</button>
        </div>
        <div class="cst-fila cst-cifre">
          <button v-for="n in 11" :key="'b' + n" type="button" class="cst-chip"
                  :class="{ 'cst-su': cond.b && cond.b.n === n - 1 }" @click="cambiaCond('b', { n: n - 1 })">{{ n - 1 }}</button>
          <button v-for="n in tuttiNomi" :key="'bn' + n" type="button" class="cst-chip cst-nome"
                  :class="{ 'cst-su': cond.b && cond.b.v === n }" @click="cambiaCond('b', { v: n })">{{ n }}</button>
        </div>
      </template>
      <button type="button" class="cst-fatto" data-azione="fatto" @click="emit('chiudi')">fatto</button>
    </template>

    <!-- quale lavagnetta scrivere -->
    <div v-else-if="tipo === 'lavagnetta'" class="cst-fila">
      <button v-for="l in nomi.lavagnette" :key="l" type="button" class="cst-chip cst-nome"
              :class="{ 'cst-su': riga.nome === l }" :data-nome="l" @click="scegli(l)">{{ l }}</button>
      <button type="button" class="cst-chip cst-nuova" data-azione="nuova-lavagnetta" @click="emit('nuova-lavagnetta')">＋ nuova lavagnetta</button>
    </div>
  </div>
</template>

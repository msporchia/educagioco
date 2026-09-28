<script setup>
// la scelta di una casella, aperta sotto la riga (docs/costruttore/linguaggio.md)
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
  // { colori, nomi, confronta, coloriDomanda; e per il porto: porto, versi, dove, cose, leggere }
  contesto: { type: Object, required: true },
})
const emit = defineEmits(['scegli', 'chiudi', 'avanti', 'nuova-lavagnetta'])

const valoreDi = () => {
  const [testa, coda] = props.campo.split('.')
  const v = props.riga[testa]
  return coda !== undefined ? (v || [])[Number(coda)] : v
}
const copia = v => (v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v)

const expr = ref(copia(valoreDi()) || { vuoto: true })
const lato = ref(expr.value && expr.value.op ? 'b' : 'a')  // quale pezzo del conto sta cambiando
watch(() => [props.riga.id, props.campo], () => {
  expr.value = copia(valoreDi()) || { vuoto: true }
  lato.value = expr.value && expr.value.op ? 'b' : 'a'
  cond.value = copia(valoreDi()) || condVuota()
  pezzoCond.value = daScegliereCond(cond.value)
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
    const primo = expr.value.vuoto
    expr.value = { op, a: expr.value, b: { n: op === '×' || op === '÷' ? 2 : 1 } }
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

const versi = computed(() => props.contesto.versi || ['destra', 'sinistra'])
const doveLista = computed(() => props.contesto.dove || DOVE)
// anche il posto già scritto, se la riga è arrivata da un altro cantiere
const postiLista = computed(() => Object.keys(POSTI_IN_PAROLE)
  .filter(v => (props.contesto.posti || Object.keys(POSTI_IN_PAROLE)).includes(v) || v === props.riga.dove))
const coseLista = computed(() => props.contesto.cose || COSE)
const latiParole = computed(() => (props.riga.tipo === 'posa' ? LATI_POSA : LATI_PRENDI))
const letture = [...LATI, 'mano']
// nel porto una lavagnetta può tenere un colore: il robot lo legge su una cassa
const nomiColore = computed(() => [...nomi.value.misureColore, ...nomi.value.ordineColore,
                                   ...(props.contesto.porto ? nomi.value.lavagnette : [])])
const colorato = c => ['mattone', 'cassa', 'cassone', 'camion'].includes(c)

// le condizioni: una frase a caselle (docs/costruttore/linguaggio.md)
const condVuota = () => ({ tipo: 'guarda', dove: null, cosa: null, c: true })
const cond = ref(copia(valoreDi()) || condVuota())
const completa = c => (c.tipo === 'confronta' ? !!(c.a && c.cmp && c.b) : !!(c.dove && c.cosa))
const daScegliereCond = c => (c.tipo === 'confronta'
  ? ['a', 'cmp', 'b'].find(k => !c[k]) || null
  : (!c.dove ? 'dove' : !c.cosa ? 'cosa' : null))
const pezzoCond = ref(daScegliereCond(cond.value))
const apriPezzo = k => { pezzoCond.value = pezzoCond.value === k ? null : k }

const coloriDomanda = computed(() => props.contesto.coloriDomanda || props.contesto.colori || [])
const conColore = computed(() => colorato(cond.value.cosa) && coloriDomanda.value.length + nomiColore.value.length > 0)

function cambiaCond(campo, v) {
  cond.value = { ...cond.value, [campo]: v }
  if (!cond.value.colore) delete cond.value.colore
  if (completa(cond.value)) emit('scegli', copia(cond.value))
  pezzoCond.value = daScegliereCond(cond.value) ||
    (campo === 'cosa' && conColore.value ? 'colore' : null)
}
function cambiaCosa(c) {
  const nuova = { ...cond.value, cosa: c }
  if (!colorato(c)) delete nuova.colore
  cond.value = nuova
  cambiaCond('cosa', c)
}
function genere(t) {
  if (cond.value.tipo === t) return
  cond.value = t === 'guarda' ? condVuota() : { tipo: 'confronta', a: null, cmp: null, b: null }
  pezzoCond.value = daScegliereCond(cond.value)
  if (completa(cond.value)) emit('scegli', copia(cond.value))
}

// il quadretto attorno al robot; la mano non è un posto e sta a parte
const INTORNO = [[null, 'sopra', null], ['sinistra', 'robot', 'destra'], ['giu-sinistra', 'sotto', 'giu-destra']]
const INTORNO_PORTO = [[null, 'su', null], ['sinistra', 'robot', 'destra'], [null, 'giu', null]]
const FRECCE_DOVE = { sopra: '↑', sinistra: '←', destra: '→', 'giu-sinistra': '↙', sotto: '↓', 'giu-destra': '↘',
                      su: '↑', giu: '↓' }
const intorno = computed(() => (props.contesto.porto ? INTORNO_PORTO : INTORNO)
  .flat().map(d => (d === 'robot' || doveLista.value.includes(d) ? d : null)))

const nomeColoreDomanda = c => (typeof c === 'string' ? (colore(c) || {}).nome : numeroInParole(c))
const tuttiNomi = computed(() => [...nomi.value.misure, ...nomi.value.lavagnette, ...nomi.value.ordine])

const scegli = v => { emit('scegli', v); emit('avanti') }
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
      <button v-for="v in postiLista" :key="v" type="button" class="cst-chip cst-grosso"
              :class="{ 'cst-su': riga.dove === v }" :data-posto="v" @click="scegli(v)">{{ POSTI_IN_PAROLE[v] }}</button>
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
      <button type="button" class="cst-scelta-fatto" data-azione="fatto" @click="emit('avanti')">fatto</button>
    </template>

    <!-- una condizione: la frase a caselle, e le scelte della casella aperta -->
    <template v-else-if="tipo === 'cond'">
      <div v-if="contesto.confronta" class="cst-fila cst-fila-genere">
        <button type="button" class="cst-chip cst-grosso" :class="{ 'cst-su': cond.tipo !== 'confronta' }" data-genere="guarda" @click="genere('guarda')">👀 guarda</button>
        <button type="button" class="cst-chip cst-grosso" :class="{ 'cst-su': cond.tipo === 'confronta' }" data-genere="confronta" @click="genere('confronta')">⚖️ confronta</button>
      </div>

      <template v-if="cond.tipo !== 'confronta'">
        <div class="cst-frase-domanda">
          <button type="button" class="cst-pezzo cst-pezzo-domanda" data-pezzo-domanda="dove"
                  :class="{ 'cst-su': pezzoCond === 'dove', 'cst-vuoto': !cond.dove }"
                  @click="apriPezzo('dove')">{{ cond.dove ? DOVE_IN_PAROLE[cond.dove] : 'dove?' }}</button>
          <button type="button" class="cst-pezzo cst-pezzo-domanda" data-pezzo-domanda="ce"
                  :class="{ 'cst-su': pezzoCond === 'ce' }"
                  @click="apriPezzo('ce')">{{ cond.c === false ? 'non c\'è' : 'c\'è' }}</button>
          <button type="button" class="cst-pezzo cst-pezzo-domanda" data-pezzo-domanda="cosa"
                  :class="{ 'cst-su': pezzoCond === 'cosa', 'cst-vuoto': !cond.cosa }"
                  @click="apriPezzo('cosa')">{{ cond.cosa ? COSE_IN_PAROLE[cond.cosa] : 'cosa?' }}</button>
          <button v-if="conColore" type="button" class="cst-pezzo cst-pezzo-domanda" data-pezzo-domanda="colore"
                  :class="{ 'cst-su': pezzoCond === 'colore' }"
                  :style="typeof cond.colore === 'string' ? { '--cst-tinta': colore(cond.colore).tinta } : null"
                  @click="apriPezzo('colore')">
            <i class="cst-quadretto" :class="{ 'cst-arcobaleno': !cond.colore }" v-if="!cond.colore || typeof cond.colore === 'string'"></i>
            {{ cond.colore ? nomeColoreDomanda(cond.colore) : 'di qualunque colore' }}
          </button>
        </div>

        <!-- dove: il quadretto attorno al robot -->
        <div v-if="pezzoCond === 'dove'" class="cst-fila cst-fila-intorno">
          <div class="cst-intorno" data-intorno>
            <template v-for="(d, k) in intorno" :key="k">
              <span v-if="d === 'robot'" class="cst-intorno-robot" aria-hidden="true">🤖</span>
              <button v-else-if="d" type="button" class="cst-intorno-cella" :class="{ 'cst-su': cond.dove === d }"
                      :data-dove="d" :aria-label="DOVE_IN_PAROLE[d]" @click="cambiaCond('dove', d)">{{ FRECCE_DOVE[d] }}</button>
              <span v-else></span>
            </template>
          </div>
          <button v-if="doveLista.includes('mano')" type="button" class="cst-chip" :class="{ 'cst-su': cond.dove === 'mano' }"
                  data-dove="mano" @click="cambiaCond('dove', 'mano')">{{ DOVE_IN_PAROLE.mano }}</button>
        </div>

        <div v-else-if="pezzoCond === 'ce'" class="cst-fila">
          <button type="button" class="cst-chip cst-grosso" :class="{ 'cst-su': cond.c !== false }" data-ce="si" @click="cambiaCond('c', true)">c'è</button>
          <button type="button" class="cst-chip cst-grosso" :class="{ 'cst-su': cond.c === false }" data-ce="no" @click="cambiaCond('c', false)">non c'è</button>
        </div>

        <div v-else-if="pezzoCond === 'cosa'" class="cst-fila">
          <button v-for="c in coseLista" :key="c" type="button" class="cst-chip" :class="{ 'cst-su': cond.cosa === c }"
                  :data-cosa="c" @click="cambiaCosa(c)">{{ COSE_IN_PAROLE[c] }}</button>
        </div>

        <!-- un mattone, una cassa, un cassone: di qualunque colore, o di
             uno preciso — scritto, o il nome di chi lo porta («tinta») -->
        <div v-else-if="pezzoCond === 'colore' && conColore" class="cst-fila" data-colori-domanda>
          <button type="button" class="cst-chip cst-colore" :class="{ 'cst-su': !cond.colore }" data-colore-domanda="qualunque"
                  @click="cambiaCond('colore', null)"><i class="cst-quadretto cst-arcobaleno"></i>qualunque</button>
          <button v-for="c in coloriDomanda" :key="c" type="button" class="cst-chip cst-colore"
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
        <div class="cst-frase-domanda">
          <button type="button" class="cst-pezzo" data-pezzo-domanda="a"
                  :class="{ 'cst-su': pezzoCond === 'a', 'cst-vuoto': !cond.a }"
                  @click="apriPezzo('a')">{{ cond.a ? numeroInParole(cond.a) : '?' }}</button>
          <button type="button" class="cst-pezzo cst-pezzo-domanda" data-pezzo-domanda="cmp"
                  :class="{ 'cst-su': pezzoCond === 'cmp', 'cst-vuoto': !cond.cmp }"
                  @click="apriPezzo('cmp')">{{ cond.cmp ? CONFRONTI_IN_PAROLE[cond.cmp] : 'come?' }}</button>
          <button type="button" class="cst-pezzo" data-pezzo-domanda="b"
                  :class="{ 'cst-su': pezzoCond === 'b', 'cst-vuoto': !cond.b }"
                  @click="apriPezzo('b')">{{ cond.b ? numeroInParole(cond.b) : '?' }}</button>
        </div>
        <div v-if="pezzoCond === 'cmp'" class="cst-fila">
          <button v-for="c in CONFRONTI" :key="c" type="button" class="cst-chip" :class="{ 'cst-su': cond.cmp === c }"
                  :data-confronto="c" @click="cambiaCond('cmp', c)">{{ CONFRONTI_IN_PAROLE[c] }}</button>
        </div>
        <!-- le cifre solo a destra: «5 è minore di h» si legge al contrario -->
        <template v-else-if="pezzoCond === 'a' || pezzoCond === 'b'">
          <div class="cst-fila" :class="{ 'cst-cifre': pezzoCond === 'b' }">
            <template v-if="pezzoCond === 'b'">
              <button v-for="n in 11" :key="'n' + n" type="button" class="cst-chip" :data-cifra="n - 1"
                      :class="{ 'cst-su': cond.b && cond.b.n === n - 1 }" @click="cambiaCond('b', { n: n - 1 })">{{ n - 1 }}</button>
            </template>
            <button v-for="n in tuttiNomi" :key="'v' + n" type="button" class="cst-chip cst-nome" :data-nome="n"
                    :class="{ 'cst-su': (cond[pezzoCond] || {}).v === n }" @click="cambiaCond(pezzoCond, { v: n })">{{ n }}</button>
          </div>
          <div v-if="contesto.leggere" class="cst-fila" data-leggi>
            <span class="cst-piccolo">📖 leggi:</span>
            <button v-for="l in letture" :key="'r' + l" type="button" class="cst-chip" :data-leggi="l"
                    :class="{ 'cst-su': (cond[pezzoCond] || {}).leggi === l }"
                    @click="cambiaCond(pezzoCond, { leggi: l })">{{ FRECCE[l] }}</button>
          </div>
          <div v-if="contesto.porto" class="cst-fila">
            <button v-for="c in coloriDomanda" :key="'c' + c" type="button" class="cst-chip cst-colore" :data-colore="c"
                    :class="{ 'cst-su': cond[pezzoCond] === c }"
                    :style="{ '--cst-tinta': colore(c).tinta, '--cst-ombra': colore(c).ombra }"
                    @click="cambiaCond(pezzoCond, c)"><i class="cst-quadretto"></i>{{ colore(c).nome }}</button>
          </div>
        </template>
      </template>
      <button type="button" class="cst-scelta-fatto" data-azione="fatto" @click="emit('avanti')">fatto</button>
    </template>

    <!-- quale lavagnetta scrivere -->
    <div v-else-if="tipo === 'lavagnetta'" class="cst-fila">
      <button v-for="l in nomi.lavagnette" :key="l" type="button" class="cst-chip cst-nome"
              :class="{ 'cst-su': riga.nome === l }" :data-nome="l" @click="scegli(l)">{{ l }}</button>
      <button type="button" class="cst-chip cst-nuova" data-azione="nuova-lavagnetta" @click="emit('nuova-lavagnetta')">＋ nuova lavagnetta</button>
    </div>
  </div>
</template>

<script setup>
// Lo zaino: tre caselle addosso (posti su una figura, non riquadri uguali) e sei tasche vere (docs/
// sotterraneo/roba.md). Una tasca si sceglie, poi si decide (non più "la sola cosa sensata" al primo
// tocco): con sei piene, l'unico modo di liberarne una era usare quello che c'era dentro. Una cosa che
// questa classe non impugna si vede spenta prima di toccarla, e dice il perché — e che si vende al banco.
import { ref, computed, watch, nextTick } from 'vue'
import { figura } from './figura.js'
import Icona from './Icona.vue'
import { cambioDetto } from './cambio.js'
import { pezzoAndante } from '../dati/tessere.js'

const props = defineProps({
  eroe: { type: Object, required: true },     // la scheda di chi scende
  mano: { type: Object, default: null },      // { chiave, em, nome, dice, att, sprite, mani } o niente
  mancina: { type: Object, default: null },   // la seconda arma, o l'ombra di quella a due mani
  corpo: { type: Object, default: null },
  dito: { type: Object, default: null },
  tasche: { type: Array, required: true },    // [{ em, nome, dice } | null]
  att: { type: Number, required: true },
  dif: { type: Number, required: true },
  vita: { type: Number, required: true },
  vitaMax: { type: Number, required: true },
  gemme: { type: Number, required: true },
  torcia: { type: Object, default: null },   // non è in una tasca (accenderla non è una scelta), ma si consuma e si vede qui
  piano: { type: Number, required: true },
  piani: { type: Number, default: null },   // l'abisso non lo sa: "26/" col numero mancante sembrerebbe un guasto
})
const emit = defineEmits(['usa', 'butta', 'riponi', 'chiudi'])

// una tasca ({ dove: 'zaino', i }) o una casella addosso ({ dove: 'mano' }); null è lo stato normale
const scelto = ref(null)

const CASELLE = [
  { dove: 'mano', dice: 'in mano' },
  { dove: 'mancina', dice: 'l\'altra mano' },
  { dove: 'corpo', dice: 'addosso' },
  { dove: 'dito', dice: 'al dito' },
]

const addosso = dove => (dove === 'mano' ? props.mano
  : dove === 'mancina' ? props.mancina
    : dove === 'corpo' ? props.corpo : props.dito)

// un'arma a due mani occupa la mano debole: la casella non è "vuota", ci si mette la stessa arma in ombra
const dueMani = computed(() => !!(props.mano && props.mano.mani === 2))
const spenta = dove => dove === 'mancina' && dueMani.value

const cosa = computed(() => {
  const s = scelto.value
  if (!s) return null
  return s.dove === 'zaino' ? (props.tasche[s.i] || null) : addosso(s.dove)
})

// una tasca svuotata non lascia selezionato il buco: le azioni sotto parlerebbero di una cosa che non c'è più
watch(cosa, c => { if (!c) scelto.value = null })

const azioni = ref(null)

// con lo zaino pieno il pannello è alto quanto lo schermo: le azioni si portano in vista appena si sceglie
function tocca(dove, i = 0) {
  const s = scelto.value
  scelto.value = (s && s.dove === dove && s.i === i) ? null : { dove, i }
  if (scelto.value) nextTick(() => azioni.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
}

// fatto quello che si era scelto, la selezione si spegne: la tasca `i` adesso tiene un'altra cosa
function fai(che, dato) {
  scelto.value = null
  emit(che, dato)
}
const sceltoQui = (dove, i = 0) => {
  const s = scelto.value
  return !!s && s.dove === dove && (s.i || 0) === i
}

const ritratto = computed(() => figura(pezzoAndante(props.eroe.sprite, 'fermo', 0), { scala: 4 }))
const inPugno = computed(() => (props.mano && props.mano.sprite
  ? figura(props.mano.sprite, { scala: 2 }) : null))
// dall'altro lato della figura, come nel campo: uno scudo imbracciato che non si vede è una casella che non racconta niente
const inBraccio = computed(() => (props.mancina && props.mancina.sprite && !dueMani.value
  ? figura(props.mancina.sprite, { scala: 2 }) : null))

// i numeri vengono prima della frase, perché sono quelli che fanno decidere
const numeri = computed(() => {
  const c = cosa.value
  if (!c) return []
  const n = []
  if (c.att) n.push(`⚔️ ${c.att}`)
  if (c.dif) n.push(`🛡️ ${c.dif}`)
  if (c.vita) n.push(`❤️ +${c.vita}`)
  if (c.cura) n.push(`❤️ ${c.cura} subito`)
  if (c.cresce) n.push(`❤️ +${c.cresce} per sempre`)
  if (c.luce) n.push('🔥 vedi più lontano')
  if (c.gemme) n.push(`💎 ×${(1 + c.gemme).toString().replace('.', ',')}`)
  if (c.mani === 2) n.push('✋✋ due mani')
  return n
})

// cosa vuol dire "usa" qui: sta nella vista e non nel motore perché è una parola, non una regola
const verbo = computed(() => {
  const c = cosa.value
  if (!c) return ''
  if (c.dove === 'mano') return 'la impugno'
  if (c.dove === 'mancina') return 'me lo imbraccio'
  if (c.dove === 'corpo') return 'me la metto'
  if (c.dove === 'dito') return 'me lo infilo'
  if (c.usa === 'cura') return 'la bevo'
  if (c.usa === 'luce') return 'l\'accendo'
  if (c.usa === 'porta') return 'apro una porta'
  return 'la uso'
})

// la frase la compone cambio.js, lo stesso posto da cui la prende il banco del mercante
const cambio = computed(() => {
  const c = cosa.value
  if (!c || !c.dove || scelto.value.dove !== 'zaino') return ''
  if (c.dove === 'dito') return c.dice
  const campo = c.dove === 'mano' ? 'att' : 'dif'   // scudo e armatura cambiano la stessa cosa
  const gia = addosso(c.dove)
  return cambioDetto({ campo, addosso: gia ? gia.chiave : null, delta: (c[campo] || 0) - (gia ? (gia[campo] || 0) : 0) },
                     () => (gia ? gia.nome : ''))
})
</script>

<template>
  <div class="sot-zaino">
    <p class="sot-riepilogo em">
      <span class="sot-polso" :style="{ '--sot-polso': vita / vitaMax > 0.6 ? '#4fce7c'
                                        : vita / vitaMax > 0.3 ? '#f0b429' : '#e0432f' }">
        <i :style="{ width: (vita / vitaMax) * 100 + '%' }"></i>
        <b>{{ vita }}/{{ vitaMax }}</b>
      </span>
      ⚔️ {{ att }} · 🛡️ {{ dif }} · 💎 {{ gemme }} · 🪜 {{ piano }}<template v-if="piani">/{{ piani }}</template>
    </p>

    <p v-if="torcia" class="sot-torcia-riga" data-torcia-zaino>
      <Icona sprite="torcia" em="🔥" :emAlto="16" />
      <i class="sot-lume"><u :style="{ height: torcia.quota * 100 + '%' }"></u></i>
      <b>ancora {{ torcia.resta }} {{ torcia.resta === 1 ? 'stanza' : 'stanze' }}</b>
      <em v-if="torcia.scorta">
        e {{ torcia.scorta }} alla cintura: {{ torcia.scorta === 1 ? 'si accende' : 'si accendono' }} da sé
      </em>
      <em v-else>poi si spegne</em>
    </p>

    <div class="sot-corredo">
      <button v-for="c in CASELLE" :key="c.dove" class="sot-slot"
              :class="[`sot-slot-${c.dove}`, { 'sot-vuota': !addosso(c.dove) && !spenta(c.dove),
                                               'sot-ombra': spenta(c.dove),
                                               'sot-scelto': sceltoQui(c.dove) }]"
              :data-casella="c.dove" :disabled="spenta(c.dove)" @click="tocca(c.dove)">
        <!-- la mano occupata da un'arma a due mani: la stessa figura, in ombra e girata -->
        <template v-if="spenta(c.dove)">
          <span class="sot-dentro"><Icona :sprite="mano.sprite" :em="mano.em" /></span>
          <i>a due mani</i>
        </template>
        <template v-else>
          <span class="sot-dentro">
            <Icona v-if="addosso(c.dove)"
                   :sprite="addosso(c.dove).sprite" :em="addosso(c.dove).em" />
            <b v-else class="em">·</b>
          </span>
          <i>{{ addosso(c.dove) ? addosso(c.dove).nome : c.dice }}</i>
        </template>
      </button>

      <div class="sot-figura">
        <span class="sot-ritratto" :style="ritratto ? ritratto.gabbia : null">
          <i v-if="ritratto" :style="ritratto.pezzo"></i>
          <b v-else class="em">{{ eroe.em }}</b>
        </span>
        <!-- l'arma si posa accanto al pugno, come nel campo -->
        <span v-if="inPugno" class="sot-impugnata" :style="inPugno.gabbia">
          <i :style="inPugno.pezzo"></i>
        </span>
        <span v-if="inBraccio" class="sot-imbracciata" :style="inBraccio.gabbia">
          <i :style="inBraccio.pezzo"></i>
        </span>
      </div>
    </div>

    <div class="sot-tasche">
      <button v-for="(t, i) in tasche" :key="i" class="sot-tasca"
              :class="{ 'sot-vuota': !t, 'sot-scelto': sceltoQui('zaino', i),
                        'sot-altrui': t && t.nonPuoi }"
              :disabled="!t" :data-tasca="i" @click="tocca('zaino', i)">
        <span class="sot-dentro">
          <Icona v-if="t" :sprite="t.sprite" :em="t.em" />
          <b v-else class="em">·</b>
          <!-- si vede prima di toccare la tasca -->
          <b v-if="t && t.nonPuoi" class="sot-vietata em">✋</b>
        </span>
        <em>{{ t ? t.nome : '' }}</em>
      </button>
    </div>

    <!-- sotto la griglia, non sopra: la roba non balla sotto il dito mentre si sceglie -->
    <div v-if="cosa" ref="azioni" class="sot-azioni">
      <p class="sot-dice">
        <Icona :sprite="cosa.sprite" :em="cosa.em" :emAlto="20" /> <b>{{ cosa.nome }}</b>
      </p>
      <p v-if="numeri.length" class="sot-numeri em">{{ numeri.join(' · ') }}</p>
      <p class="sot-detto">{{ cosa.dice }}</p>
      <p v-if="cosa.nonPuoi" class="sot-nonpuoi" data-non-puoi>
        <span class="em">✋</span> {{ cosa.nonPuoi }}<i v-if="cosa.prezzo">Al banco te la comprano.</i>
      </p>
      <p v-else-if="cambio" class="sot-cambio em">{{ cambio }}</p>

      <template v-if="scelto.dove === 'zaino'">
        <button v-if="!cosa.nonPuoi" class="sot-grosso" data-azione="usa"
                @click="fai('usa', scelto.i)">
          {{ verbo }}
        </button>
        <button class="sot-grosso sot-chiaro" data-azione="butta" @click="fai('butta', scelto.i)">
          <span class="em">🫳</span> la lascio per terra
        </button>
      </template>
      <button v-else class="sot-grosso sot-chiaro" data-azione="riponi"
              @click="fai('riponi', scelto.dove)">
        <span class="em">🎒</span> nello zaino
      </button>
    </div>

    <button class="sot-grosso sot-chiaro" data-azione="chiudi" @click="$emit('chiudi')">
      chiudo
    </button>
  </div>
</template>

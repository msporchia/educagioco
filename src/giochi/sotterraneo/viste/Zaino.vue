<script setup>
// Lo zaino, nello stesso stile della bottega: l'eroe con le quattro caselle intorno, le sei tasche in griglia e
// il pannello del pezzo scelto col confronto e i tasti (docs/sotterraneo/bottega.md, "La bottega e lo zaino").
// Una tasca si sceglie, poi si decide: con sei piene, l'unico modo di liberarne una era usare quello che c'era
// dentro. Una cosa che questa classe non impugna si vede spenta prima di toccarla, e dice il perché.
import { ref, computed, watch, nextTick } from 'vue'
import Cornice from './Cornice.vue'
import Addosso from './Addosso.vue'
import Casella from './Casella.vue'
import Pannello from './Pannello.vue'
import Icona from './Icona.vue'

const props = defineProps({
  eroe: { type: Object, required: true },     // la scheda di chi scende
  mano: { type: Object, default: null },      // { chiave, em, nome, att, sprite, mani, … } o niente
  mancina: { type: Object, default: null },   // la seconda arma, o lo scudo
  corpo: { type: Object, default: null },
  dito: { type: Object, default: null },
  tasche: { type: Array, required: true },    // [{ chiave, …COSE, nonPuoi, prova } | null]
  att: { type: Number, required: true },
  dif: { type: Number, required: true },
  vita: { type: Number, required: true },
  vitaMax: { type: Number, required: true },
  gemme: { type: Number, required: true },
  torcia: { type: Object, default: null },   // non è in una tasca (accenderla non è una scelta), ma si consuma e si vede qui
  piano: { type: Number, required: true },
  piani: { type: Number, default: null },   // l'abisso non lo sa: "26/" col numero mancante sembrerebbe un guasto
  sopra: { type: Boolean, default: false },  // lo zaino della terra di sopra: ci si veste, ma non si butta niente
})
const emit = defineEmits(['usa', 'butta', 'riponi', 'chiudi', 'fuori'])

// una tasca ({ dove: 'zaino', i }) o una casella addosso ({ dove: 'mano' }); null è lo stato normale
const scelto = ref(null)

const addosso = dove => (dove === 'mano' ? props.mano
  : dove === 'mancina' ? props.mancina
    : dove === 'corpo' ? props.corpo : props.dito)
const dueMani = computed(() => !!(props.mano && props.mano.mani === 2))

const cosa = computed(() => {
  const s = scelto.value
  if (!s) return null
  return s.dove === 'zaino' ? (props.tasche[s.i] || null) : addosso(s.dove)
})
// una tasca svuotata non lascia selezionato il buco: le azioni sotto parlerebbero di una cosa che non c'è più
watch(cosa, c => { if (!c) scelto.value = null })

const pannello = ref(null)
// con lo schermo basso il pannello può finire sotto il bordo: si porta in vista appena si sceglie
function tocca(dove, i = 0) {
  if (dove === 'mancina' && dueMani.value) return
  const s = scelto.value
  scelto.value = (s && s.dove === dove && s.i === i) || (dove !== 'zaino' && !addosso(dove)) ? null : { dove, i }
  if (scelto.value) nextTick(() => pannello.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
}
// fatto quello che si era scelto, la selezione si spegne: la tasca `i` adesso tiene un'altra cosa
function fai(che, dato) {
  scelto.value = null
  emit(che, dato)
}
const sceltoQui = (dove, i = 0) => !!scelto.value && scelto.value.dove === dove && (scelto.value.i || 0) === i

// cosa vuol dire "usa" qui: sta nella vista e non nel motore perché è una parola, non una regola
const verbo = computed(() => {
  const c = cosa.value
  if (!c) return ''
  if (c.dove === 'mano') return 'Impugna'
  if (c.dove === 'mancina') return 'Imbraccia'
  if (c.dove) return 'Indossa'
  if (c.usa === 'cura' || c.usa === 'cresci') return 'Bevi'
  if (c.usa === 'luce') return 'Accendi'
  if (c.usa === 'porta') return 'Apri una porta'
  return 'Usa'
})

const nelloZaino = computed(() => !!scelto.value && scelto.value.dove === 'zaino')
const prova = computed(() => (nelloZaino.value && cosa.value && cosa.value.prova && cosa.value.prova.prima
  ? cosa.value.prova : null))
const note = computed(() => {
  const c = cosa.value
  if (!c) return []
  if (!nelloZaino.value) return [{ testo: 'Ce l\'hai addosso.', tono: 'tenue' }]
  if (c.nonPuoi) return [{ em: '✋', testo: c.nonPuoi + (c.prezzo ? ' Il rigattiere te lo compra.' : ''), tono: 'ambra', dato: 'data-non-puoi' }]
  if (c.prova && c.prova.bloccata) return [{ em: '✋', testo: `${props.mano.nome} vuole tutte e due le mani.`, tono: 'ambra' }]
  return []
})
const polso = computed(() => (props.vita / props.vitaMax > 0.6 ? '#4fce7c' : props.vita / props.vitaMax > 0.3 ? '#f0b429' : '#e0432f'))
</script>

<template>
  <Cornice data-zaino @chiudi="$emit('chiudi')" @fuori="e => $emit('fuori', e)">
    <header class="sot-targa">
      <span class="sot-targa-ritratto sot-targa-em em">🎒</span>
      <span class="sot-targa-nome">
        <b>Lo zaino</b>
        <i v-if="sopra" class="em">🏘️ al villaggio</i>
        <i v-else class="em">🪜 piano {{ piano }}<template v-if="piani">/{{ piani }}</template></i>
      </span>
    </header>

    <Addosso :eroe="eroe" :mano="mano" :mancina="mancina" :corpo="corpo" :dito="dito"
             :scelto="scelto && scelto.dove !== 'zaino' ? scelto.dove : null" :va="prova ? prova.dove : null"
             @tocca="tocca">
      <span class="sot-polso" :style="{ '--sot-polso': polso }">
        <i :style="{ width: (vita / vitaMax) * 100 + '%' }"></i>
        <b>{{ vita }}/{{ vitaMax }}</b>
      </span>
      <span class="em"><b>⚔️</b> {{ att }}</span>
      <span class="em"><b>🛡️</b> {{ dif }}</span>
      <span class="em sot-gemme-tue"><b>💎</b> {{ gemme }}</span>
    </Addosso>

    <p v-if="torcia" class="sot-torcia-riga" data-torcia-zaino>
      <Icona sprite="torcia" em="🔥" :emAlto="16" />
      <i class="sot-lume"><u :style="{ height: torcia.quota * 100 + '%' }"></u></i>
      <b>ancora {{ torcia.resta }} {{ torcia.resta === 1 ? 'stanza' : 'stanze' }}</b>
      <em v-if="torcia.scorta">
        e {{ torcia.scorta }} alla cintura: {{ torcia.scorta === 1 ? 'si accende' : 'si accendono' }} da sé
      </em>
      <em v-else>poi si spegne</em>
    </p>

    <div class="sot-banco-griglia">
      <div class="sot-griglia sot-tasche">
        <Casella v-for="(t, i) in tasche" :key="i" :cosa="t" vuota="·" :segno="t && t.nonPuoi ? '✋' : ''"
                 :spenta="!!(t && t.nonPuoi)" :scelta="sceltoQui('zaino', i)" :disabled="!t"
                 :data-tasca="i" :data-cosa="t ? t.chiave : null" @click="tocca('zaino', i)" />
      </div>
    </div>

    <div v-if="cosa" ref="pannello" class="sot-banco-piede">
      <Pannello :cosa="cosa" :prova="prova" :note="note">
        <div v-if="nelloZaino" class="sot-due-tasti">
          <button v-if="!cosa.nonPuoi" type="button" class="sot-grosso" data-azione="usa"
                  :disabled="!!(cosa.prova && cosa.prova.bloccata)" @click="fai('usa', scelto.i)">{{ verbo }}</button>
          <button v-if="!sopra" type="button" class="sot-grosso sot-chiaro" data-azione="butta" @click="fai('butta', scelto.i)">
            <span class="em">🫳</span> Butta
          </button>
        </div>
        <button v-else type="button" class="sot-grosso sot-chiaro" data-azione="riponi" @click="fai('riponi', scelto.dove)">
          <span class="em">🎒</span> Togli
        </button>
      </Pannello>
    </div>
  </Cornice>
</template>

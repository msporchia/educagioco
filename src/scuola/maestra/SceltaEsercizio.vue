<script setup>
// L'esercizio di un blocco della lezione: una o più parti, ognuna con la sua intensità, e il gioco in cui si fa (docs/scuola/esercizi.md)
import { computed } from 'vue'
import { valido, descrivi, giochiPer, giocoDi, PESI, MAX_PARTI } from '../comune/esercizi.js'
import ParteEsercizio from './ParteEsercizio.vue'

const props = defineProps({ modelValue: { type: Object, required: true }, dove: { type: String, default: 'blocco' } })
const emit = defineEmits(['update:modelValue'])

const copia = x => JSON.parse(JSON.stringify(x))
const senzaGioco = ({ gioco, ...resto }) => resto
const e = computed(() => props.modelValue)

// le parti come le vede l'editor: un esercizio semplice è una parte sola, «normale»
const parti = computed(() => {
  const x = senzaGioco(e.value)
  return x.tipo === 'insieme' ? x.parti : [{ esercizio: x, peso: 'normale' }]
})

// il gioco scelto resta finché accetta l'esercizio; se no si torna alle domande
const conGioco = (es, gioco) => (gioco && gioco !== 'schede' && giochiPer(es).some(g => g.id === gioco) ? { ...es, gioco } : es)
function scrivi(nuove, gioco = giocoDi(e.value)) {
  const es = nuove.length === 1 ? copia(nuove[0].esercizio) : { tipo: 'insieme', parti: copia(nuove) }
  emit('update:modelValue', conGioco(es, gioco))
}

const cambiaParte = (i, esercizio) => scrivi(parti.value.map((p, j) => (j === i ? { ...p, esercizio } : p)))
const cambiaPeso = (i, peso) => scrivi(parti.value.map((p, j) => (j === i ? { ...p, peso } : p)))
const togliParte = i => scrivi(parti.value.filter((_, j) => j !== i))
// una parte nuova parte dalla stessa voce dell'ultima, «un po'»: di solito si aggiunge un ripasso
const aggiungiParte = () => scrivi([...parti.value, { esercizio: copia(parti.value.at(-1).esercizio), peso: 'poco' }])

const giochi = computed(() => (valido(senzaGioco(e.value)) ? giochiPer(senzaGioco(e.value)) : []))
const gioco = computed(() => giochi.value.find(g => g.id === giocoDi(e.value)) || null)
const scegliGioco = id => scrivi(parti.value, id)
</script>

<template>
  <div class="scelta-esercizio" :data-esercizio="dove">
    <div v-for="(p, i) in parti" :key="i" class="parte" :class="{ insieme: parti.length > 1 }" :data-parte="i">
      <div v-if="parti.length > 1" class="testa-parte">
        <span class="titoletto">Quanto</span>
        <div class="fila">
          <button v-for="x in PESI" :key="x.id" class="tessera" :class="{ scelta: p.peso === x.id }" :aria-pressed="p.peso === x.id"
                  :data-peso="x.id" @click="cambiaPeso(i, x.id)">{{ x.nome }}</button>
        </div>
        <button class="togli" aria-label="togli questa parte" data-azione="togli-parte" @click="togliParte(i)">✕</button>
      </div>
      <ParteEsercizio :model-value="p.esercizio" @update:model-value="x => cambiaParte(i, x)" />
    </div>

    <button v-if="parti.length < MAX_PARTI" class="tessera aggiungi" data-azione="aggiungi-parte" @click="aggiungiParte">
      ＋ Aggiungi un'altra cosa
    </button>
    <p v-if="parti.length === 1" class="nota">Per esempio tanta tabellina dell'8 e un po' di ripasso del 3, 4, 5 e 6.</p>

    <div v-if="giochi.length > 1" class="gruppo">
      <span class="titoletto">In che gioco</span>
      <div class="fila">
        <button v-for="g in giochi" :key="g.id" class="tessera" :class="{ scelta: gioco?.id === g.id }" :aria-pressed="gioco?.id === g.id"
                :data-gioco="g.id" @click="scegliGioco(g.id)">{{ g.nome }}</button>
      </div>
      <p v-if="gioco" class="nota">{{ gioco.spiega }}</p>
    </div>

    <p class="descrizione" :class="{ storta: !valido(e) }" data-descrizione>
      {{ valido(e) ? descrivi(e) : 'Così l\'esercizio non chiede niente: cambia i gradini o le domande.' }}
    </p>
  </div>
</template>

<style scoped>
.scelta-esercizio { display:flex; flex-direction:column; gap:12px }
.parte.insieme { display:flex; flex-direction:column; gap:12px; padding:12px; border-radius:var(--raggio-piccolo); border:1px solid var(--tessera) }
.testa-parte { display:flex; align-items:center; gap:8px; flex-wrap:wrap }
.testa-parte .fila { flex:1 }
.togli { border:0; background:none; font-size:18px; cursor:pointer; padding:4px 8px }
.aggiungi { align-self:flex-start }
.gruppo { display:flex; flex-direction:column; gap:6px }
.titoletto { font-size:14px; font-weight:600 }
.descrizione { font-size:14px; font-weight:600; padding:8px 12px; border-radius:var(--raggio-piccolo); background:var(--tessera) }
.descrizione.storta { background:#fff0e6; color:#b4603f }
</style>

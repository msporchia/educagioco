<script setup>
// Il foglio di un animale: come sta (pancia, pelo, gioco), il nome, i vestiti. Curarlo si fa sul prato: la ciotola, la tinozza, un tocco per giocare; spostarlo è tenerlo premuto
// (docs/fattoria3d/cura-sul-prato.md). ✕ in alto a destra. Il ritratto lo fotografa `anteprime.js` (`bestia:<id>`).
import { ref, computed, watch, onMounted } from 'vue'
import { BISOGNI, CHIAVI, curabile, comeSta } from '../dati/bestie.js'
import { cosaFare } from './bestia-pura.js'
import '../stile-bestia.css'

const props = defineProps({
  id: { type: String, required: true },
  nome: { type: String, default: '' },
  stato: { type: Object, required: true },          // { pancia, pelo, gioco }: una fotografia, non la bestia viva
  messaggio: { type: String, default: '' },
  anteprima: { type: Function, default: null },
  anteprimaPronta: { type: Function, default: null },
  vestiario: { type: Array, default: () => [] },     // gli addobbi che le stanno (Cura.vestiarioDi): se ce n'è, c'è il tasto «Negozio»
})
const emit = defineEmits(['nome', 'negozio', 'chiudi'])

const b = computed(() => curabile(props.id))
const pieno = k => (props.stato[k] ?? 0) > 0.93

const ritratto = ref('')
async function disegna() {
  const t = 'bestia:' + props.id
  const pronta = props.anteprimaPronta && props.anteprimaPronta(t)
  if (pronta) { ritratto.value = pronta; return }
  if (!props.anteprima) return
  const url = await props.anteprima(t)
  if (url) ritratto.value = url
}
watch(() => props.id, disegna)
onMounted(disegna)

</script>

<template>
  <div class="f3-foglio f3-colonna f3-bes" data-f3="bestia" :data-bestia="id">
    <header class="f3-bes-asse"><span aria-hidden="true">{{ b.emoji }}</span><h2 data-f3="bestia-nome">{{ nome }}</h2></header>
    <button class="f3-chiudi f3-bes-x" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-bes-testa">
      <div class="f3-bes-ritratto" data-f3="bestia-ritratto">
        <img v-if="ritratto" :src="ritratto" :alt="'Ritratto di ' + nome" draggable="false">
        <span v-else class="f3-bes-attesa" aria-hidden="true">{{ b.emoji }}</span>
      </div>
      <p class="f3-bes-come" data-f3="bestia-come">{{ comeSta(stato, nome) }}</p>
    </div>
    <div class="f3-corpo f3-bes-corpo">
      <section v-for="k in CHIAVI" :key="k" class="f3-bes-blocco" :data-bisogno="k">
        <div class="f3-bes-riga">
          <b>{{ BISOGNI[k].icona }} {{ BISOGNI[k].nome }}</b>
          <span class="f3-bes-barra" role="img" :aria-label="Math.round(stato[k] * 100) + ' per cento'"><i :style="{ width: Math.round(stato[k] * 100) + '%', background: BISOGNI[k].colore }"></i></span>
          <em>{{ pieno(k) ? 'a posto' : Math.round(stato[k] * 100) + '%' }}</em>
        </div>
      </section>
      <div class="f3-bes-azioni">
        <button type="button" class="f3-bes-az" data-azione="nome" @click="emit('nome')">✎ Nome</button>
        <button v-if="vestiario.length" type="button" class="f3-bes-az" data-azione="negozio" data-f3="bestia-vestiario" @click="emit('negozio')">🛍️ Negozio<small>vestilo</small></button>
      </div>
</div>
    <p class="f3-bes-msg" data-f3="bestia-msg">{{ messaggio || cosaFare(stato, nome) }}</p>
  </div>
</template>

<script setup>
/* La traduzione di una parola toccata: una nuvoletta sopra la parola, per
   un paio di secondi, che il dito attraversa. Se il tocco è costato il
   guadagno della domanda lo dice anche lei, oltre all'indicatore delle
   monete.

   Con `chiede` è invece la domanda di prima, quando il tocco costerebbe:
   una bolla accanto alla parola, non un velo, con «Sì, dimmelo» e «No, ci
   provo». I due tasti sono ciechi per 320 ms (docs/core/interfaccia.md), e
   la finestra riparte a ogni domanda nuova: la bolla resta la stessa
   istanza. Un dito appoggiato altrove vale «no»: la bolla non blocca niente. */
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  parola: { type: String, required: true },
  it: { type: String, default: '' },
  costa: { type: Boolean, default: false },
  chiede: { type: Object, default: null },     // { perche, chiede, costo } di domandaDelTocco
  sotto: { type: Boolean, default: false },    // sotto la parola: sopra non ci sta
  x: { type: Number, required: true },
  y: { type: Number, required: true },
})
const emit = defineEmits(['si', 'no'])

const CIECA = 320
const pronta = ref(false)
let timer = 0
watch(() => props.chiede && props.parola, v => {
  clearTimeout(timer)
  pronta.value = false
  if (v) timer = setTimeout(() => { pronta.value = true }, CIECA)
}, { immediate: true })
const radice = ref(null)
function fuori(e) {
  if (props.chiede && radice.value && !(e.target instanceof Node && radice.value.contains(e.target))) emit('no')
}
onMounted(() => document.addEventListener('pointerdown', fuori, true))
onUnmounted(() => { clearTimeout(timer); document.removeEventListener('pointerdown', fuori, true) })

const premi = cosa => { if (pronta.value) emit(cosa) }
</script>

<template>
  <Teleport to="body">
    <div v-if="chiede" ref="radice" class="ing-bolla ing-bolla-chiede" :class="{ 'ing-bolla-sotto': sotto }" data-svela
         :data-pronta="pronta ? '1' : '0'" :style="{ left: x + 'px', top: y + 'px' }">
      <b class="ing-bolla-parola">{{ parola }}</b>
      <p>{{ chiede.perche }} {{ chiede.chiede }}</p>
      <small>{{ chiede.costo }}</small>
      <div class="ing-bolla-tasti">
        <button type="button" data-azione="svela-si" @click="premi('si')">Sì, dimmelo</button>
        <button type="button" data-azione="svela-no" @click="premi('no')">No, ci provo</button>
      </div>
    </div>
    <div v-else class="ing-bolla" data-traduzione :style="{ left: x + 'px', top: y + 'px' }">
      <b>{{ parola }}</b> = {{ it || '…' }}
      <small v-if="costa">questa domanda non paga</small>
    </div>
  </Teleport>
</template>

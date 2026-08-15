<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL FOGLIO — quello che sale dal basso quando si tocca il campo.

   Prende il posto del banco: prima sotto al campo c'era sempre, aperta,
   una tastiera di bottoni che occupava metà schermo anche quando non
   serviva a niente. Adesso lo schermo è tutto campo, e il foglio sale
   solo quando c'è qualcosa da decidere — che torre costruire qui, cosa
   fare di questa torre, e il conto da fare per pagarla.

   Due cose che il foglio fa e che non si vedono:

   · **dice quanto è alto**. Il campo non si ferma mentre si calcola —
     un minimo di fretta ci vuole — quindi il campo deve restare
     visibile: la telecamera rimpicciolisce di quanto il foglio copre,
     e per farlo deve saperlo. Da qui esce quel numero.
   · **non ruba il tocco a tutto lo schermo**. Il velo sopra il campo
     chiude il foglio, ma è solo un velo: sotto si continua a vedere
     la battaglia, che è metà del motivo per cui questa roba esiste.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  aperto: { type: Boolean, default: false },
  /* il titolino in cima, e se si può tornare indietro invece di chiudere */
  titolo: { type: String, default: '' },
  indietro: { type: Boolean, default: false },
})
const emit = defineEmits(['chiudi', 'indietro', 'altezza'])

const pannello = ref(null)
let osserva = null

/* quanto copre: zero quando è chiuso, la sua altezza quando è aperto */
function misura() {
  const h = props.aperto && pannello.value ? pannello.value.getBoundingClientRect().height : 0
  emit('altezza', Math.round(h))
}

onMounted(() => {
  if (window.ResizeObserver) {
    osserva = new ResizeObserver(misura)
    if (pannello.value) osserva.observe(pannello.value)
  }
  misura()
})
onUnmounted(() => osserva?.disconnect())
watch(() => props.aperto, () => nextTick(misura))
</script>

<template>
  <div class="velina" :class="{ via: !aperto }" @pointerdown.self="$emit('chiudi')"></div>
  <div ref="pannello" class="foglio" :class="{ via: !aperto }">
    <div class="maniglia"></div>
    <div v-if="titolo || indietro" class="cima">
      <button v-if="indietro" class="tondo" aria-label="indietro" @click="$emit('indietro')">‹</button>
      <b>{{ titolo }}</b>
      <button class="tondo chiudi" aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    </div>
    <slot></slot>
  </div>
</template>

<style scoped src="./foglio.css"></style>

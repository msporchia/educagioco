<script setup>
// Lo stop dello scontro (docs/sotterraneo/pericolo.md): il mostro ringhia, lo scontro si ferma un attimo e si
// sceglie. Sta al posto della domanda, dentro la stessa modale: si vede chi ringhia e com'è andato l'ultimo scambio.
// Non calcola niente: i numeri li prepara il motore. Per i primi 320 ms i tasti non sentono il tocco (il click
// che il dito lascia dietro alla risposta atterrerebbe qui: docs/core/interfaccia.md, «I tempi»).
import { ref, onMounted, onUnmounted } from 'vue'
import { CIECA } from '../../pausa.js'
import { DETTO_DEL_PERICOLO } from '../motore/pericolo.js'

defineProps({
  perche: { type: String, required: true },   // 'duro' | 'poca' | 'ultimo' (motore/pericolo.js)
  em: { type: String, default: '' },
  nome: { type: String, default: '' },
  vita: { type: Number, required: true },
  male: { type: Number, required: true },     // il colpo pieno, quello che arriva sbagliando
  graffio: { type: Number, required: true },  // e quello che passa anche rispondendo bene: il costo di scappare
  puoiBere: { type: Boolean, default: false },
  puoiScappare: { type: Boolean, default: true },   // falso se il graffio della fuga lo farebbe cadere: il tasto non c'è
  cura: { type: Number, default: 0 },         // quanto rende la pozione che si berrebbe (0: l'elisir)
})
const emit = defineEmits(['bevi', 'scappa', 'continua'])

const pronto = ref(false)
let cieca = 0
onMounted(() => { cieca = setTimeout(() => { pronto.value = true }, CIECA) })
onUnmounted(() => clearTimeout(cieca))

const scegli = che => { if (pronto.value) emit(che) }
</script>

<template>
  <div class="sot-ringhio" data-ringhio :data-perche="perche" :data-pronto="pronto || null" role="alertdialog">
    <b class="sot-ringhio-titolo"><span class="em">{{ em }}</span> {{ nome }} ringhia!</b>
    <p class="sot-ringhio-detto">{{ DETTO_DEL_PERICOLO[perche] }}</p>
    <p class="sot-ringhio-conto em">
      ❤️ <b>{{ vita }}</b> · sbagliando ti toglie <b>{{ male }}</b>
    </p>
    <button v-if="puoiBere" type="button" class="sot-grosso sot-ringhio-bevi" data-azione="ringhio-bevi" @click="scegli('bevi')">
      <span class="em">🧪</span> bevi
      <small v-if="cura">❤️ +{{ cura }}</small>
    </button>
    <button v-if="puoiScappare" type="button" class="sot-grosso sot-chiaro" data-azione="ringhio-scappa" @click="scegli('scappa')">
      <span class="em">🏃</span> scappo via
      <small>ti graffia ❤️ −{{ graffio }}</small>
    </button>
    <button type="button" class="sot-grosso sot-chiaro" data-azione="ringhio-continua" @click="scegli('continua')">
      <span class="em">⚔️</span> continuo
    </button>
  </div>
</template>

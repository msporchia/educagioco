<script setup>
// Le domande di un esercizio, una dopo l'altra, con la Domanda di casa. Chi la monta decide quando basta. docs/scuola/bambini.md
import { shallowRef } from 'vue'
import Domanda from '../../../quiz/Domanda.vue'
import { pescatore } from '../../comune/esercizi.js'

const props = defineProps({ esercizio: { type: Object, required: true } })
const emit = defineEmits(['risposta'])
const pesca = pescatore(props.esercizio)
const ora = shallowRef(pesca.prossima())

// la domanda nuova nella stessa istanza: Domanda.vue si azzera da sé (docs/core/interfaccia.md)
function risposto(e) {
  emit('risposta', { domanda: ora.value.domanda, ...e })
  ora.value = pesca.prossima()
}
</script>

<template>
  <div class="domande">
    <Domanda :domanda="ora.domanda" :pittori="ora.pittori" :titolo="ora.titolo" @risposto="risposto" />
  </div>
</template>

<style scoped>
.domande { position: relative; flex: 1; min-height: 0 }
/* niente velo scuro sfocato sopra la pagina: la carta sta sul fondo chiaro, e i PC lenti non pagano il blur */
.domande :deep(.qz-velo) { background: none; backdrop-filter: none; animation: none }
</style>

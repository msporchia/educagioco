<script setup>
// tacca a tre posizioni per un pezzo di scuola appeso a un gioco (niente scala in mezzi anni: non è una domanda). Un estremo è sempre chiuso (vedi docs/genitori/ritocchi.md). Non salva niente.
import { computed } from 'vue'
import Tre from './Tre.vue'
import { anniInLettere } from './lettere.js'

const props = defineProps({
  nome: { type: String, required: true },
  /* `si` · `no` · `difetto`, com'è messo adesso */
  scelto: { type: String, default: 'difetto' },
  /* quello che la partenza di quest'età scriverebbe: `true` vuol dire
     che a quest'età questo pezzo non si dà ancora per saputo */
  attesoSpento: { type: Boolean, default: false },
  /* cosa si perde spegnendolo, con le parole di `data/saperi.js`: senza
     questa riga si spegne a naso, e a naso si spegne troppo */
  spegne: { type: String, default: '' },
  eta: { type: Number, default: null },
  chiave: { type: String, default: '' },
})
const emit = defineEmits(['applica', 'chiudi'])

const SCELTE = computed(() => [
  { chiave: 'no', nome: 'Non l\'ha ancora fatto',
    che: props.spegne || 'le domande che lo danno per scontato spariscono da tutti i giochi' },
  { chiave: 'difetto', nome: 'Come dice l\'età', che: 'decide la sua età, come per tutti' },
  { chiave: 'si', nome: 'L\'ha già fatto',
    che: 'glielo diamo per saputo anche se l\'età dice di no' },
])

const inLettere = anniInLettere
const spiega = computed(() => (props.attesoSpento
  ? 'a quest\'età non l\'ha ancora fatto'
  : 'a quest\'età lo diamo per saputo') +
  (props.eta != null ? ` (${inLettere(props.eta)})` : ''))

const bloccate = computed(() => [props.attesoSpento ? 'no' : 'si'])
</script>

<template>
  <Tre radice="sapere-tara" tasti="sapere-tara-verso" ora="sapere-ora" :chiave="chiave"
       titolo="Questo pezzo di scuola:" :scelte="SCELTE" :scelto="scelto"
       :spiega="spiega" :bloccate="bloccate"
       :versi="['verso non l\'ha ancora fatto', 'verso l\'ha già fatto']"
       @applica="emit('applica', $event)" @chiudi="emit('chiudi')" />
</template>

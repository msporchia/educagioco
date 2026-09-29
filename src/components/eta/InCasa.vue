<script setup>
// la tacca di un gioco, ◀ Come dice l'età ▶: le tre posizioni e il movimento sono di Tre.vue, qui solo le parole (vedi docs/genitori/ritocchi.md). Non salva niente: manda su cosa ha deciso.
import { computed } from 'vue'
import Tre from './Tre.vue'
import { anniInLettere } from './lettere.js'

const props = defineProps({
  nome: { type: String, required: true },
  /* `si` · `no` · `difetto`, com'è messo adesso */
  scelto: { type: String, default: 'difetto' },
  /* cosa farebbe l'età da sola: `qui` · `passato` · `avanti` · `spento` */
  difetto: { type: String, default: 'qui' },
  /* dove si è, adesso: serve solo a scrivere la riga in fondo */
  stato: { type: String, default: 'qui' },
  eta: { type: Number, default: null },
  chiave: { type: String, default: '' },
})
const emit = defineEmits(['applica', 'chiudi'])

const SCELTE = [
  { chiave: 'no', nome: 'Non ce l\'ha', che: 'sparisce dalla home, i progressi restano' },
  { chiave: 'difetto', nome: 'Come dice l\'età', che: 'decide la sua età, come per tutti' },
  { chiave: 'si', nome: 'Ce l\'ha', che: 'resta in home anche se l\'età dice di no' },
]

// «come dice l'età» non si spiega da sé: qui si dice cosa farebbe, per questo gioco e a quest'età
const PERCHE = {
  qui: 'a quest\'età ce l\'ha',
  passato: 'a quest\'età l\'ha già passato',
  avanti: 'a quest\'età arriva più avanti',
  spento: 'non si può accendere: è tutto di un pezzo di scuola che hai tolto',
}
const inLettere = anniInLettere
const spiega = computed(() => (PERCHE[props.difetto] || PERCHE.qui) +
  (props.eta != null ? ` (${inLettere(props.eta)})` : ''))

// un gioco a cui manca un pezzo di scuola non si forza (stessa regola di giocoGiocabile): qui è una posizione che non si raggiunge
const bloccato = computed(() => props.difetto === 'spento')
</script>

<template>
  <Tre radice="in-casa" tasti="gioco-tara" ora="gioco-ora" :chiave="chiave"
       titolo="In casa di chi gioca:" :scelte="SCELTE" :scelto="scelto"
       :spiega="spiega" :bloccate="bloccato ? ['si'] : []"
       :versi="['verso non ce l\'ha', 'verso ce l\'ha']"
       @applica="emit('applica', $event)" @chiudi="emit('chiudi')" />
</template>

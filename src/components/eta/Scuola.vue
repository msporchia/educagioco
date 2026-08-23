<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA TACCA DI UN PEZZO DI SCUOLA CHE VIVE DENTRO UN GIOCO

   `Taratura.vue` sposta un pezzo di scuola di mezzo anno per volta,
   perché le sue domande hanno una difficoltà e quindi una scala su cui
   muoversi. Le divisioni del castello non ce l'hanno: non sono una
   domanda del mazzo, sono una colonna che la cassa propone o non
   propone. Sette scatti in mezzi anni, lì, non vorrebbero dire niente —
   e l'ottavo, quello che spegne, sarebbe l'unico che fa qualcosa.

   Quindi resta solo quello, nella forma che i giochi hanno già
   (`InCasa.vue`): tre posizioni, e quella che conta è la seconda —
   **come dice l'età**, che è il ripristino di una riga sola. Le parole
   stanno qui, il modo di muoverle in `Tre.vue`.

   ── PERCHÉ UN ESTREMO È SEMPRE CHIUSO ────────────────────────────
   Un gioco ha tre stati veri nel profilo (spento, assente, tenuto
   comunque); un pezzo di scuola ne ha due, e il terzo è l'assenza —
   cioè quello che l'età decide. Perciò l'estremo che coincide con
   l'età non si raggiunge: sceglierlo scriverebbe lo stesso profilo
   della posizione di mezzo, e la riga tornerebbe dov'era un istante
   dopo aver premuto «Conferma». Resta in fila, sbiadito, perché la
   tacca deve continuare a dire **da che parte sta la casa**.

   Non salva niente: manda su cosa ha deciso e chi la usa scrive
   (`fissaSapere` in `store/profile.js`).
   ═══════════════════════════════════════════════════════════════════ */
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

/* quello che l'età dice già non si può ridire dall'altra parte */
const bloccate = computed(() => [props.attesoSpento ? 'no' : 'si'])
</script>

<template>
  <Tre radice="sapere-tara" tasti="sapere-tara-verso" ora="sapere-ora" :chiave="chiave"
       titolo="Questo pezzo di scuola:" :scelte="SCELTE" :scelto="scelto"
       :spiega="spiega" :bloccate="bloccate"
       :versi="['verso non l\'ha ancora fatto', 'verso l\'ha già fatto']"
       @applica="emit('applica', $event)" @chiudi="emit('chiudi')" />
</template>

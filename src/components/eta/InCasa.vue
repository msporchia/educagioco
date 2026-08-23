<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA TACCA DI UN GIOCO — ◀ Come dice l'età ▶

   Le tre posizioni e il modo di muoverle stanno in `Tre.vue`; qui ci
   sono **le parole**, che sono la parte che non si può condividere: «Non
   ce l'ha» parla di una carta in home, e la stessa tacca sotto un pezzo
   di scuola direbbe un'altra cosa.

   Le tre posizioni, e la prima è quella che mancava:

     · **Non ce l'ha** — spento a mano (`settings.giochi[k] = false`).
     · **Come dice l'età** — nessuna eccezione, la riga torna a seguire
       la portata. È il ripristino di una riga sola, e senza di lui
       l'unico modo di tornare indietro era ricordarsi com'era.
     · **Ce l'ha** — tenuto in casa anche se l'età dice di no
       (`= true`). Serve al caso in cui l'età sbaglia: il Dungeon
       dichiarato dai sette anni e un bambino di sei che ci gioca col
       fratello, o un gioco «già passato» che in casa si apre ancora.

   Sotto, sempre, **cosa succede adesso**: «a otto anni arriva più
   avanti». Perché la scelta di mezzo è muta per definizione — non dice
   niente da sé — e senza quella riga «Come dice l'età» sarebbe una
   posizione che non si sa dove porta.

   Non salva niente, come tutte le tacche di questa cartella: manda su
   cosa ha deciso e chi la usa scrive.
   ═══════════════════════════════════════════════════════════════════ */
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

/* Cosa vuol dire «come dice l'età», detto per questo gioco e a
   quest'età: è l'unica delle tre che non si spiega da sé. */
const PERCHE = {
  qui: 'a quest\'età ce l\'ha',
  passato: 'a quest\'età l\'ha già passato',
  avanti: 'a quest\'età arriva più avanti',
  spento: 'non si può accendere: è tutto di un pezzo di scuola che hai tolto',
}
const inLettere = anniInLettere
const spiega = computed(() => (PERCHE[props.difetto] || PERCHE.qui) +
  (props.eta != null ? ` (${inLettere(props.eta)})` : ''))

/* Un gioco che non si può accendere perché gli manca un pezzo di
   scuola non si forza: la carta aprirebbe domande da indovinare. È la
   stessa regola di `giocoGiocabile`, e qui si vede come una posizione
   che non si raggiunge. */
const bloccato = computed(() => props.difetto === 'spento')
</script>

<template>
  <Tre radice="in-casa" tasti="gioco-tara" ora="gioco-ora" :chiave="chiave"
       titolo="In casa di chi gioca:" :scelte="SCELTE" :scelto="scelto"
       :spiega="spiega" :bloccate="bloccato ? ['si'] : []"
       :versi="['verso non ce l\'ha', 'verso ce l\'ha']"
       @applica="emit('applica', $event)" @chiudi="emit('chiudi')" />
</template>

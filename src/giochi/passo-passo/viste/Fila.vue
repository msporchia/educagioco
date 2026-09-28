<script setup>
/* La fila — il programma del bambino, una tessera per carta (vedi
   docs/passo-passo/regole.md). Le scatole le disegna `Carte.vue`, che si
   chiama da sé; con lo zaino, dopo l'ultima carta ci sono tanti posti
   tratteggiati quante carte ci stanno ancora. Il consiglio del 💡 compare
   qui, accanto al cursore, e non solo sul suo tasto: l'anello attorno al
   tasto da solo non lo vedeva nessuno. Riceve tutto già deciso e non tocca
   niente: dice solo dove si è toccato. */
import { ref, computed, watch, nextTick, provide } from 'vue'
import Carte from './Carte.vue'
import { albero, carteDi, conCicli } from '../dati/carte.js'

const props = defineProps({
  fila: { type: Array, required: true },
  cursore: { type: Number, required: true },
  corrente: { type: Number, default: -1 },       // la tessera che sta girando
  guasto: { type: Number, default: null },       // dove la fila si è fermata male
  inCorsa: { type: Boolean, default: false },
  sospette: { type: Boolean, default: false },   // un aiuto ha messo il cursore in mezzo
  consiglio: { type: String, default: null },    // la carta che l'aiuto propone
  piena: { type: Boolean, default: false },      // la fila non ne tiene altre
  zaino: { type: Number, default: null },        // quante carte tiene, dove c'è lo zaino
  giri: { type: Array, default: null },          // a che giro sono le scatole
  scelta: { type: Number, default: null },       // la scatola di cui si sta scegliendo il numero
  consiglioTesta: { type: Number, default: null }, // la scatola a cui l'aiuto cambia il numero
})
const emit = defineEmits(['cursore', 'freccia', 'testa'])

const scatola = ref(null)
const nodi = computed(() => albero(props.fila))
const fantasma = computed(() => !!props.consiglio && !props.inCorsa && !props.piena)
/* i posti dello zaino ancora vuoti: il consiglio del 💡, se c'è, ne
   occupa già uno — è una carta che sta per entrare */
const liberi = computed(() => (props.zaino
  ? Math.max(0, props.zaino - carteDi(props.fila) - (fantasma.value ? 1 : 0)) : 0))

provide('fila', {
  s: computed(() => ({
    cursore: props.cursore, corrente: props.corrente, guasto: props.guasto,
    inCorsa: props.inCorsa, sospette: props.sospette, consiglio: props.consiglio,
    fantasma: fantasma.value,
    giri: props.giri, scelta: props.scelta, consiglioTesta: props.consiglioTesta,
    piatta: !conCicli(props.fila),
  })),
  tocca: p => { if (!props.inCorsa) emit('cursore', p) },
  /* una tessera: il cursore dopo di lei, o prima se c'era già */
  toccaTessera: i => { if (!props.inCorsa) emit('cursore', props.cursore === i + 1 ? i : i + 1) },
  testa: i => { if (!props.inCorsa) emit('testa', i) },
  metti: t => { if (!props.inCorsa) emit('freccia', t) },
})

/* la tessera che conta — quella che gira, o il cursore — resta a vista:
   in una fila lunga la striscia scorre da sé */
function aVista(sel) {
  nextTick(() => {
    const el = scatola.value && scatola.value.querySelector(sel)
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  })
}
watch(() => props.corrente, i => { if (i >= 0) aVista(`[data-tessera="${i}"]`) })
watch(() => [props.cursore, props.fila.length], () => { if (!props.inCorsa) aVista('.pp-cursore') })
watch(() => props.guasto, i => { if (i != null) aVista(`[data-tessera="${i}"]`) })
watch(() => props.consiglio, m => { if (m) aVista('[data-consiglio]') })

const tocca = i => { if (!props.inCorsa) emit('cursore', i) }
</script>

<template>
  <div ref="scatola" class="pp-fila" :class="{ 'pp-in-corsa': inCorsa, 'pp-con-zaino': !!zaino }" data-fila>
    <div class="pp-programma">
      <Carte :nodi="nodi" :fine="fila.length" />
      <!-- vuota, la fila mostra dove andrà la prima freccia: un posto
           tratteggiato, non una frase (e col consiglio del 💡 quel posto
           ce l'ha già dentro). Con lo zaino i posti sono tutti quelli che
           restano, e toccarne uno porta il cursore in fondo -->
      <template v-if="zaino">
        <button v-for="n in liberi" :key="'z' + n" class="pp-posto" data-libero
                :aria-label="n === 1 ? 'in fondo alla fila' : null" @click="tocca(fila.length)"></button>
      </template>
      <span v-else-if="!fila.length && !fantasma" class="pp-posto" aria-hidden="true"></span>
    </div>
  </div>
</template>

<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA FILA — il programma del bambino, una tessera per freccia

   Una striscia che va a capo. In testa c'è il coniglio: è da lì che si
   parte, sempre. Il cursore è una sbarra che lampeggia fra due tessere:
   una freccia nuova entra lì. Toccare una tessera mette il cursore
   subito dopo di lei; toccare il coniglio lo mette all'inizio. Niente
   trascinamento — si tocca e basta.

   Mentre il coniglio corre la tessera che sta girando si accende: è la
   cosa più importante che questo gioco insegna, sapere **a che punto
   del programma sei**. Quelle già fatte si spengono un poco. Dove
   qualcosa è andato storto la tessera lampeggia (`data-guasto`) e resta
   segnata finché la fila non cambia.

   Riceve tutto già deciso e non tocca niente: dice solo dove si è
   toccato.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, watch, nextTick } from 'vue'
import Icona from './Icona.vue'
import { nomeDellaMossa } from '../dati/mondo.js'

const props = defineProps({
  fila: { type: Array, required: true },
  cursore: { type: Number, required: true },
  corrente: { type: Number, default: -1 },       // la tessera che sta girando
  guasto: { type: Number, default: null },       // dove la fila si è fermata male
  inCorsa: { type: Boolean, default: false },
  sospette: { type: Boolean, default: false },   // un aiuto ha messo il cursore in mezzo
})
const emit = defineEmits(['cursore'])

const scatola = ref(null)

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

const tocca = i => { if (!props.inCorsa) emit('cursore', i) }
</script>

<template>
  <div ref="scatola" class="pp-fila" :class="{ 'pp-in-corsa': inCorsa }" data-fila>
    <button class="pp-inizio" data-inizio aria-label="all'inizio della fila" @click="tocca(0)">
      <span class="pp-em">🐇</span>
    </button>
    <template v-for="(m, i) in fila" :key="i">
      <span v-if="cursore === i && !inCorsa" class="pp-cursore" data-cursore aria-hidden="true"></span>
      <button class="pp-tessera"
              :class="{ 'pp-salto': m.startsWith('salto-'),
                        'pp-corrente': corrente === i,
                        'pp-fatta': inCorsa && corrente > i,
                        'pp-guasto': guasto === i,
                        'pp-sospetta': sospette && i >= cursore }"
              :data-tessera="i" :data-mossa="m"
              :data-corrente="corrente === i ? '' : null"
              :data-guasto="guasto === i ? '' : null"
              :aria-label="nomeDellaMossa(m)"
              @click="tocca(i + 1)">
        <Icona :mossa="m" />
      </button>
    </template>
    <span v-if="cursore === fila.length && !inCorsa" class="pp-cursore" data-cursore aria-hidden="true"></span>
    <!-- vuota, la fila mostra dove andrà la prima freccia: un posto
         tratteggiato, non una frase -->
    <span v-if="!fila.length" class="pp-posto" aria-hidden="true"></span>
  </div>
</template>

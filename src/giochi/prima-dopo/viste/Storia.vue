<script setup>
// La scena di gioco: tre disegni diversi per tre forme di quesito (la
// striscia da riempire, la fila col buco e tre opzioni, le quattro
// vignette con l'intrusa). Non tocca il motore: emette `tocca` e chi
// coordina (Gioco.vue) decide cosa vuol dire. Cosa succede quando si
// sbaglia è affare di Spiegazione.vue, non di questo file: qui, quando
// la fase non è `gioca`, si congela e basta.
import { computed } from 'vue'
import Passo from './Passo.vue'

const props = defineProps({
  quesito: { type: Object, required: true },
  verbo: { type: Object, required: true },      // { icona, frase, ... } da dati/verbi.js
  fase: { type: String, default: 'gioca' },      // 'gioca' | 'vinta' | 'spiega'
})
defineEmits(['tocca'])

const NUMERI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣']

// `--pd-riga` (vignette per riga) e `--pd-file` (righe in tutto) sono le
// due misure che il foglio di stile usa per dimensionare una vignetta:
// striscia e pesca condividono la stessa misura, quindi vale il caso
// peggiore delle due. A quattro vignette si passa da una fila (84px,
// di nuovo il francobollo delle emoji) a un quadrato due-e-due (158px),
// leggibile come una pagina di fumetto perché le buche sono numerate.
const inRiga = computed(() => {
  const q = props.quesito
  // per «ordina» si contano le buche, non le vignette ancora da pescare:
  // quelle calano man mano che si posano
  if (q.tipo === 'ordina') return q.sequenza.length > 3 ? 2 : q.sequenza.length
  if (q.tipo === 'intruso') return 2
  return Math.max(q.mostrati.length, q.opzioni.length)
})

const inColonna = computed(() => {
  const q = props.quesito
  if (q.tipo === 'intruso') return 2
  return q.tipo === 'ordina' && q.sequenza.length > 3 ? 4 : 2
})
</script>

<template>
  <div class="pd-storia" :class="{ 'pd-congelata': fase !== 'gioca' }"
       :style="{ '--pd-riga': inRiga, '--pd-file': inColonna }">
    <!-- la consegna: iconica in alto, la frase sotto è per chi legge -->
    <div class="pd-consegna">
      <span class="em">{{ verbo.icona }}</span>
      <p>{{ verbo.frase }}</p>
    </div>

    <!-- ORDINA: la striscia numerata, e sotto le vignette da pescare -->
    <template v-if="quesito.tipo === 'ordina'">
      <div class="pd-striscia" :class="{ 'pd-striscia-quadrata': quesito.sequenza.length > 3 }">
        <button v-for="(id, i) in quesito.posate" :key="i" class="pd-buca em"
                :class="{ 'pd-piena': id !== null }" :disabled="id === null"
                :aria-label="id !== null ? 'togli ' + quesito.sequenza[id] : 'posto ' + (i + 1)"
                @click="$emit('tocca', id)">
          <Passo :passo="id !== null ? quesito.sequenza[id] : null" :vuoto="NUMERI[i]" />
        </button>
      </div>
      <div class="pd-pesca">
        <button v-for="v in quesito.vignetteLibere" :key="v.id" class="pd-vignetta em"
                :aria-label="'vignetta ' + v.emoji" @click="$emit('tocca', v.id)">
          <Passo :passo="v.emoji" />
        </button>
      </div>
    </template>

    <!-- MANCA / DOPO / PRIMA: la fila con un buco, tre opzioni sotto -->
    <template v-else-if="quesito.tipo === 'scegli'">
      <div class="pd-striscia">
        <div v-for="(e, i) in quesito.mostrati" :key="i" class="pd-buca em"
             :class="{ 'pd-piena': e !== null }">
          <Passo :passo="e" vuoto="❓" />
        </div>
      </div>
      <div class="pd-pesca">
        <button v-for="o in quesito.opzioni" :key="o.emoji" class="pd-vignetta em"
                :aria-label="'scegli ' + o.emoji" @click="$emit('tocca', o.emoji)">
          <Passo :passo="o.emoji" />
        </button>
      </div>
    </template>

    <!-- INTRUSO: quattro vignette già in fila, si tocca quella che non c'entra -->
    <template v-else-if="quesito.tipo === 'intruso'">
      <div class="pd-striscia pd-striscia-intrusa">
        <button v-for="v in quesito.vignette" :key="v.id" class="pd-buca pd-piena em"
                :aria-label="'vignetta ' + v.emoji" @click="$emit('tocca', v.id)">
          <Passo :passo="v.emoji" />
        </button>
      </div>
    </template>

    <div v-if="fase === 'vinta'" class="pd-spunta em">✔️</div>
  </div>
</template>

<script setup>
// Le scelte di un gioco (gradini, capitoli, personaggi) come schede in griglia: l'anteprima in alto, il nome, la spiegazione
// scritta («il banco» o «l'unità grande» da soli non dicono niente) e in fondo quello che il gioco aggiunge (▶ Prova, i livelli).
// Toccare la scheda la accende o la spegne. docs/scuola/editor.md
const props = defineProps({
  voci: { type: Array, required: true },        // [{ chiave, nome, icona?, quanti?, testo }]
  scelte: { type: Array, required: true },      // le chiavi accese
  attributo: { type: String, required: true },  // il bersaglio dei test: data-<attributo>="<chiave>"
  una: { type: Boolean, default: false },       // se ne sceglie una sola (il pallino al posto della spunta)
  larghe: { type: Array, default: () => [] },   // le chiavi la cui scheda prende tutta la riga (i livelli aperti)
})
const emit = defineEmits(['tocca'])
</script>

<template>
  <div class="righe">
    <div v-for="v in props.voci" :key="v.chiave" class="voce" :class="{ scelta: props.scelte.includes(v.chiave), larga: props.larghe.includes(v.chiave) }">
      <button class="riga" :aria-pressed="props.scelte.includes(v.chiave)" v-bind="{ [`data-${props.attributo}`]: v.chiave }" @click="emit('tocca', v.chiave)">
        <span v-if="$slots.figura" class="figura"><slot name="figura" :voce="v" /></span>
        <span class="testa">
          <span class="segno" :class="{ tondo: props.una }" aria-hidden="true">{{ props.scelte.includes(v.chiave) ? (props.una ? '●' : '✓') : '' }}</span>
          <span class="nome"><span v-if="v.icona" class="icona">{{ v.icona }}</span>{{ v.nome }}</span>
          <span v-if="v.quanti" class="quanti">{{ v.quanti }}</span>
        </span>
        <span v-if="v.testo" class="testo">{{ v.testo }}</span>
      </button>
      <div v-if="$slots.sotto" class="piede"><slot name="sotto" :voce="v" /></div>
    </div>
  </div>
</template>

<style scoped>
.righe { display:grid; grid-template-columns:repeat(auto-fill, minmax(230px, 1fr)); gap:10px }
.voce { display:flex; flex-direction:column; border-radius:var(--raggio); background:var(--tessera); border:2px solid transparent; overflow:hidden }
.voce.scelta { background:var(--superficie); border-color:var(--penna, var(--inchiostro)) }
.voce.larga { grid-column:1 / -1 }
.riga { flex:1; display:flex; flex-direction:column; align-items:stretch; gap:6px; width:100%; padding:10px 12px; text-align:left;
        font:inherit; color:var(--inchiostro); background:none; border:0; cursor:pointer }
.figura { display:flex; justify-content:center; align-items:center; min-height:96px; padding:6px; border-radius:var(--raggio-piccolo); background:#00000008 }
.figura :deep(svg) { max-height:150px; width:auto }
.testa { display:flex; align-items:center; gap:8px; flex-wrap:wrap }
.segno { flex:none; width:20px; height:20px; display:grid; place-items:center; font-size:13px; font-weight:700;
         border:2px solid var(--filo); border-radius:5px; background:var(--superficie) }
.segno.tondo { border-radius:50% }
.scelta .segno { border-color:var(--penna, var(--inchiostro)); background:var(--penna, var(--inchiostro)); color:#fff }
.nome { font-size:15px; font-weight:700 }
.icona { margin-right:6px }
.quanti { font-size:12px; color:var(--grigio) }
.testo { font-size:13px; color:var(--grigio); line-height:1.4 }
.piede { display:flex; flex-direction:column; gap:8px; padding:0 12px 10px }
</style>

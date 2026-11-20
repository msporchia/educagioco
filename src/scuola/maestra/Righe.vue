<script setup>
// Le scelte di un gioco (gradini, capitoli, tappe) come righe con la spiegazione scritta sotto, non come tessere col nome solo:
// «il banco» o «l'unità grande» da soli non dicono niente. docs/scuola/quaderno.md
const props = defineProps({
  voci: { type: Array, required: true },        // [{ chiave, nome, icona?, quanti?, testo }]
  scelte: { type: Array, required: true },      // le chiavi accese
  attributo: { type: String, required: true },  // il bersaglio dei test: data-<attributo>="<chiave>"
  una: { type: Boolean, default: false },       // se ne sceglie una sola (il pallino al posto della spunta)
})
const emit = defineEmits(['tocca'])
</script>

<template>
  <div class="righe">
    <div v-for="v in props.voci" :key="v.chiave" class="voce">
    <button class="riga" :class="{ scelta: props.scelte.includes(v.chiave) }"
            :aria-pressed="props.scelte.includes(v.chiave)" v-bind="{ [`data-${props.attributo}`]: v.chiave }" @click="emit('tocca', v.chiave)">
      <span class="segno" :class="{ tondo: props.una }" aria-hidden="true">{{ props.scelte.includes(v.chiave) ? (props.una ? '●' : '✓') : '' }}</span>
      <span class="corpo">
        <span class="nome"><span v-if="v.icona" class="icona">{{ v.icona }}</span>{{ v.nome }}<span v-if="v.quanti" class="quanti">{{ v.quanti }}</span></span>
        <span v-if="v.testo" class="testo">{{ v.testo }}</span>
      </span>
      <!-- un disegno accanto (l'anteprima di un livello) e, sotto la riga, quello che il gioco vuole aggiungere -->
      <span v-if="$slots.figura" class="figura"><slot name="figura" :voce="v" /></span>
    </button>
    <slot name="sotto" :voce="v" />
    </div>
  </div>
</template>

<style scoped>
.righe { display:flex; flex-direction:column; gap:6px }
.voce { display:flex; flex-direction:column; gap:4px }
.figura { margin-left:auto; flex:none; padding-left:8px }
.riga { display:flex; align-items:flex-start; justify-content:flex-start; gap:10px; width:100%; padding:10px 12px; text-align:left; font:inherit; color:var(--inchiostro);
        background:var(--tessera); border:2px solid transparent; border-radius:var(--raggio-piccolo); cursor:pointer }
.riga.scelta { background:var(--superficie); border-color:var(--inchiostro) }
.segno { flex:none; width:20px; height:20px; margin-top:1px; display:grid; place-items:center; font-size:13px; font-weight:700;
         border:2px solid var(--filo); border-radius:5px; background:var(--superficie) }
.segno.tondo { border-radius:50% }
.scelta .segno { border-color:var(--inchiostro); background:var(--inchiostro); color:var(--superficie) }
.corpo { display:flex; flex-direction:column; gap:2px; min-width:0 }
.nome { font-size:15px; font-weight:600 }
.icona { margin-right:6px }
.quanti { font-weight:400; color:var(--grigio); font-size:13px; margin-left:6px }
.testo { font-size:13px; color:var(--grigio); line-height:1.4 }
</style>

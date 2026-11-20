<script setup>
// Il «?» accanto a una scelta: un tocco apre due righe che la spiegano, un altro (o un tocco fuori) le chiude. Col dito niente
// tooltip al passaggio del mouse. docs/scuola/quaderno.md
import { ref, onUnmounted } from 'vue'

const props = defineProps({ testo: { type: String, required: true } })
const aperto = ref(false)
const radice = ref(null)
const fuori = e => { if (!radice.value?.contains(e.target)) chiudi() }
function chiudi() { aperto.value = false; document.removeEventListener('pointerdown', fuori, true) }
function tocca() {
  if (aperto.value) return chiudi()
  aperto.value = true
  document.addEventListener('pointerdown', fuori, true)
}
onUnmounted(chiudi)
</script>

<template>
  <span ref="radice" class="aiuto">
    <button type="button" class="punto" :aria-expanded="aperto" aria-label="cosa vuol dire" data-aiuto @click.stop="tocca">?</button>
    <span v-if="aperto" class="fumetto" role="note" data-aiuto-testo>{{ props.testo }}</span>
  </span>
</template>

<style scoped>
.aiuto { position:relative; display:inline-flex; vertical-align:middle }
.punto { width:22px; height:22px; border-radius:50%; border:1px solid var(--filo); background:var(--superficie); color:var(--grigio);
         font:inherit; font-size:13px; font-weight:700; line-height:1; cursor:pointer; padding:0 }
.punto[aria-expanded="true"] { background:var(--inchiostro); color:var(--superficie); border-color:var(--inchiostro) }
.fumetto { position:absolute; z-index:20; top:28px; left:-10px; width:max-content; max-width:min(300px, 80vw); padding:10px 12px;
           font-size:13px; font-weight:400; line-height:1.4; text-align:left; color:var(--inchiostro); background:var(--superficie);
           border-radius:var(--raggio-piccolo); box-shadow:var(--ombra); border:1px solid var(--filo); white-space:normal }
</style>

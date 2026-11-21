<script setup>
// «⋯»: i comandi che servono di rado, in un menu che si apre sotto il tasto. Ogni voce dice cosa fa sotto il suo nome
// (niente «?»); toccarne una, o toccare fuori, lo chiude (docs/core/interfaccia.md, «Un tocco altrove chiude»).
// docs/scuola/ripieghi.md
import { ref, watch, onUnmounted } from 'vue'

const aperto = ref(false)
const radice = ref(null)
const fuori = e => { if (radice.value && !radice.value.contains(e.target)) aperto.value = false }
watch(aperto, a => (a ? addEventListener('pointerdown', fuori, true) : removeEventListener('pointerdown', fuori, true)))
onUnmounted(() => removeEventListener('pointerdown', fuori, true))
</script>

<template>
  <span ref="radice" class="altro">
    <button type="button" class="bottone chiaro piccolo apri" :aria-expanded="aperto" aria-label="altri comandi" data-azione="altro"
            @click="aperto = !aperto">⋯</button>
    <!-- un click su una voce la fa e chiude il menu -->
    <span v-if="aperto" class="menu" role="menu" @click="aperto = false"><slot /></span>
  </span>
</template>

<style scoped>
.altro { position:relative; display:inline-flex }
.apri { min-width:40px; font-weight:800; letter-spacing:.05em }
.menu { position:absolute; z-index:5; top:calc(100% + 6px); right:0; width:min(300px, 80vw); display:flex; flex-direction:column;
        padding:6px; border-radius:var(--raggio); background:var(--superficie); border:1px solid var(--filo);
        box-shadow:0 8px 24px #0002 }
.menu :deep(.voce-menu) { display:flex; flex-direction:column; gap:2px; padding:8px 10px; border:0; border-radius:var(--raggio-piccolo);
                          background:none; font:inherit; text-align:left; color:var(--inchiostro); cursor:pointer }
.menu :deep(.voce-menu:hover) { background:var(--tessera) }
.menu :deep(.voce-menu b) { font-size:14px; color:var(--penna, var(--inchiostro)) }
.menu :deep(.voce-menu span) { font-size:12px; color:var(--grigio); line-height:1.35 }
</style>

<script setup>
// La barra a scuola: come components/Barra.vue ma solo ⏸ e il `?` che accende la guida del gioco (dal gioco non si esce, il suono è
// spento, niente fogli di testo né monete). docs/scuola/architettura.md, docs/core/come-si-gioca.md
defineProps({
  titolo: { type: String, default: '' },
  monete: { type: Boolean, default: false },
  audio: { type: Boolean, default: true },
  scura: { type: Boolean, default: false },
  guida: { type: String, default: '' },
  pausa: { type: Boolean, default: false },
  come: { type: Boolean, default: false },
})
defineEmits(['indietro', 'aiuto', 'pausa', 'come'])
</script>

<template>
  <header class="barra-app" :class="{ scura }">
    <b v-if="titolo" class="dove">{{ titolo }}</b>
    <div class="mezzo"><slot /></div>
    <button v-if="pausa" class="tondo" aria-label="pausa" data-azione="pausa" @click="$emit('pausa')">⏸</button>
    <button v-if="come" class="tondo" aria-label="aiuto" data-azione="aiuto" @click="$emit('come')">?</button>
  </header>
</template>

<style scoped>
.barra-app { display:flex; align-items:center; gap:6px; flex:none; padding:8px; background:#ffffff88;
             box-shadow:0 1px 0 #00000010; position:relative; z-index:20 }
.dove { font-size:16px; color:var(--viola-scuro); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:38vw }
.mezzo { flex:1; min-width:0; display:flex; align-items:center; gap:6px; justify-content:flex-end; overflow:hidden }
.barra-app .tondo { flex:none; font-size:16px }
.barra-app .tondo[aria-label="aiuto"] { font-weight:900; color:var(--viola-scuro) }
.barra-app.scura { background:#141c2aaa; box-shadow:0 1px 0 #ffffff18 }
.barra-app.scura .dove { color:#d3ddf2 }
.barra-app.scura :deep(.gettone) { background:#ffffff1c; color:#eef2fa }
.barra-app.scura :deep(.tondo) { background:#ffffff20; color:#eef2fa }
</style>

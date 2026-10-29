<script setup>
// Il cartello sopra la partita in due (docs/core/insieme.md, «Un gioco nuovo in due»): la linea che va e viene («hai perso la
// linea», «l'altro ha perso la linea»: la partita aspetta e riparte da dov'era) o la sfida finita male, col perché. Il gioco lo
// mette sopra il suo campo, dentro un contenitore con `position: relative`, quando `rotta` o `linea` dicono qualcosa.
defineProps({
  rotta: { type: Boolean, default: false },
  motivo: { type: String, default: '' },          // perché è finita, in parole da bambino
  linea: { type: String, default: '' },           // '' | 'io' | 'altro'
  partita: { type: String, default: 'la partita' },
  esci: { type: String, default: '🗺️ alla mappa' },
})
defineEmits(['esci'])
</script>

<template>
  <div class="ins-velo" :data-sfida-rotta="rotta ? '' : null" :data-sfida-linea="rotta ? null : linea">
    <div class="ins-cartello">
      <h2>{{ rotta ? 'La sfida è finita qui' : linea === 'io' ? 'Hai perso la linea…' : 'L\'altro ha perso la linea…' }}</h2>
      <p>{{ rotta ? motivo : linea === 'io' ? `Mi ricollego da solo: ${partita} riparte da dove era.` : `Lo aspetto: quando torna, ${partita} riparte da dove era.` }}</p>
      <button class="ins-esci em" data-sfida-esci @click="$emit('esci')">{{ esci }}</button>
    </div>
  </div>
</template>

<style scoped>
.ins-velo { position: absolute; inset: 0; z-index: 30; padding: 16px 14px; background: rgba(9, 14, 32, .88);
            display: flex; flex-direction: column; align-items: center; justify-content: center; overflow-y: auto }
.ins-cartello { width: 100%; max-width: 340px; text-align: center; color: #fff; display: flex; flex-direction: column; gap: 10px; align-items: center }
.ins-cartello h2 { font-size: 22px; margin: 0; color: #ffe98a }
.ins-cartello p { margin: 0; color: #cbd5ff; font-size: 14px }
.ins-esci { width: 100%; padding: 14px 18px; border-radius: 16px; border: 0; font: inherit; font-size: 18px; font-weight: 800;
            background: rgba(255, 255, 255, .12); color: #fff }
</style>

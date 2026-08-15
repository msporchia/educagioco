<script setup>
/* Gli attrezzi della cosa selezionata, **appesi all'oggetto** e non in un
   pannello che copre lo schermo: girare una staccionata vuol dire vederla
   girare, e con un pannello davanti non la vedi.

   Spariscono mentre la stai tirando — è quando sono lontani dal dito e
   non servono a niente. */
defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  gesti: { type: Array, default: () => [] },   // [{ chiave, icona, titolo, spento }]
})
const emit = defineEmits(['fai', 'fine'])
</script>

<template>
  <div class="fa-attrezzi" :style="{ left: x + 'px', top: y + 'px' }">
    <button v-for="g in gesti" :key="g.chiave" :title="g.titolo"
            :disabled="g.spento" @click="emit('fai', g.chiave)">{{ g.icona }}</button>
    <button title="ho finito" @click="emit('fine')">✓</button>
  </div>
</template>

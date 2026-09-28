<script setup>
/* La faccia di una roba del granaio, uguale in ogni pannello (silo, macchina, campo, ciotola):
   disegno se c'è, emoji come ripiego dichiarato — vedi docs/fattoria/sprite.md. */
import { computed } from 'vue'
import { PRODOTTI } from '../dati/coltivazioni.js'
import Provino from './Provino.vue'

const props = defineProps({
  /* la chiave di `PRODOTTI` — `'grano'`, `'foraggio'` */
  merce: { type: String, required: true },
  lato: { type: Number, default: 34 },
})

const r = computed(() => PRODOTTI[props.merce] || { nome: props.merce, emoji: '📦' })
</script>

<template>
  <Provino v-if="r.pezzo" class="fa-merce" :pezzo="r.pezzo" :lato="lato" :aria="1" />
  <span v-else class="fa-merce fa-merce-emoji"
        :style="{ width: lato + 'px', height: lato + 'px',
                  fontSize: Math.round(lato * 0.7) + 'px' }">{{ r.emoji }}</span>
</template>

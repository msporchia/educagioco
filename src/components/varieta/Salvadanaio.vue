<script setup>
// Il salvadanaio sulla carta di un gioco: pieno, a metà, vuoto, o ×2.
// Vedi docs/genitori/varieta.md. Tace quando non c'è niente da dire.
import { computed, onMounted } from 'vue'
import { state } from '../../store/profile.js'
import { statoDi, giro, ricarica } from '../../store/varieta.js'
import { sullaCarta } from '../../data/varieta.js'

const props = defineProps({ gioco: { type: String, required: true } })
onMounted(ricarica)

const detto = computed(() => {
  void giro.value   // il registro in memoria non è reattivo: questo sì
  void state.profile.settings.varieta
  return sullaCarta(statoDi(props.gioco))
})
</script>

<template>
  <span v-if="detto" class="salvadanaio" :class="detto.segno"
        :data-salvadanaio="detto.segno">
    <span class="porcello">🐷</span>
    <span class="tacche"><span></span><span></span></span>
    {{ detto.testo }}
  </span>
</template>

<style scoped>
.salvadanaio { grid-column:2; justify-self:start; display:inline-flex; align-items:center; gap:5px;
               margin-top:3px; padding:2px 8px 2px 5px; border-radius:999px;
               font-size:11.5px; font-weight:800; color:#6a5200; background:#fff3c4 }
.porcello { font-size:13px; line-height:1 }
.tacche { display:inline-flex; gap:2px }
.tacche span { width:6px; height:10px; border-radius:2px; background:#e3d6a6 }
.pieno .tacche span, .doppio .tacche span { background:#e0a100 }
.meta .tacche span:first-child { background:#e0a100 }
.doppio { background:#ffe07a; color:#5b3d00 }
.vuoto { background:#eceff4; color:var(--tenue) }
.vuoto .porcello { filter:grayscale(1); opacity:.7 }
</style>

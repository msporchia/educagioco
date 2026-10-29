<script setup>
// Chi è arrivato qui (docs/core/amici-bacheca.md): i pallini e «Leonardo e Melody sono qui». `righe`: uno per riga, con da quando
// («Leonardo è qui · ieri»). Colore e misura del testo li dà il gioco intorno.
import PallinoAmico from './PallinoAmico.vue'
import { quiInParole } from '../../amici/istantanea.js'

defineProps({
  amici: { type: Array, required: true },     // da usaAmici: sullaTappa(i) o allaFine()
  righe: { type: Boolean, default: false },
  lato: { type: Number, default: 18 },
})
</script>

<template>
  <span v-if="amici.length" class="amici-qui" :class="{ righe }" data-amici-qui>
    <template v-if="righe">
      <span v-for="a in amici" :key="a.chiave" class="riga">
        <PallinoAmico :amico="a" :lato="lato" data-pallino-amico />{{ quiInParole([a]) }}<small v-if="a.quando"> · {{ a.quando }}</small>
      </span>
    </template>
    <template v-else>
      <PallinoAmico v-for="a in amici" :key="a.chiave" :amico="a" :lato="lato" data-pallino-amico />
      <span class="frase">{{ quiInParole(amici) }}</span>
    </template>
  </span>
</template>

<style scoped>
.amici-qui { display:flex; align-items:center; gap:4px; font-weight:700 }
.amici-qui.righe { flex-direction:column; align-items:center; gap:3px }
.riga { display:flex; align-items:center; gap:6px }
.frase { margin-left:2px }
small { font-weight:400; opacity:.75 }
</style>

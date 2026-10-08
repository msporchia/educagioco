<script setup>
// Un foglio solo per tutti i pannelli (scontro, porta, forziere, zaino, il banco di sopra): stesso gesto,
// qualcosa ti si mette davanti. Sale dal basso senza coprire tutto (la telecamera alza l'eroe, scena/tela.js); se
// non chiede una scelta lo chiude anche un tocco sul campo (Gioco.vue, `leggero`). `centro`: per lo zaino e il banco, dove il campo si ferma del
// tutto — non porta la classe `sot-foglio` apposta, o misuraFoglio() alzerebbe l'eroe per un pannello che non
// lo chiede. `chiudi`: la ✕ in alto a destra (docs/core/interfaccia.md), dove non c'è una scelta da fare in fondo.
import Icona from './Icona.vue'

defineProps({
  titolo: { type: String, default: '' },
  em: { type: String, default: '' },
  sprite: { type: String, default: null },
  dice: { type: String, default: '' },
  centro: { type: Boolean, default: false },
  conChiudi: { type: Boolean, default: false },
})
defineEmits(['chiudi'])
</script>

<template>
  <div v-if="centro" class="sot-velo">
    <div class="sot-modale sot-centrale">
      <button v-if="conChiudi" type="button" class="sot-chiudi" aria-label="chiudi" data-chiudi
              @click="$emit('chiudi')">✕</button>
      <h2 v-if="titolo">
        <Icona v-if="sprite" :sprite="sprite" :em="em" :emAlto="24" />
        <span v-else-if="em" class="em">{{ em }}</span>
        {{ titolo }}
      </h2>
      <p v-if="dice">{{ dice }}</p>
      <slot />
    </div>
  </div>
  <div v-else class="sot-foglio">
    <h2 v-if="titolo">
      <Icona v-if="sprite" :sprite="sprite" :em="em" :emAlto="24" />
      <span v-else-if="em" class="em">{{ em }}</span>
      {{ titolo }}
    </h2>
    <p v-if="dice">{{ dice }}</p>
    <slot />
  </div>
</template>

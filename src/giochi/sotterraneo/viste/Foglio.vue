<script setup>
// Un foglio solo per tutti i pannelli (scontro, porta, forziere, mercante, zaino): stesso gesto, qualcosa
// ti si mette davanti. Sale dal basso senza coprire tutto (la telecamera alza l'eroe, scena/tela.js) e si
// chiude solo col tasto, mai toccando il velo. `centro`: per lo zaino, dove il campo si ferma del tutto —
// non porta la classe `sot-foglio` apposta, o misuraFoglio() alzerebbe l'eroe per un pannello che non lo chiede.
import Icona from './Icona.vue'

defineProps({
  titolo: { type: String, default: '' },
  em: { type: String, default: '' },
  sprite: { type: String, default: null },
  dice: { type: String, default: '' },
  centro: { type: Boolean, default: false },
})
</script>

<template>
  <div v-if="centro" class="sot-velo">
    <div class="sot-modale sot-centrale">
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

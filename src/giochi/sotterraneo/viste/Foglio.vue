<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL FOGLIO CHE SALE DAL BASSO — o che si mette in mezzo

   Uno solo per tutti i pannelli del gioco — lo scontro, la porta, il
   forziere, il mercante, lo zaino — perché sono lo stesso gesto: qualcosa
   ti si mette davanti, tu decidi, e torni a camminare.

   Sale **dal basso e non copre tutto**: sopra resta il campo, e la
   telecamera intanto alza l'eroe (`scena/tela.js`) così chi si sta
   battendo continua a vedere chi ha davanti. Un pannello a schermo
   intero trasformerebbe uno scontro in una scheda da compilare.

   Il velo dietro non si tocca per chiudere: qui i fogli si chiudono con
   un tasto che dice cosa fa («ci torno dopo», «scappo via»), perché
   chiudere per sbaglio uno scontro vorrebbe dire regalare al mostro il
   colpo che si stava per dare.

   ── `centro`: QUANDO IL FOGLIO NON È UN'APPENDICE ─────────────────
   Dal basso il pannello dice «il campo è ancora il posto dove sei, io
   sono una cosa che ti si è messa davanti» — ed è vero per una porta o
   per un forziere, dove la caverna intorno è metà della decisione. Non
   è vero per lo zaino: lì il campo si ferma, e un pannello incollato in
   fondo lo fa sembrare un cassetto aperto — si continua a toccare il
   campo, non si va da nessuna parte e non si capisce perché. Al centro,
   col velo dietro, si vede che il gioco è in pausa: la ragione per cui
   non ti muovi sta in mezzo allo schermo.

   Chi sta al centro **non porta la classe `sot-foglio`**, ed è
   deliberato: `misuraFoglio()` in `Gioco.vue` cerca quella per sapere
   quanto schermo è coperto e alzare l'eroe con la telecamera. Un
   pannello centrale non chiede spazio — chiede il contrario, che sotto
   non si guardi — e la scena deve restare ferma. */
import Icona from './Icona.vue'

defineProps({
  titolo: { type: String, default: '' },
  em: { type: String, default: '' },
  /* quando il foglio parla di una cosa del sotterraneo, in testata ci va
     **la sua faccia**: lo stesso pezzo che si vede per terra e nella
     tasca. `em` resta il ripiego per chi uno sprite non ce l'ha, e per
     i fogli che non parlano di un oggetto (una porta, una fonte). */
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

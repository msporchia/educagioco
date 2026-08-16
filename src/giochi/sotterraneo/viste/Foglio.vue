<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL FOGLIO CHE SALE DAL BASSO

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
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  titolo: { type: String, default: '' },
  em: { type: String, default: '' },
  dice: { type: String, default: '' },
})
</script>

<template>
  <div class="sot-foglio">
    <h2 v-if="titolo"><span v-if="em" class="em">{{ em }}</span> {{ titolo }}</h2>
    <p v-if="dice">{{ dice }}</p>
    <slot />
  </div>
</template>

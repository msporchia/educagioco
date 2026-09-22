<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA ✕ — LA VIA D'USCITA, UGUALE IN TUTTI I FOGLI

   Undici fogli, e undici modi di uscirne: «Chiudi», «Va bene», «Lascia
   stare», «Indietro», e in un paio di casi soltanto il velo da toccare
   fuori. Nessuno in alto a destra, che è il posto dove si guarda per
   primo — e nessuno **sempre visibile**: il tasto stava in fondo alla
   colonna, quindi in un foglio lungo (il baule, i livelli, l'albero a
   sei fasi) per uscire bisognava prima scorrere fino in fondo.

   Questa ✕ sta in cima a destra di ogni foglio, **appiccicata**
   (`position: sticky`): il foglio scorre e lei resta dov'è. È il pezzo
   che rende sicuro far scorrere il foglio intero invece di un elenco
   dentro — la via d'uscita non se ne va mai dallo schermo.

   Non è un tasto qualunque: è largo quanto un polpastrello (40 px,
   come i tondi della barra) perché lo preme un bambino, e porta
   `aria-label="chiudi"` — i test lo cercano da lì e non dal carattere,
   come la freccia «indietro» della barra in cima.

   I tasti in fondo restano dove **sono una scelta** («Lascia stare» /
   «Compra», «Chiudi» / «Ritira»): lì la seconda voce è quella che
   conta e la prima è il suo contrario. Dove invece l'unica cosa da
   fare era chiudere, il tasto in fondo non c'è più: lo fa lei.
   ═══════════════════════════════════════════════════════════════════ */
defineEmits(['chiudi'])
</script>

<template>
  <button type="button" class="fa-chiudi" aria-label="chiudi" data-chiudi
          @click="$emit('chiudi')">✕</button>
</template>

<script setup>
/* La ✕: la via d'uscita uguale in tutti i fogli, in alto a destra e appiccicata (sticky) — vedi
   CLAUDE.md e docs/fattoria/come-si-tocca.md. aria-label="chiudi": i test la cercano da lì. */
defineEmits(['chiudi'])
</script>

<template>
  <button type="button" class="fa-chiudi" aria-label="chiudi" data-chiudi
          @click="$emit('chiudi')">✕</button>
</template>

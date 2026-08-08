<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CARTELLO DI FINE DISCESA

   Un cartello solo per tutti e due i modi di finire, perché è lo stesso
   gesto: «è finita, ecco com'è andata, si riparte da qui».

   Quello che è successo si racconta **sempre** con i numeri veri —
   quante stanze, quante domande, fin dove si è arrivati — anche quando
   è andata male, anzi soprattutto: «ero alla settima su otto» è il
   motivo per cui un bambino rimette la mano sul telefono, «hai perso»
   è il motivo per cui lo posa.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  vinta: { type: Boolean, default: false },
  titolo: { type: String, default: '' },
  bossNome: { type: String, default: '' },
  stelle: { type: Number, default: 0 },
  monete: { type: Number, default: 0 },
  fatti: { type: Object, required: true },   // { stanze, domande, fila, file, gemme }
  doni: { type: Array, default: () => [] },  // [{ em, nome }]
  libera: { type: Boolean, default: false },
})
defineEmits(['ancora', 'esci'])
</script>

<template>
  <div class="dng-velo">
    <div class="dng-fine">
      <div class="dng-em em">{{ vinta ? '👑' : '💀' }}</div>
      <h2 :class="vinta ? 'dng-oro' : 'dng-rosso'">
        {{ vinta ? `${bossNome} è sconfitto!` : 'Il dungeon ha vinto' }}
      </h2>
      <p class="dng-racconto">
        {{ vinta
          ? `${titolo}: sei uscito col tesoro.`
          : 'Sei finito a terra. La prossima volta il dungeon sarà tutto diverso.' }}
      </p>

      <div v-if="stelle" class="dng-stelle em">{{ '⭐'.repeat(stelle) }}</div>

      <div class="dng-fatti">
        <div><b>{{ fatti.fila }}<small>/{{ fatti.file }}</small></b><span>fila</span></div>
        <div><b>{{ fatti.stanze }}</b><span>stanze</span></div>
        <div><b>{{ fatti.domande }}</b><span>domande</span></div>
      </div>

      <p v-if="doni.length" class="dng-coda">
        avevi: <span v-for="d in doni" :key="d.nome">{{ d.em }} {{ d.nome }} </span>
      </p>
      <p v-if="monete" class="dng-coda dng-oro">+{{ monete }} 🪙 nel salvadanaio</p>

      <button class="dng-grosso" data-fine="ancora" @click="$emit('ancora')">
        <span class="em">{{ vinta ? '🗺️' : '↻' }}</span>
        {{ vinta ? 'alla mappa' : 'ci riprovo' }}
      </button>
      <button v-if="!vinta" class="dng-grosso dng-chiaro" @click="$emit('esci')">
        <span class="em">🗺️</span> lascio qui
      </button>
    </div>
  </div>
</template>

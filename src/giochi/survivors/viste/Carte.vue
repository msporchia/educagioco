<script setup>
// Le tre carte: si sale di livello e il gioco si ferma. Sopra ognuna
// c'è scritto quanto costa (facile, media, tosta) — il prezzo di quella
// carta a quel livello, prima che il bambino scelga. Le carte arrivano
// già vestite (nome, disegno, pallini): questa schermata non sa come
// nasca un prezzo, emette solo la chiave di quella toccata.
defineProps({
  carte: { type: Array, required: true },
  livello: { type: Number, default: 0 },
  cassa: { type: Boolean, default: false },   // da una cassa e non da una salita di livello
})
defineEmits(['scegli'])
</script>

<template>
  <div class="sv-velo sv-carte" :data-cassa="cassa || null">
    <div class="sv-titolone em">{{ cassa ? '📦 UNA CASSA!' : `⭐ LIVELLO ${livello}` }}</div>
    <p class="sv-sottotitolo">scegli una carta — e paga la sua domanda</p>

    <button v-for="c in carte" :key="c.chiave" class="sv-carta"
            :class="'sv-t' + c.tinta" :data-carta="c.chiave"
            :style="{ '--sv-prezzo': c.colore }" @click="$emit('scegli', c.chiave)">
      <span class="sv-icona em">{{ c.icona }}</span>
      <span class="sv-testi">
        <b>{{ c.nome }}</b>
        <small class="sv-chiaro">{{ c.chiaro }}</small>
        <i v-if="c.nuova" class="sv-nuova">NUOVA!</i>
        <!-- oltre il tetto (solo Sopravvivenza) rende ogni volta un po' meno -->
        <i v-else-if="c.oltreIlTetto" class="sv-ancora">ancora un po' di più</i>
        <i v-else class="sv-salita">livello {{ c.livello }} di {{ c.max }}</i>
      </span>
      <span class="sv-prezzo" :data-pallini="c.pallini">
        <span class="sv-pallini">
          <i v-for="n in c.pallinoTot" :key="n" :class="{ 'sv-acceso': n <= c.pallini }"></i>
        </span>
        <small>{{ c.etichetta }}</small>
      </span>
    </button>

    <p class="sv-nota">se sbagli, niente carta: ci riprovi al prossimo livello</p>
  </div>
</template>

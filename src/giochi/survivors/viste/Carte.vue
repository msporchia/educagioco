<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LE TRE CARTE — la pausa che costa

   Si sale di livello e il gioco si ferma. Tre carte, e **sopra ognuna
   c'è scritto quanto costa**: una domanda facile, media o tosta. È il
   momento in cui il bambino decide quanto vuole lavorare, e va guardato
   con calma — per questo qui non corre nessun orologio.

   Il prezzo che si vede è quello **di quella carta a quel livello**:
   una capacità già cresciuta chiede una domanda più tosta, e i pallini
   lo dicono prima che il bambino scelga. Se costasse più di quanto
   mostra, la scelta sarebbe una scommessa al buio.

   Le carte arrivano già vestite (nome, disegno, quanti pallini, a che
   livello portano): questa schermata non sa cosa faccia un
   potenziamento, non sa come nasca un prezzo e non sa che esistano le
   materie. Emette la chiave di quella toccata.

   Una carta può arrivare **oltre il suo ultimo livello**: capita solo
   nella Sopravvivenza, che non finisce, e vuol dire che stavolta rende
   meno di prima (il perché sta in `dati/mazzo.js`, sotto `resa`). Si
   dice, perché una carta che promette quanto la prima volta e dà la
   metà è una carta che mente.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  carte: { type: Array, required: true },
  livello: { type: Number, default: 0 },
  /* le tre carte vengono da una cassa trovata a terra e non da una
     salita di livello: sopra c'è scritto quello, perché «livello 4»
     sopra una cassa sarebbe una bugia */
  cassa: { type: Boolean, default: false },
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
        <!-- nella Sopravvivenza una carta si può riprendere anche dopo il
             suo ultimo livello, e allora rende ogni volta un po' meno:
             «livello 7 di 5» sarebbe una bugia, e chi sceglie deve
             sapere che stavolta ne prende poco -->
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

    <!-- è la regola vera: sbagliare non dà niente, e prima qui c'era
         scritto il contrario («prendi comunque la prima carta») -->
    <p class="sv-nota">se sbagli, niente carta: ci riprovi al prossimo livello</p>
  </div>
</template>

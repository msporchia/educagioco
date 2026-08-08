<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL PREAVVISO — chi sta per arrivare, prima che serva.

   Il difetto che chiude: le debolezze dei mostri esistevano, ma si
   scoprivano quando l'ondata era già partita. A quel punto costruire la
   torre giusta non serve più, e la debolezza smette di essere una
   decisione: diventa un dettaglio che si legge dopo. La scelta della
   torre — che è il cuore del gioco, perché decide anche *quale
   operazione* si farà — si prendeva a caso.

   Qui le prossime tre ondate si vedono mentre si sta ancora
   scegliendo: chi arriva, quanti sono, e con l'emoji della torre che
   gli fa il doppio del danno. «Fra due ondate arriva il Golem, debole
   alle bombe» vuol dire «comincia adesso a mettere da parte per le
   divisioni».

   Sta nel banco e non sul campo apposta: sopra non c'è spazio da
   rubare, e il posto dove si guarda mentre si decide cosa comprare è
   quello dove ci sono i bottoni per comprare.
   ═══════════════════════════════════════════════════════════════════ */
import { TORRI } from '../../data/ops.js'
import RitrattoMostro from './RitrattoMostro.vue'

defineProps({
  /* [{ onda, fra, id, nome, quanti, vola, debole }] — le dà il motore */
  prossime: { type: Array, default: () => [] },
})
</script>

<template>
  <div v-if="prossime.length" class="preavviso">
    <span class="titolo">In arrivo</span>
    <div v-for="p in prossime" :key="p.onda" class="avviso" :class="{ subito: p.fra === 1 }">
      <span class="faccia">
        <RitrattoMostro :bestia="p.id" />
        <!-- il punto debole sta *addosso* al mostro, non di fianco: è quello
             che si deve leggere insieme alla faccia, non dopo -->
        <span v-if="p.debole" class="punto" :style="{ '--c': TORRI[p.debole].colore }"
              :title="'debole a ' + TORRI[p.debole].nome">{{ TORRI[p.debole].emoji }}</span>
      </span>
      <span class="dati">
        <b>{{ p.nome }}</b>
        <i>🌊{{ p.onda }} · ×{{ p.quanti }}</i>
      </span>
    </div>
  </div>
</template>

<style scoped src="./nastro.css"></style>

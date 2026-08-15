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

   Sta in cima al campo, e solo fra un'ondata e l'altra: durante la
   battaglia quel posto è della scheda del mostro che si ha davanti, e
   le due cose non servono mai insieme.

   Dove gli ingressi sono due, ogni pastiglia dice anche **da che
   parte** arriva quell'ondata. È l'informazione che rende il
   trascinamento di una torre una mossa invece che una carezza: «fra due
   giri scendono da destra» vuol dire «spostala adesso».
   ═══════════════════════════════════════════════════════════════════ */
import { TORRI } from '../../data/ops.js'
import RitrattoMostro from './RitrattoMostro.vue'

/* da che ingresso arriva l'ondata, dove gli ingressi sono più d'uno.
   Non è un dettaglio di colore: è quello che dice se conviene spostare
   una torre adesso, e si legge tre ondate prima. */
const FRECCE = { sinistra: '↙', destra: '↘', ambo: '↙↘' }

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
        <i>🌊{{ p.onda }} · ×{{ p.quanti }}<template v-if="p.lato"> ·
          <em :class="p.lato">{{ FRECCE[p.lato] }}</em></template></i>
      </span>
    </div>
  </div>
</template>

<style scoped src="./nastro.css"></style>

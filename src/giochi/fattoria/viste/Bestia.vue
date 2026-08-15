<script setup>
/* ═══════════════════════════════════════════════════════════════════
   COME STA, E COSA POSSO FARE PER LUI

   Si tocca l'animale e si vede **come sta**: tre barrette e una riga che
   lo dice a parole. Prima qui si apriva la scelta del nome — sbagliato:
   il nome glielo si dà una volta, lo stato si guarda ogni volta.
   Rinominare è rimasto, ma è un tastino in fondo.

   La ciotola sta sotto, e **ogni cibo dice quanto costa prima che tu lo
   tocchi**: così scegliere fra i croccantini da 4 e la carne da 16 è una
   scelta, non una sorpresa a cose fatte. È la stessa regola dei cartelli
   del prezzo sui pezzi di bosco.
   ═══════════════════════════════════════════════════════════════════ */
import { BISOGNI, CHIAVI, CIBI, COCCOLE, comeSta } from '../dati/bisogni.js'
import Provino from './Provino.vue'

const props = defineProps({
  chi: { type: String, required: true },
  che: { type: String, default: '' },          // la razza, se non ha nome
  nome: { type: String, default: '' },
  stato: { type: Object, required: true },     // { pancia, pelo, gioco }
  monete: { type: Number, default: 0 },
})
const emit = defineEmits(['nutri', 'coccola', 'rinomina', 'chiudi'])

const pieno = k => (props.stato[k] ?? 0) > 0.93
</script>

<template>
  <div class="fa-foglio">
    <h2>{{ nome || che }}</h2>
    <Provino :pezzo="chi + '_giu0'" :lato="64" />
    <p>{{ comeSta(stato, nome || che) }}</p>

    <div class="fa-bisogni">
      <div v-for="k in CHIAVI" :key="k" class="fa-bisogno">
        <span>{{ BISOGNI[k].icona }}</span>
        <span class="fa-livello">
          <i :style="{ width: Math.round(stato[k] * 100) + '%', background: BISOGNI[k].colore }"></i>
        </span>
        <em>{{ Math.round(stato[k] * 100) }}%</em>
      </div>
    </div>

    <span class="fa-etichetta">La ciotola</span>
    <div class="fa-nomi">
      <button v-for="c in CIBI" :key="c.id" class="fa-cibo"
              :disabled="pieno('pancia') || c.prezzo > monete"
              @click="emit('nutri', c)">
        <b>{{ c.emoji }}</b>
        <span>{{ c.nome }}</span>
        <em>🪙{{ c.prezzo }}</em>
      </button>
    </div>

    <div class="fa-fila" style="margin-bottom:12px">
      <button v-for="g in COCCOLE" :key="g.id" class="fa-bot"
              :disabled="pieno(g.bisogno)" @click="emit('coccola', g)">
        {{ g.emoji }} {{ g.nome }}</button>
    </div>

    <div class="fa-fila">
      <button class="fa-bot forte" @click="emit('chiudi')">Va bene</button>
    </div>
    <!-- il nome si dà una volta e si cambia di rado: sta in fondo, piccolo,
         dove non ruba il posto a quello che si fa ogni volta -->
    <button class="fa-minuto" @click="emit('rinomina')">cambia nome</button>
  </div>
</template>

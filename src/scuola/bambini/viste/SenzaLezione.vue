<script setup>
// «Senza lezione»: la maestra, col suo codice, fa partire un gioco su questo PC senza il servizio (niente internet, un
// guasto): il gioco e cosa si chiede, come un blocco dell'editor, che va finché non lo cambia dal tasto «Maestra».
// docs/scuola/ripieghi.md
import { ref, computed } from 'vue'
import { valido, NIENTE } from '../../comune/esercizi.js'
import { lezioneValida } from '../../comune/lezione.js'
import CodiceMaestra from './CodiceMaestra.vue'
import SceltaEsercizio from '../../maestra/SceltaEsercizio.vue'

const emit = defineEmits(['via', 'annulla'])
const aperto = ref(false)
const esercizio = ref({ ...NIENTE })

const lezione = computed(() => (valido(esercizio.value)
  ? { id: 'senza', nome: 'Senza lezione', blocchi: [{ esercizio: esercizio.value, passa: null }], inTondo: false } : null))
function via() { if (lezione.value && lezioneValida(lezione.value)) emit('via', JSON.parse(JSON.stringify(lezione.value))) }
</script>

<template>
  <div class="maestra senza" data-senza-lezione>
    <div class="pagina">
      <section v-if="!aperto" class="carta">
        <CodiceMaestra @giusto="aperto = true" @annulla="emit('annulla')" />
      </section>

      <template v-else>
        <section class="carta">
          <h1>Senza lezione</h1>
          <p class="nota">Si gioca solo su questo computer, anche senza internet: le risposte non arrivano a nessuno e non resta
            niente. Per cambiare, il tasto «Maestra» in basso a sinistra.</p>
          <div class="fila">
            <button class="bottone chiaro" data-azione="annulla" @click="emit('annulla')">Torna al codice della lezione</button>
          </div>
        </section>

        <section class="carta" data-passo="scelta-tua">
          <SceltaEsercizio v-model="esercizio" dove="senza-lezione" />
        </section>

        <section class="carta">
          <button class="bottone grande" :disabled="!lezione" data-azione="via-senza" @click="via">Via</button>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.senza { flex:1; min-height:0; overflow-y:auto; text-align:left }
.bottone.grande { font-size:20px; padding:14px 48px; align-self:center }
</style>

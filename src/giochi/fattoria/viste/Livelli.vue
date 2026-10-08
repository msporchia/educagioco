<script setup>
/* La pagina dei livelli: cosa è arrivato (a quadratini, si prendono premendo) e cosa arriva al
   prossimo — vedi docs/fattoria/livelli.md. Riceve l'avanzamento già fatto, non sa niente del profilo. */
import { computed } from 'vue'
import { premiDi } from '../dati/livelli.js'
import Provino from './Provino.vue'
import Chiudi from './Chiudi.vue'

const props = defineProps({
  // quello che torna da Fattoria.avanzamento
  stato: { type: Object, required: true },
  // le chiavi dei premi già presi
  presi: { type: Array, default: () => [] },
})
defineEmits(['reclama', 'chiudi'])

const dopo = computed(() => props.stato.livello + 1)
const presi = computed(() => new Set(props.presi))
const preso = p => presi.value.has(p.chiave)

// Quello che è arrivato: i premi di questo livello più gli arretrati (chi ha saltato livelli).
const adesso = computed(() => {
  const liv = props.stato.livello
  const miei = premiDi(liv)
  const arretrati = []
  for (let l = 1; l < liv; l++)
    for (const p of premiDi(l)) if (!preso(p)) arretrati.push(p)
  return [...arretrati, ...miei].sort((a, b) => (preso(a) ? 1 : 0) - (preso(b) ? 1 : 0))
})
const daPrendere = computed(() => adesso.value.filter(p => !preso(p)))
const prossimi = computed(() => premiDi(dopo.value))
</script>

<template>
  <div class="fa-foglio fa-livelli">
    <Chiudi @chiudi="$emit('chiudi')" />
    <h2>⭐ Livello {{ stato.livello }}</h2>
    <p class="fa-sotto-titolo">{{ stato.nome }}</p>

    <!-- Il titolo cambia mestiere: con premi da prendere è un invito, senza è un riepilogo. -->
    <span class="fa-etichetta" :class="{ dono: daPrendere.length }">
      {{ daPrendere.length
         ? (daPrendere.length === 1 ? '🎁 un premio da prendere'
                                    : `🎁 ${daPrendere.length} premi da prendere`)
         : `al livello ${stato.livello} è arrivato` }}</span>

    <div v-if="adesso.length" class="fa-premi">
      <button v-for="p in adesso" :key="p.chiave" type="button"
              :data-premio="p.chiave"
              :class="['fa-premio', preso(p) ? 'preso' : 'da']"
              :disabled="preso(p)"
              @click="$emit('reclama', p.chiave)">
        <span class="fa-ripiano" :class="{ alto: p.tipo === 'bestia' }">
          <Provino :pezzo="p.pezzo" :lato="p.tipo === 'bestia' ? 64 : 48" /></span>
        <span class="fa-nome">{{ p.nome }}</span>
        <span v-if="preso(p)" class="fa-stato">✓ {{ p.che }}</span>
        <span v-else class="fa-stato prendi">prendi</span>
      </button>
    </div>
    <p v-else class="fa-piccolo">A questo livello è arrivata altra terra da riempire.</p>


    <!-- Spento e in grigio: non è un negozio, è una vetrina. -->
    <span class="fa-etichetta">al livello {{ dopo }} arriva</span>
    <p class="fa-posti">
      <b>🪙{{ stato.speso }}</b> spesi ·
      ne mancano <b>🪙{{ stato.manca }}</b></p>
    <div class="fa-quanto largo"><i :style="{ width: Math.round(stato.quanto * 100) + '%' }"></i></div>

    <div v-if="prossimi.length" class="fa-premi">
      <div v-for="p in prossimi" :key="p.chiave" class="fa-premio chiuso">
        <span class="fa-ripiano" :class="{ alto: p.tipo === 'bestia' }">
          <Provino :pezzo="p.pezzo" :lato="p.tipo === 'bestia' ? 64 : 48" /></span>
        <span class="fa-nome">{{ p.nome }}</span>
        <span class="fa-stato">🔒 livello {{ dopo }}</span>
      </div>
    </div>
    <p v-else class="fa-piccolo">Al livello {{ dopo }} arriva altra terra da riempire.</p>


  </div>
</template>

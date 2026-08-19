<script setup>
/* ═══════════════════════════════════════════════════════════════════
   CHI SCENDE

   Quattro figure, due numeri per uno. Si sceglie **una volta** e resta:
   la scelta è ricordata nel profilo e si cambia da qui, dalla mappa
   delle discese. Chiederlo prima di ogni discesa sarebbero due tocchi in
   più ogni volta, e la risposta sarebbe la stessa di ieri.

   I due numeri sono tutta la differenza (`dati/eroi.js`): quanto reggi e
   quanto fai male. Si mostrano come barrette oltre che come cifre —
   davanti a «❤️ 24 · ⚔️ 3» un bambino di sei anni non sa dire chi è più
   forte, davanti a due barre lunghe diverse sì.
   ═══════════════════════════════════════════════════════════════════ */
import { figura } from './figura.js'
import { pezzoAndante } from '../dati/tessere.js'

const props = defineProps({
  eroi: { type: Array, required: true },     // le schede di dati/eroi.js
  scelto: { type: String, default: '' },
  primo: { type: Boolean, default: false },  // la prima volta non si può annullare
})
defineEmits(['scegli', 'chiudi'])

/* Il fotogramma fermo: fermo-0 è quello con la posa più leggibile. */
const posa = e => figura(pezzoAndante(e.sprite, 'fermo', 0), { scala: 3 })

/* Le barrette. Il fondo scala è quello dell'eroe più forte in quella
   colonna, non un massimo inventato: così la differenza si vede tutta. */
const piuVita = Math.max(...props.eroi.map(e => e.vita))
const piuAtt = Math.max(...props.eroi.map(e => e.att))
</script>

<template>
  <div class="sot-velo" @click.self="!primo && $emit('chiudi')">
    <div class="sot-modale">
      <h2><span class="em">🕯️</span> {{ primo ? 'Chi scende?' : 'Cambio eroe' }}</h2>
      <p>
        {{ primo ? 'Scegli con chi vuoi girare là sotto. Si può cambiare quando vuoi.'
                 : 'Vale dalla prossima discesa. Quella lasciata a metà resta di chi l\'ha cominciata.' }}
      </p>

      <button v-for="e in eroi" :key="e.chiave" class="sot-eroe"
              :class="{ 'sot-scelto': e.chiave === scelto }"
              :data-eroe="e.chiave" @click="$emit('scegli', e.chiave)">
        <span class="sot-ritratto" :style="posa(e) ? posa(e).gabbia : null">
          <i v-if="posa(e)" :style="posa(e).pezzo"></i>
          <b v-else class="em">{{ e.em }}</b>
        </span>
        <span class="sot-testo">
          <b>{{ e.nome }}</b>
          <i>{{ e.dice }}</i>
          <span class="sot-barre">
            <span class="sot-barra sot-cuore" :style="{ '--q': e.vita / piuVita }">
              <em class="em">❤️</em>{{ e.vita }}
            </span>
            <span class="sot-barra sot-braccio" :style="{ '--q': e.att / piuAtt }">
              <em class="em">⚔️</em>{{ e.att }}
            </span>
            <span v-if="e.dif" class="sot-scudo em">🛡️ {{ e.dif }}</span>
          </span>
        </span>
      </button>

      <button v-if="!primo" class="sot-grosso sot-chiaro" data-azione="chiudi-eroi"
              @click="$emit('chiudi')">
        lascio come sta
      </button>
    </div>
  </div>
</template>

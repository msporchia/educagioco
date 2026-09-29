<script setup>
// Chi scende: si sceglie una volta e resta (ricordato nel profilo). I due numeri (dati/eroi.js) si mostrano
// anche come barrette, che un bambino confronta più facilmente delle cifre. La terza riga dice cosa impugna
// e cosa veste, con le figure e non le parole (si vede prima di scoprirlo tre piani più giù, e si legge anche
// senza saper leggere); quello senza famiglia (scudi, gioielli, pozioni, cuoio) non si scrive: non distingue.
import { figura } from './figura.js'
import { pezzoAndante } from '../dati/tessere.js'
import { FAMIGLIE } from '../dati/eroi.js'

const props = defineProps({
  eroi: { type: Array, required: true },     // le schede di dati/eroi.js
  scelto: { type: String, default: '' },
  primo: { type: Boolean, default: false },  // la prima volta non si può annullare
})
defineEmits(['scegli', 'chiudi'])

const posa = e => figura(pezzoAndante(e.sprite, 'fermo', 0), { scala: 3 })   // fermo-0: la posa più leggibile

// il fondo scala è l'eroe più forte in quella colonna, non un massimo inventato
const piuVita = Math.max(...props.eroi.map(e => e.vita))
const piuAtt = Math.max(...props.eroi.map(e => e.att))

const porta = e => (e.porta || []).map(f => FAMIGLIE[f]).filter(Boolean)
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
          <!-- cosa impugna e cosa veste, prima di scegliere e non tre piani più sotto -->
          <span class="sot-porta" :data-porta="e.chiave">
            <span v-for="f in porta(e)" :key="f.corto">
              <em class="em">{{ f.em }}</em>{{ f.corto }}
            </span>
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

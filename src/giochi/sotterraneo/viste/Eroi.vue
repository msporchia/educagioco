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

   ── E COSA PORTA, PRIMA DI SCEGLIERE ──────────────────────────────
   La terza riga dice cosa impugna e cosa veste, **con le figure**:
   «⚔️ spade · 🪓 asce · 🛡️ ferro». È la metà che mancava — da quando le
   classi hanno un limite, sceglierlo senza saperlo vorrebbe dire
   scoprirlo tre piani più giù davanti a un forziere, che è il modo di
   trasformare una scelta in una fregatura. Le icone e non le parole
   perché questa carta la guarda anche chi non legge ancora: quattro
   simboli in fila si contano, tre righe di elenco no.

   Quello che **non ha famiglia** non si scrive: gli scudi, i gioielli,
   le pozioni e il cuoio li porta chiunque, e stamparli su tutte e
   quattro le carte sarebbe rumore uguale quattro volte. Qui si mostra
   solo quello che distingue.
   ═══════════════════════════════════════════════════════════════════ */
import { figura } from './figura.js'
import { pezzoAndante } from '../dati/tessere.js'
import { FAMIGLIE } from '../dati/eroi.js'

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

/* Le famiglie di una classe, già pronte da stampare: la vista non sa
   cosa sia una famiglia, chiede alla tabella. */
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
          <!-- cosa impugna e cosa veste: con le figure, prima di
               sceglierlo e non tre piani più sotto -->
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

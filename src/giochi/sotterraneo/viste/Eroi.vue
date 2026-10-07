<script setup>
// Le quattro avventure, una per eroe (docs/sotterraneo/avventure.md): scegliere chi scende è scegliere quale
// storia riprendere. Ogni scheda dice a che punto è (discese, stelle, la roba addosso, il record dell'abisso, la
// discesa a metà), o «nuova avventura». I numeri sono quelli veri, con la roba addosso (Gioco.vue li chiede a
// schedaConLaRoba): vita e braccio anche come barrette, che un bambino confronta più facilmente delle cifre; il
// ritratto tiene in mano l'arma e lo scudo, e la riga sotto dice cosa impugna e cosa veste, con le figure.
import { FAMIGLIE } from '../dati/eroi.js'
import Icona from './Icona.vue'
import Armato from './Armato.vue'

const props = defineProps({
  // le schede di dati/eroi.js, ognuna col suo punto e i numeri con la roba: { nuova, vita, att, dif, tratti, mano,
  // mancina, discese, quante, stelle, addosso, gemme, fondo, aMeta, aMetaIcona }
  avventure: { type: Array, required: true },
  scelto: { type: String, default: '' },
  primo: { type: Boolean, default: false },  // la prima volta non si può annullare
})
defineEmits(['scegli', 'chiudi'])

// il fondo scala è l'eroe più forte in quella colonna (con la sua roba), non un massimo inventato: nessuna barra sborda
const piuVita = Math.max(...props.avventure.map(e => e.vita))
const piuAtt = Math.max(...props.avventure.map(e => e.att))

const porta = e => (e.porta || []).map(f => FAMIGLIE[f]).filter(Boolean)
</script>

<template>
  <div class="sot-velo" @click.self="!primo && $emit('chiudi')">
    <div class="sot-modale">
      <h2><span class="em">🕯️</span> {{ primo ? 'Chi scende?' : 'Le avventure' }}</h2>
      <p>
        {{ primo ? 'Ognuno ha la sua avventura, con la sua roba e le sue discese. Puoi provarli tutti.'
                 : 'Ognuno ha la sua avventura: la ritrovi dove l\'hai lasciata, con la sua roba.' }}
      </p>

      <button v-for="e in avventure" :key="e.chiave" class="sot-eroe"
              :class="{ 'sot-scelto': e.chiave === scelto }"
              :data-eroe="e.chiave" :data-nuova="e.nuova ? 1 : 0" @click="$emit('scegli', e.chiave)">
        <Armato :eroe="e" :mano="e.mano" :mancina="e.mancina" :scala="3" />
        <span class="sot-testo">
          <b>{{ e.nome }}</b>
          <!-- a che punto è la sua storia: prima di tutto il resto, perché è quello che si sceglie -->
          <span v-if="e.nuova" class="sot-punto sot-nuova" data-punto>nuova avventura</span>
          <span v-else class="sot-punto em" data-punto>
            <span>🏁 {{ e.discese }} di {{ e.quante }}</span>
            <span v-if="e.stelle">⭐ {{ e.stelle }}</span>
            <span v-for="r in e.addosso" :key="r.chiave" class="sot-addosso" :data-addosso="r.chiave">
              <Icona :sprite="r.sprite" :em="r.em" :emAlto="14" :scala="1" />
            </span>
            <span v-if="e.gemme">💎 {{ e.gemme }}</span>
            <span v-if="e.fondo" data-fondo>🕳️ {{ e.fondo }}</span>
          </span>
          <span v-if="e.aMeta" class="sot-a-meta" data-a-meta>
            <img v-if="e.aMetaIcona" class="sot-ritaglio" :src="e.aMetaIcona" alt="" data-ritaglio>
            a metà: {{ e.aMeta.toLowerCase() }}
          </span>
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
          <span v-if="e.tratti.length" class="sot-tratti" data-tratti>
            <span v-for="t in e.tratti" :key="t" class="em">{{ t }}</span>
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

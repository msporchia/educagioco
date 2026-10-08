<script setup>
// Il confronto affiancato di un pezzo che si può indossare, come in Diablo: a sinistra quello che si ha addosso
// nel posto («Addosso»), a destra il pezzo guardato («Questo»), una riga per ogni abilità che almeno uno dei due
// ha, verde con ▲ dove il nuovo è meglio e rossa con ▼ dove è peggio. In cima la sintesi, sotto il totale che
// cambia sull'eroe. I numeri li dà il motore (seLoMetto.cambio), le parole pezzo.js; il perché: docs/sotterraneo/roba.md
import { computed } from 'vue'
import Icona from './Icona.vue'
import { PEZZI } from '../dati/atlante.js'
import { COSE } from '../dati/cose.js'
import { GRADINI, gradinoDi, tipoDi, affiancatoDi, confrontoDi, POSTO } from './pezzo.js'

const props = defineProps({
  cosa: { type: Object, required: true },   // il pezzo guardato (COSE[k] con la chiave)
  prova: { type: Object, required: true },  // seLoMetto(k), con `prima`
})

const aff = computed(() => affiancatoDi(props.prova, props.cosa))
const totali = computed(() => confrontoDi(props.prova))
const colore = c => GRADINI[gradinoDi(c)].colore
const vecchi = computed(() => aff.value.toglie.map(k => ({ chiave: k, ...COSE[k] })).filter(c => c.nome))
// un'arma nella mano libera: a sinistra non c'è niente da togliere, ma il posto è la mano, non lo scudo
const nellaMano = computed(() => props.cosa.dove === 'mano' && aff.value.dove === 'mancina')
const posto = computed(() => (nellaMano.value ? POSTO.mano : POSTO[aff.value.dove] || POSTO.dito))
// il disegno piccolo: un anello cresce fino a riempire il riquadro, una spada lunga ci sta a due
const scala = c => {
  const p = c.sprite ? PEZZI[c.sprite] : null
  return p ? Math.max(1, Math.min(3, Math.floor(30 / p[3]))) : 2
}
const tono = computed(() => (aff.value.meglio > aff.value.peggio ? 'su' : aff.value.peggio > aff.value.meglio ? 'giu'
  : aff.value.meglio ? 'pari' : 'uguale'))
const nomi = computed(() => vecchi.value.map(c => c.nome.toLowerCase()).join(' e '))
</script>

<template>
  <div class="sot-affianca" data-affianca>
    <p class="sot-sintesi" :class="'sot-sintesi-' + tono" data-sintesi>{{ aff.sintesi }}</p>
    <div v-if="totali.length" class="sot-confronto" data-confronto-tutto>
      <span v-for="r in totali" :key="r.campo" class="sot-confronto-riga em" :class="r.su ? 'sot-su' : 'sot-giu'"
            :data-confronto="r.campo" :data-verso="r.su ? 'su' : 'giu'">
        {{ r.em }} {{ r.prima }} → {{ r.dopo }}
      </span>
    </div>
    <p v-if="aff.dueMani" class="sot-due-mani" data-due-mani>
      <span class="em">✋</span> Vuole tutte e due le mani: prende il posto di {{ nomi }}.
    </p>

    <div class="sot-tabella">
      <span class="sot-tab-vuoto"></span>
      <div class="sot-tab-testa" data-colonna="addosso">
        <small>Addosso</small>
        <span v-for="v in vecchi" :key="v.chiave" class="sot-tab-pezzo" :style="{ '--sot-gradino': colore(v) }"
              :data-pezzo="v.chiave">
          <i class="sot-tab-icona"><Icona :sprite="v.sprite" :em="v.em" :scala="scala(v)" :emAlto="22" /></i>
          <b>{{ v.nome }}</b>
        </span>
        <span v-if="!vecchi.length" class="sot-tab-pezzo sot-tab-niente" data-niente>
          <i class="sot-tab-icona"><span class="em">{{ posto.em }}</span></i>
          <b>{{ nellaMano ? 'mano libera' : 'niente' }}</b>
        </span>
      </div>
      <div class="sot-tab-testa" data-colonna="questo">
        <small>Questo</small>
        <span class="sot-tab-pezzo" :style="{ '--sot-gradino': colore(cosa) }" :data-pezzo="cosa.chiave">
          <i class="sot-tab-icona"><Icona :sprite="cosa.sprite" :em="cosa.em" :scala="scala(cosa)" :emAlto="22" /></i>
          <b>{{ cosa.nome }}</b>
        </span>
      </div>

      <template v-for="r in aff.righe" :key="r.campo">
        <span class="sot-tab-abilita" :class="'sot-v-' + r.verso" :data-abilita="r.campo" :data-verso="r.verso">
          <span class="em">{{ r.em }}</span> {{ r.nome }}
        </span>
        <span class="sot-tab-valore" :class="['sot-v-' + r.verso, { 'sot-nulla': r.vecchio === '—' }]"
              :data-valore="r.campo + '-addosso'">{{ r.vecchio }}</span>
        <span class="sot-tab-valore sot-tab-nuovo" :class="['sot-v-' + r.verso, { 'sot-nulla': r.nuovo === '—' }]"
              :data-valore="r.campo + '-questo'">
          {{ r.nuovo }}<b v-if="r.verso !== 'pari'" class="sot-freccia" aria-hidden="true">{{ r.verso === 'su' ? '▲' : '▼' }}</b>
        </span>
      </template>
    </div>
    <p class="sot-tab-tipo">{{ tipoDi(cosa) }} · {{ GRADINI[gradinoDi(cosa)].nome }}</p>
  </div>
</template>

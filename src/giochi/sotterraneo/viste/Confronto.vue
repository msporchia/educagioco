<script setup>
// Il confronto di un pezzo che si può indossare, come i cartellini di Diablo: due blocchetti affiancati, a sinistra
// quello che si ha addosso nel posto («Addosso»), a destra il pezzo guardato («Questo»); ognuno col nome del colore
// della sua rarità, il livello, che cos'è, e i suoi numeri e le sue abilità. Sopra, una riga sola col risultato netto
// se lo indossi («⚔️ +4 · 🛡️ −2»), e quando cambiano le mani lo si dice chiaro. Provato: una tabella riga per riga
// (attacco|attacco, difesa|difesa); con le abilità due pezzi con effetti diversi non si confrontavano più.
// I numeri li dà il motore (seLoMetto.cambio), le parole pezzo.js; il perché: docs/sotterraneo/bottega.md
import { computed } from 'vue'
import Icona from './Icona.vue'
import { PEZZI } from '../dati/atlante.js'
import { COSE } from '../dati/cose.js'
import { GRADINI, gradinoDi, tipoDi, requisitoScritto, confrontoDi, ABILITA, POSTO, conArticolo } from './pezzo.js'

const props = defineProps({
  cosa: { type: Object, required: true },   // il pezzo guardato (COSE[k] con la chiave)
  prova: { type: Object, required: true },  // seLoMetto(k), con `prima` e `cambio`
})

const cambio = computed(() => props.prova.cambio)
const colore = c => GRADINI[gradinoDi(c)].colore
const vecchi = computed(() => cambio.value.toglie.map(k => ({ chiave: k, ...COSE[k] })).filter(c => c.nome))
// un'arma nella mano libera: a sinistra non c'è niente da togliere, ma il posto è la mano, non lo scudo
const nellaMano = computed(() => props.cosa.dove === 'mano' && cambio.value.dove === 'mancina')
const posto = computed(() => (nellaMano.value ? POSTO.mano : POSTO[cambio.value.dove] || POSTO.dito))
const scala = c => {
  const p = c.sprite ? PEZZI[c.sprite] : null
  return p ? Math.max(1, Math.min(3, Math.floor(30 / p[3]))) : 2
}
// i numeri di un blocchetto: quello che danno all'eroe le sue caselle (la mano debole vale metà braccio)
const righeDi = n => ABILITA.filter(a => n[a.campo]).map(a => ({ campo: a.campo, em: a.em, nome: a.nome, valore: a.scrivi(n[a.campo]) }))
const sinistra = computed(() => righeDi(cambio.value.vecchi))
const destra = computed(() => righeDi(cambio.value.nuovi))

// il netto sull'eroe se lo indossa: «⚔️ +4 · 🛡️ −2»
const netto = computed(() => confrontoDi(props.prova).map(r => {
  const d = typeof r.prima === 'string' && /^[0-9]+$/.test(r.prima) ? Number(r.dopo) - Number(r.prima) : null
  return { ...r, testo: d == null ? `${r.prima} → ${r.dopo}` : `${d > 0 ? '+' : '−'}${Math.abs(d)}` }
}))

// una mano o due, quando cambia: lo si dice con le cose vere
const mani = computed(() => {
  const due = props.cosa.mani === 2
  // `toglie` è in ordine di casella: la mano, poi la mano debole
  if (due && vecchi.value.length > 1) return `A due mani: ${conArticolo(vecchi.value[1])} torna nello zaino.`
  const prima = vecchi.value.find(c => c.dove === 'mano')
  if (props.cosa.dove === 'mano' && !due && prima && prima.mani === 2) return 'A una mano: l\'altra mano resta libera per uno scudo.'
  return null
})
</script>

<template>
  <div class="sot-affianca" data-affianca>
    <div v-if="netto.length" class="sot-confronto" data-confronto-tutto>
      <span class="sot-netto-detto">se lo metti</span>
      <span v-for="r in netto" :key="r.campo" class="sot-confronto-riga em" :class="r.su ? 'sot-su' : 'sot-giu'"
            :data-confronto="r.campo" :data-verso="r.su ? 'su' : 'giu'">{{ r.em }} {{ r.testo }}</span>
    </div>
    <p v-else class="sot-sintesi sot-sintesi-uguale" data-confronto-tutto>se lo metti, non cambia niente</p>
    <p v-if="mani" class="sot-due-mani" data-due-mani><span class="em">✋</span> {{ mani }}</p>

    <div class="sot-cartellini">
      <div class="sot-cartellino" data-colonna="addosso">
        <small>Addosso</small>
        <div v-for="v in vecchi" :key="v.chiave" class="sot-cart-pezzo" :style="{ '--sot-gradino': colore(v) }" :data-pezzo="v.chiave">
          <i class="sot-tab-icona"><Icona :sprite="v.sprite" :em="v.em" :scala="scala(v)" :emAlto="22" /></i>
          <span><b>{{ v.nome }}</b><em>{{ tipoDi(v) }} · liv. {{ v.liv || 1 }} · {{ GRADINI[gradinoDi(v)].nome }}<template v-if="requisitoScritto(v)"> · {{ requisitoScritto(v) }}</template></em></span>
        </div>
        <div v-if="!vecchi.length" class="sot-cart-pezzo sot-tab-niente" data-niente>
          <i class="sot-tab-icona"><span class="em">{{ posto.em }}</span></i>
          <span><b>{{ nellaMano ? 'mano libera' : 'niente' }}</b></span>
        </div>
        <ul class="sot-cart-numeri">
          <li v-for="r in sinistra" :key="r.campo" :data-valore="r.campo + '-addosso'" :data-n="r.valore"><span class="em">{{ r.em }}</span> {{ r.valore }}
            <small>{{ r.nome.toLowerCase() }}</small></li>
        </ul>
      </div>
      <div class="sot-cartellino sot-cart-questo" data-colonna="questo" :style="{ '--sot-gradino': colore(cosa) }">
        <small>Questo</small>
        <div class="sot-cart-pezzo" :data-pezzo="cosa.chiave">
          <i class="sot-tab-icona"><Icona :sprite="cosa.sprite" :em="cosa.em" :scala="scala(cosa)" :emAlto="22" /></i>
          <span><b>{{ cosa.nome }}</b><em>{{ tipoDi(cosa) }} · liv. {{ cosa.liv || 1 }} · {{ GRADINI[gradinoDi(cosa)].nome }}<template v-if="requisitoScritto(cosa)"> · {{ requisitoScritto(cosa) }}</template></em></span>
        </div>
        <ul class="sot-cart-numeri">
          <li v-for="r in destra" :key="r.campo" :data-valore="r.campo + '-questo'" :data-n="r.valore"><span class="em">{{ r.em }}</span> {{ r.valore }}
            <small>{{ r.nome.toLowerCase() }}</small></li>
        </ul>
      </div>
    </div>
    <p v-if="cosa.storia" class="sot-pannello-storia" data-storia>{{ cosa.storia }}</p>
  </div>
</template>

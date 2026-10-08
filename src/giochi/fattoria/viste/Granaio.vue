<script setup>
/* Dentro un silo: uno scomparto per merce, vuoti compresi (solo quelli aperti). Premere una roba
   dice chi la usa — vedi docs/fattoria/campi-e-silos.md. Non sa niente del profilo. */
import { computed, ref, watch } from 'vue'
import { PRODOTTI, SILI, SCOMPARTO_PIU } from '../dati/coltivazioni.js'
import { serveA } from '../dati/usi.js'
import { laMacchina } from '../dati/catalogo.js'
import { dentroA } from '../motore/consiglio.js'
import Merce from './Merce.vue'
import Chiudi from './Chiudi.vue'

const props = defineProps({
  // 'terra' o 'stalla': il perché di due silos sta in coltivazioni.js
  famiglia: { type: String, default: 'terra' },
  // [{prodotto, posti, quanti, pieno}], già contati dal motore (Fattoria.scomparti), solo gli aperti
  scomparti: { type: Array, default: () => [] },
  // Quanto ci sta in uno scomparto: a parte, perché la lista può essere vuota (un silo appena costruito).
  posti: { type: Number, default: 0 },
  // quante volte è già stato ingrandito, e quanto costa la prossima
  livello: { type: Number, default: 0 },
  costo: { type: Number, default: 0 },
  monete: { type: Number, default: 0 },
})
defineEmits(['ingrandisci', 'chiudi', 'albero'])

const silo = computed(() => SILI[props.famiglia] || SILI.terra)
const roba = id => PRODOTTI[id] || { nome: id, emoji: '📦' }
const manca = computed(() => Math.max(0, props.costo - props.monete))

// Chi usa questa roba: una riga alla volta (ripremendo si chiude).
const aperto = ref(null)
const tocca = id => { aperto.value = aperto.value === id ? null : id }
// Cambiando silo si chiude quello che era aperto (roba dell'altro silo non c'entra).
watch(() => props.famiglia, () => { aperto.value = null })

const usiDi = computed(() => aperto.value ? serveA(aperto.value) : [])
const dice = u => {
  if (u.che === 'ricetta') {
    const dove = laMacchina(u.dove)
    // Il nome e non l'emoji: la riga sopra mostra già la figura vera.
    return `${u.quanti} ${dentroA(dove)}` +
           ` ${u.minuti > 0 ? `(${u.minuti} min)` : ''} → ${u.resa} ${u.nome.toLowerCase()}`
  }
  if (u.che === 'cibo')
    return `nella ciotola: riempie ${Math.round(u.quanto * 100)}% di pancia`
  // L'uscita che non passa dalla ciotola: un mestiere che la chiede al mercato.
  if (u.che === 'ordine') return `${u.emoji} ${u.nome.toLowerCase()} la chiede al mercato`
  if (u.che === 'bottega') return `${u.emoji} la vuole ${u.la ? 'la' : 'il'} ${u.nome.toLowerCase()}`
  return `${u.nome.toLowerCase()}, per il ${u.bisogno.toLowerCase()}`
}
</script>

<template>
  <div class="fa-foglio fa-granaio">
    <Chiudi @chiudi="$emit('chiudi')" />
    <h2>{{ silo.nome }}</h2>

    <!-- Cosa ci sta, in numero: "8 di ogni cosa" è la regola intera. -->
    <p class="fa-posti"><b>{{ posti }}</b> di ogni cosa</p>

    <!-- Un silo comprato prima di avere di che riempirlo (la stalla, prima delle bestie). -->
    <p v-if="!scomparti.length" class="fa-piccolo">Qui dentro non c'è
       ancora niente da mettere: ci arriverà {{ silo.vuoto }}.</p>

    <!-- Come in Hay Day: la figura grande e il numero, niente righe da leggere. Il nome c'è per chi
         non vede (e per i test), non a schermo: la figura lo dice già. Oro: lo scomparto è pieno. -->
    <div class="fa-scomparti">
      <button v-for="s in scomparti" :key="s.prodotto" type="button"
              :class="['fa-scomparto', { colmo: s.pieno, vuoto: !s.quanti,
                                         viva: aperto === s.prodotto }]"
              @click="tocca(s.prodotto)">
        <Merce :merce="s.prodotto" :lato="56" />
        <span class="fa-nascosto">{{ roba(s.prodotto).nome }}</span>
        <span class="fa-conto">{{ s.quanti }}<em>/{{ s.posti }}</em></span>
      </button>
    </div>

    <!-- Chi usa la roba toccata, e da lì la strada intera (viste/Albero.vue). -->
    <div v-if="aperto" class="fa-usi">
      <b><Merce :merce="aperto" :lato="26" /> {{ roba(aperto).nome }}</b>
      <p v-for="(u, i) in usiDi" :key="i">{{ dice(u) }}</p>
      <p v-if="!usiDi.length">Per adesso non serve a niente.</p>
      <button type="button" class="fa-bot piccolo" data-azione="albero"
              @click="$emit('albero', aperto)">🌳 Come si fa</button>
    </div>

    <!-- Il tasto spento dice di quanto manca, come in tutto il resto del gioco. -->
    <div class="fa-fila">
      <button class="fa-bot forte" :disabled="manca > 0" @click="$emit('ingrandisci')">
        Ingrandisci <span class="fa-piu">+{{ SCOMPARTO_PIU }}</span>
        · {{ manca ? `manca 🪙${manca}` : `🪙${costo}` }}</button>
    </div>
  </div>
</template>

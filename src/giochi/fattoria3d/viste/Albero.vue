<script setup>
// «🌳 Come si fa»: tutta la strada di una merce, in colonna e a figure, e a che punto si è. Riceve l'albero già pronto (dati/albero.js) e lo disegna con
// le rotaie; non decide niente: il tasto sulle righe che mancano manda su l'azione del consiglio (`fai`). ✕ in alto a destra. Vedi docs/fattoria3d/guida.md.
import { computed } from 'vue'
import { righeDi } from '../dati/albero.js'
import Faccia from './Faccia.vue'
import '../stile-albero.css'

const props = defineProps({ albero: { type: Object, default: null } })      // quello che torna da alberoDi
defineEmits(['fai', 'chiudi'])
const righe = computed(() => righeDi(props.albero))
const secondi = s => (s >= 90 ? Math.round(s / 6) / 10 + ' min' : s + ' s')

// Cosa dice la riga della merce: verde se basta, ambra se manca; per una coltura lo stato del campo.
function dice(n) {
  if (n.stato === 'arriva') return n.arriva ? `arriva al livello ${n.arriva}` : 'si fa in fattoria'
  if (n.stato === 'ok') return `✓ ne hai ${n.ho}`
  const v = n.via
  if (v && v.che === 'campo' && v.stato === 'pronto') return '🧺 è pronto in un campo'
  if (v && v.che === 'campo' && v.stato === 'cresce') return `🌱 sta crescendo · ${secondi(v.manca)}`
  const manca = n.servono - n.ho
  return n.ho ? `ne hai ${n.ho}, ${manca === 1 ? 'manca' : 'mancano'} ${manca}` : 'manca'
}
// La riga di dove si fa (campo, macchina, bestie, molo) e a che punto è.
function diceVia(v) {
  switch (v.stato) {
    case 'pronto': return v.che === 'campo' ? '🧺 un campo è pronto' : '🧺 c\'è roba pronta da ritirare'
    case 'lavora': return `⏳ pronto fra ${secondi(v.manca)}`
    case 'cresce': return `🌱 cresce, pronto fra ${secondi(v.manca)}`
    case 'compra': return `🛒 non ce l'hai · 🪙${v.prezzo}`
    case 'magazzino': return '📦 ce l\'hai nel magazzino: mettilo in mappa'
    case 'arriva': return `arriva al livello ${v.arriva}`
    case 'nessuno': return '🏗 costruisci un campo'
    case 'libero': return 'si semina in un campo vuoto'
    case 'occupati': return 'i campi sono tutti pieni'
    default: return '✓ ce l\'hai'
  }
}
const tempoVia = v => (v.che === 'bestie' || !v.secondi ? '' : ' · ' + secondi(v.secondi))
// Che rotaia disegnare: chiude è l'ultimo fratello, apre è la riga di dove si fa (in testa al gruppo).
const snodo = n => (n.ultimo ? 'chiude' : 'mezzo')
const snodoSotto = n => (n.rami.length ? 'apre' : 'chiude')
const aspetto = v => (['compra', 'magazzino', 'nessuno', 'arriva'].includes(v.stato) ? 'manca' : v.stato === 'lavora' || v.stato === 'cresce' ? 'lavora' : 'ok')
</script>

<template>
  <div v-if="albero" class="f3-foglio f3-colonna f3-albero" data-f3="albero" :data-albero-di="albero.k">
    <h2>🌳 Come si fa</h2>
    <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-corpo f3-albero-corpo">
      <template v-for="(n, i) in righe" :key="i">
        <!-- la merce -->
        <div class="f3a-riga" data-f3="albero-riga" :data-albero-riga="n.k" :data-stato="n.stato">
          <span class="f3a-rotaie" aria-hidden="true">
            <i v-for="(g, j) in n.guide" :key="j" :class="['f3a-rot', { giu: g }]" />
            <i v-if="n.livello" :class="['f3a-rot', snodo(n)]" />
          </span>
          <div :class="['f3a-ramo', n.stato, { radice: n.livello === 0 }]">
            <Faccia :k="n.k" :emoji="n.emoji" :lato="n.livello === 0 ? 52 : 40" />
            <span class="f3a-testo">
              <b>{{ n.nome }}<em v-if="n.livello"> ×{{ n.servono }}</em></b>
              <span>{{ dice(n) }}</span>
            </span>
            <button v-if="n.azione" type="button" class="f3a-bot" data-f3="albero-fai" :data-azione="n.azione.che" @click="$emit('fai', n.azione)">{{ n.etichetta || 'Portami lì' }}</button>
          </div>
        </div>
        <!-- dove si fa: in mezzo, apre il gruppo degli ingredienti -->
        <div v-if="n.via" class="f3a-riga" data-f3="albero-via" :data-albero-via="n.via.tipo">
          <span class="f3a-rotaie" aria-hidden="true">
            <i v-for="(g, j) in n.guideSotto" :key="j" :class="['f3a-rot', { giu: g }]" />
            <i :class="['f3a-rot', snodoSotto(n)]" />
          </span>
          <div :class="['f3a-ramo', 'via', aspetto(n.via)]">
            <span class="f3a-luogo" aria-hidden="true">{{ n.via.emoji }}</span>
            <span class="f3a-testo">
              <b>{{ n.via.nome }}<em>{{ tempoVia(n.via) }}</em></b>
              <span>{{ diceVia(n.via) }}</span>
            </span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

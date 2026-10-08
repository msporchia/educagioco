<script setup>
/* L'albero di una merce, in colonna: tutta la strada e a che punto si è, con le rotaie di un albero
   vero — vedi docs/fattoria/pagina-albero.md. Non compone niente: riceve da dati/albero.js e disegna. */
import { computed } from 'vue'
import { righeDi } from '../dati/albero.js'
import { dentroA } from '../motore/consiglio.js'
import Merce from './Merce.vue'
import Provino from './Provino.vue'
import { PER_ID } from '../dati/catalogo.js'
import Chiudi from './Chiudi.vue'

const props = defineProps({
  // quello che torna da alberoDi
  albero: { type: Object, default: null },
})
const emit = defineEmits(['fai', 'chiudi'])

const righe = computed(() => righeDi(props.albero))
const radice = computed(() => props.albero || { nome: '?', emoji: '📦' })

// Cosa dice la riga della merce: verde se basta, ambra se manca, per una coltura lo stato del campo.
const dice = n => {
  if (n.stato === 'arriva')
    return n.arriva ? `arriva al livello ${n.arriva}` : 'non si fa in fattoria'
  if (n.stato === 'ok') return `✓ ne hai ${n.ho}`
  const campo = n.via && n.via.campo
  if (campo) {
    if (campo.stato === 'pronto') return '🧺 pronto in un campo'
    if (campo.stato === 'cresce') return `🌱 sta crescendo · ${campo.manca} min`
  }
  return n.ho ? `ne hai ${n.ho}, ${n.servono - n.ho === 1 ? 'manca' : 'mancano'} ${n.servono - n.ho}`
              : 'manca'
}

// La riga della macchina, fra la merce e i suoi ingredienti.
const macchina = n => n.via && n.via.macchina
const diceMacchina = m => {
  if (m.stato === 'ok') return '✓ ce l\'hai'
  // Con la fila: quanti ne sta facendo, o che è piena di altro.
  if (m.stato === 'lavora' && m.piena)
    return `⏳ ${m.unPosto ? 'fa altro' : 'fila piena'} · si libera fra ${m.manca} min`
  if (m.stato === 'lavora' && m.ne > 1) return `⏳ ne fa ${m.ne}, pronto fra ${m.manca} min`
  if (m.stato === 'lavora') return `⏳ pronto fra ${m.manca} min`
  if (m.stato === 'premio') return '🎁 ti aspetta nei premi'
  if (m.arriva) return `arriva al livello ${m.arriva}`
  return `🛒 non ce l'hai · 🪙${m.prezzo}`
}
// Le altre strade aperte, scritte dove si fanno: "o nella conigliera".
const altrove = via => {
  const alt = (via && via.alternative) || []
  if (!alt.length) return ''
  const dove = [...new Set(alt.map(a => a.dove ? dentroA(a.dove) : 'in un campo'))]
  return `o ${dove.join(', o ')}`
}

// Il disegno della macchina, dal catalogo.
const pezzoDi = id => (PER_ID[id] || {}).pezzo || null

// Il tasto: cosa c'è scritto dipende da dove porta, come in Passo.vue.
const etichetta = a => !a ? ''
  : a.che === 'compra' ? 'Apri il baule'
  : a.che === 'premio' ? 'Vai al premio'
  : a.che === 'ingrandisci' ? `Ingrandisci · 🪙${a.prezzo}`
  : 'Portami lì'

// Che rotaia disegnare: chiude è l'ultimo fratello, apre è la riga della macchina (in testa al gruppo).
const snodo = n => n.ultimo ? 'chiude' : 'mezzo'
const snodoSotto = n => n.rami.length ? 'apre' : 'chiude'
</script>

<template>
  <div class="fa-foglio fa-albero" data-albero :data-albero-di="radice.prodotto">
    <Chiudi @chiudi="$emit('chiudi')" />
    <h2>🌳 Come si fa</h2>

    <div class="fa-rami">
      <template v-for="n in righe" :key="n.prodotto + '@' + n.livello">
        <!-- la merce -->
        <div class="fa-riga" :data-albero-riga="n.prodotto" :data-stato="n.stato">
          <span class="fa-rotaie" aria-hidden="true">
            <i v-for="(g, i) in n.guide" :key="i" :class="['fa-rot', { giu: g }]" />
            <i v-if="n.livello" :class="['fa-rot', snodo(n)]" />
          </span>
          <div :class="['fa-ramo', n.stato, { radice: n.livello === 0 }]">
            <Merce :merce="n.prodotto" :lato="n.livello === 0 ? 56 : 44" />
            <span class="fa-ramo-testo">
              <b>{{ n.nome }}<em v-if="n.livello"> ×{{ n.servono }}</em></b>
              <span>{{ dice(n) }}</span>
            </span>
            <button v-if="n.via && n.via.azione" type="button" class="fa-bot piccolo"
                    :data-albero-azione="n.via.azione.che"
                    @click="emit('fai', n.via.azione)">{{ etichetta(n.via.azione) }}</button>
          </div>
        </div>
        <!-- la macchina (o il campo) in mezzo: apre il gruppo degli ingredienti -->
        <div v-if="n.via" class="fa-riga"
             :data-albero-macchina="macchina(n) ? macchina(n).id : null">
          <span class="fa-rotaie" aria-hidden="true">
            <i v-for="(g, i) in n.guideSotto" :key="i" :class="['fa-rot', { giu: g }]" />
            <i :class="['fa-rot', snodoSotto(n)]" />
          </span>
          <div :class="['fa-ramo', 'fa-macchina', macchina(n) ? macchina(n).stato : 'ok']">
            <!-- la macchina si riconosce dal disegno, come nel baule -->
            <Provino v-if="macchina(n) && pezzoDi(macchina(n).id)" :pezzo="pezzoDi(macchina(n).id)"
                     :lato="40" />
            <span class="fa-ramo-testo">
              <b>{{ macchina(n) ? macchina(n).nome : n.via.nome
                 }}<em> · {{ n.via.minuti }} min</em></b>
              <span>{{ macchina(n) ? diceMacchina(macchina(n)) : 'si semina in un campo' }}</span>
              <small v-if="altrove(n.via)" class="fa-ramo-altrove"
                     data-albero-altrove>{{ altrove(n.via) }}</small>
            </span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

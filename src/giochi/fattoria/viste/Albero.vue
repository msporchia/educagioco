<script setup>
/* ═══════════════════════════════════════════════════════════════════
   COME SI FA — L'ALBERO DI UNA MERCE, IN COLONNA

   Il consiglio dice il prossimo passo; questa pagina dice **tutta la
   strada**, e a che punto si è. In cima la merce scelta, sotto quello
   che le serve, e giù fino ai campi: ogni riga è una carta con la
   faccia vera, quanti ne servono contro quanti ne hai, e uno stato.
   Fra una merce e i suoi ingredienti c'è **la macchina**, con i suoi
   quattro stati (ce l'hai · sta lavorando · da comprare · nei premi).

   Si apre sempre **con una merce già scelta** — dal silo, dal mercato,
   dalla macchina — e non c'è una vista «tutto l'albero»: sarebbe un
   poster di quaranta nodi su un telefono, e un bambino non cerca
   l'albero, cerca il maglione.

   Non compone niente: riceve l'albero da `dati/albero.js` e lo
   disegna. Le righe ambra portano l'azione del consiglio, e premerla
   fa quello che farebbe il tasto sotto la ricetta — lo stesso
   `esegui(azione)` di `Gioco.vue`.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { righeDi } from '../dati/albero.js'
import Merce from './Merce.vue'

const props = defineProps({
  /* quello che torna da `alberoDi` */
  albero: { type: Object, default: null },
})
const emit = defineEmits(['fai', 'chiudi'])

const righe = computed(() => righeDi(props.albero))
const radice = computed(() => props.albero || { nome: '?', emoji: '📦' })

/* Cosa dice la riga della merce: verde se ne hai abbastanza, ambra se
   manca, e per una coltura lo stato del campo. */
const dice = n => {
  if (n.stato === 'arriva')
    return n.arriva ? `arriva al livello ${n.arriva}` : 'non si fa in fattoria'
  if (n.stato === 'ok') return `✓ ne hai ${n.ho}`
  const campo = n.via && n.via.campo
  if (campo) {
    if (campo.stato === 'pronto') return `🧺 pronto in un campo`
    if (campo.stato === 'cresce') return `🌱 sta crescendo · ${campo.manca} min`
  }
  return n.ho ? `ne hai ${n.ho}, ${n.servono - n.ho === 1 ? 'manca' : 'mancano'} ${n.servono - n.ho}`
              : 'manca'
}

/* La riga della macchina, fra la merce e i suoi ingredienti. */
const macchina = n => n.via && n.via.macchina
const diceMacchina = m => {
  if (m.stato === 'ok') return '✓ ce l\'hai'
  if (m.stato === 'lavora') return `⏳ pronto fra ${m.manca} min`
  if (m.stato === 'premio') return '🎁 ti aspetta nei premi'
  if (m.arriva) return `arriva al livello ${m.arriva}`
  return `🛒 non ce l'hai · 🪙${m.prezzo}`
}
/* Il tasto: cosa c'è scritto dipende da dove porta, come in `Passo.vue`. */
const etichetta = a => !a ? ''
  : a.che === 'compra' ? 'Apri il baule'
  : a.che === 'premio' ? 'Vai al premio'
  : a.che === 'ingrandisci' ? `Ingrandisci · 🪙${a.prezzo}`
  : 'Portami lì'
</script>

<template>
  <div class="fa-foglio fa-albero" data-albero :data-albero-di="radice.prodotto">
    <h2>🌳 Come si fa</h2>
    <p class="fa-piccolo">Dall'alto in basso: quello che vuoi, quello che gli
       serve, e giù fino ai campi. Le righe gialle hanno un tasto.</p>

    <div class="fa-rami">
      <template v-for="n in righe" :key="n.prodotto + '@' + n.livello">
        <!-- la merce -->
        <div :class="['fa-ramo', n.stato, { radice: n.livello === 0 }]"
             :style="{ marginLeft: Math.min(n.livello, 4) * 14 + 'px' }"
             :data-albero-riga="n.prodotto" :data-stato="n.stato">
          <Merce :merce="n.prodotto" :lato="n.livello === 0 ? 40 : 30" />
          <span class="fa-ramo-testo">
            <b>{{ n.nome }}<em v-if="n.livello"> ×{{ n.servono }}</em></b>
            <span>{{ dice(n) }}</span>
          </span>
          <button v-if="n.via && n.via.azione" type="button" class="fa-bot piccolo"
                  :data-albero-azione="n.via.azione.che"
                  @click="emit('fai', n.via.azione)">{{ etichetta(n.via.azione) }}</button>
        </div>
        <!-- la macchina in mezzo, come connettore -->
        <div v-if="macchina(n)" :class="['fa-ramo', 'fa-macchina', macchina(n).stato]"
             :style="{ marginLeft: Math.min(n.livello, 4) * 14 + 22 + 'px' }"
             :data-albero-macchina="macchina(n).id">
          <span class="fa-ramo-testo">
            <b>{{ macchina(n).nome }}<em> · {{ n.via.minuti }} min</em></b>
            <span>{{ diceMacchina(macchina(n)) }}</span>
          </span>
        </div>
        <div v-else-if="n.via && n.via.che === 'coltura'" class="fa-ramo fa-macchina ok"
             :style="{ marginLeft: Math.min(n.livello, 4) * 14 + 22 + 'px' }">
          <span class="fa-ramo-testo">
            <b>{{ n.via.nome }}<em> · {{ n.via.minuti }} min</em></b>
            <span>si semina in un campo</span>
          </span>
        </div>
      </template>
    </div>

    <div class="fa-fila">
      <button class="fa-bot" @click="emit('chiudi')">Chiudi</button>
    </div>
  </div>
</template>

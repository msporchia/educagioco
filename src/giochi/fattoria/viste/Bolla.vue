<script setup>
/* La bolla appesa a un campo o a una macchina: i gettoni da trascinare (semi, cesto, ricette), come in
   Hay Day. Non sa le regole né segue il dito: riceve i gettoni già decisi e dice solo «il dito ha preso
   questo» — il trascinamento lo guida Gioco.vue. Vedi docs/fattoria/come-si-tocca.md («La bolla»). */
import { computed } from 'vue'
import Merce from './Merce.vue'

const props = defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  // sotto la cosa invece che sopra: vicino al bordo alto non ci starebbe
  sotto: { type: Boolean, default: false },
  titolo: { type: String, default: '' },
  // la riga che dice il gesto («trascinalo sui campi vuoti»)
  invito: { type: String, default: '' },
  // [{ chiave, merce | icona, hai, nota, spento, colmo, caselle }]
  gettoni: { type: Array, default: () => [] },
  // il gettone che il dito tiene: si accende, e se è una ricetta mostra cosa prende
  scelta: { type: String, default: '' },
  // un campo che cresce: { merce, quanto, manca }
  attesa: { type: Object, default: null },
  // la fila di una macchina, in piccolo: [{ merce, come: 'pronto'|'lavora'|'aspetta' } | null]
  fila: { type: Array, default: null },
  // c'è un foglio con tutto il resto (la fila per intero, l'albero di quello che manca)
  foglio: { type: Boolean, default: false },
  trascina: { type: Boolean, default: false },
})
const emit = defineEmits(['prendi', 'foglio'])

const colonne = computed(() => Math.max(1, Math.min(5, props.gettoni.length)))
const preso = computed(() => props.gettoni.find(g => g.chiave === props.scelta) || null)

// Il click fantasma di un gettone non deve nascere: lo si toglie alla radice, come sulla tela.
function nienteClick(e) { if (e.cancelable) e.preventDefault() }
</script>

<template>
  <div :class="['fa-bolla', { sotto, trascina }]" data-bolla
       :style="{ left: x + 'px', top: y + 'px' }">
    <div class="fa-bolla-testa">
      <span data-bolla-titolo>{{ titolo }}</span>
      <span v-if="fila" class="fa-bolla-fila" data-bolla-fila>
        <span v-for="(p, i) in fila" :key="i"
              :class="['fa-bolla-posto', p ? p.come : 'vuoto']">
          <Merce v-if="p" :merce="p.merce" :lato="18" />
        </span>
      </span>
      <button v-if="foglio" type="button" class="fa-bolla-foglio" data-bolla-foglio
              aria-label="tutto il resto" @click="emit('foglio')">📋</button>
    </div>

    <div v-if="attesa" class="fa-bolla-attesa">
      <Merce :merce="attesa.merce" :lato="30" />
      <span class="fa-livello">
        <i :style="{ width: Math.round(attesa.quanto * 100) + '%', background: '#8fcf6f' }"></i>
      </span>
      <em>{{ attesa.manca }} min</em>
    </div>

    <div v-if="gettoni.length" class="fa-gettoni" :style="{ '--colonne': colonne }">
      <button v-for="g in gettoni" :key="g.chiave" type="button"
              :class="['fa-gettone', { spento: g.spento, colmo: g.colmo, preso: g.chiave === scelta }]"
              :data-gettone="g.chiave"
              @pointerdown.prevent="e => emit('prendi', g, e)"
              @touchend="nienteClick" @contextmenu.prevent>
        <Merce v-if="g.merce" :merce="g.merce" :lato="36" />
        <span v-else class="fa-gettone-icona">{{ g.icona }}</span>
        <b v-if="g.hai != null" class="fa-gettone-hai">{{ g.hai }}</b>
        <em v-if="g.nota">{{ g.nota }}</em>
      </button>
    </div>

    <!-- Una ricetta presa dice cosa prende, a caselle accese o vuote (come nel foglio della macchina). -->
    <div v-if="preso && preso.caselle" class="fa-bolla-ricetta" data-bolla-ricetta>
      <span v-for="(q, i) in preso.caselle" :key="i" :class="['fa-casella', { piena: q.piena }]">
        <Merce :merce="q.prodotto" :lato="20" />
      </span>
      <b>→</b>
      <Merce :merce="preso.merce" :lato="22" />
      <em v-if="preso.costo">🪙{{ preso.costo }}</em>
    </div>
    <p v-else-if="invito" class="fa-bolla-invito">{{ invito }}</p>
  </div>
</template>

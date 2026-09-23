<script setup>
/* ═══════════════════════════════════════════════════════════════════
   UN ELENCO DI RIGHE — e dentro i blocchi, un altro elenco uguale

   Si chiama da sé: un «ripeti» ha dentro delle righe, che possono
   avere dentro un «se», che ha dentro delle righe. Ogni elenco finisce
   con un «＋» che aggiunge in fondo a **quell'**elenco: è così che si
   entra in un blocco senza trascinare niente.

   Toccare una riga la seleziona, e sotto compaiono i suoi tasti (su,
   giù, doppia, via, e «＋ sotto»); toccare una casella apre la scelta
   **attaccata alla riga**, non in fondo allo schermo — la domanda deve
   stare accanto al tasto che l'ha chiamata, se no l'occhio la perde.

   Non tocca il programma: chiama l'editore che le passa `Editor.vue`
   (provide/inject), e l'editore lo dice a chi coordina.
   ═══════════════════════════════════════════════════════════════════ */
import { inject } from 'vue'
import { pezzi, iconaDi } from './frasi.js'
import { colore } from '../dati/colori.js'
import Scelta from './Scelta.vue'

defineOptions({ name: 'Righe' })
const props = defineProps({
  righe: { type: Array, required: true },
  dove: { type: Object, required: true },     // { progetto, dentro, ramo } di questo elenco
  profondita: { type: Number, default: 0 },
})

const ed = inject('editore')
const conCorpo = i => ['ripeti', 'finche', 'se'].includes(i.tipo)

function tocca(i) {
  if (ed.sola.value) return
  ed.seleziona(ed.sel.value === i.id ? null : i.id)
}
function casella(i, p) {
  if (ed.sola.value || !p.campo) return
  ed.apri(i.id, p.campo, p.tipo)
}
const aperta = (i, p) => ed.aperta.value && ed.aperta.value.id === i.id && ed.aperta.value.campo === p.campo
const apertaQui = i => ed.aperta.value && ed.aperta.value.id === i.id
</script>

<template>
  <ol class="cst-righe" :class="{ 'cst-dentro': profondita > 0 }">
    <li v-for="i in props.righe" :key="i.id" class="cst-riga-posto">
      <div class="cst-riga" :data-riga="i.id"
           :class="{ 'cst-sel': ed.sel.value === i.id, 'cst-accesa': ed.accesa.value === i.id,
                     'cst-guasta': ed.guasto.value === i.id, 'cst-problema': ed.problemi.value.has(i.id),
                     'cst-blocco': conCorpo(i) }"
           :data-guasto="ed.guasto.value === i.id ? '' : null"
           @click="tocca(i)">
        <span class="cst-ico">{{ iconaDi(i, ed.programma.value) }}</span>
        <template v-for="(p, k) in pezzi(i, ed.programma.value)" :key="k">
          <button v-if="p.campo" type="button" class="cst-casella"
                  :class="{ 'cst-aperta': aperta(i, p), 'cst-lav': p.lavagnetta, 'cst-manca': p.manca }"
                  :style="p.colore ? { '--cst-tinta': (colore(p.colore) || {}).tinta } : null"
                  :aria-label="p.etichetta || null"
                  :data-casella="p.campo" @click.stop="casella(i, p)">
            <i v-if="p.colore" class="cst-quadretto"></i>{{ p.mostra }}
          </button>
          <span v-else class="cst-testo" :class="{ 'cst-nome-prog': p.progetto, 'cst-misura': p.misura }">{{ p.testo }}</span>
        </template>
        <span v-if="ed.giro.value && ed.giro.value.id === i.id" class="cst-giro">
          giro {{ ed.giro.value.n }}<template v-if="ed.giro.value.di"> di {{ ed.giro.value.di }}</template>
        </span>
      </div>

      <!-- la scelta di una casella, attaccata alla sua riga -->
      <Scelta v-if="apertaQui(i)" :tipo="ed.aperta.value.tipo" :riga="i" :campo="ed.aperta.value.campo"
              :contesto="ed.contesto.value"
              @scegli="v => ed.imposta(i.id, ed.aperta.value.campo, v)"
              @chiudi="ed.apri(null)" @nuova-lavagnetta="ed.nuovaLavagnetta(i.id)" />

      <!-- i tasti della riga selezionata -->
      <div v-if="ed.sel.value === i.id && !ed.sola.value" class="cst-tasti-riga">
        <button type="button" data-azione="sopra" aria-label="sposta su" @click="ed.azione('su', i.id)">↑</button>
        <button type="button" data-azione="sotto" aria-label="sposta giù" @click="ed.azione('giu', i.id)">↓</button>
        <button type="button" data-azione="doppia" aria-label="duplica" @click="ed.azione('duplica', i.id)">⧉</button>
        <button v-if="i.tipo === 'se'" type="button" data-azione="altrimenti" @click="ed.azione('altrimenti', i.id)">
          {{ i.altrimenti ? '− altrimenti' : '＋ altrimenti' }}</button>
        <button type="button" class="cst-agg" data-azione="aggiungi-dopo" @click="ed.aggiungi({ dopo: i.id })">＋ sotto</button>
        <button type="button" class="cst-via" data-azione="togli-riga" aria-label="togli la riga" @click="ed.azione('togli', i.id)">🗑</button>
      </div>

      <!-- i corpi dei blocchi -->
      <template v-if="conCorpo(i)">
        <Righe :righe="i.corpo || i.allora || []" :profondita="profondita + 1"
               :dove="{ progetto: dove.progetto, dentro: i.id, ramo: i.tipo === 'se' ? 'allora' : 'corpo' }" />
        <template v-if="i.tipo === 'se' && i.altrimenti">
          <div class="cst-altrimenti">altrimenti</div>
          <Righe :righe="i.altrimenti" :profondita="profondita + 1"
                 :dove="{ progetto: dove.progetto, dentro: i.id, ramo: 'altrimenti' }" />
        </template>
      </template>
    </li>
    <li v-if="!ed.sola.value" class="cst-riga-posto">
      <button type="button" class="cst-piu" :data-aggiungi="dove.dentro ? `${dove.dentro}:${dove.ramo}` : (dove.progetto || 'principale')"
              @click="ed.aggiungi(dove.dentro ? { dentro: dove.dentro, ramo: dove.ramo, inFondo: true } : { progetto: dove.progetto })">
        ＋ <span>{{ profondita > 0 ? 'qui dentro' : 'aggiungi' }}</span>
      </button>
    </li>
  </ol>
</template>

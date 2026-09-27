<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL BLOCCHETTO DEI POTENZIAMENTI

   «Ho preso otto potenziamenti, e adesso i miei arcieri fanno +80%.»
   Il foglio che si apre dal gettone ⬆️ sul campo, durante la partita: per
   ogni tipo di torre in campo, quante sono, quanti gradini hanno salito
   e quanto fanno in più di una torre appena costruita; sotto, i regali
   della partita libera, che restano per sempre.

   I numeri non li fa questo file: li compone `blocchettoDi` in
   `data/castello.js`, dal modello che decide anche i prezzi — così il
   «+80%» che si legge qui è lo stesso conto per cui quel gradino è
   costato quello che è costato.

   Si chiude con la ✕ in alto a destra, come tutti i fogli (quella del
   `Foglio` che lo contiene), e il campo intanto non si ferma: è un
   foglio da guardare, non una pausa.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { TORRI } from '../../data/ops.js'
import RitrattoTorre from './RitrattoTorre.vue'

const props = defineProps({
  /* i pittori della pelle, se il campo ne ha una: il ritratto della
     torre è allora la figura del campo */
  pittori: { type: Object, default: null },
  /* quello che compone `blocchettoDi`: { torri, regali, gradini, regaliPresi, totale } */
  blocchetto: { type: Object, required: true },
})

/* i nomi al plurale, come li direbbe un bambino guardando il campo */
const PLURALE = { arciere: 'Arcieri', magica: 'Torri magiche',
                  ghiaccio: 'Torri di ghiaccio', bombe: 'Bombe' }
const nomeDi = k => PLURALE[TORRI[k].aspetto] || TORRI[k].nome
/* il ghiaccio non fa male: il suo «di più» è il gelo */
const faDi = t => (TORRI[t.tipo].danno ? `fanno +${t.piu}%` : `il gelo vale +${t.piu}%`)
const ramoDi = (k, r) => TORRI[k].rami?.[r]?.nome || r

const vuoto = computed(() => !props.blocchetto.torri.length && !props.blocchetto.regali.length)
</script>

<template>
  <div class="blocchetto" data-blocchetto>
    <p class="somma" data-blocchetto-totale="">
      <b>{{ blocchetto.totale }}</b> {{ blocchetto.totale === 1 ? 'potenziamento' : 'potenziamenti' }}
      <template v-if="blocchetto.regaliPresi"> · di cui {{ blocchetto.regaliPresi }}
        {{ blocchetto.regaliPresi === 1 ? 'regalo' : 'regali' }}</template>
    </p>

    <p v-if="vuoto" class="vuoto">Ancora niente: tocca una torre e fai il conto per farla salire.</p>

    <div v-for="t in blocchetto.torri" :key="t.tipo" class="riga" :style="{ '--c': TORRI[t.tipo].colore }"
         :data-blocchetto-torre="t.tipo" :data-piu="t.piu">
      <span class="figura"><RitrattoTorre :pittori="pittori" :tipo="t.tipo" :lv="t.livelloMassimo" :unita="40" /></span>
      <span class="dati">
        <b>{{ nomeDi(t.tipo) }} ×{{ t.quante }}</b>
        <span>{{ t.gradini }} {{ t.gradini === 1 ? 'potenziamento' : 'potenziamenti' }} ·
          <em>{{ faDi(t) }}</em></span>
        <i v-if="t.rami.length">{{ t.rami.map(r => r.quante + ' ' + ramoDi(t.tipo, r.ramo)).join(' · ') }}</i>
      </span>
    </div>

    <template v-if="blocchetto.regali.length">
      <h4>🎁 I regali, che restano</h4>
      <div v-for="r in blocchetto.regali" :key="r.id" class="regalo" :data-blocchetto-regalo="r.id">
        <span class="emoji">{{ r.emoji }}</span>
        <span class="dati">
          <b>{{ r.nome }} ×{{ r.gradi }}</b>
          <span>{{ r.quanto }}</span>
        </span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.blocchetto { display:flex; flex-direction:column; gap:7px; width:100%; max-width:440px }
.somma { text-align:center; font-size:14px; color:var(--viola-scuro); margin:0 }
.somma b { font-size:20px }
.vuoto { text-align:center; font-size:13px; color:var(--tenue); font-weight:700 }
.riga, .regalo { display:flex; align-items:center; gap:8px; background:var(--carta);
                 border-radius:14px; padding:6px 10px;
                 box-shadow:0 3px 0 #dde3ea, inset 0 0 0 2px var(--c, #e2dcee) }
.figura { width:40px; height:38px; flex:none }
.figura :deep(canvas) { width:40px; height:38px }
.dati { display:flex; flex-direction:column; line-height:1.25; min-width:0 }
.dati b { font-size:13.5px; color:var(--viola-scuro) }
.dati span { font-size:12px; color:var(--tenue); font-weight:700 }
.dati em { font-style:normal; font-weight:900; color:#2f9e5b }
.dati i { font-style:normal; font-size:11px; color:var(--tenue) }
h4 { margin:6px 0 0; font-size:13px; color:var(--viola-scuro); text-align:center }
.regalo .emoji { font-size:22px; width:40px; text-align:center; flex:none }
</style>

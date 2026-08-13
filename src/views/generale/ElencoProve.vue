<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LE PROVE — l'elenco, una riga per livello, e si aprono in fila.

   ── LE RIGHE IN MEZZO SONO TORNATE, E STAVOLTA DICONO IL VERO ──
   Per un pezzo la lista era spezzata in due — «il tutorial» e poi il
   resto — e la riga di mezzo ha detto prima «e da qui in poi, per
   allenarsi» e poi «e da qui in poi si mescolano»: erano tutt'e due
   false, perché di là non cambiava niente. Erano otto prove tutte
   tutorial, e una divisione che promette un cambio di passo inesistente
   è peggio di nessuna divisione.
   Adesso i tratti ci sono per davvero: dopo le sette prove comincia il
   consolidamento, una campagna per costrutto, e in fondo il cortile,
   dove c'è qualcuno che non comandi. Ventisei righe di fila senza dire
   dove finisce una cosa e comincia l'altra non si leggono più.
   I titoli non stanno qui: vengono da `data/generale.js` (`TITOLI`),
   dallo stesso dato che decide l'ordine — perché sono la stessa
   decisione, e separati si scollerebbero.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { LIVELLI, TITOLI } from '../../data/generale.js'
import { genProgresso, tappaAperta } from '../../store/profile.js'

defineEmits(['apri'])

/* I lucchetti li toglie il flag che c'è già, quello della schermata dei
   genitori (`settings.tuttoAperto`): un interruttore solo per tutti i
   giochi, invece di una costante cablata qui dentro che poi qualcuno si
   dimentica di rimettere a posto prima di pubblicare. La regola sta in
   `tappaAperta`, in comune con le campagne degli altri giochi. */
const progresso = computed(() => genProgresso())
const apribile = i => tappaAperta(i, progresso.value.tappa || 0)
</script>

<template>
  <div class="prove">
    <p class="intro">Non comandi nessuno a mano: scrivi gli <b>ordini</b>, premi ▶
      e guardi se il piano regge. Ogni ordine è <b>un verbo</b> e <b>una cosa</b>.</p>
    <template v-for="(l, i) in LIVELLI" :key="l.id">
      <div v-if="TITOLI[i]" class="riga-titolo">{{ TITOLI[i] }}</div>
      <button class="tappa"
              :class="{ chiusa: !apribile(i), fatta: (progresso.stelle[i] || 0) > 0 }"
              :disabled="!apribile(i)" @click="$emit('apri', i)">
        <span class="num">{{ apribile(i) ? (progresso.stelle[i] ? '✓' : i + 1) : '🔒' }}</span>
        <span class="che"><b>{{ l.nome }}</b><i>{{ l.idea }}</i></span>
        <span class="voto">{{ '⭐'.repeat(progresso.stelle[i] || 0) }}<small>par {{ l.par }}</small></span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.prove { flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; padding:10px 12px calc(16px + env(safe-area-inset-bottom)) }
.intro { font-size:13px; line-height:1.45; color:var(--tenue); margin:0 0 12px }
.tappa { display:flex; align-items:center; gap:11px; width:100%; text-align:left; margin-bottom:8px;
         background:var(--carta); border-radius:16px; padding:10px 12px; min-height:62px;
         box-shadow:0 3px 0 #dde3ea }
.tappa .num { width:36px; height:36px; flex:none; border-radius:12px; background:#eef2f9;
              display:grid; place-items:center; font-size:15px; font-weight:900; color:var(--tenue) }
.tappa.fatta .num { background:var(--verde); color:#06210f }
.tappa .che { flex:1; min-width:0 }
.tappa .che b { display:block; font-size:14.5px; font-weight:900; color:var(--viola-scuro) }
.tappa .che i { font-style:normal; font-size:11.5px; color:var(--tenue) }
.tappa .voto { flex:none; font-size:13px; text-align:right }
.tappa .voto small { display:block; font-size:10px; color:var(--tenue); font-weight:800 }
.tappa.chiusa { opacity:.55; box-shadow:none }
.riga-titolo { font-size:10px; font-weight:900; letter-spacing:.7px; text-transform:uppercase;
               color:var(--tenue); margin:10px 2px 7px }
</style>

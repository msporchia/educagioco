<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA PAGINA DEI LIVELLI — I PREMI, E DOVE SI VA A PRENDERLI

   Sta **in alto**, sempre visibile: è il gettone col numero accanto ai
   tondi del baule, e si preme quando ci si chiede «e adesso?». Dentro
   ci sono due blocchi soli, e sono due domande:

     1. **cosa è arrivato** — i premi di questo livello, a quadratini.
        Quelli non ancora presi si premono, ed è tutto il punto di
        questa schermata;
     2. **cosa arriva al prossimo** — gli stessi quadratini, spenti, con
        quanto manca da spendere. È il motivo per cui si torna.

   ── PERCHÉ SI PRENDONO A MANO ─────────────────────────────────────
   Prima arrivavano da soli: la spesa faceva scattare il livello e
   questo stesso foglio si apriva **in festa**, nel mezzo dell'acquisto.
   Due difetti. Spezzava il gesto — il dito era in viaggio dal baule al
   prato e trovava un velo — e quello che arrivava non lo prendeva
   nessuno: compariva. Un premio che compare è una riga di elenco; uno
   che si preme è una cosa che ci si va a prendere.

   Adesso il livello **apre** i premi, il gettone in alto si accende col
   loro numero, e si vengono a prendere qui quando si vuole. Prenderli
   non regala niente: apre la voce nel baule, dove si compra con le
   monete come sempre (`dati/livelli.js`).

   ── SOLO DUE LIVELLI, E NON DODICI ────────────────────────────────
   C'era sotto la scaletta intera, tredici righe che scorrevano, «per
   vedere che la strada continua». Non serviva a niente: sono righe di
   testo con dentro dei nomi di cose che non si sono mai viste, e in
   mezzo ci finiva anche l'unica riga su cui si poteva fare qualcosa.
   Quello che continua si vede lo stesso, perché il blocco del prossimo
   livello c'è sempre — e quanti ne restano lo dice una riga sola.

   Non sa niente del profilo né del motore: riceve l'avanzamento già
   fatto, i premi e quali sono stati presi.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { ULTIMO, premiDi } from '../dati/livelli.js'
import Provino from './Provino.vue'

const props = defineProps({
  /* quello che torna da `Fattoria.avanzamento` */
  stato: { type: Object, required: true },
  /* le chiavi dei premi già presi */
  presi: { type: Array, default: () => [] },
})
defineEmits(['reclama', 'chiudi'])

const dopo = computed(() => props.stato.livello + 1)
const presi = computed(() => new Set(props.presi))
const preso = p => presi.value.has(p.chiave)

/* ── QUELLO CHE È ARRIVATO ────────────────────────────────────────
   I premi di questo livello, **più gli arretrati**: chi salta due
   livelli con una spesa sola, o chi non è passato di qui per una
   settimana, ha roba aperta a un livello più vecchio, e quella non può
   restare in un blocco che non si mostra più. Prima i da prendere, che
   sono la ragione per cui questa pagina è aperta. */
const adesso = computed(() => {
  const liv = props.stato.livello
  const miei = premiDi(liv)
  const arretrati = []
  for (let l = 1; l < liv; l++)
    for (const p of premiDi(l)) if (!preso(p)) arretrati.push(p)
  return [...arretrati, ...miei].sort((a, b) => (preso(a) ? 1 : 0) - (preso(b) ? 1 : 0))
})
const daPrendere = computed(() => adesso.value.filter(p => !preso(p)))
const prossimi = computed(() => premiDi(dopo.value))
/* Quanti gradini restano da qui in fondo al catalogo. Oltre si continua
   a salire, ma non arriva più niente di nuovo: si dice invece di
   promettere. */
const restano = computed(() => Math.max(0, ULTIMO - props.stato.livello))
</script>

<template>
  <div class="fa-foglio fa-livelli">
    <h2>⭐ Livello {{ stato.livello }} · {{ stato.nome }}</h2>

    <!-- ── quello che è arrivato ──
         Il titolo cambia mestiere: con dei premi da prendere è un
         invito e dice quanti sono, senza è il riepilogo di cosa ha
         portato questo livello. -->
    <span class="fa-etichetta" :class="{ dono: daPrendere.length }">
      {{ daPrendere.length
         ? (daPrendere.length === 1 ? '🎁 un premio da prendere'
                                    : `🎁 ${daPrendere.length} premi da prendere`)
         : `al livello ${stato.livello} è arrivato` }}</span>

    <div v-if="adesso.length" class="fa-premi">
      <button v-for="p in adesso" :key="p.chiave" type="button"
              :data-premio="p.chiave"
              :class="['fa-premio', preso(p) ? 'preso' : 'da']"
              :disabled="preso(p)"
              @click="$emit('reclama', p.chiave)">
        <span class="fa-ripiano" :class="{ alto: p.tipo === 'bestia' }">
          <Provino :pezzo="p.pezzo" :lato="p.tipo === 'bestia' ? 64 : 48" /></span>
        <span class="fa-nome">{{ p.nome }}</span>
        <span v-if="preso(p)" class="fa-stato">✓ {{ p.che }}</span>
        <span v-else class="fa-stato prendi">prendi</span>
      </button>
    </div>
    <p v-else class="fa-piccolo">A questo livello è arrivata altra terra da riempire.</p>

    <p v-if="daPrendere.length" class="fa-piccolo">Premi un premio per
       aprirlo: da quel momento lo trovi nel baule, e lo compri quando
       hai le monete.</p>

    <!-- ── quello che arriva ──
         Spento e in grigio: non è un negozio, è una vetrina. Il numero
         che conta è quanto manca da **spendere qui dentro**. -->
    <span class="fa-etichetta">al livello {{ dopo }} arriva</span>
    <p class="fa-posti">
      <b>🪙{{ stato.speso }}</b> spesi ·
      ne mancano <b>🪙{{ stato.manca }}</b></p>
    <div class="fa-quanto largo"><i :style="{ width: Math.round(stato.quanto * 100) + '%' }"></i></div>

    <div v-if="prossimi.length" class="fa-premi">
      <div v-for="p in prossimi" :key="p.chiave" class="fa-premio chiuso">
        <span class="fa-ripiano" :class="{ alto: p.tipo === 'bestia' }">
          <Provino :pezzo="p.pezzo" :lato="p.tipo === 'bestia' ? 64 : 48" /></span>
        <span class="fa-nome">{{ p.nome }}</span>
        <span class="fa-stato">🔒 livello {{ dopo }}</span>
      </div>
    </div>
    <p v-else class="fa-piccolo">Al livello {{ dopo }} arriva altra terra da riempire.</p>

    <p class="fa-piccolo">Il livello sale spendendo monete <b>qui</b>: ogni
       campo, ogni seme, ogni carota data a un coniglio. Non scende mai.
       <template v-if="restano > 0">Di gradini con qualcosa di nuovo
         ne restano <b>{{ restano }}</b>.</template>
       <template v-else>Da qui in poi si continua a salire, ma il baule
         è già tutto aperto.</template></p>

    <div class="fa-fila">
      <button class="fa-bot forte" @click="$emit('chiudi')">Chiudi</button>
    </div>
  </div>
</template>

<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA PAGINA DEI LIVELLI — DOVE SONO, E COSA ARRIVA DOPO

   Sta **in alto**, sempre visibile: è il gettone col numero accanto al
   baule, e si preme quando ci si chiede «e adesso?». Dentro ci sono tre
   cose, in quest'ordine:

     1. **a che punto sono** — la barra e quanto manca da spendere;
     2. **cosa arriva al prossimo livello** — l'anteprima, che è il
        motivo per cui questa pagina esiste. Quello che non c'è ancora
        non sta nel baule (una voce spenta dentro un negozio è un tasto
        rotto): sta qui, dove si legge come una cosa da desiderare;
     3. **la scaletta intera**, per vedere che la strada continua.

   Non sa niente del profilo né del motore: riceve l'avanzamento già
   fatto e la roba di ogni livello.

   ── E QUANDO SI SALE ──────────────────────────────────────────────
   Lo stesso foglio si apre da sé, in **festa**: un livello che arriva
   in silenzio non lo nota nessuno, e quello che è appena arrivato
   bisogna dirlo nel momento in cui è arrivato — dopo, nel baule, non
   sembra una conquista ma una cosa che c'è sempre stata.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { ULTIMO, nomeDi, sogliaDi, roba, vuoto, zonaDi } from '../dati/livelli.js'
import Provino from './Provino.vue'

const props = defineProps({
  /* quello che torna da `Fattoria.avanzamento` */
  stato: { type: Object, required: true },
  /* se è appena salito: il foglio si presenta come un premio */
  festa: { type: Boolean, default: false },
})
defineEmits(['chiudi'])

const dopo = computed(() => props.stato.livello + 1)
/* Cosa arriva a un livello, in una riga sola di roba da leggere: le
   linguette per nome, le cose che lavorano per nome, le colture e le
   bestie. Sotto, non i novanta cespugli di una linguetta. */
/* ── SI MOSTRA LA COSA VERA, NON UN'ICONA ─────────────────────────
   Ogni riga porta **il disegno del pezzo** che arriverà davvero, lo
   stesso che si vedrà nel baule e in mappa (`Provino.vue`). C'era
   un'emoji al suo posto — 🔨 per le costruzioni, la faccia della
   linguetta per le decorazioni — ed era fuorviante due volte: prometteva
   una cosa che poi non somigliava a niente di quello che arrivava, e
   dieci righe con lo stesso martello dicevano che stanno arrivando dieci
   cose uguali. Un'anteprima serve a **riconoscere** quello che sta per
   arrivare, quindi va mostrato.

   Le colture si mostrano **mature** (l'ultimo stadio del campo, non i
   semi appena buttati) e le bestie di fronte, come nel baule.

   Ognuna dice anche *che cosa è*: «raccolto» e «carote» da soli sono due
   parole che sembrano la stessa cosa, mentre «uno scaffale nuovo» e «da
   seminare» si distinguono da lontano. */
const dice = liv => {
  const r = roba(liv)
  if (vuoto(r)) return []
  return [
    /* una linguetta si mostra con la prima cosa che ci si trova dentro:
       un cartello «Fiori» senza un fiore non dice quali fiori */
    ...r.schede.map(s => ({ pezzo: (s.voci[0] || {}).pezzo, che: 'nel baule',
                            nome: s.nome.toLowerCase() })),
    ...r.cose.map(c => ({ pezzo: c.pezzo, nome: c.nome.toLowerCase(),
                          che: zonaDi(c.id) === 'lavoro' ? 'da costruire' : 'da mettere' })),
    ...r.colture.map(c => ({ pezzo: c.stadi[c.stadi.length - 1], che: 'da seminare',
                             nome: c.nome.toLowerCase(), largo: true })),
    ...r.animali.map(a => ({ pezzo: a.chi + '_giu0', che: 'un amico',
                             nome: a.nome.toLowerCase() })),
  ]
}
/* La strada, ma solo un pezzo: i livelli sono sessantacinque, e una
   lista lunga così non si legge — si scorre e basta. Si mostrano quello
   di adesso, uno indietro per vedere da dove si viene, e dodici avanti,
   che è quanto basta a far vedere che la strada continua. */
const scaletta = computed(() => {
  const da = Math.max(1, props.stato.livello - 1)
  const a = Math.min(ULTIMO, da + 12)
  return Array.from({ length: a - da + 1 }, (_, i) => da + i).map(liv => ({
    liv, nome: nomeDi(liv), soglia: sogliaDi(liv), cose: dice(liv),
  }))
})
</script>

<template>
  <div class="fa-foglio fa-livelli">
    <h2 v-if="festa">⭐ Livello {{ stato.livello }}!</h2>
    <h2 v-else>La fattoria · livello {{ stato.livello }}</h2>
    <p class="fa-titolone">{{ stato.nome }}</p>

    <template v-if="festa">
      <p>Hai speso 🪙{{ stato.speso }} qui dentro. È arrivato:</p>
      <ul class="fa-arriva">
        <li v-for="(c, i) in dice(stato.livello)" :key="i">
          <Provino v-if="c.pezzo" :pezzo="c.pezzo" :lato="c.largo ? 40 : 32" />
          {{ c.nome }} <i>{{ c.che }}</i></li>
      </ul>
    </template>

    <template v-else>
      <p class="fa-posti">
        <b>🪙{{ stato.speso }}</b> spesi ·
        ne mancano <b>🪙{{ stato.manca }}</b> al livello {{ dopo }}</p>
      <div class="fa-quanto largo"><i :style="{ width: Math.round(stato.quanto * 100) + '%' }"></i></div>

      <span class="fa-etichetta">al livello {{ dopo }} arriva</span>
      <ul class="fa-arriva">
        <li v-for="(c, i) in dice(dopo)" :key="i">
          <Provino v-if="c.pezzo" :pezzo="c.pezzo" :lato="c.largo ? 40 : 32" />
          {{ c.nome }} <i>{{ c.che }}</i></li>
        <li v-if="!dice(dopo).length">altra terra da riempire</li>
      </ul>

      <span class="fa-etichetta">la strada · {{ ULTIMO }} livelli in tutto</span>
      <div class="fa-scala">
        <div v-for="s in scaletta" :key="s.liv"
             :class="['fa-passo', { fatto: s.liv <= stato.livello, ora: s.liv === stato.livello }]">
          <b>{{ s.liv }}</b>
          <span>{{ s.nome }}</span>
          <em>{{ s.liv <= stato.livello ? '✓' : '🪙' + s.soglia }}</em>
        </div>
      </div>
    </template>

    <p class="fa-piccolo">Il livello sale spendendo monete <b>qui</b>: ogni
       campo, ogni seme, ogni carota data a un coniglio. Non scende mai.</p>

    <div class="fa-fila">
      <button class="fa-bot forte" @click="$emit('chiudi')">
        {{ festa ? 'Bene!' : 'Chiudi' }}</button>
    </div>
  </div>
</template>

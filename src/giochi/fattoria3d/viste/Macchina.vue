<script setup>
// Il menu di una macchina (mulino, pastificio, panificio, caseificio, cucina, gelateria: gli id dei salvataggi sono pasticceria e conserviera): l'insegna col suo colore, il forno
// con tre vani (barra di cottura e timer), i pronti da ritirare e TUTTE le sue ricette come schede. Quelle non ancora arrivate
// stanno velate col lucchetto e il livello; gli ingredienti sono gettoni tondi (verdi se bastano, rossi se mancano). Riceve una
// fotografia già pronta e dice cosa si vuole con gli `emit`. I colori di ogni macchina sono in stile.css (`[data-macchina]`).
import { computed } from 'vue'
import Faccia from './Faccia.vue'

const props = defineProps({
  tipo: { type: String, required: true },
  titolo: { type: String, default: '' },           // «🍝 Pastificio»: l'emoji e il nome
  forno: { type: Array, required: true },          // [{ k, emoji, testo, barra } | null] per ognuno dei posti
  pronti: { type: String, default: '' },
  prontiK: { type: Array, default: () => [] },     // [{ k, n }]: gli stessi pronti, con la faccia
  puoRitirare: { type: Boolean, default: false },
  ricette: { type: Array, required: true },        // [{ k, nome, emoji, ms, liv, sbloccata, puoi, manca, ing: [{ k, emoji, ha, serve }] }]
  dispensa: { type: String, default: '' },
  dispensaK: { type: Array, default: () => [] },   // [{ k, n }]: la dispensa, con la faccia
  messaggio: { type: String, default: '' },        // perché una ricetta non parte (si vede qui: il fumetto dell'eroe sta sotto il foglio)
})
defineEmits(['prepara', 'ritira', 'chiudi'])

const parti = computed(() => { const i = props.titolo.indexOf(' '); return i < 0 ? ['🍳', props.titolo] : [props.titolo.slice(0, i), props.titolo.slice(i + 1)] })
const occupati = computed(() => props.forno.filter(Boolean).length)
</script>

<template>
  <div class="f3-foglio f3-colonna f3-macchina" data-f3="macchina" :data-macchina="tipo">
    <header class="f3-insegna">
      <span class="f3-insegna-em" aria-hidden="true">{{ parti[0] }}</span>
      <h2>{{ parti[1] }}</h2>
      <small>{{ occupati }} su {{ forno.length }} posti al lavoro</small>
    </header>
    <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <!-- `data-f3="pasticceria"` resta il bersaglio della pasticceria (un elemento ha un solo data-f3: il foglio porta «macchina») -->
    <div class="f3-corpo" :data-f3="tipo === 'pasticceria' ? 'pasticceria' : null">
      <h3>Nel forno</h3>
      <div class="f3-forno">
        <div v-for="(p, i) in forno" :key="i" class="posto" :class="{ vuoto: !p, cuoce: p && p.testo !== 'in coda' }" :style="{ '--i': i }">
          <div class="vano">
            <span class="em"><Faccia v-if="p" :k="p.k" :emoji="p.emoji" :lato="40" /><template v-else>＋</template></span>
          </div>
          <i><u :style="{ width: (p ? p.barra : 0) + '%' }"></u></i>
          <small>{{ p ? p.testo : 'libero' }}</small>
        </div>
      </div>
      <div class="f3-pronti" :class="{ c: puoRitirare }">
        <span v-if="prontiK.length" class="f3-pronti-facce">Pronti: <span v-for="c in prontiK" :key="c.k" class="f3-merce-n"><Faccia :k="c.k" :lato="26" /> ×{{ c.n }}</span></span>
        <span v-else>{{ pronti || 'Niente da ritirare' }}</span>
        <button :disabled="!puoRitirare" data-f3="ritira" @click="$emit('ritira')">🧺 Ritira tutto</button>
      </div>
      <p v-if="messaggio" class="f3-messaggio" data-f3="macchina-msg">{{ messaggio }}</p>
      <h3>Cosa vuoi preparare?</h3>
      <div class="f3-ricette">
        <article v-for="(r, n) in ricette" :key="r.k" class="ricetta" :class="{ chiusa: !r.sbloccata, pronta: r.puoi }" :style="{ '--i': n }">
          <div class="foto"><span class="em"><Faccia :k="r.k" :emoji="r.emoji" :lato="44" /></span><span v-if="!r.sbloccata" class="lucchetto" aria-hidden="true">🔒</span></div>
          <div class="dati">
            <b>{{ r.nome }}</b>
            <div class="gettoni">
              <span v-for="i in r.ing" :key="i.k" class="f3-gt" :class="i.ha >= i.serve ? 'ok' : 'manca'">
                <span class="e"><Faccia :k="i.k" :emoji="i.emoji" :lato="32" /></span><small>{{ i.ha }}/{{ i.serve }}</small>
              </span>
            </div>
            <small v-if="r.sbloccata" class="tempo">⏱️ {{ r.ms / 1000 }}s<template v-if="r.manca"> · {{ r.manca }}</template></small>
            <small v-else class="blocco">🔒 Arriva al livello {{ r.liv }}</small>
          </div>
          <!-- aria-disabled e non disabled: un tasto spento non si tocca, e toccarlo deve dire perché non parte -->
          <button v-if="r.sbloccata" class="prepara" :class="{ spenta: !r.puoi }" :aria-disabled="!r.puoi" :data-puoi="r.puoi" :data-ricetta="r.k" @click="$emit('prepara', r.k)">＋ Prepara</button>
          <button v-else class="prepara spenta" aria-disabled="true" :data-puoi="false" :data-ricetta="r.k" @click="$emit('prepara', r.k)">🔒 Livello {{ r.liv }}</button>
        </article>
      </div>
      <p class="f3-nota"><template v-if="dispensaK.length">In dispensa: <span v-for="c in dispensaK" :key="c.k" class="f3-merce-n"><Faccia :k="c.k" :lato="22" /> ×{{ c.n }}</span></template><template v-else>{{ dispensa }}</template></p>
    </div>
  </div>
</template>

<style>
.f3-macchina .f3-merce-n { display: inline-flex; align-items: center; gap: 2px; margin: 0 6px; vertical-align: middle; }
</style>

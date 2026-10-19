<script setup>
// Il menu di una macchina (pasticceria, mulino, panificio, conserviera, gelateria): i posti del forno con la barra di cottura, i
// pronti da ritirare e TUTTE le sue ricette. Quelle non ancora arrivate stanno in grigio col livello; gli ingredienti dicono
// quanti ne hai e quanti ne servono (rossi se mancano). Riceve una fotografia già pronta e dice cosa si vuole con gli `emit`.
defineProps({
  tipo: { type: String, required: true },
  titolo: { type: String, default: '' },
  forno: { type: Array, required: true },          // [{ emoji, testo, barra } | null] per ognuno dei posti
  pronti: { type: String, default: '' },
  puoRitirare: { type: Boolean, default: false },
  ricette: { type: Array, required: true },        // [{ k, nome, emoji, ms, liv, sbloccata, puoi, manca, ing: [{ k, emoji, ha, serve }] }]
  dispensa: { type: String, default: '' },
  messaggio: { type: String, default: '' },        // perché una ricetta non parte (si vede qui: il fumetto dell'eroe sta sotto il foglio)
})
defineEmits(['prepara', 'ritira', 'chiudi'])
</script>

<template>
  <div class="f3-foglio f3-colonna f3-macchina" data-f3="macchina" :data-macchina="tipo">
    <h2>{{ titolo }}</h2>
    <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <!-- `data-f3="pasticceria"` resta il bersaglio della pasticceria (un elemento ha un solo data-f3: il foglio porta «macchina») -->
    <div class="f3-corpo" :data-f3="tipo === 'pasticceria' ? 'pasticceria' : null">
      <h3>Nel forno</h3>
      <div class="f3-forno">
        <div v-for="(p, i) in forno" :key="i" class="posto" :class="{ vuoto: !p }">
          <span class="em">{{ p ? p.emoji : '＋' }}</span><small>{{ p ? p.testo : 'libero' }}</small>
          <i><u :style="{ width: (p ? p.barra : 0) + '%' }"></u></i>
        </div>
      </div>
      <div class="f3-pronti">
        <span>{{ pronti || 'Niente da ritirare' }}</span>
        <button :disabled="!puoRitirare" data-f3="ritira" @click="$emit('ritira')">Ritira tutto</button>
      </div>
      <p v-if="messaggio" class="f3-messaggio" data-f3="macchina-msg">{{ messaggio }}</p>
      <h3>Cosa vuoi preparare?</h3>
      <div class="f3-ricette">
        <div v-for="r in ricette" :key="r.k" class="ricetta" :class="{ chiusa: !r.sbloccata }">
          <span class="em">{{ r.emoji }}</span>
          <div>
            <b>{{ r.nome }}</b>
            <small class="ing"><span v-for="i in r.ing" :key="i.k" :class="i.ha >= i.serve ? 'ok' : 'manca'">{{ i.emoji }} {{ i.ha }}/{{ i.serve }} </span></small>
            <small v-if="r.sbloccata">⏱️ {{ r.ms / 1000 }}s<template v-if="r.manca"> · {{ r.manca }}</template></small>
            <small v-else class="blocco">🔒 Arriva al livello {{ r.liv }}</small>
          </div>
          <!-- aria-disabled e non disabled: un tasto spento non si tocca, e toccarlo deve dire perché non parte -->
          <button v-if="r.sbloccata" :class="{ spenta: !r.puoi }" :aria-disabled="!r.puoi" :data-puoi="r.puoi" :data-ricetta="r.k" @click="$emit('prepara', r.k)">＋ Prepara</button>
          <button v-else class="spenta" aria-disabled="true" :data-puoi="false" :data-ricetta="r.k" @click="$emit('prepara', r.k)">🔒 {{ r.liv }}</button>
        </div>
      </div>
      <p class="f3-nota">{{ dispensa }}</p>
    </div>
  </div>
</template>

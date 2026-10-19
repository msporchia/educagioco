<script setup>
// Il menu della pasticceria: i tre posti del forno con la barra di cottura, i pronti da ritirare, le ricette con gli ingredienti
// (verdi se bastano, rossi se mancano) e la dispensa. Riceve una fotografia già pronta e dice cosa si vuole con gli `emit`.
import { COLTURE } from '../dati/colture.js'
defineProps({
  forno: { type: Array, required: true },          // [{ emoji, testo, barra } | null] per ognuno dei posti
  pronti: { type: String, default: '' },
  puoRitirare: { type: Boolean, default: false },
  ricette: { type: Array, required: true },        // [{ k, nome, emoji, ing: [{ k, ha, serve }], ms, puoi }]
  dispensa: { type: String, default: '' },
})
defineEmits(['prepara', 'ritira', 'chiudi'])
</script>

<template>
  <div class="f3-foglio f3-pasticceria" data-f3="pasticceria">
    <h2>🧁 Pasticceria</h2>
    <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
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
    <h3>Cosa vuoi preparare?</h3>
    <div class="f3-ricette">
      <div v-for="r in ricette" :key="r.k" class="ricetta">
        <span class="em">{{ r.emoji }}</span>
        <div>
          <b>{{ r.nome }}</b>
          <small class="ing"><span v-for="i in r.ing" :key="i.k" :class="i.ha >= i.serve ? 'ok' : 'manca'">{{ COLTURE[i.k].emoji }} {{ i.ha }}/{{ i.serve }} </span></small>
          <small>⏱️ {{ r.ms / 1000 }}s</small>
        </div>
        <button :disabled="!r.puoi" :data-ricetta="r.k" @click="$emit('prepara', r.k)">＋ Prepara</button>
      </div>
    </div>
    <p class="f3-nota">{{ dispensa }}</p>
  </div>
</template>

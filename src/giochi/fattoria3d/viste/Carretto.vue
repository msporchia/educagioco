<script setup>
// Il carretto del vicino (C15): due passi, senza conferma in mezzo. Prima «cosa gli dai» (5 di una merce che hai, in oro quella con lo scomparto
// pieno), poi «cosa ti dà» (1 di una merce che ti manca, o niente: si svuota e basta). Mai monete. Riceve le righe già pronte
// (motore/carretto.js) e dice cosa si vuole con gli `emit`. Vedi docs/fattoria3d/vicini.md («Il carretto»).
defineProps({
  passo: { type: String, default: 'dai' },                 // 'dai' | 'ricevi'
  dai: { type: Array, default: () => [] },                 // { k, nome, emoji, quanti, colmo }
  offre: { type: Array, default: () => [] },               // { k, nome, emoji, quanti }
  dato: { type: Object, default: null },                   // la riga scelta al primo passo
  quanti: { type: Number, default: 5 },
  messaggio: { type: String, default: '' },
})
defineEmits(['dai', 'ricevi', 'indietro', 'chiudi'])
</script>

<template>
  <div class="f3-foglio f3-colonna f3-car" data-f3="carretto" :data-passo="passo">
    <h2>🛒 Il carretto del vicino</h2>
    <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-corpo">
      <p class="f3-car-nota">{{ passo === 'dai' || !dato ? `Dai ${quanti} di una cosa e ne prendi 1 di un'altra. Niente monete: serve a fare posto.` : `Hai dato ${quanti} ${dato.emoji} ${dato.nome}. Cosa ti serve?` }}</p>
      <template v-if="passo === 'dai'">
        <p v-if="!dai.length" class="f3-car-nota" data-f3="carretto-vuoto">Non hai {{ quanti }} di niente: torna quando ne hai di più.</p>
        <div class="f3-car-righe">
          <button v-for="r in dai" :key="r.k" class="f3-car-riga" :class="{ colmo: r.colmo }" :data-dai="r.k" :data-colmo="r.colmo || null" @click="$emit('dai', r.k)">
            <span class="em" aria-hidden="true">{{ r.emoji }}</span><b>{{ r.nome }}</b><small>{{ r.colmo ? 'pieno · ' : '' }}ne hai {{ r.quanti }}</small>
          </button>
        </div>
      </template>
      <template v-else>
        <div class="f3-car-righe">
          <button v-for="r in offre" :key="r.k" class="f3-car-riga" :data-ricevi="r.k" @click="$emit('ricevi', r.k)">
            <span class="em" aria-hidden="true">{{ r.emoji }}</span><b>{{ r.nome }}</b><small>ne hai {{ r.quanti }}</small>
          </button>
          <button class="f3-car-riga" data-ricevi-niente @click="$emit('ricevi', null)"><span class="em" aria-hidden="true">🎁</span><b>Niente, faccio posto</b><small>lo regali</small></button>
        </div>
        <button class="f3-car-indietro" data-f3="carretto-indietro" @click="$emit('indietro')">‹ Cambia quello che dai</button>
      </template>
      <p v-if="messaggio" class="f3-messaggio" data-f3="carretto-msg">{{ messaggio }}</p>
    </div>
  </div>
</template>

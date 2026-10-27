<script setup>
// La mappa del trattore: i villaggi dei vicini lungo una strada, dal più vicino al più lontano. Quelli che non hai ancora il livello per
// visitare sono grigi e dicono il livello. Riceve la fotografia già pronta (`motore/vicini.js` `elenco()`) e dice cosa si vuole con
// gli `emit`: niente conti qui. Vedi docs/fattoria3d/vicini.md.
import '../stile-vicini.css'
defineProps({
  elenco: { type: Array, default: () => [] },       // { id, nome, emoji, proprietario, tema, liv, aperto, visite, cassa }
  messaggio: { type: String, default: '' },
})
defineEmits(['vai', 'carretto', 'chiudi'])
const TEMI = { orto: 'orto e galline', mulino: 'mulino e farina', pecore: 'pecore e mongolfiera', frutteto: 'frutteto e gelato', misto: 'una fattoria' }
</script>

<template>
  <div class="f3-foglio f3-colonna f3-vic-mappa" data-f3="mappa">
    <h2>🚜 Dove andiamo?</h2>
    <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-corpo">
      <p v-if="messaggio" class="f3-messaggio" data-f3="mappa-msg">{{ messaggio }}</p>
      <button class="f3-vic-carretto-tasto" data-f3="apri-carretto" @click="$emit('carretto')">🛒 Il carretto · 5 contro 1, per fare posto</button>
      <div class="f3-vic-strada">
        <button v-for="v in elenco" :key="v.id" class="f3-vic-villaggio" :class="{ bloccato: !v.aperto }" :data-vicino="v.id" :data-aperto="v.aperto"
                @click="$emit('vai', v.id)">
          <span class="em" aria-hidden="true">{{ v.emoji }}</span>
          <span class="testo">
            <b>{{ v.nome }}</b>
            <small v-if="v.aperto">{{ TEMI[v.tema] || 'una fattoria' }}{{ v.visite ? ' · visitato ' + v.visite + (v.visite === 1 ? ' volta' : ' volte') : ' · mai visitato' }}</small>
            <small v-else data-f3="vicino-livello">🔒 Arriva al livello {{ v.liv }}</small>
          </span>
          <span v-if="v.aperto && v.cassa" class="pallino" title="la cassa aspetta">📦</span>
          <span v-if="v.aperto" class="vai" aria-hidden="true">›</span>
        </button>
      </div>
      <p class="f3-vic-casa-mappa">Aiuta i vicini: riempi la loro cassa, vendi e compra al loro mercato.</p>
    </div>
  </div>
</template>

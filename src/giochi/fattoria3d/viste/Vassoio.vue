<script setup>
// La barra del costruire: le carte dei pezzi (si trascinano fino alla mappa; di lato scorre la barra), gli strumenti per le strade,
// la vista (vicino / tutto), il suggerimento con l'annulla e la ✕ in alto a destra. Qui si decide solo se un dito che sale è un
// trascinamento: cosa farne lo dice chi la usa, con gli `emit`.
import { ref } from 'vue'

const props = defineProps({
  carte: { type: Array, required: true },       // [{ id, emoji, nome, prezzo, nel_magazzino, pezzo (trascinabile) }]
  strumento: { type: String, default: null },
  vista: { type: String, default: 'vicino' },
  testo: { type: String, default: '' },
  conAnnulla: { type: Boolean, default: false },
  bersaglio: { type: Boolean, default: false },  // un pezzo trascinato che si può rimettere via, sopra la barra
})
const emit = defineEmits(['chiudi', 'vista', 'strumento', 'annulla', 'carta-tocco', 'compra', 'inizia', 'muovi', 'rilascia', 'annulla-trascinamento'])

const radice = ref(null)
defineExpose({ radice })

/** Un dito su una carta: se sale è un trascinamento (prima la conferma d'acquisto se non è pagato), se scorre di lato è la barra. */
function giu(e, c) {
  const x0 = e.clientX, y0 = e.clientY, id = e.pointerId
  let iniziato = false, fatto = false
  const muovi = ev => {
    if (ev.pointerId !== id) return
    if (iniziato) return emit('muovi', ev.clientX, ev.clientY)
    const dx = ev.clientX - x0, dy = ev.clientY - y0
    if (!fatto && dy < -14 && -dy > Math.abs(dx)) {
      fatto = true
      if (!c.nel_magazzino) { smonta(); return emit('compra', c.id) }
      iniziato = true; emit('inizia', c.id, ev.clientX, ev.clientY)
    }
  }
  const su = ev => {
    if (ev.pointerId !== id) return
    smonta()
    if (iniziato) { if (ev.type === 'pointerup') emit('rilascia', ev.clientX, ev.clientY); else emit('annulla-trascinamento') }
    else if (ev.type === 'pointerup' && !fatto && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 12) emit('carta-tocco', c.id)
  }
  const smonta = () => { removeEventListener('pointermove', muovi); removeEventListener('pointerup', su); removeEventListener('pointercancel', su) }
  addEventListener('pointermove', muovi); addEventListener('pointerup', su); addEventListener('pointercancel', su)
}
</script>

<template>
  <div ref="radice" class="f3-vassoio" :class="{ bersaglio }" data-f3="vassoio">
    <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-testa">
      <b>Costruisci</b>
      <div class="f3-vista">
        <button :class="{ acceso: vista === 'vicino' }" data-vista="vicino" @click="$emit('vista', 'vicino')">Vicino</button>
        <button :class="{ acceso: vista === 'tutto' }" data-vista="tutto" @click="$emit('vista', 'tutto')">Tutto</button>
      </div>
    </div>
    <div class="f3-carte">
      <button v-for="c in carte" :key="c.id" :data-carta="c.id" :class="{ scelto: strumento === c.id, pieno: c.nel_magazzino > 0 }"
              @pointerdown="c.pezzo ? giu($event, c) : null" @click="c.pezzo ? null : $emit('strumento', c.id)">
        <span class="em">{{ c.emoji }}</span><b>{{ c.nome }}</b>
        <small>{{ c.nel_magazzino ? '📦 ×' + c.nel_magazzino : c.prezzo }}</small>
      </button>
    </div>
    <div class="f3-suggerimento">
      <span>{{ testo }}</span>
      <button v-if="conAnnulla" data-f3="annulla" @click="$emit('annulla')">↶ Annulla</button>
    </div>
  </div>
</template>

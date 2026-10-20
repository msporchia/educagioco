<script setup>
// La barra del costruire: le carte dei pezzi (si trascinano fino alla mappa; di lato scorre la barra), gli strumenti per le strade,
// la vista (vicino / tutto), il suggerimento e la ✕ in alto a destra (un tocco sulla mappa lo chiude lo stesso). Qui si decide solo
// se un dito che sale è un trascinamento: cosa farne lo dice chi la usa, con gli `emit`. Un pezzo non pagato si trascina uguale: lo
// paga il rilascio, se il posto è buono.
import { ref } from 'vue'

const SCARTO_DITO = 16          // la soglia fra tocco e strisciata si misura sul dito (docs/core/il-dito.md)

const props = defineProps({
  carte: { type: Array, required: true },       // [{ id, emoji, nome, prezzo, nel_magazzino, pezzo (trascinabile), bloccata, liv }]
  strumento: { type: String, default: null },
  vista: { type: String, default: 'vicino' },
  testo: { type: String, default: '' },
  bersaglio: { type: Boolean, default: false },  // un pezzo trascinato che si può rimettere via, sopra la barra
})
const emit = defineEmits(['chiudi', 'vista', 'strumento', 'carta-tocco', 'inizia', 'muovi', 'rilascia', 'annulla-trascinamento'])

const radice = ref(null)
defineExpose({ radice })

/** Un dito su una carta: se sale è un trascinamento, se scorre di lato è la barra. */
function giu(e, c) {
  const x0 = e.clientX, y0 = e.clientY, id = e.pointerId
  let iniziato = false, fatto = false
  const muovi = ev => {
    if (ev.pointerId !== id) return
    if (iniziato) return emit('muovi', ev.clientX, ev.clientY)
    const dx = ev.clientX - x0, dy = ev.clientY - y0
    if (!fatto && dy < -SCARTO_DITO && -dy > Math.abs(dx)) {
      fatto = true
      iniziato = true; emit('inizia', c.id, ev.clientX, ev.clientY)
    }
  }
  const su = ev => {
    if (ev.pointerId !== id) return
    smonta()
    if (iniziato) { if (ev.type === 'pointerup') emit('rilascia', ev.clientX, ev.clientY); else emit('annulla-trascinamento') }
    else if (ev.type === 'pointerup' && !fatto && Math.hypot(ev.clientX - x0, ev.clientY - y0) < SCARTO_DITO) emit('carta-tocco', c.id)
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
      <!-- una carta non ancora arrivata non si trascina: toccarla dice il livello (il click lo manda solo un tocco fermo, non una strisciata) -->
      <button v-for="c in carte" :key="c.id" :data-carta="c.id" :class="{ scelto: strumento === c.id, pieno: c.nel_magazzino > 0, bloccata: c.bloccata }"
              :aria-disabled="c.bloccata || null"
              @pointerdown="c.pezzo && !c.bloccata ? giu($event, c) : null" @click="c.bloccata ? $emit('carta-tocco', c.id) : c.pezzo ? null : $emit('strumento', c.id)">
        <span class="em">{{ c.emoji }}</span><b>{{ c.nome }}</b>
        <small v-if="c.bloccata">🔒 Livello {{ c.liv }}</small>
        <small v-else>{{ c.nel_magazzino ? '📦 ×' + c.nel_magazzino : c.prezzo }}</small>
      </button>
    </div>
    <div class="f3-suggerimento">
      <span>{{ testo }}</span>
    </div>
  </div>
</template>

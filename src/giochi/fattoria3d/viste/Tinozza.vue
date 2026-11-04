<script setup>
// La tinozza: chi lavi (il più sporco è già scelto) e con cosa; il bagno vero si fa sul prato, col dito (scena3d/bagno.js). ✕ in alto a destra. Vedi docs/fattoria3d/cura-sul-prato.md.
import { ref, watch } from 'vue'
import '../stile-bestia.css'

const props = defineProps({
  sporche: { type: Array, required: true },         // [{ id, nome }], dal più sporco
  modi: { type: Array, required: true },            // Cura.modiDiLavare: [{ id, nome, emoji, prezzo, n, ok }]
  messaggio: { type: String, default: '' },
  anteprima: { type: Function, default: null },
  anteprimaPronta: { type: Function, default: null },
})
defineEmits(['lava', 'chiudi'])

const scelta = ref(props.sporche[0] && props.sporche[0].id)
const foto = ref({})
watch(() => props.sporche, l => {
  for (const b of l) {
    const t = 'bestia:' + b.id, pronta = props.anteprimaPronta && props.anteprimaPronta(t)
    if (pronta) foto.value = { ...foto.value, [b.id]: pronta }
    else if (props.anteprima) props.anteprima(t).then(u => { if (u) foto.value = { ...foto.value, [b.id]: u } }, () => {})
  }
}, { immediate: true })
</script>

<template>
  <div class="f3-foglio f3-colonna f3-bes f3-tin" data-f3="tinozza">
    <header class="f3-bes-asse"><h2>Il bagnetto</h2></header>
    <button class="f3-chiudi f3-bes-x" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-corpo f3-bes-corpo">
      <div class="f3-tin-chi">
        <button v-for="b in sporche" :key="b.id" type="button" class="f3-tin-b" :class="{ sel: scelta === b.id }" :data-sporca="b.id" @click="scelta = b.id">
          <img v-if="foto[b.id]" :src="foto[b.id]" :alt="'Ritratto di ' + b.nome" draggable="false"><span>{{ b.nome }}</span>
        </button>
      </div>
      <div class="f3-bes-gesti">
        <button v-for="g in modi" :key="g.id" type="button" class="f3-bes-gesto" :class="{ manca: !g.ok }" :data-lava="g.id" @click="$emit('lava', scelta, g.id)">
          <b aria-hidden="true">{{ g.emoji }}</b><span>{{ g.nome }}</span><em>{{ g.da ? '×' + g.n : '🪙' + g.prezzo }}</em>
        </button>
      </div>
    </div>
    <p class="f3-bes-msg" data-f3="tinozza-msg">{{ messaggio || 'Scegli con cosa lavarlo: poi si strofina col dito.' }}</p>
  </div>
</template>

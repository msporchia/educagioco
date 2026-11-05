<script setup>
/* Il ricettario della cucina col cuoco: si apre su quello che stanno ordinando, e
   in cima si sfogliano gli altri piatti. Vedi docs/bancarella/cuoco.md. */
import { ref, computed } from 'vue'
import { passiRicetta } from '../../motore/bancarella/cuoco.js'

const props = defineProps({
  ricette: { type: Array, required: true },
  ordinati: { type: Array, required: true },   // i piatti chiesti, il primo cliente per primo
})
const emit = defineEmits(['chiudi'])

const c = props.ordinati.find(e => props.ricette.some(r => r.emoji === e))
const scelta = ref(c || props.ricette[0].emoji)
const ricetta = computed(() => props.ricette.find(r => r.emoji === scelta.value))
const passi = computed(() => passiRicetta(ricetta.value))
</script>

<template>
  <div class="ricettario" data-ricettario>
    <button type="button" class="chiudi" data-chiudi-ricettario aria-label="chiudi il ricettario" @click="emit('chiudi')">✕</button>
    <h2>Il ricettario</h2>
    <div class="piatti">
      <button v-for="r in ricette" :key="r.emoji" type="button" class="piatto" :class="{ qui: r.emoji === scelta }"
              :data-ricetta="r.emoji" :aria-label="r.nome" @click="scelta = r.emoji">
        {{ r.emoji }}<i v-if="ordinati.includes(r.emoji)" class="chiesto" data-chiesto></i>
      </button>
    </div>
    <h3 data-nome-ricetta>{{ ricetta.nome }}</h3>
    <p v-if="ordinati.includes(scelta)" class="ordine">Lo stanno ordinando</p>
    <ol class="passi">
      <li v-for="p in passi" :key="p.nome">
        <span class="em">{{ p.emoji }}</span>
        <span class="testo"><b>{{ p.nome }}</b><small>{{ p.come }}</small></span>
      </li>
    </ol>
    <p class="fine">Quando è finito, portalo alla consegna</p>
  </div>
</template>

<style scoped>
.ricettario { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; gap:8px; padding:12px 14px calc(14px + env(safe-area-inset-bottom));
              overflow-y:auto; overscroll-behavior:contain; background:#fffdf7; animation:apre .2s }
h2 { margin:0; padding-right:40px; font-size:18px; font-weight:900; color:#a8301f }
h3 { margin:2px 0 0; font-size:20px; font-weight:900; color:#5a3a20 }
.chiudi { position:absolute; right:10px; top:8px; width:36px; height:36px; border:0; border-radius:50%; font-size:16px; font-weight:900; color:#fff; background:#c8442f;
          box-shadow:0 2px 4px #0005 }
.piatti { flex:none; display:flex; flex-wrap:wrap; gap:7px }
.piatto { position:relative; width:52px; height:52px; border:0; border-radius:14px; font-size:30px; line-height:1; background:#f1e6cf }
.piatto.qui { background:#fff1c9; box-shadow:0 0 0 3px #ff9f1c }
.chiesto { position:absolute; right:-3px; top:-3px; width:14px; height:14px; border-radius:50%; background:#e2533a; box-shadow:0 0 0 2px #fffdf7 }
.ordine { margin:0; font-size:13px; font-weight:800; color:#c8442f }
.passi { flex:none; margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:7px; counter-reset:passo }
.passi li { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:12px; background:#f7efdf }
.em { font-size:30px; line-height:1 }
.testo { display:flex; flex-direction:column; min-width:0 }
.testo b { font-size:15px; font-weight:900; color:#5a3a20 }
.testo small { font-size:13.5px; font-weight:700; color:#6d5a44 }
.fine { margin:0; font-size:14px; font-weight:800; color:#1c7a45 }
@keyframes apre { from { opacity:0; transform:translateY(10px) } }
</style>

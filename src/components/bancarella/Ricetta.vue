<script setup>
/* La ricetta di un piatto ordinato: si apre toccandolo nella lista, e intanto il tempo
   sta fermo. Le figure sono le foto dei modelli. Vedi docs/bancarella/cucina.md. */
import { computed } from 'vue'
import { passiRicetta } from '../../motore/bancarella/cucina.js'
import { FOTO } from '../../data/bancarella-foto.js'

const props = defineProps({ ricetta: { type: Object, required: true } })
const emit = defineEmits(['chiudi'])
const passi = computed(() => passiRicetta(props.ricetta))
</script>

<template>
  <div class="velo" @click.self="emit('chiudi')">
    <div class="ricetta" data-ricetta>
      <button type="button" class="chiudi" data-chiudi-ricetta aria-label="chiudi la ricetta" @click="emit('chiudi')">✕</button>
      <div class="titolo"><img :src="FOTO['piatto:' + ricetta.emoji]" alt=""><h3 data-nome-ricetta>{{ ricetta.nome }}</h3></div>
      <ol class="passi">
        <li v-for="p in passi" :key="p.nome">
          <img class="em" :src="FOTO[p.foto]" alt="">
          <span class="testo"><b>{{ p.nome }}</b><small>{{ p.come }}</small></span>
        </li>
      </ol>
      <p class="fine">Quando è finito, portalo alla consegna sul piatto</p>
    </div>
  </div>
</template>

<style scoped>
.velo { position:absolute; inset:0; z-index:25; padding:10px 12px; background:#0000004d }
.ricetta { position:relative; display:flex; flex-direction:column; gap:8px; max-height:100%; overflow-y:auto; padding:12px 14px; border-radius:18px; background:#fffdf7;
           box-shadow:0 6px 16px #0000004d; animation:apre .18s }
h3 { margin:0; padding-right:36px; font-size:20px; font-weight:900; color:#5a3a20 }
.chiudi { position:absolute; right:10px; top:8px; width:36px; height:36px; border:0; border-radius:50%; font-size:16px; font-weight:900; color:#fff; background:#c8442f;
          box-shadow:0 2px 4px #0005 }
.titolo { display:flex; align-items:center; gap:10px }
.titolo img { width:84px; height:84px }
.passi { flex:none; margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:7px }
.passi li { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:12px; background:#f7efdf }
.em { flex:none; width:54px; height:54px }
.testo { display:flex; flex-direction:column; min-width:0 }
.testo b { font-size:15px; font-weight:900; color:#5a3a20 }
.testo small { font-size:13.5px; font-weight:700; color:#6d5a44 }
.fine { margin:0; font-size:14px; font-weight:800; color:#1c7a45 }
@keyframes apre { from { opacity:0; transform:translateY(-8px) } }
</style>

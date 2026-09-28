<script setup>
// La barra in cima, uguale ovunque: vedi docs/core/interfaccia.md.
import { ref, computed } from 'vue'
import { state, accendiSuono } from '../store/profile.js'
import { suono } from '../audio.js'
import { aiutoDi } from '../guide/contenuti.js'
import VeloAiuto from '../guide/VeloAiuto.vue'

const props = defineProps({
  titolo: { type: String, default: '' },
  monete: { type: Boolean, default: false },   // in battaglia contano altre valute
  audio: { type: Boolean, default: true },
  scura: { type: Boolean, default: false },    // per i fondi notturni, tipo lo spazio
  guida: { type: String, default: '' },   // chiave della schermata; senza voce in contenuti.js, niente `?`
  pausa: { type: Boolean, default: false },   // compare solo se il gioco lo chiede (giochi/pausa.js)
})
const emit = defineEmits(['indietro', 'aiuto', 'pausa'])

const aiuto = computed(() => aiutoDi(props.guida))
const apertoAiuto = ref(false)
function mostraAiuto (v) { apertoAiuto.value = v; emit('aiuto', v) }
</script>

<template>
  <header class="barra-app" :class="{ scura }">
    <button class="tondo torna" aria-label="indietro" @click="$emit('indietro')">←</button>
    <b v-if="titolo" class="dove">{{ titolo }}</b>
    <div class="mezzo"><slot /></div>
    <button v-if="pausa" class="tondo" aria-label="pausa" data-azione="pausa"
            @click="$emit('pausa')">⏸</button>
    <button v-if="aiuto" class="tondo" aria-label="aiuto" data-azione="aiuto"
            @click="mostraAiuto(true)">?</button>
    <div v-if="monete" class="gettone">🪙 <b>{{ state.profile.coins }}</b></div>
    <button v-if="audio" class="tondo" aria-label="suono"
            @click="accendiSuono(!suono.acceso.value)">
      {{ suono.acceso.value ? '🔊' : '🔇' }}
    </button>
  </header>
  <VeloAiuto v-if="apertoAiuto && aiuto" :aiuto="aiuto" @chiudi="mostraAiuto(false)" />
</template>

<style scoped>
.barra-app { display:flex; align-items:center; gap:6px; flex:none;
             padding:calc(8px + env(safe-area-inset-top)) 8px 8px;
             background:#ffffff88; backdrop-filter:blur(6px);
             box-shadow:0 1px 0 #00000010; position:relative; z-index:20 }
.dove { font-size:clamp(13px,3.8vw,16px); color:var(--viola-scuro); white-space:nowrap;
        overflow:hidden; text-overflow:ellipsis; max-width:38vw }
.mezzo { flex:1; min-width:0; display:flex; align-items:center; gap:6px;
         justify-content:flex-end; overflow:hidden }
.barra-app .tondo { flex:none }
.barra-app .tondo[aria-label="aiuto"] { font-weight:900; color:var(--viola-scuro) }
.barra-app .tondo[aria-label="pausa"] { font-size:clamp(13px,3.6vw,16px) } /* ⏸ pesa più del `?` a colori */
.torna { background:linear-gradient(180deg,var(--viola),var(--viola-scuro));
         color:#fff; font-size:clamp(19px,5vw,23px); font-weight:900; line-height:1;
         width:clamp(38px,10.5vw,44px); height:clamp(38px,10.5vw,44px);
         box-shadow:0 3px 0 #2c4283 }
.torna:active { transform:translateY(2px); box-shadow:0 1px 0 #2c4283 }

.barra-app.scura { background:#141c2aaa; box-shadow:0 1px 0 #ffffff18 }
.barra-app.scura .dove { color:#d3ddf2 }
.barra-app.scura :deep(.gettone) { background:#ffffff1c; color:#eef2fa }
.barra-app.scura :deep(.tondo) { background:#ffffff20; color:#eef2fa }
.barra-app.scura .torna { background:linear-gradient(180deg,#7f97e0,#4a63c4);
                          color:#fff; box-shadow:0 3px 0 #27386e }
</style>

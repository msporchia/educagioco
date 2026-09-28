<script setup>
// Il velo «cos'è questo gioco?» prima che il profilo esista (App.vue monta il
// benvenuto al posto di tutto): solo le guide `subito`. Vedi docs/genitori/guide.md.
import { ref, computed } from 'vue'
import Blocchi from './Blocchi.vue'
import Elenco from './Elenco.vue'
import { GUIDE } from './contenuti.js'

defineEmits(['chiudi'])

const elenco = computed(() => GUIDE.filter(g => g.subito))
const aperta = ref(null)
</script>

<template>
  <!-- @click.self: si chiude toccando fuori dal foglio, non dentro -->
  <div class="aiuto-velo" data-velo="guide" @click.self="$emit('chiudi')">
    <div class="foglio">
      <template v-if="!aperta">
        <h2>Cos'è questo gioco?</h2>
        <div class="scorre">
          <Elenco :guide="elenco" marca="velo" @apri="aperta = $event" />
          <p class="mini coda">Il resto — la difficoltà, i giochi da spegnere, il
            salvataggio — si legge quando serve, da <b>«? Come funziona»</b> in fondo
            alla schermata dei giochi.</p>
        </div>
        <button class="bottone" data-azione="chiudi-guide" @click="$emit('chiudi')">
          Ho capito</button>
      </template>

      <template v-else>
        <h2><span class="em">{{ aperta.emoji }}</span> {{ aperta.titolo }}</h2>
        <div class="scorre"><Blocchi :blocchi="aperta.blocchi" /></div>
        <button class="bottone chiaro" data-azione="torna-guide" @click="aperta = null">
          ← le altre domande</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* stessa forma del velo del `?` dentro un gioco */
.aiuto-velo { position:fixed; inset:0; z-index:120; display:flex; align-items:flex-end;
              justify-content:center; background:#1b2436aa; backdrop-filter:blur(2px) }
.foglio { width:min(560px,100%); max-height:88vh; display:flex; flex-direction:column;
          gap:12px; padding:16px 16px calc(16px + env(safe-area-inset-bottom));
          border-radius:22px 22px 0 0; background:linear-gradient(180deg,#fff9f0,#eef4ef);
          box-shadow:0 -8px 30px #00000030; animation:sali .22s ease-out }
@keyframes sali { from { transform:translateY(26px); opacity:.4 } }
.foglio h2 { text-align:center; font-size:19px; color:var(--viola-scuro) }
.foglio .em { font-style:normal }
.scorre { overflow-y:auto; padding:2px; display:flex; flex-direction:column; gap:9px }

.coda { font-size:12px; color:var(--tenue); line-height:1.45; padding:2px 4px; text-align:left }
.foglio .bottone { align-self:center; padding:12px 34px; font-size:17px }
</style>

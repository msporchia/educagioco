<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL VELO DEL `?`

   Quello che si apre dal punto interrogativo della barra. È un foglio
   che sale dal basso e copre il gioco: chi lo apre sta già giocando, e
   deve poterlo chiudere senza cercare dove.

   Non mette in pausa niente da sé — non saprebbe come, i giochi si
   fermano in undici modi diversi. La barra avvisa con `@aiuto`, e chi
   ha un orologio che gira se lo ferma da sé.
   ═══════════════════════════════════════════════════════════════════ */
import Blocchi from './Blocchi.vue'

defineProps({
  aiuto: { type: Object, required: true },
})
defineEmits(['chiudi'])
</script>

<template>
  <!-- @click.self: si chiude toccando fuori dal foglio, non dentro -->
  <div class="aiuto-velo" data-velo="aiuto" @click.self="$emit('chiudi')">
    <div class="foglio">
      <h2><span class="em">{{ aiuto.emoji }}</span> {{ aiuto.titolo }}</h2>
      <div class="scorre"><Blocchi :blocchi="aiuto.blocchi" /></div>
      <button class="bottone" data-azione="chiudi-aiuto" @click="$emit('chiudi')">
        <span class="em">▶</span> gioca
      </button>
    </div>
  </div>
</template>

<style scoped>
.aiuto-velo { position:fixed; inset:0; z-index:120; display:flex; align-items:flex-end;
              justify-content:center; background:#1b2436aa; backdrop-filter:blur(2px) }
.foglio { width:min(560px,100%); max-height:88vh; display:flex; flex-direction:column;
          gap:12px; padding:16px 16px calc(16px + env(safe-area-inset-bottom));
          border-radius:22px 22px 0 0; background:linear-gradient(180deg,#fff9f0,#eef4ef);
          box-shadow:0 -8px 30px #00000030; animation:sali .22s ease-out }
@keyframes sali { from { transform:translateY(26px); opacity:.4 } }
.foglio h2 { text-align:center; font-size:19px }
.foglio .em { font-style:normal }
.scorre { overflow-y:auto; padding:2px }
.foglio .bottone { align-self:center; padding:12px 34px; font-size:17px }
</style>

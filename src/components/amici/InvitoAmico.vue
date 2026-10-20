<script setup>
// Il cartello di un invito, su qualunque schermata (montato una volta in App.vue; docs/core/amici.md). Non ferma niente: sta sotto
// la barra, con «Gioca» e «No grazie», e sparisce da solo dopo trenta secondi (lo decide il motore).
import { stato, rispondi } from '../../amici/servizio.js'
import { GIOCHI } from '../../amici/giochi.js'
import { chiediIngresso } from '../../amici/ingresso.js'

function gioca() {
  const i = rispondi(true)
  if (i) chiediIngresso(i.gioco, i.dati)
}
</script>

<template>
  <Transition name="sali">
    <div v-if="stato.invito" class="invito-amico" data-invito role="alert">
      <span class="em" aria-hidden="true">👫</span>
      <p><b>{{ stato.invito.nome }}</b> ti invita a giocare a <b>{{ GIOCHI[stato.invito.gioco].nome }}</b></p>
      <div class="tasti">
        <button class="si" type="button" data-invito-gioca @click="gioca">Gioca</button>
        <button class="no" type="button" data-invito-no @click="rispondi(false)">No grazie</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.invito-amico { position:fixed; z-index:130; left:50%; transform:translateX(-50%); width:min(94vw,420px);
                top:calc(8px + env(safe-area-inset-top)); display:flex; align-items:center; gap:10px; flex-wrap:wrap;
                padding:10px 12px; border-radius:16px; background:#fffbe8; color:#3c3a33;
                box-shadow:0 6px 22px #00000040; border:2px solid #f3c24f }
.em { font-size:28px }
p { margin:0; flex:1 1 150px; font-size:15px; line-height:1.3 }
.tasti { display:flex; gap:8px; margin-left:auto }
button { min-height:44px; padding:8px 14px; border:0; border-radius:12px; font:inherit; font-weight:800; touch-action:manipulation }
.si { background:#2f9e5b; color:#fff }
.no { background:#ece7d8; color:#5b564a }
.sali-enter-active, .sali-leave-active { transition:opacity .25s, transform .25s }
.sali-enter-from, .sali-leave-to { opacity:0; transform:translate(-50%,-14px) }
</style>

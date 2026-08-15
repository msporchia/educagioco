<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL PRIMO AVVIO

   Quando nell'archivio non c'è nessun giocatore, questa è la prima cosa
   che si vede. Prima non poteva succedere: i giocatori erano scritti nel
   codice, quindi ce n'erano sempre due anche su un telefono appena
   installato. Adesso l'elenco è vuoto finché qualcuno non ci mette il
   suo nome.

   Non chiede il PIN apposta. Il PIN protegge le cose dei genitori, ma
   qui non c'è ancora niente da proteggere: chiederlo vorrebbe dire che
   un'app appena installata non si apre senza sapere un codice che
   nessuno ha ancora scelto. Aggiungere il secondo giocatore, invece, sta
   dietro il PIN come tutto il resto.
   ═══════════════════════════════════════════════════════════════════ */
import { ref } from 'vue'
import { creaGiocatore } from '../store/profile.js'
import { PERSONE } from '../giochi/fattoria/dati/atlante.js'
import SceltaAspetto from './SceltaAspetto.vue'

const nome = ref('')
const occupato = ref(false)
/* Preselezionato, non chiesto vuoto come la partenza in GenitoriView: qui
   non cambia cosa il bambino vede o sa, solo con che faccia si vede in
   mappa — un tasto spento finché non si sceglie sarebbe attrito su una
   schermata che vuole restare "tre tocchi", non una in più. */
const aspetto = ref(PERSONE[0])

async function entra() {
  const pulito = nome.value.trim()
  if (!pulito || occupato.value) return
  occupato.value = true
  try { await creaGiocatore(pulito, true, null, aspetto.value) }
  finally { occupato.value = false }
}
</script>

<template>
  <div class="schermo benvenuto">
    <div class="centro">
      <span class="em">👋</span>
      <h1>Ciao!<br><span>Come ti chiami?</span></h1>

      <form @submit.prevent="entra">
        <input v-model="nome" class="nome" type="text" maxlength="20"
               autocomplete="off" autocapitalize="words" spellcheck="false"
               placeholder="il tuo nome" aria-label="il tuo nome">
        <SceltaAspetto :scelto="aspetto" data-scelta="aspetto" @scegli="aspetto = $event" />
        <button class="via" type="submit" :disabled="!nome.trim() || occupato">Si gioca!</button>
      </form>

      <p class="mini">Lo possono cambiare mamma e papà quando vogliono.</p>
    </div>
  </div>
</template>

<style scoped>
.benvenuto .centro { display:flex; flex-direction:column; align-items:center; gap:18px; padding:24px }
.em { font-size:64px; line-height:1 }
h1 { text-align:center; margin:0 }
form { display:flex; flex-direction:column; align-items:center; gap:14px; width:min(320px, 82vw) }
.nome {
  width:100%; padding:15px 18px; border:none; border-radius:16px;
  font-size:22px; text-align:center; font-family:inherit;
  background:#ffffffee; color:var(--viola-scuro); box-shadow:0 3px 0 #0002;
}
.nome:focus { outline:3px solid var(--viola); outline-offset:2px }
.via {
  padding:14px 34px; border:none; border-radius:999px; font-size:20px; font-weight:800;
  font-family:inherit; color:#fff; cursor:pointer;
  background:linear-gradient(180deg, var(--viola), var(--viola-scuro)); box-shadow:0 4px 0 #0003;
}
.via:disabled { opacity:.45; box-shadow:none }
.mini { opacity:.75; font-size:14px; text-align:center; margin:0 }
</style>

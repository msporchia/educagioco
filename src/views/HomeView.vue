<script setup>
import { computed } from 'vue'
import { state, PLAYERS, selectPlayer, level, countMastered, resetPlayer,
         miei, affamati } from '../store/profile.js'
import { WORDS } from '../data/words.js'
import { VERBI } from '../data/verbi.js'

defineEmits(['vai'])

const imparateEn = computed(() => countMastered('en:'))
const imparatiVerbi = computed(() => countMastered('verbo:'))
const imparateMate = computed(() => countMastered('math:'))
const totMate = 100

/* la fame è la sola cosa che cambia da sola mentre il gioco è chiuso:
   dirlo qui è metà del motivo per riaprirlo */
const animali = computed(() => miei().length)
const conFame = computed(() => affamati().map(p => p.nome))

async function azzera() {
  if (!confirm('Azzerare tutto di ' + state.player + '? Monete, cameretta e progressi.')) return
  await resetPlayer()
}
</script>

<template>
  <div class="schermo">
    <div class="centro">
      <h1>I giochi di<br><span>Leonardo e Melody</span></h1>

      <div class="giocatori">
        <button v-for="p in PLAYERS" :key="p" class="gioc" :class="{ on: state.player === p }"
                @click="selectPlayer(p)">{{ p }}</button>
      </div>

      <p class="testo">
        ⭐ livello {{ level }} · 🪙 {{ state.profile.coins }} ·
        {{ state.profile.owned.length }} oggetti
      </p>

      <div class="carte">
        <button class="carta mate" @click="$emit('vai','mate')">
          <span class="ico">☄️</span>
          <b>Tabelline Asteroidi</b>
          <i>{{ imparateMate }}/{{ totMate }} tabelline sicure</i>
        </button>
        <button class="carta eng" @click="$emit('vai','inglese')">
          <span class="ico">🔤</span>
          <b>English</b>
          <i>{{ imparateEn }}/{{ WORDS.length }} parole imparate</i>
        </button>
        <button class="carta verbi" @click="$emit('vai','verbi')">
          <span class="ico">🎧</span>
          <b>Verbi in inglese</b>
          <i>{{ imparatiVerbi }}/{{ VERBI.length }} verbi · leggi e ascolta</i>
        </button>
        <button class="carta td" @click="$emit('vai','torri')">
          <span class="ico">🏰</span>
          <b>Difendi il Castello</b>
          <i>operazioni in colonna · torri e nemici</i>
        </button>
        <button class="carta pets" @click="$emit('vai','animali')">
          <span class="ico">🐾</span>
          <b>Watson, Sherlock &amp; Irene</b>
          <i v-if="!animali">tre gatti da adottare</i>
          <i v-else-if="conFame.length" class="fame">{{ conFame.join(' e ') }}
            {{ conFame.length > 1 ? 'hanno' : 'ha' }} fame!</i>
          <i v-else>{{ animali }} {{ animali > 1 ? 'animali sazi' : 'animale sazio' }}</i>
        </button>
        <button class="carta room" @click="$emit('vai','cameretta')">
          <span class="ico">🛏️</span>
          <b>Cameretta &amp; Negozio</b>
          <i>le monete di tutti i giochi</i>
        </button>
      </div>

      <p v-if="state.storage === 'memoria'" class="avviso">
        Questa anteprima non può salvare nulla. Scarica il file e aprilo dal telefono
        o dal computer perché monete e progressi restino.
      </p>
      <p v-else class="mini">dati salvati su {{ state.storage }}</p>
      <button class="link" @click="azzera">azzera i dati di {{ state.player }}</button>
    </div>
  </div>
</template>

<style scoped>
.giocatori { display:flex; gap:10px }
.gioc { padding:13px 26px; border-radius:999px; background:#ffffffcc; color:var(--viola-scuro);
        font-size:19px; font-weight:800; box-shadow:0 4px 0 #ddd0ef; transition:.14s }
.gioc.on { background:linear-gradient(180deg,var(--viola),var(--viola-scuro)); color:#fff;
           box-shadow:0 4px 0 #3f2ba8; transform:translateY(-1px) }
.carte { display:flex; flex-direction:column; gap:11px; width:100%; max-width:400px }
.carta { display:grid; grid-template-columns:auto 1fr; grid-template-rows:auto auto; gap:2px 14px;
         align-items:center; text-align:left; padding:14px 18px; border-radius:20px;
         background:var(--carta); box-shadow:0 5px 0 #e3d6f0, 0 10px 22px #a08fc022 }
.carta:active { transform:translateY(2px); box-shadow:0 3px 0 #e3d6f0 }
.carta .ico { grid-row:1/3; font-size:38px }
.carta b { font-size:18px; font-weight:900; color:var(--viola-scuro) }
.carta i { font-style:normal; font-size:13px; color:var(--tenue) }
.carta.mate { background:linear-gradient(120deg,#e8f0ff,#fffffff0) }
.carta.eng  { background:linear-gradient(120deg,#ffeaf2,#fffffff0) }
.carta.verbi { background:linear-gradient(120deg,#efe6ff,#fffffff0) }
.carta.td   { background:linear-gradient(120deg,#e6f7e2,#fffffff0) }
.carta.room { background:linear-gradient(120deg,#fff6e0,#fffffff0) }
.carta.pets { background:linear-gradient(120deg,#ffeede,#fffffff0) }
.carta .fame { color:var(--rosso); font-weight:800 }
</style>

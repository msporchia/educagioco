<script setup>
// Il profilo: chi gioca, a che punto è, e gli altri bambini di casa.
// Vedi docs/core/home.md («Il profilo»).
import { computed } from 'vue'
import { state, level, livelloOra, serieGiorni, traguardi, selectPlayer } from '../store/profile.js'
import { chiediDopoIlCodice } from '../store/pin.js'
import Barra from '../components/Barra.vue'
import Iniziale from '../components/home/Iniziale.vue'

const emit = defineEmits(['vai'])

const io = computed(() => state.giocatori.find(g => g.id === state.player) || { id: state.player, nome: '' })
const altri = computed(() => state.giocatori.filter(g => g.id !== state.player))
const salita = computed(() => livelloOra())
const medaglie = computed(() => traguardi().filter(t => t.preso).length)
const serie = computed(() => serieGiorni())

// cambiare bambino porta in home da solo (il watch su state.player in App.vue)
const giocaTu = id => selectPlayer(id)
function aggiungi() {
  chiediDopoIlCodice('aggiungi')
  emit('vai', 'genitori')
}
</script>

<template>
  <div class="schermo profilo" data-profilo>
    <Barra titolo="Il profilo" @indietro="$emit('vai', 'home')" />
    <div class="corpo">
      <Iniziale :id="io.id" :nome="io.nome" :misura="76" />
      <h2 class="nome">{{ io.nome }}</h2>
      <p class="titolo">{{ salita.titolo }} · livello {{ level }}</p>
      <span class="barretta"><i :style="{ width: Math.round(salita.quota * 100) + '%' }"></i></span>

      <div class="numeri">
        <span class="numero"><b>🪙 {{ state.profile.coins }}</b><i>monete</i></span>
        <button class="numero" data-azione="medaglie" @click="$emit('vai', 'albo')">
          <b>🏅 {{ medaglie }}</b><i>medaglie ›</i></button>
        <span class="numero"><b>🔥 {{ serie }}</b><i>{{ serie === 1 ? 'giorno' : 'giorni' }} di fila</i></span>
      </div>

      <h3 v-if="altri.length" class="sopra">gli altri</h3>
      <button v-for="g in altri" :key="g.id" class="altro" :data-giocatore="g.id" @click="giocaTu(g.id)">
        <Iniziale :id="g.id" :nome="g.nome" :misura="34" />
        <span><b>{{ g.nome }}</b><i>tocca per giocare tu</i></span>
      </button>

      <button class="aggiungi" data-azione="aggiungi" @click="aggiungi">
        <b>＋ aggiungi un bambino</b><i>🔒 serve il codice dei grandi</i>
      </button>
    </div>
  </div>
</template>

<style scoped>
.profilo { background:#f6f7f9 }
.corpo { flex:1; overflow-y:auto; display:flex; flex-direction:column; align-items:center;
         gap:6px; padding:22px 18px 30px; width:100%; max-width:436px; margin:0 auto }
.nome { margin-top:8px; font-size:22px; font-weight:600; color:#1f2433 }
.titolo { font-size:14px; color:#7a8193 }
.barretta { display:block; width:60%; height:6px; margin:6px 0 10px; border-radius:999px; background:#e3e7ef; overflow:hidden }
.barretta i { display:block; height:100%; border-radius:999px; background:#5b7cfa }
.numeri { display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; width:100% }
.numero { display:flex; flex-direction:column; align-items:center; gap:3px; padding:12px 4px;
          border-radius:14px; background:#fff; box-shadow:0 1px 2px #1f243312 }
.numero b { font-size:16px; font-weight:600; color:#1f2433 }
.numero i { font-style:normal; font-size:12px; color:#7a8193 }
.sopra { align-self:flex-start; margin:18px 0 2px 4px; font-size:13px; font-weight:600; color:#7a8193 }
.altro { display:flex; align-items:center; gap:12px; width:100%; padding:10px 12px; border-radius:14px;
         text-align:left; background:#fff; box-shadow:0 1px 2px #1f243312 }
.altro span { display:flex; flex-direction:column }
.altro b, .aggiungi b { font-size:15px; font-weight:600; color:#1f2433 }
.altro i, .aggiungi i { font-style:normal; font-size:12px; color:#7a8193 }
.aggiungi { display:flex; flex-direction:column; align-items:center; gap:2px; width:100%; margin-top:14px;
            padding:12px; border-radius:14px; background:transparent; box-shadow:inset 0 0 0 1.5px #c3c9d6 }
.altro:active, .numero:active, .aggiungi:active { transform:scale(.98) }
</style>

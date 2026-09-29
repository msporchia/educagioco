<script setup>
// La mappa delle tappe: quattro campagne, ognuna un arco col suo titolo e
// il conto di quante ne restano (così si vede che una campagna nuova è un
// capitolo, non il gradino successivo della stessa scala). Una tappa chiusa
// resta visibile: sapere cosa c'è dopo è metà del motivo per finire quella
// di adesso.
import { computed } from 'vue'
import { TORRI } from '../../data/ops.js'
import { CAMPAGNE } from '../../data/campagne-castello.js'
import { tappaAperta } from '../../store/profile.js'
import { apertaQui } from '../../data/portata-giochi.js'

const props = defineProps({
  tappe: { type: Array, required: true },
  fatte: { type: Number, default: 0 },      // quante ne ha già superate
  libera: { type: Boolean, default: false },
  libere: { type: Array, default: () => [] },   // [{ chiave, nome, emoji, primato }]
  regali: { type: Number, default: 0 },         // potenziamenti presi: uno per il castello, non per terreno
})
defineEmits(['gioca', 'libera', 'indietro'])

// il lucchetto guarda anche l'età: le tappe già passate nascono aperte,
// quelle troppo avanti restano chiuse (data/portata.js)
const aperta = i => apertaQui(props.tappe[i], i, props.fatte)

// le tappe arrivano già in fila: qui si rimettono in archi senza perdere
// l'indice globale, che è quello che il profilo salva
const archi = computed(() => {
  const out = []
  props.tappe.forEach((T, i) => {
    const ultimo = out[out.length - 1]
    if (!ultimo || ultimo.id !== T.campagna) {
      const c = CAMPAGNE.find(x => x.id === T.campagna)
      out.push({ id: T.campagna, nome: c ? c.nome : '', emoji: c ? c.emoji : '', tappe: [] })
    }
    out[out.length - 1].tappe.push({ T, i })
  })
  return out
})

const fatteDi = arco => arco.tappe.filter(({ i }) => i < props.fatte).length
</script>

<template>
  <h2>Difendi il castello</h2>
  <p class="testo">I nemici fermati lasciano ⚡. Con l'energia si costruisce una
    torre, oppure — spendendo meno — si tocca una torre già in campo per farla
    salire di livello con un calcolo più difficile. L'ondata parte quando la
    chiami tu: il tempo per fare i conti è tutto tuo.</p>
  <template v-for="arco in archi" :key="arco.id">
    <div class="arco" :class="{ finito: fatteDi(arco) === arco.tappe.length }">
      <span class="faccia">{{ arco.emoji }}</span>
      <b>{{ arco.nome }}</b>
      <i>{{ fatteDi(arco) }}/{{ arco.tappe.length }}</i>
    </div>
    <div class="tappe">
      <button v-for="{ T, i } in arco.tappe" :key="i" class="tap"
              :class="{ fatta: i < fatte, chiusa: !aperta(i) }"
              :disabled="!aperta(i)" @click="$emit('gioca', i)">
        <span class="em">{{ aperta(i) ? T.emoji : '🔒' }}</span>
        <b>{{ i + 1 }}. {{ T.nome }}</b>
        <i>{{ T.ondate }} ondate ·
          <template v-for="k in T.torri" :key="k">{{ TORRI[k].emoji }}</template>
        </i>
        <span v-if="i < fatte" class="spunta">✔</span>
      </button>
    </div>
  </template>
  <template v-if="libera">
    <div class="arco libere">
      <span class="faccia">♾️</span>
      <b>Partite libere</b>
      <i v-if="regali" data-regali>🎁 {{ regali }}
        {{ regali === 1 ? 'potenziamento' : 'potenziamenti' }}</i>
    </div>
    <div class="tappe">
      <button v-for="l in libere" :key="l.chiave" class="tap" :data-tappa="l.chiave"
              @click="$emit('libera', l.chiave)">
        <span class="em">{{ l.emoji }}</span>
        <b>{{ l.nome }}</b>
        <i v-if="l.primato" class="record">record {{ l.primato }}</i>
        <i v-else>senza fine</i>
      </button>
    </div>
    <p v-if="regali" class="dote">I potenziamenti presi restano per sempre, su tutti i terreni</p>
  </template>
  <div class="riga">
    <button class="bottone chiaro" @click="$emit('indietro')">Indietro</button>
  </div>
</template>

<style scoped src="./mappa.css"></style>

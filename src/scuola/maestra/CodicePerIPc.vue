<script setup>
// Il codice della maestra per i PC dei bambini (comune/codice-maestra.js): nascosto finché non lo chiede, perché la pagina
// può stare sulla LIM; e quello di un'altra ora, per un PC con l'orologio sbagliato. docs/scuola/ripieghi.md
import { ref, computed, onUnmounted } from 'vue'
import { codiceAl, valeFinoAl } from '../comune/codice-maestra.js'
import { ora as oraDi } from './utili.js'

const VISIBILE = 60 * 1000
const ora = ref(Date.now())
const finoA = ref(0)
const altraOra = ref('')
let battito = 0

const visibile = computed(() => ora.value < finoA.value)
const codice = computed(() => codiceAl(ora.value))
const altro = computed(() => { const t = altraOra.value ? new Date(altraOra.value).getTime() : NaN; return Number.isFinite(t) ? codiceAl(t) : '' })

function mostra() {
  ora.value = Date.now()
  finoA.value = ora.value + VISIBILE
  clearInterval(battito)
  battito = setInterval(() => { ora.value = Date.now(); if (!visibile.value) clearInterval(battito) }, 1000)
}
onUnmounted(() => clearInterval(battito))
</script>

<template>
  <div class="codice-pc" data-codice-per-i-pc>
    <div class="fila">
      <button class="bottone chiaro" data-azione="mostra-codice-pc" @click="visibile ? (finoA = 0) : mostra()">
        {{ visibile ? 'Nascondi il codice' : 'Codice per i PC' }}</button>
      <template v-if="visibile">
        <b class="cifre" data-codice-pc>{{ codice }}</b>
        <span class="nota" data-vale-fino>vale fino alle {{ oraDi(valeFinoAl(ora)) }}: puoi segnartelo</span>
      </template>
    </div>
    <p class="nota">Sul PC di un bambino apre il tasto «Maestra» (le domande al posto del gioco, il blocco dopo, un altro nome) e
      «Senza lezione», per far partire un gioco anche senza internet.</p>
    <details v-if="visibile" class="altra">
      <summary class="nota">Il PC ha l'ora sbagliata?</summary>
      <label class="nota">L'ora che segna il PC
        <input v-model="altraOra" class="campo" type="datetime-local" data-campo="ora-del-pc"></label>
      <p v-if="altro" class="nota">Il codice per quell'ora: <b class="cifre piccole" data-codice-altra-ora>{{ altro }}</b></p>
    </details>
  </div>
</template>

<style scoped>
.codice-pc { display:flex; flex-direction:column; gap:8px }
.cifre { font-size:32px; letter-spacing:.15em; font-variant-numeric:tabular-nums }
.cifre.piccole { font-size:20px }
.altra { display:flex; flex-direction:column; gap:6px }
.altra summary { cursor:pointer }
</style>

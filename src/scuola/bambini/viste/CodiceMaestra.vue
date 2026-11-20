<script setup>
// Il codice della maestra sul PC del bambino: quattro cifre a tempo (comune/codice-maestra.js). Dice anche l'ora del PC,
// perché se l'orologio è sbagliato la maestra chiede alla sua pagina il codice di quell'ora. docs/scuola/ripieghi.md
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { codiceGiusto, SBAGLI, attesaDopo } from '../../comune/codice-maestra.js'

// il conto degli sbagli resta a menu chiuso e a pagina riaperta: se no chiudere e riaprire azzererebbe l'attesa
const CHIAVE = 'scuola:codice-maestra'
function leggiConto() {
  try { const c = JSON.parse(localStorage.getItem(CHIAVE)); if (c && Number.isFinite(c.fermoFino)) return c } catch { /* niente */ }
  return { sbagli: 0, giri: 0, fermoFino: 0 }
}
function scriviConto(c) { try { localStorage.setItem(CHIAVE, JSON.stringify(c)) } catch { /* senza: vale finché la pagina è aperta */ } }

const emit = defineEmits(['giusto', 'annulla'])
const scritto = ref('')
const errore = ref('')
const ora = ref(Date.now())
const campo = ref(null)
const conto = ref(leggiConto())
let battito = 0

const fermo = computed(() => ora.value < conto.value.fermoFino)
const minuti = computed(() => Math.max(1, Math.ceil((conto.value.fermoFino - ora.value) / 60000)))
const pronto = computed(() => scritto.value.length === 4 && !fermo.value)
const oraDelPc = computed(() => new Date(ora.value).toLocaleString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }))

function scrivi(e) {
  scritto.value = String(e.target.value).replace(/\D/g, '').slice(0, 4)
  e.target.value = scritto.value
  errore.value = ''
}

function prova() {
  ora.value = Date.now()
  if (!pronto.value) return
  if (codiceGiusto(scritto.value, ora.value)) {
    conto.value = { sbagli: 0, giri: 0, fermoFino: 0 }
    scriviConto(conto.value)
    return emit('giusto')
  }
  scritto.value = ''
  const c = { ...conto.value, sbagli: conto.value.sbagli + 1 }
  if (c.sbagli >= SBAGLI) { c.sbagli = 0; c.giri++; c.fermoFino = ora.value + attesaDopo(c.giri) }
  conto.value = c
  scriviConto(c)
  errore.value = fermo.value ? '' : 'Il codice non è giusto.'
  campo.value?.focus()
}

onMounted(() => { campo.value?.focus(); battito = setInterval(() => { ora.value = Date.now() }, 1000) })
onUnmounted(() => clearInterval(battito))
</script>

<template>
  <form class="codice-maestra" data-codice-maestra @submit.prevent="prova">
    <h2>Il codice della maestra</h2>
    <p class="nota">Quattro cifre: le trova nella sua pagina, alla voce «Codice per i PC».</p>
    <input ref="campo" class="cifre" :value="scritto" inputmode="numeric" maxlength="4" autocomplete="off" spellcheck="false"
           aria-label="il codice della maestra" data-campo="codice-maestra" @input="scrivi">
    <div class="fila">
      <button type="submit" class="bottone" :disabled="!pronto" data-azione="codice-maestra">Apri</button>
      <button type="button" class="bottone chiaro" data-azione="annulla" @click="emit('annulla')">Annulla</button>
    </div>
    <p v-if="fermo" class="avviso" data-codice-maestra-errore>Troppi codici sbagliati: aspetta {{ minuti === 1 ? 'un minuto' : `${minuti} minuti` }}.</p>
    <p v-else-if="errore" class="avviso" data-codice-maestra-errore>{{ errore }}</p>
    <p class="nota" data-ora-del-pc>Questo computer segna {{ oraDelPc }}. Se è sbagliato, nella pagina della maestra c'è il codice per quell'ora.</p>
  </form>
</template>

<style scoped>
.codice-maestra { display:flex; flex-direction:column; align-items:center; gap:14px; text-align:center }
.cifre { width:100%; max-width:240px; padding:12px; text-align:center; font:inherit; font-size:40px; font-weight:600;
         letter-spacing:.3em; text-indent:.3em; color:var(--inchiostro); background:var(--superficie);
         border:2px solid var(--filo); border-radius:var(--raggio); outline:none }
.cifre:focus { border-color:var(--accento) }
.fila { justify-content:center }
.nota { max-width:40ch }
</style>

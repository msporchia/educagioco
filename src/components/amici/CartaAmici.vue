<script setup>
// Gli amici nella zona dei grandi (docs/core/amici.md): acceso o spento per il bambino di turno, gli amici che ha, «Invita un amico»
// (un codice di 5 lettere che vale due ore) e «Ho un codice». Fare amicizia fra bambini è una cosa da genitori.
import { ref, computed, onMounted } from 'vue'
import { state, nomeCorrente } from '../../store/profile.js'
import { dati, carica, accendi, aggiungi, togli, casuale, MAX_AMICI } from '../../store/amici.js'
import { creaCodice, riscattaCodice } from '../../amici/rete.js'
import { riavviaAmici } from '../../amici/avvio.js'
import { aggiungiPonte, togliPonte } from '../../amici/servizio.js'
import { PASSO } from '../../amici/testi.js'

const chi = computed(() => nomeCorrente() || 'questo bambino')
const codice = ref(null)            // { testo, scade } mentre se ne mostra uno
const scritto = ref('')
const messaggio = ref('')
const occupato = ref(false)
const daTogliere = ref(null)
const pieno = computed(() => dati.amici.length >= MAX_AMICI)
const pulito = computed(() => scritto.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5))
const scadeTra = computed(() => (codice.value ? Math.max(1, Math.round((codice.value.scade - Date.now()) / 3600000)) : 0))

onMounted(() => { if (dati.giocatore !== state.player) carica(state.player) })

async function cambia() {
  await accendi(!dati.attivo)
  codice.value = null; messaggio.value = ''
  await riavviaAmici()
}

async function invita() {
  messaggio.value = ''; occupato.value = true
  try {
    const chiave = casuale(32)
    const c = await creaCodice(chiave)
    if (!aggiungi(chiave)) throw new Error('hai già tutti gli amici che si possono avere')
    codice.value = { testo: c.codice, scade: c.scade }
    aggiungiPonte(chiave)
  } catch (e) { messaggio.value = e.message } finally { occupato.value = false }
}

async function riscatta() {
  messaggio.value = ''; occupato.value = true
  try {
    const chiave = await riscattaCodice(pulito.value)
    if (!aggiungi(chiave)) throw new Error('questo amico c\'è già, o hai già tutti gli amici che si possono avere')
    scritto.value = ''
    aggiungiPonte(chiave)
    messaggio.value = 'Fatto. Il nome dell\'amico comparirà appena i due telefoni sono accesi insieme.'
  } catch (e) { messaggio.value = e.message } finally { occupato.value = false }
}

async function manda() {
  const testo = `Il codice per giocare con ${chi.value} su Educagioco: ${codice.value.testo} (vale ${scadeTra.value} ore)`
  try { if (navigator.share) return await navigator.share({ text: testo }); await navigator.clipboard.writeText(testo); messaggio.value = 'Copiato.' } catch { /* annullato */ }
}

function toglila(a) {
  if (daTogliere.value !== a.chiave) { daTogliere.value = a.chiave; return }
  togliPonte(a.chiave); togli(a.chiave); daTogliere.value = null
}
</script>

<template>
  <div class="carta amici-carta" data-flag="amici">
    <span class="ico">👫</span>
    <b>Amici online di {{ chi }}</b>
    <i v-if="!dati.attivo">{{ PASSO.corpo }}</i>
    <i v-else>Può invitare gli amici e ricevere inviti. Vede solo quelli con cui scambiate un codice.</i>

    <button class="bottone" :class="{ chiaro: dati.attivo }" type="button" data-azione="amici-attiva" @click="cambia">
      {{ dati.attivo ? 'Spegni gli amici online' : 'Attiva gli amici online' }}
    </button>

    <template v-if="dati.attivo">
      <ul v-if="dati.amici.length" class="elenco" data-amici-elenco>
        <li v-for="a in dati.amici" :key="a.chiave">
          <b>{{ a.nome || 'in attesa che si colleghi…' }}</b>
          <button class="bottone chiaro" type="button" data-azione="amici-togli" @click="toglila(a)">
            {{ daTogliere === a.chiave ? 'Sicuro? Tocca ancora' : 'Togli' }}</button>
        </li>
      </ul>

      <div v-if="codice" class="codice" data-amici-codice>
        <span class="grande">{{ codice.testo }}</span>
        <small>Mandalo al genitore dell'amico: vale {{ scadeTra }} {{ scadeTra === 1 ? 'ora' : 'ore' }} e si usa una volta sola.</small>
        <button class="bottone chiaro" type="button" @click="manda">Manda il codice</button>
      </div>

      <div class="riga">
        <button class="bottone" type="button" data-azione="amici-invita" :disabled="occupato || pieno" @click="invita">Invita un amico</button>
      </div>
      <form class="riga" @submit.prevent="riscatta">
        <input v-model="scritto" class="nome" type="text" inputmode="text" autocapitalize="characters" autocomplete="off" spellcheck="false"
               maxlength="5" placeholder="codice dell'amico" aria-label="codice dell'amico" data-amici-codice-input>
        <button class="bottone chiaro" type="submit" data-azione="amici-riscatta" :disabled="occupato || pieno || pulito.length !== 5">Ho un codice</button>
      </form>
      <p v-if="messaggio" class="mini" data-amici-messaggio>{{ messaggio }}</p>
    </template>
  </div>
</template>

<style scoped>
.amici-carta { display:flex; flex-direction:column; align-items:stretch; gap:10px; text-align:left }
.elenco { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px }
.elenco li { display:flex; align-items:center; gap:10px; justify-content:space-between }
.codice { display:flex; flex-direction:column; align-items:center; gap:6px; padding:10px; border-radius:12px; background:#fffbe8 }
.grande { font-size:34px; font-weight:900; letter-spacing:6px }
.riga { display:flex; gap:8px }
.riga .nome { flex:1; min-width:0; text-transform:uppercase }
</style>

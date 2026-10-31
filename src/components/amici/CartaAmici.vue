<script setup>
// Gli amici nella zona dei grandi (docs/core/amici.md): acceso o spento per il bambino di turno, gli amici che ha, «Invita un amico»
// (un codice di 5 lettere che vale due ore) e «Ho un codice». Fare amicizia fra bambini è una cosa da genitori.
import { ref, computed, onMounted } from 'vue'
import { state, nomeCorrente } from '../../store/profile.js'
import { dati, carica, accendi, togli } from '../../store/amici.js'
import { riavviaAmici } from '../../amici/avvio.js'
import { togliPonte } from '../../amici/servizio.js'
import { usaAbbina } from '../../amici/abbina.js'
import { PASSO } from '../../amici/testi.js'

const chi = computed(() => nomeCorrente() || 'questo bambino')
const { codice, scritto, messaggio, occupato, pieno, pulito, scadeTra, invita, riscatta, manda: mandaA, azzera } = usaAbbina()
const manda = () => mandaA(chi.value)
const daTogliere = ref(null)

onMounted(() => { if (dati.giocatore !== state.player) carica(state.player) })

async function cambia() {
  await accendi(!dati.attivo)
  azzera()
  await riavviaAmici()
}

function toglila(a) {
  if (daTogliere.value !== a.chiave) { daTogliere.value = a.chiave; return }
  togli(a.chiave); togliPonte(a.chiave); daTogliere.value = null
}
</script>

<template>
  <div class="carta amici-carta" data-flag="amici">
    <div class="testa"><span class="ico">👫</span><b>Amici online di {{ chi }}</b></div>
    <i v-if="!dati.attivo">Giocare insieme a un amico, ognuno sul suo telefono. Spento finché non lo accendi tu.</i>
    <i v-else>Può invitare gli amici e ricevere inviti. Vede solo quelli con cui scambiate un codice.</i>
    <details v-if="!dati.attivo" class="come"><summary>Come funziona</summary><p>{{ PASSO.corpo }}</p></details>

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
.carta.amici-carta { display:flex; flex-direction:column; align-items:stretch; gap:10px; text-align:left }
.testa { display:flex; align-items:center; gap:12px }
.testa .ico { font-size:22px }
.testa b { font-size:14.5px; font-weight:600; color:var(--inchiostro) }
.carta > i { font-style:normal; font-size:12.5px; line-height:1.45; color:var(--grigio) }
.come summary { font-size:13px; font-weight:600; color:var(--inchiostro); cursor:pointer; min-height:32px }
.come p { margin:4px 0 0; font-size:12.5px; line-height:1.45; color:var(--grigio) }
.elenco { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px }
.elenco li { display:flex; align-items:center; gap:10px; justify-content:space-between }
.codice { display:flex; flex-direction:column; align-items:center; gap:6px; padding:10px; border-radius:var(--raggio-piccolo); background:var(--tessera) }
.grande { font-size:34px; font-weight:700; letter-spacing:6px; color:var(--inchiostro) }
.riga { display:flex; gap:8px }
.riga .nome { flex:1; min-width:0; text-transform:uppercase }
</style>

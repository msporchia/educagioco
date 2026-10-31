<script setup>
// «Aggiungi un amico» dalla lista degli amici, dopo il codice dei genitori (docs/core/amici.md): a tutto schermo come la sala della
// sfida, con due strade, «Do il mio codice» e «Ho un codice». I conti sono quelli della carta dei grandi (amici/abbina.js).
import { ref, computed, onMounted } from 'vue'
import { state, nomeCorrente } from '../../store/profile.js'
import { dati, carica } from '../../store/amici.js'
import { usaAbbina } from '../../amici/abbina.js'
import Barra from '../Barra.vue'

defineEmits(['chiudi'])
const chi = computed(() => nomeCorrente() || 'questo bambino')
const { codice, scritto, messaggio, occupato, fatto, pieno, pulito, scadeTra, invita, riscatta, manda } = usaAbbina()
const modo = ref(null)                // null | 'do' | 'ho'

onMounted(() => { if (dati.giocatore !== state.player) carica(state.player) })

function dai() { modo.value = 'do'; invita() }
const indietro = () => { modo.value = null; codice.value = null; scritto.value = ''; messaggio.value = ''; fatto.value = false }
</script>

<template>
  <div class="schermo pulito aggiungi-amico" data-aggiungi-amico>
    <Barra titolo="Aggiungi un amico" :audio="false" @indietro="$emit('chiudi')" />
    <div class="colonna">
      <template v-if="!modo">
        <h2>👫 Un amico nuovo per {{ chi }}</h2>
        <p class="mini">Uno dei due telefoni dà un codice di cinque lettere, l'altro lo scrive. Vale due ore e si usa una volta sola.</p>
        <p v-if="pieno" class="mini" data-amici-messaggio>{{ chi }} ha già tutti gli amici che si possono avere.</p>
        <button class="bottone" type="button" data-azione="amici-invita" :disabled="pieno" @click="dai">Do il mio codice</button>
        <button class="bottone chiaro" type="button" data-azione="amici-ho-codice" :disabled="pieno" @click="modo = 'ho'">Ho un codice</button>
      </template>

      <template v-else-if="modo === 'do'">
        <h2>Il codice da dare all'amico</h2>
        <p v-if="occupato" class="mini">Lo preparo…</p>
        <div v-if="codice" class="codice" data-amici-codice>
          <span class="grande">{{ codice.testo }}</span>
          <small>Mandalo al genitore dell'amico: vale {{ scadeTra }} {{ scadeTra === 1 ? 'ora' : 'ore' }} e si usa una volta sola.
            L'amico comparirà nella lista appena i due telefoni sono accesi insieme.</small>
          <button class="bottone chiaro" type="button" @click="manda(chi)">Manda il codice</button>
        </div>
        <p v-if="messaggio" class="mini" data-amici-messaggio>{{ messaggio }}</p>
        <button class="bottone" type="button" data-azione="amici-fatto" @click="$emit('chiudi')">Fatto</button>
        <button class="bottone chiaro" type="button" @click="indietro">Indietro</button>
      </template>

      <template v-else>
        <h2>Il codice dell'amico</h2>
        <form v-if="!fatto" class="colonna" @submit.prevent="riscatta">
          <input v-model="scritto" class="campo-codice" type="text" inputmode="text" autocapitalize="characters" autocomplete="off" spellcheck="false"
                 maxlength="5" placeholder="KXRNM" aria-label="codice dell'amico" data-amici-codice-input>
          <button class="bottone" type="submit" data-azione="amici-riscatta" :disabled="occupato || pulito.length !== 5">Aggiungi</button>
        </form>
        <p v-if="messaggio" class="mini" data-amici-messaggio>{{ messaggio }}</p>
        <button v-if="fatto" class="bottone" type="button" data-azione="amici-fatto" @click="$emit('chiudi')">Fatto</button>
        <button class="bottone chiaro" type="button" @click="indietro">Indietro</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.colonna { width:min(var(--colonna),100%); margin:0 auto; display:flex; flex-direction:column; align-items:stretch; gap:12px; text-align:center }
.aggiungi-amico > .colonna { padding:16px }
h2 { margin:6px 0 0 }
.mini { margin:0 }
.codice { display:flex; flex-direction:column; align-items:center; gap:8px; padding:14px; border-radius:var(--raggio); background:var(--superficie); box-shadow:var(--ombra) }
.codice small { color:var(--grigio); line-height:1.4 }
.grande { font-size:40px; font-weight:700; letter-spacing:8px; color:var(--inchiostro); user-select:all }
.campo-codice { font-size:30px; font-weight:700; letter-spacing:8px; text-align:center; text-transform:uppercase; padding:10px;
                border:1px solid var(--filo); border-radius:var(--raggio-piccolo); background:var(--superficie); color:var(--inchiostro) }
</style>

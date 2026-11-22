<script setup>
// Entra nella classe: le 4 cifre della lavagna, controllato col servizio. docs/scuola/bambini.md
import { ref, computed, onMounted } from 'vue'
import { controllaCodice } from '../../comune/rete.js'
import { pulisciCodice, codiceCompleto } from '../giro.js'
import ProvaComputer from './ProvaComputer.vue'

const emit = defineEmits(['entra', 'senza'])
const codice = ref('')
const errore = ref('')
const controllo = ref(false)
const campo = ref(null)
const provaPc = ref(false)          // la prova del computer, prima della lezione (docs/scuola/prova-computer.md)
const pronto = computed(() => codiceCompleto(codice.value) && !controllo.value)

function scrivi(e) {
  codice.value = pulisciCodice(e.target.value)
  e.target.value = codice.value          // il campo mostra subito la versione pulita, solo cifre
  errore.value = ''
}

async function entra() {
  if (!pronto.value) return
  controllo.value = true
  errore.value = ''
  const { esito } = await controllaCodice(codice.value)
  controllo.value = false
  if (esito === 'ok') return emit('entra', codice.value)
  errore.value = esito === 'no' ? 'Questo codice non c\'è: controlla la lavagna' : 'Non riesco a collegarmi: chiedi alla maestra'
}

onMounted(() => campo.value?.focus())
</script>

<template>
  <form class="centro codice" @submit.prevent="entra">
    <h2>Scrivi il codice della lavagna</h2>
    <input ref="campo" class="campo" data-codice :value="codice" maxlength="4" inputmode="numeric"
           autocomplete="off" autocorrect="off" spellcheck="false"
           aria-label="il codice della lezione" @input="scrivi">
    <button type="submit" class="bottone" data-entra :disabled="!pronto">{{ controllo ? 'Controllo…' : 'Entra' }}</button>
    <p v-if="errore" class="errore" data-codice-errore>{{ errore }}</p>
    <button type="button" class="link senza" data-azione="senza-lezione" @click="emit('senza')">Senza lezione (per la maestra)</button>
    <button type="button" class="link prova" data-azione="prova-pc" @click="provaPc = true">Prova questo computer (per la maestra)</button>
    <ProvaComputer v-if="provaPc" @chiudi="provaPc = false; campo?.focus()" />
  </form>
</template>

<style scoped>
.codice h2 { font-size: 22px }
.campo {
  width: 100%; max-width: 320px; padding: 14px 10px; text-align: center;
  font: inherit; font-size: 44px; font-weight: 600; letter-spacing: .3em; text-indent: .3em;
  color: var(--inchiostro); background: var(--superficie); border: 2px solid var(--filo); border-radius: var(--raggio);
  outline: none;
}
.campo:focus { border-color: var(--accento) }
.codice .bottone { min-width: 180px; font-size: 18px; padding: 14px 28px }
.errore { font-size: 17px; color: var(--inchiostro); max-width: var(--colonna) }
.senza { margin-top: 24px; font-size: 13px; opacity: .8 }
.prova { margin-top: 4px; font-size: 13px; opacity: .8 }
</style>

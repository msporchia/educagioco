<script setup>
// «Come funziona»: fuori dal codice di casa apposta. Vedi docs/genitori/guide.md.
import { ref, onMounted } from 'vue'
import Barra from '../components/Barra.vue'
import Blocchi from './Blocchi.vue'
import Elenco from './Elenco.vue'
import { GUIDE, guida } from './contenuti.js'
import { raccogli } from './stato.js'
import { INDIRIZZO, condividi } from './aiuto.js'

defineEmits(['vai'])

const aperta = ref(null)
const esito = ref('')

onMounted(() => { const q = raccogli(); if (q) aperta.value = guida(q) })

async function mandaIlLink () {
  const r = await condividi({ url: INDIRIZZO, titolo: 'Educagioco' })
  esito.value = r.come === 'copiato' ? 'Indirizzo copiato: incollalo dove vuoi.'
    : r.come === 'niente' ? INDIRIZZO : ''
}
</script>

<template>
  <div class="schermo">
    <Barra :titolo="aperta ? aperta.titolo : 'Come funziona'" :audio="false"
           @indietro="aperta ? (aperta = null, esito = '') : $emit('vai','home')" />

    <div class="corpo">
      <template v-if="!aperta">
        <p class="testo intro">Cos'è questo gioco, chi l'ha fatto, e le manopole che
          sono per te e non per lui. In ordine di quanto serve: le prime si leggono
          prima di cominciare, le altre quando qualcosa non va bene.</p>

        <Elenco :guide="GUIDE" @apri="aperta = $event" />

        <button class="manda" data-azione="manda-link" @click="mandaIlLink">
          <b>📤 Manda il link a qualcuno</b>
          <i>{{ INDIRIZZO.replace(/^https?:\/\//, '') }}</i>
        </button>
        <p v-if="esito" class="mini esito">{{ esito }}</p>
      </template>

      <template v-else>
        <Blocchi :blocchi="aperta.blocchi" />
        <button class="bottone chiaro torna" @click="aperta = null; esito = ''">
          ← le altre guide</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.corpo { flex:1; overflow-y:auto; padding:12px 14px 26px;
         display:flex; flex-direction:column; gap:10px;
         width:min(560px,100%); margin:0 auto }
.intro { max-width:none; margin-bottom:4px }

.manda { margin-top:8px; display:flex; flex-direction:column; gap:3px; padding:13px;
         border-radius:16px; background:#ffffffb0; box-shadow:0 2px 8px #8593a81f }
.manda b { font-size:14.5px; color:var(--viola-scuro) }
.manda i { font-size:12px; color:var(--tenue); font-style:normal;
           overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
.esito { margin-top:2px; -webkit-user-select:text; user-select:text;
         -webkit-touch-callout:default }
.torna { align-self:center; margin-top:12px; padding:11px 26px; font-size:15px }
</style>

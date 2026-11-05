<script setup>
// Il primo avvio e ogni bambino aggiunto: un modulo solo (`primo` cambia
// due parole e la via d'uscita). Vedi docs/genitori/manopola.md.
import { ref, computed } from 'vue'
import { creaGiocatore } from '../store/profile.js'
import { PERSONE } from '../grafica/atlante-fattoria.js'
import SceltaAspetto from './SceltaAspetto.vue'
import VeloGuide from '../guide/VeloGuide.vue'
import { ricordaScelta, AMICI_DI_BASE } from '../store/amici.js'
import { PASSO } from '../amici/testi.js'
import { MESI, etaDiClasse, inClasse, nascitaValida, dentroGliEstremi } from '../data/nascita.js'

const props = defineProps({
  primo: { type: Boolean, default: true },   // false = si aggiunge un fratello dalle impostazioni
})
const emit = defineEmits(['fatto', 'lasciaStare'])

const nome = ref('')
const occupato = ref(false)
const aspetto = ref(PERSONE[0])   // preselezionato: non cambia cosa vede/sa, solo la faccia in mappa
const passo = ref(1)
const amici = ref(AMICI_DI_BASE)   // la domanda ai genitori: di base spento (docs/core/amici.md)
const leggiAmici = ref(false)
// mese e anno, solo sul telefono: l'età esce da lì e si tiene aggiornata da sola (docs/genitori/riordino.md)
const mese = ref('')
const annoNascita = ref('')
const ANNI_DISPONIBILI = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i)
const nascita = computed(() => {
  const n = { m: Number(mese.value), a: Number(annoNascita.value) }
  return mese.value !== '' && annoNascita.value !== '' && nascitaValida(n) ? n : null
})
const etaDaData = computed(() => (nascita.value ? etaDiClasse(nascita.value) : null))
const anni = computed(() => (etaDaData.value == null ? null : dentroGliEstremi(etaDaData.value)))
const spiegami = ref(false)

const pulito = computed(() => nome.value.trim())

function avanti() {
  if (!pulito.value) return
  passo.value = 2
}

async function entra() {
  if (!pulito.value || anni.value == null || occupato.value) return
  occupato.value = true
  // entra: true anche aggiungendo un fratello: si aggiunge un bambino perché vuole giocare adesso
  try {
    ricordaScelta(amici.value)   // il profilo non esiste ancora: la risposta la prende il suo primo `carica`
    await creaGiocatore(pulito.value, true, anni.value, aspetto.value, nascita.value)
    emit('fatto')
  } finally { occupato.value = false }
}
</script>

<template>
  <div class="schermo benvenuto pulito">
    <div v-if="passo === 1" class="centro">
      <span class="em">{{ primo ? '👋' : '➕' }}</span>
      <h1 v-if="primo">Ciao!<br><span>Come ti chiami?</span></h1>
      <h1 v-else>Chi si aggiunge?<br><span>Come si chiama?</span></h1>

      <form @submit.prevent="avanti">
        <input v-model="nome" class="nome" type="text" maxlength="20"
               autocomplete="off" autocapitalize="words" spellcheck="false"
               :placeholder="primo ? 'il tuo nome' : 'il nome'"
               :aria-label="primo ? 'il tuo nome' : 'il nome'">
        <SceltaAspetto :scelto="aspetto" data-scelta="aspetto" @scegli="aspetto = $event" />
        <button class="via" type="submit" :disabled="!pulito">Avanti</button>
      </form>

      <p v-if="primo" class="mini">Lo possono cambiare mamma e papà quando vogliono.</p>

      <button v-if="primo" class="che-roba" type="button"
              data-azione="cos-e" @click="spiegami = true">
        ❓ Cos'è questo gioco? Chi l'ha fatto? ›</button>
      <p v-else class="mini">Parte da zero, coi suoi progressi separati dagli altri.</p>
      <button v-if="!primo" class="indietro" type="button"
              data-azione="lascia-stare" @click="emit('lasciaStare')">← lascia stare</button>
    </div>

    <div v-else class="centro fasce">
      <span class="em">🎂</span>
      <h1>{{ pulito }}<br><span>mese e anno di nascita</span></h1>

      <div class="nascita-domanda" data-nascita-domanda>
        <div class="selezioni">
          <select v-model="mese" aria-label="mese di nascita" data-nascita-mese><option value="">mese</option><option v-for="(m, i) in MESI" :key="m" :value="i">{{ m }}</option></select>
          <select v-model="annoNascita" aria-label="anno di nascita" data-nascita-anno><option value="">anno</option><option v-for="a in ANNI_DISPONIBILI" :key="a" :value="a">{{ a }}</option></select>
        </div>
        <p v-if="etaDaData != null" class="mini" data-nascita-eta>{{ inClasse(nascita).replace(/^./, c => c.toUpperCase()) }}.</p>
        <p v-else-if="nascita" class="mini" data-nascita-futura>Questa data deve ancora arrivare.</p>
        <p v-else class="mini">Serve a scegliere giochi e domande adatti. Si cambia quando si vuole, dalle impostazioni.</p>
      </div>

      <!-- una domanda per i grandi, preselezionata sulla risposta prudente: docs/core/amici.md -->
      <div class="amici-domanda" data-amici-domanda>
        <b>👫 {{ PASSO.titolo }}</b>
        <p v-if="!leggiAmici" class="mini">Invitare un amico a giocare, solo con chi i grandi abbinano con un codice, in alcuni giochi.
          <button type="button" class="leggi" data-azione="amici-leggi" @click="leggiAmici = true">Leggi tutto</button></p>
        <p v-else class="mini">{{ PASSO.corpo }}</p>
        <div class="scelta" role="group" aria-label="Amici online">
          <button type="button" :class="{ su: !amici }" :aria-pressed="!amici" data-azione="amici-piu-tardi" @click="amici = false">{{ PASSO.piuTardi }}</button>
          <button type="button" :class="{ su: amici }" :aria-pressed="amici" data-azione="amici-attiva" @click="amici = true">{{ PASSO.attiva }}</button>
        </div>
      </div>

      <button class="via in-fondo" type="button" :disabled="occupato || anni == null"
              data-azione="si-gioca" @click="entra">Si gioca!</button>
      <button class="indietro" type="button" @click="passo = 1">← cambia il nome</button>
    </div>

    <VeloGuide v-if="spiegami" @chiudi="spiegami = false" />
  </div>
</template>

<style scoped>
.benvenuto .centro { display:flex; flex-direction:column; align-items:center; gap:18px; padding:24px }
/* una colonna che scorre: «Leggi tutto» degli amici può allungarla */
.benvenuto .centro.fasce { gap:12px; padding:18px 14px 28px; justify-content:flex-start;
                           min-height:100%; overflow-y:auto }
.em { font-size:64px; line-height:1 }
.fasce .em { font-size:40px }
h1 { text-align:center; margin:0 }
.fasce h1 { font-size:25px }
form { display:flex; flex-direction:column; align-items:center; gap:14px; width:min(320px, 82vw) }
.nome {
  width:100%; padding:15px 18px; border:none; border-radius:16px;
  font-size:22px; text-align:center; font-family:inherit;
  background:var(--superficie); color:var(--inchiostro); box-shadow:var(--ombra), inset 0 0 0 1px var(--filo);
}
.nome:focus { outline:2px solid var(--inchiostro); outline-offset:2px }
.via {
  padding:14px 34px; border:none; border-radius:999px; font-size:18px; font-weight:600;
  font-family:inherit; color:#fff; cursor:pointer;
  background:var(--inchiostro); box-shadow:0 4px 14px #1f243333;
}
.via:disabled { opacity:.45; box-shadow:none }
.via.in-fondo { position:sticky; bottom:6px; z-index:5 }
.mini { opacity:.75; font-size:14px; text-align:center; margin:0 }
.indietro { background:none; border:none; font-family:inherit; font-size:14px;
            color:var(--grigio); padding:4px 10px; cursor:pointer }

.che-roba { background:var(--superficie); border:0; border-radius:999px;
            font-family:inherit; font-size:14px; font-weight:600;
            color:var(--inchiostro); padding:11px 19px; cursor:pointer;
            margin-top:-2px; box-shadow:inset 0 0 0 1px var(--filo) }
.che-roba:active { transform:translateY(1px) }

.nascita-domanda, .amici-domanda { width:100%; max-width:400px }
.nascita-domanda, .amici-domanda { display:flex; flex-direction:column; gap:6px; padding:9px 12px; border-radius:var(--raggio);
                                    background:var(--superficie); box-shadow:var(--ombra); text-align:left }
.nascita-domanda p, .amici-domanda p { margin:0; text-align:left }
.amici-domanda .leggi { border:0; background:none; color:inherit; text-decoration:underline; font:inherit; padding:0 }
.amici-domanda .scelta { display:flex; gap:8px }
.amici-domanda .scelta button { flex:1; min-height:44px; border:1px solid var(--filo); border-radius:var(--raggio-piccolo); background:var(--superficie); font:inherit; font-weight:600; color:var(--inchiostro) }
.amici-domanda .scelta .su { border-color:var(--inchiostro); background:var(--inchiostro); color:#fff }
.nascita-domanda .selezioni { display:flex; gap:8px }
.nascita-domanda select { flex:1; min-height:44px; padding:6px 10px; border-radius:var(--raggio-piccolo); border:1px solid var(--filo); background:var(--superficie); font:inherit }
</style>

<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA MACCHINA DELLE SORPRESE

   Sta in un angolo della stanza e la si tocca: è lì che finiscono le
   monete che avanzano. Una capsula per volta, dalla serie a cui si è
   arrivati, e mai un doppione — esce sempre qualcosa che non si ha. La
   prima è offerta dalla casa, perché una macchina di cui non hai mai
   visto l'effetto non la provi.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onUnmounted } from 'vue'
import { state, apriCapsula, serieOra, finite, miePezzi,
         costoCapsula } from '../store/profile.js'
import { SERIE, POSTI, mancanti } from '../data/capsule.js'
import { suono } from '../audio.js'

const emit = defineEmits(['avviso'])

const sorpresa = ref(null)       // il pezzo appena uscito
let timerSorpresa = 0

const serie = computed(() => serieOra())
const presi = computed(() => miePezzi(serie.value).length)
const prezzo = computed(() => costoCapsula())
const puoAprire = computed(() => !finite() && state.profile.coins >= prezzo.value)

function giraLaManovella() {
  const pezzo = apriCapsula()
  if (!pezzo) return emit('avviso', 'Servono ' + prezzo.value + ' 🪙 per una capsula')
  suono.livello()
  sorpresa.value = pezzo
  clearTimeout(timerSorpresa)
  timerSorpresa = setTimeout(() => (sorpresa.value = null), 2600)
}

onUnmounted(() => clearTimeout(timerSorpresa))
</script>

<template>
  <h2>La macchina delle sorprese</h2>

  <template v-if="!finite()">
    <div class="macchina">
      <div class="serie-nome">{{ serie.emoji }} {{ serie.nome }}</div>
      <button class="capsula" :disabled="!puoAprire" @click="giraLaManovella">
        <span class="uovo">🥚</span>
        <span class="prezzo">{{ prezzo ? '🪙 ' + prezzo : 'la prima è in regalo!' }}</span>
      </button>
      <div class="conta">{{ presi }} di {{ serie.pezzi.length }}</div>
      <div class="asta"><i :style="{ width: (presi / serie.pezzi.length * 100) + '%' }"></i></div>
      <p class="mini">Esce sempre un accessorio che non hai: doppioni mai.</p>
    </div>

    <div class="vetrina">
      <div v-for="p in serie.pezzi" :key="p.e" class="pezzo"
           :class="{ mio: state.profile.accessori.includes(p.e) }">
        <span class="e">{{ state.profile.accessori.includes(p.e) ? p.e : '❔' }}</span>
        <span class="n">{{ state.profile.accessori.includes(p.e) ? p.nome : '???' }}</span>
      </div>
    </div>
  </template>
  <p v-else class="testo">
    Hai preso tutti i {{ SERIE.length * SERIE[0].pezzi.length }} accessori.
    Non c'è più niente da estrarre — c'è solo da vestirli bene.
  </p>

  <div class="titolino">Le serie</div>
  <div class="serie-elenco">
    <div v-for="(s, i) in SERIE" :key="s.id" class="serie-riga"
         :class="{ fatta: !mancanti(s, state.profile.accessori).length,
                   chiusa: i > state.profile.serie }">
      <span class="e">{{ s.emoji }}</span>
      <b>{{ s.nome }}</b>
      <span class="q">
        {{ i > state.profile.serie ? '🔒 ' + s.costo + ' 🪙 a capsula'
           : miePezzi(s).length + '/' + s.pezzi.length }}</span>
    </div>
  </div>

  <!-- il pezzo appena uscito, grande in mezzo allo schermo -->
  <div v-if="sorpresa" class="colpo" @click="sorpresa = null">
    <div class="carta-sorpresa">
      <span class="e">{{ sorpresa.e }}</span>
      <b>{{ sorpresa.nome }}</b>
      <i>{{ POSTI.find(p => p.k === sorpresa.posto).nome.toLowerCase() }}</i>
    </div>
  </div>
</template>

<style scoped>
.titolino { font-size:12px; letter-spacing:1.5px; text-transform:uppercase;
            color:var(--tenue); font-weight:800; margin-top:4px }

.macchina { background:var(--carta); border-radius:22px; padding:12px 16px 14px;
            width:100%; max-width:430px; display:flex; flex-direction:column;
            align-items:center; gap:6px; box-shadow:0 5px 0 #dde3ea, 0 10px 22px #8593a822 }
.serie-nome { font-size:16px; font-weight:900; color:var(--viola-scuro) }
.capsula { background:linear-gradient(180deg,var(--viola),var(--viola-scuro)); color:#fff;
           border-radius:18px; padding:10px 26px; display:flex; flex-direction:column;
           align-items:center; gap:2px; box-shadow:0 5px 0 #2c4283 }
.capsula:active { transform:translateY(2px); box-shadow:0 3px 0 #2c4283 }
.capsula:disabled { opacity:.45 }
.capsula .uovo { font-size:40px; animation:tentenna 2.6s ease-in-out infinite }
@keyframes tentenna { 0%,88%,100%{transform:rotate(0)} 92%{transform:rotate(-9deg)}
                      96%{transform:rotate(9deg)} }
.capsula .prezzo { font-size:13px; font-weight:900 }
.conta { font-size:12px; font-weight:800; color:var(--tenue) }
.asta { width:80%; height:8px; border-radius:5px; background:#e4e9f0; overflow:hidden }
.asta i { display:block; height:100%; border-radius:5px; transition:width .5s ease;
          background:linear-gradient(90deg,var(--viola),var(--rosa)) }

.vetrina { width:100%; max-width:430px; display:grid; gap:7px;
           grid-template-columns:repeat(auto-fill,minmax(72px,1fr)) }
.pezzo { background:#ffffff88; border-radius:14px; padding:7px 3px 5px; text-align:center;
         display:flex; flex-direction:column; align-items:center; gap:1px }
.pezzo.mio { background:var(--carta); box-shadow:0 3px 0 #dde3ea }
.pezzo .e { font-size:26px; opacity:.35 }
.pezzo.mio .e { opacity:1 }
.pezzo .n { font-size:9.5px; font-weight:800; color:var(--tenue) }

.serie-elenco { width:100%; max-width:430px; display:flex; flex-direction:column; gap:5px }
.serie-riga { display:flex; align-items:center; gap:8px; background:#ffffff88;
              border-radius:12px; padding:6px 11px; font-size:13px; color:var(--tenue) }
.serie-riga b { color:var(--viola-scuro); flex:1; text-align:left }
.serie-riga .e { font-size:19px }
.serie-riga .q { font-weight:900; font-size:11.5px }
.serie-riga.fatta { background:#dff5e4 }
.serie-riga.chiusa { opacity:.55 }

/* il pezzo appena uscito: sopra tutto, e si toglie toccando */
.colpo { position:fixed; inset:0; z-index:60; display:flex; align-items:center;
         justify-content:center; background:#1f2a3a55 }
.carta-sorpresa { background:var(--carta); border-radius:26px; padding:22px 34px;
                  display:flex; flex-direction:column; align-items:center; gap:3px;
                  box-shadow:0 14px 40px #1f2a3a55; animation:sbuca .5s ease-out }
.carta-sorpresa .e { font-size:74px }
.carta-sorpresa b { font-size:19px; font-weight:900; color:var(--viola-scuro) }
.carta-sorpresa i { font-style:normal; font-size:12px; color:var(--tenue) }
@keyframes sbuca { 0%{transform:scale(.3) rotate(-12deg);opacity:0}
                   60%{transform:scale(1.08) rotate(3deg);opacity:1}
                   100%{transform:scale(1) rotate(0)} }
</style>

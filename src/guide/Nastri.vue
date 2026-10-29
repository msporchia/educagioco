<script setup>
// I nastri della home: vedi docs/genitori/guide.md e docs/genitori/cestino-e-posta.md.
import { ref, computed, onMounted } from 'vue'
import { piattaforma, installata, serveIlNastro } from './aiuto.js'
import { daAprire } from './stato.js'
import { versioneNuova, aggiornando, aggiornaOra, lasciaStare, inMega } from '../aggiornamento.js'
import { daLeggere } from '../store/posta.js'
import { daLeggere as novitaDaLeggere } from './novita-bambini.js'
import { novitaLette } from '../store/profile.js'
import { inCasa } from '../data/portata-giochi.js'
import { load, save, flush } from '../store/storage.js'

const emit = defineEmits(['vai'])

const CHIAVE = 'nastro-installa'   // fuori dai profili; dentro un oggetto (load() scarta un `true` nudo)
const chiuso = ref(true)         // finché non si è letto, non si mostra niente

const dentro = installata()
const dove = piattaforma()
const mostraInstalla = computed(() => serveIlNastro({ dentro, dove, chiuso: chiuso.value }))

onMounted(async () => {
  const r = await load(CHIAVE)
  chiuso.value = !!r?.chiuso
})

// flush() subito: chi chiude il nastro spesso chiude anche l'app un attimo dopo
async function nonMeLoDire () {
  chiuso.value = true
  save(CHIAVE, { chiuso: true })
  await flush()
}

function spiegami () {
  daAprire.value = 'installare'
  emit('vai', 'guide')
}

function chiamaUnGrande () { emit('vai', 'genitori') }

// un solo cartello per l'aggiornamento (docs/core/aggiornamento.md): la proposta, i passi e gli intoppi
const questa = __VERSIONE__
const ag = computed(() => aggiornando.value || {})
const quota = computed(() => ag.value.totale ? Math.min(1, (ag.value.presi || 0) / ag.value.totale) : null)
const guasto = computed(() => ['muto', 'interrotto', 'vecchia'].includes(ag.value.fase))
const conto = computed(() => `${inMega(ag.value.presi)}${ag.value.totale ? ' di ' + inMega(ag.value.totale) : ''} MB`)
const frase = computed(() => {
  const a = ag.value, sito = a.sito?.etichetta
  switch (a.fase) {
    case 'chiedo': return { segno: '↻', titolo: 'Chiedo al sito che versione c\'è…' }
    case 'gia': return { segno: '✓', titolo: 'Hai già l\'ultima', riga: `È quella del ${questa.etichetta}: sul sito non ce n'è una più nuova.` }
    case 'scarico': return { segno: '⤓', titolo: 'Scarico la versione nuova', riga: `Quella del ${sito}. I progressi non si toccano.` }
    case 'pronta': return { segno: '✓', titolo: 'Fatto: riparto', riga: `Con la versione del ${sito}.` }
    case 'muto': return { segno: '📡', titolo: 'Il sito non risponde', riga: 'Forse sei senza connessione, o va troppo piano. Il gioco intanto funziona come prima.' }
    case 'interrotto': return { segno: '📡', titolo: 'Lo scaricamento si è fermato', riga: `Arrivati ${conto.value}, poi la connessione si è persa. Il gioco resta com'era.` }
    case 'vecchia': return { segno: '⏳', titolo: 'Il sito sta ancora cambiando versione', riga: `Dice di avere quella del ${sito}, ma mi ha dato ancora quella di prima. Di solito si sistema in qualche minuto.` }
  }
  return null
})

const novita = computed(() => novitaDaLeggere(novitaLette(), inCasa).flatMap(g => g.voci))
const altre = computed(() => novita.value.length - 1)
</script>

<template>
  <div v-if="mostraInstalla || versioneNuova || aggiornando || daLeggere || novita.length" class="nastri">
    <button v-if="daLeggere" class="nastro posta" data-nastro="posta"
            data-azione="nastro-posta" @click="chiamaUnGrande">
      <span class="dentro">
        <b>📩 C'è un messaggio per la mamma o il papà</b>
        <i>Chiamali: si apre col loro codice</i>
      </span>
    </button>

    <button v-if="novita.length" class="nastro novita" data-nastro="novita"
            data-azione="nastro-novita" @click="emit('vai', 'novita')">
      <span class="dentro">
        <b>🌟 Novità nei giochi</b>
        <i>{{ novita[0].testo }}<template v-if="altre"> · {{
          altre === 1 ? 'e un\'altra' : `e altre ${altre}` }}</template></i>
      </span>
      <span class="freccia" aria-hidden="true">›</span>
    </button>

    <div v-if="mostraInstalla" class="nastro installa" data-nastro="installa">
      <button class="dentro" data-azione="nastro-installa" @click="spiegami">
        <b>📲 Mettilo sulla schermata del telefono</b>
        <i>Si apre come un'app e funziona anche senza internet — ti spiego come</i>
      </button>
      <button class="chiudi" aria-label="chiudi" data-azione="chiudi-nastro"
              @click="nonMeLoDire">✕</button>
    </div>

    <div v-if="versioneNuova || aggiornando" class="nastro nuovo" data-nastro="versione"
         :data-aggiorna="aggiornando ? '' : null" :data-fase="aggiornando ? ag.fase : null">
      <div class="dentro" aria-live="polite">
        <template v-if="frase">
          <b>{{ frase.segno }} {{ frase.titolo }}</b>
          <i v-if="frase.riga">{{ frase.riga }}</i>
          <template v-if="ag.fase === 'scarico'">
            <div class="barra" :class="{ vaga: quota === null }">
              <i :style="quota === null ? null : { width: Math.round(quota * 100) + '%' }"></i>
            </div>
            <i class="conto" data-scaricati>{{ conto }}</i>
          </template>
        </template>
        <template v-else>
          <b>✨ C'è una versione nuova</b>
          <i>È quella del {{ versioneNuova.etichetta }}: i progressi non si toccano</i>
        </template>
      </div>
      <button v-if="guasto" class="ora" data-azione="riprova" @click="aggiornaOra()">Riprova</button>
      <button v-else-if="!aggiornando" class="ora" data-azione="aggiorna" @click="aggiornaOra()">Aggiorna</button>
      <button v-if="aggiornando && ag.fase !== 'pronta'" class="chiudi" aria-label="chiudi"
              data-chiudi @click="lasciaStare()">✕</button>
    </div>
  </div>
</template>

<style scoped>
.nastri { display:flex; flex-direction:column; gap:7px; width:100%; max-width:var(--colonna) }
.nastro { display:flex; align-items:center; gap:6px; padding:9px 10px;
          border-radius:var(--raggio); text-align:left }
.nastro.novita { width:100%; background:#e6f7ec; color:#1f5f36;
                 cursor:pointer }
.nastro.novita .freccia { flex:none; font-size:20px; opacity:.6 }
.nastro.posta { width:100%; background:#eef4ff; color:#2c4283; cursor:pointer }
.nastro.posta .dentro { display:flex; flex-direction:column; gap:2px; min-width:0 }
.nastro .dentro { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px;
                  background:none; text-align:left; padding:0 }
.nastro b { font-size:13.5px; font-weight:600 }
.nastro i { font-style:normal; font-size:11.5px; line-height:1.35; opacity:.8 }

.installa { background:#e8f0ff; color:#2c4283 }
.installa .chiudi { flex:none; width:26px; height:26px; border-radius:50%;
                    background:#ffffff90; color:#2c4283; font-size:13px; font-weight:600 }

.nuovo { background:#fff3d6; color:#7a4b00 }
.nuovo .ora { flex:none; padding:8px 14px; border-radius:999px; font-size:13px; font-weight:600;
              background:var(--inchiostro); color:#fff }
.nuovo .chiudi { flex:none; width:26px; height:26px; border-radius:50%;
                background:#ffffff90; color:#7a4b00; font-size:13px; font-weight:600 }
.nuovo .barra { width:100%; height:10px; margin:5px 0 1px; border-radius:999px; overflow:hidden;
                background:#ffffffcc; box-shadow:inset 0 0 0 1px #e6cf9d }
.nuovo .barra i { display:block; height:100%; width:0; border-radius:999px; opacity:1;
                  background:linear-gradient(90deg,var(--arancio),var(--giallo)); transition:width .2s }
.nuovo .barra.vaga i { width:35%; animation:ag-vaga 1.3s ease-in-out infinite alternate }
@keyframes ag-vaga { from { transform:translateX(-10%) } to { transform:translateX(200%) } }
.nuovo .conto { font-weight:600; font-variant-numeric:tabular-nums }
.nuovo .ora:active { transform:scale(.97) }
</style>

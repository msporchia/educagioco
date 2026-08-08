<script setup>
/* ═══════════════════════════════════════════════════════════════════
   COSA SO — la tabella pitagorica dei propri progressi.

   Una casella per calcolo, colorata con la forza EFFICACE del motore:
   quella che cala da sola col tempo, non il numero di risposte giuste.
   Serve a rispondere alla domanda che il punteggio non risponde: non
   "quanto ho fatto bene stasera" ma "quali calcoli so e quali no".

   La tabella è simmetrica perché 6×8 e 8×6 sono lo stesso fatto e il
   motore li tiene su una chiave sola: è detto in fondo, perché un
   bambino che vede due caselle uguali se lo chiede.

   È una pagina di progressi, non un pezzo di partita: veste come
   l'albo e come la mappa dei pianeti — fondo chiaro, riquadri bianchi,
   e il tasto per uscire nella barra in cima, non in fondo alla pagina.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { state } from '../store/profile.js'
import { strength } from '../store/srs.js'

const props = defineProps({ tabelle: { type: Array, default: () => [] } })

const N = 10
const chiave = (a, b) => 'math:' + Math.min(a, b) + 'x' + Math.max(a, b)

/* letto e non creato: aprire la mappa non deve sporcare il profilo con
   55 elementi vuoti mai giocati */
const statoDi = (a, b) => state.profile.items[chiave(a, b)] || null

/* il momento in cui si è aperta la tavola: la forza efficace dipende da
   "adesso", e va letto una volta sola perché i colori non ballino */
const adesso = ref(Date.now())
const scelta = ref(null)

/* i colori sono quelli del tema, non altri quattro: il rosso è quello
   degli errori, il verde quello delle barre dei progressi */
const GRADI = [
  { id: 'nuovo',  eti: 'mai provato',   colore: '#e6eaf3' },
  { id: 'debole', eti: 'da ripassare',  colore: '#ef5f5f' },
  { id: 'quasi',  eti: 'quasi',         colore: '#ffb020' },
  { id: 'sicuro', eti: 'lo so',         colore: '#38c172' },
]

function grado(a, b) {
  const it = statoDi(a, b)
  if (!it || !it.seen) return GRADI[0]
  const s = strength(it, adesso.value)
  return s >= 4 ? GRADI[3] : s >= 2 ? GRADI[2] : GRADI[1]
}

const griglia = computed(() =>
  Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => {
    const a = i + 1, b = j + 1
    const g = grado(a, b)
    return { a, b, g, mia: !props.tabelle.length || props.tabelle.includes(a) || props.tabelle.includes(b) }
  })))

/* le tabelline di adesso: su fondo chiaro sbiadire le altre non basta a
   farle vedere, quindi si accendono anche i loro numeri di riga e colonna */
const mie = computed(() => new Set(props.tabelle))

const sicuri = computed(() =>
  griglia.value.flat().filter(c => c.a <= c.b && c.g.id === 'sicuro').length)
const totali = (N * (N + 1)) / 2                 // 55 caselle diverse, non 100
const quota = computed(() => Math.round((sicuri.value / totali) * 100) + '%')

const dettaglio = computed(() => {
  const c = scelta.value
  if (!c) return null
  const it = statoDi(c.a, c.b)
  return {
    a: c.a, b: c.b, ris: c.a * c.b, eti: c.g.eti, colore: c.g.colore,
    mai: !it || !it.seen,
    ok: it?.ok || 0, err: it?.err || 0,
    tempo: it?.t ? (it.t / 1000).toFixed(1).replace('.', ',') + ' s' : null,
  }
})
</script>

<template>
  <div class="mappa">
    <!-- la risposta corta, prima della tavola: quanti ne so su quanti -->
    <div class="testata">
      <div class="quanti" :class="{ zero: !sicuri }"><b>{{ sicuri }}</b><i>su {{ totali }}</i></div>
      <div class="chi">
        <b>Calcoli che sai</b>
        <div class="barretta"><i :style="{ width: quota }"></i></div>
        <p class="mini">Il colore dice come stai messo oggi: quello che non si
          ripassa torna indietro da solo.</p>
      </div>
    </div>

    <div class="riquadro">
      <div class="tavola">
        <div class="fila capo">
          <span class="ang">×</span>
          <span v-for="b in N" :key="'c' + b" class="capo-n"
                :class="{ mia: mie.has(b) }">{{ b }}</span>
        </div>
        <div v-for="(riga, i) in griglia" :key="'r' + i" class="fila">
          <span class="capo-n" :class="{ mia: mie.has(i + 1) }">{{ i + 1 }}</span>
          <button v-for="c in riga" :key="c.a + 'x' + c.b" class="cella"
                  :class="{ fuori: !c.mia, attiva: scelta && scelta.a === c.a && scelta.b === c.b }"
                  :style="{ background: c.g.colore }"
                  :aria-label="c.a + ' per ' + c.b + ': ' + c.g.eti"
                  @click="scelta = c"></button>
        </div>
      </div>

      <div class="legenda">
        <span v-for="g in GRADI" :key="g.id">
          <i :style="{ background: g.colore }"></i>{{ g.eti }}
        </span>
      </div>
    </div>

    <div class="riquadro dett" :class="{ vuoto: !dettaglio }">
      <template v-if="dettaglio">
        <b>{{ dettaglio.a }} × {{ dettaglio.b }} = {{ dettaglio.ris }}</b>
        <span class="pallino" :style="{ background: dettaglio.colore }"></span>
        <span class="eti">{{ dettaglio.mai ? 'non l\'hai ancora provato' : dettaglio.eti }}</span>
        <i v-if="!dettaglio.mai">{{ dettaglio.ok }} giuste · {{ dettaglio.err }} sbagliate<template
           v-if="dettaglio.tempo"> · {{ dettaglio.tempo }}</template></i>
      </template>
      <template v-else>Tocca una casella per vedere com'è andata</template>
    </div>

    <p class="mini nota">6 × 8 e 8 × 6 sono lo stesso calcolo: la tavola è uguale
      di qua e di là della diagonale.</p>
  </div>
</template>

<style scoped>
.mappa { display:flex; flex-direction:column; align-items:center; gap:11px;
         width:100%; max-width:420px; color:var(--testo) }
.mappa > * { flex:none }

/* ---- quanti ne so: la testata, come quella dell'albo ---- */
.testata { display:flex; align-items:center; gap:13px; width:100%; padding:12px 15px;
           border-radius:20px; background:linear-gradient(120deg,#e8f0ff,#fffffff0);
           box-shadow:0 5px 0 #dde3ea, 0 10px 22px #8593a822; text-align:left }
.quanti { flex:none; width:66px; height:66px; border-radius:50%; display:grid;
          place-content:center; text-align:center; line-height:1.05;
          background:linear-gradient(180deg,#4fd08a,#2ba45f); box-shadow:0 4px 0 #1d8a4d }
.quanti b { font-size:26px; font-weight:900; color:#fff }
.quanti i { font-style:normal; font-size:10.5px; font-weight:800; color:#ffffffdd }
/* nessun calcolo saputo ancora: un cerchio verde con dentro uno zero
   racconterebbe una cosa che non è successa */
.quanti.zero { background:linear-gradient(180deg,#c6cddd,#a7b1c6); box-shadow:0 4px 0 #93a0b8 }
.chi { flex:1; min-width:0 }
.chi > b { font-size:15px; font-weight:900; color:var(--viola-scuro) }
.chi .mini { text-align:left; margin-top:5px; line-height:1.35 }
.barretta { height:10px; border-radius:999px; background:#e7dcf7; overflow:hidden; margin-top:6px }
.barretta i { display:block; height:100%; border-radius:999px; transition:width .5s;
              background:linear-gradient(90deg,#38c172,#8de0a8) }

/* ---- la tavola, dentro un riquadro come le carte del resto ---- */
.riquadro { width:100%; background:var(--carta); border-radius:18px; padding:12px;
            box-shadow:0 4px 0 #e9ddf5 }
.tavola { width:100%; display:flex; flex-direction:column; gap:3px }
/* la prima colonna tiene i numeri di riga: "10" non ci sta in una casella */
.fila { display:grid; grid-template-columns:1.5fr repeat(10,1fr); gap:3px }
.capo-n, .ang { display:flex; align-items:center; justify-content:center;
                font-size:clamp(9px,2.6vw,13px); font-weight:800; color:var(--tenue) }
.ang { opacity:.45 }
.capo-n.mia { color:var(--viola-scuro); background:#e5ecfd; border-radius:6px }
.cella { aspect-ratio:1; border-radius:5px; border:0; padding:0;
         box-shadow:inset 0 0 0 1px #0000001a; transition:transform .1s }
.cella.fuori { opacity:.5 }              /* non è fra le tabelline scelte adesso */
.cella.attiva { box-shadow:0 0 0 3px var(--viola); transform:scale(1.12); z-index:1 }

.legenda { display:flex; flex-wrap:wrap; justify-content:center; gap:5px 12px;
           font-size:12px; font-weight:700; color:var(--tenue); margin-top:9px }
.legenda span { display:flex; align-items:center; gap:5px }
.legenda i { width:11px; height:11px; border-radius:3px; display:inline-block;
             box-shadow:inset 0 0 0 1px #0000001a }

/* ---- la casella toccata ---- */
.dett { min-height:58px; display:flex; flex-wrap:wrap; align-items:center; justify-content:center;
        gap:8px; font-size:15px; font-weight:800; text-align:center; line-height:1.35;
        color:var(--viola-scuro) }
.dett.vuoto { color:var(--tenue); font-weight:600; box-shadow:0 4px 0 #eef0f5;
              background:#ffffffb0 }
.dett b { font-size:19px }
.dett .pallino { width:12px; height:12px; border-radius:50%; display:inline-block;
                 box-shadow:inset 0 0 0 1px #0000001a }
.dett .eti { color:var(--tenue) }
.dett i { flex-basis:100%; font-style:normal; font-size:13px; font-weight:600; color:var(--tenue) }

.nota { max-width:330px; line-height:1.4 }
</style>

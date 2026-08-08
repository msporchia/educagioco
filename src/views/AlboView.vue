<script setup>
/* ═══════════════════════════════════════════════════════════════════
   L'ALBO — la pagina che risponde a "a che punto sono?".

   Tre fasce, in quest'ordine, perché è l'ordine delle domande che si fa
   un bambino quando riapre il gioco:
     1. chi sono adesso   → livello, monete, giorni di fila
     2. cosa so fare      → una barra per materia, con il grado
     3. cosa ho vinto     → i traguardi, presi e da prendere
   Non c'è niente di calcolato qui dentro: tutto viene da
   store/progressi.js, così la pagina resta una vetrina.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { state, traguardi, livelloOra, areaOra, serieGiorni, abilitaOra,
         tabellineIntere, nomeCorrente } from '../store/profile.js'
import { AREE, MATERIE, quantiTotali } from '../store/progressi.js'
import Barra from '../components/Barra.vue'

defineEmits(['vai'])

const filtro = ref('tutto')

const livello = computed(() => livelloOra())
const serie = computed(() => serieGiorni())
const elenco = computed(() => traguardi())
const presi = computed(() => elenco.value.filter(t => t.preso))
const abilita = computed(() => MATERIE.map(m => abilitaOra(m.id)))
/* le tabelline sapute per intero: la riga di stelle sotto la barra delle
   tabelline è la risposta alla domanda che il bambino fa davvero — non
   "quanti calcoli so" ma "quali tabelline so" */
const intere = computed(() => new Set(tabellineIntere()))

/* le aree in cui c'è davvero qualcosa da vedere restano tutte: anche una
   sezione vuota è informazione ("qui non ho ancora fatto niente") */
const aree = computed(() => AREE.map(a => {
  const suoi = elenco.value.filter(t => t.area === a.id)
  return { ...a, suoi, presi: suoi.filter(t => t.preso).length,
           gioco: areaOra(a.id) }
}).filter(a => a.suoi.length))

const visibili = a => filtro.value === 'presi' ? a.suoi.filter(t => t.preso)
                    : filtro.value === 'manca' ? a.suoi.filter(t => !t.finito)
                    : a.suoi

const ultimi = computed(() =>
  presi.value.filter(t => t.quando).sort((a, b) => b.quando - a.quando).slice(0, 4))

const data = ms => new Date(ms).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
const pct = q => Math.round(q * 100) + '%'
</script>

<template>
  <div class="schermo">
    <Barra titolo="I miei progressi" monete @indietro="$emit('vai','home')">
      <div class="gettone">🏅 <b>{{ presi.length }}/{{ quantiTotali }}</b></div>
    </Barra>

    <div class="centro albo">
      <!-- ══════ chi sono adesso ══════ -->
      <div class="testata">
        <div class="stemma">⭐<b>{{ livello.n }}</b></div>
        <div class="chi">
          <!-- il nome, non l'id: `state.player` è la chiave del salvataggio -->
          <h2>{{ nomeCorrente() }}</h2>
          <p class="titolo">{{ livello.titolo }}</p>
          <div class="barretta grande"><i :style="{ width: pct(livello.quota) }"></i></div>
          <p class="mini">{{ livello.xp - livello.da }} / {{ livello.a - livello.da }}
             punti al livello {{ livello.n + 1 }}</p>
        </div>
      </div>

      <div class="strisce">
        <div class="dato"><b>🔥 {{ serie }}</b><i>giorni di fila</i></div>
        <div class="dato"><b>📅 {{ state.profile.giorni.totali }}</b><i>giorni giocati</i></div>
        <div class="dato"><b>🏆 {{ state.profile.giorni.record }}</b><i>serie record</i></div>
        <div class="dato"><b>🪙 {{ state.profile.totals.monete }}</b><i>monete guadagnate</i></div>
      </div>

      <!-- ══════ le ultime medaglie ══════ -->
      <div v-if="ultimi.length" class="vetrina">
        <span v-for="t in ultimi" :key="t.id" class="ricordo">
          <b>{{ t.emoji }}</b>
          <i>{{ t.nome }}<br><small>{{ data(t.quando) }}</small></i>
        </span>
      </div>

      <!-- ══════ cosa so fare ══════ -->
      <h2 class="sezione">Cosa so fare</h2>
      <p class="testo">Questo non sale e basta: quello che non si ripassa per tanto
        tempo torna indietro, e i giochi tornano a proporlo.</p>
      <div class="materie">
        <div v-for="a in abilita" :key="a.id" class="materia">
          <div class="capo">
            <span class="ico">{{ a.emoji }}</span>
            <b>{{ a.nome }}</b>
            <span class="sp"></span>
            <span class="conta">{{ a.imparati }}/{{ a.totale }}</span>
          </div>
          <div class="barretta"><i :class="'g' + a.difficolta" :style="{ width: pct(a.padronanza) }"></i></div>
          <div v-if="a.id === 'mate'" class="stelline">
            <span v-for="n in 10" :key="n" :class="{ presa: intere.has(n) }"
                  :title="'tabellina del ' + n">{{ intere.has(n) ? '⭐' : n }}</span>
          </div>
          <p class="mini sotto">{{ a.grado.s }} {{ a.grado.nome }} · domande di livello {{ a.difficolta }}/5</p>
        </div>
      </div>

      <!-- ══════ cosa ho vinto ══════ -->
      <h2 class="sezione">I traguardi</h2>
      <div class="tabs">
        <button :class="{ on: filtro === 'tutto' }" @click="filtro = 'tutto'">Tutti</button>
        <button :class="{ on: filtro === 'presi' }" @click="filtro = 'presi'">Presi</button>
        <button :class="{ on: filtro === 'manca' }" @click="filtro = 'manca'">Da prendere</button>
      </div>

      <!-- l'id nell'attributo: le famiglie arrivano anche dai manifesti dei
           giochi nuovi, e un test deve poter dire «quella del Codice
           Segreto c'è» senza cercare il nome scritto a schermo -->
      <div v-for="a in aree" :key="a.id" class="area" :data-area="a.id">
        <div class="capo area-capo">
          <span class="ico">{{ a.emoji }}</span>
          <b>{{ a.nome }}</b>
          <span class="sp"></span>
          <span v-if="a.gioco.xp" class="liv">⭐{{ a.gioco.n }}</span>
          <span class="conta">{{ a.presi }}/{{ a.suoi.length }}</span>
        </div>
        <div class="griglia">
          <div v-for="t in visibili(a)" :key="t.id" class="badge"
               :class="{ spento: !t.preso, oro: t.finito }">
            <span class="faccia">{{ t.emoji }}<em v-if="t.medaglia">{{ t.medaglia }}</em></span>
            <b>{{ t.nome }}</b>
            <i>{{ t.come }}</i>
            <div v-if="!t.finito" class="barretta piccola"><i :style="{ width: pct(t.quota) }"></i></div>
            <small v-if="!t.finito">{{ Math.min(t.valore, t.meta) }} / {{ t.meta }}</small>
            <small v-else-if="t.quando">{{ data(t.quando) }}</small>
            <small v-else>fatto!</small>
          </div>
        </div>
        <p v-if="!visibili(a).length" class="mini">niente da mostrare qui</p>
      </div>

      <p class="mini finale">I traguardi si contano da soli: guardano quello che hai
        già fatto, non serve ricordarsi di segnarli.</p>
    </div>
  </div>
</template>

<style scoped>
.albo { justify-content:flex-start; gap:13px; max-width:520px; margin:0 auto; width:100%;
        padding-bottom:34px }
/* la pagina scorre: nessuna fascia deve schiacciarsi per far entrare le altre.
   Serve soprattutto alla vetrina, che avendo overflow proprio perde la
   protezione di min-height:auto e si riduce a una striscia illeggibile. */
.albo > * { flex:none }
.sezione { align-self:flex-start; margin-top:8px }
.sp { flex:1 }

/* ---- testata ---- */
.testata { display:flex; align-items:center; gap:14px; width:100%; padding:14px 16px;
           border-radius:22px; background:linear-gradient(120deg,#e8edf8,#fffffff0);
           box-shadow:0 5px 0 #dde3ea, 0 10px 22px #8593a822; text-align:left }
.stemma { position:relative; flex:none; width:66px; height:66px; border-radius:50%;
          display:grid; place-items:center; font-size:30px;
          background:linear-gradient(180deg,var(--giallo),var(--arancio));
          box-shadow:0 4px 0 #d97706 }
.stemma b { position:absolute; bottom:-2px; right:-2px; font-size:16px; color:#fff;
            background:var(--viola-scuro); border-radius:999px; padding:2px 7px;
            box-shadow:0 2px 6px #0002 }
.chi { flex:1; min-width:0 }
.chi h2 { font-size:20px }
.titolo { font-size:13px; font-weight:800; color:var(--viola); margin-bottom:5px }

/* ---- barre ---- */
.barretta { height:9px; border-radius:999px; background:#e7dcf7; overflow:hidden }
.barretta.grande { height:12px }
.barretta.piccola { height:6px; width:100%; margin-top:5px }
.barretta i { display:block; height:100%; border-radius:999px;
              background:linear-gradient(90deg,var(--viola),var(--rosa)); transition:width .5s }
.barretta i.g1 { background:linear-gradient(90deg,#9aa8c7,#b9c4dc) }
.barretta i.g2 { background:linear-gradient(90deg,#5bc0de,#8fdcf0) }
.barretta i.g3 { background:linear-gradient(90deg,var(--verde),#8de0a8) }
.barretta i.g4 { background:linear-gradient(90deg,var(--viola),var(--rosa)) }
.barretta i.g5 { background:linear-gradient(90deg,var(--arancio),var(--giallo)) }

/* ---- strisce dei numeri ---- */
.strisce { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; width:100% }
.dato { background:var(--carta); border-radius:15px; padding:9px 4px;
        box-shadow:0 3px 0 #e9ddf5 }
.dato b { display:block; font-size:15px; font-weight:900; color:var(--viola-scuro) }
.dato i { font-style:normal; font-size:10.5px; color:var(--tenue); line-height:1.15;
          display:block; margin-top:2px }

/* ---- vetrina delle ultime medaglie ---- */
.vetrina { display:flex; gap:8px; width:100%; overflow-x:auto; padding-bottom:3px }
.ricordo { flex:none; display:flex; align-items:center; gap:7px; padding:8px 12px 8px 9px;
           border-radius:999px; background:linear-gradient(120deg,#fff6e0,#fffffff0);
           box-shadow:0 3px 0 #f0e2c8 }
.ricordo b { font-size:24px }
.ricordo i { font-style:normal; font-size:11.5px; font-weight:800; text-align:left;
             color:var(--viola-scuro); white-space:nowrap }
.ricordo small { font-weight:600; color:var(--tenue); font-size:10px }

/* ---- materie ---- */
.materie { display:flex; flex-direction:column; gap:9px; width:100% }
.materia { background:var(--carta); border-radius:17px; padding:11px 13px;
           box-shadow:0 4px 0 #e9ddf5; text-align:left }
.capo { display:flex; align-items:center; gap:8px; margin-bottom:7px }
.capo .ico { font-size:19px }
.capo b { font-size:14.5px; font-weight:900; color:var(--viola-scuro) }
.conta { font-size:12px; font-weight:800; color:var(--tenue) }
.sotto { text-align:left; margin-top:6px }
/* le dieci tabelline: il numero finché non la sai, la stella quando la sai */
.stelline { display:flex; gap:4px; margin-top:7px; flex-wrap:wrap }
.stelline span { width:22px; height:22px; border-radius:7px; display:grid; place-items:center;
                 font-size:11.5px; font-weight:900; color:var(--tenue); background:#efe8fa }
.stelline span.presa { background:linear-gradient(140deg,#fff3cf,#ffe08a); font-size:13px;
                       box-shadow:0 1px 0 #e6c976 }

/* ---- traguardi ---- */
.tabs { display:flex; gap:7px; flex-wrap:wrap; justify-content:center }
.tabs button { padding:8px 15px; border-radius:999px; background:#ffffffcc; font-size:13px;
               font-weight:800; color:var(--viola-scuro); box-shadow:0 3px 0 #d4dce6 }
.tabs button.on { background:linear-gradient(180deg,var(--viola),var(--viola-scuro)); color:#fff;
                  box-shadow:0 3px 0 #2c4283 }
.area { width:100%; text-align:left }
.area-capo { margin:6px 0 8px }
.liv { font-size:12px; font-weight:900; color:var(--arancio) }
.griglia { display:grid; grid-template-columns:repeat(auto-fill,minmax(146px,1fr)); gap:8px }
.badge { background:var(--carta); border-radius:16px; padding:10px 11px 9px;
         box-shadow:0 4px 0 #e9ddf5; display:flex; flex-direction:column; gap:2px }
.badge.oro { background:linear-gradient(140deg,#fff3cf,#fffffff2); box-shadow:0 4px 0 #efdca6 }
.badge.spento { opacity:.62; filter:grayscale(.85) }
/* la faccia si stringe sull'emoji: dentro una colonna flex un inline-block
   diventa blocco e la medaglia finirebbe in fondo alla riga, non sull'emoji */
.faccia { font-size:27px; line-height:1.1; position:relative; align-self:flex-start }
.faccia em { font-style:normal; font-size:15px; position:absolute; bottom:-2px; right:-11px }
.badge b { font-size:13.5px; font-weight:900; color:var(--viola-scuro) }
.badge i { font-style:normal; font-size:11px; color:var(--tenue); line-height:1.3 }
.badge small { font-size:10px; color:var(--tenue); font-weight:700; margin-top:3px }
.finale { max-width:32ch; margin-top:6px }
</style>

<script setup>
// La sovrimpressione del prototipo: la stessa colla della vista vera (src/giochi/sotterraneo/Gioco.vue, le righe dello
// scontro e dei fogli) attorno ai componenti veri — la domanda (quiz/Domanda.vue, coi moduli e il ripasso veri), le caselle
// delle abilità, la fila dei turni, i globi della vita e dell'energia. Il motore decide tutto (Corsa); qui si chiede, si
// risponde e si racconta il turno (viste/racconto.js). Il 3D (main.js) legge lo stesso racconto e lo mette in scena.
// Copiata da Gioco.vue la colla, non le regole: nessun numero si calcola qui.
import { computed, ref, watch, onMounted, onUnmounted, markRaw } from 'vue'
import Domanda from '../../src/quiz/Domanda.vue'
import { domandaPerGioco } from '../../src/quiz/scelta.js'
import CaselleAbilita from '../../src/giochi/sotterraneo/viste/CaselleAbilita.vue'
import FilaDeiTurni from '../../src/giochi/sotterraneo/viste/FilaDeiTurni.vue'
import BarraDiSotto from '../../src/giochi/sotterraneo/viste/BarraDiSotto.vue'
import Medaglione from '../../src/giochi/sotterraneo/viste/Medaglione.vue'
import { vistaDelloScontro, incantiAddosso } from '../../src/giochi/sotterraneo/viste/campo.js'
import { modoDelColpo } from '../../src/giochi/sotterraneo/viste/racconto.js'
import { schedaDi } from '../../src/giochi/sotterraneo/dati/effetti.js'
import { NODI, RAMI, preparabile } from '../../src/giochi/sotterraneo/dati/abilita.js'
import { quotaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { puntiDaDare } from '../../src/giochi/sotterraneo/motore/crescita.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { caselleDella, puntiAbilita, gradoDi } from '../../src/giochi/sotterraneo/motore/abilita.js'
import '../../src/emoji/emoji.css'
import '../../src/style.css'
import '../../src/giochi/sotterraneo/stile.css'
import '../../src/giochi/sotterraneo/stile-scontro.css'
import '../../src/giochi/sotterraneo/stile-effetti.css'

const props = defineProps({ ponte: { type: Object, required: true } })
const p = props.ponte
const racconto = p.racconto
const dalla = (f, d = null) => computed(() => { void p.tic; return p.corsa ? f(p.corsa) : d })
const animando = computed(() => racconto.fx.attivo)

/* ── la domanda: dal motore viene solo quanto dev'essere difficile (corsa.chiesta), il resto lo fa il quiz vero ── */
const domanda = ref(null)
let ultimoModulo = null
watch(() => { void p.tic; return p.corsa.chiesta?.id }, id => {
  if (!id) { domanda.value = null; return }
  try {
    const q = domandaPerGioco({ difficolta: p.corsa.chiesta.difficolta, evita: ultimoModulo })
    ultimoModulo = q.modulo
    domanda.value = q
    p.domandaOra = q.domanda   // per le prove dalla console (window.__sotterraneo.ponte)
  } catch (e) { console.error(e); domanda.value = null; risolvi(true) }
}, { immediate: true })

const foglio = dalla(c => c.foglio)
const nemico = dalla(c => vistaDelloScontro(c))
let ultimaVista = null
const vista = computed(() => { const v = nemico.value; if (v) ultimaVista = v; return v || (animando.value ? ultimaVista : null) })

function fotoPrima (c) {
  const f = c.foglio
  if (!f || f.che !== 'scontro') return null
  const v = vistaDelloScontro(c)
  return { campo: [...f.campo], ossa: f.campo.map(m => Math.max(0, m.ossa)), morti: f.campo.map(m => !!m.morto), turni: v.turni,
           stati: v.mostri.map(m => m.stati) }
}
function tintaDi (id) {
  const nodo = NODI[id], c = p.corsa
  const ramo = nodo && (RAMI[c.io.chiave] || []).find(r => r.chiave === nodo.ramo)
  return ramo ? ramo.tinta : '#ffd23f'
}
function comeColpisce (a) {
  const c = p.corsa
  const nodo = a.usata ? NODI[a.usata.id] : null
  const famiglia = c.mano && COSE[c.mano] ? COSE[c.mano].famiglia : null
  const modo = modoDelColpo({ nodo, famiglia, tinta: nodo ? tintaDi(nodo.id) : '#ffe39a' })
  // per il 3D: verso chi scatta l'eroe, coi tempi e il colore dell'effetto (dati/effetti.js)
  const s = schedaDi(modo.effetto)
  // markRaw: la roba del motore non deve diventare un proxy di Vue, o il 3D non la ritrova nelle sue mappe
  p.colpoEroe = markRaw({ bersaglio: a.bersaglio, arrivo: s.arrivo, dura: s.dura, luce: modo.luce, via: s.via })
  return modo
}
function raccontaLoScontro (prima, azioni, { riga = null, dopo = null } = {}) {
  p.dopo = dopo
  racconto.racconta({ campo: prima.campo, prima, azioni, modo: comeColpisce, riga })
}
// l'apertura: l'agguato, la sorpresa, i mostri più veloci
watch(() => { void p.tic; const f = p.corsa.foglio; return f && f.che === 'scontro' ? f : null }, f => {
  if (!f || !(f.apertura.length || f.agguato || f.sorpresa)) return
  const molti = f.campo.length > 1
  raccontaLoScontro(fotoPrima(p.corsa), f.apertura, { riga: f.agguato ? 'Alle spalle!' : f.sorpresa ? (molti ? 'Li hai sorpresi!' : 'Lo hai sorpreso!') : null })
})

function risposto ({ giusto, saltata }) { domanda.value = null; risolvi(giusto, saltata) }
p.risolvi = (giusto) => { domanda.value = null; risolvi(giusto) }   // per le prove automatiche: come una risposta data
function risolvi (giusto, saltata = false) {
  const c = p.corsa
  const prima = fotoPrima(c)
  const esito = c.rispondi(giusto, { saltata })
  p.tic++
  if (esito && esito.azioni && prima) raccontaLoScontro(prima, esito.azioni)
}

/* ── la scelta del colpo, in due fasi come nella vista vera (viste/CaselleAbilita.vue) ── */
const colpoPer = ref(0)
const sceltaFatta = dalla(c => !!c.chiesta && colpoPer.value === c.chiesta.id, false)
const abilitaViva = dalla(c => {
  const f = c.foglio
  if (!f || f.che !== 'scontro') return null
  const m = f.chi
  const voce = id => {
    const nodo = id && NODI[id]
    if (!nodo) return null
    const ramo = RAMI[c.io.chiave].find(r => r.chiave === nodo.ramo)
    return { id, glifo: nodo.glifo, tinta: ramo && ramo.tinta, nome: nodo.nome, costo: c.costoDi(nodo), dice: c.descrizione(nodo, m), perche: c.perchéNonUsi(id) }
  }
  const i = c.pozioneGiusta()
  const k = i == null ? null : c.zaino[i]
  return {
    caselle: caselleDella(c.crescita).map(voce).filter(Boolean), attacco: `fai ${c.colpo(m)} di danno`, energia: c.energia, energiaMax: c.energiaMax,
    bevi: i == null ? null : { cura: k && COSE[k].usa === 'cura' ? c.curaDi(k) : 0, n: c.pozioni, tipi: 1, fatto: !!f.bevuto },
    beviEnergia: null,
    scappa: c.puoScappare() ? { graffio: c.costoFuga() } : null,
    pericolo: f.pericolo ? { perche: f.pericolo, vita: c.vita, male: c.colpiInArrivo(), bevuto: !!f.bevuto } : null,
    scelta: c.pronta ? voce(c.pronta) : null,
  }
})
let ultimaScelta = null
const abilita = computed(() => { const a = abilitaViva.value; if (a) ultimaScelta = a; return a || (animando.value ? ultimaScelta : null) })
function scegliColpo (id) {
  const c = p.corsa, f = c.foglio
  if (!f || f.che !== 'scontro' || animando.value) return
  if (f.pericolo) c.continua()
  c.prepara(null)
  if (id && !c.prepara(id)) return
  colpoPer.value = c.chiesta ? c.chiesta.id : 0
  p.tic++
}
function beviNelloScontro () {
  const c = p.corsa
  if (!c.foglio || c.foglio.che !== 'scontro') return
  const prima = fotoPrima(c)
  const e = c.foglio.pericolo ? c.beviNelPericolo() : c.beviNelloScontro()
  p.tic++
  if (e && e.azioni && prima) raccontaLoScontro(prima, e.azioni)
}
function scappa () { p.corsa.scappa(); domanda.value = null; p.tic++ }
// il bersaglio si cambia toccando il mostro nella scena 3D (main.js chiama questo)
p.scegliBersaglio = i => {
  const c = p.corsa, f = c.foglio
  if (!f || f.che !== 'scontro' || animando.value || !f.campo[i]) return
  if (c.scegliBersaglio(f.campo[i])) p.tic++
}

/* ── nel prototipo forzieri e curiosità (libri, leggii, sfere) si aprono senza domanda: si risponde qui per il bambino
   (una risposta «saltata»: non conta fra le domande), il motore resta quello vero. Gli scontri e le porte chiedono ancora ── */
watch(() => { void p.tic; const f = p.corsa.foglio; return f && ['forziere', 'curiosita'].includes(f.che) && p.corsa.chiesta ? p.corsa.chiesta.id : 0 }, id => {
  if (!id) return
  const f = p.corsa.foglio
  domanda.value = null
  p.corsa.rispondi(true, { saltata: true })
  p.tic++
  if (p.aperto) p.aperto(f.chi)
})
/* ── gli altri fogli: la porta, il forziere, la fonte, la curiosità chiedono; gli altri si leggono e si chiudono ── */
const TITOLI = { porta: '🚪 Una porta chiusa', forziere: '🎁 Un forziere', fonte: '⛲ Una fonte', curiosita: '🔮 Una curiosità',
  svenuto: '💫 Sei svenuto', chiusa: '🔒 La scala è chiusa', scala: '🕳️ La scala che scende', 'scala-su': '🪜 La scala che sale', portale: '🌀 Un portale' }
const chiede = computed(() => foglio.value && ['porta', 'fonte'].includes(foglio.value.che))
function attraversa () {
  const c = p.corsa
  c.chiudi(); p.tic++
  p.attraversa && p.attraversa(() => { c.dillo('🌀 di sopra c\'è il villaggio: nel prototipo no, e si torna qui'); p.tic++ })
}
function chiudiFoglio () { const c = p.corsa; if (c.foglio && c.foglio.che === 'svenuto') c.riprendi(); else c.chiudi(); domanda.value = null; p.tic++ }

/* ── i globi e gli avvisi ── */
// la barra in basso, come in Diablo: i numeri come li dà Gioco.vue (`barra`), dalla corsa di giù
const barra = dalla(c => {
  const q = quotaDi(c.crescita.esp)
  return {
    vita: c.vita, vitaMax: c.vitaMax, livello: q.livello, esperienza: q.quota, espFatta: q.fatto, espServe: q.serve, punti: puntiDaDare(c.crescita),
    energia: c.energia, energiaMax: c.energiaMax, puntiAbilita: puntiAbilita(c.crescita), pozioni: c.pozioni,
    pieni: c.postiUsati(), tasche: c.capienza, gemme: c.gemme, incanti: incantiAddosso(c),
    preparabili: (RAMI[c.io.chiave] || []).flatMap(r => r.nodi).filter(n => preparabile(n) && gradoDi(c.crescita, n.id)).length,
    missioniPronte: 0, posto: c.tappa && c.tappa.nome, piano: c.piano + 1,
  }
})
// la pozione dalla barra: come Gioco.vue (`bevi`): con un tipo solo si beve e basta
function bevi () {
  const c = p.corsa
  if (c.foglio && c.foglio.che === 'scontro') return beviNelloScontro()
  if (c.foglio || c.finita) return
  const i = c.pozioneGiusta()
  if (i == null) c.dillo(c.pozioni ? '❤️ sei già in piena forma' : '🧪 non hai pozioni')
  else c.usa(i)
  p.tic++
}
const nonQui = () => { p.corsa.dillo('nel prototipo questa pagina non c\'è'); p.tic++ }
const avviso = ref(null)
let tAvviso = 0
const giro = setInterval(() => {
  const c = p.corsa
  if (c.avvisi && c.avvisi.length) { const a = c.avvisi.shift(); avviso.value = typeof a === 'string' ? a : (COSE[a.cosa] ? COSE[a.cosa].nome : '') + (a.coda || ''); tAvviso = performance.now() }
  else if (avviso.value && performance.now() - tAvviso > 1800) avviso.value = null
}, 120)
onUnmounted(() => clearInterval(giro))

/* ── quanto è alto il pannello in basso: la telecamera inquadra lo scontro nello spazio sopra ── */
const sotto = ref(null)
let oss = null
onMounted(() => { oss = new ResizeObserver(() => { p.sotto = sotto.value ? sotto.value.offsetHeight : 0 }); if (sotto.value) oss.observe(sotto.value) })
onUnmounted(() => oss && oss.disconnect())
</script>

<template>
  <div class="poc-sopra">
    <p class="poc-posto">{{ barra.posto }} · piano {{ barra.piano }}</p>
    <p v-if="avviso" class="poc-avviso">{{ avviso }}</p>
    <p v-if="animando && racconto.fx.riga" class="poc-riga">{{ racconto.fx.riga }}</p>
    <p v-if="animando && racconto.fx.nome" class="poc-nome" :style="{ color: racconto.fx.nome.tinta }">{{ racconto.fx.nome.nome }}</p>

    <!-- la fila dei turni, sul bordo destro come nella vista vera -->
    <div v-if="vista" class="poc-fila">
      <FilaDeiTurni :turni="racconto.fx.fila || vista.turni" :mostri="vista.mostri" :eroe="vista.eroe" :incanti="vista.incanti" />
    </div>

    <div ref="sotto" class="poc-sotto sot">   <!-- `sot`: la radice della vista vera, i suoi stili e i suoi colori -->
      <!-- lo scontro: prima si sceglie cosa fare, poi la domanda per quel colpo -->
      <template v-if="vista">
        <CaselleAbilita v-if="abilita && (!sceltaFatta || animando)" :key="animando ? 'racconto' : 'scelta'" v-bind="abilita"
                        :ferma="animando" :pericolo="animando ? null : abilita.pericolo"
                        @scegli="scegliColpo" @bevi="beviNelloScontro" @scappa="scappa" />
        <template v-else-if="domanda">
          <div v-if="abilita && abilita.scelta" class="sot-scelta sot-pronta sot-scelta-fatta">
            <Medaglione :glifo="abilita.scelta.glifo" :tinta="abilita.scelta.tinta" stato="preso" :misura="28" />
            <span class="sot-scelta-testo"><b>{{ abilita.scelta.nome }}</b><small>{{ abilita.scelta.dice }}</small></span>
          </div>
          <div class="sot-domanda">
            <Domanda :key="domanda.domanda.testo + p.corsa.chiesta?.id" :domanda="domanda.domanda" :pittori="domanda.pittori"
                     :origine="domanda" gioco="sotterraneo" :respiro="900" @risposto="risposto" />
          </div>
        </template>
      </template>
      <!-- gli altri fogli -->
      <div v-else-if="foglio" class="poc-foglio">
        <b>{{ TITOLI[foglio.che] || foglio.che }}</b>
        <div v-if="chiede && domanda" class="sot-domanda">
          <Domanda :key="'f' + p.corsa.chiesta?.id" :domanda="domanda.domanda" :pittori="domanda.pittori"
                   :origine="domanda" gioco="sotterraneo" :respiro="900" @risposto="risposto" />
        </div>
        <!-- il portale: nel gioco si sale al villaggio e si torna qui; nel prototipo il villaggio non c'è, si vede il passaggio -->
        <button v-if="foglio.che === 'portale'" class="poc-chiudi" @click="attraversa">Attraversa</button>
        <button v-else-if="!chiede" class="poc-chiudi" @click="chiudiFoglio">{{ foglio.che === 'svenuto' ? 'Riprovo' : 'Va bene' }}</button>
      </div>
      <!-- la barra vera (viste/BarraDiSotto.vue): globi, caselle, livello col «+» -->
      <BarraDiSotto :vita="barra.vita" :vita-max="barra.vitaMax" :colpito="p.colpito" :livello="barra.livello"
                    :esperienza="barra.esperienza" :esp-fatta="barra.espFatta" :esp-serve="barra.espServe" :punti="barra.punti" :sale="false"
                    :energia="barra.energia" :energia-max="barra.energiaMax" :punti-abilita="barra.puntiAbilita"
                    :pozioni="barra.pozioni" :pieni="barra.pieni" :tasche="barra.tasche" :gemme="barra.gemme"
                    :mappa="false" :preparabili="barra.preparabili" :missioni-pronte="barra.missioniPronte"
                    :incanti="barra.incanti" @bevi="bevi" @zaino="nonQui" @incanti="nonQui"
                    @mappa="nonQui" @eroe="nonQui" @abilita="nonQui" />
    </div>
  </div>
</template>

<style>
.poc-sopra { position: fixed; inset: 0; pointer-events: none; font-family: system-ui, sans-serif; }
.poc-sopra > * { pointer-events: auto; }
.poc-sopra .poc-posto, .poc-sopra .poc-avviso, .poc-sopra .poc-riga, .poc-sopra .poc-nome { pointer-events: none; }
.poc-posto { position: absolute; top: 26px; right: 10px; margin: 0; font-size: 12px; color: #b9a684; }
.poc-avviso { position: absolute; top: 26%; left: 50%; transform: translateX(-50%); margin: 0; padding: 6px 12px; border-radius: 8px;
  background: rgba(0,0,0,.65); color: #ffe6b8; font-size: 15px; white-space: nowrap; }
.poc-riga, .poc-nome { position: absolute; top: 14%; left: 50%; transform: translateX(-50%); margin: 0; font: 800 22px system-ui;
  color: #fff; text-shadow: 0 2px 0 #000, 0 0 12px #000; }
.poc-nome { top: 20%; font-size: 18px; }
.poc-fila { position: absolute; right: 6px; top: 46px; }
.poc-fila .sot-fila { position: static; }
.poc-sotto.sot { display: block; flex: none; color: #eadcc2; position: absolute; left: 0; right: 0; bottom: 0; margin: 0 auto; max-width: 560px; padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
  background: linear-gradient(to bottom, rgba(12,9,7,0), rgba(12,9,7,.9) 16px, rgba(10,8,6,.97)); color: #eadcc2; box-sizing: border-box; }
/* la barra vera nel gioco sta in fondo alla colonna del gioco: qui in fondo al pannello */
.poc-sotto .sot-plancia { position: relative !important; inset: auto !important; left: auto !important; right: auto !important; bottom: auto !important; }
.poc-foglio { display: flex; flex-direction: column; gap: 8px; align-items: stretch; }
.poc-foglio > b { text-align: center; font-size: 17px; }
.poc-chiudi { font: 700 17px system-ui; padding: 12px; border-radius: 10px; border: 0; background: #e9c37a; color: #2a1a0c; }
</style>

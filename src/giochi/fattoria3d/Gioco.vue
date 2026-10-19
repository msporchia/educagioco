<script setup>
/* La fattoria 3D (in prova) — il coordinatore: le regole sono in motore/fattoria3d.js, il disegno in scena3d/, le tabelle in dati/,
   le finestre in viste/. È l'unico file che sa delle monete vere (state.profile.coins), dei contatori (segna) e del salvataggio
   (profile.campagne.fattoria3d.cfg.stato). Usa raccolti, prodotti, lana e legna suoi: non tocca quelli della fattoria di sempre.
   Senza WebGL 2 non si apre niente: lo si dice e si torna in home. Vedi docs/fattoria3d/. */
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import Barra from '../../components/Barra.vue'
import { state, addCoins, segna, flushNow, persist } from '../../store/profile.js'
import { fasciaAttiva } from '../../store/qualita.js'
import { load, save } from '../../store/storage.js'
import { scelta, ricorda } from '../campagne.js'
import { Fattoria3d } from './motore/fattoria3d.js'
import { haWebGL2 } from './scena3d/webgl.js'
import { dettoDi } from './scena3d/azioni.js'
import { PEZZI } from './dati/catalogo.js'
import { COLTURE } from './dati/colture.js'
import { RICETTE, FORNO_POSTI } from './dati/ricette.js'
import { COSTI } from './dati/regole.js'
import { qualitaIniziale } from './dati/qualita.js'
import Hud from './viste/Hud.vue'
import BarraAzioni from './viste/BarraAzioni.vue'
import Vassoio from './viste/Vassoio.vue'
import SceltaSeme from './viste/SceltaSeme.vue'
import Pasticceria from './viste/Pasticceria.vue'
import Dialogo from './viste/Dialogo.vue'
import Opzioni from './viste/Opzioni.vue'
import './stile.css'

// App.vue passa a tutte le schermate `disegno` e `lingua`: qui non servono
defineOptions({ name: 'LaFattoria3d', inheritAttrs: false })
const emit = defineEmits(['vai'])

const CHIAVE = 'fattoria3d'
const CHIAVE_OPZIONI = 'fattoria3d-opz'
// `#fattoria3d&tela=niente`: per provare il messaggio su un browser che il WebGL ce l'ha
const finto = typeof location !== 'undefined' && /(?:^#?|&)tela=niente(?:&|$)/.test(location.hash || '')
const puo = ref(!finto && haWebGL2())

const tela = ref(null)
const sopra = ref(null)
const vassoio = ref(null)
const zonaVia = ref(null)
let motore = null, mondo = null, vivo = true

// ── la borsa: le monete vere. Un rimborso (la monetina di uno spostamento annullato) non conta come guadagnata. ──
const borsa = {
  quante: () => state.profile.coins || 0,
  paga: n => {
    if (n > 0) addCoins(-n)
    else if (n < 0) { state.profile.coins = (state.profile.coins || 0) - n; persist() }
    return true
  },
}

// ── cosa si vede (il motore non è reattivo: si rilegge dopo ogni cambio e ogni quarto di secondo) ──
const versione = ref(0)
const foto = ref({ scorte: '', prodotti: '', lana: 0, legna: 0, daFare: { semina: 0, raccogli: 0 } })
const ripresa = () => {
  const s = motore.s
  const unisci = (o, em) => Object.entries(o).filter(([, n]) => n > 0).map(([k, n]) => em(k) + ' ' + n).join('  ')
  foto.value = {
    scorte: unisci(s.merci, k => COLTURE[k].emoji) || '🌾 0', prodotti: unisci(s.prodotti, k => RICETTE[k].emoji) || '🍞 0',
    lana: s.lana, legna: s.legna, daFare: motore.daFare(),
  }
  versione.value++
}
const EVENTI = { terra: 'fattoria3dTerre', pezzo: 'fattoria3dPezzi', raccolto: 'fattoria3dRaccolti', albero: 'fattoria3dAlberi' }
function contaEventi() {
  for (const e of motore.prendiEventi()) {
    if (EVENTI[e.tipo]) segna(EVENTI[e.tipo])
    else if (e.tipo === 'prodotto') segna('fattoria3dProdotti', e.n)
  }
}

// ── il salvataggio: a ritardo, e subito quando la pagina sparisce ──
let sporco = false
function salva({ subito = false } = {}) {
  if (!motore) return
  sporco = false
  ricorda(CHIAVE, 'stato', motore.serializza())
  if (subito) flushNow()                   // `ricorda` scrive con ritardo: uscendo, la pagina può sparire prima
}
function seSparisce(e) { if (e?.type === 'pagehide' || document.visibilityState === 'hidden') salva({ subito: true }) }

// ── lo stato della vista ──
const modo = ref('libero')               // libero | semina | raccogli
const seme = ref('grano')
const costruendo = ref(false)
const vista = ref('vicino')
const strumento = ref(null)              // null | 'strada' | 'gomma'
const avvisoTesto = ref('')
const avvisoAnnulla = ref(false)
const trascinando = ref(null)            // { emoji, x, y, su, perMettereVia } mentre si trascina un pezzo
const semiAperto = ref(false)
const pasticceriaAperta = ref(false)
const opzioniAperte = ref(false)
const opzioniRidotte = ref(false)
const dialogo = ref(null)                // { titolo, testo, bottoni: [{ t, fn, quieto }] }
const cameraLibera = ref(false)
const stat = ref({ fps: 0, peggiore: 0, p1: 0, cpu: 0, calls: 0, triangoli: 0, geometrie: 0, texture: 0, dpr: 1, grafico: [] })
const q = reactive(qualitaIniziale(fasciaAttiva()))
const rapporto = ref('')
let quandoSeme = null

// ── le porte che il mondo 3D usa verso la vista ──
const ui = {
  cambio() { sporco = true; contaEventi(); ripresa() },
  chiedi(titolo, testo, bottoni) { dialogo.value = { titolo, testo, bottoni } },
  scegliSeme(cb) { quandoSeme = cb; semiAperto.value = true },
  apriPasticceria() { pasticceriaAperta.value = true },
  avviso(testo, conAnnulla = false) { avvisoTesto.value = testo || ''; avvisoAnnulla.value = !!conAnnulla },
  fogliAperti: () => !!dialogo.value || semiAperto.value || pasticceriaAperta.value || (opzioniAperte.value && !opzioniRidotte.value),
  zonaDrop: () => ((costruendo.value ? vassoio.value?.radice : zonaVia.value) || null)?.getBoundingClientRect() || null,
  trascinando(info) { trascinando.value = info },
}

// ── la barra delle azioni ──
function impostaModo(m) {
  modo.value = m; mondo.imposta({ modo: m })
  if (m === 'semina') mondo.fx.parla('Tocca i campi da seminare')
  else if (m === 'raccogli') mondo.fx.parla('Tocca i campi pronti da tagliare')
}
function apriSemina() { quandoSeme = k => impostaModo('semina'); semiAperto.value = true }
function scegliSeme(k) {
  semiAperto.value = false; seme.value = k; mondo.imposta({ seme: k })
  const f = quandoSeme; quandoSeme = null; f && f(k)
}
function tutti() {
  const n = mondo.tutti()
  mondo.fx.parla(n ? `Faccio ${n} ${n === 1 ? 'cosa' : 'cose'}` : 'Non c\'è niente da fare')
}

// ── costruire ──
const carte = computed(() => {
  void versione.value
  const pezzi = Object.entries(PEZZI).map(([id, p]) => ({ id, emoji: p.emoji, nome: p.nome, pezzo: true,
    prezzo: '🪙 ' + motore.prezzoPezzo(id), nel_magazzino: motore.nelMagazzino(id) }))
  return [...pezzi,
    { id: 'strada', emoji: '🛣️', nome: 'Strada', pezzo: false, prezzo: `🪙 ${COSTI.strada}/pezzo`, nel_magazzino: 0 },
    { id: 'gomma', emoji: '🧽', nome: 'Gomma', pezzo: false, prezzo: 'gratis', nel_magazzino: 0 }]
})
const suggerimento = computed(() => {
  if (avvisoTesto.value) return avvisoTesto.value
  if (strumento.value === 'strada') return `Trascina il dito sulla mappa per disegnare la strada (🪙 ${COSTI.strada} a pezzo).`
  if (strumento.value === 'gomma') return 'Trascina sulle strade che hai disegnato per toglierle.'
  return 'Trascina un pezzo dalla barra alla mappa. Un pezzo già messo si riprende e si sposta; un terreno scuro si compra toccandolo.'
})
function apriCostruisci() {
  if (mondo.eroe.az) return
  costruendo.value = true; vista.value = 'vicino'; strumento.value = null; avvisoTesto.value = ''
  mondo.imposta({ modo: 'libero', costruendo: true, strumento: null, vista: 'vicino' }); modo.value = 'libero'
}
function chiudiCostruisci() {
  costruendo.value = false; strumento.value = null; trascinando.value = null; avvisoTesto.value = ''
  mondo.imposta({ costruendo: false, strumento: null })
}
function cambiaVista(v) { vista.value = v; mondo.imposta({ vista: v, pan: { x: 0, z: 0 } }) }
function scegliStrumento(id) { strumento.value = strumento.value === id ? null : id; mondo.imposta({ strumento: strumento.value }); avvisoTesto.value = '' }
function cartaTocco(id) {
  if (motore.nelMagazzino(id) > 0) ui.avviso(`Trascina «${PEZZI[id].nome}» dalla barra fino alla mappa`)
  else comprare(id)
}
/** Un pezzo non ancora pagato: la conferma arriva appena si comincia a trascinarlo (o si tocca). Pagato, sta nel magazzino. */
function comprare(id) {
  const pr = motore.prezzoPezzo(id), nome = PEZZI[id].nome
  ui.chiedi('Comprare: ' + nome, `Costa 🪙 ${pr}. Poi lo trascini sulla mappa dove vuoi.`, [
    { t: `Compra · 🪙 ${pr}`, fn: () => {
      const r = motore.compraPezzo(id)
      if (!r.ok) return ui.avviso(dettoDi(r.motivo, { mancano: pr - motore.monete() }))
      ui.cambio(); ui.avviso(nome + ' comprato: trascinalo sulla mappa')
    } },
    { t: 'No', quieto: true },
  ])
}
function rispostaDialogo(i) {
  const d = dialogo.value; dialogo.value = null
  const b = d && d.bottoni[i]; if (b && b.fn) b.fn()
}

// ── la pasticceria ──
const pasticceria = computed(() => {
  void versione.value
  const P = motore.s.pasticceria, adesso = motore.ora(), s = motore.s
  const pronti = Object.entries(P.pronti).filter(([, n]) => n > 0)
  const dispensa = Object.entries(s.prodotti).filter(([, n]) => n > 0).map(([k, n]) => RICETTE[k].emoji + ' ×' + n)
  return {
    forno: Array.from({ length: FORNO_POSTI }, (_, k) => {
      const it = P.coda[k]; if (!it) return null
      const r = RICETTE[it.ric]
      if (!it.fine) return { emoji: r.emoji, testo: 'in coda', barra: 0 }
      const resto = Math.max(0, it.fine - adesso)
      return { emoji: r.emoji, testo: Math.ceil(resto / 1000) + 's', barra: 100 - 100 * resto / r.ms }
    }),
    pronti: pronti.length ? 'Pronti: ' + pronti.map(([k, n]) => RICETTE[k].emoji + ' ×' + n).join('  ') : '',
    puoRitirare: pronti.length > 0,
    ricette: Object.entries(RICETTE).map(([k, r]) => ({ k, nome: r.nome, emoji: r.emoji, ms: r.ms,
      ing: Object.entries(r.ing).map(([i, n]) => ({ k: i, ha: s.merci[i], serve: n })),
      puoi: motore.ingredientiOk(k) && P.coda.length < FORNO_POSTI })),
    dispensa: dispensa.length ? 'In dispensa: ' + dispensa.join('  ') : 'La dispensa è vuota: i prodotti serviranno per gli ordini (da fare).',
  }
})
function prepara(k) {
  const r = motore.prepara(k)
  if (!r.ok) return mondo.fx.parla(dettoDi(r.motivo))
  ui.cambio()
}
function ritira() {
  const r = motore.ritira()
  if (!r.ok) return
  ui.cambio(); mondo.fx.volo('+' + r.n + ' 🍰', mondo.pezzi.centroDi({ kind: 'edificio', tipo: 'pasticceria' }), 2.6)
  mondo.eroe.avvia('esulta', 0.9)
}

// ── le opzioni di qualità ──
function cambiaOpzioni() { mondo.applica(q); save(CHIAVE_OPZIONI, { q: { ...q } }) }
function creaRapporto() {
  const st = mondo.statistiche()
  rapporto.value = [
    `Fattoria 3D — ${new Date().toISOString().slice(0, 16)}`,
    `Dispositivo: ${navigator.userAgent}`,
    `Schermo: ${innerWidth}×${innerHeight} @${devicePixelRatio} · pixel ratio usato ${st.dpr.toFixed(2)}`,
    `GPU: ${mondo.gpu()}`,
    `fps ${st.fps.toFixed(0)} · peggiore ${st.peggiore.toFixed(0)} ms · 1% ${st.p1.toFixed(0)} ms`,
    `draw call ${st.calls} · triangoli ${st.triangoli} · cose in scena ${st.cose} (di prova ${st.prove})`,
    `Impostazioni: ${JSON.stringify(q)}`,
  ].join('\n')
}
const conta = computed(() => { void versione.value; return { cose: motore.cose.length, prove: motore.prove.length } })

// ── il battito della vista: statistiche, contatori e cose che passano col tempo ──
let battito = 0
function ritmo() {
  if (!motore) return
  contaEventi(); ripresa()
  cameraLibera.value = mondo.cameraLibera && !costruendo.value
  if (opzioniAperte.value) stat.value = mondo.statistiche()
  if (sporco) salva()
}

function indietro() { salva({ subito: true }); emit('vai', 'home') }

onMounted(async () => {
  if (!puo.value) return
  motore = new Fattoria3d({ stato: scelta(CHIAVE, 'stato', null), borsa })
  try { const c = await load(CHIAVE_OPZIONI); if (c && c.q) Object.assign(q, c.q) } catch (e) { /* le opzioni di serie */ }
  const { Mondo3d } = await import('./scena3d/mondo3d.js')          // three si scarica solo qui
  if (!vivo) return
  mondo = new Mondo3d({ canvas: tela.value, sopra: sopra.value, motore, ui, qualita: q })
  mondo.avvia()
  ripresa()
  battito = setInterval(ritmo, 250)
  document.addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
  window.__fattoria3d = { motore, mondo, q }
})
onBeforeUnmount(() => {
  vivo = false
  clearInterval(battito)
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
  if (motore) salva({ subito: true })
  mondo?.via()
  delete window.__fattoria3d
})
</script>

<template>
  <div class="schermo">
    <Barra titolo="Fattoria 3D" monete @indietro="indietro" />

    <div v-if="!puo" class="f3-senza" data-senza-3d>
      <p class="em">🚜</p>
      <h1>Qui il 3D non si può disegnare</h1>
      <p>Questo telefono non sa disegnare la fattoria in tre dimensioni. La fattoria di sempre c'è.</p>
      <button type="button" data-azione="esci-3d" @click="emit('vai', 'home')">torno ai giochi</button>
    </div>

    <div v-else class="f3" data-f3="campo">
      <canvas ref="tela" class="f3-tela"></canvas>
      <div ref="sopra" class="f3-sopra"></div>

      <template v-if="mondo || versione">
        <Hud v-bind="foto" />
        <button class="f3-angolo" aria-label="opzioni" data-f3="apri-opzioni" @click="opzioniAperte = !opzioniAperte">⚙</button>
        <button v-if="cameraLibera" class="f3-centra" data-f3="centra" @click="mondo.tornaAllEroe()">⌖ Torna all'eroe</button>

        <BarraAzioni v-if="!costruendo && !trascinando" :modo="modo" :seme="COLTURE[seme].emoji" :da-fare="foto.daFare"
                     @modo="impostaModo" @semina="apriSemina" @tutti="tutti" @costruisci="apriCostruisci" />

        <Vassoio v-if="costruendo" ref="vassoio" :carte="carte" :strumento="strumento" :vista="vista" :testo="suggerimento"
                 :con-annulla="avvisoAnnulla" :bersaglio="!!(trascinando && trascinando.perMettereVia)"
                 @chiudi="chiudiCostruisci" @vista="cambiaVista" @strumento="scegliStrumento" @annulla="mondo.annulla()"
                 @carta-tocco="cartaTocco" @compra="comprare" @inizia="(id, x, y) => mondo.iniziaDaCarta(id, x, y)"
                 @muovi="(x, y) => mondo.muoviTrascinamento(x, y)" @rilascia="(x, y) => mondo.rilascia(x, y)"
                 @annulla-trascinamento="mondo.annullaTrascinamento()" />
        <!-- fuori da Costruisci, un pezzo sollevato tenendo premuto si rilascia sulla mappa o su questa fascia -->
        <div v-if="!costruendo && trascinando" ref="zonaVia" class="f3-zonavia" :class="{ bersaglio: trascinando.perMettereVia }" data-f3="zona-via">
          📦 {{ avvisoTesto || 'Trascinalo dove vuoi, o qui per mettere via' }}
        </div>
        <div v-if="trascinando && trascinando.su" class="f3-trascinato" :style="{ transform: `translate(${trascinando.x}px, ${trascinando.y - 56}px) translate(-50%, -50%)` }">{{ trascinando.emoji }}</div>

        <SceltaSeme v-if="semiAperto" :seme="seme" @scegli="scegliSeme" @chiudi="semiAperto = false" />
        <Pasticceria v-if="pasticceriaAperta" v-bind="pasticceria" @prepara="prepara" @ritira="ritira" @chiudi="pasticceriaAperta = false" />
        <Opzioni v-if="opzioniAperte" :q="q" :stat="stat" :conta="conta" :rapporto="rapporto" @cambia="cambiaOpzioni"
                 @stress="(t, n) => { mondo.stress(t, n); ui.cambio() }" @rapporto="creaRapporto" @ridotto="v => opzioniRidotte = v"
                 @chiudi="opzioniAperte = false; opzioniRidotte = false" />
        <Dialogo v-if="dialogo" v-bind="{ titolo: dialogo.titolo, testo: dialogo.testo, bottoni: dialogo.bottoni }" @scelta="rispostaDialogo" />
      </template>
    </div>
  </div>
</template>

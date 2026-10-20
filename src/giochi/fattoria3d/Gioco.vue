<script setup>
/* La fattoria 3D (in prova) — il coordinatore: le regole sono in motore/fattoria3d.js, il disegno in scena3d/, le tabelle in dati/,
   le finestre in viste/. È l'unico file che sa delle monete vere (state.profile.coins), dei contatori (segna) e del salvataggio
   (profile.campagne.fattoria3d.cfg.stato). Usa raccolti, prodotti e lana suoi: non tocca quelli della fattoria di sempre.
   Senza WebGL 2 non si apre niente: lo si dice e si torna in home. Vedi docs/fattoria3d/. */
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import Barra from '../../components/Barra.vue'
import { state, addCoins, segna, flushNow, persist } from '../../store/profile.js'
import { fasciaAttiva } from '../../store/qualita.js'
import { load, save } from '../../store/storage.js'
import { scelta, ricorda } from '../campagne.js'
import { Fattoria3d } from './motore/fattoria3d.js'
import { haWebGL2 } from './scena3d/webgl.js'
import { dettoDi, dettoDiRifiuto } from './scena3d/detti.js'
import { PEZZI, EDIFICI } from './dati/catalogo.js'
import { COLTURE } from './dati/colture.js'
import { RICETTE, emojiDi } from './dati/ricette.js'
import { avanzamento, roba, nomeDi, livelloDelPezzo } from './dati/livelli.js'
import { COSTI } from './dati/regole.js'
import { clienteDi, LIVELLO_BANCO } from './dati/ordini.js'
import { qualitaIniziale, VERSIONE_OPZIONI } from './dati/qualita.js'
import Hud from './viste/Hud.vue'
import BarraAzioni from './viste/BarraAzioni.vue'
import Vassoio from './viste/Vassoio.vue'
import SceltaSeme from './viste/SceltaSeme.vue'
import Macchina from './viste/Macchina.vue'
import Livelli from './viste/Livelli.vue'
import Banco from './viste/Banco.vue'
import Dialogo from './viste/Dialogo.vue'
import Opzioni from './viste/Opzioni.vue'
import Mappa from './viste/Mappa.vue'
import Visita from './viste/Visita.vue'
import { usaVisite } from './visite.js'
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
const foto = ref({ scorte: '', prodotti: '', lana: 0, daFare: { semina: 0, raccogli: 0 }, livello: 1, quanto: 0 })
const datiLivello = () => { const a = avanzamento(motore.esperienza()); return { livello: a.livello, quanto: a.quanto } }
const ripresa = () => {
  const s = motore.s
  const unisci = (o, em) => Object.entries(o).filter(([, n]) => n > 0).map(([k, n]) => em(k) + ' ' + n).join('  ')
  foto.value = {
    scorte: unisci(s.merci, k => COLTURE[k].emoji) || '🌾 0', prodotti: unisci(s.prodotti, k => emojiDi(k, COLTURE)) || '🍞 0',
    lana: s.lana, daFare: motore.daFare(), ...datiLivello(),
  }
  versione.value++
}
const EVENTI = { terra: 'fattoria3dTerre', pezzo: 'fattoria3dPezzi', raccolto: 'fattoria3dRaccolti', albero: 'fattoria3dAlberi', sasso: 'fattoria3dSassi', visita: 'fattoria3dVisite', aiuto: 'fattoria3dAiuti' }
/** Un livello nuovo: un avviso che passa da sé e un pallino sul gettone finché non si apre il foglio. */
function salito(livello) {
  const testo = `Livello ${livello}: ${nomeDi(livello)}`
  ui.avviso(testo)
  toast.value = { testo, fine: performance.now() + DURATA_TOAST }
  livelloNuovo.value = true
}
/** Un ordine consegnato: il contatore, una riga nel foglio del banco e un avviso sopra la scena. */
function consegnato(e) {
  segna('fattoria3dOrdini')
  const testo = `Consegnato a ${clienteDi(e.cliente).nome}: +${e.premio} ⭐`
  bancoMsg.value = testo
  if (!toast.value || toast.value.fine < performance.now()) toast.value = { testo, fine: performance.now() + DURATA_TOAST }
}
function contaEventi() {
  for (const e of motore.prendiEventi()) {
    if (EVENTI[e.tipo]) segna(EVENTI[e.tipo])
    else if (e.tipo === 'prodotto') segna('fattoria3dProdotti', e.n)
    else if (e.tipo === 'uovo') segna('fattoria3dUova', e.n)
    else if (e.tipo === 'latte') segna('fattoria3dLatte', e.n)
    else if (e.tipo === 'livello') salito(e.livello)
    else if (e.tipo === 'consegna') consegnato(e)
  }
}

// ── il salvataggio: a ritardo, e subito quando la pagina sparisce ──
let sporco = false
function salva({ subito = false } = {}) {
  if (!motore) return
  sporco = false
  ricorda(CHIAVE, 'stato', motore.serializza())
  if (visite.vicini.value) ricorda(CHIAVE, 'vicini', visite.serializza())          // i vicini stanno a parte, accanto allo stato
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
const trascinando = ref(null)            // { emoji, x, y, su, perMettereVia } mentre si trascina un pezzo
const semiAperto = ref(false)
const macchinaAperta = ref(null)         // il tipo della macchina di cui si vede il menu
const macchinaMsg = ref('')
const livelliAperto = ref(false)
const livelloNuovo = ref(false)
const bancoAperto = ref(false)             // il foglio del banco
const bancoMsg = ref('')
const toast = ref(null)                  // { testo, fine }: l'avviso del livello, sopra la scena
const DURATA_TOAST = 4500, DURATA_AVVISO = 6000
let avvisoFine = 0
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
  apriMacchina(tipo) { macchinaMsg.value = ''; macchinaAperta.value = tipo },
  apriBanco() { apriBanco() },
  apriMappa() { visite.apriMappa() },                 // il trattore: la mappa dei villaggi (docs/fattoria3d/vicini.md)
  avviso(testo) {
    avvisoTesto.value = testo || ''
    avvisoFine = testo ? performance.now() + DURATA_AVVISO : 0
  },
  chiudiCostruzione() { if (costruendo.value) chiudiCostruisci() },       // un tocco sulla mappa, non su un pezzo né su un lotto
  fogliAperti: () => !!dialogo.value || semiAperto.value || !!macchinaAperta.value || livelliAperto.value || bancoAperto.value || mappaAperta.value || (opzioniAperte.value && !opzioniRidotte.value),
  zonaDrop: () => ((costruendo.value ? vassoio.value?.radice : zonaVia.value) || null)?.getBoundingClientRect() || null,
  trascinando(info) { trascinando.value = info },
}

// ── le visite ai vicini (visite.js): la mappa del trattore, la scena del villaggio, la cassa e il mercato ──
const telaVisita = ref(null), sopraVisita = ref(null)
const visite = usaVisite({ dammi: () => ({ motore, mondo }), tela: telaVisita, sopra: sopraVisita, q, versione, cambio: () => ui.cambio() })
const { inVisita, mappaAperta, mappaMsg, fase: faseVisita, verso: versoVisita, scheda: schedaVisita, foglio: foglioVisita, storia: storiaVisita,
        messaggio: msgVisita, elenco: elencoVicini, chiave: chiaveTela } = visite

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
  const liv = motore.livello()
  // dai dati, i più vicini per primi: ciò che non è ancora arrivato sta in fondo, in grigio
  const pezzi = Object.entries(PEZZI).sort((a, b) => livelloDelPezzo(a[0]) - livelloDelPezzo(b[0])).map(([id, p]) => ({
    id, emoji: p.emoji, nome: p.nome, pezzo: true, liv: livelloDelPezzo(id), bloccata: livelloDelPezzo(id) > liv,
    prezzo: '🪙 ' + motore.prezzoPezzo(id), nel_magazzino: motore.nelMagazzino(id) }))
  return [...pezzi,
    { id: 'strada', emoji: '🛣️', nome: 'Strada', pezzo: false, prezzo: `🪙 ${COSTI.strada}/pezzo`, nel_magazzino: 0 },
    { id: 'gomma', emoji: '🧽', nome: 'Gomma', pezzo: false, prezzo: 'gratis', nel_magazzino: 0 }]
})
const suggerimento = computed(() => {
  if (avvisoTesto.value) return avvisoTesto.value
  if (strumento.value === 'strada') return `Trascina il dito sulla mappa per disegnare la strada (🪙 ${COSTI.strada} a pezzo).`
  if (strumento.value === 'gomma') return 'Trascina sulle strade che hai disegnato per toglierle.'
  return 'Trascina un pezzo dalla barra alla mappa: lo paghi quando lo lasci. Un pezzo già messo si riprende e si sposta; un terreno scuro si compra toccandolo; un tocco sulla mappa chiude.'
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
  if (PEZZI[id] && livelloDelPezzo(id) > motore.livello()) return ui.avviso(dettoDi('non-sbloccato', { liv: livelloDelPezzo(id) }))
  const costo = motore.costoDiMettere(id)
  ui.avviso(`Trascina «${PEZZI[id].nome}» dalla barra fino alla mappa${costo ? `: costa 🪙 ${costo} e lo paghi quando lo lasci` : ''}`)
}
function rispostaDialogo(i) {
  const d = dialogo.value; dialogo.value = null
  const b = d && d.bottoni[i]; if (b && b.fn) b.fn()
}

// ── il menu di una macchina ──
const macchina = computed(() => {
  void versione.value
  const tipo = macchinaAperta.value; if (!tipo) return null
  const M = motore.macchina(tipo), adesso = motore.ora(), s = motore.s, E = EDIFICI[tipo]
  const pronti = Object.entries(M.pronti).filter(([, n]) => n > 0)
  const dispensa = Object.entries(s.prodotti).filter(([, n]) => n > 0).map(([k, n]) => emojiDi(k, COLTURE) + ' ×' + n)
  return {
    tipo, titolo: E.emoji + ' ' + E.nome,
    forno: Array.from({ length: M.posti }, (_, k) => {
      const it = M.coda[k]; if (!it) return null
      const r = RICETTE[it.ric]
      if (!it.fine) return { emoji: r.emoji, testo: 'in coda', barra: 0 }
      const resto = Math.max(0, it.fine - adesso)
      return { emoji: r.emoji, testo: Math.ceil(resto / 1000) + 's', barra: 100 - 100 * resto / r.ms }
    }),
    pronti: pronti.length ? 'Pronti: ' + pronti.map(([k, n]) => emojiDi(k, COLTURE) + ' ×' + n).join('  ') : '',
    puoRitirare: pronti.length > 0,
    ricette: motore.ricetteDi(tipo).map(r => ({ k: r.id, nome: r.nome, emoji: r.emoji, ms: r.ms, liv: r.liv, sbloccata: r.sbloccata,
      ing: Object.entries(r.ing).map(([i, serve]) => ({ k: i, emoji: emojiDi(i, COLTURE), ha: motore.scortaDi(i), serve })),
      manca: Object.entries(r.mancano).map(([i, n]) => `manca ${emojiDi(i, COLTURE)} ${n}`).join(' '),
      puoi: r.sbloccata && r.ingredienti && M.coda.length < M.posti })),
    dispensa: dispensa.length ? 'In dispensa: ' + dispensa.join('  ') : 'La dispensa è vuota.',
  }
})
function prepara(k) {
  const tipo = macchinaAperta.value
  const r = motore.avviaRicettaIn(tipo, k)
  if (!r.ok) return macchinaMsg.value = dettoDiRifiuto(r)
  macchinaMsg.value = ''; ui.cambio()
}
function ritira() {
  const tipo = macchinaAperta.value
  const r = motore.ritiraDa(tipo)
  if (!r.ok) return
  macchinaMsg.value = ''
  ui.cambio(); mondo.fx.volo('+' + r.n + ' ' + EDIFICI[tipo].emoji, mondo.pezzi.centroDi({ kind: 'edificio', tipo }), 2.6)
  mondo.eroe.avvia('esulta', 0.9)
}

// ── il foglio dei livelli ──
const livelli = computed(() => {
  void versione.value
  const info = avanzamento(motore.esperienza())
  return { info, ora: roba(info.livello), dopo: roba(info.livello + 1), nomeDopo: nomeDi(info.livello + 1) }
})
function apriLivelli() { livelloNuovo.value = false; livelliAperto.value = true }

// ── il banco degli ordini (docs/fattoria3d/ordini.md) ──
const banco = computed(() => {
  void versione.value                        // `ordini()` riempie da sé i posti il cui riposo è finito; il conto alla rovescia vive col battito
  const aperto = motore.bancoAperto(), ordini = motore.ordini()
  const perche = aperto ? '' : motore.livello() < LIVELLO_BANCO ? `Il banco arriva al livello ${LIVELLO_BANCO}.` : 'Metti una bacheca (o una bancarella) sulla mappa: i clienti si fermano lì a chiedere.'
  return { aperto, perche, ordini, pronti: ordini.filter(o => o.pronto).length, visibile: motore.livello() >= LIVELLO_BANCO }
})
function apriBanco() { bancoMsg.value = ''; bancoAperto.value = true }
function consegna(idx) {
  const r = motore.consegna(idx)
  if (!r.ok) return bancoMsg.value = r.motivo === 'mancano' ? dettoDi('mancano-ingredienti', { ingredienti: r.mancano }) : dettoDi(r.motivo)
  ui.cambio()                                // `contaEventi` vede l'evento «consegna» e scrive l'esito
}
function cambiaOrdine(idx) {
  const r = motore.rifiuta(idx)
  if (!r.ok) return bancoMsg.value = dettoDi(r.motivo)
  bancoMsg.value = 'Va bene: il posto si riempie fra qualche minuto.'; ui.cambio()
}

// ── le opzioni di qualità ──
function cambiaOpzioni() { mondo.applica(q); save(CHIAVE_OPZIONI, { v: VERSIONE_OPZIONI, q: { ...q } }) }
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
  const t = performance.now()
  if (toast.value && t >= toast.value.fine) toast.value = null
  if (avvisoFine && t >= avvisoFine) { avvisoFine = 0; avvisoTesto.value = '' }
  cameraLibera.value = mondo.cameraLibera && !costruendo.value
  if (opzioniAperte.value) stat.value = mondo.statistiche()
  if (sporco) salva()
}

function indietro() {
  if (inVisita.value) return void visite.torna()          // in visita, «indietro» riporta a casa, non in home
  salva({ subito: true }); emit('vai', 'home')
}

onMounted(async () => {
  if (!puo.value) return
  motore = new Fattoria3d({ stato: scelta(CHIAVE, 'stato', null), borsa })
  try { const c = await load(CHIAVE_OPZIONI); if (c && c.q && c.v === VERSIONE_OPZIONI) Object.assign(q, c.q) } catch (e) { /* le opzioni di serie */ }
  const { Mondo3d } = await import('./scena3d/mondo3d.js')          // three si scarica solo qui
  if (!vivo) return
  mondo = new Mondo3d({ canvas: tela.value, sopra: sopra.value, motore, ui, qualita: q })
  mondo.avvia()
  visite.avvia(scelta(CHIAVE, 'vicini', null))
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
  visite.via()
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
        <div class="f3-casa" v-show="!inVisita">
        <Hud v-bind="foto" :nuovo="livelloNuovo" :banco="banco" @livello="apriLivelli" @banco="apriBanco" />
        <div v-if="toast" class="f3-toast" data-f3="avviso-livello">⭐ {{ toast.testo }}</div>
        <button class="f3-angolo" aria-label="opzioni" data-f3="apri-opzioni" @click="opzioniAperte = !opzioniAperte">⚙</button>
        <button v-if="cameraLibera" class="f3-centra" data-f3="centra" @click="mondo.tornaAllEroe()">⌖ Torna all'eroe</button>

        <BarraAzioni v-if="!costruendo && !trascinando" :modo="modo" :seme="COLTURE[seme].emoji" :da-fare="foto.daFare"
                     @modo="impostaModo" @semina="apriSemina" @tutti="tutti" @costruisci="apriCostruisci" />

        <Vassoio v-if="costruendo" ref="vassoio" :carte="carte" :strumento="strumento" :vista="vista" :testo="suggerimento"
                 :bersaglio="!!(trascinando && trascinando.perMettereVia)"
                 @chiudi="chiudiCostruisci" @vista="cambiaVista" @strumento="scegliStrumento"
                 @carta-tocco="cartaTocco" @inizia="(id, x, y) => mondo.iniziaDaCarta(id, x, y)"
                 @muovi="(x, y) => mondo.muoviTrascinamento(x, y)" @rilascia="(x, y) => mondo.rilascia(x, y)"
                 @annulla-trascinamento="mondo.annullaTrascinamento()" />
        <!-- fuori da Costruisci, un pezzo sollevato tenendo premuto si rilascia sulla mappa o su questa fascia -->
        <div v-if="!costruendo && trascinando" ref="zonaVia" class="f3-zonavia" :class="{ bersaglio: trascinando.perMettereVia }" data-f3="zona-via">
          📦 {{ avvisoTesto || 'Trascinalo dove vuoi, o qui per mettere via' }}
        </div>
        <div v-if="trascinando && trascinando.su" class="f3-trascinato" :style="{ transform: `translate(${trascinando.x}px, ${trascinando.y - 56}px) translate(-50%, -50%)` }">{{ trascinando.emoji }}</div>

        <SceltaSeme v-if="semiAperto" :seme="seme" :livello="foto.livello" @scegli="scegliSeme" @chiudi="semiAperto = false" />
        <Macchina v-if="macchina" :key="macchina.tipo" v-bind="macchina" :messaggio="macchinaMsg" @prepara="prepara" @ritira="ritira" @chiudi="macchinaAperta = null" />
        <Banco v-if="bancoAperto" v-bind="{ aperto: banco.aperto, perche: banco.perche, ordini: banco.ordini }" :messaggio="bancoMsg"
               @consegna="consegna" @cambia="cambiaOrdine" @chiudi="bancoAperto = false" />
        <Livelli v-if="livelliAperto" v-bind="livelli" @chiudi="livelliAperto = false" />
        <Opzioni v-if="opzioniAperte" :q="q" :stat="stat" :conta="conta" :rapporto="rapporto" @cambia="cambiaOpzioni"
                 @stress="(t, n) => { mondo.stress(t, n); ui.cambio() }" @rapporto="creaRapporto" @ridotto="v => opzioniRidotte = v"
                 @chiudi="opzioniAperte = false; opzioniRidotte = false" />
        <Dialogo v-if="dialogo" v-bind="{ titolo: dialogo.titolo, testo: dialogo.testo, bottoni: dialogo.bottoni }" @scelta="rispostaDialogo" />
        <Mappa v-if="mappaAperta" :elenco="elencoVicini" :messaggio="mappaMsg" @vai="visite.vai" @chiudi="mappaAperta = false" />
        </div>

        <!-- la visita a un vicino: la sua tela e i suoi fogli, mentre la fattoria di casa aspetta ferma -->
        <template v-if="inVisita">
          <canvas :key="chiaveTela" ref="telaVisita" class="f3-vic-tela" data-f3="tela-visita"></canvas>
          <div ref="sopraVisita" class="f3-vic-sopra"></div>
          <Visita :fase="faseVisita" :verso="versoVisita" :scheda="schedaVisita" :foglio="foglioVisita" :storia="storiaVisita" :messaggio="msgVisita" :toast="toast"
                  @torna="visite.torna()" @apri="f => { msgVisita = ''; foglioVisita = f }" @chiudi-foglio="foglioVisita = null" @chiudi-storia="storiaVisita = false"
                  @aiuta="visite.aiuta" @compra="visite.compra" @vendi="visite.vendi" />
        </template>
      </template>
    </div>
  </div>
</template>

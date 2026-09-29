<script setup>
// Il coordinatore: un sotterraneo che si cammina col dito, un posto
// invece che un diagramma (non è il Dungeon a bivi, non lo sostituisce).
// L'unico file che sa che esistono monete, avanzamento salvato e quiz: le
// regole stanno in motore/, i numeri in dati/, il disegno in scena/, le
// schermate in viste/. `corsa.chiesta` dice solo quanto dev'essere
// difficile; qui si va a prendere una domanda vera dai moduli di quiz.
import { ref, shallowRef, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { addCoins, segna, segnaBest } from '../../store/profile.js'
import { progresso, aperta, adesso, stelleDi, completa, sosta, salvaSosta, buttaSosta,
         scelta, ricorda } from '../campagne.js'
import { usaPausa } from '../pausa.js'
import VeloPausa from '../VeloPausa.vue'
import { domandaPerGioco } from '../../quiz/scelta.js'
import Domanda from '../../quiz/Domanda.vue'

import { CAMPAGNA, QUANTE_TAPPE, stelleDella, L_ABISSO, INDICE_ABISSO,
         tappaDi } from './dati/campagna.js'
import { COSE, SEGNI } from './dati/cose.js'
import { MOSTRI } from './dati/mostri.js'
import { CURIOSITA_DI } from './dati/curiosita.js'
import { pezzoAndante } from './dati/tessere.js'
import { EROI, DI_PARTENZA, eroeDi } from './dati/eroi.js'
import { TASCHE, VITA_PER_PIANO } from './dati/mondo.js'
import { Corsa } from './motore/corsa.js'
import { scrivi, leggi, dice } from './motore/sosta.js'
import { Tela } from './scena/tela.js'

import Campagna from './viste/Campagna.vue'
import Eroi from './viste/Eroi.vue'
import Foglio from './viste/Foglio.vue'
import Icona from './viste/Icona.vue'
import { cambioDetto } from './viste/cambio.js'
import { occhio } from './viste/occhio.js'
import Scontro from './viste/Scontro.vue'
import Zaino from './viste/Zaino.vue'
import Mercante from './viste/Mercante.vue'
import Fine from './viste/Fine.vue'
import './stile.css'

defineOptions({ name: 'IlSotterraneo' })
const emit = defineEmits(['vai'])

const CHIAVE = 'sotterraneo'
// il dito si lascia dietro un click che va ingoiato (vedi giochi/fattoria)
const FANTASMA_MS = 100
const FANTASMA_PX = 32
const FERMO_PX = 16   // sotto i 16px Android/iOS considerano il dito ancora fermo

const tela = ref(null)
const corsa = shallowRef(null)
// indice della campagna, o INDICE_ABISSO (−1); null vuol dire nessuna discesa
const tappaIdx = ref(null)
const nellAbisso = computed(() => tappaIdx.value === INDICE_ABISSO)
const domanda = ref(null)
const fine = ref(null)
// un avviso è una riga sola; `dilloDi` porta anche la cosa, per mostrare la sua faccia vera invece di un'emoji
const avviso = ref(null)
const zainoAperto = ref(false)
const scosso = ref(0)
const tic = ref(0)                 // batte quando cambia qualcosa che si vede
// la corsa è uno shallowRef: niente computed a mano su quello che sta dentro (vedi viste/occhio.js)
const dallaCorsa = occhio(corsa, tic)
let ultimoModulo = null
let pittore = null
let orologio = 0
let ultimoAvviso = 0

const avanza = progresso(CHIAVE)

// la pausa (giochi/pausa.js): il ⏸, il telefono posato, il foglio del `?`, e anche il cartello di un
// traguardo (state.festa) — un mostro addosso mentre si guarda una medaglia è un colpo che nessuno vede.
// Non salva vite (a passi, non a riflessi): serve a fermarsi volendo senza uscire.
const { inPausa, fermo, metti, togli, aiuto } = usaPausa({ anche: () => !!fine.value })

// unico posto in cui ⏸ e velo hanno senso: dentro una discesa, senza una domanda (già un velo) e senza il cartello di fine
const siGioca = computed(() => !!corsa.value && !domanda.value && !fine.value)

// si sceglie una volta e resta (cfg.eroe); la prima volta la scelta si presenta da sé
const chiEro = ref(scelta(CHIAVE, 'eroe', null))
// chi sta scendendo (corsa.io) comanda durante una discesa; fuori comanda la scelta (chiEro), che decide chi scenderà
const chiScende = dallaCorsa(c => c.io || null)
const eroeScheda = computed(() => chiScende.value || eroeDi(chiEro.value || DI_PARTENZA))
const scegliEroe = ref(!chiEro.value)

function scegli(k) {
  chiEro.value = ricorda(CHIAVE, 'eroe', k)
  scegliEroe.value = false
  suono.ok()
}

// il ref serve solo a far comparire/sparire la carta "riprendi": la verità sta in archivio (motore/sosta.js)
const conNome = d => (d ? { ...d, chi: d.eroe ? eroeDi(d.eroe).nome : '' } : null)
const ripresa = ref(conNome(dice(sosta(CHIAVE), CAMPAGNA)))
let ultimoSalvato = 0

function salva({ subito = false } = {}) {
  const c = corsa.value
  if (!c || c.finita || tappaIdx.value == null) return
  ultimoSalvato = orologio
  salvaSosta(CHIAVE, scrivi(c, tappaIdx.value), { subito })
}

function scorda() {
  buttaSosta(CHIAVE)
  ripresa.value = null
}

// riprendere non è ricominciare: il piano si rifà dal seme, e sopra ci si rimette quello che era successo
function riprendiDiscesa() {
  const dato = sosta(CHIAVE)
  // un salvataggio vecchio non sa chi stava scendendo: vale la scelta di casa invece del cavaliere di sistema
  const c = dato ? leggi(dato, tappaDi(dato.tappa), chiEro.value || DI_PARTENZA) : null
  if (!c) { scorda(); return }
  togli()   // il telefono posato sulla mappa lascia acceso il freno, o si ritroverebbe dietro un velo non chiesto
  tappaIdx.value = dato.tappa
  fine.value = null
  domanda.value = null
  zainoAperto.value = false
  corsa.value = c
  ripresa.value = null
  suono.nota(180, 90, 0.4, 'sawtooth', 0.12)
  nextTick(() => accendi())
}

/* ═══════════ la mappa delle tappe ═══════════ */
const tappe = computed(() => CAMPAGNA.map((t, i) => ({
  ...t, indice: i,
  aperta: aperta(CHIAVE, i),
  adesso: adesso(CHIAVE, i),
  stelle: stelleDi(CHIAVE, i),
})))

const titolo = computed(() =>
  corsa.value ? tappaDi(tappaIdx.value).nome : 'Il sotterraneo')

// si apre su `libera` (già scritto da giochi/campagne.js); il record sta in `cfg` (sopravvive alla sosta
// buttata) e non in `stelle`, che con una chiave per piano finirebbe in ogni persist() per sempre
const fondoDellAbisso = ref((scelta(CHIAVE, 'abisso', null) || {}).fondo || 0)
const abisso = computed(() => (avanza.libera
  ? { indice: INDICE_ABISSO, nome: L_ABISSO.nome, icona: L_ABISSO.icona,
      dritta: L_ABISSO.dritta, fondo: fondoDellAbisso.value }
  : null))

// si scrive scendendo e non solo alla fine: una discesa che dura tre sere non finisce quasi mai
function segnaIlFondo(piano) {
  if (!piano || piano <= fondoDellAbisso.value) return
  fondoDellAbisso.value = piano
  ricorda(CHIAVE, 'abisso', { fondo: piano })
  segnaBest('sotFondo', piano)
}

const eroe = dallaCorsa(c => {
  const q = c.vita / Math.max(1, c.vitaMax)
  return {
    vita: c.vita, vitaMax: c.vitaMax, quota: q,
    att: c.att, dif: c.dif, gemme: c.gemme,
    piano: c.piano + 1, piani: c.senzaFondo ? null : c.quantiPiani,   // null nell'abisso: "piano 3 di ∞" non è un conto
    chiave: c.chiaveDelPiano,
    // niente quando non se ne ha nessuna; `quota` (0..1) sta qui e non nella vista, che riceve solo il numero
    torcia: c.torciaAccesa
      ? { resta: c.torciaResta, quota: c.torciaResta / (COSE.torcia.stanze || 1),
          scorta: c.torceInScorta, agliSgoccioli: c.torciaResta <= 3 && !c.torceInScorta }
      : null,
    polso: q > 0.6 ? '#4fce7c' : q > 0.3 ? '#f0b429' : '#e0432f',
  }
})

// chi riapre il telefono dopo mezz'ora non sta guardando il gioco: "piano 2 di 3 · ❤️ 24" fa tornare in mente dov'era
const dovEravamo = dallaCorsa(c => `🕳️ piano ${c.piano + 1}`
  + (c.senzaFondo ? '' : ` di ${c.quantiPiani}`)
  + ` · ❤️ ${c.vita}`, '')

// il foglio aperto è sempre lo stesso oggetto: si guarda `c.foglio` per conto proprio, per svegliarsi quando cambia dentro
const foglio = dallaCorsa(c => c.foglio || null)

// il graffio esiste da sempre ma non si vedeva (suono di botta indistinguibile da uno sbaglio): il motore dice dato/preso
const scambio = ref(null)
let scambioFinoA = 0

// cambia a ogni risposta (le ossa restanti erano fatte una volta all'inizio, e restavano ferme)
const nemico = dallaCorsa(c => {
  const f = c.foglio
  if (!f || f.che !== 'scontro') return null
  const scheda = MOSTRI[f.chi.tipo] || {}
  return {
    mostro: f.chi, colpo: c.colpo(f.chi), restano: c.colpiPer(f.chi),
    sprite: scheda.sprite ? pezzoAndante(scheda.sprite, 'fermo', 0) : null,   // la stessa faccia del campo
    graffio: c.graffio(f.chi), male: c.danno(f.chi),   // detti PRIMA di rispondere: con questi si decide restare o scappare
    vita: c.vita, vitaMax: c.vitaMax,
  }
})

const pieni = dallaCorsa(c => c.zaino.length, 0)   // sei su sei vuol dire che la prossima cosa resta per terra

const zaino = dallaCorsa(c => {
  // `nonPuoi` la scrive il motore (perchéNo), che sa chi sta scendendo
  const voce = k => (k ? { chiave: k, ...COSE[k], nonPuoi: c.perchéNo(k) } : null)
  return {
    mano: voce(c.mano), mancina: voce(c.mancina),
    corpo: voce(c.corpo), dito: voce(c.dito),
    tasche: Array.from({ length: TASCHE }, (_, i) => voce(c.zaino[i])),
  }
})

// si rifà a ogni tic (comprare/vendere cambiano tutte e tre le colonne); mercanzia() dice quali righe ci sono
const merce = dallaCorsa(c => c.mercanzia().map(({ chiave: k, sempre }) => ({
  chiave: k, sempre, ...COSE[k], posso: c.gemme >= COSE[k].prezzo,
  nonPuoi: c.perchéNo(k),
  cambio: cambioDetto(c.confronto(k), x => COSE[x].nome),
  mancano: Math.max(0, COSE[k].prezzo - c.gemme),   // senza, una riga che non puoi comprare si legge come una che puoi
  quante: c.quanteNeHo(k),   // le pozioni restano in vendita anche quando ne hai già: serve sapere quante
})), [])

// le tasche, col mezzo prezzo già fatto dal motore; le caselle addosso non ci sono (si ripongono prima)
const daVendere = dallaCorsa(c => Array.from({ length: TASCHE }, (_, i) => {
  const k = c.zaino[i]
  return k ? { chiave: k, ...COSE[k], vale: c.quantoVale(k) } : null
}), [])

const curiosita = dallaCorsa(c => {
  const f = c.foglio
  if (!f || f.che !== 'curiosita') return {}
  return CURIOSITA_DI[f.chi.tipo] || {}
}, {})

const segno = dallaCorsa(c => {
  const f = c.foglio
  return f && f.che === 'porta' ? SEGNI[f.chi.segno] : null
})

const suoni = {
  passo: () => suono.nota(320, 320, 0.05, 'sine', 0.06),
  colpo: () => suono.boom(),
  ahia: () => suono.no(),
  // un tonfo sordo, non suono.no(): rispondendo bene il graffio non può suonare come uno sbaglio
  graffio: () => suono.nota(200, 150, 0.09, 'triangle', 0.07),
  bottino: () => suono.moneta(),
  tesoro: () => suono.livello(),
}

// il seme dall'indirizzo (#seme=812), come gli altri cheat di casa: "riaprilo col seme 812" invece di "fidati"
function semeDallIndirizzo() {
  const n = Number(new URLSearchParams(location.hash.slice(1)).get('seme'))
  return Number.isFinite(n) && n > 0 ? n : null
}

// `#sotterraneo=roba` scende già equipaggiato, per guardare una schermata senza giocare mezza discesa
function corredoDaProva(c) {
  if (new URLSearchParams(location.hash.slice(1)).get('sotterraneo') !== 'roba') return
  c.mano = 'spada-di-ghiaccio'
  c.mancina = 'scudo-ferro'
  c.corpo = 'corazza'
  c.dito = 'teschio-cercatore'
  // le tre armature (mai visibili addosso) e i due gioielli: le cose che si vedono solo qui
  c.zaino = ['panciotto', 'manto', 'saio', 'amuleto-azzurro', 'pozione-grande', 'chiave']
  c.gemme += 120
  // due torce (una accesa, una di scorta): la seconda fa vedere anche il "+1" nella fascia in cima
  c.accendi('torcia')
  c.accendi('torcia')
  // stesso corredo per tutti e quattro: sistemaIlCorredo toglie quello che questa classe non porta, come al rientro
  c.sistemaIlCorredo()
}

// `#abisso=12` comincia già a quel piano, per guardare una schermata senza aspettare due sere di discesa
function pianoDaProva(c) {
  const n = Number(new URLSearchParams(location.hash.slice(1)).get('abisso'))
  if (!c.senzaFondo || !Number.isFinite(n) || n < 2) return
  c.piano = Math.floor(n) - 1
  c.vitaBase += VITA_PER_PIANO * c.piano
  c.vita = c.vitaBase
  c.nuovoPiano()
}

function avvia(i) {
  togli()          // vedi `riprendiDiscesa`: si scende, non si scende in pausa
  scorda()
  tappaIdx.value = i
  fine.value = null
  domanda.value = null
  zainoAperto.value = false
  corsa.value = new Corsa(tappaDi(i), { seme: semeDallIndirizzo(), eroe: chiEro.value || DI_PARTENZA })
  corredoDaProva(corsa.value)
  pianoDaProva(corsa.value)
  suono.nota(180, 90, 0.4, 'sawtooth', 0.12)
  nextTick(() => accendi())
}

function accendi() {
  if (!tela.value || !corsa.value) return
  // il canvas di prima è stato smontato tornando alle discese: il pittore va riagganciato al nuovo
  if (!pittore) pittore = new Tela(tela.value)
  else pittore.attacca(tela.value)
  pittore.misura()
  pittore.segui(corsa.value.livello, corsa.value.eroe.x, corsa.value.eroe.y)
  pittore.avvia()
  giro()
}

// il tempo lo tiene questo file, non il motore: passo(dt) è pura, e il banco può farla girare mille volte in un millisecondo
// misurato sul foglio vero (una quota fissa non funzionerebbe: una domanda disegnata è alta il doppio di due righe di
// testo); rilettura ogni sei fotogrammi perché è una misura del DOM. Lo scontro non c'entra: sta al centro, misura zero.
let altoFoglio = 0, contaGiri = 0
function misuraFoglio() {
  const f = document.querySelector('.sot-foglio')
  altoFoglio = f ? f.getBoundingClientRect().height : 0
}

let raf = 0, prima = 0
function giro() {
  cancelAnimationFrame(raf)
  prima = performance.now()
  const passo = ora => {
    raf = requestAnimationFrame(passo)
    const dt = Math.min(0.05, (ora - prima) / 1000)
    prima = ora
    const c = corsa.value
    // `fermo` (giochi/pausa.js) vale uguale in tutti i giochi; il resto è roba del motore, in uno shallowRef che non avvisa
    if (!c || c.finita || fermo.value) return
    // l'orologio si muove DOPO: contarlo anche in pausa farebbe sparire all'istante la riga lasciata a metà
    orologio += dt
    c.passo(dt)
    // col foglio aperto la telecamera alza l'eroe (lo scontro no: sta al centro e non chiede spazio)
    if ((contaGiri++ % 6) === 0) misuraFoglio()
    // ogni tanto, non a ogni fotogramma: una discesa salvata sono un paio di chilobyte
    if (orologio - ultimoSalvato > 8) salva()
    pittore.segui(c.livello, c.eroe.x, c.eroe.y, altoFoglio)
    pittore.mostra({ corsa: c, orologio })
    guarda(c)
  }
  raf = requestAnimationFrame(passo)
}

// un `tic` a ogni fotogramma ricalcolerebbe mezza schermata sessanta volte al secondo: si confronta una firma corta
let firma = ''
function guarda(c) {
  const f = `${c.vita}|${c.gemme}|${c.foglio ? c.foglio.che : '-'}|${c.chiesta ? c.chiesta.id : 0}` +
            `|${c.piano}|${c.zaino.length}|${c.chiaveDelPiano}|${c.finita}` +
            // tutte e quattro le caselle: uno scudo raccolto camminandoci sopra va nella mancina, un anello al dito
            `|${c.mano}|${c.mancina}|${c.corpo}|${c.dito}` +
            `|${c.torciaResta}|${c.torceInScorta}` +   // la torcia cala da sola, camminando
            `|${c.foglio ? c.foglio.cosa || '' : ''}|${c.livello.robe.length}`   // due cose trovate di fila hanno lo stesso `che`
  if (f !== firma) { firma = f; tic.value++ }
  if (c.avvisi.length) {
    const a = c.avvisi.shift()
    avviso.value = typeof a === 'string' ? { testo: a } : { ...a, ...(COSE[a.cosa] || {}) }
    ultimoAvviso = orologio
  } else if (avviso.value && orologio - ultimoAvviso > 1.8) avviso.value = null
  if (scambio.value && orologio > scambioFinoA) scambio.value = null
}

// `tic` è la dipendenza: la corsa è uno shallowRef, e senza il tic in cima questo watcher scatterebbe solo
// alla nascita di una corsa nuova — la domanda non comparirebbe mai, senza un errore da nessuna parte
watch(() => { tic.value; return corsa.value?.chiesta?.id }, (id) => {
  if (!id) { domanda.value = null; return }
  const chiesta = corsa.value.chiesta
  try {
    const q = domandaPerGioco({ difficolta: chiesta.difficolta, evita: ultimoModulo })
    if (!q?.domanda) throw new Error('nessun modulo di quiz')
    ultimoModulo = q.modulo
    domanda.value = q
  } catch (e) {
    // senza moduli non si blocca un bambino davanti a una porta: si apre e via
    domanda.value = null
    risolvi(true)
  }
})

function risposto({ giusto }) {
  domanda.value = null
  // rispondere È il tocco che riprende: il freno può essersi acceso durante la domanda
  togli()
  risolvi(giusto)
}

function risolvi(giusto) {
  const c = corsa.value
  if (!c) return
  const esito = c.rispondi(giusto)
  // nell'abisso una risposta giusta paga subito, non a fine discesa
  if (giusto && nellAbisso.value) addCoins(1)
  tic.value++
  salva()
  if (!esito) return
  scosso.value++
  // resta a schermo un paio di secondi: il tempo di leggerlo mentre la domanda dopo si sta già montando
  if (esito.dato != null || esito.preso != null) {
    scambio.value = { dato: esito.dato || 0, preso: esito.preso || 0, caduto: esito.che === 'caduto' }
    scambioFinoA = orologio + 2.4
  }
  switch (esito.che) {
    case 'colpo': suoni.colpo(); if (esito.male) setTimeout(() => suoni.graffio(), 200); break
    case 'caduto': suoni.colpo(); setTimeout(() => suoni.bottino(), 260); break
    case 'ferito': suoni.ahia(); break
    case 'svenuto': suono.fine(); break
    case 'tesoro': suoni.tesoro(); break
    case 'curiosita': esito.buono ? suoni.tesoro() : suoni.graffio(); break
    case 'aperta': suono.ok(); break
    case 'bevuto': suoni.tesoro(); break
    default: suono.no()
  }
}

// scappare costa un graffio (Corsa.scappa), quindi può anche far svenire: il foglio che compare da solo lo dice
function scappa() {
  const e = corsa.value.scappa()
  domanda.value = null
  togli()          // stessa ragione di `risposto`: scappare è un tocco
  tic.value++
  if (e?.che === 'svenuto') suono.fine()
  else { suoni.graffio(); setTimeout(() => suoni.passo(), 160) }
  salva()
}
function chiudiFoglio() { corsa.value.chiudi(); domanda.value = null; tic.value++ }
// "riprovo" rimette in piedi all'ingresso, tranne all'ultima occasione dove riprendi() risale e la discesa è finita
function riprendi() {
  const c = corsa.value
  c.riprendi()
  tic.value++
  if (c.finita) chiudi()
}
function compra(k) { const e = corsa.value.compra(k); tic.value++; if (e?.che === 'comprato') suono.compra(); salva() }
function vendi(i) { const e = corsa.value.vendi(i); tic.value++; if (e) suoni.bottino(); salva() }
function usa(i) { corsa.value.usa(i); tic.value++; suono.ok(); salva() }
function butta(i) { corsa.value.butta(i); tic.value++; suoni.passo(); salva() }
function riponi(dove) { corsa.value.riponi(dove); tic.value++; suono.ok(); salva() }

function scendi() {
  const e = corsa.value.scendi()
  tic.value++
  if (e?.che === 'finita') return chiudi()
  suono.livello()
  if (nellAbisso.value) segnaIlFondo(corsa.value.piano + 1)
  salva()          // un piano nuovo è il momento in cui si perde di più
}

function chiudi() {
  const c = corsa.value
  if (!c) return
  if (!c.finita) c.risali()
  const e = c.esito
  const stelle = stelleDella(e)
  // l'abisso non si butta (finisce la sera, non la discesa): si scrive il punto da cui si rientra
  const eraIlFondo = fondoDellAbisso.value   // il record DI PRIMA: segnaIlFondo lo sposta subito dopo
  if (nellAbisso.value) {
    segnaIlFondo(e.fondo)
    salvaSosta(CHIAVE, scrivi(c, INDICE_ABISSO, { anchePerFinite: true }), { subito: true })
    ripresa.value = conNome(dice(sosta(CHIAVE), CAMPAGNA))
  } else scorda()

  // prima l'avanzamento, poi i contatori: i traguardi in segna() devono vedere la tappa già segnata come fatta
  if (e.vinta) completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle })

  segna('sotStanze', e.stanze)
  segna('sotPiani', e.piani)
  if (e.mostri) segna('sotMostri', e.mostri)
  if (e.tesori) segna('sotTesori', e.tesori)
  segnaBest('sotGemme', e.gemme)

  // l'abisso ha già pagato 🪙1 a ogni risposta giusta (risolvi): qui si mostra soltanto il totale
  const monete = nellAbisso.value ? e.giuste
    : e.vinta ? CAMPAGNA[tappaIdx.value].premio * Math.max(1, stelle) : 0
  if (monete && !nellAbisso.value) addCoins(monete)
  if (e.vinta) { if (e.svenimenti === 0) segna('sotInteri'); suono.livello() } else suono.fine()

  fine.value = { vinta: e.vinta, titolo: tappaDi(tappaIdx.value).nome, stelle, monete, fatti: e,
                 abisso: nellAbisso.value, record: e.fondo > eraIlFondo }
}

function ancora() {
  const vinta = fine.value.vinta
  // dall'abisso si torna alla mappa: "ci riprovo" ricomincerebbe dal piano 1, buttando quello appena salvato
  const allaFila = vinta || fine.value.abisso
  fine.value = null
  if (allaFila) return allaMappa()
  avvia(tappaIdx.value)
}

function allaMappa() {
  cancelAnimationFrame(raf)
  togli()
  if (pittore) pittore.ferma()
  fine.value = null
  domanda.value = null
  corsa.value = null
}

// uscire a metà non chiude più la discesa: si scrive dove si era. Si salva SEMPRE, anche dopo due passi:
// quello che si perde non sono le gemme, è la mappa già girata (docs/sotterraneo/regole.md)
function indietro() {
  if (!corsa.value && !fine.value) return emit('vai', 'home')
  const c = corsa.value
  if (c && !c.finita && !fine.value) {
    salva({ subito: true })
    ripresa.value = conNome(dice(sosta(CHIAVE), CAMPAGNA))
  }
  allaMappa()
}

/* ═══════════ il dito ═══════════ */
const dita = new Map()
let pizzico = 0, premuto = false, giu = null, ultimoTrascina = 0

function punto(e) {
  const r = tela.value.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}

function premi(e) {
  dita.set(e.pointerId, e)
  if (corsa.value?.foglio || zainoAperto.value || fine.value) return
  if (dita.size > 1) { premuto = false; return }
  premuto = true
  giu = { x: e.clientX, y: e.clientY }
  tela.value.setPointerCapture?.(e.pointerId)
  vai(punto(e), true)
}

// trascinando, l'eroe insegue il dito senza toccare quaranta volte; ricalcolato di rado, o il percorso tremerebbe
function muovi(e) {
  if (dita.has(e.pointerId)) dita.set(e.pointerId, e)
  if (dita.size === 2) return pizzica()
  if (!premuto || corsa.value?.foglio) return
  if (giu && Math.hypot(e.clientX - giu.x, e.clientY - giu.y) < FERMO_PX) return
  const ora = performance.now()
  if (ora - ultimoTrascina < 140) return
  ultimoTrascina = ora
  vai(punto(e), false)
}

function pizzica() {
  premuto = false                                   // due dita non camminano
  const [a, b] = [...dita.values()]
  const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
  if (!pizzico) { pizzico = d; return }
  if (Math.abs(d - pizzico) < 45) return
  if (pittore.zoomA(pittore.scala + (d > pizzico ? 1 : -1))) suoni.passo()
  pizzico = d
}

function lascia(e) {
  if (e.pointerType !== 'mouse') zittisciIlFantasma(e.clientX, e.clientY)
  dita.delete(e.pointerId)
  if (dita.size < 2) pizzico = 0
  premuto = false
  giu = null
}

function zittisciIlFantasma(x, y) {
  const t0 = performance.now()
  const smetti = () => removeEventListener('click', zitto, true)
  const zitto = ev => {
    if (performance.now() - t0 > FANTASMA_MS) return smetti()
    if (Math.hypot(ev.clientX - x, ev.clientY - y) > FANTASMA_PX) return
    ev.stopPropagation(); ev.preventDefault(); smetti()
  }
  addEventListener('click', zitto, true)
  setTimeout(smetti, FANTASMA_MS + 20)
}

function vai(p, preciso) {
  const c = corsa.value
  if (!c || c.finita) return
  c.vaiVerso(pittore.cellaDa(p.x, p.y), preciso)
  tic.value++
}

function rotella(e) {
  if (!pittore) return
  pittore.zoomA(pittore.scala + (e.deltaY < 0 ? 1 : -1))
}

function nienteClickDalCampo(e) { if (e.cancelable) e.preventDefault() }

// su un telefono l'app non si chiude, sparisce: visibilitychange è l'ultimo momento per scrivere.
// giochi/pausa.js ferma la discesa ascoltando lo stesso evento: qui resta solo la scrittura
function seSparisce(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden') salva({ subito: true })
}

onMounted(() => {
  addEventListener('resize', ridimensiona)
  // `visibilitychange` si ascolta sul document (dove viene lanciato); `pagehide` è della finestra
  document.addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
})
onUnmounted(() => {
  salva({ subito: true })
  removeEventListener('resize', ridimensiona)
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
  cancelAnimationFrame(raf)
  if (pittore) pittore.ferma()
})
function ridimensiona() { if (pittore) pittore.misura() }
</script>

<template>
  <div class="schermo">
    <!-- il ⏸ solo dentro una discesa: sulla mappa non c'è niente da fermare -->
    <Barra :titolo="titolo" guida="sotterraneo" @aiuto="aiuto" :monete="!corsa" scura
           :pausa="siGioca" @pausa="metti()" @indietro="indietro">
      <button v-if="corsa && eroe" class="sot-io" data-azione="zaino-barra"
              aria-label="lo zaino" @click="zainoAperto = true">
        <span class="sot-polso" :style="{ '--sot-polso': eroe.polso }">
          <i :style="{ width: eroe.quota * 100 + '%' }"></i>
          <b>{{ eroe.vita }}</b>
        </span>
        <span class="sot-n em">⚔️<b>{{ eroe.att }}</b></span>
        <span class="sot-n em">🛡️<b>{{ eroe.dif }}</b></span>
        <span class="sot-n em">💎<b>{{ eroe.gemme }}</b></span>
        <span class="sot-n em">🎒</span>
      </button>
    </Barra>

    <div class="sot">
      <template v-if="!corsa">
        <Campagna :tappe="tappe" :ripresa="ripresa" :eroe="eroeScheda" :abisso="abisso"
                  @gioca="avvia" @riprendi="riprendiDiscesa" @scorda="scorda"
                  @eroe="scegliEroe = true" />
        <Eroi v-if="scegliEroe" :eroi="EROI" :scelto="chiEro || ''" :primo="!chiEro"
              @scegli="scegli" @chiudi="scegliEroe = false" />
      </template>

      <template v-else>
        <div class="sot-campo">
          <!-- il campo si tocca coi puntatori: il click che il dito lascia finirebbe sul foglio appena aperto -->
          <canvas ref="tela" class="sot-tela"
                  @pointerdown="premi" @pointermove="muovi" @pointerup="lascia"
                  @pointercancel="lascia" @touchend="nienteClickDalCampo"
                  @wheel.prevent="rotella"></canvas>

          <p class="sot-piede">
            piano {{ eroe.piano }}<template v-if="eroe.piani"> di {{ eroe.piani }}</template> ·
            <span v-if="eroe.chiave" class="em">🗝️ la scala è aperta</span>
            <span v-else>la chiave ce l'ha qualcuno, qua sotto</span>
          </p>
          <!-- lo zaino: un tasto tondo in basso a destra (dove il pollice arriva), non la fascia in cima -->
          <button class="sot-zaino-tasto" data-azione="zaino" aria-label="zaino"
                  @click="zainoAperto = true">
            <span class="em">🎒</span>
            <b>{{ pieni }}/{{ TASCHE }}</b>
          </button>

          <!-- quanta luce resta: la fiamma cala nel suo lume, così il buio si vede arrivare. In basso a
               sinistra e non nella fascia in cima, che è già piena (`.sot-io` non ha posto per un'altra colonnina) -->
          <p v-if="eroe.torcia" class="sot-torcia" data-torcia
             :class="{ 'sot-sgoccioli': eroe.torcia.agliSgoccioli }">
            <!-- l'emoji dice di cosa è la colonnina: da sola è solo una barretta arancione -->
            <span class="em">🔦</span>
            <i class="sot-lume"><u :style="{ height: eroe.torcia.quota * 100 + '%' }"></u></i>
            <b>{{ eroe.torcia.resta }}</b>
            <em v-if="eroe.torcia.scorta">+{{ eroe.torcia.scorta }}</em>
          </p>

          <p v-if="avviso" class="sot-avviso">
            <Icona v-if="avviso.cosa" :sprite="avviso.sprite" :em="avviso.em" :emAlto="20" />
            {{ avviso.testo }}
          </p>
        </div>

        <!-- lo scontro sta al centro, non sale dal basso: un mostro addosso arriva mentre si cammina, e in
             fondo allo schermo chi guarda il proprio eroe non lo vedrebbe. Niente classe `sot-foglio`
             apposta: `misuraFoglio()` cerca quella, e non trovandola la telecamera non fa spazio a un pannello -->
        <div v-if="foglio && foglio.che === 'scontro'" class="sot-velo">
          <div class="sot-modale">
            <Scontro v-bind="nemico" :scosso="scosso" :scambio="scambio" />
            <div v-if="domanda" class="sot-domanda">
              <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                       :origine="domanda" gioco="sotterraneo" :respiro="900"
                       @risposto="risposto" />
            </div>
            <!-- il costo sta sul tasto: si vede prima, non nell'avviso che arriva dopo -->
            <button class="sot-grosso sot-chiaro" data-azione="scappa" @click="scappa">
              <span class="em">🏃</span> scappo via
              <small v-if="nemico">ti graffia ❤️ −{{ nemico.graffio }}</small>
            </button>
          </div>
        </div>

        <Foglio v-else-if="foglio && foglio.che === 'porta'" em="🚪" titolo="Una porta chiusa"
                :dice="segno ? segno.em + ' ' + segno.dice : ''">
          <div v-if="domanda" class="sot-domanda">
            <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                     :origine="domanda" gioco="sotterraneo" :respiro="900"
                     @risposto="risposto" />
          </div>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            ci torno dopo
          </button>
        </Foglio>

        <Foglio v-else-if="foglio && foglio.che === 'forziere'" em="🎁" titolo="Un forziere"
                dice="Una domanda sola. Se la sbagli, resta chiuso per sempre.">
          <div v-if="domanda" class="sot-domanda">
            <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                     :origine="domanda" gioco="sotterraneo" :respiro="900"
                     @risposto="risposto" />
          </div>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            non me la sento
          </button>
        </Foglio>

        <Foglio v-else-if="foglio && foglio.che === 'fonte'" em="⛲" titolo="Una fonte"
                dice="Acqua pulita. Rispondi e bevi.">
          <div v-if="domanda" class="sot-domanda">
            <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                     :origine="domanda" gioco="sotterraneo" :respiro="900"
                     @risposto="risposto" />
          </div>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            più tardi
          </button>
        </Foglio>

        <!-- al centro come lo zaino: qui si sceglie, non si cammina -->
        <Foglio v-else-if="foglio && foglio.che === 'mercante'" em="🧙" titolo="Il mercante" centro
                :dice="`Hai 💎 ${eroe.gemme}. Quello che compri finisce nello zaino.`">
          <Mercante :roba="merce" :tasche="daVendere" :gemme="eroe.gemme"
                    @compra="compra" @vendi="vendi" @chiudi="chiudiFoglio" />
        </Foglio>

        <!-- una curiosità: il foglio non si chiude da sé, la battuta è il premio vero -->
        <Foglio v-else-if="foglio && foglio.che === 'curiosita'"
                :em="curiosita.em" :sprite="curiosita.pezzo"
                :titolo="curiosita.nome"
                :dice="foglio.esito ? '' : curiosita.dice + ' Può andare bene, o male.'">
          <template v-if="foglio.esito">
            <p class="sot-storia">{{ foglio.esito.dice }}</p>
            <p v-if="foglio.esito.conto" class="sot-cambio em"
               :class="{ 'sot-meglio': foglio.esito.buono }">{{ foglio.esito.conto }}</p>
            <button class="sot-grosso" data-azione="avanti" @click="chiudiFoglio">
              vado avanti
            </button>
          </template>
          <template v-else>
            <div v-if="domanda" class="sot-domanda">
              <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                       :origine="domanda" gioco="sotterraneo" :respiro="900"
                       @risposto="risposto" />
            </div>
            <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
              lascio perdere
            </button>
          </template>
        </Foglio>

        <Foglio v-else-if="foglio && foglio.che === 'chiusa'" em="🔒" titolo="La scala è chiusa"
                :dice="foglio.visto && foglio.chi
                  ? `Un cancello di ferro. La chiave ce l'ha ${foglio.chi.nome.toLowerCase()}, ed è segnato in oro sulla mappina.`
                  : 'Un cancello di ferro, e la serratura non ha buco per le dita. La chiave ce l\'ha qualcuno, qua sotto.'">
          <button class="sot-grosso" data-azione="cerca" @click="chiudiFoglio">
            vado a cercarla
          </button>
        </Foglio>

        <Foglio v-else-if="foglio && foglio.che === 'scala'" em="🕳️" titolo="La scala che scende"
                :dice="foglio.ultimo
                  ? 'Da qui si risale, e quello che hai trovato resta la tua storia.'
                  : 'Sotto è più buio, i mostri hanno più ossa e le domande si fanno toste. Quello che hai addosso scende con te.'">
          <button class="sot-grosso" data-azione="scendi" @click="scendi">
            {{ foglio.ultimo ? 'esco dal sotterraneo' : `scendo al piano ${eroe.piano + 1}` }}
          </button>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            prima giro ancora
          </button>
        </Foglio>

        <!-- svenuto: finché ci sono occasioni si dice quante ne restano; nell'abisso le frasi cambiano
             perché là si perde lo zaino intero e la discesa non ricomincia da capo (docs/sotterraneo/regole.md) -->
        <Foglio v-else-if="foglio && foglio.che === 'svenuto'" em="💫"
                :titolo="foglio.ultimo && !nellAbisso ? 'Non ti reggi più in piedi'
                         : foglio.ultimo ? 'Per stasera basta' : 'Ti sei svegliato all\'ingresso'"
                :dice="nellAbisso
                  ? (foglio.ultimo
                      ? 'Ti hanno portato su. L\'abisso resta dov\'è: ci si rientra da questo piano, con quello che hai addosso.'
                      : 'Qualcuno ti ha trascinato all\'ingresso. Quello che avevi nelle tasche non c\'è più, ma quello che avevi addosso sì.')
                  : foglio.ultimo
                    ? 'Ti hanno portato su. Il sotterraneo resta lì: questa discesa ricomincia da capo.'
                    : 'Qualcuno ti ha trascinato fuori. Le gemme che avevi in tasca non ci sono più, ma quello che avevi addosso sì.'">
          <p v-if="!foglio.ultimo" class="sot-storia">
            Ancora <b>{{ foglio.restano }}</b>
            {{ foglio.restano === 1 ? 'volta' : 'volte' }}, poi si risale.
          </p>
          <button class="sot-grosso" data-azione="riprendi" @click="riprendi">
            {{ !foglio.ultimo ? 'riprovo' : nellAbisso ? 'torno su per stasera' : 'torno su' }}
          </button>
        </Foglio>

        <!-- lo zaino al centro, come lo scontro: dal basso sembrava un'appendice del campo -->
        <Foglio v-else-if="zainoAperto" em="🎒" titolo="Lo zaino" centro>
          <Zaino v-bind="zaino" :eroe="eroeScheda" :torcia="eroe.torcia"
                 :att="eroe.att" :dif="eroe.dif" :gemme="eroe.gemme"
                 :vita="eroe.vita" :vitaMax="eroe.vitaMax"
                 :piano="eroe.piano" :piani="eroe.piani"
                 @usa="usa" @butta="butta" @riponi="riponi"
                 @chiudi="zainoAperto = false" />
        </Foglio>

        <Fine v-if="fine" v-bind="fine" @ancora="ancora" @esci="allaMappa" />
      </template>

      <!-- sta in fondo e fuori da tutto: la domanda e il cartello di fine hanno già la loro pausa -->
      <VeloPausa v-if="inPausa && siGioca" :dove="dovEravamo" @riprendi="togli" />
    </div>
  </div>
</template>

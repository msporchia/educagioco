<script setup>
// Il coordinatore: l'unico file che sa che esistono le monete vere e
// l'avanzamento. Le regole stanno in `motore/`, i numeri in `dati/`, il
// disegno in `scena/`, le schermate in `viste/`. Una scelta (costruire,
// potenziare, riparare…) si paga con monete di battaglia E con un calcolo:
// il calcolo lo chiede `domande.js`, il campo intanto rallenta (non si ferma:
// la pressione resta). Vedi docs/arena/regole.md.
import { ref, shallowRef, computed, onMounted, onUnmounted } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { segna, state, etaDelBambino, contiPermessi } from '../../store/profile.js'
import { borsa } from '../../store/varieta.js'   // paga e dice se il salvadanaio è stanco
import { PAGA } from '../../data/paghe.js'
import { progresso, aperta, adesso, stelleDi, completa, sosta, salvaSosta, buttaSosta, ritocca } from '../campagne.js'
import { apertaQui } from '../../data/portata-giochi.js'
import { usaPausa } from '../pausa.js'
import VeloPausa from '../VeloPausa.vue'
import Domanda from '../../quiz/Domanda.vue'
import { Giostra } from './scena/giostra.js'
import { vistaDa, eventiDa } from './scena/prospettiva.js'
import { Regia, SILENZIO } from './sfida/regia.js'
import { creaStanza, collega } from './sfida/rete.js'

import { CAMPAGNA, SCALINI, QUANTE_TAPPE, INFINITA, tappeDelloScalino, scalinoDi, scalinoDelTerreno, terrenoDiverso, operazioniDi, operazionePer, senzaSaperi, PESO_DEL_RIPIEGO, stellePer, sfidaDi, sfidaInfinita, LIVELLI, livelloValido } from './dati/campagna.js'
import { TRUPPE, EDIFICI, EDIFICIO_DI, AZIONI, BOMBA, POSTI, CAMPO, CRESCITA, truppeDelTerreno } from './dati/regole.js'
import { Partita } from './motore/partita.js'
import { scrivi, leggi, dice } from './motore/sosta.js'
import { Campo } from './scena/campo.js'
import { dettaglioTruppa, dettaglioAzione, ruoloDi } from './motore/dettagli.js'
import { domandaDi } from './domande.js'
import { basi, gradoDi, dopoLaRisposta } from './bravura.js'

import Mappa from './viste/Mappa.vue'
import CampoVista from './viste/Campo.vue'
import Finale from './viste/Finale.vue'
import Sfida from './viste/Sfida.vue'
import Dettagli from './viste/Dettagli.vue'
import './stile.css'

defineOptions({ name: 'CastleBattle' })
const emit = defineEmits(['vai'])

const CHIAVE = 'arena'
const RESPIRO = 900           // quanto si guarda il campo dopo l'ultima mossa, prima del cartello

let borsellino = borsa(CHIAVE)   // le monete vere di questa partita, un calcolo giusto alla volta

const vista = ref('mappa')            // mappa | campo | sfida
const tappaIdx = ref(0)
/* la sfida in due (docs/arena/multigiocatore.md): `regia` fa parlare i due telefoni, e `mio` è il lato di chi gioca qui
   (chi ospita è `io`, l'ospite `nem`: il mondo è uno solo e l'ospite lo vede specchiato, scena/prospettiva.js) */
const regia = shallowRef(null)
const statoSfida = ref('')            // lo stato della regia, per la schermata (la regia non è reattiva)
const motivoSfida = ref('')
const faseSfida = ref('scelta')       // scelta | creo | attesa | entro
const codiceSfida = ref('')
const errore = ref('')
const altroMuto = ref(false)          // l'altro non manda niente da troppo
const mio = computed(() => (regia.value ? regia.value.mio : 'io'))
const inDue = () => !!regia.value && regia.value.stato === 'gioco'
const livello = ref(livelloValido(progresso(CHIAVE).livello))   // facile | medio | difficile: lo sceglie la mappa
const infinita = ref(null)            // il terreno, se si gioca la battaglia infinita (niente tappa)
const chiaveCampo = ref(0)            // sale a ogni battaglia: il campo si rimonta, col suo terreno
const partita = shallowRef(null)      // il motore: NON reattivo dentro
const cruscotto = ref(vuoto())
const pannello = ref({ bersagli: [], anello: null, scelta: null, azioni: [] })
const anello = ref(null)              // l'edificio toccato, con l'anello di pulsanti attorno: { chiave, posto } o { chiave, castello }
const domanda = ref(null)             // la domanda che paga la scelta
const finale = ref(null)
const dettaglio = ref(null)           // la schermata dei dettagli: il campo sta fermo finché è aperta
const scelta = ref(null)              // quale truppa per un edificio da costruire: anche qui il campo sta fermo
const avviso = ref('')                // la riga che dice cosa è successo
const toccato = ref(false)

let voluta = null                     // la scelta che si sta pagando
let campo = null
let attesa = 0
let orologio = 0
let orologioAvviso = 0
let daSalvare = 0
let ora = 0
const giostra = new Giostra(passo)

const { inPausa, fermo, metti, togli, aiuto } = usaPausa({ anche: () => !!finale.value || !!dettaglio.value || !!scelta.value })

const avanza = progresso(CHIAVE)
const tappa = computed(() => CAMPAGNA[tappaIdx.value] || CAMPAGNA[0])
const scalino = computed(() => scalinoDi(tappa.value))
const ammesse = computed(() => (infinita.value ? truppeDelTerreno(infinita.value) : tappa.value.truppe))
const operazioniAttive = computed(() => (infinita.value ? INFINITA.operazioni : operazioniDi(tappa.value)))
const titoloPartita = computed(() => (regia.value ? 'La sfida' : infinita.value ? INFINITA.nome : tappa.value.nome))
const siGioca = computed(() => vista.value === 'campo' && !regia.value && !domanda.value && !finale.value && !dettaglio.value && !scelta.value)

function vuoto() {
  return { resto: 0, monete: 0, alSecondo: 0, castello: 1, miniera: 1 }
}

const dovEravamo = computed(() => {
  if (cruscotto.value.infinita) {
    const t = Math.max(0, Math.floor(cruscotto.value.t))
    return `♾️ da ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')} · 💎 ${cruscotto.value.monete}`
  }
  const s = Math.max(0, Math.ceil(cruscotto.value.resto))
  return `⏱️ mancano ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} · 💎 ${cruscotto.value.monete}`
})

/* ── la mappa ── */
const scalini = computed(() => SCALINI.map(s => ({
  ...s,
  tappe: tappeDelloScalino(s.chiave).map(t => ({
    ...t,
    operazioni: operazioniDi(t),
    aperta: aperta(CHIAVE, t.indice),
    adesso: adesso(CHIAVE, t.indice),
    stelle: stelleDi(CHIAVE, t.indice),
  })),
})))

/* la battaglia infinita, in cima: si apre come una tappa che viene dopo l'ultima (campagna finita). Niente record: una battaglia senza fine non ha un tempo da battere */
const laInfinita = computed(() => {
  const fatte = progresso(CHIAVE).tappa
  return {
    nome: INFINITA.nome, icona: INFINITA.icona, racconto: INFINITA.racconto,
    aperta: apertaQui(INFINITA, QUANTE_TAPPE, fatte),
    motivo: `finisci le ${QUANTE_TAPPE} tappe`,
  }
})

/* ── la partita lasciata a metà ── */
const ripresa = ref(laRipresa())

function laRipresa() {
  const d = dice(sosta(CHIAVE))
  if (d && d.infinita) return { emoji: INFINITA.icona, nome: d.nome, dettaglio: `${scalinoDelTerreno(d.terreno)?.nome} · da ${d.restano} · 💎 ${d.monete}` }
  return d && { emoji: '⚔️', nome: d.nome, dettaglio: `mancano ${d.restano} · 💎 ${d.monete}` }
}

function salva({ subito = false } = {}) {
  const p = partita.value
  if (!p || regia.value) return        // una sfida in due non si lascia a metà
  daSalvare = 0
  salvaSosta(CHIAVE, scrivi(p, infinita.value ? { infinita: infinita.value } : tappaIdx.value, livello.value), { subito })
}

function scorda() {
  buttaSosta(CHIAVE)
  ripresa.value = null
}

function riprendiPartita() {
  const letto = leggi(sosta(CHIAVE))
  if (!letto) return scorda()          // la carta sparisce, la mappa resta
  clearTimeout(attesa); attesa = 0
  tappaIdx.value = Math.max(0, letto.indice)
  infinita.value = letto.terreno || null
  livello.value = letto.livello
  chiaveCampo.value++
  partita.value = letto.partita
  azzera()
  toccato.value = true
  metti({ auto: true })  // il campo ripreso nasce fermo: non l'ha chiesto nessuno
  vista.value = 'campo'
  ripresa.value = null
}

function azzera() {
  domanda.value = null
  finale.value = null
  dettaglio.value = null
  scelta.value = null
  avviso.value = ''
  voluta = null
  pagata = false
  contata = false
  borsellino = borsa(CHIAVE)
  aggiornaCruscotto()
}

/* ── i suoni: il motore non suona, dice cosa è successo. L'audio non porta
   informazione: ogni cosa che si sente si vede anche. ── */
let ultimoColpo = 0
function suona(eventi) {
  const visti = new Set()
  for (const e of eventi) {
    if (e.tipo === 'colpo') {
      const t = performance.now()
      if (t - ultimoColpo < 120) continue
      ultimoColpo = t
      suono.nota(e.lato === mio.value ? 720 : 520, 240, 0.05, 'triangle', 0.035)
      continue
    }
    if (visti.has(e.tipo)) continue
    visti.add(e.tipo)
    if (e.tipo === 'costruita' || e.tipo === 'potenziata' || e.tipo === 'castello' || e.tipo === 'miniera') suono.compra()
    else if (e.tipo === 'crollo') suono.rumore(0.4, 0.09, 400, 80)
    else if (e.tipo === 'bomba') { suono.rumore(0.6, 0.14, 300, 60); suono.nota(160, 40, 0.4, 'sawtooth', 0.1) }
    else if (e.tipo === 'cura') suono.vita()
  }
}

/* ── il battito ── */
function passo(dt) {
  const p = partita.value
  if (!p) return
  ora += dt
  const duello = inDue()
  // mentre si calcola il campo è fermo del tutto (vedi docs/arena/calcoli.md); in due corre sempre: non si ferma per uno solo
  const scala = !duello && (fermo.value || p.fine || domanda.value) ? 0 : 1
  if (duello) {
    regia.value.sessione.avanza(dt)
    regia.value.controlla()
    const muto = regia.value.silenzio > SILENZIO
    if (muto !== altroMuto.value) altroMuto.value = muto
  } else if (scala) {
    p.avanza(dt * scala)
    daSalvare += dt
    if (daSalvare > 5) salva()
  }
  const eventi = eventiDa(p.prendiEventi(), mio.value)
  campo?.eventi(eventi, ora)
  if (eventi.length) suona(eventi)
  if (p.fine && !finale.value && !attesa) attesa = setTimeout(chiudiPartita, RESPIRO)
  orologio += dt
  if (orologio > 0.2) { orologio = 0; aggiornaCruscotto() }
  campo?.disegna(vistaDa(p, mio.value), ora)
}

function aggiornaCruscotto() {
  const p = partita.value
  if (!p) return
  cruscotto.value = {
    resto: p.resto, t: p.t, infinita: !Number.isFinite(p.resto), monete: Math.floor(p.lati[mio.value].monete), alSecondo: p.alSecondo(mio.value),
    castello: p.castello(mio.value).liv, miniera: p.lati[mio.value].miniera,
  }
  pannello.value = costruisciPannello(p)
}

/* Si gioca toccando il campo: un bersaglio trasparente su ogni piazzola e sul castello, grande
   quanto l'edificio (le misure della scena, che sa dove ha disegnato). Toccata una piazzola libera
   si sceglie cosa costruire; toccato un edificio gli compare sopra l'anello. Sotto, la barra
   sottile: ripara e bomba, che non stanno su un edificio. */
function costruisciPannello(p) {
  const piuEconomica = Math.min(CRESCITA.miniera.prezzo(0), ...ammesse.value.map(id => TRUPPE[id].costo))
  const bersagli = []
  if (campo) {
    POSTI.forEach(([px, py], posto) => {
      const e = p.edificioIn(mio.value, posto)
      const w = campo.me(78), h = campo.me(88), piede = campo.Y(py) + campo.me(30)
      bersagli.push({ chiave: 'p' + posto, posto, id: e ? e.id : null, x: campo.X(px) - w / 2, y: piede - h + campo.me(8), w, h,
                      nome: e ? (e.tipo === 'miniera' ? 'Miniera' : TRUPPE[e.id].nome) : 'Piazzola libera',
                      puoi: !e && p.lati[mio.value].monete >= piuEconomica })
    })
    const w = campo.me(130), y = campo.Y(CAMPO.base - 45)
    bersagli.push({ chiave: 'castello', castello: true, x: campo.X(CAMPO.corsia) - w / 2, y, w, h: Math.max(campo.me(40), campo.cv.clientHeight - y),
                    nome: 'Il tuo castello' })
  }
  const azioni = ['ripara', 'bomba'].map(a => {
    const prezzo = p.prezzo(mio.value, a)
    const stato = a === 'ripara' ? `${p.riparabili(mio.value).length} da curare`
      : p.lati[mio.value].bombe ? `${p.lati[mio.value].bombe} pronta${p.lati[mio.value].bombe > 1 ? 'e' : ''}` : 'in arrivo'
    return { azione: a, prezzo, stato, puoi: prezzo !== null && p.lati[mio.value].monete >= prezzo,
             attesa: a === 'bomba' && p.lati[mio.value].bombe < BOMBA.max ? Math.ceil(p.lati[mio.value].bombaT) : 0 }
  })
  return { bersagli, anello: anelloDi(p, bersagli), scelta: sceltaDi(bersagli), azioni }
}

/* l'anello dell'edificio toccato: potenziare (col prezzo, o quanto riposa), vendere, i numeri.
   Se l'edificio non c'è più (crollato, venduto) l'anello si chiude da sé */
function anelloDi(p, bersagli) {
  const a = anello.value
  if (!a) return null
  const b = bersagli.find(x => x.chiave === a.chiave)
  const e = a.castello ? p.castello(mio.value) : p.edificioIn(mio.value, a.posto)
  if (!b || !e) { anello.value = null; return null }
  const prezzo = a.castello ? p.prezzo(mio.value, 'castello') : p.prezzo(mio.value, 'potenzia', a.posto)
  const riposo = a.castello ? 0 : Math.max(0, e.riposo)
  const voci = [
    { chiave: 'potenzia', icona: '⬆️', testo: riposo > 0 ? `💤 ${Math.ceil(riposo)}s` : `${prezzo} 💎`,
      puoi: prezzo !== null && p.lati[mio.value].monete >= prezzo && riposo <= 0 },
  ]
  // vendere è un tocco, ma due: il primo chiede «sicuro?» (la ✓ al posto del 💰), il secondo vende
  if (!a.castello) voci.push({ chiave: 'vendi', icona: a.conferma ? '✓' : '💰', testo: `+${p.resa(mio.value, a.posto)} 💎`, puoi: true, sicuro: !!a.conferma })
  voci.push({ chiave: 'numeri', icona: '?', testo: '', puoi: true, piccola: true })
  // dentro il campo anche sulle piazzole di lato: i pulsanti grandi 68 px, il «?» 44
  const largo = voci.reduce((t, v) => t + (v.piccola ? 44 : 68), 0) + (voci.length - 1) * 6, W = campo.cv.clientWidth
  const x = Math.min(Math.max(b.x + b.w / 2, largo / 2 + 4), W - largo / 2 - 4)
  return { chiave: a.chiave, x, y: b.y + campo.me(6), voci }
}

/* la nuvoletta della piazzola libera: sopra la piazzola, dentro il campo (la coda punta alla piazzola) */
function sceltaDi(bersagli) {
  const s = scelta.value
  if (!s) return null
  const b = bersagli.find(x => x.chiave === 'p' + s.posto)
  if (!b) return null
  // le opzioni (una per truppa, più la miniera) vanno a capo se non stanno in una riga: con sei truppe e la miniera
  // la nuvoletta sarebbe più larga dello schermo (76 px a opzione, 20 di bordo)
  const quante = s.varianti.length + 1, W = campo.cv.clientWidth
  const perRiga = Math.max(1, Math.min(quante, Math.floor((W - 8 - 20) / 76)))
  const colonne = Math.ceil(quante / Math.ceil(quante / perRiga))
  const largo = colonne * 76 + 20
  const cx = b.x + b.w / 2
  const x = Math.min(Math.max(cx, largo / 2 + 4), W - largo / 2 - 4)
  return { ...s, x, y: b.y + campo.me(4), coda: cx - x, larga: largo }
}

function tocca(b) {
  const p = partita.value
  if (!p || domanda.value || finale.value || p.fine) return
  toccato.value = true
  if (anello.value && anello.value.chiave === b.chiave) { anello.value = null; aggiornaCruscotto(); return }
  if (scelta.value && 'p' + scelta.value.posto === b.chiave) { scelta.value = null; aggiornaCruscotto(); return }
  if (b.castello) anello.value = { chiave: b.chiave, castello: true }
  else if (p.edificioIn(mio.value, b.posto)) anello.value = { chiave: b.chiave, posto: b.posto }
  else { anello.value = null; apriScelta({ posto: b.posto }) }
  aggiornaCruscotto()
}

function dallAnello(voce) {
  const a = anello.value
  if (!a) return
  if (voce === 'vendi' && !a.conferma) { anello.value = { ...a, conferma: true }; aggiornaCruscotto(); return }
  anello.value = null
  if (voce === 'numeri') apriDettagli(a.castello ? { azione: 'castello' } : { posto: a.posto })
  else if (voce === 'vendi') vendiSubito(a.posto)
  else scegli(a.castello ? { azione: 'castello' } : { azione: 'potenzia', posto: a.posto })
  aggiornaCruscotto()
}

/* un tocco fuori chiude l'anello e la nuvoletta */
function chiudiAnello() {
  if (!anello.value && !scelta.value) return
  anello.value = null
  scelta.value = null
  aggiornaCruscotto()
}

/* vendere non chiede un conto (non si guadagna né si perde con una risposta): si vende e basta,
   ridà metà della spesa */
function vendiSubito(posto) {
  const p = partita.value
  if (!p || domanda.value || finale.value || p.fine) return
  const e = p.edificioIn(mio.value, posto)
  if (!e) return
  const resa = p.resa(mio.value, posto)
  const id = e.tipo === 'miniera' ? 'miniera' : e.id
  if (eseguiMossa('vendi', posto)) dici(frase({ azione: 'vendi', id, resa }))
  toccato.value = true
  aggiornaCruscotto()
  salva()
}

/* il livello di difficoltà sta nel profilo: si cambia dalla mappa, fra una battaglia e l'altra */
function scegliLivello(l) {
  livello.value = livelloValido(l)
  ritocca(CHIAVE, c => { c.livello = livello.value })
}

/* ── giocare ── */
function avvia(indice) {
  if (indice === 'infinita') return avviaInfinita()
  if (indice === 'sfida') return apriSfida()
  infinita.value = null
  comincia(new Partita({ sfida: sfidaDi(CAMPAGNA[indice], livello.value), registra: true, eviaIA: progresso(CHIAVE).ultimaIA || null }), indice)
}

/* ── la sfida in due ── */
function apriSfida() {
  chiudiSfida()
  faseSfida.value = 'scelta'
  vista.value = 'sfida'
}

async function creaSfida({ terreno, secondi }) {
  faseSfida.value = 'creo'
  try {
    codiceSfida.value = await creaStanza()
  } catch (e) {
    errore.value = e.message
    faseSfida.value = 'errore'
    return
  }
  faseSfida.value = 'attesa'
  collegati(codiceSfida.value, { terreno, secondiARisposta: secondi })
}

function entraSfida(codice) {
  faseSfida.value = 'entro'
  codiceSfida.value = codice
  collegati(codice, null)
}

function collegati(codice, host) {
  const r = new Regia({ canale: null, host, alCambio: () => cambioSfida(r) })
  r.canale = collega(codice, {
    alMessaggio: m => { if (regia.value === r) r.ricevi(m) },
    allaChiusura: motivo => {
      if (regia.value !== r || r.stato === 'finita' || r.stato === 'rotta') return
      r.cambia('rotta', motivo === 'non entra' ? 'non trovo nessuna sfida con questo codice (o è già piena)' : 'il collegamento è caduto')
    },
  })
  regia.value = r
  statoSfida.value = r.stato
}

/* la regia cambia stato: in due si parte, o si dice perché non si può */
function cambioSfida(r) {
  if (regia.value !== r) return
  statoSfida.value = r.stato
  motivoSfida.value = r.motivo
  if (r.stato === 'gioco') {
    clearTimeout(attesa); attesa = 0
    togli()
    scorda()                      // una partita nuova butta quella lasciata a metà (già chiesto dalla mappa)
    tappaIdx.value = 0
    infinita.value = r.terreno    // il terreno e le sue truppe, come nella battaglia infinita
    partita.value = r.partita
    azzera()
    toccato.value = false
    altroMuto.value = false
    chiaveCampo.value++
    vista.value = 'campo'
  }
}

/* via la sfida (finita, annullata o caduta): il collegamento si chiude */
function chiudiSfida() {
  const r = regia.value
  regia.value = null
  statoSfida.value = ''
  motivoSfida.value = ''
  altroMuto.value = false
  codiceSfida.value = ''
  if (r) r.chiudi()
}

/* la fase che la schermata mostra */
const faseVista = computed(() => (statoSfida.value === 'rotta' ? 'rotta' : statoSfida.value === 'trattativa' ? 'accordo' : faseSfida.value))
const messaggioSfida = computed(() => (statoSfida.value === 'rotta' ? motivoSfida.value : errore.value))
const TERRENI_SFIDA = SCALINI.map(s => ({ chiave: s.vestito, nome: s.nome.replace(/^(Il|La|Le) /, ''), icona: s.icona }))

/* la battaglia infinita: il nemico è quello dell'ultima tappa, e il terreno è sempre un altro dall'ultima volta
   (l'ultimo sta nel profilo, `campagne.arena.ultimoTerreno`), con le truppe di quel terreno */
function avviaInfinita() {
  const terreno = terrenoDiverso(progresso(CHIAVE).ultimoTerreno)
  ritocca(CHIAVE, c => { c.ultimoTerreno = terreno })
  infinita.value = terreno
  comincia(new Partita({ sfida: sfidaInfinita(terreno, livello.value), registra: true, eviaIA: progresso(CHIAVE).ultimaIA || null }), 0)
}

function comincia(nuova, indice) {
  clearTimeout(attesa); attesa = 0
  togli()   // una partita che comincia non comincia in pausa
  scorda()  // una partita nuova butta quella lasciata a metà (già chiesto dalla mappa)
  tappaIdx.value = indice
  partita.value = nuova
  ritocca(CHIAVE, c => { c.ultimaIA = nuova.ia.nome })   // la prossima partita avrà un altro carattere
  azzera()
  toccato.value = false
  chiaveCampo.value++      // un campo nuovo: il terreno può essere cambiato, e la giostra riparte (prendiTela)
  vista.value = 'campo'
}

function prendiTela(tela) {
  if (!tela) return
  campo = new Campo(tela, { vestito: infinita.value || scalino.value.vestito })
  campo.prepara().then(() => { campo.adatta() })
  giostra.avvia()
}

function ridimensiona() { campo?.adatta() }

/* i dettagli: com'è adesso, com'è al livello dopo, quanto costa. Il campo sta fermo. `posto` è una
   caserma costruita (si potenzia o si vende), `truppa` una da costruire (dalla scelta della piazzola). */
function apriDettagli({ posto, truppa, azione }) {
  const p = partita.value
  if (!p || domanda.value || finale.value) return
  let d, scheda
  const mina = posto !== undefined && p.edificioIn(mio.value, posto)?.tipo === 'miniera' ? p.edificioIn(mio.value, posto) : null
  if (mina || truppa === 'miniera') {
    // la miniera: costruita si potenzia o si vende, dalla scelta si costruisce
    const det = dettaglioAzione('miniera', { miniera: mina ? mina.liv : 0 })
    d = mina ? { azione: 'potenzia', posto } : { azione: 'costruisci', id: 'miniera', posto: scelta.value?.posto }
    scheda = { titolo: AZIONI.miniera.nome, nota: AZIONI.miniera.nota, ruolo: [], icona: '⛏️', sottotitolo: 'monete', ...det,
               verbo: mina ? '⬆️ Potenzia' : 'Costruisci',
               puoi: mina ? p.puoFare(mio.value, 'potenzia', posto) && !p.inRiposo(mio.value, posto) : p.puoFare(mio.value, 'costruisci', 'miniera', d.posto),
               motivo: mina && p.inRiposo(mio.value, posto) ? 'la miniera riposa ancora un po\'' : 'servono più monete',
               fine: '', vendi: mina ? p.resa(mio.value, posto) : null }
    dettaglio.value = { ...scheda, scelta: d }
    toccato.value = true
    return
  }
  const c = posto !== undefined ? p.casermaIn(mio.value, posto) : null
  if (c || truppa) {
    const id = c ? c.id : truppa
    const k = TRUPPE[id]
    const det = dettaglioTruppa(id, c ? c.liv : 0, { costruire: !c })
    d = c ? { azione: 'potenzia', posto } : { azione: 'costruisci', id: truppa, posto: scelta.value?.posto }
    scheda = { truppa: id, titolo: k.nome, nota: k.nota, ruolo: ruoloDi(id), livello: c ? c.liv : 0, sottotitolo: EDIFICI[EDIFICIO_DI[id]].nome,
               ...det,
               verbo: c ? '⬆️ Potenzia' : 'Costruisci',
               puoi: c ? p.puoFare(mio.value, 'potenzia', posto) && !p.inRiposo(mio.value, posto) : p.puoFare(mio.value, 'costruisci', truppa, d.posto),
               motivo: c && p.inRiposo(mio.value, posto) ? 'la caserma riposa ancora un po\'' : 'servono più monete',
               fine: 'È già al livello massimo.',
               vendi: c ? p.resa(mio.value, posto) : null }
  } else {
    const det = dettaglioAzione(azione, { miniera: p.lati[mio.value].miniera, castello: p.castello(mio.value).liv })
    d = { azione }
    scheda = { titolo: AZIONI[azione].nome, nota: AZIONI[azione].nota, ruolo: [], sottotitolo: azione === 'bomba' ? 'in regalo' : '', icona: { miniera: '⛏️', ripara: '🔧', bomba: '💣' }[azione],
               castello: azione === 'castello', ...det,
               verbo: azione === 'ripara' ? '🔧 Ripara' : azione === 'bomba' ? '💥 Lancia' : '⬆️ Potenzia',
               puoi: p.puoFare(mio.value, azione),
               motivo: azione === 'bomba' ? (p.lati[mio.value].bombe ? 'non ci sono truppe nemiche da colpire' : `la prossima arriva fra ${Math.ceil(p.lati[mio.value].bombaT)} secondi`)
                     : azione === 'ripara' && !p.riparabili(mio.value).length ? 'non c\'è niente da riparare' : 'servono più monete',
               fine: 'È già al livello massimo.' }
  }
  dettaglio.value = { ...scheda, scelta: d }
  toccato.value = true
}

function procediDaiDettagli() {
  const d = dettaglio.value
  dettaglio.value = null
  scelta.value = null
  if (d) scegli(d.scelta)
}

function vendiDaiDettagli() {
  const d = dettaglio.value
  dettaglio.value = null
  if (d) vendiSubito(d.scelta.posto)
}

/* una piazzola libera: tutte le truppe della tappa, coi prezzi; quelle che arrivano più avanti si
   vedono in fondo, piccole */
function apriScelta({ posto }) {
  const p = partita.value
  if (!p || domanda.value || finale.value || p.fine) return
  const permesse = ammesse.value
  scelta.value = {
    posto,
    varianti: Object.keys(TRUPPE).filter(id => permesse.includes(id)).map(id => ({
      id, nome: TRUPPE[id].nome, prezzo: TRUPPE[id].costo,
      puoi: p.puoFare(mio.value, 'costruisci', id, posto) })),
    piuAvanti: infinita.value ? [] : Object.keys(TRUPPE).filter(id => !permesse.includes(id)),
    miniera: { id: 'miniera', nome: AZIONI.miniera.nome, prezzo: CRESCITA.miniera.prezzo(0),
               puoi: p.puoFare(mio.value, 'costruisci', 'miniera', posto) },
  }
  toccato.value = true
  aggiornaCruscotto()
}

function costruisciDallaScelta(id) {
  const posto = scelta.value?.posto
  scelta.value = null
  aggiornaCruscotto()
  scegli({ azione: 'costruisci', id, posto })
}

/* una scelta: il calcolo la apre, la risposta la fa. Per costruire si dice la truppa (`id`) e la
   piazzola; per potenziare e vendere la piazzola */
function scegli({ azione, id, posto }) {
  const p = partita.value
  if (!p || fermo.value || domanda.value || p.fine) return
  if (scelta.value && azione !== 'costruisci') { scelta.value = null; aggiornaCruscotto() }
  const chi = azione === 'costruisci' ? id : azione === 'potenzia' || azione === 'vendi' ? posto : undefined
  const dove = azione === 'costruisci' ? posto : undefined
  if (!p.puoFare(mio.value, azione, chi, dove) || (azione === 'potenzia' && p.inRiposo(mio.value, posto))) return
  const cal = p.calcoloDi(mio.value, azione, chi)
  const op = operazionePer(cal.op, senzaSaperi(operazioniAttive.value, contiPermessi()))
  // l'operazione spenta dai genitori è sostituita da un'altra, più difficile (docs/arena/calcoli.md)
  const peso = cal.peso + (op !== operazionePer(cal.op, operazioniAttive.value) ? PESO_DEL_RIPIEGO : 0)
  const prima = posto !== undefined ? p.casermaIn(mio.value, posto) : null
  voluta = { azione, id: id || prima?.id, posto, chi, dove, op, resa: azione === 'vendi' ? p.resa(mio.value, posto) : 0 }
  toccato.value = true
  domanda.value = domandaDi(op, gradoDi(laBase(op), peso))
  suono.ok()
}

/* la base del bambino per un'operazione: la sua, o da dove parte la prima volta (bravura.js) */
const laBase = op => basi(progresso(CHIAVE).bravura, { eta: etaDelBambino(), items: state.profile.items })[op]

function risposto({ giusto, saltata, tempo }) {
  const p = partita.value
  const v = voluta
  domanda.value = null
  voluta = null
  togli()
  if (!p || !v) return
  if (!saltata) {
    const nuova = dopoLaRisposta(laBase(v.op), { giusto, tempo })
    ritocca(CHIAVE, c => { c.bravura = { ...(c.bravura || {}), [v.op]: nuova } })
  }
  if (giusto) {
    if (eseguiMossa(v.azione, v.chi, v.dove)) {
      // il tasto «salta» dei grandi dà la scelta ma non paga e non conta (docs/core/comandi.md)
      if (!saltata) { borsellino.paga(PAGA.mossa); segna('arenaCalcoli') }
      if (v.azione === 'costruisci' || v.azione === 'potenzia') segna('arenaCaserme')
      dici(frase(v))
    } else dici('le monete non bastavano più')
  } else {
    if (v.azione === 'potenzia') { if (inDue()) regia.value.sessione.scegli('sbagliata', v.posto); else p.sbagliata(mio.value, v.posto) }
    dici(v.azione === 'potenzia' ? 'conto sbagliato: la caserma riposa un po\'' : 'conto sbagliato: ci riprovi quando vuoi')
  }
  aggiornaCruscotto()
  salva()
}

/* la mossa giusta: da soli si fa subito, in due si dà alla sessione, che la fa valere (con l'altro) fra qualche decimo di secondo */
function eseguiMossa(azione, chi, dove) {
  if (inDue()) return regia.value.sessione.scegli(azione, chi, dove)
  return partita.value.fai(mio.value, azione, chi, dove)
}

function frase(v) {
  if (v.id === 'miniera') return { costruisci: '⛏️ una miniera: le monete arrivano più in fretta', potenzia: '⛏️ la miniera sale di livello',
                                   vendi: `💰 miniera venduta: +${v.resa} 💎` }[v.azione] || ''
  const nome = v.id ? TRUPPE[v.id].nome : ''
  return { costruisci: `${v.id ? EDIFICI[EDIFICIO_DI[v.id]].nome : ''}: ${nome}`, potenzia: `⬆️ ${nome} sale di livello`, miniera: '⛏️ le monete arrivano più in fretta',
           ripara: '🔧 riparato', castello: '🏰 il castello è più forte', bomba: '💥 la bomba ha spazzato le truppe nemiche',
           vendi: `💰 ${nome} venduti: +${v.resa} 💎` }[v.azione] || ''
}

function dici(testo) {
  avviso.value = testo
  clearTimeout(orologioAvviso)
  orologioAvviso = setTimeout(() => { avviso.value = '' }, 2600)
}

/* ── finire ── */
let pagata = false
let contata = false

function chiudiPartita() {
  attesa = 0
  const p = partita.value
  if (!p) return
  giostra.ferma()
  scorda()          // finita o vinta, non c'è più niente da riprendere
  const vinto = (p.fine === 'vinto') === (mio.value === 'io')     // `fine` è dalla parte di chi ospita
  const stelle = infinita.value || regia.value ? 0 : stellePer({ vinto, vitaBase: p.vitaBase(mio.value) })
  // nella battaglia infinita non ci sono stelle né tappe né record: si dice solo il tempo di questa volta
  if (!infinita.value && !regia.value && vinto && !pagata) {
    completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle })
    if (stelle === 3) segna('arenaSenzaGraffi')
    pagata = true
  }
  if (!contata) { segna('arenaPartite'); contata = true }
  suono[vinto ? 'livello' : 'fine']()
  finale.value = {
    vinta: vinto, pari: p.fine === 'pari', titolo: titoloPartita.value, stelle,
    monete: borsellino.dato, notaMonete: borsellino.nota(), tempo: p.t,
    ultima: vinto && !infinita.value && tappaIdx.value === QUANTE_TAPPE - 1,
    infinita: !!infinita.value && !regia.value, sfida: !!regia.value,
  }
  if (regia.value) { statoSfida.value = 'finita'; regia.value.stato = 'finita'; regia.value.chiudi() }
}

function ancora() {
  const f = finale.value
  if (!f) return
  if (regia.value) return allaMappa()
  if (infinita.value) return avviaInfinita()      // sempre un altro terreno
  if (f.vinta && tappaIdx.value + 1 < QUANTE_TAPPE && aperta(CHIAVE, tappaIdx.value + 1)) return avvia(tappaIdx.value + 1)
  if (f.vinta) return allaMappa()
  avvia(tappaIdx.value)
}

function allaMappa() {
  chiudiSfida()
  clearTimeout(attesa); attesa = 0
  togli()
  giostra.ferma()
  partita.value = null
  campo = null
  infinita.value = null
  finale.value = null
  domanda.value = null
  vista.value = 'mappa'
}

// uscire a metà non chiude la partita: si scrive dove si era e la mappa la offre in cima
function indietro() {
  if (vista.value === 'mappa') return emit('vai', 'home')
  if (vista.value === 'sfida') { chiudiSfida(); vista.value = 'mappa'; return }
  const p = partita.value
  if (p && !p.fine && !regia.value) {
    salva({ subito: true })
    ripresa.value = laRipresa()
  }
  allaMappa()
}

// il telefono che si mette in tasca: visibilitychange è l'ultimo momento in cui si può scrivere
function seSparisce(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden') salva({ subito: true })
}

// il gancio per guardarsi: la partita e qualche leva, per scattare e provare senza giocare
// mezz'ora. Sparisce dal build (import.meta.env.DEV).
function gancioDiProva() {
  if (!import.meta.env.DEV) return
  window.__arena = {
    get partita() { return partita.value },
    get fermo() { return fermo.value },
    get domanda() { return domanda.value },
    get dettaglio() { return dettaglio.value },
    metti, togli, scegli,
  }
}

onMounted(() => {
  gancioDiProva()
  addEventListener('resize', ridimensiona)
  document.addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
})
onUnmounted(() => {
  if (import.meta.env.DEV) delete window.__arena
  salva({ subito: true })
  removeEventListener('resize', ridimensiona)
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
  chiudiSfida()
  clearTimeout(attesa)
  clearTimeout(orologioAvviso)
  giostra.ferma()
})
</script>

<template>
  <div class="schermo">
    <!-- il ⏸ c'è solo dove scorre qualcosa -->
    <Barra :titolo="vista === 'campo' ? titoloPartita : 'Castle Battle'" monete
           :pausa="siGioca" @pausa="metti()" @aiuto="aiuto" @indietro="indietro" />

    <div class="ar">
      <Mappa v-if="vista === 'mappa'" :scalini="scalini" :infinita="laInfinita" :ripresa="ripresa"
             :livelli="LIVELLI" :livello="livello" @livello="scegliLivello" @gioca="avvia" @riprendi="riprendiPartita" @scorda="scorda" />

      <Sfida v-else-if="vista === 'sfida'" :fase="faseVista" :codice="codiceSfida" :messaggio="messaggioSfida" :terreni="TERRENI_SFIDA"
             @crea="creaSfida" @entra="entraSfida" @indietro="indietro" />

      <CampoVista v-else :key="chiaveCampo" :cruscotto="cruscotto" :pannello="pannello" :avviso="avviso"
                  :dritta="!toccato && !finale"
                  @tela="prendiTela" @scegli="scegli" @dettagli="apriDettagli" @tocca="tocca" @costruisci="costruisciDallaScelta"
                  @anello="dallAnello" @chiudi-anello="chiudiAnello" />

      <!-- il calcolo prende tutto lo schermo; il campo intanto rallenta (non si ferma) -->
      <Domanda v-if="domanda" :domanda="domanda.domanda" :pittori="domanda.pittori"
               :titolo="`${domanda.icona} ${domanda.nome}`"
               :origine="domanda" gioco="arena" @risposto="risposto" />

      <Dettagli v-if="dettaglio" :d="dettaglio" @chiudi="dettaglio = null" @procedi="procediDaiDettagli" @vendi="vendiDaiDettagli" />

      <Finale v-if="finale" v-bind="finale" @ancora="ancora" @esci="allaMappa" />

      <!-- la sfida si è rotta (l'altro se n'è andato, versioni diverse, copie separate) o l'altro non risponde -->
      <div v-if="vista === 'campo' && !finale && (statoSfida === 'rotta' || altroMuto)" class="ar-velo" data-sfida-rotta>
        <div class="ar-cartello">
          <h2>{{ statoSfida === 'rotta' ? 'La sfida è finita qui' : 'L\'altro non risponde…' }}</h2>
          <p>{{ statoSfida === 'rotta' ? motivoSfida : 'Aspetto ancora un po\': se non torna, puoi uscire.' }}</p>
          <button class="ar-grosso ar-chiaro" data-sfida-esci @click="allaMappa"><span class="em">🗺️</span> alla mappa</button>
        </div>
      </div>

      <VeloPausa v-if="inPausa && siGioca" :dove="dovEravamo" @riprendi="togli" @esci="indietro" />
    </div>
  </div>
</template>

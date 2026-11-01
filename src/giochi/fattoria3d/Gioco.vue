<script setup>
/* La fattoria (in 3D) — il coordinatore: le regole sono in motore/fattoria3d.js, il disegno in scena3d/, le tabelle in dati/,
   le finestre in viste/. È l'unico file che sa delle monete vere (state.profile.coins), dei contatori (segna) e del salvataggio
   (profile.campagne.fattoria3d.cfg.stato). Usa raccolti, prodotti e lana suoi: non tocca quelli della fattoria di sempre.
   Senza WebGL 2 non si apre niente: lo si dice e si torna in home. Vedi docs/fattoria3d/. */
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Barra from '../../components/Barra.vue'
import { state, addCoins, segna, flushNow, persist, aspettoDi, scegliAspetto, cestinaOra, segnaBest } from '../../store/profile.js'
import { fasciaAttiva } from '../../store/qualita.js'
import { load, save } from '../../store/storage.js'
import { scelta, ricorda } from '../campagne.js'
import { Fattoria3d } from './motore/fattoria3d.js'
import { fattoriaTipo } from './motore/tipo.js'
import { statoDaCaricare, statoRifattoDa2D } from './motore/migra.js'
import { haWebGL2 } from './scena3d/webgl.js'
import { dettoDi, dettoDiRifiuto } from './scena3d/detti.js'
import { EDIFICI, avvisoEdificiNuovi } from './dati/catalogo.js'
import { COLTURE } from './dati/colture.js'
import { RICETTE, emojiDi, dentroDi, PRONTO_DA_RITIRARE } from './dati/ricette.js'
import { POSTI_MASSIMI, prezzoDelPosto } from './dati/posti.js'
import { avanzamento, roba, nomeDi, sogliaDi } from './dati/livelli.js'
import { tempoBreve } from './dati/tempo.js'
import { SILOS, TIPI_DI_SILO, siloDelPezzo } from './dati/silos.js'
import { clienteDi, LIVELLO_BANCO } from './dati/ordini.js'
import { PEZZI } from './dati/catalogo.js'
import { LIVELLO_MONGOLFIERA } from './dati/mongolfiera.js'
import manifesto from './gioco.js'
import Guida from '../Guida.vue'
import { usaGuida } from '../guida.js'
import { saltaLeSpiegazioni } from '../../guide/aiuto.js'
import { guidaDelPrimoGiro, servePrimoGiro, primoGiroFinito } from './motore/guida.js'
import { comeAvere, cosaFaccioAdesso } from './motore/consiglio.js'
import Consiglio from './viste/Consiglio.vue'
import Albero from './viste/Albero.vue'
import { alberoDi } from './dati/albero.js'
import { qualitaIniziale, VERSIONE_OPZIONI } from './dati/qualita.js'
import Hud from './viste/Hud.vue'
import BarraAzioni from './viste/BarraAzioni.vue'
import CostruisciQui from './viste/CostruisciQui.vue'
import BarraStrade from './viste/BarraStrade.vue'
import { schedeDi, festaDaScoprire } from './dati/carte.js'
import { stagioneAttiva } from './dati/stagioni3d.js'
import SceltaSeme from './viste/SceltaSeme.vue'
import Macchina from './viste/Macchina.vue'
import Livelli from './viste/Livelli.vue'
import Inventario from './viste/Inventario.vue'
import Guardaroba from './viste/Guardaroba.vue'
import Bestia from './viste/Bestia.vue'
import NegozioBestia from './viste/NegozioBestia.vue'
import Battesimo from './viste/Battesimo.vue'
import { dettoCura, dettoEsito, dettoCompera } from './viste/bestia-pura.js'
import { BESTIE, CIBI as CIBI_BESTIE, COCCOLE_3D, curabile } from './dati/bestie.js'
import { personaDi, normalizzaAbito, capiDi, chiaveAbito, vesti as vestiAbito, nomeDelContadino } from './dati/abiti.js'
import { schedeDellInventario, robaNuova, contoDi } from './viste/inventario-puro.js'
import Bacheca from './viste/Bacheca.vue'
import Mongolfiera from './viste/Mongolfiera.vue'
import Magazzino from './viste/Magazzino.vue'
import { vistaDelMagazzino } from './viste/magazzino-puro.js'
import Bottega from './viste/Bottega.vue'
import Dialogo from './viste/Dialogo.vue'
import Opzioni from './viste/Opzioni.vue'
import Mappa from './viste/Mappa.vue'
import Carretto from './viste/Carretto.vue'
import Visita from './viste/Visita.vue'
import { usaVisite } from './visite.js'
import { DAI as DAI_CARRETTO } from './motore/carretto.js'
import { prendiIngresso, chiediIngresso } from '../../amici/ingresso.js'
import { apriComune, amiciPerComune, nomeDellAmico, dettoDellaMossa, TERRA } from './comune.js'
import { quandoQui, mandaA } from '../../amici/servizio.js'
import { qui as msgQui, via as msgVia, GESTI } from '../../amici/messaggi.js'
import './stile.css'
import './stile-guida.css'

// App.vue passa a tutte le schermate `disegno` e `lingua`: qui non servono
defineOptions({ name: 'LaFattoria3d', inheritAttrs: false })
const emit = defineEmits(['vai'])

const CHIAVE = 'fattoria3d'
const CHIAVE_OPZIONI = 'fattoria3d-opz'
// la fattoria in comune con un amico (docs/fattoria3d/in-comune.md): la chiave dell'amicizia, se si è entrati da «🤝»
const comune = (prendiIngresso(CHIAVE) || {}).comune || null
const statoComune = ref(comune ? 'collego' : '')       // '' | collego | errore | pronto
const erroreComune = ref('')
let sessione = null
// `#fattoria3d&tela=niente`: per provare il messaggio su un browser che il WebGL ce l'ha
const finto = typeof location !== 'undefined' && /(?:^#?|&)tela=niente(?:&|$)/.test(location.hash || '')
const puo = ref(!finto && haWebGL2())

const tela = ref(null)
const sopra = ref(null)
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
const scorteSeme = computed(() => { void versione.value; return { ...motore.s.merci } })      // i raccolti già in scorta, per le carte del «Cosa semini?»
const foto = ref({ robaNuova: false, daFare: { semina: 0, raccogli: 0 }, livello: 1, quanto: 0, daCostruire: 0 })
const datiLivello = () => { const a = avanzamento(motore.esperienza()); return { livello: a.livello, quanto: a.quanto } }
let ultimaFoto = ''
let inventarioVisto = null               // il conto di quando si è guardato l'inventario l'ultima volta (in memoria, non si salva)
const ripresa = () => {
  const s = motore.s
  if (!inventarioVisto) inventarioVisto = contoDi(s)           // il primo sguardo è la base: «nuovo» è ciò che arriva dopo
  const nuova = {
    robaNuova: !inventarioAperto.value && robaNuova(inventarioVisto, s), daFare: motore.daFare(), daCostruire: motore.edificiDaCostruire().length, ...datiLivello(),
  }
  const firma = JSON.stringify(nuova)
  if (firma !== ultimaFoto) { ultimaFoto = firma; foto.value = nuova }      // niente nuova foto se è uguale: il HUD non si rifà ogni quarto di secondo
  versione.value++
}
const EVENTI = { terra: 'fattoria3dTerre', pezzo: 'fattoria3dPezzi', raccolto: 'fattoria3dRaccolti', albero: 'fattoria3dAlberi', sasso: 'fattoria3dSassi', visita: 'fattoria3dVisite', aiuto: 'fattoria3dAiuti', cassa: 'fattoria3dMongolfiera', fiera: 'fattoria3dFiere' }
/** Un livello nuovo: un avviso che passa da sé e un pallino sul gettone finché non si apre il foglio. */
function salito(livello) {
  const nome = nomeDi(livello), vuoto = /^Livello \d+$/.test(nome)           // un livello che non apre niente (la 3D ha meno cose della 2D) lo dice
  const testo = `Livello ${livello}: ${avvisoEdificiNuovi(livello) || (vuoto ? 'niente di nuovo, ma sei più in alto!' : nome)}`      // se si apre un edificio lo nomina: il «!» sul tasto Costruisci resta finché non c'è
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
    if (e.tipo === 'pezzo') segnaBest('fattoria3dVarieta', new Set(motore.s.cose.filter(c => !siloDelPezzo(c.tipo)).map(c => c.tipo)).size)      // «Un po' di tutto»: i tipi diversi in mappa (un primato); i magazzini arrivano da soli, non contano
    else if (e.tipo === 'vestita') segnaBest('fattoria3dVestiti', Object.values(motore.s.casa).reduce((n, b) => n + Object.keys(b.addobbi || {}).length, 0))      // «Che eleganza»: gli addobbi addosso, un primato come nella 2D
    else if (e.tipo === 'prodotto') segna('fattoria3dProdotti', e.n)
    else if (e.tipo === 'uovo') segna('fattoria3dUova', e.n)
    else if (e.tipo === 'latte') segna('fattoria3dLatte', e.n)
    else if (e.tipo === 'pesce') segna('fattoria3dPesci', e.n)
    else if (e.tipo === 'livello') salito(e.livello)
    else if (e.tipo === 'consegna') consegnato(e)
  }
}

// ── il salvataggio: a ritardo, e subito quando la pagina sparisce ──
let sporco = false
function salva({ subito = false } = {}) {
  if (!motore) return
  sporco = false
  if (comune) return sessione?.ricorda({ subito })          // la fattoria in comune non sta nel profilo: la copia del telefono
  ricorda(CHIAVE, 'stato', motore.serializza())
  if (visite.vicini.value) ricorda(CHIAVE, 'vicini', visite.serializza())          // i vicini stanno a parte, accanto allo stato
  if (subito) flushNow()                   // `ricorda` scrive con ritardo: uscendo, la pagina può sparire prima
}
function seSparisce(e) { if (e?.type === 'pagehide' || document.visibilityState === 'hidden') salva({ subito: true }) }

// ── lo stato della vista ──
const modo = ref('libero')               // libero | semina | raccogli
const seme = ref('grano')
const strumento = ref(null)              // il pennello delle strade: null | 'strada' | 'gomma'
const costruisciQui = ref(null)          // { i, j, msg }: il menu «Costruisci qui», con la cella premuta
const avvisoTesto = ref('')
const stagione = ref(stagioneAttiva(new Date(), typeof location !== 'undefined' ? location.hash : ''))          // la festa in corso (dati/stagioni3d.js): Natale, Halloween o niente
const trascinando = ref(null)            // { emoji, x, y, su, perMettereVia, perAnnullare, nuovo, parcheggiato } mentre si trascina un pezzo (o ne aspetta uno il fantasma)
const semiAperto = ref(false)
const macchinaAperta = ref(null)         // il tipo della macchina di cui si vede il menu
const macchinaMsg = ref('')
const livelliAperto = ref(false)
const inventarioAperto = ref(false)
const guardarobaAperto = ref(false)       // il foglio dell'abito (docs/fattoria3d/guardaroba.md)
const bestiaAperta = ref(null)             // l'id della bestia di casa di cui si vede il foglio (docs/fattoria3d/bestie-di-casa.md)
const bestiaMsg = ref('')
const negozioMsg = ref('')
const negozioDi = ref(null)                // l'id della bestia di cui si vede il negozio degli addobbi (viste/NegozioBestia.vue)
const battesimoDi = ref(null)              // l'id della bestia a cui si sta dando il nome
const livelloNuovo = ref(false)
const bancoAperto = ref(false)             // il foglio del banco
const bancoMsg = ref('')
const nave = ref(false)                    // il foglio della mongolfiera (docs/fattoria3d/mongolfiera.md)
const naveMsg = ref('')
const bottegaAperta = ref(null)            // il tipo della bottega del paese di cui si vede il foglio (docs/fattoria3d/botteghe.md)
const bottegaMsg = ref('')
const magazzinoAperto = ref(null)          // il silo di cui si vede il foglio (docs/fattoria3d/magazzini.md)
const magazzinoMsg = ref('')
const toast = ref(null)                  // { testo, fine }: l'avviso del livello, sopra la scena
const DURATA_TOAST = 4500, DURATA_AVVISO = 6000
let avvisoFine = 0
const opzioniAperte = ref(false)
const opzioniRidotte = ref(false)
const dialogo = ref(null)                // { titolo, testo, bottoni: [{ t, fn, quieto }] }
const cameraLibera = ref(false)
const stat = ref({ fps: 0, peggiore: 0, p1: 0, cpu: 0, logica: 0, disegno: 0, fuori: 0, calls: 0, triangoli: 0, geometrie: 0, texture: 0, programmi: 0, dpr: 1, scalaViva: 1, livello: 0, ombraOgni: 1, degrado: '', grafico: [], campi: 0, edifici: 0, altri: 0, compagni: 0, cartelli: 0, mesh: 0, ombre: 0, istanze: 0 })
const q = reactive(qualitaIniziale(fasciaAttiva()))
const rapporto = ref('')
let quandoSeme = null

// le anteprime 3D dei pezzi per le carte (il file del 3D arriva a richiesta: la vista non importa three)
const anteprima = tipo => (mondo ? mondo.anteprima(tipo) : Promise.resolve(null))
const anteprimaPronta = tipo => (mondo && mondo.anteprimaPronta(tipo)) || null

// ── il guardaroba: i capi stanno in `cfg.abito`; chi si è (contadino o contadina) viene dal profilo, come nella fattoria di sempre ──
aspettoDi()                                                            // mette a posto un profilo senza personaggio
const capi = ref(scelta(CHIAVE, 'abito', null))
const persona = computed(() => personaDi(state.profile.aspetto))
const abito = computed(() => normalizzaAbito(capi.value, persona.value))
function vestiContadino(categoria, id) {
  const nuovo = vestiAbito(abito.value, categoria, id, motore ? motore.livello() : 1)
  if (chiaveAbito(nuovo) === chiaveAbito(abito.value)) return
  capi.value = capiDi(nuovo)
  ricorda(CHIAVE, 'abito', capi.value)
}
function cambiaAspetto(nome) { scegliAspetto(nome) }                 // lo stesso attributo del profilo che usa la fattoria 2D
watch(() => chiaveAbito(abito.value), () => { if (mondo) mondo.vestiContadino(abito.value) })

// ── le porte che il mondo 3D usa verso la vista ──
const ui = {
  cambio() { sporco = true; contaEventi(); ripresa() },
  chiedi(titolo, testo, bottoni) { dialogo.value = { titolo, testo, bottoni } },
  scegliSeme(cb) { quandoSeme = cb; semiAperto.value = true },
  apriMacchina(tipo) { macchinaMsg.value = ''; macchinaCons.value = null; macchinaAperta.value = tipo },
  apriBanco() { apriBanco() },
  apriMongolfiera() { naveMsg.value = ''; naveCons.value = null; nave.value = true },
  apriBottega(tipo) { bottegaMsg.value = ''; bottegaCons.value = null; bottegaAperta.value = tipo },
  apriMagazzino(silo) { magazzinoMsg.value = ''; magazzinoAperto.value = silo },          // un tocco su un magazzino
  apriMappa() { if (comune) ui.avviso('Dai vicini si va col trattore della tua fattoria.'); else visite.apriMappa() },
  apriBestia(id) { bestiaMsg.value = ''; bestiaAperta.value = id },             // un tocco su una bestia di casa
  apriGuardaroba() { guardarobaAperto.value = true },             // un tocco sul contadino fermo                 // il trattore: la mappa dei villaggi (docs/fattoria3d/vicini.md)
  avviso(testo) {
    avvisoTesto.value = testo || ''
    avvisoFine = testo ? performance.now() + DURATA_AVVISO : 0
  },
  apriCostruisci(i, j) { apriCostruisci(i, j) },                           // tenere premuto su un posto libero del terreno tuo
  fogliAperti: () => !!alberoK.value || !!dialogo.value || !!consiglio.value || !!costruisciQui.value || semiAperto.value || !!macchinaAperta.value || livelliAperto.value || inventarioAperto.value || guardarobaAperto.value || !!bestiaAperta.value || !!negozioDi.value || !!battesimoDi.value || bancoAperto.value || nave.value || !!bottegaAperta.value || !!magazzinoAperto.value || mappaAperta.value || !!carretto.value || (opzioniAperte.value && !opzioniRidotte.value),
  zonaDrop: () => (zonaVia.value || null)?.getBoundingClientRect() || null,
  trascinando(info) { trascinando.value = info },
}

// ── le visite ai vicini (visite.js): la mappa del trattore, la scena del villaggio, la cassa e il mercato ──
const telaVisita = ref(null), sopraVisita = ref(null)
const visite = usaVisite({ dammi: () => ({ motore, mondo }), tela: telaVisita, sopra: sopraVisita, q, versione, cambio: () => ui.cambio() })
const { inVisita, mappaAperta, mappaMsg, fase: faseVisita, verso: versoVisita, scheda: schedaVisita, foglio: foglioVisita, storia: storiaVisita,
        messaggio: msgVisita, elenco: elencoVicini, chiave: chiaveTela, carretto, righeCarretto } = visite

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

// ── costruire: tenere premuto su un posto libero (o il tasto 🏗️) apre il menu «Costruisci qui» ──
const schede = computed(() => {
  void versione.value
  return schedeDi({ stagione: stagione.value, livello: motore.livello(), prezzoPezzo: t => motore.prezzoPezzo(t), nelMagazzino: t => motore.nelMagazzino(t), posseduti: motore.s.posseduti, bestieTue: motore.cura.tue() })
})
const festa = computed(() => {
  void versione.value
  return festaDaScoprire({ stagione: stagione.value, livello: motore.livello(), haPosato: t => motore.nelMagazzino(t) > 0 || motore.s.cose.some(c => c.tipo === t) })
})
function apriCostruisci(i, j) {
  if (mondo.eroe.az || strumento.value) return
  if (i === undefined) [i, j] = mondo.cellaDavanti()      // il tasto 🏗️: la cella davanti all'eroe
  mondo.annullaTrascinamento()
  guidaVisto.value = true
  costruisciQui.value = { i, j, msg: '' }
}
function chiudiCostruisci() { costruisciQui.value = null }

// ── le bestie di casa (G6): si prendono dal menu «Animali», si curano dal loro foglio (motore/cura.js) ──
const bestiaVista = computed(() => {
  void versione.value
  const id = bestiaAperta.value; if (!id || !motore) return null
  const st = motore.cura.stato(id); if (!st) return null
  const scorte = {}
  for (const g of [...CIBI_BESTIE, ...COCCOLE_3D]) if (g.da) scorte[g.da] = motore.scortaDi(g.da)
  return { id, nome: motore.cura.nomeDi(id), stato: { pancia: st.pancia, pelo: st.pelo, gioco: st.gioco }, monete: motore.monete(), scorte,
           vestiario: motore.cura.vestiarioDi(id, stagione.value || '') }
})
const negozioVista = computed(() => {
  void versione.value
  const id = negozioDi.value; if (!id || !motore) return null
  const b = curabile(id); if (!b) return null
  return { id, nome: motore.cura.nomeDi(id), emoji: b.emoji, monete: motore.monete(), vestiario: motore.cura.vestiarioDi(id, stagione.value || ''), addosso: motore.cura.addossoA(id) }
})
function esitoBestia(r, id) {
  const nome = motore.cura.nomeDi(id)
  bestiaMsg.value = r.ok ? dettoEsito(r, nome) : dettoCura(r, { monete: motore.monete() })
  if (r.ok) mondo.compagni.festa(id)
  ui.cambio()
}
function nutriBestia(cibo) { const id = bestiaAperta.value; if (id) esitoBestia(motore.cura.nutri(id, cibo.id), id) }
function coccolaBestia(gesto) { const id = bestiaAperta.value; if (id) esitoBestia(motore.cura.coccola(id, gesto.id), id) }
function carezzaBestia() { const id = bestiaAperta.value; if (id) esitoBestia(motore.cura.carezza(id), id) }
/** Il negozio degli addobbi: si apre dal foglio della bestia (che si richiude, e torna quando si esce dal negozio). */
function apriNegozio() { const id = bestiaAperta.value; if (!id) return; negozioMsg.value = ''; negozioDi.value = id; bestiaAperta.value = null }
function chiudiNegozio() { bestiaAperta.value = negozioDi.value; negozioDi.value = null }
/** Un colore comprato o rimesso dal negozio (`chiave` = `<id>:<colore>`): se non è nel cassetto si compra; la bestia in scena si veste da sé (compagni.sync). */
function compraAddobbo(chiave) {
  const id = negozioDi.value; if (!id) return
  const r = motore.cura.vesti(id, chiave, { stagione: stagione.value || '' }), nome = motore.cura.nomeDi(id)
  negozioMsg.value = r.ok ? `${r.addobbo.emoji} ${nome}: che eleganza!` : dettoCura(r, { monete: motore.monete() })
  if (r.ok) { mondo.compagni.sync(); mondo.compagni.festa(id) }
  ui.cambio()
}
function spogliaBestia(a) {
  const id = negozioDi.value; if (!id) return
  const r = motore.cura.spoglia(id, a.dove)
  negozioMsg.value = r.ok ? `${a.emoji} ${a.nome}: torna nel cassetto.` : dettoCura(r, { monete: motore.monete() })
  if (r.ok) mondo.compagni.sync()
  ui.cambio()
}
function spostaBestia() { const id = bestiaAperta.value; if (id && mondo.iniziaSposta(id)) bestiaAperta.value = null }
function daiIlNome(nome) {
  const id = battesimoDi.value; battesimoDi.value = null
  if (id) { motore.cura.battezza(id, nome); mondo.compagni.sync(); ui.cambio() }
}
/** Una carta «bestia» del menu: la tua apre il foglio, quella da prendere si compra (esperienza come ogni spesa) e comincia il battesimo. */
function sceglieBestia(carta, c) {
  const id = carta.bestia
  if (motore.cura.ho(id)) { costruisciQui.value = null; bestiaMsg.value = ''; bestiaAperta.value = id; return }
  const r = motore.cura.compra(id)
  if (!r.ok) { c.msg = dettoCompera(r, BESTIE[id].nome); return }
  costruisciQui.value = null
  mondo.compagni.sync()
  ui.cambio()
  battesimoDi.value = id
}
/** Una carta scelta: va sulla cella premuta. Se non ci sta, il menu si chiude e il fantasma aspetta; se mancano le monete il menu resta e lo dice. */
function sceglieCarta(carta) {
  const c = costruisciQui.value; if (!c) return
  if (carta.genere === 'strumento') { costruisciQui.value = null; return scegliStrumento(carta.id) }
  if (carta.genere === 'bestia') return sceglieBestia(carta, c)
  const r = mondo.costruisciQui(carta.id, c.i, c.j)
  if (r.esito === 'rifiuto') c.msg = dettoDi(r.motivo, { costo: r.costo, liv: r.liv })
  else costruisciQui.value = null                    // 'messo', o 'fantasma' (il fantasma resta sulla mappa)
}
function scegliStrumento(id) { strumento.value = id; mondo.imposta({ strumento: id }); avvisoTesto.value = '' }
function finisciStrumento() { strumento.value = null; mondo.imposta({ strumento: null }); avvisoTesto.value = '' }
function rispostaDialogo(i) {
  const d = dialogo.value; dialogo.value = null
  const b = d && d.bottoni[i]; if (b && b.fn) b.fn()
}

// ── il menu di una macchina ──
const macchina = computed(() => {
  void versione.value
  const tipo = macchinaAperta.value; if (!tipo) return null
  const M = motore.macchina(tipo), adesso = motore.ora(), E = EDIFICI[tipo]
  const pronti = Object.entries(M.pronti).filter(([, n]) => n > 0)
  return {
    tipo, titolo: E.emoji + ' ' + E.nome, dentro: dentroDi(tipo), prontoTesto: PRONTO_DA_RITIRARE,
    // i posti comprati (e una coda più lunga di quelli: lavora fino in fondo), poi i vani chiusi col prezzo; il prossimo si compra con un tocco
    bloccati: Array.from({ length: POSTI_MASSIMI - M.posti }, (_, k) => {
      const n = M.posti + k + 1, prezzo = prezzoDelPosto(n - 1)
      return { n, prezzo, prossimo: k === 0, puoi: motore.monete() >= prezzo }
    }),
    forno: Array.from({ length: Math.max(M.posti, M.coda.length) }, (_, k) => {
      const it = M.coda[k]; if (!it) return null
      const r = RICETTE[it.ric]
      if (!it.fine) return { k: it.ric, emoji: r.emoji, testo: 'in coda', barra: 0 }
      const resto = Math.max(0, it.fine - adesso)
      return { k: it.ric, emoji: r.emoji, testo: tempoBreve(resto), barra: 100 - 100 * resto / r.ms }
    }),
    pronti: pronti.length ? 'Pronti: ' + pronti.map(([k, n]) => emojiDi(k) + ' ×' + n).join('  ') : '',
    prontiK: pronti.map(([k, n]) => ({ k, n })),
    puoRitirare: pronti.length > 0,
    ricette: motore.ricetteDi(tipo).map(r => ({ k: r.id, nome: r.nome, emoji: r.emoji, ms: r.ms, costo: r.costo, liv: r.liv, sbloccata: r.sbloccata, ha: motore.scortaDi(r.id),
      ing: Object.entries(r.ing).map(([i, serve]) => ({ k: i, emoji: emojiDi(i), ha: motore.scortaDi(i), serve })),
      manca: Object.entries(r.mancano).map(([i, n]) => `manca ${emojiDi(i)} ${n}`).join(' '),
      puoi: r.sbloccata && r.ingredienti && M.coda.length < M.posti })),
  }
})
function prepara(k) {
  const tipo = macchinaAperta.value
  const r = motore.avviaRicettaIn(tipo, k)
  macchinaCons.value = null
  if (!r.ok) {
    if (r.motivo === 'mancano-ingredienti' && primaMancante(r)) macchinaCons.value = consiglioPer(primaMancante(r))
    return macchinaMsg.value = dettoDiRifiuto(r, { compra: motore.postiDi(tipo) < POSTI_MASSIMI })
  }
  macchinaMsg.value = ''; ui.cambio()
}
function compraPosto() {
  const tipo = macchinaAperta.value
  const r = motore.compraPosto(tipo)
  if (!r.ok) return macchinaMsg.value = dettoDiRifiuto(r, { costo: r.costo })
  macchinaMsg.value = ''; ui.cambio()
}
function ritira() {
  const tipo = macchinaAperta.value
  const r = motore.ritiraDa(tipo)
  if (!r.ok) { if (r.motivo === 'scomparto-pieno') macchinaMsg.value = dettoDiRifiuto(r); return }          // lo scomparto è pieno: la roba aspetta nella macchina
  macchinaMsg.value = r.pieno ? dettoDiRifiuto({ motivo: 'scomparto-pieno', k: r.pieno, max: motore.capienzaDi(r.pieno) }) : ''
  ui.cambio(); mondo.fx.volo('+' + r.n + ' ' + EDIFICI[tipo].emoji, mondo.pezzi.centroDi({ kind: 'edificio', tipo }), 2.6)
  mondo.eroe.avvia('esulta', 0.9)
}

// ── l'inventario: le scorte a schede (si calcola solo a foglio aperto) ──
const inventario = computed(() => { void versione.value; return inventarioAperto.value ? schedeDellInventario(motore.s, motore.livello(), k => motore.capienzaDi(k)) : null })
/** I magazzini già in mappa, per le scorciatoie in fondo all'inventario: quanto tiene ognuno, e un tocco apre il suo foglio. */
const magazzini = computed(() => { void versione.value; return inventarioAperto.value ? TIPI_DI_SILO.filter(silo => motore.edificiDelSilo(silo).length).map(silo => ({ silo, nome: SILOS[silo].nome, emoji: SILOS[silo].emoji, posti: motore.postiDelSilo(silo) })) : [] })
function vaiAlMagazzino(silo) { chiudiInventario(); ui.apriMagazzino(silo) }

// ── il foglio di un magazzino: le sue merci e il posto in più (docs/fattoria3d/magazzini.md) ──
const magazzino = computed(() => { void versione.value; return magazzinoAperto.value ? vistaDelMagazzino(motore, magazzinoAperto.value) : null })
function piuPosto() {
  const silo = magazzinoAperto.value, v = vistaDelMagazzino(motore, silo)
  if (v.passo === 'basta') return
  if (!v.puoi) return void (magazzinoMsg.value = `Ti mancano 🪙 ${v.mancano}: le monete si guadagnano negli altri giochi.`)
  const r = v.passo === 'nuovo' ? motore.costruisciMagazzino(silo) : motore.ingrandisciSilo(silo)
  if (!r.ok) return void (magazzinoMsg.value = dettoDiRifiuto(r, { costo: r.costo }))
  if (v.passo === 'nuovo') {                 // quello nuovo è nel magazzino dei pezzi: si mette come dal menu, davanti al contadino o col fantasma da trascinare
    magazzinoAperto.value = null; ui.cambio(); mondo.cambiato()
    const [i, j] = mondo.cellaDavanti(), q = mondo.costruisciQui(r.tipo, i, j)
    return void ui.avviso(q.esito === 'messo' ? `${SILOS[silo].emoji} Eccolo! Ogni ${SILOS[silo].cosa} ha posto per ${r.posti}.` : `${SILOS[silo].emoji} Mettilo dove vuoi: è nel menu Costruisci.`)
  }
  magazzinoMsg.value = `Fatto! Adesso ogni ${SILOS[silo].cosa} ha posto per ${r.posti}.`
  ui.cambio(); mondo.cambiato()
  for (const c of motore.edificiDelSilo(silo)) mondo.pezzi.salta(c.id)
  mondo.eroe.avvia('esulta', 0.9)
}
function apriInventario() { inventarioVisto = contoDi(motore.s); inventarioAperto.value = true; ripresa() }
function chiudiInventario() { inventarioVisto = contoDi(motore.s); inventarioAperto.value = false; ripresa() }

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
/** Le consegne fatte verso la prossima soglia del traguardo «Ordini al banco» (gioco.js): l'indicatore in cima alla bacheca. Niente premi nuovi. */
const traguardoOrdini = computed(() => {
  void versione.value
  const soglie = manifesto.albo.traguardi.find(t => t.id === 'f3d-ordini').soglie
  const fatte = Math.max(0, (state.profile.totals || {}).fattoria3dOrdini || 0)
  const meta = soglie.find(x => fatte < x) ?? soglie[soglie.length - 1]
  return { fatte: Math.min(fatte, meta), meta }
})
function apriBanco() { bancoMsg.value = ''; bancoCons.value = null; bancoAperto.value = true }
function consegna(idx) {
  const r = motore.consegna(idx)
  bancoCons.value = !r.ok && r.motivo === 'mancano' && primaMancante(r) ? consiglioPer(primaMancante(r)) : null
  if (!r.ok) return bancoMsg.value = r.motivo === 'mancano' ? dettoDi('mancano-ingredienti', { ingredienti: r.mancano }) : dettoDi(r.motivo)
  ui.cambio()                                // `contaEventi` vede l'evento «consegna» e scrive l'esito
}
function cambiaOrdine(idx) {
  const r = motore.rifiuta(idx)
  if (!r.ok) return bancoMsg.value = dettoDi(r.motivo)
  bancoMsg.value = 'Va bene: il posto si riempie fra qualche minuto.'; ui.cambio()
}

// ── la mongolfiera: la nave, tre file di casse (docs/fattoria3d/mongolfiera.md) ──
const mongolfiera = computed(() => { void versione.value; return motore.vistaMongolfiera() })
function caricaCassa(i, c) {
  const r = motore.caricaCassa(i, c)
  naveCons.value = !r.ok && r.motivo === 'mancano' && primaMancante(r) ? consiglioPer(primaMancante(r)) : null
  if (!r.ok) return naveMsg.value = r.motivo === 'mancano' ? dettoDi('mancano-ingredienti', { ingredienti: r.mancano }) : dettoDi(r.motivo)
  const testo = [`+${r.xp} ⭐`, r.bonusFila ? `fila piena +${r.bonusFila}` : '', r.bonusTutto ? `tutto pieno +${r.bonusTutto}` : ''].filter(Boolean).join(' · ')
  naveMsg.value = r.pieno
    ? `Tutto pieno! ${testo}.${r.sorpresa ? ` Sorpresa della fiera: ${PEZZI[r.sorpresa].emoji} ${PEZZI[r.sorpresa].nome} nel magazzino.` : ''} La mongolfiera parte e torna con un nuovo carico.`
    : testo + '.'
  ui.cambio()
  mondo.fx.volo('+' + r.xp + ' ⭐', mondo.pezzi.centroDi({ kind: 'edificio', tipo: 'mongolfiera' }), 3)
  mondo.eroe.avvia('esulta', 0.9)
}
function partiMongolfiera() {
  const r = motore.partiMongolfiera()
  if (!r.ok) return naveMsg.value = dettoDi(r.motivo)
  naveMsg.value = `Partita con ${r.piene} casse su ${r.di}: torna con un nuovo carico.`; ui.cambio()
}
/** Le casse messe sulla mongolfiera verso la prossima soglia del traguardo «Sulla mongolfiera» (gioco.js). Niente premi nuovi. */
const traguardoNave = computed(() => {
  void versione.value
  const soglie = manifesto.albo.traguardi.find(t => t.id === 'f3d-mongolfiera').soglie
  const fatte = Math.max(0, (state.profile.totals || {}).fattoria3dMongolfiera || 0)
  const meta = soglie.find(x => fatte < x) ?? soglie[soglie.length - 1]
  return { fatte: Math.min(fatte, meta), meta }
})

// ── le botteghe del paese: un cliente per bancone, una merce sola, la fama a cuori (docs/fattoria3d/botteghe.md) ──
const bottega = computed(() => { void versione.value; return bottegaAperta.value ? motore.vistaBottega(bottegaAperta.value) : null })
function consegnaBottega(n) {
  const tipo = bottegaAperta.value, r = motore.consegnaBottega(tipo, n)
  bottegaCons.value = !r.ok && r.motivo === 'mancano' && primaMancante(r) ? consiglioPer(primaMancante(r)) : null
  if (!r.ok) return bottegaMsg.value = r.motivo === 'mancano' ? dettoDi('mancano-ingredienti', { ingredienti: r.mancano }) : dettoDi(r.motivo)
  bottegaMsg.value = `Consegnato a ${r.cliente.nome}: +${r.xp} ⭐.${r.cresciuta ? ' La bottega è famosa: un bancone in più!' : ''}`
  ui.cambio()
  mondo.fx.volo('+' + r.xp + ' ⭐', mondo.pezzi.centroDi({ kind: 'edificio', tipo }), 3)
  mondo.eroe.avvia('esulta', 0.9)
}
function rifiutaBottega(n) {
  const r = motore.rifiutaBottega(bottegaAperta.value, n)
  if (!r.ok) return bottegaMsg.value = dettoDi(r.motivo)
  bottegaMsg.value = `Va bene: il prossimo cliente arriva fra ${r.attesa} minuti.`; ui.cambio()
}

// ── le opzioni di qualità ──
function cambiaOpzioni() { mondo.applica(q); save(CHIAVE_OPZIONI, { v: VERSIONE_OPZIONI, q: { ...q } }) }
function creaRapporto() {
  const st = mondo.statistiche(), cn = mondo.conteggi()
  rapporto.value = [
    `Fattoria 3D — ${new Date().toISOString().slice(0, 16)}`,
    `Dispositivo: ${navigator.userAgent}`,
    `Schermo: ${innerWidth}×${innerHeight} @${devicePixelRatio} · pixel ratio scelto ${q.scala} · usato ${st.dpr.toFixed(2)} (degrado: livello ${st.livello}, ombre ogni ${st.ombraOgni})`,
    `GPU: ${mondo.gpu()}`,
    `Preset: ${q.preset} · ombre ${q.ombre ? q.ombraRes : 'spente'}`,
    `fps ${st.fps.toFixed(0)} · peggiore ${st.peggiore.toFixed(0)} ms · 1% ${st.p1.toFixed(0)} ms`,
    `JS per fotogramma: scena ${st.cpu.toFixed(1)} ms (logica ${st.logica.toFixed(1)} + disegno ${st.disegno.toFixed(1)}) · il resto del fotogramma (GPU, pagina, Vue) ${st.fuori.toFixed(1)} ms`,
    `draw call ${st.calls} · triangoli ${st.triangoli} · geometrie ${st.geometrie} · texture ${st.texture} · programmi ${st.programmi}`,
    `In scena: ${cn.campi} campi, ${cn.edifici} edifici, ${cn.altri} altri pezzi, ${cn.compagni} compagni, ${cn.cartelli} cartelli · ${cn.mesh} mesh (${cn.ombre} proiettano ombra, ${cn.istanze} a istanze) · ${st.cose} cose del motore (di prova ${st.prove})`,
    `Impostazioni: ${JSON.stringify(q)}`,
  ].join('\n')
}
const conta = computed(() => { void versione.value; return { cose: motore.cose.length, prove: motore.prove.length } })

// ── la guida del primo giro e il consiglio (docs/fattoria3d/guida.md) ──
const radice = ref(null)
const guidaAttiva = ref(false)           // si decide una volta sola, all'apertura: chi ha già giocato non la vede mai
const guidaVisto = ref(false)            // ha già aperto il menu «Costruisci qui» durante il primo giro
const consiglio = ref(null)              // il foglio «E adesso?»: { testo, azione, etichetta }
const macchinaCons = ref(null), bancoCons = ref(null), naveCons = ref(null), bottegaCons = ref(null)      // il passo per avere ciò che manca, sotto il messaggio di ogni foglio
const quadroGuida = () => {
  const m = motore, cs = m.s.cose.filter(c => c.tipo === 'campo')
  const crescono = cs.filter(c => !m.campoVuoto(c) && !m.campoMaturo(c)), restanti = crescono.map(c => m.restoSecondi(c))
  return {
    campi: cs.length, vuoti: cs.filter(c => m.campoVuoto(c)).length, maturi: cs.filter(c => m.campoMaturo(c)).length, crescono: crescono.length,
    secondi: restanti.length ? Math.min(...restanti) : 0, modo: modo.value, semi: semiAperto.value, costruisci: !!costruisciQui.value,
    foglio: !!(alberoK.value || dialogo.value || macchinaAperta.value || livelliAperto.value || inventarioAperto.value || guardarobaAperto.value || !!bestiaAperta.value || !!negozioDi.value || !!battesimoDi.value || bancoAperto.value || nave.value || bottegaAperta.value || magazzinoAperto.value || mappaAperta.value || !!carretto.value || opzioniAperte.value || consiglio.value || strumento.value || trascinando.value),
    raccolto: Object.values(m.s.merci).some(n => n > 0), visto: guidaVisto.value,
  }
}
const passoGuida = computed(() => {
  void versione.value
  if (!guidaAttiva.value || !motore || inVisita.value) return null
  return guidaDelPrimoGiro(quadroGuida())
})
usaGuida(radice, passoGuida)
const guidaInAlto = computed(() => semiAperto.value || !!costruisciQui.value)       // con un foglio aperto la riga sta in alto, se no finirebbe sotto
function chiudiLaGuida() {
  if (!guidaAttiva.value || !motore) return
  if (primoGiroFinito({ raccolto: quadroGuida().raccolto, visto: guidaVisto.value, esperienza: motore.esperienza() })) {
    guidaAttiva.value = false
    ricorda(CHIAVE, 'guida', { finita: true })
  }
}
/** «E adesso?»: il consiglio del momento. */
function apriConsiglio() { consiglio.value = cosaFaccioAdesso(motore) }
/** Il tasto di un consiglio: chiude il foglio da cui si è partiti e porta dove si fa. */
function facciConsiglio(a) {
  if (a && a.che === 'albero') return apriAlbero(a.k)          // «Come si fa» si apre sopra il foglio, che resta dov'è
  alberoK.value = ''; if (inventarioAperto.value) chiudiInventario()
  consiglio.value = null; magazzinoAperto.value = null; macchinaAperta.value = null; bancoAperto.value = false; nave.value = false; bottegaAperta.value = null; semiAperto.value = false
  if (!a) return
  if (a.che === 'semina') { seme.value = a.seme || seme.value; mondo.imposta({ seme: seme.value }); impostaModo('semina') }
  else if (a.che === 'raccogli') impostaModo('raccogli')
  else if (a.che === 'macchina') ui.apriMacchina(a.tipo)
  else if (a.che === 'costruisci') apriCostruisci()
  else if (a.che === 'banco') apriBanco()
  else if (a.che === 'livelli') apriLivelli()
  else if (a.che === 'inventario') apriInventario()
  else if (a.che === 'magazzino') ui.apriMagazzino(a.silo)
  else if (a.che === 'home') indietro()
}
/** Il consiglio per avere ciò che manca, col tasto «🌳 Come si fa» per la stessa merce (docs/fattoria3d/guida.md). */
const consiglioPer = k => ({ ...comeAvere(motore, k), albero: k })
// ── «Come si fa»: la strada di una merce (dati/albero.js), a figure; si apre dall'inventario e dal passo sotto un «non si può» ──
const alberoK = ref('')
const albero = computed(() => { void versione.value; return alberoK.value ? alberoDi(motore, alberoK.value, k => comeAvere(motore, k)) : null })
function apriAlbero(k) { alberoK.value = k; ripresa() }
function chiudiAlbero() { alberoK.value = ''; ripresa() }
const primaMancante = r => Object.keys(r.mancano || {})[0]

// ── il battito della vista: statistiche, contatori e cose che passano col tempo ──
let battito = 0
function ritmo() {
  if (!motore) return
  contaEventi(); ripresa(); chiudiLaGuida()
  const t = performance.now()
  if (toast.value && t >= toast.value.fine) toast.value = null
  if (avvisoFine && t >= avvisoFine) { avvisoFine = 0; avvisoTesto.value = '' }
  cameraLibera.value = mondo.cameraLibera
  if (opzioniAperte.value) stat.value = { ...mondo.statistiche(), ...mondo.conteggi() }
  if (sporco) salva()
}

function indietro() {
  if (inVisita.value) return void visite.torna()          // in visita, «indietro» riporta a casa, non in home
  if (comune) return void chiediIngresso(CHIAVE, {})       // dalla fattoria in comune si torna alla propria
  salva({ subito: true }); emit('vai', 'home')
}

/** #fattoria3d-tipo=N mette una fattoria già giocata di quel livello (quella del bambino va nel cestino); #fattoria3d=N alza il livello
    e non lo abbassa mai. L'indirizzo si legge una volta e si svuota: un ricaricamento non ripete il cheat. Vedi docs/core/comandi.md. */
function cheatDellIndirizzo() {
  const frammento = location.hash || ''
  const tipo = /(?:^#?|&)fattoria3d-tipo=(\d{1,2})(?=&|$)/i.exec(frammento)
  const livello = /(?:^#?|&)fattoria3d=(\d{1,2})(?=&|$)/i.exec(frammento)
  const da2d = /(?:^#?|&)fattoria3d-da2d(?=&|$)/i.test(frammento)
  if (!tipo && !livello && !da2d) return
  try { location.hash = '' } catch (e) { /* pazienza */ }
  let testo
  if (da2d) {
    const stato = statoRifattoDa2D(scelta)
    if (!stato) testo = '🧪 Questo bambino non ha una fattoria 2D da portare: non ho toccato niente.'
    else {
      cestinaOra('fattoria3d da2d')          // la 3D di prima (se c'è) va nel cestino, prima di sostituirla
      motore = new Fattoria3d({ stato, borsa })
      testo = `🧪 Fattoria 3D rifatta dalla 2D, livello ${motore.livello()}: quella di prima è nel cestino.`
    }
  } else if (tipo) {
    cestinaOra('fattoria3d tipo')          // la copia si prende subito, prima di qualunque attesa
    motore = fattoriaTipo(parseInt(tipo[1], 10))
    motore.borsa = borsa
    testo = `🧪 Fattoria di prova al livello ${motore.livello()}: quella di prima è nel cestino.`
  } else {
    const meta = parseInt(livello[1], 10)
    if (motore.esperienza() < sogliaDi(meta)) motore.s.esperienza = sogliaDi(meta)
    testo = `🧪 Livello ${motore.livello()}.`
  }
  salva({ subito: true })
  toast.value = { testo, fine: performance.now() + DURATA_TOAST }
}

// ── la fattoria in comune: entrare, e le mosse dell'amico che arrivano ──
const amiciComune = computed(() => amiciPerComune())
function apriInsieme() {
  ui.chiedi('Insieme', 'Una fattoria in comune con un amico: ognuno ci gioca quando vuole, con le sue monete, e trova quello che ha fatto l\'altro. Serve internet.',
    [...amiciComune.value.map(a => ({ t: `🤝 Con ${a.nome}`, fn: () => { salva({ subito: true }); chiediIngresso(CHIAVE, { comune: a.chiave }) } })), { t: 'Non ora', quieto: true }])
}
function arrivaDallAmico({ mosse, ricarica }) {
  if (ricarica) return void chiediIngresso(CHIAVE, { comune })          // l'amico è andato troppo avanti: si riparte dalla fotografia
  if (!mondo) return
  mondo.cambiato()
  if (mosse.some(m => TERRA.has(m.n))) mondo.terreno.ridisegnaTutto()
  const ultima = mosse[mosse.length - 1]
  toast.value = { testo: `🤝 ${nomeDellAmico(comune)} ${dettoDellaMossa(ultima.n)}`, fine: performance.now() + DURATA_TOAST }
  const su = mosse.filter(m => m.livello).pop()
  if (su) salito(su.livello.livello)
  ripresa()
}

// il mio contadino all'amico, sul collegamento degli amici: cinque volte al secondo se cambia qualcosa, ogni due secondi comunque
// (così sa che ci sono), con l'abito; il suo arriva a `arrivaQui` e cammina nella mia scena (scena3d/ospite.js)
const OGNI_QUI = 200, ANCORA_QUI = 2000
let timerQui = 0, spedito = '', speditoA = 0
function mandaQui() {
  if (!mondo) return
  const e = mondo.eroe, g = e.az && GESTI.includes(e.az.tipo) ? e.az.tipo : null
  const m = msgQui({ x: e.x, z: e.z, d: e.dir, r: e.corsa, g }), firma = JSON.stringify(m), t = performance.now()
  if (firma === spedito && t - speditoA < ANCORA_QUI) return
  if (t - speditoA >= ANCORA_QUI) m.a = { ...abito.value }
  spedito = firma; speditoA = t
  mandaA(comune, m)
}
function arrivaQui(chiave, l) {
  if (chiave !== comune || !mondo) return
  if (l.k === 'via') return void mondo.ospiteVia()
  mondo.ospiteQui({ nome: nomeDellAmico(comune), abito: l.a ? normalizzaAbito(l.a, l.a.persona) : null }, l)
}

onMounted(async () => {
  if (!puo.value) return
  if (comune) {
    try { sessione = await apriComune({ chiave: comune, borsa }) } catch (e) { erroreComune.value = e.message; statoComune.value = 'errore'; return }
    if (!vivo) return void sessione.chiudi()
    motore = sessione.motore
    statoComune.value = 'pronto'
  } else motore = new Fattoria3d({ stato: statoDaCaricare(scelta), borsa })
  // `&stress=campo:10,edifici:15` (le prove di stress, che non si salvano) e `&degrado=no` (qualità ferma): per le misure, docs/fattoria3d/limiti.md
  const frammento = location.hash || ''
  const stress = ((/(?:^#?|&)stress=([\w:,]+)/.exec(frammento) || [])[1] || '').split(',').map(x => x.split(':')).filter(([t, n]) => t && Number(n) > 0)
  const degradoFermo = /(?:^#?|&)degrado=no(?:&|$)/.test(frammento)
  if (!comune) cheatDellIndirizzo()
  try { const c = await load(CHIAVE_OPZIONI); if (c && c.q && c.v === VERSIONE_OPZIONI) Object.assign(q, c.q) } catch (e) { /* le opzioni di serie */ }
  const { Mondo3d } = await import('./scena3d/mondo3d.js')          // three si scarica solo qui
  if (!vivo) return
  mondo = new Mondo3d({ canvas: tela.value, sopra: sopra.value, motore, ui, qualita: q, abito: abito.value, stagione: stagione.value })
  mondo.degradoFermo = degradoFermo
  for (const [t, n] of stress) mondo.stress(t, Number(n))
  mondo.avvia()
  guidaAttiva.value = !comune && !saltaLeSpiegazioni() && !(scelta(CHIAVE, 'guida', null) || {}).finita && servePrimoGiro(motore.s)
  if (sessione) { sessione.alCambio = arrivaDallAmico; sessione.avvia(); quandoQui(arrivaQui); timerQui = setInterval(mandaQui, OGNI_QUI) }
  else visite.avvia(scelta(CHIAVE, 'vicini', null))
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
  sessione?.chiudi()
  if (sessione) { clearInterval(timerQui); quandoQui(null); mandaA(comune, msgVia()) }
  visite.via()
  mondo?.via()
  delete window.__fattoria3d
})
</script>

<template>
  <div ref="radice" class="schermo">
    <Barra :titolo="comune ? `Con ${nomeDellAmico(comune)}` : 'La fattoria'" guida="fattoria3d" monete @indietro="indietro" />

    <div v-if="!puo" class="f3-senza" data-senza-3d>
      <p class="em">🚜</p>
      <h1>Qui il 3D non si può disegnare</h1>
      <p>Questo telefono non sa disegnare la fattoria in tre dimensioni. La fattoria di sempre c'è.</p>
      <button type="button" data-azione="esci-3d" @click="emit('vai', 'home')">torno ai giochi</button>
    </div>

    <div v-else class="f3" data-f3="campo">
      <div v-if="statoComune === 'collego' || statoComune === 'errore'" class="f3-comune-attesa" data-f3="comune-attesa" :data-errore="statoComune === 'errore' ? '' : null">
        <p class="em">🤝</p>
        <p>{{ statoComune === 'errore' ? erroreComune : `Vado nella fattoria con ${nomeDellAmico(comune)}…` }}</p>
        <button v-if="statoComune === 'errore'" type="button" data-f3="torna-mia" @click="indietro">🏠 Torno alla mia fattoria</button>
      </div>
      <canvas ref="tela" class="f3-tela"></canvas>
      <div ref="sopra" class="f3-sopra"></div>

      <template v-if="mondo || versione">
        <div class="f3-casa" v-show="!inVisita">
        <Hud v-bind="foto" :nuovo="livelloNuovo" :banco="banco" @livello="apriLivelli" @banco="apriBanco" @inventario="apriInventario" @abito="guardarobaAperto = true" />
        <div v-if="toast" class="f3-toast" data-f3="avviso-livello">⭐ {{ toast.testo }}</div>
        <button class="f3-angolo" aria-label="opzioni" data-f3="apri-opzioni" @click="opzioniAperte = !opzioniAperte">⚙</button>
        <button v-if="!comune && amiciComune.length" class="f3-angolo f3-insieme" aria-label="la fattoria in comune" data-f3="apri-comune" @click="apriInsieme">🤝</button>
        <button v-if="comune" class="f3-angolo f3-insieme" aria-label="torna alla tua fattoria" data-f3="torna-mia" @click="indietro">🏠</button>
        <button class="f3-adesso" aria-label="cosa faccio adesso" data-f3="apri-consiglio" @click="apriConsiglio">🧭 E adesso?</button>
        <div v-if="passoGuida" class="f3-guida" :class="{ su: guidaInAlto }"><Guida :passo="passoGuida" /></div>
        <button v-if="cameraLibera" class="f3-centra" data-f3="centra" @click="mondo.tornaAllEroe()">⌖ Torna {{ nomeDelContadino(abito, 'al') }}</button>

        <BarraAzioni v-if="!strumento && !trascinando" :modo="modo" :seme="COLTURE[seme].emoji" :da-fare="foto.daFare"
                     @modo="impostaModo" @semina="apriSemina" @costruisci="apriCostruisci()" :da-costruire="foto.daCostruire" :festa="festa ? festa.icona : ''" />
        <BarraStrade v-if="strumento" :strumento="strumento" :testo="avvisoTesto" @strumento="scegliStrumento" @fatto="finisciStrumento" />

        <!-- un pezzo sollevato tenendo premuto, o il fantasma del menu che aspetta un posto: si rilascia sulla mappa o su questa fascia -->
        <button v-if="trascinando" ref="zonaVia" class="f3-zonavia" :class="{ bersaglio: trascinando.perMettereVia || trascinando.perAnnullare }" data-f3="zona-via"
                @click="trascinando.parcheggiato && mondo.annullaTrascinamento()">
          {{ trascinando.nuovo ? '✖️' : '📦' }} {{ avvisoTesto || (trascinando.nuovo ? 'Trascinalo dove vuoi, o qui per annullare' : 'Trascinalo dove vuoi, o qui per mettere via') }}
        </button>
        <button v-if="trascinando && trascinando.ruotabile && !trascinando.su" class="f3-ruota" data-f3="ruota" :data-rot="trascinando.rot" aria-label="Gira"
                @pointerdown.prevent="mondo.ruotaTenuto()" @keydown.enter.prevent="mondo.ruotaTenuto()">↻</button>
        <div v-if="trascinando && trascinando.su" class="f3-trascinato" :style="{ transform: `translate(${trascinando.x}px, ${trascinando.y - 56}px) translate(-50%, -50%)` }">{{ trascinando.emoji }}</div>

        <CostruisciQui v-if="costruisciQui" :schede="schede" :messaggio="costruisciQui.msg" :anteprima="anteprima" :anteprima-pronta="anteprimaPronta" :festa="festa" @scegli="sceglieCarta" @chiudi="chiudiCostruisci" />
        <SceltaSeme v-if="semiAperto" :seme="seme" :livello="foto.livello" :scorte="scorteSeme" @scegli="scegliSeme" @chiudi="semiAperto = false" />
        <Macchina v-if="macchina" :key="macchina.tipo" v-bind="macchina" :messaggio="macchinaMsg" :anteprima="anteprima" :anteprima-pronta="anteprimaPronta" @prepara="prepara" @compra="compraPosto" @ritira="ritira" @chiudi="macchinaAperta = null"
                  :consiglio="macchinaCons" @consiglio="facciConsiglio" />
        <Bacheca v-if="bancoAperto" v-bind="{ aperto: banco.aperto, perche: banco.perche, ordini: banco.ordini, traguardo: traguardoOrdini }" :messaggio="bancoMsg" :consiglio="bancoCons" @consiglio="facciConsiglio"
               @consegna="consegna" @cambia="cambiaOrdine" @chiudi="bancoAperto = false" />
        <Mongolfiera v-if="nave" v-bind="{ nave: mongolfiera, traguardo: traguardoNave, livelloIngresso: LIVELLO_MONGOLFIERA }" :messaggio="naveMsg" :consiglio="naveCons" @consiglio="facciConsiglio"
                     @carica="caricaCassa" @parti="partiMongolfiera" @chiudi="nave = false" />
        <Magazzino v-if="magazzino" :vista="magazzino" :messaggio="magazzinoMsg" @ingrandisci="piuPosto" @chiudi="magazzinoAperto = null" />
        <Bottega v-if="bottega" :bottega="bottega" :messaggio="bottegaMsg" :consiglio="bottegaCons" @consiglio="facciConsiglio" @consegna="consegnaBottega" @rifiuta="rifiutaBottega" @chiudi="bottegaAperta = null" />
        <Inventario v-if="inventarioAperto && inventario" :schede="inventario" :magazzini="magazzini" @magazzino="vaiAlMagazzino" @albero="apriAlbero" @chiudi="chiudiInventario" />
        <Guardaroba v-if="guardarobaAperto" :abito="abito" :livello="foto.livello" :aspetto="state.profile.aspetto" :anteprima="anteprima" :anteprima-pronta="anteprimaPronta"
                    @vesti="vestiContadino" @aspetto="cambiaAspetto" @chiudi="guardarobaAperto = false" />
 <Albero v-if="albero" :albero="albero" @fai="facciConsiglio" @chiudi="chiudiAlbero" />
 <Consiglio v-if="consiglio" :consiglio="consiglio" @fai="facciConsiglio" @chiudi="consiglio = null" />
        <Livelli v-if="livelliAperto" v-bind="livelli" @chiudi="livelliAperto = false" />
        <Bestia v-if="bestiaVista" :key="bestiaVista.id" v-bind="bestiaVista" :messaggio="bestiaMsg" :anteprima="anteprima" :anteprima-pronta="anteprimaPronta"
                @nutri="nutriBestia" @coccola="coccolaBestia" @carezza="carezzaBestia" @sposta="spostaBestia" @negozio="apriNegozio" @nome="battesimoDi = bestiaAperta; bestiaAperta = null" @chiudi="bestiaAperta = null" />
        <NegozioBestia v-if="negozioVista" :key="negozioVista.id" v-bind="negozioVista" :messaggio="negozioMsg" :anteprima="anteprima" :anteprima-pronta="anteprimaPronta"
                       @compra="compraAddobbo" @spoglia="spogliaBestia" @chiudi="chiudiNegozio" />
        <Battesimo v-if="battesimoDi" :id="battesimoDi" :scelto="motore.cura.nomeScelto(battesimoDi)" @scegli="daiIlNome" @chiudi="battesimoDi = null" />
        <Opzioni v-if="opzioniAperte" :q="q" :stat="stat" :conta="conta" :rapporto="rapporto" @cambia="cambiaOpzioni"
                 @stress="(t, n) => { mondo.stress(t, n); ui.cambio() }" @rapporto="creaRapporto" @ridotto="v => opzioniRidotte = v"
                 @chiudi="opzioniAperte = false; opzioniRidotte = false" />
        <Dialogo v-if="dialogo" v-bind="{ titolo: dialogo.titolo, testo: dialogo.testo, bottoni: dialogo.bottoni }" @scelta="rispostaDialogo" />
        <Mappa v-if="mappaAperta" :elenco="elencoVicini" :messaggio="mappaMsg" @vai="visite.vai" @carretto="visite.apriCarretto" @chiudi="mappaAperta = false" />
        <Carretto v-if="carretto" :passo="carretto.passo" :dato="carretto.dato" :quanti="DAI_CARRETTO" :dai="righeCarretto.dai" :offre="righeCarretto.offre" :messaggio="carretto.msg"
                  @dai="visite.carrettoDai" @ricevi="visite.carrettoRicevi" @indietro="visite.carrettoIndietro" @chiudi="visite.chiudiCarretto" />
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

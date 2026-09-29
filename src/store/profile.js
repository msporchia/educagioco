// Profilo condiviso: monete, campagne, apprendimento. Vedi docs/core/archivio.md.
import { reactive, computed } from 'vue'
import { load, save, flush, remove, detectBackend, backend, chiavi,
         travasaRipiego, chiediPersistenza } from './storage.js'
import { scordaSessioni } from './sessioni.js'
import { newItem, record as srsRecord, isMastered, strength } from './srs.js'
import { acceso as suonoAcceso } from '../audio.js'
import { CHIAVI_GIOCHI, eSperimentale, serveA } from '../data/giochi.js'
import { SAPERI } from '../data/saperi.js'
import { eccezioniDi, eccezioniPerEta, spostandoLEta,
         rimettendoLEta, partenzaPerEta } from '../data/partenze.js'
import { finestraDi } from '../quiz/nucleo/classi.js'
import { PERSONE } from '../giochi/fattoria/dati/atlante.js'
import { ULTIMA as ULTIMA_NOVITA } from '../guide/novita-bambini.js'
import { SCALETTA, campagneDaFila, filaDaCampagne, filaDopo } from '../data/asteroidi.js'
import { allineaCalcolo } from './calcolo.js'
import { cestina, voceCestinata } from './cestino.js'
import { riscuotiTraguardi, segnaGiorno, serieViva, livelloTotale,
         progressoArea, statoTraguardi, abilita, difficolta,
         tabellineIntereDi, allineaMate, allineaInglese,
         allineaSpagnolo } from './progressi.js'

// Un giocatore è { id, nome }: l'id è la chiave del salvataggio e non
// cambia mai, il nome è solo l'etichetta (vedi docs/core/archivio.md).
const KEY_ROSTER = 'giocatori'
const KEY = id => 'profilo:' + id
const PREFISSO = 'profilo:'

const blank = () => ({
  v: 7,
  coins: 0,
  items: {},                       // 'math:7x8' | 'en:butterfly' -> stato
  // `sa`: macrogruppi di scuola spenti (docs/apprendimento/saperi.md).
  // `giochi`: carte spente in home, eccezioni (docs/genitori/interruttori.md).
  // `tuttoAperto`: lucchetti delle campagne tolti, vedi `tappaAperta()` sotto.
  settings: { tables: [2, 3, 4, 5], sound: true, music: true,
              giochi: {}, sa: {}, tuttoAperto: false },
  totals: { math: 0, mente: 0, en: 0, verbi: 0, frasi: 0, es: 0, verbiEs: 0, frasiEs: 0, td: 0,
            partiteMath: 0, torri: 0, perfette: 0, ondate: 0,
            misure: 0, pozioni: 0, pozioniPerfette: 0,
            clienti: 0, restiPerfetti: 0, incasso: 0, mercati: 0,
            missioni: 0, stelle: 0, ordini: 0, daSolo: 0, avanzati: 0,
            monete: 0 },
  best: { math: 0, serieMath: 0, onda: 0, serieGiorni: 0, pozioni: 0, clienti: 0 },
  td: { tappa: 0, libera: false, v: 2 },   // `v`: vedi `migraCastello`
  mate: { tappa: 0, fila: 0, libera: false },   // fila unica, vedi `sincronizzaAsteroidi`
  calc: { tappa: 0, libera: false },// specchio delle stazioni a mente
  eng: { tappa: 0, libera: false }, // e per la campagna di English
  esp: { tappa: 0, libera: false }, // e per quella di Spagnolo
  mercato: { tappa: 0, libera: false, v: 2 },   // `v`: vedi `migraMercato`
  // `ordini`/`stelle`/`aiuti` per livello (chiave = id, non posizione): vedi `migraGenerale`
  gen: { tappa: 0, libera: false, ordini: {}, stelle: {}, aiuti: {}, v: 2 },
  // i giochi di src/giochi/ stanno tutti qui: 'codice' -> { tappa, libera, stelle:{}, cfg:{} }
  // (vedi src/giochi/campagne.js: un gioco nuovo non aggiunge un campo al profilo)
  campagne: {},
  giorni: { ultimo: '', serie: 0, record: 0, totali: 0 },   // i giorni di fila
  badge: {},                        // id traguardo -> { g: grado preso, t: quando }
  badgeInit: 0,                     // 1 = i traguardi già meritati sono stati registrati
})

export const state = reactive({
  giocatori: [],            // [{ id, nome }] — vuoto vuol dire «primo avvio»
  player: '',               // l'id di chi sta giocando, '' se non c'è nessuno
  profile: blank(),
  loaded: false,
  storage: 'memoria',
  regalo: { n: 0, k: 0 },   // monete arrivate dall'indirizzo: quante, e un
                            // contatore per rifare l'animazione ogni volta
  festa: [],                // traguardi appena presi, in attesa di essere mostrati
})

// Passa da qui e non da audio.js: è una preferenza del profilo, va salvata.
export function accendiSuono(si) {
  suonoAcceso.value = !!si
  state.profile.settings.sound = !!si
  persist()
}

// Personaggio in mappa: attributo del bambino, non di un gioco. Il valore di
// partenza si calcola qui e non in `blank()` (vedi docs/core/archivio.md).
export function aspettoDi() {
  const p = state.profile
  if (typeof p.aspetto !== 'string' || !PERSONE.includes(p.aspetto)) p.aspetto = PERSONE[0]
  return p.aspetto
}
export function scegliAspetto(nome) {
  if (!PERSONE.includes(nome)) return false
  state.profile.aspetto = nome
  persist()
  return true
}

// Una voce vale se ha un id: senza non si sa quale salvataggio caricare.
function normalizzaVoce(v) {
  if (typeof v === 'string') return { id: v, nome: v }        // forma vecchia, mai pubblicata
  if (!v || typeof v !== 'object' || !v.id) return null
  return { id: String(v.id), nome: String(v.nome ?? v.id) }
}

// Ricostruisce il roster enumerando le chiavi `profilo:*` in archivio,
// per il primo avvio dopo l'aggiornamento che ha introdotto il roster.
async function rosterDalleChiavi() {
  const ks = await chiavi(PREFISSO)
  return ks.map(k => k.slice(PREFISSO.length)).filter(Boolean).map(id => ({ id, nome: id }))
}

async function caricaRoster() {
  const salvato = await load(KEY_ROSTER)
  if (Array.isArray(salvato)) {
    const buone = salvato.map(normalizzaVoce).filter(Boolean)
    if (buone.length) return buone
  }
  return rosterDalleChiavi()
}

function salvaRoster() {
  save(KEY_ROSTER, state.giocatori.map(g => ({ id: g.id, nome: g.nome })))
}

export const giocatore = id => state.giocatori.find(g => g.id === id) || null
export const nomeDi = id => (giocatore(id) || {}).nome || ''
export const nomeCorrente = () => nomeDi(state.player)

// Un id opaco mai usato: guarda anche l'archivio, non solo il roster,
// perché un profilo eliminato può aver lasciato la sua chiave.
async function idLibero() {
  const presi = new Set(state.giocatori.map(g => g.id))
  for (const k of await chiavi(PREFISSO)) presi.add(k.slice(PREFISSO.length))
  for (let i = 1; ; i++) if (!presi.has('g' + i)) return 'g' + i
}

// `entra`: sì al primo avvio, no dalla schermata dei genitori (un fratellino
// non caccia chi gioca). `partenza`: un'età in anni, applicata una sola volta.
export async function creaGiocatore(nome, entra = true, partenza = null, aspetto = null) {
  const pulito = String(nome || '').trim().slice(0, 20)
  if (!pulito) throw new Error('Serve un nome')
  const id = await idLibero()
  state.giocatori.push({ id, nome: pulito })
  salvaRoster()
  const fresco = blank()
  if (partenza != null && partenza !== '') {
    const { giochi, sa, eta } = typeof partenza === 'number'
      ? eccezioniPerEta(partenza)
      : eccezioniDi(partenza)
    fresco.settings = { ...fresco.settings, giochi, sa }
    if (eta) fresco.settings.eta = eta
  }
  // un nome che PERSONE non ha (mai dovrebbe capitare, da un tasto che
  // mostra solo quelli) si ignora invece di scriverlo: meglio ricadere
  // sul primo disponibile alla lettura che salvare un aspetto fantasma
  if (aspetto && PERSONE.includes(aspetto)) fresco.aspetto = aspetto
  /* Le novità partono dall'ultima: chi nasce adesso il prima non l'ha
     mai visto, e «il laboratorio è tutto nuovo» detto a lui è falso
     (`guide/novita-bambini.js`). Sta qui e non in `blank()` apposta:
     `selectPlayer` riempie coi difetti quello che un profilo non ha, e
     un bambino di ieri si ritroverebbe il segno già all'ultima — le
     novità scritte proprio per lui non le vedrebbe mai. */
  fresco.settings.novitaLette = ULTIMA_NOVITA
  if (entra) {
    await selectPlayer(id)
    if (partenza != null && partenza !== '') state.profile.settings = fresco.settings
    else state.profile.settings.novitaLette = ULTIMA_NOVITA
    if (fresco.aspetto) state.profile.aspetto = fresco.aspetto
    persist()
  }
  else save(KEY(id), fresco)      // il suo profilo esiste da subito
  /* Subito su disco, senza aspettare il salvataggio a scatto ritardato:
     questo è il primo dato che esiste, e chi chiude l'app appena scritto
     il nome si ritroverebbe daccapo davanti a «come ti chiami?» — che
     dopo aver già risposto una volta sembra che il gioco sia rotto. */
  await flush()
  return id
}

/* Cambiare il nome è cambiare un'etichetta: l'id resta, la chiave del
   salvataggio resta, i progressi non si spostano di un byte. È tutto il
   motivo per cui id e nome sono due cose separate. */
export function rinominaGiocatore(id, nome) {
  const pulito = String(nome || '').trim().slice(0, 20)
  if (!pulito) throw new Error('Serve un nome')
  const g = giocatore(id)
  if (!g) throw new Error('Questo giocatore non c\'è')
  g.nome = pulito
  salvaRoster()
  return flush()
}

/* Eliminare invece butta via davvero: la voce dal roster e il
   salvataggio dall'archivio. Non è una cosa da fare per sbaglio, e
   infatti la schermata la fa confermare — qui si esegue e basta.

   Se si cancella chi sta giocando bisogna spostarsi su qualcun altro,
   altrimenti resterebbe aperto un profilo che non esiste più e il primo
   salvataggio lo farebbe rinascere. Se non resta nessuno si torna al
   primo avvio, che è la verità: non c'è più nessun giocatore. */
export async function eliminaGiocatore(id) {
  const i = state.giocatori.findIndex(g => g.id === id)
  if (i < 0) throw new Error('Questo giocatore non c\'è')
  /* Il bambino che si elimina non è detto sia quello che sta giocando:
     se è un altro, il profilo fresco è quello sull'archivio e
     `cestina` se lo rilegge da solo. */
  await cestina(id, state.giocatori[i].nome,
                state.player === id ? state.profile : null, 'eliminato')
  state.giocatori.splice(i, 1)
  salvaRoster()
  await remove(KEY(id))
  /* il registro di quanto ha giocato sta **fuori** dal profilo
     (`store/sessioni.js`, per non finire in ogni `persist()`), quindi
     non se ne va da solo: senza questa riga resterebbe in archivio un
     elenco di partite di un bambino che non c'è più, che nessuno può
     più né vedere né cancellare. Nel cestino non ci va: si ripristinano
     i progressi, non le ore passate davanti allo schermo. */
  await scordaSessioni(id)
  if (state.player === id) {
    const prossimo = (state.giocatori[0] || {}).id
    if (prossimo) await selectPlayer(prossimo)
    else {
      state.player = ''
      state.profile = blank()
      state.festa = []
      await remove('ultimo-giocatore')
    }
  }
  await flush()
}

/* ---------- caricamento / salvataggio ---------- */
export async function init() {
  state.storage = await detectBackend()
  // scritture di ripiego lasciate da una sessione in cui IndexedDB non
  // rispondeva in tempo: adesso che ha risposto, si spostano lì (vedi
  // docs/core/archivio.md). Prima di leggere il roster, non dopo: se no
  // una chiave appena travasata la leggerebbe comunque bene (`load()`
  // concilia da solo), ma è più chiaro farlo qui una volta sola.
  await travasaRipiego()
  chiediPersistenza()   // non si aspetta: non deve rallentare l'avvio
  state.giocatori = await caricaRoster()
  salvaRoster()                    // da qui in poi l'elenco è esplicito
  const last = await load('ultimo-giocatore')
  const chi = state.giocatori.some(g => g.id === last) ? last : (state.giocatori[0] || {}).id
  /* Nessun giocatore: non se ne inventa uno. Lo stato resta vuoto e
     l'interfaccia chiede «come ti chiami?» — inventarne uno vorrebbe dire
     scrivere un nome nel codice, che è esattamente ciò che si sta
     togliendo. */
  if (chi) await selectPlayer(chi)
  segnala(riscuotiCheat())
  // scrivere l'indirizzo a pagina già aperta cambia solo il frammento e non
  // ricarica niente: senza questo il cheat sembrerebbe non funzionare
  if (typeof window !== 'undefined')
    window.addEventListener('hashchange', () => segnala(riscuotiCheat()))
  state.loaded = true
}

function segnala(n) {
  if (n) state.regalo = { n, k: state.regalo.k + 1 }
}

// `#monete=500` (o negativo): vedi docs/core/comandi.md. Sta nel frammento
// e non nella query perché si può cancellare anche da un file aperto a
// doppio click, così il regalo si riscuote una volta sola.
export function riscuotiCheat() {
  if (typeof location === 'undefined') return 0
  // il numero deve finire lì: senza il controllo in coda `#monete=1e9`
  // regalerebbe 1 moneta, prendendo la prima cifra e ignorando il resto
  const m = /(?:^#?|&)monete=(-?\d{1,7})(?=&|$)/i.exec(location.hash || '')
  if (!m) return 0
  const n = parseInt(m[1], 10)
  // toglie solo il suo pezzo: il resto può essere un altro cheat in attesa
  const resto = (location.hash || '').replace(/^#/, '').split('&')
    .filter(p => !/^monete=/i.test(p)).join('&')
  try { location.hash = resto } catch (e) { /* pazienza: al massimo si ripete */ }
  if (!n) return 0
  addCoins(n)
  // chi usa il cheat spesso chiude subito la scheda: senza questo il
  // salvataggio ritardato di un terzo di secondo può non arrivare mai
  flush()
  return n
}

// Il posto delle migrazioni una-tantum: `da` è la versione di provenienza
// (0 = non esisteva). Un caso nuovo qui vuole il suo test in
// test/unita/profilo.test.mjs, perché alla prossima build `da` è già oggi.
export function migraProfilo(p, da) {
  if (da === 0) return p        // profilo nuovo: non c'è niente da cui migrare
  if (da < 7) saperiArrivatiTardi(p.settings)
  return p
}

// Fotografia congelata (non un elenco da allineare a data/partenze.js): tocca
// una chiave solo nella fascia in cui il difetto è nuovo, e solo se il
// profilo non dice già niente. Vedi docs/apprendimento/saperi-per-fascia.md.
const SAPERI_ARRIVATI = {
  piccoli: ['adattamento'],
  prima: ['adattamento'],
  terza: ['geo:rotazione', 'geo:cubetti', 'geo:sviluppo', 'geo:viste'],
  quarta: [],
}

function saperiArrivatiTardi(s) {
  if (!s || typeof s !== 'object') return
  if (!s.sa || typeof s.sa !== 'object') s.sa = {}
  const anni = Number(s.eta)
  // non si può chiamare `etaDelBambino()`: `state.profile` è ancora quello di prima
  const fascia = partenzaPerEta(
    Number.isFinite(anni) && anni >= 3 && anni <= 14 ? anni : ETA_DIFETTO)
  for (const k of (fascia && SAPERI_ARRIVATI[fascia.chiave]) || [])
    if (s.sa[k] === undefined) s.sa[k] = false
}

// La cameretta è stata tolta coi suoi salvataggi (si cancellano, nessun
// travaso): quello che resta è il livello, contato in `totals` prima di
// buttare le collezioni. Gira a ogni caricamento (non solo dietro `v`, per
// le copie che arrivano da prima: cestino, import, build vecchia su un
// telefono) ed è idempotente (`Math.max`). Vedi docs/core/progressi.md.
const CAMPI_DELLA_CAMERETTA = ['owned', 'layout', 'pets', 'casa', 'dispensa', 'accessori', 'serie']
const CONTATORI_DELLA_CAMERETTA = ['preferiti', 'cure', 'capsule']
const MEDAGLIE_DELLA_CAMERETTA = [
  'pets-adozioni', 'pets-specie', 'pets-pasti', 'pets-preferiti', 'pets-sazi', 'pets-cure',
  'pets-contenti', 'pets-capsule', 'pets-guardaroba', 'pets-serie', 'room-oggetti',
]

export function sgomberaLaCameretta(p) {
  if (!p.totals || typeof p.totals !== 'object') p.totals = {}
  const t = p.totals
  const animali = p.pets && typeof p.pets === 'object'
    ? Object.values(p.pets).filter(a => a && typeof a === 'object').length : 0
  const oggetti = Array.isArray(p.owned) ? p.owned.length : 0
  if (animali) t.camerettaAnimali = Math.max(t.camerettaAnimali || 0, animali)
  if (oggetti) t.camerettaOggetti = Math.max(t.camerettaOggetti || 0, oggetti)
  for (const k of CAMPI_DELLA_CAMERETTA) delete p[k]
  for (const k of CONTATORI_DELLA_CAMERETTA) delete t[k]
  if (p.badge && typeof p.badge === 'object')
    for (const id of MEDAGLIE_DELLA_CAMERETTA) delete p.badge[id]
  return p
}

export async function selectPlayer(id) {
  state.player = id
  const raw = await load(KEY(id))
  const vuoto = blank()
  const p = { ...vuoto, ...(raw && typeof raw === 'object' ? raw : {}) }
  // va letto PRIMA di `p.v = vuoto.v` sotto, che lo timbra: dopo, l'informazione è persa
  const daVersione = Number.isFinite(raw && raw.v) ? raw.v : 0
  /* Una copia prima di riscrivere: se sta per migrare da una versione
     vecchia, si mette da parte cosa c'era PRIMA che la migrazione lo
     tocchi (docs/core/archivio.md). `da === 0` non conta: vuol dire che
     non c'era nessun profilo da cui migrare (`migraProfilo` lo lascia
     stare), non che questo profilo sia vecchio. */
  if (raw && typeof raw === 'object' && daVersione !== vuoto.v)
    await cestina(id, nomeDi(id) || id, raw, 'migrazione')
  p.v = vuoto.v
  migraProfilo(p, daVersione)
  p.settings = { ...vuoto.settings, ...(p.settings || {}) }
  migraSaperi(p.settings)
  p.totals = { ...vuoto.totals, ...(p.totals || {}) }
  // `nelPar` -> `daSolo`: travaso esatto, non generoso (`dentroPar` implicava già `daSolo`)
  if (p.totals.nelPar) {
    p.totals.daSolo = Math.max(p.totals.daSolo || 0, p.totals.nelPar)
    delete p.totals.nelPar
  }
  p.best = { ...vuoto.best, ...(p.best || {}) }
  p.td = migraCastello(vuoto.td, raw && raw.td)
  p.mate = { ...vuoto.mate, ...(p.mate || {}) }
  p.calc = { ...vuoto.calc, ...(p.calc || {}) }
  p.eng = { ...vuoto.eng, ...(p.eng || {}) }
  p.esp = { ...vuoto.esp, ...(p.esp || {}) }
  p.mercato = migraMercato(vuoto.mercato, raw && raw.mercato)
  delete p.lab   // pozioni rifatta, vive in campagne.pozioni; nessuno legge più `lab`
  if (p.settings) delete p.settings.misureNuove
  p.gen = migraGenerale(vuoto.gen, raw && raw.gen)
  p.giorni = { ...vuoto.giorni, ...(p.giorni || {}) }
  delete p.storie   // le avventure a capitoli del Generale non si sono mai aperte
  if (!p.items || typeof p.items !== 'object') p.items = {}
  if (!p.badge || typeof p.badge !== 'object') p.badge = {}
  sgomberaLaCameretta(p)
  state.profile = p
  state.festa = []
  /* Il muto è del bambino, non del telefono. `settings.sound` esisteva
     dal principio ma non lo leggeva nessuno: l'audio era una variabile
     globale accesa a ogni avvio, quindi chi lo spegneva se lo ritrovava
     acceso il giorno dopo, e spegnerlo per uno lo spegneva per tutti. */
  suonoAcceso.value = p.settings.sound !== false
  // chi giocava prima che le campagne esistessero non deve ricominciare da capo
  allineaMate(p)
  allineaCalcolo(p)
  /* e chi giocava prima della fila unica ha due contatori: qui si
     travasano nell'unico, insieme a quello che le due righe qui sopra
     hanno appena aperto. Va DOPO di loro, se no la fila resterebbe
     indietro di quello che il bambino sa già. */
  sincronizzaAsteroidi(p)
  allineaInglese(p)
  allineaSpagnolo(p)
  apriGiornata()
  save('ultimo-giocatore', id)
  persist()
}

function apriGiornata(now = Date.now()) {
  const p = state.profile
  segnaGiorno(p, now)
  p.giorni.serie = serieViva(p, now) || p.giorni.serie
  p.best.serieGiorni = Math.max(p.best.serieGiorni || 0, p.giorni.serie || 0)
  controllaTraguardi(now)
}

// I saperi (docs/apprendimento/saperi.md): il difetto lo dichiara il
// catalogo (`difetto: false`), il profilo salva solo l'eccezione.
const SPENTI_DI_PARTENZA = new Set(SAPERI.filter(s => s.difetto === false).map(s => s.chiave))
const difettoDi = chiave => !SPENTI_DI_PARTENZA.has(chiave)

export const sapereAcceso = chiave => {
  const scelto = (state.profile.settings.sa || {})[chiave]
  return scelto === undefined ? difettoDi(chiave) : scelto !== false
}
export function accendiSapere(chiave, si) {
  const s = state.profile.settings
  if (!s.sa) s.sa = {}
  if (si === difettoDi(chiave)) delete s.sa[chiave]   // il difetto non si scrive
  else s.sa[chiave] = si
  persist()
}
// Quelli spenti, nella forma che vuole chi fa le domande («cosa evitare»):
// eccezioni salvate + quelli spenti di partenza, mai il catalogo filtrato.
export const saperiSpenti = () =>
  [...new Set([...Object.keys(state.profile.settings.sa || {}), ...SPENTI_DI_PARTENZA])]
    .filter(c => !sapereAcceso(c))

// Gemello di `fissaGioco`: tre posizioni, non due (docs/genitori/ritocchi.md).
// «Come dice l'età» scrive l'eccezione attesa e non cancella, così
// `rimettiAiDifetti` e questa funzione portano allo stesso profilo.
export function fissaSapere(chiave, come) {
  const s = state.profile.settings
  if (!s.sa) s.sa = {}
  if (come !== 'difetto') { accendiSapere(chiave, come === 'si'); return }
  const atteso = eccezioniPerEta(etaDelBambino()).sa || {}
  if (atteso[chiave] === false) s.sa[chiave] = false
  else delete s.sa[chiave]
  persist()
}

// Nomi storici del castello, invariati per non offuscarli dentro la cassa
export const divisioniAccese = () => sapereAcceso('divisioni')
export const accendiDivisioni = si => accendiSapere('divisioni', si)

// Una volta sola (cassa, banco, cartello di fine tappa), non tre copie
export const contiPermessi = () => ({
  div: sapereAcceso('divisioni'),
  mul: sapereAcceso('moltiplicazioni'),
})

// migrazione: `settings.divisioni` -> `sa.divisioni`; `verbo:*` -> `coniug:*`
// (coniugazione: `verbo:` era già il prefisso dei verbi inglesi in `items`)
const CONIUGAZIONE_VECCHIE = new Set([
  'presente-regolare', 'presente-isc', 'presente-irregolare', 'ausiliare',
  'participio', 'participio-irregolare', 'imperfetto', 'futuro',
  'tempo-giusto', 'riconosci-tempo', 'remoto', 'condizionale', 'congiuntivo',
])

function migraSaperi(s) {
  if (!s.sa || typeof s.sa !== 'object') s.sa = {}
  if (s.divisioni === false && s.sa.divisioni === undefined) s.sa.divisioni = false
  delete s.divisioni
  for (const k of Object.keys(s.sa)) {
    if (!k.startsWith('verbo:')) continue
    const coda = k.slice('verbo:'.length)
    if (!CONIUGAZIONE_VECCHIE.has(coda)) continue
    if (s.sa[`coniug:${coda}`] === undefined) s.sa[`coniug:${coda}`] = s.sa[k]
    delete s.sa[k]
  }
}

export const sperimentaliAccesi = () => state.profile.settings.sperimentali === true
export function accendiSperimentali(si) {
  state.profile.settings.sperimentali = !!si
  persist()
}

export const giocoAcceso = chiave =>
  (!eSperimentale(chiave) || sperimentaliAccesi()) &&
  giocoGiocabile(chiave) &&
  (state.profile.settings.giochi || {})[chiave] !== false

export const giocoGiocabile = chiave => serveA(chiave).every(sapereAcceso)
export const saperiCheMancano = chiave => serveA(chiave).filter(c => !sapereAcceso(c))
export function accendiGioco(chiave, si) {
  const s = state.profile.settings
  if (!s.giochi) s.giochi = {}
  if (si) delete s.giochi[chiave]      // acceso è l'assenza: niente voci inutili nel salvataggio
  else s.giochi[chiave] = false
  persist()
}

/* ── «TIENILO COMUNQUE» ──
   `true` scritto per esteso è una cosa che prima non si poteva dire.
   Acceso è l'assenza — quindi `accendiGioco(k, true)` cancella la voce
   e lascia decidere all'età — ma l'età a volte sbaglia: il Dungeon
   dichiarato dai sette anni e un bambino di sei che ci gioca col
   fratello, oppure il contrario, un gioco «già passato» che in casa si
   apre ancora. Da qui si può fissare l'una o l'altra cosa, e
   `'difetto'` rimette la riga a decidere all'età.

   La forzatura scavalca **la portata, non i saperi spenti**: un gioco
   fatto tutto di conversioni con le conversioni spente resterebbe una
   carta che apre domande da indovinare, e `giocoGiocabile` continua a
   valere per tutti. */
export const giocoForzato = chiave =>
  (state.profile.settings.giochi || {})[chiave] === true
export function fissaGioco(chiave, come) {
  const s = state.profile.settings
  if (!s.giochi) s.giochi = {}
  if (come !== 'difetto') { s.giochi[chiave] = come === 'si'; persist(); return }
  // scrive l'eccezione attesa (non cancella), come `fissaSapere`: vedi docs/genitori/ritocchi.md
  const atteso = eccezioniPerEta(etaDelBambino()).giochi || {}
  if (atteso[chiave] === false) s.giochi[chiave] = false
  else delete s.giochi[chiave]
  persist()
}
export const quantiGiochiAccesi = () => CHIAVI_GIOCHI.filter(giocoAcceso).length

// L'unica manopola dell'età: vedi docs/genitori/manopola.md e spostandoLEta in data/partenze.js
export function spostaLEta (anni) {
  const s = state.profile.settings
  const mossa = spostandoLEta({ da: etaDelBambino(), a: anni,
                                giochi: s.giochi || {}, sa: s.sa || {},
                                ritocchi: s.ritocchi || {} })
  if (!Number.isFinite(mossa.eta) || mossa.eta < 3 || mossa.eta > 14) return null
  s.eta = mossa.eta
  if (mossa.riscrive) {
    s.giochi = mossa.giochi
    s.sa = mossa.sa
    delete s.ritocchi   // correzioni sopra l'età: la schermata l'ha già fatto confermare
  }
  persist()
  return mossa
}

// Compagno di `spostaLEta`: non tocca l'età, riparte dai difetti della sua
// fascia. `null` quando non c'era niente da rimettere.
export function rimettiAiDifetti () {
  const s = state.profile.settings
  const mossa = rimettendoLEta({ eta: etaDelBambino(), giochi: s.giochi || {},
                                 sa: s.sa || {}, ritocchi: s.ritocchi || {} })
  if (!mossa.cambia) return null
  s.giochi = mossa.giochi
  s.sa = mossa.sa
  delete s.ritocchi
  persist()
  return mossa
}

/* ── quanti anni ha ──
   Il numero da cui dipende **quali domande arrivano**: ogni classe di
   domande dichiara a che età serve (`quiz/nucleo/classi.js`), e chi
   pesca confronta le due cose. Non è un dato anagrafico e non si mostra
   a nessun bambino: è la sola cosa che distingue «troppo difficile» da
   «troppo facile», e per questo sta nei settaggi e non nel roster.

   Lo scrive la partenza scelta alla creazione (`data/partenze.js`).
   Chi non l'ha — i profili nati prima che questa domanda esistesse —
   viene trattato come un bambino di quarta, che è dove stava di fatto
   la scaletta prima: nessuno si vede arrivare domande più facili di
   quelle di ieri senza che un grande l'abbia deciso. */
export const ETA_DIFETTO = 9
export const etaDelBambino = () => {
  const e = Number(state.profile.settings.eta)
  return Number.isFinite(e) && e >= 3 && e <= 14 ? e : ETA_DIFETTO
}
/* ── PERCHÉ NON C'È PIÙ UNA `scegliEta` ──
   C'era, e scriveva `settings.eta` e nient'altro. La usava la scheda
   delle domande, e siccome l'età da sola non riadatta niente, da lì si
   poteva portare un bambino da quattro a dieci anni lasciandogli in
   casa i giochi di quattro — senza che nulla, da nessuna parte,
   dicesse che stava succedendo. L'unica strada è `spostaLEta`, che
   decide anche cosa fare dei giochi e dei saperi e lo dice a chi
   guarda; una scorciatoia che scrive solo il numero è la stessa
   seconda manopola di prima, spostata in un altro file. */

// Il ritocco: una tacca di mezzo anno sopra o sotto la taratura, al massimo
// tre per parte (docs/genitori/ritocchi.md). Chi non ritocca non ha voce.
export const ritoccoSapere = chiave => (state.profile.settings.ritocchi || {})[chiave] || 0
export const quantiRitocchi = () => Object.keys(state.profile.settings.ritocchi || {}).length
export function azzeraRitocchi() {
  const quanti = quantiRitocchi()
  delete state.profile.settings.ritocchi
  persist()
  return quanti
}
export function ritocca(chiave, gradini) {
  const s = state.profile.settings
  if (!s.ritocchi) s.ritocchi = {}
  const n = Math.max(-3, Math.min(3, Math.round(gradini || 0)))
  if (!n) delete s.ritocchi[chiave]        // zero non si scrive: è il difetto
  else s.ritocchi[chiave] = n
  persist()
  return n
}

// Butta il conto (non l'elemento): `s` e `last` restano, un ripasso
// azzerato rifarebbe uscire domani una cosa saputa ieri.
export function azzeraConto(chiave) {
  const it = state.profile.items?.[chiave]
  if (!it) return false
  it.ok = 0; it.err = 0; it.seen = 0; it.t = 0
  persist()
  return true
}

export const regoleDomande = () => ({
  eta: etaDelBambino(),
  finestra: finestraDi(etaDelBambino()),
  ritocchi: { ...(state.profile.settings.ritocchi || {}) },
})

// Non c'è un quarto interruttore per metà di un gioco: vedi
// docs/genitori/interruttori.md. `guidaGiaVista`/`segnaGuidaVista`: le
// spiegazioni dentro la partita che compaiono una volta sola, per bambino.
export const guidaGiaVista = chiave =>
  (state.profile.settings.guideViste || {})[chiave] === true
export function segnaGuidaVista(chiave) {
  const s = state.profile.settings
  if (!s.guideViste) s.guideViste = {}
  if (s.guideViste[chiave]) return
  s.guideViste[chiave] = true
  persist()
}

// Vedi docs/genitori/novita-bambini.md. `flush()` subito: chi preme «Letto»
// e chiude l'app un attimo dopo non deve ritrovarsele davanti.
export const novitaLette = () => {
  const n = state.profile.settings.novitaLette
  return typeof n === 'number' ? n : 0
}
export function segnaNovitaLette() {
  state.profile.settings.novitaLette = ULTIMA_NOVITA
  persist()
  return flush()
}

export const tuttoAperto = () => state.profile.settings.tuttoAperto === true
export function accendiTuttoAperto(si) {
  state.profile.settings.tuttoAperto = !!si
  persist()
}

// Una regola sola invece che copiata in cinque giochi; pura tranne il flag.
export const tappaAperta = (i, fatto) => tuttoAperto() || i <= fatto

// Senza giocatore non si scrive: in onboarding salverebbe una chiave senza id
export function persist() {
  if (!state.player) return
  save(KEY(state.player), JSON.parse(JSON.stringify(state.profile)))
}
export const flushNow = flush

export async function resetPlayer() {
  // copia prima del rogo (store/cestino.js): `state.profile`, non il disco,
  // perché `persist()` scrive con un ritardo
  await cestina(state.player, nomeCorrente(), state.profile, 'cancellati')
  state.profile = blank()
  state.profile.settings.novitaLette = ULTIMA_NOVITA   // le ha già viste, non è un bambino nuovo
  state.festa = []
  await remove(KEY(state.player))
  apriGiornata()
  persist()
}

// Per chi azzera una parte sola dei progressi, non passa da `resetPlayer`
export async function cestinaOra(motivo = '') {
  await cestina(state.player, nomeCorrente(), state.profile, motivo)
}

// Ricostruisce anche il roster: la voce può essere di un bambino eliminato
export async function ripristinaCestinato(quando) {
  const voce = await voceCestinata(quando)
  if (!voce) throw new Error('Questa copia non c\'è più')
  save(KEY(voce.id), voce.profilo)
  if (!state.giocatori.some(g => g.id === voce.id)) {
    state.giocatori.push({ id: voce.id, nome: voce.nome })
    salvaRoster()
  }
  await flush()
  await selectPlayer(voce.id)
  return voce.nome
}

// Esportare/importare tutto: la rete di sicurezza dietro il PIN dei genitori.
// La firma non si confronta col nome: il controllo guarda solo la forma,
// così un file esportato da una versione vecchia si importa lo stesso.
const FIRMA = 'giochi-bambini'

export async function esportaTutto() {
  // il profilo aperto può essere più fresco di quello già scritto su disco
  persist()
  await flush()
  // esporta dall'archivio, non dal roster: recupera anche un profilo orfano
  const profili = {}
  for (const k of await chiavi(PREFISSO)) {
    const p = await load(k)
    if (p) profili[k.slice(PREFISSO.length)] = p
  }
  const giocatori = state.giocatori.map(g => ({ id: g.id, nome: g.nome }))
  return { tipo: FIRMA, v: 2, esportato: new Date().toISOString(), giocatori, profili }
}

/* «Rimetti da un file» passa dal cestino (docs/core/archivio.md): prima
   di scrivere si vede CHI verrebbe sostituito, per chiederlo al grande —
   un file di un'altra famiglia con gli stessi id (`g1`, `g2`) non deve
   schiacciare i bambini di casa senza che nessuno se ne accorga. Pura e
   sincrona apposta: una schermata la chiama per mostrare la conferma
   prima ancora di decidere se importare davvero. */
export function anteprimaImportazione(dati) {
  if (!dati || !dati.profili || typeof dati.profili !== 'object' || Array.isArray(dati.profili))
    throw new Error('Questo non è un salvataggio dei giochi')
  const idFile = Object.keys(dati.profili)
    .filter(id => id && dati.profili[id] && typeof dati.profili[id] === 'object')
  if (!idFile.length) throw new Error('Nel file non c\'è nessun profilo da ripristinare')

  const nomiFile = new Map()
  if (Array.isArray(dati.giocatori))
    for (const v of dati.giocatori.map(normalizzaVoce)) if (v) nomiFile.set(v.id, v.nome)

  const sostituiti = idFile.filter(id => giocatore(id)).map(id => ({
    id, nomeAttuale: nomeDi(id), nomeFile: nomiFile.get(id) || nomeDi(id) || id,
  }))
  return {
    quanti: idFile.length,
    sostituiti,
    esportato: typeof dati.esportato === 'string' ? dati.esportato : null,
  }
}

export async function importaTutto(dati) {
  const anteprima = anteprimaImportazione(dati)   // valida la forma, e lancia se è rotto

  // Prima di scrivere sopra un profilo che c'è già, se ne mette via una
  // copia — come fanno azzerare ed eliminare: un ripristino sbagliato si
  // annulla rimettendo quella, non tornando a un file più vecchio.
  for (const { id } of anteprima.sostituiti)
    await cestina(id, nomeDi(id) || id, state.player === id ? state.profile : null, 'importazione')

  const ripristinati = []
  for (const [id, p] of Object.entries(dati.profili)) {
    if (!id || !p || typeof p !== 'object') continue
    save(KEY(id), p)
    ripristinati.push(id)
  }

  const nomi = new Map()
  if (Array.isArray(dati.giocatori))
    for (const v of dati.giocatori.map(normalizzaVoce)) if (v) nomi.set(v.id, v.nome)
  const prima = new Map(state.giocatori.map(g => [g.id, g]))
  for (const id of ripristinati) prima.set(id, { id, nome: nomi.get(id) || prima.get(id)?.nome || id })
  state.giocatori = [...prima.values()]
  salvaRoster()

  await flush()
  // ricarica quello aperto adesso, altrimenti a schermo resta il vecchio
  await selectPlayer(state.giocatori.some(g => g.id === state.player)
    ? state.player : state.giocatori[0].id)
  return ripristinati.map(id => nomi.get(id) || id)
}

export function item(id) {
  const it = state.profile.items[id]
  if (it) return it
  const fresh = newItem()
  state.profile.items[id] = fresh
  return fresh
}

export function answer(id, { correct, ms = 0 }) {
  srsRecord(item(id), { correct, ms })
  controllaTraguardi()
  persist()
}

export const mastered = (id, now = Date.now()) => isMastered(item(id), now)
export const strengthOf = (id, now = Date.now()) => strength(item(id), now)

export function countMastered(prefix, now = Date.now()) {
  return Object.entries(state.profile.items)
    .filter(([k, v]) => k.startsWith(prefix) && isMastered(v, now)).length
}

// Livello unico e moltiplicatore delle monete: vedi docs/core/progressi.md
export const level = computed(() => livelloTotale(state.profile).n)

export function addCoins(n) {
  // mai sotto zero: un salvadanaio in rosso non vuol dire niente per un bambino
  state.profile.coins = Math.max(0, (state.profile.coins || 0) + n)
  // il salvadanaio conta quanto è ENTRATO, non quanto è rimasto: comprare
  // qualcosa non deve cancellare la fatica che è servita a guadagnarlo
  if (n > 0) state.profile.totals.monete = (state.profile.totals.monete || 0) + n
  persist()
  return state.profile.coins
}

// O paga tutto o non paga niente (utile a chi vende domanda+spesa in un
// colpo, come un gradino degli aiuti); scrive subito su disco.
export function spendi(n) {
  if (!(n > 0)) return true
  if ((state.profile.coins || 0) < n) return false
  addCoins(-n)
  flush()
  return true
}

// I giochi non toccano `totals`/`best` a mano: `segna`/`segnaBest` fanno
// scattare anche i traguardi.
export function segna(chiave, n = 1) {
  const t = state.profile.totals
  t[chiave] = (t[chiave] || 0) + n
  controllaTraguardi()
  persist()
  return t[chiave]
}

// Torna true se è un record nuovo, così il gioco può festeggiare senza
// doversi ricordare il valore di prima.
export function segnaBest(chiave, valore) {
  const b = state.profile.best
  if (!(valore > (b[chiave] || 0))) return false
  b[chiave] = valore
  controllaTraguardi()
  persist()
  return true
}

// Rientrante (il premio in monete richiama persist), si protegge da sola.
// Prima volta: registra in silenzio i traguardi già meritati (vedi docs/core/progressi.md).
let dentro = false
export function controllaTraguardi(now = Date.now()) {
  if (dentro) return []
  dentro = true
  try {
    const p = state.profile
    const primaVolta = !p.badgeInit
    const { nuovi, monete } = riscuotiTraguardi(p, now)
    if (primaVolta) { p.badgeInit = 1; persist(); return [] }
    if (!nuovi.length) return []
    if (monete) addCoins(monete)
    state.festa = [...state.festa, ...nuovi]
    flush()          // un traguardo si prende di rado: non deve perdersi
    return nuovi
  } finally { dentro = false }
}

export function festaVista() { state.festa = [] }

export const traguardi = (now = Date.now()) => statoTraguardi(state.profile, now)
export const livelloOra = (now = Date.now()) => livelloTotale(state.profile, now)
export const areaOra = (area, now = Date.now()) => progressoArea(state.profile, area, now)
export const serieGiorni = (now = Date.now()) => serieViva(state.profile, now)

// difficoltaOra traduce abilitaOra in un livello 1..5 per un generatore di domande
export const abilitaOra = (materia, now = Date.now()) => abilita(state.profile, materia, now)
export const difficoltaOra = (materia, now = Date.now()) => difficolta(state.profile, materia, now)

export const tdProgresso = () => state.profile.td

// Rimappa le sei tappe di ieri sulle quindici di oggi, senza far tornare
// indietro nessuno: vedi docs/castello/campagne.md ("I salvataggi").
export const TD_VERSIONE = 2
const TD_DA_SEI = [0, 2, 3, 5, 7, 8, 10]

export function migraCastello(vuoto, salvato) {
  const dati = salvato && typeof salvato === 'object' ? salvato : {}
  const td = { ...vuoto, ...dati }
  // il `v` che conta è quello del salvataggio, non quello del profilo
  // vuoto: fondendo per primo, il vuoto coprirebbe l'assenza
  if (dati.v === TD_VERSIONE) return td
  const vecchia = Math.max(0, Math.min(TD_DA_SEI.length - 1, Math.round(td.tappa || 0)))
  td.tappa = Math.max(td.tappa || 0, TD_DA_SEI[vecchia])
  td.libera = !!td.libera
  td.v = TD_VERSIONE
  return td
}

export function tdCompleta(indice, quanteTappe) {
  const td = state.profile.td
  td.tappa = Math.max(td.tappa || 0, indice + 1)
  if (td.tappa >= quanteTappe) td.libera = true
  controllaTraguardi()
  persist()
  flush()          // una tappa si vince di rado: non deve perdersi per una scheda chiusa
  return td
}

// mate.fila è il contatore unico; mate.tappa/calc.tappa restano solo come
// specchio. Vedi docs/asteroidi/scaletta.md ("Un contatore, un segno").
export const mateProgresso = () => state.profile.mate
export const calcProgresso = () => state.profile.calc
export const tabellineIntere = (now = Date.now()) => tabellineIntereDi(state.profile, now)

// L'unico posto che scrive i due specchi e fa la migrazione dai due vecchi
// contatori (posizione più avanzata compatibile, mai in giù).
export function sincronizzaAsteroidi(p) {
  const mate = p.mate || (p.mate = { tappa: 0, fila: 0, libera: false })
  const calc = p.calc || (p.calc = { tappa: 0, libera: false })
  const daiDue = filaDaCampagne(mate.tappa || 0, calc.tappa || 0)
  const ora = Number.isFinite(mate.fila) ? Math.max(mate.fila, daiDue) : daiDue
  mate.fila = Math.max(0, Math.min(SCALETTA.length, Math.round(ora)))
  const specchio = campagneDaFila(mate.fila)
  mate.tappa = specchio.pianeta
  calc.tappa = specchio.mente
  // il volo infinito è uno solo (docs/asteroidi/volo.md); `libera` non torna mai indietro
  if (mate.fila >= SCALETTA.length) { mate.libera = true; calc.libera = true }
  return mate
}

/* superata una voce della fila, che sia un pianeta o una stazione: il
   contatore si porta subito dopo di lei, e non scavalca niente */
export function asteroidiCompleta(voce) {
  const mate = state.profile.mate
  mate.fila = Math.max(mate.fila || 0, filaDopo(voce))
  sincronizzaAsteroidi(state.profile)
  controllaTraguardi()
  persist()
  flush()          // una tappa si vince di rado: non deve perdersi
  return mate
}

/* ═══════════ campagne delle lingue ═══════════
   English e Spagnolo sono lo stesso gioco su due strade separate, e nel
   profilo stanno in due campi diversi: `eng` e `esp`. Il gioco non li
   nomina, passa il campo che gli ha dato `data/lingue.js`. */
export const linguaProgresso = campo => state.profile[campo]

export function linguaCompleta(campo, indice, quanteTappe) {
  const c = state.profile[campo]
  c.tappa = Math.max(c.tappa || 0, indice + 1)
  if (c.tappa >= quanteTappe) c.libera = true
  controllaTraguardi()
  persist()
  flush()          // una tappa si vince di rado: non deve perdersi
  return c
}

/* ═══════════ campagna della bancarella ═══════════
   Le giornate di mercato: `tappa` è quante giornate sono state finite ed è
   l'indice della prossima da aprire. Finita l'ultima si apre la giornata
   libera, che non chiude mai. */
export const mercatoProgresso = () => state.profile.mercato

// Rimappa le sei giornate di ieri sulle sedici di oggi, nessuno torna
// indietro: vedi docs/bancarella/regole.md ("Il salvataggio segue la fila").
export const MERCATO_VERSIONE = 2
const MERCATO_DA_SEI = [0, 1, 2, 6, 14, 14, 16]

export function migraMercato(vuoto, salvato) {
  const dati = salvato && typeof salvato === 'object' ? salvato : {}
  const m = { ...vuoto, ...dati }
  if (dati.v === MERCATO_VERSIONE) return m
  const vecchia = Math.max(0, Math.min(MERCATO_DA_SEI.length - 1, Math.round(m.tappa || 0)))
  m.tappa = Math.max(m.tappa || 0, MERCATO_DA_SEI[vecchia])
  m.libera = !!m.libera
  m.v = MERCATO_VERSIONE
  return m
}

export function mercatoCompleta(indice, quanteGiornate) {
  const m = state.profile.mercato
  m.tappa = Math.max(m.tappa || 0, indice + 1)
  if (m.tappa >= quanteGiornate) m.libera = true
  state.profile.totals.mercati = (state.profile.totals.mercati || 0) + 1
  controllaTraguardi()
  persist()
  flush()          // una giornata si finisce di rado: non deve perdersi
  return m
}

// Il Generale: le stelle stavano sotto la POSIZIONE del livello nella fila
// (26 -> 6 livelli); adesso la chiave è l'`id`, e questa tabella traduce le
// vecchie posizioni. I livelli tolti perdono il voto; `totals` non si tocca.
const GEN_DA_POSIZIONE = { 0: 'primo', 1: 'chiave', 2: 'parole-due-chiavi',
                           6: 'due-strade', 14: 'attesa', 19: 'richiamo' }
export function migraGenerale(vuoto, salvato) {
  const dati = salvato && typeof salvato === 'object' ? salvato : {}
  const dizionario = x => (x && typeof x === 'object' && !Array.isArray(x) ? { ...x } : {})
  const g = { ...vuoto, ...dati, ordini: dizionario(dati.ordini), stelle: dizionario(dati.stelle),
              aiuti: dizionario(dati.aiuti) }
  // il `v` che conta è quello del salvataggio: fondendo per primo il
  // vuoto, la sua versione coprirebbe l'assenza
  if (dati.v === vuoto.v) return g
  const perId = voti => {
    const out = {}
    for (const k in voti) {
      const id = GEN_DA_POSIZIONE[k]
      if (id && voti[k]) out[id] = voti[k]
    }
    return out
  }
  g.stelle = perId(g.stelle)
  g.ordini = perId(g.ordini)
  g.tappa = Object.keys(g.stelle).length
  g.v = vuoto.v
  return g
}

/* ═══════════ campagna del generale ═══════════
   Stessa forma delle altre campagne, con due cose in più che il gioco non
   deve tenersi in tasca: il record di ordini per livello e le stelle
   guadagnate su quel livello.

   Un livello si vince superandone tutte e tre le varianti, quindi qui ci
   si arriva una volta sola per partita: chi chiama questa funzione ha
   già finito. `ordini` è quanti ne ha firmati, `avanzato` dice se fra
   quegli ordini ce n'era almeno uno di alto livello (ciclo, condizione,
   evento) — è il salto che il gioco insegna, e va contato a parte da
   «ce l'ho fatta». `svelato` e `caduti` sono quello che decide la
   seconda stella, e la regola sta in `daSolo()`.

   I contatori li muove questa funzione, con `segna()`: così il gioco non
   deve ricordarsi cinque nomi e non c'è modo di contare due volte.

   ── E SI SEGNA SOTTO L'ID DEL LIVELLO ──
   Non sotto la sua posizione nella fila: la fila si accorcia e si
   riordina (è passata da ventisei livelli a sei in un colpo), e un voto
   scritto per posizione finirebbe addosso al livello sbagliato. `tappa`
   allora non è più una punta nella fila ma quello che il suo nome ha
   sempre promesso: quanti livelli sono stati superati.

   ── `finita` LA DECIDE CHI CHIAMA, E NON È UN CONTO DI POSIZIONI ──
   Prima qui arrivava «quanti livelli ci sono» e la campagna era finita
   quando `tappa` li raggiungeva. Non regge più da quando i livelli non
   ancora approvati stanno dietro il cancello dei giochi in prova: la
   fila che si sta giocando ha dei buchi, e `tappa` è una punta nella
   fila piena — con sei livelli visibili su ventisei quel confronto non
   sarebbe mai vero. Chi sa quali si vedono è il gioco
   (`views/generale/fila.js`), e passa la risposta già fatta. */
export const genProgresso = () => state.profile.gen

// Seconda stella: ci sei arrivato da solo (nessuno caduto, nessuna
// soluzione intera svelata). Non è più «il par» (pochi ordini).
export const daSolo = ({ svelato = false, caduti = 0 } = {}) => !svelato && !caduti

// Si tengono perché si pagano: un gradino pagato si rimette gratis. Massimo, non risalita.
export const genAiutiPresi = id => ((state.profile.gen || {}).aiuti || {})[id] || 0
export function genSegnaAiuti(id, n) {
  const g = state.profile.gen
  if (!g.aiuti || typeof g.aiuti !== 'object') g.aiuti = {}
  if (!(n > (g.aiuti[id] || 0))) return g.aiuti[id] || 0
  g.aiuti[id] = n
  persist()
  flush()
  return n
}

export function genCompleta(id, conto = {}) {
  const { ordini = 0, avanzato = false, finita = false } = conto
  const g = state.profile.gen
  const primaVolta = !g.stelle[id]
  if (finita) g.libera = true

  // il record è il MINORE: chiudere con meno ordini vuol dire aver capito
  // meglio, non aver giocato di più
  const rec = g.ordini[id] || 0
  if (ordini > 0 && (!rec || ordini < rec)) g.ordini[id] = ordini

  // due stelle a chi ci è arrivato da solo, una a chi ce la fa e basta.
  // Si tiene la migliore: una partita storta non toglie la stella già
  // guadagnata.
  const solo = daSolo(conto)
  const stelle = solo ? 2 : 1
  const prima = g.stelle[id] || 0
  if (stelle > prima) g.stelle[id] = stelle
  // quanti livelli superati: non apre i lucchetti (quelli guardano le stelle), ma i contatori sì
  g.tappa = Math.max(g.tappa || 0, Object.keys(g.stelle).length)

  if (primaVolta) segna('missioni')
  if (ordini > 0) segna('ordini', ordini)
  // si conta una volta per livello — la prima volta che ci si riesce —
  // perché è una cosa capita, non una cosa ripetuta
  if (solo && prima < 2) segna('daSolo')
  if (stelle > prima) segna('stelle', stelle - prima)
  // questo invece è una vittoria per volta, come le operazioni perfette
  // del castello: scrivere un ciclo resta il gesto che vale, anche la
  // decima volta
  if (avanzato) segna('avanzati')

  controllaTraguardi()
  persist()
  flush()          // un livello si vince di rado: non deve perdersi
  return g
}

/* i due nomi di prima, che la home e i test usano ancora */
export const engProgresso = () => linguaProgresso('eng')
export const espProgresso = () => linguaProgresso('esp')
export const engCompleta = (i, n) => linguaCompleta('eng', i, n)
export const espCompleta = (i, n) => linguaCompleta('esp', i, n)

export { backend }

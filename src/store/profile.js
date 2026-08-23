/* ═══════════════════════════════════════════════════════════════════
   PROFILO CONDIVISO
   Un solo profilo per bambino, alimentato da tutti i giochi: monete,
   oggetti della cameretta e stato di apprendimento di ogni elemento.
   Le chiavi degli elementi sono con prefisso (`math:` / `en:`) così un
   motore solo serve materie diverse senza confonderle.
   ═══════════════════════════════════════════════════════════════════ */
import { reactive, computed } from 'vue'
import { load, save, flush, remove, detectBackend, backend, chiavi } from './storage.js'
import { scordaSessioni } from './sessioni.js'
import { newItem, record as srsRecord, isMastered, strength } from './srs.js'
import { acceso as suonoAcceso } from '../audio.js'
import { PRODOTTI, POSTI_CASA, SOGLIE, PREFERITO, petDi, prodottoDi, gradimento,
         quotaRientro, livelloDi, urgenza, nuovoAnimale, migraAnimale,
         curato } from '../data/pets.js'
import { SERIE, mancanti, estrai, postoDi } from '../data/capsule.js'
import { CHIAVI_GIOCHI, eSperimentale, serveA } from '../data/giochi.js'
import { SAPERI } from '../data/saperi.js'
import { eccezioniDi, eccezioniPerEta, spostandoLEta,
         rimettendoLEta, partenzaPerEta } from '../data/partenze.js'
import { finestraDi } from '../quiz/nucleo/classi.js'
import { PERSONE } from '../giochi/fattoria/dati/atlante.js'
import { allineaCalcolo } from './calcolo.js'
import { cestina, voceCestinata } from './cestino.js'
import { riscuotiTraguardi, segnaGiorno, serieViva, livelloTotale,
         progressoArea, statoTraguardi, abilita, difficolta,
         tabellineIntereDi, allineaMate, allineaInglese,
         allineaSpagnolo, allineaPozioni } from './progressi.js'

/* ── CHI GIOCA ──
   Prima qui c'era un elenco fisso di nomi scritto nel codice. Adesso è un
   dato come gli altri: sta nella chiave `giocatori`, i genitori lo
   cambiano, e nel repo non compare il nome di nessun bambino.

   Un giocatore è `{ id, nome }`, e i due campi servono a cose diverse:
   l'**id** è la chiave del salvataggio (`profilo:<id>`) e non cambia mai
   più una volta creato; il **nome** è l'etichetta che si legge a schermo
   e si può correggere quando si scrive male. Tenerli separati è ciò che
   rende la rinomina gratuita: si tocca un'etichetta, non si sposta un
   byte di progressi.

   Per i profili che esistono già l'id *è* il nome con cui erano stati
   salvati, e la loro chiave resta dov'è: l'aggiornamento non copia e non
   cancella niente, e una build vecchia ripubblicata per sbaglio ritrova
   tutto al suo posto. Per chi nasce da oggi l'id è opaco (`g1`, `g2`):
   il nome resta solo dentro il valore, e cambiarlo non lascia in giro
   una chiave che se lo porta dietro. */
const KEY_ROSTER = 'giocatori'
const KEY = id => 'profilo:' + id
const PREFISSO = 'profilo:'

const blank = () => ({
  v: 7,
  coins: 0,
  owned: [],
  layout: [[], [], []],
  items: {},                       // 'math:7x8' | 'en:butterfly' -> stato
  /* Gli animali ADOTTATI, tutti, anche quelli che adesso non sono in
     cameretta: 'watson' -> { adottato, nome, val{}, t{}, pasti, addosso{} }.
     Il `nome` è quello che gli ha dato il bambino, e il catalogo lo
     propone soltanto. */
  pets: {},
  /* Chi sta in cameretta ADESSO: fino a `POSTI_CASA` id, e l'ordine è quello
     sul tappeto. Gli altri sono al rifugio — non cancellati, non persi:
     si riprendono pagando una quota piccola. È un elenco e non un flag
     dentro `pets` perché i posti hanno un ordine e un tetto, e tutte e
     due le cose si leggono meglio da una fila che da un dizionario. */
  casa: [],
  dispensa: {},                    // '🍗' -> quante porzioni in casa
  accessori: [],                   // emoji uscite dalle capsule
  serie: 0,                        // a che serie di sorprese siamo arrivati
  /* `sa` sono i macrogruppi di scuola che i genitori hanno SPENTO
     (`data/saperi.js`): una voce a `false` per ognuno. Chi a scuola non
     ha ancora fatto le misure non deve vedersi chiedere quanti
     centilitri sono due litri — non è una domanda difficile, è una
     domanda muta: si può solo indovinare. Chi lo legge sono i moduli di
     quiz (`quiz/scelta.js`, che degrada al grado più facile invece di
     sparire) e il castello per le divisioni. Elenco di eccezioni come
     `giochi`: un sapere nuovo nasce acceso per tutti, salvo i pochi che
     il catalogo dichiara `difetto: false` — quelli nascono spenti e la
     voce salvata è il `true` di chi li ha accesi.
     `divisioni: true/false` è la forma vecchia dello stesso flag, prima
     che i macrogruppi esistessero: si legge ancora in `selectPlayer`
     per non riaccendere le divisioni a chi le aveva spente. */
  /* `giochi` sono le carte spente in home: una voce a `false` per ogni
     gioco che i genitori hanno tolto di mezzo. È un elenco di eccezioni e
     non di permessi apposta — un gioco nuovo nasce acceso anche per chi
     ha il profilo di ieri, senza migrazioni. */
  /* `tuttoAperto` toglie i lucchetti alle campagne: tutte le tappe di
     tutti i giochi giocabili subito, senza superare quelle prima. Chi lo
     legge è `tappaAperta()`, qui sotto, e i giochi passano da lì: la
     regola sta in un posto solo perché quando stava in cinque il flag si
     è scollato senza che nessuno se ne accorgesse. */
  /* `varianti` è la terza forma di interruttore, e non è nessuna delle
     altre due: non spegne un gioco (la carta resta in home) e non spegne
     un pezzo di scuola (`sa` dice cosa il bambino ha fatto in classe,
     non che tipo di esercizio preferisce). Spegne un MODO di giocare
     dentro un gioco — oggi ce n'è uno solo, il calcolo a mente negli
     asteroidi (`asteroidi:mente`). Elenco di eccezioni come `giochi`:
     chi non dichiara niente ce l'ha acceso. */
  settings: { tables: [2, 3, 4, 5], sound: true, music: true,
              giochi: {}, sa: {}, varianti: {}, tuttoAperto: false },
  /* contatori che salgono e non scendono mai: sono la memoria di quanto
     si è giocato, e i traguardi si misurano quasi tutti qui sopra */
  /* i contatori dello spagnolo hanno un nome loro (`es`, `verbiEs`,
     `frasiEs`): sommarli a quelli inglesi vorrebbe dire non sapere più
     in quale lingua si è giocato */
  /* `misure` sono gli ingredienti dosati giusti, `incasso` sta in centesimi
     come tutto il resto della bancarella */
  /* del generale si contano quattro cose: i livelli portati a casa, le
     stelle raccolte, gli ordini firmati in tutto e i livelli chiusi
     **da soli** — senza farsi svelare niente e senza lasciare nessuno
     sul campo. `avanzati` è quello che dice se si sta davvero
     imparando: un livello vinto con un ordine di alto livello (un
     ciclo, una condizione, un evento) e non con la fila di passi. */
  totals: { math: 0, mente: 0, en: 0, verbi: 0, frasi: 0, es: 0, verbiEs: 0, frasiEs: 0, td: 0, pasti: 0,
            partiteMath: 0, torri: 0, perfette: 0, ondate: 0,
            misure: 0, pozioni: 0, pozioniPerfette: 0,
            clienti: 0, restiPerfetti: 0, incasso: 0, mercati: 0,
            missioni: 0, stelle: 0, ordini: 0, daSolo: 0, avanzati: 0,
            preferiti: 0, monete: 0, cure: 0, capsule: 0 },
  best: { math: 0, serieMath: 0, onda: 0, serieGiorni: 0, pozioni: 0, clienti: 0 },
  /* Il castello: quante tappe sono state superate (indice della prossima) e
     se la partita libera è sbloccata. `v` dice su quale campagna quel numero
     è stato scritto — le tappe sono passate da sei a quindici, e senza il
     numero di versione un salvataggio di ieri direbbe «due» intendendo una
     cosa diversa da quello che intende oggi. Vedi `migraCastello`. */
  td: { tappa: 0, libera: false, v: 2 },
  mate: { tappa: 0, libera: false },// stessa cosa per la campagna delle tabelline
  calc: { tappa: 0, libera: false },// e per le stazioni del calcolo a mente
  eng: { tappa: 0, libera: false }, // e per la campagna di English
  esp: { tappa: 0, libera: false }, // e per quella di Spagnolo
  mercato: { tappa: 0, libera: false }, // e per le giornate di mercato della bancarella
  lab: { tappa: 0, libera: false },     // e per le tappe del laboratorio delle pozioni
  /* Il generale ha la stessa forma delle altre campagne — `tappa` è quanti
     livelli sono stati superati ed è l'indice del prossimo — più due cose
     sue, tenute per livello e non in totale: `ordini` è il RECORD (il
     minor numero di ordini con cui quel livello è stato chiuso) e `stelle`
     quante stelle vale adesso, una o due. Stanno per livello perché
     rigiocarne uno già fatto non deve gonfiare il totale: le stelle sono
     la somma dei propri primati, non delle partite. */
  gen: { tappa: 0, libera: false, ordini: {}, stelle: {} },
  /* LE AVVENTURE DEL GENERALE — una voce per storia, e le storie non si
     mescolano fra loro: `fondi` non sa niente di `torre`. Dentro ognuna:
       capitolo  quanti capitoli sono stati superati (indice del prossimo)
       stelle    per CAPITOLO, con la chiave del capitolo e non il numero:
                 quando arriveranno i rami l'ordine dei capitoli cambierà,
                 le stelle già prese no
       fatti     quello che i capitoli lasciano dietro («lanterna-presa»,
                 «pozzo-aperto»). Oggi non li legge nessuno: il posto c'è
                 e la funzione che li aggiunge pure, l'interpretazione no.
     Chi le muove è `store/storie.js`, non questo file. */
  storie: {},                       // 'fondi' -> { capitolo, stelle:{}, fatti:[] }
  /* I GIOCHI NUOVI (`src/giochi/`) stanno tutti qui, con una forma sola:
     'codice' -> { tappa, libera, stelle:{}, cfg:{} }. Sopra si vede il
     contrario — otto campi che dicono la stessa cosa in otto modi — ed è
     il motivo per cui questo esiste: un gioco nuovo non deve più
     aggiungere un campo al profilo né una migrazione. Chi lo muove è
     `src/giochi/campagne.js`, e sa crearsi la voce che non c'è: un
     profilo salvato ieri gioca a un gioco di oggi senza migrazioni. */
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

/* Accendere e spegnere il suono passa di qui e non da `audio.js`, perché
   è una preferenza del profilo e va salvata: `suono.muta()` da solo
   cambiava il ref e basta. */
export function accendiSuono(si) {
  suonoAcceso.value = !!si
  state.profile.settings.sound = !!si
  persist()
}

/* ── con che personaggio si vede in mappa ──
   È un attributo del bambino, come il nome — non di un gioco: i giochi
   nuovi non toccano il profilo (vedi `src/giochi/campagne.js`), ma qui non
   sta nascendo un campo per la fattoria, sta nascendo un campo per il
   bambino che la fattoria (e domani chiunque altro disegni un personaggio
   in mappa) si limita a leggere. `PERSONE` — chi si può scegliere, contro
   le bestie che camminano per conto loro — viene dall'atlante degli
   sprite, generato da `strumenti/sprite/atlante.py` dal `tipo` dichiarato
   in ogni foglietto sorgente (`strumenti/sprite/FORMATO.md`).

   Il valore di partenza non sta in `blank()`: si calcola qui, alla
   lettura, come fa già `progresso()` in `campagne.js` — un profilo
   salvato ieri non ha bisogno di una migrazione per giocare oggi. Stessa
   idea per chi punta a un personaggio che l'atlante non ha più (un
   aggiornamento che ne toglie uno, o un salvataggio importato da un'altra
   casa): si ricade sul primo disponibile invece di piantare il gioco. */
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

/* ---------- il roster ----------
   Una voce vale se ha un id: il nome può essere vuoto (un profilo
   ricostruito da una chiave rovinata) e si rimedia con l'id, ma senza id
   non si sa nemmeno quale salvataggio caricare. */
function normalizzaVoce(v) {
  if (typeof v === 'string') return { id: v, nome: v }        // forma vecchia, mai pubblicata
  if (!v || typeof v !== 'object' || !v.id) return null
  return { id: String(v.id), nome: String(v.nome ?? v.id) }
}

/* Ricostruisce l'elenco senza cercare nessun nome: quello che c'è è
   quello che sta nell'archivio. Ordine alfabetico per id, che per i due
   profili di casa dà lo stesso ordine di prima. */
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
  /* Nessun roster: o è il primo avvio dopo l'aggiornamento — e allora i
     profili ci sono e vanno raccolti — oppure è un'installazione nuova,
     e allora non c'è niente da raccogliere e l'app chiede un nome. */
  return rosterDalleChiavi()
}

function salvaRoster() {
  save(KEY_ROSTER, state.giocatori.map(g => ({ id: g.id, nome: g.nome })))
}

export const giocatore = id => state.giocatori.find(g => g.id === id) || null
export const nomeDi = id => (giocatore(id) || {}).nome || ''
export const nomeCorrente = () => nomeDi(state.player)

/* Un id che non è mai stato usato. Opaco apposta: `g3` non dice a
   nessuno chi è, e rinominare non lascia dietro una chiave col nome
   sbagliato. Guarda anche l'archivio, non solo il roster, perché un
   profilo eliminato può aver lasciato la sua chiave. */
async function idLibero() {
  const presi = new Set(state.giocatori.map(g => g.id))
  for (const k of await chiavi(PREFISSO)) presi.add(k.slice(PREFISSO.length))
  for (let i = 1; ; i++) if (!presi.has('g' + i)) return 'g' + i
}

/* Crea un giocatore. Il nome si ripulisce ma non si controlla che sia
   unico: due fratelli possono chiamarsi uguale sullo schermo, gli id
   restano diversi ed è quello che conta.

   `entra` dice se metterlo subito al posto di chi sta giocando. Al primo
   avvio sì — è l'unico che c'è, e la domanda «come ti chiami?» finisce
   con lui che gioca. Dalla schermata dei genitori no: aggiungere un
   fratellino non vuol dire buttare fuori chi ha in mano il telefono, e
   cambiare giocatore lì ricarica la schermata e richiede il codice.

   `aspetto`, se c'è, è il personaggio scelto in fase di creazione — non
   obbligatorio: chi non lo passa si ritrova comunque `aspettoDi()` a
   posto al primo bisogno, col primo di `PERSONE`. Va applicato al
   profilo VUOTO come `partenza`, per lo stesso motivo: quando `entra` è
   falso il profilo non passa mai da `state.profile`, quindi
   `scegliAspetto()` (che scrive lì) non lo raggiungerebbe.

   `partenza` è **un numero di anni** da quando la manopola ha preso il
   posto delle quattro carte: la fascia si ricava da lì
   (`partenzaPerEta`) e l'età resta quella fine — 7 anni sta nella
   fascia dei 6,5 e deve restare 7. La chiave di una fascia si accetta
   ancora perché è quello che si scrive in un test quando l'età precisa
   non interessa. */
export async function creaGiocatore(nome, entra = true, partenza = null, aspetto = null) {
  const pulito = String(nome || '').trim().slice(0, 20)
  if (!pulito) throw new Error('Serve un nome')
  const id = await idLibero()
  state.giocatori.push({ id, nome: pulito })
  salvaRoster()
  /* La partenza è un pugno di eccezioni scritte una volta sola: da qui
     in poi il profilo è come tutti gli altri e si tocca a mano. Si
     applica al profilo VUOTO, prima che esista sul serio, così non
     esiste un istante in cui un bambino di quattro anni ha in home le
     divisioni in colonna. */
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
  if (entra) {
    await selectPlayer(id)
    if (partenza != null && partenza !== '') state.profile.settings = fresco.settings
    if (fresco.aspetto) state.profile.aspetto = fresco.aspetto
    if ((partenza != null && partenza !== '') || fresco.aspetto) persist()
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

/* ---------- il cheat delle monete ----------
   `giochi.html#monete=500` regala 500 monete al giocatore in corso, e
   `#monete=-100` le toglie. Serve ai grandi per provare i negozi senza
   rifarsi mille tabelline, e si scrive dove si scrivono gli indirizzi.

   Sta nel frammento (#) e non nella query (?) per un motivo pratico: il
   frammento si può cancellare da dentro la pagina anche aprendo il file
   con doppio click, la query no. Così il regalo si riscuote una volta
   sola e un aggiornamento della pagina non lo raddoppia.

   Un secondo giocatore scelto dopo non lo riceve: le monete vanno a chi
   stava giocando quando si è aperto l'indirizzo. */
export function riscuotiCheat() {
  if (typeof location === 'undefined') return 0
  // il numero deve finire lì: senza il controllo in coda `#monete=1e9`
  // regalerebbe 1 moneta, prendendo la prima cifra e ignorando il resto
  const m = /(?:^#?|&)monete=(-?\d{1,7})(?=&|$)/i.exec(location.hash || '')
  if (!m) return 0
  const n = parseInt(m[1], 10)
  try { location.hash = '' } catch (e) { /* pazienza: al massimo si ripete */ }
  if (!n) return 0
  addCoins(n)
  // chi usa il cheat spesso chiude subito la scheda: senza questo il
  // salvataggio ritardato di un terzo di secondo può non arrivare mai
  flush()
  return n
}

/* ── il posto delle migrazioni una-tantum ──
   `da` è la versione da cui viene il profilo (0 = non esisteva). Qui
   dentro si mette quello che si può fare **una volta sola**, perché al
   prossimo avvio `da` sarà già la versione di adesso e nessuno saprà più
   da dove veniva.

   Il numero è già letto e messo in mano a chi serve, perché il momento
   per agganciarsi è questo — quando la prossima build tocca i telefoni,
   l'informazione non c'è più. Chi aggiunge un caso qui scriva anche il
   suo test in `test/unita/profilo.test.mjs`. */
export function migraProfilo(p, da) {
  if (da === 0) return p        // profilo nuovo: non c'è niente da cui migrare
  if (da < 7) saperiArrivatiTardi(p.settings)
  return p
}

/* ── QUELLO CHE UNA FASCIA HA IMPARATO A SPEGNERE DOPO ──
   Le partenze scrivono le eccezioni **una volta sola**, dentro
   `creaGiocatore`: un bambino creato ieri non riceve niente di quello
   che l'elenco impara oggi. Finché si trattava di aggiungere un gioco
   andava bene — acceso è l'assenza, e un gioco nuovo nasce acceso per
   tutti — ma un pezzo di scuola che si scopre di dover spegnere è il
   caso opposto: chi ha già il profilo continua a ricevere le domande
   mute, e il difetto è arrivato in mano a un genitore giocando, non da
   qui.

   Qui sotto c'è **la fotografia** di cosa è stato aggiunto ai difetti
   di ogni fascia in questo giro. Non è un elenco da tenere allineato a
   `data/partenze.js`: è storia congelata, e il giro prossimo alzerà `v`
   e scriverà la sua accanto. Leggere gli elenchi di oggi non
   servirebbe — direbbero cosa una fascia spegne *adesso*, non cosa ha
   appena imparato a spegnere.

   ── E QUELLO CHE UN GRANDE HA MESSO A MANO NON SI TOCCA ──
   È la sola cosa che rende questa migrazione lecita, e regge per
   costruzione: si scrive una chiave **solo per la fascia in cui è
   nuova**, e solo se il profilo non dice già niente di suo su quella
   chiave. Il paragone non è mai con un profilo vuoto — le partenze
   *scrivono* delle eccezioni, e confrontare col vuoto farebbe
   risultare «messa a mano» ogni riga che nessuno ha toccato.

   I casi, uno per uno:

     · **c'è già scritto qualcosa** (`false`, o `true` per i pochi che
       nascono spenti) — è la voce di un grande, e non si tocca.
     · **non c'è scritto niente e la chiave è nuova per la sua fascia**
       — ieri il difetto non la nominava, quindi l'assenza non può
       voler dire «un grande l'ha riaccesa»: la riaccensione di un
       sapere al suo difetto non lascia traccia (`accendiSapere`
       cancella la voce), ed è esattamente il motivo per cui si guarda
       **la fascia** e non lo stato di oggi. Si scrive.
     · **non c'è scritto niente e la chiave non è nuova per la sua
       fascia** — lì l'assenza è la traccia di un grande che l'ha
       riaccesa, e infatti non si scrive niente.
     · **profilo senza età** — `settings.eta` manca ai profili nati
       prima che la domanda esistesse, e valgono `ETA_DIFETTO` (nove
       anni), cioè la fascia «quarta o quinta», che non spegne niente:
       la migrazione non li tocca, ed è la risposta giusta anche senza
       saperne l'età. Nessuna riga scritta a indovinare.

   ── E IL CESTINO ──
   Una copia messa da parte **prima** dell'aggiornamento porta con sé
   il suo `v` vecchio, quindi rimetterla la fa passare di qui e viene
   migrata; una fatta dopo ha già `v` nuovo e non si tocca due volte.
   Non c'è niente da fare: `ripristinaCestinato` scrive il profilo e
   chiama `selectPlayer`, che è la strada da cui si arriva qui. */
const SAPERI_ARRIVATI = {
  /* «Com'è fatto un animale»: il corpo che dice il posto è un
     obiettivo di fine terza, e a cinque e a sei anni e mezzo mancano
     due anni buoni. */
  piccoli: ['adattamento'],
  prima: ['adattamento'],
  /* Le sottovoci di quinta dentro due gruppi che restano accesi:
     ruotare a mente, i cubetti nascosti, lo sviluppo del cubo e le
     viste dall'alto. Vedi il commento della fascia in `partenze.js`. */
  terza: ['geo:rotazione', 'geo:cubetti', 'geo:sviluppo', 'geo:viste'],
  quarta: [],
}

function saperiArrivatiTardi(s) {
  if (!s || typeof s !== 'object') return
  if (!s.sa || typeof s.sa !== 'object') s.sa = {}
  const anni = Number(s.eta)
  /* la stessa lettura di `etaDelBambino`, che non si può chiamare da
     qui: `state.profile` è ancora quello di prima */
  const fascia = partenzaPerEta(
    Number.isFinite(anni) && anni >= 3 && anni <= 14 ? anni : ETA_DIFETTO)
  for (const k of (fascia && SAPERI_ARRIVATI[fascia.chiave]) || [])
    if (s.sa[k] === undefined) s.sa[k] = false
}

export async function selectPlayer(id) {
  state.player = id
  const raw = await load(KEY(id))
  const vuoto = blank()
  const p = { ...vuoto, ...(raw && typeof raw === 'object' ? raw : {}) }
  /* ── da quale versione viene questo profilo ──
     Va letto QUI, prima della riga sotto che lo timbra: `p.v = vuoto.v`
     riscrive il numero a ogni avvio senza averlo mai guardato, quindi
     appena un telefono apre una build nuova l'informazione è persa per
     sempre. Era vero anche prima — semplicemente non se ne era accorto
     nessuno, perché nessuna migrazione l'aveva mai chiesta.
     0 vuol dire «profilo che non esisteva», ed è giusto così: un profilo
     nuovo non ha niente da migrare. */
  const daVersione = Number.isFinite(raw && raw.v) ? raw.v : 0
  p.v = vuoto.v
  migraProfilo(p, daVersione)
  p.settings = { ...vuoto.settings, ...(p.settings || {}) }
  migraSaperi(p.settings)
  p.totals = { ...vuoto.totals, ...(p.totals || {}) }
  /* ── `nelPar` È DIVENTATO `daSolo` ──
     Il par non esiste più, e la seconda stella adesso la dà l'esserci
     arrivati da soli. Il travaso è ESATTO e non generoso: `dentroPar`
     ha sempre voluto dire «nel par **e** senza aiuti pagati **e** senza
     compagni caduti», cioè conteneva già tutto quello che oggi si
     chiede — chi lo aveva meritato lo merita anche adesso. Senza questa
     riga il traguardo tornerebbe indietro sotto gli occhi di chi lo
     aveva già preso. */
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
  p.mercato = { ...vuoto.mercato, ...(p.mercato || {}) }
  p.lab = { ...vuoto.lab, ...(p.lab || {}) }
  p.gen = { ...vuoto.gen, ...(p.gen || {}) }
  p.giorni = { ...vuoto.giorni, ...(p.giorni || {}) }
  /* i due dizionari del generale: un profilo salvato prima che il gioco
     esistesse non ce li ha, e uno rovinato a mano potrebbe averli di un
     altro tipo. In tutti e due i casi si riparte da vuoto, non da rotto. */
  if (!p.gen.ordini || typeof p.gen.ordini !== 'object') p.gen.ordini = {}
  if (!p.gen.stelle || typeof p.gen.stelle !== 'object') p.gen.stelle = {}
  /* le avventure: un profilo di ieri non ha `storie`, e uno rovinato a
     mano potrebbe averle di un altro tipo. In tutti e due i casi si
     riparte da vuoto — e vuoto qui vuol dire «nessuna storia cominciata»,
     che è esattamente quello che era vero prima che esistessero. */
  if (!p.storie || typeof p.storie !== 'object' || Array.isArray(p.storie)) p.storie = {}
  for (const k of Object.keys(p.storie)) p.storie[k] = normalizzaStoria(p.storie[k])
  if (!p.items || typeof p.items !== 'object') p.items = {}
  if (!p.pets || typeof p.pets !== 'object') p.pets = {}
  if (!p.dispensa || typeof p.dispensa !== 'object') p.dispensa = {}
  if (!p.badge || typeof p.badge !== 'object') p.badge = {}
  if (!Array.isArray(p.owned)) p.owned = []
  if (!Array.isArray(p.accessori)) p.accessori = []
  const ora = Date.now()
  for (const [id, a] of Object.entries(p.pets)) migraAnimale(a, ora, id)
  /* Chi giocava quando gli animali erano tre e stavano tutti in casa non
     ha `casa`: la si ricostruisce da quello che ha adottato. Il taglio a
     `POSTI_CASA` non toglie niente a nessuno — i tre di prima ci stanno tutti
     e quattro — e quello che eventualmente avanza finisce al rifugio,
     dove si riprende.

     La domanda si fa a `raw` e non a `p`: `p` viene dalla fusione col
     profilo vuoto, che una `casa` vuota ce l'ha sempre, e chiederlo a lui
     vorrebbe dire non distinguere «non l'ha mai avuta» da «l'ha svuotata».
     Un salvataggio di ieri si ritroverebbe tutti gli animali al rifugio,
     da ricomprare uno per uno. */
  if (!Array.isArray(raw && raw.casa)) p.casa = Object.keys(p.pets)
  p.casa = p.casa.filter((id, i, l) => p.pets[id] && petDi(id) && l.indexOf(id) === i)
                 .slice(0, POSTI_CASA)
  state.profile = p
  state.festa = []
  /* Il muto è del bambino, non del telefono. `settings.sound` esisteva
     dal principio ma non lo leggeva nessuno: l'audio era una variabile
     globale accesa a ogni avvio, quindi chi lo spegneva se lo ritrovava
     acceso il giorno dopo, e spegnerlo per uno lo spegneva per tutti. */
  suonoAcceso.value = p.settings.sound !== false
  fixLayout()
  // chi giocava prima che le campagne esistessero non deve ricominciare da capo
  allineaMate(p)
  allineaCalcolo(p)
  allineaInglese(p)
  allineaSpagnolo(p)
  allineaPozioni(p)
  apriGiornata()
  save('ultimo-giocatore', id)
  persist()
}

/* ---------- la giornata ----------
   Un giorno di fila si conta appena si sceglie il giocatore: entrare è
   già il gesto che conta, non serve indovinare qualcosa per meritarlo. */
function apriGiornata(now = Date.now()) {
  const p = state.profile
  segnaGiorno(p, now)
  p.giorni.serie = serieViva(p, now) || p.giorni.serie
  p.best.serieGiorni = Math.max(p.best.serieGiorni || 0, p.giorni.serie || 0)
  controllaTraguardi(now)
}

/* ── cosa sa il bambino ──
   I macrogruppi di scuola (`data/saperi.js`): accesi salvo che i
   genitori li spengano, per bambino come tutto il resto di `settings`.
   Spegnere non toglie un gioco e non tocca nessun progresso: toglie le
   domande che senza quel pezzo di scuola non si possono ragionare. */
/* Il difetto lo dichiara il catalogo (`difetto: false` in
   `data/saperi.js`), non questo file: quasi tutti i saperi nascono
   accesi, i pezzi che a scuola si fanno dopo — congiuntivo,
   condizionale, passato remoto — nascono spenti. Quello che si salva
   nel profilo resta **solo l'eccezione**, come per i giochi in home:
   cambia da cosa. Le tipologie dei moduli (`orto:apostrofo`) non stanno
   nel catalogo e non hanno difetto: sono accese, come sempre. */
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
/* quelli spenti, che è la forma in cui li vuole chi fa le domande:
   `quiz/scelta.js` non chiede «è acceso questo?», chiede «cosa devo
   evitare» e degrada da sé.

   Si leggono le eccezioni salvate invece di filtrare il catalogo,
   perché qui dentro finiscono due specie di chiavi: i gruppi di
   `data/saperi.js` («accenti») e le singole tipologie dichiarate dai
   moduli di quiz («orto:apostrofo»). Le seconde il profilo non le
   conosce e non deve conoscerle — sarebbe l'elenco di tutti i moduli
   dentro lo store — e per chi fa le domande sono comunque la stessa
   cosa: una chiave da evitare. Una chiave rimasta nel salvataggio di
   una tipologia che non esiste più non fa danno: non la chiede
   nessuno.

   Ai nomi salvati si aggiungono quelli che nascono spenti: nel profilo
   non c'è scritto niente proprio perché sono al loro difetto, e chi fa
   le domande deve saperli evitare lo stesso. */
export const saperiSpenti = () =>
  [...new Set([...Object.keys(state.profile.settings.sa || {}), ...SPENTI_DI_PARTENZA])]
    .filter(c => !sapereAcceso(c))

/* ── LE TRE POSIZIONI DI UN PEZZO DI SCUOLA ──
   Il gemello di `fissaGioco`, e per lo stesso motivo. `accendiSapere`
   risponde a «acceso o spento?», che è la domanda giusta quando a
   chiedere è chi fa le domande; la tacca della schermata dei grandi ne
   fa un'altra — **chi decide**, l'età o il grande — e le posizioni sono
   tre, non due.

   «Come dice l'età» non vuol dire «nessuna eccezione»: vuol dire quella
   che la partenza di quest'età scriverebbe adesso, che per le divisioni
   a otto anni è `false`. È la stessa cosa che scrive `rimettiAiDifetti`,
   e le due strade devono portare allo stesso posto — se qui si
   cancellasse e basta, «rimetti questa riga» e «rimetti tutto»
   lascerebbero due profili diversi, e la riga resterebbe ambra dopo
   aver rimesso tutto. */
export function fissaSapere(chiave, come) {
  const s = state.profile.settings
  if (!s.sa) s.sa = {}
  if (come !== 'difetto') { accendiSapere(chiave, come === 'si'); return }
  const atteso = eccezioniPerEta(etaDelBambino()).sa || {}
  if (atteso[chiave] === false) s.sa[chiave] = false
  else delete s.sa[chiave]
  persist()
}

/* Le divisioni sono un sapere come gli altri; questi due nomi restano
   perché il castello li chiama così da sempre e dire `sapereAcceso
   ('divisioni')` dentro la cassa non lo renderebbe più chiaro. */
export const divisioniAccese = () => sapereAcceso('divisioni')
export const accendiDivisioni = si => accendiSapere('divisioni', si)

/* Quello che il castello sa fare, nella forma che `data/ops.js` si
   aspetta. Sta qui e non nella cassa perché lo chiedono in tre — la
   cassa, il banco e il cartello di fine tappa — e tre copie della stessa
   coppia di chiamate erano tre posti dove dimenticarne una. */
export const contiPermessi = () => ({
  div: sapereAcceso('divisioni'),
  mul: sapereAcceso('moltiplicazioni'),
})

/* Il flag di ieri diventa il sapere di oggi. Prima le divisioni erano
   `settings.divisioni`, un booleano tutto loro; chi le aveva spente non
   se le deve ritrovare accese al primo avvio dopo l'aggiornamento —
   sarebbe il caso peggiore, perché il gioco tornerebbe a chiedere
   proprio quello che il bambino non sa fare. Si legge una volta e poi
   il vecchio flag sparisce dal profilo. */
/* Le tipologie della coniugazione si chiamavano `verbo:futuro`, che è
   il prefisso dei verbi inglesi in `items`: dal giorno che il ripasso
   dei quiz scrive lì dentro sarebbero due materie nello stesso
   cassetto, e si chiamano `coniug:` (vedi `quiz/moduli/coniugazione.js`).
   Chi aveva spento una di quelle voci se la deve ritrovare spenta:
   perdere un'eccezione qui vuol dire ricominciare a chiedere proprio
   quello che il genitore aveva tolto. */
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

/* ── i giochi in prova ──
   Un gioco `sperimentale` sta dietro un cancello: finché questo flag è
   spento non esiste per chi gioca — non è in home, non è fra le carte
   da accendere, e non conta nel «non hai nessun gioco acceso». È uno
   solo per tutti i giochi in prova, ed è **per bambino** come tutto il
   resto di `settings`: si può dare il gioco a metà al più grande e non
   alla piccola. Resta raggiungibile dall'indirizzo (`#generale`), che è
   la strada dei grandi e dei test. */
export const sperimentaliAccesi = () => state.profile.settings.sperimentali === true
export function accendiSperimentali(si) {
  state.profile.settings.sperimentali = !!si
  persist()
}

/* i giochi in home: accesi salvo che i genitori li spengano, ed è per
   bambino — uno può avere il castello e l'altro no. Quelli in prova
   passano prima dal cancello qui sopra. */
export const giocoAcceso = chiave =>
  (!eSperimentale(chiave) || sperimentaliAccesi()) &&
  giocoGiocabile(chiave) &&
  (state.profile.settings.giochi || {})[chiave] !== false

/* Un gioco fatto tutto della stessa classe di domande — il laboratorio
   delle pozioni, che è conversioni e basta — non si può giocare se quel
   macrogruppo è spento: non sarebbe difficile, sarebbe da indovinare.
   Non è l'interruttore dei genitori messo giù, è la carta che non si
   accende, e la schermata dei genitori scrive perché. */
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
  /* «Come dice l'età» non vuol dire «nessuna eccezione»: vuol dire
     **quella che la partenza di quest'età scriverebbe adesso**, che per
     un gioco da piccoli a nove anni è `false`. È la stessa cosa che
     scrive `rimettiAiDifetti`, e le due strade devono portare allo
     stesso posto: se qui si cancellasse e basta, «rimetti tutto» e
     «rimetti questa riga» lascerebbero due profili diversi. */
  const atteso = eccezioniPerEta(etaDelBambino()).giochi || {}
  if (atteso[chiave] === false) s.giochi[chiave] = false
  else delete s.giochi[chiave]
  persist()
}
/* quanti ne restano accesi: se sono zero la home lo dice invece di
   mostrare una pagina vuota */
export const quantiGiochiAccesi = () => CHIAVI_GIOCHI.filter(giocoAcceso).length

/* ── SPOSTARE L'ETÀ, CHE ADESSO È L'UNICA MANOPOLA ──
   Qui c'era `applicaPartenza`: si sceglieva una delle quattro fasce e
   si riscrivevano giochi, saperi ed età in blocco. Serviva a chi era
   nato prima che la domanda esistesse, ma era **la seconda manopola**
   della stessa carta — dieci pixel sotto un `− 7,5 anni +` che
   spostava solo l'età — e le due non si distinguevano guardandole,
   mentre una delle due cancellava senza dirlo.

   Adesso ce n'è una sola, in anni, e la fascia è una conseguenza. Cosa
   succede spostandola lo decide `spostandoLEta` in `data/partenze.js`,
   che è dato puro e si prova senza schermo; qui si scrive e basta. I
   tre casi stanno lì, ma il patto vale la pena ripeterlo perché è
   quello che rende la manopola usabile: **dentro la stessa fascia non
   si tocca niente**. Da 8 a 8,5 si muove la mira delle domande, e tutto
   quello che il grande aveva sistemato a mano resta dov'era.

   Quello che questa funzione non tocca è tutto il resto: monete,
   animali, campagne, traguardi, la memoria di cosa il bambino sa — e
   nemmeno gli altri settaggi (il suono, i giochi in prova, le
   varianti). L'età decide cosa si vede e cosa si chiede, non cancella
   niente di quello che è stato guadagnato. */
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
    /* i ritocchi se ne vanno col resto: sono correzioni sopra l'età, e
       ripartire dai difetti vuol dire ripartire da quella. Che
       spariscano non è mai una sorpresa — entrano nel conto di
       `suMisura`, quindi la schermata l'ha già fatto confermare. */
    delete s.ritocchi
  }
  persist()
  return mossa
}

/* ── E IL TASTO CHE RIMETTE TUTTO ──
   Il compagno di `spostaLEta`, per il caso in cui l'età è giusta e a
   essere sbagliato è quello che ci è stato messo sopra. Non tocca
   l'età: butta le eccezioni e riparte dai difetti della sua fascia,
   ritocchi compresi — sono correzioni sopra l'età, e rimetterla come
   nuova vuol dire togliere anche quelle.

   `null` quando non c'era niente da rimettere: chi lo chiama può dirlo
   invece di far finta di aver fatto qualcosa. */
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

/* ── il ritocco: «per lui questo è facile» ──
   L'interruttore dei saperi era un sì/no, e il no è una risposta
   grossa: «i problemi scritti no» tiene fuori anche quelli da una riga
   che il bambino saprebbe fare. Ma non bastano nemmeno tre blocchi da
   scegliere: quello che un grande vuole dire quasi sempre è **una tacca
   più su o una più giù** rispetto a come l'abbiamo tarata noi.

   Un gradino è mezzo anno di scuola (`PASSO` in `quiz/nucleo/modulo.js`)
   e se ne fanno al massimo tre per parte: oltre un anno e mezzo non si
   sta più ritoccando una taratura, si sta dicendo un'altra cosa — e
   quell'altra cosa è spegnere il gruppo, che ha il suo tasto.

   La chiave è un gruppo di `data/saperi.js` o una singola tipologia di
   quiz: per chi fa le domande sono la stessa cosa. Chi non ritocca
   niente non ha nessuna voce nel profilo, che è il caso normale. */
export const ritoccoSapere = chiave => (state.profile.settings.ritocchi || {})[chiave] || 0
/* quanti ne sono stati fatti, e come si torna indietro tutti insieme.
   Serve perché i ritocchi sono tanti piccoli gesti e nessuno si ricorda
   quali ha fatto: senza un modo di rimetterli a posto, la prima volta
   che uno smanetta si ritrova una taratura sua che non sa più
   ricostruire. L'età no: quella si vede scritta in cima e si sposta
   col dito, quindi non c'è niente da ricordare. */
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

/* ── RICOMINCIARE A CONTARE UNA RIGA ──────────────────────────────
   «Come va» mostra il conto delle risposte di ogni tipologia, e quel
   conto è **appiccicoso**: dopo aver reso una cosa più facile, il vecchio
   «ne ha sbagliate 7 su 10» resta lì per settimane e continua a dire una
   cosa che non è più vera — perché le dieci risposte vecchie le ha date
   sulle domande di prima. Chi ritocca deve poter dire «adesso ricomincia
   a contare», o l'unica alternativa è aspettare che le nuove risposte
   diluiscano le vecchie.

   Si butta **il conto**, non l'elemento: `s` (la forza del ripasso) e
   `last` restano, perché quelli non parlano di quanto era tarata bene
   una domanda ma di quando va ripassata — e un ripasso azzerato
   rifarebbe uscire domani una cosa saputa ieri. Anche il tempo se ne va
   con le risposte: è la loro media. */
export function azzeraConto(chiave) {
  const it = state.profile.items?.[chiave]
  if (!it) return false
  it.ok = 0; it.err = 0; it.seen = 0; it.t = 0
  persist()
  return true
}

/* Tutto quello che dipende dal bambino e non dal modulo, nella forma in
   cui lo vuole `quiz/nucleo/classi.js`. Un oggetto solo perché è una
   cosa sola: «chi sta giocando». */
export const regoleDomande = () => ({
  eta: etaDelBambino(),
  finestra: finestraDi(etaDelBambino()),
  ritocchi: { ...(state.profile.settings.ritocchi || {}) },
})

/* ── le varianti: un MODO di giocare dentro un gioco ──
   Non è l'interruttore di un gioco (la carta resta in home) e non è
   quello di un sapere: `data/saperi.js` dichiara cosa un bambino ha
   fatto a scuola, e «preferisco solo le tabelline» non è la stessa cosa
   — spegnere una variante non toglie nessuna domanda agli altri giochi.
   Elenco di eccezioni come i giochi, per bambino: chi non dichiara
   niente ce l'ha accesa, quindi una variante nuova nasce accesa anche
   per chi ha il profilo di ieri. */
export const varianteAccesa = chiave =>
  (state.profile.settings.varianti || {})[chiave] !== false
export function accendiVariante(chiave, si) {
  const s = state.profile.settings
  if (!s.varianti) s.varianti = {}
  if (si) delete s.varianti[chiave]   // acceso è l'assenza: niente voci inutili nel salvataggio
  else s.varianti[chiave] = false
  persist()
}

/* ── QUELLO CHE UN BAMBINO HA GIÀ VISTO UNA VOLTA ──
   Serve alle spiegazioni che compaiono **dentro la partita** e devono
   comparire una volta sola: oggi la riga dei primi passi del tower
   defense (`views/TowerDefense.vue`), che sta in fondo al campo finché
   la prima torre non è in piedi.

   Non serve più ad aprire da solo il foglio del `?`: quello è stato
   provato e tolto — un velo all'apertura i bambini lo chiudono per
   riflesso, e insegna a chiudere i veli.

   Sta nelle impostazioni del bambino e non nell'archivio di casa: un
   fratello che apre il gioco per la prima volta deve rivederla anche se
   l'altro l'ha già superata. Come le varianti, si scrive solo quello che
   è successo — chi non ha una voce non l'ha mai vista. */
export const guidaGiaVista = chiave =>
  (state.profile.settings.guideViste || {})[chiave] === true
export function segnaGuidaVista(chiave) {
  const s = state.profile.settings
  if (!s.guideViste) s.guideViste = {}
  if (s.guideViste[chiave]) return
  s.guideViste[chiave] = true
  persist()
}

/* i lucchetti delle campagne: spento vuol dire «una tappa per volta»,
   che è il comportamento di sempre. Acceso, tutte le tappe di tutti i
   giochi si aprono subito. */
export const tuttoAperto = () => state.profile.settings.tuttoAperto === true
export function accendiTuttoAperto(si) {
  state.profile.settings.tuttoAperto = !!si
  persist()
}

/* ── una tappa è aperta? ──
   La domanda che ogni campagna si faceva per conto suo, con la stessa
   riga copiata in cinque giochi: `i <= progresso.tappa`. Adesso è qui,
   una volta sola, perché il lucchetto dei genitori la deve poter
   scavalcare tutta insieme — e perché una regola scritta in cinque
   posti prima o poi diverge in cinque modi.

   `fatto` è quante tappe sono state superate (`progresso.tappa`): la
   prossima è sempre aperta, quelle dopo no. È una funzione pura tranne
   che per il flag, quindi la si può provare senza browser. */
export const tappaAperta = (i, fatto) => tuttoAperto() || i <= fatto

/* Senza giocatore non si scrive: durante l'onboarding il profilo in
   memoria è un `blank()` che non è di nessuno, e salvarlo creerebbe una
   chiave `profilo:` senza id — che poi il roster ricostruito dalle
   chiavi si ritroverebbe fra i piedi come un giocatore senza nome. */
export function persist() {
  if (!state.player) return
  save(KEY(state.player), JSON.parse(JSON.stringify(state.profile)))
}
export const flushNow = flush

export async function resetPlayer() {
  /* La copia prima del rogo: vedi `store/cestino.js`. Si prende
     `state.profile` e non quello su disco perché `persist()` scrive con
     un ritardo, e quello che il grande sta cancellando è ciò che ha
     davanti adesso. */
  await cestina(state.player, nomeCorrente(), state.profile, 'cancellati')
  state.profile = blank()
  state.festa = []
  await remove(KEY(state.player))
  apriGiornata()
  persist()
}

/* Mettere da parte una copia senza cancellare niente: la chiama chi sta
   per azzerare **una parte** dei progressi (una campagna sola) invece di
   tutto, e quindi non passa da `resetPlayer`. */
export async function cestinaOra(motivo = '') {
  await cestina(state.player, nomeCorrente(), state.profile, motivo)
}

/* Rimettere una copia dal cestino. Ricostruisce anche il roster: la voce
   può essere di un bambino eliminato, che nell'elenco non c'è più — e un
   profilo senza nessuno che lo nomini sarebbe un salvataggio orfano, cioè
   invisibile. Ritorna il nome, così la schermata può dire chi è tornato.

   Non consuma la voce (vedi `store/cestino.js`): un ripristino sbagliato
   dev'essere annullabile ripristinando quello giusto. */
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

/* ---------- salvataggio da portare via ----------
   I progressi vivono solo dentro il browser del telefono: se si rompe, o
   se un giorno cambia l'indirizzo da cui si aprono i giochi, spariscono.
   Queste due funzioni sono la rete di sicurezza, e stanno dietro il PIN
   della schermata dei genitori. */

/* La firma serve a non farsi dare un JSON qualsiasi. Un salvataggio
   scaricato prima di questa versione ne ha una diversa, e va importato
   lo stesso: per questo il controllo qui sotto non guarda che il nome
   combaci, ma che il file **abbia la forma** di un salvataggio. Inseguire
   l'elenco delle firme vecchie sarebbe stato peggio del male — e una di
   quelle era un pezzo di storia di casa che in un repo pubblico non ha
   motivo di stare. */
const FIRMA = 'giochi-bambini'

export async function esportaTutto() {
  // il profilo aperto può essere più fresco di quello già scritto su disco
  persist()
  await flush()
  /* Si esporta quello che c'è nell'archivio, non quello che c'è nel
     roster: se un profilo è rimasto orfano — roster perso, voce
     cancellata per sbaglio — questo è l'ultimo momento in cui qualcuno
     se ne può accorgere, e buttarlo qui vorrebbe dire buttarlo davvero. */
  const profili = {}
  for (const k of await chiavi(PREFISSO)) {
    const p = await load(k)
    if (p) profili[k.slice(PREFISSO.length)] = p
  }
  /* I nomi viaggiano col file: senza, un profilo con id opaco tornerebbe
     indietro chiamandosi `g2`. */
  const giocatori = state.giocatori.map(g => ({ id: g.id, nome: g.nome }))
  return { tipo: FIRMA, v: 2, esportato: new Date().toISOString(), giocatori, profili }
}

/* Ritorna i nomi ripristinati, così la schermata può dire cosa è successo
   invece di un generico "fatto". */
export async function importaTutto(dati) {
  if (!dati || !dati.profili || typeof dati.profili !== 'object' || Array.isArray(dati.profili))
    throw new Error('Questo non è un salvataggio dei giochi')

  /* Il roster si ricostruisce da quello che c'è nel file, non da un
     elenco scritto qui: un salvataggio può arrivare da un'altra casa,
     con altri bambini e altri id, e deve entrare comunque. */
  const ripristinati = []
  for (const [id, p] of Object.entries(dati.profili)) {
    if (!id || !p || typeof p !== 'object') continue
    save(KEY(id), p)
    ripristinati.push(id)
  }
  if (!ripristinati.length) throw new Error('Nel file non c\'è nessun profilo da ripristinare')

  /* I nomi, se il file li porta; altrimenti l'id fa anche da nome, come
     per i profili di prima che il roster esistesse. */
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

/* ---------- elementi ---------- */
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

/* ---------- monete e livelli ----------
   Il livello è uno solo per tutto il profilo ed è la somma dell'esperienza
   di ogni gioco (vedi store/progressi.js): è anche il moltiplicatore delle
   monete, così giocare a inglese fa guadagnare di più anche alle torri.
   I livelli per singolo gioco esistono, ma stanno nella pagina Albo e non
   toccano l'economia: un salvadanaio solo, un livello solo. */
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

export function buy(emoji, cost) {
  if (state.profile.owned.includes(emoji) || state.profile.coins < cost) return false
  state.profile.coins -= cost
  state.profile.owned.push(emoji)
  fixLayout()
  controllaTraguardi()
  persist()
  return true
}

/* ═══════════ contatori e traguardi ═══════════
   I giochi non toccano `totals` e `best` a mano: chiamano queste due, che
   sanno anche far scattare i traguardi. Un contatore che nessuno guarda
   non serve a niente, uno guardato dal posto sbagliato si dimentica. */
export function segna(chiave, n = 1) {
  const t = state.profile.totals
  t[chiave] = (t[chiave] || 0) + n
  controllaTraguardi()
  persist()
  return t[chiave]
}

/* Registra un primato. Torna true se è un record nuovo, così il gioco può
   festeggiare senza doversi ricordare il valore di prima. */
export function segnaBest(chiave, valore) {
  const b = state.profile.best
  if (!(valore > (b[chiave] || 0))) return false
  b[chiave] = valore
  controllaTraguardi()
  persist()
  return true
}

/* Guarda se qualche traguardo è stato raggiunto adesso.
   È rientrante — il premio in monete richiama addCoins, che richiama
   persist — quindi si protegge da sola.

   La PRIMA volta (profilo che esisteva prima dei traguardi, o appena
   azzerato) i traguardi già meritati vengono registrati in silenzio:
   niente monete e niente festa. Regalare duemila monete e venti popup
   per cose fatte il mese scorso non è un premio, è rumore. */
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

/* la vista che mostra la festa la toglie di mezzo appena l'ha mostrata */
export function festaVista() { state.festa = [] }

/* ---------- la fotografia dei progressi, per la pagina Albo ---------- */
export const traguardi = (now = Date.now()) => statoTraguardi(state.profile, now)
export const livelloOra = (now = Date.now()) => livelloTotale(state.profile, now)
export const areaOra = (area, now = Date.now()) => progressoArea(state.profile, area, now)
export const serieGiorni = (now = Date.now()) => serieViva(state.profile, now)

/* ---------- "a che punto sei" in una materia ----------
   `abilitaOra('mate')` dice quanto si sa adesso, `difficoltaOra('mate')`
   traduce lo stesso numero in un livello 1..5 da dare a un generatore di
   domande. È il gancio con cui i giochi smettono di ripartire da zero. */
export const abilitaOra = (materia, now = Date.now()) => abilita(state.profile, materia, now)
export const difficoltaOra = (materia, now = Date.now()) => difficolta(state.profile, materia, now)

/* ---------- campagna del tower defense ----------
   `tappa` è quante tappe sono state superate: è anche l'indice della prossima
   da giocare. Vinta l'ultima si apre la partita libera, senza fine. */
export const tdProgresso = () => state.profile.td

/* ---------- il salvataggio di chi giocava alle sei tappe ----------

   Il castello aveva sei tappe; adesso ne ha quindici, tre campagne da
   cinque. `td.tappa` è un indice su quella fila, quindi un «4» scritto
   ieri e un «4» scritto oggi non parlano dello stesso posto: senza
   rimappare, chi era arrivato in fondo si ritroverebbe a metà del bosco.

   La regola è che **nessuno torna indietro**. Le sei tappe di ieri
   coprivano, per scaletta e difficoltà, quello che oggi sono le prime
   due campagne: chi le aveva finite tutte trova aperto tutto il bosco e
   tutto il sotterraneo — e le mura, che sono nuove, restano da
   conquistare. La partita libera, se era sbloccata, resta sbloccata: era
   un premio già preso, e i premi non si tolgono.

   La tabella è scritta a mano e non è una proporzione: dieci diviso sei
   darebbe numeri che non cadono su un confine di campagna, e la prima
   cosa che un bambino guarda è dove si ferma la fila delle bandierine.

   `v` è il segno che la migrazione è già stata fatta. Va letto **prima**
   di fondere il salvataggio con il profilo vuoto: se si fondesse per
   primo, il `v` del vuoto coprirebbe l'assenza nel salvataggio e la
   rimappatura non partirebbe mai. */
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

/* ---------- campagna delle tabelline ----------
   Stessa forma della campagna del castello: `tappa` è quante ne sono
   state superate ed è l'indice della prossima. Le stelle invece non si
   segnano da nessuna parte: si ricalcolano dal motore ogni volta che si
   guarda, perché una tabellina che non si ripassa smette di essere sicura
   e la stella deve poter tornare indietro. */
export const mateProgresso = () => state.profile.mate
export const tabellineIntere = (now = Date.now()) => tabellineIntereDi(state.profile, now)

export function mateCompleta(indice, quanteTappe) {
  const mate = state.profile.mate
  mate.tappa = Math.max(mate.tappa || 0, indice + 1)
  if (mate.tappa >= quanteTappe) mate.libera = true
  controllaTraguardi()
  persist()
  flush()
  return mate
}

/* ---------- campagna del calcolo a mente ----------
   Le stazioni stanno accanto ai pianeti e nel profilo hanno un campo
   loro: le due campagne degli asteroidi si aprono in parallelo, perché
   3+4 viene prima delle tabelline e 4×23 viene dopo. */
export const calcProgresso = () => state.profile.calc

export function calcCompleta(indice, quanteTappe) {
  const c = state.profile.calc
  c.tappa = Math.max(c.tappa || 0, indice + 1)
  if (c.tappa >= quanteTappe) c.libera = true
  controllaTraguardi()
  persist()
  flush()
  return c
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

/* ═══════════ campagna del laboratorio delle pozioni ═══════════
   `tappa` è quante tappe sono state superate ed è l'indice della prossima.
   Finita l'ultima si apre il laboratorio libero, che non chiude mai. */
export const labProgresso = () => state.profile.lab

export function labCompleta(indice, quanteTappe) {
  const l = state.profile.lab
  l.tappa = Math.max(l.tappa || 0, indice + 1)
  if (l.tappa >= quanteTappe) l.libera = true
  controllaTraguardi()
  persist()
  flush()          // una tappa si vince di rado: non deve perdersi
  return l
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

   ── `finita` LA DECIDE CHI CHIAMA, E NON È UN CONTO DI POSIZIONI ──
   Prima qui arrivava «quanti livelli ci sono» e la campagna era finita
   quando `tappa` li raggiungeva. Non regge più da quando i livelli non
   ancora approvati stanno dietro il cancello dei giochi in prova: la
   fila che si sta giocando ha dei buchi, e `tappa` è una punta nella
   fila piena — con sei livelli visibili su ventisei quel confronto non
   sarebbe mai vero. Chi sa quali si vedono è il gioco
   (`views/generale/fila.js`), e passa la risposta già fatta. */
export const genProgresso = () => state.profile.gen

/* ── COSA VALE LA SECONDA STELLA ──
   Una regola sola per le prove e per i capitoli, scritta qui perché è
   una regola di progressione e non di partita.
   Prima era **il par**: chiudere con pochi ordini. Il gioco però non
   chiede di risolvere in poche mosse, chiede di risolvere — e quel
   numero diceva al bambino che il piano che funziona, il suo, non era
   quello giusto. Adesso la seconda stella dice una cosa che il gioco
   intende davvero: **ci sei arrivato da solo**. La perde chi si è fatto
   dare la struttura o la soluzione (i due gradini grossi della scala
   degli aiuti — il suggerimento leggero resta gratis e non toglie
   niente) e chi lascia qualcuno sul campo, perché se no mandare avanti
   un compagno a morire sarebbe gratis. */
export const daSolo = ({ svelato = false, caduti = 0 } = {}) => !svelato && !caduti

export function genCompleta(indice, conto = {}) {
  const { ordini = 0, avanzato = false, finita = false } = conto
  const g = state.profile.gen
  const primaVolta = indice + 1 > (g.tappa || 0)
  /* la punta toccata nella fila piena: non apre più i lucchetti — quelli
     si leggono dalle stelle — ma resta quello che guardano i contatori
     e la riga in home */
  g.tappa = Math.max(g.tappa || 0, indice + 1)
  if (finita) g.libera = true

  // il record è il MINORE: chiudere con meno ordini vuol dire aver capito
  // meglio, non aver giocato di più
  const rec = g.ordini[indice] || 0
  if (ordini > 0 && (!rec || ordini < rec)) g.ordini[indice] = ordini

  // due stelle a chi ci è arrivato da solo, una a chi ce la fa e basta.
  // Si tiene la migliore: una partita storta non toglie la stella già
  // guadagnata.
  const solo = daSolo(conto)
  const stelle = solo ? 2 : 1
  const prima = g.stelle[indice] || 0
  if (stelle > prima) g.stelle[indice] = stelle

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

/* ═══════════ le avventure del generale ═══════════
   Qui c'è solo il POSTO dove stanno e la garanzia che sia sano: chi le
   legge e chi le muove è `store/storie.js`, che di profili non sa
   niente e resta un modulo di funzioni. */
export function normalizzaStoria(s) {
  const r = s && typeof s === 'object' ? s : {}
  return {
    capitolo: Number.isFinite(r.capitolo) && r.capitolo > 0 ? Math.floor(r.capitolo) : 0,
    stelle: r.stelle && typeof r.stelle === 'object' && !Array.isArray(r.stelle) ? { ...r.stelle } : {},
    fatti: Array.isArray(r.fatti) ? r.fatti.filter(f => typeof f === 'string') : [],
  }
}

/* la voce di una storia, creata al primo bisogno: leggere non deve
   scrivere niente, ma chi scrive vuole trovarla già lì */
export function storiaProfilo(id, crea = false) {
  const p = state.profile
  if (!p.storie || typeof p.storie !== 'object') p.storie = {}
  if (!p.storie[id]) {
    if (!crea) return normalizzaStoria(null)
    p.storie[id] = normalizzaStoria(null)
  }
  return p.storie[id]
}

/* i due nomi di prima, che la home e i test usano ancora */
export const engProgresso = () => linguaProgresso('eng')
export const espProgresso = () => linguaProgresso('esp')
export const engCompleta = (i, n) => linguaCompleta('eng', i, n)
export const espCompleta = (i, n) => linguaCompleta('esp', i, n)

/* ═══════════ animali ═══════════
   Tre insiemi diversi, e la differenza conta: **adottati** (`pets`) è
   tutto quello che è stato preso almeno una volta, **in casa**
   (`casa`, fino a quattro) è chi sta in cameretta adesso, e **al
   rifugio** è la differenza fra i due. I bisogni li ha solo chi è in
   casa: al rifugio se ne occupano loro, ed è per questo che chi torna
   trova le barre rimesse a posto invece di un rimprovero. */
export const haAnimale = id => !!state.profile.pets[id]
export const inCasa = id => (state.profile.casa || []).includes(id)
export const postiLiberi = () => Math.max(0, POSTI_CASA - (state.profile.casa || []).length)

/* Il nome è del bambino, la sagoma del catalogo: chi disegna e chi
   scrive l'etichetta guardano lo stesso oggetto fuso. Le viste chiedono
   `animale(id)` e usano `.nome` senza sapere da dove viene. */
export function animale(id) {
  const def = petDi(id)
  if (!def) return null
  const mio = state.profile.pets[id]
  return { ...def, nome: (mio && mio.nome) || def.nome, mio: !!mio }
}

export const miei = () => (state.profile.casa || []).map(animale).filter(Boolean)
export const alRifugio = () => Object.keys(state.profile.pets)
  .filter(id => !inCasa(id) && petDi(id)).map(animale)
export const nomeAnimale = id => animale(id)?.nome || ''

/* quanto vale una barra adesso: cala da sola col passare delle ore,
   anche a gioco chiuso */
export const bisogno = (id, k, now = Date.now()) =>
  livelloDi(state.profile.pets[id], k, now)

/* di cosa ha bisogno adesso: la barra più bassa */
export const chiede = (id, now = Date.now()) => urgenza(state.profile.pets[id], now)

/* la pancia ha un nome suo perché mezzo gioco parla di lei */
export const sazieta = (id, now = Date.now()) => bisogno(id, 'fame', now)

/* chi ha almeno una barra sotto la soglia: è la riga che la schermata
   iniziale mostra per far tornare qui il bambino */
export const daCurare = (now = Date.now()) =>
  miei().filter(p => chiede(p.id, now).grado === 'basso')

/* Adottare: si paga il prezzo pieno, si sceglie il nome e ci vuole un
   posto libero. Chi ha la casa piena passa da `sostituisci`, che è la
   stessa cosa con un saluto in mezzo. */
export function adotta(id, nome = '') {
  const def = petDi(id)
  if (!def || haAnimale(id) || !postiLiberi() || state.profile.coins < def.costo) return false
  state.profile.coins -= def.costo
  state.profile.pets[id] = nuovoAnimale(Date.now(), String(nome || '').trim() || def.nome)
  state.profile.casa.push(id)
  controllaTraguardi()
  persist()
  flush()          // si adotta di rado e si paga: non deve perdersi
  return true
}

/* Riprenderlo dal rifugio: costa la quota, non il prezzo pieno, e torna
   con tutto quello che era suo — il nome, i pasti serviti, il cappello. */
export function riprendi(id) {
  if (!haAnimale(id) || inCasa(id) || !postiLiberi()) return false
  const quota = quotaRientro(id)
  if (state.profile.coins < quota) return false
  state.profile.coins -= quota
  curato(state.profile.pets[id])
  state.profile.casa.push(id)
  controllaTraguardi()
  persist()
  flush()
  return true
}

/* Salutarlo: esce dalla cameretta e va al rifugio. Non si cancella
   niente — non esiste un gesto che butti via un animale — e infatti
   questa funzione non chiede conferme: quella la chiede la schermata. */
export function mandaAlRifugio(id) {
  const i = (state.profile.casa || []).indexOf(id)
  if (i < 0) return false
  state.profile.casa.splice(i, 1)
  persist()
  flush()
  return true
}

/* Il gesto vero, quando i quattro posti sono pieni: uno saluta e uno
   arriva, e si controlla PRIMA che il nuovo sia davvero pagabile.
   Altrimenti basterebbe non avere abbastanza monete per ritrovarsi con
   un animale in meno e nessuno al suo posto. */
export function sostituisci(esce, entra, nome = '') {
  if (!inCasa(esce) || esce === entra) return false
  const nuovo = !haAnimale(entra)
  const def = petDi(entra)
  if (!def || (!nuovo && inCasa(entra))) return false
  const prezzo = nuovo ? def.costo : quotaRientro(entra)
  if (state.profile.coins < prezzo) return false
  mandaAlRifugio(esce)
  return nuovo ? adotta(entra, nome) : riprendi(entra)
}

/* Cambiare nome è come per i giocatori: si tocca un'etichetta, non si
   sposta un byte di progressi. */
export function rinominaAnimale(id, nome) {
  const a = state.profile.pets[id]
  const pulito = String(nome || '').trim().slice(0, 14)
  if (!a || !pulito) return false
  a.nome = pulito
  persist()
  flush()
  return true
}

export function compraProdotto(e) {
  const c = prodottoDi(e)
  if (!c || state.profile.coins < c.costo) return false
  state.profile.coins -= c.costo
  state.profile.dispensa[e] = (state.profile.dispensa[e] || 0) + 1
  persist()
  return true
}

export const inDispensa = e => state.profile.dispensa[e] || 0
export const dispensaPiena = () => PRODOTTI.some(c => inDispensa(c.e) > 0)
export const dispensaDi = k =>
  PRODOTTI.filter(c => c.bisogno === k && inDispensa(c.e) > 0)

/* Quello che si ha in casa per un bisogno, diviso in due: cosa a lui
   piace e cosa non mangerebbe mai. La scheda le mostra tutte e due —
   spente le seconde — perché scoprire che al pesce non piace la carne è
   metà del gioco, e nasconderle vorrebbe dire non insegnarlo. */
export const dispensaPer = (id, k) => {
  const tutte = dispensaDi(k)
  return { si: tutte.filter(c => gradimento(id, c.e) !== 'no'),
           no: tutte.filter(c => gradimento(id, c.e) === 'no') }
}

/* Usa un prodotto su un animale: cibo, gioco, spazzola o vitamina, è
   sempre lo stesso gesto su una barra diversa.
   Torna 'preferito' | 'ok' | 'pieno' | 'no' | false.
   A barra piena, e davanti a qualcosa che non gli piace, il prodotto NON
   viene consumato: sprecare qualcosa pagato con le monete sarebbe una
   punizione per una distrazione — o peggio, per non sapere ancora cosa
   mangia un pappagallo. */
export function usa(id, e) {
  const a = state.profile.pets[id], c = prodottoDi(e)
  if (!a || !c || inDispensa(e) <= 0) return false
  const piace = gradimento(id, e)
  if (piace === 'no') return 'no'
  const adesso = bisogno(id, c.bisogno)
  if (adesso >= SOGLIE.pieno) return 'pieno'
  const pref = piace === 'ama'
  state.profile.dispensa[e]--
  if (!state.profile.dispensa[e]) delete state.profile.dispensa[e]
  a.val[c.bisogno] = Math.min(100, adesso + c.dona * (pref ? PREFERITO : 1))
  a.t[c.bisogno] = Date.now()
  const t = state.profile.totals
  if (c.bisogno === 'fame') { a.pasti = (a.pasti || 0) + 1; t.pasti = (t.pasti || 0) + 1 }
  else t.cure = (t.cure || 0) + 1
  if (pref) t.preferiti = (t.preferiti || 0) + 1
  controllaTraguardi()
  persist()
  return pref ? 'preferito' : 'ok'
}

/* ═══════════ la macchina delle sorprese ═══════════
   Una capsula per volta, dalla serie a cui si è arrivati, e mai un
   doppione: esce sempre qualcosa che non si ha. La prima è offerta dalla
   casa, perché una macchina di cui non hai visto l'effetto non la provi. */
export const serieOra = () => SERIE[Math.min(state.profile.serie || 0, SERIE.length - 1)]
export const finite = () => (state.profile.serie || 0) >= SERIE.length
export const miePezzi = s => (s.pezzi || []).filter(p => state.profile.accessori.includes(p.e))
export const costoCapsula = () =>
  (state.profile.totals.capsule ? serieOra().costo : 0)

export function apriCapsula(rnd = Math.random) {
  const p = state.profile
  if (finite()) return false
  const s = serieOra()
  const resta = mancanti(s, p.accessori)
  if (!resta.length) return false
  const costo = costoCapsula()
  if (p.coins < costo) return false
  p.coins -= costo
  const pezzo = estrai(resta, rnd)
  p.accessori.push(pezzo.e)
  p.totals.capsule = (p.totals.capsule || 0) + 1
  // finita la serie si apre la successiva: è lì che il prezzo sale
  if (!mancanti(s, p.accessori).length) p.serie = (p.serie || 0) + 1
  controllaTraguardi()
  // persist accoda, flush scrive subito: una capsula si apre di rado e si
  // paga, non deve perdersi se la scheda si chiude nel terzo di secondo dopo
  persist()
  flush()
  return pezzo
}

export const serieComplete = () => Math.min(state.profile.serie || 0, SERIE.length)

/* Vestire e svestire: un accessorio per posto, e lo stesso pezzo non può
   stare addosso a due animali insieme — è uno solo. */
export function indossa(id, e) {
  const a = state.profile.pets[id]
  const posto = postoDi(e)
  if (!a || !posto || !state.profile.accessori.includes(e)) return false
  for (const altro of Object.values(state.profile.pets))
    if (altro.addosso && altro.addosso[posto] === e) delete altro.addosso[posto]
  a.addosso[posto] = e
  controllaTraguardi()
  persist()
  return true
}

export function togli(id, posto) {
  const a = state.profile.pets[id]
  if (!a || !a.addosso[posto]) return false
  delete a.addosso[posto]
  persist()
  return true
}

/* le mensole devono contenere esattamente gli oggetti posseduti */
export function fixLayout() {
  const p = state.profile
  if (!Array.isArray(p.layout) || p.layout.length !== 3) p.layout = [[], [], []]
  p.layout = p.layout.map(r => (Array.isArray(r) ? r.filter(e => p.owned.includes(e)) : []))
  const placed = new Set(p.layout.flat())
  for (const e of p.owned) {
    if (placed.has(e)) continue
    p.layout.reduce((a, b) => (b.length < a.length ? b : a)).push(e)
    placed.add(e)
  }
}

export function moveItem(fromRow, fromCol, toRow, toIndex) {
  const L = state.profile.layout
  const [e] = L[fromRow].splice(fromCol, 1)
  if (e == null) return
  let idx = toIndex
  if (toRow === fromRow && idx > fromCol) idx--
  L[toRow].splice(Math.max(0, Math.min(idx, L[toRow].length)), 0, e)
  persist()
}

export { backend }

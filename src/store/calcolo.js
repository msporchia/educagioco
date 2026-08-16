/* ═══════════════════════════════════════════════════════════════════
   IL GESTORE DEL CALCOLO A MENTE — chi decide cosa chiedere, e quanto
   grande.

   Il motore (`store/srs.js`) sa una cosa sola: quanto è forte un
   elemento, e quando va ripassato. Non sa che per fare 4×23 bisogna
   prima sapere 4×20, e che chi non ha ancora in mano gli amici del dieci
   non deve vedersi arrivare 27+38. Quel pezzo sta qui: un grafo di
   PREREQUISITI, e tre risposte che il gioco chiede in continuazione.

     · questo concetto è APERTO?  → i suoi prerequisiti reggono adesso
     · su cosa si lavora?         → la FRONTIERA, cioè quello che è
                                    aperto ma non ancora consolidato
     · quanto grandi i numeri?    → la TAGLIA, dalla forza del concetto

   Due conseguenze che valgono più di tutto il resto:

   1. LE TABELLINE SONO NEL GRAFO. `spezza-prodotto` (4×23) non si apre
      finché quattro tabelline non reggono davvero. Le due campagne degli
      asteroidi non stanno una accanto all'altra: si tengono per mano.
   2. NIENTE È VINTO PER SEMPRE. La forza usata qui è quella EFFICACE, che
      cala da sola col passare dei giorni. Un concetto lasciato lì torna
      in frontiera, e con lui tornano le domande. È il motivo per cui
      questo gioco non si «finisce».

   Come `store/progressi.js`, questo file non importa il profilo: riceve
   `items` e basta. Così gira anche fuori dal browser, nei test unitari,
   e non crea cicli di import.
   ═══════════════════════════════════════════════════════════════════ */
import { strength, overdue, activeSet, SRS } from './srs.js'
import { CONCETTI, CONCETTI_PER_ID, STAZIONI, chiaviDi, eConcettoDiFatti,
         concettoDiChiave, chiaveConcetto, esercizioDi, faticaFatto, famigliaFatto,
         eFatto, appartiene } from '../data/calcolo.js'
import { calcoliTabellina } from '../data/tabelline.js'

/* «regge» non vuol dire «perfetto»: si chiede un gradino meno della
   padronanza piena, altrimenti mezza campagna resterebbe chiusa per un
   ripasso saltato di un giorno */
export const SALDO = SRS.masterS - 1

const VUOTO = { s: 0, ok: 0, err: 0, last: 0, seen: 0, t: 0 }
export const leggi = (items, k) => (items && items[k]) || VUOTO

/* ═══════════ quanto è forte un concetto ═══════════
   Per i concetti a istanze infinite è la forza del loro elemento. Per
   quelli fatti di fatti è la MEDIA dei suoi fatti: chi sa nove somme su
   dieci non sa «le somme fino a dieci», ma è molto più avanti di chi non
   ne sa nessuna, e il numero deve dirlo. */
export function forzaDi(id, items, now = Date.now()) {
  const c = CONCETTI_PER_ID[id]
  if (!c) return 0
  if (!eConcettoDiFatti(c)) return strength(leggi(items, chiaveConcetto(id)), now)
  const ks = chiaviDi(id)
  return ks.reduce((s, k) => s + strength(leggi(items, k), now), 0) / ks.length
}

export const saldo = (id, items, now = Date.now()) => forzaDi(id, items, now) >= SALDO

/* ═══════════ le tabelline che reggono ═══════════
   Non si pretende la stella (tutti e dieci i calcoli imparati): basta che
   la tabellina stia in piedi. Serve a decidere se moltiplicare a mente ha
   senso, non a dare una medaglia. */
export function tabellineSalde(items, now = Date.now()) {
  const out = []
  for (let n = 2; n <= 10; n++) {
    const ks = calcoliTabellina(n)
    const media = ks.reduce((s, k) => s + strength(leggi(items, k), now), 0) / ks.length
    if (media >= SALDO) out.push(n)
  }
  return out
}

/* ═══════════ il grafo ═══════════ */
export function prereqDeboli(id, items, now = Date.now()) {
  const c = CONCETTI_PER_ID[id]
  if (!c) return []
  return (c.prereq || []).filter(p => !saldo(p, items, now))
}

export function aperto(id, items, now = Date.now(), tabelline = null) {
  const c = CONCETTI_PER_ID[id]
  if (!c) return false
  if (prereqDeboli(id, items, now).length) return false
  const quante = c.tabelline || 0
  if (!quante) return true
  return (tabelline || tabellineSalde(items, now)).length >= quante
}

/* i concetti su cui si lavora adesso: aperti e non ancora consolidati */
export function frontiera(items, now = Date.now()) {
  const tab = tabellineSalde(items, now)
  return CONCETTI.filter(c => aperto(c.id, items, now, tab) && !saldo(c.id, items, now))
                 .map(c => c.id)
}

/* profondità nel grafo: quanti passi di prerequisiti ci sono sotto. È
   l'ordine naturale con cui i concetti entrano in lavorazione. */
const PROFONDITA = (() => {
  const p = {}
  const calcola = (id, visti = new Set()) => {
    if (p[id] != null) return p[id]
    if (visti.has(id)) return 0                  // un ciclo non deve bloccare il gioco
    visti.add(id)
    const c = CONCETTI_PER_ID[id]
    const sotto = (c.prereq || []).map(x => calcola(x, visti))
    return (p[id] = sotto.length ? Math.max(...sotto) + 1 : 0)
  }
  CONCETTI.forEach(c => calcola(c.id))
  return p
})()
export const profonditaDi = id => PROFONDITA[id] ?? 0

/* ═══════════ la taglia: quanto grandi i numeri ═══════════
   Zero appena il concetto si apre, uno quando è consolidato. È il terzo
   asse della difficoltà, quello che manca alle scalette fisse del
   castello: dentro `somma-riporto` non c'è un ultimo esercizio. */
export function tagliaDi(id, items, now = Date.now()) {
  return Math.max(0, Math.min(1, forzaDi(id, items, now) / SRS.masterS))
}

/* il contesto che serve ai generatori: la taglia del concetto e le
   tabelline su cui può appoggiarsi */
export function contestoDi(id, items, now = Date.now(), tabelline = null) {
  return { taglia: tagliaDi(id, items, now),
           tabelline: tabelline || tabellineSalde(items, now) }
}

export function esercizioDaChiave(chiave, items, now = Date.now(), tabelline = null) {
  return esercizioDi(chiave, contestoDi(concettoDiChiave(chiave), items, now, tabelline))
}

/* ═══════════ IL POOL DI UNA SESSIONE ═══════════
   Stessa forma del pool dei pianeti in `views/MathGame.vue`: per più di
   metà i concetti nuovi della stazione, il resto ripasso di quelli di
   prima, più gli scaduti da rivedere.

   Con una differenza che è tutto il senso del grafo: se un PREREQUISITO
   di un concetto nuovo si è indebolito, entra lui nel pool al posto del
   concetto. Chi ha dimenticato gli amici del dieci non deve sbattere la
   testa su 27+38: deve rifare gli amici del dieci, e poi tornare. */
function chiaviDei(ids) {
  return [...new Set(ids.flatMap(id => chiaviDi(id)))]
}

export function poolDi(stazione, items, now = Date.now(), quanti = 12) {
  const tab = tabellineSalde(items, now)
  const suoi = stazione.nuovi.length ? stazione.nuovi : stazione.concetti
  const apribili = suoi.filter(id => aperto(id, items, now, tab))
  // i puntelli che sono venuti giù: entrano nel pool insieme ai concetti
  // della tappa, non al loro posto
  const puntelli = [...new Set(suoi.flatMap(id => prereqDeboli(id, items, now)))]
  /* Una stazione aperta è sempre giocabile. Il grafo serve a DOSARE — cosa
     entra prima, cosa si ripassa — non a sbarrare: se i prerequisiti non
     reggono ancora, i concetti della tappa restano comunque il suo cuore e
     i puntelli si ripassano accanto. Senza questo il bersaglio delle
     risposte mirate non si raggiungeva mai e la tappa diventava un muro. */
  const nuovi = apribili.length ? apribili : suoi
  const vecchi = stazione.concetti.filter(id => !nuovi.includes(id) &&
                                                aperto(id, items, now, tab))

  const getItem = k => leggi(items, k)
  const ordine = k => {
    const id = concettoDiChiave(k)
    // tre criteri in fila, ognuno più fine del precedente: prima quello che
    // sta in fondo al grafo, poi quello che si sa meno, e a pari merito il
    // fatto che costa meno — altrimenti si passa una partita a sommare uno
    return profonditaDi(id) * 10 + (4 - Math.min(4, strength(getItem(k), now)))
           + faticaFatto(k)
  }
  /* il giro non è solo fra concetti ma fra le famiglie dentro ognuno:
     dieci fatti presi dal concetto più facile sarebbero dieci volte lo
     stesso addendo, e un bambino se ne accorge prima di noi */
  const gruppi = k => [concettoDiChiave(k) + '/' + (eFatto(k) ? famigliaFatto(k) : '')]

  /* Tre insiemi con la loro quota, e non uno solo: mescolandoli i puntelli
     — che stanno più in basso nel grafo, quindi «prima» — si prendevano
     tutti i posti e i concetti della tappa non uscivano mai. */
  const vuoto = { learning: [], due: [] }
  const A = activeSet(chiaviDei(nuovi), getItem, ordine, now,
                      Math.max(4, Math.round(quanti * 0.55)), gruppi)
  /* IL RIPASSO SI MISURA SU QUANTO PORTA LA TAPPA, non su quanti posti
     restano liberi. Un concetto a istanze infinite è UNA chiave che vale
     infinite domande, mentre i fatti già visti sono centinaia: dando al
     ripasso «tutto quello che avanza», un pool da dodici veniva su con
     undici sottrazioni entro il dieci e una sola domanda del concetto
     nuovo. Il bersaglio delle mirate non saliva, la tappa non finiva, e si
     passavano mesi a rifare 3−2 dentro una stazione che si chiama «Passa
     la decina». Adesso il resto del pool non supera mai la parte nuova:
     metà di quello che arriva è la cosa che la tappa è venuta a insegnare. */
  const porta = A.learning.length || 1
  const P = puntelli.length
    ? activeSet(chiaviDei(puntelli), getItem, ordine, now,
                Math.max(1, Math.min(Math.round(quanti * 0.2),
                                     Math.ceil(porta / 2))), gruppi)
    : vuoto
  const B = activeSet(chiaviDei(vecchi), getItem, ordine, now,
                      Math.max(1, Math.min(Math.round(quanti * 0.3),
                                           porta - P.learning.length)), gruppi)
  const scaduti = [...A.due, ...P.due, ...B.due]
    .sort((x, y) => overdue(getItem(y), now) - overdue(getItem(x), now))
    .slice(0, Math.max(1, Math.min(4, Math.round(porta / 2))))

  let pool = [...new Set([...A.learning, ...P.learning, ...B.learning, ...scaduti])]
  // stazione già consolidata e rigiocata: i suoi concetti restano il cuore
  // della tappa, altrimenti sparirebbe proprio quello che è venuta a fare
  if (!A.learning.length) pool = [...new Set([...chiaviDei(nuovi), ...pool])]
  return pool.length ? pool : chiaviDei(stazione.concetti)
}

/* ═══════════ LA MISCELA DI UNA PARTITA ═══════════
   Il pool dice COSA può uscire, questa dice OGNI QUANTO. Sono due cose
   diverse e le confondevamo: un pool per metà fatto di ripasso non dà
   metà domande di ripasso, ne dà molte di più, perché il picker pesca
   pesato e quello che si sa male pesa tanto. Il risultato era una tappa
   del 6 in cui il 6 si vedeva ogni tanto, in mezzo a un ripasso continuo
   di tutto il resto — un ripasso *giusto*, ma non è quella la tappa.

   Otto domande su dieci parlano della tappa; le altre due sono il
   ripasso, che serve e non deve sparire. Si sceglie prima da quale delle
   due parti pescare, e solo dopo si lascia decidere al motore chi, dentro
   quella parte, ha più bisogno di uscire. */
export const QUOTA_TAPPA = 0.8

export function sottoPool(pool, eSuo, sorte = Math.random, quota = QUOTA_TAPPA) {
  const suoi = pool.filter(eSuo)
  const resto = pool.filter(k => !eSuo(k))
  // se una delle due parti è vuota non c'è niente da dosare: chi c'è, c'è
  if (!suoi.length || !resto.length) return pool
  return sorte() < quota ? suoi : resto
}

/* ═══════════ LA QUOTA HA MEMORIA ═══════════
   `sottoPool` da solo è una monetina lanciata a ogni domanda, e una
   monetina non promette niente su nessun tratto della partita: al pianeta
   del 10 sono uscite sei domande di fila che non erano la tabellina del
   10. Il pool ci aveva la sua parte di colpa (`store/tabelline.js`), ma
   il resto è tutto qui: «otto su dieci in media» non vuol dire otto su
   dieci *adesso*, e in una partita da trenta domande una fila del genere
   capita a un bambino su trenta — che passa un minuto intero a giocare
   un pianeta diverso da quello che ha scelto.

   La miscela tiene la memoria corta di quello che è uscito e, quando la
   finestra ha già speso tutto il suo ripasso, obbliga la tappa a parlare.
   Il caso resta — la partita non diventa un ciclo prevedibile — ma il
   tetto è duro: mai più di `fuoriMax` domande fuori tappa ogni
   `finestra`, quindi mai due di fila.

   Il BOSS conta come una domanda fuori tappa, perché lo è: arriva dalla
   tappa dopo. Prima non lo contava nessuno e la quota promessa era una
   frazione più bassa di quella misurata. */
export const FINESTRA = 5

export function creaMiscela(quota = QUOTA_TAPPA, finestra = FINESTRA) {
  const fuoriMax = Math.max(1, finestra - Math.ceil(finestra * quota))
  let ultime = []          // true = era della tappa

  return {
    /* da quale parte del pool si pesca adesso. `precedente` è la domanda
       appena fatta: una parte con una chiave sola, e per giunta quella,
       costringerebbe a ripetere la stessa domanda — si passa all'altra */
    parte(pool, eSuo, precedente = null, sorte = Math.random) {
      const gia = ultime.filter(x => !x).length
      const scelta = sottoPool(pool, eSuo, gia >= fuoriMax ? () => 0 : sorte, quota)
      if (scelta.length !== 1 || scelta[0] !== precedente) return scelta
      const altra = pool.filter(k => !scelta.includes(k))
      return altra.length ? altra : pool
    },
    /* cosa è poi uscito davvero, boss compreso */
    segna(dellaTappa) {
      ultime.push(!!dellaTappa)
      if (ultime.length > finestra) ultime.shift()
    },
    azzera() { ultime = [] },
    get fuoriMax() { return fuoriMax },
  }
}

/* una risposta «mirata» è quella sui concetti nuovi della stazione: è la
   seconda barra del bersaglio, come le tabelline del pianeta */
export const eNuovo = (stazione, chiave) =>
  stazione.nuovi.some(id => appartiene(id, chiave))

/* la stella della stazione: tutti i suoi concetti nuovi reggono adesso.
   Non si conquista una volta per sempre — se si smette di ripassare
   torna indietro, come la stella di una tabellina. */
export const stellaDi = (stazione, items, now = Date.now()) =>
  stazione.nuovi.length
    ? stazione.nuovi.every(id => saldo(id, items, now))
    : CONCETTI.every(c => saldo(c.id, items, now))

/* quanti concetti reggono adesso: il numero che l'albo mostra e che i
   traguardi contano */
export const concettiSaldi = (items, now = Date.now()) =>
  CONCETTI.filter(c => saldo(c.id, items, now)).length

/* Allinea la campagna delle stazioni a quello che il bambino già sa: chi
   arriva qui dopo mesi di tabelline non deve rifare 3+4 per venti
   partite. Apre le tappe, non le regala — superarle, e prendersi le
   monete, resta da fare. Stessa scelta di `allineaMate`. */
export function allineaCalcolo(p, now = Date.now()) {
  if (!p.calc) p.calc = { tappa: 0, libera: false }
  const items = p.items || {}
  let t = 0
  while (t < STAZIONI.length && STAZIONI[t].nuovi.length &&
         STAZIONI[t].nuovi.every(id => saldo(id, items, now))) t++
  p.calc.tappa = Math.max(p.calc.tappa || 0, t)
  return p.calc
}

// Il gestore del calcolo a mente: il grafo dei prerequisiti (concetto
// APERTO?), la FRONTIERA (aperto ma non consolidato) e la TAGLIA (quanto
// grandi i numeri) — vedi docs/asteroidi/scaletta.md. Come store/progressi.js,
// non importa il profilo: riceve `items` e basta, per girare nei test.
import { strength, overdue, activeSet, SRS } from './srs.js'
import { CONCETTI, CONCETTI_PER_ID, STAZIONI, chiaviDi, eConcettoDiFatti,
         concettoDiChiave, chiaveConcetto, esercizioDi, faticaFatto, famigliaFatto,
         eFatto, appartiene } from '../data/calcolo.js'
import { mareaCalcolo } from './marea.js'
import { calcoliTabellina } from '../data/tabelline.js'

// «regge» non è «perfetto»: un gradino meno della padronanza piena, se no
// mezza campagna resterebbe chiusa per un ripasso saltato di un giorno
export const SALDO = SRS.masterS - 1

const VUOTO = { s: 0, ok: 0, err: 0, last: 0, seen: 0, t: 0 }
export const leggi = (items, k) => (items && items[k]) || VUOTO

// Un concetto a istanze infinite: la forza del suo elemento. Un concetto
// fatto di fatti: la media dei suoi fatti (nove somme su dieci contano).
export function forzaDi(id, items, now = Date.now()) {
  const c = CONCETTI_PER_ID[id]
  if (!c) return 0
  if (!eConcettoDiFatti(c)) return strength(leggi(items, chiaveConcetto(id)), now)
  const ks = chiaviDi(id)
  return ks.reduce((s, k) => s + strength(leggi(items, k), now), 0) / ks.length
}

export const saldo = (id, items, now = Date.now()) => forzaDi(id, items, now) >= SALDO

// Non pretende la stella (tutti e dieci i calcoli imparati): basta che la
// tabellina stia in piedi, per decidere se il calcolo a mente ha senso.
export function tabellineSalde(items, now = Date.now()) {
  const out = []
  for (let n = 2; n <= 10; n++) {
    const ks = calcoliTabellina(n)
    const media = ks.reduce((s, k) => s + strength(leggi(items, k), now), 0) / ks.length
    if (media >= SALDO) out.push(n)
  }
  return out
}

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

// zero appena il concetto si apre, uno quando è consolidato
export function tagliaDi(id, items, now = Date.now()) {
  return Math.max(0, Math.min(1, forzaDi(id, items, now) / SRS.masterS))
}

// Nelle tappe la taglia è quella della forza; nel volo infinito la dice il
// livello (`tagliaDelVolo` in store/volo.js), passato in `opzioni.taglia`
// come parametro e non come globale — vedi docs/asteroidi/volo.md.
export function contestoDi(id, items, now = Date.now(), { tabelline = null, taglia = null } = {}) {
  return { taglia: taglia ?? tagliaDi(id, items, now),
           tabelline: tabelline || tabellineSalde(items, now) }
}

export function esercizioDaChiave(chiave, items, now = Date.now(), opzioni = {}) {
  return esercizioDi(chiave, contestoDi(concettoDiChiave(chiave), items, now, opzioni))
}

// Il pool di una sessione: i concetti nuovi della stazione, il ripasso di
// quelli di prima, gli scaduti — e i prerequisiti indeboliti al posto del
// concetto nuovo (chi ha dimenticato gli amici del dieci rifà quelli,
// prima di tornare a 27+38). Vedi docs/asteroidi/scaletta.md.
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
  // il grafo dosa, non sbarra: se i prerequisiti non reggono, i concetti
  // della tappa restano comunque il cuore del pool
  const nuovi = apribili.length ? apribili : suoi
  const vecchi = stazione.concetti.filter(id => !nuovi.includes(id) &&
                                                aperto(id, items, now, tab))

  const getItem = k => leggi(items, k)
  // la marea (store/marea.js) passa dai tre insiemi, dagli scaduti e
  // dall'ordine, non dal grafo: i prerequisiti diretti stanno troppo
  // vicino perché la marea si senta lì
  const marea = mareaCalcolo(items, now)
  const ordine = k => {
    const id = concettoDiChiave(k)
    // in fondo al grafo prima, poi chi si sa meno, a pari merito il fatto
    // che costa meno da tenere a mente
    return profonditaDi(id) * 10 + (4 - Math.min(4, strength(getItem(k), now, marea(k))))
           + faticaFatto(k)
  }
  // il giro è anche fra le famiglie dentro un concetto, non solo fra concetti
  // (dieci fatti dello stesso addendo si notano)
  const gruppi = k => [concettoDiChiave(k) + '/' + (eFatto(k) ? famigliaFatto(k) : '')]

  // tre insiemi con la loro quota: mescolati, i puntelli (più in basso nel
  // grafo) prenderebbero tutti i posti
  const vuoto = { learning: [], due: [] }
  const A = activeSet(chiaviDei(nuovi), getItem, ordine, now,
                      Math.max(4, Math.round(quanti * 0.55)), gruppi, marea)
  // il ripasso non supera mai la parte nuova (docs/asteroidi/scaletta.md)
  const porta = A.learning.length || 1
  const P = puntelli.length
    ? activeSet(chiaviDei(puntelli), getItem, ordine, now,
                Math.max(1, Math.min(Math.round(quanti * 0.2),
                                     Math.ceil(porta / 2))), gruppi, marea)
    : vuoto
  const B = activeSet(chiaviDei(vecchi), getItem, ordine, now,
                      Math.max(1, Math.min(Math.round(quanti * 0.3),
                                           porta - P.learning.length)), gruppi, marea)
  const scaduti = [...A.due, ...P.due, ...B.due]
    .sort((x, y) => overdue(getItem(y), now, marea(y)) - overdue(getItem(x), now, marea(x)))
    .slice(0, Math.max(1, Math.min(4, Math.round(porta / 2))))

  let pool = [...new Set([...A.learning, ...P.learning, ...B.learning, ...scaduti])]
  // stazione già consolidata e rigiocata: i suoi concetti restano il cuore
  // della tappa, altrimenti sparirebbe proprio quello che è venuta a fare
  if (!A.learning.length) pool = [...new Set([...chiaviDei(nuovi), ...pool])]
  return pool.length ? pool : chiaviDei(stazione.concetti)
}

// Il pool dice COSA può uscire, questa dice OGNI QUANTO — sono due cose
// diverse: un pool per metà ripasso darebbe molte più di metà domande di
// ripasso, perché il picker pesca pesato. Si sceglie prima da quale parte
// pescare, solo dopo chi dentro quella parte ha più bisogno (docs/asteroidi/scaletta.md).
export const QUOTA_TAPPA = 0.8

export function sottoPool(pool, eSuo, sorte = Math.random, quota = QUOTA_TAPPA) {
  const suoi = pool.filter(eSuo)
  const resto = pool.filter(k => !eSuo(k))
  // se una delle due parti è vuota non c'è niente da dosare: chi c'è, c'è
  if (!suoi.length || !resto.length) return pool
  return sorte() < quota ? suoi : resto
}

// `sottoPool` da solo è una monetina a ogni domanda, e non promette niente
// su un tratto di partita: la miscela tiene la memoria corta di quello che
// è uscito e obbliga la tappa a parlare quando la finestra ha già speso
// tutto il suo ripasso (mai più di `fuoriMax` fuori tappa ogni `finestra`).
// Il boss conta come fuori tappa, perché lo è. Vedi docs/asteroidi/scaletta.md.
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

// Allinea la campagna delle stazioni a quello che il bambino già sa (apre
// le tappe, non le regala). Scrive `p.calc.tappa`, che dalla fila unica in
// poi è uno specchio: sincronizzaAsteroidi (store/profile.js) lo porta nel
// vero contatore, `mate.fila`.
export function allineaCalcolo(p, now = Date.now()) {
  if (!p.calc) p.calc = { tappa: 0, libera: false }
  const items = p.items || {}
  let t = 0
  while (t < STAZIONI.length && STAZIONI[t].nuovi.length &&
         STAZIONI[t].nuovi.every(id => saldo(id, items, now))) t++
  p.calc.tappa = Math.max(p.calc.tappa || 0, t)
  return p.calc
}

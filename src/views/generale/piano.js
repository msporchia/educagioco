/* ═══════════════════════════════════════════════════════════════════
   IL PIANO DI UN'UNITÀ — come si tiene in piedi, senza schermo

   Qui non c'è Vue e non c'è un pixel: solo liste di ordini e il modo
   di ritrovarci dentro una voce. Stava dentro `GeneraleGame.vue`, ed
   era logica pura travestita da vista — per provarla bisognava aprire
   Chrome, e quindi non la provava nessuno. È la stessa mossa che il
   progetto ha già fatto con `motore/battaglia.js` e `store/calcolo.js`.

   ── LA FORMA DI UN PIANO ─────────────────────────────────────────
   Un'unità non ha UNA lista: ha il piano che parte all'inizio, e poi
   tanti piani PARALLELI quanti sono i segnali che ascolta. Sono tutti
   nella stessa fila, e si distinguono dal verbo:

       [ {vai, chiave}, {apri, porta},              ← il main
         {quando, ora, allora:[…]} ]                ← un piano parallelo

   Dentro, due cose sole annidano, e per un dito solo:
     · `quando senti`, che ha la sua lista in `allora`;
     · il BLOCCO CONDIZIONE, che ha due rami — `vero` e `falso` — e
       dentro ognuno un'altra lista piatta.

   ── VIE E PERCORSI ───────────────────────────────────────────────
   Una VIA è il cammino per ritrovare una voce:

       [3]                il quarto ordine del main
       [3, 1]             il secondo ordine dentro il «quando» che sta a 3
       [3, 'vero', 0]     il primo ordine del ramo del vero del bivio a 3
       [2, 1, 'falso', 0] lo stesso, dentro il «quando» che sta a 2

   un PERCORSO è la stessa cosa senza l'ultimo passo: indica una LISTA
   invece di una voce. Un passo che è una parola («vero», «falso») entra
   in un ramo; un passo che è un numero entra in una voce.

   Tutte le funzioni qui dentro prendono `ordini` — la fila di
   un'unità — come primo argomento, e quelle che cambiano qualcosa la
   cambiano sul posto: il piano è un oggetto reattivo che appartiene
   alla vista, e restituirne una copia vorrebbe dire riattaccarla a
   mano ogni volta.
   ═══════════════════════════════════════════════════════════════════ */
import { eBlocco, dentroA } from '../../motore/generale.js'
import { conIPrezzi, RAGIONA, INDIZIO, PEZZO, FORMA, SVELA } from '../../giochi/aiuti.js'

/* due vie sono la stessa via? */
export const stessaVia = (a, b) =>
  !!a && !!b && a.length === b.length && a.every((x, i) => x === b[i])

/* un percorso che finisce con una parola sta dentro un ramo: è lì che
   la decisione non si può più annidare */
export const inRamo = perc => typeof perc[perc.length - 1] === 'string'

/* il ramo come lista viva su cui si può spingere: se non c'è, si crea —
   un ramo vuoto è legittimo, un ramo che non esiste no */
function ramoVivo (o, r) {
  if (!Array.isArray(o[r])) o[r] = []
  return o[r]
}

/* la lista che sta in fondo a un percorso, o `null` se il percorso non
   porta più da nessuna parte (un blocco buttato, un'unità cambiata) */
export function listaIn (ordini, perc) {
  let l = ordini, k = 0
  while (k < perc.length && l) {
    const o = l[perc[k]]
    if (!o) return null
    if (typeof perc[k + 1] === 'string') { l = ramoVivo(o, perc[k + 1]); k += 2 }
    else { if (!o.allora) o.allora = []; l = o.allora; k += 1 }
  }
  return l || null
}

/* la lista che CONTIENE la voce in fondo a una via */
export const listaDi = (ordini, via) => listaIn(ordini, via.slice(0, -1)) || []
/* e la voce stessa */
export const ordineIn = (ordini, via) => listaDi(ordini, via)[via[via.length - 1]]

/* ── il main e i piani paralleli ──
   Prima stavano tutti in fila nella stessa colonna, e un «quando senti»
   in mezzo alla sequenza si leggeva come l'ordine numero tre invece che
   come un secondo programma. Si separano, ma **gli indici restano
   quelli veri**: la via di una voce non cambia perché a schermo sta
   altrove. */
const conIndice = ordini => (ordini || []).map((o, i) => ({ o, i }))
const eRoutine = o => !!o && o.blocco === 'routine'
/* tre pile, e si distinguono guardando la voce: quello che parte
   all'inizio, quello che parte a un segnale, e quello che parte solo se
   qualcuno lo chiama. Gli indici restano quelli veri anche qui. */
export const partiDaCapo = ordini =>
  conIndice(ordini).filter(x => x.o.verbo !== 'quando' && !eRoutine(x.o))
export const partiParallele = ordini => conIndice(ordini).filter(x => x.o.verbo === 'quando')
export const partiChiamate = ordini => conIndice(ordini).filter(x => eRoutine(x.o))

/* il nome della prossima azione: il primo numero libero, così
   cancellarne una in mezzo non fa nascere due «azione 3» */
export function nomeLibero (ordini) {
  const presi = new Set(partiChiamate(ordini).map(x => x.o.nome))
  for (let n = 1; ; n++) if (!presi.has(`azione ${n}`)) return `azione ${n}`
}

/* ── aggiungere ──
   Torna la via della voce appena nata, che è quello che serve a chi
   deve aprirla o mirarne il bersaglio.

   UN «QUANDO SENTI» NON STA MAI DENTRO NIENTE. È un piano che parte da
   capo quando arriva il suo segnale: sta accanto agli altri, non
   dentro. Prima, se eri dentro un blocco e ne aggiungevi un secondo,
   finiva annidato nel primo — e i piani paralleli diventavano una
   matriosca invece che due strade. */
export function aggiungiIn (ordini, perc, o) {
  /* un «quando senti» e un'AZIONE non stanno mai dentro niente: sono
     piani che partono per conto loro — uno a un segnale, l'altro
     quando lo chiami — e stanno accanto alla fila, non dentro. */
  if (o.verbo === 'quando') {
    if (!o.allora) o.allora = []
    /* di regola nasce in cima al piano: è un programma a parte, non un
       ordine. L'eccezione è il corpo di un'AZIONE — lì un ascolto vuol
       dire «da quando arrivo qui, sto anche in ascolto di questo», e
       spostarlo in cima cambierebbe quello che dice. */
    const l = perc.length === 2 && perc[1] === 'corpo' ? listaIn(ordini, perc) : null
    if (l) { l.push(o); return [...perc, l.length - 1] }
    ordini.push(o)
    return [ordini.length - 1]
  }
  if (o.blocco === 'routine') {
    if (!o.corpo) o.corpo = []
    ordini.push(o)
    return [ordini.length - 1]
  }
  if (o.blocco === 'routine') {
    if (!o.corpo) o.corpo = []
    ordini.push(o)
    return [ordini.length - 1]
  }
  const l = listaIn(ordini, perc) || ordini
  l.push(o)
  const dove = listaIn(ordini, perc) ? perc : []
  return [...dove, l.length - 1]
}

/* togliere. Torna il percorso della lista da cui la voce è sparita:
   serve a chi stava scrivendo lì dentro per sapere dove ricade. */
export function togliIn (ordini, via) {
  listaDi(ordini, via).splice(via[via.length - 1], 1)
  return via.slice(0, -1)
}

/* spostare di un posto su o giù, dentro la sua lista e basta: un ordine
   non esce dalla fila in cui sta. Torna la via nuova. */
export function spostaIn (ordini, via, d) {
  const l = listaDi(ordini, via), i = via[via.length - 1]
  if (i + d < 0 || i + d >= l.length) return via
  l.splice(i + d, 0, l.splice(i, 1)[0])
  return [...via.slice(0, -1), i + d]
}

/* ═══════════ la scala degli aiuti ═══════════
   Gli ultimi tre gradini non sono parole: sono ordini che compaiono nel
   piano. Il dato c'è già ed è quello che il banco di prova gioca per
   davvero — `liv.soluzioni` — quindi qui non si scrive nessuna
   soluzione a mano, e non ce n'è nessuna che possa diventare stantia:
   se una soluzione dichiarata smettesse di vincere, il banco lo direbbe
   prima che qualcuno la veda a schermo.

   ── QUALE SOLUZIONE ──
   La STRETTA: quella che non è né fragile (che è lì per cadere) né
   lunga (che è lì per far vedere che la strada lunga si può fare). È la
   stessa che il banco tiene senza ordini di troppo. */
export const laSoluzione = liv =>
  ((liv && liv.soluzioni) || []).find(s => !s.fragile && !s.lunga) || null

/* ── LA SCALA, GRADINO PER GRADINO ──
   Quello che il livello dichiara in `aiuti` non è ancora una scala: è
   una lista mista di stringhe (i livelli scritti prima), gradini a
   parole e gradini che scrivono nel piano. Qui diventa una lista sola,
   ordinata, dove ogni voce sa **cosa fa**, **quanto costa** e — se
   scrive — **cosa scrive**: il gioco non deve sapere niente di come è
   stata composta.

   I gradini sono quelli di tutti i giochi che si sbloccano pensando
   (`giochi/aiuti.js`), e qui si chiamano come li scrive un livello:

     ragiona  gratis   `aiuto.ragiona('…')`: cosa chiede il livello, e la
                       domanda giusta da farsi
     dice     🪙10     `aiuto.dice('…')`, o una stringa: un indizio
     scrive   ┐        `aiuto.scrive({ unità: [ordini] }, '…')`: un pezzo
     forma    ├ 🪙50 · 100 · 200 — la struttura, coi bersagli da trovare
     svela    ┘        tutto il piano

   ── QUELLO CHE SI AGGIUNGE DA SÉ ──
   Dove c'è una soluzione dichiarata, in fondo ci sono sempre la forma e
   la soluzione: se il livello non le scrive, si aggiungono — la forma
   prima della soluzione, la soluzione in fondo. La via d'uscita esiste
   sempre, e non dipende dal fatto che l'autore ci abbia pensato.
   A un livello che non dichiara **nessun** gradino che scrive si
   aggiunge anche il pezzo: **la prima metà di ogni fila** della
   soluzione (le file di un ordine solo restano fuori: la metà di un
   ordine non c'è). Chi dichiara anche solo `aiuto.forma()` ha deciso lui
   i suoi gradini, e il pezzo di serie non glieli cambia — serve dove la
   metà della soluzione sarebbe già tutta la lezione («Due strade»: la
   prima metà è il bivio). Vengono tutti dalla soluzione — quella che il
   banco di prova gioca a ogni build — quindi non c'è nessuna seconda
   soluzione da tenere aggiornata.

   ── LA FORMA NON RIPRENDE QUELLO CHE HAI GIÀ PAGATO ──
   La forma svuota i bersagli; ma gli ordini che un pezzo comprato prima
   ha già scritto uguali alla soluzione restano interi. Senza, i
   cinquanta pagati per il pezzo sparirebbero sotto le caselle vuote
   della forma, e un gradino più caro darebbe meno di quello prima. */
const CHE = { ragiona: RAGIONA, dice: INDIZIO, scrive: PEZZO, forma: FORMA, svela: SVELA }
const copia = x => JSON.parse(JSON.stringify(x))

export function scalaDi (liv) {
  const grezzi = (liv && liv.aiuti) || []
  /* copie, e non i gradini del livello: qui ci si attacca il piano da
     scrivere, e il dato del livello non si tocca */
  const passi = grezzi.map(a => (typeof a === 'string' ? { aiuto: 'dice', testo: a } : { ...a }))
    .filter(a => a && CHE[a.aiuto])
  const s = laSoluzione(liv)
  if (s) {
    const ha = k => passi.some(a => a.aiuto === k)
    const prima = k => { const i = passi.findIndex(a => k.includes(a.aiuto)); return i < 0 ? passi.length : i }
    if (!ha('scrive') && !ha('forma') && !ha('svela')) {
      const meta = primaMeta(s.piano)
      if (meta) passi.push({ aiuto: 'scrive', piano: meta })
    }
    if (!ha('forma')) passi.splice(prima(['svela']), 0, { aiuto: 'forma' })
    if (!ha('svela')) passi.push({ aiuto: 'svela' })

    /* ogni gradino che scrive si porta dietro il suo piano, già fatto */
    let dati = {}
    for (const a of passi) {
      if (a.aiuto === 'scrive') { a.piano = copia(a.piano || {}); dati = { ...dati, ...a.piano } }
      else if (a.aiuto === 'forma') a.piano = formaCon(s.piano, dati)
      else if (a.aiuto === 'svela') a.piano = copia(s.piano)
    }
    /* una forma che non lascia niente da trovare è la soluzione con un
       altro nome, e la si pagherebbe due volte */
    const sol = JSON.stringify(s.piano)
    for (let i = passi.length - 1; i >= 0; i--)
      if (passi[i].aiuto === 'forma' && JSON.stringify(passi[i].piano) === sol) passi.splice(i, 1)
  }
  return conIPrezzi(passi.map(a => ({ ...a, che: CHE[a.aiuto] })))
}

/* ── IL PEZZO DI SERIE ──
   La prima metà di ogni fila della soluzione, arrotondata **per
   difetto**: un inizio che funziona, e il resto da trovare. Per eccesso,
   in un piano di tre ordini il pezzo ne scriveva due e alla forma — che
   costa il doppio — restava da aggiungere una casella sola. Le file di
   un ordine solo restano fuori (la loro metà non c'è), e se non ne resta
   nessuna il pezzo non c'è: `null`. */
export function primaMeta (piano) {
  const out = {}
  for (const id in piano) {
    const l = piano[id] || []
    if (l.length >= 2) out[id] = copia(l.slice(0, Math.floor(l.length / 2)))
  }
  return Object.keys(out).length ? out : null
}

/* ── LA FORMA, SENZA TOGLIERE QUELLO CHE C'ERA ──
   La forma di tutta la soluzione, ma in ogni fila gli ordini che un
   pezzo già dato ha scritto uguali a quelli della soluzione restano
   interi. Uno per uno: un ordine del pezzo ne tiene intero **uno** della
   soluzione (il primo uguale non ancora preso), così due «vai al carro»
   nella soluzione e uno nel pezzo non ne svelano due. */
export function formaCon (soluzione, dati = {}) {
  const forma = soloLaForma(soluzione)
  const out = {}
  for (const id in soluzione) {
    const tutto = soluzione[id] || []
    const dati_ = (dati[id] || []).map(o => JSON.stringify(o))
    out[id] = tutto.map((o, i) => {
      const k = dati_.indexOf(JSON.stringify(o))
      if (k < 0) return forma[id][i]
      dati_.splice(k, 1)
      return copia(o)
    })
  }
  return out
}

/* ── SOLO LA FORMA ──
   Il gradino di mezzo: **quali ordini, e in che disposizione**, ma non
   su cosa valgono. Restano i verbi, i due rami di un bivio, il corpo di
   un ciclo — cioè la parte che a sei anni è difficile immaginare da
   zero — e spariscono tutti i bersagli e tutte le domande, che sono la
   parte che si trova guardando la mappa. A schermo diventa un piano
   fatto di caselle tratteggiate: `vai a [＋ dove]`, e il posto giusto
   dove metterle è già segnato.

   Sparisce anche il nome dell'AZIONE? No: quello lo sceglie il gioco e
   non c'è niente da indovinare — riscriverlo sarebbe un compito di
   copiatura. */
export function soloLaForma (piano) {
  const forma = o => {
    if (!o || typeof o !== 'object') return o
    if (o.blocco === 'condizione')
      return { blocco: 'condizione', cond: {},
               vero: (o.vero || []).map(forma), falso: (o.falso || []).map(forma) }
    if (o.blocco === 'ripeti')
      return { blocco: 'ripeti', corpo: (o.corpo || []).map(forma), finche: {} }
    if (o.blocco === 'routine')
      return { blocco: 'routine', nome: o.nome, corpo: (o.corpo || []).map(forma) }
    if (o.verbo === 'quando')
      return { verbo: 'quando', complemento: null, allora: (o.allora || []).map(forma) }
    /* un ordine: resta il verbo, se ne va quello su cui vale. Chi vuole
       una domanda (`aspetta che …`) la perde come tutti gli altri. */
    const q = { verbo: o.verbo, complemento: null }
    if (o.cond) q.cond = {}
    if (o.finche) q.finche = {}
    return q
  }
  const out = {}
  for (const id in piano) out[id] = (piano[id] || []).map(forma)
  return out
}

/* ── camminare su tutto il piano ──
   Ogni voce, dovunque stia: dentro un ramo, dentro un ascolto, dentro
   un ramo dentro un ascolto. Serve a contare, a cercare i buchi e a
   sapere se in un piano c'è qualcosa di avanzato. */
export function ogniVoce (lista) {
  const out = []
  const giro = l => (l || []).forEach(o => {
    out.push(o)
    if (eBlocco(o)) { dentroA(o).forEach(giro); return }
    giro(o.allora)
  })
  giro(lista)
  return out
}

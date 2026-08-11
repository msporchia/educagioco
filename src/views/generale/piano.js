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

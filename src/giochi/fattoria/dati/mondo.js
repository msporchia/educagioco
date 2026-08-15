/* ═══════════════════════════════════════════════════════════════════
   LE MISURE DELLA FATTORIA

   Dato puro: nessuna funzione che gioca, nessun `import` di motore o di
   Vue. Qui stanno i numeri che tutto il resto dà per scontati, e stanno
   qui perché quando erano sparsi cambiare la dimensione di una cella
   voleva dire cercarla in sei file.

   ── L'UNITÀ È LA CELLA, NON IL PIXEL ─────────────────────────────
   Il mondo si misura in **celle**. Un pixel dipende dallo zoom, e lo
   zoom cambia mentre si gioca: se le posizioni fossero in pixel,
   stringere le dita vorrebbe dire riscalare ogni cosa in scena, e prima
   o poi una resterebbe indietro. In cella non c'è niente da riscalare.

   Chi disegna moltiplica per `SCALA` all'ultimo momento, e la scala è
   **un numero intero**: a scala 2,3 la pixel art fa dei pixel larghi due
   e altri tre, e da vicino si vede.
   ═══════════════════════════════════════════════════════════════════ */

export const T = 16                    // la tessera dell'atlante, in pixel
export const CELLE = 6                 // celle per lato di una piazzola
export const PIAZZOLE = 7              // piazzole per lato del mondo
export const CELLE_MONDO = CELLE * PIAZZOLE

export const SCALA_MIN = 1
export const SCALA_MAX = 5
export const SCALA_INIZIALE = 2

/* Le piazzole che si hanno il primo giorno: un quadrato in mezzo, così
   il bosco è **intorno** e si può crescere in tutte le direzioni. Una
   fattoria in un angolo cresce solo verso due lati, e senza accorgersene
   si smette di guardare gli altri due. */
export const PRIMA = 2
export const ULTIMA = 4
export const PIAZZOLE_INIZIALI = (ULTIMA - PRIMA + 1) ** 2

/* ── i prezzi ──────────────────────────────────────────────────────
   Il pezzo di terra rincara a ogni acquisto, e il rincaro è quello che
   dà un ritmo: i primi due si comprano quasi subito, il decimo è una
   sera intera di esercizi. Senza rincaro la mappa si riempie in un
   pomeriggio e non resta più niente da desiderare. */
export const PREZZO_PIAZZOLA = 45
export const RINCARO = 1.38

export function prezzoPiazzola(quante) {
  const oltre = Math.max(0, quante - PIAZZOLE_INIZIALI)
  return Math.round(PREZZO_PIAZZOLA * Math.pow(RINCARO, oltre))
}

/* Spostare costa una monetina. Non serve a fare cassa: serve perché
   questo posto resti la *ricompensa* per gli esercizi fatti altrove, e
   non un tavolino dove si passa il pomeriggio a spostare avanti e
   indietro la stessa panchina. Rimettere una cosa esattamente dov'era è
   gratis, e chi è a zero non resta bloccato — la fattoria sta ferma
   finché non guadagna altre monete giocando. */
export const COSTO_SPOSTARE = 1

/* ── la sorte, senza sorte ─────────────────────────────────────────
   Dove nasce un albero nel bosco non si tira a caso ogni volta: si
   ricava dalle coordinate. Così la stessa fattoria, riaperta domani o
   su un altro telefono, ha il bosco identico — e un test può dire
   «alla cella 14,9 c'è un masso» e restare vero. */
export function caso(x, y, sale) {
  let n = (x * 73856093) ^ (y * 19349663) ^ (sale * 83492791)
  n = (n ^ (n >>> 13)) * 1274126177
  n ^= n >>> 16
  return ((n >>> 0) % 100000) / 100000
}

/* Quanto è fitto il bosco. Più alto e il primo pezzo comprato è pieno di
   roba da sgombrare (cioè di monete); più basso ed è un prato vuoto. */
export const DENSITA_BOSCO = 0.24

export const chiave = (x, y) => x + ',' + y

export function guastiDelMondo() {
  const g = []
  if (PRIMA < 0 || ULTIMA >= PIAZZOLE) g.push('le piazzole iniziali stanno fuori dal mondo')
  if (PRIMA > ULTIMA) g.push('PRIMA viene dopo ULTIMA')
  if (SCALA_INIZIALE < SCALA_MIN || SCALA_INIZIALE > SCALA_MAX)
    g.push('la scala iniziale sta fuori dai limiti dello zoom')
  if (RINCARO <= 1) g.push('senza rincaro la mappa si compra tutta in un pomeriggio')
  if (DENSITA_BOSCO <= 0 || DENSITA_BOSCO >= 1) g.push('densità del bosco impossibile')
  /* il caso deve essere stabile: è tutta la ragione per cui esiste */
  if (caso(3, 4, 1) !== caso(3, 4, 1)) g.push('caso() non è stabile')
  if (caso(3, 4, 1) === caso(4, 3, 1)) g.push('caso() non distingue x da y')
  return g
}

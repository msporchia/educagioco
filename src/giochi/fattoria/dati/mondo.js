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

/* ── QUANTO È GRANDE IL MONDO: NON UN NUMERO, UNA REGOLA ───────────
   C'era `PIAZZOLE = 7`, e voleva dire due cose insieme: «quanto si può
   comprare» e «dove finisce la mappa». Chi comprava tutto arrivava al
   bordo e lì il gioco smetteva di crescere, senza dirlo.

   La regola nuova non è un numero e non è un mondo infinito: **attorno
   alla terra posseduta ci devono sempre essere almeno due piazzole da
   comprare**, su ogni lato. Comprandone una il margine si assottiglia,
   e il mondo si allarga di quel tanto che serve a rifarlo. Così non si
   arriva mai al bordo e non si paga il prezzo di un mondo senza fine:
   il bosco esiste solo dove qualcuno può vederlo.

   Il mondo **non si stringe mai**, nemmeno se il margine avanzasse:
   il bosco già generato sta in archivio cella per cella, e restringere
   vorrebbe dire buttarlo via e ritrovarselo diverso al giro dopo.

   Le coordinate **non si spostano**: crescendo verso l'alto o verso
   sinistra le piazzole prendono numeri negativi invece di far scalare
   tutte le altre. È la condizione perché il bosco — che si ricava dalle
   coordinate — resti dov'era: rinumerare vorrebbe dire spostare tutti
   gli alberi che il bambino ha già visto. Per questo qui si divide con
   `Math.floor` e mai con `| 0`, che verso lo zero tronca invece di
   arrotondare per difetto e sbaglia di una piazzola in tutto il
   quadrante negativo. */
export const MARGINE = 2

/* Il mondo di una fattoria appena nata: le tre piazzole di partenza più
   il margine. Fa 7×7, cioè esattamente il mondo fisso di prima — la
   regola nuova non sposta niente a chi comincia oggi. */
export const LIMITI_NUOVI = {
  x0: PRIMA - MARGINE, y0: PRIMA - MARGINE,
  x1: ULTIMA + MARGINE, y1: ULTIMA + MARGINE,
}

/* Quello che un salvataggio di ieri aveva senza scriverlo: il mondo era
   7×7 da 0 a 6, e il bosco era stato generato tutto lì dentro. Serve a
   sapere **fin dove il bosco esiste già** in una fattoria vecchia, per
   generare solo quello che manca invece di ridisegnarne uno nuovo
   sopra: sono numeri di storia, non si toccano se PRIMA o MARGINE
   cambiano. */
export const LIMITI_VECCHI = { x0: 0, y0: 0, x1: 6, y1: 6 }

/* In quale piazzola cade una cella. Una riga sola perché la sbagliavano
   in due posti diversi appena le coordinate diventavano negative. */
export const piazzolaDi = cella => Math.floor(cella / CELLE)

/* Il mondo che tiene dentro queste piazzole col margine giusto, senza
   mai stringere quello che c'era già (`base`). */
export function limitiPer(chiavi, base = null) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const k of chiavi) {
    const [x, y] = String(k).split(',').map(Number)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    x0 = Math.min(x0, x); y0 = Math.min(y0, y)
    x1 = Math.max(x1, x); y1 = Math.max(y1, y)
  }
  const l = Number.isFinite(x0)
    ? { x0: x0 - MARGINE, y0: y0 - MARGINE, x1: x1 + MARGINE, y1: y1 + MARGINE }
    : { ...LIMITI_NUOVI }
  if (!base) return l
  return { x0: Math.min(l.x0, base.x0), y0: Math.min(l.y0, base.y0),
           x1: Math.max(l.x1, base.x1), y1: Math.max(l.y1, base.y1) }
}

/* Le celle di un mondo, con la fine **esclusa** come in ogni ciclo che
   le percorre. */
export function celleDi(l) {
  return { cx0: l.x0 * CELLE, cy0: l.y0 * CELLE,
           cx1: (l.x1 + 1) * CELLE, cy1: (l.y1 + 1) * CELLE }
}

export const dentroI = (l, px, py) =>
  px >= l.x0 && px <= l.x1 && py >= l.y0 && py <= l.y1

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
  if (PRIMA > ULTIMA) g.push('PRIMA viene dopo ULTIMA')
  if (MARGINE < 1) g.push('senza margine si arriva subito al bordo del mondo')
  /* il mondo di partenza deve tenere dentro le piazzole di partenza col
     loro margine: se no si nasce già col bordo addosso */
  const l0 = limitiPer([chiave(PRIMA, PRIMA), chiave(ULTIMA, ULTIMA)])
  if (l0.x0 !== LIMITI_NUOVI.x0 || l0.x1 !== LIMITI_NUOVI.x1)
    g.push('LIMITI_NUOVI non è il mondo che la regola del margine darebbe')
  if (!dentroI(LIMITI_NUOVI, PRIMA - 1, PRIMA - 1) || !dentroI(LIMITI_NUOVI, ULTIMA + 1, ULTIMA + 1))
    g.push('le piazzole iniziali non hanno margine attorno')
  if (SCALA_INIZIALE < SCALA_MIN || SCALA_INIZIALE > SCALA_MAX)
    g.push('la scala iniziale sta fuori dai limiti dello zoom')
  if (RINCARO <= 1) g.push('senza rincaro la mappa si compra tutta in un pomeriggio')
  if (DENSITA_BOSCO <= 0 || DENSITA_BOSCO >= 1) g.push('densità del bosco impossibile')
  /* il caso deve essere stabile: è tutta la ragione per cui esiste */
  if (caso(3, 4, 1) !== caso(3, 4, 1)) g.push('caso() non è stabile')
  if (caso(3, 4, 1) === caso(4, 3, 1)) g.push('caso() non distingue x da y')
  return g
}

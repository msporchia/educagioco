/* ═══════════════════════════════════════════════════════════════════
   LE MISURE DEL SOTTERRANEO

   Quanto è grande una cella, cosa può esserci dentro, quanto è forte
   chi scende. Dato puro: nessuna funzione che gioca, nessun canvas.

   ── LA CELLA È DI SEDICI PIXEL, E NON È UN NUMERO NOSTRO ──────────
   È la misura del foglio di tessere (0x72, «16×16 DungeonTileset II»).
   Cambiare set vuol dire cambiare questo numero **e** la geometria dei
   muri in `scena/tela.js`, che è l'unico altro posto che sa come è
   fatta una parete.

   ── LO ZOOM È A NUMERI INTERI ─────────────────────────────────────
   A scala 2,3 i pixel verrebbero larghi due e altri tre, e da vicino si
   vede. Si parte da 3: a 2 si vedeva mezzo piano per volta e la stanza
   attorno si leggeva come una piantina — e una piantina ce l'abbiamo
   già in alto a destra, che è il suo posto.
   ═══════════════════════════════════════════════════════════════════ */

export const T = 16                               // la tessera, in pixel
export const SCALA_MIN = 2, SCALA_MAX = 5, SCALA_INIZIALE = 3

/* Le celle del mondo. Roccia è tutto quello che non è stato scavato. */
export const ROCCIA = 0, PAVIMENTO = 1, PORTA = 2

/* ── com'è messo chi scende ──
   Vita, attacco e difesa di partenza. Non crescono con le tappe fatte:
   quello che si trova vale **dentro una discesa** e non oltre — vedi il
   commento in testa a `campagna.js`, che è dove quella scelta è spiegata
   e dove si cambia se un giorno si vuole il contrario. */
export const EROE = { vita: 18, att: 3, dif: 1 }

/* Sei tasche, e sono un limite vero: quando sono piene, quello che c'è
   per terra resta per terra e va scelto cosa lasciare. Le due caselle
   addosso (mano, corpo) non contano come tasche. */
export const TASCHE = 6

/* Quanto si vede. Il raggio è quello della torcia in mano; dentro una
   stanza si accende la stanza intera, perché entrarci vuol dire averla
   vista. Un sotterraneo tutto illuminato è una piantina, e su una
   piantina non c'è niente da esplorare. */
export const RAGGIO = 3.2, RAGGIO_TORCIA = 6.2

/* Chi corre più forte, e quanto dura la calma dopo una fuga. Il mostro
   è **più lento** apposta: scappare deve funzionare sempre, o la stanza
   è una trappola invece che una scelta. I tre secondi sono il tempo di
   uscire dalla stanza; senza, lo scontro si riaprirebbe nel fotogramma
   dopo e «scappo via» sarebbe un tasto che non fa niente. */
export const PASSO_EROE = 5.4, PASSO_MOSTRO = 3.1, PASSO_RIENTRO = 2.2
export const CALMA = 3

/* ── QUELLO CHE SI TOCCA E NON RISPONDE ───────────────────────────
   Barili, casse, ossa, bracieri: arredo, cioè cose che stanno lì per
   far sembrare che qui sotto ci abbia vissuto qualcuno. Il gioco lo sa
   già — non sono toccabili, e le cose vere hanno il filo di luce
   intorno — ma i bambini le toccano lo stesso e chiedono a cosa
   servono. La domanda è ragionevole: sono disegnate dallo stesso foglio
   di un forziere, e un filo dorato che respira piano è una convenzione
   che nessuno ha mai spiegato loro.

   Due risposte, e servono tutte e due. Il disegno le tiene **più
   spente** delle cose che rispondono (`scena/tela.js`), e toccandole si
   ottiene una riga che lo dice — la prima volta spiegando la regola,
   dopo con una battuta corta. Una cosa che non fa niente e non dice
   niente non si legge come «non fa niente»: si legge come rotta. */
/* I tre generi, e la differenza è **dove possono stare**: quello che si
   appende va contro la parete di fondo, quello che si posa su un bordo
   qualunque, il fuoco è l'unico che cambia quello che si vede. Sta qui
   e non in `motore/livello.js` perché è una tabella, e perché così
   `guastiDelMondo` può controllare che ognuno abbia la sua frase. */
export const ARREDI = {
  appeso: ['stendardo', 'candelabro'],
  posato: ['barile', 'cassa', 'ossa', 'teschio-scena'],
  fuoco: ['braciere', 'lanterna'],
}

export const ARREDO_DICE = {
  barile: 'Un barile vuoto.',
  cassa: 'Una cassa sfondata: dentro non c\'è più niente.',
  ossa: 'Vecchie ossa. Meglio non chiedersi di chi.',
  'teschio-scena': 'Un teschio. Ti guarda male e basta.',
  braciere: 'Un braciere acceso. Scalda, e fa luce.',
  lanterna: 'Una lanterna appesa. La luce ce l\'hai già.',
  stendardo: 'Uno stendardo scolorito, di nessuno.',
  candelabro: 'Un candelabro con tre candele storte.',
}
/* La prima volta la riga spiega la regola invece di fare la battuta:
   è l'unico momento in cui un bambino la sta cercando davvero. */
export const ARREDO_LA_PRIMA_VOLTA =
  'Quello che si può toccare ha la luce intorno. Questo no: è arredamento.'

/* Quanto ridà una fonte, e quanto si recupera scendendo di un piano. */
export const SORSO = 8, RIPOSO_SCALA = 4, VITA_PER_PIANO = 2

export function guastiDelMondo() {
  const g = []
  if (SCALA_MIN >= SCALA_MAX) g.push('lo zoom non ha spazio fra minimo e massimo')
  if (SCALA_INIZIALE < SCALA_MIN || SCALA_INIZIALE > SCALA_MAX)
    g.push('la scala iniziale sta fuori dai suoi estremi')
  if (PASSO_MOSTRO >= PASSO_EROE)
    g.push('i mostri corrono quanto o più dell\'eroe: scappare non funziona più')
  if (TASCHE < 3) g.push('meno di tre tasche: lo zaino non è una scelta, è un intoppo')
  if (RAGGIO_TORCIA <= RAGGIO) g.push('la torcia non fa vedere più lontano')
  /* un arredo senza la sua frase si tocca e non risponde, che è
     esattamente il difetto che le frasi esistono per togliere */
  for (const quali of Object.values(ARREDI))
    for (const k of quali)
      if (!ARREDO_DICE[k]) g.push(`l'arredo "${k}" non dice niente a chi lo tocca`)
  return g
}

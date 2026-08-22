/* ═══════════════════════════════════════════════════════════════════
   LA POSTA DEI GRANDI — cosa è cambiato, e cosa conviene guardare

   Questo gioco arriva a delle famiglie senza passare da un negozio, e
   non c'è nessun canale per dire a un genitore che una cosa è cambiata:
   niente server, niente indirizzo di posta, e chi l'ha ricevuto da
   un'altra famiglia non lo conosce nessuno. Dirlo a voce funziona
   finché i bambini sono due.

   NON È UN CHANGELOG, ed è la regola che tiene questo file corto:

     una nota si scrive **solo se il genitore potrebbe voler fare
     qualcosa**. Se non finisce con un tasto che porta da qualche parte,
     o non riguarda i salvataggi, non è una nota.

   Uno sprite nuovo, un guasto riparato, un gioco che si aggiunge già
   acceso: non sono note. Diluiscono le tre che contano e insegnano a
   ignorare il pallino. Ne escono tre o quattro l'anno, ed è giusto così.

   COME ARRIVA A DESTINAZIONE. Il grande in questa pagina non ci entra
   mai da solo, quindi il richiamo sta fuori: un nastro in home che parla
   al **bambino** e gli chiede di chiamare un grande (`guide/Nastri.vue`)
   e un pallino sul tasto delle impostazioni. Nessuno dei due si può
   chiudere: l'unica uscita è leggere, e leggere vuole il codice. Un
   cartello con la ✕ lo chiuderebbe il bambino per riflesso, e chiudere
   *è* l'ack — l'informazione sarebbe persa senza che nessuno lo sappia.

   ── IL FORMATO ──
   - `id`      progressivo, non si riusa mai: è quello che si ricorda
               come «letto fin qui» (`store/posta.js`). Una nota
               ritirata si toglie dall'elenco, e l'id resta bruciato.
   - `quando`  la data, in chiaro: «l'ho letta a marzo» è come si orienta
               chi ne trova tre in fila.
   - `titolo`  una riga. Cosa è cambiato, non come si chiama la modifica.
   - `testo`   due o tre righe. Il grassetto si scrive `**così**` — qui
               dentro non ci va HTML, come in `guide/contenuti.js`.
   - `azione`  facoltativa: `{ scheda, testo }`. Il tasto che porta dove
               si fa la cosa. È quello che un changelog non fa: non
               descrive la modifica, mette davanti alla manopola.
   - `riguarda` facoltativa: `{ etaDa, etaA }`. La nota compare solo se
               in casa c'è un bambino di quell'età. Serve a poter dire
               «tuo figlio» invece di «gli utenti»: se non riguarda
               nessuno, il pallino non si accende affatto.
   ═══════════════════════════════════════════════════════════════════ */
/* ── L'ELENCO È VUOTO, ED È LO STATO NORMALE ──
   Fra una notizia e l'altra qui non c'è niente da dire, e va bene così:
   ne escono tre o quattro l'anno. Con l'elenco vuoto il pallino non si
   accende, il nastro in home non compare e la posta resta zitta — il
   meccanismo è tutto in piedi (`store/posta.js`, `guide/Nastri.vue`,
   la scheda dei grandi) e aspetta la prossima.

   Le note qui sotto sono state scritte e ritirate: restano commentate
   perché **gli id non si riusano mai**, nemmeno ritirando una nota. La
   prossima è la 4, se no chi le ha già lette se le ritrova davanti.

   ── CHI DECIDE COSA È UNA NOTIZIA ─────────────────────────────────
   Il proprietario del gioco, e nessun altro. La regola scritta qui
   sopra — «solo se il genitore potrebbe voler fare qualcosa» — dice
   cosa **non** è una nota, non basta a dire cosa lo è: una schermata
   nuova la supera senza problemi, e il pallino si accenderebbe a ogni
   pubblicazione. Chi lavora al codice aggiunge il pezzo e lascia questo
   elenco com'è; la nota si scrive quando viene chiesta.

  {
    id: 1,
    quando: '2026-08-19',
    titolo: 'Il codice di questa schermata si può recuperare',
    testo: 'Se lo dimentichi, il tastierino adesso ha un **«Non ricordi il codice?»** '
         + 'che lo rimette a 0000 rispondendo a una domanda — senza toccare i progressi. '
         + 'Vuol dire che sceglierne uno vero non è più un rischio: se è ancora 0000, '
         + 'questa schermata la apre chiunque provi la combinazione più ovvia del mondo.',
    azione: { scheda: 'bambini', testo: 'Vai al codice' }
  },
  {
    id: 2,
    quando: '2026-08-19',
    titolo: 'Cancellare i progressi non è più per sempre',
    testo: 'Prima di cancellare i progressi di un bambino — o di eliminarlo — il gioco '
         + 'ne mette da parte una copia, e in fondo a **Progressi** c\'è il tasto per '
         + 'rimetterla. Ne tiene le ultime tre. Resta comunque una buona idea salvare '
         + 'su file ogni tanto: le copie stanno sullo stesso telefono.'
  },
  {
    id: 3,
    quando: '2026-08-22',
    titolo: 'C\'è una scheda nuova: «Come va»',
    testo: 'Dice quanto ha giocato e come gli vanno le domande, e da lì si '
         + 'possono provare, spostare o togliere.',
    azione: { scheda: 'comeva', testo: 'Guarda com\'è andata' }
  }
*/
export const NOTE = [
]

/* L'ultimo id **bruciato**: chi installa il gioco oggi parte da qui e
   non dalla prima nota — nessuno deve ricevere in faccia la storia del
   progetto al primo avvio.

   Il conto parte da 3 e non da zero perché tre note sono state scritte
   e ritirate: si contano lo stesso, se no la prossima riprenderebbe un
   id già letto e chi l'ha letto se la ritroverebbe davanti. */
const RITIRATE = 3
export const ULTIMA = NOTE.reduce((m, n) => Math.max(m, n.id), RITIRATE)

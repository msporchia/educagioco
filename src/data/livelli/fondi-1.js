/* ═══════════════════════════════════════════════════════════════════
   🏮 LA LANTERNA DEI FONDI — capitolo 1: 📦 IL MAGAZZINO

   LA STORIA CHE METTE IN SCENA. La lanterna dei Fondi sta in magazzino
   da vent'anni e la latta dell'olio è nell'altra stanza. Sotto, nella
   miniera, il buio è pieno di roba: senza lanterna non si scende. Solo
   che il magazzino non è vuoto: c'è **Fosco**, che ci lavora da
   sempre, e la prima cosa che fa quando vede qualcuno in giro è
   rimettere a posto la roba — cioè chiudere la lanterna nel cassone,
   ed è finita lì.

   IL CONCETTO: LA FILA. Un piano è una fila di ordini, letti dal primo
   all'ultimo. Camminare Tilde lo sa fare da sé (`prendi` ci va di suo,
   anche dall'altra parte della miniera), quindi l'unico modo di
   sbagliare è **dimenticarsi una cosa** oppure **metterle nell'ordine
   sbagliato**: la lanterna prima, perché è quella che Fosco va a
   riporre; l'olio dopo, che non lo vuole nessuno.

   E LA FILA NON BASTA. Se Tilde parte per conto suo, per quanto bene
   sia scritta la sua fila, Fosco la vede arrivare da lontano e la
   lanterna finisce nel cassone prima che lei ci arrivi. Serve che in
   quel momento **stia succedendo qualcos'altro da un'altra parte**:
   Orso è grosso e non sa camminare piano, e appena si trova Fosco
   davanti fa un fracasso che si sente in tutta la miniera. Fosco molla
   il suo angolo e va a vedere — è scritto nella sua scheda, `accorre`
   — e quello è tutto il tempo che Tilde ha. Perciò lei non parte:
   **aspetta di sentire il fracasso**. Due cose, nello stesso istante,
   in due posti diversi.

   FORMA DELL'OBIETTIVO: *presa*. Alla fine le due cose devono essere
   addosso a Tilde. Dove finisce, non conta.

   CHI FA COSA (`sa:`, e non è una regola in più: è la ragione per cui
   sono in due). Tilde prende e ascolta, ma non fa rumore. Orso non
   raccoglie niente — ha le mani come badili — e sa fare una cosa sola:
   camminare, che qui è la cosa che conta.

   EREDITA: niente, è il primo capitolo.
   LASCIA: **la lanterna**, accesa e con l'olio pieno, addosso a Tilde,
   e l'imbocco del pozzo, che nel capitolo 2 è l'unica via per scendere.

   LA MAPPA (30×18). Tre stanze in fila sotto il paese — il magazzino,
   la sala delle casse, il ripostiglio dell'olio — cucite in due modi:
   il **cunicolo** che le attraversa dritte (la strettoia è la casella
   della frana) e la **galleria dei carrelli** che gira sotto per tutta
   la lunghezza, con i tre pozzi di servizio. Nella terza scena il
   cunicolo è franato e si passa solo di sotto: le distanze cambiano
   tutte, e un piano che si regge sui passi contati casca.
   ═══════════════════════════════════════════════════════════════════ */

/* le stesse scorciatoie dei livelli del Generale: un ordine è
   verbo + complemento, e basta */
const o = (verbo, complemento) => ({ verbo, complemento })
const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })
const ha = (chi, complemento) => ({ cond: 'hai', chi, complemento })

/* La miniera sotto il paese, 30 colonne per 18 righe.
     y1-y6   le tre stanze: magazzino (x1-8), casse (x12-18),
             ripostiglio (x22-28)
     y3      il cunicolo che le infila tutte e tre; a x20 c'è la frana
     y7-y8   il vecchio deposito (x1-2): un angolo morto che si apre
             sul magazzino
     y7-y13  i tre pozzi di servizio (x4, x15, x25)
     y14     la galleria dei carrelli, da un capo all'altro
     y15-16  la sala del pozzo (x1-4) e il deposito dei carrelli
             (x20-22): l'una porta ai Fondi, l'altro non porta da
             nessuna parte */
const MINIERA = [
  '##############################',
  '#........###.......###.......#',
  '#........###.......###.......#',
  '#.............###............#',
  '#........###.......###.......#',
  '#........###.......###.......#',
  '#........###.......###.......#',
  '#..#.##########.#########.####',
  '#..#.##########.#########.####',
  '####.##########.#########.####',
  '####.##########.#########.####',
  '####.##########.#########.####',
  '####.##########.#########.####',
  '####.##########.#########.####',
  '#............................#',
  '#....###############...#######',
  '#....###############...#######',
  '##############################',
]

/* IL PIANO DI FOSCO, e si legge toccandolo. Non prende ordini dal
   bambino: sta nella sua fazione, e il capitolo si capisce leggendo
   queste due righe più la sua scheda.
     · dorme in piedi finché non gli passa davanti qualcuno;
     · appena lo vede, va a rimettere la lanterna nel cassone — e
       quella è la sconfitta, senza che nessuno meni a nessuno.
   Quello che NON è scritto qui sta nella scheda, perché non è una cosa
   che gli ha detto qualcuno: `accorre: fracasso` — se sente un
   fracasso molla tutto e va a vedere, poi torna a fare quello che
   stava facendo. È la porta che il piano di Tilde apre. */
const FOSCO = [
  { verbo: 'aspettaDiVedere', complemento: 'fondi' },
  o('prendi', 'lanterna'),
]

const FONDI_1 = {
  id: 'fondi-magazzino', nome: 'Il magazzino',
  storia: 'fondi', capitolo: 1, forma: 'presa',
  idea: 'Una fila per uno, e una parte quando l\'altra fa rumore',

  dritta: 'Un piano è <b>una fila di ordini</b>, letti dal primo all\'ultimo. Ma le file qui sono due, e non partono insieme: Tilde aspetta il <b>fracasso</b> di Orso, perché finché Fosco è al suo posto la lanterna non si tocca.',
  racconto: 'La lanterna dei Fondi sta in magazzino da vent\'anni, e la latta dell\'olio è nell\'altra stanza. Sotto non si scende senza. In magazzino però c\'è <b>Fosco</b>: appena vede qualcuno va a chiudere la lanterna nel cassone, e allora è finita. Orso è grosso e fa un <b>fracasso</b> che si sente da lontano: Fosco lascia il suo angolo e va a vedere. Si vince quando Tilde ha <b>la lanterna e l\'olio addosso</b> — e la lanterna va presa <b>per prima</b>.',
  aiuti: ['Tocca Fosco e leggi la sua scheda: quando sente un fracasso lascia il posto e va a vedere. Poi torna.',
          'Orso non raccoglie niente: sa solo camminare. Ma se si fa trovare davanti a Fosco, il fracasso parte da solo.',
          'Tilde non deve partire prima: metti i suoi ordini dentro un <b>quando senti [fracasso]</b>, e prendi la lanterna prima dell\'olio.'],

  griglia: MINIERA, ambiente: 'miniera',

  nomi: {
    lanterna: 'la lanterna', olio: 'la latta dell\'olio',
    catasta: 'la catasta', frana: 'la frana',
    fondi: 'i ladri dei Fondi', magazzino: 'il magazzino',
  },
  posti: {
    /* l'unico posto che si nomina: dove Orso va a farsi trovare. Cambia
       stanza a ogni scena, e la strada per arrivarci pure. */
    catasta: { x: 1, y: 8 },
  },
  /* la frana non è nominabile: sta sulla mappa, non in cassetta. Nel
     capitolo 1 non si apre niente. */
  porte: { frana: { x: 20, y: 3, aperta: true } },
  oggetti: [
    { nome: 'lanterna', em: '🏮', x: 1, y: 1 },
    /* l'olio si disegna con la botte: una latta non ce l'ha nessuno */
    { nome: 'olio', em: '🛢️', pittore: 'botte', x: 26, y: 4 },
  ],
  segnali: ['fracasso'],

  unita: [
    { id: 'tilde', nome: 'Tilde', fazione: 'fondi', emoji: '👵', chi: 'ladra',
      vista: 4, vita: 3, x: 11, y: 3, sa: ['vai', 'prendi', 'quando'] },
    /* Orso è grosso e non sa camminare piano: `grida` sta nella sua
       scheda, non in un ordine, perché non è una cosa che gli ha detto
       qualcuno — è come è fatto lui. Una volta sola, e quella volta è
       tutta la finestra che Tilde ha. */
    { id: 'orso', nome: 'Orso', fazione: 'fondi', emoji: '🐻', chi: 'orso',
      vista: 8, vita: 8, x: 16, y: 14, sa: ['vai'], grida: 'fracasso' },
    { id: 'fosco', nome: 'Fosco', fazione: 'magazzino', emoji: '🧹', chi: 'guardia',
      vista: 5, vita: 6, x: 3, y: 2, accorre: 'fracasso' },
  ],
  fazioni: {
    fondi: { nome: 'i nostri', autore: 'giocatore' },
    magazzino: { nome: 'il magazzino', autore: 'livello', ordini: { fosco: FOSCO } },
  },

  /* niente porte, niente celle: restano vai, prendi e l'ascolto */
  complementi: ['lanterna', 'olio', 'catasta', 'fracasso'],

  obiettivo: [ha('tilde', 'lanterna'), ha('tilde', 'olio')],
  /* si perde senza che nessuno tocchi nessuno: Fosco rimette a posto la
     roba, e la lanterna dei Fondi torna nel cassone */
  sconfitta: [ha('fosco', 'lanterna')],
  motivoSconfitta: 'Fosco ha rimesso la lanterna nel cassone: sotto non si scende più.',
  mostraNemici: true,

  /* ── LA SCENOGRAFIA ──
     Roba che sta lì e basta: **non è in gioco**. Non sta nel mondo (il
     motore non la carica nemmeno), non si prende, non si nomina in un
     ordine e non compare in nessun elenco di bersagli — è solo disegno,
     perché un magazzino vuoto non sembra un magazzino. Chi la sposta
     non cambia una virgola di quello che succede. */
  scenografia: [
    { che: 'cassa', x: 6, y: 1 }, { che: 'cassa', x: 7, y: 1 },
    { che: 'cassa', x: 7, y: 2 }, { che: 'sacco', x: 2, y: 6 },
    { che: 'sacco', x: 1, y: 4 }, { che: 'ragnatela', x: 1, y: 7, strato: -1 },
    { che: 'ossa', x: 2, y: 8 }, { che: 'scala', x: 8, y: 6, strato: -1 },
    { che: 'cassa', x: 12, y: 1 }, { che: 'cassa', x: 14, y: 1 },
    { che: 'cassa', x: 14, y: 2 }, { che: 'cassa', x: 18, y: 5 },
    { che: 'cartello', x: 12, y: 6 }, { che: 'fungo', x: 15, y: 11 },
    { che: 'botte', x: 23, y: 1 }, { che: 'botte', x: 24, y: 1 },
    { che: 'barile', x: 28, y: 5 }, { che: 'barile', x: 27, y: 6 },
    { che: 'cristallo', x: 25, y: 10 }, { che: 'stalagmite', x: 4, y: 11 },
    { che: 'binario', x: 10, y: 14, strato: -1 }, { che: 'binario', x: 11, y: 14, strato: -1 },
    { che: 'binario', x: 12, y: 14, strato: -1 }, { che: 'carrello', x: 21, y: 16 },
    { che: 'carrello', x: 22, y: 15 }, { che: 'pozzanghera', x: 3, y: 15, strato: -1 },
    { che: 'ragnatela', x: 20, y: 15, strato: -1 },
  ],

  /* Tre scene, tre stanze: cambia dove dorme Fosco, dove sta la
     lanterna, da dove arriva Orso e quanto è lunga la strada di Tilde.
     Nella terza il cunicolo è franato e si gira tutto di sotto. */
  varianti: [
    { nome: 'la lanterna sullo scaffale alto',
      oggetti: { lanterna: { x: 1, y: 1 }, olio: { x: 26, y: 4 } },
      posti: { catasta: { x: 4, y: 7 } },
      unita: { tilde: { x: 11, y: 3 }, orso: { x: 16, y: 14 }, fosco: { x: 3, y: 2 } } },
    /* qui la latta è a due passi dalla lanterna, e allora anche chi
       prende prima l'olio ce la fa: è la scena che salva il piano
       girato, e serve perché una tentazione che perde sempre non è una
       tentazione */
    { nome: 'la lanterna dietro le casse',
      oggetti: { lanterna: { x: 17, y: 1 }, olio: { x: 13, y: 1 } },
      posti: { catasta: { x: 15, y: 7 } },
      unita: { tilde: { x: 5, y: 3 }, orso: { x: 26, y: 14 }, fosco: { x: 16, y: 2 } } },
    { nome: 'il cunicolo è franato',
      porte: { frana: { aperta: false } },
      oggetti: { lanterna: { x: 1, y: 5 }, olio: { x: 26, y: 4 } },
      posti: { catasta: { x: 4, y: 10 } },
      unita: { tilde: { x: 13, y: 3 }, orso: { x: 26, y: 14 }, fosco: { x: 3, y: 5 } } },
  ],

  par: 4,
  soluzioni: [
    /* quattro ordini, ed è il par. Orso cammina e basta; Tilde non fa
       niente finché non sente il fracasso, e poi prende la lanterna per
       prima — l'olio non lo vuole nessuno, la lanterna sì. */
    { nome: 'Orso avanti, Tilde al fracasso', piano: {
      orso: [o('vai', 'catasta')],
      tilde: [quando('fracasso', o('prendi', 'lanterna'), o('prendi', 'olio'))],
    } },
    /* FRAGILE: l'olio per primo. È la stessa fila, girata, e la
       differenza è tutta lì: mentre Tilde va a prendere l'olio, Fosco
       è già tornato al suo angolo e la lanterna se l'è ripresa. Regge
       solo nella scena in cui la latta è a due passi dalla lanterna. */
    { nome: 'prima l\'olio', fragile: true, piano: {
      orso: [o('vai', 'catasta')],
      tilde: [quando('fracasso', o('prendi', 'olio'), o('prendi', 'lanterna'))],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ──
     Si dichiarano qui e le esegue il banco di prova dei livelli
     (`test/aiuto/livello.mjs`), dove è scritto anche il contratto. */
  verifiche: {
    /* la regola del capitolo: se si vince mandandoli avanti tutti e due
       insieme, ognuno per la sua strada, il livello non ha niente da
       insegnare. Tolto l'ascolto, Tilde parte subito e Fosco la vede
       arrivare. */
    nonInFila: true,
    /* e servono tutti e due: Orso da solo non raccoglie niente, Tilde
       da sola aspetta un fracasso che non arriva */
    serveOgnuno: true,
    /* la fila, adesso, ha un verso: la lanterna prima dell'olio */
    ordineConta: [['prendi lanterna', 'prendi olio']],
  },
}

export default FONDI_1
export { FONDI_1 }

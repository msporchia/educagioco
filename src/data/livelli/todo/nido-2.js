/* ═══════════════════════════════════════════════════════════════════
   🥚 IL NIDO DI BRASA — capitolo 2: «Contarli»
   forma: passaggio · concetto: la condizione (il blocco ❓, due rami)

   LA STORIA. Il primo ladro è tornato a valle e ha parlato: adesso
   sotto la parete c'è un accampamento, e prima di decidere qualunque
   cosa bisogna sapere **quanti sono**. Ci va Cenere, che è piccolo,
   nero e di notte non lo vede nessuno. E torna con qualcosa di meglio
   di un numero: **la mappa della parete**, quella che il capo tiene
   sotto il telo — da qui in poi il piano dei ladri si legge.

   EREDITA **la voce in paese** (sono venuti in sei proprio perché il
   primo ha raccontato). LASCIA **il conto**: la mappa al nido.

   COSA INSEGNA. Il blocco ❓ condizione, e la ragione per cui serve:
   **la scena non è sempre la stessa e il piano sì**. La sentinella
   sveglia stanotte sta di sopra, domani di sotto, e una fila di «vai»
   scritta a mano indovina una scena su tre. Il blocco guarda una volta
   sola, quando ci arriva, e da lì prende una delle due strade fino in
   fondo — quindi dentro un ramo ci sta **tutto il viaggio**, andata e
   ritorno: si decide una volta, all'imbocco, e poi non si torna più
   sulla decisione.

   E INSEGNA COSA VUOL DIRE VEDERE. Cenere non sa dov'è la sentinella:
   sa solo quello che ha davanti agli occhi. Dal ballatoio si vede il
   **bordo di sopra** e non quello di sotto, e da quell'unico pezzetto
   di verità si ricava tutto il resto: se la vedo è di sopra, e allora
   passo di sotto; se non la vedo è di sotto, e allora passo di sopra.

   LA STRADA CORTA È QUELLA CHE UCCIDE. `prendi` cammina da solo, e
   cammina per la via più breve: dal ballatoio alla mappa la via più
   breve è **la corsia del fuoco**, dove il capo sta sveglio a
   guardare. Perciò il ramo non contiene solo «prendi»: contiene prima
   il giro largo. È la prima volta in tutta la storia che un ordine che
   funziona da solo, da solo non basta.

   LA MAPPA (28×13). L'accampamento è un anello attorno alle tende: due
   giri esterni — **il bordo di sopra** e **il bordo di sotto** — e in
   mezzo **la corsia del fuoco**, che è la più corta e la sola dove c'è
   qualcuno di sveglio. I due giri si toccano solo alle due estremità.
   Sopra a levante scende la fessura del nido, e finisce sul ballatoio:
   è da lì che si guarda prima di scegliere.

   LE TRE SCENE. Cambia dove sta la sentinella sveglia (di sopra, di
   sotto, di sopra ma più avanti), dove dorme il capo e dov'è finita la
   mappa. Chi decide guardando vince tutte e tre; chi passa sempre
   dallo stesso bordo ne perde una — ed è la soluzione fragile qui in
   fondo.
   ═══════════════════════════════════════════════════════════════════ */

const o = (verbo, complemento) => ({ verbo, complemento })
const bivio = (cond, vero, falso) =>
  ({ blocco: 'condizione', cond, vero: vero || [], falso: falso || [] })
const vedi = complemento => ({ cond: 'vedi', complemento })
const nonVedi = complemento => ({ cond: 'vedi', complemento, non: true })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
const ha = (chi, complemento) => ({ cond: 'hai', chi, complemento })

function tela (w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('#')); return g }
function cava (g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = '.'
}
const stampa = g => g.map(r => r.join(''))

const ACCAMPAMENTO = (() => {
  const g = tela(28, 13)
  cava(g, 22, 1, 26, 1)      // la cornice del nido
  cava(g, 24, 1, 24, 5)      // la fessura che scende dal nido
  cava(g, 21, 5, 24, 5)      // il ballatoio: si guarda da qui
  cava(g, 21, 3, 21, 11)     // il giro di levante
  cava(g, 6, 3, 21, 3)       // il bordo di sopra
  cava(g, 6, 7, 21, 7)       // la corsia del fuoco: la più corta
  cava(g, 6, 11, 21, 11)     // il bordo di sotto
  cava(g, 6, 3, 6, 11)       // il giro di ponente
  return stampa(g)
})()

export const NIDO_2 = {
  id: 'nido-contarli', nome: 'Contarli',
  storia: 'nido', capitolo: 2, emoji: '❄️',
  idea: 'Si guarda una volta sola, e da lì si sceglie tutto il viaggio',
  forma: 'passaggio', concetto: 'condizione',
  eredita: ['voce'], lascia: ['conto'],

  dritta: "Dal ballatoio si vede <b>solo il bordo di sopra</b>. Se la sentinella è lì la vedi, e allora passi di sotto; se non la vedi vuol dire che sta di sotto, e allora passi di sopra. Attento a «prendi»: ci va da solo, e ci va <b>per la strada corta</b>, che è la corsia del fuoco.",
  racconto: "Sotto la parete si sono accampati in sei. Cenere è piccolo e nero: di notte non lo vede nessuno — ma <b>chi lo vede grida</b>, e un grido solo fa perdere la notte. Si vince quando Cenere è tornato al nido <b>con la mappa del capo</b>: da lì in poi si sa quanti sono, dove dormono e da dove vogliono salire. La sentinella vede a tre passi, il capo a due, Cenere a sei.",
  aiuti: [
    'Un solo grido e la notte è persa: non conta arrivare, conta non farsi vedere.',
    'Il blocco ❓ guarda <b>una volta sola</b>, quando ci arriva: dentro il ramo mettici tutto il viaggio, andata e ritorno.',
    'La corsia del fuoco è la strada corta, e «prendi la mappa» da solo passa proprio di lì.',
  ],

  griglia: ACCAMPAMENTO, ambiente: 'bosco',

  nomi: {
    nido: 'il nido', ciglio: 'il ballatoio',
    sopra: 'il bordo di sopra', sotto: 'il bordo di sotto',
    mappa: 'la mappa del capo',
    draghi: 'i draghi del nido', ladri: 'i ladri', vedetta: 'la sentinella',
  },
  posti: {
    nido: { x: 26, y: 1 },
    ciglio: { x: 21, y: 5 },
    sopra: { x: 12, y: 3 },
    sotto: { x: 12, y: 11 },
  },
  oggetti: [{ nome: 'mappa', em: '🗺️', x: 7, y: 7 }],
  segnali: ['nemico'],

  unita: [
    /* Cenere: non attacca nessuno, e non è un difetto — è il motivo
       per cui può andare dove gli altri no. Vede a sei passi e si fa
       vedere a due o tre: tutto il capitolo sta in quella differenza. */
    { id: 'cenere', nome: 'Cenere', fazione: 'draghi', emoji: '🐉', chi: 'gatto', manto: 'nero',
      vista: 6, vita: 1, x: 26, y: 1,
      sa: ['vai', 'prendi', 'aspetta', 'aspettaDiVedere'] },
    /* la sentinella sveglia: l'unica che gira lo sguardo, e l'unica
       che cambia posto da una notte all'altra */
    { id: 'vedetta', nome: 'la sentinella', fazione: 'ladri', emoji: '🔦', chi: 'guardia',
      vista: 3, vita: 6, x: 19, y: 3, grida: 'nemico' },
    /* il capo dorme male e sta seduto al fuoco: vede poco, ma vede */
    { id: 'capo', nome: 'il capo', fazione: 'ladri', emoji: '🧔', chi: 'capitano',
      vista: 2, vita: 8, x: 12, y: 7, grida: 'nemico' },
    /* e questi quattro dormono: vista zero, e sono lì per essere
       contati */
    { id: 'dorme1', nome: 'un ladro che dorme', fazione: 'ladri', emoji: '😴', chi: 'ladra',
      vista: 0, vita: 4, x: 9, y: 7 },
    { id: 'dorme2', nome: 'un ladro che dorme', fazione: 'ladri', emoji: '😴', chi: 'orco',
      vista: 0, vita: 4, x: 15, y: 7 },
    { id: 'dorme3', nome: 'un ladro che dorme', fazione: 'ladri', emoji: '😴', chi: 'guardia',
      vista: 0, vita: 4, x: 17, y: 7 },
    { id: 'dorme4', nome: 'un ladro che dorme', fazione: 'ladri', emoji: '😴', chi: 'ladra',
      vista: 0, vita: 4, x: 19, y: 7 },
  ],
  fazioni: {
    draghi: { nome: 'i draghi del nido', autore: 'giocatore' },
    ladri: { nome: 'i ladri accampati', autore: 'livello' },
  },

  complementi: ['nido', 'ciglio', 'sopra', 'sotto', 'mappa'],
  /* la domanda si compone da questo elenco, e sono due: la sentinella,
     che è quella che conta, e «i ladri» tutti insieme — che dal
     ballatoio è sempre vera, perché nella corsia qualcuno che dorme
     c'è comunque. Chi la sceglie se ne accorge da solo. */
  condizioni: [vedi('vedetta'), nonVedi('vedetta'), vedi('ladri'), nonVedi('ladri')],

  obiettivo: [ha('cenere', 'mappa'), qui('cenere', 'nido')],
  sconfitta: [{ cond: 'segnale', complemento: 'nemico' }],
  motivoSconfitta: 'Qualcuno ha visto Cenere e ha gridato: adesso l\'accampamento è sveglio.',
  mostraNemici: true,

  scenografia: [
    { che: 'falo', x: 14, y: 7 }, { che: 'tenda', x: 10, y: 7 },
    { che: 'tenda', x: 16, y: 7 }, { che: 'sacco', x: 18, y: 7 },
    { che: 'cassa', x: 20, y: 7 }, { che: 'botte', x: 6, y: 7 },
    { che: 'bandiera', x: 21, y: 7 },
    { che: 'roccia', x: 8, y: 3 }, { che: 'cespuglio', x: 14, y: 3 },
    { che: 'roccia', x: 18, y: 3 }, { che: 'albero', x: 20, y: 3 },
    { che: 'cespuglio', x: 9, y: 11 }, { che: 'roccia', x: 15, y: 11 },
    { che: 'albero', x: 18, y: 11 }, { che: 'pozzanghera', x: 7, y: 11, strato: -1 },
    { che: 'roccia', x: 6, y: 5 }, { che: 'ossa', x: 6, y: 9 },
    { che: 'cristallo', x: 21, y: 9 }, { che: 'stalagmite', x: 22, y: 5 },
    { che: 'ossa', x: 24, y: 3 }, { che: 'cristallo', x: 23, y: 1 },
  ],

  /* Tre notti: cambia chi sta sveglio e dove, dove dorme il capo e
     dove è finita la mappa. La domanda da farsi è sempre quella, la
     risposta no. */
  varianti: [
    { nome: 'la sentinella sul bordo di sopra',
      unita: { vedetta: { x: 19, y: 3 }, capo: { x: 12, y: 7 } },
      oggetti: { mappa: { x: 7, y: 7 } },
      posti: { sopra: { x: 12, y: 3 }, sotto: { x: 12, y: 11 } } },
    { nome: 'la sentinella sul bordo di sotto',
      unita: { vedetta: { x: 19, y: 11 }, capo: { x: 11, y: 7 } },
      oggetti: { mappa: { x: 8, y: 7 } },
      posti: { sopra: { x: 13, y: 3 }, sotto: { x: 13, y: 11 } } },
    { nome: 'la sentinella più avanti, di sopra',
      unita: { vedetta: { x: 17, y: 3 }, capo: { x: 13, y: 7 } },
      oggetti: { mappa: { x: 8, y: 7 } },
      posti: { sopra: { x: 11, y: 3 }, sotto: { x: 10, y: 11 } } },
  ],

  par: 10,
  soluzioni: [
    /* dieci ordini, ed è il par: uno per arrivare a guardare, il
       blocco, e dentro ogni ramo il viaggio intero. I due «vai» che
       stanno attorno a «prendi» non sono un doppione: il primo dice
       da che parte si va, il secondo dice da che parte si torna — e
       senza, la strada corta è la corsia del fuoco tutte e due le
       volte. */
    { nome: 'si guarda dal ballatoio, poi si sceglie', piano: {
      cenere: [
        o('vai', 'ciglio'),
        bivio(vedi('vedetta'),
          [o('vai', 'sotto'), o('prendi', 'mappa'), o('vai', 'sotto'), o('vai', 'nido')],
          [o('vai', 'sopra'), o('prendi', 'mappa'), o('vai', 'sopra'), o('vai', 'nido')]),
      ],
    } },
    /* FRAGILE: sempre dal bordo di sotto, senza guardare niente. Due
       notti su tre la sentinella sta di sopra e funziona; la terza sta
       proprio lì e la notte finisce con un grido. */
    { nome: 'sempre di sotto', fragile: true, piano: {
      cenere: [o('vai', 'ciglio'), o('vai', 'sotto'), o('prendi', 'mappa'),
               o('vai', 'sotto'), o('vai', 'nido')],
    } },
  ],

  verifiche: {
    /* srotolare il blocco vuol dire «fai tutte e due le strade»: gira
       il bordo di sopra e quello di sotto, e uno dei due ce l'ha la
       sentinella */
    nonInFila: true,
    /* e dentro il ramo l'ordine conta: il giro largo prima, se no
       «prendi» se ne va per la corsia del fuoco */
    ordineConta: [['vai sotto', 'prendi mappa']],
    /* senza la mappa non si torna con niente */
    senza: ['mappa'],
  },
}

export default NIDO_2

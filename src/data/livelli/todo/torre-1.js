/* ═══════════════════════════════════════════════════════════════════
   🗝️ I PRIGIONIERI DELLA TORRE — capitolo 1: «Sotto la porta»
   forma: consegna · concetto: la fila (sequenza)

   LA REGOLA DELLA STORIA, e vale da qui alla fine: **nessuno dei
   quattro sa attaccare**. `attacca` non entra in cassetta in nessuno
   dei cinque capitoli, e non è una dimenticanza — è il vincolo che
   toglie di mezzo l'unica soluzione che va bene sempre. Qui non c'è
   nemmeno un nemico: c'è del ferro in mezzo, e basta quello.

   LA STORIA. Marta è chiusa nella cella di ponente. La chiave di
   quella cella è appesa nel corridoio, a due passi e dall'altra parte
   della grata: da lì lei la vede e non la tocca. Cric il topo sotto la
   porta ci passa — è già passato, ed è per questo che comincia il
   livello dal corridoio — ma **non apre niente**, e una chiave in bocca
   a un topo non apre nemmeno lei. Quello che può fare è portarla dove
   serve: alla soglia della grata, dove Marta l'aspetta con le mani fra
   le sbarre. Marta intanto ha da fare una cosa sua: ritrovare **l'ago**
   che le hanno strappato dal grembiule e che è finito nella paglia.
   Senza quello, nei capitoli che vengono non apre più niente.

   COSA INSEGNA. La fila: gli ordini si eseguono uno dopo l'altro, e
   **quello che non hai scritto non succede**. Ma soprattutto insegna la
   frase da cui esce tutta la storia — **chi la prende non è chi la
   usa**. Sono due liste che girano insieme, una per uno, e nessuna
   delle due arriva in fondo da sola: se Cric si ferma dov'è la chiave
   invece di tornare alla soglia, la chiave resta di là dal ferro; se
   Marta resta a dormire in fondo alla paglia, alla soglia non c'è
   nessuno a raccoglierla. Il capitolo si vince quando le tre cose sono
   vere **nello stesso momento**, non una dopo l'altra.

   E INSEGNA UN'INVERSIONE. «Prendi la chiave» e «vai alla soglia» sono
   due ordini che sembrano uguali da spostare, e non lo sono: nella
   prima scena la chiave è appesa proprio davanti alla porta, e allora
   scambiarli non si vede — nelle altre due la chiave è in fondo al
   corridoio, e chi li ha scambiati finisce la scena dall'altra parte
   della torre con la chiave in bocca. È la soluzione «fragile» qui
   sotto: funziona una volta su tre, che è il modo peggiore di sbagliare.

   LA MAPPA. 24×12, il pianerottolo delle celle. A ponente la cella
   (x1-4, y3-7): quattro passi per cinque, la paglia in un angolo. Il
   muro di ferro è la colonna x5, e ha **un buco solo** — la grata (5,5),
   che resta chiusa per tutta la scena: nessuno la apre, perché nessuno
   ha ancora la chiave, ed è esattamente il punto. Di là c'è il
   corridoio (x6-22, y1-10), largo e vuoto, con i ganci delle chiavi
   lungo il muro. `sbarre` è la casella dentro la cella attaccata alla
   grata, `soglia` quella fuori: sono la stessa porta guardata dai due
   lati, e il livello si vince quando uno dei due sta di qua e l'altro
   di là.

   EREDITA: niente, è il primo capitolo.
   LASCIA: **la chiave della cella**, arrivata dentro — dal capitolo 2
   in poi quella grata si apre.
   ═══════════════════════════════════════════════════════════════════ */

/* le scorciatoie per scrivere i dati, le stesse degli altri capitoli:
   un ordine è verbo + complemento, e basta */
const o = (verbo, complemento) => ({ verbo, complemento })
const qui = (chi, complemento) => ({ cond: 'qui', chi, complemento })
const ha = (chi, complemento) => ({ cond: 'hai', chi, complemento })

/* Il pianerottolo delle celle, 24 colonne per 12 righe.
     x1-4  y3-7    la cella di Marta
     x5             il muro di ferro: tutto pieno tranne (5,5), la grata
     x6-22 y1-10    il corridoio delle guardie, e i ganci delle chiavi */
const PIANEROTTOLO = [
  '########################',
  '######.................#',
  '######.................#',
  '#....#.................#',
  '#....#.................#',
  '#......................#',
  '#....#.................#',
  '#....#.................#',
  '######.................#',
  '######.................#',
  '######.................#',
  '########################',
]

export const TORRE_1 = {
  id: 'torre-sotto-la-porta', nome: 'Sotto la porta',
  storia: 'torre', capitolo: 1, emoji: '🗝️',
  forma: 'consegna', concetto: 'sequenza',
  idea: 'Chi la prende non è chi la usa',
  eredita: [], lascia: ['chiave'],

  dritta: "Due liste che girano insieme, una per uno. Cric <b>non apre niente</b>, ma porta: prende la chiave e torna alla soglia. Marta <b>di lì non passa</b>, ma deve essere alle sbarre quando la chiave arriva — e prima si ricompra l'ago dalla paglia. Attento all'ordine di Cric: prendere e poi tornare non è tornare e poi prendere.",
  racconto: "La chiave della cella è appesa nel corridoio, a due passi e dall'altra parte del ferro. Sotto la porta passa solo <b>Cric</b>: lui la chiave la porta, ma non apre niente; <b>Marta</b> apre qualunque serratura, ma di lì non passa. Si vince quando Cric è <b>sulla soglia con la chiave</b> e Marta è <b>alle sbarre con il suo ago</b>: le tre cose insieme, non una dopo l'altra. La grata non si apre stanotte — si apre domani, con questa chiave.",
  aiuti: [
    'Un ordine è un verbo e una cosa. Per prendere una cosa non serve andarci prima: «prendi» ci va da solo.',
    'Cric deve fare due cose, e la seconda è tornare indietro: se finisce la scena dov\'è la chiave, la chiave è ancora di là dal ferro.',
    'Anche Marta ha la sua lista: l\'ago nella paglia, e poi le sbarre.',
  ],

  griglia: PIANEROTTOLO, ambiente: 'corridoio',

  nomi: {
    chiave: 'la chiave della cella',
    ago: 'l\'ago di Marta',
    grata: 'la grata della cella',
    sbarre: 'le sbarre, di dentro',
    soglia: 'la soglia, di fuori',
    prigionieri: 'i prigionieri',
  },
  posti: {
    /* la stessa porta guardata dai due lati: è tutto il capitolo */
    sbarre: { x: 4, y: 5 },
    soglia: { x: 6, y: 5 },
  },
  /* la grata è chiusa e **resta chiusa**: la chiave che arriva stanotte
     serve al capitolo dopo. Nessuno in scena sa `apri`, quindi non è
     una tentazione: è un muro con un buco per un topo. */
  porte: {
    grata: { x: 5, y: 5, chiave: 'chiave' },
  },
  oggetti: [
    { nome: 'chiave', em: '🗝️', x: 7, y: 5 },
    { nome: 'ago', em: '🪡', x: 1, y: 6 },
  ],

  unita: [
    /* Marta è chiusa dentro: cammina e raccoglie, e stanotte non apre
       niente perché non ha ancora niente da aprire */
    { id: 'marta', nome: 'Marta', fazione: 'prigionieri', emoji: '🪡', chi: 'ladra',
      vista: 4, vita: 3, x: 2, y: 7, sa: ['vai', 'prendi'] },
    /* Cric è già passato sotto la porta: comincia la scena dal
       corridoio. Passa dove non passa nessuno e porta cose piccole —
       e non apre niente, mai, in nessuno dei cinque capitoli */
    { id: 'cric', nome: 'Cric', fazione: 'prigionieri', emoji: '🐭', chi: 'gatto', manto: 'nero',
      vista: 3, vita: 3, x: 8, y: 9, sa: ['vai', 'prendi'] },
  ],
  fazioni: {
    prigionieri: { nome: 'i prigionieri', autore: 'giocatore' },
  },

  /* quattro cose sole si possono nominare, e da lì esce la cassetta:
     `vai` (la chiave, l'ago, le sbarre, la soglia) e `prendi` (la
     chiave, l'ago). Niente altro — la grata non è in elenco, quindi
     `apri` non c'è; nessuno è in elenco come bersaglio, quindi
     **`attacca` non c'è**, ed è la regola della storia. */
  complementi: ['chiave', 'ago', 'sbarre', 'soglia'],

  /* la CONSEGNA in tre righe, e devono essere vere insieme: la chiave è
     arrivata alla soglia, ce l'ha addosso chi la porta, e dall'altra
     parte del ferro c'è qualcuno ad aspettarla */
  obiettivo: [qui('cric', 'soglia'), ha('cric', 'chiave'),
              qui('marta', 'sbarre'), ha('marta', 'ago')],

  /* ── LA SCENOGRAFIA ──
     Roba che sta lì e basta: **non è in gioco**. Non passa dal motore,
     non si prende, non si nomina in un ordine, non compare fra i
     bersagli. Serve a far vedere che una cella è una cella e un
     corridoio di guardie è un corridoio di guardie. */
  scenografia: [
    { che: 'sacco', x: 1, y: 4 }, { che: 'catena', x: 1, y: 5 },
    { che: 'ragnatela', x: 4, y: 3, strato: -1 }, { che: 'ossa', x: 2, y: 3 },
    { che: 'pozzanghera', x: 3, y: 6, strato: -1 }, { che: 'secchio', x: 3, y: 4 },
    { che: 'torcia', x: 6, y: 1 }, { che: 'cassa', x: 9, y: 1 },
    { che: 'botte', x: 12, y: 1 }, { che: 'barile', x: 19, y: 1 },
    { che: 'ragnatela', x: 22, y: 1, strato: -1 },
    { che: 'colonna', x: 11, y: 5 }, { che: 'colonna', x: 16, y: 5 },
    { che: 'pane', x: 13, y: 3 }, { che: 'cartello', x: 6, y: 8 },
    { che: 'ossa', x: 14, y: 9 }, { che: 'pozzanghera', x: 17, y: 8, strato: -1 },
    { che: 'tenda', x: 10, y: 10 }, { che: 'torcia', x: 18, y: 10 },
    { che: 'scala', x: 22, y: 10, strato: -1 }, { che: 'sacco', x: 22, y: 6 },
  ],

  /* tre scene, e quello che cambia è **quanto costa a Cric tornare
     indietro**: nella prima la chiave è appesa proprio davanti alla
     grata e chi scambia i due ordini non se ne accorge, nelle altre due
     è in fondo al corridoio e lo scambio si paga tutto. Si spostano
     anche l'ago nella paglia e da dove partono i due. */
  varianti: [
    { nome: 'la chiave al gancio davanti alla porta',
      oggetti: { chiave: { x: 7, y: 5 }, ago: { x: 1, y: 6 } },
      unita: { marta: { x: 2, y: 7 }, cric: { x: 8, y: 9 } } },
    { nome: 'la chiave in fondo al corridoio',
      oggetti: { chiave: { x: 21, y: 9 }, ago: { x: 3, y: 3 } },
      unita: { marta: { x: 1, y: 7 }, cric: { x: 20, y: 10 } } },
    { nome: 'la chiave appesa in alto, dall\'altra parte',
      oggetti: { chiave: { x: 20, y: 2 }, ago: { x: 1, y: 3 } },
      unita: { marta: { x: 4, y: 7 }, cric: { x: 7, y: 1 } } },
  ],

  soluzioni: [
    /* quattro ordini, ed è il par: due per uno, e non se ne toglie
       nessuno. Senza «prendi chiave» non c'è niente da consegnare;
       senza «vai soglia» la chiave resta dov'era; senza «prendi ago»
       Marta arriva alle sbarre a mani vuote e domani non apre niente;
       senza «vai sbarre» alla soglia non c'è nessuno. */
    { nome: 'la chiave, e poi indietro', piano: {
      cric: [o('prendi', 'chiave'), o('vai', 'soglia')],
      marta: [o('prendi', 'ago'), o('vai', 'sbarre')],
    } },
    /* FRAGILE: gli stessi ordini di Cric, scambiati. Nella prima scena
       la chiave è appesa a un passo dalla soglia: lui ci arriva, allunga
       il muso e la prende senza muoversi — vinta, e senza aver capito
       niente. Nelle altre due la chiave è in fondo al corridoio, e la
       scena finisce con Cric là in fondo e la grata vuota. */
    { nome: 'prima la soglia, poi la chiave', fragile: true, piano: {
      cric: [o('vai', 'soglia'), o('prendi', 'chiave')],
      marta: [o('prendi', 'ago'), o('vai', 'sbarre')],
    } },
  ],

  /* ── QUELLO CHE QUESTO CAPITOLO HA DI SUO ──
     Si dichiarano qui e le esegue il banco di prova dei livelli
     (`test/aiuto/livello.mjs`), dove è scritto anche il contratto.
     Non c'è `nonInFila`, e non è una svista: in questo capitolo la
     cassetta è di due verbi — `vai` e `prendi` — e con due verbi non
     esiste **nessun modo di dire «adesso»**. La sincronizzazione
     arriva dal capitolo 2 in poi; qui le due liste girano insieme e
     basta. */
  verifiche: {
    /* nessuno dei due arriva in fondo da solo: Cric non può stare alle
       sbarre e Marta non può uscire a prendere la chiave */
    serveOgnuno: true,
    /* l'inversione che il capitolo insegna, ed è la stessa della
       soluzione fragile qui sopra: prendere e poi tornare non è
       tornare e poi prendere */
    ordineConta: [['prendi chiave', 'vai soglia']],
    /* e le due cose senza cui non c'è consegna: la chiave (non c'è
       niente da portare) e l'ago (Marta non ha di che aprire domani) */
    senza: ['chiave', 'ago'],
  },
}

export default TORRE_1

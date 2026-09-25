/* ═══════════════════════════════════════════════════════════════════
   LA CAMPAGNA — i posti dei piccoli, e poi lo zaino

   Ogni gradino porta **una regola nuova**, e da lì in poi quella regola
   c'è sempre: il mondo non cambia da un livello all'altro, si allarga.
   Prima si cammina e basta, poi si salta, poi si scivola, poi si spinge,
   poi si cade nelle buche — e l'ultimo livello le mette tutte insieme.

   Dopo le buche arriva il **cane pastore**: l'ultima regola del mondo,
   e l'unica in cui chi corre non va da nessuna parte — porta le pecore
   nel recinto, e le pecore si spostano solo scappando da lui. È ancora
   un gradino dei piccoli (niente carte, niente zaino), ma è quello dove
   si pensa di più: una pecora spinta nel posto sbagliato si incastra, e
   la strada si scrive pensando a dove andrà a finire lei, non a dove va
   il cane.

   Dopo il cane il mondo smette di crescere e cresce **la lingua**: i
   gradini dei grandi portano una carta nuova invece che una regola del
   mondo — 🔁 ripeti, per cominciare (`dati/carte.js`) — e con la carta
   lo **zaino**, quante carte tiene la fila. La strada scritta freccia
   per freccia nello zaino non ci sta: il ciclo è l'unico modo di farla
   stare, e il test lo pretende (`serveLaCarta`). Il mondo resta quello
   di prima, con tutte le sue regole: un ciclo di salti, un ciclo sul
   ghiaccio.

   ── UN LIVELLO È UN POSTO, NON UNA STANZA ─────────────────────────
   La mappa è scritta a mano, una lettera per cella (la legenda sta in
   `dati/mondo.js`), e ognuna ha la sua forma: un prato con due
   cespugli, un bosco con un bivio, un fiume con i sassi, un lago
   ghiacciato con un buco. Il fuori non è sempre un rettangolo pieno — è
   l'acqua, il bosco, la siepe — e ogni posto ha un piccolo «aha»,
   scritto nel `racconto`: è la cosa che il livello esiste per far
   scoprire.

   ── LA CAROTA ─────────────────────────────────────────────────────
   Ogni livello ne ha una, e prenderla vale una stella. Nei primi sta
   sulla strada; poi chiede una deviazione; poi una deviazione pensata —
   sul ghiaccio, dietro a un buco, dall'altra parte della buca. Non è
   mai obbligatoria: senza, la tana vale lo stesso.

   ── I NUMERI ──────────────────────────────────────────────────────
   `portata` è la scala di tutto il repo (0 = quattro anni, 12,5 punti
   per anno, vedi `data/portata.js`): dal prato a quattro anni al tutto
   insieme a sette e mezzo. L'ultima sta a 44 e non a 45 apposta: la mira
   di un bambino di sei anni arriva a 44, e un punto in più chiudeva col
   lucchetto l'ultima tappa (e il sentiero senza fine dietro) proprio a
   chi ha l'età giusta per giocarla. Le pecore stanno a 44 anche loro,
   per la stessa ragione: sono il gradino dopo di chi ha sei anni e ha
   finito le buche, e lo zaino a quell'età resta chiuso. Nessuna tappa dichiara `scuola`: dietro non
   c'è un pezzo di programma scolastico, e la testa della fila non si
   taglia mai.

   `premio` sono le monete **della prima vittoria**, una volta sola: il
   livello è fisso, e rigiocarlo è ricordarlo, non esercitarsi (vedi
   `CALIBRAZIONE.md`). Sale col gradino perché col gradino sale il tempo
   che un livello chiede: un minuto il prato, cinque il labirinto di
   ghiaccio.

   `trappole`, nei livelli del cane, sono le mosse ingenue di quel posto
   — passare sotto la pecora per prendere l'osso, spingerla troppo in
   là — e il test pretende che non vincano e che prima di fermarsi
   facciano un pezzo di strada: è lì che si vede dove si è sbagliato.

   `salti: true` accende la seconda fila di frecce. Solo dove il livello
   le usa: una fila di tasti che non servono a niente è una fila di
   tasti da provare a caso.

   ── I LIVELLI CON LO ZAINO ────────────────────────────────────────
   Dichiarano tre cose in più: `carte` (quali tasti oltre alle frecce:
   `['ripeti']`), `zaino` (quante carte tiene la fila) e `soluzioni`,
   scritte con `programma()` e `ripeti()`. Qui la soluzione si scrive,
   non si misura: il risolutore trova la strada più corta, non il
   programma più corto, e gli aiuti partono da quella scritta
   (`suggerisciNelloZaino`). Le `fragili` sono le mosse ingenue — la
   scatola con le frecce nell'ordine sbagliato, la scalinata presa dal
   lato comodo — e il test pretende che nessuna vinca con la carota: se
   una vincesse, la carota non chiederebbe di pensare.

   Quanto è lunga la strada più corta e se la regola del gradino serve
   davvero **non si scrive qui**: lo misura il risolutore, e il test
   (`test/unita/passo-passo`) lo pretende. Le misure di oggi, per chi
   deve scrivere un livello nuovo, stanno in `docs/passo-passo.md`.
   ═══════════════════════════════════════════════════════════════════ */
import { guastiDellaMappa, MOSSE } from './mondo.js'
import { CARTE, carteDi, guastiDellaFila, programma, ripeti, se } from './carte.js'

export const SCALINI = [
  { chiave: 'passi', nome: 'Primi passi', icona: '🐾', regola: null,
    dritta: 'Solo frecce: si cammina, si gira attorno, non si entra nell\'acqua.' },
  { chiave: 'salto', nome: 'Il salto', icona: '🦘', regola: 'salto',
    dritta: 'Il salto scavalca una cella: l\'acqua e i tronchi sì, i sassi no.' },
  { chiave: 'ghiaccio', nome: 'Il ghiaccio', icona: '❄️', regola: 'ghiaccio',
    dritta: 'Sul ghiaccio si scivola finché qualcosa non ferma.' },
  { chiave: 'massi', nome: 'I massi', icona: '🪨', regola: 'spinta',
    dritta: 'Un masso si spinge: sul ghiaccio scivola, nell\'acqua fa un ponte.' },
  { chiave: 'buche', nome: 'Le buche', icona: '🕳️', regola: 'buche',
    dritta: 'Si entra in una buca e si esce dalla sua gemella, dello stesso colore.' },
  { chiave: 'pecore', nome: 'Il cane pastore', icona: '🐑', regola: 'pecore',
    dritta: 'Le pecore scappano dal cane: quando le si ferma accanto, fanno un passo dall\'altra parte. Portale tutte nel recinto.' },
  /* da qui la lingua, e non il mondo: il gradino porta una carta */
  { chiave: 'ripeti', nome: 'Il ripeti', icona: '🔁', carta: 'ripeti',
    dritta: 'Nello zaino ci stanno poche carte: una scatola 🔁 ripete quello che ha dentro.' },
  { chiave: 'fino', nome: 'Fino a', icona: '🚩', carta: 'fino',
    dritta: 'Una scatola che non conta: ripete finché il coniglio non arriva sulla lastra del colore giusto.' },
  { chiave: 'se', nome: 'Il se', icona: '❓', carta: 'se',
    dritta: 'Il coniglio guarda cosa ha sotto i piedi, e decide: la scatola ❓ si fa solo sul colore giusto.' },
  /* e l'ultimo rimette insieme tutto: il ghiaccio, i massi, i salti, le
     lastre, con le scatole in mano */
  { chiave: 'mondo', nome: 'Tutto il mondo', icona: '🌍', carta: 'ripeti',
    dritta: 'Il ghiaccio, i massi, i salti e i segnali, con tutte le scatole in mano.' },
]

/* I temi sono solo vestito: cambiano l'erba, le foglie per terra, la
   neve sugli alberi. Le regole restano le stesse in ogni stagione. */
export const TEMI = ['primavera', 'estate', 'inverno', 'autunno']

export const CAMPAGNA = [
  /* ── gradino 1: primi passi ── */
  { chiave: 'prato', nome: 'Il prato', icona: '🌼', scalino: 'passi',
    portata: 4, premio: 4, tema: 'primavera',
    racconto: 'Tre frecce, e la carota sta sulla strada: si scopre che il coniglio fa quello che dice la fila.',
    mappa: [
      'B..A',
      'Pc.@',
      '..B.',
    ] },
  { chiave: 'cespuglio', nome: 'Il cespuglio', icona: '🌳', scalino: 'passi',
    portata: 6, premio: 4, tema: 'primavera',
    racconto: 'Un cespuglio in mezzo alla strada: dritti si sbatte, bisogna girarci attorno.',
    mappa: [
      '....',
      'PB.@',
      '.c..',
    ] },
  { chiave: 'stagno', nome: 'Lo stagno', icona: '🐸', scalino: 'passi',
    portata: 8, premio: 4, tema: 'primavera',
    racconto: 'Lo stagno non si attraversa: splash. Due strade per girarci attorno, e la carota è su una delle due.',
    mappa: [
      '.....',
      'P~~..',
      '.~~.@',
      '.c...',
    ] },
  { chiave: 'bosco', nome: 'Il bosco', icona: '🌲', scalino: 'passi',
    portata: 10, premio: 4, tema: 'primavera',
    racconto: 'Un bivio fra gli alberi: la strada corta porta a casa, quella lunga passa dalla carota.',
    mappa: [
      'AA.AA',
      'P...A',
      'A.A.@',
      'Ac..A',
    ] },
  { chiave: 'orto', nome: 'L\'orto', icona: '🥬', scalino: 'passi',
    portata: 12, premio: 4, tema: 'primavera',
    racconto: 'Le file dell\'orto: la carota è piantata in un buco della fila, e per prenderla si passa di lì.',
    mappa: [
      '......',
      'PBBBB.',
      '......',
      '.BBcB.',
      '.....@',
    ] },

  /* ── gradino 2: il salto ── */
  { chiave: 'ruscello', nome: 'Il ruscello', icona: '💧', scalino: 'salto',
    portata: 14, premio: 6, tema: 'estate', salti: true,
    racconto: 'Un ruscello taglia il prato da parte a parte: si salta, e si atterra proprio sulla carota.',
    mappa: [
      'A.~..',
      'P.~c@',
      '..~.A',
    ] },
  { chiave: 'tronco', nome: 'Il tronco', icona: '🪵', scalino: 'salto',
    portata: 16, premio: 6, tema: 'estate', salti: true,
    racconto: 'Sopra c\'è un sasso, sotto un tronco caduto: il sasso è alto e non si salta, il tronco sì.',
    mappa: [
      'AAAAAA',
      'P..S.@',
      '.AAAA.',
      '..t.c.',
      'AAAAAA',
    ] },
  { chiave: 'fosso', nome: 'Il fosso', icona: '🏞️', scalino: 'salto',
    portata: 18, premio: 6, tema: 'estate', salti: true,
    racconto: 'Il fosso è largo due celle e il salto ne scavalca una sola: bisogna trovare la secca in mezzo.',
    mappa: [
      'AP....',
      '......',
      '~~~~~~',
      '~~~.~~',
      '..c...',
      'A...@A',
    ] },
  { chiave: 'recinto', nome: 'L\'orto recintato', icona: '🥕', scalino: 'salto',
    portata: 20, premio: 6, tema: 'estate', salti: true,
    racconto: 'Dentro la staccionata c\'è la carota: si salta dentro e si salta fuori. Saltandoci sopra non si prende.',
    mappa: [
      '...AA..',
      '.-----.',
      'P-.c.-@',
      '.-----.',
      '~~...~~',
    ] },
  { chiave: 'fiume', nome: 'I sassi nel fiume', icona: '🌊', scalino: 'salto',
    portata: 22, premio: 6, tema: 'estate', salti: true,
    racconto: 'Un fiume largo con le isolette: da un\'isola all\'altra, cambiando direzione. Qualche isola non porta da nessuna parte.',
    mappa: [
      'P.~.~cA',
      '~~~~~~~',
      '~~~.~.~',
      '~~~~~~~',
      '~.~~~.~',
      '~~~~~~~',
      'A.A.~.@',
    ] },

  /* ── gradino 3: il ghiaccio ── */
  { chiave: 'laghetto', nome: 'Il laghetto ghiacciato', icona: '⛸️', scalino: 'ghiaccio',
    portata: 24, premio: 8, tema: 'inverno',
    racconto: 'Una freccia sola, e il coniglio attraversa tutto il lago: sul ghiaccio non ci si ferma.',
    mappa: [
      'A.....A',
      '..***..',
      'P**C**.',
      '.*****@',
      'A.***.A',
    ] },
  { chiave: 'freno', nome: 'Il sasso che frena', icona: '🪨', scalino: 'ghiaccio',
    portata: 26, premio: 8, tema: 'inverno',
    racconto: 'Per scendere nella colonna giusta bisogna fermarsi a metà lago: ci pensa il sasso.',
    mappa: [
      '.......',
      'P***O*.',
      '.*****.',
      '.**C**.',
      '.*****.',
      'AA...@A',
    ] },
  { chiave: 'rotto', nome: 'Il ghiaccio rotto', icona: '🧊', scalino: 'ghiaccio',
    portata: 28, premio: 8, tema: 'inverno',
    racconto: 'Dritti si finisce nel buco del ghiaccio. La carota si prende solo fermandosi contro il sasso, e tornando indietro.',
    mappa: [
      '.......',
      'P*~O*~.',
      '.C*O**.',
      '.*****@',
      'A.....A',
    ] },
  { chiave: 'fiume-gelato', nome: 'Il fiume gelato', icona: '🥕', scalino: 'ghiaccio',
    portata: 30, premio: 8, tema: 'inverno',
    racconto: 'La carota è in mezzo al fiume gelato: ci si arriva solo scendendo nel punto giusto e scivolando lungo il fiume.',
    mappa: [
      '..A...P',
      'O******',
      '***C**O',
      '*****O*',
      '.@..A..',
    ] },
  { chiave: 'labirinto', nome: 'Il labirinto di ghiaccio', icona: '🌀', scalino: 'ghiaccio',
    portata: 32, premio: 8, tema: 'inverno',
    racconto: 'Sette frecce, e una sola strada: ogni scivolata finisce contro un sasso, e la carota è nell\'angolo in alto.',
    mappa: [
      'AA.....',
      '.C****.',
      'P*O****',
      '*****O.',
      '.O****A',
      'A.***.@',
    ] },
  { chiave: 'crepa', nome: 'La crepa', icona: '❄️', scalino: 'ghiaccio',
    portata: 34, premio: 8, tema: 'inverno', salti: true,
    racconto: 'Una crepa d\'acqua spacca il lago: prima ci si ferma accanto, contro un sasso, e poi la si salta.',
    mappa: [
      '.***O**',
      'P***~*@',
      '.***~*.',
      '.**O~*c',
      'A...~AA',
    ] },

  /* ── gradino 4: i massi ── */
  { chiave: 'masso', nome: 'Il masso', icona: '🪨', scalino: 'massi',
    portata: 36, premio: 10, tema: 'autunno',
    racconto: 'Un masso tappa il passaggio fra gli alberi: camminandoci contro si spinge, e la strada si apre.',
    mappa: [
      '..A.c.',
      'P.m...',
      '..A.@.',
    ] },
  { chiave: 'ponte', nome: 'Il ponte di sasso', icona: '🌉', scalino: 'massi',
    portata: 37, premio: 10, tema: 'autunno',
    racconto: 'Un ruscello e niente salti: spinto nell\'acqua, il masso affonda e diventa un ponte.',
    mappa: [
      'AAA~AAA',
      '...~...',
      'P.m~...',
      '...~.c.',
      'AAA~..@',
    ] },
  { chiave: 'masso-ghiaccio', nome: 'Il masso sul ghiaccio', icona: '🥌', scalino: 'massi',
    portata: 38, premio: 10, tema: 'inverno',
    racconto: 'Spinto sul ghiaccio, il masso scivola fino in fondo: e lì diventa il sasso che ti ferma.',
    mappa: [
      'AAAAAA',
      'Pm***.',
      'A****A',
      'AC***.',
      'AAAA@A',
    ] },
  { chiave: 'due-massi', nome: 'Due massi', icona: '⛰️', scalino: 'massi',
    portata: 39, premio: 10, tema: 'autunno',
    racconto: 'Due massi in fila non si spingono: prima si sposta quello davanti, poi l\'altro va nell\'acqua.',
    mappa: [
      'AA.AAAA',
      '...A...',
      'P.mm~.@',
      '...A.c.',
      'AA.AAAA',
    ] },

  /* ── gradino 5: le buche ── */
  { chiave: 'buche', nome: 'Le buche', icona: '🕳️', scalino: 'buche',
    portata: 40, premio: 12, tema: 'estate',
    racconto: 'La siepe non si passa, ma sotto c\'è una galleria: si entra da una buca e si esce dall\'altra.',
    mappa: [
      '...A...',
      'P.1A..c',
      '...A.1.',
      '...A..@',
    ] },
  { chiave: 'buca-ghiaccio', nome: 'La buca nel ghiaccio', icona: '🏝️', scalino: 'buche',
    portata: 41, premio: 12, tema: 'inverno',
    racconto: 'La tana è su un\'isola: ci porta la buca in mezzo al lago, che ferma anche chi ci scivola dentro.',
    mappa: [
      'A.....A',
      'P**C**.',
      '.**1**.',
      '.*****.',
      'A.....A',
      '~~~~~~~',
      '~1.@~~~',
    ] },
  { chiave: 'colori', nome: 'Le buche colorate', icona: '🎨', scalino: 'buche',
    portata: 42, premio: 12, tema: 'primavera',
    racconto: 'La buca rosa porta alla carota e la viola alla tana. Per tornare indietro si ripassa dalla rosa.',
    mappa: [
      '...A...',
      'P.1Ac1.',
      '..2AAAA',
      '...A...',
      '...A2.@',
    ] },
  { chiave: 'tutto', nome: 'Tutto insieme', icona: '🏆', scalino: 'buche',
    portata: 44, premio: 12, tema: 'inverno', salti: true,
    racconto: 'La strada di casa: la staccionata, il masso nel fiume, il lago col sasso, la buca. E la carota sul ghiaccio, da prendere dal lato giusto.',
    mappa: [
      'P-...AA',
      'AAAA.AA',
      'AAAAmAA',
      '~~~~~~~',
      '..*C*.A',
      '.1***..',
      '.***O*.',
      'AAAAAAA',
      '1..t..@',
    ] },

  /* ── gradino 6: il cane pastore ──
     Il bobtail al posto del coniglio, le pecore al posto della tana. Un
     gradino di regola del mondo come gli altri cinque, ma è quello dove
     la strada si pensa di più: il cane non va da nessuna parte, è la
     pecora che deve arrivare. Da una pecora a tre; la carota è un osso,
     e prenderlo chiede un giro che non spaventi nessuno — chi ci passa
     accanto male incastra la pecora, e la fila si ferma lì. Monete fra le
     buche e lo zaino (12–14), portata 44: è il gradino dopo per chi ha
     sei anni e ha finito le buche. */
  { chiave: 'primo-gregge', nome: 'Il primo gregge', icona: '🐕', scalino: 'pecore',
    portata: 44, premio: 12, tema: 'primavera',
    racconto: 'Il cane non tocca mai le pecore: gli basta fermarsi accanto, e loro fanno un passo dall\'altra parte. Dietro alla pecora, verso il recinto, e lei ci entra da sola. L\'osso chiede un giro: chi ci arriva passandole sotto la manda contro il bosco, e lì si incastra.',
    mappa: [
      'AB...BB',
      'P.p..##',
      '....BBB',
      '~.c...A',
    ],
    trappole: [['giu', 'destra', 'destra']] },
  { chiave: 'altra-parte', nome: 'Dall\'altra parte', icona: '🌾', scalino: 'pecore',
    portata: 44, premio: 12, tema: 'estate',
    racconto: 'Il recinto è in basso, e la pecora ci va solo se il cane le sta sopra. Chi le va incontro dritto la spinge in su: per girarle attorno si passa in diagonale, mai accanto.',
    mappa: [
      '..c..A',
      '.....A',
      '..p...',
      'P.....',
      'BB##BB',
    ],
    trappole: [['destra', 'destra', 'su'], ['su', 'destra', 'destra', 'destra']] },
  { chiave: 'curva', nome: 'La curva', icona: '🌳', scalino: 'pecore',
    portata: 44, premio: 13, tema: 'autunno',
    racconto: 'Prima a destra, poi giù: fra una spinta e l\'altra il cane le gira attorno. Chi la spinge troppo in là la mette contro il bordo del prato, e da lì non torna più.',
    mappa: [
      'A......',
      'P.p....',
      '.......',
      'BBB.B..',
      '~~~cB#B',
    ],
    trappole: [['destra', 'destra', 'destra', 'destra']] },
  { chiave: 'pecora-ghiaccio', nome: 'La pecora sul ghiaccio', icona: '🧊', scalino: 'pecore',
    portata: 44, premio: 13, tema: 'inverno',
    racconto: 'Sul ghiaccio la pecora scivola finché qualcosa non la ferma: qui è il sasso, proprio sopra il cancello del recinto. Chi la rincorre sul ghiaccio ci sbatte contro.',
    mappa: [
      'B.....A',
      'P......',
      '.p****O',
      '~~~~.#B',
      'B...c.B',
    ],
    trappole: [['giu', 'destra', 'destra', 'destra']] },
  { chiave: 'due-in-fila', nome: 'Due in fila', icona: '🐏', scalino: 'pecore',
    portata: 44, premio: 14, tema: 'primavera',
    racconto: 'Una pecora con un\'altra alle spalle non ha dove scappare, e il cane ci sbatte contro. Prima si separano, poi dentro una per volta.',
    mappa: [
      'A....BA',
      'P.pp.##',
      '.....##',
      'A..c.BA',
    ],
    trappole: [['destra', 'destra', 'destra']] },
  { chiave: 'gregge', nome: 'Il gregge', icona: '🐑', scalino: 'pecore',
    portata: 44, premio: 14, tema: 'estate',
    racconto: 'Tre pecore, e il recinto ha il cancello da una parte sola. Quale per prima, e da che parte? Quella in basso è la più lontana, e le due in fila si devono separare.',
    mappa: [
      'A.....B',
      'P.pp.##',
      '......#',
      '..p..BB',
      'A.c...A',
    ],
    trappole: [['giu', 'giu', 'destra', 'destra', 'su'], ['destra', 'destra', 'destra']] },

  /* ── gradino 7: il ripeti ──
     Le monete salgono a 14 e poi a 16: un livello con lo zaino chiede
     di trovare lo schema prima di scriverlo, e ci si sta più di un
     minuto. La portata va dai 7 anni e mezzo agli 8 e mezzo. */
  { chiave: 'viale', nome: 'Il viale', icona: '🌳', scalino: 'ripeti',
    portata: 46, premio: 14, tema: 'autunno', carte: ['ripeti'], zaino: 3,
    racconto: 'Il viale è lungo cinque passi e nello zaino ci stanno tre carte: la scatola 🔁 ripete la freccia che ha dentro, tante volte quante dice il suo numero.',
    mappa: [
      'AAAAAAA',
      'P..c..A',
      'AAAAA@A',
    ],
    soluzioni: [programma(ripeti(5, 'destra'), 'giu')],
    fragili: [programma(ripeti(6, 'destra'), 'giu'), programma(ripeti(4, 'destra'), 'giu')] },
  { chiave: 'stagno-grande', nome: 'Lo stagno grande', icona: '🦆', scalino: 'ripeti',
    portata: 47, premio: 14, tema: 'estate', carte: ['ripeti'], zaino: 4,
    racconto: 'Due strade attorno allo stagno, e una scatola per ogni lato. La carota sta da una parte sola: da che lato si comincia?',
    mappa: [
      'P......',
      '.~~~~~.',
      '.~~~~~.',
      '.~~~~~.',
      '.~~~~~.',
      '...c..@',
    ],
    soluzioni: [programma(ripeti(5, 'giu'), ripeti(6, 'destra'))],
    fragili: [programma(ripeti(6, 'destra'), ripeti(5, 'giu'))] },
  { chiave: 'scala', nome: 'La scala', icona: '🪜', scalino: 'ripeti',
    portata: 48, premio: 14, tema: 'autunno', carte: ['ripeti'], zaino: 3,
    racconto: 'In una scatola ci stanno anche due frecce: un gradino è «→ ↓». Ma l\'ordine conta, e la carota sta su un gradino solo.',
    mappa: [
      'P.AAAAA',
      '...AAAA',
      'A...AAA',
      'AAc..AA',
      'AAA...A',
      'AAAA...',
      'AAAAA.@',
    ],
    soluzioni: [programma(ripeti(6, 'giu', 'destra'))],
    fragili: [programma(ripeti(6, 'destra', 'giu'))] },
  { chiave: 'sassi-fiume', nome: 'Di sasso in sasso', icona: '🪨', scalino: 'ripeti',
    portata: 50, premio: 14, tema: 'estate', carte: ['ripeti'], zaino: 3, salti: true,
    racconto: 'Anche un salto si ripete: di sasso in sasso giù per il fiume, sempre con lo stesso passo.',
    mappa: [
      'P~.~~~~',
      '~~.~.~~',
      '~~~~c~.',
      '~~~~~~@',
    ],
    soluzioni: [programma(ripeti(3, 'salto-destra', 'giu'))],
    fragili: [programma(ripeti(3, 'destra', 'giu'))] },
  { chiave: 'lago-gradini', nome: 'Il lago a gradini', icona: '⛸️', scalino: 'ripeti',
    portata: 52, premio: 14, tema: 'inverno', carte: ['ripeti'], zaino: 3,
    racconto: 'Sul ghiaccio la stessa freccia fa strade diverse — una casella, poi tre, poi due — e il ciclo va bene lo stesso: a fermare il coniglio ci pensano i sassi e il bordo.',
    mappa: [
      'P*OAAAA',
      'A.*C*OA',
      'AAAA.**',
      'AAAAAA@',
    ],
    soluzioni: [programma(ripeti(3, 'destra', 'giu'))] },
  { chiave: 'collina', nome: 'La collina', icona: '⛰️', scalino: 'ripeti',
    portata: 54, premio: 16, tema: 'primavera', carte: ['ripeti'], zaino: 6,
    racconto: 'Su per la collina e giù dall\'altra parte: due scatole diverse, una dopo l\'altra. La strada di mezzo è più corta, ma non si ripete, e nello zaino non ci sta.',
    mappa: [
      'AAA.cAA',
      'AA....A',
      'A..AA..',
      'P.AAAA@',
    ],
    soluzioni: [programma(ripeti(3, 'destra', 'su'), ripeti(3, 'destra', 'giu'))],
    fragili: [programma(ripeti(3, 'destra', 'su'), ripeti(3, 'giu', 'destra'))] },
  { chiave: 'terrazze', nome: 'Le terrazze', icona: '🍇', scalino: 'ripeti',
    portata: 56, premio: 16, tema: 'autunno', carte: ['ripeti'], zaino: 5,
    racconto: 'Un gradino grande è fatto di passi piccoli: una scatola dentro l\'altra. E si scende per due strade, ma la carota è su una sola.',
    mappa: [
      'P...AAA',
      '.AA.AAA',
      '.AA.AAA',
      '.......',
      'AAA.AA.',
      'AAAcAA.',
      'AAA...@',
    ],
    soluzioni: [programma(ripeti(2, ripeti(3, 'giu'), ripeti(3, 'destra')))],
    fragili: [programma(ripeti(2, ripeti(3, 'destra'), ripeti(3, 'giu')))] },
  { chiave: 'campo-arato', nome: 'Il campo arato', icona: '🌾', scalino: 'ripeti',
    portata: 58, premio: 16, tema: 'primavera', carte: ['ripeti'], zaino: 9,
    racconto: 'Avanti e indietro fra le siepi, come l\'aratro: una riga all\'andata e una al ritorno, e poi di nuovo. Quattro scatole dentro una.',
    mappa: [
      'P......',
      'BBBBBB.',
      '.......',
      '.BBBBBB',
      '.......',
      'BBBBBB.',
      '.......',
      '.BBBBBB',
      'c.....@',
    ],
    soluzioni: [programma(ripeti(3, ripeti(6, 'destra'), ripeti(2, 'giu'),
                                    ripeti(6, 'sinistra'), ripeti(2, 'giu')))] },

  /* ── gradino 7: fino a ──
     La scatola che non conta. Serve dove la stessa scatola deve fare
     strade lunghe diverse — i gradini storti, le file del campo, i lati
     della spirale — perché lì un numero va bene una volta sola: è la
     scatola dentro la scatola a renderla necessaria, e lo zaino la
     pretende. Le lastre rosse dicono dove girare.

     ── LE FALSE PISTE ──
     Chi sbaglia non deve sbattere al primo passo contro un albero: deve
     proseguire su una strada che sembrava buona, e finire in un fosso, in
     uno stagno o fermo in un angolo. È lì che si capisce *quale* scatola
     era sbagliata — e il test lo pretende dalle `fragili`: almeno due
     passi prima di fermarsi. Per questo i gradini e i solchi continuano
     oltre la lastra rossa, e sotto ci sono i fossi: chi conta invece di
     guardare va avanti e ci cade. */
  { chiave: 'gradini-storti', nome: 'I gradini storti', icona: '🪜', scalino: 'fino',
    portata: 60, premio: 16, tema: 'autunno', carte: ['ripeti', 'fino'], zaino: 5,
    racconto: 'Tre gradini sopra i fossi, ognuno lungo diverso: contarli non serve, il coniglio va avanti finché non arriva sulla lastra rossa, e scende sul sasso. Chi scende prima, o dopo, finisce nel fosso.',
    mappa: [
      'P.r..AAAA',
      '~~.~~~~~~',
      'AA..c.r.A',
      '~~~~~~.~~',
      'AAAAAA.r.',
      '~~~~~~~.~',
      'AAAAAAA@A',
    ],
    soluzioni: [programma(ripeti(3, ripeti('rosso', 'destra'), 'giu', 'giu'))],
    fragili: [programma(ripeti(3, ripeti(2, 'destra'), 'giu', 'giu')),
              programma(ripeti(3, ripeti(4, 'destra'), 'giu', 'giu')),
              programma(ripeti(3, ripeti('rosso', 'destra'), 'giu'))] },
  { chiave: 'pianerottoli', nome: 'Scale e pianerottoli', icona: '🏛️', scalino: 'fino',
    portata: 62, premio: 16, tema: 'primavera', carte: ['ripeti', 'fino'], zaino: 7,
    racconto: 'Due colori: la scala scende fino al rosso, il pianerottolo va avanti fino al blu. Due volte, e ogni volta le scale sono lunghe diverse.',
    mappa: [
      'P.AAAAAAA',
      'A..AAAAAA',
      'AAr.u.AAA',
      'AAAAA.cAA',
      'AAAAAA..A',
      'AAAAAAAru',
      'AAAAAAAA@',
    ],
    soluzioni: [programma(ripeti(2, ripeti('rosso', 'destra', 'giu'), ripeti('blu', 'destra')), 'giu')],
    fragili: [programma(ripeti(2, ripeti(2, 'destra', 'giu'), ripeti(2, 'destra')), 'giu')] },
  { chiave: 'campo-storto', nome: 'Il campo storto', icona: '🌾', scalino: 'fino',
    portata: 64, premio: 16, tema: 'estate', carte: ['ripeti', 'fino'], zaino: 9,
    racconto: 'Il campo arato, ma storto: i solchi sono lunghi uguali e il passaggio fra un fosso e l\'altro è ogni volta in un posto diverso. Il programma del campo dritto qui cade nel fosso, e quello con la lastra rossa passa.',
    mappa: [
      'P....r...',
      '~~~~~.~~~',
      '.r.......',
      '~.~~~~~~~',
      '....c..r.',
      '~~~~~~~.~',
      '..r......',
      '~~.~~~~~~',
      '~~......@',
    ],
    soluzioni: [programma(ripeti(3, ripeti('rosso', 'destra'), ripeti(2, 'giu'),
                                    ripeti('rosso', 'sinistra'), ripeti(2, 'giu')))],
    fragili: [programma(ripeti(3, ripeti(5, 'destra'), ripeti(2, 'giu'),
                                  ripeti(4, 'sinistra'), ripeti(2, 'giu')))] },
  { chiave: 'spirale', nome: 'La spirale', icona: '🐌', scalino: 'fino',
    portata: 66, premio: 16, tema: 'autunno', carte: ['ripeti', 'fino'], zaino: 9,
    racconto: 'La tana è in fondo alla chiocciola. Ogni lato è più corto di quello prima, ma le lastre rosse agli angoli dicono sempre dove girare.',
    mappa: [
      'P.....r',
      'AAAAAA.',
      'r...rA.',
      '.AAA.A.',
      '.A@.rA.',
      '.AAAAA.',
      'r..c..r',
    ],
    soluzioni: [programma(ripeti(2, ripeti('rosso', 'destra'), ripeti('rosso', 'giu'),
                                    ripeti('rosso', 'sinistra'), ripeti('rosso', 'su')))],
    fragili: [programma(ripeti(2, ripeti(6, 'destra'), ripeti(6, 'giu'),
                                  ripeti(6, 'sinistra'), ripeti(4, 'su')))] },

  /* ── gradino 8: il se ──
     Il coniglio decide guardando per terra. Serve dove la strada gira in
     tre versi: «fino a» sa dire quando smettere, non da che parte andare
     dopo. Il «fino a casa» c'è da qui: con il se, si ripete finché non si
     è arrivati. */
  { chiave: 'colline', nome: 'Le colline', icona: '⛰️', scalino: 'se',
    portata: 67, premio: 18, tema: 'estate', carte: ['ripeti', 'fino', 'casa', 'se'], zaino: 6,
    racconto: 'Avanti sempre: se il prato diventa rosso si scende, se diventa giallo si sale. Una scatola sola, e le colline sono tutte diverse. Chi sbaglia verso trova una stradina che sembra buona, e porta allo stagno.',
    mappa: [
      'AAAAAAAAA',
      'AAAA...~A',
      'AA.crAA.@',
      'P.gA.r.gA',
      'AA....gAA',
      'AAAAAA~AA',
    ],
    soluzioni: [programma(ripeti('casa', 'destra', se('rosso', 'giu'), se('giallo', 'su')))],
    fragili: [programma(ripeti('casa', 'destra', se('rosso', 'su'), se('giallo', 'giu'))),
              programma(ripeti('casa', 'destra', se('rosso', 'su'), se('giallo', 'su'))),
              programma(ripeti('casa', 'destra', se('rosso', 'giu')))] },
  { chiave: 'segni', nome: 'Il sentiero dei segni', icona: '🪧', scalino: 'se',
    portata: 68, premio: 18, tema: 'primavera', carte: ['ripeti', 'fino', 'casa', 'se'], zaino: 9,
    racconto: 'Ogni lastra dice dove andare: il rosso giù, il blu avanti, il giallo su. Il coniglio le legge una per una, e il programma è lo stesso per tutto il sentiero. Ma ci sono anche segni che portano fuori strada: chi li legge al contrario sale sulla collina sbagliata, e finisce nello stagno.',
    mappa: [
      'AAuu~AAAA',
      'AArAuurAA',
      'AArAgArAA',
      'PcrAgAurA',
      'AAuugAArA',
      'AArAAAAu@',
      'AA~AAAAAA',
    ],
    soluzioni: [programma('destra', 'destra',
                          ripeti('casa', se('rosso', 'giu'), se('blu', 'destra'), se('giallo', 'su')))],
    fragili: [programma('destra', 'destra', ripeti('casa', se('rosso', 'su'), se('blu', 'destra'), se('giallo', 'giu'))),
              programma('destra', 'destra', ripeti('casa', se('rosso', 'giu'), se('blu', 'giu'), se('giallo', 'su'))),
              programma('destra', 'destra', ripeti('casa', se('rosso', 'giu'), se('blu', 'destra'))),
              programma('destra', 'destra', ripeti('casa', ripeti('rosso', 'destra'), ripeti('blu', 'giu')))] },

  /* ── gradino 9: tutto il mondo ──
     Le regole del mondo e le scatole insieme: sul ghiaccio sono i sassi a
     fermare una scatola che gira, nell'acqua sono i massi a fare il
     ponte a ogni giro, nel fiume si ripete un salto finché non si arriva
     al sasso rosso, e nel bosco ghiacciato si scivola da un segnale
     all'altro leggendoli. */
  { chiave: 'spirale-ghiaccio', nome: 'La spirale di ghiaccio', icona: '🌀', scalino: 'mondo',
    portata: 70, premio: 20, tema: 'inverno', carte: ['ripeti', 'fino'], zaino: 5,
    racconto: 'Sul ghiaccio non servono le lastre: a fermare il coniglio negli angoli ci pensano i sassi. Quattro frecce, e a ogni giro il cerchio si stringe.',
    mappa: [
      'P********',
      'O********',
      '*******O*',
      '**O******',
      '****@O***',
      '*********',
      '*O*******',
      '******O**',
      '***C*****',
    ],
    soluzioni: [programma(ripeti(3, 'destra', 'giu', 'sinistra', 'su'))] },
  { chiave: 'pozze', nome: 'Le pozze', icona: '🪨', scalino: 'mondo',
    portata: 71, premio: 20, tema: 'autunno', carte: ['ripeti', 'fino'], zaino: 5,
    racconto: 'A ogni gradino c\'è una pozza, e sopra la pozza un masso: spinto giù, fa il ponte. La stessa scatola spinge, attraversa e va avanti, quattro volte.',
    mappa: [
      'P..AAAAAA',
      'mA~AAAAAA',
      '~..AAAAAA',
      'AAmAAAAAA',
      'AA~c.AAAA',
      'AAAAmAAAA',
      'AAAA~..AA',
      'AAAAAAmAA',
      'AAAAAA~.@',
    ],
    soluzioni: [programma(ripeti(4, 'giu', 'giu', 'destra', 'destra'))],
    fragili: [programma(ripeti(4, 'destra', 'destra', 'giu', 'giu'))] },
  { chiave: 'fiume-sassi', nome: 'Il fiume dei sassi', icona: '🐸', scalino: 'mondo',
    portata: 72, premio: 20, tema: 'estate', carte: ['ripeti', 'fino'], zaino: 7, salti: true,
    racconto: 'Di sasso in sasso fino a quello rosso, e da lì un salto giù oltre la siepe. Ogni fila ha i suoi sassi, e nessuna è lunga come l\'altra.',
    mappa: [
      'P~.~.~r~~',
      'AAAAAA~AA',
      '~~r~.~.~~',
      'AA~AAAAAA',
      '~~.~c~r~~',
      'AAAAAA~AA',
      'r~.~.~.~~',
      '~AAAAAAAA',
      '@AAAAAAAA',
    ],
    soluzioni: [programma(ripeti(2, ripeti('rosso', 'salto-destra'), 'salto-giu',
                                    ripeti('rosso', 'salto-sinistra'), 'salto-giu'))],
    fragili: [programma(ripeti(2, ripeti(3, 'salto-destra'), 'salto-giu',
                                  ripeti(2, 'salto-sinistra'), 'salto-giu'))] },
  { chiave: 'bosco-ghiacciato', nome: 'Il bosco ghiacciato', icona: '❄️', scalino: 'mondo',
    portata: 74, premio: 20, tema: 'inverno', carte: ['ripeti', 'fino', 'casa', 'se'], zaino: 8,
    racconto: 'I sentieri del bosco sono ghiaccio, e si scivola fino alla prossima lastra: è lei che ferma, ed è lei che dice dove andare dopo. Quattordici scivolate, e un programma solo che le legge tutte. Chi legge il giallo al contrario scivola giù, dritto nel buco del ghiaccio.',
    mappa: [
      'AAAu*urAA',
      'AAA*AA*AA',
      'AAugAA*AA',
      'AA*AAArAA',
      'AA*AAACAA',
      'P*gAAArAA',
      'AA*AAArAA',
      'AA*AAAurA',
      'AA~AAAArA',
      'AAAAAAA*A',
      'AAAAAAAu@',
    ],
    soluzioni: [programma('destra',
                          ripeti('casa', se('rosso', 'giu'), se('blu', 'destra'), se('giallo', 'su')))],
    fragili: [programma('destra', ripeti('casa', se('rosso', 'su'), se('blu', 'destra'), se('giallo', 'giu'))),
              programma('destra', ripeti('casa', ripeti('giallo', 'destra'), ripeti('blu', 'su')))] },
]

export const QUANTE_TAPPE = CAMPAGNA.length
/* le tappe dei piccoli: tutte quelle senza zaino, che vengono per prime */
export const TAPPE_PICCOLE = CAMPAGNA.findIndex(t => t.zaino)
export const TAPPE_ZAINO = QUANTE_TAPPE - TAPPE_PICCOLE
/* le tappe dei primi cinque gradini, fino alle buche. Il sentiero senza
   fine si apre alla fine di queste — non dopo le pecore, e non a campagna
   finita: è il sentiero dei piccoli, e chiuderlo dietro a un gradino
   nuovo vorrebbe dire toglierlo a chi l'aveva già. Per lo stesso motivo
   ci si fermano i traguardi di prima: una soglia che si allunga con la
   campagna fa tornare d'argento l'oro di chi le aveva finite tutte */
export const TAPPE_PRIME = CAMPAGNA.findIndex(t => t.scalino === 'pecore')

/* ═══════════ quando la fila cambia ═══════════
   Le stelle stanno sotto **l'indice** della tappa (è la forma di tutte
   le campagne, `giochi/campagne.js`), e il 25 settembre 2026 fra le buche
   e lo zaino sono arrivate le pecore: senza travaso le stelle del viale
   sarebbero finite sul primo gregge. Ogni fila che è stata giocata resta
   scritta qui, e il profilo dice quale conosce (`cfg.fila`).

   Il travaso rimette le stelle al loro livello per chiave, e la tappa
   raggiunta **resta la stessa tappa**: chi era allo zaino resta allo
   zaino, e le pecore gli si aprono alle spalle, da giocare quando vuole.
   È il contrario del costruttore, dove un livello nuovo in mezzo si fa
   prima di andare avanti: lì un bambino che stava giocando il viale se
   lo ritroverebbe chiuso dietro a sei livelli nuovi, e un livello che
   ieri c'era e oggi no è la cosa che non deve succedere. */
export const FILE = {
  1: ['prato', 'cespuglio', 'stagno', 'bosco', 'orto',
      'ruscello', 'tronco', 'fosso', 'recinto', 'fiume',
      'laghetto', 'freno', 'rotto', 'fiume-gelato', 'labirinto', 'crepa',
      'masso', 'ponte', 'masso-ghiaccio', 'due-massi',
      'buche', 'buca-ghiaccio', 'colori', 'tutto',
      'viale', 'stagno-grande', 'scala', 'sassi-fiume', 'lago-gradini', 'collina', 'terrazze', 'campo-arato',
      'gradini-storti', 'pianerottoli', 'campo-storto', 'spirale',
      'colline', 'segni',
      'spirale-ghiaccio', 'pozze', 'fiume-sassi', 'bosco-ghiacciato'],
}
FILE[2] = CAMPAGNA.map(t => t.chiave)
export const FILA_ATTUALE = 2

export function riordina(av, vecchia, nuova = CAMPAGNA.map(t => t.chiave)) {
  const stelle = {}
  for (const [i, s] of Object.entries((av && av.stelle) || {})) {
    const j = nuova.indexOf(vecchia[Number(i)])
    if (j >= 0 && s > 0) stelle[j] = s
  }
  /* la prossima da giocare era questa: resta lei. Finita la fila vecchia,
     si è arrivati dopo il suo ultimo livello */
  const fatte = Math.max(0, Math.min((av && av.tappa) || 0, vecchia.length))
  const qui = fatte < vecchia.length ? nuova.indexOf(vecchia[fatte])
    : nuova.indexOf(vecchia[vecchia.length - 1]) + 1
  const tappa = qui >= 0 ? qui : fatte
  return { stelle, tappa, libera: tappa >= nuova.length }
}

export const tappeDelloScalino = chiave =>
  CAMPAGNA.map((t, i) => ({ ...t, indice: i })).filter(t => t.scalino === chiave)

/* ── LA CAMPAGNA SCRITTA BENE ──
   Solo quello che si vede senza giocare: le chiavi, i campi, le mappe
   leggibili, gli scalini in fila, i premi e la portata che salgono. Se
   un livello **si vince**, e se ha bisogno della sua regola, lo dice il
   risolutore nel test — il dato non sa niente del motore. */
/* Lo zaino e le carte di un livello, senza giocarlo: le carte esistono,
   lo zaino è un numero sensato, e ogni soluzione scritta è una fila ben
   fatta, con le mosse che il livello mette in mano, e ci sta. Se una
   soluzione **vince**, e se il ciclo **serve**, lo dice il test. */
function guastiDelloZaino(t, dove) {
  const guasti = []
  if (!t.zaino && !t.carte && !t.soluzioni) return guasti
  if (!Number.isInteger(t.zaino) || t.zaino < 2 || t.zaino > 12)
    guasti.push(`${dove}: lo zaino ${t.zaino} non è un numero da 2 a 12`)
  for (const c of t.carte || [])
    if (!CARTE[c]) guasti.push(`${dove}: la carta «${c}» non esiste`)
  if (!(t.soluzioni || []).length) guasti.push(`${dove}: con lo zaino servono le soluzioni scritte`)
  const mosse = Object.keys(MOSSE).filter(m => t.salti || !m.startsWith('salto-'))
  for (const [k, sol] of [...(t.soluzioni || []).entries(), ...(t.fragili || []).map((f, k) => [`fragile ${k + 1}`, f])]) {
    const qui = `${dove}, ${typeof k === 'number' ? `soluzione ${k + 1}` : k}`
    guasti.push(...guastiDellaFila(sol, { mosse, dove: qui }))
    if (typeof k === 'number' && carteDi(sol) > t.zaino)
      guasti.push(`${qui}: ${carteDi(sol)} carte, e lo zaino ne tiene ${t.zaino}`)
  }
  return guasti
}

export function guastiDellaCampagna(campagna = CAMPAGNA) {
  const guasti = []
  const viste = new Set()
  for (const [i, t] of campagna.entries()) {
    const dove = `tappa ${i + 1} («${t.chiave}»)`
    if (viste.has(t.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    viste.add(t.chiave)
    if (!t.nome || !t.racconto || !t.icona) guasti.push(`${dove}: senza nome, racconto o icona`)
    if (!SCALINI.some(s => s.chiave === t.scalino)) guasti.push(`${dove}: lo scalino «${t.scalino}» non esiste`)
    if (!TEMI.includes(t.tema)) guasti.push(`${dove}: il tema «${t.tema}» non esiste`)
    if (!Number.isFinite(t.portata) || t.portata < 0 || t.portata > 100)
      guasti.push(`${dove}: portata ${t.portata} fuori dalla scala 0-100`)
    if (t.scuola) guasti.push(`${dove}: dichiara un pezzo di scuola, e dietro questo gioco non ce n'è`)
    if (!(t.premio >= 1 && t.premio <= 20)) guasti.push(`${dove}: premio ${t.premio} fuori misura`)
    guasti.push(...guastiDellaMappa(t.mappa, dove))
    /* i salti dichiarati da chi ha una staccionata o un tronco da
       scavalcare: senza la seconda fila di frecce quel livello non si
       gioca, e il risolutore lo direbbe solo come «non si vince» */
    if (!t.salti && t.mappa.some(r => /[t-]/.test(r)))
      guasti.push(`${dove}: ha ostacoli bassi ma non accende i salti`)
    guasti.push(...guastiDelloZaino(t, dove))
  }

  /* gli scalini arrivano in fila, nessuno resta vuoto, e la portata e il
     premio non tornano indietro */
  const ordine = SCALINI.map(s => s.chiave)
  const fila = campagna.map(t => ordine.indexOf(t.scalino))
  if (fila.some((n, i) => i > 0 && n < fila[i - 1]))
    guasti.push('gli scalini non sono in fila: una tappa di un gradino viene dopo una del gradino dopo')
  for (const s of SCALINI)
    if (!campagna.some(t => t.scalino === s.chiave)) guasti.push(`lo scalino «${s.chiave}» non ha nemmeno una tappa`)
  /* lo zaino arriva una volta e resta: dopo il primo livello che ce
     l'ha, ce l'hanno tutti, e gli scalini delle carte vengono dopo
     quelli delle regole */
  const primo = campagna.findIndex(t => t.zaino)
  if (primo >= 0 && campagna.slice(primo).some(t => !t.zaino))
    guasti.push('dopo il primo livello con lo zaino, un livello senza')
  for (const [i, t] of campagna.entries()) {
    const s = SCALINI.find(x => x.chiave === t.scalino)
    if (s && !!s.carta !== !!t.zaino)
      guasti.push(`tappa ${i + 1}: lo scalino «${t.scalino}» ${s.carta ? 'vuole' : 'non vuole'} lo zaino`)
    if (s && s.carta && !(t.carte || []).includes(s.carta))
      guasti.push(`tappa ${i + 1}: è del gradino «${s.carta}», e non mette in mano la sua carta`)
  }
  for (let i = 1; i < campagna.length; i++) {
    if (campagna[i].portata < campagna[i - 1].portata)
      guasti.push(`tappa ${i + 1}: la portata scende (${campagna[i - 1].portata} → ${campagna[i].portata})`)
    if (campagna[i].premio < campagna[i - 1].premio)
      guasti.push(`tappa ${i + 1}: il premio scende`)
  }
  return guasti
}

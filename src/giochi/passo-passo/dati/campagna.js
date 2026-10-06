/* LA CAMPAGNA — i posti dei piccoli, e poi lo zaino.
   Vedi docs/passo-passo/regole.md (regole del mondo, cane pastore),
   docs/passo-passo/zaino.md (carte, zaino) e docs/passo-passo/livelli.md
   (i campi di una tappa, le misure di oggi). */
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
    dritta: 'Le pecore scappano dal cane: quando si ferma sulla loro riga o colonna, a due passi, si scansano dall\'altra parte, e una spinge l\'altra. Portale tutte nel recinto.' },
  /* da qui la lingua, e non il mondo: il gradino porta una carta */
  { chiave: 'ripeti', nome: 'Il ripeti', icona: '🔁', carta: 'ripeti',
    dritta: 'Nello zaino ci stanno poche carte: una scatola 🔁 ripete quello che ha dentro.' },
  { chiave: 'fino', nome: 'Fino a', icona: '🚩', carta: 'fino',
    dritta: 'Una scatola che non conta: ripete finché il coniglio non arriva sulla lastra del colore giusto.' },
  { chiave: 'se', nome: 'Il se', icona: '❓', carta: 'se',
    dritta: 'Il coniglio guarda cosa ha sotto i piedi, e decide: la scatola ❓ si fa solo sul colore giusto.' },
  { chiave: 'mondo', nome: 'Tutto il mondo', icona: '🌍', carta: 'ripeti',
    dritta: 'Il ghiaccio, i massi, i salti e i segnali, con tutte le scatole in mano.' },
]

/* i temi sono solo vestito: le regole restano le stesse in ogni stagione */
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

  /* ── gradino 6: il cane pastore (vedi docs/passo-passo/regole.md) ── */
  { chiave: 'primo-gregge', nome: 'Il primo gregge', icona: '🐕', scalino: 'pecore',
    portata: 44, premio: 12, tema: 'primavera',
    racconto: 'Il cane non tocca mai le pecore: gli basta fermarsi a due passi, e loro si scansano dall\'altra parte. Dietro alla pecora, verso il recinto, e lei ci entra da sola. L\'osso chiede un giro: chi ci arriva passandole sotto la manda contro il bosco, e lì si incastra.',
    mappa: [
      'AB....BB',
      'P..p..##',
      '.....BBB',
      '~.c....A',
    ],
    trappole: [['giu', 'destra', 'destra', 'destra']] },
  { chiave: 'altra-parte', nome: 'Dall\'altra parte', icona: '🌾', scalino: 'pecore',
    portata: 44, premio: 12, tema: 'estate',
    racconto: 'Il recinto è in basso, e la pecora ci va solo se il cane le sta sopra. Chi le va incontro dritto la spinge in su, e chi le passa accanto sulla sua riga la spinge di lato: per girarle attorno si passa in diagonale.',
    mappa: [
      '..c..AA',
      '......A',
      '...p...',
      'P......',
      '.......',
      'BB.##BB',
    ],
    trappole: [['su', 'destra', 'destra', 'destra']] },
  { chiave: 'una-spinge', nome: 'Una spinge l\'altra', icona: '🐏', scalino: 'pecore',
    portata: 44, premio: 12, tema: 'primavera',
    racconto: 'Le pecore non sono sassi: una che scappa spinge quella che ha davanti, e si spostano insieme. Prima mettile in fila, poi spingile tutte e due verso il recinto.',
    mappa: [
      'P....B',
      '.p~..#',
      '..p..#',
      'c..B.B',
      '..BB..',
    ],
    trappole: [['giu', 'giu', 'destra']] },
  { chiave: 'curva', nome: 'La curva', icona: '🌳', scalino: 'pecore',
    portata: 44, premio: 12, tema: 'autunno',
    racconto: 'Prima a destra, poi giù: fra una spinta e l\'altra il cane le gira attorno. Chi la spinge troppo in là la mette contro il bordo del prato, e da lì non torna più.',
    mappa: [
      'A.......',
      'P..p....',
      '........',
      'BBB.B...',
      '~~~cB.#B',
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
  { chiave: 'galleria', nome: 'La galleria', icona: '🕳️', scalino: 'pecore',
    portata: 44, premio: 13, tema: 'autunno',
    racconto: 'Di qua dalla siepe c\'è il cane, di là la pecora e il recinto. La buca passa sotto la siepe: il cane sbuca alle spalle della pecora, e da lì la porta dentro. L\'osso sta dalla parte sbagliata, e ci si torna.',
    mappa: [
      'P.1...A',
      '....c..',
      'BBBBBBB',
      '#.p..1.',
      'A.....A',
    ] },
  { chiave: 'guado', nome: 'Il guado', icona: '💧', scalino: 'pecore',
    portata: 44, premio: 13, tema: 'estate', salti: true,
    racconto: 'Due pecore di là dal fiume, e il recinto è di là. Loro non saltano e non nuotano; il cane il fiume lo salta — ma dove atterra conta, perché lo vedono anche da sopra l\'acqua.',
    mappa: [
      'A.~....',
      '..~..p.',
      'P.~....',
      '..~.p..',
      'A.~c.B#',
    ],
    trappole: [['destra', 'salto-destra', 'destra']] },
  { chiave: 'lago-gelato', nome: 'Il lago gelato', icona: '⛸️', scalino: 'pecore',
    portata: 44, premio: 13, tema: 'inverno',
    racconto: 'Sul lago scivolano tutti e due: la pecora fino all\'erba, il cane fino al sasso. Prima di spingerla, guarda dove si fermerà lei, e dove ti fermerai tu.',
    mappa: [
      'B.....B',
      'P.p****',
      '.****O*',
      '.******',
      'B...c#B',
    ],
    trappole: [['giu', 'destra', 'sinistra', 'su']] },
  { chiave: 'riunire', nome: 'Riunire il gregge', icona: '🌾', scalino: 'pecore',
    portata: 44, premio: 14, tema: 'estate',
    racconto: 'Tre pecore sparse per il prato, ognuna per conto suo. Il cane le riunisce: una spinta le mette in fila, e una fila entra tutta insieme. Da quale cominci?',
    mappa: [
      'cA....P',
      '.....p.',
      '.p....B',
      '...p..#',
      '......#',
      'B..A..B',
    ],
    trappole: [['sinistra', 'giu', 'giu', 'giu']] },
  { chiave: 'ponte-pecore', nome: 'Il ponte per le pecore', icona: '🌉', scalino: 'pecore',
    portata: 44, premio: 14, tema: 'autunno',
    racconto: 'La pecora non passa l\'acqua, e il recinto è di là. Prima il masso nel fosso — due spinte — e il ponte c\'è; poi la pecora si porta sopra il ponte, e di là la aspetta il recinto. Chi spinge la pecora prima del masso la mette contro l\'acqua.',
    mappa: [
      'A.c...A',
      'P..m...',
      '....p..',
      '~~~~~~~',
      'A..#..A',
    ],
    trappole: [['giu', 'destra', 'destra', 'destra']] },
  { chiave: 'gregge', nome: 'Il gregge', icona: '🐑', scalino: 'pecore',
    portata: 44, premio: 14, tema: 'estate',
    racconto: 'Quattro pecore sparse, e un recinto col cancello da una parte sola. Il cane le mette insieme a coppie e a file, e le porta dentro: ogni spinta sposta un pezzetto di gregge.',
    mappa: [
      '.BA.A.P',
      '.....p.',
      '..p..cB',
      '...p..#',
      '.p....#',
      '......B',
    ],
    trappole: [['giu', 'sinistra', 'sinistra', 'sinistra', 'sinistra']] },

  /* ── gradino 7: il ripeti ── */
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
  { chiave: 'stalle', nome: 'Le stalle', icona: '🛖', scalino: 'ripeti',
    portata: 46, premio: 14, tema: 'primavera', carte: ['ripeti'], zaino: 2,
    racconto: 'Il cane passa lungo il corridoio, e ogni pecora che gli sta accanto, sopra o sotto, scende nella sua stalla. Nello zaino ci stanno due carte: una scatola, e la freccia da ripetere.',
    mappa: [
      'A#A#A#A#A',
      '.p.p.p.p.',
      'Pc.......',
      '..p...p..',
      'AA#AAA#AA',
    ],
    soluzioni: [programma(ripeti(7, 'destra'))],
    fragili: [programma(ripeti(5, 'destra'))] },
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

  /* ── gradino 7: fino a (vedi «Le false piste» in docs/passo-passo/zaino.md) ── */
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
  { chiave: 'stalle-gradini', nome: 'Le stalle a gradini', icona: '🪜', scalino: 'fino',
    portata: 61, premio: 16, tema: 'estate', carte: ['ripeti', 'fino'], zaino: 5,
    racconto: 'Due corridoi di stalle, uno più lungo dell\'altro: il cane va avanti finché non arriva sulla lastra rossa, e scende al corridoio dopo. Con un numero, uno dei due corridoi va storto: nel primo si sbatte, nel secondo si scende troppo presto.',
    mappa: [
      'A#A#AAAAA',
      'Ap.pAAAAA',
      'P.crAAAAA',
      'AAA.AAAAA',
      'AAA.....r',
      'AAAAApAp.',
      'AAAAA#A#.',
    ],
    soluzioni: [programma(ripeti(2, ripeti('rosso', 'destra'), 'giu', 'giu'))],
    fragili: [programma(ripeti(2, ripeti(3, 'destra'), 'giu', 'giu')),
              programma(ripeti(2, ripeti(4, 'destra'), 'giu', 'giu'))] },
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

  /* ── gradino 8: il se ── */
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
  { chiave: 'nicchie', nome: 'Le nicchie', icona: '🧱', scalino: 'se',
    portata: 68, premio: 18, tema: 'autunno', carte: ['ripeti', 'fino', 'casa', 'se'], zaino: 8,
    racconto: 'Nel corridoio le lastre dicono dove c\'è una pecora da spingere in fondo alla sua nicchia: il rosso sotto, il blu sopra. Passandole davanti lei fa un passo, ma la stalla è più in fondo: il cane ci entra, e torna. Un programma solo per tutto il corridoio; chi scambia i colori infila il muso nella siepe.',
    mappa: [
      'AAA#AAAA#',
      'AAA.AAAA.',
      'AAApAAAAp',
      'P.cu.r.ru',
      'AAAAApAp.',
      'AAAAA.A.A',
      'AAAAA#A#A',
    ],
    soluzioni: [programma(ripeti('casa', 'destra', se('rosso', 'giu', 'su'), se('blu', 'su', 'giu')))],
    fragili: [programma(ripeti('casa', 'destra', se('rosso', 'su', 'giu'), se('blu', 'giu', 'su'))),
              programma(ripeti('casa', 'destra', se('rosso', 'giu', 'su')))] },

  /* ── gradino 9: tutto il mondo ── */
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
  { chiave: 'lago-stalle', nome: 'Il lago delle stalle', icona: '🧊', scalino: 'mondo',
    portata: 73, premio: 20, tema: 'inverno', carte: ['ripeti', 'fino'], zaino: 7,
    racconto: 'Tre pecore, tre strisce di ghiaccio con un\'isola d\'erba in mezzo. La prima spinta la manda sull\'isola; la seconda gliela dà il cane scivolandole dietro, e lei arriva nella stalla. Poi il cane torna indietro e scende: tre volte la stessa cosa.',
    mappa: [
      'P.......',
      '.p**.**#',
      '.AAAAAAA',
      '.p**.**#',
      'cAAAAAAA',
      '.p**.**#',
      'A......A',
    ],
    soluzioni: [programma(ripeti(3, 'giu', 'destra', 'destra', 'sinistra', 'sinistra', 'giu'))],
    fragili: [programma(ripeti(3, 'giu', 'giu')),
              programma(ripeti(3, 'giu', 'destra', 'sinistra', 'giu'))] },
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
/* la fine delle buche: qui si apre il sentiero senza fine e qui si
   fermano i traguardi di prima (vedi docs/passo-passo/sentiero.md) */
export const TAPPE_PRIME = CAMPAGNA.findIndex(t => t.scalino === 'pecore')

/* le stelle stanno sotto l'indice della tappa: inserire una tappa in
   mezzo senza travaso le sposta sul livello sbagliato. Vedi «Quando la
   fila cambia» in docs/passo-passo/livelli.md. */
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
FILE[2] = [...FILE[1].slice(0, 24),
  'primo-gregge', 'altra-parte', 'curva', 'pecora-ghiaccio', 'due-in-fila', 'gregge',
  ...FILE[1].slice(24)]
FILE[3] = [...FILE[1].slice(0, 24),
  'primo-gregge', 'altra-parte', 'curva', 'due-in-fila', 'pecora-ghiaccio', 'galleria', 'guado',
  'lago-gelato', 'ponte-pecore', 'gregge',
  'viale', 'stalle', ...FILE[1].slice(25, 33), 'stalle-gradini', ...FILE[1].slice(33, 38),
  'nicchie', ...FILE[1].slice(38, 41), 'lago-stalle', FILE[1][41]]
FILE[4] = CAMPAGNA.map(t => t.chiave)
export const FILA_ATTUALE = 4

export function riordina(av, vecchia, nuova = CAMPAGNA.map(t => t.chiave)) {
  const stelle = {}
  for (const [i, s] of Object.entries((av && av.stelle) || {})) {
    const j = nuova.indexOf(vecchia[Number(i)])
    if (j >= 0 && s > 0) stelle[j] = s
  }
  /* la prossima da giocare resta la stessa tappa; finita la fila vecchia,
     si è arrivati dopo il suo ultimo livello */
  const fatte = Math.max(0, Math.min((av && av.tappa) || 0, vecchia.length))
  const qui = fatte < vecchia.length ? nuova.indexOf(vecchia[fatte])
    : nuova.indexOf(vecchia[vecchia.length - 1]) + 1
  const tappa = qui >= 0 ? qui : fatte
  return { stelle, tappa, libera: tappa >= nuova.length }
}

/* lo zaino, le carte e le soluzioni scritte, senza giocarle: se una
   soluzione vince e se il ciclo serve lo dice il test, non questa funzione */
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

/* solo quello che si vede senza giocare: se un livello si vince, e se ha
   bisogno della sua regola, lo dice il risolutore nel test */
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
    /* senza salti dichiarati un ostacolo basso non si supera mai */
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
  /* lo zaino arriva una volta e resta: dopo il primo livello che ce l'ha, ce l'hanno tutti */
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

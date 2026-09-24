/* ═══════════════════════════════════════════════════════════════════
   I LIVELLI DEL COSTRUTTORE

   Un livello è **un ordine da evadere**: qualcuno chiede una cosa (il
   capomastro, il re, la principessa) e il bambino scrive il programma
   con cui il robot la costruisce. Le mappe sono ASCII (legenda in
   `dati/legenda.js`), i programmi si scrivono con `dati/scrivi.js`.

   ── I CAMPI ───────────────────────────────────────────────────────
     chiave, nome, icona   chi è (la chiave non si rinomina: è il posto
                           dove si salvano le stelle e il programma)
     capitolo              in quale capitolo sta (`CAPITOLI`)
     impara                la cosa nuova, in tre parole: la dice la mappa
     portata               quanto è difficile, sulla scala 0–100 del repo
     premio                le monete della **prima** vittoria
     chi, racconto         chi ordina e cosa dice — l'unica consegna
     prova                 disegno | passaggio (vedi `motore/prova.js`)
     ordini                [{ nome, lavagnette, mappa, robot? }]: le
                           situazioni su cui il programma deve reggere
     cassetta              i blocchi che il livello offre
     colori                i colori della pulsantiera (il primo è il
                           colore di partenza di «metti»)
     posti                 dove si può posare un mattone: di solito solo
                           ↓ sotto i piedi; i lati (↘ ↙) nei livelli che
                           li chiedono — il bosco, il ponte
     misure                se i progetti possono avere misure
     regalo                progetti già scritti che il livello dà in
                           mano (si possono aprire e cambiare)
     aiuti                 frasi, dalla più vaga alla più stretta: sono
                           gratis. Dopo l'ultima c'è «mostrami come»,
                           che costa la seconda stella
     soluzione             un programma che vince tutti gli ordini: lo
                           gioca il banco a ogni giro, e lo mostra
                           «mostrami come»
     fragili               le mosse ingenue e plausibili, ognuna con il
                           suo nome: il banco pretende che **ognuna perda
                           almeno un ordine**. Se una vince, il livello
                           non insegna quello che dichiara — il difetto è
                           un ordine che manca, non un punteggio.

   ── LE REGOLE PER SCRIVERNE UNO ───────────────────────────────────
   1. **Un livello muove una cosa sola.** Il ripeti, poi il ripeti con
      la misura dell'ordine, poi il ripeti dentro il ripeti. Due cose
      nuove insieme vogliono dire due livelli.
   2. **La fatica a mano prima.** Un blocco arriva quando farne a meno
      stanca: il muro da dieci mattoni scritto a mano è venti righe.
   3. **Gli ordini sono la sfida.** Un livello con un ordine solo si
      vince a mano; con due, chi ha scritto il numero dell'ordine al
      posto della lavagnetta perde il secondo — e lo vede.
   4. **Un posto diverso ogni volta**: altri colori, altra forma, un
      altro che ordina. È quello che fa di ventidue livelli ventidue
      posti e non la stessa schermata ventidue volte.
   5. **I colori lavorano.** Un livello a un colore solo va bene per
      imparare un blocco; poi il colore diventa la ragione di una
      decisione (sopra i rossi, le strisce, la scacchiera) o una misura
      (le bandiere).
   ═══════════════════════════════════════════════════════════════════ */
import { fai, guarda, piu, meno, tinta, progetto, programma, POSTI } from './scrivi.js'
import { CHIAVI_COLORI } from './colori.js'
import { LIVELLI_PORTO } from './porto/livelli.js'

/* L'ordine dei capitoli: il «se» viene subito dopo il cantiere. Stava in
   fondo, dopo progetti e lavagnette, e a metà gioco il papà ha notato che
   «ancora non abbiamo introdotto gli if»: una decisione è più semplice di
   una funzione, e coi colori ha qualcosa da decidere fin da subito. */
export const CAPITOLI = [
  { chiave: 'cantiere', nome: 'Il cantiere', icona: '🧱',
    dice: 'Mattoni, passi, colori, e il blocco che ripete.' },
  { chiave: 'guardare', nome: 'Guardare e decidere', icona: '👀',
    dice: 'Il robot guarda prima di fare: se c\'è un mattone rosso… altrimenti…' },
  { chiave: 'progetti', nome: 'I progetti', icona: '📐',
    dice: 'Una cosa si scrive una volta e si usa tante: i progetti, con le loro misure — numeri e colori.' },
  { chiave: 'lavagnette', nome: 'Le lavagnette', icona: '📝',
    dice: 'Un numero con un nome, che cambia mentre il robot lavora.' },
  { chiave: 'porto', nome: 'Il porto', icona: '⚓',
    dice: 'Visto dall\'alto: il robot prende, posa, legge e aspetta, mentre la gru cala, il nastro scorre e i clienti arrivano.' },
  { chiave: 'sfide', nome: 'Le sfide', icona: '🏆',
    dice: 'Tutto insieme: contare, decidere, e un «se» dentro un «se».' },
]

const CAPOMASTRO = { emoji: '👷', nome: 'Il capomastro' }

/* ── i progetti che i livelli regalano già scritti ──
   Sono gli stessi che il bambino ha scritto qualche livello prima: il
   regalo toglie la fatica di riscriverli, non la lezione — la lezione
   del livello è un'altra, e un progetto da rifare distrarrebbe da lei.
   Col robot che cade, una colonna è solo «metti, metti, metti»: a
   riportarlo giù ci pensa il passo dopo. */
const colonna = colore => progetto('colonna', { nome: 'colonna', icona: '🏛️', misure: ['alta'] }, [
  fai.ripeti('alta', [fai.metti(colore)]),
])
/* la riga torna indietro camminandoci sopra: finisce sul suo primo
   mattone, e il piano dopo comincia da lì */
const riga = colore => progetto('riga', { nome: 'riga', icona: '➖', misure: ['lunga'] }, [
  fai.ripeti('lunga', [fai.metti(colore), fai.vai('destra', 1)]),
  fai.vai('sinistra', 'lunga'),
])

const DEL_CANTIERE = [
  /* ═══════════ 1. IL CANTIERE ═══════════ */
  {
    chiave: 'primo-muretto', nome: 'Il primo muretto', icona: '🧱', capitolo: 'cantiere',
    impara: 'mettere e camminare', portata: 54, premio: 6,
    chi: CAPOMASTRO,
    racconto: 'Il primo lavoro è facile: quattro mattoni rossi, uno accanto all\'altro, dove vedi il disegno.',
    prova: 'disegno',
    ordini: [{ nome: 'il muretto', robot: [1, 3], mappa: [
      '.........',
      '.........',
      '.........',
      '.rrrr....',
      '#########',
    ] }],
    cassetta: ['vai', 'metti'], colori: ['rosso'],
    aiuti: [
      'Il robot mette il mattone sotto i piedi, e ci sale sopra.',
      'Poi un passo a destra: dal mattone scende da solo, ed è pronto per il prossimo.',
    ],
    soluzione: programma({ principale: [
      fai.metti('rosso'), fai.vai('destra', 1), fai.metti('rosso'), fai.vai('destra', 1),
      fai.metti('rosso'), fai.vai('destra', 1), fai.metti('rosso'),
    ] }),
    fragili: [
      { nome: 'si dimentica di camminare', programma: programma({ principale: [
        fai.metti('rosso'), fai.metti('rosso'), fai.metti('rosso'), fai.metti('rosso')] }) },
      { nome: 'tre mattoni invece di quattro', programma: programma({ principale: [
        fai.metti('rosso'), fai.vai('destra', 1), fai.metti('rosso'), fai.vai('destra', 1), fai.metti('rosso')] }) },
    ],
  },
  {
    chiave: 'torretta', nome: 'La torretta', icona: '🗼', capitolo: 'cantiere',
    impara: 'salire sui propri mattoni', portata: 55, premio: 6,
    chi: CAPOMASTRO,
    racconto: 'Una torretta: quattro mattoni rossi uno sopra l\'altro, e in cima uno giallo.',
    prova: 'disegno',
    ordini: [{ nome: 'la torretta', robot: [3, 5], mappa: [
      '.......',
      '...g...',
      '...r...',
      '...r...',
      '...r...',
      '...r...',
      '#######',
    ] }],
    cassetta: ['vai', 'metti'], colori: ['rosso', 'giallo'],
    aiuti: [
      'Per salire il robot si mette un mattone sotto i piedi: una torre è metti, metti, metti…',
      'Il colore di un mattone si cambia toccandolo nella riga.',
    ],
    soluzione: programma({ principale: [
      fai.metti('rosso'), fai.metti('rosso'), fai.metti('rosso'), fai.metti('rosso'), fai.metti('giallo'),
    ] }),
    fragili: [
      { nome: 'tutti rossi', programma: programma({ principale: [
        fai.metti('rosso'), fai.metti('rosso'), fai.metti('rosso'), fai.metti('rosso'), fai.metti('rosso')] }) },
      { nome: 'si dimentica la cima', programma: programma({ principale: [
        fai.metti('rosso'), fai.metti('rosso'), fai.metti('rosso'), fai.metti('rosso')] }) },
    ],
  },
  {
    chiave: 'muro-lungo', nome: 'Il muro lungo', icona: '🧱', capitolo: 'cantiere',
    impara: 'ripeti N volte', portata: 57, premio: 10,
    chi: CAPOMASTRO,
    racconto: 'Un muro lungo lungo: dieci mattoni. Scriverne dieci a mano è una noia… c\'è un blocco che ripete.',
    prova: 'disegno',
    ordini: [{ nome: 'dieci mattoni', robot: [1, 3], mappa: [
      '..............',
      '..............',
      '..............',
      '.rrrrrrrrrr...',
      '##############',
    ] }],
    cassetta: ['vai', 'metti', 'ripeti'], colori: ['rosso'],
    aiuti: [
      'Quello che fai per un mattone è sempre uguale: metti, e un passo a destra.',
      '«Ripeti N volte» esegue quello che ha dentro N volte: al posto di N scegli il numero.',
    ],
    soluzione: programma({ principale: [
      fai.ripeti(10, [fai.metti('rosso'), fai.vai('destra', 1)]),
    ] }),
    fragili: [
      { nome: 'ripete una volta di troppo', programma: programma({ principale: [
        fai.ripeti(11, [fai.metti('rosso'), fai.vai('destra', 1)])] }) },
    ],
  },
  {
    chiave: 'quanto-lungo', nome: 'Quanto lungo?', icona: '📏', capitolo: 'cantiere',
    impara: 'la misura dell\'ordine', portata: 59, premio: 10,
    chi: CAPOMASTRO,
    racconto: 'Oggi i muri li ordinano i clienti, e ognuno lo vuole lungo diverso. Quanto? Lo dice la lavagnetta «lungo»: è una N che sceglie il cliente.',
    prova: 'disegno',
    ordini: [
      { nome: 'lungo 4', lavagnette: { lungo: 4 }, robot: [1, 3], mappa: [
        '.............',
        '.............',
        '.............',
        '.bbbb........',
        '#############',
      ] },
      { nome: 'lungo 7', lavagnette: { lungo: 7 }, robot: [1, 3], mappa: [
        '.............',
        '.............',
        '.............',
        '.bbbbbbb.....',
        '#############',
      ] },
      { nome: 'lungo 10', lavagnette: { lungo: 10 }, robot: [1, 3], mappa: [
        '.............',
        '.............',
        '.............',
        '.bbbbbbbbbb..',
        '#############',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti'], colori: ['blu'],
    aiuti: [
      'Il programma deve andare bene per tutti e tre i clienti: tocca i numeri in alto per vedere gli altri muri.',
      'Al posto di N, nella casella di «ripeti», non serve un numero: ci va la lavagnetta «lungo».',
    ],
    soluzione: programma({ principale: [
      fai.ripeti('lungo', [fai.metti('blu'), fai.vai('destra', 1)]),
    ] }),
    fragili: [
      { nome: 'il numero del primo cliente', programma: programma({ principale: [
        fai.ripeti(4, [fai.metti('blu'), fai.vai('destra', 1)])] }) },
    ],
  },
  {
    chiave: 'muro-alto', nome: 'Il muro alto', icona: '🏚️', capitolo: 'cantiere',
    impara: 'ripeti dentro ripeti', portata: 61, premio: 10,
    chi: CAPOMASTRO,
    racconto: 'Un muro largo «largo» e alto «alto». Il robot non vola: si costruisce a colonne, una accanto all\'altra.',
    prova: 'disegno',
    ordini: [
      { nome: '6 × 3', lavagnette: { largo: 6, alto: 3 }, robot: [1, 6], mappa: [
        '..........',
        '..........',
        '..........',
        '..........',
        '.rrrrrr...',
        '.rrrrrr...',
        '.rrrrrr...',
        '##########',
      ] },
      { nome: '4 × 5', lavagnette: { largo: 4, alto: 5 }, robot: [1, 6], mappa: [
        '..........',
        '..........',
        '.rrrr.....',
        '.rrrr.....',
        '.rrrr.....',
        '.rrrr.....',
        '.rrrr.....',
        '##########',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti'], colori: ['rosso'],
    aiuti: [
      'Una colonna è «ripeti alto volte: metti un mattone sotto i piedi».',
      'Finita una colonna, un passo a destra: il robot scende da solo accanto, pronto per la prossima.',
      'Dentro un «ripeti» ci può stare un altro «ripeti»: ripeti «largo» volte la colonna e il passo.',
    ],
    soluzione: programma({ principale: [
      fai.ripeti('largo', [
        fai.ripeti('alto', [fai.metti('rosso')]),
        fai.vai('destra', 1),
      ]),
    ] }),
    fragili: [
      { nome: 'a righe, come un muro lungo', programma: programma({ principale: [
        fai.ripeti('alto', [
          fai.ripeti('largo', [fai.metti('rosso'), fai.vai('destra', 1)])])] }) },
      { nome: 'le misure del primo muro', programma: programma({ principale: [
        fai.ripeti(6, [fai.ripeti(3, [fai.metti('rosso')]), fai.vai('destra', 1)])] }) },
    ],
  },
  {
    chiave: 'torta', nome: 'La torta a strati', icona: '🎂', capitolo: 'cantiere',
    impara: 'tanti colori in una colonna', portata: 62, premio: 10,
    chi: { emoji: '🧑‍🍳', nome: 'Il pasticcere' },
    racconto: 'Una torta larga «larga»: sotto il cioccolato, in mezzo la panna, sopra le fragole. Ogni fetta è una colonna di tre strati.',
    prova: 'disegno',
    ordini: [
      { nome: 'larga 4', lavagnette: { larga: 4 }, robot: [1, 4], mappa: [
        '..........',
        '..........',
        '.rrrr.....',
        '.wwww.....',
        '.mmmm.....',
        '##########',
      ] },
      { nome: 'larga 7', lavagnette: { larga: 7 }, robot: [1, 4], mappa: [
        '..........',
        '..........',
        '.rrrrrrr..',
        '.wwwwwww..',
        '.mmmmmmm..',
        '##########',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti'], colori: ['marrone', 'bianco', 'rosso'],
    aiuti: [
      'Una fetta di torta è una colonna: marrone, bianco, rosso, dal basso in su.',
      'Il colore di un mattone si sceglie toccando il quadratino nella riga.',
      'Ripeti «larga» volte: i tre mattoni della fetta, e un passo a destra.',
    ],
    soluzione: programma({ principale: [
      fai.ripeti('larga', [fai.metti('marrone'), fai.metti('bianco'), fai.metti('rosso'), fai.vai('destra', 1)]),
    ] }),
    fragili: [
      { nome: 'gli strati al contrario', programma: programma({ principale: [
        fai.ripeti('larga', [fai.metti('rosso'), fai.metti('bianco'), fai.metti('marrone'), fai.vai('destra', 1)])] }) },
      { nome: 'la torta del primo ordine', programma: programma({ principale: [
        fai.ripeti(4, [fai.metti('marrone'), fai.metti('bianco'), fai.metti('rosso'), fai.vai('destra', 1)])] }) },
    ],
  },
  /* ═══════════ 2. GUARDARE E DECIDERE ═══════════ */
  {
    chiave: 'sui-rossi', nome: 'Sui mattoni rossi', icona: '🐦', capitolo: 'guardare',
    impara: 'se c\'è…', portata: 63, premio: 12,
    chi: { emoji: '🐦', nome: 'Il passerotto' },
    racconto: 'Sul pavimento ci sono mattoni rossi e blu. Sopra ogni mattone rosso voglio un mattone giallo, per farci il nido. Sopra i blu, niente.',
    prova: 'disegno',
    ordini: [
      { nome: 'il primo pavimento', mappa: [
        '..........',
        '..........',
        '.g.gg..g..',
        '@RBRRBBRB.',
        '##########',
      ] },
      { nome: 'il secondo pavimento', mappa: [
        '..........',
        '..........',
        '..g..gg.g.',
        '@BRBBRRBR.',
        '##########',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'se'], colori: ['giallo'],
    aiuti: [
      'Il robot cammina sul pavimento: dopo ogni passo può guardare cosa ha sotto i piedi.',
      '«Se» fa quello che ha dentro solo quando la domanda è vera: «se sotto i piedi c\'è un mattone rosso».',
      'Ripeti 8 volte: un passo a destra, e se sotto i piedi c\'è un mattone rosso, metti un mattone giallo.',
    ],
    soluzione: programma({ principale: [
      fai.ripeti(8, [fai.vai('destra', 1), fai.se(guarda('sotto', 'mattone', true, 'rosso'), [fai.metti('giallo')])]),
    ] }),
    fragili: [
      { nome: 'un mattone giallo dappertutto', programma: programma({ principale: [
        fai.ripeti(8, [fai.vai('destra', 1), fai.metti('giallo')])] }) },
      { nome: 'i rossi del primo pavimento, a mano', programma: programma({ principale: [
        fai.vai('destra', 1), fai.metti('giallo'), fai.vai('destra', 2), fai.metti('giallo'),
        fai.vai('destra', 1), fai.metti('giallo'), fai.vai('destra', 3), fai.metti('giallo')] }) },
    ],
  },
  {
    chiave: 'rosso-su-rosso', nome: 'Rosso sopra rosso', icona: '🎨', capitolo: 'guardare',
    impara: 'se… altrimenti', portata: 64, premio: 12,
    chi: { emoji: '🧑‍🎨', nome: 'La mosaicista' },
    racconto: 'Ricopiami il pavimento, un piano più su: sopra ogni rosso un rosso, sopra ogni blu un blu. E ogni stanza ha il suo pavimento.',
    prova: 'disegno',
    ordini: [
      { nome: 'la stanza grande', mappa: [
        '..........',
        '..........',
        '.rrbrbbrr.',
        '@RRBRBBRR.',
        '##########',
      ] },
      { nome: 'la stanza piccola', mappa: [
        '..........',
        '..........',
        '.brbrrbbr.',
        '@BRBRRBBR.',
        '##########',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'se'], colori: ['rosso', 'blu'],
    aiuti: [
      'Stavolta si fa sempre qualcosa: un mattone rosso OPPURE uno blu. Tocca la riga del «se» e aggiungi «altrimenti».',
      '«Se sotto i piedi c\'è un mattone rosso: metti rosso — altrimenti: metti blu».',
      'Tutto dentro un «ripeti 8 volte», dopo un passo a destra.',
    ],
    soluzione: programma({ principale: [
      fai.ripeti(8, [fai.vai('destra', 1),
        fai.se(guarda('sotto', 'mattone', true, 'rosso'), [fai.metti('rosso')], [fai.metti('blu')])]),
    ] }),
    fragili: [
      { nome: 'sempre rosso', programma: programma({ principale: [
        fai.ripeti(8, [fai.vai('destra', 1), fai.metti('rosso')])] }) },
      { nome: 'solo il se, senza altrimenti', programma: programma({ principale: [
        fai.ripeti(8, [fai.vai('destra', 1), fai.se(guarda('sotto', 'mattone', true, 'rosso'), [fai.metti('rosso')])])] }) },
    ],
  },
  {
    chiave: 'buchi', nome: 'I buchi nel muro', icona: '🕳️', capitolo: 'guardare',
    impara: 'se c\'è…', portata: 65, premio: 12,
    chi: CAPOMASTRO,
    racconto: 'Il muro vecchio ha dei buchi, e ogni muro li ha in posti diversi. Il robot ci cammina sopra: dove c\'è un buco ci cade dentro, e lì ci va un mattone.',
    prova: 'disegno',
    ordini: [
      { nome: 'il muro della piazza', mappa: [
        '.............',
        '.............',
        '.............',
        '@RRrRRrrRRR..',
        '#############',
      ] },
      { nome: 'il muro del pozzo', mappa: [
        '.............',
        '.............',
        '.............',
        '@RrRrRRRRrr..',
        '#############',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'se'], colori: ['rosso'],
    aiuti: [
      'Camminando sul muro, dove c\'è un buco il robot ci cade dentro: sotto i piedi allora ha il terreno, non un mattone.',
      '«Se» fa quello che ha dentro solo quando la domanda è vera: «se sotto i piedi c\'è il terreno».',
      'Ripeti 10 volte: un passo a destra, e se sotto i piedi c\'è il terreno metti un mattone.',
    ],
    soluzione: programma({ principale: [
      fai.ripeti(10, [fai.vai('destra', 1), fai.se(guarda('sotto', 'terreno'), [fai.metti('rosso')])]),
    ] }),
    fragili: [
      { nome: 'un mattone dappertutto', programma: programma({ principale: [
        fai.ripeti(10, [fai.vai('destra', 1), fai.metti('rosso')])] }) },
      { nome: 'i buchi del primo muro, a mano', programma: programma({ principale: [
        fai.vai('destra', 3), fai.metti('rosso'), fai.vai('destra', 3), fai.metti('rosso'),
        fai.vai('destra', 1), fai.metti('rosso')] }) },
    ],
  },
  {
    chiave: 'strisce', nome: 'Il tendone a strisce', icona: '🎪', capitolo: 'guardare',
    impara: 'guardare il mattone di prima', portata: 66, premio: 15,
    chi: { emoji: '🤹', nome: 'Il giocoliere' },
    racconto: 'Per il circo mi serve un muro a strisce lungo «lungo»: rosso, giallo, rosso, giallo… Il robot guarda il mattone che ha appena messo, lì a sinistra.',
    prova: 'disegno',
    ordini: [
      { nome: 'lungo 7', lavagnette: { lungo: 7 }, robot: [1, 3], mappa: [
        '..............',
        '..............',
        '..............',
        '.rgrgrgr......',
        '##############',
      ] },
      { nome: 'lungo 10', lavagnette: { lungo: 10 }, robot: [1, 3], mappa: [
        '..............',
        '..............',
        '..............',
        '.rgrgrgrgrg...',
        '##############',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'se'], colori: ['rosso', 'giallo'],
    aiuti: [
      'Quale colore tocca adesso dipende da quello prima: il robot, a terra accanto al muro, lo vede «a sinistra».',
      'Se a sinistra c\'è un mattone rosso tocca il giallo; altrimenti — anche all\'inizio, quando a sinistra non c\'è niente — il rosso.',
      'Ripeti «lungo» volte: il «se… altrimenti», e un passo a destra.',
    ],
    soluzione: programma({ principale: [
      fai.ripeti('lungo', [
        fai.se(guarda('sinistra', 'mattone', true, 'rosso'), [fai.metti('giallo')], [fai.metti('rosso')]),
        fai.vai('destra', 1),
      ]),
    ] }),
    fragili: [
      { nome: 'le strisce del primo ordine, a mano', programma: programma({ principale: [
        fai.metti('rosso'), fai.vai('destra', 1), fai.metti('giallo'), fai.vai('destra', 1),
        fai.metti('rosso'), fai.vai('destra', 1), fai.metti('giallo'), fai.vai('destra', 1),
        fai.metti('rosso'), fai.vai('destra', 1), fai.metti('giallo'), fai.vai('destra', 1),
        fai.metti('rosso')] }) },
      { nome: 'a coppie, rosso e giallo', programma: programma({ principale: [
        fai.ripeti('lungo', [fai.metti('rosso'), fai.vai('destra', 1), fai.metti('giallo'), fai.vai('destra', 1)])] }) },
    ],
  },
  {
    chiave: 'ponte', nome: 'Il ponte', icona: '🌉', capitolo: 'guardare',
    impara: 'ripeti finché…', portata: 68, premio: 15,
    chi: { emoji: '🧑‍🌾', nome: 'Il contadino' },
    racconto: 'Devo passare il fiume, e ogni giorno è largo diverso. Costruisci il ponte, e smetti quando arrivi alla terra dell\'altra riva.',
    prova: 'passaggio',
    ordini: [
      { nome: 'largo 3', mappa: [
        '..............',
        '..............',
        '..............',
        '..............',
        'P..@.........F',
        '####~~~#######',
        '####~~~#######',
      ] },
      { nome: 'largo 5', mappa: [
        '..............',
        '..............',
        '..............',
        '..............',
        'P..@.........F',
        '####~~~~~#####',
        '####~~~~~#####',
      ] },
      { nome: 'largo 6', mappa: [
        '..............',
        '..............',
        '..............',
        '..............',
        'P..@.........F',
        '####~~~~~~####',
        '####~~~~~~####',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'finche'], colori: ['marrone'],
    posti: ['sotto', 'giu-destra', 'giu-sinistra'],
    aiuti: [
      'Quanto è largo il fiume non lo dice nessuno: il robot lo deve scoprire guardando.',
      'Un mattone ↘ in basso a destra va proprio dove appoggerà il piede: un pezzo di ponte.',
      '«Ripeti · smetti quando ↘ in basso a destra c\'è il terreno»: dentro, metti un mattone in basso a destra e fai un passo.',
    ],
    soluzione: programma({ principale: [
      fai.finche(guarda('giu-destra', 'terreno'), [fai.metti('marrone', 'giu-destra'), fai.vai('destra', 1)]),
    ] }),
    fragili: [
      { nome: 'il ponte del primo giorno', programma: programma({ principale: [
        fai.ripeti(3, [fai.metti('marrone', 'giu-destra'), fai.vai('destra', 1)])] }) },
      { nome: 'il ponte più lungo, sempre', programma: programma({ principale: [
        fai.ripeti(6, [fai.metti('marrone', 'giu-destra'), fai.vai('destra', 1)])] }) },
    ],
  },
  /* ═══════════ 3. I PROGETTI ═══════════ */
  {
    chiave: 'bosco', nome: 'Il bosco', icona: '🌳', capitolo: 'progetti',
    impara: 'un progetto', portata: 70, premio: 15,
    chi: { emoji: '🧚', nome: 'La guardiana del bosco' },
    racconto: 'Piantami gli alberi: tutti uguali, quanti ne dice «alberi». Un albero si scrive una volta sola: fanne un progetto, e chiamalo.',
    prova: 'disegno',
    ordini: [
      { nome: '3 alberi', lavagnette: { alberi: 3 }, robot: [2, 5], mappa: [
        '...............',
        '...............',
        '..v...v...v....',
        '.vvv.vvv.vvv...',
        '..m...m...m....',
        '..m...m...m....',
        '###############',
      ] },
      { nome: '2 alberi', lavagnette: { alberi: 2 }, robot: [2, 5], mappa: [
        '...............',
        '...............',
        '..v...v........',
        '.vvv.vvv.......',
        '..m...m........',
        '..m...m........',
        '###############',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'progetti'], colori: ['marrone', 'verde'],
    posti: ['sotto', 'giu-destra', 'giu-sinistra'],
    aiuti: [
      'Tocca «＋ progetto», chiamalo «albero» e scrivici dentro un albero solo: il tronco sono due mattoni sotto i piedi.',
      'La chioma: un mattone sotto i piedi, poi uno ↙ in basso a sinistra e uno ↘ in basso a destra — dove andrebbero i piedi — e in cima un altro sotto i piedi.',
      'Poi nel programma principale: ripeti «alberi» volte — l\'albero, e quattro passi a destra.',
    ],
    soluzione: programma({
      progetti: [progetto('albero', { nome: 'albero', icona: '🌳' }, [
        fai.metti('marrone'), fai.metti('marrone'),
        fai.metti('verde'), fai.metti('verde', 'giu-sinistra'), fai.metti('verde', 'giu-destra'),
        fai.metti('verde'),
      ])],
      principale: [fai.ripeti('alberi', [fai.chiama('albero'), fai.vai('destra', 4)])],
    }),
    fragili: [
      { nome: 'la chioma senza i lati', programma: programma({
        progetti: [progetto('albero', { nome: 'albero', icona: '🌳' }, [
          fai.metti('marrone'), fai.metti('marrone'), fai.metti('verde'), fai.metti('verde')])],
        principale: [fai.ripeti('alberi', [fai.chiama('albero'), fai.vai('destra', 4)])] }) },
      { nome: 'sempre tre alberi', programma: programma({
        progetti: [progetto('albero', { nome: 'albero', icona: '🌳' }, [
          fai.metti('marrone'), fai.metti('marrone'),
          fai.metti('verde'), fai.metti('verde', 'giu-sinistra'), fai.metti('verde', 'giu-destra'),
          fai.metti('verde')])],
        principale: [fai.ripeti(3, [fai.chiama('albero'), fai.vai('destra', 4)])] }) },
    ],
  },
  {
    chiave: 'tempio', nome: 'Il tempio', icona: '🏛️', capitolo: 'progetti',
    impara: 'un progetto con una misura', portata: 71, premio: 15,
    chi: { emoji: '🧝', nome: 'La sacerdotessa' },
    racconto: 'Il tempio vuole tre colonne, alte quanto dicono «prima», «seconda» e «terza». Tre colonne, un progetto solo: dagli una misura, «alta».',
    prova: 'disegno',
    ordini: [
      { nome: '2 · 4 · 3', lavagnette: { prima: 2, seconda: 4, terza: 3 }, robot: [1, 6], mappa: [
        '........',
        '........',
        '........',
        '...w....',
        '...w.w..',
        '.w.w.w..',
        '.w.w.w..',
        '########',
      ] },
      { nome: '5 · 1 · 3', lavagnette: { prima: 5, seconda: 1, terza: 3 }, robot: [1, 6], mappa: [
        '........',
        '........',
        '.w......',
        '.w......',
        '.w...w..',
        '.w...w..',
        '.w.w.w..',
        '########',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'progetti'], colori: ['bianco'], misure: true,
    aiuti: [
      'Crea il progetto «colonna» e dagli una misura: «alta». Dentro, al posto di N, usa «alta».',
      'Una colonna è: ripeti «alta» volte, metti un mattone sotto i piedi. A scenderne ci pensa il passo dopo.',
      'Nel programma principale la colonna si chiama tre volte, ognuna con la sua misura — «prima», «seconda», «terza» — e fra una e l\'altra due passi a destra.',
    ],
    soluzione: programma({
      progetti: [colonna('bianco')],
      principale: [
        fai.chiama('colonna', 'prima'), fai.vai('destra', 2),
        fai.chiama('colonna', 'seconda'), fai.vai('destra', 2),
        fai.chiama('colonna', 'terza'),
      ],
    }),
    fragili: [
      { nome: 'colonne attaccate', programma: programma({
        progetti: [colonna('bianco')],
        principale: [
          fai.chiama('colonna', 'prima'), fai.vai('destra', 1),
          fai.chiama('colonna', 'seconda'), fai.vai('destra', 1),
          fai.chiama('colonna', 'terza')] }) },
      { nome: 'le altezze del primo tempio', programma: programma({
        progetti: [colonna('bianco')],
        principale: [
          fai.chiama('colonna', 2), fai.vai('destra', 2),
          fai.chiama('colonna', 4), fai.vai('destra', 2),
          fai.chiama('colonna', 3)] }) },
    ],
  },
  {
    chiave: 'castello', nome: 'Il castello', icona: '🏰', capitolo: 'progetti',
    impara: 'due misure', portata: 72, premio: 15,
    chi: { emoji: '🤴', nome: 'Il re' },
    racconto: 'Voglio un castello: due torri larghe 2 e alte «torri», e in mezzo un muro largo «muro» e alto 3. Il muro alto di prima, adesso, è un progetto con due misure.',
    prova: 'disegno',
    ordini: [
      { nome: 'torri 5 · muro 4', lavagnette: { torri: 5, muro: 4 }, robot: [1, 7], mappa: [
        '.............',
        '.............',
        '.............',
        '.kk....kk....',
        '.kk....kk....',
        '.kkkkkkkk....',
        '.kkkkkkkk....',
        '.kkkkkkkk....',
        '#############',
      ] },
      { nome: 'torri 6 · muro 6', lavagnette: { torri: 6, muro: 6 }, robot: [1, 7], mappa: [
        '.............',
        '.............',
        '.kk......kk..',
        '.kk......kk..',
        '.kk......kk..',
        '.kkkkkkkkkk..',
        '.kkkkkkkkkk..',
        '.kkkkkkkkkk..',
        '#############',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'progetti'], colori: ['grigio'], misure: true,
    aiuti: [
      'Una torre e il muro sono lo stesso pezzo: un rettangolo. Cambiano solo le misure.',
      'Crea «rettangolo» con due misure, «largo» e «alto»: dentro, il muro alto a colonne del primo capitolo.',
      'Finito un rettangolo il robot è già al posto giusto per il pezzo dopo: rettangolo 2 × «torri», rettangolo «muro» × 3, rettangolo 2 × «torri».',
    ],
    soluzione: programma({
      progetti: [progetto('rettangolo', { nome: 'rettangolo', icona: '🧱', misure: ['largo', 'alto'] }, [
        fai.ripeti('largo', [fai.ripeti('alto', [fai.metti('grigio')]), fai.vai('destra', 1)]),
      ])],
      principale: [
        fai.chiama('rettangolo', 2, 'torri'),
        fai.chiama('rettangolo', 'muro', 3),
        fai.chiama('rettangolo', 2, 'torri'),
      ],
    }),
    fragili: [
      { nome: 'le misure del primo castello', programma: programma({
        progetti: [progetto('rettangolo', { nome: 'rettangolo', icona: '🧱', misure: ['largo', 'alto'] }, [
          fai.ripeti('largo', [fai.ripeti('alto', [fai.metti('grigio')]), fai.vai('destra', 1)])])],
        principale: [
          fai.chiama('rettangolo', 2, 5), fai.chiama('rettangolo', 4, 3), fai.chiama('rettangolo', 2, 5)] }) },
      { nome: 'il muro alto come le torri', programma: programma({
        progetti: [progetto('rettangolo', { nome: 'rettangolo', icona: '🧱', misure: ['largo', 'alto'] }, [
          fai.ripeti('largo', [fai.ripeti('alto', [fai.metti('grigio')]), fai.vai('destra', 1)])])],
        principale: [
          fai.chiama('rettangolo', 2, 'torri'), fai.chiama('rettangolo', 'muro', 'torri'),
          fai.chiama('rettangolo', 2, 'torri')] }) },
    ],
  },
  {
    chiave: 'bandiere', nome: 'Le bandiere', icona: '🏳️', capitolo: 'progetti',
    impara: 'una misura che è un colore', portata: 74, premio: 20,
    chi: { emoji: '👩‍💼', nome: 'L\'ambasciatrice' },
    racconto: 'Ogni giorno arriva un paese diverso, e la bandiera ha tre bande: i colori li dicono «sinistra», «centro» e «destra». Una banda sola, fatta progetto: le dai il colore.',
    prova: 'disegno',
    ordini: [
      { nome: 'Italia', lavagnette: { sinistra: 'verde', centro: 'bianco', destra: 'rosso' }, robot: [1, 4], mappa: [
        '.........',
        '.vvwwrr..',
        '.vvwwrr..',
        '.vvwwrr..',
        '.vvwwrr..',
        '#########',
      ] },
      { nome: 'Francia', lavagnette: { sinistra: 'blu', centro: 'bianco', destra: 'rosso' }, robot: [1, 4], mappa: [
        '.........',
        '.bbwwrr..',
        '.bbwwrr..',
        '.bbwwrr..',
        '.bbwwrr..',
        '#########',
      ] },
      { nome: 'Irlanda', lavagnette: { sinistra: 'verde', centro: 'bianco', destra: 'arancio' }, robot: [1, 4], mappa: [
        '.........',
        '.vvwwaa..',
        '.vvwwaa..',
        '.vvwwaa..',
        '.vvwwaa..',
        '#########',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'progetti'], colori: ['verde', 'bianco', 'rosso', 'blu', 'arancio'], misure: true,
    aiuti: [
      'I colori li decide il paese: sono lavagnette, come «lungo» — ma dentro c\'è un colore invece di un numero.',
      'Crea il progetto «banda» con una misura 🎨 di tipo colore, «tinta»: dentro, i mattoni sono del colore «tinta». Una banda è larga 2 e alta 4.',
      'Poi: banda con «sinistra», banda con «centro», banda con «destra».',
    ],
    soluzione: programma({
      progetti: [progetto('banda', { nome: 'banda', icona: '🏳️', misure: ['tinta'], tipi: { tinta: 'colore' } }, [
        fai.ripeti(2, [fai.ripeti(4, [fai.metti(tinta('tinta'))]), fai.vai('destra', 1)]),
      ])],
      principale: [fai.chiama('banda', 'sinistra'), fai.chiama('banda', 'centro'), fai.chiama('banda', 'destra')],
    }),
    fragili: [
      { nome: 'i colori dell\'Italia', programma: programma({
        progetti: [progetto('banda', { nome: 'banda', icona: '🏳️', misure: ['tinta'], tipi: { tinta: 'colore' } }, [
          fai.ripeti(2, [fai.ripeti(4, [fai.metti(tinta('tinta'))]), fai.vai('destra', 1)])])],
        principale: [fai.chiama('banda', 'verde'), fai.chiama('banda', 'bianco'), fai.chiama('banda', 'rosso')] }) },
    ],
  },
  {
    chiave: 'villaggio', nome: 'Il villaggio', icona: '🏘️', capitolo: 'progetti',
    impara: 'progetti fatti di progetti', portata: 76, premio: 20,
    chi: { emoji: '🧓', nome: 'Il sindaco' },
    racconto: 'Il villaggio vuole «case» case, tutte uguali: muri rossi, la porta marrone, il tetto arancio con la punta. Una casa è fatta di pareti: prima il progetto della parete, poi quello della casa.',
    prova: 'disegno',
    ordini: [
      { nome: '3 case', lavagnette: { case: 3 }, robot: [1, 5], mappa: [
        '..............',
        '..............',
        '..a...a...a...',
        '.aaa.aaa.aaa..',
        '.rrr.rrr.rrr..',
        '.rmr.rmr.rmr..',
        '##############',
      ] },
      { nome: '2 case', lavagnette: { case: 2 }, robot: [1, 5], mappa: [
        '..............',
        '..............',
        '..a...a.......',
        '.aaa.aaa......',
        '.rrr.rrr......',
        '.rmr.rmr......',
        '##############',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'progetti'], colori: ['rosso', 'marrone', 'arancio'],
    aiuti: [
      'Una casa ha tre colonne: due pareti uguali (rosso, rosso, arancio) e quella di mezzo con la porta e la punta del tetto.',
      'Fai il progetto «parete», poi il progetto «casa» che chiama «parete» due volte: un progetto può chiamarne un altro.',
      'Nel programma principale: ripeti «case» volte la casa. Fra una casa e l\'altra c\'è una colonna vuota.',
    ],
    soluzione: programma({
      progetti: [
        progetto('parete', { nome: 'parete', icona: '🧱' }, [fai.metti('rosso'), fai.metti('rosso'), fai.metti('arancio')]),
        progetto('mezzo', { nome: 'mezzo', icona: '🚪' }, [fai.metti('marrone'), fai.metti('rosso'), fai.metti('arancio'), fai.metti('arancio')]),
        progetto('casa', { nome: 'casa', icona: '🏠' }, [
          fai.chiama('parete'), fai.vai('destra', 1), fai.chiama('mezzo'), fai.vai('destra', 1),
          fai.chiama('parete'), fai.vai('destra', 2)]),
      ],
      principale: [fai.ripeti('case', [fai.chiama('casa')])],
    }),
    fragili: [
      { nome: 'sempre tre case', programma: programma({
        progetti: [
          progetto('parete', { nome: 'parete', icona: '🧱' }, [fai.metti('rosso'), fai.metti('rosso'), fai.metti('arancio')]),
          progetto('mezzo', { nome: 'mezzo', icona: '🚪' }, [fai.metti('marrone'), fai.metti('rosso'), fai.metti('arancio'), fai.metti('arancio')]),
          progetto('casa', { nome: 'casa', icona: '🏠' }, [
            fai.chiama('parete'), fai.vai('destra', 1), fai.chiama('mezzo'), fai.vai('destra', 1),
            fai.chiama('parete'), fai.vai('destra', 2)])],
        principale: [fai.ripeti(3, [fai.chiama('casa')])] }) },
      { nome: 'le case attaccate', programma: programma({
        progetti: [
          progetto('parete', { nome: 'parete', icona: '🧱' }, [fai.metti('rosso'), fai.metti('rosso'), fai.metti('arancio')]),
          progetto('mezzo', { nome: 'mezzo', icona: '🚪' }, [fai.metti('marrone'), fai.metti('rosso'), fai.metti('arancio'), fai.metti('arancio')]),
          progetto('casa', { nome: 'casa', icona: '🏠' }, [
            fai.chiama('parete'), fai.vai('destra', 1), fai.chiama('mezzo'), fai.vai('destra', 1),
            fai.chiama('parete'), fai.vai('destra', 1)])],
        principale: [fai.ripeti('case', [fai.chiama('casa')])] }) },
    ],
  },
  /* ═══════════ 4. LE LAVAGNETTE ═══════════ */
  {
    chiave: 'scala', nome: 'La scala', icona: '🪜', capitolo: 'lavagnette',
    impara: 'una lavagnetta che cresce', portata: 78, premio: 20,
    chi: { emoji: '👸', nome: 'La principessa' },
    racconto: 'Devo salire al castello: fammi una scala con tanti gradini quanti dice «gradini». Ogni gradino è una colonna più alta di uno di quella prima.',
    prova: 'passaggio',
    ordini: [
      { nome: '3 gradini', lavagnette: { gradini: 3 }, mappa: [
        '.............',
        '.............',
        '.............',
        '...........F.',
        '.....########',
        '.....########',
        '.....########',
        'P.@..########',
        '#############',
      ] },
      { nome: '5 gradini', lavagnette: { gradini: 5 }, mappa: [
        '.............',
        '...........F.',
        '.......######',
        '.......######',
        '.......######',
        '.......######',
        '.......######',
        'P.@....######',
        '#############',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'progetti', 'assegna'], colori: ['giallo'], misure: true,
    regalo: [colonna('giallo')],
    aiuti: [
      'La colonna c\'è già (è il tuo progetto del tempio). Il primo gradino è una colonna alta 1, il secondo alta 2…',
      'Crea una lavagnetta, per esempio «h»: all\'inizio scrivici 1, e dopo ogni gradino «h diventa h + 1».',
      'Ripeti «gradini» volte: colonna alta «h», un passo a destra, h diventa h + 1.',
    ],
    soluzione: programma({
      lavagnette: ['h'],
      progetti: [colonna('giallo')],
      principale: [
        fai.assegna('h', 1),
        fai.ripeti('gradini', [fai.chiama('colonna', 'h'), fai.vai('destra', 1), fai.assegna('h', piu('h', 1))]),
      ],
    }),
    fragili: [
      { nome: 'la scala del primo ordine, a mano', programma: programma({
        progetti: [colonna('giallo')],
        principale: [
          fai.chiama('colonna', 1), fai.vai('destra', 1), fai.chiama('colonna', 2), fai.vai('destra', 1),
          fai.chiama('colonna', 3)] }) },
      { nome: 'h non cresce mai', programma: programma({
        lavagnette: ['h'], progetti: [colonna('giallo')],
        principale: [
          fai.assegna('h', 1),
          fai.ripeti('gradini', [fai.chiama('colonna', 'h'), fai.vai('destra', 1)])] }) },
    ],
  },
  {
    chiave: 'piramide', nome: 'La piramide', icona: '🔺', capitolo: 'lavagnette',
    impara: 'una lavagnetta che cala', portata: 80, premio: 20,
    chi: { emoji: '🐫', nome: 'Il faraone' },
    racconto: 'Una piramide: la base larga «base», e ogni piano due mattoni più corto di quello sotto, per «piani» piani.',
    prova: 'disegno',
    ordini: [
      { nome: 'base 5', lavagnette: { base: 5, piani: 3 }, robot: [1, 5], mappa: [
        '..........',
        '..........',
        '..........',
        '...a......',
        '..aaa.....',
        '.aaaaa....',
        '##########',
      ] },
      { nome: 'base 7', lavagnette: { base: 7, piani: 4 }, robot: [1, 5], mappa: [
        '..........',
        '..........',
        '....a.....',
        '...aaa....',
        '..aaaaa...',
        '.aaaaaaa..',
        '##########',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'progetti', 'assegna'], colori: ['arancio'], misure: true,
    regalo: [riga('arancio')],
    aiuti: [
      'La riga c\'è già: fa una fila di mattoni e torna indietro camminandoci sopra, fino al primo.',
      'Una lavagnetta per quanto è lunga la riga: comincia da «base», e a ogni piano cala di 2.',
      'Dopo ogni riga il piano sopra comincia un passo più a destra: ripeti «piani» volte — riga, un passo a destra, l diventa l − 2.',
    ],
    soluzione: programma({
      lavagnette: ['l'],
      progetti: [riga('arancio')],
      principale: [
        fai.assegna('l', 'base'),
        fai.ripeti('piani', [fai.chiama('riga', 'l'), fai.vai('destra', 1), fai.assegna('l', meno('l', 2))]),
      ],
    }),
    fragili: [
      { nome: 'la piramide del primo ordine, a mano', programma: programma({
        progetti: [riga('arancio')],
        principale: [
          fai.chiama('riga', 5), fai.vai('destra', 1), fai.chiama('riga', 3), fai.vai('destra', 1),
          fai.chiama('riga', 1)] }) },
      { nome: 'cala di uno invece che di due', programma: programma({
        lavagnette: ['l'], progetti: [riga('arancio')],
        principale: [
          fai.assegna('l', 'base'),
          fai.ripeti('piani', [fai.chiama('riga', 'l'), fai.vai('destra', 1), fai.assegna('l', meno('l', 1))])] }) },
    ],
  },
  {
    chiave: 'candele', nome: 'Le candeline', icona: '🕯️', capitolo: 'lavagnette',
    impara: 'una lavagnetta che conta alla rovescia', portata: 82, premio: 20,
    chi: { emoji: '👵', nome: 'La nonna' },
    racconto: 'Sulla torta ci vanno «alta» candeline, dalla più alta alla più bassa: la prima alta «alta», e ognuna un mattone più bassa, con la fiamma in cima.',
    prova: 'disegno',
    ordini: [
      { nome: '4 candeline', lavagnette: { alta: 4 }, robot: [1, 7], mappa: [
        '..............',
        '..............',
        '..............',
        '.a............',
        '.w.a..........',
        '.w.w.a........',
        '.w.w.w.a......',
        '.w.w.w.w......',
        '##############',
      ] },
      { nome: '6 candeline', lavagnette: { alta: 6 }, robot: [1, 7], mappa: [
        '..............',
        '.a............',
        '.w.a..........',
        '.w.w.a........',
        '.w.w.w.a......',
        '.w.w.w.w.a....',
        '.w.w.w.w.w.a..',
        '.w.w.w.w.w.w..',
        '##############',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'progetti', 'assegna'], colori: ['bianco', 'arancio'], misure: true,
    aiuti: [
      'Una candelina è una colonna bianca con la fiamma arancio in cima: fanne un progetto con una misura.',
      'Una lavagnetta «h» parte da «alta», e dopo ogni candelina cala di uno.',
      'Ripeti «alta» volte: candelina alta «h», due passi a destra, h diventa h − 1.',
    ],
    soluzione: programma({
      lavagnette: ['h'],
      progetti: [progetto('candela', { nome: 'candela', icona: '🕯️', misure: ['alta'] }, [
        fai.ripeti('alta', [fai.metti('bianco')]), fai.metti('arancio'),
      ])],
      principale: [
        fai.assegna('h', 'alta'),
        fai.ripeti('alta', [fai.chiama('candela', 'h'), fai.vai('destra', 2), fai.assegna('h', meno('h', 1))]),
      ],
    }),
    fragili: [
      { nome: 'le candeline del primo ordine, a mano', programma: programma({
        progetti: [progetto('candela', { nome: 'candela', icona: '🕯️', misure: ['alta'] }, [
          fai.ripeti('alta', [fai.metti('bianco')]), fai.metti('arancio')])],
        principale: [
          fai.chiama('candela', 4), fai.vai('destra', 2), fai.chiama('candela', 3), fai.vai('destra', 2),
          fai.chiama('candela', 2), fai.vai('destra', 2), fai.chiama('candela', 1)] }) },
      { nome: 'tutte alte uguali', programma: programma({
        lavagnette: ['h'],
        progetti: [progetto('candela', { nome: 'candela', icona: '🕯️', misure: ['alta'] }, [
          fai.ripeti('alta', [fai.metti('bianco')]), fai.metti('arancio')])],
        principale: [
          fai.assegna('h', 'alta'),
          fai.ripeti('alta', [fai.chiama('candela', 'h'), fai.vai('destra', 2)])] }) },
    ],
  },
  /* ═══════════ 5. LE SFIDE ═══════════ */
  {
    chiave: 'muro-gemello', nome: 'Il muro gemello', icona: '🪞', capitolo: 'sfide',
    impara: 'contare', portata: 84, premio: 25,
    chi: { emoji: '🧙', nome: 'Il mago' },
    racconto: 'Rifammi il mio muro blu, uguale, due passi più in là. Quanto è lungo? Non te lo dico: contalo. Il robot ci sale e ci cammina sopra.',
    prova: 'disegno',
    ordini: [
      { nome: 'il muro corto', mappa: [
        '...............',
        '...............',
        '...............',
        '...............',
        '@BBB..bbb......',
        '###############',
      ] },
      { nome: 'il muro lungo', mappa: [
        '...............',
        '...............',
        '...............',
        '...............',
        '@BBBBB..bbbbb..',
        '###############',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'finche', 'progetti', 'assegna'], colori: ['blu'], misure: true,
    regalo: [riga('blu')],
    aiuti: [
      'Prima si conta, poi si costruisce. Per contare serve una lavagnetta: «quanti», che parte da 0.',
      'Il robot sale sul muro e ci cammina sopra: finché sotto i piedi non c\'è il terreno, quanti diventa quanti + 1, e un passo.',
      'Scesi dal muro: due passi a destra, e la riga lunga «quanti».',
    ],
    soluzione: programma({
      lavagnette: ['quanti'],
      progetti: [riga('blu')],
      principale: [
        fai.assegna('quanti', 0),
        fai.vai('destra', 1),
        fai.finche(guarda('sotto', 'terreno'), [fai.assegna('quanti', piu('quanti', 1)), fai.vai('destra', 1)]),
        fai.vai('destra', 2),
        fai.chiama('riga', 'quanti'),
      ],
    }),
    fragili: [
      { nome: 'il muro del primo ordine', programma: programma({
        progetti: [riga('blu')],
        principale: [fai.vai('destra', 6), fai.chiama('riga', 3)] }) },
    ],
  },
  {
    chiave: 'conta-rossi', nome: 'Conta i rossi', icona: '🦊', capitolo: 'sfide',
    impara: 'contare quello che si vede', portata: 86, premio: 25,
    chi: { emoji: '🦊', nome: 'La volpe' },
    racconto: 'Sul pavimento ci sono dei mattoni rossi: contali, e in fondo costruiscimi una torre gialla alta quanti sono.',
    prova: 'disegno',
    ordini: [
      { nome: 'il primo pavimento', mappa: [
        '............',
        '............',
        '............',
        '..........g.',
        '..........g.',
        '..........g.',
        '@RBRRBBRB.g.',
        '############',
      ] },
      { nome: 'il secondo pavimento', mappa: [
        '............',
        '............',
        '..........g.',
        '..........g.',
        '..........g.',
        '..........g.',
        '@BRRBRRRB.g.',
        '############',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'se', 'progetti', 'assegna'], colori: ['giallo'], misure: true,
    regalo: [colonna('giallo')],
    aiuti: [
      'Serve una lavagnetta che conta, «quanti», che parte da 0.',
      'Camminando sul pavimento: se sotto i piedi c\'è un mattone rosso, quanti diventa quanti + 1.',
      'Finito il pavimento, due passi a destra e la colonna alta «quanti».',
    ],
    soluzione: programma({
      lavagnette: ['quanti'],
      progetti: [colonna('giallo')],
      principale: [
        fai.assegna('quanti', 0),
        fai.ripeti(8, [fai.vai('destra', 1),
          fai.se(guarda('sotto', 'mattone', true, 'rosso'), [fai.assegna('quanti', piu('quanti', 1))])]),
        fai.vai('destra', 2),
        fai.chiama('colonna', 'quanti'),
      ],
    }),
    fragili: [
      { nome: 'la torre del primo pavimento', programma: programma({
        progetti: [colonna('giallo')],
        principale: [fai.vai('destra', 10), fai.chiama('colonna', 4)] }) },
      { nome: 'conta tutti i mattoni', programma: programma({
        lavagnette: ['quanti'], progetti: [colonna('giallo')],
        principale: [
          fai.assegna('quanti', 0),
          fai.ripeti(8, [fai.vai('destra', 1), fai.assegna('quanti', piu('quanti', 1))]),
          fai.vai('destra', 2), fai.chiama('colonna', 'quanti')] }) },
    ],
  },
  {
    chiave: 'scacchiera', nome: 'La scacchiera', icona: '♟️', capitolo: 'sfide',
    impara: 'un se dentro un se', portata: 90, premio: 30,
    chi: { emoji: '👑', nome: 'La regina' },
    racconto: 'Voglio il pavimento della sala da ballo: una scacchiera bianca e nera, larga «larga» e alta «alta». In basso a sinistra c\'è il bianco.',
    prova: 'disegno',
    ordini: [
      { nome: '4 × 3', lavagnette: { larga: 4, alta: 3 }, robot: [1, 5], mappa: [
        '........',
        '........',
        '........',
        '.wnwn...',
        '.nwnw...',
        '.wnwn...',
        '########',
      ] },
      { nome: '5 × 4', lavagnette: { larga: 5, alta: 4 }, robot: [1, 5], mappa: [
        '........',
        '........',
        '.nwnwn..',
        '.wnwnw..',
        '.nwnwn..',
        '.wnwnw..',
        '########',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'se', 'progetti'], colori: ['bianco', 'nero'],
    aiuti: [
      'Ogni casella è il contrario di quella accanto: di quella a sinistra, se c\'è; se no — nella prima colonna — di quella sotto.',
      'Serve un «se» dentro un altro «se»: fuori «se a sinistra c\'è un mattone», dentro la scelta del colore.',
      'Mettilo in un progetto «casella», e poi: ripeti «larga» volte — ripeti «alta» volte la casella, e un passo a destra.',
    ],
    soluzione: programma({
      progetti: [progetto('casella', { nome: 'casella', icona: '⬛' }, [
        fai.se(guarda('sinistra', 'mattone'),
          [fai.se(guarda('sinistra', 'mattone', true, 'bianco'), [fai.metti('nero')], [fai.metti('bianco')])],
          [fai.se(guarda('sotto', 'mattone', true, 'bianco'), [fai.metti('nero')], [fai.metti('bianco')])]),
      ])],
      principale: [fai.ripeti('larga', [fai.ripeti('alta', [fai.chiama('casella')]), fai.vai('destra', 1)])],
    }),
    fragili: [
      { nome: 'guarda solo a sinistra', programma: programma({
        progetti: [progetto('casella', { nome: 'casella', icona: '⬛' }, [
          fai.se(guarda('sinistra', 'mattone', true, 'bianco'), [fai.metti('nero')], [fai.metti('bianco')])])],
        principale: [fai.ripeti('larga', [fai.ripeti('alta', [fai.chiama('casella')]), fai.vai('destra', 1)])] }) },
      { nome: 'guarda solo sotto', programma: programma({
        progetti: [progetto('casella', { nome: 'casella', icona: '⬛' }, [
          fai.se(guarda('sotto', 'mattone', true, 'bianco'), [fai.metti('nero')], [fai.metti('bianco')])])],
        principale: [fai.ripeti('larga', [fai.ripeti('alta', [fai.chiama('casella')]), fai.vai('destra', 1)])] }) },
    ],
  },
]

/* ═══════════ la fila ═══════════
   Il porto viene dopo le lavagnette — leggere un biglietto vuol dire
   scriverlo in una lavagnetta — e le sfide del cantiere vanno in fondo,
   come finale di tutte e due le parti. Chi aveva giocato con la fila di
   prima ritrova le stelle al loro posto (`FILE` in `dati/campagna.js`). */
export const LIVELLI = [
  ...DEL_CANTIERE.filter(l => l.capitolo !== 'sfide'),
  ...LIVELLI_PORTO,
  ...DEL_CANTIERE.filter(l => l.capitolo === 'sfide'),
]

/* ═══════════ i controlli sul dato ═══════════ */
const BLOCCHI = ['vai', 'metti', 'prendi', 'posa', 'ripeti', 'finche', 'se', 'aspetta', 'sempre', 'assegna', 'progetti']

export function guastiDeiLivelli(livelli = LIVELLI) {
  const guasti = []
  const chiavi = new Set()
  for (const [n, l] of livelli.entries()) {
    const dove = `livello ${n + 1} («${l.chiave}»)`
    if (chiavi.has(l.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    chiavi.add(l.chiave)
    for (const campo of ['nome', 'icona', 'impara', 'racconto'])
      if (!l[campo]) guasti.push(`${dove}: manca «${campo}»`)
    if (!CAPITOLI.some(c => c.chiave === l.capitolo)) guasti.push(`${dove}: il capitolo «${l.capitolo}» non esiste`)
    if (!(l.portata >= 0 && l.portata <= 100)) guasti.push(`${dove}: portata fuori scala`)
    if (!(l.premio > 0)) guasti.push(`${dove}: senza premio`)
    const porto = l.mondo === 'porto'
    if (!(porto ? ['giornata'] : ['disegno', 'passaggio']).includes(l.prova)) guasti.push(`${dove}: prova «${l.prova}» sconosciuta`)
    if (porto && !['molo', 'magazzino', 'bottega'].includes(l.tema)) guasti.push(`${dove}: il tema «${l.tema}» non esiste`)
    if (porto && !Array.isArray(l.cose)) guasti.push(`${dove}: un livello del porto dice quali cose offrono le domande (\`cose\`)`)
    if (!Array.isArray(l.ordini) || !l.ordini.length) guasti.push(`${dove}: nessun ordine`)
    for (const b of l.cassetta || []) if (!BLOCCHI.includes(b)) guasti.push(`${dove}: il blocco «${b}» non esiste`)
    for (const p of l.posti || []) if (!POSTI.includes(p)) guasti.push(`${dove}: il posto «${p}» non esiste`)
    if (!(l.colori || []).length) guasti.push(`${dove}: nessun colore in pulsantiera`)
    if (!(l.aiuti || []).length) guasti.push(`${dove}: nessun aiuto`)
    if (!l.soluzione) guasti.push(`${dove}: nessuna soluzione`)
    /* tutti gli ordini dicono le stesse lavagnette: il programma è uno,
       e una lavagnetta che c'è in un ordine e non nell'altro sarebbe un
       errore che il bambino non ha fatto */
    const nomi = o => Object.keys(o.lavagnette || {}).sort().join(',')
    /* una lavagnetta dell'ordine porta un numero o un colore, e sempre
       della stessa specie in tutti gli ordini */
    for (const o of l.ordini || [])
      for (const [n, v] of Object.entries(o.lavagnette || {})) {
        if (typeof v === 'string' && !CHIAVI_COLORI.includes(v)) guasti.push(`${dove}: «${n}» = «${v}» non è un colore`)
        if (typeof v !== typeof (l.ordini[0].lavagnette || {})[n]) guasti.push(`${dove}: «${n}» cambia specie da un ordine all'altro`)
      }
    if ((l.ordini || []).some(o => nomi(o) !== nomi(l.ordini[0])))
      guasti.push(`${dove}: gli ordini non hanno le stesse lavagnette`)
    for (const o of l.ordini || []) {
      const larghe = new Set(o.mappa.map(r => r.length))
      if (larghe.size !== 1) guasti.push(`${dove}, ordine «${o.nome}»: le righe della mappa non sono lunghe uguali`)
      /* il porto si scrive a coppie di caratteri, e le coppie le legge
         il motore: una mappa che non si legge la trova il banco */
      if (porto) {
        if ([...larghe].some(n => n % 2)) guasti.push(`${dove}, ordine «${o.nome}»: una mappa del porto va a coppie di caratteri`)
        continue
      }
      if (l.prova === 'passaggio' && !(o.mappa.join('').includes('P') && o.mappa.join('').includes('F')))
        guasti.push(`${dove}, ordine «${o.nome}»: un passaggio vuole l'omino (P) e la bandiera (F)`)
      if (l.prova === 'disegno' && !/[a-z]/.test(o.mappa.join('')))
        guasti.push(`${dove}, ordine «${o.nome}»: un disegno senza niente da costruire`)
      if (!o.robot && !o.mappa.join('').includes('@'))
        guasti.push(`${dove}, ordine «${o.nome}»: non si sa da dove parte il robot`)
    }
  }
  return guasti
}

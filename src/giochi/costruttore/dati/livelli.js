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
     attrezzi              progetti già scritti e chiusi, quasi sempre
                           cose che il bambino ha costruito in un livello
                           prima (`dati/attrezzi.js`): si chiamano, si
                           leggono, non si cambiano, e lo zaino non li conta
     zaino                 quante righe può scrivere il bambino (vedi
                           `motore/zaino.js`): dove c'è, il lavoro scritto
                           riga per riga non ci sta, e il banco lo pretende
     ragiona               due frasi gratis, che fanno pensare invece di
                           suggerire: la prima dice cosa chiede il
                           livello e cosa lo rende difficile, la seconda
                           la domanda giusta da farsi (o come provarci).
                           Non nominano il blocco che risolve e non
                           contengono la soluzione, nemmeno a metà
     indizi                da una a tre frasi concrete, 🪙10 l'una, dalla
                           più larga alla più stretta; l'ultima può
                           nominare blocchi, lavagnette e misure. Dopo
                           gli indizi il gioco aggiunge da sé i gradini
                           che scrivono nel programma, ricavati dalla
                           `soluzione` (🪙50 · 100 · 200): non si
                           scrivono qui
     soluzione             un programma che vince tutti gli ordini: lo
                           gioca il banco a ogni giro, e da lui escono i
                           gradini degli aiuti che scrivono nel programma
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
import { torre, muro, albero, colonna, riga, guastiDegliAttrezzi } from './attrezzi.js'
import { LIVELLI_PORTO } from './porto/livelli.js'
import { LIVELLI_POSTI } from './porto/posti.js'
import { GIORNATE } from './porto/giornate.js'
import { IN_ORDINE } from './porto/ordine.js'

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
  { chiave: 'posti', nome: 'I posti del porto', icona: '🗺️',
    dice: 'Un porto grande, e ogni cassa ha il suo posto: un lavoro per ogni colore, e una strada che si scrive una volta sola.' },
  { chiave: 'sfide', nome: 'Le sfide', icona: '🏆',
    dice: 'Tutto insieme: contare, decidere, e un «se» dentro un «se».' },
  { chiave: 'giornate', nome: 'Le giornate del porto', icona: '🌅',
    dice: 'Il porto lavora tutto insieme: camion, lettere, frighi e clienti. Dalla giornata piccola a quella più larga dello schermo.' },
  { chiave: 'ordine', nome: 'Mettere in ordine', icona: '🔢',
    dice: 'Le lettere del postino, dalla più piccola alla più grande: confrontare due numeri, scambiarli, e ripetere finché la fila è in ordine.' },
]

const CAPOMASTRO = { emoji: '👷', nome: 'Il capomastro' }

/* Gli attrezzi — la torre della torretta, la colonna del muro alto, la
   riga che torna al primo mattone — stanno in `dati/attrezzi.js`: sono
   gli stessi in tutti i livelli che li danno, e un livello li elenca in
   `attrezzi`. La lezione del livello è un'altra, e un pezzo da rifare
   distrarrebbe da lei. */

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
    ragiona: [
      'Quattro mattoni in fila, sul disegno. Il robot però un mattone lo sa mettere solo sotto i suoi piedi, e poi ci resta sopra: per il prossimo deve spostarsi.',
      'Prova con un mattone solo, e premi ▶: dove si trova il robot? E da lassù, come arriva al posto del secondo mattone?',
    ],
    indizi: [
      'Un passo a destra, e il robot scende dal mattone da solo: è già al posto giusto per il prossimo.',
      'Metti, un passo a destra, metti, un passo a destra… finché i mattoni sono quattro.',
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
    ragiona: [
      'Stavolta si costruisce in alto: cinque mattoni uno sopra l\'altro, e l\'ultimo di un altro colore. Il robot però non vola, e una scala non ce l\'ha.',
      'Pensa a dove resta il robot dopo aver messo un mattone. Da lì, come fa ad arrivare più in alto? E il giallo, lo mette per primo o per ultimo?',
    ],
    indizi: [
      'Per salire il robot si mette un mattone sotto i piedi: una torre è metti, metti, metti…',
      'Quattro rossi, e per ultimo il giallo: il colore di un mattone si cambia toccando il quadratino nella sua riga.',
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
    ragiona: [
      'Dieci mattoni, come il muretto ma più lungo: a mano sono venti righe, e a metà si perde il conto. Il lavoro è tanto, ma è fatto di un pezzetto che torna sempre uguale.',
      'Qual è il pezzetto più piccolo che, rifatto tante volte, dà tutto il muro? E quante volte va rifatto, né una di più né una di meno?',
    ],
    indizi: [
      'Quello che fai per un mattone è sempre uguale: metti, e un passo a destra.',
      '«Ripeti N volte» esegue quello che ha dentro N volte: mettici dentro il mattone e il passo, e al posto di N scegli 10.',
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
    ragiona: [
      'Tre clienti, tre muri lunghi 4, 7 e 10 — e il programma è uno solo: deve farli tutti e tre. Un numero scritto a mano va bene per un muro solo.',
      'Scrivilo per il primo muro, poi tocca gli altri due ordini in alto: cosa cambia fra uno e l\'altro? E dove sta scritto quanto è lungo il muro di adesso?',
    ],
    indizi: [
      'Un muro è sempre «metti un mattone, un passo a destra», ripetuto: cambia solo quante volte.',
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
    ragiona: [
      '«largo» e «alto» cambiano tutti e due: il muro è 6 × 3 in un ordine e 4 × 5 nell\'altro. E il lavoro si ripete in due direzioni: in su, e verso destra.',
      'Comincia da una colonna sola e falla girare: quale lavagnetta dice quanti mattoni ha, e dove finisce il robot? Poi guarda il muro intero: cosa si ripete, e quante volte?',
    ],
    indizi: [
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
    ragiona: [
      'Una torta larga 4 in un ordine e 7 nell\'altro, e ogni fetta ha tre colori. Il disegno si guarda dall\'alto in giù, ma il robot costruisce dal basso in su.',
      'Prendi una fetta sola: quale mattone mette per primo il robot, e quale per ultimo? E quante fette servono: dove sta scritto?',
    ],
    indizi: [
      'Una fetta è una colonna, e il robot la fa dal basso: marrone, bianco, rosso. Il colore si sceglie toccando il quadratino nella riga.',
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
    ragiona: [
      'Nei due pavimenti i rossi stanno in posti diversi: un programma che si ricorda dov\'erano nel primo sbaglia il secondo. Il robot deve capirlo da solo, mattone per mattone.',
      'Fai finta di essere il robot, un mattone alla volta: cosa ti serve sapere, in ogni posto, per decidere se mettere il giallo? E il robot, da dove lo può sapere?',
    ],
    indizi: [
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
    ragiona: [
      'Qui su ogni mattone del pavimento ne va uno, sempre: la domanda non è più «lo metto o no?» ma «di che colore?». E ogni stanza ha i colori in un ordine suo.',
      'Nei nidi il «se» lavorava solo quando la risposta era sì, e col no stava fermo. Qui cosa deve fare il robot quando la risposta è no?',
    ],
    indizi: [
      'Tocca la riga del «se» e premi «＋ altrimenti»: è la strada per quando la risposta è no.',
      '«Se sotto i piedi c\'è un mattone rosso: metti rosso — altrimenti: metti blu». Tutto dentro un «ripeti 8 volte», dopo un passo a destra.',
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
    ragiona: [
      'Ogni muro ha i buchi in posti diversi, e un mattone messo dove il buco non c\'è finisce sopra il muro, fuori dal disegno. Il programma deve accorgersi dei buchi camminando.',
      'Cosa cambia per il robot quando cade in un buco? Guarda cosa ha sotto i piedi mentre cammina sul muro, e cosa quando è giù, dentro un buco.',
    ],
    indizi: [
      'Sul muro il robot ha sotto i piedi un mattone; caduto in un buco, sotto i piedi ha il terreno.',
      '«Se sotto i piedi c\'è il terreno»: è lì che manca un mattone, e lì lo metti.',
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
    ragiona: [
      'I muri sono lunghi 7 e 10, e 7 è dispari: a coppie rosso-giallo non torna mai. Ogni mattone deve scegliere da solo il suo colore, e il robot non si ricorda quello di prima.',
      'Fai girare piano 🐢 un programma di prova e guarda il robot prima di ogni mattone: cosa ha accanto, che gli dica il colore giusto? E al primo mattone di tutti, lì accanto cosa c\'è?',
    ],
    indizi: [
      'Dopo il passo, il mattone appena messo il robot ce l\'ha ← a sinistra: basta guardarlo per sapere quale colore tocca.',
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
    ragiona: [
      'Il ponte deve attraversare il fiume, e il fiume ogni giorno è largo diverso: 3, 5 o 6. Il programma è uno, e non sa quale giorno gli tocca.',
      'Chi costruisce un ponte vero non conta le onde: guarda dove mette il piede. Cosa vede il robot, in basso davanti a sé, quando il fiume è finito?',
    ],
    indizi: [
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
  /* ═══════════ 3. I PROGETTI ═══════════
     Prima si usano, poi si scrivono. Il capitolo comincia con gli
     attrezzi del capomastro — la torre della torretta, il muro del muro
     lungo, già scritti — e il bambino impara a chiamarli con le misure
     dell'ordine e a sapere dove lasciano il robot. Poi il suo primo
     progetto, dove lo zaino lo rende necessario: tre alberi scritti a
     mano non ci stanno. Poi le misure, e infine una casa fatta di pezzi
     che si ripetono. Ogni livello ha il suo `zaino`, e il banco pretende
     che la soluzione srotolata — le chiamate sostituite dal corpo del
     progetto — non ci stia: se ci sta, il progetto era un di più. */
  {
    chiave: 'cinta', nome: 'La cinta', icona: '🏯', capitolo: 'progetti',
    impara: 'chiamare un attrezzo', portata: 69, premio: 12,
    chi: { emoji: '🤴', nome: 'Il barone' },
    racconto: 'Voglio la cinta del castello: tre torri alte «torri», e fra una torre e l\'altra un muro lungo «muro». I mattoni li mettono gli attrezzi del capomastro: tu dici quale, dove e quanto.',
    prova: 'disegno',
    ordini: [
      { nome: 'torri 3 · muro 2', lavagnette: { torri: 3, muro: 2 }, robot: [1, 6], mappa: [
        '............',
        '............',
        '............',
        '............',
        '.g..g..g....',
        '.r..r..r....',
        '.rrrrrrr....',
        '############',
      ] },
      { nome: 'torri 5 · muro 3', lavagnette: { torri: 5, muro: 3 }, robot: [1, 6], mappa: [
        '............',
        '............',
        '.g...g...g..',
        '.r...r...r..',
        '.r...r...r..',
        '.r...r...r..',
        '.rrrrrrrrr..',
        '############',
      ] },
    ],
    /* niente «metti»: qui si costruisce solo con gli attrezzi */
    cassetta: ['vai', 'ripeti'], colori: ['rosso', 'giallo'],
    attrezzi: [torre(), muro()],
    ragiona: [
      'Qui i mattoni non li metti tu: la torre e il muro sono attrezzi già scritti, e costruiscono da soli. Tu decidi quale chiamare, con quali misure — e da dove parte il robot, perché ogni attrezzo, finito il lavoro, lo lascia in un posto preciso.',
      'Chiama una torre e premi ▶: dove resta il robot quando la torre è finita? E il muro, che mette il primo mattone sotto i piedi del robot, da lì dove lo metterebbe?',
    ],
    indizi: [
      'La torre lascia il robot in cima: un passo a destra, e il robot scende da solo accanto alla torre, dove comincia il muro.',
      'Il muro invece lascia il robot a terra subito dopo l\'ultimo mattone: proprio dove va la torre dopo.',
      'Ripeti 2 volte: torre «torri», un passo a destra, muro «muro». E in fondo l\'ultima torre.',
    ],
    soluzione: programma({ principale: [
      fai.ripeti(2, [fai.chiama('torre', 'torri'), fai.vai('destra', 1), fai.chiama('muro', 'muro')]),
      fai.chiama('torre', 'torri'),
    ] }),
    fragili: [
      /* la falsa pista: il muro parte dalla cima della torre, e il primo
         mattone finisce sopra il giallo */
      { nome: 'senza il passo dopo la torre', programma: programma({ principale: [
        fai.ripeti(2, [fai.chiama('torre', 'torri'), fai.chiama('muro', 'muro')]), fai.chiama('torre', 'torri')] }) },
      { nome: 'le misure del primo barone', programma: programma({ principale: [
        fai.ripeti(2, [fai.chiama('torre', 3), fai.vai('destra', 1), fai.chiama('muro', 2)]), fai.chiama('torre', 3)] }) },
    ],
  },
  {
    chiave: 'bosco', nome: 'Il bosco', icona: '🌳', capitolo: 'progetti',
    impara: 'un progetto tuo', portata: 70, premio: 15,
    chi: { emoji: '🧚', nome: 'La guardiana del bosco' },
    racconto: 'Piantami tre alberi, come nel disegno: due vicini, poi la torre di guardia alta «torre», e un altro albero. La torre è un attrezzo del capomastro. L\'albero no: quello lo scrivi tu, una volta sola.',
    prova: 'disegno',
    ordini: [
      { nome: 'la torre bassa', lavagnette: { torre: 4 }, robot: [2, 6], mappa: [
        '...............',
        '...............',
        '...............',
        '..v...v..g..v..',
        '.vvv.vvv.r.vvv.',
        '..m...m..r..m..',
        '..m...m..r..m..',
        '###############',
      ] },
      { nome: 'la torre alta', lavagnette: { torre: 6 }, robot: [2, 6], mappa: [
        '...............',
        '.........g.....',
        '.........r.....',
        '..v...v..r..v..',
        '.vvv.vvv.r.vvv.',
        '..m...m..r..m..',
        '..m...m..r..m..',
        '###############',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'progetti'], colori: ['marrone', 'verde'],
    posti: ['sotto', 'giu-destra', 'giu-sinistra'],
    attrezzi: [torre()],
    zaino: 14,
    ragiona: [
      'Tre alberi uguali, ma non in fila: fra il secondo e il terzo c\'è la torre. E qui il programma sta in 14 righe, mentre un albero scritto a mano ne prende sei.',
      'La torre non l\'hai dovuta riscrivere: è un attrezzo, lo chiami col suo nome. Potresti fare lo stesso con l\'albero?',
    ],
    indizi: [
      'Tocca «＋ progetto» e chiamalo «albero»: dentro ci scrivi un albero solo, una volta per tutte.',
      'L\'albero: due mattoni marroni sotto i piedi, poi un verde, uno ↙ e uno ↘ in basso ai lati, e in cima un altro verde.',
      'Nel principale: albero, 4 passi a destra, albero, 3 passi, torre «torre», 3 passi, albero.',
    ],
    soluzione: programma({
      progetti: [progetto('albero', { nome: 'albero', icona: '🌳' }, [
        fai.metti('marrone'), fai.metti('marrone'),
        fai.metti('verde'), fai.metti('verde', 'giu-sinistra'), fai.metti('verde', 'giu-destra'),
        fai.metti('verde'),
      ])],
      principale: [
        fai.chiama('albero'), fai.vai('destra', 4), fai.chiama('albero'), fai.vai('destra', 3),
        fai.chiama('torre', 'torre'), fai.vai('destra', 3), fai.chiama('albero'),
      ],
    }),
    fragili: [
      { nome: 'la chioma senza i lati', programma: programma({
        progetti: [progetto('albero', { nome: 'albero', icona: '🌳' }, [
          fai.metti('marrone'), fai.metti('marrone'), fai.metti('verde'), fai.metti('verde')])],
        principale: [
          fai.chiama('albero'), fai.vai('destra', 4), fai.chiama('albero'), fai.vai('destra', 3),
          fai.chiama('torre', 'torre'), fai.vai('destra', 3), fai.chiama('albero')] }) },
      { nome: 'la torre del primo giorno', programma: programma({
        progetti: [progetto('albero', { nome: 'albero', icona: '🌳' }, [
          fai.metti('marrone'), fai.metti('marrone'),
          fai.metti('verde'), fai.metti('verde', 'giu-sinistra'), fai.metti('verde', 'giu-destra'),
          fai.metti('verde')])],
        principale: [
          fai.chiama('albero'), fai.vai('destra', 4), fai.chiama('albero'), fai.vai('destra', 3),
          fai.chiama('torre', 4), fai.vai('destra', 3), fai.chiama('albero')] }) },
    ],
  },
  {
    chiave: 'tempio', nome: 'Il tempio', icona: '🏛️', capitolo: 'progetti',
    impara: 'un progetto con una misura', portata: 71, premio: 15,
    chi: { emoji: '🧝', nome: 'La sacerdotessa' },
    racconto: 'Il tempio vuole tre colonne: ognuna con la base grigia, il fusto bianco e il capitello giallo in cima. I fusti sono alti quanto dicono «prima», «seconda» e «terza». Tre colonne, un progetto solo: dagli una misura, «alta».',
    prova: 'disegno',
    ordini: [
      { nome: '2 · 4 · 3', lavagnette: { prima: 2, seconda: 4, terza: 3 }, robot: [1, 7], mappa: [
        '........',
        '........',
        '...g....',
        '...w.g..',
        '.g.w.w..',
        '.w.w.w..',
        '.w.w.w..',
        '.k.k.k..',
        '########',
      ] },
      { nome: '5 · 1 · 3', lavagnette: { prima: 5, seconda: 1, terza: 3 }, robot: [1, 7], mappa: [
        '........',
        '.g......',
        '.w......',
        '.w...g..',
        '.w...w..',
        '.w.g.w..',
        '.w.w.w..',
        '.k.k.k..',
        '########',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'progetti'], colori: ['grigio', 'bianco', 'giallo'], misure: true,
    zaino: 10,
    ragiona: [
      'Le tre colonne sono fatte allo stesso modo, ma i fusti sono alti diversi, e le altezze cambiano da un tempio all\'altro: 2, 4 e 3, poi 5, 1 e 3. E il programma sta in 10 righe.',
      'Quando chiami la colonna, come fa il progetto a sapere quanto deve venire alto il fusto proprio questa volta? Chi lo decide: il progetto, o chi lo chiama?',
    ],
    indizi: [
      'Crea il progetto «colonna» e dagli una misura: «alta». È il numero che il progetto riceve ogni volta che lo chiami.',
      'Dentro: un mattone grigio, poi ripeti «alta» volte un mattone bianco, e in cima il giallo. A scendere ci pensa il passo dopo.',
      'Nel principale la colonna si chiama tre volte, con «prima», «seconda» e «terza», e fra una e l\'altra due passi a destra.',
    ],
    soluzione: programma({
      progetti: [progetto('colonna', { nome: 'colonna', icona: '🏛️', misure: ['alta'] }, [
        fai.metti('grigio'), fai.ripeti('alta', [fai.metti('bianco')]), fai.metti('giallo'),
      ])],
      principale: [
        fai.chiama('colonna', 'prima'), fai.vai('destra', 2),
        fai.chiama('colonna', 'seconda'), fai.vai('destra', 2),
        fai.chiama('colonna', 'terza'),
      ],
    }),
    fragili: [
      { nome: 'colonne attaccate', programma: programma({
        progetti: [progetto('colonna', { nome: 'colonna', icona: '🏛️', misure: ['alta'] }, [
          fai.metti('grigio'), fai.ripeti('alta', [fai.metti('bianco')]), fai.metti('giallo')])],
        principale: [
          fai.chiama('colonna', 'prima'), fai.vai('destra', 1),
          fai.chiama('colonna', 'seconda'), fai.vai('destra', 1),
          fai.chiama('colonna', 'terza')] }) },
      { nome: 'le altezze del primo tempio', programma: programma({
        progetti: [progetto('colonna', { nome: 'colonna', icona: '🏛️', misure: ['alta'] }, [
          fai.metti('grigio'), fai.ripeti('alta', [fai.metti('bianco')]), fai.metti('giallo')])],
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
    zaino: 9,
    ragiona: [
      'Il re vuole due torri e un muro, e le misure cambiano da un ordine all\'altro: torri alte 5 o 6, muro largo 4 o 6. Scritti uno per uno sono tre pezzi quasi uguali, e qui il programma sta in 9 righe.',
      'Guarda i tre pezzi uno accanto all\'altro: che forma hanno? Cosa cambia da un pezzo all\'altro, e quanti numeri servono per dire com\'è fatto ognuno?',
    ],
    indizi: [
      'Una torre e il muro sono lo stesso pezzo: un rettangolo. Cambiano solo quanto è largo e quanto è alto.',
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
    zaino: 9,
    ragiona: [
      'Italia, Francia, Irlanda: le bande hanno sempre la stessa forma, e cambiano solo i colori. Il programma è uno, sta in 9 righe, e i colori non li sa finché non arriva il paese.',
      'Dentro il progetto della banda, i mattoni di che colore li metti, se il colore giusto ancora non lo sai? E chi lo sa, quando la banda viene chiamata?',
    ],
    indizi: [
      'I colori li decide il paese: sono lavagnette, come «lungo» — ma dentro c\'è un colore invece di un numero.',
      'Crea il progetto «banda» con una misura che è un colore 🎨, «tinta»: dentro, i mattoni sono del colore «tinta». Una banda è larga 2 e alta 4.',
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
    racconto: 'Il villaggio vuole due case uguali, e in mezzo un albero — quello del bosco, già pronto. Le case hanno i muri rossi, due finestre gialle, la porta marrone e il tetto del colore che dice «tetto», con la punta sopra la porta.',
    prova: 'disegno',
    ordini: [
      { nome: 'i tetti arancio', lavagnette: { tetto: 'arancio' }, robot: [1, 6], mappa: [
        '.................',
        '.................',
        '...a.........a...',
        '.aaaaa..v..aaaaa.',
        '.rrrrr.vvv.rrrrr.',
        '.rgmgr..m..rgmgr.',
        '.rrmrr..m..rrmrr.',
        '#################',
      ] },
      { nome: 'i tetti viola', lavagnette: { tetto: 'viola' }, robot: [1, 6], mappa: [
        '.................',
        '.................',
        '...l.........l...',
        '.lllll..v..lllll.',
        '.rrrrr.vvv.rrrrr.',
        '.rgmgr..m..rgmgr.',
        '.rrmrr..m..rrmrr.',
        '#################',
      ] },
    ],
    cassetta: ['vai', 'metti', 'ripeti', 'progetti'], colori: ['rosso', 'giallo', 'marrone'],
    attrezzi: [albero()],
    /* 28 e non di più: la casa tutta in un progetto solo, anche stretta
       coi ripeti, ne vuole 29 (è la mossa ingenua qui sotto) */
    zaino: 28,
    ragiona: [
      'Due case uguali e un albero, che è già scritto. Ma una casa sola, scritta a mano, sono venticinque righe, e qui il programma ne tiene 28 in tutto: nemmeno un progetto «casa» scritto tutto di fila ci sta.',
      'Guarda una casa colonna per colonna, dal basso in su: quante colonne sono uguali fra loro? E un progetto, dentro, può chiamare un altro progetto?',
    ],
    indizi: [
      'Le colonne della casa sono di tre tipi: la parete ai lati, la finestra, e la porta in mezzo, con la punta del tetto.',
      'Fai un progetto per la parete e uno per la finestra, e la casa li chiama: parete, un passo, finestra, un passo, porta, un passo, finestra, un passo, parete, un passo.',
      'Il tetto è del colore che dice «tetto»: nei mattoni del tetto, al posto di un colore scritto, scegli 🔒 tetto. Nel principale: casa, 2 passi, albero, 3 passi, casa.',
    ],
    soluzione: programma({
      progetti: [
        progetto('parete', { nome: 'parete', icona: '🧱' }, [fai.metti('rosso'), fai.metti('rosso'), fai.metti('rosso'), fai.metti(tinta('tetto'))]),
        progetto('finestra', { nome: 'finestra', icona: '🪟' }, [fai.metti('rosso'), fai.metti('giallo'), fai.metti('rosso'), fai.metti(tinta('tetto'))]),
        progetto('casa', { nome: 'casa', icona: '🏠' }, [
          fai.chiama('parete'), fai.vai('destra', 1), fai.chiama('finestra'), fai.vai('destra', 1),
          fai.metti('marrone'), fai.metti('marrone'), fai.metti('rosso'), fai.metti(tinta('tetto')), fai.metti(tinta('tetto')),
          fai.vai('destra', 1), fai.chiama('finestra'), fai.vai('destra', 1), fai.chiama('parete'), fai.vai('destra', 1)]),
      ],
      principale: [fai.chiama('casa'), fai.vai('destra', 2), fai.chiama('albero'), fai.vai('destra', 3), fai.chiama('casa')],
    }),
    fragili: [
      { nome: 'sempre il tetto arancio', programma: programma({
        progetti: [
          progetto('parete', { nome: 'parete', icona: '🧱' }, [fai.metti('rosso'), fai.metti('rosso'), fai.metti('rosso'), fai.metti('arancio')]),
          progetto('finestra', { nome: 'finestra', icona: '🪟' }, [fai.metti('rosso'), fai.metti('giallo'), fai.metti('rosso'), fai.metti('arancio')]),
          progetto('casa', { nome: 'casa', icona: '🏠' }, [
            fai.chiama('parete'), fai.vai('destra', 1), fai.chiama('finestra'), fai.vai('destra', 1),
            fai.metti('marrone'), fai.metti('marrone'), fai.metti('rosso'), fai.metti('arancio'), fai.metti('arancio'),
            fai.vai('destra', 1), fai.chiama('finestra'), fai.vai('destra', 1), fai.chiama('parete'), fai.vai('destra', 1)])],
        principale: [fai.chiama('casa'), fai.vai('destra', 2), fai.chiama('albero'), fai.vai('destra', 3), fai.chiama('casa')] }) },
      /* la casa fatta tutta in un progetto solo, stretta coi ripeti: vince
         il disegno, ma non sta nello zaino — ed è lì che si scopre che
         anche un progetto può chiamarne un altro */
      { nome: 'la casa in un progetto solo', programma: programma({
        progetti: [progetto('casa', { nome: 'casa', icona: '🏠' }, [
          fai.ripeti(3, [fai.metti('rosso')]), fai.metti(tinta('tetto')), fai.vai('destra', 1),
          fai.metti('rosso'), fai.metti('giallo'), fai.metti('rosso'), fai.metti(tinta('tetto')), fai.vai('destra', 1),
          fai.metti('marrone'), fai.metti('marrone'), fai.metti('rosso'), fai.metti(tinta('tetto')), fai.metti(tinta('tetto')), fai.vai('destra', 1),
          fai.metti('rosso'), fai.metti('giallo'), fai.metti('rosso'), fai.metti(tinta('tetto')), fai.vai('destra', 1),
          fai.ripeti(3, [fai.metti('rosso')]), fai.metti(tinta('tetto')), fai.vai('destra', 1)])],
        principale: [fai.chiama('casa'), fai.vai('destra', 2), fai.chiama('albero'), fai.vai('destra', 3), fai.chiama('casa')] }) },
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
    attrezzi: [colonna('giallo')],
    ragiona: [
      'Visto che i gradini salgono, nessuna colonna è uguale a un\'altra. Però un «ripeti» rifà sempre le stesse righe, e i gradini sono 3 in un ordine e 5 nell\'altro.',
      'Scrivila a mano per 3 gradini, e guarda le righe: cosa cambia da una all\'altra? Quel numero che cambia, dove lo puoi tenere mentre il robot lavora?',
    ],
    indizi: [
      'La colonna c\'è già: è l\'attrezzo che la costruisce, alta quanto le dici. Il primo gradino è una colonna alta 1, il secondo alta 2: quel numero lo tiene una lavagnetta.',
      'Crea una lavagnetta, per esempio «h»: all\'inizio «h diventa 1», e dopo ogni gradino «h diventa h + 1».',
      'Ripeti «gradini» volte: colonna alta «h», un passo a destra, h diventa h + 1.',
    ],
    soluzione: programma({
      lavagnette: ['h'],
      principale: [
        fai.assegna('h', 1),
        fai.ripeti('gradini', [fai.chiama('colonna', 'h'), fai.vai('destra', 1), fai.assegna('h', piu('h', 1))]),
      ],
    }),
    fragili: [
      { nome: 'la scala del primo ordine, a mano', programma: programma({
        principale: [
          fai.chiama('colonna', 1), fai.vai('destra', 1), fai.chiama('colonna', 2), fai.vai('destra', 1),
          fai.chiama('colonna', 3)] }) },
      { nome: 'h non cresce mai', programma: programma({
        lavagnette: ['h'],
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
    attrezzi: [riga('arancio')],
    ragiona: [
      'Da un piano all\'altro la riga si accorcia, e la base cambia: 5 in un ordine, 7 nell\'altro. La lunghezza giusta cambia mentre il robot lavora, e ogni piano comincia un po\' più in là.',
      'Metti in fila le lunghezze dei piani: 5, 3, 1. Da dove parte quel numero, e cosa gli succede a ogni piano? E il piano dopo, da quale mattone comincia?',
    ],
    indizi: [
      'La riga c\'è già: fa una fila di mattoni e torna indietro camminandoci sopra, fino al primo.',
      'Una lavagnetta, per esempio «l», tiene quanto è lunga la riga: comincia da «base», e a ogni piano cala di 2.',
      'Dopo ogni riga il piano sopra comincia un passo più a destra: ripeti «piani» volte — riga lunga «l», un passo a destra, l diventa l − 2.',
    ],
    soluzione: programma({
      lavagnette: ['l'],
      principale: [
        fai.assegna('l', 'base'),
        fai.ripeti('piani', [fai.chiama('riga', 'l'), fai.vai('destra', 1), fai.assegna('l', meno('l', 2))]),
      ],
    }),
    fragili: [
      { nome: 'la piramide del primo ordine, a mano', programma: programma({
        principale: [
          fai.chiama('riga', 5), fai.vai('destra', 1), fai.chiama('riga', 3), fai.vai('destra', 1),
          fai.chiama('riga', 1)] }) },
      { nome: 'cala di uno invece che di due', programma: programma({
        lavagnette: ['l'],
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
    ragiona: [
      'Il numero «alta» fa due lavori: quante candeline e quanto è alta la prima, 4 o 6. Ma ha il lucchetto 🔒: il robot lo legge e non lo può cambiare, e le candeline devono venire sempre più basse.',
      'Da sinistra a destra, cosa resta uguale fra una candelina e l\'altra, e cosa cambia? Quel numero che cala, da dove parte — e se «alta» non si tocca, dove lo tieni?',
    ],
    indizi: [
      'Una candelina è una colonna bianca con la fiamma arancio in cima: fanne un progetto con una misura.',
      'Crea una lavagnetta tua, per esempio «h»: parte da «alta», e dopo ogni candelina cala di uno.',
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
    attrezzi: [riga('blu')],
    ragiona: [
      'Per copiare un muro bisogna sapere quanto è lungo, e qui nessuna lavagnetta lo dice: 3 in un ordine, 5 nell\'altro. Il robot deve prima scoprirlo, e solo dopo costruire.',
      'Se dovessi contarlo tu camminandoci sopra, cosa faresti a ogni passo? E da cosa capiresti che il muro è finito?',
    ],
    indizi: [
      'Per contare serve una lavagnetta, «quanti», che parte da 0 e cresce di uno a ogni mattone.',
      'Un passo a destra e il robot è sul muro; poi «ripeti · smetti quando ↓ sotto i piedi c\'è il terreno»: dentro, quanti diventa quanti + 1, e un passo a destra.',
      'Sceso dal muro: due passi a destra, e la riga lunga «quanti».',
    ],
    soluzione: programma({
      lavagnette: ['quanti'],
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
    attrezzi: [colonna('giallo')],
    ragiona: [
      'La torre dev\'essere alta quanti sono i rossi: 4 in un pavimento, 5 nell\'altro, sparsi in posti diversi. Quel numero il robot lo scopre solo camminando, e gli serve alla fine.',
      'Camminando il robot vede un mattone alla volta: quando deve aggiungere uno al conto, e quando no? E il conto, dove lo tiene fino alla torre?',
    ],
    indizi: [
      'Serve una lavagnetta che conta, «quanti», che parte da 0.',
      'Ripeti 8 volte: un passo a destra, e se sotto i piedi c\'è un mattone rosso, quanti diventa quanti + 1.',
      'Finito il pavimento, due passi a destra e la colonna alta «quanti».',
    ],
    soluzione: programma({
      lavagnette: ['quanti'],
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
        principale: [fai.vai('destra', 10), fai.chiama('colonna', 4)] }) },
      { nome: 'conta tutti i mattoni', programma: programma({
        lavagnette: ['quanti'],
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
    ragiona: [
      'Bianco e nero si alternano in tutte e due le direzioni, e le misure cambiano: 4 × 3 e 5 × 4. Il robot costruisce a colonne dal basso, e nella prima colonna a sinistra non ha niente da guardare.',
      'Colorala tu, una casella alla volta nell\'ordine del robot: per ognuna, quale vicina hai guardato per decidere? È sempre la stessa, o dipende da dove sei?',
    ],
    indizi: [
      'Ogni casella è il contrario di quella a sinistra, se c\'è; se no — nella prima colonna — di quella sotto.',
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
   scriverlo in una lavagnetta — e le sfide del cantiere dopo il porto.
   Chi aveva giocato con la fila di prima ritrova le stelle al loro posto
   (`FILE` in `dati/campagna.js`). Le giornate del porto, dove i pezzi
   lavorano tutti insieme, chiudono: stanno in fondo anche per non
   spostare le stelle di nessuno. */
export const LIVELLI = [
  ...DEL_CANTIERE.filter(l => l.capitolo !== 'sfide'),
  ...LIVELLI_PORTO,
  ...LIVELLI_POSTI,
  ...DEL_CANTIERE.filter(l => l.capitolo === 'sfide'),
  ...GIORNATE,
  ...IN_ORDINE,
]

/* ═══════════ i controlli sul dato ═══════════ */
const BLOCCHI = ['vai', 'metti', 'prendi', 'posa', 'ripeti', 'finche', 'se', 'aspetta', 'pausa', 'sempre', 'assegna', 'progetti']

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
    /* la scala degli aiuti comincia con due gradini gratis che fanno
       ragionare, e poi da uno a tre indizi da dieci monete: il resto lo
       aggiunge il gioco dalla soluzione (`motore/aiuti.js`) */
    if ((l.ragiona || []).length !== 2) guasti.push(`${dove}: «ragiona» vuole due frasi`)
    /* gli attrezzi vengono da un livello che sta prima: «l'hai costruito
       nella torretta» detto prima della torretta sarebbe falso */
    if ('regalo' in l) guasti.push(`${dove}: «regalo» non c'è più, adesso sono «attrezzi» (\`dati/attrezzi.js\`)`)
    guasti.push(...guastiDegliAttrezzi(l.attrezzi, dove, livelli.slice(0, n).map(x => x.chiave)))
    if ('zaino' in l && !(Number.isInteger(l.zaino) && l.zaino > 0)) guasti.push(`${dove}: lo zaino è un numero di righe`)
    if (!((l.indizi || []).length >= 1 && l.indizi.length <= 3)) guasti.push(`${dove}: gli indizi vanno da uno a tre`)
    if ('aiuti' in l) guasti.push(`${dove}: «aiuti» non c'è più, sono «ragiona» e «indizi»`)
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

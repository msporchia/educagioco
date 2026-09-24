/* ═══════════════════════════════════════════════════════════════════
   CERCARE — trovare senza guardare tutto due volte

   Dopo «Mettere in ordine»: l'ufficio postale, e tre modi di trovare.

     · il campione: la lettera più grande, con una lavagnetta che cambia
       solo quando arriva un record. Il cliente chiede una qualità
       («la più grande che c'è», `massimo`), non un numero da leggere;
     · la lettera che manca: dall'1 a «case» ce n'è una per casa, e una
       non c'è. Si trova con un conto, senza cercarla;
     · indovina la lettera: il cliente non dice quale vuole, dice solo
       «di più!» o «di meno!», e guarda al massimo quattro lettere. Le
       lettere sono in ordine — è a questo che serviva metterle — e si
       cerca dimezzando (la ricerca binaria, con il ÷).
   ═══════════════════════════════════════════════════════════════════ */
import { fai, guarda, confronta, leggi, piu, meno, diviso, programma } from '../scrivi.js'

const POSTINO = { emoji: '📮', nome: 'Il postino' }
const CLIENTE_ESIGENTE = { emoji: '🧐', nome: 'Un cliente esigente' }
const CLIENTE_BIRICHINO = { emoji: '😏', nome: 'Un cliente birichino' }

/* la mappa del campione e di indovina: i clienti e il bancone a sinistra
   del robot, lo scaffale delle lettere sopra il corridoio — la lettera
   della casella j sta «j passi a destra» del robot, com'è nella
   soluzione di tutti e due i livelli */
function mappaConClienti(numeri) {
  const n = numeri.length
  const largo = n + 4
  return [
    '##'.repeat(largo),
    '######' + numeri.map(x => '=' + x).join('') + '##',
    '.%B..@' + '..'.repeat(n) + '##',
    '##'.repeat(largo),
  ]
}

/* la bacheca del postino: sopra le caselle delle case (vuote, o con la
   cassa rossa in trasparenza sulla casa che manca), sotto lo scaffale
   con le lettere mescolate — una in meno delle case, perché quella che
   manca non c'è: non è un buco da vedere, è un conto da fare */
function mappaBacheca(caseTotali, manca, lettere) {
  const largo = caseTotali + 3
  const case_ = Array.from({ length: caseTotali }, (_, i) => (i + 1 === manca ? '=r' : '=='))
  return [
    '##'.repeat(largo),
    '####' + case_.join('') + '##',
    '.R' + '.@' + '..'.repeat(caseTotali) + '##',
    '####' + lettere.map(x => '=' + x).join('') + '####',
    '##'.repeat(largo),
  ]
}

const giornoCampione = (nome, numeri) => ({
  nome, mappa: mappaConClienti(numeri), lavagnette: { lettere: numeri.length },
  clienti: { pazienza: 300, fila: [[1, 'massimo']] },
})
const giornoManca = (nome, caseTotali, manca, lettere) => ({
  nome, mappa: mappaBacheca(caseTotali, manca, lettere), lavagnette: { case: caseTotali },
})
const NUMERI_IN_ORDINE = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const giornoIndovina = (nome, segreto) => ({
  nome, mappa: mappaConClienti(NUMERI_IN_ORDINE), lavagnette: { lettere: NUMERI_IN_ORDINE.length },
  clienti: { indovina: true, tentativi: 4, pazienza: 400, fila: [[1, segreto]] },
})

/* il ritorno al bancone, dopo aver preso una lettera dallo scaffale: lo
   stesso «ripeti finché» già visto ne «La bottega dei colori» */
const tornaAlBancone = () => fai.finche(guarda('sinistra', 'bancone'), [fai.vai('sinistra', 1)])

export const CERCARE = [
  /* ═══════════ 1. IL CAMPIONE ═══════════ */
  {
    chiave: 'campione', nome: 'Il campione', icona: '🏆', capitolo: 'cercare',
    impara: 'ricordarsi il più grande', portata: 98, premio: 35,
    mondo: 'porto', tema: 'bottega', prova: 'giornata',
    chi: CLIENTE_ESIGENTE,
    racconto: 'Oggi in ufficio postale c\'è un cliente strano: non dice un numero, vuole «la lettera più grande che c\'è». Sullo scaffale le lettere sono mescolate: per saperlo bisogna guardarle tutte, una per una.',
    ordini: [
      giornoCampione('lunedì', [3, 6, 2, 4, 9]),
      giornoCampione('martedì', [9, 4, 6, 2, 7, 3, 5]),
      giornoCampione('mercoledì', [3, 6, 2, 9, 5, 7, 4, 1]),
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'se', 'assegna', 'finche', 'aspetta'], colori: ['rosso'],
    cose: ['biglietto', 'niente', 'cliente', 'bancone'], leggere: true,
    ragiona: [
      'Il cliente vuole la più grande di tutte, e le lettere sono mescolate: il robot le vede una alla volta camminando, e in fondo allo scaffale deve saperla — anche se l\'ha vista all\'inizio.',
      'Se tu guardassi le lettere una alla volta, senza poter tornare a rivederle, cosa ti terresti a mente? E quando lo cambieresti?',
    ],
    indizi: [
      'Una lavagnetta, «record», parte da 0: cammina lungo tutto lo scaffale, e a ogni passo leggi la lettera sopra di te.',
      'Solo se la lettera appena letta è più grande di «record», «record» diventa quella lettera: altrimenti resta com\'era.',
      'Finito lo scaffale, «record» è la lettera più grande che c\'è: torna a cercarla (📖 ↑ uguale a «record») per prenderla, poi porta il robot al bancone e aspetta il cliente prima di posarla.',
    ],
    soluzione: programma({
      lavagnette: ['record', 'letto'],
      principale: [
        fai.assegna('record', 0),
        fai.ripeti('lettere', [
          fai.vai('destra', 1), fai.assegna('letto', leggi('su')),
          fai.se(confronta('letto', '>', 'record'), [fai.assegna('record', 'letto')]),
        ]),
        fai.finche(confronta(leggi('su'), '=', 'record'), [fai.vai('sinistra', 1)]),
        fai.prendi('su'),
        tornaAlBancone(),
        fai.aspetta(guarda('sinistra', 'cliente')),
        fai.posa('sinistra'),
      ],
    }),
    fragili: [
      /* vince lunedì: lì la più grande è proprio l'ultima dello
         scaffale, e senza il «se» «record» diventa lei per caso */
      { nome: 'l\'ultima letta', programma: programma({
        lavagnette: ['record', 'letto'],
        principale: [
          fai.assegna('record', 0),
          fai.ripeti('lettere', [fai.vai('destra', 1), fai.assegna('letto', leggi('su')), fai.assegna('record', 'letto')]),
          fai.finche(confronta(leggi('su'), '=', 'record'), [fai.vai('sinistra', 1)]),
          fai.prendi('su'), tornaAlBancone(), fai.aspetta(guarda('sinistra', 'cliente')), fai.posa('sinistra'),
        ],
      }) },
      /* vince martedì: lì la più grande è proprio la prima */
      { nome: 'la prima', programma: programma({
        principale: [
          fai.vai('destra', 1), fai.prendi('su'),
          tornaAlBancone(), fai.aspetta(guarda('sinistra', 'cliente')), fai.posa('sinistra'),
        ],
      }) },
      { nome: 'la più piccola', programma: programma({
        lavagnette: ['record', 'letto'],
        principale: [
          fai.assegna('record', 99),
          fai.ripeti('lettere', [
            fai.vai('destra', 1), fai.assegna('letto', leggi('su')),
            fai.se(confronta('letto', '<', 'record'), [fai.assegna('record', 'letto')]),
          ]),
          fai.finche(confronta(leggi('su'), '=', 'record'), [fai.vai('sinistra', 1)]),
          fai.prendi('su'), tornaAlBancone(), fai.aspetta(guarda('sinistra', 'cliente')), fai.posa('sinistra'),
        ],
      }) },
    ],
  },
  /* ═══════════ 2. LA LETTERA CHE MANCA ═══════════ */
  {
    chiave: 'lettera-che-manca', nome: 'La lettera che manca', icona: '🕳️', capitolo: 'cercare',
    impara: 'un conto che trova', portata: 98, premio: 40,
    mondo: 'porto', tema: 'bottega', prova: 'giornata',
    chi: POSTINO,
    racconto: 'Dall\'1 a «case» ci dovrebbe essere una lettera per ogni casa, ma oggi ne manca una: voglio un avviso — una cassa rossa — sulla bacheca, alla casa rimasta senza.',
    ordini: [
      giornoManca('lunedì', 5, 5, [1, 2, 3, 4]),
      giornoManca('martedì', 7, 3, [5, 7, 1, 6, 2, 4]),
      giornoManca('mercoledì', 9, 1, [5, 8, 3, 9, 2, 6, 4, 7]),
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'assegna', 'se'], colori: ['rosso'],
    cose: ['biglietto', 'niente', 'cassa'], leggere: true,
    ragiona: [
      'Le lettere sono mescolate, e cercare la casa che manca numero per numero vuol dire passare lo scaffale tante volte quante sono le case. Si trova anche passandolo una volta sola.',
      'Di tutte le lettere da 1 a «case», messe insieme, sai già qualcosa senza guardarle. Se ne manca una, quello che sai cambia? Di quanto?',
    ],
    indizi: [
      'Una lavagnetta, «somma», parte da 0: cammina lungo lo scaffale e aggiungi il numero di ogni lettera che leggi sotto di te.',
      'Quanto dovrebbe fare la somma da 1 a «case», se non mancasse nessuna lettera? Un\'altra lavagnetta, con un altro «ripeti» che conta da 1 a «case», te lo dice.',
      '«manca» è la differenza fra le due somme: prendi la cassa rossa a sinistra, vai a destra di «manca» passi, e posala sulla bacheca sopra di te.',
    ],
    soluzione: programma({
      lavagnette: ['somma', 'tutte', 'casa', 'manca'],
      principale: [
        fai.assegna('somma', 0),
        fai.ripeti(meno('case', 1), [fai.vai('destra', 1), fai.assegna('somma', piu('somma', leggi('giu')))]),
        fai.vai('sinistra', meno('case', 1)),
        fai.assegna('tutte', 0), fai.assegna('casa', 1),
        fai.ripeti('case', [fai.assegna('tutte', piu('tutte', 'casa')), fai.assegna('casa', piu('casa', 1))]),
        fai.assegna('manca', meno('tutte', 'somma')),
        fai.prendi('sinistra'), fai.vai('destra', 'manca'), fai.posa('su'),
      ],
    }),
    fragili: [
      /* vince lunedì: lì la più grande letta è la 4, e la casa dopo è
         proprio la 5 che manca. Basta mescolarle perché non regga più */
      { nome: 'sempre la casa dopo l\'ultima', programma: programma({
        lavagnette: ['massimo', 'letto', 'manca'],
        principale: [
          fai.assegna('massimo', 0),
          fai.ripeti(meno('case', 1), [
            fai.vai('destra', 1), fai.assegna('letto', leggi('giu')),
            fai.se(confronta('letto', '>', 'massimo'), [fai.assegna('massimo', 'letto')]),
          ]),
          fai.vai('sinistra', meno('case', 1)),
          fai.assegna('manca', piu('massimo', 1)),
          fai.prendi('sinistra'), fai.vai('destra', 'manca'), fai.posa('su'),
        ],
      }) },
      /* vince lunedì perché lì le lettere sono in ordine: il primo posto
         dove il numero letto non è quello atteso è la casa che manca */
      { nome: 'la prima che salta, in fila', programma: programma({
        lavagnette: ['trovato', 'atteso', 'manca', 'letto'],
        principale: [
          fai.assegna('trovato', 0), fai.assegna('atteso', 1), fai.assegna('manca', 'case'),
          fai.ripeti(meno('case', 1), [
            fai.vai('destra', 1), fai.assegna('letto', leggi('giu')),
            fai.se(confronta('letto', '=', 'atteso'),
              [fai.assegna('atteso', piu('atteso', 1))],
              [fai.se(confronta('trovato', '=', 0), [fai.assegna('manca', 'atteso'), fai.assegna('trovato', 1)])]),
          ]),
          fai.vai('sinistra', meno('case', 1)),
          fai.prendi('sinistra'), fai.vai('destra', 'manca'), fai.posa('su'),
        ],
      }) },
      { nome: 'la casa scritta a mano', programma: programma({
        lavagnette: ['manca'],
        principale: [fai.assegna('manca', 5), fai.prendi('sinistra'), fai.vai('destra', 'manca'), fai.posa('su')],
      }) },
    ],
  },
  /* ═══════════ 3. INDOVINA LA LETTERA ═══════════ */
  {
    chiave: 'indovina', nome: 'Indovina la lettera', icona: '🎯', capitolo: 'cercare',
    impara: 'cercare dimezzando', portata: 99, premio: 45,
    mondo: 'porto', tema: 'bottega', prova: 'giornata',
    chi: CLIENTE_BIRICHINO,
    racconto: 'Oggi il cliente fa un gioco: pensa a una lettera ma non la dice. Gliene porti una, e lui la rimette sul bancone dicendo solo «di più!» o «di meno!» — al massimo per quattro lettere, poi se ne va arrabbiato.',
    ordini: [
      giornoIndovina('lunedì', 3),
      giornoIndovina('martedì', 8),
      giornoIndovina('mercoledì', 9),
    ],
    cassetta: ['vai', 'prendi', 'posa', 'finche', 'aspetta', 'se', 'assegna'], colori: ['rosso'],
    cose: ['cliente', 'biglietto', 'niente', 'di-piu', 'di-meno'], leggere: true,
    ragiona: [
      'Nove lettere e quattro tentativi: provandole in fila dalla prima, il 9 non si trova mai. Ma le lettere sono in ordine, e ogni risposta del cliente dice qualcosa anche di quelle che non hai portato.',
      'Se porti il 5 e il cliente dice «di più!», quali lettere puoi già dimenticare? E fra quelle che restano, quale conviene provare?',
    ],
    indizi: [
      'Due lavagnette, «basso» e «alto»: partono da 1 e da «lettere», i due estremi di dove può stare la lettera segreta.',
      'Porta al cliente la lettera di mezzo fra «basso» e «alto» (sommali e dividi per 2, col ÷). Se dice «di più!» la segreta è più su, se dice «di meno!» è più giù: uno dei due estremi si stringe.',
      'La lettera sbagliata va rimessa al suo posto sullo scaffale, se no il bancone resta occupato: «se ← c\'è «di più!»» sposta «basso» sopra il mezzo, «se ← c\'è «di meno!»» sposta «alto» sotto — tutto dentro un «ripeti finché il cliente è ancora lì».',
    ],
    soluzione: programma({
      lavagnette: ['basso', 'alto', 'somma', 'metà'],
      principale: [
        fai.aspetta(guarda('sinistra', 'cliente')),
        fai.assegna('basso', 1), fai.assegna('alto', 'lettere'),
        fai.finche(guarda('sinistra', 'cliente', false), [
          fai.assegna('somma', piu('basso', 'alto')), fai.assegna('metà', diviso('somma', 2)),
          fai.vai('destra', 'metà'), fai.prendi('su'), fai.vai('sinistra', 'metà'), fai.posa('sinistra'),
          fai.se(guarda('sinistra', 'di-piu'), [
            fai.assegna('basso', piu('metà', 1)), fai.prendi('sinistra'), fai.vai('destra', 'metà'), fai.posa('su'), fai.vai('sinistra', 'metà'),
          ]),
          fai.se(guarda('sinistra', 'di-meno'), [
            fai.assegna('alto', meno('metà', 1)), fai.prendi('sinistra'), fai.vai('destra', 'metà'), fai.posa('su'), fai.vai('sinistra', 'metà'),
          ]),
        ]),
      ],
    }),
    fragili: [
      /* vince lunedì: la segreta (3) è vicina all'inizio, e ci si arriva
         in tempo prima dei quattro tentativi. Martedì e mercoledì no */
      { nome: 'dall\'1 in su', programma: programma({
        lavagnette: ['tentativo'],
        principale: [
          fai.aspetta(guarda('sinistra', 'cliente')),
          fai.assegna('tentativo', 1),
          fai.finche(guarda('sinistra', 'cliente', false), [
            fai.vai('destra', 'tentativo'), fai.prendi('su'), fai.vai('sinistra', 'tentativo'), fai.posa('sinistra'),
            fai.se(guarda('sinistra', 'di-piu'), [
              fai.prendi('sinistra'), fai.vai('destra', 'tentativo'), fai.posa('su'), fai.vai('sinistra', 'tentativo')]),
            fai.se(guarda('sinistra', 'di-meno'), [
              fai.prendi('sinistra'), fai.vai('destra', 'tentativo'), fai.posa('su'), fai.vai('sinistra', 'tentativo')]),
            fai.assegna('tentativo', piu('tentativo', 1)),
          ]),
        ],
      }) },
      /* perde con l'1 o il 9: da 5 a un estremo sono quattro passetti, e
         il quarto sbagliato è già il cliente che se ne va arrabbiato */
      { nome: 'dal mezzo a passetti', programma: programma({
        lavagnette: ['tentativo'],
        principale: [
          fai.aspetta(guarda('sinistra', 'cliente')),
          fai.assegna('tentativo', 5),
          fai.finche(guarda('sinistra', 'cliente', false), [
            fai.vai('destra', 'tentativo'), fai.prendi('su'), fai.vai('sinistra', 'tentativo'), fai.posa('sinistra'),
            fai.se(guarda('sinistra', 'di-piu'), [
              fai.prendi('sinistra'), fai.vai('destra', 'tentativo'), fai.posa('su'), fai.vai('sinistra', 'tentativo'),
              fai.assegna('tentativo', piu('tentativo', 1))]),
            fai.se(guarda('sinistra', 'di-meno'), [
              fai.prendi('sinistra'), fai.vai('destra', 'tentativo'), fai.posa('su'), fai.vai('sinistra', 'tentativo'),
              fai.assegna('tentativo', meno('tentativo', 1))]),
          ]),
        ],
      }) },
      { nome: 'sempre il 5', programma: programma({
        principale: [
          fai.aspetta(guarda('sinistra', 'cliente')),
          fai.finche(guarda('sinistra', 'cliente', false), [
            fai.vai('destra', 5), fai.prendi('su'), fai.vai('sinistra', 5), fai.posa('sinistra'),
            fai.se(guarda('sinistra', 'di-piu'), [fai.prendi('sinistra'), fai.vai('destra', 5), fai.posa('su'), fai.vai('sinistra', 5)]),
            fai.se(guarda('sinistra', 'di-meno'), [fai.prendi('sinistra'), fai.vai('destra', 5), fai.posa('su'), fai.vai('sinistra', 5)]),
          ]),
        ],
      }) },
    ],
  },
]

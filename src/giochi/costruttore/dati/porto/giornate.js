/* ═══════════════════════════════════════════════════════════════════
   LE GIORNATE DEL PORTO — il porto che lavora tutto insieme

   Il capitolo del porto insegna un pezzo per volta, in scene piccole. Qui
   i pezzi lavorano insieme: la gru riempie il magazzino da sola, i camion
   arrivano e ripartono, le lettere vanno alle loro buche, i clienti
   entrano in bottega. Ogni sfida ha **una cosa nuova** — il camion che
   riparte pieno, un numero letto che diventa dei passi, aspettare dentro
   un ripeti, due lavori da un posto solo — ma intorno c'è un porto vero,
   e il resto lavora da sé.

   Le sfide vanno dalla piccola (il primo camion) alla grande (la
   giornata del porto, più larga dello schermo), e la regola per scriverle
   è quella di sempre: **una giornata diversa cambia il lavoro**. I campi
   sono quelli di `dati/porto/livelli.js`, più gli attori nuovi:

     camion   { pazienza, fila: [[arriva, vuole, colore?], …] }: arrivano
              sulla piazzola (`&`), ripartono appena pieni
     cassoni  anche `numero` (una buca delle lettere) e cifre in
              `dentro` (le lettere)

   Tutto quello che gira intorno non deve poter far perdere la giornata a
   chi non l'ha ancora imparato: la gru scarica su un nastro che finisce
   nel magazzino, e il magazzino è abbastanza grande.
   ═══════════════════════════════════════════════════════════════════ */
import { fai, guarda, leggi, tinta, progetto, programma } from '../scrivi.js'

/* il camion sotto il robot: finché c'è, una cassa per volta */
const carica = (daDove, prima = []) => fai.finche(guarda('giu', 'camion', false), [...prima, fai.prendi(daDove), fai.posa('giu')])

/* la ricerca sullo scaffale, con un colore per misura */
const cerca = () => progetto('cerca', { nome: 'cerca', icona: '🔎', misure: ['tinta'], tipi: { tinta: 'colore' } }, [
  fai.finche(guarda('su', 'cassa', true, tinta('tinta')), [fai.vai('destra', 1)]),
])
/* servire il cliente al bancone di sinistra: leggere, cercare, tornare, dare */
const servi = () => [
  fai.assegna('voglio', leggi('sinistra')), fai.chiama('cerca', 'voglio'), fai.prendi('su'),
  fai.finche(guarda('sinistra', 'bancone'), [fai.vai('sinistra', 1)]), fai.posa('sinistra'),
]

const GRU_DI_SFONDO = { casse: 'GRB', ogni: 8, primo: 2 }

/* I consigli nella forma nuova degli aiuti: `ragiona`, due frasi gratis
   (il nodo del livello, e la domanda giusta da farsi), e `indizi`, da uno
   a tre, dal più largo al più stretto. `aiuti` ne è la somma, per il 💡
   di prima: il giorno che il sistema nuovo è su main non serve più. */
const consigli = (ragiona, indizi) => ({ ragiona, indizi, aiuti: [...ragiona, ...indizi] })
/* a sera il sacco è vuoto: una lettera rimasta dentro non è consegnata */
const SACCO_VUOTO = { cassoni: { p: { vuoto: true } } }

export const GIORNATE = [
  /* ═══════════ piccola: il camion ═══════════ */
  {
    chiave: 'primo-camion', nome: 'Il primo camion', icona: '🚚', capitolo: 'giornate',
    impara: 'il camion riparte quando è pieno', portata: 90, premio: 25,
    mondo: 'porto', tema: 'molo', prova: 'giornata',
    chi: { emoji: '🧑‍✈️', nome: 'La caposquadra' },
    racconto: 'Oggi arrivano i camion. Ognuno si ferma sotto il robot, vuole un certo numero di casse della catasta e riparte appena è pieno. Quante ne vuole? Non importa: si carica finché il camion c\'è.',
    ordini: [
      { nome: 'due camion', mappa: [
        '~~~~~~~~~~~~~~~~~~~~',
        '>*>.>.>.>.Cm##=B=R##',
        '............##....##',
        'Ca.@................',
        '___&________________',
        '....................',
      ], cassoni: {
        a: { nome: 'la catasta', dentro: 'RBRGRBG' },
        m: { nome: 'il magazzino', figura: 'magazzino', capienza: 30 },
      }, gru: GRU_DI_SFONDO, camion: { pazienza: 60, fila: [[3, 3], [20, 4]] } },
      { nome: 'tre camion', mappa: [
        '~~~~~~~~~~~~~~~~~~~~',
        '>*>.>.>.>.Cm##=B=R##',
        '............##....##',
        'Ca.@................',
        '___&________________',
        '....................',
      ], cassoni: {
        a: { nome: 'la catasta', dentro: 'GRBBRGRBRG' },
        m: { nome: 'il magazzino', figura: 'magazzino', capienza: 30 },
      }, gru: GRU_DI_SFONDO, camion: { pazienza: 60, fila: [[2, 2], [10, 5], [26, 3]] } },
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'finche', 'se', 'aspetta', 'sempre'],
    colori: ['rosso', 'blu', 'giallo'], cose: ['camion', 'cassa', 'niente'],
    ...consigli([
      'I camion arrivano uno dopo l\'altro, e ognuno vuole un numero diverso di casse: se scrivi quante ne vuole il primo, il secondo riparte mezzo vuoto, o ne avanza una.',
      'Guarda cosa fa il camion quando è pieno: se ne va da solo. Allora cosa vede il robot sotto di sé, quando ha finito di caricare?',
    ], [
      'Prima di caricare bisogna che il camion ci sia: il robot lo guarda sotto di sé.',
      'Si carica una cassa per volta finché il camion c\'è: quando riparte, sotto non c\'è più niente.',
      '«aspetta che ↓ c\'è un camion», poi «ripeti · smetti quando ↓ non c\'è un camion» con dentro «prendi ←» e «posa ↓». Il tutto dentro «ripeti per sempre».',
    ]),
    soluzione: programma({ principale: [fai.sempre([
      fai.aspetta(guarda('giu', 'camion')), carica('sinistra'),
    ])] }),
    fragili: [
      { nome: 'tre casse per camion', programma: programma({ principale: [fai.sempre([
        fai.aspetta(guarda('giu', 'camion')), fai.ripeti(3, [fai.prendi('sinistra'), fai.posa('giu')])])] }) },
      { nome: 'senza aspettare il camion', programma: programma({ principale: [fai.sempre([
        fai.prendi('sinistra'), fai.posa('giu')])] }) },
    ],
  },

  /* ═══════════ media: un numero letto che diventa dei passi ═══════════ */
  {
    chiave: 'postino', nome: 'Il postino', icona: '✉️', capitolo: 'giornate',
    impara: 'un numero letto, fatto passi', portata: 90, premio: 25,
    mondo: 'porto', tema: 'bottega', prova: 'giornata',
    chi: { emoji: '📮', nome: 'Il postino' },
    racconto: 'Le lettere del porto sono nel sacco. Ogni lettera ha il numero della sua casa, e le buche stanno in fila lungo la via: la buca del 1 subito a destra del robot, poi il 2, il 3… Tutte le lettere alle loro buche!',
    ordini: [
      { nome: 'quattro lettere', mappa: [
        '########################',
        '####C1C2C3C4C5C6C7C8####',
        'Cp.@..................##',
        '########################',
      ], cassoni: buche('3152'), obiettivo: SACCO_VUOTO },
      { nome: 'otto lettere', mappa: [
        '########################',
        '####C1C2C3C4C5C6C7C8####',
        'Cp.@..................##',
        '########################',
      ], cassoni: buche('64827153'), obiettivo: SACCO_VUOTO },
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'finche', 'se', 'assegna'],
    colori: ['rosso', 'blu'], cose: ['niente', 'biglietto', 'cassone'], leggere: true,
    ...consigli([
      'Ogni lettera va alla buca del suo numero, e le buche sono in fila lungo la via: la strada cambia a ogni lettera, e il programma non sa prima quale pescherà.',
      'Se la lettera dice 5, quanti passi deve fare il robot per arrivare alla buca del 5? E quanti per tornare al sacco?',
    ], [
      'Il numero scritto sulla lettera è anche il numero di passi fino alla sua buca.',
      'Tieni il numero in una lavagnetta appena prendi la lettera: ti serve due volte, all\'andata e al ritorno.',
      '«n diventa 📖 ✋», poi «vai → n passi», «posa ↑», «vai ← n passi». E ripeti finché ← nel sacco non c\'è niente.',
    ]),
    soluzione: programma({
      lavagnette: ['n'],
      principale: [fai.finche(guarda('sinistra', 'niente'), [
        fai.prendi('sinistra'), fai.assegna('n', leggi('mano')),
        fai.vai('destra', 'n'), fai.posa('su'), fai.vai('sinistra', 'n'),
      ])],
    }),
    fragili: [
      { nome: 'sempre alla buca del 3', programma: programma({ principale: [fai.finche(guarda('sinistra', 'niente'), [
        fai.prendi('sinistra'), fai.vai('destra', 3), fai.posa('su'), fai.vai('sinistra', 3)])] }) },
      { nome: 'si dimentica di tornare', programma: programma({
        lavagnette: ['n'],
        principale: [fai.finche(guarda('sinistra', 'niente'), [
          fai.prendi('sinistra'), fai.assegna('n', leggi('mano')), fai.vai('destra', 'n'), fai.posa('su')])] }) },
    ],
  },

  /* ═══════════ media: aspettare dentro un ripeti ═══════════ */
  {
    chiave: 'frigo', nome: 'Il frigo', icona: '🧊', capitolo: 'giornate',
    impara: 'aspettare dentro un ripeti', portata: 91, premio: 30,
    mondo: 'porto', tema: 'molo', prova: 'giornata',
    chi: { emoji: '🐟', nome: 'La pescivendola' },
    racconto: 'Il pesce arriva dal nastro dritto nel frigo, una cassa ogni tanto. I camion del mercato lo aspettano sotto il robot. Ma il frigo non è mai pieno quando serve: bisogna caricare quello che c\'è, e aspettare il resto.',
    ordini: [
      { nome: 'la mattina', mappa: [
        '~~~~~~~~~~~~~~~~',
        '>*>.>.>.v.######',
        '########Cf.@....',
        '.........._&____',
      ], cassoni: { f: { nome: 'il frigo', capienza: 4 } },
      gru: { casse: 'RBRGBR', ogni: 5, primo: 1 }, camion: { pazienza: 50, fila: [[6, 3], [26, 3]] } },
      { nome: 'il pomeriggio', mappa: [
        '~~~~~~~~~~~~~~~~',
        '>*>.>.>.v.######',
        '########Cf.@....',
        '.........._&____',
      ], cassoni: { f: { nome: 'il frigo', capienza: 4 } },
      gru: { casse: 'BRRGBRGBRB', ogni: 4, primo: 1 }, camion: { pazienza: 50, fila: [[4, 4], [22, 2], [34, 4]] } },
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'finche', 'se', 'aspetta', 'sempre'],
    colori: ['rosso', 'blu', 'giallo'], cose: ['camion', 'cassa', 'niente'],
    ...consigli([
      'È il lavoro del primo camion, ma le casse non sono pronte: arrivano nel frigo una alla volta, e a volte il robot allunga la mano e il frigo è vuoto.',
      'Prova il programma del primo camion e guarda dove si ferma: cosa manca, in quel momento, perché il robot possa prendere?',
    ], [
      'Prima di prendere dal frigo, il robot deve essere sicuro che dentro ci sia qualcosa.',
      'Si può aspettare anche dentro un ripeti: il camion resta lì mentre il frigo si riempie.',
      'Dentro «ripeti · smetti quando ↓ non c\'è un camion», prima di «prendi ←», metti «aspetta che ← c\'è una cassa».',
    ]),
    soluzione: programma({ principale: [fai.sempre([
      fai.aspetta(guarda('giu', 'camion')), carica('sinistra', [fai.aspetta(guarda('sinistra', 'cassa'))]),
    ])] }),
    fragili: [
      { nome: 'senza aspettare il frigo', programma: programma({ principale: [fai.sempre([
        fai.aspetta(guarda('giu', 'camion')), carica('sinistra')])] }) },
    ],
  },

  /* ═══════════ difficile: cercare in fretta ═══════════ */
  {
    chiave: 'pesce-fresco', nome: 'Pesce fresco', icona: '🦐', capitolo: 'giornate',
    impara: 'cercare, e tornare in tempo', portata: 92, premio: 30,
    mondo: 'porto', tema: 'molo', prova: 'giornata',
    chi: { emoji: '🦐', nome: 'Il pescatore' },
    racconto: 'Il nastro porta il pesce: rosso, blu, giallo. Ognuno va nel suo frigo, e i frighi ogni giorno li spostano. Il robot aspetta in fondo al nastro, prende la cassa, cerca il frigo del suo colore, e torna in fondo prima che arrivi la prossima — se no cade in mare.',
    ordini: [
      { nome: 'i frighi di martedì', mappa: [
        '~~~~~~~~~~~~~~~~~~~~',
        '>*>.>.>.>.>.>.>.>.~~',
        '########.........@##',
        '########Cr##Cb##Cg##',
      ], cassoni: frighi(), gru: { casse: 'RBGGRB', ogni: 14, primo: 1 } },
      { nome: 'i frighi di giovedì', mappa: [
        '~~~~~~~~~~~~~~~~~~~~',
        '>*>.>.>.>.>.>.>.>.~~',
        '########.........@##',
        '########Cg##Cr##Cb##',
      ], cassoni: frighi(), gru: { casse: 'BGRRGBRG', ogni: 14, primo: 1 } },
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'finche', 'se', 'aspetta', 'sempre', 'assegna'],
    colori: ['rosso', 'blu', 'giallo'], cose: ['cassa', 'cassone', 'muro', 'niente', 'libero'], leggere: true,
    ...consigli([
      'Ogni cassa va nel frigo del suo colore, i frighi cambiano posto ogni giorno, e il nastro non si ferma: se il robot non torna in fondo in tempo, la cassa dopo cade in mare.',
      'Cosa deve ricordarsi il robot mentre cammina verso i frighi? E da dove deve ripartire, ogni volta?',
    ], [
      'Il colore da cercare lo sa solo la cassa che il robot ha in mano: leggilo, e tienilo in una lavagnetta.',
      'Il frigo giusto si trova camminando e guardando sotto, non contando i passi: ogni giorno è in un posto diverso.',
      '«colore diventa 📖 ✋», poi «ripeti · smetti quando ↓ c\'è un cassone [colore]» con dentro «vai ←», «posa ↓», e torna → finché a destra c\'è il muro.',
    ]),
    soluzione: programma({
      lavagnette: ['colore'],
      principale: [fai.sempre([
        fai.aspetta(guarda('su', 'cassa')), fai.prendi('su'), fai.assegna('colore', leggi('mano')),
        fai.finche(guarda('giu', 'cassone', true, tinta('colore')), [fai.vai('sinistra', 1)]),
        fai.posa('giu'),
        fai.finche(guarda('destra', 'muro'), [fai.vai('destra', 1)]),
      ])],
    }),
    fragili: [
      { nome: 'i frighi di martedì, a memoria', programma: programma({ principale: [fai.sempre([
        fai.aspetta(guarda('su', 'cassa')), fai.prendi('su'),
        fai.se(guarda('mano', 'cassa', true, 'rosso'), [fai.vai('sinistra', 4), fai.posa('giu'), fai.vai('destra', 4)], [
          fai.se(guarda('mano', 'cassa', true, 'blu'), [fai.vai('sinistra', 2), fai.posa('giu'), fai.vai('destra', 2)],
            [fai.posa('giu')])]),
      ])] }) },
      { nome: 'non torna in fondo al nastro', programma: programma({
        lavagnette: ['colore'],
        principale: [fai.sempre([
          fai.aspetta(guarda('su', 'cassa')), fai.prendi('su'), fai.assegna('colore', leggi('mano')),
          fai.finche(guarda('giu', 'cassone', true, tinta('colore')), [fai.vai('sinistra', 1)]),
          fai.posa('giu'),
        ])],
      }) },
    ],
  },

  /* ═══════════ difficile: due lavori da un posto solo ═══════════ */
  {
    chiave: 'due-lavori', nome: 'Due lavori', icona: '🔀', capitolo: 'giornate',
    impara: 'decidere cosa fare prima', portata: 93, premio: 35,
    mondo: 'porto', tema: 'bottega', prova: 'giornata',
    chi: { emoji: '🛍️', nome: 'La bottegaia' },
    racconto: 'Il robot fa due lavori dallo stesso posto: sotto di lui si fermano i camion, da caricare col magazzino che ha sopra; a sinistra c\'è il bancone, coi clienti che vogliono una cassa dallo scaffale. Chi c\'è, si serve. E quando non c\'è nessuno, si aspetta un turno.',
    ordini: [
      { nome: 'giovedì', mappa: [
        '####################',
        '######Cm=R=B=G=V=A##',
        '...%B..@..........##',
        '######_&____________',
      ], cassoni: { m: { nome: 'il magazzino', figura: 'magazzino', dentro: 'RBRBRBRBRB' } },
      clienti: { pazienza: 70, fila: [[4, 'blu'], [25, 'verde'], [45, 'arancio']] },
      camion: { pazienza: 70, fila: [[2, 3], [30, 4]] } },
      { nome: 'venerdì', mappa: [
        '####################',
        '######Cm=V=A=R=G=B##',
        '...%B..@..........##',
        '######_&____________',
      ], cassoni: { m: { nome: 'il magazzino', figura: 'magazzino', dentro: 'BRBRBRBRBRBR' } },
      clienti: { pazienza: 70, fila: [[1, 'giallo'], [12, 'arancio'], [30, 'blu'], [50, 'verde']] },
      camion: { pazienza: 70, fila: [[6, 4], [20, 2], [42, 3]] } },
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'finche', 'se', 'aspetta', 'pausa', 'sempre', 'assegna', 'progetti'],
    colori: ['rosso', 'arancio', 'giallo', 'verde', 'blu', 'viola'],
    cose: ['camion', 'cliente', 'bancone', 'cassa', 'niente', 'libero'], leggere: true, misure: true,
    regalo: [cerca()],
    ...consigli([
      'Dallo stesso posto arrivano due lavori: i camion da caricare sotto, i clienti al bancone a sinistra. Se ne fai uno solo, l\'altro aspetta finché si stufa.',
      'A ogni giro chiediti: c\'è qualcuno che aspetta? Chi? E se non c\'è nessuno, cosa fa il robot perché il tempo passi?',
    ], [
      'Un giro solo, per sempre, che ogni volta guarda sotto e a sinistra e fa un pezzo del lavoro che trova.',
      'Per il camion basta una cassa per giro: al giro dopo si guarda di nuovo, così un cliente arrivato nel frattempo non resta lì.',
      '«se ↓ c\'è un camion»: «prendi ↑», «posa ↓». Altrimenti, «se ← c\'è un cliente»: servilo con «cerca». Altrimenti: «aspetta un turno».',
    ]),
    soluzione: programma({
      lavagnette: ['voglio'],
      progetti: [cerca()],
      principale: [fai.sempre([
        fai.se(guarda('giu', 'camion'), [fai.prendi('su'), fai.posa('giu')], [
          fai.se(guarda('sinistra', 'cliente'), servi(), [fai.pausa()]),
        ]),
      ])],
    }),
    fragili: [
      { nome: 'prima tutti i camion', programma: programma({
        lavagnette: ['voglio'], progetti: [cerca()],
        principale: [fai.sempre([fai.aspetta(guarda('giu', 'camion')), carica('su')])] }) },
      { nome: 'senza aspettare un turno', programma: programma({
        lavagnette: ['voglio'], progetti: [cerca()],
        principale: [fai.sempre([
          fai.se(guarda('giu', 'camion'), [fai.prendi('su'), fai.posa('giu')], [
            fai.se(guarda('sinistra', 'cliente'), servi()),
          ]),
        ])] }) },
    ],
  },

  /* ═══════════ grande: tutto il porto ═══════════ */
  {
    chiave: 'giornata-porto', nome: 'La giornata del porto', icona: '⚓', capitolo: 'giornate',
    impara: 'tutto insieme, più largo dello schermo', portata: 94, premio: 40,
    mondo: 'porto', tema: 'molo', prova: 'giornata',
    chi: { emoji: '⚓', nome: 'La capitana del porto' },
    racconto: 'Il porto intero. La gru scarica la nave sul nastro, e il nastro riempie il magazzino sopra il robot. I camion si fermano sotto di lui, i clienti vengono al bancone a sinistra, e lo scaffale corre lungo il molo fin dove lo schermo non arriva. Una giornata piena: niente deve restare indietro.',
    ordini: [
      { nome: 'lunedì', mappa: [
        '>*>.>.>.v.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '########v.##############################',
        '########Cm=R=B=G=V=A=L=R=B=G=V=A=R=B=L##',
        '.....%B..@............................##',
        '########_&______________________________',
        '........................................',
      ], cassoni: { m: { nome: 'il magazzino', figura: 'magazzino', capienza: 12, dentro: 'RB' } },
      gru: { casse: 'RBGRBGRBGR', ogni: 6, primo: 1 },
      clienti: { pazienza: 110, fila: [[8, 'blu'], [22, 'verde'], [40, 'rosso'], [58, 'viola'], [75, 'arancio']] },
      camion: { pazienza: 90, fila: [[4, 3], [32, 4], [62, 3]] } },
      { nome: 'sabato', mappa: [
        '>*>.>.>.v.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '########v.##############################',
        '########Cm=V=L=A=G=B=R=V=A=G=B=L=R=A=G##',
        '.....%B..@............................##',
        '########_&______________________________',
        '........................................',
      ],
      cassoni: { m: { nome: 'il magazzino', figura: 'magazzino', capienza: 12, dentro: 'G' } },
      gru: { casse: 'GRBRGBRGBRBG', ogni: 5, primo: 1 },
      clienti: { pazienza: 110, fila: [[3, 'arancio'], [15, 'viola'], [30, 'verde'], [44, 'blu'], [60, 'rosso'], [80, 'arancio']] },
      camion: { pazienza: 90, fila: [[10, 4], [36, 3], [66, 4]] } },
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'finche', 'se', 'aspetta', 'pausa', 'sempre', 'assegna', 'progetti'],
    colori: ['rosso', 'arancio', 'giallo', 'verde', 'blu', 'viola'],
    cose: ['camion', 'cliente', 'bancone', 'cassa', 'niente', 'libero'], leggere: true, misure: true,
    ...consigli([
      'È la giornata di «Due lavori», ma il magazzino lo riempie il nastro un po\' per volta, e lo scaffale continua oltre lo schermo.',
      'Pensa a cosa può mancare nel momento in cui il robot allunga la mano: il camion c\'è, il cliente c\'è, ma la cassa?',
    ], [
      'Quando arriva un camion il magazzino può essere vuoto: non si prende prima che dentro ci sia qualcosa.',
      'Il progetto che cerca il colore del cliente cammina finché lo trova, anche dove lo schermo non arriva: la telecamera lo segue.',
      'Come in «Due lavori», ma nel ramo del camion, prima di «prendi ↑», metti «aspetta che ↑ c\'è una cassa».',
    ]),
    soluzione: programma({
      lavagnette: ['voglio'],
      progetti: [cerca()],
      principale: [fai.sempre([
        fai.se(guarda('giu', 'camion'), [fai.aspetta(guarda('su', 'cassa')), fai.prendi('su'), fai.posa('giu')], [
          fai.se(guarda('sinistra', 'cliente'), servi(), [fai.pausa()]),
        ]),
      ])],
    }),
    fragili: [
      { nome: 'senza aspettare il magazzino', programma: programma({
        lavagnette: ['voglio'], progetti: [cerca()],
        principale: [fai.sempre([
          fai.se(guarda('giu', 'camion'), [fai.prendi('su'), fai.posa('giu')], [
            fai.se(guarda('sinistra', 'cliente'), servi(), [fai.pausa()]),
          ]),
        ])] }) },
      { nome: 'solo i clienti', programma: programma({
        lavagnette: ['voglio'], progetti: [cerca()],
        principale: [fai.sempre([fai.se(guarda('sinistra', 'cliente'), servi(), [fai.pausa()])])] }) },
    ],
  },
]

/* il sacco della posta, e le otto buche lungo la via */
function buche(lettere) {
  const c = { p: { nome: 'il sacco della posta', dentro: lettere } }
  for (let n = 1; n <= 8; n++) c[n] = { nome: `la buca del ${n}`, figura: 'buca', numero: n, capienza: 9 }
  return c
}

/* tre frighi: rosso, blu, giallo, nell'ordine della mappa */
function frighi() {
  return {
    r: { nome: 'il frigo rosso', colore: 'rosso', capienza: 20 },
    b: { nome: 'il frigo blu', colore: 'blu', capienza: 20 },
    g: { nome: 'il frigo giallo', colore: 'giallo', capienza: 20 },
  }
}

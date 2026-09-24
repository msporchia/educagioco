/* ═══════════════════════════════════════════════════════════════════
   I LIVELLI DEL PORTO — la seconda metà del costruttore

   Stessa forma dei livelli del cantiere (`dati/livelli.js`, con tutti i
   campi spiegati lì), più quello che serve a un mondo visto dall'alto
   che lavora da solo:

     mondo       'porto': sceglie il mondo (`motore/porto/mondo.js`)
     tema        il pavimento da disegnare: molo | magazzino | bottega
     prova       'giornata': si vince se a sera gli obiettivi tornano
     ordini      ognuno è **una giornata**: la mappa a coppie di
                 caratteri (`dati/porto/legenda.js`), i `cassoni`, la
                 `gru`, il `nastro`, i `clienti`, l'`obiettivo`
                 (`motore/porto/esito.js`) e le lavagnette dell'ordine
     cose        le cose che le domande del livello offrono
                 («↑ sopra c'è [una cassa]»): solo quelle che servono
     leggere     se le caselle dei valori offrono 📖, la lettura

   ── LE REGOLE PER SCRIVERNE UNO ───────────────────────────────────
   Quelle del cantiere valgono tutte (una cosa nuova per livello, la
   fatica a mano prima, gli ordini sono la sfida), e ne aggiungo una:
   **una giornata diversa deve cambiare il lavoro, non solo i numeri**.
   Un'altra nave con più casse, i cesti messi in un altro ordine, clienti
   che chiedono altro: il programma che ha ricordato la prima giornata
   invece di guardarla la perde, e la mossa ingenua lo dimostra.
   ═══════════════════════════════════════════════════════════════════ */
import { fai, guarda, leggi, tinta, progetto, programma } from '../scrivi.js'

const CAPITANA = { emoji: '⚓', nome: 'La capitana del porto' }

/* il viaggio della stiva: prendi a sinistra, porta, posa a destra, torna */
const viaggio = passi => [fai.prendi('sinistra'), fai.vai('destra', passi), fai.posa('destra'), fai.vai('sinistra', passi)]

/* la ricerca della bottega: cammina finché sopra c'è una cassa del
   colore della misura */
const cerca = () => progetto('cerca', { nome: 'cerca', icona: '🔎', misure: ['tinta'], tipi: { tinta: 'colore' } }, [
  fai.finche(guarda('su', 'cassa', true, tinta('tinta')), [fai.vai('destra', 1)]),
])

export const LIVELLI_PORTO = [
  /* ═══════════ prendere e posare ═══════════ */
  {
    chiave: 'primo-carico', nome: 'Il primo carico', icona: '📦', capitolo: 'porto',
    impara: 'prendere e posare', portata: 82, premio: 15,
    mondo: 'porto', tema: 'molo', prova: 'giornata',
    chi: CAPITANA,
    racconto: 'Benvenuto al porto! Qui il robot si vede dall\'alto, e va anche su e giù. Il primo lavoro: le tre casse della banchina vanno dove vedi il disegno. Il robot prende e posa di fianco a sé.',
    ordini: [{ nome: 'la banchina', mappa: [
      '~~~~~~~~~~~~~~~~',
      '...R...B...G....',
      '.............g..',
      '...r.....b......',
      '.@..............',
    ] }],
    cassetta: ['vai', 'prendi', 'posa'], colori: ['rosso', 'blu', 'giallo'], cose: [],
    aiuti: [
      'Il robot prende la cassa che ha di fianco: per prendere quella rossa deve mettersi sotto di lei, e prenderla ↑ da sopra.',
      'Una cassa alla volta: prendila, e posala dove c\'è il suo disegno — anche quella, di fianco a sé.',
      'Due passi su e uno a destra: il robot è sotto la cassa rossa. Prendila da sopra, e posala sotto.',
    ],
    soluzione: programma({ principale: [
      fai.vai('su', 2), fai.vai('destra', 1), fai.prendi('su'), fai.posa('giu'),
      fai.vai('destra', 2), fai.prendi('su'), fai.vai('destra', 1), fai.posa('giu'),
      fai.vai('destra', 1), fai.prendi('su'), fai.posa('destra'),
    ] }),
    fragili: [
      { nome: 'tutte giù, dritte', programma: programma({ principale: [
        fai.vai('su', 2), fai.vai('destra', 1), fai.prendi('su'), fai.posa('giu'),
        fai.vai('destra', 2), fai.prendi('su'), fai.vai('destra', 1), fai.posa('giu'),
        fai.vai('destra', 1), fai.prendi('su'), fai.posa('giu')] }) },
    ],
  },
  {
    chiave: 'stiva', nome: 'La stiva', icona: '🚢', capitolo: 'porto',
    impara: 'ripeti, dall\'alto', portata: 82, premio: 15,
    mondo: 'porto', tema: 'molo', prova: 'giornata',
    chi: { emoji: '🧔', nome: 'Il nostromo' },
    racconto: 'La nave ha la stiva piena: porta tutte le casse nel camion. Quante sono? Le conta la lavagnetta «casse»: oggi 4, domani 7.',
    ordini: [
      { nome: 'oggi: 4 casse', lavagnette: { casse: 4 }, mappa: [
        '~~~~~~~~~~~~~~~~',
        'Cs.@..........Ct',
        '................',
      ], cassoni: {
        s: { nome: 'la stiva', figura: 'stiva', dentro: 'RBRG' },
        t: { nome: 'il camion', figura: 'camion', capienza: 12 },
      }, obiettivo: { cassoni: { t: { quante: 4 }, s: { vuoto: true } } } },
      { nome: 'domani: 7 casse', lavagnette: { casse: 7 }, mappa: [
        '~~~~~~~~~~~~~~~~',
        'Cs.@..........Ct',
        '................',
      ], cassoni: {
        s: { nome: 'la stiva', figura: 'stiva', dentro: 'BRRGBRB' },
        t: { nome: 'il camion', figura: 'camion', capienza: 12 },
      }, obiettivo: { cassoni: { t: { quante: 7 }, s: { vuoto: true } } } },
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti'], colori: ['rosso', 'blu', 'giallo'], cose: [],
    aiuti: [
      'Per ogni cassa il lavoro è sempre lo stesso: prendila dalla stiva, portala, posala nel camion, torna indietro.',
      '«Ripeti casse volte», e dentro i quattro pezzi del viaggio.',
    ],
    soluzione: programma({ principale: [fai.ripeti('casse', viaggio(5))] }),
    fragili: [
      { nome: 'le casse di oggi', programma: programma({ principale: [fai.ripeti(4, viaggio(5))] }) },
      { nome: 'si dimentica di tornare', programma: programma({ principale: [
        fai.ripeti('casse', [fai.prendi('sinistra'), fai.vai('destra', 5), fai.posa('destra')])] }) },
    ],
  },

  /* ═══════════ guardare cosa si ha in mano ═══════════ */
  {
    chiave: 'rosse-e-blu', nome: 'Rosse e blu', icona: '🍅', capitolo: 'porto',
    impara: 'se in mano c\'è…', portata: 83, premio: 20,
    mondo: 'porto', tema: 'molo', prova: 'giornata',
    chi: { emoji: '🍅', nome: 'Il fruttivendolo' },
    racconto: 'Le casse rosse sono pomodori e vanno nel camion rosso; quelle blu sono mirtilli e vanno nel camion blu. Il robot guarda cosa ha in mano, e decide.',
    ordini: [
      { nome: 'lunedì', lavagnette: { casse: 5 }, mappa: [
        '~~~~~~~~~~~~~~',
        '~~..........Cr',
        'Cs.@..........',
        '##..........Cb',
      ], cassoni: {
        s: { nome: 'la stiva', figura: 'stiva', dentro: 'RBBRB' },
        r: { nome: 'il camion rosso', figura: 'camion', colore: 'rosso', capienza: 12 },
        b: { nome: 'il camion blu', figura: 'camion', colore: 'blu', capienza: 12 },
      }, obiettivo: { cassoni: { s: { vuoto: true }, r: { quante: 2 }, b: { quante: 3 } } } },
      { nome: 'martedì', lavagnette: { casse: 8 }, mappa: [
        '~~~~~~~~~~~~~~',
        '~~..........Cr',
        'Cs.@..........',
        '##..........Cb',
      ], cassoni: {
        s: { nome: 'la stiva', figura: 'stiva', dentro: 'BRRRBRBB' },
        r: { nome: 'il camion rosso', figura: 'camion', colore: 'rosso', capienza: 12 },
        b: { nome: 'il camion blu', figura: 'camion', colore: 'blu', capienza: 12 },
      }, obiettivo: { cassoni: { s: { vuoto: true }, r: { quante: 4 }, b: { quante: 4 } } } },
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'se'], colori: ['rosso', 'blu'], cose: ['cassa', 'niente'],
    aiuti: [
      'Il camion rosso sta sopra la strada, quello blu sotto: arrivato in fondo, il robot sceglie da che parte posare.',
      '«Se ✋ in mano c\'è una cassa rossa: posa ↑ sopra, altrimenti posa ↓ sotto».',
    ],
    soluzione: programma({ principale: [fai.ripeti('casse', [
      fai.prendi('sinistra'), fai.vai('destra', 5),
      fai.se(guarda('mano', 'cassa', true, 'rosso'), [fai.posa('su')], [fai.posa('giu')]),
      fai.vai('sinistra', 5),
    ])] }),
    fragili: [
      { nome: 'tutte nel camion rosso', programma: programma({ principale: [fai.ripeti('casse', [
        fai.prendi('sinistra'), fai.vai('destra', 5), fai.posa('su'), fai.vai('sinistra', 5)])] }) },
      { nome: 'il se senza altrimenti', programma: programma({ principale: [fai.ripeti('casse', [
        fai.prendi('sinistra'), fai.vai('destra', 5),
        fai.se(guarda('mano', 'cassa', true, 'rosso'), [fai.posa('su')]), fai.vai('sinistra', 5)])] }) },
    ],
  },

  /* ═══════════ leggere ═══════════ */
  {
    chiave: 'bolla', nome: 'La bolla', icona: '📋', capitolo: 'porto',
    impara: 'leggere un numero', portata: 83, premio: 20,
    mondo: 'porto', tema: 'molo', prova: 'giornata',
    chi: { emoji: '📋', nome: 'L\'ispettrice del porto' },
    racconto: 'Oggi il camion non prende tutta la stiva: quante casse caricare è scritto sulla bolla, il biglietto sullo scaffale sopra il robot. Il robot la sa leggere.',
    ordini: [
      { nome: 'la bolla del 3', mappa: [
        '~~~~~~~~~~~~~~~~',
        '~~=3............',
        'Cs.@..........Ct',
        '################',
      ], cassoni: {
        s: { nome: 'la stiva', figura: 'stiva', dentro: 'RBRGBRGBR' },
        t: { nome: 'il camion', figura: 'camion', capienza: 12 },
      }, obiettivo: { cassoni: { t: { quante: 3 } } } },
      { nome: 'la bolla del 6', mappa: [
        '~~~~~~~~~~~~~~~~',
        '~~=6............',
        'Cs.@..........Ct',
        '################',
      ], cassoni: {
        s: { nome: 'la stiva', figura: 'stiva', dentro: 'GBRRBGRBR' },
        t: { nome: 'il camion', figura: 'camion', capienza: 12 },
      }, obiettivo: { cassoni: { t: { quante: 6 } } } },
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'assegna'], colori: ['rosso', 'blu', 'giallo'], cose: [],
    leggere: true,
    aiuti: [
      'Serve una lavagnetta, «quante», che prende il numero della bolla: «quante diventa 📖 ↑».',
      'Poi il viaggio di sempre — prendi, porta, posa, torna — ripetuto «quante» volte.',
    ],
    soluzione: programma({
      lavagnette: ['quante'],
      principale: [fai.assegna('quante', leggi('su')), fai.ripeti('quante', viaggio(5))],
    }),
    fragili: [
      { nome: 'il numero della prima bolla', programma: programma({ principale: [fai.ripeti(3, viaggio(5))] }) },
      { nome: 'tutta la stiva', programma: programma({ principale: [fai.ripeti(9, viaggio(5))] }) },
    ],
  },

  /* ═══════════ il mondo che si muove ═══════════ */
  {
    chiave: 'gru', nome: 'La gru', icona: '🏗️', capitolo: 'porto',
    impara: 'aspetta che…, per sempre', portata: 84, premio: 20,
    mondo: 'porto', tema: 'molo', prova: 'giornata',
    chi: { emoji: '🏗️', nome: 'Il gruista' },
    racconto: 'La gru cala le casse della nave una alla volta, qui accanto. Portale tutte in magazzino. Quante sono? Dipende dalla nave: non lo sa nessuno.',
    ordini: [
      { nome: 'la barca', mappa: [
        '~~~~~~~~~~~~~~',
        '.*.@........Cm',
        '..............',
      ], cassoni: { m: { nome: 'il magazzino', figura: 'magazzino', capienza: 20 } },
      gru: { casse: 'RBR', ogni: 7, primo: 2 }, obiettivo: { cassoni: { m: { quante: 3 } } } },
      { nome: 'la nave', mappa: [
        '~~~~~~~~~~~~~~',
        '.*.@........Cm',
        '..............',
      ], cassoni: { m: { nome: 'il magazzino', figura: 'magazzino', capienza: 20 } },
      gru: { casse: 'RBBRGRBG', ogni: 5, primo: 2 }, obiettivo: { cassoni: { m: { quante: 8 } } } },
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'aspetta', 'sempre'], colori: ['rosso', 'blu', 'giallo'],
    cose: ['cassa', 'niente'],
    aiuti: [
      'Il robot non sa quando arriva la prossima cassa: «aspetta che ← a sinistra c\'è una cassa».',
      'E quante ne arrivano non si sa: «ripeti per sempre». La giornata finisce da sola, quando la gru è vuota.',
      'Dentro il ripeti per sempre: aspetta, prendi, porta in magazzino, torna accanto alla gru.',
    ],
    soluzione: programma({ principale: [fai.sempre([
      fai.aspetta(guarda('sinistra', 'cassa')), ...viaggio(4),
    ])] }),
    fragili: [
      { nome: 'le casse della barca', programma: programma({ principale: [fai.ripeti(3, [
        fai.aspetta(guarda('sinistra', 'cassa')), ...viaggio(4)])] }) },
      { nome: 'senza aspettare', programma: programma({ principale: [fai.sempre(viaggio(4))] }) },
    ],
  },
  {
    chiave: 'nastro', nome: 'Il nastro', icona: '🐟', capitolo: 'porto',
    impara: 'il mondo non aspetta', portata: 84, premio: 20,
    mondo: 'porto', tema: 'molo', prova: 'giornata',
    chi: { emoji: '🐟', nome: 'La pescivendola' },
    racconto: 'Il pesce arriva dal peschereccio sul nastro. Il tonno (casse rosse) va nel frigo rosso, le sardine (casse blu) in quello blu. Prendile prima che cadano in mare!',
    ordini: [
      { nome: 'la mattina', mappa: [
        '~~~~~~~~~~~~~~~~',
        '>*>.>.>.>.>.~~~~',
        '........Cr.@Cb..',
      ], cassoni: {
        r: { nome: 'il frigo rosso', figura: 'cassone', colore: 'rosso', capienza: 20 },
        b: { nome: 'il frigo blu', figura: 'cassone', colore: 'blu', capienza: 20 },
      }, gru: { casse: 'RBBR', ogni: 6, primo: 2 } },
      { nome: 'il pomeriggio', mappa: [
        '~~~~~~~~~~~~~~~~',
        '>*>.>.>.>.>.~~~~',
        '........Cr.@Cb..',
      ], cassoni: {
        r: { nome: 'il frigo rosso', figura: 'cassone', colore: 'rosso', capienza: 20 },
        b: { nome: 'il frigo blu', figura: 'cassone', colore: 'blu', capienza: 20 },
      }, gru: { casse: 'BRRBRBBRRB', ogni: 3, primo: 2 } },
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'se', 'aspetta', 'sempre'], colori: ['rosso', 'blu'],
    cose: ['cassa', 'niente'],
    aiuti: [
      'Il robot sta già in fondo al nastro: lì aspetta che arrivi una cassa ↑ sopra di lui.',
      'Presa la cassa: se è rossa la posa ← a sinistra, se no → a destra. E si ricomincia ad aspettare, per sempre.',
    ],
    soluzione: programma({ principale: [fai.sempre([
      fai.aspetta(guarda('su', 'cassa')), fai.prendi('su'),
      fai.se(guarda('mano', 'cassa', true, 'rosso'), [fai.posa('sinistra')], [fai.posa('destra')]),
    ])] }),
    fragili: [
      { nome: 'le casse della mattina', programma: programma({ principale: [fai.ripeti(4, [
        fai.aspetta(guarda('su', 'cassa')), fai.prendi('su'),
        fai.se(guarda('mano', 'cassa', true, 'rosso'), [fai.posa('sinistra')], [fai.posa('destra')])])] }) },
      { nome: 'tutte nel frigo rosso', programma: programma({ principale: [fai.sempre([
        fai.aspetta(guarda('su', 'cassa')), fai.prendi('su'), fai.posa('sinistra')])] }) },
    ],
  },

  /* ═══════════ cercare ═══════════ */
  {
    chiave: 'smistamento', nome: 'Lo smistamento', icona: '🧺', capitolo: 'porto',
    impara: 'un colore letto, da cercare', portata: 84, premio: 25,
    mondo: 'porto', tema: 'magazzino', prova: 'giornata',
    chi: { emoji: '🧺', nome: 'La capomagazzino' },
    racconto: 'Ogni cassa va nel cesto del suo colore. Ma i cesti ogni giorno li spostano! Il robot legge il colore della cassa che ha in mano, e cerca il suo cesto.',
    ordini: [
      { nome: 'i cesti di lunedì', mappa: [
        '~~~~~~~~~~~~~~~~~~~~',
        '##.*################',
        '##.@..............##',
        '####Cr##Cb##Cg##Cv##',
      ], cassoni: {
        r: { nome: 'il cesto rosso', colore: 'rosso' }, b: { nome: 'il cesto blu', colore: 'blu' },
        g: { nome: 'il cesto giallo', colore: 'giallo' }, v: { nome: 'il cesto verde', colore: 'verde' },
      }, gru: { casse: 'RGBVRB', ogni: 4, primo: 2 } },
      { nome: 'i cesti di martedì', mappa: [
        '~~~~~~~~~~~~~~~~~~~~',
        '##.*################',
        '##.@..............##',
        '####Cg##Cv##Cr##Cb##',
      ], cassoni: {
        r: { nome: 'il cesto rosso', colore: 'rosso' }, b: { nome: 'il cesto blu', colore: 'blu' },
        g: { nome: 'il cesto giallo', colore: 'giallo' }, v: { nome: 'il cesto verde', colore: 'verde' },
      }, gru: { casse: 'VBRGGRVB', ogni: 4, primo: 2 } },
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'finche', 'se', 'aspetta', 'sempre', 'assegna'],
    colori: ['rosso', 'blu', 'giallo', 'verde'], cose: ['cassa', 'cassone', 'muro', 'niente', 'libero'],
    leggere: true,
    aiuti: [
      'Una lavagnetta «colore» prende il colore della cassa che il robot ha in mano: «colore diventa 📖 ✋».',
      'Poi si cammina finché ↓ sotto c\'è il cesto di quel colore: «ripeti · smetti quando ↓ c\'è un cassone [colore]».',
      'Posata la cassa, si torna indietro finché ← a sinistra c\'è il muro: lì sopra cala la gru.',
    ],
    soluzione: programma({
      lavagnette: ['colore'],
      principale: [fai.sempre([
        fai.aspetta(guarda('su', 'cassa')), fai.prendi('su'),
        fai.assegna('colore', leggi('mano')),
        fai.finche(guarda('giu', 'cassone', true, tinta('colore')), [fai.vai('destra', 1)]),
        fai.posa('giu'),
        fai.finche(guarda('sinistra', 'muro'), [fai.vai('sinistra', 1)]),
      ])],
    }),
    fragili: [
      { nome: 'i cesti di lunedì, a memoria', programma: programma({ principale: [fai.sempre([
        fai.aspetta(guarda('su', 'cassa')), fai.prendi('su'),
        fai.se(guarda('mano', 'cassa', true, 'rosso'), [fai.vai('destra', 1), fai.posa('giu'), fai.vai('sinistra', 1)], [
          fai.se(guarda('mano', 'cassa', true, 'blu'), [fai.vai('destra', 3), fai.posa('giu'), fai.vai('sinistra', 3)], [
            fai.se(guarda('mano', 'cassa', true, 'giallo'), [fai.vai('destra', 5), fai.posa('giu'), fai.vai('sinistra', 5)],
              [fai.vai('destra', 7), fai.posa('giu'), fai.vai('sinistra', 7)])])]),
      ])] }) },
      { nome: 'senza tornare sotto la gru', programma: programma({
        lavagnette: ['colore'],
        principale: [fai.sempre([
          fai.aspetta(guarda('su', 'cassa')), fai.prendi('su'),
          fai.assegna('colore', leggi('mano')),
          fai.finche(guarda('giu', 'cassone', true, tinta('colore')), [fai.vai('destra', 1)]),
          fai.posa('giu'),
        ])],
      }) },
    ],
  },

  /* ═══════════ i clienti ═══════════ */
  {
    chiave: 'bottega', nome: 'La bottega dei colori', icona: '🛍️', capitolo: 'porto',
    impara: 'un progetto che cerca', portata: 84, premio: 25,
    mondo: 'porto', tema: 'bottega', prova: 'giornata',
    chi: { emoji: '🛍️', nome: 'La bottegaia' },
    racconto: 'In bottega i clienti arrivano uno alla volta, e chiedono una cassa di un colore. Il robot legge cosa vogliono, la cerca sullo scaffale e gliela porta al bancone.',
    ordini: [
      { nome: 'mercoledì', mappa: [
        '################################',
        '####=R=B=G=V=A=R=B=L=G=V=B=R####',
        '.%B..@........................##',
        '################################',
      ], clienti: { pazienza: 150, fila: [[2, 'blu'], [14, 'verde'], [28, 'arancio'], [40, 'rosso'], [52, 'viola'], [64, 'blu']] } },
      { nome: 'sabato', mappa: [
        '################################',
        '####=V=G=R=B=L=G=A=V=R=B=A=G####',
        '.%B..@........................##',
        '################################',
      ], clienti: { pazienza: 150, fila: [[2, 'rosso'], [10, 'arancio'], [22, 'giallo'], [30, 'giallo'],
                                          [44, 'blu'], [52, 'verde'], [66, 'arancio'], [80, 'viola']] } },
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'finche', 'se', 'aspetta', 'sempre', 'assegna', 'progetti'],
    colori: ['rosso', 'arancio', 'giallo', 'verde', 'blu', 'viola'], cose: ['cassa', 'cliente', 'bancone', 'niente', 'libero'],
    leggere: true, misure: true,
    aiuti: [
      'Si aspetta che al bancone ← ci sia un cliente, e si legge cosa chiede: «voglio diventa 📖 ←».',
      'Un progetto «cerca», con una misura che è un colore: il robot cammina finché ↑ sopra non c\'è una cassa di quel colore.',
      'Presa la cassa, si torna finché ← a sinistra c\'è il bancone, e la si posa lì. Il tutto, per sempre.',
    ],
    soluzione: programma({
      lavagnette: ['voglio'],
      progetti: [cerca()],
      principale: [fai.sempre([
        fai.aspetta(guarda('sinistra', 'cliente')),
        fai.assegna('voglio', leggi('sinistra')),
        fai.chiama('cerca', 'voglio'),
        fai.prendi('su'),
        fai.finche(guarda('sinistra', 'bancone'), [fai.vai('sinistra', 1)]),
        fai.posa('sinistra'),
      ])],
    }),
    fragili: [
      { nome: 'sempre la cassa blu', programma: programma({
        progetti: [cerca()],
        principale: [fai.sempre([
          fai.aspetta(guarda('sinistra', 'cliente')), fai.chiama('cerca', 'blu'), fai.prendi('su'),
          fai.finche(guarda('sinistra', 'bancone'), [fai.vai('sinistra', 1)]), fai.posa('sinistra')])],
      }) },
      { nome: 'senza aspettare il cliente', programma: programma({
        lavagnette: ['voglio'], progetti: [cerca()],
        principale: [fai.sempre([
          fai.assegna('voglio', leggi('sinistra')), fai.chiama('cerca', 'voglio'), fai.prendi('su'),
          fai.finche(guarda('sinistra', 'bancone'), [fai.vai('sinistra', 1)]), fai.posa('sinistra')])],
      }) },
    ],
  },
]

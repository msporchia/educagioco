/* ═══════════════════════════════════════════════════════════════════
   METTERE IN ORDINE — le lettere del postino, dalla più piccola alla più grande

   Il primo algoritmo vero del gioco. Sullo scaffale dell'ufficio postale
   ci sono le lettere, ognuna col numero della sua casa, e prima di
   partire il postino le vuole in fila: il numero più piccolo a sinistra.
   Il robot le legge (📖), le confronta (⚖️ «prima è maggiore di dopo»,
   il confronto che il linguaggio aveva e che nessun livello usava) e le
   scambia passando dal banco di sotto, perché in mano ne tiene una sola.

     · due lettere: confrontare due numeri e, solo se serve, scambiarle —
       lo scambio lo scrive il bambino, e diventa un attrezzo;
     · la passata: una passata lungo tutto lo scaffale porta la lettera
       più grande in fondo, come una bolla che sale. Negli ordini di questo
       livello una passata basta;
     · in ordine: con una passata sola non basta più, e si ripete la
       passata — tornando ogni volta all'inizio. È il bubble sort, scritto
       da un bambino.

   Si vince se a sera le lettere sullo scaffale sono in ordine
   (`inOrdine`, in `motore/porto/esito.js`): il banco non guarda come ci
   si è arrivati, e un programma che le ordina in un altro modo vince lo
   stesso.

   Dopo «In ordine» lo stesso algoritmo si guarda da quattro punti
   diversi — cosa vuol dire «fuori posto», cosa costa confrontare,
   quanto lavoro rifare quando basta poco, come unire invece di
   ordinare da capo:

     · il tricolore: la stessa passata di «In ordine», ma il fuori posto
       lo dice il colore delle casse (la bandiera) e non il numero — la
       bandiera olandese di Dijkstra, alla romana;
     · il casellario: le lettere del postino si ripetono, e ognuna sa già
       dov'è la sua casa. Imbucarle tutte e rileggere le buche in fila le
       rimette in ordine senza confrontare mai un numero con un altro —
       il contrario di «In ordine», apposta;
     · fare posto: lo scaffale parte già ordinato, e una lettera nuova
       (sempre più grande della sentinella «1» in testa) va infilata al
       suo posto senza rifare tutta la fila — l'inserimento, come si
       ordinano le carte tenute in mano;
     · la cerniera: due file già ordinate, su due nastri, si uniscono in
       una sola prendendo sempre la più piccola delle due teste — la
       fusione, il cuore del merge sort.

   Le mosse ingenue di questi quattro livelli sono spesso **false piste**
   (vedi `CLAUDE.md`): vincono il giorno più semplice e cedono solo
   quando la giornata smette di essere un caso particolare — le due
   bande già in ordine fra loro nel tricolore, le lettere arrivate già
   crescenti in «Fare posto», le due file perfettamente intrecciate nella
   «cerniera».
   ═══════════════════════════════════════════════════════════════════ */
import { fai, guarda, confronta, leggi, meno, piu, programma } from '../scrivi.js'
import { scambia, imbuca } from '../attrezzi.js'

const POSTINO = { emoji: '📮', nome: 'Il postino' }

/* L'ufficio postale: in alto lo scaffale con le lettere da mettere in
   ordine, sotto il corridoio del robot, più giù i banchi dove appoggiare
   una lettera mentre si scambia. E nient'altro: c'erano anche gli scaffali
   dei pacchi, a destra dietro un muro, e a chi l'ha provato «fanno solo
   confusione» — casse che non c'entrano sembrano cose da spostare. */
export function ufficio(numeri, robot = 1) {
  const n = numeri.length
  const corridoio = Array.from({ length: n }, (_, i) => (i + 1 === robot ? '.@' : '..')).join('')
  return [
    '##'.repeat(n + 2),
    '##' + numeri.map(x => '=' + x).join('') + '##',
    '##' + corridoio + '##',
    '##' + '=='.repeat(n) + '##',
    '##'.repeat(n + 2),
  ]
}
const inOrdine = n => ({ inOrdine: { y: 1, da: 1, a: n } })
const giorno = (nome, numeri, robot = 1) => ({
  nome, mappa: ufficio(numeri, robot), lavagnette: { lettere: numeri.length }, obiettivo: inOrdine(numeri.length),
})

/* il confronto di due vicine: prima quella sotto cui sta il robot, poi
   quella a destra */
const confrontaEScambia = (scambio) => [
  fai.assegna('prima', leggi('su')), fai.vai('destra', 1), fai.assegna('dopo', leggi('su')),
  fai.se(confronta('prima', '>', 'dopo'), scambio),
]
const passata = () => fai.ripeti(meno('lettere', 1), confrontaEScambia([fai.chiama('scambia')]))

/* lo scambio scritto a mano: la lettera sopra il robot va sul banco, quella
   a sinistra prende il suo posto, e quella del banco va a sinistra */
const SCAMBIO = [
  fai.prendi('su'), fai.posa('giu'), fai.vai('sinistra', 1), fai.prendi('su'),
  fai.vai('destra', 1), fai.posa('su'), fai.prendi('giu'), fai.vai('sinistra', 1), fai.posa('su'),
]

/* ── il tricolore: la stessa passata, letta sui colori ──
   La bandiera olandese di Dijkstra, alla romana: tre bande invece di
   due. L'algoritmo di «In ordine» non cambia una riga — confronta due
   vicine, scambiale se sono al contrario, ripeti finché la fila è
   ferma — cambia solo cosa vuol dire «al contrario»: non più un numero
   più grande di un altro, ma un colore che viene dopo nella bandiera. */
const inOrdineTricolore = n => ({ inOrdine: { y: 1, da: 1, a: n, colori: ['verde', 'bianco', 'rosso'] } })
const giornoTricolore = (nome, casse, robot = 1) => ({
  nome, mappa: ufficio(casse, robot), lavagnette: { casse: casse.length }, obiettivo: inOrdineTricolore(casse.length),
})
/* le tre coppie fuori posto: rosso prima di bianco, rosso prima di
   verde, bianco prima di verde — lette con `confronta('prima','=',…)`,
   che tiene un nome di colore per quello che è */
const confrontaEScambiaTricolore = () => [
  fai.assegna('prima', leggi('su')), fai.vai('destra', 1), fai.assegna('dopo', leggi('su')),
  fai.se(confronta('prima', '=', 'rosso'), [
    fai.se(confronta('dopo', '=', 'bianco'), [fai.chiama('scambia')]),
    fai.se(confronta('dopo', '=', 'verde'), [fai.chiama('scambia')]),
  ]),
  fai.se(confronta('prima', '=', 'bianco'), [
    fai.se(confronta('dopo', '=', 'verde'), [fai.chiama('scambia')]),
  ]),
]
const passataTricolore = () => fai.ripeti(meno('casse', 1), confrontaEScambiaTricolore())
/* la mossa ingenua: solo le due regole del rosso, come se la bandiera
   avesse due bande e non tre */
const confrontaEScambiaSoloRosso = () => [
  fai.assegna('prima', leggi('su')), fai.vai('destra', 1), fai.assegna('dopo', leggi('su')),
  fai.se(confronta('prima', '=', 'rosso'), [
    fai.se(confronta('dopo', '=', 'bianco'), [fai.chiama('scambia')]),
    fai.se(confronta('dopo', '=', 'verde'), [fai.chiama('scambia')]),
  ]),
]
/* l'altra mossa ingenua: la bandiera scritta al contrario, rosso davanti */
const confrontaEScambiaInversa = () => [
  fai.assegna('prima', leggi('su')), fai.vai('destra', 1), fai.assegna('dopo', leggi('su')),
  fai.se(confronta('prima', '=', 'verde'), [
    fai.se(confronta('dopo', '=', 'bianco'), [fai.chiama('scambia')]),
    fai.se(confronta('dopo', '=', 'rosso'), [fai.chiama('scambia')]),
  ]),
  fai.se(confronta('prima', '=', 'bianco'), [
    fai.se(confronta('dopo', '=', 'rosso'), [fai.chiama('scambia')]),
  ]),
]
const passateDi = corpo => [fai.ripeti(meno('casse', 1), [fai.ripeti(meno('casse', 1), corpo()), fai.vai('sinistra', meno('casse', 1))])]

/* ── il casellario: smistare senza confrontare ──
   Le stesse otto buche del postino (`dati/porto/giornate.js`), ma le
   lettere del sacco si ripetono: ognuna sa già dov'è la sua casa, senza
   bisogno di guardare le altre. Imbucate tutte, si rileggono le buche in
   fila dalla prima: il sacco torna pieno da solo, in ordine, e nessun
   numero è mai stato confrontato con un altro — è il contrario di «In
   ordine», apposta. */
function bucheDelCasellario(lettere) {
  const c = { p: { nome: 'il sacco della posta', dentro: lettere } }
  for (let n = 1; n <= 8; n++) c[n] = { nome: `la buca del ${n}`, figura: 'buca', numero: n, capienza: 9 }
  return c
}
const ufficioCasellario = () => [
  '########################',
  '####C1C2C3C4C5C6C7C8####',
  'Cp.@..................##',
  '########################',
]
const giornoCasellario = (nome, lettere) => ({
  nome, mappa: ufficioCasellario(), cassoni: bucheDelCasellario(lettere), lavagnette: { case: 8 },
  obiettivo: { cassoni: { p: { quante: lettere.length } }, inOrdine: { cassone: 'p' } },
})

/* ── fare posto: infilare al suo posto ──
   Lo scaffale è già in ordine; la gru cala altre lettere, una alla
   volta — sempre da due in su — e ognuna va infilata dove sta, senza
   rifare tutto lo scaffale: l'inserimento, come si mettono in ordine le
   carte tenute in mano. La «1» in testa allo scaffale non si sposta
   mai: è il fermo che ferma il confronto prima che il robot esca dallo
   scaffale, e funziona solo perché ogni lettera nuova è almeno un due. */
function giornoFarePosto(nome, iniziali, nuove) {
  const k = iniziali.length, m = nuove.length
  const w = k + m + 4                    /* muro, «1», le iniziali, le vuote, il punto della gru, muro */
  const gx = 2 + k + m                   /* colonna del punto della gru, e partenza del robot */
  const riga = f => Array.from({ length: w }, (_, x) => f(x)).join('')
  const mappa = [
    riga(() => '##'),
    riga(x => {
      if (x === 0 || x === w - 1) return '##'
      if (x === 1) return '=1'
      if (x <= 1 + k) return '=' + iniziali[x - 2]
      if (x === gx) return '.*'
      return '=.'
    }),
    riga(x => (x === 0 || x === w - 1 ? '##' : x === gx ? '.@' : '..')),
    riga(x => (x === 0 || x === w - 1 ? '##' : '==')),
    riga(() => '##'),
  ]
  return {
    nome, mappa, gru: { casse: nuove.join(''), ogni: 12, primo: 1 },
    lavagnette: { nuove: m }, obiettivo: { inOrdine: { y: 1, da: 1, a: 1 + k + m } },
  }
}

/* ── la cerniera: unire due file già in ordine ──
   Due postini hanno già ordinato il loro sacco, in fila su due nastri
   che portano verso il robot; il furgone li vuole in una fila sola.
   Niente si riordina: delle due teste si prende sempre la più piccola —
   la fusione, il cuore del merge sort. Il nastro d'arrivo (riga 3) è
   tenuto largo quanto tutte le lettere del giorno, perché quello che vi
   si posa non torna più indietro: si accoda da sé contro il muro a
   sinistra (`destinoSulNastro` in `motore/porto/mondo.js`). */
function giornoCerniera(nome, sinistra, destra) {
  const nS = sinistra.length, nD = destra.length
  const rx = nS + nD + 2                 /* la colonna del robot: posto per tutte le lettere del giorno, alla riga 3 */
  const w = rx + nD + 2
  const riga = f => Array.from({ length: w }, (_, x) => f(x)).join('')
  const mappa = [
    riga(() => '##'),
    riga(x => {
      if (x === rx) return '.@'
      if (x > 0 && x < rx) { const i = rx - x; return i <= nS ? '>' + sinistra[i - 1] : '##' }
      if (x > rx && x < w - 1) { const i = x - rx; return i <= nD ? '<' + destra[i - 1] : '##' }
      return '##'
    }),
    riga(x => (x === rx ? 'v.' : '##')),
    riga(x => (x > 0 && x < w - 1 ? '<.' : '##')),
    riga(() => '##'),
  ]
  return { nome, mappa, nastro: { passo: 1 }, obiettivo: { inOrdine: { y: 3, da: 1, a: nS + nD } } }
}

export const IN_ORDINE = [
  {
    chiave: 'due-lettere', nome: 'Due lettere', icona: '✉️', capitolo: 'ordine',
    impara: 'confrontare due numeri', portata: 95, premio: 25,
    mondo: 'porto', tema: 'bottega', prova: 'giornata',
    chi: POSTINO,
    racconto: 'Sul mio scaffale ci sono due lettere, e le voglio in ordine: il numero più piccolo a sinistra. A volte lo sono già, a volte no. In mano ne tieni una sola: per scambiarle c\'è il banco, qui sotto.',
    ordini: [
      { ...giorno('lunedì', [5, 3], 2), lavagnette: {} },
      { ...giorno('martedì', [2, 7], 2), lavagnette: {} },
      { ...giorno('mercoledì', [8, 1], 2), lavagnette: {} },
    ],
    cassetta: ['vai', 'prendi', 'posa', 'se', 'assegna', 'progetti'], colori: ['rosso'],
    cose: ['biglietto', 'niente'], leggere: true,
    ragiona: [
      'Tre giorni, tre coppie di lettere: lunedì vanno scambiate, martedì sono già a posto, mercoledì di nuovo no. Il programma è uno, e deve capire da solo se scambiarle.',
      'Tu, per decidere, cosa guarderesti? E il robot, dove si può scrivere i due numeri per poterli mettere a confronto?',
    ],
    indizi: [
      'Due lavagnette, «prima» e «dopo»: il robot va sotto la lettera di sinistra e legge ↑ nella prima, poi un passo a destra e legge ↑ nella dopo.',
      'Nella domanda del «se» c\'è ⚖️ confronta due numeri: «se prima è maggiore di dopo», e solo allora si scambia.',
      'Lo scambio, da sotto la lettera di destra: prendi ↑, posa ↓ sul banco, ← un passo, prendi ↑, → un passo, posa ↑, prendi ↓, ← un passo, posa ↑.',
    ],
    soluzione: programma({
      lavagnette: ['prima', 'dopo'],
      principale: [fai.vai('sinistra', 1), ...confrontaEScambia(SCAMBIO)],
    }),
    fragili: [
      { nome: 'le scambia sempre', programma: programma({
        lavagnette: ['prima', 'dopo'], principale: SCAMBIO }) },
      { nome: 'il confronto al contrario', programma: programma({
        lavagnette: ['prima', 'dopo'],
        principale: [fai.vai('sinistra', 1), fai.assegna('prima', leggi('su')), fai.vai('destra', 1), fai.assegna('dopo', leggi('su')),
          fai.se(confronta('prima', '<', 'dopo'), SCAMBIO)] }) },
    ],
  },
  {
    /* «passata» e non «bolla»: la bolla è già la bolla di carico del porto */
    chiave: 'passata', nome: 'La passata', icona: '🫧', capitolo: 'ordine',
    impara: 'una passata lungo la fila', portata: 96, premio: 30,
    mondo: 'porto', tema: 'bottega', prova: 'giornata',
    chi: POSTINO,
    racconto: 'Adesso le lettere sono di più, quante dice «lettere», e c\'è un solo guaio: una è fuori posto. Lo scambio lo sai già fare — è diventato un attrezzo. Confronta ogni lettera con quella dopo, lungo tutto lo scaffale.',
    ordini: [giorno('lunedì', [7, 1, 2, 4, 5]), giorno('martedì', [3, 9, 4, 6, 8]), giorno('mercoledì', [2, 8, 3, 5, 6, 7])],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'se', 'assegna', 'progetti'], colori: ['rosso'],
    cose: ['biglietto', 'niente'], leggere: true,
    attrezzi: [scambia()],
    ragiona: [
      'Cinque o sei lettere, e ogni giorno una è fuori posto: la più grande è finita troppo a sinistra. Il robot vede due lettere alla volta — quella sopra di sé e, facendo un passo, quella dopo.',
      'Se lungo lo scaffale ogni volta che due vicine sono al contrario le scambi, cosa succede alla lettera più grande? Dove finisce?',
    ],
    indizi: [
      'Il confronto di due vicine è quello di «Due lettere»: prima diventa 📖 ↑, un passo a destra, dopo diventa 📖 ↑, e se prima è maggiore di dopo, scambia.',
      'Lo scaffale ha «lettere» lettere, cioè «lettere − 1» coppie di vicine: ripeti il confronto tante volte quante sono le coppie.',
      'Lo scambio lascia il robot dov\'era, sotto la lettera di destra: è lì che il giro dopo legge la «prima».',
    ],
    soluzione: programma({ lavagnette: ['prima', 'dopo'], principale: [passata()] }),
    fragili: [
      { nome: 'il confronto al contrario', programma: programma({ lavagnette: ['prima', 'dopo'], principale: [
        fai.ripeti(meno('lettere', 1), [fai.assegna('prima', leggi('su')), fai.vai('destra', 1), fai.assegna('dopo', leggi('su')),
          fai.se(confronta('prima', '<', 'dopo'), [fai.chiama('scambia')])])] }) },
      /* la falsa pista: un giro di troppo, e l'ultimo passo va contro il muro */
      { nome: 'un giro di troppo', programma: programma({ lavagnette: ['prima', 'dopo'], principale: [
        fai.ripeti('lettere', confrontaEScambia([fai.chiama('scambia')]))] }) },
    ],
  },
  {
    chiave: 'in-ordine', nome: 'In ordine', icona: '🔢', capitolo: 'ordine',
    impara: 'ripetere la passata', portata: 97, premio: 35,
    mondo: 'porto', tema: 'bottega', prova: 'giornata', durata: 900,
    chi: POSTINO,
    racconto: 'Oggi è un disastro: le lettere sono tutte mescolate, e una passata sola non basta più. Ma una passata porta sempre la più grande in fondo… e poi?',
    ordini: [giorno('lunedì', [5, 3, 1, 4, 2]), giorno('martedì', [4, 6, 1, 3, 5, 2]), giorno('mercoledì', [9, 7, 5, 3, 1])],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'se', 'assegna', 'progetti'], colori: ['rosso'],
    cose: ['biglietto', 'niente'], leggere: true,
    attrezzi: [scambia()],
    ragiona: [
      'Dopo una passata la lettera più grande è in fondo, al suo posto per sempre. Ma le altre sono ancora mescolate, e il giorno dopo le lettere sono di più.',
      'Quante passate servono, al massimo, perché ogni lettera arrivi al suo posto? E finita una passata, da dove deve ripartire il robot per fare la prossima?',
    ],
    indizi: [
      'La passata è quella del livello prima: fanne un progetto, «passata», così il programma principale dice solo quante volte farla.',
      'Finita la passata il robot è in fondo allo scaffale: per la prossima deve tornare alla prima lettera, «lettere − 1» passi a sinistra.',
      'Ripeti «lettere − 1» volte: la passata, e poi torna all\'inizio.',
    ],
    soluzione: programma({ lavagnette: ['prima', 'dopo'], principale: [
      fai.ripeti(meno('lettere', 1), [passata(), fai.vai('sinistra', meno('lettere', 1))]),
    ] }),
    fragili: [
      { nome: 'una passata sola', programma: programma({ lavagnette: ['prima', 'dopo'], principale: [passata()] }) },
      /* la falsa pista: la seconda passata comincia in fondo, e il primo
         passo va contro il muro */
      { nome: 'senza tornare all\'inizio', programma: programma({ lavagnette: ['prima', 'dopo'], principale: [
        fai.ripeti(meno('lettere', 1), [passata()])] }) },
      { nome: 'le passate di lunedì', programma: programma({ lavagnette: ['prima', 'dopo'], principale: [
        fai.ripeti(4, [fai.ripeti(4, confrontaEScambia([fai.chiama('scambia')])), fai.vai('sinistra', 4)])] }) },
    ],
  },
  {
    chiave: 'tricolore', nome: 'Il tricolore', icona: '🇮🇹', capitolo: 'ordine',
    impara: 'l\'ordine lo decidi tu', portata: 97, premio: 35,
    mondo: 'porto', tema: 'bottega', prova: 'giornata',
    chi: { emoji: '👩‍💼', nome: 'La sindaca' },
    racconto: 'Domani è la festa del porto, e sullo scaffale le casse devono stare come la bandiera: prima le verdi, poi le bianche, infine le rosse. Sono tutte mescolate: rimettile in riga.',
    ordini: [
      giornoTricolore('lunedì', ['R', 'V', 'V', 'W', 'W']),
      giornoTricolore('martedì', ['W', 'R', 'V', 'R', 'V', 'W']),
      giornoTricolore('mercoledì', ['R', 'W', 'V', 'R', 'W', 'V', 'R']),
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'se', 'assegna', 'progetti'], colori: ['verde', 'bianco', 'rosso'],
    cose: ['cassa', 'niente'], leggere: true,
    attrezzi: [scambia()],
    ragiona: [
      'È lo stesso lavoro di «In ordine» — confrontare due casse vicine e scambiarle se sono al contrario, finché la fila non si muove più — ma qui non ci sono numeri: c\'è una bandiera da rispettare.',
      'Quando due casse vicine sono fuori posto, tu lo vedi guardando i colori. Il robot non sa cos\'è «più grande»: come gli dici, allora, che due colori sono al contrario?',
    ],
    indizi: [
      'Il confronto non è più fra numeri: è fra colori. Leggi «prima» e «dopo» come nel postino, ma decidi con dei «se» sui colori.',
      'Le coppie fuori posto sono solo tre: rosso prima di bianco, rosso prima di verde, bianco prima di verde. Un «se» per ciascuna, e per il resto tutte le altre coppie vanno bene così.',
      '«se prima è rosso: se dopo è bianco, scambia; se dopo è verde, scambia» — poi «se prima è bianco: se dopo è verde, scambia». Il resto è la stessa passata ripetuta di «In ordine».',
    ],
    soluzione: programma({ lavagnette: ['prima', 'dopo'], principale: [
      fai.ripeti(meno('casse', 1), [passataTricolore(), fai.vai('sinistra', meno('casse', 1))]),
    ] }),
    fragili: [
      /* la falsa pista: coi verdi e i bianchi già in ordine fra loro,
         lunedì basta spingere le rosse in fondo; dagli altri giorni no */
      { nome: 'solo le rosse in fondo', programma: programma({ lavagnette: ['prima', 'dopo'],
        principale: passateDi(confrontaEScambiaSoloRosso) }) },
      { nome: 'una passata sola', programma: programma({ lavagnette: ['prima', 'dopo'], principale: [passataTricolore()] }) },
      { nome: 'le rosse davanti', programma: programma({ lavagnette: ['prima', 'dopo'],
        principale: passateDi(confrontaEScambiaInversa) }) },
    ],
  },
  {
    chiave: 'casellario', nome: 'Il casellario', icona: '📬', capitolo: 'ordine',
    impara: 'ordinare senza confrontare', portata: 97, premio: 35,
    mondo: 'porto', tema: 'bottega', prova: 'giornata',
    chi: POSTINO,
    racconto: 'Oggi nel sacco le stesse lettere tornano più volte, e le voglio di nuovo nel sacco ma in ordine: in fondo tutte quelle dell\'1, sopra quelle del 2, e così via. Le buche delle case le conosci già.',
    ordini: [
      giornoCasellario('lunedì', '4271'),
      giornoCasellario('martedì', '355216'),
      giornoCasellario('mercoledì', '31824628'),
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'finche', 'assegna', 'progetti'], colori: ['rosso'],
    cose: ['niente', 'biglietto', 'cassone'], leggere: true,
    attrezzi: [imbuca()],
    ragiona: [
      'Le lettere si ripetono, e in «In ordine» ogni confronto costava un passo: con tante lettere uguali sarebbero tanti confronti per non scoprire mai niente di nuovo.',
      'Le buche delle case stanno in fila, dalla prima all\'ultima, e ogni lettera sa già qual è la sua. Se fossero tutte nella loro buca, passando le buche in fila in che ordine le troveresti?',
    ],
    indizi: [
      'Comincia svuotando il sacco: ogni lettera nella sua buca, dal numero che porta.',
      'Poi ripassa le buche in ordine, dalla prima all\'ultima: quello che trovi, rimettilo nel sacco.',
      '«ripeti finché a sinistra non c\'è niente: imbuca» (è un attrezzo). Poi «casa» parte da 1: per ognuna, vai alla sua buca, svuotala nel sacco finché non c\'è più niente sopra, e torna indietro.',
    ],
    soluzione: programma({ lavagnette: ['casa'], principale: [
      fai.finche(guarda('sinistra', 'niente'), [fai.chiama('imbuca')]),
      fai.assegna('casa', 1),
      fai.ripeti('case', [
        fai.vai('destra', 'casa'),
        fai.finche(guarda('su', 'niente'), [
          fai.prendi('su'), fai.vai('sinistra', 'casa'), fai.posa('sinistra'), fai.vai('destra', 'casa'),
        ]),
        fai.vai('sinistra', 'casa'),
        fai.assegna('casa', piu('casa', 1)),
      ]),
    ] }),
    fragili: [
      { nome: 'una lettera per buca', programma: programma({ lavagnette: ['casa'], principale: [
        fai.finche(guarda('sinistra', 'niente'), [fai.chiama('imbuca')]),
        fai.assegna('casa', 1),
        fai.ripeti('case', [
          fai.vai('destra', 'casa'),
          fai.se(guarda('su', 'biglietto'), [
            fai.prendi('su'), fai.vai('sinistra', 'casa'), fai.posa('sinistra'), fai.vai('destra', 'casa'),
          ]),
          fai.vai('sinistra', 'casa'),
          fai.assegna('casa', piu('casa', 1)),
        ]),
      ] }) },
      { nome: 'dalla casa più grande', programma: programma({ lavagnette: ['casa'], principale: [
        fai.finche(guarda('sinistra', 'niente'), [fai.chiama('imbuca')]),
        fai.assegna('casa', 8),
        fai.ripeti('case', [
          fai.vai('destra', 'casa'),
          fai.finche(guarda('su', 'niente'), [
            fai.prendi('su'), fai.vai('sinistra', 'casa'), fai.posa('sinistra'), fai.vai('destra', 'casa'),
          ]),
          fai.vai('sinistra', 'casa'),
          fai.assegna('casa', meno('casa', 1)),
        ]),
      ] }) },
      { nome: 'senza smistamento', programma: programma({ principale: [
        fai.finche(guarda('sinistra', 'niente'), [fai.chiama('imbuca')]),
      ] }) },
    ],
  },
  {
    chiave: 'fare-posto', nome: 'Fare posto', icona: '↔️', capitolo: 'ordine',
    impara: 'infilare al suo posto', portata: 98, premio: 40, durata: 900,
    mondo: 'porto', tema: 'bottega', prova: 'giornata',
    chi: POSTINO,
    racconto: 'Lo scaffale è già in ordine, ma la gru non si ferma: ogni tanto cala un\'altra lettera, sempre almeno un due. Infilala al suo posto, senza mai rovinare l\'ordine delle altre.',
    ordini: [
      giornoFarePosto('lunedì', [2, 3], [4, 5, 6]),
      giornoFarePosto('martedì', [2, 3, 5, 8], [4, 7, 2, 6]),
      giornoFarePosto('mercoledì', [3, 6, 9], [2, 8, 5, 7]),
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'finche', 'aspetta', 'assegna', 'progetti'], colori: ['rosso'],
    cose: ['biglietto', 'niente', 'muro'], leggere: true,
    attrezzi: [scambia()],
    ragiona: [
      'Lo scaffale parte già in ordine: il problema non è ordinarlo, è non rovinarlo mentre arriva una lettera nuova.',
      'Una lettera nuova non deve finire in fondo e basta: deve infilarsi esattamente dove la fila resta in ordine. Come la trovi, quella posizione?',
    ],
    indizi: [
      'Aspetta la lettera sotto la gru, prendila, e mettila per il momento nell\'ultimo posto libero, subito dopo l\'ultima lettera già in ordine.',
      'Da lì, confrontala con quella alla sua sinistra: se non è più grande di lei, scambiale, e continua a confrontare finché non trovi una lettera più piccola.',
      'La casella «1» in testa allo scaffale non si sposta mai: è lì apposta, per fermare il confronto senza far uscire il robot dallo scaffale — ogni lettera nuova è almeno un due.',
    ],
    soluzione: programma({ lavagnette: ['nuova', 'prima'], principale: [
      fai.ripeti('nuove', [
        fai.aspetta(guarda('su', 'biglietto')),
        fai.prendi('su'), fai.assegna('nuova', leggi('mano')),
        /* un passo garantito fuori dal punto della gru: appena il robot
           lo lascia libero, la gru può calarci sopra la prossima lettera
           nello stesso istante — e la ricerca non deve mai leggerla lì */
        fai.vai('sinistra', 1),
        fai.finche(guarda('su', 'biglietto'), [fai.vai('sinistra', 1)]),
        fai.vai('destra', 1), fai.posa('su'),
        fai.vai('sinistra', 1), fai.assegna('prima', leggi('su')),
        fai.finche(confronta('prima', '<', 'nuova'), [
          fai.vai('destra', 1), fai.chiama('scambia'), fai.vai('sinistra', 2), fai.assegna('prima', leggi('su')),
        ]),
        fai.finche(guarda('destra', 'muro'), [fai.vai('destra', 1)]),
      ]),
    ] }),
    fragili: [
      { nome: 'in fondo e basta', programma: programma({ lavagnette: ['nuova'], principale: [
        fai.ripeti('nuove', [
          fai.aspetta(guarda('su', 'biglietto')),
          fai.prendi('su'), fai.assegna('nuova', leggi('mano')),
          fai.vai('sinistra', 1),
          fai.finche(guarda('su', 'biglietto'), [fai.vai('sinistra', 1)]),
          fai.vai('destra', 1), fai.posa('su'),
          fai.finche(guarda('destra', 'muro'), [fai.vai('destra', 1)]),
        ]),
      ] }) },
      { nome: 'uno scambio solo', programma: programma({ lavagnette: ['nuova', 'prima'], principale: [
        fai.ripeti('nuove', [
          fai.aspetta(guarda('su', 'biglietto')),
          fai.prendi('su'), fai.assegna('nuova', leggi('mano')),
          fai.vai('sinistra', 1),
          fai.finche(guarda('su', 'biglietto'), [fai.vai('sinistra', 1)]),
          fai.vai('destra', 1), fai.posa('su'),
          fai.vai('sinistra', 1), fai.assegna('prima', leggi('su')),
          fai.se(confronta('prima', '>', 'nuova'), [fai.vai('destra', 1), fai.chiama('scambia'), fai.vai('sinistra', 2)]),
          fai.finche(guarda('destra', 'muro'), [fai.vai('destra', 1)]),
        ]),
      ] }) },
      { nome: 'il confronto al contrario', programma: programma({ lavagnette: ['nuova', 'prima'], principale: [
        fai.ripeti('nuove', [
          fai.aspetta(guarda('su', 'biglietto')),
          fai.prendi('su'), fai.assegna('nuova', leggi('mano')),
          fai.vai('sinistra', 1),
          fai.finche(guarda('su', 'biglietto'), [fai.vai('sinistra', 1)]),
          fai.vai('destra', 1), fai.posa('su'),
          fai.vai('sinistra', 1), fai.assegna('prima', leggi('su')),
          fai.finche(confronta('prima', '>', 'nuova'), [
            fai.vai('destra', 1), fai.chiama('scambia'), fai.vai('sinistra', 2), fai.assegna('prima', leggi('su')),
          ]),
          fai.finche(guarda('destra', 'muro'), [fai.vai('destra', 1)]),
        ]),
      ] }) },
    ],
  },
  {
    chiave: 'cerniera', nome: 'La cerniera', icona: '🤐', capitolo: 'ordine',
    impara: 'unire due file in ordine', portata: 98, premio: 40,
    mondo: 'porto', tema: 'molo', prova: 'giornata',
    chi: { emoji: '🚚', nome: 'L\'autista' },
    racconto: 'Due postini mi hanno già consegnato le lettere in ordine, su due nastri. Io le voglio in una fila sola, in ordine: a ogni giro, prendi la più piccola delle due che hai davanti.',
    ordini: [
      giornoCerniera('lunedì', [1, 2, 3], [4, 5, 6]),
      giornoCerniera('martedì', [1, 3, 5, 7], [2, 4, 6]),
      giornoCerniera('mercoledì', [2, 3, 7, 8], [1, 4, 5, 6]),
    ],
    cassetta: ['prendi', 'posa', 'finche', 'se', 'assegna'], colori: ['rosso'],
    cose: ['niente', 'biglietto'], leggere: true,
    ragiona: [
      'Le due file sono già in ordine per conto loro: il lavoro non è ordinarle, è unirle senza spezzare l\'ordine che hanno già.',
      'A ogni passo hai davanti due lettere, una per nastro. Una delle due può scendere verso il furgone senza rovinare l\'ordine, qualunque cosa arrivi dopo: quale, e perché proprio lei?',
    ],
    indizi: [
      'Guarda sempre le teste delle due file, mai il resto: quello che conta è solo chi sta davanti adesso.',
      'Se un lato è già vuoto, l\'altra fila scende così com\'è, senza più bisogno di confrontare niente.',
      '«sinistra diventa 📖 ←, destra diventa 📖 →, se sinistra è minore di destra: prendi dalla sinistra, altrimenti dalla destra» — e quello che prendi lo posi giù, verso il nastro che scende.',
    ],
    soluzione: programma({ lavagnette: ['sinistra', 'destra'], principale: [
      fai.finche(guarda('sinistra', 'niente'), [
        fai.se(guarda('destra', 'niente'), [fai.prendi('sinistra')], [
          fai.assegna('sinistra', leggi('sinistra')), fai.assegna('destra', leggi('destra')),
          fai.se(confronta('sinistra', '<', 'destra'), [fai.prendi('sinistra')], [fai.prendi('destra')]),
        ]),
        fai.posa('giu'),
      ]),
      fai.finche(guarda('destra', 'niente'), [fai.prendi('destra'), fai.posa('giu')]),
    ] }),
    fragili: [
      /* la falsa pista: lunedì le due file non si incrociano mai (tutta
         la sinistra è più piccola di tutta la destra), quindi vince */
      { nome: 'prima tutte quelle di sinistra', programma: programma({ principale: [
        fai.finche(guarda('sinistra', 'niente'), [fai.prendi('sinistra'), fai.posa('giu')]),
        fai.finche(guarda('destra', 'niente'), [fai.prendi('destra'), fai.posa('giu')]),
      ] }) },
      /* l'altra falsa pista: martedì le due file sono perfettamente
         intrecciate (dispari a sinistra, pari a destra), quindi
         alternare senza confrontare basta lo stesso */
      { nome: 'una e una', programma: programma({ principale: [
        fai.ripeti(8, [
          fai.se(guarda('sinistra', 'biglietto'), [fai.prendi('sinistra'), fai.posa('giu')]),
          fai.se(guarda('destra', 'biglietto'), [fai.prendi('destra'), fai.posa('giu')]),
        ]),
      ] }) },
      { nome: 'il confronto al contrario', programma: programma({ lavagnette: ['sinistra', 'destra'], principale: [
        fai.finche(guarda('sinistra', 'niente'), [
          fai.se(guarda('destra', 'niente'), [fai.prendi('sinistra')], [
            fai.assegna('sinistra', leggi('sinistra')), fai.assegna('destra', leggi('destra')),
            fai.se(confronta('sinistra', '>', 'destra'), [fai.prendi('sinistra')], [fai.prendi('destra')]),
          ]),
          fai.posa('giu'),
        ]),
        fai.finche(guarda('destra', 'niente'), [fai.prendi('destra'), fai.posa('giu')]),
      ] }) },
    ],
  },
]

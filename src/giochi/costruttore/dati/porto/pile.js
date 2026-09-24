/* ═══════════════════════════════════════════════════════════════════
   LE PILE — si prende solo quella in cima

   In fondo alla fila. Una pila tiene le cose una sull'altra, e si
   prende sempre quella in cima: il cassone del porto lo era da sempre,
   e nessun livello lo faceva lavorare.

     · il carico al contrario: la fila di sopra rifatta sotto,
       rovesciata. Il cassone la capovolge da solo — dentro in un verso,
       fuori nell'altro — e il programma non ha niente che capovolga;
     · la torre del casaro (Hanoi): le forme di formaggio stanno in pila
       sulle tre assi, e una grande sopra una più piccola la schiaccia
       (`figura: 'pila'` in `motore/porto/mondo.js`). Due forme a mano;
       tre con la «torre di due» già fatta; quattro scrivendo la «torre
       di tre» con quella di due; e poi quante se ne vuole — col
       progetto che chiama sé stesso.

   ── PERCHÉ LA TORRE È UNA SCALA DI QUATTRO LIVELLI ────────────────
   La ricorsione non si spiega: si arriva a vederla. Ogni gradino dà già
   fatto quello che il bambino ha scritto in quello prima (gli attrezzi),
   e il gradino dopo è lo stesso disegno una volta più in alto: tre
   forme sono «la torre di due, la grande, la torre di due»; quattro
   sono «la torre di tre, la grande, la torre di tre» — e la torre di
   tre la scrive lui, con la torre di due dentro. Al quarto gradino le
   torri sono alte tre, quattro, cinque e sei, e nessuna torre già
   fatta basta: resta solo il progetto che, per spostare una torre alta
   N, sposta due torri alte N − 1. Quello che rende la ricorsione
   **necessaria** è lo zaino: la catena di torri di tre, quattro,
   cinque, sei scritte una per una non ci sta.

   Il robot sta fermo fra le tre assi — la rossa a sinistra, la verde
   sopra, la blu a destra — e l'attrezzo «sposta» porta una forma da
   un'asse all'altra: la lezione è la torre, non la strada. Le assi si
   chiamano col loro colore, ed è così che un ordine dice «partenza»,
   «arrivo» e «appoggio»: tre colori, che cambiano da un giorno
   all'altro, e un programma scritto coi colori di lunedì perde martedì.
   ═══════════════════════════════════════════════════════════════════ */
import { fai, guarda, confronta, meno, progetto, programma } from '../scrivi.js'
import { sposta, torreDiDue } from '../attrezzi.js'

/* ═══════════ il carico al contrario ═══════════ */

const CAPITANO = { emoji: '👩‍✈️', nome: 'La capitana' }

/* Sopra la fila caricata, sotto lo scaffale del camion col disegno da
   fare in trasparenza (la fila rovesciata), e a sinistra del robot il
   cassone. Il robot parte sotto la prima cassa. */
function stiva(casse) {
  const n = casse.length
  const rovescia = [...casse].reverse().map(l => '=' + l.toLowerCase()).join('')
  return [
    '##'.repeat(n + 2),
    '##' + [...casse].map(l => '=' + l).join('') + '##',
    'Cc.@' + '..'.repeat(n - 1) + '##',
    '##' + rovescia + '##',
    '##'.repeat(n + 2),
  ]
}
const carico = (nome, casse) => ({
  nome, mappa: stiva(casse), lavagnette: { casse: casse.length },
  cassoni: { c: { nome: 'il cassone', capienza: 9 } },
})

/* le due strade del robot, scritte una volta: fino alla prima cassa di
   sopra, e di nuovo accanto al cassone */
const allaCassa = () => fai.finche(guarda('su', 'cassa'), [fai.vai('destra', 1)])
const alCassone = () => fai.finche(guarda('sinistra', 'cassone'), [fai.vai('sinistra', 1)])

const AL_CONTRARIO = {
  chiave: 'al-contrario', nome: 'Il carico al contrario', icona: '🔄', capitolo: 'pile',
  impara: 'la pila capovolge', portata: 99, premio: 35,
  mondo: 'porto', tema: 'magazzino', prova: 'giornata',
  chi: CAPITANO,
  racconto: 'Abbiamo caricato la nave al contrario! Le casse di sopra vanno rifatte sullo scaffale di sotto nell\'ordine rovesciato: l\'ultima diventa la prima. Ti presto il cassone: dentro ci stanno una sull\'altra, e si prende sempre quella in cima.',
  ordini: [
    carico('lunedì', ['R', 'V', 'R']),
    carico('martedì', ['R', 'V', 'B', 'G']),
    carico('mercoledì', ['G', 'B', 'R', 'V', 'A']),
  ],
  cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'finche', 'se'],
  colori: ['rosso', 'verde', 'blu', 'giallo', 'arancio'],
  cose: ['cassa', 'niente', 'cassone'], leggere: false,
  ragiona: [
    'Tre giorni, tre file: la prima cassa di sopra deve finire ultima sotto, e l\'ultima prima. Il robot porta una cassa alla volta, e il programma non sa quante sono né di che colore.',
    'Nel cassone si prende sempre quella in cima, cioè l\'ultima che ci hai messo. Se ci metti dentro tutta la fila e poi la tiri fuori, in che ordine escono?',
  ],
  indizi: [
    'Due giri: nel primo tutte le casse di sopra vanno nel cassone, una alla volta; nel secondo escono, una alla volta, e vanno sotto.',
    'Per arrivare alla prima cassa rimasta: vai a destra finché sopra c\'è una cassa. Per tornare: vai a sinistra finché a sinistra c\'è il cassone.',
    'Nel secondo giro la cassa va nel primo posto libero di sotto: vai a destra finché sotto non c\'è niente, e posa ↓.',
  ],
  soluzione: programma({ principale: [
    fai.ripeti('casse', [allaCassa(), fai.prendi('su'), alCassone(), fai.posa('sinistra')]),
    fai.ripeti('casse', [
      fai.prendi('sinistra'),
      fai.finche(guarda('giu', 'niente'), [fai.vai('destra', 1)]),
      fai.posa('giu'),
      alCassone(),
    ]),
  ] }),
  fragili: [
    /* la falsa pista: lunedì la fila è rosso-verde-rosso, e rovesciarla
       o no è lo stesso */
    { nome: 'dritte giù, senza cassone', programma: programma({ principale: [
      fai.ripeti(meno('casse', 1), [fai.prendi('su'), fai.posa('giu'), fai.vai('destra', 1)]),
      fai.prendi('su'), fai.posa('giu'),
    ] }) },
    { nome: 'dentro e subito fuori', programma: programma({ principale: [
      fai.ripeti('casse', [
        allaCassa(), fai.prendi('su'), alCassone(), fai.posa('sinistra'), fai.prendi('sinistra'),
        fai.finche(guarda('giu', 'niente'), [fai.vai('destra', 1)]), fai.posa('giu'), alCassone(),
      ]),
    ] }) },
  ],
}

/* ═══════════ la torre del casaro ═══════════ */

const CASARO = { emoji: '🧑‍🍳', nome: 'Il casaro' }
const COLORI_ASSI = ['rosso', 'verde', 'blu']
const ASSE = { rosso: 'R', verde: 'V', blu: 'B' }
const NOME_ASSE = { rosso: 'l\'asse rossa', verde: 'l\'asse verde', blu: 'l\'asse blu' }

/* il magazzino: le tre assi attorno al robot, e i muri intorno */
const MAGAZZINO = [
  '##########',
  '####CV####',
  '##CR.@CB##',
  '##########',
]

/* un giorno del casaro: la torre di `forme` forme sull'asse `da`, che
   va portata sull'asse `a`. L'asse libera (`via`) la dice l'ordine: è
   quella che resta. `conForme` mette anche l'altezza fra le lavagnette,
   dove i giorni non sono tutti alti uguali. */
function giorno(nome, forme, partenza, arrivo, { conForme = false } = {}) {
  const appoggio = COLORI_ASSI.find(c => c !== partenza && c !== arrivo)
  const cassoni = {}
  for (const c of COLORI_ASSI)
    cassoni[ASSE[c]] = { nome: NOME_ASSE[c], figura: 'pila', tinta: c, forme: c === partenza ? forme : 0, capienza: 99 }
  return {
    nome, mappa: MAGAZZINO, cassoni,
    lavagnette: conForme ? { forme, partenza, arrivo, appoggio } : { partenza, arrivo, appoggio },
    obiettivo: { cassoni: { [ASSE[arrivo]]: { quante: forme } } },
  }
}

const TORRE = {
  mondo: 'porto', tema: 'magazzino', prova: 'giornata', capitolo: 'pile',
  chi: CASARO,
  cassetta: ['prendi', 'posa', 'se', 'progetti'],
  colori: COLORI_ASSI,
  cose: ['forma', 'niente'], leggere: false,
}

/* le tre assi di una torre, per il ruolo che hanno: da dove parte, dove
   arriva, e quella libera dove si appoggia intanto. Sono nomi e non
   preposizioni perché dentro la torre il progetto passa a sé stesso le
   sue misure: con «da», «a» e «via» la riga si leggeva «torre da da a via
   via a», e non si capiva niente */
const ruoli = ['partenza', 'arrivo', 'appoggio']
const tipiRuoli = { partenza: 'colore', arrivo: 'colore', appoggio: 'colore' }

const DUE_FORME = {
  ...TORRE,
  chiave: 'due-forme', nome: 'Le due forme', icona: '🧀', impara: 'la regola della pila', portata: 99, premio: 30,
  racconto: 'Nel mio magazzino le forme di formaggio stanno in pila sulle tre assi: la rossa, la verde e la blu. La regola è una sola: una forma grande sopra una più piccola la schiaccia. Oggi due forme vanno portate dall\'asse di «partenza» a quella di «arrivo», e quella libera è l\'«appoggio». «Sposta» porta la forma in cima da un\'asse all\'altra.',
  ordini: [
    giorno('lunedì', 2, 'rosso', 'blu'),
    giorno('martedì', 2, 'verde', 'rosso'),
    giorno('mercoledì', 2, 'blu', 'verde'),
  ],
  attrezzi: [sposta()],
  ragiona: [
    'Due forme, la piccola sopra la grande: devono finire sull\'altra asse nello stesso modo, la piccola sopra. E ogni giorno le assi sono altre.',
    'Se porti subito la piccola dove deve andare la torre, dove può andare la grande? E l\'asse libera, a cosa serve?',
  ],
  indizi: [
    'Tre spostamenti: la piccola sull\'asse libera, la grande dove deve andare, la piccola sopra la grande.',
    'Le assi non si scrivono coi colori: si scrivono con quello che dice l\'ordine — «sposta da partenza a appoggio», «sposta da partenza a arrivo», «sposta da appoggio a arrivo».',
  ],
  soluzione: programma({ principale: [
    fai.chiama('sposta', 'partenza', 'appoggio'), fai.chiama('sposta', 'partenza', 'arrivo'), fai.chiama('sposta', 'appoggio', 'arrivo'),
  ] }),
  fragili: [
    { nome: 'i colori di lunedì', programma: programma({ principale: [
      fai.chiama('sposta', 'rosso', 'verde'), fai.chiama('sposta', 'rosso', 'blu'), fai.chiama('sposta', 'verde', 'blu'),
    ] }) },
    { nome: 'tutte e due dritte', programma: programma({ principale: [
      fai.chiama('sposta', 'partenza', 'arrivo'), fai.chiama('sposta', 'partenza', 'arrivo'),
    ] }) },
  ],
}

const TRE_FORME = {
  ...TORRE,
  chiave: 'tre-forme', nome: 'Tre forme', icona: '🧀', impara: 'la torre dentro la torre', portata: 99, premio: 40,
  racconto: 'Adesso le forme sono tre. Quello che hai fatto con due l\'ho scritto su un foglio: è la «torre di due», e porta una torre di due forme da un\'asse all\'altra passando per la terza. Usala!',
  ordini: [
    giorno('lunedì', 3, 'rosso', 'blu'),
    giorno('martedì', 3, 'blu', 'verde'),
    giorno('mercoledì', 3, 'verde', 'rosso'),
  ],
  attrezzi: [sposta(), torreDiDue()],
  zaino: 4,
  ragiona: [
    'La forma più grande sta sotto le altre due, e per spostarla sopra non deve avere niente — e dove va non ci deve essere niente. Nello zaino ci stanno quattro righe: a mano, spostamento per spostamento, non ci stai.',
    'Le due forme piccole sopra la grande sono una torre di due. Dove la metti, mentre la grande cambia asse?',
  ],
  indizi: [
    'Tre righe: la torre di due via dalla grande, la grande al suo posto, la torre di due di nuovo sopra.',
    'La torre di due va sull\'asse d\'appoggio: la sua partenza è la tua partenza, e il suo arrivo è il tuo appoggio.',
    'Poi «sposta da partenza a arrivo» per la grande, e una torre di due che parte dall\'appoggio e arriva all\'arrivo, per rimetterle sopra.',
  ],
  soluzione: programma({ principale: [
    fai.chiama('torre2', 'partenza', 'appoggio', 'arrivo'), fai.chiama('sposta', 'partenza', 'arrivo'), fai.chiama('torre2', 'appoggio', 'arrivo', 'partenza'),
  ] }),
  fragili: [
    { nome: 'la torre di due dritta dove va', programma: programma({ principale: [
      fai.chiama('torre2', 'partenza', 'arrivo', 'appoggio'), fai.chiama('sposta', 'partenza', 'arrivo'), fai.chiama('torre2', 'appoggio', 'arrivo', 'partenza'),
    ] }) },
    /* giusto, ma sono sette righe: lo zaino ne tiene quattro */
    { nome: 'a mano, sette spostamenti', programma: programma({ principale: [
      fai.chiama('sposta', 'partenza', 'arrivo'), fai.chiama('sposta', 'partenza', 'appoggio'), fai.chiama('sposta', 'arrivo', 'appoggio'),
      fai.chiama('sposta', 'partenza', 'arrivo'),
      fai.chiama('sposta', 'appoggio', 'partenza'), fai.chiama('sposta', 'appoggio', 'arrivo'), fai.chiama('sposta', 'partenza', 'arrivo'),
    ] }) },
  ],
}

/* la torre di tre del bambino: è la soluzione di «Tre forme» diventata
   un progetto, con le sue tre misure */
const torreDiTre = () => progetto('torre3', { nome: 'torre di tre', icona: '🗼', misure: ruoli, tipi: tipiRuoli }, [
  fai.chiama('torre2', 'partenza', 'appoggio', 'arrivo'), fai.chiama('sposta', 'partenza', 'arrivo'), fai.chiama('torre2', 'appoggio', 'arrivo', 'partenza'),
])

const QUATTRO_FORME = {
  ...TORRE,
  chiave: 'quattro-forme', nome: 'Quattro forme', icona: '🧀', impara: 'la torre di tre, fatta da te', portata: 100, premio: 45,
  misure: true,
  racconto: 'Quattro forme! La torre di due te la do ancora, ma una torre di tre non ce l\'ho: scrivila tu, come progetto, con le sue tre assi da riempire. Poi le quattro forme si spostano come si spostavano le tre.',
  ordini: [
    giorno('lunedì', 4, 'rosso', 'blu'),
    giorno('martedì', 4, 'verde', 'blu'),
    giorno('mercoledì', 4, 'blu', 'rosso'),
  ],
  attrezzi: [sposta(), torreDiDue()],
  zaino: 6,
  ragiona: [
    'Quattro forme: la grande sotto, e sopra una torre di tre. Tre forme le hai già spostate — con la torre di due, una grande, e di nuovo la torre di due.',
    'Se avessi una «torre di tre» che funziona da qualunque asse a qualunque asse, come sposteresti quattro forme? E una torre di tre, com\'è fatta dentro?',
  ],
  indizi: [
    'Un progetto «torre di tre» con tre misure che sono colori: partenza, arrivo, appoggio. Dentro, le tre righe di «Tre forme», con le sue misure al posto delle lavagnette dell\'ordine.',
    'Il programma principale è lo stesso disegno una volta più in alto: la torre di tre via, la grande al suo posto, la torre di tre sopra.',
    'Il principale: una torre di tre da partenza ad appoggio, «sposta da partenza a arrivo», e una torre di tre da appoggio ad arrivo.',
  ],
  soluzione: programma({
    progetti: [torreDiTre()],
    principale: [fai.chiama('torre3', 'partenza', 'appoggio', 'arrivo'), fai.chiama('sposta', 'partenza', 'arrivo'), fai.chiama('torre3', 'appoggio', 'arrivo', 'partenza')],
  }),
  fragili: [
    { nome: 'la torre di tre dritta dove va', programma: programma({
      progetti: [torreDiTre()],
      principale: [fai.chiama('torre3', 'partenza', 'arrivo', 'appoggio'), fai.chiama('sposta', 'partenza', 'arrivo'), fai.chiama('torre3', 'appoggio', 'arrivo', 'partenza')],
    }) },
    /* giusto, ma sono sette righe: senza il progetto non ci si sta */
    { nome: 'senza progetto, torri di due', programma: programma({ principale: [
      fai.chiama('torre2', 'partenza', 'arrivo', 'appoggio'), fai.chiama('sposta', 'partenza', 'appoggio'), fai.chiama('torre2', 'arrivo', 'appoggio', 'partenza'),
      fai.chiama('sposta', 'partenza', 'arrivo'),
      fai.chiama('torre2', 'appoggio', 'partenza', 'arrivo'), fai.chiama('sposta', 'appoggio', 'arrivo'), fai.chiama('torre2', 'partenza', 'arrivo', 'appoggio'),
    ] }) },
  ],
}

/* la torre del bambino, alta quanto si vuole: per spostarne una alta
   «alta», se ne spostano due alte «alta − 1». Una torre alta zero non
   si sposta: è il fermo, senza il quale non finirebbe mai */
const torre = ({ fermo = true, dritta = false } = {}) => {
  const giu = meno('alta', 1)
  const corpo = [
    dritta ? fai.chiama('torre', giu, 'partenza', 'arrivo', 'appoggio') : fai.chiama('torre', giu, 'partenza', 'appoggio', 'arrivo'),
    fai.chiama('sposta', 'partenza', 'arrivo'),
    fai.chiama('torre', giu, 'appoggio', 'arrivo', 'partenza'),
  ]
  return progetto('torre', { nome: 'torre', icona: '🗼', misure: ['alta', ...ruoli], tipi: tipiRuoli },
    fermo ? [fai.se(confronta('alta', '>', 0), corpo)] : corpo)
}

const QUANTE_FORME = {
  ...TORRE,
  chiave: 'quante-forme', nome: 'La torre del casaro', icona: '🗼', impara: 'il progetto che chiama sé stesso', portata: 100, premio: 60,
  misure: true, ricorsione: true,
  racconto: 'Il gran giorno: pile di tre, quattro, cinque forme… e domenica sei! Torri già fatte non ne ho più, solo «sposta». Ma hai visto come si fa: una torre di quattro è una torre di tre, la grande, e di nuovo una torre di tre. E un progetto può chiamare anche sé stesso.',
  ordini: [
    giorno('lunedì', 3, 'rosso', 'blu', { conForme: true }),
    giorno('martedì', 4, 'verde', 'rosso', { conForme: true }),
    giorno('mercoledì', 5, 'blu', 'verde', { conForme: true }),
    giorno('domenica', 6, 'rosso', 'verde', { conForme: true }),
  ],
  attrezzi: [sposta()],
  zaino: 6,
  ragiona: [
    'Ogni giorno la torre è alta in un altro modo, e nello zaino non ci stanno una torre di tre, una di quattro, una di cinque e una di sei scritte una per una. Serve una torre sola, alta quanto dice la sua misura.',
    'Una torre alta 5 è una torre alta 4, la grande, e di nuovo una torre alta 4. E una torre alta 4? E una alta 1 — e una alta 0?',
  ],
  indizi: [
    'Un progetto «torre» con quattro misure: «alta», che è un numero, e partenza, arrivo e appoggio, che sono colori. Il programma principale lo chiama una volta, con «forme» e le tre assi dell\'ordine.',
    'Dentro «torre» ci sono due torri alte «alta − 1» — e la torre è proprio lei: un progetto può chiamare sé stesso.',
    'Ma una torre alta 0 non si sposta: tutto il lavoro va dentro «se alta è maggiore di 0», se no il robot non smette mai.',
  ],
  soluzione: programma({ progetti: [torre()], principale: [fai.chiama('torre', 'forme', 'partenza', 'arrivo', 'appoggio')] }),
  fragili: [
    { nome: 'senza il fermo', programma: programma({ progetti: [torre({ fermo: false })],
      principale: [fai.chiama('torre', 'forme', 'partenza', 'arrivo', 'appoggio')] }) },
    { nome: 'le torri dritte dove vanno', programma: programma({ progetti: [torre({ dritta: true })],
      principale: [fai.chiama('torre', 'forme', 'partenza', 'arrivo', 'appoggio')] }) },
    { nome: 'sempre alta quattro', programma: programma({ progetti: [torre()],
      principale: [fai.chiama('torre', 4, 'partenza', 'arrivo', 'appoggio')] }) },
  ],
}

export const PILE = [AL_CONTRARIO, DUE_FORME, TRE_FORME, QUATTRO_FORME, QUANTE_FORME]

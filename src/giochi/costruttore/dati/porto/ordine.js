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
   ═══════════════════════════════════════════════════════════════════ */
import { fai, confronta, leggi, meno, programma } from '../scrivi.js'
import { scambia } from '../attrezzi.js'

const POSTINO = { emoji: '📮', nome: 'Il postino' }

/* L'ufficio postale: in alto lo scaffale con le lettere da mettere in
   ordine, sotto il corridoio del robot, più giù i banchi dove appoggiare
   una lettera mentre si scambia. A destra, dietro un muro, gli scaffali
   dei pacchi: non c'entrano, ma un ufficio vero non ha solo quello che
   serve alla lezione. */
export function ufficio(numeri, robot = 1) {
  const n = numeri.length
  const corridoio = Array.from({ length: n }, (_, i) => (i + 1 === robot ? '.@' : '..')).join('')
  return [
    '##'.repeat(n + 6),
    '##' + numeri.map(x => '=' + x).join('') + '##=R=G=B##',
    '##' + corridoio + '##......##',
    '##' + '=='.repeat(n) + '##=V=A=L##',
    '##'.repeat(n + 6),
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
]

/* ═══════════════════════════════════════════════════════════════════
   I POSTI DEL PORTO — ogni cassa ha il suo posto, e una strada per arrivarci

   Il capitolo dei progetti del cantiere ha insegnato a scrivere un pezzo
   una volta e a chiamarlo tante; qui lo stesso si fa con le **strade**. Il
   porto è grande, i posti sono lontani, e ogni cassa ha il suo — la verde
   al cassone, la rossa sulla nave, la blu in bottega: un lavoro diverso
   per ogni colore, e il programma principale diventa una fila di
   decisioni che chiamano chi sa la strada.

     · le strade del porto: la strada del magazzino la sa già il robot
       (due attrezzi, `esci` e `rientra`), e il bambino scrive le
       decisioni — di che colore è la cassa, e dove va;
     · il porto grande: una mappa più larga dello schermo, quattro colori
       e due posti, e le strade le scrive il bambino. Due colori vanno
       nello stesso posto, quindi la stessa strada serve due volte: lo
       zaino non tiene quattro strade scritte a mano due volte ciascuna.

   Le strade di un porto valgono solo su quella mappa: gli attrezzi del
   primo livello si scrivono qui (`attrezzo` di `dati/attrezzi.js`), non
   nel catalogo. E lungo le strade non ci sono scaffali di casse per
   bellezza: una cassa che non c'entra, dello stesso colore di quelle da
   portare, sembra una cosa da portare.
   ═══════════════════════════════════════════════════════════════════ */
import { fai, guarda, progetto, programma } from '../scrivi.js'
import { attrezzo } from '../attrezzi.js'

const CAPITANA = { emoji: '⚓', nome: 'La capitana del porto' }

/* ── le strade del porto: il magazzino in basso, il piazzale in mezzo ── */
const esci = () => attrezzo(progetto('esci', { nome: 'esci', icona: '🚪' }, [
  fai.vai('destra', 2), fai.vai('su', 2), fai.vai('destra', 3), fai.vai('su', 2),
]), { finisce: 'fuori dalla porta del magazzino, in mezzo al piazzale' })
const rientra = () => attrezzo(progetto('rientra', { nome: 'rientra', icona: '🏠' }, [
  fai.vai('giu', 2), fai.vai('sinistra', 3), fai.vai('giu', 2), fai.vai('sinistra', 2),
]), { finisce: 'accanto al deposito, dove era partito' })

const PIAZZALE = [
  '~~~~~~~~~~~~~~Cn~~~~~~~~~~~~',
  '##############..############',
  'Cv........................Cb',
  '##############..############',
  '########........############',
  '########..##################',
  '##Cs.@....##################',
  '############################',
]
const posti = dentro => ({
  s: { nome: 'il deposito', dentro },
  v: { nome: 'il cassone verde', colore: 'verde', capienza: 20 },
  n: { nome: 'la nave', figura: 'stiva', colore: 'rosso', capienza: 20 },
  b: { nome: 'la bottega', figura: 'magazzino', colore: 'blu', capienza: 20 },
})

/* il lavoro di ogni colore, dal piazzale e ritorno */
const alCassone = [fai.vai('sinistra', 6), fai.posa('sinistra'), fai.vai('destra', 6)]
const allaNave = [fai.vai('su', 1), fai.posa('su'), fai.vai('giu', 1)]
const allaBottega = [fai.vai('destra', 5), fai.posa('destra'), fai.vai('sinistra', 5)]

/* ── il porto grande: il deposito in basso, il molo a sinistra, il
   mercato a destra, e le strade che girano intorno ai magazzini ── */
const GRANDE = [
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~####################################',
  '~~~~Cr~~~~~~##############################Cv####',
  '~~Cb..####################################..Cg##',
  '####..........##################............####',
  '############..##################..##############',
  '############......................##############',
  '######################..########################',
  '######################..########################',
  '####################Cs.@########################',
  '################################################',
]
const grandi = dentro => ({
  s: { nome: 'il deposito', dentro },
  r: { nome: 'la nave rossa', figura: 'stiva', colore: 'rosso', capienza: 20 },
  b: { nome: 'la nave blu', figura: 'stiva', colore: 'blu', capienza: 20 },
  v: { nome: 'la cesta verde', colore: 'verde', capienza: 20 },
  g: { nome: 'la cesta gialla', colore: 'giallo', capienza: 20 },
})
const alMercato = () => progetto('al-mercato', { nome: 'al mercato', icona: '🍎' }, [
  fai.vai('su', 3), fai.vai('destra', 5), fai.vai('su', 2), fai.vai('destra', 5), fai.vai('su', 1)])
const dalMercato = () => progetto('dal-mercato', { nome: 'dal mercato', icona: '↩️' }, [
  fai.vai('giu', 1), fai.vai('sinistra', 5), fai.vai('giu', 2), fai.vai('sinistra', 5), fai.vai('giu', 3)])
const alMolo = () => progetto('al-molo', { nome: 'al molo', icona: '⚓' }, [
  fai.vai('su', 3), fai.vai('sinistra', 5), fai.vai('su', 2), fai.vai('sinistra', 4), fai.vai('su', 1)])
const dalMolo = () => progetto('dal-molo', { nome: 'dal molo', icona: '↩️' }, [
  fai.vai('giu', 1), fai.vai('destra', 4), fai.vai('giu', 2), fai.vai('destra', 5), fai.vai('giu', 3)])

export const LIVELLI_POSTI = [
  {
    chiave: 'strade', nome: 'Le strade del porto', icona: '🛣️', capitolo: 'posti',
    impara: 'un lavoro per ogni colore', portata: 84, premio: 20,
    mondo: 'porto', tema: 'molo', prova: 'giornata', durata: 600,
    chi: CAPITANA,
    racconto: 'Nel deposito arrivano casse di tre colori, e ognuna ha il suo posto: le verdi sul cassone, le rosse sulla nave, le blu in bottega. La strada per uscire dal magazzino e quella per rientrare le sa già il robot: sono due attrezzi. Tu decidi chi va dove.',
    ordini: [
      { nome: 'lunedì', mappa: PIAZZALE, cassoni: posti('VRBBRV'), obiettivo: { cassoni: { s: { vuoto: true } } } },
      { nome: 'martedì', mappa: PIAZZALE, cassoni: posti('BVRRBVBR'), obiettivo: { cassoni: { s: { vuoto: true } } } },
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'finche', 'se'], colori: ['verde', 'rosso', 'blu'],
    cose: ['cassa', 'niente'],
    attrezzi: [esci(), rientra()],
    ragiona: [
      'Tre colori, tre posti, e il deposito si svuota in un ordine che cambia ogni giorno. Uscire e rientrare è sempre la stessa strada, e la sa già il robot: cambia solo quello che succede in mezzo.',
      'Fai finta di avere in mano una cassa verde: cosa fa il robot dal piazzale? E con una rossa, e con una blu? Da cosa capisce quale dei tre lavori gli tocca?',
    ],
    indizi: [
      'Un giro per ogni cassa: prendila ← dal deposito, esci, fai il lavoro del suo colore, rientra. Finché nel deposito c\'è qualcosa.',
      'Dal piazzale: il cassone verde è 6 passi a sinistra, la nave 1 passo su, la bottega 5 passi a destra. Si posa di fianco, e si torna al piazzale.',
      '«se ✋ c\'è una cassa verde» fa il lavoro del cassone; altrimenti, dentro, «se ✋ c\'è una cassa rossa» quello della nave; altrimenti la bottega.',
    ],
    soluzione: programma({ principale: [fai.finche(guarda('sinistra', 'niente'), [
      fai.prendi('sinistra'), fai.chiama('esci'),
      fai.se(guarda('mano', 'cassa', true, 'verde'), alCassone, [
        fai.se(guarda('mano', 'cassa', true, 'rosso'), allaNave, allaBottega)]),
      fai.chiama('rientra'),
    ])] }),
    fragili: [
      { nome: 'tutte sulla nave', programma: programma({ principale: [fai.finche(guarda('sinistra', 'niente'), [
        fai.prendi('sinistra'), fai.chiama('esci'), ...allaNave, fai.chiama('rientra')])] }) },
      /* la falsa pista: il primo giro va bene, poi il robot resta nel
         piazzale e il deposito gli sembra vuoto */
      { nome: 'senza rientrare', programma: programma({ principale: [fai.finche(guarda('sinistra', 'niente'), [
        fai.prendi('sinistra'), fai.chiama('esci'),
        fai.se(guarda('mano', 'cassa', true, 'verde'), alCassone, [
          fai.se(guarda('mano', 'cassa', true, 'rosso'), allaNave, allaBottega)])])] }) },
      { nome: 'le verdi in bottega e le blu sul cassone', programma: programma({ principale: [fai.finche(guarda('sinistra', 'niente'), [
        fai.prendi('sinistra'), fai.chiama('esci'),
        fai.se(guarda('mano', 'cassa', true, 'verde'), allaBottega, [
          fai.se(guarda('mano', 'cassa', true, 'rosso'), allaNave, alCassone)]),
        fai.chiama('rientra')])] }) },
    ],
  },
  {
    chiave: 'porto-grande', nome: 'Il porto grande', icona: '🗺️', capitolo: 'posti',
    impara: 'una strada, scritta una volta', portata: 84, premio: 25,
    mondo: 'porto', tema: 'molo', prova: 'giornata', durata: 600,
    chi: CAPITANA,
    racconto: 'Il porto grande non sta tutto nello schermo. Le casse rosse e blu vanno alle navi, giù al molo; le verdi e le gialle nelle ceste del mercato, dall\'altra parte. Le strade sono lunghe e girano intorno ai magazzini: stavolta le scrivi tu.',
    ordini: [
      { nome: 'lunedì', mappa: GRANDE, cassoni: grandi('GVBRVG'), obiettivo: { cassoni: { s: { vuoto: true } } } },
      { nome: 'martedì', mappa: GRANDE, cassoni: grandi('BRGVVBRG'), obiettivo: { cassoni: { s: { vuoto: true } } } },
    ],
    cassetta: ['vai', 'prendi', 'posa', 'ripeti', 'finche', 'se', 'progetti'], colori: ['verde', 'giallo', 'rosso', 'blu'],
    cose: ['cassa', 'niente'],
    zaino: 38,
    ragiona: [
      'Quattro colori e due posti lontani: le verdi e le gialle vanno al mercato, le rosse e le blu al molo. La strada per il mercato serve a due colori, e così quella per il molo — e qui il programma sta in 38 righe.',
      'Una strada lunga, scritta a mano per ogni colore, quante righe prende? E se la strada la sapesse fare un progetto, con un nome, come facevano «esci» e «rientra»?',
    ],
    indizi: [
      'Quattro progetti: «al mercato» e «dal mercato», «al molo» e «dal molo». Ognuno è una strada sola, scritta una volta.',
      'Al mercato: 3 su, 5 a destra, 2 su, 5 a destra, 1 su. Al molo: 3 su, 5 a sinistra, 2 su, 4 a sinistra, 1 su. Per tornare, le stesse al contrario.',
      'Al mercato la verde si posa ↑ e la gialla →; al molo la rossa ↑ e la blu ←. Nel principale: prendi, e per ogni colore «al…», posa, «dal…».',
    ],
    soluzione: programma({
      progetti: [alMercato(), dalMercato(), alMolo(), dalMolo()],
      principale: [fai.finche(guarda('sinistra', 'niente'), [
        fai.prendi('sinistra'),
        fai.se(guarda('mano', 'cassa', true, 'verde'), [fai.chiama('al-mercato'), fai.posa('su'), fai.chiama('dal-mercato')], [
          fai.se(guarda('mano', 'cassa', true, 'giallo'), [fai.chiama('al-mercato'), fai.posa('destra'), fai.chiama('dal-mercato')], [
            fai.se(guarda('mano', 'cassa', true, 'rosso'), [fai.chiama('al-molo'), fai.posa('su'), fai.chiama('dal-molo')],
              [fai.chiama('al-molo'), fai.posa('sinistra'), fai.chiama('dal-molo')])])]),
      ])],
    }),
    fragili: [
      { nome: 'il mercato e il molo scambiati', programma: programma({
        progetti: [alMercato(), dalMercato(), alMolo(), dalMolo()],
        principale: [fai.finche(guarda('sinistra', 'niente'), [
          fai.prendi('sinistra'),
          fai.se(guarda('mano', 'cassa', true, 'rosso'), [fai.chiama('al-mercato'), fai.posa('su'), fai.chiama('dal-mercato')], [
            fai.se(guarda('mano', 'cassa', true, 'blu'), [fai.chiama('al-mercato'), fai.posa('destra'), fai.chiama('dal-mercato')], [
              fai.se(guarda('mano', 'cassa', true, 'verde'), [fai.chiama('al-molo'), fai.posa('su'), fai.chiama('dal-molo')],
                [fai.chiama('al-molo'), fai.posa('sinistra'), fai.chiama('dal-molo')])])]),
        ])] }) },
      /* la strada del mercato con un passo in meno: all'ultima svolta il
         robot ha il muro davanti, e lo dice — le strade si contano */
      { nome: 'una strada col passo in meno', programma: programma({
        progetti: [
          progetto('al-mercato', { nome: 'al mercato', icona: '🍎' }, [
            fai.vai('su', 3), fai.vai('destra', 5), fai.vai('su', 2), fai.vai('destra', 4), fai.vai('su', 1)]),
          progetto('dal-mercato', { nome: 'dal mercato', icona: '↩️' }, [
            fai.vai('giu', 1), fai.vai('sinistra', 4), fai.vai('giu', 2), fai.vai('sinistra', 5), fai.vai('giu', 3)]),
          alMolo(), dalMolo()],
        principale: [fai.finche(guarda('sinistra', 'niente'), [
          fai.prendi('sinistra'),
          fai.se(guarda('mano', 'cassa', true, 'verde'), [fai.chiama('al-mercato'), fai.posa('su'), fai.chiama('dal-mercato')], [
            fai.se(guarda('mano', 'cassa', true, 'giallo'), [fai.chiama('al-mercato'), fai.posa('destra'), fai.chiama('dal-mercato')], [
              fai.se(guarda('mano', 'cassa', true, 'rosso'), [fai.chiama('al-molo'), fai.posa('su'), fai.chiama('dal-molo')],
                [fai.chiama('al-molo'), fai.posa('sinistra'), fai.chiama('dal-molo')])])]),
        ])] }) },
    ],
  },
]

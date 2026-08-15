/* 1 ─ LA PIENA. Il vocabolario è quello del primo tutorial più `posa`
      — vai, prendi, posa, apri — e non c'è nessun blocco. Quello che
      entra è **una casa grande e poco tempo**, e la regola che morde è
      una sola, già incontrata: **le mani sono due**.

      ── PERCHÉ QUESTA STORIA, DOPO TRE CHE NON REGGEVANO ──
      Qui c'era un livello con un guardiano che «non badava a te»: prima
      un orco distratto, poi un bracconiere di mestiere. Erano due
      vestiti sullo stesso trucco — un pericolo che sceglie le bestie e
      lascia stare il bambino — e quel trucco serviva solo a tenere in
      piedi una decisione. Un pericolo che va spiegato con un carattere
      strano è un pericolo che andava messo nel mondo, non in una
      persona.
      Nel mondo, qui, c'è **il fiume che sale**. Non insegue nessuno,
      non sceglie, non ha bisogno di spiegazioni: bisogna svuotare il
      mulino prima che arrivi l'acqua, e le cose da portare via sono
      tre. Le mani sono due, e da lì viene tutto il piano.

      ── COSA C'È DA FARE ──
      Il mulino è grande e le cose stanno lontane l'una dall'altra: la
      chiave in cucina, il libro del nonno nella camera chiusa, il sacco
      di farina nella dispensa in fondo, il gatto nel suo cesto. Il
      carro sta fuori, nel cortile, ed è lì che va posato tutto.
      Nessuna di queste cose è un indovinello: sono un lavoro. Il
      livello è il lavoro fatto **nell'ordine giusto**, che è quello che
      un piano è — e la mappa è grande perché un lavoro con tre stanze
      di distanza fra una cosa e l'altra è un lavoro, mentre in una
      stanza sola è un gesto.

      ── LE MANI SONO DUE, E LE COSE TRE: SI TORNA INDIETRO ──
      Il libro, la farina e il secchio non ci stanno insieme, quindi il
      carro si raggiunge **due volte**. Non è una punizione: è la prima
      volta che il piano ha una forma — vai, torna, rivai — invece di
      essere una fila di gesti tutti diversi.
      Le chiavi invece **stanno in tasca**: sono piccole, non occupano
      una mano, e se ne portano tre. Per un giro le mani le contavano
      anche loro, e ogni livello con due porte diventava un balletto di
      «posa la chiave» — una riga che non insegna niente e si ripete
      uguale. Le mani si contano per la roba vera; il minuto sta in
      tasca e non pesa.
      Tredici ordini è più del solito, ed è voluto: è un lavoro, e un
      lavoro si vede che è lungo. */

import { livello, campo, cose, chi, fai, se, suoli, arredo } from '../scrivi.js'

/* due mani, come tutti: quello che cambia è che qui le cose da portare
   sono tre */
const bimba = chi.nostro('bimba', 'la bimba', { corpo: 'principessa', emoji: '👧', vista: 8 })

/* il carro è la meta di tutto, e si vede: è l'unico posto che sta in
   `vince`, quindi l'unico che il campo disegna */
const carro = cose.posto('carro', 'il carro', { pittore: 'carrello' })

/* il gatto non si comanda: ti viene dietro appena aperto il cesto, e
   quando sei al carro ci salta sopra. Il suo piano è due righe e si
   legge toccandolo. */
const gatto = chi.terzo('gatto', 'il gatto', { corpo: 'gatto', emoji: '🐈', vista: 8, vita: 6,
  schiera: 'mulino', schieraNome: 'quelli del mulino',
  fa: [fai.ripeti([fai.vai(bimba)], se.qui(bimba, carro)), fai.vai(carro)] })

const chiave = cose.chiave('chiave', 'la chiave della camera', { em: '🔴' })
const chiavetta = cose.chiave('chiavetta', 'la chiave della dispensa', { em: '🔵' })
const libro = cose.oggetto('libro', 'il libro del nonno', { pittore: 'libro', em: '📕' })
const farina = cose.oggetto('farina', 'il sacco di farina', { pittore: 'sacco', em: '🌾' })
const secchio = cose.oggetto('secchio', 'il secchio del pozzo', { pittore: 'secchio', em: '🪣' })
const camera = cose.porta('camera', 'la porta della stanzetta', { chiave: 'chiave' })
const dispensa = cose.porta('dispensa', 'la porta della dispensa', { chiave: 'chiavetta' })
const cesto = cose.grata('cesto', 'il cesto del gatto')

/* IL MULINO — un corridoio lungo che lo taglia in due, tre stanze
   sopra e tre sotto, e il cortile col carro all'altro capo. Non ci sta
   in uno schermo: si trascina, ed è il primo livello in cui la
   distanza fra due cose è essa stessa parte del lavoro. */
const CASTELLO = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|..|..|CA|..|##|==|==|==|==|==|##|==|==|==|==|==|==|==|==|##',
  '##|..|CR|..|..|##|==|K1|==|==|==|##|==|==|FA|==|==|SC|==|==|##',
  '##|..|@@|..|..|##|==|==|TV|==|==|##|==|BT|==|==|==|==|==|==|##',
  '##|..|..|..|..|##|==|==|==|==|==|##|==|==|==|==|==|BR|==|==|##',
  '##|##|##|..|##|##|##|##|==|##|##|##|##|##|##|P2|##|##|##|##|##',
  '##|..|..|..|..|==|==|==|==|==|==|==|==|==|==|==|==|==|==|==|##',
  '##|##|##|..|##|##|##|##|P1|##|##|##|##|##|##|==|##|##|##|##|##',
  '##|..|..|..|..|##|==|==|==|==|==|##|==|==|==|==|==|==|==|==|##',
  '##|..|SE|..|..|##|==|CS|==|CC|==|##|==|==|K2|==|LB|==|==|SA|##',
  '##|..|..|..|..|##|##|GT|##|==|==|##|==|==|BO|==|==|==|==|==|##',
  '##|..|..|..|..|##|==|##|==|==|==|##|==|==|==|==|==|==|==|==|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
], { '@@': bimba, CR: carro, K1: chiave, FA: farina, LB: libro,
     '==': suoli.lastre(),
     /* l'arredo sta in legenda perché **occupa la cella**: ci si sbatte
        contro, e il disegno dice la verità */
     CA: arredo.cassa(), TV: arredo.tavolo(), BT: arredo.botte(),
     SC: arredo.sacco(), BR: arredo.barile(), CC: arredo.cassa(),
     BO: arredo.botte(), SA: arredo.sacco(),
     CS: cesto, GT: gatto, P1: camera, P2: dispensa, K2: chiavetta, SE: secchio })

export const DUE_CHIAVI = livello({
  /* il posto è un MULINO — lo dicono il commento in testa, il racconto e
     la mappa — e si chiamava «lo sgombero del castello»: due nomi per lo
     stesso posto, e quello sbagliato era il titolo, cioè la prima cosa
     che si legge. L'`id` resta `parole-due-chiavi`: è una chiave. */
  id: 'parole-due-chiavi', nome: 'Lo sgombero del mulino',
  idea: 'Tre cose da portare via, e due mani',
  /* ── E IL GIOCO NON PROMETTE QUELLO CHE NON FA ──
     Qui c'era scritto «prima che arrivi l'acqua», e l'acqua non arriva
     mai: non c'è nessun limite, nessuna sconfitta, e un piano di
     quaranta ordini vince come uno di tredici. Una fretta annunciata e
     non mantenuta è peggio di nessuna fretta — chi ci crede gioca
     stretto per niente, chi se ne accorge impara che le dritte si
     possono ignorare. Il fiume resta nel racconto come il MOTIVO per
     cui si sgombera (e lo è: un mulino non si svuota per capriccio),
     ma la promessa è quella che il livello mantiene davvero — portare
     via tutto con due mani sole. Il giorno che l'acqua salirà per
     davvero, sarà una regola del mondo e non una riga di testo. */
  dritta: 'Obiettivo: <b>il libro, la farina, il secchio e il gatto sul carro</b>.',
  racconto: "Il fiume è in piena e il mulino va sgomberato. Da portare via ci sono il libro del nonno, chiuso in camera, il sacco di farina, chiuso in dispensa, il secchio del pozzo e il gatto. Le due chiavi stanno in due stanze diverse — ma quelle vanno in tasca. <b>Le mani sono due, e le cose tre</b>: al carro ci si torna.",
  aiuti: ['Guarda la tua scheda: ✋ due mani. Le cose da portare sono tre.',
          'Le chiavi stanno in tasca e non pesano: quelle non ti fermano mai.',
          'Il gatto non pesa: cammina da sé, e ti viene dietro appena aperto il cesto.'],
  ambiente: 'cortile', prove: 1,

  /* ── L'ARREDO STA SU CASELLE DI MURO DENTRO LE STANZE ──
     Un tavolo in mezzo alla cucina è **una casella di muro dipinta come
     un tavolo**: non ci si passa sopra, ed è vero — un mobile ingombra.
     È il modo in cui una stanza smette di essere un rettangolo di
     pavimento senza mentire sulla geometria, e le sei stanze del mulino
     diventano sei posti diversi invece dello stesso posto sei volte. */
  /* qui resta solo quello che **non** ingombra: le torce appese alla
     faccia del muro e le pozzanghere per terra. Tutto il resto è
     arredo, e sta in legenda */
  scenografia: [
    { che: 'torcia', x: 11, y: 3 }, { che: 'torcia', x: 11, y: 9 },
    { che: 'pozzanghera', x: 6, y: 6, strato: -1 },
    { che: 'pozzanghera', x: 16, y: 6, strato: -1 },
  ],

  scena: CASTELLO,
  complementi: ['chiave', 'chiavetta', 'libro', 'farina', 'secchio', 'camera',
                'dispensa', 'cesto', 'carro', 'gatto'],
  verbi: ['vai', 'prendi', 'posa', 'apri'],
  /* ── E NIENTE DOMANDE, COME NEI DUE PRIMA ──
     Qui gli oggetti sono cinque, quindi il foglio offrirebbe «hai il
     libro», «hai la farina», «hai il secchio»… e con loro il bivio, il
     ciclo e l'azione. Ma la lezione è il lavoro fatto nell'ordine
     giusto con due mani: una domanda non serve a niente e il foglio
     delle scelte diventerebbe un elenco lungo il doppio proprio nel
     livello che ha già più cose di tutti. La domanda arriva dopo, dove
     è la lezione. */
  condizioni: [],
  vince: [se.qui(libro, carro), se.qui(farina, carro), se.qui(secchio, carro),
          se.qui(gatto, carro)],
  /* ── E IL PIANO DEL GATTO SI LEGGE ──
     Il secondo aiuto dice «cammina da sé, e ti viene dietro appena
     aperto il cesto»: una promessa che si verifica toccandolo, e senza
     questa riga toccarlo dava un lucchetto. Qui non c'è niente da
     spiare — non è un nemico, è il gatto da portare in salvo — quindi
     quello che fa sta scritto e si legge. */
  mostraNemici: true,

  soluzioni: [
    { nome: 'due mani, due viaggi', piano: { bimba: [
      fai.prendi(chiave), fai.apri(camera), fai.apri(cesto),
      fai.prendi(chiavetta), fai.apri(dispensa),
      fai.prendi(farina), fai.prendi(libro),
      fai.vai(carro), fai.posa(farina), fai.posa(libro),
      fai.prendi(secchio), fai.vai(carro), fai.posa(secchio),
    ] } },
  ],

  verifiche: {
    /* la chiave prima della porta, come nel secondo livello — qui
       dentro un lavoro con tre cose e due mani */
    ordineConta: [['prendi chiave', 'apri camera'],
                  ['prendi chiavetta', 'apri dispensa'],
                  ['apri camera', 'apri cesto']],
  },
})

export default DUE_CHIAVI

/* 7 ─ DUE STRADE E UNA PORTA CHE SI CHIUDE. L'ULTIMA PROVA, e mette
      insieme tutto quello di prima con due cose nuove: una porta che si
      chiude alle spalle, e un segnale che dice DA CHE PARTE è libero.

      Dopo di questa ce n'era una nona, «La fortezza» — 34×22, quattro
      schermate — ed è stata tolta il giorno che le si è chiesto cosa
      insegnasse. Prometteva l'astrazione («qui le mete una per una non
      bastano più»), ma quella tesi non si può più dimostrare da quando
      `prendi` e `apri` CAMMINANO DA SOLI: una fila di mete esplicite non
      è più una tentazione in nessun livello, e infatti la fortezza non
      aveva nemmeno una soluzione `fragile` da far cadere. Quello che
      chiedeva davvero — coordinarsi con un segnale mentre l'altro tiene
      occupato il nemico — è la quarta prova, su una mappa dieci volte
      più grande che per giunta non ci sta nello schermo. Le sue tre
      scene spostavano solo la chiave, dentro la stessa stanza, e
      `prendi [la chiave]` la segue: erano la stessa scena tre volte.
      Una mappa così è roba da CAMPAGNA, dove le quattro schermate le
      attraversa una storia in più capitoli.

      ── LA RONDA È UNA SOLA, ED È UNA SCELTA ──
      Con due sentinelle bisogna sincronizzarle, e lo scarto fra le due
      diventa la vera difficoltà del livello — una cosa che il bambino
      non può né vedere né dedurre. Con una sola, il segnale è sempre
      vero e sempre completo: lei dice DOVE NON È. Passando dalla
      strada di mezzogiorno grida «libero a tramontana», e passando da
      quella di tramontana grida «libero a mezzogiorno».

      ── LA PORTA È IL TEMPO ──
      Dentro il deposito, con la porta chiusa, non ti vede nessuno e tu
      non vedi niente — ma SENTI. È la regola del gioco resa letterale:
      quello che non vedi te lo deve dire qualcuno. Da qui viene che
      aspettare non costa più niente, e che tutto il rischio si
      concentra nell'istante in cui riapri.

      ⚠️ TARATURA DA FINIRE. La soluzione dichiarata vince su tutte e
      tre le scene, ma le scorciatoie non cadono ancora tutte: uscire
      subito senza aspettare il secondo segnale, o riuscire dalla porta
      da cui si è entrati, oggi funzionano. La causa è misurata — il
      viaggio dura quasi mezzo giro, quindi quando sei dentro la ronda
      si è già spostata da sé — e la cura è accorciare il tragitto e
      far sì che al ritorno la ronda venga incontro invece di seguire. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const eroe = chi.nostro('eroe', "l'eroe", { corpo: 'ladra', emoji: '🦸', vista: 6, vita: 1 })

/* ── I DUE GRIDI STANNO AI LATI, NON SOPRA E SOTTO ──
   La ronda annuncia da che parte NON è, e quel «da che parte» si legge
   meglio se è **ponente o levante**: sono i due capi corti dell'anello,
   quelli che a colpo d'occhio si distinguono. Sopra e sotto sono i due
   tratti lunghi, e da fermo dentro il rifugio uno vale l'altro. */
const ponente = cose.segnale('ponente', 'libero a ponente', { em: '⬅️', col: '#4a86e8' })
const levante = cose.segnale('levante', 'libero a levante', { em: '➡️', col: '#e8a33f' })

/* il giro, e i due annunci in mezzo. Il verso conta: va a levante lungo
   il sud, sale, torna a ponente lungo il nord. Chi esce dal deposito e
   torna al rifugio passando da levante se la trova incontro; chi
   aspetta il secondo segnale no. */
const ronda = chi.nemico('ronda', 'la ronda', { corpo: 'orco', emoji: '👹', vista: 2, vita: 6,
  schiera: 'orchi', schieraNome: 'gli orchi',
  fa: [fai.ripeti([fai.vai('6,9'), fai.vai('11,9'),
                   fai.vai('11,5'), fai.suona(ponente),
                   fai.vai('11,1'), fai.vai('6,1'), fai.vai('1,1'),
                   fai.vai('1,5'), fai.suona(levante),
                   fai.vai('1,9')],
                  se.vedi('nostri')),
       fai.attacca('nostri')] })

const rifugio = cose.posto('rifugio', 'il rifugio')
const uscio = cose.porta('uscio', "l'uscio")
const portaN = cose.porta('portaN', 'la porta di tramontana')
const portaS = cose.porta('portaS', 'la porta di mezzogiorno')
const tesoro = cose.tesoro()
const dove = cose.segnaposto()

/* L'ANELLO A DUE STRADE — un giro solo, e due modi di attraversarlo.
   Il deposito sta in mezzo con due porte, una per lato; il rifugio è
   una cella con l'uscio, appoggiata alla strada di tramontana. Fra il
   rifugio e il deposito ci sono due strade: quella di sopra e quella di
   sotto, e sono la stessa distanza.

   `r1`…`r3` sono i punti da cui la ronda può partire: la scena ne
   riempie uno, e da lì lei ingrana il suo giro. */
const ANELLO = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|..|..|..|r1|..|..|..|..|..|..|..|##',
  '##|..|##|##|##|##|..|##|##|u1|##|..|##',
  '##|..|##|##|##|##|pN|##|##|RF|##|..|##',
  '##|r2|##|##|T$|..|..|..|##|##|##|..|##',
  '##|..|##|##|..|..|..|..|##|##|##|..|##',
  '##|..|##|##|..|..|..|..|##|##|##|..|##',
  '##|..|##|##|##|##|pS|##|##|##|##|..|##',
  '##|..|##|##|##|##|..|##|##|##|##|..|##',
  '##|..|r3|..|..|..|..|..|..|..|..|..|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
], { RF: [rifugio, eroe], u1: uscio, pN: portaN, pS: portaS,
     'T$': tesoro, r1: dove, r2: dove, r3: dove })

export const DUE_VIE = livello({
  id: 'due-vie', nome: 'Da una parte e dall\'altra',
  idea: 'Entra da sopra, esci da sotto',
  dritta: "Obiettivo: <b>il tesoro deve tornare nel rifugio</b>. E l'eroe cade al primo colpo.",
  racconto: "Il deposito ha due porte, una per lato, e attorno gira un anello con due strade: quella di tramontana e quella di mezzogiorno. La ronda è <b>una sola</b>, e dice dove non è: quando è al capo di levante grida «libero a ponente», quando è a ponente «libero a levante». Dentro il deposito, con la porta chiusa, nessuno ti vede e tu non vedi niente — ma senti.",
  aiuti: ['Il suo piano si legge: tocca la ronda e guarda cosa grida, e da dove.',
          'Una porta chiusa toglie la vista a tutti e due, e non toglie l\'udito a nessuno: chiuso là dentro puoi aspettare quanto vuoi.',
          'Il segnale che ti fa entrare non è quello che ti fa uscire. E un ascolto scritto <b>dentro un\'azione</b> comincia solo quando quell\'azione parte.'],
  ambiente: 'camminamento', intera: true,

  scena: ANELLO,
  segnali: [ponente, levante],
  complementi: ['tesoro', 'rifugio', 'uscio', 'portaN', 'portaS',
                'ponente', 'levante'],
  verbi: ['vai', 'prendi', 'apri', 'chiudi', 'quando', 'esegui'],
  vince: [se.ha(eroe, tesoro), se.qui(eroe, rifugio)],
  perde: [se.caduto(eroe)],
  motivoSconfitta: "L'eroe è finito sotto gli occhi della ronda.",
  mostraNemici: true,

  /* LA RONDA PARTE DI SOPRA, e non è un dettaglio di scena: la strada
     che ti serve per entrare è proprio quella occupata, quindi la prima
     cosa che si impara è che bisogna lasciarla passare. */
  varianti: [
    { nome: 'la ronda è di sopra', metti: { r1: ronda } },
    { nome: 'la ronda scende a ponente', metti: { r2: ronda } },
    { nome: 'la ronda è appena passata', metti: { r3: ronda } },
  ],

  par: 12,
  soluzioni: [
    /* DUE ASCOLTI, MA NON INSIEME: il secondo è scritto DENTRO l'azione
       che entra, quindi comincia a valere solo quando sei dentro col
       tesoro in mano. Prima di allora «libero a mezzogiorno» non vuol
       dire niente per te, e infatti non lo senti. */
    { nome: 'entra da sopra, esci da sotto', piano: { eroe: [
      fai.quando(levante, fai.esegui('entra')),
      fai.azione('entra', [
        fai.apri(uscio), fai.apri(portaN), fai.prendi(tesoro),
        fai.chiudi(portaN),
        fai.quando(ponente, fai.esegui('esci')),
      ]),
      fai.azione('esci', [fai.apri(portaS), fai.vai(rifugio)]),
    ] } },
  ],
})

export default DUE_VIE

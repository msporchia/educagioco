/* 2 ─ IL SEGNALE DENTRO UN CICLO. La cercatrice non sa in anticipo in
      quale dei tre nascondigli sia l'orco — <b>cambia a ogni
      battaglia</b> — e allora gira: va a un posto, e se non trova
      niente passa al prossimo. Il giro si ferma da sé quando trova
      qualcosa da fare, non dopo un numero di passaggi contato a mano —
      la stessa lezione del totem («Il totem», tutorial 8), spostata dal
      contare tacche al cercare un nemico. E come lì, chi ascolta non
      deve sapere QUANTO ci mette la cercatrice: deve solo sapere COME va
      a finire, e aspettare quel grido.

      DENTRO UN CICLO NON CI VA UN ALTRO BLOCCO (il motore lo rifiuta):
      niente bivio annidato per decidere se attaccare. Non serve:
      «attacca gli orchi» quando non c'è nessun orco a portata non fa
      niente e passa oltre da solo — è la stessa cosa di un bivio, senza
      scriverlo.

      LA CERCATRICE PARTE VICINA AL PRIMO NASCONDIGLIO, l'eroe parte
      vicina al TERZO — dai lati opposti dello stesso corridoio. Non è
      un dettaglio: se l'orco è nel primo o nel secondo, la cercatrice
      ci arriva molto prima di quanto l'eroe possa avvicinarsi, e lo
      trova lei. Ma se è nel terzo — quello vicino a dove l'eroe
      aspetta — la cercatrice deve attraversare tutto il corridoio per
      arrivarci, e chi parte senza aspettare ci arriva prima lei.

      LA FRAGILE è chi non aspetta il grido: parte subito verso il
      tesoro. Quando l'orco è nei primi due nascondigli non lo incontra
      nemmeno, perché la cercatrice l'ha già trovato lei; quando è nel
      terzo gli arriva addosso prima che chiunque se ne sia accorto. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const cercatrice = chi.nostro('cercatrice', 'la cercatrice', { corpo: 'guardia', emoji: '🗡️', vita: 6 })
const eroe = chi.nostro('eroe', "l'eroe", { corpo: 'ladra', emoji: '🦸', vita: 1 })

const tesoro = cose.tesoro()
const libero = cose.segnale('libero', 'via libera', { em: '📣', col: '#3fb872' })
const dove = cose.segnaposto()
/* i tre posti dove si controlla, e sono sempre lì: quello che cambia
   scena per scena è se l'orco sta appostato accanto a uno di loro. La
   cercatrice li controlla in quest'ordine — dal più vicino a lei al più
   vicino all'eroe. */
const p1 = cose.posto('p1', 'il primo nascondiglio')
const p2 = cose.posto('p2', 'il secondo nascondiglio')
const p3 = cose.posto('p3', 'il terzo nascondiglio')

/* IL CORRIDOIO DEI TRE NASCONDIGLI — un unico passaggio, con l'eroe e
   la cercatrice ai due lati opposti. */
const CORRIDOIO = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|EE|..|p3|o3|..|..|..|..|..|..|p2|o2|p1|o1|CC|..|..|..|T$|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
], { EE: eroe, CC: cercatrice, p1, p2, p3, o1: dove, o2: dove, o3: dove, 'T$': tesoro })

/* il giro: si ferma appena vede l'orco, non dopo tre passaggi contati
   — è per questo che l'uscita è «lo vedo», e non un numero. Dal
   nascondiglio più vicino a sé al più lontano. */
const cerca = fai.giro([p1, p2, p3], se.vedi('orchi'))

export const GIRO_CHE_AVVISA = livello({
  id: 'accordo-giro', nome: 'Il giro che avvisa',
  idea: "Il giro si ferma quando trova, non dopo un numero di passaggi contato a mano.",
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>. E l'eroe cade al primo colpo.",
  racconto: "La cercatrice controlla i tre nascondigli uno alla volta, dal più vicino a sé al più lontano, e mena finché l'orco non cade — <b>quale nascondiglio cambia a ogni battaglia</b>. Solo quando grida che è fatta l'eroe si muove.",
  aiuti: ["La cercatrice non sa dove sia l'orco: deve andarci a vedere, uno per uno.",
          "Non conta i passaggi: si ferma quando trova qualcosa da guardare.",
          "L'eroe non deve sapere quanto ci mette: deve solo aspettare che sia finita."],
  ambiente: 'camminamento',

  scena: CORRIDOIO,
  segnali: [libero],
  condizioni: [se.vedi('orchi')],
  complementi: ['tesoro', 'orchi', 'libero', 'p1', 'p2', 'p3'],
  verbi: ['vai', 'attacca', 'prendi', 'suona', 'quando'],
  vince: [se.ha(eroe, tesoro)],
  perde: [se.caduto(eroe)],
  motivoSconfitta: "L'orco ha preso l'eroe.",
  mostraNemici: true,

  varianti: [
    { nome: "l'orco è nel primo nascondiglio",
      metti: { o1: chi.orco({ vista: 2, vita: 1, fa: [fai.aspettaDiVedere('nostri'), fai.attacca('nostri')] }) } },
    { nome: "l'orco è nel secondo nascondiglio",
      metti: { o2: chi.orco({ vista: 2, vita: 2, fa: [fai.aspettaDiVedere('nostri'), fai.attacca('nostri')] }) } },
    { nome: "l'orco è nel terzo nascondiglio, dalla parte dell'eroe",
      metti: { o3: chi.orco({ vista: 2, vita: 1, fa: [fai.aspettaDiVedere('nostri'), fai.attacca('nostri')] }) } },
  ],

  soluzioni: [
    { nome: 'cerca, e chiama solo quando è finita', piano: {
      cercatrice: [cerca, fai.attacca('orchi'), fai.suona(libero)],
      eroe: [fai.quando(libero, fai.prendi(tesoro))],
    } },
    /* FRAGILE: non aspetta il grido, parte subito. Nei primi due
       nascondigli la cercatrice trova l'orco molto prima che l'eroe si
       avvicini; nel terzo — quello dalla sua parte — ci arriva lei
       prima, viva, e lo scopre addosso. */
    { nome: 'parte senza aspettare', fragile: true, piano: {
      cercatrice: [cerca, fai.attacca('orchi'), fai.suona(libero)],
      eroe: [fai.prendi(tesoro)],
    } },
  ],

  verifiche: {
    nonInFila: true,
    serveOgnuno: true,
  },
})

export default GIRO_CHE_AVVISA

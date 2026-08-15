/* 1 ─ IL SEGNALE CHE PORTA UN'INFORMAZIONE, NON SOLO UN VIA. In
      «Mettetevi d'accordo» un segnale voleva dire una cosa sola: parti.
      Qui ne bastano due, e dicono cose DIVERSE — «libero a nord» non è
      «libero a sud» — e chi ascolta sceglie l'azione in base a QUALE dei
      due ha sentito. La scelta però non la fa chi ascolta: la fa chi
      guarda, con lo stesso bivio di «Due strade» (tutorial 5), e la
      manda per posta invece di prenderla lei stessa. Segnale + bivio,
      mescolati apposta: il costrutto è vecchio, la situazione no.

      LA VEDETTA VEDE UNA SOLA DELLE DUE STRADE (esattamente come l'eroe
      di «Due strade»): da dov'è, il ramo di settentrione le sta davanti
      e uno sguardo le basta; quello di mezzogiorno è dall'altra parte
      del cortile, fuori portata. Sapere che l'orco non è qui dice dov'è
      — e quella deduzione, stavolta, va spedita a chi non la può fare da
      sé: l'eroe è altrove, e da dove aspetta non vede NIENTE.

      LA FRAGILE è chi non aspetta affatto: prende sempre la strada di
      settentrione, quella che si prende senza dover scegliere niente.
      Funziona quando l'orco è davvero a mezzogiorno — e la manda dritta
      contro di lui quando non lo è. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const vedetta = chi.nostro('vedetta', 'la vedetta', { corpo: 'elfo', emoji: '🧝', vista: 6 })
const eroe = chi.nostro('eroe', "l'eroe", { corpo: 'ladra', emoji: '🦸', vita: 1 })
/* L'ORCO STA NEL CAMMINAMENTO, non appoggiato alla porta: un passo più
   in là, come in «Due strade» — se no beccherebbe chiunque passasse dal
   cortile, e la scelta della vedetta non servirebbe a niente. */
const orco = chi.orco({ vista: 2, vita: 6, fa: [fai.aspettaDiVedere('nostri'), fai.attacca('nostri')] })

const tesoro = cose.tesoro()
const sopra = cose.posto('portaSopra', 'la porta di settentrione')
const sotto = cose.posto('portaSotto', 'la porta di mezzogiorno')
/* i due gridi: dicono da che parte è SGOMBRO, non dove sta l'orco —
   la stessa convenzione di «Da una parte e dall'altra» (tutorial 7). */
const liberoSopra = cose.segnale('liberoSopra', 'sgombro a settentrione', { em: '⬆️', col: '#3fb872' })
const liberoSotto = cose.segnale('liberoSotto', 'sgombro a mezzogiorno', { em: '⬇️', col: '#4a86e8' })
const dove = cose.segnaposto()

/* LA STESSA CORTE DI «DUE STRADE», CON UNA STANZA IN PIÙ: la vedetta
   sta dove stava l'eroe di quel livello — vede solo il ramo di
   settentrione — e l'EROE stavolta parte più indietro, fuori da
   qualunque linea di vista: da lì non vede né l'uno né l'altro ramo, e
   deve aspettare che qualcuno glielo dica. */
const CORTE = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|..|..|..|..|..|##|##|##|##|##|##|##',
  '##|..|VV|..|..|..|ps|..|o1|..|..|..|##',
  '##|..|EE|..|..|..|##|##|##|##|##|t3|##',
  '##|..|..|..|..|..|##|##|##|##|##|t1|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|t2|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|pg|..|o2|..|..|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|##|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
], { VV: vedetta, EE: eroe, ps: sopra, pg: sotto,
     o1: dove, o2: dove, t1: dove, t2: dove, t3: dove })

export const STAFFETTA = livello({
  id: 'accordo-staffetta', nome: 'La staffetta',
  idea: "Un segnale non dice solo «via»: dice anche QUALE.",
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>. E l'eroe cade al primo colpo.",
  racconto: "La vedetta vede solo la strada di settentrione: se lì c'è l'orco grida che è sgombro a mezzogiorno, se no grida che è sgombro a settentrione. L'eroe da dov'è non vede nessuna delle due — <b>e da un giro all'altro non è mai la stessa</b>.",
  aiuti: ['La vedetta vede una sola delle due strade.',
          'Due gridi diversi vogliono dire due cose diverse.',
          "Chi ascolta non sa in anticipo quale sentirà: dev'essere pronto a tutte e due."],
  ambiente: 'cripta',

  scena: CORTE,
  segnali: [liberoSopra, liberoSotto],
  condizioni: [se.vedi('orchi')],
  complementi: ['tesoro', 'orchi', 'portaSopra', 'portaSotto', 'liberoSopra', 'liberoSotto'],
  verbi: ['vai', 'prendi', 'suona', 'quando'],
  vince: [se.ha(eroe, tesoro)],
  perde: [se.caduto(eroe)],
  motivoSconfitta: "L'orco ha preso l'eroe.",
  mostraNemici: true,

  varianti: [
    { nome: "l'orco a settentrione", metti: { o1: orco, t1: tesoro } },
    { nome: "l'orco a mezzogiorno", metti: { o2: orco, t2: tesoro } },
    { nome: "l'orco a settentrione, il tesoro più lontano", metti: { o1: orco, t3: tesoro } },
  ],

  soluzioni: [
    { nome: 'la vedetta guarda, l\'eroe ascolta', piano: {
      vedetta: [fai.bivio(se.vedi('orchi'), [fai.suona(liberoSotto)], [fai.suona(liberoSopra)])],
      eroe: [fai.quando(liberoSopra, fai.prendi(tesoro)),
             fai.quando(liberoSotto, fai.vai(sotto), fai.prendi(tesoro))],
    } },
    /* FRAGILE, e cade nel modo giusto: non aspetta nessun grido, prende
       sempre la strada di settentrione — quella che si prende senza
       scegliere — e va a sbattere contro l'orco proprio quando è lì. */
    { nome: 'va sempre a settentrione', fragile: true, piano: {
      vedetta: [fai.bivio(se.vedi('orchi'), [fai.suona(liberoSotto)], [fai.suona(liberoSopra)])],
      eroe: [fai.vai(sopra), fai.prendi(tesoro)],
    } },
  ],

  verifiche: {
    nonInFila: true,
    serveOgnuno: true,
  },
})

export default STAFFETTA

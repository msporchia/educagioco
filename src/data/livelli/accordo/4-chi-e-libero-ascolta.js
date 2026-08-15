/* 4 ─ IL SEGNALE ARRIVA A CHI È OCCUPATO. La regola vera del mondo dei
      segnali: un «quando senti» sveglia solo chi in quel momento è
      libero. A chi sta già facendo qualcos'altro il grido scivola
      addosso — non lo accoda, non lo interrompe: quel grido, per lui,
      non è mai arrivato.

      IL GUARDIANO STA IN UNO DI TRE POSTI, sempre più lontano
      dall'esploratrice e sempre più vicino a dove aspetta l'eroe. Se è
      vicino a lei, l'esploratrice lo trova e lo doma molto prima che
      l'eroe possa avvicinarsi. Se è dalla parte dell'eroe, chi non
      aspetta ci arriva prima — viva, e lo trova ancora in piedi.

      IL PIANO BUONO lascia l'eroe libera: mette in ascolto e non le fa
      fare nient'altro, così quando l'esploratrice grida è pronta a
      sentirlo, che arrivi presto o tardi.

      LA FRAGILE STANDARD non aspetta affatto — parte subito verso il
      tesoro — e arriva addosso al guardiano quando lui è ancora dalla
      sua parte, in piedi.

      UNA SECONDA FRAGILE mostra la regola con precisione: l'eroe SI
      METTE IN ASCOLTO SUBITO — quello lo fa bene — ma poi, mentre
      aspetta, va a fare dell'altro (prendere il pane, tanto c'è
      tempo). Quando il grido arriva mentre lei ha le mani occupate le
      scivola addosso, e da lì in poi per lei quel grido non è mai
      suonato: resta ferma per sempre, non perché non sappia cosa fare,
      ma perché non l'ha mai sentito. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const esploratrice = chi.nostro('esploratrice', "l'esploratrice", { corpo: 'guardia', emoji: '🗡️', vita: 20, vista: 16 })
const eroe = chi.nostro('eroe', "l'eroe", { corpo: 'ladra', emoji: '🦸', vita: 1 })
const guardiano = chi.orco({ vista: 2, vita: 3, fa: [fai.aspettaDiVedere('nostri'), fai.attacca('nostri')] })

const tesoro = cose.tesoro()
const pane = cose.pane()
const via = cose.segnale('via', 'via libera', { em: '📣', col: '#3fb872' })
const dove = cose.segnaposto()

/* L'ESPLORATRICE E L'EROE PARTONO AI DUE CAPI OPPOSTI. Il guardiano può
   essere in uno di tre posti lungo il corridoio: il primo è vicino
   all'esploratrice, l'ultimo è vicino all'eroe. Il pane sta un poco
   oltre l'eroe: chi lo va a prendere ci mette del tempo, e per quel
   tempo ha le mani occupate. */
const CORRIDOIO = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|VV|..|..|g1|T$|..|..|g2|..|..|..|g3|..|..|..|..|..|..|EE|..|..|..|..|PP|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
], { VV: esploratrice, EE: eroe, 'T$': tesoro, PP: pane, g1: dove, g2: dove, g3: dove })

export const CHI_E_LIBERO = livello({
  id: 'accordo-libero', nome: "Chi è libero ascolta",
  idea: 'Un grido sveglia chi è libero: a chi ha le mani occupate scivola addosso.',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>. E l'eroe cade al primo colpo.",
  racconto: "L'esploratrice mena il guardiano finché non cade, e solo allora grida che è fatta — <b>in quale dei tre posti sia, cambia a ogni battaglia</b>. Chi in quel momento ha le mani occupate con altro, quel grido non lo sente affatto.",
  aiuti: ["Un grido non aspetta chi è occupato: o sei libera quando arriva, o non l'hai sentito.",
          'Mettersi in ascolto non basta, se poi ti metti a fare dell\'altro.',
          "L'eroe non deve fare nient'altro: deve solo aspettare, libera."],
  ambiente: 'cortile',

  scena: CORRIDOIO,
  segnali: [via],
  complementi: ['tesoro', 'orchi', 'via', 'pane'],
  verbi: ['vai', 'prendi', 'attacca', 'suona', 'quando'],
  vince: [se.ha(eroe, tesoro)],
  perde: [se.caduto(eroe)],
  motivoSconfitta: 'Il guardiano ha preso l\'eroe.',
  mostraNemici: true,

  varianti: [
    { nome: "il guardiano è vicino all'esploratrice", metti: { g1: guardiano } },
    { nome: 'il guardiano è a metà corridoio', metti: { g2: guardiano } },
    { nome: "il guardiano è vicino all'eroe", metti: { g3: guardiano } },
  ],

  soluzioni: [
    { nome: "l'eroe resta libera e aspetta", piano: {
      esploratrice: [fai.attacca('orchi'), fai.suona(via)],
      eroe: [fai.quando(via, fai.prendi(tesoro))],
    } },
    /* FRAGILE STANDARD: non aspetta affatto. Quando il guardiano è
       vicino all'esploratrice, lei lo trova e lo doma molto prima che
       l'eroe si avvicini; quando è dalla sua parte, l'eroe ci arriva
       prima — viva — e lo trova ancora in piedi. */
    { nome: 'parte senza aspettare', fragile: true, piano: {
      esploratrice: [fai.attacca('orchi'), fai.suona(via)],
      eroe: [fai.prendi(tesoro)],
    } },
    /* FRAGILE: si mette in ascolto — quello lo fa — ma poi va a
       prendere il pane mentre aspetta. Se il grido arriva mentre ha le
       mani occupate, le scivola addosso: non lo sente più, e resta lì
       per sempre. Ce la fa solo se il grido arriva DOPO che è tornata
       libera. */
    { nome: 'ascolta, ma intanto fa dell\'altro', fragile: true, piano: {
      esploratrice: [fai.attacca('orchi'), fai.suona(via)],
      eroe: [fai.quando(via, fai.prendi(tesoro)), fai.prendi(pane)],
    } },
  ],

  verifiche: {
    nonInFila: true,
    serveOgnuno: true,
  },
})

export default CHI_E_LIBERO

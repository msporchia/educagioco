/* 2 ─ LA SPIA, cioè LA DOMANDA NON È «VEDI». Stessa forma del quinto
      tutorial — un bivio solo, un ramo vuoto, la strada libera che
      `prendi` prende da sé — ma la domanda con cui si sceglie non è
      più «lo vedo?»: è «è aperta?».

      La grata della guardiola non porta in nessun posto: è un
      congegno decorativo, chiuso a chiave per sempre, che sta accanto
      a dove si parte solo per essere guardato. Quando è spalancata,
      vuol dire che la guardia è uscita a fare il giro sulla strada di
      sopra; quando è chiusa, la guardia è ancora dentro, e la strada
      di sopra è libera. È la stessa deduzione di «due strade» — sapere
      che una cosa non è qui dice dov'è — spostata dall'occhio (vedere
      l'orco) a un'altra domanda (vedere se una porta è aperta): la
      struttura del piano non cambia di una virgola, cambia solo cosa
      si guarda per deciderla.

      ── PERCHÉ LA GRATA E NON L'ORCO ──
      Un livello di bivi tiene in piedi la deduzione solo se da dove si
      parte si vede UNA delle due possibilità, mai tutte e due: qui la
      grata sta a un passo dall'eroe, sempre visibile, e l'orco vero e
      proprio resta lontano — nella strada di sopra lo si vede solo se
      ci si è già dentro, in quella di sotto mai (`vista: 2`, sulla
      soglia). La grata è l'unica cosa che conta per il piano, ed è
      apposta l'unica cosa vicina. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const eroe = chi.nostro('eroe', "l'eroe", { corpo: 'ladra', emoji: '🦸', vista: 6, vita: 1 })
const orco = chi.orco({ vista: 2, vita: 9,
  fa: [fai.aspettaDiVedere(eroe), fai.attacca(eroe)] })

const tesoro = cose.tesoro()
const sopra = cose.posto('portaSopra', 'la porta di sopra')
const sotto = cose.posto('portaSotto', 'la porta di sotto')
const dove = cose.segnaposto()

/* la grata della guardiola: non si apre e non si chiude mai in gioco,
   dice solo — con lo stato in cui il livello la mette — da che parte
   sta pattugliando la guardia. `aMano: false` perché non è un varco:
   nessuno ci cammina, nessuno la tocca */
const spiaDa = ap => cose.grata('spia', 'la spia della guardiola', { aMano: false, aperta: ap })

const DUE_CORTI = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|..|SP|..|..|..|##|##|##|##|##|##|##',
  '##|..|EE|..|..|..|ps|..|oa|..|..|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|t3|##',
  '##|..|..|..|..|..|##|##|##|##|##|t1|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|t2|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|pg|..|ob|..|..|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|##|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
], { EE: eroe, ps: sopra, pg: sotto,
     oa: dove, ob: dove, t1: dove, t2: dove, t3: dove, SP: spiaDa(false) })

export const LA_SPIA = livello({
  id: 'scelta-spia', nome: 'La spia',
  idea: 'Non serve vederlo: basta guardare la spia',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>. E l'eroe cade al primo colpo.",
  racconto: "La guardia pattuglia una delle due strade, e <b>cambia a ogni battaglia</b>. La sua grata è spalancata quando è fuori a fare il giro.",
  aiuti: ["Non serve vedere la guardia: basta guardare la grata qui accanto.",
          "Aperta vuol dire che è uscita — e se è uscita, sta sulla strada di sopra.",
          "C'è un blocco che guarda una volta sola e poi prende una delle due strade."],
  ambiente: 'cripta',

  scena: DUE_CORTI,
  complementi: ['portaSopra', 'portaSotto', 'tesoro', 'spia'],
  condizioni: [se.aperto('spia'), se.chiuso('spia')],
  verbi: ['vai', 'prendi'],
  vince: [se.ha(eroe, tesoro)],
  perde: [se.caduto(eroe)],
  motivoSconfitta: "L'eroe è finito addosso all'orco.",
  mostraNemici: true,

  varianti: [
    { nome: 'la spia aperta: guardia di sopra', metti: { oa: orco, t1: tesoro, SP: spiaDa(true) } },
    { nome: 'la spia chiusa: guardia di sotto', metti: { ob: orco, t2: tesoro, SP: spiaDa(false) } },
    { nome: 'la spia aperta, tesoro in alto', metti: { oa: orco, t3: tesoro, SP: spiaDa(true) } },
  ],

  soluzioni: [
    { nome: 'guarda la spia, poi scegli', piano: { eroe: [
      fai.bivio(se.aperto('spia'), [fai.vai(sotto)]),
      fai.prendi(tesoro),
    ] } },

    /* FRAGILE: «passo sempre di là», senza guardare la grata. Vince
       nelle due scene in cui la guardia sta davvero di sopra e va a
       sbattere in quella in cui sta di sotto. */
    { nome: 'sempre di sotto', fragile: true, piano: { eroe: [
      fai.vai(sotto), fai.prendi(tesoro),
    ] } },
  ],

  verifiche: { nonInFila: true },
})

export default LA_SPIA

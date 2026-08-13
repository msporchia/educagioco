/* 4 ─ QUALE CHIAVE, cioè IL BIVIO CHE DECIDE UN PREREQUISITO. Non è più
      «da che parte passo»: è «quale delle due chiavi mi serve» — e
      guardare lo sportello resta l'unico modo di saperlo, perché
      dell'altra chiave non c'è NESSUN indizio finché non ci si va
      vicino.

      ── PERCHÉ C'È UNA GUARDIA, E LA DOMANDA RESTA «È APERTA?» ──
      La prima versione di questo livello non aveva nessun pericolo: la
      chiave sbagliata si poteva raccogliere gratis, e allora «prendile
      tutte e due e aprila comunque» vinceva sempre — lo sportello
      diventava un lusso, non una necessità, e il bivio un ornamento.
      Un piano che vince senza mai leggere lo sportello non sta
      dimostrando niente.

      Il rimedio è lo stesso di «due porte»: la chiave che NON serve
      sta in una nicchia sorvegliata da una guardia con `vista: 2`, che
      guarda la sua soglia e un passo più in là no. Chi ci va a prendere
      la chiave sbagliata — per scelta o «per sicurezza», prendendole
      tutte e due — se la vede arrivare addosso. Questo avvicina il
      livello al primo della campagna (un ramo pericoloso, uno no): la
      differenza che resta, e che è tutta la lezione di questo capitolo,
      è che LA DOMANDA CON CUI SI SCEGLIE non è «vedo la guardia?» — da
      dove si parte non si vede nessuna delle due nicchie, sono troppo
      lontane — ma sempre e solo `se.aperto('spia')`. La guardia è il
      prezzo di sbagliare, non l'indizio con cui si decide: quello resta
      lo sportello, unico e sempre a un passo da dove si parte. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const eroe = chi.nostro('eroe', "l'eroe", { corpo: 'ladra', emoji: '🦸', vista: 6, vita: 1 })
/* la stessa guardia, spostata di volta in volta sulla nicchia della
   chiave che quella battaglia NON serve: sulla sua soglia, non un
   passo più in là, come vuole la regola dei bivi onesti */
const guardia = chi.nemico('guardia', 'la guardia', { corpo: 'orco', emoji: '👹', vista: 2, vita: 9,
  fa: [fai.aspettaDiVedere(eroe), fai.attacca(eroe)] })

const tesoro = cose.tesoro()
const chiaveRossa = cose.chiave('chiaveRossa', 'la chiave rossa', { em: '🔑' })
const chiaveBlu = cose.chiave('chiaveBlu', 'la chiave blu', { em: '🗝️' })
/* la porta cambia serratura da una battaglia all'altra: quale chiave
   apra `porta` lo decide la variante, non un dato fisso del livello */
const portaDa = giusta => cose.porta('porta', 'la porta del forziere', { chiave: giusta })

/* la spia: un piccolo sportello che il fabbro lascia aperto quando ha
   montato la serratura rossa, e chiuso quando ha montato la blu. Non è
   un varco — sta lì solo per essere guardato, e sta a un passo da dove
   si parte: troppo vicino perché la guardia, ovunque sia, se ne accorga */
const spiaDa = ap => cose.grata('spia', 'lo sportello del fabbro', { aMano: false, aperta: ap })
const dove = cose.segnaposto()

/* UNA STANZA SOLA, con la porta del forziere in fondo. Le due chiavi
   stanno una a ovest e una a est, e le due nicchie (g1, g2) sono
   distanti tre-quattro passi dal centro: fuori dalla vista corta della
   guardia (2), qualunque nicchia occupi. Ci si passa vicino solo
   scegliendo di andarci. */
const STANZA = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##',
  '##|..|..|..|..|..|..|..|..|..|..|##',
  '##|KR|g1|..|..|EE|SP|..|..|g2|KB|##',
  '##|..|..|..|..|..|..|..|..|..|..|##',
  '##|##|##|##|##|PP|##|##|##|##|##|##',
  '##|..|..|..|..|..|..|..|..|..|..|##',
  '##|..|..|..|..|T$|..|..|..|..|..|##',
  '##|##|##|##|##|##|##|##|##|##|##|##',
], { EE: eroe, KR: chiaveRossa, KB: chiaveBlu, SP: spiaDa(true), PP: portaDa('chiaveRossa'), 'T$': tesoro,
     g1: dove, g2: dove })

export const QUALE_CHIAVE = livello({
  id: 'scelta-quale-chiave', nome: 'Quale chiave',
  idea: 'Si sbaglia prima di partire, non per strada',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>. E l'eroe cade al primo colpo.",
  racconto: "Il fabbro monta una serratura diversa a ogni battaglia, rossa o blu, e lo sportello dice quale: <b>aperto per la rossa, chiuso per la blu</b>. La chiave che non serve, quella battaglia, ha una guardia in nicchia.",
  aiuti: ["Guarda lo sportello prima di prendere una chiave: dice quale serve.",
          "Aperto vuol dire rossa, chiuso vuol dire blu.",
          "La chiave sbagliata non è solo inutile: ha compagnia. Non c'è bisogno di andarci."],
  ambiente: 'ingranaggi',

  scena: STANZA,
  complementi: ['chiaveRossa', 'chiaveBlu', 'porta', 'tesoro', 'spia'],
  condizioni: [se.aperto('spia'), se.chiuso('spia')],
  verbi: ['vai', 'prendi', 'apri'],
  vince: [se.ha(eroe, tesoro)],
  perde: [se.caduto(eroe)],
  motivoSconfitta: 'La guardia ha preso l\'eroe alla nicchia sbagliata.',
  mostraNemici: true,

  varianti: [
    { nome: 'sportello aperto: serve la rossa, guardia sulla blu', metti: { SP: spiaDa(true), PP: portaDa('chiaveRossa'), g2: guardia } },
    { nome: 'sportello chiuso: serve la blu, guardia sulla rossa', metti: { SP: spiaDa(false), PP: portaDa('chiaveBlu'), g1: guardia } },
    { nome: 'sportello aperto di nuovo: guardia sulla blu', metti: { SP: spiaDa(true), PP: portaDa('chiaveRossa'), g2: guardia } },
  ],

  par: 5,
  soluzioni: [
    { nome: 'guarda lo sportello, poi scegli la chiave', piano: { eroe: [
      fai.bivio(se.aperto('spia'), [fai.prendi(chiaveRossa)], [fai.prendi(chiaveBlu)]),
      fai.apri('porta'),
      fai.prendi(tesoro),
    ] } },

    /* FRAGILE: «prendo sempre la rossa», senza guardare lo sportello —
       la mossa che indovina di questa campagna, applicata a un
       prerequisito invece che a una strada. Vince le due scene in cui
       la rossa serve davvero, e nella terza va a sbattere sulla
       guardia che sorveglia la nicchia della rossa — perché quella
       battaglia la rossa non serviva, e qualcuno la teneva d'occhio. */
    { nome: 'sempre la rossa', fragile: true, piano: { eroe: [
      fai.prendi(chiaveRossa), fai.apri('porta'), fai.prendi(tesoro),
    ] } },
  ],

  verifiche: { nonInFila: true },
})

export default QUALE_CHIAVE

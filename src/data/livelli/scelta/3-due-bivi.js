/* 3 ─ DUE BIVI IN FILA, non annidati: due decisioni, una dopo l'altra,
      nello stesso piano — non un bivio dentro un ramo dell'altro (quel
      livello lì è un altro capitolo). Due guardie, due strade a testa,
      e le quattro combinazioni non lasciano in piedi nessuna coppia
      fissa: chi decide di guardare una volta sola e ripetere la stessa
      scelta la seconda volta perde tanto quanto chi non guarda affatto.

      La mappa è due «due strade» in fila, con un corridoio corto in
      mezzo che porta dalla prima corte alla seconda: si risolve la
      prima decisione, si arriva al varco, si risolve la seconda. Le
      due guardie hanno un nome proprio (`orco1`, `orco2`) apposta:
      il piano deve dire QUALE dei due sta guardando, non «un orco»
      generico, se no la seconda domanda diventerebbe la stessa della
      prima invece di una domanda nuova.

      ── PERCHÉ IL PASSAGGIO IN MEZZO NON È FACOLTATIVO ──
      Dopo la prima scelta il piano deve **sempre** portarsi al varco
      della seconda corte, qualunque strada abbia preso: è l'ordine che
      rende le due domande indipendenti. Senza, chi ha già visto
      «orco1» resterebbe troppo lontano per vedere mai «orco2» — la
      seconda domanda griderebbe sempre «non lo so», e il piano
      sbaglierebbe sistematicamente ogni volta che la seconda guardia
      sta davvero sulla strada pericolosa. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const eroe = chi.nostro('eroe', "l'eroe", { corpo: 'ladra', emoji: '🦸', vista: 6, vita: 1 })

const guardiaChe = id => nome => chi.nemico(id, nome, { corpo: 'orco', emoji: '👹', vista: 2, vita: 9,
  fa: [fai.aspettaDiVedere(eroe), fai.attacca(eroe)] })
const orco1 = guardiaChe('orco1')('il primo orco')
const orco2 = guardiaChe('orco2')('il secondo orco')

const tesoro = cose.tesoro()
const sotto1 = cose.posto('sotto1', 'la strada di sotto, prima corte')
const sotto2 = cose.posto('sotto2', 'la strada di sotto, seconda corte')
const varco = cose.posto('varco', 'il varco fra le due corti')
const dove1 = cose.segnaposto()
const dove2 = cose.segnaposto()

/* DUE CORTI IN FILA — la prima (colonne 1-11) è identica a quella del
   quinto tutorial: l'eroe parte vicino alla strada di sopra, quella di
   sotto è fuori vista. Il corridoio di mezzo (colonna 12, aperto solo
   alla riga 2) porta nella seconda corte (colonne 13-23), che ripete
   esattamente la stessa forma: si arriva vicino alla SUA strada di
   sopra, e la sua strada di sotto è di nuovo fuori vista. */
const DUE_CORTI_IN_FILA = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|..|..|..|..|..|##|##|##|##|##|##|##|..|..|..|..|..|##|##|##|##|##|##|##',
  '##|..|EE|..|..|..|..|..|a1|..|..|..|..|..|VA|..|..|..|..|..|a2|..|..|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##|..|..|..|..|..|##|##|##|##|##|T$|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|S1|..|b1|..|..|..|##|..|..|..|..|..|S2|..|b2|..|..|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|##|##|..|..|..|..|..|##|##|##|##|##|##|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
], { EE: eroe, VA: varco, S1: sotto1, S2: sotto2,
     a1: dove1, b1: dove1, a2: dove2, b2: dove2, 'T$': tesoro })

export const DUE_BIVI = livello({
  id: 'scelta-due-bivi', nome: 'Due bivi',
  idea: 'Due decisioni, non una ripetuta due volte',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>. E l'eroe cade al primo colpo.",
  racconto: "Due guardie, una per corte, e ognuna <b>cambia strada per conto suo</b> a ogni battaglia. Vedere dov'è la prima non dice niente sulla seconda.",
  aiuti: ["Sono due guardie diverse: guardale una alla volta, con due blocchi diversi.",
          "Dopo la prima scelta, il varco in mezzo porta sempre alla seconda corte.",
          "La seconda guardia non è la prima: quello che hai visto prima non vale più."],
  ambiente: 'cripta',

  scena: DUE_CORTI_IN_FILA,
  complementi: ['orco1', 'orco2', 'sotto1', 'sotto2', 'varco', 'tesoro'],
  condizioni: [se.vedi('orco1'), se.nonVedi('orco1'), se.vedi('orco2'), se.nonVedi('orco2')],
  verbi: ['vai', 'prendi'],
  vince: [se.ha(eroe, tesoro)],
  perde: [se.caduto(eroe)],
  motivoSconfitta: 'Una delle due guardie ha preso l\'eroe.',
  mostraNemici: true,
  /* QUATTRO SCENE, E SI GIOCANO TUTTE E QUATTRO: sono le quattro
     combinazioni delle due incognite, e sono la lezione — con due
     decisioni indipendenti, tre scene ne lascerebbero fuori una, cioè
     lascerebbero in piedi una coppia fissa che vince sempre. `prove`
     di suo si ferma a tre: qui va detto. */
  prove: 4,

  varianti: [
    { nome: 'due guardie di sopra', metti: { a1: orco1, a2: orco2 } },
    { nome: 'la prima di sopra, la seconda di sotto', metti: { a1: orco1, b2: orco2 } },
    { nome: 'la prima di sotto, la seconda di sopra', metti: { b1: orco1, a2: orco2 } },
    { nome: 'due guardie di sotto', metti: { b1: orco1, b2: orco2 } },
  ],

  par: 6,
  soluzioni: [
    { nome: 'guarda due volte, scegli due volte', piano: { eroe: [
      fai.bivio(se.vedi('orco1'), [fai.vai(sotto1)]),
      fai.vai(varco),
      fai.bivio(se.vedi('orco2'), [fai.vai(sotto2)]),
      fai.prendi(tesoro),
    ] } },

    /* FRAGILE: «passo sempre di sotto», in tutte e due le corti, senza
       guardare. Vince solo la scena con le due guardie di sopra — nelle
       altre tre, in almeno una corte la strada di sotto è quella con la
       guardia. */
    { nome: 'sempre di sotto, tutte e due le volte', fragile: true, piano: { eroe: [
      fai.vai(sotto1), fai.vai(varco), fai.vai(sotto2), fai.prendi(tesoro),
    ] } },
  ],

  verifiche: { nonInFila: true },
})

export default DUE_BIVI

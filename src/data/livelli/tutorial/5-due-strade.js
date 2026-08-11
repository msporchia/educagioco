/* 5 ─ LA DECISIONE. Il quinto dei concetti che servono a leggere tutto
      il resto: un ordine, una fila, un giro, un messaggio — e una
      scelta. Il tutorial non finisce qui: manca il rumore.
      QUI DECIDE CHI CAMMINA, e il piano è di UNA sola unità: la
      versione con la vedetta che guarda e l'eroe che ascolta (due
      unità, due segnali, nove ordini) è la stessa idea con sopra tutto
      quello che si è imparato prima, e stava in fondo alla fila dove
      non la vedeva nessuno. Prima si impara a scegliere; metterci
      dentro anche il segnale viene dopo.
      Il bivio è ONESTO solo se da dove sei vedi UNA delle due strade:
      l'eroe parte in cima alla corte e la porta di sopra ce l'ha
      davanti, quella di sotto è dall'altra parte del cortile. Sapere
      che l'orco NON è qui dice dov'è — ed è il primo ragionamento del
      gioco che non è un'osservazione ma una deduzione. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const eroe = chi.nostro('eroe', "l'eroe", { corpo: 'ladra', emoji: '🦸', vista: 6, vita: 1 })
/* L'ORCO GUARDA LA SUA PORTA, e non un metro più in là: con la vista
   lunga vedeva l'eroe passare dall'altra parte del cortile e gli
   correva dietro — e allora il bivio non serviva a niente, perché la
   strada libera non era libera. Due passi di vista sono «sto sulla
   soglia»: chi passa di qui lo prendo, chi passa dall'altra parte è
   affare di qualcun altro.
   E sta NEL CAMMINAMENTO, non appoggiato alla porta: sulla soglia
   beccava chi scendeva lungo il cortile a tre celle di distanza. Un
   passo più in là, e la corte di ponente torna terra di nessuno. */
const orco = chi.orco({ vista: 2, vita: 9,
  fa: [fai.aspettaDiVedere(eroe), fai.attacca(eroe)] })

const tesoro = cose.tesoro()
const sopra = cose.posto('portaSopra', 'la porta di sopra')
const sotto = cose.posto('portaSotto', 'la porta di sotto')
const dove = cose.segnaposto()

/* DUE CORTI E DUE CAMMINAMENTI — la corte di ponente è larga e aperta,
   e da lì partono due strade lunghe uguali: una in cima, una in fondo.
   Si toccano solo all'altro capo. Da una non si vede l'altra, ed è
   questo che rende la scelta una scelta.
   `oa`/`ob` sono i due camminamenti dove l'orco può stare in agguato,
   `t1`/`t2`/`t3` i posti del tesoro. */
const DUE_CORTI = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|..|..|..|..|..|##|##|##|##|##|##|##',
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
     oa: dove, ob: dove, t1: dove, t2: dove, t3: dove })

export const DUE_STRADE = livello({
  id: 'due-strade', nome: 'Due strade', idea: 'Guarda prima di scegliere',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>. E l'eroe cade al primo colpo.",
  racconto: "L'orco sta a una delle due porte, e <b>cambia a ogni battaglia</b>. Da dove parti ne vedi una sola.",
  aiuti: ['Da qui vedi solo la strada di sopra. Guardala.',
          'Sapere che l\'orco NON è qui dice dov\'è.',
          'C\'è un blocco che guarda una volta sola e poi prende una delle due strade.'],
  ambiente: 'cripta',

  scena: DUE_CORTI,
  complementi: ['portaSopra', 'portaSotto', 'tesoro', 'orchi'],
  /* la domanda è una sola, e il livello la detta: lo vedo o no? */
  condizioni: [se.vedi('orchi'), se.nonVedi('orchi')],
  verbi: ['vai', 'prendi'],
  vince: [se.ha(eroe, tesoro)],
  perde: [se.caduto(eroe)],
  motivoSconfitta: "L'eroe è finito addosso all'orco.",
  mostraNemici: true,

  varianti: [
    { nome: "l'orco sulla strada di sopra", metti: { oa: orco, t1: tesoro } },
    { nome: "l'orco sulla strada di sotto", metti: { ob: orco, t2: tesoro } },
    { nome: "l'orco di sopra, tesoro in alto", metti: { oa: orco, t3: tesoro } },
  ],

  par: 4,
  soluzioni: [
    { nome: 'guarda, poi scegli', piano: { eroe: [
      fai.bivio(se.vedi('orchi'), [fai.vai(sotto)], [fai.vai(sopra)]),
      fai.prendi(tesoro),
    ] } },
    /* FRAGILE: «passo sempre di sotto». Due scene su tre l'orco è di
       sopra e questo piano vince con due ordini invece di quattro —
       nella terza ci si va a sbattere. Indovinare non è sapere. */
    { nome: 'sempre di sotto', fragile: true, piano: { eroe: [
      fai.vai(sotto), fai.prendi(tesoro),
    ] } },
  ],
})

export default DUE_STRADE

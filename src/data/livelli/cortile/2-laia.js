/* 2 ─ IL PANE PER TERRA, cioè `posa`.

      Il mondo è quello di ieri e non cambia di una virgola: stessa
      stanza, stessa papera, stessa riga nella sua scheda. Quello che
      cambia è **una parola nuova in cassetta**, ed è l'unica cosa da
      capire — un livello, un asse.

      Ieri Bibi ti veniva dietro. Ma venire dietro non è arrivare: se il
      pane resta in tasca, la papera resta attaccata a te e quando tu
      te ne vai, se ne va anche lei. Oggi la mamma chiama Rosa a casa e
      Bibi deve **restare** nell'aia: la sola mossa che lo ottiene è
      lasciare il pane lì.

          dove posi il pane, lì va la papera — e lì resta.

      È la grammatica di tutto quello che viene dopo: `posa` non è un
      modo più comodo di trasportare, è il modo di **mandare qualcuno
      dove tu non stai**.

      ── PERCHÉ LA VITTORIA CHIEDE ANCHE DOVE STA ROSA ──
      Senza «e Rosa a casa» il capitolo si vincerebbe come ieri, senza
      posare niente: basterebbe entrare nell'aia con il pane in tasca e
      restarci. La seconda condizione è quella che rende `posa`
      necessario invece che elegante, e a schermo è la cosa più
      naturale del mondo: la papera resta a mangiare, tu vai a cena. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const rosa = chi.nostro('rosa', 'Rosa', { corpo: 'principessa', emoji: '👧', vista: 6 })

const pane = cose.pane()
const aia = cose.posto('aia', "l'aia")
const casa = cose.posto('casa', 'il gradino di casa')

const bibi = chi.terzo('bibi', 'Bibi', { corpo: 'papera', emoji: '🦆', vista: 3, vita: 4,
  schiera: 'cortile', schieraNome: 'quelli del cortile',
  fa: [fai.ripeti([fai.vai(pane)], se.caduto('bibi'))] })

/* LA STESSA STANZA DI IERI, e non è pigrizia: una stanza già vista
   abbassa il carico e lascia l'attenzione sulla parola nuova. Cambia
   dove parte la papera, e cambia cosa vuol dire vincere. */
const dove = cose.segnaposto()
const CORTILE = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##',
  '##|P$|..|..|..|..|..|..|..|..|..|##',
  '##|..|..|##|##|##|##|##|##|..|..|##',
  '##|CS|..|..|..|b1|..|..|##|..|AI|##',
  '##|..|..|##|##|##|##|..|##|..|..|##',
  '##|..|b2|..|..|..|##|..|##|..|..|##',
  '##|..|..|..|..|..|b3|..|..|..|..|##',
  '##|##|##|##|##|##|##|##|##|##|##|##',
], { CS: [casa, rosa], 'P$': pane, AI: aia, b1: dove, b2: dove, b3: dove })

export const LAIA = livello({
  id: 'cortile-aia', nome: "L'aia", idea: 'Dove posi il pane, lì resta la papera',
  dritta: "Obiettivo: <b>Bibi nell'aia, e Rosa a casa</b>.",
  racconto: 'È ora di cena e la mamma chiama. Bibi deve restare nell\'aia — ma se il pane torna a casa con te, torna a casa anche lei.',
  aiuti: ['Quello che tieni in mano si può anche lasciare per terra.',
          'La papera segue il pane, non te: guarda dov\'è il pane e saprai dove sarà lei.',
          'Prima si arriva dove deve restare, poi si lascia il pane. Non il contrario.'],
  ambiente: 'cortile',

  scena: CORTILE,
  complementi: ['pane', 'aia', 'casa', 'bibi'],
  verbi: ['vai', 'prendi', 'posa'],

  vince: [se.qui(bibi, aia), se.qui(rosa, casa)],
  mostraNemici: true,

  varianti: [
    { nome: 'Bibi è nel passaggio', metti: { b1: bibi } },
    { nome: 'Bibi è dietro la siepe', metti: { b2: bibi } },
    { nome: 'Bibi è in fondo al cortile', metti: { b3: bibi } },
  ],

  soluzioni: [
    /* QUATTRO ORDINI, e non serve nemmeno passarle davanti come ieri:
       **il pane per terra lo vede da qualunque parte del cortile**, e
       questa è la seconda metà della regola di ieri. Quello che serve è
       posarlo dove deve restare lei, e andarsene. */
    { nome: 'il pane resta, io torno', piano: { rosa: [
      fai.prendi(pane), fai.vai(aia), fai.posa(pane), fai.vai(casa),
    ] } },

    /* ── E LA MOSSA DI IERI NON STA FRA LE `fragile` ──
       «Portarla fin lì col pane in tasca e tornare a casa» perde in
       tutte e tre le scene, non in una: la papera si gira e ti segue
       indietro, sempre. Una `fragile` è una tentazione che **a volte
       funziona** — quella che vince sempre non dimostra niente, quella
       che perde sempre non è una tentazione, è un errore che si vede al
       primo ▶. Il banco pretende esattamente questo, ed è giusto così:
       qui la lezione la fa `ordineConta`. */
  ],

  verifiche: {
    ordineConta: [['vai aia', 'posa pane']],
  },
})

export default LAIA

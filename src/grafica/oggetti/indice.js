/* ═══════════════════════════════════════════════════════════════════
   GLI OGGETTI — l'indice

   Quaranta e passa cose che stanno su una cella e non camminano. Un
   file per oggetto, e qui la sola riga che li mette insieme:
   aggiungerne uno è **un file nuovo più una riga in questa tabella**,
   mai una modifica a un file che cresce.

   Il catalogo è diviso in tre per come si usano, non per come si
   disegnano:

     DA PRENDERE   ondeggiano e mandano scintille (`raccolta`): chiave,
                   gemma, moneta, mappa, pergamena, pozione, libro,
                   bacchetta, scudo, elmo, stivali, pane, corda,
                   secchio, martello, piccone, campana, corno, lanterna,
                   torcia da mano
     DA USARE      hanno uno stato che il gioco muove: leva, pulsante,
                   ruota, argano, botola, ponte levatoio, forziere,
                   braciere, altare, fontana, campanello — e **le
                   porte**, che sono cinque stili di uno stesso
                   pittore (`porte/`): legno, ferro, saracinesca,
                   arco con tenda, lastra di pietra
     DI SCENA      stanno lì e basta: cassa, botte, barile, sacco,
                   pozzo, colonna, cartello, bandiera, tenda, carrello,
                   binario, ponte, scala, catena, albero, cespuglio,
                   masso, stalagmite, ossa, fungo, cristallo,
                   ragnatela, acqua, pozzanghera, fuoco da campo,
                   torcia da muro

   Molti hanno **due stati** (aperto/chiuso, acceso/spento,
   pieno/vuoto) perché serviranno tutti e due: un braciere spento e uno
   acceso sono due momenti di una storia, e chi scrive il livello deve
   averli già pronti.
   ═══════════════════════════════════════════════════════════════════ */
import { chiave } from './chiave.js'
import { gemma } from './gemma.js'
import { moneta } from './moneta.js'
import { mappa } from './mappa.js'
import { pergamena } from './pergamena.js'
import { pozione } from './pozione.js'
import { libro } from './libro.js'
import { bacchetta } from './bacchetta.js'
import { scudo } from './scudo.js'
import { elmo } from './elmo.js'
import { stivali } from './stivali.js'
import { pane } from './pane.js'
import { corda } from './corda.js'
import { secchio } from './secchio.js'
import { martello } from './martello.js'
import { piccone } from './piccone.js'
import { campana } from './campana.js'
import { corno } from './corno.js'
import { lanterna } from './lanterna.js'
import { torciaMano } from './torcia-mano.js'

import { leva } from './leva.js'
import { pulsante } from './pulsante.js'
import { ruota } from './ruota.js'
import { argano } from './argano.js'
import { catena } from './catena.js'
import { botola } from './botola.js'
import { porta, portone, cancello, saracinesca, arco, pietraPorta } from './porte/indice.js'
import { ponte } from './ponte.js'
import { ponteLevatoio } from './ponte-levatoio.js'
import { scala } from './scala.js'
import { forziere } from './forziere.js'
import { campanello } from './campanello.js'

import { torcia } from './torcia.js'
import { braciere } from './braciere.js'
import { falo } from './falo.js'
import { altare } from './altare.js'
import { fontana } from './fontana.js'
import { pozzo } from './pozzo.js'
import { colonna } from './colonna.js'
import { cassa } from './cassa.js'
import { botte, barile } from './botte.js'
import { sacco } from './sacco.js'
import { cartello } from './cartello.js'
import { bandiera } from './bandiera.js'
import { tenda } from './tenda.js'
import { carrello } from './carrello.js'
import { binario } from './binario.js'
import { albero } from './albero.js'
import { cespuglio } from './cespuglio.js'
import { roccia } from './roccia.js'
import { stalagmite } from './stalagmite.js'
import { ossa } from './ossa.js'
import { fungo } from './fungo.js'
import { cristallo } from './cristallo.js'
import { ragnatela } from './ragnatela.js'
import { acqua, pozzanghera } from './acqua.js'
import { vista, ronda } from './macchie.js'

export { apriForziere } from './forziere.js'
export { COLORI_ALLARME } from './campanello.js'
export { STILI_PORTA } from './porte/indice.js'
export { COLORI_CHIAVE } from './chiave.js'
export { COLORI_GEMMA } from './gemma.js'
export { COLORI_POZIONE } from './pozione.js'

export const PITTORI_OGGETTI = {
  // da prendere
  chiave, gemma, moneta, mappa, pergamena, pozione, libro, bacchetta,
  scudo, elmo, stivali, pane, corda, secchio, martello, piccone,
  campana, corno, lanterna, torciaMano,
  // da usare
  leva, pulsante, ruota, argano, catena, botola,
  porta, portone, cancello, saracinesca, arco, pietraPorta,
  ponte, ponteLevatoio, scala, forziere, campanello,
  // di scena
  torcia, braciere, falo, altare, fontana, pozzo, colonna, cassa, botte,
  barile, sacco, cartello, bandiera, tenda, carrello, binario, albero,
  cespuglio, roccia, stalagmite, ossa, fungo, cristallo, ragnatela,
  acqua, pozzanghera,
  // le due macchie di informazione
  vista, ronda,
}

/* i nomi, per chi deve sapere che cosa può mettere in scena (e per la
   vetrina, che li elenca tutti) */
export const OGGETTI = Object.keys(PITTORI_OGGETTI)

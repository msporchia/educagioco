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
import { totem } from './totem.js'
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
import { pugnale, spada } from './pugnale.js'
import { corona, spazzola } from './corona.js'
import { tavolo, cesta, cuccia } from './casa.js'
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
  scudo, elmo, stivali, pane, corda, secchio, martello, piccone, pugnale, spada,
  corona, spazzola, tavolo, cesta, cuccia,
  campana, corno, lanterna, torciaMano,
  // da usare
  leva, totem, pulsante, ruota, argano, catena, botola,
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

/* ── E QUELLO CHE STA BENE ADDOSSO A UN MURO ──
   Il primo giro di questa regola diceva soltanto «quello che ingombra
   sta sui muri», e a rigor di logica è giusto: se lo disegni sul
   pavimento prometti un ostacolo che non c'è. Ma applicata a una
   COLONNA dà una colonna dipinta sopra il muro di cinta, e chi guarda
   si chiede giustamente cosa ci faccia lì. La differenza che mancava è
   fra due famiglie:

     · roba che nella vita **sta contro un muro** o ci cresce sopra —
       una torcia, una bandiera, un cartello, un cespuglio, una roccia:
       disegnarla sul muro è esattamente dove la si vedrebbe;
     · roba che **sta in mezzo a una stanza** — un tavolo, una cassa, una
       botte, una colonna: quella è **arredo**, e va su una casella di
       muro *dentro* la stanza. Un muro isolato in mezzo a un locale non
       è un muro: è il mobile che c'è lì, e il fatto che non ci si passi
       sopra è vero.

   La regola resta una sola — **quello che ha un volume sta su una
   casella di muro** — e quale muro è una scelta di chi arreda: il
   perimetro per quello che ci si appoggia (torce, bandiere, cespugli),
   una casella isolata dentro la stanza per i mobili. La colonna
   disegnata sul muro di cinta era sbagliata per QUESTO, non perché le
   colonne non si possano usare. */
export const DA_MURO = new Set([
  'torcia', 'bandiera', 'cartello', 'cespuglio', 'albero', 'roccia',
  'stalagmite', 'cristallo', 'scala', 'catena', 'tenda',
])
export const A_TERRA = new Set([
  'ossa', 'pozzanghera', 'acqua', 'ragnatela', 'binario', 'fungo',
])

/* ── QUELLO CHE HA UN VOLUME, E DOVE VA MESSO ──
   Un albero disegnato in mezzo a un cortile dice una cosa sola a chi
   guarda: **di lì non si passa**. E invece si passa, perché la
   scenografia non esiste per il motore — con il risultato che il
   giocatore si costruisce una mappa in testa più stretta di quella
   vera, e scarta la strada giusta. Un disegno che mente sulla
   geometria è peggio di nessun disegno.
   La regola che ne esce, ed è controllata dal banco
   (`test/aiuto/livello.mjs`): **quello che ha un volume sta sui muri,
   dove non si passa davvero; sul pavimento ci va solo quello che si
   calpesta** — una pozzanghera, un mucchio d'ossa, una ragnatela per
   terra. Così l'ingombro disegnato e l'ingombro vero coincidono, e la
   mappa che il bambino vede è la mappa che gioca.
   Chi non è in questo elenco è piatto: nel dubbio si aggiunge qui, che
   è l'errore che non fa danni. */
/* ── L'ARREDO: QUELLO CHE SI DICHIARA IN LEGENDA E OCCUPA LA CELLA ──
   Una botte disegnata su una casella calpestabile è una bugia, e una
   botte disegnata sopra un muro è un'assurdità: erano le due uscite
   di una regola («l'ingombrante sta sui muri») che tappava un buco
   architetturale. La terza uscita è quella giusta — **un mobile è una
   cosa della mappa**: si scrive in legenda come tutto il resto
   (`'BT': arredo.botte()`), sta sul pavimento, e la cella è occupata
   davvero. Quello che si vede ingombrare, ingombra.
   È la stessa lista di prima, con un mestiere invece di un divieto. */
export const ARREDI = new Set([
  'botte', 'barile', 'cassa', 'sacco', 'tavolo', 'carrello', 'colonna',
  'altare', 'fontana', 'pozzo', 'braciere', 'falo', 'cesta', 'cuccia',
  'forziere', 'roccia', 'stalagmite', 'cristallo', 'albero', 'cespuglio',
])
export const NOMI_ARREDO = [...ARREDI]

export const INGOMBRANTI = new Set([
  'albero', 'cespuglio', 'roccia', 'stalagmite', 'cristallo', 'fungo',
  'fontana', 'pozzo', 'colonna', 'altare', 'braciere', 'falo', 'torcia',
  'cassa', 'botte', 'barile', 'sacco', 'carrello', 'tenda', 'cartello',
  'bandiera', 'campanello', 'scala', 'forziere', 'ponte', 'ponteLevatoio',
  'tavolo', 'cesta', 'cuccia', 'catena',
])

/* 1 ─ BIBI, cioè QUALCUNO CHE NON COMANDI.

      La campagna si apre con una **regola del mondo**, non con una
      parola nuova: qui si dicono solo cose che il tutorial ha già
      insegnato (`vai`, `prendi`), e tutto quello che c'è da capire sta
      in una riga del piano di Bibi, che si legge toccandola:

          🔁 ripeti  ·  🚶 vai a [il pane]

      Nel motore non c'è niente di nuovo: `vai [una cosa]` insegue la
      cosa dovunque sia, e un oggetto in tasca «sta dove sta chi lo
      tiene» (`Oggetto.dove()`). Da quella riga sola escono tre
      comportamenti che a guardarli sembrano tre caratteri diversi:

        · il pane è per terra   → Bibi ci va, e la strada la trova lei;
        · il pane ce l'hai tu   → Bibi ti viene dietro;
        · il pane non lo vede   → resta dov'è e riprova al giro dopo.

      L'ultimo nasce da solo ed è quello che fa il livello: una cosa in
      tasca a qualcuno si trova solo se **quel qualcuno lo vedi**
      (`dovePensiCheSia` passa dalla memoria appena il bersaglio è
      addosso a un'unità). Una cosa per terra invece la vedono tutti.

      ── E DEV'ESSERE UN CICLO ──
      `vai [il pane]` da solo finisce quando ci è arrivata, e da lì lei
      resterebbe ferma anche se il pane se ne va in tasca a qualcuno che
      cammina. Il ciclo lo rifà a ogni battito: è quello che a schermo
      si legge come «mi viene dietro».

      ── LA LEZIONE, CHE NON È «SEGUIMI» ──
      È la prima volta che il bambino deve pensare a quello che vede
      **qualcun altro**. Non «dove devo andare io», ma «da dove mi vede
      lei»: Bibi vede corto, e la strada corta per l'aia non passa
      davanti a nessuno. Passarle davanti costa un ordine in più ed è
      l'unico che regge su tutte e tre le scene. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

/* `vista: 8` — Rosa deve **vedere tutto il cortile da dove parte**, se
   no `vai [Bibi]` risponde «non so dov'è» (nessuno va da chi non ha mai
   visto) e la scena in cui la papera è in fondo non si può nemmeno
   cominciare. Otto contro tre non è un numero grosso a caso: è la
   distanza che rende leggibile la lezione — tu la vedi sempre, lei ti
   riconosce solo da vicino. */
const rosa = chi.nostro('rosa', 'Rosa', { corpo: 'principessa', emoji: '👧', vista: 8 })

const pane = cose.pane()
/* ── LA META È UNA SOGLIA, E C'È UNA RAGIONE PRECISA ──
   «Bibi deve entrare nell'aia» si misura sul varco che attraversa, non
   sul fondo dove si ferma: chi ti segue arriva **accanto** a te, non
   sopra di te, quindi una meta dove Rosa sta ferma non la raggiunge
   mai. La soglia invece la papera ci passa sopra mentre ti viene
   dietro — e «entrare» è esattamente quello. La mangiatoia in fondo
   serve a Rosa per proseguire oltre, così la papera ha un motivo per
   attraversare davvero.

   E l'aia ha **un ingresso solo**: con due, chi segue passa dall'altro
   e la soglia non la tocca nessuno — che è esattamente quello che
   succedeva prima di chiudere quel muro. Una meta di passaggio vale
   solo se il passaggio è obbligato. */
const soglia = cose.posto('soglia', "la soglia dell'aia")
const mangiatoia = cose.posto('mangiatoia', 'la mangiatoia')

/* `vista: 3` è quanto lontano Bibi riconosce chi porta il pane: più
   corta di quella di Rosa apposta — di qui in avanti la campagna vive
   sul fatto che due non vedono la stessa distanza, e le due schede lo
   dicono. Il ciclo non smette mai: una papera che insegue il pane lo
   insegue finché sta in piedi. */
const bibi = chi.terzo('bibi', 'Bibi', { corpo: 'papera', emoji: '🦆', vista: 3, vita: 4,
  schiera: 'cortile', schieraNome: 'quelli del cortile',
  fa: [fai.ripeti([fai.vai(pane)], se.caduto('bibi'))] })

/* IL CORTILE — la cucina a ponente col pane sul tavolo, l'aia in fondo
   a levante, la siepe in mezzo. Due strade: quella di sopra è la più
   corta e non passa davanti a nessuno; quella di sotto gira largo.
   `b1`…`b3` sono i tre posti dove può essere la papera. */
const dove = cose.segnaposto()
const CORTILE = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##',
  '##|P$|..|..|..|..|..|..|..|..|..|##',
  '##|..|..|##|##|##|##|##|##|..|##|##',
  '##|@@|..|..|..|b1|..|..|##|SG|MA|##',
  '##|..|..|##|##|##|##|..|##|##|##|##',
  '##|..|b2|..|..|..|##|..|..|..|..|##',
  '##|..|..|..|..|..|b3|..|..|..|..|##',
  '##|##|##|##|##|##|##|##|##|##|##|##',
], { '@@': rosa, 'P$': pane, SG: soglia, MA: mangiatoia,
     b1: dove, b2: dove, b3: dove })

export const BIBI = livello({
  id: 'cortile-bibi', nome: 'Bibi', idea: 'Bibi non ascolta te: ascolta il pane',
  dritta: "Obiettivo: <b>Bibi deve arrivare all'aia</b>.",
  racconto: 'Bibi non ascolta nessuno. Bibi ascolta il pane — e quello che fa è <b>scritto nella sua scheda</b>: toccala e lo leggi. Ma per venirti dietro deve vederti, e lei <b>vede meno lontano di te</b>.',
  aiuti: ['Tocca Bibi: il suo piano è una riga sola, e non cambia mai.',
          'A lei non si comanda niente. Si sposta il pane.',
          'Il pane che tieni in mano lo vede solo addosso a te — e la strada corta per l\'aia non le passa davanti.'],
  ambiente: 'cortile',

  scena: CORTILE,
  complementi: ['pane', 'soglia', 'mangiatoia', 'bibi'],
  verbi: ['vai', 'prendi'],

  vince: [se.qui(bibi, soglia)],
  mostraNemici: true,

  varianti: [
    { nome: 'Bibi è nel passaggio', metti: { b1: bibi } },
    { nome: 'Bibi è dietro la siepe', metti: { b2: bibi } },
    { nome: 'Bibi è in fondo al cortile', metti: { b3: bibi } },
  ],

  soluzioni: [
    /* TRE ORDINI, e quello di mezzo è la lezione: `vai [Bibi]` non
       serve a prenderla — serve a **farsi vedere** da lei. */
    { nome: 'passale davanti', piano: { rosa: [
      fai.prendi(pane), fai.vai(bibi), fai.vai(mangiatoia),
    ] } },

    /* FRAGILE: la strada corta. Vince la scena in cui Bibi sta proprio
       nel passaggio, e nelle altre due Rosa arriva all'aia da sola con
       la papera che non l'ha mai vista. */
    { nome: 'dritti all\'aia', fragile: true, piano: { rosa: [
      fai.prendi(pane), fai.vai(mangiatoia),
    ] } },
  ],

  /* ── E QUI NON C'È NESSUN `ordineConta` ──
     Verrebbe da scriverlo — «prima il pane, poi passale davanti» — ma
     il banco lo smentisce: chi le passa davanti a mani vuote e poi
     torna a prendere il pane le ripassa davanti lo stesso, e vince.
     Una regola che il gioco non fa rispettare non si dichiara: la
     lezione qui la fa cadere la `fragile`, che è il controllo vero. */
})

export default BIBI

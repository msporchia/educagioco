/* 4 ─ L'ORTO, cioè DUE CHE VOGLIONO LA STESSA COSA.

      Il pane chiama Bibi. Il pane chiama anche Bombo — è un cane, e il
      suo piano si legge come quello di tutti: `prendi [il pane]`. Da
      questa sola riga nasce il capitolo: **posare il pane non basta
      più**, perché arrivano in due, e uno dei due non deve entrare.

      Il cancello è la risposta, e ci si arriva da soli: si fa entrare
      la papera e si chiude prima che arrivi il cane. Non c'è nessun
      ordine nuovo — `chiudi` è il gemello di `apri`, e chi ha giocato
      il tutorial l'ha già visto — ma c'è per la prima volta una cosa
      che il piano deve **aspettare**: chiudere troppo presto lascia
      fuori Bibi, chiudere troppo tardi fa entrare Bombo.

      ── LA FINESTRA NON SI CONTA, SI GUARDA ──
      `aspetta che [Bibi è all'orto]` è l'attesa giusta, ed è la stessa
      forma dell'ottava prova del tutorial: fermati su quello che vuoi
      ottenere. Le tre scene cambiano **da dove partono i due**, quindi
      quanti battiti ci mettono non è mai lo stesso — e chi conta ne
      indovina una su tre.

      ── PERCHÉ SI PERDE COL PANE E NON COL CANE ──
      La sconfitta è «Bombo ha il pane», non «Bombo è nell'orto»: è la
      stessa cosa nei fatti, ma è quella che si vede. Un cane che si
      mangia il pane è una cosa che un bambino capisce senza leggere
      niente, e a schermo succede in un gesto solo. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const rosa = chi.nostro('rosa', 'Rosa', { corpo: 'principessa', emoji: '👧', vista: 6 })

const pane = cose.pane()
const orto = cose.posto('orto', "l'orto")
const gradino = cose.posto('gradino', 'il gradino')
/* il ciliegio sta **accanto** al cancello, non sopra: una porta non si
   chiude standoci in mezzo («c'è qualcuno sulla soglia»), e questo è il
   posto da cui si aspetta guardando dentro. */
const ciliegio = cose.posto('ciliegio', 'il ciliegio')
/* il cancello dell'orto: nessuna chiave e nessuna spallata — si apre e
   si chiude camminandoci, ed è tutto quello che deve fare */
const cancello = cose.porta('cancello', 'il cancello', { stile: 'legno' })

/* ── IL PANE STA SUL GRADINO, ACCANTO A ROSA ──
   Non è un dettaglio di arredamento: se il pane fosse in mezzo al
   cortile, Bibi ci arriverebbe prima di lei — una cosa per terra la
   vedono tutti — e da lì in poi le starebbe accanto per tutta la
   partita, entrando nell'orto insieme a lei. Con il pane a un passo,
   Rosa lo prende al secondo battito, Bibi arriva su una cella vuota e
   si ferma: **da quel momento la papera aspetta che il pane ricompaia
   da qualche parte**, ed è esattamente il gioco.

   ── QUI BIBI NON TI SEGUE: TI RAGGIUNGE ──
   `vista: 2` e il muro dell'aia in mezzo: mentre Rosa attraversa il
   cortile col pane in tasca, Bibi non la vede e non si muove. Parte
   quando il pane finisce **per terra** — una cosa a terra la vedono
   tutti, sempre — e da lì è una gara fra lei e il cane. Senza questo il
   livello non esisterebbe: una papera che ti sta dietro entra
   nell'orto insieme a te, e non c'è più niente da aspettare. */
const bibi = chi.terzo('bibi', 'Bibi', { corpo: 'papera', emoji: '🦆', vista: 2, vita: 4,
  schiera: 'cortile', schieraNome: 'quelli del cortile',
  fa: [fai.ripeti([fai.vai(pane)], se.caduto('bibi'))] })

/* IL CANE, e il suo piano sono DUE ORDINI che si leggono nella scheda:
   dorme un po', poi va a prendersi il pane. Non ti insegue e non
   abbaia — vuole solo quello.

   ── IL SONNO È LA FINESTRA, E CAMBIA A OGNI PARTITA ──
   Senza, il cane parte insieme a te e ti sta addosso tutto il tempo:
   qualunque cosa tu posi, se la prende nello stesso istante, e non
   esiste nessun piano che vinca. Con il sonno c'è una finestra vera —
   e siccome **quanto dorme cambia da una scena all'altra**, quella
   finestra non si può contare: si guarda. */
const bomboChe = dorme => chi.nemico('bombo', 'Bombo', { corpo: 'lupo', emoji: '🐕',
  vista: 5, vita: 8, schiera: 'cani', schieraNome: 'il cane del vicino',
  fa: [fai.aspettaUnPo(dorme), fai.prendi(pane)] })

/* IL CORTILE E L'ORTO — l'orto è la stanza a levante, con un cancello
   solo. Bibi sta a tramontana, il cane arriva da mezzogiorno, e le tre
   scene cambiano quanto sono lontani l'uno dall'altra. */
const dove = cose.segnaposto()
const CORTILE = campo([
  '##|##|##|##|##|##|##|##|##|##|##',
  '##|b1|..|..|b2|##|..|..|b3|..|##',
  '##|##|##|##|..|##|..|OR|..|..|##',
  '##|GR|P$|..|..|CI|CC|..|..|..|##',
  '##|..|##|##|..|##|..|..|..|..|##',
  '##|c1|..|..|..|##|..|..|..|..|##',
  '##|##|##|##|##|##|##|##|##|##|##',
], { GR: [gradino, rosa], 'P$': pane, CC: cancello, OR: orto, CI: ciliegio,
     b1: dove, b2: dove, b3: dove, c1: dove })

export const LORTO = livello({
  id: 'cortile-orto', nome: "L'orto", idea: 'Falla entrare, e chiudi prima che arrivi lui',
  dritta: "Obiettivo: <b>Bibi nell'orto e il cancello chiuso</b>. Se Bombo prende il pane, è finita.",
  racconto: 'Il pane non chiama solo la papera. Tocca Bombo e leggi cosa vuole fare: <b>è una riga sola</b>. Il cancello si apre e si chiude quante volte vuoi.',
  aiuti: ['Il cane e la papera vogliono la stessa cosa, e partono da due parti diverse.',
          'Un cancello chiuso ferma tutti e due. Il punto è quando.',
          'Non contare i passi degli altri: guarda quando la papera è arrivata.'],
  ambiente: 'cortile',

  scena: CORTILE,
  complementi: ['pane', 'orto', 'gradino', 'ciliegio', 'cancello', 'bibi', 'bombo'],
  verbi: ['vai', 'prendi', 'posa', 'apri', 'chiudi', 'aspetta'],
  condizioni: [se.qui(bibi, orto), se.vedi('bombo')],

  vince: [se.qui(bibi, orto), se.chiuso(cancello)],
  perde: [se.ha('bombo', pane)],
  motivoSconfitta: 'Bombo si è preso il pane.',
  mostraNemici: true,

  /* le tre scene cambiano **quanto dorme il cane** e **quanto è
     lontana la papera**: sono i due numeri che decidono la finestra, e
     nessuno dei due si vede prima di premere ▶ */
  varianti: [
    { nome: 'Bibi è in fondo all\'aia', metti: { b1: bibi, c1: bomboChe(16) } },
    { nome: 'Bibi è di qua dal muro', metti: { b2: bibi, c1: bomboChe(13) } },
    { nome: 'Bibi è già nell\'orto', metti: { b3: bibi, c1: bomboChe(11) } },
  ],

  soluzioni: [
    /* il cancello parte chiuso: la prima cosa da fare è aprirlo, e
       l'ultima è richiuderlo. Fra le due c'è tutto il livello. */
    { nome: 'entra lei, e chiudo', piano: { rosa: [
      fai.prendi(pane), fai.apri(cancello),
      fai.vai(orto), fai.posa(pane),
      fai.aspettaChe(se.qui(bibi, orto)),
      fai.chiudi(cancello),
    ] } },

    /* FRAGILE: chiudere subito, senza aspettare. Vince quando Bibi è
       già vicina e perde quando è lontana — cioè la tentazione più
       naturale che c'è, e che a volte funziona davvero. */
    { nome: 'chiudo subito', fragile: true, piano: { rosa: [
      fai.prendi(pane), fai.apri(cancello),
      fai.vai(orto), fai.posa(pane),
      fai.chiudi(cancello),
    ] } },
  ],

  verifiche: {
    nonInFila: true,
    ordineConta: [['posa pane', 'chiudi cancello']],
  },
})

export default LORTO

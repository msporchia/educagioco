/* 4 ─ IL COVO DELL'ORCO. Due regole del mondo nuove, e sono le due che
      trasformano un piano in una decisione:

        **le mani sono due** — per prendere la terza cosa ne posi una;
        **una porta si può chiudere** — e chiuderla cambia la strada.

      ── PERCHÉ SI FANNO QUESTE COSE ──
      L'orco è entrato in casa della principessa, si è portato via la
      corona e la spazzola, e le ha preso anche il gatto: sta in gabbia
      nel covo. Lei va a riprendersi la sua roba e a rimetterla dov'era.
      Non c'è nessun tesoro da conquistare: c'è da rimediare a un furto,
      e per farlo bisogna entrare dove abita lui.

      ── A COSA SERVE L'ORCO ──
      È la domanda giusta, e nelle stesure di prima la risposta era «a
      niente»: dormiva dietro una porta chiusa, e lo si evitava **non
      facendo**. Un pericolo che si schiva stando fermi non è un
      pericolo, è un cartello.
      Adesso **fa la ronda**. Il suo giro è scritto nella sua scheda e
      si legge prima di premere ▶ — 🔁 dentro la stanza, poi fuori nel
      covo, e da capo — e appena vede qualcuno gli va addosso. Il covo
      è casa sua: prima o poi ci passa.
      E da lì nasce l'ordine che questo livello esiste per insegnare:
      **gli si chiude la porta**. Non è una gentilezza del gioco, è una
      corsa: lui parte dal fondo della sua stanza, la porta è a sette
      passi da lui e a cinque da lei, e chi arriva prima decide come va
      a finire il resto. Chiusa quella, il covo è vostro e si può
      lavorare con calma.
      Una porta chiusa è un muro **anche per lui**, e questa è la prima
      volta che il giocatore agisce sul mondo invece che su sé stesso —
      l'opposto di indicare punti col dito.

      ── E LE MANI SONO DUE ──
      La roba da riportare a casa è tre — la corona, la spazzola e il
      libro delle favole — e le mani due: **a casa ci si torna due
      volte**. La chiave della gabbia invece sta in tasca e non pesa:
      le cose piccole non occupano una mano, se no ogni livello con una
      serratura diventerebbe un balletto di «posa la chiave».
      È aritmetica, si legge nella scheda («✋ 2 mani») e il rifiuto lo
      dice lei: «ho le mani piene: prima devo posare qualcosa».

      ── UNA BATTAGLIA SOLA, E NON È PIGRIZIA ──
      Le battaglie multiple servono a far cadere un piano che indovina.
      Qui non c'è niente da indovinare: spostare la corona darebbe tre
      volte la stessa prova. Finché non c'è il bivio, una variante che
      non cambia il piano non è una prova — è un'attesa in più. */

import { livello, campo, cose, chi, fai, se, quando, suoli, muri } from '../scrivi.js'

const principessa = chi.nostro('principessa', 'la principessa',
  { corpo: 'principessa', emoji: '👸', vista: 6, vita: 1 })

/* i due capi della sua ronda: non stanno fra i complementi e non si
   disegnano (solo i posti che sono in `vince` compaiono sul campo) —
   servono a lui per girare, non al bambino per puntarli */
const inFondo = cose.posto('inFondo', 'il fondo della stanza')
const angolo = cose.posto('angolo', "l'angolo della stanza")
const nelCovo = cose.posto('nelCovo', 'il covo')

/* ── LA RONDA, E LA REAZIONE CHE ADESSO SCATTA DAVVERO ──
   `reagisce: [quando.vedi(…)]` si poteva scrivere da sempre, compariva
   nella scheda col suo 👁 e **non scattava mai**: `Reazione.riconosce`
   rispondeva solo ai messaggi. Adesso il battito la fa partire
   (`Unita.vedendo`, chiamata da `Partita.passo`), e un orco che «si
   butta su chi vede» finalmente lo fa.
   Quattro passi di vista: dal fondo della sua stanza non arriva alla
   porta, ed è quello che rende la corsa una corsa e non una trappola. */
const orco = chi.orco({ vista: 4, vita: 9,
  /* ── IL GIRO SI DEVE VEDERE CHE È UN GIRO ──
     Con due soli punti, e il primo dentro la stanza, a schermo si
     leggeva come «si è fermato in un angolo»: tre passi e via. Con tre
     punti fa un vero mezzo giro della stanza prima di affacciarsi, e
     nove battiti sono anche la finestra onesta per arrivare alla
     porta — che ne vuole sei. */
  fa: [fai.giro([inFondo, angolo, nelCovo], se.caduto('orco'))],
  reagisce: [quando.vedi('nostri', [fai.attacca('nostri')])] })

/* la casa: il tavolo dove la roba va rimessa e la cesta del gatto. Sono
   le due mete della missione, e per questo si vedono sul campo — tutti
   gli altri posti restano invisibili (`CampoLivello.vue`).
   ── E HANNO UNA FACCIA ──
   Erano due quadrati verdi vuoti, cioè due promesse senza niente
   dentro: «il tavolo di casa» era un rettangolo di prato con un
   contorno tratteggiato. Un posto che ha un nome nella storia è una
   cosa della storia, e `Posto.faccia()` sa già disegnarla — bastava
   dirgli quale (`grafica/oggetti/casa.js`). */
const casa = cose.posto('casa', 'il tavolo di casa', { pittore: 'tavolo' })
const cesta = cose.posto('cesta', 'la cesta del gatto', { pittore: 'cesta' })

/* il gatto le viene dietro appena lo liberi, e quando lei è a casa va a
   rimettersi nella sua cesta. Non occupa mani: si porta da sé. */
const gatto = chi.terzo('gatto', 'il gatto', { corpo: 'gatto', emoji: '🐈', vista: 6, vita: 4,
  schiera: 'casa', schieraNome: 'quelli di casa',
  fa: [fai.ripeti([fai.vai(principessa)], se.qui(principessa, casa)), fai.vai(cesta)] })

/* due pittori scritti apposta: erano un elmo e una bacchetta, e a
   schermo si leggevano come un teschio e un bastoncino — una cosa che
   si chiama in un ordine e si vede diversa da come si chiama è peggio
   di una cosa brutta */
const corona = cose.oggetto('corona', 'la corona', { pittore: 'corona', em: '👑' })
const spazzola = cose.oggetto('spazzola', 'la spazzola', { pittore: 'spazzola', em: '🪮' })
const libro = cose.oggetto('libro', 'il libro delle favole', { pittore: 'libro', em: '📕' })
const chiave = cose.chiave('chiave', 'la chiave della gabbia')
const gabbia = cose.grata('gabbia', 'la gabbia del gatto', { chiave: 'chiave' })
/* la porta della sua stanza: parte APERTA, e `aMano: false` vuol dire
   che camminandoci non si riapre — chiusa una volta, è chiusa. È
   l'unica porta del gioco che si vince chiudendo invece che aprendo. */
const porta = cose.porta('porta', "la porta della stanza dell'orco",
                         { aperta: true, aMano: false })

/* IL COVO — la casa a ponente, il corridoio di sopra che gira largo, la
   stanza del bottino in mezzo, e in basso quella dell'orco, che si apre
   sul passaggio corto. */
/* ── DUE POSTI IN UNA MAPPA SOLA ──
   La storia dice «l'orco è entrato **in casa** e si è portato la roba
   nel suo covo»: sono due luoghi, e vestirli tutti e due con lo stesso
   ambiente li faceva diventare lo stesso posto — una casa scavata
   nella roccia, cupa come la tana. Sbagliato due volte: perché mente
   sulla storia, e perché la stanza dove si vince deve leggersi a colpo
   d'occhio, mentre una scena tutta scura si guarda strizzando gli
   occhi.
   Adesso **la casa si dichiara** — mattonelle per terra, assi alle
   pareti, le colonne di sinistra — e il covo resta all'ambiente. È il
   verso giusto della cosa, e vale come regola: le tinte di un ambiente
   sono tarate per stare insieme, muro contro pavimento compreso, e
   dichiarare tutto a mano vuol dire rifare quella taratura da zero
   ogni volta — la prima prova aveva un covo dove non si capiva più
   dove si potesse camminare. Si dichiara **il pezzo che fa eccezione**,
   non tutta la mappa.
   L'ambiente, intanto, non è più la grotta: era la stessa del livello
   dopo, e la scena veniva buia per atmosfera invece che per un motivo.
   Il buio vero è la lezione del livello dopo, che è l'unico in cui
   serve a qualcosa. */
const COVO = campo([
  '%%|%%|%%|%%|##|##|##|##|##|##',
  '%%|,,|,,|,,|..|..|..|..|##|##',
  '%%|,,|CE|,,|##|CO|LI|##|GT|##',
  '%%|,,|,,|,,|##|NC|CH|SP|GA|##',
  '%%|CA|,,|,,|##|..|..|..|..|##',
  '%%|,,|@@|,,|..|..|..|..|..|##',
  '%%|,,|,,|,,|##|PD|##|##|##|##',
  '%%|,,|,,|,,|##|..|..|..|..|##',
  '%%|,,|,,|,,|##|AN|..|..|..|##',
  '%%|,,|,,|,,|##|..|..|..|..|##',
  '%%|,,|,,|,,|##|OR|..|..|IF|##',
  '%%|%%|%%|%%|##|##|##|##|##|##',
], { '@@': principessa, CA: casa, CE: cesta, GT: gatto, GA: gabbia,
     ',,': suoli.mattonelle(), '%%': muri.legno(),
     CO: corona, LI: libro, SP: spazzola, CH: chiave, PD: porta, OR: orco,
     IF: inFondo, AN: angolo, NC: nelCovo })

export const PRINCIPESSA = livello({
  id: 'parole-principessa', nome: 'Il covo dell\'orco',
  idea: 'Chiudigli la porta prima che esca, e il covo è tuo',
  dritta: 'Obiettivo: <b>la corona, la spazzola e il libro sul tavolo di casa, e il gatto nella sua cesta</b>.',
  racconto: "L'orco è entrato in casa e si è portato via la corona, la spazzola e perfino il gatto, che adesso è in gabbia nel suo covo. <b>Lui fa la ronda</b>: tocca la sua scheda e vedi il giro che fa — dal fondo della stanza al covo e ritorno — e appena vede qualcuno gli va addosso. La porta della sua stanza è aperta, e lui è in fondo. E le mani sono due: la roba da riportare è tre.",
  aiuti: ['Tocca l\'orco: il suo giro è scritto lì, e comincia dal fondo della stanza.',
          'Una porta si può anche chiudere. E una porta chiusa è un muro anche per lui.',
          'Guarda la scheda: ✋ due mani. La chiave, finito il suo mestiere, è un peso.'],
  ambiente: 'miniera', prove: 1,

  scena: COVO,
  scenografia: [
    { che: 'torcia', x: 4, y: 3 }, { che: 'torcia', x: 4, y: 7 },
    { che: 'stalagmite', x: 7, y: 6 }, { che: 'stalagmite', x: 4, y: 9 },
    { che: 'ragnatela', x: 6, y: 4, strato: -1 }, { che: 'ossa', x: 7, y: 8 },
  ],

  complementi: ['corona', 'spazzola', 'libro', 'chiave', 'gabbia', 'porta',
                'casa', 'cesta', 'gatto', 'orchi'],
  verbi: ['vai', 'prendi', 'posa', 'apri', 'chiudi'],
  vince: [se.qui(corona, casa), se.qui(spazzola, casa), se.qui(libro, casa),
          se.qui(gatto, cesta)],
  perde: [se.caduto(principessa)],
  motivoSconfitta: "L'orco è uscito di ronda e l'ha trovata nel covo.",
  mostraNemici: true,

  soluzioni: [
    { nome: 'chiudi la corta, poi fai con calma', piano: { principessa: [
      /* il primo ordine non fa avanzare la missione di un passo, e
         senza di lui la missione non finisce: è una corsa alla porta
         contro uno che sta uscendo di ronda */
      fai.chiudi(porta),
      fai.prendi(chiave), fai.apri(gabbia),
      fai.prendi(corona), fai.prendi(spazzola),
      fai.vai(casa), fai.posa(corona), fai.posa(spazzola),
      fai.prendi(libro), fai.vai(casa), fai.posa(libro),
    ] } },
  ],

  verifiche: {
    /* due cose che l'ordine decide: la chiave prima della gabbia (la
       sequenza del secondo livello), e la porta prima di tutto — chi
       va a prendere la chiave per prima se lo trova addosso */
    ordineConta: [['prendi chiave', 'apri gabbia'],
                  ['chiudi porta', 'prendi chiave']],
  },
})

export default PRINCIPESSA

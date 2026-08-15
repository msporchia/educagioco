/* 1 ─ un ordine solo, e la strada la trova lui. Serve a far vedere la
      forma: verbo + cosa, poi ▶.

      SI APRE, non si prende e non ci si arriva. `apri` cammina da solo
      fino alla cosa e poi la apre, quindi resta un ordine solo — ma
      dal primo livello la parola giusta è quella che dice cosa vuoi,
      non dove vuoi mettere i piedi. `vai` c'è lo stesso, e portarci
      l'eroe accanto non fa vincere: è la prima cosa che si impara
      sbagliando, e costa un ▶.

      ── PERCHÉ APRIRLO E NON PRENDERLO ──
      Un forziere in tasca non ci sta, e il gioco lo diceva lo stesso:
      la cassa spariva dalla mappa e ricompariva aperta per una toppa
      scritta apposta in `CampoLivello.vue`. Aprirlo è più vero e
      insegna di più — perché `apri` è il verbo che dal terzo livello in
      poi vale su un cancello, una botola, la grata di una cuccia, e
      una cosa sola che si dice in quattro posti diversi è il primo
      pezzo di astrazione che questo gioco può dimostrare invece che
      raccontare. E il forziere che si spalanca è il momento più bello
      che la grafica sappia fare: prima si vedeva solo alla fine.

      NIENTE VARIANTI, ED È VOLUTO. Le tre scene servono a far cadere
      un piano che indovina invece di ragionare: qui il piano è «apri
      il tesoro» e non c'è niente da indovinare — spostare il forziere
      darebbe tre volte la stessa prova. Le varianti cominciano dove
      comincia la possibilità di sbagliare. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

/* Chi c'è in questa storia. Si dichiarano qui una volta, e da qui in
   poi si passano — `fai.apri(tesoro)`, non `fai.apri('tesoro')`: un
   refuso diventa un errore subito invece di un ordine che a partita
   avviata non trova niente. */
const eroe = chi.eroe()
const tesoro = cose.forziere()

export const PRIMO = livello({
  id: 'primo', nome: 'Il primo ordine', idea: 'Un verbo, una cosa, e via',
  dritta: 'Obiettivo: <b>il forziere deve essere aperto</b>.',
  racconto: "Camminare lo sa fare da solo: intorno ai muri ci gira senza che glielo dica nessuno. Tu gli dici <b>cosa</b> fare, non come.",
  aiuti: ['Un ordine è fatto di due cose: un verbo, e la cosa su cui vale.',
          'Stare accanto a una cosa non vuol dire averla aperta.',
          "Guarda i verbi che hai: uno ti porta lì e basta, l'altro fa succedere qualcosa."],
  /* ── E QUI SI IMPARA ANCHE DOVE SI TOCCA ──
     È il primo schermo del gioco: prima ancora di «cosa gli dico»
     c'è «dove metto il dito». La riga in fondo lo dice, indica il
     rettangolo tratteggiato, e sparisce al primo ▶ — solo per chi non
     ha mai chiuso un livello. Vedi `guida` in `livelli/livello.js`. */
  guida: true,
  ambiente: 'cortile', prove: 1,

  /* Due corti divise da un muro, con un varco in mezzo. La stanza non ha
     niente da nascondere: la lezione è la forma di un ordine, non la
     mappa — e la strada attorno al muro la trova lui. */
  scena: campo([
    '##|##|##|##|##|##|##|##|##|##|##|##|##',
    '##|..|..|..|..|..|##|..|..|..|..|..|##',
    '##|..|..|..|..|..|##|..|..|..|..|..|##',
    '##|..|..|..|..|..|..|..|..|..|..|..|##',
    '##|..|..|..|..|..|##|..|..|..|..|..|##',
    '##|..|@@|..|..|..|##|..|..|..|T$|..|##',
    '##|##|##|##|##|##|##|##|##|##|##|##|##',
  ], { '@@': eroe, 'T$': tesoro }),

  /* ── LA STANZA HA DELLE COSE DENTRO, E NON SONO IN GIOCO ──
     Il primo livello del gioco era un rettangolo vuoto con due figure
     in mezzo, e un rettangolo vuoto non è un posto. Queste non passano
     dal motore: non si prendono, non si nominano, non compaiono fra i
     bersagli. Servono a far vedere che quello è un cortile.

     ── E NIENTE CHE ABBIA UN COPERCHIO ──
     Casse, botti e barili erano la prima stesura, e sono l'arredo
     sbagliato proprio qui: in un livello che si vince aprendo un
     forziere, una cassa dipinta è un invito falso — la stessa forma,
     lo stesso colore, e non fa niente. La regola che ne esce vale per
     tutta la campagna: **l'arredo non imita mai la cosa da fare**. Chi
     ci sta è quello che nessuno proverebbe ad aprire.

     ── E STA SUI MURI ──
     Un albero o un cespuglio disegnati in mezzo al cortile dicono «di
     qui non si passa», e invece si passa: la scenografia il motore non
     la vede nemmeno. Quindi va dove l'ingombro è vero — sui muri — e
     sul pavimento ci va solo quello che si calpesta. Il banco lo
     controlla (`INGOMBRANTI` in `grafica/oggetti/indice.js`). */
  scenografia: [
    { che: 'albero', x: 3, y: 0 }, { che: 'albero', x: 9, y: 0 },
    { che: 'cespuglio', x: 6, y: 2 }, { che: 'cespuglio', x: 6, y: 4 },
    { che: 'cespuglio', x: 2, y: 6 }, { che: 'cespuglio', x: 10, y: 6 },
  ],

  complementi: ['tesoro'],
  /* ── DUE VERBI, E UNO È LA STRADA SBAGLIATA ──
     `vai` c'è apposta: portarci l'eroe accanto non fa vincere, ed è la
     prima cosa che si impara sbagliando. `apri` è quella giusta. Il
     terzo che compariva — `chiudi`, dedotto dal fatto che un forziere è
     una cosa che si apre — non è una lezione: è una voce in più da
     scartare nel primissimo foglio del gioco, dove le voci sono due e
     si guardano una per una. */
  verbi: ['vai', 'apri'],
  /* ── NIENTE DOMANDE, QUI ──
     Un forziere non genera domande da sé (una porta non si chiede da
     lontano), quindi oggi questa riga non toglie niente — ma la scrive
     lo stesso, perché è la dichiarazione che rende la cosa una scelta
     invece di una coincidenza: nel livello in cui si impara che un
     ordine è un verbo e una cosa, il foglio non offre bivi, cicli né
     azioni. Il giorno che qui dentro entrasse un oggetto da
     raccogliere, «hai il…» comparirebbe da sé senza che nessuno
     l'abbia deciso. */
  condizioni: [],
  vince: [se.aperto(tesoro)],

  soluzioni: [{ nome: 'dritto al forziere', piano: { eroe: [fai.apri(tesoro)] } }],
})

export default PRIMO

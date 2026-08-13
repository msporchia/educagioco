/* 3 ─ IL BIVIO DOPO IL CICLO. Il giro qui non porta a un'azione fissa
      (come «Il giro delle mura», dove trovato l'orco si attacca e
      basta): il giro finisce, e QUELLO CHE HAI TROVATO decide da che
      parte tornare. Le mura fanno un anello attorno a un blocco
      centrale, la torretta sta da un lato, l'eroe parte dall'altro: per
      tornare bisogna girare l'anello, e si può girarlo in due versi.
      Da un verso o dall'altro c'è un pericolo — un orco, debole, o un
      brigante, troppo forte — e finché non sbirci non sai quale.

      NIENTE ANNIDAMENTO PROIBITO, QUI: il bivio sta DOPO il ciclo,
      fianco a fianco nella stessa fila — non dentro, quindi non serve
      nessun `esegui`. È la combinazione più semplice delle quattro:
      il ciclo sbircia da tutti e due i lati, il bivio guarda cos'ha
      trovato e sceglie il verso buono.

      ── PERCHÉ UN ANELLO, E NON UNA STANZA APERTA ──
      In una stanza aperta «torna alla torretta» si vince restando
      fermi (si parte già a due passi) o tagliando dritti (le unità non
      si bloccano a vicenda, quindi passare accanto a un pericolo non
      costa niente da solo). Nell'anello no: le mura in mezzo tolgono
      la scorciatoia, i due versi sono le uniche due strade, e
      **tornare senza aver sbirciato** vuol dire imboccare un verso a
      caso — metà delle volte quello sbagliato.

      ── LA DOMANDA DEL CICLO NON È QUELLA DEL BIVIO ──
      Il giro si ferma appena vede QUALCUNO della schiera «orchi» (un
      fatto generico, «c'è pericolo da questo verso»); il bivio dopo
      chiede SE È PROPRIO L'ORCO (un fatto preciso, «è quello che so
      battere»). Due domande diverse sulla stessa parola «vedi», ed è
      la lezione del livello: fermarsi e capire non sono la stessa
      cosa. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const eroe = chi.nostro('eroe', "l'eroe", { corpo: 'cavaliere', emoji: '🛡️', vista: 4, vita: 8,
  arma: { danno: 2 } })
/* debole ma reattivo: se lo vede attacca, e si batte in tre colpi.
   Lasciarlo in piedi e voltargli le spalle non è gratis — è quello
   che rende necessario colpirlo, e non solo tornare indietro. */
const orco = chi.orco({ vista: 3, vita: 3, arma: { danno: 4 },
  fa: [fai.aspettaDiVedere('eroe'), fai.attacca('eroe')] })
/* troppo forte per essere battuto in scena, e reattivo quanto basta
   perché la mossa buona sia voltargli le spalle SUBITO — non
   continuare per quel verso un istante di più: i suoi colpi
   sono pesanti, e chi resta a tiro non regge a lungo.
   Condivide la schiera «orchi» con l'orco: da lontano, prima di
   riconoscerlo, sono la stessa minaccia. */
const brigante = chi.nemico('brigante', 'il brigante', { corpo: 'goblin', emoji: '👺',
  schiera: 'orchi', schieraNome: 'gli orchi', vista: 4, vita: 999,
  arma: { danno: 6 }, fa: [fai.aspettaDiVedere('eroe'), fai.attacca('eroe')] })

const torretta = cose.posto('torretta', 'la torretta')
const dove = cose.segnaposto()

/* L'ANELLO — un blocco murato al centro, un corridoio tutto intorno.
   La torretta sta al lato nord, l'eroe parte al lato sud: i due archi
   dell'anello (quello a ponente, quello a levante) sono le uniche due
   strade per tornare. `p1`/`p2` sono i due punti da cui si sbircia —
   vicini a casa, ma già abbastanza vicini all'imbocco di ciascun arco
   da vedere chi c'è. `n1`/`n2`, un po' più avanti lungo l'arco, sono
   dove può stare il pericolo.

   `XX` sta in fondo a un corridoio lunghissimo, fuori dall'anello: ci
   sta sempre chi dei due — l'orco o il brigante — non è in scena
   stavolta. Non è scenografia: serve al bivio, che deve poter
   chiedere «è proprio l'orco?» anche nella battaglia in cui l'orco
   non c'è, e una domanda ha bisogno che quello di cui parla esista da
   qualche parte. Deve restare RAGGIUNGIBILE (a piedi, non solo a
   vista): isolato del tutto confonderebbe chi sceglie, in una
   schiera, il bersaglio più vicino. Lungo così, semplicemente non lo
   vede né ci arriva mai nessuno che stia giocando l'anello. */
const RIGA_ANELLO =
  '##|..|..|..|..|..|TT|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|XX|##'
const RIGA_MURO =
  '##|..|##|##|##|##|##|##|##|##|##|..|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##'
const ANELLO = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
  RIGA_ANELLO,
  RIGA_MURO,
  '##|n1|##|##|##|##|##|##|##|##|##|n2|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|p1|##|##|##|##|##|##|##|##|##|p2|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
  RIGA_MURO,
  '##|..|..|..|..|..|EE|..|..|..|..|..|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
], { EE: eroe, TT: torretta, n1: dove, n2: dove, p1: dove, p2: dove, XX: dove })

export const CHI_HAI_TROVATO = livello({
  id: 'giro-chi-hai-trovato', nome: 'Chi hai trovato?',
  idea: "Il giro sbircia da tutti e due i lati: guarda chi c'è, prima di scegliere il verso",
  dritta: "Obiettivo: <b>l'eroe deve tornare vivo alla torretta</b>.",
  racconto: "Su uno dei due versi c'è un pericolo, e <b>chi sia cambia a ogni battaglia</b>: a volte l'orco, che risponde se lo lasci in piedi, a volte il brigante, che nessuno affronta e vive per raccontarlo.",
  aiuti: ["Dai due punti vicino a casa si vede l'imbocco di ciascun arco: sbircia tutti e due prima di partire.",
          "Trovato qualcuno, guarda bene chi è prima di scegliere il verso.",
          "Contro l'orco si vince. Contro il brigante, l'unica mossa buona è tornare sui propri passi subito."],
  ambiente: 'cripta',

  scena: ANELLO,
  celle: true,
  complementi: ['orchi', 'orco', 'torretta'],
  condizioni: [se.vedi('orchi'), se.vedi('orco'), se.nonVedi('orco')],
  verbi: ['vai', 'attacca'],
  vince: [se.qui(eroe, torretta)],
  perde: [se.caduto(eroe)],
  motivoSconfitta: 'Il pericolo trovato lungo la strada ha avuto la meglio.',
  mostraNemici: true,

  /* IL BRIGANTE STA SEMPRE A LEVANTE: non è pigrizia, è quello che
     rende scrivibile il ramo del falso senza un secondo bivio — «da
     che parte torno indietro» non è la domanda di QUESTO livello (lo
     sarebbe di un quinto, più avanti). L'orco invece può stare da
     tutti e due i lati: il giro deve comunque sbircarli entrambi,
     perché finché non hai guardato non sai se è lui o è il brigante. */
  varianti: [
    { nome: "l'orco sull'arco di ponente", metti: { n1: orco, XX: brigante } },
    { nome: "l'orco sull'arco di levante", metti: { n2: orco, XX: brigante } },
    { nome: "il brigante sull'arco di levante", metti: { n2: brigante, XX: orco } },
  ],

  /* IL PAR: il giro (il blocco e i due «vai» per sbirciare) più il
     bivio — tre ordini in ciascun ramo, che «vai» sa fare da solo il
     cammino a più tappe (torna al punto di guardia di ponente, poi
     alla torretta) senza bisogno di dirglielo un passo alla volta. */
  par: 8,
  soluzioni: [
    { nome: "sbircia da tutti e due i lati, poi scegli il verso", piano: { eroe: [
      fai.giro(['1,4', '11,4'], se.vedi('orchi')),
      fai.bivio(se.vedi('orco'),
        [fai.attacca('orco'), fai.vai(torretta)],
        [fai.vai('1,4'), fai.vai(torretta)]),
    ] } },

    /* FRAGILE: attacca chiunque trovi, senza guardare chi è, e prosegue
       sempre dritto per quel verso. Contro l'orco funziona; contro il
       brigante il primo colpo che risponde manda l'eroe a terra. */
    { nome: 'attacca chiunque trovi e prosegui', fragile: true, piano: { eroe: [
      fai.giro(['1,4', '11,4'], se.vedi('orchi')),
      fai.attacca('orchi'),
      fai.vai(torretta),
    ] } },
  ],

  verifiche: { nonInFila: true },
})

export default CHI_HAI_TROVATO

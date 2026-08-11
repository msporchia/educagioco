/* 8 ─ IL TOTEM, cioè il ciclo che CONTA. Il `ripeti` si è già visto al
      giro delle mura, e lì si fermava su una cosa che si vede — «smetti
      quando vedi qualcuno». Qui si ferma su un NUMERO che cresce sul
      campo: le tacche accese sono la variabile resa visibile, non un
      numero astratto ma una cosa che si illumina mentre la premi.

      ── PERCHÉ C'È ANCHE UNA LEVA, E COSTA UN ORDINE SOLO ──
      Perché la differenza fra i due congegni è tutta la lezione, e non
      si vede se ne incontri uno solo. Stesso verbo — `premi`, uno per
      tutti, e cosa succeda lo decide chi lo riceve — e due risposte
      diverse: la leva dice «fatto» e non la tocchi più, il totem dice
      «sono a 1 su 3». Chi ha premuto la leva dieci secondi prima capisce
      da sé che qui sta succedendo qualcosa d'altro.
      È anche il posto dove si impara la regola del mondo che le porte a
      comando si portano dietro: le grate non hanno maniglia. `apri [la
      grata]` resta una mossa scrivibile apposta, e risponde «non si apre
      così: ci vuole un congegno» — che è il modo in cui questa regola si
      impara, cioè sbagliando e leggendo, come `vai [il tesoro]` nella
      prima prova.

      ── QUANTE TACCHE, LO SAI SOLO GIOCANDO ──
      È qui che il livello diventa un livello. Le tre scene cambiano UN
      NUMERO — tre, quattro, cinque tacche — e non spostano una pietra:
      la stanza è identica, quello che cambia è l'unica cosa che il piano
      non può sapere quando lo firmi. Da lì cadono tutte e due le mosse
      naturali: premere tre volte in fila, e anche scrivere il ciclo con
      il numero che hai indovinato («ripeti finché è a tre»), che è
      l'errore più istruttivo dei due — il ciclo è giusto, e si ferma un
      tocco troppo presto.
      Quello che regge è uno solo, e dice la cosa che vale per tutti i
      cicli che scriverà da qui in avanti:

          il giro si ferma su QUELLO CHE VUOI OTTENERE,
          non sul conto che hai tirato a indovinare.

      Le tacche sono il mezzo, la grata che si apre è il risultato. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const eroe = chi.eroe()
const tesoro = cose.tesoro()

/* le due grate sono uguali a vedersi, e quello che le apre no: è il
   paragone, e per questo stanno in fila sulla stessa parete */
const grataTotem = cose.saracinesca('grataTotem', 'la grata del totem', { aMano: false })
const grataTesoro = cose.saracinesca('grataTesoro', 'la grata del tesoro', { aMano: false })

/* il filo lo dichiara il livello; cosa succede quando il comando arriva
   lo decide chi lo riceve — qui non si scrive mai «apre la grata» */
const leva = cose.leva({ collegata: [grataTotem.id] })
/* e il totem è la stessa cosa che conta: quante tacche gli servano è
   l'unico dato che cambia da una scena all'altra */
const totemDa = tacche => cose.totem({ tacche, collegata: [grataTesoro.id] })
const totem = totemDa(3)

/* IL CORRIDOIO E LE DUE NICCHIE — dritto, con due nicchie affacciate e
   la loro grata sotto. La leva sta in un'alcova dalla parte opposta, in
   mezzo alle due: si preme stando in un posto e si apre in un altro,
   che è tutto quello che una leva ha da dire. Una leva appoggiata alla
   sua porta sarebbe una maniglia.

     x=3   il totem, dietro la grata che apre la LEVA
     x=7   il tesoro, dietro la grata che apre il TOTEM */
const CORRIDOIO = [
  '##|##|##|##|##|##|##|##|##|##|##',
  '##|##|##|TT|##|##|##|T$|##|##|##',
  '##|##|##|g1|##|##|##|g2|##|##|##',
  '##|@@|..|..|..|..|..|..|..|..|##',
  '##|##|##|##|##|LV|##|##|##|##|##',
  '##|##|##|##|##|##|##|##|##|##|##',
]

const SALA = campo(CORRIDOIO, {
  '@@': eroe, 'LV': leva, 'TT': totem, 'T$': tesoro,
  'g1': grataTotem, 'g2': grataTesoro,
})

export const TOTEM = livello({
  id: 'totem', nome: 'Il totem',
  idea: 'Il giro si ferma su quello che vuoi, non sul conto',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>. Le grate non si aprono spingendole.",
  racconto: "Due congegni, e si premono tutti e due allo stesso modo. La leva scatta e non la tocchi più; il totem conta, e <b>quante tacche gli servano cambia a ogni battaglia</b>.",
  aiuti: ['I congegni si toccano come tutto il resto, e la loro scheda dice cosa fanno.',
          'Il totem non scatta al primo tocco: guarda quante tacche gli mancano mentre lo premi.',
          'Non sai quante tacche avrà. Fermati quando la grata si apre, non quando hai finito di contare.'],
  ambiente: 'ingranaggi',

  scena: SALA,

  /* LE GRATE SONO NOMINABILI APPOSTA: `apri [la grata]` deve essere
     scrivibile, perché è la mossa che insegna la regola, e costa un ▶
     come `vai [il tesoro]` nella prima prova. */
  complementi: ['leva', 'totem', 'grataTotem', 'grataTesoro', 'tesoro'],
  verbi: ['vai', 'prendi', 'apri', 'premi'],
  /* le due domande fra cui si sceglie l'uscita del giro, e sono
     esattamente le due della lezione: il conto, o il risultato */
  condizioni: [se.almeno(totem, 3), se.aperto(grataTesoro)],

  vince: [se.ha(eroe, tesoro)],

  /* TRE SCENE CHE CAMBIANO UN NUMERO, e non una pietra. `metti` non
     ridisegna la stanza: rimpiazza una voce della legenda, e qui la
     voce è il totem con quante tacche gli servono. È l'unica cosa che
     il piano non può sapere quando lo firmi. */
  varianti: [
    { nome: 'tre tacche', metti: { TT: totemDa(3) } },
    { nome: 'quattro tacche', metti: { TT: totemDa(4) } },
    { nome: 'cinque tacche', metti: { TT: totemDa(5) } },
  ],

  par: 4,
  soluzioni: [
    /* QUATTRO ORDINI: la leva, il giro (che ne conta uno) col suo
       `premi` dentro (un altro), e il tesoro. L'uscita guarda LA GRATA,
       non le tacche — ed è l'unica cosa che regge su tutte e tre le
       scene. Togliendone uno qualsiasi si perde: senza la leva non si
       arriva nemmeno al totem, senza il giro la grata del tesoro resta
       chiusa, senza l'ultimo ordine il tesoro resta per terra. */
    { nome: 'premi finché si apre', piano: { eroe: [
      fai.premi(leva),
      fai.ripeti([fai.premi(totem)], se.aperto(grataTesoro)),
      fai.prendi(tesoro),
    ] } },

    /* FRAGILE, E LA PIÙ ONESTA DELLE DUE: il ciclo scritto giusto, con
       dentro il numero indovinato. Vince la scena da tre tacche e si
       ferma un tocco troppo presto nelle altre due — il giro finisce, la
       grata no, e si resta davanti a una saracinesca chiusa. È l'errore
       che questo livello esiste per far fare. */
    { nome: 'ripeti finché è a tre', fragile: true, piano: { eroe: [
      fai.premi(leva),
      fai.ripeti([fai.premi(totem)], se.almeno(totem, 3)),
      fai.prendi(tesoro),
    ] } },

    /* FRAGILE: la mossa di chi il ciclo non lo scrive affatto — tre
       tocchi in fila, contati a mano. Vince la prima scena, costa un
       ordine più del par, e nelle altre due lascia il totem a metà. */
    { nome: 'tre tocchi contati a mano', fragile: true, piano: { eroe: [
      fai.premi(leva),
      fai.premi(totem), fai.premi(totem), fai.premi(totem),
      fai.prendi(tesoro),
    ] } },
  ],

  verifiche: {
    /* chi mette `prendi` in cima si pianta davanti a una grata chiusa e
       non riparte più: la strada non si apre da sé */
    ordineConta: [['premi leva', 'prendi tesoro']],
  },
})

export default TOTEM

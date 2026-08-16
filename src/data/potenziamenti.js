/* ═══════════════════════════════════════════════════════════════════
   I GETTONI DELL'ASTRONAVE — si guadagnano giocando, si spendono quando
   si vuole, e finiscono con la partita.

   PRIMA ERANO POTENZIAMENTI CHE SI ACCENDEVANO DA SOLI (il cannone
   doppio col filotto, lo scudo col boss). Il difetto non era la potenza:
   era che arrivavano e se ne andavano senza che nessuno avesse deciso
   niente. Un premio che si accende da solo mentre stai guardando in alto
   è un lampo giallo, non un premio — e uno che si perde da solo quando
   sbagli è una seconda punizione sopra a quella che c'è già.

   Adesso sono **gettoni che si tengono in tasca**. Si guadagnano con il
   filotto, anche a metà tappa, compaiono in basso a destra con la loro
   icona e restano lì finché non li si preme. Quello che cambia davvero è
   che il bambino decide *quando*: guardare il cielo, capire che questa
   domanda non ce la fa, e spendere il gelo è un pensiero suo — con i
   potenziamenti automatici non c'era niente da pensare.

   LA REGOLA CHE LI TIENE IN RIGA È CAMBIATA, E VA DETTO. Prima era
   «nessun potenziamento tocca la domanda»; il mirino la tocca, perché
   toglie una risposta sbagliata dal cielo. Regge lo stesso, per due
   ragioni che vanno tenute insieme: il gettone **si paga in anticipo**
   con cinque risposte giuste di fila — non lo regala nessuno — e con
   quattro o sei sassi in cielo toglierne uno sbagliato lascia il calcolo
   da fare. Quello che non deve succedere, e non succede, è che un aiuto
   *indichi* la risposta giusta: si porta via una sbagliata a caso, e chi
   guarda impara che il conto va fatto comunque.

   Nessuna moneta, nessun negozio: le monete sono la valuta della
   cameretta e un hangar che le succhia sposterebbe l'equilibrio di un
   gioco che non c'entra niente. Qui si paga con le risposte giuste.
   ═══════════════════════════════════════════════════════════════════ */

export const POTENZIAMENTI = {
  /* Il gelo. Non toglie niente dal cielo: dà tempo. È il gettone da
     spendere quando la domanda è di quelle che si sanno ma non a
     memoria, e serve un momento per farle.

     DURA UNA DOMANDA, NON DIECI SECONDI. Era a tempo, ed era sbagliato
     per due ragioni. La prima si vede giocando: dieci secondi coprono
     due o tre domande, quindi il gettone si spendeva su *una* e il
     regalo cadeva anche sulle altre, comprese quelle che si sapevano —
     e un premio che continua da solo dopo che è servito non insegna
     niente. La seconda non si vede ed è peggio: col cielo lento il
     tempo di risposta non si può segnare, e a tempo se ne perdevano
     tre invece di uno, cioè si buttavano via tre misure dell'SRS per
     un gettone. Legandolo alla domanda si paga esattamente quello che
     si è comprato: questa qui, non le prossime. */
  gelo: {
    emoji: '❄️', nome: 'Gelo', colore: '#9fd8ff',
    grido: '❄️ GELO!',
    spiega: 'Congela la domanda che hai adesso: i sassi rallentano e hai tutto il tempo di fare il conto. Dalla domanda dopo il cielo riparte.',
    lento: 0.42,
  },
  /* Il mirino. Fa sparire **una risposta sbagliata**, scelta a caso fra
     quelle in cielo: non indica la giusta e non fa il conto: toglie di
     mezzo un sasso e lascia gli altri. */
  mirino: {
    emoji: '🎯', nome: 'Mirino', colore: '#8cff9d',
    grido: '🎯 MIRINO!',
    spiega: 'Fa sparire una risposta sbagliata. Non ti dice qual è quella giusta: il conto lo fai tu, ma con un sasso in meno.',
  },
}

/* Quanti se ne tengono in tasca. Tre: oltre, il filotto lungo diventa un
   magazzino e la fine della tappa si gioca a gettoni invece che a conti. */
export const TASCA_MAX = 3

/* ─────────── il filotto ───────────
   Cinque di fila un gettone, dieci una vita (era già così e resta), poi
   si ricomincia: quindici un gettone, venti la vita. Le soglie sono
   basse apposta — un premio che arriva una volta a partita non è un
   premio, è una leggenda. */
export function premioDaSerie(serie, ogniVita = 10) {
  if (serie > 0 && serie % ogniVita === 0) return 'vita'
  if (serie > 0 && serie % 5 === 0) return 'gettone'
  return null
}

/* Quale gettone tocca: **quello che non è uscito per ultimo**, da
   qualunque parte arrivi — il filotto o il boss. Si comincia dal gelo.

   Prima l'alternanza era calcolata sulla serie (cinque di fila il gelo,
   quindici il mirino) e il boss dava sempre il gelo. Sulla carta erano
   due poteri; giocando ne usciva uno solo, e la ragione è aritmetica:
   una tappa si chiude sui quindici centri, quindi il filotto da quindici
   arriva solo a chi non sbaglia mai, e nel frattempo il boss aveva già
   riempito la tasca di gelo. Metà del gioco esisteva soltanto nel
   codice.

   Contando invece le *uscite* — questa è la prima, questa è la seconda —
   i due si alternano davvero: gelo alla prima cinquina, mirino al primo
   boss, e da lì avanti uno e uno. */
export const gettoneDopo = ultimo => (ultimo === 'gelo' ? 'mirino' : 'gelo')

/* ─────────── l'ultima vita ───────────
   Chi è rimasto con una vita sola sta quasi sempre sbagliando perché non
   fa in tempo, non perché non sa: il cielo rallenta di un quarto e la
   nave accende le luci rosse. Non è un premio, è il contrario — ma è la
   differenza fra chiudere la partita imparando qualcosa e chiuderla e
   basta. Non si annuncia con un cartello: si vede dalla nave. */
export const EMERGENZA = { sotto: 1, tempo: 1.25 }

/* ═══════════════════════════════════════════════════════════════════
   LA CORSA DEI NUMERI — IL MANIFESTO

   La carta d'identità del gioco: chi è, come si chiama, dove è arrivato
   chi ci gioca. È **dato puro** — non importa Vue, non importa il
   profilo, non importa nemmeno il proprio `Gioco.vue` — perché la home e
   la schermata dei genitori hanno bisogno di sapere che questo gioco
   esiste e passano dallo store: se il manifesto si tirasse dietro lo
   store si chiuderebbe un anello di `import` che si rompe un lunedì
   mattina senza motivo.

   La schermata sta a parte, in `src/giochi/schermate.js`.

   ── IN PROVA ─────────────────────────────────────────────────────
   `sperimentale: true` non è un interruttore in più, è un **cancello**:
   finché c'è, la carta non compare in home per nessuno, a meno che nella
   schermata dei genitori non sia acceso «giochi in prova». Il giorno che
   il gioco è finito si toglie questa riga, e da quel momento è un gioco
   come gli altri.

   Struttura della cartella (vedi `src/giochi/CONVENZIONE.md`):

     dati/    tabelle: gradi della truppa, vestiti, tappe
     motore/  le regole, senza schermo — girano anche in Node
     scena/   il canvas e il battito, che di regole non sanno niente
     viste/   un componente per schermata
     Gioco.vue  il coordinatore, l'unico che sa di monete e domande
   ═══════════════════════════════════════════════════════════════════ */
import { CAMPAGNA, QUANTE_TAPPE } from './dati/campagna.js'

export const CHIAVE = 'corsa'

export default {
  chiave: CHIAVE,
  nome: 'La corsa dei numeri',
  icona: '🏃',
  che: 'far crescere la truppa scegliendo il cancello giusto',
  area: 'numeri',
  come: 'riflessi',
  tappe: QUANTE_TAPPE,
  sperimentale: true,
  tinta: '#ffe8cf',

  /* La riga che la home mostra sotto il nome. La scrive il gioco perché è
     il gioco a sapere cosa vuol dire il suo avanzamento. Riceve il record
     (`src/giochi/campagne.js`) e non se lo va a prendere: così resta una
     funzione e si può provare. */
  riassunto(av = { tappa: 0, libera: false, stelle: {}, cfg: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    if (av.libera) {
      const primato = (av.cfg || {}).primato
      return primato ? `corsa infinita · primato ${primato} m${coda}`
                     : `corsa infinita ♾️${coda}`
    }
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

  /* ═══════════ quello che il gioco porta all'albo ═══════════
     Un gioco si presenta da solo: la sua famiglia di traguardi, quanto
     vale in esperienza, e come si capisce che è stato provato. Chi
     raccoglie è `src/giochi/albo.js`, e né `data/traguardi.js` né
     `store/progressi.js` sanno che questo gioco esiste.

     I contatori li muove `Gioco.vue` con `segna()`/`segnaBest()`:
       corsaPartite    corse finite, vinte o no
       corsaTappe      tappe portate a casa
       corsaMostri     mostri abbattuti prima dell'impatto
       corsaCancelli   cancelli attraversati in tutto
       corsaLibri      esercizi del cancello d'oro indovinati
       corsaTruppa     (primato) la truppa più grossa in una corsa
       corsaMetri      (primato) i metri più lontani in una corsa      */
  albo: {
    area: { nome: 'La corsa', emoji: '🏃' },

    /* L'unità di lavoro qui è **il cancello letto**: un conto a mente per
       ognuno, e una corsa ne porta una decina. L'esercizio del cancello
       d'oro vale di più perché è quello che nessuno è obbligato a fare. */
    xp: m => m.tot('corsaCancelli') + m.tot('corsaLibri') * 4 +
             m.stelleDi(CHIAVE) * 5 + m.tappeDi(CHIAVE) * 40,
    provato: m => m.tot('corsaPartite') > 0,

    traguardi: [
      { id: 'cor-cancelli', emoji: '🚪', nome: 'Uno alla volta',
        come: n => `Attraversa ${n} cancelli`,
        soglie: [50, 400, 2000], valore: m => m.tot('corsaCancelli') },
      { id: 'cor-tappe', emoji: '🗺️', nome: 'Di sentiero in sentiero',
        come: n => n === 1 ? 'Supera la prima tappa della corsa'
                           : `Supera ${n} tappe della corsa`,
        soglie: [1, 5, QUANTE_TAPPE], valore: m => m.tappeDi(CHIAVE) },
      /* le stelle sono la somma dei primati per tappa: rigiocarne una già
         fatta non ne aggiunge, e la terza si prende solo leggendo i
         cancelli invece di indovinarli */
      { id: 'cor-stelle', emoji: '⭐', nome: 'Occhio ai numeri',
        come: n => `Raccogli ${n} stelle alla corsa`,
        soglie: [6, 15, QUANTE_TAPPE * 3], valore: m => m.stelleDi(CHIAVE) },
      { id: 'cor-truppa', emoji: '🎖️', nome: 'Truppa piena',
        come: n => `Arriva a ${n} soldati in una corsa sola`,
        soglie: [24, 124, 624], valore: m => m.best('corsaTruppa') },
      { id: 'cor-mostri', emoji: '👾', nome: 'Abbattuti in volata',
        come: n => `Abbatti ${n} mostri prima che ti arrivino addosso`,
        soglie: [10, 60, 250], valore: m => m.tot('corsaMostri') },
      /* quello che premia chi si ferma a studiare pur non dovendo: il
         cancello d'oro non è mai obbligatorio, e questo conta solo gli
         esercizi indovinati */
      { id: 'cor-libri', emoji: '📚', nome: 'Chi si ferma a pensare',
        come: n => `Indovina ${n} esercizi del cancello d'oro`,
        soglie: [5, 30, 120], valore: m => m.tot('corsaLibri') },
      { id: 'cor-campagna', emoji: '🏁', nome: 'Arrivato in cima',
        come: () => 'Finisci tutte le tappe della corsa',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}

/* ═══════════════════════════════════════════════════════════════════
   SURVIVORS — IL MANIFESTO

   La carta d'identità del gioco: chi è, come si chiama, dove è arrivato
   chi ci gioca. È **dato puro** — non importa Vue, non importa il
   profilo, non importa nemmeno il proprio `Gioco.vue` — perché la home e
   la schermata dei genitori hanno bisogno di sapere che questo gioco
   esiste, e passano dallo store: se il manifesto si tirasse dietro lo
   store si chiuderebbe un anello di `import` che si rompe un lunedì
   mattina senza motivo.

   La schermata sta a parte, in `src/giochi/schermate.js`.

   Struttura della cartella (vedi `src/giochi/CONVENZIONE.md`):

     dati/    tabelle: tappe, mazzo delle carte, mostri, scenari, taratura
     motore/  le regole, a classi, senza schermo — girano anche in Node
     scena/   il canvas e il battito, che di regole non sanno niente
     viste/   un componente per schermata
     Gioco.vue  il coordinatore, l'unico che sa di monete e domande
   ═══════════════════════════════════════════════════════════════════ */
import { CAMPAGNA, QUANTE_TAPPE } from './dati/campagna.js'

export const CHIAVE = 'survivors'

export default {
  chiave: CHIAVE,
  nome: 'Survivors',
  icona: '🏹',
  che: 'schivare i mostri e scegliere i potenziamenti',
  area: 'avventure',
  come: 'riflessi',
  tappe: QUANTE_TAPPE,
  /* il colore della carta in home: se lo porta il gioco, così aggiungerne
     uno non vuol dire aggiungere una riga al foglio di stile della home */
  tinta: '#dff0d8',

  /* La riga che la home mostra sotto il nome. La scrive il gioco perché è
     il gioco a sapere cosa vuol dire il suo avanzamento. Riceve il record
     (`src/giochi/campagne.js`) e non se lo va a prendere: così resta una
     funzione e si può provare. */
  riassunto(av = { tappa: 0, libera: false, stelle: {}, cfg: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    if (av.libera) {
      const primato = (av.cfg || {}).primato
      return primato ? `sopravvivenza · primato ${primato}s${coda}`
                     : `sopravvivenza ♾️${coda}`
    }
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

  /* ═══════════ quello che il gioco porta all'albo ═══════════
     Un gioco si presenta da solo: la sua famiglia di traguardi, quanto
     vale in esperienza, e come si capisce che è stato provato. Chi
     raccoglie è `src/giochi/albo.js`, e né `data/traguardi.js` né
     `store/progressi.js` sanno che questo gioco esiste.

     Le misure sono quelle di tutti (`m.tot`, `m.best`) più le tre che
     ogni campagna ha per forza — `m.tappeDi`, `m.stelleDi`, `m.finita`.

     I contatori li muove `Gioco.vue` con `segna()`/`segnaBest()`:
       survivorsPartite   partite finite, vinte o no
       survivorsTappe     tappe portate a casa
       survivorsMostri    mostri abbattuti in tutto
       survivorsCarte     carte prese (una per salita di livello)
       survivorsToste     carte forti prese **rispondendo giusto**
       survivorsLivello   (primato) il livello più alto in una partita
       survivorsTempo     (primato) secondi resistiti nel gioco libero   */
  albo: {
    area: { nome: 'Survivors', emoji: '🏹' },

    /* L'unità di lavoro qui è la domanda pagata per una carta: una
       partita ne vale cinque o sei. Le carte toste valgono il doppio,
       perché il punto del gioco è che qualcuno le scelga. */
    xp: m => m.tot('survivorsCarte') * 2 + m.tot('survivorsToste') * 2 +
             m.stelleDi(CHIAVE) * 5 + m.tappeDi(CHIAVE) * 40,
    provato: m => m.tot('survivorsPartite') > 0,

    traguardi: [
      { id: 'sur-mostri', emoji: '💀', nome: 'Sterminamostri',
        come: n => `Abbatti ${n} mostri`,
        soglie: [100, 800, 4000], valore: m => m.tot('survivorsMostri') },
      { id: 'sur-tappe', emoji: '🗺️', nome: 'Di prato in prato',
        come: n => n === 1 ? 'Supera la prima tappa di Survivors'
                           : `Supera ${n} tappe di Survivors`,
        soglie: [1, 5, QUANTE_TAPPE], valore: m => m.tappeDi(CHIAVE) },
      /* le stelle sono la somma dei primati per tappa: rigiocarne una già
         fatta non ne aggiunge, e tre stelle vogliono dire zero ferite */
      { id: 'sur-stelle', emoji: '⭐', nome: 'Senza un graffio',
        come: n => `Raccogli ${n} stelle a Survivors`,
        soglie: [6, 15, QUANTE_TAPPE * 3], valore: m => m.stelleDi(CHIAVE) },
      { id: 'sur-livello', emoji: '📈', nome: 'Cresciuto bene',
        come: n => `Arriva al livello ${n} in una partita sola`,
        soglie: [6, 9, 12], valore: m => m.best('survivorsLivello') },
      /* quello che premia chi osa: la carta forte costa la domanda tosta,
         e questo conta solo quelle prese rispondendo giusto */
      { id: 'sur-toste', emoji: '🧠', nome: 'Chi non risica',
        come: n => `Prendi ${n} carte forti rispondendo giusto`,
        soglie: [5, 30, 120], valore: m => m.tot('survivorsToste') },
      { id: 'sur-campagna', emoji: '🏁', nome: 'Sopravvissuto',
        come: () => 'Finisci tutte le tappe di Survivors',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}

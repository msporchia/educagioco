/* ═══════════════════════════════════════════════════════════════════
   PRIMA E DOPO — IL MANIFESTO

   La carta d'identità del gioco, dato puro come `codice-segreto/gioco.js`
   spiega. Struttura della cartella, il calco è sempre quello:

     dati/    tabelle e basta: le storie, i verbi, le tappe
     motore/  le regole, a classi, senza schermo — girano anche in Node
     viste/   un componente per schermata
     Gioco.vue  il coordinatore, l'unico che sa che esistono le monete

   Questo gioco insegna la sequenzialità temporale e il rapporto causa-
   effetto: rimettere in fila il seme, il germoglio, il fiore. È lo
   stesso ragionamento che «Il Generale» chiede cinque anni più tardi
   con gli ordini in fila — qui arriva prima, senza leggere una riga.
   ═══════════════════════════════════════════════════════════════════ */
import { CAMPAGNA, QUANTE_TAPPE } from './dati/campagna.js'

export const CHIAVE = 'prima'

export default {
  chiave: CHIAVE,
  nome: 'Prima e dopo',
  icona: '⏭️',
  che: 'rimettere in fila una storia',
  area: 'logica',
  come: 'pensare',
  tappe: QUANTE_TAPPE,
  tinta: '#e7f5e0',

  /* Per la home dei piccoli: un gioco che si dichiara pensato per i
     quattro-sei anni, niente testo da leggere per giocarlo. La home dei
     piccoli non esiste ancora — questo campo è solo la dichiarazione. */
  piccoli: true,

  /* La riga sotto il nome, in home. Riceve il record dell'avanzamento
     (`src/giochi/campagne.js`) e non se lo va a prendere da solo. */
  riassunto(av = { tappa: 0, stelle: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    if ((av.tappa || 0) >= QUANTE_TAPPE) return `tutte le storie in ordine${coda}`
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

  /* ═══════════ quello che il gioco porta all'albo ═══════════
     I contatori li muove `Gioco.vue` con `segna()`/`segnaBest()`:
       storie        storie rimesse in fila, giuste alla fine
       storieTappe   tappe portate a casa
       serieStorie   (primato) storie filate senza un errore, di fila */
  albo: {
    area: { nome: 'Prima e dopo', emoji: '⏭️' },

    xp: m => m.tot('storie') * 2 + m.stelleDi(CHIAVE) * 4 + m.tappeDi(CHIAVE) * 35,
    provato: m => m.tot('storie') > 0,

    traguardi: [
      { id: 'pd-storie', emoji: '📖', nome: 'Cantastorie',
        come: n => `Rimetti in fila ${n} storie`,
        soglie: [10, 60, 200], valore: m => m.tot('storie') },
      { id: 'pd-tappe', emoji: '🗓️', nome: 'Passo dopo passo',
        come: n => n === 1 ? 'Supera la prima tappa di Prima e dopo'
                           : `Supera ${n} tappe di Prima e dopo`,
        soglie: [1, 5, QUANTE_TAPPE], valore: m => m.tappeDi(CHIAVE) },
      { id: 'pd-stelle', emoji: '⭐', nome: 'Tutto al suo posto',
        come: n => `Raccogli ${n} stelle`,
        soglie: [6, 15, QUANTE_TAPPE * 3], valore: m => m.stelleDi(CHIAVE) },
      /* la storia si riprova sempre finché non viene giusta: questo
         traguardo dice quando comincia a venire giusta la prima volta */
      { id: 'pd-serie', emoji: '🔥', nome: "Una dopo l'altra",
        come: n => `Rimetti in fila ${n} storie di seguito senza sbagliare`,
        soglie: [5, 10, 20], valore: m => m.best('serieStorie') },
      { id: 'pd-campagna', emoji: '🏁', nome: 'Il libro è finito',
        come: () => 'Finisci tutte le tappe di Prima e dopo',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}

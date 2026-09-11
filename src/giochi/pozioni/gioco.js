/* ═══════════════════════════════════════════════════════════════════
   IL LABORATORIO DELLE POZIONI — IL MANIFESTO

   Dato puro, come vuole `src/giochi/CONVENZIONE.md`: non importa Vue,
   non importa il profilo. La schermata sta in `src/giochi/schermate.js`.

   La chiave resta `pozioni`, la stessa del gioco vecchio: è quella con
   cui i genitori l'hanno acceso o spento, e quella dei saperi che il
   gioco esige. L'avanzamento invece riparte da capo in
   `profile.campagne.pozioni` — la campagna è un'altra, e un indice
   scritto sulla fila vecchia non direbbe niente su questa.
   ═══════════════════════════════════════════════════════════════════ */
import { CAMPAGNA, QUANTE_TAPPE } from './dati/campagna.js'
import { FAMIGLIE } from './dati/misure.js'

export const CHIAVE = 'pozioni'

/* le coppie di unità che il gioco può chiedere, nei due versi: sono
   gli elementi che il motore di apprendimento segue (`pozioni:kg-g`) */
export const CONVERSIONI = FAMIGLIE.flatMap(f => {
  const u = Object.values(f.unita)
  return u.flatMap(a => u.filter(b => b !== a).map(b => `${a}-${b}`))
})

export default {
  chiave: CHIAVE,
  nome: 'Il laboratorio delle pozioni',
  icona: '⚗️',
  che: 'litri, chili e metri',
  area: 'numeri',
  come: 'fare',
  tappe: QUANTE_TAPPE,
  tinta: '#e9e0f7',
  /* dà per scontato che si legga da soli una ricetta e che le misure
     siano cominciate a scuola */
  grandi: true,
  /* senza le misure e le conversioni non è difficile: è impossibile.
     La carta non si accende, e la schermata dei grandi dice perché. */
  serve: ['misure', 'conversioni'],

  riassunto(av = { tappa: 0, libera: false, stelle: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    if (av.libera) return `maestro alchimista 🏆${coda}`
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

  /* I contatori li muove `Gioco.vue`:
       misure            dosi azzeccate
       pozioni           pozioni consegnate
       pozioniPerfette   consegnate senza uno sbaglio
     Sono gli stessi nomi del gioco vecchio, così quello che un bambino
     aveva già fatto non torna a zero nell'albo. Gli id dei traguardi
     che dicono la stessa cosa di prima restano quelli. */
  albo: {
    area: { nome: 'Il laboratorio delle pozioni', emoji: '⚗️' },
    xp: m => m.tot('misure') + m.tot('pozioni') * 3 + m.tot('pozioniPerfette') * 2
             + m.imparati('pozioni:') * 10 + m.tappeDi(CHIAVE) * 40,
    provato: m => m.tot('misure') > 0 || m.tot('pozioni') > 0,
    materia: { prefisso: 'pozioni:', nome: 'Misure e conversioni', emoji: '⚗️',
               totale: CONVERSIONI.length },
    traguardi: [
      { id: 'poz-pozioni', emoji: '🧪', nome: 'Alchimista',
        come: n => `Prepara ${n} pozioni`,
        soglie: [10, 50, 200], valore: m => m.tot('pozioni') },
      { id: 'poz-perfette', emoji: '✨', nome: 'Mano ferma',
        come: n => `Prepara ${n} pozioni senza un errore`,
        soglie: [5, 30, 120], valore: m => m.tot('pozioniPerfette') },
      { id: 'poz-misure', emoji: '🪜', nome: 'La scala delle misure',
        come: n => `Impara ${n} conversioni`,
        soglie: [3, 8, 15], valore: m => m.imparati('pozioni:') },
      { id: 'poz-tappe', emoji: '🗺️', nome: 'Il laboratorio',
        come: n => n === 1 ? 'Supera la prima tappa del laboratorio'
                           : n === QUANTE_TAPPE ? `Finisci tutte e ${QUANTE_TAPPE} le tappe`
                           : `Supera ${n} tappe del laboratorio`,
        soglie: [1, 9, QUANTE_TAPPE], valore: m => m.tappeDi(CHIAVE) },
      { id: 'poz-stelle', emoji: '⭐', nome: 'Dosi precise',
        come: n => `Raccogli ${n} stelle al laboratorio`,
        soglie: [9, 30, QUANTE_TAPPE * 3], valore: m => m.stelleDi(CHIAVE) },
      { id: 'poz-maestro', emoji: '🏆', nome: 'Maestro alchimista',
        come: () => 'Finisci la campagna del laboratorio',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}

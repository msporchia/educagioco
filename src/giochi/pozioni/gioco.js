// Il manifesto: dato puro. Le regole del laboratorio in docs/pozioni/regole.md.
import { CAMPAGNA, QUANTE_TAPPE } from './dati/campagna.js'
import { FAMIGLIE } from './dati/misure.js'

export const CHIAVE = 'pozioni'

// Le coppie di unità che il gioco può chiedere, nei due versi: sono
// quello che segue il motore di apprendimento (`pozioni:kg-g`).
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
  copertina: { fondo: '#7d5bb5', disegno: '#9e80d1', scena: 'bolle' },
  tappe: QUANTE_TAPPE,
  grandi: true,
  serve: ['misure', 'conversioni'],

  riassunto(av = { tappa: 0, libera: false, stelle: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    if (av.libera) return `maestro alchimista 🏆${coda}`
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

  // I contatori (misure, pozioni, pozioniPerfette) e gli id dei traguardi
  // sono quelli del gioco vecchio, così l'albo non torna a zero.
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

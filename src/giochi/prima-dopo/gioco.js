// Il manifesto: dato puro. Struttura della cartella e convenzione dei
// giochi nuovi in docs/core/convenzione-giochi.md.
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
  piccoli: true,

  riassunto(av = { tappa: 0, stelle: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    if ((av.tappa || 0) >= QUANTE_TAPPE) return `tutte le storie in ordine${coda}`
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

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
      { id: 'pd-serie', emoji: '🔥', nome: "Una dopo l'altra",
        come: n => `Rimetti in fila ${n} storie di seguito senza sbagliare`,
        soglie: [5, 10, 20], valore: m => m.best('serieStorie') },
      { id: 'pd-campagna', emoji: '🏁', nome: 'Il libro è finito',
        come: () => 'Finisci tutte le tappe di Prima e dopo',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}

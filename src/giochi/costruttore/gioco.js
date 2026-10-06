// Il manifesto del costruttore. Vedi docs/costruttore/presentazione.md.
import { CAMPAGNA, QUANTE_TAPPE } from './dati/campagna.js'

export const CHIAVE = 'costruttore'

export default {
  chiave: CHIAVE,
  nome: 'Il costruttore',
  icona: '🏗️',
  che: 'programmare con funzioni e variabili',
  area: 'logica',
  come: 'pensare',
  copertina: { fondo: '#f6b93b', disegno: '#d9952a', scena: 'mattoni' },
  tappe: QUANTE_TAPPE,
  grandi: true,
  perMerito: true, // vedi docs/costruttore/campagna.md

  riassunto(av = { tappa: 0, stelle: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    if ((av.tappa || 0) >= QUANTE_TAPPE) return `tutti i cantieri finiti${coda}`
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    return `livello ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

  // coMattoni: mattoni posati in qualunque prova, sommato da Gioco.vue con segna()
  albo: {
    area: { nome: 'Il costruttore', emoji: '🏗️' },

    xp: m => m.tappeDi(CHIAVE) * 40 + m.stelleDi(CHIAVE) * 10 + Math.floor(m.tot('coMattoni') / 20),
    provato: m => m.tot('coMattoni') > 0 || m.tappeDi(CHIAVE) > 0,

    traguardi: [
      { id: 'co-livelli', emoji: '🏗️', nome: 'Capomastro',
        come: n => n === 1 ? 'Finisci il primo livello del costruttore'
                           : `Finisci ${n} livelli del costruttore`,
        soglie: [1, 6, QUANTE_TAPPE], valore: m => m.tappeDi(CHIAVE) },
      { id: 'co-stelle', emoji: '⭐', nome: 'Tutto da solo',
        come: n => `Raccogli ${n} stelle nel costruttore`,
        soglie: [5, 14, QUANTE_TAPPE * 2], valore: m => m.stelleDi(CHIAVE) },
      { id: 'co-mattoni', emoji: '🧱', nome: 'Mille mattoni',
        come: n => `Fai posare al robot ${n} mattoni`,
        soglie: [100, 1000, 5000], valore: m => m.tot('coMattoni') },
      { id: 'co-fine', emoji: '🏁', nome: 'Il cantiere è finito',
        come: () => 'Finisci tutti i livelli del costruttore',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}

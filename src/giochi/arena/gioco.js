// Il manifesto: dato puro, non importa Vue né il profilo. Struttura della
// cartella e convenzione dei giochi nuovi in docs/core/convenzione-giochi.md.
import { CAMPAGNA, QUANTE_TAPPE } from './dati/campagna.js'

export const CHIAVE = 'arena'

export default {
  chiave: CHIAVE,
  nome: 'Castle Battle',
  icona: '⚔️',
  che: 'costruire caserme e battere il nemico coi calcoli',
  area: 'numeri',
  come: 'strategia',
  copertina: { fondo: '#3b4d7a', disegno: '#2c3a5e', scena: 'mura' },
  // le domande passano da src/quiz/ (il modulo `conti`), tagliate dall'età
  quiz: true,
  tappe: QUANTE_TAPPE,

  riassunto(av = { tappa: 0, stelle: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

  // I contatori (segna()/segnaBest() in Gioco.vue): arenaPartite,
  // arenaCalcoli (giusti, uno per scelta), arenaCaserme (costruite e potenziate),
  // arenaSenzaGraffi (tappe vinte a tre stelle).
  albo: {
    area: { nome: 'Castle Battle', emoji: '⚔️' },

    xp: m => m.tot('arenaCalcoli') * 2 + m.stelleDi(CHIAVE) * 5 + m.tappeDi(CHIAVE) * 40,
    provato: m => m.tot('arenaPartite') > 0,

    traguardi: [
      { id: 'are-calcoli', emoji: '🧮', nome: 'Il conto torna',
        come: n => `Fai ${n} calcoli giusti in battaglia`,
        soglie: [20, 150, 600], valore: m => m.tot('arenaCalcoli') },
      { id: 'are-caserme', emoji: '🛖', nome: 'Capomastro',
        come: n => `Costruisci o potenzia ${n} caserme`,
        soglie: [10, 60, 250], valore: m => m.tot('arenaCaserme') },
      { id: 'are-tappe', emoji: '🗺️', nome: 'Di scontro in scontro',
        come: n => n === 1 ? 'Vinci la prima tappa di Castle Battle'
                           : `Vinci ${n} tappe di Castle Battle`,
        soglie: [1, 5, QUANTE_TAPPE], valore: m => m.tappeDi(CHIAVE) },
      { id: 'are-stelle', emoji: '⭐', nome: 'Stella su stella',
        come: n => `Raccogli ${n} stelle a Castle Battle`,
        soglie: [6, 18, QUANTE_TAPPE * 3], valore: m => m.stelleDi(CHIAVE) },
      { id: 'are-graffi', emoji: '🛡️', nome: 'Senza un graffio',
        come: n => `Vinci ${n} tappe con tre stelle`,
        soglie: [1, 4, 10], valore: m => m.tot('arenaSenzaGraffi') },
      { id: 'are-campagna', emoji: '🏁', nome: 'Il trono è tuo',
        come: () => 'Finisci tutte le tappe di Castle Battle',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}

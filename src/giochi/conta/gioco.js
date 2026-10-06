// Il manifesto: dato puro. Struttura della cartella e convenzione dei
// giochi nuovi in docs/core/convenzione-giochi.md.
import { CAMPAGNA, SCALINI, QUANTE_TAPPE } from './dati/campagna.js'

export const CHIAVE = 'conta'

export default {
  chiave: CHIAVE,
  nome: 'Conta gli animali',
  icona: '🐑',
  che: 'contare davvero: in fila, sparpagliati e a insiemi',
  area: 'numeri',
  come: 'domande',
  copertina: { fondo: '#a8dc7a', disegno: '#86c25a', scena: 'colline' },
  tappe: QUANTE_TAPPE,
  piccoli: true,

  riassunto(av = { tappa: 0, stelle: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    if ((av.tappa || 0) >= QUANTE_TAPPE) return `campagna finita${coda}`
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    const s = SCALINI.find(s => s.chiave === CAMPAGNA[i].scalino)
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${s.nome}${coda}`
  },

  albo: {
    area: { nome: 'Conta gli animali', emoji: '🐑' },

    xp: m => m.tot('contate') * 2 + m.stelleDi(CHIAVE) * 4 + m.tappeDi(CHIAVE) * 30,
    provato: m => m.tot('contate') > 0,

    traguardi: [
      { id: 'conta-contate', emoji: '🔢', nome: 'Sa contare',
        come: n => `Rispondi giusto a ${n} domande`,
        soglie: [10, 50, 150], valore: m => m.tot('contate') },
      { id: 'conta-tappe', emoji: '🐑', nome: 'Di tappa in tappa',
        come: n => n === 1 ? 'Supera la prima tappa di Conta gli animali'
                           : `Supera ${n} tappe di Conta gli animali`,
        soglie: [1, 6, QUANTE_TAPPE], valore: m => m.tappeDi(CHIAVE) },
      { id: 'conta-stelle', emoji: '⭐', nome: 'Stelle nel prato',
        come: n => `Raccogli ${n} stelle contando`,
        soglie: [8, 20, QUANTE_TAPPE * 3], valore: m => m.stelleDi(CHIAVE) },
      { id: 'conta-serie', emoji: '🔥', nome: 'Filotto',
        come: n => `Rispondi giusto ${n} volte di fila`,
        soglie: [3, 8, 15], valore: m => m.best('serieConta') },
      { id: 'conta-campagna', emoji: '🏁', nome: 'Il libretto è pieno',
        come: () => 'Finisci tutte le tappe di Conta gli animali',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}

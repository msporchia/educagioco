// Il manifesto: dato puro, non importa Vue né il profilo. Struttura della
// cartella e convenzione dei giochi nuovi in docs/core/convenzione-giochi.md.
import { CAMPAGNA, QUANTE_TAPPE } from './dati/campagna.js'

export const CHIAVE = 'giardino'

export default {
  chiave: CHIAVE,
  nome: 'Il giardino',
  icona: '🌻',
  che: 'difendere il giardino dagli zombi coi calcoli',
  area: 'numeri',
  come: 'strategia',
  copertina: { fondo: '#2f6b3b', disegno: '#1f4d2a', scena: 'mura' },
  // le domande passano da src/quiz/ (il modulo `conti`), tagliate dall'età
  quiz: true,
  // in prova: sta dietro l'interruttore dei giochi sperimentali dei genitori (docs/genitori/interruttori.md)
  sperimentale: true,
  tappe: QUANTE_TAPPE,
  // gli amici sulla mappa (docs/core/amici-nei-giochi.md): il cursore della campagna; finite le tappe la mappa non ha un posto, solo la riga in cima
  amici: { tappe: QUANTE_TAPPE, dove: 'in fondo al giardino' },

  riassunto(av = { tappa: 0, stelle: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

  // I contatori (segna() in Gioco.vue): giardinoPartite, giardinoCalcoli (giusti,
  // uno per pianta comprata), giardinoPiante (messe in campo), giardinoSenzaGraffi
  // (tappe vinte a tre stelle).
  albo: {
    area: { nome: 'Il giardino', emoji: '🌻' },

    xp: m => m.tot('giardinoCalcoli') * 2 + m.stelleDi(CHIAVE) * 5 + m.tappeDi(CHIAVE) * 40,
    provato: m => m.tot('giardinoPartite') > 0,

    traguardi: [
      { id: 'gia-calcoli', emoji: '🧮', nome: 'Il conto torna',
        come: n => `Fai ${n} calcoli giusti in giardino`,
        soglie: [20, 150, 600], valore: m => m.tot('giardinoCalcoli') },
      { id: 'gia-piante', emoji: '🌱', nome: 'Mano verde',
        come: n => `Pianta ${n} piante in campo`,
        soglie: [20, 150, 600], valore: m => m.tot('giardinoPiante') },
      { id: 'gia-tappe', emoji: '🗺️', nome: 'Di aiuola in aiuola',
        come: n => n === 1 ? 'Vinci la prima tappa del giardino'
                           : `Vinci ${n} tappe del giardino`,
        soglie: [1, 4, QUANTE_TAPPE], valore: m => m.tappeDi(CHIAVE) },
      { id: 'gia-stelle', emoji: '⭐', nome: 'Stella su stella',
        come: n => `Raccogli ${n} stelle in giardino`,
        soglie: [5, 14, QUANTE_TAPPE * 3], valore: m => m.stelleDi(CHIAVE) },
      { id: 'gia-graffi', emoji: '🚜', nome: 'Neanche un carretto',
        come: n => `Vinci ${n} tappe senza far partire un carretto`,
        soglie: [1, 3, 8], valore: m => m.tot('giardinoSenzaGraffi') },
      { id: 'gia-campagna', emoji: '🏁', nome: 'Il giardino è salvo',
        come: () => 'Finisci tutte le tappe del giardino',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}

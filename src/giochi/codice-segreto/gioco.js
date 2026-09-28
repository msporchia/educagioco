// Il manifesto: dato puro, non importa Vue né il profilo. Struttura della
// cartella e convenzione dei giochi nuovi in docs/core/convenzione-giochi.md.
import { CAMPAGNA, QUANTE_TAPPE } from './dati/campagna.js'
import { apriQuaderno, primatoInParole } from '../primati.js'

export const CHIAVE = 'codice'

// Il gioco libero non finisce: quanti codici si indovinano di fila. Vedi
// docs/core/primati.md.
export const SENZA_FINE = {
  nome: 'Il gioco libero',
  icona: '🎲',
  misura: 'fila',
  che: 'quanti codici indovini di fila',
}

export default {
  chiave: CHIAVE,
  nome: 'Codice Segreto',
  icona: '🔐',
  che: 'dedurre il codice dagli indizi',
  area: 'logica',
  come: 'pensare',
  tappe: QUANTE_TAPPE,
  tinta: '#f7ecd6',
  senzaFine: SENZA_FINE,

  riassunto(av = { tappa: 0, libera: false, stelle: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    if (av.libera) {
      const primato = primatoInParole(apriQuaderno(av), SENZA_FINE.misura)
      return primato ? `gioco libero · record ${primato}${coda}`
                     : `gioco libero ♾️${coda}`
    }
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

  // I traguardi e l'esperienza: la forma del blocco è in
  // docs/core/convenzione-giochi.md.
  albo: {
    area: { nome: 'Codice Segreto', emoji: '🔐' },

    xp: m => m.tot('codici') * 3 + m.stelleDi(CHIAVE) * 5 + m.tappeDi(CHIAVE) * 40,
    provato: m => m.tot('codici') > 0,

    traguardi: [
      { id: 'cod-codici', emoji: '🔓', nome: 'Scassinatore',
        come: n => `Indovina ${n} codici`,
        soglie: [5, 30, 120], valore: m => m.tot('codici') },
      { id: 'cod-tappe', emoji: '🗝️', nome: 'Di porta in porta',
        come: n => n === 1 ? 'Supera la prima tappa del Codice Segreto'
                           : `Supera ${n} tappe del Codice Segreto`,
        soglie: [1, 5, QUANTE_TAPPE], valore: m => m.tappeDi(CHIAVE) },
      { id: 'cod-stelle', emoji: '⭐', nome: 'Chiavi d\'oro',
        come: n => `Raccogli ${n} stelle sui codici`,
        soglie: [6, 15, QUANTE_TAPPE * 3], valore: m => m.stelleDi(CHIAVE) },
      { id: 'cod-serie', emoji: '🔥', nome: 'Non sbaglio un colpo',
        come: n => `Indovina ${n} codici di fila`,
        soglie: [3, 6, 12], valore: m => m.best('serieCodici') },
      { id: 'cod-campagna', emoji: '🏁', nome: 'Cassaforte aperta',
        come: () => 'Finisci tutte le tappe del Codice Segreto',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}

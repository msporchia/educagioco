// Il manifesto: dato puro. Struttura della cartella e convenzione dei
// giochi nuovi in docs/core/convenzione-giochi.md.
import { CAMPAGNA, QUANTE_TAPPE } from './dati/campagna.js'
import { apriQuaderno, primatoInParole } from '../primati.js'

export const CHIAVE = 'survivors'

// La Sopravvivenza: non si vince, si resiste finché si resiste. Vedi
// docs/core/primati.md.
export const SENZA_FINE = {
  nome: 'La Sopravvivenza',
  icona: '♾️',
  misura: 'tempo',
  che: 'quanto resisti',
  dettagli: d => [`${d.uccisi} mostri`, `livello ${d.livello}`],
}

export default {
  chiave: CHIAVE,
  nome: 'Survivors',
  icona: '🏹',
  che: 'schivare i mostri e scegliere i potenziamenti',
  area: 'avventure',
  come: 'riflessi',
  copertina: { fondo: '#6e2f3a', disegno: '#4a1e27', scena: 'alberi' },
  // il pedaggio passa da src/quiz/ (il mazzo che l'età del bambino taglia),
  // non domande sue come Conta gli animali
  quiz: true,
  tappe: QUANTE_TAPPE,
  senzaFine: SENZA_FINE,

  riassunto(av = { tappa: 0, libera: false, stelle: {}, cfg: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    if (av.libera) {
      const primato = primatoInParole(apriQuaderno(av), SENZA_FINE.misura)
      return primato ? `sopravvivenza · primato ${primato}${coda}`
                     : `sopravvivenza ♾️${coda}`
    }
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

  // I contatori (segna()/segnaBest() in Gioco.vue): survivorsPartite,
  // survivorsTappe, survivorsMostri, survivorsCarte, survivorsToste
  // (carte forti prese rispondendo giusto), survivorsLivello (primato),
  // survivorsTempo (primato).
  albo: {
    area: { nome: 'Survivors', emoji: '🏹' },

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
      { id: 'sur-stelle', emoji: '⭐', nome: 'Senza un graffio',
        come: n => `Raccogli ${n} stelle a Survivors`,
        soglie: [6, 15, QUANTE_TAPPE * 3], valore: m => m.stelleDi(CHIAVE) },
      { id: 'sur-livello', emoji: '📈', nome: 'Cresciuto bene',
        come: n => `Arriva al livello ${n} in una partita sola`,
        soglie: [6, 9, 12], valore: m => m.best('survivorsLivello') },
      { id: 'sur-toste', emoji: '🧠', nome: 'Chi non risica',
        come: n => `Prendi ${n} carte forti rispondendo giusto`,
        soglie: [5, 30, 120], valore: m => m.tot('survivorsToste') },
      { id: 'sur-campagna', emoji: '🏁', nome: 'Sopravvissuto',
        come: () => 'Finisci tutte le tappe di Survivors',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}

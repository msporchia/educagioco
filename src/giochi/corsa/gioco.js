// Il manifesto: dato puro. Struttura della cartella e convenzione dei
// giochi nuovi in docs/core/convenzione-giochi.md. `sperimentale: true`
// è un cancello: la carta non compare in home finché non si toglie
// questa riga (vedi «giochi in prova» nella schermata dei genitori).
import { CAMPAGNA, QUANTE_TAPPE } from './dati/campagna.js'
import { apriQuaderno, primatoInParole } from '../primati.js'

export const CHIAVE = 'corsa'

// La corsa infinita: non si vince, si dura. Vedi docs/core/primati.md.
export const SENZA_FINE = {
  nome: 'La corsa infinita',
  icona: '♾️',
  misura: 'metri',
  che: 'quanto lontano arrivi',
}

export default {
  chiave: CHIAVE,
  nome: 'La corsa dei numeri',
  icona: '🏃',
  che: 'far crescere la truppa scegliendo il cancello giusto',
  area: 'numeri',
  come: 'riflessi',
  // il pedaggio passa da src/quiz/ (il mazzo che l'età del bambino taglia),
  // non domande sue come Conta gli animali
  quiz: true,
  tappe: QUANTE_TAPPE,
  sperimentale: true,
  grandi: true,   // i cancelli sono conti a mente, a un ritmo che a sei anni non si tiene
  tinta: '#ffe8cf',
  senzaFine: SENZA_FINE,

  riassunto(av = { tappa: 0, libera: false, stelle: {}, cfg: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    if (av.libera) {
      const primato = primatoInParole(apriQuaderno(av), SENZA_FINE.misura)
      return primato ? `corsa infinita · primato ${primato}${coda}`
                     : `corsa infinita ♾️${coda}`
    }
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

  // I contatori (segna()/segnaBest() in Gioco.vue): corsaPartite,
  // corsaTappe, corsaMostri, corsaCancelli, corsaLibri, corsaTruppa
  // (primato), corsaMetri (primato).
  albo: {
    area: { nome: 'La corsa', emoji: '🏃' },

    // l'unità di lavoro è il cancello letto: un conto a mente, una corsa
    // ne porta una decina; l'esercizio del cancello d'oro vale di più
    // perché nessuno è obbligato a farlo
    xp: m => m.tot('corsaCancelli') + m.tot('corsaLibri') * 4 +
             m.stelleDi(CHIAVE) * 5 + m.tappeDi(CHIAVE) * 40,
    provato: m => m.tot('corsaPartite') > 0,

    traguardi: [
      { id: 'cor-cancelli', emoji: '🚪', nome: 'Uno alla volta',
        come: n => `Attraversa ${n} cancelli`,
        soglie: [50, 400, 2000], valore: m => m.tot('corsaCancelli') },
      { id: 'cor-tappe', emoji: '🗺️', nome: 'Di sentiero in sentiero',
        come: n => n === 1 ? 'Supera la prima tappa della corsa'
                           : `Supera ${n} tappe della corsa`,
        soglie: [1, 5, QUANTE_TAPPE], valore: m => m.tappeDi(CHIAVE) },
      { id: 'cor-stelle', emoji: '⭐', nome: 'Occhio ai numeri',
        come: n => `Raccogli ${n} stelle alla corsa`,
        soglie: [6, 15, QUANTE_TAPPE * 3], valore: m => m.stelleDi(CHIAVE) },
      { id: 'cor-truppa', emoji: '🎖️', nome: 'Truppa piena',
        come: n => `Arriva a ${n} soldati in una corsa sola`,
        soglie: [24, 124, 624], valore: m => m.best('corsaTruppa') },
      { id: 'cor-mostri', emoji: '👾', nome: 'Abbattuti in volata',
        come: n => `Abbatti ${n} mostri prima che ti arrivino addosso`,
        soglie: [10, 60, 250], valore: m => m.tot('corsaMostri') },
      { id: 'cor-libri', emoji: '📚', nome: 'Chi si ferma a pensare',
        come: n => `Indovina ${n} esercizi del cancello d'oro`,
        soglie: [5, 30, 120], valore: m => m.tot('corsaLibri') },
      { id: 'cor-campagna', emoji: '🏁', nome: 'Arrivato in cima',
        come: () => 'Finisci tutte le tappe della corsa',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}

/* Passo passo — il manifesto. Dato puro, struttura di
   `docs/core/convenzione-giochi.md`: vedi `docs/passo-passo/README.md`. */
import { CAMPAGNA, QUANTE_TAPPE, FINE_STRADA, TAPPE_PICCOLE, TAPPE_ZAINO, TAPPE_PRIME } from './dati/campagna.js'
import { stradeDi } from './motore/strade.js'
import { apriQuaderno, primatoInParole } from '../primati.js'

export const CHIAVE = 'passo'

/* vedi docs/passo-passo/sentiero.md */
export const SENZA_FINE = {
  nome: 'Il sentiero senza fine',
  icona: '♾️',
  misura: 'fila',
  che: 'quanti sentieri di fila, senza comprare aiuti',
}

export default {
  chiave: CHIAVE,
  nome: 'Passo passo',
  icona: '🐇',
  che: 'dare gli ordini in fila',
  area: 'logica',
  come: 'pensare',
  copertina: { fondo: '#f29e5c', disegno: '#e07d3a', scena: 'caselle' },
  tappe: QUANTE_TAPPE,
  senzaFine: SENZA_FINE,

  piccoli: true,
  cresce: true,  // vedi docs/core/convenzione-giochi.md

  riassunto(av = { tappa: 0, stelle: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    const record = primatoInParole(apriQuaderno(av), SENZA_FINE.misura)
    // finita la strada del coniglio la campagna è finita: il cane conta per le stelle
    if ((av.tappa || 0) >= FINE_STRADA)
      return record ? `sentiero senza fine · record ${record}${coda}` : `tutte le tane${coda}`
    // la tappa di adesso, su qualunque strada (docs/passo-passo/livelli.md, «Le due strade»)
    const adesso = stradeDi(av).adesso()
    const i = adesso ?? Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    const sentiero = (av.tappa || 0) >= TAPPE_PRIME && record ? ` · sentiero ${record}` : ''  // vedi docs/passo-passo/sentiero.md
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${sentiero}${coda}`
  },

  /* i traguardi «di prima» contano solo i primi cinque gradini (fino alle
     buche): vedi TAPPE_PRIME in docs/passo-passo/livelli.md. I contatori
     li muove Gioco.vue con segna()/segnaBest():
       ppProve le file col ▶, ppTane le tane, ppCarote con la carota,
       ppDaSolo senza aiuti, ppFila (primato) i sentieri di fila,
       ppPecore le pecore nel recinto */
  albo: {
    area: { nome: 'Passo passo', emoji: '🐇' },

    xp: m => m.tot('ppTane') * 3 + m.stelleDi(CHIAVE) * 4 + m.tappeDi(CHIAVE) * 30,
    provato: m => m.tot('ppProve') > 0 || m.tappeDi(CHIAVE) > 0,

    traguardi: [
      { id: 'pp-tappe', emoji: '🏡', nome: 'Tutti a casa',
        come: n => n === 1 ? 'Porta il coniglio a casa nella prima tappa di Passo passo'
                           : `Supera ${n} tappe di Passo passo`,
        soglie: [1, 10, TAPPE_PRIME], valore: m => Math.min(m.tappeDi(CHIAVE), TAPPE_PRIME) },
      { id: 'pp-stelle', emoji: '⭐', nome: 'Le stelle del coniglio',
        come: n => `Raccogli ${n} stelle in Passo passo`,
        soglie: [15, 40, TAPPE_PRIME * 3], valore: m => m.stelleDi(CHIAVE) },
      /* i gradini dei grandi: quante tappe con lo zaino */
      { id: 'pp-zaino', emoji: '🎒', nome: 'Lo zaino del coniglio',
        come: n => n === 1 ? 'Supera la prima tappa con lo zaino in Passo passo'
                           : `Supera ${n} tappe con lo zaino in Passo passo`,
        soglie: [1, 4, TAPPE_ZAINO], valore: m => Math.max(0, m.tappeDi(CHIAVE) - TAPPE_PICCOLE) },
      /* il cane pastore: le pecore portate nel recinto */
      { id: 'pp-pecore', emoji: '🐑', nome: 'Il cane pastore',
        come: n => n === 1 ? 'Porta una pecora nel recinto in Passo passo'
                           : `Porta ${n} pecore nel recinto in Passo passo`,
        soglie: [1, 12, 40], valore: m => m.tot('ppPecore') },
      /* la carota non serve per vincere: prenderla è la deviazione
         pensata, e questo traguardo conta chi se la va a cercare */
      { id: 'pp-carote', emoji: '🥕', nome: 'L\'orto del coniglio',
        come: n => `Porta a casa ${n} carote`,
        soglie: [5, 20, 50], valore: m => m.tot('ppCarote') },
      { id: 'pp-da-solo', emoji: '🧠', nome: 'Ci penso io',
        come: n => `Porta il coniglio a casa ${n} volte senza comprare aiuti`,
        soglie: [5, 20, 60], valore: m => m.tot('ppDaSolo') },
      { id: 'pp-sentiero', emoji: '♾️', nome: 'Il sentiero senza fine',
        come: n => `Fai ${n} sentieri di fila senza comprare aiuti`,
        soglie: [3, 6, 12], valore: m => m.best('ppFila') },
      { id: 'pp-campagna', emoji: '🏁', nome: 'La strada di casa',
        come: () => 'Finisci le tappe dei primi cinque gradini di Passo passo',
        soglie: [1], valore: m => (m.tappeDi(CHIAVE) >= TAPPE_PRIME ? 1 : 0) },
    ],
  },
}

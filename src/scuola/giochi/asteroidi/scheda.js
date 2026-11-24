// Gli Asteroidi a scuola (docs/asteroidi/scuola.md): le tabelline (col risultato o col numero nascosto) e il calcolo a mente
// del gioco, a stazioni, in 3D. La forma di una scheda: docs/scuola/giochi.md
import { STAZIONI } from '../../../data/calcolo.js'

/* le stazioni del calcolo a mente come le sceglie la maestra: tutte tranne «La prova» (che è tutto insieme); la chiave è il
   primo concetto della stazione, che non cambia anche se la fila si riordina */
export const STAZIONI_MENTE = STAZIONI.filter(s => s.nuovi.length).map(s => ({
  chiave: s.nuovi[0], nome: s.nome, icona: s.emoji, esempio: s.esempio, concetti: s.nuovi,
}))
const minuscola = s => s.charAt(0).toLowerCase() + s.slice(1)
const inFila = l => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} e ${l.at(-1)}`)
const oggetto = x => !!x && typeof x === 'object' && !Array.isArray(x)

// { tipo: 'mente', stazioni: [chiavi di STAZIONI_MENTE] }: almeno una, senza doppioni (anche contro un link manomesso)
function valido(e) {
  return oggetto(e) && Object.keys(e).every(k => ['tipo', 'stazioni'].includes(k)) && e.tipo === 'mente' &&
    Array.isArray(e.stazioni) && e.stazioni.length > 0 && new Set(e.stazioni).size === e.stazioni.length &&
    e.stazioni.every(k => STAZIONI_MENTE.some(s => s.chiave === k))
}
// «Calcolo a mente · fino al dieci e oltre la decina», nell'ordine della fila
function descrivi(e) {
  const scelte = STAZIONI_MENTE.filter(s => e.stazioni.includes(s.chiave)).map(s => minuscola(s.nome))
  return `Calcolo a mente · ${scelte.length === STAZIONI_MENTE.length ? 'tutte le stazioni' : inFila(scelte)}`
}
// i concetti del gioco (data/calcolo.js) delle stazioni scelte: quello che arriva al limite del gioco
export const concettiDi = e => STAZIONI_MENTE.filter(s => e.stazioni.includes(s.chiave)).flatMap(s => s.concetti)

export default {
  id: 'asteroidi',
  nome: 'Gli Asteroidi',
  nei: 'negli Asteroidi',
  spiega: "Il bambino guida una navicella nello spazio: sullo schermo c'è un conto (una tabellina o un calcolo a mente), e deve colpire il sasso che porta il numero giusto prima che cada.",
  // per la maestra che sceglie il gioco, in un testo solo: cosa allena, un esempio fra «…», come cresce (il carosello mostra questo)
  allena: 'Sullo schermo c\'è un conto, per esempio «35 − 7 = ?»; scendono sassi coi numeri e il bambino colpisce quello giusto, il 28, prima che cada. Va con le tabelline e il calcolo a mente: è il gioco della velocità nei conti.',
  tred: true,
  difficolta: {
    facile: 'I sassi cadono più piano e la nave ha quattro vite invece di tre.',
    difficile: 'I sassi cadono più in fretta e la nave ha due vite invece di tre.',
  },
  // gli esercizi del catalogo che sa fare: solo le tabelline, col risultato o col numero nascosto (anche a più parti)
  accetta: e => e.tipo === 'tabelline',
  // e il suo calcolo a mente, che si mescola con le tabelline nello stesso blocco (`siMescola`)
  tipo: {
    id: 'mente',
    materia: 'matematica',
    siMescola: true,
    voce: {
      nome: 'Il calcolo a mente',
      icona: '🧠',
      spiega: 'I conti a mente del gioco, a stazioni: somme e sottrazioni, le decine, il riporto, moltiplicare e dividere a mente, fino a mille.',
      base: { tipo: 'mente', stazioni: ['somma-10'] },
      vuota: { tipo: 'mente', stazioni: [] },      // nell'editor: nessuna stazione scelta (una scelta non nasce fatta)
    },
    valido,
    descrivi,
  },
}

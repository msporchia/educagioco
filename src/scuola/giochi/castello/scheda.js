// Difendi il castello a scuola (docs/castello/scuola.md): la maestra sceglie una tappa del regno, già tarata con le sue
// operazioni e il suo gradino massimo. La forma di una scheda: docs/scuola/giochi.md. Puro: solo il racconto delle tappe.
import { CAMPAGNE } from '../../../data/campagne-castello.js'

// un esempio per gradino della scaletta (docs/castello/operazioni.md); unita/castello-scuola li confronta coi generatori
export const ESEMPI = {
  add: ['24+13', '27+15', '234+152', '247+185', '23+14+21', '27+35+18', '1247+385', '247+185+96', '12+34+21+43', '1247+385+2094'],
  sub: ['46−12', '95−58', '661−201', '850−75', '735−199', '351−174', '903−255', '2381−572', '5810−2344', '3032−2738'],
  mul: ['22×3', '84×3', '420×2', '278×2', '4204×7', '39×22', '51×93', '625×26', '937×97', '1759×52'],
  div: ['72:4', '47:2', '210:3', '645:2', '272:8', '509:2', '816:9', '4912:8', '6199:2', '9511:9'],
}
const NOMI = { add: 'addizioni', sub: 'sottrazioni', mul: 'moltiplicazioni', div: 'divisioni' }
const ICONE = { add: '🏹', sub: '🔮', mul: '❄️', div: '💣' }

const inFila = l => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} e ${l.at(-1)}`)
const minuscola = s => s.charAt(0).toLowerCase() + s.slice(1)
const oggetto = x => !!x && typeof x === 'object' && !Array.isArray(x)

// le tappe per l'editor, nell'ordine del regno; la chiave è quella delle vite tarate (`chiaveTappa` di data/castello.js)
export const TAPPE_CASTELLO = CAMPAGNE.flatMap(c => c.tappe.map(t => ({
  chiave: `${c.id}/${t.nome}`, nome: t.nome, emoji: t.emoji, campagna: c.id, calcoli: t.calcoli, cap: t.cap,
  torri: [...t.torri],
  icone: t.torri.map(k => ICONE[k]).join(''),
  operazioni: t.torri.length === 4 ? 'le quattro operazioni' : inFila(t.torri.map(k => NOMI[k])),
  // fin dove sale ogni operazione: la torre nasce al primo gradino e sale fino al `cap` della tappa
  fino: t.torri.map(k => `${NOMI[k]} fino a ${ESEMPI[k][t.cap - 1]}`),
})))
export const CAMPAGNE_CASTELLO = CAMPAGNE.map(c => ({ id: c.id, nome: c.nome, emoji: c.emoji,
  tappe: TAPPE_CASTELLO.filter(t => t.campagna === c.id) }))
export const tappaCastello = chiave => TAPPE_CASTELLO.find(t => t.chiave === chiave) || null

// due tappe col nome uguale in due campagne (il guado): la descrizione dice anche dove
const doppio = t => TAPPE_CASTELLO.filter(x => x.nome === t.nome).length > 1
const nomeDi = t => (doppio(t) ? `${t.nome} (${minuscola(CAMPAGNE_CASTELLO.find(c => c.id === t.campagna).nome)})` : t.nome)

// { tipo: 'castello', tappa: '<campagna>/<nome>' }, anche contro un link manomesso
function valido(e) {
  if (!oggetto(e) || e.tipo !== 'castello') return false
  if (Object.keys(e).some(k => k !== 'tipo' && k !== 'tappa')) return false
  return typeof e.tappa === 'string' && TAPPE_CASTELLO.some(t => t.chiave === e.tappa)
}

// «Difendi il castello · Il sentiero · addizioni»
function descrivi(e) {
  if (!valido(e)) return 'Esercizio non valido'
  const t = tappaCastello(e.tappa)
  return `Difendi il castello · ${nomeDi(t)} · ${t.operazioni}`
}

export default {
  id: 'castello',
  nome: 'Difendi il castello',
  nei: 'nel castello',
  spiega: "Il bambino difende un castello dai mostri: ogni torre si costruisce risolvendo un'operazione in colonna.",
  // per la maestra che sceglie il gioco, in un testo solo: cosa allena, un esempio fra «…», come cresce (il carosello mostra questo)
  allena: 'Le operazioni in colonna: per costruire una torre il bambino risolve un conto come «22 + 44», una cifra alla volta da destra, coi riporti; a ogni livello della torre il conto si fa un po\' più difficile. La tappa scelta decide quali operazioni (+, −, ×, :) e fin dove si arriva.',
  tred: false,
  conta: { tante: 'operazioni', una: "un'operazione", giuste: 'operazioni giuste', giusta: "un'operazione giusta" },
  difficolta: {
    facile: 'Il castello ha 8 cuori invece di 5: si può sbagliare qualche difesa in più prima di cadere.',
    difficile: 'Il castello ha solo 3 cuori invece di 5: ogni mostro che passa pesa di più.',
  },
  // gli esercizi del catalogo no: solo le sue tappe, già tarate
  accetta: () => false,
  tipo: {
    id: 'castello',
    materia: 'matematica',
    voce: {
      nome: 'Difendi il castello',
      icona: '🏰',
      spiega: 'Le torri si comprano con operazioni in colonna. Si sceglie una tappa del regno, che ha già le sue operazioni e fin dove salgono.',
      base: { tipo: 'castello', tappa: 'bosco/Il sentiero' },
    },
    valido,
    descrivi,
  },
}

// Castle Battle a scuola (docs/arena/scuola.md): la maestra sceglie una tappa della campagna, che ha le sue truppe e quindi le
// sue operazioni, e il livello del nemico. La forma di una scheda: docs/scuola/giochi.md. Puro: solo il racconto delle tappe.
import { CAMPAGNA, SCALINI, operazioniDi } from '../../../giochi/arena/dati/campagna.js'

const NOMI = { '+': 'addizioni', '−': 'sottrazioni', '×': 'moltiplicazioni', '÷': 'divisioni' }
const ORDINE = ['+', '−', '×', '÷']
const inFila = l => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} e ${l.at(-1)}`)
const oggetto = x => !!x && typeof x === 'object' && !Array.isArray(x)

// le tappe per l'editor, nell'ordine della campagna, con le operazioni che portano le loro truppe
export const TAPPE_BATTAGLIA = CAMPAGNA.map((t, i) => {
  const s = SCALINI.find(x => x.chiave === t.scalino)
  const ops = ORDINE.filter(o => operazioniDi(t).includes(o))
  return { chiave: t.chiave, numero: i + 1, nome: t.nome, icona: s?.icona ?? '⚔️', posto: s?.nome ?? '', racconto: t.racconto,
           segni: ops.join(' '), operazioni: ops.length === 4 ? 'le quattro operazioni' : inFila(ops.map(o => NOMI[o])) }
})
export const tappaBattaglia = chiave => TAPPE_BATTAGLIA.find(t => t.chiave === chiave) || null

// { tipo: 'battaglia', tappa: '<chiave della campagna>' }, anche contro un link manomesso
function valido(e) {
  if (!oggetto(e) || e.tipo !== 'battaglia') return false
  if (Object.keys(e).some(k => k !== 'tipo' && k !== 'tappa')) return false
  return typeof e.tappa === 'string' && TAPPE_BATTAGLIA.some(t => t.chiave === e.tappa)
}

// «Castle Battle · Il ponte di pietra · addizioni e sottrazioni»
function descrivi(e) {
  if (!valido(e)) return 'Esercizio non valido'
  const t = tappaBattaglia(e.tappa)
  return `Castle Battle · ${t.nome} · ${t.operazioni}`
}

export default {
  id: 'castle-battle',
  nome: 'Castle Battle',
  nei: 'in Castle Battle',
  spiega: 'Il bambino difende il suo castello e assedia quello nemico: ogni caserma, ogni potenziamento e ogni riparazione si paga con un calcolo a mente. Le operazioni le portano le truppe della tappa scelta.',
  tred: false,
  conta: { tante: 'calcoli', una: 'un calcolo', giuste: 'calcoli giusti', giusta: 'un calcolo giusto' },
  difficolta: {
    facile: 'Il nemico è più lento e meno furbo: si vince anche sbagliando qualche calcolo.',
    difficile: 'Il nemico non aspetta e ripara il suo castello: serve fare i calcoli giusti e in fretta.',
  },
  // gli esercizi del catalogo no: solo le sue tappe, già tarate
  accetta: () => false,
  tipo: {
    id: 'battaglia',
    materia: 'matematica',
    voce: {
      nome: 'Castle Battle',
      icona: '⚔️',
      spiega: 'Calcoli a mente in battaglia: si sceglie una tappa, che ha già le sue truppe e le sue operazioni. I numeri crescono con quello che il bambino costruisce.',
      base: { tipo: 'battaglia', tappa: 'scaramuccia' },
      vuota: { tipo: 'battaglia', tappa: '' },
    },
    valido,
    descrivi,
  },
}

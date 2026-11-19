/* Le pozioni a scuola (docs/pozioni/scuola.md): la maestra sceglie le famiglie di misure e i gradini, il bambino gioca
   quelle tappe in giro. La forma di una scheda: docs/scuola/giochi.md. Puro: le famiglie dai dati del gioco, niente store
   né three. Le chiavi dei gradini sono quelle di GRADINI (dati/campagna.js): unita/pozioni-scuola dice se cambiano */
import { FAMIGLIE } from '../../../giochi/pozioni/dati/misure.js'

export const FAMIGLIE_POZIONI = FAMIGLIE.map(f => ({
  chiave: f.chiave, nome: f.nome, icona: f.emoji, unita: `${f.unita.G}, ${f.unita.M} e ${f.unita.P}`,
}))

// i nove gradini, uguali per le tre famiglie: i nomi per una maestra, gli esempi coi pesi
export const GRADINI_POZIONI = [
  { chiave: 'banco', nome: 'Il banco', spiega: 'Ricetta e listino nella stessa unità: si impara a ordinare.' },
  { chiave: 'grande', nome: "L'unità grande", spiega: 'La ricetta dice «1 kg», il listino è in grammi; sotto ogni targhetta c\'è quanto vale.' },
  { chiave: 'grandi', nome: 'Più unità grandi', spiega: '«2 kg», «5 kg», col listino in grammi e chili: il conto lo fa il bambino.' },
  { chiave: 'virgola', nome: 'Grande e piccola', spiega: '«1500 g» è 1 kg e 500 g; coi liquidi arriva la virgola, «1,5 l». Il conto è scritto.' },
  { chiave: 'virgole', nome: 'Grande e piccola, da soli', spiega: 'Le stesse dosi, e il conto lo fa il bambino.' },
  { chiave: 'media', nome: "L'unità di mezzo", spiega: 'Dosi grandi, e sul listino arrivano etti, decimetri e decilitri. Il conto è scritto.' },
  { chiave: 'miste', nome: 'Tre unità', spiega: 'La ricetta e il listino parlano in tre unità: il conto lo fa il bambino.' },
  { chiave: 'inversa', nome: 'Al contrario', spiega: '«6000 g» sulla ricetta e il listino a chili: si sale. Il conto è scritto.' },
  { chiave: 'inverse', nome: 'Su e giù', spiega: 'Salire o scendere, e anche quanto manca lo conta il bambino.' },
]

const oggetto = x => !!x && typeof x === 'object' && !Array.isArray(x)
const minuscola = s => s.charAt(0).toLowerCase() + s.slice(1)
const inFila = l => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} e ${l.at(-1)}`)
// almeno una, senza doppioni, tutte fra quelle che ci sono
const lista = (l, tutte) => Array.isArray(l) && l.length > 0 && new Set(l).size === l.length &&
  l.every(k => typeof k === 'string' && tutte.some(x => x.chiave === k))

// { tipo: 'pozioni', famiglie: [chiavi di FAMIGLIE], gradini: [chiavi di GRADINI] }; anche contro un link manomesso
function valido(e) {
  if (!oggetto(e) || !Object.keys(e).every(k => ['tipo', 'famiglie', 'gradini'].includes(k))) return false
  return e.tipo === 'pozioni' && lista(e.famiglie, FAMIGLIE_POZIONI) && lista(e.gradini, GRADINI_POZIONI)
}

// una tappa per famiglia e gradino
export const quanteTappe = e => e.famiglie.length * e.gradini.length

// «Le pozioni · i pesi e i liquidi · il banco e l'unità grande · 4 tappe», nell'ordine della campagna
function descrivi(e) {
  if (!valido(e)) return 'Esercizio non valido'
  const scelte = (tutte, chiavi) => tutte.filter(x => chiavi.includes(x.chiave)).map(x => minuscola(x.nome))
  const famiglie = e.famiglie.length === FAMIGLIE_POZIONI.length ? 'pesi, lunghezze e liquidi' : inFila(scelte(FAMIGLIE_POZIONI, e.famiglie))
  const gradini = e.gradini.length === GRADINI_POZIONI.length ? 'tutti i gradini' : inFila(scelte(GRADINI_POZIONI, e.gradini))
  const n = quanteTappe(e)
  return `Le pozioni · ${famiglie} · ${gradini} · ${n === 1 ? '1 tappa' : `${n} tappe`}`
}

export default {
  id: 'pozioni',
  nome: 'Le pozioni',
  nei: 'nel laboratorio delle pozioni',
  spiega: 'Si comprano dal mercante le ampolle che fanno la dose, spendendo poco. Vuole un PC che regga la grafica 3D.',
  tred: true,
  // gli esercizi del catalogo no: solo il suo contenuto
  accetta: () => false,
  tipo: {
    id: 'pozioni',
    materia: 'matematica',
    voce: {
      nome: 'Le pozioni',
      icona: '⚗️',
      spiega: 'Misure e conversioni: la ricetta chiede «1500 g», il mercante vende a chili ed etti, e il bambino ordina le ampolle giuste. Si scelgono le misure e i gradini, e le loro tappe si fanno in fila.',
      base: { tipo: 'pozioni', famiglie: ['massa'], gradini: ['banco', 'grande', 'grandi'] },
    },
    valido,
    descrivi,
  },
}

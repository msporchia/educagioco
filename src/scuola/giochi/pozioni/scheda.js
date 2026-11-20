/* Le pozioni a scuola (docs/pozioni/scuola.md): la maestra sceglie le famiglie di misure e i gradini, il bambino gioca
   quelle tappe in giro. La forma di una scheda: docs/scuola/giochi.md. Puro: le famiglie dai dati del gioco, niente store
   né three. Le chiavi dei gradini sono quelle di GRADINI (dati/campagna.js): unita/pozioni-scuola dice se cambiano */
import { FAMIGLIE } from '../../../giochi/pozioni/dati/misure.js'

export const FAMIGLIE_POZIONI = FAMIGLIE.map(f => ({
  chiave: f.chiave, nome: f.nome, icona: f.emoji, unita: `${f.unita.G}, ${f.unita.M} e ${f.unita.P}`,
}))

// i nove gradini, uguali per le tre famiglie: i nomi per una maestra, e un caso concreto coi pesi (cosa chiede la ricetta,
// cosa vende il mercante, cosa fa il bambino): il nome da solo non lo dice
export const GRADINI_POZIONI = [
  { chiave: 'banco', breve: 'stessa unità', nome: 'Stessa unità', spiega: 'La ricetta chiede «300 g», il mercante vende ampolle in grammi: il bambino compra quelle che fanno 300 g, spendendo poco.' },
  { chiave: 'grande', breve: 'chili in grammi col conto', nome: 'Dai chili ai grammi, col conto scritto', spiega: 'La ricetta dice «2 kg», il mercante vende in grammi; sotto ogni targhetta c\'è scritto quanto vale. Il bambino compra 2000 g.' },
  { chiave: 'grandi', breve: 'chili in grammi', nome: 'Dai chili ai grammi, da solo', spiega: 'La ricetta dice «4 kg», il listino è in grammi e in chili, e nessun aiuto: il conto 4 kg = 4000 g lo fa il bambino.' },
  { chiave: 'virgola', breve: 'la virgola col conto', nome: 'Chili e grammi insieme, col conto scritto', spiega: '«1500 g» è 1 kg e 500 g, «1,5 kg» lo stesso (coi liquidi «1,5 l»): sotto le targhette c\'è il conto.' },
  { chiave: 'virgole', breve: 'la virgola', nome: 'Chili e grammi insieme, da solo', spiega: 'Le stesse dosi con la virgola, «2,5 kg» o «0,4 kg», e il conto lo fa il bambino.' },
  { chiave: 'media', breve: 'gli ettogrammi', nome: 'Arrivano gli ettogrammi', spiega: 'La ricetta dice «12 kg» e il mercante vende anche a ettogrammi (decimetri, decilitri): il conto è scritto.' },
  { chiave: 'miste', breve: 'tre unità', nome: 'Tre unità insieme, da solo', spiega: 'Una dose in chili, una in ettogrammi, una in grammi: il bambino le porta all\'unità del listino da solo.' },
  { chiave: 'inversa', breve: 'grammi in chili col conto', nome: 'Dai grammi ai chili, col conto scritto', spiega: 'La ricetta dice «6000 g» e il mercante vende a chili: si sale, servono 6 kg. Il conto è scritto.' },
  { chiave: 'inverse', breve: 'su e giù', nome: 'Su e giù, da solo', spiega: 'Ricetta e listino in unità diverse: il bambino decide se salire o scendere, e conta da solo anche quanto manca.' },
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

// «Le pozioni · i pesi e i liquidi · stessa unità e la virgola col conto · 4 tappe», nell'ordine della campagna (coi nomi brevi)
function descrivi(e) {
  if (!valido(e)) return 'Esercizio non valido'
  const scelte = (tutte, chiavi) => tutte.filter(x => chiavi.includes(x.chiave)).map(x => x.breve || minuscola(x.nome))
  const famiglie = e.famiglie.length === FAMIGLIE_POZIONI.length ? 'pesi, lunghezze e liquidi' : inFila(scelte(FAMIGLIE_POZIONI, e.famiglie))
  const gradini = e.gradini.length === GRADINI_POZIONI.length ? 'tutti i gradini' : inFila(scelte(GRADINI_POZIONI, e.gradini))
  const n = quanteTappe(e)
  return `Le pozioni · ${famiglie} · ${gradini} · ${n === 1 ? '1 tappa' : `${n} tappe`}`
}

export default {
  id: 'pozioni',
  nome: 'Le pozioni',
  nei: 'nel laboratorio delle pozioni',
  spiega: 'Si comprano dal mercante le ampolle che fanno la dose, spendendo poco.',
  tred: true,
  conta: { tante: 'ingredienti', una: 'un ingrediente', giuste: 'ingredienti giusti', giusta: 'un ingrediente giusto' },
  difficolta: {
    facile: 'Più gettoni in tasca: quattro in più del solito per ogni pozione, così si può sbagliare qualche ampolla senza andare in rosso.',
    difficile: 'Gettoni contati: la metà di quelli oltre il minimo, quindi un ordine sprecato costa subito.',
  },
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

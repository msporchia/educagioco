// Il grafo dei mondi dell'inglese: i mondi, le loro tappe, da cosa si
// aprono, e le categorie di data/words.js che finiscono nel loro 📦
// cassetto. Il perché di ogni scelta sta in docs/lingue/mondi.md.
//
// Un mondo: { id, nome, disegno (il disegnino sulla mappa), insegna, dopo: [id…] (tutti finiti), dopoUno?: [id…]
//   (basta uno), categorie: [cat di words.js], verbi?: true (i verbi di
//   data/verbi.js vanno nel suo cassetto), tappe: [...] }. Un mondo senza
//   tappe è «in arrivo»: sta sulla mappa ma non si apre.
// Una tappa: { id, nome, disegno, forma, parole: [inglese…], contratta,
//   portata } — 8–10 parole nuove più una struttura. L'ultima di ogni mondo è
//   la 🏁 (`bandiera: true`): niente di nuovo, ripassa tutto il mondo.
import { WORDS } from '../../../data/words.js'
import { VERBI } from '../../../data/verbi.js'
import { FORME } from './forme.js'

// dove sta l'avanzamento nel profilo: profile.campagne[CHIAVE] (non p.eng,
// che resta al gioco vecchio finché la vista nuova non lo sostituisce)
export const CHIAVE = 'inglese'

// le parole «che tengono insieme le frasi» non hanno un cassetto: arrivano
// con le forme
export const CATEGORIE_DI_STRUTTURA = ['q']

const t = (id, nome, disegno, forma, parole, portata, contratta = false) =>
  ({ id, nome, disegno, forma, parole, portata, contratta })
const bandiera = (id, portata) =>
  ({ id, nome: 'La bandiera', disegno: 'bandiera', bandiera: true, parole: [], portata, contratta: true })

export const MONDI = [
  {
    id: 'che-cose', nome: 'Che cos’è', disegno: 'lente', insegna: 'it is a …, is it …?, colori, numeri, plurale',
    dopo: [], categorie: ['a', 'c', 'n', 's', 'j'],
    tappe: [
      t('che-cose-1', 'È un cane', 'cane', 'it-is',
        ['dog', 'cat', 'fish', 'bird', 'mouse', 'rabbit', 'horse', 'cow'], 12),
      t('che-cose-2', 'È un gatto?', 'punto-di-domanda', 'is-it',
        ['pig', 'duck', 'frog', 'sheep', 'lion', 'bear', 'monkey', 'elephant'], 13),
      t('che-cose-3', 'I colori', 'pennelli', 'colore-prima',
        ['red', 'blue', 'green', 'yellow', 'black', 'white', 'brown', 'pink', 'big', 'small'], 14, true),
      t('che-cose-4', 'Uno, due, tre', 'dita', 'plurale',
        ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'], 15, true),
      t('che-cose-5', 'A scuola', 'zaino', 'this-is',
        ['book', 'pencil', 'pen', 'ruler', 'rubber', 'backpack', 'notebook', 'crayon', 'box', 'map'], 16),
      bandiera('che-cose-bandiera', 17),
    ],
  },
  {
    id: 'mie-cose', nome: 'Io e le mie cose', disegno: 'casetta', insegna: 'I like, this is my, have got / has got',
    dopo: ['che-cose'], categorie: ['f', 'k', 'p', 'b'],
    tappe: [
      t('mie-cose-1', 'Mi piace', 'torta', 'i-like',
        ['apple', 'banana', 'pizza', 'cake', 'milk', 'bread', 'cheese', 'chocolate', 'egg', 'cookie'], 18),
      t('mie-cose-2', 'La mia famiglia', 'famiglia', 'this-is-my',
        ['mother', 'father', 'sister', 'brother', 'grandmother', 'grandfather', 'baby', 'friend', 'teacher'], 19),
      t('mie-cose-3', 'Ho un cappello', 'cappello', 'have-got',
        ['hat', 'cap', 'shirt', 'dress', 'shoe', 'sock', 'coat', 'scarf', 'glove', 'trousers'], 20),
      t('mie-cose-4', 'Occhi e orecchie', 'faccia', 'has-got',
        ['hand', 'foot', 'eye', 'ear', 'nose', 'mouth', 'hair', 'head', 'leg', 'long'], 21),
      t('mie-cose-5', 'Non mi piace', 'piatto', 'i-like',
        ['carrot', 'potato', 'tomato', 'salad', 'soup', 'pasta', 'rice', 'juice', 'strawberry', 'grapes'], 22, true),
      bandiera('mie-cose-bandiera', 23),
    ],
  },
  { id: 'dove', nome: 'Dove?', disegno: 'scatola', insegna: 'there is / there are, where is, in, on, under',
    dopo: ['che-cose'], categorie: ['h'], tappe: [] },
  { id: 'saper-fare', nome: 'Cosa sai fare', disegno: 'palla', insegna: 'can, can’t, can you?',
    dopo: ['che-cose'], categorie: ['g'], verbi: true, tappe: [] },
  { id: 'giornata', nome: 'La mia giornata', disegno: 'sole', insegna: 'il presente con I, you, we; at + ora',
    dopo: ['mie-cose'], categorie: ['d'], tappe: [] },
  { id: 'lui-e-lei', nome: 'Lui e lei', disegno: 'coppia', insegna: 'la s della terza persona, does / doesn’t',
    dopo: ['giornata'], categorie: ['y'], tappe: [] },
  { id: 'adesso', nome: 'Adesso', disegno: 'bicicletta', insegna: 'am / is / are + -ing',
    dopo: ['giornata'], categorie: ['t', 'w'], tappe: [] },
  { id: 'ieri', nome: 'Ieri', disegno: 'clessidra', insegna: 'was / were, il passato in -ed e gli irregolari',
    dopo: [], dopoUno: ['lui-e-lei', 'adesso'], categorie: [], tappe: [] },
  { id: 'prova-finale', nome: 'La prova finale', disegno: 'forziere', insegna: 'tutto insieme', prova: true,
    dopo: ['che-cose', 'mie-cose', 'dove', 'saper-fare', 'giornata', 'lui-e-lei', 'adesso', 'ieri'],
    categorie: [], tappe: [] },
]

export const mondoDi = id => MONDI.find(m => m.id === id) || null
export const pronto = m => m.tappe.length > 0
export const TAPPE = MONDI.flatMap(m => m.tappe.map(x => ({ ...x, mondo: m.id })))
export const tappaDi = id => TAPPE.find(x => x.id === id) || null

// Il dato si controlla da solo: un riferimento sbagliato è rosso in
// test/unita/inglese-mondi, non una mappa bianca su un telefono.
export function guastiDeiMondi() {
  const g = []
  const parole = new Map(WORDS.map(w => [w[0], w[3]]))
  const ids = new Set()
  const categorie = new Map()
  const inTappa = new Map()
  for (const m of MONDI) {
    if (ids.has(m.id)) g.push(`mondo doppio: ${m.id}`)
    ids.add(m.id)
    for (const c of m.categorie) {
      if (categorie.has(c)) g.push(`categoria ${c} in due mondi: ${categorie.get(c)} e ${m.id}`)
      categorie.set(c, m.id)
    }
  }
  for (const m of MONDI) {
    for (const d of [...m.dopo, ...(m.dopoUno || [])])
      if (!ids.has(d)) g.push(`${m.id}: dipende da un mondo che non c'è (${d})`)
    if (!pronto(m)) continue
    const ultima = m.tappe[m.tappe.length - 1]
    if (!ultima.bandiera) g.push(`${m.id}: l'ultima tappa non è la 🏁`)
    for (const x of m.tappe) {
      if (ids.has(x.id)) g.push(`id doppio: ${x.id}`)
      ids.add(x.id)
      if (typeof x.portata !== 'number') g.push(`${x.id}: senza portata`)
      if (x.bandiera) {
        if (x !== ultima) g.push(`${x.id}: la 🏁 sta in mezzo al mondo`)
        continue
      }
      if (!FORME[x.forma]) g.push(`${x.id}: forma sconosciuta ${x.forma}`)
      if (x.parole.length < 8 || x.parole.length > 10)
        g.push(`${x.id}: ${x.parole.length} parole nuove (ne vanno 8–10)`)
      for (const p of x.parole) {
        if (!parole.has(p)) g.push(`${x.id}: «${p}» non è in data/words.js`)
        if (inTappa.has(p)) g.push(`«${p}» in due tappe: ${inTappa.get(p)} e ${x.id}`)
        inTappa.set(p, x.id)
      }
    }
  }
  // ogni categoria (tranne quelle di struttura) ha un mondo: nessuna parola resta fuori
  for (const c of new Set(WORDS.map(w => w[3])))
    if (!categorie.has(c) && !CATEGORIE_DI_STRUTTURA.includes(c))
      g.push(`la categoria ${c} non ha un mondo: le sue parole non starebbero da nessuna parte`)
  if (!MONDI.some(m => m.verbi) && VERBI.length) g.push('nessun mondo tiene i verbi nel cassetto')
  // niente cicli nelle dipendenze
  const visita = (id, pila = []) => {
    if (pila.includes(id)) { g.push(`ciclo: ${[...pila, id].join(' → ')}`); return }
    const m = mondoDi(id)
    if (m) for (const d of [...m.dopo, ...(m.dopoUno || [])]) visita(d, [...pila, id])
  }
  for (const m of MONDI) visita(m.id)
  return g
}

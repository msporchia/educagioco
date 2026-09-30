// Gli argomenti delle tappe di parole: «I colori» sono solo colori. Un
// argomento dice quali parole gli appartengono (per categoria di
// data/words.js, o elencate), e le risposte sbagliate di una domanda su una
// parola vengono da lì — mai da tutta la lingua. `vicini`: gli argomenti da
// cui si prende in prestito quando le parole sono poche. `verbi: true`: le
// parole sono di data/verbi.js (chiave `verbo:`). `figure: false`: niente
// domande con le figure, perché le emoji si somigliano tutte (le facce di
// happy, sad, tired). Vedi docs/lingue/mondi.md.
import { WORDS } from '../../../data/words.js'
import { VERBI } from '../../../data/verbi.js'

export const ARGOMENTI = {
  colori: { nome: 'i colori', cat: ['c'] },
  numeri: { nome: 'i numeri', cat: ['n'] },
  animali: { nome: 'gli animali', cat: ['a'] },
  scuola: { nome: 'la scuola', cat: ['s'] },
  giocattoli: { nome: 'i giocattoli',
    parole: ['ball', 'doll', 'teddy bear', 'kite', 'puzzle', 'game', 'car', 'train', 'plane', 'boat',
             'bike', 'drum', 'guitar', 'dice', 'cards'],
    vicini: ['sport'] },
  sport: { nome: 'lo sport e la musica', cat: ['g'] },
  corpo: { nome: 'il corpo', cat: ['b'] },
  famiglia: { nome: 'la famiglia e gli amici',
    parole: ['mother', 'father', 'sister', 'brother', 'grandmother', 'grandfather', 'baby', 'friend',
             'family', 'aunt', 'uncle', 'cousin', 'man', 'woman', 'boy', 'girl', 'child'] },
  cibo: { nome: 'il cibo', cat: ['f'] },
  vestiti: { nome: 'i vestiti', cat: ['p'] },
  aggettivi: { nome: 'come sono le cose', cat: ['j'], figure: false },
  casa: { nome: 'la casa', cat: ['h'], parole: ['garden'] },
  calendario: { nome: 'il calendario',
    parole: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'today',
             'tomorrow', 'yesterday', 'weekend', 'spring', 'summer', 'autumn', 'winter', 'birthday',
             'Christmas', 'holiday', 'January', 'February', 'March', 'April', 'May', 'June', 'July',
             'August', 'September', 'October', 'November', 'December'] },
  tempo: { nome: 'il tempo che fa', cat: ['w'] },
  giornata: { nome: 'la giornata',
    parole: ['morning', 'afternoon', 'evening', 'night', 'breakfast', 'lunch', 'dinner', 'hour',
             'minute', 'time', 'day', 'week', 'month', 'year', 'early', 'late'],
    vicini: ['calendario'] },
  mestieri: { nome: 'i mestieri',
    parole: ['teacher', 'doctor', 'farmer', 'cook', 'police officer', 'firefighter', 'pilot', 'nurse',
             'singer', 'king', 'queen'] },
  mezzi: { nome: 'i mezzi', cat: ['t'] },
  luoghi: { nome: 'i luoghi', cat: ['y'] },
  azioni: { nome: 'le azioni', verbi: true },
}

const CAT = new Map(WORDS.map(w => [w[0], w[3]]))
const IN_VERBI = new Set(VERBI.map(v => v[0]))

// le parole di un argomento, come stanno in words.js (o in verbi.js)
export function paroleDellArgomento(id) {
  const a = ARGOMENTI[id]
  if (!a) return []
  if (a.verbi) return VERBI.map(v => v[0])
  const out = WORDS.filter(w => (a.cat || []).includes(w[3])).map(w => w[0])
  for (const p of a.parole || []) if (!out.includes(p)) out.push(p)
  return out
}

// la chiave SRS di una parola di una tappa: dipende dall'argomento
export const chiaveNellArgomento = (id, parola) =>
  (ARGOMENTI[id] && ARGOMENTI[id].verbi ? 'verbo:' : 'en:') + parola

export function guastiDegliArgomenti() {
  const g = []
  for (const [id, a] of Object.entries(ARGOMENTI)) {
    if (!a.nome) g.push(`argomento ${id}: senza nome`)
    if (!a.verbi && !(a.cat || []).length && !(a.parole || []).length) g.push(`argomento ${id}: vuoto`)
    for (const p of a.parole || [])
      if (!CAT.has(p)) g.push(`argomento ${id}: «${p}» non è in data/words.js`)
    for (const v of a.vicini || []) if (!ARGOMENTI[v]) g.push(`argomento ${id}: vicino sconosciuto ${v}`)
    if (a.verbi && !IN_VERBI.size) g.push(`argomento ${id}: data/verbi.js è vuoto`)
  }
  return g
}

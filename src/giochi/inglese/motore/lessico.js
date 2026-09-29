// Che cos'è una parola inglese: nome, colore, numero, pronome, verbo… quanto
// basta alle trappole per trovare il soggetto e l'aggettivo. Più plurali,
// singolari e la traduzione di una parola toccata.
import { WORDS } from '../../../data/words.js'
import { VERBI } from '../../../data/verbi.js'
import { GLOSSARIO } from '../dati/glossario.js'
import { PERSONAGGI } from '../dati/elenchi.js'
import { apostrofi } from './testo.js'

const CAT = new Map(WORDS.map(w => [w[0].toLowerCase(), w[3]]))
const IT = new Map(WORDS.map(w => [w[0].toLowerCase(), w[1]]))
const VERBO = new Map(VERBI.map(v => [v[0], v[1]]))

export const PRONOMI = new Set(['i', 'you', 'he', 'she', 'it', 'we', 'they'])
export const DIMOSTRATIVI = new Set(['this', 'that', 'these', 'those'])
export const BE = new Set(['am', 'is', 'are'])
export const AUX = new Set(['am', 'is', 'are', 'have', 'has', 'can', 'do', 'does'])
export const DET = new Set(['a', 'an', 'the', 'my', 'your', 'his', 'her', 'our', 'their',
                            'this', 'that', 'these', 'those'])
export const NOMI_PROPRI = new Set(PERSONAGGI.map(p => p.nome.toLowerCase()))

// i plurali che non finiscono con la s, e i nomi che sono già plurali
const IRREGOLARI = { mice: 'mouse', feet: 'foot', teeth: 'tooth', children: 'child',
                     men: 'man', women: 'woman', people: 'person' }
const SEMPRE_UGUALI = new Set(['fish', 'sheep', 'deer'])
const GIA_PLURALI = new Set(['trousers', 'grapes', 'glasses', 'scissors', 'fries', 'stairs',
                             'pyjamas', 'cards', 'dice'])
const IN_ES = new Set(['tomato', 'potato', 'box', 'glass', 'bus', 'dress', 'watch', 'sandwich', 'peach'])

const eNomeDi = cat => cat && !['c', 'j', 'n', 'q', 'd'].includes(cat)
export const eNome = w => eNomeDi(CAT.get(w)) || NOMI_PROPRI.has(w)
export const eColore = w => CAT.get(w) === 'c'
export const eAggettivo = w => CAT.get(w) === 'j' || CAT.get(w) === 'c'
export const eNumero = w => CAT.get(w) === 'n'
export const eVerbo = w => VERBO.has(w)

export function plurale(en) {
  if (SEMPRE_UGUALI.has(en) || GIA_PLURALI.has(en)) return en
  for (const [pl, s] of Object.entries(IRREGOLARI)) if (s === en) return pl
  if (/[^aeiou]y$/.test(en)) return en.slice(0, -1) + 'ies'
  if (IN_ES.has(en)) return en + 'es'
  return en + 's'
}

// { base, plurale } se `w` è un nome (o il plurale di un nome) di words.js
export function nomeDi(w) {
  w = w.toLowerCase()
  if (IRREGOLARI[w]) return { base: IRREGOLARI[w], plurale: true }
  if (GIA_PLURALI.has(w) && CAT.has(w)) return { base: w, plurale: true }
  if (eNomeDi(CAT.get(w))) return { base: w, plurale: false }
  for (const [coda, via] of [['ies', 'y'], ['es', ''], ['s', '']]) {
    if (!w.endsWith(coda)) continue
    const b = w.slice(0, -coda.length) + via
    if (eNomeDi(CAT.get(b)) && plurale(b) === w) return { base: b, plurale: true }
  }
  return null
}

// la chiave SRS di una parola a schermo: 'en:dog' anche per «dogs»
export function chiaveDi(parola) {
  const w = apostrofi(parola).toLowerCase()
  if (CAT.has(w) && CAT.get(w) !== 'q') return 'en:' + WORDS.find(x => x[0].toLowerCase() === w)[0]
  const n = nomeDi(w)
  if (n) return 'en:' + n.base
  if (VERBO.has(w)) return 'verbo:' + w
  return null
}

// Cosa vuol dire una parola toccata. `chiave` è null per le parole di
// struttura e per i nomi dei personaggi: quelle non hanno SRS.
export function traduci(parola) {
  const w = apostrofi(parola).toLowerCase()
  if (NOMI_PROPRI.has(w)) return { parola, chiave: null, it: 'è un nome' }
  const c = w.match(/^(\w+)(n't|'m|'re|'s|'ve)$/)
  if (c) {
    const [, testa, coda] = c
    const resto = { 'n\'t': 'not', '\'m': 'am', '\'re': 'are', '\'s': 'is / has', '\'ve': 'have' }[coda]
    const t1 = traduci(testa === 'ca' ? 'can' : testa === 'wo' ? 'will' : testa)
    return { parola, chiave: null, it: `${t1.it} + ${GLOSSARIO[resto] || resto} (${testa} ${resto})` }
  }
  const chiave = chiaveDi(w)
  if (chiave && chiave.startsWith('en:')) return { parola, chiave, it: IT.get(chiave.slice(3).toLowerCase()) }
  if (chiave) return { parola, chiave, it: VERBO.get(w) }
  if (GLOSSARIO[w]) return { parola, chiave: null, it: GLOSSARIO[w] }
  if (IT.has(w)) return { parola, chiave: null, it: IT.get(w) }
  return { parola, chiave: null, it: null }
}

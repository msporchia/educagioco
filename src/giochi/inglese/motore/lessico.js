// Che cos'è una parola inglese: nome, colore, numero, pronome, verbo… quanto
// basta alle trappole per trovare il soggetto e l'aggettivo. Più plurali,
// singolari e la traduzione di una parola toccata.
import { WORDS } from '../../../data/words.js'
import { VERBI } from '../../../data/verbi.js'
import { GLOSSARIO } from '../dati/glossario.js'
import { PERSONAGGI } from '../dati/elenchi.js'
import { apostrofi } from './testo.js'
import { flessa, VERBI_DI_STRUTTURA } from './flessioni.js'

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
export const SEMPRE_UGUALI = new Set(['fish', 'sheep', 'deer'])
const GIA_PLURALI = new Set(['trousers', 'grapes', 'glasses', 'scissors', 'fries', 'stairs',
                             'pyjamas', 'cards', 'dice'])
const IN_ES = new Set(['tomato', 'potato', 'box', 'glass', 'bus', 'dress', 'watch', 'sandwich', 'peach'])
// Le cose che non si contano: niente a/an e niente plurale («long hair»,
// «I like milk»). Servono alle trappole per non uscire sgrammaticate.
export const NON_CONTABILI = new Set(['milk', 'bread', 'cheese', 'chocolate', 'pasta', 'rice', 'soup',
  'juice', 'salad', 'hair', 'water', 'honey', 'butter', 'salt', 'tea', 'coffee', 'meat', 'popcorn',
  'rain', 'snow', 'wind', 'fog', 'ice', 'music', 'homework', 'paper', 'breakfast', 'lunch', 'dinner',
  'time', 'glue', 'paint', 'fire', 'grass', 'air', 'sky'])
// del calendario sono nomi i giorni, i mesi e le stagioni, non gli avverbi
const AVVERBI_DI_TEMPO = new Set(['today', 'tomorrow', 'yesterday', 'early', 'late'])
export const TEMPO_SOGGETTO = new Set(['today', 'tomorrow', 'yesterday'])

const eNomeDi = (cat, w = '') => !!cat && (!['c', 'j', 'n', 'q', 'd'].includes(cat) ||
                                          (cat === 'd' && !AVVERBI_DI_TEMPO.has(w)))
const eNomeW = w => eNomeDi(CAT.get(w), w)
export const eNome = w => eNomeW(w) || NOMI_PROPRI.has(w)
export const eContabile = w => !NON_CONTABILI.has(w) && !GIA_PLURALI.has(w)
// «an» davanti a una vocale che si sente (an apple, an orange; ma a uniform)
export const conAn = w => /^[aeio]/i.test(w) || /^u(?!ni|se|su)/i.test(w) || /^hour/i.test(w)
export const eColore = w => CAT.get(w) === 'c'
export const eAggettivo = w => CAT.get(w) === 'j' || CAT.get(w) === 'c'
export const eNumero = w => CAT.get(w) === 'n'
export const eVerbo = w => VERBO.has(w)
export const itDelVerbo = w => VERBO.get(w) || null

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
  if (eNomeW(w)) return { base: w, plurale: false }
  for (const [coda, via] of [['ies', 'y'], ['es', ''], ['s', '']]) {
    if (!w.endsWith(coda)) continue
    const b = w.slice(0, -coda.length) + via
    if (eNomeW(b) && plurale(b) === w) return { base: b, plurale: true }
  }
  return null
}

// la chiave SRS di una parola a schermo: 'en:dog' anche per «dogs»,
// 'verbo:go' anche per «went»
export function chiaveDi(parola) {
  const w = apostrofi(parola).toLowerCase()
  if (CAT.has(w) && CAT.get(w) !== 'q') return 'en:' + WORDS.find(x => x[0].toLowerCase() === w)[0]
  const n = nomeDi(w)
  if (n) return 'en:' + n.base
  if (VERBO.has(w)) return 'verbo:' + w
  const f = flessa(w)
  if (f && VERBO.has(f.base)) return 'verbo:' + f.base
  // bigger, the biggest: la chiave dell'aggettivo
  if (f && CAT.has(f.base)) return 'en:' + f.base
  return null
}

const COME_E = { s: '', ing: ' (-ing: adesso)', ed: ' (al passato)', irr: ' (al passato)' }
const PARAGONE = { er: it => `più ${it}`, est: it => `il più ${it}` }

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
  if (chiave && chiave.startsWith('en:')) {
    const it = IT.get(chiave.slice(3).toLowerCase())
    // «cooks» è il plurale di cook e anche he cooks: si dicono tutti e due
    const f = flessa(w)
    if (f && PARAGONE[f.come]) return { parola, chiave, it: PARAGONE[f.come](IT.get(f.base)) }
    return { parola, chiave, it: f && f.come === 's' ? `${it} / ${VERBO.get(f.base)}` : it }
  }
  // un verbo flesso si traduce con la sua base
  const f = !VERBO.has(w) && flessa(w)
  if (chiave) return { parola, chiave, it: f ? VERBO.get(f.base) + COME_E[f.come] : VERBO.get(w) }
  if (GLOSSARIO[w]) return { parola, chiave: null, it: GLOSSARIO[w] }
  if (f) return { parola, chiave: null, it: VERBI_DI_STRUTTURA[f.base] + COME_E[f.come] }
  if (IT.has(w)) return { parola, chiave: null, it: IT.get(w) }
  return { parola, chiave: null, it: null }
}

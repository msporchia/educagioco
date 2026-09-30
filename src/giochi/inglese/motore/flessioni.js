// Le forme flesse dei verbi: plays, playing, played, went. Dalla base si
// scrive la forma (`flessione`), e da una parola a schermo si risale alla
// base (`flessa`). Il libro le accetta solo dove una struttura del mondo le
// ammette (il campo `flessione` di dati/forme.js); la parola toccata le
// traduce sempre. Vedi docs/lingue/libro.md («Le forme dei verbi»).
import { VERBI } from '../../../data/verbi.js'
import { PASSATI, PASSATO_UGUALE } from '../dati/passati.js'

const PASSATO_DI = new Map(Object.entries(PASSATI).map(([p, b]) => [b, p]))

// una sillaba sola, consonante-vocale-consonante: run → running, stop → stopped
const raddoppia = b => /^[^aeiou]*[aeiou][bdgklmnprt]$/.test(b)

// s (she plays), ing (playing), ed (played), irr (went). Null se non c'è.
export function flessione(base, come) {
  if (come === 's') {
    if (base === 'have') return 'has'
    if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + 'ies'
    if (/(s|sh|ch|x|z|o)$/.test(base)) return base + 'es'
    return base + 's'
  }
  if (come === 'ing') {
    if (/ie$/.test(base)) return base.slice(0, -2) + 'ying'
    if (/[^e]e$/.test(base)) return base.slice(0, -1) + 'ing'
    return base + (raddoppia(base) ? base.slice(-1) : '') + 'ing'
  }
  if (come === 'ed') {
    if (PASSATO_DI.has(base) || PASSATO_UGUALE.has(base)) return null
    if (/e$/.test(base)) return base + 'd'
    if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + 'ied'
    return base + (raddoppia(base) ? base.slice(-1) : '') + 'ed'
  }
  if (come === 'irr') return PASSATO_DI.get(base) || null
  return null
}

export const MODI = ['s', 'ing', 'ed', 'irr']

// i verbi che arrivano con una forma e non stanno in data/verbi.js, con
// la traduzione da dare alle loro forme flesse (doing, liked, had)
export const VERBI_DI_STRUTTURA = { like: 'piacere', do: 'fare', have: 'avere' }

// ogni forma flessa dei verbi → { base, come }
const FLESSE = new Map()
for (const base of [...VERBI.map(v => v[0]), ...Object.keys(VERBI_DI_STRUTTURA)])
  for (const come of MODI) {
    const f = flessione(base, come)
    if (f && f !== base && !FLESSE.has(f)) FLESSE.set(f, { base, come })
  }

// `w` è la forma flessa di un verbo? { base, come } o null
export const flessa = w => FLESSE.get(String(w).toLowerCase()) || null

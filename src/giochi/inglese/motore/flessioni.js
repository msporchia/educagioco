// Le forme flesse dei verbi (plays, playing, played, went) e degli
// aggettivi (bigger, the biggest). Dalla base si scrive la forma
// (`flessione`), e da una parola a schermo si risale alla base (`flessa`).
// Libro e frasi le accettano solo dove una struttura le ammette (il campo
// `flessione` di dati/forme.js); la parola toccata le traduce sempre. Vedi
// docs/lingue/libro.md («Le forme dei verbi») e docs/lingue/strutture.md.
import { VERBI } from '../../../data/verbi.js'
import { WORDS } from '../../../data/words.js'
import { PASSATI, PASSATO_UGUALE } from '../dati/passati.js'

const PASSATO_DI = new Map(Object.entries(PASSATI).map(([p, b]) => [b, p]))

// una sillaba sola, consonante-vocale-consonante: run → running, stop → stopped
const raddoppia = b => /^[^aeiou]*[aeiou][bdgklmnprt]$/.test(b)

// il passato in -ed come lo scriverebbe chi non sa che è irregolare (goed, winned)
export function inEd(base) {
  if (/e$/.test(base)) return base + 'd'
  if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + 'ied'
  return base + (raddoppia(base) ? base.slice(-1) : '') + 'ed'
}

// Gli aggettivi corti prendono -er / -est (big → bigger → the biggest), i
// lunghi vogliono more / most (more beautiful): una sillaba, o due che
// finiscono in y (happy → happier). Quelli in -ed (tired) sono lunghi.
const IRREGOLARI_AGG = { good: ['better', 'best'], bad: ['worse', 'worst'] }
const sillabe = b => (b.replace(/e$/, '').match(/[aeiouy]+/g) || []).length
export const aggettivoCorto = b =>
  !!IRREGOLARI_AGG[b] || (!/ed$/.test(b) && (sillabe(b) <= 1 || (sillabe(b) === 2 && /y$/.test(b))))
function paragone(base, coda) {
  if (IRREGOLARI_AGG[base]) return IRREGOLARI_AGG[base][coda === 'er' ? 0 : 1]
  if (!aggettivoCorto(base)) return null
  if (/e$/.test(base)) return base + coda.slice(1)
  if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + 'i' + coda
  return base + (raddoppia(base) ? base.slice(-1) : '') + coda
}

// s (she plays), ing (playing), ed (played), irr (went); degli aggettivi
// er (bigger) ed est (biggest). Null se non c'è.
export function flessione(base, come) {
  if (come === 'er' || come === 'est') return paragone(base, come)
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
  if (come === 'ed') return PASSATO_DI.has(base) || PASSATO_UGUALE.has(base) ? null : inEd(base)
  if (come === 'irr') return PASSATO_DI.get(base) || null
  return null
}

export const MODI = ['s', 'ing', 'ed', 'irr']
export const MODI_AGG = ['er', 'est']

// i verbi che arrivano con una forma e non stanno in data/verbi.js, con
// la traduzione da dare alle loro forme flesse (doing, liked, had)
export const VERBI_DI_STRUTTURA = { like: 'piacere', do: 'fare', have: 'avere' }

// ogni forma flessa dei verbi e degli aggettivi (categoria j) → { base, come }
const FLESSE = new Map()
const metti = (base, modi) => {
  for (const come of modi) {
    const f = flessione(base, come)
    if (f && f !== base && !FLESSE.has(f)) FLESSE.set(f, { base, come })
  }
}
for (const base of [...VERBI.map(v => v[0]), ...Object.keys(VERBI_DI_STRUTTURA)]) metti(base, MODI)
for (const w of WORDS) if (w[3] === 'j') metti(w[0], MODI_AGG)

// `w` è la forma flessa di un verbo o di un aggettivo? { base, come } o null
export const flessa = w => FLESSE.get(String(w).toLowerCase()) || null

// tutte le forme di una base che le `flessioni` ammettono, lei compresa
export const formeDi = (base, flessioni) =>
  [base, ...[...flessioni].map(c => flessione(base, c)).filter(Boolean)].filter((x, i, a) => a.indexOf(x) === i)

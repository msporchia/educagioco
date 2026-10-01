// Le forme dei verbi spagnoli: il presente (pres), il gerundio (ger) e il
// pretérito indefinido (ind), per persona. Dalla base si scrive la forma
// (`flessione`), e da una parola a schermo si risale alla base (`flessa`).
// Libro e frasi le accettano solo dove una struttura le ammette (il campo
// `flessione` di dati/forme.js); la parola toccata le traduce sempre. Le
// irregolarità stanno in dati/irregolari.js. Vedi docs/lingue/spagnolo-motore.md.
import { VERBI_ES as VERBI } from '../../../data/verbi-es.js'
import { IRREGOLARI } from '../dati/irregolari.js'

// yo, tú, él (anche ella, usted), nosotros, ellos (anche ellas, ustedes)
export const PERSONE = ['yo', 'tú', 'él', 'nosotros', 'ellos']
export const MODI = ['pres', 'ger', 'ind']

export const eRiflessivo = base => /(ar|er|ir|ír)se$/.test(String(base).split(' ')[0])
export const senzaSe = base => (eRiflessivo(base) ? base.slice(0, -2) : base)
// la classe: -ar, -er, -ir (oír e reír sono -ir)
export const classe = base => {
  const v = senzaSe(String(base).split(' ')[0])
  return /ar$/.test(v) ? 'ar' : /er$/.test(v) ? 'er' : 'ir'
}

const DESINENZE = {
  pres: { ar: ['o', 'as', 'a', 'amos', 'an'], er: ['o', 'es', 'e', 'emos', 'en'], ir: ['o', 'es', 'e', 'imos', 'en'] },
  ind: { ar: ['é', 'aste', 'ó', 'amos', 'aron'], er: ['í', 'iste', 'ió', 'imos', 'ieron'],
         ir: ['í', 'iste', 'ió', 'imos', 'ieron'] },
}

// La forma come la scriverebbe la regola, senza guardare le irregolarità:
// la usa anche la trappola che regolarizza (hací, sabí, quero).
export function regolare(base, come, persona = 'él') {
  const [v0, ...resto] = String(base).split(' ')
  const v = senzaSe(v0)
  const cl = classe(v0)
  let r = v.slice(0, -2)
  let f
  if (come === 'ger') {
    f = cl === 'ar' ? r + 'ando' : /[aeiou]$/.test(r) ? r + 'yendo' : r + 'iendo'
  } else {
    const i = PERSONE.indexOf(persona)
    if (i < 0 || !DESINENZE[come]) return null
    let d = DESINENZE[come][cl][i]
    if (come === 'ind' && cl === 'ar' && i === 0) {
      // per tenere il suono: busqué, jugué, empecé
      if (/c$/.test(r)) r = r.slice(0, -1) + 'qu'
      else if (/g$/.test(r)) r += 'u'
      else if (/z$/.test(r)) r = r.slice(0, -1) + 'c'
    }
    // leer, caer, oír, construir: leí, leíste, leyó, leímos, leyeron
    if (come === 'ind' && cl !== 'ar' && /[aeiou]$/.test(r)) {
      const ui = /u$/.test(r)
      d = ['í', ui ? 'iste' : 'íste', 'yó', ui ? 'imos' : 'ímos', 'yeron'][i]
    }
    f = r + d
  }
  return [f, ...resto].join(' ')
}

// La forma di `base` (anche riflessiva: levantarse → levanto, il «me» è una
// parola a sé) per `come` e `persona`. Null se non c'è (llover con yo).
export function flessione(base, come, persona = 'él') {
  if (!MODI.includes(come)) return null
  const [v0, ...resto] = String(base).split(' ')
  const irr = IRREGOLARI[senzaSe(v0)]
  let f
  if (irr && irr[come]) {
    if (come === 'ger') f = irr.ger
    else {
      const i = PERSONE.indexOf(persona)
      if (i < 0) return null
      f = irr[come].split(' ')[i]
      if (f === '-') return null
    }
    f = [f, ...resto].join(' ')
  } else f = regolare(base, come, persona)
  return f
}

// I verbi che arrivano con le forme e non stanno in data/verbi-es.js, con
// la traduzione da dare alle loro forme flesse (es → essere, tengo → avere)
export const VERBI_DI_STRUTTURA = {
  ser: 'essere', estar: 'essere, stare', tener: 'avere', gustar: 'piacere', llamarse: 'chiamarsi',
  costar: 'costare', llover: 'piovere', nevar: 'nevicare', girar: 'girare', seguir: 'continuare',
  cruzar: 'attraversare', poner: 'mettere', pensar: 'pensare', conocer: 'conoscere',
}

// ogni forma flessa → [{ base, come, persona }], prima i verbi di verbi-es
// (lavar prima di lavarse: «lavo» è lavar), poi quelli di struttura
const FLESSE = new Map()
function metti(base) {
  if (/\s/.test(base)) return              // estar de pie: si riconosce da estar
  for (const come of MODI) for (const persona of come === 'ger' ? [null] : PERSONE) {
    const f = flessione(base, come, persona || 'él')
    if (!f || f === base) continue
    if (!FLESSE.has(f)) FLESSE.set(f, [])
    const l = FLESSE.get(f)
    if (!l.some(x => x.base === base && x.come === come && x.persona === persona)) l.push({ base, come, persona })
  }
}
for (const base of [...VERBI.map(v => v[0]), ...Object.keys(VERBI_DI_STRUTTURA)]) metti(base)

// `w` è la forma flessa di un verbo? { base, come, persona } (la prima) o null
export const flessa = w => (FLESSE.get(String(w).toLowerCase()) || [null])[0]
// tutte le letture di una forma: «fui» è ser e ir, «cantamos» presente e passato
export const flesse = w => FLESSE.get(String(w).toLowerCase()) || []

// tutte le forme di una base che le `flessioni` ammettono, lei compresa
export function formeDi(base, flessioni) {
  const out = [base]
  for (const come of flessioni) for (const persona of come === 'ger' ? ['él'] : PERSONE) {
    const f = flessione(base, come, persona)
    if (f && !out.includes(f)) out.push(f)
  }
  return out
}

// la persona di un soggetto in parole: ella → él, ustedes → ellos
export const PERSONA_DI = { yo: 'yo', tú: 'tú', él: 'él', ella: 'él', usted: 'él', nosotros: 'nosotros',
                            nosotras: 'nosotros', ellos: 'ellos', ellas: 'ellos', ustedes: 'ellos' }

// Il generatore delle frasi sbagliate: le operazioni che le righe di
// dati/trappole.js nominano con `fa`. Ogni operazione riceve le parole della
// frase in forma lunga e torna le alternative sbagliate con i buchi del
// perché. Da una scrittura escono tutti i formati: le opzioni di «scegli»,
// l'italiano di «cosa vuol dire», le tessere in più di «componi».
import { TRAPPOLE } from '../dati/trappole.js'
import { MAX_S } from '../../../store/srs.js'
import { PRONOMI, DIMOSTRATIVI, DET, NOMI_PROPRI, eAggettivo, eNumero, nomeDi, plurale } from './lessico.js'
import { WORDS } from '../../../data/words.js'
import { parole, normalizza, accettate, eDomanda } from './testo.js'

const low = w => (w == null ? null : String(w).toLowerCase())
const INVERTIBILI = new Set(['am', 'is', 'are', 'have', 'has', 'can'])
const IT = new Map(WORDS.map(w => [w[0].toLowerCase(), w[1]]))
const CAT = new Map(WORDS.map(w => [w[0].toLowerCase(), w[3]]))

// Il soggetto che comincia in T[i]: { a (fine esclusa), chi, persona, plurale }
export function soggetto(T, i) {
  const w = low(T[i])
  if (w == null) return null
  if (PRONOMI.has(w)) return { a: i + 1, chi: T[i], persona: w, plurale: ['we', 'they', 'you'].includes(w) }
  if (NOMI_PROPRI.has(w)) return { a: i + 1, chi: T[i], persona: 'he', plurale: false }
  // «this is», «is this your…»: this da solo è il soggetto; «this book» no
  if (DIMOSTRATIVI.has(w) && !(nomeDi(low(T[i + 1]) || '') || eAggettivo(low(T[i + 1])) || eNumero(low(T[i + 1]))))
    return { a: i + 1, chi: T[i], persona: 'it', plurale: w === 'these' || w === 'those' }
  let j = DET.has(w) ? i + 1 : i
  let tanti = false
  while (j < T.length && (eAggettivo(low(T[j])) || eNumero(low(T[j])))) {
    if (eNumero(low(T[j])) && low(T[j]) !== 'one') tanti = true
    j++
  }
  const n = j < T.length ? nomeDi(low(T[j])) : null
  if (!n) return null
  const pl = n.plurale || tanti
  return { a: j + 1, chi: T.slice(i, j + 1).join(' '), persona: pl ? 'they' : 'it', plurale: pl }
}

const alt = (T, dati = {}, it = null) => ({ T, dati, it })
const senzaPunto = it => it.replace(/\s*\?\s*$/, '')
const conPunto = it => senzaPunto(it) + '?'
const trova = (T, prova) => T.findIndex((w, i) => prova(low(w), i))

function sostituisciIt(it, coppie) {
  for (const [a, b] of coppie) {
    for (const [da, per] of [[a, b], [b, a]]) {
      const re = new RegExp(`(^|[\\s’'])${da}(?=$|[\\s?])`)
      if (re.test(it)) return it.replace(re, (_, p) => p + per)
    }
  }
  return null
}

export const OPERAZIONI = {
  giraDomanda(T, { domanda }) {
    if (!domanda || !INVERTIBILI.has(low(T[0]))) return []
    const s = soggetto(T, 1)
    if (!s) return []
    return [alt([...T.slice(1, s.a), T[0], ...T.slice(s.a)], { verbo: T[0], chi: s.chi }, x => senzaPunto(x))]
  },
  giraAffermazione(T, { domanda }) {
    if (domanda) return []
    const s = soggetto(T, 0)
    if (!s || s.a >= T.length || !INVERTIBILI.has(low(T[s.a]))) return []
    return [alt([T[s.a], ...T.slice(0, s.a), ...T.slice(s.a + 1)], { verbo: T[s.a], chi: s.chi }, x => conPunto(x))]
  },
  togliDo(T, { domanda }) {
    if (!domanda || !['do', 'does'].includes(low(T[0]))) return []
    return [alt(T.slice(1), {}, x => senzaPunto(x))]
  },
  accordo(T, { domanda }, { verbi }) {
    const insieme = verbi === 'be' ? ['am', 'is', 'are'] : ['have', 'has']
    let pos, s
    if (domanda && insieme.includes(low(T[0]))) { pos = 0; s = soggetto(T, 1) }
    else { s = soggetto(T, 0); pos = s ? s.a : -1 }
    if (!s || pos < 0 || !insieme.includes(low(T[pos]))) return []
    const giusto = low(T[pos])
    const sbagliato = verbi === 'be'
      ? (s.persona === 'i' || s.plurale ? 'is' : 'are')
      : (giusto === 'has' ? 'have' : 'has')
    if (sbagliato === giusto) return []
    const U = T.slice(); U[pos] = sbagliato
    return [alt(U, { chi: s.chi, giusto, sbagliato })]
  },
  togliSoggetto(T, { domanda }) {
    const pron = w => PRONOMI.has(w)
    if (!domanda && pron(low(T[0])) && INVERTIBILI.has(low(T[1])))
      return [alt(T.slice(1), { chi: T[0] })]
    if (domanda && INVERTIBILI.has(low(T[0])) && pron(low(T[1])))
      return [alt([T[0], ...T.slice(2)], { chi: T[1] })]
    return []
  },
  aggettivoDopo(T) {
    const i = trova(T, (w, k) => eAggettivo(w) && nomeDi(low(T[k + 1]) || ''))
    if (i < 0) return []
    const U = T.slice(); [U[i], U[i + 1]] = [U[i + 1], U[i]]
    return [alt(U, { agg: T[i], cosa: T[i + 1] })]
  },
  aggettivoPlurale(T) {
    const i = trova(T, (w, k) => eAggettivo(w) && (nomeDi(low(T[k + 1]) || '') || {}).plurale)
    if (i < 0) return []
    const U = T.slice(); U[i] = T[i] + 's'
    return [alt(U, { agg: T[i], cosa: T[i + 1] })]
  },
  pluraleSenzaS(T) {
    const i = trova(T, w => eNumero(w) && w !== 'one')
    if (i < 0) return []
    let j = i + 1
    while (j < T.length && eAggettivo(low(T[j]))) j++
    const n = nomeDi(low(T[j]) || '')
    if (!n || !n.plurale || n.base === low(T[j])) return []
    const U = T.slice(); U[j] = n.base
    return [alt(U, { numero: T[i], cosa: T[j] })]
  },
  aDavantiVocale(T) {
    const i = trova(T, w => w === 'an')
    if (i < 0) return []
    const U = T.slice(); U[i] = 'a'
    return [alt(U, { cosa: T[i + 1] })]
  },
  theGenerico(T) {
    const i = trova(T, (w, k) => w === 'like' && nomeDi(low(T[k + 1]) || ''))
    if (i < 0) return []
    return [alt([...T.slice(0, i + 1), 'the', ...T.slice(i + 1)], { cosa: T[i + 1] })]
  },
  notSenzaDo(T) {
    const i = trova(T, (w, k) => ['do', 'does'].includes(w) && low(T[k + 1]) === 'not')
    if (i < 0) return []
    return [alt([...T.slice(0, i), ...T.slice(i + 1)])]
  },
  scambia(T, _, { coppie, it, glossa }) {
    for (let i = 0; i < T.length; i++)
      for (const [a, b] of coppie)
        for (const [da, per] of [[a, b], [b, a]])
          if (low(T[i]) === da) {
            const U = T.slice(); U[i] = per
            return [alt(U, { giusto: da, sbagliato: per, itGiusto: glossa[da], itSbagliato: glossa[per] },
                        x => sostituisciIt(x, it))]
          }
    return []
  },
  togliNegazione(T) {
    const i = trova(T, w => w === 'not')
    if (i < 0) return []
    const da = ['do', 'does'].includes(low(T[i - 1])) ? i - 1 : i
    const it = x => (/(^|\s)non\s/.test(x) ? x.replace(/(^|\s)non\s/, '$1') : null)
    return [alt([...T.slice(0, da), ...T.slice(i + 1)], {}, it)]
  },
  aggiungiNegazione(T, { domanda }) {
    if (domanda || T.some(w => low(w) === 'not')) return []
    const i = trova(T, (w, k) => w === 'like' && k > 0 && ['i', 'you', 'we', 'they'].includes(low(T[k - 1])))
    if (i < 0) return []
    return [alt([...T.slice(0, i), 'do', 'not', ...T.slice(i)], {}, x => (/^(mi|ti) /.test(x) ? 'non ' + x : null))]
  },
  // una parola della stessa categoria al posto di una della frase: una
  // alternativa per ogni parola vicina che il bambino conosce
  parolaVicina(T, { vicine }) {
    if (!vicine) return []
    const out = []
    T.forEach((w, i) => {
      const lw = low(w)
      if (eNumero(lw)) return
      const n = nomeDi(lw)
      const base = n ? n.base : eAggettivo(lw) ? lw : null
      if (!base) return
      for (const v of vicine(base)) {
        if (v === base) continue
        const U = T.slice(); U[i] = n && n.plurale ? plurale(v) : v
        out.push(alt(U, { giusto: base, sbagliato: v, itGiusto: IT.get(base), itSbagliato: IT.get(v), parola: base }))
      }
    })
    return out
  },
  inserisci(T, _, { dopo, parola }) {
    const i = trova(T, w => w === dopo)
    if (i < 0) return []
    return [alt([...T.slice(0, i + 1), parola, ...T.slice(i + 1)])]
  },
  togliS(T) {
    const s = soggetto(T, 0)
    if (!s || s.plurale || s.persona === 'i' || s.persona === 'you') return []
    const v = low(T[s.a])
    if (!v || !/[^s]s$/.test(v) || INVERTIBILI.has(v) || v === 'does' || nomeDi(v)) return []
    const base = /(sh|ch|x|o)es$/.test(v) ? v.slice(0, -2) : v.slice(0, -1)
    const U = T.slice(); U[s.a] = base
    return [alt(U, { chi: s.chi, verbo: v })]
  },
  sDopoDoes(T) {
    const i = trova(T, w => w === 'does')
    if (i < 0) return []
    const s = soggetto(T, i + 1)
    if (!s || !T[s.a] || low(T[s.a]).endsWith('s')) return []
    const U = T.slice(); U[s.a] = T[s.a] + 's'
    return [alt(U, { chi: s.chi, verbo: T[s.a] })]
  },
  passatoInEd(T, _, { irregolari }) {
    const i = trova(T, w => !!irregolari[w])
    if (i < 0) return []
    const base = irregolari[low(T[i])]
    const sbagliato = base.endsWith('e') ? base + 'd' : base + 'ed'
    const U = T.slice(); U[i] = sbagliato
    return [alt(U, { base, giusto: T[i], sbagliato })]
  },
}

export const riempi = (modello, dati) => modello.replace(/\{(\w+)\}/g, (_, k) => (dati[k] ?? `{${k}}`))

// Una riga della tabella applicata a una frase (in forma lunga): le
// alternative con en, it (se l'errore ha un senso in italiano) e perché.
export function applica(riga, frase, ctx = {}) {
  const op = OPERAZIONI[riga.fa]
  if (!op) throw new Error(`trappola ${riga.id}: operazione sconosciuta ${riga.fa}`)
  const T = parole(frase.en)
  const domanda = frase.it ? eDomanda(frase) : !!ctx.domanda
  return op(T, { ...ctx, domanda }, riga.con || {}).map(a => {
    const itNuovo = typeof a.it === 'function' && frase.it ? a.it(frase.it) : null
    return {
      id: riga.id,
      en: a.T.join(' '),
      it: itNuovo && itNuovo !== frase.it ? itNuovo : null,
      perche: riempi(riga.perche, a.dati),
      pesa: riga.pesa || 'forma',
      forma: riga.forma || frase.forma || null,
      parola: a.dati.parola || null,
    }
  })
}

// Le parole vicine a una data: stessa categoria, fra quelle note
export const vicineFra = note => base => {
  const c = CAT.get(base)
  return [...note].filter(w => w !== base && CAT.get(w) === c)
}

// Tutte le trappole di una frase: generate dalla tabella (meno quelle in
// `niente`) più quelle scritte a mano; nessuna uguale alla giusta o a una
// variante, nessun doppione.
export function trappoleDi(frase, ctx = {}) {
  const giuste = new Set(accettate(frase))
  const viste = new Set()
  const out = []
  const aggiungi = t => {
    const k = normalizza(t.en)
    if (giuste.has(k) || viste.has(k)) return
    viste.add(k); out.push(t)
  }
  for (const t of frase.trappole || [])
    aggiungi({ id: 'a-mano', en: t.en, it: t.it || null, perche: t.perche,
               pesa: t.parola ? 'parola' : 'forma', forma: frase.forma, parola: t.parola || null })
  for (const riga of TRAPPOLE)
    if (!(frase.niente || []).includes(riga.id))
      for (const t of applica(riga, frase, ctx)) aggiungi(t)
  return out
}

// Ne sceglie `n`, una per riga della tabella: una forma debole fa uscire più
// spesso la sua trappola; le parole vicine riempiono, non comandano.
export function scegliTrappole(lista, n, { forzaForma = () => 0, rnd = Math.random } = {}) {
  const gruppi = new Map()
  lista.forEach((t, i) => {
    const k = t.id === 'a-mano' ? 'a-mano:' + i : t.id
    if (!gruppi.has(k)) gruppi.set(k, [])
    gruppi.get(k).push(t)
  })
  const peso = g => {
    const t = g[0]
    if (t.id === 'a-mano') return 2
    if (t.pesa === 'parola') return 0.3
    return 1 + Math.max(0, MAX_S - (t.forma ? forzaForma(t.forma) : 0))
  }
  const restano = [...gruppi.values()]
  const scelte = []
  while (scelte.length < n && restano.length) {
    const pesi = restano.map(peso)
    let r = rnd() * pesi.reduce((a, b) => a + b, 0)
    let k = restano.length - 1
    for (let i = 0; i < restano.length; i++) { r -= pesi[i]; if (r <= 0) { k = i; break } }
    const g = restano.splice(k, 1)[0]
    scelte.push(g[Math.floor(rnd() * g.length) % g.length])
  }
  return scelte
}

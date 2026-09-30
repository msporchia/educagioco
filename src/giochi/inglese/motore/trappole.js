// Il generatore delle frasi sbagliate: le operazioni che le righe di
// dati/trappole.js nominano con `fa`. Ogni operazione riceve le parole della
// frase in forma lunga e torna le alternative sbagliate con i buchi del
// perché. Da una scrittura escono tutti i formati: le opzioni di «scegli»,
// l'italiano di «cosa vuol dire», le tessere in più di «componi».
import { TRAPPOLE } from '../dati/trappole.js'
import { MAX_S } from '../../../store/srs.js'
import { PRONOMI, DIMOSTRATIVI, DET, NOMI_PROPRI, TEMPO_SOGGETTO, NON_CONTABILI, eAggettivo, eNumero,
         eVerbo, eContabile, conAn, nomeDi, plurale, itDelVerbo } from './lessico.js'
import { WORDS } from '../../../data/words.js'
import { VERBI } from '../../../data/verbi.js'
import { gruppoDi } from './grafo.js'
import { parole, normalizza, accettate, eDomanda } from './testo.js'

const low = w => (w == null ? null : String(w).toLowerCase())
const INVERTIBILI = new Set(['am', 'is', 'are', 'have', 'has', 'can'])
const WH = new Set(['what', 'where', 'how', 'who'])
const IT = new Map(WORDS.map(w => [w[0].toLowerCase(), w[1]]))
// la parola come si scrive («monday» → Monday): le parole note sono in minuscolo
const COME_SI_SCRIVE = new Map([...VERBI.map(v => [v[0], v[0]]), ...WORDS.map(w => [w[0].toLowerCase(), w[0]])])
const scritta = w => COME_SI_SCRIVE.get(low(w)) || w

// Il soggetto che comincia in T[i]: { a (fine esclusa), chi, persona, plurale }
export function soggetto(T, i) {
  const w = low(T[i])
  if (w == null) return null
  if (PRONOMI.has(w)) return { a: i + 1, chi: T[i], persona: w, plurale: ['we', 'they', 'you'].includes(w) }
  if (NOMI_PROPRI.has(w)) return { a: i + 1, chi: T[i], persona: 'he', plurale: false }
  // «there is»: il numero lo decide quello che viene dopo, e ci pensa la sua riga
  if (w === 'there') return { a: i + 1, chi: T[i], persona: 'there', plurale: null }
  if (TEMPO_SOGGETTO.has(w)) return { a: i + 1, chi: T[i], persona: 'it', plurale: false }
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
    else if (domanda && WH.has(low(T[0])) && insieme.includes(low(T[1]))) { pos = 1; s = soggetto(T, 2) }
    else { s = soggetto(T, 0); pos = s ? s.a : -1 }
    if (!s || s.persona === 'there' || pos < 0 || !insieme.includes(low(T[pos]))) return []
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
  // «where is the cat» → «where the cat is»: dopo la parola che chiede viene il verbo
  giraWh(T, { domanda }) {
    if (!domanda || !WH.has(low(T[0])) || !INVERTIBILI.has(low(T[1]))) return []
    const s = soggetto(T, 2)
    if (!s || s.persona === 'there') return []
    return [alt([T[0], ...T.slice(2, s.a), T[1], ...T.slice(s.a)], { wh: T[0], verbo: T[1] })]
  },
  // there is ↔ there are, dovunque stia there
  thereAccordo(T) {
    const i = trova(T, (w, k) => ['is', 'are'].includes(w) && (low(T[k + 1]) === 'there' || low(T[k - 1]) === 'there'))
    if (i < 0) return []
    const U = T.slice(); U[i] = low(T[i]) === 'is' ? 'are' : 'is'
    return [alt(U, { giusto: T[i], sbagliato: U[i] })]
  },
  // «c'è» detto «è»: there is → it is
  thereInIt(T) {
    const i = low(T[0]) === 'there' ? 0 : ['is', 'are'].includes(low(T[0])) && low(T[1]) === 'there' ? 1 : -1
    if (i < 0) return []
    const U = T.slice(); U[i] = 'it'
    if (low(U[i === 0 ? 1 : 0]) === 'are') return []      // «it are» non è l'errore di nessuno
    return [alt(U)]
  },
  aggettivoDopo(T) {
    const i = trova(T, (w, k) => eAggettivo(w) && nomeDi(low(T[k + 1]) || ''))
    if (i < 0) return []
    const U = T.slice(); [U[i], U[i + 1]] = [U[i + 1], U[i]]
    if (['a', 'an'].includes(low(U[i - 1]))) U[i - 1] = conAn(U[i]) ? 'an' : 'a'   // l'errore è uno solo
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
  scambia(T, _, { coppie, it = [], glossa = {}, unVerso = false }) {
    for (let i = 0; i < T.length; i++)
      for (const [a, b] of coppie)
        for (const [da, per] of (unVerso ? [[a, b]] : [[a, b], [b, a]]))
          if (low(T[i]) === da) {
            const U = T.slice(); U[i] = per
            return [alt(U, { giusto: da, sbagliato: per, itGiusto: glossa[da], itSbagliato: glossa[per] },
                        x => sostituisciIt(x, it))]
          }
    return []
  },
  togliNegazione(T) {
    const c = trova(T, w => w === 'cannot')
    if (c >= 0) {
      const U = T.slice(); U[c] = 'can'
      return [alt(U, {}, x => (/(^|\s)non\s/.test(x) ? x.replace(/(^|\s)non\s/, '$1') : null))]
    }
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
  /* Una parola dello stesso gruppo al posto di una della frase: una
     alternativa per ogni parola vicina che il bambino conosce. La frase
     resta in piedi: l'articolo si rifà (an orange), una cosa che non si
     conta non prende a/an (niente «a trousers»), e al posto di una che non
     si conta ne va una al plurale («I like milk» → «I like apples»). */
  parolaVicina(T, { vicine }) {
    if (!vicine) return []
    const out = []
    T.forEach((w, i) => {
      const lw = low(w)
      if (eNumero(lw) || DET.has(lw) || PRONOMI.has(lw)) return
      const n = nomeDi(lw)
      const verbo = !n && !eAggettivo(lw) && eVerbo(lw)
      const base = n ? n.base : eAggettivo(lw) || verbo ? lw : null
      if (!base) return
      let k = i - 1
      while (k >= 0 && eAggettivo(low(T[k]))) k--
      const art = k >= 0 && ['a', 'an'].includes(low(T[k])) ? k : -1
      for (const vicina of vicine(base)) {
        const v = low(vicina)
        if (v === base) continue
        let nuovo = scritta(v)
        if (n) {
          if (!nomeDi(v)) continue
          if (art >= 0 && !eContabile(v)) continue
          if (n.plurale) { if (NON_CONTABILI.has(v)) continue; nuovo = plurale(nuovo) }
          else if (art < 0 && NON_CONTABILI.has(base) && eContabile(v)) nuovo = plurale(nuovo)
          else if (art < 0 && !NON_CONTABILI.has(base) && NON_CONTABILI.has(v)) continue
        } else if (verbo ? !eVerbo(v) : !eAggettivo(v)) continue
        const U = T.slice(); U[i] = nuovo
        if (art >= 0) U[art] = conAn(U[art + 1]) ? 'an' : 'a'
        const it = x => IT.get(x) || itDelVerbo(x)
        out.push(alt(U, { giusto: scritta(base), sbagliato: scritta(v), itGiusto: it(base), itSbagliato: it(v),
                          parola: verbo ? null : scritta(base), verbo: verbo ? base : null }))
      }
    })
    return out
  },
  inserisci(T, _, { dopo, parola }) {
    const dopi = [].concat(dopo)
    const i = trova(T, w => dopi.includes(w))
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
      parola: a.dati.parola || a.dati.verbo || null,
      // la voce SRS su cui pesa uno sbaglio di parola (un verbo è `verbo:`)
      chiave: a.dati.verbo ? 'verbo:' + a.dati.verbo : a.dati.parola ? 'en:' + a.dati.parola : null,
    }
  })
}

// Le parole vicine a una data: stesso gruppo (l'argomento della tappa che
// la insegna, se no la categoria), fra quelle note
export const vicineFra = note => base => {
  const g = gruppoDi(base)
  return g ? [...note].filter(w => w !== low(base) && gruppoDi(w) === g) : []
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
               pesa: t.parola ? 'parola' : 'forma', forma: frase.forma, parola: t.parola || null,
               chiave: t.parola ? 'en:' + t.parola : null })
  for (const riga of TRAPPOLE)
    if (!(frase.niente || []).includes(riga.id) && (!riga.soloForme || riga.soloForme.includes(frase.forma)))
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

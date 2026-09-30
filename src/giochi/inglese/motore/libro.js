// Il libro a capitoli: tira le variabili di un capitolo, accende i rami e
// calcola le domande con le loro risposte. Le sbagliate sono le versioni
// che questa volta non sono uscite; «Non si sa» è la giusta quando il
// testo non lo dice. Il formato di un capitolo sta in docs/lingue/libro.md.
import { ELENCHI } from '../dati/elenchi.js'
import { mondoDi } from '../dati/mondi.js'
import { paroleDelLibro } from './grafo.js'
import { plurale } from './lessico.js'

export const NON_SI_SA = 'Non si sa'
export const OPZIONI_MAX = 4

// Le pagine di un capitolo: `pagine`, o le sue `frasi` come pagina sola
export const pagineDi = cap => cap.pagine || (cap.frasi ? [cap.frasi] : [])
export const frasiDelCapitolo = cap => pagineDi(cap).flat()

// La tappa da cui un capitolo si legge: la sua `dopo`, o quella prima
// della 🏁 (il capitolo si apre quando la bandiera si può giocare)
export function tappaDellaStoria(cap) {
  if (cap.dopo) return cap.dopo
  const m = mondoDi(cap.mondo)
  return m && m.tappe.length > 1 ? m.tappe[m.tappe.length - 2].id : null
}

// i valori possibili di una variabile
export function valoriDi(cap, nome) {
  const def = cap.variabili[nome]
  if (!def.da) return def.fra.slice()
  const elenco = ELENCHI[def.da]
  if (!elenco) throw new Error(`capitolo ${cap.id}: elenco sconosciuto «${def.da}»`)
  if (def.fra) return def.fra.map(en => {
    const v = elenco.find(x => x.en === en)
    if (!v) throw new Error(`capitolo ${cap.id}: «${en}» non è nell'elenco ${def.da}`)
    return v
  })
  // senza `fra`: tutto quello che il bambino conosce quando il capitolo si apre
  const note = paroleDelLibro(cap.mondo, tappaDellaStoria(cap))
  return elenco.filter(x => note.has(x.en.toLowerCase()) && (!def.dove || def.dove(x)))
}

// Tutti i mondi possibili del capitolo (le combinazioni che rispettano i vincoli)
const CACHE = new WeakMap()
export function mondiDi(cap) {
  if (CACHE.has(cap)) return CACHE.get(cap)
  let tutti = [{}]
  for (const nome of Object.keys(cap.variabili)) {
    const valori = valoriDi(cap, nome)
    tutti = tutti.flatMap(v => valori.map(x => ({ ...v, [nome]: x })))
  }
  tutti = tutti.filter(v => (cap.vincoli || []).every(f => f(v)))
  CACHE.set(cap, tutti)
  return tutti
}

export const tira = (cap, rnd = Math.random) => {
  const m = mondiDi(cap)
  return m[Math.floor(rnd() * m.length) % m.length]
}

const articolo = en => (/^[aeiou]/i.test(en) ? 'an' : 'a')
const inglese = x => (x && typeof x === 'object' ? x.en : String(x))

// {x} {x.campo} {x.pl} {a:x} {A:x}
export function rendi(modello, v) {
  return modello.replace(/\{(a|A):(\w+)\}|\{(\w+)(?:\.(\w+))?\}/g, (tutto, art, nomeA, nome, campo) => {
    if (art) {
      const en = inglese(v[nomeA])
      const a = articolo(en)
      return `${art === 'A' ? a[0].toUpperCase() + a.slice(1) : a} ${en}`
    }
    const x = v[nome]
    if (x === undefined) throw new Error(`variabile sconosciuta: ${tutto}`)
    if (!campo) return inglese(x)
    if (campo === 'pl') return x.pl || plurale(x.en)
    return String(x[campo])
  })
}

const acceso = (x, v) => !x.se || !!x.se(v)
// vero/falso si può anche dire sì/no: `etichette: ['Sì', 'No']`
const etichette = d => d.etichette || ['Vero', 'Falso']
const rispostaDi = (d, v) => {
  const r = d.tipo === 'vf' ? (d.vero(v) == null ? null : etichette(d)[d.vero(v) ? 0 : 1]) : d.risposta(v)
  return r == null || r === '' ? NON_SI_SA : r
}

// I tipi di domanda: si scrivono una volta e li usano tutti i capitoli.
// `possibili` sono le risposte che la domanda può avere, in tutti i mondi.
export const TIPI_DOMANDA = {
  scelta: {
    possibili: (d, mondi) => [...new Set([...mondi.filter(v => acceso(d, v)).map(v => rispostaDi(d, v)),
                                          ...(d.anche || [])])],
  },
  vf: {
    possibili: (d, mondi) => {
      const tutte = new Set([...etichette(d), ...(d.anche || [])])
      if (mondi.some(v => acceso(d, v) && rispostaDi(d, v) === NON_SI_SA)) tutte.add(NON_SI_SA)
      return [...tutte]
    },
  },
}

const maiuscola = s => (s ? s[0].toUpperCase() + s.slice(1) : s)

const mescola = (a, rnd) => {
  const b = a.slice()
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] }
  return b
}

const POSSIBILI = new WeakMap()      // domanda -> le sue risposte in tutti i mondi

// una domanda del capitolo nel mondo `v`: la giusta e fino a tre sbagliate
export function domandaIn(cap, d, v, rnd = Math.random) {
  const tipo = TIPI_DOMANDA[d.tipo || 'scelta']
  if (!tipo) throw new Error(`capitolo ${cap.id}: tipo di domanda sconosciuto «${d.tipo}»`)
  const giusta = rispostaDi(d, v)
  if (!POSSIBILI.has(d)) POSSIBILI.set(d, tipo.possibili(d, mondiDi(cap)))
  const sbagliate = mescola(POSSIBILI.get(d).filter(x => x !== giusta), rnd)
    .slice(0, OPZIONI_MAX - 1)
  // tutte con la maiuscola: «cinque» accanto a «Pilota» sembrava un'altra specie di risposta
  const opzioni = mescola([giusta, ...sbagliate], rnd)
    .map(testo => ({ testo: maiuscola(testo), giusta: testo === giusta }))
  return { testo: typeof d.testo === 'function' ? d.testo(v) : d.testo, opzioni, giusta }
}

// Il capitolo tirato: le pagine con le righe accese (e tutte le righe di
// seguito), e le domande con le risposte.
export function racconta(cap, v, rnd = Math.random) {
  const pagine = pagineDi(cap).map(p => p.filter(f => acceso(f, v))
    .map(f => ({ en: rendi(f.en, v), forma: f.forma || null })))
  return {
    id: cap.id, titolo: cap.titolo, mondo: cap.mondo, variabili: v, pagine, righe: pagine.flat(),
    domande: cap.domande.filter(d => acceso(d, v)).map(d => domandaIn(cap, d, v, rnd)),
  }
}

export const capitolo = (cap, rnd = Math.random) => racconta(cap, tira(cap, rnd), rnd)

// i capitoli di un mondo, dall'elenco raccolto (dati/capitoli.js)
export const capitoliDi = (tutti, mondo) => tutti.filter(c => c.mondo === mondo)

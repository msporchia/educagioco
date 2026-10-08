// Il libro a capitoli: tira le variabili di un capitolo, accende i rami e
// calcola le domande con le loro risposte. Le sbagliate sono le versioni
// che questa volta non sono uscite; «Non si sa» è la giusta quando il
// testo non lo dice. Il formato di un capitolo sta in docs/lingue/libro.md.
import { ELENCHI, CHI_PARLA, CHI_DI_CASA } from '../dati/elenchi.js'
import { mondoDi } from '../dati/mondi.js'
import { paroleDelLibro, formeDelLibro, flessioniDi, sconosciute, cassettoDi, garantiti } from './grafo.js'
import { plurale, nomeDi } from './lessico.js'
import { flessa } from './flessioni.js'

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

/* Le storie a puntate tengono le variabili per tutta la serie: nel profilo
   si salva di ogni valore una chiave che si scrive in JSON (l'`id`, l'`en`,
   o il valore stesso), e la puntata dopo tira fra i mondi che la rispettano. */
export const chiaveDelValore = x => (x && typeof x === 'object' ? String(x.id ?? x.en ?? JSON.stringify(x))
  : JSON.stringify(x))

// un mondo del capitolo con le variabili già tirate `fissi` ({ nome: chiave }); se nessuno le rispetta, uno qualunque
export function tiraConFissi(cap, fissi = {}, rnd = Math.random) {
  const dati = Object.entries(fissi).filter(([n]) => n in cap.variabili)
  const buoni = mondiDi(cap).filter(v => dati.every(([n, k]) => chiaveDelValore(v[n]) === k))
  return buoni.length ? buoni[Math.floor(rnd() * buoni.length) % buoni.length] : tira(cap, rnd)
}

/* ═══════════ le parole della storia ═══════════
   Oltre alle parole note alla sua tappa, una storia può usare le sue
   `nuove` e le parole dei 📦 cassetti del suo mondo e dei mondi prima:
   tutte insieme al massimo PAROLE_DELLA_STORIA_MAX (docs/lingue/libro-racconti.md). */
export const PAROLE_DELLA_STORIA_MAX = 8

const CASSETTI = new Map()
export function paroleDeiCassetti(mondo) {
  if (!CASSETTI.has(mondo))
    CASSETTI.set(mondo, new Set([...garantiti(mondo), mondo].flatMap(id => cassettoDi(id).chiavi)
      .map(k => k.replace(/^\w+:/, '').toLowerCase())))
  return CASSETTI.get(mondo)
}

// Quello che un capitolo sa: le parole note alla sua tappa, le forme dei verbi
// ammesse lì, e le parole che la storia può aggiungere (le nuove e i cassetti)
const LESSICI = new WeakMap()
export function lessicoDelCapitolo(cap) {
  if (LESSICI.has(cap)) return LESSICI.get(cap)
  const tappa = tappaDellaStoria(cap)
  const nuove = new Set((cap.nuove || []).map(w => String(w).toLowerCase()))
  const l = { tappa, note: paroleDelLibro(cap.mondo, tappa), flessioni: flessioniDi(formeDelLibro(cap.mondo, tappa)),
              nuove, storia: new Set([...nuove, ...paroleDeiCassetti(cap.mondo)]) }
  LESSICI.set(cap, l)
  return l
}

// la parola di base di `w` in `insieme` (children → child, shouted → shout), o null
function baseIn(w, insieme, flessioni) {
  if (insieme.has(w)) return w
  const n = nomeDi(w)
  if (n && insieme.has(n.base)) return n.base
  const f = flessa(w)
  return f && flessioni.has(f.come) && insieme.has(f.base) ? f.base : null
}

// Le parole della storia in un testo: non note alla tappa, ma nuove o di un
// cassetto. Una Map dalla parola a schermo (minuscola) alla sua base.
export function paroleDellaStoriaIn(testo, cap) {
  const l = lessicoDelCapitolo(cap)
  const out = new Map()
  for (const w of sconosciute(testo, l.note, l.flessioni)) {
    const b = baseIn(w, l.storia, l.flessioni)
    if (b) out.set(w, b)
  }
  return out
}

// le parole che il testo non può usare: né note né della storia
export function fuoriDalLessico(testo, cap) {
  const l = lessicoDelCapitolo(cap)
  return sconosciute(testo, l.note, l.flessioni).filter(w => !baseIn(w, l.storia, l.flessioni))
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
const valore = (x, v) => (typeof x === 'function' ? x(v) : x)
// vero/falso si può anche dire sì/no: `etichette: ['Sì', 'No']`
const etichette = d => d.etichette || ['Vero', 'Falso']
const rispostaDi = (d, v) => {
  const r = d.tipo === 'vf' ? (d.vero(v) == null ? null : etichette(d)[d.vero(v) ? 0 : 1]) : d.risposta(v)
  return r == null || r === '' ? NON_SI_SA : r
}

const maiuscola = s => (s ? s[0].toUpperCase() + s.slice(1) : s)

const mescola = (a, rnd) => {
  const b = a.slice()
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] }
  return b
}
// tutte con la maiuscola: «cinque» accanto a «Pilota» sembrava un'altra specie di risposta
const opzioniDi = (giusta, sbagliate, rnd) => mescola([giusta, ...sbagliate], rnd)
  .map(testo => ({ testo: maiuscola(testo), giusta: testo === giusta }))

// la riga del racconto a cui rimanda una domanda (`frase`: un id, o una funzione del mondo)
const rigaDi = (d, v, righe) => { const id = valore(d.frase, v); return righe.find(r => r.id === id) || null }

/* I tipi di domanda: si scrivono una volta e li usano tutti i capitoli.
   `possibili` sono le risposte che una domanda a scelta può avere, in
   tutti i mondi; `fai` costruisce le altre dal racconto tirato, e torna
   null se non si può fare (è un guasto: motore/guasti.js). */
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
  // «Chi l'ha detto?»: una battuta fra virgolette; le sbagliate sono gli altri
  // che parlano nella storia, e se sono meno di due la gente di casa
  chi: {
    etichetta: 'Chi l’ha detto?',
    fai(cap, d, v, righe, rnd) {
      const r = rigaDi(d, v, righe)
      if (!r || !r.chi) return null
      const altri = [...new Set(righe.filter(x => x.chi && x.chi !== r.chi).map(x => x.chi))]
      const pesca = altri.length >= 2 ? mescola(altri, rnd)
        : [...altri, ...mescola(CHI_DI_CASA.filter(k => k !== r.chi && !altri.includes(k)), rnd)]
      const giusta = CHI_PARLA[r.chi]
      return { testo: valore(d.testo, v) || '', citazione: r.en, riga: r.i, giusta,
               opzioni: opzioniDi(giusta, pesca.slice(0, OPZIONI_MAX - 1).map(k => CHI_PARLA[k]), rnd) }
    },
  },
  // «Tocca la frase che lo dice»: si risponde toccando una frase del testo
  frase: {
    etichetta: 'Tocca la frase che lo dice',
    fai(cap, d, v, righe) {
      const r = rigaDi(d, v, righe)
      return r ? { testo: valore(d.testo, v), giusta: r.i, soluzione: r.en, pagina: r.pagina } : null
    },
  },
  // «Metti in ordine»: i fatti in italiano, scritti nell'ordine giusto, si mettono in fila a tocchi
  ordine: {
    etichetta: 'Metti in ordine',
    fai(cap, d, v, righe, rnd) {
      const fatti = (d.fatti || []).map(f => valore(f, v)).filter(Boolean).map(maiuscola)
      if (fatti.length < 2) return null
      let tessere = mescola(fatti.map((testo, id) => ({ id, testo })), rnd)
      // mai già in ordine: sarebbe una domanda con la risposta data
      if (tessere.every((t, i) => t.id === i)) tessere = [...tessere.slice(1), tessere[0]]
      return { testo: valore(d.testo, v) || 'Metti in ordine i fatti della storia.', formato: 'monta', tessere,
               soluzione: fatti }
    },
  },
}

const POSSIBILI = new WeakMap()      // domanda -> le sue risposte in tutti i mondi

// Una domanda del capitolo nel mondo `v`: a scelta, la giusta e fino a tre
// sbagliate; gli altri tipi dal racconto tirato (`righe`, con `id` e `i`).
export function domandaIn(cap, d, v, rnd = Math.random, righe = []) {
  const nome = d.tipo || 'scelta'
  const tipo = TIPI_DOMANDA[nome]
  if (!tipo) throw new Error(`capitolo ${cap.id}: tipo di domanda sconosciuto «${d.tipo}»`)
  if (tipo.fai) {
    const fatta = tipo.fai(cap, d, v, righe, rnd)
    return fatta && { tipo: nome, etichetta: tipo.etichetta, ...fatta }
  }
  const giusta = rispostaDi(d, v)
  if (!POSSIBILI.has(d)) POSSIBILI.set(d, tipo.possibili(d, mondiDi(cap)))
  const sbagliate = mescola(POSSIBILI.get(d).filter(x => x !== giusta), rnd)
    .slice(0, OPZIONI_MAX - 1)
  return { tipo: nome, testo: valore(d.testo, v), opzioni: opzioniDi(giusta, sbagliate, rnd), giusta }
}

// È giusta? A scelta, vero/falso e «chi» si risponde con l'indice dell'opzione;
// «frase» con l'indice della riga toccata; «ordine» con gli id nell'ordine messo.
export function eGiusta(dom, risposta) {
  if (dom.tipo === 'frase') return risposta === dom.giusta
  if (dom.tipo === 'ordine')
    return Array.isArray(risposta) && risposta.length === dom.soluzione.length && risposta.every((id, i) => id === i)
  return !!(dom.opzioni && dom.opzioni[risposta] && dom.opzioni[risposta].giusta)
}

// la risposta giusta nella forma che `eGiusta` si aspetta: serve al tasto «salta» dei grandi
export function rispostaGiusta(dom) {
  if (dom.tipo === 'frase') return dom.giusta
  if (dom.tipo === 'ordine') return dom.soluzione.map((_, i) => i)
  return (dom.opzioni || []).findIndex(o => o.giusta)
}

// chi dice una frase nel mondo `v`: una chiave di CHI_PARLA, o null se è narrazione
export const chiDi = (f, v) => (typeof f.chi === 'function' ? f.chi(v) : f.chi) || null

// Le righe di una pagina a blocchi: la narrazione di seguito, e ogni battuta
// a sé, con più frasi di fila della stessa persona in una battuta sola;
// «Nella puntata prima…» (`riassunto`) è un blocco suo.
export function blocchiDi(righe) {
  const out = []
  for (const r of righe) {
    const ultimo = out[out.length - 1]
    if (ultimo && ultimo.chi === r.chi && !ultimo.riassunto && !r.riassunto) ultimo.righe.push(r)
    else out.push({ chi: r.chi, nome: r.chi ? CHI_PARLA[r.chi] || r.chi : null, righe: [r],
                    ...(r.riassunto ? { riassunto: true } : {}) })
  }
  return out
}

// Il capitolo tirato: le pagine con le righe accese (e tutte le righe di
// seguito, ognuna col suo indice `i` e la sua `pagina`), le stesse a blocchi
// di chi parla, le domande con le risposte, e le parole della storia che
// vanno a schermo (`storia`, in minuscolo).
export function racconta(cap, v, rnd = Math.random) {
  let i = 0
  const pagine = pagineDi(cap).map((p, pagina) => p.filter(f => acceso(f, v)).map(f => {
    const chi = chiDi(f, v)
    return { en: rendi(f.en, v), forma: f.forma || null, chi, nome: chi ? CHI_PARLA[chi] || chi : null,
             id: f.id || null, riassunto: !!f.riassunto, pagina, i: i++ }
  }))
  const righe = pagine.flat()
  const storia = new Set(righe.flatMap(r => [...paroleDellaStoriaIn(r.en, cap).keys()]))
  return {
    id: cap.id, titolo: cap.titolo, mondo: cap.mondo, serie: cap.serie || null, puntata: cap.puntata || null,
    variabili: v, pagine, righe, blocchi: pagine.map(blocchiDi), storia: [...storia],
    domande: cap.domande.filter(d => acceso(d, v)).map(d => domandaIn(cap, d, v, rnd, righe)).filter(Boolean),
  }
}

export const capitolo = (cap, rnd = Math.random) => racconta(cap, tira(cap, rnd), rnd)

// i capitoli di un mondo, dall'elenco raccolto (dati/capitoli.js)
export const capitoliDi = (tutti, mondo) => tutti.filter(c => c.mondo === mondo)

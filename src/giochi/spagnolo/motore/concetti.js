// I concetti di una struttura (dati/concetti.js): a quale appartiene una
// frase, quali presenta una tappa, gli esempi in pezzi per la pagina, e i
// controlli sul dato. Vedi docs/lingue/concetti.md.
import { CONCETTI } from '../dati/concetti.js'
import { FRASI } from '../dati/frasi.js'
import { TAPPE } from '../dati/mondi.js'
import { paroleNote, flessioniNote, sconosciute } from './grafo.js'
import { eDomanda } from './testo.js'

// le giuste di fila su un concetto prima del concetto dopo, e gli sbagli che riportano la sua pagina
export const PER_CONCETTO = 3
export const SBAGLI_PER_LA_PAGINA = 5

const PER_ID = new Map(Object.values(CONCETTI).flat().map(c => [c.id, c]))
export const concetto = id => PER_ID.get(id) || null

// il concetto di una frase: il primo che la prende, se no quello senza `prende`
export function concettoDellaFrase(f) {
  const lista = CONCETTI[f.forma]
  if (!lista) return null
  const vista = { es: f.es.toLowerCase(), domanda: eDomanda(f) }
  return lista.find(c => c.prende && c.prende(vista)) || lista.find(c => !c.prende) || null
}
const DELLA_FRASE = new Map(FRASI.map(f => [f.id, concettoDellaFrase(f)]))
export const concettoDi = idFrase => DELLA_FRASE.get(idFrase) || null

// quelli che una tappa di frasi presenta, nell'ordine delle sue forme
export const concettiDellaTappa = tappa =>
  tappa && tappa.frasi ? (tappa.forme || []).flatMap(f => CONCETTI[f] || []) : []

export const frasiDelConcetto = (id, tappaId) =>
  FRASI.filter(f => f.tappa === tappaId && DELLA_FRASE.get(f.id)?.id === id)

// «[una] vaca negra» → [{ testo: 'una', forte: true }, { testo: ' vaca negra' }]
export function inPezzi(es) {
  return es.split(/(\[[^\]]*\])/).filter(Boolean)
    .map(p => (p.startsWith('[') ? { testo: p.slice(1, -1), forte: true } : { testo: p }))
}
const senzaQuadre = es => es.replace(/[[\]]/g, '')

// La pagina da mostrare: la prima volta presenta il concetto; `ripresa`
// quando torna dopo gli sbagli, con la frase appena sbagliata (`giustaEra`).
export function paginaDi(id, { ripresa = false, giustaEra = null } = {}) {
  const c = concetto(id)
  if (!c) return null
  return { genere: 'pagina', concetto: c.id, titolo: c.titolo, spiega: c.spiega, ripresa, giustaEra,
           esempi: c.esempi.map(([es, it]) => ({ pezzi: inPezzi(es), it })) }
}

// Il dato si controlla da solo (lo fa girare il test dei contenuti dello spagnolo).
export function guastiDeiConcetti() {
  const g = []
  for (const [forma, lista] of Object.entries(CONCETTI)) {
    if (lista.filter(c => !c.prende).length > 1) g.push(`${forma}: più di un concetto senza prende`)
    for (const c of lista) {
      if (!c.id.startsWith(forma + ':')) g.push(`${c.id}: l'id comincia con la sua forma (${forma}:)`)
      if (!c.titolo || !c.spiega) g.push(`${c.id}: manca titolo o spiega`)
      if (!c.esempi || c.esempi.length < 2) g.push(`${c.id}: servono due esempi`)
      for (const [es, it] of c.esempi || []) if (!es || !it) g.push(`${c.id}: un esempio senza es o it`)
      if (!(c.esempi || []).some(([es]) => /\[[^\]]+\]/.test(es))) g.push(`${c.id}: nessun esempio segna cosa cambia`)
    }
  }
  if (PER_ID.size !== Object.values(CONCETTI).flat().length) g.push('due concetti con lo stesso id')
  for (const t of TAPPE.filter(x => x.frasi)) {
    for (const forma of t.forme) if (!CONCETTI[forma]) g.push(`${t.id}: la forma ${forma} non ha concetti`)
    const note = paroleNote(t.mondo, t.id)
    const flessioni = flessioniNote(t.mondo, t.id)
    for (const c of concettiDellaTappa(t)) {
      const n = frasiDelConcetto(c.id, t.id).length
      if (n < PER_CONCETTO) g.push(`${c.id}: ${n} frasi in ${t.id}, ne servono ${PER_CONCETTO}`)
      for (const [es] of c.esempi) {
        const ignote = sconosciute(senzaQuadre(es), note, flessioni)
        if (ignote.length) g.push(`${c.id}: nell'esempio parole non ancora note a ${t.id}: ${ignote.join(', ')}`)
      }
    }
  }
  for (const f of FRASI) {
    const c = DELLA_FRASE.get(f.id)
    if (CONCETTI[f.forma] && !c) g.push(`frase ${f.id}: nessun concetto della sua forma la prende`)
  }
  return g
}

// La fila delle tessere di «componi», come dato: cosa c'è nel banco, cosa
// nella fila, quando si può consegnare e, dopo uno sbaglio, quali tessere
// colorare. Le tessere si toccano e basta: toccata nel banco va in fondo
// alla fila (in «completa», nel primo buco vuoto), toccata nella fila torna
// nel banco. Vedi docs/lingue/mondi.md («La vista»).
import { inBella } from './testo.js'

const minuscolo = s => String(s || '').toLowerCase()

// la fila è un elenco di id; in «completa» ha un posto per buco (null = vuoto)
export function filaVuota(d) {
  if (d.formato !== 'completa') return []
  return d.righe.filter(r => r.buco !== undefined).map(() => null)
}

export const nelBanco = (d, fila) => d.tessere.filter(t => !fila.includes(t.id))

export function metti(d, fila, id) {
  if (fila.includes(id)) return fila
  if (d.formato !== 'completa') return [...fila, id]
  const i = fila.indexOf(null)
  if (i < 0) return fila
  const f = fila.slice(); f[i] = id
  return f
}

export function togli(d, fila, id) {
  if (d.formato !== 'completa') return fila.filter(x => x !== id)
  return fila.map(x => (x === id ? null : x))
}

// monta e completa vogliono tutto al suo posto; scegli e monta non dice
// quante ne vanno (sarebbe regalare la lunghezza): basta una tessera
export function pronta(d, fila) {
  if (d.formato === 'completa') return fila.length > 0 && fila.every(x => x !== null)
  if (d.formato === 'monta') return fila.length === d.tessere.length
  return fila.length > 0
}

// quello che si risponde al motore: gli id in ordine (in completa, dei buchi)
export const risposta = fila => fila.filter(x => x !== null)

const testoDi = (d, id) => (d.tessere.find(t => t.id === id) || {}).testo

// le caselle da mostrare, in ordine: parole fisse e tessere (o buchi vuoti),
// con la maiuscola in testa; se la frase è una domanda ¿ in testa (`apre`) e
// ? in coda (`punto`), se no il punto. I segni non sono tessere.
export function caselle(d, fila) {
  let out
  if (d.formato === 'completa') {
    let k = 0
    out = d.righe.map(r => {
      if (r.buco === undefined) return { fisso: true, testo: r.testo }
      const id = fila[k]
      return { buco: k++, id, testo: id == null ? '' : testoDi(d, id) }
    })
  } else out = fila.map(id => ({ id, testo: testoDi(d, id) }))
  const primo = out.find(c => c.testo)
  if (primo && primo === out[0]) out[0] = { ...out[0], testo: inBella(out[0].testo) }
  return { caselle: out, apre: d.domandaIt ? '¿' : '', punto: d.domandaIt ? '?' : '.' }
}

// Dopo uno sbaglio: gli id delle tessere della fila da colorare. Prima le
// tessere in più (non stanno nella frase giusta); se non ce ne sono, quelle
// fuori posto. Si guarda la soluzione come parole, senza maiuscole.
export function sbagliate(d, fila) {
  const sol = d.soluzione.map(minuscolo)
  if (d.formato === 'completa') {
    const posti = d.righe.map((r, i) => (r.buco === undefined ? -1 : i)).filter(i => i >= 0)
    return fila.filter((id, k) => id !== null && minuscolo(testoDi(d, id)) !== sol[posti[k]])
  }
  const ids = risposta(fila)
  const resto = sol.slice()
  const inPiu = []
  for (const id of ids) {
    const i = resto.indexOf(minuscolo(testoDi(d, id)))
    if (i < 0) inPiu.push(id)
    else resto.splice(i, 1)
  }
  if (inPiu.length) return inPiu
  return ids.filter((id, i) => minuscolo(testoDi(d, id)) !== sol[i])
}

// Dove va una tessera nella frase giusta (per chi gioca da script: il test
// la legge da `data-posto`). null per le tessere in più.
export function postoDi(d, id) {
  if (d.formato === 'completa') {
    const i = id                                    // in completa l'id è l'indice nella frase
    return d.righe[i] && d.righe[i].buco !== undefined ? d.righe[i].buco : null
  }
  return id < d.soluzione.length ? id : null
}

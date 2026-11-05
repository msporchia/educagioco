// Le conversioni: quanti scalini fra due unità, la riga del cartellone e
// la chiave che segue il motore di apprendimento.
import { VALE, famigliaDi } from '../dati/misure.js'

// quanti scalini ci sono fra due unità della stessa famiglia: positivo se si scende
export function scalini(da, a) {
  const f = famigliaDi(da)
  if (!f || !f.scala.includes(a)) return null
  return f.scala.indexOf(a) - f.scala.indexOf(da)
}

// `pozioni:kg-g` e `pozioni:g-kg` sono due cose diverse da sapere
export const chiaveDi = (da, a) => (da === a ? null : `pozioni:${da}-${a}`)

// sempre dalla grande alla piccola («1 hg = 100 g»), anche quando la
// conversione da fare è al contrario: è la riga del cartellone
export function regola(da, a) {
  const n = scalini(da, a)
  if (n == null || n === 0) return null
  const [grande, piccola] = n > 0 ? [da, a] : [a, da]
  return `1 ${grande} = ${VALE[grande] / VALE[piccola]} ${piccola}`
}

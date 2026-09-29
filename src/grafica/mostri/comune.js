// Occhi comuni agli otto mostri nuovi: implementazione duplicata rispetto a
// `occhi()` di corpi-mostri.js, da unificare (vedi docs/castello/da-fare.md).
export function occhi(p, s, largo = 2.4, arrabbiato = false) {
  for (const v of [-1, 1]) {
    p.cerchio(v * largo * s, -1.6 * s, 2.1 * s, '#fff')
    p.cerchio(v * largo * s + 0.3 * s, -1.2 * s, 1 * s, '#1b1430')
  }
  if (!arrabbiato) return
  for (const v of [-1, 1])
    p.linea([{ x: v * largo * s - v * 2 * s, y: -4.6 * s },
             { x: v * largo * s + v * 1.4 * s, y: -3.4 * s }], '#1b1430', 1.1 * s)
}

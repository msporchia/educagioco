/* ═══════════════════════════════════════════════════════════════════
   IL FONDO COMUNE DEGLI OTTO MOSTRI NUOVI

   In `grafica/castello/bestie.js` c'è già un `occhi()` che fa la
   stessa cosa — due occhi tondi, arrabbiati se serve — ma questo
   cantiere non importa `grafica/castello.js`: tre altri agenti ci
   stanno lavorando in parallelo proprio adesso (vedi
   `docs/castello-riassetto.md`) e quel file potrebbe cambiare forma
   sotto i piedi. Questa è quindi un'implementazione indipendente
   dello stesso disegno, scritta con `p.cerchio` e `p.linea` invece
   che con `ctx` nudo. Quando le due famiglie di mostri si
   aggancieranno, una delle due funzioni potrà sparire.
   ═══════════════════════════════════════════════════════════════════ */
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

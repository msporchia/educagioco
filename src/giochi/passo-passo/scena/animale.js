// Le misure dell'animale che salta sulla mappa e il suo saltello: le usano il
// segnalino (viste/segnalino.js), i due mondi dipinti (scena/valle.js) e i
// test. Puro, gira in Node. Vedi docs/passo-passo/mappa.md, «Il segnalino».

export const ANIMALE = { largo: 52, alto: 52, piede: 8 }   // il piede affonda un poco nel bordo della casella
export const SENTIERO = 1.35        // la casella di un sentiero senza fine, rispetto alle altre
export const SENTIERO_CANE = 'senza-fine-cane'   // l'id della casella del sentiero del cane, sul pascolo della valle

// l'animale a una frazione q di un salto: dove sta e come si schiaccia
export function arco(p, q0, q, alto) {
  const t = Math.max(0, Math.min(1, q))
  const x = p.x + (q0.x - p.x) * t
  const y = p.y + (q0.y - p.y) * t - alto * 4 * t * (1 - t)
  // si schiaccia per partire e per atterrare, si allunga in aria
  const molla = t < 0.14 ? 1 - (0.14 - t) * 1.4 : t > 0.88 ? 1 - (t - 0.88) * 1.2 : 1 + 0.1 * Math.sin(Math.PI * t)
  return { x, y, sy: molla, sx: 2 - molla }
}

// I comandi col dito degli asteroidi (docs/asteroidi/grafica-3d.md): quale sasso si è
// toccato, se un falso tocca la nave, a che quota nascono i falsi. Puro, gira in Node.

// un tocco vale per un sasso se cade sopra di lui o appena fuori dal bordo; mai sotto
// `minimo` pixel di raggio, se no un sasso piccolo non si prende col pollice
export const TOCCO = { bordo: 1.15, minimo: 22 }

// il sasso vivo più vicino al dito, se il dito è sopra di lui; se no null (si guida e basta)
export function sassoSotto(asteroidi, x, y, tocco = TOCCO) {
  let preso = null, vicino = Infinity
  for (const a of asteroidi) {
    if (a.morto) continue
    const d = Math.hypot(x - a.x, y - a.y)
    if (d <= Math.max(tocco.minimo, a.r * tocco.bordo) && d < vicino) { preso = a; vicino = d }
  }
  return preso
}

// un sasso tocca la nave: i due tondi si sovrappongono (la nave è un po' più stretta del suo raggio)
export const toccaLaNave = (a, nave) => Math.hypot(a.x - nave.x, a.y - nave.y) < a.r * 0.9 + nave.r * 0.95

/* Le quote dei falsi, in passi: prima i dispari poi i pari (1, 3, 0, 2, 4), così due
   falsi che nascono uno dopo l'altro — in colonne vicine — non sono mai a quote vicine,
   e fra loro resta un varco per la nave. Con tre falsi o meno non sempre si può. */
export function ordineFalsi(n) {
  const quote = Array.from({ length: Math.max(0, n) }, (_, j) => j)
  return [...quote.filter(j => j % 2), ...quote.filter(j => !(j % 2))]
}

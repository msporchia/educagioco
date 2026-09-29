// { che:'orologio', ore, minuti, numeri }: numeri:'quarti' mostra solo 12/3/6/9 (com'è metà degli orologi veri), false li toglie tutti (nessun grado lo usa: illeggibile)
const GIRO = Math.PI * 2

export function orologio(p, { ore = 12, minuti = 0, numeri = true }) {
  const cx = 50, cy = 50, r = 44

  p.cerchio(cx, cy, r, '#c9d4ee')            // la cassa
  p.cerchio(cx, cy, r - 3, '#f8fbff')        // il quadrante

  for (let i = 0; i < 60; i++) { // 60 tacche, quelle delle ore più marcate
    const a = (i / 60) * GIRO
    const grossa = i % 5 === 0
    const fuori = r - 6, dentro = r - (grossa ? 12 : 9)
    p.linea(
      [{ x: cx + Math.sin(a) * dentro, y: cy - Math.cos(a) * dentro },
       { x: cx + Math.sin(a) * fuori, y: cy - Math.cos(a) * fuori }],
      grossa ? '#7d8cb4' : '#c3cde6', grossa ? 2 : 1)
  }

  if (numeri) {
    for (let n = 1; n <= 12; n++) {
      if (numeri === 'quarti' && n % 3) continue
      const a = (n / 12) * GIRO
      p.testo(String(n), cx + Math.sin(a) * (r - 18), cy - Math.cos(a) * (r - 18), '#22304f', 9, 800)
    }
  }

  // aOre tiene conto anche dei minuti: alle 3 e mezza sta fra il 3 e il 4
  const aOre = ((ore % 12) + minuti / 60) / 12 * GIRO
  const aMin = (minuti % 60) / 60 * GIRO
  p.in(cx, cy, q => q.linea([{ x: 0, y: 5 }, { x: 0, y: -20 }], '#22304f', 5), aOre)
  p.in(cx, cy, q => q.linea([{ x: 0, y: 7 }, { x: 0, y: -30 }], '#d8574f', 3.4), aMin)
  p.cerchio(cx, cy, 3.2, '#22304f')
}

export const PITTORI_OROLOGIO = { orologio }

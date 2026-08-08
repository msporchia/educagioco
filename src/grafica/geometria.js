/* ═══════════════════════════════════════════════════════════════════
   GEOMETRIA DI UN TRACCIATO

   Matematica e basta: non sa cosa sia una torre né un pixel. Serve al
   gioco (dove si trova un nemico dopo tot metri, da che parte è il
   fianco della strada) e serve al disegno (dove passa la curva), ed è
   l'unico posto dove queste due cose devono essere d'accordo.
   ═══════════════════════════════════════════════════════════════════ */

export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

/* Chaikin: taglia gli angoli della spezzata, due punti nuovi per lato
   a ogni giro. Il risultato è ancora una spezzata — quindi camminarci
   sopra costa quanto prima — ma fatta di segmenti così corti da
   sembrare una curva. Gli spigoli erano il motivo per cui la strada
   pareva un tubo piegato con le mani. */
export function smussa(punti, giri = 3) {
  let p = punti
  for (let k = 0; k < giri; k++) {
    const out = [p[0]]
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1]
      out.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 },
               { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 })
    }
    out.push(p[p.length - 1])
    p = out
  }
  return p
}

/* Un tracciato percorribile: i suoi punti, quanto è lungo, dove si sta
   dopo `d`, e da che parte guarda il suo fianco lì. */
export function tracciato(punti) {
  let lunghezza = 0
  for (let i = 1; i < punti.length; i++) lunghezza += dist(punti[i - 1], punti[i])

  function puntoA(d) {
    let r = Math.max(0, Math.min(d, lunghezza))
    for (let i = 1; i < punti.length; i++) {
      const seg = dist(punti[i - 1], punti[i])
      if (r <= seg) {
        const t = seg ? r / seg : 0
        return { x: punti[i - 1].x + (punti[i].x - punti[i - 1].x) * t,
                 y: punti[i - 1].y + (punti[i].y - punti[i - 1].y) * t }
      }
      r -= seg
    }
    return punti[punti.length - 1]
  }

  /* la perpendicolare al cammino, normalizzata: serve a mettere le cose
     *di fianco* alla strada senza rifare i conti ogni volta */
  function normaleA(d, passo = 8) {
    const a = puntoA(d), b = puntoA(d + passo)
    const nx = -(b.y - a.y), ny = b.x - a.x
    const L = Math.hypot(nx, ny) || 1
    return { x: nx / L, y: ny / L }
  }

  /* i punti a distanza regolare: chi deve seminare ghiaia o cercare la
     distanza dalla strada li vuole già pronti */
  function campiona(passo) {
    const out = []
    for (let d = 0; d <= lunghezza; d += passo) out.push(puntoA(d))
    return out
  }

  return { punti, lunghezza, puntoA, normaleA, campiona,
           fine: punti[punti.length - 1], inizio: punti[0] }
}

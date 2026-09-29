// Geometria di un tracciato: matematica pura, l'unico posto dove gioco e disegno devono essere d'accordo.
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

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

  // perpendicolare al cammino, normalizzata: per mettere le cose di fianco alla strada
  function normaleA(d, passo = 8) {
    const a = puntoA(d), b = puntoA(d + passo)
    const nx = -(b.y - a.y), ny = b.x - a.x
    const L = Math.hypot(nx, ny) || 1
    return { x: nx / L, y: ny / L }
  }

  function campiona(passo) {
    const out = []
    for (let d = 0; d <= lunghezza; d += passo) out.push(puntoA(d))
    return out
  }

  return { punti, lunghezza, puntoA, normaleA, campiona,
           fine: punti[punti.length - 1], inizio: punti[0] }
}

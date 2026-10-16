// Il mondo a pezzi (puro): un pezzo è un riquadro di 32×28 celle (la griglia 5×5 del mondo, una regione di misura), e di ogni
// pezzo si sa cosa ci sta (le case, i campi, il decoro, i posti, i ponti, le grate). Si costruiscono i nove attorno all'eroe, al
// più uno per fotogramma, il più vicino prima; si buttano quando sono a due pezzi di distanza. Il resto lo disegna il mondo
// lontano (lontano.js), a dettaglio basso. Il perché: docs/sotterraneo/grafica-3d.md, «Il mondo di sopra».

export const PEZZO = { largo: 32, alto: 28 }

export function grigliaDi(m) {
  const nx = Math.ceil(m.W / PEZZO.largo), nz = Math.ceil(m.H / PEZZO.alto)
  return { nx, nz, n: nx * nz }
}
// il pezzo di un punto (in celle)
export function pezzoDi(m, x, z) {
  const { nx, nz } = grigliaDi(m)
  const i = Math.min(nx - 1, Math.max(0, Math.floor(x / PEZZO.largo))), j = Math.min(nz - 1, Math.max(0, Math.floor(z / PEZZO.alto)))
  return j * nx + i
}
export const rettangoloDi = (m, p) => {
  const { nx } = grigliaDi(m), i = p % nx, j = Math.floor(p / nx)
  const x0 = i * PEZZO.largo, z0 = j * PEZZO.alto
  return { i, j, x0, z0, x1: Math.min(m.W, x0 + PEZZO.largo), z1: Math.min(m.H, z0 + PEZZO.alto) }
}
// quanto dista un pezzo da un altro, a scacchiera (0 lo stesso, 1 uno dei vicini)
export function distanzaPezzi(m, a, b) {
  const { nx } = grigliaDi(m)
  return Math.max(Math.abs((a % nx) - (b % nx)), Math.abs(Math.floor(a / nx) - Math.floor(b / nx)))
}

// i nove attorno all'eroe, dal più vicino (al centro del pezzo) al più lontano
export function pezziAttorno(m, x, z) {
  const { nx, nz } = grigliaDi(m), q = pezzoDi(m, x, z), i0 = q % nx, j0 = Math.floor(q / nx), l = []
  for (let j = j0 - 1; j <= j0 + 1; j++) for (let i = i0 - 1; i <= i0 + 1; i++) {
    if (i < 0 || j < 0 || i >= nx || j >= nz) continue
    const p = j * nx + i, r = rettangoloDi(m, p)
    l.push({ p, d: Math.hypot((r.x0 + r.x1) / 2 - x, (r.z0 + r.z1) / 2 - z) })
  }
  return l.sort((a, b) => a.d - b.d).map(v => v.p)
}
// cosa fare a questo fotogramma: il prossimo da costruire (o null) e quelli da buttare (a due pezzi o più dall'eroe)
export function lavoroDeiPezzi(m, costruiti, x, z) {
  const qui = pezzoDi(m, x, z)
  const butta = [...costruiti].filter(p => distanzaPezzi(m, p, qui) >= 2)
  const costruisci = pezziAttorno(m, x, z).find(p => !costruiti.has(p)) ?? null
  return { costruisci, butta }
}

// cosa sta in ogni pezzo: ogni cosa va nel pezzo del suo centro (una casa sul confine sta tutta in uno)
export function dividiPerPezzo(m) {
  const { n } = grigliaDi(m)
  const pezzi = Array.from({ length: n }, () => ({ case: [], campi: [], decoro: [], posti: [], ponti: [], grate: [] }))
  const metti = (lista, cosa, x, z) => pezzi[pezzoDi(m, x, z)][lista].push(cosa)
  for (const c of m.case) metti('case', c, c.x + c.w / 2, c.y + c.h / 2)
  for (const c of m.campi) metti('campi', c, c.x + c.w / 2, c.y + c.h / 2)
  for (const d of m.decoro) metti('decoro', d, d.x, d.y)
  for (const p of m.posti) if (p.tipo !== 'citta') metti('posti', p, p.x + p.w / 2, p.y + p.h / 2)
  for (const q of m.passaggi) {
    const c = q.celle || []
    if (!c.length) continue
    const cx = c.reduce((s, v) => s + v.x, 0) / c.length + 0.5, cz = c.reduce((s, v) => s + v.y, 0) / c.length + 0.5
    if (q.tipo === 'ponte') metti('ponti', q, cx, cz)
    if (q.conGrata) metti('grate', q, cx, cz)
  }
  return pezzi
}

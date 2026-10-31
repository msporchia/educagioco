// Il palco dello scontro sul pavimento vero: l'eroe a sinistra e i mostri a colonne a destra (viste/campo.js),
// dove il pavimento lo lascia, con almeno AGIO celle dai muri, dalle colonne e dalle cose posate. Si provano quattro formazioni
// (orizzontale, specchiata, in piedi) col centro spostato fino a quattro celle verso lo spazio libero, mai di là da un muro (solo
// celle a cui si arriva camminando); dove non basta, i muri alti alle spalle si abbassano a parapetto (`abbassa`). Solo disegno:
// il motore non sa dove stanno. Puro, senza three: unita/sotterraneo-3d.
import { AGIO, POSTI } from './costanti.js'

// `pianta` (scena3d/pianta.js), `ingombri`: le celle con una cosa posata (arredo, relitti), `eroe` e `mostri`: dove stanno ({ x, z },
// `grande` per il mostro grosso)
export function disponiPalco(pianta, ingombri, eroe, mostri) {
  const libera = (x, z) => pianta.calpestabile(Math.floor(x), Math.floor(z)) && !ingombri.has(pianta.id(Math.floor(x), Math.floor(z)))
  const o = mostri[0] || { x: eroe.x + 1, z: eroe.z }
  const cx0 = (eroe.x + o.x) / 2, cz0 = (eroe.z + o.z) / 2
  // quanto spazio libero c'è attorno a un punto, fino a 3 celle
  const agio = (x, z) => {
    let d = 3
    for (let y = Math.floor(z) - 3; y <= Math.floor(z) + 3; y++) for (let k = Math.floor(x) - 3; k <= Math.floor(x) + 3; k++) {
      if (libera(k + 0.5, y + 0.5)) continue
      d = Math.min(d, Math.hypot(Math.max(k - x, 0, x - k - 1), Math.max(y - z, 0, z - y - 1)))
    }
    return d
  }
  // dove si arriva camminando dall'eroe (nove passi): il palco non salta un muro
  const ex = Math.floor(eroe.x), ez = Math.floor(eroe.z)
  const passi = new Map([[pianta.id(ex, ez), 0]]), coda = [[ex, ez]]
  for (let i = 0; i < coda.length; i++) {
    const [x, y] = coda[i], d = passi.get(pianta.id(x, y))
    if (d >= 9) continue
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy
      if (pianta.calpestabile(nx, ny) && !passi.has(pianta.id(nx, ny))) { passi.set(pianta.id(nx, ny), d + 1); coda.push([nx, ny]) }
    }
  }
  const prova = (cx, cz, l, verticale) => {
    const p = (u, v) => (verticale ? [cx + v * 0.8, cz + u * l] : [cx + u * l, cz + v])
    // il grosso è largo due celle: chi viene dopo di lui sta una cella più in là
    let spinta = 0
    const posti = [p(-1.25, 0), ...mostri.map((m, i) => {
      // il grosso stesso sta un passo più in là dall'eroe (la sua spada copriva l'eroe), e chi viene dopo ancora di più
      const q = p(POSTI[i % POSTI.length][0] - 0.25 + spinta + (m.grande ? 0.8 : 0), POSTI[i % POSTI.length][1])
      if (m.grande) spinta += 1.6
      return q
    })]
    let voto = -(verticale ? 1.5 : 0) - Math.hypot(cx - cx0, cz - cz0) * 0.05 - (l < 0 ? 0.05 : 0)
    for (const [x, z] of posti) {
      if (!libera(x, z) || !passi.has(pianta.id(Math.floor(x), Math.floor(z)))) { voto -= 2; continue }
      voto += Math.min(agio(x, z), AGIO) / AGIO
    }
    return { posti, voto }
  }
  let scelta = null
  for (let dz = -4; dz <= 4; dz += 0.5) for (let dx = -4; dx <= 4; dx += 0.5) for (const [l, v] of [[1, false], [-1, false], [-1, true], [1, true]]) {
    const t = prova(cx0 + dx, cz0 + dz, l, v)
    if (!scelta || t.voto > scelta.voto) scelta = t
  }
  // ognuno al suo posto, o alla cella libera più vicina; mai due a meno di 0,7
  const presi = []
  const tieni = (da, [x, z]) => {
    let mig = null, dm = Infinity
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const qx = Math.floor(x) + dx + 0.5, qz = Math.floor(z) + dy + 0.5
      if (!libera(qx, qz) || presi.some(q => Math.hypot(q.x - qx, q.z - qz) < 0.7)) continue
      const d = Math.hypot(qx - x, qz - z); if (d < dm) { dm = d; mig = { x: qx, z: qz } }
    }
    const r = libera(x, z) && !presi.some(q => Math.hypot(q.x - x, q.z - z) < 0.7) ? { x, z } : (mig || { x: da.x, z: da.z })
    presi.push(r); return r
  }
  const posEroe = tieni(eroe, scelta.posti[0])
  const posMostri = mostri.map((m, i) => tieni(m, scelta.posti[i + 1]))
  // i muri alti appena dietro (a nord) i combattenti si abbassano: le teste non si leggono mai dentro la parete
  const tutti = [posEroe, ...posMostri]
  const x0 = Math.min(...tutti.map(p => p.x)) - 1.6, x1 = Math.max(...tutti.map(p => p.x)) + 1.6, z0 = Math.min(...tutti.map(p => p.z))
  const abbassa = c => c.x + 1 > x0 && c.x < x1 && c.y + 1 <= z0 + 0.05 && c.y + 1 > z0 - 1.8
  return { eroe: posEroe, mostri: posMostri, abbassa, agio: tutti.map(p => agio(p.x, p.z)) }
}

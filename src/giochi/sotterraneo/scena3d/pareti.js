// Le pareti scolpite: tutti i muri di un piano in una geometria sola, fatta di facce a griglia (solo quelle che si vedono)
// spostate da un campo di rumore CONTINUO nel mondo, così due celle vicine si toccano senza giunte e niente è a filo. Lo
// stile (STILI_PARETE) dice quanto si sposta, se la cima è irregolare, se la parete strapiomba verso il vuoto o si allarga al
// piede, se le facce sono sfaccettate (cristallo, ossidiana). Il colore per vertice porta la tinta di ogni cella, gli strati
// e la coperta (neve, brina, muschio) dove la parete guarda in su. Dato puro (array), gira in Node: unita/sotterraneo-paesaggi.
// Il perché e come si aggiunge uno stile: docs/sotterraneo/paesaggi-3d.md.
import { fbm3d, caso } from './rumore.js'
import { ALTO_MURO, PARAPETTO } from './costanti.js'

// seg: [cima n×n, faccia in largo, faccia in alto] · ampiezza: lo spostamento (celle) · frequenza: quanto è fitto ·
// cima: quanto varia l'altezza (frazione) · sbalzo: la cima pende verso il vuoto (negativo: indietro) · piede: il piede
// rientra (negativo: si allarga) · creste: il rumore piegato a spigoli vivi · faccette: luce per faccia (cristallo) ·
// smussa: gli spigoli della griglia si arrotondano (la parete va verso la linea a metà fra roccia e vuoto: niente gradini)
export const STILI_PARETE = {
  blocchi:   { seg: [1, 2, 3], ampiezza: 0.02, frequenza: 1.7, cima: 0.05, sbalzo: 0, piede: 0 },
  lastroni:  { seg: [1, 1, 2], ampiezza: 0.006, frequenza: 1, cima: 0, sbalzo: 0, piede: 0 },
  lamiera:   { seg: [1, 1, 1], ampiezza: 0, frequenza: 1, cima: 0, sbalzo: 0, piede: 0 },
  roccia:    { seg: [2, 3, 3], ampiezza: 0.26, frequenza: 1.05, cima: 0.42, sbalzo: 0.24, piede: 0.1, smussa: 1.3 },
  ossidiana: { seg: [2, 3, 3], ampiezza: 0.2, frequenza: 1.5, cima: 0.62, sbalzo: 0.12, piede: 0, creste: true, faccette: true, smussa: 0.6 },
  cristallo: { seg: [2, 2, 3], ampiezza: 0.24, frequenza: 1.3, cima: 0.7, sbalzo: 0.05, piede: 0, faccette: true, smussa: 1 },
  neve:      { seg: [2, 3, 3], ampiezza: 0.17, frequenza: 0.8, cima: 0.38, sbalzo: 0.1, piede: -0.12, smussa: 1.5 },
  zolla:     { seg: [2, 3, 3], ampiezza: 0.2, frequenza: 0.75, cima: 0.3, sbalzo: -0.12, piede: -0.22, smussa: 1.5 },
}

// di ogni cella di muro: le facce che si vedono. Verso un'altra cella di muro della stessa altezza no; verso la roccia piena
// solo a sud, est e ovest (a nord non la vede la telecamera)
const LATI = [[0, -1], [1, 0], [0, 1], [-1, 0]]

export function scolpisciPareti(pianta, { stile = 'blocchi', seme = 1, colore = null } = {}) {
  const st = STILI_PARETE[stile] || STILI_PARETE.blocchi
  const { W, H } = pianta
  const f1 = fbm3d(seme), f2 = fbm3d(seme + 17), f3 = fbm3d(seme + 41), fc = fbm3d(seme + 77, 2)
  const classe = new Int8Array(W * H).fill(-1)   // -1 niente, 0 alto, 1 parapetto
  for (const m of pianta.muri) classe[pianta.id(m.x, m.y)] = m.basso ? 1 : 0
  const aperta = (x, y) => x >= 0 && y >= 0 && x < W && y < H && (!pianta.roccia(x, y) || !!pianta.colonna[pianta.id(x, y)])
  // il verso del vuoto agli spigoli delle celle, poi bilineare: continuo, così lo sbalzo non apre crepe
  const AW = W + 1
  const ax = new Float32Array(AW * (H + 1)), az = new Float32Array(AW * (H + 1)), aq = new Float32Array(AW * (H + 1))
  for (let j = 0; j <= H; j++) for (let i = 0; i <= W; i++) {
    let vx = 0, vz = 0, q = 0
    for (const [cx, cy] of [[i - 1, j - 1], [i, j - 1], [i - 1, j], [i, j]]) if (aperta(cx, cy)) { vx += cx + 0.5 - i; vz += cy + 0.5 - j; q += 0.25 }
    aq[j * AW + i] = q
    const l = Math.hypot(vx, vz)
    if (l > 1) { vx /= l; vz /= l }
    ax[j * AW + i] = vx; az[j * AW + i] = vz
  }
  const apertura = (x, z) => {
    const i = Math.max(0, Math.min(W - 1, Math.floor(x))), j = Math.max(0, Math.min(H - 1, Math.floor(z)))
    const tx = Math.min(1, Math.max(0, x - i)), tz = Math.min(1, Math.max(0, z - j))
    const b = (a) => (a[j * AW + i] * (1 - tx) + a[j * AW + i + 1] * tx) * (1 - tz) + (a[(j + 1) * AW + i] * (1 - tx) + a[(j + 1) * AW + i + 1] * tx) * tz
    return [b(ax), b(az), b(aq)]
  }
  // l'altezza della cima nel punto (x, z) per un muro alto o un parapetto: continua fra celle della stessa classe
  const altezza = (x, z, c) => {
    const base = c ? PARAPETTO : ALTO_MURO
    const v = fc(x * 0.9, c * 9.1, z * 0.9) * 2 * (c ? Math.min(st.cima, 0.25) : st.cima)
    const k = st.creste ? 1 + Math.abs(v) * 1.6 - 0.3 * st.cima : 1 + v
    return base * Math.max(c ? 0.75 : 0.62, k)
  }
  // lo spostamento di un punto del muro; `t` è quanto sta in alto (0 il piede, 1 la cima)
  const sposta = (x, y, z, t, c) => {
    const fr = st.frequenza, a = st.ampiezza * (c ? 0.7 : 1)
    let n1 = f1(x * fr, y * fr, z * fr), n2 = f2(x * fr, y * fr, z * fr), n3 = f3(x * fr, y * fr, z * fr)
    if (st.creste) { n1 = (0.25 - Math.abs(n1)) * 1.6; n3 = (0.25 - Math.abs(n3)) * 1.6 }
    const [ox, oz, q] = apertura(x, z)
    let s = (st.sbalzo * t - st.piede * (1 - t)) * (c ? 0.4 : 1)
    // smussa: dove intorno c'è più vuoto che roccia (uno spigolo che sporge) la parete arretra, dove ce n'è meno avanza
    const l = Math.hypot(ox, oz)
    if (st.smussa && l > 0.05) s += (0.5 - q) * st.smussa * Math.min(1, l * 2) / l
    return [x + a * 2 * n1 + ox * s, y + (y > 0.001 ? a * 0.6 * n2 * t : 0), z + a * 2 * n3 + oz * s]
  }

  const pos = [], cel = [], uv = [], chiavi = [], gruppi = [[], [], [], []]   // lati alti, cime alte, lati bassi, cime basse
  const nodo = (x, y, z, t, c, u, v, cella, chiave) => {
    const p = sposta(x, y, z, t, c)
    pos.push(p[0], p[1], p[2]); uv.push(u, v); cel.push(cella); chiavi.push(chiave)
    return pos.length / 3 - 1
  }
  const [nc, nl0, na0] = st.seg
  for (const m of pianta.muri) {
    const c = m.basso ? 1 : 0, cella = pianta.id(m.x, m.y)
    // la cima: una griglia nc×nc
    const b0 = pos.length / 3
    for (let j = 0; j <= nc; j++) for (let i = 0; i <= nc; i++) {
      const x = m.x + i / nc, z = m.y + j / nc
      nodo(x, altezza(x, z, c), z, 1, c, x, z, cella, `c${c}:${m.x * nc + i},${m.y * nc + j}`)
    }
    for (let j = 0; j < nc; j++) for (let i = 0; i < nc; i++) {
      const a = b0 + j * (nc + 1) + i, b = a + 1, d = a + nc + 1, e = d + 1
      gruppi[c * 2 + 1].push(a, d, b, b, d, e)
    }
    // le facce
    for (let k = 0; k < 4; k++) {
      const [dx, dy] = LATI[k], nx = m.x + dx, ny = m.y + dy
      const fuori = nx < 0 || ny < 0 || nx >= W || ny >= H
      const cv = fuori ? -1 : classe[pianta.id(nx, ny)]
      if (cv === c) continue
      if (cv === 0 && c === 1) continue                                  // il parapetto contro un muro alto: dentro
      if (!aperta(nx, ny) && cv < 0 && k === 0) continue                 // verso la roccia piena a nord: non si vede
      // i due spigoli della faccia, in senso antiorario visto da fuori
      const [x0, z0, x1, z1] = k === 0 ? [m.x + 1, m.y, m.x, m.y] : k === 1 ? [m.x + 1, m.y + 1, m.x + 1, m.y]
        : k === 2 ? [m.x, m.y + 1, m.x + 1, m.y + 1] : [m.x, m.y, m.x, m.y + 1]
      const b1 = pos.length / 3
      // un parapetto è basso: in alto gli basta una fila (i triangoli delle grotte stanno quasi tutti nei muri)
      const nl = c ? Math.min(nl0, 2) : nl0, na = c ? 1 : na0
      for (let j = 0; j <= na; j++) for (let i = 0; i <= nl; i++) {
        const s = i / nl, x = x0 + (x1 - x0) * s, z = z0 + (z1 - z0) * s
        const top = altezza(x, z, c), t = j / na, y = top * t
        const lungo = k % 2 ? z : x
        // la chiave: lo stesso punto della stessa parete diritta in due celle ha le stesse normali (niente cuciture)
        nodo(x, y, z, t, c, lungo, y / ALTO_MURO, cella, `f${c}${k}:${Math.round(x * nl)},${Math.round(z * nl)},${j}`)
      }
      for (let j = 0; j < na; j++) for (let i = 0; i < nl; i++) {
        const a = b1 + j * (nl + 1) + i, b = a + 1, d = a + nl + 1, e = d + 1
        gruppi[c * 2].push(a, b, d, b, e, d)
      }
    }
  }

  // le normali: per faccia, sommate sui nodi con la stessa chiave
  const nv = pos.length / 3
  const nor = new Float32Array(nv * 3)
  const somma = new Map()
  const acc = (i, x, y, z) => { const k = chiavi[i]; const s = somma.get(k); if (s) { s[0] += x; s[1] += y; s[2] += z } else somma.set(k, [x, y, z]) }
  for (const g of gruppi) for (let q = 0; q < g.length; q += 3) {
    const a = g[q] * 3, b = g[q + 1] * 3, d = g[q + 2] * 3
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2]
    const vx = pos[d] - pos[a], vy = pos[d + 1] - pos[a + 1], vz = pos[d + 2] - pos[a + 2]
    const x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx
    for (const i of [g[q], g[q + 1], g[q + 2]]) acc(i, x, y, z)
  }
  for (let i = 0; i < nv; i++) {
    const s = somma.get(chiavi[i]), l = Math.hypot(s[0], s[1], s[2]) || 1
    nor[i * 3] = s[0] / l; nor[i * 3 + 1] = s[1] / l; nor[i * 3 + 2] = s[2] / l
  }

  // il colore: la tinta di ogni cella, gli strati, il piede umido; la coperta dove si guarda in su
  const col = new Float32Array(nv * 3), cop = new Float32Array(nv)
  const r = caso(seme * 13 + 7)
  const tinte = new Float32Array(W * H)
  for (let i = 0; i < tinte.length; i++) tinte[i] = r()
  const k = colore || {}
  const varia = k.varia ?? 0.18, strati = k.strati ?? 0, coperta = k.coperta ?? 0, da = k.da ?? 0.55
  for (let i = 0; i < nv; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2]
    const ny = nor[i * 3 + 1]
    let v = 1 + (tinte[cel[i]] - 0.5) * varia
    if (strati) v *= 1 + Math.sin((y + f2(x * 0.7, 0, z * 0.7) * 1.4) * 14) * strati
    v *= 0.75 + 0.25 * Math.min(1, y / 0.3)   // il piede, più scuro
    const [ox, oz] = apertura(x, z)
    v *= 0.3 + 0.7 * Math.min(1, Math.hypot(ox, oz) * 1.6)   // lontano dal vuoto la roccia si perde nel buio
    col[i * 3] = v; col[i * 3 + 1] = v; col[i * 3 + 2] = v
    // la coperta: sulle cime e sulle sporgenze, a chiazze
    const n = f1(x * 2.1, y * 2.1, z * 2.1)
    cop[i] = coperta ? Math.max(0, Math.min(1, (ny - da) / (1 - da) * 2.2 + n * 2.5)) * coperta : 0
  }

  const indici = [...gruppi[0], ...gruppi[1], ...gruppi[2], ...gruppi[3]]
  let s = 0
  const conta = gruppi.map(g => { const o = { start: s, count: g.length }; s += g.length; return o })
  return {
    posizioni: new Float32Array(pos), normali: nor, uv: new Float32Array(uv), colori: col, coperta: cop,
    celle: new Float32Array(cel), indici, gruppi: conta, triangoli: indici.length / 3, faccette: !!st.faccette,
    // dove sta davvero la faccia: chi si attacca al muro (le torce, l'arredo) ci si posa sopra
    sposta: (x, y, z, basso = false) => sposta(x, y, z, Math.min(1, y / (basso ? PARAPETTO : ALTO_MURO)), basso ? 1 : 0),
    altezza: (x, z, basso = false) => altezza(x, z, basso ? 1 : 0),
  }
}

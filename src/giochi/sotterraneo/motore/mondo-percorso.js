// Il generatore del mondo a percorso (docs/sotterraneo/mondo-aperto-generatore.md): dalla scheda (dati/mondo-aperto.js, la parte
// «mondo a percorso») e da un seme fisso la serpentina a sette zone, A BLOCCHI. `scheletroDelMondo` fa per tutto il mondo la parte
// leggera (la strada maestra, le zone, i confini, il villaggio dalla pianta, i posti, le stradine, le tane, la firma);
// `caricaZona` riempie le celle di una zona (l'acqua e la roccia dentro, i pezzi d'erba che non si raggiungono, campi, case, il
// decoro, la quota, la cintura) leggendo solo lo scheletro e funzioni pure delle coordinate: per questo una zona esce uguale
// qualunque altra zona sia caricata, e caricarle una per una dà lo stesso mondo che caricarle tutte. Puro: gira in Node.
import { MONDO_PERCORSO, TRACCIATO, LUOGHI, ZONE_DEL_MONDO, INGRESSI_DEL_MONDO, VILLAGGIO, PERSONE, PERSONE_NUOVE, MULINO,
  PORTA_DELLE_TERRE, TERRE, HABITAT, BOTTEGHE, fasciaNellaTerra, saltoDellaTerra, difDellaZona } from '../dati/mondo-aperto.js'
import { MERCANTI } from '../dati/mercanti.js'
import { cerca, passiDa } from './mondo-aperto-strade.js'

export const ERBA = 0, ACQUA = 1, ROCCIA = 2
export const LIVELLO_ACQUA = -0.25
const QUATTRO = [[1, 0], [-1, 0], [0, 1], [0, -1]]
const SEC = 12            // il lato di un secchio: una cella cerca il campione più vicino solo nei secchi attorno al suo
const VICINI = 4          // quanti secchi attorno, almeno
const MARGINE = 14        // quanto si guarda oltre la zona caricandola (la cintura arriva a 12)
const STACCO_BORDO = 10   // l'acqua e la roccia dentro una zona stanno a tante celle da un'altra zona: le zone si cuciono senza giunte
export const PASSI_FRA_PIETRE = [190, 245]
export const CRIPTA_AL_PIU = 80
const ora = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

const scarta = (x, y, s) => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
function rumore(x, y, seme, passo) {
  const gx = x / passo, gy = y / passo, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy)
  const a = scarta(x0, y0, seme), b = scarta(x0 + 1, y0, seme), c = scarta(x0, y0 + 1, seme), d = scarta(x0 + 1, y0 + 1, seme)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
const fbm = (x, y, seme, passo) => {
  let s = 0, a = 0.5, t = 0, p = passo
  for (let i = 0; i < 3; i++) { s += rumore(x, y, seme + i * 101, p) * a; t += a; a *= 0.5; p /= 2 }
  return s / t
}
function caso(seme) {
  let s = (seme >>> 0) || 1
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 }
}
const FNV = 0x811c9dc5
const mescola = (f, v) => Math.imul(f ^ (v & 0xff), 16777619) >>> 0
const mescolaTesto = (f, s) => { for (let i = 0; i < s.length; i++) f = mescola(f, s.charCodeAt(i)); return f }

/* ═════════════════════════════ lo scheletro ═════════════════════════════ */

export function scheletroDelMondo(seme = MONDO_PERCORSO.seme, { terra = 1 } = {}) {
  const t0 = ora()
  const P = MONDO_PERCORSO, W = P.largo, H = P.alto, N = W * H
  const id = (x, y) => y * W + x
  const dentro = (x, y) => x >= 0 && y >= 0 && x < W && y < H
  const guasti = []
  const kx = W / P.su[0], ky = H / P.su[1]

  // 1. la strada maestra: una curva liscia (Catmull-Rom) per i punti del tracciato stirati sulla misura, un campione ogni mezza
  // cella col suo arco `s` e la sua direzione
  const sx = [], sy = [], ss = [], tx = [], ty = []
  {
    const Q = TRACCIATO.map(([x, y]) => [x * kx, y * ky])
    let s = 0, px = null, py = null
    for (let i = 0; i < Q.length - 1; i++) {
      const p0 = Q[Math.max(0, i - 1)], p1 = Q[i], p2 = Q[i + 1], p3 = Q[Math.min(Q.length - 1, i + 2)]
      const passi = Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 2)
      for (let j = 0; j < passi; j++) {
        const t = j / passi, t2 = t * t, t3 = t2 * t
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
        const x = f(p0[0], p1[0], p2[0], p3[0]), y = f(p0[1], p1[1], p2[1], p3[1])
        if (px != null) s += Math.hypot(x - px, y - py)
        sx.push(x); sy.push(y); ss.push(s); px = x; py = y
      }
    }
    for (let i = 0; i < sx.length; i++) {
      const a = Math.max(0, i - 2), b = Math.min(sx.length - 1, i + 2), l = Math.hypot(sx[b] - sx[a], sy[b] - sy[a]) || 1
      tx.push((sx[b] - sx[a]) / l); ty.push((sy[b] - sy[a]) / l)
    }
  }
  const S = ss[ss.length - 1], nC = sx.length
  const campioneDi = s => { let lo = 0, hi = nC - 1; while (lo < hi) { const q = (lo + hi) >> 1; if (ss[q] < s) lo = q + 1; else hi = q } return lo }
  // il punto a `fondo` celle dalla strada, a sinistra (lato +1) o a destra (−1) guardando avanti
  const aLato = (s, lato, fondo) => { const i = campioneDi(s); return { x: sx[i] + ty[i] * lato * fondo, y: sy[i] - tx[i] * lato * fondo } }

  // 2. le zone lungo l'arco, in proporzione al peso; i luoghi in fila dentro ognuna
  const pesi = ZONE_DEL_MONDO.reduce((n, z) => n + z.peso, 0)
  const zone = []
  {
    let s = 0
    for (const [i, Z] of ZONE_DEL_MONDO.entries()) {
      const l = S * Z.peso / pesi
      zone.push({ chiave: Z.chiave, nome: Z.nome, i, s0: s, s1: s + l, fascia: fasciaNellaTerra(Z.fascia, terra), fasciaPrima: Z.fascia.slice(),
        dif: difDellaZona(Z), colore: Z.colore, luoghi: Z.luoghi.slice(), confine: Z.confine })
      s += l
    }
  }
  const nZ = zone.length
  const zonaDiS = s => { for (const z of zone) if (s < z.s1) return z.i; return nZ - 1 }
  // i luoghi: il villaggio (0) e poi quelli delle zone in fila; `primo[z]` è l'indice del primo luogo della zona z
  const regioni = [{ chiave: 'villaggio', nome: VILLAGGIO.nome, habitat: 'villaggio', zona: 0, zonaChiave: zone[0].chiave, s0: 0, s1: 0,
    fascia: null, dif: null, abitanti: null, caporale: null }]
  const primo = []
  for (const Z of zone) {
    primo.push(regioni.length)
    Z.luoghi.forEach((chiave, n) => {
      const L = LUOGHI[chiave] || { nome: chiave, habitat: 'prato' }
      if (!LUOGHI[chiave]) guasti.push(`il luogo ${chiave} non è nella scheda`)
      const s0 = Z.s0 + (Z.s1 - Z.s0) * n / Z.luoghi.length, s1 = Z.s0 + (Z.s1 - Z.s0) * (n + 1) / Z.luoghi.length
      const fa = Z.fascia[0] + (Z.fascia[1] - Z.fascia[0]) * n / Z.luoghi.length, fb = Z.fascia[0] + (Z.fascia[1] - Z.fascia[0]) * (n + 1) / Z.luoghi.length
      const c = aLato((s0 + s1) / 2, 0, 0)
      regioni.push({ chiave, nome: L.nome, habitat: L.habitat, zona: Z.i, zonaChiave: Z.chiave, s0, s1, fascia: [Math.round(fa), Math.round(fb)],
        dif: Z.dif, abitanti: L.abitanti || null, caporale: L.caporale || null, cx: Math.round(c.x), cy: Math.round(c.y) })
    })
  }
  // la quota di base lungo la strada: quella dell'habitat di ogni luogo al suo mezzo, e in mezzo una rampa
  const quotaLungo = regioni.slice(1).map(R => [(R.s0 + R.s1) / 2, HABITAT[R.habitat]?.quota ?? 0.2])
  const quotaDiS = s => {
    if (s <= quotaLungo[0][0]) return quotaLungo[0][1]
    for (let i = 1; i < quotaLungo.length; i++) if (s <= quotaLungo[i][0]) {
      const [a, qa] = quotaLungo[i - 1], [b, qb] = quotaLungo[i], f = (s - a) / (b - a)
      return qa + (qb - qa) * f * f * (3 - 2 * f)
    }
    return quotaLungo[quotaLungo.length - 1][1]
  }

  // 3. i secchi: per ognuno i campioni della strada fra cui cercare il più vicino (almeno VICINI secchi attorno, di più dove la
  // strada è lontana) e quindi le zone a cui le sue celle possono andare
  const GW = Math.ceil(W / SEC), GH = Math.ceil(H / SEC), NG = GW * GH
  const nelSecchio = Array.from({ length: NG }, () => [])
  for (let i = 0; i < nC; i += 2) nelSecchio[Math.min(GH - 1, Math.max(0, Math.floor(sy[i] / SEC))) * GW + Math.min(GW - 1, Math.max(0, Math.floor(sx[i] / SEC)))].push(i)
  const candidati = new Array(NG), zoneDelSecchio = new Array(NG)
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
    const raccogli = r => { const l = []; for (let j = gy - r; j <= gy + r; j++) for (let i = gx - r; i <= gx + r; i++) if (i >= 0 && j >= 0 && i < GW && j < GH) l.push(...nelSecchio[j * GW + i]); return l }
    let r = VICINI, l = raccogli(r)
    while (!l.length && r < Math.max(GW, GH)) l = raccogli(++r)
    if (r > VICINI) l = raccogli(r + 1)
    candidati[gy * GW + gx] = Int32Array.from(l)
    zoneDelSecchio[gy * GW + gx] = new Set(l.map(c => zonaDiS(ss[c])))
  }

  // 4. il villaggio dalla sua pianta: il cancello a est sta sull'inizio della strada maestra
  const V = VILLAGGIO
  const vx = Math.round(sx[0]) - V.cancello.x - 1, vy = Math.round(sy[0]) - V.cancello.y
  const nelVillaggio = (x, y) => x >= vx - 2 && y >= vy - 2 && x < vx + V.w + 2 && y < vy + V.h + 2
  const inCitta = (x, y) => x >= vx && y >= vy && x < vx + V.w && y < vy + V.h
  for (let gy = Math.floor((vy - 2) / SEC); gy <= Math.floor((vy + V.h + 1) / SEC); gy++) for (let gx = Math.floor((vx - 2) / SEC); gx <= Math.floor((vx + V.w + 1) / SEC); gx++)
    if (gx >= 0 && gy >= 0 && gx < GW && gy < GH) zoneDelSecchio[gy * GW + gx].add(0)

  // la base di ogni cella, pura (dipende solo dalle coordinate e dalla curva) e tenuta a mano a mano che serve: il campione più
  // vicino (d1, l'arco) e il più vicino di un'altra fila (d2, un arco lontano più di 100); fuori dal corridoio roccia, dove due
  // file si avvicinano una cresta, fra due zone il confine di traverso (un fiume col ponte o una cresta col valico, sempre aperti)
  const bT = new Uint8Array(N).fill(255), bZ = new Int8Array(N), bL = new Int8Array(N), bP = new Int8Array(N), bV = new Int8Array(N)
  const bA = new Float32Array(N), bD1 = new Float32Array(N), bProf = new Float32Array(N), bC = new Uint8Array(N)
  const LARGO_CONFINE = c => (c.tipo === 'ponte' ? (c.modello === 'arco' ? 2 : 1.4) : 1.8)
  function base(k) {
    if (bT[k] !== 255) return
    const x = k % W, y = (k / W) | 0
    const cand = candidati[Math.floor(y / SEC) * GW + Math.floor(x / SEC)]
    let i1 = -1, q1 = Infinity
    for (let j = 0; j < cand.length; j++) { const c = cand[j], dx = x - sx[c], dy = y - sy[c], q = dx * dx + dy * dy; if (q < q1) { q1 = q; i1 = c } }
    let q2 = Infinity
    const s = ss[i1]
    for (let j = 0; j < cand.length; j++) { const c = cand[j]; if (Math.abs(ss[c] - s) <= 100) continue; const dx = x - sx[c], dy = y - sy[c], q = dx * dx + dy * dy; if (q < q2) q2 = q }
    const d1 = Math.sqrt(q1), d2 = Math.sqrt(q2)
    bA[k] = s; bD1[k] = d1
    const z = zonaDiS(s), Z = zone[z]
    bZ[k] = z; bL[k] = Math.min(Z.luoghi.length - 1, Math.floor((s - Z.s0) / (Z.s1 - Z.s0) * Z.luoghi.length))
    bP[k] = -1; bV[k] = -1; bC[k] = 0
    if (nelVillaggio(x, y)) { bT[k] = ERBA; bZ[k] = 0; bL[k] = -1; bProf[k] = 0; if (inCitta(x, y)) bC[k] = 1; return }
    const largo = P.mezza * (0.82 + 0.36 * rumore(s, 0, seme + 11, 37)) + 5 * (rumore(x, y, seme + 13, 7) - 0.5)
    const bordo = Math.min(x, y, W - 1 - x, H - 1 - y)
    const cresta = 5 + 2 * rumore(x, y, seme + 17, 5)
    const prof = Math.max(d1 - largo, cresta - (d2 - d1), 3 - bordo)
    if (prof > 0) { bT[k] = ROCCIA; bProf[k] = prof; return }
    bT[k] = ERBA; bProf[k] = prof   // dentro, negativo: quanto dista il bordo del corridoio
    for (const zc of [z - 1, z]) {
      if (zc < 0 || zc >= nZ - 1) continue
      const C = zone[zc].confine, sB = zone[zc].s1, lc = LARGO_CONFINE(C)
      const lim = lc + 1.2 * (rumore(x, y, seme + 21, 6) - 0.5), dd = Math.abs(s - sB)
      if (dd > lim) continue
      if (C.tipo === 'ponte') {
        if (d1 <= 1.6) { bP[k] = zc; if (dd <= lim * 0.6) bT[k] = ACQUA }   // il piano sopra l'acqua, le due teste sull'erba
        else { bT[k] = ACQUA; bProf[k] = lim - dd }
      } else if (d1 <= 3.2) bV[k] = zc
      else { bT[k] = ROCCIA; bProf[k] = lim - dd }
      break
    }
  }
  const stradaPura = k => (bD1[k] <= 1.05 && (bT[k] === ERBA || bP[k] >= 0) && !bC[k])

  // la quota pura di una cella dalla sua base: la base dolce lungo la strada e il rumore, la roccia che sale entrando, i fiumi
  // bassi, l'erba che sale un poco verso la roccia
  function quotaPura(k) {
    base(k)
    const x = k % W, y = (k / W) | 0
    const b0 = (fbm(x, y, seme + 500, 22) - 0.5) * 1.1 + (bC[k] || bL[k] < 0 ? HABITAT.villaggio.quota : quotaDiS(bA[k]))
    if (bT[k] === ROCCIA) {
      const pr = bProf[k], bordo = Math.min(x, y, W - 1 - x, H - 1 - y)
      return b0 + 0.45 + Math.min(pr, 6) * 0.75 + fbm(x, y, seme + 510, 5) * 1.6 * Math.min(1, pr / 2) + (bordo < 4 ? (4 - bordo) * 0.9 : 0)
    }
    if (bT[k] === ACQUA) return LIVELLO_ACQUA - 0.35 - Math.min(Math.max(bProf[k], 0) * 2, 4) * 0.22
    return Math.max(b0 + 0.35 * Math.max(0, 1 + bProf[k] / 3), LIVELLO_ACQUA + 0.2)
  }

  // i segni dello scheletro: i lotti dei posti (1, gli alberi del villaggio 2), dove il decoro non entra, le strade che non sono
  // la maestra (la piazza 3, il tratto dal cancello 2, le stradine 1)
  const sB = new Uint8Array(N), sR = new Uint8Array(N), sS = new Uint8Array(N)
  const stradaDi = k => { base(k); return Math.max(sS[k], stradaPura(k) ? 2 : 0) }
  const occupa = (x, y, w, h, v = 1) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (dentro(x + i, y + j)) sB[id(x + i, y + j)] = v }
  const riserva = (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (dentro(x + i, y + j)) sR[id(x + i, y + j)] = 1 }

  const posti = []
  const villaggio = { chiave: V.chiave, nome: V.nome, x: vx, y: vy, w: V.w, h: V.h, zona: 0,
    centro: { x: vx + (V.w >> 1), y: vy + V.piazza.y + (V.piazza.h >> 1) }, raggio: Math.ceil(Math.hypot(V.w, V.h) / 2),
    piazza: { x: vx + V.piazza.x, y: vy + V.piazza.y, w: V.piazza.w, h: V.piazza.h }, partenza: { x: vx + V.partenza.x, y: vy + V.partenza.y },
    cancello: { x: vx + V.cancello.x, y: vy + V.cancello.y }, mercanti: [], persone: [],
    case: V.case.map((c, n) => ({ x: vx + c.x, y: vy + c.y, w: c.w, h: c.h, verso: 'n', senzaPorta: true, regione: 'villaggio', seme: 1000 + n })),
    alberi: V.alberi.map(([x, y]) => ({ x: vx + x, y: vy + y })) }
  for (let y = 0; y < V.piazza.h; y++) for (let x = 0; x < V.piazza.w; x++) sS[id(vx + V.piazza.x + x, vy + V.piazza.y + y)] = 3
  for (const l of V.lotti) {
    if (l.tipo !== 'portale') occupa(vx + l.x, vy + l.y, l.w, l.h)
    const q = { ...l, citta: 'villaggio', regione: 'villaggio', zona: zone[0].chiave, x: vx + l.x, y: vy + l.y,
      piede: { x: vx + l.piede.x, y: vy + l.piede.y }, accanto: { x: vx + l.accanto.x, y: vy + l.accanto.y } }
    if (l.tipo === 'mercante') {
      const M = MERCANTI.find(z => z.chiave === l.chiave), B = BOTTEGHE[l.chiave]
      if (!M || !B) guasti.push(`${l.chiave} non è un mercante`)
      else Object.assign(q, { nome: M.nome, em: M.em, sprite: M.sprite, ruolo: M.schede.map(s => s.nome).join(', '), bottega: B.bottega })
      villaggio.mercanti.push(q)
    }
    if (l.tipo === 'persona') { if (PERSONE_NUOVE[l.chiave]) Object.assign(q, PERSONE_NUOVE[l.chiave], { nuovo: true }); villaggio.persone.push(q) }
    if (l.tipo === 'minatore') { q.dalla = 0; villaggio.minatore = q }
    if (l.tipo === 'pietra') q.dif = zone[0].dif
    if (['portale', 'pietra', 'bacheca', 'cartello', 'pozzo'].includes(l.tipo)) villaggio[l.tipo] = q
    if (l.tipo !== 'portale') riserva(q.x - 1, q.y + l.h, l.w + 2, Math.max(1, q.accanto.y - q.y - l.h + 1))
    posti.push(q)
  }
  for (const c of villaggio.case) occupa(c.x, c.y, c.w, c.h)
  for (const a of villaggio.alberi) occupa(a.x, a.y, 1, 1, 2)
  for (let x = vx + V.piazza.x + V.piazza.w; x <= Math.round(sx[0]); x++) for (const y of [vy + V.cancello.y, vy + V.cancello.y - 1]) sS[id(x, y)] = 2
  posti.unshift({ tipo: 'citta', chiave: 'villaggio', nome: V.nome, regione: 'villaggio', zona: zone[0].chiave, x: vx, y: vy, w: V.w, h: V.h,
    piede: { ...villaggio.partenza }, accanto: { ...villaggio.partenza } })
  const partenza = villaggio.partenza

  // un lotto vicino al punto voluto: tutto erba della zona, fuori dalla strada e da altri lotti, con un anello libero (più largo
  // davanti, a sud); si cerca a spirale
  const libero = k => { base(k); return bT[k] === ERBA && bP[k] < 0 && bV[k] < 0 && !sB[k] && !sR[k] }
  function lottoVicino(p, w, h, zi, { margine = 1, sud = 3, strade = false, raggio = 8 } = {}) {
    for (let r = 0; r <= raggio; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
      const x = Math.round(p.x - w / 2) + dx, y = Math.round(p.y - h / 2) + dy
      let ok = true
      for (let j = -margine; j < h + sud && ok; j++) for (let i = -margine; i < w + margine; i++) {
        const a = x + i, b = y + j
        if (!dentro(a, b)) { ok = false; break }
        const k = id(a, b)
        if (!libero(k) || bZ[k] !== zi || bC[k] || nelVillaggio(a, b)) { ok = false; break }
        if (!strade && j < h && i >= 0 && i < w && j >= 0 && stradaDi(k)) { ok = false; break }
      }
      if (ok) return { x, y }
    }
    return null
  }
  const costoStrada = k => {
    base(k)
    if (bP[k] >= 0) return 0.3
    if (bT[k] !== ERBA || sB[k]) return Infinity
    return stradaDi(k) ? 0.3 : 1 + 0.4 * rumore(k % W, (k / W) | 0, seme + 31, 5)
  }
  const traccia = (da, a, livello, chi) => {
    const via = cerca(W, H, costoStrada, da, a)
    if (!via) { guasti.push(`nessuna stradina per ${chi}`); return }
    for (const c of via) { const k = id(c.x, c.y); if (sS[k] < livello && !stradaPura(k)) sS[k] = livello }
  }
  const sullaStrada = s => { const i = campioneDi(s); return { x: Math.round(sx[i]), y: Math.round(sy[i]) } }

  // 5. le pietre runiche, una al mezzo di ogni zona accanto alla strada; i dungeon con la loro stradina; le tane dei luoghi
  const pietre = [villaggio.pietra], ingressi = [], tane = []
  for (const Z of zone) {
    const l = lottoVicino(aLato((Z.s0 + Z.s1) / 2, 1, 4), 2, 2, Z.i)
    if (!l) { guasti.push(`nessun posto per la pietra di ${Z.nome}`); continue }
    occupa(l.x, l.y, 2, 2); riserva(l.x - 1, l.y + 2, 4, 2)
    const q = { tipo: 'pietra', chiave: `zona:${Z.chiave}`, zona: Z.chiave, dif: Z.dif, x: l.x, y: l.y, w: 2, h: 2, piede: { x: l.x + 1, y: l.y + 1 }, accanto: { x: l.x + 1, y: l.y + 3 } }
    pietre.push(q); Z.pietra = q.chiave
  }
  for (const Z of zone) for (const d of ZONE_DEL_MONDO[Z.i].dungeon) {
    const D = INGRESSI_DEL_MONDO[d.chiave]
    if (!D) { guasti.push(`il dungeon ${d.chiave} non è in INGRESSI_DEL_MONDO`); continue }
    const s = Z.s0 + (Z.s1 - Z.s0) * d.f
    const l = lottoVicino(aLato(s, d.lato, d.fondo), D.w, D.h, Z.i, { margine: 2 })
    if (!l) { guasti.push(`nessun posto per ${D.nome}`); continue }
    occupa(l.x, l.y, D.w, D.h); riserva(l.x - 1, l.y + D.h, D.w + 2, 3)
    const accanto = { x: l.x + (D.w >> 1), y: l.y + D.h + 1 }
    ingressi.push({ tipo: 'ingresso', chiave: d.chiave, indice: D.indice, nome: D.nome, monumento: D.monumento, paesaggio: D.paesaggio, boss: D.boss,
      appoggio: D.appoggio || null, finale: !!D.finale, livello: D.livello + saltoDellaTerra(terra), zona: Z.chiave,
      storia: D.indice != null && D.indice >= 0, x: l.x, y: l.y, w: D.w, h: D.h, piede: { x: accanto.x, y: l.y + D.h - 1 }, accanto })
    traccia(accanto, sullaStrada(s), 1, D.nome)
  }
  const arcoDi = c => { const k = id(c.x, c.y); base(k); return bA[k] }
  const latoDi = q => { const i = campioneDi(arcoDi(q.accanto)); return Math.sign((q.accanto.x - sx[i]) * ty[i] - (q.accanto.y - sy[i]) * tx[i]) || 1 }
  regioni.forEach((R, ri) => {
    if (!ri) return
    const Z = zone[R.zona], s = (R.s0 + R.s1) / 2
    const vicino = ingressi.filter(q => q.zona === Z.chiave).sort((a, b) => Math.abs(arcoDi(a.accanto) - s) - Math.abs(arcoDi(b.accanto) - s))[0]
    const n = ri - primo[R.zona]
    const lato = vicino && Math.abs(arcoDi(vicino.accanto) - s) < 40 ? -latoDi(vicino) : (n % 2 ? 1 : -1)
    const l = lottoVicino(aLato(s, lato, 14), 3, 3, Z.i, { margine: 2, sud: 2 }) || lottoVicino(aLato(s, -lato, 14), 3, 3, Z.i, { margine: 2, sud: 2 })
    if (!l) { guasti.push(`nessun posto per la tana di ${R.chiave}`); return }
    riserva(l.x - 2, l.y - 2, 7, 7)
    R.tana = { x: l.x + 1, y: l.y + 1 }
    tane.push({ luogo: R.chiave, zona: Z.chiave, x: l.x + 1, y: l.y + 1 })
  })

  // 6. il mulino sulla riva del fiume, poco prima del ponte, con la ruota nell'acqua; la porta delle terre in fondo; chi sta fermo
  // vicino al posto delle sue missioni. Ognuno con la sua stradina
  let mulino = null
  {
    const Z = zone.find(z => z.chiave === MULINO.zona), M = MULINO
    const c = aLato(Z.s1 - M.prima, M.lato, M.fondo)
    let meglio = null
    for (let r = 0; r <= 10 && !meglio; r++) for (let dy = -r; dy <= r && !meglio; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
      const x = Math.round(c.x - 1) + dx, y = Math.round(c.y - 1) + dy
      // la riva: almeno due celle d'acqua su tre lungo un lato (ovest, est, nord, sud), fuori dal ponte; attorno il resto libero
      for (const verso of ['o', 'e', 'n', 's']) {
        const acqua = [0, 1, 2].map(j => (verso === 'o' ? [x - 1, y + j] : verso === 'e' ? [x + M.w, y + j] : verso === 'n' ? [x + j, y - 1] : [x + j, y + M.h]))
        if (acqua.filter(([a, b]) => { if (!dentro(a, b)) return false; const q = id(a, b); base(q); return bT[q] === ACQUA && bP[q] < 0 }).length < 2) continue
        // il lotto sull'erba; attorno erba o la riva (il fiume è spesso di traverso); davanti, dove si ferma l'eroe, erba
        let ok = true
        for (let j = -1; j <= M.h && ok; j++) for (let i = -1; i <= M.w; i++) {
          const a = x + i, b = y + j, nel = i >= 0 && j >= 0 && i < M.w && j < M.h
          if (!dentro(a, b)) { ok = false; break }
          const q = id(a, b); base(q)
          const riva = bT[q] === ACQUA && bP[q] < 0
          if ((nel || !riva) && (!libero(q) || bZ[q] !== Z.i || stradaDi(q))) { ok = false; break }
        }
        const davanti = verso === 's' ? [[x - 1, y + 1], [x - 2, y + 1], [x - 1, y + 2]] : [[x + 1, y + M.h + 1], [x + 1, y + M.h + 2], [x, y + M.h + 1]]
        for (const [a, b] of davanti) { if (!ok) break; const q = id(a, b); if (!dentro(a, b) || !libero(q) || bZ[q] !== Z.i) ok = false }
        if (ok) { meglio = { x, y, verso }; break }
      }
    }
    if (!meglio) {
      const l = lottoVicino(c, M.w, M.h, Z.i)
      if (l) { meglio = { ...l, verso: null }; guasti.push('il mulino non trova la riva: sta senza ruota nell\'acqua') }
    }
    if (!meglio) guasti.push('nessun posto per il mulino')
    else {
      occupa(meglio.x, meglio.y, M.w, M.h); riserva(meglio.x - 1, meglio.y + M.h, M.w + 2, 2)
      // `verso`: il lato dell'acqua con la ruota (o, e, n, s); `lato` come nel mondo ad anelli (−1 ovest, +1 est, 0 nord o sud).
      // Chi va al mulino si ferma davanti, a sud; se l'acqua è a sud, a ovest
      const v = meglio.verso, R = { o: [-0.5, 1.5], e: [M.w + 0.5, 1.5], n: [1.5, -0.5], s: [1.5, M.h + 0.5] }[v]
      mulino = { tipo: 'mulino', chiave: 'mulino', zona: Z.chiave, x: meglio.x, y: meglio.y, w: M.w, h: M.h, verso: v || null,
        lato: v === 'o' ? -1 : v === 'e' ? 1 : 0, ruota: R ? { x: meglio.x + R[0], y: meglio.y + R[1] } : null,
        piede: { x: meglio.x + 1, y: meglio.y + 2 }, accanto: v === 's' ? { x: meglio.x - 1, y: meglio.y + 1 } : { x: meglio.x + 1, y: meglio.y + M.h + 1 } }
      traccia(mulino.accanto, sullaStrada(arcoDi(mulino.accanto)), 1, 'il mulino')
    }
  }
  let porta = null
  {
    const T = PORTA_DELLE_TERRE, Z = zone.find(z => z.chiave === T.zona)
    const l = lottoVicino(aLato(Z.s0 + (Z.s1 - Z.s0) * T.f, T.lato, T.fondo), T.w, T.h, Z.i, { strade: true })
    if (!l) guasti.push('nessun posto per la porta delle terre')
    else {
      occupa(l.x, l.y, T.w, T.h); riserva(l.x - 1, l.y + T.h, T.w + 2, 2)
      porta = { tipo: 'terre', chiave: 'porta-delle-terre', nome: 'La porta delle terre', zona: Z.chiave, x: l.x, y: l.y, w: T.w, h: T.h,
        piede: { x: l.x + 1, y: l.y + 1 }, accanto: { x: l.x + 1, y: l.y + T.h + 1 } }
      traccia(porta.accanto, sullaStrada(arcoDi(porta.accanto) - 4), 2, 'la porta delle terre')
    }
  }
  const persone = []
  for (const Q of PERSONE) {
    const v = Q.vicino === 'mulino' ? mulino : ingressi.find(q => q.chiave === Q.vicino)
    if (!v) { guasti.push(`${Q.chiave} non trova ${Q.vicino}`); continue }
    const zi = zone.findIndex(z => z.chiave === v.zona)
    const l = lottoVicino({ x: v.accanto.x + 5, y: v.accanto.y }, 1, 1, zi, { margine: 1, sud: 3 }) || lottoVicino({ x: v.accanto.x - 5, y: v.accanto.y }, 1, 1, zi, { margine: 1, sud: 3 })
    if (!l) { guasti.push(`nessun posto per ${Q.chiave}`); continue }
    occupa(l.x, l.y, 1, 1); riserva(l.x - 1, l.y + 1, 3, 2)
    const q = { tipo: 'persona', chiave: Q.chiave, zona: v.zona, x: l.x, y: l.y, w: 1, h: 1, piede: { x: l.x, y: l.y }, accanto: { x: l.x, y: l.y + 2 } }
    persone.push(q)
    traccia(q.accanto, v.accanto, 1, Q.chiave)
  }
  posti.push(...pietre.slice(1), ...ingressi, ...(mulino ? [mulino] : []), ...(porta ? [porta] : []), ...persone)
  for (const q of posti) { const k = id(q.accanto.x, q.accanto.y); base(k); q.regione = q.regione || regioni[bL[k] < 0 ? 0 : primo[bZ[k]] + bL[k]].chiave }
  for (const q of ingressi) { const R = regioni.find(r => r.chiave === q.regione); if (R && !R.dungeon) R.dungeon = q.chiave }
  for (const R of regioni) if (R.dungeon === undefined) R.dungeon = null
  for (const Z of zone) Z.ingressi = ingressi.filter(q => q.zona === Z.chiave).map(q => q.chiave)

  // 7. i confini: le celle del ponte o del valico, le rive, la quota del piano (la riva più alta), il modello
  const confini = []
  for (const Z of zone.slice(0, -1)) {
    const C = Z.confine, c0 = aLato(Z.s1, 0, 0), celle = [], rive = []
    let alta = LIVELLO_ACQUA + 0.3
    for (let y = Math.floor(c0.y) - 9; y <= c0.y + 9; y++) for (let x = Math.floor(c0.x) - 9; x <= c0.x + 9; x++) {
      if (!dentro(x, y)) continue
      const k = id(x, y); base(k)
      if (bP[k] === Z.i || bV[k] === Z.i) {
        celle.push({ x, y, acqua: bT[k] === ACQUA })
        for (const [dx, dy] of QUATTRO) {
          const nk = id(x + dx, y + dy); base(nk)
          if (bT[nk] === ERBA && bP[nk] < 0 && bV[nk] < 0) alta = Math.max(alta, quotaPura(nk))
        }
      }
    }
    for (const verso of [-1, 1]) {
      const p = sullaStrada(Z.s1 + verso * (LARGO_CONFINE(C) + 2.5))
      rive.push({ ...p, zona: zone[Z.i + (verso < 0 ? 0 : 1)].chiave })
    }
    if (!celle.length) guasti.push(`il confine fra ${Z.chiave} e ${zone[Z.i + 1].chiave} non ha un passaggio`)
    const i0 = campioneDi(Z.s1)
    confini.push({ i: Z.i, da: Z.chiave, a: zone[Z.i + 1].chiave, tipo: C.tipo, modello: C.modello || null, nome: C.nome, x: Math.round(c0.x), y: Math.round(c0.y),
      s: Z.s1, verso: Math.abs(tx[i0]) >= Math.abs(ty[i0]) ? 'est' : 'sud', celle, rive,
      quota: C.tipo === 'ponte' ? alta + 0.08 : null, arco: C.tipo === 'ponte' ? (C.modello === 'arco' ? 0.45 : C.modello === 'travi' ? 0.12 : 0.05) : null })
  }

  // 8. la quota dei lotti spianati (la media della quota pura sotto e attorno), la cintura (la strada fino alla cripta e alla
  // pietra dei prati), le distanze lungo la strada, lo spazio di ogni zona
  const spianaPura = (x, y, w, h) => {
    let s = 0, n = 0
    for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) { if (!dentro(x + i, y + j)) continue; const k = id(x + i, y + j); base(k); if (bT[k] === ERBA) { s += quotaPura(k); n++ } }
    return n ? s / n : 0
  }
  for (const q of posti) if (q.tipo !== 'portale' && q.tipo !== 'citta') q.quota = spianaPura(q.x, q.y, q.w, q.h)
  villaggio.quota = spianaPura(vx, vy, V.w, V.h)
  const cripta = ingressi.find(q => q.chiave === 'altare')
  const fineCintura = Math.max(cripta ? arcoDi(cripta.accanto) : 0, pietre[1] ? arcoDi(pietre[1].accanto) : 0) + 8
  const distanze = {
    pietre: pietre.slice(1).map((q, i, l) => (i ? { da: l[i - 1].zona, a: q.zona, arco: Math.round(arcoDi(q.accanto) - arcoDi(l[i - 1].accanto)) } : null)).filter(Boolean),
    dungeon: ingressi.map(q => ({ chiave: q.chiave, arco: Math.round(arcoDi(q.accanto)) })),
  }
  // le scatole delle zone: i secchi che possono avere celle della zona, e il loro rettangolo
  const secchiDi = zone.map(() => [])
  for (let b = 0; b < NG; b++) for (const z of zoneDelSecchio[b]) secchiDi[z].push(b)
  for (const Z of zone) {
    const l = secchiDi[Z.i]
    const xs = l.map(b => b % GW), ys = l.map(b => (b / GW) | 0)
    Z.rettangolo = { x0: Math.min(...xs) * SEC, y0: Math.min(...ys) * SEC, x1: Math.min(W - 1, (Math.max(...xs) + 1) * SEC - 1), y1: Math.min(H - 1, (Math.max(...ys) + 1) * SEC - 1) }
    const m = aLato((Z.s0 + Z.s1) / 2, -1, 15)
    Z.etichetta = { x: Math.round(m.x), y: Math.round(m.y) }
    const c = aLato((Z.s0 + Z.s1) / 2, 0, 0)
    Z.centro = { x: Math.round(c.x), y: Math.round(c.y) }
  }
  // la strada maestra per chi la disegna da lontano (la veduta, la bussola): un punto ogni due celle d'arco
  const tracciato = []
  for (let s = 0; s <= S; s += 2) { const i = campioneDi(s); tracciato.push({ x: +sx[i].toFixed(2), y: +sy[i].toFixed(2), s: +ss[i].toFixed(1) }) }

  // 9. la firma dello scheletro: la curva, le zone, i posti, i lotti, le stradine e i confini (non la terra: la mappa è la stessa)
  let f = FNV
  for (const p of tracciato) { f = mescola(f, Math.round(p.x * 4)); f = mescola(f, Math.round(p.y * 4)) }
  for (const Z of zone) f = mescolaTesto(f, `${Z.chiave}${Math.round(Z.s0)},${Math.round(Z.s1)}`)
  for (const q of posti) f = mescolaTesto(f, `${q.tipo}${q.chiave}${q.x},${q.y},${q.accanto.x},${q.accanto.y}`)
  for (const q of confini) for (const c of q.celle) f = mescolaTesto(f, `${c.x},${c.y}`)
  for (let k = 0; k < N; k++) if (sB[k] || sR[k] || sS[k]) { f = mescola(f, k); f = mescola(f, k >> 8); f = mescola(f, k >> 16); f = mescola(f, sB[k] * 16 + sR[k] * 4 + sS[k]) }

  const m = {
    W, H, seme, terra, terraDi: TERRE[Math.min(Math.max(1, terra), TERRE.length) - 1], firma: f.toString(16).padStart(8, '0'),
    lunghezza: Math.round(S), zone, regioni, confini, citta: [villaggio], villaggio, posti, pietre, ingressi, persone, mulino, terre: porta,
    antri: [], tane, partenza, tracciato, distanze, guasti, passi: null,
    // le celle: allocate intere, si riempiono a zona (fino ad allora `zona` −1 e roccia)
    terreno: new Uint8Array(N).fill(ROCCIA), reg: new Int16Array(N).fill(-1), zona: new Int8Array(N).fill(-1), arco: new Float32Array(N),
    ponte: new Int8Array(N).fill(-1), varco: new Int8Array(N).fill(-1), strada: new Uint8Array(N), blocco: new Uint8Array(N),
    riservato: new Uint8Array(N), zonaCitta: new Uint8Array(N), campo: new Uint8Array(N), isola: new Uint8Array(N), quota: new Float32Array(N),
    cintura: new Uint8Array(N),
    zonaCaricata: zone.map(() => false), carico: zone.map(() => null),
    id, ms: 0,
  }
  m.calpestabile = (x, y) => { const k = y * W + x; return (m.terreno[k] === ERBA || m.ponte[k] >= 0) && !m.blocco[k] }
  Object.defineProperty(m, '_', { value: { base, quotaPura, stradaDi, stradaPura, bT, bZ, bL, bP, bV, bA, bD1, bProf, bC, sB, sR, sS, secchiDi, GW,
    primo, fineCintura, cripta, rnd: caso, aLato, campioneDi, sx, sy }, enumerable: false })
  m.msScheletro = Math.round(ora() - t0)
  m.ms = m.msScheletro
  return m
}

/* ═════════════════════════════ una zona ═════════════════════════════ */

// Riempie le celle della zona k e ne fa le liste (decoro, case, campi). Legge solo lo scheletro e le basi pure delle celle: una
// finestra attorno alla zona (MARGINE celle in più) con array suoi, e si scrivono solo le celle della zona
export function caricaZona(m, k) {
  if (m.zonaCaricata[k]) return m.carico[k]
  const t0 = ora()
  const I = m._, { W, H, seme } = m, Z = m.zone[k], nZ = m.zone.length
  const { base, quotaPura, stradaDi, bT, bZ, bL, bP, bV, bA, bC, sB, sR } = I
  const r0 = Z.rettangolo
  const X0 = Math.max(0, r0.x0 - MARGINE), Y0 = Math.max(0, r0.y0 - MARGINE), X1 = Math.min(W - 1, r0.x1 + MARGINE), Y1 = Math.min(H - 1, r0.y1 + MARGINE)
  const w = X1 - X0 + 1, h = Y1 - Y0 + 1, n = w * h
  const G = (x, y) => y * W + x
  const fuori = (i, j) => i < 0 || j < 0 || i >= w || j >= h
  // la finestra: la base di ogni cella e i segni dello scheletro
  const t = new Uint8Array(n), mio = new Uint8Array(n), bl = new Uint8Array(n), ri = new Uint8Array(n), st = new Uint8Array(n)
  const pon = new Int8Array(n), vrc = new Int8Array(n), cit = new Uint8Array(n), luo = new Int8Array(n), arc = new Float32Array(n)
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const K = G(X0 + i, Y0 + j), l = j * w + i
    base(K)
    t[l] = bT[K]; mio[l] = bZ[K] === k ? 1 : 0; bl[l] = sB[K]; ri[l] = sR[K]; st[l] = stradaDi(K)
    pon[l] = bP[K]; vrc[l] = bV[K]; cit[l] = bC[K]; luo[l] = bL[K]; arc[l] = bA[K]
  }
  const bfs = (sorgente, tetto, passa = () => true) => {
    const d = new Int16Array(n).fill(-1), q = []
    for (let l = 0; l < n; l++) if (sorgente(l)) { d[l] = 0; q.push(l) }
    for (let a = 0; a < q.length; a++) {
      const l = q[a]; if (d[l] >= tetto) continue
      const i = l % w, j = (l / w) | 0
      for (const [dx, dy] of QUATTRO) { const nl = (j + dy) * w + i + dx; if (!fuori(i + dx, j + dy) && d[nl] < 0 && passa(nl)) { d[nl] = d[l] + 1; q.push(nl) } }
    }
    return d
  }
  const rnd = I.rnd(seme * 7919 + 17 + k * 104729)
  const regioneDi = l => (luo[l] < 0 ? 0 : I.primo[k] + luo[l])
  const habitatDi = l => HABITAT[m.regioni[regioneDi(l)].habitat] || HABITAT.prato

  // a. quanto si è vicini a una strada, un lotto, un posto riservato, un passaggio, il villaggio; e a un'altra zona
  const presso = bfs(l => st[l] || bl[l] === 1 || ri[l] || pon[l] >= 0 || vrc[l] >= 0 || cit[l], 6)
  const bordo = bfs(l => !mio[l], STACCO_BORDO + 1)
  const interno = l => mio[l] && bordo[l] < 0 && !cit[l]

  // b. l'acqua e la roccia dentro la zona, lontano dalla strada, dai posti e dalle altre zone: il lago, le pozze, gli spuntoni;
  // dietro i dungeon con `appoggio` la gobba di roccia o lo stagno
  const fatto = new Uint8Array(n)
  for (let l = 0; l < n; l++) {
    if (t[l] !== ERBA || !interno(l) || (presso[l] >= 0 && presso[l] < 4)) continue
    const x = X0 + l % w, y = Y0 + ((l / w) | 0), hb = habitatDi(l)
    if (hb.acqua === 'lago') { if (rumore(x, y, seme + 41, 9) > 0.62) { t[l] = ACQUA; fatto[l] = 1 } }
    else if (hb.acqua === 'pozze') { if (rumore(x, y, seme + 43, 4) > 0.64) { t[l] = ACQUA; fatto[l] = 1 } }
    else if (hb.rocce && rumore(x, y, seme + 47, 6) > hb.rocce + 0.04) { t[l] = ROCCIA; fatto[l] = 1 }
  }
  for (const q of m.ingressi) {
    if (q.zona !== Z.chiave || !q.appoggio) continue
    for (let y = q.y - 4; y < q.y; y++) for (let x = q.x - 2; x < q.x + q.w + 2; x++) {
      const i = x - X0, j = y - Y0, l = j * w + i
      if (fuori(i, j) || !mio[l] || t[l] !== ERBA || bl[l] || ri[l] || st[l] || pon[l] >= 0 || vrc[l] >= 0) continue
      if (q.appoggio === 'roccia') { if (Math.abs(x - (q.x + q.w / 2 - 0.5)) <= q.w / 2 + 1.5 - (q.y - y - 1) * 0.35) { t[l] = ROCCIA; fatto[l] = 1 } }
      else if (y >= q.y - 3 && x >= q.x - 1 && x <= q.x + q.w) { t[l] = ACQUA; fatto[l] = 1 }
    }
  }

  // c. l'erba della zona che dalla sua strada non si raggiunge (camminando dentro la zona) diventa roccia, o un isolotto se tocca
  // l'acqua (si vede, non ci si va)
  const cammina = l => (t[l] === ERBA || pon[l] >= 0) && bl[l] !== 1 && bl[l] !== 2
  const giunta = bfs(l => mio[l] && st[l] && cammina(l), 127, l => mio[l] && cammina(l))
  const isola = new Uint8Array(n)
  let tolte = 0
  for (let l = 0; l < n; l++) {
    if (!mio[l] || t[l] !== ERBA || bl[l] || giunta[l] >= 0) continue
    const i = l % w, j = (l / w) | 0
    if (QUATTRO.some(([dx, dy]) => !fuori(i + dx, j + dy) && t[(j + dy) * w + i + dx] === ACQUA)) isola[l] = 1
    else { t[l] = ROCCIA; fatto[l] = 1 }
    tolte++
  }

  // d. i campi coltivati e le case nei luoghi che li hanno, vicino alla strada, con la porta verso la strada più vicina
  const distStrada = bfs(l => st[l] > 0, 12)
  const libera = l => mio[l] && t[l] === ERBA && !isola[l] && pon[l] < 0 && vrc[l] < 0 && !bl[l] && !cit[l]
  const DS = l => (distStrada[l] < 0 ? 99 : distStrada[l])
  function lottoNelLuogo(L, lw, lh, punteggio) {
    let meglio = null, p = -Infinity
    const R = m.regioni[I.primo[k] + L]
    for (let j = 1; j < h - lh - 1; j++) for (let i = 1; i < w - lw - 1; i++) {
      const l0 = j * w + i
      if (!mio[l0] || luo[l0] !== L) continue
      const a = arc[l0]; if (a < R.s0 - 4 || a > R.s1 + 4) continue
      let ok = true
      for (let jj = -1; jj <= lh && ok; jj++) for (let ii = -1; ii <= lw; ii++) {
        const l = (j + jj) * w + i + ii
        if (!libera(l) || ri[l] || st[l] || luo[l] !== L) { ok = false; break }
      }
      if (!ok) continue
      const s = punteggio(i, j)
      if (s > p) { p = s; meglio = { i, j } }
    }
    return meglio
  }
  const COLTURE = { campi: ['grano', 'cavoli', 'grano', 'vigna', 'zucche'], frutteto: ['frutteto'], prato: ['grano', 'zucche'] }
  const campi = [], case_ = [], spiane = []
  const campoL = new Uint8Array(n)
  const ZD = ZONE_DEL_MONDO[k]
  for (const [chiave, quanti] of Object.entries(ZD.campi || {})) {
    const L = Z.luoghi.indexOf(chiave); if (L < 0) continue
    const R = m.regioni[I.primo[k] + L], colture = COLTURE[R.habitat] || COLTURE.campi
    for (let c = 0; c < quanti; c++) {
      const lw = 5 + Math.floor(rnd() * 4), lh = 4 + Math.floor(rnd() * 3)
      const p = I.aLato(R.s0 + (R.s1 - R.s0) * (0.2 + 0.6 * rnd()), rnd() < 0.5 ? 1 : -1, 6 + rnd() * 10)
      const l = lottoNelLuogo(L, lw, lh, (i, j) => -Math.abs(DS((j + lh) * w + i) - 1.5) * 3 - Math.hypot(X0 + i - p.x, Y0 + j - p.y) * 0.4)
      if (!l) continue
      for (let jj = 0; jj < lh; jj++) for (let ii = 0; ii < lw; ii++) { const q = (l.j + jj) * w + l.i + ii; bl[q] = 1; campoL[q] = 1 }
      campi.push({ x: X0 + l.i, y: Y0 + l.j, w: lw, h: lh, regione: chiave, zona: Z.chiave, coltura: colture[campi.length % colture.length], file: rnd() < 0.5 ? 'x' : 'y' })
      spiane.push(campi[campi.length - 1])
    }
  }
  const FORME = [[3, 3], [4, 3], [3, 2], [3, 4], [4, 4]]
  for (const [chiave, quante] of Object.entries(ZD.case || {})) {
    const L = Z.luoghi.indexOf(chiave); if (L < 0) continue
    const R = m.regioni[I.primo[k] + L]
    for (let c = 0; c < quante; c++) {
      const [lw, lh] = FORME[Math.floor(rnd() * FORME.length)]
      const p = I.aLato(R.s0 + (R.s1 - R.s0) * (0.15 + 0.7 * rnd()), rnd() < 0.5 ? 1 : -1, 4 + rnd() * 8)
      const l = lottoNelLuogo(L, lw, lh, (i, j) => {
        let dmn = 99
        for (let jj = -1; jj <= lh; jj++) for (let ii = -1; ii <= lw; ii++) dmn = Math.min(dmn, DS((j + jj) * w + i + ii))
        return -Math.abs(dmn - 1) * 4 - Math.hypot(X0 + i - p.x, Y0 + j - p.y) * 0.6
      })
      if (!l) continue
      let verso = 's', md = 99
      const prova = (v, punti) => { for (const [i, j] of punti) if (!fuori(i, j) && DS(j * w + i) < md) { md = DS(j * w + i); verso = v } }
      prova('s', [[l.i + (lw >> 1), l.j + lh], [l.i + (lw >> 1), l.j + lh + 1]]); prova('n', [[l.i + (lw >> 1), l.j - 1], [l.i + (lw >> 1), l.j - 2]])
      prova('e', [[l.i + lw, l.j + (lh >> 1)], [l.i + lw + 1, l.j + (lh >> 1)]]); prova('o', [[l.i - 1, l.j + (lh >> 1)], [l.i - 2, l.j + (lh >> 1)]])
      for (let jj = 0; jj < lh; jj++) for (let ii = 0; ii < lw; ii++) bl[(l.j + jj) * w + l.i + ii] = 1
      case_.push({ x: X0 + l.i, y: Y0 + l.j, w: lw, h: lh, verso, regione: chiave, zona: Z.chiave, seme: Math.floor(rnd() * 1e6) })
      spiane.push(case_[case_.length - 1])
    }
  }
  if (k === 0) for (const c of m.villaggio.case) case_.push({ ...c, zona: Z.chiave })

  // e. il decoro per habitat: un ingombro (albero, masso, rudere) sta con una cella libera della stessa zona attorno, così non chiude
  // mai una strada; cespugli, fiori e canne non bloccano. Nel villaggio solo gli alberi della pianta; sulla roccia vicino all'erba i
  // massi grandi che fanno la sagoma del monte
  const decoro = []
  const riva = l => { const i = l % w, j = (l / w) | 0; return QUATTRO.some(([dx, dy]) => !fuori(i + dx, j + dy) && t[(j + dy) * w + i + dx] === ACQUA) }
  const liberaAttorno = l => {
    const i = l % w, j = (l / w) | 0
    for (let jj = -1; jj <= 1; jj++) for (let ii = -1; ii <= 1; ii++) { if (!ii && !jj) continue; if (fuori(i + ii, j + jj)) return false; const q = (j + jj) * w + i + ii; if (!libera(q) || st[q]) return false }
    return true
  }
  for (let L = 0; L < Z.luoghi.length; L++) {
    const celle = []
    for (let l = 0; l < n; l++) if (luo[l] === L && libera(l) && !st[l] && !ri[l]) celle.push(l)
    const hb = HABITAT[m.regioni[I.primo[k] + L].habitat] || HABITAT.prato
    const quanti = Math.round(hb.densita * celle.length / 100)
    let messi = 0
    for (let prove = 0; messi < quanti && prove < quanti * 30; prove++) {
      const l = celle[Math.floor(rnd() * celle.length)], x = X0 + l % w, y = Y0 + ((l / w) | 0)
      if (bl[l] || st[l]) continue
      if (hb.macchie && rumore(x, y, seme + 700, 9) < 0.35 && rnd() < 0.7) continue
      const lista = hb.decoro, tot = lista.reduce((s, d) => s + d[1], 0)
      let r = rnd() * tot, d = lista[lista.length - 1]
      for (const z of lista) if ((r -= z[1]) < 0) { d = z; break }
      const [tipo, , blocca] = d
      if (tipo === 'canne' && !riva(l)) continue
      if (blocca) {
        if (!liberaAttorno(l) || (riva(l) && tipo !== 'salice')) continue
        bl[l] = 2
      }
      decoro.push({ tipo, x: x + 0.5 + (rnd() - 0.5) * (blocca ? 0.3 : 0.8), y: y + 0.5 + (rnd() - 0.5) * (blocca ? 0.3 : 0.8), s: 0.8 + rnd() * 0.45, r: rnd() * Math.PI * 2, c: rnd(), blocca: !!blocca })
      messi++
    }
  }
  if (k === 0) {
    const ra = I.rnd(seme * 31 + 7)
    for (const a of m.villaggio.alberi) decoro.push({ tipo: 'tondo', x: a.x + 0.5, y: a.y + 0.5, s: 0.9 + ra() * 0.3, r: ra() * Math.PI * 2, c: ra(), blocca: true })
  }
  const dentroRoccia = bfs(l => t[l] !== ROCCIA, 6, l => t[l] === ROCCIA)
  for (let l = 0; l < n; l++) {
    if (!mio[l] || t[l] !== ROCCIA || dentroRoccia[l] < 0 || dentroRoccia[l] > 3) continue
    if (rnd() < 0.12) decoro.push({ tipo: 'rupe', x: X0 + l % w + rnd(), y: Y0 + ((l / w) | 0) + rnd(), s: 0.9 + rnd() * 1.4, r: rnd() * Math.PI * 2, c: rnd(), blocca: false })
  }

  // f. la quota: quella pura della base, più quello che l'acqua e la roccia dentro la zona cambiano (ammorbidito, solo fra le
  // celle della zona); i lotti spianati, i ponti alla quota della riva più alta
  const quota = new Float32Array(n), delta = new Float32Array(n)
  for (let l = 0; l < n; l++) if (mio[l]) quota[l] = quotaPura(G(X0 + l % w, Y0 + ((l / w) | 0)))
  const fondoAcqua = bfs(l => t[l] !== ACQUA, 4, l => t[l] === ACQUA)
  for (let l = 0; l < n; l++) {
    if (!mio[l] || !fatto[l]) continue
    const x = X0 + l % w, y = Y0 + ((l / w) | 0)
    const b0 = (fbm(x, y, seme + 500, 22) - 0.5) * 1.1 + habitatDi(l).quota
    delta[l] = (t[l] === ROCCIA ? b0 + 0.9 + Math.min(dentroRoccia[l] < 0 ? 6 : dentroRoccia[l], 6) * 0.7 + fbm(x, y, seme + 510, 5) * 1.6
      : LIVELLO_ACQUA - 0.35 - Math.min(fondoAcqua[l] < 0 ? 4 : fondoAcqua[l], 4) * 0.22) - quota[l]
  }
  let dd = delta
  for (let passata = 0; passata < 2; passata++) {
    const o = new Float32Array(n)
    for (let l = 0; l < n; l++) {
      if (!mio[l]) continue
      const i = l % w, j = (l / w) | 0
      let s = 0, c = 0
      for (let jj = -1; jj <= 1; jj++) for (let ii = -1; ii <= 1; ii++) { if (fuori(i + ii, j + jj)) continue; const q = (j + jj) * w + i + ii; s += mio[q] ? dd[q] : 0; c++ }
      o[l] = s / c
    }
    dd = o
  }
  for (let l = 0; l < n; l++) {
    if (!mio[l] || (!fatto[l] && !dd[l])) continue
    const q = quota[l] + dd[l]
    if (fatto[l] && t[l] === ROCCIA) quota[l] = Math.max(q, (quota[l] + delta[l]) * 0.85)
    else if (t[l] === ACQUA) quota[l] = Math.min(q, LIVELLO_ACQUA - 0.18)
    else if (t[l] === ERBA) quota[l] = Math.max(q, LIVELLO_ACQUA + (riva(l) ? 0.07 : 0.14))
    else quota[l] = q
  }
  const spiana = (x, y, lw, lh, alta) => {
    for (let jj = -1; jj <= lh; jj++) for (let ii = -1; ii <= lw; ii++) {
      const i = x - X0 + ii, j = y - Y0 + jj, l = j * w + i
      if (fuori(i, j) || !mio[l] || t[l] !== ERBA) continue
      quota[l] = (ii < 0 || jj < 0 || ii === lw || jj === lh) ? (quota[l] + alta) / 2 : alta
    }
  }
  for (const z of spiane) {
    let s = 0, c = 0
    for (let jj = -1; jj <= z.h; jj++) for (let ii = -1; ii <= z.w; ii++) { const i = z.x - X0 + ii, j = z.y - Y0 + jj, l = j * w + i; if (!fuori(i, j) && mio[l] && t[l] === ERBA) { s += quota[l]; c++ } }
    if (c) spiana(z.x, z.y, z.w, z.h, s / c)
  }
  if (k === 0) spiana(m.villaggio.x, m.villaggio.y, m.villaggio.w, m.villaggio.h, m.villaggio.quota)
  for (const q of m.posti) if (q.quota != null && q.citta !== 'villaggio') spiana(q.x, q.y, q.w, q.h, q.quota)
  for (const c of m.confini) {
    if (c.quota == null) continue
    for (const p of c.celle) { const i = p.x - X0, j = p.y - Y0, l = j * w + i; if (!fuori(i, j) && mio[l] && t[l] === ERBA) quota[l] = c.quota - 0.05 }
  }

  // g. la cintura: niente mostri entro 12 celle dal villaggio, dalla strada fino alla cripta e alla pietra dei prati, dalla cripta
  const cr = I.cripta
  const cintura = bfs(l => {
    if (cit[l]) return true
    const K = G(X0 + l % w, Y0 + ((l / w) | 0))
    if (st[l] && bZ[K] === 0 && arc[l] <= I.fineCintura) return true
    if (!cr) return false
    const x = X0 + l % w, y = Y0 + ((l / w) | 0)
    return x >= cr.x - 1 && x <= cr.x + cr.w && y >= cr.y - 1 && y <= cr.y + cr.h + 2
  }, 12)

  // si scrivono le celle della zona; la firma della zona
  let f = mescola(FNV, k), erba = 0, celle = 0
  for (let l = 0; l < n; l++) {
    if (!mio[l]) continue
    const K = G(X0 + l % w, Y0 + ((l / w) | 0))
    m.terreno[K] = t[l]; m.reg[K] = regioneDi(l); m.zona[K] = k; m.arco[K] = arc[l]
    m.ponte[K] = pon[l]; m.varco[K] = vrc[l]; m.strada[K] = st[l]; m.blocco[K] = bl[l]; m.riservato[K] = ri[l]
    m.zonaCitta[K] = cit[l]; m.campo[K] = campoL[l]; m.isola[K] = isola[l]; m.quota[K] = quota[l]; m.cintura[K] = cintura[l] >= 0 ? 1 : 0
    celle++; if (t[l] === ERBA && !isola[l]) erba++
    f = mescola(f, K); f = mescola(f, K >> 8); f = mescola(f, t[l] * 64 + st[l] * 16 + bl[l] * 4 + isola[l] * 2 + campoL[l]); f = mescola(f, Math.round(quota[l] * 50))
  }
  for (const d of decoro) f = mescolaTesto(f, `${d.tipo}${Math.round(d.x * 10)},${Math.round(d.y * 10)}`)
  for (const z of [...campi, ...case_]) f = mescolaTesto(f, `${z.x},${z.y},${z.w},${z.h}`)
  for (const R of m.regioni) if (R.zona === k && R.chiave !== 'villaggio') R.celle = 0
  for (let l = 0; l < n; l++) if (mio[l] && luo[l] >= 0 && t[l] === ERBA && !isola[l]) m.regioni[I.primo[k] + luo[l]].celle++
  const carico = { zona: k, decoro, case: case_, campi, celle, erba, tolte, firma: f.toString(16).padStart(8, '0'), ms: Math.round(ora() - t0) }
  m.carico[k] = carico
  m.zonaCaricata[k] = true
  Z.area = erba
  return carico
}

// butta le liste della zona (decoro, case, campi): le celle restano scritte, e ricaricandola tornano le stesse
export function scaricaZona(m, k) {
  m.carico[k] = null
  m.zonaCaricata[k] = false
}
export function caricaTutto(m) {
  for (let k = 0; k < m.zone.length; k++) caricaZona(m, k)
  return m
}
// la zona di una cella (il villaggio è della prima): non vuole la zona caricata
export function zonaDi(m, x, y) {
  if (x < 0 || y < 0 || x >= m.W || y >= m.H) return -1
  const k = y * m.W + x; m._.base(k); return m._.bZ[k]
}
export const zoneAttorno = (m, k) => [k - 1, k, k + 1].filter(z => z >= 0 && z < m.zone.length)
// tiene caricate la zona dove sta (x, y) e le due accanto, e butta le altre; torna la zona
export function tieniAttorno(m, x, y) {
  const k = zonaDi(m, x, y)
  if (k < 0) return k
  const vicine = zoneAttorno(m, k)
  for (let z = 0; z < m.zone.length; z++) if (!vicine.includes(z) && m.zonaCaricata[z]) scaricaZona(m, z)
  for (const z of vicine) caricaZona(m, z)
  return k
}
// le liste di tutte le zone caricate, insieme
export const listaDi = (m, nome) => m.carico.flatMap(c => (c ? c[nome] : []))
// il livello dei mostri dove sta (x, y): sale lungo l'arco della zona, dall'inizio alla fine della fascia; 0 nel villaggio
export function livelloDi(m, x, y) {
  const k = y * m.W + x; m._.base(k)
  if (m._.bC[k] || m._.bL[k] < 0) return 0
  const Z = m.zone[m._.bZ[k]], f = Math.max(0, Math.min(1, (m._.bA[k] - Z.s0) / (Z.s1 - Z.s0)))
  return Z.fascia[0] + (Z.fascia[1] - Z.fascia[0]) * f
}
// la base di una cella senza caricare la zona, per chi disegna da lontano: il terreno senza l'acqua e la roccia dentro le zone,
// la zona, l'arco, la quota pura
export function baseDi(m, x, y) {
  const k = y * m.W + x, I = m._
  I.base(k)
  return { terreno: I.bT[k], zona: I.bZ[k], arco: I.bA[k], ponte: I.bP[k], varco: I.bV[k], strada: I.stradaDi(k), quota: I.quotaPura(k) }
}

/* ═════════════════════════════ le misure ═════════════════════════════ */

// Con tutte le zone caricate (strumenti e test, in Node): i passi dalla piazza a tutto, le distanze vere, i guasti del percorso
export function misuraDelMondo(m) {
  const t0 = ora()
  if (m.zonaCaricata.some(c => !c)) caricaTutto(m)
  const { W, H } = m, id = (x, y) => y * W + x
  const g = m.guasti
  const cammina = (x, y) => m.calpestabile(x, y)
  const passi = passiDa(W, H, cammina, m.partenza)
  m.passi = passi
  const passiA = c => passi[id(c.x, c.y)]
  for (const z of m.posti) if (passiA(z.accanto) < 0) g.push(`non si arriva a ${z.tipo} ${z.chiave} (${z.accanto.x},${z.accanto.y})`)
  // da una pietra alla dopo, e nessuna scorciatoia fra le file: dalla pietra alla seconda dopo non meno dell'80% del giro lungo
  const pz = m.pietre.filter(q => q.zona && q.chiave.startsWith('zona:'))
  const da = pz.map(q => passiDa(W, H, cammina, q.accanto))
  const fraPietre = []
  for (let i = 0; i + 1 < pz.length; i++) {
    const a1 = da[i][id(pz[i + 1].accanto.x, pz[i + 1].accanto.y)]
    fraPietre.push({ da: pz[i].zona, a: pz[i + 1].zona, passi: a1 })
    if (a1 < PASSI_FRA_PIETRE[0] || a1 > PASSI_FRA_PIETRE[1]) g.push(`da ${pz[i].zona} a ${pz[i + 1].zona}: ${a1} passi (si vuole ${PASSI_FRA_PIETRE.join('–')})`)
    if (i + 2 < pz.length) {
      const a2 = da[i][id(pz[i + 2].accanto.x, pz[i + 2].accanto.y)], b = da[i + 1][id(pz[i + 2].accanto.x, pz[i + 2].accanto.y)]
      if (a2 < 0.8 * (a1 + b)) g.push(`da ${pz[i].zona} a ${pz[i + 2].zona} c'è una scorciatoia (${a2} passi contro ${a1 + b})`)
    }
  }
  // la storia in fila anche a piedi, la cripta vicina e nella cintura, ogni zona coi suoi dungeon
  const storia = m.ingressi.filter(q => q.storia).sort((a, b) => a.indice - b.indice)
  for (let i = 1; i < storia.length; i++) if (!(passiA(storia[i].accanto) > passiA(storia[i - 1].accanto)))
    g.push(`${storia[i].nome} non è più lontana di ${storia[i - 1].nome}`)
  const cripta = m.ingressi.find(q => q.chiave === 'altare')
  if (cripta && passiA(cripta.accanto) > CRIPTA_AL_PIU) g.push(`la cripta sta a ${passiA(cripta.accanto)} passi dalla piazza (al più ${CRIPTA_AL_PIU})`)
  if (cripta && !m.cintura[id(cripta.accanto.x, cripta.accanto.y)]) g.push('la cripta non sta nella cintura')
  for (const Z of m.zone) if (m.ingressi.filter(q => q.zona === Z.chiave).length !== 2) g.push(`${Z.nome} non ha due dungeon`)
  // chi sta fermo non chiude la strada a nessuno; i posti non si pestano
  {
    const fermi = new Set(m.posti.filter(z => ['persona', 'mercante', 'minatore'].includes(z.tipo)).map(z => id(z.piede.x, z.piede.y)))
    const senza = passiDa(W, H, (x, y) => cammina(x, y) || fermi.has(id(x, y)), m.partenza)
    for (let k = 0; k < W * H; k++) if (senza[k] >= 0 && passi[k] < 0 && !fermi.has(k)) { g.push(`chi sta fermo chiude la strada a ${k % W},${(k / W) | 0}`); break }
  }
  const dove = new Int16Array(W * H).fill(-1)
  m.posti.forEach((z, i) => {
    if (z.tipo === 'citta' || z.tipo === 'portale') return
    for (let j = 0; j < z.h; j++) for (let k = 0; k < z.w; k++) { const c = id(z.x + k, z.y + j); if (dove[c] >= 0) g.push(`${z.tipo} ${z.chiave} sta sopra ${m.posti[dove[c]].tipo} ${m.posti[dove[c]].chiave}`); dove[c] = i }
  })
  for (const z of m.posti) if (z.tipo !== 'citta' && dove[id(z.accanto.x, z.accanto.y)] >= 0) g.push(`chi va da ${z.tipo} ${z.chiave} si ferma sopra un altro posto`)
  for (const c of m.confini) for (const r of c.rive) if (passiA(r) < 0) g.push(`il confine ${c.nome} non porta da una riva all'altra`)
  m.distanze = {
    pietre: fraPietre,
    dungeon: m.ingressi.map(q => ({ chiave: q.chiave, zona: q.zona, passi: passiA(q.accanto) })),
    cripta: cripta ? passiA(cripta.accanto) : -1,
  }
  let f = FNV
  for (const c of m.carico) f = mescolaTesto(f, c.firma)
  m.firmaCelle = f.toString(16).padStart(8, '0')
  m.msMisure = Math.round(ora() - t0)
  return m
}

// tutto insieme: lo scheletro, tutte le zone, le misure (per strumenti e test)
export function generaMondoPercorso(seme = MONDO_PERCORSO.seme, opz = {}) {
  const t0 = ora()
  const m = scheletroDelMondo(seme, opz)
  caricaTutto(m)
  misuraDelMondo(m)
  m.ms = Math.round(ora() - t0)
  return m
}

// la maschera del mondo per motore/terra.js (`creaTerra`): una riga per fila, `.` si cammina e `#` no. Le zone non caricate
// sono `#`
export function mascheraDelMondo(m) {
  const righe = []
  for (let y = 0; y < m.H; y++) { let s = ''; for (let x = 0; x < m.W; x++) s += m.calpestabile(x, y) ? '.' : '#'; righe.push(s) }
  return righe
}

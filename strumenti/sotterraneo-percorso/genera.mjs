// Il prototipo del generatore del mondo a percorso (docs/sotterraneo/mondo-a-percorso.md): dalla scheda (scheda.mjs) e da un
// seme la mappa di celle con la strada maestra a serpentina, le sette zone in fila, i confini fra due zone (un fiume col ponte o
// una cresta col valico, nessuna grata), le creste fra una fila e l'altra, il villaggio con la sua pianta fissa, gli avamposti,
// le pietre runiche al centro delle zone, i dungeon con la loro stradina, le tane, la cintura di sicurezza; e le misure (passi da
// pietra a pietra, scorciatoie, la cripta vicina) coi guasti. Non è il gioco: lo legge solo la pianta (`npm run pianta --
// --percorso`); quando il progetto è approvato si porta in motore/mondo-aperto.js. Puro, gira in Node.
import { PERCORSO, TRACCIATO, ZONE, DUNGEON, CITTA, VILLAGGIO, AVAMPOSTO, TERRE, PERSONE, MULINO, PORTA_DELLE_TERRE } from './scheda.mjs'
import { HABITAT } from '../../src/giochi/sotterraneo/dati/mondo-aperto.js'
import { cerca, passiDa } from '../../src/giochi/sotterraneo/motore/mondo-aperto-strade.js'

export const ERBA = 0, ACQUA = 1, ROCCIA = 2
const QUATTRO = [[1, 0], [-1, 0], [0, 1], [0, -1]]

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

// la fascia di una zona in una terra: la prima terra com'è nella scheda, ogni terra dopo `salto` livelli più su
export const fasciaNellaTerra = (fascia, terra = 1) => fascia.map(v => v + PERCORSO.salto * (Math.min(terra, PERCORSO.terre) - 1))

export function generaPercorso({ seme = PERCORSO.seme, terra = 1 } = {}) {
  const t0 = Date.now()
  const W = PERCORSO.largo, H = PERCORSO.alto, N = W * H
  const id = (x, y) => y * W + x
  const dentro = (x, y) => x >= 0 && y >= 0 && x < W && y < H
  const guasti = []

  // 1. la strada maestra: una curva liscia (Catmull-Rom) per i punti del tracciato, un campione ogni mezza cella, col suo arco `s`
  const sx = [], sy = [], ss = [], tx = [], ty = []
  {
    const P = TRACCIATO
    let s = 0, px = null, py = null
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)]
      const lun = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), passi = Math.ceil(lun * 2)
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
  const campioneDi = s => { let lo = 0, hi = nC - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (ss[m] < s) lo = m + 1; else hi = m } return lo }
  // il punto a `fondo` celle dalla strada, a sinistra (lato +1) o a destra (−1) guardando avanti
  const aLato = (s, lato, fondo) => { const i = campioneDi(s); return { x: sx[i] + ty[i] * lato * fondo, y: sy[i] - tx[i] * lato * fondo } }

  // 2. le zone lungo l'arco, in proporzione al peso; i luoghi in fila dentro la zona
  const pesi = ZONE.reduce((n, z) => n + z.peso, 0)
  const zone = []
  { let s = 0; for (const [i, Z] of ZONE.entries()) { const l = S * Z.peso / pesi; zone.push({ ...Z, i, s0: s, s1: s + l, fascia: fasciaNellaTerra(Z.fascia, terra) }); s += l } }
  const zonaDiS = s => { for (const z of zone) if (s < z.s1) return z.i; return zone.length - 1 }

  // 3. ogni cella: il campione più vicino (d1) e il più vicino di un'altra fila (d2, un arco lontano più di 100 celle). Fuori dal
  // corridoio è roccia; dove due file si avvicinano, una cresta a metà strada. Una griglia di secchi per non provarli tutti
  const SEC = 12, GW = Math.ceil(W / SEC), GH = Math.ceil(H / SEC), secchi = Array.from({ length: GW * GH }, () => [])
  for (let i = 0; i < nC; i += 2) secchi[Math.floor(sy[i] / SEC) * GW + Math.floor(sx[i] / SEC)]?.push(i)
  const terreno = new Uint8Array(N).fill(ROCCIA), zona = new Int8Array(N).fill(-1), luogo = new Int8Array(N).fill(-1)
  const arco = new Float32Array(N), dSpina = new Float32Array(N).fill(99)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const gx = Math.floor(x / SEC), gy = Math.floor(y / SEC)
    let i1 = -1, d1 = Infinity
    for (let j = gy - 4; j <= gy + 4; j++) for (let i = gx - 4; i <= gx + 4; i++) {
      if (i < 0 || j < 0 || i >= GW || j >= GH) continue
      for (const c of secchi[j * GW + i]) { const d = Math.hypot(x - sx[c], y - sy[c]); if (d < d1) { d1 = d; i1 = c } }
    }
    if (i1 < 0) continue
    let d2 = Infinity
    for (let j = gy - 4; j <= gy + 4; j++) for (let i = gx - 4; i <= gx + 4; i++) {
      if (i < 0 || j < 0 || i >= GW || j >= GH) continue
      for (const c of secchi[j * GW + i]) if (Math.abs(ss[c] - ss[i1]) > 100) { const d = Math.hypot(x - sx[c], y - sy[c]); if (d < d2) d2 = d }
    }
    const k = id(x, y), s = ss[i1]
    arco[k] = s; dSpina[k] = d1
    const largo = PERCORSO.mezza * (0.82 + 0.36 * rumore(s, 0, seme + 11, 37)) + 5 * (rumore(x, y, seme + 13, 7) - 0.5)
    const bordo = Math.min(x, y, W - 1 - x, H - 1 - y)
    if (bordo < 3 || d1 > largo || d2 - d1 < 5 + 2 * rumore(x, y, seme + 17, 5)) continue
    terreno[k] = ERBA
    const z = zonaDiS(s); zona[k] = z
    const Z = zone[z], f = (s - Z.s0) / (Z.s1 - Z.s0)
    luogo[k] = Math.min(Z.luoghi.length - 1, Math.floor(f * Z.luoghi.length))
  }

  // 4. i confini fra due zone, di traverso alla strada: un fiume col ponte o una cresta col valico (nessuna grata: si passa sempre)
  const ponte = new Int8Array(N).fill(-1), varco = new Int8Array(N).fill(-1)
  const confini = []
  for (const Z of zone.slice(0, -1)) {
    const sB = Z.s1, tipo = Z.confine.tipo
    const largo = tipo === 'ponte' ? (Z.confine.modello === 'arco' ? 2 : 1.4) : 1.8
    const celle = []
    for (let k = 0; k < N; k++) {
      if (zona[k] < 0 || Math.abs(arco[k] - sB) > largo + 1.2 * (rumore(k % W, (k / W) | 0, seme + 21, 6) - 0.5)) continue
      if (tipo === 'ponte') { if (dSpina[k] <= 1.6) { ponte[k] = Z.i; celle.push(k) } else terreno[k] = ACQUA }
      else if (dSpina[k] <= 3.2) { varco[k] = Z.i; celle.push(k) } else terreno[k] = ROCCIA
    }
    const p = aLato(sB, 1, 0)
    confini.push({ da: Z.chiave, a: zone[Z.i + 1].chiave, tipo, modello: Z.confine.modello || null, nome: Z.confine.nome, x: Math.round(p.x), y: Math.round(p.y), celle: celle.length })
  }

  // 5. il villaggio, con la sua pianta fissa: il cancello a est sta sull'inizio della strada maestra
  const strada = new Uint8Array(N), blocco = new Uint8Array(N), riservato = new Uint8Array(N), citta = new Int8Array(N).fill(-1)
  const posti = [], case_ = [], alberi = []
  const V = VILLAGGIO, vx = Math.round(sx[0]) - V.cancello.x - 1, vy = Math.round(sy[0]) - V.cancello.y
  for (let y = vy - 2; y < vy + V.h + 2; y++) for (let x = vx - 2; x < vx + V.w + 2; x++) {
    if (!dentro(x, y)) continue
    const k = id(x, y); terreno[k] = ERBA; zona[k] = -1; luogo[k] = -1
    if (x >= vx && y >= vy && x < vx + V.w && y < vy + V.h) citta[k] = 0
  }
  const occupa = (x, y, w, h, v = 1) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (dentro(x + i, y + j)) blocco[id(x + i, y + j)] = v }
  const riserva = (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (dentro(x + i, y + j)) riservato[id(x + i, y + j)] = 1 }
  for (let y = 0; y < V.piazza.h; y++) for (let x = 0; x < V.piazza.w; x++) strada[id(vx + V.piazza.x + x, vy + V.piazza.y + y)] = 3
  for (const l of V.lotti) {
    if (l.tipo !== 'portale') occupa(vx + l.x, vy + l.y, l.w, l.h)
    posti.push({ ...l, citta: 'villaggio', x: vx + l.x, y: vy + l.y, piede: { x: vx + l.piede.x, y: vy + l.piede.y }, accanto: { x: vx + l.accanto.x, y: vy + l.accanto.y } })
  }
  for (const c of V.case) { occupa(vx + c.x, vy + c.y, c.w, c.h); case_.push({ ...c, x: vx + c.x, y: vy + c.y }) }
  for (const [x, y] of V.alberi) { occupa(vx + x, vy + y, 1, 1, 2); alberi.push({ x: vx + x, y: vy + y }) }
  const partenza = { x: vx + V.partenza.x, y: vy + V.partenza.y }
  for (let x = vx + V.piazza.x + V.piazza.w; x <= Math.round(sx[0]); x++) for (const y of [vy + V.cancello.y, vy + V.cancello.y - 1]) strada[id(x, y)] = 2
  const villaggio = { chiave: 'villaggio', nome: 'Il villaggio', x: vx, y: vy, w: V.w, h: V.h, partenza }

  // 6. la strada maestra: le celle a una cella dalla curva
  for (let k = 0; k < N; k++) if (dSpina[k] <= 1.05 && (terreno[k] === ERBA || ponte[k] >= 0) && citta[k] < 0) strada[k] = Math.max(strada[k], 2)

  // un lotto vicino al punto voluto: tutto erba della zona, fuori dalla strada e da altri lotti, con un anello libero; si cerca a
  // spirale fino a otto celle
  const libero = k => terreno[k] === ERBA && ponte[k] < 0 && varco[k] < 0 && !blocco[k] && !riservato[k]
  function lottoVicino(p, w, h, zi, { margine = 1, sud = 3, strade = false, raggio = 8 } = {}) {
    for (let r = 0; r <= raggio; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
      const x = Math.round(p.x - w / 2) + dx, y = Math.round(p.y - h / 2) + dy
      let ok = true
      for (let j = -margine; j < h + sud && ok; j++) for (let i = -margine; i < w + margine; i++) {
        const a = x + i, b = y + j
        if (!dentro(a, b)) { ok = false; break }
        const k = id(a, b)
        if (!libero(k) || (zi != null && zona[k] !== zi) || citta[k] >= 0) { ok = false; break }
        if (!strade && j < h && i >= 0 && i < w && j >= 0 && strada[k]) { ok = false; break }
      }
      if (ok) return { x, y }
    }
    return null
  }

  // 7. gli avamposti: la piazza a fianco della strada maestra, all'entrata della loro zona
  const cittaFatte = [villaggio]
  for (const [ci, C] of CITTA.entries()) {
    if (!C.zona) continue
    const Z = zone.find(z => z.chiave === C.zona), A = AVAMPOSTO
    const l = [C.lato, -C.lato].map(lato => lottoVicino(aLato(Z.s0 + C.s, lato, A.h / 2 + 2), A.w, A.h, Z.i, { margine: 0, sud: 0, strade: true, raggio: 14 })).find(Boolean)
    if (!l) { guasti.push(`nessun posto per ${C.nome}`); continue }
    for (let j = 0; j < A.h; j++) for (let i = 0; i < A.w; i++) { const k = id(l.x + i, l.y + j); citta[k] = ci; strada[k] = 0 }
    for (let j = 0; j < A.piazza.h; j++) for (let i = 0; i < A.piazza.w; i++) strada[id(l.x + A.piazza.x + i, l.y + A.piazza.y + j)] = 3
    const chi = [...C.mercanti, ...C.persone]
    chi.forEach((chiave, n) => {
      const q = A.posti[n]; if (!q) return guasti.push(`${C.nome}: non c'è posto per ${chiave}`)
      occupa(l.x + q.x, l.y + q.y, q.w, q.h)
      posti.push({ tipo: C.mercanti.includes(chiave) ? 'mercante' : 'persona', chiave, citta: C.chiave, x: l.x + q.x, y: l.y + q.y, w: q.w, h: q.h,
        piede: { x: l.x + q.x + 1, y: l.y + q.y + q.h }, accanto: { x: l.x + q.x + 1, y: l.y + q.y + q.h + 2 } })
    })
    const posa = (tipo, chiave, q, w = q.w || 1, h = q.h || 1) => {
      if (tipo !== 'portale') occupa(l.x + q.x, l.y + q.y, w, h)
      posti.push({ tipo, chiave, citta: C.chiave, x: l.x + q.x, y: l.y + q.y, w, h, piede: { x: l.x + q.x, y: l.y + q.y }, accanto: { x: l.x + q.x, y: l.y + q.y + h + 1 } })
    }
    posa('pietra', C.chiave, A.pietra); posa('portale', C.chiave, A.portale); posa('bacheca', `bacheca:${C.chiave}`, A.bacheca)
    if (C.fontana) posa('fontana', C.chiave, A.fontana)
    // la strada maestra attraversa la piazza: dal suo bordo a sud fino alla curva
    const via = cerca(W, H, k => (terreno[k] === ERBA && !blocco[k] ? (strada[k] ? 0.3 : 1) : Infinity),
      { x: l.x + (A.w >> 1), y: l.y + A.piazza.y + A.piazza.h - 1 }, { x: Math.round(aLato(Z.s0 + C.s, 0, 0).x), y: Math.round(aLato(Z.s0 + C.s, 0, 0).y) })
    if (via) for (const c of via) if (!strada[id(c.x, c.y)]) strada[id(c.x, c.y)] = 2
    cittaFatte.push({ chiave: C.chiave, nome: C.nome, x: l.x, y: l.y, w: A.w, h: A.h, zona: Z.chiave })
  }

  // 8. le pietre runiche, una al centro di ogni zona, accanto alla strada; i dungeon con la loro stradina; le tane dei luoghi
  const pietre = [], ingressi = [], tane = []
  for (const Z of zone) {
    const sm = (Z.s0 + Z.s1) / 2
    const l = lottoVicino(aLato(sm, 1, 4), 2, 2, Z.i)
    if (!l) { guasti.push(`nessun posto per la pietra di ${Z.nome}`); continue }
    occupa(l.x, l.y, 2, 2); riserva(l.x - 1, l.y + 2, 4, 2)
    pietre.push({ tipo: 'pietra', chiave: `zona:${Z.chiave}`, zona: Z.chiave, x: l.x, y: l.y, w: 2, h: 2, piede: { x: l.x + 1, y: l.y + 1 }, accanto: { x: l.x + 1, y: l.y + 3 } })
  }
  const costoStrada = k => {
    if (ponte[k] >= 0) return 0.3
    if (terreno[k] !== ERBA || blocco[k]) return Infinity
    return strada[k] ? 0.3 : 1 + 0.4 * rumore(k % W, (k / W) | 0, seme + 31, 5)
  }
  for (const Z of zone) for (const d of Z.dungeon) {
    const D = DUNGEON[d.chiave]
    const s = Z.s0 + (Z.s1 - Z.s0) * d.f
    const l = lottoVicino(aLato(s, d.lato, d.fondo), D.w, D.h, Z.i, { margine: 2 })
    if (!l) { guasti.push(`nessun posto per ${D.nome}`); continue }
    occupa(l.x, l.y, D.w, D.h); riserva(l.x - 1, l.y + D.h, D.w + 2, 3)
    const accanto = { x: l.x + (D.w >> 1), y: l.y + D.h + 1 }
    const q = { tipo: 'ingresso', chiave: d.chiave, ...D, livello: fasciaNellaTerra([D.livello], terra)[0], zona: Z.chiave, x: l.x, y: l.y, piede: { x: accanto.x, y: l.y + D.h - 1 }, accanto,
      storia: D.indice != null && D.indice >= 0 }
    ingressi.push(q)
    const i = campioneDi(s)
    const via = cerca(W, H, costoStrada, accanto, { x: Math.round(sx[i]), y: Math.round(sy[i]) })
    if (!via) guasti.push(`nessuna stradina per ${D.nome}`)
    else for (const c of via) if (!strada[id(c.x, c.y)]) strada[id(c.x, c.y)] = 1
  }
  for (const Z of zone) Z.luoghi.forEach(([chiave], n) => {
    const s = Z.s0 + (Z.s1 - Z.s0) * (n + 0.5) / Z.luoghi.length
    const vicino = ingressi.filter(q => q.zona === Z.chiave).sort((a, b) => Math.abs(campioneDiPos(a) - s) - Math.abs(campioneDiPos(b) - s))[0]
    const lato = vicino && Math.abs(campioneDiPos(vicino) - s) < 40 ? -ladoDi(vicino) : (n % 2 ? 1 : -1)
    const l = lottoVicino(aLato(s, lato, 14), 3, 3, Z.i, { margine: 2, sud: 2 })
    if (!l) return guasti.push(`nessun posto per la tana di ${chiave}`)
    riserva(l.x - 2, l.y - 2, 7, 7)
    tane.push({ luogo: chiave, zona: Z.chiave, x: l.x + 1, y: l.y + 1 })
  })
  function campioneDiPos(q) { return arco[id(q.accanto.x, q.accanto.y)] }
  function ladoDi(q) { const i = campioneDi(campioneDiPos(q)); return Math.sign((q.accanto.x - sx[i]) * ty[i] - (q.accanto.y - sy[i]) * tx[i]) || 1 }
  // il mulino sulla riva del fiume, poco prima del ponte; la porta delle terre in fondo; chi sta fermo vicino al suo posto
  const altri = []
  {
    const Z = zone.find(z => z.chiave === MULINO.zona)
    const l = lottoVicino(aLato(Z.s1 - MULINO.prima, MULINO.lato, MULINO.fondo), MULINO.w, MULINO.h, Z.i)
    if (!l) guasti.push('nessun posto per il mulino')
    else { occupa(l.x, l.y, MULINO.w, MULINO.h); altri.push({ tipo: 'mulino', chiave: 'mulino', zona: Z.chiave, x: l.x, y: l.y, w: MULINO.w, h: MULINO.h, piede: { x: l.x + 1, y: l.y + 2 }, accanto: { x: l.x + 1, y: l.y + 4 } }) }
    const T = PORTA_DELLE_TERRE, ZT = zone.find(z => z.chiave === T.zona)
    const lt = lottoVicino(aLato(ZT.s0 + (ZT.s1 - ZT.s0) * T.f, T.lato, T.fondo), T.w, T.h, ZT.i, { strade: true })
    if (!lt) guasti.push('nessun posto per la porta delle terre')
    else { occupa(lt.x, lt.y, T.w, T.h); altri.push({ tipo: 'terre', chiave: 'porta-delle-terre', zona: ZT.chiave, x: lt.x, y: lt.y, w: T.w, h: T.h, piede: { x: lt.x + 1, y: lt.y + 1 }, accanto: { x: lt.x + 1, y: lt.y + T.h + 1 } }) }
  }
  for (const P of PERSONE) {
    const v = [...ingressi, ...altri].find(q => q.chiave === P.vicino)
    if (!v) { guasti.push(`${P.chiave} non trova ${P.vicino}`); continue }
    const l = lottoVicino({ x: v.accanto.x + 5, y: v.accanto.y }, 1, 1, null, { margine: 1, sud: 3 })
    if (!l) { guasti.push(`nessun posto per ${P.chiave}`); continue }
    occupa(l.x, l.y, 1, 1); riserva(l.x - 1, l.y + 1, 3, 2)
    altri.push({ tipo: 'persona', chiave: P.chiave, x: l.x, y: l.y, w: 1, h: 1, piede: { x: l.x, y: l.y }, accanto: { x: l.x, y: l.y + 2 } })
  }
  posti.push(...pietre, ...ingressi, ...altri)

  // 9. l'acqua e la roccia dentro le zone, lontano dalla strada e dai posti: il lago del bosco, le pozze della palude, gli spuntoni
  const presso = new Int16Array(N).fill(-1)
  {
    const q = []
    for (let k = 0; k < N; k++) if (strada[k] || blocco[k] === 1 || riservato[k] || ponte[k] >= 0 || varco[k] >= 0 || citta[k] >= 0) { presso[k] = 0; q.push(k) }
    for (let i = 0; i < q.length; i++) {
      const k = q[i]; if (presso[k] >= 6) continue
      const x = k % W, y = (k / W) | 0
      for (const [dx, dy] of QUATTRO) { const nk = id(x + dx, y + dy); if (dentro(x + dx, y + dy) && presso[nk] < 0) { presso[nk] = presso[k] + 1; q.push(nk) } }
    }
  }
  const lontano = k => presso[k] < 0 || presso[k] >= 4
  for (let k = 0; k < N; k++) {
    if (terreno[k] !== ERBA || zona[k] < 0 || !lontano(k)) continue
    const x = k % W, y = (k / W) | 0, Z = zone[zona[k]], hb = HABITAT[Z.luoghi[luogo[k]][1]] || {}
    if (hb.acqua === 'lago') { if (rumore(x, y, seme + 41, 9) > 0.62) terreno[k] = ACQUA }
    else if (hb.acqua === 'pozze') { if (rumore(x, y, seme + 43, 4) > 0.64) terreno[k] = ACQUA }
    else if (hb.rocce && rumore(x, y, seme + 47, 6) > hb.rocce + 0.04) terreno[k] = ROCCIA
  }

  // 10. si cammina sull'erba e sui ponti; un pezzo d'erba che dalla piazza non si raggiunge diventa roccia (o resta un isolotto)
  const cammina = (x, y) => { const k = id(x, y); return (terreno[k] === ERBA || ponte[k] >= 0) && blocco[k] !== 1 && blocco[k] !== 2 }
  let passi = passiDa(W, H, cammina, partenza)
  let tolte = 0
  for (let k = 0; k < N; k++) if (terreno[k] === ERBA && passi[k] < 0 && !blocco[k]) { terreno[k] = ROCCIA; tolte++ }
  passi = passiDa(W, H, cammina, partenza)

  // 11. la cintura: niente mostri entro 12 celle dal villaggio e dalla strada fino alla cripta e alla sua pietra
  const cintura = new Uint8Array(N)
  {
    const cripta = ingressi.find(q => q.chiave === 'altare')
    const fin = cripta ? Math.max(campioneDiPos(cripta), arco[id(pietre[0].accanto.x, pietre[0].accanto.y)]) + 8 : 0
    const d = new Int16Array(N).fill(-1), q = []
    for (let k = 0; k < N; k++) if (citta[k] === 0 || (strada[k] && zona[k] === 0 && arco[k] <= fin)) { d[k] = 0; q.push(k) }
    if (cripta) for (let j = -1; j <= cripta.h + 2; j++) for (let i = -1; i <= cripta.w; i++) { const k = id(cripta.x + i, cripta.y + j); if (d[k] < 0) { d[k] = 0; q.push(k) } }
    for (let i = 0; i < q.length; i++) {
      const k = q[i]; cintura[k] = 1; if (d[k] >= 12) continue
      const x = k % W, y = (k / W) | 0
      for (const [dx, dy] of QUATTRO) { const nk = id(x + dx, y + dy); if (dentro(x + dx, y + dy) && d[nk] < 0) { d[nk] = d[k] + 1; q.push(nk) } }
    }
  }

  // 12. le misure e i guasti
  const passiA = c => passi[id(c.x, c.y)]
  for (const z of posti) if (passiA(z.accanto) < 0) guasti.push(`non si arriva a ${z.tipo} ${z.chiave}`)
  const fraPietre = []
  for (let i = 0; i + 1 < pietre.length; i++) {
    const da = passiDa(W, H, cammina, pietre[i].accanto)
    const a1 = da[id(pietre[i + 1].accanto.x, pietre[i + 1].accanto.y)]
    fraPietre.push({ da: pietre[i].zona, a: pietre[i + 1].zona, passi: a1 })
    if (i + 2 < pietre.length) {
      const a2 = da[id(pietre[i + 2].accanto.x, pietre[i + 2].accanto.y)]
      const db = passiDa(W, H, cammina, pietre[i + 1].accanto)[id(pietre[i + 2].accanto.x, pietre[i + 2].accanto.y)]
      if (a2 < 0.8 * (a1 + db)) guasti.push(`da ${pietre[i].zona} a ${pietre[i + 2].zona} c'è una scorciatoia (${a2} passi contro ${a1 + db})`)
    }
  }
  for (const f of fraPietre) if (f.passi < 130 || f.passi > 220) guasti.push(`da ${f.da} a ${f.a}: ${f.passi} passi (si vuole 130–220)`)
  const storia = ingressi.filter(q => q.storia).sort((a, b) => a.indice - b.indice)
  for (let i = 1; i < storia.length; i++) if (!(passiA(storia[i].accanto) > passiA(storia[i - 1].accanto)))
    guasti.push(`${storia[i].nome} non è più lontana di ${storia[i - 1].nome}`)
  const cripta = ingressi.find(q => q.chiave === 'altare')
  if (cripta && passiA(cripta.accanto) > 75) guasti.push(`la cripta sta a ${passiA(cripta.accanto)} passi dalla piazza (al più 75)`)
  if (cripta && !cintura[id(cripta.accanto.x, cripta.accanto.y)]) guasti.push('la cripta non sta nella cintura')
  for (const Z of zone) if (!ingressi.some(q => q.zona === Z.chiave)) guasti.push(`${Z.nome} non ha dungeon`)
  const area = zone.map(() => 0)
  for (let k = 0; k < N; k++) if (zona[k] >= 0 && passi[k] >= 0) area[zona[k]]++

  let f = 0x811c9dc5
  const mescola = v => { f ^= v & 0xff; f = Math.imul(f, 16777619) >>> 0 }
  for (let k = 0; k < N; k++) { mescola(terreno[k]); mescola(zona[k] + 1); mescola(strada[k]); mescola(blocco[k]); mescola(ponte[k] + 1) }
  for (const z of posti) for (const ch of `${z.tipo}${z.chiave}${z.x},${z.y}`) mescola(ch.charCodeAt(0))

  return {
    W, H, seme, terra, terraDi: TERRE[Math.min(terra, TERRE.length) - 1], firma: f.toString(16).padStart(8, '0'), ms: Date.now() - t0,
    terreno, zona, luogo, arco, strada, blocco, ponte, varco, citta, cintura, passi,
    zone: zone.map((Z, i) => ({ ...Z, area: area[i] })), confini, villaggio, citta_: cittaFatte, posti, pietre, ingressi, tane, case: case_, alberi,
    partenza, lunghezza: Math.round(S), fraPietre, tolte, guasti, aLato,
  }
}

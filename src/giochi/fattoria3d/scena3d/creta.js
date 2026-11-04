// La creta: forme morbide fatte di campi di distanza (palle, ossa a cono tondo) che si fondono l'una nell'altra, e una rete (surface nets) che ne
// prende la pelle, con le normali dal campo (liscia anche a pochi lati) e i colori nei vertici da una funzione della posizione. Serve agli animali
// di casa: il collo entra nella testa, la zampa nella spalla, la coda nel sedere, senza palle incollate. Vedi docs/fattoria3d/creta.md.
import * as THREE from 'three'

/* ══════════ le forme: (x, y, z) → distanza dalla pelle (negativa dentro) ══════════ */
// Ognuna ha `f` e una sfera che la contiene (`c`, `r`): fuori da quella, a chi unisce basta sapere che è lontana.

/** Un ellissoide di centro `c` e raggi `r` (la distanza è quella approssimata di Quilez: giusta vicino alla pelle). */
export function palla (c, r) {
  const [cx, cy, cz] = c, [rx, ry, rz] = Array.isArray(r) ? r : [r, r, r]
  const f = (x, y, z) => {
    const px = (x - cx) / rx, py = (y - cy) / ry, pz = (z - cz) / rz
    const k0 = Math.sqrt(px * px + py * py + pz * pz)
    if (k0 < 1e-9) return -Math.min(rx, ry, rz)
    const k1 = Math.sqrt(px * px / (rx * rx) + py * py / (ry * ry) + pz * pz / (rz * rz))
    return k0 * (k0 - 1) / k1
  }
  return { f, c: [cx, cy, cz], r: Math.max(rx, ry, rz) }
}

/** Un osso: un cono dalle punte tonde fra il punto `a` (raggio `ra`) e il punto `b` (raggio `rb`). Esatto (Quilez, sdRoundCone). */
export function osso (a, b, ra, rb = ra) {
  const [ax, ay, az] = a, bax = b[0] - ax, bay = b[1] - ay, baz = b[2] - az
  const l2 = bax * bax + bay * bay + baz * baz || 1e-12, rr = ra - rb, a2 = l2 - rr * rr, il2 = 1 / l2
  const f = (x, y, z) => {
    const pax = x - ax, pay = y - ay, paz = z - az
    const yy = pax * bax + pay * bay + paz * baz, zz = yy - l2
    const qx = pax * l2 - bax * yy, qy = pay * l2 - bay * yy, qz = paz * l2 - baz * yy
    const x2 = qx * qx + qy * qy + qz * qz, y2 = yy * yy * l2, z2 = zz * zz * l2
    const k = Math.sign(rr) * rr * rr * x2
    if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - rb
    if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - ra
    return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - ra
  }
  const L = Math.sqrt(l2)
  return { f, c: [ax + bax / 2, ay + bay / 2, az + baz / 2], r: L / 2 + Math.max(ra, rb) }
}

/** Una fila di ossa per i punti `punti` coi raggi `raggi` (uno per punto): una coda, un collo che curva. Le giunture si fondono con `k`. */
export function fila (punti, raggi, k = 0) {
  const pezzi = []
  for (let i = 0; i + 1 < punti.length; i++) pezzi.push(osso(punti[i], punti[i + 1], raggi[i], raggi[i + 1]))
  return unione(pezzi, k)
}

/** La forma `forma` girata di `ang` ([x, y, z] in radianti, ordine XYZ) attorno al punto `perno`: per un orecchio inclinato, un ellissoide storto. */
export function girata (forma, ang, perno = forma.c) {
  const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...ang)).invert().elements
  const [px, py, pz] = perno
  const f = (x, y, z) => {
    const dx = x - px, dy = y - py, dz = z - pz
    return forma.f(px + m[0] * dx + m[4] * dy + m[8] * dz, py + m[1] * dx + m[5] * dy + m[9] * dz, pz + m[2] * dx + m[6] * dy + m[10] * dz)
  }
  const v = new THREE.Vector3(...forma.c).sub(new THREE.Vector3(...perno)).applyEuler(new THREE.Euler(...ang)).add(new THREE.Vector3(...perno))
  return { f, c: v.toArray(), r: forma.r }
}

/** Una pelle un po' mossa (il pelo lungo, la gorgiera): `forma` più `ampio` per un'onda di tre seni a `fitto` per metro. */
export function arruffata (forma, ampio, fitto = 60) {
  const f = (x, y, z) => forma.f(x, y, z) + ampio * Math.sin(x * fitto + 1.7) * Math.sin(y * fitto * 1.31 + 0.4) * Math.sin(z * fitto * 0.87 + 2.9)
  return { f, c: forma.c, r: forma.r + ampio }
}

/* ══════════ unire e togliere ══════════ */
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25 }
const smax = (a, b, k) => -smin(-a, -b, k)

/** Le forme `pezzi` fuse in una: `k` è quanto si raccordano (0 = si toccano e basta). Un pezzo può portare il suo `k` (`{ ...forma, k }`). */
export function unione (pezzi, k = 0) {
  const lista = pezzi.map(p => ({ f: p.f, c: p.c, r: p.r, k: p.k ?? k }))
  const f = (x, y, z) => {
    let d = 1e9
    for (let i = 0; i < lista.length; i++) {
      const p = lista[i], dx = x - p.c[0], dy = y - p.c[1], dz = z - p.c[2]
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) - p.r > d + p.k) continue          // lontana: non cambia niente
      const v = p.f(x, y, z)
      d = p.k > 0 ? smin(d, v, p.k) : Math.min(d, v)
    }
    return d
  }
  const c = lista.reduce((s, p) => s.map((v, i) => v + p.c[i] / lista.length), [0, 0, 0])
  const r = Math.max(...lista.map(p => Math.hypot(p.c[0] - c[0], p.c[1] - c[1], p.c[2] - c[2]) + p.r))
  return { f, c, r }
}
/** `forma` con `via` scavata dentro (un incavo, la bocca): `k` raccorda il bordo. */
export function meno (forma, via, k = 0) {
  return { f: (x, y, z) => (k > 0 ? smax(forma.f(x, y, z), -via.f(x, y, z), k) : Math.max(forma.f(x, y, z), -via.f(x, y, z))), c: forma.c, r: forma.r }
}
/** Solo la parte di `forma` dentro `dentro` (una zampa tagliata a terra). */
export function dentro (forma, taglio, k = 0) {
  return { f: (x, y, z) => (k > 0 ? smax(forma.f(x, y, z), taglio.f(x, y, z), k) : Math.max(forma.f(x, y, z), taglio.f(x, y, z))), c: forma.c, r: forma.r }
}
/** Il mezzo spazio sotto `y = quota` (per tagliare piatta la pianta di un piede). */
export const sotto = quota => ({ f: (x, y) => y - quota, c: [0, quota, 0], r: 1e9 })
export const sopra = quota => ({ f: (x, y) => quota - y, c: [0, quota, 0], r: 1e9 })

/* ══════════ la pelle: surface nets ══════════ */
/** Con quale dettaglio nascono le pelli: `lontano` vero (lo accende la scena mentre crea un animale, `scena3d/compagni.js`) = con quello da lontano,
    e quello fine si fa solo quando la telecamera si avvicina (`impostaDettaglio`). Una pelle fine costa decine di millisecondi, sul telefono vecchio di più. */
export const PARTENZA = { lontano: false }

const _col = new THREE.Color()

/**
 * La pelle di `forma` come geometria: una griglia di lato `passo` nella scatola `[min, max]` (i punti dove la forma ha senso), un vertice per
 * cella che taglia la pelle, quattro celle attorno a ogni spigolo tagliato fanno un quadrato. Le normali sono il gradiente del campo, i colori
 * vengono da `colore(x, y, z, c)` (riempie il THREE.Color `c`), tutti nel sistema in cui è scritta la forma. `centro` sposta il risultato
 * (il perno del pezzo). Torna una BufferGeometry indicizzata con position, normal e color.
 */
export function pelle (forma, { min, max, passo, colore = null, centro = [0, 0, 0] }) {
  const h = passo
  const x0 = min[0] - 2 * h, y0 = min[1] - 2 * h, z0 = min[2] - 2 * h
  const nx = Math.ceil((max[0] - min[0]) / h) + 5, ny = Math.ceil((max[1] - min[1]) / h) + 5, nz = Math.ceil((max[2] - min[2]) / h) + 5
  const campo = new Float32Array(nx * ny * nz)
  const f = forma.f
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) {
    const base = (k * ny + j) * nx, y = y0 + j * h, z = z0 + k * h
    for (let i = 0; i < nx; i++) campo[base + i] = f(x0 + i * h, y, z)
  }
  // il bordo della griglia è sempre fuori: la pelle si chiude anche se la forma sporge dalla scatola
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (i === 0 || j === 0 || k === 0 || i === nx - 1 || j === ny - 1 || k === nz - 1) campo[(k * ny + j) * nx + i] = Math.max(campo[(k * ny + j) * nx + i], h)
  }
  const idx = (i, j, k) => (k * ny + j) * nx + i
  const cx = nx - 1, cy = ny - 1, cz = nz - 1
  const vertice = new Int32Array(cx * cy * cz).fill(-1)
  const pos = []
  const ANGOLI = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]]
  const SPIGOLI = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]
  const v = new Float32Array(8)
  for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
    let dentroN = 0
    for (let a = 0; a < 8; a++) { const [di, dj, dk] = ANGOLI[a]; v[a] = campo[idx(i + di, j + dj, k + dk)]; if (v[a] < 0) dentroN++ }
    if (dentroN === 0 || dentroN === 8) continue
    let sx = 0, sy = 0, sz = 0, n = 0
    for (const [a, b] of SPIGOLI) {
      if ((v[a] < 0) === (v[b] < 0)) continue
      const t = v[a] / (v[a] - v[b]), A = ANGOLI[a], B = ANGOLI[b]
      sx += A[0] + (B[0] - A[0]) * t; sy += A[1] + (B[1] - A[1]) * t; sz += A[2] + (B[2] - A[2]) * t; n++
    }
    vertice[(k * cy + j) * cx + i] = pos.length / 3
    pos.push(x0 + (i + sx / n) * h, y0 + (j + sy / n) * h, z0 + (k + sz / n) * h)
  }
  const cella = (i, j, k) => vertice[(k * cy + j) * cx + i]
  const ind = []
  const quadrato = (a, b, c, d, giro) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (giro) ind.push(a, b, c, a, c, d); else ind.push(a, c, b, a, d, c) }
  for (let k = 1; k < cz; k++) for (let j = 1; j < cy; j++) for (let i = 0; i < cx; i++) {          // spigoli lungo x
    const a = campo[idx(i, j, k)] < 0, b = campo[idx(i + 1, j, k)] < 0
    if (a !== b) quadrato(cella(i, j - 1, k - 1), cella(i, j, k - 1), cella(i, j, k), cella(i, j - 1, k), a)
  }
  for (let k = 1; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 1; i < cx; i++) {          // spigoli lungo y
    const a = campo[idx(i, j, k)] < 0, b = campo[idx(i, j + 1, k)] < 0
    if (a !== b) quadrato(cella(i - 1, j, k - 1), cella(i - 1, j, k), cella(i, j, k), cella(i, j, k - 1), a)
  }
  for (let k = 0; k < cz; k++) for (let j = 1; j < cy; j++) for (let i = 1; i < cx; i++) {          // spigoli lungo z
    const a = campo[idx(i, j, k)] < 0, b = campo[idx(i, j, k + 1)] < 0
    if (a !== b) quadrato(cella(i - 1, j - 1, k), cella(i, j - 1, k), cella(i, j, k), cella(i - 1, j, k), a)
  }
  // ogni vertice portato sulla pelle (due passi di Newton lungo il gradiente: a maglie larghe la forma resta precisa), poi le normali dal campo e i colori
  const nv = pos.length / 3, nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), e = h * 0.25
  for (let q = 0; q < nv; q++) {
    let x = pos[q * 3], y = pos[q * 3 + 1], z = pos[q * 3 + 2], gx = 0, gy = 0, gz = 0
    for (let passoN = 0; passoN < 3; passoN++) {
      const d = f(x, y, z)
      gx = (f(x + e, y, z) - f(x - e, y, z)) / (2 * e); gy = (f(x, y + e, z) - f(x, y - e, z)) / (2 * e); gz = (f(x, y, z + e) - f(x, y, z - e)) / (2 * e)
      const g2 = gx * gx + gy * gy + gz * gz
      if (passoN === 2 || g2 < 1e-12) break
      const k = Math.max(-h * 0.5, Math.min(h * 0.5, d / g2 * Math.sqrt(g2)))          // mai più di mezza cella: il vertice resta nella sua
      const l0 = Math.sqrt(g2); x -= gx / l0 * k; y -= gy / l0 * k; z -= gz / l0 * k
    }
    pos[q * 3] = x; pos[q * 3 + 1] = y; pos[q * 3 + 2] = z
    const l = Math.hypot(gx, gy, gz) || 1; gx /= l; gy /= l; gz /= l
    nor[q * 3] = gx; nor[q * 3 + 1] = gy; nor[q * 3 + 2] = gz
    if (colore) { _col.setRGB(1, 1, 1); colore(x, y, z, _col, gx, gy, gz); col[q * 3] = _col.r; col[q * 3 + 1] = _col.g; col[q * 3 + 2] = _col.b } else col.fill(1, q * 3, q * 3 + 3)
  }
  const p32 = new Float32Array(pos)
  for (let q = 0; q < nv; q++) { p32[q * 3] -= centro[0]; p32[q * 3 + 1] -= centro[1]; p32[q * 3 + 2] -= centro[2] }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(p32, 3))
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  g.setIndex(nv > 65535 ? new THREE.BufferAttribute(new Uint32Array(ind), 1) : new THREE.BufferAttribute(new Uint16Array(ind), 1))
  g.computeBoundingSphere(); g.computeBoundingBox()
  return g
}

/** La scatola attorno ai pezzi (le loro sfere), allargata di `margine`: per `pelle` quando non la si vuole scrivere a mano. */
export function scatolaDi (forma, margine = 0.02) {
  const { c, r } = forma
  return { min: c.map(v => v - r - margine), max: c.map(v => v + r + margine) }
}

/* ══════════ i colori ══════════ */
/** Fra 0 e 1, morbido fra `a` e `b` (anche con `a` > `b`). */
export const fra = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k) }
const _c2 = new THREE.Color()
/** Porta il colore `c` verso `hex` di `t` (0..1). */
export const verso = (c, hex, t) => (t > 0 ? c.lerp(_c2.setHex(hex), Math.min(1, t)) : c)
/** Un rumore leggero e fisso (somma di seni): per i bordi delle macchie, che non siano righe dritte. */
export const mosso = (x, y, z, fitto = 40) => (Math.sin(x * fitto + 1.3) * Math.cos(y * fitto * 1.21 + 0.3) + Math.sin(z * fitto * 0.93 + 2.1) * Math.cos(x * fitto * 0.77)) * 0.5
/** Le macchie del dalmata (celle di Voronoi in 3D): 0 lontano da una macchia, 1 dentro. `lato` la cella, `rMin`/`rMax` le macchie. */
export function macchie (x, y, z, { lato = 0.06, rMin = 0.012, rMax = 0.024, seme = 1, quante = 0.8 } = {}) {
  const ix = Math.floor(x / lato), iy = Math.floor(y / lato), iz = Math.floor(z / lato)
  let meglio = 0
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
    const h = hash(ix + a, iy + b, iz + c, seme)
    if (h[3] > quante) continue
    const px = (ix + a + h[0]) * lato, py = (iy + b + h[1]) * lato, pz = (iz + c + h[2]) * lato
    const r = rMin + (rMax - rMin) * h[4], d = Math.hypot(x - px, y - py, z - pz)
    meglio = Math.max(meglio, fra(r + 0.006, r - 0.004, d))
  }
  return meglio
}
function hash (i, j, k, s) {
  let n = (i * 73856093) ^ (j * 19349663) ^ (k * 83492791) ^ (s * 2654435761)
  const fuori = []
  for (let q = 0; q < 5; q++) { n = Math.imul(n ^ (n >>> 15), 2246822519); n = Math.imul(n ^ (n >>> 13), 3266489917); n ^= n >>> 16; fuori.push((n >>> 0) / 4294967296) }
  return fuori
}

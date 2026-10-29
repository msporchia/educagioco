// Il terreno del mondo di sopra: un pezzo alla volta (pezzi.js), a due vertici per cella vicino all'eroe e a uno ogni due celle
// da lontano, con quattro trame mescolate per vertice (erba, terra battuta, sabbia, roccia) e la tinta del luogo; il fuori mappa
// (colline e monti oltre la cornice); la piazza di ciottoli e i campi arati. Tutto è superficie: la nebbia ci passa sopra a velo
// (vesti.js). Le celle di una zona mai caricata si leggono dalla loro base (suolo.js). Dal prototipo poc/mondo-sopra/terreno.js.
import { BufferGeometry, BufferAttribute, Float32BufferAttribute, Mesh, Vector2 } from 'three'
import { fbm, quotaTerreno, quotaDellaCella, cellaDaDisegnare, ACQUA, ROCCIA } from './suolo.js'
import { rettangoloDi } from './pezzi.js'
import { vesti, materialeMondo } from './vesti.js'
import { scatola } from './kit.js'
import { forzaDellaTana } from './props-tana-dati.js'
import { raggioDellaPiazza } from '../../dati/mondo-aperto.js'
import { ACCESI } from '../costanti.js'

const TINTE = {
  villaggio: [0.56, 0.74, 0.30], campi: [0.66, 0.78, 0.30], frutteto: [0.58, 0.76, 0.32], prato: [0.62, 0.78, 0.32],
  cimitero: [0.50, 0.62, 0.36], rovine: [0.56, 0.62, 0.38], brughiera: [0.64, 0.60, 0.38], bosco: [0.36, 0.58, 0.26],
  foresta: [0.30, 0.50, 0.26], lago: [0.46, 0.72, 0.34], palude: [0.42, 0.56, 0.30], monte: [0.50, 0.60, 0.34],
  roccia: [0.58, 0.60, 0.40], landa: [0.74, 0.64, 0.36], ceneri: [0.54, 0.52, 0.44], secco: [0.70, 0.62, 0.36],
}

// i pesi delle trame di una cella (erba, terra battuta, sabbia, roccia): `riva` se tocca l'acqua
// `m`: se c'è, la macchia di terra smossa attorno alle tane (props-tana-dati.js: terra battuta, e oltre l'uno il peso dice «scura»)
function pesiDellaCella(c, riva, x, y, out, m = null) {
  let e = 0, tb = 0, sa = 0, ro = 0
  if (c.terreno === ROCCIA) ro = 1
  else if (c.terreno === ACQUA) sa = 1
  else if (c.campo || c.strada === 3) tb = 1
  else if (c.strada === 2) { tb = 0.95; e = 0.05 }
  else if (c.strada === 1) { tb = 0.7; e = 0.3 }
  else if (riva) { sa = 0.75; e = 0.25 }
  else {
    e = 1; const n = fbm(x, y, 900, 9); if (n > 0.62) { tb = (n - 0.62) * 1.4; e -= tb }
    const t = m ? forzaDellaTana(m, x, y) : 0
    if (t > 0) { tb = Math.max(tb, t * 1.9); e = Math.max(0, 1 - Math.min(1, tb)) }
  }
  out[0] = e; out[1] = tb; out[2] = sa; out[3] = ro
  return out
}
const tintaDi = (h, x, y, out) => { const T = TINTE[h] || TINTE.villaggio, v = 0.88 + fbm(x, y, 901, 14) * 0.24; out[0] = T[0] * v; out[1] = T[1] * v; out[2] = T[2] * v; return out }

// i pesi delle trame e la tinta, per cella, in una finestra attorno al pezzo (MARGINE celle in più: la tinta si mescola fra i
// luoghi su 7×7 celle, e il vertice prende i valori interpolati)
const MARGINE = 4
function finestra(m, x0, z0, x1, z1) {
  const X0 = Math.max(0, x0 - MARGINE), Z0 = Math.max(0, z0 - MARGINE), X1 = Math.min(m.W, x1 + MARGINE), Z1 = Math.min(m.H, z1 + MARGINE)
  const w = X1 - X0, h = Z1 - Z0, n = w * h
  const cel = new Array(n), peso = new Float32Array(n * 4), tinta = new Float32Array(n * 3), p4 = [0, 0, 0, 0], t3 = [0, 0, 0]
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) cel[j * w + i] = cellaDaDisegnare(m, (Z0 + j) * m.W + X0 + i)
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const l = j * w + i
    let riva = false
    for (let b = -1; b <= 1 && !riva; b++) for (let a = -1; a <= 1; a++) {
      if (!a && !b) continue
      const ii = i + a, jj = j + b
      if (ii < 0 || jj < 0 || ii >= w || jj >= h) continue
      const q = cel[jj * w + ii]
      if (q.terreno === ACQUA && q.ponte < 0) { riva = true; break }
    }
    peso.set(pesiDellaCella(cel[l], riva, X0 + i, Z0 + j, p4, m), l * 4)
    tinta.set(tintaDi(cel[l].habitat, X0 + i, Z0 + j, t3), l * 3)
  }
  const t2 = new Float32Array(n * 3)
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let r = 0, g = 0, b = 0, c = 0
    for (let b2 = -3; b2 <= 3; b2++) for (let a = -3; a <= 3; a++) {
      const q = (Math.min(h - 1, Math.max(0, j + b2)) * w + Math.min(w - 1, Math.max(0, i + a))) * 3
      r += tinta[q]; g += tinta[q + 1]; b += tinta[q + 2]; c++
    }
    t2[(j * w + i) * 3] = r / c; t2[(j * w + i) * 3 + 1] = g / c; t2[(j * w + i) * 3 + 2] = b / c
  }
  return { X0, Z0, w, h, peso, tinta: t2 }
}
const bilineare = (arr, comp, F, x, z, out) => {
  const fx = Math.min(F.w - 1.001, Math.max(0, x - 0.5 - F.X0)), fz = Math.min(F.h - 1.001, Math.max(0, z - 0.5 - F.Z0))
  const x0 = Math.floor(fx), z0 = Math.floor(fz), tx = fx - x0, tz = fz - z0, W = F.w
  for (let c = 0; c < comp; c++) {
    const a = arr[(z0 * W + x0) * comp + c], b = arr[(z0 * W + x0 + 1) * comp + c], d = arr[((z0 + 1) * W + x0) * comp + c], e = arr[((z0 + 1) * W + x0 + 1) * comp + c]
    out[c] = (a * (1 - tx) + b * tx) * (1 - tz) + (d * (1 - tx) + e * tx) * tz
  }
  return out
}

// il materiale del terreno; `lontano`: quello dei pezzi a dettaglio basso (un materiale a parte, lo stesso programma; dove il pezzo
// vicino è costruito il pezzo lontano si spegne: lontano.js)
export function materialeTerreno(trame, { lontano = false } = {}) {
  // senza `rilievo` (la fascia bassa) niente normal map: il colore delle quattro trame e basta
  const mat = materialeMondo({ roughness: 0.95, metalness: 0, normalMap: ACCESI.rilievo ? trame.roccia.normalMap : null, normalScale: new Vector2(1, 1) })
  mat.name = lontano ? 'terreno-lontano' : 'terreno'
  return vesti(mat, {
    codice: 'terreno',
    prima: sh => {
      sh.uniforms.tErba = { value: trame.erba.map }; sh.uniforms.tTerra = { value: trame.terra.map }
      sh.uniforms.tSabbia = { value: trame.sabbia.map }; sh.uniforms.tRoccia = { value: trame.roccia.map }
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
          attribute vec4 peso; attribute vec3 tinta; varying vec4 vPeso; varying vec3 vTinta; varying float vRipido;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vPeso = peso; vTinta = tinta; vRipido = 1.0 - normal.y;`)
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          uniform sampler2D tErba, tTerra, tSabbia, tRoccia; varying vec4 vPeso; varying vec3 vTinta; varying float vRipido;`)
        .replace('#include <map_fragment>', `
          vec2 uvT = vMondo.xz * 0.5;
          vec3 ce = mix(texture(tErba, uvT * 0.7).rgb, texture(tErba, mat2(0.8, 0.6, -0.6, 0.8) * uvT * 0.27 + 0.37).rgb, 0.5), ct = texture(tTerra, uvT).rgb, cs = texture(tSabbia, uvT).rgb, cr = texture(tRoccia, uvT * 0.45 + vec2(0.0, vMondo.y * 0.08)).rgb;
          vec4 w = vPeso;
          float scuro = clamp(vPeso.y - 1.0, 0.0, 0.9);   // la terra smossa di una tana: il peso della terra oltre l'uno
          w.w = max(w.w, smoothstep(0.3, 0.55, vRipido));
          vec4 h = w + vec4(ce.g, ct.r, cs.r, cr.r) * 0.45 + (frumore(vMondo.xz * 1.3) - 0.5) * 0.25;
          float hm = max(max(h.x, h.y), max(h.z, h.w));
          w = max(h - (hm - 0.22), 0.0); w /= (w.x + w.y + w.z + w.w + 1e-4);
          vec3 col = ce * vTinta * 1.55 * w.x + ct * vec3(0.84, 0.74, 0.58) * w.y + cs * vec3(0.98, 0.92, 0.78) * w.z + cr * vec3(0.74, 0.72, 0.70) * w.w;
          col *= 1.0 - scuro * 0.72;
          diffuseColor.rgb = col;
          float pesoRoccia = w.w, pesoTerra = w.y;`)
        .replace('mapN.xy *= normalScale;', 'mapN.xy *= normalScale * (0.15 + 1.1 * pesoRoccia + 0.5 * pesoTerra);')
    },
  })
}

// la roccia si rompe: un rumore fitto la fa scabra (lo stesso in ogni pezzo: i bordi combaciano)
const scabra = (x, z, ro) => (ro > 0.05 ? ro * (fbm(x, z, 950, 2.2) - 0.5) * 1.1 + ro * fbm(x, z, 951, 0.7) * 0.25 : 0)

// un pezzo di terreno (o il rettangolo { x0, z0, x1, z1 }): `res` vertici per cella (0,5: uno ogni due celle, il lontano); i bordi
// hanno una gonna che scende, così fra un pezzo vicino e uno lontano (che hanno vertici diversi) non si apre una fessura
export function terrenoDelPezzo(m, p, mat, res = 2) {
  const { x0, z0, x1, z1 } = typeof p === 'number' ? rettangoloDi(m, p) : p
  const NX = Math.round((x1 - x0) * res) + 1, NZ = Math.round((z1 - z0) * res) + 1
  const nv = NX * NZ + 2 * (NX + NZ)
  const pos = new Float32Array(nv * 3), pes = new Float32Array(nv * 4), tin = new Float32Array(nv * 3), uv = new Float32Array(nv * 2)
  const p4 = [0, 0, 0, 0], t3 = [0, 0, 0], c = {}
  // vicino: le celle della finestra, interpolate; lontano: la cella sotto il vertice e basta (sono 45 000 vertici in tutto il mondo)
  const F = res >= 1 ? finestra(m, x0, z0, x1, z1) : null
  // l'altezza in (x, z), e i pesi e la tinta lì (in p4 e t3)
  const altezza = (x, z) => {
    let y
    if (F) { bilineare(F.peso, 4, F, x, z, p4); bilineare(F.tinta, 3, F, x, z, t3); y = quotaTerreno(m, x, z) }
    else {
      const cx = Math.min(m.W - 1, Math.max(0, Math.round(x))), cz = Math.min(m.H - 1, Math.max(0, Math.round(z))), k = cz * m.W + cx
      cellaDaDisegnare(m, k, c); pesiDellaCella(c, false, cx, cz, p4, m); tintaDi(c.habitat, cx, cz, t3)
      y = quotaDellaCella(m, k)
    }
    return y + scabra(x, z, p4[3])
  }
  // le altezze con un giro di vertici in più attorno: le normali si fanno da lì, così due pezzi accanto hanno la stessa normale sul
  // bordo comune (calcolate dai soli triangoli del pezzo, e con la gonna, il bordo veniva scuro: una riga a ogni giunta)
  const PX = NX + 2, alte = new Float32Array(PX * (NZ + 2))
  for (let j = -1; j <= NZ; j++) for (let i = -1; i <= NX; i++) {
    if (i < 0 || j < 0 || i >= NX || j >= NZ) alte[(j + 1) * PX + i + 1] = altezza(x0 + i / res, z0 + j / res)
  }
  const nor = new Float32Array(nv * 3), d = 2 / res
  const vertice = (v, x, z, giu, i, j) => {
    const y = altezza(x, z)
    pos[v * 3] = x; pos[v * 3 + 1] = y - giu; pos[v * 3 + 2] = z
    pes.set(p4, v * 4); tin.set(t3, v * 3); uv[v * 2] = x * 0.5; uv[v * 2 + 1] = z * 0.5
    if (!giu) alte[(j + 1) * PX + i + 1] = y
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) vertice(j * NX + i, x0 + i / res, z0 + j / res, 0, i, j)
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const a = (j + 1) * PX + i + 1, nx = alte[a - 1] - alte[a + 1], nz = alte[a - PX] - alte[a + PX], l = Math.hypot(nx, d, nz)
    nor.set([nx / l, d / l, nz / l], (j * NX + i) * 3)
  }
  const idx = []
  for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c2 = a + NX, d = c2 + 1; idx.push(a, c2, b, b, c2, d) }
  // la gonna: i quattro bordi, un vertice sotto ciascuno
  let v = NX * NZ
  const gonna = bordo => {
    const s = v
    for (const [i, j] of bordo) { nor.set(nor.subarray((j * NX + i) * 3, (j * NX + i) * 3 + 3), v * 3); vertice(v++, x0 + i / res, z0 + j / res, 1.2, i, j) }
    for (let k = 0; k < bordo.length - 1; k++) {
      const a = bordo[k][1] * NX + bordo[k][0], b = bordo[k + 1][1] * NX + bordo[k + 1][0]
      idx.push(a, b, s + k, b, s + k + 1, s + k)
    }
  }
  gonna(Array.from({ length: NX }, (_, i) => [i, 0])); gonna(Array.from({ length: NX }, (_, i) => [NX - 1 - i, NZ - 1]))
  gonna(Array.from({ length: NZ }, (_, j) => [0, NZ - 1 - j])); gonna(Array.from({ length: NZ }, (_, j) => [NX - 1, j]))
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos.subarray(0, v * 3), 3))
  g.setAttribute('peso', new BufferAttribute(pes.subarray(0, v * 4), 4))
  g.setAttribute('tinta', new BufferAttribute(tin.subarray(0, v * 3), 3))
  g.setAttribute('uv', new BufferAttribute(uv.subarray(0, v * 2), 2))
  g.setAttribute('normal', new BufferAttribute(nor.subarray(0, v * 3), 3))
  g.setIndex(idx)
  const mesh = new Mesh(g, mat)
  mesh.receiveShadow = true
  return mesh
}

// il fuori mappa: colline che salgono a monti, oltre la cornice di roccia (un vertice ogni due celle). Dentro la mappa sta sotto
export function creaFuori(m, mat) {
  const { W, H } = m, M = 70, P = 2
  const NX = Math.round((W + 2 * M) / P) + 1, NZ = Math.round((H + 2 * M) / P) + 1
  const pos = new Float32Array(NX * NZ * 3), pes = new Float32Array(NX * NZ * 4), tin = new Float32Array(NX * NZ * 3), uv = new Float32Array(NX * NZ * 2)
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const x = -M + i * P, z = -M + j * P, v = j * NX + i
    const e = Math.max(-x, x - W, -z, z - H)
    let y
    if (e < -0.5) y = -4
    else {
      const monti = fbm(x, z, 960, 26), dente = fbm(x, z, 961, 7)
      y = 3.2 + Math.min(e, 30) * 0.12 * (0.5 + monti) + Math.max(0, monti - 0.45) * Math.min(1, e / 12) * 16 + dente * 1.5
      if (z > H) y = 2.4 + dente * 1.4 + Math.min(e, 20) * 0.05   // a sud, verso chi guarda, colline basse
      const bordo = quotaTerreno(m, Math.min(W - 0.01, Math.max(0.01, x)), Math.min(H - 0.01, Math.max(0.01, z)))
      const k = Math.min(1, e / 7), s = k * k * (3 - 2 * k)
      y = bordo + 0.4 + (y - bordo) * s
    }
    const ro = e < 1 ? 1 : Math.min(1, Math.max(0, (y - 6) / 4))
    pos.set([x, y, z], v * 3); pes.set([1 - ro, 0, 0, ro], v * 4)
    const n = 0.85 + fbm(x, z, 962, 18) * 0.3
    tin.set([0.42 * n, 0.6 * n, 0.3 * n], v * 3); uv[v * 2] = x * 0.5; uv[v * 2 + 1] = z * 0.5
  }
  const idx = []
  for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) {
    const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1
    // dentro la mappa il fuori non serve: i quadrati tutti sotto si saltano
    if (pos[a * 3 + 1] < -3 && pos[b * 3 + 1] < -3 && pos[c * 3 + 1] < -3 && pos[d * 3 + 1] < -3) continue
    idx.push(a, c, b, b, c, d)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3)); g.setAttribute('peso', new BufferAttribute(pes, 4)); g.setAttribute('tinta', new BufferAttribute(tin, 3))
  g.setAttribute('uv', new BufferAttribute(uv, 2))
  g.setIndex(idx); g.computeVertexNormals()
  const mesh = new Mesh(g, mat)
  mesh.receiveShadow = true
  const quotaFuori = (x, z) => pos[(Math.min(NZ - 1, Math.max(0, Math.round((z + M) / P))) * NX + Math.min(NX - 1, Math.max(0, Math.round((x + M) / P)))) * 3 + 1]
  return { mesh, quotaFuori, M }
}

// i materiali delle superfici, uno per tipo e condivisi da tutti i pezzi
export function materialiDelSuolo(trame) {
  return {
    terreno: materialeTerreno(trame), lontano: materialeTerreno(trame, { lontano: true }),
    piazza: vesti(materialeMondo({ map: trame.ciottoli.map, normalMap: ACCESI.rilievo ? trame.ciottoli.normalMap : null, roughness: 0.9, color: 0xd8cfc0, polygonOffset: true, polygonOffsetFactor: -1 })),
    campo: vesti(materialeMondo({ map: trame.campo.map, normalMap: ACCESI.rilievo ? trame.campo.normalMap : null, roughness: 1, color: 0xb59a78, polygonOffset: true, polygonOffsetFactor: -1 })),
  }
}

// la piazza del villaggio: un disco irregolare di ciottoli appena sopra il terreno spianato (il bordo coi raggi della pianta,
// dati/mondo-aperto.js), col cordolo tutto attorno tranne dove esce la stradina
export function creaPiazza(m, v, mats, cant) {
  const P = v.piazza, N = 48, y = quotaTerreno(m, P.cx, P.cy) + 0.03
  const bordo = []
  for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, r = raggioDellaPiazza(P, a) - 0.05; bordo.push([P.cx + Math.cos(a) * r, P.cy - Math.sin(a) * r]) }
  const pos = [P.cx, y, P.cy], uv = [P.cx * 0.6, P.cy * 0.6], idx = []
  for (const [x, z] of bordo) { pos.push(x, y, z); uv.push(x * 0.6, z * 0.6) }
  for (let i = 0; i < N; i++) idx.push(0, 1 + i, 1 + ((i + 1) % N))
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx); g.computeVertexNormals()
  const mesh = new Mesh(g, mats.piazza); mesh.receiveShadow = true
  cant.base(0, 0, 0, 0).qui(P.cx, P.cy)
  const col = [0.62, 0.62, 0.62]
  for (let i = 0; i < N; i++) {
    const [xa, za] = bordo[i], [xb, zb] = bordo[(i + 1) % N], xm = (xa + xb) / 2, zm = (za + zb) / 2
    // dove il bordo tocca la stradina il cordolo si apre
    const fx = Math.floor(xm + (xm - P.cx) * 0.12), fz = Math.floor(zm + (zm - P.cy) * 0.12)
    if (m.strada[fz * m.W + fx] === 2) continue
    cant.metti('liscio', scatola(Math.hypot(xb - xa, zb - za) + 0.06, 0.1, 0.18), xm, y + 0.07, zm, col, { ry: -Math.atan2(zb - za, xb - xa) })
  }
  return mesh
}

// i campi arati di un pezzo: un piano per campo, i solchi lungo le file, tutti in una geometria
export function campiDelPezzo(m, campi, mats) {
  if (!campi.length) return null
  const pos = [], uv = [], idx = []
  for (const c of campi) {
    const b = pos.length / 3
    for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const x = c.x + i * c.w, z = c.y + j * c.h
      pos.push(x, quotaTerreno(m, x, z) + 0.035, z)
      uv.push(c.file === 'x' ? (j * c.h) / 2 : (i * c.w) / 2, c.file === 'x' ? (i * c.w) / 2 : (j * c.h) / 2)
    }
    idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx); g.computeVertexNormals()
  const mesh = new Mesh(g, mats.campo); mesh.receiveShadow = true
  return mesh
}

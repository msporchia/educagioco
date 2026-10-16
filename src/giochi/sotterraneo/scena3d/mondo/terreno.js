// Il terreno del mondo di sopra: un pezzo alla volta (pezzi.js), a due vertici per cella vicino all'eroe e a uno da lontano, con
// quattro trame mescolate per vertice (erba, terra battuta, sabbia, roccia) e la tinta della regione; il fuori mappa (colline e
// monti oltre la cornice); le piazze di ciottoli e i campi arati. Tutto è superficie: la nebbia ci passa sopra a velo
// (vesti.js). Dal prototipo poc/mondo-sopra/terreno.js.
import { BufferGeometry, BufferAttribute, Float32BufferAttribute, Mesh, MeshStandardMaterial, Vector2, CircleGeometry, TorusGeometry } from 'three'
import { ERBA, ACQUA, ROCCIA } from '../../motore/mondo-aperto.js'
import { fbm, quotaTerreno } from './suolo.js'
import { rettangoloDi, PEZZO } from './pezzi.js'
import { vesti } from './vesti.js'

const TINTE = {
  villaggio: [0.56, 0.74, 0.30], campi: [0.66, 0.78, 0.30], frutteto: [0.58, 0.76, 0.32], prato: [0.62, 0.78, 0.32],
  cimitero: [0.50, 0.62, 0.36], rovine: [0.56, 0.62, 0.38], brughiera: [0.64, 0.60, 0.38], bosco: [0.36, 0.58, 0.26],
  foresta: [0.30, 0.50, 0.26], lago: [0.46, 0.72, 0.34], palude: [0.42, 0.56, 0.30], monte: [0.50, 0.60, 0.34],
  roccia: [0.58, 0.60, 0.40], landa: [0.74, 0.64, 0.36], ceneri: [0.54, 0.52, 0.44], secco: [0.70, 0.62, 0.36],
}

// i pesi delle trame e la tinta, per cella (una volta per mondo); poi il vertice li prende interpolati
const PESI = new WeakMap()
function pesiDelleCelle(m) {
  if (PESI.has(m)) return PESI.get(m)
  const { W, H } = m, N = W * H
  const peso = new Float32Array(N * 4), tinta = new Float32Array(N * 3)
  const riva = k => { const x = k % W, y = (k / W) | 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const a = x + i, b = y + j; if ((i || j) && a >= 0 && b >= 0 && a < W && b < H && m.terreno[b * W + a] === ACQUA && m.ponte[b * W + a] < 0) return true } return false }
  for (let k = 0; k < N; k++) {
    const t = m.terreno[k], s = m.strada[k], x = k % W, y = (k / W) | 0
    let e = 0, tb = 0, sa = 0, ro = 0
    if (t === ROCCIA) ro = 1
    else if (t === ACQUA) sa = 1
    else if (m.campo[k] || s === 3) tb = 1
    else if (s === 2) { tb = 0.95; e = 0.05 }
    else if (s === 1) { tb = 0.7; e = 0.3 }
    else if (riva(k)) { sa = 0.75; e = 0.25 }
    else { e = 1; const n = fbm(x, y, 900, 9); if (n > 0.62) { tb = (n - 0.62) * 1.4; e -= tb } }
    peso.set([e, tb, sa, ro], k * 4)
    const T = TINTE[m.regioni[m.reg[k]].habitat] || TINTE.villaggio, v = 0.88 + fbm(x, y, 901, 14) * 0.24
    tinta.set([T[0] * v, T[1] * v, T[2] * v], k * 3)
  }
  // la tinta si mescola fra le regioni: il confine non si vede come una riga
  const t2 = new Float32Array(N * 3)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0, n = 0
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
      const q = (Math.min(H - 1, Math.max(0, y + j)) * W + Math.min(W - 1, Math.max(0, x + i))) * 3
      r += tinta[q]; g += tinta[q + 1]; b += tinta[q + 2]; n++
    }
    t2[(y * W + x) * 3] = r / n; t2[(y * W + x) * 3 + 1] = g / n; t2[(y * W + x) * 3 + 2] = b / n
  }
  const fuori = { peso, tinta: t2 }
  PESI.set(m, fuori)
  return fuori
}
const bilineare = (arr, comp, W, H, x, z, out) => {
  const fx = Math.min(W - 1.001, Math.max(0, x - 0.5)), fz = Math.min(H - 1.001, Math.max(0, z - 0.5))
  const x0 = Math.floor(fx), z0 = Math.floor(fz), tx = fx - x0, tz = fz - z0
  for (let c = 0; c < comp; c++) {
    const a = arr[(z0 * W + x0) * comp + c], b = arr[(z0 * W + x0 + 1) * comp + c], d = arr[((z0 + 1) * W + x0) * comp + c], e = arr[((z0 + 1) * W + x0 + 1) * comp + c]
    out[c] = (a * (1 - tx) + b * tx) * (1 - tz) + (d * (1 - tx) + e * tx) * tz
  }
  return out
}

// il materiale del terreno; `lontano`: quello dei pezzi a dettaglio basso, che sparisce sotto i pezzi costruiti
export function materialeTerreno(trame, { lontano = false } = {}) {
  const mat = new MeshStandardMaterial({ roughness: 0.95, metalness: 0, normalMap: trame.roccia.normalMap, normalScale: new Vector2(1, 1) })
  mat.name = lontano ? 'terreno-lontano' : 'terreno'
  return vesti(mat, {
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
          uniform sampler2D tErba, tTerra, tSabbia, tRoccia; varying vec4 vPeso; varying vec3 vTinta; varying float vRipido;
          ${lontano ? 'uniform float uCostruiti[25];' : ''}`)
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          ${lontano ? `{ int pz = int(clamp(floor(vMondo.x / ${PEZZO.largo}.0), 0.0, 4.0)) + 5 * int(clamp(floor(vMondo.z / ${PEZZO.alto}.0), 0.0, 4.0));
            if (vMondo.x >= 0.0 && vMondo.z >= 0.0 && uCostruiti[pz] > 0.5) discard; }` : ''}`)
        .replace('#include <map_fragment>', `
          vec2 uvT = vMondo.xz * 0.5;
          vec3 ce = mix(texture(tErba, uvT * 0.7).rgb, texture(tErba, mat2(0.8, 0.6, -0.6, 0.8) * uvT * 0.27 + 0.37).rgb, 0.5), ct = texture(tTerra, uvT).rgb, cs = texture(tSabbia, uvT).rgb, cr = texture(tRoccia, uvT * 0.45 + vec2(0.0, vMondo.y * 0.08)).rgb;
          vec4 w = vPeso;
          w.w = max(w.w, smoothstep(0.3, 0.55, vRipido));
          vec4 h = w + vec4(ce.g, ct.r, cs.r, cr.r) * 0.45 + (frumore(vMondo.xz * 1.3) - 0.5) * 0.25;
          float hm = max(max(h.x, h.y), max(h.z, h.w));
          w = max(h - (hm - 0.22), 0.0); w /= (w.x + w.y + w.z + w.w + 1e-4);
          vec3 col = ce * vTinta * 1.55 * w.x + ct * vec3(0.84, 0.74, 0.58) * w.y + cs * vec3(0.98, 0.92, 0.78) * w.z + cr * vec3(0.74, 0.72, 0.70) * w.w;
          diffuseColor.rgb = col;
          float pesoRoccia = w.w, pesoTerra = w.y;`)
        .replace('mapN.xy *= normalScale;', 'mapN.xy *= normalScale * (0.15 + 1.1 * pesoRoccia + 0.5 * pesoTerra);')
    },
  })
}

// un pezzo di terreno (o il rettangolo { x0, z0, x1, z1 }): `res` vertici per cella; i bordi hanno una gonna che scende, così fra un pezzo vicino e uno lontano (che
// hanno vertici diversi) non si apre una fessura
export function terrenoDelPezzo(m, p, mat, res = 2) {
  const { peso, tinta } = pesiDelleCelle(m)
  const { x0, z0, x1, z1 } = typeof p === 'number' ? rettangoloDi(m, p) : p
  const NX = (x1 - x0) * res + 1, NZ = (z1 - z0) * res + 1
  const nv = NX * NZ + 2 * (NX + NZ)
  const pos = new Float32Array(nv * 3), pes = new Float32Array(nv * 4), tin = new Float32Array(nv * 3), uv = new Float32Array(nv * 2)
  const p4 = [0, 0, 0, 0], t3 = [0, 0, 0]
  const vertice = (v, x, z, giu) => {
    bilineare(peso, 4, m.W, m.H, x, z, p4); bilineare(tinta, 3, m.W, m.H, x, z, t3)
    let y = quotaTerreno(m, x, z)
    // la roccia si rompe: un rumore fitto la fa scabra (lo stesso in ogni pezzo: i bordi combaciano)
    if (p4[3] > 0.05) y += p4[3] * (fbm(x, z, 950, 2.2) - 0.5) * 1.1 + p4[3] * fbm(x, z, 951, 0.7) * 0.25
    pos[v * 3] = x; pos[v * 3 + 1] = y - giu; pos[v * 3 + 2] = z
    pes.set(p4, v * 4); tin.set(t3, v * 3); uv[v * 2] = x * 0.5; uv[v * 2 + 1] = z * 0.5
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) vertice(j * NX + i, x0 + i / res, z0 + j / res, 0)
  const idx = []
  for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1; idx.push(a, c, b, b, c, d) }
  // la gonna: i quattro bordi, un vertice sotto ciascuno
  let v = NX * NZ
  const gonna = bordo => {
    const s = v
    for (const [i, j] of bordo) vertice(v++, x0 + i / res, z0 + j / res, 1.2)
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
  g.setIndex(idx)
  g.computeVertexNormals()
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

// la piazza di una città: un tondo di ciottoli appena sopra il terreno spianato, col cordolo (che va nel kit)
// i materiali delle superfici, uno per tipo e condivisi da tutti i pezzi
export function materialiDelSuolo(trame) {
  return {
    terreno: materialeTerreno(trame), lontano: materialeTerreno(trame, { lontano: true }),
    piazza: vesti(new MeshStandardMaterial({ map: trame.ciottoli.map, normalMap: trame.ciottoli.normalMap, roughness: 0.9, color: 0xd8cfc0, polygonOffset: true, polygonOffsetFactor: -1 })),
    campo: vesti(new MeshStandardMaterial({ map: trame.campo.map, normalMap: trame.campo.normalMap, roughness: 1, color: 0xb59a78, polygonOffset: true, polygonOffsetFactor: -1 })),
  }
}

export function creaPiazza(m, c, mats, cant) {
  const y = quotaTerreno(m, c.piazza.x, c.piazza.y) + 0.03, r = c.piazza.r
  const g = new CircleGeometry(r, 40)
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - 0.5) * r * 1.2, (uv.getY(i) - 0.5) * r * 1.2)
  g.rotateX(-Math.PI / 2); g.translate(c.piazza.x, y, c.piazza.y)
  const mesh = new Mesh(g, mats.piazza); mesh.receiveShadow = true
  cant.base(c.piazza.x, y + 0.02, c.piazza.y, 0)
  cant.metti('liscio', new TorusGeometry(r, 0.09, 5, 40), 0, 0, 0, [0.62, 0.62, 0.62], { rx: Math.PI / 2 })
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

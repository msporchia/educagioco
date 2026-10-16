// La natura e il decoro sparso: alberi (chiome a sfere smussate o coni), cespugli, canne, sassi e rupi, ruderi, covoni,
// botti, l'erba a ciuffi, i fiori, le colture dei campi e il bosco fuori mappa. Tutto a istanze: una InstancedMesh per tipo,
// il colore di ognuna variato col seme. Chiome ed erba si piegano al vento (vesti.js).
import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ERBA, ACQUA, quotaTerreno } from './generatore.js'
import { caso, fbm, rumore } from './caso.js'
import { Cantiere, scatola, cilindro } from './kit.js'
import { vesti } from './vesti.js'

// una sfera smussata e un poco storta: la chioma
function blob (r, seme, det = 1, storto = 0.18) {
  let g = new THREE.IcosahedronGeometry(r, det)
  g.deleteAttribute('uv'); g.deleteAttribute('normal')
  g = mergeVertices(g)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const k = 1 + (rumore(x * 9 + seme, z * 9, seme, 1) - 0.5) * storto * 2
    p.setXYZ(i, x * k, y * k * 0.92, z * k)
  }
  g.computeVertexNormals()
  return g
}
function sasso (r, seme) {
  const g = new THREE.DodecahedronGeometry(r, 0)
  const p = g.attributes.position
  const visti = new Map()
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`
    if (!visti.has(key)) visti.set(key, 0.75 + rumore(i * 3.1 + seme, seme, seme, 1) * 0.5)
    const k = visti.get(key)
    p.setXYZ(i, p.getX(i) * k * 1.15, Math.max(-r * 0.3, p.getY(i) * k * 0.7), p.getZ(i) * k)
  }
  g.computeVertexNormals()
  return g
}
// da un cantiere a una geometria sola (il colore nei vertici)
function forma (f) {
  const c = new Cantiere({}); f(c)
  return mergeGeometries(Object.values(c.liste).flat())
}
const TRONCO = [0.45, 0.33, 0.24]
const GEO = {
  tondo: () => forma(c => {
    c.metti('x', cilindro(0.08, 0.13, 1.0, 7), 0, 0.5, 0, TRONCO)
    c.metti('x', blob(0.62, 1), 0, 1.35, 0, [0.40, 0.64, 0.27])
    c.metti('x', blob(0.46, 2), 0.32, 1.1, 0.16, [0.36, 0.60, 0.25])
    c.metti('x', blob(0.42, 3), -0.3, 1.15, -0.12, [0.43, 0.68, 0.29])
  }),
  frutto: () => forma(c => {
    c.metti('x', cilindro(0.07, 0.11, 0.8, 7), 0, 0.4, 0, TRONCO)
    c.metti('x', blob(0.55, 4), 0, 1.1, 0, [0.44, 0.66, 0.28])
    for (let i = 0; i < 9; i++) { const a = i * 2.4, h = 0.9 + (i % 3) * 0.17; c.metti('x', new THREE.SphereGeometry(0.06, 6, 4), Math.cos(a) * 0.5, h, Math.sin(a) * 0.5, [0.9, 0.2, 0.15]) }
  }),
  pino: () => forma(c => {
    c.metti('x', cilindro(0.07, 0.11, 0.7, 6), 0, 0.35, 0, TRONCO)
    for (const [r, h, y] of [[0.62, 0.95, 0.95], [0.5, 0.85, 1.45], [0.34, 0.75, 1.95]]) c.metti('x', new THREE.ConeGeometry(r, h, 8), 0, y, 0, [0.20, 0.44, 0.24])
  }),
  abete: () => forma(c => {
    c.metti('x', cilindro(0.07, 0.1, 0.5, 6), 0, 0.25, 0, TRONCO)
    for (const [r, h, y] of [[0.52, 1.2, 0.95], [0.4, 1.0, 1.65], [0.26, 0.85, 2.3]]) c.metti('x', new THREE.ConeGeometry(r, h, 7), 0, y, 0, [0.17, 0.37, 0.31])
  }),
  salice: () => forma(c => {
    c.metti('x', cilindro(0.1, 0.16, 1.1, 7), 0, 0.55, 0, TRONCO)
    c.metti('x', blob(0.72, 5), 0, 1.55, 0, [0.52, 0.72, 0.34], { s: [1.1, 0.75, 1.1] })
    for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7; c.metti('x', blob(0.28, 6 + i, 1, 0.1), Math.cos(a) * 0.7, 1.05, Math.sin(a) * 0.7, [0.56, 0.75, 0.36], { s: [0.8, 1.9, 0.8] }) }
  }),
  secco: () => forma(c => {
    c.metti('x', cilindro(0.06, 0.13, 1.5, 6), 0, 0.75, 0, [0.42, 0.36, 0.32])
    for (const [a, h, l, t] of [[0.3, 1.0, 0.7, 0.8], [2.4, 1.2, 0.6, 0.9], [4.2, 0.8, 0.55, 0.7], [1.3, 1.4, 0.45, 0.6]]) {
      c.metti('x', cilindro(0.025, 0.05, l, 5), Math.cos(a) * l * 0.4 * Math.sin(t), h + l * 0.4 * Math.cos(t), Math.sin(a) * l * 0.4 * Math.sin(t), [0.42, 0.36, 0.32], { ry: -a, rz: -t, ordine: 'YZX' })
    }
  }),
  cespuglio: () => forma(c => {
    c.metti('x', blob(0.32, 7), 0, 0.2, 0, [0.36, 0.58, 0.25])
    c.metti('x', blob(0.25, 8), 0.25, 0.15, 0.1, [0.40, 0.62, 0.28])
    c.metti('x', blob(0.22, 9), -0.2, 0.14, 0.12, [0.33, 0.55, 0.24])
  }),
  canne: () => forma(c => {
    for (let i = 0; i < 9; i++) {
      const a = i * 2.39, r = 0.08 + (i % 3) * 0.08, h = 0.7 + (i % 4) * 0.13
      c.metti('x', new THREE.ConeGeometry(0.025, h, 4), Math.cos(a) * r, h / 2, Math.sin(a) * r, [0.46, 0.62, 0.3], { rz: Math.cos(a) * 0.12, rx: Math.sin(a) * 0.12 })
      if (i % 3 === 0) c.metti('x', cilindro(0.04, 0.04, 0.16, 5), Math.cos(a) * r * 1.05, h * 0.82, Math.sin(a) * r * 1.05, [0.45, 0.3, 0.18])
    }
  }),
  funghi: () => forma(c => {
    for (const [x, z, s] of [[0, 0, 1], [0.18, 0.1, 0.7], [-0.12, 0.15, 0.6]]) {
      c.metti('x', cilindro(0.03 * s, 0.04 * s, 0.14 * s, 6), x, 0.07 * s, z, [0.95, 0.92, 0.85])
      c.metti('x', new THREE.SphereGeometry(0.09 * s, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), x, 0.13 * s, z, [0.85, 0.2, 0.15])
    }
  }),
  sasso: () => forma(c => c.metti('x', sasso(0.24, 1), 0, 0, 0, [0.66, 0.64, 0.6])),
  masso: () => forma(c => c.metti('x', sasso(0.5, 2), 0, 0, 0, [0.45, 0.43, 0.41])),
  rupe: () => forma(c => c.metti('x', sasso(0.9, 3), 0, 0, 0, [0.36, 0.345, 0.33])),
  ceppo: () => forma(c => { c.metti('x', cilindro(0.22, 0.27, 0.3, 9), 0, 0.15, 0, TRONCO); c.metti('x', new THREE.CircleGeometry(0.21, 9).rotateX(-Math.PI / 2), 0, 0.301, 0, [0.8, 0.66, 0.46]) }),
  covone: () => forma(c => { c.metti('x', cilindro(0.38, 0.45, 0.55, 10, 0.6), 0, 0.27, 0, [0.95, 0.82, 0.5]); c.metti('x', new THREE.ConeGeometry(0.4, 0.42, 10), 0, 0.75, 0, [0.95, 0.82, 0.5]) }),
  botte: () => forma(c => {
    c.metti('x', cilindro(0.24, 0.22, 0.6, 10, 0.8), 0, 0.3, 0, [0.7, 0.52, 0.36])
    for (const y of [0.1, 0.5]) c.metti('x', cilindro(0.25, 0.25, 0.05, 10), 0, y, 0, [0.3, 0.3, 0.32])
  }),
  cassa: () => forma(c => c.metti('x', scatola(0.5, 0.45, 0.5, 0.6), 0, 0.22, 0, [0.72, 0.56, 0.38])),
  spaventapasseri: () => forma(c => {
    c.metti('x', scatola(0.07, 1.4, 0.07), 0, 0.7, 0, TRONCO)
    c.metti('x', scatola(0.9, 0.06, 0.06), 0, 1.05, 0, TRONCO)
    c.metti('x', scatola(0.36, 0.45, 0.2), 0, 0.95, 0, [0.6, 0.3, 0.25])
    c.metti('x', new THREE.SphereGeometry(0.14, 8, 6), 0, 1.32, 0, [0.9, 0.8, 0.5])
    c.metti('x', new THREE.ConeGeometry(0.22, 0.22, 10), 0, 1.5, 0, [0.6, 0.5, 0.3])
  }),
  rudere: () => forma(c => {
    c.metti('x', scatola(1.5, 0.9, 0.36, 1.4), 0, 0.45, 0, [0.78, 0.76, 0.72])
    c.metti('x', scatola(0.9, 0.35, 0.36, 1.4), -0.3, 1.07, 0, [0.76, 0.74, 0.7])
    c.metti('x', scatola(0.35, 0.3, 0.36, 1.4), -0.55, 1.4, 0, [0.74, 0.72, 0.68])
    c.metti('x', scatola(0.4, 0.25, 0.3, 1.4), 0.55, 0.12, 0.45, [0.74, 0.72, 0.68], { ry: 0.5 })
  }),
  colonna: () => forma(c => {
    c.metti('x', scatola(0.6, 0.2, 0.6, 1.4), 0, 0.1, 0, [0.84, 0.82, 0.78])
    c.metti('x', cilindro(0.22, 0.24, 1.25, 12, 1.4), 0, 0.82, 0, [0.86, 0.84, 0.8])
    c.metti('x', cilindro(0.22, 0.22, 0.9, 12, 1.4), 0.55, 0.22, 0.3, [0.84, 0.82, 0.78], { rz: Math.PI / 2, ry: 0.6 })
  }),
  ossa: () => forma(c => {
    c.metti('x', new THREE.SphereGeometry(0.11, 8, 6), 0, 0.09, 0, [0.92, 0.9, 0.82], { s: [1, 0.85, 1.2] })
    c.metti('x', cilindro(0.025, 0.025, 0.4, 5), 0.2, 0.03, 0.1, [0.9, 0.88, 0.8], { rz: Math.PI / 2, ry: 0.7 })
    c.metti('x', cilindro(0.025, 0.025, 0.35, 5), 0.15, 0.03, -0.12, [0.9, 0.88, 0.8], { rz: Math.PI / 2, ry: -0.5 })
  }),
}
// l'erba: cinque fili (triangoli) che s'aprono, scuri alla base e chiari in punta, con la normale all'insù (si illuminano come il prato)
function ciuffo (fili = 5, alto = 0.32) {
  const pos = [], col = [], nor = []
  for (let i = 0; i < fili; i++) {
    const a = i * Math.PI * 2 / fili + i * 0.7, r = 0.06 + (i % 2) * 0.05, h = alto * (0.7 + (i % 3) * 0.18)
    const cx = Math.cos(a) * r, cz = Math.sin(a) * r, px = -Math.sin(a) * 0.03, pz = Math.cos(a) * 0.03
    const tx = Math.cos(a) * (r + 0.1), tz = Math.sin(a) * (r + 0.1)
    pos.push(cx - px, 0, cz - pz, cx + px, 0, cz + pz, tx, h, tz)
    col.push(0.55, 0.55, 0.55, 0.55, 0.55, 0.55, 1.15, 1.15, 1.0)
    nor.push(0, 1, 0, 0, 1, 0, 0, 1, 0)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  return g
}
function fiore () {
  return forma(c => {
    c.metti('x', cilindro(0.01, 0.01, 0.22, 3), 0, 0.11, 0, [0.4, 0.6, 0.3])
    c.metti('x', new THREE.CircleGeometry(0.07, 5).rotateX(-Math.PI / 2), 0, 0.225, 0, [1, 1, 1])
    c.metti('x', new THREE.CircleGeometry(0.025, 5).rotateX(-Math.PI / 2), 0, 0.23, 0, [1, 0.85, 0.2])
  })
}

const VENTO = { tondo: 0.05, frutto: 0.05, pino: 0.03, abete: 0.03, salice: 0.07, cespuglio: 0.1, canne: 0.25 }
const RIGIDO = { tondo: 0.75, frutto: 0.6, pino: 0.6, abete: 0.4, salice: 0.8, cespuglio: 0, canne: 0 }
const DI_PIETRA = new Set(['rudere', 'colonna']), DI_LEGNO = new Set(['botte', 'cassa', 'ceppo']), DI_PAGLIA = new Set(['covone'])
const BASSI = new Set(['cespuglio', 'canne', 'funghi', 'ossa', 'sasso', 'fiore', 'erba'])

export function creaNatura (m, kit, scena, { quotaFuori = null, M = 0 } = {}) {
  const r = caso(m.seme * 31 + 5)
  const mats = {}
  const matDi = tipo => {
    if (DI_PIETRA.has(tipo)) return kit.mat.pietra
    if (DI_LEGNO.has(tipo)) return kit.mat.legno
    if (DI_PAGLIA.has(tipo)) return kit.mat.paglia
    const chiave = VENTO[tipo] ? `v${VENTO[tipo]}-${RIGIDO[tipo]}` : (['sasso', 'masso', 'rupe'].includes(tipo) ? 'roccia' : 'liscio')
    if (!mats[chiave]) {
      const mt = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: chiave === 'roccia' ? 0.95 : 0.85, flatShading: chiave === 'roccia' })
      mt.name = chiave
      mats[chiave] = vesti(mt, { vento: VENTO[tipo] || 0, rigido: RIGIDO[tipo] || 0 })
    }
    return mats[chiave]
  }
  // le istanze di ogni tipo: dal decoro del generatore, più il bosco fuori mappa
  const per = {}
  const aggiungi = (tipo, x, y, z, s, rot, c, sy = 1) => (per[tipo] ||= []).push([x, y, z, s, rot, c, sy])
  for (const d of m.decoro) aggiungi(d.tipo, d.x, quotaTerreno(m, d.x, d.y) - (d.tipo === 'rupe' ? 0.3 : 0.02), d.y, d.s, d.r, d.c)
  if (quotaFuori) {
    for (let i = 0; i < 1500; i++) {
      const x = -M + r() * (m.W + 2 * M), z = -M + r() * (m.H + 2 * M)
      const e = Math.max(-x, x - m.W, -z, z - m.H)
      if (e < 2 || e > 45) continue
      const y = quotaFuori(x, z)
      if (y > 9) continue
      const n = fbm(x, z, 990, 12)
      if (n < 0.42) continue
      aggiungi(n > 0.6 ? 'abete' : (r() < 0.5 ? 'pino' : 'tondo'), x, y - 0.1, z, 1.1 + r() * 0.7, r() * 6.28, r())
    }
  }
  // le colture dei campi
  for (const c of m.campi) {
    const lungo = c.file === 'x'
    const nf = Math.floor((lungo ? c.h : c.w) / 0.55), np = Math.floor((lungo ? c.w : c.h) / 0.42)
    for (let f = 0; f < nf; f++) for (let p = 0; p < np; p++) {
      const a = (f + 0.5) * 0.55 + 0.05, b = (p + 0.5) * 0.42 + 0.05
      const x = c.x + (lungo ? b : a), z = c.y + (lungo ? a : b), y = quotaTerreno(m, x, z) + 0.03
      if (c.coltura === 'grano') aggiungi('grano', x + (r() - 0.5) * 0.1, y, z + (r() - 0.5) * 0.1, 1, r() * 6.28, r())
      else if (c.coltura === 'cavoli') { if (p % 2 === 0) aggiungi('cavolo', x, y, z, 0.8 + r() * 0.3, r() * 6.28, r()) }
      else if (c.coltura === 'vigna') aggiungi('vite', x, y, z, 1, 0, r())
      else if (c.coltura === 'zucche') { if ((p + f) % 2 === 0) aggiungi(r() < 0.4 ? 'zucca' : 'cavolo', x, y, z, 0.8 + r() * 0.4, r() * 6.28, r()) }
    }
  }
  // l'erba e i fiori: sulle celle d'erba libere, più fitta nei prati
  const FITTA = { villaggio: 1.2, campi: 2, bosco: 1, lago: 2, prateria: 3, colline: 1.6, rovine: 2, monte: 1.2, landa: 2.2 }
  const TINTA = { villaggio: [0.5, 0.72, 0.28], campi: [0.62, 0.76, 0.28], bosco: [0.34, 0.56, 0.24], lago: [0.42, 0.7, 0.32], prateria: [0.7, 0.76, 0.3], colline: [0.58, 0.64, 0.3], rovine: [0.54, 0.6, 0.34], monte: [0.48, 0.58, 0.32], landa: [0.78, 0.66, 0.34] }
  const COL_FIORI = [[1, 0.95, 0.95], [0.95, 0.85, 0.2], [0.85, 0.35, 0.6], [0.55, 0.6, 0.98], [0.98, 0.5, 0.3]]
  const erba = [], fiori = []
  for (let k = 0; k < m.W * m.H; k++) {
    if (m.terreno[k] !== ERBA || m.strada[k] || m.blocco[k] || m.campo[k] || m.fuori[k] || m.ponte[k] >= 0) continue
    const x = k % m.W, y = (k / m.W) | 0, h = m.regioni[m.reg[k]].habitat
    const n = FITTA[h] * (0.5 + fbm(x, y, 970, 6))
    const quanti = Math.floor(n) + (r() < n % 1 ? 1 : 0)
    for (let i = 0; i < quanti; i++) {
      const px = x + r(), pz = y + r()
      erba.push([px, quotaTerreno(m, px, pz) - 0.02, pz, 0.7 + r() * 0.6, r() * 6.28, TINTA[h]])
    }
    if (['prateria', 'campi', 'villaggio', 'lago', 'colline'].includes(h) && fbm(x, y, 975, 5) > 0.58 && r() < 0.6) {
      const c = COL_FIORI[Math.floor(rumore(x, y, 976, 8) * COL_FIORI.length)]
      for (let i = 0; i < 3; i++) { const px = x + r(), pz = y + r(); fiori.push([px, quotaTerreno(m, px, pz) - 0.02, pz, 0.8 + r() * 0.5, r() * 6.28, c]) }
    }
  }

  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3(), C = new THREE.Color()
  const mesh = []
  const istanze = (geo, mat, lista, colore, { ombra = true } = {}) => {
    const im = new THREE.InstancedMesh(geo, mat, lista.length)
    lista.forEach((a, i) => {
      M4.compose(P.set(a[0], a[1], a[2]), Q.setFromEuler(E.set(0, a[4], 0)), S.set(a[3], a[3] * (a[6] || 1), a[3]))
      im.setMatrixAt(i, M4); im.setColorAt(i, colore(a, C))
    })
    im.castShadow = ombra; im.receiveShadow = true
    im.computeBoundingSphere()
    scena.add(im); mesh.push(im)
    return im
  }
  const vario = (a, c) => { const v = 0.82 + a[5] * 0.36; return c.setRGB(v, v * (0.95 + a[5] * 0.1), v) }
  for (const [tipo, lista] of Object.entries(per)) {
    if (tipo === 'grano') { istanze(ciuffo(6, 0.55), matDi('canne'), lista, (a, c) => c.setRGB(1.0 + a[5] * 0.1, 0.82, 0.4), { ombra: false }); continue }
    if (tipo === 'cavolo') { istanze(GEO.cespuglio(), matDi('cespuglio'), lista, (a, c) => c.setRGB(0.75, 1.05 + a[5] * 0.1, 0.75), { ombra: false }); continue }
    if (tipo === 'zucca') { istanze(forma(c => c.metti('x', blob(0.2, 11, 1, 0.08), 0, 0.12, 0, [0.95, 0.55, 0.15], { s: [1, 0.7, 1] })), matDi('liscio'), lista, vario, { ombra: false }); continue }
    if (tipo === 'vite') { istanze(forma(c => { c.metti('x', scatola(0.05, 0.8, 0.05), 0, 0.4, 0, TRONCO); c.metti('x', blob(0.22, 12), 0, 0.6, 0, [0.3, 0.55, 0.25], { s: [1, 1.3, 1] }) }), matDi('cespuglio'), lista, vario, { ombra: false }); continue }
    if (!GEO[tipo]) continue
    istanze(GEO[tipo](), matDi(tipo), lista, vario, { ombra: !BASSI.has(tipo) })
  }
  const matErba = vesti(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }), { vento: 0.35, rigido: 0 })
  matErba.name = 'erba'
  istanze(ciuffo(), matErba, erba, (a, c) => c.setRGB(a[5][0] * (0.85 + a[3] * 0.2), a[5][1] * (0.85 + a[3] * 0.2), a[5][2]), { ombra: false })
  istanze(fiore(), matDi('cespuglio'), fiori, (a, c) => c.setRGB(...a[5]), { ombra: false })
  return { mesh, conta: { erba: erba.length, fiori: fiori.length, ...Object.fromEntries(Object.entries(per).map(([k, v]) => [k, v.length])) } }
}

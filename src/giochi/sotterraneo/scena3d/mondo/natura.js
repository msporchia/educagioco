// La natura e il decoro sparso del mondo di sopra: alberi, cespugli, canne, sassi e rupi, ruderi, lapidi, covoni, botti, le
// colture dei campi, l'erba a ciuffi e i fiori. Tutto a istanze: le istanze di un pezzo di mondo si calcolano quando si costruisce
// (dalle zone caricate), e una InstancedMesh per tipo (una sola per tutto il mondo vicino) prende quelle dei pezzi costruiti
// (`componi`). La nebbia legge la cella di ogni istanza: un albero si vede o no tutto intero, e sale dal terreno. Dal prototipo
// poc/mondo-sopra/natura.js.
import { IcosahedronGeometry, DodecahedronGeometry, OctahedronGeometry, ConeGeometry, SphereGeometry, CircleGeometry, BufferGeometry, Float32BufferAttribute,
         InstancedMesh, DoubleSide, Matrix4, Quaternion, Euler, Vector3, Color } from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { caso, fbm, rumore, quotaTerreno, ERBA } from './suolo.js'
import { rettangoloDi } from './pezzi.js'
import { Cantiere, scatola, cilindro } from './kit.js'
import { vesti, ombraDi, materialeMondo } from './vesti.js'
import { ACCESI } from '../costanti.js'
import { segna } from '../../../../grafica/elementi3d.js'

// le chiome piccole e i cespugli a `det` 0 (20 facce): nel mondo a percorso i boschi sono fitti, e a 80 facce l'una il bosco vecchio
// passava i 400k triangoli
function blob(r, seme, det = 1, storto = 0.18) {
  let g = new IcosahedronGeometry(r, det)
  g.deleteAttribute('uv'); g.deleteAttribute('normal')
  g = mergeVertices(g)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + (rumore(x * 9 + seme, z * 9, seme, 1) - 0.5) * storto * 2
    p.setXYZ(i, x * k, y * k * 0.92, z * k)
  }
  g.computeVertexNormals()
  return g
}
function sasso(r, seme) {
  const g = new DodecahedronGeometry(r, 0), p = g.attributes.position, visti = new Map()
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`
    if (!visti.has(key)) visti.set(key, 0.75 + rumore(i * 3.1 + seme, seme, seme, 1) * 0.5)
    const k = visti.get(key)
    p.setXYZ(i, p.getX(i) * k * 1.15, Math.max(-r * 0.3, p.getY(i) * k * 0.7), p.getZ(i) * k)
  }
  g.computeVertexNormals()
  return g
}
function forma(f) {
  const c = new Cantiere(); f(c)
  const g = mergeGeometries(Object.values(c.liste).flat())
  g.deleteAttribute('aBase')
  return g
}
const TRONCO = [0.45, 0.33, 0.24]
export const GEO = {
  tondo: () => forma(c => { c.metti('x', cilindro(0.08, 0.13, 1.0, 7), 0, 0.5, 0, TRONCO); c.metti('x', blob(0.62, 1), 0, 1.35, 0, [0.40, 0.64, 0.27]); c.metti('x', blob(0.46, 2, 0), 0.32, 1.1, 0.16, [0.36, 0.60, 0.25]); c.metti('x', blob(0.42, 3, 0), -0.3, 1.15, -0.12, [0.43, 0.68, 0.29]) }),
  frutto: () => forma(c => { c.metti('x', cilindro(0.07, 0.11, 0.8, 7), 0, 0.4, 0, TRONCO); c.metti('x', blob(0.55, 4), 0, 1.1, 0, [0.44, 0.66, 0.28]); for (let i = 0; i < 9; i++) { const a = i * 2.4, h = 0.9 + (i % 3) * 0.17; c.metti('x', new OctahedronGeometry(0.07), Math.cos(a) * 0.5, h, Math.sin(a) * 0.5, [0.9, 0.2, 0.15]) } }),
  pino: () => forma(c => { c.metti('x', cilindro(0.07, 0.11, 0.7, 6), 0, 0.35, 0, TRONCO); for (const [r, h, y] of [[0.62, 0.95, 0.95], [0.5, 0.85, 1.45], [0.34, 0.75, 1.95]]) c.metti('x', new ConeGeometry(r, h, 8), 0, y, 0, [0.20, 0.44, 0.24]) }),
  abete: () => forma(c => { c.metti('x', cilindro(0.07, 0.1, 0.5, 6), 0, 0.25, 0, TRONCO); for (const [r, h, y] of [[0.52, 1.2, 0.95], [0.4, 1.0, 1.65], [0.26, 0.85, 2.3]]) c.metti('x', new ConeGeometry(r, h, 7), 0, y, 0, [0.17, 0.37, 0.31]) }),
  salice: () => forma(c => { c.metti('x', cilindro(0.1, 0.16, 1.1, 7), 0, 0.55, 0, TRONCO); c.metti('x', blob(0.72, 5), 0, 1.55, 0, [0.52, 0.72, 0.34], { s: [1.1, 0.75, 1.1] }); for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7; c.metti('x', blob(0.28, 6 + i, 0, 0.1), Math.cos(a) * 0.7, 1.05, Math.sin(a) * 0.7, [0.56, 0.75, 0.36], { s: [0.8, 1.9, 0.8] }) } }),
  secco: () => forma(c => { c.metti('x', cilindro(0.06, 0.13, 1.5, 6), 0, 0.75, 0, [0.42, 0.36, 0.32]); for (const [a, h, l, t] of [[0.3, 1.0, 0.7, 0.8], [2.4, 1.2, 0.6, 0.9], [4.2, 0.8, 0.55, 0.7], [1.3, 1.4, 0.45, 0.6]]) c.metti('x', cilindro(0.025, 0.05, l, 5), Math.cos(a) * l * 0.4 * Math.sin(t), h + l * 0.4 * Math.cos(t), Math.sin(a) * l * 0.4 * Math.sin(t), [0.42, 0.36, 0.32], { ry: -a, rz: -t, ordine: 'YZX' }) }),
  cespuglio: () => forma(c => { c.metti('x', blob(0.32, 7), 0, 0.2, 0, [0.36, 0.58, 0.25]); c.metti('x', blob(0.25, 8, 0), 0.25, 0.15, 0.1, [0.40, 0.62, 0.28]); c.metti('x', blob(0.22, 9, 0), -0.2, 0.14, 0.12, [0.33, 0.55, 0.24]) }),
  erica: () => forma(c => { c.metti('x', blob(0.26, 13, 1, 0.25), 0, 0.14, 0, [0.62, 0.42, 0.62], { s: [1.2, 0.6, 1] }); c.metti('x', blob(0.18, 14), 0.22, 0.1, 0.08, [0.7, 0.48, 0.66], { s: [1, 0.6, 1] }) }),
  canne: () => forma(c => { for (let i = 0; i < 9; i++) { const a = i * 2.39, r = 0.08 + (i % 3) * 0.08, h = 0.7 + (i % 4) * 0.13; c.metti('x', new ConeGeometry(0.025, h, 4), Math.cos(a) * r, h / 2, Math.sin(a) * r, [0.46, 0.62, 0.3], { rz: Math.cos(a) * 0.12, rx: Math.sin(a) * 0.12 }); if (i % 3 === 0) c.metti('x', cilindro(0.04, 0.04, 0.16, 5), Math.cos(a) * r * 1.05, h * 0.82, Math.sin(a) * r * 1.05, [0.45, 0.3, 0.18]) } }),
  funghi: () => forma(c => { for (const [x, z, s] of [[0, 0, 1], [0.18, 0.1, 0.7], [-0.12, 0.15, 0.6]]) { c.metti('x', cilindro(0.03 * s, 0.04 * s, 0.14 * s, 4), x, 0.07 * s, z, [0.95, 0.92, 0.85]); c.metti('x', new SphereGeometry(0.09 * s, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2), x, 0.13 * s, z, [0.85, 0.2, 0.15]) } }),
  sasso: () => forma(c => c.metti('x', sasso(0.24, 1), 0, 0, 0, [0.66, 0.64, 0.6])),
  masso: () => forma(c => c.metti('x', sasso(0.5, 2), 0, 0, 0, [0.45, 0.43, 0.41])),
  rupe: () => forma(c => c.metti('x', sasso(0.9, 3), 0, 0, 0, [0.36, 0.345, 0.33])),
  brace: () => forma(c => { c.metti('x', sasso(0.22, 4), 0, 0, 0, [0.16, 0.13, 0.12]); c.metti('x', sasso(0.09, 5), 0.06, 0.08, 0, [1.0, 0.45, 0.15]) }),
  ceppo: () => forma(c => { c.metti('x', cilindro(0.22, 0.27, 0.3, 9), 0, 0.15, 0, TRONCO); c.metti('x', new CircleGeometry(0.21, 9).rotateX(-Math.PI / 2), 0, 0.301, 0, [0.8, 0.66, 0.46]) }),
  covone: () => forma(c => { c.metti('x', cilindro(0.38, 0.45, 0.55, 10, 0.6), 0, 0.27, 0, [0.95, 0.82, 0.5]); c.metti('x', new ConeGeometry(0.4, 0.42, 10), 0, 0.75, 0, [0.95, 0.82, 0.5]) }),
  botte: () => forma(c => { c.metti('x', cilindro(0.24, 0.22, 0.6, 10, 0.8), 0, 0.3, 0, [0.7, 0.52, 0.36]); for (const y of [0.1, 0.5]) c.metti('x', cilindro(0.25, 0.25, 0.05, 10), 0, y, 0, [0.3, 0.3, 0.32]) }),
  cassa: () => forma(c => c.metti('x', scatola(0.5, 0.45, 0.5, 0.6), 0, 0.22, 0, [0.72, 0.56, 0.38])),
  spaventapasseri: () => forma(c => { c.metti('x', scatola(0.07, 1.4, 0.07), 0, 0.7, 0, TRONCO); c.metti('x', scatola(0.9, 0.06, 0.06), 0, 1.05, 0, TRONCO); c.metti('x', scatola(0.36, 0.45, 0.2), 0, 0.95, 0, [0.6, 0.3, 0.25]); c.metti('x', new SphereGeometry(0.14, 8, 6), 0, 1.32, 0, [0.9, 0.8, 0.5]); c.metti('x', new ConeGeometry(0.22, 0.22, 10), 0, 1.5, 0, [0.6, 0.5, 0.3]) }),
  rudere: () => forma(c => { c.metti('x', scatola(1.5, 0.9, 0.36, 1.4), 0, 0.45, 0, [0.78, 0.76, 0.72]); c.metti('x', scatola(0.9, 0.35, 0.36, 1.4), -0.3, 1.07, 0, [0.76, 0.74, 0.7]); c.metti('x', scatola(0.35, 0.3, 0.36, 1.4), -0.55, 1.4, 0, [0.74, 0.72, 0.68]); c.metti('x', scatola(0.4, 0.25, 0.3, 1.4), 0.55, 0.12, 0.45, [0.74, 0.72, 0.68], { ry: 0.5 }) }),
  colonna: () => forma(c => { c.metti('x', scatola(0.6, 0.2, 0.6, 1.4), 0, 0.1, 0, [0.84, 0.82, 0.78]); c.metti('x', cilindro(0.22, 0.24, 1.25, 12, 1.4), 0, 0.82, 0, [0.86, 0.84, 0.8]); c.metti('x', cilindro(0.22, 0.22, 0.9, 12, 1.4), 0.55, 0.22, 0.3, [0.84, 0.82, 0.78], { rz: Math.PI / 2, ry: 0.6 }) }),
  lapide: () => forma(c => { c.metti('x', scatola(0.42, 0.5, 0.12, 1), 0, 0.25, 0, [0.7, 0.7, 0.72]); c.metti('x', cilindro(0.21, 0.21, 0.12, 10), 0, 0.5, 0, [0.7, 0.7, 0.72], { rx: Math.PI / 2 }); c.metti('x', scatola(0.5, 0.06, 0.7, 1), 0, 0.03, 0.3, [0.5, 0.56, 0.36]) }),
  ossa: () => forma(c => { c.metti('x', new SphereGeometry(0.11, 8, 6), 0, 0.09, 0, [0.92, 0.9, 0.82], { s: [1, 0.85, 1.2] }); c.metti('x', cilindro(0.025, 0.025, 0.4, 5), 0.2, 0.03, 0.1, [0.9, 0.88, 0.8], { rz: Math.PI / 2, ry: 0.7 }); c.metti('x', cilindro(0.025, 0.025, 0.35, 5), 0.15, 0.03, -0.12, [0.9, 0.88, 0.8], { rz: Math.PI / 2, ry: -0.5 }) }),
  zucca: () => forma(c => c.metti('x', blob(0.2, 11, 1, 0.08), 0, 0.12, 0, [0.95, 0.55, 0.15], { s: [1, 0.7, 1] })),
  vite: () => forma(c => { c.metti('x', scatola(0.05, 0.8, 0.05), 0, 0.4, 0, TRONCO); c.metti('x', blob(0.22, 12, 0), 0, 0.6, 0, [0.3, 0.55, 0.25], { s: [1, 1.3, 1] }) }),
  fiore: () => forma(c => { c.metti('x', cilindro(0.01, 0.01, 0.22, 3), 0, 0.11, 0, [0.4, 0.6, 0.3]); c.metti('x', new CircleGeometry(0.07, 5).rotateX(-Math.PI / 2), 0, 0.225, 0, [1, 1, 1]); c.metti('x', new CircleGeometry(0.025, 5).rotateX(-Math.PI / 2), 0, 0.23, 0, [1, 0.85, 0.2]) }),
}
// l'erba: fili (triangoli) che s'aprono, scuri alla base e chiari in punta, con la normale all'insù
function ciuffo(fili = 5, alto = 0.32) {
  const pos = [], col = [], nor = []
  for (let i = 0; i < fili; i++) {
    const a = i * Math.PI * 2 / fili + i * 0.7, r = 0.06 + (i % 2) * 0.05, h = alto * (0.7 + (i % 3) * 0.18)
    const cx = Math.cos(a) * r, cz = Math.sin(a) * r, px = -Math.sin(a) * 0.03, pz = Math.cos(a) * 0.03, tx = Math.cos(a) * (r + 0.1), tz = Math.sin(a) * (r + 0.1)
    pos.push(cx - px, 0, cz - pz, cx + px, 0, cz + pz, tx, h, tz)
    col.push(0.55, 0.55, 0.55, 0.55, 0.55, 0.55, 1.15, 1.15, 1.0)
    nor.push(0, 1, 0, 0, 1, 0, 0, 1, 0)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('color', new Float32BufferAttribute(col, 3)); g.setAttribute('normal', new Float32BufferAttribute(nor, 3))
  return g
}
GEO.grano = () => ciuffo(6, 0.55)
// nei campi le piante sono tante: forme da pochi triangoli
GEO.cavolo = () => forma(c => { c.metti('x', blob(0.26, 7, 0, 0.25), 0, 0.16, 0, [0.42, 0.62, 0.3], { s: [1, 0.7, 1] }); c.metti('x', blob(0.18, 8, 0, 0.2), 0.12, 0.12, 0.1, [0.5, 0.7, 0.34], { s: [1, 0.7, 1] }) })
GEO.erba = () => ciuffo()

export const VENTO = { tondo: 0.05, frutto: 0.05, pino: 0.03, abete: 0.03, salice: 0.07, cespuglio: 0.1, erica: 0.08, canne: 0.25, grano: 0.25, cavolo: 0.1, vite: 0.1, fiore: 0.1, erba: 0.35 }
const RIGIDO = { tondo: 0.75, frutto: 0.6, pino: 0.6, abete: 0.4, salice: 0.8 }
const DI_PIETRA = new Set(['rudere', 'colonna', 'lapide']), DI_LEGNO = new Set(['botte', 'cassa', 'ceppo']), DI_PAGLIA = new Set(['covone'])
const BASSI = new Set(['cespuglio', 'erica', 'canne', 'funghi', 'ossa', 'sasso', 'brace', 'fiore', 'erba', 'grano', 'cavolo', 'zucca', 'vite'])
const FITTA = { villaggio: 1.2, campi: 2, frutteto: 2, prato: 3, cimitero: 1.4, rovine: 2, brughiera: 2.2, bosco: 1, foresta: 0.8, lago: 2, palude: 1.6, monte: 1.2, roccia: 1, landa: 2.2, ceneri: 0.6, secco: 1.2 }
const TINTA = { villaggio: [0.5, 0.72, 0.28], campi: [0.62, 0.76, 0.28], frutteto: [0.56, 0.74, 0.3], prato: [0.66, 0.78, 0.3], cimitero: [0.48, 0.6, 0.34], rovine: [0.54, 0.6, 0.34], brughiera: [0.62, 0.6, 0.36], bosco: [0.34, 0.56, 0.24], foresta: [0.3, 0.5, 0.24], lago: [0.42, 0.7, 0.32], palude: [0.42, 0.56, 0.28], monte: [0.48, 0.58, 0.32], roccia: [0.56, 0.6, 0.38], landa: [0.78, 0.66, 0.34], ceneri: [0.52, 0.5, 0.42], secco: [0.7, 0.62, 0.34] }
const FIORITI = new Set(['prato', 'campi', 'villaggio', 'lago', 'frutteto'])
const COL_FIORI = [[1, 0.95, 0.95], [0.95, 0.85, 0.2], [0.85, 0.35, 0.6], [0.55, 0.6, 0.98], [0.98, 0.5, 0.3]]

// le istanze di un pezzo, per tipo: { tipo: { m: Float32Array(16 n), c: Float32Array(3 n), n } }. Si calcolano quando il pezzo si
// costruisce, da quello che ci sta (`q`: il decoro e i campi delle zone caricate, contenutoDelPezzo) e dalle sue celle scritte (l'erba
// e i fiori); se ne vanno col pezzo
export function istanzeDelPezzo(m, p, q) {
  const liste = {}
  const M4 = new Matrix4(), Q = new Quaternion(), E = new Euler(), P = new Vector3(), S = new Vector3()
  const metti = (tipo, x, y, z, s, rot, r, g, b, sy = 1) => {
    const l = (liste[tipo] ||= { m: [], c: [] })
    M4.compose(P.set(x, y, z), Q.setFromEuler(E.set(0, rot, 0)), S.set(s, s * sy, s))
    l.m.push(...M4.elements); l.c.push(r, g, b)
  }
  const vario = c => 0.82 + c * 0.36
  for (const d of q.decoro) { const v = vario(d.c); metti(d.tipo, d.x, quotaTerreno(m, d.x, d.y) - (d.tipo === 'rupe' ? 0.3 : 0.02), d.y, d.s, d.r, v, v * (0.95 + d.c * 0.1), v) }
  const r = caso(m.seme * 31 + 5 + p * 7919)
  for (const c of q.campi) {
    const lungo = c.file === 'x', nf = Math.floor((lungo ? c.h : c.w) / 0.55), np = Math.floor((lungo ? c.w : c.h) / 0.42)
    for (let f = 0; f < nf; f++) for (let k = 0; k < np; k++) {
      const a = (f + 0.5) * 0.55 + 0.05, b = (k + 0.5) * 0.42 + 0.05
      const x = c.x + (lungo ? b : a), z = c.y + (lungo ? a : b), y = quotaTerreno(m, x, z) + 0.03, w = r()
      if (c.coltura === 'grano') metti('grano', x + (r() - 0.5) * 0.1, y, z + (r() - 0.5) * 0.1, 1, r() * 6.28, 1.0 + w * 0.1, 0.82, 0.4)
      else if (c.coltura === 'cavoli') { if (k % 2 === 0) metti('cavolo', x, y, z, 0.8 + r() * 0.3, r() * 6.28, 0.75, 1.05 + w * 0.1, 0.75) }
      else if (c.coltura === 'vigna') metti('vite', x, y, z, 1, 0, vario(w), vario(w), vario(w))
      else if (c.coltura === 'frutteto') { if ((k + f) % 3 === 0) metti('frutto', x, y, z, 0.7 + r() * 0.2, r() * 6.28, vario(w), vario(w), vario(w)) }
      else if ((k + f) % 2 === 0) metti(r() < 0.4 ? 'zucca' : 'cavolo', x, y, z, 0.8 + r() * 0.4, r() * 6.28, 0.9, 1, 0.9)
    }
  }
  // l'erba e i fiori: sulle celle d'erba libere delle zone caricate, più fitta nei prati
  const R = rettangoloDi(m, p)
  for (let y = R.z0; y < R.z1; y++) for (let x = R.x0; x < R.x1; x++) {
    const k = y * m.W + x
    if (m.zona[k] < 0 || !m.zonaCaricata[m.zona[k]]) continue
    if (m.terreno[k] !== ERBA || m.strada[k] || m.blocco[k] || m.campo[k] || m.ponte[k] >= 0 || m.isola[k]) continue
    const h = m.regioni[m.reg[k]].habitat, t = TINTA[h] || TINTA.prato
    const fitta = (FITTA[h] || 1.5) * (0.5 + fbm(x, y, 970, 6)) * ACCESI.quantaErba, quanti = Math.floor(fitta) + (r() < fitta % 1 ? 1 : 0)
    for (let i = 0; i < quanti; i++) {
      const px = x + r(), pz = y + r(), s = 0.7 + r() * 0.6, v = 0.85 + s * 0.2
      metti('erba', px, quotaTerreno(m, px, pz) - 0.02, pz, s, r() * 6.28, t[0] * v, t[1] * v, t[2])
    }
    if (FIORITI.has(h) && fbm(x, y, 975, 5) > 0.58 && r() < 0.6) {
      const c = COL_FIORI[Math.floor(rumore(x, y, 976, 8) * COL_FIORI.length)]
      for (let i = 0; i < 3; i++) { const px = x + r(), pz = y + r(); metti('fiore', px, quotaTerreno(m, px, pz) - 0.02, pz, 0.8 + r() * 0.5, r() * 6.28, ...c) }
    }
  }
  return Object.fromEntries(Object.entries(liste).map(([t, v]) => [t, { m: new Float32Array(v.m), c: new Float32Array(v.c), n: v.c.length / 3 }]))
}

// le InstancedMesh, una per tipo, per tutto il mondo vicino: `componi(istanze)` le riempie con quelle dei pezzi costruiti (una lista
// di `istanzeDelPezzo`). Crescono quando non bastano, e non calano
export function creaNatura(m, kit, scena) {
  const mats = {}, ombre = {}
  const matDi = tipo => {
    if (DI_PIETRA.has(tipo)) return [kit.mobili.pietra, kit.ombraMobili]
    if (DI_LEGNO.has(tipo)) return [kit.mobili.legno, kit.ombraMobili]
    if (DI_PAGLIA.has(tipo)) return [kit.mobili.paglia, kit.ombraMobili]
    const v = VENTO[tipo] || 0, rg = RIGIDO[tipo] || 0, roccia = ['sasso', 'masso', 'rupe', 'brace'].includes(tipo)
    const chiave = v ? `v${v}-${rg}${tipo === 'erba' ? '-erba' : ''}` : roccia ? 'roccia' : 'liscio'
    if (!mats[chiave]) {
      const mt = materialeMondo({ vertexColors: true, roughness: roccia ? 0.95 : tipo === 'erba' ? 1 : 0.85, flatShading: roccia, side: tipo === 'erba' ? DoubleSide : 0 })
      mt.name = chiave
      mats[chiave] = vesti(mt, { vento: v, rigido: rg, oggetto: 'istanza' })
      ombre[chiave] = ombraDi({ vento: v, rigido: rg, oggetto: 'istanza' })
    }
    return [mats[chiave], ombre[chiave]]
  }
  const pool = {}, geo = {}
  const imDi = (tipo, serve) => {
    const vecchia = pool[tipo]
    if (vecchia && vecchia.instanceMatrix.count >= serve) return vecchia
    if (!GEO[tipo]) return null
    if (vecchia) { scena.remove(vecchia); vecchia.dispose() }
    const [mat, ombra] = matDi(tipo)
    const im = new InstancedMesh(geo[tipo] ||= GEO[tipo](), mat, Math.ceil(Math.max(64, serve) * 1.4))
    im.count = 0; im.visible = false; im.frustumCulled = false
    im.setColorAt(0, new Color(1, 1, 1))
    im.castShadow = !BASSI.has(tipo); im.receiveShadow = true
    im.customDepthMaterial = ombra
    scena.add(segna(im, 'natura'))   // nasce dopo creaNatura: il segno di segnaNuovi non la prende
    return (pool[tipo] = im)
  }
  return {
    pool,
    // le istanze dei pezzi costruiti nei loro tipi (una volta per pezzo costruito o buttato, non a fotogramma)
    componi(istanze) {
      const tot = {}
      for (const l of istanze) for (const [t, v] of Object.entries(l)) tot[t] = (tot[t] || 0) + v.n
      for (const t of Object.keys(pool)) if (!tot[t]) { pool[t].count = 0; pool[t].visible = false }
      for (const [tipo, n0] of Object.entries(tot)) {
        const im = imDi(tipo, n0)
        if (!im) continue
        let n = 0
        for (const l of istanze) {
          const v = l[tipo]
          if (!v) continue
          im.instanceMatrix.array.set(v.m, n * 16); im.instanceColor.array.set(v.c, n * 3); n += v.n
        }
        im.count = n; im.visible = n > 0
        im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true
      }
    },
    via() {
      for (const im of Object.values(pool)) { scena.remove(im); im.dispose() }
      for (const g of Object.values(geo)) g.dispose()
      for (const x of [...Object.values(mats), ...Object.values(ombre)]) x.dispose()
    },
  }
}

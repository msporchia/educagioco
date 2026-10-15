// Le forme dei sassi in 3D, una famiglia per specie di grafica/cieli.js (roccia, ghiaccio,
// rottami, cristalli, dischi, lava, nero, bomba). Raggio ~1: la scena le scala al raggio
// del sasso. Ogni forma ha posizione, normale, colore, `brace` (vedi materia.js) e un uv
// solo sul davanti, dove è inciso il numero (fuori dal davanti l'uv cade sul bordo bianco
// della tela del numero, che non disegna niente). Si costruiscono la prima volta che servono.
import { IcosahedronGeometry, BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry,
         CapsuleGeometry, LatheGeometry, TubeGeometry, CatmullRomCurve3, BufferAttribute,
         Vector2, Vector3, Color, Matrix4, Euler, Quaternion } from 'three'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { fbm, liscio, stringi, seme, direzione } from './rumore.js'

export const VARIANTI = 3
const v = new Vector3(), c = new Color()

// ---- i pezzi comuni ----

// il davanti, dove sta il numero: `w`×`h` attorno a (cx, cy); dietro, uv fuori tela
export function uvFronte(g, { cx = 0, cy = 0, w = 1.9, h = 1.0, soglia = 0.25 } = {}) {
  const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2)
  for (let i = 0; i < p.count; i++) {
    const davanti = n.getZ(i) > soglia
    uv[i * 2] = davanti ? (p.getX(i) - cx) / w + 0.5 : -5
    uv[i * 2 + 1] = davanti ? (p.getY(i) - cy) / h + 0.5 : -5
  }
  g.setAttribute('uv', new BufferAttribute(uv, 2))
  return g
}

// colore e brace uguali per tutto il pezzo (prima di unire i pezzi di una forma)
export function tingi(g, col, brace = 0) {
  const n = g.attributes.position.count
  const cc = new Float32Array(n * 3), b = new Float32Array(n).fill(brace)
  c.set(col)
  for (let i = 0; i < n; i++) { cc[i * 3] = c.r; cc[i * 3 + 1] = c.g; cc[i * 3 + 2] = c.b }
  g.setAttribute('color', new BufferAttribute(cc, 3))
  g.setAttribute('brace', new BufferAttribute(b, 1))
  if (g.attributes.uv) g.deleteAttribute('uv')
  return g
}

const M = new Matrix4(), Q = new Quaternion(), E = new Euler(), S = new Vector3(), P = new Vector3()
export function posa(g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  g.applyMatrix4(M.compose(P.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), S.set(sx, sy, sz)))
  return g
}

// `piatte`: normali per faccia (cristalli); se no restano quelle di ogni pezzo
export function unisci(pezzi, fronte, piatte = false) {
  const g = mergeGeometries(pezzi.map(p => (p.index ? p.toNonIndexed() : p)))
  if (piatte) g.computeVertexNormals()
  return uvFronte(g, fronte)
}

// ---- la roccia: un icosaedro deformato, crateri, il davanti più liscio e più scuro ----
// roccia, marte, lava, nero e ghiaccio sono la stessa costruzione con parametri diversi
const ROCCE = {
  roccia: { tinte: [[.55, .50, .46], [.62, .52, .40], [.48, .46, .50]], crateri: 46, dettaglio: 12 },
  marte: { tinte: [[.66, .36, .26], [.58, .30, .22], [.70, .42, .30]], crateri: 40, dettaglio: 12 },
  lava: { tinte: [[.24, .13, .09], [.20, .11, .08], [.28, .15, .10]], crateri: 14, dettaglio: 12, vene: true },
  nero: { tinte: [[.24, .19, .34], [.20, .16, .30], [.28, .22, .38]], crateri: 30, dettaglio: 12 },
  ghiaccio: { tinte: [[.80, .93, 1.0], [.70, .88, .98], [.86, .96, 1.0]], crateri: 0, dettaglio: 2, faccette: true },
}

function roccia(tipo, n) {
  const R = ROCCE[tipo], rng = seme(n * 9973 + 17 + tipo.length * 31)
  let g = new IcosahedronGeometry(1, R.dettaglio)
  g.deleteAttribute('uv'); g.deleteAttribute('normal')
  g = mergeVertices(g, 1e-4)
  const pos = g.attributes.position
  const col = new Float32Array(pos.count * 3), brace = new Float32Array(pos.count)
  const crateri = []
  for (let i = 0; i < R.crateri; i++) {
    crateri.push({ d: direzione(rng, new Vector3()), s: i < 7 ? 0.35 + rng() * 0.35 : 0.08 + rng() * 0.16, p: 0.05 + rng() * 0.09 })
  }
  const tinta = R.tinte[n % R.tinte.length], so = rng() * 50
  const sc = R.faccette ? [1.05 + rng() * 0.15, 0.9 + rng() * 0.15, 0.85 + rng() * 0.15]
                        : [1.08 + rng() * 0.2, 0.86 + rng() * 0.2, 0.92 + rng() * 0.2]
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize()
    const ampio = R.faccette ? 0.35 : 0.55
    let r = 1 + (fbm(v.x * 1.4 + so, v.y * 1.4, v.z * 1.4, 3) - 0.5) * ampio
    if (!R.faccette) r += (fbm(v.x * 5 + so, v.y * 5, v.z * 5, 3) - 0.5) * 0.12 + (fbm(v.x * 22, v.y * 22 + so, v.z * 22, 2) - 0.5) * 0.035
    let scuro = 0
    for (const k of crateri) {
      const t = v.distanceTo(k.d) / k.s
      if (t < 1.35) {
        r += -k.p * Math.pow(1 - Math.min(t, 1) ** 2, 2) + k.p * 0.45 * Math.exp(-(((t - 1) / 0.18) ** 2))
        if (t < 1) scuro += (1 - t * t) * 0.4
      }
    }
    const m = fbm(v.x * 3 + so, v.y * 3, v.z * 3 + 9, 3), vena = Math.pow(fbm(v.x * 9, v.y * 9 + so, v.z * 9, 3), 4) * 3
    const fx = Math.abs(v.x * r * sc[0]), fy = Math.abs(v.y * r * sc[1])
    // il fronte attorno al numero è più scuro: il numero si legge
    const intorno = liscio(stringi((v.z - 0.2) / 0.35)) * liscio(stringi((1.15 - fx) / 0.45)) * liscio(stringi((0.72 - fy) / 0.3))
    const l = (0.65 + m * 0.6) * (1 - Math.min(scuro, 0.55)) * (1 - (R.faccette ? 0.35 : 0.55) * intorno)
    col[i * 3] = tinta[0] * l + vena * 0.08; col[i * 3 + 1] = tinta[1] * l + vena * 0.05; col[i * 3 + 2] = tinta[2] * l
    if (R.vene) {   // la lava: creste del rumore, accese dove la crosta si spacca
      const cr = 1 - Math.abs(fbm(v.x * 2.6 + so, v.y * 2.6, v.z * 2.6, 3) * 2 - 1)
      brace[i] = Math.pow(stringi((cr - 0.78) / 0.22), 1.5) * (1 - 0.8 * intorno)
    }
    // il fronte è più liscio: ci sta il numero
    const w = liscio(stringi((v.z - 0.25) / 0.4)); r = 1 + (r - 1) * (1 - 0.65 * w)
    pos.setXYZ(i, v.x * r * sc[0], v.y * r * sc[1], v.z * r * sc[2])
  }
  g.setAttribute('color', new BufferAttribute(col, 3))
  g.setAttribute('brace', new BufferAttribute(brace, 1))
  if (R.faccette) g = g.toNonIndexed()   // il ghiaccio a faccette piatte
  g.computeVertexNormals()
  return uvFronte(g)
}

// ---- i rottami: una lastra col pericolo, un pannello solare, un serbatoio ----
function rottame(n) {
  const rng = seme(n * 7919 + 3), k = n % 3
  if (k === 0) {
    const g = new BoxGeometry(1.9, 1.5, 0.16, 22, 16, 1)
    const p = g.attributes.position, cc = new Float32Array(p.count * 3)
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i)
      const bordo = Math.max(Math.abs(x) / 0.95, Math.abs(y) / 0.75)
      if (bordo > 0.97) { const s = 1 + (fbm(x * 4, y * 4, 3, 2) - 0.5) * 0.35; x *= s; y *= s }   // il bordo strappato
      z += 0.14 * x * x - 0.06 * y                                                          // piegata
      p.setXYZ(i, x, y, z)
      const striscia = y < -0.35 && Math.floor((x + y) * 3.2 + 10) % 2 === 0
      const l = 0.55 + fbm(x * 3, y * 3, 1, 2) * 0.4
      if (y < -0.35) c.setRGB(striscia ? 0.95 : 0.08, striscia ? 0.72 : 0.08, striscia ? 0.12 : 0.09)
      else c.setRGB(0.62 * l, 0.65 * l, 0.70 * l)
      cc[i * 3] = c.r; cc[i * 3 + 1] = c.g; cc[i * 3 + 2] = c.b
    }
    g.setAttribute('color', new BufferAttribute(cc, 3))
    g.setAttribute('brace', new BufferAttribute(new Float32Array(p.count), 1))
    g.deleteAttribute('uv')
    g.computeVertexNormals()
    const rivetti = [[-0.72, 0.4], [0.55, 0.55], [0.7, -0.15], [-0.7, -0.05]].map(([x, y]) =>
      posa(tingi(new SphereGeometry(0.06, 8, 6), '#2b313c'), x, y, 0.1 + 0.14 * x * x - 0.06 * y))
    return unisci([g, ...rivetti], { w: 1.7, h: 0.95, cy: 0.1 })
  }
  if (k === 1) {
    const telaio = tingi(new BoxGeometry(2.0, 1.25, 0.08), '#9aa3b2')
    const celle = new BoxGeometry(1.8, 1.05, 0.1, 18, 10, 1)
    const p = celle.attributes.position, cc = new Float32Array(p.count * 3)
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i)
      const riga = Math.abs(((x + 0.9) / 0.2) % 1 - 0.5) > 0.42 || Math.abs(((y + 0.525) / 0.21) % 1 - 0.5) > 0.42
      c.set(riga ? '#7fa6e8' : '#1f4fa8'); cc[i * 3] = c.r; cc[i * 3 + 1] = c.g; cc[i * 3 + 2] = c.b
    }
    celle.setAttribute('color', new BufferAttribute(cc, 3))
    celle.setAttribute('brace', new BufferAttribute(new Float32Array(p.count), 1))
    celle.deleteAttribute('uv')
    posa(celle, 0, 0, 0.02)
    const filo = tingi(new TubeGeometry(new CatmullRomCurve3([new Vector3(0.95, 0.1, 0), new Vector3(1.2, -0.2, 0.05),
      new Vector3(1.12, -0.6, 0.1)]), 12, 0.03, 5), '#e0702f')
    const g = unisci([telaio, celle, filo], { w: 1.6, h: 0.9 })
    g.rotateZ((rng() - 0.5) * 0.3)
    return g
  }
  const s = new CapsuleGeometry(0.55, 0.85, 6, 18)
  const p = s.attributes.position, cc = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const ammaccato = Math.exp(-((x - 0.25) ** 2 + (y - 0.1) ** 2) * 9) * 0.16
    p.setXYZ(i, x, y, z - ammaccato * Math.sign(z))
    const banda = Math.abs(y - 0.42) < 0.07 || Math.abs(y + 0.38) < 0.07
    const l = 0.7 + 0.3 * fbm(x * 4, y * 4, z * 4, 2)
    if (banda) c.setRGB(0.1, 0.11, 0.14); else c.setRGB(0.94 * l, 0.54 * l, 0.24 * l)
    cc[i * 3] = c.r; cc[i * 3 + 1] = c.g; cc[i * 3 + 2] = c.b
  }
  s.setAttribute('color', new BufferAttribute(cc, 3))
  s.setAttribute('brace', new BufferAttribute(new Float32Array(p.count), 1))
  s.deleteAttribute('uv')
  s.computeVertexNormals()
  return unisci([s], { w: 1.15, h: 0.7 })
}

// ---- i cristalli: una gemma in mezzo e i prismi attorno, a faccette ----
function cristalli(n) {
  const rng = seme(n * 4567 + 11)
  const pezzi = [posa(tingi(new IcosahedronGeometry(0.66, 1), '#c04dff', 0.35), 0, 0, 0, 0, 0, 0, 1, 0.95, 0.75)]
  for (let j = 0; j < 5; j++) {
    const a = j * (Math.PI * 2 / 5) + rng() * 0.6, l = 0.9 + rng() * 0.45, w = 0.2 + rng() * 0.08
    const prisma = mergeGeometries([new CylinderGeometry(w, w, l * 0.7, 6).toNonIndexed(),
      posa(new ConeGeometry(w, l * 0.35, 6), 0, l * 0.525).toNonIndexed()].map(g => { g.deleteAttribute('uv'); return g }))
    const tinta = j % 2 ? '#e88cff' : '#9a3dff'
    tingi(prisma, tinta, 0.2)
    posa(prisma, Math.cos(a) * 0.35, Math.sin(a) * 0.35, -0.15 + rng() * 0.2, (rng() - 0.5) * 0.6, 0, a - Math.PI / 2)
    pezzi.push(prisma)
  }
  return unisci(pezzi, { w: 1.5, h: 0.85 }, true)
}

// ---- i dischi volanti: largo entro 1,25 del raggio (docs/asteroidi/cieli.md) ----
function disco() {
  const profilo = [[0, -0.22], [0.45, -0.24], [0.95, -0.12], [1.2, 0], [1.05, 0.1], [0.6, 0.18], [0.5, 0.22], [0, 0.24]]
    .map(([x, y]) => new Vector2(x, y))
  const corpo = new LatheGeometry(profilo, 40)
  corpo.deleteAttribute('uv')
  const p = corpo.attributes.position, cc = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), l = 0.45 + 0.55 * stringi((y + 0.24) / 0.48)
    c.setRGB(0.66 * l + 0.1, 0.7 * l + 0.1, 0.8 * l + 0.12); cc[i * 3] = c.r; cc[i * 3 + 1] = c.g; cc[i * 3 + 2] = c.b
  }
  corpo.setAttribute('color', new BufferAttribute(cc, 3))
  corpo.setAttribute('brace', new BufferAttribute(new Float32Array(p.count), 1))
  const luci = []
  const TINTE = ['#ffd94a', '#7fe3ff', '#ff6bd0']
  for (let i = 0; i < 14; i++) {   // le luci in catena, tutto attorno al bordo
    const a = i / 14 * Math.PI * 2
    luci.push(posa(tingi(new SphereGeometry(0.075, 8, 6), TINTE[i % 3], (i + 1) / 15), Math.cos(a) * 1.1, 0.04, Math.sin(a) * 1.1))
  }
  // inclinato già nella forma, verso chi guarda: il numero si proietta sul davanti come si
  // vede (bordo e piano di sopra), non solo sulla fascia sottile del bordo
  const g = mergeGeometries([corpo, ...luci].map(p => (p.index ? p.toNonIndexed() : p)))
  g.rotateX(INCLINA_DISCO)
  return uvFronte(g, { w: 2.0, h: 0.95, cy: -0.02, soglia: 0.05 })
}
export const INCLINA_DISCO = 0.38

// ---- la bomba della nave madre: una mina a punte con la spia ----
function bomba() {
  const pezzi = [tingi(new IcosahedronGeometry(0.82, 3), '#5a4078')]
  const ico = new IcosahedronGeometry(1, 0), p = ico.attributes.position, viste = new Set()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize()
    const chiave = v.toArray().map(x => x.toFixed(2)).join()
    if (viste.has(chiave)) continue
    viste.add(chiave)
    const punta = tingi(new ConeGeometry(0.13, 0.42, 7), '#3a2a4a')
    punta.applyMatrix4(M.compose(P.copy(v).multiplyScalar(0.92), Q.setFromUnitVectors(new Vector3(0, 1, 0), v), S.set(1, 1, 1)))
    pezzi.push(punta)
  }
  pezzi.push(posa(tingi(new SphereGeometry(0.15, 10, 8), '#ff4a4a', 1), 0, 0.62, 0.42))
  return unisci(pezzi, { w: 1.6, h: 0.9 })
}

const COSTRUTTORI = {
  roccia: n => roccia('roccia', n), marte: n => roccia('marte', n), lava: n => roccia('lava', n),
  nero: n => roccia('nero', n), ghiaccio: n => roccia('ghiaccio', n),
  rottami: rottame, cristalli, dischi: disco, bomba,
}

const CACHE = new Map()
// la forma di un sasso: dalla specie e dal seme, sempre la stessa per lo stesso sasso
export function formaDi(specie, semeSasso) {
  const famiglia = COSTRUTTORI[specie] ? specie : 'roccia'
  const unica = famiglia === 'dischi' || famiglia === 'bomba'
  const n = unica ? 0 : (semeSasso >>> 0) % VARIANTI
  const chiave = famiglia + n
  let g = CACHE.get(chiave)
  if (!g) { g = COSTRUTTORI[famiglia](n); g.computeBoundingSphere(); CACHE.set(chiave, g) }
  return g
}

// i cocci di un sasso che esplode: una forma sola, tinta per istanza
export const coccio = () => {
  const g = new IcosahedronGeometry(1, 0)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * 1.1, p.getY(i) * 0.7, p.getZ(i) * 0.85)
  g.computeVertexNormals()
  return g
}

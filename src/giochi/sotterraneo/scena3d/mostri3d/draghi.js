// Generato da strumenti/promuovi-3d.mjs da poc/mostri-3d/draghi.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Il drago grande: elegante e maestoso (collo a S, testa nobile con corna a palco, ali enormi a membrana scalloppata).
// Cinque colori per la forza: verde 1, azzurro 2, rosso 3, nero 4, oro 5. Autonomo (poc/): three + gli helper di mostri.js.
// Il corpo è UN tubo unico (coda → torace → collo) ricalcolato a ogni fotogramma: così il collo ondeggia senza giunture.
// Ogni `creaDragoGrande(colore)` torna un Group coi piedi a y = 0, il davanti verso +z, `userData.anima(t)`, `userData.sbuffa(p)`.
import * as THREE from 'three'
import { M, perno, liscio, onda, rozza, sfera } from './mostri.js'
import { creaFiamma, PALETTE_FIAMMA } from './draghi-fiamma.js'

export const COLORI = {
  verde: { nome: 'Verde', forza: 1, corpo: 0x5f9f40, scaglie: 0x2c6a30, pancia: 0xe9ecde, membrana: 0xe3862f, bordo: 0xffd070, corna: 0xb5472c, frange: 0xcb3a28, artigli: 0xf1e6c8, occhi: 0xffc42e, fiamma: 'arancio', emissivo: 0, emissivoInt: 0, traslucida: false },
  azzurro: { nome: 'Azzurro', forza: 2, corpo: 0x5eb0e6, scaglie: 0x2c6cae, pancia: 0xeef8ff, membrana: 0x8fd0f0, bordo: 0xf2fdff, corna: 0xdaf2ff, frange: 0xc2ecff, artigli: 0xf4fbff, occhi: 0x7af0ff, fiamma: 'ghiaccio', emissivo: 0x2a6a9a, emissivoInt: 0.18, traslucida: false },
  rosso: { nome: 'Rosso', forza: 3, corpo: 0xc23a2b, scaglie: 0x741e18, pancia: 0xf1c88a, membrana: 0xb1361d, bordo: 0xff9a48, corna: 0x40281e, frange: 0xffb02e, artigli: 0xf0e2c0, occhi: 0xffd23a, fiamma: 'arancio', emissivo: 0x3a0600, emissivoInt: 0.2, traslucida: false },
  nero: { nome: 'Nero', forza: 4, corpo: 0x4a4a6c, scaglie: 0x1e1e34, luce: 0x8a92c8, pancia: 0x827da8, membrana: 0x5a3d8e, bordo: 0xc08aff, corna: 0xc4b4ee, frange: 0xb56dff, artigli: 0xd8ccf0, occhi: 0xc86bff, fiamma: 'viola', emissivo: 0x3a1c70, emissivoInt: 0.35, traslucida: false },
  oro: { nome: 'Oro', forza: 5, corpo: 0xffcf4a, scaglie: 0xd69a22, pancia: 0xfff6d2, membrana: 0xffdc7a, bordo: 0xffffff, corna: 0xfffbe6, frange: 0xfff4a8, artigli: 0xffffff, occhi: 0xffffff, fiamma: 'oro', emissivo: 0xffb428, emissivoInt: 0.6, traslucida: true },
}

const SU = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0)
const V = (x, y, z) => new THREE.Vector3(x, y, z)
const mix = (a, b, t) => a + (b - a) * t
const col = c => new THREE.Color(c)

/** Un valore che passa dolcemente da un punto chiave all'altro: chiavi [[u, v], …] ordinate. */
function profilo (chiavi) {
  return u => {
    if (u <= chiavi[0][0]) return chiavi[0][1]
    for (let i = 1; i < chiavi.length; i++) if (u <= chiavi[i][0]) { const [a, va] = chiavi[i - 1], [b, vb] = chiavi[i]; return mix(va, vb, liscio(a, b, u)) }
    return chiavi.at(-1)[1]
  }
}

// ── il tubo: una sezione ellittica che segue una curva, con colore per vertice (scaglie e placche, niente texture) ──
class Tubo {
  constructor (anelli, lati, mat, fnCol) {
    this.n = anelli; this.l = lati
    const nv = anelli * lati
    this.centri = Array.from({ length: anelli }, () => new THREE.Vector3())
    this.tang = Array.from({ length: anelli }, () => new THREE.Vector3())
    this.lat = Array.from({ length: anelli }, () => new THREE.Vector3())
    this.su = Array.from({ length: anelli }, () => new THREE.Vector3())
    this.rx = new Float32Array(anelli); this.ry = new Float32Array(anelli)
    const idx = [], colori = new Float32Array(nv * 3)
    for (let i = 0; i < anelli; i++) for (let j = 0; j < lati; j++) {
      const c = fnCol(i / (anelli - 1), j / lati * Math.PI * 2, i, j)
      colori.set([c.r, c.g, c.b], (i * lati + j) * 3)
      if (i < anelli - 1) { const a = i * lati + j, b = i * lati + (j + 1) % lati, c2 = (i + 1) * lati + j, d = (i + 1) * lati + (j + 1) % lati; idx.push(a, c2, b, b, c2, d) }
    }
    const geo = new THREE.BufferGeometry()
    this.pos = new Float32Array(nv * 3)
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(colori, 3)); geo.setIndex(idx)
    this.geo = geo
    this.mesh = new THREE.Mesh(geo, mat); this.mesh.castShadow = true; this.mesh.receiveShadow = true; this.mesh.frustumCulled = false
  }

  aggiorna (curva, raggio, larg = () => 1, asp = () => 1) {
    const n = this.n, l = this.l
    if (curva.updateArcLengths) curva.updateArcLengths()
    const pts = curva.getSpacedPoints(n - 1)
    for (let i = 0; i < n; i++) {
      const T = this.tang[i].copy(pts[Math.min(n - 1, i + 1)]).sub(pts[Math.max(0, i - 1)]).normalize()
      const lat = this.lat[i].copy(X).addScaledVector(T, -T.x).normalize()
      const su = this.su[i].crossVectors(T, lat)
      const u = i / (n - 1), r = raggio(u)
      const rx = r * larg(u), ry = r * asp(u)
      this.rx[i] = rx; this.ry[i] = ry; this.centri[i].copy(pts[i])
      for (let j = 0; j < l; j++) {
        const a = j / l * Math.PI * 2, c = Math.cos(a) * rx, s = Math.sin(a) * ry, k = (i * l + j) * 3
        this.pos[k] = pts[i].x + lat.x * c + su.x * s; this.pos[k + 1] = pts[i].y + lat.y * c + su.y * s; this.pos[k + 2] = pts[i].z + lat.z * c + su.z * s
      }
    }
    this.geo.attributes.position.needsUpdate = true
    this.geo.computeBoundingBox(); this.geo.computeBoundingSphere()
  }
}

const matTubo = (C, extra = {}) => new THREE.MeshStandardMaterial({
  vertexColors: true, flatShading: true, roughness: 0.72, metalness: 0, side: THREE.DoubleSide,
  emissive: C.emissivo, emissiveIntensity: C.emissivoInt, ...extra,
})

/** Il colore di un vertice del corpo: scaglie a scacchiera sul dorso, pancia chiara a placche (larga sul petto e sul collo). */
function coloreCorpo (C, anchor) {
  const cc = col(C.corpo), cs = col(C.scaglie), cp = col(C.pancia), t = new THREE.Color()
  const soglia = profilo([[0, 0.8], [anchor.anca, 0.72], [anchor.petto - 0.05, 0.5], [anchor.petto, 0.4], [anchor.collo + 0.05, 0.5], [1, 0.62]])
  return (u, ang, i, j) => {
    const s = Math.sin(ang), ventre = -s
    const caso = ((Math.sin(i * 12.9898 + j * 78.233) * 43758.5453) % 1 + 1) % 1
    const sc = ((i + j) & 1 ? 0.2 : 0) + liscio(0.2, 1, s) * 0.55 + caso * 0.1
    const dorso = C.luce ? cc.clone().lerp(col(C.luce), liscio(0.2, 1, s) * 0.55).lerp(cs, ((i + j) & 1 ? 0.35 : 0)) : cc.clone().lerp(cs, Math.min(1, sc))
    const m = liscio(soglia(u), soglia(u) + 0.28, ventre)
    const placca = cp.clone().lerp(cc, (i & 1) * 0.1 + (1 - m) * 0.0 + caso * 0.05)
    return dorso.clone().lerp(placca, m)
  }
}

/** Un ramo del palco, una zampa, un baffo: un tubo statico lungo una spline. */
function ramo (g, punti, r0, r1, mat, fnCol, anelli = 7, lati = 5) {
  const curva = new THREE.CatmullRomCurve3(punti.map(p => V(...p)))
  const t = new Tubo(anelli, lati, mat, fnCol); t.aggiorna(curva, u => mix(r0, r1, u)); g.add(t.mesh)
  return t
}

const coneGeo = new THREE.ConeGeometry(1, 1, 5, 1, true)
/** Una spina/frangia: cono aperto, base in `a`, punta nella direzione `d` lunga `h`. */
function spina (g, mat) {
  const m = new THREE.Mesh(coneGeo, mat); m.castShadow = true; m.frustumCulled = false; g.add(m); return m
}
function orientaSpina (m, base, dir, h, w) {
  m.scale.set(w, h, w * 0.7); m.position.copy(base).addScaledVector(dir, h / 2); m.quaternion.setFromUnitVectors(SU, dir)
}
const unCono = (g, a, b, r, mat, seg = 5) => {
  const A = V(...a), B = V(...b), d = B.clone().sub(A), h = d.length()
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg, 1, true), mat); m.castShadow = true
  m.position.copy(A).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(SU, d.normalize()); g.add(m); return m
}

// ── le ali: pose per direzioni (ossa a lunghezza fissa, dita spezzate all'indietro), membrana ricalcolata a ogni fotogramma ──
const ALA = {
  L1: 1.6, L2: 1.9, LF: [2.3, 3.0, 3.0, 2.5], SP: 0.58,
  alta: {
    d1: [0.38, 0.9, -0.2], d2: [0.9, 0.2, 0.3],
    a: [[0.75, 0.7, 0.25], [0.8, 0.25, -0.25], [0.6, -0.2, -0.65], [0.3, -0.4, -0.85]],
    b: [[0.7, -0.25, -0.1], [0.55, -0.6, -0.45], [0.35, -0.75, -0.6], [0.15, -0.7, -0.75]],
  },
  bassa: {
    d1: [0.7, 0.45, -0.3], d2: [0.9, -0.1, 0.3],
    a: [[0.85, 0.0, -0.1], [0.8, -0.25, -0.25], [0.6, -0.45, -0.4], [0.35, -0.55, -0.6]],
    b: [[0.5, -0.7, -0.45], [0.35, -0.85, -0.4], [0.2, -0.9, -0.4], [0.05, -0.85, -0.5]],
  },
  B: V(0.5, -0.6, -1.7),
}
const dirMix = (a, b, p) => V(mix(a[0], b[0], p), mix(a[1], b[1], p), mix(a[2], b[2], p)).normalize()

function creaAla (C, mats) {
  const g = new THREE.Group()
  const S = V(0, 0, 0), E = new THREE.Vector3(), W = new THREE.Vector3()
  const J = [0, 1, 2, 3].map(() => new THREE.Vector3()), T = [0, 1, 2, 3].map(() => new THREE.Vector3())
  const osso = (r1, r2, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, 1, 6, 1, true), mat); m.castShadow = true; m.frustumCulled = false; g.add(m); return m }
  const posa = (m, a, b) => { const d = b.clone().sub(a), h = d.length(); m.position.copy(a).addScaledVector(d, 0.5); m.scale.set(1, h, 1); m.quaternion.setFromUnitVectors(SU, d.normalize()) }
  const bOmero = osso(0.2, 0.15, mats.corpo), bAvamb = osso(0.15, 0.1, mats.corpo)
  const rd = [0.085, 0.075, 0.066, 0.058]
  const dita1 = rd.map(r => osso(r, r * 0.55, mats.ossaAla)), dita2 = rd.map(r => osso(r * 0.55, 0.012, mats.ossaAla))
  const giunti = [sfera(g, 0.23, mats.corpo, 0, 0, 0, 1, 1, 1, 6), sfera(g, 0.18, mats.corpo, 0, 0, 0, 1, 1, 1, 6), sfera(g, 0.15, mats.scure, 0, 0, 0, 1, 1, 1, 6)]
  const artiglio = unCono(g, [0, 0, 0], [0.12, 0.26, 0.24], 0.06, mats.artigli, 5)
  // la membrana: quattro spicchi fra le dita (e fra l'ultimo e il corpo), appesa, bordo scalloppato profondo, vene scure
  const NK = 10, RR = [0, 0.3, 0.58, 0.8, 1], NR = RR.length - 1, spicchi = 4, vSp = (NK + 1) * (NR + 1)
  const nv = spicchi * vSp + 4
  const pos = new Float32Array(nv * 3), colori = new Float32Array(nv * 3), idx = []
  const cMem = col(C.membrana), cScura = cMem.clone().multiplyScalar(0.45), cBordo = col(C.bordo), cVena = col(C.scaglie).multiplyScalar(0.55), t = new THREE.Color()
  for (let s = 0; s < spicchi; s++) for (let k = 0; k <= NK; k++) for (let r = 0; r <= NR; r++) {
    const f = RR[r], v = s * vSp + k * (NR + 1) + r
    t.copy(cScura).lerp(cMem, liscio(0.0, 0.55, f)); t.lerp(cBordo, liscio(0.82, 1.0, f) * 0.7)
    const vena = (k === 0 || k === NK) ? 0.9 : (k === NK / 2 ? 0.75 : (k === NK / 4 || k === NK * 3 / 4 ? 0.3 : 0))
    if (vena) t.lerp(cVena, vena * (1 - f * 0.1))
    colori.set([t.r, t.g, t.b], v * 3)
    if (k < NK && r < NR) { const a = v, b = v + (NR + 1), c = v + 1, d = v + (NR + 1) + 1; idx.push(a, b, c, c, b, d) }
  }
  const q = spicchi * vSp; cScura.toArray(colori, q * 3); cScura.toArray(colori, (q + 1) * 3); cMem.clone().multiplyScalar(0.7).toArray(colori, (q + 2) * 3); cScura.toArray(colori, (q + 3) * 3)
  idx.push(q, q + 1, q + 2, q, q + 2, q + 3)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(colori, 3)); geo.setIndex(idx)
  const membrana = new THREE.Mesh(geo, mats.membrana); membrana.castShadow = true; membrana.frustumCulled = false; g.add(membrana)
  const tmp = V(0, 0, 0), pa = V(0, 0, 0), pb = V(0, 0, 0)
  const sulDito = (i, r, out) => i > 3 ? out.copy(W).lerp(ALA.B, r) : (r <= ALA.SP ? out.copy(W).lerp(J[i], r / ALA.SP) : out.copy(J[i]).lerp(T[i], (r - ALA.SP) / (1 - ALA.SP)))
  g.userData.imposta = (p) => {
    const d1 = dirMix(ALA.alta.d1, ALA.bassa.d1, p), d2 = dirMix(ALA.alta.d2, ALA.bassa.d2, p)
    E.copy(S).addScaledVector(d1, ALA.L1); W.copy(E).addScaledVector(d2, ALA.L2)
    for (let i = 0; i < 4; i++) {
      J[i].copy(W).addScaledVector(dirMix(ALA.alta.a[i], ALA.bassa.a[i], p), ALA.LF[i] * ALA.SP)
      T[i].copy(J[i]).addScaledVector(dirMix(ALA.alta.b[i], ALA.bassa.b[i], p), ALA.LF[i] * (1 - ALA.SP))
    }
    posa(bOmero, S, E); posa(bAvamb, E, W)
    for (let i = 0; i < 4; i++) { posa(dita1[i], W, J[i]); posa(dita2[i], J[i], T[i]) }
    giunti[0].position.copy(S); giunti[1].position.copy(E); giunti[2].position.copy(W)
    artiglio.position.copy(W).add(tmp.set(0.06, 0.12, 0.12))
    for (let s = 0; s < spicchi; s++) {
      for (let k = 0; k <= NK; k++) {
        const u = k / NK, scal = 4 * u * (1 - u)
        for (let r = 0; r <= NR; r++) {
          const f = RR[r]; sulDito(s, f, pa); sulDito(s + 1, f, pb)
          pa.lerp(pb, u)
          const pull = 0.4 * scal * Math.pow(f, 2.4)
          pa.x += (W.x - pa.x) * pull; pa.y += (W.y - pa.y) * pull - 0.22 * scal * f * f; pa.z += (W.z - pa.z) * pull
          const v = (s * vSp + k * (NR + 1) + r) * 3
          pos[v] = pa.x; pos[v + 1] = pa.y; pos[v + 2] = pa.z
        }
      }
    }
    const B = ALA.B
    pos.set([W.x, W.y, W.z, B.x, B.y, B.z, S.x, S.y, S.z, E.x, E.y, E.z], q * 3)
    geo.attributes.position.needsUpdate = true; geo.computeBoundingBox(); geo.computeBoundingSphere()
  }
  g.userData.imposta(0)
  return g
}

// ══════════════════════════════════════ IL DRAGO GRANDE ══════════════════════════════════════
export function creaDragoGrande (colore = 'verde') {
  const C = COLORI[colore] ?? COLORI.verde
  const g = new THREE.Group()
  const pal = PALETTE_FIAMMA[C.fiamma]
  const emi = { emissive: C.emissivo, emissiveIntensity: C.emissivoInt }
  const mats = {
    corpo: M(C.corpo, emi), scure: M(C.scaglie, emi), corno: M(C.corna, { roughness: 0.5, ...emi }), frange: M(C.frange, { side: THREE.DoubleSide, roughness: 0.6, emissive: C.frange, emissiveIntensity: C.traslucida || colore === 'nero' ? 0.45 : 0.12 }),
    cornoV: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.5, side: THREE.DoubleSide, ...emi }),
    frangeV: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.6, side: THREE.DoubleSide, emissive: C.frange, emissiveIntensity: 0.15 }),
    artigli: M(C.artigli, { roughness: 0.45 }), buio: M(0x1b0f12, { roughness: 0.6 }), dente: M(0xf6f0de, { roughness: 0.4 }),
    ossaAla: M(col(C.scaglie).lerp(col(C.corpo), 0.35).getHex(), emi),
    occhio: M(C.occhi, { emissive: C.occhi, emissiveIntensity: colore === 'nero' ? 2.2 : 1.2, flatShading: false }),
    membrana: new THREE.MeshStandardMaterial({
      vertexColors: true, side: THREE.DoubleSide, flatShading: true, roughness: 0.62,
      emissive: C.traslucida ? 0xffb830 : col(C.membrana).multiplyScalar(0.3).getHex(), emissiveIntensity: C.traslucida ? 0.95 : 0.5,
      transparent: C.traslucida, opacity: C.traslucida ? 0.78 : 1, depthWrite: !C.traslucida,
    }),
  }

  // ── il corpo: un'unica curva dalla punta della coda alla nuca ──
  const base = [
    [-0.7, 0.62, -5.6], [0.3, 0.34, -4.6], [0.55, 0.26, -3.6], [0.05, 0.32, -2.6], [-0.35, 0.62, -1.7], [-0.1, 1.0, -1.0], // coda
    [0, 1.32, -0.4], [0, 1.4, 0.15], [0, 1.62, 0.65],                                                                     // anche, ventre, petto
    [0, 1.98, 0.95], [0, 2.42, 1.05], [0, 2.85, 0.95], [0, 3.2, 0.93], [0, 3.52, 1.08],                                  // il collo a S
  ]
  const IA = 6, IP = 8, IC = 9
  let tot = 0; const cum = [0]; for (let i = 1; i < base.length; i++) { tot += V(...base[i]).distanceTo(V(...base[i - 1])); cum.push(tot) }
  const anchor = { anca: cum[IA] / tot, petto: cum[IP] / tot, collo: cum[IC] / tot }
  const curva = new THREE.CatmullRomCurve3(base.map(p => V(...p)), false, 'centripetal')
  const respiro = { v: 0 }, gonfia = { v: 0 }
  const rad = profilo([[0, 0.03], [anchor.anca * 0.45, 0.11], [anchor.anca * 0.8, 0.34], [anchor.anca, 0.6], [mix(anchor.anca, anchor.petto, 0.5), 0.74], [anchor.petto, 0.74], [anchor.collo, 0.5], [mix(anchor.collo, 1, 0.5), 0.32], [1, 0.22]])
  const raggio = u => rad(u) * (1 + (respiro.v * 0.085 + gonfia.v * 0.22) * liscio(anchor.anca, anchor.petto, u) * (1 - liscio(anchor.petto, anchor.collo + 0.05, u)))
  const larg = profilo([[0, 1], [anchor.anca, 1.05], [anchor.petto, 1.0], [anchor.collo, 0.85], [1, 0.85]])
  const asp = profilo([[0, 1], [anchor.anca, 1.05], [anchor.petto, 1.22], [anchor.collo, 1.0], [1, 1]])
  const corpo = new Tubo(84, 12, matTubo(C), coloreCorpo(C, anchor))
  g.add(corpo.mesh)
  const NC = corpo.n

  // spine e frange sul dorso: coda piccole, schiena medie, spalle un ciuffo grande, collo una criniera che cala
  const spine = []
  const aggiungi = (u, h, w, lat = 0, tilt = 0.55, m = mats.frange) => spine.push({ i: Math.round(u * (NC - 1)), h, w, lat, tilt, m: spina(g, m) })
  for (let u = 0.1; u < anchor.anca; u += 0.035) aggiungi(u, 0.1 + 0.16 * (u / anchor.anca), 0.045)
  for (let u = anchor.anca; u < anchor.petto - 0.02; u += 0.03) aggiungi(u, 0.26, 0.06)
  for (let u = anchor.petto - 0.02; u < anchor.collo + 0.02; u += 0.02) { aggiungi(u, 0.5 - Math.abs(u - (anchor.petto + 0.01)) * 5, 0.07); aggiungi(u, 0.34, 0.055, 0.8, 0.9); aggiungi(u, 0.34, 0.055, -0.8, 0.9) }
  for (let u = anchor.collo + 0.03; u < 0.97; u += 0.03) aggiungi(u, 0.3 - (u - anchor.collo) * 0.4, 0.055, 0, 0.7)

  // la punta della coda a freccia
  const freccia = new THREE.Group(); g.add(freccia)
  { const f = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.62, 4), mats.frange); f.position.y = 0.3; f.scale.z = 0.22; f.castShadow = true; freccia.add(f)
    for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38, 4), mats.frange); b.position.set(s * 0.13, 0.08, 0); b.rotation.z = s * -0.85; b.scale.z = 0.22; freccia.add(b) } }

  // ── zampe: tubi muscolosi a 4 segmenti con le dita e gli artigli chiari ──
  const fnZampa = (u, ang, i, j) => col(C.corpo).lerp(col(C.scaglie), ((i + j) & 1 ? 0.2 : 0) + liscio(0.1, 1, Math.sin(ang)) * 0.4 + (u > 0.8 ? 0.15 : 0))
  const matZ = matTubo(C)
  const zampe = []
  const zampa = (s, davanti) => {
    const pt = davanti
      ? [[0.5, 1.6, 0.5], [0.62, 1.2, 0.2], [0.6, 0.92, 0.05], [0.56, 0.62, 0.45], [0.52, 0.3, 0.78], [0.5, 0.09, 0.9]]
      : [[0.52, 1.4, -0.5], [0.7, 1.05, -0.1], [0.68, 0.85, 0.16], [0.6, 0.6, -0.5], [0.56, 0.4, -0.72], [0.54, 0.2, -0.5], [0.52, 0.08, -0.3]]
    const rr = davanti ? profilo([[0, 0.38], [0.3, 0.3], [0.55, 0.19], [0.8, 0.14], [1, 0.12]]) : profilo([[0, 0.52], [0.22, 0.44], [0.4, 0.2], [0.65, 0.13], [1, 0.11]])
    const gz = new THREE.Group(); gz.scale.x = s; g.add(gz)
    ramo(gz, pt, 0, 0, matZ, fnZampa, davanti ? 11 : 13, 7).aggiorna(new THREE.CatmullRomCurve3(pt.map(p => V(...p))), rr)
    const ultimo = pt.at(-1)
    // coscia/spalla tonde, ginocchio e polso a nodo
    sfera(gz, davanti ? 0.34 : 0.46, mats.corpo, davanti ? 0.42 : 0.46, davanti ? 1.52 : 1.28, davanti ? 0.46 : -0.46, 0.75, 1.15, 1.3, 10)
    sfera(gz, 0.1, mats.scure, pt[davanti ? 2 : 2][0], pt[davanti ? 2 : 2][1], pt[davanti ? 2 : 2][2] + (davanti ? -0.05 : 0.1), 1.2, 1.2, 1.2, 7)
    // quattro dita (tre avanti e uno di sprone), ognuna con l'artiglio
    for (let k = -1; k <= 1; k++) {
      const x0 = ultimo[0] + k * 0.085, z0 = ultimo[2] + 0.04, ll = davanti ? 0.34 : 0.4
      unCono(gz, [x0, 0.1, z0], [x0 + k * 0.05, 0.04, z0 + ll * 0.7], 0.06, mats.corpo, 6)
      unCono(gz, [x0 + k * 0.035, 0.05, z0 + ll * 0.55], [x0 + k * 0.06, 0.0, z0 + ll + 0.1], 0.04, mats.artigli, 5)
    }
    unCono(gz, [ultimo[0], 0.2, ultimo[2] - 0.08], [ultimo[0], 0.1, ultimo[2] - 0.34], 0.05, mats.artigli, 5)
    sfera(gz, 0.12, mats.scure, ultimo[0], 0.1, ultimo[2] + 0.02, 1.1, 0.55, 1.4, 8)
    if (davanti) for (let k = 0; k < 4; k++) unCono(gz, [pt[2][0] + 0.05, pt[2][1] + 0.1 - k * 0.05, pt[2][2] - 0.1], [pt[2][0] + 0.14, pt[2][1] + 0.25 - k * 0.1, pt[2][2] - 0.38], 0.035, mats.frange, 4)   // il ciuffo rosso al gomito
    zampe.push(gz)
  }
  for (const s of [-1, 1]) { zampa(s, true); zampa(s, false) }

  // ── le ali, attaccate al garrese ──
  const ali = []
  for (const s of [-1, 1]) {
    const radice = new THREE.Group(); radice.position.set(s * 0.36, 2.05, 0.4); radice.scale.set(s * 0.92, 0.92, 0.92); g.add(radice)
    const a = creaAla(C, mats); radice.add(a); ali.push({ radice, a })
    sfera(radice, 0.3, mats.corpo, 0, -0.1, -0.05, 1, 1, 1.3, 9)       // il muscolo della spalla
  }

  // ── la testa: piccola, allungata, nobile; le corna a palco; la mascella e la fiamma ──
  const testa = perno(g, 0, 3.6, 1.2); testa.scale.setScalar(2.0)
  const fnTesta = (u, ang, i, j) => { const ventre = -Math.sin(ang); return col(C.corpo).lerp(col(C.scaglie), ((i + j) & 1 ? 0.18 : 0) + liscio(0.2, 1, Math.sin(ang)) * 0.4).lerp(col(C.pancia), liscio(0.55, 0.9, ventre) * 0.8) }
  const spineT = [[0, 0.0, -0.2], [0, 0.01, 0.0], [0, 0.0, 0.2], [0, -0.03, 0.38], [0, -0.05, 0.55], [0, -0.06, 0.7]]
  const sagomaT = profilo([[0, 0.12], [0.18, 0.19], [0.38, 0.17], [0.58, 0.125], [0.82, 0.1], [1, 0.09]])
  const cranio = new Tubo(12, 10, matTubo(C), fnTesta); testa.add(cranio.mesh)
  cranio.aggiorna(new THREE.CatmullRomCurve3(spineT.map(p => V(...p))), sagomaT, u => 0.95, u => mix(1.0, 0.74, u))
  sfera(testa, 0.056, mats.corpo, 0, -0.07, 0.73, 1, 0.8, 1.1, 8)                                  // la punta del muso
  const mascella = perno(testa, 0, -0.07, 0.0)
  const jaw = new Tubo(9, 8, matTubo(C), (u, ang) => col(C.pancia).lerp(col(C.corpo), liscio(0.0, 0.8, Math.sin(ang)) * 0.6))
  mascella.add(jaw.mesh)
  jaw.aggiorna(new THREE.CatmullRomCurve3([V(0, -0.0, -0.02), V(0, -0.03, 0.2), V(0, -0.05, 0.45), V(0, -0.05, 0.64)]), u => mix(0.09, 0.05, u), u => 0.95, u => 0.62)
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) unCono(testa, [s * 0.052, -0.085, 0.28 + k * 0.1], [s * 0.05, -0.15 - (k % 2) * 0.01, 0.29 + k * 0.1], 0.013, mats.dente, 4)     // denti di sopra
    for (let k = 0; k < 4; k++) unCono(mascella, [s * 0.04, 0.0, 0.25 + k * 0.1], [s * 0.04, 0.06, 0.27 + k * 0.1], 0.011, mats.dente, 4)
    const occhio = perno(testa, s * 0.128, 0.06, 0.13)
    sfera(occhio, 0.043, mats.occhio, 0, 0, 0, 0.75, 1, 1, 10)
    sfera(occhio, 0.02, mats.buio, s * 0.012, 0, 0.034, 0.4, 1.5, 0.5, 6)                         // la pupilla a fessura
    testa.userData[s < 0 ? 'occhioS' : 'occhioD'] = occhio
    rozza(testa, 0.06, mats.scure, s * 0.12, 0.125, 0.14, 1.1, 0.4, 2.0, 1).rotation.z = s * -0.3   // l'arcata del sopracciglio
    sfera(testa, 0.04, mats.corpo, s * 0.055, -0.035, 0.64, 1, 0.8, 1.2, 6); sfera(testa, 0.016, mats.buio, s * 0.05, -0.03, 0.72, 1, 1, 1, 5)
    for (let k = 0; k < 3; k++) unCono(testa, [s * 0.15, -0.05 - k * 0.03, 0.0], [s * (0.34 + k * 0.05), -0.12 - k * 0.04, -0.18 - k * 0.05], 0.04, mats.corno, 4)                            // le narici
    rozza(testa, 0.09, mats.scure, s * 0.15, -0.02, 0.0, 0.55, 0.9, 1.3, 1)                  // la guancia
    // le frange rosse dietro la mandibola
    for (let k = 0; k < 5; k++) unCono(testa, [s * 0.1, -0.03 - k * 0.012, -0.06], [s * (0.26 + k * 0.03), 0.0 - k * 0.075, -0.3 - k * 0.05], 0.028, mats.frange, 4)
    // i baffi
    ramo(testa, [[s * 0.045, -0.07, 0.6], [s * 0.2, -0.13, 0.46], [s * 0.38, -0.27, 0.34], [s * 0.5, -0.5, 0.3]], 0.011, 0.004, mats.frangeV, () => col(C.frange), 8, 4)
  }
  // il palco: un ramo maestro che si piega all'indietro e in dentro, con punte che si biforcano
  const fnCorno = (u) => col(C.corna).multiplyScalar(0.72).lerp(col(C.corna), liscio(0, 1, u))
  const palco = (s) => {
    const p = (x, y, z) => [s * x, y, z], m = mats.cornoV
    const maestro = [p(0.06, 0.1, -0.06), p(0.14, 0.3, -0.16), p(0.25, 0.52, -0.26), p(0.31, 0.76, -0.24), p(0.27, 1.0, -0.12), p(0.19, 1.16, 0.0)]
    ramo(testa, maestro, 0.062, 0.01, m, fnCorno, 12, 6)
    ramo(testa, [p(0.14, 0.3, -0.16), p(0.1, 0.42, -0.36), p(0.06, 0.62, -0.5)], 0.038, 0.008, m, fnCorno, 7, 5)
    ramo(testa, [p(0.25, 0.52, -0.26), p(0.38, 0.64, -0.14), p(0.44, 0.86, -0.08), p(0.42, 1.02, 0.02)], 0.042, 0.008, m, fnCorno, 8, 5)
    ramo(testa, [p(0.44, 0.86, -0.08), p(0.55, 0.97, -0.1), p(0.6, 1.12, -0.06)], 0.026, 0.006, m, fnCorno, 6, 4)
    ramo(testa, [p(0.31, 0.76, -0.24), p(0.2, 0.92, -0.3), p(0.14, 1.1, -0.28)], 0.034, 0.007, m, fnCorno, 7, 5)
    ramo(testa, [p(0.27, 1.0, -0.12), p(0.36, 1.12, -0.04), p(0.42, 1.28, 0.0)], 0.024, 0.006, m, fnCorno, 6, 4)
    ramo(testa, [p(0.1, 0.42, -0.36), p(0.22, 0.52, -0.5), p(0.3, 0.66, -0.58)], 0.022, 0.006, m, fnCorno, 6, 4)
    ramo(testa, [p(0.1, 0.12, 0.18), p(0.16, 0.26, 0.28), p(0.14, 0.4, 0.34)], 0.034, 0.007, m, fnCorno, 6, 5)       // il corno sopra l'occhio
    ramo(testa, [p(0.12, 0.0, -0.1), p(0.27, -0.02, -0.2), p(0.38, 0.06, -0.3)], 0.038, 0.008, m, fnCorno, 6, 5)     // il corno di guancia
  }
  palco(1); palco(-1)
  for (let k = 0; k < 4; k++) unCono(testa, [0, 0.1 - k * 0.0, -0.06 - k * 0.05], [0, 0.26 - k * 0.03, -0.14 - k * 0.1], 0.03, mats.frange, 4)   // il ciuffo sulla nuca
  // il bagliore nella gola e la fiammata
  const gola = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: pal.gola, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); gola.position.set(0, -0.05, 0.45); gola.scale.set(1, 0.6, 3.4); testa.add(gola)
  const fiamma = creaFiamma(pal, 2.4); fiamma.position.set(0, -0.1, 0.7); fiamma.rotation.x = -0.12; testa.add(fiamma)
  const colloGiunto = sfera(g, 0.2, mats.corpo, 0, 3.55, 1.1, 0.9, 1, 1.05, 8)

  // ── l'animazione: posa(t, mod) calcola tutto; `mod` sono gli scarti dell'attacco (vedi ATTACCHI sotto) ──
  const bocca = new THREE.Object3D(); bocca.position.copy(fiamma.position); testa.add(bocca)      // dove nasce il proiettile
  const NIENTE = () => ({ zc: 0, yc: 0, xc: 0, gonfia: 0, tp: 0, ty: 0, apri: 0, fuoco: 0, lungh: null, gola: 0, ala: { p: [0, 0], ry: [0, 0], rz: [0, 0] }, coda: null })
  let soffioForzato = null, ultimoT = 0
  const tmpP = V(0, 0, 0), dir = V(0, 0, 0)
  g.userData.sbuffa = p => { soffioForzato = p }
  g.userData.soffioAutomatico = true
  g.userData.testaPos = () => testa.getWorldPosition(new THREE.Vector3())
  // il fumo e le braci dalle narici: poche palline, tutte in funzione di t
  const fumo = []
  for (const s of [-1, 1]) for (let i = 0; i < 2; i++) {
    const brace = i === 1
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 5, 4), brace ? new THREE.MeshBasicMaterial({ color: 0xffa030, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }) : new THREE.MeshBasicMaterial({ color: 0xc4c8d0, transparent: true, opacity: 0.5, depthWrite: false }))
    m.frustumCulled = false; m.visible = false; testa.add(m); fumo.push({ m, s, i, brace })
  }
  const posa = (t0, mod) => {
    const t = t0 + (g.userData.fase ?? 0)
    // finestra(periodo, a, b): una campana 0→1→0 fra a e b secondi di ogni periodo (gli eventi dell'idle: deterministici in t)
    const finestra = (periodo, a, b) => { const c = t % periodo; return c < a || c > b ? 0 : Math.sin(Math.PI * (c - a) / (b - a)) }
    const annusa = finestra(8, 1.2, 2.6), sbuffo = finestra(9, 2.0, 4.0), frusta = (t % 11 - 1.5) / 0.9
    const r = onda(t, 1.9); respiro.v = r; gonfia.v = mod.gonfia
    const ciclo = (t % 7.5) / 7.5, auto = g.userData.soffioAutomatico ? liscio(0.56, 0.62, ciclo) * (1 - liscio(0.84, 0.92, ciclo)) : 0
    const sb = soffioForzato ?? auto
    for (let k = 0; k < base.length; k++) {
      const [x, y, z] = base[k]
      let dx = 0, dy = 0, dz = 0
      if (k <= IA) { const w = (1 - k / IA); dx = onda(t, 0.9, -k * 0.85) * (0.1 + w * w * 0.5); dy = onda(t, 1.3, -k * 0.7) * 0.03 * w; if (frusta > 0 && frusta < 1) { const v = profilo([[0, 0], [0.3, -1], [0.45, -1], [0.62, 1.2], [0.85, 0], [1, 0]])(Math.max(0, frusta - w * 0.1)); dx += v * 1.5 * Math.pow(w, 1.2); dy += Math.abs(v) * 0.05 * w } if (mod.coda) { const c = mod.coda(k); dx += c[0]; dy += c[1] } }
      else if (k >= IC) {
        const w = (k - IC + 1) / (base.length - IC)
        dx = (onda(t, 0.42, -w * 1.2) * 0.3 + onda(t, 0.97, w) * 0.07) * w + mod.xc * w * w; dz = onda(t, 0.8, -w * 1.2) * 0.07 * w - sb * 0.22 * w * w + mod.zc * w * w + annusa * 0.2 * w * w; dy = sb * 0.1 * w + onda(t, 1.9) * 0.025 * w + annusa * 0.1 * w * w + mod.yc * w * w
      } else { dy = r * 0.03; dx = onda(t, 0.35, k) * 0.05; if (k >= IP) { const w = (k - IP + 1) / (IC - IP + 1) * 0.3; dz += mod.zc * w; dy += mod.yc * w } }
      curva.points[k].set(x + dx, y + dy, z + dz)
    }
    corpo.aggiorna(curva, raggio, larg, asp)
    for (const s of spine) {
      const i = s.i, T = corpo.tang[i], su = corpo.su[i], la = corpo.lat[i]
      tmpP.copy(corpo.centri[i]).addScaledVector(su, corpo.ry[i] * 0.92).addScaledVector(la, corpo.rx[i] * s.lat * 0.55)
      dir.copy(su).multiplyScalar(Math.cos(s.tilt)).addScaledVector(T, -Math.sin(s.tilt) * 0.8).addScaledVector(la, s.lat * 0.5).normalize()
      orientaSpina(s.m, tmpP, dir, s.h * (1 + onda(t, 2.2, i * 0.4) * 0.04), s.w)
    }
    { const T = corpo.tang[0], P = corpo.centri[0]; dir.copy(T).multiplyScalar(-1).add(V(0, 0.15, 0)).normalize()
      freccia.position.copy(P).addScaledVector(dir, 0.04); freccia.quaternion.setFromUnitVectors(SU, dir) }
    const fine = corpo.centri[NC - 1], Tf = corpo.tang[NC - 1]
    testa.position.set(fine.x + Tf.x * 0.05, fine.y + 0.1, fine.z + 0.16)
    colloGiunto.position.set(fine.x, fine.y + 0.04, fine.z + 0.05)
    testa.rotation.set(0.3 - sb * 0.55 + onda(t, 1.2) * 0.04 - annusa * 0.24 + Math.sin(t * 16) * 0.04 * annusa + mod.tp, onda(t, 0.37) * 0.34 + onda(t, 0.93, 2) * 0.08 + mod.ty, onda(t, 0.8) * 0.07 * (1 - sb))
    mascella.rotation.x = sb * 0.5 + 0.03 + onda(t, 1.7) * 0.012 + 0.13 * sbuffo + mod.apri
    for (const f of fumo) {                                     // il filo di fumo (e una brace) dalle narici
      const u = ((t % 9) - 2.0 - f.i * 0.45 - (f.s > 0 ? 0 : 0.2)) / 1.1, vivo = sbuffo > 0 && u > 0 && u < 1
      f.m.visible = vivo
      if (vivo) { f.m.position.set(f.s * (0.05 + 0.04 * u), -0.03 + 0.2 * u, 0.74 + 0.16 * u + 0.05 * Math.sin(u * 6 + f.s)); f.m.scale.setScalar(f.brace ? 0.012 * (1 - u) : 0.03 * (0.6 + 1.6 * u) * (1 - 0.5 * u)) }
    }
    const luceGola = Math.max(sb > 0.12 ? 1 : 0, mod.gola)
    gola.visible = luceGola > 0.1; gola.scale.set(1, 0.6, 3.4 * (0.5 + 0.5 * luceGola) * (0.8 + onda(t, 30) * 0.15))
    const fuoco = Math.max(sb, mod.fuoco)
    fiamma.userData.aggiorna(fuoco, t, mod.lungh ?? 2.4)
    const sbat = Math.max(0, 1 - Math.abs(((t + 0.7) % 4.3) - 0.1) * 11, 1 - Math.abs(((t + 0.7) % 4.3) - 0.45) * 11)
    for (const o of [testa.userData.occhioS, testa.userData.occhioD]) o.scale.y = Math.max(0.08, 1 - sbat * 0.92)
    const c = (t % 13) - 9.5, sbattuta = g.userData.soffioAutomatico && c > 0 && c < 2.6 ? 0.5 - 0.5 * Math.cos((c / 2.6) * Math.PI * 4) : 0
    const cl = (t % 6.5 - 0.8) / 2, colpoLento = cl > 0 && cl < 1 ? 0.5 - 0.5 * Math.cos(cl * Math.PI * 2) : 0       // un colpo d'ala lento ogni tanto
    const frullo = Math.sin(t * 21) * 0.025 * finestra(9, 5.5, 7.5) + Math.sin(t * 5.3) * 0.01                    // un leggero frullo di tensione
    const riposo = 0.1 + 0.07 * onda(t, 0.8) + 0.04 * r
    const p = Math.min(1, riposo + sbattuta * 0.88 + colpoLento * 0.5 + frullo)
    ali.forEach(({ radice, a }, i) => {
      a.userData.imposta(Math.min(1, Math.max(0, p + mod.ala.p[i])))
      radice.rotation.z = sbattuta * 0.12 - 0.04 + 0.04 * r + colpoLento * 0.08 + mod.ala.rz[i]; radice.rotation.y = onda(t, 0.7) * 0.02 - 0.06 + mod.ala.ry[i]
      radice.position.y = 2.05 + r * 0.012
    })
    g.position.y = sbattuta * 0.07
    zampe.forEach((z, i) => {            // il peso passa da una zampa all'altra; la destra davanti raspa ogni tanto
      const peso = Math.pow(Math.max(0, onda(t, 1.1, i * 1.57)), 4) * 0.05, raspa = i === 2 ? finestra(12, 0.6, 1.8) : 0
      z.position.y = peso + raspa * 0.05; z.position.z = Math.sin(t * 13) * 0.05 * raspa
    })
  }
  g.userData.anima = (t) => { ultimoT = t; posa(t, NIENTE()) }

  // ── il repertorio d'attacco: ogni variante è una funzione pura di p ∈ [0,1] (a p=0 e p=1 scarto zero = posa idle) ──
  const D_SOFFIO = 0.9
  const ATTACCHI = {
    soffio: (p, ctx) => {
      const ant = profilo([[0, 0], [0.32, 1], [0.4, 0.9], [0.5, 0], [1, 0]])(p), att = profilo([[0, 0], [0.34, 0], [0.44, 1], [0.78, 1], [0.95, 0], [1, 0]])(p)
      const m = NIENTE()
      m.zc = -0.45 * ant + 0.55 * att; m.yc = 0.22 * ant - 0.15 * att; m.tp = -0.45 * ant + 0.25 * att; m.apri = 0.2 * ant + 0.55 * att
      m.gonfia = ant + 0.25 * att; m.gola = Math.max(ant, att)
      m.fuoco = profilo([[0, 0], [0.4, 0], [0.5, 1], [0.82, 1], [0.96, 0], [1, 0]])(p)
      m.lungh = g.userData.soffioLungo(p, ctx.distanza)
      m.ala.rz = [-0.15 * ant, 0.15 * ant]
      return m
    },
    morso: (p) => {
      const ant = profilo([[0, 0], [0.25, 1], [0.32, 1], [0.4, 0], [1, 0]])(p), lancio = profilo([[0, 0], [0.28, 0], [0.42, 1], [0.52, 1], [0.75, 0], [1, 0]])(p)
      const m = NIENTE()
      m.zc = -0.5 * ant + 2.0 * lancio; m.yc = 0.2 * ant - 0.85 * lancio; m.tp = -0.35 * ant + 0.5 * lancio
      m.apri = 0.35 * ant + 0.8 * profilo([[0, 0], [0.3, 0], [0.42, 1], [0.46, 1], [0.56, 0], [1, 0]])(p)
      return m
    },
    ala: (p) => {
      const ant = profilo([[0, 0], [0.3, 1], [0.4, 1], [0.48, 0], [1, 0]])(p), col2 = profilo([[0, 0], [0.36, 0], [0.5, 1], [0.62, 1], [0.9, 0], [1, 0]])(p)
      const m = NIENTE()
      m.ala.ry = [0.2 * col2, 0.6 * ant - 1.15 * col2]; m.ala.rz = [0.05 * ant, 0.3 * ant - 0.5 * col2]; m.ala.p = [0.15 * col2, 0.75 * col2]
      m.xc = -0.25 * col2; m.ty = 0.25 * col2 - 0.1 * ant; m.tp = 0.15 * col2
      return m
    },
    coda: (p) => {
      const s = profilo([[0, 0], [0.3, -1], [0.42, -1], [0.56, 1.5], [0.72, 0.2], [0.84, 0], [1, 0]])
      const m = NIENTE()
      m.coda = k => { const u = 1 - k / IA, v = s(Math.min(1, Math.max(0, p - u * 0.12))); return [v * 4.6 * Math.pow(u, 1.2), Math.abs(v) * 0.1 * u] }
      m.ty = -0.12 * profilo([[0, 0], [0.4, 1], [0.6, 0], [1, 0]])(p)
      return m
    },
  }
  g.userData.attacchi = {
    soffio: { tipo: 'soffio', durata: D_SOFFIO, arrivo: 0.55, proiettile: { tipo: 'soffio', origine: bocca } },
    morso: { tipo: 'morso', durata: 0.6, arrivo: 0.5, proiettile: null },
    ala: { tipo: 'ala', durata: 0.8, arrivo: 0.52, proiettile: null },
    coda: { tipo: 'coda', durata: 0.9, arrivo: 0.52, proiettile: null },
  }
  g.userData.attacco = g.userData.attacchi.soffio
  /** Lunghezza locale della fiamma a progresso p perché arrivi a `distanza` (unità di mondo) dal muso; la testa è in scala 2. */
  g.userData.soffioLungo = (p, distanza = 6.5) => Math.max(0.12, distanza / testa.scale.x * profilo([[0, 0.05], [0.42, 0.05], [0.58, 1], [0.82, 1], [0.96, 0.4], [1, 0.05]])(p))
  /** Dopo `anima(t)`: sovrascrive le pose con l'attacco a progresso p. Funzione pura di p (e dell'ultimo t). */
  g.userData.attacca = (p, variante = 'soffio', ctx = {}) => {
    const f = ATTACCHI[variante] ?? ATTACCHI.soffio, q = Math.min(1, Math.max(0, p))
    posa(ultimoT, f(q, { distanza: 6.5, ...ctx }))
  }
  g.userData.anima(0)
  return g
}

/** Monta lo stesso attacco ('soffio' e 'morso') sul draghetto di mostri.js (che non si tocca): lo cerca per posizione dei perni. */
export function montaSoffio (d, { distanza = 2.8, palette = 'arancio' } = {}) {
  const trova = (x, y, z) => { let r = null; d.traverse(o => { if (!o.isMesh && Math.abs(o.position.x - x) < 0.01 && Math.abs(o.position.y - y) < 0.01 && Math.abs(o.position.z - z) < 0.01 && o.parent !== null) r = o }); return r }
  const testa = trova(0, 1.2, 0.5), mascella = testa && trova(0, -0.2, 0.3), vecchia = testa && trova(0, -0.15, 0.56), corpo = testa && testa.parent
  if (!testa || !mascella || !vecchia) throw new Error('montaSoffio: non riconosco il draghetto')
  const nuova = creaFiamma(PALETTE_FIAMMA[palette], 1.2); nuova.position.set(0, -0.17, 0.52); testa.add(nuova)
  const bocca = new THREE.Object3D(); bocca.position.copy(nuova.position); testa.add(bocca)
  const base = testa.position.clone(), animaV = d.userData.anima
  let ultimoT = 0
  d.userData.anima = (t) => { ultimoT = t; testa.position.copy(base); nuova.userData.aggiorna(0, t); animaV(t) }
  d.userData.attacchi = {
    soffio: { tipo: 'soffio', durata: D_SOFFIO_PICCOLO, arrivo: 0.55, proiettile: { tipo: 'soffio', origine: bocca } },
    morso: { tipo: 'morso', durata: 0.6, arrivo: 0.5, proiettile: null },
  }
  d.userData.attacco = d.userData.attacchi.soffio
  d.userData.soffioLungo = (p, dist = distanza) => Math.max(0.1, dist * profilo([[0, 0.05], [0.42, 0.05], [0.58, 1], [0.82, 1], [0.96, 0.4], [1, 0.05]])(p))
  d.userData.attacca = (p, variante = 'soffio', ctx = {}) => {
    const q = Math.min(1, Math.max(0, p)), dist = ctx.distanza ?? distanza
    let ant, att, apri = 0, fuoco = 0
    if (variante === 'morso') {
      ant = profilo([[0, 0], [0.25, 1], [0.32, 1], [0.4, 0], [1, 0]])(q); att = profilo([[0, 0], [0.28, 0], [0.42, 1], [0.52, 1], [0.75, 0], [1, 0]])(q)
      apri = 0.2 * ant + 0.5 * profilo([[0, 0], [0.3, 0], [0.42, 1], [0.46, 1], [0.56, 0], [1, 0]])(q)
    } else {
      ant = profilo([[0, 0], [0.32, 1], [0.4, 0.9], [0.5, 0], [1, 0]])(q); att = profilo([[0, 0], [0.34, 0], [0.44, 1], [0.78, 1], [0.95, 0], [1, 0]])(q)
      apri = 0.15 * ant + 0.5 * att; fuoco = profilo([[0, 0], [0.4, 0], [0.5, 1], [0.82, 1], [0.96, 0], [1, 0]])(q)
    }
    testa.position.set(base.x, base.y + 0.1 * ant - 0.06 * att, base.z - 0.2 * ant + (variante === 'morso' ? 0.55 : 0.28) * att)
    testa.rotation.x += -0.35 * ant + 0.2 * att; mascella.rotation.x += apri
    if (variante !== 'morso') { corpo.scale.multiplyScalar(1 + 0.12 * ant); vecchia.visible = vecchia.visible && fuoco < 0.02 }
    nuova.userData.aggiorna(fuoco, ultimoT, d.userData.soffioLungo(q, dist))
    if (fuoco > 0.02) vecchia.visible = false
  }
  return d
}
const D_SOFFIO_PICCOLO = 0.9

/** Rende vivo l'idle del draghetto di mostri.js (che non si tocca): saltelli, coda che scodinzola, ali che sbattono a raffiche, testa curiosa.
 *  Avvolge `anima`; tutto è funzione di t (+ `userData.fase`). Va bene prima o dopo `montaSoffio`. */
export function ravviva (d) {
  const trova = (x, y, z) => { let r = null; d.traverse(o => { if (!o.isMesh && Math.abs(o.position.x - x) < 0.01 && Math.abs(o.position.y - y) < 0.01 && Math.abs(o.position.z - z) < 0.01 && o.parent !== null) r = o }); return r }
  const testa = trova(0, 1.2, 0.5), coda = trova(0, 0.5, -0.55), alaS = trova(-0.3, 1.0, -0.12), alaD = trova(0.3, 1.0, -0.12), corpo = testa && testa.parent
  if (!testa || !coda || !alaS || !alaD) throw new Error('ravviva: non riconosco il draghetto')
  const animaV = d.userData.anima
  d.userData.anima = (t0) => {
    const t = t0 + (d.userData.fase ?? 0)
    animaV(t0)
    const finestra = (periodo, a, b) => { const c = t % periodo; return c < a || c > b ? 0 : Math.sin(Math.PI * (c - a) / (b - a)) }
    const c = (t % 2.6) - 1.5, u = c / 0.6, salto = u > 0 && u < 1 ? Math.sin(u * Math.PI) : 0, accucc = finestra(2.6, 1.0, 1.5)
    d.position.y = salto * 0.24
    corpo.scale.y *= 1 - 0.09 * accucc + 0.07 * salto; corpo.scale.x *= 1 + 0.05 * accucc - 0.03 * salto
    coda.rotation.y += Math.sin(t * 7.5) * (0.25 + 0.5 * finestra(5, 1, 3.6))                     // la coda scodinzola
    const raffica = finestra(4.2, 2.6, 3.8)
    alaS.rotation.z += Math.sin(t * 22) * 0.4 * raffica + Math.sin(t * 3) * 0.05; alaD.rotation.z -= Math.sin(t * 22) * 0.4 * raffica + Math.sin(t * 3) * 0.05
    testa.rotation.z += Math.sin(t * 1.3) * 0.1; testa.rotation.y += Math.sin(t * 0.8) * 0.32
  }
  return d
}

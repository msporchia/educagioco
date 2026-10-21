// Generato da strumenti/promuovi-3d.mjs da poc/effetti-3d/lancio-forme.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Le forme degli effetti di LANCIO: frecce, cristalli, rocce, falce, ascia, saette, e gli impatti che si somigliano (gelo, nube).
import {
  Group, Mesh, Color, Vector3, MeshStandardMaterial, MeshBasicMaterial, CylinderGeometry, ConeGeometry, PlaneGeometry, OctahedronGeometry, DodecahedronGeometry,
  BoxGeometry, Shape, ShapeGeometry, Float32BufferAttribute, AdditiveBlending, DoubleSide, SphereGeometry,
} from 'three'
import { sat, liscio, esce, sovra, mix, caso, hash, tex, matAdd, sprite, misura, Tubo, Particelle, impatto } from './lancio-base.js'

const std = (colore, o = {}) => new MeshStandardMaterial({ color: colore, roughness: 0.55, metalness: 0.1, ...o })

// ── frecce: asta, punta, penne; tutto lungo +z con la punta avanti ──
export function creaFreccia(k = 1, { lungh = 0.85, punta = 0xd7dde8, asta = 0xa27b4c, penna = 0xece6d6 } = {}) {
  const g = new Group(), sp = 0.014 * k
  const a = new Mesh(new CylinderGeometry(sp, sp, lungh * k, 6).rotateX(Math.PI / 2), std(asta, { roughness: 0.8 })); g.add(a)
  const p = new Mesh(new ConeGeometry(sp * 3.2, 0.15 * k, 6).rotateX(Math.PI / 2), std(punta, { metalness: 0.6, roughness: 0.3 })); p.position.z = (lungh / 2 + 0.05) * k; g.add(p)
  for (let i = 0; i < 3; i++) {
    const f = new Mesh(new PlaneGeometry(0.13 * k, 0.05 * k).rotateY(Math.PI / 2), std(penna, { side: DoubleSide, roughness: 0.9 }))
    f.position.set(0, 0.03 * k, -(lungh / 2 - 0.08) * k)
    const holder = new Group(); holder.rotation.z = (i * Math.PI * 2) / 3; holder.add(f); g.add(holder)
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true })
  return g
}
export function creaQuadrello(k = 1) {
  const g = new Group(), sp = 0.022 * k
  g.add(new Mesh(new CylinderGeometry(sp, sp, 0.42 * k, 6).rotateX(Math.PI / 2), std(0x4b3a2a, { roughness: 0.8 })))
  const p = new Mesh(new ConeGeometry(sp * 2.6, 0.13 * k, 4).rotateX(Math.PI / 2), std(0xaeb6c6, { metalness: 0.7, roughness: 0.35 })); p.position.z = 0.27 * k; g.add(p)
  for (let i = 0; i < 2; i++) {
    const f = new Mesh(new BoxGeometry(0.004 * k, 0.07 * k, 0.1 * k), std(0x2d2a28)); f.position.z = -0.17 * k; f.rotation.z = (i * Math.PI) / 2; g.add(f)
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true })
  return g
}

// ── un cristallo di ghiaccio: ottaedro allungato, punta verso +z ──
export function cristallo(c1, c2, lung = 0.3, largo = 0.07, op = 0.92) {
  const m = new Mesh(new OctahedronGeometry(1, 0).scale(largo, largo, lung), std(c2.clone().lerp(new Color(1, 1, 1), 0.25), { emissive: c1, emissiveIntensity: 0.9, roughness: 0.12, flatShading: true, transparent: true, opacity: op }))
  m.castShadow = false; return m
}

// l'impatto del gelo: cristalli che spuntano da terra, brina sul pavimento, fiocchi
export function gelata({ pos, c1, c2, k = 1, n = 6, alt = 0.5, raggio = 0.45, seme = 3, tempo = 0.55, brina = 1 }) {
  const g = new Group(), r = caso(seme); g.position.copy(pos)
  const suoloY = 0.03 - pos.y
  const disco = new Mesh(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), matAdd(c1, tex('gelo'))); disco.position.y = suoloY; g.add(disco)
  const alone = sprite(c2, 'alone', 1); g.add(alone)
  const sp = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 6.283 + r() * 0.5, d = raggio * k * (0.55 + r() * 0.6), h = alt * k * (0.6 + r() * 0.7)
    const m = new Mesh(new ConeGeometry(0.09 * k * (0.8 + r() * 0.5), 1, 5), std(c2.clone().lerp(new Color(1, 1, 1), 0.3), { emissive: c1, emissiveIntensity: 0.8, roughness: 0.12, flatShading: true, transparent: true, opacity: 0.9 }))
    m.geometry.translate(0, 0.5, 0); m.position.set(Math.cos(a) * d, suoloY, Math.sin(a) * d)
    m.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35 + (r() - 0.5) * 0.25); g.add(m)
    return { m, h, ritardo: r() * 0.07 }
  })
  const pt = new Particelle(10, 'fiocco'); g.add(pt.punti)
  const aggiorna = tl => {
    g.visible = tl >= 0 && tl < tempo + 0.02
    if (!g.visible) return
    for (const s of sp) {
      const u = (tl - s.ritardo) / 0.12, sc = u < 0 ? 0 : sovra(u) * s.h * (1 - liscio((tl - tempo * 0.6) / (tempo * 0.4)))
      s.m.scale.set(1, Math.max(sc, 0.0001), 1); s.m.visible = sc > 0.003
    }
    disco.scale.setScalar(k * raggio * 4.2 * mix(0.4, 1, esce(tl / 0.2))); disco.material.opacity = brina * (1 - liscio((tl - 0.1) / tempo))
    misura(alone, k * mix(0.4, 1.6, esce(tl / 0.15)), 0.9 * (1 - liscio(tl / 0.3)))
    pt.inizia()
    for (let i = 0; i < 10; i++) {
      const a = i * 0.628 + hash(i + seme) * 2, v = 0.4 + hash(i * 3 + seme) * 0.6, s = tl
      if (s < 0.5) pt.metti(Math.cos(a) * v * s * 1.3 * k, 0.1 * k + s * v * 1.3 * k - s * s * 1.5, Math.sin(a) * v * s * 1.3 * k, 0.1 * k, c2, 1 - s / 0.5)
    }
    pt.fine()
  }
  return { g, aggiorna }
}

// una nube che si apre e sale (veleno): sbuffi additivi
export function nube({ pos, c1, c2, k = 1, n = 6, raggio = 0.35, seme = 5, tempo = 0.7, sale = 0.5 }) {
  const g = new Group(), r = caso(seme); g.position.copy(pos)
  const sb = Array.from({ length: n }, () => { const s = sprite(c1, 'puff', 1); g.add(s); return { s, a: r() * 6.283, d: r() * raggio, y: r() * 0.25, rot: r() * 6, f: 0.7 + r() * 0.6 } })
  const nuc = sprite(c2, 'alone', 1); g.add(nuc)
  const pt = new Particelle(8); g.add(pt.punti)
  const aggiorna = tl => {
    g.visible = tl >= 0 && tl < tempo + 0.02
    if (!g.visible) return
    for (const b of sb) {
      const u = tl / tempo, e = esce(tl / 0.3)
      b.s.position.set(Math.cos(b.a) * b.d * e * k, (b.y + sale * u * b.f) * k - 0.1, Math.sin(b.a) * b.d * e * k)
      misura(b.s, k * b.f * mix(0.3, 1.5, e), 0.42 * Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 0.7, b.rot + tl)
    }
    misura(nuc, k * mix(0.3, 1.2, esce(tl / 0.2)), 0.4 * (1 - liscio(tl / 0.4)))
    pt.inizia()
    for (let i = 0; i < 8; i++) { const u = tl * (0.7 + hash(i + seme) * 0.5); if (u < 0.6) pt.metti((hash(i * 3 + seme) - 0.5) * 0.7 * k, (0.1 + u * 1.2) * k - 0.2, (hash(i * 7 + seme) - 0.5) * 0.7 * k, 0.09 * k, c2, 1 - u / 0.6) }
    pt.fine()
  }
  return { g, aggiorna }
}

// ── una roccia sbrecciata: dodecaedro scosso, a facce piatte ──
export function roccia(raggio = 0.3, colore = 0x5b4a3f, o = {}) {
  const geo = new DodecahedronGeometry(raggio, 0), p = geo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), q = hash(Math.round(x * 97) + Math.round(y * 61) * 7 + Math.round(z * 43) * 13)
    const f = 0.82 + q * 0.34; p.setXYZ(i, x * f, y * f * 0.92, z * f)
  }
  geo.computeVertexNormals()
  const m = new Mesh(geo, std(colore, { roughness: 0.95, flatShading: true, metalness: 0, ...o })); m.castShadow = true; return m
}

// ── la falce di luce: una mezzaluna piatta con il bordo che brilla ──
export function falce(c1, c2, R = 0.42) {
  const d = R * 0.55, r = R * 0.86, x = (R * R - r * r + d * d) / (2 * d), y = Math.sqrt(Math.max(0, R * R - x * x))
  const sh = new Shape(); sh.absarc(0, 0, R, Math.atan2(y, x), Math.PI * 2 - Math.atan2(y, x), false)
  let a1 = Math.atan2(-y, x - d); if (a1 < 0) a1 += Math.PI * 2
  sh.absarc(d, 0, r, a1, Math.atan2(y, x - d), true)
  const geo = new ShapeGeometry(sh, 24), p = geo.attributes.position, col = new Float32Array(p.count * 3), ca = new Color(), cb = new Color()
  for (let i = 0; i < p.count; i++) {
    const px = p.getX(i), py = p.getY(i), dd = Math.hypot(px, py), di = Math.hypot(px - d, py)
    const w = sat((di - r) / (R - r + 0.001) * 0.0 + (dd / R - 0.55) * 2.2) // più chiaro verso il bordo esterno
    ca.copy(c1).lerp(c2, w * w * w * 0.7); ca.multiplyScalar(0.3 + 0.55 * w); col[i * 3] = ca.r; col[i * 3 + 1] = ca.g; col[i * 3 + 2] = ca.b
  }
  geo.setAttribute('color', new Float32BufferAttribute(col, 3))
  const m = new Mesh(geo, new MeshBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide }))
  m.position.x = -R * 0.12; return m
}

// ── l'ascia lanciata: manico, lama a mezzaluna, capo ──
export function asciaModello(k = 1, tinta) {
  const g = new Group()
  const m = new Mesh(new CylinderGeometry(0.022 * k, 0.026 * k, 0.55 * k, 6), std(0x7a5634, { roughness: 0.8 })); g.add(m)
  const capo = new Mesh(new BoxGeometry(0.07 * k, 0.1 * k, 0.07 * k), std(0x9aa3b4, { metalness: 0.7, roughness: 0.35 })); capo.position.y = 0.2 * k; g.add(capo)
  // lama: due triangoli spessi a ventaglio
  const sh = new Shape(); sh.moveTo(0, 0.1); sh.quadraticCurveTo(0.2, 0.2, 0.16, -0.02); sh.quadraticCurveTo(0.17, -0.04, 0, -0.01); sh.lineTo(0, 0.1)
  const geo = new ShapeGeometry(sh, 8).scale(k, k, k)
  const lama = new Mesh(geo, std(0xe3e9f5, { metalness: 0.75, roughness: 0.22, side: DoubleSide, emissive: tinta || 0x000000, emissiveIntensity: 0.35 })); lama.position.set(0.035 * k, 0.15 * k, 0); g.add(lama)
  const lama2 = lama.clone(); lama2.scale.x = -1; lama2.position.x = -0.035 * k; g.add(lama2)
  g.traverse(o => { if (o.isMesh) o.castShadow = true })
  g.rotation.x = 0; return g
}

// ── la saetta: due tubi (alone e anima) lungo un percorso a zig-zag, spezzato di nuovo a ogni fotogramma ──
const _u = new Vector3(), _s = new Vector3(), _p = new Vector3(0, 1, 0)
export class Saetta {
  constructor(n, c1, c2, raggio) {
    this.n = n; this.r = raggio; this.g = new Group()
    this.alone = new Tubo(n, 5, c1, c1); this.anima = new Tubo(n, 4, c2, c2)
    this.g.add(this.alone.mesh, this.anima.mesh)
    this.P = Array.from({ length: n }, () => new Vector3()); this.R1 = new Float32Array(n); this.R2 = new Float32Array(n); this.I = new Float32Array(n)
    this.dir = new Vector3(); this.u1 = new Vector3(); this.u2 = new Vector3()
  }
  // da A a B; rivela 0..1 quanto del cammino si vede; amp ampiezza dello zig-zag; fine 'punto' (ambo i capi fermi) o 'libero'; luce 0..1
  genera(A, B, seme, { amp = 0.25, rivela = 1, spessore = 1, luce = 1, libero = false } = {}) {
    const { n, P, R1, R2, I } = this
    _s.subVectors(B, A); const L = _s.length(); this.dir.copy(_s).normalize()
    this.u1.crossVectors(this.dir, _p); if (this.u1.lengthSq() < 1e-4) this.u1.set(1, 0, 0); this.u1.normalize(); this.u2.crossVectors(this.dir, this.u1)
    let ox = 0, oy = 0
    for (let i = 0; i < n; i++) {
      const s = i / (n - 1), sr = s * rivela
      const env = libero ? Math.min(1, (1 - sr) * 1.6 + 0.0) ** 0.7 * Math.min(1, sr * 8 + 0.15) : Math.sin(Math.PI * sr) ** 0.6
      ox = ox * 0.35 + (hash(i * 1.37 + seme * 7.1) - 0.5) * 2 * amp * 0.65; oy = oy * 0.35 + (hash(i * 2.71 + seme * 3.3) - 0.5) * 2 * amp * 0.65
      P[i].copy(A).addScaledVector(this.dir, L * sr).addScaledVector(this.u1, ox * env).addScaledVector(this.u2, oy * env)
      const fin = i === 0 ? 0.55 : 1
      R1[i] = this.r * 2.4 * spessore * fin; R2[i] = this.r * 0.5 * spessore * fin
      I[i] = luce * (i === n - 1 && rivela >= 1 ? 1 : 1)
    }
    this.alone.imposta(P, R1, I, 0.5); this.anima.imposta(P, R2, I, 0.9)
  }
  set visibile(v) { this.g.visible = v }
}

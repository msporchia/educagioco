// CIELO, seconda parte: pioggia (frecce), massi, brace, nevicata. Un bersaglio, una parte; i bersagli dopo il primo sono in ritardo di `passo`.
import { Group, Mesh, Vector3, Color, Object3D, InstancedMesh, Quaternion, LatheGeometry, Vector2, MeshStandardMaterial, MeshBasicMaterial, PlaneGeometry, BufferAttribute, DoubleSide } from 'three'
import { sat, liscio, esce, mix, hash, sprite, misura, matAdd, tex, Particelle, assembla, bersagli, tinte, impatto } from './lancio-base.js'
import { roccia, cristallo, gelata } from './lancio-forme.js'

const BIANCO = new Color(1, 1, 1), _o = new Object3D(), _c = new Color()
const MA = Math.PI / 2
const sfasa = (j, N, seme) => ({ a: j * 2.39996 + hash(j + seme) * 0.6, r: Math.sqrt((j + 0.5) / N) })
// punti d'arrivo a spirale intorno al bersaglio: il primo proprio sul bersaglio
const arrivi = (b, N, raggio, seme) => Array.from({ length: N }, (_, j) => { const s = sfasa(j, N, seme); return new Vector3(b.x + Math.cos(s.a) * s.r * raggio * (j ? 1 : 0), 0, b.z + Math.sin(s.a) * s.r * raggio * (j ? 1 : 0)) })

// ── pioggia: un volo di frecce che cadono a raffica e restano piantate ──
function frecciaGeo(k) {
  const prof = [[0, 0], [0.012, 0], [0.012, 0.62], [0.05, 0.64], [0.012, 0.76], [0.035, 0.78], [0, 0.95]].map(([x, y]) => new Vector2(x * k * 1.3, y * k))
  // punta in alto (+y): asta, penne alla coda, cono
  const p = [[0.0, -0.02], [0.016, 0.0], [0.016, 0.6], [0.05, 0.66], [0.0, 0.8]].map(([x, y]) => new Vector2(x * k, y * k))
  const piume = [[0.0, -0.4], [0.05, -0.4], [0.016, -0.22], [0.016, -0.2]].map(([x, y]) => new Vector2(x * k, y * k))
  const geo = new LatheGeometry([...piume, ...p.slice(1)], 6).translate(0, 0, 0)
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), legno = new Color(0xa27b4c), ferro = new Color(0xd7dde8), piuma = new Color(0xece6d6)
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / k, c = y > 0.6 * 1 ? ferro : y < -0.19 ? piuma : legno; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b }
  geo.setAttribute('color', new BufferAttribute(col, 3)); return geo
}
function partePioggia(b, i, r, { c1, c2, k, seme }) {
  const g = new Group(), N = 13, T0 = 0.33 + r, CAD = 0.27, alto = 2.7
  const dirv = new Vector3(0.22, -1, 0.1).normalize()
  const geo = frecciaGeo(k), im = new InstancedMesh(geo, new MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: DoubleSide }), N); im.frustumCulled = false; g.add(im)
  const A = arrivi(b, N, 0.65 * k, seme + i), T = A.map((_, j) => T0 + (j ? 0.03 + hash(j + seme) * 0.2 : 0))
  const pt = new Particelle(N * 6); g.add(pt.punti)
  const fl = sprite(c2, 'alone'); g.add(fl); fl.position.set(b.x, 0.3, b.z)
  const imp = impatto({ tinta: c1, tinta2: c2, k, seme: seme + 2, pos: b, forza: 0.5, n: 6, tempo: 0.35, anello: false }); g.add(imp.g)
  const qq = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dirv), lenS = alto / Math.abs(dirv.y), _p = new Vector3()
  const aggiorna = t => {
    pt.inizia()
    const fine = 1 - liscio((t - (T0 + 0.5)) / 0.12)
    for (let j = 0; j < N; j++) {
      const L = A[j], tc = T[j], u = (t - (tc - CAD)) / CAD
      if (u < 0 || fine <= 0) { _o.position.set(0, -50, 0); _o.scale.setScalar(0.0001); _o.updateMatrix(); im.setMatrixAt(j, _o.matrix); continue }
      const stop = u >= 1, e = sat(u) ** 1.4
      _p.copy(L).addScaledVector(dirv, stop ? 0.14 * k : -lenS * (1 - e))
      _o.position.copy(_p).addScaledVector(dirv, -0.8 * k); _o.quaternion.copy(qq); _o.scale.setScalar(fine); _o.updateMatrix(); im.setMatrixAt(j, _o.matrix)
      if (!stop) { for (let q = 1; q <= 4; q++) pt.metti(_p.x - dirv.x * q * 0.2 * k, _p.y - dirv.y * q * 0.2 * k, _p.z - dirv.z * q * 0.2 * k, 0.1 * k * (1 - q * 0.18), c2, 0.7 * (1 - q * 0.2)) }
      else { const w = (t - tc) / 0.22; if (w < 1) { for (let q = 0; q < 3; q++) { const a = q * 2.1 + j * 1.7; pt.metti(L.x + Math.cos(a) * w * 0.3 * k, 0.04 + w * (1 - w) * 0.35 * k, L.z + Math.sin(a) * w * 0.3 * k, 0.1 * k, c2, 1 - w) } } }
    }
    im.instanceMatrix.needsUpdate = true; pt.fine()
    const w = t - T0; misura(fl, k * 0.9 * (1 - liscio(w / 0.3)), w > 0 ? 0.6 : 0)
    imp.aggiorna(t - T0)
  }
  return { g, aggiorna }
}

// ── massi: rocce che cadono, polvere, un'ombra che cresce sul pavimento ──
function parteMassi(b, i, r, { c1, c2, k, seme }) {
  const g = new Group(), N = 6, T0 = 0.34 + r, alto = 2.6, A = arrivi(b, N, 0.7 * k, seme + i)
  const T = A.map((_, j) => T0 + (j ? hash(j + seme) * 0.2 : 0)), CAD = 0.3
  const rocce = A.map((_, j) => { const m = roccia((0.17 + 0.09 * hash(j + seme * 3)) * k, [0x6d6258, 0x5e5249, 0x76695c][j % 3], { emissive: c1, emissiveIntensity: 0.12 }); g.add(m); return m })
  const ombre = A.map(() => { const m = new Mesh(new PlaneGeometry(1, 1).rotateX(-MA), new MeshBasicMaterial({ color: 0x000000, map: tex('alone'), transparent: true, depthWrite: false })); m.position.y = 0.035; g.add(m); return m })
  const pt = new Particelle(N * 7); g.add(pt.punti)
  const imp = impatto({ tinta: c1, tinta2: c2, k, seme: seme + 4, pos: b, forza: 0.9, n: 10, tempo: 0.4 }); g.add(imp.g)
  const aggiorna = t => {
    pt.inizia()
    const fine = 1 - liscio((t - (T0 + 0.5)) / 0.15)
    A.forEach((L, j) => {
      const m = rocce[j], u = (t - (T[j] - CAD)) / CAD, rad = (0.17 + 0.09 * hash(j + seme * 3)) * k
      m.visible = u > 0 && fine > 0.01; ombre[j].visible = u > -0.3 && fine > 0.01
      ombre[j].position.x = L.x; ombre[j].position.z = L.z
      if (ombre[j].visible) { ombre[j].scale.setScalar(rad * 4 * (0.4 + 0.6 * sat(u + 0.3))); ombre[j].material.opacity = 0.5 * sat(u + 0.3) * fine }
      if (!m.visible) return
      const tl = t - T[j], e = sat(u) ** 1.8, rimb = tl > 0 ? Math.max(0, Math.sin(tl * 22) * 0.22 * k * Math.exp(-tl * 9)) : 0
      m.position.set(L.x + (1 - e) * 0.3, rad * 0.8 + alto * (1 - e) + rimb, L.z); m.rotation.set(t * 5 + j, t * 4, j); m.scale.setScalar(fine)
      if (tl > 0 && tl < 0.4) { const w = tl / 0.4; for (let q = 0; q < 7; q++) { const a = q * 0.9 + j; pt.metti(L.x + Math.cos(a) * w * 0.5 * k, 0.06 + w * 0.2 * k, L.z + Math.sin(a) * w * 0.5 * k, (0.14 + 0.12 * w) * k, c1.clone().lerp(BIANCO, 0.2), 0.4 * (1 - w)) } }
    })
    pt.fine()
    imp.aggiorna(t - T0)
  }
  return { g, aggiorna }
}

// ── brace: braci incandescenti che piovono con una piccola coda, rimbalzano e restano a covare ──
function parteBrace(b, i, r, { c1, c2, k, seme }) {
  const g = new Group(), N = 46, T0 = 0.3 + r, alto = 2.8
  const E = Array.from({ length: N }, (_, j) => { const a = hash(j + seme) * 6.283, rr = Math.sqrt(hash(j * 3 + seme)) * 0.75 * k; return { x: b.x + Math.cos(a) * rr * (j ? 1 : 0), z: b.z + Math.sin(a) * rr * (j ? 1 : 0), t: T0 - 0.08 + hash(j * 7 + seme) * 0.36 + (j ? 0 : 0.08), cad: 0.28 + hash(j * 5 + seme) * 0.12, d: j % 4 === 0 ? 1 : 0, dr: (hash(j * 11 + seme) - 0.5) * 0.4 } })
  const pt = new Particelle(N * 5 + 4); g.add(pt.punti)
  const pozza = new Mesh(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), matAdd(c1, tex('alone'), 0.5)); pozza.position.set(b.x, 0.04, b.z); g.add(pozza)
  const imp = impatto({ tinta: c1, tinta2: c2, k, seme: seme + 8, pos: b, forza: 0.6, n: 10, tempo: 0.4, anello: false }); g.add(imp.g)
  const aggiorna = t => {
    pt.inizia()
    const fine = 1 - liscio((t - (T0 + 0.42)) / 0.2)
    if (fine > 0.01) for (const e of E) {
      const u = (t - (e.t - e.cad)) / e.cad, grande = e.d ? 1.7 : 1
      if (u < 0) continue
      if (u < 1) {
        const f = u ** 1.5, y = 0.05 + alto * (1 - f), x = e.x + e.dr * (1 - f) * 0.6, dy = 0.2 * k
        for (let q = 0; q < 4; q++) pt.metti(x - q * 0.03 * k - e.dr * 0.06 * q, y + q * dy * grande * 0.9, e.z, 0.17 * k * grande * (1 - q * 0.2), q ? c1 : c2, 0.95 - q * 0.22)
      } else {
        const w = (t - e.t) / 0.5
        const salto = Math.max(0, Math.sin(Math.min(1, w * 3) * Math.PI) * 0.16 * k * grande) * (w < 0.33 ? 1 : 0)
        pt.metti(e.x + w * e.dr * 0.4, 0.05 + salto, e.z, 0.2 * k * grande * (1 - 0.5 * w), c2.clone().lerp(c1, w), 1 - w * w)
      }
    }
    pt.fine()
    const w = t - T0; pozza.visible = w > -0.1 && fine > 0.01; pozza.scale.setScalar(k * 1.7 * esce((w + 0.1) / 0.3)); pozza.material.opacity = 0.55 * sat((w + 0.1) / 0.2) * fine
    imp.aggiorna(w)
  }
  return { g, aggiorna }
}

// ── nevicata: fiocchi e cristalli che cadono, brina che si stende a terra ──
function parteNeve(b, i, r, { c1, c2, k, seme }) {
  const g = new Group(), N = 30, C = 8, T0 = 0.38 + r, alto = 2.8
  const nubi = [0, 1, 2].map(j => { const s = sprite(c1, 'puff'); s.position.set(b.x + (j - 1) * 0.45 * k, alto + 0.2, b.z + (hash(j + seme) - 0.5) * 0.5); g.add(s); return s })
  const pt = new Particelle(N, 'fiocco'); g.add(pt.punti)
  const cr = Array.from({ length: C }, (_, j) => { const m = cristallo(c1, c2, 0.2 * k, 0.07 * k); g.add(m); const a = hash(j + seme) * 6.283, rr = Math.sqrt(hash(j * 3 + seme)) * 0.7 * k; return { m, x: b.x + Math.cos(a) * rr, z: b.z + Math.sin(a) * rr, t: T0 - 0.06 + hash(j * 7 + seme) * 0.3, cad: 0.3 + hash(j) * 0.1 } })
  const imp = gelata({ pos: b, c1, c2, k, n: 4, alt: 0.3, raggio: 0.45, seme: seme + 6, tempo: 0.7, brina: 1 }); g.add(imp.g)
  const aggiorna = t => {
    const fine = 1 - liscio((t - (T0 + 0.35)) / 0.2)
    nubi.forEach((s, j) => misura(s, k * (1.6 + 0.2 * j) * sat((t + 0.05) / 0.15), 0.4 * fine * sat((t - r) / 0.12), j))
    pt.inizia()
    for (let j = 0; j < N; j++) {
      const t0 = T0 - 0.2 + hash(j * 2 + seme) * 0.5, cad = 0.36 + hash(j) * 0.14, u = (t - t0) / cad
      if (u < 0 || u > 1 || fine <= 0) continue
      const a = hash(j + seme) * 6.283, rr = Math.sqrt(hash(j * 3 + seme)) * 0.85 * k
      pt.metti(b.x + Math.cos(a) * rr + Math.sin(t * 9 + j) * 0.05, 0.04 + alto * (1 - u * u * 0.4 - u * 0.6) * (1 - u * 0.0), b.z + Math.sin(a) * rr, (0.1 + 0.07 * hash(j + 9)) * k, c2, sat((1 - u) * 3))
    }
    pt.fine()
    for (const c of cr) {
      const u = (t - (c.t - c.cad)) / c.cad; c.m.visible = u > 0 && u < 1.25 && fine > 0.01
      if (!c.m.visible) continue
      const e = sat(u) ** 1.5
      c.m.position.set(c.x, 0.1 * k + alto * (1 - e), c.z); c.m.rotation.set(Math.PI / 2 + Math.sin(t * 7 + c.x) * 0.5, t * 5, 0)
      c.m.scale.setScalar(u > 1 ? Math.max(0, 1 - (u - 1) * 4) : 1)
    }
    imp.aggiorna(t - T0)
  }
  return { g, aggiorna }
}

const pa = (ctx, passo, f) => { const k = ctx.scala ?? 1, [c1, c2] = tinte(ctx); return bersagli(ctx).map((b, i) => f(b, i, i * passo, { c1, c2, k, seme: ctx.seme || 1 })) }
const molti = (f, d, passo) => ctx => assembla(pa(ctx, passo, f), d + (ctx.altri?.length || 0) * passo)

export const EFFETTI = {
  pioggia: { via: 'cielo', durata: 0.72, arrivo: 0.33, passo: 0.06, crea: molti(partePioggia, 0.72, 0.06) },
  massi: { via: 'cielo', durata: 0.72, arrivo: 0.34, passo: 0.08, crea: molti(parteMassi, 0.72, 0.08) },
  brace: { via: 'cielo', durata: 0.64, arrivo: 0.30, passo: 0.05, crea: molti(parteBrace, 0.64, 0.05) },
  nevicata: { via: 'cielo', durata: 0.76, arrivo: 0.38, passo: 0.07, crea: molti(parteNeve, 0.76, 0.07) },
}

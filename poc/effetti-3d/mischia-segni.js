// I segni d'impatto: effetti brevi centrati su `a` (arrivo = 0), usati anche dagli altri effetti.
import {
  Mesh, MeshBasicMaterial, MeshStandardMaterial, OctahedronGeometry, InstancedMesh, Object3D, Vector3, Quaternion, BufferGeometry, BufferAttribute,
  AdditiveBlending, DoubleSide, Color,
} from 'three'
import { smooth, fuori, indietro, clamp01, mix, Nastro, anello, pianoCamera, raggiera, nuovo, chiudi, bagliore, casuale, ventaglio } from './mischia-base.js'

const scuro = (c, k) => [c[0] * k, c[1] * k * 0.8, c[2] * k * 0.7]
const unAsse = new Vector3(0, 1, 0)

function scoppio (ctx) {
  const S = nuovo(ctx, 70), a = S.a, sc = S.sc, rosso = scuro(S.c1, 0.5)
  const pc = pianoCamera(S.R, new Vector3(...a)), rc = anello(S.R, S.hot, 'camera'), rs = anello(S.R, S.c1, 'suolo'); pc.add(rc.mesh); rs.mesh.position.set(a[0], 0.04, a[2])
  S.P.agg({ t0: 0, vita: 0.16, p: a, d0: 0.4 * sc, d1: 1.7 * sc, c: S.hot, forma: 1, attacco: 0.04 })
  S.P.agg({ t0: 0, vita: 0.42, p: a, d0: 0.5 * sc, d1: 1.6 * sc, c: S.c2, c1: S.c1, a: 0.6, forma: 0, attacco: 0.05 })
  S.P.agg({ t0: 0.02, vita: 0.45, p: a, d0: 0.4 * sc, d1: 2.2 * sc, c: S.c1, c1: rosso, a: 0.6, forma: 0, attacco: 0.1 })
  for (let i = 0; i < 8; i++) {   // petali di fiamma che si aprono a stella
    const an = i / 8 * 6.28 + S.rnd() * 0.3, v = 1.8 + S.rnd() * 0.7
    S.P.agg({ t0: 0.01, vita: 0.4, p: a, v: [Math.cos(an) * v, Math.sin(an) * v * 0.8, 0.2], drag: 3.2, d0: 0.4 * sc, d1: 1.3 * sc, c: S.hot, c1: S.c1, a: 0.95, forma: 5, rot: an - Math.PI / 2, fase: S.rnd() * 6, attacco: 0.08 })
  }
  for (let i = 0; i < 6; i++) { const an = S.rnd() * 6.28; S.P.agg({ t0: 0.03, vita: 0.4, p: a, v: [Math.cos(an) * 1.4, 0.4 + S.rnd(), Math.sin(an) * 0.8], g: 1.5, drag: 2.5, d0: 0.5 * sc, d1: 1.0 * sc, c: S.c1, c1: rosso, a: 0.55, forma: 0, attacco: 0.1 }) }
  raggiera(S.P, S.rnd, { t0: 0, p: a, n: 14, vel: 4, vita: 0.45, d: 0.2, c: S.hot, c1: S.c1, g: -3 })
  return chiudi(S, 0.45, t => { const q = t / 0.4; rc.imposta((0.2 + fuori(q) * 1.5) * sc, q < 1 ? (1 - q) ** 1.5 : 0); rs.imposta((0.2 + fuori(q) * 1.9) * sc, q < 1 ? (1 - q) ** 1.3 * 0.9 : 0) })
}

function scintilla (ctx) {
  const S = nuovo(ctx, 40), a = S.a
  S.P.agg({ t0: 0, vita: 0.2, p: a, d0: 0.3, d1: 1.1, c: S.hot, forma: 1, attacco: 0.05 })
  S.P.agg({ t0: 0, vita: 0.25, p: a, d0: 0.35, d1: 0.9, c: S.c1, a: 0.7, forma: 0, attacco: 0.05 })
  for (let i = 0; i < 18; i++) {
    const an = i / 18 * 6.28 + S.rnd() * 0.3, v = 3 + S.rnd() * 3.2
    S.P.agg({ t0: S.rnd() * 0.03, vita: 0.26 + S.rnd() * 0.08, p: a, v: [Math.cos(an) * v, Math.sin(an) * v * 0.85, (S.rnd() - 0.5) * 1], g: -3, drag: 3.5, d0: 0.42, d1: 0.18, c: i % 3 ? S.hot : S.c2, forma: 2, segui: true, attacco: 0.04 })
  }
  return chiudi(S, 0.32)
}

function colpo (ctx) {
  const S = nuovo(ctx, 40), a = S.a, sc = S.sc
  const pc = pianoCamera(S.R, new Vector3(...a)), r = anello(S.R, S.hot, 'camera'), r2 = anello(S.R, S.c1, 'camera'); pc.add(r.mesh, r2.mesh)
  S.P.agg({ t0: 0, vita: 0.34, p: a, d0: 0.5 * sc, d1: 2.0 * sc, c: S.hot, forma: 1, attacco: 0.05 })
  S.P.agg({ t0: 0, vita: 0.12, p: a, d0: 0.8 * sc, d1: 1.4 * sc, c: [1, 1, 1], a: 0.8, forma: 0, attacco: 0.05 })
  S.P.agg({ t0: 0, vita: 0.3, p: a, d0: 0.7 * sc, d1: 1.6 * sc, c: S.c1, a: 0.6, forma: 0, attacco: 0.08 })
  raggiera(S.P, S.rnd, { t0: 0, p: a, n: 8, vel: 3.2, vita: 0.32, d: 0.2, c: S.hot, c1: S.c1 })
  return chiudi(S, 0.36, t => { const q = t / 0.3; r.imposta((0.15 + fuori(q) * 0.95) * sc, q < 1 ? (1 - q) ** 1.4 : 0); const q2 = (t - 0.05) / 0.3; r2.imposta((0.1 + fuori(q2) * 1.3) * sc, q2 > 0 && q2 < 1 ? (1 - q2) * 0.7 : 0) })
}

function brina (ctx) {
  const S = nuovo(ctx, 60), a = S.a, sc = S.sc, NC = 9, o = new Object3D(), q = new Quaternion()
  const cristalli = new InstancedMesh(S.R.tieni(new OctahedronGeometry(1, 0)), S.R.tieni(new MeshStandardMaterial({ color: new Color(...S.c2), emissive: new Color(...S.c1), emissiveIntensity: 1.1, flatShading: true, roughness: 0.2, transparent: true, opacity: 0.92, depthTest: false })), NC)
  cristalli.frustumCulled = false; S.R.gruppo.add(cristalli)
  const dati = []
  for (let i = 0; i < NC; i++) {
    const an = i / NC * 6.28 + S.rnd() * 0.5, el = (S.rnd() - 0.2) * 1.2, d = new Vector3(Math.cos(an) * Math.cos(el), Math.sin(el), Math.sin(an) * Math.cos(el) * 0.6).normalize()
    dati.push({ d, l: (0.2 + S.rnd() * 0.16) * sc, v: 0.35 + S.rnd() * 0.35, r0: 0.05 + S.rnd() * 0.12, rit: S.rnd() * 0.06 })
  }
  const pc = pianoCamera(S.R, new Vector3(...a)), r = anello(S.R, S.c2, 'camera'), rs = anello(S.R, S.c1, 'suolo'); pc.add(r.mesh); rs.mesh.position.set(a[0], 0.04, a[2])
  S.P.agg({ t0: 0, vita: 0.4, p: a, d0: 0.5 * sc, d1: 1.9 * sc, c: S.c1, a: 0.55, forma: 0, attacco: 0.1 })
  S.P.agg({ t0: 0, vita: 0.2, p: a, d0: 0.4 * sc, d1: 1.2 * sc, c: S.hot, forma: 1, attacco: 0.05 })
  for (let i = 0; i < 12; i++) { const an = S.rnd() * 6.28, v = 0.6 + S.rnd() * 1.2; S.P.agg({ t0: 0.08 + S.rnd() * 0.15, vita: 0.4, p: [a[0] + Math.cos(an) * 0.4, a[1] + (S.rnd() - 0.4) * 0.5, a[2] + Math.sin(an) * 0.3], v: [Math.cos(an) * v, 0.3, Math.sin(an) * v * 0.5], g: -1.5, drag: 1.5, d0: 0.2, d1: 0.08, c: S.hot, forma: 1, rot: S.rnd(), attacco: 0.12 }) }
  const agg = t => {
    const fine = 1 - smooth((t - 0.34) / 0.18)
    for (let i = 0; i < NC; i++) {
      const d = dati[i], tau = Math.max(0, t - d.rit), cresce = indietro(tau / 0.15), dist = d.r0 + d.v * (tau > 0 ? fuori(tau / 0.5) * 0.9 : 0) * sc
      o.position.set(a[0] + d.d.x * dist, a[1] + d.d.y * dist, a[2] + d.d.z * dist); q.setFromUnitVectors(unAsse, d.d); o.quaternion.copy(q)
      const s = d.l * cresce * fine; o.scale.set(s * 0.38, s, s * 0.38); o.updateMatrix(); cristalli.setMatrixAt(i, tau > 0 ? o.matrix : (o.scale.setScalar(0), o.updateMatrix(), o.matrix))
    }
    cristalli.instanceMatrix.needsUpdate = true
    const u = t / 0.4; r.imposta((0.2 + fuori(u) * 1.0) * sc, u < 1 ? (1 - u) * 0.8 : 0); rs.imposta((0.2 + fuori(u) * 1.4) * sc, u < 1 ? (1 - u) * 0.75 : 0)
  }
  return chiudi(S, 0.5, agg)
}

function luce (ctx) {
  const S = nuovo(ctx, 40), a = S.a, sc = S.sc, NR = 12
  const pc = pianoCamera(S.R, new Vector3(...a)), r = anello(S.R, S.c1, 'camera'); pc.add(r.mesh)
  const pos = new Float32Array(NR * 3 * 3), col = new Float32Array(NR * 3 * 4), g = S.R.tieni(new BufferGeometry())
  g.setAttribute('position', new BufferAttribute(pos, 3)); g.setAttribute('color', new BufferAttribute(col, 4))
  const mat = S.R.tieni(new MeshBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, depthTest: false, side: DoubleSide }))
  const raggi = new Mesh(g, mat); raggi.frustumCulled = false; raggi.renderOrder = 14; pc.add(raggi)
  S.P.agg({ t0: 0, vita: 0.5, p: a, d0: 0.8 * sc, d1: 2.4 * sc, c: S.hot, c1: S.c1, a: 0.8, forma: 0, attacco: 0.1 })
  S.P.agg({ t0: 0, vita: 0.28, p: a, d0: 0.4 * sc, d1: 1.7 * sc, c: [1, 1, 1], forma: 1, attacco: 0.06 })
  for (let i = 0; i < 12; i++) { const an = S.rnd() * 6.28, rr = 0.2 + S.rnd() * 0.5; S.P.agg({ t0: 0.04 + S.rnd() * 0.2, vita: 0.4, p: [a[0] + Math.cos(an) * rr, a[1] - 0.3 + S.rnd() * 0.3, a[2] + Math.sin(an) * rr * 0.4], v: [0, 1.4 + S.rnd() * 1.2, 0], g: 0, drag: 0.5, d0: 0.22, d1: 0.1, c: i % 2 ? S.hot : S.c2, forma: 1, attacco: 0.15 }) }
  const agg = t => {
    const u = t / 0.5, apri = indietro(t / 0.2), fine = (1 - smooth((t - 0.22) / 0.28)), rot = t * 0.8
    for (let i = 0; i < NR; i++) {
      const an = i / NR * 6.28 + rot, lungo = (i % 2 ? 0.55 : 0.95) * sc * apri * (0.9 + 0.1 * Math.sin(t * 20 + i)), larg = 0.085 * sc * (i % 2 ? 0.7 : 1), co = Math.cos(an), si = Math.sin(an), k = i * 9, h = i * 12
      pos[k] = co * 0.06 - si * larg; pos[k + 1] = si * 0.06 + co * larg; pos[k + 2] = 0; pos[k + 3] = co * 0.06 + si * larg; pos[k + 4] = si * 0.06 - co * larg; pos[k + 5] = 0; pos[k + 6] = co * lungo; pos[k + 7] = si * lungo; pos[k + 8] = 0
      for (let j = 0; j < 3; j++) { const e = j < 2 ? 1 : 0; col[h + j * 4] = mix(S.hot[0], 1, 0.4) * e + S.c1[0] * (1 - e); col[h + j * 4 + 1] = mix(S.hot[1], 1, 0.4) * e + S.c1[1] * (1 - e); col[h + j * 4 + 2] = mix(S.hot[2], 1, 0.4) * e + S.c1[2] * (1 - e); col[h + j * 4 + 3] = (j < 2 ? 0.95 : 0) * fine }
    }
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true
    r.imposta((0.2 + fuori(u) * 1.1) * sc, u < 1 ? (1 - u) * 0.8 : 0)
  }
  return chiudi(S, 0.5, agg)
}

function scossa (ctx) {
  const S = nuovo(ctx, 30), a = S.a, sc = S.sc, N = 40, NA = 6
  const pc = pianoCamera(S.R, new Vector3(...a)), anelloN = new Nastro(S.R, N + 1), anelloB = new Nastro(S.R, N + 1), archi = [], rs = anello(S.R, S.c1, 'suolo'); rs.mesh.position.set(a[0], 0.04, a[2])
  pc.add(anelloN.mesh, anelloB.mesh); for (let i = 0; i < NA; i++) { const n = new Nastro(S.R, 9), b = new Nastro(S.R, 9); pc.add(n.mesh, b.mesh); archi.push([n, b]) }
  S.P.agg({ t0: 0, vita: 0.25, p: a, d0: 0.4 * sc, d1: 1.6 * sc, c: S.hot, forma: 1, attacco: 0.05 })
  S.P.agg({ t0: 0, vita: 0.3, p: a, d0: 0.5 * sc, d1: 1.5 * sc, c: S.c1, a: 0.6, forma: 0, attacco: 0.05 })
  const agg = t => {
    const tick = Math.floor(t * 38), rn = casuale(ctx.seme + tick * 7.1), u = t / 0.34, f = clamp01(1 - u) ** 1.2, R = (0.2 + fuori(u) * 0.8) * sc
    anelloN.mesh.visible = anelloB.mesh.visible = u < 1
    for (let i = 0; i <= N; i++) {
      const w = i / N, an = w * 6.28318, j = (i === 0 || i === N) ? 0 : (rn() - 0.5) * 0.22 * sc, r = R + j, co = Math.cos(an), si = Math.sin(an)
      anelloN.set(i, co * r, si * r, 0, co, si, 0, 0.07 * sc * f, S.c1, f * 0.9); anelloB.set(i, co * r, si * r, 0, co, si, 0, 0.022 * sc * f, [1, 1, 1], f)
    }
    anelloN.fine(); anelloB.fine()
    archi.forEach(([n, b], k) => {
      const an = k / NA * 6.28 + tick * 0.7 + ctx.seme, co = Math.cos(an), si = Math.sin(an), L = R * 0.95, ap = clamp01(1 - u * 1.2)
      n.mesh.visible = b.mesh.visible = ap > 0
      let x = 0, y = 0
      for (let i = 0; i < 9; i++) {
        const s = i / 8, d = (i === 0 ? 0 : (rn() - 0.5) * 0.26 * sc); x = co * L * s - si * d; y = si * L * s + co * d
        n.set(i, x, y, 0, -si, co, 0, 0.04 * sc * (1 - s * 0.6) * ap, S.c2, ap * 0.9); b.set(i, x, y, 0, -si, co, 0, 0.013 * sc * ap, [1, 1, 1], ap)
      }
      n.fine(); b.fine()
    })
    rs.imposta((0.2 + fuori(u) * 1.4) * sc, u < 1 ? (1 - u) * 0.7 : 0)
  }
  return chiudi(S, 0.36, agg)
}

function nube (ctx) {
  const S = nuovo(ctx, 80), a = S.a, sc = S.sc, scura = scuro(S.c1, 0.55)
  for (let i = 0; i < 18; i++) {
    const an = S.rnd() * 6.28, rr = S.rnd() * 0.45 * sc
    S.P.agg({ t0: S.rnd() * 0.1, vita: 0.4 + S.rnd() * 0.12, p: [a[0] + Math.cos(an) * rr, a[1] - 0.3 + S.rnd() * 0.3, a[2] + Math.sin(an) * rr * 0.6], v: [Math.cos(an) * 0.9, 0.6 + S.rnd() * 0.8, Math.sin(an) * 0.5], g: 0, drag: 1.6, d0: 0.6 * sc, d1: (1.5 + S.rnd() * 0.6) * sc, c: i % 3 ? S.c1 : scura, c1: scura, a: 0.62, forma: 0, attacco: 0.2 })
  }
  for (let i = 0; i < 8; i++) {   // bolle di spore che salgono
    const an = S.rnd() * 6.28
    S.P.agg({ t0: 0.04 + S.rnd() * 0.14, vita: 0.42, p: [a[0] + Math.cos(an) * 0.45, a[1] - 0.2, a[2] + Math.sin(an) * 0.3], v: [Math.cos(an) * 0.5, 1 + S.rnd() * 0.9, Math.sin(an) * 0.3], d0: 0.2 + S.rnd() * 0.1, d1: 0.34, c: S.hot, a: 0.95, forma: 4, attacco: 0.15 })
  }
  for (let i = 0; i < 12; i++) { const an = S.rnd() * 6.28; S.P.agg({ t0: 0.04 + S.rnd() * 0.2, vita: 0.4, p: a, v: [Math.cos(an) * 1.4, 0.7 + S.rnd() * 1.2, Math.sin(an) * 0.9], g: 0, drag: 1.2, d0: 0.13, d1: 0.05, c: S.c2, forma: 0, attacco: 0.06 }) }
  return chiudi(S, 0.5)
}

function rogo (ctx) {
  const S = nuovo(ctx, 70), a = S.a, sc = S.sc, rosso = scuro(S.c1, 0.5), NF = 9
  const rs = anello(S.R, S.c1, 'suolo'); rs.mesh.position.set(a[0], 0.04, a[2])
  S.P.agg({ t0: 0, vita: 0.5, p: [a[0], a[1] - 0.2, a[2]], d0: 0.6, d1: 1.9 * sc, c: S.c1, a: 0.4, forma: 0, attacco: 0.2 })
  for (let i = 0; i < NF; i++) {
    const an = i / NF * 6.28 + 0.3, rr = 0.46 * sc, rit = (i % 3) * 0.04
    S.P.agg({ t0: rit, vita: 0.4 + S.rnd() * 0.08, p: [a[0] + Math.cos(an) * rr, a[1] - 0.35, a[2] + Math.sin(an) * rr * 0.8], v: [0, 1.4 + S.rnd() * 0.6, 0], d0: 0.6 * sc, d1: (1.5 + S.rnd() * 0.4) * sc, c: S.c1, c1: rosso, a: 0.95, forma: 5, fase: S.rnd() * 6, attacco: 0.2 })
  }
  for (let i = 0; i < 5; i++) { const an = S.rnd() * 6.28; S.P.agg({ t0: 0.04 + S.rnd() * 0.08, vita: 0.42, p: [a[0] + Math.cos(an) * 0.2, a[1] - 0.3, a[2] + Math.sin(an) * 0.2], v: [0, 1.0, 0], d0: 0.5 * sc, d1: 1.3 * sc, c: S.hot, c1: S.c1, a: 0.95, forma: 5, fase: S.rnd() * 6, attacco: 0.2 }) }
  for (let i = 0; i < 12; i++) { const an = S.rnd() * 6.28, rr = S.rnd() * 0.6; S.P.agg({ t0: S.rnd() * 0.2, vita: 0.4, p: [a[0] + Math.cos(an) * rr, a[1] - 0.25, a[2] + Math.sin(an) * rr * 0.7], v: [(S.rnd() - 0.5) * 0.6, 1.2 + S.rnd() * 1.3, 0], drag: 0.8, d0: 0.09, d1: 0.03, c: S.hot, c1: S.c1, forma: 0, attacco: 0.05 }) }
  return chiudi(S, 0.5, t => { const u = t / 0.45; rs.imposta((0.3 + fuori(u) * 0.9) * sc, u < 1 ? (1 - u) * 0.8 * clamp01(t * 12) : 0) })
}

function rimbalzo (ctx) {
  const S = nuovo(ctx, 40), a = S.a, sc = S.sc, dx = a[0] - S.da[0], dz = a[2] - S.da[2], l = Math.hypot(dx, dz) || 1, d = [dx / l, dz / l], T = 0.1
  const nIn = [new Nastro(S.R, 14), new Nastro(S.R, 14)], nOut = [new Nastro(S.R, 18), new Nastro(S.R, 18)], lat = [-d[1], 0, d[0]]
  const pc = pianoCamera(S.R, new Vector3(...a)), r = anello(S.R, S.hot, 'camera'); pc.add(r.mesh)
  bagliore(S, a, T, { dim: 1.0 })
  raggiera(S.P, S.rnd, { t0: T, p: a, n: 12, vel: 4.2, vita: 0.34, d: 0.28, c: S.hot, c1: S.c1, su: 0.6 })
  const fuga = [-d[0] * 0.45, 1.0, -d[1] * 0.45]
  const agg = t => {
    const pin = clamp01(t / T), pout = clamp01((t - T) / 0.22), vivo = 1 - smooth((t - T - 0.14) / 0.12)
    nIn.forEach((n, k) => { n.mesh.visible = vivo > 0.01; for (let i = 0; i < 14; i++) { const u = i / 13, s = (pin * 1.0 - (1 - u) * 0.55 * Math.min(1, pin * 2)), x = a[0] - d[0] * 1.8 * (1 - s), y = a[1] + 0.5 * (1 - s), z = a[2] - d[1] * 1.8 * (1 - s), vis = s >= 0 ? 1 : 0; n.set(i, x, y, z, k ? lat[0] : 0, k ? 0 : 1, k ? lat[2] : 0, 0.16 * sc * u * vis, k ? S.c1 : S.hot, u * u * vivo * vis) } n.fine() })
    nOut.forEach((n, k) => { n.mesh.visible = pout > 0 && vivo > 0.01; for (let i = 0; i < 18; i++) { const u = i / 17, s = Math.max(0, pout * 1.1 - (1 - u) * 0.5), x = a[0] + fuga[0] * 2.4 * s, y = a[1] + fuga[1] * 2.0 * s - 2.0 * s * s, z = a[2] + fuga[2] * 2.4 * s; n.set(i, x, y, z, k ? lat[0] : 0, k ? 0 : 1, k ? lat[2] : 0, 0.13 * sc * u * (1 - pout * 0.5), k ? S.c1 : S.hot, u * u * vivo * (s > 0 ? 1 : 0)) } n.fine() })
    const q = (t - T) / 0.25; r.imposta((0.1 + fuori(q) * 0.6) * sc, q > 0 && q < 1 ? (1 - q) : 0)
  }
  return chiudi(S, 0.4, agg)
}

const s = (crea, durata) => ({ via: 'segno', arrivo: 0, durata, crea })
export const EFFETTI = {
  scoppio: s(scoppio, 0.45), scintilla: s(scintilla, 0.32), colpo: s(colpo, 0.36), brina: s(brina, 0.5), luce: s(luce, 0.5),
  scossa: s(scossa, 0.36), nube: s(nube, 0.5), rogo: s(rogo, 0.5), rimbalzo: s(rimbalzo, 0.4),
}

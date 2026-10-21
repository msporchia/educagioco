// Generato da strumenti/promuovi-3d.mjs da poc/effetti-3d/mischia-terra.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Gli effetti dal pavimento: radici e rovi che avvolgono i piedi, il terremoto con le crepe luminose.
import {
  Mesh, BufferGeometry, BufferAttribute, MeshBasicMaterial, MeshStandardMaterial, CatmullRomCurve3, Vector3, Quaternion, Color, InstancedMesh, ConeGeometry,
  Object3D, DodecahedronGeometry,
} from 'three'
import { smooth, fuori, indietro, clamp01, mix, Nastro, anello, nuovo, chiudi, bagliore } from './mischia-base.js'

/** Un tubo affusolato come BufferGeometry ordinata lungo la curva: drawRange lo fa «crescere». I colori sono per vertice. */
function tubo (R, curva, seg, rad, raggi, colFn) {
  const pts = curva.getSpacedPoints(seg), fr = curva.computeFrenetFrames(seg, false), pos = new Float32Array((seg + 1) * rad * 3), col = new Float32Array((seg + 1) * rad * 3), idx = []
  const g = R.tieni(new BufferGeometry()); g.setAttribute('position', new BufferAttribute(pos, 3)); g.setAttribute('color', new BufferAttribute(col, 3))
  for (let i = 0; i < seg; i++) for (let j = 0; j < rad; j++) { const a = i * rad + j, b = i * rad + (j + 1) % rad, c = a + rad, d = b + rad; idx.push(a, c, b, b, c, d) }
  g.setIndex(idx)
  const aggiorna = scala => {
    for (let i = 0; i <= seg; i++) {
      const u = i / seg, r = raggi(u) * scala, N = fr.normals[i], B = fr.binormals[i], c = colFn(u)
      for (let j = 0; j < rad; j++) {
        const an = j / rad * Math.PI * 2, cx = Math.cos(an), cy = Math.sin(an), k = (i * rad + j) * 3
        pos[k] = pts[i].x + (N.x * cx + B.x * cy) * r; pos[k + 1] = pts[i].y + (N.y * cx + B.y * cy) * r; pos[k + 2] = pts[i].z + (N.z * cx + B.z * cy) * r
        const ny = N.y * cx + B.y * cy, l = 0.3 + 1.0 * Math.max(0, ny) + 0.2 * cx
        col[k] = c[0] * l; col[k + 1] = c[1] * l; col[k + 2] = c[2] * l
      }
    }
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true
  }
  return { geo: g, pts, aggiorna, mostra: u => g.setDrawRange(0, Math.max(0, Math.floor(clamp01(u) * seg)) * rad * 6) }
}

function creaRadici (ctx) {
  const S = nuovo(ctx, 70), a = S.a, T = 0.28, NR = 5, SEG = 22, sc = S.sc
  const marrone = [0.035, 0.02, 0.01], base = [mix(marrone[0], S.c1[0], 0.22), mix(marrone[1], S.c1[1], 0.22), mix(marrone[2], S.c1[2], 0.22)]
  const mat = S.R.tieni(new MeshBasicMaterial({ vertexColors: true }))
  const radici = [], oggetto = new Object3D(), q = new Quaternion(), up = new Vector3(0, 1, 0)
  const spine = new InstancedMesh(S.R.tieni(new ConeGeometry(0.055, 0.2, 5)), S.R.tieni(new MeshBasicMaterial({ color: new Color(...S.c2) })), NR * 3)
  spine.frustumCulled = false; S.R.gruppo.add(spine)
  for (let k = 0; k < NR; k++) {
    const f0 = k / NR * Math.PI * 2 + S.rnd() * 0.5, giri = 1.6 + S.rnd() * 0.8, alt = (0.55 + S.rnd() * 0.45) * sc, pts = []
    for (let i = 0; i <= 9; i++) {
      const s = i / 9, an = f0 + s * giri, rr = (0.62 - 0.27 * s) * sc + Math.sin(s * 9 + k) * 0.03
      pts.push(new Vector3(a[0] + Math.cos(an) * rr, -0.05 + (s < 0.1 ? s * 1.5 : 0.15 + (s - 0.1) * alt / 0.9 * (0.85 + 0.25 * Math.sin(s * 5))), a[2] + Math.sin(an) * rr * 0.9))
    }
    const curva = new CatmullRomCurve3(pts), t = tubo(S.R, curva, SEG, 6, u => 0.1 * sc * (1 - 0.75 * u ** 1.2) + 0.015, u => [mix(base[0], S.c1[0] * 0.8, u ** 2.5), mix(base[1], S.c1[1] * 0.8, u ** 2.5), mix(base[2], S.c1[2] * 0.8, u ** 2.5)])
    const mesh = new Mesh(t.geo, mat); mesh.frustumCulled = false; S.R.gruppo.add(mesh)
    const ritardo = 0.02 + k * 0.025, spineK = [0.35, 0.6, 0.85].map(s => ({ s, p: curva.getPoint(s), n: curva.getTangent(s), f: f0 + s * giri }))
    radici.push({ t, ritardo, mesh, spineK, curva })
    for (let i = 0; i < 4; i++) {   // scintille di crescita lungo la radice
      const u = 0.2 + i * 0.2, p = curva.getPoint(u)
      S.P.agg({ t0: ritardo + 0.05 + u * 0.3, vita: 0.35, p: [p.x, p.y + 0.05, p.z], v: [0, 0.9, 0], g: 0, drag: 1, d0: 0.17, d1: 0.05, c: S.c2, forma: 0, attacco: 0.06 })
    }
  }
  const r1 = anello(S.R, S.c1, 'suolo'), r2 = anello(S.R, S.c2, 'suolo'); for (const r of [r1, r2]) r.mesh.position.set(a[0], 0.03, a[2])
  S.P.agg({ t0: 0.05, vita: 0.5, p: [a[0], 0.08, a[2]], d0: 0.6, d1: 1.6, c: S.c1, a: 0.5, forma: 0, attacco: 0.2 })
  for (let i = 0; i < 12; i++) {   // zolle di terra
    const an = S.rnd() * 6.28, v = 0.8 + S.rnd() * 1.4
    S.P.agg({ t0: 0.05 + S.rnd() * 0.15, vita: 0.45, p: [a[0] + Math.cos(an) * 0.6, 0.05, a[2] + Math.sin(an) * 0.55], v: [Math.cos(an) * v * 0.4, 1.6 + S.rnd() * 1.4, Math.sin(an) * v * 0.4], g: -9, drag: 0.3, d0: 0.1, d1: 0.05, c: [0.55, 0.38, 0.2], forma: 3, attacco: 0.05 })
  }
  bagliore(S, [a[0], 0.3, a[2]], T, { dim: 0.6 })
  const agg = t => {
    for (const r of radici) {
      const g = indietro((t - r.ritardo) / 0.34), scala = clamp01(g * 1.2) * (1 + 0.15 * (g > 1 ? g - 1 : 0)) * (1 - smooth((t - 0.56) / 0.18))
      r.mesh.visible = t > r.ritardo && scala > 0.01
      if (!r.mesh.visible) continue
      r.t.aggiorna(Math.max(0.2, scala)); r.t.mostra(Math.min(1, g) * (1 - smooth((t - 0.6) / 0.16) * 0.0))
    }
    let n = 0
    for (const r of radici) for (const sp of r.spineK) {
      const g = indietro((t - r.ritardo) / 0.34), cresce = clamp01((g - sp.s) * 6) * (1 - smooth((t - 0.56) / 0.18))
      const out = new Vector3(Math.cos(sp.f), 0.5, Math.sin(sp.f)).normalize()
      q.setFromUnitVectors(up, out); oggetto.position.set(sp.p.x, sp.p.y, sp.p.z).addScaledVector(out, 0.04); oggetto.quaternion.copy(q); oggetto.scale.setScalar(Math.max(cresce * sc, 1e-4)); oggetto.updateMatrix(); spine.setMatrixAt(n++, oggetto.matrix)
    }
    spine.instanceMatrix.needsUpdate = true
    const u = t / 0.4; r1.imposta(0.3 + fuori(u) * 1.0, u < 1 ? (1 - u) * 0.9 : 0); const u2 = (t - 0.1) / 0.4; r2.imposta(0.2 + fuori(u2) * 0.7, u2 > 0 && u2 < 1 ? (1 - u2) * 0.8 : 0)
  }
  return chiudi(S, 0.76, agg)
}

function creaTerremoto (ctx) {
  const S = nuovo(ctx, 90), a = S.a, T = 0.24, sc = S.sc, NC = 8, cx = a[0], cz = a[2]
  const crepe = []
  for (let k = 0; k < NC; k++) {
    const an0 = k / NC * Math.PI * 2 + (S.rnd() - 0.5) * 0.5, L = (1.0 + S.rnd() * 1.1) * sc, pts = [], ram = []
    let an = an0, x = 0, z = 0
    const N = 11
    for (let i = 0; i < N; i++) {
      pts.push([x, z]); const passo = L / (N - 1); an += (S.rnd() - 0.5) * 0.9; x += Math.cos(an) * passo; z += Math.sin(an) * passo * 0.9
      if (i === 4 && k % 2 === 0) { let b = an + (S.rnd() > 0.5 ? 0.9 : -0.9), bx = x, bz = z; ram.push([[bx, bz]]); for (let j = 0; j < 4; j++) { b += (S.rnd() - 0.5) * 0.8; bx += Math.cos(b) * L * 0.09; bz += Math.sin(b) * L * 0.08; ram[0].push([bx, bz]) } }
    }
    crepe.push({ pts, ram: ram[0] || null, an0, L, alone: new Nastro(S.R, N), anima: new Nastro(S.R, N), ramo: ram[0] ? { alone: new Nastro(S.R, 5), anima: new Nastro(S.R, 5) } : null, ritardo: S.rnd() * 0.05 })
  }
  const r1 = anello(S.R, S.c1, 'suolo'), r2 = anello(S.R, S.hot, 'suolo'); for (const r of [r1, r2]) r.mesh.position.set(cx, 0.03, cz)
  const glow = anello(S.R, S.c1, 'suolo'); glow.mesh.position.set(cx, 0.02, cz)
  const NS = 9, sassi = new InstancedMesh(S.R.tieni(new DodecahedronGeometry(1, 0)), S.R.tieni(new MeshStandardMaterial({ color: 0x6b6258, emissive: 0x3a332c, flatShading: true, roughness: 1 })), NS), o = new Object3D(), dati = []
  sassi.frustumCulled = false; S.R.gruppo.add(sassi)
  for (let i = 0; i < NS; i++) { const an = S.rnd() * 6.28, r = 0.2 + S.rnd() * 0.9; dati.push({ p: [cx + Math.cos(an) * r * sc, 0, cz + Math.sin(an) * r * sc * 0.8], vy: 2.6 + S.rnd() * 3, s: 0.12 + S.rnd() * 0.14, r: [S.rnd() * 6, S.rnd() * 6], dx: Math.cos(an) * 0.4, dz: Math.sin(an) * 0.3, t0: T - 0.03 + S.rnd() * 0.08 }) }
  bagliore(S, [cx, 0.15, cz], T, { dim: 1 })
  S.P.agg({ t0: T, vita: 0.45, p: [cx, 0.12, cz], d0: 1.0, d1: 2.4, c: S.c1, a: 0.55, forma: 0, attacco: 0.1 })
  for (let i = 0; i < 14; i++) {
    const an = S.rnd() * 6.28, r = S.rnd() * 1.1
    S.P.agg({ t0: T + S.rnd() * 0.12, vita: 0.55, p: [cx + Math.cos(an) * r, 0.1, cz + Math.sin(an) * r * 0.8], v: [Math.cos(an) * 0.6, 0.9 + S.rnd() * 0.8, Math.sin(an) * 0.5], g: 0, drag: 2, d0: 0.25, d1: 0.7, c: [0.55, 0.5, 0.43], a: 0.5, forma: 6, attacco: 0.15 })
  }
  for (let i = 0; i < 12; i++) { const an = S.rnd() * 6.28, r = S.rnd() * 0.8; S.P.agg({ t0: T + S.rnd() * 0.1, vita: 0.5, p: [cx + Math.cos(an) * r, 0.1, cz + Math.sin(an) * r], v: [(S.rnd() - 0.5) * 1.2, 2.5 + S.rnd() * 2.5, (S.rnd() - 0.5) * 1], g: -7, drag: 0.4, d0: 0.13, d1: 0.04, c: S.c2, forma: 0, attacco: 0.04 }) }
  const strada = (n, pts, g, y, larg, vivo, hot, caldo) => {
    const m = Math.max(2, Math.ceil(g * pts.length)); n.mesh.visible = g > 0.02
    for (let i = 0; i < pts.length; i++) {
      const u = i / (pts.length - 1), p = pts[i], q = pts[Math.min(i + 1, pts.length - 1)], pr = pts[Math.max(i - 1, 0)], dx = q[0] - pr[0], dz = q[1] - pr[1], l = Math.hypot(dx, dz) || 1
      const w = larg * (1 - 0.7 * u) * clamp01((g * pts.length - i) * 0.9 + 0.2), col = hot ? S.c2 : [mix(S.c1[0], S.hot[0], (1 - u) * 0.6), mix(S.c1[1], S.hot[1], (1 - u) * 0.6), mix(S.c1[2], S.hot[2], (1 - u) * 0.6)]
      n.set(i, cx + p[0], y, cz + p[1], -dz / l, 0, dx / l, w, col, vivo * (0.55 + 0.45 * (1 - u)))
    }
    n.fine(m)
  }
  const agg = t => {
    const vivo = 1 - smooth((t - 0.5) / 0.26)
    for (const c of crepe) {
      const g = fuori((t - T + 0.03 - c.ritardo) / 0.2), gr = c.ram ? clamp01(g * 1.6 - 0.5) : 0
      const lc = 0.03 * sc, tr = c.pts.map(([x, z]) => [x, z])
      strada(c.alone, tr, g, 0.03, lc * 1.9, vivo * 0.8, false); strada(c.anima, tr, g, 0.035, lc * 0.6, vivo, true)
      if (c.ramo) {
        const ramPts = [c.pts[4], ...c.ram].map(p => [p[0], p[1]]).slice(0, 5)
        strada(c.ramo.alone, ramPts, gr, 0.03, lc * 1.3, vivo * 0.8, false); strada(c.ramo.anima, ramPts, gr, 0.035, lc * 0.45, vivo, true)
      }
    }
    const u = (t - T) / 0.4; r1.imposta(0.2 + fuori(u) * 1.8 * sc, u > 0 && u < 1 ? (1 - u) * 0.85 : 0); const u2 = (t - T) / 0.25; r2.imposta(0.1 + fuori(u2) * 1.0, u2 > 0 && u2 < 1 ? (1 - u2) : 0)
    glow.imposta(1.1 * sc * smooth((t - T + 0.05) / 0.15), t > T - 0.05 ? 0.6 * vivo : 0)
    for (let i = 0; i < NS; i++) {
      const d = dati[i], tau = t - d.t0, ok = tau > 0 && tau < 0.55, y = Math.max(0, d.vy * tau - 8 * tau * tau)
      o.position.set(d.p[0] + d.dx * tau, y + 0.03, d.p[2] + d.dz * tau); o.rotation.set(d.r[0] + tau * 7, d.r[1] + tau * 5, 0); o.scale.setScalar(ok ? d.s * (1 - smooth((tau - 0.35) / 0.2)) : 0); o.updateMatrix(); sassi.setMatrixAt(i, o.matrix)
    }
    sassi.instanceMatrix.needsUpdate = true
  }
  return chiudi(S, 0.76, agg)
}

export const EFFETTI = {
  radici: { via: 'terra', arrivo: 0.28, durata: 0.76, passo: 0.07, crea: creaRadici },
  terremoto: { via: 'terra', arrivo: 0.24, durata: 0.76, passo: 0.06, scuote: true, crea: creaTerremoto },
}

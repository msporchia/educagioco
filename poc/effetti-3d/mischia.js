// Il gruppo «mischia»: i colpi da vicino, il turbine, l'onda, la fiammata; poi si uniscono terra e segni.
// Contratto: EFFETTI[chiave] = { via, durata, arrivo, passo?, scuote?, crea(ctx) } (secondi). `a` è il petto del bersaglio, il suolo è y = 0.
import { Mesh, ConeGeometry, MeshBasicMaterial, AdditiveBlending, Color, Vector3, InstancedMesh, BoxGeometry, Object3D } from 'three'
import { smooth, fuori, dentro, clamp01, mix, Nastro, anello, pianoCamera, raggiera, nuovo, chiudi, bagliore, fendente, ventaglio, indietro, ROSSO } from './mischia-base.js'
import { EFFETTI as TERRA } from './mischia-terra.js'
import { EFFETTI as SEGNI } from './mischia-segni.js'

const dir = (da, a) => { const x = a[0] - da[0], z = a[2] - da[2], l = Math.hypot(x, z) || 1; return [x / l, 0, z / l] }

// ───────── taglio: un fendente diagonale ─────────
function creaTaglio (ctx) {
  const S = nuovo(ctx, 40), a = S.a, T = 0.19
  const f = fendente(S, a, { roll: -0.55, raggio: 2.0 * S.sc, cy: -1.75 * S.sc, a0: 2.1, a1: 1.05, t0: T - 0.06, dur: 0.2, larg: 0.1 * S.sc, svanisce: 0.22 })
  const tmp = [0, 0, 0]
  for (let i = 0; i < 9; i++) {   // scintille lungo la lama, nate quando la testa passa
    const p = (i + 1) / 10, an = f.angolo(p); f.mondo(an, tmp)
    S.P.agg({ t0: T - 0.13 + p * 0.21 * 0.9, vita: 0.28, p: [...tmp], v: [(S.rnd() - 0.2) * 2.2, 1 + S.rnd() * 1.5, (S.rnd() - 0.5) * 1.5], g: -5, drag: 2, d0: 0.17, d1: 0.05, c: S.c2, forma: 2, segui: true, attacco: 0.05 })
  }
  bagliore(S, a, T, { dim: 0.9 })
  raggiera(S.P, S.rnd, { t0: T, p: a, n: 9, vel: 3.4, vita: 0.35, d: 0.2, c: S.hot, c1: S.c1 })
  return chiudi(S, 0.48, t => f.aggiorna(t))
}

// ───────── croce: due tagli incrociati e gocce rosse ─────────
function creaCroce (ctx) {
  const S = nuovo(ctx, 70), a = S.a, T = 0.19
  const f1 = fendente(S, a, { roll: -0.9, raggio: 2.2 * S.sc, cy: -1.95 * S.sc, a0: 2.0, a1: 1.15, t0: T - 0.05, dur: 0.15, larg: 0.09 * S.sc })
  const f2 = fendente(S, a, { roll: 0.9, raggio: 2.2 * S.sc, cy: -1.95 * S.sc, a0: 2.0, a1: 1.15, t0: T + 0.09, dur: 0.15, larg: 0.09 * S.sc })
  bagliore(S, a, T, { dim: 0.7 }); bagliore(S, a, T + 0.14, { dim: 1 })
  raggiera(S.P, S.rnd, { t0: T + 0.14, p: a, n: 8, vel: 3.2, vita: 0.35, d: 0.18, c: S.hot, c1: S.c1 })
  for (let i = 0; i < 14; i++) {
    const an = S.rnd() * 6.28, v = 1.5 + S.rnd() * 2.2, t0 = T + (i < 5 ? 0 : 0.14)
    S.P.agg({ t0, vita: 0.5, p: [a[0] + (S.rnd() - 0.5) * 0.3, a[1] + (S.rnd() - 0.3) * 0.3, a[2]], v: [Math.cos(an) * v, 1.5 + S.rnd() * 1.8, Math.sin(an) * v * 0.6], g: -9, drag: 0.5, d0: 0.11 + S.rnd() * 0.06, d1: 0.06, c: ROSSO, forma: 3, attacco: 0.03 })
  }
  return chiudi(S, 0.54, t => { f1.aggiorna(t); f2.aggiorna(t) })
}

// ───────── affondo: una stoccata lineare con scia e onda d'urto ─────────
function creaAffondo (ctx) {
  const S = nuovo(ctx, 50), a = S.a, T = 0.17, d = dir(S.da, a), v = new Vector3(...d)
  const lama = new Mesh(S.R.tieni(new ConeGeometry(0.04 * S.sc, 1.1 * S.sc, 8)), S.R.tieni(new MeshBasicMaterial({ color: new Color(...S.c2), transparent: true, blending: AdditiveBlending, depthTest: false, depthWrite: false })))
  const alo = new Mesh(S.R.tieni(new ConeGeometry(0.1 * S.sc, 1.15 * S.sc, 8)), S.R.tieni(new MeshBasicMaterial({ color: new Color(...S.c1), transparent: true, opacity: 0.3, blending: AdditiveBlending, depthTest: false, depthWrite: false })))
  for (const m of [lama, alo]) { m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), v); m.renderOrder = 16; S.R.gruppo.add(m) }
  const n1 = new Nastro(S.R, 20), n2 = new Nastro(S.R, 20)
  const anello1 = anello(S.R, S.c2, 'camera'), anello2 = anello(S.R, S.c1, 'suolo')
  const pc = pianoCamera(S.R, new Vector3(...a)); pc.add(anello1.mesh)
  anello2.mesh.position.set(a[0], 0.04, a[2])
  bagliore(S, a, T, { dim: 0.8 })
  raggiera(S.P, S.rnd, { t0: T, p: a, n: 8, vel: 3.6, vita: 0.32, d: 0.2, c: S.hot, c1: S.c1, su: 0.1 })
  for (let i = 0; i < 5; i++) {   // linee di velocità lungo la direzione
    S.P.agg({ t0: T, vita: 0.28, p: [a[0] - d[0] * 0.3, a[1] + (i - 2) * 0.1, a[2] + (i - 2) * 0.12], v: [d[0] * 6, 0, d[2] * 6], g: 0, drag: 2, d0: 0.5, d1: 0.3, c: S.c2, forma: 2, rot: Math.atan2(0, d[0]) + (d[0] < 0 ? Math.PI : 0), attacco: 0.05, a: 0.8 })
  }
  const lat = [-d[2], 0, d[0]]
  const agg = t => {
    const p = clamp01((t - 0.02) / (T - 0.02)), spinta = dentro(p) * 1.6 - 1.35 + clamp01((t - T) / 0.12) * 0.3   // posizione della punta rispetto ad `a` lungo d
    const vivo = 1 - smooth((t - T - 0.14) / 0.16), L = 1.3
    const hx = a[0] + d[0] * spinta, hz = a[2] + d[2] * spinta, y = a[1]
    lama.position.set(hx - d[0] * 0.4 * S.sc, y, hz - d[2] * 0.4 * S.sc); alo.position.copy(lama.position)
    lama.scale.setScalar(Math.max(vivo, 1e-3) * (t < 0.01 ? 0 : 1)); alo.scale.copy(lama.scale)
    lama.visible = alo.visible = vivo > 0.01 && t > 0.01
    for (let i = 0; i < 20; i++) {
      const u = i / 19, s = hx - d[0] * L * (1 - u) * (0.4 + 0.6 * p) , sz = hz - d[2] * L * (1 - u) * (0.4 + 0.6 * p)
      const col = [mix(S.c1[0], 1, u), mix(S.c1[1], 1, u), mix(S.c1[2], 1, u)]
      n1.set(i, s, y, sz, 0, 1, 0, 0.05 * u ** 0.7 * S.sc, col, u * u * vivo)
      n2.set(i, s, y, sz, lat[0], 0, lat[2], 0.04 * u ** 0.7 * S.sc, col, u * u * vivo * 0.8)
    }
    n1.fine(); n2.fine()
    const q = (t - T) / 0.4
    anello1.imposta(0.2 + fuori(q) * 1.1, q > 0 && q < 1 ? (1 - q) * 0.9 : 0)
    const q2 = (t - T - 0.03) / 0.4
    anello2.imposta(0.2 + fuori(q2) * 1.5, q2 > 0 && q2 < 1 ? (1 - q2) * 0.7 : 0)
  }
  return chiudi(S, 0.48, agg)
}

// ───────── urto: un colpo contundente ─────────
function creaUrto (ctx) {
  const S = nuovo(ctx, 70), a = S.a, T = 0.2
  const pc = pianoCamera(S.R, new Vector3(...a))
  const r1 = anello(S.R, S.c2, 'camera'), r2 = anello(S.R, S.c1, 'suolo'), r3 = anello(S.R, S.c2, 'suolo'), r4 = anello(S.R, S.c1, 'camera')
  const spuntoni = ventaglio(S.R, pc, 10), ang0 = S.rnd() * 6.28, lun = Array.from({ length: 10 }, (_, i) => (i % 2 ? 0.75 : 1.1) * (0.85 + S.rnd() * 0.3))
  pc.add(r1.mesh, r4.mesh); for (const r of [r2, r3]) r.mesh.position.set(a[0], 0.04, a[2])
  bagliore(S, a, T, { dim: 0.8 })
  S.P.agg({ t0: T, vita: 0.1, p: a, d0: 0.9, d1: 1.5, c: S.hot, forma: 0, a: 0.9, attacco: 0.05 })
  raggiera(S.P, S.rnd, { t0: T, p: a, n: 8, vel: 3.4, vita: 0.36, d: 0.22, c: S.hot, c1: S.c1 })
  for (let i = 0; i < 10; i++) {   // polvere che sale e si gonfia
    const an = S.rnd() * 6.28, r = 0.2 + S.rnd() * 0.5
    S.P.agg({ t0: T + S.rnd() * 0.05, vita: 0.5, p: [a[0] + Math.cos(an) * r * 0.6, 0.1, a[2] + Math.sin(an) * r * 0.6], v: [Math.cos(an) * 1.4, 0.7 + S.rnd() * 0.7, Math.sin(an) * 1.0], g: 0, drag: 2.5, d0: 0.25, d1: 0.8, c: [0.55, 0.5, 0.42], a: 0.55, forma: 6, attacco: 0.1 })
  }
  // frammenti: veri pezzetti solidi che saltano
  const NF = 9, fr = new InstancedMesh(S.R.tieni(new BoxGeometry(1, 1, 1)), S.R.tieni(new MeshBasicMaterial({ color: 0xffffff })), NF), o = new Object3D(), dati = []
  for (let i = 0; i < NF; i++) {
    const an = (i / NF) * 6.28 + S.rnd(), v = 1.6 + S.rnd() * 1.8
    dati.push({ v: [Math.cos(an) * v, 2.6 + S.rnd() * 2.4, Math.sin(an) * v * 0.6], s: 0.07 + S.rnd() * 0.09, r: [S.rnd() * 9, S.rnd() * 9, S.rnd() * 9] })
    fr.setColorAt(i, new Color(...(i % 3 ? [S.c1[0] * 0.7, S.c1[1] * 0.7, S.c1[2] * 0.7] : [0.5, 0.46, 0.4])))
  }
  fr.frustumCulled = false; S.R.gruppo.add(fr)
  const agg = t => {
    const q = (t - T) / 0.42
    r1.imposta((0.2 + fuori(q) * 0.6) * S.sc, q > 0 && q < 1 ? (1 - q) ** 1.5 * 0.8 : 0)
    r4.imposta((0.1 + fuori(q * 1.2) * 0.55) * S.sc, q > 0 && q < 0.83 ? (1 - q * 1.2) * 0.8 : 0)
    r2.imposta((0.2 + fuori(q) * 0.95) * S.sc, q > 0 && q < 1 ? (1 - q) ** 1.3 * 0.9 : 0)
    r3.imposta((0.1 + fuori(q - 0.12) * 0.7) * S.sc, q > 0.12 && q < 1 ? (1 - q) * 0.7 : 0)
    const ts = (t - T) / 0.3, pop = indietro(ts / 0.45), sv = 1 - smooth((ts - 0.35) / 0.65)
    spuntoni.mesh.visible = ts > 0 && sv > 0
    for (let i = 0; i < 10; i++) spuntoni.imposta(i, ang0 + i * 0.628, lun[i] * 0.62 * S.sc * pop, 0.17 * S.sc, 0.12, S.c1, S.hot, sv)
    spuntoni.fine()
    const tau = t - T
    for (let i = 0; i < NF; i++) {
      const dd = dati[i], vis = tau > 0 && tau < 0.5, sc = vis ? dd.s * (1 - smooth(tau / 0.5) * 0.6) : 0
      o.position.set(a[0] + dd.v[0] * tau, a[1] - 0.15 + dd.v[1] * tau - 5.5 * tau * tau * 1.0, a[2] + dd.v[2] * tau)
      o.rotation.set(dd.r[0] + tau * 9, dd.r[1] + tau * 7, dd.r[2]); o.scale.setScalar(sc); o.updateMatrix(); fr.setMatrixAt(i, o.matrix)
    }
    fr.instanceMatrix.needsUpdate = true
  }
  return chiudi(S, 0.54, agg)
}

// ───────── spazzata: un arco ampio su tutti i bersagli ─────────
function creaSpazzata (ctx) {
  const S = nuovo(ctx, 90), T = 0.19, passo = 0.07, b = S.bers, n = b.length
  const c = [0, 0, 0]; for (const p of b) { c[0] += p[0] / n; c[1] += p[1] / n; c[2] += p[2] / n }
  const k = 1 + 0.25 * (n - 1)
  const f = fendente(S, c, { roll: 0.12, raggio: 2.5 * S.sc * k, cy: -2.1 * S.sc * k, a0: 2.4, a1: 0.75, t0: T - 0.1, dur: 0.2 + passo * (n - 1), coda: 0.4, larg: 0.12 * S.sc, svanisce: 0.2 })
  for (let i = 0; i < n; i++) {
    const tt = T + i * passo
    bagliore(S, b[i], tt, { dim: 0.8 })
    raggiera(S.P, S.rnd, { t0: tt, p: b[i], n: 7, vel: 3.2, vita: 0.33, d: 0.19, c: S.hot, c1: S.c1 })
  }
  return chiudi(S, 0.58, t => f.aggiorna(t))
}

// ───────── turbine: nastri che girano attorno all'eroe, poi i tagli ─────────
function creaTurbine (ctx) {
  const S = nuovo(ctx, 90), T = 0.3, passo = 0.07, da = S.da, b = S.bers
  const nastri = [0, 1, 2, 3].map(() => new Nastro(S.R, 26)), r = anello(S.R, S.c2, 'suolo'); r.mesh.position.set(da[0], 0.04, da[2])
  S.P.agg({ t0: 0, vita: 0.62, p: [da[0], da[1] + 0.5, da[2]], d0: 1.0, d1: 2.2, c: S.c1, a: 0.55, forma: 0, attacco: 0.2 })
  S.P.agg({ t0: 0.05, vita: 0.4, p: [da[0], da[1] + 0.5, da[2]], d0: 0.5, d1: 1.2, c: S.hot, a: 0.7, forma: 0, attacco: 0.2 })
  const tagli = b.map((p, i) => {
    const tt = T + i * passo
    bagliore(S, p, tt, { dim: 0.7 }); raggiera(S.P, S.rnd, { t0: tt, p, n: 6, vel: 3, vita: 0.32, d: 0.18, c: S.hot, c1: S.c1 })
    return fendente(S, p, { roll: i % 2 ? 0.5 : -0.5, raggio: 0.8, cy: -0.3, a0: 2.4, a1: 0.7, t0: tt - 0.08, dur: 0.16, larg: 0.14 * S.sc })
  })
  const agg = t => {
    const vita = 1 - smooth((t - 0.5) / 0.26)
    const ang0 = 24 * t - 0.9 * t * t * 10
    for (let k = 0; k < 4; k++) {
      const n = nastri[k], fase = k * 1.571
      n.mesh.visible = vita > 0.01
      for (let i = 0; i < 26; i++) {
        const u = i / 25, an = fase + ang0 - 2.6 * (1 - u), rad = (0.45 + 0.55 * smooth(t / 0.35)) * (1 + 0.1 * Math.sin(an * 2 + k))
        const co = Math.cos(an), si = Math.sin(an), y = da[1] + 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(an * 0.8 + k * 2)) + 0.25 * (u - 0.5) * 0
        const w = 0.17 * u ** 0.8 * (1 - u ** 6), col = [mix(S.c1[0], S.hot[0], u ** 4) * 1.15, mix(S.c1[1], S.hot[1], u ** 4) * 1.15, mix(S.c1[2], S.hot[2], u ** 4) * 1.15]
        n.set(i, da[0] + co * rad, y, da[2] + si * rad, 0.35 * co, 1, 0.35 * si, w, col, u ** 0.8 * vita * clamp01(t / 0.08))
      }
      n.fine()
    }
    const q = t / 0.5; r.imposta(0.4 + fuori(q) * 1.4, q < 1 ? (1 - q) * 0.9 : 0)
    for (const f of tagli) f.aggiorna(t)
  }
  return chiudi(S, 0.76, agg)
}

// ───────── onda: tre onde d'urto dall'eroe (grido, ruggito) ─────────
function creaOnda (ctx) {
  const S = nuovo(ctx, 50), da = S.da, a = S.a, T = 0.24, d = dir(da, a), verso = Math.atan2(d[2], d[0]), passo = 0.06
  const lun = Math.hypot(a[0] - da[0], a[2] - da[2]), bocca = [da[0], da[1] + 0.65, da[2]]
  const onde = [0, 1, 2].map(() => ({ alone: new Nastro(S.R, 24), anima: new Nastro(S.R, 24) }))
  const r = anello(S.R, S.c2, 'suolo'); r.mesh.position.set(da[0], 0.04, da[2])
  S.P.agg({ t0: 0, vita: 0.3, p: bocca, d0: 0.5, d1: 1.6, c: S.hot, forma: 1, attacco: 0.1 })
  S.P.agg({ t0: 0, vita: 0.45, p: bocca, d0: 0.8, d1: 2.0, c: S.c1, a: 0.7, forma: 0, attacco: 0.1 })
  bagliore(S, a, T, { dim: 0.9, c2: S.c2 })
  raggiera(S.P, S.rnd, { t0: T, p: a, n: 8, vel: 3.2, vita: 0.35, d: 0.2, c: S.hot, c1: S.c1 })
  const agg = t => {
    onde.forEach((o, k) => {
      const q = (t - k * passo) / 0.52, vis = q > 0 && q < 1
      o.alone.mesh.visible = o.anima.mesh.visible = vis
      if (!vis) return
      const rad = 0.4 + (lun + 0.9 - 0.4) * fuori(q) * 1.0 * (0.55 + 0.45 * smooth(q * 3)), span = 1.05 - 0.2 * q, al = (1 - q) ** 1.2 * clamp01(q * 9), y = da[1] + 0.2 + k * 0.28
      for (let i = 0; i < 24; i++) {
        const u = i / 23, an = verso + (u - 0.5) * 2 * span, co = Math.cos(an), si = Math.sin(an), env = Math.sin(u * Math.PI) ** 0.7
        const w = (0.2 - 0.12 * q) * env, col = [mix(S.c1[0], S.hot[0], env * 0.25), mix(S.c1[1], S.hot[1], env * 0.25), mix(S.c1[2], S.hot[2], env * 0.25)]
        o.alone.set(i, da[0] + co * rad, y, da[2] + si * rad, co, 0.25, si, w, col, al * env * 0.7)
        o.anima.set(i, da[0] + co * rad, y, da[2] + si * rad, co, 0.25, si, w * 0.3, S.hot, al * env)
      }
      o.alone.fine(); o.anima.fine()
    })
    const q = t / 0.5; r.imposta(0.3 + fuori(q) * 1.3, q < 1 ? (1 - q) * 0.8 : 0)
  }
  return chiudi(S, 0.66, agg)
}

// ───────── fiammata: un cono di fuoco attraverso il campo ─────────
function creaFiammata (ctx) {
  const S = nuovo(ctx, 170), da = S.da, a = S.a, T = 0.22, d = dir(da, a), lat = [-d[2], 0, d[0]], bocca = [da[0] + d[0] * 0.35, da[1] + 0.6, da[2] + d[2] * 0.35]
  const rosso = scuro1(S.c1)
  S.P.agg({ t0: 0, vita: 0.25, p: bocca, d0: 0.5, d1: 1.0, c: S.hot, forma: 0, attacco: 0.1 })
  for (let i = 0; i < 90; i++) {   // il getto: nuvole di fuoco che si allargano a cono
    const t0 = i / 90 * 0.4, v = 6 + S.rnd() * 7, sx = (S.rnd() - 0.5) * 1.5, sy = (S.rnd() - 0.35) * 0.9
    S.P.agg({ t0, vita: 0.32 + S.rnd() * 0.15, p: bocca, v: [d[0] * v + lat[0] * sx * v * 0.45, sy * v * 0.45, d[2] * v + lat[2] * sx * v * 0.45], g: 2.5, drag: 2.2, d0: 0.2, d1: 1.0 + S.rnd() * 0.55, c: S.hot, c1: rosso, a: 0.5, forma: 0, attacco: 0.15 })
  }
  for (let i = 0; i < 34; i++) {   // lingue di fiamma vere, sopra al getto
    const t0 = 0.03 + i / 34 * 0.4, v = 4.5 + S.rnd() * 6, sx = (S.rnd() - 0.5) * 1.3
    S.P.agg({ t0, vita: 0.42, p: bocca, v: [d[0] * v + lat[0] * sx * 2.6, 0.3, d[2] * v + lat[2] * sx * 2.6], g: 2.4, drag: 2.1, d0: 0.4, d1: 1.35, c: S.c1, c1: rosso, a: 0.95, forma: 5, fase: S.rnd() * 6, attacco: 0.15 })
  }
  for (let i = 0; i < 18; i++) {   // braci
    const t0 = 0.05 + S.rnd() * 0.4, v = 5 + S.rnd() * 6
    S.P.agg({ t0, vita: 0.5, p: bocca, v: [d[0] * v + (S.rnd() - 0.5) * 2, 1 + S.rnd() * 1.5, d[2] * v + (S.rnd() - 0.5) * 2], g: 2, drag: 1.6, d0: 0.1, d1: 0.04, c: S.hot, c1: S.c1, forma: 0, attacco: 0.03 })
  }
  bagliore(S, a, T, { dim: 1 })
  for (const p of S.bers.slice(1)) bagliore(S, p, T + 0.04, { dim: 0.7 })
  raggiera(S.P, S.rnd, { t0: T, p: a, n: 8, vel: 3, vita: 0.4, d: 0.2, c: S.hot, c1: S.c1 })
  return chiudi(S, 0.68)
}
const scuro1 = c => [c[0] * 0.55, c[1] * 0.3, c[2] * 0.25]

// ───────── la tabella (secondi) ─────────
const g = (via, arrivo, durata, extra, crea) => ({ via, arrivo, durata, ...extra, crea })
export const EFFETTI = {
  taglio: g('vicino', 0.19, 0.48, {}, creaTaglio),
  croce: g('vicino', 0.19, 0.54, {}, creaCroce),
  affondo: g('vicino', 0.17, 0.48, {}, creaAffondo),
  urto: g('vicino', 0.20, 0.54, {}, creaUrto),
  spazzata: g('vicino', 0.19, 0.58, { passo: 0.07 }, creaSpazzata),
  turbine: g('attorno', 0.30, 0.76, { passo: 0.07 }, creaTurbine),
  ...TERRA,
  onda: g('onda', 0.24, 0.66, { passo: 0.06 }, creaOnda),
  fiammata: g('onda', 0.22, 0.68, { passo: 0.06 }, creaFiammata),
  ...SEGNI,
}
export const GRUPPO = Object.keys(EFFETTI)

// Aure sul mostro: nube, esplode, rogo, blocco, sonno (via 'su-chi': nascono su `a`).
import { THREE, nuovo, effetto, cl, sm, ou, ob, seg, trap, lerp, mescola, palla } from './aure-base.js'
const { Color, Vector3 } = THREE
const TWO = Math.PI * 2

// ── nube: una sporella cade, scoppia in una nuvola di spore e veleno ──
function nube (ctx) {
  const f = nuovo(ctx, ctx.a), k = f.k, ARR = 0.15, D = 0.76, R = f.rnd
  const scuro = f.tinta.clone().multiplyScalar(0.3), mid = f.tinta.clone().multiplyScalar(0.62)
  const fumo = f.pool('fumo', 24, true), velo = f.pool('fumo', 14), spore = f.pool('alone', 36), stelle = f.pool('stella', 8)
  const P = [...Array(24)].map(() => ({ th: R() * TWO, r: (0.1 + R() * 0.4) * k, h: (0.05 + R() * 0.8) * k, rit: R() * 0.1, s: (0.34 + R() * 0.32) * k, m: R() }))
  const S = [...Array(36)].map(() => ({ th: R() * TWO, el: 0.2 + R() * 1.1, v: (0.5 + R() * 1.1) * k, ph: R() * TWO, s: (0.04 + R() * 0.05) * k }))
  const baccello = f.mesh(new THREE.SphereGeometry(0.1 * k, 12, 8), f.add(f.tinta2, 1)), bagliore = f.sprite('alone', 0.7 * k, 0.7 * k, f.tinta, 0.9)
  const piano = f.disco('anello', f.tinta, 0.7)
  const lampo = f.sprite('alone', 1.4 * k, 1.4 * k, f.tinta2, 0)
  return effetto(f, D, t => {
    const pre = t < ARR, u = seg(t, ARR, D)
    baccello.visible = bagliore.visible = pre
    if (pre) { const y = lerp(1.9, 0.5, sm(t / ARR)) * k; baccello.position.set(0, y, 0); bagliore.position.set(0, y, 0); baccello.scale.setScalar(0.8 + 0.5 * t / ARR) }
    lampo.material.opacity = 0.4 * Math.max(0, 1 - seg(t, ARR, ARR + 0.14)) * (t >= ARR); lampo.position.set(0, 0.45 * k, 0)
    const sc = ou(seg(t, ARR, ARR + 0.2)) * 1.5 + 0.1
    piano.scale.setScalar(sc * k * 0.55); piano.material.opacity = 0.4 * (t >= ARR) * (1 - sm(seg(u, 0.2, 1)))
    P.forEach((p, i) => {
      const tt = cl((t - ARR - p.rit) / 0.45), e = ou(tt), vita = tt <= 0 ? 0 : sm(seg(tt, 0, 0.25)) * (1 - sm(seg(u, 0.5, 1)))
      const x = Math.cos(p.th) * p.r * (0.3 + 1.2 * e), z = Math.sin(p.th) * p.r * (0.3 + 1.2 * e), y = 0.12 * k + p.h * e * 0.8 + u * 0.22 * k
      fumo.pon(i, x, y, z, p.s * (0.5 + e * 1.15), undefined, mescola(scuro, mid, p.m), 0.92 * vita, p.th)
      if (i < 14) velo.pon(i, x * 0.8, y + 0.04 * k, z * 0.8, p.s * (0.6 + e * 0.8), undefined, f.tinta, 0.12 * vita, -p.th)
    })
    S.forEach((s, i) => {
      const tt = (t - ARR) * 1.2; if (tt <= 0) return spore.spegni(i)
      const d = ou(Math.min(tt, 0.7)) * s.v, ca = Math.cos(s.el)
      const vita = sm(seg(tt, 0, 0.12)) * (1 - sm(seg(u, 0.55, 1))) * (0.65 + 0.35 * Math.sin(t * 22 + s.ph))
      spore.pon(i, Math.cos(s.th) * d * ca * 0.8, 0.25 * k + Math.sin(s.el) * d * 0.6 + 0.15 * k * tt, Math.sin(s.th) * d * ca * 0.8, s.s * 1.6, undefined, f.tinta2, vita * 0.8)
    })
    for (let i = 0; i < 8; i++) { const tt = t - ARR; if (tt < 0 || tt > 0.35) { stelle.spegni(i); continue } const a = i / 8 * TWO + 0.4, d = ou(tt / 0.35) * 0.8 * k; stelle.pon(i, Math.cos(a) * d, 0.5 * k + Math.sin(a * 3) * 0.2 * k, Math.sin(a) * d, 0.2 * k * (1 - tt / 0.35), undefined, f.tinta2, 1 - tt / 0.35, a) }
  })
}

// ── esplode: palla di fuoco grumosa, onda d'urto, scintille e fumo ──
function esplode (ctx) {
  const f = nuovo(ctx, ctx.a), k = f.k, ARR = 0.11, D = 0.72, R = f.rnd
  const caldo = f.tinta.clone().lerp(new Color(1, 0.2, 0.02), 0.4), fumoC = f.tinta.clone().multiplyScalar(0.12)
  const esterna = palla(f, f.tinta.clone().multiplyScalar(0.55), caldo, { grumi: 0.05, rumore: 0.35 })
  const interna = palla(f, caldo, new Color(1, 0.42, 0.08), { grumi: 0.04, rumore: 0.15 })
    const onda = f.disco('anello', f.tinta2, 1), lampo = f.sprite('alone', 2.2 * k, 2.2 * k, caldo, 0), carica = f.sprite('alone', 0.5 * k, 0.5 * k, caldo, 0)
  const faville = f.pool('stella', 44), braci = f.pool('alone', 30), fumo = f.pool('fumo', 14, true)
  const F = [...Array(44)].map(() => { const th = R() * TWO, el = 0.1 + R() * 1.25; return { d: new Vector3(Math.cos(th) * Math.cos(el), Math.sin(el), Math.sin(th) * Math.cos(el)), v: (2 + R() * 3.2) * k, vita: 0.28 + R() * 0.3, s: (0.12 + R() * 0.12) * k, ph: R() * TWO } })
  const B = [...Array(30)].map(() => ({ th: R() * TWO, v: (0.6 + R() * 1.4) * k, ph: R() }))
  const Fu = [...Array(14)].map(() => ({ th: R() * TWO, r: (0.2 + R() * 0.7) * k, s: (0.4 + R() * 0.4) * k, rit: 0.1 + R() * 0.14 }))
  const cy = 0.5 * k
  const e = effetto(f, D, (t, dt) => {
    const u = seg(t, ARR, D), pre = t < ARR, tt = t - ARR
    carica.material.opacity = pre ? 0.6 + 0.4 * t / ARR : 0; carica.scale.setScalar((0.5 + 0.5 * (pre ? t / ARR : 1)) * k); carica.position.set(0, cy, 0)
    const r = (0.18 + 0.82 * ou(seg(tt, -0.01, 0.34))) * k * (tt < -0.01 ? 0 : 1) * 0.8, fade = 1 - sm(seg(t, 0.36, D))
    esterna.visible = interna.visible = tt >= -0.01
    esterna.position.set(0, cy + 0.18 * k * u, 0); interna.position.copy(esterna.position)
    esterna.scale.setScalar(r * (1 + 0.06 * Math.sin(t * 40))); esterna.rotation.set(t * 3, t * 4, 0); esterna.opacita(0.75 * fade); esterna.tempo(t)
    interna.scale.setScalar(r * (0.6 - 0.35 * seg(t, 0.2, 0.55))); interna.rotation.set(-t * 5, t * 2, 1); interna.opacita(0.55 * fade); interna.tempo(t * 1.3)
    lampo.position.set(0, cy, 0); lampo.material.opacity = tt < 0 ? 0 : 0.8 * Math.max(0, 1 - tt / 0.2); lampo.scale.setScalar((1.2 + 2 * ou(tt / 0.2)) * k)
    const w = ou(seg(tt, 0, 0.45)); onda.scale.setScalar((0.2 + 1.7 * w) * k); onda.material.opacity = tt < 0 ? 0 : (1 - w) * 0.95
    F.forEach((p, i) => { const a = tt / p.vita; if (tt < 0 || a >= 1) return faville.spegni(i); const d = p.v * p.vita * ou(a) * 1.15, g = 6 * k * tt * tt
      faville.pon(i, p.d.x * d, Math.max(0.03, cy + p.d.y * d - g), p.d.z * d, p.s * (1 - a * 0.6), undefined, a < 0.4 ? caldo : f.tinta2, 1 - a * a, p.ph + tt * 6) })
    B.forEach((b, i) => { const a = tt / 0.7; if (tt < 0.02 || a >= 1) return braci.spegni(i); const d = b.v * ou(Math.min(1, tt * 2))
      braci.pon(i, Math.cos(b.th) * d, cy + 0.2 * k + tt * 0.9 * k * (0.5 + b.ph), Math.sin(b.th) * d, 0.09 * k, undefined, f.tinta, (1 - a) * (0.6 + 0.4 * Math.sin(t * 30 + b.ph * 9))) })
    Fu.forEach((p, i) => { const a = (t - ARR - p.rit) / 0.42; if (a <= 0 || a >= 1) return fumo.spegni(i); const d = p.r * ou(a)
      fumo.pon(i, Math.cos(p.th) * d, cy + 0.2 * k + 0.7 * k * a, Math.sin(p.th) * d, p.s * (0.6 + a), undefined, fumoC, 0.45 * Math.sin(Math.PI * Math.min(1, a * 1.1))) })
  })
  e.scuote = true
  return e
}

// ── rogo: il mostro avvolto da lingue di fuoco che guizzano ──
function rogo (ctx) {
  const f = nuovo(ctx, ctx.a), k = f.k, ARR = 0.14, D = 0.76, R = f.rnd
  const N = 18, L = [...Array(N)].map((_, i) => {
    const th = (i + R() * 0.7) / N * TWO, r = (0.2 + R() * 0.16) * k
    const ext = f.sprite('fiamma', 0.32 * k, 0.8 * k, f.tinta, 0.9), nuc = f.sprite('fiamma', 0.18 * k, 0.5 * k, f.tinta2, 0.95)
    ext.center.set(0.5, 0.05); nuc.center.set(0.5, 0.05)
    return { th, r, y0: R() * 0.5 * k, h: (0.55 + R() * 0.55) * k, w: (0.22 + R() * 0.14) * k, ph: R() * TWO, ext, nuc, rit: R() * 0.1 }
  })
  const alone = f.sprite('alone', 1.7 * k, 1.7 * k, f.tinta, 0)
  const disco = f.disco('alone', f.tinta, 0.8), braci = f.pool('stella', 22)
  const B = [...Array(22)].map(() => ({ th: R() * TWO, r: (0.1 + R() * 0.4) * k, v: (0.6 + R() * 0.9) * k, ph: R() * 3, rit: R() * 0.35 }))
  return effetto(f, D, t => {
    const env = trap(t, ARR - 0.12, ARR + 0.1, 0.5, D)
    alone.position.set(0, 0.5 * k, 0); alone.material.opacity = 0.5 * env; disco.scale.setScalar(1.1 * k); disco.material.opacity = 0.7 * env
    L.forEach(l => {
      const a = sm(seg(t - l.rit, ARR - 0.12, ARR + 0.12)) * (1 - sm(seg(t, 0.48 + l.rit * 0.5, D)))
      const fl = 0.78 + 0.22 * Math.sin(t * 19 + l.ph) + 0.1 * Math.sin(t * 33 + l.ph * 2), sway = Math.sin(t * 9 + l.ph) * 0.05 * k
      const x = Math.cos(l.th) * l.r + sway, z = Math.sin(l.th) * l.r, y = l.y0 * 0.6
      l.ext.position.set(x, y, z); l.ext.scale.set(l.w * (0.85 + 0.15 * fl), l.h * fl * a, 1); l.ext.material.opacity = 0.9 * a; l.ext.material.rotation = Math.sin(t * 7 + l.ph) * 0.1
      l.nuc.position.set(x, y + 0.02 * k, z); l.nuc.scale.set(l.w * 0.55, l.h * 0.6 * fl * a, 1); l.nuc.material.opacity = a; l.nuc.material.rotation = l.ext.material.rotation
    })
    B.forEach((b, i) => { const a = (t - ARR - b.rit) / 0.4; if (a <= 0 || a >= 1) return braci.spegni(i); braci.pon(i, Math.cos(b.th) * b.r + Math.sin(t * 8 + b.ph) * 0.04 * k, 0.2 * k + b.v * a, Math.sin(b.th) * b.r, 0.12 * k * (1 - a * 0.5), undefined, f.tinta2, Math.sin(Math.PI * a)) })
  })
}

// ── blocco: cristalli di ghiaccio crescono dal basso e imprigionano il mostro ──
function blocco (ctx) {
  const f = nuovo(ctx, ctx.a), k = f.k, ARR = 0.2, D = 0.76, R = f.rnd
  const ghiaccio = f.tinta.clone().lerp(new Color(0.8, 0.95, 1), 0.35), spigoli = new Color(0.8, 0.96, 1)
  const cr = (w, h) => { const pts = [new THREE.Vector2(0.001, 0), new THREE.Vector2(w, 0), new THREE.Vector2(w * 1.05, h * 0.68), new THREE.Vector2(0.001, h)]; return new THREE.LatheGeometry(pts, 6) }
  const mat = (o = 0.72) => f.sol(ghiaccio, { opacity: o, emissive: f.tinta, emissiveIntensity: 0.45, roughness: 0.12, metalness: 0.15, depthWrite: false })
  const C = [...Array(11)].map((_, i) => {
    const th = i / 11 * TWO + R() * 0.3, r = (0.3 + R() * 0.22) * k, h = (0.5 + R() * 0.5) * k, w = (0.09 + R() * 0.06) * k
    const g = new THREE.Group(), m = f.mesh(cr(w, h), mat(), g); const l = f.linee(m.geometry, spigoli, 0.9, g)
    g.position.set(Math.cos(th) * r, 0, Math.sin(th) * r); g.rotation.set(Math.sin(th) * 0.22, 0, -Math.cos(th) * 0.22); f.g.add(g)
    return { g, m, l, rit: i * 0.018, o: R() }
  })
  const grande = new THREE.Group(); f.g.add(grande)
  const gm = f.mesh(cr(0.4 * k, 0.95 * k), mat(0.3), grande); const gl = f.linee(gm.geometry, spigoli, 0.7, grande)
  const lastra = f.disco('brina', ghiaccio, 0.9), nebbia = f.pool('fumo', 10), scint = f.pool('stella', 18)
  const N = [...Array(10)].map(() => ({ th: R() * TWO, r: (0.2 + R() * 0.7) * k, ph: R() * TWO, s: 0.12 + R() * 0.14 }))
  const Sc = [...Array(18)].map(() => ({ th: R() * TWO, r: (0.2 + R() * 0.4) * k, y: R() * 1.1 * k, ph: R() * 6, rit: ARR + R() * 0.3 }))
  const nucleo = f.sprite('alone', 1.2 * k, 1.5 * k, f.tinta, 0)
  return effetto(f, D, t => {
    const fine = 1 - sm(seg(t, 0.58, D)), cresce = sm(seg(t, 0, 0.26))
    lastra.scale.setScalar(0.85 * k * ou(seg(t, 0, 0.2))); lastra.material.opacity = 0.55 * fine
    nucleo.position.set(0, 0.55 * k, 0); nucleo.material.opacity = 0.5 * cresce * fine
    C.forEach(c => { const g = ob(seg(t, c.rit, c.rit + 0.24)); c.g.scale.set(lerp(0.4, 1, g), Math.max(0.001, g) * (1 + 0.06 * (1 - fine)), lerp(0.4, 1, g)); c.m.material.opacity = 0.72 * fine; c.l.material.opacity = 0.9 * fine })
    const gg = ou(seg(t, 0.06, ARR + 0.04)); grande.scale.set(lerp(0.5, 1, gg), Math.max(0.001, gg), lerp(0.5, 1, gg)); gm.material.opacity = 0.3 * fine; gl.material.opacity = 0.7 * fine
    N.forEach((n, i) => nebbia.pon(i, Math.cos(n.th + t) * n.r, 0.08 * k, Math.sin(n.th + t) * n.r, n.s * k * 2.2, undefined, spigoli, 0.2 * fine * seg(t, 0, 0.1), n.ph))
    Sc.forEach((s, i) => { const a = (t - s.rit) / 0.3; if (a <= 0 || a >= 1) return scint.spegni(i); scint.pon(i, Math.cos(s.th) * s.r, s.y, Math.sin(s.th) * s.r, 0.2 * k * Math.sin(Math.PI * a), undefined, spigoli, 1, s.ph + t * 3) })
  })
}

// ── sonno: ninna nanna, zeta e note che salgono da una nuvoletta di polvere di stelle ──
function sonno (ctx) {
  const f = nuovo(ctx, ctx.a), k = f.k, ARR = 0.12, D = 0.78, R = f.rnd
  const lunaC = f.tinta2.clone().lerp(new Color(1, 0.95, 0.7), 0.4)
  const G = ['zeta', 'nota', 'zeta', 'nota', 'zeta'].map((nome, i) => ({ s: f.sprite(nome, 0.2 * k, 0.2 * k, i % 2 ? f.tinta : f.tinta2, 0), h: f.sprite('alone', 0.5 * k, 0.5 * k, f.tinta, 0), t0: ARR + i * 0.085, x0: (i - 2) * 0.1 * k, ph: i * 1.7, S: [0.3, 0.26, 0.42, 0.34, 0.56][i] * k }))
  const luna = f.sprite('luna', 0.5 * k, 0.5 * k, lunaC, 0), nuvola = f.pool('fumo', 7), polvere = f.pool('stella', 30)
  const Pu = [...Array(7)].map((_, i) => ({ x: (i - 3) * 0.12 * k + (R() - 0.5) * 0.1 * k, y: (R() - 0.5) * 0.12 * k, s: (0.3 + R() * 0.2) * k }))
  const St = [...Array(30)].map(() => ({ a: R() * TWO, r: (0.1 + R() * 0.5) * k, v: 1 + R() * 2, y: R() * 0.35 * k, ph: R() * 6, s: 0.06 + R() * 0.08 }))
  return effetto(f, D, t => {
    const env = trap(t, 0.04, ARR + 0.14, 0.58, D), cy = 1.28 * k
    Pu.forEach((p, i) => nuvola.pon(i, p.x, cy + p.y + 0.02 * Math.sin(t * 4 + i), 0, p.s * (0.6 + 0.4 * ou(seg(t, 0.04, 0.3))), p.s * 0.8, i % 2 ? f.tinta : f.tinta2, 0.2 * env, 0))
    St.forEach((s, i) => { const a = s.a + t * s.v; polvere.pon(i, Math.cos(a) * s.r * 0.9, cy + s.y * Math.sin(a * 0.5) + (s.y - 0.15 * k), Math.sin(a) * s.r * 0.3, s.s * k * 1.3, undefined, f.tinta2, 0.7 * env * (0.4 + 0.6 * Math.sin(t * 17 + s.ph) ** 2), a) })
    luna.position.set(-0.45 * k, cy + 0.45 * k + 0.03 * Math.sin(t * 5) * k, 0); luna.scale.setScalar(0.5 * k * ob(seg(t, 0.1, 0.32))); luna.material.opacity = trap(t, 0.1, 0.3, 0.6, D) * 0.95
    G.forEach((g, i) => {
      const a = seg(t, g.t0, g.t0 + 0.5), vis = Math.sin(Math.PI * Math.min(1, a * 1.02)) ** 0.6 * (a > 0 && a < 1)
      const y = 0.95 * k + a * 1.1 * k, x = g.x0 + Math.sin(a * 5 + g.ph) * 0.14 * k * a
      const s = g.S * (0.4 + 0.9 * ou(a))
      g.s.position.set(x, y, 0.05); g.s.scale.set(s, s, 1); g.s.material.opacity = vis; g.s.material.rotation = Math.sin(a * 4 + g.ph) * 0.3
      g.h.position.copy(g.s.position); g.h.scale.setScalar(s * 1.6); g.h.material.opacity = vis * 0.3
    })
  })
}

export const CHI = {
  nube: { via: 'su-chi', durata: 0.76, arrivo: 0.15, crea: nube },
  esplode: { via: 'su-chi', durata: 0.72, arrivo: 0.11, scuote: true, crea: esplode },
  rogo: { via: 'su-chi', durata: 0.76, arrivo: 0.14, crea: rogo },
  blocco: { via: 'su-chi', durata: 0.76, arrivo: 0.2, crea: blocco },
  sonno: { via: 'su-chi', durata: 0.78, arrivo: 0.12, crea: sonno },
}

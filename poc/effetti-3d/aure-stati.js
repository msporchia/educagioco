// Stati che restano addosso (via 'stato', durata Infinity): si tengono accesi finché non si chiama spegni(), che li fa sfumare.
// ctx.da = ctx.a = i piedi di chi li porta, ctx.scala = la sua altezza. Gli stati che tingono il corpo espongono tintaCorpo (Color) e forzaTinta (0..1, già animata).
import { THREE, nuovo, cl, sm, ou, ob, seg, lerp, mescola, scudoGeo, tex } from './aure-base.js'
const { Color, Vector3 } = THREE
const TWO = Math.PI * 2
const BIANCO = new Color(1, 1, 1)

/** Il guscio comune: `passo(t, a)` disegna lo stato con a = quanto è acceso (0..1: entra in 0.25 s, esce in 0.35 s dopo spegni). */
function stato (ctx, costruisci, tinta = null, forza = 0) {
  const f = nuovo(ctx, ctx.da ?? ctx.a), passo = costruisci(f)
  let off = -1, ult = 0
  const api = {
    gruppo: f.g, finito: false, tintaCorpo: tinta, forzaTinta: 0,
    spegni () { if (off < 0) off = ult },
    aggiorna (t) {
      ult = t; const a = sm(seg(t, 0, 0.25)) * (off < 0 ? 1 : 1 - sm(seg(t, off, off + 0.35)))
      passo(t, a); f.flush(); api.forzaTinta = forza * a
      if (off >= 0 && t > off + 0.35) { api.finito = true; f.g.visible = false }
      return true
    },
    libera: f.libera,
  }
  return api
}
const stellaGeo = (R, r, sp) => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + Math.PI / 2, q = i % 2 ? r : R; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * q, Math.sin(a) * q) } s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: sp, bevelEnabled: true, bevelSize: R * 0.06, bevelThickness: sp * 0.4, bevelSegments: 1 }).translate(0, 0, -sp / 2) }
const cristallo = (w, h) => new THREE.LatheGeometry([new THREE.Vector2(0.001, 0), new THREE.Vector2(w, 0), new THREE.Vector2(w * 1.05, h * 0.68), new THREE.Vector2(0.001, h)], 6)
const TESTA = 1.2

// ── stordito: tre stelle girano sopra la testa ──
const stordito = ctx => stato(ctx, f => {
  const k = f.k, giallo = new Color(1, 0.82, 0.25).lerp(f.tinta, 0.15)
  const geo = stellaGeo(0.11 * k, 0.05 * k, 0.03 * k)
  const S = [0, 1, 2].map(i => { const g = new THREE.Group(); f.g.add(g); const m = f.mesh(geo, f.nor(giallo.clone().multiplyScalar(0.95), 1), g); const al = f.sprite('alone', 0.45 * k, 0.45 * k, giallo, 0.22, false, g); return { g, m, al, ph: i / 3 * TWO } })
  const anello = f.mesh(new THREE.TorusGeometry(0.32 * k, 0.006 * k, 4, 40), f.add(giallo, 0.35)); anello.rotation.x = Math.PI / 2 - 0.2
  const scia = f.pool('stella', 18)
  return (t, a) => {
    const y0 = TESTA * k * 1.18
    anello.position.set(0, y0, 0); anello.material.opacity = 0.3 * a
    S.forEach((s, i) => { const th = t * 4.2 + s.ph
      s.g.position.set(Math.cos(th) * 0.34 * k, y0 + Math.sin(t * 6 + s.ph) * 0.03 * k + Math.sin(th) * 0.045 * k, Math.sin(th) * 0.34 * k)
      s.g.rotation.set(-0.7, 0, 0); s.m.rotation.z = t * 3 + i; s.g.scale.setScalar(Math.max(0.001, a)); s.al.material.opacity = 0.6 * a
      for (let j = 0; j < 5; j++) { const q = th - 0.22 * (j + 1); scia.pon(i * 5 + j, Math.cos(q) * 0.34 * k, y0 + Math.sin(t * 6 + s.ph) * 0.03 * k + Math.sin(q) * 0.045 * k, Math.sin(q) * 0.34 * k, 0.1 * k * (1 - j / 5), undefined, giallo, a * (1 - j / 5) * 0.9, q) } })
    for (let i = 15; i < 18; i++) scia.spegni(i)
  }
})

// ── avvelenato: bolle verdi salgono, la figura vira al verdastro ──
const avvelenato = ctx => stato(ctx, f => {
  const k = f.k, R = f.rnd, verde = new Color(0.35, 0.85, 0.2).lerp(f.tinta, 0.35), chiaro = verde.clone().lerp(BIANCO, 0.35)
  const bolle = f.pool('bolla', 16, true), B = [...Array(16)].map(() => ({ th: R() * TWO, r: (0.12 + R() * 0.25) * k, per: 1.1 + R() * 0.8, ph: R(), s: (0.11 + R() * 0.12) * k }))
  const nebbia = f.pool('fumo', 6, true), N = [...Array(6)].map((_, i) => ({ th: i / 6 * TWO, r: 0.3 * k }))
  const alone = f.sprite('alone', 1.4 * k, 1.7 * k, verde, 0), scint = f.pool('stella', 8)
  return (t, a) => {
    alone.position.set(0, 0.55 * k, 0); alone.material.opacity = 0.22 * a * (0.8 + 0.2 * Math.sin(t * 5))
    B.forEach((b, i) => { const c = ((t / b.per) + b.ph) % 1, y = 0.05 * k + c * 1.35 * k, w = Math.sin(c * 9 + b.th) * 0.05 * k
      bolle.pon(i, Math.cos(b.th) * b.r + w, y, Math.sin(b.th) * b.r, b.s * (0.5 + 0.7 * c), undefined, chiaro, 0.9 * a * Math.sin(Math.PI * c) ** 0.6) })
    N.forEach((n, i) => nebbia.pon(i, Math.cos(n.th + t * 0.8) * n.r, 0.1 * k, Math.sin(n.th + t * 0.8) * n.r, 0.5 * k, undefined, verde, 0.3 * a, n.th + t * 0.3))
    for (let i = 0; i < 8; i++) { const c = ((t * 0.9) + i / 8) % 1; scint.pon(i, Math.cos(i * 2.4) * 0.3 * k, 0.2 * k + c * 1.1 * k, Math.sin(i * 2.4) * 0.3 * k, 0.1 * k * Math.sin(Math.PI * c), undefined, chiaro, a, i + t) }
  }
}, new Color(0.45, 0.85, 0.3), 0.55)

// ── in fiamme: lingue di fuoco sui fianchi, scintille che salgono ──
const inFiamme = ctx => stato(ctx, f => {
  const k = f.k, R = f.rnd
  const L = [...Array(9)].map((_, i) => { const e = f.sprite('fiamma', 0.4 * k, 0.8 * k, f.tinta, 0.9), n = f.sprite('fiamma', 0.2 * k, 0.5 * k, f.tinta2, 0.95); e.center.set(0.5, 0.05); n.center.set(0.5, 0.05)
    return { th: i / 9 * TWO + R() * 0.3, r: (0.3 + R() * 0.08) * k, y: (0.0 + (i % 3) * 0.3 + R() * 0.1) * k, h: (0.5 + R() * 0.4) * k, ph: R() * TWO, e, n } })
  const glow = f.sprite('alone', 1.5 * k, 1.7 * k, f.tinta, 0), terra = f.disco('alone', f.tinta, 0), br = f.pool('stella', 16), B = [...Array(16)].map(() => ({ th: R() * TWO, r: (0.1 + R() * 0.3) * k, per: 0.8 + R() * 0.6, ph: R() }))
  return (t, a) => {
    glow.position.set(0, 0.55 * k, 0); glow.material.opacity = 0.28 * a; terra.scale.setScalar(0.8 * k); terra.material.opacity = 0.6 * a
    L.forEach(l => { const fl = 0.78 + 0.22 * Math.sin(t * 17 + l.ph) + 0.1 * Math.sin(t * 29 + l.ph * 2), x = Math.cos(l.th) * l.r + Math.sin(t * 8 + l.ph) * 0.03 * k, z = Math.sin(l.th) * l.r
      l.e.position.set(x, l.y, z); l.e.scale.set(0.4 * k * (0.85 + 0.15 * fl), l.h * fl * a + 0.001, 1); l.e.material.opacity = 0.9 * a; l.e.material.rotation = Math.sin(t * 6 + l.ph) * 0.1
      l.n.position.set(x, l.y + 0.02 * k, z); l.n.scale.set(0.2 * k, l.h * 0.62 * fl * a + 0.001, 1); l.n.material.opacity = a; l.n.material.rotation = l.e.material.rotation })
    B.forEach((b, i) => { const c = ((t / b.per) + b.ph) % 1; br.pon(i, Math.cos(b.th + c) * b.r, 0.3 * k + c * 1.1 * k, Math.sin(b.th + c) * b.r, 0.11 * k * (1 - c * 0.5), undefined, f.tinta2, a * Math.sin(Math.PI * c) ** 0.5, i + t * 2) })
  }
}, new Color(1, 0.55, 0.3), 0.22)

// ── gelato: brina e cristalli ai piedi, aspetto azzurro ──
const gelato = ctx => stato(ctx, f => {
  const k = f.k, R = f.rnd, ghiaccio = f.tinta.clone().lerp(new Color(0.8, 0.95, 1), 0.4), spigoli = new Color(0.82, 0.97, 1)
  const lastra = f.disco('brina', f.tinta, 0), nebbia = f.pool('fumo', 8), scint = f.pool('stella', 12)
  const C = [...Array(10)].map((_, i) => { const th = i / 10 * TWO + R() * 0.3, r = (0.24 + R() * 0.22) * k, h = (0.18 + R() * 0.3) * k, w = (0.05 + R() * 0.05) * k
    const g = new THREE.Group(), m = f.mesh(cristallo(w, h), f.sol(ghiaccio, { opacity: 0.8, emissive: f.tinta, emissiveIntensity: 0.45, roughness: 0.12, depthWrite: false }), g); const l = f.linee(m.geometry, spigoli, 0.9, g)
    g.position.set(Math.cos(th) * r, 0, Math.sin(th) * r); g.rotation.set(Math.sin(th) * 0.3, 0, -Math.cos(th) * 0.3); f.g.add(g); return { g, m, l, rit: i * 0.03 } })
  const N = [...Array(8)].map((_, i) => ({ th: i / 8 * TWO, r: (0.3 + (i % 2) * 0.2) * k }))
  return (t, a) => {
    lastra.scale.setScalar(0.62 * k * ou(seg(t, 0, 0.3))); lastra.material.opacity = 0.4 * a
    C.forEach(c => { const g = ob(seg(t, c.rit, c.rit + 0.22)); c.g.scale.set(lerp(0.4, 1, g), Math.max(0.001, g), lerp(0.4, 1, g)); c.m.material.opacity = 0.8 * a; c.l.material.opacity = 0.9 * a })
    N.forEach((n, i) => nebbia.pon(i, Math.cos(n.th - t * 0.5) * n.r, 0.08 * k + 0.03 * Math.sin(t * 2 + i) * k, Math.sin(n.th - t * 0.5) * n.r, 0.5 * k, undefined, spigoli, 0.22 * a, n.th))
    for (let i = 0; i < 12; i++) { const c = ((t * 0.7) + i * 0.37) % 1, th = i * 2.1; scint.pon(i, Math.cos(th) * (0.2 + 0.2 * (i % 3) / 2) * k, 0.1 * k + (i % 4) * 0.12 * k, Math.sin(th) * 0.35 * k, 0.15 * k * Math.sin(Math.PI * c), undefined, spigoli, a, th + t) }
  }
}, new Color(0.6, 0.85, 1), 0.62)

// ── sanguina: gocce rosse cadono, una pozza cresce ai piedi ──
const sanguina = ctx => stato(ctx, f => {
  const k = f.k, R = f.rnd, rosso = new Color(0.72, 0.04, 0.07), scuro = new Color(0.4, 0.02, 0.04)
  const gocce = f.pool('goccia', 10, true), schizzi = f.pool('fumo', 10, true)
  const G = [...Array(10)].map(() => ({ th: R() * TWO, r: (0.1 + R() * 0.22) * k, y0: (0.5 + R() * 0.5) * k, per: 0.8 + R() * 0.5, ph: R() }))
  const pozza = f.mesh(new THREE.PlaneGeometry(2, 2), f.nor(scuro, 0, { map: tex('alone') })); pozza.rotation.x = -Math.PI / 2; pozza.position.y = 0.02
  return (t, a) => {
    pozza.scale.setScalar((0.3 + 0.25 * Math.min(1, t / 3)) * k); pozza.material.opacity = 0.85 * a
    G.forEach((g, i) => { const c = ((t / g.per) + g.ph) % 1, fall = Math.min(1, c / 0.62), y = g.y0 - (g.y0 - 0.03 * k) * fall * fall
      if (fall < 1) { gocce.pon(i, Math.cos(g.th) * g.r, y, Math.sin(g.th) * g.r, 0.12 * k, 0.12 * k * (1 + 1.2 * fall), rosso, a); schizzi.spegni(i) }
      else { gocce.spegni(i); const q = (c - 0.62) / 0.38; schizzi.pon(i, Math.cos(g.th) * g.r, 0.04 * k, Math.sin(g.th) * g.r, 0.18 * k * (0.5 + q * 1.2), 0.08 * k, rosso, 0.8 * a * (1 - q), 0) } })
  }
}, new Color(0.9, 0.3, 0.3), 0.14)

// ── bloccato: radici escono dal suolo e legano i piedi ──
const bloccato = ctx => stato(ctx, f => {
  const k = f.k, R = f.rnd, legno = new Color(0x4d3420).lerp(f.tinta, 0.1), verde = new Color(0.3, 0.7, 0.2)
  const mat = f.sol(legno, { roughness: 0.9, emissive: legno, emissiveIntensity: 0.15, flatShading: false })
  const RAD = [...Array(9)].map((_, i) => {
    const th = i / 9 * TWO + R() * 0.3, pts = []
    for (let j = 0; j <= 6; j++) { const u = j / 6, a = th + u * (0.9 + R() * 0.2) * (i % 2 ? 1 : -1), r = lerp(0.62, 0.17, u ** 0.8) * k; pts.push(new Vector3(Math.cos(a) * r, -0.04 * k + Math.sin(u * Math.PI * 0.9) * (0.12 + 0.28 * ((i * 37) % 10) / 10) * k + u * 0.1 * k, Math.sin(a) * r)) }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, (0.032 + 0.016 * (i % 3) / 2) * k, 6, false); f.lista.push(geo)
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; f.g.add(m)
    const foglia = f.sprite('foglia', 0.14 * k, 0.14 * k, verde, 0, true); foglia.position.copy(pts[6]); foglia.position.y += 0.04 * k
    return { m, tot: geo.index.count, foglia, rit: 0.05 + i * 0.045, ph: R() * 6 }
  })
  const terra = f.pool('fumo', 6, true), T = [...Array(6)].map((_, i) => ({ th: i / 6 * TWO + 0.4 }))
  return (t, a) => {
    mat.opacity = a
    RAD.forEach(r => { const g = ou(seg(t, r.rit, r.rit + 0.45)), n = Math.floor(r.tot * g / 30) * 30; r.m.geometry.setDrawRange(0, n); r.m.visible = n > 0
      r.foglia.material.opacity = sm(seg(t, r.rit + 0.4, r.rit + 0.6)) * a; r.foglia.material.rotation = Math.sin(t * 2 + r.ph) * 0.3; const s = 0.15 * k * (1 + 0.1 * Math.sin(t * 3 + r.ph)); r.foglia.scale.set(s, s, 1) })
    T.forEach((p, i) => { const q = seg(t, 0.05 + i * 0.04, 0.5); terra.pon(i, Math.cos(p.th) * 0.45 * k, 0.05 * k, Math.sin(p.th) * 0.45 * k, 0.3 * k * (0.5 + q), undefined, new Color(0x6d5a44), 0.45 * a * Math.sin(Math.PI * q) * (q > 0 && q < 1)) })
  }
}, new Color(0.3, 0.6, 0.25), 0.1)

// ── senza difesa: uno scudo spezzato galleggia a fianco, scheggiato ──
const senzaDifesa = ctx => stato(ctx, f => {
  const k = f.k, R = f.rnd, acciaio = new Color(0x5f6878).lerp(f.tinta, 0.1), rosso = new Color(1, 0.3, 0.2)
  const g = new THREE.Group(); f.g.add(g); g.position.set(0.6 * k, 0.75 * k, 0.3 * k)
  const geo = scudoGeo(true, 0.06), m = f.mesh(geo, f.sol(acciaio, { emissive: f.tinta, emissiveIntensity: 0.2, roughness: 0.4, metalness: 0.3, flatShading: true, transparent: false }), g)
  const crepa = new THREE.CatmullRomCurve3([[0.0, 0.5], [-0.07, 0.34], [0.03, 0.2], [-0.08, 0.02], [0.0, -0.14], [-0.06, -0.32]].map(([x, y]) => new Vector3(x, y, 0.045)))
  const cr = f.mesh(new THREE.TubeGeometry(crepa, 18, 0.018, 4), f.add(rosso, 0.9), g)
  const lin = f.linee(geo, new Color(0.9, 0.95, 1), 0.5, g)
  const sc = f.sprite('alone', 0.5, 0.5, rosso, 0.5, false, g); sc.position.set(0.04, 0.1, 0.06)
  const fr = new THREE.Group(); f.g.add(fr)
  const fm = f.mesh(new THREE.TetrahedronGeometry(0.06 * k, 0), f.sol(acciaio, { metalness: 0.3, roughness: 0.4, transparent: false }), fr), fm2 = f.mesh(new THREE.TetrahedronGeometry(0.04 * k, 0), fm.material, fr)
  const polvere = f.pool('stella', 6)
  return (t, a) => {
    const s = ob(seg(t, 0, 0.4)) * a
    g.scale.setScalar(Math.max(0.001, 0.8 * k * s)); g.position.y = 0.72 * k + Math.sin(t * 2.2) * 0.04 * k; g.rotation.set(-0.25, 0.15 + Math.sin(t * 1.4) * 0.25, 0.16 + Math.sin(t * 1.9) * 0.05)
    cr.material.opacity = 0.9 * a * (0.7 + 0.3 * Math.sin(t * 8)); lin.material.opacity = 0.5 * a; sc.material.opacity = 0.5 * a
    fr.position.set(0.55 * k + Math.cos(t * 1.3) * 0.22 * k, 0.95 * k + Math.sin(t * 2.4) * 0.05 * k, 0.28 * k + Math.sin(t * 1.3) * 0.12 * k); fr.rotation.set(t * 2, t * 1.4, 0); fr.scale.setScalar(Math.max(0.001, a))
    fm2.position.set(0.1 * k, -0.08 * k, 0.03 * k)
    for (let i = 0; i < 6; i++) { const c = ((t * 0.8) + i / 6) % 1; polvere.pon(i, g.position.x + (i - 3) * 0.05 * k, g.position.y + 0.35 * k - c * 0.7 * k, g.position.z, 0.07 * k * Math.sin(Math.PI * c), undefined, acciaio.clone().lerp(BIANCO, 0.5), a, i) }
  }
}, new Color(0.55, 0.58, 0.68), 0.25)

// ── fiacco: una freccia scende sopra la testa, aspetto smorzato ──
const fiacco = ctx => stato(ctx, f => {
  const k = f.k, R = f.rnd, grigio = new Color(0.55, 0.64, 0.82).lerp(f.tinta, 0.1)
  const sh = new THREE.Shape(); sh.moveTo(-0.07, 0.2); sh.lineTo(0.07, 0.2); sh.lineTo(0.07, 0.02); sh.lineTo(0.17, 0.02); sh.lineTo(0, -0.17); sh.lineTo(-0.17, 0.02); sh.lineTo(-0.07, 0.02); sh.closePath()
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 1 }).translate(0, 0, -0.025)
  const fr = [0, 1, 2].map(i => { const g = new THREE.Group(); f.g.add(g); const m = f.mesh(geo, i === 0 ? f.nor(grigio, 1) : f.add(grigio, 1), g), l = f.linee(geo, BIANCO, 0.5, g); return { g, m, l } })
  const alone = f.sprite('alone', 0.9 * k, 0.9 * k, grigio, 0), gocce = f.pool('goccia', 4, true), G = [...Array(4)].map(() => ({ th: R() * TWO, r: (0.2 + R() * 0.1) * k, per: 1 + R() * 0.5, ph: R() }))
  return (t, a) => {
    const y0 = (TESTA + 0.3) * k * 1.1
    fr.forEach((q, i) => { const c = ((t * 1.1) - i * 0.18) % 1, cc = c < 0 ? c + 1 : c, y = y0 - 0.32 * k * cc * cc + i * 0.28 * k
      q.g.position.set(0, y, 0); q.g.scale.setScalar(Math.max(0.001, 0.6 * k * (1 - i * 0.12))); q.g.rotation.y = Math.sin(t * 2 + i) * 0.5
      const o = a * (i === 0 ? 1 : 0.5 - i * 0.12) * (0.55 + 0.45 * Math.sin(Math.PI * cc) ** 0.5); q.m.material.opacity = i === 0 ? a : o * 0.7; q.l.material.opacity = o * 0.6 })
    alone.position.set(0, y0 - 0.05 * k, 0); alone.material.opacity = 0.12 * a
    G.forEach((g, i) => { const c = ((t / g.per) + g.ph) % 1; gocce.pon(i, Math.cos(g.th) * g.r, 0.85 * k - c * c * 0.8 * k, Math.sin(g.th) * g.r, 0.05 * k, 0.07 * k, new Color(0.7, 0.8, 0.95), 0.8 * a * (1 - c * 0.6)) })
  }
}, new Color(0.45, 0.5, 0.62), 0.38)

export const STATI = {
  stordito: { via: 'stato', durata: Infinity, arrivo: 0, crea: stordito },
  avvelenato: { via: 'stato', durata: Infinity, arrivo: 0, crea: avvelenato },
  'in-fiamme': { via: 'stato', durata: Infinity, arrivo: 0, crea: inFiamme },
  gelato: { via: 'stato', durata: Infinity, arrivo: 0, crea: gelato },
  sanguina: { via: 'stato', durata: Infinity, arrivo: 0, crea: sanguina },
  bloccato: { via: 'stato', durata: Infinity, arrivo: 0, crea: bloccato },
  'senza-difesa': { via: 'stato', durata: Infinity, arrivo: 0, crea: senzaDifesa },
  fiacco: { via: 'stato', durata: Infinity, arrivo: 0, crea: fiacco },
}

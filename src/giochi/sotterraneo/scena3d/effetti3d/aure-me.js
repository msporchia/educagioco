// Generato da strumenti/promuovi-3d.mjs da poc/effetti-3d/aure-me.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Aure solo sull'eroe (via 'su-me', centrate su `da`): scudo, sfera, pietra, cura, preghiera, specchio, muro.
import { THREE, nuovo, effetto, cl, sm, ou, ob, seg, trap, lerp, mescola, sfumaY, scudoGeo, tex } from './aure-base.js'
const { Color, Vector3 } = THREE
const TWO = Math.PI * 2
const BIANCO = new Color(1, 1, 1)

// ── scudo: uno scudo magico si materializza davanti, con la runa al centro ──
function scudo (ctx) {
  const f = nuovo(ctx, ctx.da), k = f.k, D = 0.68, R = f.rnd
  const corpo = f.tinta.clone().lerp(BIANCO, 0.05), bordo = f.tinta2.clone().lerp(BIANCO, 0.3)
  const g = new THREE.Group(); g.position.set(0.62 * k, 0.62 * k, 0); g.rotation.set(-0.3, 0.15, 0); g.scale.setScalar(k); f.fronte.add(g)
  const geo = scudoGeo(false, 0.06)
  const m = f.mesh(geo, f.sol(corpo, { opacity: 0.55, emissive: f.tinta, emissiveIntensity: 0.12, roughness: 0.3, metalness: 0.2, depthWrite: false }), g)
  const lin = f.linee(geo, bordo, 1, g)
  const piastra = f.mesh(scudoGeo(false, 0.01).scale(0.72, 0.72, 1), f.add(f.tinta, 0.35), g); piastra.position.z = 0.05
  const runa = f.mesh(new THREE.PlaneGeometry(0.5, 0.5), f.nor(f.tinta.clone().multiplyScalar(0.3), 1, { map: tex('emblema') }), g); runa.position.z = 0.062
  const alone = f.sprite('alone', 1.8, 1.8, f.tinta, 0, false, g), lampo = f.sprite('alone', 1.6, 1.6, BIANCO, 0, false, g)
  const cerchio = f.disco('circolo', f.tinta2, 0)
  const conv = f.pool('stella', 26), N = [...Array(26)].map(() => { const a = R() * TWO, d = (0.7 + R() * 0.9) * k; return { p: new Vector3(Math.cos(a) * d, (0.2 + R() * 1.2) * k, Math.sin(a) * d * 0.6), rit: R() * 0.14, ph: R() * 6 } })
  const centro = new Vector3(0.62 * k, 0.62 * k, 0)
  return effetto(f, D, t => {
    const f1 = ob(seg(t, 0.1, 0.34)), fine = 1 - sm(seg(t, 0.52, D)), pulso = 1 + 0.06 * Math.sin(t * 22) * seg(t, 0.34, 0.5)
    g.scale.setScalar(1.3 * k * lerp(0.35, 1, f1) * pulso * (1 + 0.12 * (1 - fine))); g.rotation.y = 0.15 + (1 - f1) * 1.1 + 0.07 * Math.sin(t * 6)
    g.position.y = 0.6 * k + 0.02 * Math.sin(t * 9) * k
    m.material.opacity = 0.9 * sm(seg(t, 0.1, 0.3)) * fine; lin.material.opacity = sm(seg(t, 0.12, 0.3)) * fine; piastra.material.opacity = 0.18 * sm(seg(t, 0.2, 0.4)) * fine
    runa.material.opacity = sm(seg(t, 0.22, 0.42)) * fine; runa.rotation.z = 0
    alone.material.opacity = 0.3 * sm(seg(t, 0.12, 0.3)) * fine; lampo.material.opacity = Math.max(0, 1 - Math.abs(t - 0.33) / 0.1) * 0.5
    cerchio.scale.setScalar(0.9 * k); cerchio.rotation.z = t * 1.5; cerchio.material.opacity = 0.7 * trap(t, 0, 0.18, 0.5, D)
    N.forEach((n, i) => { const a = seg(t, n.rit, 0.34); if (a >= 1 || a <= 0) return conv.spegni(i); const e = sm(a); conv.pon(i, lerp(n.p.x, centro.x, e), lerp(n.p.y, centro.y, e), lerp(n.p.z, centro.z, e), 0.18 * k * (1 - 0.5 * e), undefined, f.tinta2, Math.sin(Math.PI * a) ** 0.5, n.ph + t * 5) })
  })
}

// ── sfera: una bolla arcana a trama esagonale si forma attorno all'eroe ──
const VSF = 'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vP = position; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }'
const FSF = `uniform float uA; uniform float uP; uniform vec3 uB; uniform vec3 uC; varying vec3 vN; varying vec3 vV; varying vec3 vP;
float hd(vec2 p){ p = abs(p); return max(dot(p, vec2(.5, .8660254)), p.x); }
float esa(vec2 p){ vec2 r = vec2(1., 1.7320508); vec2 h = r * .5; vec2 a = mod(p, r) - h; vec2 b = mod(p - h, r) - h; vec2 g = dot(a, a) < dot(b, b) ? a : b; return hd(g); }
void main(){
  vec3 n = normalize(vP); float lon = atan(n.z, n.x), lat = asin(n.y);
  float d = abs(dot(normalize(vN), normalize(vV))), fr = pow(1. - d, 2.2);
  float e = esa(vec2(lon * 1.9, lat * 3.3 + 0.0)); float linea = smoothstep(.40, .48, e) * (1. - smoothstep(.49, .5, e));
  float banda = exp(-pow((n.y - (-1.1 + 2.4 * uP)) * 5., 2.)) * (1. - smoothstep(.9, 1., uP));
  float luce = pow(max(dot(n, normalize(vec3(-.5, .75, .45))), 0.), 14.);
  float vena = .55 + .45 * sin(lon * 3. + lat * 5. - uP * 18.);
  vec3 c = uB * (.05 + fr * 1.0) + uC * (linea * (.4 + .6 * fr + .5 * banda) * vena) + uC * banda * .7 + vec3(1.) * luce * .6;
  float al = clamp(.12 + fr * .8 + linea * .65 + banda * .6 + luce, 0., 1.) * uA;
  gl_FragColor = vec4(c, al);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`
function sfera (ctx) {
  const f = nuovo(ctx, ctx.da), k = f.k, D = 0.7, R = f.rnd
  const geo = new THREE.SphereGeometry(1, 40, 28)
  const mat = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uP: { value: 0 }, uB: { value: f.tinta.clone() }, uC: { value: f.tinta2.clone().lerp(BIANCO, 0.1) } }, vertexShader: VSF, fragmentShader: FSF, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  f.lista.push(mat); const bolla = f.mesh(geo, mat); bolla.renderOrder = 2
  const nucleo = f.sprite('alone', 1.6 * k, 1.6 * k, f.tinta, 0), cerchio = f.disco('circolo', f.tinta2, 0)
  const sc = f.pool('stella', 10), S = [...Array(10)].map(() => ({ a: R() * TWO, el: (R() - 0.5) * 2, v: 2 + R() * 2, ph: R() * 6 }))
  return effetto(f, D, t => {
    const forma = ob(seg(t, 0, 0.3)), fine = 1 - sm(seg(t, 0.5, D)), p = seg(t, 0, 0.4)
    const r = 0.74 * k * lerp(0.25, 1, forma) * (1 + 0.025 * Math.sin(t * 25) * seg(t, 0.3, 0.5)) * (1 + 0.1 * (1 - fine))
    bolla.position.set(0, 0.58 * k, 0); bolla.scale.setScalar(r); bolla.rotation.y = t * 0.6
    mat.uniforms.uA.value = sm(seg(t, 0, 0.12)) * fine; mat.uniforms.uP.value = p
    nucleo.position.set(0, 0.55 * k, 0); nucleo.material.opacity = 0.2 * Math.max(0, 1 - Math.abs(t - 0.28) / 0.25) * fine * 2
    cerchio.scale.setScalar(0.85 * k); cerchio.rotation.z = -t * 2; cerchio.material.opacity = 0.6 * trap(t, 0, 0.15, 0.5, D)
    S.forEach((s, i) => { const a = s.a + t * s.v, y = 0.58 * k + Math.sin(s.el) * r; sc.pon(i, Math.cos(a) * r * Math.cos(s.el) * 0.95, y, Math.sin(a) * r * Math.cos(s.el) * 0.95, 0.16 * k, undefined, f.tinta2, sm(seg(t, 0.2, 0.34)) * fine * (0.5 + 0.5 * Math.sin(t * 20 + s.ph)), a) })
  })
}

// ── pietra: i sassi volano e si compongono in una corazza di roccia ──
function pietra (ctx) {
  const f = nuovo(ctx, ctx.da), k = f.k, D = 0.74, R = f.rnd
  const roccia = new Color(0x8b7d6c).lerp(f.tinta, 0.12), chiara = new Color(0xa89a86).lerp(f.tinta, 0.1)
  const m1 = f.sol(roccia, { roughness: 1, transparent: false, emissive: f.tinta, emissiveIntensity: 0.08 }), m2 = f.sol(chiara, { roughness: 1, transparent: false, emissive: f.tinta, emissiveIntensity: 0.08 })
  const geoR = new THREE.DodecahedronGeometry(1, 0); f.lista.push(geoR)
  const livelli = [[0.12, 4, 0.2], [0.42, 5, 0.19], [0.72, 5, 0.19], [1.0, 3, 0.17]]
  const rocce = []
  livelli.forEach(([y, n, s], li) => { for (let i = 0; i < n; i++) { const th = (i + (li % 2) * 0.5) / n * TWO, r = (li === 3 ? 0.3 : 0.46) * k
    const m = new THREE.Mesh(geoR, (i + li) % 2 ? m1 : m2); m.castShadow = true; f.g.add(m)
    const ia = R() * TWO, id = (1.1 + R() * 0.7) * k
    rocce.push({ m, to: new Vector3(Math.cos(th) * r, y * k, Math.sin(th) * r), da: new Vector3(Math.cos(ia) * id, 0.1 * k, Math.sin(ia) * id), s: s * k * (0.85 + R() * 0.4), rit: 0.03 + (li * 0.05) + R() * 0.07, rot: new Vector3(R() * 4, R() * 4, R() * 4), at: false, sq: new Vector3(1 + R() * 0.3, 0.7 + R() * 0.3, 1 + R() * 0.3) }) } })
  for (const [sg, x] of [[1, 1], [-1, -1]]) { const m = new THREE.Mesh(geoR, m2); m.castShadow = true; f.g.add(m); const ia = R() * TWO
    rocce.push({ m, to: new Vector3(0.0, 1.12 * k, 0.4 * x * k), da: new Vector3(Math.cos(ia) * k, 0.1 * k, Math.sin(ia) * k), s: 0.17 * k, rit: 0.25, rot: new Vector3(1, 2, 3), at: false, sq: new Vector3(1.4, 0.8, 1.1) }) }
  const polvere = f.pool('fumo', 18, true), D0 = new Color(0x8a7c68), faville = f.pool('stella', 20), cerchio = f.disco('circolo', f.tinta2, 0), alone = f.sprite('alone', 1.6 * k, 1.6 * k, f.tinta2, 0)
  const nPol = { i: 0 }, puff = [...Array(18)].map(() => ({ t0: -1, p: new Vector3(), s: 0 })), fav = [...Array(20)].map(() => ({ t0: -1, p: new Vector3(), v: new Vector3() }))
  return effetto(f, D, t => {
    const sparisce = seg(t, 0.56, D)
    rocce.forEach((r, idx) => {
      const a = seg(t, r.rit, r.rit + 0.26), e = sm(a)
      r.m.position.set(lerp(r.da.x, r.to.x, e), lerp(r.da.y, r.to.y, e) + Math.sin(Math.PI * a) * 0.55 * k, lerp(r.da.z, r.to.z, e))
      const gia = a >= 1, sq = gia ? 1 + 0.18 * Math.max(0, 1 - (t - r.rit - 0.26) / 0.1) : 1
      r.m.rotation.set(r.rot.x * (1 - e), r.rot.y * (1 - e) + (gia ? 0.3 * idx : 0), r.rot.z * (1 - e))
      r.m.scale.set(r.s * r.sq.x * (gia ? 2 - sq : 1), r.s * r.sq.y * sq, r.s * r.sq.z).multiplyScalar(a <= 0 ? 0.001 : Math.max(0.001, 1 - ou(sparisce)))
      if (gia && !r.at) { r.at = true; const p = puff.find(q => q.t0 < 0); if (p) { p.t0 = t; p.p.copy(r.to); p.s = 0.3 * k } for (const q of fav.slice(0, 2)) { if (q.t0 < 0 || t - q.t0 > 0.3) { q.t0 = t; q.p.copy(r.to); q.v.set((R() - 0.5) * 1.2, 0.8 + R(), (R() - 0.5) * 1.2) } } }
      if (a <= 0) r.at = false
      r.m.visible = a > 0
    })
    puff.forEach((p, i) => { const a = (t - p.t0) / 0.4; if (p.t0 < 0 || a >= 1) return polvere.spegni(i); polvere.pon(i, p.p.x, p.p.y + 0.15 * a * k, p.p.z, p.s * (0.7 + a), undefined, D0, 0.6 * (1 - a) ** 1.3, i) })
    fav.forEach((q, i) => { const a = (t - q.t0) / 0.3; if (q.t0 < 0 || a >= 1) return faville.spegni(i); faville.pon(i, q.p.x + q.v.x * a * 0.3, q.p.y + q.v.y * a * 0.3, q.p.z + q.v.z * a * 0.3, 0.14 * k, undefined, f.tinta2, 1 - a, i + t * 6) })
    cerchio.scale.setScalar(0.9 * k); cerchio.rotation.z = t; cerchio.material.opacity = 0.5 * trap(t, 0, 0.2, 0.55, D)
    alone.position.set(0, 0.6 * k, 0); alone.material.opacity = 0.4 * trap(t, 0.25, 0.4, 0.5, 0.66)
  })
}

// ── cura: croci e foglie verdi e scintille salgono in un alone caldo ──
function cura (ctx) {
  const f = nuovo(ctx, ctx.da), k = f.k, D = 0.78, R = f.rnd
  const verde = f.tinta.clone().lerp(new Color(0.2, 0.95, 0.35), 0.88), chiaro = verde.clone().lerp(BIANCO, 0.25), caldo = f.tinta2.clone().lerp(new Color(1, 0.9, 0.55), 0.4)
  const colGeo = sfumaY(new THREE.CylinderGeometry(0.46 * k, 0.5 * k, 1.8 * k, 28, 1, true).translate(0, 0.9 * k, 0), verde, y => (1 - y) ** 1.4)
  const colonna = f.mesh(colGeo, f.add(0xffffff, 0.4, { vertexColors: true }))
  const alone = f.sprite('alone', 1.9 * k, 1.9 * k, caldo, 0), anello = f.disco('anello', caldo, 0), cerchio = f.disco('circolo', verde, 0)
  const It = [...Array(11)].map((_, i) => ({ s: f.sprite(i % 3 === 1 ? 'foglia' : 'croce', 0.2 * k, 0.2 * k, i % 3 === 1 ? verde : chiaro, 0), a0: R() * TWO, r: (0.28 + R() * 0.25) * k, t0: 0.04 + i * 0.045, dim: (0.26 + R() * 0.12) * k, w: R() * 2 + 1 }))
  const sc = f.pool('stella', 28), S = [...Array(28)].map(() => ({ a: R() * TWO, r: (0.1 + R() * 0.5) * k, t0: R() * 0.35, v: (0.8 + R() * 0.9) * k, ph: R() * 6 }))
  return effetto(f, D, t => {
    const env = trap(t, 0, 0.14, 0.55, D)
    colonna.scale.set(1 + 0.15 * Math.sin(t * 6), Math.min(1, 0.4 + 2 * t), 1 + 0.15 * Math.sin(t * 6)); colonna.material.opacity = 0.42 * env
    alone.position.set(0, 0.55 * k, 0); alone.material.opacity = 0.55 * env * (0.85 + 0.15 * Math.sin(t * 14))
    anello.scale.setScalar(k * (0.3 + 1.1 * ou(seg(t, 0, 0.5)))); anello.material.opacity = 0.9 * (1 - sm(seg(t, 0.1, 0.55)))
    cerchio.scale.setScalar(0.85 * k); cerchio.rotation.z = t * 1.2; cerchio.material.opacity = 0.6 * env
    It.forEach(c => { const a = seg(t, c.t0, c.t0 + 0.5); const vis = a > 0 && a < 1 ? Math.sin(Math.PI * a) ** 0.5 : 0, th = c.a0 + a * c.w
      c.s.position.set(Math.cos(th) * c.r, 0.1 * k + a * 1.35 * k, Math.sin(th) * c.r * 0.7); const s = c.dim * (0.55 + 0.6 * ou(a)); c.s.scale.set(s, s, 1); c.s.material.opacity = vis; c.s.material.rotation = Math.sin(a * 6 + c.w) * 0.35 })
    S.forEach((s, i) => { const a = seg(t, s.t0, s.t0 + 0.42); if (a <= 0 || a >= 1) return sc.spegni(i); sc.pon(i, Math.cos(s.a + a) * s.r, 0.05 * k + a * s.v * 1.4, Math.sin(s.a + a) * s.r * 0.7, 0.13 * k * Math.sin(Math.PI * a), undefined, caldo, 1, s.ph + t * 4) })
  })
}

// ── preghiera: una colonna di luce dorata cade dall'alto, con anelli che scendono ──
function preghiera (ctx) {
  const f = nuovo(ctx, ctx.da), k = f.k, D = 0.78, R = f.rnd
  const oro = f.tinta.clone().lerp(new Color(1, 0.72, 0.18), 0.6).multiplyScalar(0.85), H = 4 * k
  const esterna = f.mesh(sfumaY(new THREE.CylinderGeometry(0.5 * k, 0.56 * k, H, 36, 1, true).translate(0, H / 2, 0), oro, y => 0.25 + 0.75 * (1 - y) ** 0.8), f.add(0xffffff, 0, { vertexColors: true }))
  const interna = f.mesh(sfumaY(new THREE.CylinderGeometry(0.22 * k, 0.26 * k, H, 24, 1, true).translate(0, H / 2, 0), new Color(1, 1, 1).lerp(oro, 0.5), y => 0.4 + 0.6 * (1 - y)), f.add(0xffffff, 0, { vertexColors: true }))
  const raggi = [0, 1, 2].map(i => { const m = f.mesh(sfumaY(new THREE.PlaneGeometry(0.5 * k, H).translate(0, H / 2, 0), oro, y => (1 - y) * 0.6), f.add(0xffffff, 0, { vertexColors: true })); m.rotation.y = i * Math.PI / 3; return m })
  const anelli = [...Array(5)].map(() => f.mesh(new THREE.TorusGeometry(0.54 * k, 0.018 * k, 6, 40), f.add(oro, 0)))
  const cerchio = f.disco('circolo', oro, 0), alone = f.sprite('alone', 2 * k, 2 * k, oro, 0), cima = f.sprite('alone', 1.5 * k, 1.5 * k, BIANCO, 0), anello = f.disco('anello', oro, 0)
  const sc = f.pool('stella', 30), S = [...Array(30)].map(() => ({ a: R() * TWO, r: R() * 0.42 * k, t0: R() * 0.4, v: (1.4 + R() * 1.4) * k, ph: R() * 6 }))
  anelli.forEach(a => { a.rotation.x = Math.PI / 2 })
  return effetto(f, D, t => {
    const aper = sm(seg(t, 0, 0.16)), fine = 1 - sm(seg(t, 0.5, D)), lamp = Math.max(0, 1 - Math.abs(t - 0.2) / 0.1)
    const w = lerp(0.2, 1, ou(seg(t, 0, 0.2))) * (1 - 0.3 * (1 - fine)), vib = 1 + 0.04 * Math.sin(t * 30)
    for (const c of [esterna, interna]) c.scale.set(w * vib, 1, w * vib)
    esterna.material.opacity = 0.2 * aper * fine; interna.material.opacity = (0.16 + 0.25 * lamp) * aper * fine
    raggi.forEach((r, i) => { r.scale.set(w * 1.5, 1, 1); r.rotation.y = i * Math.PI / 3 + t * 0.4; r.material.opacity = 0.14 * aper * fine })
    anelli.forEach((a, i) => { const q = seg(t, 0.02 + i * 0.07, 0.3 + i * 0.07); a.position.y = lerp(3.2 * k, 0.05 * k, q * q); a.scale.setScalar(lerp(1.1, 0.7, q)); a.material.opacity = Math.sin(Math.PI * Math.min(1, q * 1.05)) * 0.9 * fine * (q > 0 && q < 1) })
    cerchio.scale.setScalar(0.95 * k); cerchio.rotation.z = t * 1.3; cerchio.material.opacity = 0.8 * aper * fine
    anello.scale.setScalar(k * (0.4 + 1.2 * ou(seg(t, 0.18, 0.6)))); anello.material.opacity = 0.9 * (1 - sm(seg(t, 0.2, 0.62))) * (t > 0.18)
    alone.position.set(0, 0.35 * k, 0); alone.material.opacity = (0.3 + 0.3 * lamp) * aper * fine
    cima.position.set(0, 3.2 * k, 0); cima.material.opacity = 0.35 * aper * fine
    S.forEach((s, i) => { const a = seg(t, s.t0, s.t0 + 0.4); if (a <= 0 || a >= 1) return sc.spegni(i); sc.pon(i, Math.cos(s.a + t * 2) * s.r, a * s.v * 1.2, Math.sin(s.a + t * 2) * s.r, 0.13 * k * Math.sin(Math.PI * a), undefined, oro, 1, s.ph + t * 3) })
  })
}

// ── specchio: una superficie a specchio lampeggia e rimanda i raggi ──
const FSM = `uniform float uA; uniform float uP; uniform vec3 uC; varying vec2 vUv;
void main(){ vec2 p = vUv * 2. - 1.; float r = length(p); if (r > 1.) discard;
  vec3 base = mix(vec3(.55, .66, .78), vec3(.9, .96, 1.), smoothstep(-.8, .9, p.y * .6 + p.x * .5));
  float dg = p.x * .8 + p.y * .6; float glare = exp(-pow((dg - (-1.6 + 3.2 * uP)) * 4.5, 2.)) + .5 * exp(-pow((dg - (-1.9 + 3.2 * uP)) * 9., 2.));
  float bordo = smoothstep(.78, 1., r); vec3 c = base * .55 + uC * bordo * .9 + vec3(1.) * glare * 1.3;
  gl_FragColor = vec4(c, (.8 - .15 * r) * uA);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`
function specchio (ctx) {
  const f = nuovo(ctx, ctx.da), k = f.k, D = 0.7, R = f.rnd
  const g = new THREE.Group(); g.position.set(0.6 * k, 0.62 * k, 0); g.rotation.y = 0.6; g.scale.setScalar(k); f.fronte.add(g)
  const mat = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uP: { value: 0 }, uC: { value: f.tinta2.clone() } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }', fragmentShader: FSM, transparent: true, depthWrite: false })
  f.lista.push(mat); const vetro = f.mesh(new THREE.PlaneGeometry(0.84, 1.28), mat, g)
  const oro = new Color(0xd9b35a).lerp(f.tinta, 0.2)
  const cornice = f.mesh(new THREE.TorusGeometry(0.5, 0.045, 8, 48).scale(0.86, 1.32, 1), f.sol(oro, { emissive: oro, emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.6, flatShading: false }), g); cornice.position.z = 0.01
  const lampo = f.sprite('alone', 2.2, 2.2, BIANCO, 0, false, g)
  const stelle = [0, 1, 2].map(i => { const s = f.sprite('stella', 0.4, 0.4, BIANCO, 0, false, g); s.position.set((i - 1) * 0.2, 0.2 - (i % 2) * 0.35, 0.04); return s })
  const raggi = [[0.4, 0.5], [-0.3, 0.38]].map(([rot, y]) => { const s = f.sprite('alone', 0.1, 0.14, f.tinta2, 0, false, f.fronte); s.material.rotation = rot; s.userData = { y }; return s })
  const cerchio = f.disco('circolo', f.tinta2, 0)
  return effetto(f, D, t => {
    const ap = ob(seg(t, 0.04, 0.28)), fine = 1 - sm(seg(t, 0.52, D))
    g.scale.set(k * Math.max(0.001, ap), k * lerp(0.7, 1, ap), k); g.position.y = (0.62 + 0.015 * Math.sin(t * 8)) * k; g.rotation.y = 0.6 + (1 - ap) * 1.2
    mat.uniforms.uA.value = sm(seg(t, 0.04, 0.2)) * fine; mat.uniforms.uP.value = seg(t, 0.2, 0.5)
    cornice.material.opacity = sm(seg(t, 0.04, 0.2)) * fine
    lampo.material.opacity = 0.9 * Math.max(0, 1 - Math.abs(t - 0.3) / 0.09)
    stelle.forEach((s, i) => { const q = seg(t, 0.25 + i * 0.05, 0.45 + i * 0.05); s.material.opacity = Math.sin(Math.PI * q) * fine; s.scale.setScalar(0.45 * Math.sin(Math.PI * q) + 0.01) })
    raggi.forEach((r, i) => { const q = seg(t, 0.3, 0.55); r.position.set(0.85 * k + q * 1.1 * k, r.userData.y * k + (i ? -1 : 1) * q * 0.25 * k, 0); r.scale.set(0.15 + 1.5 * k * Math.sin(Math.PI * Math.min(1, q * 1.3)), 0.15 * k, 1); r.material.opacity = Math.sin(Math.PI * q) * 0.9 })
    cerchio.scale.setScalar(0.85 * k); cerchio.rotation.z = t; cerchio.material.opacity = 0.5 * trap(t, 0, 0.14, 0.5, D)
  })
}

// ── muro: una barriera di pietra ed energia sale davanti all'eroe ──
function muro (ctx) {
  const f = nuovo(ctx, ctx.da), k = f.k, D = 0.7, R = f.rnd
  const pietraC = new Color(0x2f333b).lerp(f.tinta, 0.15), bordo = f.tinta2.clone().lerp(BIANCO, 0.2)
  const geoL = new THREE.BoxGeometry(0.32, 1, 0.2).translate(0, 0.5, 0); f.lista.push(geoL)
  const N = 5, RAG = 0.85 * k, mat = f.sol(pietraC, { transparent: false, roughness: 0.85, emissive: f.tinta, emissiveIntensity: 0.12 })
  const lastre = [...Array(N)].map((_, i) => { const ph = (i - 2) * 0.48, g = new THREE.Group(); g.position.set(Math.cos(ph) * RAG, 0, Math.sin(ph) * RAG); g.rotation.y = -ph; f.fronte.add(g)
    const m = new THREE.Mesh(geoL, mat); m.castShadow = true; g.add(m); const l = f.linee(geoL, bordo, 0.9, g)
    const luce = f.mesh(new THREE.BoxGeometry(0.34, 0.06, 0.22), f.add(bordo, 0), g)
    return { g, m, l, luce, h: [0.72, 0.9, 1.1, 0.9, 0.72][i] * k, rit: Math.abs(i - 2) * 0.05, dx: 0.32 * k * (0.9 + R() * 0.2) } })
  const arcoGeo = sfumaY(new THREE.CylinderGeometry(RAG * 1.02, RAG * 1.02, 1.1 * k, 24, 1, true, Math.PI / 2 - 1.3, 2.6).translate(0, 0.55 * k, 0), f.tinta, y => 0.15 + 0.85 * (1 - y) ** 1.3)
  const energia = f.mesh(arcoGeo, f.add(0xffffff, 0, { vertexColors: true })), polvere = f.pool('fumo', 12, true), anello = f.disco('anello', bordo, 0)
  energia.rotation.y = 0; f.fronte.add(energia)
  const D0 = new Color(0x9a8f80)
  return effetto(f, D, t => {
    const fine = 1 - sm(seg(t, 0.52, D)), env = trap(t, 0.04, 0.2, 0.5, D)
    lastre.forEach(l => { const a = ob(seg(t, l.rit, l.rit + 0.26)), s = Math.max(0.001, a) * (0.5 + 0.5 * fine); l.g.scale.set(k * 1.05, l.h * s / 1, k); l.g.position.y = -(1 - fine) * l.h * 0.9
      l.l.material.opacity = 0.9 * sm(seg(t, l.rit, l.rit + 0.15)) * fine; l.luce.position.y = 1; l.luce.material.opacity = 0.35 * sm(seg(t, l.rit + 0.15, l.rit + 0.28)) * fine })
    energia.material.opacity = 0.55 * env; energia.scale.set(1, lerp(0.6, 1, ou(seg(t, 0.05, 0.3))), 1)
    anello.scale.setScalar(k * (0.4 + 1.1 * ou(seg(t, 0, 0.4)))); anello.material.opacity = 0.7 * (1 - sm(seg(t, 0.05, 0.45)))
    for (let i = 0; i < 12; i++) { const ph = ((i % N) - 2) * 0.48 + (i < 6 ? 0.1 : -0.1), q = seg(t, 0.04 + (i % N) * 0.04, 0.45); if (q <= 0 || q >= 1) { polvere.spegni(i); continue } const r = RAG + (i < 6 ? 0.12 : -0.12) * k
      const p = new Vector3(Math.cos(ph) * r, 0.1 * k + q * 0.3 * k, Math.sin(ph) * r).applyAxisAngle(new Vector3(0, 1, 0), f.fronte.rotation.y); polvere.pon(i, p.x, p.y, p.z, 0.36 * k * (0.6 + q), undefined, D0, 0.5 * (1 - q)) }
  })
}

export const ME = {
  scudo: { via: 'su-me', durata: 0.68, arrivo: 0, crea: scudo },
  sfera: { via: 'su-me', durata: 0.7, arrivo: 0, crea: sfera },
  pietra: { via: 'su-me', durata: 0.74, arrivo: 0, crea: pietra },
  cura: { via: 'su-me', durata: 0.78, arrivo: 0, crea: cura },
  preghiera: { via: 'su-me', durata: 0.78, arrivo: 0, crea: preghiera },
  specchio: { via: 'su-me', durata: 0.7, arrivo: 0, crea: specchio },
  muro: { via: 'su-me', durata: 0.7, arrivo: 0, crea: muro },
}

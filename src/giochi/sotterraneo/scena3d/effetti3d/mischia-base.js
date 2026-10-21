// Generato da strumenti/promuovi-3d.mjs da poc/effetti-3d/mischia-base.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Gli attrezzi del gruppo «mischia» (autonomi: niente import dagli altri gruppi).
// Tutto è una funzione pura del tempo t: aggiorna(t) può essere chiamata in qualsiasi ordine (serve per gli scatti con ?t=).
// Convenzione dei mondi: unità-cella, y in alto, z verso la camera; il suolo è y = 0; `a` è il centro (il petto) del bersaglio.
import {
  Group, Mesh, InstancedMesh, InstancedBufferAttribute, PlaneGeometry, BufferGeometry, BufferAttribute, ShaderMaterial,
  MeshBasicMaterial, AdditiveBlending, DoubleSide, Color, CanvasTexture, SRGBColorSpace,
} from 'three'

export const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x
export const smooth = x => { x = clamp01(x); return x * x * (3 - 2 * x) }
export const fuori = x => 1 - (1 - clamp01(x)) ** 3
export const dentro = x => clamp01(x) ** 2
/** Sale oltre 1 e si assesta: la crescita con rimbalzo. */
export const indietro = x => { x = clamp01(x); const c = 2.2; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2 }
export const mix = (a, b, k) => a + (b - a) * k
/** Un generatore di numeri deterministico dal seme. */
export function casuale (seme) {
  let s = (Math.floor(seme * 1000) + 1337) >>> 0
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
/** Un colore [r,g,b] (lineare) mescolato a un altro. */
export function colore (c, c2, k = 0) { return [mix(c.r, c2.r, k), mix(c.g, c2.g, k), mix(c.b, c2.b, k)] }
const BIANCO = new Color(1, 1, 1)
/** Il «caldo» di un colore: più chiaro ma sempre dello stesso colore (l'arancio va verso il giallo, non verso il rosa). */
export const calda = (c, k = 1) => [c.r + (1 - c.r) * 0.35 * k, c.g + (1 - c.g) * 0.55 * k, c.b + (1 - c.b) * 0.3 * k]
export const chiaro = (c, k) => colore(c, BIANCO, k)
export const scuro = (c, k) => colore(c, new Color(0, 0, 0), k)

/** Il registro di quel che si deve buttare via quando l'effetto finisce. */
export class Raccolta {
  constructor () { this.cose = []; this.gruppo = new Group() }
  tieni (x) { this.cose.push(x); return x }
  libera () { for (const c of this.cose) c.dispose?.(); this.cose.length = 0; this.gruppo.removeFromParent(); this.gruppo.clear() }
}

export function matAdd (R, extra = {}) {
  return R.tieni(new MeshBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, ...extra }))
}

// ───────────── le particelle: un solo InstancedMesh di cartoncini sempre rivolti alla camera ─────────────
const VS = /* glsl */`
attribute vec4 ic; attribute vec4 fa;
varying vec2 vP; varying vec4 vC; varying vec3 vF;
void main(){
  vP = position.xy * 2.0; vC = ic; vF = fa.xyz;
  float d = length(instanceMatrix[0].xyz);
  vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float cr = cos(fa.y), sr = sin(fa.y);
  vec2 q = vec2(position.x * cr - position.y * sr, position.x * sr + position.y * cr) * d;
  gl_Position = projectionMatrix * (c + vec4(q, 0.0, 0.0));
}`
const FS = /* glsl */`
varying vec2 vP; varying vec4 vC; varying vec3 vF;
void main(){
  vec2 p = vP; float r = length(p); float f = vF.x; float a = 0.0; vec3 col = vC.rgb;
  if (r > 1.0 && f < 1.5) discard;
  if (f < 0.5) { float k = 1.0 - r; a = k * k * (1.0 + 0.8 * k); }                                  // alone morbido
  else if (f < 1.5) {                                                                                 // stella a raggi
    float k = max(0.0, 1.0 - r); float g = k * k * k * 1.3;
    float r1 = max(0.0, 1.0 - abs(p.y) * 14.0) * max(0.0, 1.0 - abs(p.x)); float r2 = max(0.0, 1.0 - abs(p.x) * 14.0) * max(0.0, 1.0 - abs(p.y));
    vec2 q = vec2(p.x + p.y, p.x - p.y) * 0.7071; float r3 = (max(0.0, 1.0 - abs(q.y) * 20.0) * max(0.0, 1.0 - abs(q.x)) + max(0.0, 1.0 - abs(q.x) * 20.0) * max(0.0, 1.0 - abs(q.y))) * 0.45;
    a = g + (r1 + r2) * (1.0 - r * 0.4) + r3; col = mix(col, vec3(1.0), clamp(g * 0.8, 0.0, 1.0));
  } else if (f < 2.5) {                                                                               // striscia (testa a +x)
    float x = p.x; float w = (1.0 - abs(p.y)) ; float len = smoothstep(-1.0, 0.55, x) * (1.0 - smoothstep(0.55, 1.0, x) * 0.6);
    float th = max(0.0, 1.0 - abs(p.y) * (2.0 + (1.0 - x) * 3.5)); a = th * len * 1.5; col = mix(col, vec3(1.0), smoothstep(0.2, 0.9, x) * 0.8); if (abs(x) > 1.0 || abs(p.y) > 1.0) a = 0.0;
  } else if (f < 3.5) { a = smoothstep(1.0, 0.72, r); col = mix(col, col * 0.55, r); }                 // goccia piena
  else if (f < 4.5) { float k = abs(r - 0.82); a = smoothstep(0.16, 0.0, k) * 0.9 + smoothstep(0.62, 0.0, r) * 0.12;   // bolla
    float h = smoothstep(0.28, 0.0, length(p - vec2(-0.35, 0.38))); a += h * 0.9; col = mix(col, vec3(1.0), h); }
  else if (f < 5.5) {                                                                                 // fiamma (punta a +y)
    float y = (p.y + 1.0) * 0.5; float ph = vF.z; float wob = sin(p.y * 4.5 + ph) * 0.2 * y + sin(p.y * 9.0 - ph * 1.7) * 0.06 * y;
    float hw = pow(clamp(1.0 - y, 0.0, 1.0), 0.75) * 0.62 * smoothstep(0.0, 0.22, y + 0.05);
    float dd = abs(p.x - wob); a = smoothstep(hw, hw * 0.25, dd) * (1.0 - y * 0.35); col = mix(vec3(1.0, 0.85, 0.5) * (0.5 + 0.5 * col), col, clamp(y * 2.2 + dd * 2.4, 0.0, 1.0)); if (hw < 0.01) a = 0.0;
  } else { float k = max(0.0, 1.0 - r); a = k * k * 0.55; }                                           // nube tenue
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * vC.a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

/** Un pool di particelle fisso: ognuna ha nascita, vita, traiettoria analitica. */
export class Particelle {
  constructor (R, max) {
    this.max = max; this.n = 0; this.liste = []
    const g = R.tieni(new PlaneGeometry(1, 1))
    this.ic = new InstancedBufferAttribute(new Float32Array(max * 4), 4); this.fa = new InstancedBufferAttribute(new Float32Array(max * 4), 4)
    g.setAttribute('ic', this.ic); g.setAttribute('fa', this.fa)
    const mat = R.tieni(new ShaderMaterial({ vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending, side: DoubleSide }))
    this.mesh = new InstancedMesh(g, mat, max); this.mesh.frustumCulled = false; this.mesh.renderOrder = 20; this.mesh.count = max
    R.gruppo.add(this.mesh)
    this.mesh.instanceMatrix.setUsage(35048)
  }
  /** p0, v: [x,y,z]; g: accelerazione verticale (negativa = cade); drag: attrito; d0→d1: dimensione; c0→c1: colore; forma 0 alone,1 stella,2 striscia,3 goccia,4 bolla,5 fiamma,6 nube. */
  agg (o) {
    if (this.n >= this.max) return
    this.liste.push({ t0: 0, vita: 0.5, p: [0, 0, 0], v: [0, 0, 0], g: 0, drag: 0, d0: 0.2, d1: 0.2, c: [1, 1, 1], c1: null, a: 1, forma: 0, rot: 0, segui: false, fase: 0, attacco: 0.1, ...o }); this.n++
  }
  aggiorna (t) {
    const m = this.mesh.instanceMatrix.array, ic = this.ic.array, fa = this.fa.array
    for (let i = 0; i < this.max; i++) {
      const o = this.liste[i], k = i * 16
      if (!o) { m[k] = m[k + 5] = m[k + 10] = 0; continue }
      const tau = t - o.t0, u = tau / o.vita
      if (tau < 0 || u > 1) { m[k] = m[k + 5] = m[k + 10] = 0; m[k + 15] = 1; continue }
      const dr = o.drag, s = dr > 0 ? (1 - Math.exp(-dr * tau)) / dr : tau
      const x = o.p[0] + o.v[0] * s, y = o.p[1] + o.v[1] * s + 0.5 * o.g * tau * tau, z = o.p[2] + o.v[2] * s
      const sz = mix(o.d0, o.d1, o.forma === 1 ? fuori(u) : smooth(u))
      m[k] = sz; m[k + 5] = sz; m[k + 10] = sz; m[k + 15] = 1; m[k + 12] = x; m[k + 13] = y; m[k + 14] = z
      const env = smooth(u / o.attacco) * (1 - u) ** 1.35
      const c = o.c1 ? o.c1 : o.c, kk = o.c1 ? smooth(u) : 0
      ic[i * 4] = mix(o.c[0], c[0], kk); ic[i * 4 + 1] = mix(o.c[1], c[1], kk); ic[i * 4 + 2] = mix(o.c[2], c[2], kk); ic[i * 4 + 3] = o.a * env
      let rot = o.rot
      if (o.segui) { const vx = o.v[0] * Math.exp(-dr * tau), vy = o.v[1] * Math.exp(-dr * tau) + o.g * tau; rot = Math.atan2(vy * 0.85, vx) }
      fa[i * 4] = o.forma; fa[i * 4 + 1] = rot; fa[i * 4 + 2] = o.fase
    }
    this.mesh.instanceMatrix.needsUpdate = true; this.ic.needsUpdate = true; this.fa.needsUpdate = true
  }
}

// ───────────── il nastro: una striscia a due vertici per punto, con colore e trasparenza per vertice ─────────────
export class Nastro {
  constructor (R, N, mat) {
    this.N = N
    const g = R.tieni(new BufferGeometry())
    this.pos = new BufferAttribute(new Float32Array(N * 6), 3); this.col = new BufferAttribute(new Float32Array(N * 8), 4)
    const idx = []; for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
    g.setAttribute('position', this.pos); g.setAttribute('color', this.col); g.setIndex(idx)
    this.mesh = new Mesh(g, mat || matAdd(R, { depthTest: false })); this.mesh.frustumCulled = false; this.mesh.renderOrder = 15
    R.gruppo.add(this.mesh)
  }
  /** punto i: centro (px,py,pz), mezza larghezza w lungo (lx,ly,lz), colore [r,g,b] con alpha a. */
  set (i, px, py, pz, lx, ly, lz, w, c, a) {
    const p = this.pos.array, q = this.col.array, k = i * 6, h = i * 8
    p[k] = px - lx * w; p[k + 1] = py - ly * w; p[k + 2] = pz - lz * w; p[k + 3] = px + lx * w; p[k + 4] = py + ly * w; p[k + 5] = pz + lz * w
    q[h] = q[h + 4] = c[0]; q[h + 1] = q[h + 5] = c[1]; q[h + 2] = q[h + 6] = c[2]; q[h + 3] = q[h + 7] = a
  }
  fine (n = this.N) { this.pos.needsUpdate = true; this.col.needsUpdate = true; this.mesh.geometry.setDrawRange(0, Math.max(0, (n - 1) * 6)) }
}

// ───────────── texture di canvas: l'anello morbido ─────────────
let _anello = null
export function texAnello () {
  if (_anello) return _anello
  const c = document.createElement('canvas'); c.width = c.height = 128
  const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 62)
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.62, 'rgba(255,255,255,0)'); g.addColorStop(0.84, 'rgba(255,255,255,1)'); g.addColorStop(0.93, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)')
  x.fillStyle = g; x.fillRect(0, 0, 128, 128)
  _anello = new CanvasTexture(c); _anello.colorSpace = SRGBColorSpace
  return _anello
}
/** Un anello luminoso (piatto sul suolo se piano='suolo', altrimenti rivolto alla camera nel gruppo che lo contiene). */
export function anello (R, col, piano = 'suolo') {
  const m = R.tieni(new MeshBasicMaterial({ map: texAnello(), color: new Color(col[0], col[1], col[2]), transparent: true, blending: AdditiveBlending, depthWrite: false, depthTest: false, side: DoubleSide }))
  const me = new Mesh(R.tieni(new PlaneGeometry(2, 2)), m); me.renderOrder = 12
  if (piano === 'suolo') me.rotation.x = -Math.PI / 2
  R.gruppo.add(me)
  return { mesh: me, mat: m, imposta (raggio, alpha) { me.scale.setScalar(Math.max(raggio * 0.62, 1e-4)); m.opacity = clamp01(alpha * 0.85); me.visible = alpha > 0.003 } }
}

/** Il piano rivolto alla camera (3/4 dall'alto, ~50°): un gruppo dove disegnare archi e stelle «di faccia». */
export function pianoCamera (R, pos) {
  const g = new Group(); g.position.copy(pos); g.rotation.x = -0.7; R.gruppo.add(g); return g
}

/** Una pioggia di scintille radiali (con gravità), tutte nate a t0. */
export function raggiera (P, rnd, { t0, p, n = 10, vel = 3, vita = 0.4, d = 0.22, c, c1 = null, g = -4, drag = 3, su = 0.4, forma = 2, a = 1 }) {
  for (let i = 0; i < n; i++) {
    const an = rnd() * Math.PI * 2, el = (rnd() - 0.3) * 1.2, v = vel * (0.55 + rnd() * 0.6)
    P.agg({ t0: t0 + rnd() * 0.03, vita: vita * (0.7 + rnd() * 0.5), p, v: [Math.cos(an) * Math.cos(el) * v, Math.sin(el) * v * 0.9 + su * v, Math.sin(an) * Math.cos(el) * v * 0.7], g, drag, d0: d * (0.7 + rnd() * 0.6), d1: d * 0.35, c, c1, forma, segui: forma === 2, attacco: 0.04, a })
  }
}

// ───────────── l'impalcatura comune di un effetto ─────────────
export const ROSSO = [0.9, 0.09, 0.12]
export function nuovo (ctx, maxP) {
  const R = new Raccolta(), P = new Particelle(R, maxP), rnd = casuale(ctx.seme ?? 1)
  const c1 = [ctx.tinta.r, ctx.tinta.g, ctx.tinta.b]
  const c2 = ctx.tinta2 ? [ctx.tinta2.r, ctx.tinta2.g, ctx.tinta2.b] : calda(ctx.tinta, 0.5)
  const hot = calda(ctx.tinta), sc = (ctx.scala ?? 1) * 1.25
  return { R, P, rnd, c1, c2, hot, sc, a: ctx.a.toArray(), da: ctx.da.toArray(), bers: [ctx.a, ...(ctx.altri || [])].map(v => v.toArray()) }
}
export function chiudi (S, durata, extra) {
  return { gruppo: S.R.gruppo, aggiorna (t) { S.P.aggiorna(t); extra?.(t); return t < durata }, libera: () => S.R.libera() }
}
/** Un bagliore d'impatto: stella + alone + anello di camera, nati a t0 sul punto p. */
export function bagliore (S, p, t0, { dim = 1, c = S.hot, c2 = S.c1 } = {}) {
  S.P.agg({ t0, vita: 0.3, p, d0: 0.45 * dim, d1: 1.5 * dim, c, forma: 1, attacco: 0.05 })
  S.P.agg({ t0, vita: 0.4, p, d0: 0.6 * dim, d1: 1.8 * dim, c: c2, a: 0.7, forma: 0, attacco: 0.05 })
}

/**
 * Un fendente: due nastri (alone e anima bianca) su un arco nel piano di camera, centrati in `pos`.
 * Ritorna { aggiorna(t), mondo(ang, p) } con `mondo` che da un punto dell'arco dà le coordinate del mondo.
 */
export function fendente (S, pos, { roll = 0, raggio = 0.9, cx = 0, cy = -0.3, a0 = 2.4, a1 = 0.7, larg = 0.17, t0 = 0, dur = 0.2, coda = 0.45, svanisce = 0.18, c = S.c1, hot = S.hot }) {
  const g = new Group(); g.position.fromArray(pos); g.rotation.set(-0.7, 0, roll); S.R.gruppo.add(g)
  const N = 30, alone = new Nastro(S.R, N), anima = new Nastro(S.R, N)
  g.add(alone.mesh, anima.mesh)
  const ease = p => 1 - (1 - clamp01(p)) ** 2.2
  const rr = [0, 0, 0]
  const aggiorna = (t, scala = 1) => {
    const p = (t - t0) / dur, h = a0 + (a1 - a0) * ease(p), tl = a0 + (a1 - a0) * ease((p - coda) / (1.25 - coda)), f = 1 - smooth((t - t0 - dur) / svanisce)
    const vis = p > 0 && f > 0
    alone.mesh.visible = anima.mesh.visible = vis
    if (!vis) return
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1), an = tl + (h - tl) * u, co = Math.cos(an), si = Math.sin(an)
      const w = larg * scala * 1.5 * u ** 0.85 * (1 - u ** 7), al = Math.min(1, u ** 0.7 * 1.3) * f
      const x = cx + co * raggio, y = cy + si * raggio
      alone.set(i, x, y, 0, co, si, 0, w, mix3(c, hot, u ** 3 * 0.8), al)
      anima.set(i, x, y, 0, co, si, 0, w * 0.4, mix3(hot, [1, 1, 1], 0.7), al)
    }
    alone.fine(); anima.fine()
  }
  const sinR = Math.sin(roll), cosR = Math.cos(roll)
  const mondo = (an, out = rr, r = raggio) => {
    const lx = cx + Math.cos(an) * r, ly = cy + Math.sin(an) * r, x1 = lx * cosR - ly * sinR, y1 = lx * sinR + ly * cosR
    out[0] = pos[0] + x1; out[1] = pos[1] + y1 * Math.cos(0.7); out[2] = pos[2] - y1 * Math.sin(0.7); return out
  }
  const angolo = p => a0 + (a1 - a0) * ease(p)
  return { aggiorna, mondo, angolo, gruppo: g }
}
const mix3 = (a, b, k) => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)]

/** Un ventaglio di raggi (triangoli con la punta trasparente) nel gruppo `parent`: N raggi, riscritti a ogni fotogramma. */
export function ventaglio (R, parent, N) {
  const pos = new Float32Array(N * 9), col = new Float32Array(N * 12), g = R.tieni(new BufferGeometry())
  g.setAttribute('position', new BufferAttribute(pos, 3)); g.setAttribute('color', new BufferAttribute(col, 4))
  const mesh = new Mesh(g, matAdd(R, { depthTest: false })); mesh.frustumCulled = false; mesh.renderOrder = 14; parent.add(mesh)
  return {
    mesh,
    /** raggio i: angolo, lunghezza, mezza larghezza alla base, raggio interno, colore di base e della punta (+ alpha) */
    imposta (i, an, lungo, larg, r0, c, cp, a) {
      const co = Math.cos(an), si = Math.sin(an), k = i * 9, h = i * 12
      pos[k] = co * r0 - si * larg; pos[k + 1] = si * r0 + co * larg; pos[k + 2] = 0
      pos[k + 3] = co * r0 + si * larg; pos[k + 4] = si * r0 - co * larg; pos[k + 5] = 0
      pos[k + 6] = co * lungo; pos[k + 7] = si * lungo; pos[k + 8] = 0
      for (let j = 0; j < 3; j++) { const e = j < 2 ? c : cp; col[h + j * 4] = e[0]; col[h + j * 4 + 1] = e[1]; col[h + j * 4 + 2] = e[2]; col[h + j * 4 + 3] = j < 2 ? a : 0 }
    },
    fine () { g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true },
  }
}

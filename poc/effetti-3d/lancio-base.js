// Gli attrezzi comuni degli effetti di LANCIO (gruppo autonomo: niente import dagli altri gruppi).
// Tutto è funzione del tempo `t`: nessuno stato, quindi `?t=0.3` ferma un istante preciso e nessuna allocazione per fotogramma.
import {
  Color, Vector3, Group, Mesh, Sprite, SpriteMaterial, MeshBasicMaterial, AdditiveBlending, DoubleSide, CanvasTexture, SRGBColorSpace,
  BufferGeometry, BufferAttribute, Uint16BufferAttribute, Points, ShaderMaterial, Vector2, PlaneGeometry,
} from 'three'

export const sat = x => (x < 0 ? 0 : x > 1 ? 1 : x)
export const liscio = x => { x = sat(x); return x * x * (3 - 2 * x) }
export const esce = x => 1 - (1 - sat(x)) ** 3
export const entra = x => sat(x) ** 2
export const sovra = x => { x = sat(x); const c = 1.70158; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2 }
export const mix = (a, b, t) => a + (b - a) * t
export const caso = seme => { let s = (seme >>> 0) || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
export const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

// ── texture generate in codice ──
const cache = {}
function tela(n, disegna) {
  const c = document.createElement('canvas'); c.width = c.height = n
  disegna(c.getContext('2d'), n)
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t
}
const radiale = (g, n, passi) => {
  const r = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2)
  for (const [p, a] of passi) r.addColorStop(p, `rgba(255,255,255,${a})`)
  return r
}
const FATTURE = {
  alone: () => tela(128, (g, n) => { g.fillStyle = radiale(g, n, [[0, 1], [0.16, 0.75], [0.45, 0.2], [0.75, 0.04], [1, 0]]); g.fillRect(0, 0, n, n) }),
  nucleo: () => tela(128, (g, n) => { g.fillStyle = radiale(g, n, [[0, 1], [0.55, 1], [0.8, 0.45], [1, 0]]); g.fillRect(0, 0, n, n) }),
  anello: () => tela(128, (g, n) => { g.fillStyle = radiale(g, n, [[0, 0], [0.6, 0], [0.8, 1], [0.9, 0.3], [1, 0]]); g.fillRect(0, 0, n, n) }),
  stella: () => tela(128, (g, n) => {
    g.fillStyle = radiale(g, n, [[0, 1], [0.1, 0.6], [0.3, 0.1], [1, 0]]); g.fillRect(0, 0, n, n)
    for (const rot of [0, Math.PI / 2]) {
      g.save(); g.translate(n / 2, n / 2); g.rotate(rot); g.scale(1, 0.06); g.translate(-n / 2, -n / 2)
      g.fillStyle = radiale(g, n, [[0, 1], [0.35, 0.5], [1, 0]]); g.fillRect(0, 0, n, n); g.restore()
    }
  }),
  fiocco: () => tela(128, (g, n) => {
    g.translate(n / 2, n / 2); g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineWidth = 7
    for (let i = 0; i < 3; i++) {
      g.rotate(Math.PI / 3); g.beginPath(); g.moveTo(-n * 0.42, 0); g.lineTo(n * 0.42, 0)
      for (const s of [-1, 1]) for (const x of [0.2, 0.3]) { g.moveTo(s * n * x, 0); g.lineTo(s * n * (x + 0.07), -n * 0.08); g.moveTo(s * n * x, 0); g.lineTo(s * n * (x + 0.07), n * 0.08) }
      g.stroke()
    }
  }),
  puff: () => tela(128, (g, n) => {
    const r = caso(7)
    for (let i = 0; i < 9; i++) { const x = n * (0.28 + r() * 0.44), y = n * (0.28 + r() * 0.44), q = n * (0.16 + r() * 0.14); const d = g.createRadialGradient(x, y, 0, x, y, q); d.addColorStop(0, 'rgba(255,255,255,.5)'); d.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = d; g.fillRect(0, 0, n, n) }
  }),
  gelo: () => tela(128, (g, n) => { // chiazza di brina sul pavimento: stella di cristalli
    g.fillStyle = radiale(g, n, [[0, 0.5], [0.5, 0.25], [1, 0]]); g.fillRect(0, 0, n, n)
    g.translate(n / 2, n / 2); g.strokeStyle = '#fff'; g.lineWidth = 4; g.lineCap = 'round'
    for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.beginPath(); g.moveTo(n * 0.06, 0); g.lineTo(n * 0.46, 0); g.moveTo(n * 0.28, 0); g.lineTo(n * 0.36, n * 0.07); g.moveTo(n * 0.28, 0); g.lineTo(n * 0.36, -n * 0.07); g.stroke() }
  }),
}
export const tex = nome => (cache[nome] ||= FATTURE[nome]())

const BASE = { transparent: true, blending: AdditiveBlending, depthWrite: false, fog: false }
export const matAdd = (colore, map = null, opacity = 1, extra = {}) => new MeshBasicMaterial({ ...BASE, color: colore, map, opacity, side: DoubleSide, ...extra })
export function sprite(colore, nome = 'alone', dim = 1, opacity = 1) {
  const s = new Sprite(new SpriteMaterial({ ...BASE, color: colore, map: tex(nome), opacity, depthTest: false })); s.scale.set(dim, dim, 1); return s
}
export const misura = (s, d, op, rot) => { s.scale.set(d, d, 1); if (op !== undefined) s.material.opacity = sat(op); if (rot !== undefined) s.material.rotation = rot; s.visible = d > 0.001 && (op === undefined || op > 0.004) }

export function libera(g) {
  g.traverse(o => {
    o.geometry?.dispose?.()
    const m = o.material; if (m) for (const x of Array.isArray(m) ? m : [m]) x.dispose()
  })
}

// ── particelle: un solo Points con dimensione in unità-mondo per punto ──
const VERT = `attribute float dim; attribute vec3 colore; uniform float k; varying vec3 vc;
void main(){ vc = colore; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
  gl_PointSize = max(dim * k * projectionMatrix[1][1] / max(-mv.z, 0.01), 0.0); }`
const FRAG = `uniform sampler2D mappa; varying vec3 vc;
void main(){ vec4 t = texture2D(mappa, gl_PointCoord); gl_FragColor = vec4(vc, t.a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`
const _v2 = new Vector2()
export class Particelle {
  constructor(n, nome = 'alone') {
    this.n = n; this.i = 0
    this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3); this.dim = new Float32Array(n)
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(this.pos, 3)); geo.setAttribute('colore', new BufferAttribute(this.col, 3)); geo.setAttribute('dim', new BufferAttribute(this.dim, 1))
    const mat = new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: { mappa: { value: tex(nome) }, k: { value: 400 } }, ...BASE })
    this.punti = new Points(geo, mat); this.punti.frustumCulled = false
    this.punti.onBeforeRender = r => { r.getDrawingBufferSize(_v2); mat.uniforms.k.value = _v2.y * 0.5 }
  }
  inizia() { this.i = 0 }
  metti(x, y, z, d, c, a = 1) {
    if (this.i >= this.n || d <= 0 || a <= 0) return
    const i = this.i++, j = i * 3
    this.pos[j] = x; this.pos[j + 1] = y; this.pos[j + 2] = z; this.dim[i] = d
    this.col[j] = c.r * a; this.col[j + 1] = c.g * a; this.col[j + 2] = c.b * a
  }
  fine() {
    const g = this.punti.geometry
    g.attributes.position.needsUpdate = g.attributes.colore.needsUpdate = g.attributes.dim.needsUpdate = true
    g.setDrawRange(0, this.i); this.punti.visible = this.i > 0
  }
}

// ── tubo: una striscia tonda a più anelli, colore per anello (la scia che sfuma, la saetta) ──
const _t = new Vector3(), _b1 = new Vector3(), _b2 = new Vector3(), _su = new Vector3(0, 1, 0), _c = new Color()
export class Tubo {
  constructor(n, lati = 6, colore, colore2) {
    this.n = n; this.lati = lati; this.colore = colore.clone(); this.colore2 = (colore2 || colore).clone()
    this.pos = new Float32Array(n * lati * 3); this.col = new Float32Array(n * lati * 3)
    const idx = []
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < lati; j++) { const a = i * lati + j, b = i * lati + (j + 1) % lati, c = a + lati, d = b + lati; idx.push(a, c, b, b, c, d) }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(this.pos, 3)); geo.setAttribute('color', new BufferAttribute(this.col, 3)); geo.setIndex(new Uint16BufferAttribute(idx, 1))
    this.mesh = new Mesh(geo, new MeshBasicMaterial({ ...BASE, vertexColors: true, side: DoubleSide })); this.mesh.frustumCulled = false
  }
  // P: Vector3[n] (centro di ogni anello), R[n] raggi, I[n] intensità (0..1: 1 = colore2 pieno, 0 = nero/trasparente)
  imposta(P, R, I, lum = 1) {
    const { n, lati, pos, col } = this
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)]
      _t.subVectors(b, a); if (_t.lengthSq() < 1e-10) _t.set(0, 0, 1); _t.normalize()
      _b1.crossVectors(_t, _su); if (_b1.lengthSq() < 1e-4) _b1.set(1, 0, 0); _b1.normalize(); _b2.crossVectors(_t, _b1)
      _c.copy(this.colore).lerp(this.colore2, I[i] * I[i]).multiplyScalar(I[i] * lum)
      for (let j = 0; j < lati; j++) {
        const an = (j / lati) * Math.PI * 2, c = Math.cos(an) * R[i], s = Math.sin(an) * R[i], o = (i * lati + j) * 3
        pos[o] = P[i].x + _b1.x * c + _b2.x * s; pos[o + 1] = P[i].y + _b1.y * c + _b2.y * s; pos[o + 2] = P[i].z + _b1.z * c + _b2.z * s
        col[o] = _c.r; col[o + 1] = _c.g; col[o + 2] = _c.b
      }
    }
    const g = this.mesh.geometry; g.attributes.position.needsUpdate = g.attributes.color.needsUpdate = true
  }
}

// la scia di un corpo che vola: la posizione `pos(t, out)` valutata a ritroso nel tempo
export class Scia {
  constructor(n, colore, colore2, raggio, lung, lati = 6) {
    this.tubo = new Tubo(n, lati, colore, colore2); this.n = n; this.r = raggio; this.lung = lung
    this.P = Array.from({ length: n }, () => new Vector3()); this.R = new Float32Array(n); this.I = new Float32Array(n)
    this.mesh = this.tubo.mesh
  }
  // t0 = istante di partenza (prima di lì la scia non esiste), dissolvi in [0..1] la fa sparire alla fine
  imposta(pos, t, t0, dissolvi = 1, lum = 1) {
    const { n, P, R, I } = this
    for (let i = 0; i < n; i++) {
      const s = i / (n - 1), tt = Math.max(t - s * this.lung, t0)
      pos(tt, P[i])
      const vivo = sat((t - tt) / Math.max(1e-4, this.lung * s + 1e-4)) // 1 finché non è ferma alla partenza
      R[i] = this.r * (1 - s) ** 0.85 * dissolvi
      I[i] = (1 - s) ** 1.5 * dissolvi * (s === 0 ? 1 : sat(vivo * 4))
    }
    this.tubo.imposta(P, R, I, lum)
  }
}

// ── l'impatto di un colpo: bagliore, stella, anello, anello a terra, scintille ──
export function impatto({ tinta, tinta2, k = 1, seme = 1, forza = 1, n = 14, tempo = 0.45, gravita = 5, pos, stella = true, anello = true, suolo = true, vel = 1, fuoco = 0, dimScint = 1.7 }) {
  const g = new Group(), r = caso(seme); g.position.copy(pos)
  const fl = sprite(tinta2, 'alone'), st = sprite(tinta2, 'stella'), an = sprite(tinta, 'anello')
  const su = new Mesh(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), matAdd(tinta, tex('anello'))); su.position.y = 0.03 - pos.y
  g.add(fl, st, an, su)
  const pt = new Particelle(n); g.add(pt.punti)
  const F = Array.from({ length: fuoco }, () => { const s = sprite(tinta, 'puff'); g.add(s); const a = r() * 6.283, d = 0.15 + r() * 0.35; return { s, x: Math.cos(a) * d, y: (r() - 0.3) * 0.5, z: Math.sin(a) * d, f: 0.8 + r() * 0.6, rot: r() * 6 } })
  const D = Array.from({ length: n }, () => { const a = r() * 6.283, e = (r() - 0.25) * 1.6, c = Math.cos(e); return [Math.cos(a) * c, Math.sin(e) + 0.3, Math.sin(a) * c, (1.2 + r() * 2.2) * vel, 0.8 + r() * 0.5, 0.07 + r() * 0.07] })
  const q = k * forza
  const aggiorna = tl => {
    g.visible = tl >= 0 && tl < tempo + 0.05
    if (!g.visible) return
    misura(fl, q * mix(0.5, fuoco ? 1.5 : 2.0, esce(tl / 0.14)), 0.8 * (1 - liscio(tl / (tempo * (fuoco ? 0.4 : 0.7)))))
    if (stella) misura(st, q * mix(0.8, 2.6, esce(tl / 0.1)), 0.85 * (1 - liscio(tl / (tempo * 0.5))), tl * 1.5); else st.visible = false
    if (anello) misura(an, q * mix(0.3, 2.8, esce(tl / 0.3)), 0.9 * (1 - liscio(tl / (tempo * 0.9)))); else an.visible = false
    su.visible = suolo; if (suolo) { su.scale.setScalar(q * mix(0.4, 3.2, esce(tl / 0.35))); su.material.opacity = 0.85 * (1 - liscio(tl / tempo)) }
    for (const f of F) { f.s.position.set(f.x * q * esce(tl / 0.25) * 1.6, f.y * q + tl * 0.5 * q, f.z * q * esce(tl / 0.25) * 1.6); misura(f.s, q * f.f * mix(0.4, 1.5, esce(tl / 0.3)), 0.42 * (1 - liscio((tl - 0.05) / (tempo * 0.95))), f.rot + tl) }
    pt.inizia()
    for (const d of D) {
      const s = tl * d[4] > 0 ? tl : 0, v = d[3] * q, vita = tempo * d[4]
      if (tl > vita) continue
      const dr = (1 - Math.exp(-4 * s)) / 4 // attrito
      pt.metti(d[0] * v * dr, d[1] * v * dr - gravita * s * s * 0.5 * q * 0.3, d[2] * v * dr, k * d[5] * dimScint * (1 - tl / vita), _c.copy(tinta2).lerp(tinta, tl / vita), 1)
    }
    pt.fine()
  }
  return { g, aggiorna }
}

// un insieme di parti sul tempo assoluto dell'effetto
export function assembla(parti, durata, extra = {}) {
  const g = new Group(); for (const p of parti) g.add(p.g)
  return { gruppo: g, aggiorna: (t, dt) => { for (const p of parti) p.aggiorna(t, dt); return t < durata }, libera: () => libera(g), ...extra }
}

// la lista dei bersagli: il primo e gli altri
export const bersagli = ctx => [ctx.a, ...(ctx.altri || [])]
export const tinte = ctx => {
  const t = ctx.tinta, t2 = ctx.tinta2 || t.clone().lerp(new Color(1, 1, 1), 0.55)
  return [t, t2]
}
// la direzione del moto in un punto di una traiettoria (differenza finita)
const _p1 = new Vector3(), _p2 = new Vector3()
export function direzione(pos, t, out) { pos(t - 0.004, _p1); pos(t + 0.004, _p2); return out.subVectors(_p2, _p1).normalize() }

// particelle emesse da un corpo in moto: n punti sulla sua traiettoria passata, che salgono e si spengono (brace, scintille, bolle)
const _e = new Vector3(), _ec = new Color()
export function emetti(pt, pos, t, t0, { n, lung, dim, c1, c2, spread = 0.2, salita = 0.5, seme = 1, dis = 1 }) {
  for (let k = 0; k < n; k++) {
    const s = (k + hash(k + seme)) / n, tt = t - s * lung
    if (tt < t0) continue
    pos(tt, _e)
    const h1 = hash(k * 3.1 + seme) - 0.5, h2 = hash(k * 5.7 + seme) - 0.5, h3 = hash(k * 7.3 + seme) - 0.5
    pt.metti(_e.x + h1 * spread * s, _e.y + salita * s * lung + h2 * spread * s, _e.z + h3 * spread * s, dim * (1 - s * 0.7), _ec.copy(c2).lerp(c1, s), (1 - s) * dis)
  }
}

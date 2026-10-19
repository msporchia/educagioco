// Gli effetti del cielo in 3D: scintille e fumo (due Points in tutto), anelli d'urto,
// raggi del cannone e cocci dei sassi (un InstancedMesh solo). Leggono le stesse liste che
// la view dà al disegno 2D (`particelle`, `anelli`, `raggi`, `frammenti`, in pixel) e
// non tengono niente di loro, tranne lo sciame: le scintille che il disegno aggiunge da sé
// (lo strappo dell'ala, i buchi della nave madre), anche quelle in pixel.
import { BufferGeometry, BufferAttribute, Points, ShaderMaterial, AdditiveBlending, NormalBlending,
         Mesh, PlaneGeometry, InstancedMesh, MeshStandardMaterial, Color, Object3D, DynamicDrawUsage,
         SRGBColorSpace } from 'three'
import { rgb } from './rumore.js'
import { coccio } from './forme.js'

const PUNTI_V = /* glsl */`
attribute float dim; attribute float alfa; attribute vec3 colore;
varying vec3 vC; varying float vA; uniform float uPx;
void main(){ vC = colore; vA = alfa; gl_PointSize = dim * uPx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`
const FUOCO_F = /* glsl */`
varying vec3 vC; varying float vA;
void main(){ float d = length(gl_PointCoord - .5) * 2.; if (d > 1.) discard;
  float a = pow(1. - d, 1.6) * vA; gl_FragColor = vec4(vC * (1. + 1.4 * pow(1. - d, 6.)), a); }`
const FUMO_F = /* glsl */`
varying vec3 vC; varying float vA;
void main(){ float d = length(gl_PointCoord - .5) * 2.; if (d > 1.) discard;
  gl_FragColor = vec4(vC, smoothstep(1., .2, d) * vA * .8); }`

// un lotto di punti: si riempie da capo a ogni fotogramma, senza allocare
class Lotto {
  constructor(max, frammento, blending) {
    this.max = max; this.n = 0
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3)
    this.dim = new Float32Array(max); this.alfa = new Float32Array(max)
    const g = new BufferGeometry()
    for (const [nome, a, k] of [['position', this.pos, 3], ['colore', this.col, 3], ['dim', this.dim, 1], ['alfa', this.alfa, 1]])
      g.setAttribute(nome, new BufferAttribute(a, k).setUsage(DynamicDrawUsage))
    this.g = g
    this.mat = new ShaderMaterial({ vertexShader: PUNTI_V, fragmentShader: frammento, uniforms: { uPx: { value: 1 } },
                                    transparent: true, depthWrite: false, blending })
    this.punti = new Points(g, this.mat); this.punti.frustumCulled = false; this.punti.renderOrder = 5
  }
  metti(x, y, z, r, g, b, dim, alfa) {
    if (this.n >= this.max) return
    const i = this.n++
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z
    this.col[i * 3] = r; this.col[i * 3 + 1] = g; this.col[i * 3 + 2] = b
    this.dim[i] = dim; this.alfa[i] = alfa
  }
  chiudi() {
    this.g.setDrawRange(0, this.n)
    for (const k of ['position', 'colore', 'dim', 'alfa']) {
      const a = this.g.attributes[k]; a.needsUpdate = true
      a.clearUpdateRanges(); a.addUpdateRange(0, this.n * a.itemSize)
    }
  }
}

// lo sciame del disegno: scintille in pixel che il gioco non conosce
class Sciame {
  constructor(max) {
    this.max = max; this.i = 0
    this.x = new Float32Array(max); this.y = new Float32Array(max); this.vx = new Float32Array(max); this.vy = new Float32Array(max)
    this.vita = new Float32Array(max); this.durata = new Float32Array(max); this.r = new Float32Array(max)
    this.c = new Float32Array(max * 3); this.fumo = new Uint8Array(max); this.peso = new Float32Array(max)
  }
  emetti(x, y, vx, vy, vita, r, col, fumo = false, peso = 0) {
    const k = this.i; this.i = (this.i + 1) % this.max
    this.x[k] = x; this.y[k] = y; this.vx[k] = vx; this.vy[k] = vy; this.vita[k] = this.durata[k] = vita
    this.r[k] = r; const t = rgb(col); this.c[k * 3] = t[0]; this.c[k * 3 + 1] = t[1]; this.c[k * 3 + 2] = t[2]
    this.fumo[k] = fumo ? 1 : 0; this.peso[k] = peso
  }
  avanza(dt) {
    for (let k = 0; k < this.max; k++) {
      if (this.vita[k] <= 0) continue
      this.vita[k] -= dt
      this.x[k] += this.vx[k] * dt; this.y[k] += this.vy[k] * dt; this.vy[k] += this.peso[k] * dt
    }
  }
}

// `tetti`: quanti punti di fuoco e di fumo al massimo (la fascia del telefono, store/qualita.js): oltre il tetto le scintille non si disegnano
export function creaEffetti(scena, tetti = { scintille: 1400, fumo: 400 }) {
  const fuoco = new Lotto(tetti.scintille, FUOCO_F, AdditiveBlending)
  const fumo = new Lotto(tetti.fumo, FUMO_F, NormalBlending)
  fumo.punti.renderOrder = 4
  scena.add(fumo.punti, fuoco.punti)
  const sciame = new Sciame(500)

  // gli anelli d'urto: un quadrato con l'anello disegnato nello shader
  const quadro = new PlaneGeometry(2, 2)
  const ANELLO_F = /* glsl */`
    varying vec2 vU; uniform vec3 uC; uniform float uA, uL;
    void main(){ float r = length(vU); float a = smoothstep(uL, 0., abs(r - .87)) * uA;
      a += smoothstep(.87, 0., r) * uA * .12;
      gl_FragColor = vec4(uC * 1.6 * a, a); }`
  const QUADRO_V = /* glsl */`varying vec2 vU; void main(){ vU = uv * 2. - 1.; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`
  const anelli = Array.from({ length: 12 }, () => {
    const m = new Mesh(quadro, new ShaderMaterial({ vertexShader: QUADRO_V, fragmentShader: ANELLO_F, transparent: true,
      depthWrite: false, blending: AdditiveBlending, uniforms: { uC: { value: new Color() }, uA: { value: 0 }, uL: { value: 0.05 } } }))
    m.visible = false; m.renderOrder = 6; m.frustumCulled = false; scena.add(m); return m
  })

  // i raggi: un nastro con l'anima bianca e il colore attorno
  const RAGGIO_F = /* glsl */`
    varying vec2 vU; uniform vec3 uC; uniform float uA;
    void main(){ float y = abs(vU.y); float x = abs(vU.x);
      float anima = smoothstep(.22, .0, y), alone = pow(1. - y, 2.2);
      float a = (alone * .8 + anima) * uA * smoothstep(1., .9, x);
      gl_FragColor = vec4((uC * 1.8 * alone + vec3(1.3) * anima) * uA, a); }`
  const raggi = Array.from({ length: 10 }, () => {
    const m = new Mesh(quadro, new ShaderMaterial({ vertexShader: QUADRO_V, fragmentShader: RAGGIO_F, transparent: true,
      depthWrite: false, blending: AdditiveBlending, uniforms: { uC: { value: new Color() }, uA: { value: 0 } } }))
    m.visible = false; m.renderOrder = 7; m.frustumCulled = false; scena.add(m); return m
  })

  // i cocci: tutti insieme, un colore per istanza
  const MAXC = 72
  const cocci = new InstancedMesh(coccio(), new MeshStandardMaterial({ roughness: 0.85, metalness: 0.1, envMapIntensity: 0.6 }), MAXC)
  cocci.instanceMatrix.setUsage(DynamicDrawUsage); cocci.frustumCulled = false; cocci.count = 0
  cocci.setColorAt(0, new Color(1, 1, 1))
  scena.add(cocci)
  const o = new Object3D(), col = new Color()

  // un anello nuovo e piccolo è un sasso che esplode: il 3D ci aggiunge la palla di fuoco e il fumo
  const visti = new WeakSet()
  function scoppio(g, S) {
    for (let i = 0; i < 34; i++) {
      const a = Math.random() * 6.283, v = (60 + Math.random() * 260) * S
      sciame.emetti(g.x, g.y, Math.cos(a) * v, Math.sin(a) * v, 0.3 + Math.random() * 0.6, (1.2 + Math.random() * 2.4) * S,
                    i % 3 ? g.c : '#ffffff', false, 60 * S)
    }
    for (let i = 0; i < 4; i++) sciame.emetti(g.x, g.y, 0, 0, 0.28 + i * 0.05, (14 + i * 4) * S, '#ffb347', false, 0)
    for (let i = 0; i < 9; i++) {
      const a = Math.random() * 6.283, v = (15 + Math.random() * 45) * S
      sciame.emetti(g.x, g.y, Math.cos(a) * v, Math.sin(a) * v, 0.9 + Math.random() * 0.7, (5 + Math.random() * 4) * S, '#3a3440', true, -12 * S)
    }
  }

  return {
    sciame,
    // i punti sono in pixel: la tela li moltiplica per il suo pixel ratio
    pixel(dpr) { fuoco.mat.uniforms.uPx.value = dpr; fumo.mat.uniforms.uPx.value = dpr },
    // `q`: la scena della view; `X`, `Y`: da pixel a mondo; `k`: mondo per pixel
    disegna(q, X, Y, k, dt) {
      const piccolo = Math.min(q.W, q.H) * 0.55
      for (const g of q.anelli) if (!visti.has(g)) { visti.add(g); if (g.max <= piccolo) scoppio(g, q.S) }
      fuoco.n = 0; fumo.n = 0
      for (const p of q.particelle) {
        const a = Math.max(0, Math.min(1, p.vita)), t = rgb(p.c)
        if (p.leggera) fumo.metti(X(p.x), Y(p.y), 0.6, t[0] * 0.8, t[1] * 0.8, t[2] * 0.8, p.r * 4.2, a * 0.85)
        else fuoco.metti(X(p.x), Y(p.y), 0.8, t[0] * 1.4, t[1] * 1.4, t[2] * 1.4, p.r * 4.4, a)
      }
      sciame.avanza(dt)
      for (let i = 0; i < sciame.max; i++) {
        if (sciame.vita[i] <= 0) continue
        const v = sciame.vita[i] / sciame.durata[i]
        const r = sciame.c[i * 3], g = sciame.c[i * 3 + 1], b = sciame.c[i * 3 + 2]
        if (sciame.fumo[i]) fumo.metti(X(sciame.x[i]), Y(sciame.y[i]), 0.5, r, g, b, sciame.r[i] * (5 - 2.5 * v), v * 0.7)
        else fuoco.metti(X(sciame.x[i]), Y(sciame.y[i]), 0.9, r * 1.5, g * 1.5, b * 1.5, sciame.r[i] * 4 * (0.4 + 0.6 * v), v)
      }
      // la bocca del cannone che spara: un lampo bianco dove nasce il raggio
      for (const r of q.raggi) {
        const a = Math.max(0, r.vita)
        fuoco.metti(X(r.x0), Y(r.y0), 1, 1.4, 1.4, 1.4, 52 * q.S * a, a)
      }
      fuoco.chiudi(); fumo.chiudi()

      let i = 0
      for (const g of q.anelli) {
        if (i >= anelli.length) break
        if (g.vita <= 0 || g.r <= 0) continue
        const m = anelli[i++], s = (g.r / 0.87) * k
        m.visible = true; m.position.set(X(g.x), Y(g.y), 0.3); m.scale.set(s, s, 1)
        const u = m.material.uniforms, t = rgb(g.c)
        u.uC.value.setRGB(t[0], t[1], t[2]); u.uA.value = Math.max(0, g.vita) * 0.55
        u.uL.value = Math.min(0.4, (6 * q.S * Math.max(0.2, g.vita)) / Math.max(1, g.r))
      }
      for (; i < anelli.length; i++) anelli[i].visible = false

      i = 0
      for (const r of q.raggi) {
        if (i >= raggi.length) break
        const a = Math.max(0, r.vita)
        if (a <= 0) continue
        const m = raggi[i++], x0 = X(r.x0), y0 = Y(r.y0), x1 = X(r.x1), y1 = Y(r.y1)
        const lungo = Math.hypot(x1 - x0, y1 - y0)
        m.visible = true; m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0.9)
        m.rotation.z = Math.atan2(y1 - y0, x1 - x0)
        m.scale.set(lungo / 2 + 13 * q.S * k, 13 * q.S * k * Math.max(0.3, a) * 1.1, 1)
        const u = m.material.uniforms, t = rgb(r.c)
        u.uC.value.setRGB(t[0], t[1], t[2]); u.uA.value = a
      }
      for (; i < raggi.length; i++) raggi[i].visible = false

      let n = 0
      for (const f of q.frammenti) {
        if (n >= MAXC) break
        const v = Math.max(0, f.vita)
        if (v <= 0) continue
        const p = f.punti[1], s = Math.hypot(p[0], p[1]) * 0.42 * (0.35 + 0.65 * v) * k
        o.position.set(X(f.x), Y(f.y), 0.4)
        o.rotation.set(f.rot * 0.7 + n, f.rot, n * 1.3)
        o.scale.set(s, s, s); o.updateMatrix()
        cocci.setMatrixAt(n, o.matrix)
        const t = rgb(f.c); cocci.setColorAt(n, col.setRGB(t[0], t[1], t[2], SRGBColorSpace))
        n++
      }
      cocci.count = n
      cocci.instanceMatrix.needsUpdate = true
      if (cocci.instanceColor) cocci.instanceColor.needsUpdate = true
    },
  }
}

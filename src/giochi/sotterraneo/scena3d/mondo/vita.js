// La vita del mondo di sopra: il fumo dai camini, gli spruzzi alla ruota del mulino, le scintille della fucina e del falò, le
// fiamme, gli uccelli che girano in cielo. Le particelle stanno in tre Points con le loro riserve fisse, le fiamme in una
// InstancedMesh: niente allocato a fotogramma. Si emette solo da dove si vede (la nebbia), e solo dai pezzi costruiti (`sorgenti`).
// Dal prototipo poc/mondo-sopra/vita.js.
import { BufferGeometry, BufferAttribute, DynamicDrawUsage, ShaderMaterial, AdditiveBlending, NormalBlending, Color, Points,
         PlaneGeometry, InstancedMesh, DoubleSide, Matrix4, Quaternion, Euler, Vector3, Float32BufferAttribute, MeshBasicMaterial } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { U } from './vesti.js'

class Particelle {
  constructor(scena, quante, { colore, additivo = false, tex }) {
    this.n = quante
    this.pos = new Float32Array(quante * 3); this.vel = new Float32Array(quante * 3)
    this.eta = new Float32Array(quante).fill(1); this.vita = new Float32Array(quante).fill(1)
    this.taglia = new Float32Array(quante); this.k = new Float32Array(quante).fill(1)
    const g = new BufferGeometry()
    this.aPos = new BufferAttribute(this.pos, 3); this.aK = new BufferAttribute(this.k, 1); this.aT = new BufferAttribute(this.taglia, 1)
    for (const a of [this.aPos, this.aK, this.aT]) a.setUsage(DynamicDrawUsage)
    g.setAttribute('position', this.aPos); g.setAttribute('eta', this.aK); g.setAttribute('taglia', this.aT)
    this.mat = new ShaderMaterial({
      transparent: true, depthWrite: false, blending: additivo ? AdditiveBlending : NormalBlending,
      uniforms: { tMacchia: { value: tex }, uColore: { value: new Color(colore) }, uScala: { value: 400 } },
      vertexShader: `attribute float eta; attribute float taglia; varying float vEta; uniform float uScala;
        void main () { vEta = eta; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
          gl_PointSize = eta >= 1.0 ? 0.0 : taglia * uScala / -mv.z; }`,
      fragmentShader: `uniform sampler2D tMacchia; uniform vec3 uColore; varying float vEta;
        void main () { float a = texture2D(tMacchia, gl_PointCoord).a; if (a < 0.02) discard;
          gl_FragColor = vec4(uColore, a * (1.0 - vEta) * min(1.0, vEta * 8.0)); }`,
    })
    this.geo = g
    this.punti = new Points(g, this.mat); this.punti.frustumCulled = false; this.punti.renderOrder = 8
    scena.add(this.punti)
    this.prossima = 0; this.vive = 0
  }
  emetti(x, y, z, vx, vy, vz, vita, taglia) {
    const i = this.prossima; this.prossima = (i + 1) % this.n
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz
    this.eta[i] = 0; this.vita[i] = vita; this.taglia[i] = taglia
  }
  passo(dt, gravita, cresce) {
    let vive = 0
    for (let i = 0; i < this.n; i++) {
      if (this.eta[i] >= 1) { this.k[i] = 1; continue }
      vive++
      this.eta[i] = Math.min(1, this.eta[i] + dt / this.vita[i])
      this.vel[i * 3 + 1] += gravita * dt
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt
      this.taglia[i] *= 1 + cresce * dt
      this.k[i] = this.eta[i]
    }
    // niente vive e niente da mandare alla scheda video: si salta anche il disegno
    this.punti.visible = vive > 0 || this.vive > 0
    this.vive = vive
    if (this.punti.visible) { this.aPos.needsUpdate = true; this.aK.needsUpdate = true; this.aT.needsUpdate = true }
  }
  via() { this.geo.dispose(); this.mat.dispose() }
}

const FIAMME_MAX = 24
function fiamme(scena) {
  const a = new PlaneGeometry(0.6, 0.9), b = new PlaneGeometry(0.6, 0.9).rotateY(Math.PI / 2)
  const g = mergeGeometries([a, b]); g.translate(0, 0.45, 0)
  const mat = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide, uniforms: { uTempo: U.uTempo },
    vertexShader: 'varying vec2 vUv; varying float vF; void main () { vUv = uv; vF = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uTempo; varying vec2 vUv; varying float vF;
      float h (vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      float n (vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main () {
        vec2 p = vUv; float x = abs(p.x - 0.5) * 2.0, t = uTempo + vF;
        float fiamma = n(vec2(p.x * 4.0, p.y * 3.0 - t * 3.5)) * 0.6 + n(vec2(p.x * 9.0, p.y * 6.0 - t * 6.0)) * 0.4;
        float forma = (1.0 - p.y) * (1.0 - x * x) * 1.6 - fiamma * 0.8 * p.y;
        if (forma < 0.08) discard;
        gl_FragColor = vec4(mix(vec3(1.0, 0.25, 0.05), vec3(1.0, 0.85, 0.35), smoothstep(0.1, 0.7, forma)), smoothstep(0.08, 0.3, forma));
      }`,
  })
  const im = new InstancedMesh(g, mat, FIAMME_MAX)
  im.count = 0; im.frustumCulled = false; im.renderOrder = 9
  scena.add(im)
  return im
}

export function creaVita(scena, trame) {
  const tex = trame.macchia
  const fumo = new Particelle(scena, 420, { colore: 0xe8e6e2, tex })
  const gocce = new Particelle(scena, 160, { colore: 0xe6f6ff, tex })
  const faville = new Particelle(scena, 160, { colore: 0xffa040, tex, additivo: true })
  const imF = fiamme(scena)
  // gli uccelli: una V che sbatte le ali (nello shader), due stormi che girano larghi attorno all'eroe
  const gv = new BufferGeometry()
  gv.setAttribute('position', new Float32BufferAttribute([-0.35, 0.05, -0.05, 0, 0, 0.12, 0, 0, -0.08, 0.35, 0.05, -0.05, 0, 0, -0.08, 0, 0, 0.12], 3))
  gv.computeVertexNormals()
  const mv = new MeshBasicMaterial({ color: 0x55586a, side: DoubleSide, fog: true })
  mv.onBeforeCompile = sh => {
    sh.uniforms.uTempo = U.uTempo
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTempo;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float fase = instanceMatrix[3].x * 3.1 + instanceMatrix[3].z * 1.7;
        transformed.y += abs(position.x) * sin(uTempo * 11.0 + fase) * 0.9;`)
  }
  const N_UCCELLI = 14
  const uccelli = new InstancedMesh(gv, mv, N_UCCELLI)
  uccelli.frustumCulled = false
  scena.add(uccelli)
  const M = new Matrix4(), Q = new Quaternion(), E = new Euler(), P = new Vector3(), S = new Vector3(0.7, 0.7, 0.7)
  const acc = { fumo: 0, gocce: 0, faville: 0 }
  // le sorgenti dei pezzi costruiti che si vedono: { camini: [Vector3], braci, fuochi, spruzzi }
  let src = { camini: [], braci: [], fuochi: [], spruzzi: [] }
  const tutte = l => l.length
  return {
    accese: [],   // faville in più (la botola aperta): [Vector3]
    sorgenti(s) {
      src = s
      imF.count = Math.min(FIAMME_MAX, s.fuochi.length)
      for (let i = 0; i < imF.count; i++) imF.setMatrixAt(i, M.compose(s.fuochi[i], Q.identity(), S.set(1, 1, 1)))
      imF.instanceMatrix.needsUpdate = true
      S.set(0.7, 0.7, 0.7)
    },
    passo(dt, t, centro) {
      const c = src
      if (tutte(c.camini)) {
        acc.fumo += dt * c.camini.length * 1.8
        while (acc.fumo > 1) {
          acc.fumo--
          const p = c.camini[Math.floor(Math.random() * c.camini.length)]
          fumo.emetti(p.x + (Math.random() - 0.5) * 0.1, p.y, p.z + (Math.random() - 0.5) * 0.1, 0.18 + Math.random() * 0.12, 0.45 + Math.random() * 0.2, -0.05, 3.5 + Math.random() * 1.5, 0.35 + Math.random() * 0.15)
        }
      }
      fumo.passo(dt, 0.02, 0.35)
      if (tutte(c.spruzzi)) {
        acc.gocce += dt * 45 * c.spruzzi.length
        while (acc.gocce > 1) {
          acc.gocce--
          const s = c.spruzzi[Math.floor(Math.random() * c.spruzzi.length)], a = Math.random() * Math.PI * 2
          gocce.emetti(s.x + (Math.random() - 0.5) * 0.4, s.y + Math.random() * 0.1, s.z + (Math.random() - 0.5) * 0.9, Math.cos(a) * 0.5, 1.2 + Math.random() * 1.2, Math.sin(a) * 0.8, 0.7 + Math.random() * 0.3, 0.08 + Math.random() * 0.06)
        }
      }
      gocce.passo(dt, -5.5, 0.2)
      const nb = c.braci.length, nf = c.fuochi.length, sorgenti = nb + nf + this.accese.length
      acc.faville += dt * sorgenti * 6
      while (acc.faville > 1 && sorgenti) {
        acc.faville--
        let i = Math.floor(Math.random() * sorgenti)
        const s = i < nb ? c.braci[i] : (i -= nb) < nf ? c.fuochi[i] : this.accese[i - nf]
        faville.emetti(s.x + (Math.random() - 0.5) * 0.3, s.y + 0.1, s.z + (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.4, 0.9 + Math.random() * 0.8, (Math.random() - 0.5) * 0.4, 0.6 + Math.random() * 0.5, 0.06 + Math.random() * 0.04)
      }
      faville.passo(dt, 0.3, -0.5)
      for (let i = 0; i < N_UCCELLI; i++) {
        // in alto e lontani, verso nord: dall'alto sembrerebbero schegge sul prato
        const st = i % 2, k = Math.floor(i / 2), v = st ? -0.16 : 0.12, r = (st ? 13 : 18) + (k % 3), a = t * v + k * 0.22
        const x = centro.x + (st ? 9 : -7) + Math.cos(a) * r, z = centro.z - 26 + Math.sin(a) * r * 0.6, y = centro.y + (st ? 22 : 19) + Math.sin(t * 0.7 + k) * 0.4 + (k % 2) * 0.6
        E.set(0, -a + (v > 0 ? -Math.PI : 0), 0)
        uccelli.setMatrixAt(i, M.compose(P.set(x, y, z), Q.setFromEuler(E), S))
      }
      uccelli.instanceMatrix.needsUpdate = true
    },
    scala(px) { for (const p of [fumo, gocce, faville]) p.mat.uniforms.uScala.value = px },
    via() {
      for (const p of [fumo, gocce, faville]) { scena.remove(p.punti); p.via() }
      for (const x of [imF, uccelli]) { scena.remove(x); x.geometry.dispose(); x.material.dispose(); x.dispose() }
    },
  }
}

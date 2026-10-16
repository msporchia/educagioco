// La vita: il fumo dai camini, gli spruzzi alla ruota del mulino, le scintille della fucina e del falò, le fiamme, gli
// uccelli che girano in cielo. Le particelle stanno in tre Points con le loro riserve fisse: niente allocazioni per fotogramma.
import * as THREE from 'three'
import { macchia } from './trame.js'
import { U } from './vesti.js'

class Particelle {
  constructor (scena, quante, { colore, additivo = false, tex }) {
    this.n = quante
    this.pos = new Float32Array(quante * 3); this.vel = new Float32Array(quante * 3)
    this.eta = new Float32Array(quante).fill(1); this.vita = new Float32Array(quante).fill(1)
    this.taglia = new Float32Array(quante); this.k = new Float32Array(quante)
    const g = new THREE.BufferGeometry()
    this.aPos = new THREE.BufferAttribute(this.pos, 3); this.aK = new THREE.BufferAttribute(this.k, 1); this.aT = new THREE.BufferAttribute(this.taglia, 1)
    for (const a of [this.aPos, this.aK, this.aT]) a.setUsage(THREE.DynamicDrawUsage)
    g.setAttribute('position', this.aPos); g.setAttribute('eta', this.aK); g.setAttribute('taglia', this.aT)
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: additivo ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { tMacchia: { value: tex }, uColore: { value: new THREE.Color(colore) }, uScala: { value: 400 } },
      vertexShader: `attribute float eta; attribute float taglia; varying float vEta; uniform float uScala;
        void main () { vEta = eta; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
          gl_PointSize = eta >= 1.0 ? 0.0 : taglia * uScala / -mv.z; }`,
      fragmentShader: `uniform sampler2D tMacchia; uniform vec3 uColore; varying float vEta;
        void main () { float a = texture2D(tMacchia, gl_PointCoord).a; if (a < 0.02) discard;
          gl_FragColor = vec4(uColore, a * (1.0 - vEta) * min(1.0, vEta * 8.0)); }`,
    })
    this.punti = new THREE.Points(g, this.mat); this.punti.frustumCulled = false; this.punti.renderOrder = 8
    scena.add(this.punti)
    this.prossima = 0
  }
  emetti (x, y, z, vx, vy, vz, vita, taglia) {
    const i = this.prossima; this.prossima = (i + 1) % this.n
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz
    this.eta[i] = 0; this.vita[i] = vita; this.taglia[i] = taglia
  }
  passo (dt, gravita, cresce) {
    for (let i = 0; i < this.n; i++) {
      if (this.eta[i] >= 1) { this.k[i] = 1; continue }
      this.eta[i] = Math.min(1, this.eta[i] + dt / this.vita[i])
      this.vel[i * 3 + 1] += gravita * dt
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt
      this.taglia[i] *= 1 + cresce * dt
      this.k[i] = this.eta[i]
    }
    this.aPos.needsUpdate = true; this.aK.needsUpdate = true; this.aT.needsUpdate = true
  }
}

// le fiamme: due piani incrociati con un fuoco disegnato dallo shader
function materialeFiamma () {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTempo: U.uTempo },
    vertexShader: 'varying vec2 vUv; void main () { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uTempo; varying vec2 vUv;
      float h (vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      float n (vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main () {
        vec2 p = vUv; float x = abs(p.x - 0.5) * 2.0;
        float fiamma = n(vec2(p.x * 4.0, p.y * 3.0 - uTempo * 3.5)) * 0.6 + n(vec2(p.x * 9.0, p.y * 6.0 - uTempo * 6.0)) * 0.4;
        float forma = (1.0 - p.y) * (1.0 - x * x) * 1.6 - fiamma * 0.8 * p.y;
        if (forma < 0.08) discard;
        vec3 c = mix(vec3(1.0, 0.25, 0.05), vec3(1.0, 0.85, 0.35), smoothstep(0.1, 0.7, forma));
        gl_FragColor = vec4(c, smoothstep(0.08, 0.3, forma));
      }`,
  })
}

export function creaVita (scena, kit, m) {
  const tex = macchia()
  const fumo = new Particelle(scena, 420, { colore: 0xe8e6e2, tex })
  const gocce = new Particelle(scena, 160, { colore: 0xe6f6ff, tex })
  const faville = new Particelle(scena, 160, { colore: 0xffa040, tex, additivo: true })
  const matF = materialeFiamma()
  const fiamme = []
  for (const f of kit.fuochi) {
    const g = new THREE.PlaneGeometry(0.6, 0.9); g.translate(0, 0.45, 0)
    for (const ry of [0, Math.PI / 2]) { const me = new THREE.Mesh(g, matF); me.position.copy(f); me.rotation.y = ry; me.renderOrder = 9; scena.add(me); fiamme.push(me) }
  }
  // gli uccelli: una V che sbatte le ali (nello shader), due stormi che girano larghi
  const gv = new THREE.BufferGeometry()
  gv.setAttribute('position', new THREE.Float32BufferAttribute([-0.35, 0.05, -0.05, 0, 0, 0.12, 0, 0, -0.08, 0.35, 0.05, -0.05, 0, 0, -0.08, 0, 0, 0.12], 3))
  gv.computeVertexNormals()
  const mv = new THREE.MeshBasicMaterial({ color: 0x3a3a44, side: THREE.DoubleSide })
  mv.onBeforeCompile = sh => {
    sh.uniforms.uTempo = U.uTempo
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTempo;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float fase = instanceMatrix[3].x * 3.1 + instanceMatrix[3].z * 1.7;
        transformed.y += abs(position.x) * sin(uTempo * 11.0 + fase) * 0.9;`)
  }
  const N_UCCELLI = 14
  const uccelli = new THREE.InstancedMesh(gv, mv, N_UCCELLI)
  uccelli.frustumCulled = false
  scena.add(uccelli)
  const stormi = [{ cx: m.W * 0.35, cz: m.H * 0.4, r: 18, v: 0.12, h: 10 }, { cx: m.W * 0.7, cz: m.H * 0.3, r: 13, v: -0.16, h: 12 }]
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3(1.1, 1.1, 1.1)

  let acc = { fumo: 0, gocce: 0, faville: 0 }
  return {
    fumo, faville, accesi: [],   // altre sorgenti di faville (la botola aperta): { pos, quanto }
    passo (dt, t) {
      acc.fumo += dt * kit.camini.length * 1.8
      while (acc.fumo > 1) {
        acc.fumo--
        const c = kit.camini[Math.floor(Math.random() * kit.camini.length)]
        fumo.emetti(c.x + (Math.random() - 0.5) * 0.1, c.y, c.z + (Math.random() - 0.5) * 0.1, 0.18 + Math.random() * 0.12, 0.45 + Math.random() * 0.2, -0.05, 3.5 + Math.random() * 1.5, 0.35 + Math.random() * 0.15)
      }
      fumo.passo(dt, 0.02, 0.35)
      if (kit.spruzzo) {
        acc.gocce += dt * 45
        while (acc.gocce > 1) {
          acc.gocce--
          const a = Math.random() * Math.PI * 2
          gocce.emetti(kit.spruzzo.x + (Math.random() - 0.5) * 0.4, kit.spruzzo.y + Math.random() * 0.1, kit.spruzzo.z + (Math.random() - 0.5) * 0.9, Math.cos(a) * 0.5, 1.2 + Math.random() * 1.2, Math.sin(a) * 0.8, 0.7 + Math.random() * 0.3, 0.08 + Math.random() * 0.06)
        }
        gocce.passo(dt, -5.5, 0.2)
      }
      const sorgenti = kit.braci.length + kit.fuochi.length + this.accesi.length
      acc.faville += dt * sorgenti * 6
      while (acc.faville > 1) {
        acc.faville--
        let i = Math.floor(Math.random() * sorgenti)
        const s = i < kit.braci.length ? kit.braci[i] : (i -= kit.braci.length) < kit.fuochi.length ? kit.fuochi[i] : this.accesi[i - kit.fuochi.length].pos
        faville.emetti(s.x + (Math.random() - 0.5) * 0.3, s.y + 0.1, s.z + (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.4, 0.9 + Math.random() * 0.8, (Math.random() - 0.5) * 0.4, 0.6 + Math.random() * 0.5, 0.06 + Math.random() * 0.04)
      }
      faville.passo(dt, 0.3, -0.5)
      for (let i = 0; i < N_UCCELLI; i++) {
        const st = stormi[i % 2], k = Math.floor(i / 2)
        const a = t * st.v + k * 0.22
        const x = st.cx + Math.cos(a) * (st.r + (k % 3)), z = st.cz + Math.sin(a) * (st.r + (k % 3)), y = st.h + Math.sin(t * 0.7 + k) * 0.4 + (k % 2) * 0.6
        E.set(0, -a + (st.v > 0 ? -Math.PI : 0), 0)
        M.compose(P.set(x, y, z), Q.setFromEuler(E), S)
        uccelli.setMatrixAt(i, M)
      }
      uccelli.instanceMatrix.needsUpdate = true
    },
    scala (px) { for (const p of [fumo, gocce, faville]) p.mat.uniforms.uScala.value = px },
  }
}

// La nebbia dell'esplorazione del mondo di sopra, fatta bene: quello che non si è visto non si disegna, e sopra c'è un velo di
// nuvole chiare. Due trame del mondo, un texel per cella: `visto` (0/1, filtrata: le superfici sfumano ai bordi) e `quando` (il
// tempo in cui la cella si è vista, letta senza filtro: un oggetto sale dal terreno tutto intero). Si riscrivono solo quando si
// scopre una cella, mai a fotogramma. Sopra le celle mai viste, i cartelli di nuvola del velo (una InstancedMesh). La nebbia del
// gioco (il bit per cella che si salva) la tiene motore/mondo-sopra.js; qui solo il disegno. docs/sotterraneo/grafica-3d.md.
import { DataTexture, RedFormat, FloatType, UnsignedByteType, LinearFilter, NearestFilter, InstancedMesh, PlaneGeometry, ShaderMaterial,
         Matrix4, Quaternion, Euler, Vector3 } from 'three'
import { scopri } from '../../motore/terra.js'
import { U, GLSL_RUMORE } from './vesti.js'
import { caso } from './suolo.js'

const MAI = 1e9          // il tempo di una cella mai vista: «molto avanti»
const PASSO_VELO = 4.5   // un cartello di nuvola ogni tante celle

// i dati delle due trame dal bit della nebbia (puro): vista = 255 e «da sempre», mai vista = 0 e «molto avanti»
export function trameDellaNebbia(nebbia) {
  const N = nebbia.length, visto = new Uint8Array(N), quando = new Float32Array(N)
  for (let k = 0; k < N; k++) { visto[k] = nebbia[k] ? 255 : 0; quando[k] = nebbia[k] ? -100 : MAI }
  return { visto, quando }
}
// le celle appena scoperte entrano nelle due trame, col tempo della scoperta (puro)
export function segnaScoperte(nuove, W, { visto, quando }, tempo) {
  for (const c of nuove) { const k = c.y * W + c.x; visto[k] = 255; quando[k] = tempo }
}
export { MAI }

export function creaNebbia(m, scena, nebbia) {
  const { W, H } = m
  const dati = trameDellaNebbia(nebbia), { visto, quando } = dati
  const tVisto = new DataTexture(visto, W, H, RedFormat, UnsignedByteType)
  tVisto.magFilter = tVisto.minFilter = LinearFilter; tVisto.needsUpdate = true
  const tQuando = new DataTexture(quando, W, H, RedFormat, FloatType)
  tQuando.magFilter = tQuando.minFilter = NearestFilter; tQuando.needsUpdate = true
  U.uVisto.value = tVisto; U.uQuando.value = tQuando; U.uMappa.value.set(W, H)

  // il velo: cartelli orizzontali di nuvola, che svaniscono dove la terra sotto si è vista
  const r = caso(m.seme * 13 + 3), punti = []
  for (let z = -PASSO_VELO; z < H + PASSO_VELO; z += PASSO_VELO) for (let x = -PASSO_VELO; x < W + PASSO_VELO; x += PASSO_VELO)
    punti.push([x + (r() - 0.5) * 3, 2.2 + r() * 2.2, z + (r() - 0.5) * 3, 5.5 + r() * 3.5, r() * 6.28])
  const geo = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
  const mat = new ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { uTempo: U.uTempo, uVisto: U.uVisto, uMappa: U.uMappa, uNebbia: U.uNebbia },
    vertexShader: /* glsl */`
      uniform float uTempo; uniform sampler2D uVisto; uniform vec2 uMappa; uniform float uNebbia;
      varying vec2 vUv; varying float vAlfa; varying float vSeme;
      void main () {
        vec3 c = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        vec2 uv = c.xz / uMappa, d = 2.5 / uMappa;
        float v = texture(uVisto, uv).r * 2.0 + texture(uVisto, uv + vec2(d.x, 0.0)).r + texture(uVisto, uv - vec2(d.x, 0.0)).r
                + texture(uVisto, uv + vec2(0.0, d.y)).r + texture(uVisto, uv - vec2(0.0, d.y)).r;
        vAlfa = uNebbia * (1.0 - smoothstep(0.05, 0.45, v / 6.0));
        vSeme = c.x * 0.37 + c.z * 0.71;
        vec4 p = instanceMatrix * vec4(position, 1.0);
        p.x += sin(uTempo * 0.12 + vSeme) * 0.8; p.z += cos(uTempo * 0.09 + vSeme * 1.3) * 0.6;
        vUv = position.xz + 0.5;
        gl_Position = vAlfa < 0.01 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * modelMatrix * p;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTempo; varying vec2 vUv; varying float vAlfa; varying float vSeme;
      ${GLSL_RUMORE}
      void main () {
        vec2 q = vUv - 0.5; float r = length(q) * 2.0;
        float n = frumore(vUv * 2.6 + vec2(vSeme, uTempo * 0.03));
        float a = smoothstep(1.0, 0.25, r + (n - 0.5) * 0.9) * vAlfa;
        if (a < 0.02) discard;
        vec3 col = mix(vec3(0.80, 0.85, 0.93), vec3(1.0), smoothstep(0.3, 0.8, n + (1.0 - r) * 0.3));
        gl_FragColor = vec4(col, a * 0.92);
        #include <colorspace_fragment>
      }`,
  })
  const velo = new InstancedMesh(geo, mat, punti.length)
  const M4 = new Matrix4(), Q = new Quaternion(), E = new Euler(), P = new Vector3(), S = new Vector3()
  punti.forEach(([x, y, z, s, a], i) => velo.setMatrixAt(i, M4.compose(P.set(x, y, z), Q.setFromEuler(E.set(0, a, 0)), S.set(s, 1, s * 0.8))))
  velo.frustumCulled = false; velo.renderOrder = 7
  scena.add(velo)

  return {
    velo,
    visto: (x, z) => { const cx = Math.floor(x), cz = Math.floor(z); return cx >= 0 && cz >= 0 && cx < W && cz < H && nebbia[cz * W + cx] === 1 },
    // da quanto si è vista una cella (secondi, sul tempo della scena): per le figure che salgono come gli oggetti
    quando: (x, z) => { const cx = Math.floor(x), cz = Math.floor(z); return cx >= 0 && cz >= 0 && cx < W && cz < H ? quando[cz * W + cx] : -100 },
    // l'eroe guarda attorno: le celle nuove entrano nelle due trame (e nel bit salvato, che è `nebbia`)
    scopri(x, z, raggio, tempo) {
      const nuove = scopri(nebbia, W, H, x, z, raggio)
      if (!nuove.length) return nuove
      segnaScoperte(nuove, W, dati, tempo)
      tVisto.needsUpdate = true; tQuando.needsUpdate = true
      return nuove
    },
    via() { scena.remove(velo); geo.dispose(); mat.dispose(); velo.dispose(); tVisto.dispose(); tQuando.dispose() },
  }
}

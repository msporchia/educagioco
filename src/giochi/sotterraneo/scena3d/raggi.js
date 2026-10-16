// Le lame di luce che scendono dall'alto (il tempio sommerso, dove l'acqua sopra lascia passare il giorno): due quadrati incrociati
// e inclinati per lama, più la chiazza che fanno per terra, additivi e mossi dal rumore. Una chiamata per tutte; vivono solo
// dove si vede adesso (lo shader legge la maschera nella cella del piede). Dove stanno lo decide il seme del piano.
import { PlaneGeometry, CircleGeometry, InstancedMesh, ShaderMaterial, AdditiveBlending, DoubleSide, Matrix4, Vector3, Quaternion, Euler,
         InstancedBufferAttribute } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { GLSL_RUMORE } from './luci.js'
import { GLSL_MASCHERA } from './maschera.js'
import { caso } from './rumore.js'

// puro: una lama nelle stanze grandi, due nelle grandissime, su celle libere lontane dai muri
export function postiDeiRaggi(pianta, stanze, seme) {
  const r = caso(seme * 3 + 1), posti = []
  for (const s of stanze || []) {
    const suolo = (s.suolo || []).filter(c => !pianta.roccia(c.x - 1, c.y) && !pianta.roccia(c.x + 1, c.y) && !pianta.roccia(c.x, c.y - 1) && !pianta.roccia(c.x, c.y + 1))
    const quante = suolo.length > 60 ? 2 : suolo.length > 16 ? 1 : 0
    for (let k = 0; k < quante; k++) { const c = suolo[Math.floor(r() * suolo.length)]; posti.push({ x: c.x + 0.5, z: c.y + 0.5, giro: r() * 3, cella: c }) }
  }
  return posti
}

export function creaRaggi(scena, { posti, maschera, colore, forza = 0.5 }) {
  if (!posti.length) return { aggiorna() {}, via() {} }
  const lama = a => new PlaneGeometry(0.9, 4.2, 1, 1).translate(0, 2.1, 0).rotateY(a)
  const pezzi = [lama(0), lama(Math.PI / 2), new CircleGeometry(0.75, 20).rotateX(-Math.PI / 2).translate(0, 0.04, 0)]
  const geo = mergeGeometries(pezzi.map(g => { g.deleteAttribute('normal'); return g.index ? g.toNonIndexed() : g }))
  pezzi.forEach(g => g.dispose())
  const cella = new Float32Array(posti.length * 2)
  posti.forEach((p, i) => { cella[i * 2] = p.cella.x + 0.5; cella[i * 2 + 1] = p.cella.y + 0.5 })
  geo.setAttribute('aCella', new InstancedBufferAttribute(cella, 2))
  const mat = new ShaderMaterial({
    uniforms: { ...maschera.uniforms, uT: { value: 0 }, uColore: { value: new Vector3(...colore) }, uForza: { value: forza } },
    vertexShader: /* glsl */`attribute vec2 aCella; ${GLSL_MASCHERA} varying vec3 vW; varying vec2 vUv; varying float vVis; varying float vY;
      void main(){ vUv = uv; vY = position.y; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vW = w.xyz;
        vVis = texture2D(uMaschera, aCella / uDimMappa).r; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`uniform float uT; uniform vec3 uColore; uniform float uForza; varying vec3 vW; varying vec2 vUv; varying float vVis; varying float vY;
      ${GLSL_RUMORE}
      void main(){
        if (vVis < 0.02) discard;
        float pavimento = step(vY, 0.05);
        float n = fbm3(vec3(vW.x * 2.0 + vW.z * 2.0, vW.y * 0.6 - uT * 0.3, uT * 0.2));
        float lama = smoothstep(0.5, 0.15, abs(vUv.x - 0.5)) * smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y)) * (0.4 + n);
        float chiazza = smoothstep(0.5, 0.0, length(vUv - 0.5)) * (0.6 + 0.5 * n);
        gl_FragColor = vec4(uColore * mix(lama * 0.35, chiazza * 0.6, pavimento) * uForza * vVis, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
  })
  const im = new InstancedMesh(geo, mat, posti.length)
  const m = new Matrix4(), q = new Quaternion(), e = new Euler(), p = new Vector3(), s = new Vector3(1, 1, 1)
  // inclinate: la luce viene da nord-ovest, dall'alto
  posti.forEach((o, i) => im.setMatrixAt(i, m.compose(p.set(o.x, 0, o.z), q.setFromEuler(e.set(0.22, o.giro, -0.18)), s)))
  im.frustumCulled = false; im.renderOrder = 14
  scena.add(im)
  return { aggiorna(t) { mat.uniforms.uT.value = t }, via() { scena.remove(im); geo.dispose(); mat.dispose() } }
}

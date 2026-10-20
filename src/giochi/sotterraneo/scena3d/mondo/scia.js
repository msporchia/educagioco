// La scia verso la meta (docs/sotterraneo/mondo-3d-la-meta.md): le luci azzurre per terra dalla cella dell'eroe fino alla meta,
// un'onda che le accende una dopo l'altra verso la meta, e il fascio di luce sulla meta che si vede da lontano. Una InstancedMesh
// di quadratini posati a terra (due triangoli l'uno) e un cono aperto: due chiamate, nessuna luce vera, niente ombra. Nella veduta
// le luci si ingrandiscono e fanno la strada tratteggiata. Chi gioca dà i punti (`posa`) e da quale luce si comincia (`da`).
import { InstancedMesh, InstancedBufferAttribute, PlaneGeometry, ConeGeometry, Mesh, ShaderMaterial, Matrix4, AdditiveBlending, DoubleSide } from 'three'
import { U } from './vesti.js'

export const MAX_LUCI = 400

export function creaScia(scena, quota) {
  const geo = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
  const indice = new InstancedBufferAttribute(new Float32Array(MAX_LUCI), 1)
  geo.setAttribute('aI', indice)
  const uDa = { value: 0 }
  const mat = new ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { uTempo: U.uTempo, uVeduta: U.uVeduta, uDa },
    vertexShader: /* glsl */`
      uniform float uTempo; uniform float uVeduta; uniform float uDa;
      attribute float aI;
      varying vec2 vUv; varying float vOnda;
      void main () {
        // l'onda corre dall'eroe verso la meta: ogni luce si accende un attimo dopo quella prima
        float f = fract(uTempo * 0.55 - (aI - uDa) * 0.07);
        vOnda = 1.0 - smoothstep(0.0, 0.12, min(f, 1.0 - f));
        float s = (0.9 + 0.35 * vOnda) * mix(1.0, 3.0, uVeduta);
        vUv = position.xz + 0.5;
        vec4 p = instanceMatrix * vec4(position.x * s, position.y + 0.02 * vOnda, position.z * s, 1.0);
        // quelle già passate non ci sono
        gl_Position = aI < uDa - 0.5 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * modelMatrix * p;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying float vOnda;
      void main () {
        float r = length(vUv - 0.5) * 2.0;
        if (r > 1.0) discard;
        // il cuore chiaro, l'orlo blu scuro che si legge sull'erba e sulla terra battuta
        vec3 c = mix(vec3(0.85, 0.97, 1.0), vec3(0.50, 0.82, 1.0), smoothstep(0.2, 0.62, r));
        c = mix(c, vec3(0.08, 0.19, 0.29), smoothstep(0.66, 0.78, r));
        c += vOnda * 0.25;
        gl_FragColor = vec4(c, smoothstep(1.0, 0.86, r));
        #include <colorspace_fragment>
      }`,
  })
  const luci = new InstancedMesh(geo, mat, MAX_LUCI)
  luci.count = 0; luci.frustumCulled = false; luci.renderOrder = 5
  scena.add(luci)

  // il fascio sulla meta: un cono aperto, chiaro in basso e svanito in alto; nella veduta più largo
  const geoF = new ConeGeometry(0.75, 9, 14, 1, true).translate(0, 4.5, 0)
  const matF = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide, uniforms: { uTempo: U.uTempo, uVeduta: U.uVeduta },
    vertexShader: /* glsl */`
      uniform float uVeduta; varying float vH;
      void main () { vH = position.y / 9.0; vec3 p = position; p.xz *= mix(1.0, 3.5, uVeduta) * (1.0 - vH * 0.55); p.y *= mix(1.0, 2.2, uVeduta);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uTempo; varying float vH;
      void main () { float a = (1.0 - vH) * (1.0 - vH) * (0.42 + 0.12 * sin(uTempo * 2.2));
        gl_FragColor = vec4(vec3(0.5, 0.82, 1.0) * a, a); }`,
  })
  const faro = new Mesh(geoF, matF)
  faro.visible = false; faro.renderOrder = 8; faro.frustumCulled = false
  scena.add(faro)

  const M4 = new Matrix4()
  return {
    // i punti della scia (in celle, il centro), l'ultima è la meta; null la toglie
    posa(punti, meta) {
      const n = Math.min(MAX_LUCI, punti ? punti.length : 0)
      for (let i = 0; i < n; i++) {
        const p = punti[i]
        luci.setMatrixAt(i, M4.makeScale(0.7, 1, 0.7).setPosition(p.x, quota(p.x, p.z) + 0.07, p.z))
        indice.array[i] = i
      }
      luci.count = n
      luci.instanceMatrix.needsUpdate = true; indice.needsUpdate = true
      uDa.value = 0
      faro.visible = !!meta
      if (meta) faro.position.set(meta.x, quota(meta.x, meta.z), meta.z)
    },
    // la luce più vicina all'eroe: quelle prima non si disegnano
    da(i) { uDa.value = Math.max(0, i) },
    get quante() { return luci.count },
    via() { scena.remove(luci, faro); geo.dispose(); mat.dispose(); luci.dispose(); geoF.dispose(); matF.dispose() },
  }
}

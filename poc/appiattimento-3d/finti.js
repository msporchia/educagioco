// Le cose finte che prendono il posto di quelle vere: l'ombra a macchia (un disco scuro sotto chi sta in piedi, al posto della
// mappa d'ombra del cono) e i bagliori (dischi additivi sui fuochi e sui lampi, al posto delle luci puntiformi). Una chiamata
// ciascuno: un InstancedMesh per le macchie, uno per i bagliori.
import { InstancedMesh, PlaneGeometry, ShaderMaterial, Matrix4, Color, AdditiveBlending, InstancedBufferAttribute, Vector3 } from 'three'

const MAX = 24

/** Le ombre a macchia: `metti(lista)` a ogni fotogramma, con { x, z, r }. */
export function creaMacchie(scena) {
  const geo = new PlaneGeometry(2, 2).rotateX(-Math.PI / 2)
  const mat = new ShaderMaterial({
    vertexShader: 'varying vec2 vU; void main(){ vU = position.xz; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec2 vU; void main(){ float d = length(vU); gl_FragColor = vec4(0.0, 0.0, 0.0, 0.62 * (1.0 - smoothstep(0.25, 1.0, d))); }',
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
  })
  const im = new InstancedMesh(geo, mat, MAX)
  im.frustumCulled = false; im.count = 0; im.renderOrder = 1
  scena.add(im)
  const m = new Matrix4()
  return {
    metti(lista) {
      let n = 0
      for (const p of lista) { if (n >= MAX) break; m.makeScale(p.r, 1, p.r * 0.8).setPosition(p.x, 0.012, p.z + 0.05); im.setMatrixAt(n++, m) }
      im.count = n; im.instanceMatrix.needsUpdate = true
    },
    via() { scena.remove(im); geo.dispose(); mat.dispose() },
  }
}

/** I bagliori: un disco additivo che guarda la telecamera per ogni fuoco (e uno per il lampo dei colpi). `fuochi`: [{ pos, colore }]. */
export function creaBagliori(scena, fuochi) {
  const geo = new PlaneGeometry(1, 1)
  const n = fuochi.length + 1
  const tinte = new Float32Array(n * 3)
  geo.setAttribute('aTinta', new InstancedBufferAttribute(tinte, 3))
  const mat = new ShaderMaterial({
    vertexShader: `attribute vec3 aTinta; varying vec3 vT; varying vec2 vU;
      void main(){ vT = aTinta; vU = position.xy * 2.0;
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float s = length(instanceMatrix[0].xyz); mv.xy += position.xy * s; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: 'varying vec3 vT; varying vec2 vU; void main(){ float d = length(vU); float k = 1.0 - smoothstep(0.0, 1.0, d); gl_FragColor = vec4(vT * k * k, 1.0); }',
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  })
  const im = new InstancedMesh(geo, mat, n)
  im.frustumCulled = false; im.renderOrder = 11
  scena.add(im)
  const m = new Matrix4()
  fuochi.forEach((f, i) => {
    m.makeScale(2.6, 2.6, 2.6).setPosition(f.pos.x, f.pos.y - 0.1, f.pos.z)
    im.setMatrixAt(i, m)
    tinte[i * 3] = f.colore.r * 0.32; tinte[i * 3 + 1] = f.colore.g * 0.32; tinte[i * 3 + 2] = f.colore.b * 0.32
  })
  const c = new Color(), p = new Vector3()
  return {
    // il lampo dei colpi (la luce `lampo` di luci.js, nascosta o no): un bagliore grande quanto la sua forza
    lampo(l) {
      const k = Math.min(1, l.intensity / 12)
      l.getWorldPosition(p)
      m.makeScale(4 * k + 0.001, 4 * k + 0.001, 1).setPosition(p.x, p.y, p.z)
      im.setMatrixAt(n - 1, m); im.instanceMatrix.needsUpdate = true
      c.copy(l.color).multiplyScalar(0.5 * k)
      tinte[(n - 1) * 3] = c.r; tinte[(n - 1) * 3 + 1] = c.g; tinte[(n - 1) * 3 + 2] = c.b
      geo.attributes.aTinta.needsUpdate = true
    },
    via() { scena.remove(im); geo.dispose(); mat.dispose() },
  }
}

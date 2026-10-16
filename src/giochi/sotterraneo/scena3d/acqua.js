// Le pozze del piano (le celle ACQUA, docs/sotterraneo/piani-caverne.md): un velo d'acqua sopra il pavimento, increspato dal
// rumore e acceso dalle luci vicine, nel colore dell'ambientazione (nell'inferno è lava che scorre e fa luce). Vive solo dove
// si vede adesso; nel ricordo resta una macchia ferma e scura, nel mai visto niente.
import { BufferGeometry, Float32BufferAttribute, Mesh, ShaderMaterial, Vector3 } from 'three'
import { GLSL_RUMORE, GLSL_LUCI } from './luci.js'
import { GLSL_MASCHERA } from './maschera.js'
import { ACCESI } from './costanti.js'

export function creaPozze(scena, celle, condivise, maschera, aspetto) {
  if (!celle.length) return { aggiorna() {}, via() {} }
  const pos = [], idx = []
  for (const { x, y } of celle) {
    const b = pos.length / 3
    pos.push(x, 0.012, y, x + 1, 0.012, y, x, 0.012, y + 1, x + 1, 0.012, y + 1)
    idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3)
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
  geo.setIndex(idx)
  const a = aspetto.acqua
  const mat = new ShaderMaterial({
    uniforms: { ...condivise, ...maschera.uniforms, uT: { value: 0 }, uFondo: { value: new Vector3(...a.fondo) },
                uChiaro: { value: new Vector3(...a.chiaro) }, uLava: { value: a.lava }, uVivo: { value: ACCESI.acqua ? 1 : 0 } },
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      uniform float uT, uLava, uVivo; uniform vec3 uFondo, uChiaro; ${GLSL_MASCHERA} varying vec3 vW;
      ${GLSL_RUMORE}${GLSL_LUCI}
      void main(){
        vec4 m = texture2D(uMaschera, vW.xz / uDimMappa);
        float t = uT * uVivo;
        float h = fbm3(vec3(vW.xz * 2.2, t * (0.35 + uLava * 0.25)));
        vec3 n = normalize(vec3(dFdx(h), 0.06, dFdy(h)));
        float luccica = pow(clamp(1.0 - n.y * 0.95, 0.0, 1.0), 2.0);
        vec3 acqua = mix(uFondo, uChiaro, 0.12 + luccica * 1.1) + luceIn(vW) * (0.08 + luccica * 1.6);
        vec3 lava = mix(uFondo, uChiaro, smoothstep(0.35, 0.75, h)) * (1.4 + 0.4 * sin(t * 2.0 + h * 9.0));
        vec3 c = mix(acqua, lava, uLava);
        // nel ricordo: ferma, fredda e scura; nel mai visto niente
        vec3 ricordo = uFondo * 0.6 * vec3(0.5, 0.6, 0.8) * m.g * (1.0 - m.r);
        gl_FragColor = vec4(c * m.r + ricordo, (0.82 + luccica * 0.18) * max(m.r, m.g));
      }`,
    transparent: true, depthWrite: false,
  })
  const mesh = new Mesh(geo, mat)
  mesh.renderOrder = 3
  scena.add(mesh)
  return {
    aggiorna(t) { mat.uniforms.uT.value = t },
    via() { scena.remove(mesh); geo.dispose(); mat.dispose() },
  }
}

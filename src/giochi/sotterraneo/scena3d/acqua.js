// Le pozze del piano (le celle ACQUA, docs/sotterraneo/piani-caverne.md): un velo d'acqua sopra il pavimento, increspato dal
// rumore e acceso dalle luci vicine, nel colore dell'ambientazione (nell'inferno è lava che scorre e fa luce). Vive solo dove
// si vede adesso; nel ricordo resta una macchia ferma e scura, nel mai visto niente.
import { BufferGeometry, Float32BufferAttribute, Mesh, ShaderMaterial, Vector3 } from 'three'
import { GLSL_RUMORE, GLSL_LUCI } from './luci.js'
import { GLSL_MASCHERA } from './maschera.js'
import { ACCESI } from './costanti.js'

// `velo` (il tempio sommerso): l'acqua bassa su tutto il pavimento, trasparente quanto dice, con le caustiche che corrono
export function creaPozze(scena, celle, condivise, maschera, aspetto, velo = 0) {
  if (!celle.length) return { aggiorna() {}, via() {} }
  const h = velo ? 0.035 : 0.012
  // ogni cella in quattro, col punto in mezzo: `riva` è 1 negli spigoli e nei lati che toccano la terra, così la riva sfuma
  // storta (lo shader la mangia col rumore) invece di finire a quadretti
  const acqua = new Set(celle.map(c => c.x + ',' + c.y)), bagnato = (x, y) => velo || acqua.has(x + ',' + y)
  const riva = (x, y) => (bagnato(x - 1, y - 1) && bagnato(x, y - 1) && bagnato(x - 1, y) && bagnato(x, y) ? 0 : 1)
  const pos = [], riv = [], idx = []
  for (const { x, y } of celle) {
    const b = pos.length / 3
    for (let j = 0; j <= 2; j++) for (let i = 0; i <= 2; i++) {
      pos.push(x + i / 2, h, y + j / 2)
      const lato = i === 1 && j === 1 ? 0 : i === 1 ? (bagnato(x, y + (j ? 1 : -1)) ? 0 : 1) : j === 1 ? (bagnato(x + (i ? 1 : -1), y) ? 0 : 1) : riva(x + i / 2, y + j / 2)
      riv.push(velo ? 0 : lato)
    }
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const a = b + j * 3 + i; idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4) }
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
  geo.setAttribute('aRiva', new Float32BufferAttribute(riv, 1))
  geo.setIndex(idx)
  const a = aspetto.acqua
  const mat = new ShaderMaterial({
    uniforms: { ...condivise, ...maschera.uniforms, uT: { value: 0 }, uFondo: { value: new Vector3(...a.fondo) },
                uChiaro: { value: new Vector3(...a.chiaro) }, uLava: { value: a.lava }, uVivo: { value: ACCESI.acqua ? 1 : 0 }, uVelo: { value: velo }, uRiflesso: { value: a.riflesso ?? 1 } },
    vertexShader: /* glsl */`attribute float aRiva; varying float vRiva; varying vec3 vW; void main(){ vRiva = aRiva; vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      uniform float uT, uLava, uVivo, uVelo, uRiflesso; uniform vec3 uFondo, uChiaro; ${GLSL_MASCHERA} varying vec3 vW; varying float vRiva;
      ${GLSL_RUMORE}${GLSL_LUCI}
      void main(){
        vec4 m = texture2D(uMaschera, vW.xz / uDimMappa);
        float t = uT * uVivo;
        float h = fbm3(vec3(vW.xz * 2.2, t * (0.35 + uLava * 0.25)));
        vec3 n = normalize(vec3(dFdx(h), 0.06, dFdy(h)));
        float luccica = pow(clamp(1.0 - n.y * 0.95, 0.0, 1.0), 2.0);
        vec3 acqua = mix(uFondo, uChiaro, 0.12 + luccica * 1.1) + luceIn(vW) * (0.08 + luccica * 1.6) * uRiflesso;
        vec3 lava = mix(uFondo, uChiaro, smoothstep(0.35, 0.75, h)) * (1.4 + 0.4 * sin(t * 2.0 + h * 9.0));
        vec3 c = mix(acqua, lava, uLava);
        float cau = pow(1.0 - abs(fbm3(vec3(vW.xz * 1.6, t * 0.5)) - 0.5) * 2.0, 7.0);
        c += uChiaro * cau * uVelo * 0.9 * (0.3 + luceIn(vW).g * 0.6);
        // nel ricordo: ferma, fredda e scura; nel mai visto niente
        vec3 ricordo = uFondo * 0.6 * vec3(0.5, 0.6, 0.8) * m.g * (1.0 - m.r);
        float alfa = uVelo > 0.0 ? uVelo * (0.55 + luccica * 0.8 + cau * 0.5) : 0.82 + luccica * 0.18;
        float sponda = smoothstep(0.62, 0.3, vRiva + (rumore3(vec3(vW.xz * 3.1, 2.0)) - 0.5) * 0.7);
        if (sponda < 0.01) discard;
        gl_FragColor = vec4(c * m.r + ricordo, clamp(alfa, 0.0, 1.0) * max(m.r, m.g) * sponda);
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

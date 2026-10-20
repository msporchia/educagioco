// L'acqua e il cielo del mondo di sopra. L'acqua è un piano solo al suo livello: dove il terreno scende sotto c'è acqua, la
// profondità per cella (in una trama) fa il colore e la schiuma alle rive; dove non si è visto, il velo di nuvole (vesti.js). Il
// cielo è un gradiente con le nuvole che scorrono: dall'alto se ne vede poco, ma c'è. Dal prototipo poc/mondo-sopra/terreno.js.
import { DataTexture, RedFormat, LinearFilter, ShaderMaterial, UniformsUtils, UniformsLib, Color, PlaneGeometry, Mesh,
         SphereGeometry, BackSide } from 'three'
import { LIVELLO_ACQUA, quotaDellaCella } from './suolo.js'
import { U, GLSL_CIELO } from './vesti.js'

// la profondità di un rettangolo di celle nella trama: le celle scritte (le zone caricate una volta) esatte, le altre dalla base
// a passi di due celle (la stessa che legge il lontano: il fiume dei confini c'è già)
function profondita(m, d, x0, y0, x1, y1) {
  const { W } = m
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const k = y * W + x, q = m.zona[k] >= 0 ? m.quota[k] : quotaDellaCella(m, (y & ~1) * W + (x & ~1))
    d[k] = Math.max(0, Math.min(255, (LIVELLO_ACQUA - q) / 0.9 * 255))
  }
}

export function creaAcqua(m, sole) {
  const { W, H } = m
  const d = new Uint8Array(W * H)
  profondita(m, d, 0, 0, W - 1, H - 1)
  const tProf = new DataTexture(d, W, H, RedFormat)
  tProf.magFilter = tProf.minFilter = LinearFilter; tProf.needsUpdate = true
  const mat = new ShaderMaterial({
    uniforms: UniformsUtils.merge([UniformsLib.fog, { tProf: { value: null }, uSole: { value: sole.clone() }, uCielo: { value: new Color(0xa9cdea) } }]),
    fog: true,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      varying vec3 vMondo;
      void main () {
        vec4 w = modelMatrix * vec4(position, 1.0); vMondo = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_CIELO}
      uniform sampler2D tProf; uniform vec3 uSole; uniform vec3 uCielo;
      varying vec3 vMondo;
      void main () {
        vec2 uvc = vMondo.xz / uMappa;
        float d = (uvc.x < 0.0 || uvc.y < 0.0 || uvc.x > 1.0 || uvc.y > 1.0) ? 1.0 : texture(tProf, uvc).r;
        vec2 p = vMondo.xz;
        float n1 = frumore(p * 0.55 + vec2(0.0, uTempo * 0.35)), n2 = frumore(p * 1.1 - vec2(uTempo * 0.12, uTempo * 0.25));
        vec3 col = mix(vec3(0.30, 0.66, 0.66), vec3(0.10, 0.36, 0.55), smoothstep(0.0, 0.55, d));
        vec3 V = normalize(cameraPosition - vMondo);
        vec3 N = normalize(vec3((n1 - 0.5) * 0.35, 1.0, (n2 - 0.5) * 0.35));
        float fres = pow(1.0 - max(dot(V, N), 0.0), 3.0);
        col = mix(col, uCielo, 0.18 + fres * 0.55);
        col += vec3(1.0, 0.96, 0.85) * pow(max(dot(N, normalize(V + uSole)), 0.0), 90.0) * 0.9;
        col += smoothstep(0.66, 0.74, n1) * 0.07;
        float fascia = 1.0 - smoothstep(0.0, 0.11 + 0.05 * sin(uTempo * 1.4 + n2 * 6.0), d);
        float bolle = smoothstep(0.42, 0.6, vrumore(p * 5.0 + vec2(uTempo * 0.3, uTempo * 0.7)));
        col = mix(col, vec3(0.96, 0.98, 1.0), fascia * (0.35 + 0.6 * bolle));
        col *= ombraNuvole(p);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
        gl_FragColor.rgb = nebbiaSu(gl_FragColor.rgb, vMondo);
      }`,
  })
  Object.assign(mat.uniforms, U)
  mat.uniforms.tProf.value = tProf
  const g = new PlaneGeometry(W + 60, H + 60, 1, 1); g.rotateX(-Math.PI / 2); g.translate(W / 2, LIVELLO_ACQUA, H / 2)
  const mesh = new Mesh(g, mat)
  return {
    mesh,
    // una zona si è scritta: la sua profondità vera (il lago, le pozze)
    aggiorna(R) { profondita(m, d, Math.max(0, R.x0), Math.max(0, R.y0), Math.min(W - 1, R.x1), Math.min(H - 1, R.y1)); tProf.needsUpdate = true },
    via() { tProf.dispose(); mat.dispose(); g.dispose() },
  }
}

// il cielo: si muove con la telecamera e non scrive la profondità
export function creaCielo() {
  const mat = new ShaderMaterial({
    side: BackSide, depthWrite: false, fog: false,
    uniforms: { uTempo: U.uTempo },
    vertexShader: 'varying vec3 vDir; void main () { vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: /* glsl */`
      uniform float uTempo; varying vec3 vDir;
      float h (vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n (vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main () {
        float y = clamp(vDir.y, -0.2, 1.0);
        vec3 col = mix(vec3(0.80, 0.88, 0.95), vec3(0.36, 0.60, 0.90), smoothstep(0.0, 0.6, y));
        vec2 q = vDir.xz / max(0.12, vDir.y + 0.15) * 1.6 + vec2(uTempo * 0.02, uTempo * 0.012);
        float c = n(q) * 0.55 + n(q * 2.2) * 0.3 + n(q * 5.1) * 0.15;
        col = mix(col, vec3(1.0), smoothstep(0.55, 0.78, c) * smoothstep(0.0, 0.25, y) * 0.85);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  })
  const g = new SphereGeometry(900, 24, 12)
  const mesh = new Mesh(g, mat)
  mesh.frustumCulled = false; mesh.renderOrder = -10
  return { mesh, via() { mat.dispose(); g.dispose() } }
}

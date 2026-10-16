// Quello che tutti i materiali hanno in comune, cucito nei loro shader (onBeforeCompile): il vento che piega chiome ed erba,
// l'ombra delle nuvole che scorre sul terreno, e la nebbia dell'esplorazione (quello che l'eroe non ha ancora visto è coperto
// da una foschia chiara). Le uniform sono una sola copia per tutti.
import * as THREE from 'three'

export const U = {
  uTempo: { value: 0 },
  uVisto: { value: null },      // W×H, rosso = quanto è stata vista la cella
  uNebbia: { value: 0 },        // 0 spenta (tutto in vista), 1 accesa
  uMappa: { value: new THREE.Vector2(1, 1) },
}

export const GLSL_RUMORE = /* glsl */`
  float hash12 (vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vrumore (vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
  }
  float frumore (vec2 p) { return vrumore(p) * 0.55 + vrumore(p * 2.1 + 7.3) * 0.3 + vrumore(p * 4.3 + 1.7) * 0.15; }
`
export const GLSL_CIELO = /* glsl */`
  uniform float uTempo; uniform sampler2D uVisto; uniform float uNebbia; uniform vec2 uMappa;
  ${GLSL_RUMORE}
  // l'ombra delle nuvole: macchie larghe che scorrono piano verso nord-est
  float ombraNuvole (vec2 xz) {
    float n = frumore(xz * 0.03 + vec2(uTempo * 0.018, uTempo * 0.011));
    return 1.0 - 0.32 * smoothstep(0.52, 0.72, n);
  }
  // la nebbia dell'esplorazione: una foschia di nuvole bianche, che si muove, dove la cella non è stata vista
  vec3 nebbiaSu (vec3 c, vec3 p) {
    if (uNebbia < 0.5) return c;
    float v = texture2D(uVisto, p.xz / uMappa).r;
    float n = frumore(p.xz * 0.18 + vec2(uTempo * 0.05, uTempo * 0.03));
    float k = smoothstep(0.3, 0.8, v + (n - 0.5) * 0.45);
    vec3 foschia = mix(vec3(0.80, 0.85, 0.92), vec3(0.98, 0.98, 1.0), smoothstep(0.35, 0.75, n));
    return mix(foschia, c, k);
  }
`

// `vento`: quanto si piega (0 niente), `rigido`: fin dove (in altezza, nel pezzo) resta fermo
export function vesti (mat, { vento = 0, rigido = 0, nuvole = true, nebbia = true, prima = '' } = {}) {
  const vecchio = mat.onBeforeCompile
  mat.onBeforeCompile = (sh, r) => {
    if (vecchio) vecchio(sh, r)
    Object.assign(sh.uniforms, U)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTempo; varying vec3 vMondo;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        ${vento > 0 ? `{
          #ifdef USE_INSTANCING
            vec3 radice = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          #else
            vec3 radice = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          #endif
          float pieg = max(0.0, position.y - ${rigido.toFixed(3)}) * ${vento.toFixed(3)};
          float fase = uTempo * 1.7 + radice.x * 0.37 + radice.z * 0.23;
          float raffica = 0.6 + 0.4 * sin(uTempo * 0.31 + radice.x * 0.05);
          transformed.x += (sin(fase) * 0.7 + sin(fase * 2.3 + 1.0) * 0.3) * pieg * raffica;
          transformed.z += cos(fase * 0.83) * 0.35 * pieg * raffica;
        }` : ''}`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        {
          vec4 m4 = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            m4 = instanceMatrix * m4;
          #endif
          vMondo = (modelMatrix * m4).xyz;
        }`)
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vMondo;
        ${GLSL_CIELO}`)
    if (nuvole && sh.fragmentShader.includes('#include <aomap_fragment>'))
      sh.fragmentShader = sh.fragmentShader.replace('#include <aomap_fragment>', `{ float on = ombraNuvole(vMondo.xz);
        reflectedLight.directDiffuse *= on; reflectedLight.directSpecular *= on; }
        #include <aomap_fragment>`)
    if (nebbia) sh.fragmentShader = sh.fragmentShader.replace('#include <fog_fragment>', `#include <fog_fragment>
        gl_FragColor.rgb = nebbiaSu(gl_FragColor.rgb, vMondo);`)
    if (prima) prima(sh)
  }
  // ogni combinazione di opzioni è un programma suo
  mat.customProgramCacheKey = () => `vesti-${vento}-${rigido}-${nuvole}-${nebbia}-${mat.name || ''}`
  return mat
}

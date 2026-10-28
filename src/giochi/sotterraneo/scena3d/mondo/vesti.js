// Quello che tutti i materiali del mondo di sopra hanno in comune, cucito nei loro shader (onBeforeCompile): il vento che piega
// chiome ed erba, l'ombra delle nuvole che scorre, e la nebbia dell'esplorazione. Due modi: una SUPERFICIE (terreno, acqua,
// piazze, campi) dove la cella non vista è velo di nuvole chiare, sfumato ai bordi; un OGGETTO (case, alberi, monumenti) che si
// vede tutto intero o niente, letto alla cella della sua base (l'istanza, o l'attributo `aBase` per il kit unito), e che entrando
// in vista sale dal terreno. Le uniform sono una copia sola per tutti. docs/sotterraneo/grafica-3d.md, «La nebbia di sopra».
import { Vector2, Vector3, MeshDepthMaterial, RGBADepthPacking, DataTexture, RedFormat, UnsignedByteType, NearestFilter, LinearFilter,
         RepeatWrapping } from 'three'
import { PEZZO } from './pezzi.js'
import { ACCESI } from '../costanti.js'

export const U = {
  uTempo: { value: 0 },
  uVisto: { value: null },      // W×H, rosso = la cella è stata vista (0/1, filtrata: i bordi sfumano)
  uQuando: { value: null },     // W×H, il tempo in cui la cella si è vista (molto avanti: mai); letta senza filtro
  uNebbia: { value: 1 },        // 0 spenta (per le foto col cheat), 1 accesa
  uVeduta: { value: 0 },        // 0..1, quanto si è saliti nella veduta: il fuori mappa si sbiadisce
  uMappa: { value: new Vector2(1, 1) },
  uPezzi: { value: null },      // un texel per pezzo (pezzi.js): 1 dove il pezzo vicino è costruito, e lì il mondo lontano si toglie
  uTinta: { value: new Vector3(1, 1, 1) },   // la tinta della terra (TERRE della scheda): moltiplica il colore di tutto il mondo
  uCielo: { value: new Vector3(1, 1, 1) },   // e quella del cielo, rispetto al cielo della prima terra
  uRumore: { value: tramaRumore() },          // il rumore già fatto, per la leva `rumoreTrama` (la bassa)
}
// La tinta di una terra (dati/mondo-aperto.js, TERRE; docs/sotterraneo/terre-successive.md): la prima è [1, 1, 1], le altre
// colorano terreno, case e alberi, e il cielo (la sfera, lo sfondo e la foschia) in proporzione al cielo della prima. Torna il fattore
// del cielo, [r, g, b], per lo sfondo e la foschia della scena
const CIELO_DI_CASA = [150, 200, 240]
export function tingi(terra) {
  const t = (terra && terra.tinta) || [1, 1, 1], c = (terra && terra.cielo) || CIELO_DI_CASA
  const k = c.map((v, i) => v / CIELO_DI_CASA[i])
  U.uTinta.value.set(t[0], t[1], t[2]); U.uCielo.value.set(k[0], k[1], k[2])
  return k
}
// la trama dei pezzi costruiti, una per mondo: `segna(costruiti)` la riscrive (solo quando cambia qualcosa, non a fotogramma)
export function tramaDeiPezzi(nx, nz) {
  const dati = new Uint8Array(nx * nz), t = new DataTexture(dati, nx, nz, RedFormat, UnsignedByteType)
  t.magFilter = t.minFilter = NearestFilter; t.needsUpdate = true
  U.uPezzi.value = t
  return {
    segna(costruiti) { dati.fill(0); for (const p of costruiti) dati[p] = 255; t.needsUpdate = true },
    via() { if (U.uPezzi.value === t) U.uPezzi.value = null; t.dispose() },
  }
}
export const SALITA = 0.7        // secondi: quanto ci mette un oggetto a salire dal terreno entrando in vista

// la leva `rumoreTrama` (la fascia bassa): `vrumore` legge una trama coi valori di hash12 ai nodi invece di fare quattro hash a pixel
// (docs/sotterraneo/prestazioni-3d-bassa.md, «Il mondo di sopra»). 256 di lato, ripetuta: un nodo di rumore per texel
function tramaRumore() {
  const L = 256, d = new Uint8Array(L * L), fr = x => x - Math.floor(x)
  for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
    let a = fr(x * 0.1031), b = fr(y * 0.1031), c = a
    const k = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33); a += k; b += k; c += k
    d[y * L + x] = Math.round(fr((a + b) * c) * 255)
  }
  const t = new DataTexture(d, L, L, RedFormat, UnsignedByteType)
  t.wrapS = t.wrapT = RepeatWrapping; t.magFilter = t.minFilter = LinearFilter; t.needsUpdate = true
  return t
}
/** Le define degli shader che usano GLSL_RUMORE, da chiedere quando si crea il materiale (dopo la fascia). */
export const defineRumore = () => (ACCESI.rumoreTrama ? { RUMORE_TRAMA: '' } : {})

export const GLSL_RUMORE = /* glsl */`
#ifdef RUMORE_TRAMA
  uniform sampler2D uRumore;
  float vrumore (vec2 p) { vec2 i = floor(p), f = fract(p); return texture(uRumore, (i + f * f * (3.0 - 2.0 * f) + 0.5) / 256.0).r; }
#else
  float hash12 (vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vrumore (vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
  }
#endif
  float frumore (vec2 p) { return vrumore(p) * 0.55 + vrumore(p * 2.1 + 7.3) * 0.3 + vrumore(p * 4.3 + 1.7) * 0.15; }
`
export const GLSL_CIELO = /* glsl */`
  uniform float uTempo; uniform sampler2D uVisto; uniform float uNebbia; uniform vec2 uMappa; uniform float uVeduta; uniform vec3 uTinta;
  ${GLSL_RUMORE}
  float ombraNuvole (vec2 xz) {
    float n = frumore(xz * 0.03 + vec2(uTempo * 0.018, uTempo * 0.011));
    return 1.0 - 0.3 * smoothstep(0.52, 0.72, n);
  }
  // quanto si vede una cella, sfumato: quattro prese attorno e un rumore che sposta il bordo a nuvole
  float vistoA (vec2 xz) {
    vec2 uv = xz / uMappa, d = 0.75 / uMappa;
    float n = frumore(xz * 0.35 + vec2(uTempo * 0.04, uTempo * 0.025));
    float v = texture(uVisto, uv + vec2(d.x, 0.0)).r + texture(uVisto, uv - vec2(d.x, 0.0)).r
            + texture(uVisto, uv + vec2(0.0, d.y)).r + texture(uVisto, uv - vec2(0.0, d.y)).r;
    return smoothstep(0.3, 0.75, v * 0.25 + (n - 0.5) * 0.5);
  }
  vec3 foschiaA (vec2 xz) {
    float n = frumore(xz * 0.12 + vec2(uTempo * 0.05, uTempo * 0.03));
    return mix(vec3(0.82, 0.86, 0.93), vec3(0.99, 0.99, 1.0), smoothstep(0.3, 0.8, n));
  }
  vec3 nebbiaSu (vec3 c, vec3 p) {
    // fuori dalla mappa: dall'alto della veduta si sbiadisce, così il mondo si legge come un'isola fra le nuvole
    if (p.x < 0.0 || p.z < 0.0 || p.x > uMappa.x || p.z > uMappa.y) return mix(c, vec3(0.72, 0.79, 0.86), uVeduta * 0.7);
    if (uNebbia < 0.5) return c;
    return mix(foschiaA(p.xz), c, vistoA(p.xz));
  }
`
// la cella della base: quando si è vista, e quanto è salito (0 ancora sotto, 1 su)
const GLSL_OGGETTO = /* glsl */`
  uniform sampler2D uQuando; uniform float uNebbiaO; uniform vec2 uMappaO; uniform float uTempoO;
  uniform sampler2D uPezzi;
  bool fuoriMappa (vec2 xz) { return xz.x < 0.0 || xz.y < 0.0 || xz.x >= uMappaO.x || xz.y >= uMappaO.y; }
  bool costruito (vec2 xz) {
    if (fuoriMappa(xz)) return false;
    ivec2 n = textureSize(uPezzi, 0);
    ivec2 p = clamp(ivec2(floor(xz.x / ${PEZZO.largo}.0), floor(xz.y / ${PEZZO.alto}.0)), ivec2(0), n - 1);
    return texelFetch(uPezzi, p, 0).r > 0.5;
  }
  float salito (vec2 xz) {
    if (uNebbiaO < 0.5 || fuoriMappa(xz)) return 1.0;
    ivec2 c = ivec2(clamp(floor(xz), vec2(0.0), uMappaO - 1.0));
    return clamp((uTempoO - texelFetch(uQuando, c, 0).r) / ${SALITA.toFixed(2)}, 0.0, 1.0);
  }
`
// `vento`: quanto si piega (0 niente), `rigido`: fin dove (in altezza, nel pezzo) resta fermo. `oggetto`: 'istanza', 'attributo'
// o niente (una superficie). `nuvole`: l'ombra delle nuvole; `nebbia`: il velo sulla superficie. `prima(sh)`: chi aggiunge altro
// `lontano`: un oggetto del mondo lontano (lontano.js), che sparisce dove c'è il pezzo costruito. `codice`: il nome del codice in
// più (di `prima`, o di chi riscrive lo shader dopo): materiali col codice uguale hanno lo stesso programma, e il nome del materiale
// e quanto si piega non lo cambiano (vento e rigido sono uniform: docs/sotterraneo/prestazioni-3d.md, «Shader e prima apparizione»)
export function vesti(mat, { vento = 0, rigido = 0, nuvole = true, nebbia = true, oggetto = null, lontano = false, prima = null, codice = '' } = {}) {
  const vecchio = mat.onBeforeCompile
  mat.onBeforeCompile = (sh, r) => {
    if (vecchio) vecchio(sh, r)
    cuciVertice(sh, { vento, rigido, oggetto, lontano })
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>${ACCESI.rumoreTrama ? '\n      #define RUMORE_TRAMA' : ''}
      varying vec3 vMondo;
      ${GLSL_CIELO}`)
    if (nuvole && sh.fragmentShader.includes('#include <aomap_fragment>'))
      sh.fragmentShader = sh.fragmentShader.replace('#include <aomap_fragment>', `{ float on = ombraNuvole(vMondo.xz);
        reflectedLight.directDiffuse *= on; reflectedLight.directSpecular *= on; }
        #include <aomap_fragment>`)
    // la tinta della terra prima della nebbia: il velo delle nuvole resta bianco
    sh.fragmentShader = sh.fragmentShader.replace('#include <fog_fragment>', `gl_FragColor.rgb *= uTinta;
        #include <fog_fragment>${nebbia && !oggetto ? `
        gl_FragColor.rgb = nebbiaSu(gl_FragColor.rgb, vMondo);` : ''}`)
    if (prima) prima(sh)
  }
  const chiave = `mondo-${vento > 0}-${nuvole}-${nebbia}-${oggetto}-${lontano}-${codice}`
  mat.customProgramCacheKey = () => chiave + (ACCESI.rumoreTrama ? '-rt' : '')
  return mat
}

// il vertice: il vento, la salita dal terreno (e chi non si è visto si chiude fuori dallo schermo), la posizione nel mondo
function cuciVertice(sh, { vento, rigido, oggetto, lontano = false }) {
  Object.assign(sh.uniforms, U, { uNebbiaO: U.uNebbia, uMappaO: U.uMappa, uTempoO: U.uTempo })
  if (vento > 0) Object.assign(sh.uniforms, { uVentoV: { value: vento }, uRigidoV: { value: rigido } })   // di questo materiale
  const base = oggetto === 'istanza'
    ? `
#ifdef USE_INSTANCING
         vec3 baseO = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
#else
         vec3 baseO = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
#endif
`
    : oggetto === 'attributo' ? 'vec3 baseO = vec3(aBase.x, 0.0, aBase.y);' : ''
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', `#include <common>
      uniform float uTempo; varying vec3 vMondo;
      ${vento > 0 ? 'uniform float uVentoV; uniform float uRigidoV;' : ''}
      ${oggetto ? GLSL_OGGETTO : ''}
      ${oggetto === 'attributo' ? 'attribute vec2 aBase;' : ''}
      ${oggetto ? 'float kSalito;' : ''}`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>
      ${oggetto ? `{ ${base} kSalito = salito(baseO.xz); ${lontano ? 'if (costruito(baseO.xz)) kSalito = 0.0;' : ''} float e = kSalito * kSalito * (3.0 - 2.0 * kSalito); transformed.y -= (1.0 - e) * 4.5; }` : ''}
      ${vento > 0 ? `{
        #ifdef USE_INSTANCING
          vec3 radice = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #else
          vec3 radice = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #endif
        float pieg = max(0.0, position.y - uRigidoV) * uVentoV;
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
      }
      ${oggetto ? 'if (kSalito <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);' : ''}`)
}

// il materiale dell'ombra di un oggetto: chi non si è visto non fa ombra nemmeno lui (se no le sagome tornano dalle ombre)
export function ombraDi({ vento = 0, rigido = 0, oggetto = 'istanza' } = {}) {
  const mat = new MeshDepthMaterial({ depthPacking: RGBADepthPacking })
  mat.onBeforeCompile = sh => {
    cuciVertice(sh, { vento, rigido, oggetto })
    // il frammento dell'ombra non usa vMondo, ma la varying va dichiarata uguale
    sh.fragmentShader = 'varying vec3 vMondo;\n' + sh.fragmentShader
  }
  const chiave = `mondo-ombra-${vento > 0}-${oggetto}`
  mat.customProgramCacheKey = () => chiave
  return mat
}

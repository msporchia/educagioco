// La maschera in GPU: una texture di una cella per texel (scena3d/visibilita.js la scrive), che ogni materiale legge per
// spegnere quello che non si vede e lasciare il ricordo freddo e scuro. E il buco nei muri: le colonne e gli spigoli fra la
// telecamera e l'eroe si sfaldano in un cerchio retinato attorno a lui (solo i pezzi a sud del suo piede; le ombre non cambiano).
import { DataTexture, RGBAFormat, LinearFilter, Vector2 } from 'three'
import { ACCESI } from './costanti.js'
import { preparaLuceVertice } from './luce-vertice.js'

// Una per tutta la discesa: gli uniform restano gli stessi oggetti (i materiali li hanno già), e a ogni piano nuovo `metti`
// cambia la texture e la misura della mappa
export function creaMaschera() {
  let t = null
  const uniforms = {
    uMaschera: { value: null }, uDimMappa: { value: new Vector2(1, 1) },
    // il buco: centro a schermo (0..1), raggio (in altezze di schermo), da che z in giù, quanto
    uBucoUV: { value: new Vector2(0.5, 0.5) }, uBucoR: { value: 0.1 }, uBucoZ: { value: 0 }, uBucoForza: { value: 0.93 },
    uRisB: { value: new Vector2(1, 1) },
  }
  return {
    uniforms,
    get t() { return t },
    metti(v) {
      if (t) t.dispose()
      t = new DataTexture(v.dati, v.W, v.H, RGBAFormat)
      t.magFilter = t.minFilter = LinearFilter
      t.needsUpdate = true
      uniforms.uMaschera.value = t
      uniforms.uDimMappa.value.set(v.W, v.H)
    },
    rinfresca() { if (t) t.needsUpdate = true },
    via() { if (t) t.dispose(); t = null },
  }
}

export const GLSL_MASCHERA = 'uniform sampler2D uMaschera; uniform vec2 uDimMappa;\n'

// Inietta la maschera in un materiale standard: fuori dalla vista resta solo il ricordo, freddo e scuro (`ricordo: false`:
// niente, per chi nel ricordo non c'è). `spinta`: di quanto si legge la cella davanti alla faccia (un muro si accende con
// la cella che guarda). `prima`: GLSL da mettere prima (le figure). `poi(sh)`: chi deve aggiungere altro allo shader (e allora `chiave` dice il suo codice).
// Nella fascia bassa (`ACCESI.lucePerVertice`) la luce è per vertice (scena3d/luce-vertice.js), tranne chi dice `vertice: false` (le figure)
export function conMaschera(mat, maschera, { ricordo = true, spinta = 0.45, prima = '', buco = false, poi = null, chiave = '', vertice = true } = {}) {
  const pv = ACCESI.lucePerVertice && vertice ? preparaLuceVertice(mat, { rilievo: ACCESI.rilievo }) : null
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, maschera.uniforms)
    sh.vertexShader = 'varying vec3 vMondoM;\nvarying vec3 vNormM;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      vec4 wpM = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        wpM = instanceMatrix * wpM;
      #endif
      vMondoM = (modelMatrix * wpM).xyz;
      vNormM = normalize(mat3(modelMatrix) * objectNormal);`)
    sh.fragmentShader = GLSL_MASCHERA + 'varying vec3 vMondoM; varying vec3 vNormM;\n' +
      'uniform vec2 uBucoUV; uniform float uBucoR; uniform float uBucoZ; uniform float uBucoForza; uniform vec2 uRisB;\n' +
      sh.fragmentShader.replace('#include <clipping_planes_fragment>', buco ? `#include <clipping_planes_fragment>
      {
        vec2 qB = gl_FragCoord.xy / uRisB - uBucoUV; qB.x *= uRisB.x / uRisB.y;
        float fB = (1.0 - smoothstep(uBucoR * 0.5, uBucoR, length(qB))) * smoothstep(uBucoZ, uBucoZ + 0.25, vMondoM.z) * uBucoForza;
        float rB = fract(52.9829189 * fract(dot(floor(gl_FragCoord.xy), vec2(0.06711056, 0.00583715))));
        if (fB > rB) discard;
      }` : '#include <clipping_planes_fragment>').replace('#include <opaque_fragment>', `${prima}
      vec4 mM = texture2D(uMaschera, (vMondoM.xz + vNormM.xz * ${spinta.toFixed(2)}) / uDimMappa);
      outgoingLight = outgoingLight * mM.r + ${ricordo ? 'diffuseColor.rgb * mM.g * (1.0 - mM.r) * vec3(0.09, 0.12, 0.18)' : 'vec3(0.0)'};
      #include <opaque_fragment>`)
    if (poi) poi(sh)
    if (pv) pv.inietta(sh)
  }
  // la chiave dice solo cosa cambia il codice: le scelte qui sopra, e `chiave` quando c'è un `poi` (il suo codice non si legge da
  // fuori). Due materiali col codice uguale hanno lo stesso programma: prima ogni pezzo d'arredo aveva il suo (docs/sotterraneo/prestazioni-3d.md)
  const codice = 'maschera-' + ricordo + spinta + buco + (poi ? chiave : '') + prima + (pv ? pv.chiave : '')
  mat.customProgramCacheKey = () => codice
  return mat
}

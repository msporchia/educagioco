// Gli effetti: la maschera di quello che si vede (e si ricorda), la nebbia a fette, la polvere,
// le scintille, le fiamme e il passaggio finale (bloom, colore, vignetta, grana, scossa).
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'

export const MAX_LUCI = 8

// le luci che nebbia e polvere sommano a mano (non passano dal sistema di luci di three)
export function luciCondivise () {
  return {
    uLp: { value: Array.from({ length: MAX_LUCI }, () => new THREE.Vector3()) },
    uLc: { value: Array.from({ length: MAX_LUCI }, () => new THREE.Vector3()) },
    uLn: { value: 0 },
    uConoP: { value: new THREE.Vector3() },
    uConoD: { value: new THREE.Vector3(0, 0, -1) },
    uConoC: { value: new THREE.Vector3(1, 0.6, 0.3) },
  }
}

export const GLSL_RUMORE = /* glsl */`
float hash13(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float rumore3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash13(i),hash13(i+vec3(1,0,0)),f.x), mix(hash13(i+vec3(0,1,0)),hash13(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash13(i+vec3(0,0,1)),hash13(i+vec3(1,0,1)),f.x), mix(hash13(i+vec3(0,1,1)),hash13(i+vec3(1,1,1)),f.x),f.y), f.z); }
float fbm3(vec3 p){ float s=0.0, a=0.5; for(int i=0;i<4;i++){ s+=a*rumore3(p); p*=2.03; a*=0.5; } return s; }
`
export const GLSL_LUCI = /* glsl */`
uniform vec3 uLp[${MAX_LUCI}]; uniform vec3 uLc[${MAX_LUCI}]; uniform int uLn;
uniform vec3 uConoP; uniform vec3 uConoD; uniform vec3 uConoC;
vec3 luceIn(vec3 w){
  vec3 acc = vec3(0.0);
  for (int i = 0; i < ${MAX_LUCI}; i++) { if (i >= uLn) break; vec3 d = uLp[i]-w; acc += uLc[i] / (1.0 + dot(d,d)*1.6); }
  vec3 dc = w - uConoP; float dist = length(dc);
  float c = dot(dc/max(dist,1e-3), uConoD);
  acc += uConoC * smoothstep(0.25, 0.8, c) / (1.0 + dist*dist*0.12);
  return acc;
}
`

// ── la maschera: R = si vede adesso, G = ricordato, B = pavimento. Una cella = un texel ──
export function creaMaschera (W, H) {
  const dati = new Uint8Array(W * H * 4)
  const t = new THREE.DataTexture(dati, W, H, THREE.RGBAFormat)
  t.magFilter = t.minFilter = THREE.LinearFilter
  t.needsUpdate = true
  return { t, dati, ora: new Float32Array(W * H), ric: new Float32Array(W * H), uniforms: {
    uMaschera: { value: t }, uDimMappa: { value: new THREE.Vector2(W, H) },
    // il buco nei muri davanti all'eroe: centro a schermo (0..1), raggio (in altezze di schermo), da che z in giù
    uBucoUV: { value: new THREE.Vector2(0.5, 0.5) }, uBucoR: { value: 0.1 }, uBucoZ: { value: 0 }, uBucoForza: { value: 0.93 },
    uRisB: { value: new THREE.Vector2(1, 1) },
  } }
}

// Inietta la maschera in un materiale standard: fuori dalla vista resta solo il ricordo, freddo e
// scuro. `ricordo: false` per i mostri: il ricordo non si muove (docs/sotterraneo/luce.md).
// `buco`: i muri e le colonne fra la telecamera e l'eroe si sfaldano in un cerchio retinato attorno a lui
// (solo i pezzi a sud del suo piede: quelli dietro non lo coprono mai). Le ombre non cambiano.
export function conMaschera (mat, maschera, { ricordo = true, spinta = 0.45, prima = '', buco = false } = {}) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, maschera.uniforms)
    sh.vertexShader = 'varying vec3 vMondoM;\nvarying vec3 vNormM;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      vec4 wpM = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        wpM = instanceMatrix * wpM;
      #endif
      vMondoM = (modelMatrix * wpM).xyz;
      vNormM = normalize(mat3(modelMatrix) * objectNormal);`)
    sh.fragmentShader = 'uniform sampler2D uMaschera; uniform vec2 uDimMappa; varying vec3 vMondoM; varying vec3 vNormM;\n' +
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
  }
  mat.customProgramCacheKey = () => 'maschera-' + ricordo + spinta + prima + buco
  return mat
}

// ── la nebbia: fette orizzontali sommate, ognuna illuminata a mano dalle luci vicine ──
export function creaNebbia (scena, W, H, fette, luci, maschera, densita = 0.05) {
  const gruppo = new THREE.Group()
  if (!fette) return { gruppo, aggiorna () {} }
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...luci, ...maschera.uniforms, uT: { value: 0 }, uDens: { value: densita } },
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      uniform float uT; uniform float uDens; uniform sampler2D uMaschera; uniform vec2 uDimMappa; varying vec3 vW;
      ${GLSL_RUMORE}${GLSL_LUCI}
      void main(){
        vec4 m = texture2D(uMaschera, vW.xz / uDimMappa);
        float n = fbm3(vec3(vW.x*0.55 + uT*0.07, vW.y*1.3, vW.z*0.55 - uT*0.05));
        float dens = uDens * smoothstep(0.25, 0.85, n) * 2.2 * m.b * m.r * (1.15 - vW.y*0.5);
        gl_FragColor = vec4(luceIn(vW) * dens, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  for (let i = 0; i < fette; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat)
    p.rotation.x = -Math.PI / 2
    p.position.set(W / 2, 0.08 + (i + 0.5) / fette * 1.3, H / 2)
    p.renderOrder = 10
    gruppo.add(p)
  }
  scena.add(gruppo)
  return { gruppo, aggiorna (t) { mat.uniforms.uT.value = t } }
}

// ── polvere in sospensione: punti che derivano lenti in una scatola attorno all'eroe ──
export function creaPolvere (scena, quanti, luci, maschera) {
  const pos = new Float32Array(quanti * 3), seme = new Float32Array(quanti)
  for (let i = 0; i < quanti; i++) { pos[i * 3] = Math.random() * 26; pos[i * 3 + 1] = Math.random() * 1.6; pos[i * 3 + 2] = Math.random() * 26; seme[i] = Math.random() }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('seme', new THREE.BufferAttribute(seme, 1))
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...luci, ...maschera.uniforms, uT: { value: 0 }, uCentro: { value: new THREE.Vector3() }, uScala: { value: 400 } },
    vertexShader: /* glsl */`
      attribute float seme; uniform float uT; uniform vec3 uCentro; uniform float uScala; varying vec3 vW; varying float vS;
      void main(){
        vec3 p = position + vec3(sin(uT*0.21 + seme*40.0)*0.6 + uT*0.05, sin(uT*0.33 + seme*17.0)*0.25, cos(uT*0.17 + seme*23.0)*0.6);
        vec3 box = vec3(26.0, 1.6, 26.0);
        p = mod(p - uCentro + box*0.5, box) - box*0.5 + uCentro; p.y = mod(position.y + sin(uT*0.2+seme*9.0)*0.3, 1.6) + 0.05;
        vW = p; vS = seme;
        vec4 mv = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uScala * (0.012 + seme*0.02) / -mv.z;
      }`,
    fragmentShader: /* glsl */`
      uniform float uT; uniform sampler2D uMaschera; uniform vec2 uDimMappa; varying vec3 vW; varying float vS;
      ${GLSL_LUCI}
      void main(){
        vec2 c = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(c));
        vec4 m = texture2D(uMaschera, vW.xz / uDimMappa);
        float luccica = 0.55 + 0.45*sin(uT*2.0 + vS*60.0);
        gl_FragColor = vec4(luceIn(vW) * a * luccica * m.r * m.b * 0.9, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const punti = new THREE.Points(geo, mat)
  punti.frustumCulled = false
  punti.renderOrder = 11
  if (quanti) scena.add(punti)
  return { aggiorna (t, centro, scala) { mat.uniforms.uT.value = t; mat.uniforms.uCentro.value.copy(centro); mat.uniforms.uScala.value = scala } }
}

// ── scintille: una riserva di particelle simulate sulla CPU (gravità, attrito, colore che si raffredda) ──
export function creaScintille (scena, max = 1200) {
  const pos = new Float32Array(max * 3), col = new Float32Array(max * 3), dim = new Float32Array(max)
  const vel = new Float32Array(max * 3), vita = new Float32Array(max), dura = new Float32Array(max), calore = new Float32Array(max)
  const tinta = new Float32Array(max * 3).fill(-1)   // il colore di un'abilità; -1: il fuoco che si raffredda
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage))
  geo.setAttribute('dim', new THREE.BufferAttribute(dim, 1).setUsage(THREE.DynamicDrawUsage))
  const mat = new THREE.ShaderMaterial({
    uniforms: { uScala: { value: 400 } },
    vertexShader: /* glsl */`attribute float dim; attribute vec3 color; uniform float uScala; varying vec3 vC;
      void main(){ vC = color; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = uScala*dim / -mv.z; }`,
    fragmentShader: /* glsl */`varying vec3 vC; void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5, 0.1, d); gl_FragColor = vec4(vC*a, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const punti = new THREE.Points(geo, mat)
  punti.frustumCulled = false
  punti.renderOrder = 12
  scena.add(punti)
  let prossima = 0
  const emetti = (x, y, z, n, { forza = 3, su = 2, vita: v = 0.6, caldo = 1, taglia = 0.05, tinta: t = null } = {}) => {
    for (let k = 0; k < n; k++) {
      const i = prossima; prossima = (prossima + 1) % max
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z
      const a = Math.random() * Math.PI * 2, e = Math.random()
      vel[i * 3] = Math.cos(a) * forza * e; vel[i * 3 + 1] = su * (0.4 + Math.random()); vel[i * 3 + 2] = Math.sin(a) * forza * e
      vita[i] = dura[i] = v * (0.5 + Math.random()); calore[i] = caldo; dim[i] = taglia * (0.6 + Math.random() * 0.8)
      if (t) { tinta[i * 3] = t.r; tinta[i * 3 + 1] = t.g; tinta[i * 3 + 2] = t.b } else tinta[i * 3] = -1
    }
  }
  const aggiorna = (dt, scala) => {
    mat.uniforms.uScala.value = scala
    for (let i = 0; i < max; i++) {
      if (vita[i] <= 0) { if (dim[i]) { dim[i] = 0; col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0 } continue }
      vita[i] -= dt
      vel[i * 3 + 1] -= 6 * dt * (calore[i] > 0.5 ? 1 : -0.15)
      const attr = Math.exp(-2.5 * dt)
      vel[i * 3] *= attr; vel[i * 3 + 2] *= attr
      pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt
      if (pos[i * 3 + 1] < 0.02) { pos[i * 3 + 1] = 0.02; vel[i * 3 + 1] *= -0.35 }
      const f = Math.max(0, vita[i] / dura[i])
      // dal bianco-giallo al rosso cupo; HDR (>1) perché il bloom le prenda
      const k = 6 * f * f
      if (tinta[i * 3] >= 0) { const q = 4 * f; col[i * 3] = tinta[i * 3] * q + f * 0.6; col[i * 3 + 1] = tinta[i * 3 + 1] * q + f * 0.6; col[i * 3 + 2] = tinta[i * 3 + 2] * q + f * 0.6 }
      else { col[i * 3] = k * 1.0; col[i * 3 + 1] = k * (0.25 + 0.55 * f); col[i * 3 + 2] = k * 0.12 * f * f }
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.attributes.dim.needsUpdate = true
  }
  return { emetti, aggiorna }
}

// ── la fiamma di una torcia: un quadrato rivolto alla telecamera con il fuoco disegnato dal rumore ──
export function materialeFiamma () {
  return new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 } },
    vertexShader: /* glsl */`attribute float semeF; varying vec2 vUv; varying float vSeme; void main(){ vUv = uv; vSeme = semeF; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */`uniform float uT; varying vec2 vUv; varying float vSeme;
      ${GLSL_RUMORE}
      void main(){
        vec2 p = vUv; p.x -= 0.5;
        float n = fbm3(vec3(p.x*3.0, p.y*2.5 - uT*3.5, uT*0.7 + vSeme*13.0));
        float largo = 0.36 * pow(1.0 - p.y, 0.8) * (0.7 + 0.6*n);
        float corpo = 1.0 - smoothstep(largo*0.3, largo, abs(p.x + (n-0.5)*0.25*p.y));
        corpo *= smoothstep(0.0, 0.12, p.y) * (1.0 - smoothstep(0.35, 0.95, p.y + (n-0.5)*0.5));
        float cuore = corpo * (1.0 - smoothstep(0.0, 0.45, p.y)) ;
        vec3 c = mix(vec3(1.0, 0.22, 0.03), vec3(1.0, 0.75, 0.35), cuore);
        float alone = smoothstep(0.5, 0.0, length(vec2(p.x, p.y-0.3))) * 0.18;
        gl_FragColor = vec4(c*corpo*1.8 + vec3(1.0,0.4,0.1)*alone, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
}

// ── il passaggio finale, dopo il tone mapping: colore, aberrazione, vignetta, grana, lampo ──
const Finale = {
  uniforms: {
    tDiffuse: { value: null }, uT: { value: 0 }, uAberr: { value: 0 }, uVign: { value: 0.32 }, uGrana: { value: 0.045 },
    uLampo: { value: 0 }, uRosso: { value: 0 }, uRis: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uT, uAberr, uVign, uGrana, uLampo, uRosso; uniform vec2 uRis; varying vec2 vUv;
    float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
    void main(){
      vec2 c = vUv - 0.5; float r2 = dot(c, c);
      float a = uAberr + 0.0025;
      vec3 col = vec3(texture2D(tDiffuse, vUv - c*a*r2*4.0).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv + c*a*r2*4.0).b);
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      // ombre verso il blu-verde, luci verso l'ambra; un poco più di contrasto e di saturazione
      col *= mix(vec3(0.86, 0.98, 1.12), vec3(1.0), smoothstep(0.0, 0.35, l));
      col *= mix(vec3(1.0), vec3(1.07, 1.0, 0.88), smoothstep(0.35, 1.0, l));
      col = mix(vec3(l), col, 1.15);
      col = (col - 0.5) * 1.06 + 0.5;
      col *= 1.0 - uVign * smoothstep(0.08, 0.55, r2);
      col += uRosso * vec3(0.5, 0.0, 0.0) * smoothstep(0.05, 0.4, r2);
      col += uLampo * vec3(1.0, 0.92, 0.8);
      float g = h12(vUv*uRis + fract(uT*13.7)*517.0) - 0.5;
      col += g * uGrana * (1.0 - l*0.6);
      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }`,
}

export function creaPost (renderer, scena, camera, { bloom }) {
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scena, camera))
  let passBloom = null
  if (bloom) {
    passBloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.85, 0.55, 0.9)
    composer.addPass(passBloom)
  }
  composer.addPass(new OutputPass())
  const finale = new ShaderPass(Finale)
  composer.addPass(finale)
  return { composer, bloom: passBloom, finale: finale.uniforms }
}

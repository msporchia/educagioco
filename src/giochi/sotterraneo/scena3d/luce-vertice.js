// La luce per vertice del piano (fascia bassa, `ACCESI.lucePerVertice`): pavimento, pareti, colonne, arredo, botti, fontana, portale e
// relitti sommano le luci una volta per vertice invece che per pixel. Le luci restano quelle di three (luci.js le muove come sempre, e
// i personaggi le usano per pixel), e prima di ogni disegno se ne copiano posizione, colore e forza in una trama di una riga che il
// vertex shader legge; i fuochi sono tutti quelli della riserva (N_FUOCHI), anche se a three ne restano meno. La nebbia diventa un
// termine per vertice al posto della fetta. Il perché e i conti: docs/sotterraneo/appiattimento-3d.md, «Nel gioco».
import { DataTexture, RGBAFormat, FloatType, NearestFilter, Vector3, Color, BufferAttribute } from 'three'
import { GLSL_RUMORE } from './luci.js'

export const N_VERTICE = 12   // luci puntiformi al più in un vertice (cinque dell'eroe e dei colpi, sei fuochi)

// in una trama e non in array di uniform: three copia e confronta gli array a ogni materiale che disegna, ed è quello il JS caro sul Note 7.
// texel: 0 cielo, 1 terra, 2 cono (posizione, cos dell'apertura), 3 (verso, cos della penombra), 4 (colore, distanza), 5 (decadimento del
// cono, quante luci), poi due per luce: (posizione, distanza), (colore, decadimento)
const T0 = 6
const LARGA = T0 + 2 * N_VERTICE

// una funzione: luci.js importa questo file, e GLSL_RUMORE non c'è ancora quando questo si valuta
const parsV = () => /* glsl */`
uniform highp sampler2D uPvLuci;
uniform float uPvLucido;
uniform float uPvT; uniform float uPvDens; uniform vec3 uPvTinta;
varying vec3 vPvD; varying vec3 vPvS; varying vec3 vPvNeb;
#ifdef PV_RILIEVO
  varying vec2 vPvUv;
#endif
${GLSL_RUMORE}
vec4 pvT(int i) { return texelFetch(uPvLuci, ivec2(i, 0), 0); }
float pvAtt(float d, float cut, float dec) {
  d = max(d, 0.6);   // una luce rasoterra (il rimbalzo della torcia) farebbe un picco che l'interpolazione allarga a macchia bianca
  float f = 1.0 / max(pow(d, dec), 0.01);
  if (cut > 0.0) { float r = d / cut; r *= r; f *= pow(clamp(1.0 - r * r, 0.0, 1.0), 2.0); }
  return f;
}
float pvNL(float x) {
  #ifdef PV_DOPPIO
    return abs(x);
  #else
    return max(x, 0.0);
  #endif
}
// come three: l'emisferica, le puntiformi (la distanza e il decadimento), il cono (la penombra); la speculare è una Blinn
vec3 pvLuce(vec3 P, vec3 Nw, vec3 V) {
  vec3 D = mix(pvT(1).rgb, pvT(0).rgb, 0.5 * Nw.y + 0.5), S = vec3(0.0), F = vec3(0.0);
  // la Blinn normalizzata, col termine di visibilità della GGX di three (1 / 4·NL·NV): senza, la chiazza calda della torcia sul
  // pavimento lucido era la metà
  float k = (uPvLucido + 8.0) / 25.1327 / (4.0 * max(dot(Nw, V), 0.2));
  vec4 t5 = pvT(5);
  int n = int(t5.y + 0.5);
  for (int i = 0; i < ${N_VERTICE}; i++) {
    if (i >= n) break;
    vec4 a = pvT(${T0} + 2 * i), b = pvT(${T0} + 2 * i + 1);
    vec3 l = a.xyz - P; float d = length(l); l /= max(d, 1e-4);
    vec3 e = b.rgb * pvAtt(d, a.w, b.w);
    vec3 irr = e * pvNL(dot(Nw, l));
    D += irr; F += e; S += irr / max(pvNL(dot(Nw, l)), 0.2) * pow(max(dot(Nw, normalize(l + V)), 0.0), uPvLucido) * k;
  }
  {
    vec4 a = pvT(2), b = pvT(3), c = pvT(4);
    vec3 l = a.xyz - P; float d = length(l); l /= max(d, 1e-4);
    vec3 e = c.rgb * pvAtt(d, c.w, t5.x) * smoothstep(a.w, b.w, dot(l, b.xyz));
    vec3 irr = e * pvNL(dot(Nw, l));
    D += irr; F += e; S += irr / max(pvNL(dot(Nw, l)), 0.2) * pow(max(dot(Nw, normalize(l + V)), 0.0), uPvLucido) * k;
  }
  vPvD = D; vPvS = S;
  return F;
}
`
// dopo `project_vertex` (e dopo il pezzo della maschera, che ha già `wpM`): la luce nel punto del mondo, e la nebbia di quel vertice
const CALCOLO_V = /* glsl */`
  {
    vec4 pvW = modelMatrix * wpM;
    vec3 pvN = normalize((vec4(transformedNormal, 0.0) * viewMatrix).xyz);
    vec3 pvF = pvLuce(pvW.xyz, pvN, normalize(cameraPosition - pvW.xyz));
    // come la fetta di creaNebbia (particelle.js): il rumore che deriva, la luce che arriva lì (senza il coseno), la tinta del
    // paesaggio, più fitta in basso; una per vertice invece che una per pixel
    float pvn = fbm3(vec3(pvW.x * 0.55 + uPvT * 0.07, 0.9, pvW.z * 0.55 - uPvT * 0.05));
    #ifdef PV_RILIEVO
      vPvUv = uv;   // le trame del piano non hanno trasformazione: le uv del pezzo (anche la cima dei muri, che non ha la mappa)
    #endif
    vPvNeb = pvF * 0.017 * uPvTinta * uPvDens * smoothstep(0.25, 0.85, pvn) * 2.2 * clamp((1.38 - pvW.y) / 1.3, 0.0, 1.0);
  }
`
const PARS_F = 'varying vec3 vPvD; varying vec3 vPvS; varying vec3 vPvNeb;\n#ifdef PV_RILIEVO\n  varying vec2 vPvUv;\n#endif\n'
// la normal map ridotta a un'ombreggiatura ferma, come se la luce venisse dall'alto dello schermo (le fughe più scure, i bordi in
// alto più chiari, in media scura quanto la normal map vera): una lettura di trama, nessuna luce
const RILIEVO_F = /* glsl */`
#include <map_fragment>
#ifdef PV_RILIEVO
  { vec3 rn = texture2D(uPvRilievo, vPvUv).xyz * 2.0 - 1.0; diffuseColor.rgb *= clamp(mix(1.0, dot(rn, vec3(0.0, 0.45, 0.89)) / 0.89, 0.8), 0.45, 1.3); }
#endif
`
const INIZIO_F = /* glsl */`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
`
const FINE_F = /* glsl */`
reflectedLight.indirectDiffuse += vPvD * BRDF_Lambert( material.diffuseContribution );
reflectedLight.directSpecular += vPvS * material.specularColorBlended;
totalEmissiveRadiance += vPvNeb;
`

// il verde medio di una trama di dati (la ruvidezza di three sta lì), 1 senza trama
function mediaVerde(t) {
  const d = t && t.image && t.image.data
  if (!d || !d.length) return 1
  let s = 0, n = 0
  for (let i = 1; i < d.length; i += 4 * 7) { s += d[i]; n++ }
  return n ? s / n / 255 : 1
}
// una sostituzione che non trova il pezzo darebbe uno shader che compila e si vede sbagliato: meglio fermarsi
const con = (s, da, a) => { if (!s.includes(da)) throw new Error('luce per vertice: manca ' + da); return s.replace(da, a) }

/**
 * Prepara un materiale Standard per la luce per vertice, prima che nasca il programma: via la normal map e la ruvidezza (il calcolo
 * per pixel che sostituisce), e con `rilievo` la normal map letta come ombreggiatura ferma. Torna { chiave, inietta(sh) } da chiamare
 * nell'onBeforeCompile (conMaschera, maschera.js), o null se il materiale non è Standard.
 */
export function preparaLuceVertice(mat, { rilievo = true } = {}) {
  if (!mat.isMeshStandardMaterial) return null
  const tRilievo = rilievo && mat.normalMap ? mat.normalMap : null
  // la ruvidezza: quella media della sua trama (le pietre lucide del pavimento fanno la chiazza calda della torcia)
  const r = Math.max(0.05, (mat.roughness ?? 1) * mediaVerde(mat.roughnessMap))
  mat.normalMap = null; mat.roughnessMap = null
  const lucido = { value: Math.max(2, Math.min(128, 2 / (r ** 4 + 1e-4) - 2)) }
  const doppio = mat.side === 2
  const def = (tRilievo ? '#define PV_RILIEVO\nuniform sampler2D uPvRilievo;\n' : '') + (doppio ? '#define PV_DOPPIO\n' : '')
  return {
    chiave: '|pv' + (tRilievo ? 'r' : '') + (doppio ? 'd' : ''),
    inietta(sh) {
      sh.uniforms.uPvLucido = lucido
      if (tRilievo) sh.uniforms.uPvRilievo = { value: tRilievo }
      const DOPO = 'vNormM = normalize(mat3(modelMatrix) * objectNormal);'
      sh.vertexShader = def + parsV() + con(sh.vertexShader, DOPO, DOPO + '\n' + CALCOLO_V)
      let f = sh.fragmentShader
      for (const [da, a] of [['#include <map_fragment>', RILIEVO_F], ['#include <lights_fragment_begin>', INIZIO_F], ['#include <lights_fragment_maps>', ''], ['#include <lights_fragment_end>', FINE_F]]) f = con(f, da, a)
      sh.fragmentShader = def + PARS_F + f
    },
  }
}

/**
 * La trama delle luci, una per discesa: `uniforms` (si aggiungono a quelli della maschera, così ogni materiale del piano li ha) e
 * `scrivi(luci, camera)` prima di ogni disegno. `nebbia(aspetto, fette)`: la nebbia del paesaggio, quella delle `fette` che sostituisce.
 */
export function creaLuceVertice() {
  const dati = new Float32Array(LARGA * 4)
  const trama = new DataTexture(dati, LARGA, 1, RGBAFormat, FloatType)
  trama.magFilter = trama.minFilter = NearestFilter; trama.needsUpdate = true
  const uniforms = { uPvLuci: { value: trama }, uPvT: { value: 0 }, uPvDens: { value: 0 }, uPvTinta: { value: new Vector3() } }
  let dens = 0
  const tmp = new Vector3(), c = new Color()
  const scriviT = (i, x, y, z, w) => { dati[i * 4] = x; dati[i * 4 + 1] = y; dati[i * 4 + 2] = z; dati[i * 4 + 3] = w }
  return {
    uniforms,
    nebbia(aspetto, fette) { dens = aspetto.nebbia.densita * fette; uniforms.uPvTinta.value.set(...aspetto.nebbia.colore) },
    /**
     * `cielo`: l'emisferica; `punti`: le puntiformi di three (quelle fuori scena o su un altro strato non contano, come per three);
     * `fuochi`: [{ pos, colore, forza, raggio }] già col tremolio; `cono`: la spot; `nebbia`: se la nebbia è accesa; `t`: il tempo.
     */
    scrivi({ cielo, punti, fuochi, nFuochi, cono, nebbia, t }, camera) {
      const vede = l => l && l.parent && (l.visible || l.userData.soloVertice) && l.layers.test(camera.layers)   // `soloVertice`: il cono della torcia semplice (luci.js)
      if (vede(cielo)) {
        const k = cielo.intensity, a = cielo.color, b = cielo.groundColor
        scriviT(0, a.r * k, a.g * k, a.b * k, 0); scriviT(1, b.r * k, b.g * k, b.b * k, 0)
      } else { scriviT(0, 0, 0, 0, 0); scriviT(1, 0, 0, 0, 0) }
      let n = 0
      const metti = (p, col, forza, distanza, decadimento) => {
        if (n >= N_VERTICE || forza <= 0.001) return
        scriviT(T0 + 2 * n, p.x, p.y, p.z, distanza)
        c.copy(col).multiplyScalar(forza)
        scriviT(T0 + 2 * n + 1, c.r, c.g, c.b, decadimento)
        n++
      }
      for (const l of punti) if (vede(l)) metti(l.position, l.color, l.intensity, l.distance, l.decay)
      for (let i = 0; i < nFuochi; i++) { const f = fuochi[i]; metti(f.pos, f.colore, f.forza, f.raggio, 1.7) }
      if (vede(cono) && cono.intensity > 0) {
        const p = cono.position
        tmp.copy(p).sub(cono.target.position).normalize()
        c.copy(cono.color).multiplyScalar(cono.intensity)
        scriviT(2, p.x, p.y, p.z, Math.cos(cono.angle)); scriviT(3, tmp.x, tmp.y, tmp.z, Math.cos(cono.angle * (1 - cono.penumbra))); scriviT(4, c.r, c.g, c.b, cono.distance)
      } else { scriviT(2, 0, -99, 0, 1); scriviT(3, 0, 1, 0, 1); scriviT(4, 0, 0, 0, 1) }
      scriviT(5, cono ? cono.decay : 1, n, 0, 0)
      trama.needsUpdate = true
      uniforms.uPvT.value = t
      uniforms.uPvDens.value = nebbia ? dens : 0
    },
    via() { trama.dispose() },
  }
}

/**
 * Una geometria con ogni triangolo diviso in `volte` (2 o 4) triangoli, perché la luce interpolata resti liscia. `fissi`: gli
 * attributi che non si mediano (un indice di cella: il punto di mezzo prende quello del primo capo).
 */
export function dividi(geo, volte, fissi = ['aCella']) {
  const n0 = geo.attributes.position.count, nomi = Object.keys(geo.attributes), sorgenti = nomi.map(k => geo.attributes[k])
  const dati = sorgenti.map(a => { const v = []; for (let i = 0; i < n0; i++) for (let k = 0; k < a.itemSize; k++) v.push(a.getComponent(i, k)); return v })
  const iN = nomi.indexOf('normal'), fisso = nomi.map(k => fissi.includes(k)), medi = new Map()
  let n = n0
  const medio = (a, b) => {
    const k = a < b ? a * 4294967296 + b : b * 4294967296 + a
    let m = medi.get(k); if (m !== undefined) return m
    m = n++
    sorgenti.forEach((s, j) => {
      const d = dati[j], z = s.itemSize
      for (let q = 0; q < z; q++) d[m * z + q] = fisso[j] ? d[a * z + q] : (d[a * z + q] + d[b * z + q]) / 2
      if (j === iN) { const l = Math.hypot(d[m * 3], d[m * 3 + 1], d[m * 3 + 2]) || 1; for (let q = 0; q < 3; q++) d[m * 3 + q] /= l }
    })
    medi.set(k, m); return m
  }
  const t = geo.index ? Array.from(geo.index.array) : Array.from({ length: n0 }, (_, i) => i), tri = []
  for (let i = 0; i < t.length; i += 3) {
    const a = t[i], b = t[i + 1], c = t[i + 2]
    if (volte === 2) { const m = medio(a, b); tri.push(a, m, c, m, b, c) }
    else { const ab = medio(a, b), bc = medio(b, c), ca = medio(c, a); tri.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca) }
  }
  const g = geo.clone()
  sorgenti.forEach((s, j) => g.setAttribute(nomi[j], new BufferAttribute(new Float32Array(dati[j]), s.itemSize, s.normalized)))
  g.setIndex(n > 65535 ? new BufferAttribute(new Uint32Array(tri), 1) : new BufferAttribute(new Uint16Array(tri), 1))
  g.groups = geo.groups.map(x => ({ ...x, start: x.start * volte, count: x.count * volte }))
  return g
}

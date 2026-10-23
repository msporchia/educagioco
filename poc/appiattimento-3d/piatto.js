// La luce spostata dai pixel ai vertici, sulla scena vera: ogni materiale Standard/Physical del gioco tiene tutto (trama, colore,
// maschera, emissivo, i ritocchi di chi l'ha scritto) tranne il calcolo delle luci per pixel, che diventa una somma fatta UNA volta
// per vertice e interpolata (`vPvD` diffusa, `vPvS` speculare Blinn). Le luci di three restano nella scena ma nascoste: il gioco le
// muove come sempre, e prima di ogni disegno se ne copiano posizione, colore e forza negli uniform (nessuna luce per pixel, nessuna
// passata d'ombra). Con `nebbia` la nebbia diventa un termine per vertice (niente fette), con `cotta` pavimento e muri prendono
// dai colori ai vertici la penombra degli angoli e il chiarore fermo dei fuochi, e i fuochi escono dal giro dinamico.
// I triangoli costano poco sul Note 7 (docs/sotterraneo/appiattimento-3d.md): pavimento e muri si suddividono perché la luce
// interpolata resti liscia.
import { Vector3, Color, BufferAttribute, DataTexture, RGBAFormat, FloatType, NearestFilter } from 'three'
import { GLSL_RUMORE } from '../../src/giochi/sotterraneo/scena3d/luci.js'
import { dividi } from './carichi.js'

const N = 16   // luci puntiformi al più in un vertice

// le luci stanno in una trama (una riga di texel, scritta una volta per fotogramma) e non in array di uniform: three copia e confronta
// gli array a ogni materiale che disegna (flatten, copyArray), ed è quello il JS caro sul Note 7 (docs/sotterraneo/appiattimento-3d.md)
// texel: 0 cielo, 1 terra, 2 cono (posizione, cos dell'apertura), 3 (direzione, cos della penombra), 4 (colore, distanza), 5 (decadimento,
// quante luci, quante senza i fuochi), poi due per luce: (posizione, distanza), (colore, decadimento)
const T0 = 6
const PARS_V = /* glsl */`
uniform highp sampler2D uPvLuci;
uniform float uPvLucido;
varying vec3 vPvD; varying vec3 vPvS;
#ifdef PV_COTTA
  attribute vec4 aCotta;
#endif
#ifdef PV_NEBBIA
  uniform float uPvT; uniform float uPvDens; uniform vec3 uPvTinta; uniform float uPvFette;
  varying vec3 vPvNeb;
  ${GLSL_RUMORE}
#endif
vec3 vPvF;
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
void pvLuce(vec3 P, vec3 Nw, vec3 V) {
  vec3 D = mix(pvT(1).rgb, pvT(0).rgb, 0.5 * Nw.y + 0.5), S = vec3(0.0), F = vec3(0.0);
  float k = (uPvLucido + 8.0) / 25.1327;
  vec4 t5 = pvT(5);
  int n = int(t5.y + 0.5);
  #ifdef PV_COTTA
    n = int(t5.z + 0.5);
  #endif
  for (int i = 0; i < ${N}; i++) {
    if (i >= n) break;
    vec4 a = pvT(${T0} + 2 * i), b = pvT(${T0} + 2 * i + 1);
    vec3 l = a.xyz - P; float d = length(l); l /= max(d, 1e-4);
    vec3 e = b.rgb * pvAtt(d, a.w, b.w);
    vec3 irr = e * pvNL(dot(Nw, l));
    D += irr; F += e; S += irr * pow(max(dot(Nw, normalize(l + V)), 0.0), uPvLucido) * k;
  }
  {
    vec4 a = pvT(2), b = pvT(3), c = pvT(4);
    vec3 l = a.xyz - P; float d = length(l); l /= max(d, 1e-4);
    float sp = smoothstep(a.w, b.w, dot(l, b.xyz));
    vec3 e = c.rgb * pvAtt(d, c.w, t5.x) * sp;
    vec3 irr = e * pvNL(dot(Nw, l));
    D += irr; F += e; S += irr * pow(max(dot(Nw, normalize(l + V)), 0.0), uPvLucido) * k;
  }
  #ifdef PV_COTTA
    D = D * aCotta.a + aCotta.rgb;
  #endif
  vPvD = D; vPvS = S; vPvF = F;
}
`
const CALCOLO_V = /* glsl */`
  {
    vec4 pvW = vec4(transformed, 1.0);
    #ifdef USE_BATCHING
      pvW = batchingMatrix * pvW;
    #endif
    #ifdef USE_INSTANCING
      pvW = instanceMatrix * pvW;
    #endif
    pvW = modelMatrix * pvW;
    vec3 pvN = normalize((vec4(transformedNormal, 0.0) * viewMatrix).xyz);
    pvLuce(pvW.xyz, pvN, normalize(cameraPosition - pvW.xyz));
    #ifdef PV_NEBBIA
      // come le fette di creaNebbia (particelle.js): il rumore che deriva, la luce dei fuochi e della torcia, la tinta del paesaggio;
      // una per vertice invece che una per pixel e per fetta, e quanta nebbia sta fra la telecamera e il punto (più in basso, di più)
      float pvn = fbm3(vec3(pvW.x * 0.55 + uPvT * 0.07, 0.9, pvW.z * 0.55 - uPvT * 0.05));
      float pvSopra = clamp((1.38 - pvW.y) / 1.3, 0.0, 1.0);
      vPvNeb = vPvF * 0.05 * uPvTinta * uPvDens * smoothstep(0.25, 0.85, pvn) * 2.2 * uPvFette * pvSopra;   // la luce che la nebbia prende: quella del vertice, senza il coseno
    #endif
  }
`
const INIZIO_F = /* glsl */`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
`
// la normal map ridotta a un'ombreggiatura ferma (le fughe dei mattoni più scure, i bordi in alto più chiari): una lettura di trama,
// nessun calcolo di luce per pixel
const RILIEVO_F = /* glsl */`
#include <map_fragment>
#ifdef PV_RILIEVO
  { vec3 rn = texture2D(uPvRilievo, vMapUv).xyz * 2.0 - 1.0; diffuseColor.rgb *= clamp(1.0 - 1.7 * (1.0 - rn.z) + 0.4 * rn.y, 0.35, 1.25); }
#endif
`
const FINE_F = /* glsl */`
reflectedLight.indirectDiffuse += vPvD * BRDF_Lambert( material.diffuseContribution );
reflectedLight.directSpecular += vPvS * material.specularColorBlended;
#ifdef PV_NEBBIA
  totalEmissiveRadiance += vPvNeb;
#endif
`

/**
 * La luce per vertice su una scena. `opz`: { nebbia (per vertice al posto delle fette), cotta ({ fuochi(), muro(x, z) }: penombra e
 * fuochi fermi nei colori ai vertici di pavimento e muri, e i fuochi fuori dal giro dinamico di quelle due), suddividi (pavimento ×16,
 * muri ×4), normali (false: via le normal map, tranne le figure) }. → { converti() (da richiamare: le cose nate dopo), conti }
 */
export function creaLuceVertice(scena, { nebbia = false, cotta = false, suddividi = true, normali = false } = {}) {
  const dati = new Float32Array((T0 + 2 * N) * 4)
  const trama = new DataTexture(dati, T0 + 2 * N, 1, RGBAFormat, FloatType)
  trama.magFilter = trama.minFilter = NearestFilter; trama.needsUpdate = true
  const U = { uPvLuci: { value: trama }, uPvT: { value: 0 }, uPvDens: { value: 0 }, uPvTinta: { value: new Vector3() }, uPvFette: { value: 2 } }
  let fatte = new WeakSet(), luci = null, nebbiaMesh = null
  const conti = { materiali: 0, suddivise: 0, triangoliPrima: 0, triangoliDopo: 0, luciPerVertice: 0 }

  // le luci della scena: si nascondono (three non le conta più: niente luci per pixel né passata d'ombra) e si leggono a ogni disegno
  function raccogli() {
    luci = { punti: [], fuochi: [], cono: null, cielo: null }
    scena.traverse(o => {
      if (!o.isLight) return
      if (o.isHemisphereLight) luci.cielo = o
      else if (o.isSpotLight) luci.cono = o
      else if (o.isPointLight) (o.decay === 1.7 ? luci.fuochi : luci.punti).push(o)   // i fuochi della riserva (luci.js): decadimento 1,7
      o.visible = false
    })
  }
  const tmp = new Vector3(), c = new Color()
  const scrivi = (i, x, y, z, w) => { dati[i * 4] = x; dati[i * 4 + 1] = y; dati[i * 4 + 2] = z; dati[i * 4 + 3] = w }
  function aggiornaUniform() {
    if (!luci) return
    if (luci.cielo) { const k = luci.cielo.intensity, a = luci.cielo.color, b = luci.cielo.groundColor; scrivi(0, a.r * k, a.g * k, a.b * k, 0); scrivi(1, b.r * k, b.g * k, b.b * k, 0) }
    let n = 0
    const metti = l => {
      if (n >= N || l.intensity <= 0.001) return
      l.getWorldPosition(tmp)
      scrivi(T0 + 2 * n, tmp.x, tmp.y, tmp.z, l.distance)
      c.copy(l.color).multiplyScalar(l.intensity)
      scrivi(T0 + 2 * n + 1, c.r, c.g, c.b, l.decay)
      n++
    }
    for (const l of luci.punti) metti(l)
    const ndin = n
    for (const l of luci.fuochi) metti(l)
    conti.luciPerVertice = n + (luci.cono ? 1 : 0)
    const s = luci.cono
    if (s && s.intensity > 0) {
      s.getWorldPosition(tmp)
      const t = s.target.getWorldPosition(new Vector3()).sub(tmp).negate().normalize()
      c.copy(s.color).multiplyScalar(s.intensity)
      scrivi(2, tmp.x, tmp.y, tmp.z, Math.cos(s.angle)); scrivi(3, t.x, t.y, t.z, Math.cos(s.angle * (1 - s.penumbra))); scrivi(4, c.r, c.g, c.b, s.distance)
    } else scrivi(4, 0, 0, 0, 1)
    scrivi(5, s ? s.decay : 1, n, ndin, 0)
    trama.needsUpdate = true
    if (nebbiaMesh) U.uPvT.value = nebbiaMesh.material.uniforms.uT.value
  }

  function convertiMateriale(m, o) {
    if (!m || fatte.has(m) || !(m.isMeshStandardMaterial)) return
    fatte.add(m)
    conti.materiali++
    const figura = !!(o.geometry && o.geometry.attributes.aRett)
    const chiaveVecchia = m.customProgramCacheKey()
    const vecchio = m.onBeforeCompile
    const r = Math.max(0.05, m.roughness ?? 1)
    const lucido = { value: Math.max(2, Math.min(128, 2 / (r ** 4 + 1e-4) - 2)) }
    const cotto = !!(cotta && o.geometry && o.geometry.attributes.aCotta)
    const rilievo = !normali && !figura && m.normalMap && m.map ? { value: m.normalMap } : null
    const doppio = m.side === 2
    if (!normali && !figura) { m.normalMap = null; m.roughnessMap = null }
    m.onBeforeCompile = (sh, renderer) => {
      if (vecchio) vecchio.call(m, sh, renderer)
      Object.assign(sh.uniforms, U, { uPvLucido: lucido }, rilievo ? { uPvRilievo: rilievo } : {})
      const def = (rilievo ? '#define PV_RILIEVO\nuniform sampler2D uPvRilievo;\n' : '') + (cotto ? '#define PV_COTTA\n' : '') + (doppio ? '#define PV_DOPPIO\n' : '') + (nebbia && nebbiaMesh ? '#define PV_NEBBIA\n' : '')
      sh.vertexShader = def + PARS_V + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n' + CALCOLO_V)
      sh.fragmentShader = def + 'varying vec3 vPvD; varying vec3 vPvS;\n' + (nebbia && nebbiaMesh ? 'varying vec3 vPvNeb;\n' : '') + sh.fragmentShader
        .replace('#include <map_fragment>', RILIEVO_F)
        .replace('#include <lights_fragment_begin>', INIZIO_F)
        .replace('#include <lights_fragment_maps>', '')
        .replace('#include <lights_fragment_end>', FINE_F)
    }
    m.customProgramCacheKey = () => chiaveVecchia + '|pv' + (rilievo ? 'r' : '') + (cotto ? 'c' : '') + (doppio ? 'd' : '') + (nebbia ? 'n' : '')
    m.needsUpdate = true
  }

  // pavimento (un quadrato per cella, tutto a quota zero) e muri (l'attributo `aCella`): suddivisi perché la luce per vertice sia liscia
  function suddividiTerreno() {
    scena.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || o.userData.pvDiviso || !o.geometry.attributes.position) return
      const g = o.geometry, p = g.attributes.position
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      if (!mats.some(m => m && m.isMeshStandardMaterial)) return
      const muro = !!g.attributes.aCella
      if (!g.boundingBox) g.computeBoundingBox()
      const piatto = !muro && g.boundingBox.max.y - g.boundingBox.min.y < 1e-4 && p.count > 64 && !!(mats[0].map)
      if (!muro && !piatto) return
      const prima = (g.index ? g.index.count : p.count) / 3
      let n = dividi(g, 4)
      if (n && piatto) n = dividi(n, 4)
      if (!n) return
      o.geometry = n; o.userData.pvDiviso = true
      conti.suddivise++; conti.triangoliPrima += prima; conti.triangoliDopo += (n.index ? n.index.count : n.attributes.position.count) / 3
    })
  }

  return {
    U, conti,
    ha: m => fatte.has(m),
    get nebbia() { return nebbiaMesh },
    /** Da chiamare quando il piano c'è (e poi ogni tanto: gli effetti nascono dopo). */
    converti() {
      if (!luci) {
        raccogli()
        // la nebbia del gioco: se ne prende la tinta, poi si nasconde (la sostituisce il termine per vertice)
        scena.traverse(o => { if (o.isMesh && o.material && o.material.uniforms && o.material.uniforms.uDens) nebbiaMesh = o })
        if (nebbiaMesh) {
          const u = nebbiaMesh.material.uniforms
          U.uPvDens.value = u.uDens.value; U.uPvTinta.value.copy(u.uTinta.value)
          if (nebbia) nebbiaMesh.visible = false
        }
        if (suddividi) suddividiTerreno()
        if (cotta) cuociTerreno(scena, cotta.fuochi(), cotta.muro)
        const prima = scena.onBeforeRender
        scena.onBeforeRender = (...a) => { aggiornaUniform(); if (prima) prima.apply(scena, a) }
      }
      scena.traverse(o => {
        if (!o.isMesh || !o.material) return
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) convertiMateriale(m, o)
      })
    },
  }
}

/**
 * La luce cotta: per ogni vertice di pavimento e muri (già suddivisi) l'attributo `aCotta` = (chiarore dei fuochi, penombra).
 * `fuochi`: [{ pos: Vector3, colore: Color, forza, raggio }]; `muro(x, z)`: se in quel punto del pavimento c'è un muro.
 */
export function cuociTerreno(scena, fuochi, muro) {
  scena.traverse(o => {
    if (!o.isMesh || !o.userData.pvDiviso || o.geometry.attributes.aCotta) return
    const g = o.geometry, p = g.attributes.position, nr = g.attributes.normal, n = p.count
    const a = new Float32Array(n * 4), muri = !!g.attributes.aCella
    for (let i = 0; i < n; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
      const nx = nr ? nr.getX(i) : 0, ny = nr ? nr.getY(i) : 1, nz = nr ? nr.getZ(i) : 0
      let r = 0, gg = 0, b = 0
      for (const f of fuochi) {
        let lx = f.pos.x - x, ly = f.pos.y - y, lz = f.pos.z - z
        const d = Math.hypot(lx, ly, lz) || 1e-4; lx /= d; ly /= d; lz /= d
        const nl = Math.max(0, nx * lx + ny * ly + nz * lz)
        const q = d / f.raggio, att = (1 / Math.max(d ** 1.7, 0.01)) * Math.max(0, 1 - q ** 4) ** 2
        const k = f.forza * att * nl
        r += f.colore.r * k; gg += f.colore.g * k; b += f.colore.b * k
      }
      let ao = 1
      if (muri) ao = 0.5 + 0.5 * Math.min(1, y / 0.8)        // il piede del muro più scuro
      else {
        let pieni = 0
        for (let k = 0; k < 8; k++) { const t = k * Math.PI / 4; if (muro(x + Math.cos(t) * 0.55, z + Math.sin(t) * 0.55)) pieni++ }
        ao = 1 - 0.45 * pieni / 8                              // gli angoli e i piedi dei muri, sul pavimento
      }
      a[i * 4] = r; a[i * 4 + 1] = gg; a[i * 4 + 2] = b; a[i * 4 + 3] = ao
    }
    g.setAttribute('aCotta', new BufferAttribute(a, 4))
  })
}

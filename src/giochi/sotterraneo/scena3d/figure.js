// Le figure dell'atlante come cartelli in piedi, tutte in UN InstancedMesh (una chiamata per tutte: mostri, roba, arredo,
// porte, scale): ogni istanza porta il suo ritaglio dell'atlante (`aRett`, specchiato con la larghezza negativa), il suo lampo
// (`aLampo`: il bianco del colpo, il rosso della ferita, il verde della cura) e la sua trasparenza (`aAlfa`, retinata: chi muore
// svanisce). La normal map finta (trame.js, `normaliAtlante`) le fa prendere la luce di lato; un minimo di colore e un contorno
// caldo le staccano dal fondo. Si riempie a ogni fotogramma (`inizia`, `metti`, `chiudi`): niente si alloca.
import { InstancedMesh, InstancedBufferAttribute, PlaneGeometry, MeshStandardMaterial, MeshDepthMaterial, RGBADepthPacking,
         DoubleSide, Matrix4, Vector3, Vector2, Quaternion, Euler, Color } from 'three'
import { conMaschera } from './maschera.js'
import { LUCE, ALLUNGA, PIXEL_CELLA } from './costanti.js'
import { verso } from './tempo.js'

const VERTICE = /* glsl */`
#ifdef USE_MAP
  vMapUv = aRett.xy + uv * aRett.zw;
#endif
#ifdef USE_NORMALMAP
  vNormalMapUv = aRett.xy + uv * aRett.zw;
#endif
`
const ATTRIBUTI = 'attribute vec4 aRett;\nattribute vec3 aLampo;\nattribute float aAlfa;\nvarying vec3 vLampo;\nvarying float vAlfa;\n'
const RETINA = /* glsl */`
  if (vAlfa < 0.999) { float rA = fract(52.9829189 * fract(dot(floor(gl_FragCoord.xy), vec2(0.06711056, 0.00583715)))); if (rA > vAlfa) discard; }
`

// Il contorno (sopra, nel mondo di sopra: docs/sotterraneo/grafica-3d.md, «Le figure ancorate»): il cartello si allarga di un
// pixel per lato e il pixel trasparente accanto a uno pieno diventa scuro; la luce di taglio viene dal lato del sole
const CONTORNO = /* glsl */`
  vec2 tMin = min(vRettA.xy, vRettA.xy + vRettA.zw) + uTexel, tMax = max(vRettA.xy, vRettA.xy + vRettA.zw) - uTexel;
  float dentroC = step(tMin.x, vMapUv.x) * step(vMapUv.x, tMax.x) * step(tMin.y, vMapUv.y) * step(vMapUv.y, tMax.y);
  vec4 sampledDiffuseColor = texture2D(map, clamp(vMapUv, tMin, tMax));
  sampledDiffuseColor.a *= dentroC;
  if (sampledDiffuseColor.a < 0.5) {
    float vicini = 0.0;
    for (int i = 0; i < 4; i++) {
      vec2 d = i == 0 ? vec2(uTexel.x, 0.0) : i == 1 ? vec2(-uTexel.x, 0.0) : i == 2 ? vec2(0.0, uTexel.y) : vec2(0.0, -uTexel.y);
      vec2 q = vMapUv + d;
      float qd = step(tMin.x, q.x) * step(q.x, tMax.x) * step(tMin.y, q.y) * step(q.y, tMax.y);
      vicini = max(vicini, texture2D(map, clamp(q, tMin, tMax)).a * qd);
    }
    if (vicini > 0.5) sampledDiffuseColor = vec4(0.06, 0.045, 0.04, 1.0);
  }
  diffuseColor *= sampledDiffuseColor;
`
const TAGLIO = /* glsl */`
  outgoingLight += vec3(1.0, 0.92, 0.78) * pow(1.0 - clamp(abs(normal.z), 0.0, 1.0), 1.2) * max(0.0, dot(normalize(normal.xy + 1e-4), uSoleVista)) * uTaglio * diffuseColor.rgb;
`

// `pezzi`: nome → [x, y, w, h] nell'atlante (dati/atlante.js, PEZZI); `ombra`: se fanno ombra (l'eroe no: la torcia è sua);
// `contorno`: il filo scuro attorno e la luce di taglio (le figure ancorate del mondo di sopra)
export function creaFigure(scena, { tex, norm, larga, alta, pezzi, maschera, max, ombra = true, contorno = false }) {
  const geo = new PlaneGeometry(1, 1).translate(0, 0.5, 0)
  // il contorno e il minimo di luce: uniform, perché nello scontro cambiano senza ricompilare (`nitido`)
  const nitidezza = { uMinimoF: { value: LUCE.minimoFigure }, uRimF: { value: LUCE.rim } }
  let n0 = 0
  const rett = new Float32Array(max * 4), lampo = new Float32Array(max * 3), alfa = new Float32Array(max).fill(1)
  geo.setAttribute('aRett', new InstancedBufferAttribute(rett, 4))
  geo.setAttribute('aLampo', new InstancedBufferAttribute(lampo, 3))
  geo.setAttribute('aAlfa', new InstancedBufferAttribute(alfa, 1))
  const mat = conMaschera(new MeshStandardMaterial({
    map: tex, normalMap: norm, alphaTest: 0.5, side: DoubleSide, roughness: 0.75, metalness: 0,
  }), maschera, {
    spinta: 0, chiave: contorno ? 'figure-contorno' : 'figure',
    // né troppo buie né bruciate: fra il minimo e 1,3 volte il loro colore (il lampo del colpo, emissivo, resta sopra)
    prima: `
      outgoingLight = clamp(outgoingLight - totalEmissiveRadiance, diffuseColor.rgb * uMinimoF, diffuseColor.rgb * 1.3) + totalEmissiveRadiance;
      outgoingLight += vec3(1.0, 0.82, 0.6) * pow(1.0 - clamp(abs(normal.z), 0.0, 1.0), 1.5) * uRimF * (0.4 + diffuseColor.rgb);${contorno ? TAGLIO : ''}`,
    poi(sh) {
      Object.assign(sh.uniforms, nitidezza)
      sh.fragmentShader = 'uniform float uMinimoF; uniform float uRimF;\n' + sh.fragmentShader
      sh.vertexShader = ATTRIBUTI + (contorno ? 'varying vec4 vRettA;\n' : '') + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n' + VERTICE + 'vLampo = aLampo; vAlfa = aAlfa;' + (contorno ? ' vRettA = aRett;' : ''))
      if (contorno) {
        Object.assign(sh.uniforms, U_CONTORNO)
        sh.fragmentShader = 'varying vec4 vRettA;\nuniform vec2 uTexel;\nuniform vec2 uSoleVista;\nuniform float uTaglio;\n' + sh.fragmentShader.replace('#include <map_fragment>', CONTORNO)
      }
      sh.fragmentShader = 'varying vec3 vLampo;\nvarying float vAlfa;\n' + sh.fragmentShader
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + RETINA)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vLampo * diffuseColor.rgb;')
    },
  })
  const U_CONTORNO = { uTexel: { value: new Vector2(1 / larga, 1 / alta) }, uSoleVista: { value: new Vector2(-0.7, 0.7) }, uTaglio: { value: 0.9 } }
  const mesh = new InstancedMesh(geo, mat, max)
  mesh.count = 0
  mesh.frustumCulled = false
  mesh.castShadow = ombra
  if (ombra) {
    // l'ombra del cono vede la sagoma vera, non il quadrato: la stessa scelta del ritaglio nel materiale dell'ombra
    const prof = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, map: tex, alphaTest: 0.5, side: DoubleSide })
    prof.onBeforeCompile = sh => {
      sh.vertexShader = 'attribute vec4 aRett;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n' + VERTICE)
    }
    prof.customProgramCacheKey = () => 'figure-ombra'
    mesh.customDepthMaterial = prof
  }
  scena.add(mesh)

  const chi = new Array(max).fill(null)   // istanza → la cosa del motore che disegna (per il dito), o null
  const m = new Matrix4(), pos = new Vector3(), q = new Quaternion(), e = new Euler(), sc = new Vector3(), c = new Color()
  let n = 0
  const sale = (a, k) => { a.clearUpdateRanges(); a.addUpdateRange(0, n * k); a.needsUpdate = true }
  // le scelte di una figura, in un oggetto solo riusato (niente allocato a fotogramma): `o()` lo rimette com'era
  const O = { scala: 1, specchio: false, rosso: 0, verde: 0, blu: 0, bianco: 0, trasparenza: 1, cosa: null, giro: 0, schiaccia: 1 }
  return {
    mesh, chi,
    o() { O.scala = 1; O.specchio = false; O.rosso = O.verde = O.blu = O.bianco = 0; O.trasparenza = 1; O.cosa = null; O.giro = 0; O.schiaccia = 1; return O },
    get quante() { return n },
    // da vicino (lo scontro, `quanto` 1) la normal map finta e il contorno caldo quasi spenti, il colore più pieno: lo sprite
    // resta come è disegnato. Ci si va in un terzo di secondo
    nitido(quanto, dt) {
      n0 += (quanto - n0) * verso(dt, 3)
      const q = LUCE.nitidoScontro
      nitidezza.uRimF.value = LUCE.rim + (q.rim - LUCE.rim) * n0
      nitidezza.uMinimoF.value = LUCE.minimoFigure + (q.minimo - LUCE.minimoFigure) * n0
      const r = 1 + (q.rilievo - 1) * n0
      mat.normalScale.set(r, r)
    },
    inizia() { n = 0 },
    // posa il pezzo `nome` coi piedi in (x, y, z). Torna l'indice dell'istanza, o -1 se il pezzo non c'è
    metti(nome, x, y, z, opz = this.o()) {
      const { scala, specchio, rosso, verde, blu, bianco, trasparenza, cosa, giro, schiaccia } = opz
      const p = pezzi[nome]
      if (!p || n >= max) return -1
      let [px, py, pw, ph] = p
      // col contorno il cartello prende un pixel in più per lato (il filo sta lì)
      if (contorno) { px -= 1; py -= 1; pw += 2; ph += 2 }
      const u0 = (px + 0.01) / larga, u1 = (px + pw - 0.01) / larga
      const k = n * 4
      rett[k] = specchio ? u1 : u0; rett[k + 2] = specchio ? u0 - u1 : u1 - u0
      rett[k + 1] = 1 - (py + ph - 0.01) / alta; rett[k + 3] = (ph - 0.02) / alta
      lampo[n * 3] = bianco + rosso; lampo[n * 3 + 1] = bianco + verde; lampo[n * 3 + 2] = bianco + blu
      alfa[n] = trasparenza
      pos.set(x, contorno ? y - ALLUNGA * scala * schiaccia / PIXEL_CELLA : y, z)
      q.setFromEuler(e.set(0, giro, 0))
      sc.set(pw / PIXEL_CELLA * scala, ph / PIXEL_CELLA * ALLUNGA * scala * schiaccia, 1)
      mesh.setMatrixAt(n, m.compose(pos, q, sc))
      chi[n] = cosa
      return n++
    },
    // l'altezza a schermo di un pezzo (in celle, coi piedi a terra): serve a mettere sopra la testa nomi e barre
    alto(nome, scala = 1) { const p = pezzi[nome]; return p ? p[3] / PIXEL_CELLA * ALLUNGA * scala : 1 },
    largo(nome, scala = 1) { const p = pezzi[nome]; return p ? p[2] / PIXEL_CELLA * scala : 1 },
    // in GPU va solo la parte usata (`n` istanze delle `max`): senza, a ogni fotogramma partivano 70 kB anche per trenta figure
    chiudi() {
      mesh.count = n
      if (!n) return
      sale(mesh.instanceMatrix, 16); sale(geo.attributes.aRett, 4); sale(geo.attributes.aLampo, 3); sale(geo.attributes.aAlfa, 1)
    },
    // il dito: quale istanza sta sotto il raggio (la cosa che disegna), o null
    trova(raggio) {
      if (!n) return null
      mesh.computeBoundingSphere()
      const colpi = raggio.intersectObject(mesh, false)
      for (const h of colpi) if (h.instanceId != null && chi[h.instanceId]) return chi[h.instanceId]
      return null
    },
    colore: c,
    // la luce di taglio: il verso del sole nello spazio della telecamera (x, y), e quanta
    taglio(x, y, quanta = 0.9) { U_CONTORNO.uSoleVista.value.set(x, y).normalize(); U_CONTORNO.uTaglio.value = quanta },
    via() { scena.remove(mesh); geo.dispose(); mat.dispose(); if (mesh.customDepthMaterial) mesh.customDepthMaterial.dispose() },
  }
}

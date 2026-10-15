// Le figure dell'atlante come cartelli in piedi, tutte in UN InstancedMesh (una chiamata per tutte: mostri, roba, arredo,
// porte, scale): ogni istanza porta il suo ritaglio dell'atlante (`aRett`, specchiato con la larghezza negativa), il suo lampo
// (`aLampo`: il bianco del colpo, il rosso della ferita, il verde della cura) e la sua trasparenza (`aAlfa`, retinata: chi muore
// svanisce). La normal map finta (trame.js, `normaliAtlante`) le fa prendere la luce di lato; un minimo di colore e un contorno
// caldo le staccano dal fondo. Si riempie a ogni fotogramma (`inizia`, `metti`, `chiudi`): niente si alloca.
import { InstancedMesh, InstancedBufferAttribute, PlaneGeometry, MeshStandardMaterial, MeshDepthMaterial, RGBADepthPacking,
         DoubleSide, Matrix4, Vector3, Quaternion, Euler, Color } from 'three'
import { conMaschera } from './maschera.js'
import { LUCE, ALLUNGA, PIXEL_CELLA } from './costanti.js'

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

// `pezzi`: nome → [x, y, w, h] nell'atlante (dati/atlante.js, PEZZI); `ombra`: se fanno ombra (l'eroe no: la torcia è sua)
export function creaFigure(scena, { tex, norm, larga, alta, pezzi, maschera, max, ombra = true }) {
  const geo = new PlaneGeometry(1, 1).translate(0, 0.5, 0)
  const rett = new Float32Array(max * 4), lampo = new Float32Array(max * 3), alfa = new Float32Array(max).fill(1)
  geo.setAttribute('aRett', new InstancedBufferAttribute(rett, 4))
  geo.setAttribute('aLampo', new InstancedBufferAttribute(lampo, 3))
  geo.setAttribute('aAlfa', new InstancedBufferAttribute(alfa, 1))
  const mat = conMaschera(new MeshStandardMaterial({
    map: tex, normalMap: norm, alphaTest: 0.5, side: DoubleSide, roughness: 0.75, metalness: 0,
  }), maschera, {
    spinta: 0, chiave: 'figure',
    // né troppo buie né bruciate: fra il minimo e 1,3 volte il loro colore (il lampo del colpo, emissivo, resta sopra)
    prima: `
      outgoingLight = clamp(outgoingLight - totalEmissiveRadiance, diffuseColor.rgb * ${LUCE.minimoFigure.toFixed(2)}, diffuseColor.rgb * 1.3) + totalEmissiveRadiance;
      outgoingLight += vec3(1.0, 0.82, 0.6) * pow(1.0 - clamp(abs(normal.z), 0.0, 1.0), 1.5) * ${LUCE.rim.toFixed(2)} * (0.4 + diffuseColor.rgb);`,
    poi(sh) {
      sh.vertexShader = ATTRIBUTI + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n' + VERTICE + 'vLampo = aLampo; vAlfa = aAlfa;')
      sh.fragmentShader = 'varying vec3 vLampo;\nvarying float vAlfa;\n' + sh.fragmentShader
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + RETINA)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vLampo * diffuseColor.rgb;')
    },
  })
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
  // le scelte di una figura, in un oggetto solo riusato (niente allocato a fotogramma): `o()` lo rimette com'era
  const O = { scala: 1, specchio: false, rosso: 0, verde: 0, blu: 0, bianco: 0, trasparenza: 1, cosa: null, giro: 0, schiaccia: 1 }
  return {
    mesh, chi,
    o() { O.scala = 1; O.specchio = false; O.rosso = O.verde = O.blu = O.bianco = 0; O.trasparenza = 1; O.cosa = null; O.giro = 0; O.schiaccia = 1; return O },
    get quante() { return n },
    inizia() { n = 0 },
    // posa il pezzo `nome` coi piedi in (x, y, z). Torna l'indice dell'istanza, o -1 se il pezzo non c'è
    metti(nome, x, y, z, opz = this.o()) {
      const { scala, specchio, rosso, verde, blu, bianco, trasparenza, cosa, giro, schiaccia } = opz
      const p = pezzi[nome]
      if (!p || n >= max) return -1
      const [px, py, pw, ph] = p
      const u0 = (px + 0.01) / larga, u1 = (px + pw - 0.01) / larga
      const k = n * 4
      rett[k] = specchio ? u1 : u0; rett[k + 2] = specchio ? u0 - u1 : u1 - u0
      rett[k + 1] = 1 - (py + ph - 0.01) / alta; rett[k + 3] = (ph - 0.02) / alta
      lampo[n * 3] = bianco + rosso; lampo[n * 3 + 1] = bianco + verde; lampo[n * 3 + 2] = bianco + blu
      alfa[n] = trasparenza
      pos.set(x, y, z)
      q.setFromEuler(e.set(0, giro, 0))
      sc.set(pw / PIXEL_CELLA * scala, ph / PIXEL_CELLA * ALLUNGA * scala * schiaccia, 1)
      mesh.setMatrixAt(n, m.compose(pos, q, sc))
      chi[n] = cosa
      return n++
    },
    // l'altezza a schermo di un pezzo (in celle, coi piedi a terra): serve a mettere sopra la testa nomi e barre
    alto(nome, scala = 1) { const p = pezzi[nome]; return p ? p[3] / PIXEL_CELLA * ALLUNGA * scala : 1 },
    largo(nome, scala = 1) { const p = pezzi[nome]; return p ? p[2] / PIXEL_CELLA * scala : 1 },
    chiudi() {
      mesh.count = n
      mesh.instanceMatrix.needsUpdate = true
      geo.attributes.aRett.needsUpdate = true; geo.attributes.aLampo.needsUpdate = true; geo.attributes.aAlfa.needsUpdate = true
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
    via() { scena.remove(mesh); geo.dispose(); mat.dispose(); if (mesh.customDepthMaterial) mesh.customDepthMaterial.dispose() },
  }
}

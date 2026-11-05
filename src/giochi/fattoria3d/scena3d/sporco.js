// Lo sporco sul corpo di un animale: i colori nei vertici virano al fango a gradini, prima le zampe, poi la pancia, poi qualche macchia sul dorso. Ogni vertice
// ha la sua soglia (`aSporco`, fissata una volta dal corpo fermo); il livello è un numero per animale, quindi il dito che strofina lo fa sparire dal vivo.
// Vedi docs/fattoria3d/cura-sul-prato.md.
import * as THREE from 'three'

// Il fango si vede sul pelo chiaro se è scuro e sul pelo scuro se è chiaro: un mantello nero (Sherlock, Golia, Pepe) con fango bruno scuro non cambiava. Si sceglie sulla luminosità del colore sotto.
const FANGO_SCURO = 'vec3(0.085, 0.052, 0.026)'
const FANGO_CHIARO = 'vec3(0.2, 0.135, 0.08)'

/** Rumore a macchie, da 0 a 1: stesso punto, stesso valore. */
const macchia = (x, y, z) => {
  const larga = Math.sin(x * 17 + y * 5) + Math.sin(y * 15 - z * 11) + Math.sin(z * 19 + x * 9)
  const fitta = Math.sin(x * 37 + z * 23) + Math.sin(y * 41 + x * 13)
  return (larga / 3 * 0.65 + fitta / 2 * 0.35) * 0.5 + 0.5
}

/** La soglia di ogni vertice: bassa in basso, alta sul dorso, mossa dalle macchie. `m`: dal pezzo al corpo fermo; `alto`: l'altezza dell'animale. */
function soglie (geo, m, alto) {
  if (geo.attributes.aSporco) return
  const p = geo.attributes.position, v = new THREE.Vector3(), a = new Float32Array(p.count)
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).applyMatrix4(m)
    a[i] = 0.1 + 1.2 * Math.max(0, v.y / alto) + (macchia(v.x, v.y, v.z) - 0.5) * 1.5
  }
  geo.setAttribute('aSporco', new THREE.BufferAttribute(a, 1))
}

function materialeSporco (base, u) {
  const m = base.clone()
  m.onBeforeCompile = s => {
    s.uniforms.uSporco = u
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute float aSporco;\nuniform float uSporco;')
      .replace('#include <color_vertex>', `#include <color_vertex>\nfloat luce = dot(vColor.rgb, vec3(0.2126, 0.7152, 0.0722));\nvColor.rgb = mix(vColor.rgb, mix(${FANGO_CHIARO}, ${FANGO_SCURO}, smoothstep(0.03, 0.2, luce)), smoothstep(aSporco - 0.05, aSporco + 0.05, uSporco) * 0.85);`)
  }
  m.customProgramCacheKey = () => 'sporco'
  return m
}

/** Prepara un animale appena nato (fermo, a dritto): i pezzi coi colori nei vertici si sporcano, la faccia e gli occhi no. */
export function preparaSporco (g) {
  const u = { value: 0 }, copie = new Map(), inv = new THREE.Matrix4()
  g.updateMatrixWorld(true); inv.copy(g.matrixWorld).invert()
  g.traverse(o => { if (o.isSkinnedMesh) o.geometry.computeBoundingBox?.() })
  const alto = new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3()).y || 1
  g.traverse(o => {
    if (!o.isMesh || !o.geometry.attributes.color || Array.isArray(o.material) || !o.material.vertexColors) return
    if (!copie.has(o.material)) copie.set(o.material, materialeSporco(o.material, u))
    o.material = copie.get(o.material)
    o.userData.riposo = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)
    o.userData.alto = alto
    soglie(o.geometry, o.userData.riposo, alto)
  })
  g.userData.sporco = u
}
/** Il dettaglio è cambiato: la geometria nuova vuole le sue soglie. */
export function sporcaGeometria (o) { if (o.userData.riposo) soglie(o.geometry, o.userData.riposo, o.userData.alto) }
/** Quanto è sporco adesso, da 0 a 1. */
export function impostaSporco (g, v) { if (g.userData.sporco) g.userData.sporco.value = v * 1.15 }

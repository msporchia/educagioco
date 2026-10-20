// Ritocchi di peso che valgono per ogni modello, senza toccarne il disegno: un pezzo piccolo non proietta ombra (maniglie, fiori,
// chiodi, bulloni: nell'ombra non si vedono, ma ognuno è una draw call in più nella passata dell'ombra). Si chiama una volta, appena
// il modello è creato (pezzi.js, compagni.js, eroe.js). Vedi docs/fattoria3d/scena.md, «Qualità e peso».
import * as THREE from 'three'

export const OMBRA_MIN = 0.35         // il raggio, in unità del mondo, sotto cui una mesh non proietta ombra

const _sfera = new THREE.Sphere()

/** Spegne `castShadow` alle mesh il cui raggio (nel mondo, con la scala del gruppo com'è adesso; per le istanze, quello di una sola
    istanza) sta sotto `soglia`: i fili di grano di un campo sono diciassette draw call per campo, e la loro ombra non si vede da lassù.
    Torna quante ne ha spente. */
export function alleggeriOmbre(grp, soglia = OMBRA_MIN) {
  grp.updateMatrixWorld(true)
  let spente = 0
  grp.traverse(o => {
    if (!o.isMesh || !o.castShadow || !o.geometry) return
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere()
    _sfera.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld)
    if (_sfera.radius < soglia) { o.castShadow = false; spente++ }
  })
  return spente
}

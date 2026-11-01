// La torcia appesa da prendere (docs/sotterraneo/luce.md, «Le torce appese»): il modello della torcia dello zaino (roba3d.js, la versione
// semplice) infilato nella staffa del muro, una mesh istanziata per tutte quelle del piano. La fiamma e la luce sono quelle della riserva
// dei fuochi (piano.js), nessuna luce in più; presa, il modello se ne va e resta la staffa vuota.
import { InstancedMesh, Matrix4, Quaternion, Euler, Vector3, Box3, MeshStandardMaterial } from 'three'
import { creaPezzo, appiattisci } from './roba3d.js'
import { consumabile3dDi } from './anteprime3d-pura.js'
import { conMaschera } from './maschera.js'

const LUNGA = 0.95       // in celle: quanto è lunga la torcia sul muro (la staffa è alta 0.32): più grande di quella per terra, la si guarda da lontano
const PIEGA = 0.45        // la testa si sporge verso la stanza, come le fiamme dei fuochi a muro
const STORTA = 0.6        // e di lato: la telecamera guarda dall'alto, e una torcia dritta sul muro da lassù è un puntino
const CENTRO_Y = 0.6      // a metà manico: la testa arriva all'altezza della fiamma (0.84)

let stampo = null   // la geometria della torcia, centrata e a misura: una volta sola, per tutti i piani
function geometriaDellaTorcia() {
  if (stampo) return stampo
  const g = appiattisci(creaPezzo(consumabile3dDi('torcia'), { alone: false, semplice: true }))
  let mesh = null
  g.updateMatrixWorld(true)
  g.traverse(o => { if (!mesh && o.isMesh) mesh = o })
  if (!mesh) return null
  const geo = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld)
  const box = new Box3().setFromBufferAttribute(geo.attributes.position), dim = new Vector3(), c = new Vector3()
  box.getSize(dim); box.getCenter(c)
  geo.translate(-c.x, -c.y, -c.z)
  const k = LUNGA / Math.max(dim.x, dim.y, dim.z, 1e-3)
  geo.scale(k, k, k)
  stampo = geo
  return stampo
}

/** `torce`: quelle del piano (motore/torce-a-muro.js), `facce`: dove sta la faccia vera del muro per ognuna (terreno.js). */
export function creaTorceAppese(scena, { torce, facce, maschera }) {
  const qui = torce.map((t, i) => (t.prendi ? i : -1)).filter(i => i >= 0)
  const nulla = { posa() {}, via() {} }
  if (!qui.length) return nulla
  let geo = null
  try { geo = geometriaDellaTorcia() } catch (e) { geo = null }
  if (!geo) return nulla
  // più scura della roba per terra: la luce del fuoco le sta addosso (piano.js, a una spanna dalla testa) e la sbiancherebbe
  const mat = conMaschera(new MeshStandardMaterial({ vertexColors: true, color: 0x4a4a4a, roughness: 0.9, metalness: 0 }), maschera, { buco: true, chiave: 'torcia-appesa' })
  const mesh = new InstancedMesh(geo, mat, qui.length)
  const posto = new Map(qui.map((i, j) => [i, j]))
  const m = new Matrix4(), q = new Quaternion().setFromEuler(new Euler(PIEGA, 0, STORTA)), s = new Vector3(1, 1, 1), zero = new Vector3(0, 0, 0), p = new Vector3()
  const posa = (i, su) => {
    const j = posto.get(i)
    if (j == null) return
    const f = facce[i]
    m.compose(p.set(f.x, CENTRO_Y, f.z + 0.2), q, su ? s : zero)
    mesh.setMatrixAt(j, m)
    mesh.instanceMatrix.needsUpdate = true
  }
  for (const i of qui) posa(i, true)
  mesh.castShadow = true
  mesh.computeBoundingSphere()
  mesh.userData.elemento3d = 'arredo'
  scena.add(mesh)
  return {
    posa,
    via() { scena.remove(mesh); mesh.dispose(); mat.dispose() },
  }
}

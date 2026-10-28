// Le cose ferme del piano fuse (la bassa, `ACCESI.arredoFuso`; docs/sotterraneo/prestazioni-3d-bassa.md, «L'arredo fuso»): colonne, arredo
// e relitti erano un InstancedMesh per tipo, una chiamata ciascuno. Qui diventano una mesh per elemento, col colore del materiale nei
// vertici e un gruppo per materiale «uguale a meno del colore»; i blocchi fuori inquadratura li toglie il ritaglio, come al pavimento.
// Si fa a piano finito e prima del primo disegno (indice.js: entrando non si disegna), così i programmi nascono già col colore nei vertici.
import { BufferGeometry, BufferAttribute, Mesh, Matrix4, Matrix3, Vector3 } from 'three'
import { creaRitaglio } from './ritaglio.js'
import { segna } from '../../../grafica/elementi3d.js'

// quello che cambia il programma o la luce, tranne il colore: due materiali così si disegnano in una chiamata
const firma = m => [m.customProgramCacheKey ? m.customProgramCacheKey() : '', m.roughness, m.metalness, m.side, m.flatShading,
  m.emissive.getHexString(), m.emissiveIntensity, m.transparent, m.opacity].join('|')
// si fonde solo un InstancedMesh fermo coi materiali Standard senza trama (la bassa le ha già tolte: maschera.js)
const fondibile = o => o.isInstancedMesh && o.visible && o.count > 0 && o.geometry.attributes.normal &&
  (Array.isArray(o.material) ? o.material : [o.material]).every(m => m.isMeshStandardMaterial && !m.map && !m.vertexColors)

/**
 * `mesh`: gli InstancedMesh fermi del piano (già nella scena, col loro `userData.elemento3d`), `W`×`H` le celle. Quelli fondibili escono
 * dalla scena (chi li ha fatti li butta come sempre, e coi loro i materiali, che qui si riusano) e al loro posto entra una mesh per
 * elemento. → { mesh, ritaglia(camera), chiamate: i gruppi, via() }
 */
export function fondiFermi(scena, mesh, W, H) {
  const perElemento = new Map()
  for (const o of mesh) {
    if (!o || !fondibile(o) || o.parent !== scena) continue
    const e = o.userData.elemento3d || 'arredo'
    if (!perElemento.has(e)) perElemento.set(e, [])
    perElemento.get(e).push(o)
  }
  const fusi = [], ritagli = []
  const mi = new Matrix4(), mw = new Matrix4(), nm = new Matrix3(), v = new Vector3()
  for (const [elemento, lista] of perElemento) {
    const gruppi = new Map()   // firma → { mat, idx: [] }
    const pos = [], nor = [], col = []
    let alto = 0, ombra = false
    for (const o of lista) {
      o.updateMatrixWorld()
      const g = o.geometry, P = g.attributes.position, N = g.attributes.normal, n = P.count
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      const pezzi = Array.isArray(o.material) && g.groups.length ? g.groups : [{ start: 0, count: g.index ? g.index.count : n, materialIndex: 0 }]
      const indice = k => (g.index ? g.index.getX(k) : k)
      // il materiale di ogni vertice (i gruppi di una geometria fusa non si dividono i vertici)
      const diChi = new Int16Array(n).fill(-1)
      for (const p of pezzi) for (let k = p.start; k < p.start + p.count; k++) diChi[indice(k)] = p.materialIndex
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, mi)
        mw.multiplyMatrices(o.matrixWorld, mi)
        nm.getNormalMatrix(mw)
        const base = pos.length / 3
        for (let k = 0; k < n; k++) {
          v.fromBufferAttribute(P, k).applyMatrix4(mw); pos.push(v.x, v.y, v.z); alto = Math.max(alto, v.y)
          v.fromBufferAttribute(N, k).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z)
          const c = (mats[diChi[k]] || mats[0]).color
          col.push(c.r, c.g, c.b)
        }
        for (const p of pezzi) {
          const m = mats[p.materialIndex] || mats[0], f = firma(m)
          if (!gruppi.has(f)) gruppi.set(f, { mat: m, idx: [] })
          const idx = gruppi.get(f).idx
          for (let k = p.start; k < p.start + p.count; k++) idx.push(base + indice(k))
        }
      }
      ombra = ombra || o.castShadow
      scena.remove(o)
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
    geo.setAttribute('normal', new BufferAttribute(new Float32Array(nor), 3))
    geo.setAttribute('color', new BufferAttribute(new Float32Array(col), 3))
    const tutti = [], materiali = []
    for (const { mat, idx } of gruppi.values()) {
      geo.addGroup(tutti.length, idx.length, materiali.length)
      for (const k of idx) tutti.push(k)
      // il colore ora sta nei vertici (letto qui sopra, prima di cambiarlo)
      mat.vertexColors = true; mat.color.setRGB(1, 1, 1)
      materiali.push(mat)
    }
    geo.setIndex(new BufferAttribute(pos.length / 3 > 65535 ? new Uint32Array(tutti) : new Uint16Array(tutti), 1))
    geo.computeBoundingSphere()
    const fuso = segna(new Mesh(geo, materiali), elemento)
    fuso.castShadow = ombra; fuso.receiveShadow = true
    fuso.frustumCulled = false   // lo fa il ritaglio, a blocchi
    scena.add(fuso)
    fusi.push(fuso)
    ritagli.push(creaRitaglio(geo, W, H, alto))
  }
  return {
    mesh: fusi,
    get chiamate() { return fusi.reduce((n, o) => n + o.geometry.groups.length, 0) },
    ritaglia(camera) { for (const r of ritagli) r.aggiorna(camera) },
    via() { for (const o of fusi) { scena.remove(o); o.geometry.dispose() } },
  }
}

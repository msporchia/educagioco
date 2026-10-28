// I relitti disegnati in codice (dati/relitti.js, `disegno`: macerie, crollo, roccia, trave, stalagmite, carro, binari), in 3D:
// una forma per disegno, fatta una volta e istanziata, nei colori di pietra del suo scenario (TINTE_RELITTI). Quelli che hanno
// uno sprite (`pezzo`) li posa scena3d/cose.js come l'arredo. Fanno ombra, e la maschera li spegne come il resto.
import { DodecahedronGeometry, BoxGeometry, ConeGeometry, CylinderGeometry, InstancedMesh, MeshStandardMaterial, Matrix4, Vector3,
         Quaternion, Euler, Color } from 'three'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { TINTE_RELITTI } from '../dati/relitti.js'
import { conMaschera } from './maschera.js'
import { caso } from './rumore.js'

// un sasso: un dodecaedro ammaccato (sempre lo stesso per seme), con le normali morbide
function sasso(r, seme, dettaglio = 1) {
  const g = new DodecahedronGeometry(r, dettaglio)
  const rnd = caso(seme), p = g.attributes.position
  const visti = new Map()
  for (let i = 0; i < p.count; i++) {
    const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`
    if (!visti.has(k)) visti.set(k, 0.78 + rnd() * 0.4)
    const f = visti.get(k)
    p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * 0.8, p.getZ(i) * f)
  }
  g.deleteAttribute('uv'); g.deleteAttribute('normal')
  const liscio = mergeVertices(g)   // le normali morbide: un sasso a facce piatte è carta piegata (poc/sotterraneo-luce-pezzi.md)
  g.dispose()
  liscio.computeVertexNormals()
  return liscio
}
const mucchio = (n, seme, largo = 0.36, r = 0.16) => {
  const rnd = caso(seme), pezzi = []
  for (let i = 0; i < n; i++) pezzi.push(sasso(r * (0.6 + rnd() * 0.7), seme + i, 0).translate((rnd() - 0.5) * largo * 2, r * 0.5, (rnd() - 0.5) * largo * 2))
  return mergeGeometries(pezzi)
}
const senzaUv = g => { g.deleteAttribute('uv'); return g }

// le forme, in una cella (o due lungo x per i relitti lunghi: la scala le allunga)
const FORME = {
  macerie: () => mucchio(9, 3, 0.34, 0.14),
  crollo: () => mucchio(12, 7, 0.42, 0.2),
  roccia: () => sasso(0.42, 11).translate(0, 0.3, 0),
  stalagmite: () => mergeGeometries([senzaUv(new ConeGeometry(0.24, 1.0, 9).translate(0, 0.5, 0)), senzaUv(new ConeGeometry(0.14, 0.55, 7).translate(0.2, 0.27, 0.12))]),
  trave: () => senzaUv(new BoxGeometry(0.95, 0.16, 0.22).rotateZ(0.12).translate(0, 0.14, 0)),
  carro: () => mergeGeometries([senzaUv(new BoxGeometry(0.85, 0.32, 0.55).translate(0, 0.32, 0)),
    ...[-0.3, 0.3].flatMap(x => [-0.3, 0.3].map(z => senzaUv(new CylinderGeometry(0.15, 0.15, 0.06, 12).rotateX(Math.PI / 2).translate(x, 0.15, z))))]),
  binari: () => mergeGeometries([-0.22, 0.22].map(z => senzaUv(new BoxGeometry(0.98, 0.05, 0.05).translate(0, 0.05, z)))
    .concat([-0.35, 0, 0.35].map(x => senzaUv(new BoxGeometry(0.12, 0.03, 0.62).translate(x, 0.015, 0))))),
}

export function creaRelitti(scena, relitti, scenario, maschera) {
  const disegnati = relitti.filter(r => !r.pezzo && FORME[r.disegno])
  const tinte = TINTE_RELITTI[scenario] || TINTE_RELITTI.cantine
  const famiglie = new Map()
  for (const r of disegnati) { if (!famiglie.has(r.disegno)) famiglie.set(r.disegno, []); famiglie.get(r.disegno).push(r) }
  const mesh = [], geometrie = [], materiali = []
  const m = new Matrix4(), pos = new Vector3(), q = new Quaternion(), e = new Euler(), sc = new Vector3()
  for (const [nome, lista] of famiglie) {
    const g = FORME[nome]()
    const legno = nome === 'trave' || nome === 'carro', ferro = nome === 'binari'
    const mat = conMaschera(new MeshStandardMaterial({ color: new Color(legno ? tinte.legno : ferro ? tinte.ferro : tinte.medio), roughness: ferro ? 0.5 : 0.92, metalness: ferro ? 0.6 : 0, flatShading: false }), maschera, { chiave: 'relitto' })
    const im = new InstancedMesh(g, mat, lista.length)
    lista.forEach((r, i) => {
      const lungo = r.w > 1 || r.h > 1, inPiedi = r.h > r.w
      pos.set(r.x + r.w / 2, 0, r.y + r.h / 2)
      q.setFromEuler(e.set(0, inPiedi ? Math.PI / 2 : ((r.x * 7 + r.y * 3) % 5) * 0.2, 0))
      const s = lungo ? Math.max(r.w, r.h) : 1
      sc.set(s, 1, lungo ? 1.1 : 1)
      im.setMatrixAt(i, m.compose(pos, q, sc))
    })
    im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere()
    scena.add(im)
    mesh.push(im); geometrie.push(g); materiali.push(mat)
  }
  return { mesh, via() { for (const o of mesh) scena.remove(o); geometrie.forEach(g => g.dispose()); materiali.forEach(x => x.dispose()) } }
}

/* L'arredo fuso della bassa (scena3d/fondi.js, docs/sotterraneo/prestazioni-3d-bassa.md «L'arredo fuso»): gli InstancedMesh fermi diventano una
   mesh per elemento, un gruppo per materiale uguale a meno del colore, il colore nei vertici al posto giusto; quello che non si fonde
   (una trama, una mesh semplice) resta com'è. */
import { Scene, InstancedMesh, Mesh, BoxGeometry, MeshStandardMaterial, Matrix4, DataTexture } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { fondiFermi } from '../../src/giochi/sotterraneo/scena3d/fondi.js'
import { segna } from '../../src/grafica/elementi3d.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const scena = new Scene()
const tanti = (geo, mat, posti, el) => {
  const im = segna(new InstancedMesh(geo, mat, posti.length), el)
  posti.forEach(([x, z], i) => im.setMatrixAt(i, new Matrix4().makeTranslation(x, 0, z)))
  scena.add(im); return im
}
const rosso = new MeshStandardMaterial({ color: 0xff0000 }), blu = new MeshStandardMaterial({ color: 0x0000ff })
const lucido = new MeshStandardMaterial({ color: 0x00ff00, roughness: 0.3 })
const a = tanti(new BoxGeometry(), rosso, [[1, 1], [9, 9]], 'arredo')
const b = tanti(new BoxGeometry(), blu, [[3, 3]], 'arredo')
const c = tanti(new BoxGeometry(), lucido, [[5, 5]], 'arredo')
// una colonna a due materiali (fusto e basi), come terreno.js
const due = mergeGeometries([new BoxGeometry(), new BoxGeometry().translate(0, 1, 0)], true)
const col = tanti(due, [new MeshStandardMaterial({ color: 0xffff00 }), new MeshStandardMaterial({ color: 0x00ffff, roughness: 0.4 })], [[2, 6]], 'colonne')
const trama = new MeshStandardMaterial({ map: new DataTexture(new Uint8Array(4), 1, 1) })
const conTrama = tanti(new BoxGeometry(), trama, [[4, 4]], 'arredo')
const sola = segna(new Mesh(new BoxGeometry(), new MeshStandardMaterial()), 'arredo'); scena.add(sola)

const f = fondiFermi(scena, [a, b, c, col, conTrama, sola], 12, 12)
const [arredo, colonne] = f.mesh
uguale('una mesh per elemento', f.mesh.length, 2)
controlla('i fusi escono dalla scena, gli altri restano', !a.parent && !b.parent && !c.parent && !col.parent && conTrama.parent === scena && sola.parent === scena)
uguale('rosso e blu in un gruppo, il lucido nel suo', arredo.geometry.groups.length, 2)
uguale('la colonna: un gruppo per materiale', colonne.geometry.groups.length, 2)
controlla('l\'elemento resta', arredo.userData.elemento3d === 'arredo' && colonne.userData.elemento3d === 'colonne')
uguale('i vertici: una scatola per istanza', arredo.geometry.attributes.position.count, 4 * 24)
// il colore nei vertici: il primo vertice di ogni istanza, nell'ordine (rosso, rosso, blu, lucido)
const C = arredo.geometry.attributes.color, P = arredo.geometry.attributes.position
const colore = k => [C.getX(k * 24), C.getY(k * 24), C.getZ(k * 24)].map(x => Math.round(x)).join('')
uguale('i colori al posto giusto', [0, 1, 2, 3].map(colore).join(' '), '100 100 001 010')
controlla('la seconda istanza è spostata dove stava', Math.abs(P.getX(24) - 9) <= 0.5 && Math.abs(P.getZ(24) - 9) <= 0.5)
controlla('il materiale prende il colore dai vertici', rosso.vertexColors && rosso.color.getHex() === 0xffffff && arredo.material.length === 2)
const Cc = colonne.geometry.attributes.color
uguale('la colonna: fusto giallo, basi azzurre', [0, 24].map(k => [Cc.getX(k), Cc.getY(k), Cc.getZ(k)].map(Math.round).join('')).join(' '), '110 011')
f.ritaglia({ updateMatrixWorld() {}, projectionMatrix: new Matrix4(), matrixWorldInverse: new Matrix4() })
f.via()
controlla('via toglie i fusi', !arredo.parent && !colonne.parent)
riassunto('arredo fuso')

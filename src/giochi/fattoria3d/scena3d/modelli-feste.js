// I pezzi delle feste: le zucche di Halloween e il pupazzo di neve di Natale (si comprano solo in stagione, e comprati restano). Origine al centro dell'impronta, davanti
// verso +z come tutti i modelli; poche mesh (peso: docs/fattoria3d/scena.md «Qualità e peso»). Vedi docs/fattoria3d/stagioni.md.
import * as THREE from 'three'
import { mat } from './modelli.js'
import { fondiPerMateriale } from './fondi.js'
import { memoModello } from './cache-modelli.js'

function pronto (m) { m.castShadow = true; m.receiveShadow = true; return m }

/** Una zucca di raggio r in (x, z): spicchio schiacciato, picciolo e foglia; se `intagliata` ha occhi e bocca accesi sul davanti (+z). */
function zucca (g, r, x, z, intagliata, tinta = 0xe8741c) {
  const corpo = pronto(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 7), mat(tinta)))
  corpo.scale.set(1.12, 0.84, 1.12); corpo.position.set(x, r * 0.84, z); g.add(corpo)
  const picciolo = pronto(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.11, r * 0.16, r * 0.34, 5), mat(0x4a7a2a)))
  picciolo.position.set(x, r * 1.66, z); picciolo.rotation.z = 0.2; g.add(picciolo)
  if (!intagliata) return
  const luce = new THREE.MeshBasicMaterial({ color: 0xffd23a })
  for (const s of [-1, 1]) {
    const occhio = new THREE.Mesh(new THREE.ConeGeometry(r * 0.17, r * 0.26, 3), luce)       // un triangolo che guarda in su
    occhio.position.set(x + s * r * 0.34, r * 0.98, z + r * 1.0); occhio.rotation.x = Math.PI / 2; g.add(occhio)
  }
  const bocca = new THREE.Mesh(new THREE.BoxGeometry(r * 0.78, r * 0.2, r * 0.1), luce)
  bocca.position.set(x, r * 0.5, z + r * 1.05); g.add(bocca)
}

function costruisciZucca () {
  const g = new THREE.Group()
  zucca(g, 0.38, 0, 0, true)
  g.userData.altezza = 1.0
  fondiPerMateriale(g)
  return g
}
function costruisciZucche () {
  const g = new THREE.Group()
  zucca(g, 0.4, -0.45, 0.02, true)
  zucca(g, 0.3, 0.42, -0.04, false, 0xd8641a)
  zucca(g, 0.18, 0.12, 0.3, false, 0xf08a2c)
  g.userData.altezza = 1.0
  fondiPerMateriale(g)
  return g
}
/** Il pupazzo di neve: tre palle, occhi e bottoni di carbone, naso di carota verso +z, sciarpa rossa, cappello e due rami per braccia. */
function costruisciPupazzo () {
  const g = new THREE.Group(), neve = mat(0xf2f6fb, { roughness: 1 }), carbone = mat(0x26262c), rosso = mat(0xc8323a), legno = mat(0x6a4426)
  let y = 0
  for (const [r, sy] of [[0.36, 0.9], [0.27, 0.92], [0.2, 1]]) {
    const palla = pronto(new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), neve)); palla.scale.y = sy
    palla.position.y = y + r * sy * 0.92; g.add(palla); y += r * sy * 1.75
  }
  const testa = y - 0.2 * 0.92
  const naso = pronto(new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.22, 6), mat(0xf07a1e)))
  naso.rotation.x = Math.PI / 2; naso.position.set(0, testa, 0.27); g.add(naso)
  for (const s of [-1, 1]) {
    const occhio = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), carbone); occhio.position.set(s * 0.075, testa + 0.07, 0.17); g.add(occhio)
    const ramo = pronto(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.48, 5), legno))
    ramo.position.set(s * 0.43, 0.84, 0); ramo.rotation.z = s * -1.05; g.add(ramo)
  }
  for (const [by, bz] of [[0.92, 0.245], [0.8, 0.27], [0.4, 0.345]]) {
    const bottone = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 4), carbone); bottone.position.set(0, by, bz); g.add(bottone)
  }
  const sciarpa = pronto(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 6, 14), rosso))
  sciarpa.rotation.x = Math.PI / 2; sciarpa.position.y = testa - 0.17; g.add(sciarpa)
  const coda = pronto(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.26, 0.04), rosso)); coda.position.set(0.12, testa - 0.3, 0.19); coda.rotation.z = 0.2; g.add(coda)
  const tesa = pronto(new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.03, 14), carbone)); tesa.position.y = testa + 0.17; g.add(tesa)
  const cilindro = pronto(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.22, 14), carbone)); cilindro.position.y = testa + 0.29; g.add(cilindro)
  g.userData.altezza = testa + 0.4
  fondiPerMateriale(g)
  return g
}

export const creaZucca = memoModello('zucca', costruisciZucca)
export const creaZucche = memoModello('zucche', costruisciZucche)
export const creaPupazzo = memoModello('pupazzo', costruisciPupazzo)

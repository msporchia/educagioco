// Le botti di decoro: un tornio panciuto di legno con tre cerchi di ferro, a gruppi contro i muri delle stanze, mai sulle porte,
// nei corridoi o sulla roba del piano. Sono decoro e basta (il motore non ne sa niente: l'eroe ci passa attraverso, e non si
// rompono). Romperle con un bottino basilare è una voce di docs/sotterraneo/da-fare.md, da tarare prima di farla.
// Istanziate: due chiamate per tutte (il legno e il ferro). Dove stanno lo decide il seme del piano, sempre uguale.
import { LatheGeometry, TorusGeometry, CircleGeometry, InstancedMesh, MeshStandardMaterial, Matrix4, Vector2, Vector3, Quaternion, Euler, DoubleSide } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { caso } from './rumore.js'

const ALTA = 0.62
const profilo = () => { const p = []; for (let i = 0; i <= 6; i++) { const t = i / 6; p.push(new Vector2(0.21 + Math.sin(t * Math.PI) * 0.05, t * ALTA)) } return p }
const raggioA = y => 0.21 + Math.sin(y / ALTA * Math.PI) * 0.05

// dove: celle di stanza contro un muro, lontane da porte e da ogni cosa del piano, a gruppi (puro: si prova senza GPU)
export function postiDelleBotti(pianta, stanze, robe, seme) {
  const r = caso(seme * 31 + 5)
  const occupate = new Set(robe.map(q => pianta.id(q.x, q.y)))
  const porte = robe.filter(q => q.che === 'porta')
  const libera = (x, y) => pianta.calpestabile(x, y) && !occupate.has(pianta.id(x, y)) && !porte.some(p => Math.abs(p.x - x) + Math.abs(p.y - y) < 3)
  const controMuro = (x, y) => pianta.roccia(x, y - 1) || pianta.roccia(x - 1, y) || pianta.roccia(x + 1, y)
  const posti = []
  for (const s of stanze) {
    if (s.w < 4 || s.h < 4) continue
    const gruppi = Math.floor(r() * 3)
    for (let g = 0; g < gruppi; g++) {
      for (let prova = 0; prova < 20; prova++) {
        const x = s.x + Math.floor(r() * s.w), y = s.y + Math.floor(r() * s.h)
        if (!libera(x, y) || !controMuro(x, y)) continue
        const quante = 1 + Math.floor(r() * 3)
        const celle = [[x, y], [x + 1, y], [x - 1, y], [x, y + 1]].filter(([a, b]) => libera(a, b) && controMuro(a, b)).slice(0, quante)
        for (const [a, b] of celle) {
          occupate.add(pianta.id(a, b))
          posti.push({ x: a + 0.5 + (r() - 0.5) * 0.18, z: b + 0.45 + (r() - 0.5) * 0.12, giro: r() * 6, scala: 0.92 + r() * 0.16, cella: { x: a, y: b } })
        }
        break
      }
    }
  }
  return posti
}

export function creaBotti(scena, { posti, legno, conMaschera, maschera }) {
  if (!posti.length) return { via() {} }
  const matLegno = conMaschera(new MeshStandardMaterial({ map: legno.map, normalMap: legno.normalMap, color: 0xb08a60, roughness: 0.85, side: DoubleSide }), maschera, { chiave: 'botte' })
  const matFerro = conMaschera(new MeshStandardMaterial({ color: 0x4a4848, metalness: 0.8, roughness: 0.5 }), maschera, { chiave: 'cerchi' })
  const lato = new LatheGeometry(profilo(), 12), coperchio = new CircleGeometry(0.21, 12).rotateX(-Math.PI / 2).translate(0, ALTA, 0)
  const corpo = mergeGeometries([lato.toNonIndexed(), coperchio.toNonIndexed()])
  const anelli = [0.08, 0.31, 0.54].map(y => new TorusGeometry(raggioA(y) + 0.006, 0.012, 3, 14).rotateX(Math.PI / 2).translate(0, y, 0))
  const cerchi = mergeGeometries(anelli)
  for (const g of [lato, coperchio, ...anelli]) g.dispose()
  const a = new InstancedMesh(corpo, matLegno, posti.length), b = new InstancedMesh(cerchi, matFerro, posti.length)
  const m = new Matrix4(), q = new Quaternion(), e = new Euler(), p = new Vector3(), s = new Vector3()
  posti.forEach((o, i) => {
    m.compose(p.set(o.x, 0, o.z), q.setFromEuler(e.set(0, o.giro, 0)), s.setScalar(o.scala))
    a.setMatrixAt(i, m); b.setMatrixAt(i, m)
  })
  for (const o of [a, b]) { o.castShadow = true; o.receiveShadow = true; o.computeBoundingSphere(); scena.add(o) }
  return { via() { scena.remove(a); scena.remove(b); corpo.dispose(); cerchi.dispose(); matLegno.dispose(); matFerro.dispose() } }
}

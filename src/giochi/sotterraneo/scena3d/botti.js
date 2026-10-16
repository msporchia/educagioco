// Le botti da rompere, disegnate: un passatempo, come in Diablo. Dove stanno, se sono rotte e cosa lasciano è del motore
// (motore/botti.js, `corsa.bottiQui()`, `corsa.rompiBotte(i)`; la tabella in dati/botti.js): qui si fanno vedere intere e, rotte,
// si sfasciano in doghe e cerchi che rimbalzano e restano per terra (rientrando sul piano, già ferme). L'eroe ci passa attraverso.
// Istanziate: le intere in due chiamate (legno e ferro), i pezzi in altre due.
import { LatheGeometry, TorusGeometry, CircleGeometry, InstancedMesh, MeshStandardMaterial, Matrix4, Vector2, Vector3, Quaternion, Euler,
         Color, DoubleSide } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { caso } from './rumore.js'

const ALTA = 0.62, DOGHE = 9
const profilo = (n = 6) => { const p = []; for (let i = 0; i <= n; i++) { const t = i / n; p.push(new Vector2(0.21 + Math.sin(t * Math.PI) * 0.05, t * ALTA)) } return p }
const raggioA = y => 0.21 + Math.sin(y / ALTA * Math.PI) * 0.05

// `posti`: le botti del motore (`corsa.bottiQui()`); quelle già rotte nascono a terra, ferme
export function creaBotti(scena, { posti, legno, conMaschera, maschera, regola = null }) {
  if (!posti.length) return { botti: [], rompi() {}, aggiorna() {}, via() {} }
  const tinta = new Color((regola && regola.legno) || '#b08a60')
  const matLegno = conMaschera(new MeshStandardMaterial({ map: legno.map, normalMap: legno.normalMap, color: tinta, roughness: 0.85, side: DoubleSide,
    ...(regola && regola.muschio ? { emissive: new Color('#0a1a06') } : {}) }), maschera, { chiave: 'botte' })
  const matFerro = conMaschera(new MeshStandardMaterial({ color: regola && regola.muschio ? 0x3a4030 : 0x4a4848, metalness: 0.8, roughness: 0.5 }), maschera, { chiave: 'cerchi' })
  const lato = new LatheGeometry(profilo(), 12), coperchio = new CircleGeometry(0.21, 12).rotateX(-Math.PI / 2).translate(0, ALTA, 0)
  const corpo = mergeGeometries([lato.toNonIndexed(), coperchio.toNonIndexed()])
  const cerchio = y => new TorusGeometry(raggioA(y) + 0.006, 0.012, 3, 14).rotateX(Math.PI / 2).translate(0, y, 0)
  const anelli = [0.08, 0.31, 0.54].map(cerchio)
  const cerchi = mergeGeometries(anelli)
  // i pezzi di una botte rotta: le doghe (spicchi dello stesso tornio) e due cerchi, centrati per girare su se stessi
  const centra = g => { g.computeBoundingSphere(); const c = g.boundingSphere.center.clone(); g.translate(-c.x, -c.y, -c.z); return c }
  const doga = new LatheGeometry(profilo(4), 1, 0, Math.PI * 2 / DOGHE), cDoga = centra(doga)
  const pezzoCerchio = new TorusGeometry(0.22, 0.012, 3, 14), cCerchio = new Vector3(0, 0, 0)
  for (const g of [lato, coperchio, ...anelli]) g.dispose()
  const n = posti.length
  const a = new InstancedMesh(corpo, matLegno, n), b = new InstancedMesh(cerchi, matFerro, n)
  const pd = new InstancedMesh(doga, matLegno, n * DOGHE), pc = new InstancedMesh(pezzoCerchio, matFerro, n * 2)
  const m = new Matrix4(), q = new Quaternion(), e = new Euler(), p = new Vector3(), s = new Vector3(), zero = new Matrix4().makeScale(0, 0, 0)
  const botti = posti.map((o, i) => ({ x: o.fx, z: o.fy, giro: o.giro, scala: o.scala, cella: { x: o.x, y: o.y }, stanza: o.stanza, i, rotta: false, gia: o.rotta, pezzi: [] }))
  const metti = bo => { m.compose(p.set(bo.x, 0, bo.z), q.setFromEuler(e.set(0, bo.giro, 0)), s.setScalar(bo.scala)); a.setMatrixAt(bo.i, bo.rotta ? zero : m); b.setMatrixAt(bo.i, bo.rotta ? zero : m) }
  for (let i = 0; i < n * DOGHE; i++) pd.setMatrixAt(i, zero)
  for (let i = 0; i < n * 2; i++) pc.setMatrixAt(i, zero)
  const posaPezzo = (pz) => { m.compose(pz.p, q.setFromEuler(pz.r), s.setScalar(pz.scala)); (pz.cerchio ? pc : pd).setMatrixAt(pz.k, m) }
  let vivi = 0   // pezzi ancora in volo
  // `ferma`: i pezzi nascono già a terra (una botte rotta prima, rivista tornando sul piano)
  function sfascia(bo, ferma) {
    bo.rotta = true
    metti(bo)
    for (let k = 0; k < DOGHE + 2; k++) {
      const cerchio = k >= DOGHE, ang = bo.giro + (k + 0.5) * Math.PI * 2 / DOGHE
      const c = cerchio ? cCerchio.clone().setY(k === DOGHE ? 0.08 : 0.54) : cDoga.clone().applyAxisAngle(new Vector3(0, 1, 0), bo.giro + k * Math.PI * 2 / DOGHE)
      const rr = caso(bo.i * 97 + k)
      const pz = { k: cerchio ? bo.i * 2 + k - DOGHE : bo.i * DOGHE + k, cerchio, scala: bo.scala,
        p: new Vector3(bo.x + c.x * bo.scala, c.y * bo.scala, bo.z + c.z * bo.scala),
        r: new Euler(cerchio ? Math.PI / 2 : 0, cerchio ? 0 : bo.giro + k * Math.PI * 2 / DOGHE, 0),
        v: new Vector3(Math.cos(ang) * (1.2 + rr() * 1.4), 1.2 + rr() * 1.6, Math.sin(ang) * (1.2 + rr() * 1.4) + 0.3),
        w: new Vector3(rr() * 9 - 4.5, rr() * 6 - 3, rr() * 9 - 4.5), fermo: false }
      if (ferma) {
        // dove sarebbe caduta: a terra, sdraiata, poco lontano
        pz.p.set(bo.x + Math.cos(ang) * (0.25 + rr() * 0.35), 0.04, bo.z + Math.sin(ang) * (0.25 + rr() * 0.35))
        pz.r.set(Math.PI / 2, rr() * 6, 0); pz.fermo = true
      } else vivi++
      bo.pezzi.push(pz); posaPezzo(pz)
    }
    a.instanceMatrix.needsUpdate = b.instanceMatrix.needsUpdate = pd.instanceMatrix.needsUpdate = pc.instanceMatrix.needsUpdate = true
  }
  botti.forEach(bo => { if (bo.gia) sfascia(bo, true); else metti(bo) })
  for (const o of [a, b, pd, pc]) { o.castShadow = o === a || o === b; o.receiveShadow = true; o.frustumCulled = false; scena.add(o) }
  return {
    botti,
    // la botte si sfascia (una volta sola); torna false se era già rotta
    rompi(bo) { if (!bo || bo.rotta) return false; sfascia(bo, false); return true },
    // i pezzi in volo: gravità, rimbalzi, poi fermi sdraiati. Niente da fare se nessuno vola
    aggiorna(dt) {
      if (!vivi || dt <= 0) return
      for (const bo of botti) for (const pz of bo.pezzi) {
        if (pz.fermo) continue
        pz.v.y -= 9.8 * dt
        pz.p.addScaledVector(pz.v, dt)
        pz.r.x += pz.w.x * dt; pz.r.y += pz.w.y * dt; pz.r.z += pz.w.z * dt
        if (pz.p.y < 0.04) {
          pz.p.y = 0.04; pz.v.y *= -0.3; pz.v.x *= 0.55; pz.v.z *= 0.55; pz.w.multiplyScalar(0.45)
          if (pz.v.lengthSq() < 0.05) { pz.fermo = true; vivi--; pz.r.x = Math.PI / 2 * Math.round(pz.r.x / (Math.PI / 2)); pz.r.z = 0 }
        }
        posaPezzo(pz)
      }
      pd.instanceMatrix.needsUpdate = pc.instanceMatrix.needsUpdate = true
    },
    via() { for (const o of [a, b, pd, pc]) scena.remove(o); for (const g of [corpo, cerchi, doga, pezzoCerchio]) g.dispose(); matLegno.dispose(); matFerro.dispose() },
  }
}

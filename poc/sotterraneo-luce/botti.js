// Le botti dell'esplorazione: decoro modellato (un tornio panciuto di legno con tre cerchi di ferro), a gruppi contro i
// muri delle stanze, mai sulle porte né nei corridoi. Si toccano, l'eroe ci va, e arrivato la botte si sfascia in doghe
// e cerchi che rimbalzano e restano per terra. Ogni tanto (RESA) ne esce qualcosa di piccolo, una moneta o una
// pozioncina, che rimbalza, luccica e si prende camminandoci sopra. Tutto di prova: il motore non ne sa niente, e
// quello che si raccoglie va solo nel contatore a schermo (la roba vera la decide il gioco).
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { caso } from './mappa.js'

const RESA = 0.3           // quante botti su cento lasciano qualcosa, nel prototipo
const DOGHE = 9
const ALTA = 0.62
const profilo = () => { const p = []; for (let i = 0; i <= 8; i++) { const t = i / 8; p.push(new THREE.Vector2(0.21 + Math.sin(t * Math.PI) * 0.05, t * ALTA)) } return p }
const raggioA = y => 0.21 + Math.sin(y / ALTA * Math.PI) * 0.05

export function creaBotti ({ scena, m, robe, conMaschera, maschera, legno, figura, seme = 1 }) {
  const r = caso(seme * 31 + 5)
  const matLegno = conMaschera(new THREE.MeshStandardMaterial({ map: legno.map, normalMap: legno.normalMap, color: 0xb08a60, roughness: 0.85, side: THREE.DoubleSide }), maschera)
  const matFerro = conMaschera(new THREE.MeshStandardMaterial({ color: 0x4a4848, metalness: 0.8, roughness: 0.5 }), maschera)
  const fondi = new THREE.CircleGeometry(0.21, 16).rotateX(-Math.PI / 2)
  const corpo = mergeGeometries([new THREE.LatheGeometry(profilo(), 18).toNonIndexed(), fondi.clone().translate(0, ALTA, 0).toNonIndexed()])
  const cerchio = y => new THREE.TorusGeometry(raggioA(y) + 0.006, 0.012, 5, 22).rotateX(Math.PI / 2).translate(0, y, 0)
  const cerchi = mergeGeometries([0.08, 0.31, 0.54].map(cerchio))
  // le doghe di una botte rotta: spicchi dello stesso tornio, centrati per girare su se stessi
  const doghe = Array.from({ length: DOGHE }, (_, i) => {
    const g = new THREE.LatheGeometry(profilo(), 2, i * Math.PI * 2 / DOGHE, Math.PI * 2 / DOGHE)
    g.computeBoundingSphere(); const c = g.boundingSphere.center.clone(); g.translate(-c.x, -c.y, -c.z)
    return { g, c }
  })
  const pezziCerchio = [0.08, 0.54].map(y => { const g = cerchio(y); g.computeBoundingSphere(); const c = g.boundingSphere.center.clone(); g.translate(-c.x, -c.y, -c.z); return { g, c } })

  // dove: celle di stanza contro un muro, lontane da porte e da ogni cosa del piano, a gruppi
  const occupate = new Set(robe.map(q => m.id(q.x, q.y)))
  for (const a of m.arredi) occupate.add(m.id(a.x, a.y))
  const porte = robe.filter(q => q.che === 'porta')
  const libera = (x, y) => m.pav(x, y) && !occupate.has(m.id(x, y)) && !porte.some(p => Math.abs(p.x - x) + Math.abs(p.y - y) < 3)
  const controMuro = (x, y) => m.roccia(x, y - 1) || m.roccia(x - 1, y) || m.roccia(x + 1, y)
  const botti = []
  for (const s of m.stanze) {
    if (s.w < 4 || s.h < 4) continue
    const gruppi = Math.floor(r() * 3)   // 0, 1 o 2 gruppi per stanza
    for (let g = 0; g < gruppi; g++) {
      for (let prova = 0; prova < 20; prova++) {
        const x = s.x + Math.floor(r() * s.w), y = s.y + Math.floor(r() * s.h)
        if (!libera(x, y) || !controMuro(x, y)) continue
        const quante = 1 + Math.floor(r() * 3)
        const celle = [[x, y], [x + 1, y], [x - 1, y], [x, y + 1]].filter(([a, b]) => libera(a, b) && controMuro(a, b)).slice(0, quante)
        for (const [a, b] of celle) {
          occupate.add(m.id(a, b))
          // due botti nella stessa cella, a volte: un gruppo vero non sta in fila
          const giro = r() * 6, sx = (r() - 0.5) * 0.18, sz = (r() - 0.5) * 0.12
          const gr = new THREE.Group()
          const me = new THREE.Mesh(corpo, matLegno), fe = new THREE.Mesh(cerchi, matFerro)
          for (const o of [me, fe]) { o.castShadow = true; o.receiveShadow = true; gr.add(o) }
          gr.position.set(a + 0.5 + sx, 0, b + 0.45 + sz); gr.rotation.y = giro
          gr.scale.setScalar(0.92 + r() * 0.16)
          scena.add(gr)
          botti.push({ x: a + 0.5 + sx, z: b + 0.45 + sz, cella: { x: a, y: b }, gruppo: gr, rotta: false, pezzi: [], fermi: false })
        }
        break
      }
    }
  }

  const cadute = []   // { f (figura), x, z, vy, y, t, presa }
  let monete = 0, pozioni = 0
  const conto = document.createElement('div')
  conto.id = 'bottino-prova'
  const scriviConto = () => { conto.textContent = `🪙 ${monete}  🧪 ${pozioni}`; conto.hidden = !(monete || pozioni) }
  scriviConto(); document.body.append(conto)

  function rompi (b, emetti) {
    if (b.rotta) return
    b.rotta = true
    b.gruppo.visible = false
    const s = b.gruppo.scale.x
    for (const d of [...doghe.map(x => ({ ...x, mat: matLegno })), ...pezziCerchio.map(x => ({ ...x, mat: matFerro }))]) {
      const me = new THREE.Mesh(d.g, d.mat); me.castShadow = true; me.receiveShadow = true
      const c = d.c.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), b.gruppo.rotation.y).multiplyScalar(s)
      me.position.set(b.x + c.x, c.y, b.z + c.z); me.rotation.y = b.gruppo.rotation.y; me.scale.setScalar(s)
      scena.add(me)
      b.pezzi.push({ me, v: new THREE.Vector3(c.x * 7 + (Math.random() - 0.5), 1.2 + Math.random() * 1.6, c.z * 7 + (Math.random() - 0.5) + 0.3),
                     w: new THREE.Vector3(Math.random() * 9 - 4.5, Math.random() * 6 - 3, Math.random() * 9 - 4.5), fermo: false })
    }
    emetti(b.x, 0.4, b.z, 26, { forza: 2.2, su: 1.4, vita: 0.5, caldo: 0.2, taglia: 0.05, tinta: new THREE.Color('#c8a070') })
    // la resa: ogni tanto ne esce qualcosa
    if (Math.random() < RESA) {
      const moneta = Math.random() < 0.65
      const f = figura(moneta ? 'moneta' : 'pozione-piccola', { ricordo: true, ombra: false })
      f.mesh.position.set(b.x, 0.3, b.z + 0.15)
      cadute.push({ f, moneta, x: b.x + (Math.random() - 0.5) * 0.5, z: b.z + 0.45, y: 0.3, vy: 2.6, t: 0, presa: false })
    }
  }

  function aggiorna (dt, t, eroe, emetti) {
    for (const b of botti) {
      if (!b.rotta || b.fermi) continue
      let tutti = true
      for (const p of b.pezzi) {
        if (p.fermo) continue
        tutti = false
        p.v.y -= 9.8 * dt
        p.me.position.addScaledVector(p.v, dt)
        p.me.rotation.x += p.w.x * dt; p.me.rotation.y += p.w.y * dt; p.me.rotation.z += p.w.z * dt
        if (p.me.position.y < 0.04) {
          p.me.position.y = 0.04; p.v.y *= -0.3; p.v.x *= 0.55; p.v.z *= 0.55; p.w.multiplyScalar(0.45)
          if (p.v.lengthSq() < 0.05) { p.fermo = true; p.me.rotation.x = Math.PI / 2 * Math.round(p.me.rotation.x / (Math.PI / 2)) }
        }
      }
      if (tutti) b.fermi = true
    }
    for (let i = cadute.length - 1; i >= 0; i--) {
      const c = cadute[i]
      c.t += dt
      if (c.presa) {
        c.f.mesh.position.y += dt * 2.4; c.f.mat.transparent = true; c.f.mat.opacity = Math.max(0, 1 - (c.t - c.presa) * 3)
        if (c.f.mat.opacity <= 0) { scena.remove(c.f.mesh); cadute.splice(i, 1) }
        continue
      }
      // rimbalza fino a fermarsi, poi luccica
      c.vy -= 9.8 * dt; c.y += c.vy * dt
      if (c.y < 0) { c.y = 0; c.vy = Math.abs(c.vy) > 0.6 ? -c.vy * 0.45 : 0 }
      const k = Math.min(1, c.t * 2.5)
      c.f.mesh.position.set(c.f.mesh.position.x + (c.x - c.f.mesh.position.x) * k * 0.2, c.y, c.f.mesh.position.z + (c.z - c.f.mesh.position.z) * k * 0.2)
      c.f.mat.emissive.setScalar(0.25 + 0.25 * Math.sin(t * 6 + i))
      if (Math.random() < dt * 4) emetti(c.f.mesh.position.x, c.y + 0.25, c.f.mesh.position.z, 1, { forza: 0.2, su: 0.4, vita: 0.5, caldo: 0.2, taglia: 0.04, tinta: new THREE.Color(c.moneta ? '#ffd76a' : '#ff7a8a') })
      // si prende camminandoci sopra
      if (c.vy === 0 && Math.hypot(eroe.x - c.f.mesh.position.x, eroe.z - c.f.mesh.position.z) < 0.55) {
        c.presa = c.t
        if (c.moneta) monete++; else pozioni++
        scriviConto()
        emetti(c.f.mesh.position.x, 0.4, c.f.mesh.position.z, 22, { forza: 1.2, su: 2, vita: 0.6, caldo: 0.2, taglia: 0.06, tinta: new THREE.Color(c.moneta ? '#ffe08a' : '#ff9aa8') })
      }
    }
  }

  return {
    botti, rompi, aggiorna,
    forme: () => botti.filter(b => !b.rotta).map(b => b.gruppo),
    diForma: o => botti.find(b => !b.rotta && (b.gruppo === o || b.gruppo.getObjectById(o.id))),
    via: () => conto.remove(),
  }
}

// Gli ingressi delle discese, uno per uno, ognuno un monumento riconoscibile e modellato in codice: la torre in rovina
// (la porta si apre), l'altare fra le colonne (la lastra scivola), l'arco della scalinata (la grata si alza), la grotta
// (le assi si spostano, le lanterne si accendono), la scala sommersa (l'acqua s'illumina), la botola (si apre sul rosso
// dell'inferno), la miniera (il carrello esce), il pozzo vecchio (la manovella gira, il secchio sale), il cancello delle
// terre selvagge (le ante si aprono). Le parti ferme vanno nel cantiere; quelle che si muovono restano mesh a parte.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { quotaTerreno, LIVELLO_ACQUA } from './generatore.js'
import { Cantiere, scatola, cilindro } from './kit.js'
import { caso } from './caso.js'

const PIETRA = [0.8, 0.78, 0.74], PIETRA_SCURA = [0.6, 0.58, 0.56], LEGNO = [0.66, 0.5, 0.36], LEGNO_SCURO = [0.4, 0.29, 0.21], BUIO = [0.03, 0.025, 0.025], FERRO = [0.25, 0.25, 0.28]

// un pezzo che si muove: le sue forme in una geometria sola, sotto un perno
function mobile (kit, scena, nome, f, x, y, z) {
  const c = new Cantiere(kit.mat); f(c)
  const perno = new THREE.Group(); perno.position.set(x, y, z); scena.add(perno)
  for (const [mat, lista] of Object.entries(c.liste)) {
    const me = new THREE.Mesh(mergeGeometries(lista), kit.mat[mat]); me.castShadow = true; me.receiveShadow = true; perno.add(me)
  }
  perno.name = nome
  return perno
}
function bagliore (scena, geo, colore, x, y, z, opz = {}) {
  const mat = new THREE.MeshBasicMaterial({ color: colore, transparent: true, opacity: 0, depthWrite: false, ...opz })
  const me = new THREE.Mesh(geo, mat); me.position.set(x, y, z); me.renderOrder = 5; scena.add(me)
  return me
}

export function creaMonumento (p, cant, m, kit, scena) {
  const cx = p.x + p.w / 2, cz = p.y + p.h / 2
  const y = quotaTerreno(m, cx, cz)
  const r = caso(p.chiave.length * 131 + 7)
  cant.base(cx, y, cz, 0)
  const fatto = { posto: p, x: cx, y, z: cz, alto: 2.5, anim: () => {}, fuoco: null }
  switch (p.monumento) {
    case 'torre': {
      // anelli di blocchi; la cima rotta (ogni spicchio si ferma a un'altezza sua), la porta in basso verso chi arriva
      const R = 1.3, spicchi = 16, file = 13, hb = 0.36
      const cima = Array.from({ length: spicchi }, (_, i) => Math.round(7 + 6 * (0.5 + 0.5 * Math.sin(i * 0.9 + 1)) * (0.6 + r() * 0.4)))
      for (let f = 0; f < file; f++) for (let i = 0; i < spicchi; i++) {
        if (f >= cima[i]) continue
        const a = (i + (f % 2) * 0.5) / spicchi * Math.PI * 2
        if (f < 5 && Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - 0) < 0.36) continue   // la porta guarda a sud (+z)
        const v = 0.86 + r() * 0.14
        cant.metti('pietra', scatola(0.56, hb - 0.02, 0.46, 1.2), Math.sin(a) * R, 0.18 + f * hb, Math.cos(a) * R, [PIETRA[0] * v, PIETRA[1] * v, PIETRA[2] * v], { ry: a })
      }
      cant.metti('luce', new THREE.CircleGeometry(R - 0.2, 16).rotateX(-Math.PI / 2), 0, 0.03, 0, BUIO)
      cant.metti('pietra', scatola(0.9, 0.2, 0.5, 1.2), 0, 1.86, R, PIETRA)
      // l'edera, e i blocchi caduti
      for (let i = 0; i < 6; i++) { const a = -1.4 + i * 0.35 + r() * 0.2; cant.metti('liscio', new THREE.IcosahedronGeometry(0.22 + r() * 0.12, 0), Math.sin(a) * (R + 0.15), 0.6 + r() * 2.2, Math.cos(a) * (R + 0.15), [0.3, 0.52, 0.24]) }
      for (let i = 0; i < 5; i++) { const a = 1.5 + r() * 3; cant.metti('pietra', scatola(0.5, 0.32, 0.4, 1.2), Math.sin(a) * (R + 0.9 + r() * 0.6), 0.14, Math.cos(a) * (R + 0.9), PIETRA_SCURA, { ry: r() * 3, rz: r() * 0.3 }) }
      const porta = mobile(kit, scena, 'porta', c => c.metti('legno', scatola(0.7, 1.55, 0.08), 0.35, 0.78, 0, LEGNO_SCURO), cx - 0.35, y + 0.02, cz + R - 0.05)
      fatto.anim = k => { porta.rotation.y = -k * 1.9 }
      fatto.alto = 4.8
      break
    }
    case 'altare': {
      // la pedana a gradini, le due colonne, la lastra sopra la scala
      cant.metti('pietra', scatola(3.0, 0.2, 2.0, 1.4), 0, 0.1, 0, PIETRA_SCURA)
      cant.metti('pietra', scatola(2.4, 0.2, 1.5, 1.4), 0, 0.3, -0.1, PIETRA)
      for (const s of [-1, 1]) {
        cant.metti('pietra', scatola(0.55, 0.25, 0.55, 1.2), s * 1.15, 0.52, -0.2, PIETRA)
        cant.metti('pietra', cilindro(0.2, 0.22, 2.2, 12, 1.4), s * 1.15, 1.75, -0.2, [0.88, 0.86, 0.82])
        cant.metti('pietra', scatola(0.6, 0.22, 0.6, 1.2), s * 1.15, 2.95, -0.2, PIETRA)
        cant.metti('liscio', new THREE.SphereGeometry(0.16, 10, 8), s * 1.15, 3.2, -0.2, [0.9, 0.85, 0.6])
      }
      cant.metti('luce', scatola(1.1, 0.02, 0.6), 0, 0.41, -0.1, BUIO)
      for (let i = 0; i < 3; i++) cant.metti('pietra', scatola(1.0, 0.04, 0.16), 0, 0.42, -0.32 + i * 0.2, [0.3 - i * 0.07, 0.28 - i * 0.07, 0.27 - i * 0.07])
      for (const s of [-1, 1]) { cant.metti('liscio', cilindro(0.04, 0.04, 0.25, 6), s * 0.8, 0.53, 0.45, [0.95, 0.92, 0.82]); cant.metti('luce', new THREE.ConeGeometry(0.035, 0.09, 5), s * 0.8, 0.7, 0.45, [1, 0.8, 0.35]) }
      const lastra = mobile(kit, scena, 'lastra', c => { c.metti('pietra', scatola(1.3, 0.45, 0.8, 1.2), 0, 0.22, 0, [0.86, 0.84, 0.8]); c.metti('liscio', new THREE.TorusGeometry(0.18, 0.03, 6, 16), 0, 0.45, 0, [0.85, 0.7, 0.3], { rx: Math.PI / 2 }) }, cx, y + 0.4, cz - 0.1)
      fatto.anim = k => { lastra.position.z = cz - 0.1 - k * 0.85; lastra.position.y = y + 0.4 + Math.sin(k * Math.PI) * 0.12 }
      fatto.alto = 3.5
      break
    }
    case 'arco': {
      // l'arco di pietra sulla scalinata che scende al buio
      const sh = new THREE.Shape()
      sh.moveTo(-1.6, 0); sh.lineTo(-1.6, 2.4); sh.quadraticCurveTo(-1.6, 3.3, 0, 3.4); sh.quadraticCurveTo(1.6, 3.3, 1.6, 2.4); sh.lineTo(1.6, 0)
      sh.lineTo(1.0, 0); sh.lineTo(1.0, 1.9); sh.absarc(0, 1.9, 1.0, 0, Math.PI, false); sh.lineTo(-1.0, 0)
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1, curveSegments: 12 })
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.3, uv.getY(i) / 1.3)
      cant.metti('pietra', g, 0, 0, -0.3, PIETRA)
      cant.metti('pietra', scatola(0.5, 0.5, 0.5, 1.2), 0, 3.4, 0, PIETRA_SCURA, { rz: Math.PI / 4 })
      cant.metti('luce', scatola(1.9, 0.02, 1.4), 0, 0.03, -0.25, BUIO)
      for (let i = 0; i < 5; i++) cant.metti('pietra', scatola(1.9, 0.05, 0.22), 0, 0.05, 0.35 - i * 0.26, [0.62 - i * 0.12, 0.6 - i * 0.12, 0.58 - i * 0.12])
      for (const s of [-1, 1]) cant.metti('pietra', scatola(0.3, 0.5, 1.2, 1.2), s * 1.3, 0.25, 0.7, PIETRA_SCURA)
      const grata = mobile(kit, scena, 'grata', c => {
        for (let i = 0; i < 7; i++) c.metti('liscio', scatola(0.06, 2.6, 0.06), -0.9 + i * 0.3, 1.3, 0, FERRO)
        for (let j = 0; j < 4; j++) c.metti('liscio', scatola(2.0, 0.06, 0.06), 0, 0.35 + j * 0.65, 0, FERRO)
      }, cx, y, cz + 0.05)
      fatto.anim = k => { grata.position.y = y + k * 2.3 }
      fatto.alto = 4
      break
    }
    case 'grotta': {
      // la bocca nella roccia, fatta di massi; la scaletta che scende; due lanterne
      for (let i = 0; i < 11; i++) {
        const a = Math.PI * i / 10, rr = 1.75
        const g = new THREE.DodecahedronGeometry(0.55 + r() * 0.3, 0)
        cant.metti('liscio', g, Math.cos(a) * rr, Math.sin(a) * rr * 1.05, -0.5 + r() * 0.2, [0.56 + r() * 0.08, 0.54, 0.5])
      }
      cant.metti('liscio', new THREE.DodecahedronGeometry(1.2, 0), 0, 2.2, -1.0, [0.55, 0.53, 0.5], { s: [1.6, 0.8, 1] })
      const bocca = new THREE.CircleGeometry(1.4, 20, 0, Math.PI)
      cant.metti('luce', bocca, 0, 0, -0.45, BUIO, { s: [1, 1.15, 1] })
      for (const s of [-1, 1]) cant.metti('legno', scatola(0.07, 2.2, 0.07), s * 0.35, 0.8, -0.2, LEGNO, { rx: 0.35 })
      for (let i = 0; i < 6; i++) cant.metti('legno', scatola(0.7, 0.05, 0.05), 0, 0.15 + i * 0.32, -0.05 - i * 0.11, LEGNO)
      const lanterne = []
      for (const s of [-1, 1]) {
        cant.metti('legno', scatola(0.09, 1.5, 0.09), s * 1.9, 0.75, 0.6, LEGNO_SCURO)
        cant.metti('liscio', scatola(0.22, 0.26, 0.22), s * 1.9, 1.62, 0.6, FERRO)
        lanterne.push(bagliore(scena, new THREE.SphereGeometry(0.16, 10, 8), 0xffc060, cx + s * 1.9, y + 1.62, cz + 0.6))
      }
      const assi = mobile(kit, scena, 'assi', c => {
        for (let i = 0; i < 4; i++) c.metti('legno', scatola(2.0, 0.22, 0.08), 0, 0.35 + i * 0.4, 0, [0.62, 0.48, 0.34], { rz: (i % 2 ? 0.12 : -0.1) })
      }, cx, y, cz - 0.1)
      fatto.anim = k => { assi.position.x = cx + k * 2.4; assi.rotation.z = -k * 0.25; for (const l of lanterne) l.material.opacity = k }
      fatto.alto = 3.4
      break
    }
    case 'stagno': {
      // i gradini che scendono nel lago (a nord), fra due pilastri con le teste di pesce; il cerchio di rune che si accende
      cant.metti('pietra', scatola(3.0, 0.25, 0.5, 1.2), 0, 0.12, 0.6, PIETRA)
      for (let i = 0; i < 6; i++) cant.metti('pietra', scatola(2.2, 0.2, 0.5, 1.2), 0, 0.02 - i * 0.16, 0.2 - i * 0.42, [0.78 - i * 0.06, 0.78 - i * 0.05, 0.76 - i * 0.03])
      for (const s of [-1, 1]) {
        cant.metti('pietra', scatola(0.5, 1.6, 0.5, 1.2), s * 1.35, 0.8, 0.3, PIETRA)
        cant.metti('pietra', new THREE.ConeGeometry(0.32, 0.5, 4), s * 1.35, 1.85, 0.3, PIETRA_SCURA, { ry: Math.PI / 4 })
        cant.metti('liscio', new THREE.SphereGeometry(0.1, 8, 6), s * 1.35, 1.35, 0.57, [0.3, 0.7, 0.8])
      }
      const rune = bagliore(scena, new THREE.RingGeometry(0.7, 1.05, 32).rotateX(-Math.PI / 2), 0x7fe8ff, cx, LIVELLO_ACQUA + 0.03, cz - 1.9, { blending: THREE.AdditiveBlending })
      const luce = bagliore(scena, new THREE.CircleGeometry(0.7, 24).rotateX(-Math.PI / 2), 0x2fb8ff, cx, LIVELLO_ACQUA + 0.025, cz - 1.9, { blending: THREE.AdditiveBlending })
      fatto.anim = (k, t) => { rune.material.opacity = k * (0.75 + 0.25 * Math.sin(t * 3)); luce.material.opacity = k * 0.5; rune.rotation.y = t * 0.4 }
      fatto.alto = 2.6
      break
    }
    case 'botola': {
      // una botola di legno nel prato dentro un telaio di pietra: aperta, sotto c'è il rosso dell'inferno
      cant.metti('pietra', scatola(1.9, 0.12, 1.9, 1.2), 0, 0.06, 0, PIETRA_SCURA)
      cant.metti('luce', scatola(1.4, 0.02, 1.4), 0, 0.125, 0, [0.06, 0.02, 0.01])
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; cant.metti('liscio', cilindro(0.04, 0.05, 0.6, 5), Math.cos(a) * 1.2, 0.3, Math.sin(a) * 1.2, [0.3, 0.26, 0.24], { rz: 0.2 }) }
      const fuoco = bagliore(scena, new THREE.PlaneGeometry(1.35, 1.35).rotateX(-Math.PI / 2), 0xff4a10, cx, y + 0.14, cz, { blending: THREE.AdditiveBlending })
      const anta = mobile(kit, scena, 'anta', c => {
        c.metti('legno', scatola(1.4, 0.08, 1.4, 0.8), 0, 0.04, 0.7, [0.55, 0.4, 0.28])
        for (const z of [0.25, 1.15]) c.metti('liscio', scatola(1.45, 0.03, 0.1), 0, 0.09, z, FERRO)
        c.metti('liscio', new THREE.TorusGeometry(0.1, 0.025, 5, 12), 0, 0.1, 1.2, FERRO, { rx: Math.PI / 2 })
      }, cx, y + 0.13, cz - 0.7)
      fatto.anim = (k, t) => { anta.rotation.x = -k * 1.85; fuoco.material.opacity = k * (0.8 + 0.2 * Math.sin(t * 7) * Math.sin(t * 3.3)) }
      fatto.fuoco = new THREE.Vector3(cx, y + 0.2, cz)
      fatto.alto = 1.8
      break
    }
    case 'miniera': {
      // il telaio di travi nel fianco del monte, la bocca buia, i binari col carrello
      cant.metti('luce', new THREE.PlaneGeometry(2.0, 2.0), 0, 1.0, -0.55, BUIO)
      for (const s of [-1, 1]) {
        cant.metti('legno', scatola(0.26, 2.3, 0.26), s * 1.15, 1.15, -0.4, LEGNO_SCURO)
        cant.metti('legno', scatola(0.12, 1.0, 0.12), s * 0.85, 1.9, -0.35, LEGNO_SCURO, { rz: s * 0.8 })
      }
      cant.metti('legno', scatola(2.8, 0.3, 0.32), 0, 2.4, -0.4, LEGNO_SCURO)
      cant.metti('legno', scatola(1.4, 0.4, 0.06), 0, 2.85, -0.3, [0.75, 0.6, 0.42])
      for (let i = 0; i < 9; i++) cant.metti('legno', scatola(1.1, 0.06, 0.18), 0, 0.04, -0.5 + i * 0.42, [0.5, 0.38, 0.28])
      for (const s of [-1, 1]) cant.metti('liscio', scatola(0.05, 0.05, 3.8), s * 0.38, 0.1, 1.2, [0.45, 0.42, 0.42])
      for (let i = 0; i < 5; i++) cant.metti('liscio', new THREE.DodecahedronGeometry(0.4 + r() * 0.3), (i - 2) * 0.9 + (r() - 0.5) * 0.3, 2.8 + r() * 0.5, -0.9, [0.5, 0.48, 0.45])
      const lampada = bagliore(scena, new THREE.SphereGeometry(0.14, 10, 8), 0xffc060, cx + 0.8, y + 2.05, cz - 0.15)
      cant.metti('liscio', scatola(0.2, 0.25, 0.2), 0.8, 2.05, -0.15, FERRO)
      const carrello = mobile(kit, scena, 'carrello', c => {
        c.metti('legno', scatola(0.85, 0.5, 1.1, 0.8), 0, 0.42, 0, [0.5, 0.36, 0.26])
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.metti('liscio', cilindro(0.13, 0.13, 0.08, 10), sx * 0.4, 0.17, sz * 0.35, FERRO, { rz: Math.PI / 2 })
        for (let i = 0; i < 5; i++) c.metti('liscio', new THREE.DodecahedronGeometry(0.17), (i % 3 - 1) * 0.22, 0.72, (i < 3 ? -0.2 : 0.2), [0.32, 0.3, 0.34])
        c.metti('liscio', new THREE.OctahedronGeometry(0.1), 0, 0.85, 0, [0.95, 0.8, 0.3])
      }, cx, y, cz - 0.2)
      fatto.anim = k => { carrello.position.z = cz - 0.2 + k * 1.7; lampada.material.opacity = k }
      fatto.alto = 3.4
      break
    }
    case 'pozzo': {
      // il pozzo vecchio: pietra scura, il tetto d'ardesia a punta su quattro pali, la manovella e il secchio
      cant.metti('pietra', cilindro(0.85, 0.92, 0.8, 16, 1.2), 0, 0.4, 0, [0.6, 0.58, 0.6])
      cant.metti('luce', new THREE.CircleGeometry(0.7, 16).rotateX(-Math.PI / 2), 0, 0.81, 0, BUIO)
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cant.metti('legno', scatola(0.12, 1.9, 0.12), sx * 0.75, 1.1, sz * 0.75, LEGNO_SCURO)
      cant.metti('tegole', new THREE.ConeGeometry(1.45, 1.1, 4), 0, 2.55, 0, [0.4, 0.44, 0.52], { ry: Math.PI / 4 })
      for (const sx of [-1, 1]) cant.metti('legno', scatola(0.1, 0.4, 0.1), sx * 0.7, 1.45, 0, LEGNO_SCURO)
      const manovella = mobile(kit, scena, 'manovella', c => {
        c.metti('legno', cilindro(0.09, 0.09, 1.5, 8), 0, 0, 0, LEGNO, { rz: Math.PI / 2 })
        c.metti('liscio', scatola(0.05, 0.4, 0.05), 0.8, 0.18, 0, FERRO)
        c.metti('liscio', scatola(0.25, 0.05, 0.05), 0.9, 0.36, 0, FERRO)
      }, cx, y + 1.55, cz)
      const secchio = mobile(kit, scena, 'secchio', c => {
        c.metti('legno', cilindro(0.16, 0.13, 0.25, 10), 0, 0, 0, [0.55, 0.42, 0.3])
        c.metti('liscio', cilindro(0.01, 0.01, 1.2, 4), 0, 0.72, 0, [0.75, 0.65, 0.5])
      }, cx, y + 0.3, cz)
      fatto.anim = k => { manovella.rotation.x = k * Math.PI * 4; secchio.position.y = y + 0.1 + k * 0.85; secchio.scale.y = 1 }
      fatto.alto = 3.4
      break
    }
    case 'cancello': {
      // il cancello delle terre selvagge, di traverso sulla strada che esce dalla mappa: due tronchi, la trave col teschio
      // di cervo, le ante che si aprono verso est
      cant.base(p.x + 0.5, y, p.y, 0)
      const L = p.h
      for (const z of [0, L]) {
        cant.metti('legno', cilindro(0.17, 0.2, 3.0, 9, 1), 0, 1.5, z, LEGNO_SCURO)
        cant.metti('legno', new THREE.ConeGeometry(0.2, 0.3, 9), 0, 3.15, z, LEGNO_SCURO)
      }
      cant.metti('legno', scatola(0.26, 0.3, L + 0.8, 1), 0, 2.65, L / 2, LEGNO)
      cant.metti('liscio', new THREE.SphereGeometry(0.17, 8, 6), -0.18, 2.6, L / 2, [0.92, 0.9, 0.84])
      for (const s of [-1, 1]) cant.metti('liscio', new THREE.ConeGeometry(0.04, 0.55, 5), -0.2, 2.9, L / 2 + s * 0.22, [0.9, 0.86, 0.78], { rx: -s * 0.6 })
      const anta = (z, verso) => mobile(kit, scena, 'anta', c => {
        for (let i = 0; i < 5; i++) c.metti('legno', scatola(0.08, 1.4, 0.24), 0, 0.85, verso * (0.2 + i * 0.27), [0.6 + i * 0.02, 0.46, 0.32])
        for (const h of [0.45, 1.25]) c.metti('legno', scatola(0.1, 0.12, L / 2 - 0.15), 0.02, h, verso * (L / 4), LEGNO_SCURO)
        c.metti('legno', scatola(0.1, 0.1, Math.hypot(L / 2 - 0.2, 0.8)), 0.03, 0.85, verso * L / 4, LEGNO_SCURO, { rx: verso * Math.atan2(0.8, L / 2 - 0.2) })
      }, p.x + 0.5, y, p.y + z)
      const nord = anta(0.05, 1), sud = anta(L - 0.05, -1)
      fatto.anim = k => { nord.rotation.y = k * 1.45; sud.rotation.y = -k * 1.45 }
      fatto.x = p.x + 0.5; fatto.z = p.y + L / 2
      fatto.alto = 3.4
      break
    }
  }
  return fatto
}

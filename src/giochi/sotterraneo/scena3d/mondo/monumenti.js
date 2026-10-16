// I posti modellati del mondo di sopra. Gli ingressi dei dungeon, ognuno riconoscibile: l'altare fra le colonne (la cripta dei
// re: la lastra scivola), l'arco con la grata (le cantine dei goblin: la grata si alza), la torre con la cima rotta (la porta si
// apre), la bocca della grotta fra le radici (la tana dei ragni: le assi si spostano), la scala che scende nel lago (le sale
// allagate: le rune s'accendono), la botola nel telaio che fuma (la porta dell'inferno: si apre sul rosso), la miniera coi binari
// (le miniere di brace: il carrello esce), il pozzo col tetto d'ardesia (il pozzo senza fondo). E la pietra del viaggio, che si
// accende, e il portale gemello. Le parti ferme nel cantiere, quelle che si muovono a parte. Dal prototipo poc/mondo-sopra/monumenti.js.
import { Group, Mesh, MeshBasicMaterial, ShaderMaterial, AdditiveBlending, DoubleSide, Shape, ExtrudeGeometry, CircleGeometry,
         SphereGeometry, DodecahedronGeometry, TorusGeometry, RingGeometry, PlaneGeometry, ConeGeometry, OctahedronGeometry, Vector3 } from 'three'
import { Cantiere, scatola, cilindro } from './kit.js'
import { quotaTerreno, LIVELLO_ACQUA, caso } from './suolo.js'

const PIETRA = [0.8, 0.78, 0.74], PIETRA_SCURA = [0.6, 0.58, 0.56], LEGNO = [0.66, 0.5, 0.36], LEGNO_SCURO = [0.4, 0.29, 0.21], BUIO = [0.03, 0.025, 0.025], FERRO = [0.25, 0.25, 0.28]

// un pezzo che si muove: le sue forme in una geometria sola per materiale, sotto un perno
function mobile(kit, gruppo, f, x, y, z) {
  const c = new Cantiere(); c.qui(x, z); f(c)
  const perno = new Group(); perno.position.set(x, y, z)
  for (const me of c.chiudi(kit.mobili, kit.ombraMobili)) perno.add(me)
  gruppo.add(perno)
  return perno
}
function bagliore(gruppo, geo, colore, x, y, z, opz = {}) {
  const me = new Mesh(geo, new MeshBasicMaterial({ color: colore, transparent: true, opacity: 0, depthWrite: false, ...opz }))
  me.position.set(x, y, z); me.renderOrder = 5; gruppo.add(me)
  return me
}

// un ingresso: `p` il posto del generatore (lotto, monumento). Torna { x, y, z, alto, anim(k, t), fumo? }
export function creaMonumento(p, cant, m, kit, gruppo) {
  const cx = p.x + p.w / 2, cz = p.y + p.h / 2, y = quotaTerreno(m, cx, cz)
  const r = caso(p.chiave.length * 131 + 7)
  cant.base(cx, y, cz, 0)
  const fatto = { posto: p, x: cx, y, z: cz, alto: 2.5, anim: () => {}, fumo: null, k: 0 }
  switch (p.monumento) {
    case 'torre': {
      const R = 1.3, spicchi = 16, file = 13, hb = 0.36
      const cima = Array.from({ length: spicchi }, (_, i) => Math.round(7 + 6 * (0.5 + 0.5 * Math.sin(i * 0.9 + 1)) * (0.6 + r() * 0.4)))
      for (let f = 0; f < file; f++) for (let i = 0; i < spicchi; i++) {
        if (f >= cima[i]) continue
        const a = (i + (f % 2) * 0.5) / spicchi * Math.PI * 2
        if (f < 5 && Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.36) continue   // la porta guarda a sud
        const v = 0.86 + r() * 0.14
        cant.metti('pietra', scatola(0.56, hb - 0.02, 0.46, 1.2), Math.sin(a) * R, 0.18 + f * hb, Math.cos(a) * R, [PIETRA[0] * v * 0.92, PIETRA[1] * v * 0.86, PIETRA[2] * v * 0.82], { ry: a })
      }
      cant.metti('luce', new CircleGeometry(R - 0.2, 16).rotateX(-Math.PI / 2), 0, 0.03, 0, BUIO)
      cant.metti('pietra', scatola(0.9, 0.2, 0.5, 1.2), 0, 1.86, R, PIETRA)
      // bruciata: la cima annerita e la fuliggine sopra la porta
      for (let i = 0; i < 6; i++) { const a = r() * 6.28; cant.metti('liscio', new DodecahedronGeometry(0.2 + r() * 0.15), Math.sin(a) * R, 2.6 + r() * 1.6, Math.cos(a) * R, [0.18, 0.16, 0.15]) }
      for (let i = 0; i < 5; i++) { const a = 1.5 + r() * 3; cant.metti('pietra', scatola(0.5, 0.32, 0.4, 1.2), Math.sin(a) * (R + 0.9 + r() * 0.6), 0.14, Math.cos(a) * (R + 0.9), PIETRA_SCURA, { ry: r() * 3, rz: r() * 0.3 }) }
      const porta = mobile(kit, gruppo, c => c.metti('legno', scatola(0.7, 1.55, 0.08), 0.35, 0.78, 0, LEGNO_SCURO), cx - 0.35, y + 0.02, cz + R - 0.05)
      fatto.anim = k => { porta.rotation.y = -k * 1.9 }
      fatto.fumo = new Vector3(cx + 0.3, y + 4.4, cz - 0.2)
      fatto.alto = 4.8
      break
    }
    case 'altare': {
      cant.metti('pietra', scatola(3.0, 0.2, 2.0, 1.4), 0, 0.1, 0, PIETRA_SCURA)
      cant.metti('pietra', scatola(2.4, 0.2, 1.5, 1.4), 0, 0.3, -0.1, PIETRA)
      for (const s of [-1, 1]) {
        cant.metti('pietra', scatola(0.55, 0.25, 0.55, 1.2), s * 1.15, 0.52, -0.2, PIETRA)
        cant.metti('pietra', cilindro(0.2, 0.22, 2.2, 12, 1.4), s * 1.15, 1.75, -0.2, [0.88, 0.86, 0.82])
        cant.metti('pietra', scatola(0.6, 0.22, 0.6, 1.2), s * 1.15, 2.95, -0.2, PIETRA)
        // la corona dei re sulla cima delle colonne
        cant.metti('liscio', cilindro(0.17, 0.14, 0.14, 8), s * 1.15, 3.14, -0.2, [0.9, 0.76, 0.3])
      }
      cant.metti('luce', scatola(1.1, 0.02, 0.6), 0, 0.41, -0.1, BUIO)
      for (let i = 0; i < 3; i++) cant.metti('pietra', scatola(1.0, 0.04, 0.16), 0, 0.42, -0.32 + i * 0.2, [0.3 - i * 0.07, 0.28 - i * 0.07, 0.27 - i * 0.07])
      for (const s of [-1, 1]) { cant.metti('liscio', cilindro(0.04, 0.04, 0.25, 6), s * 0.8, 0.53, 0.45, [0.95, 0.92, 0.82]); cant.metti('luce', new ConeGeometry(0.035, 0.09, 5), s * 0.8, 0.7, 0.45, [1, 0.8, 0.35]) }
      const lastra = mobile(kit, gruppo, c => { c.metti('pietra', scatola(1.3, 0.45, 0.8, 1.2), 0, 0.22, 0, [0.86, 0.84, 0.8]); c.metti('liscio', new TorusGeometry(0.18, 0.03, 6, 16), 0, 0.45, 0, [0.85, 0.7, 0.3], { rx: Math.PI / 2 }) }, cx, y + 0.4, cz - 0.1)
      fatto.anim = k => { lastra.position.z = cz - 0.1 - k * 0.85; lastra.position.y = y + 0.4 + Math.sin(k * Math.PI) * 0.12 }
      fatto.alto = 3.5
      break
    }
    case 'arco': {
      const sh = new Shape()
      sh.moveTo(-1.6, 0); sh.lineTo(-1.6, 2.4); sh.quadraticCurveTo(-1.6, 3.3, 0, 3.4); sh.quadraticCurveTo(1.6, 3.3, 1.6, 2.4); sh.lineTo(1.6, 0)
      sh.lineTo(1.0, 0); sh.lineTo(1.0, 1.9); sh.absarc(0, 1.9, 1.0, 0, Math.PI, false); sh.lineTo(-1.0, 0)
      const g = new ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1, curveSegments: 12 })
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.3, uv.getY(i) / 1.3)
      cant.metti('pietra', g, 0, 0, -0.3, PIETRA)
      cant.metti('pietra', scatola(0.5, 0.5, 0.5, 1.2), 0, 3.4, 0, PIETRA_SCURA, { rz: Math.PI / 4 })
      cant.metti('luce', scatola(1.9, 0.02, 1.4), 0, 0.03, -0.25, BUIO)
      for (let i = 0; i < 5; i++) cant.metti('pietra', scatola(1.9, 0.05, 0.22), 0, 0.05, 0.35 - i * 0.26, [0.62 - i * 0.12, 0.6 - i * 0.12, 0.58 - i * 0.12])
      for (const s of [-1, 1]) cant.metti('pietra', scatola(0.3, 0.5, 1.2, 1.2), s * 1.3, 0.25, 0.7, PIETRA_SCURA)
      // i segni dei goblin: due teschi piccoli sui pilastri
      for (const s of [-1, 1]) cant.metti('liscio', new SphereGeometry(0.12, 8, 6), s * 1.3, 0.62, 1.1, [0.92, 0.9, 0.8])
      const grata = mobile(kit, gruppo, c => {
        for (let i = 0; i < 7; i++) c.metti('liscio', scatola(0.06, 2.6, 0.06), -0.9 + i * 0.3, 1.3, 0, FERRO)
        for (let j = 0; j < 4; j++) c.metti('liscio', scatola(2.0, 0.06, 0.06), 0, 0.35 + j * 0.65, 0, FERRO)
      }, cx, y, cz + 0.05)
      fatto.anim = k => { grata.position.y = y + k * 2.3 }
      fatto.alto = 4
      break
    }
    case 'grotta': {
      for (let i = 0; i < 11; i++) { const a = Math.PI * i / 10; cant.metti('liscio', new DodecahedronGeometry(0.55 + r() * 0.3, 0), Math.cos(a) * 1.75, Math.sin(a) * 1.84, -0.5 + r() * 0.2, [0.56 + r() * 0.08, 0.54, 0.5]) }
      cant.metti('liscio', new DodecahedronGeometry(1.2, 0), 0, 2.2, -1.0, [0.55, 0.53, 0.5], { s: [1.6, 0.8, 1] })
      cant.metti('luce', new CircleGeometry(1.4, 20, 0, Math.PI), 0, 0, -0.45, BUIO, { s: [1, 1.15, 1] })
      // le radici che pendono sulla bocca, e le ragnatele
      for (let i = 0; i < 6; i++) cant.metti('legno', cilindro(0.04, 0.07, 1.3 + r() * 0.6, 5), -1.2 + i * 0.48, 2.1, -0.2 + r() * 0.2, [0.36, 0.27, 0.2], { rz: (r() - 0.5) * 0.5 })
      for (const s of [-1, 1]) cant.metti('liscio', new CircleGeometry(0.45, 6), s * 0.9, 1.5, -0.2, [0.86, 0.86, 0.84], { ry: s * 0.2 })
      const lanterne = []
      for (const s of [-1, 1]) {
        cant.metti('legno', scatola(0.09, 1.5, 0.09), s * 1.9, 0.75, 0.6, LEGNO_SCURO)
        cant.metti('liscio', scatola(0.22, 0.26, 0.22), s * 1.9, 1.62, 0.6, FERRO)
        lanterne.push(bagliore(gruppo, new SphereGeometry(0.16, 10, 8), 0xffc060, cx + s * 1.9, y + 1.62, cz + 0.6))
      }
      const assi = mobile(kit, gruppo, c => { for (let i = 0; i < 4; i++) c.metti('legno', scatola(2.0, 0.22, 0.08), 0, 0.35 + i * 0.4, 0, [0.62, 0.48, 0.34], { rz: (i % 2 ? 0.12 : -0.1) }) }, cx, y, cz - 0.1)
      fatto.anim = k => { assi.position.x = cx + k * 2.4; assi.rotation.z = -k * 0.25; for (const l of lanterne) l.material.opacity = k }
      fatto.alto = 3.4
      break
    }
    case 'stagno': {
      cant.metti('pietra', scatola(3.0, 0.25, 0.5, 1.2), 0, 0.12, 0.6, PIETRA)
      for (let i = 0; i < 6; i++) cant.metti('pietra', scatola(2.2, 0.2, 0.5, 1.2), 0, 0.02 - i * 0.16, 0.2 - i * 0.42, [0.78 - i * 0.06, 0.78 - i * 0.05, 0.76 - i * 0.03])
      for (const s of [-1, 1]) {
        cant.metti('pietra', scatola(0.5, 1.6, 0.5, 1.2), s * 1.35, 0.8, 0.3, PIETRA)
        cant.metti('pietra', new ConeGeometry(0.32, 0.5, 4), s * 1.35, 1.85, 0.3, PIETRA_SCURA, { ry: Math.PI / 4 })
        cant.metti('liscio', new SphereGeometry(0.1, 8, 6), s * 1.35, 1.35, 0.57, [0.3, 0.7, 0.8])
      }
      const rune = bagliore(gruppo, new RingGeometry(0.7, 1.05, 32).rotateX(-Math.PI / 2), 0x7fe8ff, cx, LIVELLO_ACQUA + 0.03, cz - 1.9, { blending: AdditiveBlending })
      const luce = bagliore(gruppo, new CircleGeometry(0.7, 24).rotateX(-Math.PI / 2), 0x2fb8ff, cx, LIVELLO_ACQUA + 0.025, cz - 1.9, { blending: AdditiveBlending })
      fatto.anim = (k, t) => { rune.material.opacity = k * (0.75 + 0.25 * Math.sin(t * 3)); luce.material.opacity = k * 0.5; rune.rotation.y = t * 0.4 }
      fatto.alto = 2.6
      break
    }
    case 'botola': {
      cant.metti('pietra', scatola(1.9, 0.12, 1.9, 1.2), 0, 0.06, 0, [0.28, 0.24, 0.22])
      cant.metti('luce', scatola(1.4, 0.02, 1.4), 0, 0.125, 0, [0.06, 0.02, 0.01])
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; cant.metti('liscio', cilindro(0.04, 0.05, 0.6, 5), Math.cos(a) * 1.2, 0.3, Math.sin(a) * 1.2, [0.3, 0.26, 0.24], { rz: 0.2 }) }
      // la terra bruciata attorno, e le corna di pietra ai quattro angoli
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; cant.metti('pietra', new ConeGeometry(0.16, 0.7, 5), Math.cos(a) * 1.05, 0.4, Math.sin(a) * 1.05, [0.32, 0.26, 0.24], { rz: Math.cos(a) * 0.4, rx: -Math.sin(a) * 0.4 }) }
      const fuoco = bagliore(gruppo, new PlaneGeometry(1.35, 1.35).rotateX(-Math.PI / 2), 0xff4a10, cx, y + 0.14, cz, { blending: AdditiveBlending })
      const anta = mobile(kit, gruppo, c => {
        c.metti('legno', scatola(1.4, 0.08, 1.4, 0.8), 0, 0.04, 0.7, [0.45, 0.32, 0.24])
        for (const z of [0.25, 1.15]) c.metti('liscio', scatola(1.45, 0.03, 0.1), 0, 0.09, z, FERRO)
        c.metti('liscio', new TorusGeometry(0.1, 0.025, 5, 12), 0, 0.1, 1.2, FERRO, { rx: Math.PI / 2 })
      }, cx, y + 0.13, cz - 0.7)
      fatto.anim = (k, t) => { anta.rotation.x = -k * 1.85; fuoco.material.opacity = k * (0.8 + 0.2 * Math.sin(t * 7) * Math.sin(t * 3.3)) }
      fatto.fuoco = new Vector3(cx, y + 0.2, cz)
      fatto.fumo = new Vector3(cx, y + 0.3, cz)   // la porta dell'inferno fuma anche chiusa, dalle fessure
      fatto.alto = 1.8
      break
    }
    case 'miniera': {
      cant.metti('luce', new PlaneGeometry(2.0, 2.0), 0, 1.0, -0.55, BUIO)
      for (const s of [-1, 1]) {
        cant.metti('legno', scatola(0.26, 2.3, 0.26), s * 1.15, 1.15, -0.4, LEGNO_SCURO)
        cant.metti('legno', scatola(0.12, 1.0, 0.12), s * 0.85, 1.9, -0.35, LEGNO_SCURO, { rz: s * 0.8 })
      }
      cant.metti('legno', scatola(2.8, 0.3, 0.32), 0, 2.4, -0.4, LEGNO_SCURO)
      cant.metti('legno', scatola(1.4, 0.4, 0.06), 0, 2.85, -0.3, [0.75, 0.6, 0.42])
      for (let i = 0; i < 9; i++) cant.metti('legno', scatola(1.1, 0.06, 0.18), 0, 0.04, -0.5 + i * 0.42, [0.5, 0.38, 0.28])
      for (const s of [-1, 1]) cant.metti('liscio', scatola(0.05, 0.05, 3.8), s * 0.38, 0.1, 1.2, [0.45, 0.42, 0.42])
      for (let i = 0; i < 5; i++) cant.metti('liscio', new DodecahedronGeometry(0.4 + r() * 0.3), (i - 2) * 0.9 + (r() - 0.5) * 0.3, 2.8 + r() * 0.5, -0.9, [0.5, 0.48, 0.45])
      // la brace: un mucchio di carbone acceso accanto ai binari
      cant.metti('liscio', new DodecahedronGeometry(0.3), 1.6, 0.18, 0.7, [0.12, 0.1, 0.1], { s: [1.3, 0.6, 1] })
      cant.metti('luce', new DodecahedronGeometry(0.12), 1.6, 0.32, 0.7, [1, 0.42, 0.1])
      const lampada = bagliore(gruppo, new SphereGeometry(0.14, 10, 8), 0xffc060, cx + 0.8, y + 2.05, cz - 0.15)
      cant.metti('liscio', scatola(0.2, 0.25, 0.2), 0.8, 2.05, -0.15, FERRO)
      const carrello = mobile(kit, gruppo, c => {
        c.metti('legno', scatola(0.85, 0.5, 1.1, 0.8), 0, 0.42, 0, [0.5, 0.36, 0.26])
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.metti('liscio', cilindro(0.13, 0.13, 0.08, 10), sx * 0.4, 0.17, sz * 0.35, FERRO, { rz: Math.PI / 2 })
        for (let i = 0; i < 5; i++) c.metti('liscio', new DodecahedronGeometry(0.17), (i % 3 - 1) * 0.22, 0.72, (i < 3 ? -0.2 : 0.2), [0.32, 0.3, 0.34])
        c.metti('liscio', new OctahedronGeometry(0.1), 0, 0.85, 0, [0.95, 0.8, 0.3])
      }, cx, y, cz - 0.2)
      fatto.anim = k => { carrello.position.z = cz - 0.2 + k * 1.7; lampada.material.opacity = k }
      fatto.braci = new Vector3(cx + 1.6, y + 0.35, cz + 0.7)
      fatto.alto = 3.4
      break
    }
    case 'pozzo': {
      cant.metti('pietra', cilindro(0.85, 0.92, 0.8, 16, 1.2), 0, 0.4, 0, [0.6, 0.58, 0.6])
      cant.metti('luce', new CircleGeometry(0.7, 16).rotateX(-Math.PI / 2), 0, 0.81, 0, BUIO)
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cant.metti('legno', scatola(0.12, 1.9, 0.12), sx * 0.75, 1.1, sz * 0.75, LEGNO_SCURO)
      cant.metti('tegole', new ConeGeometry(1.45, 1.1, 4), 0, 2.55, 0, [0.4, 0.44, 0.52], { ry: Math.PI / 4 })
      for (const sx of [-1, 1]) cant.metti('legno', scatola(0.1, 0.4, 0.1), sx * 0.7, 1.45, 0, LEGNO_SCURO)
      const manovella = mobile(kit, gruppo, c => {
        c.metti('legno', cilindro(0.09, 0.09, 1.5, 8), 0, 0, 0, LEGNO, { rz: Math.PI / 2 })
        c.metti('liscio', scatola(0.05, 0.4, 0.05), 0.8, 0.18, 0, FERRO)
        c.metti('liscio', scatola(0.25, 0.05, 0.05), 0.9, 0.36, 0, FERRO)
      }, cx, y + 1.55, cz)
      const secchio = mobile(kit, gruppo, c => {
        c.metti('legno', cilindro(0.16, 0.13, 0.25, 10), 0, 0, 0, [0.55, 0.42, 0.3])
        c.metti('liscio', cilindro(0.01, 0.01, 1.2, 4), 0, 0.72, 0, [0.75, 0.65, 0.5])
      }, cx, y + 0.3, cz)
      fatto.anim = k => { manovella.rotation.x = k * Math.PI * 4; secchio.position.y = y + 0.1 + k * 0.85 }
      fatto.alto = 3.4
      break
    }
  }
  return fatto
}

// ── la pietra del viaggio: un cerchio di sassi ritti attorno a una pietra piatta con la runa, che si accende (`accesa`) ──
const MAT_RUNA = new MeshBasicMaterial({ color: 0x8ff0ff, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, side: DoubleSide })
export function creaPietra(p, cant, m, gruppo) {
  const cx = p.x + p.w / 2, cz = p.y + p.h / 2, y = quotaTerreno(m, cx, cz), r = caso(p.x * 17 + p.y)
  cant.base(cx, y, cz, 0)
  cant.metti('pietra', cilindro(0.62, 0.7, 0.16, 12, 1.2), 0, 0.08, 0, [0.7, 0.7, 0.72])
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + 0.3, h = 0.9 + r() * 0.5
    cant.metti('pietra', scatola(0.26, h, 0.18, 1.2), Math.cos(a) * 0.9, h / 2, Math.sin(a) * 0.9, [0.66 + r() * 0.1, 0.66, 0.68], { ry: -a, rz: (r() - 0.5) * 0.15 })
  }
  // la runa incisa: tre segni scuri sulla pietra di mezzo (accesa, il bagliore ci passa sopra)
  for (const [x, z, a] of [[0, 0, 0], [-0.18, 0.05, 0.8], [0.18, -0.05, -0.8]]) cant.metti('luce', scatola(0.06, 0.01, 0.42), x, 0.17, z, [0.18, 0.2, 0.24], { ry: a })
  const runa = new Mesh(new RingGeometry(0.2, 0.55, 24).rotateX(-Math.PI / 2), MAT_RUNA.clone())
  runa.position.set(cx, y + 0.19, cz); runa.renderOrder = 6; gruppo.add(runa)
  const colonna = new Mesh(new ConeGeometry(0.5, 3.2, 16, 1, true), MAT_RUNA.clone())
  colonna.position.set(cx, y + 1.7, cz); colonna.rotation.x = Math.PI; colonna.renderOrder = 6; gruppo.add(colonna)
  return {
    posto: p, x: cx, y, z: cz, alto: 1.6,
    aggiorna(accesa, t, si) {
      const v = si && accesa ? 1 : 0
      runa.material.opacity = v * (0.65 + 0.3 * Math.sin(t * 2.4))
      colonna.material.opacity = v * (0.1 + 0.05 * Math.sin(t * 1.7))
      runa.rotation.y = t * 0.3
    },
  }
}

// ── il portale gemello: un anello di pietra ritto e dentro il velo che gira ──
export function creaPortale(x, y, z) {
  const gruppo = new Group(); gruppo.position.set(x, y, z)
  const anello = new Mesh(new TorusGeometry(0.72, 0.13, 8, 28), new MeshBasicMaterial({ color: 0x5a5872 }))
  anello.position.y = 0.95; gruppo.add(anello)
  const velo = new Mesh(new CircleGeometry(0.62, 32), new ShaderMaterial({
    transparent: true, depthWrite: false, side: DoubleSide, blending: AdditiveBlending, uniforms: { uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT; varying vec2 vUv;
      void main(){ vec2 p = vUv - 0.5; float r = length(p) * 2.0, a = atan(p.y, p.x);
        float g = sin(a * 3.0 + r * 9.0 - uT * 3.0) * 0.5 + 0.5;
        vec3 c = mix(vec3(0.25, 0.4, 1.0), vec3(0.75, 0.55, 1.0), g) * (1.2 - r);
        gl_FragColor = vec4(c, smoothstep(1.0, 0.7, r) * 0.9); }`,
  }))
  velo.position.y = 0.95; gruppo.add(velo)
  const base = new Mesh(cilindro(0.5, 0.6, 0.18, 12), new MeshBasicMaterial({ color: 0x6a6878 }))
  base.position.y = 0.09; gruppo.add(base)
  return { gruppo, alto: 1.9, aggiorna(t) { velo.material.uniforms.uT.value = t; velo.scale.setScalar(1 + Math.sin(t * 2) * 0.03) },
           via() { gruppo.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose() }) } }
}

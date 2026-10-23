// Le decorazioni d'acqua della 2D che mancavano (W9): fontana grande, cantina, pozzo coperto, mulino ad acqua, ninfee (due) e canne. Non sono `acqua: true` come lo stagno
// (non fanno lago): la fontana, la cantina e il pozzo stanno sul prato; il mulino sta sulla riva (`riva`, `suAcqua`); le ninfee galleggiano (`soloAcqua`) e le canne
// stanno anche nell'acqua bassa (`anfibio`). L'acqua dei modelli è un disco azzurro opaco (la lastra trasparente è solo dei laghi). Vedi docs/fattoria3d/decorazioni.md.
import * as THREE from 'three'
import { decoro, mat, pronto, scatola, cilindro, cono, palla, filo, arco, botte } from './modelli-decori-base.js'
import { tetto } from './modelli.js'
import { fondiPerMateriale } from './fondi.js'

const PIETRA = 0xb4aa98, PIETRA_SCURA = 0x8f8a7e, ACQUA = 0x4ba6d6, SPRUZZO = 0xa6dcf2, LEGNO = 0x9a6a36, LEGNO_SCURO = 0x6e4a2c

const anello = (g, r, t, colore, x, y, z) => { const o = pronto(new THREE.Mesh(new THREE.TorusGeometry(r, t, 4, 16), mat(colore))); o.rotation.x = Math.PI / 2; o.position.set(x, y, z); g.add(o); return o }
/** Una foglia di ninfea: un disco verde con una tacca, appoggiata sull'acqua a quota `y`. */
function ninfea (g, x, z, r, y = 0.05, giro = 0) {
  const geo = new THREE.CircleGeometry(r, 10, 0.5, Math.PI * 2 - 0.5).rotateX(-Math.PI / 2)
  const o = pronto(new THREE.Mesh(geo, mat(0x4f9a45, { side: THREE.DoubleSide }))); o.position.set(x, y, z); o.rotation.y = giro; g.add(o)
  const o2 = pronto(new THREE.Mesh(new THREE.CircleGeometry(r * 0.55, 8).rotateX(-Math.PI / 2), mat(0x5aa84c, { side: THREE.DoubleSide }))); o2.position.set(x, y + 0.004, z); g.add(o2)
}
/** Un fiore di ninfea (rosa): petali appoggiati sulla foglia in (x, z), alto `s`. */
function fioreNinfea (g, x, z, y, s = 1, c = 0xf29ab6) {
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, o = cono(g, 0.045 * s, 0.14 * s, mat(c), x + Math.cos(a) * 0.04 * s, y + 0.07 * s, z + Math.sin(a) * 0.04 * s, 4); o.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5) }
  palla(g, 0.03 * s, 0xf0c52a, x, y + 0.05 * s, z, 1, 1, 1, 0)
}

export const ACQUA_DECORI = {
  fontana_grande: decoro('fontana_grande', g => {
    cilindro(g, 1.4, 1.42, 0.4, mat(PIETRA), 0, 0.2, 0, 16); anello(g, 1.4, 0.08, PIETRA_SCURA, 0, 0.42, 0)
    cilindro(g, 1.3, 1.3, 0.02, mat(ACQUA), 0, 0.395, 0, 16)
    cilindro(g, 0.28, 0.34, 0.8, mat(PIETRA_SCURA), 0, 0.8, 0, 10)
    cilindro(g, 0.72, 0.3, 0.22, mat(PIETRA), 0, 1.3, 0, 16); anello(g, 0.72, 0.05, PIETRA_SCURA, 0, 1.41, 0)
    cilindro(g, 0.62, 0.62, 0.02, mat(ACQUA), 0, 1.395, 0, 16)
    cilindro(g, 0.1, 0.14, 0.5, mat(PIETRA_SCURA), 0, 1.65, 0, 8)
    cilindro(g, 0.4, 0.14, 0.14, mat(PIETRA), 0, 1.97, 0, 12); anello(g, 0.4, 0.035, PIETRA_SCURA, 0, 2.04, 0)
    cilindro(g, 0.34, 0.34, 0.02, mat(ACQUA), 0, 2.03, 0, 12)
    palla(g, 0.09, PIETRA_SCURA, 0, 2.1, 0, 1, 1, 1, 1); cono(g, 0.05, 0.4, mat(SPRUZZO), 0, 2.3, 0, 5)
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; filo(g, [Math.cos(a) * 0.4, 2.0, Math.sin(a) * 0.4], [Math.cos(a) * 0.52, 1.4, Math.sin(a) * 0.52], 0.016, SPRUZZO) }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.2; filo(g, [Math.cos(a) * 0.72, 1.3, Math.sin(a) * 0.72], [Math.cos(a) * 0.9, 0.4, Math.sin(a) * 0.9], 0.016, SPRUZZO) }
    return { altezza: 2.6 }
  }),
  cantina: decoro('cantina', g => {
    palla(g, 0.95, 0x5f9a45, 0, 0.1, -0.25, 1.15, 0.7, 0.95, 1)
    scatola(g, 1.5, 0.9, 0.26, mat(0xa8a395), 0, 0.45, 0.3); scatola(g, 1.6, 0.08, 0.34, mat(PIETRA_SCURA), 0, 0.94, 0.3)
    scatola(g, 0.56, 0.62, 0.06, mat(0x2a2018), 0, 0.34, 0.45)
    cilindro(g, 0.28, 0.28, 0.06, mat(0x2a2018), 0, 0.65, 0.45, 12).rotation.x = Math.PI / 2
    for (const s of [-1, 1]) scatola(g, 0.25, 0.62, 0.04, mat(LEGNO), s * 0.14, 0.34, 0.48)
    cilindro(g, 0.255, 0.255, 0.04, mat(LEGNO), 0, 0.65, 0.48, 12).rotation.x = Math.PI / 2
    arco(g, 0.32, 0.05, PIETRA_SCURA, 0, 0.64, 0.46, Math.PI, 10)
    for (const s of [-1, 1]) scatola(g, 0.09, 0.64, 0.09, mat(PIETRA_SCURA), s * 0.32, 0.32, 0.46)
    for (const [x, z] of [[-0.62, 0.64], [0.62, 0.62]]) botte(g, 0.2, 0.42, 0xa06a34, x, z)
    palla(g, 0.1, 0x4f9a45, 0.0, 1.0, 0.3, 1.4, 0.7, 1, 1)
    return { altezza: 1.1 }
  }),
  pozzo_coperto: decoro('pozzo_coperto', g => {
    cilindro(g, 0.38, 0.42, 0.55, mat(PIETRA), 0, 0.275, 0, 12); anello(g, 0.38, 0.05, PIETRA_SCURA, 0, 0.56, 0)
    cilindro(g, 0.31, 0.31, 0.02, mat(0x1d3a52), 0, 0.55, 0, 12)
    for (const s of [-1, 1]) scatola(g, 0.07, 1.15, 0.07, mat(LEGNO_SCURO), s * 0.36, 1.1, 0)
    scatola(g, 0.8, 0.07, 0.07, mat(LEGNO_SCURO), 0, 1.3, 0)
    const asse = cilindro(g, 0.045, 0.045, 0.7, mat(LEGNO), 0, 1.0, 0, 6); asse.rotation.z = Math.PI / 2
    filo(g, [0.4, 1.0, 0], [0.5, 0.85, 0.1], 0.02, LEGNO_SCURO); palla(g, 0.04, LEGNO_SCURO, 0.5, 0.82, 0.1, 1, 1, 1, 0)
    tetto(g, 1.1, 0.9, 1.65, 0xb4553a, 0.7)
    filo(g, [0, 1.0, 0], [0, 0.78, 0], 0.012, 0xe9dfc8)
    cilindro(g, 0.1, 0.08, 0.14, mat(0xa06a34), 0, 0.69, 0, 8); anello(g, 0.1, 0.014, 0x33343c, 0, 0.76, 0)
    return { altezza: 2.0 }
  }),
  mulino_acqua: decoro('mulino_acqua', g => {
    // sulla riva: la casa a sinistra, la ruota a destra (+x) con il canale; la ruota gira
    scatola(g, 1.8, 0.7, 1.5, mat(0xa8a395), -0.55, 0.35, 0)
    scatola(g, 1.7, 0.66, 1.4, mat(0xe9dfc8), -0.55, 1.03, 0)
    for (const x of [-1.35, -0.55, 0.25]) scatola(g, 0.07, 0.68, 1.46, mat(LEGNO_SCURO), x, 1.03, 0)
    for (const z of [-0.7, 0.7]) scatola(g, 1.78, 0.07, 0.07, mat(LEGNO_SCURO), -0.55, 1.03, z)
    scatola(g, 0.4, 0.6, 0.05, mat(LEGNO), -0.8, 0.95, 0.72); scatola(g, 0.3, 0.3, 0.04, mat(0x3a7ac0), -0.25, 1.1, 0.72)
    tetto(g, 1.95, 1.7, 1.36, 0xb4553a, 0.62)
    cilindro(g, 0.1, 0.1, 0.4, mat(PIETRA_SCURA), -1.1, 2.0, -0.2, 6)
    scatola(g, 1.1, 0.22, 1.2, mat(ACQUA), 0.95, 0.11, 0)                         // il canale sotto la ruota
    scatola(g, 1.18, 0.06, 1.28, mat(PIETRA_SCURA), 0.95, 0.03, 0)
    for (const z of [-0.64, 0.64]) scatola(g, 1.18, 0.28, 0.06, mat(PIETRA_SCURA), 0.95, 0.14, z)
    // la doccia di legno dall'alto sulla ruota
    scatola(g, 1.2, 0.06, 0.34, mat(LEGNO), 0.45, 1.88, 0); scatola(g, 1.2, 0.1, 0.04, mat(LEGNO_SCURO), 0.45, 1.92, 0.19); scatola(g, 1.2, 0.1, 0.04, mat(LEGNO_SCURO), 0.45, 1.92, -0.19)
    scatola(g, 1.2, 0.04, 0.26, mat(ACQUA), 0.45, 1.92, 0)
    for (const x of [-0.1, 0.9]) for (const z of [-0.2, 0.2]) scatola(g, 0.06, 1.0, 0.06, mat(LEGNO_SCURO), x, 1.38, z)
    // la ruota
    const ruota = new THREE.Group(); ruota.position.set(1.0, 0.95, 0); g.add(ruota)
    for (const dx of [-0.17, 0.17]) { const c = pronto(new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.04, 4, 16), mat(LEGNO))); c.rotation.y = Math.PI / 2; c.position.x = dx; ruota.add(c) }
    cilindro(ruota, 0.1, 0.1, 0.5, mat(LEGNO_SCURO), 0, 0, 0, 8).rotation.z = Math.PI / 2
    for (let i = 0; i < 8; i++) {
      const br = new THREE.Group(); br.rotation.x = i * Math.PI / 4; ruota.add(br)
      for (const dx of [-0.17, 0.17]) scatola(br, 0.05, 0.8, 0.05, mat(LEGNO), dx, 0.4, 0)
      scatola(br, 0.4, 0.05, 0.26, mat(LEGNO_SCURO), 0, 0.79, 0)
    }
    fondiPerMateriale(ruota)
    g.userData.ruota = ruota
    g.userData.anima = function (t) { this.ruota.rotation.x = -t * 0.9 }
    return { altezza: 2.4, escludi: [ruota] }
  }),

  ninfee: decoro('ninfee', g => {
    ninfea(g, 0, 0, 0.3, 0.05, 0.4); ninfea(g, 0.36, 0.3, 0.2, 0.05, 2.0); ninfea(g, -0.34, 0.22, 0.22, 0.05, 4.0); ninfea(g, -0.1, -0.36, 0.18, 0.05, 1.2)
    fioreNinfea(g, 0.0, 0.0, 0.05, 1.5); fioreNinfea(g, 0.36, 0.3, 0.05, 1.0, 0xfff4e6)
    return { altezza: 0.3 }
  }),
  ninfee_piccole: decoro('ninfee_piccole', g => {
    ninfea(g, 0.1, 0, 0.2, 0.05, 0.4); ninfea(g, -0.25, 0.2, 0.15, 0.05, 2.4); ninfea(g, 0.0, -0.3, 0.13, 0.05, 1.0)
    fioreNinfea(g, 0.1, 0, 0.05, 0.9, 0xfff4e6)
    return { altezza: 0.2 }
  }),
  canne: decoro('canne', (g, rnd) => {
    for (let i = 0; i < 9; i++) {
      const a = rnd() * 6.28, r = rnd() * 0.3, x = Math.cos(a) * r, z = Math.sin(a) * r, h = 0.9 + rnd() * 0.7, ang = (rnd() - 0.5) * 0.25
      const gr = new THREE.Group(); gr.position.set(x, 0, z); gr.rotation.z = ang; g.add(gr)
      cilindro(gr, 0.014, 0.022, h, mat(0x8aa63a), 0, h / 2, 0, 4)
      if (i % 3 !== 2) cilindro(gr, 0.04, 0.04, 0.2, mat(0x6b4a2e), 0, h + 0.06, 0, 6)           // il sigaro della typha, in cima allo stelo
      else cono(gr, 0.03, 0.2, mat(0x8aa63a), 0, h + 0.06, 0, 4)
      const f = palla(gr, 0.1, 0x7a9a30, 0.08, h * 0.35, 0, 0.6, 3.5, 0.15, 0); f.rotation.z = -0.4
    }
    return { altezza: 1.7 }
  }),
}

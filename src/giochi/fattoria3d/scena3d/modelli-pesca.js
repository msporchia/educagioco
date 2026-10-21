// Il molo (3×1 e 1×3, calpestabile) e il porticciolo (4×3: capanna con le reti, banchina e una barca ormeggiata), tutti in codice. Stesso
// contratto degli altri modelli di modelli.js: origine al centro dell'impronta, davanti verso +z, `userData.altezza` per il cartello e, per il
// porticciolo, `anima(tt)` (la barca dondola). Il molo è alto `alzato` (dati/catalogo.js, 0,14): il piano delle assi sta a quella quota, i pali
// scendono sotto l'acqua. Vedi docs/fattoria3d/geografia-e-pesca.md e scena.md.
import * as THREE from 'three'
import { mat, pronto, scatola, cilindro, cono, sfera, tetto, insegna } from './modelli.js'
import { fondiPerMateriale } from './fondi.js'
import { memoModello } from './cache-modelli.js'

const Q = 0.14                                                     // la quota del piano di chi cammina sul molo (come `alzato`)

// ── il molo: assi su pali, due bitte, una cima arrotolata e una cassetta di pesce; lungo `max(w, d)` celle ──
function costruisciMolo (w, d) {
  const g = new THREE.Group(), s = new THREE.Group()               // `s` si disegna lungo z e poi si gira se il molo è disteso lungo x
  const lungo = Math.max(w, d), L = lungo - 0.12
  const asse = [mat(0xa4723e), mat(0x946332), mat(0xb4824a)], trave = mat(0x5c3d22), palo = mat(0x4a3220), corda = mat(0xd8c08a), cassa = mat(0x8fb4c8)
  const N = Math.round(lungo * 3.6)
  for (let i = 0; i < N; i++) {
    const z = -L / 2 + (i + 0.5) * L / N
    const a = scatola(s, 0.9, 0.05, L / N - 0.04, asse[i % 3], Math.sin(i * 7.3) * 0.015, Q - 0.025, z); a.rotation.y = Math.sin(i * 3.1) * 0.02
  }
  for (const x of [-0.32, 0.32]) scatola(s, 0.09, 0.08, L, trave, x, Q - 0.1, 0)
  const zs = lungo > 2 ? [-L / 2 + 0.18, 0, L / 2 - 0.18] : [-L / 2 + 0.18, L / 2 - 0.18]
  for (const x of [-0.42, 0.42]) for (const z of zs) cilindro(s, 0.07, 0.085, Q + 0.62, palo, x, (Q - 0.5) / 2 + 0.05, z, 7)
  // le bitte alla punta e una cima arrotolata
  for (const x of [-0.36, 0.36]) cilindro(s, 0.055, 0.07, 0.2, palo, x, Q + 0.1, L / 2 - 0.1, 7)
  const matassa = pronto(new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 5, 10), corda)); matassa.rotation.x = Math.PI / 2; matassa.position.set(0.18, Q + 0.04, L / 2 - 0.42); s.add(matassa)
  // la cassetta del pescato a metà, con un pesce
  scatola(s, 0.3, 0.17, 0.26, cassa, -0.24, Q + 0.085, -0.1)
  const pesce = sfera(s, 0.07, mat(0xe9eef2), -0.24, Q + 0.18, -0.1, 1.6, 0.6, 0.7, 7); pesce.rotation.y = 0.5
  if (w > d) s.rotation.y = Math.PI / 2
  g.add(s)
  g.userData.altezza = 1.0
  fondiPerMateriale(g)
  return g
}

// ── il porticciolo: la capanna con le reti, la banchina di assi e la barca ormeggiata (dondola) ──
function costruisciPorticciolo () {
  const g = new THREE.Group()
  const legno = mat(0xa8774a), scuro = mat(0x5c3d22), asse = [mat(0xa4723e), mat(0x946332), mat(0xb4824a)], palo = mat(0x4a3220), corda = mat(0xd8c08a)
  // la banchina: assi su pali lungo tutto il fronte e ai due lati
  for (let i = 0; i < 18; i++) scatola(g, 0.2, 0.05, 1.45, asse[i % 3], -1.9 + i * 0.22, Q - 0.025, 0.78)
  for (const z of [0.2, 1.35]) scatola(g, 4.0, 0.08, 0.09, scuro, 0, Q - 0.1, z)
  for (const x of [-1.9, -0.65, 0.65, 1.9]) for (const z of [0.2, 1.35]) cilindro(g, 0.07, 0.085, Q + 0.62, palo, x, (Q - 0.5) / 2 + 0.05, z, 7)
  // la capanna: pareti d'assi, tetto azzurro a due falde, porta, finestrella e l'insegna
  scatola(g, 1.7, 1.0, 1.1, legno, -0.1, 0.5, -0.8)
  for (let i = 0; i < 6; i++) scatola(g, 0.03, 1.0, 1.12, scuro, -0.85 + i * 0.3, 0.5, -0.8)
  const falde = new THREE.Group(); falde.position.set(-0.1, 0, -0.8); g.add(falde)
  tetto(falde, 1.95, 1.45, 1.0, 0x3d7f9a, 0.5)
  scatola(g, 0.4, 0.72, 0.05, scuro, 0.3, 0.37, -0.23)
  scatola(g, 0.34, 0.3, 0.04, mat(0xa6d8ee, { emissive: 0x405a66 }), -0.55, 0.62, -0.23)
  insegna(g, '⚓ PORTO', 1.3, 0.3, -0.1, 1.12, -0.2, { w: 384, h: 88, sfondo: '#2f6f8f', px: 46 })
  // le reti stese ad asciugare, a destra: due pali e un filo con la rete appesa (una lastra sottile, d'un verde-azzurro)
  for (const z of [-1.1, -0.2]) cilindro(g, 0.04, 0.05, 1.3, palo, 1.55, 0.65, z, 6)
  scatola(g, 0.03, 0.03, 1.0, scuro, 1.55, 1.28, -0.65)
  const rete = scatola(g, 0.02, 0.78, 0.9, mat(0x5fb0a8, { transparent: true, opacity: 0.7 }), 1.55, 0.86, -0.65); rete.castShadow = false
  for (let k = 0; k < 3; k++) sfera(g, 0.05, mat(0xd8352a), 1.55, 0.5 + k * 0.01, -0.95 + k * 0.3, 1, 1, 1, 6)       // i galleggianti rossi della rete
  // i barili e le casse a sinistra della capanna
  cilindro(g, 0.18, 0.2, 0.42, mat(0x7b4a24), -1.55, 0.21, -1.1, 9); cilindro(g, 0.18, 0.2, 0.42, mat(0x7b4a24), -1.2, 0.21, -1.25, 9)
  scatola(g, 0.34, 0.26, 0.34, mat(0x8fb4c8), -1.5, 0.13, -0.6)
  // la barca: scafo rosso e bianco, una panca, un remo; ormeggiata con una cima alla bitta
  const barca = new THREE.Group(); barca.position.set(-0.95, Q + 0.12, 0.8); g.add(barca)
  const scafo = sfera(barca, 0.5, mat(0xc8402f), 0, 0.02, 0, 1.55, 0.42, 0.62, 12)
  sfera(barca, 0.47, mat(0xfff4e0), 0, 0.1, 0, 1.5, 0.3, 0.55, 12)
  scatola(barca, 0.08, 0.06, 0.62, legno, 0.05, 0.13, 0); scatola(barca, 0.08, 0.06, 0.62, legno, -0.4, 0.13, 0)
  const remo = cilindro(barca, 0.016, 0.016, 1.0, legno, 0.2, 0.28, 0.3, 5); remo.rotation.set(0.4, 0, 1.2)
  cono(barca, 0.07, 0.25, mat(0xf3c441), 0.62, 0.17, 0, 4).rotation.z = -Math.PI / 2           // la prua con una bandierina
  const cima = scatola(g, 0.02, 0.02, 0.65, corda, -0.35, Q + 0.2, 0.45); cima.rotation.y = 0.7
  cilindro(g, 0.055, 0.07, 0.22, palo, 0.1, Q + 0.1, 0.55, 7)
  // la lanterna sul palo davanti, a destra
  cilindro(g, 0.03, 0.04, 1.0, palo, 1.75, 0.55, 1.2, 6)
  const lanterna = sfera(g, 0.1, mat(0xffd36a, { emissive: 0xffb030, emissiveIntensity: 0.7 }), 1.75, 1.1, 1.2, 1, 1.2, 1, 8)
  g.userData.barca = barca; g.userData.lanterna = lanterna
  g.userData.anima = function (tt) {                                // pezzi.js la chiama a ogni fotogramma con il tempo
    this.barca.rotation.z = Math.sin(tt * 1.3) * 0.045; this.barca.rotation.x = Math.sin(tt * 0.9 + 1) * 0.02; this.barca.position.y = Q + 0.12 + Math.sin(tt * 1.6) * 0.012
    this.lanterna.material.emissiveIntensity = 0.7 + Math.sin(tt * 3) * 0.2
  }
  g.userData.altezza = 2.2
  fondiPerMateriale(barca); fondiPerMateriale(g, { escludi: [barca, lanterna] })
  void scafo
  return g
}

// la cache (scena3d/cache-modelli.js): costruiti e fusi una volta (il molo per misura), le istanze sono cloni
export const creaMolo = memoModello('molo', costruisciMolo, { chiave: (w, d) => w + 'x' + d })
export const creaPorticciolo = memoModello('porticciolo', costruisciPorticciolo)

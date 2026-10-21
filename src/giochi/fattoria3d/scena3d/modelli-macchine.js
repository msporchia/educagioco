// Le macchine della catena tessile e dello zucchero, tutte in codice: zuccherificio, telaio, sartoria, tintoria. Stesso contratto degli
// altri edifici unici di modelli.js: un Group 3×3 con l'origine al centro dell'impronta (dentro ±1,5), il fronte verso +z, e in
// `userData` `anima(dt, tt)` (la chiama pezzi.js), `fumo` (il punto da cui sale) e `altezza` (dove sta il cartello).
// Vedi docs/fattoria3d/scena.md.
import * as THREE from 'three'
import { mat, pronto, scatola, cilindro, cono, sfera, tetto, insegna, lastra } from './modelli.js'
import { fondiPerMateriale } from './fondi.js'

/** Tante copie della stessa forma: una geometria sola, un mesh per posto. */
function copie (g, geo, m, posti) {
  for (const [x, y, z, sy] of posti) { const o = pronto(new THREE.Mesh(geo, m)); o.position.set(x, y, z); if (sy) o.scale.y = sy; g.add(o) }
}

// ── lo zuccherificio: capannone con la ciminiera, la pila di barbabietole e i sacchi bianchi ──
export function creaZuccherificio () {
  const g = new THREE.Group()
  const muro = mat(0xdfe6ea), lamiera = mat(0x8fa4b3), mattone = mat(0xb5553a), bianco = mat(0xfbfaf6), legno = mat(0x7b4a24)
  lastra(g, 3.0, 2.9, 0xc6c9c9)
  scatola(g, 2.3, 1.3, 1.6, muro, -0.1, 0.65, -0.55)
  const falde = new THREE.Group(); falde.position.set(-0.1, 0, -0.55); g.add(falde)
  tetto(falde, 2.45, 1.6, 1.3, 0x5f7f99, 0.3)
  // la ciminiera a righe rosse e bianche, che fuma
  cilindro(g, 0.2, 0.26, 2.3, mattone, 0.95, 1.15, -0.85, 10)
  for (const y of [1.3, 1.85]) cilindro(g, 0.215, 0.215, 0.26, bianco, 0.95, y, -0.85, 10)
  g.userData.fumo = new THREE.Vector3(0.95, 2.4, -0.85)
  // la porta, due finestre di lamiera e l'insegna
  scatola(g, 0.6, 0.95, 0.08, legno, -0.7, 0.48, 0.27)
  for (const x of [0.2, 0.7]) scatola(g, 0.35, 0.3, 0.06, lamiera, x, 0.8, 0.27)
  insegna(g, '🧂 ZUCCHERO', 1.8, 0.34, -0.1, 1.2, 0.28, { w: 384, h: 76, sfondo: '#4d7aa3', px: 44 })
  // la pila delle barbabietole (viola-rosse), sulla sinistra
  const radice = mat(0x9c2f5c)
  copie(g, new THREE.SphereGeometry(0.17, 8, 6), radice, [[-1.15, 0.2, 0.7], [-0.9, 0.2, 0.95], [-1.2, 0.2, 1.05], [-1.0, 0.2, 0.55], [-1.05, 0.42, 0.85], [-0.85, 0.4, 0.65]])
  // i sacchi di zucchero a destra
  const sacco = new THREE.SphereGeometry(0.24, 8, 6)
  copie(g, sacco, bianco, [[0.6, 0.27, 0.95, 1.1], [1.0, 0.27, 0.8, 1.1], [0.8, 0.27, 1.2, 1.1], [0.8, 0.62, 0.95, 1.1]])
  // la vasca che bolle, davanti: l'acqua dello zucchero si increspa
  cilindro(g, 0.36, 0.4, 0.4, lamiera, 0.1, 0.2, 1.05, 12)
  const sciroppo = cilindro(g, 0.3, 0.3, 0.04, mat(0xf2c75a, { emissive: 0xd89a20, emissiveIntensity: 0.4 }), 0.1, 0.4, 1.05, 12)
  // la ruota dentata che gira sul fianco
  const ruota = new THREE.Group(); ruota.position.set(-1.3, 0.85, -0.5); g.add(ruota)
  cilindro(ruota, 0.34, 0.34, 0.1, lamiera, 0, 0, 0, 10).rotation.z = Math.PI / 2
  copie(ruota, new THREE.BoxGeometry(0.1, 0.16, 0.12), mat(0x5c7080), Array.from({ length: 8 }, (_, k) => [0, Math.cos(k * Math.PI / 4) * 0.38, Math.sin(k * Math.PI / 4) * 0.38]))
  g.userData.anima = (dt, tt) => { ruota.rotation.x += dt * 0.9; sciroppo.material.emissiveIntensity = 0.4 + Math.sin(tt * 5) * 0.15 }
  g.userData.altezza = 2.9
  fondiPerMateriale(ruota); fondiPerMateriale(g, { escludi: [ruota, sciroppo] })
  return g
}

// ── il telaio: la capanna di legno col grande telaio davanti e le balle di lana ──
export function creaTelaio () {
  const g = new THREE.Group()
  const asse = mat(0xb98a55), scuro = mat(0x6b4426), lana = mat(0xf4efe0), filo = mat(0xe8483a)
  lastra(g, 3.0, 2.9, 0xcdbf9f)
  scatola(g, 2.2, 1.2, 1.4, asse, -0.2, 0.6, -0.7)
  for (const x of [-1.0, -0.4, 0.2, 0.8]) scatola(g, 0.04, 1.2, 0.04, scuro, x - 0.2, 0.6, 0.01)       // le assi del fronte
  const falde = new THREE.Group(); falde.position.set(-0.2, 0, -0.7); g.add(falde)
  tetto(falde, 2.45, 1.4, 1.2, 0xa8843c, 0.45)
  scatola(g, 0.5, 0.85, 0.08, scuro, -0.9, 0.43, 0.02)
  insegna(g, '🧵 TELAIO', 1.5, 0.32, -0.2, 1.08, 0.04, { w: 384, h: 76, sfondo: '#76512a', px: 46 })
  // il grande telaio: due montanti, due traverse e i fili tesi; la navetta ci scorre in mezzo
  const telaio = new THREE.Group(); telaio.position.set(0.55, 0, 0.95); g.add(telaio)
  for (const x of [-0.6, 0.6]) scatola(telaio, 0.1, 1.35, 0.1, scuro, x, 0.68, 0)
  for (const y of [0.35, 1.25]) scatola(telaio, 1.3, 0.09, 0.09, scuro, 0, y, 0)
  copie(telaio, new THREE.BoxGeometry(0.015, 0.86, 0.015), filo, Array.from({ length: 9 }, (_, k) => [-0.5 + k * 0.125, 0.8, 0]))
  scatola(telaio, 1.0, 0.36, 0.02, mat(0xe8483a), 0, 0.53, 0)          // la stoffa già tessuta, in basso
  const navetta = scatola(telaio, 0.22, 0.07, 0.07, mat(0xf2d08a), 0, 0.8, 0.03)
  // le balle di lana, a sinistra
  copie(g, new THREE.SphereGeometry(0.3, 8, 6), lana, [[-1.15, 0.28, 0.85, 0.85], [-0.75, 0.26, 1.15, 0.85], [-1.2, 0.26, 1.2, 0.85], [-1.0, 0.62, 1.0, 0.85]])
  cilindro(g, 0.18, 0.18, 0.28, lana, -0.4, 0.14, 1.2, 8)
  g.userData.anima = (dt, tt) => { navetta.position.x = Math.sin(tt * 1.8) * 0.5 }
  g.userData.altezza = 2.1
  fondiPerMateriale(g, { escludi: [navetta] })
  return g
}

// ── la sartoria: la casetta col manichino davanti e l'ago gigante nel rocchetto ──
export function creaSartoria () {
  const g = new THREE.Group()
  const muro = mat(0xf3dcec), viola = mat(0x7f4fa6), legno = mat(0x7b4a24), pelle = mat(0xe6cfa8), argento = mat(0xdadfe4, { metalness: 0.6, roughness: 0.35 })
  lastra(g, 3.0, 2.9, 0xd9cdd8)
  scatola(g, 2.5, 1.2, 1.5, muro, -0.1, 0.6, -0.65)
  const falde = new THREE.Group(); falde.position.set(-0.1, 0, -0.65); g.add(falde)
  tetto(falde, 2.7, 1.5, 1.2, 0x7f4fa6, 0.55)
  scatola(g, 0.55, 0.9, 0.08, legno, 0.7, 0.45, 0.13)
  scatola(g, 0.9, 0.5, 0.06, mat(0xa6d8ee, { emissive: 0x405a66 }), -0.55, 0.8, 0.12)
  insegna(g, '🧥 SARTORIA', 1.7, 0.32, -0.1, 1.28, 0.14, { w: 384, h: 72, sfondo: '#6f3f98', px: 44 })
  // il manichino su un palo, con la sciarpa
  const man = new THREE.Group(); man.position.set(-0.85, 0, 1.0); g.add(man)
  cilindro(man, 0.05, 0.05, 1.0, legno, 0, 0.5, 0, 6)
  cilindro(man, 0.2, 0.28, 0.55, pelle, 0, 1.15, 0, 8)
  sfera(man, 0.1, pelle, 0, 1.55, 0, 1, 1.1, 1, 8)
  cilindro(man, 0.24, 0.24, 0.07, mat(0xd8352a), 0, 1.38, 0, 8)
  cilindro(man, 0.2, 0.22, 0.04, legno, 0, 0.04, 0, 8)
  // il tavolo da lavoro con le pezze di stoffa e la macchina da cucire
  scatola(g, 1.2, 0.5, 0.6, legno, 0.55, 0.25, 1.05)
  copie(g, new THREE.BoxGeometry(0.34, 0.1, 0.4), viola, [[0.2, 0.55, 1.05], [0.2, 0.65, 1.05]])
  scatola(g, 0.3, 0.2, 0.2, mat(0x2f3a44), 0.8, 0.6, 1.05)
  // l'ago gigante piantato in un rocchetto, a destra: oscilla piano, col filo che esce dalla cruna
  cilindro(g, 0.2, 0.2, 0.3, mat(0xd8352a), 1.3, 0.15, 0.55, 8)
  const ago = new THREE.Group(); ago.position.set(1.3, 0.85, 0.55); g.add(ago)
  cilindro(ago, 0.025, 0.025, 1.0, argento, 0, 0, 0, 5)
  cono(ago, 0.025, 0.12, argento, 0, -0.55, 0, 5).rotation.x = Math.PI
  const cruna = pronto(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 4, 8), argento)); cruna.position.y = 0.38; ago.add(cruna)
  const filo = pronto(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 4, 10, Math.PI), mat(0xd8352a))); filo.position.set(0, 0.38, 0); filo.rotation.z = Math.PI; ago.add(filo)
  ago.rotation.z = 0.2
  g.userData.anima = (dt, tt) => { man.rotation.y += dt * 0.6; ago.rotation.z = 0.2 + Math.sin(tt * 1.4) * 0.1 }
  g.userData.altezza = 2.7
  fondiPerMateriale(man); fondiPerMateriale(ago); fondiPerMateriale(g, { escludi: [man, ago] })
  return g
}

// ── la tintoria: il capanno aperto con le vasche colorate e le stoffe stese ad asciugare ──
export function creaTintoria () {
  const g = new THREE.Group()
  const legno = mat(0x7b4a24), pietra = mat(0x9a948a), scuro = mat(0x4a3a2a)
  lastra(g, 3.0, 2.9, 0xc9c2b0)
  // il capanno: quattro pali e un tetto, dietro; sotto, le tre vasche
  for (const [x, z] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 0.2], [1.2, 0.2]]) cilindro(g, 0.07, 0.07, 1.5, legno, x, 0.75, z, 6)
  const falde = new THREE.Group(); falde.position.set(0, 0, -0.5); g.add(falde)
  tetto(falde, 2.8, 1.8, 1.5, 0x3d8f8a, 0.3)
  insegna(g, '🧴 TINTORIA', 1.6, 0.32, 0, 1.55, 0.42, { w: 384, h: 72, sfondo: '#247873', px: 44 })
  const liquidi = [0x8a3aa8, 0x2fb4a8, 0xe0408a].map(c => mat(c, { emissive: c, emissiveIntensity: 0.35, roughness: 0.3 }))
  const bagni = []
  liquidi.forEach((m, k) => {
    const x = -0.85 + k * 0.85
    cilindro(g, 0.4, 0.34, 0.5, pietra, x, 0.25, -0.5, 10)
    bagni.push(cilindro(g, 0.34, 0.34, 0.03, m, x, 0.5, -0.5, 10))
  })
  // le stoffe stese su un filo davanti, a destra e a sinistra
  for (const x of [-1.2, 1.2]) cilindro(g, 0.04, 0.04, 1.1, legno, x, 0.55, 1.1, 5)
  scatola(g, 2.5, 0.03, 0.03, scuro, 0, 1.08, 1.1)
  const panni = [0x8a3aa8, 0x2fb4a8, 0xe0408a, 0xf2c44a].map((c, k) => {
    const p = scatola(g, 0.4, 0.62, 0.02, mat(c), -0.9 + k * 0.6, 0.76, 1.1); p.userData.fase = k; return p
  })
  // la caldaia sul fuoco, a destra: da lì sale il fumo
  cilindro(g, 0.3, 0.34, 0.5, mat(0x5a5a5e, { metalness: 0.5, roughness: 0.5 }), 1.05, 0.3, 0.45, 10)
  scatola(g, 0.5, 0.12, 0.5, scuro, 1.05, 0.06, 0.45)
  g.userData.fumo = new THREE.Vector3(1.05, 0.7, 0.45)
  g.userData.anima = (dt, tt) => {
    bagni.forEach((b, k) => { b.material.emissiveIntensity = 0.35 + Math.sin(tt * 2.2 + k * 2) * 0.15 })
    for (const p of panni) p.rotation.y = Math.sin(tt * 1.6 + p.userData.fase) * 0.12
  }
  g.userData.altezza = 2.3
  fondiPerMateriale(g, { escludi: [...bagni, ...panni] })
  return g
}

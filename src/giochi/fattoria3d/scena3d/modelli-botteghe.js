// Le quattro botteghe del paese, tutte in codice: pasticceria, osteria, mensa della scuola, merceria. Stesso contratto degli altri edifici
// unici (modelli-macchine.js): un Group 3×3 con l'origine al centro dell'impronta (dentro ±1,5), il fronte verso +z, e in `userData`
// `anima(dt, tt)` (la chiama pezzi.js) e `altezza` (dove sta il cartello). Non lavorano, quindi niente fumo: la vita sta in un dettaglio che
// si muove piano (la lanterna, la bandiera, la bobina sul tetto). Pochi pezzi per bottega e fusi per materiale: il peso è quello di una
// macchina media (docs/fattoria3d/scena.md, «Qualità e peso»). Vedi docs/fattoria3d/botteghe.md.
import * as THREE from 'three'
import { mat, scatola, cilindro, cono, sfera, tetto, insegna, lastra } from './modelli.js'
import { fondiPerMateriale } from './fondi.js'
import { memoModello } from './cache-modelli.js'

/** Il telo a righe sopra la vetrina: strisce alternate, inclinate in avanti. */
function telo (g, larg, colori, y, z, profondita = 0.7) {
  const n = 8, w = larg / n, falda = new THREE.Group(); falda.position.set(0, y, z); falda.rotation.x = 0.32; g.add(falda)
  for (let k = 0; k < n; k++) scatola(falda, w, 0.05, profondita, mat(colori[k % colori.length]), -larg / 2 + w * (k + 0.5), 0, 0)
  return falda
}

// ── la pasticceria: casetta rosa con la vetrina delle torte, il telo a righe e un cupcake gigante sul tetto ──
function costruisciPasticceria () {
  const g = new THREE.Group()
  const rosa = mat(0xf6c6d4), crema = mat(0xfff3d6), cioccolato = mat(0x6b4026), fragola = mat(0xe8486e), vetro = mat(0xbfe4ee, { roughness: 0.3, transparent: true, opacity: 0.8 }), legno = mat(0x8a5a3a)
  lastra(g, 3.0, 2.9, 0xe6d3b8)
  scatola(g, 2.4, 1.3, 1.5, rosa, 0, 0.65, -0.55)
  const falde = new THREE.Group(); falde.position.set(0, 1.3, -0.55); g.add(falde)
  tetto(falde, 2.6, 1.7, 0, 0xc2788f, 0.42)
  scatola(g, 1.5, 0.62, 0.05, vetro, -0.3, 0.7, 0.21)                                                    // la vetrina
  scatola(g, 1.6, 0.06, 0.1, cioccolato, -0.3, 0.38, 0.23)
  scatola(g, 0.5, 0.95, 0.06, legno, 0.85, 0.48, 0.21)                                                   // la porta
  telo(g, 2.2, [0xe8486e, 0xfffaf0], 1.18, 0.4)
  // il banco davanti con tre torte: base di crema, panna sopra, una ciliegia
  scatola(g, 2.0, 0.42, 0.45, legno, 0, 0.21, 1.1)
  scatola(g, 2.1, 0.05, 0.55, crema, 0, 0.44, 1.1)
  for (const [x, c] of [[-0.65, 0xe8486e], [0, 0xf3c441], [0.65, 0x9c6a3a]]) {
    cilindro(g, 0.24, 0.26, 0.2, mat(c), x, 0.57, 1.1, 10); cilindro(g, 0.2, 0.2, 0.06, crema, x, 0.7, 1.1, 10); sfera(g, 0.05, fragola, x, 0.77, 1.1, 1, 1, 1, 6)
  }
  insegna(g, '🧁 DOLCI', 1.5, 0.3, 0, 1.0, 0.24, { w: 384, h: 72, sfondo: '#c2788f', px: 44 })
  // il cupcake gigante sul tetto: pirottino, panna a spirale, ciliegia
  const cupcake = new THREE.Group(); cupcake.position.set(0.6, 1.6, -0.55); g.add(cupcake)
  cono(cupcake, 0.3, 0.38, mat(0xd8a35a), 0, 0.19, 0, 10).rotation.x = Math.PI
  sfera(cupcake, 0.32, crema, 0, 0.5, 0, 1, 0.8, 1, 10); sfera(cupcake, 0.21, rosa, 0, 0.72, 0, 1, 0.8, 1, 8); sfera(cupcake, 0.07, fragola, 0, 0.92, 0, 1, 1, 1, 6)
  g.userData.cupcake = cupcake
  g.userData.anima = function (dt, tt) { this.cupcake.rotation.y += dt * 0.7; this.cupcake.position.y = 1.6 + Math.sin(tt * 1.6) * 0.03 }
  g.userData.altezza = 3.0
  fondiPerMateriale(cupcake); fondiPerMateriale(g, { escludi: [cupcake] })
  return g
}

// ── l'osteria: la locanda di sasso col tetto rosso, le botti, il tavolo apparecchiato e la lanterna accesa ──
function costruisciOsteria () {
  const g = new THREE.Group()
  const sasso = mat(0xcdbfa6), legno = mat(0x7b4a24), scuro = mat(0x4a3224), rosso = mat(0xb23a2e), tovaglia = mat(0xfff7ea), vino = mat(0x7a1f3a), bottiglia = mat(0x2f6b3a)
  lastra(g, 3.0, 2.9, 0xcbbf9e)
  scatola(g, 2.5, 1.35, 1.5, sasso, -0.1, 0.68, -0.6)
  for (const x of [-1.2, 0.0, 1.0]) scatola(g, 0.1, 1.35, 0.1, scuro, x, 0.68, 0.17)                      // le travi a vista
  const falde = new THREE.Group(); falde.position.set(-0.1, 1.35, -0.6); g.add(falde)
  tetto(falde, 2.75, 1.7, 0, 0xb23a2e, 0.5)
  scatola(g, 0.55, 0.95, 0.06, legno, 0.55, 0.48, 0.17)                                                  // la porta
  for (const x of [-0.8, -0.2]) scatola(g, 0.4, 0.36, 0.05, scuro, x, 0.62, 0.17)                         // due finestrelle
  insegna(g, '🍷 OSTERIA', 1.7, 0.32, -0.45, 1.1, 0.2, { w: 384, h: 76, sfondo: '#7a1f3a', px: 42 })
  // le due botti, a sinistra
  for (const [x, z] of [[-1.15, 0.6], [-0.8, 0.95]]) {
    cilindro(g, 0.24, 0.24, 0.5, legno, x, 0.25, z, 10); cilindro(g, 0.255, 0.255, 0.04, scuro, x, 0.12, z, 10); cilindro(g, 0.255, 0.255, 0.04, scuro, x, 0.4, z, 10)
  }
  // il tavolo apparecchiato a destra: tovaglia, bottiglia, due calici
  cilindro(g, 0.5, 0.5, 0.05, tovaglia, 0.75, 0.55, 0.95, 12); cilindro(g, 0.06, 0.08, 0.5, legno, 0.75, 0.27, 0.95, 6)
  cilindro(g, 0.05, 0.06, 0.26, bottiglia, 0.75, 0.7, 0.95, 6)
  for (const dx of [-0.2, 0.2]) cilindro(g, 0.05, 0.035, 0.1, vino, 0.75 + dx, 0.62, 1.05, 6)
  for (const dx of [-0.2, 0.2]) { scatola(g, 0.28, 0.05, 0.28, legno, 0.75 + dx * 2, 0.3, 0.95); }      // gli sgabelli
  // la lanterna accesa, appesa alla trave del davanti
  scatola(g, 0.05, 0.3, 0.05, scuro, 1.05, 1.05, 0.3)
  const lanterna = sfera(g, 0.12, mat(0xffc15a, { emissive: 0xf09a20, emissiveIntensity: 0.7 }), 1.05, 0.82, 0.3, 1, 1.2, 1, 8)
  g.userData.lanterna = lanterna
  g.userData.anima = function (dt, tt) { this.lanterna.material.emissiveIntensity = 0.7 + Math.sin(tt * 3.1) * 0.2 }
  g.userData.altezza = 2.8
  fondiPerMateriale(g, { escludi: [lanterna] })
  return g
}

// ── la mensa della scuola: il lungo edificio giallo e azzurro con la campanella, la bandiera e i tavoli con le panche ──
function costruisciMensa () {
  const g = new THREE.Group()
  const giallo = mat(0xf3d98b), azzurro = mat(0x6aa8d8), bianco = mat(0xfffaf0), legno = mat(0x8a5a3a), scuro = mat(0x4a3224), rosso = mat(0xd8352a), verde = mat(0x5aa84a)
  lastra(g, 3.0, 2.9, 0xd8cfae)
  scatola(g, 2.7, 1.2, 1.35, giallo, 0, 0.6, -0.7)
  scatola(g, 2.8, 0.18, 1.5, azzurro, 0, 1.28, -0.7)                                                     // il tetto piatto, azzurro
  for (const x of [-0.9, -0.3, 0.3]) scatola(g, 0.4, 0.4, 0.05, mat(0xbfe4ee), x, 0.78, 0.0)              // le finestre
  scatola(g, 0.6, 0.95, 0.06, azzurro, 1.0, 0.48, 0.0)                                                   // la porta
  insegna(g, '🏫 MENSA', 1.5, 0.3, -0.35, 1.1, 0.03, { w: 384, h: 72, sfondo: '#3f7fb5', px: 44 })
  // la campanella sul tetto
  cilindro(g, 0.06, 0.06, 0.3, scuro, -0.9, 1.5, -0.7, 6)
  cono(g, 0.14, 0.2, mat(0xd8a830), -0.9, 1.72, -0.7, 8)
  // il palo con la bandiera (si muove)
  cilindro(g, 0.03, 0.03, 1.9, bianco, 1.25, 0.95, -1.1, 6)
  const bandiera = new THREE.Group(); bandiera.position.set(1.25, 1.65, -1.1); g.add(bandiera)
  scatola(bandiera, 0.5, 0.3, 0.02, rosso, 0.27, 0, 0)
  // due tavoli con le panche e due mele nella cassetta
  for (const x of [-0.75, 0.15]) {
    scatola(g, 0.7, 0.05, 0.4, legno, x, 0.45, 1.05); for (const dx of [-0.3, 0.3]) scatola(g, 0.05, 0.43, 0.05, legno, x + dx, 0.22, 1.05)
    for (const dz of [-0.35, 0.35]) scatola(g, 0.7, 0.04, 0.14, legno, x, 0.28, 1.05 + dz)
  }
  scatola(g, 0.4, 0.2, 0.3, legno, 1.0, 0.1, 1.0)
  for (const dx of [-0.1, 0.1]) sfera(g, 0.08, rosso, 1.0 + dx, 0.24, 1.0, 1, 1, 1, 6)
  sfera(g, 0.07, verde, 1.0, 0.27, 1.07, 1, 1, 1, 6)
  g.userData.bandiera = bandiera
  g.userData.anima = function (dt, tt) { this.bandiera.rotation.y = Math.sin(tt * 2.4) * 0.35 }
  g.userData.altezza = 2.8
  fondiPerMateriale(bandiera); fondiPerMateriale(g, { escludi: [bandiera] })
  return g
}

// ── la merceria: la bottega lilla col telo a righe, gli scaffali di bobine, il manichino e la bobina gigante sul tetto ──
function costruisciMerceria () {
  const g = new THREE.Group()
  const lilla = mat(0xcdb6e6), viola = mat(0x7a5aa8), legno = mat(0x8a5a3a), bianco = mat(0xfffaf0), vetro = mat(0xbfe4ee, { roughness: 0.3, transparent: true, opacity: 0.8 }), pelle = mat(0xe8d2b4)
  lastra(g, 3.0, 2.9, 0xd9ccb6)
  scatola(g, 2.4, 1.3, 1.5, lilla, 0, 0.65, -0.55)
  const falde = new THREE.Group(); falde.position.set(0, 1.3, -0.55); g.add(falde)
  tetto(falde, 2.6, 1.7, 0, 0x7a5aa8, 0.42)
  scatola(g, 1.3, 0.62, 0.05, vetro, -0.45, 0.72, 0.21)
  scatola(g, 0.5, 0.95, 0.06, legno, 0.85, 0.48, 0.21)
  telo(g, 2.2, [0x7a5aa8, 0xfffaf0], 1.18, 0.4)
  insegna(g, '🧶 FILI', 1.4, 0.3, 0, 1.0, 0.24, { w: 384, h: 72, sfondo: '#7a5aa8', px: 44 })
  // lo scaffale davanti con le bobine di tutti i colori (cilindri della stessa forma)
  scatola(g, 1.9, 0.08, 0.4, legno, -0.1, 0.32, 1.05); scatola(g, 1.9, 0.08, 0.4, legno, -0.1, 0.62, 1.05)
  scatola(g, 0.06, 0.65, 0.4, legno, -1.05, 0.33, 1.05); scatola(g, 0.06, 0.65, 0.4, legno, 0.85, 0.33, 1.05)
  const colori = [0xe8486e, 0xf3c441, 0x4aa86a, 0x4a7fd0, 0xe8803a, 0xffffff]
  const bobina = new THREE.CylinderGeometry(0.1, 0.1, 0.22, 8), ms = colori.map(c => mat(c))
  colori.forEach((c, k) => {
    for (const y of [0.45, 0.75]) { const o = new THREE.Mesh(bobina, ms[(k + (y > 0.5 ? 2 : 0)) % ms.length]); o.position.set(-0.85 + k * 0.3, y, 1.05); o.castShadow = true; g.add(o) }
  })
  // il manichino a destra: busto, collo e un cartamodello
  cono(g, 0.2, 0.6, pelle, 1.2, 0.65, 0.95, 8); cilindro(g, 0.05, 0.06, 0.16, pelle, 1.2, 1.03, 0.95, 6); sfera(g, 0.07, pelle, 1.2, 1.15, 0.95, 1, 1, 1, 6); cilindro(g, 0.03, 0.03, 0.35, legno, 1.2, 0.17, 0.95, 6)
  // la bobina gigante sul tetto, che gira
  const grande = new THREE.Group(); grande.position.set(0.6, 1.9, -0.55); g.add(grande)
  cilindro(grande, 0.34, 0.34, 0.08, legno, 0, 0.2, 0, 10); cilindro(grande, 0.34, 0.34, 0.08, legno, 0, -0.2, 0, 10)
  cilindro(grande, 0.25, 0.25, 0.32, mat(0xe8486e), 0, 0, 0, 10)
  g.userData.grande = grande
  g.userData.anima = function (dt) { this.grande.rotation.y += dt * 1.1 }
  g.userData.altezza = 3.0
  fondiPerMateriale(grande); fondiPerMateriale(g, { escludi: [grande] })
  return g
}

export const creaBottegaPasticceria = memoModello('bottega_pasticceria', costruisciPasticceria)
export const creaBottegaOsteria = memoModello('bottega_osteria', costruisciOsteria)
export const creaBottegaMensa = memoModello('bottega_mensa', costruisciMensa)
export const creaBottegaMerceria = memoModello('bottega_merceria', costruisciMerceria)

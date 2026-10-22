// Le macchine della catena tessile e dello zucchero, tutte in codice: zuccherificio, telaio, sartoria, tintoria. Stesso contratto degli
// altri edifici unici di modelli.js: un Group 3×3 con l'origine al centro dell'impronta (dentro ±1,5), il fronte verso +z, e in
// `userData` `anima(dt, tt)` (la chiama pezzi.js), `fumo` (il punto da cui sale) e `altezza` (dove sta il cartello).
// Vedi docs/fattoria3d/scena.md.
import * as THREE from 'three'
import { mat, pronto, scatola, cilindro, cono, sfera, tetto, insegna, lastra } from './modelli.js'
import { fondiPerMateriale } from './fondi.js'
import { memoModello } from './cache-modelli.js'

/** Tante copie della stessa forma: una geometria sola, un mesh per posto. */
function copie (g, geo, m, posti) {
  for (const [x, y, z, sy] of posti) { const o = pronto(new THREE.Mesh(geo, m)); o.position.set(x, y, z); if (sy) o.scale.y = sy; g.add(o) }
}

// ── lo zuccherificio: capannone con la ciminiera, la pila di barbabietole e i sacchi bianchi ──
function costruisciZuccherificio () {
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
  g.userData.ruota = ruota; g.userData.sciroppo = sciroppo
  g.userData.anima = function (dt, tt) { this.ruota.rotation.x += dt * 0.9; this.sciroppo.material.emissiveIntensity = 0.4 + Math.sin(tt * 5) * 0.15 }
  g.userData.altezza = 2.9
  fondiPerMateriale(ruota); fondiPerMateriale(g, { escludi: [ruota, sciroppo] })
  return g
}

// ── il telaio: la capanna di legno col grande telaio davanti e le balle di lana ──
function costruisciTelaio () {
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
  g.userData.navetta = navetta; g.userData.anima = function (dt, tt) { this.navetta.position.x = Math.sin(tt * 1.8) * 0.5 }
  g.userData.altezza = 2.1
  fondiPerMateriale(g, { escludi: [navetta] })
  return g
}

// ── la sartoria: la casetta col manichino davanti e l'ago gigante nel rocchetto ──
function costruisciSartoria () {
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
  g.userData.man = man; g.userData.ago = ago
  g.userData.anima = function (dt, tt) { this.man.rotation.y += dt * 0.6; this.ago.rotation.z = 0.2 + Math.sin(tt * 1.4) * 0.1 }
  g.userData.altezza = 2.7
  fondiPerMateriale(man); fondiPerMateriale(ago); fondiPerMateriale(g, { escludi: [man, ago] })
  return g
}

// ── la tintoria: il capanno aperto con le vasche colorate e le stoffe stese ad asciugare ──
function costruisciTintoria () {
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
  g.userData.bagni = bagni; g.userData.panni = panni
  g.userData.anima = function (dt, tt) {
    this.bagni.forEach((b, k) => { b.material.emissiveIntensity = 0.35 + Math.sin(tt * 2.2 + k * 2) * 0.15 })
    for (const p of this.panni) p.rotation.y = Math.sin(tt * 1.6 + p.userData.fase) * 0.12
  }
  g.userData.altezza = 2.3
  fondiPerMateriale(g, { escludi: [...bagni, ...panni] })
  return g
}

// ── il fienile (la macchina del mangime): capanna rossa aperta davanti, piena di balle, con una balla tonda che gira piano ──
// Non è il fienile di scena di `modelli.js` (`creaFienile`, 4×3, un fisso): questo si costruisce, si sposta e fa il foraggio e il becchime.
function costruisciFienileMacchina () {
  const g = new THREE.Group()
  const asse = mat(0xb4553a), scuro = mat(0x6b3a24), paglia = mat(0xe3c25a), paglia2 = mat(0xcfa845), legaccio = mat(0x8a6a2a)
  lastra(g, 3.0, 2.9, 0xd2c08a)
  // il fondo e i due fianchi: davanti è aperto, si vede il fieno
  scatola(g, 2.3, 1.5, 0.12, asse, -0.1, 0.75, -1.0)
  for (const s of [-1, 1]) scatola(g, 0.12, 1.5, 1.4, asse, -0.1 + s * 1.12, 0.75, -0.35)
  const falde = new THREE.Group(); falde.position.set(-0.1, 0, -0.45); g.add(falde)
  tetto(falde, 2.55, 1.7, 1.5, 0x6d5a50, 0.5)
  scatola(g, 0.14, 1.5, 0.14, scuro, -1.2, 0.75, 0.3); scatola(g, 0.14, 1.5, 0.14, scuro, 1.0, 0.75, 0.3)          // i due pali del davanti
  // dentro: le balle quadre impilate, a piramide
  for (const [x, y, z] of [[-0.55, 0.2, -0.6], [0, 0.2, -0.6], [0.55, 0.2, -0.6], [-0.28, 0.58, -0.6], [0.28, 0.58, -0.6], [0, 0.96, -0.6]]) {
    scatola(g, 0.52, 0.36, 0.5, ((x + y) * 10 | 0) % 2 ? paglia : paglia2, x - 0.1, y, z)
    scatola(g, 0.54, 0.04, 0.52, legaccio, x - 0.1, y, z)
  }
  // davanti, a destra: due balle tonde in piedi e quella che gira
  const tonda = (x, z, y = 0.32) => { const c = cilindro(g, 0.32, 0.32, 0.5, paglia, x, y, z, 12); c.rotation.z = Math.PI / 2; return c }
  tonda(0.85, 0.95); tonda(0.5, 1.2)
  const balla = tonda(0.9, 1.15, 0.8)
  scatola(g, 1.5, 0.05, 0.05, legaccio, -0.1, 0.1, 1.4)                                                            // una tavola per terra: dove si carica
  insegna(g, '🌿 FIENILE', 1.6, 0.34, -0.1, 1.72, 0.9, { w: 384, h: 76, sfondo: '#5b7a2c', px: 44 })
  g.userData.balla = balla
  g.userData.anima = function (dt) { this.balla.rotation.x += dt * 0.5 }
  g.userData.altezza = 2.6
  fondiPerMateriale(g, { escludi: [balla] })
  return g
}

// ── la friggitoria: il baracchino giallo con il tendone a righe, due friggitrici sul banco e il cartoccio gigante di patatine sul tetto ──
function costruisciFriggitoria () {
  const g = new THREE.Group()
  const giallo = mat(0xf2cf5a), rosso = mat(0xc8402f), bianco = mat(0xfff7ea), legno = mat(0x8a5a3a), acciaio = mat(0xb9c2c9, { metalness: 0.6, roughness: 0.35 })
  lastra(g, 3.0, 2.9, 0xd9c7a0)
  scatola(g, 2.4, 1.2, 1.4, giallo, 0, 0.6, -0.6)
  scatola(g, 2.7, 0.14, 1.7, rosso, 0, 1.27, -0.55)
  // il tendone a righe rosse e bianche sul davanti
  for (let n = 0; n < 8; n++) { const t = scatola(g, 0.34, 0.05, 0.85, n % 2 ? bianco : rosso, -1.19 + n * 0.34, 1.08, 0.7); t.rotation.x = 0.28 }
  for (const x of [-1.25, 1.25]) cilindro(g, 0.04, 0.04, 1.05, legno, x, 0.52, 1.1, 6)
  // il banco con due friggitrici: vasca d'acciaio, olio che brilla, cestello col manico
  scatola(g, 2.2, 0.55, 0.55, legno, 0, 0.28, 0.85)
  scatola(g, 2.3, 0.05, 0.65, mat(0xe8d8c0), 0, 0.58, 0.85)
  const olio = []
  for (const x of [-0.55, 0.45]) {
    scatola(g, 0.62, 0.28, 0.42, acciaio, x, 0.74, 0.85)
    olio.push(scatola(g, 0.5, 0.03, 0.3, mat(0xf0b030, { emissive: 0xe08a10, emissiveIntensity: 0.45 }), x, 0.89, 0.85))
    scatola(g, 0.3, 0.025, 0.04, mat(0x2a2a2e), x + 0.1, 0.95, 0.85)
  }
  // i cartocci di patatine sul banco e le bottigliette di salsa
  for (const [x, c] of [[1.0, 0xc8402f], [0.78, 0xfff7ea], [-1.0, 0xc8402f]]) {
    cono(g, 0.09, 0.2, mat(c), x, 0.7, 0.9, 6).rotation.x = Math.PI
    for (let k = 0; k < 4; k++) scatola(g, 0.025, 0.14, 0.025, mat(0xf3c441), x - 0.04 + k * 0.027, 0.86, 0.9)
  }
  for (const [x, c] of [[-0.05, 0xd8352a], [0.05, 0xf3c441]]) cilindro(g, 0.03, 0.035, 0.14, mat(c), x, 0.67, 0.7, 6)
  insegna(g, '🍟 FRITTI', 1.7, 0.32, 0, 1.0, 0.1, { w: 384, h: 76, sfondo: '#c8402f', px: 44 })
  // un pesce di latta sulla porta (la friggitoria frigge anche il pesce)
  const pesce = new THREE.Group(); pesce.position.set(-0.85, 0.5, 0.11); g.add(pesce)
  sfera(pesce, 0.13, mat(0x6aa0c8), 0, 0, 0, 1.6, 0.8, 0.3, 8); cono(pesce, 0.09, 0.14, mat(0x6aa0c8), -0.24, 0, 0, 4).rotation.z = Math.PI / 2
  // il cartoccio gigante sul tetto: patatine d'oro che sbucano
  const cartoccio = new THREE.Group(); cartoccio.position.set(0.7, 1.34, -0.55); g.add(cartoccio)
  cono(cartoccio, 0.32, 0.6, rosso, 0, 0.3, 0, 8).rotation.x = Math.PI
  for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, r = 0.1 + (k % 3) * 0.04; const f = scatola(cartoccio, 0.07, 0.42 + (k % 4) * 0.06, 0.07, mat(0xf3c441), Math.cos(a) * r, 0.78, Math.sin(a) * r); f.rotation.set(Math.sin(a) * 0.25, a, Math.cos(a) * 0.25) }
  g.userData.fumo = new THREE.Vector3(-0.55, 1.05, 0.85)
  g.userData.olio = olio; g.userData.cartoccio = cartoccio
  g.userData.anima = function (dt, tt) { this.cartoccio.rotation.y += dt * 0.8; this.olio[0].material.emissiveIntensity = 0.45 + Math.sin(tt * 7) * 0.15 }
  g.userData.altezza = 3.0
  fondiPerMateriale(cartoccio); fondiPerMateriale(pesce); fondiPerMateriale(g, { escludi: [cartoccio, ...olio] })
  return g
}

// ── il sushi bar: il chiosco giapponese di legno scuro, il tetto a due piani, il noren rosso che ondeggia, il bancone coi piattini e due lanterne ──
function costruisciSushiBar () {
  const g = new THREE.Group()
  const scuro = mat(0x4a3224), legno = mat(0x8a5a3a), carta = mat(0xf6efe0), rosso = mat(0xc0282d), bianco = mat(0xfffaf0), tegola = mat(0x3b3f4a)
  lastra(g, 3.0, 2.9, 0xcfc5b0)
  scatola(g, 2.4, 1.1, 1.4, scuro, 0, 0.55, -0.6)
  for (const x of [-0.7, 0, 0.7]) scatola(g, 0.52, 0.62, 0.05, carta, x, 0.68, 0.12)                              // gli shoji, pannelli di carta sul davanti
  for (const x of [-0.97, -0.43, 0.1, 0.43, 0.97]) scatola(g, 0.04, 0.66, 0.06, scuro, x * 0.97, 0.68, 0.13)
  // il tetto a due piani con le punte in su, e la trave rossa sul davanti sorretta da due pilastri
  const falde = new THREE.Group(); falde.position.set(0, 1.1, -0.6); g.add(falde)
  tetto(falde, 2.9, 1.9, 0.0, 0x3b3f4a, 0.42)
  scatola(g, 2.5, 0.1, 0.12, rosso, 0, 1.05, 0.72)
  for (const x of [-1.15, 1.15]) cilindro(g, 0.07, 0.08, 1.1, rosso, x, 0.55, 0.72, 8)
  scatola(g, 3.1, 0.08, 0.14, tegola, 0, 1.2, 0.72)
  // il noren: quattro strisce di stoffa rossa con la riga bianca appese alla trave (ondeggiano)
  const noren = []
  for (let k = 0; k < 4; k++) {
    const p = new THREE.Group(); p.position.set(-0.75 + k * 0.5, 1.0, 0.8); g.add(p)
    scatola(p, 0.42, 0.55, 0.02, rosso, 0, -0.28, 0); scatola(p, 0.42, 0.08, 0.022, bianco, 0, -0.2, 0)
    noren.push(p)
  }
  // il bancone davanti con sei piattini di sushi (riso bianco e un fiocco di salmone o di uovo)
  scatola(g, 2.0, 0.5, 0.45, legno, 0, 0.25, 1.15)
  scatola(g, 2.1, 0.05, 0.55, mat(0xc89a62), 0, 0.52, 1.15)
  const colori = [0xff8a65, 0xf3c441, 0xff8a65, 0xe8483a, 0xf3c441, 0xff8a65]
  colori.forEach((c, k) => {
    const x = -0.85 + k * 0.34
    cilindro(g, 0.13, 0.13, 0.025, bianco, x, 0.565, 1.15, 10)
    scatola(g, 0.14, 0.06, 0.09, bianco, x, 0.61, 1.15); scatola(g, 0.16, 0.035, 0.1, mat(c), x, 0.66, 1.15)
  })
  // le due lanterne di carta rosse, sospese ai pilastri
  const lanterne = [-1, 1].map(s => {
    const l = sfera(g, 0.14, mat(0xe8483a, { emissive: 0xd8302a, emissiveIntensity: 0.6 }), s * 1.15, 0.78, 0.95, 1, 1.25, 1, 8)
    cilindro(g, 0.1, 0.1, 0.03, mat(0x2a2018), s * 1.15, 0.97, 0.95, 8); cilindro(g, 0.1, 0.1, 0.03, mat(0x2a2018), s * 1.15, 0.6, 0.95, 8)
    return l
  })
  insegna(g, '🍣 SUSHI', 1.5, 0.3, 0, 1.43, 0.78, { w: 384, h: 72, sfondo: '#a8232a', px: 44 })
  // la pentola del riso, a sinistra, che fuma piano
  cilindro(g, 0.22, 0.24, 0.3, mat(0x5a5a5e, { metalness: 0.5, roughness: 0.5 }), -1.15, 0.15, 0.2, 10); cilindro(g, 0.24, 0.24, 0.05, mat(0x3a3a3e), -1.15, 0.32, 0.2, 10)
  g.userData.fumo = new THREE.Vector3(-1.15, 0.5, 0.2)
  g.userData.noren = noren; g.userData.lanterne = lanterne
  g.userData.anima = function (dt, tt) {
    this.noren.forEach((p, k) => { p.rotation.x = Math.sin(tt * 1.7 + k * 0.8) * 0.08; p.rotation.z = Math.sin(tt * 1.1 + k) * 0.03 })
    this.lanterne[0].material.emissiveIntensity = 0.6 + Math.sin(tt * 2.6) * 0.18
  }
  g.userData.altezza = 2.7
  for (const p of noren) fondiPerMateriale(p)
  fondiPerMateriale(g, { escludi: [...noren, ...lanterne] })
  return g
}

// la cache (scena3d/cache-modelli.js): costruiti e fusi una volta, le istanze sono cloni
export const creaFriggitoria = memoModello('friggitoria', costruisciFriggitoria)
export const creaSushiBar = memoModello('sushi_bar', costruisciSushiBar)
export const creaZuccherificio = memoModello('zuccherificio', costruisciZuccherificio)
export const creaTelaio = memoModello('telaio', costruisciTelaio)
export const creaSartoria = memoModello('sartoria', costruisciSartoria)
export const creaTintoria = memoModello('tintoria', costruisciTintoria)
export const creaFienileMacchina = memoModello('fienile-macchina', costruisciFienileMacchina)

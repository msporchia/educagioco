// Il secondo cortile, tutto in codice: la conigliera, il recinto degli alpaca, quello degli asini e l'apiario (tutti 4×3) con le loro bestie e i
// tre stadi leggibili di ciascuna (bestie-puro-cortile2.js: coniglio, alpaca, asino, arnia). Stesso contratto di modelli-cortile.js: un Group con
// l'origine al centro dell'impronta e il davanti verso +z; i recinti tengono `userData.{bestie, crea, posto, altezza}` (`sincronizzaBestie`,
// `muoviBestie` di modelli.js li usano) e ogni bestia la sua `animaBestia`. Numeri e regole non stanno qui: docs/fattoria3d/cortile-2.md.
// Peso: bestie di ~10 mesh, geometrie e materiali condivisi, fuso tutto ciò che sta fermo (come il cortile di G4).
import * as THREE from 'three'
import { mat, scatola, cilindro, cono, sfera, tetto, insegna, parte, segniDiPronta, sincronizzaBestie } from './modelli.js'
import { ANIMALI } from '../dati/animali.js'
import { fondiPerMateriale } from './fondi.js'
import { memoModello } from './cache-modelli.js'

const casuale = g => { g.userData.fase = Math.random() * 6 }
const G_SFERA = new THREE.SphereGeometry(0.2, 9, 7), G_PICCOLA = new THREE.SphereGeometry(0.06, 7, 5), G_MINI = new THREE.SphereGeometry(0.035, 6, 4)

/* ═════════════════════════ il coniglio d'angora e la conigliera ═════════════════════════ */
const G_CONIGLIO = new THREE.SphereGeometry(0.1, 9, 7), G_PELO = new THREE.SphereGeometry(0.105, 9, 7), G_ZAMPETTA = new THREE.SphereGeometry(0.035, 6, 4)
const G_ORECCHIO_K = new THREE.SphereGeometry(0.05, 6, 4).scale(0.45, 1.7, 0.22).translate(0, 0.085, 0)
const SCALA_K = [1, 0.9, 1.3]

function costruisciConiglio (k = 0) {
  const g = new THREE.Group()
  const bianco = mat(k % 2 ? 0xe9d9c0 : 0xf8f5ee), pelle = mat(0xcdb7a0), rosa = mat(0xf0a0a8), scuro = mat(0x2a2018), lana = mat(0xe9462c)
  const corpo = parte(g, G_CONIGLIO, pelle, 0, 0.1, 0); corpo.scale.set(...SCALA_K)
  const pelo = parte(g, G_PELO, bianco, 0, 0.11, 0); pelo.scale.setScalar(0.4)                 // la nuvola d'angora: dal vello rado alla palla di pelo
  for (const [x, z] of [[0.05, 0.1], [-0.05, 0.1], [0.045, -0.11], [-0.045, -0.11]]) parte(g, G_ZAMPETTA, pelle, x, 0.025, z).scale.set(1, 0.6, 1.3)
  const coda = parte(g, G_PICCOLA, bianco, 0, 0.12, -0.16); coda.scale.setScalar(0.9)
  const testa = new THREE.Group(); testa.position.set(0, 0.17, 0.13); g.add(testa)
  parte(testa, G_PICCOLA, bianco, 0, 0, 0.02).scale.set(1, 0.95, 1.1)
  parte(testa, G_MINI, rosa, 0, -0.012, 0.075).scale.setScalar(0.6)
  for (const s of [-1, 1]) parte(testa, G_MINI, scuro, s * 0.032, 0.012, 0.06).scale.setScalar(0.5)
  const orecchie = [-1, 1].map(s => {
    const p = new THREE.Group(); p.position.set(s * 0.03, 0.04, -0.005); testa.add(p)
    parte(p, G_ORECCHIO_K, bianco, 0, 0, 0); p.userData = { lato: s }
    return p
  })
  const dono = new THREE.Group(); dono.position.set(0.2, 0.0, 0.1); g.add(dono); dono.visible = false             // il gomitolo di lana d'angora
  parte(dono, G_PICCOLA, lana, 0, 0.06, 0).scale.setScalar(1.15)
  parte(dono, G_MINI, mat(0xf4e3c8), 0.07, 0.025, 0.04).scale.set(1.3, 0.4, 0.4)
  fondiPerMateriale(testa, { escludi: orecchie }); fondiPerMateriale(dono); fondiPerMateriale(g, { escludi: [corpo, pelo, testa, coda, dono] })
  g.userData = { corpo, pelo, testa, coda, orecchie, dono, specie: 'coniglio', ms: ANIMALI.conigliera.ms, fase: Math.random() * 6, meta: new THREE.Vector3(), animaBestia: animaConiglio }
  segniDiPronta(g, g.userData, { raggio: 0.34, yAlone: 0.015, scint: [0.2, 0.3, 0.1], sbuffo: [0.2, 0.14, 0.1], rSbuffo: 0.17 })
  return g
}
function animaConiglio (b, u, pr, stadio, dt, t, n) {
  const ph = u.fase += dt * pr.lento
  u.corpo.scale.set(SCALA_K[0] * pr.sx, SCALA_K[1] * pr.sy, SCALA_K[2] * pr.sz)
  u.corpo.position.y = 0.1 + pr.corpoY + Math.sin(ph * 1.8 + n) * 0.003                    // respira
  u.pelo.scale.setScalar(pr.pelo); u.pelo.position.y = u.corpo.position.y + 0.012
  u.coda.scale.setScalar(0.7 + 0.35 * pr.pelo); u.coda.position.y = 0.1 + pr.corpoY + 0.02 + 0.02 * pr.pelo
  u.testa.position.y = 0.17 + pr.testaY + pr.pelo * 0.012
  u.testa.rotation.x = pr.testaX + Math.max(0, Math.sin(ph * 6 + n)) * 0.06              // il nasino che si muove
  for (const p of u.orecchie) p.rotation.z = -p.userData.lato * (pr.orecchie + Math.sin(ph * 1.4 + n + p.userData.lato) * 0.05)
  const d = u.dono; d.visible = pr.dono > 0.03; d.scale.setScalar(pr.dono * 1.3)
  const c0 = u.casa; if (c0) b.position.y = c0.y + pr.salto * Math.max(0, Math.sin(t * 4.2 + n * 1.9)) * 0.08          // da pronto salterella
}

function costruisciConigliera () {
  const g = new THREE.Group()
  const legno = mat(0x8a5a34), chiaro = mat(0xc99a5c), paglia = mat(0xe0c060), rete = mat(0x4a4a50), arancio = mat(0xee7d1a), verde = mat(0x3f8f3a)
  scatola(g, 3.9, 0.04, 2.9, mat(0x8fd05c), 0, 0.02, 0).receiveShadow = true
  scatola(g, 3.5, 0.02, 1.6, mat(0xb7cf6a), 0, 0.05, 0.6)                                   // il prato corto della corsa
  // la conigliera di legno su quattro gambe: cassa, tetto, due sportelli a rete e la rampa
  const cas = new THREE.Group(); cas.position.set(-0.95, 0, -0.85); g.add(cas)
  for (const [x, z] of [[-0.62, -0.28], [0.62, -0.28], [-0.62, 0.28], [0.62, 0.28]]) cilindro(cas, 0.045, 0.05, 0.32, legno, x, 0.16, z, 5)
  scatola(cas, 1.5, 0.5, 0.82, chiaro, 0, 0.57, 0)
  for (const x of [-0.38, 0.38]) { scatola(cas, 0.55, 0.34, 0.05, mat(0x2a2018), x, 0.57, 0.42); scatola(cas, 0.5, 0.3, 0.02, rete, x, 0.57, 0.445) }
  const falde = new THREE.Group(); falde.position.y = 0.82; cas.add(falde); tetto(falde, 1.75, 1.05, 0.0, 0x9a4a2a, 0.34)
  const rampa = scatola(cas, 0.34, 0.04, 0.62, legno, 0.38, 0.18, 0.7); rampa.rotation.x = 0.55
  // la tana: un monticello d'erba con la bocca scura, a destra dietro
  sfera(g, 0.55, mat(0x6a9a3a), 1.25, 0.28, -0.8, 1.15, 0.5, 1, 8)
  cilindro(g, 0.17, 0.17, 0.02, mat(0x2a2018), 1.25, 0.2, -0.38, 10).rotation.x = Math.PI / 2 - 0.35
  // le carote che spuntano, la ciotola dell'acqua, il fieno
  for (const [x, z] of [[0.4, 0.95], [0.6, 1.0], [0.8, 0.9], [-0.1, 1.05], [1.05, 1.1]]) {
    const c = cono(g, 0.05, 0.18, arancio, x, 0.1, z, 5); c.rotation.x = Math.PI
    sfera(g, 0.06, verde, x, 0.2, z, 1, 0.8, 1, 5)
  }
  cilindro(g, 0.15, 0.12, 0.08, mat(0x5fa8d8), -0.2, 0.09, -0.15, 8)
  const balla = cilindro(g, 0.2, 0.2, 0.4, paglia, 1.7, 0.24, 0.0, 8); balla.rotation.z = Math.PI / 2
  cilindro(g, 0.025, 0.025, 0.75, legno, 1.65, 0.38, 0.95, 5)
  insegna(g, '🐇 ANGORA', 0.7, 0.24, 1.65, 0.8, 0.97, { w: 256, h: 88, sfondo: '#7a4a6a', px: 36 })
  // lo steccato con la rete, col cancelletto in mezzo
  const X = 1.85, Zf = 1.4, Zm = -0.3, Gx = 0.38
  const palo = (x, z) => cilindro(g, 0.035, 0.04, 0.6, legno, x, 0.3, z, 6)
  const sbarra = (lx, lz, x, z, y, m = legno) => scatola(g, lx, 0.05, lz, m, x, y, z)
  for (const s of [-1, 1]) {
    for (const x of [X, 1.36, 0.87, Gx]) palo(s * x, Zf)
    for (let n = 0; n < 5; n++) palo(s * X, Zf - (Zf - Zm) * (n + 1) / 5)
    for (const y of [0.22, 0.5]) { sbarra(X - Gx, 0.04, s * (X + Gx) / 2, Zf, y); sbarra(0.04, Zf - Zm, s * X, (Zf + Zm) / 2, y) }
    scatola(g, X - Gx, 0.28, 0.012, rete, s * (X + Gx) / 2, 0.36, Zf)                           // la rete bassa davanti
  }
  for (const y of [0.2, 0.46]) sbarra(2 * Gx - 0.08, 0.05, 0, Zf, y, chiaro)
  g.userData.bestie = []; g.userData.crea = creaConiglio
  g.userData.posto = k => new THREE.Vector3(-0.2 + (k % 3) * 0.78 - Math.floor(k / 3) * 0.05, 0.05, 0.38 + Math.floor(k / 3) * 0.5)      // sei conigli in due file nella corsa
  g.userData.altezza = 1.9
  fondiPerMateriale(g)
  return g
}
const conigliereVuote = memoModello('conigliera', costruisciConigliera)
export function creaConigliera (stati) { const g = conigliereVuote(); sincronizzaBestie(g, stati || [{ fine: null }]); return g }
export const creaConiglio = memoModello('coniglio', costruisciConiglio, { chiave: (k = 0) => k % 2, dopo: casuale })

/* ═════════════════════════ l'alpaca e il suo recinto ═════════════════════════ */
const G_CORPO_A = new THREE.SphereGeometry(0.2, 9, 7), G_COLLO_A = new THREE.CylinderGeometry(0.05, 0.075, 0.4, 7).translate(0, 0.2, 0), G_ZAMPA_A = new THREE.CylinderGeometry(0.026, 0.022, 0.4, 5)
const G_ZOCC_A = new THREE.CylinderGeometry(0.026, 0.03, 0.04, 5), G_ORECCHIO_A = new THREE.ConeGeometry(0.03, 0.14, 4).translate(0, 0.07, 0)
const SCALA_A = [0.6, 0.62, 1.15]
const BASE_COLLO = [0, 0.62, 0.2], ANGOLO_COLLO = 0.32

function costruisciAlpaca (k = 0) {
  const g = new THREE.Group()
  const vello = mat(k % 2 ? 0xa8754a : 0xf2e7cf), pelle = mat(k % 2 ? 0x7a5538 : 0xcdb99a), scuro = mat(0x2a2018), rosa = mat(0xf0b0a8), lana = mat(0x2f8f9a)
  const corpo = parte(g, G_CORPO_A, pelle, 0, 0.58, 0); corpo.scale.set(...SCALA_A)
  const manto = parte(g, G_CORPO_A, vello, 0, 0.6, 0); manto.scale.set(SCALA_A[0] * 0.5, SCALA_A[1] * 0.5, SCALA_A[2] * 0.5)       // il vello: cresce fino a coprire il corpo e di più
  for (const [x, z] of [[0.07, 0.22], [-0.07, 0.22], [0.07, -0.22], [-0.07, -0.22]]) { parte(g, G_ZAMPA_A, k % 2 ? scuro : vello, x, 0.2, z); parte(g, G_ZOCC_A, scuro, x, 0.02, z) }
  const coda = new THREE.Group(); coda.position.set(0, 0.7, -0.26); g.add(coda)
  parte(coda, G_PICCOLA, vello, 0, 0.0, -0.02).scale.set(0.8, 1.2, 0.8)
  const collo = parte(g, G_COLLO_A, vello, ...BASE_COLLO)                                      // il collo lungo: si allunga quando sta bene
  collo.rotation.x = ANGOLO_COLLO
  const testa = new THREE.Group(); testa.position.set(0, 1.02, 0.34); g.add(testa)
  parte(testa, G_SFERA, vello, 0, 0, 0.04).scale.set(0.25, 0.27, 0.34)
  parte(testa, G_SFERA, k % 2 ? pelle : rosa, 0, -0.04, 0.13).scale.set(0.19, 0.16, 0.2)    // il muso
  for (const s of [-1, 1]) parte(testa, G_MINI, scuro, s * 0.045, 0.03, 0.1).scale.setScalar(0.6)
  const ciuffo = parte(testa, G_PICCOLA, vello, 0, 0.1, 0.02); ciuffo.scale.setScalar(0.01)      // il ciuffo sulla fronte
  const orecchie = [-1, 1].map(s => {
    const p = new THREE.Group(); p.position.set(s * 0.05, 0.1, -0.03); testa.add(p)
    parte(p, G_ORECCHIO_A, vello, 0, 0, 0); p.userData = { lato: s }
    return p
  })
  const dono = new THREE.Group(); dono.position.set(0.36, 0, 0.24); g.add(dono); dono.visible = false             // il gomitolo di lana d'alpaca
  parte(dono, G_PICCOLA, lana, 0, 0.07, 0).scale.setScalar(1.25)
  parte(dono, G_MINI, mat(0xf4e3c8), 0.08, 0.03, 0.05).scale.set(1.4, 0.4, 0.4)
  fondiPerMateriale(testa, { escludi: [ciuffo, ...orecchie] }); fondiPerMateriale(dono); fondiPerMateriale(g, { escludi: [corpo, manto, coda, collo, testa, dono] })
  g.userData = { corpo, manto, coda, collo, testa, ciuffo, orecchie, dono, specie: 'alpaca', ms: ANIMALI.alpaca.ms, fase: Math.random() * 6, meta: new THREE.Vector3(), animaBestia: animaAlpaca }
  segniDiPronta(g, g.userData, { raggio: 0.5, yAlone: 0.025, scint: [0.36, 0.45, 0.24], sbuffo: [0.36, 0.2, 0.24], rSbuffo: 0.21 })
  return g
}
function animaAlpaca (b, u, pr, stadio, dt, t, n) {
  const ph = u.fase += dt * pr.lento
  u.corpo.scale.set(SCALA_A[0] * pr.sx, SCALA_A[1] * pr.sy, SCALA_A[2] * pr.sz)
  u.corpo.position.y = 0.58 + pr.corpoY + Math.sin(ph * 0.9 + n) * 0.005
  const l = pr.lana
  u.manto.scale.set(SCALA_A[0] * 0.5 * l * pr.sx, SCALA_A[1] * 0.5 * l * pr.sy, SCALA_A[2] * 0.5 * l * pr.sz); u.manto.position.y = u.corpo.position.y + 0.02
  u.coda.position.y = 0.7 + pr.corpoY; u.coda.rotation.x = -0.2 + Math.sin(ph * 1.5 + n) * 0.08
  u.collo.scale.y = pr.collo; u.collo.position.y = BASE_COLLO[1] + pr.corpoY
  const lungo = 0.4 * pr.collo, a = ANGOLO_COLLO + pr.testaX * 0.35 + Math.sin(ph * 0.8 + n) * 0.03       // a fame il collo è basso e proteso
  u.collo.rotation.x = a
  u.testa.position.set(0, BASE_COLLO[1] + pr.corpoY + Math.cos(a) * lungo + pr.testaY, BASE_COLLO[2] + Math.sin(a) * lungo + 0.07)
  u.testa.rotation.x = pr.testaX * 0.5 + Math.sin(ph * 2.2 + n) * (stadio === 1 ? 0.04 : 0.01)           // mastica
  const c = pr.ciuffo; u.ciuffo.scale.setScalar(Math.max(0.01, c * 1.5)); u.ciuffo.visible = c > 0.03
  for (const p of u.orecchie) p.rotation.z = -p.userData.lato * (pr.orecchie * 1.1 + Math.sin(ph * 3 + n + p.userData.lato) * 0.05)
  const d = u.dono; d.visible = pr.dono > 0.03; d.scale.setScalar(pr.dono * 1.4)
}

function costruisciRecintoAlpaca () {
  const g = new THREE.Group()
  const legno = mat(0x8a5a34), chiaro = mat(0xc99a5c), roccia = mat(0x8d8a82), paglia = mat(0xe0c060), tetto_ = 0xd9b866
  scatola(g, 3.9, 0.04, 2.9, mat(0x93c46a), 0, 0.02, 0).receiveShadow = true
  scatola(g, 3.5, 0.02, 1.5, mat(0xcdb27a), 0, 0.05, 0.6)                                   // la terra battuta
  // la tettoia: quattro pali, tetto di paglia, retro chiuso e una coperta a righe appesa
  const tett = new THREE.Group(); tett.position.set(0.8, 0, -0.85); g.add(tett)
  for (const [x, z] of [[-0.9, -0.35], [0.9, -0.35], [-0.9, 0.35], [0.9, 0.35]]) cilindro(tett, 0.05, 0.055, 1.1, legno, x, 0.55, z, 6)
  const falde = new THREE.Group(); falde.position.y = 1.1; tett.add(falde); tetto(falde, 2.2, 1.0, 0.0, tetto_, 0.3)
  scatola(tett, 1.7, 0.7, 0.12, chiaro, 0, 0.45, -0.38)
  for (const [x, c] of [[-0.4, 0xc4382f], [-0.2, 0xf2c44a], [0, 0x2f8f9a], [0.2, 0xc4382f], [0.4, 0xf2c44a]]) scatola(tett, 0.2, 0.5, 0.03, mat(c), x, 0.55, -0.3)      // la coperta andina
  scatola(tett, 1.4, 0.08, 0.32, legno, 0, 0.34, 0.05)
  scatola(tett, 1.2, 0.14, 0.2, paglia, 0, 0.43, 0.05)
  // il mucchio di fieno e un masso con l'erba, a sinistra
  for (const [x, z, r] of [[-1.55, -0.55, 0.32], [-1.3, -0.3, 0.22], [-1.7, -0.2, 0.2]]) cono(g, r, r * 1.2, paglia, x, r * 0.6, z, 6)
  sfera(g, 0.28, roccia, -0.6, 0.15, -0.9, 1, 0.7, 1, 6)
  // l'abbeveratoio
  scatola(g, 0.65, 0.14, 0.26, legno, -0.5, 0.09, 0.05); scatola(g, 0.55, 0.03, 0.18, mat(0x5fa8d8), -0.5, 0.16, 0.05)
  cilindro(g, 0.025, 0.025, 0.75, legno, 1.7, 0.38, 0.95, 5)
  insegna(g, '🦙 ALPACA', 0.7, 0.24, 1.7, 0.8, 0.97, { w: 256, h: 88, sfondo: '#2f8f9a', px: 36 })
  // lo steccato alto (le alpaca sono alte) col cancelletto
  const X = 1.85, Zf = 1.4, Zm = -0.3, Gx = 0.38
  const palo = (x, z) => cilindro(g, 0.04, 0.045, 0.82, legno, x, 0.41, z, 6)
  const sbarra = (lx, lz, x, z, y, m = legno) => scatola(g, lx, 0.06, lz, m, x, y, z)
  for (const s of [-1, 1]) {
    for (const x of [X, 1.36, 0.87, Gx]) palo(s * x, Zf)
    for (let n = 0; n < 5; n++) palo(s * X, Zf - (Zf - Zm) * (n + 1) / 5)
    for (const y of [0.3, 0.6]) { sbarra(X - Gx, 0.05, s * (X + Gx) / 2, Zf, y); sbarra(0.05, Zf - Zm, s * X, (Zf + Zm) / 2, y) }
  }
  for (const y of [0.26, 0.62]) sbarra(2 * Gx - 0.08, 0.05, 0, Zf, y, chiaro)
  g.userData.bestie = []; g.userData.crea = creaAlpaca
  g.userData.posto = k => new THREE.Vector3(-1.0 + k * 0.72, 0.05, 0.5 + (k % 2) * 0.3)      // quattro alpaca davanti alla tettoia
  g.userData.altezza = 2.5
  fondiPerMateriale(g)
  return g
}
const alpacaVuoto = memoModello('recinto-alpaca', costruisciRecintoAlpaca)
export function creaRecintoAlpaca (stati) { const g = alpacaVuoto(); sincronizzaBestie(g, stati || [{ fine: null }]); return g }
export const creaAlpaca = memoModello('alpaca', costruisciAlpaca, { chiave: (k = 0) => k % 2, dopo: casuale })

/* ═════════════════════════ l'asino e il suo recinto ═════════════════════════ */
const G_CORPO_S = new THREE.SphereGeometry(0.2, 9, 7), G_ZAMPA_S = new THREE.CylinderGeometry(0.03, 0.026, 0.34, 5), G_ZOCC_S = new THREE.CylinderGeometry(0.03, 0.034, 0.04, 5)
const G_ORECCHIO_S = new THREE.ConeGeometry(0.04, 0.22, 4).translate(0, 0.11, 0), G_CRINIERA = new THREE.BoxGeometry(0.03, 0.2, 0.34)
const SCALA_S = [0.58, 0.6, 1.3]

function costruisciAsino (k = 0) {
  const g = new THREE.Group()
  const manto = mat(k % 2 ? 0x7a5a42 : 0x8e8d92), chiaro = mat(k % 2 ? 0xd8c4a8 : 0xd9d6d0), scuro = mat(0x2a2424), terra = mat(0x4a3220), tela = mat(0xcfb27a), nodo = mat(0x7a5232)
  const corpo = parte(g, G_CORPO_S, manto, 0, 0.5, 0); corpo.scale.set(...SCALA_S)
  parte(g, G_CORPO_S, chiaro, 0, 0.4, 0.02).scale.set(SCALA_S[0] * 0.8, SCALA_S[1] * 0.5, SCALA_S[2] * 0.85)        // la pancia chiara
  for (const [x, z] of [[0.07, 0.2], [-0.07, 0.2], [0.07, -0.2], [-0.07, -0.2]]) { parte(g, G_ZAMPA_S, manto, x, 0.17, z); parte(g, G_ZOCC_S, scuro, x, 0.02, z) }
  const coda = new THREE.Group(); coda.position.set(0, 0.55, -0.27); g.add(coda)
  parte(coda, new THREE.CylinderGeometry(0.012, 0.012, 0.26, 4).translate(0, -0.13, 0), manto, 0, 0, 0)
  parte(coda, G_MINI, scuro, 0, -0.27, 0).scale.set(1.1, 1.8, 1.1)
  parte(g, G_CORPO_S, manto, 0, 0.64, 0.25).scale.set(0.24, 0.5, 0.3)                       // il collo
  parte(g, G_CRINIERA, scuro, 0, 0.7, 0.2).rotation.x = 0.55                                    // la criniera dritta
  const testa = new THREE.Group(); testa.position.set(0, 0.72, 0.36); g.add(testa)
  parte(testa, G_CORPO_S, manto, 0, 0, 0.07).scale.set(0.3, 0.32, 0.5)
  parte(testa, G_CORPO_S, chiaro, 0, -0.045, 0.2).scale.set(0.21, 0.19, 0.24)             // il muso chiaro
  for (const s of [-1, 1]) parte(testa, G_MINI, scuro, s * 0.05, 0.035, 0.12).scale.setScalar(0.6)
  parte(testa, G_MINI, scuro, 0, -0.045, 0.31).scale.set(1.6, 0.8, 0.6)
  const orecchie = [-1, 1].map(s => {
    const p = new THREE.Group(); p.position.set(s * 0.05, 0.1, -0.04); testa.add(p)
    parte(p, G_ORECCHIO_S, manto, 0, 0, 0); p.userData = { lato: s }
    return p
  })
  const mucchio = parte(g, G_PICCOLA, terra, 0.44, 0.01, 0.24); mucchio.scale.set(1.8, 0.55, 1.5); mucchio.visible = false     // dove ha fatto il suo lavoro
  const dono = new THREE.Group(); dono.position.set(0.44, 0, 0.24); g.add(dono); dono.visible = false                          // il sacco di concime
  parte(dono, G_PICCOLA, tela, 0, 0.1, 0).scale.set(1.25, 1.7, 1.1)
  parte(dono, G_MINI, nodo, 0, 0.22, 0).scale.set(1.3, 0.8, 1.3)
  parte(dono, G_MINI, mat(0x3a9a3a), 0, 0.12, 0.07).scale.set(1.6, 1.1, 0.4)             // l'etichetta verde
  fondiPerMateriale(testa, { escludi: orecchie }); fondiPerMateriale(dono); fondiPerMateriale(coda); fondiPerMateriale(g, { escludi: [corpo, coda, testa, mucchio, dono] })
  g.userData = { corpo, coda, testa, orecchie, mucchio, dono, specie: 'asino', ms: ANIMALI.asini.ms, fase: Math.random() * 6, meta: new THREE.Vector3(), animaBestia: animaAsino }
  segniDiPronta(g, g.userData, { raggio: 0.5, yAlone: 0.02, scint: [0.44, 0.4, 0.24], sbuffo: [0.44, 0.2, 0.24], rSbuffo: 0.2 })
  return g
}
function animaAsino (b, u, pr, stadio, dt, t, n) {
  const ph = u.fase += dt * pr.lento
  u.corpo.scale.set(SCALA_S[0] * pr.sx, SCALA_S[1] * pr.sy, SCALA_S[2] * pr.sz)
  u.corpo.position.y = 0.5 + pr.corpoY + Math.sin(ph * 0.9 + n) * 0.005
  u.testa.position.y = 0.72 + pr.testaY + Math.sin(ph * 2.2 + n) * (stadio === 1 ? 0.01 : 0.003)       // mastica
  u.testa.rotation.x = pr.testaX + Math.sin(ph * 0.7 + n) * 0.04
  for (const p of u.orecchie) p.rotation.z = -p.userData.lato * (pr.orecchie + Math.sin(ph * 2.1 + n + p.userData.lato) * 0.07)       // le orecchie lunghe si muovono sempre un po'
  u.coda.rotation.x = 0.2 + 0.2 * pr.coda; u.coda.rotation.z = Math.sin(ph * (stadio === 2 ? 3 : 1.4) + n) * 0.5 * pr.coda
  const m = pr.mucchio; u.mucchio.visible = m > 0.03; u.mucchio.scale.set(1.8 * m, 0.55 * m, 1.5 * m)
  const d = u.dono; d.visible = pr.dono > 0.03; d.scale.setScalar(pr.dono * 1.4)
}

function costruisciRecintoAsini () {
  const g = new THREE.Group()
  const legno = mat(0x8a5a34), chiaro = mat(0xc99a5c), pietra = mat(0x9d9a92), paglia = mat(0xe0c060), terra = mat(0x4a3220), ferro = mat(0x3a3a40)
  scatola(g, 3.9, 0.04, 2.9, mat(0xa6c46a), 0, 0.02, 0).receiveShadow = true
  scatola(g, 3.5, 0.02, 1.5, mat(0xb89b6a), 0, 0.05, 0.6)
  // la stalla: muro di pietra dietro, tetto, rastrelliera col fieno
  const st = new THREE.Group(); st.position.set(0.5, 0, -0.85); g.add(st)
  scatola(st, 2.4, 0.95, 0.5, pietra, 0, 0.475, -0.2)
  for (const x of [-1.15, 1.15]) scatola(st, 0.12, 0.95, 0.9, chiaro, x, 0.475, 0.1)
  const falde = new THREE.Group(); falde.position.y = 0.95; st.add(falde); tetto(falde, 2.6, 1.15, 0.0, 0x7a4a2e, 0.3)
  scatola(st, 1.6, 0.1, 0.1, legno, 0, 0.72, 0.28)
  for (let n = 0; n < 7; n++) scatola(st, 0.03, 0.4, 0.03, legno, -0.6 + n * 0.2, 0.5, 0.3)
  scatola(st, 1.5, 0.16, 0.2, paglia, 0, 0.54, 0.2)
  // la carriola col sacco e il mucchio di letame a sinistra
  const car = new THREE.Group(); car.position.set(-1.45, 0, -0.55); car.rotation.y = 0.5; g.add(car)
  scatola(car, 0.5, 0.18, 0.4, legno, 0, 0.3, 0)
  cilindro(car, 0.1, 0.1, 0.05, ferro, 0, 0.1, 0.0, 8).rotation.z = Math.PI / 2
  for (const s of [-1, 1]) scatola(car, 0.04, 0.04, 0.5, legno, s * 0.18, 0.25, 0.4)
  sfera(car, 0.15, terra, 0, 0.42, 0, 1.4, 0.6, 1.1, 6)
  sfera(g, 0.34, terra, -1.1, 0.21, -0.2, 1.3, 0.6, 1, 6)
  // l'abbeveratoio di pietra e il cartello
  scatola(g, 0.7, 0.16, 0.28, pietra, -0.4, 0.1, 0.0); scatola(g, 0.6, 0.03, 0.2, mat(0x5fa8d8), -0.4, 0.18, 0.0)
  cilindro(g, 0.025, 0.025, 0.75, legno, 1.7, 0.38, 0.95, 5)
  insegna(g, '🐴 CONCIME', 0.7, 0.24, 1.7, 0.8, 0.97, { w: 256, h: 88, sfondo: '#5a4a32', px: 34 })
  const X = 1.85, Zf = 1.4, Zm = -0.3, Gx = 0.38
  const palo = (x, z) => cilindro(g, 0.04, 0.045, 0.72, legno, x, 0.36, z, 6)
  const sbarra = (lx, lz, x, z, y, m = legno) => scatola(g, lx, 0.06, lz, m, x, y, z)
  for (const s of [-1, 1]) {
    for (const x of [X, 1.36, 0.87, Gx]) palo(s * x, Zf)
    for (let n = 0; n < 5; n++) palo(s * X, Zf - (Zf - Zm) * (n + 1) / 5)
    for (const y of [0.28, 0.56]) { sbarra(X - Gx, 0.05, s * (X + Gx) / 2, Zf, y); sbarra(0.05, Zf - Zm, s * X, (Zf + Zm) / 2, y) }
  }
  for (const y of [0.24, 0.56]) sbarra(2 * Gx - 0.08, 0.05, 0, Zf, y, chiaro)
  g.userData.bestie = []; g.userData.crea = creaAsino
  g.userData.posto = k => new THREE.Vector3(-0.9 + k * 0.78, 0.05, 0.5 + (k % 2) * 0.3)       // quattro asini davanti alla stalla
  g.userData.altezza = 2.3
  fondiPerMateriale(g)
  return g
}
const asiniVuoti = memoModello('recinto-asini', costruisciRecintoAsini)
export function creaRecintoAsini (stati) { const g = asiniVuoti(); sincronizzaBestie(g, stati || [{ fine: null }]); return g }
export const creaAsino = memoModello('asino', costruisciAsino, { chiave: (k = 0) => k % 2, dopo: casuale })

/* ═════════════════════════ l'arnia e l'apiario ═════════════════════════ */
// Ogni «bestia» è un'arnia: a fame spenta e vuota (il favo nella finestrella è basso), al lavoro le api entrano e il favo sale, pronta è colma
// (il favo pieno), con le api in volo, il coperchio sollevato e il vasetto d'oro accanto.
const G_CASSA = new THREE.BoxGeometry(0.5, 0.2, 0.42), G_APE = new THREE.SphereGeometry(0.022, 5, 4), G_FAVO = new THREE.BoxGeometry(0.1, 1, 0.012).translate(0, 0.5, 0)
const COLORI_ARNIA = [[0xf4efe0, 0x4a7ab5], [0xf2c44a, 0xa8392f], [0xe9e2cf, 0x3f8f3a], [0xd9a05a, 0x2f6aa0]]
const M_ORO = mat(0xf0a818, { emissive: 0x8a5a05, emissiveIntensity: 0.35 })

function costruisciArnia (k = 0) {
  const g = new THREE.Group()
  const [c1, c2] = COLORI_ARNIA[k % COLORI_ARNIA.length], legno = mat(0x8a5a34), scuro = mat(0x2a1a10), ambra = mat(0xe39a17, { emissive: 0x6a3d00, emissiveIntensity: 0.3 })
  for (const [x, z] of [[-0.2, -0.16], [0.2, -0.16], [-0.2, 0.16], [0.2, 0.16]]) cilindro(g, 0.03, 0.035, 0.18, legno, x, 0.09, z, 5)      // il trespolo
  const corpo = new THREE.Group(); corpo.position.y = 0.18; g.add(corpo)
  for (let n = 0; n < 3; n++) parte(corpo, G_CASSA, mat(n === 1 ? c2 : c1), 0, 0.1 + n * 0.2, 0)                                          // tre casse una sull'altra
  scatola(corpo, 0.22, 0.03, 0.022, scuro, 0, 0.06, 0.215)                                                                        // la porticina dove entrano le api
  scatola(corpo, 0.4, 0.02, 0.16, legno, 0, 0.02, 0.3)                                                                            // l'asse d'atterraggio
  scatola(corpo, 0.16, 0.34, 0.012, scuro, 0, 0.4, 0.217)                                                                         // la finestrella sul favo
  const favo = parte(corpo, G_FAVO, M_ORO, 0, 0.23, 0.226); favo.scale.set(1, 0.001, 1)            // il favo: sale col miele
  const lid = new THREE.Group(); lid.position.y = 0.62; corpo.add(lid)
  scatola(lid, 0.58, 0.04, 0.5, legno, 0, 0.02, 0)
  parte(lid, new THREE.ConeGeometry(0.34, 0.12, 4).rotateY(Math.PI / 4), mat(0xa8392f), 0, 0.1, 0).scale.set(1, 1, 0.9)
  const api = [0, 1, 2].map(i => parte(g, G_APE, mat(i % 2 ? 0xf2c44a : 0x2a2a2a), 0, 0.3, 0.3))
  const goccia = parte(g, G_MINI, M_ORO, 0, 0.2, 0.36); goccia.visible = false
  const dono = new THREE.Group(); dono.position.set(0.46, 0, 0.1); g.add(dono); dono.visible = false                  // il vasetto di miele
  cilindro(dono, 0.07, 0.07, 0.13, ambra, 0, 0.075, 0, 8); cilindro(dono, 0.075, 0.075, 0.03, mat(0xf2e9d2), 0, 0.15, 0, 8)
  fondiPerMateriale(dono)
  fondiPerMateriale(g, { escludi: [corpo, ...api, goccia, dono] }); fondiPerMateriale(corpo, { escludi: [favo, lid] })
  g.userData = { corpo, favo, lid, api, goccia, dono, specie: 'arnia', ms: ANIMALI.arnie.ms, fase: Math.random() * 6, meta: new THREE.Vector3(), animaBestia: animaArnia }
  segniDiPronta(g, g.userData, { raggio: 0.5, yAlone: 0.02, scint: [0.3, 0.7, 0.2], sbuffo: [0.3, 0.5, 0.2], rSbuffo: 0.2 })
  return g
}
function animaArnia (b, u, pr, stadio, dt, t, n) {
  const ph = u.fase += dt * pr.lento
  u.favo.scale.set(1, Math.max(0.001, 0.3 * pr.miele), 1)                                      // il favo pieno è alto 0,3
  u.lid.position.y = 0.62 + pr.coperchio * 0.05; u.lid.rotation.z = pr.coperchio * 0.06
  u.api.forEach((ape, i) => {
    ape.visible = pr.api > 0.3 + i * 0.25
    if (!ape.visible) return
    const a = t * (2.2 + i * 0.7) + n * 1.7 + i * 2.1, r = 0.12 + 0.07 * i
    ape.position.set(Math.cos(a) * r, 0.34 + 0.18 * i + Math.sin(a * 2.3) * 0.04, 0.3 + Math.sin(a) * r * 0.8)
  })
  const c = (t * 0.8 + n * 0.41) % 1
  u.goccia.visible = pr.gocciola > 0.5 && c < 0.45
  if (u.goccia.visible) u.goccia.position.set(0, 0.24 - (c / 0.45) * (c / 0.45) * 0.2, 0.34)
  const d = u.dono; d.visible = pr.dono > 0.03; d.scale.setScalar(pr.dono * 1.5)
}

function costruisciApiario () {
  const g = new THREE.Group()
  const legno = mat(0x8a5a34), chiaro = mat(0xc99a5c), verde = mat(0x3f8f3a), ambra = mat(0xe39a17, { emissive: 0x6a3d00, emissiveIntensity: 0.3 })
  scatola(g, 3.9, 0.04, 2.9, mat(0x93c46a), 0, 0.02, 0).receiveShadow = true
  // il prato fiorito: macchie di fiori di quattro colori, gambi corti
  const colori = [mat(0xf2c44a), mat(0xe9594a), mat(0xc58ae8), mat(0xffffff)]
  for (let n = 0; n < 24; n++) {
    const x = -1.7 + ((n * 0.73) % 3.4), z = 0.7 + ((n * 0.37) % 0.7) + (n % 3) * 0.04
    cilindro(g, 0.01, 0.01, 0.16, verde, x, 0.1, z, 3)
    sfera(g, 0.045, colori[n % 4], x, 0.2, z, 1, 0.55, 1, 5)
  }
  for (const [x, z] of [[-1.7, -0.6], [-1.5, -0.8], [1.7, -0.7], [1.5, -0.9], [1.75, -0.4]]) {                       // fiori più alti ai bordi
    cilindro(g, 0.012, 0.012, 0.5, verde, x, 0.27, z, 3); sfera(g, 0.08, colori[(x > 0 ? 0 : 1) + (z < -0.7 ? 1 : 0)], x, 0.55, z, 1, 0.5, 1, 6)
  }
  // il tavolo dell'apicoltore dietro: vasetti d'oro, l'affumicatore, il cappello con la rete
  const tav = new THREE.Group(); tav.position.set(0.1, 0, -1.0); g.add(tav)
  scatola(tav, 1.8, 0.07, 0.5, chiaro, 0, 0.5, 0)
  for (const [x, z] of [[-0.8, -0.2], [0.8, -0.2], [-0.8, 0.2], [0.8, 0.2]]) cilindro(tav, 0.04, 0.04, 0.5, legno, x, 0.25, z, 5)
  for (const [x, z] of [[-0.55, 0.0], [-0.3, 0.1], [-0.1, -0.05], [0.15, 0.08]]) { cilindro(tav, 0.07, 0.07, 0.12, ambra, x, 0.6, z, 8); cilindro(tav, 0.075, 0.075, 0.03, mat(0xf2e9d2), x, 0.675, z, 8) }
  cilindro(tav, 0.08, 0.1, 0.2, mat(0x9d9a92, { metalness: 0.4, roughness: 0.5 }), 0.65, 0.64, 0, 8); cono(tav, 0.05, 0.12, mat(0x9d9a92), 0.7, 0.8, 0, 6).rotation.z = -1.0
  sfera(tav, 0.12, mat(0xf2e9d2), -0.85, 0.65, -0.1, 1.2, 0.7, 1.2, 7)
  // il cartello e lo steccato di vimini, basso, col cancelletto
  cilindro(g, 0.025, 0.025, 0.75, legno, 1.7, 0.38, 0.95, 5)
  insegna(g, '🍯 MIELE', 0.7, 0.24, 1.7, 0.8, 0.97, { w: 256, h: 88, sfondo: '#a8731a', px: 36 })
  const X = 1.85, Zf = 1.4, Zm = -0.3, Gx = 0.38
  const palo = (x, z) => cilindro(g, 0.035, 0.04, 0.52, legno, x, 0.26, z, 6)
  const sbarra = (lx, lz, x, z, y, m = legno) => scatola(g, lx, 0.05, lz, m, x, y, z)
  for (const s of [-1, 1]) {
    for (const x of [X, 1.36, 0.87, Gx]) palo(s * x, Zf)
    for (let n = 0; n < 5; n++) palo(s * X, Zf - (Zf - Zm) * (n + 1) / 5)
    for (const y of [0.2, 0.42]) { sbarra(X - Gx, 0.05, s * (X + Gx) / 2, Zf, y); sbarra(0.05, Zf - Zm, s * X, (Zf + Zm) / 2, y) }
  }
  for (const y of [0.18, 0.42]) sbarra(2 * Gx - 0.08, 0.05, 0, Zf, y, chiaro)
  g.userData.bestie = []; g.userData.crea = creaArnia
  g.userData.posto = k => new THREE.Vector3(-1.32 + k * 0.88, 0.04, 0.12 + (k % 2) * 0.08)        // quattro arnie in fila nel prato
  g.userData.altezza = 2.0
  fondiPerMateriale(g)
  return g
}
const apiarioVuoto = memoModello('apiario', costruisciApiario)
export function creaApiario (stati) { const g = apiarioVuoto(); sincronizzaBestie(g, stati || [{ fine: null }]); return g }
export const creaArnia = memoModello('arnia', costruisciArnia, { chiave: (k = 0) => k % COLORI_ARNIA.length, dopo: casuale })

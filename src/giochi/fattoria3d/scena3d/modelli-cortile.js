// Il pentolone e le tre bestie che mangiano da lui, tutti in codice: lo stagno delle anatre (4×3), il porcile (4×3), le capre (4×3) con
// le loro bestie, e il pentolone (3×3, una macchina). Stesso contratto di modelli.js: un Group con l'origine al centro dell'impronta e il
// davanti verso +z; i recinti tengono `userData.{bestie, crea, posto, altezza}` (`sincronizzaBestie`, `muoviBestie` di modelli.js li
// usano), ogni bestia la sua `animaBestia` e i suoi tre stadi (bestie-puro.js: anatra, maiale, capra). Numeri e regole non stanno qui:
// docs/fattoria3d/cortile-e-pentolone.md. Peso: bestie con ~10 mesh ciascuna, geometrie e materiali condivisi, fuso tutto ciò che sta fermo.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { mat, pronto, scatola, cilindro, cono, sfera, tetto, insegna, lastra, parte, segniDiPronta, sincronizzaBestie } from './modelli.js'
import { ANIMALI } from '../dati/animali.js'
import { fondiPerMateriale } from './fondi.js'
import { memoModello } from './cache-modelli.js'

const casuale = g => { g.userData.fase = Math.random() * 6 }
const G_SFERA = new THREE.SphereGeometry(0.11, 8, 6), G_TESTINA = new THREE.SphereGeometry(0.06, 7, 5)
const G_UOVO_C = new THREE.SphereGeometry(0.045, 8, 6)

/* ═════════════════════════ l'anatra e lo stagno ═════════════════════════ */
const G_BECCO_A = new THREE.BoxGeometry(0.05, 0.018, 0.075), G_CODA_A = new THREE.ConeGeometry(0.045, 0.14, 4)
const G_COLLO = new THREE.CylinderGeometry(0.028, 0.036, 0.1, 6)
const G_ALI = mergeGeometries([-1, 1].map(s => new THREE.SphereGeometry(0.1, 7, 5).scale(0.28, 0.55, 1.05).translate(s * 0.082, 0.085, -0.01)))
const G_SCIA = new THREE.RingGeometry(0.17, 0.205, 18).rotateX(-Math.PI / 2)
const M_SCIA = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false })

function costruisciAnatra (k = 0) {
  const g = new THREE.Group()
  const bianca = k % 2 === 0
  const penne = mat(bianca ? 0xf8f4ea : 0x9a7650), capo = mat(bianca ? 0xf8f4ea : 0x2f7f4a), arancio = mat(0xf0a030), ala = mat(bianca ? 0xe0d8c4 : 0x6e5538)
  const alto = new THREE.Group(); g.add(alto)                                          // tutto ciò che si alza e si inclina insieme al petto
  const corpo = parte(alto, G_SFERA, penne, 0, 0.075, 0); corpo.scale.set(1, 0.72, 1.4)
  const coda = parte(alto, G_CODA_A, penne, 0, 0.1, -0.17); coda.rotation.x = -0.9
  parte(alto, G_ALI, ala, 0, 0, 0)
  const testa = new THREE.Group(); testa.position.set(0, 0.14, 0.13); alto.add(testa)
  parte(testa, G_COLLO, capo, 0, -0.035, -0.015).rotation.x = -0.3
  parte(testa, G_TESTINA, capo, 0, 0.035, 0.03).scale.setScalar(0.85)
  parte(testa, G_BECCO_A, arancio, 0, 0.028, 0.095)
  const uovo = parte(g, G_UOVO_C, mat(0xcfe8c8), 0.14, 0.047, 0.03); uovo.scale.set(0.85, 1.05, 0.85); uovo.visible = false      // l'uovo galleggia accanto
  const scia = new THREE.Mesh(G_SCIA, M_SCIA); scia.position.y = 0.008; scia.scale.set(1, 1, 1.4); g.add(scia)                     // il cerchio sull'acqua
  fondiPerMateriale(testa)
  g.userData = { alto, corpo, testa, coda, uovo, scia, dono: uovo, specie: 'anatra', ms: ANIMALI.anatre.ms, fase: Math.random() * 6, attesa: Math.random() * 2, meta: new THREE.Vector3(),
    zona: { x0: -1.25, x1: 0.85, z0: -0.2, z1: 0.7 }, animaBestia: animaAnatra }
  segniDiPronta(g, g.userData, { raggio: 0.3, yAlone: 0.012, scint: [0.14, 0.5, 0], sbuffo: [0.14, 0.15, 0], rSbuffo: 0.2 })
  return g
}
function animaAnatra (b, u, pr, stadio, dt, t, n) {
  u.attesa -= dt
  const nuota = pr.passo > 0.05
  if (u.attesa <= 0) {
    const z = u.zona
    if (nuota) u.meta.set(z.x0 + Math.random() * (z.x1 - z.x0), b.position.y, z.z0 + Math.random() * (z.z1 - z.z0))
    u.attesa = stadio === 0 ? 1.5 + Math.random() * 2 : 3 + Math.random() * 4              // a fame è agitata, sazia più calma
  }
  const dx = u.meta.x - b.position.x, dz = u.meta.z - b.position.z, d = Math.hypot(dx, dz), mov = nuota && d > 0.05
  if (mov) {
    const v = Math.min(d, 0.24 * pr.passo * pr.lento * dt)
    b.position.x += dx / d * v; b.position.z += dz / d * v
    let da = Math.atan2(dx, dz) - b.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); b.rotation.y += da * Math.min(1, dt * 5)
  }
  u.fase += dt * (mov ? 4 : 1.8 + 1.4 * (1 - pr.f)) * pr.lento
  u.corpo.scale.set(pr.sx, 0.72 * pr.sy, 1.4 * pr.sz)
  u.alto.position.y = pr.corpoY + Math.sin(u.fase * 1.3 + n) * 0.006                           // galleggia
  u.alto.rotation.x = -pr.beccheggio                                                            // da pronta alza il petto
  u.alto.rotation.z = pr.ondeggia * Math.sin(t * 2.6 + n) * 0.08
  u.testa.position.set(0, 0.14 + pr.testaY, 0.13)
  u.testa.scale.y = pr.collo
  const becca = (1 - pr.f) * (1 - pr.f)                                                         // affamata, rimesta il becco nell'acqua
  u.testa.rotation.x = pr.testaX + Math.max(0, Math.sin(u.fase * 1.7)) * 0.35 * becca
  u.coda.rotation.x = -0.9 - pr.codaR * 0.8
  const e = u.uovo; e.visible = pr.uovo > 0.03
  e.scale.set(0.85 * pr.uovo, 1.05 * pr.uovo, 0.85 * pr.uovo); e.position.set(0.1 + 0.03 * pr.uovo, 0.047 * pr.uovo + Math.sin(t * 2 + n) * 0.01, 0.03)
  const s = 0.8 + 0.1 * Math.sin(t * 1.8 + n) + (mov ? 0.15 : 0); u.scia.scale.set(s, 1, 1.4 * s)
}

function costruisciStagnoAnatre () {
  const g = new THREE.Group()
  const legno = mat(0x8a5a34), chiaro = mat(0xc99a5c), canna = mat(0x5f9a3a), pietra = mat(0x9d9a92)
  scatola(g, 3.9, 0.04, 2.9, mat(0x8fd05c), 0, 0.02, 0).receiveShadow = true
  // lo stagno: un'ellisse d'acqua dentro la sponda di terra
  const sponda = pronto(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.05, 24), mat(0xb89b6a))); sponda.scale.set(1.62, 1, 1.0); sponda.position.set(-0.2, 0.045, 0.25); g.add(sponda)
  const acqua = pronto(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.04, 24), mat(0x5fa8d8, { roughness: 0.35 }))); acqua.scale.set(1.5, 1, 0.9); acqua.position.set(-0.2, 0.065, 0.25); g.add(acqua)
  // le ninfee e un sasso o due sulla sponda
  for (const [x, z, r] of [[-0.9, 0.55, 0.13], [0.35, 0.05, 0.1], [-0.2, 0.7, 0.09]]) { cilindro(g, r, r, 0.012, mat(0x4f9a3a), x, 0.09, z, 8); sfera(g, 0.03, mat(0xf4a6c0), x, 0.105, z, 1, 0.6, 1, 5) }
  for (const [x, z, r] of [[-1.85, 0.0, 0.17], [-1.7, 0.45, 0.12], [1.25, 0.75, 0.15], [1.4, 0.4, 0.1]]) sfera(g, r, pietra, x, r * 0.55, z, 1, 0.7, 1, 6)
  // le canne con il pennacchio marrone, in due ciuffi
  for (const [x0, z0] of [[-1.55, -0.55], [0.95, -0.4]]) for (let n = 0; n < 6; n++) {
    const x = x0 + (n % 3) * 0.1, z = z0 + Math.floor(n / 3) * 0.1, h = 0.55 + (n % 4) * 0.12
    cilindro(g, 0.012, 0.016, h, canna, x, h / 2 + 0.05, z, 4).rotation.z = ((n % 3) - 1) * 0.1
    if (n % 2) cilindro(g, 0.022, 0.022, 0.1, mat(0x6a4524), x, h + 0.08, z, 5)
  }
  // il pontile di assi (dalla riva a sinistra) e la casetta delle anatre dietro, a destra
  for (let n = 0; n < 4; n++) scatola(g, 0.14, 0.04, 0.5, legno, -1.55 + n * 0.17, 0.095, 0.75)
  for (const x of [-1.55, -0.95]) cilindro(g, 0.025, 0.025, 0.2, legno, x, 0.08, 1.02, 4)
  const casa = new THREE.Group(); casa.position.set(1.15, 0, -0.85); g.add(casa)
  scatola(casa, 0.95, 0.5, 0.75, chiaro, 0, 0.27, 0)
  scatola(casa, 0.24, 0.24, 0.05, mat(0x3a2a1a), 0.1, 0.22, 0.39)
  const falde = new THREE.Group(); falde.position.y = 0.32; casa.add(falde); tetto(falde, 1.1, 0.95, 0.2, 0x5f7f99, 0.5)
  const rampa = scatola(casa, 0.24, 0.04, 0.55, legno, 0.1, 0.1, 0.62); rampa.rotation.x = 0.35
  // la mangiatoia davanti a destra e il sacco di becchime
  scatola(g, 0.6, 0.1, 0.2, legno, 1.5, 0.07, 0.95); scatola(g, 0.5, 0.03, 0.12, mat(0xe0c060), 1.5, 0.13, 0.95)
  sfera(g, 0.2, mat(0xf2e9d2), 1.55, 0.2, -0.1, 1, 1.15, 0.85, 7)
  g.userData.bestie = []; g.userData.crea = creaAnatra
  g.userData.posto = k => new THREE.Vector3(-0.2 + Math.cos(k * 1.05 + 0.4) * 0.95, 0.07, 0.25 + Math.sin(k * 1.05 + 0.4) * 0.5)      // sei anatre sparse sull'acqua
  g.userData.altezza = 2.0
  fondiPerMateriale(g)
  return g
}
const stagnoVuoto = memoModello('stagno-anatre', costruisciStagnoAnatre)
export function creaStagnoAnatre (stati) { const g = stagnoVuoto(); sincronizzaBestie(g, stati || [{ fine: null }]); return g }
export const creaAnatra = memoModello('anatra', costruisciAnatra, { chiave: (k = 0) => k % 2, dopo: g => { casuale(g); g.userData.attesa = Math.random() * 2 } })

/* ═════════════════════════ il maiale e il porcile ═════════════════════════ */
const G_MAIALE = new THREE.SphereGeometry(0.22, 9, 7), G_ZAMPA_P = new THREE.CylinderGeometry(0.04, 0.036, 0.15, 5), G_ZOCCOLO_P = new THREE.CylinderGeometry(0.038, 0.04, 0.03, 5)
const G_ORECCHIO_P = new THREE.ConeGeometry(0.06, 0.13, 4).translate(0, 0.065, 0), G_MUSO = new THREE.CylinderGeometry(0.06, 0.07, 0.07, 8).rotateX(Math.PI / 2)
const G_RICCIO = new THREE.TorusGeometry(0.04, 0.012, 5, 10, 4.7)
const SCALA_P = [0.78, 0.72, 1.32]
const G_PIATTO = new THREE.CylinderGeometry(0.115, 0.105, 0.014, 12), G_STRISCIA = new THREE.BoxGeometry(0.2, 0.016, 0.031)

function costruisciMaiale (k = 0) {
  const g = new THREE.Group()
  const rosa = mat(k % 2 ? 0xc99a82 : 0xf2a7b0), chiaro = mat(k % 2 ? 0xdcb49c : 0xf7c3c8), scuro = mat(0x3a2a2a), terra = mat(0x5a3d27)
  const corpo = parte(g, G_MAIALE, rosa, 0, 0.26, 0); corpo.scale.set(...SCALA_P)
  for (const [x, z] of [[0.1, 0.17], [-0.1, 0.17], [0.1, -0.17], [-0.1, -0.17]]) { parte(g, G_ZAMPA_P, rosa, x, 0.1, z); parte(g, G_ZOCCOLO_P, scuro, x, 0.015, z) }
  const testa = new THREE.Group(); testa.position.set(0, 0.3, 0.3); g.add(testa)
  parte(testa, G_MAIALE, rosa, 0, 0, 0.06).scale.set(0.5, 0.48, 0.55)
  parte(testa, G_MUSO, chiaro, 0, -0.02, 0.19)
  for (const s of [-1, 1]) parte(testa, G_TESTINA, scuro, s * 0.022, -0.012, 0.23).scale.set(0.3, 0.3, 0.2)
  for (const s of [-1, 1]) parte(testa, G_TESTINA, scuro, s * 0.065, 0.045, 0.14).scale.setScalar(0.28)         // gli occhi
  const orecchie = [-1, 1].map(s => {
    const p = new THREE.Group(); p.position.set(s * 0.085, 0.09, 0.03); testa.add(p)
    parte(p, G_ORECCHIO_P, rosa, 0, 0, 0); p.userData = { lato: s }
    return p
  })
  const coda = new THREE.Group(); coda.position.set(0, 0.32, -0.29); g.add(coda)
  parte(coda, G_RICCIO, chiaro, 0, 0.02, 0).rotation.y = Math.PI / 2
  const mucchio = parte(g, G_TESTINA, terra, 0.42, 0.01, 0.22); mucchio.scale.set(1.6, 0.5, 1.4); mucchio.visible = false          // dove ha scavato
  const dono = new THREE.Group(); dono.position.set(0.42, 0.06, 0.22); g.add(dono); dono.visible = false
  // il dono è la pancetta (non il tartufo, che a schermo sembrava una cacca): un piatto con tre fette a strisce rosse e rosa, a ventaglio
  const piatto = mat(0x9c6b3c), rossa = mat(0xa8282a), rosa2 = mat(0xe8968a), grasso = mat(0xf6d2c2)
  parte(dono, G_PIATTO, piatto, 0, 0, 0)
  for (const [i, ang, dx] of [[0, -0.5, -0.02], [1, 0.05, 0.0], [2, 0.55, 0.02]]) {
    const fetta = new THREE.Group(); fetta.position.set(dx, 0.014 + i * 0.016, 0); fetta.rotation.y = ang; dono.add(fetta)
    // strisce irregolari come le venature della pancetta: lunghezze e colori non a righe regolari, un'ondina in altezza
    for (let n = 0; n < 5; n++) { const m = parte(fetta, G_STRISCIA, [rossa, rosa2, rossa, grasso, rosa2][(n + i) % 5], ((n * 7 + i * 3) % 5 - 2) * 0.008, Math.sin(n * 1.7 + i) * 0.004, (n - 2) * 0.031); m.scale.set(0.82 + ((n + i) % 3) * 0.1, 1, 1) }
  }
  fondiPerMateriale(testa, { escludi: orecchie }); fondiPerMateriale(dono); fondiPerMateriale(g, { escludi: [corpo, testa, coda, mucchio, dono] })
  g.userData = { corpo, testa, coda, orecchie, mucchio, dono, specie: 'maiale', ms: ANIMALI.porcile.ms, fase: Math.random() * 6, meta: new THREE.Vector3(), animaBestia: animaMaiale }
  segniDiPronta(g, g.userData, { raggio: 0.5, yAlone: 0.02, scint: [0.42, 0.4, 0.22], sbuffo: [0.42, 0.18, 0.22], rSbuffo: 0.22 })
  return g
}
function animaMaiale (b, u, pr, stadio, dt, t, n) {
  const ph = u.fase += dt * pr.lento
  u.corpo.scale.set(SCALA_P[0] * pr.sx, SCALA_P[1] * pr.sy, SCALA_P[2] * pr.sz)
  u.corpo.position.y = 0.26 + pr.corpoY + Math.sin(ph * 1.1 + n) * 0.005
  u.testa.position.y = 0.3 + pr.testaY
  u.testa.rotation.x = pr.testaX + pr.grufola * (0.35 + 0.35 * Math.sin(ph * 5 + n))            // al lavoro il muso va su e giù nel fango
  const o = pr.orecchie
  for (const p of u.orecchie) p.rotation.z = -p.userData.lato * (o + Math.sin(ph * 2 + n) * 0.05)
  u.coda.rotation.z = Math.sin(ph * (stadio === 2 ? 4 : 1.6) + n * 2) * 0.5 * pr.coda
  u.coda.scale.setScalar(0.3 + 0.7 * pr.coda)
  const m = pr.mucchio; u.mucchio.visible = m > 0.03; u.mucchio.scale.set(1.6 * m, 0.5 * m, 1.4 * m)
  const d = u.dono; d.visible = pr.dono > 0.03; d.scale.setScalar(pr.dono * 2.2)
}

function costruisciPorcile () {
  const g = new THREE.Group()
  const legno = mat(0x8a5a34), chiaro = mat(0xc99a5c), fango = mat(0x6b4a32), paglia = mat(0xe0c060)
  scatola(g, 3.9, 0.04, 2.9, mat(0x8fd05c), 0, 0.02, 0).receiveShadow = true
  scatola(g, 3.5, 0.025, 1.45, fango, 0, 0.05, 0.62)                                      // il fango del recinto
  const pozza = pronto(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.012, 14), mat(0x8a6a4a, { roughness: 0.3 }))); pozza.scale.set(0.55, 1, 0.3); pozza.position.set(0.9, 0.07, 0.95); g.add(pozza)
  // il porcile: casetta di assi col tetto rosso, la porta bassa e la finestrella
  const casa = new THREE.Group(); casa.position.set(0, 0, -0.85); g.add(casa)
  scatola(casa, 2.3, 0.95, 1.0, chiaro, 0, 0.5, 0)
  scatola(casa, 0.55, 0.5, 0.06, mat(0x2a1a10), -0.5, 0.3, 0.52)
  scatola(casa, 0.4, 0.3, 0.06, mat(0xa6d8ee), 0.55, 0.7, 0.52)
  for (const x of [-0.8, -0.3, 0.2, 0.7]) scatola(casa, 0.03, 0.95, 0.02, legno, x + 0.1, 0.5, 0.51)
  const falde = new THREE.Group(); falde.position.y = 0.95; casa.add(falde); tetto(falde, 2.5, 1.25, 0.0, 0xa8392f, 0.5)
  // il truogolo lungo contro il muro, con la sbobba
  scatola(g, 1.4, 0.16, 0.26, legno, 0.75, 0.1, -0.2); scatola(g, 1.28, 0.03, 0.16, mat(0xb08a50), 0.75, 0.18, -0.2)
  // un balla di paglia e il cartello della pancetta
  const balla = cilindro(g, 0.2, 0.2, 0.4, paglia, -1.55, 0.24, -0.35, 8); balla.rotation.z = Math.PI / 2
  cilindro(g, 0.025, 0.025, 0.75, legno, 1.65, 0.38, 0.1, 5)
  insegna(g, '🥓 PANCETTA', 0.7, 0.24, 1.65, 0.8, 0.12, { w: 256, h: 88, sfondo: '#6b4a32', px: 36 })
  // lo steccato davanti e ai lati, col cancelletto in mezzo
  const X = 1.85, Zf = 1.38, Zm = -0.3, Gx = 0.38
  const palo = (x, z) => cilindro(g, 0.04, 0.045, 0.62, legno, x, 0.32, z, 6)
  const sbarra = (lx, lz, x, z, y, m = legno) => scatola(g, lx, 0.06, lz, m, x, y, z)
  for (const s of [-1, 1]) {
    for (const x of [X, 1.36, 0.87, Gx]) palo(s * x, Zf)
    for (let n = 0; n < 5; n++) palo(s * X, Zf - (Zf - Zm) * (n + 1) / 5)
    for (const y of [0.24, 0.46]) { sbarra(X - Gx, 0.05, s * (X + Gx) / 2, Zf, y); sbarra(0.05, Zf - Zm, s * X, (Zf + Zm) / 2, y) }
  }
  for (const y of [0.2, 0.46]) sbarra(2 * Gx - 0.08, 0.05, 0, Zf, y, chiaro)
  g.userData.bestie = []; g.userData.crea = creaMaiale
  g.userData.posto = k => new THREE.Vector3(-1.2 + k * 0.78 - (k % 2) * 0.05, 0.05, 0.5 + (k % 2) * 0.28)           // quattro maiali nel fango, a zig-zag
  g.userData.altezza = 2.2
  fondiPerMateriale(g)
  return g
}
const porcileVuoto = memoModello('porcile', costruisciPorcile)
export function creaPorcile (stati) { const g = porcileVuoto(); sincronizzaBestie(g, stati || [{ fine: null }]); return g }
export const creaMaiale = memoModello('maiale', costruisciMaiale, { chiave: (k = 0) => k % 2, dopo: casuale })

/* ═════════════════════════ la capra e il recinto ═════════════════════════ */
const G_CAPRA = new THREE.SphereGeometry(0.2, 9, 7), G_ZAMPA_C = new THREE.CylinderGeometry(0.024, 0.02, 0.3, 5), G_ZOCCOLO_C = new THREE.CylinderGeometry(0.024, 0.026, 0.04, 5)
const G_CORNO_C = new THREE.ConeGeometry(0.026, 0.17, 5), G_ORECCHIO_C = new THREE.SphereGeometry(0.05, 6, 4).scale(1.5, 0.28, 0.8).translate(0.06, 0, 0), G_BARBA = new THREE.ConeGeometry(0.022, 0.1, 4)
const SCALA_C = [0.62, 0.64, 1.4]

function costruisciCapra (k = 0) {
  const g = new THREE.Group()
  const manto = mat(k % 2 ? 0x9a7048 : 0xf4efe4), chiaro = mat(0xf4efe4), scuro = mat(0x2a2018), corno = mat(0xd8cfae), rosa = mat(0xf0b0a8)
  const corpo = parte(g, G_CAPRA, manto, 0, 0.4, 0); corpo.scale.set(...SCALA_C)
  for (const [x, z] of [[0.065, 0.17], [-0.065, 0.17], [0.065, -0.17], [-0.065, -0.17]]) { parte(g, G_ZAMPA_C, k % 2 ? scuro : chiaro, x, 0.19, z); parte(g, G_ZOCCOLO_C, scuro, x, 0.02, z) }
  const mammella = parte(g, G_UOVO_C, mat(0xff8aa0), 0, 0.23, -0.15); mammella.scale.set(0.1, 0.1, 0.1)
  const pallida = parte(g, G_UOVO_C, mat(0xcdb7b3), 0, 0.23, -0.15); pallida.scale.set(1.1, 1.3, 1.1)
  const goccia = parte(g, G_TESTINA, mat(0xffffff, { emissive: 0x808080 }), 0, 0.15, -0.15); goccia.scale.setScalar(0.3); goccia.visible = false
  const coda = new THREE.Group(); coda.position.set(0, 0.5, -0.27); g.add(coda)
  parte(coda, new THREE.ConeGeometry(0.03, 0.12, 4).translate(0, 0.06, 0), manto, 0, 0, 0)
  parte(g, G_CAPRA, manto, 0, 0.55, 0.26).scale.set(0.24, 0.5, 0.3)                       // il collo
  const testa = new THREE.Group(); testa.position.set(0, 0.62, 0.34); g.add(testa)
  parte(testa, G_CAPRA, chiaro, 0, 0, 0.07).scale.set(0.34, 0.36, 0.5)
  parte(testa, G_CAPRA, k % 2 ? manto : rosa, 0, -0.035, 0.17).scale.set(0.2, 0.17, 0.22)    // il muso
  for (const s of [-1, 1]) { const c = parte(testa, G_CORNO_C, corno, s * 0.04, 0.1, -0.02); c.rotation.set(-0.7, 0, -s * 0.2) }
  parte(testa, G_BARBA, k % 2 ? scuro : chiaro, 0, -0.1, 0.16).rotation.x = Math.PI              // la barbetta
  for (const s of [-1, 1]) parte(testa, G_TESTINA, scuro, s * 0.045, 0.03, 0.12).scale.setScalar(0.22)
  const orecchie = [-1, 1].map(s => {
    const p = new THREE.Group(); p.position.set(s * 0.05, 0.05, -0.01); testa.add(p)
    const o = parte(p, G_ORECCHIO_C, manto, 0, 0, 0); o.scale.x = s; p.userData = { lato: s }
    return p
  })
  const secchio = new THREE.Group(); secchio.position.set(0.34, 0, 0.26); g.add(secchio); secchio.visible = false
  cilindro(secchio, 0.09, 0.07, 0.15, mat(0xb87333, { metalness: 0.5, roughness: 0.45 }), 0, 0.075, 0, 8)
  cilindro(secchio, 0.078, 0.078, 0.02, mat(0xffffff), 0, 0.15, 0, 8)
  fondiPerMateriale(testa, { escludi: orecchie }); fondiPerMateriale(coda); fondiPerMateriale(g, { escludi: [corpo, testa, coda, secchio, mammella, pallida, goccia] })
  g.userData = { corpo, testa, coda, orecchie, mammella, pallida, goccia, dono: secchio, specie: 'capra', ms: ANIMALI.capre.ms, fase: Math.random() * 6, meta: new THREE.Vector3(), animaBestia: animaCapra }
  segniDiPronta(g, g.userData, { raggio: 0.42, yAlone: 0.025, scint: [0.34, 0.38, 0.26], sbuffo: [0.34, 0.2, 0.26], rSbuffo: 0.2 })
  return g
}
function animaCapra (b, u, pr, stadio, dt, t, n) {
  const ph = u.fase += dt * pr.lento
  u.corpo.scale.set(SCALA_C[0] * pr.sx, SCALA_C[1] * pr.sy, SCALA_C[2] * pr.sz)
  u.corpo.position.y = 0.4 + pr.corpoY + Math.sin(ph * 0.9 + n) * 0.005
  u.testa.position.y = 0.62 + pr.testaY + Math.sin(ph * 2.4 + n) * (stadio === 1 ? 0.01 : 0.003)       // mastica
  u.testa.rotation.x = pr.testaX + Math.sin(ph * 0.8 + n) * 0.05
  for (const p of u.orecchie) p.rotation.z = -p.userData.lato * ((pr.orecchie - 1.0) * 1.2 + Math.sin(ph * 3 + n + p.userData.lato) * 0.06 * pr.coda)      // a fame cadono
  u.coda.rotation.x = -0.4 - 0.5 * pr.coda; u.coda.rotation.z = Math.sin(ph * (stadio === 2 ? 5 : 2) + n) * 0.4 * pr.coda
  const m = pr.mammella; u.mammella.visible = m > 0.03; u.mammella.scale.set(2.8 * m, 2.2 * m, 2.6 * m)
  const q = pr.pallida; u.pallida.visible = q > 0.03; u.pallida.scale.set(1.1 * q, 1.3 * q, 1.1 * q)
  const c = (t * 0.9 + n * 0.37) % 1
  u.goccia.visible = pr.goccia > 0.5 && c < 0.4
  if (u.goccia.visible) u.goccia.position.y = 0.15 - (c / 0.4) * (c / 0.4) * 0.12
  const d = u.dono; d.visible = pr.dono > 0.03; d.scale.setScalar(pr.dono * 1.5)
  const c0 = u.casa; if (c0) b.position.y = c0.y + pr.salto * Math.max(0, Math.sin(t * 3.2 + n * 1.7)) * 0.07        // da pronta saltella
}

function costruisciRecintoCapre () {
  const g = new THREE.Group()
  const legno = mat(0x8a5a34), chiaro = mat(0xc99a5c), roccia = mat(0x8d8a82), paglia = mat(0xe0c060)
  scatola(g, 3.9, 0.04, 2.9, mat(0x8fd05c), 0, 0.02, 0).receiveShadow = true
  scatola(g, 3.5, 0.02, 1.5, mat(0xcdb27a), 0, 0.05, 0.6)                                 // la terra battuta
  // la roccia a gradini, dove le capre vogliono salire
  const gradini = [[0.0, 0.18, 0.0, 1.0, 0.36, 0.7], [0.05, 0.43, -0.02, 0.7, 0.28, 0.5], [0.1, 0.65, -0.03, 0.4, 0.2, 0.3]]
  for (const [x, y, z, w, h, d] of gradini) scatola(g, w, h, d, roccia, -1.35 + x, y, -0.75 + z)
  // la tettoia di assi su quattro pali, con la rastrelliera del fieno
  const tett = new THREE.Group(); tett.position.set(0.7, 0, -0.85); g.add(tett)
  for (const [x, z] of [[-0.9, -0.35], [0.9, -0.35], [-0.9, 0.35], [0.9, 0.35]]) cilindro(tett, 0.05, 0.055, 1.1, legno, x, 0.55, z, 6)
  const falde = new THREE.Group(); falde.position.y = 1.1; tett.add(falde); tetto(falde, 2.2, 1.0, 0.0, 0x8a5a34, 0.28)
  scatola(tett, 1.7, 0.5, 0.12, chiaro, 0, 0.3, -0.38)                                      // il retro chiuso
  scatola(tett, 1.4, 0.08, 0.32, legno, 0, 0.36, 0.0)                                         // la mangiatoia
  for (let n = 0; n < 7; n++) scatola(tett, 0.03, 0.4, 0.03, legno, -0.6 + n * 0.2, 0.62, 0.17)       // i pioli della rastrelliera
  scatola(tett, 1.3, 0.14, 0.18, paglia, 0, 0.45, 0.0)
  const balla = cilindro(g, 0.2, 0.2, 0.4, paglia, 1.7, 0.24, -0.2, 8); balla.rotation.z = Math.PI / 2
  // l'abbeveratoio
  scatola(g, 0.6, 0.14, 0.25, legno, -0.35, 0.09, 0.0); scatola(g, 0.5, 0.03, 0.17, mat(0x5fa8d8), -0.35, 0.16, 0.0)
  // lo steccato basso con il cancelletto, come quello della stalla
  const X = 1.85, Zf = 1.4, Zm = -0.3, Gx = 0.38
  const palo = (x, z) => cilindro(g, 0.04, 0.045, 0.68, legno, x, 0.34, z, 6)
  const sbarra = (lx, lz, x, z, y, m = legno) => scatola(g, lx, 0.06, lz, m, x, y, z)
  for (const s of [-1, 1]) {
    for (const x of [X, 1.36, 0.87, Gx]) palo(s * x, Zf)
    for (let n = 0; n < 5; n++) palo(s * X, Zf - (Zf - Zm) * (n + 1) / 5)
    for (const y of [0.26, 0.5]) { sbarra(X - Gx, 0.05, s * (X + Gx) / 2, Zf, y); sbarra(0.05, Zf - Zm, s * X, (Zf + Zm) / 2, y) }
  }
  for (const y of [0.22, 0.52]) sbarra(2 * Gx - 0.08, 0.05, 0, Zf, y, chiaro)
  g.userData.bestie = []; g.userData.crea = creaCapra
  g.userData.posto = k => new THREE.Vector3(-0.7 + k * 0.78, 0.05, 0.5 + (k % 2) * 0.28)        // quattro capre davanti alla tettoia
  g.userData.altezza = 2.4
  fondiPerMateriale(g)
  return g
}
const capreVuote = memoModello('recinto-capre', costruisciRecintoCapre)
export function creaRecintoCapre (stati) { const g = capreVuote(); sincronizzaBestie(g, stati || [{ fine: null }]); return g }
export const creaCapra = memoModello('capra', costruisciCapra, { chiave: (k = 0) => k % 2, dopo: casuale })

/* ═════════════════════════ il pentolone (una macchina, 3×3) ═════════════════════════ */
function costruisciPentolone () {
  const g = new THREE.Group()
  const ferro = mat(0x2e2e34, { metalness: 0.5, roughness: 0.55 }), pietra = mat(0x8d8a82), legno = mat(0x7b4a24), tegola = mat(0xb4553a)
  lastra(g, 3.0, 2.9, 0xcfc3a8)
  // il focolare di pietre in cerchio, con la legna e le fiamme
  const fuoco = new THREE.Group(); fuoco.position.set(0, 0, 0.35); g.add(fuoco)
  for (let n = 0; n < 10; n++) { const a = n / 10 * Math.PI * 2; sfera(fuoco, 0.14, pietra, Math.cos(a) * 0.62, 0.1, Math.sin(a) * 0.62, 1, 0.75, 1, 6) }
  for (const r of [0.4, 2.1, 3.7]) { const l = cilindro(fuoco, 0.05, 0.05, 0.7, legno, 0, 0.12, 0, 5); l.rotation.set(Math.PI / 2, 0, r) }
  const fiamme = []
  for (let n = 0; n < 6; n++) {
    const a = n / 6 * Math.PI * 2 + 0.3, f = cono(fuoco, 0.1, 0.38, mat(n % 2 ? 0xffb02e : 0xff6a1f, { emissive: n % 2 ? 0xd88a10 : 0xd8400a, emissiveIntensity: 0.9 }), Math.cos(a) * 0.28, 0.3, Math.sin(a) * 0.28, 5)
    fiamme.push(f)
  }
  // il pentolone di ferro, che bolle: sfera schiacciata aperta in cima, orlo, brodo verde e le bolle
  const pent = new THREE.Group(); pent.position.set(0, 0.74, 0.35); g.add(pent)
  const corpo = pronto(new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 8, 0, Math.PI * 2, Math.PI * 0.18, Math.PI * 0.82), mat(0x2e2e34, { metalness: 0.5, roughness: 0.55, side: THREE.DoubleSide }))); corpo.scale.y = 0.9; corpo.position.y = 0.0; pent.add(corpo)
  const orlo = pronto(new THREE.Mesh(new THREE.TorusGeometry(0.575, 0.05, 6, 16), ferro)); orlo.rotation.x = Math.PI / 2; orlo.position.y = 0.45; pent.add(orlo)
  const brodo = cilindro(pent, 0.56, 0.56, 0.02, mat(0x86b83e, { emissive: 0x3d6a14, emissiveIntensity: 0.5 }), 0, 0.38, 0, 14)
  const bolle = []
  for (let n = 0; n < 4; n++) bolle.push(sfera(pent, 0.06, mat(0xb4dc6a, { emissive: 0x5a8a24, emissiveIntensity: 0.4 }), 0, 0.4, 0, 1, 0.8, 1, 6))
  // i due pali con la traversa e il mestolo appeso
  for (const x of [-0.95, 0.95]) cilindro(g, 0.05, 0.06, 1.7, legno, x, 0.85, 0.35, 6)
  scatola(g, 2.1, 0.08, 0.08, legno, 0, 1.7, 0.35)
  cilindro(g, 0.015, 0.015, 0.5, ferro, 0.55, 1.42, 0.35, 4)
  const mestolo = cilindro(g, 0.07, 0.05, 0.05, ferro, 0.55, 1.14, 0.35, 8); mestolo.position.y = 1.14
  // le verdure in sacchi e ceste a destra: zucche, patate, un cavolfiore
  for (const [x, z, s] of [[1.15, 0.95, 1], [1.4, 0.65, 0.8], [0.95, 1.2, 0.85]]) sfera(g, 0.22 * s, mat(0xe8821e), x, 0.2 * s + 0.05, z, 1.1, 0.8, 1.1, 8)
  for (const [x, z] of [[-1.2, 1.0], [-1.0, 1.15], [-1.35, 0.8], [-1.1, 0.9]]) sfera(g, 0.1, mat(0xb48a58), x, 0.14, z, 1.2, 0.85, 1, 6)
  sfera(g, 0.2, mat(0xf3efe0), -0.75, 0.25, 1.15, 1, 0.9, 1, 7)
  // la tettoia dietro, a legna: muretto, tetto e l'insegna
  scatola(g, 2.6, 0.9, 0.5, pietra, 0, 0.45, -1.1)
  const falde = new THREE.Group(); falde.position.set(0, 0.9, -1.1); g.add(falde); tetto(falde, 2.8, 0.9, 0.0, 0xb4553a, 0.4)
  insegna(g, '🍲 PENTOLONE', 1.6, 0.3, 0, 0.5, -0.83, { w: 384, h: 72, sfondo: '#4a3224', px: 40 })
  g.userData.fumo = new THREE.Vector3(0, 1.4, 0.35)
  g.userData.fiamme = fiamme; g.userData.bolle = bolle; g.userData.brodo = brodo; g.userData.pent = pent
  g.userData.anima = function (dt, tt) {
    this.fiamme.forEach((f, n) => { const s = 0.75 + 0.35 * Math.sin(tt * 9 + n * 1.7) * Math.sin(tt * 5.3 + n); f.scale.set(1, s, 1) })
    this.bolle.forEach((b, n) => { const f = (tt * 0.8 + n / this.bolle.length) % 1, a = n * 1.9; b.position.set(Math.cos(a) * 0.3 * (0.4 + f * 0.6), 0.4 + Math.sin(f * Math.PI) * 0.08, Math.sin(a) * 0.3 * (0.4 + f * 0.6)); b.scale.setScalar(0.5 + 0.6 * Math.sin(f * Math.PI)) })
    this.pent.rotation.z = Math.sin(tt * 1.1) * 0.006
  }
  g.userData.altezza = 2.4
  fondiPerMateriale(g, { escludi: [...fiamme, ...bolle, pent] })
  fondiPerMateriale(pent, { escludi: [...bolle] })
  return g
}
export const creaPentolone = memoModello('pentolone', costruisciPentolone)

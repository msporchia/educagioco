// Gli addobbi delle bestie, in codice: i dodici della 2D (dati/addobbi.js) come piccoli modelli, e dove si agganciano su ogni corpo.
// Ogni addobbo è disegnato per una testa di raggio ~0,15 con l'origine dove tocca la bestia (+y su, +z verso il muso); `AGGANCI` lo porta
// sul perno giusto (testa o corpo, così segue le pose) con la sua scala. Vedi docs/fattoria3d/addobbi.md.
import * as THREE from 'three'
import { mat } from './modelli.js'
import { fondiPerMateriale } from './fondi.js'
import { memoModello } from './cache-modelli.js'
import { leggiAddobbo } from '../dati/addobbi.js'

const mesh = (g, geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o }
const scatola = (g, w, h, d, m, x, y, z) => mesh(g, new THREE.BoxGeometry(w, h, d), m, x, y, z)
const cilindro = (g, rs, ri, h, m, x, y, z, seg = 14) => mesh(g, new THREE.CylinderGeometry(rs, ri, h, seg), m, x, y, z)
const sfera = (g, r, m, x, y, z, seg = 10) => mesh(g, new THREE.SphereGeometry(r, seg, Math.max(6, seg - 4)), m, x, y, z)
const anello = (g, r, t, m, x, y, z, seg = 18) => mesh(g, new THREE.TorusGeometry(r, t, 6, seg), m, x, y, z)
const cono = (g, r, h, m, x, y, z, seg = 10) => mesh(g, new THREE.ConeGeometry(r, h, seg), m, x, y, z)
const oro = () => mat(0xf2c230, { metalness: 0.5, roughness: 0.35 })
const scuro = (c, k = 0.72) => new THREE.Color(c).multiplyScalar(k).getHex()
const BIANCO = 0xf4efe4

// Ogni disegno riceve il gruppo e il colore scelto `c` (esadecimale): la parte che cambia è il colore principale, il resto (fibbie, pompon,
// lenti) resta com'è. Il colore di base di ognuno è il primo della sua lista (dati/addobbi-colori.js).
const DISEGNI = {
  // ── in testa ──
  fiore (g, c) {                                                  // di lato, sopra l'orecchio
    const petalo = mat(c), f = new THREE.Group(); f.position.set(0.075, 0.0, 0.03); f.rotation.set(0.2, 0.5, -0.5); g.add(f)
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; sfera(f, 0.03, petalo, Math.cos(a) * 0.034, 0.012, Math.sin(a) * 0.034, 8).scale.set(1, 0.45, 1) }
    sfera(f, 0.022, mat(c === 0xf2b831 ? 0xf2802a : 0xf2c230), 0, 0.02, 0, 8)
  },
  cappellino (g, c) {                                             // il berretto da baseball, la visiera avanti
    const colore = mat(c)
    mesh(g, new THREE.SphereGeometry(0.088, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), colore, 0, -0.005, 0)
    scatola(g, 0.11, 0.012, 0.085, colore, 0, 0.0, 0.105).rotation.x = -0.12
    sfera(g, 0.013, mat(0xffffff), 0, 0.085, 0, 6)
  },
  cilindro (g, c) {
    const cappello = mat(c)
    cilindro(g, 0.115, 0.115, 0.012, cappello, 0, 0.006, 0, 18)
    cilindro(g, 0.072, 0.07, 0.15, cappello, 0, 0.085, 0, 16)
    cilindro(g, 0.0735, 0.0735, 0.028, mat(c === 0xd8322b ? BIANCO : 0xc8382e), 0, 0.03, 0, 16)
  },
  corona (g, c) {
    const o = mat(c, { metalness: 0.5, roughness: 0.35 })
    cilindro(g, 0.078, 0.082, 0.04, o, 0, 0.02, 0, 16)
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; cono(g, 0.02, 0.055, o, Math.sin(a) * 0.075, 0.065, Math.cos(a) * 0.075, 5) }
    sfera(g, 0.014, mat(0xd8212f, { roughness: 0.3 }), 0, 0.022, 0.082, 6)
    for (const s of [-1, 1]) sfera(g, 0.011, mat(0x2f6fd0, { roughness: 0.3 }), s * 0.058, 0.022, 0.058, 6)
  },
  cappello_strega (g, c) {
    const cappello = mat(c)
    cilindro(g, 0.14, 0.14, 0.01, cappello, 0, 0.005, 0, 18)
    const punta = cono(g, 0.08, 0.24, cappello, 0, 0.13, -0.01, 12); punta.rotation.x = -0.18
    cilindro(g, 0.081, 0.081, 0.026, mat(scuro(c, 0.5)), 0, 0.025, 0, 14)
    scatola(g, 0.03, 0.028, 0.008, oro(), 0, 0.025, 0.08)
  },
  // ── di Natale, in testa ──
  cappello_babbo (g, c) {                                         // il cono che ricade all'indietro, la fascia col pelo e il pompon
    const stoffa = mat(c), pelo = mat(BIANCO)
    const cima = new THREE.Group(); cima.rotation.x = -0.5; g.add(cima)
    cono(cima, 0.085, 0.2, stoffa, 0, 0.1, -0.005, 12)
    sfera(cima, 0.026, pelo, 0, 0.2, -0.005, 8)
    cilindro(g, 0.092, 0.092, 0.04, pelo, 0, 0.012, 0, 16)
  },
  cappello_elfo (g, c) {                                          // il cappello a punta, piegato, con la fascia d'oro e il campanellino
    const stoffa = mat(c), o = oro()
    const cima = new THREE.Group(); cima.rotation.x = -0.35; g.add(cima)
    cono(cima, 0.08, 0.17, stoffa, 0, 0.085, 0, 10)
    const punta = new THREE.Group(); punta.position.set(0, 0.17, 0); punta.rotation.x = -0.8; cima.add(punta)
    cono(punta, 0.034, 0.1, stoffa, 0, 0.05, 0, 8)
    sfera(punta, 0.016, o, 0, 0.105, 0, 7)
    cilindro(g, 0.087, 0.09, 0.03, mat(scuro(c, 0.6)), 0, 0.012, 0, 16)
    scatola(g, 0.03, 0.026, 0.008, o, 0, 0.012, 0.087)
  },
  corna_renna (g, c) {                                            // due corna ramose ai lati della testa
    const corno = mat(c)
    for (const s of [-1, 1]) {
      const a = new THREE.Group(); a.position.set(s * 0.06, 0.02, -0.01); a.rotation.z = -s * 0.35; g.add(a)
      cilindro(a, 0.009, 0.013, 0.14, corno, 0, 0.07, 0, 6)
      for (const [y, l] of [[0.06, 0.07], [0.105, 0.055]]) { const r = cilindro(a, 0.007, 0.01, l, corno, s * 0.025, y + 0.02, 0, 6); r.rotation.z = -s * 0.8 }
    }
  },
  // ── sul muso: davanti agli occhi ──
  occhialini (g, c) {
    const montatura = mat(c), lente = mat(0xd8eef8, { roughness: 0.2 })
    for (const s of [-1, 1]) {
      anello(g, 0.036, 0.0065, montatura, s * 0.05, 0, 0)
      cilindro(g, 0.032, 0.032, 0.003, lente, s * 0.05, 0, -0.002, 12).rotation.x = Math.PI / 2
    }
    scatola(g, 0.03, 0.007, 0.007, montatura, 0, 0.008, 0)
  },
  occhiali (g, c) {
    const montatura = mat(c), lente = mat(0x1d2430, { roughness: 0.15, metalness: 0.3 })
    for (const s of [-1, 1]) {
      cilindro(g, 0.042, 0.04, 0.008, lente, s * 0.052, 0, 0, 12).rotation.x = Math.PI / 2
      anello(g, 0.042, 0.006, montatura, s * 0.052, 0, 0.002)
    }
    scatola(g, 0.026, 0.008, 0.008, montatura, 0, 0.012, 0.002)
  },
  // ── al collo: un anello attorno al collo, la cosa davanti ──
  fiocco (g, c) {
    const nastro = mat(c)
    for (const s of [-1, 1]) { const ala = cono(g, 0.04, 0.06, nastro, s * 0.035, -0.01, 0.1, 6); ala.rotation.z = s * Math.PI / 2; ala.scale.set(1, 1, 0.45) }
    sfera(g, 0.017, nastro, 0, -0.01, 0.1, 8)
  },
  sciarpa (g, c) {
    const lana = mat(c), bianco = mat(BIANCO)
    anello(g, 0.1, 0.032, lana, 0, 0, 0, 16).rotation.x = Math.PI / 2
    const coda = new THREE.Group(); coda.position.set(0.05, -0.02, 0.09); coda.rotation.z = 0.25; g.add(coda)
    scatola(coda, 0.045, 0.13, 0.02, lana, 0, -0.06, 0)
    scatola(coda, 0.046, 0.02, 0.021, bianco, 0, -0.1, 0)
  },
  sciarpa_righe (g, c) {                                          // a righe di due colori: due strisce chiare sul giro, tre sulla coda
    const lana = mat(c), bianco = mat(BIANCO)
    anello(g, 0.1, 0.032, lana, 0, 0, 0, 16).rotation.x = Math.PI / 2
    for (const y of [-0.019, 0.019]) { const riga = anello(g, 0.1, 0.0345, bianco, 0, y, 0, 16); riga.rotation.x = Math.PI / 2; riga.scale.z = 0.3 }
    const coda = new THREE.Group(); coda.position.set(0.05, -0.02, 0.09); coda.rotation.z = 0.25; g.add(coda)
    scatola(coda, 0.045, 0.14, 0.02, lana, 0, -0.065, 0)
    for (const y of [-0.03, -0.075, -0.12]) scatola(coda, 0.046, 0.016, 0.021, bianco, 0, y, 0)
  },
  campanella (g, c) {
    anello(g, 0.1, 0.012, mat(c), 0, 0, 0, 18).rotation.x = Math.PI / 2
    const o = oro()
    const campana = sfera(g, 0.026, o, 0, -0.03, 0.105, 10); campana.scale.set(1, 1.1, 1)
    cilindro(g, 0.03, 0.03, 0.008, o, 0, -0.05, 0.105, 10)
  },
  campanelli (g, c) {                                             // un collare verde e tre campanelli attaccati davanti
    anello(g, 0.1, 0.012, mat(0x2f7a3a), 0, 0, 0, 18).rotation.x = Math.PI / 2
    const m = mat(c, { metalness: 0.55, roughness: 0.3 })
    for (const [x, y, r] of [[-0.045, -0.025, 0.02], [0, -0.04, 0.026], [0.045, -0.025, 0.02]]) {
      sfera(g, r, m, x, y, 0.1, 9)
      cilindro(g, r * 1.05, r * 1.05, 0.006, mat(scuro(c, 0.5)), x, y - r * 0.85, 0.1, 9)
    }
  },
  // ── sulla schiena ──
  mantellina (g, c) {
    const stoffa = mat(c), o = oro()
    scatola(g, 0.22, 0.016, 0.26, stoffa, 0, 0.0, 0)
    for (const s of [-1, 1]) { const f = scatola(g, 0.016, 0.12, 0.24, stoffa, s * 0.12, -0.05, 0); f.rotation.z = s * 0.45 }
    sfera(g, 0.016, o, 0, 0.004, 0.13, 6)
  },
  zainetto (g, c) {
    const tela = mat(c), bordo = mat(scuro(c))
    scatola(g, 0.13, 0.085, 0.12, tela, 0, 0.042, 0)
    scatola(g, 0.135, 0.025, 0.07, bordo, 0, 0.088, -0.02)
    scatola(g, 0.09, 0.05, 0.02, bordo, 0, 0.035, -0.066)
    for (const s of [-1, 1]) scatola(g, 0.016, 0.012, 0.13, bordo, s * 0.05, 0.002, 0.005)
  },
  pacco_regalo (g, c) {                                           // la scatola col nastro d'oro in croce e il fiocco sopra
    const carta = mat(c), nastro = oro()
    scatola(g, 0.13, 0.09, 0.13, carta, 0, 0.045, 0)
    scatola(g, 0.134, 0.092, 0.024, nastro, 0, 0.045, 0)
    scatola(g, 0.024, 0.092, 0.134, nastro, 0, 0.045, 0)
    for (const s of [-1, 1]) { const ala = cono(g, 0.03, 0.05, nastro, s * 0.028, 0.105, 0, 6); ala.rotation.z = s * Math.PI / 2; ala.scale.set(1, 1, 0.5) }
    sfera(g, 0.014, nastro, 0, 0.105, 0, 6)
  },
}

function costruisci (chiave) {
  const l = leggiAddobbo(chiave), d = l && DISEGNI[l.addobbo.id]
  if (!d) return null
  const g = new THREE.Group()
  d(g, l.colore.hex)
  fondiPerMateriale(g, { soglia: 0 })
  return g
}
const creaAddobbo3 = memoModello('addobbo', costruisci, { chiave: k => k })
/** Il modello di un addobbo in un colore (`<id>:<colore>`; l'id solo vale il colore di base; null se non c'è), con l'origine dove tocca la bestia. */
export const creaAddobbo = chiave => (leggiAddobbo(chiave) && DISEGNI[leggiAddobbo(chiave).addobbo.id] ? creaAddobbo3(leggiAddobbo(chiave).chiave) : null)
export const ADDOBBI_DISEGNATI = Object.keys(DISEGNI)

/** Dove cade ogni aggancio su ogni corpo: [perno, x, y, z, scala, giro avanti]. Il perno è `testa` o `corpo` del modello (così l'addobbo
    segue le pose); le misure sono nelle coordinate del perno, lette dai volumi del corpo (modelli-compagni.js, modelli-bestie.js). */
export const AGGANCI = {
  cane:       { testa: ['testa', 0, 0.42, 0.13, 1.9, -0.15], muso: ['testa', 0, 0.13, 0.425, 2.1, 0], collo: ['corpo', 0, 0.2, 0.5, 2.5, 0.45], schiena: ['corpo', 0, 0.31, 0.1, 2.2, 0] },
  beagle:     { testa: ['testa', 0, 0.27, 0.15, 1.0, -0.1], muso: ['testa', 0, 0.175, 0.32, 1.45, 0], collo: ['corpo', 0, 0.16, 0.44, 1.1, 0.5], schiena: ['corpo', 0, 0.28, 0.1, 1.4, 0] },
  gatto:      { testa: ['testa', 0, 0.235, 0.05, 1.05, -0.1], muso: ['testa', 0, 0.12, 0.185, 1.3, 0], collo: ['corpo', 0, 0.15, 0.39, 0.95, 0.35], schiena: ['corpo', 0, 0.235, 0.15, 1.0, 0] },
  coniglio:   { testa: ['testa', 0, 0.115, 0.085, 0.62, -0.35], muso: ['testa', 0, 0.055, 0.155, 0.8, 0], collo: ['corpo', 0, 0.07, 0.15, 0.7, 0.4], schiena: ['corpo', 0, 0.14, -0.03, 0.85, 0] },
  pappagallo: { testa: ['testa', 0, 0.09, 0.0, 0.48, 0], muso: ['testa', 0, 0.035, 0.075, 0.9, 0], collo: ['corpo', 0, 0.12, 0.01, 0.55, 0] },
}
/** La forma di un corpo per `AGGANCI`: il beagle ha gli stessi perni di Watson ma un'altra testa. */
export const formaDi = g => (g.userData.tipo === 'cane' && g.userData.id === 'beagle' ? 'beagle' : g.userData.tipo)

/** Veste un corpo in scena: toglie quello che portava e mette `addosso` ({ aggancio: id }). Non rifà niente se non è cambiato. */
export function vestiBestia (g, addosso = {}) {
  const firma = Object.entries(addosso).sort().join()
  if (g.userData.firmaAddobbi === firma) return
  for (const o of g.userData.addobbi || []) if (o.parent) o.parent.remove(o)
  g.userData.addobbi = []
  g.userData.firmaAddobbi = firma
  const tab = AGGANCI[formaDi(g)]
  if (!tab) return
  for (const [dove, id] of Object.entries(addosso)) {
    const a = tab[dove], perno = a && g.userData[a[0]], o = perno && creaAddobbo(id)      // `id` è la chiave `<id>:<colore>`
    if (!o) continue
    o.position.set(a[1], a[2], a[3]); o.scale.setScalar(a[4]); o.rotation.x = a[5] || 0
    perno.add(o); g.userData.addobbi.push(o)
  }
}

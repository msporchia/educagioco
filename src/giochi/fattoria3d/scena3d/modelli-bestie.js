// I corpi delle bestie di casa che non sono Watson né i gatti: il beagle, il coniglio, il pappagallo (il gatto rosso è un mantello di
// `creaGatto`). Stesso linguaggio degli animali del cortile (`modelli-cortile.js`): ellissoidi e ossi facettati a pochi lati, `mat()` con
// flatShading, colori piatti a tinta unita (le macchie sono pezzi di un altro colore che sporgono appena, mai sfumature), pezzi che si
// toccano (docs/fattoria3d/animali.md, «Le parti si toccano»). Il beagle ha gli stessi perni di Watson, quindi `posaCane` lo muove senza
// saperlo; il coniglio e il pappagallo hanno la loro posa (`posaPiccolo`). Davanti verso +z, piedi a terra, origine al centro dell'impronta.
// Vedi docs/fattoria3d/bestie-di-casa.md.
import * as THREE from 'three'
import { mat, parte } from './modelli.js'
import { posaCane, G, perno, zonaTocco, creaCompagno } from './modelli-compagni.js'
import { geoOsso, ellisse, osso } from './bestie-corpo.js'
import { fondiPerMateriale } from './fondi.js'

const lisc = x => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k) }
const BIANCO = 0xf6f3ee, FUMO = 0xb9b2a6, NOCCIOLA = 0xc98a45, CASTANO = 0x7a4a26, NERO = 0x2a241f, ROSA = 0xf0a0ac

/** Un ellissoide facettato nel perno `p`: colore `hex`, centro `c`, raggi `r`, `lati` per giro. */
const blocco = (p, hex, c, r, lati = 7) => ellisse(p, mat(hex), ...c, ...r, lati)
/** Un tronco di cono a lati: base sul punto `a` (raggio `rb`), cima sul punto `b` (raggio `rc`). */
const stelo = (p, hex, rb, rc, a, b, lati = 6) => osso(p, geoOsso(rb, rc, lati), mat(hex), ...a, ...b)
/** Una piccola palla facettata che si può scalare (occhi, naso, lingua): il raggio sta nella geometria, la scala parte da 1. */
const pallina = (p, hex, r, x, y, z, sx = 1, sy = 1, sz = 1) => {
  const o = parte(p, G(`pallina${r}`, () => new THREE.SphereGeometry(r, 6, 4)), mat(hex, { roughness: 0.3 }), x, y, z); o.scale.set(sx, sy, sz); return o
}
/** Fonde i pezzi fermi di ogni perno (i figli con `userData`, cioè gli altri perni, restano fuori da soli); `escludi`: ciò che si scala o si muove. */
const fondi = (perni, escludi = []) => { for (const p of perni) fondiPerMateriale(p, { escludi, soglia: 0 }) }

// ══════════ il beagle ══════════
// Un cane tricolore: sella nera sul dorso, fianchi e testa focati, petto, pancia, zampe e punta della coda bianche, orecchie castane
// lunghe e penzolanti, la coda dritta in su (si muove con il sedere). Stessi perni di Watson, in scala 0,72 (il beagle è un cane piccolo).
const O_CORPO = [0, 0.38, -0.2], O_TESTA = [0, 0.62, 0.3]
const dalCorpo = (x, y, z) => [x - O_CORPO[0], y - O_CORPO[1], z - O_CORPO[2]]
const dallaTesta = (x, y, z) => [x - O_TESTA[0], y - O_TESTA[1], z - O_TESTA[2]]
export function creaBeagle () {
  const g = new THREE.Group()
  const corpo = perno(g, ...O_CORPO)
  blocco(corpo, NOCCIOLA, dalCorpo(0, 0.47, -0.02), [0.155, 0.16, 0.3], 8)                       // il tronco
  blocco(corpo, NERO, dalCorpo(0, 0.525, -0.09), [0.145, 0.13, 0.22], 7)                             // la sella nera sul dorso
  blocco(corpo, BIANCO, dalCorpo(0, 0.46, 0.2), [0.15, 0.17, 0.13], 7)                             // il petto
  blocco(corpo, BIANCO, dalCorpo(0, 0.4, 0.02), [0.12, 0.09, 0.22], 7)                             // la pancia
  stelo(corpo, NOCCIOLA, 0.11, 0.085, dalCorpo(0, 0.56, 0.2), dalCorpo(0, 0.7, 0.36), 7)           // il collo
  const posteriore = perno(corpo, 0, 0, 0)
  blocco(posteriore, NOCCIOLA, dalCorpo(0, 0.49, -0.27), [0.165, 0.17, 0.16], 8)
  stelo(posteriore, NOCCIOLA, 0.045, 0.03, dalCorpo(0, 0.6, -0.36), dalCorpo(0, 0.8, -0.41), 5)    // la coda: dritta in su e un po' all'indietro…
  stelo(posteriore, BIANCO, 0.032, 0.018, dalCorpo(0, 0.8, -0.41), dalCorpo(0, 0.94, -0.44), 5)    // …col puntale bianco
  const testa = perno(corpo, ...dalCorpo(...O_TESTA))
  blocco(testa, NOCCIOLA, dallaTesta(0, 0.75, 0.45), [0.15, 0.14, 0.16], 8)                          // il cranio
  blocco(testa, NOCCIOLA, dallaTesta(0, 0.65, 0.36), [0.1, 0.1, 0.1], 7)                             // la nuca: resta attaccata al collo anche a testa bassa
  blocco(testa, NOCCIOLA, dallaTesta(0, 0.69, 0.6), [0.095, 0.085, 0.15], 7)                         // il muso
  blocco(testa, BIANCO, dallaTesta(0, 0.745, 0.62), [0.03, 0.06, 0.13], 5)                           // la striscia bianca sul muso
  blocco(testa, BIANCO, dallaTesta(0, 0.655, 0.64), [0.07, 0.035, 0.1], 6)                           // il mento
  pallina(testa, 0x16161a, 0.04, ...dallaTesta(0, 0.72, 0.745), 1.2, 0.85, 0.9)                      // il naso
  const occhi = [-1, 1].map(s => pallina(testa, 0x2a160a, 0.034, ...dallaTesta(s * 0.075, 0.795, 0.585)))
  const frangia = perno(testa, 0, 0.3, 0.05)                                                         // senza pelo lungo: resta un perno fermo
  const lingua = perno(testa, ...dallaTesta(0, 0.655, 0.7))
  const l = pallina(lingua, 0xe8768e, 0.04, 0, -0.012, 0.02, 1.05, 0.3, 1.3); l.rotation.x = 0.45
  const orecchie = [-1, 1].map(s => {
    const p = perno(testa, s * 0.11, 0.25, 0.06)
    blocco(p, CASTANO, [s * 0.04, -0.1, 0], [0.028, 0.14, 0.08], 6)                                 // lunga, piatta, penzolante
    p.userData.giro = s * 0.12; return p
  })
  const zampe = [[-0.1, 0.32, 0.2], [0.1, 0.32, 0.2], [-0.11, 0.34, -0.29], [0.11, 0.34, -0.29]].map(([x, y, z], i) => {
    const p = perno(g, x, y, z), dietro = i > 1
    stelo(p, BIANCO, 0.036, 0.05, [0, -0.29, 0], [0, 0.04, 0], 6)                                    // la gamba parte DENTRO il corpo: non galleggia
    blocco(p, BIANCO, [0, -0.29, 0.025], [0.05, 0.03, 0.07], 6)                                      // il piede
    if (dietro) blocco(p, NOCCIOLA, [0, 0.05, 0], [0.085, 0.12, 0.125], 7)                          // la coscia fulva
    else blocco(p, BIANCO, [0, 0.05, 0], [0.075, 0.09, 0.09], 7)                                     // la spalla
    return p
  })
  const bastone = new THREE.Mesh(G('beagle-bastone', () => new THREE.CylinderGeometry(0.014, 0.018, 0.4, 5)), mat(0x8a5a2b))
  bastone.position.set(...dallaTesta(0, 0.65, 0.62)); bastone.rotation.z = Math.PI / 2; bastone.visible = false; bastone.castShadow = false; testa.add(bastone)
  bastone.userData.base = { p: bastone.position.clone(), r: bastone.rotation.clone() }
  for (const p of [corpo, posteriore, testa, frangia, lingua, ...orecchie, ...zampe]) p.userData.base = p.position.clone()
  orecchie.forEach(o => { o.rotation.z = o.userData.giro })
  fondi([corpo, posteriore, testa, ...orecchie, ...zampe], [...occhi, lingua, bastone])
  zonaTocco(g, 0.5, 0.42)
  g.userData = { ...g.userData, corpo, posteriore, testa, frangia, orecchie, lingua, naso: null, occhi, zampe, bastone, tipo: 'cane' }
  return g
}

// ══════════ il coniglio ══════════
// Bianco con una macchia grigia sul dorso e sulle punte delle orecchie (dentro rosa), la codina a pallino, le zampe di dietro grandi e
// lunghe, gli occhi neri ai lati della testa, il nasino rosa che si muove. Seduto sulle zampe di dietro; salta (binky) quando è contento.
export function creaConiglio () {
  const g = new THREE.Group()
  const corpo = perno(g, 0, 0.16, -0.02)
  blocco(corpo, BIANCO, [0, 0, 0], [0.12, 0.12, 0.19], 8)
  blocco(corpo, FUMO, [0, 0.055, -0.03], [0.1, 0.09, 0.15], 7)                                   // la macchia grigia sul dorso
  blocco(corpo, BIANCO, [0, 0.02, -0.12], [0.13, 0.12, 0.13], 7)                                 // il posteriore tondo
  const coda = parte(corpo, G('coniglio-coda', () => new THREE.SphereGeometry(0.05, 6, 4)), mat(BIANCO), 0, 0.02, -0.25)
  const testa = perno(corpo, 0, 0.05, 0.17)
  blocco(testa, BIANCO, [0, 0.03, 0.05], [0.095, 0.09, 0.1], 7)
  blocco(testa, BIANCO, [0, -0.015, 0.12], [0.065, 0.055, 0.06], 6)                              // il musetto
  const naso = pallina(testa, ROSA, 0.016, 0, 0.01, 0.175, 1.1, 0.8, 0.8)
  const occhi = [-1, 1].map(s => pallina(testa, 0x17110d, 0.02, s * 0.072, 0.05, 0.1))
  const orecchie = [-1, 1].map(s => {
    const p = perno(testa, s * 0.04, 0.1, 0.02)
    blocco(p, BIANCO, [0, 0.12, 0], [0.036, 0.14, 0.015], 6)
    blocco(p, ROSA, [0, 0.115, 0.009], [0.02, 0.115, 0.01], 5)                                   // l'interno rosa
    blocco(p, FUMO, [0, 0.24, 0], [0.03, 0.05, 0.013], 5)                                        // la punta grigia
    p.userData.giro = s * 0.18; return p
  })
  const zampe = [[-0.06, -0.1, 0.1], [0.06, -0.1, 0.1], [-0.09, -0.08, -0.14], [0.09, -0.08, -0.14]].map(([x, y, z], i) => {
    const p = perno(corpo, x, y, z), dietro = i > 1
    if (dietro) { blocco(p, BIANCO, [0, 0.01, 0], [0.065, 0.095, 0.115], 7); blocco(p, BIANCO, [0, -0.055, 0.05], [0.04, 0.025, 0.105], 6) }      // coscia grossa e piede lungo
    else { stelo(p, BIANCO, 0.02, 0.026, [0, -0.07, 0], [0, 0.03, 0], 6); blocco(p, BIANCO, [0, -0.06, 0.018], [0.028, 0.02, 0.04], 6) }
    return p
  })
  for (const p of [corpo, testa, ...orecchie, ...zampe]) p.userData.base = p.position.clone()
  fondi([corpo, testa, ...orecchie, ...zampe], [naso, ...occhi, coda])
  zonaTocco(g, 0.28, 0.2)
  g.userData = { ...g.userData, corpo, testa, orecchie, zampe, naso, occhi, coda, tipo: 'coniglio' }
  return g
}

// ══════════ il pappagallo ══════════
// Verde, la fronte rossa, le guance gialle, il becco ricurvo avorio col gancio, le ali con la punta blu, la coda lunga rossa e blu,
// due zampe arancioni. Sta in piedi, scuote la testa, saltella; quando è contento batte le ali.
const VERDE = 0x4fae3e, VERDE_SC = 0x2f7f2f, VERDE_CH = 0x9fd35e, ROSSO = 0xd8322b, GIALLO = 0xf2c230, BLU = 0x2f6fd0, ARANCIO = 0xe9902a, CORNO = 0xf3e7c4
export function creaPappagallo () {
  const g = new THREE.Group()
  const corpo = perno(g, 0, 0.2, 0)
  blocco(corpo, VERDE, [0, 0, 0], [0.085, 0.14, 0.085], 8)
  blocco(corpo, VERDE_CH, [0, -0.03, 0.03], [0.07, 0.1, 0.07], 7)                                // il petto chiaro
  const testa = perno(corpo, 0, 0.15, 0.015)
  blocco(testa, VERDE, [0, 0.02, 0], [0.07, 0.07, 0.07], 8)
  blocco(testa, ROSSO, [0, 0.058, 0.04], [0.045, 0.024, 0.036], 6)                                 // la fronte rossa
  for (const s of [-1, 1]) blocco(testa, GIALLO, [s * 0.05, 0.0, 0.035], [0.025, 0.03, 0.03], 5)   // le guance gialle
  blocco(testa, CORNO, [0, 0.0, 0.08], [0.028, 0.03, 0.04], 6)                              // il becco: la base
  stelo(testa, CORNO, 0.024, 0.006, [0, 0.01, 0.1], [0, -0.055, 0.095], 5)                       // …e il gancio che scende e si piega
  blocco(testa, ARANCIO, [0, -0.03, 0.078], [0.016, 0.01, 0.026], 5)                             // il becco di sotto
  const occhi = [-1, 1].map(s => { const o = pallina(testa, 0xffffff, 0.022, s * 0.058, 0.03, 0.035); pallina(testa, 0x17110d, 0.012, s * 0.066, 0.03, 0.045); return o })
  const ali = [-1, 1].map(s => {
    const p = perno(corpo, s * 0.06, 0.07, -0.01)
    blocco(p, VERDE_SC, [s * 0.025, -0.1, -0.01], [0.026, 0.12, 0.055], 6)
    blocco(p, BLU, [s * 0.027, -0.19, -0.01], [0.018, 0.045, 0.04], 5)                         // la punta blu
    p.userData.base = p.position.clone(); return p
  })
  const coda = perno(corpo, 0, -0.1, -0.06)
  stelo(coda, ROSSO, 0.036, 0.022, [0, 0.02, 0], [0, -0.1, -0.17], 4)                            // la coda lunga: rossa…
  stelo(coda, BLU, 0.022, 0.012, [0, -0.1, -0.17], [0, -0.135, -0.235], 4)                         // …e blu in punta
  const zampe = [-1, 1].map(s => {
    const p = perno(g, s * 0.035, 0.07, 0.0)
    stelo(p, ARANCIO, 0.013, 0.016, [0, -0.07, 0], [0, 0.075, 0], 5); blocco(p, ARANCIO, [0, -0.065, 0.02], [0.028, 0.012, 0.04], 5)
    p.userData.base = p.position.clone(); return p
  })
  for (const p of [corpo, testa, coda]) p.userData.base = p.position.clone()
  fondi([corpo, testa, coda, ...ali, ...zampe], occhi)
  zonaTocco(g, 0.25, 0.22)
  g.userData = { ...g.userData, corpo, testa, ali, coda, zampe, occhi, tipo: 'pappagallo' }
  return g
}

// ══════════ la posa del beagle: quella di Watson (stessi perni), con le zampe che sdraiato restano attaccate alle spalle ══════════
export function posaBeagle (g, opz = {}) {
  posaCane(g, opz)
  if (opz.stato === 'dorme') { const [fl, fr] = g.userData.zampe; for (const z of [fl, fr]) { z.position.y = 0.1; z.position.z -= 0.07 }
    for (const o of g.userData.orecchie) { o.position.y -= 0.07; o.rotation.z *= 0.3 } }
}

// ══════════ le pose dei piccoli (funzioni senza memoria, come `posaCane`) ══════════
// `stato`: sta siede annusa dorme festa vaga segue fugge; `vel` 0..1 quanto va; `fase` il passo; `t` il tempo; `p` a che punto è lo stato.
export function posaPiccolo (g, { stato = 'sta', vel = 0, fase = 0, t = 0, p = 0 } = {}) {
  const u = g.userData
  if (u.tipo === 'coniglio') return posaConiglio(u, stato, vel, fase, t, p)
  if (u.tipo === 'pappagallo') return posaPappagallo(u, stato, vel, fase, t, p)
}
function ripristina (lista) { for (const n of lista) { n.position.copy(n.userData.base); n.rotation.set(0, 0, 0); n.scale.set(1, 1, 1) } }

function posaConiglio (u, stato, vel, fase, t, p) {
  const [fl, fr, bl, br] = u.zampe
  ripristina([u.corpo, u.testa, ...u.orecchie, ...u.zampe])
  u.orecchie.forEach(o => { o.rotation.z = o.userData.giro }); u.occhi.forEach(o => o.scale.set(1, 1, 1)); u.naso.scale.set(1.1, 0.8, 0.8)
  const resp = Math.sin(t * 2.4), naso = Math.sin(t * 14)
  u.naso.scale.y = 0.8 + naso * 0.12
  const orecchie = (k, avanti = 0) => u.orecchie.forEach((o, i) => { o.rotation.z += (i ? 1 : -1) * k; o.rotation.x = -avanti })
  if (vel > 0.05) {                                                  // saltella: le zampe di dietro spingono, il corpo fa un arco
    const s = Math.sin(fase), arco = Math.abs(s)
    u.corpo.position.y += arco * 0.1; u.corpo.rotation.x = -s * 0.25 + 0.05
    fl.rotation.x = fr.rotation.x = -arco * 0.6; bl.rotation.x = br.rotation.x = arco * 0.7
    u.testa.rotation.x = s * 0.12; orecchie(0.05, 0.15 + arco * 0.2)
    return
  }
  if (stato === 'siede') {                                           // sulle zampe di dietro, il petto in su, le zampine al petto
    u.corpo.rotation.x = -0.55; u.corpo.position.y += 0.03; u.testa.rotation.x = 0.5
    fl.rotation.x = fr.rotation.x = 0.7; bl.position.z += 0.03; br.position.z += 0.03
    u.corpo.scale.y = 1 + resp * 0.02; u.testa.rotation.y = Math.sin(t * 0.8) * 0.3
  } else if (stato === 'annusa') {                                   // il muso giù, il nasino che corre
    u.testa.rotation.x = 0.7 + Math.sin(t * 7) * 0.05; u.testa.position.y -= 0.03; u.corpo.rotation.x = 0.1; orecchie(0.2, 0.1)
    u.naso.scale.y = 0.8 + Math.abs(Math.sin(t * 18)) * 0.3
  } else if (stato === 'dorme') {                                    // un panetto: schiacciato, la testa sulle zampe, le orecchie giù
    u.corpo.scale.set(1.08, 0.78 * (1 + resp * 0.03), 1); u.corpo.position.y -= 0.025
    u.testa.position.y -= 0.045; u.testa.rotation.x = 0.55; orecchie(-0.9, -0.9)
    u.occhi.forEach(o => o.scale.y = 0.1)
  } else if (stato === 'festa') {                                    // il salto della gioia (binky): in aria si torce, le orecchie al vento
    const h = Math.abs(Math.sin(t * 6.5)), tw = Math.sin(t * 6.5)
    u.corpo.position.y += h * 0.16; u.corpo.rotation.z = tw * 0.4; u.corpo.rotation.x = -0.2 * h
    bl.rotation.x = br.rotation.x = 0.8 * h; fl.rotation.x = fr.rotation.x = -0.6 * h; orecchie(0.1 + 0.3 * h, 0.2 * h)
  } else {                                                           // in piedi: respira, le orecchie che girano, il nasino
    u.corpo.scale.y = 1 + resp * 0.015; u.testa.rotation.y = Math.sin(t * 0.7) * 0.35
    u.orecchie[0].rotation.x = -Math.max(0, Math.sin(t * 0.9)) * 0.25; u.orecchie[1].rotation.x = -Math.max(0, Math.sin(t * 0.9 + 2)) * 0.25
  }
}

function posaPappagallo (u, stato, vel, fase, t, p) {
  const [al, ar] = u.ali
  ripristina([u.corpo, u.testa, u.coda, ...u.ali, ...u.zampe])
  u.occhi.forEach(o => o.scale.set(1, 1, 1))
  const resp = Math.sin(t * 2.6)
  u.ali.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * 0.08 })
  if (vel > 0.05) {                                                  // saltella con le due zampe, la coda che dondola
    const s = Math.sin(fase), arco = Math.abs(s)
    u.corpo.position.y += arco * 0.045; u.corpo.rotation.z = s * 0.1; u.testa.rotation.x = 0.1 * Math.sin(fase * 2)
    u.coda.rotation.x = -0.2 * arco; u.zampe.forEach((z, i) => { z.rotation.x = (i ? 1 : -1) * s * 0.5 })
    return
  }
  if (stato === 'annusa') {                                          // becchetta a terra
    const b = Math.max(0, Math.sin(t * 5))
    u.corpo.rotation.x = 0.35 + b * 0.15; u.testa.rotation.x = 0.7 + b * 0.35; u.testa.position.y -= 0.02; u.coda.rotation.x = -0.3
  } else if (stato === 'dorme') {                                    // la testa girata e infilata fra le piume
    u.testa.rotation.y = 2.2; u.testa.rotation.x = 0.3; u.testa.position.y -= 0.03; u.corpo.scale.set(1.05, 0.93 * (1 + resp * 0.02), 1.05)
    u.occhi.forEach(o => o.scale.y = 0.08)
  } else if (stato === 'festa') {                                    // batte le ali e saltella
    const b = Math.sin(t * 22), h = Math.abs(Math.sin(t * 5))
    u.corpo.position.y += h * 0.06; al.rotation.z = -(0.5 + b * 0.7); ar.rotation.z = 0.5 + b * 0.7; u.testa.rotation.x = -0.2; u.coda.rotation.x = 0.2 * b
  } else if (stato === 'siede') {                                    // gonfio, la testa che si volta piano
    u.corpo.scale.set(1.06, 1 + resp * 0.03, 1.06); u.testa.rotation.y = Math.sin(t * 0.6) * 0.8
  } else {                                                           // sta: guarda a scatti a destra e a sinistra
    const scatto = Math.floor(t * 0.7); u.testa.rotation.y = Math.sin(scatto * 12.9898) * 0.9 * lisc((t * 0.7 - scatto) * 4)
    u.corpo.scale.y = 1 + resp * 0.012
  }
}

// ══════════ dall'id al corpo ══════════
/** Il corpo di una bestia dai suoi dati (come `creaCompagno`, che lo fa per Watson e i gatti). `tipo` e `variante` vengono da `dati/bestie.js`. */
export function creaBestia (c) {
  let g
  if (c.tipo === 'cane' && c.variante === 'beagle') { g = creaBeagle(); g.scale.setScalar(SCALA.beagle) }
  else if (c.tipo === 'coniglio') { g = creaConiglio(); g.scale.setScalar(SCALA.coniglio) }
  else if (c.tipo === 'pappagallo') { g = creaPappagallo(); g.scale.setScalar(SCALA.pappagallo) }
  else g = creaCompagno(c)
  g.userData.id = c.id
  return g
}
const SCALA = { beagle: 0.72, coniglio: 1.2, pappagallo: 1.4 }

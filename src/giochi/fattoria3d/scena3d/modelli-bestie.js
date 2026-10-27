// I corpi delle bestie di casa che non sono Watson né i gatti: il beagle, il coniglio, il pappagallo (il gatto rosso è un mantello di
// `creaGatto`). Stesso stile dei gatti (palle lisce fuse in un mesh per pezzo, il colore nei vertici), stessi mattoncini
// (`modelli-compagni.js`). Il beagle ha gli stessi perni di Watson, quindi `posaCane` lo muove senza saperlo; il coniglio e il pappagallo
// hanno la loro posa (`posaPiccolo`). Davanti verso +z, piedi a terra, origine al centro dell'impronta.
// Vedi docs/fattoria3d/bestie-di-casa.md.
import * as THREE from 'three'
import { mat } from './modelli.js'
import { posaCane, G, perno, zonaTocco, tingi, palla, tubo, morbido, liscio, mescola, sfera, cono, creaCompagno } from './modelli-compagni.js'

const lisc = x => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k) }
const sc = (c, p) => new THREE.Color(c).multiplyScalar(p).getHex()
const BIANCO = 0xf6f3ee, FUMO = 0xc9c2b6, NOCCIOLA = 0xc98a45, CASTANO = 0x7a4a26, NERO = 0x2a241f, ROSA = 0xf0a0ac
const fisso = hex => (p, k) => k.setHex(hex)
const occhio = mat(0x17110d, { roughness: 0.2 }), lucido = mat(0xffffff, { roughness: 0.3 })

/** Un cilindro inclinato (per le code), colorato nei vertici, già al suo posto. `inclina`: giro attorno a X (radianti). */
function tuboInclinato (parti, rs, ri, h, c, colore, inclina = 0, seg = 8) {
  const g = new THREE.CylinderGeometry(rs, ri, h, seg, 1); g.deleteAttribute('uv'); g.rotateX(inclina); g.translate(...c); tingi(g, colore); parti.push(g)
}

// ══════════ il beagle ══════════
// Un cane tricolore: sella nera sul dorso, fianchi e testa focati, petto, pancia, zampe e punta della coda bianche, orecchie castane
// lunghe e penzolanti, la coda dritta in su (si muove con il sedere). Stessi perni di Watson, in scala 0,72 (il beagle è un cane piccolo).
const O_CORPO = [0, 0.38, -0.2], O_TESTA = [0, 0.62, 0.3]
const dalCorpo = (x, y, z) => [x - O_CORPO[0], y - O_CORPO[1], z - O_CORPO[2]]
const dallaTesta = (x, y, z) => [x - O_TESTA[0], y - O_TESTA[1], z - O_TESTA[2]]
/** Il mantello del tronco, dalla posizione nel gruppo (non nel perno): sella nera, fianchi focati, sotto bianco. */
const mantelloBeagle = (p, k) => {
  const y = p.y + O_CORPO[1], z = p.z + O_CORPO[2], ax = Math.abs(p.x)
  k.setHex(NOCCIOLA)
  mescola(k, NERO, lisc((y - 0.5) / 0.07) * (1 - lisc((ax - 0.07) / 0.06)) * lisc((z + 0.34) / 0.14) * (1 - lisc((z - 0.2) / 0.1)))      // la sella
  mescola(k, BIANCO, Math.max(1 - lisc((y - 0.36) / 0.1), lisc((z - 0.16) / 0.07) * (1 - lisc((y - 0.62) / 0.1))))                           // pancia e petto
  return k
}
const testaBeagle = (p, k) => {
  const z = p.z + O_TESTA[2], y = p.y + O_TESTA[1], ax = Math.abs(p.x)
  k.setHex(NOCCIOLA)
  mescola(k, BIANCO, (1 - lisc((ax - 0.025) / 0.03)) * lisc((z - 0.42) / 0.08) * (1 - lisc((y - 0.74) / 0.08)) * 0.9)                         // la striscia bianca sul muso
  mescola(k, BIANCO, lisc((0.66 - y) / 0.05) * lisc((z - 0.45) / 0.1))                                                                          // il mento
  return k
}
export function creaBeagle () {
  const g = new THREE.Group()
  const corpo = perno(g, ...O_CORPO)
  morbido(corpo, 'beagle:corpo', 0.85, parti => {
    palla(parti, dalCorpo(0, 0.47, -0.02), [0.155, 0.16, 0.3], mantelloBeagle, 22, 14)
    palla(parti, dalCorpo(0, 0.47, 0.2), [0.15, 0.17, 0.14], mantelloBeagle, 14, 10)
    palla(parti, dalCorpo(0, 0.6, 0.3), [0.1, 0.13, 0.1], mantelloBeagle, 12, 8)                          // il collo
  })
  const posteriore = perno(corpo, 0, 0, 0)
  morbido(posteriore, 'beagle:sedere', 0.85, parti => {
    palla(parti, dalCorpo(0, 0.49, -0.27), [0.165, 0.17, 0.16], mantelloBeagle, 14, 10)
    // la coda: dritta in su e un po' all'indietro, con la punta bianca
    tuboInclinato(parti, 0.02, 0.045, 0.26, dalCorpo(0, 0.66, -0.38), (p, k) => mescola(k.setHex(NOCCIOLA), BIANCO, lisc((p.y + O_CORPO[1] - 0.74) / 0.04)), -0.4, 8)
  })
  const testa = perno(corpo, ...dalCorpo(...O_TESTA))
  morbido(testa, 'beagle:testa', 0.85, parti => {
    palla(parti, dallaTesta(0, 0.75, 0.45), [0.15, 0.14, 0.16], testaBeagle, 18, 12)                         // il cranio
    palla(parti, dallaTesta(0, 0.69, 0.6), [0.095, 0.085, 0.15], testaBeagle, 14, 10)                       // il muso
  })
  sfera(testa, 0.04, mat(0x16161a, { roughness: 0.25 }), ...dallaTesta(0, 0.725, 0.745), 1.2, 0.85, 0.9)      // il naso
  sfera(testa, 0.05, mat(0x3b1d24), ...dallaTesta(0, 0.665, 0.69), 1.45, 0.5, 0.9)                           // la bocca aperta
  const occhi = [-1, 1].map(s => {
    const o = sfera(testa, 0.034, mat(0x2a160a, { roughness: 0.15 }), ...dallaTesta(s * 0.075, 0.795, 0.585))
    sfera(testa, 0.01, lucido, ...dallaTesta(s * 0.075 + 0.01, 0.805, 0.614)); return o
  })
  const frangia = perno(testa, 0, 0.3, 0.05)                                                               // senza pelo lungo: resta un perno fermo
  const lingua = perno(testa, ...dallaTesta(0, 0.665, 0.74))
  const l = sfera(lingua, 0.04, mat(0xe8768e), 0, -0.012, 0.02, 1.05, 0.3, 1.3); l.rotation.x = 0.45
  const orecchie = [-1, 1].map(s => {
    const p = perno(testa, s * 0.14, 0.27, 0.06)
    morbido(p, 'beagle:orecchio' + s, 0.85, parti => palla(parti, [s * 0.025, -0.1, 0], [0.025, 0.115, 0.075], (q, k) => k.setHex(sc(CASTANO, 1 - 0.25 * lisc((-q.y) / 0.2))), 10, 8))
    p.userData.giro = s * 0.12; return p
  })
  const zampe = [[-0.1, 0.32, 0.2], [0.1, 0.32, 0.2], [-0.11, 0.34, -0.29], [0.11, 0.34, -0.29]].map(([x, y, z], i) => {
    const p = perno(g, x, y, z), dietro = i > 1
    morbido(p, 'beagle:zampa' + i, 0.85, parti => {
      const colore = (q, k) => dietro ? mescola(k.setHex(NOCCIOLA), BIANCO, lisc((-0.16 - q.y) / 0.06)) : k.setHex(BIANCO)
      tubo(parti, 0.05, 0.038, 0.36, [0, -0.13, 0], colore, 8)                                           // la gamba parte DENTRO il corpo: non galleggia
      palla(parti, [0, -0.3, 0.02], [0.05, 0.032, 0.065], fisso(BIANCO), 8, 6)
      palla(parti, [0, 0.05, 0], dietro ? [0.085, 0.12, 0.125] : [0.075, 0.09, 0.09], dietro ? (q, k) => k.setHex(NOCCIOLA) : fisso(BIANCO), 10, 8)   // spalla o coscia
    })
    return p
  })
  const bastone = new THREE.Mesh(G('beagle-bastone', () => new THREE.CylinderGeometry(0.014, 0.018, 0.4, 5)), mat(0x8a5a2b))
  bastone.position.set(...dallaTesta(0, 0.65, 0.62)); bastone.rotation.z = Math.PI / 2; bastone.visible = false; bastone.castShadow = false; testa.add(bastone)
  bastone.userData.base = { p: bastone.position.clone(), r: bastone.rotation.clone() }
  for (const p of [corpo, posteriore, testa, frangia, lingua, ...orecchie, ...zampe]) p.userData.base = p.position.clone()
  orecchie.forEach(o => { o.rotation.z = o.userData.giro })
  zonaTocco(g, 0.5, 0.42)
  g.userData = { ...g.userData, corpo, posteriore, testa, frangia, orecchie, lingua, naso: null, occhi, zampe, bastone, tipo: 'cane' }
  return g
}

// ══════════ il coniglio ══════════
// Bianco con una macchia grigia sul dorso e sulle orecchie, le orecchie lunghe (dentro rosa), la codina a pallino, gli occhi neri
// lucidi ai lati della testa, il nasino rosa che si muove. Seduto sulle zampe di dietro; salta (binky) quando è contento.
const coloriConiglio = {
  corpo: (p, k) => { k.setHex(BIANCO); return mescola(k, FUMO, lisc((p.y - 0.06) / 0.06) * (1 - lisc((Math.abs(p.x) - 0.04) / 0.05)) * lisc((p.z + 0.13) / 0.1) * (1 - lisc((p.z - 0.05) / 0.1)) * 0.9) },
  testa: (p, k) => k.setHex(BIANCO),
}
export function creaConiglio () {
  const g = new THREE.Group()
  const corpo = perno(g, 0, 0.16, -0.02)
  morbido(corpo, 'coniglio:corpo', 0.9, parti => {
    palla(parti, [0, 0, 0], [0.12, 0.12, 0.19], coloriConiglio.corpo, 16, 10)
    palla(parti, [0, 0.02, -0.12], [0.13, 0.12, 0.13], coloriConiglio.corpo, 12, 8)                      // il posteriore tondo
  })
  const coda = sfera(corpo, 0.045, mat(BIANCO), 0, 0.01, -0.25)
  const testa = perno(corpo, 0, 0.05, 0.17)
  morbido(testa, 'coniglio:testa', 0.9, parti => {
    palla(parti, [0, 0.03, 0.05], [0.095, 0.09, 0.1], coloriConiglio.testa, 14, 10)
    palla(parti, [0, -0.015, 0.12], [0.065, 0.055, 0.06], coloriConiglio.testa, 10, 8)                   // il musetto
  })
  const naso = sfera(testa, 0.016, mat(ROSA), 0, 0.01, 0.175, 1.1, 0.8, 0.8)
  const occhi = [-1, 1].map(s => { const o = sfera(testa, 0.019, occhio, s * 0.072, 0.05, 0.1); sfera(testa, 0.006, lucido, s * 0.072 + 0.004, 0.058, 0.115); return o })
  const orecchie = [-1, 1].map(s => {
    const p = perno(testa, s * 0.04, 0.1, 0.02)
    morbido(p, 'coniglio:orecchio' + s, 0.9, parti => {
      palla(parti, [0, 0.12, 0], [0.034, 0.14, 0.014], (q, k) => mescola(k.setHex(BIANCO), FUMO, lisc((q.y - 0.18) / 0.06)), 8, 6)
      palla(parti, [0, 0.115, 0.008], [0.02, 0.115, 0.008], fisso(ROSA), 6, 4)             // l'interno rosa
    })
    p.userData.giro = s * 0.18; return p
  })
  const zampe = [[-0.06, -0.1, 0.1], [0.06, -0.1, 0.1], [-0.09, -0.08, -0.14], [0.09, -0.08, -0.14]].map(([x, y, z], i) => {
    const p = perno(corpo, x, y, z), dietro = i > 1
    morbido(p, 'coniglio:zampa' + i, 0.9, parti => {
      if (dietro) { palla(parti, [0, 0.0, 0], [0.05, 0.075, 0.1], fisso(BIANCO), 10, 8); palla(parti, [0, -0.05, 0.05], [0.036, 0.022, 0.095], fisso(BIANCO), 8, 6) }
      else { tubo(parti, 0.022, 0.02, 0.1, [0, -0.02, 0], fisso(BIANCO), 8); palla(parti, [0, -0.07, 0.015], [0.026, 0.018, 0.035], fisso(BIANCO), 8, 6) }
    })
    return p
  })
  for (const p of [corpo, testa, ...orecchie, ...zampe]) p.userData.base = p.position.clone()
  zonaTocco(g, 0.28, 0.2)
  g.userData = { ...g.userData, corpo, testa, orecchie, zampe, naso, occhi, coda, tipo: 'coniglio' }
  return g
}

// ══════════ il pappagallo ══════════
// Verde, la fronte rossa, le guance gialle, il becco ricurvo avorio e arancio, le ali con la punta blu, la coda lunga rossa e blu,
// due zampe arancioni. Sta in piedi, scuote la testa, saltella; quando è contento batte le ali.
const verde = 0x4fae3e, VERDE_SC = 0x2f7f2f, ROSSO = 0xd8322b, GIALLO = 0xf2c230, BLU = 0x2f6fd0
const coloriPappagallo = {
  corpo: (p, k) => { k.setHex(verde); return mescola(k, 0xa3d86a, lisc((0.08 - p.y) / 0.14) * 0.6 * lisc((p.z - 0.01) / 0.05)) },
  testa: (p, k) => { k.setHex(verde); mescola(k, ROSSO, lisc((p.y - 0.02) / 0.03) * lisc((p.z - 0.0) / 0.03)); return mescola(k, GIALLO, lisc((Math.abs(p.x) - 0.035) / 0.02) * (1 - lisc((p.y - 0.0) / 0.04)) * lisc((p.z + 0.01) / 0.03)) },
}
export function creaPappagallo () {
  const g = new THREE.Group()
  const corpo = perno(g, 0, 0.2, 0)
  morbido(corpo, 'pappagallo:corpo', 0.6, parti => palla(parti, [0, 0, 0], [0.085, 0.14, 0.085], coloriPappagallo.corpo, 16, 12))
  const testa = perno(corpo, 0, 0.15, 0.015)
  morbido(testa, 'pappagallo:testa', 0.6, parti => palla(parti, [0, 0.02, 0.0], [0.07, 0.07, 0.07], coloriPappagallo.testa, 14, 10))
  const BECCO = mat(0xf3e7c4, { roughness: 0.4 })
  const becco = cono(testa, 0.036, 0.07, BECCO, 0, 0.0, 0.07, 6); becco.rotation.x = Math.PI / 2 + 0.95; becco.castShadow = false         // il becco: un cono che si piega in giù
  cono(testa, 0.018, 0.04, mat(0xe9902a, { roughness: 0.4 }), 0, -0.04, 0.095, 5).rotation.x = Math.PI / 2 + 0.2
  const occhi = [-1, 1].map(s => { const o = sfera(testa, 0.02, mat(0xffffff), s * 0.058, 0.03, 0.035); sfera(testa, 0.012, occhio, s * 0.065, 0.03, 0.044); return o })
  const ali = [-1, 1].map(s => {
    const p = perno(corpo, s * 0.075, 0.07, -0.01)
    morbido(p, 'pappagallo:ala' + s, 0.6, parti => palla(parti, [s * 0.02, -0.09, -0.01], [0.026, 0.11, 0.06], (q, k) => mescola(k.setHex(VERDE_SC), BLU, lisc((-0.11 - q.y) / 0.05)), 10, 8))
    p.userData.base = p.position.clone(); return p
  })
  const coda = perno(corpo, 0, -0.1, -0.06)
  morbido(coda, 'pappagallo:coda', 0.6, parti => tuboInclinato(parti, 0.034, 0.012, 0.22, [0, -0.04, -0.09], (q, k) => mescola(k.setHex(ROSSO), BLU, lisc((-0.14 - q.z) / 0.04)), 1.0, 6))
  const zampe = [-1, 1].map(s => {
    const p = perno(g, s * 0.035, 0.07, 0.0)
    morbido(p, 'pappagallo:zampa' + s, 0.6, parti => { tubo(parti, 0.013, 0.012, 0.15, [0, 0.0, 0], fisso(0xe9902a), 6); palla(parti, [0, -0.07, 0.02], [0.028, 0.012, 0.04], fisso(0xe9902a), 6, 4) })
    p.userData.base = p.position.clone(); return p
  })
  for (const p of [corpo, testa, coda]) p.userData.base = p.position.clone()
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

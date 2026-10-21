// Generato da strumenti/promuovi-3d.mjs da poc/mostri-3d/landa-fiere.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Le fiere e i guardiani della foresta nera e della landa: il gufo gigante, l'avvoltoio, l'orso nero e l'ent (caporale della foresta).
// Contratto di mostri.js; attrezzi in landa-base.js.
import {
  THREE, M, mesh, sfera, rozza, scatola, cil, cono, perno, punta, onda, PI, NERO, lucido, lum, vivoMat, arto, occhio, lume, fasi, imp, apre, gesto,
  marker, dichiara, vivifica, lembo, doppio,
} from './landa-base.js'
import { creaOrso } from './bosco.js'

// ══════════════════════════════════════ IL GUFO GIGANTE E L'AVVOLTOIO ══════════════════════════════════════
const RAPACI = {
  gufo: { dorso: 0x6a5238, riflesso: 0x8e7452, petto: 0xd8c9a6, macchia: 0x4a3724, disco: 0xe6d9b8, becco: 0x3a3228, art: 0x2a221c, zampe: 0xb09870, occhio: 0xffb81c },
  avvoltoio: { dorso: 0x3a2e26, riflesso: 0x5a463a, petto: 0x2a211b, macchia: 0x1f1813, collare: 0xe2d9c3, pelle: 0xb89a8c, becco: 0xc9b896, art: 0x1c1613, zampe: 0x8f8579, occhio: 0xff6a2a },
}
/** Le due ali: remiganti a ventaglio come nel falco del bosco, più grandi. Chiuse stanno lungo il fianco, aperte si allargano. */
function aliPiume (tronco, { x, y, z, n = 9, L = 0.6, larg = 0.11, a, b }) {
  const ali = []
  for (const s of [-1, 1]) {
    const sp = perno(tronco, s * x, y, z); sp.scale.x = s
    rozza(sp, 0.12, b, 0.04, -0.02, -0.16, 0.55, 1.0, 2.6, 1)
    const piume = []
    for (let i = 0; i < n; i++) {
      const p = perno(sp, 0.03, 0.0, 0.0), q = perno(p, 0, 0, 0)
      const l = L - Math.abs(i - 1) * 0.02 - (i > n - 4 ? (i - (n - 4)) * L * 0.1 : 0)
      const fe = cono(q, larg * 0.62, l, i % 2 ? a : b, l / 2, 0, 0, 4); fe.rotation.z = -PI / 2; fe.scale.set(0.22, 1, 1)
      piume.push({ p, q, i })
    }
    ali.push({ sp, piume })
  }
  const apri = w => ali.forEach(({ sp, piume }) => {
    piume.forEach(({ p, q, i }) => {
      const chiuso = 1.52 + (i - 4) * 0.012, aperto = -0.15 + i * (0.145 * 9 / n)
      p.rotation.y = chiuso + (aperto - chiuso) * w
      q.rotation.x = (1 - w) * 1.45 + w * (i * 0.01)
      p.rotation.z = (1 - w) * -0.06 + w * 0.2
    })
    sp.rotation.z = w * 0.3
  })
  return { ali, apri }
}
/** Una zampa d'uccello: coscia piumata, tarso, tre dita avanti e una dietro con gli artigli. */
function zampaUccello (g, s, x, y, z, mTarso, mCoscia, mArt, scala = 1) {
  const an = perno(g, s * x, y, z)
  rozza(an, 0.09 * scala, mCoscia, 0, 0.02, 0, 0.9, 1.5, 1.2, 1)
  arto(an, [0, 0, 0], [0, -0.14 * scala, -0.05 * scala], 0.03 * scala, 0.022 * scala, mTarso, 5)
  const gi = perno(an, 0, -0.14 * scala, -0.05 * scala)
  arto(gi, [0, 0, 0], [0, -0.2 * scala, 0.06 * scala], 0.022 * scala, 0.018 * scala, mTarso, 5)
  const pd = perno(gi, 0, -0.2 * scala, 0.06 * scala)
  for (let k = -1; k <= 1; k++) { arto(pd, [0, 0, 0], [k * 0.035 * scala, 0, 0.13 * scala], 0.015 * scala, 0.01 * scala, mTarso, 4, false); cono(pd, 0.013 * scala, 0.07 * scala, mArt, k * 0.04 * scala, -0.01, 0.15 * scala, 4).rotation.x = PI / 2 + 0.4 }
  arto(pd, [0, 0, 0], [0, 0, -0.08 * scala], 0.015 * scala, 0.01 * scala, mTarso, 4, false); cono(pd, 0.013 * scala, 0.06 * scala, mArt, 0, -0.01, -0.1 * scala, 4).rotation.x = -PI / 2 - 0.4
  return { an, gi, pd }
}

const COLLO = [0.7, 0.35, -0.75]
export function creaRapace (specie = 'gufo') {
  const u = RAPACI[specie], gufo = specie === 'gufo'
  const g = new THREE.Group()
  const dorso = M(u.dorso), ric = M(u.riflesso, { roughness: 0.4 }), petto = M(u.petto), mac = M(u.macchia), becco = M(u.becco, { roughness: 0.35 }), zamp = M(u.zampe), art = M(u.art)
  const tilt = gufo ? -0.1 : -0.55
  const tronco = perno(g, 0, gufo ? 0.58 : 0.62, 0); tronco.rotation.x = tilt
  if (gufo) {
    rozza(tronco, 0.31, dorso, 0, 0, 0, 0.95, 1.35, 0.95, 2)
    rozza(tronco, 0.27, petto, 0, -0.04, 0.1, 0.9, 1.3, 0.75, 2)
    for (let r = 0; r < 4; r++) for (let k = -2; k <= 2; k++) cono(tronco, 0.045, 0.1, mac, k * 0.1 + (r % 2) * 0.05, 0.2 - r * 0.15, 0.27 - Math.abs(k) * 0.015 - r * 0.02, 4).rotation.x = PI + 0.3   // le barre del petto
  } else {
    rozza(tronco, 0.28, dorso, 0, 0, 0, 0.95, 1.1, 1.5, 2)
    rozza(tronco, 0.22, petto, 0, -0.04, 0.12, 0.9, 1.1, 1.0, 2)
    for (let k = 0; k < 9; k++) cono(tronco, 0.06, 0.2, k % 2 ? ric : dorso, ((k % 3) - 1) * 0.1, 0.15 - Math.floor(k / 3) * 0.1, -0.15 - Math.floor(k / 3) * 0.08, 4).rotation.x = -1.3   // piume arruffate sul dorso
  }
  if (!gufo) for (let r = 0; r < 3; r++) for (let k = -2; k <= 2; k++) sfera(tronco, 0.075, (r + k) % 2 ? ric : dorso, k * 0.115 * (1 - r * 0.12), 0.17 - r * 0.07, -0.02 - r * 0.2 + Math.abs(k) * -0.02, 1.1, 0.45, 1.4, 6)   // le copritrici sovrapposte sul dorso
  // la coda
  const coda = perno(tronco, 0, gufo ? -0.28 : -0.05, gufo ? -0.18 : -0.38); coda.rotation.x = gufo ? 0.9 : 0.5
  for (let k = -2; k <= 2; k++) { const f = perno(coda, 0, 0, 0); f.rotation.y = k * 0.1; scatola(f, 0.09, 0.014, gufo ? 0.42 : 0.38, k % 2 ? ric : dorso, 0, 0, -0.2) }
  // il collo e la testa
  const collo = perno(tronco, 0, gufo ? 0.32 : 0.12, gufo ? 0.08 : 0.3)
  const testa = perno(collo, 0, gufo ? 0.14 : 0.0, gufo ? 0.0 : 0.0)
  const colli = []
  let beccoM = null, mascella = null, occhi = []
  if (gufo) {
    rozza(testa, 0.27, dorso, 0, 0.04, 0, 1.2, 0.95, 1.0, 2)
    for (const s of [-1, 1]) {                                                    // il disco facciale e gli occhi enormi
      sfera(testa, 0.2, M(u.disco), s * 0.12, 0.0, 0.17, 1.0, 1.05, 0.35, 12)
      mesh(testa, new THREE.TorusGeometry(0.19, 0.016, 4, 14), mac, s * 0.12, 0.0, 0.19, 1, 1.05, 1)
      occhi.push(occhio(testa, s * 0.115, 0.03, 0.235, 0.085, u.occhio, { emis: 1.4, sclera: null }))
      scatola(testa, 0.16, 0.035, 0.05, mac, s * 0.12, 0.12, 0.225).rotation.z = s * -0.4
      for (let k = 0; k < 4; k++) cono(testa, 0.035, 0.2 + k * 0.05, k % 2 ? dorso : ric, s * (0.16 + k * 0.05), 0.2 + k * 0.03, 0.0, 4).rotation.set(0, 0, s * (-0.4 - k * 0.12))   // il ciuffo
    }
    cono(testa, 0.04, 0.12, becco, 0, -0.06, 0.28, 4).rotation.x = PI / 2 + 0.55; cono(testa, 0.02, 0.05, becco, 0, -0.12, 0.3, 4).rotation.x = PI + 0.2
    mascella = perno(testa, 0, -0.1, 0.22); cono(mascella, 0.03, 0.08, becco, 0, -0.01, 0.03, 4).rotation.x = PI / 2
  } else {
    // il collo lungo e nudo, in tre pezzi, che si piega a S; la testa piccola e pelata
    let padre = collo
    for (let i = 0; i < 3; i++) { const p = perno(padre, 0, i ? 0.17 : 0.0, i ? 0.03 : 0.0), mp = M(u.pelle); sfera(p, 0.075 - i * 0.01, mp, 0, 0, 0, 1, 1, 1, 8); cil(p, 0.05 - i * 0.005, 0.064 - i * 0.008, 0.19, mp, 0, 0.09, 0.0, 7); p.rotation.x = COLLO[i]; colli.push(p); padre = p }
    padre.add(testa); testa.position.set(0, 0.17, 0.03)
    sfera(testa, 0.088, M(u.pelle), 0, 0.0, 0.0, 1, 1.0, 1.15, 10)
    sfera(testa, 0.045, M(0x8a6a62), 0, 0.045, -0.02, 1, 0.6, 1.4, 6)
    for (const s of [-1, 1]) { occhi.push(occhio(testa, s * 0.062, 0.02, 0.055, 0.022, u.occhio, { emis: 1.3, giro: s * 0.8 })); scatola(testa, 0.04, 0.012, 0.02, mac, s * 0.06, 0.05, 0.065).rotation.z = s * -0.5 }
    const bs = cono(testa, 0.05, 0.2, becco, 0, -0.01, 0.17, 5); bs.rotation.x = PI / 2 + 0.2; bs.scale.set(1, 1, 0.8)
    cono(testa, 0.024, 0.06, M(0x3a3028), 0, -0.05, 0.26, 4).rotation.x = PI + 0.2
    mascella = perno(testa, 0, -0.04, 0.08); cono(mascella, 0.03, 0.1, becco, 0, -0.01, 0.06, 4).rotation.x = PI / 2
    // il collare di piume bianche e le caruncole
    for (let k = 0; k < 14; k++) { const a = k / 14 * PI * 2; cono(collo, 0.055, 0.24, M(u.collare), Math.sin(a) * 0.13, 0.0, Math.cos(a) * 0.13, 4).rotation.set(Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9) }
    sfera(testa, 0.02, M(0xa12d2d), 0, -0.07, 0.1, 0.8, 1.6, 0.8, 5)
  }
  const { ali, apri } = aliPiume(tronco, gufo ? { x: 0.26, y: 0.12, z: 0.0, n: 9, L: 0.62, larg: 0.13, a: dorso, b: ric } : { x: 0.26, y: 0.1, z: 0.02, n: 10, L: 0.78, larg: 0.15, a: dorso, b: ric })
  const zampe = [-1, 1].map(s => zampaUccello(g, s, 0.12, gufo ? 0.33 : 0.4, 0.0, zamp, gufo ? petto : dorso, art, gufo ? 1.3 : 1.45))
  const anima = T => {
    const r = onda(T, 2.4)
    const sp = gesto(T, 8.4, 2, gufo ? 2.6 : 1.6), fl = gesto(T, 6.2, 4.4, 1.0), gi = gesto(T, 5.3, 0.3, 1.6)
    tronco.scale.set(1 + r * 0.014 + fl * 0.06, 1 + r * 0.03 + fl * 0.05, 1 + fl * 0.06)
    tronco.rotation.set(tilt + onda(T, 6.5) * 0.015 - (gufo ? 0 : gi * 0.3), onda(T, 0.5) * 0.06, onda(T, 1.3) * 0.04 + (gufo ? 0 : onda(T, 1.1) * 0.02))
    g.position.y = Math.max(0, onda(T, 1.3)) ** 6 * 0.03
    if (gufo) {
      testa.rotation.set(0.04 + onda(T, 0.7) * 0.05 + gi * 0.2, onda(T, 0.6) * 0.5 + onda(T, 1.9) * 0.1 + sp * PI * 0.62 * Math.sin(sp * PI * 0.5), onda(T, 0.8) * 0.2 + sp * onda(T, 2) * 0.3)
      mascella.rotation.x = Math.max(0, onda(T, 1.9)) * 0.04 + gi * 0.4
    } else {
      colli.forEach((p, i) => { p.rotation.x = COLLO[i] + onda(T, 1.3, i * 0.7) * 0.14 + gi * (i === 0 ? -0.4 : i === 1 ? 0.5 : 0.4) })
      testa.rotation.set(0.1 + onda(T, 2.2) * 0.1, onda(T, 0.7) * 0.5 + onda(T, 2.1) * 0.15, onda(T, 0.9) * 0.2)
      mascella.rotation.x = Math.max(0, onda(T, 1.7)) * 0.05 + gi * 0.5
    }
    apri(Math.max(sp * (gufo ? 0.5 : 0.95), fl * 0.35, gufo ? 0 : 0.06 + onda(T, 0.9) * 0.02))
    coda.rotation.x = (gufo ? 0.9 : 0.5) + onda(T, 1.3) * 0.05
    zampe.forEach((z, i) => { z.an.rotation.x = onda(T, 1.3, i * PI) * 0.03 })
  }
  dichiara(g, 'artigli', 0.8, 0.55)
  g.userData.attacca = p => {                                                  // ali spalancate e picchiata in avanti con artigli e becco
    const F = fasi(p, 0.55)
    imp(tronco.rotation, F, [tilt - 0.4, null, null], [tilt + 0.55, null, null])
    imp(g.position, F, [null, 0.12, -0.12], [null, 0.08, 0.55])
    imp(testa.rotation, F, [-0.15, null, null], [0.2, null, null]); apre(mascella, F, 0.85)
    zampe.forEach(z => { z.an.rotation.x += -F.c * 0.2 - F.k * 1.1; z.gi.rotation.x += F.k * 0.6 })
    if (F.c + F.k > 0.001) ali.forEach(({ sp }) => { sp.rotation.z += F.c * 0.6 - F.k * 0.2 })
  }
  const out = vivifica(g, anima, [tronco.rotation, tronco.scale, g.position, testa.rotation, mascella.rotation, ...colli.map(c => c.rotation), ...zampe.flatMap(z => [z.an.rotation, z.gi.rotation])])
  // l'apertura delle ali dipende dall'attacco: dopo anima(t) le ali sono già a w, attacca ne aggiunge
  const att = g.userData.attacca
  g.userData.attacca = p => {
    const F = fasi(p, 0.55)
    if (F.c + F.k > 0.001) apri(Math.min(1, (F.c * 0.95 + F.k * 0.5)))
    att(p)
  }
  return out
}

// ══════════════════════════════════════ L'ORSO NERO ══════════════════════════════════════
export function creaOrsoNero () {
  const g = creaOrso()
  const visti = new Map()
  g.traverse(o => {
    if (!o.isMesh) return
    if (!visti.has(o.material)) {
      const m = o.material.clone(), c = m.color, l = c.r * 0.3 + c.g * 0.55 + c.b * 0.15
      if (m.emissive && m.emissive.getHex() !== 0) { m.color.set(0xff3a1c); m.emissive.set(0xff3a1c); m.emissiveIntensity = 1.8 }
      else if (l < 0.72) { c.multiplyScalar(0.42); c.lerp(new THREE.Color(0x14182a), 0.25) }
      else c.multiplyScalar(0.78)
      visti.set(o.material, m)
    }
    o.material = visti.get(o.material)
  })
  g.scale.setScalar(1.12)
  // le cicatrici di luce sul dorso (rune di muschio che brillano): solo per dire che questo è un orso diverso
  return g
}

// ══════════════════════════════════════ L'ENT ══════════════════════════════════════
export function creaEnt () {
  const g = new THREE.Group()
  const corteccia = M(0x5a4030), corteccia2 = M(0x3d2a1e), chiara = M(0x7c5d42), muschio = M(0x4d6b2f, { roughness: 1 }), foglia = M(0x5e7a2c), foglia2 = M(0x8a8a2c), foglia3 = M(0x3c5a26), buio = M(NERO, { roughness: 1 })
  const ambra = 0xffb030, linfa = vivoMat(ambra, 2.4, { flatShading: false })
  // le gambe: due ceppi di radici con le dita che afferrano il terreno
  const gambe = []
  for (const s of [-1, 1]) {
    const an = perno(g, s * 0.3, 0.78, 0); gambe.push(an)
    arto(an, [0, 0, 0], [s * 0.04, -0.45, 0.06], 0.22, 0.17, corteccia, 8)
    arto(an, [s * 0.04, -0.45, 0.06], [s * 0.04, -0.72, 0.0], 0.17, 0.2, corteccia2, 8, false)
    for (let k = 0; k < 5; k++) { const a = (k - 2) * 0.55; punta(an, [s * 0.04, -0.7, 0.0], [s * 0.04 + Math.sin(a) * 0.45, -0.76, Math.cos(a) * 0.4], 0.08, corteccia2, 5) }
    for (let k = 0; k < 3; k++) punta(an, [s * 0.12, -0.2 - k * 0.15, -0.14], [s * 0.45, -0.3 - k * 0.15, -0.22], 0.04, corteccia, 4)
  }
  // il tronco: un solido che si restringe, costole di corteccia attorno, nodi
  const tronco = perno(g, 0, 0.82, 0)
  mesh(tronco, new THREE.CylinderGeometry(0.4, 0.5, 1.2, 10, 1), corteccia, 0, 0.55, 0, 1, 1, 0.85)
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2, r = 0.45; const c = rozza(tronco, 0.12, i % 2 ? corteccia2 : chiara, Math.sin(a) * r, 0.3 + (i % 3) * 0.25, Math.cos(a) * r * 0.85, 0.6, 2.4 + (i % 3) * 0.6, 0.6, 0); c.rotation.y = a }
  rozza(tronco, 0.34, corteccia, 0, 1.2, 0.0, 1.35, 0.7, 0.95, 1)                                                      // le spalle nodose
  for (let i = 0; i < 6; i++) sfera(tronco, 0.13, muschio, Math.sin(i * 1.7) * 0.35, 0.2 + i * 0.2, Math.cos(i * 1.7) * 0.32, 1.4, 0.55, 1.2, 6)   // il muschio
  const crepe = []
  for (let i = 0; i < 5; i++) { const c = scatola(tronco, 0.025, 0.28 + (i % 2) * 0.12, 0.012, linfa, (i - 2) * 0.16, 0.45 + (i % 2) * 0.1, 0.42 - Math.abs(i - 2) * 0.03); c.rotation.z = (i - 2) * 0.12; c.castShadow = false; crepe.push(c) }
  // il viso scolpito nella corteccia
  const testa = perno(tronco, 0, 1.38, 0.08)
  rozza(testa, 0.3, corteccia, 0, 0.1, 0.0, 1.1, 1.05, 1.0, 1)
  scatola(testa, 0.52, 0.1, 0.16, corteccia2, 0, 0.17, 0.26).rotation.x = -0.1                                          // l'arcata
  const occhi = []
  for (const s of [-1, 1]) {
    sfera(testa, 0.09, buio, s * 0.14, 0.1, 0.28, 1.1, 0.85, 0.5, 8)
    const o = perno(testa, s * 0.14, 0.1, 0.32); o.userData.occhio = true
    const sf = sfera(o, 0.055, vivoMat(ambra, 2.6, { flatShading: false }), 0, 0, 0, 1, 0.8, 0.6, 8); sf.castShadow = false; occhi.push(sf)
    scatola(testa, 0.18, 0.045, 0.06, corteccia2, s * 0.14, 0.21, 0.3).rotation.z = s * 0.25
  }
  cono(testa, 0.07, 0.2, corteccia, 0, 0.02, 0.36, 5).rotation.x = PI / 2 - 0.3                                       // il naso-nodo
  const mascella = perno(testa, 0, -0.1, 0.14)
  rozza(mascella, 0.15, corteccia2, 0, -0.03, 0.1, 1.5, 0.55, 1.0, 1)
  sfera(mascella, 0.08, lum(0xff8a1c, 1.6), 0, 0.03, 0.12, 1.5, 0.3, 0.9, 6).castShadow = false
  for (let i = -2; i <= 2; i++) cono(mascella, 0.018, 0.07, chiara, i * 0.05, 0.05, 0.18 - Math.abs(i) * 0.02, 4)
  const barba = []
  for (let i = 0; i < 7; i++) { const p = perno(testa, (i - 3) * 0.06, -0.14, 0.2 - Math.abs(i - 3) * 0.02); cono(p, 0.04, 0.3 + (i % 3) * 0.1, i % 2 ? muschio : foglia3, 0, -0.18, 0, 5).rotation.x = PI; barba.push(p) }
  // la chioma: grandi masse di foglie d'autunno e rami che si aprono
  const chioma = perno(testa, 0, 0.32, -0.02)
  const mfog = [foglia, foglia2, foglia3]
  for (let i = 0; i < 11; i++) { const a = i * 2.4; sfera(chioma, 0.2 + (i % 3) * 0.06, mfog[i % 3], Math.sin(a) * 0.32, 0.18 + (i % 4) * 0.1 + (i < 3 ? 0.18 : 0), Math.cos(a) * 0.28, 1.0, 0.8, 1.0, 8) }
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) arto(testa, [s * 0.2, 0.25, -0.05], [s * (0.4 + k * 0.12), 0.45 + k * 0.1, -0.05 + (k - 1) * 0.2], 0.05, 0.02, corteccia2, 5, false)
  // le braccia: rami lunghi, nodosi, con le mani a dita di radice
  const bracci = [], gomiti = [], mani = []
  for (const s of [-1, 1]) {
    const sp = perno(tronco, s * 0.62, 1.22, 0.0); bracci.push(sp)
    sfera(sp, 0.2, corteccia, 0, 0, 0, 1, 1, 1, 8)
    arto(sp, [0, 0, 0], [s * 0.04, -0.62, 0.04], 0.17, 0.13, corteccia, 8)
    for (let k = 0; k < 4; k++) punta(sp, [s * 0.04, -0.15 - k * 0.14, -0.1], [s * (0.32 + (k % 2) * 0.1), -0.05 - k * 0.14, -0.28], 0.035, corteccia2, 4)
    const go = perno(sp, s * 0.04, -0.62, 0.04); gomiti.push(go)
    sfera(go, 0.14, corteccia2, 0, 0, 0, 1, 1, 1, 8)
    arto(go, [0, 0, 0], [0, -0.66, 0.0], 0.13, 0.1, corteccia, 8)
    sfera(go, 0.1, foglia3, s * 0.06, -0.2, -0.08, 1.3, 0.5, 1.3, 6)
    const ma = perno(go, 0, -0.68, 0); mani.push(ma)
    sfera(ma, 0.12, corteccia2, 0, 0, 0, 1.1, 0.9, 0.9, 8)
    for (let d = -2; d <= 2; d++) { const dd = perno(ma, d * 0.05, -0.06, 0.0); dd.rotation.x = -0.3; dd.rotation.z = d * 0.1; arto(dd, [0, 0, 0], [0, -0.2, 0.03], 0.035, 0.022, corteccia2, 5, false); cono(dd, 0.025, 0.14, corteccia2, 0, -0.3, 0.04, 4).rotation.x = PI }
  }
  // rampicanti e foglie che cadono
  const cadono = []
  for (let i = 0; i < 6; i++) { const f = sfera(g, 0.035, mfog[i % 3], 0, 0, 0, 1.6, 0.18, 1.0, 5); f.castShadow = false; cadono.push(f) }
  const anima = T => {
    const r = onda(T, 1.0), cr = gesto(T, 7.4, 2, 1.8), pst = gesto(T, 9.3, 5, 1.4), br = gesto(T, 11.2, 8, 3.0)
    tronco.rotation.set(0.04 + r * 0.01 - cr * 0.06, onda(T, 0.35) * 0.07, onda(T, 0.5) * 0.045 + pst * onda(T, 0.7) * 0.03)
    tronco.scale.set(1 + r * 0.008, 1 + r * 0.014, 1)
    tronco.position.set(onda(T, 0.5) * 0.015 + pst * 0.04, 0.82 - pst * 0.03, 0)
    testa.rotation.set(0.03 + onda(T, 0.5) * 0.05 + cr * 0.12, onda(T, 0.4) * 0.3, onda(T, 0.7) * 0.05)
    mascella.rotation.x = 0.08 + cr * 0.5 + Math.max(0, onda(T, 1.2)) * 0.05
    chioma.rotation.set(onda(T, 1.1) * 0.025, onda(T, 0.6) * 0.04, onda(T, 0.9) * 0.03); chioma.scale.setScalar(1 + onda(T, 1.7) * 0.015 + br * 0.04)
    barba.forEach((p, i) => { p.rotation.x = onda(T, 1.2 + i * 0.1, i) * 0.12; p.rotation.z = onda(T, 0.9, i * 1.7) * 0.1 })
    bracci[0].rotation.set(-0.08 + onda(T, 0.6) * 0.06 - cr * 0.5, 0.1, 0.12 + pst * 0.1); bracci[1].rotation.set(-0.12 + onda(T, 0.6, 1.5) * 0.06 - cr * 0.5, -0.1, -0.12 - pst * 0.1)
    gomiti[0].rotation.x = -0.25 + onda(T, 0.8) * 0.05; gomiti[1].rotation.x = -0.3 + onda(T, 0.8, 1) * 0.05
    mani.forEach((m, i) => { m.rotation.x = -0.1 + onda(T, 1.4, i) * 0.1 })
    gambe[0].rotation.x = onda(T, 0.5) * 0.015 - pst * 0.25; gambe[1].rotation.x = -onda(T, 0.5) * 0.015
    gambe[0].position.y = 0.78 + pst * 0.04
    occhi.forEach((e, i) => { e.material.emissiveIntensity = 2.4 + onda(T, 1.4, i) * 0.6 + cr * 1.6 })
    crepe.forEach((c, i) => { c.material = linfa; c.scale.y = 1 + onda(T, 1.2, i * 0.8) * 0.12 })
    linfa.emissiveIntensity = 2.3 + onda(T, 1.2) * 0.5 + cr * 1.2
    cadono.forEach((f, i) => { const k = ((T * 0.35 + i * 0.37) % 1); f.position.set(Math.sin(i * 2.4 + k * 3) * 0.7, 2.4 - k * 2.35, Math.cos(i * 2.4 + k * 2) * 0.55 - 0.05); f.rotation.set(k * 7 + i, k * 4, k * 5); f.visible = k > 0.02 })
  }
  g.scale.setScalar(0.76)
  dichiara(g, 'schianto', 1.0, 0.55)
  g.userData.attacca = p => {                                                  // le due braccia su, poi schiantate in avanti
    const F = fasi(p, 0.55)
    imp(tronco.rotation, F, [-0.18, null, null], [0.32, null, null])
    imp(testa.rotation, F, [-0.2, null, null], [0.2, null, null]); apre(mascella, F, 0.8)
    bracci.forEach(b => imp(b.rotation, F, [-2.9, null, null], [-0.7, null, null])); gomiti.forEach(go => imp(go.rotation, F, [-0.5, null, null], [-0.1, null, null]))
    imp(tronco.position, F, [null, null, -0.1], [null, null, 0.3])
    gambe.forEach((a, i) => imp(a.rotation, F, [0.15, null, null], [i ? -0.3 : 0.05, null, null]))
    chioma.scale.multiplyScalar(1 + F.c * 0.05)
  }
  return vivifica(g, anima, [tronco.rotation, tronco.position, tronco.scale, testa.rotation, mascella.rotation, chioma.scale, ...bracci.map(b => b.rotation), ...gomiti.map(b => b.rotation), ...gambe.map(b => b.rotation), gambe[0].position])
}

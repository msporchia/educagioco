// Generato da strumenti/promuovi-3d.mjs da poc/mostri-3d/varie.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Prototipo: sei specie del Sotterraneo che non avevano un modello 3D (pianta carnivora, piranha, golem di muschio, scorpione, mostro viola,
// pipistrello occhio), ognuna con più gradi di forza (colore e taglia). Stesso contratto di palude.js: `crea…(v)` → Group coi piedi a y = 0,
// davanti +z, `userData.anima(t)`, `attacca(p)`, `attacco`; una `pose(T, F)` sola che sistema tutto da zero (vedi palude-base.js).
// Gli sprite da cui si prende l'idea stanno in strumenti/sprite/sorgenti/creature (mostri-1.png, mostri-2.png).
import {
  THREE, M, sfera, rozza, scatola, cil, cono, perno, liscio, onda, PI, lucido, lum, lumProprio, molle,
  arto, occhio, marker, gesto, vivente
} from './palude-base.js'

/** base + (verso la carica) * c + (verso lo scatto) * k: la posa di un attacco da tre valori. */
const tra = (base, car, col, c, k) => base + (car - base) * c + (col - base) * k

/** Una catena di perni annidati che si assottiglia da r0 (al perno) a r1 (in punta), lunga `lung` verso +y: corde, liane, code. */
function ramo (padre, n, lung, r0, r1, mat, seg = 6) {
  const perni = []; let cur = padre; const h = lung / n
  for (let i = 0; i < n; i++) {
    const p = perno(cur, 0, i ? h : 0, 0)
    const ra = r0 + (r1 - r0) * (i / n), rb = r0 + (r1 - r0) * ((i + 1) / n)
    cil(p, rb, ra, h, mat, 0, h / 2, 0, seg)
    sfera(p, rb, mat, 0, h, 0, 1, 1, 1, 6)
    perni.push(p); cur = p
  }
  return perni
}

/**
 * Due mascelle a calotta con i denti, incernierate dietro la bocca (la bocca guarda +z, centrata nel punto dato): `apri(rad)` le apre,
 * il primo giro con la mascella di sotto più piccola. `dentro` è il palato e la lingua (rosso, nero, secondo il mostro).
 */
function fauci (padre, x, y, z, r, { fuori, dentro, dente, n = 7, sx = 1, sy = 1, dl = 0.3, gSy = 0.8 }) {
  const cerniera = perno(padre, x, y, z - r)
  const su = perno(cerniera, 0, 0, 0), giu = perno(cerniera, 0, 0, 0)
  const calotta = new THREE.SphereGeometry(1, 14, 8, 0, PI * 2, 0, PI / 2), disco = new THREE.CircleGeometry(1, 14)
  const mDentro = M(dentro, { side: THREE.DoubleSide, flatShading: false, roughness: 0.4 })
  for (const [j, s] of [[su, 1], [giu, -1]]) {
    const sY = s > 0 ? sy : sy * gSy
    const m = new THREE.Mesh(calotta, fuori); m.castShadow = true; m.position.z = r; m.scale.set(sx * r, sY * r, r); if (s < 0) m.rotation.x = PI; j.add(m)
    const d = new THREE.Mesh(disco, mDentro); d.position.z = r; d.rotation.x = -s * PI / 2; d.scale.set(sx * r * 0.99, r * 0.99, 1); j.add(d)
    for (let i = 0; i < n; i++) {
      const a = (0.08 + 0.84 * (i / (n - 1))) * PI, h = r * dl * (0.7 + 0.3 * Math.sin(a))
      const t = cono(j, r * 0.075, h, dente, Math.cos(a) * sx * r * 0.94, s * h * 0.5, r + Math.sin(a) * r * 0.94, 4)
      if (s > 0) t.rotation.x = PI
    }
  }
  return { cerniera, su, giu, apri: a => { su.rotation.x = -a * 0.6; giu.rotation.x = a * 0.4 } }
}

// ═════════════════════════════════════ LA PIANTA CARNIVORA ═════════════════════════════════════
// Una testa che è tutta bocca su un fusto grosso, con due liane. Il verde frusta; la viola (v = 1) ha le sacche e sputa le spore.
const PIANTE = [
  { pelle: 0x4f9a3a, scuro: 0x2c6a2a, vena: 0x8cc443, dentro: 0xb8202a, dente: 0xf4ecd0, macchia: 0xc23a2a, spore: false, k: 1 },
  { pelle: 0x7a4fa8, scuro: 0x3b2a66, vena: 0xb27ad8, dentro: 0xe0509a, dente: 0xf2e8b0, macchia: 0xd8e04a, spore: true, k: 1.15 }
]
export function creaPianta (v = 0) {
  const u = PIANTE[v], g = new THREE.Group()
  const pelle = molle(u.pelle), scuro = molle(u.scuro), vena = molle(u.vena)
  // il bulbo e le radici che strisciano
  sfera(g, 0.26, scuro, 0, 0.17, 0, 1.25, 0.75, 1.25, 12)
  const radici = []
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * PI * 2 + 0.3, p = perno(g, Math.sin(a) * 0.16, 0.12, Math.cos(a) * 0.16); radici.push({ p, a })
    arto(p, [0, 0, 0], [Math.sin(a) * 0.2, -0.04, Math.cos(a) * 0.2], 0.06, 0.03, scuro, 5, false)
    arto(p, [Math.sin(a) * 0.2, -0.04, Math.cos(a) * 0.2], [Math.sin(a) * 0.36, -0.1, Math.cos(a) * 0.36], 0.03, 0.012, scuro, 5, false)
  }
  // il fusto
  const fusto = perno(g, 0, 0.2, 0)
  cil(fusto, 0.15, 0.21, 0.55, pelle, 0, 0.27, 0, 9)
  for (let i = 0; i < 5; i++) { const a = i * 1.26; cil(fusto, 0.012, 0.012, 0.42, vena, Math.sin(a) * 0.17, 0.26, Math.cos(a) * 0.17, 4) }  // le vene
  const testa = perno(fusto, 0, 0.62, 0.02)
  const bocca = fauci(testa, 0, 0, 0, 0.3, { fuori: pelle, dentro: u.dentro, dente: M(u.dente, { flatShading: false }), n: 8, sx: 1.1, sy: 1.0, dl: 0.34 })
  for (let i = 0; i < 7; i++) {                                                      // le macchie sulla cupola (rosse, o gialle se velenosa)
    const a = i * 2.1, r = 0.2 + (i % 3) * 0.03
    sfera(bocca.su, 0.035, M(u.macchia, { flatShading: false }), Math.sin(a) * r, 0.17 + (i % 2) * 0.05, 0.3 + Math.cos(a) * r * 0.7, 1, 0.5, 1, 6)
  }
  // il colletto di foglie
  const foglie = []
  for (let i = 0; i < 7; i++) {
    const f = perno(fusto, 0, 0.5, 0); f.rotation.y = i / 7 * PI * 2
    const f2 = perno(f, 0, 0, 0)
    const bl = cono(f2, 0.11, 0.42, i % 2 ? vena : pelle, 0, 0.09, 0.2, 4); bl.rotation.x = 1.15; bl.scale.z = 0.35
    foglie.push(f2)
  }
  // le sacche di spore (la viola): tre bubboni luminosi sul collo
  const sacche = u.spore ? [[-0.15, 0.4, 0.08], [0.16, 0.34, 0.1], [0.0, 0.44, -0.16]].map(([x, y, z]) => {
    const s = sfera(fusto, 0.065, lum(u.macchia, 0.7), x, y, z, 1, 1, 1, 8); return { s, y }
  }) : []
  // due liane che nascono ai lati del fusto
  const liane = [-1, 1].map(s => {
    const root = perno(fusto, s * 0.15, 0.4, 0)
    const seg = ramo(root, 5, 0.9, 0.05, 0.016, s > 0 ? scuro : pelle)
    sfera(seg[4], 0.035, M(u.macchia, { flatShading: false }), 0, 0.18, 0, 1, 1.3, 1, 6)
    for (let i = 1; i < 5; i += 2) cono(seg[i], 0.025, 0.07, vena, s * 0.03, 0.1, 0, 4).rotation.z = -s * 1.2   // le spine
    return { root, seg, s }
  })
  const origine = u.spore ? marker(testa, 0, 0, 0.34) : null
  g.scale.setScalar(u.k)
  const pose = (T, F) => {
    const { c, k, a } = F
    const sw = onda(T, 0.9), sw2 = onda(T, 1.7, 1.3), snap = gesto(T, 5.5, 1.5, 0.85)
    fusto.rotation.set(0.2 + 0.05 * sw + (u.spore ? -0.5 * c + 0.4 * k : -0.3 * c + 0.3 * k), 0.12 * sw2 * (1 - k), 0.05 * onda(T, 1.1))
    testa.rotation.set(0.06 * onda(T, 1.3) + (u.spore ? -0.3 * c + 0.2 * k : 0.1 * k), 0.3 * onda(T, 0.6) * (1 - k), 0.05 * sw2)
    bocca.apri(0.16 + 0.1 * Math.max(0, onda(T, 2.1)) + 0.85 * snap + 0.95 * a)
    radici.forEach(({ p, a: an }, i) => { p.rotation.set(0, 0, 0); p.position.y = 0.12 + 0.012 * onda(T, 1.6, i) })
    foglie.forEach((f, i) => { f.rotation.x = -0.1 + 0.12 * onda(T, 1.9, i * 0.9) - 0.25 * c + 0.3 * k })
    sacche.forEach(({ s, y }, i) => { const q = 1 + 0.12 * onda(T, 2.3, i * 2) + 0.9 * c - 0.7 * k; s.scale.setScalar(q); s.position.y = y })
    liane.forEach(({ root, seg, s }, i) => {
      const w = onda(T, 1.2, i * 1.7), w2 = onda(T, 2.0, i * 0.8)
      let rz, cur, rx
      if (u.spore) { rz = tra(1.45 + 0.1 * w, 1.9, 1.1, c, k); cur = tra(0.32 + 0.08 * w2, 0.5, 0.15, c, k); rx = tra(0, -0.2, 0.2, c, k) }
      else { rz = tra(1.45 + 0.1 * w, 0.75, 0.3, c, k); cur = tra(0.32 + 0.08 * w2, 0.55, -0.12, c, k); rx = tra(0.05 * w, -1.0, 1.2, c, k) }
      root.rotation.set(rx, 0, -s * rz)
      seg.forEach((p, j) => { p.rotation.set(j * 0.02 * w, 0, -s * (cur + 0.03 * onda(T, 3, j))) })
    })
  }
  return vivente(g, pose, u.spore
    ? { tipo: 'spore', durata: 0.9, arrivo: 0.5, origine, proiettile: 'spore' }
    : { tipo: 'frustata', durata: 0.8, arrivo: 0.55 })
}

// ═════════════════════════════════════ IL PIRANHA ═════════════════════════════════════
// Un pesce che nuota a mezz'aria: pancia in giù, bocca di denti. Lo scatto lo porta in avanti col morso.
const PIRANHA = [
  { dorso: 0x2a86b8, fianco: 0x57c0e0, ventre: 0xd8e8ee, pinna: 0x1f6a98, occhio: 0xf0b020, k: 1 },
  { dorso: 0x9a2a24, fianco: 0xd85a3a, ventre: 0xf0c070, pinna: 0x7a1c1c, occhio: 0xffe040, k: 1.12 },
  { dorso: 0x1a2733, fianco: 0x3a5870, ventre: 0x93a4ae, pinna: 0x101820, occhio: 0xff4020, k: 1.28 }
]
export function creaPiranha (v = 0) {
  const u = PIRANHA[v], g = new THREE.Group()
  const dorso = molle(u.dorso, { roughness: 0.4 }), fianco = molle(u.fianco, { roughness: 0.35 }), ventre = molle(u.ventre), pinna = molle(u.pinna, { side: THREE.DoubleSide })
  const corpo = perno(g, 0, 0.45, 0)
  sfera(corpo, 1, fianco, 0, 0, 0, 0.17, 0.27, 0.46, 14)
  sfera(corpo, 1, dorso, 0, 0.075, -0.01, 0.168, 0.2, 0.455, 14)
  sfera(corpo, 1, ventre, 0, -0.1, 0.02, 0.15, 0.16, 0.43, 12)
  sfera(corpo, 0.14, dorso, 0, 0.05, 0.3, 1.0, 1.3, 1.1, 12)                              // la testa (scura sopra, come il dorso)
  for (const [x, y, z] of [[0.15, 0.04, 0.0], [-0.15, 0.0, -0.1], [0.14, -0.04, -0.22], [-0.15, 0.06, 0.12]]) sfera(corpo, 0.028, M(0x7a1c24, { flatShading: false }), x, y, z, 0.4, 1, 1, 6)  // i segni
  const bocca = fauci(corpo, 0, -0.06, 0.34, 0.17, { fuori: fianco, dentro: 0xa81830, dente: M(0xf6f0dc, { flatShading: false }), n: 8, sx: 1.0, sy: 1.0, dl: 0.55, gSy: 1.1 })
  for (const s of [-1, 1]) occhio(corpo, s * 0.125, 0.1, 0.27, 0.055, u.occhio, { emis: 0.9, giro: s * 1.2 })
  // le pinne
  const dors = perno(corpo, 0, 0.27, -0.06); dors.rotation.x = -0.5
  cono(dors, 0.14, 0.3, pinna, 0, 0.1, 0, 4).scale.x = 0.1
  cono(corpo, 0.06, 0.14, pinna, 0, 0.22, -0.3, 4).scale.x = 0.1
  const coda = perno(corpo, 0, 0, -0.43)
  for (const s of [-1, 1]) { const f = cono(coda, 0.15, 0.36, pinna, 0, s * 0.07, -0.14, 4); f.rotation.x = -PI / 2 + s * 0.55; f.scale.x = 0.1 }
  const pett = [-1, 1].map(s => { const p = perno(corpo, s * 0.15, -0.06, 0.1); const f = cono(p, 0.07, 0.24, pinna, 0, 0.1, 0, 4); f.scale.z = 0.3; return { p, s } })
  const sotto = perno(corpo, 0, -0.26, -0.12); cono(sotto, 0.06, 0.2, pinna, 0, -0.07, 0, 4).scale.x = 0.1; sotto.rotation.x = 0.3
  g.scale.setScalar(u.k)
  const pose = (T, F) => {
    const { c, k, a } = F
    const nuota = onda(T, 3.4)
    corpo.position.set(0.03 * onda(T, 0.9), 0.46 + 0.035 * onda(T, 1.4) + 0.06 * c - 0.04 * k, -0.28 * c + 0.7 * k)
    corpo.rotation.set(0.04 * onda(T, 1.2) - 0.3 * c + 0.18 * k, 0.12 * onda(T, 1.6) + 0.22 * nuota * (c + k) * 0.5, 0.05 * onda(T, 1.1))
    coda.rotation.y = (0.4 + 0.35 * (c + k)) * nuota
    pett.forEach(({ p, s }, i) => { p.rotation.set(0, s * 0.6, -s * (1.15 + 0.3 * onda(T, 5.5, i * 1.3) - 0.5 * k)) })
    sotto.rotation.z = 0.12 * onda(T, 3.4, 1)
    bocca.apri(0.16 + 0.12 * Math.max(0, onda(T, 2.6)) + 1.0 * a)
  }
  return vivente(g, pose, { tipo: 'morso', durata: 0.55, arrivo: 0.5 })
}

// ═════════════════════════════════════ IL GOLEM DI MUSCHIO ═════════════════════════════════════
// Sasso a blocchi con le braccia lunghe quasi fino a terra, il muschio sulle spalle e sul capo, gli occhi rossi. Il pugno schiacciante: le
// due braccia in alto, la testa dietro, e giù tutte e due insieme.
const GOLEM = [
  { pietra: 0x8a8576, scura: 0x5e5a50, muschio: 0x5f8f2e, chiaro: 0x86b83e, occhio: 0xff3322, fiori: 0, k: 1 },
  { pietra: 0x6f7468, scura: 0x464a42, muschio: 0x3f7a3a, chiaro: 0x6fb04a, occhio: 0xffb030, fiori: 0xf06aa0, k: 1.1 },
  { pietra: 0x5a5f66, scura: 0x383c44, muschio: 0x2f5f4a, chiaro: 0x4f9a78, occhio: 0x5af0d0, fiori: 0xf2e050, k: 1.25 }
]
export function creaGolemMuschio (v = 0) {
  const u = GOLEM[v], g = new THREE.Group()
  const pietra = M(u.pietra), scura = M(u.scura), muschio = molle(u.muschio, { roughness: 0.9 }), chiaro = molle(u.chiaro, { roughness: 0.9 })
  const occ = lumProprio(u.occhio, 2.2)
  const bacino = perno(g, 0, 0.5, 0)
  rozza(bacino, 0.27, scura, 0, 0, 0, 1.2, 0.7, 0.95, 1)
  // le gambe
  const gambe = [-1, 1].map(s => {
    const p = perno(bacino, s * 0.21, -0.05, 0)
    rozza(p, 0.2, pietra, 0, -0.2, 0, 1.0, 1.55, 1.0, 1)
    rozza(p, 0.21, scura, 0, -0.43, 0.07, 1.15, 0.5, 1.6, 1)
    sfera(p, 0.1, muschio, 0, -0.02, -0.02, 1.4, 0.5, 1.3, 7)
    return { p, s }
  })
  // il busto, che si inclina
  const busto = perno(bacino, 0, 0.1, 0)
  rozza(busto, 0.42, pietra, 0, 0.36, 0, 1.15, 1.0, 0.85, 1)
  rozza(busto, 0.26, scura, 0, 0.2, 0.2, 1.1, 0.8, 0.5, 1)
  rozza(busto, 0.3, scura, 0, 0.5, -0.26, 1.25, 0.9, 0.55, 1)
  for (const [x, y, z, r] of [[-0.14, 0.72, -0.15, 0.2], [0.2, 0.52, -0.3, 0.17], [-0.2, 0.26, 0.26, 0.11], [0.18, 0.62, 0.18, 0.1]]) sfera(busto, r, muschio, x, y, z, 1.3, 0.5, 1.2, 8)
  // la testa: bassa fra le spalle, un cranio di sasso con la fronte pesante
  const testa = perno(busto, 0, 0.9, 0.14)
  rozza(testa, 0.2, pietra, 0, 0.02, 0, 1.15, 0.9, 1.0, 1)
  rozza(testa, 0.12, scura, 0, -0.1, 0.1, 1.2, 0.6, 0.9, 1)
  scatola(testa, 0.34, 0.07, 0.1, scura, 0, 0.06, 0.18)
  for (const s of [-1, 1]) sfera(testa, 0.045, occ, s * 0.09, 0.0, 0.2, 1.2, 0.8, 0.6, 8)
  sfera(testa, 0.14, muschio, 0, 0.18, -0.03, 1.2, 0.55, 1.2, 8)
  for (let i = 0; i < 6; i++) cono(testa, 0.035, 0.12 + (i % 2) * 0.05, chiaro, Math.sin(i * 1.05) * 0.11, 0.24, Math.cos(i * 1.05) * 0.1 - 0.03, 4).rotation.set(Math.cos(i) * 0.4, 0, Math.sin(i) * 0.4)
  if (u.fiori) for (const [x, z] of [[0.08, 0.04], [-0.1, -0.06], [0.0, -0.12]]) sfera(testa, 0.028, M(u.fiori, { flatShading: false }), x, 0.3, z, 1, 1, 1, 6)
  // le braccia: spalla, gomito, pugno
  const bracci = [-1, 1].map(s => {
    const sp = perno(busto, s * 0.52, 0.62, 0)
    rozza(sp, 0.26, scura, 0, 0.03, 0, 1.1, 0.9, 1.0, 1)
    sfera(sp, 0.17, muschio, 0, 0.18, 0, 1.4, 0.55, 1.4, 8)
    rozza(sp, 0.17, pietra, 0, -0.22, 0, 1.0, 1.7, 1.0, 1)
    const go = perno(sp, 0, -0.42, 0)
    rozza(go, 0.17, pietra, 0, -0.2, 0, 1.1, 1.6, 1.1, 1)
    const pu = perno(go, 0, -0.45, 0.02)
    rozza(pu, 0.21, scura, 0, -0.04, 0, 1.15, 1.0, 1.1, 1)
    if (u.fiori) sfera(pu, 0.025, M(u.fiori, { flatShading: false }), 0.03, 0.08, 0.1, 1, 1, 1, 6)
    return { sp, go, pu, s }
  })
  if (u.fiori) for (const [x, z] of [[0.1, -0.2], [-0.2, -0.28]]) sfera(busto, 0.03, M(u.fiori, { flatShading: false }), x, 0.76, z, 1, 1, 1, 6)
  g.scale.setScalar(u.k)
  const pose = (T, F) => {
    const { c, k } = F
    const re = onda(T, 1.5), pes = gesto(T, 7.5, 2.0, 2.2), gi = onda(T, 0.5)
    bacino.position.set(0, 0.5 + 0.012 * re - 0.16 * k + 0.05 * c, 0.1 * k - 0.06 * c)
    busto.rotation.set(0.2 + 0.025 * re - 0.35 * c + 0.55 * k + 0.06 * pes, 0.08 * gi * (1 - k), 0.03 * onda(T, 0.8))
    testa.rotation.set(-0.05 + 0.04 * re - 0.3 * c + 0.3 * k, 0.4 * onda(T, 0.4) * (1 - c - k) + 0.1 * onda(T, 1.9) * (1 - c - k), 0)
    occ.emissiveIntensity = 2.0 + 0.5 * onda(T, 2.2) + 1.8 * c
    gambe.forEach(({ p, s }, i) => { p.rotation.set(0.03 * onda(T, 1.5, i * PI) - 0.2 * k + 0.1 * c, 0, 0) })
    bracci.forEach(({ sp, go, pu, s }, i) => {
      const bal = onda(T, 1.5, 0.6 + i * 1.3)
      sp.rotation.set(tra(0.05 * bal - 0.1 * pes, -3.2, -0.5, c, k), 0, tra(s * (0.05 + 0.03 * bal), s * 0.15, s * 0.05, c, k))
      go.rotation.set(tra(-0.12 - 0.05 * bal, -0.6, -0.15, c, k), 0, 0)
      pu.rotation.set(tra(-0.05, -0.2, 0.0, c, k), 0, 0)
    })
  }
  return vivente(g, pose, { tipo: 'schianto-a-due-pugni', durata: 1.05, arrivo: 0.55 })
}

// ═════════════════════════════════════ LO SCORPIONE ═════════════════════════════════════
// Corpo basso a piastre, otto zampe, due chele, la coda che si arcua sul dorso. Il pungiglione: la coda si carica indietro e frusta in avanti.
const SCORPIONI = [
  { corpo: 0x5e2a8c, placche: 0x7a3fb0, chela: 0xe0408c, pungi: 0xffb0d0, brace: 0, k: 1 },
  { corpo: 0x2a2220, placche: 0x4a3830, chela: 0xff6a1a, pungi: 0xffc060, brace: 0xff7a1a, k: 1.12 },
  { corpo: 0x7a1a14, placche: 0xa83a22, chela: 0xe8b030, pungi: 0xfff0a0, brace: 0xffc030, k: 1.3 }
]
export function creaScorpione (v = 0) {
  const u = SCORPIONI[v], g = new THREE.Group()
  const corpo = M(u.corpo), placche = M(u.placche), chela = M(u.chela, { roughness: 0.4 }), nero = M(0x16101c)
  const pung = u.brace ? lumProprio(u.pungi, 1.6) : M(u.pungi, { flatShading: false, roughness: 0.3 })
  const tutto = perno(g, 0, 0, 0)
  // il torace e l'addome a placche
  rozza(tutto, 0.3, corpo, 0, 0.24, 0.12, 1.0, 0.55, 1.25, 1)
  rozza(tutto, 0.26, placche, 0, 0.32, 0.12, 0.9, 0.4, 1.1, 1)
  for (const [z, r] of [[-0.22, 0.24], [-0.4, 0.2], [-0.55, 0.16]]) { rozza(tutto, r, corpo, 0, 0.26, z, 1.0, 0.65, 0.95, 1); rozza(tutto, r * 0.8, placche, 0, 0.33, z, 0.9, 0.5, 0.85, 1) }
  for (const s of [-1, 1]) sfera(tutto, 0.04, lum(0xffd23a, 1.2), s * 0.08, 0.38, 0.3, 1, 1, 1, 6)
  for (const s of [-1, 1]) cono(tutto, 0.03, 0.12, nero, s * 0.06, 0.2, 0.42, 4).rotation.x = PI / 2     // i cheliceri
  // le zampe: quattro per lato, ognuna in due pezzi
  const zampe = []
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    const z = 0.34 - i * 0.17, p = perno(tutto, s * 0.2, 0.24, z)
    arto(p, [0, 0, 0], [s * 0.22, 0.1, 0.05 * (1.5 - i)], 0.035, 0.028, corpo, 5)
    const gi = perno(p, s * 0.22, 0.1, 0.05 * (1.5 - i))
    arto(gi, [0, 0, 0], [s * 0.1, -0.34, 0.03 * (1.5 - i)], 0.028, 0.012, placche, 5, false)
    zampe.push({ p, gi, s, i })
  }
  // le chele: braccio, palmo, due dita (una fissa, una che si chiude)
  const chele = [-1, 1].map(s => {
    const sp = perno(tutto, s * 0.2, 0.26, 0.42)
    arto(sp, [0, 0, 0], [s * 0.1, 0, 0.2], 0.05, 0.04, corpo, 6)
    const go = perno(sp, s * 0.1, 0, 0.2)
    arto(go, [0, 0, 0], [s * 0.04, 0, 0.2], 0.045, 0.04, corpo, 6)
    const pa = perno(go, s * 0.04, 0, 0.2)
    rozza(pa, 0.11, chela, 0, 0, 0.07, 0.9, 0.7, 1.3, 1)
    cono(pa, 0.055, 0.22, chela, 0, 0, 0.26, 4).rotation.x = PI / 2
    const dito = perno(pa, s * 0.045, 0, 0.12)
    const cd = cono(dito, 0.05, 0.2, chela, s * 0.0, 0, 0.12, 4); cd.rotation.x = PI / 2
    return { sp, go, pa, dito, s }
  })
  // la coda: sei pezzi che si arcuano sul dorso, la punta con la sacca e l'ago
  const rad = perno(tutto, 0, 0.3, -0.62)
  const coda = ramo(rad, 6, 0.95, 0.085, 0.045, corpo, 7)
  const ultimo = coda[5]
  const sacca = perno(ultimo, 0, 0.16, 0)
  sfera(sacca, 0.075, placche, 0, 0.02, 0, 1, 1.15, 1, 9)
  const ago = perno(sacca, 0, 0.07, 0); ago.rotation.x = 0.5
  const punta = cono(ago, 0.034, 0.18, pung, 0, 0.08, 0, 5)
  for (let i = 1; i < 6; i += 2) sfera(coda[i], 0.04, placche, 0, 0.07, -0.04, 1.2, 0.8, 0.6, 6)
  if (u.brace) for (const s of [-1, 1]) for (const ch of chele.filter(x => x.s === s)) sfera(ch.pa, 0.05, lum(u.brace, 1.0), 0, 0.05, 0.1, 1, 0.6, 1.2, 6)
  const origine = null
  g.scale.setScalar(u.k)
  const pose = (T, F) => {
    const { c, k } = F
    const re = onda(T, 1.8), fru = gesto(T, 6.0, 1.5, 1.4), ch = gesto(T, 4.5, 0.6, 0.9)
    tutto.position.set(0, 0.012 * re, 0.5 * k - 0.16 * c)
    tutto.rotation.set(-0.06 * c + 0.1 * k, 0.05 * onda(T, 0.7) * (1 - k), 0.02 * onda(T, 1.1))
    zampe.forEach(({ p, gi, s, i }) => {
      const f = onda(T, 3.2, i * 1.4 + (s > 0 ? PI : 0) + 0.7 * (i % 2)), sh = 0.12 * f * (1 - c - k)
      p.rotation.set(0, 0.1 * (i - 1.5) * 0.4 + sh, 0.06 * f * s)
      gi.rotation.set(0.1 * f * (1 - c - k), 0, 0)
    })
    chele.forEach(({ sp, go, pa, dito, s }, i) => {
      const b = onda(T, 1.4, i * 1.7)
      sp.rotation.set(0, s * (-0.3 + 0.1 * b - 0.3 * c + 0.25 * k), 0)
      go.rotation.set(0, s * (0.5 + 0.12 * onda(T, 1.9, i) + 0.4 * c - 0.2 * k), 0)
      pa.rotation.set(0.1 * b, 0, 0)
      dito.rotation.set(0, -s * (0.1 + 0.35 * Math.max(0, onda(T, 1.6, i * 2.1)) + 0.55 * ch * (i ? 0 : 1) + 0.4 * c), 0)
    })
    // la coda: ad arco sul dorso a riposo, tirata indietro e su nella carica, lanciata in avanti nello scatto
    rad.rotation.set(tra(-0.2 + 0.05 * re + 0.12 * fru, -0.95, 1.2, c, k), 0.12 * onda(T, 0.9) * (1 - c - k), 0)
    coda.forEach((p, j) => { p.rotation.set(j ? tra(0.5 + 0.03 * onda(T, 1.8, j * 0.6) + 0.1 * fru, 0.2, 0.1, c, k) : 0, 0, 0) })
    ago.rotation.x = tra(0.5, 0.2, 0.0, c, k)
    if (u.brace) pung.emissiveIntensity = 1.4 + 0.5 * onda(T, 2.4) + 2 * c
  }
  return vivente(g, pose, { tipo: 'pungiglione', durata: 0.85, arrivo: 0.55 })
}

// ═════════════════════════════════════ IL MOSTRO VIOLA ═════════════════════════════════════
// Un bruto tozzo e viscido con le braccia che toccano terra e una bocca nera piena di zanne gialle. Afferra: le braccia larghe, poi insieme,
// e la bocca che si chiude.
const VIOLA = [
  { pelle: 0x7a28c8, scura: 0x4e1a88, pancia: 0x9a4ae0, dente: 0xf2d040, occhio: 0xffe070, spine: false, k: 1 },
  { pelle: 0x34205c, scura: 0x1e1238, pancia: 0x5a3a96, dente: 0xe8f0ff, occhio: 0x80f0ff, spine: true, k: 1.22 }
]
export function creaMostroViola (v = 0) {
  const u = VIOLA[v], g = new THREE.Group()
  const pelle = molle(u.pelle, { roughness: 0.35 }), scura = molle(u.scura, { roughness: 0.4 }), pancia = molle(u.pancia, { roughness: 0.35 })
  const bacino = perno(g, 0, 0.32, 0)
  sfera(bacino, 0.25, scura, 0, 0.0, 0, 1.2, 0.8, 1.0, 12)
  const gambe = [-1, 1].map(s => {
    const p = perno(bacino, s * 0.16, 0, 0)
    arto(p, [0, 0, 0], [0, -0.28, 0], 0.11, 0.09, pelle, 8, false)
    sfera(p, 0.11, scura, 0, -0.3, 0.05, 1.1, 0.5, 1.6, 8)
    return { p, s }
  })
  const busto = perno(bacino, 0, 0.05, 0)
  sfera(busto, 0.4, pelle, 0, 0.3, 0, 1.0, 1.1, 0.9, 16)
  sfera(busto, 0.3, pancia, 0, 0.22, 0.17, 0.85, 0.9, 0.55, 12)
  if (u.spine) for (let i = 0; i < 6; i++) cono(busto, 0.06, 0.24, scura, ((i % 3) - 1) * 0.16, 0.6 - Math.floor(i / 3) * 0.2, -0.28, 4).rotation.x = -1.0
  const testa = perno(busto, 0, 0.66, 0.06)
  sfera(testa, 0.26, pelle, 0, 0.0, 0, 1.1, 0.9, 1.0, 14)
  const bocca = fauci(testa, 0, -0.08, 0.1, 0.19, { fuori: pelle, dentro: 0x120818, dente: M(u.dente, { flatShading: false }), n: 7, sx: 1.2, sy: 0.9, dl: 0.4, gSy: 0.7 })
  for (const s of [-1, 1]) {
    occhio(testa, s * 0.11, 0.1, 0.22, 0.045, u.occhio, { emis: 1.0, giro: s * 0.4 })
    sfera(testa, 0.05, scura, s * 0.11, 0.16, 0.21, 1.3, 0.5, 1.0, 6)                           // il sopracciglio pesante
  }
  // le braccia lunghe: dalla spalla fin quasi a terra, con la mano a tre artigli
  const bracci = [-1, 1].map(s => {
    const sp = perno(busto, s * 0.4, 0.5, 0)
    sfera(sp, 0.13, pelle, 0, 0, 0, 1, 1, 1, 8)
    arto(sp, [0, 0, 0], [0, -0.38, 0], 0.11, 0.09, pelle, 8, false)
    const go = perno(sp, 0, -0.38, 0)
    sfera(go, 0.09, pelle, 0, 0, 0, 1, 1, 1, 8)
    arto(go, [0, 0, 0], [0, -0.4, 0], 0.09, 0.075, pelle, 8, false)
    const ma = perno(go, 0, -0.42, 0.02)
    sfera(ma, 0.13, scura, 0, 0, 0, 1.1, 1.0, 1.0, 9)
    for (let i = -1; i <= 1; i++) cono(ma, 0.028, 0.14, M(u.dente, { flatShading: false }), i * 0.06, -0.12, 0.03, 4).rotation.x = PI
    return { sp, go, ma, s }
  })
  g.scale.setScalar(u.k)
  const pose = (T, F) => {
    const { c, k, a } = F
    const re = onda(T, 1.7), pes = gesto(T, 6.5, 2.2, 1.6)
    bacino.position.set(0, 0.32 + 0.012 * re - 0.05 * k + 0.03 * c, 0.15 * k - 0.1 * c)
    busto.rotation.set(0.1 + 0.03 * re - 0.2 * c + 0.45 * k, 0.1 * onda(T, 0.6) * (1 - k), 0.04 * onda(T, 0.9))
    testa.rotation.set(0.05 * onda(T, 1.2) - 0.2 * c + 0.3 * k, 0.3 * onda(T, 0.5) * (1 - c - k), 0.06 * onda(T, 0.8))
    bocca.apri(0.2 + 0.12 * Math.max(0, onda(T, 2.2)) + 0.35 * pes + 1.0 * a)
    gambe.forEach(({ p }, i) => { p.rotation.set(0.04 * onda(T, 1.7, i * PI) - 0.25 * k + 0.1 * c, 0, 0) })
    bracci.forEach(({ sp, go, ma, s }, i) => {
      const b = onda(T, 1.7, 0.4 + i * 1.5)
      sp.rotation.set(tra(0.06 * b - 0.1 * pes, -0.5, -1.55, c, k), 0, tra(s * (0.1 + 0.04 * b), s * 1.3, -s * 0.3, c, k))
      go.rotation.set(tra(-0.12 - 0.05 * b, -0.5, -0.45, c, k), 0, 0)
      ma.rotation.set(tra(-0.05, 0.3, 0.2, c, k), 0, 0)
    })
  }
  return vivente(g, pose, { tipo: 'morso', durata: 0.9, arrivo: 0.55 })
}

// ═════════════════════════════════════ IL PIPISTRELLO OCCHIO ═════════════════════════════════════
// Un grande occhio rosso al centro di un corpo peloso e due ali larghe, la bocca di zanne sotto. Plana: si carica in alto, l'occhio si accende,
// poi la picchiata e il raggio.
const OCCHI = [
  { pelo: 0x6a2c8a, pelo2: 0x8a44aa, mem: 0x4b2a68, mem2: 0x6a3a88, iride: 0xff3030, sclera: 0xf4d8dc, raggio: 0xff4050, k: 1 },
  { pelo: 0x2a3a6a, pelo2: 0x3f58a0, mem: 0x1f2a50, mem2: 0x2f4078, iride: 0x40e0ff, sclera: 0xe0f0f4, raggio: 0x60e8ff, k: 1.3 }
]
export function creaPipistrelloOcchio (v = 0) {
  const u = OCCHI[v], g = new THREE.Group()
  const pelo = M(u.pelo), pelo2 = M(u.pelo2), dente = M(0xf6f0dc, { flatShading: false }), buio = lucido(0x16101c)
  const iride = lumProprio(u.iride, 1.8)
  const aloneM = new THREE.MeshBasicMaterial({ color: u.raggio, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
  const corpo = perno(g, 0, 0.82, 0)
  rozza(corpo, 0.23, pelo, 0, 0, -0.02, 1.0, 1.05, 0.95, 2)
  for (let i = 0; i < 7; i++) cono(corpo, 0.04, 0.1, pelo2, ((i % 4) - 1.5) * 0.09, -0.15 + Math.floor(i / 4) * 0.1, -0.2, 4).rotation.x = -2.0
  // l'occhio: bulbo, anello, iride accesa, pupilla a fessura
  const occ = perno(corpo, 0, 0.04, 0.12); occ.userData.occhio = true
  sfera(occ, 0.16, M(u.sclera, { flatShading: false, roughness: 0.3 }), 0, 0, 0.04, 1, 1, 0.8, 16)
  mesh0(occ, new THREE.TorusGeometry(0.165, 0.028, 6, 18), pelo2, 0, 0, 0.02)
  sfera(occ, 0.095, iride, 0, 0, 0.14, 1, 1, 0.5, 14)
  sfera(occ, 0.05, buio, 0, 0, 0.19, 0.4, 1.4, 0.4, 8)
  for (const [x, y] of [[0.1, 0.1], [-0.11, 0.07], [0.09, -0.1], [-0.08, -0.12]]) { const q = cil(occ, 0.006, 0.006, 0.12, M(0xb02030, { flatShading: false }), x, y, 0.12, 4); q.rotation.z = Math.atan2(x, -y) }
  const alone = sfera(occ, 0.1, aloneM, 0, 0, 0.2, 1, 1, 0.5, 10)
  const origine = marker(occ, 0, 0, 0.24)
  // la bocca sotto l'occhio, le orecchie, i piedi appesi
  const bocca = fauci(corpo, 0, -0.17, 0.1, 0.07, { fuori: pelo2, dentro: 0x3a0818, dente, n: 5, sx: 1.4, sy: 0.9, dl: 0.7, gSy: 0.8 })
  const orecchie = [-1, 1].map(s => { const o = perno(corpo, s * 0.11, 0.19, -0.02); const c = cono(o, 0.07, 0.26, pelo, 0, 0.12, 0, 4); c.scale.z = 0.3; return { o, s } })
  for (const s of [-1, 1]) { const p = perno(corpo, s * 0.07, -0.2, -0.1); p.rotation.x = 0.4; cono(p, 0.02, 0.1, pelo2, 0, -0.05, 0, 4).rotation.x = PI }
  // le ali: braccio, mano a quattro dita, membrana (come il pipistrello del bosco, più larghe)
  const membrana = (tri, colore) => {
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tri.flat()), 3)); geo.computeVertexNormals()
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: colore, side: THREE.DoubleSide, roughness: 0.75, flatShading: true, emissive: 0x1a0a24, emissiveIntensity: 0.5 }))
    m.castShadow = true; return m
  }
  const ali = [-1, 1].map(s => {
    const sp = perno(corpo, s * 0.17, 0.06, 0); sp.scale.set(s * 1.55, 1.55, 1.55)
    const E = [0.2, 0.12, 0.0], W = [0.36, 0.2, 0.02]
    arto(sp, [0, 0, 0], E, 0.028, 0.022, pelo, 6); arto(sp, E, W, 0.022, 0.018, pelo, 6)
    const polso = perno(sp, ...W)
    const F = [[0.34, 0.06, 0.1], [0.5, -0.12, 0.08], [0.42, -0.36, 0.02], [0.2, -0.44, -0.04]]
    for (const f of F) arto(polso, [0, 0, 0], f, 0.011, 0.007, M(0x2b2233), 4, false)
    cono(polso, 0.014, 0.1, dente, 0.04, 0.05, 0.05, 4)
    const B = [0.0, -0.28, -0.14], Bw = B.map((q, i) => q - W[i])
    sp.add(membrana([[0, 0, 0], W, B, [0, 0, 0], B, [0, -0.15, -0.12]], u.mem))
    polso.add(membrana([[0, 0, 0], F[0], F[1], [0, 0, 0], F[1], F[2], [0, 0, 0], F[2], F[3], [0, 0, 0], F[3], Bw], u.mem2))
    return { sp, polso, s }
  })
  g.scale.setScalar(u.k)
  const pose = (T, F) => {
    const { c, k } = F
    const fold = gesto(T, 7.5, 6.0, 1.6), raff = gesto(T, 7.5, 3.5, 1.2)
    const batti = onda(T, 8.5 - 3 * (c + k)), amp = 0.7 + 0.5 * raff
    corpo.position.set(0.05 * onda(T, 0.8), 0.82 + 0.05 * onda(T, 8.5, 1.1) + 0.04 * onda(T, 1.3) - 0.1 * fold + 0.28 * c - 0.38 * k, 0.04 * onda(T, 0.6) - 0.28 * c + 0.7 * k)
    corpo.rotation.set(-0.1 + 0.05 * onda(T, 8.5, 1.8) + 0.2 * fold - 0.5 * c + 0.75 * k, 0.15 * onda(T, 0.7) * (1 - c - k), 0.07 * onda(T, 0.8))
    ali.forEach(({ sp, polso }, i) => {
      const bat = batti * amp + 0.1
      sp.rotation.z = tra(bat * (1 - fold) - 0.7 * fold, 1.25, 0.05, c, k)
      polso.rotation.z = tra((onda(T, 8.5, -0.9) * 0.55 - 0.15) * (1 - fold) - 1.5 * fold, -0.1, -1.0, c, k)
    })
    orecchie.forEach(({ o, s }, i) => { o.rotation.set(-0.1 + 0.1 * onda(T, 5, i), 0, -s * (0.25 + 0.3 * k)) })
    bocca.apri(0.2 + 0.15 * Math.max(0, onda(T, 2.2)) + 0.8 * k * 0)
    iride.emissiveIntensity = 1.5 + 0.4 * onda(T, 2.6) + 3.0 * c + 2.2 * k
    const q = 0.001 + 0.5 * c + 1.5 * k * (1 - 0.3 * k); alone.scale.set(q, q, 0.5 * q)
  }
  return vivente(g, pose, { tipo: 'raggio', durata: 0.9, arrivo: 0.5, origine, proiettile: 'raggio' })
}

// il mesh generico per le geometrie che non sono in palude-base (il toro)
function mesh0 (padre, geo, mat, x, y, z) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; padre.add(m); return m }

// ═════════════════════════════════════ L'ELENCO ═════════════════════════════════════
export const MOSTRI_VARIE = [
  { chiave: 'pianta', nome: 'Pianta carnivora', zona: 'varie', luogo: 'bosco secco, gallerie (tana dei ragni)', taglia: 'media', forza: 5, ruolo: 'comune', crea: () => creaPianta(0) },
  { chiave: 'pianta-velenosa', nome: 'Pianta delle spore', zona: 'varie', luogo: 'bosco secco, gallerie', taglia: 'media', forza: 6, ruolo: 'comune', crea: () => creaPianta(1) },
  { chiave: 'piranha', nome: 'Piranha', zona: 'varie', luogo: 'sale allagate, palafitta', taglia: 'piccola', forza: 3, ruolo: 'comune', crea: () => creaPiranha(0) },
  { chiave: 'piranha-rosso', nome: 'Piranha rosso', zona: 'varie', luogo: 'sale allagate, palafitta', taglia: 'piccola', forza: 4, ruolo: 'comune', crea: () => creaPiranha(1) },
  { chiave: 'piranha-nero', nome: 'Piranha nero', zona: 'varie', luogo: 'sale allagate', taglia: 'media', forza: 5, ruolo: 'comune', crea: () => creaPiranha(2) },
  { chiave: 'golem-muschio', nome: 'Golem di muschio', zona: 'varie', luogo: 'colline di roccia (caporale)', taglia: 'grande', forza: 6, ruolo: 'forte', crea: () => creaGolemMuschio(0) },
  { chiave: 'golem-muschio-fiorito', nome: 'Golem di muschio fiorito', zona: 'varie', luogo: 'colline di roccia', taglia: 'grande', forza: 7, ruolo: 'forte', crea: () => creaGolemMuschio(1) },
  { chiave: 'golem-muschio-antico', nome: 'Golem di muschio antico', zona: 'varie', luogo: 'colline di roccia', taglia: 'grande', forza: 8, ruolo: 'forte', crea: () => creaGolemMuschio(2) },
  { chiave: 'scorpione', nome: 'Scorpione', zona: 'varie', luogo: 'colline di roccia, miniere di brace', taglia: 'media', forza: 4, ruolo: 'comune', crea: () => creaScorpione(0) },
  { chiave: 'scorpione-brace', nome: 'Scorpione di brace', zona: 'varie', luogo: 'miniere di brace', taglia: 'media', forza: 5, ruolo: 'comune', crea: () => creaScorpione(1) },
  { chiave: 'scorpione-regale', nome: 'Scorpione regale', zona: 'varie', luogo: 'miniere di brace', taglia: 'grande', forza: 6, ruolo: 'forte', crea: () => creaScorpione(2) },
  { chiave: 'mostro-viola', nome: 'Mostro viola', zona: 'varie', luogo: 'cantine', taglia: 'media', forza: 3, ruolo: 'comune', crea: () => creaMostroViola(0) },
  { chiave: 'mostro-viola-nero', nome: 'Mostro viola scuro', zona: 'varie', luogo: 'cantine', taglia: 'grande', forza: 5, ruolo: 'forte', crea: () => creaMostroViola(1) },
  { chiave: 'pipistrello-occhio', nome: 'Pipistrello occhio', zona: 'varie', luogo: 'corvi, corvaia, cantine', taglia: 'media', forza: 4, ruolo: 'comune', crea: () => creaPipistrelloOcchio(0) },
  { chiave: 'pipistrello-occhio-blu', nome: 'Pipistrello occhio gelido', zona: 'varie', luogo: 'corvaia, cantine', taglia: 'grande', forza: 5, ruolo: 'forte', crea: () => creaPipistrelloOcchio(1) }
]

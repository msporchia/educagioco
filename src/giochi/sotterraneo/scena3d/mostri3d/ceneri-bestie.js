// Generato da strumenti/promuovi-3d.mjs da poc/mostri-3d/ceneri-bestie.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Le bestie a quattro zampe della piana delle ceneri: il cane infernale, il lupo infernale (forte), la bestia cornuta (forte).
// Contratto di prati.js; gli attrezzi in ceneri-base.js.
import {
  THREE, M, mesh, sfera, rozza, scatola, cil, cono, perno, punta, PI, NERO, lucido, inizia, lum, fiamma, occhio, arto, zampa,
  ritmo, apertura, evento, marcatore, dichiara, vivo, onda, liscio,
} from './ceneri-base.js'

/** Un corno curvo che si assottiglia (tre archi di toro), per la testa di `s` = ±1: parte dal punto (0,0,0) del perno, esce di lato e sale. */
export function cornoCurvo (g, s, R, mat, tubo = 0.05, arco = 0.85, punta1 = true) {
  const c = perno(g, 0, 0, 0)
  const tratti = [[0, 0.4, 1], [0.4, 0.72, 0.74], [0.72, 1, 0.5]]
  for (const [a, b, k] of tratti) {
    const geo = new THREE.TorusGeometry(R, tubo * k, 6, 10, PI * arco * (b - a)); geo.rotateZ(-PI / 2 + PI * arco * a)
    const o = new THREE.Mesh(geo, mat); o.position.set(0, R, 0); o.castShadow = true; c.add(o)
  }
  const fin = PI * arco - PI / 2
  if (punta1) { const p = cono(c, tubo * 0.5, R * 0.45, mat, Math.cos(fin) * R, R + Math.sin(fin) * R, 0, 6); p.rotation.z = fin - PI / 2 + PI; p.position.add(new THREE.Vector3(-Math.sin(fin) * R * 0.18, Math.cos(fin) * R * 0.18, 0)) }
  c.scale.x = s; return c
}

// ═══════════════════════════ I CANI DELL'INFERNO ═══════════════════════════
const CANI = {
  cane: { pelo: 0x2a2428, scuro: 0x15110f, ventre: 0x4a2a22, lava: 0xff6a14, occhi: 0xffc43a, scala: 0.62, criniera: false, corna: false },
  lupo: { pelo: 0x4a4440, scuro: 0x1d1917, ventre: 0x6a3a2c, lava: 0xff8a1c, occhi: 0xff3a14, scala: 0.92, criniera: true, corna: true },
}
function costruisciCane (c) {
  const g = new THREE.Group(), corpo = perno(g, 0, 0, 0)
  const P = M(c.pelo), S = M(c.scuro), V = M(c.ventre), dente = M(0xf5ecd6), art = M(0x14100e), lava = () => lum(c.lava, 1.4)
  rozza(corpo, 0.27, P, 0, 0.62, 0.0, 0.7, 0.82, 1.6, 2)
  rozza(corpo, 0.25, P, 0, 0.66, 0.27, 0.9, 1.0, 0.95, 2)
  rozza(corpo, 0.2, V, 0, 0.5, 0.1, 0.62, 0.5, 1.9, 1)
  rozza(corpo, 0.22, P, 0, 0.62, -0.3, 0.82, 0.95, 0.95, 2)
  // le crepe di lava sui fianchi, le costole in rilievo e le placche di ossidiana sul dorso
  const lv = lava()
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { const cr = scatola(corpo, 0.012, 0.11 + (k % 2) * 0.05, 0.026, lv, s * (0.195 - k * 0.003), 0.58 - (k % 2) * 0.02, 0.28 - k * 0.12); cr.rotation.set(0, 0, s * 0.18); cr.castShadow = false }
  for (let i = 0; i < 8; i++) { const p = cono(corpo, 0.05 - i * 0.002, 0.14 + (i % 2) * 0.03, S, 0, 0.9 - Math.max(0, i - 3) * 0.04, 0.4 - i * 0.1, 5); p.rotation.x = -0.9 - i * 0.03 }
  for (let i = -2; i <= 2; i++) cono(corpo, 0.04, 0.14, V, i * 0.055, 0.56, 0.5 - Math.abs(i) * 0.03, 5).rotation.x = PI * 0.9
  const Z = []
  for (const s of [-1, 1]) {
    Z.push(zampa(corpo, s * 0.15, 0.55, 0.3, [0, -0.24, -0.04], [0, -0.28, 0.05], 0.065, P, S, art, { lungArt: 0.7 }))
    Z.push(zampa(corpo, s * 0.16, 0.55, -0.3, [0, -0.2, 0.16], [0, -0.31, -0.17], 0.07, P, S, art, { lungArt: 0.7 }))
    for (const z of Z.slice(-2)) fiamma(z.piede, 0, -0.04, 0.02, 0.08, 0.025, 0xff5a10, 0xffc840, s + 2)
  }
  const collo = perno(corpo, 0, 0, 0)
  arto(collo, [0, 0.74, 0.36], [0, 0.86, 0.6], 0.18, 0.14, P, 8)
  const criniere = []
  if (c.criniera) for (let i = 0; i < 6; i++) criniere.push(fiamma(collo, (i % 2 - 0.5) * 0.12, 0.88 - i * 0.02, 0.5 - i * 0.1, 0.34 - i * 0.02, 0.08, 0xff5a10, 0xffd060, i))
  const testa = perno(collo, 0, 0.87, 0.64); testa.rotation.x = 0.1; testa.scale.setScalar(1.18)
  rozza(testa, 0.13, P, 0, 0, 0, 1.0, 0.95, 1.1, 2)
  rozza(testa, 0.08, S, 0, -0.04, 0.17, 0.9, 0.8, 1.9, 1)
  sfera(testa, 0.032, M(0x0d0b0b), 0, 0.0, 0.34, 1.1, 0.8, 0.9, 8)
  for (let i = 0; i < 3; i++) scatola(testa, 0.012, 0.06, 0.02, lava(), 0, 0.09 - i * 0.015, 0.1 + i * 0.07).castShadow = false                    // il cranio screpolato di brace
  const orecchie = []
  for (const s of [-1, 1]) {
    const o = perno(testa, s * 0.085, 0.12, -0.03); o.rotation.set(-0.2, 0, s * -0.28); orecchie.push(o)
    cono(o, 0.052, 0.18, P, 0, 0.09, 0, 5); cono(o, 0.03, 0.12, V, 0, 0.07, 0.025, 4)
    occhio(testa, s * 0.07, 0.04, 0.105, 0.03, c.occhi, { emis: 1.6, giro: s * 0.55, fessura: true })
    scatola(testa, 0.06, 0.014, 0.02, S, s * 0.07, 0.08, 0.115).rotation.z = s * -0.45
    if (c.corna) { const h = perno(testa, s * 0.1, 0.1, -0.02); h.rotation.set(0.4, s * -0.2, 0); h.add(cornoCurvo(h, s, 0.14, M(0x15110f), 0.034, 0.7)) }
  }
  const mascella = perno(testa, 0, -0.07, 0.07)
  rozza(mascella, 0.055, V, 0, -0.01, 0.1, 0.85, 0.4, 1.9, 1)
  const gola = sfera(mascella, 0.045, lum(0xff5a14, 1.0), 0, 0.012, 0.1, 0.9, 0.3, 1.8, 6); gola.castShadow = false
  for (const s of [-1, 1]) { cono(testa, 0.012, 0.055, dente, s * 0.035, -0.075, 0.29, 4).rotation.x = PI; cono(mascella, 0.011, 0.04, dente, s * 0.03, 0.03, 0.17, 4) }
  const coda = []; let padre = perno(corpo, 0, 0.64, -0.42)
  for (let i = 0; i < 6; i++) { const sg = perno(padre, 0, 0, i ? -0.11 : 0); coda.push(sg); const r = [0.05, 0.06, 0.06, 0.055, 0.045, 0.035][i]; rozza(sg, r, i % 2 ? S : P, 0, 0, -0.05, 1, 1, 1.5, 1); padre = sg }
  fiamma(padre, 0, 0, -0.12, 0.3, 0.07, 0xff5a10, 0xffd060, 5).rotation.x = -PI / 2
  const origine = marcatore(testa, 0, -0.02, 0.4)
  g.scale.setScalar(c.scala)
  return { g, corpo, collo, testa, mascella, orecchie, coda, Z, origine, criniere }
}
function animaCane (X) {
  const { g, corpo, collo, testa, mascella, orecchie, coda, Z } = X
  vivo(g, T => {
    const r = onda(T, 3.4), b = onda(T, 7.2), sw = onda(T, 0.9)
    const sn = evento(T, 6.5, 1.6, 6.3).b, rg = evento(T, 7.7, 1.4, 4.2).b, sc = evento(T, 11.3, 0.9, 7.4).b, pz = evento(T, 9.1, 0.9, 2.3).b
    corpo.scale.set(1 + r * 0.014, 1 + r * 0.03, 1 + r * 0.014)
    corpo.position.set(sw * 0.012, b * 0.01 + r * 0.004, 0)
    corpo.rotation.set(sn * 0.06 + onda(T, 1.4) * 0.012, onda(T, 38) * 0.05 * sc, sw * 0.022 + onda(T, 31) * 0.05 * sc)
    collo.rotation.set(sn * 0.35 + rg * 0.12, onda(T, 0.6) * 0.1, 0)
    testa.rotation.set(0.1 + onda(T, 0.9) * 0.05 + sn * 0.3 + onda(T, 21) * 0.06 * sn + rg * 0.12, onda(T, 0.55) * 0.34 + onda(T, 1.4) * 0.07, onda(T, 0.7) * 0.05)
    mascella.rotation.x = 0.04 + onda(T, 2.6) * 0.012 + rg * 0.34 + onda(T, 40) * 0.02 * rg
    orecchie.forEach((o, i) => { const sg = i ? 1 : -1, fl = evento(T, 3.1 + i * 1.3, 0.25, 0.4 + i).b; o.rotation.z = sg * (-0.28 + fl * 0.35 + rg * 0.2); o.rotation.x = -0.2 - rg * 0.25 - sn * 0.1 })
    coda.forEach((sg, i) => { sg.rotation.y = onda(T, 2.6, -i * 0.6) * (0.1 + i * 0.05) * (1 + sn * 0.3); sg.rotation.x = -0.15 + onda(T, 1.7, -i * 0.4) * 0.06 })
    Z.forEach((z, i) => { z.anca.rotation.set(onda(T, 0.9, i * 1.7) * 0.02 + (i % 2 ? 1 : -1) * sw * 0.012, 0, 0); z.gin.rotation.x = 0 })
    Z[2].anca.rotation.x += -pz * 0.5; Z[2].gin.rotation.x = -pz * 0.7
    X.criniere?.forEach(f => { f.userData.base = Math.sin(T * 2) * 0.05 })
  })
  const { origine } = X
  dichiara(g, 'morso', 0.7, 0.55)
  g.userData.attacca = p => {
    const { s, W, L } = ritmo(p, 0.55)
    corpo.position.y += -W * 0.1; corpo.position.z += -W * 0.16 + L * 0.5; corpo.rotation.x += W * 0.1 + L * 0.2
    collo.rotation.x += W * 0.1 + L * 0.2; testa.rotation.x += W * 0.15 + L * 0.35; mascella.rotation.x += apertura(p, 0.55) * 0.85
    Z.forEach((z, i) => {
      if (i % 2 === 0) { z.anca.rotation.x += W * 0.45 + L * -0.85; z.gin.rotation.x += -W * 0.5 + L * -0.35 }
      else { z.anca.rotation.x += W * -0.55 + L * 0.75; z.gin.rotation.x += W * 0.6 + L * 0.45 }
    })
    coda.forEach(sg => { sg.rotation.x += -W * 0.3 + L * 0.12 })
  }
  return g
}
export function creaCaneInfernale () { inizia(); return animaCane(costruisciCane(CANI.cane)) }
export function creaLupoInfernale () { inizia(); return animaCane(costruisciCane(CANI.lupo)) }

// ═══════════════════════════ LA BESTIA CORNUTA ═══════════════════════════
export function creaBestiaCornuta () {
  inizia()
  const pelle = M(0x5a2e24), scuro = M(0x2a1612), ventre = M(0x7a4636), zoc = M(0x15100e), osso = M(0xd8caa4), lava = () => lum(0xff6a14, 1.4)
  const g = new THREE.Group(), corpo = perno(g, 0, 0, 0)
  rozza(corpo, 0.36, pelle, 0, 0.74, 0.05, 0.92, 0.95, 1.4, 2)
  rozza(corpo, 0.34, pelle, 0, 0.86, 0.36, 1.1, 1.05, 1.0, 2)                              // la gobba delle spalle
  rozza(corpo, 0.31, pelle, 0, 0.7, -0.42, 0.95, 0.95, 1.0, 2)
  rozza(corpo, 0.28, ventre, 0, 0.5, 0.0, 0.8, 0.5, 2.0, 1)
  const lv = lava()
  for (let i = 0; i < 7; i++) { const c = scatola(corpo, 0.03, 0.015, 0.16 - (i % 2) * 0.05, lv, (i % 3 - 1) * 0.14, 1.08 - Math.abs(i - 3) * 0.02 - (i > 4 ? 0.1 : 0), 0.45 - i * 0.14); c.rotation.y = (i % 3 - 1) * 0.4; c.castShadow = false }     // crepe di magma sul dorso
  for (let i = 0; i < 6; i++) cono(corpo, 0.06 - i * 0.004, 0.18, scuro, (i % 2 - 0.5) * 0.14, 1.12 - Math.max(0, i - 2) * 0.05, 0.45 - i * 0.14, 5).rotation.x = -0.4
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) cono(corpo, 0.045, 0.16, scuro, s * 0.34, 0.8 - k * 0.05, 0.1 - k * 0.2, 5).rotation.set(0, 0, s * -1.3)   // il pelo ispido ai fianchi
  const Z = []
  for (const s of [-1, 1]) {
    Z.push(zampa(corpo, s * 0.25, 0.64, 0.38, [0, -0.3, -0.02], [0, -0.32, 0.04], 0.1, pelle, zoc, zoc, { dita: 2, lungArt: 0.35 }))
    Z.push(zampa(corpo, s * 0.25, 0.64, -0.42, [0, -0.24, 0.14], [0, -0.38, -0.12], 0.105, pelle, zoc, zoc, { dita: 2, lungArt: 0.35 }))
  }
  const collo = perno(corpo, 0, 0.78, 0.6), testa = perno(collo, 0, -0.05, 0.22)
  arto(collo, [0, 0.06, -0.2], [0, -0.04, 0.1], 0.26, 0.2, pelle, 9, false)
  rozza(testa, 0.21, pelle, 0, 0, 0, 1.0, 1.0, 1.15, 2)
  rozza(testa, 0.14, ventre, 0, -0.1, 0.22, 1.0, 0.8, 1.3, 1)
  for (const s of [-1, 1]) {
    sfera(testa, 0.035, M(0x0d0b0b), s * 0.055, -0.1, 0.4, 1, 1.2, 0.8, 7)
    const fn = lum(0xff7a20, 0.8, { transparent: true, opacity: 0.75, depthWrite: false })
    occhio(testa, s * 0.115, 0.07, 0.15, 0.04, 0xff4a14, { emis: 1.8, giro: s * 0.55, fessura: true })
    scatola(testa, 0.1, 0.022, 0.03, scuro, s * 0.11, 0.135, 0.15).rotation.z = s * -0.35
    const o = perno(testa, s * 0.2, 0.03, -0.04); o.rotation.set(0.1, 0, s * -0.4); cono(o, 0.05, 0.14, pelle, s * 0.05, 0, 0, 5).rotation.z = s * -1.3
    const h = perno(testa, s * 0.15, 0.13, 0.02); h.rotation.set(-0.5, s * 0.5, 0); h.add(cornoCurvo(h, s, 0.3, osso, 0.075, 0.9))
  }
  const anello = mesh(testa, new THREE.TorusGeometry(0.06, 0.012, 6, 14), lum(0xffa030, 1.6), 0, -0.19, 0.39); anello.rotation.x = 0.3
  const mascella = perno(testa, 0, -0.17, 0.2); sfera(mascella, 0.09, ventre, 0, -0.01, 0.1, 0.9, 0.4, 1.3, 8)
  for (const s of [-1, 1]) cono(mascella, 0.014, 0.07, osso, s * 0.06, 0.02, 0.2, 4)
  const fumo = []
  for (let i = 0; i < 4; i++) { const f = sfera(g, 0.06, M(0x8a8680, { flatShading: false, transparent: true, opacity: 0.4, depthWrite: false }), 0, 0, 0, 1, 1, 1, 7); f.castShadow = false; fumo.push(f) }
  const coda = []; let padre = perno(corpo, 0, 0.92, -0.62)
  for (let i = 0; i < 4; i++) { const sg = perno(padre, 0, 0, i ? -0.12 : 0); coda.push(sg); rozza(sg, 0.045 - i * 0.006, pelle, 0, -0.02, -0.05, 1, 1, 1.5, 1); padre = sg }
  fiamma(padre, 0, -0.03, -0.1, 0.36, 0.09, 0xff5a10, 0xffd060, 3).rotation.x = -PI / 2
  const origine = marcatore(testa, 0, 0, 0.6)
  g.scale.setScalar(0.86)
  vivo(g, T => {
    const r = onda(T, 2.6), sw = onda(T, 0.8)
    const sbuffo = evento(T, 5.4, 1.4, 1), raspa = evento(T, 8.3, 1.8, 4), scuoti = evento(T, 11.2, 1.3, 7)
    corpo.scale.set(1 + r * 0.01, 1 + r * 0.025, 1 + r * 0.01)
    corpo.position.set(sw * 0.012, raspa.b * -0.02, 0); corpo.rotation.set(raspa.b * 0.07 + onda(T, 1.2) * 0.012, 0, sw * 0.02)
    collo.rotation.set(0.12 + raspa.b * 0.28 + scuoti.b * -0.2, onda(T, 0.5) * 0.12, 0)
    testa.rotation.set(0.1 + onda(T, 0.9) * 0.04 + raspa.b * 0.22 - scuoti.b * 0.5 + sbuffo.b * 0.15, onda(T, 0.55) * 0.32 + scuoti.b * Math.sin(T * 20) * 0.25, onda(T, 0.7) * 0.04)
    mascella.rotation.x = 0.04 + onda(T, 2.3) * 0.02 + sbuffo.b * 0.2
    Z.forEach((z, i) => { z.anca.rotation.set(onda(T, 0.8, i * 1.4) * 0.02, 0, 0); z.gin.rotation.x = 0 })
    Z[0].anca.rotation.x += -raspa.b * 0.55 * (0.6 + 0.4 * Math.sin(raspa.u * PI * 6)); Z[0].gin.rotation.x = -raspa.b * 0.6
    coda.forEach((sg, i) => { sg.rotation.y = onda(T, 2.0, -i * 0.7) * (0.2 + i * 0.1); sg.rotation.x = 0.35 + onda(T, 1.5, -i * 0.5) * 0.08 })
    fumo.forEach((f, i) => { const u = ((T * 0.8 + i / 4) % 1), a = sbuffo.b; f.position.set((i % 2 ? 1 : -1) * 0.09 * 0.86, 0.5 + u * 0.35 + 0.0, 1.55); f.position.y = 0.62 + u * 0.3 - 0.12; f.scale.setScalar(a * (0.4 + u * 1.3)) })
  })
  dichiara(g, 'carica-di-corna', 0.85, 0.55)
  g.userData.attacca = p => {                                                                    // abbassa la testa, raspa e carica in avanti con le corna basse
    const { s, W, L } = ritmo(p, 0.55)
    corpo.position.z += -W * 0.12 + L * 0.7; corpo.position.y += -W * 0.08 + Math.abs(Math.sin(L * PI * 3)) * 0.04 * L; corpo.rotation.x += W * 0.1 - L * 0.1
    collo.rotation.x += W * -0.1 + L * 0.35; testa.rotation.x += W * -0.3 + L * 0.55; mascella.rotation.x += apertura(p, 0.55) * 0.5
    Z.forEach((z, i) => { const dir = i % 2 ? 1 : -1; z.anca.rotation.x += W * 0.4 * -dir + L * 0.6 * dir; z.gin.rotation.x += W * 0.4 + L * -0.3 * dir })
    coda.forEach(sg => { sg.rotation.x += -W * 0.2 + L * 0.3 })
  }
  return g
}

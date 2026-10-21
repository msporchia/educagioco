// Prototipo: i mostri della piana delle ceneri («La piana delle ceneri», livelli 9–11; luoghi ceneri, ossa, colline; dungeon labirinto e
// fornace) come modelli 3D in codice. Stesso contratto di prati.js. Qui i piccoli e i medi (diavoletti, spiriti, morti bruciati, vermi);
// le bestie stanno in ceneri-bestie.js, i boss in ceneri-grandi.js. `MOSTRI_CENERI` è l'elenco di tutti.
import {
  THREE, M, sfera, rozza, scatola, cil, cono, perno, punta, PI, NERO, lucido, inizia, lum, fiamma, occhio, arto, ritmo, apertura, evento,
  marcatore, dichiara, vivo, onda, liscio,
} from './ceneri-base.js'
import { creaScheletro } from './mostri.js'
import { creaCaneInfernale, creaLupoInfernale, creaBestiaCornuta } from './ceneri-bestie.js'
import { creaFabbroNonMorto, creaGolemMagma, creaMietitore, creaMinotauro, creaDragoDiLava } from './ceneri-grandi.js'

/** Una membrana piatta (ala di pipistrello, mantello) da una lista di punti [x, y] nel piano xz (y positivo = indietro). */
export function membrana (g, pts, mat) {
  const sh = new THREE.Shape(); pts.forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y))
  const geo = new THREE.ShapeGeometry(sh); geo.rotateX(-PI / 2)
  const o = new THREE.Mesh(geo, mat); o.castShadow = true; g.add(o); return o
}

// ══════════════════════════════════════ IL DIAVOLETTO ══════════════════════════════════════
export function creaDiavoletto (variante = 0) {
  inizia()
  const pelle = [0xc8342a, 0x5a3a78][variante], ventre = [0xf0a05a, 0xb08ad0][variante], scuro = [0x6e1a18, 0x2a1840][variante], corno = [0x2a1612, 0xe6dcc0][variante]
  const g = new THREE.Group(), mp = M(pelle), mv = M(ventre), ms = M(scuro), mc = M(corno), dente = M(0xf5ecd6), ala = M(scuro, { side: THREE.DoubleSide, roughness: 0.6 })
  const corpo = perno(g, 0, 0.27, 0)
  sfera(corpo, 0.5, mp, 0, 0.12, 0, 0.36, 0.44, 0.3, 12); sfera(corpo, 0.5, mv, 0, 0.09, 0.06, 0.25, 0.34, 0.2, 10)
  const gambe = [-1, 1].map(s => {
    const an = perno(corpo, s * 0.06, 0, 0)
    arto(an, [0, 0, 0], [s * 0.01, -0.12, 0.04], 0.04, 0.032, mp, 7)
    const gi = perno(an, s * 0.01, -0.12, 0.04); arto(gi, [0, 0, 0], [0, -0.12, -0.04], 0.032, 0.026, mp, 7)
    const pi = perno(gi, 0, -0.12, -0.04); sfera(pi, 0.04, ms, 0, -0.005, 0.045, 1, 0.55, 1.5, 8)
    for (const k of [-1, 1]) cono(pi, 0.014, 0.05, ms, k * 0.016, -0.015, 0.1, 4).rotation.x = PI / 2
    return { an, gi }
  })
  const testa = perno(corpo, 0, 0.36, 0.02)
  sfera(testa, 0.115, mp, 0, 0, 0, 1.05, 0.95, 1, 14); sfera(testa, 0.065, mv, 0, -0.04, 0.085, 1.1, 0.8, 0.9, 10)
  sfera(testa, 0.016, ms, 0, -0.02, 0.145, 1, 0.8, 0.7, 6)
  const occhi = [-1, 1].map(s => { scatola(testa, 0.07, 0.016, 0.02, ms, s * 0.058, 0.082, 0.105).rotation.z = s * -0.4; return occhio(testa, s * 0.052, 0.035, 0.095, 0.03, 0xffe040, { emis: 1.5, fessura: true, giro: s * 0.4 }) })
  const orecchie = [-1, 1].map(s => { const o = perno(testa, s * 0.11, 0.02, -0.01); cono(o, 0.036, 0.14, mp, s * 0.06, 0.0, 0, 4).rotation.z = s * -1.35; return o })
  for (const s of [-1, 1]) { punta(testa, [s * 0.06, 0.09, 0.0], [s * 0.1, 0.2, 0.05], 0.034, mc, 6); punta(testa, [s * 0.1, 0.2, 0.05], [s * 0.07, 0.27, 0.1], 0.02, mc, 5) }
  const mascella = perno(testa, 0, -0.075, 0.055)
  sfera(mascella, 0.045, M(0x2a0c0c), 0, 0.012, 0.03, 1.4, 0.4, 1.0, 8); sfera(mascella, 0.04, mv, 0, -0.012, 0.045, 1.2, 0.5, 1.1, 8)
  for (const x of [-0.04, 0.04]) cono(mascella, 0.011, 0.04, dente, x, 0.025, 0.08, 4)
  cono(mascella, 0.02, 0.07, ms, 0, -0.03, 0.08, 4).rotation.x = PI * 0.6                       // il pizzetto
  const braccia = [-1, 1].map(s => {
    const sp = perno(corpo, s * 0.17, 0.2, 0); arto(sp, [0, 0, 0], [s * 0.01, -0.1, 0.03], 0.034, 0.028, mp, 7)
    const go = perno(sp, s * 0.01, -0.1, 0.03); arto(go, [0, 0, 0], [0, -0.1, 0.02], 0.028, 0.024, mp, 7)
    const ma = perno(go, 0, -0.105, 0.02); sfera(ma, 0.035, mp, 0, 0, 0, 1, 1, 1, 8)
    for (const k of [-1, 0, 1]) cono(ma, 0.008, 0.04, ms, k * 0.016, -0.03, 0.02, 4)
    return { sp, go, ma }
  })
  // il tridente nella destra: l'asta lungo +z della mano (puntata in avanti), tre denti con la punta che brilla
  const lancia = perno(braccia[1].ma, 0, 0, 0); lancia.rotation.x = PI / 2 + 0.2
  cil(lancia, 0.014, 0.014, 0.62, M(0x4a3226), 0, 0.12, 0, 6)
  cil(lancia, 0.02, 0.02, 0.05, M(0x1a1612), 0, 0.42, 0, 6)
  for (const k of [-1, 0, 1]) { const d = cono(lancia, 0.014, k ? 0.12 : 0.16, lum(0xff7a20, 0.9), k * 0.045, 0.52 + (k ? 0 : 0.02), 0, 5); if (k) punta(lancia, [0, 0.43, 0], [k * 0.045, 0.5, 0], 0.01, M(0x1a1612), 4) }
  // le ali: ossa e membrana a mezzaluna, che battono
  const ali = [-1, 1].map(s => {
    const a = perno(corpo, s * 0.05, 0.28, -0.1)
    const pts = [[0, 0], [0.14, -0.04], [0.3, -0.13], [0.42, -0.04], [0.37, 0.1], [0.3, 0.05], [0.25, 0.21], [0.16, 0.09], [0.1, 0.22], [0, 0.12]].map(([x, y]) => [x * s, y])
    membrana(a, pts, ala).position.y = 0
    arto(a, [0, 0, 0], [s * 0.3, 0.0, -0.13], 0.014, 0.01, ms, 5, false); arto(a, [s * 0.3, 0, -0.13], [s * 0.42, 0, -0.04], 0.01, 0.007, ms, 5, false)
    arto(a, [s * 0.3, 0, -0.13], [s * 0.25, 0, 0.21], 0.008, 0.006, ms, 4, false); arto(a, [s * 0.3, 0, -0.13], [s * 0.1, 0, 0.22], 0.008, 0.006, ms, 4, false)
    return a
  })
  // la coda a freccia
  const coda = []; let padre = perno(corpo, 0, 0.03, -0.12)
  for (let i = 0; i < 5; i++) { const sg = perno(padre, 0, 0, i ? -0.09 : 0); coda.push(sg); sfera(sg, 0.03 - i * 0.003, mp, 0, 0, -0.045, 1, 1, 1.5, 7); padre = sg }
  const punta1 = perno(padre, 0, 0, -0.1); const freccia = cono(punta1, 0.06, 0.13, mp, 0, 0, 0, 3); freccia.rotation.x = -PI / 2; freccia.scale.x = 0.35
  const fumo = lum(0xff7a20, 0.8); sfera(punta1, 0.015, fumo, 0, 0, -0.14, 1, 1, 1, 6)
  vivo(g, T => {
    const r = onda(T, 3.1), saltello = Math.abs(Math.sin(T * PI * 1.25)), ev = evento(T, 5.6, 1.4)
    corpo.position.y = 0.27 + saltello * 0.03 + r * 0.004; corpo.rotation.set(0.06 + r * 0.02 - ev.b * 0.1, Math.sin(T * 0.8) * 0.1, Math.sin(T * 1.25) * 0.06)
    testa.rotation.set(0.05 + Math.sin(T * 1.9) * 0.05 + ev.b * 0.2, Math.sin(T * 0.7) * 0.4, Math.sin(T * 1.3) * 0.08 + ev.b * Math.sin(T * 14) * 0.08)
    mascella.rotation.x = 0.1 + Math.max(0, Math.sin(T * 2.4)) * 0.12 + ev.b * (0.25 + 0.25 * Math.sin(T * 24))      // ogni tanto ridacchia
    orecchie.forEach((o, i) => { o.rotation.z = (i ? 1 : -1) * Math.max(0, Math.sin(T * 1.7 + i)) * 0.15; o.rotation.x = ev.b * -0.2 })
    gambe.forEach(({ an, gi }, i) => { an.rotation.x = Math.sin(T * 1.3 + i * PI) * 0.06 - (saltello > 0.4 ? 0.1 : 0); gi.rotation.x = 0.1 + saltello * 0.18 })
    braccia[0].sp.rotation.set(-0.3 + Math.sin(T * 1.6) * 0.08, 0, -0.35); braccia[0].go.rotation.x = -0.7
    braccia[1].sp.rotation.set(-0.7 + Math.sin(T * 1.6 + 1) * 0.06 + ev.b * 0.5 * Math.sin(T * 9), 0, 0.3); braccia[1].go.rotation.x = -0.5
    ali.forEach((a, i) => { const s = i ? 1 : -1, bat = Math.sin(T * 9 + 0.5) * 0.28 + 0.15 + ev.b * 0.2; a.rotation.set(0.15, s * -0.35, s * (-0.35 - bat)) })
    coda.forEach((sg, i) => { sg.rotation.y = Math.sin(T * 2.8 - i * 0.7) * (0.12 + i * 0.05); sg.rotation.x = 0.18 + Math.sin(T * 1.9 - i * 0.5) * 0.06 })
    g.position.z = 0
  })
  dichiara(g, 'affondo', 0.65, 0.5)                                                              // arretra il tridente e lo infila in avanti
  g.userData.attacca = p => {
    const { s, W, L } = ritmo(p, 0.5)
    braccia[1].sp.rotation.x += -s * 0.9 - 0.2 * L; braccia[1].go.rotation.x += W * 0.5 - L * 0.4
    corpo.rotation.x += -W * 0.15 + L * 0.3; corpo.position.y += -W * 0.03; g.position.z += L * 0.26
    testa.rotation.x += L * 0.15; mascella.rotation.x += apertura(p, 0.5) * 0.5
    ali.forEach((a, i) => { a.rotation.z += (i ? -1 : 1) * W * 0.5 })
    coda.forEach(sg => { sg.rotation.x += -L * 0.2 })
  }
  return g
}

// ══════════════════════════════════════ LO SPIRITO DI FUOCO ══════════════════════════════════════
export function creaSpiritoFuoco (variante = 0) {
  inizia()
  const c1 = [0xff5a10, 0x2a8cff][variante], c2 = [0xffc840, 0xbfeaff][variante], nucleoC = [0xff8a1c, 0x4aa8ff][variante]
  const g = new THREE.Group(), corpo = perno(g, 0, 0.5, 0)
  const nucleo = sfera(corpo, 0.5, lum(nucleoC, 1.3), 0, 0, 0, 0.5, 0.64, 0.46, 14); nucleo.castShadow = false
  sfera(corpo, 0.5, lum(c2, 1.5), 0, -0.02, 0.08, 0.32, 0.42, 0.3, 12).castShadow = false
  // la veste di lingue di fuoco tutto intorno, la coda sotto che si assottiglia
  const lingue = []
  for (let i = 0; i < 7; i++) { const a = PI * 0.55 + i / 6 * PI * 0.9, f = fiamma(corpo, Math.sin(a) * 0.19, 0.12, Math.cos(a) * 0.17, 0.2 + (i % 3) * 0.06, 0.08, c1, c2, i * 0.9); f.rotation.x = Math.cos(a) * 0.35; f.rotation.y = 0; lingue.push(f) }
  const cresta = fiamma(corpo, 0, 0.3, -0.02, 0.3, 0.1, c1, c2, 0.4)
  const coda = []
  for (let i = 0; i < 4; i++) { const sg = perno(corpo, 0, -0.26 - i * 0.14, 0); coda.push(sg); sfera(sg, 0.15 - i * 0.03, lum(i % 2 ? c1 : nucleoC, 1.1), 0, 0, 0, 1, 1.2, 1, 8).castShadow = false }
  // la faccia: occhi caldi e storti, bocca come un taglio nero
  const occhi = [-1, 1].map(s => {
    scatola(corpo, 0.12, 0.028, 0.03, M(0x3a0e00), s * 0.1, 0.17, 0.2).rotation.z = s * -0.45
    return occhio(corpo, s * 0.09, 0.09, 0.22, 0.045, 0xffffff, { emis: 1.8, fessura: false, giro: s * 0.4, pupilla: 0x7a1c00 })
  })
  const bocca = perno(corpo, 0, -0.06, 0.24); sfera(bocca, 0.07, M(0x2a0a00, { flatShading: false }), 0, 0, 0, 1.3, 0.55, 0.4, 8)
  // le mani di fuoco
  const mani = [-1, 1].map(s => {
    const sp = perno(corpo, s * 0.27, 0.02, 0.0); arto(sp, [0, 0, 0], [s * 0.1, -0.12, 0.06], 0.05, 0.036, lum(nucleoC, 1.2), 7, false)
    const ma = perno(sp, s * 0.1, -0.12, 0.06); sfera(ma, 0.07, lum(c2, 1.4), 0, 0, 0, 1, 1, 1, 8)
    for (let k = -1; k <= 1; k++) { const f = fiamma(ma, k * 0.04, 0.03, 0, 0.14, 0.03, c1, c2, k); f.userData.base = k * 0.3 }
    return { sp, ma }
  })
  const origine = marcatore(corpo, 0, -0.02, 0.5)
  const palla = perno(origine, 0, 0, 0); sfera(palla, 0.13, lum(c2, 2.0), 0, 0, 0, 1, 1, 1, 10); sfera(palla, 0.18, lum(c1, 1.0, { transparent: true, opacity: 0.55, depthWrite: false }), 0, 0, 0, 1, 1, 1, 10)
  palla.scale.setScalar(0)
  const scintille = []
  for (let i = 0; i < 6; i++) { const s = scatola(g, 0.03, 0.03, 0.03, lum(c2, 2), 0, 0, 0); s.castShadow = false; scintille.push(s) }
  vivo(g, T => {
    const r = onda(T, 2.4), ev = evento(T, 5.3, 1.6, 1)
    corpo.position.set(Math.sin(T * 0.9) * 0.05, 0.5 + onda(T, 1.5) * 0.07 + r * 0.01, Math.sin(T * 0.7) * 0.03)
    corpo.scale.set(1 + r * 0.04 + ev.b * 0.12, 1 - r * 0.03 + ev.b * 0.2, 1 + r * 0.04 + ev.b * 0.12)
    corpo.rotation.set(0.05, Math.sin(T * 0.6) * 0.35, Math.sin(T * 1.1) * 0.08)
    coda.forEach((sg, i) => { sg.position.x = Math.sin(T * 2.6 - i * 0.9) * 0.05 * (i + 1); sg.position.z = -Math.cos(T * 2.0 - i * 0.7) * 0.03 * (i + 1) })
    mani.forEach((m, i) => { const s = i ? 1 : -1; m.sp.rotation.set(-0.2 + Math.sin(T * 1.4 + i * 2) * 0.12 - ev.b * 0.7, 0, s * (0.25 + Math.sin(T * 1.7 + i) * 0.1)) })
    bocca.scale.set(1 + ev.b * 0.4, 1 + ev.b * 1.6, 1)
    scintille.forEach((s, i) => { const u = ((T * 0.45 + i / 6) % 1); s.position.set(Math.sin(i * 2.4 + T) * (0.3 + u * 0.1), 0.2 + u * 0.9, Math.cos(i * 2.4 + T) * 0.25); s.scale.setScalar(1 - u); s.rotation.set(T * 3 + i, T * 2, 0) })
  })
  dichiara(g, 'palla-di-fuoco', 0.8, 0.55, { tipo: 'fuoco', origine })                          // riunisce le mani, gonfia una sfera e la scaglia
  g.userData.attacca = p => {
    const { s, W, L } = ritmo(p, 0.55)
    mani.forEach((m, i) => { const sg = i ? 1 : -1; m.sp.rotation.x += -W * 0.7 - L * 0.9; m.sp.rotation.z += -sg * (W * 0.4 + L * 0.35) })
    corpo.position.z += -W * 0.08 + L * 0.2; corpo.rotation.x += -W * 0.2 + L * 0.3
    corpo.scale.y *= 1 + W * 0.1; bocca.scale.y += L * 1.5
    palla.scale.setScalar((liscio(0, 0.5, p) * (1 - liscio(0.56, 0.62, p))) * (1 + 0.1 * Math.sin(p * 60)))
  }
  return g
}

// ══════════════════════════════════════ IL TESCHIO AZZURRO ══════════════════════════════════════
export function creaTeschioAzzurro (variante = 0) {
  inizia()
  const osso1 = M([0xdfe9f2, 0xe8e0c8][variante]), ombra = M([0x9fb4c8, 0xb8a784][variante]), buio = M(0x0a1220, { roughness: 1 })
  const luceC = [0x2a8cff, 0x6dff9a][variante], luce2 = [0xbfeaff, 0xdfffe8][variante]
  const g = new THREE.Group(), corpo = perno(g, 0, 0.55, 0)
  rozza(corpo, 0.2, osso1, 0, 0.03, 0, 1.0, 1.0, 1.08, 2)
  sfera(corpo, 0.12, osso1, 0, -0.1, 0.09, 1.3, 0.8, 1.0, 12)
  const occhi = [-1, 1].map(s => {
    sfera(corpo, 0.075, buio, s * 0.085, 0.0, 0.16, 1, 1.15, 0.8, 10)
    const o = perno(corpo, s * 0.085, 0.0, 0.2); o.userData.occhio = true
    sfera(o, 0.04, lum(luce2, 2.2), 0, 0, 0, 1, 1.2, 0.6, 8).castShadow = false
    fiamma(corpo, s * 0.085, 0.05, 0.18, 0.14, 0.04, luceC, luce2, s)
    scatola(corpo, 0.09, 0.02, 0.02, ombra, s * 0.09, 0.1, 0.18).rotation.z = s * -0.35
    return o
  })
  cono(corpo, 0.035, 0.07, buio, 0, -0.06, 0.2, 3).rotation.set(PI, PI / 2, 0)
  for (let i = -3; i <= 3; i++) scatola(corpo, 0.027, 0.05, 0.022, M(0xf4f0e0), i * 0.03, -0.155, 0.17 - Math.abs(i) * 0.016)
  const mascella = perno(corpo, 0, -0.16, 0.06)
  scatola(mascella, 0.2, 0.04, 0.17, osso1, 0, -0.02, 0.07)
  for (let i = -3; i <= 3; i++) scatola(mascella, 0.025, 0.045, 0.02, M(0xf4f0e0), i * 0.03, 0.02, 0.15 - Math.abs(i) * 0.015)
  for (const s of [-1, 1]) scatola(mascella, 0.025, 0.1, 0.04, osso1, s * 0.1, 0.03, 0.0).rotation.z = s * 0.3
  // incrinature e un pezzo mancante
  for (const [x, y, r] of [[0.1, 0.14, 0.7], [-0.04, 0.2, -0.4]]) scatola(corpo, 0.1, 0.012, 0.02, buio, x, y, 0.15).rotation.z = r
  // la fiamma azzurra che incorona il cranio e i fili di spirito sotto
  const corona = []
  for (let i = 0; i < 5; i++) corona.push(fiamma(corpo, (i - 2) * 0.07, 0.19 - Math.abs(i - 2) * 0.03, -0.02 - Math.abs(i - 2) * 0.01, 0.12 + (i === 2 ? 0.08 : 0), 0.05, luceC, luce2, i))
  const code = []
  for (let i = 0; i < 3; i++) { const q = perno(corpo, (i - 1) * 0.1, -0.22, -0.05); code.push(q); for (let k = 0; k < 4; k++) sfera(q, 0.05 - k * 0.011, lum(luceC, 1.0 - k * 0.15, { transparent: true, opacity: 0.8 - k * 0.15, depthWrite: false }), 0, -k * 0.08, 0, 1, 1.3, 1, 7).castShadow = false }
  vivo(g, T => {
    const ev = evento(T, 5.0, 1.5), r = onda(T, 2.2)
    corpo.position.set(Math.sin(T * 0.8) * 0.06, 0.55 + onda(T, 1.6) * 0.06 + r * 0.01, Math.sin(T * 0.6) * 0.04)
    corpo.rotation.set(0.05 + Math.sin(T * 1.1) * 0.06 - ev.b * 0.25, Math.sin(T * 0.55) * 0.5, Math.sin(T * 0.9) * 0.1 + ev.b * Math.sin(T * 18) * 0.1)
    mascella.rotation.x = 0.1 + Math.max(0, Math.sin(T * 2.2)) * 0.1 + ev.b * (0.45 + 0.3 * Math.sin(T * 26)) // ogni tanto batte i denti
    code.forEach((q, i) => { q.rotation.x = Math.sin(T * 2.3 - i) * 0.15; q.rotation.z = Math.sin(T * 1.9 + i) * 0.2 })
  })
  dichiara(g, 'morso', 0.6, 0.5)
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.5)
    corpo.position.z += -W * 0.12 + L * 0.5; corpo.position.y += -L * 0.08; corpo.rotation.x += -W * 0.35 + L * 0.3
    mascella.rotation.x += apertura(p, 0.5) * 0.95
    corona.forEach(f => { f.scale.multiplyScalar(1 + L * 0.5) })
  }
  return g
}

// ══════════════════════════════════════ IL GHOUL ══════════════════════════════════════
export function creaGhoul (variante = 0) {
  inizia()
  const pelle = [0x8d9a7e, 0x7a8294][variante], ombra = [0x5c6a55, 0x4a5262][variante], carne = M(0x6a2a2a, { roughness: 0.5 }), artC = M(0xe6dcc0), buio = M(NERO, { roughness: 1 })
  const mp = M(pelle), mo = M(ombra), straccio = M(0x3a3028, { side: THREE.DoubleSide })
  const g = new THREE.Group()
  const bacino = perno(g, 0, 0.42, 0)
  const gambe = [-1, 1].map(s => {
    const an = perno(bacino, s * 0.08, 0, 0.0); arto(an, [0, 0, 0], [s * 0.01, -0.2, 0.06], 0.05, 0.04, mo, 7)
    const gi = perno(an, s * 0.01, -0.2, 0.06); arto(gi, [0, 0, 0], [0, -0.2, -0.05], 0.04, 0.03, mo, 7)
    const pi = perno(gi, 0, -0.2, -0.05); sfera(pi, 0.05, mo, 0, 0.0, 0.06, 1, 0.5, 1.7, 8); for (const k of [-1, 0, 1]) cono(pi, 0.01, 0.06, artC, k * 0.025, -0.01, 0.15, 4).rotation.x = PI / 2
    return { an, gi }
  })
  const busto = perno(bacino, 0, 0.0, 0)
  sfera(busto, 0.5, mp, 0, 0.22, 0.0, 0.38, 0.5, 0.28, 12)
  sfera(busto, 0.5, mo, 0, 0.1, 0.04, 0.3, 0.3, 0.26, 10)                                       // il ventre incavato
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) scatola(busto, 0.13, 0.016, 0.03, M(0xb8b79a), s * 0.1, 0.12 + i * 0.065, 0.12).rotation.z = s * -0.15       // le costole che spuntano
  for (let i = 0; i < 6; i++) cono(busto, 0.024, 0.1, mo, 0, 0.12 + i * 0.07, -0.13, 4).rotation.x = -PI / 2 - 0.4                  // la spina dorsale a nodi
  for (let i = -2; i <= 2; i++) scatola(bacino, 0.06, 0.14 + (i & 1) * 0.06, 0.012, straccio, i * 0.06, -0.04, 0.1).rotation.z = i * 0.06
  const collo = perno(busto, 0, 0.44, 0.06)
  const testa = perno(collo, 0, 0.07, 0.07)
  sfera(testa, 0.1, mp, 0, 0, 0, 0.95, 1.12, 1.1, 12); sfera(testa, 0.06, mo, 0, -0.07, 0.07, 1.1, 0.8, 1, 8)
  const occhi = [-1, 1].map(s => { sfera(testa, 0.055, buio, s * 0.05, 0.025, 0.08, 1, 1.1, 0.6, 8); return occhio(testa, s * 0.05, 0.025, 0.095, 0.03, 0xe8ff3a, { emis: 1.6, giro: s * 0.3 }) })
  const mascella = perno(testa, 0, -0.08, 0.06)
  sfera(mascella, 0.05, M(0x3a0c0c, { flatShading: false }), 0, 0.01, 0.03, 1.4, 0.45, 1.1, 8)
  for (let i = 0; i < 5; i++) { cono(mascella, 0.008, 0.045, artC, -0.05 + i * 0.025, 0.03, 0.08, 4); cono(mascella, 0.008, 0.04, artC, -0.05 + i * 0.025, -0.01, 0.08, 4).rotation.x = PI }
  const lingua = sfera(mascella, 0.025, carne, 0, 0.0, 0.1, 0.8, 0.5, 2.6, 6)
  for (const s of [-1, 1]) { cono(testa, 0.03, 0.1, mo, s * 0.11, 0.03, -0.02, 4).rotation.z = s * -1.4 }                           // orecchie a punta
  for (let i = 0; i < 4; i++) cono(testa, 0.012, 0.09, buio, -0.04 + i * 0.03, 0.1, -0.05, 4).rotation.set(-0.6, 0, (i - 1.5) * 0.15)   // ciuffi radi
  // le braccia lunghe quasi fino a terra, con artigli da coltello
  const braccia = [-1, 1].map(s => {
    const sp = perno(busto, s * 0.17, 0.4, 0); arto(sp, [0, 0, 0], [s * 0.04, -0.2, 0.05], 0.04, 0.033, mp, 7)
    const go = perno(sp, s * 0.04, -0.2, 0.05); arto(go, [0, 0, 0], [0, -0.22, 0.05], 0.033, 0.028, mp, 7)
    const ma = perno(go, 0, -0.23, 0.05); sfera(ma, 0.04, mo, 0, 0, 0, 1, 1.2, 0.8, 8)
    for (const k of [-1, 0, 1]) { const d = perno(ma, k * 0.022, -0.03, 0.0); d.rotation.x = 0.4; cono(d, 0.011, 0.13, artC, 0, -0.05, 0, 4).rotation.x = PI }
    return { sp, go, ma }
  })
  const bava = sfera(mascella, 0.012, lucido(0xcfe8a8), 0.03, -0.02, 0.08, 1, 2.5, 1, 5)
  vivo(g, T => {
    const r = onda(T, 2.4), ev = evento(T, 6.0, 1.5), peso = Math.sin(T * 0.8)
    bacino.position.set(peso * 0.02, 0.42 + Math.abs(Math.sin(T * 1.2)) * 0.012, 0); bacino.rotation.set(0.04, peso * 0.08, peso * 0.04)
    busto.rotation.set(0.5 + r * 0.025 + ev.b * 0.15, Math.sin(T * 0.6) * 0.15, Math.sin(T * 0.9) * 0.05); busto.scale.set(1, 1 + r * 0.02, 1 + r * 0.03)
    collo.rotation.x = -0.25 + Math.sin(T * 1.5) * 0.05
    testa.rotation.set(-0.15 + Math.sin(T * 1.2) * 0.06 - ev.b * 0.35, Math.sin(T * 0.7) * 0.4 + ev.b * Math.sin(T * 25) * 0.1, Math.sin(T * 0.9) * 0.1 + ev.b * 0.3)
    mascella.rotation.x = 0.25 + Math.max(0, Math.sin(T * 1.8)) * 0.1 + ev.b * 0.55; lingua.position.z = 0.1 + ev.b * 0.05
    braccia.forEach((b, i) => { const s = i ? 1 : -1; b.sp.rotation.set(-0.15 + Math.sin(T * 1.3 + i * 2) * 0.1 - 0.2 * Math.max(0, s * peso), 0, s * (0.12 + Math.sin(T * 1.5 + i) * 0.04)); b.go.rotation.x = -0.3 + Math.sin(T * 2 + i) * 0.1; b.ma.rotation.x = Math.sin(T * 6 + i) * 0.08 * ev.b })
    gambe.forEach(({ an, gi }, i) => { an.rotation.x = -0.35 + (i ? 1 : -1) * peso * 0.07; gi.rotation.x = 0.55 + (i ? -1 : 1) * peso * 0.04 })
    bava.scale.y = 2.5 + Math.sin(T * 1.1) * 1.5
    g.rotation.y = 0
  })
  dichiara(g, 'graffio', 0.75, 0.52)                                                             // si carica sulle gambe e graffia con tutte e due le mani
  g.userData.attacca = p => {
    const { s, W, L } = ritmo(p, 0.52)
    busto.rotation.x += -W * 0.1 + L * 0.35; g.position.z = L * 0.3 - W * 0.05
    braccia.forEach((b, i) => { const sg = i ? 1 : -1; b.sp.rotation.x += W * -1.7 + L * -0.3; b.sp.rotation.z += sg * (W * 0.7 - L * 0.9); b.go.rotation.x += -W * 0.5; b.ma.rotation.x += L * 0.5 })
    testa.rotation.x += L * 0.3; mascella.rotation.x += apertura(p, 0.52) * 0.5
  }
  return g
}

// ══════════════════════════════════════ LO SCHELETRO BRUCIATO ══════════════════════════════════════
const _tinte = new Map()
/** Lo scheletro del cimitero ma carbonizzato: ossa nere di fuliggine con crepe di brace, spada rovente, una corona di fuoco sul cranio.
 *  Idle e colpo sono quelli di `creaScheletro`; sopra, il guizzo delle fiamme e un tremito rovente. */
export function creaScheletroBruciato () {
  inizia()
  const g = creaScheletro()
  const mappa = new Map()
  g.traverse(o => {
    if (!o.isMesh || !o.material.color) return
    if (!mappa.has(o.material)) {
      const m0 = o.material, m = m0.clone(), c = m0.color.getHex()
      if (m0.metalness > 0.3) { m.color.setHex(0x3a2622); m.emissive = new THREE.Color(0xff4a08); m.emissiveIntensity = 0.5 }          // il ferro della spada, rovente
      else if (c === 0xe9dcc0 || c === 0xf4ead2) { m.color.setHex(0x3a322d); m.emissive = new THREE.Color(0x6a1a00); m.emissiveIntensity = 0.5 }
      else if (c === 0xb8a784) { m.color.setHex(0x2a2420); m.emissive = new THREE.Color(0x4a1200); m.emissiveIntensity = 0.5 }
      else m.color.multiplyScalar(0.5)
      mappa.set(m0, m)
    }
    o.material = mappa.get(o.material)
  })
  const brace = [...mappa.values()].filter(m => m.emissiveIntensity > 0)
  const corona = []
  for (let i = 0; i < 5; i++) corona.push(fiamma(g, (i - 2) * 0.07, 1.8 - Math.abs(i - 2) * 0.03, 0.01 - Math.abs(i - 2) * 0.01, 0.2 + (i === 2 ? 0.14 : 0), 0.05, 0xff5a10, 0xffc840, i))
  for (const s of [-1, 1]) fiamma(g, s * 0.2, 1.4, 0.0, 0.2, 0.05, 0xff5a10, 0xffc840, s + 3)
  fiamma(g, 0, 1.2, 0.14, 0.12, 0.04, 0xff5a10, 0xffc840, 8)
  // crepe di brace sulle costole
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) scatola(g, 0.1, 0.012, 0.012, lum(0xff6a10, 1.3), s * 0.1, 1.04 + i * 0.056, 0.13).rotation.z = s * 0.12
  const base = g.userData.anima
  vivo(g, T => {
    base(T)
    const tre = 0.5 + 0.5 * Math.sin(T * 5.3)
    brace.forEach((m, i) => { m.emissiveIntensity = (m.metalness > 0.3 ? 0.5 : 0.5) * (0.7 + 0.5 * tre + 0.2 * Math.sin(T * 11 + i)) })
  })
  const att = g.userData.attacca
  g.userData.attacca = p => { att(p) }
  g.userData.anima(0)
  g.scale.setScalar(0.76)
  return g
}

// ══════════════════════════════════════ L'ELEMENTALE DI BRACE ══════════════════════════════════════
export function creaElementaleBrace (variante = 0) {
  inizia()
  const carb = M([0x2a2320, 0x3b3a44][variante], { roughness: 0.95 }), carb2 = M([0x3d322c, 0x55555f][variante], { roughness: 0.95 })
  const g = new THREE.Group(), centro = perno(g, 0, 0.62, 0)
  const nucleoM = lum([0xff7a18, 0x6aa8ff][variante], 1.8), crepaM = lum([0xffb030, 0xbfe0ff][variante], 1.4)
  sfera(centro, 0.18, nucleoM, 0, 0, 0, 1, 1, 1, 12).castShadow = false
  const pezzi = []
  for (let i = 0; i < 12; i++) {
    const a = i * 2.399, y = Math.sin(i * 1.7) * 0.3, r = 0.28 + (i % 3) * 0.04
    const p = perno(centro, Math.sin(a) * r, y, Math.cos(a) * r * 0.9); p.userData.a = a; p.userData.y = y; p.userData.r = r
    const rr = 0.1 + (i % 4) * 0.025; rozza(p, rr, i % 2 ? carb : carb2, 0, 0, 0, 1, 0.9, 1.1, 0); p.rotation.set(i, i * 2, 0)
    const cr = rozza(p, rr * 0.55, crepaM, 0, 0, rr * 0.55, 1, 0.5, 0.35, 0); cr.castShadow = false
    pezzi.push(p)
  }
  // il torso: un blocco sopra il nucleo con una crepa che brilla, e una testa di carbone con occhi di brace
  const testa = perno(centro, 0, 0.38, 0.03)
  rozza(testa, 0.14, carb, 0, 0, 0, 1.0, 0.95, 1.0, 1); rozza(testa, 0.06, carb2, 0, -0.07, 0.1, 1.2, 0.7, 0.8, 0)
  for (const s of [-1, 1]) { occhio(testa, s * 0.06, 0.02, 0.115, 0.03, 0xffe060, { emis: 2.2, fessura: false, giro: s * 0.3 }); punta(testa, [s * 0.08, 0.1, 0], [s * 0.14, 0.24, -0.02], 0.03, carb2, 5) }
  const mani = [-1, 1].map(s => {
    const sp = perno(centro, s * 0.36, 0.14, 0); rozza(sp, 0.1, carb, 0, 0, 0, 1, 1, 1, 0)
    const go = perno(sp, s * 0.06, -0.16, 0.05); rozza(go, 0.075, carb2, 0, 0, 0, 1, 1.2, 1, 0)
    const ma = perno(go, s * 0.02, -0.14, 0.06); rozza(ma, 0.13, carb, 0, 0, 0, 1, 0.9, 1, 0); const cr = rozza(ma, 0.07, crepaM, 0, -0.04, 0.08, 1, 0.8, 0.5, 0); cr.castShadow = false
    return { sp, go, ma }
  })
  const braci = fiamma(centro, 0, 0.28, -0.05, 0.4, 0.08, 0xff5a10, 0xffc840, 2)
  const origine = marcatore(centro, 0, 0, 0.55)
  const cenere = []
  for (let i = 0; i < 6; i++) { const s = scatola(g, 0.025, 0.025, 0.025, lum(0xffa030, 2), 0, 0, 0); s.castShadow = false; cenere.push(s) }
  vivo(g, T => {
    const ev = evento(T, 6.0, 1.7), r = onda(T, 2.0)
    centro.position.set(Math.sin(T * 0.7) * 0.04, 0.62 + onda(T, 1.3) * 0.05, Math.sin(T * 0.9) * 0.03); centro.rotation.y = Math.sin(T * 0.5) * 0.3
    pezzi.forEach((p, i) => { const a = p.userData.a + T * (0.5 + (i % 3) * 0.08) * (1 + ev.b * 2), q = p.userData.r * (1 + ev.b * 0.4); p.position.set(Math.sin(a) * q, p.userData.y + Math.sin(T * 1.5 + i) * 0.04, Math.cos(a) * q * 0.9); p.rotation.x += 0.01 })
    testa.rotation.set(Math.sin(T * 1.2) * 0.06 + ev.b * 0.1, Math.sin(T * 0.7) * 0.4, Math.sin(T * 0.9) * 0.06)
    mani.forEach((m, i) => { const s = i ? 1 : -1; m.sp.rotation.set(Math.sin(T * 1.3 + i) * 0.1 - ev.b * 0.6, 0, s * (0.15 + Math.sin(T * 1.7 + i) * 0.06)); m.go.rotation.x = -0.3 + ev.b * -0.5; m.ma.rotation.y = 0 })
    cenere.forEach((s, i) => { const u = (T * 0.4 + i / 6) % 1; s.position.set(Math.sin(i * 2 + T) * 0.3, 0.3 + u * 0.9, Math.cos(i * 2 + T * 0.8) * 0.3); s.scale.setScalar(1 - u) })
  })
  dichiara(g, 'raffica-di-braci', 0.85, 0.55, { tipo: 'braci', origine })                         // alza le braccia, i sassi si raccolgono e partono in avanti
  g.userData.attacca = p => {
    const { s, W, L } = ritmo(p, 0.55)
    mani.forEach((m, i) => { m.sp.rotation.x += W * -1.6 + L * -0.6; m.sp.rotation.z += (i ? -1 : 1) * W * 0.3; m.go.rotation.x += -W * 0.4 + L * 0.3 })
    centro.position.z += -W * 0.12 + L * 0.28; centro.position.y += W * 0.05; centro.rotation.x = -W * 0.2 + L * 0.3
    pezzi.forEach(pz => { pz.position.z += L * 0.25; pz.position.x *= 1 - W * 0.35 })
  }
  return g
}

// ══════════════════════════════════════ LA SALAMANDRA DI LAVA ══════════════════════════════════════
export function creaSalamandra (variante = 0) {
  inizia()
  const pelle = M([0x2e2624, 0x3a2a40][variante], { roughness: 0.8 }), ventre = M([0x6a3a28, 0x7a4a70][variante]), lava = lum([0xff6a14, 0xff3a8a][variante], 1.3), dente = M(0xf0e6c8)
  const g = new THREE.Group(), corpo = perno(g, 0, 0, 0)
  const sg = []
  // un corpo basso e lungo a segmenti: il bacino, il dorso e la coda
  rozza(corpo, 0.2, pelle, 0, 0.19, 0.12, 0.9, 0.75, 1.5, 2); rozza(corpo, 0.17, pelle, 0, 0.18, -0.15, 0.85, 0.7, 1.4, 2)
  rozza(corpo, 0.14, ventre, 0, 0.1, 0.0, 0.8, 0.45, 2.3, 1)
  for (let i = 0; i < 7; i++) { const m = rozza(corpo, 0.035, lava, (i % 2 - 0.5) * 0.12, 0.28 - Math.abs(i - 3) * 0.008, 0.32 - i * 0.1, 1, 0.5, 1.6, 0); m.castShadow = false }       // le macchie di lava sul dorso
  for (let i = 0; i < 6; i++) cono(corpo, 0.025, 0.07, pelle, 0, 0.3, 0.3 - i * 0.1, 4)
  const coda = []; let padre = perno(corpo, 0, 0.16, -0.32)
  for (let i = 0; i < 6; i++) { const q = perno(padre, 0, 0, i ? -0.11 : 0); coda.push(q); rozza(q, 0.12 - i * 0.015, i % 2 ? pelle : ventre, 0, 0, -0.05, 0.9, 0.7, 1.4, 1); if (i < 5) sfera(q, 0.025, lava, 0, 0.07 - i * 0.008, -0.05, 1, 0.6, 1.4, 6).castShadow = false; padre = q }
  fiamma(padre, 0, 0, -0.12, 0.2, 0.04, 0xff5a10, 0xffc840, 4).rotation.x = -PI / 2
  const zampe = []
  for (const [x, z, k] of [[-1, 0.28, 0], [1, 0.28, 1], [-1, -0.26, 1], [1, -0.26, 0]]) {
    const an = perno(corpo, x * 0.17, 0.17, z); const gi = perno(an, x * 0.1, -0.06, 0.0)
    arto(an, [0, 0, 0], [x * 0.1, -0.06, 0.0], 0.05, 0.04, pelle, 6); arto(gi, [0, 0, 0], [x * 0.03, -0.08, 0.02], 0.04, 0.032, pelle, 6)
    const pi = perno(gi, x * 0.03, -0.1, 0.02); sfera(pi, 0.045, ventre, 0, 0, 0.03, 1.2, 0.4, 1.5, 7)
    for (const d of [-1, 0, 1]) cono(pi, 0.009, 0.05, dente, d * 0.03, -0.01, 0.1, 4).rotation.x = PI / 2
    zampe.push({ an, gi, k })
  }
  const collo = perno(corpo, 0, 0.22, 0.34), testa = perno(collo, 0, 0.0, 0.08)
  rozza(testa, 0.11, pelle, 0, 0, 0.03, 1.0, 0.7, 1.4, 2); rozza(testa, 0.06, ventre, 0, -0.04, 0.1, 1, 0.5, 1.4, 1)
  sfera(testa, 0.012, lava, 0.035, 0.0, 0.22, 1, 1, 1, 5)
  const occhi = [-1, 1].map(s => { sfera(testa, 0.055, pelle, s * 0.075, 0.07, 0.04, 1, 1, 1, 8); return occhio(testa, s * 0.08, 0.085, 0.07, 0.035, 0xffd040, { emis: 1.6, fessura: true, giro: s * 0.7 }) })
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) cono(testa, 0.02, 0.1 + i * 0.02, lava, s * 0.1, 0.0, -0.02 - i * 0.04, 4).rotation.set(0, 0, s * (-1.2 - i * 0.2))      // le branchie-fiammelle a lato
  const mascella = perno(testa, 0, -0.04, 0.1); sfera(mascella, 0.055, ventre, 0, -0.01, 0.06, 1, 0.4, 1.5, 8)
  const gola = sfera(mascella, 0.04, lum(0xff4a08, 0.5), 0, 0.012, 0.06, 1, 0.3, 1.4, 6); gola.castShadow = false
  for (const s of [-1, 1]) { cono(testa, 0.009, 0.04, dente, s * 0.04, -0.03, 0.2, 4).rotation.x = PI; cono(mascella, 0.008, 0.035, dente, s * 0.035, 0.025, 0.1, 4) }
  const origine = marcatore(testa, 0, -0.02, 0.28)
  g.scale.setScalar(0.9)
  vivo(g, T => {
    const r = onda(T, 3.0), ev = evento(T, 5.2, 1.5), sw = Math.sin(T * 0.9)
    corpo.position.set(sw * 0.015, r * 0.004, 0); corpo.rotation.set(0, Math.sin(T * 1.3) * 0.07, Math.sin(T * 0.8) * 0.02); corpo.scale.set(1 + r * 0.02, 1 + r * 0.03, 1)
    gola.scale.set(1, 0.3, 1.4);
    collo.rotation.set(-0.05 + ev.b * -0.2, Math.sin(T * 0.8) * 0.25, 0); testa.rotation.set(0.05 + Math.sin(T * 1.7) * 0.04 + ev.b * -0.25, Math.sin(T * 0.6) * 0.3, 0)
    mascella.rotation.x = 0.04 + ev.b * 0.55 + Math.max(0, Math.sin(T * 2.4)) * 0.04
    coda.forEach((q, i) => { q.rotation.y = Math.sin(T * 2.2 - i * 0.7) * (0.14 + i * 0.05); q.rotation.x = 0.04 })
    zampe.forEach(({ an, gi, k }, i) => { an.rotation.x = Math.sin(T * 0.9 + k * PI) * 0.04; gi.rotation.x = 0 })
    const sc = evento(T, 7.3, 0.8, 2); zampe[0].an.rotation.x -= sc.b * 0.5; zampe[0].gi.rotation.x -= sc.b * 0.4     // ogni tanto scuote una zampa
  })
  dichiara(g, 'sputo-di-fuoco', 0.75, 0.55, { tipo: 'fuoco', origine })                          // si solleva sulle zampe davanti, getta indietro la testa e sputa
  g.userData.attacca = p => {
    const { s, W, L } = ritmo(p, 0.55)
    corpo.rotation.x += -W * 0.18 + L * 0.06; collo.rotation.x += -W * 0.45 + L * 0.5; testa.rotation.x += -W * 0.35 + L * 0.3
    mascella.rotation.x += apertura(p, 0.55) * 0.9; corpo.position.z += -W * 0.04 + L * 0.1
    gola.scale.multiplyScalar(1 + apertura(p, 0.55) * 2)
  }
  return g
}

// ══════════════════════════════════════ IL VERME DI BRACE ══════════════════════════════════════
export function creaVermeBrace (variante = 0) {
  inizia()
  const pelle = M([0x4a2e26, 0x34303a][variante], { roughness: 0.85 }), anello = M([0x7a4a34, 0x5a5666][variante]), lava = lum([0xff6a14, 0x6aa8ff][variante], 1.3), dente = M(0xefe4c4), cenereM = M(0x4a4440, { roughness: 1 })
  const g = new THREE.Group()
  // il cumulo di cenere da cui esce
  for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2; rozza(g, 0.1 + (i % 3) * 0.03, cenereM, Math.sin(a) * 0.3, 0.03, Math.cos(a) * 0.28, 1.3, 0.35, 1.3, 0) }
  const N = 9, seg = [], base = perno(g, 0, 0.0, 0)
  for (let i = 0; i < N; i++) {
    const s = perno(base, 0, 0, 0); const r = 0.15 - i * 0.004
    rozza(s, r, i % 2 ? anello : pelle, 0, 0, 0, 1.15, 1.0, 0.85, 1)
    const l = sfera(s, r * 0.5, lava, 0, r * 0.35, r * 0.5, 1.2, 0.5, 0.4, 6); l.castShadow = false
    for (const d of [-1, 1]) cono(s, 0.025, 0.07, pelle, d * r * 0.95, 0.0, -0.02, 4).rotation.z = d * -1.3
    seg.push(s)
  }
  // la testa: una bocca circolare con tre file di denti
  const testa = perno(base, 0, 0, 0)
  rozza(testa, 0.2, pelle, 0, 0, 0, 1.1, 1.0, 1.0, 1)
  const bocca = perno(testa, 0, 0, 0.14)
  const gola = sfera(bocca, 0.16, lum(0xff4a08, 0.7), 0, 0, 0.0, 1, 1, 0.3, 10); gola.castShadow = false
  for (const [rr, n, h] of [[0.16, 10, 0.09], [0.11, 8, 0.07]]) for (let i = 0; i < n; i++) { const a = i / n * PI * 2, d = cono(bocca, 0.022, h, dente, Math.cos(a) * rr, Math.sin(a) * rr, 0.03, 4); d.rotation.set(-Math.sin(a) * 0.5 + PI / 2, 0, 0); d.lookAt && 0; d.rotation.set(0, 0, 0); d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-Math.cos(a) * 0.4, -Math.sin(a) * 0.4, 1).normalize()) }
  const occhi = [-1, 1].map(s => occhio(testa, s * 0.15, 0.1, 0.06, 0.035, 0xffd040, { emis: 1.6, fessura: true, giro: s * 0.9 }))
  for (const s of [-1, 1]) cono(testa, 0.03, 0.14, anello, s * 0.12, 0.17, -0.02, 4).rotation.set(-0.3, 0, s * -0.5)
  const origine = marcatore(testa, 0, 0, 0.3)
  g.scale.setScalar(1.05)
  // un arco: la coda affonda nella cenere, il corpo sale e si piega in avanti; `curva` regola quanto si alza e si china
  const posa = (T, alza, china, onde, dx = 0) => {
    for (let i = 0; i < N + 1; i++) {
      const u = i / N, o = i < N ? seg[i] : testa
      const th = china * u, y = Math.sin(u * 1.4) * 0.38 * alza + u * 0.15 * alza, z = (u * u * 0.45 + (1 - u) * -0.12) * (0.4 + china * 0.5) + 0.0
      o.position.set(Math.sin(T * 2.0 - u * 3) * 0.05 * onde * u + dx, 0.0 + y * (1 + u * 1.2), -0.2 + z * 0.9 + u * 0.3)
      o.rotation.set(-1.15 + th * 1.55 - u * 0.2 + Math.sin(T * 1.6 - u * 2.5) * 0.05 * onde, Math.sin(T * 1.3) * 0.15 * u, 0)
    }
  }
  vivo(g, T => {
    const ev = evento(T, 5.8, 1.5), r = onda(T, 2.5)
    posa(T, 1 + r * 0.03 - ev.b * 0.05, 0.75 + Math.sin(T * 0.9) * 0.12, 1)
    testa.rotation.set(testa.rotation.x + 0.1 + ev.b * 0.4, Math.sin(T * 1.1) * 0.5, 0)
    bocca.scale.set(1 + r * 0.04 + ev.b * 0.3, 1 + r * 0.04 + ev.b * 0.3, 1); bocca.rotation.z = T * 0.8
  })
  dichiara(g, 'morso-dall-alto', 0.8, 0.55)                                                      // si tira su, poi si abbatte in avanti a bocca spalancata
  g.userData.attacca = p => {
    const { s, W, L } = ritmo(p, 0.55)
    for (let i = 0; i < N + 1; i++) { const u = i / N, o = i < N ? seg[i] : testa; o.position.y += W * 0.35 * u - L * 0.1 * u; o.position.z += -W * 0.35 * u + L * 0.55 * u; o.rotation.x += -W * 0.6 * u + L * 0.8 * u }
    bocca.scale.multiplyScalar(1 + apertura(p, 0.55) * 0.7)
  }
  return g
}

export const MOSTRI_CENERI = [
  { chiave: 'diavoletto', nome: 'Diavoletto', zona: 'ceneri', luogo: 'ceneri, labirinto', taglia: 'piccola', forza: 1, ruolo: 'comune', crea: () => creaDiavoletto(0) },
  { chiave: 'diavoletto-nero', nome: 'Diavoletto viola', zona: 'ceneri', luogo: 'labirinto, fornace', taglia: 'piccola', forza: 2, ruolo: 'comune', crea: () => creaDiavoletto(1) },
  { chiave: 'spirito-fuoco', nome: 'Spirito di fuoco', zona: 'ceneri', luogo: 'ceneri, fornace', taglia: 'media', forza: 2, ruolo: 'comune', crea: () => creaSpiritoFuoco(0) },
  { chiave: 'spirito-azzurro', nome: 'Spirito di fiamma azzurra', zona: 'ceneri', luogo: 'fornace', taglia: 'media', forza: 3, ruolo: 'comune', crea: () => creaSpiritoFuoco(1) },
  { chiave: 'teschio-azzurro', nome: 'Teschio azzurro', zona: 'ceneri', luogo: 'ossa, labirinto', taglia: 'piccola', forza: 2, ruolo: 'comune', crea: () => creaTeschioAzzurro(0) },
  { chiave: 'ghoul', nome: 'Ghoul', zona: 'ceneri', luogo: 'ossa, labirinto', taglia: 'media', forza: 2, ruolo: 'comune', crea: () => creaGhoul(0) },
  { chiave: 'scheletro-bruciato', nome: 'Scheletro bruciato', zona: 'ceneri', luogo: 'ossa, fornace', taglia: 'media', forza: 2, ruolo: 'comune', crea: creaScheletroBruciato },
  { chiave: 'cane-infernale', nome: 'Cane infernale', zona: 'ceneri', luogo: 'ceneri, ossa, labirinto', taglia: 'media', forza: 2, ruolo: 'comune', crea: () => creaCaneInfernale() },
  { chiave: 'elementale-brace', nome: 'Elementale di brace', zona: 'ceneri', luogo: 'ceneri, fornace', taglia: 'media', forza: 3, ruolo: 'comune', crea: () => creaElementaleBrace(0) },
  { chiave: 'salamandra', nome: 'Salamandra di lava', zona: 'ceneri', luogo: 'ceneri, colline, fornace', taglia: 'piccola', forza: 1, ruolo: 'comune', crea: () => creaSalamandra(0) },
  { chiave: 'verme-brace', nome: 'Verme di brace', zona: 'ceneri', luogo: 'ceneri, colline', taglia: 'media', forza: 3, ruolo: 'comune', crea: () => creaVermeBrace(0) },
  { chiave: 'lupo-infernale', nome: 'Lupo infernale', zona: 'ceneri', luogo: 'ossa, labirinto', taglia: 'grande', forza: 4, ruolo: 'forte', crea: () => creaLupoInfernale() },
  { chiave: 'bestia-cornuta', nome: 'Bestia cornuta', zona: 'ceneri', luogo: 'ceneri, labirinto', taglia: 'grande', forza: 4, ruolo: 'forte', crea: () => creaBestiaCornuta() },
  { chiave: 'fabbro-non-morto', nome: 'Fabbro non morto', zona: 'ceneri', luogo: 'fornace', taglia: 'grande', forza: 4, ruolo: 'forte', crea: () => creaFabbroNonMorto() },
  { chiave: 'golem-magma', nome: 'Golem di magma (caporale)', zona: 'ceneri', luogo: 'ceneri, fornace', taglia: 'grande', forza: 5, ruolo: 'boss', crea: () => creaGolemMagma() },
  { chiave: 'mietitore', nome: 'Mietitore (caporale delle ossa)', zona: 'ceneri', luogo: 'ossa', taglia: 'grande', forza: 5, ruolo: 'boss', crea: () => creaMietitore() },
  { chiave: 'minotauro', nome: 'Minotauro del labirinto', zona: 'ceneri', luogo: 'labirinto', taglia: 'grande', forza: 6, ruolo: 'boss', crea: () => creaMinotauro() },
  { chiave: 'drago-lava', nome: 'Drago di lava', zona: 'ceneri', luogo: 'fornace (in fondo)', taglia: 'enorme', forza: 8, ruolo: 'superboss', crea: () => creaDragoDiLava() },
]

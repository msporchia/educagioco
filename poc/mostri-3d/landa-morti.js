// I morti della landa vecchia e delle tombe: la mummia (e la mummia antica), il teschio azzurro, il cavaliere della tomba (armatura vuota),
// il negromante (caporale della landa) e il re non morto (signore delle tombe). Contratto di mostri.js; attrezzi in landa-base.js.
import {
  THREE, M, mesh, sfera, rozza, scatola, cil, cono, perno, punta, osso, onda, PI, NERO, lucido, lum, vivoMat, arto, occhio, lume, fasi, imp, apre, gesto,
  marker, dichiara, vivifica, lembo, doppio, umano,
} from './landa-base.js'

const OSSO = 0xe3d8bd, OSSO_O = 0xb3a584
const fascia = (g, rx, rz, y, m, z = 0) => { const f = mesh(g, new THREE.TorusGeometry(1, 0.07, 3, 12), m, 0, y, z, rx, rz, 0.14); f.rotation.x = PI / 2; return f }

/** Un cranio con le orbite accese. Torna { o, mascella, fuochi } (i fuochi nelle orbite, per farli pulsare). */
export function cranio (g, { luce = 0x4fd0ff, emis = 3, mini = false, x = 0, y = 0, z = 0, scala = 1 } = {}) {
  const o = perno(g, x, y, z); o.scale.setScalar(scala)
  const c1 = M(OSSO), c2 = M(OSSO_O), buio = M(NERO, { roughness: 1 }), fuochi = []
  rozza(o, 0.16, c1, 0, 0.02, 0, 1, 1.05, 1.08, mini ? 1 : 2)
  sfera(o, 0.1, c1, 0, -0.08, 0.07, 1.25, 0.8, 1, mini ? 7 : 11)
  for (const s of [-1, 1]) {
    sfera(o, 0.052, buio, s * 0.066, 0, 0.135, 1, 1.18, 0.7, mini ? 7 : 10)
    const e = sfera(o, 0.03, vivoMat(luce, emis), s * 0.066, 0, 0.158, 1, 1.1, 0.6, 6); e.castShadow = false; fuochi.push(e)
    scatola(o, 0.07, 0.014, 0.01, c2, s * 0.07, 0.075, 0.15).rotation.z = s * -0.35
  }
  const naso = cono(o, 0.026, 0.05, buio, 0, -0.045, 0.16, 3); naso.rotation.x = PI; naso.rotation.y = PI / 2
  for (let i = -2; i <= 2; i++) scatola(o, 0.026, 0.04, 0.02, M(0xf4ead2), i * 0.03, -0.135, 0.135 - Math.abs(i) * 0.014)
  const mascella = perno(o, 0, -0.12, 0.02)
  scatola(mascella, 0.15, 0.035, 0.13, c1, 0, -0.02, 0.07)
  for (let i = -2; i <= 2; i++) scatola(mascella, 0.026, 0.035, 0.02, M(0xf4ead2), i * 0.03, 0.012, 0.125 - Math.abs(i) * 0.014)
  for (const s of [-1, 1]) scatola(mascella, 0.02, 0.09, 0.03, c1, s * 0.08, 0.02, 0.0).rotation.z = s * 0.2
  return { o, mascella, fuochi }
}
/** Una fiammella a cono (materiale proprio, traslucido). */
function fiamma (g, mat, x, y, z, r, h) { const c = cono(g, r, h, mat, x, y + h / 2, z, 6); c.castShadow = false; return c }

// ══════════════════════════════════════ LA MUMMIA ══════════════════════════════════════
export function creaMummia (variante = 'comune') {
  const A = variante === 'antica'
  const ben = A ? 0x9c8c6c : 0xcdbf9e, ben2 = A ? 0x6f6048 : 0x9d8e6e, ooc = A ? 0x7fd8ff : 0xa8ff5c
  const P = umano({ pelle: ben, veste: ben, calzoni: ben2, scarpa: ben2, gamba: 0.42, busto: [0.36, 0.42, 0.22], testa: 0.19, braccio: 0.34, gr: 0.052, sg: 0.062 })
  const { g, busto, testa } = P
  const mb = M(ben2), mb1 = M(ben), buio = M(NERO, { roughness: 1 }), oro = M(0xd9a92c, { metalness: 0.7, roughness: 0.35, flatShading: false })
  const blu = lum(ooc, 2.4)
  // fasce attorno a busto, braccia e gambe
  for (let i = 0; i < 5; i++) fascia(busto, 0.185 - Math.abs(i - 2) * 0.004, 0.115, 0.07 + i * 0.075, i % 2 ? mb : mb1)
  P.bracci.forEach((b, k) => { for (let i = 0; i < 3; i++) fascia(b, 0.058, 0.058, -0.05 - i * 0.06, i % 2 ? mb : mb1); for (let i = 0; i < 3; i++) fascia(P.gomiti[k], 0.05, 0.05, -0.05 - i * 0.06, i % 2 ? mb1 : mb) })
  P.gambe.forEach(an => { for (let i = 0; i < 4; i++) fascia(an, 0.068, 0.068, -0.05 - i * 0.08, i % 2 ? mb : mb1) })
  // la testa: fasciata, con un occhio che spunta e la bocca scura
  for (let i = 0; i < 3; i++) fascia(testa, 0.2 - i * 0.012, 0.2 - i * 0.012, -0.08 + i * 0.1, i % 2 ? mb : mb1)
  sfera(testa, 0.062, buio, 0.065, 0.025, 0.145, 1.1, 0.85, 0.5, 8)
  const oc = occhio(testa, 0.065, 0.025, 0.17, 0.034, ooc, { emis: 2.2 })
  sfera(testa, 0.05, buio, -0.07, 0.03, 0.145, 1.0, 0.8, 0.5, 8)
  lume(testa, -0.07, 0.03, 0.17, 0.016, ooc, { emis: 2.6 })
  sfera(testa, 0.06, buio, 0, -0.075, 0.15, 1.2, 0.55, 0.5, 8)
  const mascella = perno(testa, 0, -0.1, 0.07)
  sfera(mascella, 0.075, mb1, 0, -0.01, 0.06, 1.0, 0.5, 1.0, 9)
  // lembi sciolti: dalla nuca, dai gomiti, dalla vita
  const lembi = []
  lembi.push(lembo(testa, 0.07, 0.32, doppio(ben), 0.02, -0.05, -0.17, 0.3, 0, 0.1))
  lembi.push(lembo(testa, 0.06, 0.22, doppio(ben2), -0.08, -0.1, -0.15, 0.25, 0.3, -0.1))
  P.gomiti.forEach((go, k) => lembi.push(lembo(go, 0.07, 0.36, doppio(k ? ben : ben2), 0, -0.06, -0.05, 0.1, 0, 0.1)))
  for (let i = 0; i < 4; i++) lembi.push(lembo(busto, 0.09, 0.3 + (i & 1) * 0.12, doppio(i % 2 ? ben : ben2), -0.12 + i * 0.08, 0.02, 0.0 + (i % 2 ? 0.1 : -0.1), 0.05, 0, (i - 1.5) * 0.08))
  // la polvere dei secoli sulle spalle e le crepe di sabbia
  for (const s of [-1, 1]) sfera(busto, 0.07, mb, s * 0.14, 0.4, -0.02, 1.2, 0.7, 1, 7)
  if (A) {
    g.scale.setScalar(1.14)
    // il copricapo (nemes), il collare largo, il pettorale con la gemma, i bracciali
    for (const s of [-1, 1]) {
      scatola(testa, 0.07, 0.34, 0.2, oro, s * 0.17, -0.1, 0.02).rotation.z = s * -0.12
      for (let i = 0; i < 4; i++) scatola(testa, 0.072, 0.016, 0.205, M(0x1d3f8f), s * 0.17 - s * 0.012 * i, -0.0 - i * 0.07, 0.025).rotation.z = s * -0.12
    }
    scatola(testa, 0.36, 0.16, 0.05, oro, 0, 0.12, -0.12)
    mesh(testa, new THREE.SphereGeometry(0.2, 12, 8, 0, PI * 2, 0, PI / 2), oro, 0, 0.0, -0.01, 1.02, 0.95, 1.02)
    cono(testa, 0.026, 0.1, oro, 0, 0.17, 0.2, 5).rotation.x = -0.4                                              // l'ureo
    sfera(testa, 0.026, lum(0xff5a3a, 1.5), 0, 0.2, 0.235, 1, 1, 1, 6)
    const col = fascia(busto, 0.2, 0.14, 0.4, oro); col.scale.z = 0.5
    scatola(busto, 0.2, 0.2, 0.03, oro, 0, 0.24, 0.115).rotation.x = -0.1
    sfera(busto, 0.04, lum(0x4ac8ff, 2.6), 0, 0.26, 0.14, 1, 1, 0.6, 8)
    P.gomiti.forEach(go => { cil(go, 0.062, 0.058, 0.1, oro, 0, -0.2, 0, 8) })
    for (let i = -1; i <= 1; i++) scatola(busto, 0.024, 0.16, 0.012, oro, i * 0.07, 0.04, 0.118)
  } else {
    // un sasso di gesso nella bocca? no: un grumo di ragnatela e uno scarabeo che scappa via dalle bende
    const sc = sfera(busto, 0.03, M(0x1f2a24), 0.12, 0.2, 0.115, 1.2, 0.6, 1.4, 6)
    for (const s of [-1, 1]) cono(sc, 0.006, 0.04, buio, s * 0.03, 0.0, 0.0, 3).rotation.z = s * 1.2
  }
  const dita = []
  P.mani.forEach(ma => { for (let k = -1; k <= 1; k++) { const d = cono(ma, 0.009, 0.06, buio, k * 0.022, -0.06, 0.012, 4); dita.push(d) } })
  const gomiti = P.gomiti, bracci = P.bracci, gambe = P.gambe
  const anima = T => {
    const r = onda(T, 1.8), gr = gesto(T, 6.5, 2, 2.0), sh = gesto(T, 9.1, 5, 1.0)
    busto.rotation.set(0.16 + r * 0.02 + gr * -0.18, 0, onda(T, 0.9) * 0.05)
    busto.position.set(onda(T, 0.9) * 0.02, 0.42 + Math.abs(onda(T, 1.1 * PI)) * 0.025, 0)
    testa.rotation.set(0.12 + onda(T, 0.7) * 0.05 - gr * 0.35, onda(T, 0.5) * 0.28, 0.12 + onda(T, 1.1) * 0.07 + sh * onda(T, 16) * 0.1)
    mascella.rotation.x = 0.08 + gr * 0.55 + Math.max(0, onda(T, 1.3)) * 0.06
    bracci[0].rotation.set(-1.3 + onda(T, 1.6) * 0.1 - gr * 0.35, 0.1, 0.08); bracci[1].rotation.set(-1.4 + onda(T, 1.6, 1.3) * 0.1 - gr * 0.35, -0.1, -0.08)
    gomiti[0].rotation.x = -0.15 + onda(T, 2.2) * 0.05; gomiti[1].rotation.x = -0.25 + onda(T, 2.2, 1) * 0.05
    gambe[0].rotation.x = onda(T, 0.9) * 0.04; gambe[1].rotation.x = -onda(T, 0.9) * 0.04 - 0.04
    g.rotation.set(0, onda(T, 0.4) * 0.06, onda(T, 0.9 + 0.2) * 0.02)
    lembi.forEach((l, i) => { l.rotation.x = 0.15 + onda(T, 1.7 + i * 0.13, i) * 0.12; l.rotation.z = onda(T, 1.2, i * 1.3) * 0.1 })
    dita.forEach((d, i) => { d.rotation.x = 0.05 + (0.4 + onda(T, 2.4, i * 0.8) * 0.3) * 0.5 })
  }
  dichiara(g, 'zampata', 0.85, 0.55)
  g.userData.attacca = p => {                                                  // alza le braccia fasciate e le abbatte
    const F = fasi(p, 0.55)
    imp(busto.rotation, F, [-0.1, null, null], [0.55, null, null])
    imp(testa.rotation, F, [-0.35, null, null], [0.35, null, null]); apre(mascella, F, 0.6)
    bracci.forEach(b => imp(b.rotation, F, [-2.7, null, null], [-1.1, null, null]))
    gomiti.forEach(go => imp(go.rotation, F, [-0.55, null, null], [-0.05, null, null]))
    imp(g.position, F, [null, null, -0.08], [null, null, 0.3])
  }
  return vivifica(g, anima, [g.position, g.rotation, busto.rotation, busto.position, testa.rotation, mascella.rotation, ...bracci.map(b => b.rotation), ...gomiti.map(b => b.rotation)])
}

// ══════════════════════════════════════ IL TESCHIO AZZURRO ══════════════════════════════════════
export function creaTeschioAzzurro () {
  const g = new THREE.Group()
  const f = perno(g, 0, 0.75, 0)
  const luce = 0x1a62ff, mf = vivoMat(luce, 1.3, { transparent: true, opacity: 0.7, depthWrite: false, flatShading: false }), mf2 = vivoMat(0x3a9bff, 1.7, { transparent: true, opacity: 0.65, depthWrite: false })
  const cr = cranio(f, { luce: 0x2ab4ff, emis: 2.4, scala: 1.9 })
  const cranioPivot = cr.o
  cranioPivot.rotation.x = 0.1
  // la fiamma azzurra sopra e dietro il cranio
  const fiamme = []
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * PI * 2, c = fiamma(cranioPivot, i % 2 ? mf2 : mf, Math.sin(a) * 0.12, 0.16 + (i % 2) * 0.03, Math.cos(a) * 0.08 - 0.03, 0.065 - (i % 3) * 0.01, 0.14 + (i % 3) * 0.07)
    fiamme.push(c)
  }
  const aura = sfera(f, 0.42, vivoMat(luce, 0.5, { transparent: true, opacity: 0.1, depthWrite: false }), 0, 0.05, 0, 1, 1.1, 1, 10); aura.castShadow = false
  // la scia di fuoco fatuo dietro
  const scia = []
  for (let i = 0; i < 4; i++) { const s = sfera(f, 0.1 - i * 0.02, mf, 0, -0.18 - i * 0.12, -0.2 - i * 0.14, 1, 1.2, 1.4, 7); s.castShadow = false; scia.push(s) }
  // fuochi fatui che girano attorno
  const orbite = []
  for (let i = 0; i < 3; i++) { const o = perno(f, 0, 0, 0); const s = sfera(o, 0.04, mf2, 0.5, 0, 0, 1, 1, 1, 6); s.castShadow = false; fiamma(o, mf, 0.5, 0.03, 0, 0.03, 0.1); orbite.push(o) }
  const ombra = new THREE.Mesh(new THREE.CircleGeometry(0.3, 18), new THREE.MeshBasicMaterial({ color: luce, transparent: true, opacity: 0.18, depthWrite: false }))
  ombra.rotation.x = -PI / 2; ombra.position.y = 0.012; g.add(ombra)
  const bocca = marker(cranioPivot, 0, -0.1, 0.34)
  const anima = T => {
    const sp = gesto(T, 7.3, 2, 1.6), ri = gesto(T, 5.1, 0.5, 0.7)
    f.position.set(onda(T, 0.6) * 0.04, 0.75 + onda(T, 1.2) * 0.07, 0)
    cranioPivot.rotation.set(0.1 + onda(T, 0.9) * 0.1 - ri * 0.2, onda(T, 0.5) * 0.35 + sp * PI * 2, onda(T, 1.3) * 0.1)
    f.rotation.z = onda(T, 0.8) * 0.06
    cr.mascella.rotation.x = 0.1 + Math.max(0, onda(T, 3.1)) * 0.2 + ri * 0.5
    fiamme.forEach((c, i) => { c.scale.set(1 + onda(T, 9 + i, i) * 0.15, 1 + onda(T, 7 + i * 0.7, i * 2) * 0.3, 1); c.rotation.z = onda(T, 3 + i * 0.3, i) * 0.2 })
    scia.forEach((s, i) => { s.position.x = onda(T, 1.8, -i * 0.6) * 0.1 * (i + 1) * 0.5; s.scale.setScalar(1 + onda(T, 6, i) * 0.1) })
    orbite.forEach((o, i) => { o.rotation.y = T * (1.1 + i * 0.25) + i * 2.1; o.position.y = Math.sin(T * 1.7 + i * 2) * 0.22 })
    cr.fuochi.forEach((e, i) => e.scale.setScalar(1 + onda(T, 11, i) * 0.12 + ri * 0.4))
    aura.material.opacity = 0.11 + onda(T, 2.2) * 0.03
    ombra.scale.setScalar(1 - onda(T, 1.2) * 0.06)
  }
  dichiara(g, 'morso', 0.8, 0.55, { tipo: 'fiamma', origine: bocca })
  g.userData.attacca = p => {                                                    // si ritrae, spalanca la mascella e scatta in avanti sputando fuoco
    const F = fasi(p, 0.55)
    imp(f.position, F, [null, null, -0.3], [null, 0.78, 0.7])
    imp(cranioPivot.rotation, F, [-0.45, null, null], [0.3, null, null]); apre(cr.mascella, F, 0.95)
    imp(f.rotation, F, [-0.25, null, null], [0.35, null, null])
    fiamme.forEach(c => { c.scale.y *= 1 + F.c * 0.6; c.scale.x *= 1 + F.k * 0.4 })
  }
  return vivifica(g, anima, [f.position, f.rotation, cranioPivot.rotation, cr.mascella.rotation])
}

// ══════════════════════════════════════ IL CAVALIERE DELLA TOMBA ══════════════════════════════════════
export function creaCavaliere () {
  const fer = M(0x8a93a8, { metalness: 0.45, roughness: 0.4 }), fer2 = M(0x59607a, { metalness: 0.45, roughness: 0.5 }), orlo = M(0xc3cadb, { metalness: 0.6, roughness: 0.3 })
  const P = umano({ pelle: 0x59607a, veste: 0x8a93a8, calzoni: 0x3a3f52, scarpa: 0x59607a, gamba: 0.44, busto: [0.4, 0.42, 0.26], testa: 0.2, braccio: 0.34, gr: 0.058, sg: 0.07, senzaTesta: true, senzaMani: true })
  const { g, busto, testa } = P
  const blu = 0x59d8ff, luceM = vivoMat(blu, 2.6, { flatShading: false }), buio = M(NERO, { roughness: 1 }), panno = doppio(0x20263c)
  // vuoto: giunture scure con una luce azzurra, dove non c'è nessuno
  for (let k = 0; k < 2; k++) {
    const an = P.gambe[k]
    cil(an, 0.085, 0.07, 0.22, fer, 0, -0.12, 0, 8); fascia(an, 0.09, 0.09, -0.02, orlo)                                 // cosciale
    sfera(an, 0.07, buio, 0, -0.26, 0, 1, 0.6, 1, 7); sfera(an, 0.06, luceM, 0, -0.27, 0.0, 0.8, 0.3, 0.8, 6).castShadow = false
    sfera(an, 0.08, fer, 0, -0.28, 0.03, 1, 1, 0.9, 8)                                                                   // ginocchiera
    cil(an, 0.07, 0.06, 0.18, fer, 0, -0.34, 0, 8)
    const piede = sfera(an, 0.08, fer2, 0, -0.42, 0.06, 1, 0.55, 1.9, 8); piede.castShadow = true
    // spalliera e bracciali
    const sp = P.bracci[k], go = P.gomiti[k], s = k ? 1 : -1
    sfera(sp, 0.13, fer, s * 0.02, 0.03, 0, 1.15, 0.8, 1.1, 10)
    for (let i = 0; i < 3; i++) cono(sp, 0.025, 0.1, orlo, s * 0.08, 0.1 + 0.03 * (i - 1), (i - 1) * 0.06, 5).rotation.z = s * -1.1
    sfera(go, 0.045, buio, 0, 0.0, 0, 1, 0.7, 1, 7); sfera(go, 0.04, luceM, 0, -0.0, 0.0, 0.9, 0.3, 0.9, 6).castShadow = false
    cil(go, 0.062, 0.07, 0.2, fer, 0, -0.17, 0, 8)
    sfera(go, 0.07, fer, 0, -0.04, 0.0, 1, 1, 1, 8)
    // guanto: palmo e dita di piastra
    const ma = P.mani[k]; sfera(ma, 0.075, fer2, 0, 0, 0, 1, 1.1, 0.9, 8)
    for (let d = -1.5; d <= 1.5; d++) scatola(ma, 0.02, 0.07, 0.02, fer, d * 0.026, -0.07, 0.03).rotation.x = -0.4
  }
  // corpetto, cintura, panno lacero
  rozza(busto, 0.2, fer, 0, 0.26, 0.03, 1.05, 1.25, 0.8, 1)
  sfera(busto, 0.5, fer2, 0, 0.04, 0, 0.42, 0.14, 0.3, 10)
  scatola(busto, 0.06, 0.22, 0.02, orlo, 0, 0.26, 0.14)
  for (const [y, w] of [[0.18, 0.3], [0.3, 0.3]]) scatola(busto, w, 0.025, 0.02, orlo, 0, y, 0.135)
  const stem = scatola(busto, 0.1, 0.1, 0.02, luceM, 0, 0.32, 0.15); stem.rotation.z = PI / 4; stem.castShadow = false       // lo stemma acceso
  const lembi = [lembo(busto, 0.2, 0.46, panno, 0, 0.02, 0.14, 0.05), lembo(busto, 0.12, 0.38, panno, -0.12, 0.02, 0.08, 0.05, 0, 0.12), lembo(busto, 0.16, 0.42, panno, 0, 0.02, -0.14, -0.05)]
  // collo vuoto che brilla e l'elmo
  cil(testa, 0.09, 0.1, 0.1, buio, 0, -0.15, 0, 9); const glow = sfera(testa, 0.085, luceM, 0, -0.14, 0.0, 1, 0.4, 1, 8); glow.castShadow = false
  fascia(testa, 0.14, 0.14, -0.1, orlo)
  rozza(testa, 0.2, fer, 0, 0.02, 0, 1, 1.12, 1.08, 2)
  scatola(testa, 0.3, 0.02, 0.05, orlo, 0, 0.05, 0.19)                                                                  // fascia della visiera
  scatola(testa, 0.2, 0.026, 0.03, luceM, 0, 0.0, 0.2)                                                                  // la fessura che brilla
  for (let i = 0; i < 4; i++) scatola(testa, 0.03, 0.005, 0.02, buio, 0, -0.06 - i * 0.025, 0.205)
  scatola(testa, 0.012, 0.28, 0.14, orlo, 0, 0.14, 0.0)                                                                 // la cresta
  const pennacchio = []
  for (let i = 0; i < 4; i++) { const c = cono(testa, 0.04, 0.3 - i * 0.04, panno, 0, 0.26, -0.1 - i * 0.05, 4); c.rotation.x = 1.9 + i * 0.1; pennacchio.push(c) }
  // lo scudo (sinistra) e la spada (destra)
  const mA = P.mani[0], mD = P.mani[1]
  const scudo = perno(mA, -0.05, 0.0, 0.1); scudo.rotation.y = 0.5
  const sc = sfera(scudo, 0.28, fer2, 0, -0.05, 0.0, 0.75, 1.2, 0.2, 9)
  scatola(scudo, 0.04, 0.46, 0.04, orlo, 0, -0.05, 0.05); scatola(scudo, 0.3, 0.04, 0.04, orlo, 0, 0.05, 0.05)
  sfera(scudo, 0.055, luceM, 0, 0.05, 0.065, 1, 1, 0.5, 7).castShadow = false
  for (let i = 0; i < 4; i++) sfera(scudo, 0.015, orlo, (i % 2 ? 1 : -1) * 0.2, 0.2 - Math.floor(i / 2) * 0.35, 0.05, 1, 1, 1, 5)
  const spada = perno(mD, 0, -0.02, 0.0); spada.rotation.x = 1.45
  cil(spada, 0.022, 0.022, 0.2, M(0x3c2a22), 0, 0.0, 0, 7); sfera(spada, 0.034, orlo, 0, -0.11, 0, 1, 1, 1, 7)
  scatola(spada, 0.3, 0.03, 0.05, orlo, 0, 0.11, 0)
  scatola(spada, 0.075, 0.7, 0.016, M(0xc8d0e0, { metalness: 0.2, roughness: 0.35 }), 0, 0.48, 0)
  scatola(spada, 0.016, 0.6, 0.02, luceM, 0, 0.46, 0.0).castShadow = false                                         // le rune lungo la lama
  punta(spada, [0, 0.83, 0], [0, 0.98, 0], 0.038, M(0xc8d0e0, { metalness: 0.2, roughness: 0.35 }), 4).scale.z = 0.25
  const { bracci, gomiti, gambe } = P
  const anima = T => {
    const r = onda(T, 1.3), pa = gesto(T, 8.3, 3, 2.0), sh = gesto(T, 6.1, 1, 0.8)
    busto.rotation.set(0.04 + r * 0.012 - pa * 0.05, onda(T, 0.5) * 0.05, onda(T, 0.8) * 0.025)
    busto.position.set(onda(T, 0.8) * 0.025, 0.44 + onda(T, 1.3) * 0.025, 0); g.position.x = onda(T, 0.55) * 0.035
    testa.rotation.set(0.02 + onda(T, 0.6) * 0.04 + pa * 0.1, onda(T, 0.45) * 0.4 + pa * 0.5 * onda(T, 0.6), onda(T, 0.9) * 0.05 + sh * onda(T, 30) * 0.03)
    bracci[0].rotation.set(-0.3 + onda(T, 1.1) * 0.03, 0.0, 0.1); gomiti[0].rotation.x = -0.9 + onda(T, 1.2) * 0.03
    bracci[1].rotation.set(-0.45 + onda(T, 1.1, 1) * 0.04 - pa * 0.25, -0.1, -0.1); gomiti[1].rotation.x = -1.0 + onda(T, 1.2, 0.5) * 0.03 - pa * 0.3
    gambe[0].rotation.x = onda(T, 0.6) * 0.03 - 0.02; gambe[1].rotation.x = -onda(T, 0.6) * 0.03 + 0.02
    g.rotation.set(0, 0, sh * onda(T, 36) * 0.015)
    lembi.forEach((l, i) => { l.rotation.x = 0.06 + onda(T, 1.3 + i * 0.2, i) * 0.07 })
    pennacchio.forEach((c, i) => { c.rotation.x = 1.9 + i * 0.1 + onda(T, 1.6, i * 0.5) * 0.1 })
    luceM.emissiveIntensity = 2.4 + onda(T, 2.1) * 0.7
  }
  dichiara(g, 'fendente', 0.95, 0.55)
  g.userData.attacca = p => {                                                  // la spada su sopra la testa, poi giù in diagonale
    const F = fasi(p, 0.55)
    imp(bracci[1].rotation, F, [-2.9, null, null], [-0.7, null, null]); imp(gomiti[1].rotation, F, [-0.35, null, null], [-0.1, null, null])
    imp(bracci[0].rotation, F, [-0.9, null, null], [-0.55, null, null])
    imp(busto.rotation, F, [-0.25, null, null], [0.55, null, null])
    imp(testa.rotation, F, [-0.2, null, null], [0.2, null, null])
    imp(g.position, F, [null, null, -0.1], [null, null, 0.34])
    imp(gambe[0].rotation, F, [0.25, null, null], [-0.35, null, null])
  }
  return vivifica(g, anima, [g.position, g.rotation, busto.rotation, busto.position, testa.rotation, ...bracci.map(b => b.rotation), ...gomiti.map(b => b.rotation), ...gambe.map(b => b.rotation)])
}

// ══════════════════════════════════════ IL NEGROMANTE ══════════════════════════════════════
export function creaNegromante () {
  const g = new THREE.Group(), f = perno(g, 0, 0.05, 0)
  const veste = M(0x43315e), veste2 = M(0x2c2040), orlo = M(0x6c5890), osso1 = M(OSSO), legno = M(0x2b1f18), buio = M(NERO, { roughness: 1 })
  const viola = 0xb06cff, luceV = vivoMat(viola, 2.8), luceV2 = vivoMat(0x7be0ff, 2.4)
  // la veste: solido di rotazione, l'orlo a brandelli
  const prof = [[0.0, 0.0], [0.34, 0.0], [0.4, 0.06], [0.3, 0.4], [0.22, 0.8], [0.2, 1.0], [0.24, 1.14], [0.1, 1.22], [0, 1.22]].map(([r, y]) => new THREE.Vector2(r, y))
  const robe = mesh(f, new THREE.LatheGeometry(prof, 14), veste, 0, 0.0, 0, 1, 1, 0.82)
  const brandelli = []
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * PI * 2, l = lembo(f, 0.16, 0.18 + (i % 3) * 0.07, doppio(i % 2 ? 0x2a1f3a : 0x1a1326), Math.sin(a) * 0.36, 0.08, Math.cos(a) * 0.3, 0, a, 0)
    brandelli.push(l)
  }
  const cinta = perno(f, 0, 0.78, 0); fascia(cinta, 0.22, 0.17, 0, orlo)
  const cima = perno(f, 0, 1.12, 0)
  // il collo-colletto alto e la testa incappucciata
  const testa = perno(cima, 0, 0.2, 0.02)
  const cappuccio = sfera(testa, 0.2, veste, 0, 0.0, -0.01, 1, 1.1, 1.05, 12)
  cono(testa, 0.14, 0.26, veste, 0, 0.12, -0.14, 6).rotation.x = -1.0
  sfera(testa, 0.14, buio, 0, -0.01, 0.07, 1, 1.1, 0.85, 10)
  const cr = cranio(testa, { luce: viola, emis: 3.2, mini: true, x: 0, y: 0.0, z: 0.03, scala: 0.9 })
  cr.o.rotation.x = 0.1
  for (const s of [-1, 1]) { const l = lembo(testa, 0.08, 0.2, veste2, s * 0.17, 0.0, 0.06, -0.1, 0, s * -0.12); l.rotation.y = s * 0.3 }
  sfera(cima, 0.28, veste, 0, -0.02, -0.01, 1.35, 0.5, 0.9, 12)
  // le braccia: maniche larghe e mani d'osso
  const bracci = [], gomiti = [], mani = []
  for (const s of [-1, 1]) {
    const sp = perno(cima, s * 0.3, -0.02, 0.0); bracci.push(sp)
    cono(sp, 0.09, 0.3, veste, 0, -0.15, 0, 7).rotation.x = PI
    const go = perno(sp, 0, -0.28, 0); gomiti.push(go)
    cono(go, 0.12, 0.28, veste, 0, -0.14, 0, 7).rotation.x = PI                       // la manica che si allarga
    const ma = perno(go, 0, -0.3, 0); mani.push(ma)
    sfera(ma, 0.034, osso1, 0, 0, 0, 1, 1.2, 0.8, 7)
    for (let d = -1; d <= 1; d++) { const dd = perno(ma, d * 0.022, -0.03, 0.01); dd.rotation.x = -0.4; arto(dd, [0, 0, 0], [0, -0.05, 0], 0.01, 0.008, osso1, 4, false); cono(dd, 0.008, 0.04, M(0x2c2230), 0, -0.07, 0, 4).rotation.x = PI }
  }
  // il bastone nella destra: legno nodoso, testa di teschio con le corna a mezzaluna
  const bastone = perno(mani[1], 0, -0.02, 0); bastone.rotation.x = 1.4
  cil(bastone, 0.022, 0.026, 1.7, legno, 0, 0.25, 0, 6)
  for (let i = 0; i < 4; i++) cono(bastone, 0.012, 0.07, legno, 0.025 * (i % 2 ? 1 : -1), 0.0 + i * 0.26, 0.0, 4).rotation.z = (i % 2 ? -1 : 1) * 1.4
  const testaBastone = perno(bastone, 0, 1.12, 0)
  const crB = cranio(testaBastone, { luce: viola, emis: 3.5, mini: true, scala: 0.85, y: 0.12 }); crB.o.rotation.x = -0.1
  const luna = mesh(testaBastone, new THREE.TorusGeometry(0.15, 0.022, 5, 12, PI * 1.25), M(0x3a2d4a, { roughness: 0.5, metalness: 0.4 }), 0, 0.04, -0.02); luna.rotation.z = PI * 0.5 - 0.62 * PI * 0.5 + 1.1
  const orbe = sfera(testaBastone, 0.06, luceV, 0, 0.35, 0, 1, 1, 1, 9); orbe.castShadow = false
  const bagliore = sfera(testaBastone, 0.14, vivoMat(viola, 1, { transparent: true, opacity: 0.18, depthWrite: false }), 0, 0.35, 0, 1, 1, 1, 8); bagliore.castShadow = false
  const puntaBastone = marker(testaBastone, 0, 0.35, 0.05)
  // il fuoco nel palmo sinistro
  const palmo = fiamma(mani[0], luceV2, 0, -0.03, 0.0, 0.05, 0.13)
  // la cintura di teschi, e i teschi che girano attorno
  for (let i = 0; i < 3; i++) { const a = -0.8 + i * 0.8; cranio(cinta, { luce: viola, emis: 2, mini: true, x: Math.sin(a) * 0.25, y: -0.02, z: Math.cos(a) * 0.2, scala: 0.32 }).o.rotation.y = a }
  const orbitano = []
  for (let i = 0; i < 3; i++) { const o = perno(g, 0, 1.0, 0); const c = cranio(o, { luce: i % 2 ? 0x7be0ff : viola, emis: 3, mini: true, x: 0.62, scala: 0.62 }); c.o.rotation.y = PI / 2; fiamma(c.o, i % 2 ? luceV2 : luceV, 0, 0.12, -0.02, 0.04, 0.12); orbitano.push({ o, c }) }
  const anima = T => {
    const r = onda(T, 1.4), ev = gesto(T, 7.2, 1.5, 2.4), cl = gesto(T, 3.3, 0.3, 0.4)
    f.position.set(onda(T, 0.5) * 0.02, 0.05 + onda(T, 1.0) * 0.04, 0)
    robe.scale.set(1 + r * 0.008, 1, 0.82 + r * 0.008)
    cima.rotation.set(0.04 + r * 0.01 - ev * 0.12, onda(T, 0.4) * 0.07, onda(T, 0.7) * 0.03)
    testa.rotation.set(0.05 + onda(T, 0.6) * 0.05 + ev * 0.12, onda(T, 0.5) * 0.3, onda(T, 0.9) * 0.05)
    cr.mascella.rotation.x = 0.06 + Math.max(0, onda(T, 2.3)) * 0.15 + ev * 0.3
    bracci[0].rotation.set(-0.35 - ev * 1.1 + onda(T, 1.2) * 0.04, 0.15, 0.25 - ev * 0.15); gomiti[0].rotation.x = -0.9 - ev * 0.2
    bracci[1].rotation.set(-0.2 + onda(T, 1.1, 1) * 0.04 - ev * 0.12, -0.1, -0.15); gomiti[1].rotation.x = -0.9
    mani[0].rotation.x = 0.2 * onda(T, 3.2)
    bastone.rotation.set(1.4 - ev * 0.2 + onda(T, 1.2) * 0.02, 0, -0.04)
    testaBastone.rotation.z = onda(T, 0.9) * 0.06; crB.mascella.rotation.x = 0.06 + cl * 0.35
    orbe.material.emissiveIntensity = 2.6 + onda(T, 3) * 0.5 + ev * 3; bagliore.scale.setScalar(1 + ev * 1.6 + onda(T, 3) * 0.1)
    palmo.scale.set(1 + onda(T, 11) * 0.2, 0.8 + ev * 1.4 + onda(T, 8) * 0.25, 1)
    brandelli.forEach((l, i) => { l.rotation.x = onda(T, 1.6 + i * 0.1, i * 1.2) * 0.12; l.rotation.z = onda(T, 1.1, i) * 0.06 })
    orbitano.forEach(({ o, c }, i) => { o.rotation.y = T * 0.9 + i * 2.094; o.position.y = 1.0 + Math.sin(T * 1.3 + i * 2) * 0.12; c.o.rotation.x = Math.sin(T * 1.6 + i) * 0.2; c.mascella.rotation.x = 0.1 + Math.max(0, Math.sin(T * 3 + i * 2)) * 0.25 })
  }
  g.scale.setScalar(0.82)
  dichiara(g, 'incantesimo', 0.95, 0.55, { tipo: 'teschio', origine: puntaBastone })
  g.userData.attacca = p => {                                                  // alza il bastone e lo punta in avanti: i teschi sfrecciano davanti
    const F = fasi(p, 0.55)
    imp(f.position, F, [null, null, -0.12], [null, null, 0.15])
    imp(cima.rotation, F, [-0.28, null, null], [0.42, null, null]); imp(testa.rotation, F, [-0.2, null, null], [0.25, null, null])
    imp(bracci[1].rotation, F, [-2.2, null, null], [-1.35, null, null]); imp(gomiti[1].rotation, F, [-0.3, null, null], [-0.1, null, null])
    imp(bastone.rotation, F, [2.1, null, null], [2.8, null, null])
    imp(bracci[0].rotation, F, [-1.6, null, null], [-1.3, null, null])
    apre(cr.mascella, F, 0.6)
    orbe.scale.setScalar(1 + F.c * 1.2 + F.k * 0.6)
    orbitano.forEach(({ o, c }) => { c.o.position.x += (1.0 - 0.62) * F.c * 0.5; c.o.position.z += F.k * 0.9 })
  }
  return vivifica(g, anima, [f.position, cima.rotation, testa.rotation, cr.mascella.rotation, ...bracci.map(b => b.rotation), ...gomiti.map(b => b.rotation), bastone.rotation, orbe.scale, ...orbitano.flatMap(({ c }) => [c.o.position])])
}

// ══════════════════════════════════════ IL RE NON MORTO ══════════════════════════════════════
export function creaReNonMorto () {
  const ferr = M(0x7a7a8e, { metalness: 0.5, roughness: 0.45 }), ferr2 = M(0x4f4e60, { metalness: 0.5, roughness: 0.5 }), oro = M(0xc9992b, { metalness: 0.75, roughness: 0.35, flatShading: false })
  const rug = M(0x7a4a34, { roughness: 0.8 }), mant = doppio(0x4a1d5a), mant2 = doppio(0x2f1240), ceruleo = 0x4fd0ff, luceM = vivoMat(ceruleo, 2.8, { flatShading: false }), buio = M(NERO, { roughness: 1 })
  const P = umano({ pelle: OSSO_O, veste: 0x7a7a8e, calzoni: 0x4f4e60, scarpa: 0x4f4e60, gamba: 0.5, busto: [0.46, 0.5, 0.3], testa: 0.2, braccio: 0.4, gr: 0.062, sg: 0.074, senzaTesta: true, senzaMani: true })
  const { g, busto, testa, bracci, gomiti, gambe } = P
  P.mani.forEach(ma => { sfera(ma, 0.058, M(OSSO_O), 0, 0, 0, 1, 1.15, 0.9, 7); for (let d = -1.5; d <= 1.5; d++) arto(ma, [d * 0.02, -0.04, 0.01], [d * 0.022, -0.1, 0.02], 0.01, 0.008, M(OSSO), 4, false) })
  // armatura arrugginita: pettorale, cinta, spalliere con spine, gambali
  rozza(busto, 0.25, ferr, 0, 0.3, 0.03, 1.05, 1.2, 0.85, 1)
  sfera(busto, 0.5, ferr2, 0, 0.05, 0, 0.5, 0.14, 0.34, 10)
  for (let i = 0; i < 5; i++) scatola(busto, 0.08, 0.02, 0.02, rug, (i - 2) * 0.07, 0.17 + (i % 2) * 0.12, 0.2)               // chiazze di ruggine
  sfera(busto, 0.06, luceM, 0, 0.36, 0.23, 1, 1, 0.5, 8).castShadow = false                                                    // il cuore azzurro
  const costole = []
  for (const s of [-1, 1]) {
    const sp = bracci[s < 0 ? 0 : 1], go = gomiti[s < 0 ? 0 : 1], an = gambe[s < 0 ? 0 : 1]
    sfera(sp, 0.17, ferr, s * 0.03, 0.04, 0, 1.2, 0.85, 1.15, 10)
    for (let i = 0; i < 4; i++) cono(sp, 0.034, 0.17, ferr2, s * 0.14, 0.08 + (i - 1.5) * 0.04, (i - 1.5) * 0.08, 5).rotation.z = s * -1.2
    sfera(go, 0.06, ferr2, 0, 0.0, 0, 1, 1, 1, 7); cil(go, 0.075, 0.08, 0.22, ferr, 0, -0.2, 0, 8)
    cil(an, 0.1, 0.085, 0.3, ferr, 0, -0.18, 0, 8); sfera(an, 0.1, ferr2, 0, -0.34, 0.04, 1, 1, 0.9, 8)
    cil(an, 0.08, 0.07, 0.2, ferr, 0, -0.43, 0, 8)
  }
  // la testa: cranio con la corona e il collo scoperto
  const cr = cranio(testa, { luce: ceruleo, emis: 3.5, scala: 1.25, y: 0.02 }); cr.o.rotation.x = 0.1
  const corona = perno(testa, 0, 0.2, 0)
  const anello = mesh(corona, new THREE.TorusGeometry(0.22, 0.03, 4, 14), oro, 0, 0.0, 0, 1, 1, 1); anello.rotation.x = PI / 2
  for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; cono(corona, 0.035, 0.15 + (i % 2) * 0.06, oro, Math.sin(a) * 0.22, 0.09 + (i % 2) * 0.03, Math.cos(a) * 0.22, 4); if (i % 2 === 0) sfera(corona, 0.028, lum(0xff4a3a, 1.6), Math.sin(a) * 0.22, 0.2, Math.cos(a) * 0.22, 1, 1, 1, 6) }
  for (let i = 0; i < 4; i++) cono(testa, 0.012, 0.1, M(0xcfc6aa), (i - 1.5) * 0.05, -0.2, 0.0, 3).rotation.x = PI                      // la barba di polvere? denti dell'osso: scheggia
  // il mantello regale a brandelli, dalle spalle
  const mantello = []
  for (let i = 0; i < 6; i++) mantello.push(lembo(busto, 0.15, 0.7 + (i % 3) * 0.12, doppio(i % 2 ? 0x4a1d5a : 0x2f1240), -0.22 + i * 0.088, 0.46, -0.2, 0.08, 0, (i - 2.5) * 0.04))
  scatola(busto, 0.56, 0.06, 0.1, oro, 0, 0.5, -0.15)
  const pelliccia = sfera(busto, 0.17, M(0xcfc6aa, { roughness: 1 }), 0, 0.48, 0.0, 1.9, 0.5, 1.1, 9)
  // la spada a due mani nella destra, appoggiata sulla spalla in guardia
  const spada = perno(P.mani[1], 0, -0.02, 0); spada.rotation.set(1.4, 0, 0)
  cil(spada, 0.026, 0.026, 0.3, M(0x2c1f18), 0, 0.02, 0, 7); sfera(spada, 0.04, oro, 0, -0.14, 0, 1, 1, 1, 7)
  scatola(spada, 0.38, 0.04, 0.07, oro, 0, 0.18, 0); sfera(spada, 0.04, luceM, 0, 0.18, 0.04, 1, 1, 0.7, 7).castShadow = false
  const ferroLama = M(0xc4cada, { metalness: 0.2, roughness: 0.35 })
  scatola(spada, 0.11, 0.85, 0.022, ferroLama, 0, 0.66, 0)
  scatola(spada, 0.02, 0.76, 0.026, luceM, 0, 0.64, 0).castShadow = false
  punta(spada, [0, 1.085, 0], [0, 1.3, 0], 0.055, ferroLama, 4).scale.z = 0.22
  // la nebbia gelida ai piedi
  const nebbie = []
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.5 + i * 0.12, 18), new THREE.MeshBasicMaterial({ color: ceruleo, transparent: true, opacity: 0.08, depthWrite: false })); m.rotation.x = -PI / 2; m.position.y = 0.012 + i * 0.004; g.add(m); nebbie.push(m) }
  // la mano sinistra tiene un fuoco azzurro
  const fuoco = fiamma(P.mani[0], vivoMat(ceruleo, 2.8, { transparent: true, opacity: 0.85, depthWrite: false }), 0, -0.05, 0.0, 0.06, 0.2)
  g.scale.setScalar(1.12)
  const anima = T => {
    const r = onda(T, 1.1), ev = gesto(T, 8.5, 2, 2.2), sh = gesto(T, 6.2, 4.4, 0.7)
    busto.rotation.set(0.05 + r * 0.012 - ev * 0.07, onda(T, 0.4) * 0.06, onda(T, 0.7) * 0.03)
    busto.position.set(onda(T, 0.7) * 0.03, 0.5 + onda(T, 1.1) * 0.022, 0); g.position.x = onda(T, 0.5) * 0.035
    testa.rotation.set(0.05 + onda(T, 0.5) * 0.04 + ev * 0.18, onda(T, 0.4) * 0.38 + ev * onda(T, 0.7) * 0.2, onda(T, 0.8) * 0.05 + sh * onda(T, 32) * 0.04)
    cr.mascella.rotation.x = 0.08 + Math.max(0, onda(T, 1.9)) * 0.1 + ev * 0.45
    bracci[0].rotation.set(-0.5 - ev * 0.6 + onda(T, 1.0) * 0.03, 0.1, 0.12); gomiti[0].rotation.x = -1.0 - ev * 0.2
    bracci[1].rotation.set(-0.5 + onda(T, 1.0, 1) * 0.04, -0.1, -0.12); gomiti[1].rotation.x = -1.0 + onda(T, 1.2) * 0.03
    gambe[0].rotation.x = onda(T, 0.5) * 0.03 - 0.02; gambe[1].rotation.x = -onda(T, 0.5) * 0.03 + 0.02
    g.rotation.z = onda(T, 0.6) * 0.012
    mantello.forEach((l, i) => { l.rotation.x = 0.12 + onda(T, 1.2 + i * 0.1, i * 1.1) * 0.1; l.rotation.z = (i - 2.5) * 0.04 + onda(T, 0.9, i) * 0.05 })
    fuoco.scale.set(1 + onda(T, 10) * 0.15, 0.8 + ev * 1.3 + onda(T, 7) * 0.2, 1)
    luceM.emissiveIntensity = 2.6 + onda(T, 1.7) * 0.6
    nebbie.forEach((m, i) => { m.material.opacity = 0.07 + onda(T, 0.8, i * 1.7) * 0.025; m.scale.setScalar(1 + onda(T, 0.5, i) * 0.06) })
    corona.rotation.y = onda(T, 0.5) * 0.02
  }
  dichiara(g, 'fendente', 1.0, 0.55)
  g.userData.attacca = p => {                                                  // spada a due mani alta, poi schianto
    const F = fasi(p, 0.55)
    imp(bracci[1].rotation, F, [-3.0, null, null], [-0.8, null, null]); imp(gomiti[1].rotation, F, [-0.4, null, null], [-0.1, null, null])
    imp(bracci[0].rotation, F, [-2.6, 0.35, null], [-0.9, 0.2, null]); imp(gomiti[0].rotation, F, [-0.6, null, null], [-0.15, null, null])
    imp(busto.rotation, F, [-0.3, null, null], [0.6, null, null])
    imp(testa.rotation, F, [-0.25, null, null], [0.3, null, null]); apre(cr.mascella, F, 0.7)
    imp(g.position, F, [null, null, -0.12], [null, null, 0.36])
    imp(gambe[0].rotation, F, [0.3, null, null], [-0.4, null, null])
  }
  return vivifica(g, anima, [g.position, g.rotation, busto.rotation, busto.position, testa.rotation, cr.mascella.rotation, ...bracci.map(b => b.rotation), ...gomiti.map(b => b.rotation), ...gambe.map(b => b.rotation)])
}

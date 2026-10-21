// Generato da strumenti/promuovi-3d.mjs da poc/mostri-3d/monte-nani.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Il monte, 4/4: gli abitanti della miniera e della cava: il nano corrotto, il re dei nani corrotti (boss), il minatore non morto.
import {
  THREE, M, sfera, rozza, scatola, cil, cono, perno, PI, V3, lumi, lum, lucido, senzaOmbra, figura, idleUmano, ritmo, apertura, marcatore, dichiara,
  evento, chiudi, occhio, ciuffo, arto, liscio,
} from './monte-base.js'

/** Il piccone (o il martello, `martello: true`): asse lungo +z, come la clava dei bruti. */
function attrezzo (padre, { lung = 0.7, martello = false, ferro = 0x6a6d75, cristallo = null } = {}) {
  const c = perno(padre, 0, 0, 0), t = perno(c, 0, 0, 0); t.rotation.x = PI / 2
  const mF = M(ferro, { roughness: 0.5, metalness: 0.55 }), mL = M(0x6e4a2c)
  cil(t, 0.03, 0.026, lung, mL, 0, lung * 0.5 - 0.1, 0, 7)
  cil(t, 0.035, 0.035, 0.14, M(0x2f2018), 0, 0.0, 0, 7)
  const y = lung - 0.1
  if (martello) {
    scatola(t, 0.2, 0.15, 0.15, mF, 0, y, 0); scatola(t, 0.23, 0.04, 0.18, M(0x8a8d95, { roughness: 0.4, metalness: 0.6 }), 0, y - 0.09, 0)
    for (const s of [-1, 1]) cono(t, 0.07, 0.1, mF, s * 0.15, y, 0, 5).rotation.z = -s * PI / 2
    if (cristallo) senzaOmbra(cono(t, 0.045, 0.2, cristallo, 0, y + 0.17, 0, 5))
  } else {
    const a = cono(t, 0.045, 0.34, mF, 0.17, y, 0, 5); a.rotation.z = -PI / 2
    const b = cono(t, 0.04, 0.22, mF, -0.12, y, 0, 5); b.rotation.z = PI / 2
    cil(t, 0.05, 0.05, 0.08, mF, 0, y, 0, 7)
  }
  return c
}

// ══════════════════════════════════════ IL NANO CORROTTO (e il suo re) ══════════════════════════════════════
export function creaNano (variante = 'corrotto') {
  const re = variante === 're', k = re ? 1 : 1
  const pelle = re ? 0x7d8a76 : 0x93a082, ferro = re ? 0x4f525c : 0x6a6d75
  const P = figura({ pelle, pelle2: 0x5b6552, calzoni: re ? 0x2a2230 : 0x3a3028, veste: re ? 0x3b2f48 : 0x5a3d2a, scarpa: 0x2b221a, gamba: 0.24, busto: re ? [0.58, 0.44, 0.4] : [0.5, 0.4, 0.36], testa: 0.16, braccio: 0.36, gr: re ? 0.085 : 0.075, sg: re ? 0.09 : 0.08, spalla: re ? 0.11 : 0, collo: 0.0, mano: 1.4, piede: 1.25 })
  const { g, busto, testa, bracci, gomiti, mani } = P
  const mFerro = M(ferro, { roughness: 0.5, metalness: 0.55 }), mOro = M(0xc9a23a, { metalness: 0.7, roughness: 0.3 }), barbaM = M(re ? 0x2a2a38 : 0x6f4328), cuoio = M(0x3a2a1c)
  const cristalli = lumi(re ? 0xff5ac8 : 0xb04aff, 2.0, { flatShading: true }), vena = lumi(re ? 0xff5ac8 : 0xb04aff, 1.6)
  // il corpo tozzo: cintura, pettorale di cuoio (o piastre di ferro per il re), borchie
  scatola(busto, re ? 0.62 : 0.54, 0.07, re ? 0.42 : 0.38, cuoio, 0, 0.03, 0)
  sfera(busto, 0.05, mOro, 0, 0.03, re ? 0.2 : 0.18, 1, 1, 0.5, 8)
  if (re) {
    rozza(busto, 0.26, mFerro, 0, 0.3, 0.07, 1.2, 0.85, 0.7, 1); for (const s of [-1, 1]) rozza(bracci[s < 0 ? 0 : 1], 0.15, mFerro, 0, 0.04, 0, 1.2, 0.8, 1.2, 1)
    for (let q = 0; q < 6; q++) ciuffo(bracci[q % 2], mFerro, (q % 2 ? 1 : -1) * 0.06, 0.12, (q % 3 - 1) * 0.06, [0, 1, 0], 0.03, 0.1, 4)
    const mant = scatola(busto, 0.6, 0.55, 0.02, M(0x7a1f2a, { side: THREE.DoubleSide }), 0, 0.15, -0.22); mant.rotation.x = 0.1
    for (let q = -2; q <= 2; q++) scatola(busto, 0.1, 0.1 + (q & 1) * 0.07, 0.02, M(0x7a1f2a, { side: THREE.DoubleSide }), q * 0.115, -0.15 - (q & 1) * 0.02, -0.22)
  } else {
    scatola(busto, 0.13, 0.36, 0.02, M(0x3e2a1c), 0.0, 0.2, 0.18).rotation.z = 0.35; scatola(busto, 0.13, 0.36, 0.02, M(0x3e2a1c), 0.0, 0.2, 0.18).rotation.z = -0.35
    for (let q = 0; q < 4; q++) cono(busto, 0.02, 0.05, mFerro, -0.12 + q * 0.08, 0.28 - (q & 1) * 0.1, 0.2, 4).rotation.x = PI / 2
  }
  // la testa: elmo, nasone, occhi accesi dalla corruzione, barba a trecce
  const casco = sfera(testa, 0.175, mFerro, 0, 0.045, -0.012, 1.02, 0.78, 1.03, 12)
  cil(testa, re ? 0.2 : 0.185, re ? 0.2 : 0.185, 0.035, mFerro, 0, -0.01, 0.0, 14)
  scatola(testa, 0.05, 0.12, 0.03, mFerro, 0, -0.02, 0.17)                                       // il paranaso
  cil(testa, 0.015, 0.015, 0.06, M(0x3a3028), 0, 0.2, 0, 6)
  sfera(testa, 0.05, M(pelle), 0, -0.045, 0.16, 1, 0.9, 1, 8)                                         // il nasone
  for (const s of [-1, 1]) {
    occhio(testa, s * 0.062, 0.015, 0.145, 0.026, re ? 0xff5ac8 : 0xc060ff, { emis: 1.5, giro: s * 0.3, fessura: false })
    scatola(testa, 0.1, 0.03, 0.05, barbaM, s * 0.065, 0.055, 0.14).rotation.z = s * -0.3
    sfera(testa, 0.03, M(0x7b8870), s * 0.1, -0.05, 0.1, 1, 0.8, 1, 6)
    ciuffo(testa, barbaM, s * 0.04, -0.06, 0.17, [s * 1, -0.3, 0.3], 0.02, 0.1, 4)                // i baffi
  }
  const barba = []
  const NB = re ? 11 : 9
  for (let q = 0; q < NB; q++) { const a = (q / (NB - 1) - 0.5) * PI * 1.0; const c = ciuffo(testa, barbaM, Math.sin(a) * 0.13, -0.09, Math.cos(a) * 0.12 + 0.04, [Math.sin(a) * 0.3, -1, 0.3], 0.045, (re ? 0.38 : 0.26) - Math.abs(a) * 0.08, 5); barba.push(c); if (q % 3 === 0) senzaOmbra(cono(c, 0.02, 0.05, re ? vena : cristalli, 0, -0.15, 0, 4)).rotation.x = PI }
  if (re) {                                                                                           // le corna dell'elmo e la gemma in fronte
    for (const s of [-1, 1]) { ciuffo(testa, M(0xe9dfc5), s * 0.17, 0.06, 0, [s * 1, 0.4, 0], 0.045, 0.22, 6); ciuffo(testa, M(0xe9dfc5), s * 0.34, 0.2, 0, [s * 0.3, 1, 0], 0.03, 0.2, 6) }
    senzaOmbra(sfera(testa, 0.04, cristalli, 0, 0.1, 0.17, 1, 1, 0.6, 8))
    for (let q = 0; q < 5; q++) ciuffo(testa, mOro, (q - 2) * 0.07, 0.17, 0.0, [0, 1, 0], 0.022, 0.1 + (2 - Math.abs(q - 2)) * 0.02, 4)   // la corona
  }
  // la corruzione: cristalli violacei che spuntano dalla schiena e dalla spalla, vene luminose sulle braccia
  const cr = []
  for (let q = 0; q < (re ? 6 : 4); q++) { const c = senzaOmbra(ciuffo(busto, cristalli, -0.16 + q * 0.07, 0.3 + (q % 2) * 0.1, -0.12 - (q % 3) * 0.03, [(q - 2) * 0.3, 1, -0.5], 0.04 + (q % 2) * 0.015, 0.16 + (q % 3) * 0.07, 5)); cr.push(c) }
  for (const s of [-1, 1]) senzaOmbra(ciuffo(bracci[s < 0 ? 0 : 1], cristalli, s * 0.03, 0.02, -0.02, [s * 0.7, 1, 0], 0.035, 0.14, 5))
  gomiti.forEach((go, i) => { senzaOmbra(scatola(go, 0.014, 0.14, 0.014, vena, (i ? 1 : -1) * 0.07, -0.14, 0.02)); senzaOmbra(scatola(go, 0.014, 0.1, 0.014, vena, (i ? 1 : -1) * 0.065, -0.09, -0.03)).rotation.z = 0.3 })
  // l'attrezzo nella destra: piccone, o il martello da guerra del re
  const arma = attrezzo(mani[1], re ? { lung: 0.95, martello: true, ferro, cristallo: cristalli } : { lung: 0.72 }); arma.position.set(0, -0.1, 0); arma.rotation.set(0.15, 0, 0)
  rozza(mani[0], 0.05, M(0x6a3a22), 0, -0.1, 0.0, 1, 1.2, 1, 0)                                          // la sinistra stringe una sacca di minerale
  g.scale.setScalar(re ? 1.55 : 0.88)
  chiudi(g, T => {
    idleUmano(P, T, { respiro: 0.035, rit: re ? 0.8 : 1.25, riposoB: [-0.15, -0.5], zB: 0.22, gom: [-0.35, -1.0], testa: [0.12, 0], oscilla: 0.07, peso: 0.04, bob: 0.03 })
    const mu = evento(T, 4.6, 1.4, 1), rg = evento(T, 7.1, 1.8, 3), pul = 0.5 + 0.5 * Math.sin(T * 3.4)
    testa.rotation.x += mu.b * 0.18 + Math.sin(T * 9) * 0.04 * mu.b; testa.rotation.z += Math.sin(T * 5) * 0.05 * mu.b      // borbotta fra sé
    bracci[1].rotation.x += -rg.b * 0.5; gomiti[1].rotation.x += -rg.b * 0.4; bracci[0].rotation.x += -rg.b * 0.5; busto.rotation.x += rg.b * -0.1   // alza l'attrezzo con un grugnito
    arma.rotation.x = 0.15 + Math.sin(T * 1.9) * 0.05
    barba.forEach((b, q) => { b.rotation.z = Math.sin(T * 1.7 + q * 0.6) * 0.06 })
    cristalli.emissiveIntensity = 1.3 + pul * 1.5 + rg.b; vena.emissiveIntensity = 1.0 + pul * 1.2
  })
  dichiara(g, re ? 'martellata' : 'picconata', 0.9, 0.55)                       // alza l'attrezzo dietro la spalla e lo cala con tutto il peso
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.55)
    bracci[1].rotation.x += -W * 1.0 + L * 1.25; gomiti[1].rotation.x += -W * 0.2 + L * 0.7
    bracci[0].rotation.x += -W * 0.6 + L * 0.2
    busto.rotation.x += -W * 0.3 + L * 0.4; testa.rotation.x += -W * 0.2 + L * 0.2
    g.position.z += L * 0.28; P.gambe[1].rotation.x += -L * 0.3; P.gambe[0].rotation.x += W * 0.15
    cristalli.emissiveIntensity += L * 2 + W
  }
  void k
  return g
}

// ══════════════════════════════════════ IL MINATORE NON MORTO ══════════════════════════════════════
export function creaMinatoreMorto () {
  const osso = 0xe3d8bc, ombra = 0xb3a584, straccio = 0x4a3b2c
  const P = figura({ pelle: osso, pelle2: ombra, calzoni: 0x3a3026, veste: straccio, scarpa: 0x2a2018, gamba: 0.46, busto: [0.34, 0.42, 0.2], testa: 0.125, braccio: 0.5, gr: 0.032, sg: 0.04, spalla: 0, collo: 0.04, mano: 1.5, piede: 1.3, seg: 6, bracciaMat: M(osso) })
  const { g, busto, testa, bracci, gomiti, mani } = P
  const o1 = M(osso), o2 = M(ombra), buio = lucido(0x0d0a09), ruggine = M(0x8e6b52, { roughness: 0.55, metalness: 0.5 }), giallo = M(0xb59a38, { roughness: 0.6, metalness: 0.2 })
  const occhiM = lumi(0x7ff0ff, 2.2), lente = lumi(0xfff0a0, 3.0, { flatShading: false })
  // il torace scoperto: le costole ad arco sul davanti, lo sterno, la schiena di stracci con le bretelle
  for (let q = 0; q < 5; q++) {
    const arco = PI * (1.5 - q * 0.04), geo = new THREE.TorusGeometry(0.115 - Math.abs(q - 1.5) * 0.008, 0.012, 5, 14, arco)
    geo.rotateZ(PI / 2 - arco / 2); geo.rotateX(PI / 2)
    const c = new THREE.Mesh(geo, o1); c.castShadow = true; c.position.set(0, 0.12 + q * 0.062, 0.0); c.scale.set(1.15, 1, 0.95); busto.add(c)
  }
  scatola(busto, 0.035, 0.26, 0.025, o1, 0, 0.26, 0.11)
  for (const s of [-1, 1]) scatola(busto, 0.035, 0.46, 0.22, M(0x2f2a22), s * 0.1, 0.24, 0.0).rotation.z = s * 0.05           // le bretelle
  for (let q = -2; q <= 2; q++) scatola(busto, 0.06, 0.16 + (q & 1) * 0.07, 0.01, M(straccio, { side: THREE.DoubleSide }), q * 0.065, -0.05 - (q & 1) * 0.02, 0.1)
  scatola(busto, 0.36, 0.05, 0.22, M(0x2f2018), 0, 0.01, 0)
  // il teschio: orbite col lume azzurro, naso, mandibola che tintinna, l'elmetto col lume da minatore
  rozza(testa, 0.1, o1, 0, -0.01, 0.0, 1.0, 1.05, 1.08, 1); sfera(testa, 0.07, o1, 0, -0.07, 0.05, 1.2, 0.8, 1.0, 10)
  for (const s of [-1, 1]) { sfera(testa, 0.04, buio, s * 0.05, 0.0, 0.085, 1, 1.15, 0.7, 9); senzaOmbra(sfera(testa, 0.02, occhiM, s * 0.05, 0.0, 0.1, 1, 1, 0.6, 7)) }
  const naso = cono(testa, 0.02, 0.04, buio, 0, -0.045, 0.1, 3); naso.rotation.x = PI; naso.rotation.y = PI / 2
  const mascella = perno(testa, 0, -0.1, 0.01)
  scatola(mascella, 0.12, 0.03, 0.1, o1, 0, -0.01, 0.06)
  for (let q = -2; q <= 2; q++) { scatola(mascella, 0.017, 0.03, 0.015, M(0xf1e8cf), q * 0.024, 0.02, 0.1 - Math.abs(q) * 0.008); scatola(testa, 0.017, 0.03, 0.015, M(0xf1e8cf), q * 0.024, -0.115, 0.1 - Math.abs(q) * 0.008) }
  sfera(testa, 0.115, giallo, 0, 0.05, -0.01, 1.02, 0.75, 1.05, 12)                                    // l'elmetto
  cil(testa, 0.14, 0.14, 0.025, giallo, 0, 0.04, 0.005, 12)
  const lampada = perno(testa, 0, 0.1, 0.1)
  cil(lampada, 0.03, 0.04, 0.05, ruggine, 0, 0, 0, 8).rotation.x = PI / 2; senzaOmbra(sfera(lampada, 0.03, lente, 0, 0, 0.035, 1, 1, 0.5, 8))
  // la pala nella destra, un lume penzolante nella sinistra
  const arma = perno(mani[1], 0, -0.08, 0); arma.rotation.x = 0.15
  const t = perno(arma, 0, 0, 0); t.rotation.x = PI / 2
  cil(t, 0.018, 0.018, 0.6, M(0x6e4a2c), 0, 0.2, 0, 6); scatola(t, 0.16, 0.2, 0.02, ruggine, 0, 0.58, 0); scatola(t, 0.06, 0.04, 0.03, M(0x5a4636), 0, 0.47, 0)
  const lume = perno(mani[0], 0, -0.06, 0)
  cil(lume, 0.004, 0.004, 0.1, ruggine, 0, -0.05, 0, 4); senzaOmbra(sfera(lume, 0.045, lumi(0x7ff0ff, 1.8), 0, -0.14, 0, 1, 1.2, 1, 8)); scatola(lume, 0.1, 0.012, 0.1, ruggine, 0, -0.08, 0)
  chiudi(g, T => {
    idleUmano(P, T, { respiro: 0.02, rit: 1.1, riposoB: [-0.18, -0.55], zB: 0.12, gom: [-0.5, -1.0], testa: [0.1, 0], oscilla: 0.08, peso: 0.04, bob: 0.03 })
    const ti = evento(T, 4.6, 0.9, 1), te = evento(T, 8.3, 2.0, 5), tr = Math.sin(T * 47)
    mascella.rotation.x = 0.08 + Math.max(0, Math.sin(T * 1.4)) * 0.12 + ti.b * (0.15 + 0.12 * Math.sin(T * 38))                                // tintinna la mascella
    testa.rotation.z += te.b * 0.35; testa.rotation.x += te.b * 0.15; busto.rotation.z += tr * 0.015 * ti.b; busto.rotation.y += te.b * 0.15      // ogni tanto la testa gli casca di lato, poi la raddrizza
    bracci[0].rotation.x += Math.sin(T * 2.1) * 0.08; lume.rotation.z = Math.sin(T * 1.6) * 0.3; lume.rotation.x = Math.sin(T * 1.3 + 1) * 0.15      // il lume ondeggia
    arma.rotation.x = 0.15 + Math.sin(T * 1.5) * 0.05
    lente.emissiveIntensity = 2.4 + Math.sin(T * 11) * 0.5 + Math.sin(T * 3.1) * 0.4 + (Math.sin(T * 0.9) > 0.97 ? -1.8 : 0)                    // la lampada sfarfalla
    occhiM.emissiveIntensity = 1.8 + Math.sin(T * 4) * 0.5 + te.b
  })
  dichiara(g, 'badilata', 0.9, 0.55)                                            // solleva la pala di lato e la sbatte con la lama piatta
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.55), ap = apertura(p, 0.55)
    bracci[1].rotation.x += -W * 1.0 + L * 1.2; bracci[1].rotation.z += W * 0.3; gomiti[1].rotation.x += -W * 0.3 + L * 0.8
    bracci[0].rotation.x += -W * 0.5 + L * 0.2; busto.rotation.x += -W * 0.2 + L * 0.35; busto.rotation.y += W * 0.25 - L * 0.3
    testa.rotation.x += -W * 0.2 + L * 0.25; mascella.rotation.x += ap * 0.6
    g.position.z += L * 0.3; P.gambe[1].rotation.x += -L * 0.25; P.gambe[0].rotation.x += W * 0.15
    occhiM.emissiveIntensity += L * 2
  }
  return g
}

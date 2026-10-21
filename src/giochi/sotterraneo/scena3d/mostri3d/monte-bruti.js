// Generato da strumenti/promuovi-3d.mjs da poc/mostri-3d/monte-bruti.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Il monte, 2/4: i bruti a due gambe: il troll con la clava (caporale del passo), lo yeti, il gigante di montagna (superboss).
import {
  THREE, M, sfera, rozza, scatola, cil, cono, perno, PI, V3, lumi, lum, lucido, senzaOmbra, figura, idleUmano, ritmo, apertura, marcatore, dichiara,
  evento, chiudi, occhio, ciuffo, arto, liscio,
} from './monte-base.js'

/** La clava: tronco che si allarga, nodi, borchie di ferro. Torna un perno con l'asse lungo +z (si monta su una mano: +z è «su» ad avambraccio teso). */
function clava (padre, { lung = 1.0, rt = 0.17, rb = 0.055, legno = 0x6e4a2c, ferro = 0x59595f, borchie = 10, pietra = 0 } = {}) {
  const c = perno(padre, 0, 0, 0), t = perno(c, 0, 0, 0); t.rotation.x = PI / 2
  const mL = M(legno), mF = M(ferro, { roughness: 0.5, metalness: 0.5 })
  cil(t, rt, rb, lung, mL, 0, lung * 0.5 - 0.1, 0, 9)
  cil(t, rb * 1.15, rb * 1.15, 0.2, M(0x2f2018), 0, 0.0, 0, 8)                           // l'impugnatura fasciata
  rozza(t, rt * 0.7, mL, rt * 0.4, lung * 0.78, rt * 0.6, 1, 1, 1, 0)                     // un nodo
  const R = rt * 0.95
  for (let k = 0; k < borchie; k++) {
    const a = k * 2.4, y = lung * (0.62 + (k % 4) * 0.09), d = new V3(Math.cos(a), 0, Math.sin(a))
    ciuffo(t, mF, d.x * R, y - 0.1, d.z * R, [d.x, 0.15, d.z], 0.03, 0.09, 5)
  }
  cil(t, rt * 1.02, rt * 1.0, 0.05, mF, 0, lung * 0.55 - 0.1, 0, 9)                        // la fascia di ferro
  if (pietra) { const r = rozza(t, pietra, M(0x7d786d), 0, lung * 0.9 - 0.1, 0, 1, 1.1, 1, 1); r.rotation.y = 0.5 }
  return c
}

// ══════════════════════════════════════ IL TROLL CON LA CLAVA ══════════════════════════════════════
export function creaTroll () {
  const pelle = 0x7f8a68, scuro = 0x5c6650, pelo = M(0x2b241d)
  const P = figura({ pelle, pelle2: scuro, calzoni: 0x5a4632, veste: pelle, scarpa: 0x4a3a2a, gamba: 0.55, busto: [0.72, 0.7, 0.58], testa: 0.2, braccio: 0.72, gr: 0.105, sg: 0.115, spalla: 0.14, collo: 0.0, mano: 1.5, piede: 1.15 })
  const { g, busto, testa, bracci, gomiti, mani } = P
  const osso1 = M(0xe6dcc0), buio = lucido(0x1c1512), marcio = M(0x566040)
  sfera(busto, 0.3, M(0x98a37e), 0, 0.26, 0.2, 1.1, 0.95, 0.8, 12)                          // la pancia
  for (let k = 0; k < 7; k++) { const a = (k / 6 - 0.5) * 2.0; ciuffo(busto, osso1, Math.sin(a) * 0.3, 0.6 - Math.abs(a) * 0.1, 0.2 + Math.cos(a) * 0.12, [0, -1, 0.3], 0.025, 0.1, 4) }   // la collana di denti
  for (let k = 0; k < 5; k++) scatola(busto, 0.1, 0.24 - Math.abs(k - 2) * 0.03, 0.03, M(0x6a4a30, { side: THREE.DoubleSide }), (k - 2) * 0.12, -0.12, 0.22).rotation.z = (k - 2) * 0.07   // il gonnellino di pelle
  scatola(busto, 0.74, 0.07, 0.6, M(0x3a2a1c), 0, 0.02, 0)                                  // la cintura
  rozza(busto, 0.2, M(0x6a4a30), -0.36, 0.62, 0, 1.2, 0.8, 1.2, 1)                          // una spallina di pelliccia
  for (let k = 0; k < 4; k++) ciuffo(busto, pelo, (k - 1.5) * 0.12, 0.85 - Math.abs(k - 1.5) * 0.05, -0.2, [0, 0.5, -1], 0.04, 0.16)
  for (let k = 0; k < 6; k++) { const w = sfera(busto, 0.02 + (k % 2) * 0.01, marcio, -0.25 + k * 0.1, 0.3 + (k * 0.13) % 0.4, 0.3, 1, 1, 0.7, 6); void w }
  // la faccia: sopracciglio unico, occhietti gialli, nasone, mascella in fuori con due zanne, orecchie a punta
  rozza(testa, 0.12, M(0x8d9873), 0, -0.04, 0.14, 1.0, 0.8, 0.9, 1)
  rozza(testa, 0.07, M(0x98a37e), 0, -0.02, 0.22, 1, 1, 1, 1)
  scatola(testa, 0.28, 0.05, 0.08, M(scuro), 0, 0.09, 0.17).rotation.x = 0.3
  for (const s of [-1, 1]) {
    occhio(testa, s * 0.075, 0.045, 0.17, 0.034, 0xffd23a, { emis: 0.9, giro: s * 0.3 })
    const o = cono(testa, 0.05, 0.22, M(pelle), s * 0.2, 0.0, -0.02, 4); o.rotation.z = s * -1.45; o.rotation.x = -0.2
    sfera(testa, 0.02, marcio, s * 0.1, -0.03, 0.2, 1, 1, 0.8, 6)
  }
  const mascella = perno(testa, 0, -0.1, 0.06)
  rozza(mascella, 0.1, M(scuro), 0, -0.02, 0.08, 1.15, 0.6, 1.0, 1)
  sfera(mascella, 0.07, buio, 0, 0.03, 0.06, 1.2, 0.3, 1.0, 7)
  for (const s of [-1, 1]) { ciuffo(mascella, osso1, s * 0.07, 0.02, 0.15, [s * 0.15, 1, 0.3], 0.025, 0.12, 5); ciuffo(testa, osso1, s * 0.05, -0.1, 0.15, [0, -1, 0.1], 0.015, 0.05, 4) }
  for (let k = 0; k < 4; k++) ciuffo(testa, pelo, (k - 1.5) * 0.06, 0.18, -0.02, [(k - 1.5) * 0.2, 1, -0.3], 0.025, 0.1)
  // la clava nella destra
  const arma = clava(mani[1], { lung: 1.05, rt: 0.17 }); arma.position.set(0, -0.14, 0); arma.rotation.set(0.15, 0, 0)
  // la sinistra stringe una pelle di capra come borsa
  rozza(mani[0], 0.1, M(0x8a6a48), 0, -0.2, 0.0, 1, 1.2, 1, 1)
  chiudi(g, T => {
    idleUmano(P, T, { respiro: 0.03, rit: 0.85, riposoB: [-0.1, -0.5], zB: 0.18, gom: [-0.25, -1.0], testa: [0.2, 0], oscilla: 0.05, peso: 0.03, bob: 0.03 })
    const ru = evento(T, 8.3, 2.2, 3), gr = evento(T, 5.1, 1.0), rug = Math.sin(T * 27) * 0.05
    busto.rotation.x += 0.22 + ru.b * -0.18                                            // gobbo, e ogni tanto si drizza e ruggisce
    testa.rotation.x += -ru.b * 0.5; mascella.rotation.x = 0.1 + Math.max(0, Math.sin(T * 1.5)) * 0.1 + ru.b * 0.7 + rug * ru.b
    bracci[0].rotation.x += -ru.b * 0.5; bracci[1].rotation.x += -ru.b * 0.25; bracci[0].rotation.z += -ru.b * 0.4
    const gratta = gr.b                                                              // la sinistra si gratta la pancia
    bracci[0].rotation.x += -gratta * 0.4; gomiti[0].rotation.x += -gratta * 0.8 + Math.sin(T * 12) * 0.12 * gratta
    arma.rotation.x = 0.15 + Math.sin(T * 1.7) * 0.05
  })
  dichiara(g, 'clavata', 0.95, 0.55)                                            // solleva la clava dietro la schiena e la abbatte
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.55)
    bracci[1].rotation.x += -W * 0.95 + L * 1.2; gomiti[1].rotation.x += -W * 0.2 + L * 0.7
    bracci[0].rotation.x += -W * 0.6 + L * 0.2; bracci[0].rotation.z += -W * 0.3
    busto.rotation.x += -W * 0.3 + L * 0.4; testa.rotation.x += -W * 0.2 + L * 0.2; mascella.rotation.x += apertura(p, 0.55) * 0.7
    g.position.z += L * 0.3; busto.position.y -= L * 0.06; P.gambe[1].rotation.x += -L * 0.25; P.gambe[0].rotation.x += W * 0.15
  }
  return g
}

// ══════════════════════════════════════ LO YETI ══════════════════════════════════════
export function creaYeti () {
  const pelo1 = 0xf3f7fa, pelo2 = 0xd8e3ed, base = 0xbfcddb, ombra = 0x93a8bd
  const P = figura({ pelle: base, pelle2: ombra, calzoni: base, veste: base, scarpa: ombra, gamba: 0.42, busto: [0.82, 0.72, 0.62], testa: 0.22, braccio: 0.9, gr: 0.115, sg: 0.125, spalla: 0.17, mano: 1.6, piede: 1.3 })
  const { g, busto, testa, bracci, gomiti, mani } = P
  const m1 = M(pelo1), m2 = M(pelo2), m3 = M(ombra), faccia = M(0x5d81a6), buio = lucido(0x141c28), dente = M(0xf6f1e0), artiglio = M(0x38424f)
  const F = (padre, x, y, z, dir, r = 0.05, h = 0.15, mm = m2) => ciuffo(padre, mm, x, y, z, dir, Math.max(r, h * 0.38), h, 5)   // un ciuffo = un grumo di pelo
  for (let row = 0; row < 5; row++) for (let k = 0; k < 11; k++) { const a = (k + (row % 2) * 0.5) / 11 * PI * 2, y = 0.7 - row * 0.14, rr = 0.2 + Math.sin(Math.min(1, (y + 0.06) / 0.76) * PI) * 0.2; F(busto, Math.cos(a) * rr * 1.0, y, Math.sin(a) * rr * 0.78, [Math.cos(a) * 0.55, -1, Math.sin(a) * 0.55], 0.07, 0.24, (k + row) % 2 ? m1 : m2) }   // il pelo lungo e cascante sul tronco
  for (let k = 0; k < 8; k++) F(busto, (k - 3.5) * 0.09, 0.72 - Math.abs(k - 3.5) * 0.02, -0.28, [0, -0.3, -1], 0.06, 0.24, k % 2 ? m1 : m2)
  for (const [i, s] of [[0, -1], [1, 1]]) {
    for (let k = 0; k < 5; k++) F(bracci[i], s * 0.1, -0.06 - k * 0.1, 0.0, [s * 0.5, -1, 0.1], 0.05, 0.2, k % 2 ? m1 : m2)
    for (let k = 0; k < 5; k++) F(gomiti[i], s * 0.08, -0.06 - k * 0.1, 0.0, [s * 0.5, -1, 0.1], 0.045, 0.18, k % 2 ? m2 : m1)
    for (let k = -1; k <= 1; k++) ciuffo(mani[i], artiglio, k * 0.065, -0.2, 0.08, [k * 0.1, -1, 0.35], 0.022, 0.1, 4)
    sfera(mani[i], 0.1, faccia, 0, -0.1, 0.0, 1, 0.8, 1, 8)                            // il palmo grigio-azzurro
    for (let k = 0; k < 4; k++) F(P.gambe[i], s * 0.1, -0.05 - k * 0.1, 0.0, [s * 0.3, -1, 0.1], 0.05, 0.16, k % 2 ? m1 : m2)
  }
  // la testa: pelo lungo che incornicia il muso azzurro, grandi arcate, naso largo, bocca piena di zanne
  for (let k = 0; k < 9; k++) { const a = (k / 8 - 0.5) * PI * 1.5; F(testa, Math.sin(a) * 0.2, 0.06 + Math.cos(a) * 0.1, Math.cos(a) * 0.02 - 0.03, [Math.sin(a) * 0.5, -0.6, -0.2], 0.055, 0.22, k % 2 ? m1 : m2) }
  for (let k = 0; k < 4; k++) F(testa, (k - 1.5) * 0.08, 0.17, 0.02, [(k - 1.5) * 0.3, 1, 0.5], 0.04, 0.18, m1)   // il ciuffo sopra la fronte
  rozza(testa, 0.17, faccia, 0, -0.03, 0.1, 1.05, 0.95, 0.95, 1)
  for (const s of [-1, 1]) scatola(testa, 0.14, 0.055, 0.06, m2, s * 0.085, 0.1, 0.23).rotation.z = s * 0.42
  sfera(testa, 0.06, buio, 0, -0.04, 0.265, 1.4, 0.8, 0.7, 8)
  for (const s of [-1, 1]) occhio(testa, s * 0.075, 0.03, 0.235, 0.032, 0x35607f, { emis: 0.35, giro: s * 0.3, pupilla: 0x10202c, bianco: 0xf0f6ff })
  const mascella = perno(testa, 0, -0.11, 0.1)
  rozza(mascella, 0.1, m3, 0, -0.01, 0.08, 1.2, 0.5, 1.0, 1); sfera(mascella, 0.075, buio, 0, 0.03, 0.07, 1.25, 0.3, 1.0, 7)
  for (const s of [-1, 1]) { ciuffo(mascella, dente, s * 0.075, 0.03, 0.14, [0, 1, 0.1], 0.022, 0.13, 5); ciuffo(testa, dente, s * 0.06, -0.09, 0.2, [0, -1, 0.1], 0.02, 0.09, 5) }
  for (let k = -2; k <= 2; k++) ciuffo(mascella, dente, k * 0.03, 0.03, 0.16, [0, 1, 0.1], 0.01, 0.04, 4)
  const lastra = []                                                                  // una lastra di brina sulla spalla e ghiaccioli alle spalle
  for (let k = 0; k < 3; k++) lastra.push(ciuffo(busto, M(0xdff3ff, { roughness: 0.15 }), 0.28, 0.72, -0.05 + k * 0.1, [0.5, 1, 0], 0.035, 0.18, 4))
  chiudi(g, T => {
    idleUmano(P, T, { respiro: 0.04, rit: 0.9, riposoB: [-0.08, -0.08], zB: 0.3, gom: [-0.2, -0.2], testa: [0.15, 0], oscilla: 0.06, peso: 0.04, bob: 0.03 })
    const bt = evento(T, 8.1, 2.4), ru = evento(T, 12.7, 2.0, 6), picchia = Math.sin(T * 17)
    busto.rotation.x += 0.2
    bracci[0].rotation.x += -bt.b * 0.5; bracci[1].rotation.x += -bt.b * 0.5; gomiti[0].rotation.x += -bt.b * 1.7 + picchia * bt.b * 0.15; gomiti[1].rotation.x += -bt.b * 1.7 - picchia * bt.b * 0.15  // si batte il petto
    bracci[0].rotation.z += -bt.b * 0.2; bracci[1].rotation.z += bt.b * 0.2; busto.scale.x += bt.b * 0.04
    testa.rotation.x += -ru.b * 0.45 - bt.b * 0.2; mascella.rotation.x = 0.1 + Math.max(0, Math.sin(T * 1.7)) * 0.1 + ru.b * 0.75
    bracci[0].rotation.z += -ru.b * 0.5; bracci[1].rotation.z += ru.b * 0.5; busto.rotation.x += -ru.b * 0.15
    P.gambe[0].rotation.x += Math.sin(T * 0.5) * 0.04
  })
  dichiara(g, 'schianto', 0.95, 0.55)                                           // ruggisce, alza i pugni e li schianta
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.55)
    bracci.forEach(b => { b.rotation.x += -W * 2.5 + L * 0.0 - L * 0.9 }); gomiti.forEach(go => { go.rotation.x += -W * 0.2 + L * 0.1 })
    busto.rotation.x += -W * 0.3 + L * 0.45; testa.rotation.x += -W * 0.35 + L * 0.35; mascella.rotation.x += apertura(p, 0.55) * 0.8
    g.position.z += L * 0.3; busto.position.y -= L * 0.08
  }
  return g
}

// ══════════════════════════════════════ IL GIGANTE DI MONTAGNA ══════════════════════════════════════
export function creaGigante () {
  const pelle = 0xbb9f84, scuro = 0x8b735c, pelliccia = M(0xd6cfc0), pelliccia2 = M(0x9b8d77)
  const P = figura({ pelle, pelle2: scuro, calzoni: 0x4d3a2a, veste: 0x5b4433, scarpa: 0x3d2e22, gamba: 0.62, busto: [0.8, 0.74, 0.52], testa: 0.2, braccio: 0.78, gr: 0.1, sg: 0.125, spalla: 0.17, collo: 0.02, mano: 1.4, piede: 1.1 })
  const { g, busto, testa, bracci, gomiti, mani } = P
  const ferro = M(0x5d6068, { roughness: 0.5, metalness: 0.55 }), corno = M(0xe9dfc5), buio = lucido(0x1b1411)
  const runa = lumi(0x7fd8ff, 1.8)
  // il mantello di pelliccia sulle spalle e sul petto, la cintura di ferro, il gonnellino di cuoio
  for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2, rx = 0.46, rz = 0.34; ciuffo(busto, k % 2 ? pelliccia : pelliccia2, Math.cos(a) * rx, 0.66 + Math.sin(a * 3) * 0.02, Math.sin(a) * rz, [Math.cos(a), -0.55, Math.sin(a)], 0.075, 0.27, 5) }
  rozza(busto, 0.24, pelliccia, -0.42, 0.66, -0.02, 1.2, 0.8, 1.2, 1); rozza(busto, 0.22, pelliccia, 0.42, 0.66, -0.02, 1.2, 0.8, 1.2, 1)
  rozza(busto, 0.3, pelliccia2, 0, 0.62, -0.18, 1.5, 0.6, 0.8, 1)
  scatola(busto, 0.84, 0.1, 0.56, ferro, 0, 0.04, 0)
  for (let k = 0; k < 5; k++) scatola(busto, 0.12, 0.26, 0.03, M(0x6a5038, { side: THREE.DoubleSide }), (k - 2) * 0.14, -0.14, 0.26).rotation.z = (k - 2) * 0.05
  sfera(busto, 0.06, M(0xc9a23a, { metalness: 0.7, roughness: 0.3 }), 0, 0.04, 0.29, 1, 1, 0.5, 8)   // la fibbia dorata
  // la testa: elmo di ferro con due corna enormi, barba folta, sopracciglia pesanti, occhi chiari incavati
  rozza(testa, 0.215, ferro, 0, 0.07, -0.01, 1.05, 0.75, 1.05, 1)
  scatola(testa, 0.05, 0.14, 0.04, ferro, 0, -0.0, 0.2)                                   // il paranaso
  for (const s of [-1, 1]) {
    ciuffo(testa, corno, s * 0.2, 0.1, 0, [s * 1.0, 0.5, 0], 0.07, 0.3, 6); ciuffo(testa, corno, s * 0.46, 0.25, 0, [s * 0.4, 1.0, 0], 0.045, 0.28, 6)
    occhio(testa, s * 0.08, 0.0, 0.18, 0.034, 0x9fe6ff, { emis: 1.2, giro: s * 0.3, pupilla: 0x10202c })
    scatola(testa, 0.12, 0.04, 0.06, pelliccia2, s * 0.08, 0.06, 0.18).rotation.z = s * -0.3
    ciuffo(testa, pelliccia2, s * 0.15, -0.06, 0.1, [s * 0.5, -0.5, 0.3], 0.04, 0.12, 4)
  }
  rozza(testa, 0.06, M(0xc8a88b), 0, -0.04, 0.2, 1.1, 1.1, 1, 1)                           // il nasone
  const barba = []
  for (let k = 0; k < 11; k++) { const a = (k / 10 - 0.5) * PI * 1.1, c = ciuffo(testa, k % 2 ? pelliccia : pelliccia2, Math.sin(a) * 0.15, -0.1, Math.cos(a) * 0.14 + 0.03, [Math.sin(a) * 0.4, -1, 0.35], 0.06, 0.3 - Math.abs(a) * 0.1, 5); barba.push(c) }
  for (const s of [-1, 1]) ciuffo(testa, pelliccia, s * 0.04, -0.08, 0.2, [s * 1, -0.2, 0.3], 0.025, 0.12, 4)   // i baffi
  for (let k = 0; k < 6; k++) ciuffo(testa, pelliccia2, (k - 2.5) * 0.07, 0.0, -0.18, [0, -0.7, -0.5], 0.045, 0.28, 4)  // i capelli lunghi da sotto l'elmo
  // le rune azzurre sulle braccia
  gomiti.forEach((go, i) => { const s = i ? 1 : -1; senzaOmbra(scatola(go, 0.025, 0.2, 0.02, runa, s * 0.1, -0.2, 0.0)); senzaOmbra(scatola(bracci[i], 0.025, 0.14, 0.02, runa, s * 0.1, -0.2, 0.0)) })
  // l'arma: una clava col testone di pietra a destra; a sinistra un masso da lanciare
  const arma = clava(mani[1], { lung: 1.35, rt: 0.12, rb: 0.05, legno: 0x5a3e26, borchie: 6, pietra: 0.26 }); arma.position.set(0, -0.14, 0); arma.rotation.set(0.12, 0, 0)
  const masso = perno(mani[0], 0, 0, 0.3)
  rozza(masso, 0.3, M(0x857f73), 0, 0, 0, 1.0, 0.9, 1.05, 1); rozza(masso, 0.14, M(0x6f6a60), 0.18, 0.1, 0.1, 1, 1, 1, 0)
  ciuffo(masso, M(0x5f7d3a), -0.08, 0.26, 0, [0, 1, 0], 0.04, 0.1, 4)
  const mira = marcatore(masso, 0, 0, 0)
  g.scale.setScalar(1.35)
  chiudi(g, T => {
    idleUmano(P, T, { respiro: 0.025, rit: 0.6, riposoB: [-0.2, -0.45], zB: 0.2, gom: [-0.95, -1.0], testa: [0.08, 0], oscilla: 0.04, peso: 0.03, bob: 0.03 })
    const ev = evento(T, 9.1, 2.4, 2), sbuffo = evento(T, 5.3, 0.9)
    runa.emissiveIntensity = 1.2 + (0.5 + 0.5 * Math.sin(T * 2.4)) * 1.2 + ev.b * 1.5
    masso.rotation.set(T * 0.0, 0, 0); masso.scale.setScalar(1); masso.position.set(0, -0.0, 0.3 + Math.sin(T * 1.5) * 0.01)
    bracci[0].rotation.x += -ev.b * 0.4 + Math.sin(T * 1.5) * 0.04; gomiti[0].rotation.x += -ev.b * 0.2     // scrolla il masso come fosse una mela
    bracci[1].rotation.x += -ev.b * 0.3; arma.rotation.x = 0.12 + Math.sin(T * 1.2) * 0.04
    busto.rotation.x += ev.b * -0.12; testa.rotation.x += -ev.b * 0.2 + sbuffo.b * 0.1; testa.rotation.z += ev.b * 0.1
    barba.forEach((b, k) => { b.rotation.z = Math.sin(T * 1.6 + k * 0.6) * 0.06 + Math.sin(T * 0.9) * 0.03 })
  })
  dichiara(g, 'lancio', 1.1, 0.5, { tipo: 'masso', origine: mira })               // carica indietro il braccio e scaglia il masso
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.5)
    bracci[0].rotation.x += -W * 2.2 + L * 0.9; gomiti[0].rotation.x += -W * 0.2 + L * 1.0
    bracci[1].rotation.x += -W * 0.8 + L * 0.4; bracci[1].rotation.z += W * 0.2
    busto.rotation.x += -W * 0.35 + L * 0.45; busto.rotation.y += W * 0.25 - L * 0.3; testa.rotation.x += -W * 0.2 + L * 0.2
    g.position.z += L * 0.25; P.gambe[0].rotation.x += -L * 0.2; P.gambe[1].rotation.x += W * 0.15
    masso.scale.setScalar(p < 0.5 ? 1 : liscio(0.82, 1, p))                         // dopo il lancio la mano è vuota; il masso «ricresce» in mano a fine mossa
  }
  return g
}

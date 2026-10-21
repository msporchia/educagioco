// Generato da strumenti/promuovi-3d.mjs da poc/mostri-3d/monte-fauna.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Il monte, 3/4: la fauna: capra di montagna e stambecco, lucertola di roccia e dei ghiacci, grifone, aquila gigante, pipistrello gigante.
import {
  THREE, M, mesh, sfera, rozza, scatola, cil, cono, perno, PI, V3, lumi, lum, lucido, senzaOmbra, ritmo, apertura, marcatore, dichiara,
  evento, chiudi, occhio, ciuffo, arto, zampa, penna, liscio,
} from './monte-base.js'
import { creaPipistrello } from './bosco.js'

const SIDE2 = { side: THREE.DoubleSide }

// ══════════════════════════════════════ LA CAPRA DI MONTAGNA E LO STAMBECCO ══════════════════════════════════════
const CAPRE = {
  capra: { pelo: 0xb2a48a, chiaro: 0xeee8da, scuro: 0x4a4036, corna: 0xcdbf9b, occhi: 0xe8b838, R: 0.15, arco: 2.1, barba: 0xe6dfcd },
  stambecco: { pelo: 0x7d5d3f, chiaro: 0xc9b08a, scuro: 0x2a2018, corna: 0xb9a67e, occhi: 0xd89a30, R: 0.27, arco: 2.7, barba: 0x3e2f20 },
}
export function creaCapra (v = 'capra') {
  const C = CAPRE[v], g = new THREE.Group(), corpo = perno(g, 0, 0, 0), tronco = perno(corpo, 0, 0, 0)
  const mp = M(C.pelo), mc = M(C.chiaro), ms = M(C.scuro), mcorna = M(C.corna, { roughness: 0.55 })
  rozza(tronco, 0.5, mp, 0, 0.62, 0, 0.44, 0.42, 0.95, 2); rozza(tronco, 0.3, mc, 0, 0.5, 0.05, 0.4, 0.38, 1.0, 1)
  rozza(tronco, 0.25, mp, 0, 0.62, -0.3, 1.2, 1.15, 1.2, 1); rozza(tronco, 0.22, mp, 0, 0.72, 0.24, 1.2, 1.05, 1.2, 1)
  for (let k = 0; k < 8; k++) ciuffo(tronco, k % 2 ? ms : mp, 0, 0.8 - Math.abs(k - 2) * 0.01, 0.32 - k * 0.09, [0, 0.9, -0.5], 0.04, 0.12, 4)   // la criniera sul dorso
  const Z = []
  for (const s of [-1, 1]) {
    Z.push(zampa(corpo, s * 0.13, 0.56, 0.3, [0, -0.24, 0.0], [0, -0.27, 0.02], 0.05, mp, ms, null, { zoccolo: true }))
    Z.push(zampa(corpo, s * 0.14, 0.56, -0.3, [0, -0.22, -0.05], [0, -0.28, 0.05], 0.058, mp, ms, null, { zoccolo: true }))
  }
  const collo = perno(corpo, 0, 0.66, 0.3)
  arto(collo, [0, 0, 0], [0, 0.22, 0.2], 0.1, 0.07, mp, 8)
  const testa = perno(collo, 0, 0.23, 0.21)
  rozza(testa, 0.1, mp, 0, 0, 0, 0.85, 0.95, 1.15, 1); rozza(testa, 0.065, mc, 0, -0.06, 0.12, 0.8, 0.7, 1.2, 1); sfera(testa, 0.026, lucido(0x1b1512), 0, -0.05, 0.21, 1.2, 0.8, 0.8, 7)
  const mascella = perno(testa, 0, -0.085, 0.07); rozza(mascella, 0.045, mc, 0, -0.008, 0.07, 0.9, 0.45, 1.5, 1)
  ciuffo(mascella, M(C.barba), 0, -0.02, 0.05, [0, -1, -0.2], 0.03, 0.15, 4)                                      // il pizzetto
  const orecchie = []
  for (const s of [-1, 1]) {
    const o = perno(testa, s * 0.09, 0.05, -0.05); o.rotation.z = s * -1.2; orecchie.push(o)
    cono(o, 0.04, 0.15, mp, 0, 0.08, 0, 4); cono(o, 0.022, 0.11, ms, 0, 0.07, 0.012, 4)
    occhio(testa, s * 0.085, 0.035, 0.065, 0.026, C.occhi, { emis: 0.5, giro: s * 0.95 })
    const base = perno(testa, s * 0.05, 0.09, -0.02); base.rotation.z = s * -0.3
    const R = C.R
    const c = mesh(base, new THREE.TorusGeometry(R, 0.03 + (v === 'stambecco' ? 0.012 : 0), 6, 16, C.arco), mcorna, 0, 0, -R); c.rotation.y = -PI / 2
    if (v === 'stambecco') for (let k = 1; k < 7; k++) { const a = k * C.arco / 7.5; const r = mesh(base, new THREE.TorusGeometry(0.036, 0.008, 4, 8), M(0x8a7a58), 0, Math.sin(a) * R, Math.cos(a) * R - R, 1, 1, 1); r.rotation.y = 0 }
  }
  const coda = perno(corpo, 0, 0.7, -0.46); cono(coda, 0.04, 0.14, mp, 0, 0.06, 0, 4); coda.rotation.x = -0.5
  chiudi(g, T => {
    const f = Math.sin(T * 2.4), w = Math.sin(T * 0.8), gr = evento(T, 9, 2.6, 1), gt = evento(T, 6.4, 1.8), fl = evento(T, 3.7, 0.4), cd = evento(T, 4.3, 0.9, 1)
    g.position.set(0, 0, 0); g.rotation.set(0, Math.sin(T * 0.4) * 0.06, 0)
    corpo.position.set(w * 0.015, Math.abs(Math.sin(T * PI * 1.3)) * 0.012, 0); corpo.rotation.set(Math.sin(T * 1.3) * 0.015 + gt.b * 0.03, 0, w * 0.02)
    tronco.scale.set(1 + f * 0.012, 1 + f * 0.026, 1)
    collo.rotation.set(0.05 + Math.sin(T * 0.7) * 0.07 + gr.b * 0.55, Math.sin(T * 0.45) * 0.28 + Math.sin(T * 1.1) * 0.04, Math.sin(T * 0.6) * 0.05)
    testa.rotation.set(0.05 + Math.sin(T * 0.9) * 0.06 + gr.b * 0.3, Math.sin(T * 0.37 + 1) * 0.2, Math.sin(T * 0.8) * 0.06)
    mascella.rotation.x = 0.02 + Math.max(0, Math.sin(T * 7)) * 0.13 * (0.5 + 0.5 * Math.sin(T * 0.5)) + gr.b * 0.15
    orecchie.forEach((o, i) => { o.rotation.x = Math.sin(T * 1.1 + i) * 0.1 + fl.b * (i ? 0.7 : 0.0) * Math.sin(T * 40) * 0.2 + fl.b * (i ? -0.5 : 0) })
    coda.rotation.x = -0.5 + Math.sin(T * 1.5) * 0.05 - cd.b * 0.5 + Math.sin(T * 18) * 0.2 * cd.b
    Z.forEach((z, i) => { z.anca.rotation.set(Math.sin(T * 0.9 + i * 2) * 0.012, 0, 0); z.gin.rotation.set(0, 0, 0) })
    Z[0].anca.rotation.x += -gt.b * 0.7 + Math.sin(T * 14) * 0.25 * gt.b; Z[0].gin.rotation.x += gt.b * 1.1 - Math.sin(T * 14) * 0.2 * gt.b   // raspa il sasso con lo zoccolo
  })
  dichiara(g, 'cornata', 0.75, 0.5)                                            // arretra, abbassa le corna e carica in avanti
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.5)
    corpo.position.z += -W * 0.14 + L * 0.5; corpo.position.y += L * 0.03; corpo.rotation.x += -W * 0.2 + L * 0.1
    collo.rotation.x += -W * 0.35 + L * 0.9; testa.rotation.x += -W * 0.15 + L * 0.4
    Z[0].anca.rotation.x += -L * 0.6 + W * 0.2; Z[2].anca.rotation.x += -L * 0.6 + W * 0.2; Z[1].anca.rotation.x += L * 0.45; Z[3].anca.rotation.x += L * 0.45
    Z[1].gin.rotation.x += L * 0.3; Z[3].gin.rotation.x += L * 0.3
  }
  return g
}

// ══════════════════════════════════════ LA LUCERTOLA DI ROCCIA E DEI GHIACCI ══════════════════════════════════════
const LUCERTOLE = {
  roccia: { pelle: 0x877c6e, scuro: 0x4f463d, chiaro: 0xbaae94, occhi: 0xff9a2a, cresta: 0x62574b, ghiaccio: false },
  ghiaccio: { pelle: 0x9cc4de, scuro: 0x4f7a9c, chiaro: 0xe3f3ff, occhi: 0x7ae6ff, cresta: 0xe0f4ff, ghiaccio: true },
}
export function creaLucertola (v = 'roccia') {
  const C = LUCERTOLE[v], g = new THREE.Group(), corpo = perno(g, 0, 0.27, 0)
  const mp = M(C.pelle), ms = M(C.scuro), mc = M(C.chiaro), mcr = M(C.cresta, C.ghiaccio ? { roughness: 0.15, metalness: 0.15 } : {}), artM = M(0x2a2420)
  rozza(corpo, 0.5, mp, 0, 0, 0.14, 0.34, 0.26, 0.55, 1); rozza(corpo, 0.5, mp, 0, -0.01, -0.2, 0.3, 0.24, 0.5, 1); rozza(corpo, 0.5, mc, 0, -0.06, 0.0, 0.26, 0.15, 0.95, 1)
  for (let k = 0; k < 9; k++) { const z = 0.38 - k * 0.1; rozza(corpo, 0.05 + 0.01 * (k % 2), k % 3 ? mcr : ms, 0, 0.13 - Math.abs(k - 3) * 0.004, z, 1, 1.5 + (k % 2) * 0.5, 1, 0).rotation.x = -0.3 }   // placche sul dorso
  const collo = perno(corpo, 0, 0.03, 0.4)
  rozza(collo, 0.08, mp, 0, 0, 0.04, 1, 0.9, 1.3, 1)
  const testa = perno(collo, 0, 0.0, 0.14)
  rozza(testa, 0.12, mp, 0, 0, 0.04, 0.9, 0.7, 1.45, 1); rozza(testa, 0.065, mp, 0, -0.01, 0.21, 0.9, 0.7, 1.2, 1)
  for (let k = 0; k < 3; k++) for (const s of [-1, 1]) ciuffo(testa, mcr, s * (0.06 + k * 0.01), 0.05, -0.08 - k * 0.04, [s * 0.5, 0.5, -1], 0.03, 0.12 - k * 0.02, 4)   // la gorgiera di punte
  const mascella = perno(testa, 0, -0.045, 0.1)
  rozza(mascella, 0.065, mc, 0, -0.005, 0.07, 0.9, 0.38, 1.8, 1)
  for (let k = -2; k <= 2; k++) { ciuffo(mascella, M(0xf0e9d2), k * 0.02, 0.0, 0.14 - Math.abs(k) * 0.01, [0, 1, 0.1], 0.007, 0.028, 4); ciuffo(testa, M(0xf0e9d2), k * 0.02, -0.04, 0.2 - Math.abs(k) * 0.01, [0, -1, 0.1], 0.007, 0.028, 4) }
  for (const s of [-1, 1]) {
    occhio(testa, s * 0.08, 0.055, 0.07, 0.03, C.occhi, { emis: 0.9, fessura: true, giro: s * 0.9 })
    rozza(testa, 0.04, ms, s * 0.075, 0.095, 0.075, 1.2, 0.6, 1.3, 0)
    sfera(testa, 0.01, ms, s * 0.025, 0.02, 0.28, 1, 1, 1, 5)
  }
  const lingua = perno(mascella, 0, 0.0, 0.15); const lingM = M(0xc8404a, { flatShading: false })
  const lm = scatola(lingua, 0.014, 0.008, 0.12, lingM, 0, 0, 0.06); for (const s of [-1, 1]) scatola(lingua, 0.006, 0.006, 0.04, lingM, s * 0.01, 0, 0.13).rotation.y = s * 0.4
  void lm
  // le quattro zampe: il gomito in fuori, l'avambraccio giù, il piede piatto con tre artigli
  const gambe = []
  for (const [i, [s, z]] of [[-1, 0.3], [1, 0.3], [-1, -0.27], [1, -0.27]].entries()) {
    const an = perno(corpo, s * 0.16, -0.03, z); gambe.push(an)
    arto(an, [0, 0, 0], [s * 0.12, -0.07, 0.0], 0.045, 0.036, mp, 6)
    const gi = perno(an, s * 0.12, -0.07, 0.0); an.userData.gi = gi
    arto(gi, [0, 0, 0], [s * 0.03, -0.17, i < 2 ? 0.03 : -0.02], 0.036, 0.03, mp, 6)
    const pi = perno(gi, s * 0.03, -0.17, i < 2 ? 0.03 : -0.02)
    sfera(pi, 0.055, ms, 0, 0.015, 0.04, 1.3, 0.4, 1.5, 7)
    for (let k = -1; k <= 1; k++) ciuffo(pi, artM, k * 0.035, 0.015, 0.09, [k * 0.2, -0.1, 1], 0.012, 0.05, 4)
  }
  const code = []; let padre = perno(corpo, 0, 0, -0.42)
  const N = 9
  for (let i = 0; i < N; i++) {
    const r = 0.115 - i * 0.011, len = 0.1
    rozza(padre, r, mp, 0, 0, -len * 0.5, 0.95, 0.85, 1.25, 1)
    if (i < 6 && i > 0) rozza(padre, 0.03, mcr, 0, r * 0.75, -len * 0.5, 1, 1.8, 1, 0)
    code.push(padre); const nx = perno(padre, 0, 0, -len); padre = nx
  }
  if (C.ghiaccio) for (let k = 0; k < 4; k++) ciuffo(testa, mcr, (k - 1.5) * 0.04, 0.09, 0.15 - k * 0.04, [0, 1, -0.3], 0.025, 0.1, 4)
  chiudi(g, T => {
    const f = Math.sin(T * 2.6), pu = evento(T, 4.2, 1.4), lg = evento(T, 3.1, 0.5, 1), oc = Math.sin(T * 0.7), ar = Math.sin(T * 0.45)
    g.position.set(0, 0, 0); g.rotation.set(0, Math.sin(T * 0.3) * 0.07, 0)
    corpo.position.set(0, 0.27 + pu.b * 0.05 + Math.abs(Math.sin(T * 6.5)) * 0.015 * pu.b, 0); corpo.rotation.set(-pu.b * 0.1 + f * 0.006, Math.sin(T * 0.5) * 0.06 + Math.sin(T * 1.2) * 0.02, Math.sin(T * 0.6) * 0.02)
    corpo.scale.set(1 + f * 0.012, 1 + f * 0.03, 1)
    collo.rotation.set(0.03 + pu.b * 0.12, ar * 0.4, 0); testa.rotation.set(-0.05 + pu.b * 0.12 + Math.sin(T * 0.9) * 0.05, oc * 0.3, Math.sin(T * 0.6) * 0.06)
    mascella.rotation.x = 0.02 + Math.max(0, Math.sin(T * 2.1)) * 0.05 + lg.b * 0.18
    lingua.scale.set(1, 1, 0.1 + lg.b * 1.5); lingua.visible = lg.b > 0.04
    gambe.forEach((a, i) => { const s = i % 2 ? 1 : -1; a.rotation.set(Math.sin(T * 0.7 + i * 1.6) * 0.04, 0, s * (0.0 - pu.b * 0.25 * (i < 2 ? 1 : 0.3))); a.userData.gi.rotation.set(0, 0, s * pu.b * 0.2) })
    code.forEach((c, i) => { c.rotation.set(0, Math.sin(T * 1.7 - i * 0.55) * (0.08 + i * 0.03) + Math.sin(T * 0.4) * 0.08, 0); c.rotation.x = Math.sin(T * 1.2 - i * 0.4) * 0.02 })
  })
  dichiara(g, 'morso', 0.7, 0.5)                                               // si raccoglie indietro e scatta in avanti con le fauci aperte
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.5), ap = apertura(p, 0.5)
    corpo.position.z += -W * 0.12 + L * 0.5; corpo.position.y += L * 0.03; corpo.rotation.x += W * 0.1 - L * 0.1
    collo.rotation.x += -W * 0.35 + L * 0.35; testa.rotation.x += -W * 0.25 + L * 0.2; mascella.rotation.x += ap * 0.85
    code.forEach((c, i) => { c.rotation.y += L * (0.5 + i * 0.05) * (i % 2 ? 1 : 0.4) })
    gambe.forEach((a, i) => { a.rotation.x += (i < 2 ? -L * 0.5 + W * 0.15 : L * 0.3) })
  }
  return g
}

// ══════════════════════════════════════ LE ALI (grifone e aquila) ══════════════════════════════════════
/** Un'ala di penne: perni `sp` (spalla), `go` (il polso: la mano con le primarie). `lato` ±1 (−1 = sinistra, specchiata). */
function ala (padre, lato, x, y, z, { lung = 1, c1, c2, c3 }) {
  const sp = perno(padre, x, y, z); sp.scale.x = lato
  const ro = perno(sp, 0, 0, 0)                                    // `ro` rolla l'ala attorno al suo osso: piatta in volo, di taglio a riposo
  const m1 = M(c1, SIDE2), m2 = M(c2, SIDE2), m3 = M(c3, SIDE2), osso = M(c1)
  const braccio = 0.42 * lung, mano = 0.42 * lung
  arto(ro, [0, 0, 0], [braccio, 0, 0], 0.045 * lung, 0.036 * lung, osso, 6)
  const go = perno(ro, braccio, 0, 0)
  arto(go, [0, 0, 0], [mano, 0, 0], 0.036 * lung, 0.02 * lung, osso, 6)
  const pa = perno(ro, 0, 0, 0); pa.rotation.x = PI / 2          // il piano dell'ala: x lungo, y in avanti
  const pm = perno(go, 0, 0, 0); pm.rotation.x = PI / 2
  for (let k = 0; k < 8; k++) penna(pm, (0.58 - k * 0.025) * lung, 0.075 * lung, k > 4 ? m2 : m3, 0.0 + k * 0.012 * lung, 0.02, 0.0, 0.1 - k * 0.1)             // le primarie a ventaglio
  for (let k = 0; k < 7; k++) penna(pa, 0.4 * lung, 0.085 * lung, m2, 0.04 * lung + k * 0.06 * lung, 0.0, 0.002, -1.42 + k * 0.03)                              // le secondarie
  for (let k = 0; k < 6; k++) penna(pa, 0.22 * lung, 0.085 * lung, m1, 0.05 * lung + k * 0.07 * lung, 0.04 * lung, 0.004, -1.32 + k * 0.03)                   // le copritrici
  for (let k = 0; k < 4; k++) penna(pm, 0.26 * lung, 0.075 * lung, m1, 0.03 * lung + k * 0.02, 0.06 * lung, 0.004, 0.0 - k * 0.12)
  sp.userData.go = go; sp.userData.ro = ro
  return sp
}

/** Pone l'ala fra chiusa (a = 0) e spiegata (a = 1); `batti` = alzata della punta (rad). */
const ROLL_CHIUSA = 1.2, YAW_CHIUSA = 1.15
function poseAla (sp, a, batti = 0) {
  const go = sp.userData.go, ro = sp.userData.ro
  sp.rotation.set(0, YAW_CHIUSA * (1 - a) + 0.12 * a, 0.1 * (1 - a) + batti)
  ro.rotation.set(ROLL_CHIUSA * (1 - a), 0, 0)
  go.rotation.set(0, -0.2 * (1 - a) - 0.1 * a, batti * 0.5)
}

// ══════════════════════════════════════ IL GRIFONE ══════════════════════════════════════
export function creaGrifone () {
  const g = new THREE.Group(), corpo = perno(g, 0, 0, 0), tronco = perno(corpo, 0, 0, 0)
  const pelo = M(0xc99a4e), pelo2 = M(0xa97a36), chiaro = M(0xe9d3a0), piume = M(0xefe6cf), piume2 = M(0xd3c3a0), giallo = M(0xf0b52e, { roughness: 0.4 }), artM = M(0x2f2820), beccoM = M(0xe9a928, { roughness: 0.35 })
  rozza(tronco, 0.5, pelo, 0, 0.66, -0.08, 0.5, 0.48, 1.15, 2); rozza(tronco, 0.3, chiaro, 0, 0.52, 0.0, 0.45, 0.4, 1.2, 1)
  rozza(tronco, 0.3, pelo, 0, 0.7, 0.3, 1.25, 1.2, 1.1, 1)                                                 // il petto da aquila
  for (const s of [-1, 1]) rozza(tronco, 0.24, pelo2, s * 0.2, 0.62, -0.42, 1, 1.15, 1.2, 1)               // le cosce da leone
  for (let k = 0; k < 14; k++) { const a = (k / 13 - 0.5) * 2.4; ciuffo(tronco, k % 2 ? piume : piume2, Math.sin(a) * 0.3, 0.75 + Math.cos(a) * 0.1, 0.42 + Math.cos(a) * 0.1, [Math.sin(a) * 0.5, -0.9, 0.5], 0.05, 0.2, 4) }   // le penne sul petto
  const Z = []
  for (const s of [-1, 1]) {
    const f = zampa(corpo, s * 0.17, 0.66, 0.3, [0, -0.3, 0.04], [0, -0.33, 0.0], 0.06, pelo, giallo, artM, { dita: 3, lungArt: 1.3 })
    for (let k = 0; k < 3; k++) ciuffo(f.anca, piume2, 0, -0.04 - k * 0.07, -0.05, [0, -1, -0.5], 0.05, 0.14, 4)
    Z.push(f)
    Z.push(zampa(corpo, s * 0.2, 0.66, -0.4, [0, -0.28, 0.1], [0, -0.35, -0.07], 0.075, pelo2, pelo, artM, { dita: 4, lungArt: 0.7 }))
  }
  const collo = perno(corpo, 0, 0.82, 0.38)
  arto(collo, [0, 0, 0], [0, 0.26, 0.14], 0.17, 0.13, piume, 8)
  for (let k = 0; k < 9; k++) { const a = k / 9 * PI * 2; ciuffo(collo, k % 2 ? piume : piume2, Math.sin(a) * 0.16, 0.0, Math.cos(a) * 0.15, [Math.sin(a) * 0.5, -1, Math.cos(a) * 0.5], 0.05, 0.2, 4) }   // la gorgiera
  const testa = perno(collo, 0, 0.3, 0.17)
  rozza(testa, 0.15, piume, 0, 0, 0, 0.9, 0.95, 1.1, 1)
  rozza(testa, 0.1, piume2, 0, 0.08, -0.06, 1, 0.7, 1, 1)
  const becco = perno(testa, 0, -0.03, 0.14)
  cono(becco, 0.085, 0.24, beccoM, 0, 0, 0.1, 5).rotation.x = PI / 2
  cono(becco, 0.045, 0.1, beccoM, 0, -0.05, 0.22, 5).rotation.x = PI                                        // l'uncino
  const mascella = perno(testa, 0, -0.07, 0.1); const mm = cono(mascella, 0.05, 0.17, beccoM, 0, -0.01, 0.07, 5); mm.rotation.x = PI / 2; mm.scale.set(1, 0.6, 1)
  for (const s of [-1, 1]) {
    occhio(testa, s * 0.09, 0.05, 0.1, 0.034, 0xffb020, { emis: 0.9, giro: s * 0.7 })
    const so = scatola(testa, 0.12, 0.035, 0.06, M(0x6c4a1e), s * 0.085, 0.1, 0.1); so.rotation.z = s * -0.25
    ciuffo(testa, piume2, s * 0.09, 0.14, -0.08, [s * 0.4, 1, -0.4], 0.035, 0.17, 4)                        // i ciuffi alle orecchie
  }
  for (let k = 0; k < 4; k++) ciuffo(testa, piume, 0, 0.12 - k * 0.0, -0.1 - k * 0.04, [0, 0.6, -1], 0.04, 0.14 + k * 0.01, 4)
  const code = []; let padre = perno(corpo, 0, 0.7, -0.62)
  for (let i = 0; i < 4; i++) { sfera(padre, 0.05 - i * 0.005, pelo2, 0, 0, -0.06, 1, 1, 1.4, 6); code.push(padre); padre = perno(padre, 0, 0, -0.12) }
  rozza(padre, 0.09, M(0x3d2a16), 0, 0, -0.05, 0.9, 1, 1.5, 1); code.push(padre)
  const ali = [-1, 1].map(lato => { const w = ala(corpo, lato, lato * 0.28, 0.9, 0.0, { lung: 1.05, c1: 0xc99a4e, c2: 0xe9dcc0, c3: 0x6c4a1e }); return w })
  chiudi(g, T => {
    const f = Math.sin(T * 2.4), w = Math.sin(T * 0.8), sp = evento(T, 7.5, 2.3, 2), sb = evento(T, 5.2, 0.6), gt = evento(T, 4.4, 0.9, 1)
    g.position.set(0, 0, 0); g.rotation.set(0, Math.sin(T * 0.4) * 0.05, 0)
    corpo.position.set(w * 0.015, Math.abs(Math.sin(T * PI * 1.2)) * 0.012, 0); corpo.rotation.set(0, 0, w * 0.02)
    tronco.scale.set(1 + f * 0.012, 1 + f * 0.024, 1)
    collo.rotation.set(0.02 + Math.sin(T * 0.7) * 0.06 + sb.b * -0.1, Math.sin(T * 0.45) * 0.4, Math.sin(T * 0.6) * 0.1)
    testa.rotation.set(0.02 + Math.sin(T * 0.9) * 0.05, Math.sin(T * 0.37 + 1) * 0.3, Math.sin(T * 0.8) * 0.08 + gt.b * 0.45)
    becco.rotation.x = 0; mascella.rotation.x = 0.02 + Math.max(0, Math.sin(T * 1.9)) * 0.03 + sb.b * 0.5
    code.forEach((c, i) => { c.rotation.set(Math.sin(T * 1.4 - i * 0.5) * 0.04, Math.sin(T * 1.3 - i * 0.7) * (0.12 + i * 0.05), 0) })
    const aper = sp.b * 0.85, batti = sp.b * Math.sin(sp.u * PI * 5) * 0.55
    ali.forEach((a, i) => poseAla(a, aper, batti + Math.sin(T * 1.7 + i) * 0.03))
    Z.forEach((z, i) => { z.anca.rotation.set(Math.sin(T * 0.9 + i * 2) * 0.012, 0, 0); z.gin.rotation.set(0, 0, 0) })
    Z[0].anca.rotation.x += -gt.b * 0.5; Z[0].gin.rotation.x += gt.b * 0.4                                  // alza una zampa e la osserva
    corpo.position.y += sp.b * 0.04
  })
  dichiara(g, 'beccata', 0.85, 0.5)                                             // spalanca le ali, si inarca e sferra beccata e artigli
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.5), ap = apertura(p, 0.5)
    const aper = Math.min(1, W * 0.8 + L * 1.0), batti = W * 0.7 - L * 0.7
    ali.forEach(a => poseAla(a, aper, batti))
    corpo.position.z += -W * 0.12 + L * 0.45; corpo.position.y += W * 0.05 + L * 0.02; corpo.rotation.x += -W * 0.25 + L * 0.15
    collo.rotation.x += -W * 0.4 + L * 0.8; testa.rotation.x += -W * 0.2 + L * 0.35; mascella.rotation.x += ap * 0.7
    Z[0].anca.rotation.x += -L * 0.9; Z[2].anca.rotation.x += -L * 0.9; Z[0].gin.rotation.x += -L * 0.3; Z[2].gin.rotation.x += -L * 0.3
    code.forEach((c, i) => { c.rotation.y += L * 0.2 })
  }
  return g
}

// ══════════════════════════════════════ L'AQUILA GIGANTE ══════════════════════════════════════
const AQUILE = {
  reale: { corpo: 0x5e4630, ala1: 0x6c5238, ala2: 0x8a6d46, ala3: 0x2b2118, testa: 0x8b6a3e, nuca: 0xc59a52, coda: 0xd8d0bc, becco: 0xe4aa2c, occhi: 0xf0b030 },
  candida: { corpo: 0x6f6458, ala1: 0x7b7060, ala2: 0xa89c88, ala3: 0x383229, testa: 0xf3f1ea, nuca: 0xffffff, coda: 0xfafafa, becco: 0xf2b830, occhi: 0xfff0a0 },
}
export function creaAquila (v = 'reale') {
  const C = AQUILE[v], g = new THREE.Group(), corpo = perno(g, 0, 0, 0), busto = perno(corpo, 0, 0, 0)
  const mc = M(C.corpo), mt = M(C.testa), mn = M(C.nuca), mcoda = M(C.coda, SIDE2), mb = M(C.becco, { roughness: 0.4 }), zamp = M(0xe9b832), art = M(0x2a2420), ch = M(C.ala2)
  rozza(busto, 0.5, mc, 0, 0.55, 0, 0.4, 0.66, 0.5, 2); rozza(busto, 0.3, ch, 0, 0.5, 0.1, 1.0, 1.2, 0.9, 1)                         // il corpo ritto e il petto chiaro
  for (let k = 0; k < 10; k++) { const a = (k / 9 - 0.5) * 2.2; ciuffo(busto, k % 2 ? mc : ch, Math.sin(a) * 0.17, 0.78 - Math.abs(a) * 0.04, 0.12 + Math.cos(a) * 0.1, [Math.sin(a) * 0.4, -1, 0.5], 0.045, 0.16, 4) }
  const gambe = []
  for (const s of [-1, 1]) {
    const an = perno(corpo, s * 0.11, 0.38, 0.02); gambe.push(an)
    rozza(an, 0.11, mc, 0, 0.0, -0.02, 1, 1.2, 1.1, 1)                                                                            // i «calzoni» di piume
    arto(an, [0, 0, 0], [0, -0.2, 0.02], 0.045, 0.035, zamp, 6)
    const pi = perno(an, 0, -0.2, 0.02)
    sfera(pi, 0.05, zamp, 0, -0.145 + 0.18, 0.04, 1, 0.45, 1.3, 7)
    for (let k = -1; k <= 1; k++) { cil(pi, 0.014, 0.012, 0.09, zamp, k * 0.04, 0.0, 0.08, 5).rotation.x = PI / 2; ciuffo(pi, art, k * 0.04, -0.0, 0.12, [k * 0.2, -0.5, 1], 0.014, 0.06, 4) }
    pi.position.y = -0.2 + 0.0
  }
  const collo = perno(corpo, 0, 0.9, 0.08)
  rozza(collo, 0.1, mn, 0, 0.0, 0.0, 1.2, 0.9, 1.2, 1)
  for (let k = 0; k < 7; k++) { const a = k / 7 * PI * 2; ciuffo(collo, k % 2 ? mn : mt, Math.sin(a) * 0.12, 0.02, Math.cos(a) * 0.1, [Math.sin(a) * 0.5, -0.5, Math.cos(a) * 0.5], 0.04, 0.14, 4) }
  const testa = perno(collo, 0, 0.1, 0.05)
  rozza(testa, 0.135, mt, 0, 0, 0, 0.9, 0.95, 1.1, 1)
  const becco = perno(testa, 0, -0.03, 0.12); cono(becco, 0.065, 0.19, mb, 0, 0, 0.08, 5).rotation.x = PI / 2; cono(becco, 0.035, 0.08, mb, 0, -0.04, 0.17, 5).rotation.x = PI
  const mascella = perno(testa, 0, -0.055, 0.08); const mm = cono(mascella, 0.04, 0.14, mb, 0, -0.008, 0.05, 5); mm.rotation.x = PI / 2; mm.scale.set(1, 0.6, 1)
  for (const s of [-1, 1]) {
    occhio(testa, s * 0.075, 0.04, 0.075, 0.03, C.occhi, { emis: 0.9, giro: s * 0.8 })
    const so = scatola(testa, 0.1, 0.03, 0.05, M(0x3f2d18), s * 0.07, 0.085, 0.075); so.rotation.z = s * -0.3
  }
  const codaP = perno(corpo, 0, 0.3, -0.16); codaP.rotation.x = 0.7
  for (let k = 0; k < 7; k++) { const a = (k - 3) * 0.17; const f = scatola(codaP, 0.07, 0.012, 0.42, mcoda, Math.sin(a) * 0.2, 0, -0.2 * Math.cos(a)); f.rotation.y = a; f.position.set(Math.sin(a) * 0.25, 0, -0.2 - Math.cos(a) * 0.12) }
  const ali = [-1, 1].map(lato => { const w = ala(corpo, lato, lato * 0.18, 0.78, -0.02, { lung: 1.1, c1: C.ala1, c2: C.ala2, c3: C.ala3 }); return w })
  chiudi(g, T => {
    const f = Math.sin(T * 2.8), w = Math.sin(T * 0.9), sp = evento(T, 7.2, 2.4, 2), pr = evento(T, 5.6, 1.6, 4), cc = evento(T, 3.3, 0.7)
    g.position.set(0, 0, 0); g.rotation.set(0, Math.sin(T * 0.4) * 0.1, 0)
    corpo.position.set(0, Math.abs(Math.sin(T * PI * 1.1)) * 0.01 + sp.b * 0.05, 0); corpo.rotation.set(0.3 + f * 0.01 - pr.b * 0.1, 0, w * 0.04 + Math.sin(T * 1.3) * 0.015)
    busto.scale.set(1 + f * 0.012, 1 + f * 0.024, 1 + f * 0.01)
    collo.rotation.set(-0.05 + Math.sin(T * 0.7) * 0.05 + pr.b * 0.75, Math.sin(T * 0.5) * 0.35, Math.sin(T * 0.6) * 0.08)
    testa.rotation.set(0.0 + Math.sin(T * 0.9) * 0.05 + pr.b * 0.25, Math.sin(T * 0.37 + 1) * 0.3, Math.sin(T * 0.8) * 0.08 + cc.b * 0.55)
    mascella.rotation.x = 0.02 + Math.max(0, Math.sin(T * 2.2)) * 0.04 + sp.b * 0.3
    codaP.rotation.set(0.7 + Math.sin(T * 1.5) * 0.04, Math.sin(T * 1.2) * 0.1, 0)
    const aper = sp.b * 0.95, batti = sp.b * Math.sin(sp.u * PI * 6) * 0.6
    ali.forEach((a, i) => poseAla(a, aper, batti + Math.sin(T * 1.9 + i) * 0.03))
    gambe.forEach((a, i) => { a.rotation.set(Math.sin(T * 0.8 + i * 2) * 0.03 - (i ? 0 : cc.b * 0.4), 0, 0) })
  })
  dichiara(g, 'picchiata', 0.8, 0.5)                                           // si accuccia, scatta in avanti con le ali aperte e le zampe tese
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.5), ap = apertura(p, 0.5)
    const aper = Math.min(1, W * 0.7 + L * 1.0), batti = W * 0.7 - L * 0.8
    ali.forEach(a => poseAla(a, aper, batti))
    corpo.position.z += -W * 0.1 + L * 0.55; corpo.position.y += W * -0.04 + L * 0.2; corpo.rotation.x += -W * 0.25 + L * 0.55
    collo.rotation.x += -W * 0.2 + L * 0.5; testa.rotation.x += L * 0.1; mascella.rotation.x += ap * 0.6
    gambe.forEach(a => { a.rotation.x += W * 0.4 - L * 1.3 })
    codaP.rotation.x += -L * 0.2
  }
  return g
}

// ══════════════════════════════════════ IL PIPISTRELLO GIGANTE DELLE GROTTE ══════════════════════════════════════
export function creaPipistrelloGrotta () {
  const b = creaPipistrello('comune'), g = new THREE.Group()
  g.add(b); g.scale.setScalar(1.9)
  Object.defineProperty(g.userData, 'fase', { get: () => b.userData.fase, set: v => { b.userData.fase = v }, enumerable: true })
  g.userData.anima = t => b.userData.anima(t)
  g.userData.attacco = { ...b.userData.attacco }
  g.userData.attacca = p => b.userData.attacca(p)
  return g
}

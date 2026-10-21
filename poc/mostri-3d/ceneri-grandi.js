// I grossi della piana delle ceneri: il fabbro non morto della fornace (forte), il golem di magma (caporale), il mietitore (caporale delle
// ossa), il minotauro del labirinto (boss) e il drago di lava (superboss). Contratto di prati.js; attrezzi in ceneri-base.js.
import {
  THREE, M, mesh, sfera, rozza, scatola, cil, cono, perno, punta, PI, NERO, lucido, inizia, lum, fiamma, occhio, arto,
  ritmo, apertura, evento, marcatore, dichiara, vivo, onda, liscio,
} from './ceneri-base.js'
import { cornoCurvo } from './ceneri-bestie.js'
import { creaDragoGrande, COLORI } from './draghi.js'

/** Il corpo di un grosso a due gambe: gambe a due pezzi, busto largo, testa, braccia a due pezzi con la mano in fondo (perni). */
function umano (o) {
  const { pelle, calzoni, scarpa = 0x2a2018, L1 = 0.36, L2 = 0.36, rg = 0.08, busto: [bw, bh, bd] = [0.6, 0.6, 0.36], testa = 0.2, A1 = 0.34, A2 = 0.34, rb = 0.075, spalla = 1.0 } = o
  const g = new THREE.Group(), mp = M(pelle), mc = M(calzoni), H = L1 + L2 - 0.02
  const P = { g, gambe: [], bracci: [], H }
  P.bacino = perno(g, 0, H, 0)
  for (const s of [-1, 1]) {
    const an = perno(P.bacino, s * bw * 0.27, 0, 0); arto(an, [0, 0, 0], [s * 0.01, -L1, 0.04], rg * 1.2, rg, mc, 8)
    const gi = perno(an, s * 0.01, -L1, 0.04); arto(gi, [0, 0, 0], [0, -L2, -0.04], rg, rg * 0.82, mc, 8)
    const pi = perno(gi, 0, -L2, -0.04); sfera(pi, rg * 1.3, M(scarpa), 0, rg * 0.2, rg * 0.8, 1, 0.6, 1.8, 8)
    P.gambe.push({ an, gi, pi })
  }
  P.busto = perno(P.bacino, 0, 0, 0)
  sfera(P.busto, 0.5, mc, 0, 0.0, 0, bw * 0.85, bh * 0.35, bd * 0.9, 10)
  sfera(P.busto, 0.5, mp, 0, bh * 0.5, 0, bw, bh, bd, 14)
  P.collo = perno(P.busto, 0, bh * 0.98, bd * 0.08)
  P.testa = perno(P.collo, 0, testa * 0.6, bd * 0.05)
  for (const s of [-1, 1]) {
    const sp = perno(P.busto, s * (bw / 2 + rb * 0.2), bh * 0.88 * spalla, 0); sfera(sp, rb * 1.5, mp, 0, 0, 0, 1, 1, 1, 9)
    arto(sp, [0, 0, 0], [s * 0.02, -A1, 0.03], rb * 1.2, rb, mp, 8)
    const go = perno(sp, s * 0.02, -A1, 0.03); arto(go, [0, 0, 0], [0, -A2, 0.04], rb, rb * 0.82, mp, 8)
    const ma = perno(go, 0, -A2, 0.04); sfera(ma, rb * 1.2, mp, 0, 0, 0, 1, 1.1, 1, 8)
    P.bracci.push({ sp, go, ma })
  }
  return P
}

// ══════════════════════════════════════ IL FABBRO NON MORTO ══════════════════════════════════════
export function creaFabbroNonMorto () {
  inizia()
  const P = umano({ pelle: 0x7d8890, calzoni: 0x3a302a, scarpa: 0x1d1612, L1: 0.3, L2: 0.3, rg: 0.075, busto: [0.52, 0.52, 0.34], testa: 0.17, A1: 0.3, A2: 0.3, rb: 0.07, spalla: 0.95 })
  const { g, busto, testa, bacino, bracci, gambe } = P
  const mo = M(0x54606a), cuoio = M(0x4a2e1c, { roughness: 0.9 }), cuoio2 = M(0x2e1c12), ferro = M(0x3c3f46, { metalness: 0.6, roughness: 0.5 }), buio = M(NERO, { roughness: 1 }), osso = M(0xd8caa4)
  const rovente = lum(0xff6a14, 1.4)
  // il petto squarciato: il fuoco della forgia brucia dove stava il cuore
  const cavo = sfera(busto, 0.5, M(0x1a0a06, { flatShading: false }), 0.0, 0.34, 0.13, 0.26, 0.3, 0.18, 10)
  const cuore = sfera(busto, 0.5, lum(0xff8a1c, 2.0), 0.0, 0.33, 0.1, 0.17, 0.2, 0.12, 10); cuore.castShadow = false
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) scatola(busto, 0.16, 0.022, 0.04, osso, s * 0.1, 0.24 + i * 0.075, 0.15).rotation.z = s * -0.18   // costole scoperte
  fiamma(busto, 0, 0.5, 0.09, 0.2, 0.05, 0xff5a10, 0xffc840, 1)
  // il grembiule di cuoio bruciacchiato, con le cinghie e gli arnesi
  scatola(busto, 0.44, 0.5, 0.025, cuoio, 0, 0.2, 0.178).rotation.x = 0.04
  for (const s of [-1, 1]) { scatola(busto, 0.05, 0.4, 0.03, cuoio2, s * 0.2, 0.46, 0.14).rotation.z = s * 0.2; scatola(busto, 0.05, 0.4, 0.03, cuoio2, s * 0.2, 0.45, -0.1) }
  scatola(bacino, 0.54, 0.06, 0.38, cuoio2, 0, 0.03, 0)
  for (const x of [-0.16, 0, 0.16]) sfera(bacino, 0.016, ferro, x, 0.03, 0.2, 1, 1, 0.6, 5)
  for (let i = -2; i <= 2; i++) scatola(bacino, 0.07, 0.18 + (i & 1) * 0.06, 0.012, cuoio, i * 0.07, -0.12, 0.17).rotation.z = i * 0.04   // la gonna a strisce
  const tenaglia = perno(bacino, 0.24, -0.02, 0.1); tenaglia.rotation.z = 0.3; scatola(tenaglia, 0.03, 0.34, 0.03, ferro, 0, -0.14, 0); scatola(tenaglia, 0.03, 0.34, 0.03, ferro, 0.04, -0.14, 0).rotation.z = 0.1
  // la testa: il cranio con ancora brandelli, la barba bruciata e gli occhi accesi
  sfera(testa, 0.18, mo, 0, 0, 0, 0.95, 1.0, 1.0, 14); sfera(testa, 0.1, mo, 0, -0.1, 0.07, 1.2, 0.8, 1, 10)
  const occhi = [-1, 1].map(s => { sfera(testa, 0.062, buio, s * 0.075, 0.03, 0.14, 1, 1.15, 0.6, 9); return occhio(testa, s * 0.075, 0.03, 0.16, 0.036, 0xff7a20, { emis: 2.2, giro: s * 0.3 }) })
  for (const s of [-1, 1]) scatola(testa, 0.1, 0.025, 0.03, buio, s * 0.08, 0.1, 0.16).rotation.z = s * -0.4
  const mascella = perno(testa, 0, -0.14, 0.07); sfera(mascella, 0.09, mo, 0, -0.02, 0.05, 1.1, 0.5, 1.1, 8)
  for (let i = -3; i <= 3; i++) scatola(mascella, 0.022, 0.04, 0.02, M(0xe8dcc0), i * 0.026, 0.02, 0.12 - Math.abs(i) * 0.014)
  for (let i = 0; i < 5; i++) cono(mascella, 0.025, 0.12 + (i % 2) * 0.05, buio, (i - 2) * 0.04, -0.06, 0.1, 4).rotation.x = PI + 0.2       // la barba bruciata
  const cappuccio = sfera(testa, 0.2, cuoio2, 0, 0.07, -0.04, 1.0, 0.8, 1.0, 10)
  const mani = bracci.map(b => b.ma)
  // il martello nella destra: il manico lungo, la testa che arde
  const martello = perno(mani[1], 0, 0, 0)
  cil(martello, 0.022, 0.022, 0.8, M(0x5a3a24), 0, 0.22, 0, 7)
  scatola(martello, 0.34, 0.2, 0.2, ferro, 0, 0.64, 0); scatola(martello, 0.36, 0.14, 0.14, rovente, 0, 0.64, 0.0).castShadow = false
  scatola(martello, 0.42, 0.04, 0.04, ferro, 0, 0.64, 0)
  for (const s of [-1, 1]) { scatola(martello, 0.02, 0.22, 0.22, rovente, s * 0.17, 0.64, 0).castShadow = false; fiamma(martello, s * 0.12, 0.74, 0, 0.12, 0.03, 0xff5a10, 0xffc840, s) }
  martello.rotation.x = 1.1
  // un lingotto incandescente nella sinistra
  const lingotto = perno(mani[0], 0, -0.06, 0.06); scatola(lingotto, 0.1, 0.07, 0.24, lum(0xffa030, 1.8), 0, 0, 0.0).castShadow = false; lingotto.rotation.x = 0.2
  // le catene al collo e ai polsi
  for (let i = 0; i < 7; i++) { const a = -1.2 + i * 0.4; mesh(busto, new THREE.TorusGeometry(0.028, 0.008, 4, 8), ferro, Math.sin(a) * 0.2, 0.54 - Math.cos(a) * 0.02, Math.cos(a) * 0.14, 1, 1, 1).rotation.set(i * 0.7, a, 0) }
  const scintille = []
  for (let i = 0; i < 5; i++) { const s = scatola(g, 0.025, 0.025, 0.025, lum(0xffb030, 2), 0, 0, 0); s.castShadow = false; scintille.push(s) }
  g.scale.setScalar(1.06)
  vivo(g, T => {
    const r = onda(T, 2.0), ev = evento(T, 6.2, 1.8, 1), pe = Math.sin(T * 0.7)
    bacino.position.set(pe * 0.02, P.H + Math.abs(Math.sin(T * 1.0)) * 0.012, 0); bacino.rotation.set(0.02, pe * 0.07, pe * 0.03)
    busto.rotation.set(0.22 + r * 0.02 + ev.b * 0.06, Math.sin(T * 0.5) * 0.14 - pe * 0.05, Math.sin(T * 0.8) * 0.04); busto.scale.set(1 + r * 0.01, 1 + r * 0.02, 1 + r * 0.02)
    P.collo.rotation.x = -0.12; testa.rotation.set(-0.05 + Math.sin(T * 1.1) * 0.05 + ev.b * 0.2, Math.sin(T * 0.6) * 0.35 + ev.b * Math.sin(T * 30) * 0.05, Math.sin(T * 0.8) * 0.07)
    mascella.rotation.x = 0.12 + Math.max(0, Math.sin(T * 1.9)) * 0.1 + ev.b * 0.2
    bracci[1].sp.rotation.set(-0.35 + Math.sin(T * 1.2) * 0.04 - ev.b * 0.55, 0, 0.18); bracci[1].go.rotation.x = -1.0 - ev.b * 0.2
    bracci[0].sp.rotation.set(-0.55 + Math.sin(T * 1.4 + 1) * 0.04, 0, -0.2); bracci[0].go.rotation.x = -1.1 + Math.sin(T * 2 + ev.u) * 0.04
    martello.rotation.x = 1.1 - ev.b * 0.5 + Math.sin(T * 1.6) * 0.04
    gambe.forEach(({ an, gi }, i) => { an.rotation.x = (i ? -1 : 1) * pe * 0.04 - 0.04; gi.rotation.x = 0.06 })
    cuore.scale.set(0.17, 0.2, 0.12).multiplyScalar(1 + 0.12 * Math.max(0, Math.sin(T * 3.1)))
    scintille.forEach((s, i) => { const u = (T * 0.5 + i / 5) % 1; s.position.set(0.1 + Math.sin(i * 3 + T * 2) * 0.18, 1.05 + u * 0.8, 0.2 + Math.cos(i * 3) * 0.1); s.scale.setScalar(1 - u) })
  })
  dichiara(g, 'martellata', 0.95, 0.55)                                                          // alza il martello sopra la testa e lo abbatte
  g.userData.attacca = p => {
    const { s, W, L } = ritmo(p, 0.55)
    bracci[1].sp.rotation.x += W * -2.3 + L * 0.4; bracci[1].go.rotation.x += W * -0.4; martello.rotation.x += W * -0.4 + L * 0.7
    bracci[0].sp.rotation.x += W * -0.6 + L * -0.2
    busto.rotation.x += -W * 0.28 + L * 0.5; testa.rotation.x += -W * 0.2 + L * 0.2; mascella.rotation.x += W * 0.2 + L * 0.45
    g.position.z = L * 0.28
  }
  return g
}

// ══════════════════════════════════════ IL GOLEM DI MAGMA ══════════════════════════════════════
export function creaGolemMagma () {
  inizia()
  const basalto = M(0x2c2624, { roughness: 0.95 }), basalto2 = M(0x3e3430, { roughness: 0.95 }), buio = M(0x120e0d, { roughness: 1 })
  const lv = () => lum(0xff6a14, 1.5), lv2 = () => lum(0xffb030, 1.8)
  const g = new THREE.Group()
  const bacino = perno(g, 0, 0.62, 0)
  // le gambe: tozze, a blocchi, con la lava che brilla nei giunti
  const gambe = [-1, 1].map(s => {
    const an = perno(bacino, s * 0.22, 0, 0)
    rozza(an, 0.2, basalto, 0, -0.18, 0, 1.0, 1.35, 1.0, 1); rozza(an, 0.13, lv(), 0, -0.02, 0.1, 1.2, 0.5, 0.5, 0).castShadow = false
    const gi = perno(an, 0, -0.34, 0); rozza(gi, 0.18, basalto2, 0, -0.1, 0.02, 1.0, 1.2, 1.1, 1)
    const pi = perno(gi, 0, -0.3, 0.03); rozza(pi, 0.22, basalto, 0, -0.04, 0.1, 1.2, 0.5, 1.5, 1)
    for (const k of [-1, 0, 1]) rozza(pi, 0.06, buio, k * 0.1, -0.05, 0.3, 1, 0.8, 1.2, 0)
    return { an, gi }
  })
  const busto = perno(bacino, 0, 0, 0)
  rozza(busto, 0.3, basalto2, 0, 0.1, 0, 1.15, 0.8, 0.9, 1)                                       // il bacino
  rozza(busto, 0.46, basalto, 0, 0.52, 0, 1.15, 1.0, 0.85, 1)                                     // il torace massiccio
  rozza(busto, 0.3, basalto2, 0, 0.75, 0.05, 1.5, 0.6, 0.8, 1)                                    // il dorso delle spalle
  // il nucleo di magma nel petto, incorniciato da placche
  const nucleo = sfera(busto, 0.5, lum(0xff7a14, 2.0), 0, 0.5, 0.28, 0.4, 0.48, 0.2, 12); nucleo.castShadow = false
  for (const s of [-1, 1]) rozza(busto, 0.16, basalto, s * 0.27, 0.5, 0.3, 0.7, 1.9, 0.6, 0)
  rozza(busto, 0.18, basalto, 0, 0.84, 0.3, 1.7, 0.6, 0.6, 0); rozza(busto, 0.18, basalto, 0, 0.2, 0.3, 1.5, 0.6, 0.6, 0)
  for (let i = 0; i < 7; i++) { const c = scatola(busto, 0.03, 0.2 + (i % 3) * 0.08, 0.03, lv(), (i - 3) * 0.12, 0.52 + (i % 2) * 0.12, -0.34 + (i % 2) * 0.05); c.rotation.z = (i - 3) * 0.2; c.castShadow = false }   // crepe sulla schiena
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const c = scatola(busto, 0.2, 0.025, 0.03, lv(), s * 0.3, 0.3 + i * 0.12, 0.2); c.rotation.z = s * 0.5; c.castShadow = false }
  const collo = perno(busto, 0, 0.92, 0.08), testa = perno(collo, 0, 0.1, 0.06)
  rozza(testa, 0.2, basalto, 0, 0, 0, 1.15, 0.85, 1.0, 1); rozza(testa, 0.1, basalto2, 0, 0.14, 0.05, 1.5, 0.5, 1.0, 0)
  const fessura = scatola(testa, 0.3, 0.05, 0.05, lv2(), 0, 0.0, 0.17); fessura.castShadow = false
  const occhi = [-1, 1].map(s => { const o = perno(testa, s * 0.08, 0.0, 0.2); o.userData.occhio = true; sfera(o, 0.045, lv2(), 0, 0, 0, 1.2, 0.8, 0.6, 8).castShadow = false; return o })
  scatola(testa, 0.34, 0.06, 0.1, buio, 0, 0.07, 0.17); for (const s of [-1, 1]) { punta(testa, [s * 0.16, 0.1, 0], [s * 0.26, 0.28, -0.04], 0.05, basalto2, 5); punta(testa, [s * 0.1, 0.16, -0.05], [s * 0.14, 0.34, -0.1], 0.04, basalto2, 5) }
  const mascella = perno(testa, 0, -0.14, 0.1); rozza(mascella, 0.12, basalto2, 0, 0, 0.05, 1.4, 0.55, 0.8, 0)
  const gola = scatola(mascella, 0.2, 0.03, 0.03, lv(), 0, 0.06, 0.12); gola.castShadow = false
  // le braccia enormi: spalla di roccia con le spine e un pugno incandescente alle nocche
  const bracci = [-1, 1].map(s => {
    const sp = perno(busto, s * 0.62, 0.78, 0.0); rozza(sp, 0.24, basalto, 0, 0, 0, 1.1, 1.0, 1.0, 1)
    for (let k = 0; k < 3; k++) punta(sp, [s * 0.1, 0.12, -0.05 + k * 0.08], [s * (0.22 + k * 0.03), 0.34 - k * 0.04, -0.05 + k * 0.1], 0.06 - k * 0.01, basalto2, 5)
    fiamma(sp, s * 0.05, 0.22, 0, 0.26, 0.07, 0xff5a10, 0xffc840, s + 2)
    rozza(sp, 0.18, basalto2, s * 0.05, -0.28, 0.05, 1.0, 1.7, 1.0, 1); rozza(sp, 0.12, lv(), s * 0.1, -0.1, 0.12, 0.8, 0.6, 0.7, 0).castShadow = false
    const go = perno(sp, s * 0.06, -0.52, 0.06); rozza(go, 0.2, basalto, 0, -0.2, 0.04, 1.1, 1.5, 1.1, 1)
    for (let k = 0; k < 4; k++) rozza(go, 0.045, lv(), (k - 1.5) * 0.08, -0.4, 0.2, 1, 0.7, 0.9, 0).castShadow = false
    const ma = perno(go, 0, -0.4, 0.05); rozza(ma, 0.26, basalto2, 0, -0.12, 0.04, 1.2, 1.1, 1.1, 1)
    for (let k = 0; k < 3; k++) rozza(ma, 0.08, buio, (k - 1) * 0.15, -0.28, 0.16, 1, 1.1, 1, 0)
    return { sp, go, ma }
  })
  const gocce = []
  for (let i = 0; i < 5; i++) { const d = sfera(g, 0.025, lv2(), 0, 0, 0, 1, 1.6, 1, 6); d.castShadow = false; gocce.push(d) }
  g.scale.setScalar(1.05)
  vivo(g, T => {
    const r = onda(T, 1.5), ev = evento(T, 7.0, 2.0, 2), pe = Math.sin(T * 0.55)
    bacino.position.set(pe * 0.03, 0.62 + Math.abs(Math.sin(T * 0.78)) * 0.02, 0); bacino.rotation.set(0, pe * 0.08, pe * 0.03)
    busto.rotation.set(0.1 + r * 0.015 - ev.b * 0.1, Math.sin(T * 0.45) * 0.15 + ev.b * Math.sin(ev.u * PI * 2) * 0.25, -pe * 0.04); busto.scale.set(1 + r * 0.012, 1 + r * 0.02, 1 + r * 0.012)
    collo.rotation.x = Math.sin(T * 1.0) * 0.04; testa.rotation.set(0.04 + ev.b * 0.2, Math.sin(T * 0.5) * 0.4, Math.sin(T * 0.7) * 0.05)
    mascella.rotation.x = 0.08 + ev.b * 0.4 + Math.max(0, Math.sin(T * 1.5)) * 0.06
    bracci.forEach((b, i) => { const s = i ? 1 : -1; b.sp.rotation.set(-0.15 + Math.sin(T * 0.8 + i * 2) * 0.05 - ev.b * 0.9 * (i ? 1 : 0.6), 0, s * (0.16 + Math.sin(T * 1.1 + i) * 0.03 + ev.b * 0.25)); b.go.rotation.x = -0.45 - ev.b * 0.5 })
    gambe.forEach(({ an, gi }, i) => { an.rotation.x = (i ? -1 : 1) * pe * 0.05; gi.rotation.x = 0.04 })
    nucleo.scale.set(0.4 * (1 + 0.08 * Math.max(0, Math.sin(T * 2.5))), 0.48 * (1 + 0.08 * Math.max(0, Math.sin(T * 2.5))), 0.2)
    gocce.forEach((d, i) => { const u = (T * 0.6 + i * 0.37) % 1; d.position.set((i - 2) * 0.22 + Math.sin(i * 5) * 0.1, 1.4 - u * u * 1.4, 0.32 + (i % 2) * 0.15); d.scale.setScalar(1 - Math.max(0, u - 0.8) * 4) })
  })
  dichiara(g, 'schianto-a-due-pugni', 1.0, 0.55)                                                 // alza i pugni sopra la testa e li schianta a terra
  g.userData.attacca = p => {
    const { s, W, L } = ritmo(p, 0.55)
    bracci.forEach(b => { b.sp.rotation.x += W * -2.3 + L * 0.75; b.go.rotation.x += W * -0.5 + L * 0.2 })
    busto.rotation.x += -W * 0.32 + L * 0.65; testa.rotation.x += -W * 0.2 + L * 0.35; mascella.rotation.x += W * 0.3 + L * 0.2
    bacino.position.y += -L * 0.12; g.position.z = L * 0.3
    gambe.forEach(({ an, gi }) => { an.rotation.x += W * 0.1 - L * 0.2; gi.rotation.x += L * 0.1 })
  }
  return g
}

// ══════════════════════════════════════ IL MIETITORE ══════════════════════════════════════
export function creaMietitore () {
  inizia()
  const tela = M(0x20182c, { side: THREE.DoubleSide, roughness: 0.9 }), tela2 = M(0x362848, { side: THREE.DoubleSide, roughness: 0.9 })
  const osso1 = M(0xd8ceb4), ombra = M(0x8a8068), buio = M(0x07040c, { roughness: 1 }), ferro = M(0x5a5f6c, { metalness: 0.7, roughness: 0.35 }), legno = M(0x8a6a48)
  const spirito = 0xb58cff, spirito2 = 0xe6d4ff
  const g = new THREE.Group(), corpo = perno(g, 0, 0.25, 0)
  // la veste: un cono lungo che non tocca terra, con lembi a strisce che ondeggiano
  const veste = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.46, 1.0, 12, 1, true), tela); veste.position.y = 0.5; veste.castShadow = true; corpo.add(veste)
  sfera(corpo, 0.5, tela, 0, 0.98, 0, 0.5, 0.45, 0.36, 12)
  const lembi = []
  for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2; const l = perno(corpo, Math.sin(a) * 0.43, 0.02, Math.cos(a) * 0.4); l.rotation.y = a; scatola(l, 0.16, 0.34 + (i % 3) * 0.1, 0.01, i % 2 ? tela2 : tela, 0, -0.17 - (i % 3) * 0.05, 0); lembi.push(l) }
  const busto = perno(corpo, 0, 0.95, 0)
  // il collare d'ossa e le spallacce di costole
  for (const s of [-1, 1]) { rozza(busto, 0.14, tela2, s * 0.3, 0.1, 0, 1.2, 0.7, 1.0, 1); for (let k = 0; k < 3; k++) punta(busto, [s * (0.26 + k * 0.05), 0.15, 0], [s * (0.34 + k * 0.07), 0.3 - k * 0.04, 0], 0.03, osso1, 5) }
  for (let i = 0; i < 6; i++) { const a = -1.2 + i * 0.48; cono(busto, 0.03, 0.1, osso1, Math.sin(a) * 0.2, 0.24, Math.cos(a) * 0.12 + 0.05, 4).rotation.set(0.3, 0, 0) }
  const testa = perno(busto, 0, 0.32, 0.02)
  const cappuccio = sfera(testa, 0.18, tela, 0, 0.03, -0.15, 1.1, 1.25, 1.1, 14)
  sfera(testa, 0.13, osso1, 0, -0.03, 0.08, 1.0, 1.15, 0.95, 12)
  const volto = M(0x07040c, { roughness: 1 })
  sfera(testa, 0.15, volto, 0, 0.0, 0.1, 1.0, 1.1, 0.6, 12)
  rozza(testa, 0.125, osso1, 0, -0.01, 0.1, 1.0, 1.1, 0.95, 1)
  const occhi = [-1, 1].map(s => { sfera(testa, 0.045, buio, s * 0.045, 0.01, 0.18, 1, 1.2, 0.5, 8); const o = perno(testa, s * 0.045, 0.01, 0.2); o.userData.occhio = true; sfera(o, 0.024, lum(spirito2, 2.4), 0, 0, 0, 1, 1.3, 0.6, 7).castShadow = false; fiamma(testa, s * 0.045, 0.04, 0.17, 0.12, 0.03, 0x7a3cd8, spirito2, s); return o })
  cono(testa, 0.02, 0.04, buio, 0, -0.03, 0.2, 3).rotation.set(PI, PI / 2, 0)
  const mascella = perno(testa, 0, -0.1, 0.1); scatola(mascella, 0.1, 0.03, 0.09, osso1, 0, -0.01, 0.04)
  for (let i = -2; i <= 2; i++) scatola(mascella, 0.014, 0.034, 0.014, M(0xf2ecdc), i * 0.02, 0.02, 0.085)
  // le braccia d'ossa che escono dalle maniche larghe, strette alla falce
  const bracci = [-1, 1].map(s => {
    const sp = perno(busto, s * 0.27, 0.08, 0); const manica = cono(sp, 0.12, 0.34, tela2, 0, -0.14, 0.02, 8); manica.rotation.x = PI
    const go = perno(sp, 0, -0.3, 0.04); arto(go, [0, 0, 0], [0, -0.22, 0.05], 0.025, 0.02, osso1, 6, false)
    const ma = perno(go, 0, -0.24, 0.06); sfera(ma, 0.032, osso1, 0, 0, 0, 1, 1.2, 1, 6)
    for (let k = -1; k <= 1; k++) { const d = cil(ma, 0.008, 0.007, 0.06, osso1, k * 0.016, -0.04, 0.01, 4) }
    return { sp, go, ma }
  })
  // la falce: l'asta lunghissima e la lama a mezzaluna che brilla di freddo
  const falce = perno(g, 0, 0, 0); const asta = perno(falce, 0, 0, 0)
  cil(asta, 0.022, 0.022, 2.2, legno, 0, 0.15, 0, 7)
  for (const y of [-0.3, 0.55]) cil(asta, 0.03, 0.03, 0.06, ferro, 0, y, 0, 7)
  const sh = new THREE.Shape(); sh.moveTo(0, 0.07); sh.quadraticCurveTo(0.45, 0.32, 1.05, -0.2); sh.quadraticCurveTo(0.55, 0.02, 0.0, -0.07); sh.closePath()
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.025, bevelEnabled: false }); geo.translate(0, 0, -0.0125); geo.rotateX(-PI / 2); geo.rotateY(-PI / 2)
  const lama = new THREE.Mesh(geo, M(0xc8d0e0, { metalness: 0.7, roughness: 0.3 })); lama.position.set(0, 1.22, 0); lama.castShadow = true; asta.add(lama)
  const filo = new THREE.Mesh(geo, lum(spirito, 0.7, { transparent: true, opacity: 0.55, depthWrite: false })); filo.position.set(0, 1.225, 0.0); filo.scale.set(1.0, 1.4, 1.0); filo.castShadow = false; asta.add(filo)
  punta(asta, [0, 1.15, 0], [0, 1.32, 0], 0.03, ferro, 5)
  falce.position.set(0.0, 0.95, 0.34); falce.rotation.x = 0.0
  const lanterna = perno(corpo, -0.32, 0.72, 0.3); cil(lanterna, 0.002, 0.002, 0.18, ferro, 0, 0.09, 0, 3); cil(lanterna, 0.05, 0.05, 0.1, M(0x2a2a30, { metalness: 0.6 }), 0, -0.04, 0, 6)
  sfera(lanterna, 0.045, lum(spirito2, 1.8), 0, -0.04, 0, 1, 1.1, 1, 8).castShadow = false; fiamma(lanterna, 0, -0.02, 0, 0.12, 0.03, 0x7a3cd8, spirito2, 2)
  const anime = []
  for (let i = 0; i < 4; i++) { const w = sfera(g, 0.04, lum(spirito, 1.2, { transparent: true, opacity: 0.7, depthWrite: false }), 0, 0, 0, 0.7, 1.3, 0.7, 7); w.castShadow = false; anime.push(w) }
  const catene = perno(corpo, 0.2, 0.7, 0.35); for (let i = 0; i < 5; i++) mesh(catene, new THREE.TorusGeometry(0.03, 0.009, 4, 8), ferro, 0, -i * 0.05, 0).rotation.y = i * PI / 2
  g.scale.setScalar(1.1)
  const origineFalce = marcatore(asta, 0.8, 1.2, 0)
  vivo(g, T => {
    const r = onda(T, 1.8), ev = evento(T, 6.5, 1.8, 3), fl = onda(T, 1.2)
    corpo.position.set(Math.sin(T * 0.6) * 0.03, 0.25 + onda(T, 1.1) * 0.05, 0); corpo.rotation.set(0.03 + r * 0.01, Math.sin(T * 0.45) * 0.1, Math.sin(T * 0.7) * 0.03)
    busto.rotation.set(0.05 + r * 0.02 + ev.b * 0.18, Math.sin(T * 0.4) * 0.12, 0); busto.scale.set(1 + r * 0.01, 1 + r * 0.02, 1 + r * 0.01)
    testa.rotation.set(0.1 + Math.sin(T * 0.9) * 0.05 + ev.b * 0.25, Math.sin(T * 0.5) * 0.5 + ev.b * Math.sin(T * 14) * 0.06, Math.sin(T * 0.8) * 0.06)
    mascella.rotation.x = 0.05 + ev.b * 0.35 + Math.max(0, Math.sin(T * 1.6)) * 0.04
    lembi.forEach((l, i) => { l.rotation.x = Math.sin(T * 1.8 - i * 0.8) * 0.1 + 0.05; l.rotation.z = Math.cos(T * 1.5 - i * 0.6) * 0.07 })
    bracci[0].sp.rotation.set(-0.9 + Math.sin(T * 1.1) * 0.03, 0, -0.35); bracci[0].go.rotation.x = -0.95
    bracci[1].sp.rotation.set(-0.55 + Math.sin(T * 1.3 + 1) * 0.03 - ev.b * 0.08, 0, 0.3); bracci[1].go.rotation.x = -0.7
    falce.position.set(0.0 + Math.sin(T * 0.6) * 0.02, 0.95, 0.34); falce.rotation.set(0.1 + Math.sin(T * 0.9) * 0.025 - ev.b * 0.06, Math.sin(T * 0.45) * 0.1, 0.0)
    lanterna.rotation.z = Math.sin(T * 1.6) * 0.18; lanterna.rotation.x = Math.sin(T * 1.3) * 0.1
    anime.forEach((w, i) => { const u = (T * 0.25 + i / 4) % 1, a = i * 1.7 + T * 0.4; w.position.set(Math.sin(a) * 0.6, 0.2 + u * 1.7, Math.cos(a) * 0.5 - 0.1); w.scale.setScalar(0.7 * Math.sin(u * PI) + 0.01) })
  })
  // il lembo di falce che sta in mano si porta nel riposo: falce in diagonale a terra davanti, impugnata a due mani
  dichiara(g, 'falciata', 1.0, 0.55)                                                             // la falce si leva a destra e taglia in un ampio arco da destra a sinistra
  g.userData.attacca = p => {
    const { s, W, L } = ritmo(p, 0.55)
    busto.rotation.y += W * -0.8 + L * 1.1; busto.rotation.x += -W * 0.1 + L * 0.2; testa.rotation.y += W * 0.4 - L * 0.7
    falce.rotation.z += W * -0.4 + L * 0.5; falce.rotation.x += W * -0.3 + L * 0.2; falce.rotation.y += W * -0.9 + L * 1.5
    bracci[0].sp.rotation.x += -W * 0.4 + L * 0.2; bracci[1].sp.rotation.x += -W * 0.4 + L * 0.2
    corpo.position.z += L * 0.3
    mascella.rotation.x += apertura(p, 0.55) * 0.4
  }
  return g
}

// ══════════════════════════════════════ IL MINOTAURO ══════════════════════════════════════
export function creaMinotauro () {
  inizia()
  const P = umano({ pelle: 0x6a3f2c, calzoni: 0x3a2a22, scarpa: 0x17110e, L1: 0.36, L2: 0.34, rg: 0.1, busto: [0.78, 0.7, 0.44], testa: 0.2, A1: 0.4, A2: 0.38, rb: 0.1, spalla: 1.0 })
  const { g, busto, testa, bacino, bracci, gambe } = P
  const pelo = M(0x2e1c16, { roughness: 1 }), pelo2 = M(0x4a2e22), ventre = M(0x8a5a40), osso = M(0xd8caa4), ferro = M(0x3c3f46, { metalness: 0.7, roughness: 0.4 }), ferro2 = M(0x6a6f78, { metalness: 0.8, roughness: 0.3 }), cuoio = M(0x4a2e1c)
  const buio = M(NERO, { roughness: 1 })
  // il torace scolpito: pettorali, addome, la pelliccia scura sulle spalle e sul collo
  for (const s of [-1, 1]) { sfera(busto, 0.5, ventre, s * 0.16, 0.5, 0.15, 0.4, 0.3, 0.22, 10) }
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) sfera(busto, 0.5, ventre, s * 0.07, 0.34 - i * 0.075, 0.18, 0.12, 0.08, 0.1, 6)
  for (let i = 0; i < 12; i++) { const a = -1.5 + i * 0.27; cono(busto, 0.06, 0.2, pelo, Math.sin(a) * 0.34, 0.74, Math.cos(a) * 0.16 - 0.06, 5).rotation.set(-0.2, 0, -Math.sin(a) * 1.0) }
  for (let i = 0; i < 7; i++) cono(busto, 0.06, 0.24, pelo, (i - 3) * 0.1, 0.55 - Math.abs(i - 3) * 0.04, -0.2, 5).rotation.x = -PI / 2 - 0.5     // la criniera lungo la schiena
  // il gonnellino di cuoio con le borchie e la cintura
  scatola(bacino, 0.8, 0.09, 0.5, cuoio, 0, 0.0, 0); for (const x of [-0.3, -0.1, 0.1, 0.3]) sfera(bacino, 0.02, ferro2, x, 0.0, 0.26, 1, 1, 0.6, 5)
  for (let i = -3; i <= 3; i++) scatola(bacino, 0.1, 0.3 + (i & 1) * 0.08, 0.015, cuoio, i * 0.1, -0.2, 0.23).rotation.z = i * 0.03
  // le catene di ferro in croce sul petto e i bracciali
  for (let i = 0; i < 12; i++) { const u = i / 11; mesh(busto, new THREE.TorusGeometry(0.035, 0.012, 4, 8), ferro, -0.33 + u * 0.66, 0.18 + u * 0.5, 0.2 + Math.sin(u * PI) * 0.05, 1, 1, 1).rotation.set(i % 2 * PI / 2, 0.3, 0) }
  sfera(busto, 0.05, lum(0xff7a20, 1.2), 0, 0.43, 0.26, 1, 1, 0.6, 7).castShadow = false
  for (const [i, b] of bracci.entries()) { const s = i ? 1 : -1; cil(b.go, 0.12, 0.11, 0.2, ferro2, 0, -0.18, 0.02, 8); for (let k = 0; k < 3; k++) cono(b.go, 0.022, 0.07, ferro, (k - 1) * 0.07, -0.18, 0.12, 4).rotation.x = PI / 2 }
  // la testa di toro: muso lungo con l'anello, narici che fumano, orecchie, occhi iniettati e due corna
  rozza(testa, 0.2, pelo2, 0, 0.0, -0.01, 1.0, 1.0, 1.05, 2)
  rozza(testa, 0.13, pelo2, 0, -0.09, 0.2, 0.95, 0.85, 1.4, 1)
  rozza(testa, 0.08, ventre, 0, -0.14, 0.3, 1.0, 0.7, 1.0, 1)
  for (let i = 0; i < 5; i++) cono(testa, 0.04, 0.13, pelo, (i - 2) * 0.05, 0.19 - Math.abs(i - 2) * 0.01, -0.02, 5).rotation.set(-0.2, 0, (i - 2) * 0.1)   // il ciuffo
  const occhi = [-1, 1].map(s => {
    scatola(testa, 0.12, 0.028, 0.04, pelo, s * 0.1, 0.11, 0.17).rotation.z = s * -0.4
    const o = occhio(testa, s * 0.1, 0.06, 0.17, 0.04, 0xff3a14, { emis: 2.0, giro: s * 0.5 })
    sfera(testa, 0.035, M(0x0d0b0b), s * 0.05, -0.16, 0.38, 1, 1.2, 0.8, 7)
    const or = perno(testa, s * 0.2, 0.02, -0.02); or.rotation.set(0.1, 0, s * -0.25); cono(or, 0.05, 0.16, pelo2, s * 0.06, 0, 0, 5).rotation.z = s * -1.35; cono(or, 0.03, 0.1, ventre, s * 0.05, 0, 0.02, 4).rotation.z = s * -1.35
    const h = perno(testa, s * 0.15, 0.15, 0.0); h.rotation.set(-0.6, s * 0.4, 0); cornoCurvo(h, s, 0.2, osso, 0.06, 0.8)
    return o
  })
  mesh(testa, new THREE.TorusGeometry(0.06, 0.013, 6, 14), lum(0xffa030, 1.5), 0, -0.2, 0.34, 1, 1, 1).rotation.x = 0.2
  const mascella = perno(testa, 0, -0.18, 0.22); sfera(mascella, 0.08, ventre, 0, -0.01, 0.08, 1.0, 0.45, 1.4, 8)
  for (const s of [-1, 1]) cono(mascella, 0.016, 0.08, osso, s * 0.07, 0.02, 0.18, 4)
  const fumo = []
  for (let i = 0; i < 4; i++) { const f = sfera(testa, 0.05, M(0xa09a92, { flatShading: false, transparent: true, opacity: 0.45, depthWrite: false }), 0, 0, 0, 1, 1, 1, 6); f.castShadow = false; fumo.push(f) }
  // la grande ascia a due lame (labrys), nella destra
  const ascia = perno(bracci[1].ma, 0, 0, 0)
  cil(ascia, 0.03, 0.03, 1.4, M(0x4a3020), 0, 0.3, 0, 7); sfera(ascia, 0.04, ferro2, 0, -0.4, 0, 1, 1, 1, 6)
  const lamaS = new THREE.Shape(); lamaS.moveTo(0, 0.18); lamaS.quadraticCurveTo(0.34, 0.32, 0.46, 0.0); lamaS.quadraticCurveTo(0.34, -0.32, 0, -0.18); lamaS.closePath()
  const lg = new THREE.ExtrudeGeometry(lamaS, { depth: 0.03, bevelEnabled: false }); lg.translate(0, 0, -0.015)
  for (const s of [-1, 1]) { const l = new THREE.Mesh(lg, ferro2); l.position.set(0, 0.88, 0); l.rotation.set(0, s > 0 ? PI / 2 : -PI / 2, 0); l.castShadow = true; ascia.add(l) }
  rozza(ascia, 0.06, ferro, 0, 0.88, 0, 1, 1, 1, 0); punta(ascia, [0, 0.9, 0], [0, 1.1, 0], 0.035, ferro2, 5)
  for (let k = 0; k < 4; k++) sfera(ascia, 0.012, lum(0xff4a14, 1.0), 0.0, 0.7 + k * 0.05, 0.0, 1, 1, 1, 5)
  ascia.rotation.x = 1.0
  g.scale.setScalar(1.0)
  vivo(g, T => {
    const r = onda(T, 1.9), ev = evento(T, 6.0, 1.7, 2), ns = evento(T, 4.7, 1.2, 0.5), pe = Math.sin(T * 0.65)
    bacino.position.set(pe * 0.03, P.H + Math.abs(Math.sin(T * 0.95)) * 0.015, 0); bacino.rotation.set(0.0, pe * 0.07, pe * 0.03)
    busto.rotation.set(0.12 + r * 0.02 + ev.b * 0.08, Math.sin(T * 0.45) * 0.12 - pe * 0.05, Math.sin(T * 0.8) * 0.04); busto.scale.set(1 + r * 0.015, 1 + r * 0.025, 1 + r * 0.02)
    P.collo.rotation.x = 0.1; testa.rotation.set(0.1 + Math.sin(T * 1.1) * 0.05 - ev.b * 0.3 + ns.b * 0.15, Math.sin(T * 0.55) * 0.4 + ev.b * Math.sin(T * 22) * 0.12, Math.sin(T * 0.8) * 0.05)
    mascella.rotation.x = 0.05 + ns.b * 0.2 + ev.b * 0.4
    bracci[1].sp.rotation.set(-0.3 + Math.sin(T * 1.3) * 0.04 - ev.b * 0.3, 0, 0.28); bracci[1].go.rotation.x = -0.9 - ev.b * 0.2
    bracci[0].sp.rotation.set(-0.15 + Math.sin(T * 1.5 + 1) * 0.04 - ev.b * 0.6, 0, -0.3 - ev.b * 0.2); bracci[0].go.rotation.x = -0.5 - ev.b * 0.3
    ascia.rotation.x = 1.0 + Math.sin(T * 1.5) * 0.04 - ev.b * 0.2
    gambe.forEach(({ an, gi }, i) => { an.rotation.x = (i ? -1 : 1) * pe * 0.05 - 0.03; gi.rotation.x = 0.05 })
    fumo.forEach((f, i) => { const u = ((T * 0.9 + i / 4) % 1); f.position.set((i % 2 ? 1 : -1) * 0.05, -0.17 + u * 0.12, 0.38 + u * 0.12); f.scale.setScalar(ns.b * (0.4 + u * 1.3) + 0.001) })
  })
  dichiara(g, 'ascia-a-due-lame', 1.0, 0.55)                                                     // alza la labrys con tutt'e due le mani e la cala
  g.userData.attacca = p => {
    const { s, W, L } = ritmo(p, 0.55)
    bracci[1].sp.rotation.x += W * -2.2 + L * 0.5; bracci[1].go.rotation.x += W * -0.5; bracci[0].sp.rotation.x += W * -1.5 + L * 0.2; bracci[0].go.rotation.x += W * -0.5
    ascia.rotation.x += W * -0.7 + L * 0.9; busto.rotation.x += -W * 0.3 + L * 0.6; testa.rotation.x += -W * 0.35 + L * 0.45; mascella.rotation.x += W * 0.2 + apertura(p, 0.55) * 0.5
    g.position.z = L * 0.34; bacino.position.y += -L * 0.1
    gambe.forEach(({ an, gi }) => { an.rotation.x += W * 0.1 - L * 0.25; gi.rotation.x += L * 0.2 })
  }
  return g
}

// ══════════════════════════════════════ IL DRAGO DI LAVA ══════════════════════════════════════
Object.assign(COLORI, {
  lava: { nome: 'Lava', forza: 8, corpo: 0x2b2220, scaglie: 0x14100f, luce: 0xff6a1c, pancia: 0x6a2a12, membrana: 0x5a1a0a, bordo: 0xffa030, corna: 0x15100e, frange: 0xff7a10, artigli: 0xe8d8b0, occhi: 0xffe060, fiamma: 'arancio', emissivo: 0x7a2000, emissivoInt: 0.25, traslucida: false },
})
/** Il superboss: il drago grande di draghi.js in una livrea di basalto con le scaglie di brace. Idle, soffio, morso, ala e coda sono i suoi. */
export function creaDragoDiLava () {
  const d = creaDragoGrande('lava')
  return d
}

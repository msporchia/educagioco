// Le ombre e le cose dell'abisso: l'ombra, lo spettro della lanterna, l'occhio dell'abisso, lo strisciante, il demone minore e il
// signore dell'abisso (superboss). Contratto di mostri.js; attrezzi in landa-base.js.
import {
  THREE, M, mesh, sfera, rozza, scatola, cil, cono, perno, punta, onda, PI, NERO, lucido, lum, vivoMat, arto, occhio, lume, fasi, imp, apre, gesto,
  marker, dichiara, vivifica, lembo, doppio, liscio,
} from './landa-base.js'

/** Una catena di segmenti che si assottigliano, lungo +y locale (un tentacolo, una coda). Torna i perni, dal primo all'ultimo. */
export function catena (padre, n, L, r0, r1, mat, { x = 0, y = 0, z = 0, ventose = null, punta: pt = true, seg = 6 } = {}) {
  const radice = perno(padre, x, y, z), perni = []
  let cur = radice
  for (let i = 0; i < n; i++) {
    const ra = r0 + (r1 - r0) * i / n, rb = r0 + (r1 - r0) * (i + 1) / n
    const p = perno(cur, 0, i ? L : 0, 0); perni.push(p)
    cil(p, rb, ra, L, mat, 0, L / 2, 0, seg)
    sfera(p, ra, mat, 0, 0, 0, 1, 1, 1, 6)
    if (ventose && i % 2 === 0 && i > 0) sfera(p, ra * 0.42, ventose, 0, L * 0.5, ra * 0.82, 1, 1, 0.6, 5)
    cur = p
  }
  if (pt) cono(cur, r1 * 1.1, L * 0.8, mat, 0, L + L * 0.4, 0, seg)
  perni.radice = radice
  return perni
}
/** Fa ondeggiare una catena: ogni segmento ruota un po' di più, con la fase che scorre. */
export function ondeggia (c, T, amp, vel, fase = 0, curva = 0) {
  c.forEach((p, i) => { p.rotation.x = curva + Math.sin(T * vel - i * 0.75 + fase) * amp; p.rotation.z = Math.cos(T * vel * 0.8 - i * 0.6 + fase * 1.3) * amp * 0.8 })
}
/** Un'ala da pipistrello/demone: braccio, polso, tre dita e membrana. `s` = ±1 (la sinistra è la destra specchiata). Torna { sp, pol }. */
export function ala (padre, s, size, { osso: mo, pelle, x = 0, y = 0, z = 0, raggio = 0.05 }) {
  const sp = perno(padre, x, y, z); sp.scale.x = s
  const W = [0.5 * size, 0.38 * size, -0.12 * size]
  arto(sp, [0, 0, 0], W, raggio, raggio * 0.7, mo, 6)
  const pol = perno(sp, ...W)
  const T = [[0.52, 0.28, -0.1], [0.56, -0.18, -0.18], [0.36, -0.55, -0.22]].map(v => v.map(c => c * size))
  T.forEach(t => arto(pol, [0, 0, 0], t, raggio * 0.6, raggio * 0.3, mo, 5, false))
  const tri = (g, pts) => {
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts.flat()), 3)); geo.computeVertexNormals()
    const m = new THREE.Mesh(geo, pelle); m.castShadow = true; g.add(m)
  }
  tri(pol, [[0, 0, 0], T[0], T[1], [0, 0, 0], T[1], T[2]])
  const B = [0.02 * size, -0.62 * size, -0.2 * size]
  tri(sp, [[0, 0, 0], W, B, W, [W[0] + T[2][0], W[1] + T[2][1], W[2] + T[2][2]], B])
  return { sp, pol, s }
}
const membrana = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, side: THREE.DoubleSide, flatShading: true, ...o })

// ══════════════════════════════════════ L'OMBRA ══════════════════════════════════════
export function creaOmbra (variante = 'landa') {
  const F = variante === 'foresta'
  const corpoC = F ? 0x16241e : 0x1f1830, lumeC = F ? 0xa8ffb4 : 0xdcc4ff, vap = F ? 0x2d6a4a : 0x6a3fb0
  const g = new THREE.Group(), f = perno(g, 0, 0.1, 0)
  const nebbia = new THREE.MeshStandardMaterial({ color: F ? 0x16291f : 0x251a42, roughness: 0.85, transparent: true, opacity: 0.95, emissive: vap, emissiveIntensity: 0.28, flatShading: false })
  const nebbia2 = new THREE.MeshStandardMaterial({ color: corpoC, roughness: 0.9, transparent: true, opacity: 0.6, emissive: vap, emissiveIntensity: 0.3, flatShading: false, depthWrite: false })
  const busto = perno(f, 0, 0.5, 0)
  const alone = new THREE.MeshStandardMaterial({ color: vap, roughness: 1, transparent: true, opacity: 0.28, emissive: vap, emissiveIntensity: 0.8, depthWrite: false })
  const parte = (r, y, z, sx, sy, sz, seg = 14) => { sfera(busto, r, nebbia, 0, y, z, sx, sy, sz, seg); const h = sfera(busto, r * 1.22, alone, 0, y, z, sx, sy, sz, 10); h.castShadow = false }
  parte(0.2, 0.0, 0.0, 1.0, 1.3, 0.9)                                              // il bacino che si assottiglia
  parte(0.27, 0.4, 0.04, 1.0, 1.25, 0.85)                                          // il torace curvo
  parte(0.24, 0.72, 0.06, 1.35, 0.6, 0.85)                                         // le spalle
  const coda = []
  for (let i = 0; i < 5; i++) { const s = sfera(busto, 0.17 - i * 0.025, nebbia, 0, -0.18 - i * 0.14, -0.04 - i * 0.07, 1, 1.4, 1, 10); coda.push(s); const h = sfera(s, 0.17 - i * 0.025, alone, 0, 0, 0, 1.25, 1.15, 1.25, 8); h.castShadow = false }
  const testa = perno(busto, 0, 0.94, 0.14)
  sfera(testa, 0.2, nebbia, 0, 0.0, 0.0, 0.95, 1.1, 1.05, 14)
  sfera(testa, 0.25, alone, 0, 0.0, 0.0, 0.95, 1.1, 1.05, 10).castShadow = false
  for (const s of [-1, 1]) { const o = cono(testa, 0.07, 0.34, nebbia, s * 0.13, 0.22, -0.02, 5); o.rotation.set(0.1, 0, s * -0.45) }          // le due punte di fumo sulla testa
  cono(testa, 0.1, 0.34, nebbia, 0, 0.12, -0.15, 6).rotation.x = -1.2
  const volto = perno(testa, 0, 0.0, 0.17)
  sfera(volto, 0.15, new THREE.MeshStandardMaterial({ color: 0x06040a, roughness: 1 }), 0, -0.01, -0.02, 1.0, 1.0, 0.55, 10)
  const occhi = []
  for (const s of [-1, 1]) {
    const l = lume(volto, s * 0.08, 0.04, 0.05, 0.05, lumeC, { sx: 1.7, sy: 0.6, emis: 5 }); l.rotation.z = s * -0.45; occhi.push(l)
    const h = sfera(volto, 0.09, vivoMat(lumeC, 0.8, { transparent: true, opacity: 0.18, depthWrite: false }), s * 0.08, 0.04, 0.045, 1.4, 0.8, 0.4, 8); h.castShadow = false
  }
  const sorriso = []
  for (let i = -3; i <= 3; i++) { const d = cono(volto, 0.011, 0.045 + (i & 1 ? 0.025 : 0), lum(lumeC, 3), i * 0.024, -0.075 + Math.abs(i) * 0.008, 0.05, 3); d.castShadow = false; d.rotation.x = PI; d.rotation.z = i * 0.06; sorriso.push(d) }
  // le braccia: lunghe e sottili, finiscono in artigli di fumo
  const bracci = [], gomiti = [], mani = []
  for (const s of [-1, 1]) {
    const sp = perno(busto, s * 0.34, 0.72, 0.02); bracci.push(sp)
    arto(sp, [0, 0, 0], [0, -0.42, 0], 0.075, 0.055, nebbia, 7)
    const go = perno(sp, 0, -0.42, 0); gomiti.push(go)
    arto(go, [0, 0, 0], [0, -0.5, 0], 0.055, 0.04, nebbia, 7)
    const ma = perno(go, 0, -0.5, 0); mani.push(ma)
    sfera(ma, 0.05, nebbia, 0, 0, 0, 1, 1.2, 0.8, 7)
    for (let d = -1.5; d <= 1.5; d++) { const dd = perno(ma, d * 0.028, -0.04, 0); dd.rotation.x = -0.2; dd.rotation.z = d * 0.1; arto(dd, [0, 0, 0], [0, -0.1, 0.01], 0.014, 0.01, nebbia, 4, false); const un = cono(dd, 0.011, 0.1, lum(lumeC, 1.2), 0, -0.16, 0.012, 4); un.rotation.x = PI }
  }
  // i filamenti di fumo che pendono da spalle e vita
  const filo = []
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * PI * 2, p = perno(busto, Math.sin(a) * 0.22, 0.05 + (i % 2) * 0.35, Math.cos(a) * 0.15)
    const c = cono(p, 0.05, 0.35 + (i % 3) * 0.12, nebbia2, 0, -0.18, 0, 5); c.rotation.x = PI; c.castShadow = false; filo.push(p)
  }
  if (F) for (let i = 0; i < 5; i++) { const fo = sfera(busto, 0.05, M(0x3f7a3a), Math.sin(i * 2.4) * 0.26, 0.2 + i * 0.12, 0.2 * Math.cos(i * 2.4), 1.4, 0.4, 1, 5); fo.rotation.set(i, i * 2, 0) }
  const vapore = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), new THREE.MeshBasicMaterial({ color: vap, transparent: true, opacity: 0.2, depthWrite: false }))
  vapore.rotation.x = -PI / 2; vapore.position.y = 0.012; g.add(vapore)
  const anima = T => {
    const r = onda(T, 1.5), ra = gesto(T, 6.7, 1.5, 2.4), tw = gesto(T, 4.1, 0.5, 0.5)
    f.position.set(onda(T, 0.5) * 0.04, 0.1 + onda(T, 1.2) * 0.06, 0)
    busto.rotation.set(0.3 + r * 0.02 - ra * 0.2, onda(T, 0.45) * 0.1, onda(T, 0.9) * 0.07)
    busto.scale.set(1 + r * 0.012, 1 + r * 0.022, 1)
    testa.rotation.set(0.1 + onda(T, 0.7) * 0.06 + ra * 0.2, onda(T, 0.4) * 0.4 + tw * onda(T, 0.9) * 0.3, onda(T, 1.0) * 0.1)
    coda.forEach((s, i) => { s.position.x = Math.sin(T * 1.5 - i * 0.9) * 0.05 * (i + 1) })
    bracci[0].rotation.set(-0.15 - ra * 1.2 + onda(T, 1.2) * 0.06, 0.1, 0.2 - ra * 0.2); bracci[1].rotation.set(-0.1 - ra * 1.2 + onda(T, 1.2, 1.3) * 0.06, -0.1, -0.2 + ra * 0.2)
    gomiti[0].rotation.x = -0.35 - ra * 0.3 + onda(T, 1.4) * 0.05; gomiti[1].rotation.x = -0.4 - ra * 0.3 + onda(T, 1.4, 1) * 0.05
    mani.forEach((m, i) => { m.rotation.x = -0.1 - ra * 0.3 + onda(T, 2.0, i) * 0.12 })
    filo.forEach((p, i) => { p.rotation.x = onda(T, 1.9 + i * 0.1, i) * 0.18; p.rotation.z = onda(T, 1.3, i * 1.7) * 0.15 })
    occhi.forEach((l, i) => { l.children[0].material.emissiveIntensity = 3.6 + onda(T, 2.3, i) * 0.8 + ra * 1.5 })
    sorriso.forEach((d, i) => { d.scale.y = 0.8 + Math.max(0, ra) * 1.0 + onda(T, 3, i) * 0.1 })
    nebbia.opacity = 0.95 - tw * 0.12; nebbia.emissiveIntensity = 0.28 + ra * 0.3
    vapore.scale.setScalar(1 + onda(T, 0.9) * 0.08)
  }
  dichiara(g, 'artiglio', 0.85, 0.55)
  g.userData.attacca = p => {                                                  // si rialza, si gonfia, poi si getta in avanti con le dita aperte
    const F2 = fasi(p, 0.55)
    imp(f.position, F2, [null, null, -0.18], [null, 0.0, 0.5])
    imp(busto.rotation, F2, [-0.35, null, null], [0.55, null, null]); imp(testa.rotation, F2, [-0.3, null, null], [0.3, null, null])
    bracci.forEach(b => imp(b.rotation, F2, [-2.5, null, null], [-1.2, null, null])); gomiti.forEach(go => imp(go.rotation, F2, [-0.6, null, null], [-0.1, null, null]))
    mani.forEach(m => imp(m.rotation, F2, [-0.2, null, null], [0.35, null, null]))
    sorriso.forEach(d => { d.scale.y += F2.c * 1.2 })
  }
  return vivifica(g, anima, [f.position, busto.rotation, testa.rotation, ...bracci.map(b => b.rotation), ...gomiti.map(b => b.rotation), ...mani.map(b => b.rotation)])
}

// ══════════════════════════════════════ LO SPETTRO DELLA LANTERNA ══════════════════════════════════════
export function creaSpettro () {
  const g = new THREE.Group(), f = perno(g, 0, 0.18, 0)
  const verde = 0x8affc0
  const velo = new THREE.MeshStandardMaterial({ color: 0x9fbfb4, transparent: true, opacity: 0.8, roughness: 0.6, emissive: 0x2d8a68, emissiveIntensity: 0.4, side: THREE.DoubleSide, depthWrite: false })
  const velo2 = new THREE.MeshStandardMaterial({ color: 0x7ea597, transparent: true, opacity: 0.7, roughness: 0.7, emissive: 0x1d6a50, emissiveIntensity: 0.3, side: THREE.DoubleSide, depthWrite: false })
  const buio = new THREE.MeshStandardMaterial({ color: 0x050a08, roughness: 1 })
  const osso1 = M(0xcfe0d4, { roughness: 0.5 })
  const prof = [[0.0, 0.0], [0.36, 0.0], [0.34, 0.15], [0.26, 0.6], [0.2, 1.0], [0.14, 1.22], [0.18, 1.34], [0.0, 1.44]].map(([r, y]) => new THREE.Vector2(r, y))
  const mantello = mesh(f, new THREE.LatheGeometry(prof, 12), velo, 0, 0.0, 0.0, 1, 1, 0.85); mantello.castShadow = false
  const lembi = []
  for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2; lembi.push(lembo(f, 0.18, 0.26 + (i % 3) * 0.1, velo2, Math.sin(a) * 0.35, 0.1, Math.cos(a) * 0.3, 0, a, 0)) }
  const cima = perno(f, 0, 1.18, 0)
  sfera(cima, 0.27, velo, 0, -0.03, 0, 1.3, 0.55, 0.9, 10)
  const testa = perno(cima, 0, 0.22, 0.03)
  sfera(testa, 0.2, velo, 0, 0.0, -0.01, 1, 1.12, 1.05, 12)
  cono(testa, 0.14, 0.3, velo, 0, 0.14, -0.17, 6).rotation.x = -1.15
  sfera(testa, 0.145, buio, 0, -0.01, 0.07, 1, 1.12, 0.85, 10)
  const occhi = []
  for (const s of [-1, 1]) occhi.push(lume(testa, s * 0.065, 0.02, 0.17, 0.034, verde, { sx: 1, sy: 1.3, emis: 4.5 }))
  const muso = scatola(testa, 0.1, 0.016, 0.01, lum(verde, 2.5), 0, -0.07, 0.19); muso.castShadow = false
  // le braccia sottili: la destra tiene la lanterna davanti, la sinistra pende con le dita lunghe
  const bracci = [], gomiti = [], mani = []
  for (const s of [-1, 1]) {
    const sp = perno(cima, s * 0.27, -0.02, 0.0); bracci.push(sp)
    cono(sp, 0.1, 0.34, velo, 0, -0.17, 0, 7).rotation.x = PI
    const go = perno(sp, 0, -0.3, 0); gomiti.push(go)
    arto(go, [0, 0, 0], [0, -0.38, 0], 0.045, 0.035, osso1, 6)
    const ma = perno(go, 0, -0.38, 0); mani.push(ma)
    sfera(ma, 0.036, osso1, 0, 0, 0, 1, 1.2, 0.8, 7)
    for (let d = -1.5; d <= 1.5; d++) { const dd = perno(ma, d * 0.02, -0.03, 0); dd.rotation.x = -0.3 + (s > 0 ? -0.6 : 0.1); arto(dd, [0, 0, 0], [0, -0.09, 0], 0.01, 0.007, osso1, 4, false); cono(dd, 0.008, 0.05, osso1, 0, -0.12, 0, 4).rotation.x = PI }
  }
  // la lanterna: gabbia di ferro, cuore di fuoco fatuo, appesa a un'asta e a una catena
  const asta = perno(mani[1], 0, -0.02, 0.0)
  cil(asta, 0.012, 0.012, 0.5, M(0x2c3a35), 0, 0.0, 0.18, 5).rotation.x = PI / 2
  const lanterna = perno(asta, 0, -0.03, 0.42)
  cil(lanterna, 0.005, 0.005, 0.16, M(0x2c3a35), 0, 0.08, 0, 4)
  const cuore = sfera(lanterna, 0.075, vivoMat(verde, 3.6), 0, -0.1, 0, 1, 1.15, 1, 9); cuore.castShadow = false
  const alone = sfera(lanterna, 0.2, vivoMat(verde, 1, { transparent: true, opacity: 0.16, depthWrite: false }), 0, -0.1, 0, 1, 1, 1, 9); alone.castShadow = false
  const ferro = M(0x2b3a35, { metalness: 0.6, roughness: 0.5 })
  cil(lanterna, 0.06, 0.1, 0.03, ferro, 0, 0.02, 0, 6); cil(lanterna, 0.1, 0.08, 0.03, ferro, 0, -0.23, 0, 6)
  for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4; scatola(lanterna, 0.012, 0.25, 0.012, ferro, Math.sin(a) * 0.085, -0.11, Math.cos(a) * 0.085) }
  const centro = marker(lanterna, 0, -0.1, 0.1)
  const anima = T => {
    const r = onda(T, 1.2), ev = gesto(T, 7.6, 1.5, 2.2), ra = gesto(T, 4.6, 0.4, 0.6)
    f.position.set(onda(T, 0.45) * 0.03, 0.18 + onda(T, 1.0) * 0.07, 0)
    cima.rotation.set(0.05 + r * 0.012 - ev * 0.1, onda(T, 0.4) * 0.08, onda(T, 0.7) * 0.04)
    testa.rotation.set(0.1 + onda(T, 0.6) * 0.05, onda(T, 0.45) * 0.35 + ra * 0.25, onda(T, 0.9) * 0.07 + ra * 0.1)
    bracci[0].rotation.set(0.05 + onda(T, 1.0) * 0.05, 0.0, 0.1); gomiti[0].rotation.x = -0.15 + onda(T, 1.3) * 0.05
    mani[0].rotation.x = 0.1 + onda(T, 1.9) * 0.2
    bracci[1].rotation.set(-0.7 - ev * 0.5 + onda(T, 1.0, 1) * 0.04, -0.1, -0.1); gomiti[1].rotation.x = -0.5 - ev * 0.2
    asta.rotation.x = 0.1 + onda(T, 1.1) * 0.03
    lanterna.rotation.set(onda(T, 1.6) * 0.14 + ev * 0.1, 0, onda(T, 1.3, 1) * 0.1)
    cuore.material.emissiveIntensity = 3.4 + onda(T, 5) * 0.5 + onda(T, 11) * 0.3 + ev * 3
    cuore.scale.set(1 + onda(T, 9) * 0.05, 1.15 + onda(T, 7) * 0.05 + ev * 0.2, 1); alone.scale.setScalar(1 + ev * 1.4 + onda(T, 3) * 0.06)
    lembi.forEach((l, i) => { l.rotation.x = onda(T, 1.4 + i * 0.1, i * 1.3) * 0.16; l.rotation.z = onda(T, 1.0, i) * 0.08 })
    occhi.forEach((l, i) => { l.children[0].material.emissiveIntensity = 3.6 + onda(T, 2, i) * 0.8 })
  }
  dichiara(g, 'lanterna', 0.9, 0.55, { tipo: 'luce', origine: centro })
  g.userData.attacca = p => {                                                  // solleva la lanterna indietro e la scaglia in avanti in un lampo
    const F2 = fasi(p, 0.55)
    imp(f.position, F2, [null, null, -0.1], [null, null, 0.3])
    imp(cima.rotation, F2, [-0.3, null, null], [0.35, null, null]); imp(testa.rotation, F2, [-0.1, null, null], [0.2, null, null])
    imp(bracci[1].rotation, F2, [-2.4, null, null], [-1.3, null, null]); imp(gomiti[1].rotation, F2, [-0.3, null, null], [-0.1, null, null])
    imp(bracci[0].rotation, F2, [-0.5, null, 0.5], [-0.8, null, 0.5])
    imp(lanterna.rotation, F2, [-0.5, null, null], [0.5, null, null])
    cuore.scale.multiplyScalar(1 + F2.c * 0.5 + F2.k * 1.2); alone.scale.multiplyScalar(1 + F2.c * 1.4 + F2.k * 2.5)
  }
  return vivifica(g, anima, [f.position, cima.rotation, testa.rotation, ...bracci.map(b => b.rotation), ...gomiti.map(b => b.rotation), lanterna.rotation, cuore.scale, alone.scale])
}

// ══════════════════════════════════════ L'OCCHIO DELL'ABISSO ══════════════════════════════════════
export function creaOcchioAbisso () {
  const g = new THREE.Group(), f = perno(g, 0, 0.95, 0)
  const carne = M(0x4a2f55, { roughness: 0.7 }), carne2 = M(0x2f1d3a), pall = M(0xe6dcee, { flatShading: false, roughness: 0.3 }), vena = M(0xa22d4a, { flatShading: false })
  const viola = 0xc86bff, vent = M(0xd9a0c8, { roughness: 0.5 })
  const glob = perno(f, 0, 0, 0)
  sfera(glob, 0.4, pall, 0, 0, 0, 1, 1, 1, 14)
  for (let i = 0; i < 7; i++) { const a = i * 2.2 + 0.4, e = 0.25 + (i % 3) * 0.3; const v = scatola(glob, 0.012, 0.18 + (i % 2) * 0.1, 0.012, vena, Math.sin(a) * Math.sin(e + 0.5) * 0.395, Math.cos(e + 0.5) * 0.395, Math.cos(a) * Math.sin(e + 0.5) * 0.39); v.lookAt(new THREE.Vector3(0, 0, 0).add(v.position.clone().multiplyScalar(2))); v.rotation.z += i }
  const sguardo = perno(glob, 0, 0, 0)
  const iride = perno(sguardo, 0, 0, 0.385)
  const ir = sfera(iride, 0.185, vivoMat(0x7a2cd8, 1.0, { flatShading: false }), 0, 0, 0, 1, 1, 0.35, 16)
  sfera(iride, 0.12, vivoMat(0xd04ad0, 1.3, { flatShading: false }), 0, 0, 0.02, 1, 1, 0.3, 14)
  const pupilla = sfera(iride, 0.075, M(NERO, { roughness: 0.1, flatShading: false }), 0, 0, 0.045, 0.7, 1.9, 0.4, 12)
  sfera(iride, 0.03, lum(0xffffff, 1), 0.05, 0.07, 0.065, 1, 1, 0.6, 6)
  // il corpo di carne dietro il globo e le sue spine
  rozza(f, 0.32, carne, 0, -0.05, -0.28, 1.15, 1.0, 1.1, 2)
  for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2; cono(f, 0.05, 0.22, carne2, Math.sin(a) * 0.36, Math.cos(a) * 0.36, -0.14, 5).rotation.set(0, 0, -a + PI) ; const sp = f.children[f.children.length - 1]; sp.rotation.set(0, 0, 0); sp.lookAt(new THREE.Vector3(Math.sin(a) * 2, Math.cos(a) * 2, -0.14)); sp.rotateX(PI / 2) }
  // le palpebre: due calotte di carne con l'orlo
  const lid = (su) => {
    const p = perno(glob, 0, 0, 0)
    mesh(p, new THREE.SphereGeometry(0.43, 14, 6, 0, PI * 2, 0, 0.95), carne, 0, 0, 0, 1, su, 1)
    const orlo = mesh(p, new THREE.TorusGeometry(0.43 * Math.sin(0.95), 0.025, 4, 14), carne2, 0, su * 0.43 * Math.cos(0.95), 0); orlo.rotation.x = PI / 2
    return p
  }
  const su = lid(1), giu = lid(-1)
  // i tentacoli sotto
  const tent = []
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * PI * 2 + 0.3
    const c = catena(f, 4, 0.32, 0.075, 0.02, carne, { x: Math.sin(a) * 0.2, y: -0.18, z: Math.cos(a) * 0.14 - 0.25, ventose: vent })
    c.radice.rotation.set(PI + Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3 + PI * 0)
    tent.push({ c, a })
  }
  const ombra = new THREE.Mesh(new THREE.CircleGeometry(0.4, 18), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false }))
  ombra.rotation.x = -PI / 2; ombra.position.y = 0.012; g.add(ombra)
  const mira = marker(sguardo, 0, 0, 0.5)
  const anima = T => {
    const b = ((T + 0.4) % 4.3) / 4.3, ch = b < 0.04 ? Math.sin(b / 0.04 * PI) : 0, ch2 = ((T + 1.1) % 11.3) < 0.18 ? Math.sin(((T + 1.1) % 11.3) / 0.18 * PI) : 0
    const chiuso = Math.max(ch, ch2), st = gesto(T, 6.4, 2, 2.6)
    f.position.set(onda(T, 0.5) * 0.04, 0.95 + onda(T, 1.3) * 0.07, 0)
    glob.rotation.set(onda(T, 0.6) * 0.08, onda(T, 0.45) * 0.12, onda(T, 0.9) * 0.05)
    sguardo.rotation.set(onda(T, 0.8) * 0.4 + onda(T, 2.3) * 0.08, onda(T, 0.55) * 0.35 + st * Math.sin(T * 2.5) * 0.4, 0)
    iride.scale.setScalar(1 + onda(T, 0.9) * 0.08 + st * 0.2); pupilla.scale.set(0.65, 1.7 * (1 - st * 0.5) + onda(T, 1.1) * 0.1, 0.4)
    su.rotation.x = -0.5 + chiuso * 1.3 - st * 0.3; giu.rotation.x = 0.5 - chiuso * 1.3 + st * 0.2
    tent.forEach(({ c, a }, i) => ondeggia(c, T, 0.22, 2.0 + (i % 3) * 0.15, i * 1.1, 0.25))
    ir.material.emissiveIntensity = 1.0 + onda(T, 2.4) * 0.25 + st * 1.2
    ombra.scale.setScalar(1 - onda(T, 1.3) * 0.08)
  }
  dichiara(g, 'sguardo', 0.9, 0.55, { tipo: 'raggio', origine: mira })
  g.userData.attacca = p => {                                                  // spalanca le palpebre, si ritrae, il bagliore cresce e scatta il raggio
    const F2 = fasi(p, 0.55)
    imp(f.position, F2, [null, 1.05, -0.28], [null, 0.95, 0.38])
    imp(glob.rotation, F2, [-0.2, null, null], [0.12, null, null])
    sguardo.rotation.x *= 1 - F2.c * 0.9; sguardo.rotation.y *= 1 - F2.c * 0.9
    su.rotation.x -= (su.rotation.x + 0.85) * (F2.c + F2.k * 0.5); giu.rotation.x -= (giu.rotation.x - 0.85) * (F2.c + F2.k * 0.5)
    ir.material.emissiveIntensity += F2.c * 3 + F2.k * 5; iride.scale.multiplyScalar(1 + F2.c * 0.4 + F2.k * 0.7)
    tent.forEach(({ c }) => c.forEach(pp => { pp.rotation.x += F2.c * 0.35 - F2.k * 0.25 }))
  }
  return vivifica(g, anima, [f.position, glob.rotation, sguardo.rotation, su.rotation, giu.rotation, iride.scale, ...tent.flatMap(({ c }) => c.map(p => p.rotation))])
}

// ══════════════════════════════════════ LO STRISCIANTE (i tentacoli dell'abisso) ══════════════════════════════════════
export function creaStrisciante () {
  const g = new THREE.Group()
  const pelle = M(0x3c2a52, { roughness: 0.6 }), ventre = M(0xc890b8, { roughness: 0.5 }), roccia = M(0x2e2a36), viola = 0xc86bff
  // la buca: un anello di sassi, il buio dentro e due occhi che spiano
  const buio = new THREE.Mesh(new THREE.CircleGeometry(0.62, 22), new THREE.MeshBasicMaterial({ color: 0x050308 })); buio.rotation.x = -PI / 2; buio.position.y = 0.02; g.add(buio)
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; rozza(g, 0.12 + (i % 3) * 0.04, i % 2 ? roccia : M(0x403a4a), Math.sin(a) * 0.66, 0.06, Math.cos(a) * 0.66, 1.2, 0.6 + (i % 2) * 0.3, 1, 0) }
  const occhi = []
  for (const s of [-1, 1]) { const l = lume(g, s * 0.1, 0.09, 0.12, 0.045, viola, { sx: 1.4, sy: 0.6, emis: 4 }); l.rotation.z = s * -0.3; occhi.push(l) }
  const T4 = []
  const N = 6
  for (let i = 0; i < N; i++) {
    const a = i / N * PI * 2 + 0.4, lung = [1.0, 0.8, 1.15, 0.7, 0.95, 0.85][i]
    const c = catena(g, 6, 0.26 * lung, 0.115, 0.02, pelle, { x: Math.sin(a) * 0.24, y: 0.02, z: Math.cos(a) * 0.24, ventose: ventre })
    T4.push({ c, a, i })
  }
  const anima = T => {
    const q = Math.floor(T / 3.2) % N, up = gesto(T, 3.2, 0, 3.2)
    T4.forEach(({ c, a, i }) => {
      const alto = i === q ? up : 0
      ondeggia(c, T, 0.2 + alto * 0.12, 1.5 + (i % 3) * 0.25, i * 1.7, 0.22 - alto * 0.12)
      c.radice.rotation.set(0.42 * Math.cos(a) - alto * 0.3 * Math.cos(a), 0, -0.42 * Math.sin(a) + alto * 0.3 * Math.sin(a))
    })
    occhi.forEach((l, i) => { l.position.y = 0.09 + onda(T, 0.8, i) * 0.02; l.children[0].material.emissiveIntensity = 3.5 + onda(T, 1.9, i) * 0.8 })
    buio.scale.setScalar(1 + onda(T, 1.2) * 0.02)
  }
  g.scale.setScalar(1.25)
  dichiara(g, 'frustata', 0.85, 0.55)
  g.userData.attacca = p => {                                                  // il tentacolo davanti si inarca indietro e frusta in avanti; gli altri si rizzano
    const F2 = fasi(p, 0.55)
    T4.forEach(({ c, a }, i) => {
      const fr = i === 0 || i === 5 ? 1 : 0.35, dir = 1
      c.forEach((pp, k) => { pp.rotation.x *= 1 - F2.c * 0.8; pp.rotation.z *= 1 - F2.c * 0.8; if (k < 4) pp.rotation.x += F2.k * 0.3 * fr })
      c.radice.rotation.x += (-F2.c * 0.7 + F2.k * 1.7) * fr * dir
    })
    g.position.z += F2.k * 0.1 - F2.c * 0.04
  }
  return vivifica(g, anima, [g.position, ...T4.flatMap(({ c }) => [c.radice.rotation, ...c.map(p => p.rotation)])])
}

// ══════════════════════════════════════ IL DEMONE DELL'ABISSO ══════════════════════════════════════
export function creaDemone () {
  const g = new THREE.Group()
  const pelle = M(0x6e1d2e), scura = M(0x3a0f1e), ventre = M(0xa2503c), corno = M(0xd6c9a8, { roughness: 0.5 }), art = M(0x1c1214), buio = M(NERO, { roughness: 1 })
  const fiam = 0xffa21c, mem = membrana(0x4d1230, { emissive: 0x2a0818, emissiveIntensity: 0.4 })
  const corpo = perno(g, 0, 0.55, 0)
  rozza(corpo, 0.28, pelle, 0, 0.1, 0, 1.0, 1.15, 0.85, 2)
  rozza(corpo, 0.22, ventre, 0, 0.08, 0.1, 0.8, 1.0, 0.55, 1)
  rozza(corpo, 0.26, pelle, 0, 0.42, 0.03, 1.25, 0.8, 0.9, 2)
  for (let i = 0; i < 5; i++) cono(corpo, 0.04, 0.14, scura, 0, 0.5 - i * 0.12, -0.2 - (i % 2) * 0.02, 4).rotation.x = -1.2           // la cresta di spine sul dorso
  const testa = perno(corpo, 0, 0.66, 0.1)
  rozza(testa, 0.2, pelle, 0, 0.0, 0.0, 1.05, 0.95, 1.05, 2)
  rozza(testa, 0.12, pelle, 0, -0.06, 0.15, 1.0, 0.8, 1.2, 1)
  const mascella = perno(testa, 0, -0.1, 0.1)
  rozza(mascella, 0.085, scura, 0, -0.01, 0.1, 1.0, 0.45, 1.4, 1)
  sfera(mascella, 0.06, lum(0xff6a2a, 1.4), 0, 0.02, 0.08, 1.1, 0.3, 1.4, 6).castShadow = false
  for (const s of [-1, 1]) {
    cono(testa, 0.016, 0.07, corno, s * 0.05, -0.12, 0.2, 4).rotation.x = PI; cono(mascella, 0.014, 0.06, corno, s * 0.05, 0.04, 0.17, 4)
    occhio(testa, s * 0.09, 0.06, 0.15, 0.04, fiam, { emis: 2.4, fessura: true, giro: s * 0.35 })
    scatola(testa, 0.1, 0.025, 0.04, scura, s * 0.1, 0.12, 0.15).rotation.z = s * -0.5
    const o = cono(testa, 0.05, 0.22, pelle, s * 0.2, 0.0, -0.04, 4); o.rotation.set(0, 0, s * -1.6)                                    // l'orecchio a punta
    // le corna: un tubo che curva
    const c1 = [s * 0.12, 0.17, 0.02], c2 = [s * 0.2, 0.34, -0.06], c3 = [s * 0.14, 0.52, 0.0]
    arto(testa, c1, c2, 0.05, 0.036, corno, 6); arto(testa, c2, c3, 0.036, 0.02, corno, 6); punta(testa, c3, [s * 0.1, 0.62, 0.04], 0.022, corno, 5)
  }
  cono(testa, 0.04, 0.12, pelle, 0, -0.17, 0.21, 4).rotation.x = PI + 0.3                                                                   // il pizzetto
  // le braccia: sottili e nodose, artigli neri
  const bracci = [], gomiti = [], mani = []
  for (const s of [-1, 1]) {
    const sp = perno(corpo, s * 0.32, 0.46, 0.0); bracci.push(sp)
    arto(sp, [0, 0, 0], [0, -0.3, 0], 0.065, 0.05, pelle, 7)
    const go = perno(sp, 0, -0.3, 0); gomiti.push(go)
    arto(go, [0, 0, 0], [0, -0.3, 0], 0.05, 0.042, pelle, 7); cono(go, 0.02, 0.1, corno, 0, 0.0, -0.05, 4).rotation.x = -2.2
    const ma = perno(go, 0, -0.3, 0); mani.push(ma)
    sfera(ma, 0.055, pelle, 0, 0, 0, 1, 1.1, 0.8, 8)
    for (let d = -1; d <= 1; d++) { const dd = perno(ma, d * 0.036, -0.04, 0.0); dd.rotation.x = -0.35; arto(dd, [0, 0, 0], [0, -0.09, 0.0], 0.014, 0.011, pelle, 4, false); cono(dd, 0.012, 0.09, art, 0, -0.14, 0.0, 4).rotation.x = PI }
  }
  const fuoco = cono(mani[1], 0.06, 0.2, vivoMat(fiam, 3, { transparent: true, opacity: 0.88, depthWrite: false }), 0, 0.0, 0.07, 6); fuoco.castShadow = false
  const sbocco = marker(mani[1], 0, 0.05, 0.12)
  // le gambe con il ginocchio all'indietro e lo zoccolo
  const gambe = [], stinchi = []
  for (const s of [-1, 1]) {
    const an = perno(g, s * 0.14, 0.55, -0.02); gambe.push(an)
    arto(an, [0, 0, 0], [0, -0.2, 0.1], 0.1, 0.075, pelle, 7)
    const gi = perno(an, 0, -0.2, 0.1); stinchi.push(gi)
    arto(gi, [0, 0, 0], [0, -0.26, -0.12], 0.075, 0.05, pelle, 7)
    const pd = perno(gi, 0, -0.26, -0.12)
    sfera(pd, 0.06, scura, 0, -0.0, 0.07, 1, 0.6, 1.6, 7)
    for (let d = -1; d <= 1; d += 2) cono(pd, 0.03, 0.09, art, d * 0.035, -0.04, 0.17, 4).rotation.x = PI / 2
  }
  // le ali
  const ali = [ala(corpo, -1, 0.75, { osso: scura, pelle: mem, x: -0.14, y: 0.45, z: -0.18 }), ala(corpo, 1, 0.75, { osso: scura, pelle: mem, x: 0.14, y: 0.45, z: -0.18 })]
  // la coda con la punta a freccia
  const coda = catena(corpo, 6, 0.13, 0.055, 0.02, pelle, { x: 0, y: -0.02, z: -0.2, punta: false })
  coda.radice.rotation.x = -PI / 2 - 0.5
  const freccia = perno(coda[5], 0, 0.13, 0); const fp = cono(freccia, 0.07, 0.17, scura, 0, 0.08, 0, 4); fp.scale.z = 0.3
  const anima = T => {
    const r = onda(T, 1.9), sn = gesto(T, 6.4, 3, 2.0), ala_ = gesto(T, 8.3, 6, 1.6)
    corpo.rotation.set(0.2 + r * 0.025 - sn * 0.1, onda(T, 0.5) * 0.08, onda(T, 0.9) * 0.05)
    corpo.position.set(onda(T, 0.9) * 0.02, 0.55 + Math.abs(onda(T, 2.4)) * 0.025, 0)
    testa.rotation.set(0.02 + onda(T, 0.8) * 0.06 + sn * 0.25, onda(T, 0.5) * 0.35, onda(T, 1.1) * 0.08)
    mascella.rotation.x = 0.08 + sn * 0.7 + Math.max(0, onda(T, 2.2)) * 0.12
    bracci[0].rotation.set(-0.35 + onda(T, 1.7) * 0.08 - sn * 0.5, 0.1, 0.35); bracci[1].rotation.set(-0.6 + onda(T, 1.7, 1) * 0.08, -0.1, -0.35)
    gomiti[0].rotation.x = -0.6 + onda(T, 2.0) * 0.06; gomiti[1].rotation.x = -0.9 + onda(T, 2.0, 1) * 0.06
    mani.forEach((m, i) => { m.rotation.x = -0.1 + onda(T, 3, i) * 0.12 })
    gambe[0].rotation.x = onda(T, 0.9) * 0.04 - 0.1; gambe[1].rotation.x = -onda(T, 0.9) * 0.04 - 0.1; stinchi.forEach(gi => { gi.rotation.x = 0.0 })
    ali.forEach((a, i) => { const ap = Math.sin(T * 2.4 + i * 0.3) * 0.15 + ala_ * 0.5; a.sp.rotation.z = a.s * (0.35 + ap); a.sp.rotation.y = a.s * (0.5 + ala_ * 0.35 + sn * 0.2); a.pol.rotation.z = -a.s * (0.15 + ap * 0.5) })
    coda.forEach((p, i) => { p.rotation.x = Math.sin(T * 2.0 - i * 0.7) * 0.18 - 0.02; p.rotation.z = Math.cos(T * 1.5 - i * 0.6) * 0.18 })
    fuoco.scale.set(1 + onda(T, 11) * 0.15, 0.9 + onda(T, 8) * 0.25 + sn * 0.5, 1)
  }
  dichiara(g, 'palla di fuoco', 0.9, 0.55, { tipo: 'fiamma', origine: sbocco })
  g.userData.attacca = p => {                                                  // carica la palla di fuoco dietro la spalla e la scaglia
    const F2 = fasi(p, 0.55)
    imp(corpo.rotation, F2, [-0.1, null, null], [0.55, null, null]); imp(corpo.position, F2, [null, null, -0.1], [null, null, 0.14])
    imp(testa.rotation, F2, [-0.2, null, null], [0.15, null, null]); apre(mascella, F2, 0.8)
    imp(bracci[1].rotation, F2, [-2.5, null, null], [-1.4, null, null]); imp(gomiti[1].rotation, F2, [-0.9, null, null], [-0.1, null, null])
    imp(bracci[0].rotation, F2, [-1.1, null, 0.5], [-1.3, null, 0.2])
    fuoco.scale.multiplyScalar(1 + F2.c * 1.6 + F2.k * 0.4)
    ali.forEach(a => { a.sp.rotation.y += a.s * F2.c * 0.4 })
  }
  return vivifica(g, anima, [corpo.position, corpo.rotation, testa.rotation, mascella.rotation, ...bracci.map(b => b.rotation), ...gomiti.map(b => b.rotation), ...gambe.map(b => b.rotation), fuoco.scale, ...ali.map(a => a.sp.rotation)])
}

// ══════════════════════════════════════ IL SIGNORE DELL'ABISSO ══════════════════════════════════════
export function creaSignoreAbisso () {
  const g = new THREE.Group()
  const pelle = M(0x4a3070, { roughness: 0.5 }), scura = M(0x251640), corno = M(0xd7caa8, { roughness: 0.45 }), art = M(0x0e0816), crepa = 0xff4de0, luceC = vivoMat(crepa, 2.8, { flatShading: false })
  const mem = membrana(0x5a2a8a, { emissive: 0x7a2aa8, emissiveIntensity: 0.55 }), buio = M(NERO, { roughness: 1 })
  const corpo = perno(g, 0, 0, 0)
  const bacino = perno(corpo, 0, 1.55, 0)
  rozza(bacino, 0.45, pelle, 0, 0, 0, 1.0, 0.8, 0.8, 2)
  const torso = perno(bacino, 0, 0.1, 0)
  rozza(torso, 0.5, pelle, 0, 0.32, 0.02, 1.0, 1.0, 0.8, 2)
  rozza(torso, 0.6, pelle, 0, 0.78, 0.05, 1.2, 0.95, 0.82, 2)
  rozza(torso, 0.34, scura, 0, 0.75, 0.38, 1.1, 1.0, 0.35, 1)
  // le crepe di luce sul torace e il sigillo
  const sigillo = perno(torso, 0, 0.78, 0.5)
  mesh(sigillo, new THREE.TorusGeometry(0.17, 0.02, 4, 18), luceC, 0, 0, 0)
  for (let i = 0; i < 3; i++) { const l = scatola(sigillo, 0.03, 0.4, 0.015, luceC, 0, 0, 0); l.rotation.z = i * PI / 3; l.castShadow = false }
  for (let i = 0; i < 6; i++) { const l = scatola(torso, 0.018, 0.18 + (i % 3) * 0.07, 0.012, luceC, (i - 2.5) * 0.12, 0.25 + (i % 2) * 0.1, 0.4); l.rotation.z = (i - 2.5) * 0.1; l.castShadow = false }
  for (let i = 0; i < 9; i++) cono(torso, 0.06, 0.26, scura, ((i % 3) - 1) * 0.2, 1.05 - Math.floor(i / 3) * 0.28, -0.4, 5).rotation.x = -1.2
  // il collo e la testa col mento aperto
  const testa = perno(torso, 0, 1.38, 0.1)
  rozza(testa, 0.27, pelle, 0, 0.02, 0.0, 1.0, 1.0, 1.05, 2)
  rozza(testa, 0.17, pelle, 0, -0.09, 0.2, 1.0, 0.8, 1.3, 1)
  const mascella = perno(testa, 0, -0.17, 0.08)
  rozza(mascella, 0.12, scura, 0, -0.02, 0.14, 1.0, 0.45, 1.5, 1)
  sfera(mascella, 0.09, luceC, 0, 0.03, 0.12, 1.1, 0.3, 1.5, 7).castShadow = false
  for (let i = -2; i <= 2; i++) { cono(mascella, 0.018, 0.1, corno, i * 0.045, 0.07, 0.24 - Math.abs(i) * 0.03, 4); cono(testa, 0.018, 0.09, corno, i * 0.045, -0.17, 0.3 - Math.abs(i) * 0.03, 4).rotation.x = PI }
  const occhi = []
  for (const s of [-1, 1]) {
    occhi.push(occhio(testa, s * 0.12, 0.09, 0.22, 0.05, crepa, { emis: 3.2, fessura: true, giro: s * 0.4 }))
    scatola(testa, 0.14, 0.035, 0.05, scura, s * 0.13, 0.17, 0.21).rotation.z = s * -0.5
  }
  lume(testa, 0, 0.2, 0.26, 0.032, 0xffd8f8, { sx: 1, sy: 1.4, emis: 5 })                       // il terzo occhio
  for (const s of [-1, 1]) {                                                                      // i due grandi corni ricurvi e la corona di punte
    const p = [[s * 0.18, 0.2, -0.02], [s * 0.45, 0.4, -0.14], [s * 0.7, 0.62, -0.1], [s * 0.82, 0.95, 0.06], [s * 0.76, 1.22, 0.24]]
    for (let i = 0; i < 4; i++) arto(testa, p[i], p[i + 1], 0.1 - i * 0.02, 0.085 - i * 0.02, corno, 7, i < 3)
    punta(testa, p[4], [s * 0.7, 1.38, 0.36], 0.05, corno, 6)
    for (let i = 0; i < 3; i++) punta(testa, [s * (0.08 + i * 0.07), 0.26 + i * 0.01, -0.06], [s * (0.1 + i * 0.1), 0.52 + i * 0.1, -0.12], 0.04, corno, 5)
  }
  // le spalle, le braccia, gli artigli
  const bracci = [], gomiti = [], mani = []
  for (const s of [-1, 1]) {
    const sp = perno(torso, s * 0.82, 1.05, 0); bracci.push(sp)
    sfera(sp, 0.3, pelle, 0, 0.0, 0, 1.0, 0.9, 1.0, 10)
    for (let i = 0; i < 4; i++) punta(sp, [s * 0.1, 0.18, (i - 1.5) * 0.12], [s * 0.34, 0.42 + (i % 2) * 0.1, (i - 1.5) * 0.18], 0.05, corno, 5)
    arto(sp, [0, 0, 0], [0, -0.7, 0.05], 0.2, 0.16, pelle, 8)
    const go = perno(sp, 0, -0.7, 0.05); gomiti.push(go)
    for (let i = 0; i < 3; i++) punta(go, [0, 0.0, -0.1], [0, 0.12 - i * 0.1, -0.4 - i * 0.05], 0.05, corno, 4)
    arto(go, [0, 0, 0], [0, -0.7, 0.0], 0.16, 0.13, pelle, 8)
    const ma = perno(go, 0, -0.74, 0); mani.push(ma)
    sfera(ma, 0.15, pelle, 0, 0, 0, 1, 1.05, 0.85, 9)
    for (let d = -1; d <= 1; d++) { const dd = perno(ma, d * 0.09, -0.1, 0.02); dd.rotation.x = -0.4; arto(dd, [0, 0, 0], [0, -0.22, 0.0], 0.04, 0.03, pelle, 5, false); cono(dd, 0.032, 0.24, art, 0, -0.32, 0.0, 5).rotation.x = PI }
    const pol = perno(ma, -s * 0.12, -0.05, 0.05); pol.rotation.z = -s * 0.7; cono(pol, 0.032, 0.24, art, 0, -0.1, 0, 5).rotation.x = PI
  }
  // le gambe: il ginocchio all'indietro, lo zoccolo con tre dita
  const gambe = [], stinchi = []
  for (const s of [-1, 1]) {
    const an = perno(bacino, s * 0.34, -0.1, 0.0); gambe.push(an)
    arto(an, [0, 0, 0], [0, -0.55, 0.25], 0.22, 0.17, pelle, 8)
    const gi = perno(an, 0, -0.55, 0.25); stinchi.push(gi)
    arto(gi, [0, 0, 0], [0, -0.6, -0.28], 0.17, 0.11, pelle, 8)
    cono(gi, 0.05, 0.2, corno, 0, 0.03, 0.15, 4).rotation.x = 1.9
    const pd = perno(gi, 0, -0.6, -0.28)
    sfera(pd, 0.12, scura, 0, -0.0, 0.13, 1, 0.55, 1.6, 8)
    for (let d = -1; d <= 1; d++) cono(pd, 0.05, 0.2, art, d * 0.08, -0.05, 0.32, 4).rotation.x = PI / 2
  }
  // le ali enormi
  const ali = [ala(torso, -1, 1.9, { osso: scura, pelle: mem, x: -0.3, y: 1.1, z: -0.4, raggio: 0.1 }), ala(torso, 1, 1.9, { osso: scura, pelle: mem, x: 0.3, y: 1.1, z: -0.4, raggio: 0.1 })]
  // i tentacoli dalla schiena e la coda
  const tent = []
  for (let i = 0; i < 4; i++) {
    const s = i % 2 ? 1 : -1, c = catena(torso, 8, 0.2, 0.1, 0.02, pelle, { x: s * (0.18 + (i >> 1) * 0.2), y: 0.55 + (i >> 1) * 0.35, z: -0.4, seg: 5 })
    c.radice.rotation.set(-0.9 - (i >> 1) * 0.3, 0, s * (0.35 + (i >> 1) * 0.35)); tent.push(c)
  }
  const coda = catena(bacino, 9, 0.22, 0.14, 0.03, pelle, { x: 0, y: -0.1, z: -0.38, punta: false, seg: 6 })
  coda.radice.rotation.x = -PI / 2 - 0.75
  const spina = perno(coda[8], 0, 0.22, 0); cono(spina, 0.1, 0.34, art, 0, 0.17, 0, 4).scale.z = 0.3
  const anima = T => {
    const r = onda(T, 1.1), ru = gesto(T, 8.8, 4, 2.4), st = gesto(T, 6.0, 1.5, 0.8)
    bacino.position.set(onda(T, 0.5) * 0.03, 1.55 + onda(T, 1.0) * 0.015, 0)
    torso.rotation.set(0.1 + r * 0.012 - ru * 0.2, onda(T, 0.4) * 0.07, onda(T, 0.7) * 0.035)
    torso.scale.set(1 + r * 0.01, 1 + r * 0.018, 1)
    testa.rotation.set(0.04 + onda(T, 0.6) * 0.04 + ru * 0.4, onda(T, 0.35) * 0.3 + st * onda(T, 0.8) * 0.2, onda(T, 0.8) * 0.05)
    mascella.rotation.x = 0.1 + Math.max(0, onda(T, 1.7)) * 0.1 + ru * 0.75
    bracci[0].rotation.set(-0.15 + onda(T, 0.9) * 0.03 - ru * 0.6, 0.0, 0.2 + ru * 0.5); bracci[1].rotation.set(-0.15 + onda(T, 0.9, 1) * 0.03 - ru * 0.6, 0.0, -0.2 - ru * 0.5)
    gomiti.forEach((go, i) => { go.rotation.x = -0.4 + onda(T, 1.0, i) * 0.04 - ru * 0.4 })
    mani.forEach((m, i) => { m.rotation.x = -0.1 + onda(T, 2.4, i) * 0.1 })
    gambe[0].rotation.x = onda(T, 0.5) * 0.02 - 0.05; gambe[1].rotation.x = -onda(T, 0.5) * 0.02 - 0.05
    ali.forEach((a, i) => { const ap = onda(T, 0.9, i * 0.4) * 0.1 + ru * 0.45; a.sp.rotation.z = a.s * (0.25 + ap); a.sp.rotation.y = a.s * (0.55 + ru * 0.35); a.pol.rotation.z = -a.s * (0.1 + ap * 0.6) })
    tent.forEach((c, i) => ondeggia(c, T, 0.17, 1.3 + i * 0.12, i * 1.9, 0.12))
    coda.forEach((p, i) => { p.rotation.x = Math.sin(T * 1.3 - i * 0.55) * 0.11; p.rotation.z = Math.cos(T * 1.0 - i * 0.5) * 0.14 })
    luceC.emissiveIntensity = 2.6 + onda(T, 1.8) * 0.8 + ru * 2
    sigillo.rotation.z = T * 0.35
    occhi.forEach(o => { o.children[0].material.emissiveIntensity = 3 + onda(T, 2.2) * 0.8 })
  }
  g.scale.setScalar(0.86)
  dichiara(g, 'schianto', 1.1, 0.55)
  g.userData.attacca = p => {                                                  // alza i due pugni e li abbatte; i tentacoli frustano in avanti
    const F2 = fasi(p, 0.55)
    imp(torso.rotation, F2, [-0.3, null, null], [0.6, null, null]); imp(testa.rotation, F2, [-0.4, null, null], [0.35, null, null]); apre(mascella, F2, 0.9)
    bracci.forEach(b => imp(b.rotation, F2, [-2.8, null, null], [-0.9, null, null])); gomiti.forEach(go => imp(go.rotation, F2, [-0.5, null, null], [-0.1, null, null]))
    imp(bacino.position, F2, [null, null, -0.15], [null, 1.45, 0.4])
    gambe.forEach((a, i) => imp(a.rotation, F2, [0.2, null, null], [i ? -0.3 : 0.1, null, null]))
    tent.forEach(c => c.radice.rotation.x += -F2.c * 0.5 + F2.k * 1.3)
    ali.forEach(a => { a.sp.rotation.y += a.s * (F2.c * 0.5 - F2.k * 0.3) })
  }
  return vivifica(g, anima, [bacino.position, torso.rotation, testa.rotation, mascella.rotation, ...bracci.map(b => b.rotation), ...gomiti.map(b => b.rotation), ...gambe.map(b => b.rotation), ...tent.map(c => c.radice.rotation), ...ali.map(a => a.sp.rotation)])
}

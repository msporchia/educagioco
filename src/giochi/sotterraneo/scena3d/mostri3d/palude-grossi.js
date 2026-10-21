// Generato da strumenti/promuovi-3d.mjs da poc/mostri-3d/palude-grossi.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// I mostri della palude fatti con tentacoli e colli (polpo, Gorgo, Sibilla, Idra). Stessa regola di palude-base.js: una `pose(T, F)` sola.
import {
  THREE, M, sfera, rozza, scatola, cil, cono, perno, punta, liscio, onda, PI, V3, BUIO, lucido, lum, lumProprio,
  arto, filo, tendi, occhio, marker, gesto, vivente, catena
} from './palude-base.js'

const tra = (base, car, col, c, k) => base + (car - base) * c + (col - base) * k

// ═════════════════════════════════════ IL POLPO (e GORGO, il polpo grosso come una barca) ═════════════════════════════════════
export function creaPolpo (gorgo = false) {
  const g = new THREE.Group()
  const col = gorgo
    ? { pelle: 0x2c5c98, scura: 0x1a3460, chiara: 0xa8d0e8, occhio: 0xffb02a, runa: 0x5ad8ff }
    : { pelle: 0xb25a3c, scura: 0x7a3426, chiara: 0xf0c8a0, occhio: 0xf0d060, runa: 0 }
  const pelle = M(col.pelle, { flatShading: false, roughness: 0.45 }), scura = M(col.scura, { flatShading: false, roughness: 0.5 }), chiara = M(col.chiara, { flatShading: false, roughness: 0.5 })
  const corpo = perno(g, 0, 0.5, 0)
  // il manto (la «testa» sacca) inclinato all'indietro, la testa con gli occhi, il sifone
  const manto = perno(corpo, 0, 0.1, -0.05); manto.rotation.x = -0.45
  sfera(manto, 0.5, pelle, 0, 0.26, 0, 0.34, 0.6, 0.34, 18)
  sfera(manto, 0.5, scura, 0, 0.3, -0.04, 0.2, 0.3, 0.2, 10).position.y = 0.34
  const testa = perno(corpo, 0, 0, 0.05)
  sfera(testa, 0.18, pelle, 0, 0.0, 0.0, 1.15, 0.9, 1.15, 16)
  sfera(testa, 0.1, scura, 0, -0.08, 0.12, 1.5, 0.7, 1.0, 10)
  const spot = M(col.scura, { flatShading: false })
  for (const [x, y, z] of [[-0.1, 0.35, 0.12], [0.1, 0.4, 0.1], [0.0, 0.5, 0.15], [-0.09, 0.2, 0.17], [0.11, 0.24, 0.16], [0.0, 0.3, 0.19]]) { const m = sfera(manto, 0.03, spot, x, y, z, 1, 1, 0.4, 6); m.lookAt(x * 4, y, z * 4 + 1) }
  const occhi = []
  for (const s of [-1, 1]) {
    const o = occhio(testa, s * 0.15, 0.04, 0.11, 0.065, col.occhio, { emis: gorgo ? 1.4 : 0.5, orizz: true, giro: s * 0.55 }); occhi.push(o)
    sfera(testa, 0.07, scura, s * 0.15, 0.065, 0.1, 1.2, 0.6, 1.0, 8)                           // la palpebra pesante
  }
  const sifone = cono(testa, 0.03, 0.12, scura, 0.15, -0.1, -0.1, 6); sifone.rotation.set(2.2, 0, -0.6)
  const becco = cono(testa, 0.035, 0.07, M(0x2a1c14), 0, -0.14, 0.13, 5); becco.rotation.x = PI + 0.2
  // gli otto tentacoli: radice inclinata in fuori, poi un riccio che sale e si avvolge
  const NT = 8, NJ = gorgo ? 7 : 6, L = 0.55
  const tent = []
  for (let i = 0; i < NT; i++) {
    const phi = i / NT * PI * 2, r0 = 0.12
    const rad = perno(corpo, Math.sin(phi) * r0, -0.1, Math.cos(phi) * r0); rad.rotation.order = 'YXZ'; rad.rotation.y = phi
    const j = catena(rad, NJ, L, 0.052, 0.012, i & 1 ? pelle : scura, gorgo ? 7 : 5)
    // le ventose: file di dischetti chiari sul lato interno
    if (i === 0 || i === 1 || i === NT - 1 || gorgo) j.forEach((p, q) => { if (q > 0 && q < NJ - 1) sfera(p, 0.016 * (1 - q / NJ * 0.5), chiara, 0, -L / NJ * 0.5, -0.03 * (1 - q / NJ * 0.5), 1, 1, 0.5, 5) })
    tent.push({ rad, j, phi })
  }
  // Gorgo: rune luminose sul manto, cirripedi sul dorso, una cresta di spine e una vecchia cicatrice
  const rune = []
  if (gorgo) {
    for (let i = 0; i < 6; i++) {
      const m = lumProprio(col.runa, 1.8); const a = i * 1.05
      const r = scatola(manto, 0.03, 0.12 + (i % 2) * 0.06, 0.01, m, Math.sin(a) * 0.15, 0.2 + i * 0.07, Math.cos(a) * 0.15); r.rotation.y = a; r.rotation.z = (i % 2 ? 0.4 : -0.4); rune.push(m)
    }
    for (let i = 0; i < 9; i++) { const a = i * 2.4; cono(manto, 0.025, 0.06, M(0x9a9a88), Math.sin(a) * 0.15, 0.15 + (i % 5) * 0.09, -0.14 - (i % 3) * 0.01, 5).rotation.x = -PI / 2 - 0.3 }
    for (let i = 0; i < 5; i++) cono(manto, 0.03, 0.2 + i * 0.03, scura, (i - 2) * 0.07, 0.62 - Math.abs(i - 2) * 0.05, -0.05, 4).rotation.x = -0.3 - Math.abs(i - 2) * 0.2
    scatola(testa, 0.012, 0.16, 0.012, M(0xe8d8c8), -0.1, 0.05, 0.19).rotation.z = 0.5       // la cicatrice
    for (let i = 0; i < 3; i++) scatola(testa, 0.05, 0.01, 0.012, M(0xe8d8c8), -0.12 + i * 0.015, 0.0 + i * 0.05, 0.185).rotation.z = 0.5
  }
  const origine = marker(testa, 0, -0.1, 0.3)
  let h0 = 0
  const pose = (T, F) => {
    const { c, k, a } = F
    const resp = onda(T, 2.0), sbuf = gesto(T, 6.8, 2.0, 1.6), ruota = gesto(T, 8.3, 5.0, 1.8)
    corpo.position.set(0, h0 + 0.012 * resp + 0.012 * Math.abs(onda(T, 1.5)) - 0.06 * c + 0.02 * sbuf, 0.3 * k - 0.05 * c)
    corpo.rotation.set(0.05 * resp * 0.5 + 0.18 * k - 0.08 * c, onda(T, 0.4) * 0.15 + 0.3 * ruota * onda(T, 2), onda(T, 0.7) * 0.05)
    manto.rotation.set(-0.45 + 0.12 * resp + 0.2 * c - 0.3 * k + 0.2 * sbuf, 0, onda(T, 0.9) * 0.05)
    manto.scale.set(1 + 0.04 * resp + 0.12 * sbuf, 0.72 * (1 + 0.04 * resp + 0.1 * sbuf - 0.08 * c), 1 + 0.04 * resp + 0.12 * sbuf)
    testa.rotation.set(0.05 + 0.1 * onda(T, 0.9), onda(T, 0.5) * 0.15 + 0.35 * ruota * onda(T, 2), onda(T, 0.8) * 0.04)
    occhi.forEach((o, i) => { o.rotation.y = (i ? 1 : -1) * -0.55 + 0.25 * ruota * onda(T, 2) })
    tent.forEach(({ rad, j, phi }, i) => {
      const fronte = Math.cos(phi)                                                      // 1 davanti, -1 dietro
      const dav = Math.max(0, fronte)
      const onde = onda(T, 1.5, i * 1.3) * 0.12, resp2 = onda(T, 1.1, i * 0.7 + 1)
      // radice: apertura in fuori; nelle zampe davanti la carica la alza e lo scatto la schianta
      const alza = (i === 0 || i === 1 || i === NT - 1) ? 1 : 0
      const psi = 0.95 + 0.1 * onde + 0.05 * i % 2 + alza * (1.3 * c - 0.35 * k + 0.25 * sbuf) + 0.2 * c * (1 - alza)
      rad.rotation.x = -psi
      rad.rotation.z = Math.sin(phi) * 0.0
      j.forEach((p, q) => {
        const u = q / (NJ - 1)
        const riccio = (0.22 + 0.04 * u) + 0.1 * onda(T, 1.3, i * 0.9 - q * 0.5) * u + alza * (0.13 * c * u * 0 + 0.0 * k)
        p.rotation.set(riccio + alza * (-0.12 * c + 0.2 * k * u) + (q === 0 ? 0 : 0), Math.sin(T * 0.9 + i + q * 0.4) * 0.07 * u, 0)
      })
    })
    becco.scale.setScalar(1 + 0.5 * a)
    rune.forEach((m, i) => { m.emissiveIntensity = 1.4 + 0.9 * onda(T, 1.6, i * 0.9) + 1.6 * c })
  }
  vivente(g, pose, { tipo: gorgo ? 'schianto' : 'frustata', durata: gorgo ? 1.0 : 0.75, arrivo: 0.55, origine })
  // i piedi a terra: si porta il corpo alla quota in cui la punta più bassa tocca y = 0
  g.userData.anima(0); g.updateMatrixWorld(true)
  let min = 1e9; const v = new V3()
  g.traverse(o => { if (o.isMesh) { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; for (const y of [b.min.y, b.max.y]) for (const x of [b.min.x, b.max.x]) for (const z of [b.min.z, b.max.z]) { v.set(x, y, z).applyMatrix4(o.matrixWorld); if (v.y < min) min = v.y } } })
  h0 = -min + 0.01; g.userData.anima(0)
  if (gorgo) g.scale.setScalar(2.5)
  return g
}
export const creaGorgo = () => creaPolpo(true)

// ═════════════════════════════════════ LA SIBILLA (il serpente lungo come il ponte del guado) ═════════════════════════════════════
export function creaSibilla () {
  const g = new THREE.Group()
  const N = 34, segs = []
  const pelle = M(0x6aa83a, { flatShading: false, roughness: 0.45 }), scuro = M(0x2c4a1c, { flatShading: false }), pancia = M(0xe0cf8a, { flatShading: false }), oro = M(0xe0b030, { flatShading: false, roughness: 0.3, metalness: 0.3 })
  const viola = M(0x6a3a8a, { flatShading: false })
  const raggio = u => 0.07 + 0.15 * liscio(0, 0.4, u) * (1 - 0.45 * liscio(0.86, 1, u))
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1), r = raggio(u), sg = new THREE.Group()
    sfera(sg, r, i % 2 ? pelle : M(0x5a9830, { flatShading: false, roughness: 0.45 }), 0, 0, 0, 1, 0.92, 2.3, 9)
    sfera(sg, r * 0.82, pancia, 0, -r * 0.4, 0, 0.8, 0.5, 1.9, 6)
    if (i % 3 === 1) rozza(sg, r * 0.72, i % 6 === 1 ? oro : scuro, 0, r * 0.66, 0, 0.9, 0.3, 1.3, 0)           // i rombi sul dorso, ogni tanto d'oro
    g.add(sg); segs.push(sg)
  }
  // la testa grossa con il cappuccio a ventaglio (il «manto della sibilla»), gli occhi d'ambra, la corona di spine d'oro
  const testa = perno(g, 0, 0, 0)
  const cappuccio = perno(testa, 0, -0.2, -0.12); cappuccio.rotation.x = -0.5
  sfera(cappuccio, 0.3, pelle, 0, 0, 0, 1.15, 1.3, 0.13, 16)
  sfera(cappuccio, 0.2, pancia, 0, -0.06, 0.02, 0.95, 1.05, 0.12, 10)
  for (const s of [-1, 1]) { sfera(cappuccio, 0.06, M(0x1a1008), s * 0.14, 0.1, 0.035, 1, 1, 0.3, 8); sfera(cappuccio, 0.035, lum(0xffd24a, 0.9), s * 0.14, 0.1, 0.06, 1, 1, 0.3, 6) }   // le false pupille sul cappuccio
  for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.33; const sp = cono(cappuccio, 0.022, 0.22 + (i % 2) * 0.06, oro, Math.sin(a) * 0.36, 0.28 + Math.cos(a) * 0.12, -0.02, 5); sp.rotation.z = -a * 0.9 }
  rozza(testa, 0.15, pelle, 0, 0, 0, 1.0, 0.8, 1.4, 1)
  rozza(testa, 0.1, pelle, 0, -0.02, 0.18, 0.9, 0.7, 1.3, 1)
  sfera(testa, 0.04, scuro, 0, 0.1, 0.12, 1.5, 0.6, 1.3, 7)
  for (const s of [-1, 1]) {
    occhio(testa, s * 0.1, 0.05, 0.09, 0.04, 0xffb21a, { emis: 1.2, fessura: true, giro: s * 0.85 })
    sfera(testa, 0.04, scuro, s * 0.1, 0.09, 0.08, 1.2, 0.5, 1.3, 7)
    sfera(testa, 0.012, scuro, s * 0.04, 0.04, 0.3, 1, 1, 1, 5)
  }
  const mascella = perno(testa, 0, -0.07, 0.06)
  rozza(mascella, 0.075, pancia, 0, 0, 0.1, 0.9, 0.4, 1.7, 1)
  for (const s of [-1, 1]) { cono(testa, 0.016, 0.12, M(0xfff6e0), s * 0.05, -0.08, 0.2, 4).rotation.x = PI; cono(mascella, 0.012, 0.07, M(0xfff6e0), s * 0.04, 0.03, 0.17, 4) }
  const lingua = perno(testa, 0, -0.06, 0.32)
  for (const s of [-1, 1]) { const f = cono(lingua, 0.01, 0.18, lum(0xd23a52, 0.4), s * 0.025, 0, 0.09, 4); f.rotation.set(PI / 2, 0, s * 0.35) }
  // la ferita d'una vecchia lancia, e le placche viola sul collo
  for (let i = 0; i < 4; i++) { const sg = segs[N - 3 - i * 2]; sfera(sg, 0.09, viola, 0, 0.1, 0, 1, 0.3, 1.4, 6) }
  const origine = marker(testa, 0, -0.04, 0.34)
  const posiz = (u, t, c) => {
    const alz = liscio(0.66, 0.97, u)
    const amp = 0.4 * (1 - 0.7 * alz) * (0.4 + u * 0.6) * (1 + 1.2 * c)
    const x = Math.sin(u * 12 - t * 1.5) * amp
    const z = -(1 - u) * 3.6 + 0.2 + Math.sin(u * 12 - t * 1.5 + 1) * 0.08 * (1 - alz)
    const y = raggio(u) * 0.95 + alz * 1.35
    return [x, y, z]
  }
  const pose = (T, F) => {
    const { c, k, a } = F
    const wv = gesto(T, 6.4, 6.25, 1.8), rs = onda(T, 2.4), fl = gesto(T, 2.4, 0.2, 0.55)
    const P = segs.map((_, i) => {
      const u = i / (N - 1), [x, y, z] = posiz(u, T, c), w = liscio(0.5, 1, u)
      return [x * (1 - 0.6 * k * w), y + (0.28 * c - 0.85 * k) * w + (rs * 0.05 - wv * 0.12) * w, z + (-0.8 * c + 2.1 * k) * w + wv * 0.4 * w]
    })
    segs.forEach((sg, i) => {
      sg.position.set(...P[i])
      const A = P[Math.max(0, i - 1)], B = P[Math.min(N - 1, i + 1)]
      sg.quaternion.setFromUnitVectors(new V3(0, 0, 1), new V3(B[0] - A[0], B[1] - A[1], B[2] - A[2]).normalize())
    })
    const h = P[N - 1]
    testa.position.set(h[0], h[1] + 0.05, h[2] + 0.1)
    testa.rotation.set(0.55 + onda(T, 1.0) * 0.08 * (1 - k) + wv * 0.12 - 0.3 * c + 0.5 * k, onda(T, 0.9) * 0.3 * (1 - k), onda(T, 0.8) * 0.06)
    lingua.scale.z = 0.2 + fl * (1.3 + onda(T, 50) * 0.2); lingua.visible = fl > 0.05
    mascella.rotation.x = 0.05 + Math.max(0, onda(T, 0.6)) * 0.05 + 0.95 * a
    cappuccio.scale.set(1 + onda(T, 1.7) * 0.04 + wv * 0.3 + 0.35 * (c + k), 1 + 0.1 * (c + k), 1)
  }
  return vivente(g, pose, { tipo: 'morso', durata: 0.9, arrivo: 0.55, origine })
}

// ═════════════════════════════════════ L'IDRA (tre teste, tre colli) ═════════════════════════════════════
const PELLE_IDRA = 0x2f6a58
function testaDrago (pad, o) {
  const pelle = M(o.pelle, { flatShading: false, roughness: 0.5 }), chiaro = M(0xb8c070, { flatShading: false }), avorio = M(0xf4eed2), scura = M(0x1c3a30, { flatShading: false })
  const t = perno(pad, 0, 0, 0)
  rozza(t, 0.16, pelle, 0, 0.0, 0.05, 1.0, 0.85, 1.25, 1)
  rozza(t, 0.1, pelle, 0, -0.02, 0.24, 0.9, 0.65, 1.4, 1)
  sfera(t, 0.035, scura, 0, 0.06, 0.34, 1.4, 0.7, 1.2, 6)
  const occhi = []
  for (const s of [-1, 1]) {
    const o2 = occhio(t, s * 0.1, 0.07, 0.12, 0.045, o.occhio, { emis: 1.3, fessura: true, giro: s * 0.8 }); occhi.push(o2)
    sfera(t, 0.05, scura, s * 0.1, 0.105, 0.1, 1.2, 0.5, 1.5, 7)
    cono(t, 0.025, 0.2, scura, s * 0.09, 0.14, -0.06, 5).rotation.set(-1.2, 0, -s * 0.25)                       // le corna
  }
  if (o.cieco) { const e = t.children.find(c => c.userData.occhio); e.visible = false; sfera(t, 0.05, M(0xdfe4d0, { flatShading: false }), -0.1, 0.07, 0.12, 1, 1, 0.7, 8); scatola(t, 0.012, 0.16, 0.012, M(0x6a1a1a), -0.1, 0.06, 0.16).rotation.z = 0.6 }
  const mascella = perno(t, 0, -0.07, 0.1)
  rozza(mascella, 0.08, chiaro, 0, 0.0, 0.14, 0.9, 0.4, 1.7, 1)
  for (const s of [-1, 1]) { for (let d = 0; d < 3; d++) cono(t, 0.011, 0.06, avorio, s * 0.05, -0.065, 0.2 + d * 0.06, 4).rotation.x = PI; for (let d = 0; d < 2; d++) cono(mascella, 0.01, 0.045, avorio, s * 0.045, 0.03, 0.15 + d * 0.07, 4) }
  const origine = marker(t, 0, -0.03, 0.4)
  return { t, mascella, origine, occhi }
}
export function creaIdra () {
  const g = new THREE.Group()
  const pelle = M(PELLE_IDRA, { flatShading: false, roughness: 0.5 }), scura = M(0x1c4036, { flatShading: false }), pancia = M(0xb6bf72, { flatShading: false }), spina = M(0x7a3c8e, { flatShading: false })
  const corpo = perno(g, 0, 0.78, 0)
  sfera(corpo, 0.5, pelle, 0, 0.0, 0.0, 0.95, 0.72, 1.4, 16)
  sfera(corpo, 0.5, pancia, 0, -0.16, 0.08, 0.7, 0.4, 1.1, 10)
  for (let i = 0; i < 8; i++) { const z = 0.5 - i * 0.14; cono(corpo, 0.07 - i * 0.003, 0.2 + (i % 2) * 0.06, spina, 0, 0.34 - Math.abs(i - 3) * 0.015, z, 4).rotation.x = -0.25 }
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) cono(corpo, 0.05, 0.12, scura, s * 0.43, 0.14, 0.3 - i * 0.2, 4).rotation.z = -s * 1.2
  // la coda: catena che pende verso dietro; le quattro zampe tozze con tre artigli
  const radCoda = perno(corpo, 0, -0.05, -0.6); radCoda.rotation.x = 1.35
  const coda = catena(radCoda, 8, 1.3, 0.2, 0.03, pelle, 8)
  const zampe = []
  for (const [zz, s] of [[0.38, -1], [0.38, 1], [-0.34, -1], [-0.34, 1]]) {
    const an = perno(corpo, s * 0.44, -0.2, zz)
    sfera(an, 0.17, pelle, 0, 0.0, 0, 1, 1.1, 1.2, 9)
    arto(an, [0, 0, 0], [s * 0.05, -0.34, 0.04], 0.15, 0.11, pelle, 8, false)
    const pie = perno(an, s * 0.05, -0.37, 0.04)
    sfera(pie, 0.12, scura, 0, 0.0, 0.06, 1.1, 0.5, 1.6, 8)
    for (let d = -1; d <= 1; d++) cono(pie, 0.03, 0.14, M(0xe8e0c0), d * 0.07, 0.0, 0.2, 4).rotation.x = PI / 2
    zampe.push(an)
  }
  // i tre colli, ciascuno con la sua testa: il destro è cieco e cicatrizzato, il centrale sputa veleno
  const colli = [], teste = []
  const dati = [{ x: -0.34, pelle: 0x2f6a58, occhio: 0xffd24a, dir: -0.3 }, { x: 0.0, pelle: 0x3a7a62, occhio: 0xff8a2a, dir: 0.0 }, { x: 0.34, pelle: 0x28584a, occhio: 0xffd24a, dir: 0.3, cieco: true }]
  const NC = 9
  for (const d of dati) {
    const base = perno(corpo, d.x, 0.12, 0.62)
    const c = catena(base, NC, 1.25, 0.17, 0.1, M(d.pelle, { flatShading: false, roughness: 0.5 }), 8, 1)
    sfera(c[0], 0.19, M(d.pelle, { flatShading: false }), 0, 0, 0, 1, 1, 1, 8)
    for (let i = 1; i < NC - 1; i += 2) cono(c[i], 0.04, 0.12, spina, 0, 0.0, -0.1, 4).rotation.x = -PI / 2 + 0.2                  // le spine sulla nuca
    const th = testaDrago(c[NC - 1], { pelle: d.pelle, occhio: d.occhio, cieco: d.cieco }); th.t.position.set(0, 0.13, 0)
    colli.push({ c, d }); teste.push(th)
  }
  const origine = teste[1].origine
  const pose = (T, F) => {
    const { c, k, a } = F
    const resp = onda(T, 1.5), passo = onda(T, 0.5)
    corpo.position.set(0, 0.78 + 0.015 * resp + 0.02 * Math.abs(onda(T, 1.0)), 0.18 * k - 0.05 * c)
    corpo.rotation.set(-0.04 * resp - 0.08 * c + 0.1 * k, 0.04 * passo, 0.02 * onda(T, 0.8))
    radCoda.rotation.set(1.35, 0.0, 0.0)
    coda.forEach((p, i) => { p.rotation.set(-0.11 + onda(T, 0.9, -i * 0.5) * 0.05, onda(T, 1.0, -i * 0.6) * (0.08 + 0.15 * c * (i / 8)) + 0.2 * k * 0.0, 0.0) })
    colli.forEach(({ c: ch, d }, ci) => {
      const fase = ci * 2.1, gira = onda(T, 0.5, fase), ev = gesto(T, 6.5, 1.4 + ci * 2.0, 1.8)
      const ricurva = 0.9 + 0.8 * c                                                    // a molla nella carica
      ch.forEach((p, i) => {
        const u = i / (NC - 1)
        const base = (i === 0 ? 0.55 : (i < 5 ? -0.14 : 0.12) * ricurva) + 0.05 * onda(T, 0.9, fase + i * 0.5) * (0.4 + u) + ev * 0.08 * (i < 5 ? -1 : 1)
        const strike = (i < 4 ? 0.25 : i < 7 ? 0.16 : 0.12) * k * (ci === 1 ? 1.15 : 1.0) * 1.9
        p.rotation.set(base + strike - 0.25 * c * (i === 0), 0.07 * gira * (i > 0) + d.dir * 0.12 * (i === 0) * (1 + k) , 0)
      })
      const tot = ch.reduce((s, p) => s + p.rotation.x, 0)
      teste[ci].t.rotation.set(-tot + 0.1 + 0.15 * onda(T, 0.8, fase) + 0.25 * k + 0.3 * ev * 0.5 - 0.12 * c, 0.35 * gira + 0.4 * ev * onda(T, 3, ci), 0.08 * onda(T, 0.7, fase))
      teste[ci].mascella.rotation.x = 0.05 + 0.1 * Math.max(0, onda(T, 0.8, fase)) + 0.15 * ev + (ci === 1 ? 0.9 : 0.8) * a
    })
    zampe.forEach((an, i) => { an.rotation.x = onda(T, 0.5, i * 1.6) * 0.04 })
  }
  vivente(g, pose, { tipo: 'sputo', durata: 1.1, arrivo: 0.55, origine, proiettile: 'veleno' })
  g.scale.setScalar(1.45)
  return g
}

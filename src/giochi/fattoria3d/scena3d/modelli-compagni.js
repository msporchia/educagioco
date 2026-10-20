// I modelli di chi vive sulla fattoria senza lavorarci: il contadino (nuovo aspetto), il bobtail Watson e i gatti. Tutto in
// codice, geometrie condivise, materiali dalla cache di `modelli.js`: niente luci, niente immagini (solo la faccia del
// contadino, una trama canvas). Davanti verso +z, piedi a terra (y = 0), origine al centro dell'impronta.
// Le pose sono funzioni a parte (`posaCane`, `posaGatto`): ricevono lo stato e il tempo e muovono i perni, senza memoria.
// Vedi docs/fattoria3d/compagni.md.
import * as THREE from 'three'
import { mat } from './modelli.js'

// ── mattoncini con le geometrie in comune ──
const geo = new Map()
const G = (k, f) => { if (!geo.has(k)) geo.set(k, f()); return geo.get(k) }
function pezzo (g, geometria, m, x, y, z, sx = 1, sy = 1, sz = 1) {
  const o = new THREE.Mesh(geometria, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; o.receiveShadow = true; g.add(o); return o
}
const scatola = (g, w, h, d, m, x = 0, y = 0, z = 0) => pezzo(g, G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m, x, y, z)
const sfera = (g, r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => pezzo(g, G(`s${r}`, () => new THREE.SphereGeometry(r, 10, 8)), m, x, y, z, sx, sy, sz)
const rozza = (g, r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => pezzo(g, G(`i${r}`, () => new THREE.IcosahedronGeometry(r, 1)), m, x, y, z, sx, sy, sz)
const cil = (g, rs, ri, h, m, x = 0, y = 0, z = 0, seg = 10) => pezzo(g, G(`c${rs},${ri},${h},${seg}`, () => new THREE.CylinderGeometry(rs, ri, h, seg)), m, x, y, z)
const cono = (g, r, h, m, x = 0, y = 0, z = 0, seg = 4) => pezzo(g, G(`n${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)), m, x, y, z)
const perno = (g, x, y, z) => { const p = new THREE.Group(); p.position.set(x, y, z); g.add(p); return p }
/** Una sfera invisibile ma toccabile: il dito è largo e un gatto è piccolo. */
function zonaTocco (g, r, y) {
  const o = new THREE.Mesh(G(`z${r}`, () => new THREE.SphereGeometry(r, 6, 4)), mat(0xffffff)); o.position.y = y; o.visible = false
  g.add(o); g.userData.colpo = o
}
const ombre = g => g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })

// ══════════ il contadino ══════════
const facce = new Map()
/** La faccia: una trama canvas (occhi grandi, guance, sorriso), una per aspetto. */
function trammaFaccia (donna) {
  if (facce.has(donna)) return facce.get(donna)
  const c = document.createElement('canvas'); c.width = 256; c.height = 176
  const x = c.getContext('2d')
  x.fillStyle = '#f5c9a2'; x.fillRect(0, 0, 256, 176)
  for (const s of [-1, 1]) {
    const ex = 128 + s * 46, ey = 78
    x.fillStyle = 'rgba(240,120,110,.45)'; x.beginPath(); x.ellipse(128 + s * 74, 118, 17, 11, 0, 0, 7); x.fill()          // guancia
    x.fillStyle = '#fff'; x.beginPath(); x.ellipse(ex, ey, 15, 19, 0, 0, 7); x.fill()
    x.fillStyle = '#2a2018'; x.beginPath(); x.ellipse(ex + s * -1, ey + 2, 10, 14, 0, 0, 7); x.fill()
    x.fillStyle = '#fff'; x.beginPath(); x.arc(ex + 3, ey - 4, 4, 0, 7); x.fill()
    x.strokeStyle = '#5a3a22'; x.lineWidth = 5; x.lineCap = 'round'                                                          // sopracciglio
    x.beginPath(); x.arc(ex, ey - 28, 16, Math.PI * 1.2, Math.PI * 1.8); x.stroke()
    if (donna) { x.strokeStyle = '#2a2018'; x.lineWidth = 3; x.beginPath(); x.moveTo(ex + s * 14, ey - 8); x.lineTo(ex + s * 22, ey - 14); x.stroke() }   // ciglia
  }
  x.fillStyle = '#e0a07e'; x.beginPath(); x.ellipse(128, 105, 5, 4, 0, 0, 7); x.fill()                                           // naso
  x.strokeStyle = '#8a3a2a'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.arc(128, 112, 24, 0.25 * Math.PI, 0.75 * Math.PI); x.stroke()   // sorriso
  if (!donna) { x.fillStyle = 'rgba(150,90,60,.5)'; for (const [a, b] of [[104, 100], [112, 96], [144, 96], [152, 100], [120, 94], [136, 94]]) { x.beginPath(); x.arc(a, b - 6, 2, 0, 7); x.fill() } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  facce.set(donna, t)
  return t
}

/** Il contadino: testa grande, corpo piccolo. Stessi perni dell'eroe vecchio (`gambe`, `busto`, `testa`, `bracci`, `falce`, `ascia`). */
export function creaContadino (aspetto = 'contadino') {
  const donna = aspetto === 'contadina'
  const g = new THREE.Group()
  const pelle = mat(0xf5c9a2), maglia = mat(donna ? 0xf3e3c0 : 0xd9503f), salopette = mat(0x3d68b8), toppa = mat(0xe8b94a)
  const scuro = mat(0x2a2018), stivale = mat(0x6a4426), paglia = mat(0xe9c96e), nastro = mat(donna ? 0xe86f9a : 0xc23a2e), fazzoletto = mat(0xd2392e)
  const gambe = [-1, 1].map(s => {
    const p = perno(g, s * 0.1, 0.34, 0)
    scatola(p, 0.14, 0.2, 0.16, salopette, 0, -0.1, 0)
    scatola(p, 0.16, 0.16, 0.22, stivale, 0, -0.26, 0.03); scatola(p, 0.17, 0.03, 0.17, scuro, 0, -0.18, 0)
    if (s > 0) scatola(p, 0.08, 0.08, 0.01, toppa, 0.0, -0.09, 0.085)                                   // la toppa sul ginocchio
    return p
  })
  const busto = perno(g, 0, 0.34, 0)
  scatola(busto, 0.36, 0.3, 0.22, maglia, 0, 0.15, 0)
  scatola(busto, 0.37, 0.15, 0.23, salopette, 0, 0.075, 0)
  scatola(busto, 0.22, 0.2, 0.04, salopette, 0, 0.2, 0.12); scatola(busto, 0.08, 0.07, 0.01, toppa, 0.05, 0.2, 0.145)
  for (const s of [-1, 1]) scatola(busto, 0.05, 0.2, 0.235, salopette, s * 0.1, 0.24, 0)
  cil(busto, 0.14, 0.12, 0.06, fazzoletto, 0, 0.31, 0)                                                   // il fazzoletto al collo
  const nodo = cono(busto, 0.07, 0.1, fazzoletto, 0, 0.26, 0.12); nodo.rotation.x = Math.PI
  // la testa
  const testa = perno(busto, 0, 0.34, 0)
  const sx = 1.05, sy = 0.95
  sfera(testa, 0.24, pelle, 0, 0.22, 0, sx, sy, 1)
  const faccia = new THREE.Mesh(G('faccia', () => new THREE.SphereGeometry(0.2425, 14, 10, Math.PI / 2 - 0.95, 1.9, 1.0, 1.3)),
    new THREE.MeshStandardMaterial({ map: trammaFaccia(donna), roughness: 0.9 }))
  faccia.position.set(0, 0.22, 0); faccia.scale.set(sx, sy, 1); testa.add(faccia)
  for (const s of [-1, 1]) sfera(testa, 0.045, pelle, s * 0.25, 0.2, 0, 1, 1.2, 0.8)
  const capelli = mat(donna ? 0x7a4a26 : 0x6b4423)
  sfera(testa, 0.215, capelli, 0, 0.27, -0.05, sx, sy * 0.95, 0.95)
  if (donna) for (const s of [-1, 1]) {                                                                // le trecce
    sfera(testa, 0.06, capelli, s * 0.2, 0.1, -0.05); sfera(testa, 0.055, capelli, s * 0.21, -0.01, -0.06); sfera(testa, 0.045, nastro, s * 0.21, -0.08, -0.06)
  }
  // il cappello di paglia con il nastro
  cil(testa, 0.36, 0.36, 0.03, paglia, 0, 0.38, 0, 16)
  cil(testa, 0.17, 0.2, 0.16, paglia, 0, 0.46, 0, 14)
  cil(testa, 0.202, 0.208, 0.045, nastro, 0, 0.395, 0, 14)
  if (donna) sfera(testa, 0.045, nastro, 0.2, 0.43, 0.06); else cono(testa, 0.012, 0.18, mat(0xd8b24a), -0.19, 0.44, 0.06, 4).rotation.z = 0.5   // un fiore, o una spiga
  const bracci = [-1, 1].map(s => {
    const p = perno(busto, s * 0.22, 0.28, 0)
    scatola(p, 0.09, 0.24, 0.1, maglia, 0, -0.11, 0); sfera(p, 0.055, pelle, 0, -0.27, 0, 1, 1, 1)
    return p
  })
  // la falce e l'ascia nel pugno destro, solo mentre servono (come nel contadino di prima)
  const falce = perno(bracci[1], 0, -0.29, 0); falce.visible = false
  cil(falce, 0.018, 0.018, 1.1, mat(0x9a6a36), 0, -0.4, 0, 5)
  const lama = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.022, 4, 14, Math.PI * 0.7), mat(0xcfd6dc, { metalness: 0.5, roughness: 0.4 }))
  lama.rotation.set(Math.PI / 2, 0, Math.PI * 0.15); lama.position.set(0, -0.94, 0); falce.add(lama)
  const ascia = perno(bracci[1], 0, -0.29, 0); ascia.visible = false
  cil(ascia, 0.022, 0.022, 0.7, mat(0x9a6a36), 0, -0.25, 0, 5)
  scatola(ascia, 0.05, 0.16, 0.2, mat(0xcfd6dc, { metalness: 0.5, roughness: 0.4 }), 0, -0.56, 0.1)
  ombre(g)
  g.userData = { gambe, busto, testa, bracci, falce, ascia, aspetto }
  return g
}

// ══════════ Watson, il bobtail ══════════
/** Un cane grosso, arruffato, grigio e bianco, con la macchia scura sulla testa, le orecchie giù, gli occhi sotto il ciuffo e
    niente coda (il bobtail ce l'ha mozza: un moncherino). */
export function creaCane () {
  const g = new THREE.Group()
  const grigio = mat(0x8f9096), bianco = mat(0xf0efe9), ciuffo = mat(0xd9d8d3), macchia = mat(0x4f5158), nero = mat(0x1a1a1e), lingua = mat(0xe8708a)
  const corpo = perno(g, 0, 0.36, -0.3)
  rozza(corpo, 0.28, grigio, 0, 0.22, 0.3, 1.0, 0.95, 1.5)
  rozza(corpo, 0.22, bianco, 0, 0.2, 0.62, 1.0, 1.0, 0.9)                                               // il petto
  rozza(corpo, 0.2, bianco, 0, 0.06, 0.32, 0.9, 0.6, 1.4)                                               // la pancia
  const posteriore = perno(corpo, 0, 0, 0)
  rozza(posteriore, 0.27, grigio, 0, 0.22, 0.0, 1.05, 1.0, 1.1)
  sfera(posteriore, 0.09, bianco, 0, 0.26, -0.27)                                                       // il moncherino: nessuna coda a vista
  // il pelo arruffato: ciuffi che sporgono dalla schiena
  for (const [x, z, r] of [[-0.12, 0.05, -0.3], [0.1, 0.25, 0.3], [-0.08, 0.5, -0.2], [0.13, 0.62, 0.35], [0, 0.36, 0.1], [-0.15, 0.3, -0.5]]) {
    const t = cono(corpo, 0.07, 0.17, z > 0.4 ? bianco : grigio, x, 0.46 - Math.abs(x) * 0.5, z, 5); t.rotation.z = r
  }
  const testa = perno(corpo, 0, 0.38, 0.68)
  rozza(testa, 0.24, bianco, 0, 0.1, 0.08, 1.0, 0.95, 1.05)
  rozza(testa, 0.18, macchia, -0.07, 0.2, 0.0, 0.95, 0.6, 0.95)                                         // la macchia scura
  rozza(testa, 0.22, ciuffo, 0, 0.17, 0.2, 1.05, 0.5, 0.6)                                              // il ciuffo sugli occhi
  sfera(testa, 0.12, bianco, 0, -0.02, 0.28, 1.0, 0.8, 1.1)
  sfera(testa, 0.045, nero, 0, 0.04, 0.4)
  for (const s of [-1, 1]) sfera(testa, 0.022, nero, s * 0.085, 0.02, 0.31)                             // gli occhi, appena sotto il ciuffo
  const lingua3 = scatola(testa, 0.06, 0.015, 0.1, lingua, 0, -0.1, 0.34); lingua3.visible = false
  const orecchie = [-1, 1].map(s => {
    const p = perno(testa, s * 0.2, 0.2, 0.02)
    sfera(p, 0.12, grigio, s * 0.03, -0.1, 0, 0.35, 1, 0.7); p.rotation.z = s * 0.25; p.userData.base = s * 0.25; return p
  })
  const base = [[-0.17, 0.28, bianco], [0.17, 0.28, bianco], [-0.19, -0.28, grigio], [0.19, -0.28, grigio]]
  const zampe = base.map(([x, z, m]) => {
    const p = perno(g, x, 0.38, z)
    cil(p, 0.075, 0.07, 0.3, m, 0, -0.17, 0, 7); sfera(p, 0.09, bianco, 0, -0.34, 0.03, 1, 0.6, 1.25)
    p.userData.base = [x, 0.38, z]; return p
  })
  zonaTocco(g, 0.6, 0.5)
  ombre(g)
  g.userData = { ...g.userData, corpo, posteriore, testa, orecchie, lingua: lingua3, zampe, tipo: 'cane' }
  return g
}

/** Muove i perni del cane. `stato`: sta siede annusa dorme festa vaga segue; `vel` 0..1 quanto va; `fase` il passo; `t` il tempo; `p` 0..1 nello stato. */
export function posaCane (g, { stato = 'sta', vel = 0, fase = 0, t = 0 } = {}) {
  const u = g.userData, [fl, fr, bl, br] = u.zampe
  u.zampe.forEach(z => { z.rotation.set(0, 0, 0); z.position.set(...z.userData.base) })
  u.corpo.rotation.set(0, 0, 0); u.corpo.position.set(0, 0.36, -0.3); u.corpo.scale.set(1, 1, 1)
  u.testa.rotation.set(0, 0, 0); u.testa.position.set(0, 0.38, 0.68); u.posteriore.rotation.set(0, 0, 0)
  u.orecchie.forEach(o => { o.rotation.z = o.userData.base }); u.lingua.visible = false
  const resp = Math.sin(t * 2.2)
  if (vel > 0.05) {                                                    // il trotto, a coppie in diagonale, un po' goffo
    const amp = 0.55 * Math.min(1, 0.5 + vel), s = Math.sin(fase)
    fl.rotation.x = br.rotation.x = s * amp; fr.rotation.x = bl.rotation.x = -s * amp
    u.corpo.position.y += Math.abs(Math.cos(fase)) * 0.035; u.corpo.rotation.z = s * 0.05
    u.posteriore.rotation.y = s * 0.12; u.testa.rotation.z = -s * 0.05; u.testa.rotation.x = Math.sin(fase * 2) * 0.05
    u.orecchie.forEach(o => { o.rotation.z += Math.sin(fase * 2) * 0.15 })
    if (vel > 0.7) u.lingua.visible = true
  }
  if (stato === 'siede') {
    u.corpo.rotation.x = -0.55; u.corpo.position.y = 0.2; u.corpo.scale.y = 1 + resp * 0.015
    for (const z of [bl, br]) { z.position.y = 0.17; z.rotation.x = -1.4 }
    u.testa.rotation.x = 0.5; u.testa.rotation.y = Math.sin(t * 0.7) * 0.35; u.posteriore.rotation.y = Math.sin(t * 3) * 0.06
  } else if (stato === 'annusa') {
    u.testa.rotation.x = 0.9 + Math.sin(t * 9) * 0.08; u.testa.position.y -= 0.2; u.testa.position.z += 0.1; u.corpo.rotation.x += 0.1
    u.posteriore.rotation.y += Math.sin(t * 5) * 0.08
  } else if (stato === 'festa') {                                      // scodinzola col sedere, lingua fuori, un saltello
    u.posteriore.rotation.y = Math.sin(t * 16) * 0.45; u.corpo.rotation.z = Math.sin(t * 16) * 0.05
    u.corpo.position.y += Math.abs(Math.sin(t * 6)) * 0.05; u.corpo.rotation.x = 0.2; u.testa.rotation.x = -0.2; u.lingua.visible = true
  } else if (stato === 'dorme') {                                      // raggomitolato, la testa sulle zampe
    u.corpo.position.y = 0.1; u.corpo.scale.set(1.05, 0.72 * (1 + resp * 0.04), 1)
    for (const z of u.zampe) { z.position.y = 0.15; z.rotation.x = -1.45 }
    bl.rotation.x = br.rotation.x = -1.2
    u.testa.position.set(0.1, 0.12, 0.74); u.testa.rotation.set(0.45, 0.8, 0.3)
  } else if (vel <= 0.05) {                                            // in piedi: respira, guarda in giro, il sedere dondola piano
    u.corpo.scale.y = 1 + resp * 0.012; u.testa.rotation.y = Math.sin(t * 0.5) * 0.25; u.posteriore.rotation.y = Math.sin(t * 3) * 0.08
  }
}

// ══════════ i gatti ══════════
const MANTELLI = {
  bianconero: { pelo: 0xf2f0ea, chiaro: 0xf2f0ea, macchia: 0x2b2b30, zampe: 0xf2f0ea, coda: 0x2b2b30, occhi: 0x7cc04a },
  rosso:      { pelo: 0xd9822b, chiaro: 0xf2c28a, macchia: 0xb86a1c, zampe: 0xd9822b, coda: 0xd9822b, occhi: 0x7cc04a },
  nero:       { pelo: 0x2a2a31, chiaro: 0x2a2a31, macchia: 0x2a2a31, zampe: 0x2a2a31, coda: 0x2a2a31, occhi: 0xe8d04a },
}
/** Un gatto sinuoso: corpo lungo, orecchie a punta, coda in tre pezzi che si muove. */
export function creaGatto (variante = 'bianconero') {
  const M = MANTELLI[variante] || MANTELLI.bianconero
  const g = new THREE.Group()
  const pelo = mat(M.pelo), chiaro = mat(M.chiaro), macchia = mat(M.macchia), zampaM = mat(M.zampe), codaM = mat(M.coda), occhiM = mat(M.occhi)
  const rosa = mat(0xe8909a), nero = mat(0x15151a)
  const corpo = perno(g, 0, 0.2, -0.18)
  sfera(corpo, 0.13, pelo, 0, 0.1, 0.18, 1.0, 0.95, 1.9)
  sfera(corpo, 0.1, chiaro, 0, 0.06, 0.34, 0.95, 0.9, 1.0)
  if (variante === 'bianconero') sfera(corpo, 0.1, macchia, 0, 0.19, 0.12, 1.0, 0.5, 1.4)
  if (variante === 'rosso') for (const z of [0.05, 0.2, 0.33]) scatola(corpo, 0.2, 0.012, 0.03, macchia, 0, 0.225, z)       // le strisce
  const testa = perno(corpo, 0, 0.17, 0.4)
  sfera(testa, 0.115, pelo, 0, 0.08, 0.06, 1.1, 0.95, 1.0)
  if (variante === 'bianconero') { sfera(testa, 0.05, chiaro, 0, 0.04, 0.14); sfera(testa, 0.06, macchia, -0.07, 0.15, 0.04, 1, 0.6, 1) }
  for (const s of [-1, 1]) {
    const o = cono(testa, 0.05, 0.11, variante === 'bianconero' && s < 0 ? macchia : pelo, s * 0.075, 0.2, 0.02, 4); o.rotation.z = -s * 0.3
    const dentro = cono(testa, 0.03, 0.07, rosa, s * 0.07, 0.19, 0.04, 4); dentro.rotation.z = -s * 0.3
    sfera(testa, 0.024, occhiM, s * 0.05, 0.1, 0.15)
    scatola(testa, 0.008, 0.03, 0.012, nero, s * 0.05, 0.1, 0.17)                                       // la pupilla a fessura
  }
  sfera(testa, 0.016, rosa, 0, 0.06, 0.175)
  const gambe = [[-0.07, 0.16], [0.07, 0.16], [-0.07, -0.16], [0.07, -0.16]].map(([x, z]) => {
    const p = perno(g, x, 0.2, z)
    cil(p, 0.035, 0.03, 0.17, zampaM, 0, -0.1, 0, 6); sfera(p, 0.045, zampaM, 0, -0.19, 0.015, 1, 0.6, 1.3)
    p.userData.base = [x, 0.2, z]; return p
  })
  // la coda lunga, in tre pezzi
  const coda1 = perno(corpo, 0, 0.14, -0.08), coda2 = perno(coda1, 0, 0.2, 0), coda3 = perno(coda2, 0, 0.18, 0)
  cil(coda1, 0.032, 0.036, 0.2, pelo, 0, 0.1, 0, 6); cil(coda2, 0.03, 0.032, 0.18, pelo, 0, 0.09, 0, 6); cil(coda3, 0.03, 0.03, 0.16, codaM, 0, 0.08, 0, 6)
  zonaTocco(g, 0.38, 0.22)
  ombre(g)
  g.userData = { ...g.userData, corpo, testa, gambe, coda: [coda1, coda2, coda3], tipo: 'gatto', variante }
  return g
}

/** Muove i perni del gatto. Stati: sta siede lava dorme stiracchia fusa vaga fugge. `p` (0..1) è a che punto è lo stato. */
export function posaGatto (g, { stato = 'sta', vel = 0, fase = 0, t = 0, p = 0 } = {}) {
  const u = g.userData, [fl, fr, bl, br] = u.gambe, [c1, c2, c3] = u.coda
  u.gambe.forEach(z => { z.rotation.set(0, 0, 0); z.position.set(...z.userData.base); z.scale.set(1, 1, 1) })
  u.corpo.rotation.set(0, 0, 0); u.corpo.position.set(0, 0.2, -0.18); u.corpo.scale.set(1, 1, 1)
  u.testa.rotation.set(0, 0, 0)
  c1.rotation.set(-1.3, 0, 0); c2.rotation.set(0.4, 0, 0); c3.rotation.set(0.3, 0, 0)
  const resp = Math.sin(t * 2.6)
  if (vel > 0.05) {                                                    // il passo felino: basso, la coda alta che ondeggia
    const amp = 0.5 * Math.min(1, 0.6 + vel), s = Math.sin(fase)
    fl.rotation.x = br.rotation.x = s * amp; fr.rotation.x = bl.rotation.x = -s * amp
    u.corpo.position.y += Math.abs(Math.cos(fase)) * 0.012; u.corpo.position.y -= 0.02; u.corpo.rotation.y = s * 0.06
    c1.rotation.x = -0.85; c2.rotation.x = 0.25; c3.rotation.x = 0.15
    c2.rotation.z = Math.sin(fase * 0.5) * 0.35; c3.rotation.z = Math.sin(fase * 0.5 - 0.8) * 0.45
    u.testa.rotation.x = 0.1
    return
  }
  const onda = (k = 1, a = 0.3) => { c1.rotation.z = Math.sin(t * 1.6 * k) * a * 0.5; c2.rotation.z = Math.sin(t * 1.6 * k - 0.7) * a; c3.rotation.z = Math.sin(t * 1.6 * k - 1.4) * a * 1.4 }
  const seduto = () => {
    u.corpo.rotation.x = -0.9; u.corpo.position.y = 0.1
    bl.rotation.x = br.rotation.x = -1.3; bl.position.y = br.position.y = 0.12
    u.testa.rotation.x = 0.9
    c1.rotation.x = -2.3; c2.rotation.x = 0.9; c3.rotation.x = 0.9
  }
  if (stato === 'siede') { seduto(); u.testa.rotation.y = Math.sin(t * 0.8) * 0.5; u.corpo.scale.y = 1 + resp * 0.012; c3.rotation.z = Math.sin(t * 1.4) * 0.3 }
  else if (stato === 'lava') {                                         // seduto, la zampa su, la testa che si china
    seduto(); fl.rotation.x = -2.1 + Math.sin(t * 7) * 0.12; u.testa.rotation.x = 1.45 + Math.sin(t * 7) * 0.1; u.testa.rotation.z = 0.15
  } else if (stato === 'dorme') {                                      // a pagnotta, la testa sulle zampe, la coda attorno
    u.corpo.position.y = 0.075; u.corpo.scale.set(1.05, 0.75 * (1 + resp * 0.05), 0.9)
    for (const z of u.gambe) { z.position.y = 0.1; z.scale.y = 0.35 }
    u.testa.position.set(0, 0, 0); u.testa.rotation.set(0.6, 0.5, 0.35)
    c1.rotation.set(-1.45, 0, 0); c2.rotation.set(0, 0, 1.1); c3.rotation.set(0, 0, 1.0)
  } else if (stato === 'stiracchia') {                                 // il sedere in su, il petto in giù, le zampe avanti
    const k = Math.sin(Math.min(1, p) * Math.PI)
    u.corpo.rotation.x = 0.5 * k; u.corpo.position.y = 0.2 + 0.03 * k
    fl.rotation.x = fr.rotation.x = -1.1 * k; u.testa.rotation.x = -0.2 * k
    c1.rotation.x = -0.2 * k - 0.8 * (1 - k); onda(1, 0.2)
  } else if (stato === 'fusa') {                                       // le fusa: un tremolio, la coda piano
    u.corpo.position.y += Math.sin(t * 55) * 0.003; u.testa.rotation.x = 0.15; u.testa.rotation.y = Math.sin(t * 2) * 0.2; onda(0.6, 0.25)
  } else { u.corpo.scale.y = 1 + resp * 0.012; u.testa.rotation.y = Math.sin(t * 0.7) * 0.3; onda(1, 0.35) }
}

/** Il modello di un compagno dai dati (`dati/compagni.js`). */
export function creaCompagno (c) {
  const g = c.tipo === 'cane' ? creaCane() : creaGatto(c.variante)
  g.userData.id = c.id
  return g
}

/** Conta i mesh (veri, senza la zona del tocco) e l'ingombro di un modello: per il test e per i rapporti. */
export function misure (g) {
  g.updateMatrixWorld(true)
  let mesh = 0; const b = new THREE.Box3(), t = new THREE.Box3()
  g.traverseVisible(o => { if (o.isMesh) { mesh++; t.setFromObject(o, false); b.union(t) } })
  const s = new THREE.Vector3(); b.getSize(s)
  return { mesh, larghezza: s.x, altezza: s.y, lunghezza: s.z, sotto: b.min.y }
}

// Generato da strumenti/promuovi-3d.mjs da poc/mostri-3d/prati.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Prototipo: i mostri della zona dei prati («I prati del cimitero», livelli 1–3) come modelli 3D in codice. Stesso contratto di
// mostri.js: `crea…()` → Group coi piedi a y = 0 (i volanti, un poco sopra), davanti +z, `userData.anima(t)` e, dove c'è, `attacca(p)`.
// Autonomo: solo three e gli attrezzi di mostri.js.
import * as THREE from 'three'
import { M, mesh, sfera, rozza, scatola, cil, cono, perno, punta, osso, liscio, onda, creaScheletro, creaMelma } from './mostri.js'

const NERO = 0x17120f
const luce = (c, f = 1.6, o = {}) => M(c, { emissive: c, emissiveIntensity: f, flatShading: false, roughness: 0.4, ...o })
const lucido = (c, o = {}) => M(c, { flatShading: false, roughness: 0.25, ...o })

/** Un occhio con iride, pupilla e riflesso; torna il perno (per ammiccare con scale.y). */
function occhio (g, x, y, z, r, iride = 0x2a2018, bianco = 0xfdf6e0, emis = 0) {
  const o = perno(g, x, y, z); o.userData.occhio = true
  sfera(o, r, lucido(bianco), 0, 0, 0, 1, 1.05, 0.8, 12)
  sfera(o, r * 0.62, emis ? luce(iride, emis) : lucido(iride), 0, 0, r * 0.38, 1, 1, 0.7, 10)
  if (!emis) sfera(o, r * 0.32, lucido(NERO), 0, 0, r * 0.62, 1, 1.1, 0.6, 8)
  sfera(o, r * 0.2, lucido(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.4 }), r * 0.2, r * 0.25, r * 0.78, 1, 1, 0.6, 6)
  return o
}

/** Il corpo di una creatura a due gambe: gambe, busto, testa, braccia (perni con il pugno in fondo). */
function umanoide (o) {
  const { pelle, veste, calzoni, scarpa = 0x2c2119, gamba = 0.4, busto = [0.34, 0.4, 0.2], testa = 0.22, braccio = 0.3, gr = 0.05, sg = 0.06, maniche = true } = o
  const g = new THREE.Group(), mp = M(pelle), mv = M(veste), mc = M(calzoni)
  const P = { g, gambe: [], bracci: [], gomiti: [], mani: [] }
  for (const s of [-1, 1]) {
    const an = perno(g, s * busto[0] * 0.27, gamba, 0); P.gambe.push(an)
    osso(an, [0, 0, 0], [0, -gamba * 0.92, 0], sg, sg * 0.82, mc, 7)
    sfera(an, sg * 1.5, M(scarpa), 0, -gamba + sg * 0.9, sg * 0.9, 1, 0.65, 1.7, 8)
  }
  const bu = perno(g, 0, gamba, 0); P.busto = bu
  sfera(bu, 0.5, mv, 0, busto[1] / 2, 0, busto[0], busto[1], busto[2], 12)
  sfera(bu, 0.5, mc, 0, 0.02, 0, busto[0] * 0.9, busto[1] * 0.28, busto[2] * 0.95, 10)
  const te = perno(bu, 0, busto[1] + testa * 0.55, busto[2] * 0.1); P.testa = te
  sfera(te, testa, M(pelle), 0, 0, 0, 1, 0.95, 1.02, 14)
  for (const s of [-1, 1]) {
    const sp = perno(bu, s * (busto[0] / 2 + gr * 0.2), busto[1] * 0.88, 0); P.bracci.push(sp)
    osso(sp, [0, 0, 0], [0, -braccio * 0.5, 0], gr, gr * 0.88, maniche ? mv : mp, 7)
    const go = perno(sp, 0, -braccio * 0.5, 0); P.gomiti.push(go)
    osso(go, [0, 0, 0], [0, -braccio * 0.5, 0], gr * 0.88, gr * 0.72, mp, 7)
    const ma = perno(go, 0, -braccio * 0.52, 0); P.mani.push(ma)
    sfera(ma, gr * 1.15, mp, 0, 0, 0, 1, 1.1, 0.9, 8)
  }
  return P
}

const finisci = g => { g.userData.anima?.(0); return g }

// L'ATTACCO: ogni mostro dichiara `userData.attacco = { tipo, durata, arrivo, proiettile }` (durata in secondi, arrivo = frazione in cui colpisce,
// proiettile = null o { tipo, origine }, con `userData.origine` l'Object3D da cui nasce) e `userData.attacca(p)`, p da 0 a 1: funzione pura di p da
// chiamare DOPO anima(t) (anima azzera ogni cosa che attacca tocca). A p = 0 e p = 1 la posa è quella di riposo.
/** La fase di un attacco: s da −1 (carica indietro) a +1 (colpo a fondo, a p = arrivo), poi di nuovo 0 a p = 1. W = solo la carica, L = solo lo scatto. */
function ritmo (p, a) {
  const q = a * 0.55, s = p < q ? -liscio(0, q, p) : p < a ? -1 + 2 * liscio(q, a, p) : 1 - liscio(a, 1, p)
  return { s, W: Math.max(0, -s), L: Math.max(0, s) }
}
/** L'apertura della bocca di un morso: si spalanca fin quasi all'arrivo e si richiude di scatto. */
const apertura = (p, a) => liscio(0, a * 0.8, p) * (1 - liscio(a, Math.min(1, a + 0.12), p))
// L'IDLE VIVO: `vivo(g, extra)` incarta `anima`: il tempo di ogni istanza è t + userData.fase (così due mostri uguali non vanno all'unisono),
// gli occhi fatti con `occhio()` ammiccano da soli, poi `extra(T)` aggiunge il moto della specie. Tutto deterministico in T, senza stato.
let nIstanza = 0
/** Un gesto che si ripete: dentro la finestra [0, dur) ogni `per` secondi dà u (0..1) e b = sin(πu), fuori b = 0. */
const evento = (T, per, dur, off = 0) => { const k = (((T + off) % per) + per) % per; return k < dur ? { u: k / dur, b: Math.sin(Math.PI * k / dur) } : { u: 0, b: 0 } }
const ammicca = T => { const c = T % 3.4; return c < 0.16 ? Math.sin(c / 0.16 * Math.PI) : 0 }
function vivo (g, extra) {
  const base = g.userData.anima, occhi = []
  g.traverse(o => { if (o.userData.occhio) { o.userData.s0 = o.scale.clone(); occhi.push(o) } })
  g.userData.fase = (nIstanza++ * 2.37) % 7
  g.userData.anima = t => {
    const T = t + g.userData.fase
    base(T)
    const bl = ammicca(T + 0.7)
    for (const o of occhi) o.scale.set(o.userData.s0.x, o.userData.s0.y * (1 - 0.92 * bl), o.userData.s0.z)
    extra(T)
  }
}
const marcatore = (g, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); g.add(o); return o }
const dichiara = (g, tipo, durata, arrivo, proiettile = null) => { g.userData.attacco = { tipo, durata, arrivo, proiettile }; if (proiettile) g.userData.origine = proiettile.origine }

// ══════════════════════════════════════ LO ZOMBIE ══════════════════════════════════════
export function creaZombie (variante = 0) {
  const pelle = [0x86a07a, 0x9aa88a, 0x6f8a78][variante] ?? 0x86a07a
  const P = umanoide({ pelle, veste: [0x514a58, 0x5b4a3a, 0x3d4a56][variante] ?? 0x514a58, calzoni: 0x3a342c, gamba: 0.42, busto: [0.36, 0.42, 0.22], testa: 0.2, braccio: 0.34, gr: 0.052, sg: 0.065 })
  const { g, busto, testa } = P
  const carne = M(0x7a2a2a, { roughness: 0.5 }), osso1 = M(0xe0d5b8), buio = M(NERO, { roughness: 1 }), marcio = M(0x4d5a3c)
  busto.rotation.x = 0.22
  // la faccia: occhi diseguali e lattiginosi, bocca aperta con denti storti, cicatrice cucita
  occhio(testa, -0.075, 0.03, 0.16, 0.052, 0xcfd18a, 0xe9eccb).scale.setScalar(1.15)
  occhio(testa, 0.075, 0.015, 0.165, 0.038, 0xcfd18a, 0xe9eccb)
  for (const s of [-1, 1]) sfera(testa, 0.06, marcio, s * 0.075, 0.0, 0.14, 1.2, 1, 0.5, 8)   // le occhiaie livide
  scatola(testa, 0.1, 0.022, 0.03, buio, -0.075, 0.095, 0.17).rotation.z = 0.35
  scatola(testa, 0.09, 0.022, 0.03, buio, 0.075, 0.09, 0.17).rotation.z = -0.15
  const naso = cono(testa, 0.03, 0.06, M(pelle), 0, -0.03, 0.2, 4); naso.rotation.x = 1.1
  const mascella = perno(testa, 0, -0.1, 0.08)
  sfera(mascella, 0.075, buio, 0, 0.0, 0.07, 1.2, 0.5, 1.0, 8)
  for (const x of [-0.04, 0.0, 0.045]) cono(mascella, 0.014, 0.04 + Math.abs(x) * 0.4, osso1, x, 0.03, 0.11, 4).rotation.z = x * 3
  const lab = sfera(testa, 0.05, carne, 0.07, -0.09, 0.16, 1.3, 0.5, 0.6, 6); lab.rotation.z = 0.4
  for (let i = 0; i < 4; i++) scatola(testa, 0.008, 0.05, 0.008, buio, -0.11 + i * 0.012, -0.05 - i * 0.002, 0.17).rotation.z = 0.4   // i punti
  for (let i = 0; i < 5; i++) cono(testa, 0.02, 0.09, M(0x2a241e), -0.1 + i * 0.05, 0.19, -0.02 - Math.abs(i - 2) * 0.01, 4).rotation.set(-0.2, 0, (i - 2) * -0.3)   // ciuffi di capelli
  for (const s of [-1, 1]) sfera(testa, 0.05, M(pelle), s * 0.2, -0.01, 0.0, 0.5, 1, 0.8, 8)
  // la ferita sul petto, con le costole scoperte, e i brandelli della camicia
  const ferita = perno(busto, 0.07, 0.25, 0.12)
  sfera(ferita, 0.09, carne, 0, 0, 0.02, 1, 1.3, 0.35, 10)
  for (let i = 0; i < 3; i++) { const c = scatola(ferita, 0.1, 0.014, 0.02, osso1, 0.0, -0.05 + i * 0.05, 0.05); c.rotation.z = 0.15 }
  for (let i = -2; i <= 2; i++) { const b = scatola(busto, 0.06, 0.1 + (i & 1) * 0.07, 0.01, M(0x514a58, { side: THREE.DoubleSide }), i * 0.065, 0.0 - (i & 1) * 0.02, 0.1); b.rotation.set(0.1, 0, i * 0.08) }
  // mani rigide con le unghie nere, una manica strappata
  for (const [i, s] of [[0, -1], [1, 1]]) for (let k = -1; k <= 1; k++) cono(P.mani[i], 0.009, 0.05, buio, k * 0.02, -0.06, 0.012, 4)
  const benda = cil(P.gomiti[1], 0.047, 0.047, 0.07, M(0xcdbf9e), 0, -0.07, 0, 8)
  g.userData.anima = t => {
    const r = onda(t, 1.8)
    busto.rotation.x = 0.24 + r * 0.02; busto.rotation.z = onda(t, 0.9) * 0.05
    testa.rotation.set(0.22 + onda(t, 0.7) * 0.05, onda(t, 0.5) * 0.15, 0.22 + onda(t, 1.1) * 0.06)
    mascella.rotation.x = 0.1 + Math.max(0, onda(t, 1.3)) * 0.25
    P.bracci[0].rotation.set(-1.28 + onda(t, 1.6) * 0.1, 0.1, 0.08); P.bracci[1].rotation.set(-1.4 + onda(t, 1.6, 1.3) * 0.1, -0.1, -0.08)
    P.gomiti[0].rotation.x = -0.15 + onda(t, 2.2) * 0.04; P.gomiti[1].rotation.x = -0.25 + onda(t, 2.2, 1) * 0.04
    P.gambe[0].rotation.x = onda(t, 1.0) * 0.05; P.gambe[1].rotation.x = -onda(t, 1.0) * 0.05 - 0.05
    g.rotation.y = onda(t, 0.4) * 0.05; g.position.z = 0
  }
  dichiara(g, 'zampata', 0.8, 0.55)                                            // alza le due braccia e le schianta in avanti
  g.userData.attacca = p => {
    const { s, W, L } = ritmo(p, 0.55)
    busto.rotation.x += s * 0.35; testa.rotation.x += s * 0.2; mascella.rotation.x += W * 0.45 + L * 0.15
    P.bracci[0].rotation.x += s * 1.35; P.bracci[1].rotation.x += s * 1.35; P.gomiti.forEach(go => { go.rotation.x += -W * 0.4 })
    g.position.z += L * 0.28
  }
  vivo(g, T => {                                                                // barcolla, ciondola la testa; ogni ~6 s una sbandata
    const bob = Math.abs(Math.sin(T * Math.PI * 1.1)), sw = Math.sin(T * 0.95), ev = evento(T, 6.3, 1.7)
    busto.position.y = 0.42 + bob * 0.035; busto.rotation.z += sw * 0.08 + ev.b * Math.sin(T * 9) * 0.05; busto.rotation.x += ev.b * 0.2
    g.rotation.z = sw * 0.05 + ev.b * 0.12 * Math.sin(ev.u * Math.PI * 2)
    testa.rotation.z += Math.sin(T * 1.3) * 0.14 + ev.b * 0.5; testa.rotation.x += Math.sin(T * 2.1) * 0.05 + ev.b * 0.15
    mascella.rotation.x += ev.b * 0.35 + Math.max(0, Math.sin(T * 2.6)) * 0.1
    P.bracci.forEach((b, i) => { b.rotation.x += Math.sin(T * 2.2 + i * 1.5) * 0.1 + ev.b * 0.3 })
  })
  return finisci(g)
}

// ══════════════════════════════════════ IL FANTASMA ══════════════════════════════════════
export function creaFantasma (variante = 0) {
  const g = new THREE.Group()
  const col = [0xdfeeff, 0xc9f0e4, 0xe8d8f5][variante] ?? 0xdfeeff, bagliore = [0x7fb8ff, 0x6fe0b8, 0xb890f0][variante] ?? 0x7fb8ff
  const vel = new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: 0.66, roughness: 0.45, emissive: bagliore, emissiveIntensity: 0.5, depthWrite: false, side: THREE.DoubleSide })
  const buio = new THREE.MeshStandardMaterial({ color: 0x0b1020, roughness: 0.4, transparent: true, opacity: 0.95, depthWrite: false })
  const occhiaie = luce(bagliore, 4.5, { transparent: true, opacity: 0.95, depthWrite: false })
  // il lenzuolo: un solido di rotazione ricalcolato a ogni fotogramma (la coda scivola dietro e ondeggia, l'orlo è a frange)
  const S = 28, R = 20, Y0 = 1.5, Y1 = 0.12
  const geo = new THREE.BufferGeometry(), pos = new Float32Array((R + 1) * (S + 1) * 3), idx = []
  for (let i = 0; i < R; i++) for (let j = 0; j < S; j++) { const a = i * (S + 1) + j, b = a + S + 1; idx.push(a, b, a + 1, a + 1, b, b + 1) }
  geo.setIndex(idx); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const profilo = y => y > 1.2 ? 0.28 * Math.sqrt(Math.max(0, 1 - ((y - 1.2) / 0.3) ** 2)) : y > 0.9 ? 0.28 + 0.09 * Math.sin((1.2 - y) / 0.3 * Math.PI / 2) : 0.37 * Math.max(0.12, 1 - ((0.9 - y) / 0.85) ** 1.2)
  const forma = t => {
    for (let i = 0; i <= R; i++) {
      const u = i / R, y = Y0 + (Y1 - Y0) * u, coda = Math.max(0, (0.95 - y) / 0.85)
      const r = profilo(y)
      const dz = -(coda ** 2) * 0.55 + Math.sin(t * 1.6 - coda * 3) * 0.07 * coda, dx = Math.sin(t * 1.3 - coda * 2.6) * 0.1 * coda
      for (let j = 0; j <= S; j++) {
        const a = j / S * Math.PI * 2, fr = 1 + 0.1 * coda * Math.sin(a * 5 + t * 2.4 + coda * 4)
        const k = (i * (S + 1) + j) * 3
        pos[k] = Math.sin(a) * r * fr + dx; pos[k + 1] = y + (coda > 0.7 ? 0.06 * Math.sin(a * 5 + t * 2.4) * coda : 0); pos[k + 2] = Math.cos(a) * r * fr * 0.92 + dz
      }
    }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals()
  }
  const lenzuolo = new THREE.Mesh(geo, vel); lenzuolo.renderOrder = 4; g.add(lenzuolo)
  const alto = perno(g, 0, 0, 0)
  // il viso: occhi vuoti col lume, sopracciglia tese, bocca che urla
  const faccia = perno(g, 0, 1.19, 0.255); faccia.rotation.x = 0.05
  for (const s of [-1, 1]) {
    sfera(faccia, 0.07, buio, s * 0.105, 0.03, 0.0, 1, 1.45, 0.5, 12).castShadow = false
    sfera(faccia, 0.034, occhiaie, s * 0.105, 0.0, 0.025, 1, 1.4, 0.5, 8).castShadow = false
    const so = scatola(faccia, 0.13, 0.03, 0.03, buio, s * 0.11, 0.17, 0.0); so.rotation.z = s * -0.4; so.castShadow = false
  }
  const bocca = sfera(faccia, 0.065, buio, 0, -0.14, 0.0, 1, 1.8, 0.45, 12); bocca.castShadow = false
  // le braccia lunghe, che si tendono in avanti
  const braccia = []
  for (const s of [-1, 1]) {
    const sp = perno(alto, s * 0.3, 0.98, 0.1); braccia.push(sp)
    const br = cono(sp, 0.085, 0.62, vel, s * 0.02, -0.3, 0.0, 9); br.rotation.x = Math.PI; br.castShadow = false
    sfera(sp, 0.085, vel, s * 0.02, -0.0, 0.0, 1, 1, 1, 10).castShadow = false
    for (let d = -1; d <= 1; d++) { const dt = cono(sp, 0.014, 0.17, vel, s * 0.02 + d * 0.03, -0.69, 0.0, 4); dt.rotation.z = d * 0.3; dt.rotation.x = Math.PI; dt.castShadow = false }
  }
  const pozza = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), new THREE.MeshBasicMaterial({ color: bagliore, transparent: true, opacity: 0.16, depthWrite: false }))
  pozza.rotation.x = -Math.PI / 2; pozza.position.y = 0.015; g.add(pozza)
  const fuoco = sfera(g, 0.035, luce(0xfff2c0, 3, { transparent: true, opacity: 0.9 }), 0, 0, 0, 1, 1, 1, 8); fuoco.castShadow = false
  g.userData.anima = t => {
    const f = onda(t, 1.6)
    forma(t); lenzuolo.position.y = alto.position.y = 0.22 + f * 0.05
    alto.rotation.z = onda(t, 1.1) * 0.03
    faccia.position.set(onda(t, 1.5, -2.2) * 0.008, 1.19 + 0.22 + f * 0.05, 0.255)
    braccia.forEach((b, i) => { const s = i ? 1 : -1; b.position.y = 0.98 + 0.22 + f * 0.05; b.rotation.x = -1.15 + onda(t, 1.4, i * 1.8) * 0.2; b.rotation.z = s * (0.3 + onda(t, 1.0, i) * 0.1) })
    bocca.scale.set(1, 1.8 + Math.max(0, onda(t, 1.2)) * 0.9, 0.45)
    fuoco.position.set(Math.cos(t * 1.4) * 0.75, 0.9 + Math.sin(t * 1.9) * 0.25, Math.sin(t * 1.4) * 0.75)
    pozza.material.opacity = 0.14 + f * 0.03
    faccia.scale.setScalar(1); g.position.z = 0; g.rotation.x = 0
  }
  dichiara(g, 'tocco', 0.9, 0.55, { tipo: 'onda', origine: marcatore(g, 0, 1.4, 0.5) })   // il lamento: si ritrae, spalanca la bocca e scatta con le mani gelide
  g.userData.attacca = p => {
    const { s, W, L } = ritmo(p, 0.55)
    braccia.forEach((b, i) => { const sg = i ? 1 : -1; b.rotation.x += -s * 0.8; b.rotation.z += sg * W * 0.55 })
    bocca.scale.y += W * 0.9 + L * 1.8; faccia.scale.multiplyScalar(1 + L * 0.3)
    g.position.z += L * 0.4 - W * 0.1; g.rotation.x += -W * 0.16 + L * 0.22
  }
  vivo(g, T => {                                                                // fluttua ampio, il lenzuolo ondeggia; ogni ~5 s un lamento
    const fl = Math.sin(T * 1.25) * 0.09, ev = evento(T, 5.2, 1.6)
    forma(T * 1.6)
    for (const o of [lenzuolo, alto, faccia, ...braccia]) o.position.y += fl
    g.position.x = Math.sin(T * 0.6) * 0.12; g.rotation.z = Math.sin(T * 0.8) * 0.07 - ev.b * 0.05
    braccia.forEach((b, i) => { b.rotation.x += Math.sin(T * 1.9 + i * 2) * 0.18 - ev.b * 0.5 })
    bocca.scale.y += ev.b * 1.2; g.rotation.x += -ev.b * 0.12; faccia.scale.setScalar(1 + ev.b * 0.12)
  })
  return finisci(g)
}

// ══════════════════════════════════════ GLI SCHELETRI ══════════════════════════════════════
const trova = (g, tipo, prop, val) => { let r = null; g.traverse(o => { if (o.isMesh && o.geometry.type === tipo && Math.abs(o.geometry.parameters[prop] - val) < 1e-6) r = o }); return r }

function elmo (testa, ruggine) {
  const g = perno(testa, 0, 0.02, 0.0)
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), M(0x6a6f76, { metalness: 0.55, roughness: 0.5, side: THREE.DoubleSide }))
  m.scale.set(1, 1.0, 1.1); m.position.y = 0.03; m.castShadow = true; g.add(m)
  const fascia = cil(g, 0.205, 0.205, 0.03, ruggine, 0, 0.11, 0.0, 14); fascia.scale.z = 1.1
  scatola(g, 0.035, 0.12, 0.02, ruggine, 0, -0.03, 0.225)                                         // il nasale
  const cresta = scatola(g, 0.03, 0.14, 0.32, M(STRACCIO), 0, 0.28, -0.02); cresta.rotation.x = -0.05
  for (let i = 0; i < 5; i++) cono(g, 0.04, 0.14, M(STRACCIO), 0, 0.32, 0.12 - i * 0.075, 5).rotation.x = -0.2
  for (const s of [-1, 1]) scatola(g, 0.015, 0.04, 0.06, M(0x15100c), s * 0.19, 0.04, 0.0)        // i fori laterali
  return g
}
const STRACCIO = 0x9a2f27

/** La testa dello scheletro (il perno che regge il teschio): `creaScheletro` non lo espone, lo si trova dal cranio. */
const testaDi = g => trova(g, 'IcosahedronGeometry', 'radius', 0.16).parent.parent

/** Il caporale dei prati: lo scheletro del cimitero in elmo di ferro con la cresta rossa, spallaccio e scudo più grande con lo stemma.
 *  Idle e attacco (colpo-arma) sono quelli di `creaScheletro`; qui si aggiunge il gesto di sistemare spada e scudo. */
export function creaScheletroScudo () {
  const g = creaScheletro(), rug = M(0x8a6a50, { metalness: 0.5, roughness: 0.55 })
  const testa = testaDi(g)
  elmo(testa, rug)
  const spada = trova(g, 'BoxGeometry', 'height', 0.62), spD = spada.parent.parent.parent.parent, gomD = spada.parent.parent.parent
  const scudo = trova(g, 'CylinderGeometry', 'radiusTop', 0.27), spS = scudo.parent.parent.parent.parent
  // spallaccio di ferro con borchie, attaccato al braccio dell'arma (la schiena si piega, lui segue)
  const sp = perno(spD, 0, 0.03, 0)
  const pl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), M(0x6a6f76, { metalness: 0.55, roughness: 0.5, side: THREE.DoubleSide })); pl.scale.set(1.3, 1, 1.1); pl.castShadow = true; sp.add(pl)
  for (let i = 0; i < 3; i++) cono(sp, 0.016, 0.06, rug, -0.04 + i * 0.05, 0.07, 0, 4)
  scudo.parent.scale.setScalar(1.18); const st = cono(scudo.parent, 0.12, 0.3, M(STRACCIO), 0, 0, 0.06, 3); st.rotation.set(0, 0, Math.PI); st.scale.z = 0.2
  vivo(g, T => {                                                                // dondola il peso, gira il teschio; ogni ~5,5 s sistema spada e scudo
    const ev = evento(T, 5.5, 1.8)
    g.rotation.z = Math.sin(T * 1.05) * 0.04
    testa.rotateY(Math.sin(T * 0.55) * 0.35); testa.rotateX(Math.sin(T * 1.9) * 0.05 + ev.b * 0.1); testa.rotateZ(Math.sin(T * 40) * 0.025 * ev.b)
    spD.rotateX(-ev.b * 0.9 + Math.sin(ev.u * Math.PI * 4) * 0.12 * ev.b); gomD.rotateX(ev.b * 0.3)
    spS.rotateX(-ev.b * 0.35 + Math.sin(T * 1.4) * 0.04)
  })
  g.scale.setScalar(0.76)
  return g
}

/** Due ossa (spalla→gomito→mano) che raggiungono un bersaglio: cinematica inversa a due segmenti, nel sistema del gruppo. */
function raggiungi (sp, go, bersaglio, polo, L1 = 0.295, L2 = 0.285) {
  const S = sp.position, T = bersaglio.clone().sub(S), d = Math.min(T.length(), L1 + L2 - 1e-3), dir = T.clone().normalize()
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a))
  const p = polo.clone().sub(dir.clone().multiplyScalar(polo.dot(dir))).normalize()
  const E = S.clone().addScaledVector(dir, a).addScaledVector(p, h), H = S.clone().addScaledVector(dir, d)
  const giu = new THREE.Vector3(0, -1, 0)
  sp.quaternion.setFromUnitVectors(giu, E.clone().sub(S).normalize())
  const qf = new THREE.Quaternion().setFromUnitVectors(giu, H.clone().sub(E).normalize())
  go.quaternion.copy(sp.quaternion.clone().invert()).multiply(qf)
}
function segmento (m, A, B) { const d = B.clone().sub(A); m.position.copy(A).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); m.scale.y = d.length() }

/** L'arciere: lo scheletro senza spada né scudo, con arco, freccia incoccata, faretra e cappuccio. */
export function creaScheletroArciere () {
  const g = creaScheletro()
  const spada = trova(g, 'BoxGeometry', 'height', 0.62), scudo = trova(g, 'CylinderGeometry', 'radiusTop', 0.27)
  const manoD = spada.parent.parent, manoS = scudo.parent.parent
  spada.parent.visible = false; scudo.parent.visible = false
  const gomD = manoD.parent, spD = gomD.parent, gomS = manoS.parent, spS = gomS.parent
  const legno = M(0x6e4a2c), corda = M(0xe8dcb8, { flatShading: false }), piuma = M(0xa83a2c)
  // l'arco (limbi lungo Y, pancia verso +Z) nella mano sinistra: nel frame della mano +Y indietro e +Z in alto → ruota di 90° e controscala
  const SC = 0.85, xa = -0.2, ya = 1.36, z0 = 0.52
  const arco = perno(g, xa, ya, z0); arco.scale.setScalar(SC)
  const pts = []; for (let k = 0; k <= 16; k++) { const y = -0.72 + k / 16 * 1.44; pts.push(new THREE.Vector3(0, y, -0.26 * (y / 0.72) ** 2 + 0.0)) }
  const ramo = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.032, 6), legno); ramo.castShadow = true; arco.add(ramo)
  cil(arco, 0.05, 0.05, 0.2, M(0x3a2a1c), 0, 0, 0, 8).scale.z = 1.3
  for (const s of [-1, 1]) sfera(arco, 0.04, M(0xe9dcc0), 0, s * 0.72, -0.26, 1, 1, 1, 6)
  const cordaA = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 1, 5), corda), cordaB = cordaA.clone(); arco.add(cordaA, cordaB)
  const freccia = perno(arco, 0, 0, 0)
  cil(freccia, 0.022, 0.022, 1.1, legno, 0, 0, 0.4, 5).rotation.x = Math.PI / 2
  const pt = cono(freccia, 0.04, 0.12, M(0x8a8f96, { metalness: 0.5 }), 0, 0, 0.98, 4); pt.rotation.x = Math.PI / 2
  for (let k = 0; k < 3; k++) { const f = cono(freccia, 0.05, 0.16, piuma, 0, 0, -0.1 + 0.0, 3); f.rotation.set(Math.PI / 2, 0, k * Math.PI * 2 / 3); f.scale.set(1, 1, 0.2); f.position.set(Math.sin(k * 2.1) * 0.03, Math.cos(k * 2.1) * 0.03, -0.05) }
  // la faretra sulla schiena, con tre frecce piumate; bandoliera di cuoio
  const far = perno(g, -0.06, 1.12, -0.2); far.rotation.set(0.1, 0, 0.35)
  cil(far, 0.065, 0.075, 0.38, M(0x5a3a22), 0, 0, 0, 10)
  cil(far, 0.07, 0.07, 0.025, rugg(), 0, 0.17, 0, 10); cil(far, 0.08, 0.08, 0.025, rugg(), 0, -0.17, 0, 10)
  for (let i = 0; i < 3; i++) { const a = perno(far, (i - 1) * 0.03, 0.2, (i % 2) * 0.015); a.rotation.z = (i - 1) * 0.15; cil(a, 0.006, 0.006, 0.3, legno, 0, 0.05, 0, 4); cono(a, 0.028, 0.07, piuma, 0, 0.2, 0, 3).scale.z = 0.25 }
  const bandoliera = scatola(g, 0.04, 0.55, 0.012, M(0x4a3426), 0, 1.15, 0.115); bandoliera.rotation.z = 0.7
  const testa = testaDi(g)
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), M(0x4a5a34, { side: THREE.DoubleSide })); cap.position.set(0, 0.04, -0.03); cap.scale.set(1.05, 1.0, 1.15); cap.castShadow = true; testa.add(cap)
  cono(testa, 0.08, 0.2, M(0x4a5a34), 0, 0.14, -0.2, 6).rotation.x = -1.15
  const base = g.userData.anima, bers = new THREE.Vector3(), polo = new THREE.Vector3()
  let dy = 0, exS = 0, exD = 0
  const applica = (tendi, vibra = 0) => {
    arco.position.y = ya + dy
    raggiungi(spS, gomS, bers.set(xa, ya + dy, z0 - 0.02), polo.set(-0.6, 0.5, -0.1))
    const T = new THREE.Vector3(0, 0, -0.26 - tendi * 0.5 + vibra)             // il punto di incocco, nel sistema dell'arco
    raggiungi(spD, gomD, bers.set(xa + 0.03, ya - 0.03 + dy, z0 + T.z * SC), polo.set(0.8, 0.45, -0.3))
    spS.rotateX(exS); spD.rotateZ(exD)
    segmento(cordaA, new THREE.Vector3(0, -0.72, -0.26), T); segmento(cordaB, T, new THREE.Vector3(0, 0.72, -0.26))
    freccia.position.z = T.z
  }
  g.userData.anima = t => {
    base(t); applica(0)
    freccia.visible = true; g.position.z = 0; g.rotation.x = 0
    testa.rotateY(-0.12 + onda(t, 0.45) * 0.08)
  }
  const A = 0.62
  dichiara(g, 'spara', 0.95, A, { tipo: 'freccia', origine: marcatore(arco, 0, 0, 0.5) })   // tende l'arco, scocca (la freccia sparisce), la corda vibra, ne incocca un'altra
  g.userData.attacca = p => {
    const tendi = p < A ? liscio(0.06, A, p) : 0, d = p - A
    applica(tendi, d > 0 && d < 0.16 ? Math.sin(d * 90) * 0.05 * (1 - d / 0.16) : 0)
    freccia.visible = p < A || p > 0.86
    g.position.z += -tendi * 0.05 + (d > 0 ? Math.max(0, 1 - d * 6) * 0.05 : 0); g.rotation.x += -tendi * 0.06
    g.rotation.y += -tendi * 0.18; testa.rotation.x += tendi * 0.05
  }
  vivo(g, T => {                                                                // dondola, guarda intorno; ogni ~6 s sistema l'arco e la corda
    const ev = evento(T, 6.2, 1.8)
    dy = ev.b * 0.06 + Math.sin(T * 1.9) * 0.02; exS = Math.sin(ev.u * Math.PI * 3) * 0.08 * ev.b; exD = Math.sin(T * 1.6) * 0.05; applica(0)
    g.rotation.z = Math.sin(T * 1.1) * 0.07; g.rotation.x = Math.sin(T * 1.6) * 0.03
    testa.rotateY(Math.sin(T * 0.7) * 0.55); testa.rotateX(Math.sin(T * 1.7) * 0.05 + ev.b * 0.12)
  })
  g.scale.setScalar(0.68)
  return finisci(g)
}
function rugg () { return M(0x8a6a50, { metalness: 0.5, roughness: 0.55 }) }

// ══════════════════════════════════════ IL RATTO ══════════════════════════════════════
export function creaRatto (variante = 0) {
  const g = new THREE.Group()
  const pelo = M([0x6b5d50, 0x3a342f, 0x8a7a68][variante] ?? 0x6b5d50), pelo2 = M([0x4d4339, 0x1f1b18, 0x6a5c4c][variante] ?? 0x4d4339)
  const rosa = M(0xd89a98, { flatShading: false, roughness: 0.6 }), dente = M(0xf2e6c0), buio = M(NERO)
  const corpo = perno(g, 0, 0, 0)
  sfera(corpo, 0.5, pelo, 0, 0.17, -0.02, 0.36, 0.34, 0.78, 12)                                    // il dorso
  sfera(corpo, 0.5, pelo2, 0, 0.11, 0.03, 0.3, 0.22, 0.6, 10)                                      // il ventre, più scuro
  for (let i = 0; i < 9; i++) { const z = -0.2 + i * 0.05; const c = cono(corpo, 0.03, 0.08, pelo2, (i % 3 - 1) * 0.04, 0.3 - Math.abs(i - 4) * 0.008, z, 4); c.rotation.set(-0.5, 0, (i % 3 - 1) * 0.4) }   // pelo ispido
  const testa = perno(corpo, 0, 0.19, 0.3)
  sfera(testa, 0.1, pelo, 0, 0, 0, 1, 0.95, 1.2, 12)
  const muso = sfera(testa, 0.06, pelo, 0, -0.025, 0.12, 0.85, 0.8, 1.4, 10); void muso
  sfera(testa, 0.027, rosa, 0, -0.01, 0.2, 1, 0.9, 0.9, 8)                                         // il naso
  for (const s of [-1, 1]) {
    sfera(testa, 0.062, pelo2, s * 0.085, 0.1, -0.04, 1, 1, 0.3, 10); sfera(testa, 0.046, rosa, s * 0.085, 0.1, -0.02, 1, 1, 0.3, 8)   // orecchie
    const o = sfera(testa, 0.021, luce(0xff3a2a, 1.4), s * 0.058, 0.04, 0.09, 1, 1, 0.8, 8); void o   // occhietti rossi
    sfera(testa, 0.007, M(0xffffff, { flatShading: false }), s * 0.058 + 0.007, 0.052, 0.108, 1, 1, 1, 4)
    for (let k = 0; k < 3; k++) { const w = scatola(testa, 0.11, 0.003, 0.003, M(0xd8d0c0), s * 0.09, -0.015 - k * 0.012, 0.15); w.rotation.set(0, 0, s * (-0.15 + k * 0.15)); w.rotation.y = s * (0.2 + k * 0.1) }  // baffi
  }
  const mascella = perno(testa, 0, -0.05, 0.1)
  sfera(mascella, 0.04, pelo2, 0, -0.005, 0.04, 0.9, 0.4, 1.3, 8)
  for (const s of [-1, 1]) { scatola(testa, 0.016, 0.045, 0.012, dente, s * 0.014, -0.065, 0.18); scatola(mascella, 0.012, 0.03, 0.01, dente, s * 0.014, 0.025, 0.08) }
  // le zampe: coscia dietro più grossa, mani rosa con le dita
  const zampe = []
  for (const [z, gr] of [[0.2, 0.04], [-0.2, 0.06]]) for (const s of [-1, 1]) {
    const an = perno(corpo, s * 0.12, 0.16, z); zampe.push(an)
    sfera(an, gr, pelo, 0, -0.01, 0, 1, 1.2, 1.1, 8)
    osso(an, [0, -0.04, 0], [0, -0.13, 0.02], 0.022, 0.016, pelo, 6)
    sfera(an, 0.027, rosa, 0, -0.14, 0.05, 1, 0.55, 1.5, 6)
    for (let k = -1; k <= 1; k++) cono(an, 0.006, 0.03, buio, k * 0.014, -0.145, 0.095, 4).rotation.x = Math.PI / 2
  }
  // la coda a corda: tanti anelli rosa, la punta che si arriccia
  const coda = perno(corpo, 0, 0.14, -0.38)
  const anelli = []
  for (let i = 0; i < 14; i++) { const a = sfera(coda, 0.022 - i * 0.0011, rosa, 0, 0, 0, 1, 1, 1.25, 6); anelli.push(a) }
  // una cicatrice e un orecchio morso
  const cic = scatola(corpo, 0.012, 0.012, 0.18, M(0xc79b8e), 0.1, 0.27, 0.0); cic.rotation.set(0.3, 0.2, 0.7)
  g.userData.anima = t => {
    const r = onda(t, 4.2)
    corpo.scale.set(1 + r * 0.012, 1 + r * 0.02, 1); corpo.position.y = 0; corpo.position.z = 0; corpo.rotation.x = 0
    testa.rotation.set(onda(t, 1.3) * 0.08 + 0.06, onda(t, 0.8) * 0.25, onda(t, 0.6) * 0.04)
    mascella.rotation.x = 0.04 + Math.max(0, onda(t, 2.7)) * 0.2
    anelli.forEach((a, i) => { const u = i / 13; a.position.set(onda(t, 2.4, -i * 0.35) * 0.05 * (u + 0.2), 0.0 + u * u * 0.12 - Math.sin(u * 3.0) * 0.015, -i * 0.045) })
    zampe.forEach((z, i) => { z.rotation.x = onda(t, 1.2, i) * 0.03 })
  }
  dichiara(g, 'morso', 0.6, 0.5)                                               // si rizza sulle zampe di dietro, poi si lancia a bocca aperta
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.5)
    corpo.rotation.x += -W * 0.32 + L * 0.12; corpo.position.z += -W * 0.1 + L * 0.34
    testa.rotation.x += -W * 0.2 + L * 0.3; mascella.rotation.x += apertura(p, 0.5) * 0.9
    zampe[0].rotation.x += -W * 0.5; zampe[1].rotation.x += -W * 0.5
  }
  vivo(g, T => {                                                                // annusa di continuo, scodinzola; ogni ~5,5 s si rizza e si lava il muso
    const ev = evento(T, 5.5, 1.6), sn = 0.4 + 0.6 * Math.sin(T * 0.7) ** 2
    corpo.rotation.z = Math.sin(T * 1.4) * 0.05; corpo.position.y = Math.abs(Math.sin(T * Math.PI * 1.5)) * 0.008
    testa.rotation.x += Math.sin(T * 11) * 0.07 * sn - ev.b * 0.1; testa.rotation.y += Math.sin(T * 0.9) * 0.35
    mascella.rotation.x += Math.max(0, Math.sin(T * 11)) * 0.08 * sn
    corpo.rotation.x += -ev.b * 0.55
    zampe[0].rotation.x += -ev.b * (1.6 + Math.sin(T * 16) * 0.35); zampe[1].rotation.x += -ev.b * (1.6 + Math.sin(T * 16 + 1.5) * 0.35)
    anelli.forEach((a, i) => { a.position.x += Math.sin(T * 3 - i * 0.45) * 0.035 * (i / 13) })
  })
  return finisci(g)
}

// ══════════════════════════════════════ IL GOBLIN ══════════════════════════════════════
export function creaGoblin (variante = 0) {
  const pelle = [0x7fb04a, 0xc0583a, 0x3f6a46][variante] ?? 0x7fb04a
  const P = umanoide({ pelle, veste: [0x6b4f2e, 0x4a3a2a, 0x2d2d33][variante] ?? 0x6b4f2e, calzoni: 0x4a3b2a, gamba: 0.27, busto: [0.27, 0.26, 0.18], testa: 0.2, braccio: 0.22, gr: 0.034, sg: 0.04, maniche: false })
  const { g, busto, testa } = P
  const dente = M(0xf0e4b8), buio = M(NERO), rug = M(0x8e6b52, { metalness: 0.5, roughness: 0.55 }), tess = M(0x7a5a38)
  busto.rotation.x = 0.28
  // il faccione: orecchie enormi, naso a uncino, occhi gialli furbi, bocca storta con le zanne
  for (const s of [-1, 1]) {
    const o = punta(testa, [s * 0.15, 0.03, -0.02], [s * 0.5, 0.17, -0.12], 0.075, M(pelle), 6); void o
    punta(testa, [s * 0.17, 0.035, -0.01], [s * 0.42, 0.14, -0.1], 0.04, M(0xd88a80), 4).position.z += 0.0
    occhio(testa, s * 0.08, 0.05, 0.155, 0.056, 0xffd426, 0xfff9d0, 0.0).scale.set(1, 1.1, 1)
    scatola(testa, 0.12, 0.03, 0.04, M(pelle).clone(), s * 0.085, 0.13, 0.15).rotation.z = s * 0.35
  }
  punta(testa, [0, 0.0, 0.17], [0, -0.1, 0.35], 0.05, M(pelle), 6)                                    // il naso
  sfera(testa, 0.03, M(0x5a8a34), 0, -0.1, 0.34, 1, 0.8, 1, 6)
  const bocca = perno(testa, 0, -0.1, 0.13)
  scatola(bocca, 0.17, 0.025, 0.05, buio, 0, -0.01, 0.045).rotation.z = 0.12
  for (const [x, h] of [[-0.06, 0.06], [0.07, 0.07], [0.0, 0.04]]) cono(bocca, 0.014, h, dente, x, 0.025, 0.07, 4).rotation.x = Math.PI
  for (let i = 0; i < 3; i++) cono(testa, 0.02, 0.07, M(0x2a241e), -0.04 + i * 0.04, 0.2, -0.02, 4).rotation.set(-0.3, 0, (i - 1) * -0.4)
  // sacco di refurtiva sulla schiena, perizoma, cintura con fibbia di latta
  const sacco = perno(busto, 0, 0.18, -0.2)
  sfera(sacco, 0.17, M(0x8a7a52), 0, 0, 0, 1, 1.1, 0.95, 10); cono(sacco, 0.06, 0.12, M(0x8a7a52), 0.0, 0.22, 0.0, 6)
  cil(sacco, 0.05, 0.05, 0.03, M(0x4a3426), 0, 0.16, 0, 8)
  for (const [x, y] of [[0.08, -0.04], [-0.07, 0.03]]) sfera(sacco, 0.04, M(0xf0c040, { metalness: 0.7, roughness: 0.3, emissive: 0x6a4a00, emissiveIntensity: 0.4 }), x, y, -0.13, 1, 1, 0.4, 6)   // una moneta che spunta
  for (let i = -1; i <= 1; i++) scatola(busto, 0.07, 0.15 - Math.abs(i) * 0.03, 0.01, tess, i * 0.07, 0.02, 0.1).rotation.z = i * 0.1
  scatola(busto, 0.3, 0.035, 0.2, M(0x2c2119), 0, 0.06, 0).scale.set(0.9, 1, 0.9)
  scatola(busto, 0.04, 0.04, 0.02, M(0xc8c8c0, { metalness: 0.7 }), 0, 0.06, 0.1)
  // il pugnale arrugginito nella destra
  const pu = perno(P.mani[1], 0, 0, 0); pu.rotation.x = 1.5
  cil(pu, 0.015, 0.015, 0.1, M(0x3a2a1c), 0, 0, 0, 6); scatola(pu, 0.08, 0.018, 0.03, rug, 0, 0.055, 0)
  const lama = scatola(pu, 0.04, 0.26, 0.012, rug, 0, 0.19, 0); void lama
  punta(pu, [0, 0.32, 0], [0, 0.4, 0], 0.02, rug, 4).scale.z = 0.3
  for (const y of [0.15, 0.24]) scatola(pu, 0.014, 0.025, 0.014, M(0x5a3a28), 0.02, y, 0)
  // i pidocchi di una sporcizia: macchie scure sul panciotto
  for (const [x, y] of [[0.05, 0.12], [-0.07, 0.07]]) sfera(busto, 0.03, M(0x4a3626), x, y, 0.085, 1, 1, 0.3, 6)
  g.userData.anima = t => {
    const r = onda(t, 3.0)
    busto.rotation.x = 0.28 + r * 0.025; busto.position.y = 0.27 + Math.abs(onda(t, 3.0)) * 0.01
    testa.rotation.set(0.1 + onda(t, 1.1) * 0.06, onda(t, 0.8) * 0.3, onda(t, 1.3) * 0.08)
    bocca.rotation.x = Math.max(0, onda(t, 2.3)) * 0.2
    P.bracci[1].rotation.set(-0.7 + onda(t, 1.5) * 0.05, 0, -0.18); P.gomiti[1].rotation.x = -0.9
    P.bracci[0].rotation.set(-0.35 + onda(t, 1.7) * 0.06, 0, 0.15); P.gomiti[0].rotation.x = -0.5
    P.gambe[0].rotation.x = 0.1; P.gambe[1].rotation.x = -0.1 + onda(t, 3.0) * 0.02
    pu.rotation.x = 1.3 + onda(t, 5) * 0.03; g.position.z = 0
  }
  dichiara(g, 'colpo-arma', 0.6, 0.5)                                          // porta indietro il pugnale e affonda la stoccata
  g.userData.attacca = p => {
    const { s, W, L } = ritmo(p, 0.5)
    P.bracci[1].rotation.x += 1.2 * W - 0.9 * L; P.gomiti[1].rotation.x += -0.6 * W + 0.9 * L
    busto.rotation.x += s * 0.35; testa.rotation.x += s * 0.12; g.position.z += L * 0.25
    P.bracci[0].rotation.x += -W * 0.4
  }
  g.scale.setScalar(0.8)
  vivo(g, T => {                                                                // saltella sul posto, si guarda intorno; ogni ~5 s sogghigna e rigira il pugnale
    const ev = evento(T, 5.1, 1.5), bob = Math.abs(Math.sin(T * Math.PI * 1.6))
    busto.position.y += bob * 0.03; busto.rotation.z = Math.sin(T * 1.3) * 0.09; g.rotation.z = Math.sin(T * 1.3 + 1) * 0.03
    testa.rotation.y += Math.sin(T * 0.9) * 0.4; testa.rotation.z += Math.sin(T * 1.7) * 0.07 + ev.b * 0.15
    bocca.rotation.x += ev.b * 0.55; pu.rotation.x += ev.u > 0 ? ev.u * Math.PI * 2 : 0
    P.bracci[0].rotation.x += Math.sin(T * 1.6) * 0.1
  })
  return finisci(g)
}

// ══════════════════════════════════════ LA VESPA GIGANTE ══════════════════════════════════════
export function creaVespa (variante = 0) {
  const g = new THREE.Group()
  const giallo = M([0xf2b81c, 0xe4a01a, 0xd8c030][variante] ?? 0xf2b81c, { flatShading: false, roughness: 0.5 }), nero = M(0x1a1612, { flatShading: false, roughness: 0.5 })
  const ala = new THREE.MeshStandardMaterial({ color: 0xdfeaf2, transparent: true, opacity: 0.45, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false, emissive: 0x9fb8c8, emissiveIntensity: 0.2 })
  const alto = perno(g, 0, 0.5, 0)
  const testa = perno(alto, 0, 0.0, 0.3)
  sfera(testa, 0.13, giallo, 0, 0, 0, 1.05, 0.95, 0.95, 14)
  sfera(testa, 0.1, nero, 0, 0.0, 0.07, 1.0, 0.9, 0.7, 10)                                         // la mascherina nera
  sfera(testa, 0.05, giallo, 0, -0.07, 0.12, 1.2, 0.8, 0.8, 8)
  for (const s of [-1, 1]) {
    sfera(testa, 0.075, M(0x2a0d10, { flatShading: false, roughness: 0.15, metalness: 0.2 }), s * 0.095, 0.035, 0.05, 0.9, 1.15, 1, 12)           // occhi composti
    sfera(testa, 0.02, lucido(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 }), s * 0.11, 0.07, 0.11, 1, 1, 0.7, 6)
    const an = perno(testa, s * 0.04, 0.1, 0.1); an.rotation.set(-0.5, 0, s * -0.4); an.userData.s = s
    osso(an, [0, 0, 0], [0, 0.17, 0.03], 0.008, 0.006, nero, 4); osso(an, [0, 0.17, 0.03], [0, 0.26, 0.11], 0.006, 0.01, nero, 4)
    scatola(testa, 0.05, 0.015, 0.1, nero, s * 0.07, -0.09, 0.12).rotation.y = s * 0.4              // le mandibole
    cono(testa, 0.012, 0.06, M(0x6a3a1a), s * 0.04, -0.1, 0.19, 4).rotation.x = Math.PI / 2
  }
  const torace = perno(alto, 0, 0.0, 0.0)
  sfera(torace, 0.19, M(0x8a5a1a, { flatShading: false }), 0, 0.0, 0, 1, 0.95, 1.05, 14)
  sfera(torace, 0.15, nero, 0, 0.1, -0.02, 1.0, 0.5, 1.0, 10)
  for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; const c = cono(torace, 0.012, 0.045, M(0xe0b050), Math.cos(a) * 0.17, Math.sin(a) * 0.15, Math.sin(a * 2) * 0.1, 4); c.rotation.z = a - Math.PI / 2 }   // la peluria
  // l'addome a fasce gialle e nere, che si curva verso il basso, col pungiglione
  const addome = perno(alto, 0, 0.0, -0.17)
  const fasce = []
  for (let i = 0; i < 5; i++) {
    const r = 0.17 - Math.abs(i - 1.2) * 0.012 - i * 0.012
    const a = sfera(addome, r, i % 2 ? nero : giallo, 0, -i * 0.025, -i * 0.115, 1, 0.95, 1.05, 14); fasce.push(a)
  }
  const pung = cono(addome, 0.03, 0.22, M(0x2a2420, { metalness: 0.3, roughness: 0.4 }), 0, -0.2, -0.66, 5); pung.rotation.x = -2.3
  const goccia = sfera(addome, 0.022, luce(0xb8ff4a, 1.4), 0, -0.285, -0.74, 1, 1.3, 1, 6); goccia.castShadow = false
  // sei zampe sottili con l'uncino
  const zampe = []
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
    const an = perno(torace, s * 0.09, -0.12, 0.08 - k * 0.1); zampe.push(an)
    osso(an, [0, 0, 0], [s * 0.1, -0.1, 0.03 - k * 0.04], 0.012, 0.01, nero, 4); osso(an, [s * 0.1, -0.1, 0.03 - k * 0.04], [s * 0.15, -0.26, 0.07 - k * 0.04], 0.01, 0.006, nero, 4)
  }
  // quattro ali: le grandi sopra, le piccole sotto
  const ali = []
  for (const s of [-1, 1]) for (const [lung, off] of [[0.55, 0.05], [0.38, -0.08]]) {
    const p = perno(torace, s * 0.1, 0.14, off); const l = sfera(p, 0.5, ala, s * lung * 0.5, 0, 0, lung, 0.012, 0.25, 12); l.castShadow = false; p.userData = { s, lung }; ali.push(p)
    for (let v = 0; v < 3; v++) scatola(p, lung * 0.9, 0.004, 0.006, M(0x88a0b0), s * lung * 0.5, 0.01, -0.03 + v * 0.03).castShadow = false
  }
  g.userData.anima = t => {
    alto.position.y = 0.5 + onda(t, 2.2) * 0.04; alto.position.z = 0
    alto.rotation.x = 0.08 + onda(t, 1.5) * 0.03; alto.rotation.z = onda(t, 1.0) * 0.04
    ali.forEach((p, i) => { const f = onda(t, 70, (i >> 1) * 0.7) * 0.5; p.rotation.z = p.userData.s * (0.15 + f); p.rotation.y = p.userData.s * (i % 2 ? 0.7 : 0.1) })
    addome.rotation.x = 0.15 + onda(t, 2.0, 1) * 0.08
    zampe.forEach((z, i) => { z.rotation.x = onda(t, 2.5, i) * 0.1 })
    testa.rotation.y = onda(t, 0.9) * 0.2
  }
  dichiara(g, 'pungiglione', 0.7, 0.55)                                         // sale, poi si tuffa in picchiata con il pungiglione in avanti
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.55)
    alto.position.y += W * 0.2 - L * 0.32; alto.position.z += L * 0.6 - W * 0.12
    alto.rotation.x += -W * 0.5 + L * 0.9; addome.rotation.x += W * 0.4 - L * 1.3
  }
  vivo(g, T => {                                                                // ali sempre vibranti, deriva nell'aria; ogni ~4 s uno scatto di volo
    const ev = evento(T, 4.3, 0.55)
    alto.position.y += Math.sin(T * Math.PI * 1.4) * 0.05; alto.position.x = Math.sin(T * 0.9) * 0.06 + ev.b * 0.1; alto.rotation.y = Math.sin(T * 0.7) * 0.25
    alto.position.z += ev.b * 0.1; alto.rotation.x += -ev.b * 0.25; alto.rotation.z += Math.sin(T * 1.9) * 0.05
    addome.rotation.x += Math.sin(T * 3.2) * 0.07 - ev.b * 0.15
    zampe.forEach((z, i) => { z.rotation.x += Math.sin(T * 4 + i) * 0.12 })
  })
  return finisci(g)
}

// ══════════════════════════════════════ IL CINGHIALE ══════════════════════════════════════
export function creaCinghiale (variante = 0) {
  const g = new THREE.Group(), cap = variante === 1
  const pelo = M(cap ? 0x4a382c : 0x6a5240), scuro = M(0x2a211b), chiaro = M(0xa08a6a), rosa = M(0xc99088, { flatShading: false, roughness: 0.6 })
  const avorio = M(0xeee2c0, { roughness: 0.45 }), buio = M(NERO)
  const corpo = perno(g, 0, 0, 0)
  sfera(corpo, 0.5, pelo, 0, 0.55, -0.02, 0.62, 0.62, 1.32, 14)                                    // la botte
  sfera(corpo, 0.5, pelo, 0, 0.63, 0.34, 0.66, 0.7, 0.62, 12)                                      // le spalle massicce
  sfera(corpo, 0.5, chiaro, 0, 0.38, 0.0, 0.5, 0.3, 1.0, 10)                                       // il ventre
  for (let i = 0; i < 10; i++) { const z = 0.55 - i * 0.1; const c = cono(corpo, 0.045, 0.2 - i * 0.008, scuro, 0, 0.93 - Math.abs(i - 2) * 0.012, z, 4); c.rotation.x = -0.45 + i * 0.07 }   // la criniera
  for (let i = 0; i < 12; i++) { const a = i * 2.4; const c = cono(corpo, 0.03, 0.1, scuro, Math.cos(a) * 0.3, 0.6 + Math.sin(a) * 0.1, -0.4 + (i / 12) * 0.9, 4); c.rotation.z = -Math.cos(a) * 1.2; c.rotation.x = -0.2 }   // setole sui fianchi
  const testa = perno(corpo, 0, 0.62, 0.72)
  sfera(testa, 0.2, pelo, 0, 0.0, 0.0, 1.0, 0.95, 1.05, 12)
  const grugno = cil(testa, 0.095, 0.12, 0.28, M(0x5a4636), 0, -0.06, 0.26, 10); grugno.rotation.x = Math.PI / 2 - 0.12
  const disco = cil(testa, 0.1, 0.1, 0.04, rosa, 0, -0.08, 0.41, 12); disco.rotation.x = Math.PI / 2 - 0.12
  for (const s of [-1, 1]) {
    sfera(disco, 0.016, buio, s * 0.04, 0.025, 0.0, 1, 1, 1, 6)
    const o = sfera(testa, 0.026, cap ? luce(0xff4a2a, 1.6) : lucido(0x201410), s * 0.12, 0.06, 0.15, 1, 1, 0.8, 8); void o
    sfera(testa, 0.009, lucido(0xffffff), s * 0.126, 0.07, 0.17, 1, 1, 1, 4)
    scatola(testa, 0.1, 0.025, 0.04, scuro, s * 0.12, 0.115, 0.15).rotation.z = s * -0.35
    const orecchio = cono(testa, 0.08, 0.17, pelo, s * 0.14, 0.2, -0.03, 4); orecchio.rotation.set(0.0, 0, s * -0.35); orecchio.scale.z = 0.4
    // le zanne: cono che esce dal labbro e si curva in su
    const z1 = perno(testa, s * 0.075, -0.1, 0.34)
    osso(z1, [0, 0, 0], [s * 0.025, 0.0, 0.0], 0.026, 0.026, avorio, 6)
    punta(z1, [s * 0.025, 0, 0], [s * 0.07, 0.17 * (cap ? 1.4 : 1), 0.06], 0.026, avorio, 6)
  }
  const bocca = perno(testa, 0, -0.14, 0.2); bocca.userData.m = true
  sfera(bocca, 0.07, scuro, 0, -0.01, 0.05, 1.1, 0.4, 1.4, 8)
  // le zampe: quattro, con lo zoccolo spaccato
  const zampe = []
  for (const [z, gr] of [[0.4, 0.075], [-0.38, 0.085]]) for (const s of [-1, 1]) {
    const an = perno(corpo, s * 0.2, 0.55, z); zampe.push(an)
    osso(an, [0, 0, 0], [0, -0.45, 0.0], gr, gr * 0.7, pelo, 7)
    for (const k of [-1, 1]) cono(an, 0.03, 0.07, scuro, k * 0.022, -0.5, 0.0, 4).rotation.x = Math.PI
  }
  const coda = perno(corpo, 0, 0.74, -0.68); coda.rotation.x = 0.5
  osso(coda, [0, 0, 0], [0, 0.0, -0.1], 0.025, 0.02, pelo, 5); osso(coda, [0, 0, -0.1], [0, 0.06, -0.16], 0.02, 0.012, scuro, 5)
  sfera(coda, 0.03, scuro, 0, 0.1, -0.17, 1, 1, 1, 6)
  if (cap) {   // il caporale: cicatrici, collare chiodato, piastra di ferro sul garrese
    const rug = M(0x7a7f86, { metalness: 0.55, roughness: 0.5 }), rug2 = M(0x8a6a50, { metalness: 0.5, roughness: 0.55 })
    const col = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 6, 14), rug2); col.rotation.x = Math.PI / 2; col.position.set(0, -0.02, -0.02); col.castShadow = true; testa.add(col)
    col.position.set(0, 0, -0.1); col.scale.set(1.0, 1.0, 1.2)
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; cono(testa, 0.018, 0.07, rug, Math.cos(a) * 0.21, Math.sin(a) * 0.0, -0.1 + Math.sin(a) * 0.25, 4).rotation.z = -Math.cos(a) * Math.PI / 2 }
    const piastra = perno(corpo, 0, 0.98, 0.2)
    scatola(piastra, 0.34, 0.03, 0.34, rug, 0, 0, 0).rotation.x = 0.35
    for (const [x, z] of [[-0.12, -0.1], [0.12, -0.1], [-0.12, 0.1], [0.12, 0.1]]) sfera(piastra, 0.025, rug2, x, 0.03, z, 1, 1, 1, 6)
    for (let i = 0; i < 3; i++) scatola(testa, 0.012, 0.012, 0.16, M(0xc79b8e), -0.12, 0.08 - i * 0.03, 0.12).rotation.set(0.2, 0.3, 0.9)
    // un'ammaccatura del corno spezzato: la punta di una lancia conficcata sul fianco
    const lan = perno(corpo, 0.3, 0.7, -0.1); lan.rotation.z = -1.2
    cil(lan, 0.012, 0.012, 0.3, M(0x6e4a2c), 0, 0.12, 0, 5); cono(lan, 0.02, 0.07, rug, 0, 0.3, 0, 4)
    g.scale.setScalar(1.2)
  }
  g.userData.anima = t => {
    const r = onda(t, 2.4)
    corpo.scale.set(1 + r * 0.01, 1 + r * 0.02, 1); corpo.position.y = 0; corpo.rotation.x = 0; g.position.z = 0
    testa.rotation.set(0.12 + onda(t, 1.0) * 0.07 + Math.max(0, onda(t, 0.45)) * 0.1, onda(t, 0.6) * 0.18, 0)
    testa.position.y = 0.62 - Math.max(0, onda(t, 0.45)) * 0.05
    bocca.rotation.x = Math.max(0, onda(t, 2.8)) * 0.1
    coda.rotation.z = onda(t, 3.4) * 0.25
    zampe.forEach((z, i) => { z.rotation.x = (i === 1 ? onda(t, 1.1) * 0.08 : 0) })
  }
  dichiara(g, 'carica', 0.85, 0.6)                                              // raspa a terra, abbassa la testa, parte di carica e alza le zanne nella cornata
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.6), toss = p > 0.6 ? Math.sin((p - 0.6) / 0.4 * Math.PI) : 0
    g.position.z += L * 1.1 - W * 0.3; corpo.rotation.x += -W * 0.2 + L * 0.1
    testa.rotation.x += W * 0.45 + L * 0.6 - toss * 1.1
    zampe[0].rotation.x += -W * 0.9; zampe[1].rotation.x += -W * 0.3 + L * 0.2; zampe[2].rotation.x += W * 0.2 - L * 0.4; zampe[3].rotation.x += L * 0.4
  }
  vivo(g, T => {                                                                // respira pesante, sposta il peso; ogni ~5,5 s raspa la terra
    const ev = evento(T, 5.5, 1.8), scrape = Math.max(0, Math.sin(ev.u * Math.PI * 6))
    g.rotation.z = Math.sin(T * 1.1) * 0.035
    corpo.scale.y += Math.sin(T * 2.2) * 0.012; corpo.rotation.x += ev.b * 0.05
    testa.rotation.y += Math.sin(T * 0.7) * 0.3; testa.rotation.x += ev.b * 0.5 + Math.sin(T * 2.2) * 0.04
    zampe[0].rotation.x += -ev.b * 0.3 - scrape * 0.55 * ev.b; bocca.rotation.x += ev.b * 0.2
    coda.rotation.z += Math.sin(T * 5) * 0.22
  })
  return finisci(g)
}

// ══════════════════════════════════════ IL CORVO ══════════════════════════════════════
export function creaCorvo (variante = 0) {
  const g = new THREE.Group()
  const pen = M(variante === 1 ? 0x3a3a52 : 0x20222f, { roughness: 0.4, metalness: 0.2, emissive: 0x0e1430, emissiveIntensity: 0.6 })
  const pen2 = M(0x2e3350, { roughness: 0.35, metalness: 0.25, emissive: 0x10183a, emissiveIntensity: 0.5 }), becco = M(0x8a8478, { roughness: 0.4 }), zampa = M(0x2a241f)
  const corpo = perno(g, 0, 0.17, 0); corpo.rotation.x = -0.45
  sfera(corpo, 0.5, pen, 0, 0.0, 0, 0.23, 0.25, 0.6, 12)
  sfera(corpo, 0.5, pen2, 0, -0.04, 0.05, 0.2, 0.2, 0.34, 10)
  const testa = perno(corpo, 0, 0.15, 0.2); testa.rotation.x = 0.45
  sfera(testa, 0.075, pen, 0, 0, 0, 1, 1, 1.05, 12)
  const bec = cono(testa, 0.04, 0.17, becco, 0, -0.005, 0.15, 5); bec.rotation.x = Math.PI / 2; bec.scale.y = 1; bec.scale.z = 0.8
  const bec2 = cono(testa, 0.03, 0.13, M(0x2a2622), 0, -0.032, 0.13, 5); bec2.rotation.x = Math.PI / 2
  for (const s of [-1, 1]) {
    const o = sfera(testa, 0.019, lucido(0xe8a830, { emissive: 0x6a4000, emissiveIntensity: 0.6 }), s * 0.06, 0.02, 0.05, 1, 1, 0.8, 8); void o
    sfera(testa, 0.009, lucido(NERO), s * 0.066, 0.02, 0.062, 1, 1, 1, 6); sfera(testa, 0.004, lucido(0xffffff), s * 0.07, 0.027, 0.07, 1, 1, 1, 4)
  }
  const ali = []
  for (const s of [-1, 1]) {
    const al = perno(corpo, s * 0.12, 0.02, 0.0); ali.push(al)
    sfera(al, 0.5, pen2, s * 0.02, -0.04, -0.2, 0.055, 0.26, 0.66, 10)
    for (let k = 0; k < 4; k++) { const p = cono(al, 0.03, 0.2, pen2, s * 0.03, -0.17 - k * 0.012, -0.34 - k * 0.04, 4); p.rotation.set(0.0, 0, 0.0); p.rotation.x = -2.9 }
  }
  const coda = perno(corpo, 0, -0.02, -0.25); coda.rotation.x = 0.1
  for (let k = -1; k <= 1; k++) { const p = cono(coda, 0.045, 0.3, pen2, k * 0.035, 0, -0.1, 4); p.rotation.set(-Math.PI / 2 - 0.1, 0, k * 0.25); p.scale.z = 0.3 }
  const zampe = []
  for (const s of [-1, 1]) {
    const z = perno(g, s * 0.05, 0.16, 0.0); zampe.push(z)
    osso(z, [0, 0, 0], [0, -0.1, 0.01], 0.012, 0.01, zampa, 5)
    for (let k = -1; k <= 1; k++) punta(z, [0, -0.1, 0.01], [k * 0.025, -0.158, 0.075], 0.006, zampa, 4)
    punta(z, [0, -0.1, 0.01], [0, -0.155, -0.04], 0.006, zampa, 4)
  }
  g.userData.anima = t => {
    const c = (t * 0.7) % 4, scatta = c < 0.25 ? Math.sin(c / 0.25 * Math.PI) : 0
    testa.rotation.set(0.45 + onda(t, 0.9) * 0.05, onda(t, 1.2) * 0.2 + Math.sign(onda(t, 0.55)) * 0.45 * liscio(-0.2, 0.2, onda(t, 0.55)), onda(t, 0.7) * 0.12)
    corpo.position.y = 0.17 + Math.abs(onda(t, 1.3)) * 0.008; corpo.scale.set(1 + onda(t, 4) * 0.01, 1 + onda(t, 4) * 0.015, 1)
    ali.forEach((a, i) => { const s = i ? 1 : -1; a.rotation.z = s * -(0.06 + scatta * 1.2); a.rotation.y = s * scatta * 0.3 })
    coda.rotation.x = 0.1 + onda(t, 1.5) * 0.06; corpo.rotation.x = -0.45; corpo.position.z = 0; g.position.z = 0
  }
  dichiara(g, 'becco', 0.5, 0.5)                                               // spalanca le ali, getta indietro la testa e picchia col becco
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.5)
    corpo.rotation.x += -W * 0.35 + L * 0.8; corpo.position.z += -W * 0.04 + L * 0.2; g.position.z += L * 0.12
    corpo.position.y += W * 0.05
    testa.rotation.x += -W * 0.4 + L * 0.6
    ali.forEach((a, i) => { a.rotation.z += (i ? 1 : -1) * -(W * 1.0 + L * 0.35) })
  }
  vivo(g, T => {                                                                // saltella, guarda a scatti; becchetta ogni ~4,8 s e si scuote le piume ogni ~7 s
    const ev = evento(T, 3.6, 1.2), sc = evento(T, 6.1, 0.8, 2), peck = Math.sin(ev.u * Math.PI * 3) ** 2 * ev.b
    corpo.position.y += Math.abs(Math.sin(T * Math.PI * 1.3)) * 0.028
    corpo.rotation.x += peck * 0.45 + Math.sin(T * 2.6) * 0.07; testa.rotation.x += peck * 0.9; testa.rotation.y += Math.sin(T * 1.7) * 0.45; corpo.rotation.z = Math.sin(T * 38) * 0.14 * sc.b
    ali.forEach((a, i) => { a.rotation.z += (i ? 1 : -1) * -(Math.sin(T * 30) * 0.2 * sc.b + Math.sin(T * 2) * 0.03) })
    coda.rotation.x += Math.sin(T * 2.4) * 0.1 + peck * 0.3
  })
  return finisci(g)
}

// ══════════════════════════════════════ L'ORCO ══════════════════════════════════════
export function creaOrco (variante = 0) {
  const pelle = [0x6f8a45, 0x8a7a50, 0x4f6a52][variante] ?? 0x6f8a45
  const P = umanoide({ pelle, veste: 0x5a3a28, calzoni: 0x3f3226, scarpa: 0x2a2018, gamba: 0.52, busto: [0.64, 0.62, 0.4], testa: 0.29, braccio: 0.54, gr: 0.115, sg: 0.12, maniche: false })
  const { g, busto, testa } = P
  const avorio = M(0xeee2c0), buio = M(NERO), rug = M(0x7a7f86, { metalness: 0.55, roughness: 0.5 }), ruggine = M(0x8a6a50, { metalness: 0.5, roughness: 0.55 }), cuoio = M(0x4a3426), pelo = M(0x3b2f27)
  busto.rotation.x = 0.2
  // pancia e petto: una cinghia di cuoio e il cranio trofeo
  sfera(busto, 0.5, M(pelle), 0, 0.2, 0.09, 0.55, 0.32, 0.4, 10)
  const cint = scatola(busto, 0.7, 0.07, 0.46, cuoio, 0, 0.1, 0); void cint
  scatola(busto, 0.08, 0.08, 0.04, rug, 0, 0.1, 0.23)
  const tro = perno(busto, 0.2, 0.08, 0.22); tro.rotation.z = 0.2
  sfera(tro, 0.06, M(0xe9dcc0), 0, -0.07, 0, 1, 1.05, 1, 8); scatola(tro, 0.05, 0.035, 0.04, buio, 0, -0.1, 0.03)
  const pel = scatola(busto, 0.06, 0.4, 0.015, cuoio, 0.12, 0.38, 0.2); pel.rotation.z = -0.55
  // pelliccia sul bacino
  for (let i = -3; i <= 3; i++) { const c = cono(busto, 0.06, 0.22, pelo, i * 0.09, -0.04, 0.17 - Math.abs(i) * 0.015, 4); c.rotation.x = Math.PI }
  // la testa: mascella pesante, zanne, sopracciglia, naso schiacciato, cresta e orecchie a punta
  for (const s of [-1, 1]) {
    occhio(testa, s * 0.1, 0.06, 0.2, 0.046, 0xe8a830, 0xf4e8c0, 0.0)
    const so = scatola(testa, 0.17, 0.05, 0.08, M(pelle), s * 0.1, 0.13, 0.2); so.rotation.z = s * -0.38; so.rotation.y = s * 0.0
    scatola(testa, 0.17, 0.018, 0.04, buio, s * 0.1, 0.107, 0.225).rotation.z = s * -0.38
    punta(testa, [s * 0.26, 0.05, -0.02], [s * 0.45, 0.1, -0.2], 0.06, M(pelle), 5)
  }
  sfera(testa, 0.06, M(pelle), 0, -0.04, 0.25, 1.3, 0.8, 0.8, 8)
  for (const s of [-1, 1]) sfera(testa, 0.013, buio, s * 0.03, -0.055, 0.3, 1, 1, 0.6, 5)
  const mand = perno(testa, 0, -0.14, 0.05)
  sfera(mand, 0.15, M(pelle), 0, -0.02, 0.1, 1.15, 0.55, 1.0, 12)
  sfera(mand, 0.1, buio, 0, 0.06, 0.15, 1.2, 0.35, 0.8, 8)
  for (const s of [-1, 1]) { cono(mand, 0.03, 0.15 + (variante ? 0.03 : 0), avorio, s * 0.1, 0.07, 0.19, 5); for (let k = 0; k < 2; k++) cono(mand, 0.014, 0.05, avorio, s * (0.04 + k * 0.03), 0.07, 0.24, 4).rotation.x = Math.PI }
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.2, 4), pelo)
  for (let i = 0; i < 5; i++) cono(testa, 0.04, 0.17 - Math.abs(i - 2) * 0.03, pelo, 0, 0.28, 0.12 - i * 0.07, 4).rotation.x = -0.15 - i * 0.05
  void crest
  for (const [x, y] of [[-0.12, 0.2]]) { const c = scatola(testa, 0.015, 0.012, 0.15, M(0xc79b8e), x, y, 0.22); c.rotation.set(0.2, 0.3, 1.0) }   // cicatrice
  // la spalla destra con lo spallaccio di ferro chiodato
  const pa = perno(P.bracci[1], 0.0, 0.02, 0)
  const sp = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), rug); sp.scale.set(1.15, 1, 1.15); sp.castShadow = true; sp.position.y = 0.0; pa.add(sp)
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; cono(pa, 0.025, 0.12, ruggine, Math.cos(a) * 0.09, 0.14, Math.sin(a) * 0.09, 4).rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4) }
  const bracc = cil(P.gomiti[0], 0.125, 0.12, 0.1, cuoio, 0, -0.12, 0, 8); void bracc
  // la mazza chiodata
  const mazza = perno(P.mani[1], 0, 0, 0); mazza.rotation.x = 1.4
  cil(mazza, 0.03, 0.035, 0.7, M(0x6e4a2c), 0, 0.15, 0, 7)
  const testaM = sfera(mazza, 0.13, M(0x6e4a2c), 0, 0.55, 0, 1, 1.35, 1, 9); void testaM
  for (let i = 0; i < 9; i++) { const a = i * 2.4, y = 0.45 + (i % 3) * 0.1; punta(mazza, [Math.cos(a) * 0.1, y, Math.sin(a) * 0.1], [Math.cos(a) * 0.2, y, Math.sin(a) * 0.2], 0.026, rug, 4) }
  g.userData.anima = t => {
    const r = onda(t, 1.7)
    busto.rotation.x = 0.2 + r * 0.02; busto.rotation.z = onda(t, 0.8) * 0.025; busto.scale.set(1 + r * 0.012, 1 + r * 0.018, 1)
    testa.rotation.set(0.08 + onda(t, 0.7) * 0.04, onda(t, 0.4) * 0.22, onda(t, 0.9) * 0.03)
    mand.rotation.x = 0.04 + Math.max(0, onda(t, 1.1)) * 0.1
    P.bracci[1].rotation.set(-0.45 + onda(t, 1.4) * 0.04, 0, -0.12); P.gomiti[1].rotation.x = -0.6
    P.bracci[0].rotation.set(-0.25 + onda(t, 1.3, 1) * 0.04, 0, 0.18); P.gomiti[0].rotation.x = -0.35
    P.gambe[0].rotation.x = -0.06; P.gambe[1].rotation.x = 0.06
    mazza.rotation.x = 1.3 + onda(t, 1.4) * 0.03; busto.rotation.y = 0; g.position.z = 0
  }
  dichiara(g, 'colpo-arma', 0.9, 0.55)                                          // la mazza sopra la testa, poi giù con tutto il peso
  g.userData.attacca = p => {
    const { s, W, L } = ritmo(p, 0.55)
    P.bracci[1].rotation.x += -2.1 * W + 0.35 * L; P.gomiti[1].rotation.x += 0.3 * W
    P.bracci[0].rotation.x += -0.6 * W - 0.3 * L
    busto.rotation.x += -W * 0.2 + L * 0.4; busto.rotation.y += -s * 0.4; testa.rotation.x += s * 0.15
    mand.rotation.x += W * 0.35 + L * 0.2; g.position.z += L * 0.35
  }
  g.scale.setScalar(0.78)
  vivo(g, T => {                                                                // ondeggia pesante; ogni ~6,5 s pesa la mazza e sbuffa
    const ev = evento(T, 6.5, 1.8), bob = Math.abs(Math.sin(T * Math.PI * 1.1))
    busto.position.y = 0.52 + bob * 0.05; busto.rotation.z += Math.sin(T * 0.9) * 0.05; busto.rotation.y = Math.sin(T * 0.5) * 0.08
    g.rotation.z = Math.sin(T * 0.9 + 1) * 0.025; busto.scale.y += ev.b * 0.04
    testa.rotation.y += Math.sin(T * 0.6) * 0.3; testa.rotation.x += -ev.b * 0.2
    P.bracci[1].rotation.x += -ev.b * 0.5 + Math.sin(ev.u * Math.PI * 4) * 0.15 * ev.b; mazza.rotation.x += ev.b * 0.2
    mand.rotation.x += ev.b * 0.3 + Math.max(0, Math.sin(T * 1.5)) * 0.06
  })
  return finisci(g)
}

// ══════════════════════════════════════ LO SPAVENTAPASSERI VIVO ══════════════════════════════════════
export function creaSpaventapasseri (variante = 0) {
  const g = new THREE.Group()
  const paglia = M(0xe0c060), paglia2 = M(0xb89a40), tela = M(0xcbb58a), toppa = M(0x7a4a2c), camicia = M([0x7a3a2c, 0x3a5a7a, 0x4a4a32][variante] ?? 0x7a3a2c), legno = M(0x6e4a2c), corda = M(0x8a7a52, { flatShading: false })
  const buio = M(NERO), cappello = M(0x3a2c24), arancio = luce(0xffa21a, 2.4, { flatShading: false })
  const busto = perno(g, 0, 0.55, 0)
  // il palo e la traversa dietro la schiena: braccia stese sopra
  cil(g, 0.04, 0.05, 1.55, legno, 0, 0.78, -0.17, 7)
  const traversa = scatola(g, 1.2, 0.07, 0.07, legno, 0, 1.02, -0.17); traversa.rotation.z = 0.0
  for (const x of [-0.42, 0.42]) cil(g, 0.045, 0.045, 0.045, corda, x, 1.02, -0.17, 8).rotation.z = Math.PI / 2
  cil(g, 0.058, 0.058, 0.05, corda, 0, 1.02, -0.17, 8)
  // busto di sacco imbottito di paglia, camicia a toppe
  sfera(busto, 0.5, camicia, 0, 0.26, 0, 0.5, 0.62, 0.34, 12)
  sfera(busto, 0.5, M(0x4a3a2a), 0, -0.02, 0, 0.5, 0.2, 0.34, 10)
  for (const [x, y, w] of [[0.1, 0.26, 0.12], [-0.12, 0.14, 0.1], [0.09, 0.06, 0.08]]) { const t = scatola(busto, w, w * 0.9, 0.02, [toppa, tela][(x > 0) | 0], x, y, 0.17); t.rotation.z = x * 3 }
  for (let i = 0; i < 6; i++) scatola(busto, 0.02, 0.012, 0.01, buio, -0.08 + (i % 3) * 0.045, 0.2 + (i / 3 | 0) * 0.03, 0.18)   // punti di filo
  for (let i = 0; i < 9; i++) { const c = cono(busto, 0.02, 0.17 + (i % 3) * 0.04, paglia, -0.16 + i * 0.04, -0.05, 0.1 + (i % 2) * 0.05, 4); c.rotation.set(0.1 + (i % 3) * 0.15, 0, (i - 4) * 0.07); c.rotation.x += Math.PI }   // paglia che esce dall'orlo
  const colletto = []
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI; const c = cono(busto, 0.02, 0.12, paglia, Math.cos(a) * 0.16, 0.56, Math.sin(a) * 0.1 + 0.02, 4); c.rotation.set(0.3, 0, -Math.cos(a) * 0.8); colletto.push(c) }
  // la testa: sacco di tela con la faccia cucita, occhi che brillano, cappello bucato
  const testa = perno(busto, 0, 0.72, 0.0)
  sfera(testa, 0.2, tela, 0, 0, 0, 1, 1.05, 1, 14)
  cono(testa, 0.08, 0.1, tela, 0, 0.21, 0, 6).rotation.z = 0.25                                    // il nodo in cima al sacco
  for (const s of [-1, 1]) {
    const o = sfera(testa, 0.05, arancio, s * 0.085, 0.04, 0.175, 1, 1.1, 0.6, 10); o.castShadow = false
    sfera(testa, 0.028, luce(0xfff0a0, 3), s * 0.085, 0.04, 0.195, 1, 1.2, 0.6, 8).castShadow = false
    const so = scatola(testa, 0.1, 0.025, 0.02, buio, s * 0.09, 0.11, 0.18); so.rotation.z = s * 0.4
    scatola(testa, 0.012, 0.07, 0.01, buio, s * 0.085, -0.03, 0.19)
  }
  const nasoT = cono(testa, 0.03, 0.07, tela, 0, -0.03, 0.2, 4); nasoT.rotation.x = Math.PI / 2 + 0.2
  const bocca = new THREE.Group(); bocca.position.set(0, -0.1, 0.18); testa.add(bocca)
  for (let i = 0; i < 7; i++) { const x = -0.09 + i * 0.03; scatola(bocca, 0.012, 0.045, 0.012, buio, x, i % 2 ? 0.0 : -0.01, 0.0) }
  scatola(bocca, 0.2, 0.012, 0.012, buio, 0, 0.022, 0.0); scatola(bocca, 0.2, 0.012, 0.012, buio, 0, -0.03, 0.0)
  for (let i = 0; i < 5; i++) cono(testa, 0.022, 0.12, paglia2, -0.18 + i * 0.09, 0.09 - Math.abs(i - 2) * 0.015, -0.03, 4).rotation.set(0, 0, (i - 2) * -0.35 + (i < 2 ? 0.2 : 0))   // ciuffi dal collo e dai lati
  const cap = perno(testa, 0, 0.15, 0.0); cap.rotation.z = 0.12
  cil(cap, 0.36, 0.34, 0.025, cappello, 0, 0.0, 0, 14).scale.z = 0.95
  cil(cap, 0.15, 0.19, 0.2, cappello, 0, 0.11, 0, 12)
  cil(cap, 0.195, 0.195, 0.04, M(0x8a2a22), 0, 0.045, 0, 12)
  scatola(cap, 0.12, 0.1, 0.02, M(0x6a4a3a), 0.1, 0.12, 0.15).rotation.z = 0.2
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; cono(cap, 0.025, 0.1, paglia2, Math.cos(a) * 0.32, -0.04, Math.sin(a) * 0.3, 4).rotation.x = Math.PI }
  // braccia: stecche di legno e maniche con paglia ai polsi, stese sulla traversa e appena mosse
  const bracci = [], mani = []
  for (const s of [-1, 1]) {
    const sp = perno(busto, s * 0.2, 0.45, -0.02); bracci.push(sp)
    const lun = 0.46
    osso(sp, [0, 0, 0], [s * lun, 0, 0], 0.045, 0.04, camicia, 7)
    const ma = perno(sp, s * lun, 0, 0); mani.push(ma)
    for (let k = -2; k <= 2; k++) { const c = cono(ma, 0.014, 0.14, paglia, s * 0.04, 0.0, k * 0.03, 4); c.rotation.z = -s * Math.PI / 2 + k * 0.12 * s }
    cil(ma, 0.05, 0.05, 0.03, corda, -s * 0.01, 0, 0, 8).rotation.z = Math.PI / 2
    scatola(sp, 0.1, 0.1, 0.02, toppa, s * 0.25, 0.0, 0.05)
  }
  // le gambe: bastoni infilati negli stivali sfondati
  const gambe = []
  for (const s of [-1, 1]) {
    const an = perno(g, s * 0.1, 0.57, 0); gambe.push(an)
    osso(an, [0, 0, 0], [0, -0.45, 0], 0.045, 0.04, M(0x4a3a2a), 6)
    cil(an, 0.075, 0.085, 0.13, M(0x3a2a20), 0, -0.5, 0.02, 8); scatola(an, 0.14, 0.05, 0.22, M(0x3a2a20), 0, -0.55, 0.05)
    for (let k = -1; k <= 1; k++) cono(an, 0.014, 0.1, paglia, k * 0.035, -0.4, 0.05, 4).rotation.x = Math.PI - 0.3
  }
  // il corvo sulla spalla
  const corvo = creaCorvo(); corvo.scale.setScalar(0.62); corvo.position.set(-0.27, 0.5, 0.02); corvo.rotation.y = 0.5; busto.add(corvo)
  g.userData.anima = t => {
    const r = onda(t, 1.2)
    busto.rotation.set(0.02 + r * 0.01, 0, onda(t, 0.55) * 0.04); busto.position.y = 0.55 + r * 0.004
    testa.rotation.set(0.05 + onda(t, 0.8) * 0.04, onda(t, 0.35) * 0.35, onda(t, 0.6) * 0.1 + 0.08)
    bracci.forEach((b, i) => { b.rotation.z = (i ? 1 : -1) * onda(t, 0.9, i * 1.4) * 0.05 + (i ? 1 : -1) * -0.04; b.rotation.x = onda(t, 1.1, i) * 0.04; b.rotation.y = 0 })
    mani.forEach((m, i) => { m.rotation.z = onda(t, 2.1, i) * 0.15 })
    gambe.forEach((z, i) => { z.rotation.x = onda(t, 0.7, i * Math.PI) * 0.04 })
    colletto.forEach((c, i) => { c.rotation.x = 0.3 + onda(t, 2.0, i) * 0.05 })
    corvo.userData.anima(t * 0.8 + 3); g.position.z = 0
    for (const o of [testa]) o.children.forEach(c => { if (c.material && c.material.emissiveIntensity > 2) c.material.emissiveIntensity = 2.4 + onda(t, 6) * 0.5 })
  }
  dichiara(g, 'zampata', 0.8, 0.55)                                             // le braccia di paglia si alzano in alto e falciano in avanti
  g.userData.attacca = p => {
    const { s, W, L } = ritmo(p, 0.55)
    bracci.forEach((b, i) => { const sg = i ? 1 : -1; b.rotation.z += sg * 1.1 * W - sg * 0.9 * L; b.rotation.y += -sg * 1.2 * L })
    busto.rotation.x += s * 0.3; testa.rotation.x += s * 0.2; g.position.z += L * 0.22
  }
  g.scale.setScalar(0.72)
  vivo(g, T => {                                                                // dondola nel vento; ogni ~6 s una folata
    const ev = evento(T, 6, 1.8)
    g.rotation.z = Math.sin(T * 0.8) * 0.05 + Math.sin(T * 1.9) * 0.02 + ev.b * 0.1 * Math.sin(ev.u * Math.PI * 2)
    busto.position.y += Math.abs(Math.sin(T * Math.PI * 1.2)) * 0.025; busto.rotation.z += Math.sin(T * 1.2) * 0.04
    testa.rotation.z += Math.sin(T * 1.4) * 0.08 + ev.b * 0.22; testa.rotation.y += Math.sin(T * 0.5) * 0.25
    bracci.forEach((b, i) => { b.rotation.z += Math.sin(T * 1.7 + i * 1.3) * 0.12 + ev.b * 0.15 * (i ? 1 : -1) })
    colletto.forEach((c, i) => { c.rotation.x += Math.sin(T * 6 + i) * 0.1 * (0.4 + ev.b) })
  })
  return finisci(g)
}

// ══════════════════════════════════════ LA MELMA ROSA ══════════════════════════════════════
export function creaMelmaRosa () {
  const g = creaMelma(0xf06aa8)
  const guscio = g.children[0], dentro = g.children[1]
  guscio.material.emissive.set(0xa02a68); guscio.material.emissiveIntensity = 0.4
  g.traverse(o => {                                                                                // via il verde, via le ossa e le monete
    if (!o.isMesh || !o.material) return
    if (o.material.color && o.material.color.getHex() === 0x1d6a2c) { o.material = o.material.clone(); o.material.color.set(0x8a1f55) }
    if (o.material.color && o.material.color.getHex() === 0xcfffd0) { o.material = o.material.clone(); o.material.color.set(0xffd8ea) }
  })
  while (dentro.children.length) dentro.remove(dentro.children[0])
  const frutta = []
  const mela = perno(dentro, 0.18, 0.04, 0.05); frutta.push(mela)
  sfera(mela, 0.1, M(0xd8302a, { flatShading: false, roughness: 0.3, emissive: 0x5a0a08, emissiveIntensity: 0.4 }), 0, 0, 0, 1, 0.92, 1, 14)
  cil(mela, 0.008, 0.008, 0.06, M(0x4a3020), 0, 0.1, 0, 5); sfera(mela, 0.03, M(0x4a9a3a, { flatShading: false }), 0.035, 0.11, 0, 1.6, 0.35, 0.8, 8)
  const pera = perno(dentro, -0.22, -0.05, 0.0); frutta.push(pera); pera.rotation.z = 0.5
  sfera(pera, 0.09, M(0xc8d040, { flatShading: false, roughness: 0.4, emissive: 0x3a4000, emissiveIntensity: 0.4 }), 0, -0.04, 0, 1, 1, 1, 12); sfera(pera, 0.058, M(0xc8d040, { flatShading: false, roughness: 0.4, emissive: 0x3a4000, emissiveIntensity: 0.4 }), 0, 0.07, 0, 1, 1.2, 1, 10)
  for (const [x, z] of [[0.0, 0.18], [0.08, 0.2]]) { const c = perno(dentro, x - 0.1, -0.12, z - 0.0); frutta.push(c); sfera(c, 0.045, M(0xa0102a, { flatShading: false, roughness: 0.2, emissive: 0x500010, emissiveIntensity: 0.5 }), 0, 0, 0, 1, 1, 1, 10); cil(c, 0.005, 0.005, 0.14, M(0x4a8a3a), 0.02, 0.1, 0, 4).rotation.z = -0.3 }
  const uva = perno(dentro, 0.0, 0.12, -0.15); frutta.push(uva)
  for (let i = 0; i < 7; i++) sfera(uva, 0.038, M(0x6a2a8a, { flatShading: false, roughness: 0.25, emissive: 0x200a30, emissiveIntensity: 0.5 }), (i % 3 - 1) * 0.045, -((i / 3) | 0) * 0.05, ((i * 5) % 3 - 1) * 0.02, 1, 1, 1, 8)
  dentro.scale.setScalar(1.45)
  const nucleo = sfera(dentro, 0.1, luce(0xffc0e0, 1.6), 0, 0.0, 0, 1, 1, 1, 10); nucleo.castShadow = false
  // un picciolo di foglia incollato al capo, come un cappellino
  const foglia = perno(g, 0.18, 1.1, 0.0); foglia.rotation.set(0.1, 0, -0.5)
  sfera(foglia, 0.1, M(0x4a9a3a, { flatShading: false }), 0, 0.05, 0, 0.5, 1.3, 0.2, 8)
  cil(foglia, 0.01, 0.014, 0.1, M(0x4a3020), 0, 0.0, 0, 5)
  const base = g.userData.anima
  const faccia = g.children[2]
  g.userData.anima = t => { base(t); frutta.forEach((f, i) => { f.rotation.z += 0.0; f.rotation.x = onda(t, 1.1, i) * 0.2 }); g.scale.set(1, 1, 1); g.position.z = 0; faccia.scale.setScalar(1); faccia.position.z = 0.5 }
  dichiara(g, 'sputo', 0.7, 0.5, { tipo: 'sputo', origine: marcatore(g, 0, 0.55, 0.65) })   // si schiaccia, poi si gonfia in avanti e sputa
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.5)
    g.scale.x *= 1 + W * 0.25 - L * 0.12; g.scale.y *= 1 - W * 0.3 + L * 0.2; g.scale.z *= 1 + W * 0.2 + L * 0.25; g.position.z += -W * 0.1 + L * 0.22
    faccia.scale.multiplyScalar(1 + L * 0.3); faccia.position.z += L * 0.12
  }
  vivo(g, T => {                                                                // sobbalza, si gonfia; ogni ~5 s un balzello
    const ev = evento(T, 5, 1.3), sq = Math.sin(T * 8.2)
    g.scale.set(1 - 0.03 * sq + ev.b * 0.1, 1 + 0.07 * sq - ev.b * 0.05, 1 - 0.03 * sq + ev.b * 0.1)
    g.position.y = Math.abs(Math.sin(ev.u * Math.PI * 2)) * 0.1 * (ev.b > 0 ? 1 : 0)
    faccia.rotation.z = Math.sin(T * 1.5) * 0.06 + ev.b * 0.1
  })
  return finisci(g)
}

// ══════════════════════════════════════ IL MOSTRO DEL MULINO ══════════════════════════════════════
export function creaSaccoDelMulino () {
  const g = new THREE.Group()
  const tela = M(0xd8c8a0), tela2 = M(0xbaa77a), farina = M(0xfbf7ee, { roughness: 1 }), buio = M(NERO), legno = M(0x6e4a2c), corda = M(0x8a7a52, { flatShading: false })
  const corpo = perno(g, 0, 0.2, 0)
  const gonfio = sfera(corpo, 0.5, tela, 0, 0.36, 0, 0.62, 0.7, 0.54, 16)
  sfera(corpo, 0.5, tela2, 0, 0.12, 0, 0.58, 0.28, 0.52, 12)
  // le pieghe e le toppe di un sacco vecchio
  for (const [x, y, r, c] of [[0.2, 0.3, 0.08, 0x8a5a3a], [-0.22, 0.18, 0.07, 0x7a6a8a]]) { const t = scatola(corpo, r * 2, r * 1.6, 0.02, M(c), x, y, 0.255); t.rotation.z = x * 3; t.rotation.y = -x }
  for (let i = 0; i < 4; i++) scatola(corpo, 0.012, 0.1, 0.01, buio, 0.2 - 0.0, 0.26 + i * 0.012, 0.0 + 0.265).position.x = 0.12 + i * 0.03
  // la bocca del sacco, legata in alto con la corda, e la stoffa che sfrangia
  cil(corpo, 0.13, 0.2, 0.16, tela, 0, 0.88, 0, 9)
  cil(corpo, 0.14, 0.14, 0.04, corda, 0, 0.93, 0, 9)
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const c = cono(corpo, 0.05, 0.22, tela, Math.cos(a) * 0.1, 1.04, Math.sin(a) * 0.1, 4); c.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); c.scale.z = 0.35 }
  // il viso
  const faccia = perno(corpo, 0, 0.45, 0.26)
  for (const s of [-1, 1]) {
    occhio(faccia, s * 0.14, 0.07, 0.0, 0.085, 0x1a1410, 0xffffff, 0.0).scale.set(1, 1.1, 1)
    const so = scatola(faccia, 0.17, 0.04, 0.03, buio, s * 0.14, 0.2, 0.04); so.rotation.z = s * 0.45
  }
  const bocca = perno(faccia, 0, -0.1, 0.0)
  sfera(bocca, 0.11, buio, 0, 0, 0, 1.2, 0.7, 0.35, 10)
  for (let i = 0; i < 4; i++) cono(bocca, 0.022, 0.06, M(0xcdb88a), -0.075 + i * 0.05, 0.05, 0.03, 4).rotation.x = Math.PI
  // le braccia di stoffa, i guanti, e la pala del mulino in pugno
  const bracci = []
  for (const s of [-1, 1]) {
    const sp = perno(corpo, s * 0.3, 0.5, 0.0); bracci.push(sp)
    osso(sp, [0, 0, 0], [s * 0.1, -0.2, 0.05], 0.075, 0.06, tela, 8); sfera(sp, 0.085, tela2, s * 0.12, -0.24, 0.07, 1, 1, 1, 8)
    for (const k of [-1, 0, 1]) cono(sp, 0.018, 0.06, M(0xefe2c0), s * 0.12 + k * 0.03, -0.29, 0.1, 4).rotation.x = Math.PI
  }
  const pala = perno(bracci[1], 0.12, -0.24, 0.08); pala.rotation.set(-1.2, 0, 0.1)
  cil(pala, 0.025, 0.03, 0.8, legno, 0, 0.2, 0, 6)
  scatola(pala, 0.26, 0.34, 0.025, M(0x8a6a42), 0, 0.72, 0)
  for (const x of [-0.06, 0.06]) scatola(pala, 0.015, 0.34, 0.03, M(0x4a3426), x, 0.72, 0.004)
  sfera(pala, 0.03, farina, 0.06, 0.8, 0.02, 1.4, 0.5, 1, 6)
  // le gambe corte negli zoccoli
  const gambe = []
  for (const s of [-1, 1]) {
    const an = perno(g, s * 0.16, 0.22, 0.0); gambe.push(an)
    cil(an, 0.055, 0.06, 0.16, tela2, 0, -0.07, 0, 8)
    const zoc = sfera(an, 0.1, M(0x7a5a38), 0, -0.17, 0.05, 0.9, 0.55, 1.6, 8); void zoc
  }
  // la farina: una crosta bianca sulle spalle e una nuvola che esce dal sacco
  for (const [x, z] of [[0.18, 0.1], [-0.2, -0.05], [0.0, 0.18]]) sfera(corpo, 0.12, farina, x, 0.74, z, 1.2, 0.3, 1, 8)
  const polvere = []
  const matPol = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, roughness: 1, depthWrite: false, emissive: 0xffffff, emissiveIntensity: 0.6 })
  for (let i = 0; i < 9; i++) { const p = sfera(g, 0.03 + (i % 3) * 0.012, matPol, 0, 0, 0, 1, 1, 1, 8); p.castShadow = false; polvere.push(p) }
  g.userData.anima = t => {
    const r = onda(t, 1.9)
    corpo.scale.set(1 + r * 0.015, 1 - r * 0.02, 1 + r * 0.015)
    corpo.rotation.z = onda(t, 0.9) * 0.04; corpo.position.y = 0.2 + Math.abs(onda(t, 1.9)) * 0.006
    faccia.rotation.y = onda(t, 0.7) * 0.15; corpo.rotation.x = 0; g.position.z = 0
    bocca.scale.set(1, 1 + Math.max(0, onda(t, 1.5)) * 0.4, 1)
    bracci[0].rotation.z = -0.06 + onda(t, 1.6) * 0.05; bracci[1].rotation.x = onda(t, 1.4) * 0.05
    pala.rotation.x = -1.2 + onda(t, 1.4) * 0.04
    polvere.forEach((p, i) => { const u = (t * 0.25 + i / 9) % 1; p.position.set(Math.cos(i * 2.3) * (0.1 + u * 0.3), 1.1 + u * 0.55, Math.sin(i * 2.3) * (0.1 + u * 0.25)); p.scale.setScalar(0.5 + u * 1.2); p.material.opacity = 0.7 * (1 - u) })
  }
  dichiara(g, 'colpo-arma', 0.85, 0.55)                                         // la pala sopra la testa, poi giù a schiacciare
  vivo(g, T => {                                                                // rimbalza goffo; ogni ~5,5 s soffia una nuvola di farina
    const ev = evento(T, 5.5, 1.6)
    corpo.position.y += Math.abs(Math.sin(T * Math.PI * 1.3)) * 0.04; corpo.rotation.z += Math.sin(T * 1.0) * 0.06
    corpo.scale.y += -ev.b * 0.07; corpo.scale.x += ev.b * 0.08; corpo.scale.z += ev.b * 0.08
    polvere.forEach(p => { p.scale.multiplyScalar(1 + ev.b * 2.2) })
    pala.rotation.x += Math.sin(T * 1.3) * 0.06
  })
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.55)
    bracci[1].rotation.x += -2.3 * W - 0.6 * L; pala.rotation.x += -W * 0.5 + L * 0.5; bracci[0].rotation.x = -W * 0.8
    corpo.rotation.x += -W * 0.15 + L * 0.35; g.position.z += L * 0.2; bocca.scale.y += W * 0.4 + L * 0.8
  }
  return finisci(g)
}

// ══════════════════════════════════════ IL GHIRO ══════════════════════════════════════
export function creaGhiro () {
  const g = new THREE.Group()
  const pelo = M(0x9a8a78, { flatShading: false, roughness: 0.9 }), pelo2 = M(0xe8dcc8, { flatShading: false, roughness: 0.9 }), scuro = M(0x4a3f36, { flatShading: false }), rosa = M(0xd89a98, { flatShading: false })
  const corpo = perno(g, 0, 0, 0)
  sfera(corpo, 0.5, pelo, 0, 0.14, 0, 0.3, 0.28, 0.34, 14); sfera(corpo, 0.5, pelo2, 0, 0.08, 0.05, 0.22, 0.18, 0.24, 10)
  const testa = perno(corpo, 0, 0.2, 0.15)
  sfera(testa, 0.09, pelo, 0, 0, 0, 1, 0.95, 1, 14); sfera(testa, 0.05, pelo2, 0, -0.03, 0.06, 1, 0.8, 1, 10); sfera(testa, 0.016, scuro, 0, -0.02, 0.115, 1, 0.9, 0.8, 8)
  for (const s of [-1, 1]) {
    sfera(testa, 0.05, pelo, s * 0.07, 0.08, -0.03, 1, 1, 0.3, 10); sfera(testa, 0.036, rosa, s * 0.07, 0.08, -0.015, 1, 1, 0.3, 8)
    sfera(testa, 0.042, M(0x201812, { flatShading: false, roughness: 0.1 }), s * 0.045, 0.02, 0.065, 1, 1.05, 0.8, 10); sfera(testa, 0.012, lucido(0xffffff), s * 0.052, 0.035, 0.095, 1, 1, 1, 6)
    sfera(testa, 0.045, scuro, s * 0.045, 0.03, 0.055, 1.2, 0.5, 0.5, 8)       // la mascherina scura sull'occhio
    sfera(corpo, 0.028, rosa, s * 0.06, 0.03, 0.2, 1, 0.5, 1.3, 6)
  }
  const mascella = perno(testa, 0, -0.055, 0.07)
  sfera(mascella, 0.04, rosa, 0, -0.012, 0.03, 1.1, 0.4, 1.2, 8)
  for (const sg of [-1, 1]) { scatola(mascella, 0.012, 0.022, 0.01, M(0xf2e6c0), sg * 0.014, 0.008, 0.07); scatola(testa, 0.012, 0.022, 0.01, M(0xf2e6c0), sg * 0.014, -0.075, 0.1) }
  const zampine = [-1, 1].map(sg => { const pv = perno(corpo, sg * 0.05, 0.12, 0.2); sfera(pv, 0.026, rosa, 0, -0.05, 0.02, 1, 1.2, 1, 6); sfera(pv, 0.015, pelo, 0, -0.02, 0.0, 1, 1.5, 1, 6); return pv })
  const coda = perno(corpo, 0, 0.14, -0.17)
  const peli = []
  for (let i = 0; i < 8; i++) { const r = 0.06 - i * 0.004; const p = sfera(coda, r, i > 5 ? pelo2 : pelo, 0, 0, 0, 1, 1, 1.1, 8); peli.push(p) }
  g.userData.anima = t => {
    corpo.scale.set(1 + onda(t, 3) * 0.015, 1 + onda(t, 3) * 0.025, 1); corpo.position.z = 0; corpo.rotation.x = 0; mascella.rotation.x = 0
    testa.rotation.set(0.05 + onda(t, 1.2) * 0.1, onda(t, 0.8) * 0.3, 0)
    peli.forEach((p, i) => { const u = i / 7; p.position.set(onda(t, 1.8, -i * 0.3) * 0.04 * u, u * u * 0.18, -i * 0.032 - u * 0.02) })
  }
  vivo(g, T => {                                                                // saltella, annusa; ogni ~5 s si siede e si pulisce le zampe
    const ev = evento(T, 5, 1.6), lava = Math.sin(T * 15) * 0.3 * ev.b
    corpo.position.y = Math.abs(Math.sin(T * Math.PI * 1.5)) * 0.012; corpo.rotation.z = Math.sin(T * 1.2) * 0.05
    corpo.rotation.x += -ev.b * 0.4; testa.rotation.x += ev.b * 0.4 + Math.sin(T * 9) * 0.05; testa.rotation.y += Math.sin(T * 0.9) * 0.4
    zampine.forEach((z, i) => { z.rotation.x = -ev.b * 1.5 + lava * (i ? 1 : -1) })
    mascella.rotation.x += ev.b * 0.3
    peli.forEach((p, i) => { p.position.x += Math.sin(T * 3 - i * 0.5) * 0.035 * (i / 7) })
  })
  dichiara(g, 'morso', 0.55, 0.5)                                              // si rannicchia e scatta in avanti a morsicare
  g.userData.attacca = p => {
    const { W, L } = ritmo(p, 0.5)
    corpo.position.z += -W * 0.07 + L * 0.24; corpo.rotation.x += -W * 0.25 + L * 0.12
    testa.rotation.x += -W * 0.3 + L * 0.4; mascella.rotation.x += apertura(p, 0.5) * 1.0
  }
  return finisci(g)
}

export const MOSTRI_PRATI = [
  { chiave: 'zombie', nome: 'Zombie', zona: 'prati', luogo: 'cimitero, altare', taglia: 'media', forza: 1, crea: () => creaZombie() },
  { chiave: 'fantasma', nome: 'Fantasma', zona: 'prati', luogo: 'cimitero, altare', taglia: 'media', forza: 2, crea: () => creaFantasma() },
  { chiave: 'scheletro-scudo', nome: 'Scheletro con scudo (caporale)', zona: 'prati', luogo: 'cimitero, altare', taglia: 'grande', forza: 3, crea: creaScheletroScudo },
  { chiave: 'scheletro-arciere', nome: 'Scheletro arciere', zona: 'prati', luogo: 'cimitero, altare', taglia: 'media', forza: 2, crea: creaScheletroArciere },
  { chiave: 'ratto', nome: 'Ratto', zona: 'prati', luogo: 'campi, mulino, cantine', taglia: 'piccola', forza: 1, crea: () => creaRatto() },
  { chiave: 'goblin', nome: 'Goblin', zona: 'prati', luogo: 'campi, colle, cantine', taglia: 'piccola', forza: 1, crea: () => creaGoblin() },
  { chiave: 'goblin-rosso', nome: 'Goblin rosso', zona: 'prati', luogo: 'mulino, cantine', taglia: 'piccola', forza: 2, crea: () => creaGoblin(1) },
  { chiave: 'vespa', nome: 'Vespa gigante', zona: 'prati', luogo: 'campi, frutteto', taglia: 'piccola', forza: 1, crea: () => creaVespa() },
  { chiave: 'cinghiale', nome: 'Cinghiale', zona: 'prati', luogo: 'campi, frutteto', taglia: 'media', forza: 2, crea: () => creaCinghiale() },
  { chiave: 'cinghiale-caporale', nome: 'Cinghiale caporale', zona: 'prati', luogo: 'campi, frutteto', taglia: 'grande', forza: 3, crea: () => creaCinghiale(1) },
  { chiave: 'orco', nome: 'Orco (caporale)', zona: 'prati', luogo: 'mulino, colle, cantine', taglia: 'grande', forza: 3, crea: () => creaOrco() },
  { chiave: 'spaventapasseri', nome: 'Spaventapasseri vivo', zona: 'prati', luogo: 'campi', taglia: 'media', forza: 2, crea: () => creaSpaventapasseri() },
  { chiave: 'corvo', nome: 'Corvo', zona: 'prati', luogo: 'campi, cimitero', taglia: 'piccola', forza: 1, crea: () => creaCorvo() },
  { chiave: 'melma-rosa', nome: 'Melma rosa', zona: 'prati', luogo: 'frutteto', taglia: 'media', forza: 1, crea: creaMelmaRosa },
  { chiave: 'sacco-mulino', nome: 'Sacco del mulino', zona: 'prati', luogo: 'mulino', taglia: 'media', forza: 2, crea: creaSaccoDelMulino },
  { chiave: 'ghiro', nome: 'Ghiro', zona: 'prati', luogo: 'frutteto', taglia: 'piccola', forza: 1, crea: creaGhiro }
]

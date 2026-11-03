// I corpi delle bestie di casa che non sono Watson né i gatti: il coniglio e il pappagallo, modellati nella creta (`creta.js`); i cani di razza stanno
// in `modelli-cani.js`, i gatti in `modelli-compagni.js`. Il coniglio e il pappagallo hanno la loro posa (`posaPiccolo`), i cani di razza quella di
// Watson (`posaBeagle`). Davanti verso +z, piedi a terra, origine al centro dell'impronta. Vedi docs/fattoria3d/creta.md e docs/fattoria3d/bestie-di-casa.md.
import * as THREE from 'three'
import { mat } from './modelli.js'
import { posaCane, G, perno, zonaTocco, creaCompagno } from './modelli-compagni.js'
import { palla, osso, fila, girata, arruffata, unione, meno, dentro, sopra, pelle, fra, verso, mosso, PARTENZA } from './creta.js'
import { creaCaneDiRazza, RAZZE_CANE } from './modelli-cani.js'

export { RAZZE_CANE }

const lisc = x => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k) }

// ══════════ i pezzi nella creta ══════════
// Il coniglio e il pappagallo sono modellati nella creta come i cani (`creta.js`, docs/fattoria3d/creta.md): ogni pezzo è scritto nel sistema
// della bestia ferma e la sua pelle si sposta nel suo perno. I colori vengono da una funzione della posizione (e della normale: l'interno dell'orecchio).
function carne (pernoDi, chiave, forma, { min, max, passo, colore, centro, ruvido = 0.85 }) {
  const fai = k => G(chiave + (k > 1 ? ':lod' : ''), () => pelle(forma, { min, max, passo: passo * k, colore, centro }))
  const alta = () => fai(1), bassa = () => fai(2.4)
  const m = new THREE.Mesh(PARTENZA.lontano ? bassa() : alta(), mat(0xffffff, { vertexColors: true, flatShading: false, roughness: ruvido }))
  m.castShadow = m.receiveShadow = true; m.userData.lod = { alta, bassa }; pernoDi.add(m)
  return m
}
const tinta = hex => (x, y, z, c) => c.setHex(hex)
const meno3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
/** Un occhio lucido (un globo scuro e il riflesso), nel perno `p` a `pos` (nel sistema del perno); `fuori` quanto guarda di lato (il coniglio). */
function occhio (p, pos, r, hex, chiave, fuori = 0.3) {
  const o = new THREE.Mesh(G(chiave, () => new THREE.SphereGeometry(r, 16, 12)), mat(hex, { roughness: 0.1, flatShading: false }))
  o.position.set(...pos); o.castShadow = false; p.add(o)
  const l = new THREE.Mesh(G(chiave + ':luce', () => new THREE.SphereGeometry(r * 0.3, 8, 6)), mat(0xffffff, { roughness: 0.2, flatShading: false, emissive: 0x666666 }))
  const d = new THREE.Vector3(fuori * Math.sign(pos[0] || 1), 0.5, 1 - fuori).normalize().multiplyScalar(r * 0.82)      // il riflesso verso dove guarda l'occhio, un po' in alto
  l.position.copy(d); l.castShadow = false; o.add(l)
  return o
}

// ══════════ il coniglio ══════════
// Bianco con la sella grigio fumo e le punte delle orecchie grigie, l'interno dell'orecchio rosa, la codina a batuffolo, le cosce grandi e i piedi
// lunghi, gli occhi scuri ai lati, le guance piene e il nasino rosa che si muove. Seduto sulle zampe di dietro; salta (binky) quando è contento.
const BIANCO_C = 0xf7f5f1, FUMO = 0xb3aca2, ROSA = 0xf2a7b4
const C_CORPO = [0, 0.16, -0.02], C_TESTA = [0, 0.21, 0.15], C_CODA = [0, 0.18, -0.24]
const C_ORECCHIO = s => [s * 0.036, 0.296, 0.165], C_ZAMPE = [[-0.06, 0.06, 0.08], [0.06, 0.06, 0.08], [-0.09, 0.08, -0.16], [0.09, 0.08, -0.16]]
const coloreConiglio = (x, y, z, c, nx, ny, nz) => {
  c.setHex(BIANCO_C)
  if (y > 0.3 && Math.abs(x) > 0.01) {                                                          // l'orecchio: rosa dentro (la faccia che guarda avanti), grigio in punta
    verso(c, ROSA, fra(0.1, 0.5, nz) * fra(0.35, 0.39, y) * fra(0.5, 0.46, y))
    return verso(c, FUMO, fra(0.47, 0.51, y))
  }
  const sella = fra(0.2, 0.25, y + 0.01 * mosso(x, y, z, 50)) * fra(0.06, 0.0, z) * fra(-0.24, -0.18, z)
  verso(c, FUMO, sella)
  return c.multiplyScalar(0.88 + 0.12 * fra(0.04, 0.22, y))
}
export function creaConiglio () {
  const g = new THREE.Group()
  const corpo = perno(g, ...C_CORPO)
  carne(corpo, 'coniglio:corpo', unione([
    palla([0, 0.15, -0.07], [0.112, 0.11, 0.15]),                                               // il corpo, a pera
    ...[-1, 1].map(s => palla([s * 0.055, 0.13, -0.13], [0.075, 0.095, 0.1])),                  // le anche
    palla([0, 0.15, 0.055], [0.085, 0.092, 0.08]),                                              // il petto
    palla([0, 0.2, 0.1], [0.058, 0.055, 0.06]),                                                 // la nuca
  ], 0.06), { min: [-0.15, 0.02, -0.25], max: [0.15, 0.28, 0.18], passo: 0.016, colore: coloreConiglio, centro: C_CORPO })
  const coda = carne(corpo, 'coniglio:coda', arruffata(palla(C_CODA, 0.04), 0.004, 90), { min: [-0.06, 0.12, -0.3], max: [0.06, 0.24, -0.18], passo: 0.01, colore: tinta(BIANCO_C), centro: C_CORPO, ruvido: 0.95 })
  const testa = perno(corpo, ...meno3(C_TESTA, C_CORPO))
  const capo = unione([
    palla([0, 0.245, 0.18], [0.07, 0.066, 0.074]),                                              // il cranio
    ...[-1, 1].map(s => ({ ...palla([s * 0.036, 0.218, 0.208], [0.046, 0.044, 0.045]), k: 0.035 })),   // le guance piene
    { ...palla([0, 0.22, 0.235], [0.038, 0.033, 0.035]), k: 0.03 },                             // il musetto
    ...[-1, 1].map(s => ({ ...palla([s * 0.014, 0.21, 0.258], 0.016), k: 0.012 })),             // i cuscinetti dei baffi
  ], 0.04)                                                                                     // (niente orbite: a questa rete un incavo piccolo si strappa)
  carne(testa, 'coniglio:testa', capo, { min: [-0.11, 0.15, 0.09], max: [0.11, 0.33, 0.29], passo: 0.0095, colore: coloreConiglio, centro: C_TESTA })
  const naso = carne(testa, 'coniglio:naso', unione([palla([0, 0.226, 0.268], [0.011, 0.008, 0.006]), palla([0, 0.218, 0.266], [0.004, 0.008, 0.004])], 0.006),
    { min: [-0.02, 0.2, 0.25], max: [0.02, 0.24, 0.28], passo: 0.0035, colore: tinta(ROSA), centro: C_TESTA, ruvido: 0.4 })
  const occhi = [-1, 1].map(s => occhio(testa, meno3([s * 0.058, 0.252, 0.197], C_TESTA), 0.023, 0x24160f, 'coniglio-occhio', 0.65))
  const orecchie = [-1, 1].map(s => {
    const a = C_ORECCHIO(s), p = perno(testa, ...meno3(a, C_TESTA))
    const foglia = unione([girata(palla([a[0] + s * 0.012, a[1] + 0.11, a[2]], [0.034, 0.115, 0.019]), [-0.12, 0, -s * 0.1], a), ossoP(a, s)], 0.02)
    const cucchiaio = meno(foglia, girata(palla([a[0] + s * 0.012, a[1] + 0.14, a[2] + 0.021], [0.022, 0.08, 0.009]), [-0.12, 0, -s * 0.1], a), 0.014)   // l'incavo davanti, poco profondo: l'orecchio resta spesso più di due maglie
    carne(p, `coniglio:orecchio${s}`, cucchiaio, { min: [a[0] - 0.06, a[1] - 0.03, a[2] - 0.05], max: [a[0] + 0.06, a[1] + 0.25, a[2] + 0.05], passo: 0.007, colore: coloreConiglio, centro: a })
    p.userData.giro = s * 0.18; return p
  })
  const zampe = C_ZAMPE.map(([x, y, z], i) => {
    const p = perno(corpo, ...meno3([x, y, z], C_CORPO)), dietro = i > 1
    const forma = dietro
      ? unione([palla([x, 0.1, -0.14], [0.05, 0.072, 0.088]), { ...palla([x, 0.02, -0.095], [0.03, 0.021, 0.088]), k: 0.03 }], 0.03)   // la coscia e il piede lungo
      : unione([fila([[x, 0.1, 0.082], [x, 0.03, 0.092]], [0.025, 0.02]), palla([x, 0.017, 0.108], [0.023, 0.018, 0.034])], 0.02)
    carne(p, `coniglio:zampa${i}`, dentro(forma, sopra(0.001), 0.004), { min: [x - 0.07, 0, z - 0.14], max: [x + 0.07, 0.2, z + 0.1], passo: 0.011, colore: coloreConiglio, centro: [x, y, z] })
    return p
  })
  for (const p of [corpo, testa, ...orecchie, ...zampe]) p.userData.base = p.position.clone()
  zonaTocco(g, 0.28, 0.2)
  g.userData = { ...g.userData, corpo, testa, orecchie, zampe, naso, occhi, coda, tipo: 'coniglio' }
  return g
}
const ossoP = (a, s) => osso(a, [a[0] + s * 0.006, a[1] + 0.05, a[2]], 0.02, 0.026)      // la base dell'orecchio, stretta e tonda

// ══════════ il pappagallo ══════════
// Un'amazzone verde: la fronte rossa, le guance gialle, il becco ricurvo color corno col gancio, l'anello bianco attorno all'occhio arancione, le ali
// chiuse con le remiganti blu e lo specchio rosso, la coda a ventaglio verde con la punta gialla, i piedi grigi a due dita avanti e due indietro.
// Sta in piedi, scuote la testa, saltella; quando è contento batte le ali.
const VERDE = 0x46a83a, VERDE_SC = 0x2d7a2c, VERDE_CH = 0x9fd35e, ROSSO = 0xd8322b, GIALLO = 0xf2c230, BLU = 0x2f6fd0, CORNO = 0xd6c79c, GRIGIO = 0x8f8a86
const P_CORPO = [0, 0.2, 0], P_TESTA = [0, 0.35, 0.015], P_CODA = [0, 0.1, -0.06], P_ALA = s => [s * 0.06, 0.27, -0.01], P_ZAMPE = [-1, 1].map(s => [s * 0.035, 0.07, 0])
const colorePappagallo = (x, y, z, c) => {
  c.setHex(VERDE)
  verso(c, VERDE_CH, fra(0.04, 0.08, z) * fra(0.3, 0.22, y) * fra(0.1, 0.16, y) * 0.8)            // il petto più chiaro
  verso(c, ROSSO, fra(0.385, 0.4, y) * fra(0.03, 0.05, z))                                         // la fronte rossa
  verso(c, GIALLO, fra(0.034, 0.046, Math.abs(x)) * fra(0.36, 0.345, y) * fra(0.31, 0.325, y) * fra(0.02, 0.04, z))   // le guance gialle
  const piume = Math.sin(y * 210 + Math.sin(x * 95) * 1.6) * Math.sin(x * 120 + z * 60)                // le file di piume, appena accennate
  return c.multiplyScalar((0.86 + 0.14 * fra(0.1, 0.35, y)) * (0.96 + 0.04 * piume))
}
export function creaPappagallo () {
  const g = new THREE.Group()
  const corpo = perno(g, ...P_CORPO)
  carne(corpo, 'pappagallo:corpo', unione([
    girata(palla([0, 0.205, 0.0], [0.072, 0.118, 0.078]), [-0.18, 0, 0]),                      // il corpo a uovo, un po' in avanti
    palla([0, 0.17, 0.032], [0.066, 0.08, 0.06]),                                               // il petto
    osso([0, 0.27, 0.0], [0, 0.32, 0.012], 0.055, 0.05),                                        // il collo
    palla([0, 0.11, -0.03], [0.045, 0.04, 0.045]),                                              // il sottocoda
    ...[-1, 1].map(s => palla([s * 0.032, 0.088, 0.004], [0.03, 0.04, 0.032])),                 // le piume sulle cosce: delle zampe si vedono solo i piedi
  ], 0.045), { min: [-0.1, 0.03, -0.11], max: [0.1, 0.36, 0.12], passo: 0.011, colore: colorePappagallo, centro: P_CORPO })
  const testa = perno(corpo, ...meno3(P_TESTA, P_CORPO))
  let capo = unione([
    palla([0, 0.36, 0.022], [0.058, 0.058, 0.062]),
    ...[-1, 1].map(s => ({ ...palla([s * 0.03, 0.34, 0.04], [0.035, 0.035, 0.035]), k: 0.03 })),
  ], 0.03)
  for (const s of [-1, 1]) capo = meno(capo, palla([s * 0.05, 0.37, 0.036], 0.014), 0.006)
  carne(testa, 'pappagallo:testa', capo, { min: [-0.08, 0.28, -0.05], max: [0.08, 0.43, 0.1], passo: 0.0085, colore: colorePappagallo, centro: P_TESTA })
  carne(testa, 'pappagallo:becco', unione([
    palla([0, 0.356, 0.072], [0.027, 0.028, 0.032]),                                            // il becco di sopra: largo quanto la faccia…
    fila([[0, 0.362, 0.088], [0, 0.35, 0.104], [0, 0.33, 0.11], [0, 0.31, 0.101]], [0.02, 0.017, 0.011, 0.004], 0.012),   // …e il gancio che scende
    palla([0, 0.323, 0.076], [0.02, 0.016, 0.022]),                                              // quello di sotto
  ], 0.014), { min: [-0.04, 0.29, 0.04], max: [0.04, 0.39, 0.13], passo: 0.005, colore: (x, y, z, c) => verso(c.setHex(CORNO), 0x4a4440, fra(0.325, 0.31, y) * fra(0.09, 0.1, z)).multiplyScalar(0.8 + 0.2 * fra(0.3, 0.37, y)), centro: P_TESTA, ruvido: 0.45 })      // color corno, la punta del gancio scura
  const occhi = [-1, 1].map(s => {
    carne(testa, `pappagallo:anello${s}`, palla([s * 0.05, 0.37, 0.036], [0.013, 0.015, 0.015]), { min: [s * 0.05 - 0.03, 0.34, 0.01], max: [s * 0.05 + 0.03, 0.4, 0.06], passo: 0.0045, colore: tinta(0xf4f1ea), centro: P_TESTA, ruvido: 0.6 })
    const o = occhio(testa, meno3([s * 0.056, 0.37, 0.04], P_TESTA), 0.009, 0xe08a1c, 'pappagallo-occhio')
    const pupilla = new THREE.Mesh(G('pappagallo-pupilla', () => new THREE.SphereGeometry(0.0052, 10, 8)), mat(0x0d0a08, { roughness: 0.1, flatShading: false }))
    pupilla.position.set(s * 0.003, 0, 0.005); o.add(pupilla)
    return o
  })
  const ali = [-1, 1].map(s => {
    const a = P_ALA(s), p = perno(corpo, ...meno3(a, P_CORPO))
    const piume = [0, 1, 2].map(k => ({ ...girata(palla([s * 0.075, 0.12 - k * 0.012, -0.02 - k * 0.02], [0.014, 0.06, 0.022]), [0.35, 0, s * 0.08]), k: 0.012 }))
    carne(p, `pappagallo:ala${s}`, unione([girata(palla([s * 0.07, 0.2, -0.01], [0.022, 0.1, 0.058]), [0.2, 0, s * 0.1]), ...piume], 0.02),
      { min: [s * 0.07 - 0.06, 0.04, -0.12], max: [s * 0.07 + 0.06, 0.32, 0.07], passo: 0.0085, centro: a,
        colore: (x, y, z, c) => { c.setHex(VERDE_SC); verso(c, ROSSO, fra(0.17, 0.16, y) * fra(0.13, 0.145, y) * 0.9); verso(c, BLU, fra(0.12, 0.09, y)); return c.multiplyScalar(0.85 + 0.15 * fra(0.06, 0.3, y)) } })
    p.userData.base = p.position.clone(); return p
  })
  const coda = perno(corpo, ...meno3(P_CODA, P_CORPO))
  carne(coda, 'pappagallo:coda', unione([-1, 0, 1].map(k => girata(palla([k * 0.02, 0.04, -0.13], [0.022, 0.012, 0.085]), [-0.55, k * 0.25, 0], [0, 0.1, -0.06])), 0.015),
    { min: [-0.07, -0.05, -0.25], max: [0.07, 0.13, -0.02], passo: 0.0075, centro: P_CODA,
      colore: (x, y, z, c) => { c.setHex(VERDE); verso(c, ROSSO, fra(-0.09, -0.11, z) * fra(-0.14, -0.12, z) * 0.7); return verso(c, GIALLO, fra(-0.17, -0.2, z)) } })
  const zampe = P_ZAMPE.map(([x, y, z]) => {
    const p = perno(g, x, y, z)
    const dita = [[-0.012, 0.03], [0.012, 0.03], [-0.008, -0.026], [0.008, -0.026]].map(([dx, dz]) => osso([x, 0.012, 0.004], [x + dx, 0.007, dz], 0.0075, 0.005))
    carne(p, `pappagallo:zampa${x > 0 ? 1 : 0}`, dentro(unione([fila([[x, 0.09, -0.005], [x, 0.04, 0.004], [x, 0.014, 0.004]], [0.014, 0.012, 0.011]), ...dita], 0.008), sopra(0.0005), 0.002),
      { min: [x - 0.05, 0, -0.05], max: [x + 0.05, 0.13, 0.05], passo: 0.0055, colore: tinta(GRIGIO), centro: [x, y, z], ruvido: 0.7 })
    p.userData.base = p.position.clone(); return p
  })
  for (const p of [corpo, testa, coda]) p.userData.base = p.position.clone()
  zonaTocco(g, 0.25, 0.22)
  g.userData = { ...g.userData, corpo, testa, ali, coda, zampe, occhi, tipo: 'pappagallo' }
  return g
}

// ══════════ la posa del beagle: quella di Watson (stessi perni), con le zampe che sdraiato restano attaccate alle spalle ══════════
export function posaBeagle (g, opz = {}) {
  posaCane(g, opz)
  const a = g.userData.alzo || 0                                     // le razze più alte o più basse di zampe: dove `posaCane` mette il corpo a una quota fissa (seduto, sdraiato), la si sposta
  if (a && ['siede', 'zampa', 'sbadiglia', 'dorme'].includes(opz.stato)) { g.userData.corpo.position.y += a; for (const z of g.userData.zampe) z.position.y += a * 0.7 }
  if (['siede', 'zampa', 'sbadiglia'].includes(opz.stato)) {          // seduto davvero: il sedere a terra, il petto su, le zampe davanti dritte sotto il petto,
    const u = g.userData, [fl, fr, bl, br] = u.zampe                // le dietro piegate in avanti (il piede resta sotto il terreno, che lo copre)
    u.corpo.rotation.x = -0.8; u.corpo.position.y = 0.15 + a * 0.4; u.corpo.position.z = u.corpo.userData.base.z + 0.07
    u.testa.rotation.x += 0.36
    for (const z of [fl, fr]) { z.position.y = z.userData.base.y + 0.02; z.position.z = z.userData.base.z - 0.06 }
    for (const z of [bl, br]) { z.position.y = 0.17 + a * 0.5; z.position.z = z.userData.base.z + 0.03; z.rotation.x = -1.05 }
  }
  if (opz.stato === 'dorme') { const [fl, fr] = g.userData.zampe; for (const z of [fl, fr]) { z.position.y = 0.1; z.position.z -= 0.07 }
    for (const o of g.userData.orecchie) { o.position.y -= 0.07; o.rotation.z *= 0.3 } }
}

// ══════════ le pose dei piccoli (funzioni senza memoria, come `posaCane`) ══════════
// `stato`: sta siede annusa dorme festa vaga segue fugge; `vel` 0..1 quanto va; `fase` il passo; `t` il tempo; `p` a che punto è lo stato.
export function posaPiccolo (g, { stato = 'sta', vel = 0, fase = 0, t = 0, p = 0 } = {}) {
  const u = g.userData
  if (u.tipo === 'coniglio') return posaConiglio(u, stato, vel, fase, t, p)
  if (u.tipo === 'pappagallo') return posaPappagallo(u, stato, vel, fase, t, p)
}
function ripristina (lista) { for (const n of lista) { n.position.copy(n.userData.base); n.rotation.set(0, 0, 0); n.scale.set(1, 1, 1) } }

function posaConiglio (u, stato, vel, fase, t, p) {
  const [fl, fr, bl, br] = u.zampe
  ripristina([u.corpo, u.testa, ...u.orecchie, ...u.zampe])
  u.orecchie.forEach(o => { o.rotation.z = o.userData.giro }); u.occhi.forEach(o => o.scale.set(1, 1, 1)); u.naso.scale.set(1.1, 0.8, 0.8)
  const resp = Math.sin(t * 2.4), naso = Math.sin(t * 14)
  u.naso.scale.y = 0.8 + naso * 0.12
  const orecchie = (k, avanti = 0) => u.orecchie.forEach((o, i) => { o.rotation.z += (i ? 1 : -1) * k; o.rotation.x = -avanti })
  if (vel > 0.05) {                                                  // saltella: le zampe di dietro spingono, il corpo fa un arco
    const s = Math.sin(fase), arco = Math.abs(s)
    u.corpo.position.y += arco * 0.1; u.corpo.rotation.x = -s * 0.25 + 0.05
    fl.rotation.x = fr.rotation.x = -arco * 0.6; bl.rotation.x = br.rotation.x = arco * 0.7
    u.testa.rotation.x = s * 0.12; orecchie(0.05, 0.15 + arco * 0.2)
    return
  }
  if (stato === 'siede') {                                           // sulle zampe di dietro, il petto in su, le zampine al petto
    u.corpo.rotation.x = -0.55; u.corpo.position.y += 0.03; u.testa.rotation.x = 0.5
    fl.rotation.x = fr.rotation.x = 0.7; bl.position.z += 0.03; br.position.z += 0.03
    u.corpo.scale.y = 1 + resp * 0.02; u.testa.rotation.y = Math.sin(t * 0.8) * 0.3
  } else if (stato === 'annusa') {                                   // il muso giù, il nasino che corre
    u.testa.rotation.x = 0.7 + Math.sin(t * 7) * 0.05; u.testa.position.y -= 0.03; u.corpo.rotation.x = 0.1; orecchie(0.2, 0.1)
    u.naso.scale.y = 0.8 + Math.abs(Math.sin(t * 18)) * 0.3
  } else if (stato === 'dorme') {                                    // un panetto: schiacciato, la testa sulle zampe, le orecchie giù
    u.corpo.scale.set(1.08, 0.78 * (1 + resp * 0.03), 1); u.corpo.position.y -= 0.025
    u.testa.position.y -= 0.045; u.testa.rotation.x = 0.55; orecchie(0.12, 1.25)          // le orecchie stese indietro sulla schiena
    u.occhi.forEach(o => o.scale.y = 0.1)
  } else if (stato === 'festa') {                                    // il salto della gioia (binky): in aria si torce, le orecchie al vento
    const h = Math.abs(Math.sin(t * 6.5)), tw = Math.sin(t * 6.5)
    u.corpo.position.y += h * 0.16; u.corpo.rotation.z = tw * 0.4; u.corpo.rotation.x = -0.2 * h
    bl.rotation.x = br.rotation.x = 0.8 * h; fl.rotation.x = fr.rotation.x = -0.6 * h; orecchie(0.1 + 0.3 * h, 0.2 * h)
  } else {                                                           // in piedi: respira, le orecchie che girano, il nasino
    u.corpo.scale.y = 1 + resp * 0.015; u.testa.rotation.y = Math.sin(t * 0.7) * 0.35
    u.orecchie[0].rotation.x = -Math.max(0, Math.sin(t * 0.9)) * 0.25; u.orecchie[1].rotation.x = -Math.max(0, Math.sin(t * 0.9 + 2)) * 0.25
  }
}

function posaPappagallo (u, stato, vel, fase, t, p) {
  const [al, ar] = u.ali
  ripristina([u.corpo, u.testa, u.coda, ...u.ali, ...u.zampe])
  u.occhi.forEach(o => o.scale.set(1, 1, 1))
  const resp = Math.sin(t * 2.6)
  u.ali.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * 0.08 })
  if (vel > 0.05) {                                                  // saltella con le due zampe, la coda che dondola
    const s = Math.sin(fase), arco = Math.abs(s)
    u.corpo.position.y += arco * 0.045; u.corpo.rotation.z = s * 0.1; u.testa.rotation.x = 0.1 * Math.sin(fase * 2)
    u.coda.rotation.x = -0.2 * arco; u.zampe.forEach((z, i) => { z.rotation.x = (i ? 1 : -1) * s * 0.5 })
    return
  }
  if (stato === 'annusa') {                                          // becchetta a terra
    const b = Math.max(0, Math.sin(t * 5))
    u.corpo.rotation.x = 0.35 + b * 0.15; u.testa.rotation.x = 0.7 + b * 0.35; u.testa.position.y -= 0.02; u.coda.rotation.x = -0.3
  } else if (stato === 'dorme') {                                    // la testa girata e infilata fra le piume
    u.testa.rotation.y = 2.2; u.testa.rotation.x = 0.3; u.testa.position.y -= 0.03; u.corpo.scale.set(1.05, 0.93 * (1 + resp * 0.02), 1.05)
    u.occhi.forEach(o => o.scale.y = 0.08)
  } else if (stato === 'festa') {                                    // batte le ali e saltella
    const b = Math.sin(t * 22), h = Math.abs(Math.sin(t * 5))
    u.corpo.position.y += h * 0.06; al.rotation.z = -(0.5 + b * 0.7); ar.rotation.z = 0.5 + b * 0.7; u.testa.rotation.x = -0.2; u.coda.rotation.x = 0.2 * b
  } else if (stato === 'siede') {                                    // gonfio, la testa che si volta piano
    u.corpo.scale.set(1.06, 1 + resp * 0.03, 1.06); u.testa.rotation.y = Math.sin(t * 0.6) * 0.8
  } else {                                                           // sta: guarda a scatti a destra e a sinistra
    const scatto = Math.floor(t * 0.7); u.testa.rotation.y = Math.sin(scatto * 12.9898) * 0.9 * lisc((t * 0.7 - scatto) * 4)
    u.corpo.scale.y = 1 + resp * 0.012
  }
}

// ══════════ dall'id al corpo ══════════
/** Il corpo di una bestia dai suoi dati (come `creaCompagno`, che lo fa per Watson e i gatti). `tipo` e `variante` vengono da `dati/bestie.js`. */
export function creaBestia (c) {
  let g
  if (c.tipo === 'cane' && RAZZE_CANE[c.variante]) { g = creaCaneDiRazza(c.variante); g.scale.setScalar(RAZZE_CANE[c.variante].scala) }
  else if (c.tipo === 'coniglio') { g = creaConiglio(); g.scale.setScalar(SCALA.coniglio) }
  else if (c.tipo === 'pappagallo') { g = creaPappagallo(); g.scale.setScalar(SCALA.pappagallo) }
  else g = creaCompagno(c)
  g.userData.id = c.id
  return g
}
const SCALA = { coniglio: 0.9, pappagallo: 0.85 }       // le taglie (docs/fattoria3d/taglie.md): un coniglio basso come un gatto accucciato, un pappagallo di quaranta centimetri

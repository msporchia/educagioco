// Il Natale in 3D: gli alberi (piccolo, alto, grande, gigante), i bastoni di zucchero, i pacchi, la ghirlanda, la renna e la slitta. Si comprano solo
// da novembre al 6 gennaio (`stagione: 'natale'` in dati/catalogo.js) e, comprati, restano. Vedi docs/fattoria3d/natale.md.
// La neve non si posa su questi modelli (`userData.senzaNeve`: scena3d/neve.js), se no un albero tutto bianco non si riconosce.
// Le lucine sono tre materiali con la luce propria colorata (rossa, gialla, azzurra): fusi restano tre mesh, e lampeggiano piano cambiando
// la sola `emissiveIntensity` (un numero a materiale, in comune fra tutte le copie: si accendono insieme).
import * as THREE from 'three'
import { mat, scatola, cilindro, cono, palla, filo, festoneFra, pronto } from './modelli-decori-base.js'
import { fondiPerMateriale } from './fondi.js'
import { memoModello } from './cache-modelli.js'

const LEGNO = 0x6e4a2c, ROSSO = 0xd8242e, BIANCO = 0xf6f1e6, ORO = 0xe8b43a, VERDE_A = 0x2a7a36, VERDE_B = 0x3f9a48
/** I colori delle lucine → la luce propria del loro materiale (ognuno diverso dagli altri materiali del gioco, così il fuso è suo). */
const FARO = { r: 0xff2418, g: 0xffc21a, b: 0x1e78ff }
const faro = (k, colore) => mat(colore, { emissive: FARO[k], emissiveIntensity: 0.95 })

/** Dopo la fusione: i materiali delle lucine, per farli lampeggiare (`anima`). Se il modello non ne ha, la lista è vuota. */
function trovaFari (g) {
  const fari = {}
  g.traverse(o => { if (o.isMesh) for (const k of Object.keys(FARO)) if (o.material.emissive && o.material.emissive.getHex() === FARO[k]) fari[k] = o.material })
  return fari
}
/** Il lampeggio, lento e col tempo vero: rosse e azzurre si alternano (≈ 3,7 s a giro), le gialle e la stella respirano appena. */
function lampeggia (tt) {
  const f = this.fari; if (!f) return
  const a = 0.5 + 0.5 * Math.sin(tt * 1.7)
  if (f.r) f.r.emissiveIntensity = 0.25 + 1.1 * a
  if (f.b) f.b.emissiveIntensity = 0.25 + 1.1 * (1 - a)
  if (f.g) f.g.emissiveIntensity = 0.8 + 0.3 * Math.sin(tt * 0.9)
}
function chiudi (g, altezza, { lampeggiano = false } = {}) {
  g.userData.altezza = altezza; g.userData.senzaNeve = true
  fondiPerMateriale(g)
  if (lampeggiano) { g.userData.fari = trovaFari(g); g.userData.anima = lampeggia }
  return g
}
/** Un ottaedro schiacciato per i grani della ghirlanda (8 triangoli: ce ne vogliono molti). */
function grano (g, r, colore, x, y, z) {
  const o = pronto(new THREE.Mesh(new THREE.OctahedronGeometry(r, 0), mat(colore))); o.position.set(x, y, z); g.add(o); return o
}
function lucina (g, r, k, colore, x, y, z) {
  const o = pronto(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), faro(k, colore))); o.position.set(x, y, z); g.add(o); return o
}
/** Un pacco: scatola, nastro in croce e fiocco; `lato` la misura, `y` il piano su cui poggia. */
function pacco (g, lato, alto, colore, nastro, x, y, z, giro = 0) {
  const s = new THREE.Group(); s.position.set(x, y, z); s.rotation.y = giro; g.add(s)
  scatola(s, lato, alto, lato, mat(colore), 0, alto / 2, 0)
  scatola(s, lato * 1.04, alto * 1.02, lato * 0.18, mat(nastro), 0, alto / 2, 0)
  scatola(s, lato * 0.18, alto * 1.02, lato * 1.04, mat(nastro), 0, alto / 2, 0)
  for (const q of [-1, 1]) { const o = cono(s, lato * 0.13, lato * 0.3, mat(nastro), q * lato * 0.12, alto + lato * 0.1, 0, 4); o.rotation.z = q * -1.2 }
  palla(s, lato * 0.07, 0xffffff, 0, alto + lato * 0.07, 0, 1, 1, 1, 0).material = mat(nastro)
  return s
}

/** L'albero di Natale di scala `s` (1 = il piccolo): `strati` falde verdi, `lucine` luci colorate, `bolle` palle d'oro e rosse, una ghirlanda d'oro a
    spirale, la stella in cima e `regali` pacchi attorno al tronco. */
function alberoNatale (s, { strati, lucine, bolle, regali, vaso }) {
  const g = new THREE.Group(), rnd = (() => { let a = 7 + strati * 13; return () => { a = (a * 16807) % 2147483647; return a / 2147483647 } })()
  const raggio = t => s * (s > 1.5 ? 0.5 : 0.56) * (1 - 0.57 * t), base = t => s * (0.24 + 0.88 * t), alto = t => s * (0.62 - 0.14 * t)
  if (vaso) { cilindro(g, 0.2 * s, 0.17 * s, 0.24 * s, mat(0xb8243a), 0, 0.12 * s, 0, 10); cilindro(g, 0.21 * s, 0.21 * s, 0.03 * s, mat(ORO), 0, 0.24 * s, 0, 10) }
  cilindro(g, 0.06 * s, 0.09 * s, 0.7 * s, mat(LEGNO), 0, 0.35 * s, 0, 6)
  const N = strati, T = []
  for (let i = 0; i < N; i++) { const t = i / (N - 1); T.push([base(t), alto(t), raggio(t)]); cono(g, raggio(t), alto(t), mat(i % 2 ? VERDE_B : VERDE_A), 0, base(t) + alto(t) / 2, 0, 9) }
  const cima = base(1) + alto(1), R = Math.pow(s, 0.6)
  // la ghirlanda d'oro: una spirale che sale dal basso alla punta, sulla superficie dell'albero
  const quanti = Math.round(34 * Math.sqrt(s) * (s > 1 ? 1.2 : 1))
  for (let k = 0; k < quanti; k++) {
    const u = 0.1 + 0.82 * (k / quanti), y = u * cima, rr = (s * (s > 1.5 ? 0.5 : 0.56)) * (1 - y / (cima + 0.1 * s)) * 1.02, a = k * 0.62
    grano(g, 0.034 * R, ORO, Math.cos(a) * rr, y, Math.sin(a) * rr)
  }
  const gruppi = ['r', 'g', 'b', 'r', 'g', 'b', 'r']
  const colori = { r: [0xff3a2e, 0xff6fa8], g: [0xffd23a, 0xfff2b0], b: [0x3a8aff, 0x5fd0ff] }
  for (let i = 0; i < lucine; i++) {
    const [b, h, r] = T[i % N], u = 0.1 + rnd() * 0.5, y = b + u * h, rr = r * (1 - u) * 1.04, a = i * 2.4 + rnd(), k = gruppi[i % gruppi.length]
    lucina(g, 0.085 * R, k, colori[k][i % 2], Math.cos(a) * rr, y, Math.sin(a) * rr)
  }
  const palle = [ROSSO, ORO, 0xd8d8e8, ROSSO]
  for (let i = 0; i < bolle; i++) {
    const [b, h, r] = T[(i * 3 + 1) % N], u = 0.05 + rnd() * 0.45, y = b + u * h, rr = r * (1 - u) * 1.02, a = i * 1.9 + rnd()
    palla(g, 0.1 * R, palle[i % 4], Math.cos(a) * rr, y, Math.sin(a) * rr, 1, 1, 1, 0)
  }
  // la stella: due ottaedri incrociati, dorati e accesi; sopra la punta
  const st = pronto(new THREE.Mesh(new THREE.OctahedronGeometry(0.2 * R, 0), faro('g', 0xffe066))); st.position.set(0, cima + 0.12 * R, 0); st.scale.set(1, 1.15, 0.5); g.add(st)
  const st2 = pronto(new THREE.Mesh(new THREE.OctahedronGeometry(0.2 * R, 0), faro('g', 0xffe066))); st2.position.set(0, cima + 0.12 * R, 0); st2.rotation.y = Math.PI / 2; st2.scale.set(1, 1.15, 0.5); g.add(st2)
  for (let i = 0; i < regali; i++) {
    const a = (i / regali) * Math.PI * 2 + 0.4, d = raggio(0) * (0.78 + 0.18 * rnd()), l = (0.17 + 0.07 * rnd()) * R
    pacco(g, l, l * (0.8 + 0.4 * rnd()), [ROSSO, 0x2f8a4a, 0x3f78c8, 0xf0c52a][i % 4], i % 2 ? ORO : BIANCO, Math.cos(a) * d, 0, Math.sin(a) * d, a)
  }
  return chiudi(g, cima + 0.4 * R, { lampeggiano: true })
}

const ALBERI = {
  albero_natale: [1, { strati: 4, lucine: 20, bolle: 8, regali: 0, vaso: true }],
  albero_natale_alto: [1.9, { strati: 6, lucine: 44, bolle: 14, regali: 3 }],
  albero_natale_grande: [2.8, { strati: 8, lucine: 74, bolle: 22, regali: 5 }],
  albero_natale_gigante: [3.7, { strati: 10, lucine: 110, bolle: 32, regali: 7 }],
}
export const creaAlberoNatale = Object.fromEntries(Object.entries(ALBERI).map(([id, [s, o]]) => [id, memoModello('natale:' + id, () => alberoNatale(s, o))]))

/** Un bastone di zucchero in piedi: strisce rosse e bianche, e in cima il manico a uncino. */
function bastone (g, x, z, alt, giro = 0, r = 0.05) {
  const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = giro; g.add(s)
  const n = Math.max(4, Math.round(alt / 0.11)), h = alt / n
  for (let i = 0; i < n; i++) cilindro(s, r, r, h * 1.02, mat(i % 2 ? BIANCO : ROSSO), 0, h * (i + 0.5), 0, 7)
  const R = r * 2.4
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI, a1 = ((i + 1) / 6) * Math.PI
    filo(s, [R - Math.cos(a0) * R, alt + Math.sin(a0) * R, 0], [R - Math.cos(a1) * R, alt + Math.sin(a1) * R, 0], r, i % 2 ? BIANCO : ROSSO, 7)
  }
  return s
}
const creaBastoni = memoModello('natale:bastoni', () => {
  const g = new THREE.Group()
  bastone(g, -0.18, 0.05, 0.85, 0.4); bastone(g, 0.16, -0.06, 1.05, 3.2, 0.055); bastone(g, 0.0, 0.22, 0.65, 1.6, 0.045)
  const f = cono(g, 0.09, 0.14, mat(ROSSO), 0.0, 0.1, -0.02, 4); f.rotation.x = Math.PI / 2
  return chiudi(g, 1.3)
})
const creaFilaBastoni = memoModello('natale:fila-bastoni', () => {
  const g = new THREE.Group()
  for (let i = 0; i < 6; i++) bastone(g, -0.9 + i * 0.36, 0, 0.7 + (i % 2) * 0.1, i % 2 ? Math.PI : 0)
  filo(g, [-0.9, 0.5, 0.02], [0.9, 0.5, 0.02], 0.02, ROSSO, 4)
  return chiudi(g, 1.0)
})
const creaPacchi = memoModello('natale:pacchi', () => {
  const g = new THREE.Group()
  pacco(g, 0.62, 0.42, ROSSO, ORO, 0, 0, 0.0, 0.2)
  pacco(g, 0.44, 0.34, 0x2f8a4a, BIANCO, 0.05, 0.42, 0, -0.35)
  pacco(g, 0.3, 0.26, 0x3f78c8, ORO, 0.36, 0, 0.25, 0.5)
  pacco(g, 0.26, 0.22, 0xf0c52a, ROSSO, -0.34, 0, 0.3, -0.2)
  return chiudi(g, 0.9)
})
const creaGhirlanda = memoModello('natale:ghirlanda', () => {
  const g = new THREE.Group()
  for (const s of [-1, 1]) { cilindro(g, 0.05, 0.06, 1.35, mat(LEGNO), s * 0.92, 0.675, 0, 6); cono(g, 0.08, 0.14, mat(ROSSO), s * 0.92, 1.42, 0, 5) }
  const p = festoneFra(g, [-0.92, 1.25, 0], [0.92, 1.25, 0], 0.42, 14, 0.07, VERDE_A)
  p.forEach(([x, y, z], i) => {
    palla(g, 0.1, i % 2 ? VERDE_B : VERDE_A, x, y, z + (i % 2 ? 0.04 : -0.04), 1.1, 0.8, 1, 0)
    if (i % 3 === 0) palla(g, 0.045, ROSSO, x + 0.05, y - 0.07, z + 0.1, 1, 1, 1, 0)
    if (i % 3 === 1) lucina(g, 0.05, i % 2 ? 'g' : 'r', i % 2 ? 0xffd23a : 0xff3a2e, x, y - 0.1, z + 0.1)
  })
  const m = p[Math.floor(p.length / 2)]
  for (const q of [-1, 1]) { const o = cono(g, 0.12, 0.34, mat(ROSSO), m[0] + q * 0.12, m[1] - 0.04, 0.1, 4); o.rotation.z = q * -1.9 }
  palla(g, 0.08, ROSSO, m[0], m[1] - 0.02, 0.1, 1, 1, 1, 0)
  return chiudi(g, 1.5, { lampeggiano: true })
})

/** Una renna in piedi di fianco, il muso verso +x (il modello intero poi si gira): corpo, collo, testa, corna, zampe e naso rosso acceso. */
function renna (g, x, z, giro, scala = 1) {
  const r = new THREE.Group(); r.position.set(x, 0, z); r.rotation.y = giro; r.scale.setScalar(scala); g.add(r)
  const pelo = mat(0x9a6a3c)
  palla(r, 0.3, 0x9a6a3c, 0, 0.62, 0, 1.55, 0.78, 0.8, 0); palla(r, 0.17, 0xe9d8b8, -0.4, 0.66, 0, 1, 1, 0.9, 0)
  cilindro(r, 0.09, 0.14, 0.4, pelo, 0.43, 0.9, 0, 6).rotation.z = -0.55
  palla(r, 0.13, 0x9a6a3c, 0.62, 1.09, 0, 1.35, 0.95, 0.9, 0); palla(r, 0.05, 0xff2418, 0.79, 1.07, 0, 1, 1, 1, 0).material = faro('r', 0xff3a2e)
  for (const q of [-1, 1]) {
    palla(r, 0.03, 0x1c1c22, 0.7, 1.15, q * 0.08, 1, 1, 1, 0)
    filo(r, [0.58, 1.19, q * 0.07], [0.5, 1.5, q * 0.14], 0.016, 0xd9c49a, 4); filo(r, [0.5, 1.5, q * 0.14], [0.62, 1.68, q * 0.2], 0.014, 0xd9c49a, 4)
    filo(r, [0.52, 1.42, q * 0.14], [0.4, 1.58, q * 0.2], 0.012, 0xd9c49a, 4)
    cono(r, 0.04, 0.12, pelo, 0.52, 1.2, q * 0.12, 4).rotation.z = q * 0.2
    for (const px of [-0.38, 0.34]) { cilindro(r, 0.04, 0.03, 0.46, pelo, px, 0.26, q * 0.14, 5); cilindro(r, 0.045, 0.045, 0.05, mat(0x3a2a1c), px, 0.02, q * 0.14, 5) }
  }
  scatola(r, 0.05, 0.2, 0.3, mat(ROSSO), 0.3, 0.84, 0)
  for (let i = 0; i < 3; i++) palla(r, 0.032, ORO, 0.3 + i * 0.01, 0.74 - i * 0.07, 0.17, 1, 1, 1, 0)
  return r
}
const creaRenna = memoModello('natale:renna', () => { const g = new THREE.Group(); renna(g, -0.05, 0, -Math.PI / 2 + 0.25); return chiudi(g, 1.7, { lampeggiano: true }) })
/** La slitta di Babbo Natale con il suo sacco e i regali, il davanti verso +x. */
function slitta (g) {
  for (const q of [-1, 1]) {
    scatola(g, 1.55, 0.05, 0.06, mat(ORO), 0, 0.1, q * 0.3)
    filo(g, [0.75, 0.1, q * 0.3], [0.98, 0.34, q * 0.3], 0.03, ORO, 5)
    for (const x of [-0.5, 0.35]) filo(g, [x, 0.1, q * 0.3], [x, 0.3, q * 0.3], 0.03, LEGNO, 5)
  }
  scatola(g, 1.2, 0.06, 0.64, mat(ROSSO), -0.1, 0.3, 0)
  scatola(g, 1.2, 0.34, 0.05, mat(ROSSO), -0.1, 0.47, 0.3); scatola(g, 1.2, 0.34, 0.05, mat(ROSSO), -0.1, 0.47, -0.3)
  scatola(g, 0.05, 0.5, 0.64, mat(ROSSO), -0.7, 0.55, 0)
  scatola(g, 1.26, 0.04, 0.06, mat(ORO), -0.1, 0.65, 0.3); scatola(g, 1.26, 0.04, 0.06, mat(ORO), -0.1, 0.65, -0.3)
  palla(g, 0.36, 0x9a6a3c, -0.15, 0.62, 0, 1.15, 0.95, 0.95, 1)
  cono(g, 0.14, 0.26, mat(0x9a6a3c), -0.15, 1.02, 0, 7); cilindro(g, 0.05, 0.05, 0.05, mat(ORO), -0.15, 0.95, 0, 7)
  pacco(g, 0.26, 0.2, 0x3f78c8, ORO, 0.3, 0.33, 0.1, 0.4); pacco(g, 0.2, 0.18, 0x2f8a4a, BIANCO, 0.42, 0.33, -0.12, -0.3)
  pacco(g, 0.2, 0.2, 0xf0c52a, ROSSO, -0.55, 0.33, -0.15, 0.2)
}
const creaSlittaConRenne = memoModello('natale:slitta-renne', () => {
  const g = new THREE.Group(), p = new THREE.Group(); p.rotation.y = -Math.PI / 2; g.add(p)       // lungo l'asse x, poi girata: il davanti (le renne) è +z
  const s = new THREE.Group(); s.position.x = -0.55; p.add(s); slitta(s)
  renna(p, 0.6, 0.22, 0, 0.8); renna(p, 0.6, -0.22, 0, 0.8)
  filo(p, [0.6, 0.38, 0.22], [0.3, 0.42, 0.0], 0.015, 0x6e4a2c, 4); filo(p, [0.6, 0.38, -0.22], [0.3, 0.42, 0.0], 0.015, 0x6e4a2c, 4)
  return chiudi(g, 1.7, { lampeggiano: true })
})

export const NATALE_CREA = {
  ...Object.fromEntries(Object.entries(creaAlberoNatale).filter(([id]) => id !== 'albero_natale')),
  bastoni_zucchero: () => creaBastoni(), bastoni_zucchero_fila: () => creaFilaBastoni(), pacchi_regalo: () => creaPacchi(), ghirlanda_natale: () => creaGhirlanda(),
  renna_natale: () => creaRenna(), slitta_natale: () => creaSlittaConRenne(),
}

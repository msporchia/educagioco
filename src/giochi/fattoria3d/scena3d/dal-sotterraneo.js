// I modelli che la fattoria ha preso dal Sotterraneo 3D (src/giochi/sotterraneo/scena3d/mondo/): la casa di legno, il banco della
// guaritrice, la bacheca delle taglie, il cespuglio. SONO COPIE PICCOLE E ADATTATE, non import: kit.js e natura.js del sotterraneo
// tirano dentro suolo.js → motore/mondo-aperto.js (i dati dell'intero mondo di sopra) e i materiali con la nebbia dell'esplorazione
// (vesti.js), e il file del 3D della fattoria si porterebbe dietro mezzo sotterraneo. Qui le stesse forme, le stesse misure
// ricomposte per la fattoria, senza trame (i colori stanno nei vertici, a flat shading come tutto il resto) e con la palette nostra.
// Se il disegno originale cambia, qui non cambia da sé: la scelta e il perché stanno in docs/fattoria3d/scena.md. Questo file non
// importa dal sotterraneo e non sa niente delle regole. Le funzioni tornano un Group con l'origine al centro dell'impronta, il
// suolo a y = 0 e il davanti verso +z, come modelli.js.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// ── il cantiere: si posano i pezzi (geometria, colore, posto), poi si chiude in UNA mesh per tipo di materiale ──
const MAT_PIENO = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, flatShading: true })
const MAT_DOPPIO = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, flatShading: true, side: THREE.DoubleSide })
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3()

const scatola = (w, h, d) => new THREE.BoxGeometry(w, h, d)
const cilindro = (rt, rb, h, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg)
function triangolo (a, b, c) {                                  // un triangolo da tutte e due le parti (il timpano del tetto)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...b], 3))
  g.computeVertexNormals()
  return g
}

export class Cantiere {
  constructor () { this.liste = { pieno: [], doppio: [] } }
  /** `colore` è un esadecimale (la palette della fattoria); `doppio`: visibile da tutte e due le parti (tendoni, tetti). */
  metti (geo, colore, x = 0, y = 0, z = 0, { rx = 0, ry = 0, rz = 0, s = null, ordine = 'XYZ', doppio = false } = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone()
    _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, ordine)), s ? _s.set(...s) : _s.set(1, 1, 1))
    g.applyMatrix4(_m)
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k)
    if (!g.attributes.normal) g.computeVertexNormals()
    const n = g.attributes.position.count, c = new THREE.Color(colore), a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3))
    this.liste[doppio ? 'doppio' : 'pieno'].push(g)
    geo.dispose()
    return this
  }
  /** Una mesh per materiale, in un gruppo. */
  chiudi () {
    const gruppo = new THREE.Group()
    for (const [nome, lista] of Object.entries(this.liste)) {
      if (!lista.length) continue
      const g = mergeGeometries(lista); for (const x of lista) x.dispose()
      const me = new THREE.Mesh(g, nome === 'doppio' ? MAT_DOPPIO : MAT_PIENO)
      me.castShadow = me.receiveShadow = true; gruppo.add(me)
    }
    this.liste = { pieno: [], doppio: [] }
    return gruppo
  }
}

// il tetto a falde con la cresta lungo x: due lastre inclinate con lo sbalzo e i due timpani; `y` è la cima del muro. Torna la cima
function tetto (c, w, d, y, alto, sb, colore, coloreMuro) {
  const m2 = d / 2 + sb, a2 = Math.atan2(alto, m2), L2 = Math.hypot(m2, alto), yy = y - alto * sb / m2
  for (const lato of [-1, 1]) c.metti(scatola(w + sb * 2, 0.07, L2), colore, 0, yy + alto / 2, lato * m2 / 2, { rx: lato * a2, doppio: true })
  for (const lato of [-1, 1]) {
    const x = lato * w / 2 * 0.999
    c.metti(triangolo([x, y, -d / 2], [x, y, d / 2], [x, yy + alto, 0]), coloreMuro, 0, 0, 0, { doppio: true })
  }
  return yy + alto
}

// ── la casa di legno (kit.js: casa): zoccolo di pietra, muri di tronchi, tetto a falde, porta, finestre con le imposte, il camino ──
// 4×3 celle come il vecchio disegno: i muri 3,3×2,4, il tetto con lo sbalzo 3,8×2,9. `userData.fumo`: dove esce il fumo (relativo).
export function casaDiLegno () {
  const c = new Cantiere(), bw = 3.3, bd = 2.4, z0 = 0.3, alt = 1.7
  const LEGNO = 0xb98e62, TRONCO = 0x8f6a45, SCURO = 0x6b4c37, PIETRA = 0xcfc9bf, TEGOLE = 0xc4553a, VETRO = 0xa6d8ee, IMPOSTE = 0x3f8f6a
  c.metti(scatola(bw + 0.08, z0, bd + 0.08), PIETRA, 0, z0 / 2, 0)
  c.metti(scatola(bw, alt, bd), LEGNO, 0, z0 + alt / 2, 0)
  for (let k = 1; k < 6; k++) {                                  // le righe dei tronchi, sulle quattro facce
    const y = z0 + k * alt / 6
    for (const s of [-1, 1]) {
      c.metti(scatola(bw + 0.04, 0.05, 0.04), TRONCO, 0, y, s * (bd / 2 + 0.015))
      c.metti(scatola(0.04, 0.05, bd + 0.04), TRONCO, s * (bw / 2 + 0.015), y, 0)
    }
  }
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.metti(scatola(0.14, alt, 0.14), SCURO, sx * bw / 2, z0 + alt / 2, sz * bd / 2)
  const cima = tetto(c, bw, bd, z0 + alt, 1.1, 0.25, TEGOLE, LEGNO)
  c.metti(scatola(0.62, 1.0, 0.08), SCURO, 0, z0 + 0.5, bd / 2 + 0.03)                    // la porta, l'architrave, la soglia
  c.metti(scatola(0.8, 0.1, 0.12), PIETRA, 0, z0 + 1.05, bd / 2 + 0.04)
  c.metti(scatola(0.8, 0.08, 0.3), PIETRA, 0, 0.04, bd / 2 + 0.18)
  const finestra = (x, y, z, ry) => {
    c.metti(scatola(0.42, 0.44, 0.05), VETRO, x, y, z, { ry })
    for (const s of [-1, 1]) c.metti(scatola(0.2, 0.48, 0.04), IMPOSTE, x + Math.cos(ry) * s * 0.33, y, z - Math.sin(ry) * s * 0.33, { ry })
  }
  const yf = z0 + 0.85
  for (const x of [-1.1, 1.1]) finestra(x, yf, bd / 2 + 0.03, 0)
  for (const s of [-1, 1]) finestra(s * (bw / 2 + 0.03), yf, 0, Math.PI / 2)
  const sx = -bw * 0.3, hc = cima - z0 - alt + 0.4                                         // il camino sulla cresta
  c.metti(scatola(0.36, hc + 0.3, 0.36), 0xb8aea4, sx, z0 + alt + hc / 2 - 0.15, 0)
  c.metti(scatola(0.46, 0.06, 0.46), 0x8c8279, sx, z0 + alt + hc + 0.15, 0)
  const g = c.chiudi()
  g.userData.altezza = 3.5
  g.userData.fumo = new THREE.Vector3(sx, z0 + alt + hc + 0.3, 0)
  return g
}

// ── il banco della guaritrice (kit.js: bottega 'erbe'): il banco col piano di legno, quattro pali, il tendone a strisce verdi e
// bianche, le boccette, le erbe appese e un cesto di paglia. 2×1 celle. Sul banco anche una cassetta di frutta colorata. ──
export function bancoDellaGuaritrice () {
  const c = new Cantiere(), w = 2, d = 1
  const LEGNO = 0xa77a44, SCURO = 0x6b4c37, VERDE = 0x5da35e, BIANCO = 0xfff7ea
  for (const [sx, sz, h] of [[-1, 1, 1.75], [1, 1, 1.75], [-1, -1, 2.05], [1, -1, 2.05]]) c.metti(cilindro(0.05, 0.05, h, 6), SCURO, sx * (w / 2 - 0.2), h / 2, sz * 0.35)
  c.metti(scatola(w - 0.3, 0.8, 0.5), 0x8a5a2b, 0, 0.4, 0.1)
  c.metti(scatola(w - 0.1, 0.06, 0.62), LEGNO, 0, 0.83, 0.1)
  const L = Math.hypot(1.05, 0.36), inclina = Math.atan2(0.36, 1.05), N = 6, largo = (w + 0.3) / N
  for (let n = 0; n < N; n++) {                                                            // il tendone a strisce, inclinato in avanti
    const x = -(w + 0.3) / 2 + largo * (n + 0.5), colore = n % 2 ? BIANCO : VERDE
    c.metti(scatola(largo, 0.04, L), colore, x, 1.9, 0.075, { rx: inclina, doppio: true })
    c.metti(scatola(largo, 0.26, 0.03), colore, x, 1.6, 0.61, { doppio: true })
  }
  const vasi = [0x4f9ed8, 0xd8453a, 0x6cc070, 0xf0b52a]                                   // le boccette
  vasi.forEach((col, i) => c.metti(cilindro(0.07, 0.08, 0.22 + (i % 2) * 0.06, 8), col, -0.15 + i * 0.28, 0.99 + (i % 2) * 0.03, 0.1))
  c.metti(scatola(0.42, 0.14, 0.3), 0x9a6a36, -0.62, 0.93, 0.12)                          // la cassetta di frutta
  ;[[0xd8352a, -0.74, 0.1], [0xf0b52a, -0.62, 0.15], [0x7cc044, -0.5, 0.1], [0xd8352a, -0.68, 0.2], [0xf0b52a, -0.56, 0.06]]
    .forEach(([col, x, z]) => c.metti(new THREE.IcosahedronGeometry(0.065, 0), col, x, 1.04, z))
  for (let i = 0; i < 5; i++) c.metti(new THREE.ConeGeometry(0.09, 0.32, 6), [0x5aa84a, 0x7cb850][i % 2], -0.8 + i * 0.4, 1.58, 0.28, { rx: Math.PI })   // le erbe appese
  c.metti(cilindro(0.2, 0.16, 0.28, 10), 0xd9b872, 0.72, 0.14, 0.44)                       // il cesto davanti
  c.metti(scatola(0.4, 0.4, 0.4), 0xb07a42, -0.5, 0.2, -0.28, { ry: 0.3 })                  // una cassa dietro
  const g = c.chiudi()
  g.userData.altezza = 2.1
  return g
}

// ── la bacheca delle taglie (ponti.js: bacheca): due pali, la tavola col tettuccio. I foglietti appuntati sono a parte, perché
// il loro numero e il loro colore cambiano: `userData.mostraFogli(n, colori)` ne accende da 0 a 6, ognuno verde, rosa o giallo come
// il biglietto nel foglio degli ordini (dati/ordini.js `tipoDelOrdine`). Una geometria e tre materiali per tutte le bacheche. 2×1 celle. ──
export const FOGLI_BACHECA = 6
let _geoFoglio = null, _geoSpillo = null, _matFogli = null, _matSpillo = null
function partiDeiFogli () {
  if (!_geoFoglio) {
    _geoFoglio = new THREE.BoxGeometry(0.4, 0.4, 0.02); _geoSpillo = new THREE.SphereGeometry(0.035, 6, 5)
    const m = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, side: THREE.DoubleSide })
    _matFogli = { verde: m(0xb7e08a), rosa: m(0xf3b0c4), giallo: m(0xf7e28a) }; _matSpillo = new THREE.MeshStandardMaterial({ color: 0xd24a3a, roughness: 0.6 })
  }
}
export function bachecaDelleTaglie () {
  const c = new Cantiere()
  for (const s of [-1, 1]) c.metti(scatola(0.12, 1.9, 0.12), 0x6b4c37, s * 0.8, 0.95, 0)
  c.metti(scatola(1.7, 1.0, 0.08), 0x9a7650, 0, 1.25, 0.04)
  for (const s of [-1, 1]) c.metti(scatola(2.0, 0.05, 0.42), 0x8c4a3a, 0, 2.01, s * 0.15, { rx: s * 0.5, doppio: true })
  const g = c.chiudi()
  partiDeiFogli()
  // due file da tre, appena storti: 6 posti, 2 mesh l'uno (il biglietto e la puntina)
  const fogli = [[-0.55, 1.5, 0.06], [0, 1.52, -0.04], [0.55, 1.5, 0.05], [-0.55, 1.0, -0.05], [0, 0.98, 0.07], [0.55, 1.0, -0.03]].map(([x, y, r]) => {
    const f = new THREE.Group(); f.position.set(x, y, 0.1); f.rotation.z = r
    const foglio = new THREE.Mesh(_geoFoglio, _matFogli.verde); foglio.castShadow = true; f.add(foglio)
    const p = new THREE.Mesh(_geoSpillo, _matSpillo); p.position.set(0, 0.16, 0.02); f.add(p)
    f.userData.carta = foglio
    g.add(f); return f
  })
  g.userData.fogli = fogli
  g.userData.mostraFogli = (n, colori = []) => fogli.forEach((f, i) => { f.visible = i < n; f.userData.carta.material = _matFogli[colori[i]] || _matFogli.verde })
  g.userData.mostraFogli(3)
  g.userData.altezza = 2.3
  return g
}

// ── il cespuglio (natura.js: GEO.cespuglio): tre macchie tonde un po' storte. Una geometria sola per le istanze del terreno. Il
// colore dei vertici è solo luce e ombra (grigi): il verde lo mette l'istanza, con la palette del terreno. ──
const rumore = (x, y, z, seme) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seme * 4.1414) * 43758.5453; return s - Math.floor(s) }
function macchia (r, seme, storto = 0.18) {
  const g = new THREE.IcosahedronGeometry(r, 1), p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + (rumore(x * 9, y * 9, z * 9, seme) - 0.5) * storto * 2
    p.setXYZ(i, x * k, y * k * 0.92, z * k)
  }
  return g
}
let _cespuglio = null
export function geometriaCespuglio () {
  if (_cespuglio) return _cespuglio
  const c = new Cantiere()
  c.metti(macchia(0.32, 7), 0xffffff, 0, 0.2, 0)
  c.metti(macchia(0.25, 8), 0xffffff, 0.25, 0.15, 0.1)
  c.metti(macchia(0.22, 9), 0xdddddd, -0.2, 0.14, 0.12)
  _cespuglio = mergeGeometries(c.liste.pieno); for (const x of c.liste.pieno) x.dispose()
  const pos = _cespuglio.attributes.position, col = _cespuglio.attributes.color         // più scuro in basso, più chiaro in cima
  for (let i = 0; i < col.count; i++) { const k = 0.8 + 0.4 * Math.min(1, Math.max(0, pos.getY(i) / 0.5)); col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k) }
  return _cespuglio
}

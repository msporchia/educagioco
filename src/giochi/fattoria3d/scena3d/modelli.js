// I pezzi della fattoria 3D, tutti in codice: niente sprite, niente immagini. Ogni costruttore torna un Group con
// l'origine al centro dell'impronta e il davanti verso +z (la telecamera guarda da lì). Non sa niente delle regole: riceve
// gli stati già decisi (le tessere del campo, le pecore). Vedi docs/fattoria3d/scena.md.
import * as THREE from 'three'
import { PECORE } from '../dati/regole.js'
import { ANIMALI } from '../dati/animali.js'
import { statoDaFine, statoPecora, progressoBestia, progressoPecora, stadioBestia, profiloBestia, avvicina } from './bestie-puro.js'
import { casaDiLegno, bancoDellaGuaritrice, bachecaDelleTaglie } from './dal-sotterraneo.js'
import { fondiPerMateriale } from './fondi.js'
import { memoModello } from './cache-modelli.js'

// ── materiali e mattoncini ──
const cache = new Map()
export function mat (colore, o = {}) {
  const k = colore + JSON.stringify(o)
  if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial({ color: colore, roughness: 0.9, metalness: 0, flatShading: true, ...o }))
  return cache.get(k)
}
function pronto (m) { m.castShadow = true; m.receiveShadow = true; return m }
function scatola (g, w, h, d, m, x = 0, y = 0, z = 0) {
  const o = pronto(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); o.position.set(x, y, z); g.add(o); return o
}
function cilindro (g, rs, ri, h, m, x = 0, y = 0, z = 0, seg = 12) {
  const o = pronto(new THREE.Mesh(new THREE.CylinderGeometry(rs, ri, h, seg), m)); o.position.set(x, y, z); g.add(o); return o
}
function cono (g, r, h, m, x = 0, y = 0, z = 0, seg = 10) {
  const o = pronto(new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), m)); o.position.set(x, y, z); g.add(o); return o
}
function sfera (g, r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, seg = 12) {
  const o = pronto(new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 4)), m)); o.position.set(x, y, z); o.scale.set(sx, sy, sz); g.add(o); return o
}
function timpano (g, larghezza, altezza, spessore, m, x, y, z) {
  const s = new THREE.Shape(); s.moveTo(-larghezza / 2, 0); s.lineTo(larghezza / 2, 0); s.lineTo(0, altezza); s.closePath()
  const geo = new THREE.ExtrudeGeometry(s, { depth: spessore, bevelEnabled: false }); geo.translate(0, 0, -spessore / 2)
  const o = pronto(new THREE.Mesh(geo, m)); o.rotation.y = Math.PI / 2; o.position.set(x, y, z); g.add(o); return o
}
/** Due falde di tetto con la cresta lungo x. */
function tetto (g, larghezza, profondita, y, colore, pendenza = 0.55) {
  const m = mat(colore); const mezzo = profondita / 2
  const lung = mezzo / Math.cos(pendenza)
  for (const s of [1, -1]) {
    const f = scatola(g, larghezza, 0.12, lung, m, 0, y + Math.tan(pendenza) * mezzo / 2, s * mezzo / 2)
    f.rotation.x = s * pendenza
  }
  timpano(g, profondita, Math.tan(pendenza) * mezzo, 0.1, mat(0xf2dfc2), larghezza / 2 - 0.05, y, 0)
  timpano(g, profondita, Math.tan(pendenza) * mezzo, 0.1, mat(0xf2dfc2), -larghezza / 2 + 0.05, y, 0)
  return Math.tan(pendenza) * mezzo
}
export function testoTex (testo, { w = 512, h = 96, sfondo = '#7a4a22', colore = '#fff4d8', px = 56 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const x = c.getContext('2d')
  x.fillStyle = sfondo; x.fillRect(0, 0, w, h)
  x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 6; x.strokeRect(5, 5, w - 10, h - 10)
  x.fillStyle = colore; x.font = `800 ${px}px "Emoji Gioco", system-ui, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'
  x.fillText(testo, w / 2, h / 2 + 3)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}
function insegna (g, testo, larg, alt, x, y, z, o) {
  const m = pronto(new THREE.Mesh(new THREE.PlaneGeometry(larg, alt), new THREE.MeshStandardMaterial({ map: testoTex(testo, o), roughness: 0.8 })))
  m.position.set(x, y, z); g.add(m); return m
}

// ── il campo e le dieci colture: in modelli-colture.js ──
export { ASPETTO, creaCampo, aggiornaCampo, campoMosso } from './modelli-colture.js'

// ── la pasticceria: 4×3, la porta davanti ──
function costruisciPasticceria () {
  const g = new THREE.Group()
  const muro = mat(0xf6e3c8), rosa = mat(0xd9577a), bianco = mat(0xfff7ea), legno = mat(0x7b4a24)
  scatola(g, 3.6, 1.5, 2.2, muro, 0, 0.75, -0.3)
  scatola(g, 3.8, 0.12, 2.4, mat(0xc9b79a), 0, 0.06, -0.3)
  const alt = tetto(g, 3.9, 2.7, 1.5, 0xb4455f, 0.5); g.position.y = 0
  // camino con il fumo che esce dal motore
  scatola(g, 0.38, 0.9, 0.38, mat(0xb06a4a), 1.2, 1.9, -0.7)
  g.userData.fumo = new THREE.Vector3(1.2, 2.45, -0.7)
  // tenda a righe sul davanti
  for (let n = 0; n < 8; n++) {
    const s = scatola(g, 0.42, 0.05, 0.62, n % 2 ? bianco : rosa, -1.47 + n * 0.42, 1.28, 1.12)
    s.rotation.x = 0.3
  }
  for (const x of [-1.6, 1.6]) cilindro(g, 0.04, 0.04, 1.2, legno, x, 0.6, 1.4, 6)
  // porta e finestre
  scatola(g, 0.7, 1.05, 0.08, legno, 0, 0.55, 0.82)
  sfera(g, 0.05, mat(0xf0c040), 0.22, 0.55, 0.88, 1, 1, 1, 6)
  for (const x of [-1.25, 1.25]) {
    scatola(g, 0.7, 0.62, 0.06, mat(0xa6d8ee, { emissive: 0x405a66 }), x, 0.85, 0.82)
    scatola(g, 0.78, 0.05, 0.1, legno, x, 0.52, 0.84); scatola(g, 0.78, 0.05, 0.1, legno, x, 1.18, 0.84)
    scatola(g, 0.05, 0.7, 0.1, legno, x, 0.85, 0.84)
  }
  // il banco fuori, con le torte
  scatola(g, 1.5, 0.5, 0.42, legno, -1.05, 0.25, 1.28)
  for (const x of [-1.5, -1.05, -0.6]) {
    cilindro(g, 0.17, 0.17, 0.1, bianco, x, 0.55, 1.28, 10)
    cilindro(g, 0.14, 0.14, 0.12, mat(0xc77a3c), x, 0.66, 1.28, 10)
    sfera(g, 0.1, mat(0xfff0f4), x, 0.76, 1.28, 1, 0.7, 1, 8)
    sfera(g, 0.035, mat(0xd8212f), x, 0.84, 1.28, 1, 1, 1, 6)
  }
  insegna(g, 'PASTICCERIA', 2.3, 0.4, 0, 1.38, 0.83, { w: 512, h: 90, sfondo: '#a8344f', px: 54 })
  // il dolce gigante sulla cresta, che gira piano
  const dolce = new THREE.Group(); dolce.position.set(0, 1.5 + alt + 0.2, 0)
  cilindro(dolce, 0.3, 0.24, 0.3, mat(0xc77a3c), 0, 0, 0, 10)
  sfera(dolce, 0.34, mat(0xff9cb8), 0, 0.28, 0, 1, 0.75, 1, 12)
  sfera(dolce, 0.2, mat(0xffc4d4), 0, 0.5, 0, 1, 0.8, 1, 10)
  sfera(dolce, 0.07, mat(0xd8212f), 0, 0.68, 0, 1, 1, 1, 8)
  g.add(dolce); g.userData.gira = dolce
  g.userData.altezza = 3.4
  fondiPerMateriale(dolce); fondiPerMateriale(g, { escludi: [dolce] })
  return g
}

// ── la mongolfiera: 3×3, la piattaforma resta, il pallone parte ──
function stricheTex () {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64
  const x = c.getContext('2d'); const col = ['#e85a4f', '#fff2d0', '#3aa6b9', '#fff2d0']
  for (let i = 0; i < 8; i++) { x.fillStyle = col[i % 4]; x.fillRect(i * 32, 0, 32, 64) }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping
  return t
}
function costruisciMongolfiera () {
  const g = new THREE.Group()
  const pietra = mat(0xb9b2a4)
  cilindro(g, 1.35, 1.4, 0.14, pietra, 0, 0.07, 0, 16)
  cilindro(g, 1.0, 1.05, 0.06, mat(0x9d9689), 0, 0.17, 0, 16)
  for (const a of [0.8, 2.4, 3.9, 5.5]) cilindro(g, 0.07, 0.07, 0.4, mat(0x6b4a2a), Math.cos(a) * 1.15, 0.3, Math.sin(a) * 1.15, 6)
  const volo = new THREE.Group()                      // quello che parte: cesta, corde, pallone
  const vimini = mat(0xb98a4a)
  cilindro(volo, 0.46, 0.38, 0.5, vimini, 0, 0.45, 0, 10)
  const bordo = pronto(new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.04, 5, 14), mat(0x8a5a2a))); bordo.rotation.x = Math.PI / 2; bordo.position.y = 0.7; volo.add(bordo)
  scatola(volo, 0.4, 0.14, 0.4, mat(0xd6b06a), 0, 0.82, 0)         // la cassa da portare
  for (const [x, z] of [[0.4, 0.4], [-0.4, 0.4], [0.4, -0.4], [-0.4, -0.4]]) {
    const c = cilindro(volo, 0.012, 0.012, 1.6, mat(0x4a3a2a), x * 0.9, 1.5, z * 0.9, 4)
    c.rotation.set(z * 0.55, 0, -x * 0.55)
  }
  const pallone = pronto(new THREE.Mesh(new THREE.SphereGeometry(1.3, 24, 16), new THREE.MeshStandardMaterial({ map: stricheTex(), roughness: 0.7 })))
  pallone.scale.set(1, 1.18, 1); pallone.position.y = 3.15; volo.add(pallone)
  cilindro(volo, 0.28, 0.18, 0.18, mat(0x3a3a46), 0, 1.65, 0, 8)
  const fiamma = sfera(volo, 0.1, mat(0xffb030, { emissive: 0xff7a10, emissiveIntensity: 1.2 }), 0, 1.85, 0, 1, 1.5, 1, 6)
  g.add(volo)
  g.userData.volo = volo; g.userData.fiamma = fiamma
  g.userData.altezza = 5.6
  fondiPerMateriale(volo, { escludi: [fiamma] }); fondiPerMateriale(g, { escludi: [volo] })
  return g
}


// ── gli edifici unici nuovi: 3×3, il fronte verso +z. Dentro l'impronta (±1,5), come la mongolfiera ──
/** Un edificio che si anima da sé: `anima(dt, tt)` lo chiama pezzi.js. `fumo` è il punto del mondo (relativo) da cui sale. */
function lastra (g, w, d, colore = 0xc9b79a) { return scatola(g, w, 0.1, d, mat(colore), 0, 0.05, 0) }
// i mattoncini, per i modelli delle macchine in modelli-macchine.js
export { pronto, scatola, cilindro, cono, sfera, tetto, insegna, lastra }

function costruisciMulino () {
  const g = new THREE.Group()
  const pietra = mat(0xbdb4a2), legno = mat(0x7b4a24), tela = mat(0xf4ecd8)
  lastra(g, 2.9, 2.9, 0x9d9689)
  cilindro(g, 0.72, 1.05, 2.6, pietra, 0, 1.4, -0.3, 12)
  cilindro(g, 0.9, 0.9, 0.12, mat(0x8a8274), 0, 2.76, -0.3, 12)
  cono(g, 0.95, 1.0, mat(0x8a5a3a), 0, 3.3, -0.3, 12)
  scatola(g, 0.5, 0.85, 0.08, legno, 0, 0.52, 0.7)
  scatola(g, 0.28, 0.3, 0.06, mat(0xa6d8ee), 0, 1.7, 0.4)
  // le pale: quattro bracci con la vela, intorno a un mozzo sul davanti
  const pale = new THREE.Group(); pale.position.set(0, 2.3, 0.62); g.add(pale)
  cilindro(pale, 0.1, 0.1, 0.16, legno, 0, 0, 0, 6).rotation.x = Math.PI / 2
  for (let k = 0; k < 4; k++) {
    const b = new THREE.Group(); b.rotation.z = k * Math.PI / 2; pale.add(b)
    scatola(b, 0.06, 1.3, 0.05, legno, 0, 0.65, 0.03)
    scatola(b, 0.34, 0.95, 0.025, tela, 0.2, 0.78, 0.07)
  }
  // i sacchi di farina a terra
  const sacco = mat(0xf2e9d2)
  for (const [x, z, s] of [[0.95, 0.95, 1], [1.2, 0.55, 0.9], [-1.0, 1.0, 1]]) {
    sfera(g, 0.24, sacco, x, 0.3 * s, z, 1, 1.15, 0.85, 8).scale.multiplyScalar(s)
    sfera(g, 0.07, sacco, x, 0.58 * s, z, 1, 1, 1, 5)
  }
  g.userData.pale = pale; g.userData.anima = function (dt) { this.pale.rotation.z -= dt * 0.5 }
  g.userData.altezza = 4.1
  fondiPerMateriale(pale); fondiPerMateriale(g, { escludi: [pale] })
  return g
}

function costruisciPanificio () {
  const g = new THREE.Group()
  const muro = mat(0xf0c890), mattone = mat(0xa8482e), legno = mat(0x7b4a24)
  lastra(g, 3.0, 2.9)
  scatola(g, 2.7, 1.3, 1.8, muro, -0.1, 0.65, -0.55)
  const falde = new THREE.Group(); falde.position.set(-0.1, 0, -0.55); g.add(falde)
  tetto(falde, 2.8, 1.8, 1.3, 0xb4553a, 0.5)
  // il fumaiolo, che fuma
  scatola(g, 0.3, 0.9, 0.3, mattone, -0.9, 1.7, -0.8)
  g.userData.fumo = new THREE.Vector3(-0.9, 2.2, -0.8)
  // il forno a legna davanti, a destra: cupola di mattoni con la bocca accesa
  scatola(g, 0.95, 0.5, 0.8, mattone, 0.95, 0.25, 0.85)
  const cupola = sfera(g, 0.52, mattone, 0.95, 0.5, 0.85, 1, 0.8, 0.85, 12)
  const bocca = scatola(g, 0.34, 0.26, 0.06, mat(0x2a1a14, { emissive: 0xff6a10, emissiveIntensity: 0.9 }), 0.95, 0.42, 1.28)
  g.userData.bocca = bocca
  // porta, finestra, banco col pane
  scatola(g, 0.6, 0.95, 0.08, legno, -0.55, 0.5, 0.37)
  scatola(g, 0.6, 0.5, 0.06, mat(0xa6d8ee, { emissive: 0x405a66 }), 0.35, 0.9, 0.37)
  scatola(g, 1.2, 0.4, 0.4, legno, -0.7, 0.2, 1.05)
  const pane = mat(0xd89a50)
  for (const x of [-1.05, -0.7, -0.35]) sfera(g, 0.14, pane, x, 0.5, 1.05, 1.5, 0.7, 0.8, 8)
  insegna(g, '🥖 PANE', 1.7, 0.36, -0.1, 1.22, 0.36, { w: 384, h: 80, sfondo: '#8a4a22', px: 48 })
  g.userData.anima = function (dt, tt) { this.bocca.material.emissiveIntensity = 0.8 + Math.sin(tt * 9) * 0.2 }
  g.userData.altezza = 3.0
  fondiPerMateriale(g, { escludi: [bocca] })
  return g
}

function costruisciConserviera () {
  const g = new THREE.Group()
  const legno = mat(0x9a6a3a), scuro = mat(0x6b4426), rame = mat(0xb8683a, { metalness: 0.6, roughness: 0.4 })
  lastra(g, 3.0, 2.9)
  scatola(g, 2.8, 1.2, 1.7, legno, 0, 0.6, -0.55)
  const falde = new THREE.Group(); falde.position.set(0, 0, -0.55); g.add(falde)
  const alt = tetto(falde, 2.9, 1.7, 1.2, 0x5e4a3a, 0.3)
  for (const x of [-1.0, -0.33, 0.33, 1.0]) scatola(g, 0.05, 1.2, 0.04, scuro, x, 0.6, 0.31)     // le assi
  scatola(g, 0.6, 0.95, 0.08, scuro, -0.8, 0.5, 0.32)
  // i vasi di vetro: grandi sul tetto, piccoli sullo scaffale davanti
  const colori = [0xd8352a, 0x8a3aa8, 0x6cb83a, 0xf09a20, 0xe0408a]
  const vasi = colori.map(c => mat(c, { emissive: c, emissiveIntensity: 0.25, roughness: 0.3 }))
  const coperchio = mat(0xe8e0d0)
  const vaso = (x, y, z, r, h, i) => { cilindro(g, r, r, h, vasi[i % vasi.length], x, y + h / 2, z, 8); cilindro(g, r * 1.05, r * 1.05, h * 0.14, coperchio, x, y + h * 1.07, z, 8) }
  const cresta = 1.2 + alt
  for (let i = 0; i < 3; i++) vaso(-0.85 + i * 0.85, cresta - 0.05, -0.55, 0.26, 0.5, i)
  scatola(g, 1.4, 0.4, 0.4, scuro, 0.15, 0.2, 1.0)
  for (let i = 0; i < 5; i++) vaso(-0.4 + i * 0.28, 0.4, 1.0, 0.1, 0.22, i + 2)
  // la caldaia di rame con il suo tubo
  cilindro(g, 0.42, 0.46, 0.8, rame, 1.0, 0.5, 0.95, 12)
  sfera(g, 0.42, rame, 1.0, 0.9, 0.95, 1, 0.7, 1, 12)
  cilindro(g, 0.07, 0.07, 0.8, rame, 1.0, 1.4, 0.95, 6)
  g.userData.fumo = new THREE.Vector3(1.0, 1.85, 0.95)
  insegna(g, '🍯 CONSERVE', 1.7, 0.34, 0.2, 1.05, 0.32, { w: 384, h: 76, sfondo: '#4a6a32', px: 46 })
  g.userData.altezza = cresta + 0.9
  fondiPerMateriale(g)
  return g
}

function costruisciGelateria () {
  const g = new THREE.Group()
  const rosa = mat(0xf29ab6), bianco = mat(0xfff7ea), legno = mat(0x8a5a3a), cialda = mat(0xd9a05a)
  lastra(g, 3.0, 2.9, 0xd8cdb8)
  scatola(g, 2.6, 1.1, 1.5, bianco, 0, 0.55, -0.4)
  for (let n = 0; n < 7; n++) scatola(g, 0.372, 1.1, 0.04, n % 2 ? bianco : rosa, -1.115 + n * 0.372, 0.55, 0.37)
  scatola(g, 2.9, 0.12, 2.0, rosa, 0, 1.2, -0.3)
  scatola(g, 1.9, 0.12, 0.7, bianco, 0, 0.8, 0.44)
  // il tendone a righe e il bancone
  for (let n = 0; n < 8; n++) { const s = scatola(g, 0.36, 0.05, 0.9, n % 2 ? bianco : rosa, -1.26 + n * 0.36, 1.1, 0.95); s.rotation.x = 0.3 }
  for (const x of [-1.35, 1.35]) cilindro(g, 0.04, 0.04, 1.0, legno, x, 0.5, 1.3, 6)
  scatola(g, 2.0, 0.55, 0.5, legno, 0, 0.28, 0.95)
  scatola(g, 2.1, 0.05, 0.6, mat(0xe8d8c0), 0, 0.57, 0.95)
  const gusti = [0xff9cb8, 0xfff0c8, 0x7a4a2a, 0x9ad8a0]
  for (let i = 0; i < 4; i++) { cono(g, 0.09, 0.2, cialda, -0.7 + i * 0.47, 0.72, 0.95, 6).rotation.x = Math.PI; sfera(g, 0.11, mat(gusti[i]), -0.7 + i * 0.47, 0.88, 0.95, 1, 0.9, 1, 8) }
  insegna(g, '🍦 GELATI', 1.6, 0.3, 0, 1.0, 0.4, { w: 384, h: 72, sfondo: '#d9577a', px: 44 })
  // il cono gigante sul tetto, che gira piano
  const cono3 = new THREE.Group(); cono3.position.set(0, 1.26, -0.3)
  cono(cono3, 0.3, 0.8, cialda, 0, 0.4, 0, 8).rotation.x = Math.PI
  sfera(cono3, 0.36, mat(0xff9cb8), 0, 0.92, 0, 1, 0.85, 1, 12)
  sfera(cono3, 0.27, mat(0xfff0c8), 0, 1.22, 0, 1, 0.85, 1, 10)
  sfera(cono3, 0.06, mat(0xd8212f), 0, 1.45, 0, 1, 1, 1, 6)
  g.add(cono3)
  g.userData.cono = cono3; g.userData.anima = function (dt) { this.cono.rotation.y += dt * 0.7 }
  g.userData.altezza = 3.0
  fondiPerMateriale(cono3); fondiPerMateriale(g, { escludi: [cono3] })
  return g
}

/** Il modello di ripiego per un edificio o un pezzo che non ha ancora un disegno: una scatola grigia della sua misura. */
function costruisciSegnaposto (w, d, h = 1) {
  const g = new THREE.Group()
  scatola(g, w - 0.2, h, d - 0.2, mat(0x9a9a9a), 0, h / 2, 0)
  g.userData.altezza = h + 0.6
  return g
}

// ── le decorazioni: aiuola, panchina, pozzo, spaventapasseri ──
function costruisciAiuola () {
  const g = new THREE.Group()
  const sasso = mat(0xb9b2a4)
  cilindro(g, 0.4, 0.4, 0.08, mat(0x5a3a22), 0, 0.04, 0, 10)
  for (let n = 0; n < 8; n++) { const a = n * Math.PI / 4; sfera(g, 0.09, sasso, Math.cos(a) * 0.37, 0.07, Math.sin(a) * 0.37, 1.2, 0.7, 1, 6).rotation.y = -a }
  const fiori = [[0.0, -0.1, 0xd8352a], [0.2, 0.1, 0xfff4d8], [-0.2, 0.12, 0xf29ab6], [0.12, -0.25, 0xf0c52a], [-0.22, -0.18, 0xd8352a], [0.02, 0.28, 0xfff4d8]]
  const gambo = mat(0x4a9a3a)
  fiori.forEach(([x, z, c], n) => {
    const h = 0.22 + (n % 3) * 0.05
    cilindro(g, 0.012, 0.012, h, gambo, x, 0.08 + h / 2, z, 4)
    sfera(g, 0.07, mat(c), x, 0.1 + h, z, 1, n % 2 ? 0.55 : 1.1, 1, 6)
    if (c === 0xfff4d8) sfera(g, 0.03, mat(0xf0b020), x, 0.12 + h, z, 1, 1, 1, 4)
  })
  g.userData.altezza = 0.8
  fondiPerMateriale(g)
  return g
}
function costruisciPanchina () {
  const g = new THREE.Group()
  const legno = mat(0x9a6a36), ferro = mat(0x3a3a42)
  for (const z of [-0.12, 0, 0.12]) scatola(g, 1.6, 0.05, 0.1, legno, 0, 0.42, z + 0.05)
  for (const y of [0.62, 0.78]) scatola(g, 1.6, 0.1, 0.04, legno, 0, y, -0.16)
  for (const x of [-0.7, 0.7]) {
    scatola(g, 0.06, 0.4, 0.4, ferro, x, 0.2, 0.05)
    scatola(g, 0.06, 0.45, 0.05, ferro, x, 0.62, -0.16)
  }
  g.userData.altezza = 1.1
  fondiPerMateriale(g)
  return g
}
function costruisciPozzo () {
  const g = new THREE.Group()
  const pietra = mat(0xb9b2a4), legno = mat(0x7b4a24)
  cilindro(g, 0.4, 0.43, 0.5, pietra, 0, 0.25, 0, 12)
  cilindro(g, 0.3, 0.3, 0.03, mat(0x2a5a78, { emissive: 0x0a2a3a }), 0, 0.5, 0, 12)
  for (const x of [-0.38, 0.38]) scatola(g, 0.06, 0.9, 0.06, legno, x, 0.95, 0)
  tetto(g, 1.0, 0.7, 1.4, 0xb4553a, 0.6)
  const asse = cilindro(g, 0.03, 0.03, 0.8, legno, 0, 1.2, 0, 6); asse.rotation.z = Math.PI / 2
  cilindro(g, 0.006, 0.006, 0.42, mat(0x4a3a2a), 0, 0.98, 0, 3)
  cilindro(g, 0.1, 0.08, 0.13, mat(0x8a5a2a), 0, 0.72, 0, 8)
  g.userData.altezza = 2.1
  fondiPerMateriale(g)
  return g
}
function costruisciSpaventapasseri () {
  const g = new THREE.Group()
  const legno = mat(0x8a5a2b), paglia = mat(0xe6c36a)
  cilindro(g, 0.03, 0.04, 1.5, legno, 0, 0.75, 0, 5)
  const corpo = new THREE.Group(); corpo.position.y = 1.0; g.add(corpo)
  scatola(corpo, 0.9, 0.05, 0.05, legno, 0, 0.1, 0)
  scatola(corpo, 0.44, 0.5, 0.2, mat(0x3a62b0), 0, 0, 0)
  scatola(corpo, 0.14, 0.14, 0.02, mat(0xd24a3a), 0.1, 0.06, 0.11)
  scatola(corpo, 0.12, 0.16, 0.02, mat(0xf0c52a), -0.1, -0.12, 0.11)
  for (const s of [-1, 1]) { cilindro(corpo, 0.03, 0.05, 0.14, paglia, s * 0.42, 0.1, 0, 5).rotation.z = s * Math.PI / 2; cono(corpo, 0.05, 0.1, paglia, s * 0.18, -0.3, 0, 5).rotation.x = Math.PI }
  sfera(corpo, 0.15, mat(0xe8cf8a), 0, 0.42, 0, 1, 1, 1, 8)
  cilindro(corpo, 0.26, 0.26, 0.03, paglia, 0, 0.55, 0, 10)
  cilindro(corpo, 0.13, 0.15, 0.14, paglia, 0, 0.63, 0, 8)
  g.userData.corpo = corpo; g.userData.anima = function (t) { this.corpo.rotation.z = Math.sin(t * 1.4) * 0.05 }
  g.userData.altezza = 1.8
  fondiPerMateriale(corpo); fondiPerMateriale(g, { escludi: [corpo] })
  return g
}

// ── la bancarella: 2×1. Il banco della guaritrice del Sotterraneo (dal-sotterraneo.js); il disegno di prima resta per il catalogo ──
function costruisciBancarella () { return bancoDellaGuaritrice() }
/** La bacheca delle taglie: 2×1; `userData.mostraFogli(n)` accende i foglietti appuntati (gli ordini aperti). */
function costruisciBacheca () { return bachecaDelleTaglie() }
export function creaBancarellaVecchia () {
  const g = new THREE.Group()
  const legno = mat(0x8a5a2b), rosso = mat(0xd24a3a), bianco = mat(0xfff7ea)
  scatola(g, 1.7, 0.5, 0.55, legno, 0, 0.25, 0.1)
  scatola(g, 1.8, 0.06, 0.65, mat(0xa77a44), 0, 0.53, 0.1)
  for (const x of [-0.85, 0.85]) cilindro(g, 0.04, 0.04, 1.4, legno, x, 0.7, -0.15, 6)
  for (let n = 0; n < 6; n++) { const s = scatola(g, 0.31, 0.04, 0.8, n % 2 ? bianco : rosso, -0.77 + n * 0.31, 1.38, 0.18); s.rotation.x = 0.28 }
  for (const [x, c] of [[-0.45, 0xd8352a], [0, 0x7cc044], [0.45, 0xf0b52a]]) {
    scatola(g, 0.4, 0.14, 0.34, mat(0x9a6a36), x, 0.63, 0.1)
    for (let a = 0; a < 5; a++) sfera(g, 0.075, mat(c), x - 0.12 + (a % 3) * 0.12, 0.76, 0.1 + (a < 3 ? -0.06 : 0.07), 1, 1, 1, 8)
  }
  g.userData.altezza = 1.7
  return g
}

// ── il trattore: 2×2, rosso con le ruote grandi dietro; si tocca e porta ai vicini ──
function costruisciTrattore () {
  const g = new THREE.Group()
  const rosso = mat(0xd23a2a), scuro = mat(0x2a2622), giallo = mat(0xf0c030), vetro = mat(0xbfe3f0, { roughness: 0.3 }), grigio = mat(0x8a8a8a)
  scatola(g, 0.8, 0.42, 1.35, rosso, 0, 0.58, 0.28)                                    // il cofano
  scatola(g, 0.82, 0.05, 1.0, grigio, 0, 0.82, 0.38)                                   // la griglia in cima
  scatola(g, 0.7, 0.55, 0.6, rosso, 0, 0.95, -0.42)                                    // la cabina
  scatola(g, 0.74, 0.06, 0.66, scuro, 0, 1.25, -0.42)                                  // il tettuccio
  scatola(g, 0.6, 0.32, 0.02, vetro, 0, 1.0, -0.12)                                    // il parabrezza
  cilindro(g, 0.035, 0.035, 0.45, scuro, 0.25, 1.05, 0.55, 6)                           // lo scarico
  for (const x of [-0.5, 0.5]) {
    const dietro = cilindro(g, 0.5, 0.5, 0.22, scuro, x, 0.5, -0.55, 16); dietro.rotation.z = Math.PI / 2
    const c1 = cilindro(g, 0.24, 0.24, 0.24, giallo, x, 0.5, -0.55, 12); c1.rotation.z = Math.PI / 2
    const davanti = cilindro(g, 0.3, 0.3, 0.16, scuro, x * 0.92, 0.3, 0.85, 14); davanti.rotation.z = Math.PI / 2
    const c2 = cilindro(g, 0.14, 0.14, 0.18, giallo, x * 0.92, 0.3, 0.85, 10); c2.rotation.z = Math.PI / 2
  }
  scatola(g, 0.09, 0.09, 0.09, giallo, 0.28, 0.72, 1.0)                                // un faro
  scatola(g, 0.09, 0.09, 0.09, giallo, -0.28, 0.72, 1.0)
  g.userData.altezza = 1.8
  fondiPerMateriale(g)
  return g
}

// ── la cassa di un vicino (1×1): una cassa di legno con le assi e un nastro giallo; si riempie toccandola ──
function costruisciCassa () {
  const g = new THREE.Group()
  const legno = mat(0xb9803f), scuro = mat(0x8a5a2b), nastro = mat(0xf0c030)
  scatola(g, 0.8, 0.5, 0.8, legno, 0, 0.25, 0)
  for (const y of [0.1, 0.4]) scatola(g, 0.84, 0.06, 0.84, scuro, 0, y, 0)
  for (const [x, z] of [[-0.39, -0.39], [0.39, -0.39], [-0.39, 0.39], [0.39, 0.39]]) scatola(g, 0.08, 0.52, 0.08, scuro, x, 0.26, z)
  scatola(g, 0.86, 0.04, 0.16, nastro, 0, 0.52, 0)
  g.userData.altezza = 1.1
  fondiPerMateriale(g)
  return g
}

// ── la fontana: 2×2 ──
function costruisciFontana () {
  const g = new THREE.Group()
  const pietra = mat(0xc4beb0), acqua = mat(0x6cc6e4, { emissive: 0x1a4a60, roughness: 0.2, transparent: true, opacity: 0.9 })
  cilindro(g, 0.95, 1.0, 0.36, pietra, 0, 0.18, 0, 16)
  cilindro(g, 0.8, 0.8, 0.04, acqua, 0, 0.34, 0, 16)
  cilindro(g, 0.14, 0.18, 0.8, pietra, 0, 0.6, 0, 8)
  cilindro(g, 0.48, 0.3, 0.14, pietra, 0, 1.0, 0, 12)
  cilindro(g, 0.4, 0.4, 0.03, acqua, 0, 1.07, 0, 12)
  const gocce = []
  const gm = mat(0xcdf1fb, { emissive: 0x4a8aa0 })
  for (let n = 0; n < 8; n++) gocce.push(sfera(g, 0.04, gm, 0, 1.2, 0, 1, 1, 1, 6))
  g.userData.gocce = gocce
  g.userData.anima = function (t) { this.gocce.forEach((o, n) => {
    const f = ((t * 0.9 + n / this.gocce.length) % 1), a = n * 0.785
    o.position.set(Math.cos(a) * 0.62 * f, 1.15 + Math.sin(f * Math.PI) * 0.5 - f * f * 0.45, Math.sin(a) * 0.62 * f)
  }) }
  g.userData.altezza = 1.6
  fondiPerMateriale(g, { escludi: gocce })
  return g
}

// ── la pecora e il recinto 3×3: agnello → adulta → tosata, la lana ricresce ──
const iniziali = () => [{ eta: 'adulta', t0: Date.now() }]    // solo per il fantasma del recinto
function costruisciPecora () {
  const g = new THREE.Group()
  const lana = mat(0xf5f1e6), scuro = mat(0x3a3a3a), pelle = mat(0xf0b8b0)
  const corpo = new THREE.Group(); corpo.position.y = 0.34; g.add(corpo)
  const pelleM = sfera(corpo, 0.17, pelle, 0, 0, 0, 1.25, 0.9, 0.95, 8)          // si vede quando è tosata
  const fiocchi = new THREE.Group(); corpo.add(fiocchi)
  sfera(fiocchi, 0.2, lana, 0, 0, 0, 1.25, 0.95, 1, 10)
  for (const [x, y, z] of [[0.12, 0.1, 0.1], [-0.12, 0.1, 0.1], [0.12, 0.1, -0.1], [-0.12, 0.1, -0.1], [0, 0.14, 0], [0, 0, 0.18], [0, 0, -0.18]]) sfera(fiocchi, 0.12, lana, x, y, z, 1, 1, 1, 8)
  const testa = new THREE.Group(); testa.position.set(0, 0.06, 0.26); corpo.add(testa)
  sfera(testa, 0.09, scuro, 0, 0, 0.04, 0.9, 1, 1.1, 8)
  sfera(testa, 0.012, mat(0xffffff), 0.05, 0.03, 0.12, 1, 1, 1, 4); sfera(testa, 0.012, mat(0xffffff), -0.05, 0.03, 0.12, 1, 1, 1, 4)
  const orecchie = [scatola(testa, 0.05, 0.03, 0.08, scuro, 0.12, 0.0, 0), scatola(testa, 0.05, 0.03, 0.08, scuro, -0.12, 0.0, 0)]
  orecchie[0].rotation.z = 0.5; orecchie[1].rotation.z = -0.5
  const ricci = [[0.2, 0.2, 0.02], [-0.17, 0.2, 0.12], [0.02, 0.23, -0.16]].map(([x, y, z]) => sfera(corpo, 0.1, lana, x, y, z, 1, 1, 1, 8))   // i riccioli di quando è pronta
  const zampe = []
  for (const [x, z] of [[0.1, 0.12], [-0.1, 0.12], [0.1, -0.12], [-0.1, -0.12]]) {
    const p = new THREE.Group(); p.position.set(x, 0.26, z); g.add(p)
    cilindro(p, 0.025, 0.025, 0.26, scuro, 0, -0.13, 0, 5); zampe.push(p)
  }
  fondiPerMateriale(fiocchi); fondiPerMateriale(testa, { escludi: orecchie })       // la lana e la testa si muovono per intero; le orecchie si abbassano da sole
  g.userData = { zampe, corpo, testa, fiocchi, ricci, orecchie, pelle: pelleM, k: 1, fase: 0, attesa: 1, meta: new THREE.Vector3() }
  segniDiPronta(g, g.userData, { raggio: 0.4, yAlone: 0.05, scint: [0.1, 0.62, 0], sbuffo: [0, 0.4, 0], rSbuffo: 0.4 })
  return g
}
function costruisciRecinto () {
  const g = new THREE.Group()
  scatola(g, 2.8, 0.03, 2.8, mat(0x8fd05c), 0, 0.015, 0).receiveShadow = true
  const legno = mat(0x93622f), m = 3.0 / 2
  const palo = (x, z) => cilindro(g, 0.06, 0.06, 0.75, legno, x, 0.375, z, 6)
  for (let n = 0; n <= 6; n++) { const v = -m + n * 0.5; palo(v, m); palo(v, -m); if (n > 0 && n < 6) { palo(m, v); palo(-m, v) } }
  for (const y of [0.3, 0.58]) {
    scatola(g, 3.1, 0.06, 0.05, legno, 0, y, m); scatola(g, 3.1, 0.06, 0.05, legno, 0, y, -m)
    scatola(g, 0.05, 0.06, 3.1, legno, m, y, 0); scatola(g, 0.05, 0.06, 3.1, legno, -m, y, 0)
  }
  scatola(g, 0.7, 0.2, 0.3, mat(0x7a5a30), 0.8, 0.1, -0.9)             // la mangiatoia
  scatola(g, 0.6, 0.06, 0.2, mat(0xe0c060), 0.8, 0.22, -0.9)
  g.userData.pecore = []
  g.userData.altezza = 1.2
  fondiPerMateriale(g)
  return g
}
const recintoVuoto = memoModello('recinto', costruisciRecinto)
/** Il recinto con le sue pecore (di serie una): il recinto vuoto è il modello in cache, le pecore si aggiungono a ogni istanza. */
export function creaRecinto (stati) { const g = recintoVuoto(); sincronizzaPecore(g, stati || iniziali()); return g }
/** Tiene tante pecore in scena quante ne dicono gli stati (una nascita ne aggiunge una). */
export function sincronizzaPecore (g, stati) {
  const lista = g.userData.pecore
  while (lista.length < stati.length) {
    const p = creaPecora(), u = p.userData, k = lista.length
    p.position.set(-0.7 + (k % 2) * 1.2 + (Math.random() - 0.5) * 0.4, 0, -0.1 + Math.floor(k / 2) * 0.9)
    u.meta.copy(p.position); u.fase = Math.random() * 6; u.k = stati[k].eta === 'agnello' ? 0.62 : 1
    g.add(p); lista.push(p)
  }
  while (lista.length > stati.length) g.remove(lista.pop())
}
/** Le pecore vagano dentro il recinto; se `verso` c'è, una corre verso quel punto. Il corpo segue lo stato. */
export function muoviPecore (g, dt, t, verso, stati, adesso) {
  g.userData.pecore.forEach((p, n) => {
    const u = p.userData, st = stati[n] || { eta: 'adulta', t0: adesso }
    // lo stato: la taglia cresce piano; la lana ricresce dal pasto (`t0` null: tosata e affamata, niente lana) in tre stadi
    // (bestie-puro.js, docs/fattoria3d/animali.md): a fame pelle rosa magra e orecchie giù, poi la nuvola che si ingrossa a gradini,
    // da pronta grande, coi riccioli e lo scintillio. Il profilo è smussato col tempo, e raccogliere (tosare) è uno sbuffo.
    const adulta = st.eta === 'adulta'
    const stato = adulta ? statoPecora(st.t0, adesso, PECORE.laneMs) : 'lavora', livello = adulta ? progressoPecora(st.t0, adesso, PECORE.laneMs) : 0.6
    const stadio = stadioBestia(stato, livello)
    const pr = avvicina(u.pr || (u.pr = {}), profiloBestia('pecora', stadio, livello, u.tg || (u.tg = {})), dt, VELOCI)
    u.k += ((st.eta === 'agnello' ? 0.62 : 1) - u.k) * Math.min(1, dt * 3)
    const lento = pr.lento
    p.scale.setScalar(u.k); u.testa.scale.setScalar(st.eta === 'agnello' ? 1.3 : 1)
    u.fiocchi.visible = pr.lana > 0.03; u.fiocchi.scale.setScalar(Math.max(0.01, pr.lana))
    u.ricci.forEach((r, i) => { const q = pr['ricci' + i]; r.visible = q > 0.03; r.scale.setScalar(Math.max(0.01, q)) })
    u.pelle.visible = pr.lana < 0.9; u.pelle.scale.set(1.25 * pr.pelleX, 0.9 * pr.pelleY, 0.95 * pr.pelleZ)
    u.orecchie[0].rotation.z = pr.orecchie; u.orecchie[1].rotation.z = -pr.orecchie
    u.testa.position.z = 0.26 - 0.6 * (1 - pr.pelleZ)                    // la testa segue la pelle quando la pecora è magra (le parti si toccano)
    animaSegni(u, pr, stadio, dt, t, n)
    // il movimento
    u.attesa -= dt
    if (verso && !u.corri && n === 0) { u.meta.set(Math.max(-1.1, Math.min(1.1, verso.x)), 0, Math.max(-1.1, Math.min(1.1, verso.z))); u.corri = 2.2; u.attesa = 3 }
    if (u.corri) u.corri -= dt
    if (u.attesa <= 0) { u.meta.set((Math.random() - 0.5) * 2.4, 0, (Math.random() - 0.5) * 2.2); u.attesa = 2 + Math.random() * 4 }
    const dx = u.meta.x - p.position.x, dz = u.meta.z - p.position.z, d = Math.hypot(dx, dz)
    const mov = d > 0.06
    if (mov) {
      const v = Math.min(d, (u.corri ? 1.3 : 0.45) * lento * dt)
      p.position.x += dx / d * v; p.position.z += dz / d * v
      const a = Math.atan2(dx, dz); let da = a - p.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); p.rotation.y += da * Math.min(1, dt * 6)
    }
    u.fase += dt * lento * (mov ? (u.corri ? 12 : 6) : 0)
    u.zampe.forEach((z, k) => { z.rotation.x = mov ? Math.sin(u.fase + (k % 3 ? Math.PI : 0)) * 0.5 : 0 })
    u.corpo.position.y = 0.34 + pr.corpoY + (mov ? Math.abs(Math.sin(u.fase)) * 0.03 : 0)
    u.testa.rotation.x = pr.testaX + (mov ? 0.35 * (1 - pr.f) : (Math.max(0, Math.sin(t * 0.8 * lento + p.position.x * 3)) * 0.5) * pr.f)   // ogni tanto bruca; affamata, la testa sta giù
  })
}

// ── gli animali da cortile: pollaio 3×2 (galline), stalla 4×3 (mucche), caseificio 3×3. Le bestie seguono gli stati del
//    motore (`{ fine }`: null ha fame, passata è pronta) e si animano col tempo; un uovo o un secchio di latte ricorda che
//    c'è da raccogliere. Poche mesh, geometrie condivise. Vedi docs/fattoria3d/animali.md ──
const G_CORPO = new THREE.SphereGeometry(0.11, 8, 6), G_TESTA = new THREE.SphereGeometry(0.06, 7, 5)
const G_BECCO = new THREE.ConeGeometry(0.022, 0.07, 4).rotateX(Math.PI / 2), G_CODA = new THREE.ConeGeometry(0.05, 0.15, 4)
const G_ZAMPA = new THREE.CylinderGeometry(0.008, 0.008, 0.1, 3), G_UOVO = new THREE.SphereGeometry(0.045, 8, 6)
function parte (g, geo, m, x, y, z) { const o = pronto(new THREE.Mesh(geo, m)); o.position.set(x, y, z); g.add(o); return o }

// i segni dello stadio «pronta», uguali per ogni bestia (docs/fattoria3d/animali.md, «I tre stadi»): un alone chiaro a terra, uno
// scintillio che compare ogni tanto, e lo sbuffo di quando si raccoglie. Sono mesh sue (niente fusione), geometrie e materiali condivisi.
const G_ALONE = new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2), G_SCINT = new THREE.OctahedronGeometry(0.06, 0)
const M_ALONE = new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.5, depthWrite: false })
const M_SCINT = new THREE.MeshBasicMaterial({ color: 0xfff3a0 }), M_SBUFFO = new THREE.MeshBasicMaterial({ color: 0xffffff })
const VELOCI = { dono: true, uovo: true }                     // il prodotto compare e sparisce in fretta (profilo: bestie-puro.js `avvicina`)
function segniDiPronta (g, u, { raggio, yAlone, scint, sbuffo, rSbuffo }) {
  const alone = new THREE.Mesh(G_ALONE, M_ALONE); alone.position.y = yAlone; alone.visible = false; g.add(alone)
  const scintilla = new THREE.Mesh(G_SCINT, M_SCINT); scintilla.position.set(...scint); scintilla.visible = false; g.add(scintilla)
  const sb = new THREE.Mesh(G_TESTA, M_SBUFFO); sb.position.set(...sbuffo); sb.visible = false; g.add(sb)
  Object.assign(u, { alone, scintilla, sbuffo: sb, aloneR: raggio, scintY: scint[1], rSbuffo, sb: 0, stadio: -1 })
}
/** Alone, scintillio e sbuffo del raccolto (si chiama dopo il profilo: `pr` è il profilo smussato). */
function animaSegni (u, pr, stadio, dt, t, n) {
  if (u.stadio === 2 && stadio < 2) u.sb = 1                  // appena raccolta: lo sbuffo (l'uovo, il latte, la lana volano via)
  u.stadio = stadio
  const ka = pr.alone * u.aloneR * (1 + 0.05 * Math.sin(t * 3 + n))
  u.alone.visible = ka > 0.02; u.alone.scale.set(ka, 1, ka)
  const imp = Math.max(0, Math.sin(t * 2.4 + n * 2.1)), ks = pr.scintilla * imp * imp * 1.3
  u.scintilla.visible = ks > 0.03; u.scintilla.scale.setScalar(ks); u.scintilla.rotation.y += dt * 5; u.scintilla.position.y = u.scintY + imp * 0.06
  if (u.sb > 0) {
    u.sb = Math.max(0, u.sb - dt * 2.2); const q = 1 - u.sb, k = Math.sin(Math.PI * q) * (0.4 + 0.8 * q) * u.rSbuffo
    u.sbuffo.visible = k > 0.01; u.sbuffo.scale.setScalar(k)
  } else u.sbuffo.visible = false
}

export { parte, segniDiPronta, animaSegni, VELOCI }       // per modelli-cortile.js (anatre, maiali, capre: stessi segni dello stadio «pronta»)

function costruisciGallina (k = 0) {
  const g = new THREE.Group()
  const penne = mat(k % 2 ? 0xb9703c : 0xf6f1e4), rosso = mat(0xd8352a), giallo = mat(0xf0b030)
  const alto = new THREE.Group(); g.add(alto)                                          // tutto ciò che si alza insieme al corpo
  const corpo = parte(alto, G_CORPO, penne, 0, 0.17, 0); corpo.scale.set(1, 0.9, 1.25)
  const coda = parte(alto, G_CODA, penne, 0, 0.24, -0.15); coda.rotation.x = -0.9
  const testa = new THREE.Group(); testa.position.set(0, 0.25, 0.13); alto.add(testa)
  parte(testa, G_TESTA, penne, 0, 0.03, 0.02)
  parte(testa, G_BECCO, giallo, 0, 0.025, 0.1)
  const cresta = scatola(testa, 0.02, 0.04, 0.05, rosso, 0, 0.1, 0.02)
  const zampe = []
  for (const s of [-1, 1]) zampe.push(parte(g, G_ZAMPA, giallo, s * 0.04, 0.05, 0.01))
  const uovo = parte(g, G_UOVO, mat(0xffd98a), 0, 0.047, 0.0); uovo.scale.set(0.85, 1.05, 0.85); uovo.visible = false
  fondiPerMateriale(testa, { escludi: [cresta] })                                      // la testa si muove per intero; la cresta si drizza da sola
  g.userData = { alto, corpo, testa, coda, cresta, zampe, uovo, dono: uovo, specie: 'gallina', ms: ANIMALI.pollaio.ms, fase: Math.random() * 6, attesa: Math.random() * 2, meta: new THREE.Vector3(), zona: { x0: -1.15, x1: 1.15, z0: 0.15, z1: 0.8 } }
  segniDiPronta(g, g.userData, { raggio: 0.3, yAlone: 0.085, scint: [0.12, 0.5, 0], sbuffo: [0, 0.15, 0], rSbuffo: 0.2 })
  return g
}

function costruisciPollaio () {
  const g = new THREE.Group()
  const legno = mat(0xa4713e), chiaro = mat(0xc99a5c), terra = mat(0xcdb27a)
  scatola(g, 3.0, 0.04, 2.0, mat(0x8fd05c), 0, 0.02, 0).receiveShadow = true
  scatola(g, 2.5, 0.03, 0.8, terra, 0, 0.05, 0.5)                                      // il tratto di terra battuta dove razzolano
  // la casetta su palafitte, dietro a sinistra
  const casa = new THREE.Group(); casa.position.set(-0.6, 0, -0.45); g.add(casa)
  for (const [x, z] of [[-0.5, -0.32], [0.5, -0.32], [-0.5, 0.32], [0.5, 0.32]]) cilindro(casa, 0.05, 0.05, 0.5, legno, x, 0.25, z, 5)
  scatola(casa, 1.35, 0.8, 0.9, chiaro, 0, 0.9, 0)
  scatola(casa, 0.34, 0.4, 0.06, mat(0x3a2a1a), 0.1, 0.85, 0.46)                         // la porticina
  scatola(casa, 0.26, 0.22, 0.06, mat(0xa6d8ee), -0.4, 1.05, 0.46)
  const falde = new THREE.Group(); falde.position.y = 0; casa.add(falde)
  tetto(falde, 1.6, 1.15, 1.3, 0xb4553a, 0.6)
  // la scaletta con i pioli, dalla porticina a terra
  const scala = scatola(casa, 0.3, 0.05, 0.8, legno, 0.1, 0.45, 0.85); scala.rotation.x = -0.62
  for (let n = 0; n < 4; n++) scatola(casa, 0.3, 0.025, 0.05, mat(0x6a4524), 0.1, 0.25 + n * 0.1, 1.15 - n * 0.14)
  // la mangiatoia e il piccolo steccato a destra
  scatola(g, 0.7, 0.1, 0.22, legno, 0.9, 0.1, -0.45); scatola(g, 0.6, 0.03, 0.14, mat(0xe0c060), 0.9, 0.16, -0.45)
  for (const x of [0.55, 1.45]) cilindro(g, 0.035, 0.035, 0.35, legno, x, 0.2, 0.95, 5)
  scatola(g, 1.0, 0.04, 0.04, legno, 1.0, 0.3, 0.95)
  g.userData.bestie = []; g.userData.crea = creaGallina
  g.userData.posto = k => new THREE.Vector3(-0.9 + (k % 3) * 0.9, 0, 0.35 + Math.floor(k / 3) * 0.36 + (k % 2) * 0.06)   // sei galline: due file di tre sulla terra battuta
  g.userData.altezza = 2.3
  fondiPerMateriale(g)
  return g
}
const pollaioVuoto = memoModello('pollaio', costruisciPollaio)
export function creaPollaio (stati) { const g = pollaioVuoto(); sincronizzaBestie(g, stati || [{ fine: null }]); return g }

// la mucca: bianca a chiazze marroni (un po' diversa per posto), la testa che rumina. Le chiazze sono colori per faccia sul
// corpo stesso (niente mesh sovrapposte: non sporgono); le zampe entrano nella pancia e finiscono in uno zoccolo scuro.
const G_ZAMPA_M = new THREE.CylinderGeometry(0.055, 0.046, 0.34, 5), G_ZOCCOLO = new THREE.CylinderGeometry(0.05, 0.054, 0.08, 5)
const G_MUCCA = new THREE.SphereGeometry(0.3, 9, 7), G_CORNO = new THREE.ConeGeometry(0.03, 0.12, 4)
const SCALA_CORPO = [0.8, 0.78, 1.45]
// chiazze: centro (nel corpo, in metri dal centro) e raggio; due disegni, uno per parità del posto
const CHIAZZE = [
  [[0.2, 0.2, -0.12, 0.2], [-0.24, 0.05, 0.22, 0.17], [0.05, 0.24, 0.3, 0.1], [-0.08, 0.2, -0.38, 0.12]],
  [[-0.2, 0.22, 0.05, 0.22], [0.25, 0.0, -0.2, 0.16], [0.12, 0.1, 0.38, 0.12], [-0.05, -0.12, -0.3, 0.1]]]
const MANTI = new Map()
function mantoDelCorpo (k) {
  const v = k % 2
  if (!MANTI.has(v)) {
    const geo = new THREE.SphereGeometry(0.3, 14, 10).toNonIndexed(), pos = geo.attributes.position
    const bianco = new THREE.Color(0xf7f3ea), macchia = new THREE.Color(v ? 0x6b4426 : 0x3a2a22), col = new Float32Array(pos.count * 3)
    for (let f = 0; f < pos.count; f += 3) {
      let x = 0, y = 0, z = 0
      for (let n = 0; n < 3; n++) { x += pos.getX(f + n); y += pos.getY(f + n); z += pos.getZ(f + n) }
      x = x / 3 * SCALA_CORPO[0]; y = y / 3 * SCALA_CORPO[1]; z = z / 3 * SCALA_CORPO[2]
      const c = CHIAZZE[v].some(([cx, cy, cz, r]) => Math.hypot(x - cx, y - cy, z - cz) < r) ? macchia : bianco
      for (let n = 0; n < 3; n++) { col[(f + n) * 3] = c.r; col[(f + n) * 3 + 1] = c.g; col[(f + n) * 3 + 2] = c.b }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    MANTI.set(v, geo)
  }
  return MANTI.get(v)
}
function costruisciMucca (k = 0) {
  const g = new THREE.Group()
  const bianco = mat(0xf7f3ea), rosa = mat(0xf0b0a8), scuro = mat(0x2a2018)
  const corpo = parte(g, mantoDelCorpo(k), mat(0xffffff, { vertexColors: true }), 0, 0.42, 0); corpo.scale.set(...SCALA_CORPO)
  for (const [x, z] of [[0.12, 0.25], [-0.12, 0.25], [0.12, -0.25], [-0.12, -0.25]]) {
    parte(g, G_ZAMPA_M, bianco, x, 0.23, z); parte(g, G_ZOCCOLO, scuro, x, 0.04, z)
  }
  const mammella = parte(g, G_UOVO, mat(0xff8aa0), 0, 0.15, -0.2); mammella.scale.set(0.1, 0.1, 0.1)       // la mammella rosea: cresce col latte
  const pallida = parte(g, G_UOVO, mat(0xcdb7b3), 0, 0.15, -0.2); pallida.scale.set(1.3, 1.5, 1.3)         // …e quella flaccida e pallida di quando ha fame
  const goccia = parte(g, G_TESTA, mat(0xffffff, { emissive: 0x808080 }), 0, 0.1, -0.2); goccia.scale.setScalar(0.3); goccia.visible = false
  const coda = new THREE.Group(); coda.position.set(0, 0.59, -0.27); coda.rotation.x = 0.35; g.add(coda)   // nasce dal dorso e pende dietro
  cilindro(coda, 0.015, 0.015, 0.4, bianco, 0, -0.2, 0, 4); parte(coda, G_TESTA, scuro, 0, -0.42, 0).scale.setScalar(0.6)
  parte(g, G_MUCCA, bianco, 0, 0.55, 0.38).scale.set(0.45, 0.4, 0.55)                    // il collo: lega la testa al corpo
  const testa = new THREE.Group(); testa.position.set(0, 0.65, 0.5); g.add(testa)
  const t = parte(testa, G_MUCCA, bianco, 0, 0, 0.12); t.scale.set(0.5, 0.5, 0.62)
  parte(testa, G_MUCCA, rosa, 0, -0.07, 0.3).scale.set(0.34, 0.26, 0.28)
  for (const s of [-1, 1]) { const c = parte(testa, G_CORNO, mat(0xe8e0c8), s * 0.13, 0.17, 0.05); c.rotation.z = -s * 0.5; parte(testa, G_TESTA, bianco, s * 0.18, 0.08, 0.02).scale.set(1.1, 0.5, 0.6) }
  for (const s of [-1, 1]) parte(testa, G_TESTA, scuro, s * 0.07, 0.06, 0.28).scale.setScalar(0.35)
  const secchio = new THREE.Group(); secchio.position.set(0.46, 0, 0.3); g.add(secchio); secchio.visible = false
  cilindro(secchio, 0.1, 0.08, 0.17, mat(0xdde4ea, { metalness: 0.4, roughness: 0.5 }), 0, 0.085, 0, 8)
  cilindro(secchio, 0.085, 0.085, 0.02, mat(0xffffff), 0, 0.17, 0, 8)
  fondiPerMateriale(testa); fondiPerMateriale(coda); fondiPerMateriale(g, { escludi: [corpo, testa, coda, secchio, mammella, pallida, goccia] })
  g.userData = { corpo, testa, coda, mammella, pallida, goccia, dono: secchio, specie: 'mucca', ms: ANIMALI.stalla.ms, fase: Math.random() * 6, meta: new THREE.Vector3() }
  segniDiPronta(g, g.userData, { raggio: 0.5, yAlone: 0.03, scint: [0.46, 0.4, 0.3], sbuffo: [0.46, 0.2, 0.3], rSbuffo: 0.24 })
  return g
}

const G_PALO = new THREE.CylinderGeometry(0.04, 0.045, 0.68, 6)
function costruisciStalla () {
  const g = new THREE.Group()
  const rosso = mat(0xa8392f), bianco = mat(0xf3e9d4), legno = mat(0x8a5a34), paglia = mat(0xe0c060)
  scatola(g, 3.9, 0.04, 2.9, mat(0x8fd05c), 0, 0.02, 0).receiveShadow = true
  scatola(g, 3.6, 0.02, 1.7, mat(0xcdb27a), 0, 0.05, 0.55)                               // la terra battuta del cortile
  scatola(g, 3.6, 1.5, 1.2, rosso, 0, 0.75, -0.9)
  const falde = new THREE.Group(); falde.position.set(0, 0, -0.9); g.add(falde)
  tetto(falde, 3.9, 1.55, 1.5, 0x8a5a34, 0.6)
  scatola(g, 1.1, 1.1, 0.06, legno, 0, 0.55, -0.27)                                      // il portone con la croce bianca
  for (const s of [1, -1]) { const x = scatola(g, 1.35, 0.07, 0.05, bianco, 0, 0.55, -0.23); x.rotation.z = s * 0.7 }
  scatola(g, 1.1, 0.07, 0.05, bianco, 0, 1.12, -0.23)
  scatola(g, 0.5, 0.45, 0.06, mat(0xa6d8ee), 1.25, 0.95, -0.27)
  // la mangiatoia contro il muro (le mucche le stanno davanti) e due balle di fieno negli angoli
  scatola(g, 1.5, 0.2, 0.26, legno, 0, 0.1, -0.16); scatola(g, 1.4, 0.05, 0.18, paglia, 0, 0.21, -0.16)
  for (const x of [1.62, -1.62]) { const b = cilindro(g, 0.2, 0.2, 0.4, paglia, x, 0.24, -0.08, 8); b.rotation.z = Math.PI / 2 }
  // lo steccato basso che chiude il cortile, dal muro del fienile al muro, col cancelletto in mezzo davanti
  const X = 1.85, Zf = 1.42, Zm = -0.28, Gx = 0.38
  const palo = (x, z) => parte(g, G_PALO, legno, x, 0.34, z)
  const sbarra = (lx, lz, x, z, y, m = legno) => scatola(g, lx, 0.06, lz, m, x, y, z)
  for (const s of [-1, 1]) {
    for (const x of [X, 1.36, 0.87, Gx]) palo(s * x, Zf)                                // il davanti, due tratti
    for (let n = 0; n < 5; n++) palo(s * X, Zf - (Zf - Zm) * (n + 1) / 5)                // il fianco, fino al fienile
    for (const y of [0.26, 0.5]) { sbarra(X - Gx, 0.05, s * (X + Gx) / 2, Zf, y); sbarra(0.05, Zf - Zm, s * X, (Zf + Zm) / 2, y) }
  }
  const cancello = mat(0xc99a5c)                                                          // il cancelletto: telaio chiaro con la crociera
  for (const y of [0.22, 0.52]) sbarra(2 * Gx - 0.08, 0.05, 0, Zf, y, cancello)
  const cr = sbarra(0.78, 0.04, 0, Zf, 0.37, cancello); cr.rotation.z = 0.44
  g.userData.bestie = []; g.userData.crea = creaMucca
  g.userData.posto = k => new THREE.Vector3(-1.35 + k * 0.9, 0.05, 0.45)  // quattro mucche in fila nel cortile, davanti al fienile
  g.userData.altezza = 2.9
  fondiPerMateriale(g)
  return g
}
const stallaVuota = memoModello('stalla', costruisciStalla)
export function creaStalla (stati) { const g = stallaVuota(); sincronizzaBestie(g, stati || [{ fine: null }]); return g }

/** Tiene tante bestie in scena quante ne dicono gli stati del motore (una compra ne aggiunge una). */
export function sincronizzaBestie (g, stati) {
  const u = g.userData, lista = u.bestie
  while (lista.length < stati.length) {
    const k = lista.length, b = u.crea(k)
    b.position.copy(u.posto(k)); b.userData.casa = b.position.clone(); b.userData.meta.copy(b.position)
    g.add(b); lista.push(b)
  }
  while (lista.length > stati.length) g.remove(lista.pop())
}
/** Le bestie si muovono col tempo e mostrano il loro stadio (docs/fattoria3d/animali.md, «I tre stadi»): a fame brulle, al lavoro
    in crescita continua col progresso, pronte piene e col prodotto in vista (uovo enorme, secchio del latte). Il profilo è puro
    (bestie-puro.js); qui lo si smussa col tempo e lo si applica ai pezzi, senza allocare. */
export function muoviBestie (g, dt, t, stati, adesso) {
  g.userData.bestie.forEach((b, n) => {
    const u = b.userData, st = stati[n] || { fine: null }
    const stato = statoDaFine(st.fine, adesso), p = progressoBestia(st.fine, adesso, u.ms), stadio = stadioBestia(stato, p)
    const pr = avvicina(u.pr || (u.pr = {}), profiloBestia(u.specie, stadio, p, u.tg || (u.tg = {})), dt, VELOCI)
    if (u.animaBestia) u.animaBestia(b, u, pr, stadio, dt, t, n)       // le bestie di modelli-cortile.js (anatra, maiale, capra) portano la loro animazione
    else if (u.zona) animaGallina(b, u, pr, stadio, dt, t, n)
    else animaMucca(b, u, pr, stadio, dt, t, n)
    animaSegni(u, pr, stadio, dt, t, n)
  })
}
function animaGallina (b, u, pr, stadio, dt, t, n) {
  u.attesa -= dt
  const cova = pr.passo > 0.05
  if (u.attesa <= 0) {
    const z = u.zona
    if (cova) u.meta.set(z.x0 + Math.random() * (z.x1 - z.x0), 0, z.z0 + Math.random() * (z.z1 - z.z0))
    u.attesa = stadio === 0 ? 1 + Math.random() * 2 : 3 + Math.random() * 3                // a fame è agitata, sazia più calma
  }
  const dx = u.meta.x - b.position.x, dz = u.meta.z - b.position.z, d = Math.hypot(dx, dz), mov = cova && d > 0.05
  if (mov) {
    const v = Math.min(d, 0.35 * pr.passo * pr.lento * dt)
    b.position.x += dx / d * v; b.position.z += dz / d * v
    let da = Math.atan2(dx, dz) - b.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); b.rotation.y += da * Math.min(1, dt * 7)
  }
  u.fase += dt * (mov ? 9 * pr.lento : 4 + 3 * (1 - pr.f))
  u.corpo.scale.set(pr.sx, 0.9 * pr.sy, 1.25 * pr.sz)
  u.alto.position.y = pr.altoY + (mov ? Math.abs(Math.sin(u.fase)) * 0.015 : 0)
  u.alto.position.z = pr.altoZ
  u.alto.rotation.z = pr.ondeggia * Math.sin(t * 3 + n) * 0.1                              // sull'uovo dondola, comica
  u.testa.position.set(0, pr.testaY, pr.testaZ)
  const becca = (1 - pr.f) * (1 - pr.f)
  u.testa.rotation.x = pr.testaX + (mov ? Math.sin(u.fase * 1.2) * 0.12 : Math.max(0, Math.sin(u.fase)) * becca)
  u.cresta.scale.set(pr.crestaL, pr.cresta, 1); u.cresta.position.y = 0.08 + 0.02 * pr.cresta
  u.coda.rotation.x = pr.codaR
  const sw = pr.ondeggia * Math.sin(t * 5 + n) * 0.15
  u.zampe.forEach((z, i) => {
    const s = i ? 1 : -1
    z.position.set(s * pr.gX, pr.gAlt - pr.gLen / 2, 0.01); z.scale.y = pr.gLen / 0.1; z.rotation.z = s * (pr.gAperta + sw)
  })
  const e = u.uovo; e.visible = pr.uovo > 0.03
  e.scale.set(0.85 * pr.uovo, 1.05 * pr.uovo, 0.85 * pr.uovo); e.position.y = 0.0473 * pr.uovo; e.position.z = pr.uovoZ
}
function animaMucca (b, u, pr, stadio, dt, t, n) {
  // il tempo dell'animazione è `u.fase`, che avanza più lenta a fame: cambiare velocità non fa scattare le fasi
  const ph = u.fase += dt * pr.lento
  u.corpo.scale.set(SCALA_CORPO[0] * pr.sx, SCALA_CORPO[1] * pr.sy, SCALA_CORPO[2] * pr.sz)
  u.corpo.position.y = 0.42 + pr.corpoY + Math.sin(ph * 0.8 + n) * 0.006
  u.testa.rotation.x = pr.testaX + Math.sin(ph * (stadio === 1 ? 1.3 : 0.7) + n) * (stadio === 0 ? 0.03 : 0.07)
  u.coda.position.y = u.corpo.position.y + 0.17 * pr.sy                                   // la coda e la mammella seguono il corpo quando si restringe (le parti si toccano)
  u.testa.position.y = 0.65 + pr.testaY + Math.sin(ph * 2.6 + n) * (stadio === 1 ? 0.012 : 0.004)    // la mascella
  u.coda.rotation.z = Math.sin(ph * (stadio === 2 ? 2.4 : 1.1) + n * 2) * 0.7 * pr.coda
  const m = pr.mammella; u.mammella.visible = m > 0.03; u.mammella.scale.set(3.6 * m, 2.8 * m, 3.4 * m); u.mammella.position.y = u.corpo.position.y - 0.27 * pr.sy
  const q = pr.pallida; u.pallida.visible = q > 0.03; u.pallida.scale.set(1.3 * q, 1.5 * q, 1.3 * q); u.pallida.position.y = u.mammella.position.y
  const c = (t * 0.9 + n * 0.37) % 1                                                      // ogni tanto una goccia di latte cade
  u.goccia.visible = pr.goccia > 0.5 && c < 0.4
  if (u.goccia.visible) u.goccia.position.y = 0.1 - (c / 0.4) * (c / 0.4) * 0.09
  const d = u.dono; d.visible = pr.dono > 0.03; d.scale.setScalar(pr.dono * 1.5)           // il secchio del latte, più grande del vero
}

function costruisciCaseificio () {
  const g = new THREE.Group()
  const bianco = mat(0xf7f2e6), legno = mat(0x7b4a24), giallo = mat(0xf2c44a), scuro = mat(0xd9a82c)
  lastra(g, 3.0, 2.9, 0xcfc3a8)
  scatola(g, 2.3, 1.15, 1.6, bianco, 0.1, 0.575, -0.55)
  const falde = new THREE.Group(); falde.position.set(0.1, 0, -0.55); g.add(falde)
  const alt = tetto(falde, 2.5, 1.6, 1.15, 0x3f6fb5, 0.5)
  scatola(g, 0.55, 0.9, 0.08, legno, 0.55, 0.45, 0.27)
  scatola(g, 0.5, 0.4, 0.06, mat(0xa6d8ee), -0.4, 0.8, 0.27)
  insegna(g, '🧀 FORMAGGI', 1.7, 0.34, 0.1, 1.28, 0.28, { w: 384, h: 76, sfondo: '#3f6fb5', px: 46 })
  // le forme di formaggio davanti, su un bancale
  scatola(g, 1.5, 0.1, 0.9, legno, 0.1, 0.05, 1.0)
  for (const [x, z, n] of [[-0.35, 1.05, 3], [0.1, 1.0, 2], [0.55, 1.05, 3]]) for (let i = 0; i < n; i++) cilindro(g, 0.24, 0.24, 0.17, i % 2 ? scuro : giallo, x, 0.18 + i * 0.17, z, 10)
  // la ruota ad acqua, a sinistra, che gira piano
  const ruota = new THREE.Group(); ruota.position.set(-1.35, 0.8, -0.5); g.add(ruota)
  const cerchio = pronto(new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 5, 16), legno)); cerchio.rotation.y = Math.PI / 2; ruota.add(cerchio)
  for (let k = 0; k < 4; k++) { const r = scatola(ruota, 0.06, 1.24, 0.06, legno); r.rotation.x = k * Math.PI / 4 }
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; scatola(ruota, 0.34, 0.16, 0.05, legno, 0, Math.cos(a) * 0.62, Math.sin(a) * 0.62).rotation.x = a }
  scatola(g, 0.5, 0.06, 1.6, mat(0x6fb6e8, { transparent: true, opacity: 0.8 }), -1.35, 0.06, -0.2)   // il canaletto
  g.userData.ruota = ruota; g.userData.anima = function (dt) { this.ruota.rotation.x -= dt * 0.9 }
  g.userData.altezza = 1.15 + alt + 0.9
  fondiPerMateriale(ruota); fondiPerMateriale(g, { escludi: [ruota] })
  return g
}

// ── fisse: il fienile, la casa ──
function costruisciFienile () {
  const g = new THREE.Group()
  const rosso = mat(0xa8392f)
  scatola(g, 3.6, 1.6, 2.6, rosso, 0, 0.8, 0)
  tetto(g, 3.9, 3.0, 1.6, 0x5a4a44, 0.7)
  scatola(g, 1.0, 1.2, 0.08, mat(0xf3e9d4), 0, 0.62, 1.32)
  for (const s of [1, -1]) { const x = scatola(g, 1.35, 0.08, 0.1, mat(0xf3e9d4), 0, 0.62, 1.35); x.rotation.z = s * 0.7 }
  cilindro(g, 0.55, 0.55, 2.4, mat(0xcfd2d6), 2.4, 1.2, -0.3, 14)
  sfera(g, 0.55, mat(0xb9bdc2), 2.4, 2.4, -0.3, 1, 0.7, 1, 14)
  g.userData.altezza = 3.6
  fondiPerMateriale(g)
  return g
}
/** La casa di legno del Sotterraneo (dal-sotterraneo.js), 4×3, con il camino: `userData.fumo` è dove esce il fumo. */
function costruisciCasa () { return casaDiLegno() }
export function creaCasaVecchia () {
  const g = new THREE.Group()
  scatola(g, 3.4, 1.4, 2.2, mat(0xf2e6cf), 0, 0.7, 0)
  tetto(g, 3.8, 2.7, 1.4, 0xc4553a, 0.55)
  scatola(g, 0.3, 0.8, 0.3, mat(0x8a5a44), -1.1, 2.1, 0)
  scatola(g, 0.6, 1.0, 0.08, mat(0x7b4a24), 0, 0.5, 1.14)
  for (const x of [-1.1, 1.1]) scatola(g, 0.6, 0.55, 0.06, mat(0xa6d8ee), x, 0.85, 1.12)
  g.userData.altezza = 3
  return g
}

// ── l'albero e il cespuglio (a istanze nel main); qui solo le forme ──
export const FORME = {
  tronco: new THREE.CylinderGeometry(0.1, 0.16, 0.7, 5).translate(0, 0.35, 0),
  chioma: new THREE.ConeGeometry(0.62, 1.2, 6).translate(0, 1.2, 0),
  chioma2: new THREE.ConeGeometry(0.46, 0.95, 6).translate(0, 1.85, 0),
  ciuffo: new THREE.ConeGeometry(0.05, 0.28, 4).translate(0, 0.14, 0),
}

// ── il fantasma di un pezzo che si sta per mettere: semitrasparente, verde se ci sta e rosso se no ──
export function fantasma(g) {
  g.traverse(o => {
    if (!o.isMesh) return
    o.material = (Array.isArray(o.material) ? o.material[0] : o.material).clone()
    o.material.transparent = true; o.material.opacity = 0.5; o.castShadow = false
  })
}
/** Toglie un fantasma di scena: i materiali sono copie sue (`fantasma` li ha clonati), si buttano; le geometrie sono della cache e restano. */
export function buttaFantasma(g) {
  g.traverse(o => { if (o.isMesh && o.material && o.material.dispose) o.material.dispose() })
}
export function tingi(g, ok) {
  g.traverse(o => { if (o.isMesh && o.material.emissive) { o.material.emissive.set(ok ? 0x1d6b1d : 0x8a1d1d); o.material.emissiveIntensity = 0.7 } })
}

// ── la cache: ogni modello si costruisce (e si fonde) una volta, le istanze sono cloni che ne condividono geometrie e materiali ──
//    (scena3d/cache-modelli.js). I numeri a caso di una bestia si rifanno a ogni istanza.
const casuale = (g) => { g.userData.fase = Math.random() * 6 }
export const creaPasticceria = memoModello('pasticceria', costruisciPasticceria)
export const creaMongolfiera = memoModello('mongolfiera', costruisciMongolfiera)
export const creaMulino = memoModello('mulino', costruisciMulino)
export const creaPanificio = memoModello('panificio', costruisciPanificio)
export const creaConserviera = memoModello('conserviera', costruisciConserviera)
export const creaGelateria = memoModello('gelateria', costruisciGelateria)
export const creaCaseificio = memoModello('caseificio', costruisciCaseificio)
export const creaSegnaposto = memoModello('segnaposto', costruisciSegnaposto, { chiave: (w, d, h = 1) => [w, d, h].join('x') })
export const creaAiuola = memoModello('aiuola', costruisciAiuola)
export const creaPanchina = memoModello('panchina', costruisciPanchina)
export const creaPozzo = memoModello('pozzo', costruisciPozzo)
export const creaSpaventapasseri = memoModello('spaventapasseri', costruisciSpaventapasseri)
export const creaTrattore = memoModello('trattore', costruisciTrattore)
export const creaCassa = memoModello('cassa', costruisciCassa)
export const creaFontana = memoModello('fontana', costruisciFontana)
export const creaFienile = memoModello('fienile', costruisciFienile)
export const creaCasa = memoModello('casa', costruisciCasa)
export const creaBancarella = memoModello('bancarella', costruisciBancarella)
export const creaBacheca = memoModello('bacheca', costruisciBacheca)
export const creaPecora = memoModello('pecora', costruisciPecora)
export const creaGallina = memoModello('gallina', costruisciGallina, { chiave: (k = 0) => k % 2, dopo: (g) => { casuale(g); g.userData.attesa = Math.random() * 2 } })
export const creaMucca = memoModello('mucca', costruisciMucca, { chiave: (k = 0) => k % 2, dopo: casuale })

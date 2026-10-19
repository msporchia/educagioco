// I pezzi della fattoria 3D, tutti in codice: niente sprite, niente immagini. Ogni costruttore torna un Group con
// l'origine al centro dell'impronta e il davanti verso +z (la telecamera guarda da lì). Vedi poc/fattoria-3d.md.
import * as THREE from 'three'

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
  x.fillStyle = colore; x.font = `800 ${px}px system-ui, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'
  x.fillText(testo, w / 2, h / 2 + 3)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}
function insegna (g, testo, larg, alt, x, y, z, o) {
  const m = pronto(new THREE.Mesh(new THREE.PlaneGeometry(larg, alt), new THREE.MeshStandardMaterial({ map: testoTex(testo, o), roughness: 0.8 })))
  m.position.set(x, y, z); g.add(m); return m
}

// ── il campo: 2×2 celle, quattro tessere, le piante sono istanze; cinque colture che si vedono diverse ──
const STELO = new THREE.CylinderGeometry(0.012, 0.022, 1, 4).translate(0, 0.5, 0)
const SPIGA = new THREE.ConeGeometry(0.05, 0.22, 5).translate(0, 0.11, 0)
const FRUTTO = new THREE.IcosahedronGeometry(0.07, 0).translate(0, 0.0, 0)
const PER_TESSERA = 8
/** altezza dello stelo, colori da acerbo a maturo, e il frutto: 'spiga' (cono in cima), 'radice' (cono capovolto a terra), 'sfera' (a mezza altezza) */
export const COLTURE = {
  grano:    { nome: 'Grano',    emoji: '🌾', ms: 20000, h: 0.9,  a: 0x5fae3a, b: 0xe6b93c, frutto: 'spiga',  fc: 0xe6b93c, fs: 1,   min: 1 },
  carota:   { nome: 'Carote',   emoji: '🥕', ms: 14000, h: 0.3,  a: 0x4aa83a, b: 0x4aa83a, frutto: 'radice', fc: 0xf08a24, fs: 1.5, min: 1 },
  mais:     { nome: 'Mais',     emoji: '🌽', ms: 28000, h: 1.25, a: 0x4f9a3a, b: 0x8fa83a, frutto: 'spiga',  fc: 0xf2d23a, fs: 1.7, min: 1 },
  pomodoro: { nome: 'Pomodori', emoji: '🍅', ms: 24000, h: 0.5,  a: 0x4a9a3a, b: 0x4a9a3a, frutto: 'sfera',  fc: 0xd8352a, fs: 1,   min: 1 },
  zucca:    { nome: 'Zucche',   emoji: '🎃', ms: 32000, h: 0.22, a: 0x5aa03a, b: 0x5aa03a, frutto: 'sfera',  fc: 0xf09a20, fs: 2.4, min: 1 },
}
export function creaCampo (seme = 1) {
  const g = new THREE.Group()
  scatola(g, 2, 0.1, 2, mat(0x6e4a2a), 0, 0.05, 0)
  for (const z of [-0.75, -0.25, 0.25, 0.75]) scatola(g, 1.84, 0.07, 0.17, mat(0x553720), 0, 0.12, z)
  const legno = mat(0x9a6a36)
  scatola(g, 2.1, 0.17, 0.08, legno, 0, 0.085, 1.0); scatola(g, 2.1, 0.17, 0.08, legno, 0, 0.085, -1.0)
  scatola(g, 0.08, 0.17, 2.1, legno, 1.0, 0.085, 0); scatola(g, 0.08, 0.17, 2.1, legno, -1.0, 0.085, 0)
  const n = 4 * PER_TESSERA
  const steli = new THREE.InstancedMesh(STELO, mat(0xffffff), n)
  const spighe = new THREE.InstancedMesh(SPIGA, mat(0xffffff), n)
  const frutti = new THREE.InstancedMesh(FRUTTO, mat(0xffffff), n)
  for (const m of [steli, spighe, frutti]) { m.castShadow = true; m.frustumCulled = false; m.setColorAt(0, new THREE.Color()) }
  const pos = []
  let r = seme * 9301 + 49297
  const caso = () => { r = (r * 9301 + 49297) % 233280; return r / 233280 }
  for (let k = 0; k < 4; k++) {
    const cx = (k % 2 ? 0.5 : -0.5), cz = (k < 2 ? -0.5 : 0.5)
    for (let a = 0; a < PER_TESSERA; a++) pos.push({ x: cx + (caso() - 0.5) * 0.78, z: cz + (caso() - 0.5) * 0.78, k, fase: caso() * 6.28 })
  }
  g.add(steli, spighe, frutti)
  g.userData.grano = { steli, spighe, frutti, pos }
  return g
}
const D = new THREE.Object3D(), CA = new THREE.Color(), CB = new THREE.Color(), CO = new THREE.Color(), CF = new THREE.Color()
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)
/** crescita: quattro numeri, -1 = vuota, 0..1 = cresce (1 = matura). `vento` false = niente ondeggio. */
export function aggiornaCampo (g, crescita, t, coltura = 'grano', vento = true) {
  const { steli, spighe, frutti, pos } = g.userData.grano
  const C = COLTURE[coltura] || COLTURE.grano
  CA.set(C.a); CB.set(C.b); CF.set(C.fc)
  pos.forEach((p, n) => {
    const c = crescita[p.k]
    if (c < 0) { steli.setMatrixAt(n, ZERO); spighe.setMatrixAt(n, ZERO); frutti.setMatrixAt(n, ZERO); return }
    const h = 0.1 + (C.h - 0.1) * Math.sqrt(c)
    const sway = vento ? Math.sin(t * 1.7 + p.fase) * 0.06 * (0.3 + c) : 0
    D.position.set(p.x, 0.1, p.z); D.rotation.set(0, 0, sway); D.scale.set(C.frutto === 'sfera' ? 2 : 1, h, C.frutto === 'sfera' ? 2 : 1); D.updateMatrix(); steli.setMatrixAt(n, D.matrix)
    const m = Math.min(1, Math.max(0, (c - 0.62) / 0.38))
    steli.setColorAt(n, CO.copy(CA).lerp(CB, m))
    const f = c > 0.55 ? Math.min(1, (c - 0.55) / 0.4) : 0
    spighe.setMatrixAt(n, ZERO); frutti.setMatrixAt(n, ZERO)
    if (C.frutto === 'spiga') {
      D.position.set(p.x - Math.sin(sway) * h, 0.1 + Math.cos(sway) * h, p.z); D.rotation.set(0, 0, sway); D.scale.setScalar(f * C.fs); D.updateMatrix(); spighe.setMatrixAt(n, D.matrix); spighe.setColorAt(n, CF)
    } else if (C.frutto === 'radice') {
      D.position.set(p.x, 0.17 + 0.0, p.z); D.rotation.set(Math.PI, 0, 0); D.scale.setScalar(f * C.fs); D.updateMatrix(); spighe.setMatrixAt(n, D.matrix); spighe.setColorAt(n, CF)
    } else {
      D.position.set(p.x + 0.05, 0.1 + h * 0.5 + f * 0.04, p.z + 0.03); D.rotation.set(0, p.fase, 0); D.scale.setScalar(f * C.fs); D.updateMatrix(); frutti.setMatrixAt(n, D.matrix); frutti.setColorAt(n, CF)
    }
  })
  for (const m of [steli, spighe, frutti]) { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true }
}

// ── la pasticceria: 4×3, la porta davanti ──
export function creaPasticceria () {
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
export function creaMongolfiera () {
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
  return g
}

// ── la bancarella: 2×1 ──
export function creaBancarella () {
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

// ── la fontana: 2×2 ──
export function creaFontana () {
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
  g.userData.anima = (t) => gocce.forEach((o, n) => {
    const f = ((t * 0.9 + n / gocce.length) % 1), a = n * 0.785
    o.position.set(Math.cos(a) * 0.62 * f, 1.15 + Math.sin(f * Math.PI) * 0.5 - f * f * 0.45, Math.sin(a) * 0.62 * f)
  })
  g.userData.altezza = 1.6
  return g
}

// ── la pecora e il recinto 3×3: agnello → adulta → tosata, la lana ricresce ──
export const LANA_MS = 25000                     // ms perché una pecora tosata rifaccia la lana (un numero da prova)
export const PECORE_MAX = 4
export const pecoreIniziali = () => [{ eta: 'adulta', t0: Date.now() }, { eta: 'agnello', cibo: 0 }]
export function creaPecora () {
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
  scatola(testa, 0.05, 0.03, 0.08, scuro, 0.12, 0.0, 0).rotation.z = 0.5; scatola(testa, 0.05, 0.03, 0.08, scuro, -0.12, 0.0, 0).rotation.z = -0.5
  const zampe = []
  for (const [x, z] of [[0.1, 0.12], [-0.1, 0.12], [0.1, -0.12], [-0.1, -0.12]]) {
    const p = new THREE.Group(); p.position.set(x, 0.26, z); g.add(p)
    cilindro(p, 0.025, 0.025, 0.26, scuro, 0, -0.13, 0, 5); zampe.push(p)
  }
  g.userData = { zampe, corpo, testa, fiocchi, pelle: pelleM, k: 1, fase: 0, attesa: 1, meta: new THREE.Vector3() }
  return g
}
export function creaRecinto (stati) {
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
  sincronizzaPecore(g, stati || pecoreIniziali())
  return g
}
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
    // lo stato: la taglia cresce piano, la lana ricresce, la pelle si vede se tosata
    const livello = st.eta === 'adulta' ? Math.max(0, Math.min(1, (adesso - st.t0) / LANA_MS)) : 0.7
    u.k += ((st.eta === 'agnello' ? 0.62 : 1) - u.k) * Math.min(1, dt * 3)
    p.scale.setScalar(u.k); u.testa.scale.setScalar(st.eta === 'agnello' ? 1.3 : 1)
    u.fiocchi.visible = livello > 0.1; u.fiocchi.scale.setScalar(0.6 + 0.4 * livello)
    u.pelle.visible = livello < 0.6
    // il movimento
    u.attesa -= dt
    if (verso && !u.corri && n === 0) { u.meta.set(Math.max(-1.1, Math.min(1.1, verso.x)), 0, Math.max(-1.1, Math.min(1.1, verso.z))); u.corri = 2.2; u.attesa = 3 }
    if (u.corri) u.corri -= dt
    if (u.attesa <= 0) { u.meta.set((Math.random() - 0.5) * 2.4, 0, (Math.random() - 0.5) * 2.2); u.attesa = 2 + Math.random() * 4 }
    const dx = u.meta.x - p.position.x, dz = u.meta.z - p.position.z, d = Math.hypot(dx, dz)
    const mov = d > 0.06
    if (mov) {
      const v = Math.min(d, (u.corri ? 1.3 : 0.45) * dt)
      p.position.x += dx / d * v; p.position.z += dz / d * v
      const a = Math.atan2(dx, dz); let da = a - p.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); p.rotation.y += da * Math.min(1, dt * 6)
    }
    u.fase += dt * (mov ? (u.corri ? 12 : 6) : 0)
    u.zampe.forEach((z, k) => { z.rotation.x = mov ? Math.sin(u.fase + (k % 3 ? Math.PI : 0)) * 0.5 : 0 })
    u.corpo.position.y = 0.34 + (mov ? Math.abs(Math.sin(u.fase)) * 0.03 : 0)
    u.testa.rotation.x = mov ? 0 : Math.max(0, Math.sin(t * 0.8 + p.position.x * 3)) * 0.5   // ogni tanto bruca
  })
}

// ── fisse: il fienile, la casa ──
export function creaFienile () {
  const g = new THREE.Group()
  const rosso = mat(0xa8392f)
  scatola(g, 3.6, 1.6, 2.6, rosso, 0, 0.8, 0)
  tetto(g, 3.9, 3.0, 1.6, 0x5a4a44, 0.7)
  scatola(g, 1.0, 1.2, 0.08, mat(0xf3e9d4), 0, 0.62, 1.32)
  for (const s of [1, -1]) { const x = scatola(g, 1.35, 0.08, 0.1, mat(0xf3e9d4), 0, 0.62, 1.35); x.rotation.z = s * 0.7 }
  cilindro(g, 0.55, 0.55, 2.4, mat(0xcfd2d6), 2.4, 1.2, -0.3, 14)
  sfera(g, 0.55, mat(0xb9bdc2), 2.4, 2.4, -0.3, 1, 0.7, 1, 14)
  g.userData.altezza = 3.6
  return g
}
export function creaCasa () {
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

// ── l'eroe: tutto primitive, con i perni per camminare, seminare, falciare ──
export function creaEroe () {
  const g = new THREE.Group()
  const pelle = mat(0xf2c7a0), salopette = mat(0x3a62b0), maglia = mat(0xd24a3a), paglia = mat(0xe6c36a), scuro = mat(0x2a2018)
  const gambe = [-1, 1].map(s => {
    const p = new THREE.Group(); p.position.set(s * 0.09, 0.34, 0); g.add(p)
    scatola(p, 0.13, 0.3, 0.15, salopette, 0, -0.15, 0); scatola(p, 0.14, 0.07, 0.2, scuro, 0, -0.32, 0.03); return p
  })
  const busto = new THREE.Group(); busto.position.y = 0.34; g.add(busto)
  scatola(busto, 0.36, 0.34, 0.2, maglia, 0, 0.17, 0)
  scatola(busto, 0.36, 0.2, 0.21, salopette, 0, 0.1, 0)
  for (const s of [-1, 1]) scatola(busto, 0.06, 0.2, 0.22, salopette, s * 0.1, 0.27, 0)
  const testa = new THREE.Group(); testa.position.y = 0.5; busto.add(testa)
  sfera(testa, 0.16, pelle, 0, 0.14, 0, 1, 1, 1, 12)
  sfera(testa, 0.02, scuro, 0.06, 0.16, 0.14, 1, 1, 1, 6); sfera(testa, 0.02, scuro, -0.06, 0.16, 0.14, 1, 1, 1, 6)
  cilindro(testa, 0.27, 0.27, 0.03, paglia, 0, 0.27, 0, 14)
  cilindro(testa, 0.14, 0.15, 0.13, paglia, 0, 0.34, 0, 12)
  cilindro(testa, 0.145, 0.155, 0.04, mat(0xd24a3a), 0, 0.3, 0, 12)
  const bracci = [-1, 1].map(s => {
    const p = new THREE.Group(); p.position.set(s * 0.23, 0.3, 0); busto.add(p)
    scatola(p, 0.09, 0.28, 0.1, maglia, 0, -0.13, 0); sfera(p, 0.055, pelle, 0, -0.29, 0, 1, 1, 1, 8); return p
  })
  // la falce: nel pugno destro, solo mentre si taglia
  const falce = new THREE.Group(); falce.visible = false
  bracci[1].add(falce); falce.position.set(0, -0.29, 0)
  cilindro(falce, 0.018, 0.018, 1.1, mat(0x9a6a36), 0, -0.4, 0, 5)
  const lama = pronto(new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.022, 4, 14, Math.PI * 0.7), mat(0xcfd6dc, { metalness: 0.5, roughness: 0.4 })))
  lama.rotation.set(Math.PI / 2, 0, Math.PI * 0.15); lama.position.set(0, -0.94, 0.0)
  falce.add(lama)
  // l'ascia: nel pugno destro, solo mentre si abbatte
  const ascia = new THREE.Group(); ascia.visible = false
  bracci[1].add(ascia); ascia.position.set(0, -0.29, 0)
  cilindro(ascia, 0.022, 0.022, 0.7, mat(0x9a6a36), 0, -0.25, 0, 5)
  scatola(ascia, 0.05, 0.16, 0.2, mat(0xcfd6dc, { metalness: 0.5, roughness: 0.4 }), 0, -0.56, 0.1)
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })
  g.userData = { gambe, busto, testa, bracci, falce, ascia }
  return g
}

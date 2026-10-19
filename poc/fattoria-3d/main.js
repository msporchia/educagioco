// La fattoria in 3D: l'eroe cammina fino alle cose e le fa. Il terreno è a lotti da comprare (due zone: campi a
// ovest, piazza a est), gli edifici unici (pasticceria, mongolfiera) hanno un posto fisso, il resto lo piazza il
// bambino dove vuole nei lotti suoi, e le strade le disegna lui. In basso le azioni rapide (semina, raccogli,
// cura): si arma l'azione e poi si toccano le cose, senza il menu a ogni volta. Tutto in codice. Vedi poc/fattoria-3d.md.
import * as THREE from 'three'
import {
  creaCampo, aggiornaCampo, creaPasticceria, creaMongolfiera, creaBancarella, creaFontana, creaRecinto, muoviPecore,
  sincronizzaPecore, pecoreIniziali, LANA_MS, PECORE_MAX, creaFienile, creaCasa, creaEroe, FORME, mat, COLTURE,
} from './modelli.js'
import { creaOpzioni } from './opzioni.js'

// ── la griglia ──
const I0 = -16, J0 = -13, GW = 32, GH = 26                 // celle [I0, I0+GW) × [J0, J0+GH)
const LIM = { i0: -14, i1: 14, j0: -12, j1: 12 }          // il mondo che si può comprare: 7×6 lotti da 4×4
const idx = (i, j) => (j - J0) * GW + (i - I0)
const dentro = (i, j) => i >= LIM.i0 && i < LIM.i1 && j >= LIM.j0 && j < LIM.j1

// ── i lotti di terreno: una sola zona; si cammina e si costruisce solo nei lotti comprati, e si compra solo ciò che confina ──
const LOTTO = 4
const LOTTI = []
for (let b = 0; b < 6; b++) for (let a = 0; a < 7; a++) LOTTI.push({ id: a + '_' + b, a, b, i: LIM.i0 + a * LOTTO, j: LIM.j0 + b * LOTTO, w: LOTTO, d: LOTTO })
const LOTTI_INIZIALI = {}
for (let b = 2; b <= 4; b++) for (let a = 2; a <= 4; a++) LOTTI_INIZIALI[a + '_' + b] = true     // il quadrato di partenza, 3×3 lotti
const lottoCella = new Array(GW * GH).fill(null)
for (const l of LOTTI) for (let a = 0; a < l.w; a++) for (let b = 0; b < l.d; b++) lottoCella[idx(l.i + a, l.j + b)] = l
const lottoDi = (i, j) => dentro(i, j) ? lottoCella[idx(i, j)] : null

// ── cosa si può avere ──
const DEF = {
  campo:       { nome: 'Campo', w: 2, d: 2, prezzo: 20, rincaro: 8, crea: () => creaCampo(Math.random() * 99 + 1), emoji: '🌾' },
  recinto:     { nome: 'Recinto', w: 3, d: 3, prezzo: 45, rincaro: 0, crea: c => creaRecinto(c && c.pecore), emoji: '🐑' },
  bancarella:  { nome: 'Bancarella', w: 2, d: 1, prezzo: 15, rincaro: 0, crea: creaBancarella, emoji: '🍎' },
  fontana:     { nome: 'Fontana', w: 2, d: 2, prezzo: 30, rincaro: 0, crea: creaFontana, emoji: '⛲' },
  pasticceria: { nome: 'Pasticceria', w: 4, d: 3, prezzo: 80, slot: { i: -6, j: -4 }, crea: creaPasticceria, emoji: '🥧' },
  mongolfiera: { nome: 'Mongolfiera', w: 3, d: 3, prezzo: 100, slot: { i: 2, j: -4 }, crea: creaMongolfiera, emoji: '🎈' },
}
const VIAGGIO = 14000
// la pasticceria: ogni ricetta chiede raccolti precisi e un tempo; il forno ha tre posti in coda
const RICETTE = {
  pane:        { nome: 'Pane', emoji: '🍞', ing: { grano: 2 }, ms: 6000 },
  popcorn:     { nome: 'Popcorn', emoji: '🍿', ing: { mais: 2 }, ms: 8000 },
  tortaCarote: { nome: 'Torta di carote', emoji: '🍰', ing: { carota: 2, grano: 1 }, ms: 10000 },
  pizza:       { nome: 'Pizza', emoji: '🍕', ing: { pomodoro: 2, grano: 1 }, ms: 12000 },
  tortaZucca:  { nome: 'Torta di zucca', emoji: '🥧', ing: { zucca: 2, grano: 1 }, ms: 14000 },
}
const FORNO_POSTI = 3
const COSTO_SPOSTARE = 1, COSTO_STRADA = 1, LEGNA_PER_ALBERO = 2

// ── lo stato salvato ──
const CHIAVE = 'poc-fattoria-3d-2'
const S = {
  monete: 120, merci: { grano: 0, carota: 0, mais: 0, pomodoro: 0, zucca: 0 }, prodotti: {}, lana: 0, legna: 0,
  posseduti: { pasticceria: false, mongolfiera: false },
  lotti: { ...LOTTI_INIZIALI }, strade: [], magazzino: {}, tagliati: [],
  liberi: [{ tipo: 'campo', i: -5, j: 0, tile: [null, null, null, null] }],
  pasticceria: { coda: [], pronti: {} },
  mongolfiera: { fine: null, cassa: false },
}
try {
  const v = JSON.parse(localStorage.getItem(CHIAVE) || 'null')
  if (v && v.liberi) {
    Object.assign(S, v)
    if (!S.pasticceria || !S.pasticceria.coda) S.pasticceria = { coda: [], pronti: {} }
    if (!S.prodotti) S.prodotti = {}
    if (!S.tagliati) S.tagliati = []
  }
} catch (e) { /* senza archivio si gioca lo stesso */ }
let sporco = 0
const salva = () => { sporco = 1 }
function salvaOra () {
  try {
    S.liberi = cose.filter(c => !c.slot && !c.stress).map(c => ({ tipo: c.tipo, i: c.i, j: c.j, tile: c.tile, coltura: c.coltura, pecore: c.pecore, cibo: c.cibo }))
    S.strade = []; for (let k = 0; k < strada.length; k++) if (strada[k] === 1) S.strade.push(k)
    localStorage.setItem(CHIAVE, JSON.stringify(S))
  } catch (e) { /* idem */ }
  sporco = 0
}
let sfasamento = 0
const ora = () => Date.now() + sfasamento
const posseduto = l => !!S.lotti[l.id]
const cellaPropria = (i, j) => { const l = lottoDi(i, j); return !!l && posseduto(l) }
const confina = l => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([da, db]) => { const n = LOTTI.find(x => x.a === l.a + da && x.b === l.b + db); return !!n && posseduto(n) })

// ── scena ──
const $ = id => document.getElementById(id)
const sopra = $('sopra')
const V = new THREE.Vector3()
const tela = document.getElementById('tela')
const renderer = new THREE.WebGLRenderer({ canvas: tela, antialias: true, powerPreference: 'high-performance' })
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75))
const scena = new THREE.Scene()
const CIELO = new THREE.Color(0xbfe0f0)
scena.background = CIELO; scena.fog = new THREE.Fog(CIELO, 38, 90)
const cam = new THREE.PerspectiveCamera(50, 1, 0.5, 160)
scena.add(new THREE.HemisphereLight(0xdff1ff, 0x7a9a5a, 1.05))
const sole = new THREE.DirectionalLight(0xfff0d0, 2.3)
sole.castShadow = true; sole.shadow.mapSize.set(1024, 1024)
Object.assign(sole.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 })
sole.shadow.bias = -0.0004; sole.shadow.normalBias = 0.03
scena.add(sole, sole.target)

function rumore (px, colA, colB, n = 900) {
  const c = document.createElement('canvas'); c.width = c.height = px
  const x = c.getContext('2d'); x.fillStyle = colA; x.fillRect(0, 0, px, px)
  for (let k = 0; k < n; k++) { x.fillStyle = colB; x.globalAlpha = 0.12 + Math.random() * 0.2; const r = 2 + Math.random() * 7; x.beginPath(); x.arc(Math.random() * px, Math.random() * px, r, 0, 6.3); x.fill() }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}
function piano (w, d, tex, x, z, y) {
  const t = tex.clone(); t.needsUpdate = true; t.repeat.set(w / 4, d / 4)
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: 1 }))
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; scena.add(m); return m
}
const erba = rumore(256, '#79b84a', '#5e9a38'), sabbia = rumore(256, '#dcc796', '#c9b07c', 500)
piano(120, 120, erba, 0, 0, 0)

// ── le strade: una per cella; quelle di serie (un incrocio a T) e quelle che disegna il bambino ──
const strada = new Uint8Array(GW * GH)              // 0 niente, 1 disegnata, 2 di serie
for (let i = -6; i < 6; i++) strada[idx(i, -1)] = 2
for (let j = -1; j <= 7; j++) for (let i = -1; i <= 0; i++) strada[idx(i, j)] = 2
for (const k of S.strade || []) if (!strada[k]) strada[k] = 1
const stradeMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.03, 1), new THREE.MeshStandardMaterial({ map: sabbia, roughness: 1 }), GW * GH)
stradeMesh.receiveShadow = true; stradeMesh.frustumCulled = false; stradeMesh.setColorAt(0, new THREE.Color()); scena.add(stradeMesh)
function ridisegnaStrade () {
  const d = new THREE.Object3D(), c = new THREE.Color(); let n = 0
  for (let k = 0; k < strada.length; k++) {
    if (!strada[k]) continue
    const i = k % GW + I0, j = Math.floor(k / GW) + J0
    d.position.set(i + 0.5, 0.015, j + 0.5); d.updateMatrix(); stradeMesh.setMatrixAt(n, d.matrix)
    const t = 0.93 + ((i * 7 + j * 13) % 9) * 0.014; stradeMesh.setColorAt(n, c.setRGB(t, t * 0.99, t * 0.96)); n++
  }
  stradeMesh.count = n; stradeMesh.instanceMatrix.needsUpdate = true; stradeMesh.instanceColor.needsUpdate = true
}
ridisegnaStrade()

// la griglia di costruzione: un riquadro per lotto, solo mentre si costruisce
const grigliaTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64
  const x = c.getContext('2d'); x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 3; x.strokeRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t
})()
const griglia = new THREE.Group(); scena.add(griglia); griglia.visible = false
const grigliaLotto = {}
for (const l of LOTTI) {
  const t = grigliaTex.clone(); t.needsUpdate = true; t.repeat.set(l.w, l.d)
  const m = new THREE.Mesh(new THREE.PlaneGeometry(l.w, l.d), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.5, depthWrite: false }))
  m.rotation.x = -Math.PI / 2; m.position.set(l.i + l.w / 2, 0.035, l.j + l.d / 2); griglia.add(m); grigliaLotto[l.id] = m
}

// ── i lotti non comprati: erba alta scura, cespugli e sassi (istanze); il recinto basso attorno a ciò che è tuo ──
const veloMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(LOTTO, LOTTO), new THREE.MeshStandardMaterial({ color: 0x35542a, transparent: true, opacity: 0.74, roughness: 1, depthWrite: false }), LOTTI.length)
const cespugli = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.4, 0), mat(0xffffff), LOTTI.length * 7)
const sassi = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.3, 0), mat(0x8d8d88), LOTTI.length * 3)
for (const m of [veloMesh, cespugli, sassi]) { m.frustumCulled = false; m.receiveShadow = true }
cespugli.castShadow = true; sassi.castShadow = true
cespugli.setColorAt(0, new THREE.Color())
scena.add(veloMesh, cespugli, sassi)
const paliM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.07, 0.7, 6).translate(0, 0.35, 0), mat(0x7a5232), 800)
const traviM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.07, 0.05), mat(0x93622f), 1600)
for (const m of [paliM, traviM]) { m.castShadow = true; m.frustumCulled = false; scena.add(m) }
const bloccoLotti = new Uint8Array(GW * GH)             // 1 = cella di un lotto non comprato (ci si chiude fuori)
function ridisegnaLotti () {
  const d = new THREE.Object3D(), col = new THREE.Color(); let nv = 0, nb = 0, ns = 0
  bloccoLotti.fill(0)
  for (const l of LOTTI) {
    if (posseduto(l)) continue
    for (let a = 0; a < l.w; a++) for (let b = 0; b < l.d; b++) bloccoLotti[idx(l.i + a, l.j + b)] = 1
    d.position.set(l.i + 2, 0.05, l.j + 2); d.rotation.set(-Math.PI / 2, 0, 0); d.scale.set(1, 1, 1); d.updateMatrix(); veloMesh.setMatrixAt(nv++, d.matrix)
    let r = l.a * 131 + l.b * 17 + 5
    const caso = () => { r = (r * 9301 + 49297) % 233280; return r / 233280 }
    for (let k = 0; k < 7; k++) {
      d.position.set(l.i + 0.4 + caso() * 3.2, 0.25, l.j + 0.4 + caso() * 3.2); d.rotation.set(0, caso() * 6, 0); d.scale.setScalar(0.6 + caso() * 0.8); d.updateMatrix()
      cespugli.setMatrixAt(nb, d.matrix); cespugli.setColorAt(nb, col.setHSL(0.3, 0.5, 0.18 + caso() * 0.12)); nb++
    }
    for (let k = 0; k < 3; k++) { d.position.set(l.i + 0.4 + caso() * 3.2, 0.14, l.j + 0.4 + caso() * 3.2); d.rotation.set(0, caso() * 6, 0); d.scale.set(1, 0.7, 1); d.updateMatrix(); sassi.setMatrixAt(ns++, d.matrix) }
  }
  veloMesh.count = nv; cespugli.count = nb; sassi.count = ns
  for (const m of [veloMesh, cespugli, sassi]) m.instanceMatrix.needsUpdate = true
  cespugli.instanceColor.needsUpdate = true
  ricostruisciRecinti()
  if (typeof ricalcolaBlocco === 'function' && cose) ricalcolaBlocco()
}
/** un recinto basso lungo ogni lato di un lotto tuo che confina con uno non tuo (o con il bordo del mondo) */
function ricostruisciRecinti () {
  const d = new THREE.Object3D(); const pali = new Set(); let np = 0, nt = 0
  const palo = (x, z) => { const k = x + ',' + z; if (pali.has(k)) return; pali.add(k); d.position.set(x, 0, z); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1); d.updateMatrix(); paliM.setMatrixAt(np++, d.matrix) }
  const trave = (x, z, giu) => { for (const y of [0.28, 0.52]) { d.position.set(x, y, z); d.rotation.set(0, giu ? Math.PI / 2 : 0, 0); d.updateMatrix(); traviM.setMatrixAt(nt++, d.matrix) } }
  for (let j = LIM.j0; j < LIM.j1; j++) for (let i = LIM.i0; i < LIM.i1; i++) {
    if (!cellaPropria(i, j)) continue
    if (!cellaPropria(i, j - 1)) { palo(i, j); palo(i + 1, j); trave(i + 0.5, j, false) }
    if (!cellaPropria(i, j + 1)) { palo(i, j + 1); palo(i + 1, j + 1); trave(i + 0.5, j + 1, false) }
    if (!cellaPropria(i - 1, j)) { palo(i, j); palo(i, j + 1); trave(i, j + 0.5, true) }
    if (!cellaPropria(i + 1, j)) { palo(i + 1, j); palo(i + 1, j + 1); trave(i + 1, j + 0.5, true) }
  }
  paliM.count = np; traviM.count = nt; paliM.instanceMatrix.needsUpdate = true; traviM.instanceMatrix.needsUpdate = true
}

// ── gli alberi: dentro il mondo si abbattono (e danno legna), fuori è il bosco che chiude la fattoria ──
const bloccoFisso = new Uint8Array(GW * GH)
const decori = { alberi: [], erba: [] }
const ALBERI = []                   // {n, i, j, s, c, albero, tagliato, tagliabile}
const istanzeAlberi = []
const RISERVATE = new Set()          // dove non nasce nessun albero: le strade di serie, i posti fissi, il campo di partenza, la partenza dell'eroe
for (let k = 0; k < strada.length; k++) if (strada[k] === 2) RISERVATE.add(k)
for (const [i, j, w, d] of [[-6, -4, 4, 3], [2, -4, 3, 3], [-5, 0, 2, 2], [-3, 3, 6, 5]]) for (let a = -1; a <= w; a++) for (let b = -1; b <= d; b++) RISERVATE.add(idx(i + a, j + b))
function alberi () {
  let r = 7
  const caso = () => { r = (r * 9301 + 49297) % 233280; return r / 233280 }
  const lista = []
  const prova = (i, j, tagliabile) => {
    if (tagliabile && RISERVATE.has(idx(i, j))) return
    if (lista.some(a => Math.hypot(a.i - i, a.j - j) < (tagliabile ? 1.9 : 1.6))) return
    lista.push({ i, j, s: 0.8 + caso() * 0.7, c: caso(), tagliabile })
  }
  for (const l of LOTTI) for (let k = 0; k < 3; k++) prova(l.i + Math.floor(caso() * l.w), l.j + Math.floor(caso() * l.d), true)
  for (let n = 0; n < 500 && lista.length < 126 + 110; n++) {
    const i = Math.floor(I0 - 10 + caso() * (GW + 20)), j = Math.floor(J0 - 10 + caso() * (GH + 20))
    if (dentro(i, j)) continue
    prova(i, j, false)
  }
  const tronchi = new THREE.InstancedMesh(FORME.tronco, mat(0x7a5232), lista.length)
  const chiome = new THREE.InstancedMesh(FORME.chioma, mat(0xffffff), lista.length)
  const chiome2 = new THREE.InstancedMesh(FORME.chioma2, mat(0xffffff), lista.length)
  for (const m of [tronchi, chiome, chiome2]) { m.castShadow = true; m.receiveShadow = true }
  const d = new THREE.Object3D(), col = new THREE.Color()
  lista.forEach((a, n) => {
    a.n = n; a.albero = true; a.w = 1; a.d = 1; a.tagliato = false
    d.position.set(a.i + 0.5, 0, a.j + 0.5); d.rotation.y = a.c * 6; d.scale.setScalar(a.s); d.updateMatrix()
    tronchi.setMatrixAt(n, d.matrix); chiome.setMatrixAt(n, d.matrix); chiome2.setMatrixAt(n, d.matrix)
    col.setHSL(0.27 + a.c * 0.05, 0.5, 0.3 + a.c * 0.1); chiome.setColorAt(n, col); chiome2.setColorAt(n, col)
    if (dentro(a.i, a.j)) bloccoFisso[idx(a.i, a.j)] = 1
    ALBERI.push(a)
  })
  istanzeAlberi.push(tronchi, chiome, chiome2)
  scena.add(tronchi, chiome, chiome2); decori.alberi = [tronchi, chiome, chiome2]
  // ciuffi d'erba nella parte selvatica
  const ciuffi = new THREE.InstancedMesh(FORME.ciuffo, mat(0x4f9a2c), 500)
  for (let n = 0; n < 500; n++) {
    const x = (caso() - 0.5) * 70, z = (caso() - 0.5) * 56
    d.position.set(x, 0, z); d.rotation.set(0, caso() * 6, (caso() - 0.5) * 0.4); d.scale.setScalar(dentro(Math.floor(x), Math.floor(z)) ? 0 : 0.7 + caso() * 0.8); d.updateMatrix(); ciuffi.setMatrixAt(n, d.matrix)
  }
  scena.add(ciuffi); decori.erba = [ciuffi]
}
alberi()
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)
function togliIstanzaAlbero (a) {
  a.tagliato = true
  for (const m of istanzeAlberi) { m.setMatrixAt(a.n, ZERO); m.instanceMatrix.needsUpdate = true }
  if (dentro(a.i, a.j)) bloccoFisso[idx(a.i, a.j)] = 0
}
for (const n of S.tagliati) if (ALBERI[n]) togliIstanzaAlbero(ALBERI[n])

// nuvole piatte che scorrono (nessuna ombra: solo un po' di vita)
const nuvole = []
const gruppoNuvole = new THREE.Group(); scena.add(gruppoNuvole)
{
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false })
  for (let n = 0; n < 7; n++) {
    const g = new THREE.Group()
    for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(2 + Math.random() * 1.5, 8, 6), m); s.position.set(k * 2.2 - 3, Math.random(), Math.random() * 1.5); s.scale.y = 0.5; g.add(s) }
    g.position.set((Math.random() - 0.5) * 120, 28 + Math.random() * 8, -20 - Math.random() * 40); gruppoNuvole.add(g); nuvole.push(g)
  }
}

// ── le cose in gioco ──
const cose = []                 // {tipo, def, i, j, w, d, slot, grp, tile?, badge}
const cellaCosa = new Array(GW * GH).fill(null)
const blocco = new Uint8Array(GW * GH)

function centro (c) { return new THREE.Vector3(c.i + c.w / 2, 0, c.j + c.d / 2) }
function occupa (c, cosaOpt) {
  for (let a = 0; a < c.w; a++) for (let b = 0; b < c.d; b++) cellaCosa[idx(c.i + a, c.j + b)] = cosaOpt
  ricalcolaBlocco()
}
function ricalcolaBlocco () {
  for (let n = 0; n < blocco.length; n++) blocco[n] = (bloccoFisso[n] || bloccoLotti[n] || cellaCosa[n]) ? 1 : 0
}
function fantasma (g) {
  g.traverse(o => { if (o.isMesh) { o.material = (Array.isArray(o.material) ? o.material[0] : o.material).clone(); o.material.transparent = true; o.material.opacity = 0.5; o.castShadow = false } })
}
function tingi (g, ok) {
  g.traverse(o => { if (o.isMesh && o.material.emissive) { o.material.emissive.set(ok ? 0x1d6b1d : 0x8a1d1d); o.material.emissiveIntensity = 0.7 } })
}

function metti (c) {
  const def = DEF[c.tipo]
  c.def = def; c.w = def.w; c.d = def.d
  if (c.tipo === 'campo') c.tile = c.tile || [null, null, null, null]
  if (c.tipo === 'recinto') c.pecore = c.pecore || pecoreIniziali()
  c.grp = def.crea(c)
  c.grp.userData.cosa = c
  c.grp.position.copy(centro(c))
  if (c.slot && !S.posseduti[c.tipo]) fantasma(c.grp)
  scena.add(c.grp)
  c.badge = nuovoBadge()
  occupa(c, c)
  cose.push(c)
  return c
}
function togli (c) {
  scena.remove(c.grp); c.badge.el.remove(); occupa(c, null)
  cose.splice(cose.indexOf(c), 1)
}

// fisse
{
  const fienile = { tipo: 'fienile', i: -9, j: -9 }, casa = { tipo: 'casa', i: -2, j: -10 }
  for (const [c, crea, w, d] of [[fienile, creaFienile, 4, 3], [casa, creaCasa, 4, 3]]) {
    c.w = w; c.d = d; c.grp = crea(); c.grp.position.copy(centro(c)); scena.add(c.grp)
    for (let a = 0; a < w; a++) for (let b = 0; b < d; b++) bloccoFisso[idx(c.i + a, c.j + b)] = 1
  }
}
ridisegnaLotti()
for (const t of ['pasticceria', 'mongolfiera']) metti({ tipo: t, slot: true, i: DEF[t].slot.i, j: DEF[t].slot.j })
for (const l of S.liberi) metti({ ...l })

// ── l'eroe ──
const eroe = creaEroe(); scena.add(eroe)
const E = { x: 0.5, z: 5.5, dir: Math.PI, percorso: [], dopo: null, az: null, fase: 0, vel: 0 }
eroe.position.set(E.x, 0, E.z)

// ── ricerca del percorso (Dijkstra a otto direzioni, senza tagliare gli angoli; le strade costano meno) ──
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
function libera (i, j) { return dentro(i, j) && !blocco[idx(i, j)] }
function distanze (i0, j0) {
  const dist = new Float32Array(GW * GH).fill(Infinity), prev = new Int32Array(GW * GH).fill(-1)
  dist[idx(i0, j0)] = 0
  const aperti = [idx(i0, j0)]
  while (aperti.length) {
    let m = 0
    for (let n = 1; n < aperti.length; n++) if (dist[aperti[n]] < dist[aperti[m]]) m = n
    const cur = aperti.splice(m, 1)[0]
    const ci = cur % GW + I0, cj = Math.floor(cur / GW) + J0
    for (const [di, dj] of DIRS) {
      const ni = ci + di, nj = cj + dj
      if (!libera(ni, nj)) continue
      if (di && dj && (!libera(ci + di, cj) || !libera(ci, cj + dj))) continue
      const k = idx(ni, nj), c = dist[cur] + (di && dj ? 1.414 : 1) * (strada[k] ? 0.55 : 1)
      if (c < dist[k]) { if (dist[k] === Infinity) aperti.push(k); dist[k] = c; prev[k] = cur }
    }
  }
  return { dist, prev }
}
function cellaEroe () { return [Math.floor(E.x), Math.floor(E.z)] }
/** celle da cui si può servire una cosa: il davanti per gli edifici, tutta la cornice per il resto */
function celleDiServizio (c) {
  const out = []
  if (c.slot) { for (let a = 0; a < c.w; a++) out.push([c.i + a, c.j + c.d]) }
  else {
    for (let a = 0; a < c.w; a++) { out.push([c.i + a, c.j - 1], [c.i + a, c.j + c.d]) }
    for (let b = 0; b < c.d; b++) { out.push([c.i - 1, c.j + b], [c.i + c.w, c.j + b]) }
  }
  return out.filter(([i, j]) => libera(i, j))
}
function vaiA (celle, dopo, verso) {
  LIBERA.on = false                                                    // la camera torna a seguire l'eroe
  const [i0, j0] = cellaEroe()
  const { dist, prev } = distanze(i0, j0)
  let meglio = -1
  for (const [i, j] of celle) { const k = idx(i, j); if (dist[k] < Infinity && (meglio < 0 || dist[k] < dist[meglio])) meglio = k }
  if (meglio < 0) { parla('Non ci arrivo…'); return false }
  const via = []
  for (let k = meglio; k >= 0 && k !== idx(i0, j0); k = prev[k]) via.push([k % GW + I0 + 0.5, Math.floor(k / GW) + J0 + 0.5])
  via.reverse()
  let lung = 0, px = E.x, pz = E.z; for (const [x, z] of via) { lung += Math.hypot(x - px, z - pz); px = x; pz = z }
  E.corsa = lung > 9                                                  // lontano: il contadino corre
  E.percorso = via; E.dopo = dopo; E.verso = verso || null
  if (!via.length && dopo) { E.dopo = null; dopo() }
  return true
}

// ── particelle e testi che volano ──
const particelle = []
const geoP = new THREE.BoxGeometry(0.08, 0.08, 0.08)
function scoppietta (pos, colore, n = 8, forza = 1.6, su = 2.4) {
  if (!Q.particelle) return
  for (let k = 0; k < n; k++) {
    const m = new THREE.Mesh(geoP, mat(colore, { emissive: colore, emissiveIntensity: 0.25 }))
    m.position.copy(pos); scena.add(m)
    particelle.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * forza, su * (0.5 + Math.random() * 0.6), (Math.random() - 0.5) * forza), vita: 0.9 + Math.random() * 0.4 })
  }
}
function fumata (pos) {
  if (!Q.particelle) return
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, fog: true }))
  m.position.copy(pos); scena.add(m); particelle.push({ m, v: new THREE.Vector3(0.15, 0.7, 0.05), vita: 1.8, fumo: true })
}
function muoviParticelle (dt) {
  for (let n = particelle.length - 1; n >= 0; n--) {
    const p = particelle[n]; p.vita -= dt
    if (p.vita <= 0) { scena.remove(p.m); particelle.splice(n, 1); continue }
    if (!p.fumo) p.v.y -= 7 * dt
    p.m.position.addScaledVector(p.v, dt)
    if (p.fumo) { p.m.scale.multiplyScalar(1 + dt * 0.9); p.m.material.opacity = Math.min(0.6, p.vita / 3) }
    else if (p.m.position.y < 0.05) { p.m.position.y = 0.05; p.v.set(0, 0, 0) }
  }
}

// ── l'interfaccia in HTML sopra la tela ──
function schermo (p, extra = 0) { V.set(p.x, p.y + extra, p.z).project(cam); return [(V.x * 0.5 + 0.5) * innerWidth, (-V.y * 0.5 + 0.5) * innerHeight, V.z < 1] }
function nuovoBadge () {
  const el = document.createElement('div'); el.className = 'badge'; el.hidden = true; sopra.appendChild(el)
  return { el, testo: '' }
}
function impostaBadge (b, testo, classe = '') {
  if (b.testo !== testo + classe) { b.testo = testo + classe; b.el.textContent = testo; b.el.className = 'badge ' + classe; b.el.hidden = !testo }
}
function volo (testo, pos, extra = 1.6) {
  const [x, y, visto] = schermo(pos, extra); if (!visto) return
  const el = document.createElement('div'); el.className = 'volo'; el.textContent = testo
  el.style.left = x + 'px'; el.style.top = y + 'px'; sopra.appendChild(el); setTimeout(() => el.remove(), 1500)
}
let fumettoEl = null, fumettoFine = 0
function parla (testo) {
  fumettoEl = fumettoEl || Object.assign(document.createElement('div'), { className: 'fumetto' })
  fumettoEl.textContent = testo; fumettoEl.hidden = false; sopra.appendChild(fumettoEl); fumettoFine = performance.now() + 2600
}
function aggiornaTesta () {
  if (!fumettoEl || fumettoEl.hidden) return
  if (performance.now() > fumettoFine) { fumettoEl.hidden = true; return }
  const [x, y] = schermo(eroe.position, 1.7); fumettoEl.style.left = x + 'px'; fumettoEl.style.top = y + 'px'
}
function chiedi (titolo, testo, bottoni) {
  $('dialogo-titolo').textContent = titolo; $('dialogo-testo').textContent = testo
  const b = $('dialogo-bottoni'); b.textContent = ''
  for (const { t, fn, quieto } of bottoni) {
    const e = document.createElement('button'); e.textContent = t; if (quieto) e.className = 'quieto'
    e.onclick = () => { $('dialogo').hidden = true; fn && fn() }; b.appendChild(e)
  }
  $('dialogo').hidden = false
}
function scorte () {
  const v = Object.entries(S.merci).filter(([, n]) => n > 0).map(([k, n]) => COLTURE[k].emoji + ' ' + n)
  return v.length ? v.join('  ') : '🌾 0'
}
const totScorte = () => Object.values(S.merci).reduce((a, n) => a + n, 0)
/** toglie n raccolti, prendendo dalla scorta più grande: per tutto ciò che «mangia» un raccolto qualsiasi */
function consuma (n) {
  if (totScorte() < n) return false
  for (let k = 0; k < n; k++) { const [c] = Object.entries(S.merci).sort((a, b) => b[1] - a[1])[0]; S.merci[c]-- }
  return true
}
function prodotti () {
  const v = Object.entries(S.prodotti).filter(([, n]) => n > 0).map(([k, n]) => RICETTE[k].emoji + ' ' + n)
  return v.length ? v.join('  ') : '🍞 0'
}
function mostraConti () {
  $('monete').textContent = '🪙 ' + S.monete; $('grano').textContent = scorte()
  $('torte').textContent = prodotti(); $('lana').textContent = '🧶 ' + S.lana + '  🪵 ' + (S.legna || 0)
  if (B.attiva) aggiornaVassoio()
}
function paga (n) { if (S.monete < n) return false; S.monete -= n; mostraConti(); salva(); return true }
$('esercizi').onclick = () => { S.monete += 50; mostraConti(); salva(); volo('+50 🪙', eroe.position) }
$('azzera').onclick = () => chiedi('Ricominciare?', 'Cancella la fattoria di prova e riparte da capo.', [{ t: 'Sì, da capo', fn: () => { try { localStorage.removeItem(CHIAVE) } catch (e) { /* */ } location.reload() } }, { t: 'No', quieto: true }])

// ── i campi e le pecore ──
const msDi = c => COLTURE[c.coltura || 'grano'].ms
const crescitaDi = (c) => c.tile.map(t => t === null ? -1 : Math.max(0, Math.min(1, (ora() - t) / msDi(c))))
const campoVuoto = c => c.tile.every(t => t === null)
const campoMaturo = c => crescitaDi(c).some(x => x >= 1)
const lanaPronta = (c, adesso) => c.pecore.filter(p => p.eta === 'adulta' && adesso - p.t0 >= LANA_MS)
const prezzoDi = tipo => { const d = DEF[tipo]; return d.prezzo + (d.rincaro || 0) * (cose.filter(c => c.tipo === tipo).length + ((S.magazzino || {})[tipo] || 0)) }
const prezzoLotto = () => 40 + 20 * (Object.values(S.lotti).filter(Boolean).length - Object.keys(LOTTI_INIZIALI).length)

// ── cosa fa l'eroe davanti a ogni cosa ──
function avvia (tipo, dur, fn, fine) { E.az = { tipo, t: 0, dur, fn, fine, fatto: new Set() } }
const faccia = (verso) => { if (verso) E.dir = Math.atan2(verso.x - E.x, verso.z - E.z) }
function fai (c) {
  const p = centro(c)
  if (E.az) return
  faccia(p)
  switch (c.tipo) {
    case 'campo': {
      const cr = crescitaDi(c)
      if (cr.some(x => x >= 1)) return falcia(c)
      if (cr.every(x => x < 0)) return scegliSeme(k => semina(c, k))
      const resto = Math.ceil((1 - Math.max(...cr.filter(x => x >= 0))) * msDi(c) / 1000)
      return parla(`Sta crescendo… ${resto}s`)
    }
    case 'pasticceria': {
      if (!S.posseduti.pasticceria) return offri(c)
      return apriPasticceria()
    }
    case 'mongolfiera': {
      if (!S.posseduti.mongolfiera) return offri(c)
      const M = S.mongolfiera
      if (M.cassa) { S.lana += 2; M.cassa = false; mostraConti(); salva(); volo('+2 🧶', p, 3); avvia('esulta', 0.9); return }
      if (M.fine) return parla('È ancora in viaggio…')
      if (!consuma(2)) return parla('Carica 2 raccolti sulla mongolfiera')
      M.fine = ora() + VIAGGIO; mostraConti(); salva(); avvia('semina', 0.8); volo('−2 raccolti', p, 3)
      return
    }
    case 'recinto': return cura(c)
    case 'fontana': case 'bancarella': {
      c.salto = 0.5; parla(c.tipo === 'fontana' ? 'Che bella!' : 'Mele buonissime!'); return
    }
  }
}
function scegliSeme (quando) {
  const el = $('semi'); el.textContent = ''
  const t = document.createElement('h2'); t.textContent = 'Cosa semini?'; el.appendChild(t)
  const x = document.createElement('button'); x.className = 'chiudi'; x.textContent = '✕'; x.onclick = () => { el.hidden = true }; el.appendChild(x)
  const griglia = document.createElement('div'); griglia.className = 'semi-griglia'; el.appendChild(griglia)
  for (const [k, col] of Object.entries(COLTURE)) {
    const b = document.createElement('button'); if (k === seme) b.className = 'ultimo'
    b.innerHTML = `<span class="em">${col.emoji}</span><b>${col.nome}</b><small>⏱ ${col.ms / 1000}s</small>`
    b.onclick = () => { el.hidden = true; seme = k; quando(k) }
    griglia.appendChild(b)
  }
  el.hidden = false
}
function semina (c, coltura) {
  const p = centro(c); faccia(p)
  avvia('semina', 1.1, (t) => {
    if (t > 0.5 && !E.az.fatto.has('s')) {
      E.az.fatto.add('s'); const n = ora(); c.coltura = coltura; c.tile = [n, n, n, n]; salva()
      scoppietta(p.clone().setY(0.4), 0x8a6a3a, 14, 1.2, 1.4)
    }
  })
}
function falcia (c) {
  const p = centro(c)
  avvia('falcia', 1.7, (t) => {
    c.tile.forEach((tt, k) => {
      const quando = 0.12 + k * 0.2             // t è la frazione 0..1 dell'animazione
      if (tt !== null && (ora() - tt) >= msDi(c) && t > quando && !E.az.fatto.has(k)) {
        E.az.fatto.add(k); c.tile[k] = null; S.merci[c.coltura || 'grano']++; mostraConti(); salva()
        const q = new THREE.Vector3(p.x + (k % 2 ? 0.5 : -0.5), 0.3, p.z + (k < 2 ? -0.5 : 0.5))
        const col = COLTURE[c.coltura || 'grano']; scoppietta(q, col.fc, 10, 1.8, 2.6); volo('+1 ' + col.emoji, q, 1.0)
      }
    })
  })
}
/** Il recinto: prima si tosa chi ha la lana pronta, poi si nutre (l'agnello cresce dopo due pasti, due adulte fanno nascere un agnello). */
function cura (c) {
  const p = centro(c), adesso = ora(), pr = c.pecore
  const pronte = lanaPronta(c, adesso)
  if (pronte.length) {
    avvia('semina', 1.2, (t) => {
      if (t > 0.5 && !E.az.fatto.has('t')) {
        E.az.fatto.add('t'); for (const x of pronte) x.t0 = ora()
        S.lana += pronte.length; mostraConti(); salva(); volo('+' + pronte.length + ' 🧶', p, 1.6); scoppietta(p.clone().setY(0.6), 0xffffff, 12, 1.6, 2.2)
      }
    })
    return
  }
  const agnello = pr.find(x => x.eta === 'agnello'), adulte = pr.filter(x => x.eta === 'adulta').length
  if (agnello || (adulte >= 2 && pr.length < PECORE_MAX)) {
    if (!consuma(1)) return parla('Per nutrirle serve un raccolto')
    mostraConti()
    avvia('semina', 1.0, (t) => {
      if (t > 0.5 && !E.az.fatto.has('n')) {
        E.az.fatto.add('n'); c.richiamo = { x: E.x - p.x, z: E.z - p.z }
        if (agnello) {
          agnello.cibo = (agnello.cibo || 0) + 1
          if (agnello.cibo >= 2) { agnello.eta = 'adulta'; agnello.t0 = ora(); volo('🐑 è cresciuta!', p, 1.8); scoppietta(p.clone().setY(0.8), 0xffd24a, 12, 1.6, 2.4) } else volo('🍼 +1', p, 1.6)
        } else {
          c.cibo = (c.cibo || 0) + 1
          if (c.cibo >= 2) { c.cibo = 0; pr.push({ eta: 'agnello', cibo: 0 }); sincronizzaPecore(c.grp, pr); volo('🐣 è nata una pecorella!', p, 1.8); scoppietta(p.clone().setY(0.8), 0xff9ab8, 14, 1.6, 2.4) } else volo('❤️', p, 1.6)
        }
        salva()
      }
    })
    return
  }
  const resto = Math.ceil(Math.min(...pr.filter(x => x.eta === 'adulta').map(x => LANA_MS - (adesso - x.t0))) / 1000)
  parla(Number.isFinite(resto) ? `La lana ricresce… ${resto}s` : 'Sono tutte sazie')
}

// ── il menu della pasticceria: ricette, coda del forno, pronti da ritirare ──
const ingredientiOk = r => Object.entries(r.ing).every(([k, n]) => S.merci[k] >= n)
function tickPasticceria (adesso) {
  const P = S.pasticceria; let cambiato = false
  while (P.coda.length && P.coda[0].fine && P.coda[0].fine <= adesso) {
    const r = P.coda.shift(); P.pronti[r.ric] = (P.pronti[r.ric] || 0) + 1; cambiato = true
    if (P.coda[0]) P.coda[0].fine = r.fine + RICETTE[P.coda[0].ric].ms               // il successivo parte quando finisce il precedente
  }
  if (P.coda[0] && !P.coda[0].fine) P.coda[0].fine = adesso + RICETTE[P.coda[0].ric].ms
  if (cambiato) salva()
}
const Pm = { el: null, forno: [], pronti: null, ritira: null, righe: [] }
function apriPasticceria () {
  const el = $('pasticceria'); el.textContent = ''; Pm.el = el; Pm.forno = []; Pm.righe = []
  const t = document.createElement('h2'); t.textContent = '🧁 Pasticceria'; el.appendChild(t)
  const x = document.createElement('button'); x.className = 'chiudi'; x.textContent = '✕'; x.onclick = () => { el.hidden = true }; el.appendChild(x)
  const h3 = txt => { const e = document.createElement('h3'); e.textContent = txt; el.appendChild(e) }
  h3('Nel forno')
  const forno = document.createElement('div'); forno.className = 'forno'; el.appendChild(forno)
  for (let k = 0; k < FORNO_POSTI; k++) {
    const b = document.createElement('div'); b.className = 'posto'
    b.innerHTML = '<span class="em"></span><small></small><i><u></u></i>'
    forno.appendChild(b); Pm.forno.push({ b, em: b.querySelector('.em'), tx: b.querySelector('small'), barra: b.querySelector('u') })
  }
  const pr = document.createElement('div'); pr.className = 'pronti'; el.appendChild(pr)
  Pm.pronti = pr.appendChild(document.createElement('span'))
  Pm.ritira = pr.appendChild(document.createElement('button')); Pm.ritira.textContent = 'Ritira tutto'
  Pm.ritira.onclick = () => {
    const P = S.pasticceria; let n = 0
    for (const [k, q] of Object.entries(P.pronti)) { S.prodotti[k] = (S.prodotti[k] || 0) + q; n += q }
    P.pronti = {}; mostraConti(); salva(); aggiornaPasticceria(); if (n) { volo('+' + n + ' 🍰', centro(cose.find(c => c.tipo === 'pasticceria')), 2.6); avvia('esulta', 0.9) }
  }
  h3('Cosa vuoi preparare?')
  const lista = document.createElement('div'); lista.className = 'ricette'; el.appendChild(lista)
  for (const [k, r] of Object.entries(RICETTE)) {
    const riga = document.createElement('div'); riga.className = 'ricetta'
    riga.innerHTML = `<span class="em">${r.emoji}</span><div><b>${r.nome}</b><small class="ing"></small><small>⏱ ${r.ms / 1000}s</small></div><button>＋ Prepara</button>`
    const btn = riga.querySelector('button'); btn.onclick = () => preparaRicetta(k)
    lista.appendChild(riga); Pm.righe.push({ k, ing: riga.querySelector('.ing'), btn })
  }
  const dis = document.createElement('p'); dis.className = 'nota'; Pm.dispensa = dis; el.appendChild(dis)
  el.hidden = false; aggiornaPasticceria()
}
function preparaRicetta (k) {
  const P = S.pasticceria, r = RICETTE[k]
  if (P.coda.length >= FORNO_POSTI) return parla('Il forno è pieno')
  if (!ingredientiOk(r)) return parla('Mancano degli ingredienti')
  for (const [i, n] of Object.entries(r.ing)) S.merci[i] -= n
  P.coda.push({ ric: k, fine: null }); tickPasticceria(ora()); mostraConti(); salva(); aggiornaPasticceria()
}
function aggiornaPasticceria () {
  if (!Pm.el || Pm.el.hidden) return
  const P = S.pasticceria, adesso = ora()
  Pm.forno.forEach((p, k) => {
    const it = P.coda[k]
    p.b.classList.toggle('vuoto', !it)
    if (!it) { p.em.textContent = '＋'; p.tx.textContent = 'libero'; p.barra.style.width = '0%'; return }
    const r = RICETTE[it.ric]; p.em.textContent = r.emoji
    if (it.fine) { const resto = Math.max(0, it.fine - adesso); p.tx.textContent = Math.ceil(resto / 1000) + 's'; p.barra.style.width = (100 - 100 * resto / r.ms) + '%' }
    else { p.tx.textContent = 'in coda'; p.barra.style.width = '0%' }
  })
  const pronti = Object.entries(P.pronti).filter(([, n]) => n > 0)
  Pm.pronti.textContent = pronti.length ? 'Pronti: ' + pronti.map(([k, n]) => RICETTE[k].emoji + ' ×' + n).join('  ') : 'Niente da ritirare'
  Pm.ritira.disabled = !pronti.length
  for (const r of Pm.righe) {
    const ric = RICETTE[r.k]
    r.ing.innerHTML = Object.entries(ric.ing).map(([i, n]) => `<span class="${S.merci[i] >= n ? 'ok' : 'manca'}">${COLTURE[i].emoji} ${S.merci[i]}/${n}</span>`).join(' ')
    r.btn.disabled = !ingredientiOk(ric) || P.coda.length >= FORNO_POSTI
  }
  const dis = Object.entries(S.prodotti).filter(([, n]) => n > 0).map(([k, n]) => RICETTE[k].emoji + ' ×' + n)
  Pm.dispensa.textContent = dis.length ? 'In dispensa: ' + dis.join('  ') : 'La dispensa è vuota: i prodotti serviranno per gli ordini (da fare).'
}
function offri (c) {
  const pr = prezzoDi(c.tipo)
  chiedi(c.def.nome, `Vuoi comprarla per 🪙 ${pr}? Ce n'è una sola e resta qui.`, [
    { t: `Compra · 🪙 ${pr}`, fn: () => {
      if (!paga(pr)) return parla(`Ti mancano ${pr - S.monete} 🪙`)
      S.posseduti[c.tipo] = true; scena.remove(c.grp); const g = c.def.crea(); g.userData.cosa = c; g.position.copy(centro(c)); c.grp = g; scena.add(g)
      scoppietta(centro(c).setY(1), 0xffd24a, 24, 3.5, 4); salva(); avvia('esulta', 1)
    } },
    { t: 'Non ora', quieto: true },
  ])
}
function offriLotto (l) {
  if (!confina(l)) return parla('Compra prima un terreno che confina con questo')
  const pr = prezzoLotto()
  chiedi('Terreno', `Allarga la fattoria: un lotto in più dove camminare, costruire e disegnare strade. Costa 🪙 ${pr}.`, [
    { t: `Compra · 🪙 ${pr}`, fn: () => {
      if (!paga(pr)) return dire(`Ti mancano ${pr - S.monete} 🪙`)
      S.lotti[l.id] = true; scoppietta(new THREE.Vector3(l.i + 2, 0.8, l.j + 2), 0xffd24a, 28, 4, 4); ridisegnaLotti(); salva(); aggiornaGriglia(); aggiornaVassoio()
    } },
    { t: 'Non ora', quieto: true },
  ])
}

// ── gli alberi: si abbattono con l'ascia e danno legna ──
const caduti = []
function abbatti (a) {
  if (E.az || a.tagliato || !a.tagliabile) return
  faccia(centro(a))
  avvia('abbatti', 1.7, (t) => {
    if (t > 0.62 && !E.az.fatto.has('c')) {
      E.az.fatto.add('c'); cade(a); S.legna = (S.legna || 0) + LEGNA_PER_ALBERO; S.tagliati.push(a.n); mostraConti(); salva()
      volo('+' + LEGNA_PER_ALBERO + ' 🪵', centro(a), 1.8)
    }
  })
}
function cade (a) {
  togliIstanzaAlbero(a); ricalcolaBlocco()
  const col = new THREE.Color().setHSL(0.27 + a.c * 0.05, 0.5, 0.3 + a.c * 0.1)
  const perno = new THREE.Group(), g = new THREE.Group()
  for (const [geo, m] of [[FORME.tronco, mat(0x7a5232)], [FORME.chioma, mat(col.getHex())], [FORME.chioma2, mat(col.getHex())]]) { const o = new THREE.Mesh(geo, m); o.castShadow = true; g.add(o) }
  g.scale.setScalar(a.s); perno.add(g)
  perno.position.set(a.i + 0.5, 0, a.j + 0.5); perno.rotation.y = Math.atan2(a.i + 0.5 - E.x, a.j + 0.5 - E.z)    // cade lontano dall'eroe
  scena.add(perno); caduti.push({ perno, g, t: 0 })
  scoppietta(new THREE.Vector3(a.i + 0.5, 0.8, a.j + 0.5), 0x3a7a30, 14, 2, 2.5)
}
function muoviCaduti (dt) {
  for (let n = caduti.length - 1; n >= 0; n--) {
    const c = caduti[n]; c.t += dt
    const t = Math.min(1, c.t / 0.7)
    c.g.rotation.x = t * t * Math.PI / 2
    if (c.t > 0.7) { const k = Math.max(0, 1 - (c.t - 0.7) / 0.35); c.perno.scale.setScalar(k); if (k <= 0) { scena.remove(c.perno); caduti.splice(n, 1) } }
  }
}
/** i cartelli del prezzo dei soli lotti che confinano con i tuoi; gli altri sono solo scuri */
const badgeLotto = {}
function aggiornaBadgeLotti () {
  for (const l of LOTTI) {
    const mostra = !posseduto(l) && confina(l) && (B.attiva || Math.hypot(l.i + 2 - E.x, l.j + 2 - E.z) < 8)
    let b = badgeLotto[l.id]
    if (!mostra) { if (b) b.el.hidden = true; continue }
    b = badgeLotto[l.id] || (badgeLotto[l.id] = nuovoBadge())
    impostaBadge(b, `🪙 ${prezzoLotto()}`, 'vendita')
    V.set(l.i + 2, 0.6, l.j + 2).project(cam)
    const x = (V.x * 0.5 + 0.5) * innerWidth, y = (-V.y * 0.5 + 0.5) * innerHeight
    b.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
    b.el.style.visibility = V.z < 1 && x > 20 && x < innerWidth - 20 && y > 60 && y < innerHeight - 100 ? 'visible' : 'hidden'
  }
}
function lottoSotto (cx, cy) {
  const p = puntaSuolo(cx, cy); if (!p) return null
  const l = lottoDi(Math.floor(p.x), Math.floor(p.z))
  return l && !posseduto(l) ? l : null
}
function alberoSotto (cx, cy) {
  ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); raggio.setFromCamera(ndc, cam)
  const hit = raggio.intersectObjects(istanzeAlberi, false).find(h => ALBERI[h.instanceId] && !ALBERI[h.instanceId].tagliato && ALBERI[h.instanceId].tagliabile)
  return hit ? ALBERI[hit.instanceId] : null
}

// ── le azioni rapide: si arma «semina», «raccogli» o «cura» e poi si toccano le cose ──
let modo = 'libero', seme = 'grano'
const coda = []
const applicabile = c => c.tipo === 'campo' && (modo === 'semina' ? campoVuoto(c) : modo === 'raccogli' ? campoMaturo(c) : false)
const motivo = c => modo === 'semina' ? 'Qui è già seminato' : modo === 'raccogli' ? 'Non è ancora pronto' : 'Qui non serve'
function impostaModo (m) {
  modo = m; svuotaCoda()
  for (const k of ['libero', 'semina', 'raccogli']) $('az-' + k).classList.toggle('acceso', k === m)
  $('az-tutti').hidden = m === 'libero'
  $('az-seme').textContent = COLTURE[seme].emoji
  if (m !== 'libero') parla({ semina: 'Tocca i campi da seminare', raccogli: 'Tocca i campi pronti da tagliare', }[m])
}
/** un anello giallo attorno a ciò che è in coda: sta sul campo, non gira per lo schermo */
function segnaCoda (c) {
  if (!c.inCoda && !c.anello) return
  if (!c.anello) {
    const r = c.albero ? 0.9 : Math.max(c.w, c.d) * 0.62
    c.anello = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.12, 28), new THREE.MeshBasicMaterial({ color: 0xffc830, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }))
    c.anello.rotation.x = -Math.PI / 2
    if (c.grp) { c.anello.position.y = 0.2; c.grp.add(c.anello) } else { c.anello.position.set(c.i + 0.5, 0.2, c.j + 0.5); scena.add(c.anello); anelliAlberi.push(c) }
  }
  c.anello.visible = !!c.inCoda && !c.tagliato
}
const anelliAlberi = []
const daFare = { semina: 0, raccogli: 0 }
/** i numeri sui tasti: quante cose aspettano quell'azione */
function aggiornaContatori () {
  const n = { semina: 0, raccogli: 0 }
  for (const c of cose) {
    if (c.tipo === 'campo') { if (campoVuoto(c)) n.semina++; else if (campoMaturo(c)) n.raccogli++ }
  }
  for (const k of Object.keys(n)) if (n[k] !== daFare[k]) { daFare[k] = n[k]; const e = $('n-' + k); e.textContent = n[k]; e.hidden = !n[k] }
}
function svuotaCoda () { for (const c of coda) c.inCoda = false; coda.length = 0 }
function accoda (c) { if (!c.inCoda) { c.inCoda = true; coda.push(c) } }
function eseguiModo (c) {
  if (E.az || !applicabile(c)) return
  faccia(centro(c))
  if (modo === 'semina') return semina(c, seme)
  if (modo === 'raccogli') return falcia(c)
}
$('az-libero').onclick = () => impostaModo('libero')
$('az-semina').onclick = () => scegliSeme(() => impostaModo('semina'))
$('az-raccogli').onclick = () => impostaModo(modo === 'raccogli' ? 'libero' : 'raccogli')
$('az-tutti').onclick = () => {
  const lista = cose.filter(applicabile).sort((a, b) => Math.hypot(a.i - E.x, a.j - E.z) - Math.hypot(b.i - E.x, b.j - E.z))
  if (!lista.length) return parla('Non c\'è niente da fare')
  lista.forEach(accoda); parla(`Faccio ${lista.length} ${lista.length === 1 ? 'cosa' : 'cose'}`)
}
impostaModo('libero')

// ── toccare ──
const raggio = new THREE.Raycaster(), ndc = new THREE.Vector2(), suolo = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
function puntaSuolo (cx, cy) {
  ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); raggio.setFromCamera(ndc, cam)
  const p = new THREE.Vector3(); return raggio.ray.intersectPlane(suolo, p) ? p : null
}
function cosaSotto (cx, cy) {
  ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); raggio.setFromCamera(ndc, cam)
  const hit = raggio.intersectObjects(cose.map(c => c.grp), true)[0]
  let o = hit && hit.object
  while (o && !o.userData.cosa) o = o.parent
  if (o) return o.userData.cosa
  const p = puntaSuolo(cx, cy)
  return p ? cellaCosa[idx(Math.floor(p.x), Math.floor(p.z))] : null
}
const fogliAperti = () => !$('dialogo').hidden || !$('semi').hidden || !$('pasticceria').hidden || (!$('opzioni').hidden && !$('opzioni').classList.contains('piccolo'))
function tocca (cx, cy) {
  if (fogliAperti()) return
  if (B.attiva) return toccaCostruzione(cx, cy)
  const c = cosaSotto(cx, cy) || alberoSotto(cx, cy)
  if (c && c.tipo === 'campo' && modo !== 'libero') {                  // semina e raccogli: si toccano più campi, l'eroe li fa in fila
    if (!applicabile(c)) return parla(motivo(c))
    return accoda(c)
  }
  if (E.az) return
  svuotaCoda()
  if (c && c.albero) { const l = lottoDi(c.i, c.j); return l && !posseduto(l) ? offriLotto(l) : vaiA(celleDiServizio(c), () => abbatti(c), centro(c)) }
  if (c) return vaiA(celleDiServizio(c), () => fai(c), centro(c))
  const l = lottoSotto(cx, cy); if (l) return offriLotto(l)           // ciò che sta in un terreno non tuo si compra, non si raggiunge
  const p = puntaSuolo(cx, cy); if (!p) return
  const i = Math.floor(p.x), j = Math.floor(p.z)
  const cand = []
  for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (libera(i + a, j + b)) cand.push([i + a, j + b, Math.hypot(a, b)])
  cand.sort((u, v) => u[2] - v[2])
  if (cand.length) vaiA([[cand[0][0], cand[0][1]]], null, null)
}

// ── costruire: si trascina la carta dalla barra fino alla mappa e al rilascio si costruisce ──
// Un pezzo non ancora pagato chiede la conferma appena si comincia a trascinarlo; pagato, sta nel magazzino
// (il numero sulla carta) e si può trascinare quando si vuole. Un pezzo già messo si riprende e si sposta
// allo stesso modo; rilasciato sulla barra torna nel magazzino.
const B = { attiva: false, scelta: null, fant: null, i: 0, j: 0, ok: false, spostando: null, vista: 'campi', pan: { x: 0, z: 0 }, tratto: null }
const D = { attivo: false, tipo: null }                   // il trascinamento in corso
function validoQui () {
  const def = DEF[D.tipo]
  for (let a = 0; a < def.w; a++) for (let b = 0; b < def.d; b++) {
    const i = B.i + a, j = B.j + b
    if (!dentro(i, j)) return false
    if (!cellaPropria(i, j)) return false
    const k = idx(i, j)
    if (blocco[k] && cellaCosa[k] !== B.spostando) return false
  }
  return true
}
function aggiornaGriglia () {
  for (const l of LOTTI) grigliaLotto[l.id].visible = posseduto(l)
}
function togliFantasma () { if (B.fant) scena.remove(B.fant); B.fant = null }
const zonaDrop = () => B.attiva ? $('vassoio') : $('zonaVia')
const sulVassoio = y => y > zonaDrop().getBoundingClientRect().top
const dire = (t, conAnnulla) => B.attiva ? avviso(t, conAnnulla) : (t && parla(t))
function aggiornaFantasma () {
  if (!B.fant) return
  const def = DEF[D.tipo]; B.fant.position.set(B.i + def.w / 2, 0, B.j + def.d / 2)
  B.ok = validoQui(); tingi(B.fant, B.ok)
}
/** il fantasma segue il dito, un po' più in su per non stare sotto il dito */
function fantasmaSuDito (cx, cy) {
  const p = puntaSuolo(cx, cy); if (!p) return
  const def = DEF[D.tipo]
  B.i = Math.round(p.x - def.w / 2); B.j = Math.round(p.z - def.d / 2 - 1.6); aggiornaFantasma()
}
function iniziaTrascinamento (tipo, daSpostare, x, y) {
  Object.assign(D, { attivo: true, tipo }); B.scelta = null; B.spostando = daSpostare || null
  if (B.spostando) { B.spostando.grp.visible = false; B.spostando.badge.el.hidden = true; occupa(B.spostando, null) }
  B.fant = DEF[tipo].crea(B.spostando || undefined); fantasma(B.fant); scena.add(B.fant)
  const ch = $('trascinato'); ch.textContent = DEF[tipo].emoji; ch.hidden = false
  document.body.classList.add('trascinando'); if (!B.attiva) { griglia.visible = true; $('zonaVia').hidden = false }
  aggiornaGriglia(); aggiornaVassoio(); muoviTrascinamento(x, y)
}
function muoviTrascinamento (x, y) {
  const su = sulVassoio(y), ch = $('trascinato')
  ch.style.transform = `translate(${x}px, ${y - 56}px) translate(-50%, -50%)`
  ch.style.visibility = su ? 'visible' : 'hidden'
  B.fant.visible = !su
  if (!su) fantasmaSuDito(x, y)
  zonaDrop().classList.toggle('bersaglio', su && !!B.spostando)
  const msg = su ? (B.spostando ? 'Rilascia qui per mettere via (🪙 1)' : 'Portalo sulla mappa e rilascia') : (B.ok ? 'Rilascia per costruire qui' : 'Qui non si può: cerca un posto libero nei tuoi terreni')
  if (B.attiva) avviso(msg); else $('zonaVia').firstElementChild.textContent = '📦 ' + (su ? msg : 'Trascinalo dove vuoi, o qui per mettere via')
}
function fineTrascinamento () {
  togliFantasma(); $('trascinato').hidden = true; document.body.classList.remove('trascinando'); $('vassoio').classList.remove('bersaglio'); $('zonaVia').classList.remove('bersaglio'); $('zonaVia').hidden = true
  if (!B.attiva) griglia.visible = false
  if (B.spostando) { B.spostando.grp.visible = true; occupa(B.spostando, B.spostando) }
  Object.assign(D, { attivo: false, tipo: null }); B.spostando = null; aggiornaGriglia(); aggiornaVassoio()
}
function rilascia (x, y) {
  if (!D.attivo) return
  const su = sulVassoio(y), tipo = D.tipo, c0 = B.spostando
  aggiornaFantasma()
  const ok = B.ok, i = B.i, j = B.j
  if (c0) {
    fineTrascinamento()                                                  // il pezzo è di nuovo al suo posto
    if (su) {
      if (c0.tile && c0.tile.some(t => t !== null)) return dire('Quello che sta crescendo non si mette via')
      if (c0.pecore) return dire('Il recinto ha le pecore: spostalo, non si mette via')
      if (S.monete < 1) return dire('Ti manca 🪙 1')
      paga(1); togli(c0); S.magazzino[tipo] = (S.magazzino[tipo] || 0) + 1; salva(); aggiornaVassoio(); return dire(DEF[tipo].nome + ' messo via: lo ritrovi in Costruisci')
    }
    if (!ok) return dire('Qui non si può: è rimasto dov\'era')
    if (i === c0.i && j === c0.j) return
    if (S.monete < COSTO_SPOSTARE) return dire('Ti manca 🪙 1')
    paga(COSTO_SPOSTARE)
    const da = { i: c0.i, j: c0.j }; occupa(c0, null); c0.i = i; c0.j = j; c0.grp.position.copy(centro(c0)); occupa(c0, c0)
    ultima = { tipo: 'sposta', c: c0, da, costo: COSTO_SPOSTARE }; salva(); return dire('Spostato', true)
  }
  fineTrascinamento()
  if (su) return dire('')
  if (!ok) return dire('Qui non si può: cerca un posto libero nei tuoi terreni')
  S.magazzino[tipo]--
  const c = metti({ tipo, i, j }); c.grp.scale.setScalar(0.01); c.nasce = 0
  scoppietta(centro(c).setY(0.5), 0xfff2a0, 14, 2.4, 3)
  ultima = { tipo: 'nuovo', c }; salva(); aggiornaVassoio(); avviso(DEF[tipo].nome + ' costruito', true)
}
let ultima = null
function annullaUltima () {
  const u = ultima; if (!u) return; ultima = null
  if (u.tipo === 'nuovo') { const t = u.c.tipo; togli(u.c); S.magazzino[t] = (S.magazzino[t] || 0) + 1 }
  else if (u.tipo === 'sposta') { occupa(u.c, null); u.c.i = u.da.i; u.c.j = u.da.j; u.c.grp.position.copy(centro(u.c)); occupa(u.c, u.c); S.monete += u.costo }
  else if (u.tipo === 'strada') { for (const k of u.celle) { if (k >= 0) strada[k] = 0; else strada[-k - 1] = 1 } ridisegnaStrade(); S.monete += u.costo }
  mostraConti(); salva(); avviso('Annullato')
}
const prezzoPezzo = tipo => { const d = DEF[tipo]; return d.prezzo + (d.rincaro || 0) * (cose.filter(c => c.tipo === tipo).length + (S.magazzino[tipo] || 0)) }
function compraPezzo (tipo) {
  const pr = prezzoPezzo(tipo), nome = DEF[tipo].nome
  chiedi('Comprare: ' + nome, `Costa 🪙 ${pr}. Poi lo trascini sulla mappa dove vuoi.`, [
    { t: `Compra · 🪙 ${pr}`, fn: () => {
      if (!paga(pr)) return avviso(`Ti mancano 🪙 ${pr - S.monete}`)
      S.magazzino[tipo] = (S.magazzino[tipo] || 0) + 1; salva(); aggiornaVassoio(); avviso(nome + ' comprato: trascinalo sulla mappa')
      const b = $('carte').querySelector(`[data-s=${tipo}]`); if (b) { b.classList.add('salta'); setTimeout(() => b.classList.remove('salta'), 900) }
    } },
    { t: 'No', quieto: true },
  ])
}
function toccaCostruzione (cx, cy) {
  const c = cosaSotto(cx, cy)
  if (c && c.slot) return fai(c)                           // un edificio unico: si compra anche da qui
  if (!c) { const l = lottoSotto(cx, cy); if (l) offriLotto(l) }
}
function esciDaCostruzione () {
  if (D.attivo) fineTrascinamento()
  Object.assign(B, { attiva: false, scelta: null, spostando: null, tratto: null })
  griglia.visible = false; document.body.classList.remove('costruendo'); $('vassoio').hidden = true; zoom = 1
}
$('costruisci').onclick = () => {
  if (E.az) return
  svuotaCoda(); impostaModo('libero')
  Object.assign(B, { attiva: true, scelta: null, vista: 'vicino', pan: { x: 0, z: 0 } }); zoom = 1; ultima = null
  griglia.visible = true; document.body.classList.add('costruendo'); $('vassoio').hidden = false; aggiornaGriglia(); aggiornaVassoio(); avviso('')
}
$('vassoio-chiudi').onclick = esciDaCostruzione
function avviso (testo, conAnnulla) {
  const el = $('suggerimento'); el.textContent = ''
  const t = document.createElement('span'); t.textContent = testo || suggerimento(); el.appendChild(t)
  if (conAnnulla && ultima) { const b = document.createElement('button'); b.textContent = '↶ Annulla'; b.onclick = annullaUltima; el.appendChild(b) }
}
function suggerimento () {
  if (B.scelta === 'strada') return `Trascina il dito sulla mappa per disegnare la strada (🪙 ${COSTRADA()} a pezzo).`
  if (B.scelta === 'gomma') return 'Trascina sulle strade che hai disegnato per toglierle.'
  return 'Trascina un pezzo dalla barra alla mappa. Un pezzo già messo si riprende e si sposta; un terreno scuro si compra toccandolo.'
}
const COSTRADA = () => COSTO_STRADA
const STRUMENTI = [...['campo', 'recinto', 'bancarella', 'fontana'].map(t => ({ id: t, em: DEF[t].emoji, nome: DEF[t].nome })), { id: 'strada', em: '🛣️', nome: 'Strada' }, { id: 'gomma', em: '🧽', nome: 'Gomma' }]
function aggiornaVassoio () {
  const car = $('carte')
  if (!car.children.length) {
    for (const s of STRUMENTI) {
      const b = document.createElement('button'); b.dataset.s = s.id
      if (DEF[s.id]) b.addEventListener('pointerdown', e => cominciaDaCarta(e, s.id))
      else b.onclick = () => { B.scelta = B.scelta === s.id ? null : s.id; B.tratto = null; aggiornaVassoio(); avviso('') }
      car.appendChild(b)
    }
  }
  for (const b of car.children) {
    const id = b.dataset.s, s = STRUMENTI.find(x => x.id === id), n = S.magazzino[id] || 0
    const pr = DEF[id] ? (n ? `📦 ×${n}` : '🪙 ' + prezzoPezzo(id)) : id === 'strada' ? `🪙 ${COSTO_STRADA}/pezzo` : 'gratis'
    const html = `<span class="em">${s.em}</span><b>${s.nome}</b><small>${pr}</small>`
    if (b.innerHTML !== html) b.innerHTML = html
    b.classList.toggle('scelto', B.scelta === id); b.classList.toggle('pieno', n > 0)
  }
  for (const b of $('vista').children) b.classList.toggle('acceso', b.dataset.v === B.vista)
  const el = $('suggerimento'); if (!el.querySelector('button') && !D.attivo) avviso('')
}
for (const b of $('vista').children) b.onclick = () => { B.vista = b.dataset.v; B.pan = { x: 0, z: 0 }; aggiornaVassoio() }

/** Un dito su una carta: se sale verso l'alto è un trascinamento (conferma d'acquisto se non è pagato), se scorre di lato è la barra che scorre. */
function cominciaDaCarta (e, tipo) {
  const x0 = e.clientX, y0 = e.clientY, id = e.pointerId; let fatto = false
  const muovi = ev => {
    if (ev.pointerId !== id) return
    if (D.attivo) return muoviTrascinamento(ev.clientX, ev.clientY)
    const dx = ev.clientX - x0, dy = ev.clientY - y0
    if (!fatto && dy < -14 && -dy > Math.abs(dx)) {
      fatto = true
      if (!(S.magazzino[tipo] > 0)) { smonta(); return compraPezzo(tipo) }       // non è pagato: prima la conferma
      iniziaTrascinamento(tipo, null, ev.clientX, ev.clientY)
    }
  }
  const su = ev => {
    if (ev.pointerId !== id) return
    const era = D.attivo; smonta()
    if (era) { if (ev.type === 'pointerup') rilascia(ev.clientX, ev.clientY); else fineTrascinamento() }
    else if (ev.type === 'pointerup' && !fatto && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 12) {   // un tocco
      if (S.magazzino[tipo] > 0) avviso('Trascina «' + DEF[tipo].nome + '» dalla barra fino alla mappa'); else compraPezzo(tipo)
    }
  }
  const smonta = () => { removeEventListener('pointermove', muovi); removeEventListener('pointerup', su); removeEventListener('pointercancel', su) }
  addEventListener('pointermove', muovi); addEventListener('pointerup', su); addEventListener('pointercancel', su)
}

// le strade a pennello
function celleLinea (a, b) {
  const out = []; let [i, j] = a; const [i1, j1] = b
  const di = Math.abs(i1 - i), dj = -Math.abs(j1 - j), si = i < i1 ? 1 : -1, sj = j < j1 ? 1 : -1; let err = di + dj
  for (let n = 0; n < 80; n++) { out.push([i, j]); if (i === i1 && j === j1) break; const e2 = 2 * err; if (e2 >= dj) { err += dj; i += si } if (e2 <= di) { err += di; j += sj } }
  return out
}
function dipingi (cx, cy) {
  const p = puntaSuolo(cx, cy); if (!p) return
  const cella = [Math.floor(p.x), Math.floor(p.z)]
  const da = B.ultimaCella || cella; B.ultimaCella = cella
  if (!B.tratto) B.tratto = { celle: [], costo: 0 }
  let cambiato = false
  for (const [i, j] of celleLinea(da, cella)) {
    if (!dentro(i, j)) continue
    const k = idx(i, j)
    if (B.scelta === 'strada') {
      if (strada[k] || blocco[k] || !cellaPropria(i, j)) continue
      if (S.monete < COSTO_STRADA) { avviso('Hai finito le monete: niente altra strada'); break }
      S.monete -= COSTO_STRADA; strada[k] = 1; B.tratto.celle.push(k); B.tratto.costo += COSTO_STRADA; cambiato = true
    } else if (strada[k] === 1) { strada[k] = 0; B.tratto.celle.push(-k - 1); cambiato = true }
  }
  if (cambiato) { ridisegnaStrade(); mostraConti(); salva() }
}
function finisciTratto () {
  B.ultimaCella = null
  if (B.tratto && B.tratto.celle.length) { ultima = { tipo: 'strada', celle: B.tratto.celle, costo: B.tratto.costo }; avviso(B.scelta === 'strada' ? `Strada fatta (🪙 ${B.tratto.costo})` : 'Tolta', true) }
  B.tratto = null
}

// ── il dito ──
const punti = new Map()
let pinch0 = 0, zoom0 = 1, zoom = 1, inizio = null, trascina = false, ultimaCella = '', centroPrima = null, lungo = 0
const centroDita = () => { const [a, b] = [...punti.values()]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }
tela.addEventListener('pointerdown', e => {
  tela.setPointerCapture(e.pointerId); punti.set(e.pointerId, [e.clientX, e.clientY])
  if (punti.size === 2) {
    const [a, b] = [...punti.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); zoom0 = zoom; inizio = null; centroPrima = centroDita()
    B.tratto = null; B.ultimaCella = null; return
  }
  inizio = { x: e.clientX, y: e.clientY }; trascina = false
  clearTimeout(lungo)
  if (!B.attiva && !fogliAperti()) {                           // tenere premuto su un pezzo lo solleva: si sposta o si mette via
    const c = cosaSotto(e.clientX, e.clientY)
    if (c && c.def && !c.slot && !c.lotto) {
      const ini = inizio
      lungo = setTimeout(() => {
        if (inizio !== ini || trascina || punti.size !== 1 || D.attivo) return
        try { navigator.vibrate && navigator.vibrate(30) } catch (x) { /* niente vibrazione */ }
        ini.lungo = true; svuotaCoda(); iniziaTrascinamento(c.tipo, c, ini.x, ini.y)
      }, 450)
    }
  }
  if (B.attiva && !fogliAperti()) {
    if (B.scelta === 'strada' || B.scelta === 'gomma') dipingi(e.clientX, e.clientY)
    else { const c = cosaSotto(e.clientX, e.clientY); inizio.cand = c && c.def && !c.slot && !c.lotto ? c : null }   // un pezzo già messo si riprende trascinandolo
  }
})
tela.addEventListener('pointermove', e => {
  if (!punti.has(e.pointerId)) return
  punti.set(e.pointerId, [e.clientX, e.clientY])
  if (punti.size === 2) {
    const [a, b] = [...punti.values()]
    zoom = Math.max(0.55, Math.min(1.7, zoom0 * pinch0 / Math.max(1, Math.hypot(a[0] - b[0], a[1] - b[1]))))
    if (B.attiva) {                                               // due dita che scorrono spostano la vista
      const c = centroDita(), p0 = puntaSuolo(centroPrima[0], centroPrima[1]), p1 = puntaSuolo(c[0], c[1])
      if (p0 && p1) { B.pan.x -= p1.x - p0.x; B.pan.z -= p1.z - p0.z }
      centroPrima = c
    }
    return
  }
  if (!inizio) return
  if (D.attivo && inizio.lungo) return muoviTrascinamento(e.clientX, e.clientY)
  if (lungo && Math.hypot(e.clientX - inizio.x, e.clientY - inizio.y) > 10) { clearTimeout(lungo); lungo = 0 }
  if (!trascina && Math.hypot(e.clientX - inizio.x, e.clientY - inizio.y) > 16) trascina = true
  if (B.attiva) {
    if (B.scelta === 'strada' || B.scelta === 'gomma') return dipingi(e.clientX, e.clientY)
    if (D.attivo) muoviTrascinamento(e.clientX, e.clientY)
    else if (trascina && inizio.cand) iniziaTrascinamento(inizio.cand.tipo, inizio.cand, e.clientX, e.clientY)
    else if (trascina && !B.scelta) trascinaMappa(e)
    return
  }
  if (!trascina || fogliAperti()) return
  trascinaMappa(e)                                                    // un dito che scorre sposta la mappa: per andare lontano tocca poi dove vuoi
})
function trascinaMappa (e) {
  const prima = inizio.u || { x: inizio.x, y: inizio.y }
  inizio.u = { x: e.clientX, y: e.clientY }
  const p0 = puntaSuolo(prima.x, prima.y), p1 = puntaSuolo(e.clientX, e.clientY)
  if (!p0 || !p1) return
  if (B.attiva) { B.pan.x -= p1.x - p0.x; B.pan.z -= p1.z - p0.z; return }
  if (!LIBERA.on) { LIBERA.on = true; LIBERA.x = CAM.x; LIBERA.z = CAM.z }
  LIBERA.x = Math.max(-13, Math.min(13, LIBERA.x - (p1.x - p0.x))); LIBERA.z = Math.max(-11, Math.min(11, LIBERA.z - (p1.z - p0.z)))
  CAM.x = LIBERA.x; CAM.z = LIBERA.z                                 // segue il dito senza ritardo
}
const fine = e => {
  if (!punti.has(e.pointerId)) return
  punti.delete(e.pointerId)
  const su = e.type === 'pointerup'
  clearTimeout(lungo); lungo = 0
  if (!su && D.attivo) fineTrascinamento()
  if (D.attivo && inizio && inizio.lungo) { rilascia(e.clientX, e.clientY); inizio = null; ultimaCella = ''; return }
  if (B.attiva && inizio && su) {
    if (D.attivo) rilascia(e.clientX, e.clientY)
    else if (B.scelta === 'strada' || B.scelta === 'gomma') finisciTratto()
    else if (!trascina) tocca(e.clientX, e.clientY)
  } else if (inizio && !trascina && su) tocca(e.clientX, e.clientY)
  inizio = null; ultimaCella = ''
}
tela.addEventListener('pointerup', fine); tela.addEventListener('pointercancel', fine)
tela.addEventListener('contextmenu', e => e.preventDefault())
$('centra').onclick = () => { LIBERA.on = false }

// ── la telecamera ──
const CAM = { x: E.x, z: E.z, d: 22, p: 55, off: 0 }
const LIBERA = { on: false, x: 0, z: 0 }                // la camera trascinata col dito: finché non si manda l'eroe da qualche parte
function adatta () {
  renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix()
}
addEventListener('resize', adatta); adatta()
function muoviCamera (dt) {
  let tx = E.x, tz = E.z, td = Q.camera * zoom, tp = 55
  if (B.attiva) {
    let q = { i: E.x - 5, j: E.z - 6, w: 10, d: 12 }                    // «vicino»: attorno all'eroe
    if (B.vista === 'tutto') {                                           // «tutto»: tutto ciò che è tuo
      const mie = LOTTI.filter(posseduto); q = { i: Math.min(...mie.map(l => l.i)), j: Math.min(...mie.map(l => l.j)) }
      q.w = Math.max(...mie.map(l => l.i + l.w)) - q.i; q.d = Math.max(...mie.map(l => l.j + l.d)) - q.j
    }
    tx = q.i + q.w / 2 + B.pan.x; tz = q.j + q.d / 2 + 0.5 + B.pan.z
    const t = Math.tan(cam.fov * Math.PI / 360)
    tp = 66
    td = Math.max((q.w + 2) / (2 * t * cam.aspect), (q.d + 4) * Math.sin(tp * Math.PI / 180) / (2 * t), 11) * zoom
  } else {
    if (LIBERA.on) { tx = LIBERA.x; tz = LIBERA.z }
    tx = Math.max(-13, Math.min(13, tx)); tz = Math.max(-11, Math.min(11, tz))
  }
  $('centra').hidden = !LIBERA.on || B.attiva
  const k = 1 - Math.exp(-(E.vel > 7 && !LIBERA.on ? 9 : 5) * dt)
  const off = B.attiva ? 0.12 : 0
  CAM.off += (off - CAM.off) * k
  if (Math.abs(CAM.off - (CAM.offApp || 0)) > 0.002) { CAM.offApp = CAM.off; cam.setViewOffset(innerWidth, innerHeight, 0, innerHeight * CAM.off, innerWidth, innerHeight); cam.updateProjectionMatrix() }
  CAM.x += (tx - CAM.x) * k; CAM.z += (tz - CAM.z) * k; CAM.d += (td - CAM.d) * k; CAM.p += (tp - CAM.p) * k
  const p = CAM.p * Math.PI / 180
  cam.position.set(CAM.x, CAM.d * Math.sin(p), CAM.z + CAM.d * Math.cos(p)); cam.lookAt(CAM.x, 0.3, CAM.z)
  sole.position.set(CAM.x - 8, 17, CAM.z + 6); sole.target.position.set(CAM.x, 0, CAM.z)
  const ombra = Math.max(12, Math.min(26, CAM.d * 0.9)); Object.assign(sole.shadow.camera, { left: -ombra, right: ombra, top: ombra, bottom: -ombra }); sole.shadow.camera.updateProjectionMatrix()
}

// ── il tempo di ogni fotogramma ──
const riga = $('riga')
let t0 = performance.now(), tPrima = t0, tSalva = 0, tFumo = 0, tF = 0
const ang = (a, b, k) => { let d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * k }

function animaEroe (dt, tt) {
  const u = eroe.userData
  u.gambe.forEach(g => { g.rotation.x = 0 }); u.bracci.forEach(b => b.rotation.set(0, 0, 0)); u.busto.rotation.set(0, 0, 0); u.busto.position.y = 0.34
  eroe.position.y = 0; u.falce.visible = false; u.ascia.visible = false
  const a = E.az
  if (a) {
    const p = a.t / a.dur
    if (a.tipo === 'semina') {
      u.busto.rotation.x = 0.5 * Math.sin(Math.min(1, p) * Math.PI)
      u.bracci[1].rotation.x = -0.6 - Math.sin(tt * 22) * 0.6; u.bracci[0].rotation.x = 0.3
    } else if (a.tipo === 'falcia') {
      u.falce.visible = true
      const sw = 0.5 - 0.5 * Math.cos(p * Math.PI * 6)                     // tre passate
      u.bracci[1].rotation.x = -1.35; u.bracci[1].rotation.z = -0.9 + sw * 1.8; u.bracci[0].rotation.x = -0.6
      u.busto.rotation.y = -0.6 + sw * 1.2; u.busto.rotation.x = 0.2
      u.gambe[0].rotation.x = 0.3; u.gambe[1].rotation.x = -0.3
    } else if (a.tipo === 'abbatti') {
      u.ascia.visible = true
      const col = Math.pow(Math.max(0, Math.sin(p * Math.PI * 4)), 2)             // quattro colpi
      u.bracci[1].rotation.x = -2.5 + col * 1.9; u.bracci[0].rotation.x = -1.2 + col * 1.0
      u.busto.rotation.x = 0.1 + col * 0.35; u.gambe[0].rotation.x = 0.3; u.gambe[1].rotation.x = -0.3
    } else if (a.tipo === 'esulta') {
      const s = Math.sin(Math.min(1, p) * Math.PI)
      eroe.position.y = s * 0.35; u.bracci.forEach(b => { b.rotation.x = -2.6 * s })
    }
  } else if (E.vel > 0.1) {
    const s = Math.sin(E.fase)
    u.gambe[0].rotation.x = s * 0.8; u.gambe[1].rotation.x = -s * 0.8
    u.bracci[0].rotation.x = -s * 0.7; u.bracci[1].rotation.x = s * 0.7
    const c = E.corsa ? 1 : 0
    u.gambe[0].rotation.x = s * (0.8 + 0.4 * c); u.gambe[1].rotation.x = -s * (0.8 + 0.4 * c)
    u.bracci[0].rotation.x = -s * (0.7 + 0.6 * c); u.bracci[1].rotation.x = s * (0.7 + 0.6 * c)
    u.busto.position.y = 0.34 + Math.abs(s) * (0.045 + 0.04 * c); u.busto.rotation.x = 0.1 + 0.25 * c
  } else { u.busto.position.y = 0.34 + Math.sin(tt * 2) * 0.005 }
}

function giro (ora_) {
  requestAnimationFrame(giro)
  const inizioLavoro = performance.now(), dtReale = ora_ - tPrima
  const dt = Math.min(0.05, dtReale / 1000); tPrima = ora_
  const tt = (ora_ - t0) / 1000, adesso = ora()

  // l'eroe: cammina lungo il percorso o fa quello che sta facendo; in strada va più in fretta
  E.vel = 0
  if (E.az) {
    const a = E.az; a.t += dt
    if (a.fn) a.fn(a.t / a.dur, dt)
    if (a.t >= a.dur) { const f = a.fine; E.az = null; f && f() }
  } else if (E.percorso.length) {
    const [px, pz] = E.percorso[0], dx = px - E.x, dz = pz - E.z, d = Math.hypot(dx, dz)
    const vel = (strada[idx(Math.floor(E.x), Math.floor(E.z))] ? 6.6 : 4.8) * (E.corsa ? 1.75 : 1)
    const v = Math.min(d, vel * dt)
    if (d > 0.001) { E.x += dx / d * v; E.z += dz / d * v; E.dir = ang(E.dir, Math.atan2(dx, dz), Math.min(1, dt * 14)); E.vel = v / dt; E.fase += dt * 12 * vel / 4.8 }
    if (d - v < 0.01) {
      E.percorso.shift()
      if (!E.percorso.length) { E.corsa = false; const f = E.dopo; E.dopo = null; if (E.verso) { faccia(E.verso); E.verso = null } if (f) f() }
    }
  } else if (coda.length && !E.dopo && !fogliAperti()) {                 // il prossimo della coda delle azioni rapide
    const c = coda.shift(); c.inCoda = false
    if (applicabile(c)) vaiA(celleDiServizio(c), () => eseguiModo(c), centro(c))
  }
  E.dirBase = E.dir
  eroe.position.x = E.x; eroe.position.z = E.z; eroe.rotation.y = E.dir
  animaEroe(dt, tt)

  // le cose
  for (const c of cose) {
    const g = c.grp
    if (c.nasce !== undefined) { c.nasce = Math.min(1, c.nasce + dt * 3); const s = 1 + Math.sin(c.nasce * Math.PI) * 0.15; g.scale.setScalar(Math.max(0.01, c.nasce * s)); if (c.nasce >= 1) { g.scale.setScalar(1); delete c.nasce } }
    if (c.salto) { c.salto -= dt * 1.2; g.position.y = Math.max(0, Math.sin(c.salto * Math.PI * 2)) * 0.18; if (c.salto <= 0) { c.salto = 0; g.position.y = 0 } }
    const T = c.tipo
    if (T === 'campo') {
      const cr = crescitaDi(c), chiave = cr.map(x => x.toFixed(2)).join(), col = COLTURE[c.coltura || 'grano']
      if (Q.vento || chiave !== c.chiave) { c.chiave = chiave; aggiornaCampo(g, cr, tt, c.coltura || 'grano', Q.vento) }
      segnaCoda(c)
    } else if (T === 'recinto') {
      muoviPecore(g, dt, tt, c.richiamo ? { x: c.richiamo.x, z: c.richiamo.z } : null, c.pecore, adesso); c.richiamo = null
      segnaCoda(c)
    } else if (T === 'fontana') g.userData.anima(tt)
    else if (T === 'pasticceria') {
      const P = S.pasticceria, mio = S.posseduti.pasticceria
      if (mio) {
        tickPasticceria(adesso); aggiornaPasticceria()
        if (g.userData.gira) g.userData.gira.rotation.y += dt * 0.8
        if (P.coda.length && tt - tFumo > 0.35) { tFumo = tt; fumata(g.position.clone().add(g.userData.fumo)) }
        const npronti = Object.values(P.pronti).reduce((x, n) => x + n, 0)
        impostaBadge(c.badge, npronti ? `${RICETTE[Object.keys(P.pronti).find(k => P.pronti[k] > 0)].emoji} ${npronti} pront${npronti === 1 ? 'o' : 'i'}!` : P.coda.length ? `🔥 ${Math.ceil((P.coda[0].fine - adesso) / 1000)}s · ${P.coda.length}/${FORNO_POSTI}` : '', npronti ? 'pronto' : '')
      } else impostaBadge(c.badge, `🪙 ${prezzoDi(T)} · Pasticceria`, 'vendita')
    } else if (T === 'mongolfiera') {
      const M = S.mongolfiera, mio = S.posseduti.mongolfiera, v = g.userData.volo
      if (mio) {
        if (M.fine && adesso >= M.fine) { M.fine = null; M.cassa = true; salva() }
        let y = Math.sin(tt * 1.3) * 0.08, x = 0
        if (M.fine) {
          const sec = (adesso - M.fine + VIAGGIO) / 1000, resta = (M.fine - adesso) / 1000
          const su = Math.min(1, sec / 4), giu = Math.min(1, resta / 4)
          const q = Math.min(su, giu); y += q * q * 40; x = q * 18
          v.visible = q < 0.995
        } else v.visible = true
        v.position.set(x, y, 0); v.rotation.z = Math.sin(tt * 0.9) * 0.02
        g.userData.fiamma.scale.set(1, 1.2 + Math.sin(tt * 14) * 0.4, 1)
        impostaBadge(c.badge, M.cassa ? '🧳 è tornata!' : M.fine ? `☁️ ${Math.ceil((M.fine - adesso) / 1000)}s` : '', M.cassa ? 'pronto' : '')
      } else impostaBadge(c.badge, `🪙 ${prezzoDi(T)} · Mongolfiera`, 'vendita')
    }
    if (c.badge && !c.badge.el.hidden && g.visible) {
      const [x, y, visto] = schermo(g.position, g.userData.altezza || 1.6)
      const lim = Math.min(100, innerWidth / 2 - 4); c.badge.el.style.transform = `translate(${Math.max(lim, Math.min(innerWidth - lim, x))}px, ${Math.max(70, y)}px) translate(-50%, -100%)`; c.badge.el.style.visibility = visto ? 'visible' : 'hidden'
    }
  }
  aggiornaContatori(); aggiornaBadgeLotti(); muoviCaduti(dt)
  for (const a of anelliAlberi) segnaCoda(a)
  muoviParticelle(dt)
  for (const n of nuvole) { n.position.x += dt * 0.6; if (n.position.x > 70) n.position.x = -70 }
  muoviCamera(dt); aggiornaTesta()
  if (sporco && tt - tSalva > 1.2) { tSalva = tt; salvaOra() }
  renderer.render(scena, cam)
  const info = renderer.info
  const fps = opz.frame(dtReale, performance.now() - inizioLavoro, { calls: info.render.calls, triangoli: info.render.triangles, geometrie: info.memory.geometries, texture: info.memory.textures, dpr: renderer.getPixelRatio() })
  if (ora_ - tF > 500) { tF = ora_; riga.textContent = `${fps.toFixed(0)} fps · ${info.render.calls} draw · ${(info.render.triangles / 1000).toFixed(0)}k tri` }
}

// ── le opzioni e le prove di stress ──
function stress (tipo, n) {
  if (!tipo) { for (const c of [...cose]) if (c.stress) togli(c); return }
  const def = DEF[tipo], passo = def.w + 1
  const lista = []
  for (let i = LIM.i0 + 1; i + def.w < LIM.i1; i += passo) for (let j = LIM.j0 + 1; j + def.d < LIM.j1; j += def.d + 1) lista.push([i, j])
  lista.sort(() => Math.random() - 0.5)
  let fatti = 0
  for (const [i, j] of lista) {
    if (fatti >= n) break
    let ok = true
    for (let a = -1; a <= def.w && ok; a++) for (let b = -1; b <= def.d && ok; b++) if (!cellaPropria(i + a, j + b) || blocco[idx(i + a, j + b)]) ok = false
    if (!ok || Math.hypot(i - E.x, j - E.z) < 3) continue
    const col = Object.keys(COLTURE)[Math.floor(Math.random() * 5)]
    metti({ tipo, i, j, stress: true, coltura: col, tile: tipo === 'campo' ? (() => { const t0 = ora() - Math.random() * COLTURE[col].ms * 1.1; return [t0, t0, t0, t0] })() : undefined })
    fatti++
  }
}
const gpu = () => { try { const e = renderer.getContext().getExtension('WEBGL_debug_renderer_info'); return e ? renderer.getContext().getParameter(e.UNMASKED_RENDERER_WEBGL) : 'non dichiarata' } catch (x) { return '?' } }
function applica (q) {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, q.scala)); adatta()
  sole.castShadow = q.ombre
  if (sole.shadow.mapSize.x !== q.ombraRes) { sole.shadow.mapSize.set(q.ombraRes, q.ombraRes); if (sole.shadow.map) { sole.shadow.map.dispose(); sole.shadow.map = null } }
  for (const m of decori.alberi) m.visible = q.alberi
  for (const m of decori.erba) m.visible = q.erba
  gruppoNuvole.visible = q.nuvole
  scena.fog.near = q.nebbia ? 38 : 1e6; scena.fog.far = q.nebbia ? 90 : 2e6
}
const opz = creaOpzioni({ applica, stress, gpu, conta: () => ({ cose: cose.filter(c => !c.lotto).length, stress: cose.filter(c => c.stress).length }) })
const Q = opz.Q
applica(Q)
$('opzioni-apri').onclick = () => opz.apri()
mostraConti()

document.addEventListener('visibilitychange', () => { if (document.hidden && sporco) salvaOra() })
addEventListener('pagehide', () => { if (sporco) salvaOra() })
requestAnimationFrame(giro)

// per chi sviluppa dalla console, e per le prove
window.__f = {
  S, E, cose, B, D, cam, strada, LOTTI, ALBERI, cosaSotto,
  salta: ms => { sfasamento += ms },
  vai: (tipo) => { const c = cose.find(x => x.tipo === tipo); if (c) { vaiA(celleDiServizio(c), () => fai(c), centro(c)) } return !!c },
  monete: n => { S.monete += n; mostraConti() },
  grano: n => { S.merci.grano += n; mostraConti() },
  merce: (k, n) => { S.merci[k] += n; mostraConti() },
  taglia: (n) => { const a = ALBERI[n]; vaiA(celleDiServizio(a), () => abbatti(a), centro(a)); return a },
  vaiCella: (i, j) => vaiA([[i, j]], null, null),
  libero: () => !E.az && !E.percorso.length && !coda.length,
  modo: () => modo,
}

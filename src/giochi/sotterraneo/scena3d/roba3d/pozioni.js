// Generato da strumenti/promuovi-3d.mjs da poc/roba-3d/pozioni.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// I consumabili in 3D (le undici voci `usa` di dati/cose.js: cinque cure, due energie, l'elisir, la torcia, la chiave, la pergamena del portale):
// un modello PER CHIAVE, di vetro semitrasparente con il liquido colorato dentro (rosso la cura, blu l'energia, oro e viola i rari), il tappo, i dettagli.
// Contratto come gli altri moduli di poc/roba-3d: `crea(chiave)` → Group con l'origine al centro del modello, la faccia verso +z, in piedi lungo +y
// (alte 0.16 .. 0.35, come i gioielli); `userData = { famiglia:'pozione', figura, triangoli, anima(t) }`: il liquido ondeggia, salgono le bollicine, il
// cuore luminoso respira, la fiamma della torcia guizza, il portale della pergamena brilla. Sotto i 1000 triangoli per modello.
import * as THREE from 'three'
import { Fucina, sca, cil, con, sfe, ott, toro, fiamme, braci, orbita, C } from './fucina.js'
import { MATERIE } from './palette.js'

const PI = Math.PI
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
const mescola = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k).getHex()

export const CHIAVI = ['pozione-piccola', 'pozione', 'pozione-grande', 'ampolla-maggiore', 'ampolla-vita', 'pozione-blu', 'ampolla-blu', 'elisir-toro', 'torcia', 'chiave', 'pergamena-portale']

// ── i colori: il vetro, il sughero, la cera, i metalli ──
const VETRO = 0xd6f2f6
const SUGHERO = 0xc9a06a, SUGHERO_S = 0x9a7444
const CERA = 0xb8242a, CERA_S = 0x7e1218
const ORO = MATERIE.oro, ARG = MATERIE.acciaio, FERRO = MATERIE.ferro, OSSO = MATERIE.osso, STOFFA = MATERIE.stoffa, LEGNO = MATERIE.legno
const CARTA = 0xf0e2bd, CARTA_S = 0xc9b283

const vetroMat = () => new THREE.MeshStandardMaterial({ color: VETRO, roughness: 0.06, metalness: 0.15, flatShading: true, transparent: true, opacity: 0.17, side: THREE.DoubleSide, depthWrite: false })
const luceBasic = (col, op = 1, add = false) => new THREE.MeshBasicMaterial({ color: col, transparent: op < 1 || add, opacity: op, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending })

/** Il cantiere di un modello: la fucina per i pezzi pieni, i pezzi vetro/liquido a parte, e le animazioni. */
function cantiere (seme) {
  const c = { f: new Fucina(), extra: [], an: [], s: seme }
  c.aggiungi = (m, ordine = 0) => { m.renderOrder = ordine; c.extra.push(m); return m }
  return c
}

/**
 * Una bottiglia di vetro col suo liquido. `ctrl` è il profilo esterno [[raggio, y], …] dal fondo all'imboccatura (y cresce); `liscio`
 * lo ammorbidisce con una spline. Ritorna { rA(y), pts, yFondo, livello, rif } per posare tappi e fascette.
 */
function bottiglia (c, ctrl, o) {
  const { livello, colore, luce = 0.55, parete = 0.011, seg = 8, sz = 1, liscio = true, nucleo = null, bolle = 3, ondeggia = 1, pieno = 0.94 } = o
  const V = (r, y) => new THREE.Vector2(r, y)
  const pts = liscio ? new THREE.SplineCurve(ctrl.map(p => V(p[0], p[1]))).getPoints(Math.round(ctrl.length * (o.dens || 1.6))) : ctrl.map(p => V(p[0], p[1]))
  pts[0].x = 0.0005
  const rA = y => {
    for (let i = 1; i < pts.length; i++) if (y <= pts[i].y) { const a = pts[i - 1], b = pts[i], k = (y - a.y) / Math.max(1e-6, b.y - a.y); return a.x + (b.x - a.x) * Math.max(0, Math.min(1, k)) }
    return pts[pts.length - 1].x
  }
  // il vetro
  const vetro = new THREE.Mesh(new THREE.LatheGeometry(pts, seg), vetroMat()); vetro.scale.z = sz; c.aggiungi(vetro, 5)
  // il liquido: il profilo interno, tagliato al livello
  const dentro = [V(0.0005, parete)]
  for (const p of pts) if (p.y > parete && p.y < livello) dentro.push(V(Math.max(0.003, p.x - parete), p.y))
  dentro.push(V(Math.max(0.003, rA(livello) - parete), livello), V(0.0005, livello))
  const mLiq = new THREE.MeshStandardMaterial({ color: mescola(colore, 0x000000, 0.25), emissive: colore, emissiveIntensity: luce * 0.42, roughness: 0.3, metalness: 0, flatShading: true, transparent: true, opacity: pieno, depthWrite: false })
  const liq = new THREE.Mesh(new THREE.LatheGeometry(dentro, seg), mLiq); liq.scale.z = sz; c.aggiungi(liq, 2)
  // il pelo dell'acqua, più chiaro, che si inclina
  const rS = Math.max(0.004, rA(livello) - parete)
  const mSup = new THREE.MeshStandardMaterial({ color: colore, emissive: colore, emissiveIntensity: luce * 0.5, roughness: 0.15, flatShading: true, transparent: true, opacity: 0.95, depthWrite: false })
  const sg = new THREE.CircleGeometry(rS * 0.97, seg); sg.rotateX(-PI / 2)
  const sup = new THREE.Mesh(sg, mSup); sup.position.y = livello + 0.0008; sup.scale.z = sz; c.aggiungi(sup, 3)
  const ph = hash(c.s) * 6.28, ym = (parete + livello) / 2
  c.an.push(t => {
    sup.rotation.x = 0.1 * ondeggia * Math.sin(t * 2.1 + ph); sup.rotation.z = 0.1 * ondeggia * Math.cos(t * 1.7 + ph)
    sup.position.y = livello + 0.0008 + 0.0015 * Math.sin(t * 3.1 + ph)
    mLiq.emissiveIntensity = luce * 0.42 * (0.9 + 0.18 * Math.sin(t * 1.9 + ph)); mSup.emissiveIntensity = mLiq.emissiveIntensity * 1.2
    liq.scale.x = liq.scale.y = 1 + 0.006 * Math.sin(t * 2.6 + ph); liq.scale.y = 1
  })
  // il cuore luminoso (un bagliore additivo che respira)
  if (nucleo != null) {
    const n = new THREE.Mesh(new THREE.SphereGeometry(1, 7, 5), luceBasic(nucleo, 0.3, true)); n.position.y = ym; n.scale.set(1, 1, sz); c.aggiungi(n, 4)
    const R = Math.max(0.01, rA(ym) - parete) * 0.5
    c.an.push(t => { const k = 0.85 + 0.2 * Math.sin(t * 2.4 + ph); n.scale.set(R * k, R * k * 1.1, R * k * sz); n.rotation.y = t * 0.6; n.material.opacity = 0.22 + 0.12 * Math.sin(t * 2.4 + ph) })
  }
  // le bollicine, che salgono e scoppiano al pelo
  const bs = []
  for (let i = 0; i < bolle; i++) {
    const b = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), luceBasic(0xf4ffff, 0.75)); c.aggiungi(b, 4); bs.push({ b, i, a: hash(c.s + i) * 6.28, r: hash(c.s + i * 3 + 1) * 0.5 + 0.1, v: 0.18 + hash(c.s + i * 7) * 0.2, d: 0.0035 + hash(c.s + i * 5) * 0.003 })
  }
  c.an.push(t => {
    for (const { b, i, a, r, v, d } of bs) {
      const u = (t * v + i / Math.max(1, bolle)) % 1, y = parete + 0.008 + u * Math.max(0.01, livello - parete - 0.012), rr = Math.max(0.002, rA(y) - parete) * r
      b.position.set(Math.cos(a + t * 0.8) * rr + 0.003 * Math.sin(t * 7 + i), y, Math.sin(a + t * 0.8) * rr * sz); b.scale.setScalar(d * Math.sin(Math.min(1, u * 1.25) * PI * 0.5 + 0.2))
    }
  })
  // il riflesso: una striscia chiara lungo il fianco, a sinistra
  const a0 = 0.85, y0 = pts[pts.length - 1].y
  const alti = pts.filter(p => p.y > y0 * 0.12 && p.y < y0 * (o.rifAlto || 0.62))
  for (let i = 0; i < alti.length - 1; i++) {
    const q = alti[i], w = alti[i + 1]
    c.f.asta([-Math.sin(a0) * (q.x + 0.001), q.y, Math.cos(a0) * (q.x + 0.001) * sz], [-Math.sin(a0) * (w.x + 0.001), w.y, Math.cos(a0) * (w.x + 0.001) * sz], 0.0026, 0.0026, 0xf6ffff, 'luce', 4)
  }
  return { rA, pts, livello, parete, yTop: y0, sz }
}

/** Scintille che girano dentro il liquido (stelle, pagliuzze d'oro). */
function scintille (c, col, n, y0, y1, R, d = 0.007, sz = 1, vel = 0.9) {
  const l = Array.from({ length: n }, (_, i) => ({ m: c.aggiungi(new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), luceBasic(col, 0.95, true)), 4), i, p: [hash(c.s + i * 3), hash(c.s + i * 5 + 2), hash(c.s + i * 11 + 4)] }))
  c.an.push(t => {
    for (const { m, i, p } of l) {
      const a = t * vel * (0.6 + p[0]) + i * 2.4, r = R * (0.35 + 0.55 * p[1]), y = y0 + (y1 - y0) * (0.5 + 0.5 * Math.sin(t * 0.7 * (0.5 + p[2]) + i * 1.7))
      m.position.set(Math.cos(a) * r, y, Math.sin(a) * r * sz); m.rotation.set(t * 2 + i, t * 1.5, 0)
      m.scale.setScalar(d * (0.55 + 0.45 * Math.sin(t * 5 + i * 2.2)) * (0.7 + p[2] * 0.6))
    }
  })
}

/** Il tappo di sughero (leggermente rastremato, a faccette) sopra l'imboccatura, e il filo di cera o la corda. */
function tappo (c, r, y, h = 0.04, colore = SUGHERO, scuro = SUGHERO_S, sz = 1) {
  c.f.metti(cil(r * 1.16, r * 0.88, h, 8), colore, 0, y + h / 2 - 0.006, 0, { s: [1, 1, sz] })
  c.f.metti(cil(r * 1.2, r * 1.2, h * 0.16, 8), scuro, 0, y + h - 0.008, 0, { s: [1, 1, sz] })
}
const fascetta = (c, r, y, h, col, sz = 1) => c.f.metti(cil(r, r, h, 10), col, 0, y, 0, { s: [1, 1, sz] })
const cordino = (c, R, y, col = 0x8a5a2e, t = 0.0045, sz = 1) => c.f.metti(toro(R, t, 4, 10), col, 0, y, 0, { rx: PI / 2, s: [1, sz, 1] })

/** Chiude il modello: un solo gruppo, centrato in altezza, coi triangoli contati e `anima`. */
function chiudi (c, chiave, cx = 0) {
  const g = new THREE.Group(), dentro = c.f.chiudi(), tutto = new THREE.Group()
  tutto.add(dentro); for (const m of c.extra) tutto.add(m)
  const bb = new THREE.Box3().setFromObject(tutto), cy = (bb.min.y + bb.max.y) / 2
  tutto.position.set(-cx, -cy, 0); g.add(tutto)
  let tri = 0
  tutto.traverse(m => { if (m.isMesh) tri += Math.round((m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3) })
  g.userData.famiglia = 'pozione'; g.userData.figura = chiave; g.userData.triangoli = tri
  const an = c.an
  g.userData.anima = t => { for (const f of an) f(t) }
  return g
}

// ══════════ le bottiglie: la FORMA dal grado, il COLORE dal tipo ══════════
// Una cura e un'energia sono la stessa bottiglia con un altro liquido: la forma dice quanto vale (fiala, pallone, ampolla, fiaschetta, goccia in gabbia
// d'oro), il tipo dice cosa fa. Una tinta nuova è una riga di `TIPI` (le cinque `tinte` per forma, il segno, la cera, la corda, il metallo).
export const GRADI = {
  'pozione-piccola': { forma: 'fiala', tipo: 'cura' }, pozione: { forma: 'pallone', tipo: 'cura' }, 'pozione-grande': { forma: 'ampolla', tipo: 'cura' },
  'ampolla-maggiore': { forma: 'fiaschetta', tipo: 'cura' }, 'ampolla-vita': { forma: 'goccia', tipo: 'cura' },
  'pozione-blu': { forma: 'pallone', tipo: 'energia' }, 'ampolla-blu': { forma: 'ampolla', tipo: 'energia' },
  'elisir-toro': { forma: 'elisir', tipo: 'cresci' }, torcia: { forma: 'torcia', tipo: 'luce' }, chiave: { forma: 'chiave', tipo: 'porta' }, 'pergamena-portale': { forma: 'pergamena', tipo: 'portale' }
}
/** {forma, tipo} di un consumabile di dati/cose.js, dalla sua chiave. */
export const grado = chiaveCosa => GRADI[chiaveCosa] || null

// `tinte[forma]`: colore del liquido, luce (quanto splende), nucleo (il cuore che respira), pieno (opacità), bolle, scint: [colore, n, colore2?, n2?] (pagliuzze o stelline dentro).
// più il segno sull'etichetta ('goccia' | 'stella'), `cima` (un pezzo sul tappo, 'stella' o niente), la cera/nastro/corda, il metallo.
export const TIPI = {
  cura: {
    segno: 'goccia', segnoCol: 0xd01a2a, cima: null, cera: CERA, nastro: 0xd01a2a, corda: 0x8a5a2e, metallo: ORO, gemma: 0xff2a4a,
    tinte: {
      fiala:      { colore: 0xff6a5a, luce: 0.4, nucleo: 0xff6a78, pieno: 0.88, bolle: 3 },
      pallone:    { colore: 0xe81c2e, luce: 0.55, nucleo: 0xff3a4a, bolle: 4 },
      ampolla:    { colore: 0xa80c28, luce: 0.6, nucleo: 0xff2a40, bolle: 4 },
      fiaschetta: { colore: 0x68041e, luce: 0.7, nucleo: 0xff2040, bolle: 4, scint: [0xffd45a, 6] },
      goccia:     { colore: 0xff0a28, luce: 1.7, nucleo: 0xffd45a, pieno: 0.92, bolle: 4, scint: [0xffe27a, 7] }
    }
  },
  energia: {
    segno: 'stella', segnoCol: 0xeaf8ff, cima: 'stella', cera: 0x2f4fb8, nastro: 0x2f5fb0, corda: 0x2f5fb0, metallo: ARG, gemma: 0x7ab0ff,
    tinte: {
      fiala:      { colore: 0x4aa8ff, luce: 0.5, nucleo: 0x7ac4ff, pieno: 0.88, bolle: 3 },
      pallone:    { colore: 0x1f7ae8, luce: 0.6, nucleo: 0x3aa8ff, bolle: 4 },
      ampolla:    { colore: 0x2a3ed8, luce: 0.8, nucleo: 0x4a5aff, bolle: 2, scint: [0xfff6a8, 7, 0xbfe6ff, 4] },
      fiaschetta: { colore: 0x1a2ab0, luce: 0.85, nucleo: 0x4a6aff, bolle: 3, scint: [0xfff6a8, 6] },
      goccia:     { colore: 0x5a2ae8, luce: 1.3, nucleo: 0x9a6aff, pieno: 0.92, bolle: 4, scint: [0xbfe6ff, 7] }
    }
  }
}

/** Il segno del tipo sull'etichetta: una goccia, o una stella a otto punte. */
function segno (c, T, x, y, z, k = 1, ry = 0) {
  const col = T.tipo.segnoCol
  if (T.tipo.segno === 'stella') {
    c.f.metti(ott(0.014 * k), col, x, y, z, { s: [1, 1, 0.4], ry }, 'luce')
    c.f.metti(ott(0.014 * k), col, x, y, z, { s: [1, 1, 0.4], rz: PI / 4, ry }, 'luce')
  } else c.f.metti(ott(0.012 * k), col, x, y, z, { s: [0.9, 1.3, 0.4], ry })
}
/** Il pezzo che il tipo mette sopra il tappo (la stella d'argento dell'energia), con la base a `y`. */
function cima (c, T, y, k = 1) {
  if (T.tipo.cima !== 'stella') return
  const A = ARG
  c.f.metti(cil(0.006 * k, 0.006 * k, 0.012 * k, 6), A.medio, 0, y + 0.004, 0, {}, 'metallo')
  for (let i = 0; i < 5; i++) { const a = i * 2 * PI / 5; c.f.metti(con(0.0085 * k, 0.026 * k, 3), A.chiaro, Math.sin(a) * 0.015 * k, y + 0.016 * k + Math.cos(a) * 0.015 * k, 0, { rz: -a }, 'metallo') }
  c.f.metti(ott(0.005 * k), 0xeaf8ff, 0, y + 0.016 * k, 0.005 * k, {}, 'luce')
}
/** Le pagliuzze o stelline dentro il liquido, se la tinta le vuole. */
function brillii (c, T, y0, y1, R, sz = 1) {
  const s = T.tinta.scint; if (!s) return
  scintille(c, s[0], s[1], y0, y1, R, 0.0075, sz)
  if (s[2]) scintille(c, s[2], s[3], y0 + 0.01, y1, R * 0.9, 0.006, sz, 1.3)
}
/** Le opzioni che la tinta dà a `bottiglia`. */
const liquido = (T, o) => ({ colore: T.tinta.colore, luce: T.tinta.luce, nucleo: T.tinta.nucleo, bolle: T.tinta.bolle, pieno: T.tinta.pieno || 0.94, ...o })

/** Fiala (il grado più piccolo): tubo sottile, tappo di sughero, etichetta a fascia. */
function fiala (c, T) {
  bottiglia(c, [[0, 0], [0.019, 0.003], [0.032, 0.016], [0.036, 0.045], [0.036, 0.125], [0.031, 0.148], [0.026, 0.164], [0.026, 0.19]],
    liquido(T, { livello: 0.105, seg: 8, dens: 1.3, rifAlto: 0.8 }))
  tappo(c, 0.027, 0.178, 0.04)
  cordino(c, 0.03, 0.166, 0xd8bf8a, 0.004)
  cima(c, T, 0.214, 0.8)
  fascetta(c, 0.0385, 0.056, 0.032, CARTA)
  c.f.metti(cil(0.039, 0.039, 0.006, 10), T.tipo.nastro, 0, 0.056, 0, {})
  segno(c, T, 0, 0.056, 0.037, 0.75)
  c.f.metti(sfe(0.029, 7, 5), T.tipo.cera, 0, 0.158, 0, { s: [1, 0.5, 1] })
  brillii(c, T, 0.03, 0.1, 0.02)
}
/** Pallone: il ventre tondo e il collo corto, la corda e l'etichetta a rombo col segno. */
function pallone (c, T) {
  bottiglia(c, [[0, 0], [0.035, 0.004], [0.066, 0.026], [0.084, 0.07], [0.078, 0.108], [0.056, 0.146], [0.033, 0.172], [0.028, 0.2], [0.028, 0.225], [0.034, 0.236]],
    liquido(T, { livello: 0.105, seg: 8, dens: 1.3, rifAlto: 0.7 }))
  tappo(c, 0.03, 0.228, 0.05)
  cordino(c, 0.036, 0.205, T.tipo.corda, 0.005)
  c.f.metti(cil(0.003, 0.003, 0.05, 4), T.tipo.corda, 0.033, 0.19, 0.005, { rz: -0.35 })
  cima(c, T, 0.28)
  c.f.metti(sca(0.05, 0.05, 0.004), CARTA, 0, 0.07, 0.083, { rz: PI / 4 })
  c.f.metti(sca(0.056, 0.056, 0.0025), CARTA_S, 0, 0.07, 0.0815, { rz: PI / 4 })
  segno(c, T, 0, 0.07, 0.088, 1)
  brillii(c, T, 0.03, 0.1, 0.06)
}
/** Ampolla: ventre tondo e collo lungo e stretto, la ghiera, il tappo sigillato di cera, la targhetta. */
function ampolla (c, T) {
  bottiglia(c, [[0, 0], [0.034, 0.005], [0.062, 0.028], [0.075, 0.07], [0.066, 0.115], [0.04, 0.158], [0.026, 0.19], [0.022, 0.23], [0.022, 0.275], [0.03, 0.296], [0.031, 0.308]],
    liquido(T, { livello: 0.125, seg: 8, dens: 1.3, rifAlto: 0.62 }))
  const M = T.tipo.metallo, tipoM = M === ORO ? 'oro' : 'metallo'
  fascetta(c, 0.0285, 0.255, 0.014, M.medio)
  c.f.metti(toro(0.0285, 0.004, 4, 10), M.chiaro, 0, 0.262, 0, { rx: PI / 2 }, tipoM)
  tappo(c, 0.026, 0.3, 0.04)
  c.f.metti(sfe(0.034, 8, 5), T.tipo.cera, 0, 0.332, 0, { s: [1, 0.55, 1] })
  c.f.metti(sfe(0.01, 5, 4), T.tipo.cera, 0.03, 0.302, 0.004, { s: [0.8, 2.2, 0.8] })
  c.f.metti(sfe(0.008, 5, 4), mescola(T.tipo.cera, 0x000000, 0.4), -0.02, 0.306, 0.022, { s: [0.8, 2.6, 0.8] })
  c.f.metti(cil(0.0085, 0.0085, 0.006, 6), M.chiaro, 0, 0.346, 0, {}, 'luce')
  cima(c, T, 0.348, 0.8)
  c.f.metti(sca(0.034, 0.03, 0.004), M.medio, 0, 0.12, 0.074, {}, tipoM)
  segno(c, T, 0, 0.12, 0.078, 0.8)
  brillii(c, T, 0.02, 0.105, 0.05)
}
/** Fiaschetta: schiacciata, con la fascia di ferro borchiata, il tappo d'oro con l'anello e il segno in un disco. */
function fiaschetta (c, T) {
  const sz = 0.6
  bottiglia(c, [[0, 0], [0.05, 0.004], [0.088, 0.02], [0.104, 0.07], [0.098, 0.13], [0.072, 0.178], [0.04, 0.208], [0.032, 0.232], [0.032, 0.262]],
    liquido(T, { livello: 0.15, seg: 8, sz, dens: 1.3, rifAlto: 0.6 }))
  brillii(c, T, 0.05, 0.14, 0.07, sz)
  fascetta(c, 0.034, 0.25, 0.016, ARG.scuro, sz)
  c.f.metti(toro(0.0345, 0.005, 3, 8), ARG.medio, 0, 0.24, 0, { rx: PI / 2, s: [1, sz, 1] }, 'metallo')
  c.f.metti(cil(0.04, 0.034, 0.05, 8), ORO.medio, 0, 0.285, 0, { s: [1, 1, sz] }, 'oro')
  c.f.metti(cil(0.042, 0.042, 0.008, 8), ORO.chiaro, 0, 0.31, 0, { s: [1, 1, sz] }, 'oro')
  c.f.metti(toro(0.016, 0.004, 4, 8), ORO.scuro, 0, 0.33, 0, {}, 'oro')
  cima(c, T, 0.318, 0.9)
  c.f.metti(toro(0.106, 0.007, 3, 12), FERRO.medio, 0, 0.07, 0, { rx: PI / 2, s: [1, sz * 1.05, 1] }, 'metallo')
  for (const x of [-0.07, 0, 0.07]) c.f.metti(sfe(0.008, 5, 4), ORO.chiaro, x, 0.07, 0.07 * sz + 0.012, {}, 'oro')
  c.f.metti(cil(0.026, 0.026, 0.004, 6), ORO.medio, 0, 0.12, 0.098 * sz + 0.004, { rx: PI / 2 }, 'oro')
  segno(c, T, 0, 0.12, 0.098 * sz + 0.009, 1.15)
}
/** Goccia in gabbia d'oro: il grado più alto, su piedistallo, cappello a cipolla con la gemma del tipo, aureola che respira. */
function goccia (c, T) {
  const b = bottiglia(c, [[0, 0], [0.04, 0.008], [0.078, 0.045], [0.092, 0.095], [0.078, 0.15], [0.046, 0.2], [0.028, 0.236], [0.025, 0.27], [0.03, 0.288]],
    liquido(T, { livello: 0.17, seg: 8, dens: 1.3, rifAlto: 0.6, parete: 0.012 }))
  brillii(c, T, 0.04, 0.15, 0.07)
  c.f.metti(cil(0.078, 0.092, 0.024, 8), ORO.scuro, 0, -0.012, 0, {}, 'oro')
  c.f.metti(cil(0.056, 0.076, 0.012, 8), ORO.chiaro, 0, 0.004, 0, {}, 'oro')
  for (let k = 0; k < 3; k++) {
    const a = k * 2.094 + 0.35, pts = []
    for (const y of [0.012, 0.06, 0.12, 0.19, 0.236]) { const r = b.rA(y) + 0.008; pts.push([Math.sin(a) * r, y, Math.cos(a) * r]) }
    c.f.fila(pts, 0.0065, 0.0045, ORO.medio, 'oro', 4)
    c.f.metti(ott(0.009), T.tipo.gemma, pts[2][0], pts[2][1], pts[2][2], {}, 'luce')
  }
  c.f.metti(toro(0.034, 0.0055, 3, 8), ORO.chiaro, 0, 0.245, 0, { rx: PI / 2 }, 'oro')
  c.f.metti(cil(0.036, 0.03, 0.026, 8), ORO.medio, 0, 0.292, 0, {}, 'oro')
  c.f.metti(sfe(0.04, 7, 4), ORO.chiaro, 0, 0.318, 0, { s: [1, 0.85, 1] }, 'oro')
  c.f.metti(con(0.014, 0.034, 6), ORO.medio, 0, 0.358, 0, {}, 'oro')
  c.f.metti(ott(0.014), T.tipo.gemma, 0, 0.385, 0, { s: [0.8, 1.3, 0.8] }, 'luce')
  const al = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.004, 3, 12), luceBasic(T.tinta.nucleo, 0.7, true)); al.position.y = 0.17; c.aggiungi(al, 4)
  c.an.push(t => { al.rotation.y = t * 0.5; al.rotation.x = 1.2 + 0.1 * Math.sin(t); al.material.opacity = 0.5 + 0.25 * Math.sin(t * 2.2); al.scale.setScalar(1 + 0.04 * Math.sin(t * 2.2)) })
}
export const FORME = { fiala, pallone, ampolla, fiaschetta, goccia }

/** Una bottiglia: la forma del grado, vestita dal tipo (il liquido, il segno, la cera, la cima). */
function bottigliaDi (chiave) {
  const { forma, tipo } = GRADI[chiave], c = cantiere(seme(chiave))
  FORME[forma](c, { tipo: TIPI[tipo], tinta: TIPI[tipo].tinte[forma] })
  return chiudi(c, chiave)
}
const seme = id => { let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 100003; return h }

/** Elisir del toro: il fiasco tozzo rosso scuro, il tappo di ferro con le corna d'osso e la fascia borchiata. */
function elisirToro (chiave) {
  const c = cantiere(83)
  bottiglia(c, [[0, 0], [0.04, 0.004], [0.075, 0.025], [0.093, 0.068], [0.088, 0.108], [0.064, 0.14], [0.04, 0.162], [0.032, 0.18], [0.032, 0.2], [0.036, 0.208]],
    { livello: 0.11, colore: 0x8a0a2a, luce: 0.8, nucleo: 0xff3a2a, bolle: 4, seg: 8, dens: 1.3, rifAlto: 0.66 })
  scintille(c, 0xffb347, 3, 0.03, 0.1, 0.06, 0.006)
  // il tappo di ferro e le corna d'osso
  c.f.metti(cil(0.04, 0.034, 0.036, 8), FERRO.medio, 0, 0.215, 0, {}, 'metallo')
  c.f.metti(cil(0.042, 0.042, 0.008, 8), FERRO.chiaro, 0, 0.236, 0, {}, 'metallo')
  c.f.metti(toro(0.0345, 0.0045, 3, 8), FERRO.scuro, 0, 0.198, 0, { rx: PI / 2 }, 'metallo')
  for (const sgn of [-1, 1]) {
    const p = [[0.03, 0.222], [0.058, 0.224], [0.082, 0.24], [0.092, 0.268], [0.088, 0.296]]
    c.f.fila(p.map(q => [sgn * q[0], q[1], 0]), 0.016, 0.003, OSSO.medio, 'pieno', 5)
    c.f.metti(sfe(0.017, 5, 3), OSSO.scuro, sgn * 0.03, 0.222, 0, {})
  }
  // il muso: due narici sul davanti del tappo e l'anello nel naso
  c.f.metti(sfe(0.008, 4, 3), FERRO.ombra, -0.013, 0.215, 0.037, { s: [1, 1.3, 0.6] })
  c.f.metti(sfe(0.008, 4, 3), FERRO.ombra, 0.013, 0.215, 0.037, { s: [1, 1.3, 0.6] })
  c.f.metti(toro(0.013, 0.0032, 3, 7), ORO.medio, 0, 0.2, 0.04, {}, 'oro')
  // la fascia di ferro borchiata attorno al ventre
  c.f.metti(toro(0.094, 0.0065, 3, 12), FERRO.medio, 0, 0.06, 0, { rx: PI / 2 }, 'metallo')
  for (let k = 0; k < 4; k++) { const a = k * PI / 2 + 0.8; c.f.metti(sfe(0.0095, 4, 3), ORO.medio, Math.sin(a) * 0.1, 0.06, Math.cos(a) * 0.1, {}, 'oro') }
  return chiudi(c, chiave)
}

// ══════════ gli altri ══════════
/** La torcia: il manico di legno, la stoffa impeciata in cima e la fiamma che guizza con le braci che salgono. */
function torcia (chiave) {
  const c = cantiere(97), f = c.f
  f.metti(cil(0.017, 0.022, 0.26, 7), LEGNO.medio, 0, 0, 0, { rz: 0.04 })
  f.metti(cil(0.0185, 0.0185, 0.012, 7), LEGNO.scuro, 0, -0.09, 0, {})
  f.metti(cil(0.0185, 0.0185, 0.012, 7), LEGNO.scuro, 0, -0.04, 0, {})
  f.metti(sfe(0.024, 7, 5), LEGNO.scuro, 0, -0.13, 0, { s: [1, 0.7, 1] })
  f.metti(cil(0.042, 0.024, 0.09, 8), 0x3a2a1e, 0, 0.16, 0, {})                             // la stoffa impeciata
  f.metti(cil(0.046, 0.046, 0.016, 8), 0x2a1c14, 0, 0.2, 0, {})
  f.metti(toro(0.04, 0.0055, 4, 10), 0x6a4326, 0, 0.15, 0, { rx: PI / 2 })
  f.metti(toro(0.0235, 0.0055, 4, 10), 0x6a4326, 0, 0.125, 0, { rx: PI / 2 })
  f.metti(cil(0.026, 0.02, 0.016, 8), FERRO.medio, 0, 0.113, 0, {}, 'metallo')               // la ghiera di ferro
  const brace = f.libero(sfe(0.04, 7, 5), 0xff5a1a, 0, 0.208, 0, 1.2); brace.scale.set(1, 0.4, 1)
  const fa = fiamme(f, [[0, 0.21, 0], [0.018, 0.21, 0.01], [-0.018, 0.21, -0.008], [0.004, 0.21, -0.016]], { h: 0.17, r: 0.046, vel: 7 })
  const fb = fiamme(f, [[0, 0.21, 0.002]], { h: 0.11, r: 0.03, col: [C.FUOCO_C], vel: 9 })
  const sc = braci(f, 0xffd23a, [-0.035, 0.22, -0.035], [0.07, 0.04, 0.07], { n: 6, vel: 0.45, r: 0.011, sale: 0.17 })
  c.an.push(t => { fa(t); fb(t); sc(t); const k = 0.9 + 0.15 * Math.sin(t * 9) + 0.07 * Math.sin(t * 17); brace.scale.set(k, 0.4, k); })
  return chiudi(c, chiave)
}

/** La chiave d'oro: l'anello a quadrifoglio, il gambo con le fascette e il ward a denti; brilla ogni tanto. */
function chiave (chiaveId) {
  const c = cantiere(109), f = c.f
  f.metti(toro(0.034, 0.011, 5, 14), ORO.medio, 0, 0.13, 0, {}, 'oro')                     // l'anello
  for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4; f.metti(toro(0.017, 0.008, 4, 9), ORO.chiaro, Math.sin(a) * 0.058, 0.13 + Math.cos(a) * 0.058, 0, {}, 'oro') }
  f.metti(ott(0.012), 0xff4a62, 0, 0.13, 0, { s: [1, 1, 0.5] }, 'luce')
  f.metti(cil(0.02, 0.02, 0.014, 8), ORO.scuro, 0, 0.065, 0, {}, 'oro')
  f.metti(cil(0.0115, 0.0115, 0.2, 7), ORO.medio, 0, -0.02, 0, {}, 'oro')                      // il gambo
  f.metti(cil(0.018, 0.018, 0.012, 8), ORO.chiaro, 0, 0.03, 0, {}, 'oro')
  f.metti(cil(0.016, 0.016, 0.01, 8), ORO.chiaro, 0, -0.012, 0, {}, 'oro')
  f.metti(sca(0.048, 0.03, 0.014), ORO.medio, 0.03, -0.095, 0, {}, 'oro')                       // il ward
  f.metti(sca(0.03, 0.022, 0.014), ORO.medio, 0.022, -0.069, 0, {}, 'oro')
  f.metti(sca(0.02, 0.024, 0.014), ORO.scuro, 0.045, -0.11, 0, {}, 'oro')
  f.metti(sca(0.008, 0.01, 0.015), 0x3a2410, 0.036, -0.092, 0, {}, 'pieno')
  f.metti(sfe(0.0125, 6, 4), ORO.medio, 0, -0.123, 0, {}, 'oro')
  const lampo = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), luceBasic(0xffffff, 0.95, true)); c.aggiungi(lampo, 4)
  const lampo2 = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), luceBasic(0xfff2b0, 0.95, true)); c.aggiungi(lampo2, 4)
  c.an.push(t => {
    const u = (t * 0.55) % 1, s = Math.sin(Math.min(1, u * 3) * PI) * (u < 0.34 ? 1 : 0)
    lampo.position.set(0.028, 0.168, 0.02); lampo.scale.set(0.016 * s, 0.016 * s, 0.002 * s + 0.0001); lampo.rotation.z = u * 6
    const u2 = (t * 0.55 + 0.5) % 1, s2 = Math.sin(Math.min(1, u2 * 3) * PI) * (u2 < 0.34 ? 1 : 0)
    lampo2.position.set(0.04, -0.1, 0.012); lampo2.scale.set(0.012 * s2, 0.012 * s2, 0.002 * s2 + 0.0001); lampo2.rotation.z = -u2 * 6
  })
  return chiudi(c, chiaveId)
}

/** La pergamena del portale: due bacchette di legno col foglio srotolato in mezzo, il sigillo di cera, e un portale che gira sul foglio. */
function pergamena (chiaveId) {
  const c = cantiere(127), f = c.f
  f.metti(sca(0.2, 0.25, 0.005), CARTA, 0, 0, 0, {})
  f.metti(sca(0.186, 0.236, 0.003), CARTA_S, 0, 0, 0.002, {})
  f.metti(sca(0.176, 0.226, 0.003), CARTA, 0, 0, 0.0035, {})
  for (const y of [0.14, -0.14]) {                                                      // i rotoli e le bacchette
    f.metti(cil(0.022, 0.022, 0.21, 9), CARTA, 0, y, 0, { rz: PI / 2 })
    f.metti(cil(0.024, 0.024, 0.006, 9), CARTA_S, 0.0, y, 0, { rz: PI / 2 })
    f.metti(cil(0.009, 0.009, 0.26, 6), LEGNO.scuro, 0, y, 0, { rz: PI / 2 })
    for (const sgn of [-1, 1]) f.metti(sfe(0.016, 6, 4), LEGNO.medio, sgn * 0.13, y, 0, {})
  }
  // i bordi dipinti
  for (const sy of [-1, 1]) f.metti(sca(0.16, 0.005, 0.002), 0x7a4a8a, 0, sy * 0.108, 0.0055, {})
  for (const sx of [-1, 1]) f.metti(sca(0.005, 0.216, 0.002), 0x7a4a8a, sx * 0.08, 0, 0.0055, {})
  // il nastro rosso e il sigillo
  f.metti(sca(0.014, 0.07, 0.004), CERA, 0.1, -0.17, 0.012, { rz: 0.12 })
  f.metti(sca(0.014, 0.06, 0.004), CERA_S, 0.115, -0.165, 0.01, { rz: -0.18 })
  f.metti(cil(0.021, 0.021, 0.008, 8), CERA, 0.0, -0.1, 0.012, { rx: PI / 2 })
  f.metti(cil(0.012, 0.012, 0.004, 6), ORO.medio, 0.0, -0.1, 0.017, { rx: PI / 2 }, 'oro')
  // il portale: i cerchi controrotanti, il disco che pulsa, le rune e le scintille che ci girano attorno
  const z = 0.008, cy = 0.01
  const disco = f.libero(cil(0.05, 0.05, 0.004, 16), 0x5a1ea8, 0, cy, z, 1.2); disco.rotation.x = PI / 2
  const anA = f.libero(toro(0.066, 0.0065, 4, 18), 0xb07cff, 0, cy, z + 0.004, 1.6)
  const anB = f.libero(toro(0.05, 0.0045, 3, 16), 0x58e0ff, 0, cy, z + 0.006, 1.8)
  const nuc = f.libero(sfe(0.026, 7, 5), 0xb98aff, 0, cy, z + 0.008, 1.6); nuc.scale.z = 0.4
  const rune = orbita(f, 0xe0b8ff, [0, cy, z + 0.003], 0.087, { n: 8, vel: 0.7, r: 0.0065, inc: PI / 2 })
  const spirali = orbita(f, 0x9af0ff, [0, cy, z + 0.01], 0.04, { n: 3, vel: -2.2, r: 0.007, inc: PI / 2 })
  const alone = new THREE.Mesh(new THREE.CircleGeometry(0.085, 20), luceBasic(0x7a3aff, 0.16, true)); alone.position.set(0, cy, z - 0.002); c.aggiungi(alone, 1)
  c.an.push(t => {
    anA.rotation.z = t * 0.9; anB.rotation.z = -t * 1.5; anB.rotation.x = 0.25 * Math.sin(t * 1.7); anA.rotation.y = 0.2 * Math.sin(t * 1.3)
    disco.material.emissiveIntensity = 1.0 + 0.4 * Math.sin(t * 3); nuc.rotation.z = t * 2; nuc.scale.set(1 + 0.18 * Math.sin(t * 4), 1 + 0.18 * Math.sin(t * 4), 0.4)
    alone.material.opacity = 0.14 + 0.07 * Math.sin(t * 2.4); alone.scale.setScalar(1 + 0.06 * Math.sin(t * 2.4))
    rune(t); spirali(t)
  })
  return chiudi(c, chiaveId)
}

const MODELLI = { 'elisir-toro': elisirToro, torcia, chiave, 'pergamena-portale': pergamena }

/** Il modello di un consumabile di dati/cose.js, dalla sua chiave. */
export function crea (chiaveCosa) {
  const m = MODELLI[chiaveCosa] || (GRADI[chiaveCosa] && FORME[GRADI[chiaveCosa].forma] ? () => bottigliaDi(chiaveCosa) : null)
  if (!m) throw new Error(`consumabile sconosciuto: ${chiaveCosa}`)
  return m(chiaveCosa)
}

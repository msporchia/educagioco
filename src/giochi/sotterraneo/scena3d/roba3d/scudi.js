// Generato da strumenti/promuovi-3d.mjs da poc/roba-3d/scudi.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Gli scudi del catalogo (figure `scudo-*`): un modello per figura, derivato da roba.json (forma, campo, emblema, bordo, materia, elemento, pregio).
// Contratto: `ARCHETIPI` le `cosa` che sa fare; `crea(figura)` → Group, faccia esterna verso +z, origine dove il braccio lo regge,
// userData.famiglia/tipo = 'scudo', userData.figura = id, userData.anima(t) opzionale. Funzione pura dell'id (seme dall'id, niente Math.random).
// Rilievi a strati: ogni pezzo sul campo ha la faccia in vista a una quota sua (capa(L)), così colori diversi non sono mai coplanari.
import * as THREE from 'three'
import { Fucina, sca, cil, con, sfe, ott, ico, toro, poli, cristallo, PIATTA, anima, respira, braci, orbita, fiamme } from './fucina.js'
import { MATERIE, ELEMENTI, PREGIO } from './palette.js'

export const ARCHETIPI = ['scudo ovale', 'scudo tondo', 'scudo a mandorla', 'scudo a goccia', 'scudo a stemma', 'scudo rinforzato']

const OFF = [-0.05, 0.12, 0.14]
const hashStr = s => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
const rnd = (seme, i) => { const x = Math.sin(seme * 0.0001 + i * 127.1 + 31.7) * 43758.5453; return x - Math.floor(x) }

// ── colori degli stemmi (campo e figure) ──
const K = {
  bianco: 0xf2efe6, osso: 0xe6dcc0, ossoOro: 0xe0c98a, argento: 0xd7dde6, argentoS: 0xaab4c4, oro: 0xf4c542, oroS: 0xc8922a, bronzo: 0xb9783a,
  rosso: 0xc8302a, rossoS: 0x8a2a22, rossoV: 0xe03a2a, arancio: 0xe2551f, aranciaV: 0xff7a2a, rossoBruno: 0x7a2a20, bruno: 0x7a3a28, bordeaux: 0x5a1a30,
  blu: 0x2f5fb0, bluS: 0x1f3a78, bluNotte: 0x15204a, bluNero: 0x0e1430, cobalto: 0x1f48c0, azzurro: 0x6ab0e0, azzurroV: 0x2f8fe0, ghiaccio: 0x5cb0e8,
  bluGrigio: 0x3d4a66, grigioBlu: 0x2f3a4c, viola: 0x3a1f5a, violaM: 0x5a3a8a, nero: 0x16141a, nerastro: 0x24201e, grigioScuro: 0x2c2c34,
  verde: 0x3e8a4a, verdeS: 0x1f5a30, verdeGrigio: 0x6f7f6a, acciaioChiaro: 0xb4bcc8,
  legnoBruno: 0x7a5230, legnoScuro: 0x4e3520, legnoArancio: 0xb4733a, legnoRossiccio: 0x8e4a34, legnoChiaro: 0xb08652, legnoAmbra: 0xc48a3c,
  legnoGrigio: 0x4f4540, legnoViola: 0x453d4c, marrone: 0x4b3322, marroneChiaro: 0x9a6c42, ink: 0x14101a
}
const ferro = MATERIE.ferro, acciaio = MATERIE.acciaio, oroM = MATERIE.oro

// ── le figure: forma + profilo + campo + emblema + bordo (dalle descrizioni di roba.json) ──
// forma: goccia|stemma|tondo|mandorla|ovale|rinf. W mezza larghezza, yT/yB cima e punta, a/p curva della punta, top il margine alto.
const SPEC = {
  1: { forma: 'ovale', W: 0.19, yT: 0.29, yB: -0.29, campo: [K.legnoBruno], assi: 5, bordo: 'liscio', rim: ferro.scuro, umbone: { r: 0.04, col: ferro.chiaro } },
  2: { forma: 'tondo', R: 0.25, campo: [K.legnoScuro], assi: 5, bordo: 'borchie', rim: ferro.medio, umbone: { quad: true, r: 0.06, col: acciaio.chiaro } },
  3: { forma: 'mandorla', W: 0.23, yT: 0.3, yB: -0.3, campo: [K.blu], rim: oroM.medio, rimT: 'oro', embl: ['croce', { up: 0.2, dn: 0.2, sd: 0.15, t: 0.04, col: K.oro }], bordo: 'liscio' },
  4: { forma: 'goccia', W: 0.145, yT: 0.31, yB: -0.33, a: 0.0, p: 2.2, campo: [K.legnoBruno], assi: 3, embl: ['croce', { up: 0.2, dn: 0.2, sd: 0.1, t: 0.013, col: K.oro }], bordo: 'liscio' },
  5: { forma: 'goccia', W: 0.2, yT: 0.27, yB: -0.3, p: 2.3, top: 'arco', campo: [K.viola, 0x6a1f3a], embl: ['croce', { up: 0.17, dn: 0.17, sd: 0.12, t: 0.011, col: K.bianco }], bordo: 'liscio' },
  6: { forma: 'goccia', W: 0.22, yT: 0.28, yB: -0.3, p: 2.6, top: 'conc', campo: [K.rossoBruno], embl: ['teschio', { s: 1.25, col: K.bianco }], bordo: 'dentelli' },
  7: { forma: 'goccia', W: 0.21, yT: 0.28, yB: -0.3, p: 2.4, campo: [K.blu], embl: ['croce', { up: 0.15, dn: 0.15, sd: 0.15, t: 0.028, fl: 0.04, col: K.oro }], bordo: 'borchie' },
  8: { forma: 'goccia', W: 0.215, yT: 0.28, yB: -0.31, p: 2.2, top: 'tacche', campo: [K.verdeS], fasceV: [K.arancio, [0.2, -0.1]], embl: ['croce', { up: 0.13, dn: 0.13, sd: 0.1, t: 0.02, col: K.oro }], bordo: 'liscio' },
  9: { forma: 'rinf', campo: [K.bluGrigio], bande: K.ferroB, bordo: 'borchie', umbone: { r: 0.06, col: ferro.chiaro } },
  10: { forma: 'goccia', W: 0.22, yT: 0.27, yB: -0.3, p: 2.1, top: 'picco', campo: [K.legnoArancio], assi: 4, embl: ['croce', { up: 0.19, dn: 0.19, sd: 0.14, t: 0.045, col: K.oro }], bordo: 'liscio' },
  11: { forma: 'goccia', W: 0.155, yT: 0.3, yB: -0.33, p: 2.0, campo: [K.legnoGrigio], assi: 4, embl: ['giglio', { s: 0.9, col: K.argento }], bordo: 'dentelli' },
  12: { forma: 'goccia', W: 0.23, yT: 0.26, yB: -0.3, p: 2.6, top: 'corna', campo: [K.arancio], rim: oroM.medio, rimT: 'oro', embl: ['sigillo', { col: K.oro, col2: K.oroS }], bordo: 'borchie' },
  13: { forma: 'goccia', W: 0.19, yT: 0.29, yB: -0.33, p: 2.2, top: 'arco', campo: [K.bluGrigio, K.grigioBlu], embl: ['croce', { up: 0.22, dn: 0.24, sd: 0.11, t: 0.012, orn: true, col: K.argento }], bordo: 'rune' },
  14: { forma: 'goccia', W: 0.215, yT: 0.27, yB: -0.3, p: 2.5, top: 'conc', campo: [K.rossoV], rim: oroM.medio, rimT: 'oro', embl: ['medaglione', {}], bordo: 'borchie' },
  15: { forma: 'tondo', R: 0.24, campo: [K.legnoBruno], assi: 6, rim: K.verdeGrigio, rimT: 'pieno', rimFino: true, bordo: 'liscio' },
  16: { forma: 'tondo', R: 0.26, campo: [K.legnoBruno, K.legnoScuro], assi: 6, rim: ferro.chiaro, bordo: 'borchie', borchiaR: 0.018, umbone: { r: 0.06, col: acciaio.medio } },
  17: { forma: 'tondo', R: 0.25, campo: [K.legnoRossiccio], assi: 5, rim: ferro.scuro, rimGrosso: true, bordo: 'borchie', borchiaR: 0.027, umbone: { r: 0.05, col: ferro.scuro } },
  18: { forma: 'stemma', W: 0.22, yT: 0.28, yB: -0.3, a: 0.4, p: 1.8, campo: [K.blu], rim: acciaio.medio, embl: ['croce', { up: 0.17, dn: 0.17, sd: 0.14, t: 0.05, col: K.bianco }], bordo: 'liscio' },
  19: { forma: 'stemma', W: 0.2, yT: 0.29, yB: -0.3, a: 0.45, p: 1.7, top: 'arco', campo: [K.blu], strisce: 0x4a86d8, embl: ['croce', { up: 0.2, dn: 0.22, sd: 0.1, t: 0.014, col: K.argento }], bordo: 'dentelli' },
  20: { forma: 'stemma', W: 0.225, yT: 0.28, yB: -0.3, a: 0.35, p: 1.9, campo: [K.bluNotte], embl: ['leone', { col: K.oro, col2: K.oroS }], bordo: 'borchie' },
  21: { forma: 'stemma', W: 0.215, yT: 0.28, yB: -0.3, a: 0.5, p: 1.8, top: 'conc', campo: [K.legnoArancio], assi: 4, embl: ['croce', { up: 0.15, dn: 0.15, sd: 0.15, t: 0.03, fl: 0.04, col: K.oro, viva: true }], bordo: 'liscio' },
  22: { forma: 'stemma', W: 0.21, yT: 0.28, yB: -0.31, a: 0.3, p: 2.0, top: 'tacche', campo: [K.arancio, K.rossoS], embl: ['fiammaGiglio', { col: K.oro }], bordo: 'liscio' },
  23: { forma: 'stemma', W: 0.2, yT: 0.27, yB: -0.29, a: 0.55, p: 1.7, campo: [K.verde], strisce: K.verdeS, bordo: 'liscio' },
  24: { forma: 'stemma', W: 0.215, yT: 0.28, yB: -0.3, a: 0.4, p: 2.0, top: 'arco', campo: [K.azzurro], embl: ['croce', { up: 0.16, dn: 0.16, sd: 0.11, t: 0.014, col: K.bronzo }], bordo: 'liscio' },
  25: { forma: 'stemma', W: 0.215, yT: 0.28, yB: -0.3, a: 0.45, p: 1.8, top: 'picco', campo: [K.violaM], strisce: K.viola, bordo: 'rune' },
  26: { forma: 'stemma', W: 0.225, yT: 0.28, yB: -0.3, a: 0.35, p: 2.1, campo: [K.nero], strisce: K.grigioScuro, bordo: 'dentelli' },
  27: { forma: 'stemma', W: 0.22, yT: 0.28, yB: -0.3, a: 0.4, p: 1.9, top: 'corna', campo: [K.bruno], embl: ['sole', { col: K.oro, col2: K.oroS, raggi: 12 }], bordo: 'borchie' },
  28: { forma: 'tondo', R: 0.255, campo: [K.legnoRossiccio], assi: 7, rim: ferro.medio, bordo: 'borchie', borchiaR: 0.02, umbone: { r: 0.07, col: ferro.chiaro } },
  29: { forma: 'goccia', W: 0.215, yT: 0.28, yB: -0.3, p: 2.3, top: 'arco', campo: [K.marrone], assi: 5, embl: ['teschio', { s: 1.1, col: K.oro }], bordo: 'dentelli' },
  30: { forma: 'goccia', W: 0.21, yT: 0.28, yB: -0.3, p: 2.5, campo: [K.legnoViola], assi: 5, embl: ['croce', { up: 0.2, dn: 0.2, sd: 0.15, t: 0.03, fl: 0.03, col: 0xff6a1e, viva: true }], bordo: 'liscio' },
  31: { forma: 'goccia', W: 0.225, yT: 0.27, yB: -0.3, p: 2.7, top: 'conc', campo: [K.nero], embl: ['leone', { stile: 'passante', col: K.oro, col2: K.oroS, lingua: true, pose: -1 }], bordo: 'liscio' },
  32: { forma: 'goccia', W: 0.225, yT: 0.28, yB: -0.3, p: 2.4, campo: [K.cobalto], embl: ['croce', { up: 0.17, dn: 0.17, sd: 0.14, t: 0.04, col: K.argento }], bordo: 'liscio', borchieCampo: true },
  33: { forma: 'goccia', W: 0.23, yT: 0.28, yB: -0.31, p: 2.1, top: 'corna', campo: [K.nerastro], embl: ['drago', { col: K.rossoV, col2: K.rossoS }], bordo: 'dentelli' },
  34: { forma: 'goccia', W: 0.2, yT: 0.29, yB: -0.31, p: 2.3, campo: [K.legnoAmbra], assi: 4, embl: ['croce', { up: 0.2, dn: 0.2, sd: 0.15, t: 0.02, tri: true, col: K.argento }], bordo: 'liscio' },
  35: { forma: 'goccia', W: 0.21, yT: 0.28, yB: -0.3, p: 2.2, top: 'picco', campo: [K.nero], embl: ['luna', { col: K.oro }], bordo: 'rune' },
  36: { forma: 'mandorla', W: 0.21, yT: 0.3, yB: -0.3, campo: [K.rossoBruno, 0x5a1a18], assi: 3, embl: ['giglioOsso', { col: K.ossoOro }], bordo: 'dentelli' },
  37: { forma: 'goccia', W: 0.215, yT: 0.28, yB: -0.3, p: 2.6, top: 'tacche', campo: [K.marrone], embl: ['leone', { stile: 'testa', col: 0xc8641e, col2: 0x8a3a14, pose: -1 }], bordo: 'liscio' },
  38: { forma: 'goccia', W: 0.215, yT: 0.28, yB: -0.3, p: 2.3, top: 'arco', campo: [K.bluNotte, K.viola], embl: ['teschio', { s: 1.1, col: K.osso, occhiVivi: true }], bordo: 'rune' },
  39: { forma: 'goccia', W: 0.22, yT: 0.28, yB: -0.3, p: 2.5, top: 'picco', campo: [K.bluNero], embl: ['leone', { stile: 'sedente', col: K.oro, col2: K.oroS, fiamme: true }], bordo: 'borchie' },
  40: { forma: 'goccia', W: 0.235, yT: 0.27, yB: -0.3, p: 2.8, top: 'conc', campo: [K.bluS], embl: ['teschio', { s: 1.45, col: K.osso, mascella: true }], bordo: 'dentelli' },
  41: { forma: 'goccia', W: 0.2, yT: 0.27, yB: -0.29, p: 2.4, campo: [K.marrone], assi: 4, embl: ['croce', { up: 0.1, dn: 0.1, sd: 0.08, t: 0.016, col: K.argentoS }], bordo: 'liscio' },
  42: { forma: 'goccia', W: 0.21, yT: 0.28, yB: -0.3, p: 2.2, campo: [K.marroneChiaro], assi: 4, embl: ['croce', { up: 0.16, dn: 0.16, sd: 0.14, t: 0.024, fl: 0.04, col: K.bianco }], bordo: 'liscio' },
  43: { forma: 'goccia', W: 0.215, yT: 0.28, yB: -0.3, p: 2.5, top: 'arco', campo: [K.verde, K.verdeS], embl: ['teschio', { s: 1.1, col: K.bianco }], bordo: 'dentelli' },
  44: { forma: 'goccia', W: 0.215, yT: 0.28, yB: -0.3, p: 2.3, campo: [K.acciaioChiaro, 0x8a94a4], embl: ['croce', { up: 0.17, dn: 0.17, sd: 0.13, t: 0.026, col: K.argento }], bordo: 'borchie' },
  45: { forma: 'goccia', W: 0.225, yT: 0.28, yB: -0.31, p: 2.4, top: 'corna', campo: [K.azzurroV], embl: ['croce', { up: 0.22, dn: 0.22, sd: 0.19, t: 0.03, fl: 0.05, col: K.argento }], bordo: 'liscio' },
  46: { forma: 'goccia', W: 0.215, yT: 0.28, yB: -0.3, p: 2.5, top: 'picco', campo: [K.ghiaccio, 0x2f78c0], embl: ['albero', { col: K.bianco }], bordo: 'liscio' },
  47: { forma: 'tondo', R: 0.26, campo: [K.arancio, K.rossoS], embl: ['sole', { col: K.oro, col2: K.oroS, raggi: 16, rilievo: true }], bordo: 'borchie', rim: ferro.medio },
  48: { forma: 'goccia', W: 0.2, yT: 0.28, yB: -0.31, p: 2.3, campo: [K.grigioBlu], embl: ['croce', { up: 0.19, dn: 0.19, sd: 0.15, t: 0.014, fl: 0.035, col: K.ossoOro }], bordo: 'liscio' },
  49: { forma: 'tondo', R: 0.24, campo: [K.bluNotte], embl: ['runa', {}], bordo: 'rune' },
  50: { forma: 'tondo', R: 0.255, campo: [K.viola, K.bluNero], stelle: true, embl: ['occhio', {}], bordo: 'rune' },
  51: { forma: 'goccia', W: 0.225, yT: 0.28, yB: -0.3, p: 2.2, top: 'arco', campo: [K.arancio, K.rossoS], embl: ['leone', { stile: 'gardant', col: K.oro, col2: K.oroS, corona: true, viva: true }], bordo: 'borchie' },
  52: { forma: 'goccia', W: 0.2, yT: 0.27, yB: -0.29, p: 2.4, campo: [K.blu], embl: ['elle', { col: K.argento }], bordo: 'liscio' },
  53: { forma: 'tondo', R: 0.25, campo: [K.nerastro], embl: ['fiamma', { col: K.rossoV, col2: K.aranciaV }], bordo: 'punte', rim: oroM.medio, rimT: 'oro' }
}
K.ferroB = 0x6a6e76
SPEC[9].bande = K.ferroB

// ── il contorno ──
const lin = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n)
function topY (top, x, W) {
  const u = Math.abs(x) / W
  switch (top) {
    case 'arco': return 0.045 * (1 - u * u)
    case 'conc': return -0.03 * (1 - u * u) + 0.012 * u
    case 'picco': return 0.07 * (1 - u)
    case 'corna': return 0.055 * u ** 2.5 - 0.01 * (1 - u)
    case 'tacche': return u < 0.3 ? -0.04 : 0
    default: return 0
  }
}
function contorno (s) {
  const { forma } = s
  if (forma === 'tondo') return Array.from({ length: 24 }, (_, i) => [Math.cos(i * Math.PI / 12) * s.R, Math.sin(i * Math.PI / 12) * s.R])
  if (forma === 'ovale') return Array.from({ length: 22 }, (_, i) => [Math.cos(i * Math.PI / 11) * s.W, Math.sin(i * Math.PI / 11) * (s.yT - s.yB) / 2])
  if (forma === 'rinf') return [[-0.2, 0.3], [0.2, 0.3], [0.25, 0.25], [0.25, -0.1], [0.17, -0.27], [-0.17, -0.27], [-0.25, -0.1], [-0.25, 0.25]]
  const n = 14
  if (forma === 'mandorla') {
    const r = [], l = []
    for (let i = 0; i <= n; i++) { const t = i / n, w = s.W * Math.sin(Math.PI * t) ** 0.8, y = s.yT + (s.yB - s.yT) * t; r.push([w, y]); if (i > 0 && i < n) l.unshift([-w, y]) }
    return [...r, ...l]
  }
  const a = s.a || 0, p = s.p || 2.4, r = [], l = []
  const tc = topY(s.top, s.W, s.W)
  for (let i = 0; i <= n; i++) {
    const t = i / n, y = s.yT + (s.yB - s.yT) * t
    const w = t <= a ? s.W : s.W * (1 - ((t - a) / (1 - a)) ** p)
    r.push([w, i === 0 ? y + tc : y]); if (i < n) l.unshift([-w, i === 0 ? y + tc : y])
  }
  const cima = []
  if (s.top === 'tacche') { for (const x of [-0.3, -0.3, 0.3, 0.3]) cima.push([x * s.W, s.yT + (cima.length % 3 === 0 ? 0 : -0.045)]) ; cima[1][1] = s.yT - 0.045; cima[2][1] = s.yT - 0.045 }
  else if (s.top && s.top !== 'piatto') for (const x of lin(-s.W, s.W, 8).slice(1, -1)) cima.push([x, s.yT + topY(s.top, x, s.W)])
  return [...r, ...l, ...cima]
}
const centra = pts => { let a = 1e9, b = -1e9; for (const [, y] of pts) { a = Math.min(a, y); b = Math.max(b, y) } return (a + b) / 2 }
const scalaPts = (pts, k, cy) => pts.map(([x, y]) => [x * k, (y - cy) * k + cy])
/** Intervallo verticale occupato dal poligono a x (per assi e strisce). */
function spanY (pts, x) {
  let lo = 1e9, hi = -1e9
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]
    if ((x1 - x) * (x2 - x) <= 0 && x1 !== x2) { const y = y1 + (y2 - y1) * (x - x1) / (x2 - x1); lo = Math.min(lo, y); hi = Math.max(hi, y) }
  }
  return [lo, hi]
}
function xSpan (pts, y) {
  let hi = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]
    if ((y1 - y) * (y2 - y) <= 0 && y1 !== y2) hi = Math.max(hi, Math.abs(x1 + (x2 - x1) * (y - y1) / (y2 - y1)))
  }
  return hi
}
/** `n` punti equidistanti sul perimetro con la normale uscente. */
function perimetro (pts, n, fase = 0) {
  const m = pts.length, lung = [0]
  let area = 0
  for (let i = 0; i < m; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % m]; lung.push(lung[i] + Math.hypot(x2 - x1, y2 - y1)); area += x1 * y2 - x2 * y1 }
  const tot = lung[m], segno = area > 0 ? 1 : -1, out = []
  for (let j = 0; j < n; j++) {
    const d = ((j + fase) / n % 1) * tot
    let i = 0; while (i < m - 1 && lung[i + 1] < d) i++
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % m], u = (d - lung[i]) / ((lung[i + 1] - lung[i]) || 1)
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1
    out.push({ x: x1 + dx * u, y: y1 + dy * u, nx: segno * dy / L, ny: -segno * dx / L })
  }
  return out
}

// ── quote dei rilievi ──
const Z0 = 0.042, PASSO = 0.005
const capa = L => Z0 + PASSO * L
/** Un poligono sul campo, a strato L (la faccia in vista a quota capa(L)), incassato nel campo. */
function dec (f, pts, col, L, tipo = 'pieno', x = 0, y = 0) {
  const top = capa(L), base = 0.026, d = top - base
  f.metti(poli(pts, d, 0), col, x, y, base + d / 2, {}, tipo)
}
function disco (f, r, col, L, x = 0, y = 0, tipo = 'pieno', seg = 14) {
  const top = capa(L), base = 0.026, d = top - base
  f.metti(cil(r, r, d, seg), col, x, y, base + d / 2, { rx: PIATTA }, tipo)
}
const scaglia = (geo, x, y, z, sx, sy, sz, rot = {}) => ({ geo, x, y, z, s: [sx, sy, sz], rot })
function gruppo (f, col, tipo, lista) { for (const p of lista) f.metti(p.geo, col, p.x, p.y, p.z, { ...p.rot, s: p.s }, tipo) }

// il campo con sfumatura verticale (colore alto → colore basso)
function campoMesh (f, pts, prof, c1, c2) {
  const p = poli(pts, prof, 0.004), g = p.index ? p.toNonIndexed() : p   // poli può tornarla già senza indici
  g.deleteAttribute('uv')
  g.computeVertexNormals()
  const pos = g.attributes.position, a = new Float32Array(pos.count * 3), A = new THREE.Color(c1), B = new THREE.Color(c2 ?? c1)
  let lo = 1e9, hi = -1e9
  for (let i = 0; i < pos.count; i++) { lo = Math.min(lo, pos.getY(i)); hi = Math.max(hi, pos.getY(i)) }
  const tmp = new THREE.Color()
  for (let i = 0; i < pos.count; i++) { const u = (hi - pos.getY(i)) / ((hi - lo) || 1); tmp.copy(A).lerp(B, u * u * (3 - 2 * u)); a[i * 3] = tmp.r; a[i * 3 + 1] = tmp.g; a[i * 3 + 2] = tmp.b }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3))
  if (!f.liste.has('pieno')) f.liste.set('pieno', [])
  f.liste.get('pieno').push(g)
}

// ── croce: braccia con lunghezze proprie, svasatura alle estremità ──
function croceGeo ({ up, dn, sd, t, fl = 0 }, grow = 0) {
  const arm = (L, k) => {
    const tt = t + grow, w = tt + fl + grow
    const loc = fl > 0 ? [[-tt, tt], [-tt, L - fl * 1.6 + grow], [-w, L + grow], [w, L + grow], [tt, L - fl * 1.6 + grow], [tt, tt]] : [[-tt, tt], [-tt, L + grow], [tt, L + grow], [tt, tt]]
    const c = Math.cos(-k * PIATTA), s = Math.sin(-k * PIATTA)
    return loc.map(([x, y]) => [x * c - y * s, x * s + y * c])
  }
  const out = []
  ;[[up, 0], [sd, 1], [dn, 2], [sd, 3]].forEach(([L, k], i) => { const a = arm(L, k); out.push(...(i === 0 ? a : a.slice(1))) })
  out.pop()
  return out
}

// ── sagome: un nastro che si affusola lungo una linea, una stella a raggi ──
function nastro (path, w0, w1) {
  const n = path.length, L = [], R = []
  for (let i = 0; i < n; i++) {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1
    const w = (w0 + (w1 - w0) * i / (n - 1)) / 2, nx = -dy / d * w, ny = dx / d * w
    L.push([path[i][0] + nx, path[i][1] + ny]); R.push([path[i][0] - nx, path[i][1] - ny])
  }
  return [...L, ...R.reverse()]
}
function stella (cx, cy, R0, R1, n, rot = 0) {
  return Array.from({ length: n * 2 }, (_, i) => { const a = rot + i * Math.PI / n, r = i % 2 ? R1 : R0; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] })
}
const ellisse = (cx, cy, rx, ry, n = 10) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i * 2 * Math.PI / n) * rx, cy + Math.sin(i * 2 * Math.PI / n) * ry])

const corona = (D, cx, cy, w, L) => D([[cx - w, cy], [cx + w, cy], [cx + w, cy + w * 0.5], [cx + w * 0.55, cy + w * 0.25], [cx + w * 0.55, cy + w * 0.95], [cx, cy + w * 0.5], [cx - w * 0.55, cy + w * 0.95], [cx - w * 0.55, cy + w * 0.25], [cx - w, cy + w * 0.5]], K.oro, L)

// ── i cinque leoni, ognuno con la sua sagoma: rampante (20), passante (31), testa (37), sedente a raggi (39), gardant (51) ──
const LEO = {
  rampante (c, o) {
    const { f } = c, m = o.pose || 1, S = 0.88, y0 = c.y - 0.045
    const PL = [[-0.10, -0.15], [-0.02, -0.15], [0.0, -0.10], [0.03, -0.15], [0.10, -0.15], [0.10, -0.12], [0.05, -0.09], [0.04, -0.02], [0.08, 0.02], [0.15, 0.04], [0.18, 0.08], [0.15, 0.1], [0.1, 0.07],
      [0.13, 0.11], [0.18, 0.14], [0.15, 0.16], [0.09, 0.13], [0.06, 0.15], [0.02, 0.17], [-0.05, 0.06], [-0.08, -0.02], [-0.10, -0.08]]
    dec(f, PL.map(([x, y]) => [m * x * S, y * S]), o.col, 1, 'oro', 0, y0)
    dec(f, [[-0.02, -0.1], [0.02, -0.03], [-0.02, 0.06], [-0.06, 0.0]].map(([x, y]) => [m * x * S, y * S]), o.col2, 2, 'oro', 0, y0)   // l'ombra del corpo
    const z = capa(2) + 0.006
    f.metti(ico(0.062 * S, 0), o.col2, m * 0.035 * S, y0 + 0.19 * S, z, { s: [1, 1, 0.7] }, 'oro')                       // criniera
    f.metti(sfe(0.04 * S, 6, 4), o.col, m * 0.075 * S, y0 + 0.2 * S, z + 0.01, { s: [1, 1, 0.8] }, 'oro')                   // testa
    f.metti(sca(0.045 * S, 0.028 * S, 0.03 * S), o.col, m * 0.115 * S, y0 + 0.19 * S, z + 0.008, {}, 'oro')                // muso
    f.metti(sfe(0.008 * S, 4, 3), K.ink, m * 0.095 * S, y0 + 0.215 * S, z + 0.035, {})
    if (o.lingua) f.metti(sca(0.03 * S, 0.008 * S, 0.01), 0xd03a3a, m * 0.135 * S, y0 + 0.178 * S, z + 0.012, {})
    const T = [[-0.08, -0.03], [-0.15, 0.0], [-0.17, 0.08], [-0.13, 0.14]].map(([x, y]) => [m * x * S, y0 + y * S, capa(1) + 0.004])
    f.fila(T, 0.012 * S, 0.008 * S, o.col, 'oro', 4); f.metti(ico(0.02 * S, 0), o.col2, ...T[3], {}, 'oro')
    if (o.corona) { f.metti(cil(0.028 * S, 0.036 * S, 0.02, 5), K.oro, m * 0.04 * S, y0 + 0.255 * S, z + 0.01, {}, 'oro'); for (const x of [-1, 0, 1]) f.metti(con(0.009, 0.03, 4), K.oro, m * (0.04 + x * 0.02) * S, y0 + 0.285 * S, z + 0.01, {}, 'oro') }
    if (o.fiamme) c.fiamme = [[m * 0.0, y0 + 0.28 * S, 0.04], [m * -0.12 * S, y0 + 0.18 * S, 0.04], [m * 0.14 * S, y0 + 0.24 * S, 0.04], [m * -0.14 * S, y0 - 0.1 * S, 0.04]]
  },
  // il passante: il corpo orizzontale, tre zampe a terra e una alzata, la coda sul dorso, la testa girata verso chi guarda
  passante (c, o) {
    const { f } = c, m = o.pose || 1, S = 0.84, y0 = c.y + 0.01
    const Q = pts => pts.map(([x, y]) => [m * x * S, y * S]), D = (pts, col, L) => dec(f, Q(pts), col, L, 'oro', 0, y0)
    const P = (x, y, zz) => [m * x * S, y0 + y * S, zz]
    D([[-0.17, 0.01], [-0.16, 0.06], [-0.10, 0.085], [0.0, 0.075], [0.08, 0.085], [0.12, 0.05], [0.115, -0.01], [0.08, -0.04], [0.0, -0.035], [-0.09, -0.04], [-0.15, -0.03]], o.col, 1)
    D([[-0.1, -0.035], [0.0, -0.03], [0.07, -0.035], [0.04, 0.0], [-0.04, 0.005], [-0.1, 0.0]], o.col2, 2)            // il ventre in ombra
    for (const [pts, x] of [[[[-0.13, -0.03], [-0.115, -0.09], [-0.135, -0.14]], -0.135], [[[-0.075, -0.03], [-0.06, -0.09], [-0.075, -0.14]], -0.075], [[[0.085, -0.03], [0.09, -0.09], [0.085, -0.14]], 0.085]]) {
      D(nastro(pts, 0.034, 0.022), o.col, 1); D([[x - 0.03, -0.155], [x + 0.03, -0.155], [x + 0.025, -0.125], [x - 0.02, -0.125]], o.col, 1)
    }
    D(nastro([[0.105, 0.0], [0.15, -0.02], [0.19, -0.065]], 0.032, 0.022), o.col, 1); D([[0.18, -0.085], [0.23, -0.085], [0.22, -0.045], [0.185, -0.05]], o.col, 1)   // la zampa alzata
    const T = [[-0.16, 0.04], [-0.205, 0.1], [-0.2, 0.17], [-0.15, 0.205]]
    D(nastro(T, 0.022, 0.014), o.col, 1); f.metti(ico(0.026 * S, 0), o.col2, ...P(-0.15, 0.215, capa(1) + 0.006), {}, 'oro')
    const zz = capa(2) + 0.004
    D(stella(0.145, 0.065, 0.1, 0.07, 11, 0.2), o.col2, 2)                                                           // la criniera a punte
    D([[0.12, 0.035], [0.125, 0.1], [0.165, 0.12], [0.215, 0.095], [0.23, 0.06], [0.2, 0.035]], o.col, 3)           // il muso
    f.metti(sfe(0.009 * S, 4, 3), K.ink, ...P(0.195, 0.09, capa(3) + 0.012), {})
    f.metti(sca(0.02 * S, 0.016 * S, 0.012), K.ink, ...P(0.228, 0.065, capa(3) + 0.006), {})
    if (o.lingua) f.metti(sca(0.03 * S, 0.008 * S, 0.01), 0xd03a3a, ...P(0.222, 0.04, zz + 0.02), {})
    D([[0.15, 0.115], [0.155, 0.15], [0.175, 0.125]], o.col, 3)                                                       // l'orecchio
  },
  // la testa di leone di fronte: la criniera tutta a raggi, il muso, le orecchie
  testa (c, o) {
    const { f } = c, y0 = c.y + 0.005, Q = (pts, dx = 0) => pts.map(([x, y]) => [x + dx, y])
    const D = (pts, col, L) => dec(f, pts, col, L, 'oro', 0, y0)
    D(stella(0, 0, 0.2, 0.135, 14, 0.1), o.col2, 1)
    D(stella(0, 0, 0.15, 0.11, 14, 0.1 + Math.PI / 14), o.col, 2)
    D(ellisse(0, -0.01, 0.1, 0.115, 12), o.col2, 3)
    for (const s of [-1, 1]) { D(ellisse(s * 0.09, 0.105, 0.032, 0.032, 8), o.col, 3); D(ellisse(s * 0.09, 0.105, 0.017, 0.017, 6), o.col2, 4) }
    D(ellisse(0, -0.005, 0.085, 0.1, 12), o.col, 4)
    D(ellisse(-0.03, -0.055, 0.04, 0.032, 8), 0xf0d898, 5); D(ellisse(0.03, -0.055, 0.04, 0.032, 8), 0xf0d898, 5)    // il muso
    D([[-0.032, -0.02], [0.032, -0.02], [0.012, -0.05], [-0.012, -0.05]], K.ink, 6)                                  // il naso
    for (const s of [-1, 1]) {
      D([[s * 0.025, 0.045], [s * 0.075, 0.035], [s * 0.07, 0.065], [s * 0.03, 0.07]], 0xf6d8a0, 5)
      f.metti(sfe(0.011, 4, 3), K.ink, s * 0.047, y0 + 0.052, capa(5) + 0.012, { s: [1.2, 0.8, 0.5] })               // gli occhi
      D(nastro([[s * 0.012, -0.055], [s * 0.012, -0.085], [s * 0.04, -0.095]], 0.006, 0.006), K.ink, 6)              // la bocca
    }
    if (o.lingua) D([[-0.012, -0.09], [0.012, -0.09], [0.012, -0.125], [-0.012, -0.125]], 0xd03a3a, 6)
    if (o.corona) corona(D, 0, 0.11, 0.07, 7)
    if (o.fiamme) c.fiamme = [[0, y0 + 0.21, 0.04], [-0.17, y0 + 0.1, 0.04], [0.17, y0 + 0.1, 0.04]]
    void Q
  },
  // il sedente: seduto sulle zampe di dietro, il petto dritto, la testa di profilo in una corona di raggi
  sedente (c, o) {
    const { f } = c, m = o.pose || 1, S = 0.86, y0 = c.y - 0.03
    const Q = pts => pts.map(([x, y]) => [m * x * S, y * S]), D = (pts, col, L) => dec(f, Q(pts), col, L, 'oro', 0, y0)
    const P = (x, y, zz) => [m * x * S, y0 + y * S, zz]
    D(nastro([[-0.1, -0.15], [-0.17, -0.15], [-0.2, -0.08], [-0.17, -0.02]], 0.022, 0.014), o.col, 1); f.metti(ico(0.024 * S, 0), o.col2, ...P(-0.17, -0.015, capa(1) + 0.006), {}, 'oro')
    D([[-0.1, -0.16], [-0.12, -0.08], [-0.09, 0.0], [-0.04, 0.07], [0.02, 0.1], [0.07, 0.08], [0.08, 0.0], [0.065, -0.1], [0.07, -0.16], [0.0, -0.17]], o.col, 1)   // il tronco
    D(ellisse(-0.04, -0.1, 0.085, 0.07, 10), o.col2, 2)                                                           // la coscia
    D([[-0.07, -0.165], [0.02, -0.165], [0.025, -0.14], [-0.065, -0.14]], o.col, 2)
    D(nastro([[0.045, 0.02], [0.055, -0.07], [0.055, -0.14]], 0.036, 0.028), o.col, 2); D([[0.04, -0.17], [0.1, -0.17], [0.095, -0.14], [0.04, -0.14]], o.col, 2)   // la zampa davanti
    D(stella(0.06, 0.155, 0.125, 0.085, 13, 0.3), o.col2, 1)                                                      // i raggi della criniera
    D(ellisse(0.06, 0.15, 0.085, 0.085, 10), o.col, 2)
    D([[0.075, 0.115], [0.085, 0.195], [0.14, 0.205], [0.185, 0.17], [0.185, 0.135], [0.14, 0.11]], 0xf0d898, 3)  // il muso
    f.metti(sfe(0.009 * S, 4, 3), K.ink, ...P(0.145, 0.178, capa(3) + 0.012), {})
    f.metti(sca(0.02 * S, 0.016 * S, 0.012), K.ink, ...P(0.186, 0.152, capa(3) + 0.006), {})
    if (o.lingua) f.metti(sca(0.03 * S, 0.008 * S, 0.01), 0xd03a3a, ...P(0.18, 0.128, capa(3) + 0.012), {})
    if (o.corona) corona(D, 0.06, 0.225, 0.05, 4)
    if (o.fiamme) c.fiamme = [[m * 0.06 * S, y0 + 0.28 * S, 0.04], [m * -0.1 * S, y0 + 0.2 * S, 0.04], [m * 0.2 * S, y0 + 0.24 * S, 0.04]]
  },
  // il gardant: dritto di fronte, le braccia aperte e la testa che guarda fuori dallo scudo
  gardant (c, o) {
    const { f } = c, S = 0.9, y0 = c.y - 0.03, Q = pts => pts.map(([x, y]) => [x * S, y * S])
    const D = (pts, col, L) => dec(f, Q(pts), col, L, 'oro', 0, y0)
    D(nastro([[0.05, -0.12], [0.16, -0.12], [0.2, -0.02], [0.17, 0.06]], 0.022, 0.014), o.col, 1); f.metti(ico(0.024 * S, 0), o.col2, 0.17 * S, y0 + 0.07 * S, capa(1) + 0.006, {}, 'oro')
    D([[-0.065, 0.1], [0.065, 0.1], [0.085, 0.0], [0.075, -0.1], [0.125, -0.175], [0.04, -0.175], [0.0, -0.1], [-0.04, -0.175], [-0.125, -0.175], [-0.075, -0.1], [-0.085, 0.0]], o.col, 1)
    D([[-0.04, 0.08], [0.04, 0.08], [0.05, -0.04], [0.0, -0.09], [-0.05, -0.04]], o.col2, 2)                      // il petto in ombra
    for (const s of [-1, 1]) {
      D(nastro([[s * 0.06, 0.07], [s * 0.14, 0.1], [s * 0.2, 0.17]], 0.034, 0.026), o.col, 1)
      D([[s * 0.17, 0.155], [s * 0.19, 0.21], [s * 0.21, 0.175], [s * 0.235, 0.19], [s * 0.235, 0.15], [s * 0.21, 0.13]], o.col, 1)   // la mano con gli artigli
    }
    D(stella(0, 0.17, 0.125, 0.085, 14, 0.12), o.col2, 1)
    D(ellisse(0, 0.17, 0.082, 0.088, 12), o.col, 2)
    for (const s of [-1, 1]) {
      D(ellisse(s * 0.07, 0.235, 0.024, 0.024, 7), o.col, 2)
      f.metti(sfe(0.01 * S, 4, 3), K.ink, s * 0.034 * S, y0 + 0.19 * S, capa(2) + 0.012, { s: [1.2, 0.8, 0.5] })
    }
    D(ellisse(0, 0.14, 0.05, 0.04, 8), 0xf0d898, 3); D([[-0.022, 0.16], [0.022, 0.16], [0.0, 0.14]], K.ink, 4)
    if (o.lingua) D([[-0.01, 0.125], [0.01, 0.125], [0.01, 0.1], [-0.01, 0.1]], 0xd03a3a, 4)
    if (o.corona) corona(D, 0, 0.245, 0.06, 5)
    if (o.fiamme) c.fiamme = [[0, y0 + 0.36 * S, 0.04], [-0.17 * S, y0 + 0.25 * S, 0.04], [0.17 * S, y0 + 0.25 * S, 0.04]]
  }
}

// ── gli emblemi: tutti a (0, y) con `s` come scala, partono da capa(0) ──
const EMB = {
  croce (c, o) {
    const { f } = c, g = { up: o.up, dn: o.dn, sd: o.sd, t: o.t, fl: o.fl || 0 }
    dec(f, croceGeo(g, 0.007), c.ink, 0, 'pieno', 0, c.y)
    dec(f, croceGeo(g), o.col, 1, o.viva ? 'viva' : 'oro', 0, c.y)
    if (o.tri) for (const [x, y, k] of [[0, g.up, 0], [g.sd, 0, 1], [0, -g.dn, 2], [-g.sd, 0, 3]]) disco(f, 0.03, o.col, 2, x, c.y + y, 'metallo', 8)
    if (o.orn) {
      disco(f, 0.035, o.col, 2, 0, c.y, 'metallo', 10); disco(f, 0.016, K.blu, 3, 0, c.y, 'pieno', 8)
      for (const [x, y] of [[0, g.up], [g.sd, 0], [-g.sd, 0], [0, -g.dn]]) disco(f, 0.02, o.col, 2, x, c.y + y, 'metallo', 8)
    }
  },
  elle (c, o) {
    dec(c.f, [[-0.04, 0.12], [0.01, 0.12], [0.01, -0.06], [0.1, -0.06], [0.1, -0.11], [-0.04, -0.11]], o.col, 1, 'metallo', 0, c.y)
  },
  teschio (c, o) {
    const { f } = c, s = 0.062 * (o.s || 1), y = c.y + 0.02, z = capa(0)
    f.metti(sfe(s, 9, 7), o.col, 0, y, z, { s: [1, 1.05, 0.5] }, 'pieno')
    f.metti(sca(s * 1.25, s * 0.7, s * 0.7), o.col, 0, y - s * 0.95, z, {}, 'pieno')
    if (o.mascella) { f.metti(sca(s * 1.5, s * 0.45, s * 0.6), o.col, 0, y - s * 1.55, z - 0.003, {}, 'pieno'); for (const x of [-0.5, -0.17, 0.17, 0.5]) f.metti(sca(s * 0.1, s * 0.35, s * 0.2), K.ink, x * s, y - s * 1.55, z + s * 0.32, {}) }
    for (const x of [-1, 1]) f.metti(sfe(s * 0.3, 6, 5), o.occhiVivi ? 0x7aff9a : K.ink, x * s * 0.42, y + s * 0.0, z + s * 0.38, { s: [1, 1.15, 0.6] }, o.occhiVivi ? 'viva' : 'pieno')
    f.metti(con(s * 0.14, s * 0.3, 3), K.ink, 0, y - s * 0.38, z + s * 0.42, { rx: PIATTA * 0 + 0.1, rz: Math.PI }, 'pieno')
    for (const x of [-0.45, -0.15, 0.15, 0.45]) f.metti(sca(s * 0.1, s * 0.3, s * 0.1), K.ink, x * s, y - s * 0.98, z + s * 0.34, {})
  },
  leone (c, o) { LEO[o.stile || 'rampante'](c, o) },
  sole (c, o) {
    const { f } = c, n = o.raggi || 12, R = o.rilievo ? 0.085 : 0.075, y = c.y
    for (let i = 0; i < n; i++) {
      const a = i * 2 * Math.PI / n, lung = i % 2 ? 0.07 : 0.11
      f.metti(con(0.021, lung, 4), i % 2 ? o.col2 : o.col, Math.cos(a) * (R + lung / 2 - 0.004), y + Math.sin(a) * (R + lung / 2 - 0.004), capa(0) + 0.006, { rz: a - PIATTA, s: [1, 1, 0.5] }, 'oro')
    }
    disco(f, R + 0.003, K.ink, 0, 0, y, 'pieno', 16); disco(f, R - 0.007, o.col, 1, 0, y, 'oro', 16)
    if (o.rilievo) f.metti(sfe(R * 0.72, 10, 7), o.col2, 0, y, capa(1), { s: [1, 1, 0.45] }, 'oro')
    for (const x of [-1, 1]) f.metti(sfe(0.011, 5, 4), K.ink, x * 0.03, y + 0.012, capa(1) + 0.01, { s: [1, 1.2, 0.5] })
    f.metti(sca(0.04, 0.008, 0.008), K.ink, 0, y - 0.03, capa(1) + 0.006)
  },
  fiamma (c, o) {
    const T = [[0, 0.15], [0.03, 0.08], [0.07, 0.05], [0.06, -0.03], [0.09, -0.08], [0.04, -0.12], [0, -0.1], [-0.04, -0.12], [-0.09, -0.08], [-0.06, -0.03], [-0.07, 0.05], [-0.03, 0.08]]
    disco(c.f, 0.115, K.ink, 0, 0, c.y, 'pieno', 16)
    dec(c.f, T.map(([x, y]) => [x * 1.35, y * 1.35]), o.col, 1, 'viva', 0, c.y)
    dec(c.f, T.map(([x, y]) => [x * 0.75, y * 0.7 - 0.015]), o.col2, 2, 'viva', 0, c.y)
  },
  fiammaGiglio (c, o) {
    const { f } = c, y = c.y
    dec(f, [[0, 0.17], [0.05, 0.08], [0.035, -0.02], [0, -0.06], [-0.035, -0.02], [-0.05, 0.08]], o.col, 1, 'oro', 0, y + 0.0)
    for (const s of [-1, 1]) dec(f, [[s * 0.03, 0.02], [s * 0.1, 0.08], [s * 0.13, 0.0], [s * 0.1, -0.07], [s * 0.03, -0.06]], o.col, 1, 'oro', 0, y)
    dec(f, [[-0.09, -0.07], [0.09, -0.07], [0.09, -0.1], [-0.09, -0.1]], o.col, 2, 'oro', 0, y)
    dec(f, [[0, 0.1], [0.022, 0.04], [0, -0.02], [-0.022, 0.04]], 0xfff0a0, 2, 'viva', 0, y)
  },
  giglio (c, o) {
    const { f } = c, y = c.y, k = o.s || 1, Q = pp => pp.map(([x, yy]) => [x * k, yy * k])
    dec(f, Q([[0, 0.17], [0.045, 0.08], [0.035, -0.03], [-0.035, -0.03], [-0.045, 0.08]]), K.ink, 0, 'pieno', 0, y)
    dec(f, Q([[0, 0.155], [0.036, 0.08], [0.027, -0.03], [-0.027, -0.03], [-0.036, 0.08]]), o.col, 1, 'metallo', 0, y)
    for (const sg of [-1, 1]) dec(f, Q([[sg * 0.03, 0.0], [sg * 0.07, 0.1], [sg * 0.13, 0.12], [sg * 0.13, 0.06], [sg * 0.1, -0.02], [sg * 0.05, -0.035]]), o.col, 1, 'metallo', 0, y)
    dec(f, Q([[-0.12, -0.035], [0.12, -0.035], [0.12, -0.065], [-0.12, -0.065]]), o.col, 2, 'metallo', 0, y)
    dec(f, Q([[-0.04, -0.065], [0.04, -0.065], [0.02, -0.15], [0, -0.17], [-0.02, -0.15]]), o.col, 1, 'metallo', 0, y)
  },
  giglioOsso (c, o) {
    const { f } = c, y = c.y
    // mezzo giglio mezzo teschio, consumato: pezzi spezzati
    dec(f, [[0, 0.15], [0.045, 0.06], [0.03, -0.04], [-0.03, -0.04], [-0.045, 0.06]], o.col, 1, 'pieno', 0, y)
    dec(f, [[0.03, 0.02], [0.1, 0.07], [0.12, 0.0], [0.08, -0.06], [0.03, -0.05]], o.col, 1, 'pieno', 0, y)
    dec(f, [[-0.03, 0.02], [-0.09, 0.05], [-0.1, 0.0], [-0.06, -0.03]], o.col, 1, 'pieno', 0, y)
    dec(f, [[-0.1, -0.04], [0.1, -0.04], [0.09, -0.07], [-0.1, -0.07]], o.col, 2, 'pieno', 0, y)
    for (const x of [-1, 1]) f.metti(sfe(0.013, 5, 4), K.ink, x * 0.016, y + 0.06, capa(2) + 0.004, { s: [1, 1.2, 0.5] })
    dec(f, [[0.01, 0.1], [0.05, 0.02], [0.02, 0.0], [0.0, 0.05]], K.rossoBruno, 3, 'pieno', 0.0, y)          // la crepa
  },
  sigillo (c, o) {
    const { f } = c, y = c.y
    disco(f, 0.15, K.ink, 0, 0, y, 'pieno', 14); disco(f, 0.14, o.col, 1, 0, y, 'oro', 14); disco(f, 0.115, K.rossoS, 2, 0, y, 'pieno', 14)
    disco(f, 0.094, o.col, 3, 0, y, 'oro', 12); disco(f, 0.068, K.rossoS, 4, 0, y, 'pieno', 12); disco(f, 0.045, o.col, 5, 0, y, 'oro', 10)
    f.metti(sfe(0.022, 6, 5), 0xff5a1a, 0, y, capa(5) + 0.006, { s: [1, 1, 0.5] }, 'viva')
    for (const s of [-1, 1]) f.metti(con(0.03, 0.1, 5), o.col, s * 0.1, y + 0.14, capa(1), { rz: -s * 0.55, s: [1, 1, 0.55] }, 'oro')
  },
  medaglione (c) {
    const y = c.y, f = c.f
    disco(f, 0.115, K.ink, 0, 0, y, 'pieno', 14); disco(f, 0.104, K.bianco, 1, 0, y, 'pieno', 14)
    disco(f, 0.078, K.ink, 2, 0, y, 'pieno', 12); disco(f, 0.056, K.bianco, 3, 0, y, 'pieno', 12); disco(f, 0.03, K.ink, 4, 0, y, 'pieno', 10)
  },
  luna (c, o) {
    const ext = [], int = []
    for (let i = 0; i <= 14; i++) { const a = Math.PI / 2 + i * (Math.PI / 14); ext.push([Math.cos(a) * 0.12 - 0.01, Math.sin(a) * 0.12]) }
    for (let i = 14; i >= 0; i--) { const a = Math.PI / 2 + i * (Math.PI / 14); int.push([Math.cos(a) * 0.075 + 0.035 - 0.01, Math.sin(a) * 0.115]) }
    dec(c.f, [...ext, ...int], K.ink, 0, 'pieno', 0.0, c.y)
    dec(c.f, [...ext.map(([x, y]) => [x * 0.93 - 0.002, y * 0.93]), ...int.map(([x, y]) => [x * 0.97 + 0.006, y * 0.97])], o.col, 1, 'oro', 0, c.y)
    for (const [x, y, r] of [[0.08, 0.1, 0.012], [0.11, -0.03, 0.009], [0.07, -0.1, 0.01]]) c.f.metti(ott(r), K.oro, x, c.y + y, capa(1) + 0.004, {}, 'oro')
  },
  occhio (c) {
    const f = c.f, y = c.y, z = capa(0)
    for (let i = 0; i < 14; i++) { const a = i * Math.PI / 7; f.metti(con(0.014, i % 2 ? 0.05 : 0.08, 4), 0xffb040, Math.cos(a) * 0.14, y + Math.sin(a) * 0.14, z + 0.004, { rz: a - PIATTA, s: [1, 1, 0.5] }, 'oro') }
    f.metti(sfe(0.13, 12, 6), K.ink, 0, y, z - 0.004, { s: [1, 0.62, 0.3] }, 'pieno')
    f.metti(sfe(0.115, 12, 6), 0xf6d6dc, 0, y, z - 0.002, { s: [1, 0.55, 0.38] }, 'pieno')
    f.metti(sfe(0.06, 10, 6), 0xe22a2a, 0, y, z + 0.016, { s: [1, 1, 0.5] }, 'viva')
    f.metti(sfe(0.027, 8, 6), K.ink, 0, y, z + 0.03, { s: [0.7, 1.3, 0.4] }, 'pieno')
  },
  runa (c) {
    const f = c.f, y = c.y
    dec(f, [[0, 0.14], [0.1, 0.03], [0, -0.08], [-0.1, 0.03]], K.ink, 0, 'pieno', 0, y)
    dec(f, [[0, 0.125], [0.088, 0.03], [0, -0.066], [-0.088, 0.03]], 0xe2551f, 1, 'viva', 0, y)
    dec(f, [[0, -0.07], [0.02, -0.07], [0.02, -0.17], [0.07, -0.2], [0.0, -0.21], [-0.02, -0.17]], 0xe2551f, 1, 'viva', 0, y)
    f.metti(ott(0.034), 0xffe08a, 0, y + 0.03, capa(2) + 0.01, { s: [1, 1.2, 0.7] }, 'viva')
  },
  // il drago araldico rampante: ali a membrana con le dita, collo ad S, testa col muso aperto e le corna, artigli, coda a spirale
  drago (c, o) {
    const { f } = c, y0 = c.y + 0.0, S = 0.82
    const Q = pts => pts.map(([x, y]) => [x * S, y * S]), D = (pts, col, L, t = 'pieno') => dec(f, Q(pts), col, L, t, 0, y0)
    const P = (x, y, zz) => [x * S, y0 + y * S, zz]
    // l'ala: la membrana a festoni dietro il corpo, le dita sopra
    D([[0.0, 0.09], [-0.05, 0.2], [-0.11, 0.255], [-0.2, 0.23], [-0.17, 0.17], [-0.235, 0.12], [-0.17, 0.08], [-0.2, 0.01], [-0.12, 0.03], [-0.06, 0.0]], o.col2, 0)
    for (const [a, b] of [[[0.0, 0.09], [-0.11, 0.255]], [[-0.11, 0.255], [-0.2, 0.23]], [[-0.11, 0.255], [-0.235, 0.12]], [[-0.11, 0.255], [-0.2, 0.01]]])
      D(nastro([a, b], 0.017, 0.008), o.col, 1)
    // la coda: spirale che si affina, con la punta a freccia
    const coda = [[-0.07, -0.1], [-0.14, -0.15], [-0.22, -0.13], [-0.23, -0.06], [-0.18, -0.03], [-0.15, -0.06]]
    D(nastro(coda, 0.036, 0.01), o.col, 1); D([[-0.145, -0.06], [-0.2, -0.085], [-0.15, -0.115]], o.col2, 1)
    // il corpo e il collo ad S
    D([[-0.085, -0.14], [-0.095, -0.04], [-0.07, 0.04], [-0.05, 0.1], [-0.055, 0.16], [-0.02, 0.205], [0.04, 0.215], [0.05, 0.17], [0.025, 0.125], [0.05, 0.075], [0.08, 0.02], [0.075, -0.06], [0.045, -0.14]], o.col, 1)
    D([[0.05, 0.17], [0.025, 0.125], [0.05, 0.075], [0.08, 0.02], [0.075, -0.06], [0.045, -0.14], [0.02, -0.14], [0.045, -0.06], [0.045, 0.02], [0.02, 0.075], [0.0, 0.125], [0.02, 0.17]], o.col2, 2)   // il ventre a fasce
    // la testa: cranio, muso lungo, mascella aperta con la lingua
    D([[-0.02, 0.19], [-0.01, 0.245], [0.05, 0.265], [0.12, 0.25], [0.2, 0.235], [0.205, 0.215], [0.13, 0.2], [0.09, 0.185], [0.05, 0.17]], o.col, 2)
    D([[0.07, 0.185], [0.13, 0.195], [0.19, 0.17], [0.2, 0.15], [0.13, 0.15], [0.07, 0.15]], o.col2, 2)
    D([[0.13, 0.195], [0.2, 0.2], [0.185, 0.18]], 0xf2efe6, 3)                                                       // le zanne
    D([[0.11, 0.19], [0.17, 0.19], [0.15, 0.172]], 0xc8302a, 3)                                                       // la lingua
    D([[0.0, 0.25], [-0.07, 0.31], [-0.04, 0.24]], o.col2, 3); D([[0.04, 0.265], [-0.02, 0.33], [0.01, 0.26]], o.col2, 3)     // le corna
    f.metti(sfe(0.012 * S, 5, 4), 0xffd23a, ...P(0.075, 0.23, capa(2) + 0.012), { s: [1.3, 0.8, 0.6] }, 'viva')
    // le zampe: dietro piantata, davanti due con gli artigli
    D([[-0.09, -0.05], [-0.05, -0.1], [0.0, -0.13], [0.0, -0.18], [0.1, -0.18], [0.1, -0.15], [0.06, -0.15], [0.04, -0.09], [-0.01, -0.03]], o.col, 2)
    for (const k of [0.06, 0.08, 0.1]) D([[k - 0.012, -0.18], [k + 0.012, -0.18], [k, -0.2]], 0xf2efe6, 2)
    D(nastro([[0.06, 0.05], [0.13, 0.08], [0.2, 0.125]], 0.034, 0.024), o.col, 2); D([[0.19, 0.12], [0.24, 0.15], [0.23, 0.12], [0.255, 0.12], [0.22, 0.09]], o.col, 2)
    D(nastro([[0.06, 0.0], [0.13, -0.01], [0.2, 0.02]], 0.034, 0.024), o.col, 2); D([[0.19, 0.03], [0.245, 0.04], [0.225, 0.015], [0.25, 0.0], [0.205, -0.01]], o.col, 2)
  },
  albero (c, o) {
    const { f } = c, y = c.y, z = capa(0) + 0.01
    f.asta([0, y - 0.16, z], [0, y + 0.04, z], 0.022, 0.014, o.col, 'pieno', 6)
    for (const s of [-1, 1]) {
      f.fila([[0, y - 0.07, z], [s * 0.06, y - 0.03, z], [s * 0.11, y + 0.0, z]], 0.012, 0.007, o.col, 'pieno', 5)
      f.fila([[0, y - 0.0, z], [s * 0.05, y + 0.06, z], [s * 0.09, y + 0.1, z]], 0.011, 0.006, o.col, 'pieno', 5)
      f.fila([[0, y + 0.04, z], [s * 0.03, y + 0.11, z], [s * 0.04, y + 0.16, z]], 0.01, 0.006, o.col, 'pieno', 5)
      for (const [x, yy] of [[0.12, 0.02], [0.1, 0.11], [0.045, 0.18]]) f.metti(ico(0.022, 0), o.col, s * x, y + yy, z + 0.004, { s: [1, 1, 0.7] }, 'pieno')
    }
    f.metti(ico(0.026, 0), o.col, 0, y + 0.19, z + 0.004, { s: [1, 1, 0.7] }, 'pieno')
    f.metti(sca(0.1, 0.02, 0.02), o.col, 0, y - 0.17, z, {}, 'pieno')
  }
}

// ── la costruzione di una figura ──
const TIPO_RIM = { oro: 'oro', pieno: 'pieno' }
export function crea (figura) {
  const n = parseInt(figura.id.split('-')[1], 10)
  const s = SPEC[n] || SPEC[2]
  const seme = hashStr(figura.id)
  const el = ELEMENTI[figura.elemento] || ELEMENTI.nessuno, pregio = PREGIO[figura.pregio || 1]
  const f = new Fucina(), an = []
  const pts = contorno(s), cy = centra(pts)
  const matRim = figura.materia === 'acciaio' ? acciaio : ferro
  const rimCol = s.rim ?? (figura.materia === 'acciaio' ? acciaio.scuro : ferro.medio)
  const rimT = s.rimT || 'metallo'
  const dim = Math.max(...pts.map(p => Math.abs(p[0])), (Math.max(...pts.map(p => p[1])) - Math.min(...pts.map(p => p[1]))) / 2)
  const k = s.rimFino ? 0.97 : s.rimGrosso ? 0.84 : (s.forma === 'tondo' ? 0.9 : 0.9)

  // corpo: il bordo (z ±0.025) e il campo sopra (z fino a 0.032)
  f.metti(poli(pts, 0.05, 0.005), rimCol, 0, 0, 0, {}, rimT)
  campoMesh(f, scalaPts(pts, k, cy), 0.064, s.campo[0], s.campo[1])
  const campoPts = scalaPts(pts, k, cy)

  // disegno del campo
  if (s.assi) for (let i = 1; i < s.assi; i++) {
    const x = -dim * 0.9 + (2 * dim * 0.9) * i / s.assi, [lo, hi] = spanY(campoPts, x)
    if (hi - lo > 0.1) f.metti(sca(0.006, hi - lo - 0.02, 0.012), 0x2a1a0e, x, (lo + hi) / 2, 0.033)
  }
  if (s.strisce) for (let i = 0; i < 9; i++) {
    const w = 2 * dim * 0.88 / 9, x = -dim * 0.88 + w * (i + 0.5)
    if (i % 2 === 0) continue
    const sp = [x - w * 0.46, x, x + w * 0.46].map(xx => spanY(campoPts, xx)), lo = Math.max(...sp.map(q => q[0])) + 0.015, hi = Math.min(...sp.map(q => q[1])) - 0.015
    if (hi - lo > 0.1) f.metti(sca(w * 0.92, hi - lo, 0.012), s.strisce, x, (lo + hi) / 2, 0.033)
  }
  if (s.fasceV) {
    const col = s.fasceV[0]
    for (const yv of s.fasceV[1]) { const hw = Math.max(0.06, Math.min(0.17, xSpan(campoPts, yv - 0.03) - 0.02)); dec(f, [[-hw, yv + 0.02], [0, yv + 0.1], [hw, yv + 0.02], [hw, yv - 0.03], [0, yv + 0.05], [-hw, yv - 0.03]], col, 0, 'pieno') }
  }
  if (s.bande) {                           // il rinforzato: due bande di ferro in diagonale e la borchia
    for (const sg of [-1, 1]) {
      const a = 0.62 * sg
      f.metti(sca(0.045, 0.6, 0.014), s.bande, 0, 0.0, 0.033, { rz: a }, 'metallo')
    }
    disco(f, 0.07, ferro.chiaro, 2, 0, cy, 'metallo', 10)
    for (const [x, y] of [[-0.17, 0.2], [0.17, 0.2], [-0.17, -0.18], [0.17, -0.18]]) f.metti(sfe(0.016, 5, 4), ferro.chiaro, x, y, 0.036, { s: [1, 1, 0.6] }, 'metallo')
  }
  if (s.stelle) for (let i = 0; i < 12; i++) {
    const a = rnd(seme, i) * 6.28, r = (0.4 + rnd(seme, i + 40) * 0.5) * s.R
    f.metti(ott(0.009 + 0.006 * rnd(seme, i + 9)), 0xfff2b0, Math.cos(a) * r, Math.sin(a) * r, 0.036, {}, 'viva')
  }
  if (s.borchieCampo) for (const [x, y] of [[-0.14, 0.2], [0.14, 0.2], [-0.15, 0.0], [0.15, 0.0], [-0.09, -0.2], [0.09, -0.2]]) f.metti(sfe(0.016, 5, 4), acciaio.chiaro, x, y, 0.034, { s: [1, 1, 0.6] }, 'metallo')

  // emblema
  const ctx = { f, y: cy + 0.015, ink: K.ink, pezzi: {} }
  if (s.embl) EMB[s.embl[0]](ctx, s.embl[1])
  // umbone
  if (s.umbone) {
    const u = s.umbone
    if (u.quad) { f.metti(sca(u.r * 1.6, u.r * 1.6, 0.03), u.col, 0, cy, 0.036, { rz: 0.78 }, 'metallo'); f.metti(sfe(u.r * 0.5, 6, 4), acciaio.chiaro, 0, cy, 0.05, { s: [1, 1, 0.6] }, 'metallo') }
    else { f.metti(sfe(u.r * 1.3, 10, 6), u.col, 0, cy, 0.03, { s: [1, 1, 0.65] }, 'metallo'); f.metti(ott(u.r * 0.35), u.col, 0, cy, 0.075, { s: [1, 1, 0.7] }, 'metallo') }
  }

  // il bordo: borchie, dentelli, rune, punte
  const outer = pts
  const area = Math.abs(pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1] }, 0)) / 2
  const perim = Math.sqrt(area) * 3.6
  const col = rimCol
  const nB = Math.max(8, Math.round(perim / 0.09))
  if (s.bordo === 'borchie') {
    const r = s.borchiaR || 0.014
    for (const p of perimetro(scalaPts(outer, (k + 1) / 2 + 0.005, cy), nB, 0.5)) f.metti(sfe(r, 4, 2), figura.materia === 'oro' || rimT === 'oro' ? oroM.chiaro : matRim.chiaro, p.x, p.y, 0.027, { s: [1, 1, 0.6] }, 'metallo')
  } else if (s.bordo === 'dentelli' || s.bordo === 'punte') {
    const punte = s.bordo === 'punte', nn = punte ? 16 : Math.round(nB * 0.7), h = punte ? 0.08 : 0.034, wd = punte ? 0.04 : 0.032
    for (const p of perimetro(outer, nn, 0.5)) {
      const ang = Math.atan2(p.ny, p.nx) - PIATTA
      f.metti(con(wd / 2, h, 4), punte ? oroM.medio : col, p.x + p.nx * (h / 2 - 0.006), p.y + p.ny * (h / 2 - 0.006), 0, { rz: ang, s: [1, 1, 0.55] }, punte ? 'oro' : 'metallo')
    }
  } else if (s.bordo === 'rune') {
    for (const p of perimetro(scalaPts(outer, (k + 1) / 2 + 0.002, cy), nB, 0.5)) {
      const ang = Math.atan2(p.ny, p.nx)
      f.metti(sca(0.013, 0.034, 0.012), el.colore === 0xffffff ? 0xc07cff : el.colore, p.x, p.y, 0.029, { rz: ang + PIATTA + (rnd(seme, Math.round(p.x * 100)) > 0.5 ? 0.5 : -0.5) }, 'viva')
    }
  }

  // la maniglia e la cinghia dietro
  f.metti(sca(0.05, 0.05, 0.05), 0x7a4a2a, 0, cy, -0.05)
  f.metti(sca(0.2, 0.03, 0.02), 0x4f2f1c, 0, cy + 0.1, -0.04)

  // ── l'elemento ──
  const alto = Math.max(...pts.map(p => p[1])), basso = Math.min(...pts.map(p => p[1]))
  const sup = perimetro(outer, 40, 0.5)
  if (figura.elemento === 'fuoco') {
    const baseY = alto + (s.top === 'picco' ? 0.04 : 0.0)
    const basi = [[-0.55 * dim, alto - 0.015, 0.02], [0, baseY - 0.005, 0.02], [0.55 * dim, alto - 0.015, 0.02]]
    if (s.forma === 'tondo') { basi[0] = [-0.7 * dim, alto * 0.75, 0.02]; basi[1] = [0, alto - 0.005, 0.02]; basi[2] = [0.7 * dim, alto * 0.75, 0.02] }
    an.push(fiamme(f, basi, { h: 0.075, r: 0.024, col: [0xff7a2a, 0xffd45a, 0xff3b1a] }))
    an.push(braci(f, 0xffb040, [-dim, cy - 0.1, 0.03], [2 * dim, 0.3, 0.05], { n: 5, vel: 0.4, r: 0.012, sale: 0.2 }))
  } else if (figura.elemento === 'ghiaccio') {
    sup.filter((_, i) => i % 5 === 1).forEach((p, i) => {
      const ang = Math.atan2(p.ny, p.nx) - PIATTA
      f.metti(cristallo(0.016 + 0.006 * rnd(seme, i), 0.1 + 0.05 * rnd(seme, i + 3), 5), el.colore2, p.x + p.nx * 0.03, p.y + p.ny * 0.03, 0.02, { rz: ang, s: [1, 1, 0.8] }, 'viva')
    })
    an.push(braci(f, 0xe6f8ff, [-dim, cy - 0.2, 0.03], [2 * dim, 0.5, 0.06], { n: 8, vel: 0.2, r: 0.01, sale: -0.15 }))
  } else if (figura.elemento === 'veleno') {
    sup.filter((_, i) => i % 6 === 2 && Math.sin(i) > -0.2).forEach(p => { if (p.ny < 0.2) f.metti(con(0.012, 0.045, 5), el.colore, p.x, p.y - 0.02, 0.01, { rx: Math.PI }, 'pieno') })
    an.push(braci(f, el.colore2, [-dim * 0.8, basso, 0.03], [dim * 1.6, 0.1, 0.06], { n: 6, vel: 0.3, r: 0.014, sale: -0.2, geo: () => sfe(1, 5, 4) }))
  } else if (figura.elemento === 'luce') {
    f.metti(poli(scalaPts(outer, 1.07, cy), 0.02, 0), el.colore, 0, 0, 0, {}, 'viva')
    for (const p of perimetro(outer, 10, 0.25)) f.metti(con(0.01, 0.045, 4), el.colore, p.x + p.nx * 0.03, p.y + p.ny * 0.03, 0, { rz: Math.atan2(p.ny, p.nx) - PIATTA, s: [1, 1, 0.5] }, 'viva')
    an.push(braci(f, el.colore2, [-dim, cy - 0.2, 0.04], [2 * dim, 0.5, 0.06], { n: 6, vel: 0.3, r: 0.012, sale: 0.15 }))
  } else if (figura.elemento === 'ombra') {
    an.push(braci(f, 0x6a3a9a, [-dim * 0.8, basso, 0.0], [dim * 1.6, 0.1, 0.1], { n: 7, vel: 0.22, r: 0.04, sale: 0.4, geo: () => ico(1, 0) }))
    an.push(braci(f, el.colore2, [-dim, cy - 0.2, 0.05], [2 * dim, 0.5, 0.05], { n: 4, vel: 0.5, r: 0.012, sale: 0.3 }))
  } else if (figura.elemento === 'arcano') {
    an.push(orbita(f, el.colore2, [0, cy, 0.11], dim * 0.8, { n: 3, vel: 1.3, r: 0.026, inc: 0.0 }))
    f.metti(poli(scalaPts(outer, 1.04, cy), 0.016, 0), el.ombra, 0, 0, 0, {}, 'viva')
  } else if (figura.elemento === 'natura') {
    sup.filter((_, i) => i % 5 === 3).forEach((p, i) => {
      const ang = Math.atan2(p.ny, p.nx)
      f.metti(ott(0.026), 0x3fa84a, p.x + p.nx * 0.012, p.y + p.ny * 0.012, 0.02, { rz: ang, s: [1.6, 0.6, 0.4] }, 'pieno')
      f.metti(ott(0.018), 0x7fd070, p.x + p.nx * 0.02, p.y + p.ny * 0.02 + 0.01, 0.03, { rz: ang + 0.8, s: [1.5, 0.6, 0.4] }, 'pieno')
    })
    an.push(braci(f, 0xb8f090, [-dim, cy - 0.2, 0.04], [2 * dim, 0.5, 0.06], { n: 5, vel: 0.2, r: 0.012, sale: 0.1 }))
  } else if (figura.elemento === 'sangue') {
    sup.filter((_, i) => i % 7 === 3).forEach(p => f.metti(ott(0.024), el.gemma, p.x, p.y, 0.03, { s: [1, 1.3, 0.7] }, 'viva'))
    an.push(braci(f, el.colore, [-dim * 0.8, basso + 0.05, 0.03], [dim * 1.6, 0.05, 0.05], { n: 5, vel: 0.3, r: 0.014, sale: -0.2, geo: () => sfe(1, 5, 4) }))
  } else if (figura.elemento === 'morte') {
    an.push(braci(f, el.colore, [-dim * 0.8, basso, 0.03], [dim * 1.6, 0.1, 0.08], { n: 6, vel: 0.22, r: 0.03, sale: 0.4, geo: () => ico(1, 0) }))
  } else if (figura.elemento === 'oro') {
    for (const p of perimetro(outer, 4, 0.125)) f.metti(ott(0.026), oroM.chiaro, p.x, p.y, 0.03, { s: [1, 1.3, 0.6], rz: Math.atan2(p.ny, p.nx) }, 'oro')
    an.push(braci(f, el.colore2, [-dim, cy - 0.2, 0.05], [2 * dim, 0.5, 0.06], { n: 6, vel: 0.3, r: 0.012, sale: 0.1 }))
  }
  // il leone fiammeggiante
  if (ctx.fiamme) an.push(fiamme(f, ctx.fiamme.map(p => [p[0], p[1], p[2]]), { h: 0.06, r: 0.014, col: [0xffd23a, 0xff9a2a] }))
  // le gemme del pregio
  const gemme = pregio.ornamenti
  for (let i = 0; i < gemme; i++) {
    const x = (i - (gemme - 1) / 2) * 0.12
    const [lo, hi] = spanY(outer, x)
    f.metti(ott(0.022), el.gemma, x, hi - 0.045 - Math.abs(x) * 0.1, 0.036, { s: [1, 1.3, 0.7] }, 'viva')
  }
  if (pregio.bagliore >= 0.7 && figura.elemento !== 'nessuno' && figura.elemento !== 'luce' && figura.elemento !== 'arcano') {
    f.metti(poli(scalaPts(outer, 1.045, cy), 0.014, 0), el.colore, 0, 0, 0, {}, 'viva')
  }

  const g = f.chiudi(OFF)
  g.traverse(o => { if (o.isMesh) o.receiveShadow = false })   // niente ombre sul rilievo: gli strati sottili le sfrangiano
  g.userData.famiglia = 'scudo'; g.userData.tipo = 'scudo'; g.userData.figura = figura.id
  const fase = (seme % 628) / 100
  g.userData.anima = anima(respira(g, 2 + (seme % 5) * 0.2, 0.35 * (0.5 + pregio.bagliore), 1.15, fase), ...an)
  return g
}
void [TIPO_RIM, scaglia, gruppo, sfe, toro, cil, con, ico, ott, sca]

// La roba in 3D, famiglia «bastoni e archi»: 57 bastoni/scettri (`bastone-*`) e 7 archi (`arco-*`), un modello per figura.
// Ogni `cosa` ha la sua forma-base parametrica (fusto, testa, sostegno della gemma); la figura la declina con la tabella `SPEC`
// (scritta guardando la descrizione), la materia (palette.js), l'elemento (gemma, luce, effetti) e il pregio (collari, bagliore).
// Bastoni e scettri: origine nel pugno, testa verso +y. Archi: verticali, pancione verso +z, corda dietro, impugnatura all'origine.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { Fucina, sca, cil, con, sfe, ott, ico, poli, cristallo, PIATTA, anima, respira, fiamme, braci, orbita, lampo, pulsaLibero } from '../armi-3d/fucina.js'
import { MATERIE, ELEMENTI, PREGIO } from './palette.js'

export const ARCHETIPI = [
  'bastone con sfera', 'bastone con gemma', 'bastone con cristallo', 'bastone con cristalli', 'bastone con corona di cristallo', 'bastone con falce',
  'bastone a mezzaluna', 'bastone con anello', 'bastone ad anello', 'bastone con disco', 'bastone con medaglione', 'bastone a stella', 'bastone con stella',
  'bastone a tridente', 'bastone a tridente di cristallo', 'bastone nodoso', 'bastone a foglia', 'bastone con sfera nera', 'bastone con sfera spenta',
  'bastone con gemma stellata', 'scettro con sfera', 'scettro con gemma', 'scettro con cristallo', 'scettro con foglia', 'scettro con losanga',
  'arco corto', 'arco lungo', 'arco composito', 'arco elfico', 'balestra'
]

// ── colori e metalli di testa ──
const LEG = 0x9a6a36, LEG_S = 0x6e4a26, LEG_C = 0xc9955a, NERO = 0x2a2630, V_S = 0x4a2a6a, V_M = 0x7a4aa8, BLU_N = 0x1e2a5a, CREMA = 0xf1e6c8, OSSO = 0xe0d3b4
const ORO = 0xf4c542, ORO_S = 0xc8922a, ARG = 0xdfe6ee, ARG_S = 0xa8b4c2, RAME = 0xc86a3a, CUOIO = 0x7a4a2a, CUOIO_S = 0x4f2f1c
const METALLI = {
  oro: [ORO, ORO_S, 'oro'], argento: [ARG, ARG_S, 'metallo'], ferro: [0x7c828a, 0x555a62, 'metallo'], scuro: [0x4a4650, 0x2e2a34, 'metallo'],
  legno: [0x8a5a2a, LEG_S, 'pieno'], legnoS: [LEG_S, 0x4a3018, 'pieno'], viola: [0x6a3a9a, V_S, 'pieno'], prugna: [0x6a2a5a, 0x3e1a38, 'pieno'],
  osso: [OSSO, 0xb8a784, 'pieno'], bianco: [0xf2f2f2, 0xc8ccd4, 'metallo'], cristallo: [0xbfe8ff, 0x8fc8ee, 'pieno'], verde: [0x58c860, 0x2a6a30, 'pieno'],
  arancio: [0xe0a040, 0xa8701c, 'oro'], azzurro: [0xcfe6ff, 0x8fb8e0, 'metallo'], perla: [0xe8e0d0, 0xb8b0a0, 'pieno']
}
const met = m => { const a = typeof m === 'number' ? [m, mix(m, 0, 0.35), 'pieno'] : METALLI[m || 'oro']; return { c: a[0], s: a[1], t: a[2] } }
const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t).getHex()
const chiaro = (a, t = 0.4) => mix(a, 0xffffff, t)
const scuro = (a, t = 0.4) => mix(a, 0x000000, t)

// il seme: una funzione pura dell'id
function semino (id) {
  let h = 2166136261
  for (const ch of id) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) }
  let s = h >>> 0
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/** Unisce più geometrie [[geo, x, y, z, {rx,ry,rz,s}]] in una sola (per i pezzi liberi con forma composta). */
function uni (lista) {
  const gs = lista.map(([g, x = 0, y = 0, z = 0, o = {}]) => {
    const n = g.index ? g.toNonIndexed() : g.clone()
    n.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, o.ry || 0, o.rz || 0)), new THREE.Vector3(...(o.s || [1, 1, 1]))))
    for (const k of Object.keys(n.attributes)) if (k !== 'position' && k !== 'normal') n.deleteAttribute(k)
    g.dispose(); return n
  })
  return mergeGeometries(gs)
}
const tor = (R, r, seg = 5, n = 14, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, seg, n, arc)

// ═════════════════════════ la tabella: una riga per figura ═════════════════════════
// L lunghezza; fu stile del fusto (dritto, torto, sinuoso, spirale, nodoso, ossa, spina); fc/fc2 colori; ft tipo materiale del fusto;
// dec decorazioni; dc colore decorazioni; h testa (sostegno); c nucleo; m metallo della testa; g colore gemma; R raggio del nucleo
const SPEC = {
  'bastone-01': { L: 0.6, dec: ['anelli'], h: 'anello', c: 'sfera', m: 'oro', R: 0.06, corona: 1, g: 0x8fd0ff },
  'bastone-02': { fu: 'spirale', fc2: LEG_S, h: 'coppa', c: 'sfera', m: 'legno', punte: 1, R: 0.085 },
  'bastone-03': { fu: 'dritto', fc: LEG_C, h: 'coppa', c: 'sfera', m: 'legno', R: 0.09, n: 5 },
  'bastone-04': { fu: 'sinuoso', fc: V_S, h: 'gancio', c: 'sfera', m: 'viola', R: 0.08, g: 0xa04ae0 },
  'bastone-05': { fu: 'nodoso', fc: LEG_S, dec: ['fasciaOro'], h: 'punte', c: 'sfera', m: 'scuro', R: 0.09, g: 0xff5a22 },
  'bastone-06': { fu: 'dritto', h: 'forchetta', c: 'cristallo', m: 'legno', R: 0.09 },
  'bastone-07': { fu: 'nodoso', fc: 0x4a484e, h: 'artigli', c: 'sfera', m: 'oro', R: 0.085, n: 4 },
  'bastone-08': { fu: 'spirale', fc: V_S, fc2: 0x6a3a9a, h: 'cornice', c: 'fiamma', m: 'viola', R: 0.07, g: 0xff7a22 },
  'bastone-09': { dec: ['anelli', 'collare'], h: 'corona', c: 'goccia', m: 'oro', R: 0.06, g: 0x9fe0ff },
  'bastone-10': { fu: 'sinuoso', fc: ARG, ft: 'metallo', h: 'ali', c: 'sfera', m: 'oro', anello: 1, R: 0.085, g: 0x2a46c8, alic: ORO },
  'bastone-11': { fu: 'spirale', fc2: LEG_S, h: 'artigli', cl: 'cristallo', c: 'sfera', m: 'cristallo', R: 0.075, n: 4, g: 0x3a4a7a },
  'bastone-12': { fu: 'dritto', dec: ['filo'], dc: ORO, h: 'anello', c: 'sfera', m: 'oro', R: 0.075, grande: 1, g: 0xff8a2a },
  'bastone-13': { fc: LEG, dec: ['fregiOro'], h: 'corna', c: 'goccia', m: 'azzurro', R: 0.05, g: 0x58e070 },
  'bastone-14': { L: 1.35, fu: 'storto', fc: LEG_S, h: 'gancio', c: 'sfera', m: 'oro', R: 0.055, g: 0x9a4ae0 },
  'bastone-15': { dec: ['foglie'], h: 'mezzaluna', c: 'nulla', m: 'cristallo', R: 0.13 },
  'bastone-16': { fu: 'nodoso', h: 'mezzaluna', c: 'sfera', m: 'legnoS', R: 0.08, g: 0x4ab8f0 },
  'bastone-17': { fu: 'torto', fc: LEG_S, h: 'anello', aperto: 1, c: 'cristallo', m: 'oro', R: 0.06, g: 0xf0fbff },
  'bastone-18': { dec: ['anelli', 'pomello'], h: 'fascio', m: 'cristallo', R: 0.1, g: 0x7fcfff },
  'bastone-19': { L: 0.6, dec: ['anelli'], h: 'ali', c: 'cristallo', m: 'oro', R: 0.06, alic: V_S, g: 0x8fc8ff, rami: 1 },
  'bastone-20': { dec: ['fregiOro'], h: 'anello', raggi: 1, c: 'ott', m: 'bianco', R: 0.07, g: 0xa04aff },
  'bastone-21': { L: 0.62, dec: ['filo'], dc: 0xc8202a, h: 'ali', c: 'ott', m: 'oro', R: 0.06, g: 0xff5a7a, alic: ORO },
  'bastone-22': { L: 0.56, dec: ['traversa'], h: 'foglia', m: 'verde', R: 0.1, rami: 1 },
  'bastone-23': { L: 0.56, h: 'losanga', m: 'oro', c: 'ott', R: 0.04, g: 0xffcc3a, anelloc: 0xe08a3a },
  'bastone-24': { h: 'stella', stella: 8, c: 'ott', m: 'argento', R: 0.05, g: 0x58b4ff },
  'bastone-25': { dec: ['nodoOro'], h: 'anello', raggi: 1, c: 'nulla', m: 'oro', R: 0.11 },
  'bastone-26': { fu: 'sinuoso', fc: NERO, dec: ['catene'], h: 'artigli', c: 'cristallo', m: 'oro', R: 0.065, n: 4 },
  'bastone-27': { fc: 0x6a86c0, ft: 'metallo', h: 'tridente', m: 'cristallo', R: 0.1 },
  'bastone-28': { L: 0.56, h: 'cornice', c: 'ott', m: 'oro', R: 0.05, g: 0x58d870, piccola: 0xe03a3a },
  'bastone-29': { fc: NERO, dec: ['catene'], h: 'anello', c: 'ott', m: 'scuro', R: 0.075, g: 0xff8a22 },
  'bastone-30': { fc: 0x2a3a58, dec: ['rune'], h: 'cristalloCoroncina', c: 'cristallo', m: 'oro', R: 0.06 },
  'bastone-31': { fc: NERO, dec: ['filo'], dc: ORO, h: 'lama', m: 'oro', R: 0.07 },
  'bastone-32': { fu: 'nodoso', fc: 0xd9a441, ft: 'oro', dec: ['filo'], dc: ORO, h: 'stella', stella: 4, c: 'ott', m: 'oro', R: 0.065, g: 0x2a3aa8 },
  'bastone-33': { L: 1.3, fc: RAME, h: 'anello', ganci: 1, c: 'sfera', m: 'oro', R: 0.1, g: 0xff7a1a },
  'bastone-34': { L: 1.4, fc: CREMA, h: 'raggiera', c: 'nulla', m: 'argento', R: 0.06, punt: 'argento' },
  'bastone-35': { L: 1.1, fc: LEG_C, dec: ['traversa'], h: 'cornice', c: 'ott', m: 'oro', R: 0.045, g: 0x58d870 },
  'bastone-36': { h: 'culla', c: 'occhio', m: 'oro', R: 0.075, g: 0x7fd0ff, punt: 0x9fd0e8 },
  'bastone-37': { fc: LEG_S, dec: ['traversa'], h: 'coppa', c: 'sfera', m: 'oro', R: 0.09, g: 0x44e060 },
  'bastone-38': { fu: 'nodoso', fc: LEG_S, h: 'nodoso', c: 'ott', R: 0.07, g: 0x3a7a2a },
  'bastone-39': { fu: 'ossa', fc: OSSO, h: 'anello', c: 'ott', m: 'bianco', R: 0.07, g: 0xe0182a },
  'bastone-40': { dec: ['croceArgento'], h: 'anello', c: 'ott', m: 'argento', R: 0.065, g: 0xb48af0 },
  'bastone-41': { fc: LEG, dec: ['collare'], h: 'anello', c: 'tonda', m: 'oro', R: 0.075, g: 0xe0242a },
  'bastone-42': { dec: ['fasce'], dc: 0x2f5fb0, h: 'medaglione', m: 'oro', R: 0.09 },
  'bastone-43': { dec: ['fasciaOro'], h: 'disco', disco: 0x5a4a6a, m: 'prugna', R: 0.11 },
  'bastone-44': { fc: LEG_C, h: 'anello', perline: 1, c: 'cristallo', m: 'azzurro', R: 0.07, g: 0x9fdcff },
  'bastone-45': { fc: CREMA, dec: ['segmenti'], dc: ORO, h: 'anello', perline: 1, c: 'spenta', m: 'perla', R: 0.075, g: 0x15131c },
  'bastone-46': { L: 0.5, fc: BLU_N, dec: ['rune'], h: 'castone', c: 'tonda', m: 'oro', R: 0.075, g: 0xe0182a, nodo: 1 },
  'bastone-47': { dec: ['punti'], h: 'ruota', c: 'spenta', m: 'oro', R: 0.075, g: 0x2a2630, punt: 'freccia' },
  'bastone-48': { L: 0.5, fc: V_S, dec: ['perle'], h: 'cornice', c: 'ott', m: 'argento', R: 0.05, g: 0x5a2a8a },
  'bastone-49': { fc: BLU_N, h: 'castone', foglie: 1, c: 'ott', m: 'oro', R: 0.075, g: 0x3ab0e0, punt: 'argento' },
  'bastone-50': { fc: LEG_S, dec: ['ramoscelli'], h: 'anello', c: 'ott', m: 'bianco', R: 0.07, g: 0x4a1a7a, oroRing: 1 },
  'bastone-51': { fc: 0xa8743a, dec: ['fasciaOro'], h: 'anello', c: 'ott', m: 'arancio', R: 0.07, g: 0x3ad0b0 },
  'bastone-52': { fc: LEG_S, dec: ['ramoscelli'], h: 'anello', c: 'nulla', m: 'oro', R: 0.11 },
  'bastone-53': { fc: ORO, ft: 'oro', dec: ['viticci', 'foglieOro'], h: 'anello', c: 'nulla', m: 'oro', R: 0.11 },
  'bastone-54': { L: 0.56, fu: 'nodoso', fc: ARG, ft: 'metallo', h: 'castone', c: 'ott', m: 'argento', R: 0.07, g: 0xb78af0 },
  'bastone-55': { fc: 0xe8b83a, ft: 'oro', dec: ['nodoOro'], h: 'anello', c: 'nulla', m: 'oro', R: 0.1 },
  'bastone-56': { fc: NERO, dec: ['filo'], dc: ORO, h: 'disco', disco: 0x6a4a2e, stellina: 1, m: 'oro', R: 0.1 },
  'bastone-57': { L: 1.3, fu: 'spina', fc: ORO, ft: 'oro', h: 'foglia', m: 'oro', R: 0.1, c: 'ott', g: 0xffb21a, piuma: 1 }
}

// ═════════════════════════ il fusto ═════════════════════════
function percorso (S, rng) {
  const ph = rng() * 6.28, A = { torto: 0.035, sinuoso: 0.05, storto: 0.07, nodoso: 0.012, ossa: 0.02 }[S.fu] || 0
  const fr = { torto: 4.2, sinuoso: 2.4, storto: 3, nodoso: 6, ossa: 9 }[S.fu] || 1
  return t => { const w = Math.sin(Math.PI * Math.min(1, t * 1.02)) ** 0.6; return [A * Math.sin(t * fr + ph) * w, A * 0.7 * Math.sin(t * fr * 0.8 + ph * 2) * w] }
}
function elica (f, y0, y1, ctr, rad, giri, steps, off, r, col, tipo, seg = 5) {
  const pts = []
  for (let i = 0; i <= steps; i++) { const t = i / steps, a = off + t * giri * Math.PI * 2, [ox, oz] = ctr(t); pts.push([ox + Math.cos(a) * rad, y0 + (y1 - y0) * t, oz + Math.sin(a) * rad]) }
  f.fila(pts, r, r, col, tipo, seg)
}
function fusto (f, S, rng, y0, y1, ctr) {
  const fc = S.fc ?? LEG, ft = S.ft || 'pieno', n = 8, th = S.fine ? 0.7 : 1
  const pts = []
  for (let i = 0; i <= n; i++) { const t = i / n, [x, z] = ctr(t); pts.push([x, y0 + (y1 - y0) * t, z]) }
  const r1 = (S.fu === 'nodoso' ? 0.034 : 0.026) * th * (S.L < 0.8 ? 0.8 : 1), r2 = (S.fu === 'nodoso' ? 0.024 : 0.019) * th * (S.L < 0.8 ? 0.8 : 1)
  if (S.fu === 'spirale') {
    f.fila(pts, 0.016 * th, 0.012 * th, fc, ft, 5)
    elica(f, y0, y1 - 0.02, ctr, 0.024, 2.4, 16, 0, 0.012, S.fc2 ?? scuro(fc, 0.3), ft, 5)
    elica(f, y0, y1 - 0.02, ctr, 0.024, 2.4, 16, Math.PI, 0.012, fc, ft, 5)
  } else if (S.fu === 'ossa') {
    for (let i = 0; i < n; i++) f.asta(pts[i], pts[i + 1], r1 * (0.8 + 0.3 * rng()), r2 * 0.9, i % 2 ? OSSO : 0xcdbf98, 'pieno', 5)
    for (let i = 1; i < n; i++) f.metti(ico(0.034, 0), i % 2 ? 0xf4ead2 : OSSO, pts[i][0], pts[i][1], pts[i][2], { s: [1, 0.8, 1] })
    for (let i = 0; i < 3; i++) { const j = 2 + i * 2, a = rng() * 6.28; f.asta(pts[j], [pts[j][0] + Math.cos(a) * 0.07, pts[j][1] + 0.05, pts[j][2] + Math.sin(a) * 0.07], 0.012, 0.005, 0xb8a784, 'pieno', 4) }
  } else if (S.fu === 'spina') {
    f.fila(pts, r1, r2, fc, ft, 6)
    for (let i = 1; i < 12; i++) { const t = i / 13, y = y0 + (y1 - y0) * t; for (const s of [-1, 1]) f.asta([0, y, 0], [s * 0.04, y + 0.06, 0], 0.008, 0.005, ORO_S, 'oro', 4) }
  } else {
    f.fila(pts, r1, r2, fc, ft, 6)
    if (S.fu === 'nodoso') {
      for (let i = 0; i < 4; i++) { const t = 0.12 + i * 0.22 + rng() * 0.05, [x, z] = ctr(t); f.metti(ico((0.04 + rng() * 0.02) * (S.L < 0.8 ? 0.55 : 1), 0), mix(fc, 0xffffff, 0.12), x + 0.01, y0 + (y1 - y0) * t, z, { s: [1, 0.85, 1] }) }
      for (let i = 0; i < 2; i++) { const t = 0.35 + i * 0.3, [x, z] = ctr(t), y = y0 + (y1 - y0) * t, a = rng() * 6.28; f.asta([x, y, z], [x + Math.cos(a) * 0.07, y + 0.07, z + Math.sin(a) * 0.07], 0.014, 0.005, fc, ft, 4) }
    }
  }
}
function presa (f, S, y1) {
  const h = S.L < 0.8 ? 0.11 : 0.18
  f.metti(cil(0.032, 0.032, h, 7), S.presac ?? CUOIO, 0, 0.0, 0)
  for (const y of [-h * 0.4, 0, h * 0.4]) f.metti(cil(0.036, 0.036, 0.012, 7), CUOIO_S, 0, y, 0)
}
function decora (f, S, rng, y0, y1, ctr, M) {
  const Y = t => y0 + (y1 - y0) * t, P = t => { const [x, z] = ctr(t); return [x, Y(t), z] }
  const dc = S.dc ?? ORO
  for (const d of S.dec || []) {
    if (d === 'anelli') for (const t of [0.2, 0.42, 0.65]) { const [x, y, z] = P(t); f.metti(cil(0.034, 0.034, 0.018, 8), ORO, x, y, z, {}, 'oro') }
    else if (d === 'fregiOro') for (const t of [0.3, 0.55, 0.8]) { const [x, y, z] = P(t); f.metti(cil(0.033, 0.033, 0.012, 8), ORO, x, y, z, {}, 'oro'); f.metti(ott(0.022), ORO_S, x, y + 0.03, z, { s: [1, 1.4, 1] }, 'oro') }
    else if (d === 'fasciaOro' || d === 'fasce') for (const t of [0.35, 0.5]) { const [x, y, z] = P(t); f.metti(cil(0.033, 0.033, 0.03, 8), dc, x, y, z, {}, d === 'fasciaOro' ? 'oro' : 'pieno') }
    else if (d === 'filo') elica(f, y0 + 0.1, y1 - 0.03, ctr, 0.03, 4, 16, 0.5, 0.006, dc, dc === ORO ? 'oro' : 'pieno', 4)
    else if (d === 'catene') { for (let i = 0; i < 22; i++) { const t = 0.08 + i / 22 * 0.85, a = i * 0.9, [x, y, z] = P(t); f.metti(sca(0.026, 0.026, 0.01), 0x6a6e76, x + Math.cos(a) * 0.03, y, z + Math.sin(a) * 0.03, { ry: -a, rz: i % 2 ? 0.7 : -0.7 }, 'metallo') } }
    else if (d === 'rune') { for (let i = 0; i < 12; i++) { const t = 0.1 + i / 12 * 0.8, a = i * 0.9, [x, y, z] = P(t); f.metti(sca(0.016, 0.03, 0.01), ORO, x + Math.cos(a) * 0.03, y, z + Math.sin(a) * 0.03, { ry: -a }, 'oro') } }
    else if (d === 'traversa') { const [x, y, z] = P(0.78); f.metti(sca(0.16, 0.018, 0.018), ORO, x, y, z, {}, 'oro'); for (const s of [-1, 1]) f.metti(ott(0.016), ORO_S, x + s * 0.08, y, z, {}, 'oro') }
    else if (d === 'croceArgento') { const [x, y, z] = P(0.82); f.metti(sca(0.015, 0.1, 0.015), ARG, x, y, z, {}, 'metallo'); f.metti(sca(0.08, 0.015, 0.015), ARG, x, y + 0.02, z, {}, 'metallo') }
    else if (d === 'collare') { const [x, y, z] = P(0.97); f.metti(cil(0.05, 0.034, 0.05, 8), ORO, x, y, z, {}, 'oro') }
    else if (d === 'pomello') f.metti(sfe(0.04, 7, 5), ORO, 0, y0, 0, {}, 'oro')
    else if (d === 'nodoOro') { const [x, y, z] = P(0.82); f.metti(sfe(0.04, 7, 5), ORO, x, y, z, { s: [1, 1.2, 1] }, 'oro'); f.metti(tor(0.04, 0.008, 4, 10), ORO_S, x, y, z, { rx: PIATTA }, 'oro') }
    else if (d === 'foglie' || d === 'foglieOro') for (let i = 0; i < 5; i++) { const t = 0.3 + i * 0.12, [x, y, z] = P(t), s = i % 2 ? 1 : -1; f.metti(ico(0.03, 0), d === 'foglie' ? (i % 2 ? 0x4aa84a : 0x6ac860) : ORO, x + s * 0.045, y, z, { s: [1.5, 0.5, 0.8], rz: s * 0.5 }, d === 'foglie' ? 'pieno' : 'oro') }
    else if (d === 'segmenti') for (let i = 0; i < 6; i++) { const [x, y, z] = P(0.1 + i * 0.14); f.metti(cil(0.03, 0.03, 0.05, 8), i % 2 ? dc : 0xd8c8a0, x, y, z, {}, i % 2 ? 'oro' : 'pieno') }
    else if (d === 'punti') for (let i = 0; i < 14; i++) { const t = 0.1 + i / 14 * 0.8, a = i * 2.1, [x, y, z] = P(t); f.metti(sfe(0.01, 4, 3), ORO, x + Math.cos(a) * 0.026, y, z + Math.sin(a) * 0.026, {}, 'oro') }
    else if (d === 'perle') for (let i = 0; i < 6; i++) { const [x, y, z] = P(0.2 + i * 0.12); f.metti(sfe(0.02, 6, 4), i % 2 ? 0xf4ecff : 0xb78af0, x, y, z, { s: [1, 0.8, 1] }) }
    else if (d === 'ramoscelli') for (let i = 0; i < 4; i++) { const [x, y, z] = P(0.3 + i * 0.15), a = i * 2.4; f.asta([x, y, z], [x + Math.cos(a) * 0.08, y + 0.06, z + Math.sin(a) * 0.08], 0.01, 0.004, ORO, 'oro', 4); f.metti(ott(0.013), ORO, x + Math.cos(a) * 0.08, y + 0.06, z + Math.sin(a) * 0.08, {}, 'oro') }
    else if (d === 'viticci') for (let i = 0; i < 3; i++) { const [x, y, z] = P(0.3 + i * 0.2), s = i % 2 ? 1 : -1; f.fila([[x, y, z], [x + s * 0.06, y + 0.03, z], [x + s * 0.08, y + 0.08, z], [x + s * 0.05, y + 0.1, z]], 0.008, 0.005, ORO, 'oro', 4) }
  }
}

// ═════════════════════════ i nuclei (le gemme) e i sostegni ═════════════════════════
/** Il nucleo luminoso: un pezzo libero col suo materiale (pulsa e galleggia da solo). Torna la funzione d'animazione. */
function nucleo (f, S, G, c, R) {
  const forme = {
    sfera: () => ico(R, 1), tonda: () => ico(R, 1), ott: () => uni([[ott(R * 1.15), 0, 0, 0, { s: [1, 1.35, 1] }]]), cristallo: () => cristallo(R * 0.75, R * 3, 6),
    goccia: () => uni([[sfe(R * 0.85, 8, 6), 0, -R * 0.3, 0], [con(R * 0.85, R * 1.5, 8), 0, R * 0.95, 0]]),
    fiamma: () => uni([[con(R * 1.05, R * 2.6, 6), 0, 0.1 * R, 0, { s: [1, 1, 0.5] }], [con(R * 0.6, R * 1.5, 5), R * 0.8, -R * 0.4, 0, { rz: -0.5, s: [1, 1, 0.5] }], [con(R * 0.6, R * 1.5, 5), -R * 0.8, -R * 0.4, 0, { rz: 0.5, s: [1, 1, 0.5] }]]),
    occhio: () => uni([[sfe(R, 10, 7)], [sfe(R * 0.42, 6, 5), 0, 0, R * 0.78, { s: [1, 1.3, 0.6] }]])
  }
  if (S.c === 'nulla' || !forme[S.c]) return () => {}
  const spenta = S.c === 'spenta'
  const m = f.libero(forme[S.c](), G, c[0], c[1], c[2], spenta ? 0.15 : 1.3)
  if (spenta) { m.material.color.setHex(0x1a1722); m.material.emissive.setHex(0x1a1722) }
  if (S.c === 'occhio') { const p = new THREE.Mesh(new THREE.SphereGeometry(R * 0.26, 6, 5), new THREE.MeshStandardMaterial({ color: 0x0c1a2a, roughness: 0.3, flatShading: true })); p.position.set(0, 0, R * 0.95); p.scale.set(1, 1.5, 0.5); m.add(p) }
  if (S.c === 'cristallo') m.scale.setScalar(1)
  const fase = c[1] * 7, pulso = pulsaLibero(m, 2.6, spenta ? 0 : 0.04, fase)
  return t => { if (!spenta) pulso(t); m.position.y = c[1] + 0.012 * Math.sin(t * 1.7 + fase); m.rotation.y = t * 0.5 }
}

/** I sostegni intorno al nucleo in c = [0, cy, 0], raggio R; `top` è la cima del fusto. */
function testa (f, S, rng, top, cy, R, M, G, anims) {
  const { c: mc, s: ms, t: mt } = M
  const pezzo = (geo, col, x, y, z, o, tipo) => f.metti(geo, col, x, y, z, o || {}, tipo || mt)
  const zampa = (pts, r1, r2, col = mc, tipo = mt, seg = 5) => f.fila(pts, r1, r2, col, tipo, seg)
  const base = () => pezzo(cil(0.03, 0.026, 0.035, 8), mc, 0, top + 0.012, 0)
  const H = S.h
  if (H === 'coppa' || H === 'artigli' || H === 'castone') {
    const n = S.n || (H === 'castone' ? 4 : 5), alto = H === 'castone' ? 0.1 : H === 'artigli' ? 0.9 : 0.8
    base()
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.283 + 0.4, ca = Math.cos(a), sa = Math.sin(a), colo = H === 'artigli' && S.cl === 'cristallo' ? 0xbfe8ff : mc
      zampa([[ca * 0.025, top, sa * 0.025], [ca * R * 0.95, cy - R * 0.7, sa * R * 0.95], [ca * R * 1.18, cy - R * 0.1, sa * R * 1.18], [ca * R * 0.95, cy + R * (alto + 0.2), sa * R * 0.95]], H === 'coppa' ? 0.018 : 0.015, 0.006, colo, colo === 0xbfe8ff ? 'pieno' : mt)
      if (H !== 'coppa') pezzo(con(0.014, 0.05, 4), colo, ca * R * 0.9, cy + R * (alto + 0.35), sa * R * 0.9, { rz: -ca * 0.5, rx: sa * 0.5 }, colo === 0xbfe8ff ? 'pieno' : mt)
    }
    if (H === 'castone') pezzo(tor(R * 1.1, 0.012, 4, 12), mc, 0, cy - R * 0.5, 0, { rx: PIATTA })
    if (S.punte) for (const s of [-1, 1]) pezzo(con(0.02, 0.09, 4), ms, s * (R + 0.04), cy + R * 0.1, 0, { rz: -s * 1.2 })
    if (S.foglie) for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.8; pezzo(ico(0.028, 0), 0x58a84a, Math.cos(a) * R * 1.35, cy - R * 0.9, Math.sin(a) * R * 1.35, { s: [1.6, 0.4, 0.8], rz: 0.4 }, 'pieno') }
  } else if (H === 'anello') {
    const RR = R * (S.grande ? 1.7 : 1.45), arc = S.aperto ? 5.4 : 6.283
    pezzo(cil(0.022, 0.026, Math.max(0.02, cy - RR - top + 0.02), 6), mc, 0, (top + cy - RR) / 2, 0)
    pezzo(tor(RR, S.perline ? 0.016 : 0.022, 5, 18, arc), mc, 0, cy, 0, { rz: S.aperto ? -Math.PI / 2 - arc / 2 : 0 })
    if (S.oroRing) pezzo(tor(RR * 0.8, 0.012, 4, 14), ORO, 0, cy, 0, {}, 'oro')
    if (S.perline) for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; pezzo(sfe(0.02, 5, 4), i % 2 ? (S.c === 'spenta' ? 0xf4ecd8 : 0xffffff) : (S.c === 'spenta' ? 0xd8c8a8 : 0x58b4e6), Math.cos(a) * RR, cy + Math.sin(a) * RR, 0, {}, 'pieno') }
    if (S.raggi) for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; pezzo(con(0.016, i % 2 ? 0.07 : 0.1, 4), S.m === 'bianco' ? 0xfff2b0 : ORO, Math.cos(a) * (RR + 0.05), cy + Math.sin(a) * (RR + 0.05), 0, { rz: a - PIATTA }, 'oro') }
    if (S.corona) { for (let i = 0; i < 5; i++) { const x = (i - 2) * 0.026; pezzo(con(0.014, i % 2 ? 0.05 : 0.07, 4), ORO, x, cy + RR + 0.06 - Math.abs(i - 2) * 0.012, 0, {}, 'oro') } pezzo(cil(0.05, 0.05, 0.016, 8), ORO_S, 0, cy + RR + 0.01, 0, {}, 'oro') }
    if (S.ganci) for (const s of [-1, 1]) zampa([[s * RR, cy, 0], [s * (RR + 0.05), cy - 0.05, 0], [s * (RR + 0.02), cy - 0.12, 0]], 0.012, 0.006, mc)
    if (S.c === 'nulla') for (const [x, y] of [[0, RR], [RR, 0], [-RR, 0]]) pezzo(ott(0.022), ORO_S, x, cy + y, 0, {}, 'oro')
  } else if (H === 'gancio') {
    const s = 1
    zampa([[0, top, 0], [R * 1.25, cy - R * 0.5, 0], [R * 1.3, cy + R * 0.9, 0], [R * 0.45, cy + R * 1.7, 0], [-R * 0.2, cy + R * 1.45, 0], [-R * 0.3, cy + R * 0.8, 0]], 0.02, 0.009, mc)
    pezzo(con(0.016, 0.05, 4), mc, -R * 0.3, cy + R * 0.7, 0, { rz: Math.PI })
    base()
  } else if (H === 'punte') {
    base()
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + 0.3, up = i % 3 === 0 ? 0.9 : 0.3, v = new THREE.Vector3(Math.cos(a), up, Math.sin(a) * 0.9).normalize(); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v), e = new THREE.Euler().setFromQuaternion(q); pezzo(con(0.026, 0.12, 4), mc, v.x * (R + 0.04), cy + v.y * (R + 0.04), v.z * (R + 0.04), { rx: e.x, ry: e.y, rz: e.z }) }
  } else if (H === 'forchetta') {
    base()
    for (const s of [-1, 1]) { zampa([[0, top, 0], [s * R * 0.9, cy - R * 0.9, 0], [s * R * 1.1, cy + R * 0.3, 0], [s * R * 0.9, cy + R * 1.6, 0]], 0.022, 0.009, mc); pezzo(con(0.012, 0.045, 4), mc, s * R * 0.9, cy + R * 1.75, 0) }
  } else if (H === 'cornice') {
    base()
    pezzo(tor(R * 1.55, 0.016, 4, 4), mc, 0, cy, 0, { rz: Math.PI / 4 })
    pezzo(tor(R * 1.55, 0.016, 4, 4), ms, 0, cy, 0, { rz: Math.PI / 4, ry: PIATTA }, mt)
    pezzo(cil(0.02, 0.024, cy - R * 1.5 - top + 0.02, 6), mc, 0, (top + cy - R * 1.5) / 2, 0)
    for (const [x, y] of [[0, R * 1.6], [R * 1.6, 0], [-R * 1.6, 0], [0, -R * 1.6]]) pezzo(ott(0.022), ms, x, cy + y, 0)
    if (S.piccola) { const m = f.libero(ott(0.028), S.piccola, 0, cy + R * 2.15, 0, 1.2); anims.push(t => { m.material.emissiveIntensity = 1.2 + 0.4 * Math.sin(t * 3 + 1) }) }
    if (S.stella) null
  } else if (H === 'culla') {
    base()
    pezzo(tor(R * 1.45, 0.022, 5, 14, Math.PI * 1.3), mc, 0, cy - R * 0.1, 0, { rz: -Math.PI / 2 - Math.PI * 0.65 })
    for (const s of [-1, 1]) pezzo(con(0.016, 0.07, 4), mc, s * R * 1.5, cy + R * 0.55, 0, { rz: -s * 0.4 })
    pezzo(cil(0.02, 0.026, 0.06, 6), mc, 0, cy - R * 1.5, 0)
  } else if (H === 'corna') {
    base()
    for (const s of [-1, 1]) zampa([[s * 0.02, top, 0], [s * R * 1.6, top + 0.06, 0], [s * R * 2.4, cy + R * 0.4, 0], [s * R * 2.0, cy + R * 2.3, 0], [s * R * 1.5, cy + R * 3.0, 0]], 0.028, 0.006, mc, mt, 6)
    pezzo(sfe(0.03, 6, 5), ORO, 0, cy - R * 1.2, 0, {}, 'oro')
  } else if (H === 'mezzaluna') {
    const RR = R * (S.c === 'nulla' ? 1.4 : 1.35), arc = Math.PI * 1.25
    base()
    pezzo(tor(RR, S.c === 'nulla' ? 0.034 : 0.026, 5, 16, arc), mc, 0, cy - RR * 0.1, 0, { rz: -Math.PI / 2 - arc / 2, s: [1, 1, 1.2] })
    for (const s of [-1, 1]) { const a = -Math.PI / 2 + s * arc / 2; pezzo(con(0.026, 0.09, 4), mc, Math.cos(a) * RR, cy - RR * 0.1 + Math.sin(a) * RR + 0.025, 0, { rz: -s * 0.45 }) }
    pezzo(cil(0.02, 0.024, cy - RR * 1.1 - top + 0.02, 6), mc, 0, (top + cy - RR * 1.1) / 2, 0)
  } else if (H === 'corona' || H === 'cristalloCoroncina') {
    base()
    const n = H === 'corona' ? 8 : 5
    for (let i = 0; i < n; i++) { const a = i / n * 6.283, ca = Math.cos(a), sa = Math.sin(a), alto = (i % 2 ? 0.1 : 0.14); const m = cristallo(0.022, alto, 5); pezzo(m, 0xbfe8ff, ca * R * 0.95, cy + R * 0.15 + alto * 0.1, sa * R * 0.95, { rz: -ca * 0.5, rx: sa * 0.5 }, 'viva') }
    pezzo(tor(R * 0.9, 0.015, 4, 12), mc, 0, cy - R * 0.5, 0, { rx: PIATTA })
    if (H === 'cristalloCoroncina') for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; pezzo(con(0.014, 0.05, 4), ORO, Math.cos(a) * R * 0.85, cy - R * 0.1, Math.sin(a) * R * 0.85, {}, 'oro') }
  } else if (H === 'ali') {
    base()
    const col = S.alic ?? ORO, tp = col === ORO ? 'oro' : 'pieno'
    const ala = poli([[0.02, 0], [0.09, 0.07], [0.18, 0.09], [0.15, 0.04], [0.23, 0.04], [0.17, -0.01], [0.2, -0.06], [0.1, -0.04], [0.03, -0.05]], 0.012, 0.002)
    for (const s of [-1, 1]) { pezzo(poli([[0.02, 0], [0.09, 0.07], [0.18, 0.09], [0.15, 0.04], [0.23, 0.04], [0.17, -0.01], [0.2, -0.06], [0.1, -0.04], [0.03, -0.05]], 0.012, 0.002), col, s * 0.01, cy - R * 1.4, 0, { s: [s, 1, 1], rz: s * 0.15 }, tp); if (S.rami) zampa([[s * 0.02, cy - R * 1.2, 0], [s * 0.16, cy - R * 0.3, 0], [s * 0.2, cy + R * 0.8, 0]], 0.012, 0.005, ORO, 'oro') }
    ala.dispose()
    pezzo(cil(0.024, 0.024, 0.05, 8), ORO, 0, cy - R * 1.3, 0, {}, 'oro')
    if (S.anello) pezzo(tor(R * 1.6, 0.012, 4, 18), 0xdfe6ee, 0, cy, 0, { rx: 1.1, rz: 0.3 }, 'metallo')
  } else if (H === 'fascio') {
    base()
    const cs = [[0, 0.3, 0, 0], [-0.3, 0.2, 0, 0.35], [0.3, 0.2, 0, -0.35], [-0.18, 0.2, 0.25, 0.2], [0.2, 0.16, -0.22, -0.25]]
    cs.forEach(([x, hh, z, tilt], i) => { const alto = 0.14 + hh * 0.5 + (i === 0 ? 0.08 : 0); pezzo(cristallo(0.03 - i * 0.002, alto, 6), i % 2 ? 0xbfe8ff : 0x7fd4ff, x * R * 1.4, top + 0.04 + alto * 0.45, z * R * 1.4, { rz: -tilt * 1.3, rx: z * 0.8 }, 'viva') })
  } else if (H === 'tridente') {
    base()
    pezzo(cristallo(0.03, 0.28, 5), 0xbfe8ff, 0, top + 0.16, 0, {}, 'viva')
    for (const s of [-1, 1]) { zampa([[s * 0.01, top, 0], [s * 0.1, top + 0.04, 0], [s * 0.13, top + 0.12, 0]], 0.02, 0.014, mc, 'metallo'); pezzo(cristallo(0.024, 0.2, 5), 0xa8e8ff, s * 0.13, top + 0.23, 0, { rz: -s * 0.08 }, 'viva') }
    pezzo(sfe(0.03, 6, 4), 0xdfe6ee, 0, top + 0.01, 0, {}, 'metallo')
  } else if (H === 'raggiera') {
    base()
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, lung = i % 2 ? 0.1 : 0.19; pezzo(con(0.014, lung, 4), mc, Math.cos(a) * (0.05 + lung / 2), cy + Math.sin(a) * (0.05 + lung / 2), 0, { rz: a - PIATTA }, 'metallo') }
    pezzo(sfe(0.05, 6, 5), ARG, 0, cy, 0, {}, 'metallo'); pezzo(tor(0.06, 0.01, 4, 12), ARG_S, 0, cy, 0, {}, 'metallo')
  } else if (H === 'stella') {
    base()
    const n = S.stella || 8
    for (let i = 0; i < n; i++) { const a = i / n * 6.283 + (n === 4 ? 0 : 0.2), lung = (n === 4 ? 0.22 : i % 2 ? 0.1 : 0.17); pezzo(con(0.02, lung, 4), mc, Math.cos(a) * (0.04 + lung / 2), cy + Math.sin(a) * (0.04 + lung / 2), 0, { rz: a - PIATTA }, mt) }
    pezzo(tor(0.062, 0.012, 4, 14), ms, 0, cy, 0, {}, mt)
  } else if (H === 'foglia') {
    base()
    const larg = S.piuma ? 0.12 : 0.1, alto = S.piuma ? 0.5 : 0.34, fcol = S.piuma ? ORO : 0x4aa84a, ftp = S.piuma ? 'oro' : 'pieno'
    const pf = [[0, 0], [0.07, 0.06], [larg, 0.15], [0.08, 0.26], [0.0, alto], [-0.08, 0.26], [-larg, 0.15], [-0.07, 0.06]]
    pezzo(poli(pf, 0.018, 0.003), fcol, 0, top + 0.02, 0, {}, ftp)
    pezzo(poli([[0, 0.02], [0.04, 0.1], [0.035, 0.22], [0, 0.3], [-0.035, 0.22], [-0.04, 0.1]], 0.024, 0.002), S.piuma ? 0xffe58a : 0x7fe070, 0, top + 0.02, 0, {}, ftp)
    f.asta([0, top + 0.02, 0.015], [0, top + alto + 0.02, 0.015], 0.008, 0.004, ORO, 'oro', 4)
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) f.asta([0, top + 0.07 + i * 0.07, 0.015], [s * 0.065, top + 0.13 + i * 0.07, 0.015], 0.005, 0.003, ORO, 'oro', 3)
    if (S.rami) for (const s of [-1, 1]) zampa([[s * 0.02, top, 0], [s * 0.12, top + 0.06, 0], [s * 0.14, top + 0.16, 0]], 0.01, 0.005, ORO, 'oro')
  } else if (H === 'losanga') {
    base()
    const cyy = top + 0.15
    pezzo(tor(0.13, 0.016, 4, 4), ORO, 0, cyy, 0, { rz: Math.PI / 4, s: [0.75, 1.1, 1] }, 'oro')
    pezzo(tor(0.09, 0.01, 4, 4), ORO_S, 0, cyy, 0, { rz: Math.PI / 4, s: [0.75, 1.1, 1] }, 'oro')
    pezzo(tor(0.034, 0.011, 4, 10), S.anelloc ?? 0xe08a3a, 0, top - 0.06, 0, { rx: 0.4 }, 'oro')
    pezzo(ott(0.026), ORO_S, 0, cyy + 0.145, 0, {}, 'oro')
  } else if (H === 'medaglione') {
    base()
    const cyy = top + 0.12
    pezzo(cil(R, R, 0.03, 14), 0x2f5fb0, 0, cyy, 0, { rx: PIATTA })
    pezzo(tor(R, 0.014, 4, 16), ORO, 0, cyy, 0.0, {}, 'oro')
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; pezzo(ott(0.022), ORO, Math.cos(a) * R * 0.62, cyy + Math.sin(a) * R * 0.62, 0.02, { s: [1, 1, 0.6] }, 'oro') }
    pezzo(sfe(0.024, 6, 5), 0xfff6c0, 0, cyy, 0.03, {}, 'luce')
  } else if (H === 'disco') {
    base()
    const cyy = top + 0.14
    pezzo(cil(R * 0.8, R * 0.8, 0.03, 16), S.disco, 0, cyy, 0, { rx: PIATTA }, 'pieno')
    pezzo(tor(R * 0.95, 0.024, 5, 18), mc, 0, cyy, 0, {}, mt)
    if (S.stellina) { for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; pezzo(con(0.014, 0.05, 4), 0xfff0c0, Math.cos(a) * 0.03, cyy + Math.sin(a) * 0.03, 0.02, { rz: a - PIATTA }, 'luce') } }
    else for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; pezzo(sfe(0.012, 4, 3), chiaro(S.disco, 0.4), Math.cos(a) * R * 0.5, cyy + Math.sin(a) * R * 0.5, 0.02) }
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; pezzo(ott(0.014), ms, Math.cos(a) * R * 0.95, cyy + Math.sin(a) * R * 0.95, 0, {}, mt) }
    f.userData = f.userData || {}; f.centro = [0, cyy, 0]
  } else if (H === 'ruota') {
    base()
    const cyy = cy
    pezzo(tor(R * 1.5, 0.018, 5, 18), mc, 0, cyy, 0, {}, mt)
    pezzo(tor(R * 0.95, 0.012, 4, 14), ms, 0, cyy, 0, {}, mt)
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; f.asta([Math.cos(a) * R * 0.5, cyy + Math.sin(a) * R * 0.5, 0], [Math.cos(a + 0.5) * R * 1.5, cyy + Math.sin(a + 0.5) * R * 1.5, 0], 0.008, 0.008, mc, mt, 4) }
  } else if (H === 'nodoso') {
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * 6.283 + 0.2, ca = Math.cos(a), sa = Math.sin(a), col = i % 2 ? 0x8a4a3a : LEG_S
      zampa([[ca * 0.02, top - 0.04, sa * 0.02], [ca * 0.1, top + 0.08, sa * 0.1], [ca * R * 1.3 + 0.03, cy - 0.01, sa * R * 1.3], [ca * R * 0.7, cy + R * 1.6, sa * R * 0.7]], 0.026, 0.008, col, 'pieno', 5)
    }
    for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.9; zampa([[Math.cos(a) * 0.02, top, Math.sin(a) * 0.02], [Math.cos(a) * 0.14, top + 0.02, Math.sin(a) * 0.14], [Math.cos(a) * 0.18, top - 0.1, Math.sin(a) * 0.18]], 0.012, 0.004, 0x9a4a3a, 'pieno', 4) }
  } else if (H === 'lama') {
    base()
    pezzo(cristallo(0.05, 0.52, 5), 0xd8e8f0, 0, top + 0.3, 0, {}, 'viva')
    pezzo(cristallo(0.022, 0.2, 5), 0xaee8ff, 0.08, top + 0.14, 0.02, { rz: -0.4 }, 'viva')
    pezzo(cristallo(0.018, 0.16, 5), 0xaee8ff, -0.07, top + 0.12, -0.02, { rz: 0.35 }, 'viva')
    for (const s of [-1, 1]) { zampa([[s * 0.02, top, 0], [s * 0.1, top + 0.05, 0], [s * 0.13, top + 0.2, 0], [s * 0.09, top + 0.3, 0]], 0.014, 0.005, ORO, 'oro'); pezzo(ott(0.016), ORO, s * 0.09, top + 0.31, 0, {}, 'oro') }
    const m = f.libero(ott(0.028), 0x7fd4ff, 0, top - 0.07, 0, 1.2); m.scale.set(1, 1.4, 1); anims.push(pulsaLibero(m, 3, 0.05, 1))
    f.centro = [0, top + 0.3, 0]
  }
}

// ═════════════════════════ gli elementi ═════════════════════════
function elemento (f, S, el, pre, c, R, anims) {
  const E = ELEMENTI[el], hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
  const cx = c[0], cy = c[1], n = 1 + pre
  if (el === 'fuoco') {
    const basi = Array.from({ length: Math.min(5, n) }, (_, i) => { const a = i / Math.min(5, n) * 6.283; return [cx + Math.cos(a) * R * 0.8, cy + R * 0.7, Math.sin(a) * R * 0.8] })
    anims.push(fiamme(f, basi, { h: (S.L < 0.8 ? 0.08 : 0.12) + 0.02 * pre, r: 0.03, col: [E.colore, E.colore2, 0xff3b1a] }))
    if (pre >= 3) anims.push(braci(f, 0xff5a1a, [cx - 0.1, cy, -0.06], [0.2, 0.1, 0.12], { n: 4, sale: 0.3, r: 0.014 }))
  } else if (el === 'ghiaccio') {
    for (let i = 0; i < 1 + pre; i++) { const a = i * 2.1 + 0.3; f.metti(cristallo(0.012, 0.08, 5), i % 2 ? 0xe6f8ff : 0xaee8ff, cx + Math.cos(a) * R * 1.9, cy - R * 0.4 + 0.04 * (i % 2), Math.sin(a) * R * 1.9, { rz: -Math.cos(a) * 0.7, rx: Math.sin(a) * 0.7 }, 'viva') }
    if (pre >= 2) anims.push(braci(f, 0xeaf8ff, [cx - 0.12, cy - 0.05, -0.08], [0.24, 0.2, 0.16], { n: 4, sale: -0.2, r: 0.011, vel: 0.35 }))
  } else if (el === 'fulmine') {
    anims.push(lampo(f, [cx + R * 0.4, cy + R * 0.4, 0.02], [cx + R * 2.2, cy + R * 1.3, 0.04], { n: 4, scarto: 0.03, seme: 3 }))
    if (pre >= 2) anims.push(lampo(f, [cx - R * 0.4, cy - R * 0.2, 0.02], [cx - R * 2.1, cy - R * 1.0, -0.03], { n: 4, scarto: 0.03, seme: 7, hex: E.colore2 }))
  } else if (el === 'veleno') {
    anims.push(braci(f, E.colore, [cx - 0.08, cy - R, -0.05], [0.16, 0.1, 0.1], { n: 3 + pre, sale: -0.22, r: 0.017, vel: 0.4, geo: () => sfe(1, 5, 4) }))
  } else if (el === 'luce') {
    anims.push(orbita(f, E.colore2, [cx, cy, 0], R * 2.1, { n: 2 + (pre > 2 ? 1 : 0), vel: 1.3, r: 0.02, inc: 0.4, geo: () => sfe(0.02, 5, 4) }))
    anims.push(braci(f, E.colore, [cx - 0.1, cy - 0.05, -0.05], [0.2, 0.15, 0.1], { n: 3, sale: 0.2, r: 0.012 }))
  } else if (el === 'ombra') {
    anims.push(braci(f, 0x6a3a9a, [cx - 0.08, cy - 0.05, -0.05], [0.16, 0.1, 0.1], { n: 3 + pre, sale: 0.36, r: 0.03, vel: 0.3, geo: () => ico(1, 0) }))
    anims.push(braci(f, 0xd08aff, [cx - 0.06, cy, -0.04], [0.12, 0.1, 0.08], { n: 2, sale: 0.3, r: 0.012, vel: 0.5 }))
  } else if (el === 'arcano') {
    anims.push(orbita(f, E.colore, [cx, cy, 0], R * 2.1, { n: 3, vel: 1.4, r: 0.026, inc: 0.5 }))
    if (pre >= 3) anims.push(orbita(f, E.colore2, [cx, cy, 0], R * 2.6, { n: 2, vel: -1.1, r: 0.02, inc: -0.6 }))
  } else if (el === 'natura') {
    for (let i = 0; i < 2 + (pre > 2 ? 1 : 0); i++) { const a = i * 2.4 + 1; f.metti(ico(0.03, 0), i % 2 ? 0x4aa84a : 0x6ac860, cx + Math.cos(a) * R * 1.8, cy - R * 0.6 + i * 0.03, Math.sin(a) * R * 1.8, { s: [1.6, 0.45, 0.9], rz: Math.cos(a) * 0.6, ry: a }, 'pieno') }
    anims.push(orbita(f, E.colore, [cx, cy, 0], R * 2.2, { n: 2, vel: 1.0, r: 0.02, inc: 0.2, geo: () => ico(0.02, 0) }))
  } else if (el === 'acqua') {
    anims.push(orbita(f, E.colore2, [cx, cy, 0], R * 2.0, { n: 3, vel: 1.5, r: 0.02, inc: 0.3, geo: () => sfe(0.02, 6, 4) }))
    if (pre >= 3) anims.push(braci(f, E.colore, [cx - 0.08, cy - R, -0.04], [0.16, 0.06, 0.08], { n: 3, sale: -0.2, r: 0.014, vel: 0.5, geo: () => sfe(1, 5, 4) }))
  } else if (el === 'oro') {
    anims.push(braci(f, 0xfff2b0, [cx - 0.12, cy - 0.12, -0.06], [0.24, 0.24, 0.12], { n: 4, sale: 0.12, r: 0.014, vel: 0.5 }))
  } else if (el === 'sangue') {
    anims.push(braci(f, 0xd01a2a, [cx - 0.06, cy - R, -0.03], [0.12, 0.05, 0.06], { n: 3, sale: -0.28, r: 0.016, vel: 0.45, geo: () => sfe(1, 5, 4) }))
  } else if (el === 'morte') {
    anims.push(braci(f, E.colore, [cx - 0.08, cy - 0.05, -0.05], [0.16, 0.1, 0.1], { n: 4, sale: 0.3, r: 0.02, vel: 0.35 }))
  }
}

// ═════════════════════════ i bastoni ═════════════════════════
function bastone (fig) {
  const S = SPEC[fig.id] || { h: 'coppa', c: 'sfera', m: 'oro', R: 0.08 }
  const rng = semino(fig.id), f = new Fucina()
  const mat = MATERIE[fig.materia] || MATERIE.legno, E = ELEMENTI[fig.elemento] || ELEMENTI.nessuno, pre = fig.pregio || 1
  S.L = S.L ?? 1.2; S.fc = S.fc ?? mat.medio; S.R = S.R ?? 0.08
  const scettro = S.L < 0.8, y0 = scettro ? -0.15 : -0.3, top = y0 + S.L - (scettro ? 0.1 : 0.15) + (rng() - 0.5) * 0.04
  const M = met(S.m), G = S.g ?? E.gemma, ctr = percorso(S, rng)
  const R = S.R, anims = []
  const [tx, tz] = ctr(1)
  fusto(f, S, rng, y0, top, ctr)
  presa(f, S, top)
  decora(f, S, rng, y0, top, ctr, M)
  // puntale
  if (S.punt === 'freccia') f.metti(con(0.03, 0.12, 4), ORO, 0, y0 - 0.05, 0, { rx: Math.PI }, 'oro')
  else if (S.punt) f.metti(con(0.026, 0.1, 6), typeof S.punt === 'string' ? ARG : S.punt, 0, y0 - 0.04, 0, { rx: Math.PI }, 'metallo')
  else f.metti(sfe(0.028, 6, 4), scuro(S.fc, 0.3), 0, y0 - 0.005, 0, {}, 'pieno')
  // altezza del centro del nucleo
  const rapp = { anello: 1.45 * (S.grande ? 1.2 : 1), coppa: 0.5, artigli: 0.5, castone: 0.6, gancio: 1.2, punte: 1, forchetta: 1.1, cornice: 1.7, culla: 1.6, corna: 1.4, mezzaluna: 1.5, corona: 1.0, cristalloCoroncina: 1.0, ali: 1.7, fascio: 1, tridente: 1, raggiera: 1.2, stella: 1.2, ruota: 1.6, nodoso: 1.4 }
  let cy = top + R * (rapp[S.h] ?? 1.2) + 0.05
  if (S.h === 'mezzaluna') cy = top + R * 1.6 + 0.06
  if (S.h === 'corna') cy = top + R * 1.9
  if (S.h === 'ali') cy = top + R * 1.9
  if (S.h === 'cornice') cy = top + R * 1.75
  if (S.h === 'anello') cy = top + R * (S.grande ? 2.1 : 1.8) + 0.04
  if (S.h === 'raggiera' || S.h === 'stella') cy = top + 0.14
  if (S.h === 'ruota') cy = top + R * 1.9 + 0.03
  if (S.h === 'culla') cy = top + R * 1.9
  if (S.h === 'nodoso') cy = top + R * 1.9
  if (S.h === 'foglia' && S.piuma) cy = top + 0.5
  const pos = [tx, cy, tz]
  f.centro = null
  testa(f, S, rng, top, cy, R, M, G, anims)
  const c = f.centro || pos
  if (['sfera', 'tonda', 'ott', 'cristallo', 'goccia', 'fiamma', 'occhio', 'spenta'].includes(S.c)) anims.push(nucleo(f, S, G, [c[0], c[1], c[2]], R))
  // il pregio: collare d'oro e bagliore
  if (pre >= 3 && !(S.dec || []).includes('collare') && !['disco', 'medaglione', 'losanga', 'foglia', 'lama', 'tridente', 'fascio'].includes(S.h)) {
    f.metti(cil(0.045, 0.032, 0.035, 8), ORO, 0, top - 0.02, 0, {}, 'oro'); f.metti(ott(0.02), E.gemma, 0.04, top - 0.02, 0.0, {}, 'viva')
  }
  if (pre >= 4) { const a = f.libero(tor(R * 2.6, 0.006, 4, 24), E.colore2, c[0], c[1], c[2], 0.9); a.rotation.x = 1.2; anims.push(t => { a.rotation.z = t * 0.8; a.rotation.x = 1.2 + 0.2 * Math.sin(t) }) }
  elemento(f, S, fig.elemento, pre, c, R, anims)
  const g = f.chiudi()
  g.userData.famiglia = 'staffa'; g.userData.tipo = 'bacchetta'; g.userData.figura = fig.id
  const luce = PREGIO[pre]?.bagliore ?? 0
  const resp = respira(g, 2.2 + rng(), 0.18 + 0.12 * luce, 0.85 + 0.2 * luce, rng() * 6)
  g.userData.anima = anima(resp, ...anims)
  return g
}

// ═════════════════════════ gli archi ═════════════════════════
const ARCHI = {
  'arco-01': { H: 0.42, curva: 0.18, N: 5, r0: 0.026, r1: 0.013, col: 0x3a2a1c, col2: 0x4a3524, grip: { col: 0x2a1c12, fascia: 0xe08a2a, h: 0.15 }, punta: 'legno', pepita: 1 },
  'arco-02': { H: 0.74, curva: 0.14, N: 8, r0: 0.024, r1: 0.011, col: 0x1e1a1a, col2: 0x2a2424, grip: { col: 0x2a2020, riquadro: 0xe8a838, h: 0.2 }, barre: 1, punta: 'corno' },
  'arco-03': { H: 0.7, curva: 0.18, N: 8, r0: 0.042, r1: 0.016, col: 0xb8604a, col2: 0xd08470, grip: { col: 0x3a2a22, h: 0.2 }, punta: 'corno', bordi: 1 },
  'arco-04': { H: 0.54, curva: 0.2, rec: 1.0, N: 8, r0: 0.03, r1: 0.014, col: 0x2a2a3a, col2: 0x343450, grip: { col: 0xcfeaf6, h: 0.16 }, cristalli: 1, gemme: 'estremi', punta: 'gemma' },
  'arco-05': { H: 0.6, curva: 0.17, rec: 1.0, N: 9, r0: 0.026, r1: 0.011, col: 0xe8b83a, col2: 0xe07a2a, grip: { col: 0x2e2018, h: 0.16 }, gemme: 'tutte', foglie: 1, punta: 'gemma', s: 1 },
  'arco-06': { H: 0.7, curva: 0.15, N: 8, r0: 0.022, r1: 0.01, col: 0xe8f2fb, col2: 0xcfe0f2, grip: { col: 0xdcd8e4, h: 0.16 }, punta: 'argento' },
  'arco-07': { balestra: 1 }
}
function arco (fig) {
  const A = ARCHI[fig.id] || ARCHI['arco-01'], rng = semino(fig.id), f = new Fucina()
  const E = ELEMENTI[fig.elemento] || ELEMENTI.nessuno, pre = fig.pregio || 1, anims = []
  let c = [0, 0.4, 0], R = 0.06
  if (A.balestra) {
    // come si tiene (docs/sotterraneo/roba-3d.md): l'impugnatura nel pugno, il fusto in avanti (+z, dove tira anche l'arco), la
    // guida e il dardo sopra (+y), l'arco di piatto e di traverso (x) coi flettenti piegati verso chi tira, la corda tesa alla noce
    const V = 0x4a2a6a, V2 = 0x6a3a9a, VS = 0x2e1a46, y0 = 0.075, zb = 0.5, W = 0.38, zn = 0.1
    f.metti(sca(0.06, 0.065, 0.66), V, 0, y0, 0.2)                                       // il fusto
    f.metti(sca(0.068, 0.11, 0.2), V, 0, y0 - 0.02, -0.2, { rx: -0.12 })                 // il calcio
    f.metti(sca(0.03, 0.012, 0.56), V2, 0, y0 + 0.037, 0.24)                             // la guida
    f.metti(sca(0.04, 0.13, 0.05), VS, 0, 0.0, 0.0, { rx: -0.3 })                        // l'impugnatura, nel pugno
    f.metti(sca(0.012, 0.045, 0.014), 0xa8b4c2, 0, y0 - 0.06, 0.06, { rx: 0.4 }, 'metallo')   // il grilletto
    f.metti(sca(0.11, 0.07, 0.07), 0x3a2060, 0, y0, zb)                                  // il blocco dell'arco
    f.metti(tor(0.05, 0.012, 4, 10), 0xa8b4c2, 0, y0 - 0.01, zb + 0.13, { ry: Math.PI / 2, s: [1, 1, 1.2] }, 'metallo')   // la staffa
    const pt = t => [0.05 + W * t, y0, zb - 0.13 * t * t]
    for (const s of [-1, 1]) {
      const pts = [], pts2 = []
      for (let i = 0; i <= 6; i++) { const [x, y, z] = pt(i / 6); pts.push([s * x, y, z]); pts2.push([s * x, y + 0.026, z]) }
      f.fila(pts, 0.03, 0.014, V, 'pieno', 6)
      f.fila(pts2, 0.012, 0.007, 0xe6edf2, 'metallo', 4)                                // la lama chiara
      const [x, y, z] = pt(1); f.metti(sfe(0.018, 5, 4), 0xdfe6ee, s * x, y, z, {}, 'metallo')
    }
    // la corda tesa fino alla noce, coi suoi punti bianchi, e il dardo sulla guida
    const [xt, yt, zt] = pt(1), nock = [0, y0 + 0.045, zn]
    f.metti(sca(0.05, 0.03, 0.04), 0x2a1c38, 0, y0 + 0.035, zn - 0.025)                  // la noce
    for (const s of [-1, 1]) f.asta([s * xt, yt, zt], nock, 0.005, 0.005, 0xe8e0c8, 'pieno', 4)
    for (let i = 1; i < 9; i++) for (const s of [-1, 1]) { const t = i / 9; f.metti(sfe(0.007, 4, 3), 0xffffff, s * xt * (1 - t), yt + (nock[1] - yt) * t, zt + (nock[2] - zt) * t, {}, 'pieno') }
    f.asta([0, y0 + 0.052, zn], [0, y0 + 0.052, zb + 0.18], 0.008, 0.008, 0xc9955a, 'pieno', 4)
    f.metti(con(0.02, 0.07, 4), 0xdfe6ee, 0, y0 + 0.052, zb + 0.21, { rx: Math.PI / 2 }, 'metallo')
    for (const s of [-1, 1]) f.metti(sca(0.004, 0.03, 0.05), 0xc04a6a, s * 0.012, y0 + 0.062, zn + 0.04, {})   // le alette
  } else {
    const H = A.H, rec = A.rec || 0, z = t => -A.curva * t * t + rec * 1.3 * Math.max(0, t - 0.74) ** 2
    const colA = A.col, colB = A.col2
    for (const s of [1, -1]) for (let i = 0; i < A.N; i++) {
      const t0 = i / A.N, t1 = (i + 1) / A.N, q = i % 2
      f.asta([0, s * t0 * H, z(t0)], [0, s * t1 * H, z(t1)], A.r0 + (A.r1 - A.r0) * t0, A.r0 + (A.r1 - A.r0) * t1, q ? colB : colA, 'pieno', 6)
      if (A.bordi) f.asta([0.034 * (1 - t0 * 0.6), s * t0 * H, z(t0)], [0.034 * (1 - t1 * 0.6), s * t1 * H, z(t1)], 0.008, 0.005, 0xf0c0b0, 'pieno', 4)
    }
    const zt = z(1), HZ = H
    // le punte
    for (const s of [-1, 1]) {
      const y = s * HZ
      if (A.punta === 'corno') f.metti(cil(0.014, 0.02, 0.05, 6), 0xf1e6c8, 0, y, zt, {})
      else if (A.punta === 'legno') f.metti(sfe(0.018, 5, 4), A.col2, 0, y, zt, {})
      else if (A.punta === 'argento') f.metti(con(0.022, 0.1, 5), 0xe3eaf2, 0, y + s * 0.04, zt, { rx: s > 0 ? 0 : Math.PI }, 'metallo')
      else if (A.punta === 'gemma') {
        const gcol = fig.elemento === 'natura' ? 0x7ff06a : 0x7fd4ff
        if (A.gemme === 'tutte' || A.gemme === 'estremi') { const m = f.libero(ico(0.034, 0), gcol, 0, y, zt - 0.005, 1.3); anims.push(pulsaLibero(m, 2.8, 0.06, s)) }
      }
    }
    // la corda
    f.asta([0, -HZ, zt], [0, HZ, zt], 0.005, 0.005, 0xe3d8b8, 'pieno', 4)
    // l'impugnatura
    const G = A.grip
    f.metti(cil(0.034, 0.034, G.h, 7), G.col, 0, 0, 0.004, {})
    for (const y of [-G.h * 0.4, G.h * 0.4]) f.metti(cil(0.038, 0.038, 0.014, 7), G.fascia ?? scuro(G.col, 0.3), 0, y, 0.004, {}, 'pieno')
    if (A.pepita) { f.metti(ott(0.026), 0xf4c542, 0, 0.0, 0.05, { s: [1, 1.5, 1] }, 'oro'); for (const y of [-0.05, 0.05]) f.metti(cil(0.037, 0.037, 0.03, 7), 0xe08a2a, 0, y, 0.004, {}) }
    if (G.riquadro) { f.metti(sca(0.02, 0.1, 0.075), G.riquadro, 0, 0, 0.0, {}, 'oro'); f.metti(sca(0.05, 0.1, 0.012), 0x8a5a18, 0, 0, 0.04, {}) }
    if (A.barre) for (const s of [-1, 1]) f.metti(sca(0.15, 0.016, 0.016), 0x3a3030, s * 0.075, s * 0.27, z(0.27 / H), {})
    if (A.cristalli) {
      for (const s of [1, -1]) for (let i = 0; i < 4; i++) { const t = 0.1 + i * 0.2 + (i % 2) * 0.03; f.metti(cristallo(0.02, 0.1 - i * 0.012, 5), i % 2 ? 0xe6f8ff : 0xaee8ff, 0.02, s * t * H, z(t) + 0.025, { rx: s * 0.5, rz: 0.2 }, 'viva') }
      for (let i = 0; i < 6; i++) { const a = i * 1.1; f.metti(cristallo(0.012, 0.06, 5), 0xf4fcff, Math.cos(a) * 0.03, (i - 2.5) * 0.026, 0.025 + Math.sin(a) * 0.02, { rz: Math.cos(a) * 0.4 }, 'viva') }
      const m = f.libero(ico(0.036, 0), 0x7fd4ff, 0, 0, 0.065, 1.2); anims.push(pulsaLibero(m, 2.2, 0.07, 3))
    }
    if (A.gemme === 'tutte') {
      const m = f.libero(ico(0.04, 0), 0x7ff06a, 0, 0.0, 0.065, 1.3); anims.push(pulsaLibero(m, 2.4, 0.07, 1))
    }
    if (A.foglie) for (const s of [1, -1]) for (let i = 0; i < 3; i++) { const t = 0.25 + i * 0.22; f.metti(ico(0.025, 0), i % 2 ? 0x4aa84a : 0x7fd860, 0.03, s * t * H, z(t) + 0.02, { s: [0.5, 1.6, 0.5], rz: 0.5 * s }, 'pieno') }
    if (A.s) for (const s of [1, -1]) for (let i = 1; i < 4; i++) { const t = i * 0.22; f.metti(sfe(0.011, 4, 3), 0xfff0b0, -0.032, s * t * H, z(t), {}, 'oro') }
    c = [0, 0, 0.06]; R = 0.08
  }
  // i motivi dell'elemento stanno attorno a z = 0 (sono fatti per le aste ritte): quelli della balestra si spostano sul davanti
  const fe = A.balestra ? new Fucina() : f
  elemento(fe, {}, fig.elemento, pre, A.balestra ? [0, 0.1, 0] : [0, A.H * 0.8, -A.curva * 0.4], 0.06, anims)
  const g = f.chiudi()
  if (A.balestra) { const e = fe.chiudi([0, 0, 0.42]); g.add(e); g.userData.triangoli += e.userData.triangoli }
  // la balestra si tiene in un altro modo dall'arco (eroi-3d/eroi.js, `tieniBalestra`)
  g.userData.famiglia = 'arco'; g.userData.tipo = A.balestra ? 'balestra' : 'arco'; g.userData.figura = fig.id
  const luce = PREGIO[pre]?.bagliore ?? 0
  g.userData.anima = anima(respira(g, 2.4, 0.2 + 0.1 * luce, 0.85 + 0.2 * luce, rng() * 6), ...anims)
  return g
}

export function crea (figura) {
  const g = figura.id.startsWith('arco-') ? arco(figura) : bastone(figura)
  g.userData.figura = figura.id
  return g
}

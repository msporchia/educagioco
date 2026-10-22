// I gioielli del catalogo in 3D (le 36 figure `amuleto-*` di roba.json): un modello PER FIGURA, con il castone, il taglio e il colore della sua gemma,
// la montatura, il metallo, la catenella, i motivi dell'elemento e la luce interna sua. Una funzione pura della figura (seme dall'id).
// Contratto: `crea(figura)` → Group; collane: origine al centro del ciondolo, faccia verso +z, la catenella a V che esce in alto (~0.3 di larghezza);
// anelli: origine al centro, il dito lungo +y, la gemma verso +z. `userData = { famiglia:'amuleto', tipo:'collana'|'anello', figura, triangoli, anima(t), catena }`.
// `indossa(eroe, figura)` → `togli()` appende la collana al collo dell'eroe 3D (poc/eroi-3d/eroi.js). Le misure del busto si leggono dall'eroe.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { Fucina, sca, cil, con, sfe, ott, toro, poli, cristallo, braci, orbita } from '../armi-3d/fucina.js'
import { MATERIE, ELEMENTI, PREGIO } from './palette.js'
import roba from '../../strumenti/sprite/sorgenti/sotterraneo/generati/roba.json'

export const ARCHETIPI = ['ciondolo a stella', 'ciondolo con cristallo', 'ciondolo con gemma', 'amuleto a teschio', 'ciondolo ad anello d\'argento', 'medaglione con gemma',
  'amuleto a sole', 'ciondolo con gemma scura', 'ciondolo a croce', 'anello con gemma']
export const FIGURE = roba.figure.filter(f => f.id.startsWith('amuleto-'))

const PI = Math.PI
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
const seme = id => { let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 100003; return h }

// ── i metalli e i cordoncini ──
const METALLI = {
  oro: { t: 'oro', hi: MATERIE.oro.chiaro, md: MATERIE.oro.medio, sc: MATERIE.oro.scuro, om: MATERIE.oro.ombra },
  vecchio: { t: 'oro', hi: 0xd8bc72, md: 0xb08c44, sc: 0x7e6026, om: 0x543d18 },
  argento: { t: 'metallo', hi: 0xf6fbff, md: MATERIE.acciaio.medio, sc: MATERIE.acciaio.scuro, om: MATERIE.acciaio.ombra },
  rame: { t: 'oro', hi: 0xffc27a, md: 0xe8963a, sc: 0xb4651e, om: 0x7a3e10 },
  osso: { t: 'pieno', hi: MATERIE.osso.chiaro, md: MATERIE.osso.medio, sc: MATERIE.osso.scuro, om: MATERIE.osso.ombra },
  cristallo: { t: 'metallo', hi: 0xeafcff, md: 0xa9e6f6, sc: 0x62bcd8, om: 0x3a8aa8 },
  rosa: { t: 'metallo', hi: 0xfff0f6, md: 0xf3b6d2, sc: 0xcf7aa6, om: 0x8e4670 }
}
const CUOIO = 0x6a4326, CUOIO_S = 0x4a2d18

// ── il catalogo: per ogni figura la sua forma, la gemma, il metallo, la catenella ──
// gem: [taglio, colore, raggio, {em, scuro, riflesso, sx, sy}]; cat: [tipo, colore, spessore]
const SCHEDE = {
  'amuleto-01': { f: 'stella', n: 4, R: 0.082, rin: 0.36, gem: ['tondo', 0xd82a2a, 0.026], met: 'oro', cat: ['cordino', CUOIO], punte: true },
  'amuleto-02': { f: 'cristallo', gem: ['lungo', 0x4cbcf0, 0.044], met: 'oro', cat: ['sinuoso', 0x6a4a2e], tipo: 'sottile' },
  'amuleto-03': { f: 'castone', gem: ['sfacc', 0x7fe08a, 0.04], met: 'oro', cat: ['maglie', 0xe9c04a], bez: 'sottile' },
  'amuleto-04': { f: 'castone', gem: ['sfacc', 0xa646ea, 0.042], met: 'oro', cat: ['cordino', CUOIO], bez: 'media', extra: 'anellino' },
  'amuleto-05': { f: 'teschio', met: 'osso', cat: ['grosse', 0xe8b83e], bone: true, occhi: 0x6bffa8 },
  'amuleto-06': { f: 'anelloArg', gem: ['tondo', 0x181822, 0.046, { em: 0x4a2a7a }], met: 'argento', cat: ['cordino', 0x56565e], spess: 0.012 },
  'amuleto-07': { f: 'cristallo', gem: ['scudetto', 0x7ad0f4, 0.058], met: 'argento', cat: ['maglie', 0xe9c04a], tipo: 'argento' },
  'amuleto-08': { f: 'medaglione', rx: 0.092, ry: 0.092, sp: 0.03, gem: ['ottagono', 0x8a30dc, 0.064], met: 'oro', cat: ['grosse', 0x24242c], extra: 'foglia' },
  'amuleto-09': { f: 'medaglione', rx: 0.07, ry: 0.092, sp: 0.02, gem: ['ovale', 0x2ed2c6, 0.056], met: 'oro', cat: ['maglie', 0x9ad8f0] },
  'amuleto-10': { f: 'medaglione', rx: 0.066, ry: 0.088, sp: 0.02, gem: ['ovale', 0xfff6d0, 0.05, { em: 0xffe9a0 }], met: 'oro', cat: ['cordino', 0x7e5630], extra: 'anellino' },
  'amuleto-11': { f: 'sole', raggi: 10, R0: 0.062, Rr: 0.115, gem: ['tondo', 0x14121a, 0.04, { em: 0xffa83a }], met: 'oro', cat: ['maglie', 0xe9c04a] },
  'amuleto-12': { f: 'teschio', met: 'vecchio', cat: ['maglie', 0x7c8a76], bone: false, occhi: 0x6bffa8, crepe: true },
  'amuleto-13': { f: 'stella', n: 4, R: 0.06, rin: 0.42, gem: ['tondo', 0xe02e2e, 0.022], met: 'oro', cat: ['cordino', CUOIO_S] },
  'amuleto-14': { f: 'medaglione', rx: 0.096, ry: 0.096, sp: 0.034, gem: ['ottagono', 0xd058d0, 0.06], met: 'oro', cat: ['grosse', 0xe8b83e], extra: 'borchie' },
  'amuleto-15': { f: 'castone', gem: ['goccia', 0xd01a2a, 0.038], met: 'oro', cat: ['cordino', CUOIO], bez: 'sottile', extra: 'riccioli' },
  'amuleto-16': { f: 'castone', gem: ['goccia', 0x38b4f0, 0.036], met: 'oro', cat: ['cordino', 0x7a4f2c], bez: 'media', extra: 'punta' },
  'amuleto-17': { f: 'castone', gem: ['goccia', 0x153f22, 0.04, { em: 0x2f8a4a }], met: 'oro', cat: ['cordino', CUOIO_S], bez: 'media' },
  'amuleto-18': { f: 'castone', gem: ['goccia', 0x2a5ce0, 0.04, { riflesso: 'grande' }], met: 'oro', cat: ['cordino', CUOIO], bez: 'sottile' },
  'amuleto-19': { f: 'castone', gem: ['uovo', 0x9a46e4, 0.042], met: 'oro', cat: ['maglie', 0xd9a441], bez: 'sottile' },
  'amuleto-20': { f: 'castone', gem: ['tondo', 0xe0302a, 0.044], met: 'oro', cat: ['cordino', CUOIO], bez: 'robusta' },
  'amuleto-21': { f: 'punte', gem: ['ottagono', 0x261340, 0.04, { em: 0x7a3ad0 }], met: 'oro', cat: ['cordino', CUOIO_S] },
  'amuleto-22': { f: 'rombo', gem: ['ottagono', 0x7a2a22, 0.036, { em: 0xc04030 }], met: 'oro', cat: ['cordino', CUOIO] },
  'amuleto-23': { f: 'ovale', rx: 0.062, ry: 0.082, gem: ['ovale', 0x14121c, 0.05, { em: 0x4a3a7a, riflesso: 'luna' }], met: 'oro', cat: ['cordino', CUOIO] },
  'amuleto-24': { f: 'stella', n: 8, R: 0.098, rin: 0.4, alt: 0.62, gem: ['ottagono', 0x1fb860, 0.034], met: 'oro', cat: ['cordino', CUOIO], extra: 'foglia' },
  'amuleto-25': { f: 'grappolo', gem: ['tondo', 0x2e6cf0, 0.036], met: 'argento', cat: ['maglie', 0x2e2e36] },
  'amuleto-26': { f: 'sole', raggi: 14, R0: 0.07, Rr: 0.092, gem: ['tondo', 0xc6ecc2, 0.04, { em: 0x8fe8a0 }], met: 'oro', cat: ['cordino', CUOIO] },
  'amuleto-27': { f: 'anelloArg', gem: ['ottagono', 0x0c0c14, 0.04, { em: 0x38306a, riflesso: 'grande' }], met: 'argento', cat: ['maglie', 0xc3ccd6], spess: 0.007, bis: true },
  'amuleto-28': { f: 'cristallo', gem: ['losanga', 0x58c8f4, 0.05], met: 'oro', cat: ['cordino', CUOIO], tipo: 'artigli' },
  'amuleto-29': { f: 'cristallo', gem: ['goccia', 0x1c3ca8, 0.046, { em: 0x3a70e0 }], met: 'oro', cat: ['cordino', CUOIO_S], tipo: 'laterali' },
  'amuleto-30': { f: 'scudetto', gem: ['losanga', 0x0e1650, 0.04, { em: 0x3050c0 }], met: 'oro', cat: ['cordino', CUOIO] },
  'amuleto-31': { f: 'croce', gem: ['tondo', 0xd01a2a, 0.02], met: 'oro', cat: ['cordino', CUOIO] },
  'amuleto-32': { f: 'ovale', rx: 0.07, ry: 0.058, gem: ['tondo', 0xffb27a, 0.05, { em: 0xff9a55 }], met: 'oro', cat: ['cordino', CUOIO], orizz: true },
  'amuleto-33': { f: 'anello', giri: 3, gem: ['sfacc', 0xe02a1e, 0.042], met: 'oro', rig: 'artigli' },
  'amuleto-34': { f: 'anello', giri: 2, gem: ['saetta', 0x2a54e8, 0.044], met: 'cristallo', rig: 'ghiaccio' },
  'amuleto-35': { f: 'anello', giri: 2.5, gem: ['ottagono', 0x9a34e8, 0.044], met: 'rosa', rig: 'cornice', spira: 0x40ff82 },
  'amuleto-36': { f: 'anello', giri: 2.5, gem: ['tondo', 0x1ec85a, 0.046], met: 'rame', rig: 'foglie' }
}

// ── le gemme ──
const DIM = { tondo: [1, 1, 0.55], sfacc: [1, 1, 0.4], ottagono: [1, 1, 0.34], goccia: [0.8, 1.2, 0.5], uovo: [0.82, 1.1, 0.55], losanga: [0.7, 1.3, 0.5], lungo: [0.5, 1.7, 0.45], scudetto: [0.85, 1.1, 0.5], saetta: [0.6, 1.1, 0.4], ovale: [0.8, 1.1, 0.55] }
const nuda = g => { const x = g.index ? g.toNonIndexed() : g; x.deleteAttribute('uv'); return x }
function geoGemma (taglio, r) {
  let g
  switch (taglio) {
    case 'sfacc': {
      const a = nuda(new THREE.CylinderGeometry(r * 0.6, r, r * 0.28, 8)), b = nuda(new THREE.ConeGeometry(r, r * 0.55, 8)); b.rotateX(PI); b.translate(0, -r * 0.415, 0)
      g = mergeGeometries([a, b]); g.rotateX(PI / 2); g.translate(0, 0, r * 0.1); break
    }
    case 'ottagono': {
      const a = nuda(new THREE.CylinderGeometry(r * 0.62, r * 0.82, r * 0.2, 8)), b = nuda(new THREE.CylinderGeometry(r * 0.82, r, r * 0.22, 8)); a.translate(0, r * 0.21, 0)
      const c = nuda(new THREE.CylinderGeometry(r, r * 0.5, r * 0.3, 8)); c.translate(0, -r * 0.16, 0)
      g = mergeGeometries([a, b, c]); g.rotateX(PI / 2); g.rotateZ(PI / 8); break
    }
    case 'goccia': {
      const a = new THREE.SphereGeometry(r * 0.8, 9, 6), b = new THREE.ConeGeometry(r * 0.78, r * 1.5, 8); a.translate(0, -r * 0.4, 0); b.translate(0, r * 0.35, 0)
      g = mergeGeometries([nuda(a), nuda(b)]); g.scale(1, 1, 0.55); break
    }
    case 'uovo': g = nuda(new THREE.SphereGeometry(r, 10, 7)); g.scale(0.82, 1.1, 0.55); break
    case 'ovale': g = nuda(new THREE.SphereGeometry(r, 10, 7)); g.scale(0.8, 1.1, 0.55); break
    case 'losanga': g = nuda(new THREE.OctahedronGeometry(r, 0)); g.scale(0.7, 1.3, 0.5); break
    case 'lungo': g = nuda(new THREE.OctahedronGeometry(r, 0)); g.scale(0.5, 1.7, 0.45); break
    case 'scudetto': { const s = new THREE.Shape([[-0.8, 0.9], [0.8, 0.9], [0.85, -0.1], [0, -1.1], [-0.85, -0.1]].map(p => new THREE.Vector2(p[0] * r, p[1] * r))); g = nuda(new THREE.ExtrudeGeometry(s, { depth: r * 0.5, bevelEnabled: true, bevelSize: r * 0.12, bevelThickness: r * 0.18, bevelSegments: 1 })); g.translate(0, 0, -r * 0.25); break }
    case 'saetta': { const s = new THREE.Shape([[0.1, 1.1], [-0.6, -0.1], [-0.1, -0.1], [-0.3, -1.1], [0.6, 0.2], [0.12, 0.2], [0.45, 1.1]].map(p => new THREE.Vector2(p[0] * r, p[1] * r))); g = nuda(new THREE.ExtrudeGeometry(s, { depth: r * 0.4, bevelEnabled: true, bevelSize: r * 0.06, bevelThickness: r * 0.1, bevelSegments: 1 })); g.translate(0, 0, -r * 0.2); break }
    default: g = nuda(new THREE.SphereGeometry(r, 9, 6)); g.scale(1, 1, 0.55)
  }
  g.computeBoundingBox()
  return g
}
const mescola = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k).getHex()

/** Il contesto di una figura: la fucina, i colori, le animazioni. */
function contesto (fig, sch) {
  const f = new Fucina(), M = METALLI[sch.met] || METALLI.oro
  const c = { f, M, fig, sch, el: ELEMENTI[fig.elemento] || ELEMENTI.nessuno, pr: PREGIO[fig.pregio] || PREGIO[1], an: [], gems: [], punti: [], top: 0.1, bot: -0.1, W: 0.1, k: 1, s: seme(fig.id) }
  c.m = (geo, sh, x = 0, y = 0, z = 0, o = {}) => f.metti(geo, M[sh], x, y, z, o, M.t)
  c.p = (geo, col, x = 0, y = 0, z = 0, o = {}) => f.metti(geo, col, x, y, z, o, 'pieno')
  return c
}
const disco = (c, r, sp, sh, x, y, z, sx = 1, sy = 1, seg = 14) => c.m(cil(r, r, sp, Math.min(seg, 16)), sh, x, y, z, { rx: PI / 2, s: [sx, 1, sy] })
const anello = (c, R, t, sh, x, y, z, sx = 1, sy = 1, seg = 16, o = {}) => c.m(toro(R, t, 4, Math.max(8, Math.round(seg * 0.75))), sh, x, y, z, { s: [sx, sy, 1], ...o })

/** Una gemma con la sua luce interna: materiale suo che pulsa, nucleo, riflesso e brillio. Ritorna le misure. */
function gemma (c, [taglio, col, r, o = {}], x, y, z, mul = 1) {
  const rr = r * mul, f = c.f, g = geoGemma(taglio, rr), bb = g.boundingBox, zf = bb.max.z, [dw, dh] = DIM[taglio] || [1, 1]
  const scuro = !!o.em
  const m = f.libero(g, col, x, y, z, 1)
  const luce = o.em || mescola(col, 0xffffff, 0.15)
  m.material.dispose()
  m.material = new THREE.MeshStandardMaterial({ color: col, emissive: luce, emissiveIntensity: scuro ? 0.55 : 0.55, roughness: 0.1, metalness: 0.2, flatShading: true, transparent: !scuro, opacity: scuro ? 1 : 0.86 })
  m.castShadow = false
  const base = m.material.emissiveIntensity, ph = hash(c.s + c.gems.length * 5) * 6.28, vel = 1.6 + hash(c.s + 3) * 1.4
  c.gems.push(m)
  c.an.push(t => { m.material.emissiveIntensity = base * (0.85 + 0.3 * Math.sin(t * vel + ph) + 0.12 * Math.sin(t * vel * 2.7 + ph * 2)) })
  const piccola = rr < 0.028
  if (!scuro && !piccola) {                                                       // il nucleo, che si vede attraverso la gemma
    const n = f.libero(ott(rr * 0.42), mescola(col, 0xffffff, 0.55), x, y, z, 1.4)
    n.scale.set(dw, dh, 0.8)
    c.an.push(t => { const s = 0.9 + 0.2 * Math.sin(t * vel * 1.3 + ph + 2); n.scale.set(dw * s, dh * s, 0.8 * s); n.rotation.z = t * 0.5 })
  }
  // il riflesso
  const rif = o.riflesso || 'punto'
  if (rif === 'luna') {
    const l = new THREE.TorusGeometry(rr * 0.62, rr * 0.05, 3, 9, PI * 0.8); l.rotateZ(PI * 0.55)
    c.f.metti(l, 0xf4f8ff, x, y, z + zf * 0.9, { s: [dw, dh, 1] }, 'luce')
  } else if (rif === 'grande') c.f.metti(ott(rr * 0.2), 0xffffff, x - rr * 0.32 * dw, y + rr * 0.4 * dh, z + zf * 0.85, { s: [1.3, 1.5, 0.5], rz: 0.4 }, 'luce')
  else c.f.metti(ott(rr * 0.1), 0xffffff, x - rr * 0.3 * dw, y + rr * 0.34 * dh, z + zf * 0.9, { s: [1.4, 1.1, 0.5] }, 'luce')
  // il brillio che lampeggia
  if (piccola) return { x, y, z, zf, w: rr * dw, h: rr * dh }
  const gl = f.libero(mergeGeometries([nuda(new THREE.OctahedronGeometry(rr * 0.34)).clone(), nuda(new THREE.OctahedronGeometry(rr * 0.34))].map((q, i) => { q.scale(i ? 0.13 : 1, i ? 1 : 0.13, 0.13); return q })), 0xffffff, x + rr * 0.35 * dw, y + rr * 0.3 * dh, z + zf + 0.003, 1.8)
  const pb = hash(c.s + 9) * 6, vb = 0.8 + hash(c.s + 11) * 0.9
  c.an.push(t => { const k = Math.max(0, Math.sin(t * vb + pb)) ** 8; gl.scale.setScalar(0.001 + k); gl.rotation.z = t * 0.6 })
  // l'alone (solo dove il pregio lo vuole)
  if (c.pr.bagliore > 0.3) {
    const hm = new THREE.MeshBasicMaterial({ color: scuro ? luce : col, transparent: true, opacity: 0.1 * c.pr.bagliore, blending: THREE.AdditiveBlending, depthWrite: false })
    const h = new THREE.Mesh(new THREE.CircleGeometry(rr * 1.45, 18), hm); h.position.set(x, y, z - 0.002); h.scale.set(dw, dh, 1); f.liberi.push(h)
    c.an.push(t => { hm.opacity = (0.09 + 0.04 * Math.sin(t * vel + ph)) * c.pr.bagliore })
  }
  return { x, y, z, zf, w: rr * dw, h: rr * dh }
}

/** L'anellino da cui parte la catena. Ritorna l'altezza dove la catena comincia. */
function occhiello (c, y, R = 0.013) {
  anello(c, R, 0.0045, 'sc', 0, y + R * 1.1, 0, 0.9, 1.15, 10)
  return y + R * 2.4
}
/** Le borchie piccole che il pregio aggiunge: `c.punti` le propone, il pregio ne sceglie. */
function borchie (c) {
  const n = [0, 0, 2, 4, 6][c.fig.pregio] || 0, col = c.sch.gem ? c.sch.gem[1] : c.el.gemma
  for (const p of c.punti.slice(0, n)) {
    c.m(ott(0.0082), 'hi', p[0], p[1], p[2])
    if (c.fig.pregio >= 3) c.f.metti(ott(0.0045), mescola(col, 0xffffff, 0.35), p[0], p[1], p[2] + 0.006, { s: [1, 1, 0.6] }, 'luce')
  }
}
const giro = (n, R, a0 = PI / 2) => Array.from({ length: n }, (_, i) => [Math.cos(a0 + i * 2 * PI / n) * R, Math.sin(a0 + i * 2 * PI / n) * R])

// ══════════ le montature ══════════
const MONTATURE = {
  stella (c, s) {
    const { n, R, rin, alt = 0 } = s, sp = 0.016, pts = []
    for (let i = 0; i < 2 * n; i++) {
      const a = PI / 2 + i * PI / n, k = i % 2 ? rin : (alt && (i / 2) % 2 ? alt : 1)
      pts.push([Math.cos(a) * R * k, Math.sin(a) * R * k])
    }
    c.m(poli(pts, sp, 0.003), 'md')
    c.m(poli(pts.map(p => [p[0] * 0.62, p[1] * 0.62]), sp, 0.002), 'hi', 0, 0, 0.004)
    const g = s.gem
    const gm = gemma(c, g, 0, 0, sp / 2 + 0.002)
    c.m(toro(gm.w * 1.2, 0.004, 4, 12), 'sc', 0, 0, sp / 2 + 0.003)
    c.top = R; c.bot = -R; c.W = R; c.punti = pts.filter((_, i) => i % 2 === 0).map(p => [p[0] * 0.9, p[1] * 0.9, sp / 2 + 0.004])
    return occhiello(c, R - 0.005)
  },
  sole (c, s) {
    const { raggi, R0, Rr } = s
    const pts = []
    for (let i = 0; i < raggi * 2; i++) { const a = PI / 2 + i * PI / raggi, k = i % 2 ? R0 * 0.95 : Rr; pts.push([Math.cos(a) * k, Math.sin(a) * k]) }
    c.m(poli(pts, 0.013, 0.002), 'sc', 0, 0, -0.004)
    disco(c, R0, 0.02, 'md', 0, 0, 0, 1, 1, 20)
    c.m(toro(R0 * 0.92, 0.0065, 4, 20), 'hi', 0, 0, 0.011)
    c.m(toro(R0 * 0.62, 0.004, 4, 16), 'sc', 0, 0, 0.011)
    gemma(c, s.gem, 0, 0, 0.012)
    c.top = Rr; c.bot = -Rr; c.W = Rr; c.punti = giro(raggi, R0 * 0.78).map(p => [p[0], p[1], 0.012])
    return occhiello(c, Rr - 0.004)
  },
  medaglione (c, s) {
    const { rx, ry, sp } = s
    disco(c, 1, sp, 'md', 0, 0, 0, rx, ry, 24)
    anello(c, 1, 0.009, 'hi', 0, 0, sp / 2, rx * 0.97, ry * 0.97, 24)
    disco(c, 1, 0.004, 'om', 0, 0, sp / 2 + 0.002, rx * 0.82, ry * 0.82, 20)
    anello(c, 1, 0.005, 'sc', 0, 0, sp / 2 + 0.005, rx * 0.8, ry * 0.8, 20)
    gemma(c, s.gem, 0, 0, sp / 2 + 0.006)
    c.top = ry + 0.01; c.bot = -ry; c.W = rx
    const nb = s.extra === 'borchie' ? 12 : 8
    for (let i = 0; i < nb; i++) { const a = i * 2 * PI / nb; c.m(ott(0.0058), 'hi', Math.cos(a) * rx * 0.895, Math.sin(a) * ry * 0.895, sp / 2 + 0.004, { s: [1, 1, 0.8] }) }
    c.punti = giro(4, 1, PI / 4).map(p => [p[0] * rx * 0.7, p[1] * ry * 0.7, sp / 2 + 0.006])
    c.m(cil(0.009, 0.011, 0.016, 8), 'sc', 0, ry + 0.002, 0)                    // il collarino
    let y = ry + 0.01
    if (s.extra === 'anellino') { anello(c, 0.02, 0.0055, 'hi', 0, y + 0.017, 0, 1, 1.1, 12); y += 0.052 } else y = occhiello(c, y - 0.002)
    if (s.extra === 'foglia') foglia(c, rx * 0.95, -ry * 0.55, 0.014, 0.9, 0x3fae52, -0.9)
    return y
  },
  castone (c, s) {
    const [taglio, , r] = s.gem, [dw, dh] = DIM[taglio] || [1, 1], rob = s.bez === 'robusta', sot = s.bez === 'sottile'
    const sx = dw * r * 1.12, sy = dh * r * 1.1, t = rob ? 0.011 : sot ? 0.0045 : 0.007
    disco(c, 1, 0.01, 'sc', 0, 0, -0.004, sx * 1.05, sy * 1.05, 20)
    anello(c, 1, t, 'md', 0, 0, 0.002, sx, sy, 20)
    if (rob) { anello(c, 1, 0.006, 'hi', 0, 0, 0.004, sx * 1.12, sy * 1.12, 20); for (const p of giro(8, 1)) c.m(ott(0.0075), 'hi', p[0] * sx * 1.2, p[1] * sy * 1.2, 0.004) }
    const gm = gemma(c, s.gem, 0, 0, 0.003)
    for (const sg of [-1, 1]) for (const sv of [0.72, -0.72]) {                      // quattro griffe corte: la base sul bordo e un artiglio che morde l'orlo della gemma
      const px = sg * sx * 0.99, py = sv * sy * 0.92, th = Math.atan2(-py, -px), dx = Math.cos(th), dy = Math.sin(th)
      c.m(sfe(0.0068, 5, 3), 'hi', px, py, 0.005, { s: [1, 1, 0.8] })
      c.m(con(0.0044, 0.013, 4), 'hi', px + dx * 0.0055, py + dy * 0.0055, gm.zf * 0.72 + 0.003, { rz: th - PI / 2, rx: -0.35 * 0 })
    }
    c.top = sy * 1.1; c.bot = -sy * 1.1; c.W = sx * 1.2
    c.punti = [[sx * 1.15, 0, 0.005], [-sx * 1.15, 0, 0.005], [0, -sy * 1.15, 0.005], [sx * 0.8, -sy * 0.85, 0.005]]
    let y = c.top
    if (s.extra === 'punta') { c.m(con(0.0085, 0.034, 5), 'hi', 0, y + 0.012, 0); c.m(sfe(0.007, 5, 4), 'hi', 0, y - 0.004, 0); y += 0.028; return occhiello(c, y - 0.004, 0.011) }
    if (s.extra === 'riccioli') {
      for (const sg of [-1, 1]) {
        const g = new THREE.TorusGeometry(0.021, 0.0042, 4, 10, PI * 1.45); g.rotateZ(sg > 0 ? -PI * 0.1 : PI * 1.1 - PI * 0.45)
        c.m(g, 'hi', sg * 0.024, y + 0.016, 0); c.m(sfe(0.006, 5, 4), 'hi', sg * 0.046, y + 0.018, 0)
      }
      c.m(sfe(0.008, 6, 4), 'hi', 0, y + 0.002, 0)
      return occhiello(c, y + 0.004)
    }
    if (s.extra === 'anellino') { c.m(cil(0.006, 0.008, 0.014, 6), 'md', 0, y + 0.006, 0); anello(c, 0.02, 0.0055, 'hi', 0, y + 0.025, 0, 1, 1.15, 12); return y + 0.066 }
    c.m(cil(0.006, 0.009, 0.012, 6), 'md', 0, y + 0.003, 0)
    return occhiello(c, y + 0.007)
  },
  cristallo (c, s) {
    const [taglio, , r] = s.gem, [dw, dh] = DIM[taglio], hh = dh * r, ww = dw * r, tipo = s.tipo
    if (tipo === 'argento') {                                                       // lo scudetto stretto da una cornice d'argento
      const pts = [[-0.8, 0.9], [0.8, 0.9], [0.85, -0.1], [0, -1.1], [-0.85, -0.1]].map(p => [p[0] * r * 1.28, p[1] * r * 1.24 + 0.002])
      c.m(poli(pts, 0.016, 0.003), 'md', 0, 0, -0.002)
      c.m(toro(0.004, 0.003, 3, 5), 'hi', 0, 0, 0)
      gemma(c, s.gem, 0, 0, 0.007)
      for (const p of pts.slice(0, 5)) c.m(sfe(0.0065, 5, 4), 'hi', p[0], p[1], 0.009)
      c.top = r * 1.15; c.bot = -r * 1.1; c.W = r * 1.1; c.punti = [[r * 0.9, r * 0.2, 0.01], [-r * 0.9, r * 0.2, 0.01]]
      c.m(cil(0.007, 0.01, 0.014, 6), 'sc', 0, r * 1.1, 0)
      return occhiello(c, r * 1.1 + 0.007)
    }
    gemma(c, s.gem, 0, 0, 0)
    if (tipo === 'sottile') {                                                       // montatura sottile: due cappucci e quattro filetti
      c.m(con(ww * 1.05, 0.018, 4), 'md', 0, hh + 0.004, 0, { ry: PI / 4 }); c.m(con(ww * 1.05, 0.016, 4), 'md', 0, -hh - 0.004, 0, { rx: PI, ry: PI / 4 })
      for (const sg of [-1, 1]) for (const zz of [0.6, -0.6]) if (zz > 0) c.f.asta([sg * ww * 0.95, hh * 0.78, 0.006], [sg * ww * 1.12, 0, 0.006], 0.0028, 0.0028, c.M.hi, c.M.t, 4), c.f.asta([sg * ww * 1.12, 0, 0.006], [sg * ww * 0.95, -hh * 0.78, 0.006], 0.0028, 0.0028, c.M.hi, c.M.t, 4)
      c.top = hh + 0.018; c.bot = -hh - 0.02; c.W = ww * 1.3; c.punti = [[ww * 1.2, 0, 0.008], [-ww * 1.2, 0, 0.008]]
      return occhiello(c, c.top - 0.002)
    }
    if (tipo === 'artigli') {                                                       // quattro artigli d'oro appuntiti che salgono dal basso
      c.m(con(ww * 0.9, 0.022, 4), 'sc', 0, -hh - 0.003, 0, { rx: PI, ry: PI / 4 })
      for (const sg of [-1, 1]) {
        c.f.fila([[sg * 0.012, -hh * 0.95, 0], [sg * ww * 1.35, -hh * 0.5, 0.004], [sg * ww * 1.45, hh * 0.1, 0.006], [sg * ww * 1.0, hh * 0.65, 0.01]], 0.0055, 0.0018, c.M.md, c.M.t, 4)
        c.f.fila([[sg * 0.008, -hh * 0.95, 0.012], [sg * ww * 0.6, -hh * 0.4, 0.03], [sg * ww * 0.5, hh * 0.15, 0.03]], 0.0045, 0.0015, c.M.hi, c.M.t, 4)
      }
      c.m(con(0.011, 0.024, 4), 'md', 0, hh + 0.012, 0, { ry: PI / 4 })
      c.top = hh + 0.024; c.bot = -hh - 0.02; c.W = ww * 1.5; c.punti = [[ww * 1.5, 0.01, 0.008], [-ww * 1.5, 0.01, 0.008]]
      return occhiello(c, c.top - 0.006)
    }
    // 'laterali': due artigli ai lati e un cappuccio in alto
    for (const sg of [-1, 1]) {
      c.f.fila([[sg * ww * 0.5, -hh * 0.9, 0], [sg * ww * 1.45, -hh * 0.45, 0.002], [sg * ww * 1.5, hh * 0.2, 0.004], [sg * ww * 0.85, hh * 0.62, 0.008]], 0.0055, 0.002, c.M.md, c.M.t, 4)
      c.m(sfe(0.0065, 5, 4), 'hi', sg * ww * 1.5, hh * 0.2, 0.006)
    }
    c.m(cil(0.005, 0.0085, 0.016, 6), 'md', 0, hh + 0.007, 0); c.m(con(ww * 0.7, 0.014, 6), 'sc', 0, -hh - 0.004, 0, { rx: PI })
    c.top = hh + 0.015; c.bot = -hh - 0.01; c.W = ww * 1.6; c.punti = [[ww * 1.5, 0.0, 0.008], [-ww * 1.5, 0, 0.008]]
    return occhiello(c, c.top)
  },
  anelloArg (c, s) {
    const R = 0.078, t = s.spess || 0.012, bis = s.bis
    c.m(toro(R, t, 5, 20), 'md', 0, 0, 0)
    if (bis) { c.m(toro(R * 0.82, 0.004, 4, 20), 'hi', 0, 0, 0.004) } else c.m(toro(R * 0.9, 0.0045, 4, 20), 'hi', 0, 0, t * 0.8)
    disco(c, R * 0.98, 0.006, 'om', 0, 0, -0.006, 1, 1, 20)
    const gm = gemma(c, s.gem, 0, 0, 0.002, bis ? 1.15 : 1)
    for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4; c.m(sfe(0.0075, 5, 4), 'hi', Math.cos(a) * R, Math.sin(a) * R, 0.004) }
    c.top = R + t; c.bot = -R; c.W = R; c.punti = giro(4, R * 0.8, PI / 4).map(p => [p[0], p[1], 0.012])
    c.m(cil(0.007, 0.01, 0.014, 6), 'sc', 0, R + t * 0.8, 0)
    return occhiello(c, R + t + 0.004)
  },
  ovale (c, s) {
    const { rx, ry } = s, sp = 0.012
    anello(c, 1, 0.0095, 'md', 0, 0, 0, rx, ry, 24)
    anello(c, 1, 0.005, 'hi', 0, 0, 0.004, rx * 0.84, ry * 0.84, 24)
    disco(c, 1, 0.006, 'om', 0, 0, -0.004, rx, ry, 20)
    gemma(c, s.gem, 0, 0, 0.002)
    for (const [dx, dy] of s.orizz ? [[1, 0], [-1, 0]] : [[0, -1], [1, 0], [-1, 0]]) c.m(sfe(0.01, 6, 4), 'hi', dx * rx * 1.02, dy * ry * 1.02, 0.002)
    if (s.orizz) for (const sg of [-1, 1]) c.m(con(0.007, 0.03, 4), 'hi', 0, sg * ry * 1.1, 0, { rz: sg > 0 ? 0 : PI })
    c.top = ry + 0.014; c.bot = -ry; c.W = rx
    c.punti = [[rx * 0.8, ry * 0.6, 0.006], [-rx * 0.8, ry * 0.6, 0.006], [0, -ry * 0.9, 0.006]]
    c.m(cil(0.006, 0.009, 0.014, 6), 'md', 0, ry + 0.003, 0)
    return occhiello(c, ry + 0.01)
  },
  rombo (c, s) {
    const R = 0.082
    const pts = [[0, R * 1.18], [R * 0.78, 0], [0, -R * 1.18], [-R * 0.78, 0]]
    c.m(poli(pts, 0.016, 0.003), 'md')
    c.m(poli(pts.map(p => [p[0] * 0.64, p[1] * 0.64]), 0.016, 0.002), 'hi', 0, 0, 0.004)
    for (const [dx, dy, L] of [[0, 1, 0.05], [0, -1, 0.05], [1, 0, 0.05], [-1, 0, 0.05], [0.7, 0.7, 0.04], [-0.7, 0.7, 0.04], [0.7, -0.7, 0.04], [-0.7, -0.7, 0.04]]) {
      const rr = (dx ? 0.8 : 1.2) * R * (dx && dy ? 0.5 : 1) * (dx && dy ? 1.35 : 1)
      c.f.asta([dx * rr * 0.8, dy * rr * 0.8, -0.003], [dx * (rr + L * 0.8), dy * (rr + L * 0.8), -0.003], 0.006, 0.0012, c.M.sc, c.M.t, 4)
    }
    gemma(c, s.gem, 0, 0, 0.011)
    c.top = R * 1.2; c.bot = -R * 1.2; c.W = R; c.punti = [[R * 0.4, R * 0.4, 0.012], [-R * 0.4, R * 0.4, 0.012], [R * 0.4, -R * 0.4, 0.012], [-R * 0.4, -R * 0.4, 0.012]]
    return occhiello(c, R * 1.18 + 0.002)
  },
  punte (c, s) {
    const R = 0.066
    c.m(cil(R, R, 0.018, 8), 'md', 0, 0, 0, { rx: PI / 2, ry: PI / 8 })
    c.m(toro(R * 0.78, 0.006, 4, 8), 'hi', 0, 0, 0.011, { rz: PI / 8 })
    for (let i = 0; i < 8; i++) {
      const a = PI / 2 + i * PI / 4, L = i % 2 ? 0.032 : 0.05
      c.m(con(i % 2 ? 0.011 : 0.014, L, 4), i % 2 ? 'sc' : 'hi', Math.cos(a) * (R + L / 2 - 0.004), Math.sin(a) * (R + L / 2 - 0.004), 0, { rz: a - PI / 2 })
    }
    gemma(c, s.gem, 0, 0, 0.012)
    c.top = R + 0.05; c.bot = -R - 0.05; c.W = R + 0.04; c.punti = giro(4, R * 0.72, PI / 4).map(p => [p[0], p[1], 0.014])
    return occhiello(c, R + 0.048)
  },
  scudetto (c, s) {
    const r = 0.04, pts = [[-1, 1.1], [1, 1.1], [1.1, -0.1], [0, -1.55], [-1.1, -0.1]].map(p => [p[0] * r * 1.45, p[1] * r * 1.35])
    c.m(poli(pts, 0.018, 0.004), 'md')
    c.m(poli(pts.map(p => [p[0] * 0.7, p[1] * 0.7 + 0.004]), 0.018, 0.002), 'sc', 0, 0, 0.005)
    gemma(c, s.gem, 0, 0.004, 0.013)
    for (const sg of [-1, 1]) c.f.fila([[sg * 0.058, 0.03, 0], [sg * 0.085, 0.045, 0], [sg * 0.095, 0.07, 0]], 0.006, 0.0015, c.M.md, c.M.t, 4)
    c.top = r * 1.5; c.bot = -r * 2; c.W = 0.09; c.punti = [[0.035, 0.05, 0.012], [-0.035, 0.05, 0.012], [0.02, -0.05, 0.012], [-0.02, -0.05, 0.012]]
    return occhiello(c, r * 1.48)
  },
  grappolo (c, s) {
    const r = s.gem[2]
    disco(c, r * 1.9, 0.014, 'argento' === s.met ? 'sc' : 'md', 0, 0, -0.003, 1, 1, 14)
    anello(c, r * 1.2, 0.0065, 'hi', 0, 0, 0.002, 1, 1, 16)
    const g0 = gemma(c, s.gem, 0, 0, 0.004)
    for (const [x, y] of giro(4, r * 1.7, PI / 4)) gemma(c, [s.gem[0], mescola(s.gem[1], 0xffffff, 0.2), r * 0.38], x, y, 0.004)
    for (const sg of [-1, 1]) {                                                      // le due punte dorate ai lati
      c.p(con(0.011, 0.05, 4), 0xe8b83e, sg * (r * 1.9 + 0.022), 0, 0, { rz: -sg * PI / 2 })
      c.f.metti(con(0.011, 0.05, 4), 0xf4c542, sg * (r * 1.9 + 0.022), 0, 0, { rz: -sg * PI / 2 }, 'oro')
    }
    c.top = r * 2; c.bot = -r * 2; c.W = r * 3; c.punti = giro(6, r * 1.4).map(p => [p[0], p[1], 0.01])
    return occhiello(c, r * 1.9)
  },
  croce (c, s) {
    const a = 0.014, br = 0.056, sup = 0.07, inf = 0.115, sp = 0.014
    const pts = [[-a, sup], [a, sup], [a, br * 0.45], [br, br * 0.45], [br + 0.012, br * 0.45 + 0.01], [br + 0.012, -br * 0.45 + 0.005], [a * 0.9, -br * 0.45 + 0.01], [a * 0.5, -inf], [-a * 0.5, -inf], [-a * 0.9, -br * 0.45 + 0.01], [-br - 0.012, -br * 0.45 + 0.005], [-br - 0.012, br * 0.45 + 0.01], [-br, br * 0.45], [-a, br * 0.45]]
    c.m(poli(pts, sp, 0.003), 'md', 0, -0.02, 0)
    c.m(poli([[-0.004, sup - 0.006], [0.004, sup - 0.006], [0.004, -inf + 0.02], [-0.004, -inf + 0.02]], sp, 0.001), 'hi', 0, -0.02, 0.004)
    c.m(poli([[-br, 0.003], [br, 0.003], [br, -0.003], [-br, -0.003]], sp, 0.001), 'hi', 0, br * 0.45 - 0.02 - 0.0, 0.004)
    gemma(c, s.gem, 0, br * 0.45 - 0.02 - 0.0, sp / 2 + 0.002)
    for (const [x, y] of [[0, sup - 0.018], [br + 0.003, br * 0.45 - 0.02 + 0.0], [-br - 0.003, br * 0.45 - 0.02]]) c.m(sfe(0.006, 5, 4), 'hi', x, y - 0.0, sp / 2 + 0.002)
    c.top = sup - 0.02; c.bot = -inf - 0.02; c.W = br + 0.012; c.punti = [[0, -0.07, 0.01], [0, -0.04, 0.01]]
    return occhiello(c, sup - 0.02 - 0.003)
  },
  teschio (c, s) {
    const os = s.bone ? 'pieno' : 'md', col = s.bone ? c.M.md : c.M.md, ombra = 0x14101a, crepa = s.crepe
    const cr = crepa ? new THREE.IcosahedronGeometry(0.066, 1) : new THREE.SphereGeometry(0.066, 12, 8)
    c.m(cr, 'md', 0, 0.02, 0, { s: [1.02, 0.96, 0.9] })
    c.m(sca(0.07, 0.04, 0.062), 'md', 0, -0.04, -0.002)                                 // la mascella
    c.m(sca(0.074, 0.016, 0.066), 'sc', 0, -0.026, -0.002)
    for (let i = -2; i <= 2; i++) c.p(sca(0.004, 0.026, 0.004), ombra, i * 0.0125, -0.052, 0.03)
    for (const sg of [-1, 1]) {
      c.p(sfe(0.0195, 8, 6), ombra, sg * 0.026, 0.012, 0.045, { s: [1, 1.1, 0.7] })      // le orbite
      c.m(sfe(0.01, 5, 4), 'hi', sg * 0.056, -0.012, 0.022, { s: [1, 1.3, 0.8] })        // gli zigomi
    }
    c.p(con(0.01, 0.022, 3), ombra, 0, -0.016, 0.054, { rx: PI })                       // il naso
    if (crepa) { c.p(sca(0.004, 0.036, 0.004), ombra, 0.012, 0.062, 0.05, { rz: 0.5 }); c.p(sca(0.003, 0.03, 0.003), ombra, -0.038, 0.034, 0.052, { rz: -0.3 }); c.p(sca(0.012, 0.012, 0.01), 0x7a5a24, -0.05, 0.05, 0.04) }
    // la luce negli occhi (la morte)
    for (const sg of [-1, 1]) {
      const e = c.f.libero(sfe(0.0135, 7, 5), s.occhi, sg * 0.026, 0.012, 0.053, 1.0)
      e.scale.set(1, 1.15, 0.65)
      const ph = sg * 1.3 + hash(c.s) * 6
      c.an.push(t => { e.material.emissiveIntensity = 1.0 + 0.5 * Math.sin(t * 3 + ph); const k = 1 + 0.12 * Math.sin(t * 2.2 + ph); e.scale.set(k, 1.15 * k, 0.65) })
      c.f.libero(sfe(0.006, 4, 3), 0xd8ffe6, sg * 0.026 + 0.003, 0.016, 0.062, 1.2)   // il punto più luminoso della pupilla
    }
    c.top = 0.09; c.bot = -0.07; c.W = 0.07
    c.m(sfe(0.01, 6, 4), 'sc', 0, 0.086, -0.002); c.m(toro(0.0125, 0.004, 4, 8), 'hi', 0, 0.097, 0)
    c.punti = []
    return 0.097 + 0.0125 * 2.3
  }
}

// ── il caso delle foglie: una foglia a goccia piatta, appesa a un punto ──
function foglia (c, x, y, L, s, col, rz = 0) {
  const g = new THREE.SphereGeometry(1, 6, 4); g.scale(L * 0.42, L, L * 0.1)
  const m = c.f.libero(g, col, x, y, 0.012, 0.28); m.rotation.z = rz
  c.f.asta([x - Math.sin(rz) * L * 0.1, y - Math.cos(rz) * L * 0.9 * -1, 0.008], [x + Math.sin(rz) * L * 0.1, y + Math.cos(rz) * L * -1, 0.008], 0.0025, 0.0018, 0x2a6a30, 'pieno', 4)
  const ph = hash(c.s + x * 100) * 6
  c.an.push(t => { m.rotation.z = rz + 0.12 * Math.sin(t * 1.4 + ph) })
  return m
}

// ══════════ gli anelli ══════════
function anelloDito (c, s) {
  const R = 0.04, M = c.M, gm = s.gem, r = gm[2], giri = s.giri, y0 = 0.012, y1 = -0.078
  // la testa
  const yt = 0.034
  if (s.rig === 'cornice') {
    c.m(cil(r * 1.65, r * 1.8, 0.016, 8), 'hi', 0, yt, R + 0.004, { rx: PI / 2, ry: PI / 8 })
    c.m(cil(r * 1.35, r * 1.35, 0.019, 8), 'md', 0, yt, R + 0.004, { rx: PI / 2, ry: PI / 8 })
    for (const [x, y] of giro(8, r * 1.55, PI / 8)) c.f.metti(sfe(0.0065, 5, 4), 0xffffff, x, yt + y, R + 0.014, {}, 'luce')
  } else if (s.rig === 'ghiaccio') {
    for (const [sg, a] of [[-1, 0.6], [1, -0.6], [-1, 1.1], [1, -1.1]]) c.f.metti(cristallo(0.0085, 0.052, 5), 0xc8f2ff, sg * (r * 1.3 + 0.004 * a * sg), yt + (Math.abs(a) < 0.8 ? 0.013 : -0.012), R - 0.001, { rz: a, s: [1, 1, 0.8] }, 'metallo')
    c.m(cil(r * 1.1, r * 1.25, 0.014, 6), 'sc', 0, yt, R, { rx: PI / 2 })
  } else if (s.rig === 'foglie') {
    c.m(cil(r * 1.25, r * 1.4, 0.015, 10), 'sc', 0, yt, R + 0.004, { rx: PI / 2 })
    c.m(toro(r * 1.32, 0.006, 4, 12), 'hi', 0, yt, R + 0.012)
    for (const sg of [-1, 1]) for (const k of [0, 1]) { const m = foglia(c, sg * (r * 1.7 + k * 0.014), yt - 0.004 + k * 0.014, 0.022, 1, k ? 0x4fcf5a : 0x2f9e44, -sg * (0.8 + k * 0.5)); m.position.z = R + 0.004 }
  } else {
    c.m(cil(r * 1.2, r * 1.3, 0.014, 8), 'sc', 0, yt, R + 0.003, { rx: PI / 2 })
    c.m(toro(r * 1.22, 0.0055, 4, 12), 'hi', 0, yt, R + 0.01)
    for (const [x, y] of giro(4, r * 1.25, PI / 4)) c.f.fila([[x * 1.05, yt + y * 1.05, R + 0.005], [x * 0.55, yt + y * 0.55, R + 0.03]], 0.0065, 0.0022, M.hi, M.t, 4)
  }
  const g = gemma(c, gm, 0, yt, R + 0.014)
  // le spalle e la spirale sotto
  const sp = s.spira ? null : M
  const N = Math.round(giri * 9), pts = []
  for (let k = 0; k <= N; k++) { const a = k / N * giri * 2 * PI; pts.push([Math.sin(a) * R, y0 + (y1 - y0) * (k / N) ** 0.95, Math.cos(a) * R]) }
  if (s.spira) c.f.fila(pts, 0.0072, 0.0072, s.spira, 'luce', 5); else c.f.fila(pts, 0.0072, 0.0072, M.md, M.t, s.rig === 'ghiaccio' ? 4 : 5)
  // la fascia piena subito sotto la testa (un anello vero, doppio)
  c.m(toro(R, 0.0075, 5, 18), 'hi', 0, y0 + 0.002, 0, { rx: PI / 2 })
  c.m(toro(R, 0.0075, 5, 18), 'sc', 0, y1, 0, { rx: PI / 2 })
  for (const sg of [-1, 1]) c.f.asta([sg * 0.012, yt - 0.008, R + 0.004], [sg * R * 0.98, y0 + 0.002, R * 0.1], 0.0075, 0.0075, M.hi, M.t, 5)
  c.top = yt + r * 1.5; c.bot = y1; c.W = 0.06; c.k = 0.5
  c.punti = []
  return 0
}

// ══════════ la catenella ══════════
function catena (c, [tipo, col, sp = 1]) {
  const f = new Fucina(), L = 0.34, W = 0.15, ph = hash(c.s) * 6
  const pt = (u, sg) => [sg * W * u, L * u, -0.004 * u]
  for (const sg of [-1, 1]) {
    if (tipo === 'cordino' || tipo === 'sinuoso') {
      const pts = []
      for (let i = 0; i <= 8; i++) {
        const u = i / 8, p = pt(u, sg), w = tipo === 'sinuoso' ? 0.012 * Math.sin(u * 14 + ph) * Math.sin(u * PI) : 0.003 * Math.sin(u * 9 + ph)
        pts.push([p[0] + w * 0.8, p[1], p[2] + (tipo === 'sinuoso' ? 0.01 * Math.sin(u * 14 + ph + 1) : 0)])
      }
      f.fila(pts, 0.0058, 0.0058, col, 'pieno', 4)
      for (const i of [2, 4, 6]) { const p = pts[i]; f.metti(sfe(0.0072, 5, 4), mescola(col, 0x000000, 0.25), p[0], p[1], p[2], { s: [1, 1.4, 1] }, 'pieno') }
    } else {
      const sp0 = tipo === 'grosse' ? 0.04 : tipo === 'perline' ? 0.026 : 0.027, n = Math.floor(L * 1.05 / sp0)
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n, p = pt(u, sg), a = Math.atan2(sg * W, L)
        if (tipo === 'grosse') f.metti(toro(0.019, 0.0062, 3, 5), col, p[0], p[1], p[2], { rz: -a, ry: i % 2 ? PI / 2 : 0, s: [0.8, 1.45, 1] }, 'oro')
        else if (tipo === 'perline') f.metti(ott(0.0095), col, p[0], p[1], p[2], {}, 'pieno')
        else f.metti(sca(0.0135, 0.0245, 0.0045), col, p[0], p[1], p[2], { rz: -a, ry: i % 2 ? PI / 2 : 0 }, 'oro')
      }
    }
  }
  const g = f.chiudi()
  g.userData.nome = 'catena'
  return g
}

// ══════════ le fiamme a lingue ══════════
// una lingua è un profilo piatto a goccia con la punta piegata, sovrapposta a una più piccola e più chiara: fiamme, non coni. Origine alla base.
const PROFILO_FIAMMA = [[-0.42, 0.12], [-0.28, 0.0], [0, -0.04], [0.3, 0.0], [0.46, 0.14], [0.44, 0.38], [0.3, 0.6], [0.2, 0.8], [0.06, 1.0], [-0.1, 0.78], [-0.2, 0.7], [-0.38, 0.52], [-0.46, 0.3]]
let geoFiamma = null
const lingua = () => {
  if (!geoFiamma) { geoFiamma = nuda(new THREE.ShapeGeometry(new THREE.Shape(PROFILO_FIAMMA.map(p => new THREE.Vector2(p[0], p[1]))))) }
  return geoFiamma
}
/** Fiamme a lingue sovrapposte nei punti `basi`: `col` esterna, media e interna; guizzano ognuna per conto suo. */
function fiammeLingue (f, basi, { h = 0.06, w = 0.03, col = [0xe62a08, 0xff7410, 0xffd02a] } = {}) {
  const l = basi.map((b, i) => ({ b, i, m: [[1, 1, 0], [0.68, 0.72, 0.004], [0.36, 0.5, 0.008]].map(([kw, kh, dz], j) => { const m = f.libero(lingua(), col[j], b[0], b[1], b[2] + dz, 0.85 + j * 0.2); m.material.side = THREE.DoubleSide; m.userData.k = [kw, kh]; return m }) }))
  return t => { for (const { b, i, m } of l) m.forEach((q, j) => {
    const k = 0.78 + 0.3 * Math.sin(t * 7 + i * 1.9 + j * 0.9) + 0.1 * Math.sin(t * 16 + i + j)
    q.scale.set(w * q.userData.k[0] * (1.15 - 0.15 * k), h * q.userData.k[1] * k, 1)
    q.rotation.z = 0.2 * Math.sin(t * 5 + i * 2.3 + j * 0.6) - 0.05
  }) }
}

// ══════════ i motivi dell'elemento ══════════
function motivo (c) {
  const { f, el, fig, W, top, bot, k } = c, pr = fig.pregio, n = Math.min(4, pr + 1)
  const X = W * 0.95, Y = top * 0.6
  const gocce = (hex) => {
    const gs = Array.from({ length: Math.min(3, pr) }, (_, i) => {
      const g = mergeGeometries([nuda(new THREE.SphereGeometry(0.0085, 6, 4)), (() => { const q = nuda(new THREE.ConeGeometry(0.0075, 0.02, 5)); q.translate(0, 0.0125, 0); return q })()])
      return { m: f.libero(g, hex, (i - (Math.min(3, pr) - 1) / 2) * 0.028, bot, 0.01, 1.2), i }
    })
    c.an.push(t => { for (const { m, i } of gs) { const u = (t * 0.45 + i * 0.37) % 1; m.position.y = bot * 0.8 - u * 0.075; m.scale.setScalar(Math.min(1, u * 5) * (1 - u * u)) } })
  }
  switch (fig.elemento) {
    case 'fuoco': c.an.push(fiammeLingue(f, (c.sch.f === 'anello' ? [[-0.062, 0.03, 0.046], [0.062, 0.03, 0.046], [0, 0.088, 0.05]] : [[-X * 0.45, Y * 0.35, -0.012], [X * 0.45, Y * 0.35, -0.012], [0, Y * 0.62, -0.014]]).slice(0, Math.min(3, n)), { h: 0.085 * (k < 1 ? 0.8 : 1), w: 0.038 })); break
    case 'ghiaccio':
      for (const [x, y, a, L] of [[-X, -bot * 0 - Y * 0.1, 1.2, 0.05], [X, -Y * 0.1, -1.2, 0.05], [-X * 0.5, bot * 0.9, 0.35, 0.044], [X * 0.5, bot * 0.9, -0.35, 0.044]].slice(0, n)) {
        const sg = x < 0 ? -1 : 1
        f.metti(cristallo(0.0085, L, 5), el.colore2, x * 1.0, y, 0, { rz: a * (y < 0 ? -1 : 1) * sg * -1 + (y < 0 ? PI : 0) * 0 }, 'luce')
      }
      c.an.push(braci(f, el.colore2, [-W, bot * 0.6, 0.01], [2 * W, top * 1.4, 0.02], { n: 3, vel: 0.2, r: 0.01, sale: 0.03 })); break
    case 'veleno': gocce(el.colore); break
    case 'sangue': gocce(0xd01020)
      for (const sg of [-1, 1]) f.metti(con(0.007, 0.036, 4), 0x7a0a12, sg * X * 1.05, bot * 0.5, 0, { rz: sg * 1.9 }, 'pieno'); break
    case 'luce':
      for (let i = 0; i < 10; i++) { const a = i * PI / 5 + 0.15, R = Math.max(W, top) * 1.12; f.metti(con(0.006, 0.026 + (i % 2) * 0.016, 4), el.colore2, Math.cos(a) * R, Math.sin(a) * R, -0.004, { rz: a - PI / 2 }, 'luce') }
      break
    case 'ombra': c.an.push(braci(f, 0xa860e8, [-W, bot * 0.9, -0.02], [2 * W, top * 0.5, 0.05], { n: 5, vel: 0.35, r: 0.015, sale: 0.09 })); break
    case 'arcano': c.an.push(orbita(f, el.colore2, [0, 0, 0], Math.max(W, top) * 1.15 + 0.01, { n: 3, vel: 1.3, r: 0.012, inc: 0.7 })); if (pr >= 4) c.an.push(orbita(f, el.colore, [0, 0, 0], Math.max(W, top) * 1.3, { n: 2, vel: -1.0, r: 0.01, inc: -0.5 })); break
    case 'natura':
      if (c.sch.extra !== 'foglia' && c.sch.f !== 'anello') { foglia(c, -X * 1.02, -top * 0.35, 0.026, 1, 0x4fc85a, 0.9); if (pr >= 3) foglia(c, X * 1.02, -top * 0.5, 0.022, 1, 0x7fe070, -0.9) }
      c.an.push(braci(f, 0xb8f08a, [-W, bot * 0.5, 0.01], [2 * W, top, 0.03], { n: 2, vel: 0.25, r: 0.008, sale: 0.06 })); break
    case 'acqua':
      for (let i = 0; i < Math.min(3, pr); i++) { const x = (i - (Math.min(3, pr) - 1) / 2) * 0.026; c.p(sfe(0.0095, 7, 5), 0xe4f6ff, x, bot - 0.014 + (i === 1 ? -0.01 : 0), 0.004); c.f.metti(ott(0.003), 0xffffff, x - 0.003, bot - 0.01 + (i === 1 ? -0.01 : 0), 0.012, {}, 'luce') }
      c.an.push(braci(f, el.colore2, [-W * 0.8, bot * 0.5, 0.01], [1.6 * W, top, 0.03], { n: 4, vel: 0.3, r: 0.009, sale: 0.09, geo: () => sfe(1, 6, 4) })); break
    case 'morte': c.an.push(braci(f, el.colore, [-W, bot * 0.8, -0.01], [2 * W, top * 0.8, 0.05], { n: 4, vel: 0.28, r: 0.014, sale: 0.1 })); break
    case 'oro': c.an.push(braci(f, el.colore2, [-W, bot, 0.01], [2 * W, top * 2, 0.03], { n: 3, vel: 0.3, r: 0.01, sale: 0.05 })); break
    default:
  }
}

// ══════════ crea ══════════
export function crea (figura) {
  const sch = SCHEDE[figura.id]
  if (!sch) throw new Error(`gioiello sconosciuto: ${figura.id}`)
  const c = contesto(figura, sch), anelloQ = sch.f === 'anello'
  const yCat = anelloQ ? anelloDito(c, sch) : MONTATURE[sch.f](c, sch)
  if (!anelloQ) borchie(c)
  motivo(c)
  const g = new THREE.Group(), dentro = c.f.chiudi()
  g.add(dentro)
  let tri = dentro.userData.triangoli
  g.userData.famiglia = 'amuleto'
  g.userData.tipo = anelloQ ? 'anello' : 'collana'
  g.userData.figura = figura.id
  const sw = hash(c.s + 17) * 6
  if (!anelloQ) {
    const cat = catena(c, sch.cat); cat.position.y = yCat; g.add(cat)
    tri += cat.userData.triangoli; g.userData.catena = cat
    g.userData.catenaY = yCat
  }
  g.userData.triangoli = tri
  g.userData.anima = t => {
    for (const f of c.an) f(t)
    if (!anelloQ) dentro.rotation.z = 0.025 * Math.sin(t * 1.1 + sw)               // il ciondolo dondola appena
  }
  return g
}

// ══════════ indossa: la collana al collo dell'eroe ══════════
const eroiPortati = new WeakMap()
/** Quanto sporge davanti il busto vestito (barba, corazza, pettorali) fra le altezze y0 e y1, vicino al centro: lì deve pendere il ciondolo. */
function fronte (eroe, y0, y1, g0) {
  const u = eroe.userData, busto = u.busto, cassa = busto.children[0].geometry.parameters
  eroe.updateMatrixWorld(true)
  const meshes = []
  busto.traverse(o => {
    if (!o.isMesh || !o.visible) return
    for (let p = o.parent; p; p = p.parent) if (u.bracci.includes(p) || p === g0) return
    meshes.push(o)
  })
  // raggi dal davanti verso il petto, a più altezze e a tre scarti laterali: la superficie vera (la punta della barba, la pancia), non lo scatolone di una mesh intera
  const rc = new THREE.Raycaster(), inv = busto.matrixWorld.clone().invert(), p0 = new THREE.Vector3(), d = new THREE.Vector3(0, 0, -1).transformDirection(busto.matrixWorld), v = new THREE.Vector3()
  let z = cassa.depth / 2
  for (let i = 0; i <= 5; i++) for (const x of [-0.04, 0, 0.04]) {
    p0.set(x, y0 + (y1 - y0) * i / 5, 1).applyMatrix4(busto.matrixWorld)
    rc.set(p0, d)
    const h = rc.intersectObjects(meshes, false)[0]
    if (h) { v.copy(h.point).applyMatrix4(inv); if (v.z > z) z = Math.min(v.z, cassa.depth / 2 + 0.5) }
  }
  return z
}
export function indossa (eroe, figura) {
  const g = crea(figura)
  if (g.userData.tipo === 'anello') return () => {}
  const busto = eroe.userData.busto, cassa = busto.children[0].geometry.parameters, th = cassa.height, td = cassa.depth, tw = cassa.width
  const sc = Math.min(1.7, Math.max(1.1, tw / 0.3))
  const catena = g.userData.catena, yC = g.userData.catenaY
  const lungo = Math.max(0.08, th * 0.3)                                             // quanto sta la catena sul petto
  g.scale.setScalar(sc)
  const yP = th - lungo - yC * sc                                                    // dove sta il ciondolo
  // il ciondolo poggia dove il busto sporge DAVVERO alla sua altezza (la barba e la pancia, non i baffi più in alto); la catena risale al collo inclinando il tutto
  const zP = fronte(eroe, yP - th * 0.07, yP + th * 0.07, g) + 0.028, zC = Math.min(zP, fronte(eroe, th * 0.82, th, g) + 0.02)
  g.position.set(0, yP, zP)
  g.rotation.x = -Math.atan2(Math.max(0, zP - zC), yC * sc + lungo)
  catena.scale.set(Math.min(0.62, tw * 0.3 / (0.15 * sc)), lungo / (0.34 * sc), 1)
  busto.add(g)
  const togli = () => { busto.remove(g) }
  togli.gruppo = g
  return togli
}
export const stampaGioielli = () => FIGURE.map(f => f.id)

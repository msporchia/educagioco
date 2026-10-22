// Generato da strumenti/promuovi-3d.mjs da poc/roba-3d/lame.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Le lame in 3D, una figura del catalogo alla volta: le 36 `spada-*` e le 10 `ascia-*` di roba.json (spade, falcioni, scimitarre, pugnali,
// armi d'asta, asce, martelli, tridente). Ogni `cosa` ha una forma-base parametrica (profilo della lama, guardia, presa, pomo, testa); ogni
// figura la declina con i suoi dati: colori e dettagli dalla descrizione, materia dalla palette comune, elemento (luce, gemme, motivi) e pregio
// (ornamenti, bagliore). Funzione PURA della figura: lo stesso id dà sempre lo stesso modello (il seme viene dall'id).
// Orientamento: origine nel pugno, lama/testa verso +y, i piani piatti della lama verso ±z, il filo delle asce verso +x.
import * as THREE from 'three'
import { Fucina, C, sca, cil, con, sfe, ott, ico, toro, poli, cristallo, PIATTA, anima, respira, fiamme, braci, orbita, lampo, pulsaLibero } from './fucina.js'
import { MATERIE, ELEMENTI, PREGIO } from './palette.js'
import roba from './catalogo-roba.js'

export const FIGURE = roba.figure.filter(f => /^(spada|ascia)-/.test(f.id))
export const ARCHETIPI = [...new Set(FIGURE.map(f => f.cosa))]

// ── piccoli attrezzi ──
const semeDa = id => { let h = 2166136261; for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0 }
const rnd = (seme, i) => { const x = Math.sin((seme % 9973) * 12.9898 + i * 78.233) * 43758.5453; return x - Math.floor(x) }
const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t).getHex()
const frac = x => x - Math.floor(x)
const tri = x => Math.abs(frac(x) * 2 - 1) * 2 - 1                                            // onda a triangolo -1..1

// ── i percorsi della lama: u∈[0,1] → [x,y] ──
const retto = (y0, L, cx = null) => u => [cx ? cx(u) : 0, y0 + L * u]
const arco = (y0, L, A) => u => { const th = A * u, R = L / A; return [R * (1 - Math.cos(th)), y0 + R * Math.sin(th)] }

/** Il profilo di una lama lungo `path`: larghezza `w` (in punta `w2`), punta di un certo tipo, `asim` sbilancia il filo (+x), `extra(sg,s)` aggiunge denti. */
function profilo (p) {
  const { path, L, w, w2 = w, punta = 'acuta', pl = 0.12, asim = 0, N = 16, larg = null, extra = null, bp = [] } = p
  const ub = Math.max(0.5, 1 - pl / L)
  const norm = (A, B) => { const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l] }
  const fr = u => { const A = path(Math.max(0, u - 0.002)), B = path(Math.min(1, u + 0.002)), t = norm(A, B); return { P: path(u), t, n: [t[1], -t[0]] } }
  const mezza = s => (w / 2) * (1 + (w2 / w - 1) * s) * (larg ? larg(s) : 1)
  const lato = sg => {
    const ss = new Set(Array.from({ length: N + 1 }, (_, i) => i / N)); for (const b of bp) if (b >= 0 && b <= 1) ss.add(b)
    return [...ss].sort((a, b) => a - b).map(s => {
      const { P, n } = fr(s * ub), h = mezza(s) * (1 + sg * asim) + (extra ? extra(sg, s) : 0)
      return [P[0] + sg * n[0] * h, P[1] + sg * n[1] * h]
    })
  }
  const R = lato(1), S = lato(-1)
  const f = fr(ub), hF = mezza(1)
  let cima = []
  if (punta === 'acuta' || punta === 'lancia') cima = [path(1)]
  else if (punta === 'obliqua') R[R.length - 1] = [R[R.length - 1][0] + f.t[0] * pl, R[R.length - 1][1] + f.t[1] * pl]
  else if (punta === 'tonda') { for (let i = 1; i < 6; i++) { const a = Math.PI * i / 6, c = Math.cos(a), s = Math.sin(a); cima.push([f.P[0] + f.n[0] * hF * c + f.t[0] * hF * s * 1.1, f.P[1] + f.n[1] * hF * c + f.t[1] * hF * s * 1.1]) } }
  else if (punta === 'forca') {
    R.length = R.length; const q = (a, b) => [f.P[0] + f.n[0] * a + f.t[0] * b, f.P[1] + f.n[1] * a + f.t[1] * b]
    cima = [q(hF * 0.7, pl), q(hF * 0.18, pl * 0.32), q(-hF * 0.18, pl * 0.32), q(-hF * 0.7, pl)]
  }
  return { pts: [...R, ...cima, ...S.reverse()], ub, fr: s => fr(s * ub), mezza }
}
/** Una striscia lungo `path` (nervatura, vena, dorso): da s0 a s1 del corpo, larghezza `hw(s)`, spostata di `off`. */
function nastro (path, ub, s0, s1, hw, off = 0, N = 8) {
  const R = [], S = []
  for (let i = 0; i <= N; i++) {
    const s = s0 + (s1 - s0) * i / N, u = s * ub, A = path(Math.max(0, u - 0.002)), B = path(Math.min(1, u + 0.002))
    const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1, n = [dy / l, -dx / l], P = path(u), h = typeof hw === 'function' ? hw(s) : hw, o = typeof off === 'function' ? off(s) : off
    R.push([P[0] + n[0] * (o + h), P[1] + n[1] * (o + h)]); S.push([P[0] + n[0] * (o - h), P[1] + n[1] * (o - h)])
  }
  return [...R, ...S.reverse()]
}
// i denti: `extra` e i punti di rottura da campionare
const sega = ({ n = 8, amp = 0.015, lati = [1], da = 0.2, a = 0.98, verso = 1 }) => ({
  extra: (sg, s) => lati.includes(sg) && s >= da && s <= a ? amp * (verso > 0 ? 1 - frac(s * n + 1e-6) : frac(s * n + 1e-6)) : 0,
  bp: Array.from({ length: n + 1 }, (_, k) => [k / n, k / n - 1e-4, k / n + 1e-4]).flat()
})
const sbrecciata = ({ amp = 0.02, lati = [1, -1], seme = 1, N = 26, da = 0.12 }) => ({
  extra: (sg, s) => lati.includes(sg) && s > da ? amp * (rnd(seme + (sg > 0 ? 0 : 50), Math.round(s * N)) - 0.35) : 0,
  bp: Array.from({ length: N + 1 }, (_, i) => i / N)
})
const tacche = (lista, sgn = -1) => ({
  extra: (sg, s) => { if (sg !== sgn) return 0; for (const [a, b, d] of lista) if (s >= a && s <= b) return -d; return 0 },
  bp: lista.flatMap(([a, b]) => [a - 1e-4, a, b, b + 1e-4])
})

// ── elsa: guardia, presa, pomo ──
function presa (f, { y0, y1 = 0.05, r = 0.024, col = C.CUOIO, fasce = C.CUOIO_S, tipo = 'fasce', n = 3, fcol = null }) {
  const h = y1 - y0, spessi = (cc, rr) => rr
  f.metti(cil(r, r * 1.02, h, 8), col, 0, (y0 + y1) / 2, 0)
  if (tipo === 'fasce') for (let i = 0; i < n; i++) f.metti(cil(r * 1.13, r * 1.13, 0.014, 8), fasce, 0, y0 + h * (i + 0.5) / n, 0)
  else if (tipo === 'perline') for (let i = 0; i < n; i++) for (const sz of [-1, 1]) f.metti(sfe(r * 0.55, 5, 3), fcol ?? fasce, 0, y0 + h * (i + 0.5) / n, sz * r * 0.95, {}, fcol ? 'luce' : 'pieno')
  else if (tipo === 'righe') for (let i = 0; i < n * 2; i++) f.metti(sca(r * 2.3, 0.01, r * 2.3), fasce, 0, y0 + h * (i + 0.5) / (n * 2), 0, { ry: 0.4 })
  else if (tipo === 'anello') { f.metti(toro(r * 1.5, r * 0.4, 5, 10), fasce, 0, y0 + 0.03, 0, { rx: PIATTA }); f.metti(cil(r * 1.12, r * 1.12, 0.012, 8), fasce, 0, y1 - 0.04, 0) }
}
function pomo (f, { tipo = 'sfera', col = C.OTTONE, y = -0.17, r = 0.036, met = 'oro', luce = null }) {
  if (tipo === 'sfera') f.metti(sfe(r, 8, 6), col, 0, y, 0, {}, met)
  else if (tipo === 'disco') f.metti(cil(r * 1.3, r * 1.3, 0.03, 10), col, 0, y, 0, {}, met)
  else if (tipo === 'goccia') { f.metti(sfe(r * 0.9, 8, 6), col, 0, y, 0, { s: [1, 1.15, 1] }, met); f.metti(con(r * 0.7, r * 1.8, 6), col, 0, y - r * 1.5, 0, { rx: Math.PI }, met) }
  else if (tipo === 'anello') f.metti(toro(r * 1.1, r * 0.34, 5, 12), col, 0, y - 0.01, 0, {}, met)
  else if (tipo === 'cristallo') f.metti(cristallo(r * 0.8, r * 3, 5), col, 0, y - 0.02, 0, {}, met)
  else if (tipo === 'punta') f.metti(con(r * 0.8, r * 3, 6), col, 0, y - r * 1.2, 0, { rx: Math.PI }, met)
  if (luce) f.metti(ott(r * 0.55), luce, 0, y, r * 0.8, { s: [1, 1.2, 0.8] }, 'luce')
}
function gemma (f, pos, col, forma = 'rombo', r = 0.026) {
  f.metti(ott(r), col, pos[0], pos[1], pos[2], { s: forma === 'rombo' ? [0.9, 1.35, 0.7] : [1, 1, 0.8] }, 'luce')
}
/** La guardia, centrata in (0, gy). `g`: tipo, larg, col, gemma, pomelli, ... */
function guardia (f, g, gy) {
  const { tipo = 'dritta', larg = 0.28, col = C.ORO_S, col2 = null, met = 'oro', pomelli = false, spes = 0.05, sfere = false, ricco = 0 } = g
  const s2 = col2 ?? col
  const asta = (a, b, r1, r2, cc = col, seg = 5) => f.asta(a, b, r1, r2, cc, met, seg)
  switch (tipo) {
    case 'dritta': case 'larga':
      f.metti(sca(larg, spes * 0.62, spes), col, 0, gy, 0, {}, met)
      f.metti(sca(0.06, spes * 0.8, spes * 1.25), s2, 0, gy, 0, {}, met)
      if (pomelli) for (const s of [-1, 1]) f.metti(sfe(spes * 0.62, 6, 4), s2, s * (larg / 2 + 0.005), gy, 0, {}, met)
      break
    case 'sottile':
      f.metti(sca(larg, spes * 0.4, spes * 0.7), col, 0, gy, 0, {}, met)
      f.metti(sca(0.05, spes * 0.6, spes * 0.9), s2, 0, gy, 0, {}, met)
      break
    case 'ricurva':
      f.metti(sca(larg, spes * 0.4, spes * 0.7), col, 0, gy, 0, {}, met)
      f.metti(sca(0.05, spes * 0.6, spes * 0.9), s2, 0, gy, 0, {}, met)
      for (const s of [-1, 1]) {
        f.fila([[s * larg / 2, gy, 0], [s * (larg / 2 + 0.025), gy + 0.03, 0], [s * (larg / 2 + 0.02), gy + 0.075, 0]], 0.014, 0.007, col, met, 5)
        f.metti(con(0.012, 0.04, 4), col, s * (larg / 2 + 0.012), gy + 0.1, 0, { rz: -s * 0.3 }, met)
      }
      break
    case 'spiovente':
      f.metti(sca(0.07, spes, spes * 1.2), s2, 0, gy, 0, {}, met)
      for (const s of [-1, 1]) { asta([s * 0.03, gy + 0.012, 0], [s * larg / 2, gy - 0.055, 0], spes * 0.5, spes * 0.36, col, 5); f.metti(sfe(spes * 0.4, 5, 4), s2, s * larg / 2, gy - 0.058, 0, {}, met) }
      break
    case 'sagomata': {
      const h = larg / 2
      f.metti(poli([[-h, gy + 0.045], [-h * 0.8, gy + 0.012], [-0.05, gy + 0.005], [-0.035, gy + 0.045], [0.035, gy + 0.045], [0.05, gy + 0.005], [h * 0.8, gy + 0.012], [h, gy + 0.045], [h * 0.9, gy - 0.025], [0.03, gy - 0.03], [-0.03, gy - 0.03], [-h * 0.9, gy - 0.025]], spes * 0.9, 0.004), col, 0, 0, 0, {}, met)
      f.metti(sca(0.06, 0.07, spes * 1.2), s2, 0, gy, 0, {}, met)
      break
    }
    case 'ancora': {
      f.metti(sca(0.07, 0.045, spes * 1.2), s2, 0, gy + 0.005, 0, {}, met)
      f.metti(sca(larg * 0.55, 0.018, spes * 0.8), col, 0, gy + 0.03, 0, {}, met)
      const R = larg / 2, pts = Array.from({ length: 7 }, (_, i) => { const a = Math.PI * (1 + i / 6); return [Math.cos(a) * R, gy + 0.045 + Math.sin(a) * R * 0.8 + R * 0.55, 0] })
      for (const s of [1]) f.fila(pts, 0.016, 0.016, col, met, 5)
      for (const s of [-1, 1]) f.metti(con(0.026, 0.07, 4), col, s * R, gy + 0.045 + R * 0.55 + 0.03, 0, { rz: -s * 0.55 }, met)
      break
    }
    case 'artigli':
      f.metti(sca(0.07, 0.05, spes * 1.2), s2, 0, gy, 0, {}, met)
      for (const s of [-1, 1]) {
        f.fila([[s * 0.04, gy + 0.01, 0], [s * 0.1, gy + 0.03, 0], [s * 0.15, gy - 0.01, 0], [s * 0.155, gy - 0.07, 0]], 0.022, 0.009, col, met, 5)
        f.metti(con(0.012, 0.07, 4), col, s * 0.15, gy - 0.1, 0, { rx: Math.PI, rz: s * 0.4 }, met)
      }
      break
    case 'croce':
      f.metti(sca(larg, spes * 0.8, spes * 1.1), col, 0, gy, 0, {}, met)
      f.metti(sca(0.1, 0.09, spes * 1.4), s2, 0, gy, 0, {}, met)
      for (const s of [-1, 1]) {
        f.metti(sfe(0.04, 7, 5), s2, s * (larg / 2 + 0.01), gy, 0, {}, met)
        f.metti(sfe(0.026, 6, 4), col, s * (larg / 2 - 0.07), gy + 0.045, 0, {}, met)
        f.metti(sfe(0.026, 6, 4), col, s * (larg / 2 - 0.07), gy - 0.045, 0, {}, met)
        f.metti(sca(0.02, 0.07, spes * 0.9), col, s * (larg / 2 - 0.12), gy, 0, {}, met)
      }
      break
    case 'punte': {
      f.metti(sca(0.1, 0.07, spes * 1.4), s2, 0, gy, 0, {}, met)
      f.metti(con(0.035, 0.075, 4), col, 0, gy - 0.07, 0, { rx: Math.PI }, met)
      for (const s of [-1, 1]) {
        asta([s * 0.04, gy, 0], [s * larg / 2, gy - 0.012, 0], spes * 0.42, spes * 0.32, col, 5)
        const n = 2 + ricco
        for (let i = 0; i < n; i++) { const x = s * (0.07 + (larg / 2 - 0.07) * (i + 0.4) / n); f.metti(con(0.02 + 0.004 * ricco, 0.07 + 0.03 * (i === n - 1 ? 1 : 0.4 + 0.2 * i) + 0.014 * ricco, 4), i % 2 ? col : s2, x, gy + 0.05 + 0.014 * i, 0, { rz: -s * 0.18 * (i + 1) }, met) }
        f.metti(sfe(0.024, 5, 4), s2, s * larg / 2, gy - 0.012, 0, {}, met)
      }
      break
    }
    case 'disco':
      f.metti(cil(larg / 2, larg / 2, 0.02, 12), col, 0, gy, 0, {}, met)
      f.metti(sca(0.05, 0.04, spes), s2, 0, gy, 0, {}, met)
      break
    case 'ornata':
      f.metti(sca(0.08, 0.07, spes * 1.3), s2, 0, gy, 0, {}, met)
      for (const s of [-1, 1]) {
        f.metti(poli([[s * 0.03, gy + 0.03], [s * 0.12, gy + 0.09], [s * 0.2, gy + 0.2], [s * 0.2, gy + 0.08], [s * 0.26, gy + 0.02], [s * 0.2, gy - 0.02], [s * 0.15, gy - 0.07], [s * 0.1, gy - 0.02], [s * 0.04, gy - 0.025]], spes * 0.6, 0.004), col, 0, 0, 0, {}, met)
        f.metti(ott(0.016), mix(col, 0xffffff, 0.5), s * 0.15, gy + 0.04, spes * 0.4, {}, 'luce')
      }
      break
    case 'coppa':
      f.metti(sfe(larg / 2, 10, 4), col, 0, gy, 0, { s: [1, 0.6, 1] }, met)
      break
  }
}

// ── l'elemento: luce, gemme, motivi. `X` descrive il corpo dell'arma (dove posare le cose) ──
function elemento (f, fig, X) {
  const K = fig.elemento, el = ELEMENTI[K], n = fig.pregio, seme = semeDa(fig.id), A = []
  const e = s => X.edge(s, (Math.round(s * 7 + seme) % 2) ? 1 : -1)
  const punti = k => Array.from({ length: k }, (_, i) => { const s = X.s0 + (X.s1 - X.s0) * (i + 0.6) / (k + 0.2); return e(s) })
  switch (K) {
    case 'fuoco': {
      X.vena(el.colore, 'viva', 0.1, 0.9, 0.012)
      A.push(fiamme(f, punti(2 + n), { h: 0.07 + 0.015 * n, r: 0.024, col: [el.colore, el.colore2, el.ombra] }))
      A.push(braci(f, el.colore2, [-X.hw - 0.04, X.cy0, -0.05], [X.hw * 2 + 0.08, X.cy1 - X.cy0, 0.1], { n: 4 + n * 2, vel: 0.5, r: 0.014, sale: 0.28 }))
      break
    }
    case 'ghiaccio': {
      X.vena(el.colore2, 'viva', 0.15, 0.85, 0.01)
      punti(2 + n).forEach((p, i) => f.metti(cristallo(0.016 + 0.004 * (i % 2), 0.1 + 0.03 * ((i + seme) % 3), 4), i % 2 ? el.colore2 : el.colore, p[0] * 1.02, p[1], 0, { rz: -Math.sign(p[0] || 1) * (0.7 + 0.2 * (i % 2)) }, 'metallo'))
      A.push(braci(f, el.colore2, [-X.hw - 0.05, X.cy0, -0.05], [X.hw * 2 + 0.1, X.cy1 - X.cy0 + 0.05, 0.1], { n: 5 + n * 2, vel: 0.3, r: 0.013, sale: -0.22 }))
      break
    }
    case 'fulmine': {
      X.vena(el.colore2, 'viva', 0.1, 0.9, 0.008)
      const a = X.cima ?? [0, X.cy1, 0]
      for (let i = 0; i < 1 + Math.ceil(n / 2); i++) { const p = e(0.25 + 0.2 * i + 0.05 * (seme % 3)); A.push(lampo(f, [p[0], p[1], 0.03], [p[0] + (i % 2 ? 0.14 : -0.14), p[1] + 0.2, 0.04], { seme: seme % 50 + i * 7, hex: el.colore2, scarto: 0.045 })) }
      A.push(braci(f, el.colore2, [-X.hw - 0.05, X.cy0, -0.05], [X.hw * 2 + 0.1, X.cy1 - X.cy0, 0.1], { n: 4 + n, vel: 0.8, r: 0.013, sale: 0.08 }))
      break
    }
    case 'veleno': {
      X.vena(el.colore, 'viva', 0.12, 0.85, 0.011)
      A.push(braci(f, el.colore, [-X.hw - 0.02, X.cy0 + 0.05, -0.03], [X.hw * 2 + 0.04, X.cy1 - X.cy0 - 0.05, 0.06], { n: 4 + 2 * n, vel: 0.35, r: 0.013, sale: -0.25, geo: () => sfe(1, 5, 4) }))
      for (let i = 0; i < n + 1; i++) { const p = e(0.3 + 0.17 * i); const m = f.libero(sfe(0.014 + 0.004 * (i % 2), 6, 4), el.colore2, p[0] * 1.04, p[1], 0.016, 1.3); A.push(pulsaLibero(m, 2.5 + i, 0.25, i)) }
      break
    }
    case 'luce': {
      X.vena(el.colore2, 'viva', 0.08, 0.9, 0.012)
      const g = X.gem
      for (let i = 0; i < 6 + 2 * n; i++) { const a = i * Math.PI * 2 / (6 + 2 * n); f.metti(con(0.012, i % 2 ? 0.035 : 0.06, 4), el.colore, g[0] + Math.cos(a) * 0.06, g[1] + Math.sin(a) * 0.06, 0.03, { rz: a - PIATTA }, 'luce') }
      const aureola = f.libero(toro(0.12 + 0.02 * n, 0.006, 4, 22), el.colore, g[0], X.cy0 + (X.cy1 - X.cy0) * 0.5, 0, 1.2)
      A.push(t => { const u = (t * 0.25) % 1; aureola.position.y = X.cy0 + (X.cy1 - X.cy0) * u; aureola.rotation.x = PIATTA; aureola.scale.setScalar(0.4 + 0.6 * Math.sin(u * Math.PI)); aureola.material.emissiveIntensity = 1.4 * Math.sin(u * Math.PI) })
      A.push(braci(f, el.colore2, [-X.hw - 0.05, X.cy0, -0.06], [X.hw * 2 + 0.1, X.cy1 - X.cy0, 0.12], { n: 6 + n * 2, vel: 0.4, r: 0.014, sale: 0.3 }))
      break
    }
    case 'ombra': {
      X.vena(el.colore2, 'viva', 0.12, 0.88, 0.008)
      A.push(braci(f, el.colore, [-X.hw - 0.03, X.cy0, -0.04], [X.hw * 2 + 0.06, X.cy1 - X.cy0, 0.08], { n: 5 + n * 2, vel: 0.22, r: 0.034, sale: 0.28, geo: () => ico(1) }))
      A.push(braci(f, el.colore2, [-X.hw - 0.05, X.cy0, -0.04], [X.hw * 2 + 0.1, X.cy1 - X.cy0, 0.08], { n: 3 + n, vel: 0.45, r: 0.011, sale: 0.25 }))
      break
    }
    case 'arcano': {
      X.vena(el.colore2, 'viva', 0.1, 0.9, 0.008)
      const c = X.centro(0.5)
      A.push(orbita(f, el.colore2, [c[0], c[1], 0], 0.12 + 0.01 * n, { n: 2 + n, vel: 1.2, r: 0.026, inc: 0.4, geo: () => new THREE.BoxGeometry(0.03, 0.045, 0.008) }))
      for (let i = 0; i < 3; i++) { const p = X.centro(0.3 + 0.2 * i); f.metti(sca(0.016, 0.004, 0.034), el.colore, p[0], p[1], 0, { rz: i * 0.6 }, 'luce'); f.metti(sca(0.004, 0.034, 0.034), el.colore, p[0] + 0.008 * (i - 1), p[1] + 0.008, 0, {}, 'luce') }
      break
    }
    case 'natura': {
      const { y0, y1, r } = X.presa
      f.fila(Array.from({ length: 11 }, (_, i) => { const a = i * 1.1, y = y0 + (y1 - y0) * i / 10; return [Math.cos(a) * r * 1.1, y, Math.sin(a) * r * 1.1] }), 0.007, 0.007, C.FOGLIA_S, 'pieno', 4)
      const g = X.gem
      for (let i = 0; i < 2 + n; i++) { const s = i % 2 ? 1 : -1; f.metti(con(0.022, 0.085, 4), i % 3 ? C.FOGLIA : C.NATURA, g[0] + s * (0.05 + 0.04 * (i >> 1)), g[1] + 0.03 + 0.01 * i, 0, { rz: -s * (0.9 + 0.2 * (i >> 1)), s: [1, 1, 0.3] }, 'pieno') }
      const p = e(0.4); f.metti(con(0.02, 0.07, 4), C.FOGLIA, p[0], p[1], 0.015, { rz: -Math.sign(p[0] || 1) * 1.1, s: [1, 1, 0.3] })
      A.push(braci(f, C.FOGLIA, [-X.hw - 0.04, X.cy0, -0.04], [X.hw * 2 + 0.08, X.cy1 - X.cy0, 0.08], { n: 4 + n * 2, vel: 0.2, r: 0.017, sale: -0.28, geo: () => con(1, 2, 4) }))
      break
    }
    case 'acqua': {
      X.vena(el.colore, 'viva', 0.1, 0.9, 0.01)
      const c = X.centro(0.5)
      A.push(orbita(f, el.colore2, [c[0], c[1], 0], 0.12, { n: 2 + n, vel: 1.1, r: 0.022, inc: 0.5, geo: () => sfe(0.022, 6, 4) }))
      A.push(braci(f, el.colore2, [-X.hw - 0.03, X.cy0, -0.04], [X.hw * 2 + 0.06, X.cy1 - X.cy0, 0.08], { n: 4 + n, vel: 0.3, r: 0.014, sale: -0.2, geo: () => sfe(1, 5, 4) }))
      break
    }
    case 'oro': {
      X.vena(C.ORO, 'oro', 0.08, 0.92, 0.01)
      for (let i = 0; i < 2 + n; i++) { const p = e(0.2 + 0.18 * i); f.metti(ott(0.014), C.ORO, p[0], p[1], 0.014, { s: [1, 1.5, 0.8] }, 'oro') }
      A.push(braci(f, 0xfff2b0, [-X.hw - 0.04, X.cy0, -0.05], [X.hw * 2 + 0.08, X.cy1 - X.cy0, 0.1], { n: 5 + n, vel: 0.3, r: 0.013, sale: 0.15 }))
      break
    }
    case 'sangue': {
      X.vena(el.colore, 'viva', 0.1, 0.88, 0.01)
      for (let i = 0; i < n; i++) { const p = e(0.25 + 0.2 * i); f.metti(ott(0.016), el.gemma, p[0], p[1], 0.016, { s: [0.9, 1.4, 0.8] }, 'luce') }
      const g = X.gem
      for (const s of [-1, 1]) f.metti(con(0.012, 0.07, 4), el.ombra, g[0] + s * 0.15, g[1] - 0.04, 0, { rz: s * 2.4 })
      A.push(braci(f, el.colore, [-X.hw - 0.02, X.cy0, -0.03], [X.hw * 2 + 0.04, X.cy1 - X.cy0, 0.06], { n: 4 + n, vel: 0.35, r: 0.012, sale: -0.3, geo: () => sfe(1, 5, 4) }))
      break
    }
    case 'morte': {
      X.vena(el.colore, 'viva', 0.1, 0.88, 0.01)
      const p = X.pomo
      f.metti(sfe(0.034, 6, 5), C.CREMA, p[0], p[1] - 0.04, 0.0, { s: [1, 1.05, 0.95] }); f.metti(sca(0.034, 0.02, 0.026), C.CREMA, p[0], p[1] - 0.07, 0.0)
      for (const s of [-1, 1]) f.metti(ott(0.009), el.colore, s * 0.012, p[1] - 0.035, 0.03, {}, 'luce')
      A.push(braci(f, el.colore, [-X.hw - 0.04, X.cy0, -0.05], [X.hw * 2 + 0.08, X.cy1 - X.cy0, 0.1], { n: 4 + n * 2, vel: 0.3, r: 0.017, sale: 0.3 }))
      break
    }
  }
  return A
}

/** Gli ornamenti del pregio: collare al ricasso (2+), gemma sul pomo (3+), aura di scintille (4). */
function ornamenti (f, fig, X) {
  const n = fig.pregio, el = ELEMENTI[fig.elemento], A = []
  const gem = fig.elemento === 'nessuno' ? 0xfff0a0 : el.gemma
  if (n >= 2 && X.collare) f.metti(sca(X.collare, 0.026, 0.044), C.ORO, 0, X.collareY, 0, {}, 'oro')
  if (n >= 3 && X.pomo) f.metti(ott(0.018), gem, X.pomo[0], X.pomo[1] - 0.03, 0.03, { s: [1, 1.3, 0.8] }, 'luce')
  if (n >= 4) A.push(orbita(f, fig.elemento === 'nessuno' ? 0xfff0a0 : el.colore2, [0, (X.cy0 + X.cy1) / 2, 0], 0.2, { n: 3, vel: 1.0, r: 0.022, inc: 0.3 }))
  return A
}
const finisci = (f, fig, tipo, anims, vivo = true) => {
  const g = f.chiudi()
  g.userData.famiglia = 'spada'; g.userData.tipo = tipo; g.userData.figura = fig.id; g.userData.nome = fig.nome
  const lista = [...anims]; if (g.userData.vive.length && vivo) lista.push(respira(g, 3, 0.4, 1.2, semeDa(fig.id) % 7))
  if (lista.length) g.userData.anima = anima(...lista)
  return g
}

// ── LE SPADE: lama, guardia, presa, pomo ──
function costruisciSpada (fig, p) {
  const f = new Fucina(), mat = MATERIE[fig.materia], el = ELEMENTI[fig.elemento], seme = semeDa(fig.id)
  const due = fig.mani === 2
  const pr = { lung: due ? 0.3 : 0.2, r: due ? 0.027 : 0.024, col: C.CUOIO, fasce: C.CUOIO_S, tipo: 'fasce', n: due ? 5 : 3, ...p.presa }
  const gy = 0.07, y0 = 0.09
  presa(f, { y0: -pr.lung, y1: 0.05, r: pr.r, col: pr.col, fasce: pr.fasce, tipo: pr.tipo, n: pr.n, fcol: pr.fcol })
  pomo(f, { y: -pr.lung - 0.02, col: C.OTTONE, ...p.pomo, r: (p.pomo?.r ?? 0.036) * (due ? 1.1 : 1) })
  guardia(f, { col: p.guardia?.col ?? mat.scuro, ...p.guardia }, gy)
  if (p.guardia?.gem) gemma(f, [0, gy, 0.05], p.guardia.gem, p.guardia.gemForma)
  // la lama
  const L = p.L, colL = p.lama ?? mat.medio, tipoL = mat.metallo || fig.materia === 'cristallo' ? 'metallo' : 'pieno'
  const path = p.path ? p.path(y0, L) : retto(y0, L, p.cx)
  const bl = profilo({ path, L, w: p.w, w2: p.w2 ?? p.w * 0.84, punta: p.punta ?? 'acuta', pl: p.pl ?? 0.13, asim: p.asim ?? 0, larg: p.largFn, ...(p.denti ?? {}), N: p.N ?? 16 })
  const prof = p.prof ?? 0.024
  f.metti(poli(bl.pts, prof, 0.004), colL, 0, 0, 0, {}, tipoL)
  const ub = bl.ub
  // dettagli della lama
  for (const d of (p.dettagli ?? [])) {
    const poly = d.fn === 'nastro' ? nastro(path, ub, d.s0 ?? 0.04, d.s1 ?? 0.92, d.hw ?? 0.012, d.off ?? 0, d.N ?? 8) : d.pts
    f.metti(poli(poly, d.prof ?? prof * 1.45, 0.002), d.col, 0, d.z ?? 0, 0, {}, d.tipo ?? 'metallo')
  }
  const hwm = p.w / 2
  const X = {
    s0: 0.12, s1: 0.9, hw: hwm, cy0: y0 + 0.05, cy1: y0 + L * 0.85, gem: [0, gy, 0.05], presa: { y0: -pr.lung, y1: 0.05, r: pr.r }, pomo: [0, -pr.lung - 0.02, 0],
    collare: p.w * 1.04, collareY: y0 + 0.012,
    edge: (s, sg) => { const { P, n } = bl.fr(s), h = bl.mezza(s) * (1 + sg * (p.asim ?? 0)); return [P[0] + sg * n[0] * h, P[1] + sg * n[1] * h, 0] },
    centro: s => bl.fr(s).P,
    vena: (col, tipo, s0, s1, hw) => f.metti(poli(nastro(path, ub, s0, s1, t => hw * (1 - t * 0.75), 0, 6), prof * 1.5, 0.002), col, 0, 0, 0, {}, tipo === 'oro' ? 'oro' : 'viva')
  }
  if (p.extraCorpo) p.extraCorpo(f, X, bl, path)
  const anims = []
  if (p.anima) anims.push(...p.anima(f, X, bl, path))
  anims.push(...elemento(f, fig, X), ...ornamenti(f, fig, X))
  return finisci(f, fig, 'spada', anims)
}

// ── LE ARMI D'ASTA e LE ASCE ──
/** Un manico lungo da y0 a y1: segmenti alternati, fasce di cuoio vicino al pugno, puntale. */
function manico (f, { y0 = -0.14, y1, r = 0.026, col = C.LEGNO, alt = null, fasce = C.CUOIO_S, puntale = null, pCol = C.ORO, collari = [] }) {
  const n = Math.max(3, Math.round((y1 - y0) / 0.22))
  for (let i = 0; i < n; i++) f.asta([0.008 * Math.sin(i * 1.7), y0 + (y1 - y0) * i / n, 0], [0.008 * Math.sin((i + 1) * 1.7), y0 + (y1 - y0) * (i + 1) / n, 0], r, r * 0.95, i % 2 && alt ? alt : col, 'pieno', 7)
  for (const y of [-0.08, 0, 0.08]) f.metti(cil(r * 1.18, r * 1.18, 0.016, 7), fasce, 0, y, 0)
  if (puntale) f.metti(cil(r * 1.35, r * 1.05, 0.05, 7), pCol, 0, y0 + 0.005, 0, {}, 'oro')
  if (puntale === 'freccia') f.metti(con(r * 1.2, 0.09, 4), pCol, 0, y0 - 0.06, 0, { rx: Math.PI }, 'oro')
  for (const y of collari) f.metti(cil(r * 1.3, r * 1.3, 0.025, 7), C.FERRO_S, 0, y, 0, {}, 'metallo')
}
const spec = pts => pts.map(([x, y]) => [-x, y]).reverse()

function costruisciAsta (fig, p) {
  // armi d'asta (falcioni di spada-30..32) e asce: `p.testa(f, mat)` posa la testa e restituisce {edge, centro, ...}
  const f = new Fucina(), mat = MATERIE[fig.materia], seme = semeDa(fig.id)
  manico(f, { y1: p.y1, r: p.r ?? 0.026, col: p.legno ?? MATERIE.legno.medio, alt: p.legnoAlt ?? MATERIE.legno.chiaro, fasce: p.fasce ?? C.CUOIO_S, puntale: p.puntale, pCol: p.pCol ?? C.ORO, y0: p.y0 ?? -0.14, collari: p.collari ?? [] })
  const T = p.testa(f, fig)
  const X = {
    s0: 0.1, s1: 0.9, hw: T.hw ?? 0.1, cy0: T.cy0, cy1: T.cy1, gem: T.gem ?? [0, p.y1 - 0.06, 0.04], presa: { y0: -0.06, y1: 0.12, r: p.r ?? 0.026 }, pomo: [0, (p.y0 ?? -0.14), 0],
    collare: 0, edge: T.edge, centro: T.centro, vena: T.vena ?? (() => {}), cima: T.cima
  }
  const anims = []
  if (T.anima) anims.push(...T.anima(f))
  anims.push(...elemento(f, fig, X), ...ornamenti(f, fig, X))
  return finisci(f, fig, fig.id.startsWith('ascia') ? 'ascia' : 'spada', anims)
}

// ── LE SPECIFICHE: ogni figura con la sua forma (sempre dalla descrizione) ──
const D = { crema: 0xf1e6c8 }
const SPADE = {
  'spada-01': { L: 0.58, w: 0.095, lama: 0xdcd9f2, punta: 'acuta', pl: 0.15, guardia: { tipo: 'ricurva', larg: 0.26, col: 0xf0e2c0, met: 'pieno' }, presa: { col: C.CUOIO, fasce: C.CUOIO_S }, pomo: { tipo: 'disco', col: 0xa9a3b8, met: 'metallo', r: 0.03 }, dettagli: [{ fn: 'nastro', col: 0xa8a2c8, hw: 0.011 }] },
  'spada-02': { L: 0.62, w: 0.09, lama: 0xbfe3d6, guardia: { tipo: 'dritta', larg: 0.3, col: C.ORO, pomelli: true, spes: 0.044 }, presa: { col: 0xd9803a, fasce: 0xa4562a, n: 4 }, pomo: { tipo: 'sfera', col: C.ORO, r: 0.032 }, dettagli: [{ fn: 'nastro', col: 0x95c8b8, hw: 0.011 }] },
  'spada-03': { L: 0.68, w: 0.068, w2: 0.056, lama: 0xe4eaf4, pl: 0.15, guardia: { tipo: 'dritta', larg: 0.26, col: 0xdfe6ee, met: 'metallo', gem: 0x7fd4ff, pomelli: true, spes: 0.042 }, presa: { col: 0x2e2c38, fasce: 0x5a5868, tipo: 'righe', n: 4 }, pomo: { tipo: 'sfera', col: 0xdfe6ee, met: 'metallo', r: 0.032 }, dettagli: [{ fn: 'nastro', col: 0xb6c8dc, hw: 0.009 }] },
  'spada-04': { L: 0.6, w: 0.085, lama: 0xe6eef0, guardia: { tipo: 'dritta', larg: 0.27, col: 0x8f9a84, met: 'metallo', gem: 0x58d870, pomelli: true, spes: 0.04 }, presa: { col: 0x7f8f78, fasce: 0x58b860, tipo: 'perline', n: 4, fcol: 0x58d870 }, pomo: { tipo: 'sfera', col: 0x8f9a84, met: 'metallo', r: 0.03 }, dettagli: [{ fn: 'nastro', col: 0xbcd0c4, hw: 0.01 }] },
  'spada-05': { L: 0.76, w: 0.064, w2: 0.05, lama: 0xf6f4f8, pl: 0.16, guardia: { tipo: 'dritta', larg: 0.28, col: C.ORO, gem: 0xff8a2a, pomelli: true, spes: 0.044 }, presa: { col: 0xa04a3a, fasce: 0x6a2a22, n: 4 }, pomo: { tipo: 'goccia', col: C.ORO, r: 0.028 }, dettagli: [{ fn: 'nastro', col: 0xd2d0dc, hw: 0.007 }] },
  'spada-06': { L: 0.62, w: 0.1, lama: 0x9fd8c8, punta: 'obliqua', pl: 0.1, guardia: { tipo: 'sagomata', larg: 0.3, col: C.ORO }, presa: { col: 0x7a4a2a, fasce: 0x4f2f1c, n: 4 }, pomo: { tipo: 'sfera', col: C.ORO, r: 0.03 }, dettagli: [{ fn: 'nastro', col: 0x78bca8, hw: 0.012 }] },
  'spada-07': { L: 0.62, w: 0.105, lama: 0xf0f0fa, punta: 'obliqua', pl: 0.11, guardia: { tipo: 'sagomata', larg: 0.3, col: C.ORO }, presa: { col: 0xd9803a, fasce: 0x9a4a22, n: 4 }, pomo: { tipo: 'sfera', col: C.ORO, r: 0.032 }, dettagli: [{ fn: 'nastro', col: 0x4a2a6a, hw: 0.014, off: -0.038, s1: 0.96, prof: 0.032 }] },
  'spada-08': { L: 0.6, w: 0.062, w2: 0.05, lama: 0x9a9fa6, path: (y0, L) => arco(y0, L, 0.45), asim: 0.25, pl: 0.12, guardia: { tipo: 'sottile', larg: 0.13, col: 0x6a4a30, met: 'pieno' }, presa: { lung: 0.17, col: 0x2e2620, fasce: 0x1a1612, n: 2 }, pomo: { tipo: 'sfera', col: 0x3a3028, met: 'pieno', r: 0.028 } },
  'spada-09': { L: 0.66, w: 0.11, w2: 0.08, lama: 0xaab8c6, path: (y0, L) => arco(y0, L, 0.8), asim: 0.32, pl: 0.14, guardia: { tipo: 'dritta', larg: 0.26, col: C.ORO, spes: 0.04 }, presa: { col: 0x7a4a2a, fasce: 0x4f2f1c, n: 3 }, pomo: { tipo: 'sfera', col: C.ORO, r: 0.028 }, dettagli: [{ fn: 'nastro', col: 0x8a9aab, hw: 0.011, off: 0.02 }] },
  'spada-10': { L: 0.46, w: 0.135, w2: 0.075, lama: 0xffffff, pl: 0.12, guardia: { tipo: 'spiovente', larg: 0.28, col: 0xf4f4f6, gem: 0xe8242a, met: 'metallo', gemForma: 'sfera' }, presa: { lung: 0.17, col: 0xd9803a, fasce: 0xa05a22, n: 3 }, pomo: { tipo: 'disco', col: 0xf4f4f6, met: 'metallo', r: 0.028 }, dettagli: [{ fn: 'nastro', col: 0xd8dce8, hw: 0.008 }] },
  'spada-11': { L: 0.88, w: 0.15, w2: 0.115, lama: 0xa9bccd, pl: 0.17, prof: 0.03, guardia: { tipo: 'dritta', larg: 0.36, col: 0x8ea0b4, met: 'metallo', gem: 0x7fd4ff, gemForma: 'rombo', spes: 0.054, pomelli: true }, presa: { col: C.ORO, fasce: C.ORO_S, n: 5 }, pomo: { tipo: 'disco', col: C.ORO, r: 0.034 }, dettagli: [{ fn: 'nastro', col: 0x7e92a8, hw: 0.022, s0: 0.03, s1: 0.94, prof: 0.04 }] },
  'spada-12': { L: 0.64, w: 0.085, lama: 0xaee8ff, guardia: { tipo: 'dritta', larg: 0.27, col: D.crema, met: 'pieno', spes: 0.042 }, presa: { col: C.ORO, fasce: 0xfff0b0, tipo: 'perline', n: 4, fcol: null }, pomo: { tipo: 'sfera', col: C.ORO, r: 0.03 }, dettagli: [{ fn: 'nastro', col: 0x6fb8e8, hw: 0.02, off: -0.02, s1: 0.95, prof: 0.03 }] },
  'spada-13': { L: 0.68, w: 0.072, w2: 0.05, lama: 0x6f7a72, pl: 0.2, guardia: { tipo: 'ancora', larg: 0.2, col: C.ORO }, presa: { col: 0x6a4a2a, fasce: 0x3f2a18, n: 3 }, pomo: { tipo: 'anello', col: C.ORO_S, r: 0.03 }, dettagli: [{ fn: 'nastro', col: 0x4f5a52, hw: 0.009 }] },
  'spada-14': { L: 0.54, w: 0.15, w2: 0.13, lama: 0x8e9a90, path: (y0, L) => arco(y0, L, 0.42), asim: 0.45, pl: 0.1, guardia: { tipo: 'sottile', larg: 0.2, col: 0xe6e0d0, met: 'pieno', spes: 0.05 }, presa: { col: 0x1e1c1c, fasce: 0xb8b0a0, tipo: 'anello', n: 2 }, pomo: { tipo: 'sfera', col: 0x2a2828, met: 'pieno', r: 0.03 }, dettagli: [{ fn: 'nastro', col: 0x56605a, hw: 0.018, off: -0.052, s1: 0.95, prof: 0.034 }] },
  'spada-15': { L: 0.7, w: 0.06, w2: 0.044, lama: 0xe8eef2, pl: 0.15, guardia: { tipo: 'punte', larg: 0.22, col: 0x8a8c6c, met: 'metallo', ricco: 0 }, presa: { col: 0x7a4a2a, fasce: 0x4f2f1c, n: 4 }, pomo: { tipo: 'sfera', col: 0x8a8c6c, met: 'metallo', r: 0.028 }, dettagli: [{ fn: 'nastro', col: 0xbac4cc, hw: 0.007 }] },
  'spada-16': { L: 0.66, w: 0.1, w2: 0.1, lama: 0x6fd8ff, cx: u => 0.04 * tri(u * 2.5 + 0.25), pl: 0.12, N: 24, prof: 0.03, guardia: { tipo: 'ornata', col: C.ORO, larg: 0.3 }, presa: { lung: 0.14, col: 0x1e3a78, fasce: C.ORO, n: 3 }, pomo: { tipo: 'cristallo', col: 0x9af0ff, met: 'metallo', r: 0.03 }, dettagli: [{ fn: 'nastro', col: 0xe8fbff, hw: 0.016, tipo: 'viva', s0: 0.1, s1: 0.95 }] },
  'spada-17': { L: 0.66, w: 0.13, w2: 0.04, lama: 0x8fa595, pl: 0.1, largFn: s => Math.sin(Math.PI * Math.min(1, s * 0.96 + 0.1)) * 0.75 + 0.28, denti: sega({ n: 4, amp: 0.034, lati: [1, -1], da: 0.12, a: 0.96, verso: -1 }), N: 24, guardia: { tipo: 'artigli', col: C.ORO }, presa: { col: 0x3a4a34, fasce: 0x6a8a5a, n: 3 }, pomo: { tipo: 'punta', col: C.ORO, r: 0.026 }, dettagli: [{ fn: 'nastro', col: 0x6c8574, hw: 0.011 }] },
  'spada-18': { L: 0.56, w: 0.17, w2: 0.15, lama: 0xdedede, path: (y0, L) => arco(y0, L, 0.28), asim: 0.3, pl: 0.06, punta: 'obliqua', denti: tacche([[0.3, 0.42, 0.028], [0.62, 0.7, 0.036], [0.84, 0.9, 0.025]]), N: 18, guardia: { tipo: 'dritta', larg: 0.24, col: 0xe08a3a, met: 'pieno', spes: 0.058 }, presa: { col: 0x4a3a30, fasce: C.ORO, n: 2 }, pomo: { tipo: 'sfera', col: 0x6a5a48, met: 'pieno', r: 0.03 }, dettagli: [{ fn: 'nastro', col: 0xa8a8a8, hw: 0.012, off: -0.04 }] },
  'spada-19': { L: 0.62, w: 0.085, lama: 0xe8e8ee, denti: sega({ n: 11, amp: 0.012, lati: [1], da: 0.12, a: 0.92 }), N: 22, guardia: { tipo: 'dritta', larg: 0.26, col: 0xf2f2f2, met: 'metallo', pomelli: true, spes: 0.04 }, presa: { col: 0x9a4a3a, fasce: 0x5a221a, n: 3 }, pomo: { tipo: 'sfera', col: 0xf2f2f2, met: 'metallo', r: 0.028 }, dettagli: [{ fn: 'nastro', col: 0xb8b8c4, hw: 0.008, off: -0.012 }] },
  'spada-20': { L: 0.62, w: 0.08, lama: 0x9fb09a, denti: sega({ n: 9, amp: 0.016, lati: [1], da: 0.14, a: 0.94 }), N: 22, guardia: { tipo: 'dritta', larg: 0.25, col: 0xe8e6dc, met: 'pieno', gem: 0xe89ab8, gemForma: 'sfera', spes: 0.038 }, presa: { col: 0x7a4a2a, fasce: 0x4f2f1c, n: 3 }, pomo: { tipo: 'sfera', col: 0xe8e6dc, met: 'pieno', r: 0.028 }, dettagli: [{ fn: 'nastro', col: 0x7e9078, hw: 0.009 }] },
  'spada-21': { L: 0.62, w: 0.09, lama: 0xcfe4f0, punta: 'forca', pl: 0.17, guardia: { tipo: 'dritta', larg: 0.4, col: C.ORO, spes: 0.05, pomelli: true }, presa: { col: 0x7a4a2a, fasce: 0x4f2f1c, n: 3 }, pomo: { tipo: 'sfera', col: C.ORO, r: 0.03 }, dettagli: [{ fn: 'nastro', col: 0xa4bccc, hw: 0.011, s1: 0.88 }] },
  'spada-22': { L: 0.68, w: 0.058, w2: 0.04, lama: 0x58c8d8, pl: 0.14, denti: tacche([[0.2, 0.26, 0.012], [0.4, 0.46, 0.012], [0.6, 0.66, 0.012], [0.8, 0.86, 0.012]], 1), N: 16, guardia: { tipo: 'croce', larg: 0.24, col: 0x58c8d8, met: 'metallo', spes: 0.034 }, presa: { lung: 0.18, col: 0x58c8d8, fasce: 0x2f98b0, n: 3 }, pomo: { tipo: 'cristallo', col: 0x58c8d8, met: 'metallo', r: 0.03 },
    extraCorpo: (f, X, bl, path) => { for (let i = 0; i < 12; i++) { const s = 0.1 + 0.8 * i / 12, a = i * 1.1, c = bl.fr(s).P; f.metti(ott(0.016), i % 2 ? 0xe8fbff : 0x9af0ff, c[0] + Math.cos(a) * 0.022, c[1], Math.sin(a) * 0.026, { s: [1, 1.5, 1] }, 'metallo') } } },
  'spada-23': { L: 0.64, w: 0.11, w2: 0.09, lama: 0xa9b6c8, pl: 0.13, denti: sbrecciata({ amp: 0.034, seme: 5, N: 28 }), N: 28, guardia: { tipo: 'dritta', larg: 0.28, col: 0x4a2a6a, met: 'pieno', spes: 0.046 }, presa: { col: 0x6a5a78, fasce: 0x3a2a4a, n: 3 }, pomo: { tipo: 'sfera', col: 0x4a2a6a, met: 'pieno', r: 0.03 },
    dettagli: [{ pts: [[-0.006, 0.18], [0.008, 0.18], [0.03, 0.34], [0.012, 0.44], [0.034, 0.58], [0.02, 0.58], [0.0, 0.46], [0.016, 0.34]], col: 0x2a1840, tipo: 'pieno', prof: 0.03 }, { pts: [[-0.04, 0.4], [-0.034, 0.4], [-0.004, 0.52], [-0.012, 0.52]], col: 0x2a1840, tipo: 'pieno', prof: 0.03 }] },
  'spada-24': { L: 0.62, w: 0.13, w2: 0.11, lama: 0xfffdf0, punta: 'tonda', pl: 0.07, guardia: { tipo: 'sottile', larg: 0.24, col: D.crema, met: 'pieno' }, presa: { col: 0x4a3020, fasce: 0x2a1a10, n: 3 }, pomo: { tipo: 'disco', col: D.crema, met: 'pieno', r: 0.028 }, dettagli: [{ fn: 'nastro', col: 0xf0e8c8, hw: 0.012 }] },
  'spada-25': { L: 0.86, w: 0.17, w2: 0.1, lama: 0x8fa597, punta: 'lancia', pl: 0.2, largFn: s => 0.55 + 0.45 * Math.min(1, s * 1.25), guardia: { tipo: 'croce', larg: 0.5, col: C.ORO, spes: 0.056 }, presa: { col: 0x2e2a26, fasce: C.ORO, n: 5 }, pomo: { tipo: 'sfera', col: C.ORO, r: 0.04 }, prof: 0.03, dettagli: [{ fn: 'nastro', col: 0x6c8574, hw: 0.026, s1: 0.9, prof: 0.04 }] },
  'spada-26': { L: 0.64, w: 0.085, lama: 0xeaf0f0, guardia: { tipo: 'dritta', larg: 0.26, col: 0x8fa6b4, met: 'metallo', spes: 0.04 }, presa: { col: 0x2e2a26, fasce: 0x5a5448, n: 3 }, pomo: { tipo: 'sfera', col: 0x8fa6b4, met: 'metallo', r: 0.03 }, dettagli: [{ fn: 'nastro', col: 0xbccaca, hw: 0.01, s1: 0.55 }],
    extraCorpo: (f, X, bl, path) => {
      const yb = 0.09 + 0.64 * 0.52                                               // la benda stretta attorno alla lama, il lembo lungo
      f.metti(sca(0.098, 0.14, 0.05), 0x2fb04a, 0, yb + 0.07, 0, {}, 'pieno'); f.metti(sca(0.1, 0.03, 0.056), 0x1e7a32, 0, yb + 0.02, 0, {}, 'pieno')
      f.metti(con(0.05, 0.06, 4), 0x2fb04a, 0, yb + 0.17, 0, { s: [1, 1, 0.55] })
    },
    anima: (f, X, bl, path) => {
      const yb = 0.09 + 0.64 * 0.52, geo = new THREE.BufferGeometry()
      const pts = [[0, 0, 0], [0.05, 0, 0], [0.16, -0.06, 0], [0.26, -0.03, 0], [0.38, -0.14, 0], [0.52, -0.08, 0], [0.6, -0.2, 0]]
      const alto = [], tr = []
      for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], w0 = 0.05 * (1 - i / 6.5), w1 = 0.05 * (1 - (i + 1) / 6.5); tr.push(a[0], a[1] + w0, 0, a[0], a[1] - w0, 0, b[0], b[1] + w1, 0, a[0], a[1] - w0, 0, b[0], b[1] - w1, 0, b[0], b[1] + w1, 0) }
      geo.setAttribute('position', new THREE.Float32BufferAttribute(tr, 3)); geo.computeVertexNormals()
      const m = f.libero(geo, 0x2fb04a, 0.04, yb + 0.2, 0, 0.18); m.material.side = THREE.DoubleSide; m.rotation.z = -0.5; m.rotation.y = 0.5
      const m2 = f.libero(geo.clone(), 0x58d870, -0.04, yb + 0.12, 0, 0.18); m2.material.side = THREE.DoubleSide; m2.rotation.z = Math.PI + 0.6; m2.rotation.y = -0.4; m2.scale.setScalar(0.7)
      return [t => { m.rotation.y = 0.5 + 0.25 * Math.sin(t * 2.2); m.rotation.z = -0.5 + 0.08 * Math.sin(t * 3.1); m2.rotation.y = -0.4 + 0.25 * Math.sin(t * 2.6 + 1); m2.rotation.z = Math.PI + 0.6 + 0.08 * Math.sin(t * 2.7) }]
    } },
  'spada-27': { L: 0.62, w: 0.1, w2: 0.09, lama: 0xf0eef0, punta: 'quadra', pl: 0.03, guardia: { tipo: 'dritta', larg: 0.28, col: 0xd8788a, col2: 0x5a0a10, met: 'pieno', spes: 0.05, pomelli: true }, presa: { col: 0x7a3a5a, fasce: 0xd8788a, tipo: 'perline', n: 4 }, pomo: { tipo: 'sfera', col: 0x7a3a5a, met: 'pieno', r: 0.03 }, dettagli: [{ fn: 'nastro', col: 0xc8c4c8, hw: 0.011, s1: 0.95 }] },
  'spada-28': { L: 0.66, w: 0.13, w2: 0.1, lama: 0xf2f2f2, pl: 0.15, guardia: { tipo: 'punte', larg: 0.34, col: C.ORO, col2: C.ORO_S, ricco: 1 }, presa: { col: 0xd9803a, fasce: 0xa05a22, n: 3 }, pomo: { tipo: 'sfera', col: 0x7a3a9a, met: 'pieno', r: 0.034 }, dettagli: [{ pts: null, fn: 'nastro', col: 0xc02a22, hw: 0.066, s0: 0.0, s1: 0.3, prof: 0.032 }, { fn: 'nastro', col: 0xc8c8d0, hw: 0.009, s0: 0.32, s1: 0.9 }] },
  'spada-29': { L: 0.68, w: 0.135, w2: 0.1, lama: 0xf4f2f0, pl: 0.15, guardia: { tipo: 'punte', larg: 0.38, col: C.ORO, col2: 0xfff0a0, ricco: 2 }, presa: { col: C.ORO, fasce: C.ORO_S, n: 4 }, pomo: { tipo: 'goccia', col: C.ORO, r: 0.034 }, dettagli: [{ fn: 'nastro', col: 0xc02a22, hw: 0.068, s0: 0.0, s1: 0.32, prof: 0.032 }, { fn: 'nastro', col: C.ORO, hw: 0.007, s0: 0.34, s1: 0.92, tipo: 'oro' }] },
  'spada-33': { L: 0.3, w: 0.064, w2: 0.05, lama: 0xeceef0, cx: u => u > 0.7 ? 0.05 * ((u - 0.7) / 0.3) ** 2 : 0, N: 12, pl: 0.08, prof: 0.02, guardia: { tipo: 'dritta', larg: 0.14, col: C.ORO, spes: 0.036 }, presa: { lung: 0.13, col: 0x7a4a2a, fasce: 0x4f2f1c, n: 2, r: 0.021 }, pomo: { tipo: 'sfera', col: C.ORO, r: 0.026 }, dettagli: [{ fn: 'nastro', col: 0xc0c4c8, hw: 0.007, s1: 0.8, prof: 0.028 }] },
  'spada-34': { L: 0.44, w: 0.056, w2: 0.036, lama: 0xe0e6ec, path: (y0, L) => arco(y0, L, 1.35), asim: 0.18, pl: 0.1, prof: 0.02, guardia: { tipo: 'disco', larg: 0.1, col: C.ORO, spes: 0.04 }, presa: { lung: 0.13, col: 0x7a4a2a, fasce: 0x4f2f1c, n: 2, r: 0.021 }, pomo: { tipo: 'sfera', col: C.ORO, r: 0.024 }, dettagli: [{ fn: 'nastro', col: 0xb0b8c0, hw: 0.007, s1: 0.8, prof: 0.028 }] },
  'spada-35': { L: 0.44, w: 0.058, w2: 0.036, lama: 0xb4b8c4, path: (y0, L) => arco(y0, L, 1.35), asim: 0.18, pl: 0.1, prof: 0.02, guardia: { tipo: 'disco', larg: 0.1, col: 0x3a2a20, met: 'pieno', spes: 0.04 }, presa: { lung: 0.13, col: 0x2a1e18, fasce: 0x1a120e, n: 2, r: 0.021 }, pomo: { tipo: 'sfera', col: 0x3a2a20, met: 'pieno', r: 0.024 }, dettagli: [{ fn: 'nastro', col: 0x6a6a7c, hw: 0.007, s1: 0.8, prof: 0.028 }] },
  'spada-36': { L: 0.84, w: 0.16, w2: 0.15, lama: 0x8d8aa8, punta: 'quadra', pl: 0.05, guardia: { tipo: 'croce', larg: 0.4, col: C.ORO, spes: 0.056 }, presa: { col: 0x2a2630, fasce: 0x5a4a6a, n: 5 }, pomo: { tipo: 'sfera', col: C.ORO, r: 0.04 }, prof: 0.03, dettagli: [{ fn: 'nastro', col: 0x6a6688, hw: 0.024, s1: 0.94, prof: 0.04 }],
    extraCorpo: (f, X, bl, path) => { for (const [s, y, h, r] of [[1, 0.3, 0.16, 0.022], [-1, 0.45, 0.2, 0.026], [1, 0.62, 0.14, 0.02], [-1, 0.74, 0.12, 0.018]]) f.metti(cristallo(r, h, 4), 0xb060f0, s * 0.078, 0.09 + y * 0.84, 0, { rz: -s * 0.35 }, 'viva') } },
}
// le asce, le armi d'asta
const lamaD = fn => fn
const ASTE = {
  'spada-30': { y1: 0.98, legno: 0xd98a3a, legnoAlt: 0xe8a050, puntale: true, pCol: C.ORO,
    testa: (f) => { const bl = profilo({ path: retto(0.98, 0.36), L: 0.36, w: 0.12, w2: 0.1, punta: 'obliqua', pl: 0.09, N: 6 }); f.metti(poli(bl.pts, 0.026, 0.004), 0xe6ecf0, 0, 0, 0, {}, 'metallo'); f.metti(cil(0.036, 0.036, 0.06, 7), C.FERRO_S, 0, 0.98, 0, {}, 'metallo'); f.metti(poli(nastro(retto(0.98, 0.36), bl.ub, 0.05, 0.9, 0.009), 0.034, 0.002), 0xb0b8c0, 0, 0, 0, {}, 'metallo'); return testaAsta(bl, 0.98, 0.36) } },
  'spada-31': { y1: 1.0, legno: 0xa8743a, legnoAlt: 0xb98547, puntale: true, pCol: 0x7a3aa0,
    testa: (f) => { const bl = profilo({ path: retto(1.0, 0.4), L: 0.4, w: 0.09, w2: 0.04, punta: 'acuta', pl: 0.16, N: 8, larg: s => 0.6 + 0.4 * Math.sin(Math.PI * Math.min(1, s * 0.9 + 0.05)) }); f.metti(poli(bl.pts, 0.026, 0.004), 0xe6ecf0, 0, 0, 0, {}, 'metallo'); f.metti(cil(0.036, 0.036, 0.06, 7), C.FERRO_S, 0, 1.0, 0, {}, 'metallo'); f.metti(poli(nastro(retto(1.0, 0.4), bl.ub, 0.05, 0.9, 0.01), 0.034, 0.002), 0xb0b8c0, 0, 0, 0, {}, 'metallo'); return testaAsta(bl, 1.0, 0.4) } },
  'spada-32': { y1: 1.0, legno: 0x8a5a2e, legnoAlt: 0x9a6a36, puntale: false, collari: [], y0: -0.16,
    testa: (f) => { const path = arco(1.0, 0.4, 0.8), d = tacche([[0.5, 0.62, 0.03]], 1), bl = profilo({ path, L: 0.4, w: 0.09, w2: 0.05, punta: 'acuta', pl: 0.1, asim: 0.4, ...d, N: 14 }); f.metti(poli(bl.pts, 0.026, 0.004), 0xe2e8ee, 0, 0, 0, {}, 'metallo'); f.metti(cil(0.036, 0.036, 0.06, 7), C.FERRO_S, 0, 1.0, 0, {}, 'metallo')
      f.metti(cil(0.075, 0.075, 0.018, 12), 0xbfd8e8, 0, -0.1, 0, {}, 'metallo'); f.metti(cil(0.04, 0.05, 0.05, 10), 0xbfd8e8, 0, -0.14, 0, {}, 'metallo'); f.metti(poli(nastro(path, bl.ub, 0.05, 0.85, 0.009, -0.02), 0.034, 0.002), 0xb0b8c0, 0, 0, 0, {}, 'metallo'); return testaAsta(bl, 1.0, 0.4) } },
}
function testaAsta (bl, y0, L) {
  return { hw: 0.05, cy0: y0 + 0.04, cy1: y0 + L * 0.9, edge: (s, sg) => { const { P, n } = bl.fr(s), h = bl.mezza(s) * (1 + sg * 0.3); return [P[0] + sg * n[0] * h, P[1] + sg * n[1] * h, 0] }, centro: s => bl.fr(s).P,
    vena: (col, tipo, s0, s1, hw) => { }, cima: [0, y0 + L, 0] }
}

// ── le asce vere: ogni testa è un profilo a mano, filo verso +x ──
const ASCE = {
  'ascia-01': { y1: 0.98, legno: 0xa8743a, legnoAlt: 0xb98547, puntale: true, pCol: C.ORO,
    testa: f => {
      const R = [[0.03, 0.8], [0.09, 0.74], [0.16, 0.7], [0.2, 0.78], [0.21, 0.9], [0.18, 0.99], [0.12, 1.02], [0.03, 0.96]]
      f.metti(poli(R, 0.024, 0.004), 0xdce4ec, 0, 0, 0, {}, 'metallo'); f.metti(poli(spec(R), 0.024, 0.004), 0xdce4ec, 0, 0, 0, {}, 'metallo')
      for (const s of [-1, 1]) f.metti(poli([[s * 0.18, 0.72], [s * 0.202, 0.78], [s * 0.212, 0.9], [s * 0.185, 0.99], [s * 0.19, 0.88]], 0.03, 0.002), 0xf8fbff, 0, 0, 0, {}, 'metallo')
      f.metti(con(0.026, 0.14, 4), 0xdce4ec, 0, 1.05, 0, {}, 'metallo'); f.metti(cil(0.038, 0.038, 0.3, 8), C.FERRO_S, 0, 0.88, 0, {}, 'metallo'); f.metti(cil(0.04, 0.04, 0.03, 8), C.ORO, 0, 0.74, 0, {}, 'oro')
      return testaAscia((s, sg) => [sg * (0.2 - 0.04 * Math.abs(2 * s - 1) ** 2 + 0.01), 0.72 + 0.28 * s, 0], 0.72, 1.0)
    } },
  'ascia-02': { y1: 0.5, r: 0.024, legno: 0x9a6a36, legnoAlt: 0xb98547, puntale: true, pCol: C.FERRO, y0: -0.12,
    testa: f => {
      f.metti(ico(0.105, 0), 0xcfd8e2, 0, 0.6, 0, {}, 'metallo')
      const N = 14; for (let i = 0; i < N; i++) {
        const a = Math.acos(1 - 2 * (i + 0.5) / N), b = i * 2.399963
        const v = [Math.sin(a) * Math.cos(b), Math.cos(a), Math.sin(a) * Math.sin(b)]
        f.asta([v[0] * 0.09, 0.6 + v[1] * 0.09, v[2] * 0.09], [v[0] * 0.2, 0.6 + v[1] * 0.2, v[2] * 0.2], 0.026, 0.004, i % 3 ? 0xeef3f8 : 0xb8c4d0, 'metallo', 4)
      }
      f.metti(cil(0.034, 0.034, 0.05, 7), C.FERRO_S, 0, 0.5, 0, {}, 'metallo')
      return testaAscia((s, sg) => { const a = Math.PI * (s + 0.0); return [sg * 0.2 * Math.sin(a) * 0.95, 0.6 - 0.2 * Math.cos(a), 0] }, 0.4, 0.8, 0.12)
    } },
  'ascia-03': { y1: 1.02, legno: 0xc9955a, legnoAlt: 0xd8a96a, puntale: true, pCol: C.ACCIAIO_S,
    testa: f => {
      const dentro = []
      const R = []; const N = 12
      R.push([0.03, 0.72]); for (let i = 0; i <= N; i++) { const s = i / N, a = Math.PI * s, x = 0.07 + 0.24 * Math.sin(a) ** 0.9 + (i % 2 ? 0.025 : 0) * Math.sin(a), y = 0.67 + 0.5 * s; R.push([x, y]) }; R.push([0.03, 1.14])
      f.metti(poli(R, 0.026, 0.004), 0xb8c8d8, 0, 0, 0, {}, 'metallo'); f.metti(poli(spec(R), 0.026, 0.004), 0xb8c8d8, 0, 0, 0, {}, 'metallo')
      for (const s of [-1, 1]) f.metti(poli([[s * 0.11, 0.78], [s * 0.2, 0.9], [s * 0.11, 1.03], [s * 0.1, 0.9]], 0.036, 0.002), 0x8ea4b8, 0, 0, 0, {}, 'metallo')
      f.metti(sfe(0.055, 8, 6), C.ARGENTO, 0, 0.9, 0, {}, 'metallo'); f.metti(cil(0.04, 0.04, 0.5, 8), C.FERRO_S, 0, 0.9, 0, {}, 'metallo'); f.metti(con(0.03, 0.14, 6), C.ACCIAIO, 0, 1.2, 0, {}, 'metallo')
      f.metti(cil(0.045, 0.045, 0.03, 8), C.ORO, 0, 0.66, 0, {}, 'oro')
      return testaAscia((s, sg) => [sg * (0.3 * Math.sin(Math.PI * s) ** 0.9 + 0.07), 0.67 + 0.5 * s, 0], 0.67, 1.17)
    } },
  'ascia-04': { y1: 0.9, legno: 0x4a3018, legnoAlt: 0x5a3c20, puntale: true, pCol: C.FERRO,
    testa: f => {
      const D1 = [[0.03, 0.66], [0.12, 0.62], [0.22, 0.52], [0.3, 0.4], [0.32, 0.54], [0.3, 0.7], [0.32, 0.86], [0.2, 0.9], [0.1, 0.84], [0.03, 0.82]]
      const S1 = [[-0.03, 0.68], [-0.1, 0.66], [-0.17, 0.62], [-0.21, 0.58], [-0.22, 0.7], [-0.19, 0.8], [-0.1, 0.82], [-0.03, 0.82]]
      f.metti(poli(D1, 0.026, 0.004), 0xe0e8ee, 0, 0, 0, {}, 'metallo'); f.metti(poli(S1, 0.026, 0.004), 0xd4dde6, 0, 0, 0, {}, 'metallo')
      f.metti(poli([[0.27, 0.42], [0.31, 0.4], [0.325, 0.54], [0.305, 0.7], [0.32, 0.85], [0.29, 0.62]], 0.034, 0.002), 0xf8fbff, 0, 0, 0, {}, 'metallo')
      f.metti(cil(0.04, 0.04, 0.22, 8), C.FERRO_S, 0, 0.74, 0, {}, 'metallo'); f.metti(cil(0.043, 0.043, 0.035, 8), C.ORO, 0, 0.9, 0, {}, 'oro'); f.metti(cil(0.043, 0.043, 0.035, 8), C.ORO, 0, 0.62, 0, {}, 'oro')
      f.metti(con(0.026, 0.09, 4), C.FERRO_S, 0, 0.98, 0, {}, 'metallo')
      return testaAscia((s, sg) => [sg > 0 ? 0.3 + 0.02 * Math.sin(s * 6) : -0.2, 0.4 + 0.5 * s, 0], 0.4, 0.92)
    } },
  'ascia-05': { y1: 1.02, r: 0.02, legno: 0x9a6a36, legnoAlt: 0xb98547, puntale: true, pCol: C.FERRO_S, y0: -0.2,
    testa: f => {
      f.metti(cil(0.03, 0.03, 0.07, 7), C.FERRO_S, 0, 1.0, 0, {}, 'metallo')
      f.metti(poli([[-0.022, 1.02], [0.022, 1.02], [0.016, 1.3], [0, 1.4], [-0.016, 1.3]], 0.022, 0.003), 0xe3eaf2, 0, 0, 0, {}, 'metallo')
      f.metti(sca(0.01, 0.2, 0.03), 0xa8b4c2, 0, 1.2, 0, {}, 'metallo')
      for (const s of [-1, 1]) {
        f.fila([[s * 0.02, 1.02, 0], [s * 0.1, 1.06, 0], [s * 0.15, 1.14, 0], [s * 0.148, 1.24, 0]], 0.016, 0.01, 0xcfd8e2, 'metallo', 5)
        f.metti(con(0.02, 0.1, 4), 0xe3eaf2, s * 0.148, 1.29, 0, {}, 'metallo')
      }
      return testaAscia((s, sg) => [sg * (0.05 + 0.1 * Math.sin(Math.PI * Math.min(1, s * 1.1))), 1.02 + 0.3 * s, 0], 1.02, 1.4)
    } },
  'ascia-06': { y1: 0.58, legno: 0xe0903a, legnoAlt: 0xf0a050, puntale: true, pCol: C.ORO, y0: -0.12,
    testa: f => {
      const P = [[0.03, 0.4], [0.09, 0.36], [0.2, 0.37], [0.34, 0.5], [0.45, 0.68], [0.5, 0.88], [0.44, 0.84], [0.34, 0.74], [0.24, 0.68], [0.14, 0.66], [0.03, 0.72]]
      f.metti(poli(P, 0.028, 0.004), 0xe8eef2, 0, 0, 0, {}, 'metallo'); f.metti(poli([[0.35, 0.5], [0.45, 0.68], [0.5, 0.88], [0.48, 0.84], [0.43, 0.7], [0.34, 0.54]], 0.036, 0.002), 0xffffff, 0, 0, 0, {}, 'metallo')
      f.metti(cil(0.04, 0.04, 0.2, 8), C.FERRO_S, 0, 0.54, 0, {}, 'metallo')
      return testaAscia((s, sg) => [sg > 0 ? 0.26 + 0.24 * s ** 1.5 : -0.03, 0.4 + 0.46 * s, 0], 0.4, 0.88, 0.2)
    } },
  'ascia-07': { y1: 0.88, legno: 0x9a6a36, legnoAlt: 0xb98547, puntale: 'freccia', pCol: C.ORO, y0: -0.14,
    testa: f => {
      const P = [[0.03, 0.62], [0.08, 0.6], [0.12, 0.8], [0.12, 1.02], [0.2, 1.1], [0.34, 1.12], [0.4, 1.18], [0.28, 1.2], [0.14, 1.16], [0.06, 1.1], [0.03, 1.0]]
      f.metti(poli(P, 0.024, 0.004), 0xe8eef2, 0, 0, 0, {}, 'metallo'); f.metti(poli([[0.12, 0.8], [0.14, 0.8], [0.14, 1.0], [0.21, 1.075], [0.34, 1.09], [0.4, 1.17], [0.2, 1.1], [0.12, 1.02]], 0.032, 0.002), 0xffffff, 0, 0, 0, {}, 'metallo')
      f.metti(cil(0.036, 0.036, 0.2, 8), C.FERRO_S, 0, 0.7, 0, {}, 'metallo'); f.metti(cil(0.038, 0.038, 0.03, 8), C.ORO, 0, 0.58, 0, {}, 'oro')
      return testaAscia((s, sg) => sg > 0 ? [0.12 + 0.28 * Math.max(0, s - 0.5) * 2, 0.62 + 0.55 * s, 0] : [-0.02, 0.62 + 0.5 * s, 0], 0.62, 1.2, 0.2)
    } },
  'ascia-08': { y1: 1.06, legno: 0x9a6a36, legnoAlt: 0xb98547, puntale: true, pCol: C.FERRO_S,
    testa: f => {
      f.metti(sca(0.22, 0.14, 0.1), 0xc8d2dc, 0, 1.1, 0, {}, 'metallo'); f.metti(sca(0.24, 0.025, 0.11), 0xe3eaf2, 0, 1.18, 0, {}, 'metallo'); f.metti(sca(0.24, 0.025, 0.11), 0x8791a0, 0, 1.03, 0, {}, 'metallo')
      f.metti(con(0.034, 0.16, 5), 0xdfe6ee, 0.19, 1.1, 0, { rz: -PIATTA }, 'metallo'); f.metti(sfe(0.04, 6, 5), 0xa8b4c2, -0.15, 1.1, 0, { s: [0.7, 1, 1] }, 'metallo')
      f.metti(sca(0.1, 0.04, 0.06), C.FERRO_S, 0, 0.98, 0, {}, 'metallo'); f.metti(con(0.026, 0.13, 4), 0xdfe6ee, 0, 1.24, 0, {}, 'metallo')
      for (const y of [0.55, 0.7]) f.metti(cil(0.034, 0.034, 0.02, 8), C.FERRO_S, 0, y, 0, {}, 'metallo')
      for (const y of [1.06, 1.14]) f.metti(sca(0.23, 0.01, 0.106), C.FERRO_S, 0, y, 0, {}, 'metallo')
      return testaAscia((s, sg) => [sg > 0 ? 0.11 + 0.1 * Math.sin(Math.PI * s) : -0.11, 1.03 + 0.15 * s, 0], 1.03, 1.2, 0.12)
    } },
  'ascia-09': { y1: 1.02, legno: 0xd4903a, legnoAlt: 0xe8a850, puntale: true, pCol: C.ORO,
    testa: f => {
      const P = [[0.03, 0.82], [0.14, 0.8], [0.24, 0.68], [0.3, 0.58], [0.32, 0.76], [0.32, 0.96], [0.26, 1.1], [0.14, 1.04], [0.03, 1.02]]
      f.metti(poli(P, 0.04, 0.005), 0xdce4ec, 0, 0, 0, {}, 'metallo'); f.metti(poli([[0.27, 0.6], [0.31, 0.58], [0.325, 0.76], [0.325, 0.96], [0.27, 1.1], [0.29, 0.8]], 0.05, 0.002), 0xffffff, 0, 0, 0, {}, 'metallo')
      f.metti(sca(0.1, 0.14, 0.06), C.FERRO_S, -0.06, 0.92, 0, {}, 'metallo'); f.metti(con(0.026, 0.1, 5), 0xdfe6ee, -0.14, 0.92, 0, { rz: PIATTA }, 'metallo')
      f.metti(cil(0.042, 0.042, 0.3, 8), C.FERRO_S, 0, 0.92, 0, {}, 'metallo'); f.metti(sfe(0.014, 5, 4), C.ORO, 0.1, 0.86, 0.04, {}, 'oro'); f.metti(sfe(0.014, 5, 4), C.ORO, 0.1, 0.98, 0.04, {}, 'oro')
      return testaAscia((s, sg) => [sg > 0 ? 0.26 + 0.06 * Math.sin(Math.PI * s) ** 0.5 : -0.1, 0.58 + 0.52 * s, 0], 0.58, 1.1, 0.14)
    } },
  'ascia-11': { y1: 0.5, r: 0.03, legno: 0xe8dcc0, legnoAlt: 0xd8c8a8, puntale: false, y0: -0.2, fasce: 0xa8905a,
    testa: f => {
      f.metti(cil(0.13, 0.13, 0.34, 14), 0xe08030, 0, 0.7, 0, { rz: PIATTA }, 'metallo')
      for (const s of [-1, 1]) { f.metti(cil(0.138, 0.138, 0.03, 14), C.FERRO_S, s * 0.125, 0.7, 0, { rz: PIATTA }, 'metallo'); f.metti(cil(0.1, 0.1, 0.02, 12), 0xf0a050, s * 0.175, 0.7, 0, { rz: PIATTA }, 'metallo') }
      f.metti(cil(0.045, 0.04, 0.2, 8), 0xd0b888, 0, 0.5, 0)
      f.metti(sca(0.3, 0.05, 0.05), 0xf2ece0, 0, 0.35, 0); for (const s of [-1, 1]) f.metti(sfe(0.034, 6, 4), 0xf2ece0, s * 0.155, 0.35, 0)
      return testaAscia((s, sg) => [sg * (0.13 + 0.04 * s), 0.6 + 0.2 * s, 0], 0.57, 0.83, 0.2)
    } },
}
function testaAscia (edge, cy0, cy1, hw = 0.1) {
  return { hw, cy0, cy1, edge, centro: s => [0, cy0 + (cy1 - cy0) * s], cima: [0, cy1, 0], vena: () => { }, gem: [0, (cy0 + cy1) / 2, 0.05] }
}

// ── il ripiego per le cose dello stesso tipo non nominate: dalla `cosa` e dai dati ──
const BASE = {
  'spada lunga': { L: 0.6, w: 0.09, guardia: { tipo: 'dritta', larg: 0.27 } },
  'falcione': { L: 0.54, w: 0.14, path: (y0, L) => arco(y0, L, 0.4), asim: 0.4, guardia: { tipo: 'sottile', larg: 0.2 } },
  'scimitarra': { L: 0.62, w: 0.09, path: (y0, L) => arco(y0, L, 0.6), asim: 0.3, guardia: { tipo: 'dritta', larg: 0.22 } },
  'pugnale': { L: 0.3, w: 0.06, guardia: { tipo: 'dritta', larg: 0.14 } }
}

export function crea (figura) {
  const fig = typeof figura === 'string' ? FIGURE.find(x => x.id === figura) : figura
  if (!fig) throw new Error('figura sconosciuta: ' + figura)
  if (ASTE[fig.id]) return costruisciAsta(fig, ASTE[fig.id])
  if (ASCE[fig.id]) return costruisciAsta(fig, ASCE[fig.id])
  const sp = SPADE[fig.id] ?? BASE[fig.cosa] ?? BASE['spada lunga']
  return costruisciSpada(fig, sp)
}

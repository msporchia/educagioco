// Le pitture dei paesaggi: i disegni del pavimento e delle pareti, pixel per pixel, uno per stile (PAVIMENTI, MURI). Ognuno
// dà il colore, l'altezza (da cui la normal map), la rugosità e, se arde, la luce propria; scena3d/trame.js li fa trame. Il
// disegno è diverso davvero da uno stile all'altro (non solo la tinta): lastre, assi, griglie, basalto, neve con le orme,
// ghiaccio a crepe, fango con le pozze. Dato puro, gira in Node: unita/sotterraneo-paesaggi. Vedi docs/sotterraneo/paesaggi-3d.md.
import { caso, frattale } from './rumore.js'

function tela(w, h, arde) {
  return { w, h, col: new Uint8ClampedArray(w * h * 4), alt: new Float32Array(w * h), rug: new Uint8ClampedArray(w * h * 4),
           em: arde ? new Uint8ClampedArray(w * h * 4) : null }
}
// un pixel: colore 0..1, altezza, rugosità 0..1, luce propria 0..1
function metti(t, i, r, g, b, a, ru, e = null) {
  const q = i * 4
  t.col[q] = r * 255; t.col[q + 1] = g * 255; t.col[q + 2] = b * 255; t.col[q + 3] = 255
  t.alt[i] = a
  t.rug[q] = 255; t.rug[q + 1] = Math.max(0.03, Math.min(1, ru)) * 255; t.rug[q + 3] = 255
  if (t.em) { t.em[q] = e ? e[0] * 255 : 0; t.em[q + 1] = e ? e[1] * 255 : 0; t.em[q + 2] = e ? e[2] * 255 : 0; t.em[q + 3] = 255 }
}
const liscio = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

// celle di Voronoi che si ripetono: (u, v) in [0,1) → distanza dal primo e dal secondo punto, e quale cella
function voronoi(n, seme) {
  const r = caso(seme)
  const p = Array.from({ length: n * n }, () => [r(), r(), r()])
  return (u, v) => {
    const gx = Math.floor(u * n), gy = Math.floor(v * n)
    let d1 = 9, d2 = 9, id = 0
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const cx = gx + i, cy = gy + j
      const k = ((cy % n + n) % n) * n + ((cx % n + n) % n)
      const px = (cx + 0.15 + p[k][0] * 0.7) / n, py = (cy + 0.15 + p[k][1] * 0.7) / n
      const d = Math.hypot(u - px, v - py) * n
      if (d < d1) { d2 = d1; d1 = d; id = p[k][2] } else if (d < d2) d2 = d
    }
    return [d1, d2, id]
  }
}

// ═════════ i pavimenti: una trama copre `celle`×`celle` celle ═════════
export const PAVIMENTI = {
  // le cantine: mattoni a cesto (due a due, un verso e l'altro), caldi
  cesto(asp, L = 512, seme = 3) {
    const t = tela(L, L), f = frattale(L, seme, 4, 4), fine = frattale(L, seme + 5, 3, 32), r = caso(seme)
    const B = L / 8, tinte = Array.from({ length: 256 }, () => r())
    const [pr, pg, pb] = asp.pietra
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
      const bx = Math.floor(x / B), by = Math.floor(y / B), fx = x - bx * B, fy = y - by * B
      const oriz = (bx + by) % 2 === 0
      const meta = oriz ? Math.floor(fy / (B / 2)) : Math.floor(fx / (B / 2))
      const lx = oriz ? fx : fx - meta * B / 2, ly = oriz ? fy - meta * B / 2 : fy
      const lw = oriz ? B : B / 2, lh = oriz ? B / 2 : B
      const bordo = Math.min(lx, lw - lx, ly, lh - ly)
      const m = liscio(0, 5, bordo), n = f(x, y), nf = fine(x, y)
      const k = tinte[(bx * 7 + by * 13 + meta * 3) % 256]
      const v = m < 0.3 ? 0.12 + nf * 0.05 : (0.42 + k * 0.2) * (0.82 + n * 0.3) * (0.9 + nf * 0.2)
      metti(t, y * L + x, v * pr * 1.12, v * pg * 0.78, v * pb * 0.6, m * (0.8 + 0.2 * n) + nf * 0.06, m < 0.3 ? 1 : 0.62 + (1 - n) * 0.2)
    }
    return { ...t, celle: 2 }
  },
  // la cripta: lastroni lunghi una o due celle, con la cornice incisa e qualche croce
  lastroni(asp, L = 512, seme = 5) {
    const t = tela(L, L), f = frattale(L, seme, 5, 4), fine = frattale(L, seme + 9, 3, 32), r = caso(seme)
    const file = 2, hf = L / file, tagli = []
    for (let k = 0; k < file; k++) { const xs = [0]; while (xs[xs.length - 1] < L) xs.push(Math.min(L, xs[xs.length - 1] + (r() < 0.5 ? hf : hf * 2))); tagli.push({ xs, sf: k * hf * 0.5, tinte: xs.map(() => r()), croce: xs.map(() => r() < 0.35) }) }
    const [pr, pg, pb] = asp.pietra
    for (let y = 0; y < L; y++) {
      const k = Math.floor(y / hf), fy = y - k * hf, { xs, sf, tinte, croce } = tagli[k]
      for (let x0 = 0; x0 < L; x0++) {
        const x = (x0 + sf) % L
        let j = 0; while (xs[j + 1] <= x) j++
        const lx = x - xs[j], lw = xs[j + 1] - xs[j]
        const bordo = Math.min(lx, lw - lx, fy, hf - fy)
        const m = liscio(0, 4, bordo)
        const cornice = Math.abs(bordo - 22) < 2.2 ? 1 : 0
        const cx = Math.abs(lx - lw / 2), cy = Math.abs(fy - hf / 2)
        const segno = croce[j] && ((cx < 4 && cy < hf * 0.3) || (cy < 4 && cx < hf * 0.18)) ? 1 : 0
        const n = f(x0, y), nf = fine(x0, y)
        const incavo = cornice || segno
        const v = m < 0.3 ? 0.06 : (0.4 + tinte[j] * 0.1) * (0.85 + n * 0.25) * (0.94 + nf * 0.12) * (incavo ? 0.55 : 1)
        metti(t, y * L + x0, v * pr, v * pg, v * pb, m * 0.9 - incavo * 0.25 + nf * 0.04, m < 0.3 ? 1 : 0.55 + n * 0.3)
      }
    }
    return { ...t, celle: 2 }
  },
  // la fornace: lamiere chiodate e grate di ferro sopra il fuoco (le fessure ardono)
  grata(asp, L = 512, seme = 7) {
    const t = tela(L, L, true), f = frattale(L, seme, 4, 4), fine = frattale(L, seme + 3, 3, 32)
    const P = L / 4, [pr, pg, pb] = asp.pietra
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
      const px = Math.floor(x / P), py = Math.floor(y / P), lx = x - px * P, ly = y - py * P
      const grata = (px * 3 + py * 5) % 7 === 2
      const bordo = Math.min(lx, P - lx, ly, P - ly)
      const m = liscio(0, 4, bordo), n = f(x, y), nf = fine(x, y)
      const i = y * L + x
      if (grata && bordo > 6) {
        const sb = (lx % 16) < 6 || (ly % 32) < 5
        if (sb) metti(t, i, 0.2 * pr, 0.19 * pg, 0.19 * pb, 0.9, 0.5, null)
        else { const fuoco = 0.55 + n * 0.6; metti(t, i, 0.25, 0.06, 0.01, 0.0, 1, [fuoco, fuoco * 0.32, fuoco * 0.05]) }
      } else {
        const chiodo = (Math.hypot(lx - 10, ly - 10) < 3.5 || Math.hypot(P - lx - 10, ly - 10) < 3.5 || Math.hypot(lx - 10, P - ly - 10) < 3.5 || Math.hypot(P - lx - 10, P - ly - 10) < 3.5) ? 1 : 0
        const ruggine = liscio(0.55, 0.75, f(x * 2 % L, y))
        const v = m < 0.3 ? 0.05 : (0.3 + n * 0.12) * (0.92 + nf * 0.15) + chiodo * 0.15
        metti(t, i, v * pr + ruggine * 0.16, v * pg + ruggine * 0.06, v * pb, m * 0.6 + chiodo * 0.4 + nf * 0.03, 0.38 + ruggine * 0.5, null)
      }
    }
    return { ...t, celle: 2 }
  },
  // l'inferno: basalto nero a prismi, lava nelle fessure
  basalto(asp, L = 512, seme = 9) {
    const t = tela(L, L, true), v6 = voronoi(6, seme), fine = frattale(L, seme + 2, 3, 32), f = frattale(L, seme + 4, 3, 4)
    const [pr, pg, pb] = asp.pietra
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
      const [d1, d2, id] = v6(x / L, y / L), e = d2 - d1, nf = fine(x, y), n = f(x, y)
      const i = y * L + x
      if (e < 0.05) { const lava = (0.8 + n * 0.5) * (1 - e / 0.05 * 0.6) * asp.braci * 1.6; metti(t, i, 0.4, 0.1, 0.02, 0, 1, [lava, lava * 0.35, lava * 0.06]) }
      else { const m = liscio(0.05, 0.16, e), v = (0.13 + id * 0.1) * (0.85 + nf * 0.3) * (0.75 + liscio(0.05, 0.35, e) * 0.4); metti(t, i, v * pr, v * pg, v * pb, m * (0.7 + id * 0.3) + nf * 0.05, 0.3 + nf * 0.3, null) }
    }
    return { ...t, celle: 2 }
  },
  // la grotta: terra battuta con i sassi affioranti e le crepe secche
  terra(asp, L = 512, seme = 11) {
    const t = tela(L, L), f = frattale(L, seme, 5, 4), fine = frattale(L, seme + 1, 3, 32), sassi = voronoi(18, seme + 2), crepe = voronoi(3, seme + 3)
    const [pr, pg, pb] = asp.pietra
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
      const n = f(x, y), nf = fine(x, y), [s1, , sid] = sassi(x / L, y / L), [c1, c2] = crepe(x / L, y / L)
      const sasso = sid > 0.82 ? liscio(0.36, 0.2, s1) : 0, crepa = c2 - c1 < 0.02 && n > 0.55 ? 1 : 0
      const umido = liscio(0.55, 0.7, f((x * 0.5) % L, (y * 0.5) % L))
      let v = (0.34 + n * 0.22) * (0.9 + nf * 0.2) * (1 - umido * 0.3) * (1 - crepa * 0.6)
      const g = 0.55 + sid * 0.15
      const r = v * pr * (1 - sasso) + sasso * g * 0.75, gg = v * pg * (1 - sasso) + sasso * g * 0.73, b = v * pb * (1 - sasso) + sasso * g * 0.7
      metti(t, y * L + x, r, gg, b, n * 0.4 + sasso * 0.7 + nf * 0.1 - crepa * 0.3, 0.9 - umido * 0.4 - sasso * 0.2)
    }
    return { ...t, celle: 4 }
  },
  // la neve: bianca, a onde morbide, con le orme di qualcuno passato prima
  neve(asp, L = 512, seme = 13) {
    const t = tela(L, L), f = frattale(L, seme, 4, 2), fine = frattale(L, seme + 1, 3, 32), r = caso(seme)
    const orme = []
    for (let k = 0; k < 7; k++) { const x = r() * L; for (let s = 0; s < 6; s++) orme.push([(x + Math.sin(s * 0.7 + k) * 30) % L, (s * L / 6 + k * 40) % L, s % 2 ? 9 : -9]) }
    const [pr, pg, pb] = asp.pietra
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
      const n = f(x, y), nf = fine(x, y)
      let orma = 0
      for (const [ox, oy, lato] of orme) {
        let dx = x - ox - lato, dy = y - oy
        dx -= Math.round(dx / L) * L; dy -= Math.round(dy / L) * L
        const d = Math.hypot(dx / 6, dy / 10)
        if (d < 1) orma = Math.max(orma, 1 - d * d)
      }
      const v = (0.78 + n * 0.25 + nf * 0.05) * (1 - orma * 0.3)
      metti(t, y * L + x, v * pr * (1 - orma * 0.1), v * pg, v * pb * (1 + orma * 0.06), n * 0.9 - orma * 0.5 + nf * 0.04, 0.7 + nf * 0.3 - orma * 0.2)
    }
    return { ...t, celle: 4 }
  },
  // il ghiaccio: lucido e profondo, crepe bianche, bolle prese dentro
  ghiaccio(asp, L = 512, seme = 15) {
    const t = tela(L, L), f = frattale(L, seme, 4, 2), crepe = voronoi(3, seme + 1), fini = voronoi(7, seme + 2), bolle = voronoi(24, seme + 3)
    const [pr, pg, pb] = asp.pietra
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
      const n = f(x, y), [a1, a2] = crepe(x / L, y / L), [b1, b2] = fini(x / L, y / L), [c1, , cid] = bolle(x / L, y / L)
      const crepa = liscio(0.018, 0.0, a2 - a1) * liscio(0.45, 0.62, n) * 0.85, fina = liscio(0.01, 0, b2 - b1) * 0.35 * (n > 0.55 ? 1 : 0)
      const bolla = cid > 0.8 ? liscio(0.16, 0.08, c1) : 0
      const fondo = 0.25 + n * 0.5
      const bianco = Math.max(crepa, fina, bolla * 0.7)
      metti(t, y * L + x, fondo * pr * 0.55 + bianco * 0.75, fondo * pg * 0.8 + bianco * 0.8, fondo * pb + bianco * 0.85,
            0.5 - crepa * 0.3 - fina * 0.1, 0.06 + bianco * 0.35 + n * 0.06)
    }
    return { ...t, celle: 4 }
  },
  // la palude: fango scuro a solchi e foglie marce (le pozzanghere le fa lo shader del pavimento, larghe nel mondo)
  fango(asp, L = 512, seme = 17) {
    const t = tela(L, L), f = frattale(L, seme, 5, 4), largo = frattale(L, seme + 1, 3, 2), fine = frattale(L, seme + 2, 3, 32), foglie = voronoi(10, seme + 3)
    const [pr, pg, pb] = asp.pietra
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
      const n = f(x, y), w = largo(x, y), nf = fine(x, y), [f1, , fid] = foglie(x / L, y / L)
      const pozza = 0 * w, foglia = fid > 0.86 ? liscio(0.3, 0.2, f1) : 0
      const solco = Math.sin((x + n * 90) * 0.12) * 0.5 + 0.5
      const v = (0.26 + n * 0.16 + solco * 0.05) * (0.9 + nf * 0.2)
      let r = v * pr, g = v * pg, b = v * pb
      r = r * (1 - pozza * 0.65); g = g * (1 - pozza * 0.5); b = b * (1 - pozza * 0.45)
      r += foglia * 0.07; g += foglia * 0.05; b += foglia * 0.01   // foglie marce, scure: niente che sembri una moneta
      metti(t, y * L + x, r, g, b, pozza ? 0.1 : n * 0.6 + solco * 0.15 + foglia * 0.15 + nf * 0.08, pozza ? 0.04 : 0.85 - foglia * 0.2)
    }
    return { ...t, celle: 4 }
  },
  // il tempio sommerso: lastre quadre con un anello scolpito, alghe nelle fughe (l'acqua la mette il velo)
  anelli(asp, L = 512, seme = 19) {
    const t = tela(L, L), f = frattale(L, seme, 4, 4), fine = frattale(L, seme + 1, 3, 32), alga = frattale(L, seme + 2, 4, 4)
    const B = L / 2, [pr, pg, pb] = asp.pietra
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
      const bx = Math.floor(x / B), by = Math.floor(y / B), lx = x - bx * B, ly = y - by * B
      const bordo = Math.min(lx, B - lx, ly, B - ly), m = liscio(0, 5, bordo)
      const d = Math.hypot(lx - B / 2, ly - B / 2), anello = (Math.abs(d - B * 0.3) < 5 || Math.abs(d - B * 0.18) < 3) ? 1 : 0
      const raggi = (bx + by) % 2 === 0 && d < B * 0.3 && Math.abs(Math.sin(Math.atan2(ly - B / 2, lx - B / 2) * 4)) < 0.12 ? 1 : 0
      const n = f(x, y), nf = fine(x, y), a = liscio(0.5, 0.7, alga(x, y)) * (1 - m * 0.6)
      const inc = anello || raggi
      const v = m < 0.3 ? 0.08 : (0.4 + n * 0.16) * (0.9 + nf * 0.2) * (inc ? 0.6 : 1)
      metti(t, y * L + x, v * pr * (1 - a * 0.5), v * pg + a * 0.12, v * pb * (1 - a * 0.3), m * 0.8 - inc * 0.25 + nf * 0.05, 0.5 - a * 0.2)
    }
    return { ...t, celle: 2 }
  },
  // la miniera: assi di legno inchiodate, sfalsate, con la terra nelle fessure
  assi(asp, L = 512, seme = 21) {
    const t = tela(L, L), f = frattale(L, seme, 4, 4), r = caso(seme), venatura = frattale(L, seme + 1, 3, 8), terra = frattale(L, seme + 2, 4, 2)
    const file = 10, hf = L / file, righe = Array.from({ length: file }, () => ({ sf: r() * L, tinta: r(), lungo: L / (1 + Math.floor(r() * 2)) }))
    const [pr, pg, pb] = asp.pietra
    for (let y = 0; y < L; y++) {
      const k = Math.floor(y / hf), fy = y - k * hf, { sf, tinta, lungo } = righe[k]
      for (let x = 0; x < L; x++) {
        const xx = (x + sf) % L, lx = xx % lungo
        const bordo = Math.min(fy, hf - fy, lx, lungo - lx), m = liscio(1.5, 4, bordo)
        const chiodo = (Math.hypot(lx - 8, fy - hf / 2) < 2.5 || Math.hypot(lungo - lx - 8, fy - hf / 2) < 2.5) ? 1 : 0
        const vena = Math.sin((y + venatura(x, y) * 40) * 0.9) * 0.5 + 0.5
        const sporco = liscio(0.55, 0.75, terra(x, y))
        const v = m < 0.3 ? 0.03 : (0.26 + tinta * 0.26 + vena * 0.1) * (0.9 + f(x, y) * 0.2)
        const r2 = v * pr * (1 - sporco * 0.4) + sporco * 0.12, g2 = v * pg * (1 - sporco * 0.4) + sporco * 0.1, b2 = v * pb * (1 - sporco * 0.4) + sporco * 0.07
        metti(t, y * L + x, r2 + chiodo * 0.1, g2 + chiodo * 0.1, b2 + chiodo * 0.1, m * 0.7 + vena * 0.1 + chiodo * 0.3, 0.75 - chiodo * 0.4)
      }
    }
    return { ...t, celle: 2 }
  },
}

// ═════════ le pareti: una trama per una cella di largo e l'altezza del muro alto (v da 0 al piede a 1 in cima) ═════════
export const MURI = {
  // mattoni in corsi sfalsati, umidi al piede (le cantine)
  mattoni(asp, w = 256, h = 320, seme = 11) {
    const t = tela(w, h), f = frattale(w, seme, 5, 4), fine = frattale(w, seme + 7, 3, 32), r = caso(seme)
    const hm = Math.round(h / 8), tinte = Array.from({ length: 64 }, () => r()), [mr, mg, mb] = asp.muro
    for (let y = 0; y < h; y++) {
      const k = Math.floor(y / hm), fy = y - k * hm, lm = w / 2, sf = (k % 2) * lm * 0.5
      for (let x = 0; x < w; x++) {
        const xx = (x + sf) % w, j = Math.floor(xx / lm), fx = xx - j * lm
        const m = liscio(0, 6, Math.min(fx, lm - fx, fy, hm - fy)), n = f(x, y % w), nf = fine(x, y % w)
        const v = m < 0.25 ? 0.08 + nf * 0.04 : (0.36 + tinte[(k * 2 + j) % 64] * 0.16) * (0.8 + n * 0.3) * (0.92 + nf * 0.16)
        metti(t, y * w + x, v * mr * 1.08, v * mg * 0.78, v * mb * 0.62, m * 0.85 + nf * 0.1, m < 0.25 ? 1 : 0.7 - n * 0.2)
      }
    }
    return t
  },
  // blocchi grandi squadrati, due corsi, con la cornice incisa (la cripta)
  lastre(asp, w = 256, h = 320, seme = 13) {
    const t = tela(w, h), f = frattale(w, seme, 5, 4), fine = frattale(w, seme + 7, 3, 32), [mr, mg, mb] = asp.muro
    const hm = h / 2
    for (let y = 0; y < h; y++) {
      const k = Math.floor(y / hm), fy = y - k * hm
      for (let x = 0; x < w; x++) {
        const xx = (x + (k % 2) * w / 2) % w
        const bordo = Math.min(xx, w - xx, fy, hm - fy), m = liscio(0, 5, bordo)
        const cornice = Math.abs(bordo - 18) < 2 ? 1 : 0, n = f(x, y % w), nf = fine(x, y % w)
        const v = m < 0.25 ? 0.05 : (0.4 + n * 0.18) * (0.92 + nf * 0.14) * (cornice ? 0.6 : 1)
        metti(t, y * w + x, v * mr, v * mg, v * mb, m * 0.9 - cornice * 0.3 + nf * 0.05, 0.6 + n * 0.3)
      }
    }
    return t
  },
  // lamiere chiodate con le colature di ruggine (la fornace)
  lamiera(asp, w = 256, h = 320, seme = 15) {
    const t = tela(w, h), f = frattale(w, seme, 4, 4), fine = frattale(w, seme + 7, 3, 32), [mr, mg, mb] = asp.muro
    const pw = w / 2, ph = h / 3
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const lx = x % pw, ly = y % ph, bordo = Math.min(lx, pw - lx, ly, ph - ly), m = liscio(0, 3, bordo)
      const chiodo = (bordo > 5 && bordo < 13 && (lx % 22) < 6 && (ly % 22) < 6) || (bordo > 5 && bordo < 13 && Math.min(lx, pw - lx) < 13 && (ly % 22) < 6) ? 1 : 0
      const colatura = liscio(0.5, 0.8, f(x, (y * 0.25) % w)) * (1 - y / h * 0.5), n = f(x, y % w), nf = fine(x, y % w)
      const v = m < 0.3 ? 0.04 : (0.28 + n * 0.1) * (0.9 + nf * 0.2) + chiodo * 0.12
      metti(t, y * w + x, v * mr + colatura * 0.25, v * mg + colatura * 0.09, v * mb, m * 0.5 + chiodo * 0.5, 0.35 + colatura * 0.55)
    }
    return t
  },
  // vetro nero vulcanico con le vene di lava (l'inferno)
  ossidiana(asp, w = 256, h = 320, seme = 17) {
    const t = tela(w, h, true), f = frattale(w, seme, 5, 4), fine = frattale(w, seme + 7, 3, 32), vene = frattale(w, seme + 3, 4, 2)
    const [mr, mg, mb] = asp.muro
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = f(x, y % w), nf = fine(x, y % w), ve = Math.abs(vene(x, y % w) - 0.5)
      const vena = ve < 0.018 ? 1 - ve / 0.018 : 0, piede = 1 - y / h
      const e = vena * (0.6 + piede * 0.8) * asp.braci * 1.4
      const v = 0.1 + n * 0.1 + nf * 0.04
      metti(t, y * w + x, v * mr, v * mg, v * mb, n * 0.6 - vena * 0.3, 0.15 + nf * 0.3, e ? [e, e * 0.32, e * 0.05] : null)
    }
    return t
  },
  // roccia a strati con crepe (la grotta, la miniera, la neve)
  roccia(asp, w = 256, h = 320, seme = 19) {
    const t = tela(w, h), f = frattale(w, seme, 5, 4), fine = frattale(w, seme + 7, 3, 32), crepe = voronoi(5, seme)
    const [mr, mg, mb] = asp.muro
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = f(x, y % w), nf = fine(x, y % w), [c1, c2] = crepe(x / w, (y % w) / w)
      const strato = Math.sin((y / h + n * 0.25) * 30) * 0.5 + 0.5, crepa = c2 - c1 < 0.05 ? 1 : 0
      const v = (0.3 + strato * 0.14 + n * 0.12) * (0.88 + nf * 0.24) * (1 - crepa * 0.55)
      metti(t, y * w + x, v * mr, v * mg, v * mb, n * 0.7 + strato * 0.2 - crepa * 0.4 + nf * 0.1, 0.85 + nf * 0.15)
    }
    return t
  },
  // ghiaccio: chiaro, a venature che scendono, brina bianca a chiazze
  ghiaccio(asp, w = 256, h = 320, seme = 21) {
    const t = tela(w, h), f = frattale(w, seme, 4, 2), fine = frattale(w, seme + 7, 3, 16), [mr, mg, mb] = asp.muro
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = f(x, (y * 0.3) % w), nf = fine(x, y % w)
      const vena = Math.abs(Math.sin((x + n * 120) * 0.08)) < 0.08 ? 1 : 0, brina = liscio(0.6, 0.75, fine((x * 0.5) % w, (y * 0.5) % w))
      const v = 0.45 + n * 0.3
      metti(t, y * w + x, v * mr * 0.6 + vena * 0.3 + brina * 0.4, v * mg * 0.85 + vena * 0.3 + brina * 0.4, v * mb + vena * 0.3 + brina * 0.4,
            n * 0.5 + vena * 0.2 + brina * 0.2, 0.08 + brina * 0.6)
    }
    return t
  },
  // terra umida con le radici che scendono e il muschio (la palude)
  terra(asp, w = 256, h = 320, seme = 23) {
    const t = tela(w, h), f = frattale(w, seme, 5, 4), fine = frattale(w, seme + 7, 3, 32), mus = frattale(w, seme + 3, 4, 4)
    const [mr, mg, mb] = asp.muro
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = f(x, y % w), nf = fine(x, y % w)
      let radice = 0
      for (let k = 0; k < 5; k++) { const cx = (k * 53 + 17 + Math.sin(y * 0.03 + k * 2) * 18) % w; const d = Math.abs(x - cx); if (d < 3 + k % 3) radice = 1 - d / (3 + k % 3) }
      const muschio = liscio(0.52, 0.66, mus(x, y % w)) * (y / h)
      const v = (0.22 + n * 0.16) * (0.88 + nf * 0.24)
      const r = v * mr * (1 - muschio) + radice * 0.28 + muschio * 0.14, g = v * mg * (1 - muschio) + radice * 0.22 + muschio * 0.26, b = v * mb * (1 - muschio) + radice * 0.14 + muschio * 0.06
      metti(t, y * w + x, r, g, b, n * 0.6 + radice * 0.5 + muschio * 0.2, 0.9 - radice * 0.2)
    }
    return t
  },
  // pietra scolpita: blocchi, e una fascia a greca a due terzi; alghe al piede (il tempio sommerso)
  scolpita(asp, w = 256, h = 320, seme = 25) {
    const t = tela(w, h), f = frattale(w, seme, 4, 4), fine = frattale(w, seme + 7, 3, 32), alga = frattale(w, seme + 2, 4, 4)
    const [mr, mg, mb] = asp.muro
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v0 = y / h, n = f(x, y % w), nf = fine(x, y % w)
      const fascia = v0 > 0.62 && v0 < 0.8
      let inc = 0
      if (fascia) {
        const fy = (v0 - 0.62) / 0.18, fx = (x % 64) / 64
        inc = (fy < 0.15 || fy > 0.85 || (fx < 0.12 && fy > 0.15) || (fy > 0.45 && fy < 0.6 && fx < 0.7) || (fx > 0.58 && fx < 0.7 && fy < 0.6)) ? 1 : 0
      } else {
        const hm = h / 5, k = Math.floor(y / hm), fy = y - k * hm, xx = (x + (k % 2) * w / 2) % w
        inc = Math.min(xx, w - xx, fy, hm - fy) < 3 ? 1 : 0
      }
      const a = liscio(0.45, 0.62, alga(x, y % w)) * Math.max(0, 1 - v0 * 2.2)
      const v = (0.4 + n * 0.16) * (0.9 + nf * 0.2) * (inc ? 0.55 : 1)
      metti(t, y * w + x, v * mr * (1 - a * 0.6), v * mg + a * 0.15, v * mb * (1 - a * 0.3), (1 - inc) * 0.6 + n * 0.3, 0.55 - a * 0.25)
    }
    return t
  },
}

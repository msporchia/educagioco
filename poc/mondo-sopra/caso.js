// Il caso col seme e il rumore liscio: copiati da terre-selvagge (motore/aperta.js), così la mappa è sempre la stessa.
// Puro, gira anche in Node.
export function caso (seme) {
  let s = (seme >>> 0) || 1
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 }
}
export const scarta = (x, y, s) => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
// rumore di valore, liscio: `passo` è quanto è larga una macchia, in celle
export function rumore (x, y, seme, passo) {
  const gx = x / passo, gy = y / passo, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy)
  const a = scarta(x0, y0, seme), b = scarta(x0 + 1, y0, seme), c = scarta(x0, y0 + 1, seme), d = scarta(x0 + 1, y0 + 1, seme)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
export const fbm = (x, y, seme, passo, ottave = 3) => {
  let s = 0, a = 0.5, t = 0, p = passo
  for (let i = 0; i < ottave; i++) { s += rumore(x, y, seme + i * 101, p) * a; t += a; a *= 0.5; p /= 2 }
  return s / t
}

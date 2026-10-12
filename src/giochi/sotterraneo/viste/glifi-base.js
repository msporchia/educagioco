// I pezzi con cui si disegnano le icone delle abilità (viste/glifi.js e viste/glifi-rami.js): forme che tornano, in un quadrato
// 24×24. Un glifo è una lista di pezzi ['p' pieno, 'l' tratto, 'o' ombra, 'c' riflesso, 'd' tratto scuro, path].

export const cerchio = (x, y, r) => `M${x + r} ${y}A${r} ${r} 0 1 1 ${x - r} ${y}A${r} ${r} 0 1 1 ${x + r} ${y}Z`
export const stella = (x, y, r) => `M${x} ${y - r}L${x + r * 0.3} ${y - r * 0.3}L${x + r} ${y}L${x + r * 0.3} ${y + r * 0.3}` +
  `L${x} ${y + r}L${x - r * 0.3} ${y + r * 0.3}L${x - r} ${y}L${x - r * 0.3} ${y - r * 0.3}Z`
export const goccia = (x, y, s) => `M${x} ${y}C${x} ${y} ${x - 3 * s} ${y + 3.8 * s} ${x - 3 * s} ${y + 5.7 * s}` +
  `C${x - 3 * s} ${y + 7.4 * s} ${x - 1.7 * s} ${y + 8.6 * s} ${x} ${y + 8.6 * s}C${x + 1.7 * s} ${y + 8.6 * s} ${x + 3 * s} ${y + 7.4 * s} ${x + 3 * s} ${y + 5.7 * s}` +
  `C${x + 3 * s} ${y + 3.8 * s} ${x} ${y} ${x} ${y}Z`
export const fiammella = (x, y, s) => `M${x} ${y}C${x + 0.8 * s} ${y + 3 * s} ${x + 4.5 * s} ${y + 4.6 * s} ${x + 4.5 * s} ${y + 9.2 * s}` +
  `C${x + 4.5 * s} ${y + 12.5 * s} ${x + 2.5 * s} ${y + 15 * s} ${x} ${y + 15 * s}C${x - 2.5 * s} ${y + 15 * s} ${x - 4.5 * s} ${y + 12.5 * s} ${x - 4.5 * s} ${y + 9.6 * s}` +
  `C${x - 4.5 * s} ${y + 7.2 * s} ${x - 2.8 * s} ${y + 6 * s} ${x - 2.4 * s} ${y + 4.2 * s}C${x - 1.2 * s} ${y + 5.4 * s} ${x - 1.1 * s} ${y + 6.8 * s} ${x - 1.3 * s} ${y + 7.8 * s}` +
  `C${x + 0.2 * s} ${y + 6.2 * s} ${x + 0.5 * s} ${y + 3.3 * s} ${x} ${y}Z`
export const SCUDO = 'M12 2.8L19.5 5.6V11C19.5 16 16 19.6 12 21.2C8 19.6 4.5 16 4.5 11V5.6Z'
export const CUORE = 'M12 20.5C5 15.5 2.5 12 2.5 8.6C2.5 5.8 4.7 3.8 7.2 3.8C9.2 3.8 10.9 5 12 6.8C13.1 5 14.8 3.8 16.8 3.8' +
  'C19.3 3.8 21.5 5.8 21.5 8.6C21.5 12 19 15.5 12 20.5Z'
export const SPADA = [
  ['p', 'M20.6 2.6L21.4 2.6L21.1 5.9L10.6 16.4L7.6 13.4L18.1 2.9Z'],
  ['o', 'M21.4 2.6L21.1 5.9L10.6 16.4L9.1 14.9Z'],
  ['l', 'M5.4 11.6L12.4 18.6'],
  ['l', 'M8.9 15.1L4.6 19.4'],
  ['p', cerchio(3.6, 20.4, 1.6)],
]
export const FRECCIA = [
  ['l', 'M4.5 19.5L17.5 6.5'],
  ['p', 'M21 3L14.8 4.6L19.4 9.2Z'],
  ['l', 'M4.5 19.5H2.2M4.5 19.5V21.8M6.8 17.2H4.5M6.8 17.2V19.5'],
]

// un'ascia (il manico e la lama), per chi la riusa con qualcosa intorno
export const ASCIA_G = [
  ['l', 'M5 21L16.4 4.6'],
  ['p', 'M12.8 4.4C15.2 1.6 19.6 1.8 21.8 4.6C21.6 8.4 19.4 11 16.4 11.8Z'], ['o', 'M21.8 4.6C21.6 8.4 19.4 11 16.4 11.8L15.4 9.6Z'],
]
const r1 = v => Math.round(v * 10) / 10
// una stella a n punte che alterna il raggio grande R e il piccolo r (uno scoppio, una fiammata)
export const astro = (x, y, n, R, r) => {
  const p = []
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n - Math.PI / 2, q = i % 2 ? r : R
    p.push(`${r1(x + q * Math.cos(a))} ${r1(y + q * Math.sin(a))}`)
  }
  return `M${p.join('L')}Z`
}
// un poligono da una lista di punti, spostato di (dx, dy) e scalato di k: lo stesso disegno in piccolo, più volte
export const poli = (punti, dx = 0, dy = 0, k = 1) => `M${punti.map(([a, b]) => `${r1(dx + a * k)} ${r1(dy + b * k)}`).join('L')}Z`
export const FULMINE = [[13.6, 1.8], [4.8, 13.6], [11, 13.6], [9.4, 22.2], [19.2, 9.6], [13, 9.6], [15.6, 1.8]]
// un fiocchetto di neve: tre trattini incrociati
export const fiocchetto = (x, y, r) =>
  `M${x} ${r1(y - r)}V${r1(y + r)}M${r1(x - r * 0.87)} ${r1(y - r / 2)}L${r1(x + r * 0.87)} ${r1(y + r / 2)}M${r1(x - r * 0.87)} ${r1(y + r / 2)}L${r1(x + r * 0.87)} ${r1(y - r / 2)}`

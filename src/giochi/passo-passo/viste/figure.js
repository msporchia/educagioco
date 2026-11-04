/* I disegni dei tasti e delle carte, sulla stessa griglia a pixel della mappa:
   `#` è il colore del tasto, `o` il suo orlo. Le lettere stanno qui sotto, in
   SCRITTE. Vedi docs/passo-passo/zaino.md. */

const ORLO = 'var(--t-orlo, #4f2f12)'
const CHIARO = { '#': 'currentColor', o: ORLO }

/* un pixel di orlo attorno a tutto quello che è pieno */
export function conOrlo(righe, orlo = 'o') {
  const w = Math.max(...righe.map(r => r.length)), h = righe.length
  const pieno = (x, y) => x >= 0 && y >= 0 && x < w && y < h && (righe[y][x] ?? '.') !== '.'
  const fuori = []
  for (let y = -1; y <= h; y++) {
    let r = ''
    for (let x = -1; x <= w; x++) {
      if (pieno(x, y)) { r += righe[y][x]; continue }
      r += [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => pieno(x + a, y + b)) ? orlo : '.'
    }
    fuori.push(r)
  }
  return fuori
}

/* mezzo giro in senso orario, per le frecce */
const gira = righe => righe[0].split('').map((_, x) => righe.map(r => r[x]).reverse().join(''))
const volte = (righe, n) => (n ? volte(gira(righe), n - 1) : righe)
const riga = fn => Array.from({ length: 11 }, (_, y) => Array.from({ length: 11 }, (_, x) => (fn(x, Math.abs(y - 5)) ? '#' : '.')).join(''))

const FRECCIA = riga((x, d) => (x >= 5 && x <= 10 - d) || (x < 5 && d <= 2))
const SALTO = riga((x, d) => x <= 4 - d || (x >= 6 && x <= 10 - d))
const VIA = riga((x, d) => x >= 2 && x <= 9 - Math.round(d * 1.4))
const FERMA = riga((x, d) => x >= 1 && x <= 9 && d <= 4)
const PIU = riga((x, d) => (x >= 4 && x <= 6 && d <= 4) || (x >= 1 && x <= 9 && d <= 1))

const CANCELLA = [
  '...........',
  '....#######',
  '...########',
  '..###.###.#',
  '.#####.#.##',
  '#######.###',
  '.#####.#.##',
  '..###.###.#',
  '...########',
  '....#######',
  '...........',
]
const RIPETI = [
  '.......#...',
  '.......##..',
  '.#########.',
  '.##....##..',
  '.##....#...',
  '.##.....##.',
  '...#....##.',
  '..##....##.',
  '.#########.',
  '..##.......',
  '...#.......',
]
const SE = [
  '...#####...',
  '..##...##..',
  '..##...##..',
  '.......##..',
  '......##...',
  '.....##....',
  '.....##....',
  '...........',
  '.....##....',
  '.....##....',
  '...........',
]
const SPADA = [
  '.........##',
  '........###',
  '.......###.',
  '......###..',
  '.#...###...',
  '.##.###....',
  '..####.....',
  '...##......',
  '..####.....',
  '.##..##....',
  '##.........',
]
const LAMPADINA = [
  '...YYYYY...',
  '..YwwYYYY..',
  '.YwwYYYYYy.',
  '.YwYYYYYYy.',
  '.YYYYYYYYy.',
  '..YYYYYYy..',
  '...YYYYy...',
  '...ggggg...',
  '...GGGGG...',
  '...ggggg...',
  '....GGG....',
]
const CASA = [
  '....r....',
  '...rRr...',
  '..rRRRr..',
  '.rRRRRRr.',
  'rRRRRRRRr',
  '.wwwwwww.',
  '.wwdddww.',
  '.wwdddww.',
  '.wwdddww.',
]
const TONDO = ['..###..', '.#####.', '#######', '#######', '#######', '.#####.', '..###..']
const QUADRO = ['#######', '#######', '#######', '#######', '#######', '#######', '#######']
const PUNTA = ['...#...', '...#...', '..###..', '..###..', '.#####.', '.#####.', '#######']

const figura = (righe, tavolozza = CHIARO) => ({ righe: conOrlo(righe), tavolozza })
const lastra = (righe, colore) => ({ righe: conOrlo(righe), tavolozza: { '#': colore, o: '#fff' } })

export const FIGURE = {
  destra: figura(FRECCIA), giu: figura(volte(FRECCIA, 1)), sinistra: figura(volte(FRECCIA, 2)), su: figura(volte(FRECCIA, 3)),
  'salto-destra': figura(SALTO), 'salto-giu': figura(volte(SALTO, 1)),
  'salto-sinistra': figura(volte(SALTO, 2)), 'salto-su': figura(volte(SALTO, 3)),
  via: figura(VIA), ferma: figura(FERMA), piu: { righe: PIU, tavolozza: CHIARO },
  cancella: figura(CANCELLA), ripeti: figura(RIPETI), se: figura(SE), attacca: figura(SPADA),
  lampadina: figura(LAMPADINA, { Y: '#ffd65a', y: '#f2a93a', w: '#fff7cc', g: '#c3cad2', G: '#8b949e', o: ORLO }),
  casa: { righe: conOrlo(CASA), tavolozza: { r: '#a52a20', R: '#e0483a', w: '#fbf4e4', d: '#8f5a2a', o: '#fff' } },
  rosso: lastra(TONDO, '#e0483a'), blu: lastra(QUADRO, '#3a78de'), giallo: lastra(PUNTA, '#f4c430'),
}

/* le lettere, alte sette pixel e larghe quanto serve; lo spazio è largo tre */
const CARATTERI = {
  a: '.....|.....|.###.|....#|.####|#...#|.####', b: '#....|#....|####.|#...#|#...#|#...#|####.',
  c: '.....|.....|.###.|#...#|#....|#...#|.###.', d: '....#|....#|.####|#...#|#...#|#...#|.####',
  e: '.....|.....|.###.|#...#|#####|#....|.###.', f: '..##|.#..|.#..|###.|.#..|.#..|.#..',
  g: '.....|.....|.####|#...#|.####|....#|.###.', h: '#....|#....|####.|#...#|#...#|#...#|#...#',
  i: '#|.|#|#|#|#|#', l: '#|#|#|#|#|#|#', m: '.....|.....|##.#.|#.#.#|#.#.#|#.#.#|#.#.#',
  n: '.....|.....|####.|#...#|#...#|#...#|#...#', o: '.....|.....|.###.|#...#|#...#|#...#|.###.',
  p: '.....|.....|####.|#...#|####.|#....|#....', r: '....|....|#.##|##..|#...|#...|#...',
  s: '.....|.....|.####|#....|.###.|....#|####.', t: '.#..|.#..|###.|.#..|.#..|.#..|..##',
  u: '.....|.....|#...#|#...#|#...#|#...#|.####', v: '.....|.....|#...#|#...#|#...#|.#.#.|..#..',
  à: '#....|.#...|.###.|....#|.####|#...#|.####',
  S: '.####|#....|#....|.###.|....#|....#|####.', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  N: '#...#|##..#|#.#.#|#.#.#|#..##|#...#|#...#',
  0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', 1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
  2: '.###.|#...#|....#|...#.|..#..|.#...|#####', 3: '.###.|#...#|....#|..##.|....#|#...#|.###.',
  4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 5: '#####|#....|####.|....#|....#|#...#|.###.',
  6: '.###.|#....|#....|####.|#...#|#...#|.###.', 7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
  8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.', 9: '.###.|#...#|#...#|.####|....#|....#|.###.',
  '/': '....#|...#.|...#.|..#..|.#...|.#...|#....', '…': '.....|.....|.....|.....|.....|.....|#.#.#',
}
/* quelle minute, alte cinque pixel: solo per le parole sulla testa di una scatola */
const MINUTE = {
  v: '...|#.#|#.#|#.#|.#.', o: '...|.#.|#.#|#.#|.#.', l: '#|#|#|#|#', t: '.#.|###|.#.|.#.|.##',
  e: '...|.#.|###|#..|.##', f: '.##|.#.|###|.#.|.#.', i: '#|.|#|#|#', n: '...|##.|#.#|#.#|#.#',
  a: '...|.##|#.#|#.#|.##', s: '.##|#..|.#.|..#|##.',
}

/* una scritta come disegno: `{ w, h, d }`, con `d` il tracciato di un <path> */
export function scritta(testo, minuta = false) {
  const tabella = minuta ? MINUTE : CARATTERI
  const h = minuta ? 5 : 7
  const grasso = minuta ? 1 : 2      // ogni pixel largo due: a tratto sottile non si leggeva
  let x = 0, d = ''
  for (const c of String(testo)) {
    if (c === ' ') { x += minuta ? 2 : 3; continue }
    const righe = tabella[c].split('|')
    righe.forEach((r, y) => {
      for (let i = 0; i < r.length; i++) if (r[i] === '#') d += `M${x + i} ${y}h${grasso}v1h-${grasso}z`
    })
    x += righe[0].length + grasso
  }
  return { w: Math.max(0, x - grasso + (minuta ? 0 : 1)), h, d }
}

// I mostri grossi disegnati in codice (dati/grossi.js, docs/sotterraneo/grossi.md): una figura di 32×32 pixel,
// due caselle per due, fatta con poche forme (ovali, rettangoli, linee) su una griglia e poi contornata di scuro,
// come gli sprite del bestiario. Si fa dipingere dopo, quando piace (la scheda in
// strumenti/sprite/sorgenti/sotterraneo/generati/PROMPT-grossi.md). Le figure sono righe di lettere come quelle
// di viste/pixel.js: la tela le disegna con un canvas fuori schermo, lo scontro con <Pixel>.

export const LATO = 32

// le tavolozze: `a` il corpo, `b` l'ombra del corpo, `c` il chiaro, `d` il dettaglio (mazza, corona, zampe),
// `e` gli occhi, `f` i denti o le ossa, `k` il contorno
export const TAVOLOZZE = {
  verde: { a: '#6f9e3c', b: '#46702a', c: '#a6c96a', d: '#7a5230', D: '#4e331c', e: '#ffd23f', f: '#f4efe0', k: '#1b1410', r: '#8a2b22' },
  corna: { a: '#8a5a3a', b: '#5e3a24', c: '#b98a5e', d: '#d9d0bd', D: '#8f8778', e: '#ff5a3a', f: '#f4efe0', k: '#1b1410', r: '#3d4f6b' },
  osso: { a: '#e3dcc6', b: '#a89f86', c: '#fffaf0', d: '#e6b422', D: '#9a6c12', e: '#6fe3ff', f: '#5a1e2a', k: '#1a1418', r: '#7a1f2e' },
  brace: { a: '#4a3a36', b: '#2a201e', c: '#ff8a3a', d: '#ffb84a', D: '#c2410c', e: '#ffe14a', f: '#ff5a1f', k: '#120b09', r: '#ff6a1a' },
  ragno: { a: '#4b3a5e', b: '#2e2340', c: '#7a62a0', d: '#3a2c4a', D: '#1f1630', e: '#ff3b3b', f: '#f4efe0', k: '#0f0b14', r: '#7dd36f' },
  fuoco: { a: '#ff7a1a', b: '#c2410c', c: '#ffd25a', d: '#ffe9a0', D: '#ff4a1a', e: '#2a0f05', f: '#fff6d6', k: '#3a0f05', r: '#ff3b1a' },
  acqua: { a: '#2f6f9e', b: '#1d4a6e', c: '#7cc4ef', d: '#bfe6ff', D: '#123552', e: '#f4f9ff', f: '#0b1c2c', k: '#08131f', r: '#4fd1c5' },
}

// una griglia da riempire: le forme scrivono una lettera per pixel
function griglia() {
  const g = Array.from({ length: LATO }, () => Array(LATO).fill('.'))
  const punto = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < LATO && y < LATO) g[y][x] = c }
  return {
    g, punto,
    ovale(cx, cy, rx, ry, c) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
          if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) punto(x, y, c)
    },
    rett(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) punto(x + i, y + j, c) },
    linea(x0, y0, x1, y1, c, spessa = 1) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
      for (let i = 0; i <= n; i++) {
        const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n
        for (let s = 0; s < spessa; s++) punto(x + s, y, c)
      }
    },
  }
}

// il contorno: ogni pixel vuoto che tocca una figura diventa scuro, come gli sprite disegnati a mano
function contorna(g) {
  const fuori = (x, y) => x < 0 || y < 0 || x >= LATO || y >= LATO || g[y][x] === '.'
  const bordo = []
  for (let y = 0; y < LATO; y++) for (let x = 0; x < LATO; x++)
    if (g[y][x] === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !fuori(x + dx, y + dy))) bordo.push([x, y])
  for (const [x, y] of bordo) g[y][x] = 'k'
  return g.map(r => r.join(''))
}

// l'orco o il minotauro: gambe corte, una pancia larga, la testa piccola, la mazza alzata (o le corna)
function bruto(corna) {
  const p = griglia()
  p.rett(9, 24, 5, 6, 'b'); p.rett(18, 24, 5, 6, 'b')                 // le gambe
  p.rett(8, 29, 7, 2, 'D'); p.rett(17, 29, 7, 2, 'D')                 // i piedi
  p.ovale(15.5, 18, 10, 8, 'a')                                         // il corpo
  p.ovale(17, 20, 6, 5, 'c')                                            // la pancia
  p.rett(8, 22, 16, 3, 'r'); p.rett(13, 24, 6, 3, 'r')                  // il perizoma
  p.ovale(5, 17, 3, 5, 'a'); p.ovale(4, 22, 2.5, 2.5, 'b')              // il braccio di là, il pugno
  p.ovale(15.5, 9, 6, 5.5, 'a')                                         // la testa
  p.rett(11, 7, 10, 1, 'b')                                             // la fronte
  p.punto(13, 9, 'e'); p.punto(14, 9, 'e'); p.punto(18, 9, 'e'); p.punto(19, 9, 'e')
  p.punto(14, 9, 'k'); p.punto(18, 9, 'k')
  p.rett(12, 12, 8, 1, 'k'); p.punto(13, 11, 'f'); p.punto(18, 11, 'f')   // la bocca e le zanne
  if (corna) {
    p.linea(10, 6, 6, 2, 'd', 2); p.linea(21, 6, 25, 2, 'd', 2)
    p.punto(6, 1, 'D'); p.punto(26, 1, 'D')
    p.ovale(26, 18, 3, 5, 'a'); p.ovale(27, 23, 2.5, 2.5, 'b')
  } else {
    p.ovale(26, 15, 3, 4.5, 'a')                                        // il braccio alzato
    p.linea(27, 13, 29, 2, 'd', 2)                                      // il manico
    p.ovale(29, 3, 2.5, 3, 'D'); p.punto(28, 2, 'f'); p.punto(30, 4, 'f')   // la testa della mazza, coi chiodi
  }
  return contorna(p.g)
}

// il re scheletro: il mantello dietro, le costole, il teschio con la corona e la spada
function scheletro() {
  const p = griglia()
  p.rett(7, 12, 18, 18, 'r'); p.rett(6, 28, 20, 2, 'r')                // il mantello
  p.rett(12, 22, 2, 8, 'a'); p.rett(18, 22, 2, 8, 'a')                 // le gambe
  p.rett(11, 29, 4, 2, 'b'); p.rett(17, 29, 4, 2, 'b')
  p.rett(14, 12, 4, 11, 'a')                                            // la spina
  for (let y = 13; y <= 20; y += 2) p.rett(10, y, 12, 1, 'a')           // le costole
  p.rett(11, 21, 10, 2, 'b')                                            // il bacino
  p.linea(9, 13, 5, 21, 'a', 2); p.linea(22, 13, 26, 19, 'a', 2)        // le braccia
  p.linea(27, 20, 27, 4, 'f', 1); p.linea(28, 20, 28, 4, 'c', 1)        // la spada
  p.rett(25, 18, 5, 1, 'D'); p.rett(27, 21, 2, 3, 'D')
  p.ovale(16, 7.5, 6, 5.5, 'a'); p.ovale(16, 11.5, 3.5, 2, 'a')         // il teschio, la mascella
  p.ovale(13.5, 8, 1.6, 1.8, 'k'); p.ovale(18.5, 8, 1.6, 1.8, 'k')      // le orbite
  p.punto(13, 8, 'e'); p.punto(18, 8, 'e')
  p.rett(14, 12, 4, 1, 'b'); p.punto(15, 11, 'k')
  p.rett(10, 2, 12, 2, 'd')                                             // la corona
  for (const x of [10, 13, 16, 19, 21]) p.punto(x, 1, 'd')
  p.punto(16, 2, 'r'); p.punto(12, 3, 'D'); p.punto(20, 3, 'D')
  return contorna(p.g)
}

// il ragno: l'addome grande dietro, la testa davanti con tanti occhi, otto zampe piegate
function ragno() {
  const p = griglia()
  for (const [x0, y0, x1, y1, x2, y2] of [
    [11, 18, 4, 12, 1, 22], [11, 20, 3, 18, 1, 27], [12, 22, 6, 25, 4, 30], [13, 23, 9, 27, 8, 31],
    [20, 18, 27, 12, 30, 22], [20, 20, 28, 18, 30, 27], [19, 22, 25, 25, 27, 30], [18, 23, 22, 27, 23, 31],
  ]) { p.linea(x0, y0, x1, y1, 'd', 1); p.linea(x1, y1, x2, y2, 'd', 1) }
  p.ovale(15.5, 12, 9, 8, 'a')                                          // l'addome
  p.ovale(13, 9, 4, 3, 'c'); p.ovale(15.5, 13, 3, 4, 'r')               // il chiaro, la macchia
  p.ovale(15.5, 22, 6, 4.5, 'b')                                        // la testa
  for (const [x, y] of [[12, 21], [14, 20], [17, 20], [19, 21], [13, 23], [18, 23], [15, 22], [16, 22]]) p.punto(x, y, 'e')
  p.linea(13, 26, 12, 28, 'f'); p.linea(18, 26, 19, 28, 'f')            // le zanne
  return contorna(p.g)
}

// la melma: una goccia enorme che cola, gli occhi e la bocca; quella di fuoco ha le fiamme in cima
function melma(fuoco) {
  const p = griglia()
  p.ovale(16, 20, 13, 9.5, 'a')
  p.rett(3, 22, 26, 7, 'a')
  for (const [x, h] of [[5, 2], [11, 3], [19, 2], [25, 3]]) p.rett(x, 29, 2, h, 'b')   // le gocce che colano
  p.ovale(16, 25, 11, 3, 'b')                                           // l'ombra sotto
  p.ovale(11, 15, 3.5, 2.5, 'c'); p.punto(9, 14, 'd')                   // il lucido
  p.ovale(12, 19, 2, 2.5, 'f'); p.ovale(20, 19, 2, 2.5, 'f')            // gli occhi
  p.punto(12, 20, 'e'); p.punto(20, 20, 'e')
  p.rett(13, 24, 6, 2, 'e'); p.punto(14, 24, 'f'); p.punto(17, 24, 'f') // la bocca coi denti
  if (fuoco) {
    for (const [x, h] of [[8, 6], [12, 9], [16, 11], [20, 8], [24, 6]]) {
      p.ovale(x, 11 - h / 2, 2, h / 2, 'D'); p.ovale(x, 12 - h / 3, 1.2, h / 3, 'c')
    }
  } else {
    p.ovale(16, 9.5, 3, 2, 'a'); p.punto(15, 6, 'r'); p.punto(17, 5, 'r'); p.punto(19, 7, 'r')   // le bolle
  }
  return contorna(p.g)
}

const FATTE = new Map()
// le righe della figura di un mostro grosso (dati/grossi.js: `disegno`, `colori`), una volta sola
export function righeDelGrosso(disegno, colori) {
  const k = `${disegno}|${colori}`
  if (!FATTE.has(k)) {
    const righe = disegno === 'bruto' ? bruto(colori === 'corna')
      : disegno === 'scheletro' ? scheletro()
        : disegno === 'ragno' ? ragno()
          : melma(colori === 'fuoco')
    FATTE.set(k, righe)
  }
  return FATTE.get(k)
}

// la figura su un canvas fuori schermo, per la tela (un drawImage a fotogramma invece di mille rettangoli)
const TELE = new Map()
export function telaDelGrosso(disegno, colori) {
  const k = `${disegno}|${colori}`
  if (TELE.has(k)) return TELE.get(k)
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = LATO; c.height = LATO
  const g = c.getContext('2d')
  const tav = TAVOLOZZE[colori] || TAVOLOZZE.verde
  righeDelGrosso(disegno, colori).forEach((r, y) => {
    for (let x = 0; x < r.length; x++) {
      if (r[x] === '.') continue
      g.fillStyle = tav[r[x]] || '#f0f'
      g.fillRect(x, y, 1, 1)
    }
  })
  TELE.set(k, c)
  return c
}

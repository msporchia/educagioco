// Lo stendardo col nome di un'isola, e lo stemma con l'icona del capitolo:
// disegnati in pixel come la sbarra e il masso (scala 3), una stoffa con la
// coda a V appesa a un'asta con due pomelli, e lo scudo pinzato a sinistra.
// Puro, gira in Node: la stoffa si allarga quanto il nome, che sta sopra come
// testo vero (leggibile, e lo legge anche chi non vede). Il disegno è nei
// colori del suo animale: rosso per il coniglio, viola per il cane.
// Vedi docs/passo-passo/mappa.md, «Gli stendardi».
import { rettangoli } from './pixel.js'

export const P = 3                       // un pixel del disegno è tre pixel dello schermo
export const CORPO = 15                  // il carattere del nome, in px
export const CARATTERE = '"Emoji Gioco", Georgia, "Palatino Linotype", "Book Antiqua", Palatino, serif'
export const SPAZIATURA = 0.4            // fra una lettera e l'altra, in px
// quanto è largo un nome senza poterlo misurare (i test): un po' per eccesso
export const stimaNome = nome => Math.ceil(nome.length * (CORPO * 0.6 + SPAZIATURA))

const STOFFE = {
  coniglio: { R: '#b8322a', r: '#8f241f', L: '#d4503f' },
  cane: { R: '#5a46a8', r: '#40307f', L: '#7a66c8' },
}
const COMUNI = { k: '#2e1a10', y: '#f2c14e', Y: '#fff0a8', f: '#fff4de', S: '#c08850', s: '#8a5a30' }

// lo scudo: otto pixel per nove, il campo chiaro dove sta l'emoji
const SCUDO = [
  '.kkkkkk.',
  'kyyyyyyk',
  'kyffffyk',
  'kyffffyk',
  'kyffffyk',
  'kyffffyk',
  '.kyffyk.',
  '..kyyk..',
  '...kk...',
]
export const SCUDO_W = SCUDO[0].length, SCUDO_H = SCUDO.length

// i pomelli dell'asta: cinque pixel per quattro
const POMELLO = [
  '.kkk.',
  'kyYyk',
  'kyyyk',
  '.kkk.',
]

const ASTA_H = 4                         // l'asta: contorno, legno chiaro, legno scuro, contorno
const CORPO_H = 12                       // la stoffa dritta
const CODA_H = 3                         // sotto, la V
const MEZZE_V = [2, 4, 6]                // quanto si apre la V in ogni riga della coda, per parte
const SPORGE = 3                         // l'asta sporge dalla stoffa, per parte

export const stemma = (animale = 'coniglio') => {
  const d = rettangoli({ righe: SCUDO, tavolozza: { ...COMUNI, ...STOFFE[animale] } })
  return { w: d.w * P, h: d.h * P, rect: d.rect, scala: P, campo: { x: (SCUDO_W / 2) * P, y: 4.4 * P } }
}

const FISSO = 23                         // le celle che non sono il nome: sporgenze, bordi, aria, scudo
const TESTO_MIN = 4 * P                  // più stretto di così il nome non si legge

/* `larghezzaTesto` è quanto occupa il nome in px; si disegna per quanto serve
   (a celle intere), ma non oltre `max` px: allora il nome si stringe
   (`stretto`, e la vista lo comprime a `testoW`). Torna le dimensioni, i
   rettangoli in pixel del disegno e dove stanno il nome e l'emoji dello
   stemma. */
export function stendardo(larghezzaTesto, animale = 'coniglio', max = Infinity) {
  let tc = Math.ceil(larghezzaTesto / P)
  const stretto = (tc + FISSO) * P > max
  if (stretto) tc = Math.max(TESTO_MIN / P, Math.floor((max - FISSO * P) / P))
  const Wc = tc + 17                                 // la stoffa: bordo, filo, aria, scudo, aria, nome, aria, filo, bordo
  const W = Wc + 2 * SPORGE
  const H = ASTA_H + CORPO_H + CODA_H - 1
  const G = Array.from({ length: H }, () => Array(W).fill('.'))
  // la stoffa: la forma, poi il contorno (dentro, a contatto col vuoto) e il filo d'oro (dentro il contorno)
  const dentro = (x, y) => {
    if (x < SPORGE || x >= SPORGE + Wc || y < ASTA_H - 1 || y >= H) return false
    const r = y - (ASTA_H - 1 + CORPO_H)             // le righe della coda: 0..CODA_H-1
    if (r < 0) return true
    const m = MEZZE_V[r] ?? 0
    const c = SPORGE + Wc / 2
    return !(x + 0.5 > c - m && x + 0.5 < c + m)
  }
  const VICINI = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  const bordo = (x, y) => dentro(x, y) && VICINI.some(([dx, dy]) => !dentro(x + dx, y + dy))
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!dentro(x, y)) continue
    if (bordo(x, y)) G[y][x] = 'k'
    else if (VICINI.some(([dx, dy]) => bordo(x + dx, y + dy))) G[y][x] = 'y'
    else G[y][x] = x === SPORGE + Wc - 3 ? 'r' : 'R'
  }
  // l'asta, coi pomelli
  for (let x = 0; x < W; x++) {
    G[0][x] = 'k'; G[1][x] = 'S'; G[2][x] = 's'; G[ASTA_H - 1][x] = 'k'
  }
  const punta = (x0) => POMELLO.forEach((riga, y) => [...riga].forEach((ch, i) => { if (ch !== '.') G[y][x0 + i] = ch }))
  for (let y = 0; y < ASTA_H; y++) { G[y][0] = '.'; G[y][W - 1] = '.' }
  punta(0); punta(W - POMELLO[0].length)
  // lo scudo, pinzato a sinistra
  const sx = SPORGE + 3, sy = ASTA_H + 3
  SCUDO.forEach((riga, y) => [...riga].forEach((ch, i) => { if (ch !== '.') G[sy + y][sx + i] = ch }))
  const d = rettangoli({ righe: G.map(r => r.join('')), tavolozza: { ...COMUNI, ...STOFFE[animale] } })
  return {
    w: W * P, h: H * P, rect: d.rect, scala: P, stretto, testoW: tc * P,
    scudo: { x: (sx + SCUDO_W / 2) * P, y: (sy + 4.4) * P },
    testo: { x: (sx + SCUDO_W + 2 + tc / 2) * P, y: (ASTA_H + 1 + (CORPO_H - 1) / 2) * P },
  }
}

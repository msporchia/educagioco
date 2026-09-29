// Il vestito del campo: la carta a celle di una tappa (src/motore/castello/carta.js)
// composta coi pezzi del foglio del terreno di quel vestito, in
// un'immagine sola grande quanto la carta. È la stessa composizione di
// `vesti()` in strumenti/sprite/vesti.py, passo per passo: chi cambia
// l'una cambia l'altra, o la prova e il gioco si vestirebbero diversi.
// Fatta nel browser (e non già pronta) perché 24 carte in 3 vestiti sono
// 72 immagini, e il gioco deve restare un file solo.
import { SCENE, PEZZI as TUTTI, CELLA as C, TOPPA, QUANTI as QUANTE, DAL_FOGLIO } from '../dati/vestiti.js'

// I vestiti (bosco/neve/lava/palude) non corrispondono uno a uno alle
// campagne: grotte e mura ne prendono in prestito uno, in attesa del loro.
export const VESTITO_DI = {
  bosco: 'bosco',
  sotterraneo: 'lava',   // TODO: la scena delle grotte, quando c'è
  mura: 'neve',          // TODO: la scena delle mura, quando c'è
  palude: 'palude',
}

export const vestitoDi = tappa => VESTITO_DI[tappa && tappa.campagna] || 'bosco'

// il colore approssimato del fondo, mentre l'immagine si decodifica (un
// lampo nero sembrerebbe un guasto)
export const TINTA_DI = { bosco: '#5f9a3c', neve: '#dfe9f0', lava: '#4a3a4c', palude: '#71732a' }

const immagini = {}
const attese = {}
export function carica(nome) {
  if (attese[nome]) return attese[nome]
  attese[nome] = new Promise((risolvi, rifiuta) => {
    const i = new Image()
    i.onload = () => { immagini[nome] = i; risolvi(i) }
    i.onerror = () => rifiuta(new Error(`vestito ${nome} non caricato`))
    i.src = SCENE[nome]
  })
  return attese[nome]
}
export const pronto = nome => !!immagini[nome]

// la variante per posto (la stessa cella prende sempre lo stesso pezzo): è
// caso() di vesti.py numero per numero
const caso = (x, y, n, seme = 0) =>
  ((x * 73856093) ^ (y * 19349663) ^ (seme * 83492791)) % n

function versi(a, x, y) {
  let fuori = ''
  for (const [v, dx, dy] of [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['O', -1, 0]]) {
    const c = a(x + dx, y + dy)
    if (c === '+' || (v === 'N' && c === 'A') || (v === 'S' && c === 'C')) fuori += v
  }
  return fuori
}

// I decori grandi e le cose per terra: due distrazioni che ha solo il
// foglio del terreno, dedotte dai `d` e dal fondo (grandi_e_terra() di
// vesti.py). Torna { grandi: Map('x,y' → quale), terra: [[x, y, quale, dx, dy]] }.
export function grandiETerra(a, w, h, nGrandi, misureTerra) {
  const grandi = new Map(), prese = new Set()
  const fondo = c => c === '.' || c === ','
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!nGrandi || a(x, y) !== 'd' || caso(x, y, 2, 12)) continue
      const blocco = [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]
      if (!blocco.slice(1).every(([i, j]) => fondo(a(i, j)))) continue
      let vicino = false
      for (const [i, j] of blocco)
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) if ('+oAC'.includes(a(i + dx, j + dy) || '.')) vicino = true
      if (vicino) continue
      grandi.set(`${x},${y}`, caso(x, y, nGrandi, 3))
      for (const [i, j] of blocco) prese.add(`${i},${j}`)
    }
  const terra = []
  const nTerra = misureTerra.length
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!nTerra || !fondo(a(x, y)) || prese.has(`${x},${y}`) || caso(x, y, 5, 13)) continue
      const k = caso(x, y, nTerra, 14)
      const [tw, th] = misureTerra[k]
      terra.push([x, y, k, caso(x, y, C - tw + 1, 15), caso(x, y, C - th + 1, 16)])
    }
  return { grandi, terra }
}

// Torna un canvas grande quanto la carta, o null se la scena non è ancora
// pronta (chi chiama la carica e riprova). Le composizioni si tengono.
const fatte = new Map()
export function componi(righe, nome) {
  const img = immagini[nome]
  if (!img) return null
  const chiave = nome + '\n' + righe.join('\n')
  if (fatte.has(chiave)) return fatte.get(chiave)

  const PEZZI = TUTTI[nome], QUANTI = QUANTE[nome]
  const h = righe.length, w = righe[0].length
  const cv = document.createElement('canvas')
  cv.width = w * C; cv.height = h * C
  const ctx = cv.getContext('2d')
  const a = (i, j) => (i >= 0 && i < w && j >= 0 && j < h ? righe[j][i] : null)
  const posa = (nome, x, y, lw, lh) => {
    const [sx, sy, pw, ph] = PEZZI[nome]
    ctx.drawImage(img, sx, sy, pw, ph, x, y, lw ?? pw, lh ?? ph)
  }
  const toppa = (nome, x, y) => {
    const o = (TOPPA - C) / 2
    posa(nome, x * C - o, y * C - o)
  }

  // 1 — il prato: una toppa su tutto il campo, poi le toppe sfumate in
  // ordine mescolato perché non si veda la trama
  const celle = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) celle.push([x, y])
  celle.sort((p, q) => caso(p[0], p[1], 997, 5) - caso(q[0], q[1], 997, 5))
  posa('fondo', 0, 0, w * C, h * C)
  for (const [x, y] of celle) toppa(`prato:${caso(x, y, QUANTI.prato)}`, x, y)
  if (QUANTI.qua)
    for (const [x, y] of celle) if (a(x, y) === ',') toppa(`qua:${caso(x, y, QUANTI.qua, 8)}`, x, y)

  // 2 — sotto il fitto, il sottobosco
  for (const [x, y] of celle)
    if (a(x, y) === '^') toppa(`fitto:${caso(x, y, QUANTI.fitto, 4)}`, x, y)

  // 3 — l'acqua: il lago dal bordo (specchiato se è quello di sinistra), lo
  // stagno del foglio in mezzo al campo (acqua() di vesti.py)
  const visti = new Set()
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (a(x, y) !== '~' || visti.has(`${x},${y}`)) continue
      const coda = [[x, y]], cc = []
      visti.add(`${x},${y}`)
      while (coda.length) {
        const [i, j] = coda.pop()
        cc.push([i, j])
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = `${i + di},${j + dj}`
          if (a(i + di, j + dj) === '~' && !visti.has(k)) { visti.add(k); coda.push([i + di, j + dj]) }
        }
      }
      const x0 = Math.min(...cc.map(c => c[0])), x1 = Math.max(...cc.map(c => c[0])) + 1
      const y0 = Math.min(...cc.map(c => c[1])), y1 = Math.max(...cc.map(c => c[1])) + 1
      const [sx, sy, sw, sh] = PEZZI.lago
      const X = x0 * C, Y = y0 * C, W = (x1 - x0) * C, H = (y1 - y0) * C
      const specchiato = (fx, fy, fw, fh, dx, dw) => {
        ctx.save(); ctx.translate(dx + dw, Y); ctx.scale(-1, 1)
        ctx.drawImage(img, fx, fy, fw, fh, 0, 0, dw, H); ctx.restore()
      }
      if (x1 === w) ctx.drawImage(img, sx, sy, sw, sh, X, Y, W, H)
      else if (x0 === 0) specchiato(sx, sy, sw, sh, X, W)
      else if (PEZZI.stagno) {
        const piccolo = x1 - x0 <= 2 && y1 - y0 <= 2 && PEZZI.stagnetto
        posa(piccolo ? 'stagnetto' : 'stagno', X, Y, W, H)
      } else {
        const m = Math.floor(sw / 2)
        ctx.drawImage(img, sx, sy, m, sh, X, Y, W / 2, H)
        specchiato(sx, sy, m, sh, X + W / 2, W / 2)
      }
    }

  // 4 — la strada e le piazzole, nel mezzo della cella
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = a(x, y)
      if (c === '+') {
        const vv = versi(a, x, y)
        if (PEZZI[`strada:${vv}:0`]) posa(`strada:${vv}:${caso(x, y, 3, 1)}`, x * C, y * C)
      } else if (c === 'o') {
        const pz = `piazzola:${caso(x, y, QUANTI.piazzola, 2)}`
        const [, , pw, ph] = PEZZI[pz]
        posa(pz, x * C + Math.floor((C - pw) / 2), y * C + Math.floor((C - ph) / 2))
      }
    }

  // 4b — le cose per terra: piatte, sotto a tutte le figure
  const misureTerra = []
  for (let i = 0; i < (QUANTI.terra || 0); i++) misureTerra.push(PEZZI[`terra:${i}`].slice(2))
  const { grandi, terra } = grandiETerra(a, w, h, QUANTI.grande || 0, misureTerra)
  for (const [x, y, k, dx, dy] of terra) posa(`terra:${k}`, x * C + dx, y * C + dy)

  // 5 — le figure, dall'alto in basso (chi sta più giù copre chi sta su):
  // [chiave d'ordine, pezzo, x, y]
  const figure = []
  const centrata = (pz, x, y, sx, sy) => {
    const [, , pw, ph] = PEZZI[pz]
    return [pz, x * C + Math.floor((C - pw) / 2) + sx, y * C + Math.floor((C - ph) / 2) + sy - 8]
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = a(x, y)
      if (grandi.has(`${x},${y}`)) {
        const pz = `grande:${grandi.get(`${x},${y}`)}`
        const [, , pw, ph] = PEZZI[pz]
        figure.push([(y + 1) * C, pz, x * C + C - Math.floor(pw / 2), (y + 2) * C - 6 - ph])
      } else if (c === 'd') figure.push([y * C, ...centrata(`decoro:${caso(x, y, QUANTI.decoro, 3)}`, x, y, 0, 0)])
      else if (c === '^') {
        let vx = 0, vy = 0
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const v = a(x + dx, y + dy)
          if (v !== '^' && v !== null) { vx += dx * 12; vy += dy * 12 }
        }
        ;[[-14, -18], [16, -4], [-4, 14]].forEach(([ox, oy], k) => {
          const sx = vx + ox + caso(x, y, 11, 7 + k) - 5
          const sy = vy + oy + caso(x, y, 11, 9 + k) - 5
          figure.push([y * C + sy, ...centrata(`albero:${caso(x, y, QUANTI.albero, 6 + k)}`, x, y, sx, sy)])
        })
      }
    }
  figure.sort((p, q) => p[0] - q[0])   // stabile, come sorted() di Python
  for (const [, pz, x, y] of figure) posa(pz, x, y)

  // 6 — la bocca e il castello
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (a(x, y) === 'A' && a(x - 1, y) !== 'A' && a(x, y - 1) !== 'A') {
        const [, , bw, bh] = PEZZI.bocca
        if (DAL_FOGLIO[nome]) posa('bocca', x * C + Math.floor((3 * C - bw) / 2), (y + 2) * C + C / 4 - bh)
        else {
          posa('bocca', x * C, y * C)
          const [sx, sy] = PEZZI['strada:NS:0']
          const terzo = Math.floor(C / 3)
          ctx.drawImage(img, sx, sy, C, terzo, (x + 1) * C, (y + 2) * C - terzo, C, terzo)
        }
      }
      if (a(x, y) === 'C' && a(x - 1, y) !== 'C' && a(x, y - 1) !== 'C') {
        for (let i = x; i < x + 5; i++) if (a(i, y - 1) === '+') posa('strada:NS:0', i * C, y * C)
        const [, , cw, ch] = PEZZI.castello
        posa('castello', x * C + Math.floor((5 * C - cw) / 2), h * C - ch)
      }
    }

  fatte.set(chiave, cv)
  return cv
}

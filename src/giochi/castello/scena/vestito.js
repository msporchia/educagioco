/* ═══════════════════════════════════════════════════════════════════
   IL VESTITO DEL CAMPO — la carta a celle, composta coi pezzi delle
   scene generate

   La carta di una tappa (`motore/carta.js`) dice cosa c'è in ogni cella:
   prato, fitto, acqua, strada, piazzola, bocca, castello. Qui ogni cella
   diventa un pezzo preso dalle scene generate (`dati/vestiti.js`, che
   scrive `strumenti/sprite/vesti.py --atlante`), e ne esce un'immagine
   sola grande quanto la carta — 12×22 celle da 64 px — che il campo
   usa come fondale.

   **È la stessa composizione di `vesti()` in `strumenti/sprite/vesti.py`**,
   passo per passo e con la stessa scelta della variante per posto
   (`caso`): la battaglia finta di `poc/scatti/` e il gioco devono
   vestirsi allo stesso modo, se no quello che si guarda nelle prove non
   è quello che si gioca. Chi cambia l'una cambia l'altra.

   Perché nel browser e non già fatta: ventiquattro carte vestite in tre
   modi sono settantadue immagini, e il gioco deve restare un file solo.
   I pezzi pesano mezzo mega; la composizione costa qualche centinaio di
   `drawImage`, una volta per tappa.

   ── quale vestito per quale campagna ──
   Le scene sono tre — il bosco, la neve, la lava — e le campagne quattro.
   Quelle senza la loro scena ne prendono in prestito un'altra: è una
   scelta dichiarata dell'utente («per il livello senza lo scenario
   giusto per ora puoi riutilizzarne un altro mettendo un todo»).
   ═══════════════════════════════════════════════════════════════════ */
import { SCENE, PEZZI, CELLA as C, TOPPA, QUANTI } from '../dati/vestiti.js'

export const VESTITO_DI = {
  bosco: 'bosco',
  sotterraneo: 'lava',   // TODO: la scena delle grotte, quando c'è
  mura: 'neve',          // TODO: la scena delle mura, quando c'è
  palude: 'bosco',       // TODO: la scena della palude, quando c'è
}

/* le partite libere hanno la loro `campagna` come le tappe: seguono quella */
export const vestitoDi = tappa => VESTITO_DI[tappa && tappa.campagna] || 'bosco'

/* il colore che si vede mentre l'immagine si decodifica: il fondo di
   ogni scena, all'incirca, perché un lampo nero a ogni tappa sembra un
   guasto */
export const TINTA_DI = { bosco: '#5f9a3c', neve: '#dfe9f0', lava: '#4a3a4c' }

/* ── caricare ──
   Un'immagine per scena, decodificata una volta sola e tenuta. */
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

/* la variante per posto: la stessa cella prende sempre lo stesso pezzo.
   È `caso()` di vesti.py numero per numero — i prodotti stanno sotto
   2³¹, quindi lo XOR di JavaScript dà lo stesso risultato di Python */
const caso = (x, y, n, seme = 0) =>
  ((x * 73856093) ^ (y * 19349663) ^ (seme * 83492791)) % n

/* da che lati la strada prosegue: verso un'altra strada, verso la bocca
   sopra, verso il castello sotto */
function versi(a, x, y) {
  let fuori = ''
  for (const [v, dx, dy] of [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['O', -1, 0]]) {
    const c = a(x + dx, y + dy)
    if (c === '+' || (v === 'N' && c === 'A') || (v === 'S' && c === 'C')) fuori += v
  }
  return fuori
}

/* ── comporre ──
   Torna un canvas grande quanto la carta, o `null` se l'immagine della
   scena non è ancora pronta (chi chiama la carica e riprova). Le
   composizioni si tengono: rientrare in una tappa già vista non rifà
   niente. */
const fatte = new Map()
export function componi(righe, nome) {
  const img = immagini[nome]
  if (!img) return null
  const chiave = nome + '\n' + righe.join('\n')
  if (fatte.has(chiave)) return fatte.get(chiave)

  const h = righe.length, w = righe[0].length
  const cv = document.createElement('canvas')
  cv.width = w * C; cv.height = h * C
  const ctx = cv.getContext('2d')
  const a = (i, j) => (i >= 0 && i < w && j >= 0 && j < h ? righe[j][i] : null)
  /* un pezzo dell'atlante: l'angolo in alto a sinistra in (x, y), grande
     quanto è, o quanto si chiede */
  const posa = (nome, x, y, lw, lh) => {
    const [sx, sy, pw, ph] = PEZZI[nome]
    ctx.drawImage(img, sx, sy, pw, ph, x, y, lw ?? pw, lh ?? ph)
  }
  const toppa = (nome, x, y) => {
    const o = (TOPPA - C) / 2
    posa(nome, x * C - o, y * C - o)
  }

  /* 1 — il prato dappertutto: una toppa tirata su tutto il campo, e
     sopra le toppe sfumate, posate in un ordine mescolato perché non si
     veda la trama */
  const celle = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) celle.push([x, y])
  celle.sort((p, q) => caso(p[0], p[1], 997, 5) - caso(q[0], q[1], 997, 5))
  posa('fondo', 0, 0, w * C, h * C)
  for (const [x, y] of celle) toppa(`prato:${caso(x, y, QUANTI.prato)}`, x, y)

  /* 2 — sotto il fitto, il sottobosco */
  for (const [x, y] of celle)
    if (a(x, y) === '^') toppa(`fitto:${caso(x, y, QUANTI.fitto, 4)}`, x, y)

  /* 3 — l'acqua: lo stagno intero su ogni specchio, girato verso il bordo
     che tocca; in mezzo al campo la sua metà di destra e lo specchio di
     quella, così la riva c'è da tutti e due i lati */
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
      const [sx, sy, sw, sh] = PEZZI.stagno
      const X = x0 * C, Y = y0 * C, W = (x1 - x0) * C, H = (y1 - y0) * C
      const specchiato = (fx, fy, fw, fh, dx, dw) => {
        ctx.save(); ctx.translate(dx + dw, Y); ctx.scale(-1, 1)
        ctx.drawImage(img, fx, fy, fw, fh, 0, 0, dw, H); ctx.restore()
      }
      if (x1 === w) specchiato(sx, sy, sw, sh, X, W)
      else if (x0 !== 0) {
        const m = Math.floor(sw / 2)
        specchiato(sx + m, sy, sw - m, sh, X, W / 2)
        ctx.drawImage(img, sx + m, sy, sw - m, sh, X + W / 2, Y, W / 2, H)
      } else ctx.drawImage(img, sx, sy, sw, sh, X, Y, W, H)
    }

  /* 4 — la strada e le piazzole */
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = a(x, y)
      if (c === '+') {
        const vv = versi(a, x, y)
        if (PEZZI[`strada:${vv}:0`]) posa(`strada:${vv}:${caso(x, y, 3, 1)}`, x * C, y * C)
      } else if (c === 'o') posa(`piazzola:${caso(x, y, QUANTI.piazzola, 2)}`, x * C, y * C)
    }

  /* 5 — le figure, dall'alto in basso: chi sta più giù copre chi sta su.
     Il fitto è fatto di alberi interi, tre per cella, e lungo il bordo
     si spostano verso il prato e ci sbordano, come fa un bosco vero */
  const figure = []
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = a(x, y)
      if (c === 'd') figure.push([y * C, `decoro:${caso(x, y, QUANTI.decoro, 3)}`, x, y, 0, 0])
      else if (c === '^') {
        let vx = 0, vy = 0
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const v = a(x + dx, y + dy)
          if (v !== '^' && v !== null) { vx += dx * 12; vy += dy * 12 }
        }
        ;[[-14, -18], [16, -4], [-4, 14]].forEach(([ox, oy], k) => {
          const sx = vx + ox + caso(x, y, 11, 7 + k) - 5
          const sy = vy + oy + caso(x, y, 11, 9 + k) - 5
          figure.push([y * C + sy, `albero:${caso(x, y, QUANTI.albero, 6 + k)}`, x, y, sx, sy])
        })
      }
    }
  figure.sort((p, q) => p[0] - q[0])
  for (const [, nome, x, y, sx, sy] of figure) {
    const [, , pw, ph] = PEZZI[nome]
    posa(nome, x * C + Math.floor((C - pw) / 2) + sx, y * C + Math.floor((C - ph) / 2) + sy - 8)
  }

  /* 6 — la bocca e il castello. Sotto l'arco della bocca l'ultimo terzo
     è la strada nostra, non il moncone della scena; sotto le mura la
     strada prosegue, e il castello ci si posa sopra */
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (a(x, y) === 'A' && a(x - 1, y) !== 'A' && a(x, y - 1) !== 'A') {
        posa('bocca', x * C, y * C)
        const [sx, sy] = PEZZI['strada:NS:0']
        const terzo = Math.floor(C / 3)
        ctx.drawImage(img, sx, sy, C, terzo, (x + 1) * C, (y + 2) * C - terzo, C, terzo)
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

/* I PRATI del sentiero del coniglio: le bozze dei posti senza zaino, una
   per forma. Qui si costruisce e basta; se un posto regge (si vince,
   sta sopra il pavimento, tutte le sue regole servono) lo dice il
   risolutore in `generatore.js`. Vedi docs/passo-passo/sentiero.md. */

const a = (rnd, n) => Math.floor(rnd() * n)
const tra = (rnd, da, fino) => da + a(rnd, fino - da + 1)
const VERSI4 = [[1, 0], [-1, 0], [0, 1], [0, -1]]

/* la stessa ricerca in ampiezza per tutti: le distanze da una cella,
   e da dove ci si arriva */
function distanze(libero, W, sx, sy) {
  const i = (x, y) => y * W + x
  const d = new Map([[i(sx, sy), 0]])
  const su = new Map()
  const fila = [[sx, sy]]
  for (let k = 0; k < fila.length; k++) {
    const [x, y] = fila[k]
    for (const [dx, dy] of VERSI4) {
      const nx = x + dx, ny = y + dy
      if (!libero(nx, ny) || d.has(i(nx, ny))) continue
      d.set(i(nx, ny), d.get(i(x, y)) + 1)
      su.set(i(nx, ny), [x, y])
      fila.push([nx, ny])
    }
  }
  return { d, su }
}

/* le siepi: a macchie di alberi e cespugli (e un po' d'acqua dove non
   si salta: l'acqua si scavalca, e aprirebbe scorciatoie) */
function siepi(m, rnd, { W, H, salti }) {
  const muri = salti ? 'AAB' : 'AAB~'
  const semi = Array.from({ length: 4 }, () => [rnd() * W, rnd() * H, muri[a(rnd, muri.length)]])
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (m[y][x] !== null) continue
    let meglio = semi[0], dd = Infinity
    for (const s of semi) { const q = (s[0] - x) ** 2 + (s[1] - y) ** 2; if (q < dd) { dd = q; meglio = s } }
    m[y][x] = meglio[2] === 'A' && rnd() < 0.12 ? 'B' : meglio[2]
  }
}

/* ── il labirinto di siepi ──
   Un labirinto con qualche slargo, le regole messe dove la strada passa,
   la carota in un vicolo (un prato aperto tirato a caso non arrivava
   quasi mai a dieci frecce). Le buche tagliano la strada in due: fra la
   buca e la gemella la siepe è chiusa. */
export function bozzaLabirinto(g, rnd) {
  const [CW, CH] = g.celle
  const W = 2 * CW - 1, H = 2 * CH - 1
  const aperta = Array.from({ length: H }, () => Array(W).fill(false))
  const i = (x, y) => y * W + x
  const vista = new Set()
  const pila = [[2 * a(rnd, CW), 2 * a(rnd, CH)]]
  aperta[pila[0][1]][pila[0][0]] = true
  vista.add(i(...pila[0]))
  const SALTI2 = [[2, 0], [-2, 0], [0, 2], [0, -2]]
  while (pila.length) {
    const [x, y] = pila.at(-1)
    const vicini = SALTI2.map(([dx, dy]) => [x + dx, y + dy, dx, dy])
      .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < W && ny < H && !vista.has(i(nx, ny)))
    if (!vicini.length) { pila.pop(); continue }
    const [nx, ny, dx, dy] = vicini[a(rnd, vicini.length)]
    aperta[y + dy / 2][x + dx / 2] = true
    aperta[ny][nx] = true
    vista.add(i(nx, ny))
    pila.push([nx, ny])
  }
  /* i varchi in più, e i pilastri tolti: gli slarghi */
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (aperta[y][x]) continue
    const varco = (x % 2) !== (y % 2)
    if (varco && rnd() < g.varchi) aperta[y][x] = true
    if (!varco && x % 2 && y % 2 && rnd() < g.slarghi) aperta[y][x] = true
  }
  const m = aperta.map(r => r.map(o => (o ? '.' : null)))
  const dentro = (x, y) => x >= 0 && y >= 0 && x < W && y < H
  const libero = (x, y) => dentro(x, y) && m[y][x] !== null

  /* la strada più lunga che si trova: la partenza e la tana più lontane */
  const celle = []
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) celle.push([x, y])
  const [px, py] = celle[a(rnd, celle.length)]
  const { d: dp, su: suP } = distanze(libero, W, px, py)
  const lontane = celle.filter(([x, y]) => dp.has(i(x, y))).sort((p, q) => dp.get(i(...q)) - dp.get(i(...p)))
  const [tx, ty] = lontane[a(rnd, Math.min(3, lontane.length))]
  if (dp.get(i(tx, ty)) < g.corta + 2) return null
  const strada = [[tx, ty]]
  while (strada[0][0] !== px || strada[0][1] !== py) strada.unshift(suP.get(i(...strada[0])))
  const sulla = new Set(strada.map(([x, y]) => i(x, y)))
  /* un pezzo di strada dritto: tre celle in fila, lontano dai due capi */
  const dritti = () => {
    const l = []
    for (let k = 2; k < strada.length - 3; k++) {
      const [p, q, r] = [strada[k - 1], strada[k], strada[k + 1]]
      if (q[0] - p[0] === r[0] - q[0] && q[1] - p[1] === r[1] - q[1]) l.push(k)
    }
    return l
  }
  const usate = new Set()
  const prendi = (k, ch) => { const [x, y] = strada[k]; m[y][x] = ch; usate.add(k) }

  if (g.regole.includes('buche')) {
    const n = strada.length
    const k1 = Math.floor(n * (0.25 + rnd() * 0.15)), k2 = Math.floor(n * (0.6 + rnd() * 0.2))
    /* il taglio: un varco a metà strada fra le due buche diventa siepe */
    let taglio = -1
    for (let k = Math.floor((k1 + k2) / 2); k < k2 - 1; k++)
      if ((strada[k][0] % 2) !== (strada[k][1] % 2)) { taglio = k; break }
    if (taglio < 0 || k2 - k1 < 5) return null
    const [cx, cy] = strada[taglio]
    m[cy][cx] = null
    prendi(k1, '1'); prendi(k2, '1')
    for (let k = k1 + 1; k < k2; k++) usate.add(k)
  }
  if (g.regole.includes('salto')) {
    const l = dritti().filter(k => !usate.has(k) && !usate.has(k - 1) && !usate.has(k + 1) &&
      (strada[k][0] % 2) !== (strada[k][1] % 2))
    if (!l.length) return null
    prendi(l[a(rnd, l.length)], rnd() < 0.35 ? 't' : '~')
  }
  if (g.regole.includes('massi')) {
    const l = dritti().filter(k => !usate.has(k - 1) && !usate.has(k) && !usate.has(k + 1) && !usate.has(k + 2))
    if (!l.length) return null
    const k = l[a(rnd, l.length)]
    prendi(k, 'm')
    prendi(k + 1, '~')
    usate.add(k - 1)
  }
  if (g.regole.includes('ghiaccio')) {
    /* una macchia larga tre o quattro, attorno a un pezzo di strada */
    const libere = strada.map((c, k) => k).filter(k => k > 1 && k < strada.length - 2 && !usate.has(k))
    if (!libere.length) return null
    const [cx, cy] = strada[libere[a(rnd, libere.length)]]
    const lw = 3 + a(rnd, 2), lh = 3 + a(rnd, 2)
    const x0 = Math.max(0, cx - a(rnd, lw)), y0 = Math.max(0, cy - a(rnd, lh))
    for (let y = y0; y < Math.min(H, y0 + lh); y++) for (let x = x0; x < Math.min(W, x0 + lw); x++)
      if (m[y][x] === '.') m[y][x] = '*'
  }
  m[py][px] = 'P'
  m[ty][tx] = '@'
  /* la carota: in un vicolo, cioè una cella fuori strada da cui si torna */
  const vicoli = []
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    if ((m[y][x] === '.' || m[y][x] === '*') && !sulla.has(i(x, y))) vicoli.push([x, y])
  if (!vicoli.length) return null
  const [ox, oy] = vicoli[a(rnd, vicoli.length)]
  m[oy][ox] = m[oy][ox] === '*' ? 'C' : 'c'
  siepi(m, rnd, { W, H, salti: g.salti })
  return m.map(r => r.join(''))
}

/* ── il lago ghiacciato ──
   Tutto ghiaccio, coi sassi che fermano, qualche buco nell'acqua (chi
   scivola dritto ci finisce dentro: la falsa pista), un'isola d'erba e
   una coppia di buche che fanno saltare da una sponda all'altra. La
   partenza sta sulla riva, la tana in mezzo al lago, la carota sul
   ghiaccio. */
export function bozzaLago(g, rnd) {
  const W = tra(rnd, 7, 9), H = tra(rnd, 7, 10)
  const m = Array.from({ length: H }, () => Array(W).fill('*'))
  const pesca = () => [a(rnd, W), a(rnd, H)]
  const libera = ([x, y]) => m[y][x] === '*'
  const metti = (ch, prove = 30) => {
    for (let k = 0; k < prove; k++) { const c = pesca(); if (libera(c)) { m[c[1]][c[0]] = ch; return c } }
    return null
  }
  /* la riva: una fila d'erba su un lato, con alberi qua e là */
  const lato = a(rnd, 4)
  const riva = []
  for (let k = 0; k < (lato < 2 ? W : H); k++) {
    const [x, y] = lato === 0 ? [k, 0] : lato === 1 ? [k, H - 1] : lato === 2 ? [0, k] : [W - 1, k]
    m[y][x] = rnd() < 0.3 ? 'A' : '.'
    if (m[y][x] === '.') riva.push([x, y])
  }
  if (!riva.length) return null
  const sassi = Math.round(W * H * (g.sassi || 0.1) * (1 + rnd() * 0.6))
  for (let k = 0; k < sassi; k++) metti('O')
  const buchi = tra(rnd, 1, 3)
  for (let k = 0; k < buchi; k++) metti('~')
  /* un'isola d'erba: ferma chi ci scivola sopra */
  if (rnd() < 0.6) {
    const [x0, y0] = pesca()
    for (let y = y0; y < Math.min(H, y0 + 2); y++) for (let x = x0; x < Math.min(W, x0 + tra(rnd, 1, 2)); x++)
      if (m[y][x] === '*') m[y][x] = '.'
  }
  if (g.regole.includes('buche') && (!metti('1') || !metti('1'))) return null
  /* il masso sul ghiaccio: spinto, scivola e diventa il sasso che ferma */
  if (g.regole.includes('massi') && !metti('M')) return null
  const [px, py] = riva[a(rnd, riva.length)]
  m[py][px] = 'P'
  const tana = metti('@')
  if (!tana || Math.abs(tana[0] - px) + Math.abs(tana[1] - py) < 5) return null
  if (!metti('C')) return null
  return m.map(r => r.join(''))
}

/* ── il fiume ──
   Il posto è tagliato da due o tre fiumi. Sulla riva di là c'è la siepe,
   con un varco solo, e ogni varco sta dalla parte opposta di quello di
   prima: fra un fiume e l'altro si attraversa tutto il prato, fra alberi
   e tronchi. Un fiume largo uno si salta; uno largo due si passa solo
   spingendo il masso nell'acqua (il ponte) e saltando da lì. */
export function bozzaFiume(g, rnd) {
  const W = tra(rnd, 7, 9)
  const massi = g.regole.includes('massi')
  const fiumi = massi ? 2 : tra(rnd, 2, 3)
  const m = []
  const riga = ch => Array(W).fill(ch)
  const prato = () => {
    const r = riga('.')
    for (let x = 0; x < W; x++) {
      const t = rnd()
      if (t < 0.16) r[x] = 'A'
      else if (t < 0.24 && g.salti) r[x] = 't'
    }
    return r
  }
  m.push(prato(), prato())
  /* da che parte sta il varco: 0 a sinistra, 1 a destra */
  let lato = a(rnd, 2)
  const primo = lato
  const largoDue = massi ? a(rnd, fiumi) : -1
  for (let f = 0; f < fiumi; f++) {
    const largo = f === largoDue ? 2 : 1
    const varco = lato ? W - 1 - a(rnd, 3) : a(rnd, 3)
    if (largo === 2) {
      /* il masso sulla riva di qua, sopra la colonna del varco, e sopra
         di lui il posto per spingerlo */
      m.at(-1)[varco] = 'm'
      m.at(-2)[varco] = '.'
    } else if (m.at(-1)[varco] !== '.') m.at(-1)[varco] = '.'
    for (let k = 0; k < largo; k++) m.push(riga('~'))
    m.push(riga(null).map((_, x) => (x === varco ? '.' : rnd() < 0.25 ? 'B' : 'A')))
    m.push(prato())
    if (m.length < 10 && (f === largoDue - 1 || rnd() < 0.35)) m.push(prato())
    lato = 1 - lato
  }
  if (m.length > 11) return null
  const H = m.length
  /* la partenza dalla parte opposta al primo varco, la tana dalla parte
     opposta all'ultimo; la carota su un prato qualunque */
  const posto = (y, sinistra) => {
    const xs = m[y].map((c, x) => (c === '.' ? x : -1)).filter(x => (sinistra ? x >= 0 && x < W / 2 : x >= W / 2))
    return xs.length ? xs[a(rnd, xs.length)] : -1
  }
  const px = posto(0, primo === 1), tx = posto(H - 1, lato === 1)
  if (px < 0 || tx < 0) return null
  m[0][px] = 'P'
  m[H - 1][tx] = '@'
  const prati = []
  for (let y = 1; y < H - 1; y++) for (let x = 0; x < W; x++) if (m[y][x] === '.') prati.push([x, y])
  if (!prati.length) return null
  const [cx, cy] = prati[a(rnd, prati.length)]
  m[cy][cx] = 'c'
  return m.map(r => r.join(''))
}


/* ═══════════════════════════════════════════════════════════════════
   IL SENTIERO SENZA FINE — livelli fatti al momento

   Dopo la campagna i posti scritti a mano finiscono; il sentiero no. Qui
   un livello si **costruisce a caso e poi si fa esaminare dal
   risolutore**: si tiene solo se si vince, se la strada è lunga quanto
   il gradino chiede, se la carota vuole una deviazione e se la regola
   del gradino serve davvero. Un livello che si vince andando dritti non
   è un sentiero, è un corridoio.

   ── IL GRADINO ────────────────────────────────────────────────────
   Il gradino sale con i sentieri fatti in questa seduta, e ogni due ne
   porta una cosa in più, nello stesso ordine della campagna: prima il
   prato con gli stagni, poi il ghiaccio, poi i salti, poi i massi, poi
   le buche; da lì si mescola, e cresce la strada. Il caso si passa da
   fuori (`rnd`): lo stesso seme fa lo stesso sentiero, e i test
   raccontano sempre la stessa storia.

   ── IL CANE NEL SENTIERO ──────────────────────────────────────────
   Chi ha portato il gregge nel recinto (l'ultima tappa del cane) trova
   le pecore anche qui: un sentiero sì e uno no, con una scala sua — una
   pecora, poi il ghiaccio, poi due — che sale come quella del coniglio,
   un gradino ogni due. Il resto è uguale: si costruisce a caso e si
   tiene solo quello che il risolutore dice che si vince, lungo quanto il
   gradino chiede, con l'osso che vuole un giro. Con due pecore i posti
   costano di più da risolvere, quindi il risolutore ha un tetto
   (`LIMITE_CANE`): un posto che non si risolve in fretta si butta, e se
   ne prova un altro.

   ── SE IL CASO NON AIUTA ──────────────────────────────────────────
   Si prova un certo numero di volte, poi si allarga la richiesta (una
   strada un po' più corta, una deviazione più piccola) e si riprova. In
   fondo c'è sempre un livello di riserva che si vince: un bambino che
   aspetta un sentiero che non arriva è un gioco rotto.
   ═══════════════════════════════════════════════════════════════════ */
import { Livello, celleIncastro } from './livello.js'
import { misura, serveLaRegola } from './risolutore.js'
import { TEMI } from '../dati/campagna.js'

/* un generatore di numeri a seme: sempre la stessa fila per lo stesso seme */
export function caso(seme = 1) {
  let s = (seme >>> 0) || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}

/* ── cosa chiede ogni gradino ──
   `regola` è la cosa nuova che deve servire; `lunga` la strada con la
   carota, `dev` quanto deve costare prenderla. I primi sono corti
   apposta: si entra nel sentiero col livello più facile della campagna. */
export const GRADINI = [
  { lato: [5, 4], regola: null,       lunga: [4, 6],  dev: 0, pozze: 1, ostacoli: 0.10 },
  { lato: [5, 5], regola: null,       lunga: [5, 7],  dev: 2, pozze: 1, ostacoli: 0.14 },
  { lato: [6, 5], regola: 'ghiaccio', lunga: [3, 5],  dev: 1, ghiaccio: 1, ostacoli: 0.08 },
  { lato: [6, 6], regola: 'ghiaccio', lunga: [4, 6],  dev: 2, ghiaccio: 1, ostacoli: 0.08 },
  { lato: [6, 5], regola: 'salto',    lunga: [4, 7],  dev: 1, fiume: 1, ostacoli: 0.10, salti: true },
  { lato: [6, 6], regola: 'salto',    lunga: [5, 8],  dev: 2, fiume: 1, pozze: 1, ostacoli: 0.10, salti: true },
  { lato: [6, 5], regola: 'spinta',   lunga: [4, 8],  dev: 1, massi: 1, fiume: 0.5, ostacoli: 0.12 },
  { lato: [6, 6], regola: 'spinta',   lunga: [5, 9],  dev: 2, massi: 1, ghiaccio: 0.5, ostacoli: 0.10 },
  { lato: [6, 6], regola: 'buche',    lunga: [4, 8],  dev: 1, buche: 1, ostacoli: 0.10 },
  { lato: [7, 6], regola: 'buche',    lunga: [5, 9],  dev: 2, buche: 1, ghiaccio: 1, ostacoli: 0.08 },
  { lato: [7, 7], regola: 'ghiaccio', lunga: [6, 9],  dev: 2, ghiaccio: 1, massi: 0.5, ostacoli: 0.08 },
  { lato: [7, 7], regola: 'buche',    lunga: [7, 11], dev: 2, buche: 1, ghiaccio: 1, fiume: 0.5, ostacoli: 0.08, salti: true },
]

/* il gradino di un sentiero: ogni due fatti se ne sale uno, e in cima
   si resta sull'ultimo — che mescola tutto */
export const gradinoDi = fatti => GRADINI[Math.min(GRADINI.length - 1, Math.floor(fatti / 2))]

/* ── la scala del cane ──
   `pecore` quante, e il resto come per il coniglio. Il recinto sta sul
   bordo, con la siepe ai lati: il cancello guarda dentro al prato */
export const GRADINI_CANE = [
  { lato: [6, 5], pecore: 1, lunga: [4, 9],   dev: 1, ostacoli: 0.08 },
  { lato: [7, 5], pecore: 1, lunga: [5, 11],  dev: 2, ostacoli: 0.08, ghiaccio: 0.7 },
  { lato: [6, 5], pecore: 2, lunga: [7, 15],  dev: 1, ostacoli: 0.05 },
  { lato: [7, 6], pecore: 2, lunga: [9, 18],  dev: 2, ostacoli: 0.06, ghiaccio: 0.5 },
]
/* quanti stati guarda il risolutore su un posto del cane, prima di
   lasciarlo stare: un bambino non se ne accorge, un telefono sì */
export const LIMITE_CANE = 40000
const NOMI_CANE = ['Il pascolo', 'Il trifoglio', 'L\'ovile', 'Il prato alto', 'La radura',
                   'Il campo di papaveri', 'La collinetta', 'Il pascolo lungo']

/* a che scala tocca il sentiero numero `fatti`: col cane, uno sì e uno
   no; ognuna sale coi sentieri suoi, un gradino ogni due */
export function scalaDi(fatti, cane) {
  if (!cane) return { g: gradinoDi(fatti), cane: false }
  const k = Math.floor(fatti / 2)
  if (fatti % 2 === 0) return { g: GRADINI[Math.min(GRADINI.length - 1, Math.floor(k / 2))], cane: false }
  return { g: GRADINI_CANE[Math.min(GRADINI_CANE.length - 1, Math.floor(k / 2))], cane: true }
}

const NOMI = ['Il sentiero', 'La radura', 'Il guado', 'Il campo', 'La collina', 'Il boschetto',
              'La palude', 'Il lago', 'La siepe', 'Il vallone', 'La conca', 'Il pianoro']

/* ── una mappa a caso ── */
function bozza(g, rnd) {
  const [W, H] = g.lato
  const m = Array.from({ length: H }, () => Array(W).fill('.'))
  const tira = p => rnd() < p
  const dentro = (x, y) => x >= 0 && y >= 0 && x < W && y < H
  const a = n => Math.floor(rnd() * n)

  /* il fuori: qualche cella del bordo è bosco o acqua, così il posto ha
     una forma e non è un rettangolo pieno */
  const fuori = tira(0.5) ? 'A' : '~'
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const bordo = x === 0 || y === 0 || x === W - 1 || y === H - 1
    if (bordo && tira(0.22)) m[y][x] = fuori
  }

  /* il ghiaccio: un lago, con qualche sasso piantato dentro */
  if (g.ghiaccio && tira(g.ghiaccio)) {
    const w = 3 + a(Math.max(1, W - 3)), h = 3 + a(Math.max(1, H - 3))
    const x0 = a(W - w + 1), y0 = a(H - h + 1)
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++)
      m[y][x] = tira(0.14) ? 'O' : '*'
  }
  /* un fiume: una riga o una colonna d'acqua, qualche volta col guado */
  if (g.fiume && tira(g.fiume)) {
    if (tira(0.5)) {
      const x = 1 + a(W - 2)
      for (let y = 0; y < H; y++) m[y][x] = '~'
      if (tira(0.3)) m[a(H)][x] = 't'
    } else {
      const y = 1 + a(H - 2)
      for (let x = 0; x < W; x++) m[y][x] = '~'
      if (tira(0.3)) m[y][a(W)] = 't'
    }
  }
  /* una pozza */
  if (g.pozze && tira(g.pozze)) {
    const w = 1 + a(2), h = 1 + a(2)
    const x0 = a(W - w + 1), y0 = a(H - h + 1)
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++)
      if (m[y][x] === '.') m[y][x] = '~'
  }
  /* gli ostacoli sparsi */
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    if (m[y][x] === '.' && tira(g.ostacoli)) m[y][x] = ['A', 'B', 'S'][a(3)]

  const libere = pred => {
    const l = []
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (pred(m[y][x], x, y)) l.push([x, y])
    return l
  }
  const metti = (ch, pred) => {
    const l = libere(pred)
    if (!l.length) return null
    const [x, y] = l[a(l.length)]
    m[y][x] = ch
    return [x, y]
  }

  /* il masso: su un prato, con un po' di posto intorno per spingerlo */
  if (g.massi && tira(g.massi)) {
    metti('m', (c, x, y) => c === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .filter(([dx, dy]) => dentro(x + dx, y + dy) && '.*~'.includes(m[y + dy][x + dx])).length >= 3)
  }
  /* le buche: lontane almeno tre passi, se no la galleria porta nella
     cella accanto e non insegna niente */
  if (g.buche) {
    const b = metti('1', c => c === '.')
    if (!b) return null
    if (!metti('1', (c, x, y) => c === '.' && Math.abs(x - b[0]) + Math.abs(y - b[1]) >= 3)) return null
  }
  if (!metti('P', c => c === '.')) return null
  if (!metti('@', c => c === '.')) return null
  /* la carota può stare anche sul ghiaccio — è lì che si prende
     scivolando — e prende la lettera del terreno che ha sotto */
  const posti = libere(c => c === '.' || c === '*')
  if (!posti.length) return null
  const [cx, cy] = posti[a(posti.length)]
  m[cy][cx] = m[cy][cx] === '*' ? 'C' : 'c'
  return m.map(r => r.join(''))
}

/* ── un posto del cane, a caso ──
   Il recinto è una tacca nel bordo: una o due celle, con la siepe ai
   due lati lungo il bordo, così si entra solo dal prato. Le pecore
   stanno dove si possono ancora recuperare (mai su una cella di
   incastro: partirebbe già persa) e non accanto al cane. */
function bozzaCane(g, rnd) {
  const [W, H] = g.lato
  const m = Array.from({ length: H }, () => Array(W).fill('.'))
  const tira = p => rnd() < p
  const a = n => Math.floor(rnd() * n)

  const fuori = tira(0.5) ? 'A' : '~'
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const bordo = x === 0 || y === 0 || x === W - 1 || y === H - 1
    if (bordo && tira(0.16)) m[y][x] = fuori
  }
  if (g.ghiaccio && tira(g.ghiaccio)) {
    const w = 2 + a(Math.max(1, W - 3)), h = 1 + a(Math.max(1, H - 3))
    const x0 = 1 + a(Math.max(1, W - w - 1)), y0 = 1 + a(Math.max(1, H - h - 1))
    for (let y = y0; y < y0 + h && y < H - 1; y++) for (let x = x0; x < x0 + w && x < W - 1; x++)
      m[y][x] = tira(0.1) ? 'O' : '*'
  }
  /* il recinto: su un lato a caso, una o due celle, siepe ai lati */
  const largo = tira(0.5) ? 2 : 1
  const lato = a(4)
  const lungo = lato < 2 ? W : H
  const da = 1 + a(Math.max(1, lungo - largo - 1))
  const cella = k => (lato === 0 ? [k, 0] : lato === 1 ? [k, H - 1] : lato === 2 ? [0, k] : [W - 1, k])
  for (let k = da - 1; k <= da + largo; k++) {
    if (k < 0 || k >= lungo) continue
    const [x, y] = cella(k)
    m[y][x] = k === da - 1 || k === da + largo ? 'B' : '#'
  }
  /* e davanti al cancello si cammina: niente ostacoli sulla soglia */
  const dentroDi = ([x, y]) => (lato === 0 ? [x, 1] : lato === 1 ? [x, H - 2] : lato === 2 ? [1, y] : [W - 2, y])
  const soglia = []
  for (let k = da; k < da + largo; k++) soglia.push(dentroDi(cella(k)))
  for (const [x, y] of soglia) m[y][x] = '.'

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    if (m[y][x] === '.' && !soglia.some(([sx, sy]) => sx === x && sy === y) && tira(g.ostacoli))
      m[y][x] = ['A', 'B', 'S'][a(3)]

  const libere = pred => {
    const l = []
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (pred(m[y][x], x, y)) l.push([x, y])
    return l
  }
  const vicini = ([x, y], [u, v]) => Math.abs(x - u) + Math.abs(y - v) <= 1
  /* le celle d'incastro dipendono solo dal posto: si guardano prima di
     mettere le pecore */
  const incastro = celleIncastro(new Livello(m.map(r => r.join(''))))
  const pecore = []
  for (let n = 0; n < g.pecore; n++) {
    const l = libere((c, x, y) => c === '.' && !incastro[y * W + x] &&
      !soglia.some(s => s[0] === x && s[1] === y) && !pecore.some(p => vicini(p, [x, y])))
    if (!l.length) return null
    const p = l[a(l.length)]
    pecore.push(p)
    m[p[1]][p[0]] = 'p'
  }
  const cani = libere((c, x, y) => c === '.' && !pecore.some(p => vicini(p, [x, y])))
  if (!cani.length) return null
  const [cx, cy] = cani[a(cani.length)]
  m[cy][cx] = 'P'
  const ossi = libere(c => c === '.')
  if (!ossi.length) return null
  const [ox, oy] = ossi[a(ossi.length)]
  m[oy][ox] = 'c'
  return m.map(r => r.join(''))
}

/* ── un sentiero ──
   `fatti` è quanti ne ha già fatti in questa seduta; `rnd` il caso;
   `cane` se ha già portato il gregge nel recinto. */
export function generaSentiero(fatti, rnd, { prove = 260, cane = false } = {}) {
  const scala = scalaDi(fatti, cane)
  if (scala.cane) return generaPascolo(fatti, rnd, scala.g)
  const g = scala.g
  const tema = TEMI[fatti % TEMI.length]
  const nome = NOMI[Math.floor(rnd() * NOMI.length)]
  /* tre giri, sempre più di manica larga */
  const giri = [
    { lunga: g.lunga, dev: g.dev, regola: g.regola },
    { lunga: [Math.max(2, g.lunga[0] - 1), g.lunga[1] + 1], dev: Math.max(0, g.dev - 1), regola: g.regola },
    { lunga: [2, g.lunga[1] + 2], dev: 0, regola: null },
  ]
  for (const richiesta of giri) {
    for (let i = 0; i < prove; i++) {
      const b = bozza(g, rnd)
      if (!b) continue
      const tappa = { mappa: b, salti: !!g.salti }
      const liv = Livello.da(tappa)
      const mis = misura(liv)
      if (!mis.lunga) continue
      if (mis.lunga < richiesta.lunga[0] || mis.lunga > richiesta.lunga[1]) continue
      if (mis.deviazione < richiesta.dev) continue
      if (richiesta.regola && !serveLaRegola(liv, richiesta.regola)) continue
      return { ...tappa, tema, nome, gradino: GRADINI.indexOf(g), misure: { lunga: mis.lunga, deviazione: mis.deviazione } }
    }
  }
  return { ...RISERVA, tema, nome, gradino: GRADINI.indexOf(g), misure: null }
}

/* un sentiero del cane: stessa strada del coniglio, meno prove (un
   posto con le pecore costa di più) e il risolutore col tetto */
function generaPascolo(fatti, rnd, g, { prove = 90 } = {}) {
  const tema = TEMI[fatti % TEMI.length]
  const nome = NOMI_CANE[Math.floor(rnd() * NOMI_CANE.length)]
  const gradino = GRADINI.length + GRADINI_CANE.indexOf(g)
  const giri = [
    { lunga: g.lunga, dev: g.dev },
    { lunga: [Math.max(3, g.lunga[0] - 2), g.lunga[1] + 2], dev: 0 },
  ]
  for (const richiesta of giri) {
    for (let i = 0; i < prove; i++) {
      const b = bozzaCane(g, rnd)
      if (!b) continue
      const tappa = { mappa: b, salti: false }
      const liv = Livello.da(tappa)
      const mis = misura(liv, { limite: LIMITE_CANE })
      if (!mis.lunga || !mis.corta) continue
      if (mis.lunga < richiesta.lunga[0] || mis.lunga > richiesta.lunga[1]) continue
      if (mis.deviazione < richiesta.dev) continue
      return { ...tappa, tema, nome, gradino, cane: true, misure: { lunga: mis.lunga, deviazione: mis.deviazione } }
    }
  }
  return { ...RISERVA_CANE, tema, nome, gradino, cane: true, misure: null }
}

/* il posto di riserva del cane: una pecora, il recinto davanti */
export const RISERVA_CANE = {
  mappa: [
    'A...BB',
    'P.p.##',
    '....BB',
    'A.c..A',
  ],
  salti: false,
}

/* il livello di riserva: si vince, e non sorprende nessuno */
export const RISERVA = {
  mappa: [
    'A...A',
    'P.B.@',
    '.c...',
    'A...A',
  ],
  salti: false,
}

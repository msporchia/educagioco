/* ═══════════════════════════════════════════════════════════════════
   IL SENTIERO SENZA FINE — livelli fatti al momento

   Dopo la campagna i posti scritti a mano finiscono; il sentiero no. Qui
   un livello si **fa al momento e poi si fa esaminare dal motore**: si
   tiene solo se si vince, se la strada è lunga quanto il livello
   chiede, se la carota vuole una deviazione e se le regole che mette in
   scena servono davvero. Un livello che si vince andando dritti non è
   un sentiero, è un corridoio.

   ── COSA C'È DENTRO ───────────────────────────────────────────────
   Il sentiero sta in fondo alla campagna, e mescola quello che il
   bambino ha già imparato: a ogni posto si tira a caso **la famiglia**
   — il coniglio sul prato, il cane con le pecore, un posto con lo zaino
   col ripeti, col fino a o col se — e dentro la famiglia **le regole**
   (le buche sì o no, il ghiaccio sì o no). Solo fra le cose sbloccate:
   i gradini della campagna finiti (`INGREDIENTI`). Il caso è pesato
   perché il posto non esca né banale né fuori portata: quanto è grande,
   quanto è lunga la strada, quante regole insieme lo dice il livello
   (`livelloDi`), che sale coi sentieri fatti nella seduta. Il caso si
   passa da fuori (`rnd`): lo stesso seme fa lo stesso sentiero, e i
   test raccontano sempre la stessa storia.

   ── DUE MODI DI FARE UN POSTO ─────────────────────────────────────
   Il prato e il cane si costruiscono a caso e si tengono solo se il
   risolutore dice che si vincono, lunghi quanto il livello chiede, con
   la carota (l'osso) che vuole una deviazione, e con la regola
   principale che serve davvero — e con due regole insieme anche la
   seconda, finché il caso lo concede. Con più pecore i posti costano di
   più da risolvere, quindi lì il risolutore ha un tetto (`LIMITE_CANE`).
   I posti con lo zaino vanno al contrario: prima il programma, poi il
   posto scavato attorno alla sua strada (`motore/sagome.js`), perché il
   programma più corto coi cicli il risolutore non lo sa trovare.

   ── SE IL CASO NON AIUTA ──────────────────────────────────────────
   Si prova un certo numero di volte, poi si allarga la richiesta (una
   strada un po' più corta, una deviazione più piccola) e si riprova. In
   fondo c'è sempre un livello di riserva che si vince: un bambino che
   aspetta un sentiero che non arriva è un gioco rotto.
   ═══════════════════════════════════════════════════════════════════ */
import { Livello, celleIncastro } from './livello.js'
import { misura, serveLaRegola } from './risolutore.js'
import { generaZaino, carteInMano } from './sagome.js'
import { TEMI } from '../dati/campagna.js'
import { programma, ripeti } from '../dati/carte.js'

/* un generatore di numeri a seme: sempre la stessa fila per lo stesso seme.
   Il seme si rimescola prima di cominciare: semi vicini (quelli di due
   sentieri di fila) davano primi numeri quasi uguali e piccoli, e il
   primo numero è quello che sceglie la famiglia del posto */
export function caso(seme = 1) {
  let s = Math.imul((seme >>> 0) ^ 0x9e3779b9, 0x85ebca6b) >>> 0
  s = Math.imul(s ^ (s >>> 13), 0xc2b2ae35) >>> 0
  s = (s ^ (s >>> 16)) >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}

/* ═══════════ gli ingredienti ═══════════
   Ogni gradino finito della campagna mette nel sentiero una cosa: una
   regola del mondo, il cane, una carta. Si conta **finito** e non
   visto: al primo livello del ghiaccio il ghiaccio si sta imparando, e
   il sentiero è il posto dove si usa quello che si sa. Il gradino
   «tutto il mondo» non porta niente di nuovo: le sagome mescolano già
   le regole con le scatole. */
export const INGREDIENTI = {
  salto: 'salto', ghiaccio: 'ghiaccio', massi: 'massi', buche: 'buche',
  pecore: 'cane', ripeti: 'ripeti', fino: 'fino', se: 'se',
}
/* le regole del mondo che un posto del prato sa mettere in scena, con
   il nome che il risolutore usa per spegnerle (`serveLaRegola`) */
const REGOLE = { salto: 'salto', ghiaccio: 'ghiaccio', massi: 'spinta', buche: 'buche' }
/* il sentiero si apre alla fine delle buche: chi ci arriva ha già tutte
   e quattro le regole del prato */
export const DI_BASE = ['salto', 'ghiaccio', 'massi', 'buche']

/* ═══════════ il livello ═══════════
   Da 0 a 9: sale di uno ogni due sentieri della seduta, e parte più in
   alto per chi ha finito più gradini — chi ha finito la campagna non
   deve rifarsi i prati da quattro frecce prima di trovare un posto che
   lo impegni. Il livello non sceglie **cosa** c'è nel posto (lo sceglie
   il caso, fra le cose sbloccate): sceglie quanto è lunga la strada,
   quanto è grande il posto, quante regole insieme, quante pecore, e
   quali sagome dello zaino si possono tirare. */
export const LIVELLO_MAX = 9
export const livelloDi = (fatti, sbloccati = DI_BASE) =>
  Math.min(LIVELLO_MAX, Math.max(0, Math.floor((sbloccati.length - 4) / 2)) + Math.floor(fatti / 2))

/* ═══════════ la famiglia ═══════════
   Di che specie è il prossimo posto: il coniglio sul prato, il cane
   con le pecore, o un posto con lo zaino (ripeti, fino a, se). Il caso
   è pesato: ognuna delle cose sbloccate può uscire, e quella appena
   giocata pesa meno — tre posti di fila dello stesso tipo sono il modo
   in cui un sentiero senza fine diventa noioso. Lo zaino pesa un po' di
   più col livello: è il posto dove si pensa di più. */
export const FAMIGLIE = ['prato', 'cane', 'ripeti', 'fino', 'se']
export function famigliaDi(rnd, sbloccati, lv = 0, prima = null) {
  const zaino = 0.8 + lv * 0.06
  const pesi = {
    prato: 1,
    cane: sbloccati.includes('cane') ? 0.8 : 0,
    ripeti: sbloccati.includes('ripeti') ? zaino : 0,
    fino: sbloccati.includes('fino') ? zaino : 0,
    se: sbloccati.includes('se') ? zaino : 0,
  }
  if (prima && pesi[prima]) pesi[prima] *= 0.3
  let t = rnd() * FAMIGLIE.reduce((n, f) => n + pesi[f], 0)
  for (const f of FAMIGLIE) if (pesi[f] && (t -= pesi[f]) <= 0) return f
  return 'prato'
}

/* ═══════════ la ricetta del prato ═══════════
   Quante regole del mondo insieme (una ai primi livelli, due o tre più
   su), quali (a caso fra quelle sbloccate), e le misure che il posto
   deve avere per essere tenuto. La prima regola tirata è quella
   principale: deve servire sempre. */
export function ricettaDelPrato(sbloccati, lv, rnd) {
  const poss = Object.keys(REGOLE).filter(r => sbloccati.includes(r))
  const quante = Math.min(poss.length, lv < 3 ? 1 : lv < 6 ? 1 + (rnd() < 0.5 ? 1 : 0) : 2 + (rnd() < 0.3 ? 1 : 0))
  const regole = []
  while (regole.length < quante) {
    const r = poss[Math.floor(rnd() * poss.length)]
    if (!regole.includes(r)) regole.push(r)
  }
  const ha = r => regole.includes(r)
  const k = regole.length
  return {
    regole,
    lato: [Math.min(8, 5 + Math.floor(lv / 3) + (k > 1 ? 1 : 0)), Math.min(8, 4 + Math.floor((lv + 1) / 2))],
    lunga: [Math.min(10, 3 + Math.floor(lv / 2) + k), Math.min(18, 6 + lv + 2 * k)],
    dev: lv === 0 ? 0 : lv < 4 ? 1 : 2,
    ostacoli: ha('ghiaccio') ? 0.08 : 0.11,
    pozze: ha('salto') ? 0.5 : 1,
    ghiaccio: ha('ghiaccio') ? 1 : 0,
    fiume: ha('salto') ? 1 : 0,
    salti: ha('salto'),
    massi: ha('massi') ? 1 : 0,
    buche: ha('buche') ? 1 : 0,
  }
}

/* ── la ricetta del cane ──
   Una pecora, poi due, poi tre sparse da riunire; il ghiaccio se lo si
   conosce, una volta su due. Il recinto sta sul bordo, con la siepe ai
   lati: il cancello guarda dentro al prato */
export function ricettaDelCane(sbloccati, lv, rnd) {
  const pecore = 1 + (lv >= 3 ? 1 : 0) + (lv >= 6 ? 1 : 0)
  return {
    pecore,
    lato: pecore >= 3 ? [6, 6] : [6 + (lv >= 4 ? 1 : 0), 5 + (lv >= 2 ? 1 : 0)],
    lunga: [Math.min(12, 4 + lv), Math.min(22, 9 + 2 * lv)],
    dev: lv < 2 ? 1 : 2,
    ostacoli: pecore >= 3 ? 0.05 : 0.07,
    ghiaccio: sbloccati.includes('ghiaccio') && pecore < 3 && rnd() < 0.5 ? 0.7 : 0,
  }
}

/* quanti stati guarda il risolutore su un posto del cane, prima di
   lasciarlo stare: un bambino non se ne accorge, un telefono sì */
export const LIMITE_CANE = 20000
const NOMI_CANE = ['Il pascolo', 'Il trifoglio', 'L\'ovile', 'Il prato alto', 'La radura',
                   'Il campo di papaveri', 'La collinetta', 'Il pascolo lungo']

/* quanto vale un sentiero vinto: mezzo minuto un posto del prato o del
   cane, un minuto uno con lo zaino, che chiede di trovare lo schema
   prima di scriverlo (una moneta, dieci secondi: `CALIBRAZIONE.md`) */
export const premioDi = t => (t && t.zaino ? 6 : 3)

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
   `sbloccati` gli ingredienti che conosce (`INGREDIENTI`); `prima` la
   famiglia del sentiero di prima, che così pesa meno. */
export function generaSentiero(fatti, rnd, { sbloccati = DI_BASE, prima = null, prove = 260 } = {}) {
  const lv = livelloDi(fatti, sbloccati)
  const famiglia = famigliaDi(rnd, sbloccati, lv, prima)
  const tema = TEMI[fatti % TEMI.length]
  const base = { famiglia, livello: lv }
  if (famiglia === 'ripeti' || famiglia === 'fino' || famiglia === 'se') {
    const t = generaZaino(famiglia, sbloccati, lv, rnd)
    if (t) return { ...t, ...base, tema: t.tema || tema, cane: !!Livello.da(t).cane, misure: { carte: t.zaino } }
    return { ...RISERVA_ZAINO, carte: carteInMano(sbloccati), ...base, tema, nome: 'Il viale lungo', misure: null }
  }
  if (famiglia === 'cane') return generaPascolo(rnd, ricettaDelCane(sbloccati, lv, rnd), { ...base, tema })
  const g = ricettaDelPrato(sbloccati, lv, rnd)
  const nome = NOMI[Math.floor(rnd() * NOMI.length)]
  const principale = g.regole[0] ? REGOLE[g.regole[0]] : null
  const altre = g.regole.slice(1).map(r => REGOLE[r])
  /* tre giri, sempre più di manica larga: prima tutte le regole (fino a
     due) che servono, poi solo la principale, poi basta che si vinca */
  const giri = [
    { lunga: g.lunga, dev: g.dev, altre: Math.min(1, altre.length), principale },
    { lunga: [Math.max(2, g.lunga[0] - 1), g.lunga[1] + 1], dev: Math.max(0, g.dev - 1), altre: 0, principale },
    { lunga: [2, g.lunga[1] + 2], dev: 0, altre: 0, principale: null },
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
      if (richiesta.principale && !serveLaRegola(liv, richiesta.principale)) continue
      if (richiesta.altre && altre.filter(r => serveLaRegola(liv, r)).length < richiesta.altre) continue
      return { ...tappa, ...base, tema, nome, regole: g.regole, cane: false,
               misure: { lunga: mis.lunga, deviazione: mis.deviazione } }
    }
  }
  return { ...RISERVA, ...base, tema, nome, regole: [], cane: false, misure: null }
}

/* un sentiero del cane: stessa strada del coniglio, meno prove (un
   posto con le pecore costa di più) e il risolutore col tetto */
function generaPascolo(rnd, g, base, { prove = 90 } = {}) {
  const nome = NOMI_CANE[Math.floor(rnd() * NOMI_CANE.length)]
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
      return { ...tappa, ...base, nome, cane: true, misure: { lunga: mis.lunga, deviazione: mis.deviazione } }
    }
  }
  return { ...RISERVA_CANE, ...base, nome, cane: true, misure: null }
}

/* il posto di riserva con lo zaino: un viale, una scatola */
export const RISERVA_ZAINO = {
  mappa: [
    'AAAAAAAA',
    'P..c...A',
    'AAAAAA@A',
  ],
  salti: false,
  zaino: 3,
  soluzioni: [programma(ripeti(6, 'destra'), 'giu')],
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

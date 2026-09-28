/* ═══════════════════════════════════════════════════════════════════
   IL SENTIERO SENZA FINE — livelli fatti al momento

   Dopo la campagna i posti scritti a mano finiscono; il sentiero no. Qui
   un posto si **fa al momento e poi si fa esaminare dal motore**: si
   tiene solo se si vince, se la strada è lunga almeno quanto il
   pavimento, se la carota vuole una deviazione e se le regole che mette
   in scena servono tutte davvero. Un posto che si vince andando dritti
   non è un sentiero, è un corridoio.

   ── IL FINALE ─────────────────────────────────────────────────────
   Il sentiero sta in fondo alla campagna ed è il finale: chi ci gioca
   ha già dimostrato di sapersela cavare da solo. Quindi la difficoltà
   è **sempre in cima**, dal primo sentiero all'ultimo, e la varietà la
   fa il caso **togliendo**: a ogni posto si tira la famiglia — il
   coniglio sul prato, il cane con le pecore, un posto con lo zaino col
   ripeti, col fino a o col se — e il posto nasce con tutto quello che
   quella famiglia sa mettere in scena, meno una o due cose (le buche
   no, il ghiaccio sì…). Solo fra le cose sbloccate: i gradini della
   campagna finiti (`INGREDIENTI`). Il caso si passa da fuori (`rnd`):
   lo stesso seme fa lo stesso sentiero, e i test raccontano sempre la
   stessa storia.

   ── DUE MODI DI FARE UN POSTO ─────────────────────────────────────
   Il prato e il cane si costruiscono a caso e si tengono solo se il
   risolutore dice che si vincono con la carota (l'osso), con la strada
   più corta — anche senza carota — sopra il pavimento (`PAVIMENTO`), e
   con tutte le regole che servono. Con più pecore i posti costano di
   più da risolvere, quindi lì il risolutore ha un tetto (`LIMITE_CANE`).
   I posti con lo zaino vanno al contrario: prima il programma, poi il
   posto scavato attorno alla sua strada (`motore/sagome.js`), perché il
   programma più corto coi cicli il risolutore non lo sa trovare.

   ── SE IL CASO NON AIUTA ──────────────────────────────────────────
   Si prova un certo numero di volte, poi si abbassa di poco il pavimento
   e si riprova. In fondo c'è sempre un posto di riserva che si vince: un
   bambino che aspetta un sentiero che non arriva è un gioco rotto.
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

/* ═══════════ la famiglia ═══════════
   Di che specie è il prossimo posto: il coniglio sul prato, il cane
   con le pecore, o un posto con lo zaino (ripeti, fino a, se). Ognuna
   delle cose sbloccate può uscire, e quella appena giocata pesa meno:
   tre posti di fila dello stesso tipo sono il modo in cui un sentiero
   senza fine diventa noioso. */
export const FAMIGLIE = ['prato', 'cane', 'ripeti', 'fino', 'se']
export function famigliaDi(rnd, sbloccati, prima = null) {
  const pesi = {
    prato: 1,
    cane: sbloccati.includes('cane') ? 0.8 : 0,
    ripeti: sbloccati.includes('ripeti') ? 1 : 0,
    fino: sbloccati.includes('fino') ? 1 : 0,
    se: sbloccati.includes('se') ? 1 : 0,
  }
  if (prima && pesi[prima]) pesi[prima] *= 0.3
  let t = rnd() * FAMIGLIE.reduce((n, f) => n + pesi[f], 0)
  for (const f of FAMIGLIE) if (pesi[f] && (t -= pesi[f]) <= 0) return f
  return 'prato'
}

/* ═══════════ la ricetta: tutto, meno una o due cose ═══════════
   Il sentiero è il finale: chi ci arriva ha già dimostrato di sapersela
   cavare, e la difficoltà sta **sempre in cima**, dal primo sentiero
   all'ultimo — niente scala che sale con le partite. Quello che cambia
   da un posto all'altro lo fa il caso **togliendo**: il posto nasce con
   tutto quello che la sua famiglia sa mettere in scena, e se ne tolgono
   una o due cose. Un prato ha le quattro regole meno una o due (quindi
   due o tre insieme, e tutte devono servire); un pascolo ha tre pecore
   e il ghiaccio, meno uno dei due; lo zaino sceglie fra le sagome a due
   idee (`motore/sagome.js`). Sotto c'è un pavimento, la strada più
   corta **senza** carota: chi lascia perdere la carota non deve trovare
   un posto da tre frecce. */
export const PAVIMENTO = { prato: 10, cane: 12 }

export function ricettaDelPrato(sbloccati, rnd) {
  const poss = Object.keys(REGOLE).filter(r => sbloccati.includes(r))
  const togli = poss.length >= 4 ? 1 + (rnd() < 0.5 ? 1 : 0) : poss.length === 3 ? 1 : 0
  const regole = poss.map(r => [rnd(), r]).sort((p, q) => p[0] - q[0]).map(p => p[1]).slice(togli)
  const ha = r => regole.includes(r)
  return {
    regole,
    /* il labirinto, in celle: cinque per cinque fa una mappa da nove,
       e ogni tanto una fila in più in altezza */
    celle: [5, rnd() < 0.4 ? 6 : 5],
    varchi: 0.12,
    slarghi: 0.25,
    corta: PAVIMENTO.prato,
    lunga: 30,
    dev: 2,
    salti: ha('salto'),
  }
}

/* ── la ricetta del cane ──
   Tre pecore sparse da riunire e il ghiaccio, meno una delle due cose:
   o due pecore sul ghiaccio, o tre sul prato, e ogni tanto tutte e due.
   Il recinto sta sul bordo, con la siepe ai lati: il cancello guarda
   dentro al prato */
export function ricettaDelCane(sbloccati, rnd) {
  const ghiaccio = sbloccati.includes('ghiaccio')
  const via = !ghiaccio ? 'ghiaccio' : scegli3(rnd, ['pecora', 'ghiaccio', 'niente'])
  const pecore = via === 'pecora' ? 2 : 3
  return {
    pecore,
    lato: [7, 6],
    corta: PAVIMENTO.cane,
    lunga: 26,
    dev: 1,
    ostacoli: 0.05,
    ghiaccio: via !== 'ghiaccio' ? 0.9 : 0,
  }
}
const scegli3 = (rnd, l) => l[Math.floor(rnd() * l.length)]

/* quanti stati guarda il risolutore su un posto del cane, prima di
   lasciarlo stare: un bambino non se ne accorge, un telefono sì */
export const LIMITE_CANE = 20000
const NOMI_CANE = ['Il pascolo', 'Il trifoglio', 'L\'ovile', 'Il prato alto', 'La radura',
                   'Il campo di papaveri', 'La collinetta', 'Il pascolo lungo']

/* quanto vale un sentiero vinto: mezzo minuto un posto del prato o del
   cane, un minuto uno con lo zaino, che chiede di trovare lo schema
   prima di scriverlo (una moneta, dieci secondi: `docs/apprendimento/calibrazione.md`) */
export const premioDi = t => (t && t.zaino ? 6 : 3)

const NOMI = ['Il sentiero', 'La radura', 'Il guado', 'Il campo', 'La collina', 'Il boschetto',
              'La palude', 'Il lago', 'La siepe', 'Il vallone', 'La conca', 'Il pianoro']

/* ── un prato del finale: il labirinto di siepi ──
   Un prato aperto tirato a caso ha quasi sempre la strada dritta: su
   quattrocento, nemmeno uno arrivava a dieci frecce. Il finale vuole
   struttura, quindi il prato è **un labirinto di siepi con qualche
   slargo** (un labirinto a caso, con dei varchi in più perché ci siano
   delle scelte, e qualche pilastro tolto), la tana lontana dalla
   partenza, e le regole messe **dove la strada passa**:
     · il salto: un fosso (o un tronco) di traverso a un corridoio;
     · i massi: un masso nel corridoio con la pozza dietro — spinto, fa
       il ponte;
     · il ghiaccio: una macchia che copre un pezzo di labirinto, e sul
       ghiaccio si scivola oltre gli incroci;
     · le buche: la strada si chiude a metà, e dall'altra parte si passa
       solo per la galleria.
   La carota sta in un vicolo. Se tutto questo regge lo dice il
   risolutore, dopo: qui si costruisce e basta. Le siepi sono alte (un
   salto non le scavalca); l'acqua di contorno solo dove non si salta. */
export function bozzaLabirinto(g, rnd) {
  const [CW, CH] = g.celle
  const W = 2 * CW - 1, H = 2 * CH - 1
  const a = n => Math.floor(rnd() * n)
  const aperta = Array.from({ length: H }, () => Array(W).fill(false))
  const i = (x, y) => y * W + x
  /* il labirinto: si scava da una cella a caso, un passo alla volta */
  const vista = new Set()
  const pila = [[2 * a(CW), 2 * a(CH)]]
  aperta[pila[0][1]][pila[0][0]] = true
  vista.add(i(...pila[0]))
  const VERSI = [[2, 0], [-2, 0], [0, 2], [0, -2]]
  while (pila.length) {
    const [x, y] = pila.at(-1)
    const vicini = VERSI.map(([dx, dy]) => [x + dx, y + dy, dx, dy])
      .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < W && ny < H && !vista.has(i(nx, ny)))
    if (!vicini.length) { pila.pop(); continue }
    const [nx, ny, dx, dy] = vicini[a(vicini.length)]
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
  const distanze = (sx, sy) => {
    const d = new Map([[i(sx, sy), 0]])
    const fila = [[sx, sy]]
    const su = new Map()
    while (fila.length) {
      const [x, y] = fila.shift()
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy
        if (!libero(nx, ny) || d.has(i(nx, ny))) continue
        d.set(i(nx, ny), d.get(i(x, y)) + 1)
        su.set(i(nx, ny), [x, y])
        fila.push([nx, ny])
      }
    }
    return { d, su }
  }
  const celle = []
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) celle.push([x, y])
  const [px, py] = celle[a(celle.length)]
  const { d: dp, su: suP } = distanze(px, py)
  const lontane = celle.filter(([x, y]) => dp.has(i(x, y))).sort((p, q) => dp.get(i(...q)) - dp.get(i(...p)))
  const [tx, ty] = lontane[a(Math.min(3, lontane.length))]
  if (dp.get(i(tx, ty)) < 12) return null
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
    prendi(l[a(l.length)], rnd() < 0.35 ? 't' : '~')
  }
  if (g.regole.includes('massi')) {
    const l = dritti().filter(k => !usate.has(k - 1) && !usate.has(k) && !usate.has(k + 1) && !usate.has(k + 2))
    if (!l.length) return null
    const k = l[a(l.length)]
    prendi(k, 'm')
    prendi(k + 1, '~')
    usate.add(k - 1)
  }
  if (g.regole.includes('ghiaccio')) {
    /* una macchia larga tre o quattro, attorno a un pezzo di strada */
    const libere = strada.map((c, k) => k).filter(k => k > 1 && k < strada.length - 2 && !usate.has(k))
    if (!libere.length) return null
    const [cx, cy] = strada[libere[a(libere.length)]]
    const lw = 3 + a(2), lh = 3 + a(2)
    const x0 = Math.max(0, cx - a(lw)), y0 = Math.max(0, cy - a(lh))
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
  const [ox, oy] = vicoli[a(vicoli.length)]
  m[oy][ox] = m[oy][ox] === '*' ? 'C' : 'c'
  /* le siepi: a macchie di alberi e cespugli, e un po' d'acqua dove non
     si salta (l'acqua si scavalca, e aprirebbe scorciatoie) */
  const muri = g.salti ? 'AAB' : 'AAB~'
  const semi = Array.from({ length: 4 }, () => [rnd() * W, rnd() * H, muri[a(muri.length)]])
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (m[y][x] !== null) continue
    let meglio = semi[0], dd = Infinity
    for (const s of semi) { const q = (s[0] - x) ** 2 + (s[1] - y) ** 2; if (q < dd) { dd = q; meglio = s } }
    m[y][x] = meglio[2] === 'A' && rnd() < 0.12 ? 'B' : meglio[2]
  }
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
   `fatti` è quanti ne ha già fatti in questa seduta (sceglie la stagione,
   non la difficoltà); `rnd` il caso; `sbloccati` gli ingredienti che
   conosce (`INGREDIENTI`); `prima` la famiglia del sentiero di prima,
   che così pesa meno. */
export function generaSentiero(fatti, rnd, { sbloccati = DI_BASE, prima = null, prove = 120 } = {}) {
  const famiglia = famigliaDi(rnd, sbloccati, prima)
  const tema = TEMI[fatti % TEMI.length]
  if (famiglia === 'ripeti' || famiglia === 'fino' || famiglia === 'se') {
    const t = generaZaino(famiglia, sbloccati, rnd)
    if (t) return { ...t, famiglia, tema: t.tema || tema, cane: !!Livello.da(t).cane, misure: { carte: t.zaino } }
    return { ...RISERVA_ZAINO, carte: carteInMano(sbloccati), famiglia, tema, nome: 'Il campo arato', misure: null }
  }
  if (famiglia === 'cane') return generaPascolo(rnd, ricettaDelCane(sbloccati, rnd), { famiglia, tema })
  const g = ricettaDelPrato(sbloccati, rnd)
  const nome = NOMI[Math.floor(rnd() * NOMI.length)]
  const regole = g.regole.map(r => REGOLE[r])
  /* due giri: prima col pavimento pieno, poi un poco più basso. Le regole
     devono servire tutte in tutti e due: un posto «dei massi» che si
     vince girando attorno al masso non ha i massi, ha un sasso in più */
  for (const corta of [g.corta, g.corta - 2]) {
    for (let i = 0; i < prove; i++) {
      const b = bozzaLabirinto(g, rnd)
      if (!b) continue
      const tappa = { mappa: b, salti: !!g.salti }
      const liv = Livello.da(tappa)
      const mis = misura(liv)
      if (!mis.lunga || mis.corta < corta || mis.lunga > g.lunga || mis.deviazione < g.dev) continue
      if (!regole.every(r => serveLaRegola(liv, r))) continue
      return { ...tappa, famiglia, tema, nome, regole: g.regole, cane: false,
               misure: { lunga: mis.lunga, corta: mis.corta, deviazione: mis.deviazione } }
    }
  }
  return { ...RISERVA, famiglia, tema, nome, regole: [], cane: false, misure: null }
}

/* un sentiero del cane: stessa strada del coniglio, meno prove (un
   posto con le pecore costa di più) e il risolutore col tetto */
function generaPascolo(rnd, g, base, { prove = 160 } = {}) {
  const nome = NOMI_CANE[Math.floor(rnd() * NOMI_CANE.length)]
  for (const corta of [g.corta, g.corta - 3]) {
    for (let i = 0; i < prove; i++) {
      const b = bozzaCane(g, rnd)
      if (!b) continue
      const tappa = { mappa: b, salti: false }
      const liv = Livello.da(tappa)
      const mis = misura(liv, { limite: LIMITE_CANE })
      if (!mis.lunga || !mis.corta) continue
      if (mis.corta < corta || mis.lunga > g.lunga || mis.deviazione < g.dev) continue
      return { ...tappa, ...base, nome, cane: true,
               misure: { lunga: mis.lunga, corta: mis.corta, deviazione: mis.deviazione } }
    }
  }
  return { ...RISERVA_CANE, ...base, nome, cane: true, misure: null }
}

/* il posto di riserva con lo zaino: un campo arato, che sta sopra il
   pavimento anche lui */
export const RISERVA_ZAINO = {
  mappa: [
    'P.....A',
    'BBBBB.A',
    '..c...A',
    '.BBBBBA',
    '.....@A',
  ],
  salti: false,
  zaino: 9,
  soluzioni: [programma(ripeti(2, ripeti(5, 'destra'), ripeti(2, 'giu'), ripeti(5, 'sinistra'), ripeti(2, 'giu')))],
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

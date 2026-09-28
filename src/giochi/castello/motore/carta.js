// La carta di una tappa (dato puro, gira in Node): da una tappa del tower
// defense (le `forme`, curve 0-1) a una carta di 12x22 celle, con gli
// stessi caratteri della pianta della scheda di prompt
// (strumenti/sprite/sorgenti/castello/generati/PROMPT-scenario.md):
//   .  fondo          ,  fondo con qualcosa in più     ^  il fitto
//   ~  acqua          d  decoro sparso                 +  strada
//   o  piazzola       A  bocca (3x2, in cima)           C  castello (5x3, in fondo)
// Le distrazioni (laghi, fitto, decori) le sceglie un generatore col seme
// della tappa e non toccano mai il gioco (strada, piazzole, bocca, castello).

// Tappe che la conversione automatica non sa mettere sulla scacchiera e non
// hanno ancora una carta a mano: oggi vuoto (unita/castello-carta lo pretende).
export const DA_RIDISEGNARE = []

// Le carte scritte a mano: strada e piazzole cella per cella (`+`/`o`), il
// resto lo mette `cartaDi` come per le altre. Le vie non si scrivono: sono
// tutti i cammini dalla bocca al castello (`camminiDi`).
export const A_MANO = {
  'libera-bosco': [
    '............',
    '............',
    '......+.....',
    '......+.....',
    '..++++++++..',
    '..+o.o..o+..',
    '..+++..+++..',
    '...o+o.+o...',
    '.++++..++++.',
    '.+........+.',
    '.+o......o+.',
    '.++++..++++.',
    '...o+.o+o...',
    '....++++....',
    '.....o+.....',
    '...++++o....',
    '...+o.......',
    '...++++.....',
    '......+.....',
    '............',
    '............',
    '............',
  ],
}

export const COLONNE = 12
export const RIGHE = 22
const BOCCA = { w: 3, h: 2 }
const CASTELLO = { w: 5, h: 3 }
const PRIMA = BOCCA.h            // la prima riga di strada, sotto la bocca
const ULTIMA = RIGHE - CASTELLO.h - 1

const PASSI = { N: [0, -1], S: [0, 1], O: [-1, 0], E: [1, 0] }
const CONTRO = { N: 'S', S: 'N', O: 'E', E: 'O' }
const k = (x, y) => `${x},${y}`
const stringe = (v, a, b) => Math.max(a, Math.min(b, v))

// un generatore piccolo e col seme (mulberry32), dal nome della tappa
function sorte(nome) {
  let h = 2166136261
  for (const c of String(nome)) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  let a = h >>> 0
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Da una forma a una fila di celle: si provano pochi `MODI` in ordine e si
// tiene il primo che rispetta la scacchiera (`stradeDi`), sempre nello
// stesso ordine perché la stessa tappa esca sempre uguale.
const Y0 = 0.04, Y1 = 0.95
const RIGA = {
  stende: y => PRIMA + Math.round((y - Y0) / (Y1 - Y0) * (ULTIMA - PRIMA)),
  taglia: y => Math.floor(y * RIGHE),
}
const COLONNA = {
  difetto: x => Math.floor(x * COLONNE),
  vicino: x => Math.round(x * COLONNE - 0.5),
}
export const MODI = []
for (const riga of Object.keys(RIGA))
  for (const colonna of Object.keys(COLONNA))
    for (const cortoPrima of [true, false]) MODI.push({ riga, colonna, cortoPrima })

export function filaDi(forma, { riga = 'stende', colonna = 'difetto', cortoPrima = true } = {}) {
  // le colonne restano fra la seconda e la penultima: sul bordo non c'è
  // dove mettere una piazzola
  const vertici = forma.map(([x, y]) => [stringe(COLONNA[colonna](x), 1, COLONNE - 2),
                                         stringe(RIGA[riga](y), PRIMA + 1, ULTIMA - 1)])
  // la strada esce dalla bocca dritta per una cella, ed entra dritta nel
  // castello
  const [x0] = vertici[0]
  const [xe] = vertici[vertici.length - 1]
  vertici.splice(0, 1, [x0, PRIMA], [x0, PRIMA + 1])
  vertici.splice(vertici.length - 1, 1, [xe, ULTIMA - 1], [xe, ULTIMA])
  const fila = [vertici[0]]
  const vai = (x, y) => {
    let [cx, cy] = fila[fila.length - 1]
    while (cx !== x) { cx += Math.sign(x - cx); fila.push([cx, cy]) }
    while (cy !== y) { cy += Math.sign(y - cy); fila.push([cx, cy]) }
  }
  for (let i = 1; i < vertici.length; i++) {
    const [ax, ay] = fila[fila.length - 1]
    const [bx, by] = vertici[i]
    const largo = Math.abs(bx - ax) >= Math.abs(by - ay)
    // il gomito: di traverso e poi lungo, o al contrario
    if (largo === cortoPrima) { vai(ax, by); vai(bx, by) }
    else { vai(bx, ay); vai(bx, by) }
  }
  // niente andirivieni: A, B, A diventa A
  const pulita = []
  for (const c of fila) {
    const n = pulita.length
    if (n && pulita[n - 1][0] === c[0] && pulita[n - 1][1] === c[1]) continue
    if (n > 1 && pulita[n - 2][0] === c[0] && pulita[n - 2][1] === c[1]) { pulita.pop(); continue }
    pulita.push(c)
  }
  return pulita
}

const versoFra = ([ax, ay], [bx, by]) =>
  (by < ay ? 'N' : by > ay ? 'S' : bx < ax ? 'O' : 'E')

// Si provano i MODI in ordine e si tiene il primo senza guasti; se nessuno
// ci riesce, quello che ne ha di meno.
function stradeDi(forme) {
  let meglio = null
  for (const modo of MODI) {
    const vie = forme.map(f => filaDi(f, modo))
    const { versi, guasti } = controllaVie(vie)
    if (!meglio || guasti.length < meglio.guasti.length) meglio = { vie, versi, guasti, modo }
    if (!guasti.length) break
  }
  return meglio
}

// I versi di ogni cella di strada, e cosa non rispetta la scacchiera (vale
// per le vie convertite e per quelle scritte a mano).
function controllaVie(vie) {
  {
    const versi = new Map()
    const dai = (c, v) => {
      if (!versi.has(k(...c))) versi.set(k(...c), new Set())
      if (v) versi.get(k(...c)).add(v)
    }
    for (const via of vie) {
      via.forEach((c, i) => {
        dai(c)
        if (via[i + 1]) {
          const v = versoFra(c, via[i + 1])
          dai(c, v)
          dai(via[i + 1], CONTRO[v])
        }
      })
      dai(via[0], 'N')
      dai(via[via.length - 1], 'S')
    }
    const guasti = []
    const e = (x, y) => versi.has(k(x, y))
    for (const [kk, vv] of versi) {
      const [x, y] = kk.split(',').map(Number)
      if (e(x + 1, y) && e(x, y + 1) && e(x + 1, y + 1))
        guasti.push(`(${x},${y}) quattro celle di strada in quadrato`)
      for (const [v, [dx, dy]] of Object.entries(PASSI))
        if (e(x + dx, y + dy) && !vv.has(v))
          guasti.push(`(${x},${y}) corsie che si toccano senza collegarsi, verso ${v}`)
    }
    for (const via of vie) {
      const gia = new Set()
      for (const c of via) {
        // una via che ripassa da una cella la deve attraversare dritta:
        // è l'incrocio del bastione, non un nodo
        if (gia.has(k(...c)) && versi.get(k(...c)).size !== 4)
          guasti.push(`(${c}) la strada ripassa da una cella senza attraversarla`)
        gia.add(k(...c))
      }
    }
    return { versi, guasti }
  }
}

// Tutti i cammini semplici dalla prima riga (sotto la bocca) all'ultima
// (sopra il castello), da sinistra a destra: più di quattro vuol dire un
// anello che nessuna tappa chiede.
function camminiDi(disegno) {
  const e = (x, y) => (disegno[y] || '')[x] === '+'
  const fuori = []
  const giro = (via, visti) => {
    if (fuori.length > 8) return
    const [x, y] = via[via.length - 1]
    if (y === ULTIMA) { fuori.push(via.slice()); return }
    for (const [dx, dy] of Object.values(PASSI)) {
      const q = [x + dx, y + dy]
      if (!e(...q) || visti.has(k(...q)) || q[1] < PRIMA) continue
      visti.add(k(...q)); via.push(q)
      giro(via, visti)
      via.pop(); visti.delete(k(...q))
    }
  }
  for (let x = 0; x < COLONNE; x++) if (e(x, PRIMA)) giro([[x, PRIMA]], new Set([k(x, PRIMA)]))
  const prima = (p, q) => {
    for (let i = 0; i < Math.min(p.length, q.length); i++)
      if (p[i][0] !== q[i][0] || p[i][1] !== q[i][1]) return p[i][0] - q[i][0]
    return p.length - q.length
  }
  return fuori.sort(prima)
}

function stradeAMano(disegno) {
  const vie = camminiDi(disegno)
  const { versi, guasti } = controllaVie(vie)
  if (vie.length > 4) guasti.push(`${vie.length} cammini dalla bocca al castello: la strada ha un anello`)
  disegno.forEach((r, y) => [...r].forEach((c, x) => {
    if (c === '+' && !versi.has(k(x, y))) guasti.push(`(${x},${y}) strada che non porta al castello`)
  }))
  return { vie, versi, guasti, modo: 'a mano' }
}

// Le piazzole di una carta a mano: le `o` del disegno, occupate nell'ordine
// della via più vicina all'ingresso (come fa il motore).
function piazzoleAMano(disegno, vie) {
  const fuori = []
  disegno.forEach((r, y) => [...r].forEach((c, x) => {
    if (c !== 'o') return
    let meglio = null
    vie.forEach((via, iv) => via.forEach(([vx, vy], d) => {
      if (Math.abs(vx - x) + Math.abs(vy - y) === 1 && (!meglio || d < meglio.d)) meglio = { d, iv }
    }))
    fuori.push({ x, y, d: meglio ? meglio.d : Infinity, via: meglio ? meglio.iv : 0 })
  }))
  fuori.sort((p, q) => p.d - q.d || p.via - q.via || p.y - q.y || p.x - q.x)
  return fuori.map(({ x, y, via }) => [x, y, via])
}

export function cartaDi(tappa, { seme = tappa.chiave || tappa.nome, posti } = {}) {
  const caso = sorte(seme)
  const forme = tappa.forme || [tappa.forma]
  const disegno = A_MANO[tappa.chiave] || A_MANO[tappa.nome]
  const { vie, versi, guasti: guastiStrada, modo } = disegno ? stradeAMano(disegno) : stradeDi(forme)
  const griglia = Array.from({ length: RIGHE }, () => Array(COLONNE).fill('.'))
  const dentro = (x, y) => x >= 0 && x < COLONNE && y >= 0 && y < RIGHE
  const a = (x, y) => (dentro(x, y) ? griglia[y][x] : null)
  const metti = (x, y, c) => { if (dentro(x, y)) griglia[y][x] = c }
  const guasti = [...guastiStrada]
  for (const kk of versi.keys()) metti(...kk.split(',').map(Number), '+')

  // le bocche e il castello
  for (const x of new Set(vie.map(v => v[0][0]))) {
    const x0 = stringe(x - 1, 0, COLONNE - BOCCA.w)
    for (let dy = 0; dy < BOCCA.h; dy++)
      for (let dx = 0; dx < BOCCA.w; dx++) metti(x0 + dx, dy, 'A')
    if (x0 + 1 !== x) guasti.push(`la bocca sopra la colonna ${x} non è centrata: è troppo vicina al bordo`)
  }
  const fini = new Set(vie.map(v => v[v.length - 1][0]))
  if (fini.size > 1) guasti.push(`le strade finiscono in colonne diverse (${[...fini]}): il castello è uno`)
  const xc = stringe([...fini][0] - 2, 0, COLONNE - CASTELLO.w)
  for (let dy = 0; dy < CASTELLO.h; dy++)
    for (let dx = 0; dx < CASTELLO.w; dx++) metti(xc + dx, ULTIMA + 1 + dy, 'C')

  // le piazzole: come nel motore (Percorso.piazzole), in proporzione alla
  // lunghezza di ogni strada, partendo dall'ingresso, lati alterni
  const quante = posti ?? tappa.posti ?? 6
  const lung = vie.map(v => v.length)
  const tot = lung.reduce((s, l) => s + l, 0)
  const quote = lung.map(l => Math.max(1, Math.round(quante * l / tot)))
  const libera = (x, y) => a(x, y) === '.'
  const vicinaAPiazzola = (x, y) => {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) if (a(x + dx, y + dy) === 'o') return true
    return false
  }
  const perVia = vie.map((via, iv) => {
    const posti = []
    const passo = via.length / (quote[iv] + 1)
    for (let i = 1; i <= quote[iv]; i++) posti.push({ via, d: Math.round(passo * (i + iv * 0.34)), lato: i % 2 })
    return posti
  })
  const fila = []
  for (let i = 0; i < Math.max(...quote); i++) for (const p of perVia) if (p[i]) fila.push(p[i])
  let messe = 0
  const piazzole = []          // nell'ordine in cui il motore le occupa: [x, y, via]
  if (disegno)
    for (const [x, y, via] of piazzoleAMano(disegno, vie)) {
      if (!libera(x, y) || vicinaAPiazzola(x, y)) guasti.push(`(${x},${y}) piazzola non libera o attaccata a un'altra`)
      metti(x, y, 'o'); piazzole.push([x, y, via]); messe++
    }
  for (const { via, d, lato } of disegno ? [] : fila) {
    if (messe >= quante) break
    let fatto = false
    for (let s = 0; s < via.length && !fatto; s++) {
      for (const j of [d + s, d - s]) {
        const c = via[stringe(j, 0, via.length - 1)]
        const nx = via[stringe(j + 1, 0, via.length - 1)]
        const v = versoFra(c, nx === c ? via[stringe(j - 1, 0, via.length - 1)] : nx)
        const lati = v === 'N' || v === 'S' ? [[-1, 0], [1, 0]] : [[0, -1], [0, 1]]
        for (const [dx, dy] of lato ? lati : lati.slice().reverse()) {
          const [x, y] = [c[0] + dx, c[1] + dy]
          if (libera(x, y) && !vicinaAPiazzola(x, y)) {
            metti(x, y, 'o'); piazzole.push([x, y, vie.indexOf(via)])
            messe++; fatto = true; break
          }
        }
        if (fatto) break
      }
    }
  }
  if (messe !== quante) guasti.push(`piazzole: ${messe} invece di ${quante}`)

  // le distrazioni: vicino = a una cella dalla strada/piazzola/bocca/castello
  const vicino = (x, y) => {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) if ('+oAC'.includes(a(x + dx, y + dy) || '.')) return true
    return false
  }
  const lontana = (x, y) => libera(x, y) && !vicino(x, y)
  const riquadroLibero = (x0, y0, w, h) => {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) if (!dentro(x, y) || !lontana(x, y)) return false
    return true
  }

  // i laghetti: da zero a due, con la riva frastagliata (un rettangolo
  // pieno sembrerebbe una piscina)
  const laghi = Math.floor(caso() * 3)
  for (let n = 0, tentativi = 0; n < laghi && tentativi < 200; tentativi++) {
    const w = 2 + Math.floor(caso() * 2), h = 2 + Math.floor(caso() * 3)
    const bordo = caso() < 0.6
    const x0 = bordo ? (caso() < 0.5 ? 0 : COLONNE - w) : Math.floor(caso() * (COLONNE - w))
    const y0 = PRIMA + Math.floor(caso() * (ULTIMA - PRIMA - h))
    if (!riquadroLibero(x0, y0, w, h)) continue
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        const spigolo = (y === y0 || y === y0 + h - 1) && (x === x0 || x === x0 + w - 1)
        if (!(spigolo && w * h > 4 && caso() < 0.5)) metti(x, y, '~')
      }
    n++
  }

  // il fitto: la cornice che chiude il campo, poi cresce un po' verso
  // dentro, a macchie
  for (let y = 0; y < RIGHE; y++)
    for (let x = 0; x < COLONNE; x++) {
      const cornice = x === 0 || x === COLONNE - 1 || y === 0 || y >= ULTIMA + 1
      if (cornice && lontana(x, y)) metti(x, y, '^')
    }
  for (let giro = 0; giro < 2; giro++) {
    const nuovi = []
    for (let y = 0; y < RIGHE; y++)
      for (let x = 0; x < COLONNE; x++) {
        if (!lontana(x, y)) continue
        const accanto = Object.values(PASSI).filter(([dx, dy]) => a(x + dx, y + dy) === '^').length
        if (accanto && caso() < 0.28 * accanto) nuovi.push([x, y])
      }
    for (const [x, y] of nuovi) metti(x, y, '^')
  }

  // le chiazze di fondo, a coppie, e i decori sparsi: mai accanto a una
  // piazzola né a un altro decoro
  for (let n = 0; n < 4; n++) {
    const x = Math.floor(caso() * (COLONNE - 1)), y = PRIMA + Math.floor(caso() * (ULTIMA - PRIMA))
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (libera(x + dx, y + dy)) metti(x + dx, y + dy, ',')
  }
  for (let y = 0; y < RIGHE; y++)
    for (let x = 0; x < COLONNE; x++) {
      if (!'.,'.includes(a(x, y)) || caso() > 0.16) continue
      let accanto = false
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) if ('od'.includes(a(x + dx, y + dy) || '.')) accanto = true
      if (!accanto) metti(x, y, 'd')
    }

  return {
    righe: griglia.map(r => r.join('')),
    vie, guasti, piazzole, modo,
  }
}

// Dalla carta al motore: il motore ragiona in coordinate 0-1, qui le vie
// diventano spezzate per il centro delle celle (solo gli spigoli restano).
// La strada comincia dentro la bocca e finisce dentro il castello, non sul
// ciglio, o un mostro sembra spuntare dal prato.
export const DENTRO_LA_BOCCA = 0.3          // in celle, dal bordo di sopra
export const DENTRO_IL_CASTELLO = ULTIMA + 1.4

export function percorsoDi(carta) {
  const centro = ([x, y]) => [(x + 0.5) / COLONNE, (y + 0.5) / RIGHE]
  const forme = carta.vie.map(via => {
    const [x0] = via[0], [xe] = via[via.length - 1]
    const celle = [[x0, DENTRO_LA_BOCCA], ...via, [xe, DENTRO_IL_CASTELLO]]
    const spigoli = celle.filter((c, i) => {
      const a = celle[i - 1], b = celle[i + 1]
      if (!a || !b) return true
      // in riga con chi sta prima e dopo: non è uno spigolo
      return !((a[0] === c[0] && c[0] === b[0]) || (a[1] === c[1] && c[1] === b[1]))
    })
    return spigoli.map(centro)
  })
  const posti = carta.piazzole.map(([x, y, via]) => [...centro([x, y]), via])
  return { forme, percorso: { spigoli: true, posti } }
}

/* ═══════════════════════════════════════════════════════════════════
   LA CARTA DI UNA TAPPA — il campo sulla scacchiera, e tutto il resto
   intorno

   Dato puro, gira in Node: da una tappa del tower defense (le sue
   `forme`, curve in coordinate 0–1) a una **carta** di 12×22 celle,
   scritta con gli stessi caratteri della pianta della scheda di prompt
   (`strumenti/sprite/sorgenti/castello/generati/PROMPT-scenario.md`):

     .  fondo          ,  fondo con qualcosa in più     ^  il fitto
     ~  acqua          d  decoro sparso                 +  strada
     o  piazzola       A  bocca (3×2, in cima)          C  castello (5×3, in fondo)

   Così la stessa carta si disegna con lo schema (`scacchiera.py
   --carte`) oggi, e con i pezzi del foglio domani.

   ── la strada: a squadra, una per cella ──
   Le forme delle tappe sono spezzate oblique, smussate dal motore. Qui
   ogni vertice cade nella sua cella e fra due vertici si mette **un
   gomito**: prima di traverso e poi lungo, dove il tratto è più lungo
   che alto (le corsie del bosco), e al contrario dove è più alto che
   lungo. È il modo in cui una serpentina diventa una serpentina a
   squadra invece di una scala di gradini da una cella.

   ── il resto lo mette il caso, ma un caso con un seme ──
   Il fitto sui bordi, i laghetti, i decori e le chiazze di fondo li
   sceglie un generatore col seme della tappa: la stessa tappa esce
   sempre uguale, e due tappe diverse non si somigliano. Sono le
   «distrazioni» che rendono vivo il campo — in `td_1.png` sono metà
   della bellezza — e hanno una regola sola: **non toccano il gioco**.
   Mai sulla strada o su una piazzola, mai acqua o fitto a ridosso di
   dove si gioca, e mai un decoro attaccato a una piazzola, che
   sembrerebbe parte di lei.
   ═══════════════════════════════════════════════════════════════════ */

/* Le tappe che la conversione automatica non sa mettere sulla
   scacchiera, per chiave o per nome: vanno ridisegnate a mano, a celle,
   quando il gioco si rifà. `unita/castello-carta` pretende che tutte le
   altre passino, e che queste servano ancora — una che si aggiusta da
   sé deve uscire dall'elenco. */
export const DA_RIDISEGNARE = ['libera-bosco']

export const COLONNE = 12
export const RIGHE = 22
const BOCCA = { w: 3, h: 2 }
const CASTELLO = { w: 5, h: 3 }
/* la prima riga di strada, sotto la bocca, e l'ultima, sopra il castello */
const PRIMA = BOCCA.h
const ULTIMA = RIGHE - CASTELLO.h - 1

const PASSI = { N: [0, -1], S: [0, 1], O: [-1, 0], E: [1, 0] }
const CONTRO = { N: 'S', S: 'N', O: 'E', E: 'O' }
const k = (x, y) => `${x},${y}`
const stringe = (v, a, b) => Math.max(a, Math.min(b, v))

/* un generatore piccolo e col seme: `mulberry32`, e il seme viene dal nome */
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

/* ── da una forma a una fila di celle ──
   Le forme stanno fra y = 0,04 (sotto il bordo di sopra) e 0,95 (il
   piede del castello). Come portarle sulle righe e sulle colonne non ha
   una risposta sola: con dodici colonne le corsie stanno strette, e un
   arrotondamento che separa bene le anse del sentiero schiaccia quelle
   del delta. Quindi i modi sono pochi, scritti qui in ordine, e si
   tiene **il primo che rispetta la scacchiera** (`MODI`, e il giro in
   `stradeDi`). Sempre nello stesso ordine: la stessa tappa esce sempre
   uguale.

     stende   il tratto 0,04–0,95 si allarga su tutte le righe fra la
              bocca e il castello
     taglia   la riga è quella di y, e quello che cade sotto la bocca o
              dentro il castello si spinge fuori
   e per ciascuno le colonne arrotondate per difetto o al più vicino, e
   il gomito col tratto corto per primo o per secondo. */
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
  /* le colonne restano fra la seconda e la penultima: una strada sul
     bordo non ha dove mettere una piazzola, e la bocca sopra di lei non
     starebbe nel mezzo */
  const vertici = forma.map(([x, y]) => [stringe(COLONNA[colonna](x), 1, COLONNE - 2),
                                         stringe(RIGA[riga](y), PRIMA + 1, ULTIMA - 1)])
  /* la strada esce dalla bocca **dritta** per una cella, ed entra dritta
     nel castello: un gomito subito sotto il varco farebbe strada anche
     la cella accanto, cioè una bocca da cui la strada esce di lato */
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

/* ── la carta ── */
/* La strada di una tappa: le vie, i versi di ogni cella, e cosa non va.
   Si provano i `MODI` in ordine e si tiene il primo senza guasti; se
   nessuno ci riesce, quello che ne ha di meno — e i guasti si dicono. */
function stradeDi(forme) {
  let meglio = null
  for (const modo of MODI) {
    const vie = forme.map(f => filaDi(f, modo))
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
        /* una via che ripassa da una cella la deve attraversare dritta:
           è l'incrocio del bastione, non un nodo */
        if (gia.has(k(...c)) && versi.get(k(...c)).size !== 4)
          guasti.push(`(${c}) la strada ripassa da una cella senza attraversarla`)
        gia.add(k(...c))
      }
    }
    if (!meglio || guasti.length < meglio.guasti.length) meglio = { vie, versi, guasti, modo }
    if (!guasti.length) break
  }
  return meglio
}

export function cartaDi(tappa, { seme = tappa.chiave || tappa.nome, posti } = {}) {
  const caso = sorte(seme)
  const forme = tappa.forme || [tappa.forma]
  const { vie, versi, guasti: guastiStrada, modo } = stradeDi(forme)
  const griglia = Array.from({ length: RIGHE }, () => Array(COLONNE).fill('.'))
  const dentro = (x, y) => x >= 0 && x < COLONNE && y >= 0 && y < RIGHE
  const a = (x, y) => (dentro(x, y) ? griglia[y][x] : null)
  const metti = (x, y, c) => { if (dentro(x, y)) griglia[y][x] = c }
  const guasti = [...guastiStrada]
  for (const kk of versi.keys()) metti(...kk.split(',').map(Number), '+')

  /* le bocche e il castello */
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

  /* ── le piazzole ──
     Come nel motore (`Percorso.piazzole`): in proporzione alla lunghezza
     di ogni strada, a passi regolari **partendo dall'ingresso**, ai lati
     alterni, e occupate a giro fra le strade. Una piazzola è una cella
     libera accanto alla strada, e due piazzole non si toccano. */
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
  for (const { via, d, lato } of fila) {
    if (messe >= quante) break
    /* dalla cella a quel punto della strada, poi via via più lontano
       lungo la strada, finché un lato non è libero */
    let fatto = false
    for (let s = 0; s < via.length && !fatto; s++) {
      for (const j of [d + s, d - s]) {
        const c = via[stringe(j, 0, via.length - 1)]
        const nx = via[stringe(j + 1, 0, via.length - 1)]
        const v = versoFra(c, nx === c ? via[stringe(j - 1, 0, via.length - 1)] : nx)
        const lati = v === 'N' || v === 'S' ? [[-1, 0], [1, 0]] : [[0, -1], [0, 1]]
        for (const [dx, dy] of lato ? lati : lati.slice().reverse()) {
          const [x, y] = [c[0] + dx, c[1] + dy]
          if (libera(x, y) && !vicinaAPiazzola(x, y)) { metti(x, y, 'o'); messe++; fatto = true; break }
        }
        if (fatto) break
      }
    }
  }
  if (messe < quante) guasti.push(`piazzole: ${messe} invece di ${quante}`)

  /* ── le distrazioni ──
     Vicino = a una cella (anche di sbieco) dalla strada, da una
     piazzola, dalla bocca o dal castello: lì resta il fondo, al massimo
     un decoro. */
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

  /* i laghetti: da zero a due, prima quelli che entrano dal bordo, e
     con la riva frastagliata — un rettangolo pieno sembrerebbe una
     piscina */
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

  /* il fitto: la cornice che chiude il campo — i bordi di lato, gli
     angoli in fondo accanto al castello, la riga in cima fra le bocche —
     e poi cresce un po' verso dentro, a macchie */
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

  /* le chiazze di fondo diverso, a coppie, e i decori sparsi: un decoro
     anche accanto alla strada (ci stanno, nella scena), ma mai accanto a
     una piazzola né a un altro decoro */
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
    vie, guasti, piazzole: messe, modo,
  }
}

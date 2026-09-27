/* ═══════════════════════════════════════════════════════════════════
   LE SAGOME — i posti con lo zaino, fatti al momento

   Un posto del prato si genera a caso e si fa esaminare dal risolutore
   (`motore/generatore.js`): la strada più corta la trova lui, esatta.
   Con lo zaino non basta — il programma più corto coi cicli non lo trova
   una ricerca in ampiezza — quindi qui si va **al contrario**: prima si
   sceglie il programma, poi si scava il posto attorno alla strada che
   fa. La soluzione esiste per costruzione, e lo zaino è largo quanto lei.

   Una sagoma è una **forma di posto**, ognuna col suo «aha», quelle
   della fine della campagna, con due idee insieme: le due scale dove
   l'ordine conta, le terrazze (una scatola dentro l'altra), il campo
   arato, i sassi nel fiume, la spirale di ghiaccio, le pozze coi massi;
   col «fino a» i gradini storti, il campo storto (a piedi o a salti) e
   le scale coi pianerottoli, a due colori; col «se» le colline e il
   sentiero dei segni (sul prato o sul ghiaccio). Ogni sagoma tira a caso
   le sue misure — quante volte, quanto lunghi i gradini, dove la carota,
   che colore — e il posto finito si gira e si specchia a caso: la stessa
   scala scende a destra, sale a sinistra, va in giù.

   ── COSA SI PRETENDE, PRIMA DI TENERLO ────────────────────────────
   Il sentiero è il finale, quindi c'è un pavimento: uno zaino di almeno
   cinque carte e una strada, freccia per freccia, di almeno dodici
   mosse (`provaLoZaino`). Poi il motore vero rigioca tutto, e il posto
   si butta se:
     · la mappa non è scritta bene (una tana, una carota, le misure);
     · la soluzione non arriva a casa con la carota;
     · la strada, scritta freccia per freccia, ci sta nello zaino — il
       ciclo non servirebbe;
     · una delle mosse ingenue obbligatorie vince con la carota: la
       scatola con le frecce nell'ordine sbagliato, i colori scambiati,
       un «se» dimenticato;
     · col «fino a», **un numero qualunque** al posto di ogni colore vince
       lo stesso: si provano tutti, testa per testa. Se ne basta uno, il
       «fino a» è una comodità e non la carta del posto.
   Le altre mosse ingenue (un giro in più o in meno) si tengono solo se
   perdono: servono al 💡, non alla prova.

   ── IL FUORI ──────────────────────────────────────────────────────
   Quello che la sagoma non scava lo riempie `componi`, e solo con cose
   che non si attraversano — alberi, cespugli, sassi, acqua — così la
   strada del risolutore resta quella scavata: una scorciatoia nel bosco
   farebbe stare la strada nello zaino. Niente prato di contorno: un
   pezzo d'erba che dalla strada non si raggiunge sembra una strada, e
   un bambino ci prova. Il fuori è **a macchie** (un boschetto, uno
   stagno, una siepe), non sparso cella per cella: sparso sembra rumore,
   e il posto non ha una forma.
   ═══════════════════════════════════════════════════════════════════ */
import { Livello } from './livello.js'
import { esegui, TANA } from './mondo.js'
import { risolvi } from './risolutore.js'
import { guastiDellaMappa, COLONNE_MAX, RIGHE_MAX, LATO_MIN } from '../dati/mondo.js'
import { programma, ripeti, se, carteDi, eRipeti, valoreDi, apri, VOLTE, COLORI, CASA } from '../dati/carte.js'

/* una sagoma che non torna (un pezzo di strada sopra un altro, un posto
   troppo largo) si butta e se ne tira un'altra */
const STORTO = Symbol('storto')
const storto = () => { throw STORTO }

const DIR = { destra: [1, 0], sinistra: [-1, 0], giu: [0, 1], su: [0, -1] }
const LETTERA = { rosso: 'r', blu: 'u', giallo: 'g' }

/* ═══════════ lo scavo ═══════════
   Un foglio senza bordi: le coordinate possono andare sotto zero, e la
   cornice si decide alla fine (`componi`). `metti` rifiuta di scrivere
   una cosa diversa sopra una già scritta: è così che due pezzi di strada
   che si pestano i piedi si scoprono subito. */
class Scavo {
  constructor() { this.celle = new Map() }
  get(x, y) { return this.celle.get(`${x},${y}`) }
  metti(x, y, ch) {
    const k = `${x},${y}`, c = this.celle.get(k)
    if (c !== undefined && c !== ch) storto()
    this.celle.set(k, ch)
  }
  /* un prato che non copre quello che c'è già (la carota, una lastra) */
  prato(x, y) { if (this.get(x, y) === undefined) this.celle.set(`${x},${y}`, '.') }
  forza(x, y, ch) { this.celle.set(`${x},${y}`, ch) }
}

const passo = ([x, y], m) => {
  const salto = m.startsWith('salto-')
  const [dx, dy] = DIR[salto ? m.slice(6) : m]
  return salto ? [x + 2 * dx, y + 2 * dy] : [x + dx, y + dy]
}
const chiave = ([x, y]) => `${x},${y}`

/* ═══════════ il fuori ═══════════
   Quattro vestiti, ognuno con le sue macchie e quanto pesano: il bosco,
   la siepe (cespugli e sassi), lo stagno, e il fiume dei sassi che è
   tutto acqua. */
const FUORI = {
  bosco:  [['A', 6], ['B', 2], ['~', 1]],
  prato:  [['B', 4], ['A', 3], ['~', 2]],
  stagno: [['~', 6], ['A', 2], ['B', 1]],
  acqua:  [['~', 9], ['A', 1]],
}

/* dallo scavo alla mappa: la cornice (un giro di fuori qua e là, se ci
   sta), e il fuori dove la sagoma non ha scritto niente */
export function componi(scavo, rnd, fondo) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const k of scavo.celle.keys()) {
    const [x, y] = k.split(',').map(Number)
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
  }
  /* un posto largo e basso va bene lo stesso: si girerà per il lungo
     (`gira`), e le misure si guardano in quel verso */
  const coricato = x1 - x0 + 1 > COLONNE_MAX
  const [TX, TY] = coricato ? [RIGHE_MAX, COLONNE_MAX] : [COLONNE_MAX, RIGHE_MAX]
  if (x1 - x0 + 1 > TX || y1 - y0 + 1 > TY) storto()
  /* un giro di fuori in più da ogni lato, a caso, finché ci sta; e
     comunque abbastanza da non fare un posto più stretto di tre */
  for (const lato of ['x0', 'x1', 'y0', 'y1']) {
    const orizz = lato[0] === 'x'
    const largo = orizz ? x1 - x0 + 1 : y1 - y0 + 1
    const tetto = orizz ? TX : TY
    if (largo < tetto && (largo < LATO_MIN || rnd() < 0.45)) {
      if (lato === 'x0') x0--; else if (lato === 'x1') x1++
      else if (lato === 'y0') y0--; else y1++
    }
  }
  while (x1 - x0 + 1 < LATO_MIN) x1++
  while (y1 - y0 + 1 < LATO_MIN) y1++
  /* le macchie: qualche seme sparso, e ogni cella prende il vestito del
     seme più vicino; dentro una macchia di bosco, ogni tanto un cespuglio */
  const f = FUORI[fondo] || FUORI.bosco
  const totale = f.reduce((n, [, p]) => n + p, 0)
  const pesca = () => {
    let t = rnd() * totale
    for (const [c, p] of f) if ((t -= p) <= 0) return c
    return f[0][0]
  }
  const semi = Array.from({ length: 3 + Math.floor(rnd() * 3) }, () =>
    ({ x: x0 + rnd() * (x1 - x0 + 1), y: y0 + rnd() * (y1 - y0 + 1), c: pesca() }))
  const macchia = (x, y) => {
    let meglio = semi[0], d = Infinity
    for (const s of semi) {
      const q = (s.x - x) ** 2 + (s.y - y) ** 2
      if (q < d) { d = q; meglio = s }
    }
    if (meglio.c === 'A' && rnd() < 0.12) return 'B'
    if (meglio.c === 'B' && rnd() < 0.1) return 'S'
    return meglio.c
  }
  const righe = []
  for (let y = y0; y <= y1; y++) {
    let r = ''
    for (let x = x0; x <= x1; x++) {
      const c = scavo.get(x, y)
      r += c !== undefined ? c : macchia(x, y)
    }
    righe.push(r)
  }
  return righe
}

/* ═══════════ girare e specchiare ═══════════
   Una sagoma si scrive in un verso solo (di solito verso destra e in
   giù), e il posto finito si gira: la mappa e le frecce insieme. */
const GIRI = {
  tr: { destra: 'giu', giu: 'destra', sinistra: 'su', su: 'sinistra' },
  fx: { destra: 'sinistra', sinistra: 'destra' },
  fy: { su: 'giu', giu: 'su' },
}
function giraMossa(t, tab) {
  if (t.startsWith('salto-')) return 'salto-' + (tab[t.slice(6)] || t.slice(6))
  return tab[t] || t
}
function giraMappa(m, che) {
  if (che === 'fx') return m.map(r => [...r].reverse().join(''))
  if (che === 'fy') return m.slice().reverse()
  return [...m[0]].map((_, x) => m.map(r => r[x]).join(''))
}
export function gira(t, rnd) {
  let { mappa, soluzione, fragili } = t
  const coricato = mappa[0].length > COLONNE_MAX
  for (const che of ['tr', 'fx', 'fy']) {
    if (rnd() < 0.5 && !(che === 'tr' && coricato)) continue
    if (che === 'tr' && !coricato && (mappa.length > COLONNE_MAX || mappa[0].length > RIGHE_MAX)) continue
    mappa = giraMappa(mappa, che)
    soluzione = soluzione.map(m => giraMossa(m, GIRI[che]))
    fragili = fragili.map(f => ({ ...f, fila: f.fila.map(m => giraMossa(m, GIRI[che])) }))
  }
  return { ...t, mappa, soluzione, fragili }
}

/* ═══════════ i numeri al posto dei colori ═══════════
   Ogni testa «fino a un colore» diventa un numero, e si provano tutte le
   combinazioni: se una vince con la carota, il posto si fa anche
   contando, e il «fino a» non serve. Le teste sono al più quattro, e le
   prove al più quattromila corse corte. */
function contandoSiVince(liv, fila) {
  const teste = fila.map((t, i) => (eRipeti(t) && COLORI.includes(valoreDi(t)) ? i : -1)).filter(i => i >= 0)
  if (!teste.length) return false
  const prova = fila.slice()
  const giro = k => {
    if (k === teste.length) {
      const r = esegui(liv, prova, { eventi: false })
      return r.esito === TANA && r.carota
    }
    for (const n of VOLTE) {
      prova[teste[k]] = apri(n)
      if (giro(k + 1)) return true
    }
    return false
  }
  return giro(0)
}

/* ═══════════ la prova ═══════════
   Il pavimento prima di tutto: il sentiero è il finale, e un posto con
   lo zaino ci sta solo se è almeno come quelli in fondo alla campagna —
   uno zaino di almeno `ZAINO_MIN` carte (due idee in un programma non
   stanno in quattro) e una strada, scritta freccia per freccia, di
   almeno `strada` mosse (dodici di serie; meno dove una mossa è una
   scivolata o un salto, che vale più celle). */
export const ZAINO_MIN = 5
export const STRADA_MIN = 12
export function provaLoZaino(t, { strada = STRADA_MIN, zaino = ZAINO_MIN } = {}) {
  if (guastiDellaMappa(t.mappa).length) return false
  if (carteDi(t.soluzioni[0]) < zaino) return false
  const liv = Livello.da(t)
  const sol = t.soluzioni[0]
  const r = esegui(liv, sol, { eventi: false })
  if (r.esito !== TANA || !r.carota) return false
  const sciolta = risolvi(liv, { carota: false })
  if (!sciolta || sciolta.length <= liv.zaino || sciolta.length < strada) return false
  for (const f of t.obbligatorie || []) {
    const e = esegui(liv, f, { eventi: false })
    if (e.esito === TANA && e.carota) return false
  }
  if (contandoSiVince(liv, sol)) return false
  return true
}

/* ═══════════ le sagome ═══════════
   Ognuna: la carta del suo gradino, le regole del mondo che le servono
   (`serve`), qualche nome, il pavimento della strada se non è quello di
   serie, e `fai(rnd)` che torna lo scavo, la soluzione e le mosse
   ingenue (`{ fila, obbligatoria }`). Sono **le forme della fine della
   campagna**, con due idee insieme: due scale una dopo l'altra, la
   scatola dentro la scatola, il ghiaccio o il salto dentro un ciclo, due
   colori, tre versi. Le forme dei primi livelli del ripeti — il viale,
   lo stagno, la scala sola — qui non ci sono: si sanno già. */
const a = (rnd, n) => Math.floor(rnd() * n)
const tra = (rnd, da, fino) => da + a(rnd, fino - da + 1)
const scegli = (rnd, l) => l[a(rnd, l.length)]
const ruota = (l, k) => [...l.slice(k), ...l.slice(0, k)]
const mescola = (rnd, l) => l.map(x => [rnd(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1])

/* segue una fila di frecce sul prato, scavando dove passa: torna le
   celle dove ha messo piede, e si rifiuta di ripassare dove è già stata */
function segui(s, da, mosse, { visti = null } = {}) {
  let p = da
  const celle = []
  for (const m of mosse) {
    p = passo(p, m)
    if (visti) { if (visti.has(chiave(p))) storto(); visti.add(chiave(p)) }
    s.prato(p[0], p[1])
    celle.push(p)
  }
  return { fine: p, celle }
}
const ripetute = (n, motivo) => Array.from({ length: n }, () => motivo).flat()
const uguali = (p, q) => p[0] === q[0] && p[1] === q[1]

/* ── il cammino che non si tocca ──
   Un cammino a caso, con dei versi permessi e dei pezzi lunghi quanto
   dice `lungo()`, che non passa mai accanto a sé stesso (se no la strada
   del risolutore taglierebbe): serve ai segni, sul prato e sul ghiaccio.
   Torna i pezzi `{ verso, celle }`, la prima cella di ognuno è quella
   dopo la partenza del pezzo. */
function cammino(rnd, versi, pezzi, lungo, largo = 8, alto = 10) {
  const occupate = new Set(['0,0'])
  let [x0, x1, y0, y1] = [0, 0, 0, 0]
  let p = [0, 0]
  const fuori = []
  const libera = (q, da) => !occupate.has(chiave(q)) &&
    [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => {
      const r = [q[0] + dx, q[1] + dy]
      return uguali(r, da) || !occupate.has(chiave(r))
    })
  for (let i = 0; i < pezzi; i++) {
    let prova = mescola(rnd, versi.filter(v => !fuori.length || v !== OPPOSTO[fuori.at(-1).verso]))
    /* dritti di rado: sei segni uguali di fila non si leggono, si contano */
    if (fuori.length && rnd() < 0.7) prova = [...prova.filter(v => v !== fuori.at(-1).verso), ...prova.filter(v => v === fuori.at(-1).verso)]
    let fatto = null
    for (const v of prova) {
      const L = lungo()
      const celle = []
      let q = p, ok = true
      for (let k = 0; k < L; k++) {
        const n = passo(q, v)
        if (!libera(n, q)) { ok = false; break }
        celle.push(n)
        q = n
      }
      if (!ok) continue
      const nx0 = Math.min(x0, q[0]), nx1 = Math.max(x1, q[0]), ny0 = Math.min(y0, q[1]), ny1 = Math.max(y1, q[1])
      if (nx1 - nx0 >= largo || ny1 - ny0 >= alto) continue
      fatto = { verso: v, celle }
      ;[x0, x1, y0, y1] = [nx0, nx1, ny0, ny1]
      break
    }
    if (!fatto) storto()
    for (const c of fatto.celle) occupate.add(chiave(c))
    fuori.push(fatto)
    p = fatto.celle.at(-1)
  }
  return fuori
}
const OPPOSTO = { destra: 'sinistra', sinistra: 'destra', su: 'giu', giu: 'su' }

export const SAGOME = [
  /* ── la collina: due scale, una dopo l'altra ──
     Ogni scala è un motivo di due o tre frecce, ripetuto, e scavata larga
     due: accanto alla strada giusta c'è quella del motivo girato (→↓
     invece di ↓→), che arriva a casa lo stesso — ma la carota sta su un
     gradino solo. Due scatole diverse, e l'ordine conta in tutte e due. */
  { chiave: 'scala', carta: 'ripeti', serve: [],
    nomi: ['La collina', 'Su e giù per il bosco', 'I gradini di pietra', 'La scalinata doppia'],
    fai(rnd) {
      const s = new Scavo()
      s.metti(0, 0, 'P')
      const visti = new Set(['0,0'])
      let p = [0, 0]
      const pezzi = [], segmenti = []
      const pre = rnd() < 0.5 ? [scegli(rnd, ['destra', 'giu'])] : []
      if (pre.length) p = segui(s, p, pre, { visti }).fine
      for (let k = 0; k < 2; k++) {
        const v = k === 0 ? 'giu' : scegli(rnd, ['giu', 'su'])
        const motivo = scegli(rnd, [['destra', v], [v, 'destra'], ['destra', 'destra', v], [v, v, 'destra'], ['destra', v, v]])
        const girato = ruota(motivo, motivo.length === 2 ? 1 : tra(rnd, 1, 2))
        const n = tra(rnd, 2, motivo.length === 2 ? 4 : 3)
        const vero = segui(s, p, ripetute(n, motivo), { visti })
        const falso = segui(s, p, ripetute(n, girato))
        const soloVero = vero.celle.filter(c => !falso.celle.some(f => uguali(f, c)))
        segmenti.push({ n, motivo, girato, soloVero: soloVero.slice(0, -1) })
        pezzi.push(ripeti(n, ...motivo))
        p = vero.fine
      }
      const post = rnd() < 0.5 ? [scegli(rnd, ['destra', 'giu'])] : []
      if (post.length) p = segui(s, p, post, { visti }).fine
      s.forza(p[0], p[1], '@')
      const buoni = segmenti.map((g, i) => ({ g, i })).filter(({ g }) => g.soloVero.length)
      if (!buoni.length) storto()
      const { g, i } = scegli(rnd, buoni)
      const [cx, cy] = scegli(rnd, g.soloVero)
      s.forza(cx, cy, 'c')
      const con = (k, pezzo) => programma(...pre, ...pezzi.map((q, j) => (j === k ? pezzo : q)), ...post)
      return {
        scavo: s, fondo: scegli(rnd, ['bosco', 'prato']),
        soluzione: programma(...pre, ...pezzi, ...post),
        fragili: [
          { fila: con(i, ripeti(g.n, ...g.girato)), obbligatoria: true },
          { fila: con(i, ripeti(g.n - 1, ...g.motivo)) },
          { fila: con(i, ripeti(g.n + 1, ...g.motivo)) },
        ],
      }
    } },

  /* ── le terrazze: una scatola dentro l'altra ──
     Un gradino grande è fatto di passi piccoli, e si scende per due
     strade: giù e poi avanti, o avanti e poi giù. La carota su una sola. */
  { chiave: 'terrazze', carta: 'ripeti', serve: [],
    nomi: ['Le terrazze', 'La vigna', 'I campi a gradini'],
    fai(rnd) {
      const s = new Scavo()
      s.metti(0, 0, 'P')
      const k = tra(rnd, 2, 3), giu = tra(rnd, 2, 3), dx = tra(rnd, 2, 4)
      if (k * dx > 8 || k * giu > 10) storto()
      const motivo = [...ripetute(giu, ['giu']), ...ripetute(dx, ['destra'])]
      const girato = [...ripetute(dx, ['destra']), ...ripetute(giu, ['giu'])]
      const vero = segui(s, [0, 0], ripetute(k, motivo), { visti: new Set(['0,0']) })
      const falso = segui(s, [0, 0], ripetute(k, girato))
      s.forza(vero.fine[0], vero.fine[1], '@')
      const solo = vero.celle.filter(c => !falso.celle.some(f => uguali(f, c)))
      if (!solo.length) storto()
      const [cx, cy] = scegli(rnd, solo)
      s.forza(cx, cy, 'c')
      return {
        scavo: s, fondo: 'bosco',
        soluzione: programma(ripeti(k, ripeti(giu, 'giu'), ripeti(dx, 'destra'))),
        fragili: [{ fila: programma(ripeti(k, ripeti(dx, 'destra'), ripeti(giu, 'giu'))), obbligatoria: true }],
      }
    } },

  /* ── il campo arato: avanti e indietro fra le siepi ──
     Quattro scatole dentro una. La siepe ha il varco in fondo alla fila:
     chi conta un passo di meno ci sbatte il muso. */
  { chiave: 'solchi', carta: 'ripeti', serve: [],
    nomi: ['Il campo arato', 'L\'orto', 'I filari'],
    fai(rnd) {
      const s = new Scavo()
      const w = tra(rnd, 5, 8), giri = scegli(rnd, [2, 3, 3])
      const siepe = scegli(rnd, 'BB~')
      const righe = 2 * (giri - 1) + 1
      for (let r = 0; r < righe; r++) {
        const y = 2 * r
        for (let x = 0; x <= w; x++) s.prato(x, y)
        if (r === righe - 1) break
        const varco = r % 2 === 0 ? w : 0
        for (let x = 0; x <= w; x++) s.metti(x, y + 1, x === varco ? '.' : siepe)
      }
      s.forza(0, 0, 'P')
      s.forza(w, 2 * (righe - 1), '@')
      const posti = []
      for (let r = 0; r < righe; r++) for (let x = 1; x < w; x++) posti.push([x, 2 * r])
      const [cx, cy] = scegli(rnd, posti)
      s.forza(cx, cy, 'c')
      const con = n => programma(ripeti(giri, ripeti(n, 'destra'), ripeti(2, 'giu'), ripeti(n, 'sinistra'), ripeti(2, 'giu')))
      return {
        scavo: s, fondo: 'bosco', soluzione: con(w),
        fragili: [{ fila: con(w - 1) }, { fila: con(w + 1) }],
      }
    } },

  /* ── di sasso in sasso: due file di sassi, due scatole ──
     Tutto acqua, e i sassi dove si atterra: prima si scende, poi si sale
     (o si scende ancora), e ogni fila ha il suo passo. Chi cammina invece
     di saltare fa splash. */
  { chiave: 'sassi', carta: 'ripeti', serve: ['salto'], strada: 10,
    nomi: ['Di sasso in sasso', 'Il guado', 'Il ruscello dei sassi'],
    fai(rnd) {
      const s = new Scavo()
      s.metti(0, 0, 'P')
      let p = [0, 0]
      const atterra = [], pezzi = [], camminati = []
      const visti = new Set(['0,0'])
      for (let k = 0; k < 2; k++) {
        const v = k === 0 ? 'giu' : scegli(rnd, ['giu', 'su'])
        const motivo = scegli(rnd, [['salto-destra', v], [v, 'salto-destra'], ['salto-destra', 'salto-' + v],
                                    ['salto-destra', v, 'destra'], ['destra', 'salto-' + v]])
        const n = tra(rnd, 2, 3)
        for (const m of ripetute(n, motivo)) {
          const q = passo(p, m)
          if (m.startsWith('salto-')) s.metti((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, rnd() < 0.25 ? 't' : '~')
          if (visti.has(chiave(q))) storto()
          visti.add(chiave(q))
          s.metti(q[0], q[1], '.')
          atterra.push(q)
          p = q
        }
        pezzi.push(ripeti(n, ...motivo))
        camminati.push(ripeti(n, ...motivo.map(m => m.replace('salto-', ''))))
      }
      s.forza(p[0], p[1], '@')
      const [cx, cy] = scegli(rnd, atterra.slice(1, -1))
      s.forza(cx, cy, 'c')
      return {
        scavo: s, fondo: 'acqua', salti: true,
        soluzione: programma(...pezzi),
        fragili: [{ fila: programma(camminati[0], pezzi[1]), obbligatoria: true },
                  { fila: programma(pezzi[0], camminati[1]), obbligatoria: true }],
      }
    } },

  /* ── la spirale di ghiaccio: quattro frecce, e le scivolate cambiano ──
     Tutto ghiaccio, e a fermare il coniglio negli angoli ci pensano i
     sassi. La stessa scatola gira quattro volte il lago, e ogni scivolata
     è lunga diversa: si capisce solo guardando dove sono i sassi. */
  /* una giostra così regge una volta su cento (un sasso cade sempre sul
     lato di prima): costa poco, e le prove sono di più */
  { chiave: 'spirale', carta: 'ripeti', serve: ['ghiaccio'], strada: 8, tema: 'inverno', prove: 600,
    nomi: ['La spirale di ghiaccio', 'Il lago che gira', 'La pista gelata'],
    fai(rnd) {
      const s = new Scavo()
      s.metti(0, 0, 'P')
      const versi = ['destra', 'giu', 'sinistra', 'su']
      const n = tra(rnd, 8, 11)
      let p = [0, 0]
      const ghiacci = []
      for (let i = 0; i < n; i++) {
        const v = versi[i % 4]
        const L = tra(rnd, 1, 4)
        let q = p
        for (let k = 0; k < L; k++) {
          q = passo(q, v)
          if (i === n - 1 && k === L - 1) break
          s.metti(q[0], q[1], '*')
          ghiacci.push(q)
        }
        if (i === n - 1) { s.metti(q[0], q[1], '@'); break }
        const fermo = passo(q, v)
        s.metti(fermo[0], fermo[1], scegli(rnd, 'OOOA'))
        p = q
      }
      if (ghiacci.length < 6) storto()
      const [cx, cy] = scegli(rnd, ghiacci)
      s.forza(cx, cy, 'C')
      return {
        scavo: s, fondo: scegli(rnd, ['bosco', 'stagno']),
        soluzione: programma(ripeti(Math.ceil(n / 4), ...versi)),
        fragili: [{ fila: programma(ripeti(Math.ceil(n / 4), 'destra', 'giu')) }],
      }
    } },

  /* ── le pozze: a ogni gradino un masso fa il ponte ──
     La stessa scatola spinge, attraversa e va avanti. Chi va avanti prima
     di spingere trova un prato che finisce nell'acqua. */
  { chiave: 'pozze', carta: 'ripeti', serve: ['massi'],
    nomi: ['Le pozze', 'I ponti di sasso', 'Il fosso dei massi'],
    fai(rnd) {
      const s = new Scavo()
      s.metti(0, 0, 'P')
      const n = tra(rnd, 3, 4)
      let [x, y] = [0, 0]
      const avanti = []
      for (let i = 0; i < n; i++) {
        s.metti(x, y + 1, 'm')
        s.metti(x, y + 2, '~')
        s.metti(x + 1, y, '.')
        s.metti(x + 2, y, '.')
        s.metti(x + 2, y + 1, '~')
        s.metti(x + 1, y + 2, '.')
        avanti.push([x + 1, y + 2])
        x += 2
        y += 2
        s.metti(x, y, i === n - 1 ? '@' : '.')
      }
      const [cx, cy] = scegli(rnd, avanti)
      s.forza(cx, cy, 'c')
      return {
        scavo: s, fondo: scegli(rnd, ['bosco', 'prato']),
        soluzione: programma(ripeti(n, 'giu', 'giu', 'destra', 'destra')),
        fragili: [{ fila: programma(ripeti(n, 'destra', 'destra', 'giu', 'giu')), obbligatoria: true }],
      }
    } },

  /* ── i gradini storti: fino al colore ──
     Ogni gradino è lungo diverso: contare non serve, si va avanti finché
     non si arriva sulla lastra, e si scende dal varco. Oltre la lastra il
     gradino continua, e sotto ci sono i fossi: chi conta invece di
     guardare ci cade. */
  { chiave: 'gradini', carta: 'fino', serve: [],
    nomi: ['I gradini storti', 'La scala dei fossi', 'Le balze'],
    fai(rnd) {
      const s = new Scavo()
      const colore = scegli(rnd, COLORI), lastra = LETTERA[colore]
      const k = tra(rnd, 4, 5)
      const lunghi = Array.from({ length: k }, () => tra(rnd, 1, 3))
      if (new Set(lunghi).size < 2) storto()
      let [x, y] = [0, 0]
      s.metti(0, 0, 'P')
      const posti = []
      for (let i = 0; i < k; i++) {
        const L = lunghi[i], oltre = tra(rnd, 1, 2)
        if (i > 0) s.metti(x, y, '.')
        for (let j = 1; j < L; j++) { s.metti(x + j, y, '.'); posti.push([x + j, y]) }
        s.metti(x + L, y, lastra)
        for (let j = 1; j <= oltre; j++) s.metti(x + L + j, y, '.')
        s.metti(x + L + oltre + 1, y, scegli(rnd, 'AB'))
        for (let j = 0; j <= L + oltre; j++) s.metti(x + j, y + 1, j === L ? '.' : '~')
        x += L
        posti.push([x, y + 1])
        y += 2
        if (i === k - 1) s.metti(x, y, '@')
      }
      const [cx, cy] = scegli(rnd, posti)
      s.forza(cx, cy, 'c')
      return {
        scavo: s, fondo: scegli(rnd, ['bosco', 'prato']),
        soluzione: programma(ripeti(k, ripeti(colore, 'destra'), 'giu', 'giu')),
        fragili: [{ fila: programma(ripeti(k, ripeti(colore, 'destra'), 'giu')), obbligatoria: true }],
      }
    } },

  /* ── il campo storto: fino al colore, avanti e indietro ──
     Le file del campo sono tutte intere, e il passaggio fra un fosso e
     l'altro è ogni volta in un posto diverso: la lastra lo dice. L'ultima
     fila porta a casa, e lì non c'è lastra: la scatola si ferma alla tana.
     Col salto è il fiume dei sassi: le file sono sassi un sì e uno no, e
     fra una fila e l'altra c'è la siepe, con l'acqua solo sotto la lastra. */
  { chiave: 'campo', carta: 'fino', serve: [],
    nomi: ['Il campo storto', 'I fossi', 'Il campo di grano'],
    fai(rnd) { return campoStorto(rnd, false) } },
  { chiave: 'fiume', carta: 'fino', serve: ['salto'], strada: 10,
    nomi: ['Il fiume dei sassi', 'Il guado lungo', 'Le pietre del torrente'],
    fai(rnd) { return campoStorto(rnd, true) } },

  /* ── scale e pianerottoli: due colori ──
     La scala scende fino a un colore, il pianerottolo va avanti fino
     all'altro, e ogni volta sono lunghi diversi. Oltre la lastra la scala
     finisce nel fosso, e il pianerottolo nello stagno. */
  { chiave: 'pianerottoli', carta: 'fino', serve: [],
    nomi: ['Scale e pianerottoli', 'Il palazzo', 'Le cascate'],
    fai(rnd) {
      const s = new Scavo()
      const [c1, c2] = mescola(rnd, COLORI)
      const k = tra(rnd, 2, 3)
      let p = [0, 0]
      s.metti(0, 0, 'P')
      const posti = []
      for (let i = 0; i < k; i++) {
        const scalini = tra(rnd, 1, 3), piano = tra(rnd, 1, 3)
        for (let j = 0; j < scalini; j++) {
          p = passo(p, 'destra'); s.metti(p[0], p[1], '.'); posti.push(p)
          p = passo(p, 'giu'); s.metti(p[0], p[1], j === scalini - 1 ? LETTERA[c1] : '.')
          if (j < scalini - 1) posti.push(p)
        }
        /* chi scende un gradino di troppo: il fosso */
        s.metti(p[0] + 1, p[1] + 1, '~')
        for (let j = 0; j < piano; j++) {
          p = passo(p, 'destra')
          const ultima = j === piano - 1
          s.metti(p[0], p[1], ultima ? (i === k - 1 ? '@' : LETTERA[c2]) : '.')
          if (!ultima) posti.push(p)
        }
        /* chi va avanti un passo di troppo: lo stagno */
        if (i < k - 1) s.metti(p[0] + 2, p[1], '~')
      }
      if (!posti.length) storto()
      const [cx, cy] = scegli(rnd, posti)
      s.forza(cx, cy, 'c')
      return {
        scavo: s, fondo: scegli(rnd, ['bosco', 'prato']),
        soluzione: programma(ripeti(k, ripeti(c1, 'destra', 'giu'), ripeti(c2, 'destra'))),
        fragili: [{ fila: programma(ripeti(k, ripeti(c2, 'destra', 'giu'), ripeti(c1, 'destra'))), obbligatoria: true }],
      }
    } },

  /* ── le colline: sempre avanti, e il colore dice su o giù ──
     Una scatola sola, e le colline tutte diverse. Chi legge un colore al
     contrario trova un pezzo di prato che sembra buono, e dietro l'acqua;
     chi si dimentica un «se» va dritto nello stagno. */
  { chiave: 'colline', carta: 'se', serve: [],
    nomi: ['Le colline', 'Su e giù', 'I dossi'],
    fai(rnd) {
      const s = new Scavo()
      const [giu, su] = mescola(rnd, COLORI)
      const w = 9, alto = 8
      let y = tra(rnd, 2, alto - 3)
      s.metti(0, y, 'P')
      const posti = []
      let prima = null, svolte = 0
      for (let x = 1; x < w; x++) {
        if (x === w - 1) { s.metti(x, y, '@'); break }
        let che = 'dritto'
        const puo = [['dritto', 0.6]]
        if (y + 1 <= alto - 2 && prima !== 'su') puo.push(['giu', 1.3])
        if (y - 1 >= 1 && prima !== 'giu') puo.push(['su', 1.3])
        let t = rnd() * puo.reduce((n, [, q]) => n + q, 0)
        for (const [c, q] of puo) { if ((t -= q) <= 0) { che = c; break } }
        if (che === 'dritto') { s.metti(x, y, '.'); posti.push([x, y]); prima = null; continue }
        const v = che === 'giu' ? 1 : -1
        s.metti(x, y, LETTERA[che === 'giu' ? giu : su])
        s.metti(x, y + v, '.')
        posti.push([x, y + v])
        /* le false piste: il verso sbagliato (un pezzo di prato, e dietro
           l'acqua) e il «se» dimenticato (dritti nell'acqua). Due discese
           di fila: il verso sbagliato della seconda è già acqua */
        if (s.get(x, y - v) !== '~') {
          s.metti(x, y - v, '.')
          s.metti(x + 1, y - v, '~')
        }
        s.metti(x + 1, y, '~')
        y += v
        prima = che
        svolte++
      }
      if (svolte < 4) storto()
      const [cx, cy] = scegli(rnd, posti)
      s.forza(cx, cy, 'c')
      const giri = rnd() < 0.5 ? [se(giu, 'giu'), se(su, 'su')] : [se(su, 'su'), se(giu, 'giu')]
      return {
        scavo: s, fondo: scegli(rnd, ['prato', 'bosco']),
        soluzione: programma(ripeti(CASA, 'destra', ...giri)),
        fragili: [
          { fila: programma(ripeti(CASA, 'destra', se(giu, 'su'), se(su, 'giu'))), obbligatoria: true },
          { fila: programma(ripeti(CASA, 'destra', se(giu, 'giu'))), obbligatoria: true },
          { fila: programma(ripeti(CASA, 'destra', se(su, 'su'))), obbligatoria: true },
        ],
      }
    } },

  /* ── il sentiero dei segni: ogni lastra dice dove andare ──
     Tre versi, un colore per verso, e un programma solo che li legge
     tutti. Il sentiero non tocca mai sé stesso, così la strada è quella e
     basta; tutt'intorno lo stagno, e chi scambia due colori ci finisce.
     Sul ghiaccio è il bosco ghiacciato: fra un segno e l'altro si scivola,
     ed è la lastra a fermare. */
  { chiave: 'segni', carta: 'se', serve: [],
    nomi: ['Il sentiero dei segni', 'I cartelli', 'La strada dipinta'],
    fai(rnd) { return segni(rnd, false) } },
  { chiave: 'segni-ghiaccio', carta: 'se', serve: ['ghiaccio'], strada: 10, tema: 'inverno',
    nomi: ['Il bosco ghiacciato', 'I cartelli sul ghiaccio', 'Il lago dei segni'],
    fai(rnd) { return segni(rnd, true) } },
]

/* il campo storto, a piedi o a salti */
function campoStorto(rnd, salti) {
  const s = new Scavo()
  const colore = scegli(rnd, COLORI), lastra = LETTERA[colore]
  const w = salti ? scegli(rnd, [7, 9]) : tra(rnd, 7, 9)
  const file = tra(rnd, 4, 5)
  const sassi = x => !salti || x % 2 === 0
  let entra = 0
  s.metti(0, 0, 'P')
  const posti = []
  for (let j = 0; j < file; j++) {
    const y = 2 * j, avanti = j % 2 === 0
    for (let x = 0; x < w; x++) if (sassi(x)) s.prato(x, y); else s.metti(x, y, '~')
    const ultima = j === file - 1
    const poss = []
    for (let x = 0; x < w; x++) if (sassi(x) && (avanti ? x > entra : x < entra)) poss.push(x)
    if (!poss.length) storto()
    const fino = scegli(rnd, poss)
    for (let x = Math.min(entra, fino) + 1; x < Math.max(entra, fino); x++) if (sassi(x)) posti.push([x, y])
    if (ultima) { s.forza(fino, y, '@'); break }
    s.forza(fino, y, lastra)
    /* fra una fila e l'altra: a piedi il fosso col varco, a salti una
       siepe alta con un solo punto d'acqua — se no si salterebbe giù da
       qualunque sasso, e la strada non passerebbe più dalle lastre */
    for (let x = 0; x < w; x++)
      s.metti(x, y + 1, x === fino ? (salti ? '~' : '.') : (salti ? scegli(rnd, 'AAB') : '~'))
    entra = fino
  }
  if (!posti.length) storto()
  const [cx, cy] = scegli(rnd, posti)
  s.forza(cx, cy, 'c')
  const giri = Math.ceil(file / 2)
  const m = v => (salti ? 'salto-' + v : v)
  const giu = salti ? ['salto-giu'] : [ripeti(2, 'giu')]
  return {
    scavo: s, fondo: salti ? 'acqua' : 'bosco', salti,
    soluzione: programma(ripeti(giri, ripeti(colore, m('destra')), ...giu, ripeti(colore, m('sinistra')), ...giu)),
    /* a piedi: un passo giù solo, e si cammina nel fosso. A salti: chi
       si scorda di tornare indietro salta verso destra anche nella fila
       che va a sinistra, e finisce contro la riva (che a saltare serva lo
       dice il fiume stesso: fra un sasso e l'altro c'è solo acqua) */
    fragili: salti
      ? [{ fila: programma(ripeti(giri, ripeti(colore, 'salto-destra'), 'salto-giu', ripeti(colore, 'salto-destra'), 'salto-giu')), obbligatoria: true }]
      : [{ fila: programma(ripeti(giri, ripeti(colore, 'destra'), 'giu', ripeti(colore, 'sinistra'), 'giu')), obbligatoria: true }],
  }
}

/* il sentiero dei segni, sul prato o sul ghiaccio */
function segni(rnd, ghiaccio) {
  const s = new Scavo()
  const versi = ['destra', 'giu', 'sinistra', 'su']
  versi.splice(a(rnd, 4), 1)
  const colori = mescola(rnd, COLORI)
  const coloreDi = Object.fromEntries(versi.map((v, i) => [v, colori[i]]))
  /* sul prato ogni pezzo è un passo; sul ghiaccio da uno a tre, e il
     primo pezzo — prima del primo segno — scivola sempre */
  const pezzi = ghiaccio ? tra(rnd, 10, 13) : tra(rnd, 15, 20)
  let primo = true
  const tratti = cammino(rnd, versi, pezzi, () => {
    if (!ghiaccio) return 1
    const L = primo ? tra(rnd, 2, 3) : scegli(rnd, [1, 2, 2, 3])
    primo = false
    return L
  })
  s.metti(0, 0, 'P')
  const ghiacci = []
  const mosse = tratti.map(t => t.verso)
  /* le celle di mezzo: prato o ghiaccio; l'ultima di ogni pezzo è il
     segno del pezzo dopo (o la tana) */
  tratti.forEach((t, i) => {
    t.celle.slice(0, -1).forEach(c => { s.metti(c[0], c[1], ghiaccio ? '*' : '.'); ghiacci.push(c) })
    const fine = t.celle.at(-1)
    s.metti(fine[0], fine[1], i === tratti.length - 1 ? '@' : LETTERA[coloreDi[mosse[i + 1]]])
  })
  if (new Set(mosse.slice(ghiaccio ? 1 : 2)).size < 3) storto()
  const ordine = mescola(rnd, versi)
  const leggi = tab => ripeti(CASA, ...ordine.map(v => se(coloreDi[v], tab[v] || v)))
  const scambi = [[0, 1], [0, 2], [1, 2]].map(([i, j]) => leggi({ [versi[i]]: versi[j], [versi[j]]: versi[i] }))
  /* la carota: sul prato si prende al primo passo, prima dei segni
     (sopra un segno non ci sta); sul ghiaccio su una lastra di mezzo */
  let prima = [mosse[0]]
  if (ghiaccio) {
    if (!ghiacci.length) storto()
    const [cx, cy] = scegli(rnd, ghiacci)
    s.forza(cx, cy, 'C')
  } else {
    /* la prima cella dopo la partenza è la carota, e i segni vengono
       dopo: si comincia con due frecce sciolte */
    const primoSegno = tratti[0].celle.at(-1)
    s.forza(primoSegno[0], primoSegno[1], 'c')
    prima = [mosse[0], mosse[1]]
  }
  return {
    scavo: s, fondo: scegli(rnd, ['stagno', 'prato']),
    soluzione: programma(...prima, leggi({})),
    fragili: scambi.map(f => ({ fila: programma(...prima, f), obbligatoria: true })),
  }
}

/* le carte che si danno in mano, dal gradino che ce le ha messe in poi:
   chi ha imparato il «se» lo trova anche in un posto del ripeti, come
   nella campagna */
export function carteInMano(sbloccati) {
  const carte = ['ripeti']
  if (sbloccati.includes('fino')) carte.push('fino')
  if (sbloccati.includes('se')) carte.push('casa', 'se')
  return carte
}

/* ═══════════ un posto con lo zaino ═══════════
   Si sceglie una sagoma della carta chiesta fra quelle che il bambino può
   giocare (le regole del mondo che conosce), si
   prova qualche volta, e se proprio non esce niente si passa a un'altra.
   Torna `null` solo se nessuna sagoma della carta regge: chi chiama ha la
   sua riserva. `sagoma` ne chiede una sola (per i test e per il banco). */
export function generaZaino(carta, sbloccati, rnd, { prove = 60, sagoma = null } = {}) {
  const puo = SAGOME.filter(g => (sagoma ? g.chiave === sagoma
    : g.carta === carta && g.serve.every(r => sbloccati.includes(r))))
  /* le sagome che mescolano una regola del mondo pesano di più: sono
     quelle che fanno sembrare il sentiero un posto sempre nuovo */
  const pesi = puo.map(g => (g.serve.length ? 1.6 : 1))
  const rimaste = puo.slice()
  while (rimaste.length) {
    let t = rnd() * rimaste.reduce((n, g) => n + pesi[puo.indexOf(g)], 0)
    let g = rimaste[0]
    for (const q of rimaste) { if ((t -= pesi[puo.indexOf(q)]) <= 0) { g = q; break } }
    rimaste.splice(rimaste.indexOf(g), 1)
    for (let i = 0; i < (g.prove || prove); i++) {
      let fatto
      try { fatto = g.fai(rnd) } catch (e) { if (e === STORTO) continue; throw e }
      let mappa
      try { mappa = componi(fatto.scavo, rnd, fatto.fondo) } catch (e) { if (e === STORTO) continue; throw e }
      const girato = gira({ mappa, soluzione: fatto.soluzione, fragili: fatto.fragili }, rnd)
      const tappa = {
        mappa: girato.mappa, salti: !!fatto.salti,
        carte: carteInMano(sbloccati), zaino: carteDi(girato.soluzione),
        soluzioni: [girato.soluzione],
        obbligatorie: girato.fragili.filter(f => f.obbligatoria).map(f => f.fila),
      }
      if (!provaLoZaino(tappa, { strada: g.strada || STRADA_MIN })) continue
      /* le mosse ingenue che restano sono quelle che perdono davvero */
      const liv = Livello.da(tappa)
      tappa.fragili = girato.fragili.map(f => f.fila).filter(f => {
        const r = esegui(liv, f, { eventi: false })
        return !(r.esito === TANA && r.carota)
      })
      delete tappa.obbligatorie
      return { ...tappa, sagoma: g.chiave, nome: scegli(rnd, g.nomi), tema: g.tema || null }
    }
  }
  return null
}

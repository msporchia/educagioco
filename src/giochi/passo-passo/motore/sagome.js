/* ═══════════════════════════════════════════════════════════════════
   LE SAGOME — i posti con lo zaino, fatti al momento

   Un posto del prato si genera a caso e si fa esaminare dal risolutore
   (`motore/generatore.js`): la strada più corta la trova lui, esatta.
   Con lo zaino non basta — il programma più corto coi cicli non lo trova
   una ricerca in ampiezza — quindi qui si va **al contrario**: prima si
   sceglie il programma, poi si scava il posto attorno alla strada che
   fa. La soluzione esiste per costruzione, e lo zaino è largo quanto lei.

   Una sagoma è una **forma di posto**, ognuna col suo «aha», le stesse
   della campagna: la scala a due frecce dove l'ordine conta, lo stagno
   con una scatola per lato, le terrazze (una scatola dentro l'altra), i
   solchi del campo, i sassi nel fiume, il lago a gradini dove la stessa
   freccia fa strade lunghe diverse, le pozze coi massi, la galleria
   sotto la siepe, le stalle del cane; e col «fino a» i gradini storti e
   il campo storto, e col «se» le colline e il sentiero dei segni. Ogni
   sagoma tira a caso le sue misure — quante volte, quanto lunghi i
   gradini, dove la carota, che colore — e il posto finito si gira e si
   specchia a caso: la stessa scala scende a destra, sale a sinistra, va
   in giù.

   ── COSA SI PRETENDE, PRIMA DI TENERLO ────────────────────────────
   Il motore vero rigioca tutto (`provaLoZaino`), e il posto si butta se:
     · la mappa non è scritta bene (una tana, una carota, le misure);
     · la soluzione non arriva a casa con la carota;
     · la strada, scritta freccia per freccia, ci sta nello zaino — il
       ciclo non servirebbe (`serveLaCarta`);
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
import { serveLaCarta } from './risolutore.js'
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
function componi(scavo, rnd, fondo) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const k of scavo.celle.keys()) {
    const [x, y] = k.split(',').map(Number)
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
  }
  if (x1 - x0 + 1 > COLONNE_MAX || y1 - y0 + 1 > RIGHE_MAX) storto()
  /* un giro di fuori in più da ogni lato, a caso, finché ci sta; e
     comunque abbastanza da non fare un posto più stretto di tre */
  for (const lato of ['x0', 'x1', 'y0', 'y1']) {
    const orizz = lato[0] === 'x'
    const largo = orizz ? x1 - x0 + 1 : y1 - y0 + 1
    const tetto = orizz ? COLONNE_MAX : RIGHE_MAX
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
function gira(t, rnd) {
  let { mappa, soluzione, fragili } = t
  for (const che of ['tr', 'fx', 'fy']) {
    if (rnd() < 0.5) continue
    if (che === 'tr' && (mappa.length > COLONNE_MAX || mappa[0].length > RIGHE_MAX)) continue
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

/* ═══════════ la prova ═══════════ */
export function provaLoZaino(t) {
  if (guastiDellaMappa(t.mappa).length) return false
  const liv = Livello.da(t)
  const sol = t.soluzioni[0]
  const r = esegui(liv, sol, { eventi: false })
  if (r.esito !== TANA || !r.carota) return false
  if (!serveLaCarta(liv)) return false
  for (const f of t.obbligatorie || []) {
    const e = esegui(liv, f, { eventi: false })
    if (e.esito === TANA && e.carota) return false
  }
  if (contandoSiVince(liv, sol)) return false
  return true
}

/* ═══════════ le sagome ═══════════
   Ognuna: la carta del suo gradino, le regole del mondo che le servono
   (`serve`), da che livello del sentiero compare (`da`), qualche nome, e
   `fai(rnd, livello)` che torna lo scavo, la soluzione e le mosse
   ingenue (`{ fila, obbligatoria }`). Il livello è quello del sentiero,
   da 0 a 9: allunga le strade e aggiunge i pezzi. */
const a = (rnd, n) => Math.floor(rnd() * n)
const tra = (rnd, da, fino) => da + a(rnd, fino - da + 1)
const scegli = (rnd, l) => l[a(rnd, l.length)]
const ruota = (l, k) => [...l.slice(k), ...l.slice(0, k)]

/* segue una fila di frecce sul prato, scavando dove passa: torna le
   celle dove ha messo piede, e si rifiuta di ripassare dove è già stata */
function segui(s, da, mosse, { visti = null, terra = '.' } = {}) {
  let p = da
  const celle = []
  for (const m of mosse) {
    p = passo(p, m)
    if (visti) { if (visti.has(chiave(p))) storto(); visti.add(chiave(p)) }
    if (terra === '.') s.prato(p[0], p[1]); else s.metti(p[0], p[1], terra)
    celle.push(p)
  }
  return { fine: p, celle }
}
const ripetute = (n, motivo) => Array.from({ length: n }, () => motivo).flat()

export const SAGOME = [
  /* ── la scala: un motivo di due o tre frecce, ripetuto ──
     Scavata larga due: accanto alla strada giusta c'è quella del motivo
     girato (→↓ invece di ↓→), che arriva a casa lo stesso — ma la carota
     sta su un gradino solo. Dal livello 3 le scale sono due, una che sale
     e una che scende, come la collina. */
  { chiave: 'scala', carta: 'ripeti', serve: [], da: 0,
    nomi: ['La scalinata', 'La scala del bosco', 'I gradini di pietra', 'La discesa'],
    fai(rnd, lv) {
      const s = new Scavo()
      s.metti(0, 0, 'P')
      const visti = new Set(['0,0'])
      let p = [0, 0]
      const sol = [], pezzi = []
      const pre = lv >= 2 && rnd() < 0.5 ? [scegli(rnd, ['destra', 'giu'])] : []
      if (pre.length) { p = segui(s, p, pre, { visti }).fine; sol.push(...pre) }
      const due = lv >= 3 && rnd() < 0.55
      const segmenti = []
      for (let k = 0; k < (due ? 2 : 1); k++) {
        const v = k === 0 ? 'giu' : scegli(rnd, ['giu', 'su'])
        const lunghi = lv >= 2 ? [['destra', v], [v, 'destra'], ['destra', 'destra', v], [v, v, 'destra']]
          : [['destra', v], [v, 'destra']]
        const motivo = scegli(rnd, lunghi)
        const girato = ruota(motivo, motivo.length === 2 ? 1 : tra(rnd, 1, 2))
        const n = due ? tra(rnd, 2, 4) : tra(rnd, 3, lv >= 4 ? 6 : 5)
        const vero = segui(s, p, ripetute(n, motivo), { visti })
        const falso = segui(s, p, ripetute(n, girato))
        const soloVero = vero.celle.filter(c => !falso.celle.some(f => f[0] === c[0] && f[1] === c[1]))
        segmenti.push({ n, motivo, girato, soloVero: soloVero.slice(0, -1) })
        pezzi.push(ripeti(n, ...motivo))
        p = vero.fine
      }
      const post = lv >= 2 && rnd() < 0.5 ? [scegli(rnd, ['destra', 'giu'])] : []
      if (post.length) p = segui(s, p, post, { visti }).fine
      s.forza(p[0], p[1], '@')
      /* la carota su un gradino che il motivo girato non tocca */
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

  /* ── lo stagno: una scatola per lato ──
     Due strade attorno allo stagno, e la carota su una sola: da che
     lato si comincia? */
  { chiave: 'stagno', carta: 'ripeti', serve: [], da: 0,
    nomi: ['Lo stagno grande', 'Il laghetto', 'La palude', 'Il boschetto'],
    fai(rnd, lv) {
      const s = new Scavo()
      const giu = tra(rnd, 3, lv >= 3 ? 6 : 5), dx = tra(rnd, 3, lv >= 3 ? 7 : 5)
      const pre = lv >= 3 && rnd() < 0.4 ? ['destra'] : []
      const post = lv >= 2 && rnd() < 0.4 ? ['giu'] : []
      const o = pre.length ? -1 : 0
      s.metti(o, 0, 'P')
      if (pre.length) s.prato(0, 0)
      const dentro = scegli(rnd, '~~~AB')
      for (let y = 1; y < giu; y++) for (let x = 1; x < dx; x++) s.metti(x, y, dentro)
      const vero = [], falso = []
      for (let y = 1; y <= giu; y++) { s.prato(0, y); vero.push([0, y]) }
      for (let x = 1; x <= dx; x++) { s.prato(x, giu); vero.push([x, giu]) }
      for (let x = 1; x <= dx; x++) { s.prato(x, 0); falso.push([x, 0]) }
      for (let y = 1; y < giu; y++) { s.prato(dx, y); falso.push([dx, y]) }
      const fine = post.length ? [dx, giu + 1] : [dx, giu]
      s.forza(fine[0], fine[1], '@')
      const [cx, cy] = scegli(rnd, vero.filter(([x, y]) => !(x === dx && y === giu) && !(x === 0 && y === giu)))
      s.forza(cx, cy, 'c')
      const fondo = dentro === '~' ? 'prato' : 'bosco'
      return {
        scavo: s, fondo,
        soluzione: programma(...pre, ripeti(giu, 'giu'), ripeti(dx, 'destra'), ...post),
        fragili: [{ fila: programma(...pre, ripeti(dx, 'destra'), ripeti(giu, 'giu'), ...post), obbligatoria: true }],
      }
    } },

  /* ── le terrazze: una scatola dentro l'altra ──
     Un gradino grande è fatto di passi piccoli, e si scende per due
     strade: giù e poi avanti, o avanti e poi giù. La carota su una sola. */
  { chiave: 'terrazze', carta: 'ripeti', serve: [], da: 2,
    nomi: ['Le terrazze', 'La vigna', 'I campi a gradini'],
    fai(rnd, lv) {
      const s = new Scavo()
      s.metti(0, 0, 'P')
      const k = tra(rnd, 2, 3), giu = tra(rnd, 2, 3), dx = tra(rnd, 2, 3)
      if (k * dx > 8 || k * giu > 8) storto()
      const motivo = [...ripetute(giu, ['giu']), ...ripetute(dx, ['destra'])]
      const girato = [...ripetute(dx, ['destra']), ...ripetute(giu, ['giu'])]
      const vero = segui(s, [0, 0], ripetute(k, motivo), { visti: new Set(['0,0']) })
      const falso = segui(s, [0, 0], ripetute(k, girato))
      s.forza(vero.fine[0], vero.fine[1], '@')
      const solo = vero.celle.filter(c => !falso.celle.some(f => f[0] === c[0] && f[1] === c[1]))
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
  { chiave: 'solchi', carta: 'ripeti', serve: [], da: 3,
    nomi: ['Il campo arato', 'L\'orto', 'I filari'],
    fai(rnd, lv) {
      const s = new Scavo()
      const w = tra(rnd, 4, 8), giri = lv >= 5 && rnd() < 0.5 ? 3 : 2
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
      const ultima = 2 * (righe - 1)
      s.forza(w, ultima, '@')
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

  /* ── di sasso in sasso: anche un salto si ripete ──
     Tutto acqua, e i sassi dove si atterra. Chi cammina invece di
     saltare fa splash. Dal livello 3, in mezzo anche qualche tronco. */
  { chiave: 'sassi', carta: 'ripeti', serve: ['salto'], da: 0, salti: true,
    nomi: ['Di sasso in sasso', 'Il guado', 'Il ruscello dei sassi'],
    fai(rnd, lv) {
      const s = new Scavo()
      s.metti(0, 0, 'P')
      const motivi = [['salto-destra', 'giu'], ['giu', 'salto-destra'], ['salto-destra', 'salto-giu']]
      if (lv >= 3) motivi.push(['salto-destra', 'giu', 'destra'], ['salto-destra', 'salto-giu', 'destra'])
      const motivo = scegli(rnd, motivi)
      const n = tra(rnd, 3, lv >= 4 ? 5 : 4)
      let p = [0, 0]
      const atterra = []
      const visti = new Set(['0,0'])
      for (const m of ripetute(n, motivo)) {
        const q = passo(p, m)
        if (m.startsWith('salto-')) {
          const mezzo = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
          s.metti(mezzo[0], mezzo[1], lv >= 3 && rnd() < 0.3 ? 't' : '~')
        }
        if (visti.has(chiave(q))) storto()
        visti.add(chiave(q))
        s.metti(q[0], q[1], '.')
        atterra.push(q)
        p = q
      }
      s.forza(p[0], p[1], '@')
      const [cx, cy] = scegli(rnd, atterra.slice(1, -1))
      s.forza(cx, cy, 'c')
      const cammina = motivo.map(m => m.replace('salto-', ''))
      return {
        scavo: s, fondo: 'acqua', salti: true,
        soluzione: programma(ripeti(n, ...motivo)),
        fragili: [{ fila: programma(ripeti(n, ...cammina)), obbligatoria: true }],
      }
    } },

  /* ── il lago a gradini: la stessa freccia, strade diverse ──
     Sul ghiaccio → fa una casella, poi tre, poi due: a fermare ci pensano
     i sassi. Il ciclo regge lo stesso, ed è l'aha. */
  { chiave: 'lago', carta: 'ripeti', serve: ['ghiaccio'], da: 0, tema: 'inverno',
    nomi: ['Il lago a gradini', 'Il ghiaccio a scalini', 'Lo stagno gelato'],
    fai(rnd, lv) {
      const s = new Scavo()
      s.metti(0, 0, 'P')
      const n = tra(rnd, 3, lv >= 3 ? 5 : 4)
      const lunghi = Array.from({ length: n }, () => tra(rnd, 1, 3))
      if (new Set(lunghi).size < 2) storto()
      let [x, y] = [0, 0]
      const ghiaccio = []
      for (let i = 0; i < n; i++) {
        const L = lunghi[i]
        for (let k = 1; k <= L; k++) { s.metti(x + k, y, '*'); ghiaccio.push([x + k, y]) }
        s.metti(x + L + 1, y, scegli(rnd, 'OOA'))
        x += L
        y += 1
        s.metti(x, y, i === n - 1 ? '@' : '.')
      }
      const [cx, cy] = scegli(rnd, ghiaccio)
      s.forza(cx, cy, 'C')
      return {
        scavo: s, fondo: scegli(rnd, ['bosco', 'stagno']),
        soluzione: programma(ripeti(n, 'destra', 'giu')),
        fragili: [{ fila: programma(ripeti(n, 'giu', 'destra')) }],
      }
    } },

  /* ── le pozze: a ogni gradino un masso fa il ponte ──
     La stessa scatola spinge, attraversa e va avanti. Chi va avanti prima
     di spingere trova un prato che finisce nell'acqua. */
  { chiave: 'pozze', carta: 'ripeti', serve: ['massi'], da: 1,
    nomi: ['Le pozze', 'I ponti di sasso', 'Il fosso dei massi'],
    fai(rnd, lv) {
      const s = new Scavo()
      s.metti(0, 0, 'P')
      const n = tra(rnd, 2, lv >= 3 ? 4 : 3)
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

  /* ── la galleria: la scala passa sotto la siepe ──
     A metà scala c'è una siepe da un capo all'altro, e una buca che ci
     passa sotto: il ciclo va avanti dall'altra parte, e la freccia che
     entra nella buca conta una volta sola, per quanto lunga sia la
     galleria. */
  { chiave: 'galleria', carta: 'ripeti', serve: ['buche'], da: 1,
    nomi: ['La galleria', 'La tana del tasso', 'Sotto la siepe'],
    fai(rnd, lv) {
      const s = new Scavo()
      s.metti(0, 0, 'P')
      const n = tra(rnd, 4, 5)
      const quando = tra(rnd, 1, n - 2)
      const largo = tra(rnd, 1, 2)
      let [x, y] = [0, 0]
      const dopo = []
      let siepe = null
      for (let i = 0; i < n; i++) {
        x += 1
        if (i === quando) {
          s.metti(x, y, '1')
          siepe = x + 1
          x += largo + 1
          s.metti(x, y, '1')
        } else s.metti(x, y, '.')
        if (siepe != null && i !== quando) dopo.push([x, y])
        y += 1
        s.metti(x, y, i === n - 1 ? '@' : '.')
        if (siepe != null && i !== n - 1) dopo.push([x, y])
      }
      for (let yy = -1; yy <= y + 1; yy++) for (let k = 0; k < largo; k++) s.metti(siepe + k, yy, 'B')
      if (!dopo.length) storto()
      const [cx, cy] = scegli(rnd, dopo)
      s.forza(cx, cy, 'c')
      return {
        scavo: s, fondo: scegli(rnd, ['bosco', 'prato']),
        soluzione: programma(ripeti(n, 'destra', 'giu')),
        fragili: [{ fila: programma(ripeti(n, 'giu', 'destra')) }],
      }
    } },

  /* ── le stalle: il cane lungo il corridoio ──
     Ogni pecora che gli sta sopra o sotto, a una o due caselle, scende
     nella sua stalla quando il cane le passa davanti. Una scatola e una
     freccia, e il numero giusto: chi si ferma prima lascia fuori l'ultima. */
  { chiave: 'stalle', carta: 'ripeti', serve: ['cane'], da: 0, cane: true,
    nomi: ['Le stalle', 'L\'ovile lungo', 'Il corridoio delle pecore'],
    fai(rnd, lv) {
      const s = new Scavo()
      const w = tra(rnd, 6, 8)
      const quante = tra(rnd, 2, Math.min(4, 2 + Math.floor(lv / 2)))
      const colonne = []
      while (colonne.length < quante) {
        const c = tra(rnd, 2, w)
        if (!colonne.includes(c)) colonne.push(c)
      }
      const ultima = Math.max(...colonne)
      if (ultima < 4) storto()
      for (let x = 0; x <= w; x++) s.metti(x, 3, '.')
      s.forza(0, 3, 'P')
      for (const c of colonne) {
        const su = rnd() < 0.5, lontana = lv >= 2 && rnd() < 0.4
        const v = su ? -1 : 1
        if (lontana) {
          s.metti(c, 3 + v, '.')
          s.metti(c, 3 + 2 * v, 'p')
          s.metti(c, 3 + 3 * v, '#')
        } else {
          s.metti(c, 3 + v, 'p')
          s.metti(c, 3 + 2 * v, '#')
        }
      }
      s.forza(tra(rnd, 1, ultima - 1), 3, 'c')
      return {
        scavo: s, fondo: scegli(rnd, ['bosco', 'prato']),
        soluzione: programma(ripeti(ultima, 'destra')),
        fragili: [{ fila: programma(ripeti(ultima - 1, 'destra')), obbligatoria: true }],
      }
    } },

  /* ── i gradini storti: fino al colore ──
     Ogni gradino è lungo diverso: contare non serve, si va avanti finché
     non si arriva sulla lastra, e si scende dal varco. Oltre la lastra il
     gradino continua, e sotto ci sono i fossi: chi conta invece di
     guardare ci cade. */
  { chiave: 'gradini', carta: 'fino', serve: [], da: 0,
    nomi: ['I gradini storti', 'La scala dei fossi', 'Le balze'],
    fai(rnd, lv) {
      const s = new Scavo()
      const colore = scegli(rnd, COLORI), lastra = LETTERA[colore]
      const k = tra(rnd, 3, lv >= 4 ? 5 : 4)
      const lunghi = Array.from({ length: k }, () => tra(rnd, 1, lv >= 3 ? 3 : 2))
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
     fila porta a casa, e lì non c'è lastra: la scatola si ferma alla tana. */
  { chiave: 'campo', carta: 'fino', serve: [], da: 3,
    nomi: ['Il campo storto', 'I fossi', 'Il campo di grano'],
    fai(rnd, lv) {
      const s = new Scavo()
      const colore = scegli(rnd, COLORI), lastra = LETTERA[colore]
      const w = tra(rnd, 6, 9), file = tra(rnd, 3, lv >= 6 ? 5 : 4)
      let entra = 0
      s.metti(0, 0, 'P')
      const posti = []
      for (let j = 0; j < file; j++) {
        const y = 2 * j, avanti = j % 2 === 0
        for (let x = 0; x < w; x++) s.prato(x, y)
        const ultima = j === file - 1
        if (avanti ? entra >= w - 1 : entra <= 0) storto()
        const fino = avanti ? tra(rnd, entra + 1, w - 1) : tra(rnd, 0, entra - 1)
        for (let x = Math.min(entra, fino) + 1; x < Math.max(entra, fino); x++) posti.push([x, y])
        if (ultima) { s.forza(fino, y, '@'); break }
        s.forza(fino, y, lastra)
        for (let x = 0; x < w; x++) s.metti(x, y + 1, x === fino ? '.' : '~')
        entra = fino
      }
      if (!posti.length) storto()
      const [cx, cy] = scegli(rnd, posti)
      s.forza(cx, cy, 'c')
      const giri = Math.ceil(file / 2)
      return {
        scavo: s, fondo: 'bosco',
        soluzione: programma(ripeti(giri, ripeti(colore, 'destra'), ripeti(2, 'giu'), ripeti(colore, 'sinistra'), ripeti(2, 'giu'))),
        fragili: [{ fila: programma(ripeti(giri, ripeti(colore, 'destra'), 'giu', ripeti(colore, 'sinistra'), 'giu')), obbligatoria: true }],
      }
    } },

  /* ── le colline: sempre avanti, e il colore dice su o giù ──
     Una scatola sola, e le colline tutte diverse. Chi legge un colore al
     contrario trova un pezzo di prato che sembra buono, e dietro l'acqua;
     chi si dimentica un «se» va dritto nello stagno. */
  { chiave: 'colline', carta: 'se', serve: [], da: 0,
    nomi: ['Le colline', 'Su e giù', 'I dossi'],
    fai(rnd, lv) {
      const s = new Scavo()
      const [giu, su] = [...COLORI].sort(() => rnd() - 0.5)
      const w = tra(rnd, 7, 9), alto = lv >= 3 ? 7 : 5
      let y = tra(rnd, 2, alto - 3)
      s.metti(0, y, 'P')
      const posti = []
      let prima = null, svolte = 0
      for (let x = 1; x < w; x++) {
        const ultima = x === w - 1
        let che = 'dritto'
        if (!ultima) {
          const puo = [['dritto', 1]]
          if (y + 1 <= alto - 2 && prima !== 'su') puo.push(['giu', 1.3])
          if (y - 1 >= 1 && prima !== 'giu') puo.push(['su', 1.3])
          let t = rnd() * puo.reduce((n, [, p]) => n + p, 0)
          for (const [c, p] of puo) { if ((t -= p) <= 0) { che = c; break } }
        }
        if (ultima) { s.metti(x, y, '@'); break }
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
      if (svolte < 3) storto()
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
     basta; tutt'intorno lo stagno, e chi scambia due colori ci finisce. */
  { chiave: 'segni', carta: 'se', serve: [], da: 2,
    nomi: ['Il sentiero dei segni', 'I cartelli', 'La strada dipinta'],
    fai(rnd, lv) {
      const s = new Scavo()
      const versi = ['destra', 'giu', 'sinistra', 'su']
      versi.splice(a(rnd, 4), 1)
      const colori = [...COLORI].sort(() => rnd() - 0.5)
      const coloreDi = Object.fromEntries(versi.map((v, i) => [v, colori[i]]))
      const n = tra(rnd, 10, lv >= 5 ? 18 : 14)
      /* il cammino: dentro nove per nove, senza toccare sé stesso */
      const celle = [[0, 0]], mosse = []
      const occupata = (x, y) => celle.some(c => c[0] === x && c[1] === y)
      let [x0, x1, y0, y1] = [0, 0, 0, 0]
      while (mosse.length < n) {
        const [x, y] = celle.at(-1)
        const buone = versi.filter(v => {
          const [nx, ny] = passo([x, y], v)
          if (occupata(nx, ny)) return false
          if (Math.max(x1, nx) - Math.min(x0, nx) > 7 || Math.max(y1, ny) - Math.min(y0, ny) > 7) return false
          return [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) =>
            (nx + dx === x && ny + dy === y) || !occupata(nx + dx, ny + dy))
        })
        if (!buone.length) storto()
        const v = scegli(rnd, buone)
        const q = passo([x, y], v)
        x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1])
        celle.push(q)
        mosse.push(v)
      }
      if (new Set(mosse.slice(2)).size < 3) storto()
      s.metti(0, 0, 'P')
      s.metti(celle[1][0], celle[1][1], 'c')
      for (let i = 2; i < n; i++) s.metti(celle[i][0], celle[i][1], LETTERA[coloreDi[mosse[i]]])
      s.metti(celle[n][0], celle[n][1], '@')
      const ordine = versi.slice().sort(() => rnd() - 0.5)
      const leggi = tab => ripeti(CASA, ...ordine.map(v => se(coloreDi[v], tab[v] || v)))
      const scambi = [[0, 1], [0, 2], [1, 2]].map(([i, j]) => leggi({ [versi[i]]: versi[j], [versi[j]]: versi[i] }))
      return {
        scavo: s, fondo: scegli(rnd, ['stagno', 'prato']),
        soluzione: programma(mosse[0], mosse[1], leggi({})),
        fragili: scambi.map(f => ({ fila: programma(mosse[0], mosse[1], f), obbligatoria: true })),
      }
    } },
]

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
   giocare (le regole del mondo che conosce, il livello del sentiero), si
   prova qualche volta, e se proprio non esce niente si passa a un'altra.
   Torna `null` solo se nessuna sagoma della carta regge: chi chiama ha la
   sua riserva. `sagoma` ne chiede una sola (per i test e per il banco). */
export function generaZaino(carta, sbloccati, lv, rnd, { prove = 40, sagoma = null } = {}) {
  const puo = SAGOME.filter(g => (sagoma ? g.chiave === sagoma
    : g.carta === carta && lv >= g.da && g.serve.every(r => sbloccati.includes(r))))
  /* le sagome che mescolano una regola del mondo pesano di più: sono
     quelle che fanno sembrare il sentiero un posto sempre nuovo */
  const pesi = puo.map(g => (g.serve.length ? 1.6 : 1))
  const rimaste = puo.slice()
  while (rimaste.length) {
    let t = rnd() * rimaste.reduce((n, g) => n + pesi[puo.indexOf(g)], 0)
    let g = rimaste[0]
    for (const q of rimaste) { if ((t -= pesi[puo.indexOf(q)]) <= 0) { g = q; break } }
    rimaste.splice(rimaste.indexOf(g), 1)
    for (let i = 0; i < prove; i++) {
      let fatto
      try { fatto = g.fai(rnd, lv) } catch (e) { if (e === STORTO) continue; throw e }
      let mappa
      try { mappa = componi(fatto.scavo, rnd, fatto.fondo) } catch (e) { if (e === STORTO) continue; throw e }
      const girato = gira({ mappa, soluzione: fatto.soluzione, fragili: fatto.fragili }, rnd)
      const tappa = {
        mappa: girato.mappa, salti: !!fatto.salti,
        carte: carteInMano(sbloccati), zaino: carteDi(girato.soluzione),
        soluzioni: [girato.soluzione],
        obbligatorie: girato.fragili.filter(f => f.obbligatoria).map(f => f.fila),
      }
      if (!provaLoZaino(tappa)) continue
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

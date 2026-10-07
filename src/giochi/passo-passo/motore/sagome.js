// Le sagome: i posti con lo zaino dei sentieri senza fine, fatti al
// momento andando **al contrario** — prima si sceglie il programma, poi
// si scava il posto attorno alla strada che fa, e lo zaino è largo
// quanto lei (un risolutore non trova il programma più corto coi cicli).
// Ogni sagoma tira a caso le sue misure e il posto finito si gira e si
// specchia a caso. Qui quelle del coniglio; quelle del cane stanno in
// `sagome-cane.js`, il foglio in `scavo.js`. Vedi docs/passo-passo/sentiero.md
// (le sagome, il pavimento, i controlli).
import { Livello } from './livello.js'
import { esegui, TANA } from './mondo.js'
import { risolvi } from './risolutore.js'
import { risolviSvelto, vaBene } from './svelto.js'
import { guastiDellaMappa } from '../dati/mondo.js'
import { programma, ripeti, se, carteDi, eRipeti, valoreDi, apri, VOLTE, COLORI, CASA } from '../dati/carte.js'
import { Scavo, STORTO, storto, LETTERA, passo, chiave, componi, gira, a, tra, scegli, ruota, mescola, segui,
         ripetute, uguali, cammino } from './scavo.js'
import { SAGOME_CANE } from './sagome-cane.js'

// ogni testa «fino a un colore» diventa un numero, e si provano tutte le
// combinazioni: se una vince, il «fino a» non serve (vedi provaLoZaino)
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

// la prova: il pavimento di un posto col zaino (vedi docs/passo-passo/sentiero.md)
export const ZAINO_MIN = 5
export const STRADA_MIN = 15
export function provaLoZaino(t, { strada = STRADA_MIN, zaino = ZAINO_MIN } = {}) {
  if (guastiDellaMappa(t.mappa).length) return false
  if (carteDi(t.soluzioni[0]) < zaino) return false
  const liv = Livello.da(t)
  const sol = t.soluzioni[0]
  const r = esegui(liv, sol, { eventi: false })
  if (r.esito !== TANA || !r.carota) return false
  const sciolta = vaBene(liv) ? risolviSvelto(liv, { carota: false, limite: 100000 }) : risolvi(liv, { carota: false })
  if (!sciolta || sciolta.length <= liv.zaino || sciolta.length < strada) return false
  for (const f of t.obbligatorie || []) {
    const e = esegui(liv, f, { eventi: false })
    if (e.esito === TANA && e.carota) return false
  }
  if (contandoSiVince(liv, sol)) return false
  return true
}

// le sagome: ognuna ha la carta del suo gradino, le regole del mondo che
// le servono (`serve`), qualche nome, e `fai(rnd)` che torna lo scavo, la
// soluzione e le mosse ingenue (`{ fila, obbligatoria }`)

const DEL_CONIGLIO = [
  // la collina: due scale in fila; la carota sta solo sul gradino vero,
  // non su quello del motivo girato (che arriva a casa lo stesso)
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
        const n = tra(rnd, 3, motivo.length === 2 ? 5 : 4)
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

  // le terrazze: due strade equivalenti (giù poi avanti, o avanti poi
  // giù), la carota sta solo su una
  { chiave: 'terrazze', carta: 'ripeti', serve: [],
    nomi: ['Le terrazze', 'La vigna', 'I campi a gradini'],
    fai(rnd) {
      const s = new Scavo()
      s.metti(0, 0, 'P')
      const k = tra(rnd, 2, 3), giu = tra(rnd, 2, 5), dx = tra(rnd, 2, 4)
      if (k * dx > 8 || k * giu > 10 || k * (giu + dx) < STRADA_MIN) storto()
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

  // il campo arato: il varco della siepe è in fondo alla fila, chi conta
  // un passo di meno ci sbatte il muso
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

  // di sasso in sasso: tutto acqua, chi cammina invece di saltare fa splash
  { chiave: 'sassi', carta: 'ripeti', serve: ['salto'], strada: 12,
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
        const n = 3
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

  // la spirale di ghiaccio: la stessa scatola gira quattro volte il lago
  // con scivolate lunghe diverse; regge circa una prova su trecento, da qui `prove: 2000`
  { chiave: 'spirale', carta: 'ripeti', serve: ['ghiaccio'], strada: 10, tema: 'inverno', prove: 2000,
    nomi: ['La spirale di ghiaccio', 'Il lago che gira', 'La pista gelata'],
    fai(rnd) {
      const s = new Scavo()
      s.metti(0, 0, 'P')
      const versi = ['destra', 'giu', 'sinistra', 'su']
      const n = tra(rnd, 10, 13)
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

  // le pozze: chi va avanti prima di spingere il masso trova un prato
  // che finisce in acqua
  { chiave: 'pozze', carta: 'ripeti', serve: ['massi'],
    nomi: ['Le pozze', 'I ponti di sasso', 'Il fosso dei massi'],
    fai(rnd) {
      const s = new Scavo()
      s.metti(0, 0, 'P')
      const n = 4
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

  // i gradini storti: oltre la lastra il gradino continua sul fosso, chi
  // conta invece di guardare ci cade
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

  // il campo storto: il passaggio fra un fosso e l'altro è ogni volta in
  // un posto diverso, lo dice la lastra (col salto: il fiume dei sassi)
  { chiave: 'campo', carta: 'fino', serve: [],
    nomi: ['Il campo storto', 'I fossi', 'Il campo di grano'],
    fai(rnd) { return campoStorto(rnd, false) } },
  { chiave: 'fiume', carta: 'fino', serve: ['salto'], strada: 12,
    nomi: ['Il fiume dei sassi', 'Il guado lungo', 'Le pietre del torrente'],
    fai(rnd) { return campoStorto(rnd, true) } },

  // scale e pianerottoli: due colori, lunghi diversi ogni volta
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

  // le gallerie: corridoi uno sotto l'altro, chiusi dalla siepe; in fondo
  // a ognuno una buca che sbuca all'inizio del corridoio dopo. Lunghi
  // uguali si contano; storti, li dice la lastra davanti alla buca
  { chiave: 'gallerie', carta: 'ripeti', serve: ['buche'],
    nomi: ['Le gallerie', 'Le tane in fila', 'Sotto la siepe'],
    fai(rnd) { return gallerie(rnd, false) } },
  { chiave: 'gallerie-storte', carta: 'fino', serve: ['buche'],
    nomi: ['Le gallerie storte', 'Le tane del bosco', 'I cunicoli'],
    fai(rnd) { return gallerie(rnd, true) } },

  // le colline: sempre avanti, il colore dice su o giù; chi legge un
  // colore al contrario trova un prato che sembra buono, e dietro l'acqua
  { chiave: 'colline', carta: 'se', serve: [],
    nomi: ['Le colline', 'Su e giù', 'I dossi'],
    fai(rnd) {
      const s = new Scavo()
      const [giu, su] = mescola(rnd, COLORI)
      const w = tra(rnd, 10, 11), alto = 8   // più largo di nove: il posto si gira per il lungo
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

  // il sentiero dei segni: tre versi, un colore per verso; chi scambia
  // due colori finisce nello stagno (sul ghiaccio: si scivola fra un segno e l'altro)
  { chiave: 'segni', carta: 'se', serve: [],
    nomi: ['Il sentiero dei segni', 'I cartelli', 'La strada dipinta'],
    fai(rnd) { return segni(rnd, false) } },
  { chiave: 'segni-ghiaccio', carta: 'se', serve: ['ghiaccio'], strada: 12, tema: 'inverno',
    nomi: ['Il bosco ghiacciato', 'I cartelli sul ghiaccio', 'Il lago dei segni'],
    fai(rnd) { return segni(rnd, true) } },
]
/* tutte, il coniglio e il cane: una sagoma del cane dice `animale: 'cane'` */
export const SAGOME = [...DEL_CONIGLIO, ...SAGOME_CANE]
export const animaleDi = g => g.animale || 'coniglio'

/* le gallerie, lunghe uguali o storte: le buche sono tre coppie al
   massimo, quindi quattro corridoi. Oltre la lastra il corridoio
   continua, e chi conta scende contro la siepe */
function gallerie(rnd, storte) {
  const s = new Scavo()
  const k = tra(rnd, 3, 4), n = tra(rnd, 3, 6)
  const lunghi = Array.from({ length: k }, () => (storte ? tra(rnd, 2, 6) : n))
  if (storte && new Set(lunghi).size < 3) storto()
  const colore = scegli(rnd, COLORI), lastra = LETTERA[colore]
  s.metti(0, -1, 'P')
  s.metti(0, 0, '.')
  const posti = []
  for (let i = 0; i < k; i++) {
    const y = 3 * i, L = lunghi[i]
    for (let x = 1; x < L; x++) { s.metti(x, y, '.'); posti.push([x, y]) }
    if (i === k - 1) { s.metti(L, y, '@'); break }
    s.metti(L, y, storte ? lastra : '.')
    if (storte) { const oltre = tra(rnd, 1, 2); for (let j = 1; j <= oltre; j++) s.metti(L + j, y, '.') }
    const coppia = String(i + 1)
    s.metti(L, y + 1, coppia)
    s.metti(0, y + 3, coppia)
  }
  if (!posti.length) storto()
  const [cx, cy] = scegli(rnd, posti)
  s.forza(cx, cy, 'c')
  const corpo = storte ? ripeti(colore, 'destra') : ripeti(n, 'destra')
  return {
    scavo: s, fondo: scegli(rnd, ['bosco', 'prato']),
    soluzione: programma('giu', ripeti(k, corpo, 'giu')),
    fragili: storte
      ? [{ fila: programma('giu', ripeti(k, ripeti(colore, 'destra'))), obbligatoria: true }]
      : [{ fila: programma('giu', ripeti(k, ripeti(n - 1, 'destra'), 'giu')) },
         { fila: programma('giu', ripeti(k, ripeti(n + 1, 'destra'), 'giu')) }],
  }
}

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

// le carte in mano dal gradino che le ha messe in poi (come nella campagna)
export function carteInMano(sbloccati) {
  const carte = ['ripeti']
  if (sbloccati.includes('fino')) carte.push('fino')
  if (sbloccati.includes('se')) carte.push('casa', 'se')
  return carte
}

// un posto con lo zaino: prova una sagoma della carta chiesta, e se
// nessuna regge torna `null` (chi chiama ha la sua riserva)
export function generaZaino(carta, sbloccati, rnd, { prove = 60, sagoma = null, strada = 'coniglio', prima = null } = {}) {
  const puo = SAGOME.filter(g => (sagoma ? g.chiave === sagoma
    : g.carta === carta && animaleDi(g) === strada && g.serve.every(r => sbloccati.includes(r))))
  /* le sagome che mescolano una regola del mondo pesano di più: sono
     quelle che fanno sembrare il sentiero un posto sempre nuovo; quella
     del posto di prima pesa poco */
  const pesi = puo.map(g => (g.serve.length ? 1.6 : 1) * (g.chiave === prima ? 0.15 : 1))
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

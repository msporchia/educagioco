// Le sagome miste: i posti per chi ha tutte le carte, con due o tre idee
// insieme — un ciclo con dei se dentro, sul prato, sul ghiaccio, coi
// salti; le nicchie del cane coi colori, fonde, gelate. Come le altre
// sagome, prima il programma e poi il posto: qui il posto è **la strada
// che il programma fa**, scavata mentre lo si esegue, e a ogni lastra il
// caso sceglie quale se scatta. Vedi docs/passo-passo/sentiero-finale.md.
import { programma, ripeti, se, COLORI, CASA } from '../dati/carte.js'
import { Scavo, STORTO, storto, LETTERA, passo, chiave, a, tra, scegli, mescola } from './scavo.js'
import { COLONNE_MAX, RIGHE_MAX } from '../dati/mondo.js'

const VICINI = [[1, 0], [-1, 0], [0, 1], [0, -1]]
/* tre frecce uguali di fila si scrivono con una scatola: costa una carta meno */
const compatta = mosse => mosse.reduce((l, m) => {
  const ultima = l.at(-1)
  if (Array.isArray(ultima) && ultima[1] === m) ultima[0]++
  else l.push([1, m])
  return l
}, []).flatMap(([n, m]) => (n >= 3 ? [ripeti(n, m)] : Array(n).fill(m)))
/* lo scavo (con qualche cella in più) sta in un posto? si gira per il lungo, se serve */
function ciSta(s, piu = []) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  const guarda = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
  for (const k of s.celle.keys()) { const [x, y] = k.split(',').map(Number); guarda(x, y) }
  for (const [x, y] of piu) guarda(x, y)
  const w = x1 - x0 + 1, h = y1 - y0 + 1
  return Math.max(w, h) <= RIGHE_MAX && Math.min(w, h) <= COLONNE_MAX
}
const piede = m => (m.startsWith('salto-') ? m.slice(6) : m)

/* ── le decisioni: quale se scatta a ogni giro (null: nessuno) ──
   Chi non usa il se deve contare o fermarsi a un colore: lo si impedisce
   con una fila di decisioni storta — ogni ramo almeno `almeno` volte,
   almeno `blocchi` cambi di ramo, e nessun motivo che si ripete ogni
   uno, due o tre (si scriverebbe con un ciclo di «fino a») */
const periodica = s => [1, 2, 3].some(p => s.length >= 2 * p && s.every((x, i) => i < p || x === s[i - p]))
export const storta = (s, valori, { almeno = 2, blocchi = 4 } = {}) =>
  valori.every(v => s.filter(x => x === v).length >= almeno) &&
  s.filter((x, i) => i === 0 || x !== s[i - 1]).length >= Math.min(blocchi, s.length) && !periodica(s)
export function decisioni(rnd, giri, rami, { nessuno = 0.25, almeno = 2, blocchi = 4 } = {}) {
  const valori = Array.from({ length: rami }, (_, r) => r)
  for (let prova = 0; prova < 40; prova++) {
    const d = Array.from({ length: giri }, () => (rnd() < nessuno ? null : a(rnd, rami)))
    if (storta(d.filter(x => x !== null), valori, { almeno, blocchi })) return d
  }
  return storto()
}

/* ── la segnaletica: la strada del coniglio ──
   Il programma è `ripeti(testa, …motivo, se(c1, …ramo1), se(c2, …ramo2)…)`,
   più `dopo` in fondo. A ogni giro il coniglio fa il motivo e arriva su
   una cella dove il caso mette (o no) la lastra di un ramo. La strada non
   passa mai accanto a sé stessa (sarebbe una scorciatoia); sul ghiaccio
   ogni freccia scivola fino alla prossima cella d'erba. Accanto a ogni
   lastra, le false piste: il primo passo di un altro ramo (chi scambia i
   colori) e il motivo che riparte (chi dimentica il se) trovano un pezzo
   di prato — o di ghiaccio — e dietro l'acqua. */
export function segnaletica(rnd, opzioni) {
  /* le decisioni tirate a caso pestano spesso la strada di prima (su di
     due e subito giù di due): si riprova qui, che costa poco */
  for (let k = 0; k < 30; k++) {
    try { return scava(rnd, opzioni) } catch (e) { if (e !== STORTO) throw e }
  }
  return storto()
}
function scava(rnd, { motivo, rami, giri, ghiaccio = false, salti = false, testa = 'casa', dopo = [],
                      nessuno = 0.25, almeno = 2, blocchi = 4, fondo = 'bosco' }) {
  const s = new Scavo()
  const colori = mescola(rnd, COLORI)
  const coloreDi = rami.map((_, i) => colori[i])
  const ferma = testa === 'fino' ? colori[rami.length] : null
  if (testa === 'fino' && !ferma) storto()
  const sulla = new Set(['0,0'])
  s.metti(0, 0, 'P')
  let p = [0, 0]
  const strada = []
  const tocca = (q, da, ancheQui = null) => VICINI.some(([dx, dy]) => {
    const r = [q[0] + dx, q[1] + dy]
    return !(r[0] === da[0] && r[1] === da[1]) && (sulla.has(chiave(r)) || (ancheQui && ancheQui.has(chiave(r))))
  })
  let primo = true
  /* un pezzo di strada, provato senza scriverlo: le celle che occupa, o
     `null` se pesta la strada (o le passa accanto, che è una scorciatoia) */
  const pezzo = (da, mosse, gelo = ghiaccio === true) => {
    const nuove = new Set(), celle = []
    let q0 = da, prima = primo
    const libera = q => !sulla.has(chiave(q)) && !nuove.has(chiave(q)) && s.get(q[0], q[1]) === undefined
    for (const m of mosse) {
      if (m.startsWith('salto-')) {
        const mezzo = passo(q0, piede(m)), q = passo(q0, m)
        if (!libera(mezzo) || !libera(q) || tocca(q, mezzo, nuove)) return null
        nuove.add(chiave(mezzo)); nuove.add(chiave(q))
        celle.push([mezzo, '~', false], [q, '.', true])
        q0 = q
        continue
      }
      /* sul ghiaccio: da una a tre celle di ghiaccio (la prima scivolata
         almeno due), e la cella d'erba dove ci si ferma */
      const L = gelo ? (prima ? tra(rnd, 2, 3) : scegli(rnd, [1, 2, 2, 3])) : 1
      prima = false
      for (let k = 1; k <= L; k++) {
        const q = passo(q0, m)
        if (!libera(q) || tocca(q, q0, nuove)) return null
        nuove.add(chiave(q))
        celle.push([q, k < L ? '*' : '.', true])
        q0 = q
      }
    }
    return { celle, fine: q0, prima }
  }
  const scrivi = t => {
    for (const [q, ch, via] of t.celle) {
      s.metti(q[0], q[1], ch)
      if (via) { sulla.add(chiave(q)); strada.push(q) }
    }
    primo = t.prima
    p = t.fine
  }
  /* a ogni giro il motivo, e poi il ramo che il caso sceglie fra quelli
     che non pestano la strada */
  const lastre = [], scelte = []
  for (let g = 0; g < giri; g++) {
    const m = pezzo(p, motivo, !!ghiaccio)
    if (!m) storto()
    scrivi(m)
    /* il ramo tirato a caso; se pesta la strada, nessuno */
    const prove = rnd() < nessuno ? [null] : [a(rnd, rami.length), null]
    let fatto = false
    for (const b of prove) {
      if (b === null) { scelte.push(null); fatto = true; break }
      const r = pezzo(p, rami[b])
      if (!r) continue
      s.forza(p[0], p[1], LETTERA[coloreDi[b]])
      lastre.push({ p, b })
      scelte.push(b)
      scrivi(r)
      fatto = true
      break
    }
    if (!fatto) storto()
  }
  if (!storta(scelte.filter(x => x !== null), rami.map((_, i) => i), { almeno, blocchi })) storto()
  if (ferma) s.forza(p[0], p[1], LETTERA[ferma])
  if (dopo.length) { const d = pezzo(p, dopo); if (!d) storto(); scrivi(d) }
  s.forza(p[0], p[1], '@')
  if (!ciSta(s)) storto()

  /* le false piste, accanto a ogni lastra (se il posto non si allarga troppo) */
  for (const { p: l, b } of lastre) {
    const sbagli = [...rami.filter((_, i) => i !== b).map(r => r[0]), motivo[0]]
    for (const m of sbagli) {
      if (m.startsWith('salto-')) continue
      const q = passo(l, m)
      if (s.get(q[0], q[1]) !== undefined || tocca(q, l)) continue
      const r = passo(q, m)
      if (s.get(r[0], r[1]) !== undefined || !ciSta(s, [q, r])) continue
      s.metti(q[0], q[1], ghiaccio === true ? '*' : '.')
      s.metti(r[0], r[1], '~')
    }
  }
  /* la carota: su un pezzo di strada senza lastra */
  const posti = strada.filter(q => '.*'.includes(s.get(q[0], q[1])))
  if (!posti.length) storto()
  const [cx, cy] = scegli(rnd, posti)
  s.forza(cx, cy, s.get(cx, cy) === '*' ? 'C' : 'c')

  const ordine = mescola(rnd, rami.map((_, i) => i))
  const corpo = scambio => [...motivo, ...ordine.map(i => se(coloreDi[i], ...compatta(rami[scambio ? scambio[i] : i])))]
  const testaDi = testa === 'fino' ? ferma : testa === 'numero' ? giri : CASA
  const con = (c, d = dopo) => programma(ripeti(testaDi, ...c), ...d)
  /* le mosse ingenue: due colori scambiati, un se dimenticato */
  const coppie = rami.length === 2 ? [[0, 1]] : [[0, 1], [0, 2], [1, 2]]
  const fragili = [
    ...coppie.map(([i, j]) => {
      const scambio = rami.map((_, k) => (k === i ? j : k === j ? i : k))
      return { fila: con(corpo(scambio)), obbligatoria: true }
    }),
    { fila: con([...motivo, ...ordine.filter(i => i !== ordine[0]).map(i => se(coloreDi[i], ...compatta(rami[i])))]), obbligatoria: true },
  ]
  return { scavo: s, fondo, salti, soluzione: con(corpo()), fragili }
}

/* ── le nicchie del cane ──
   Un corridoio con le nicchie di qua e di là: in ognuna la pecora a metà
   e la stalla in fondo. La lastra davanti dice da che parte. `fonde`: le
   nicchie di un lato sono lunghe due, e il cane ci entra due passi;
   `gelate`: qualche nicchia in più ha il ghiaccio, e la pecora ci scivola
   dentro da sola appena vede il cane — davanti non c'è la lastra, e chi
   ci entra lo stesso trova la stalla piena di ghiaccio e scivola anche lui */
function nicchia(s, x, v, profondo, gelata = false) {
  s.metti(x, v, '.')
  s.metti(x, 2 * v, 'p')
  for (let k = 1; k <= profondo; k++) s.metti(x, (2 + k) * v, gelata ? '*' : '.')
  s.metti(x, (3 + profondo) * v, '#')
  for (let k = 1; k <= 3 + profondo; k++) for (const d of [-1, 1]) if (s.get(x + d, k * v) === undefined) s.metti(x + d, k * v, 'A')
}
const dentro = (v, profondo) => [...Array(profondo).fill(v > 0 ? 'giu' : 'su'), ...Array(profondo).fill(v > 0 ? 'su' : 'giu')]

export function nicchie(rnd, { fonde = false, gelate = false }) {
  const s = new Scavo()
  const [cGiu, cSu] = mescola(rnd, COLORI)
  /* quale lato è fondo, se ce n'è uno */
  const fondo = fonde ? scegli(rnd, [1, -1]) : 0
  const prof = v => (v === fondo ? 2 : 1)
  const lati = decisioni(rnd, fonde ? 4 : 5, 2, { nessuno: 0, almeno: 2, blocchi: 3 }).map(b => (b ? -1 : 1))
  /* le nicchie gelate, in mezzo alle altre: null nella fila */
  if (gelate) for (let k = tra(rnd, 1, 2); k > 0; k--) lati.splice(1 + a(rnd, lati.length - 1), 0, null)
  s.metti(0, 0, 'P')
  let x = 0, prima = 0
  const posti = []
  for (const v of lati) {
    /* una gelata sta dalla parte opposta della nicchia di prima, se può */
    const lato = v === null ? -prima || scegli(rnd, [1, -1]) : v
    /* due nicchie dalla stessa parte non stanno attaccate (c'è la siepe);
       per il resto il passo è storto: a passo fisso, una scatola che
       avanza di due farebbe a meno del se */
    const salto = lato === prima ? tra(rnd, 2, 3) : tra(rnd, 1, 3)
    prima = lato
    for (let k = 1; k < salto; k++) { s.metti(x + k, 0, '.'); posti.push([x + k, 0]) }
    x += salto
    if (v === null) {
      s.metti(x, 0, '.')
      posti.push([x, 0])
      nicchia(s, x, lato, 1, true)
      continue
    }
    s.metti(x, 0, LETTERA[v === 1 ? cGiu : cSu])
    nicchia(s, x, v, prof(v))
    /* dall'altra parte, il fosso: chi scambia i colori ci mette la zampa */
    if (s.get(x, -v) === undefined) s.metti(x, -v, '~')
  }
  if (!posti.length || !ciSta(s)) storto()
  const [cx, cy] = scegli(rnd, posti)
  s.forza(cx, cy, 'c')
  /* i rami nell'ordine del caso; le nicchie fonde si scrivono con le
     scatole (`ripeti(2, giu)`) una volta su due: costano uguale */
  const ordine = rnd() < 0.5 ? [1, -1] : [-1, 1]
  const coloreDi = v => (v === 1 ? cGiu : cSu)
  const scatole = rnd() < 0.5
  const giu = (v, n) => (scatole && n > 1 ? [ripeti(n, v > 0 ? 'giu' : 'su'), ripeti(n, v > 0 ? 'su' : 'giu')] : dentro(v, n))
  const con = (lato, p = prof) => programma(ripeti(CASA, 'destra', ...lato.map(v => se(coloreDi(v), ...giu(v, p(v))))))
  return {
    scavo: s, fondo: scegli(rnd, ['bosco', 'prato']),
    soluzione: con(ordine),
    fragili: [
      /* i colori scambiati, un se dimenticato, le nicchie tutte uguali */
      { fila: programma(ripeti(CASA, 'destra', ...ordine.map(v => se(coloreDi(v), ...giu(-v, prof(-v)))))), obbligatoria: true },
      { fila: con(ordine.slice(0, 1)), obbligatoria: true },
      ...(fonde ? [{ fila: con(ordine, () => 1), obbligatoria: true }] : []),
    ],
  }
}

/* le idee della segnaletica, una per sagoma: il motivo e i rami */
const SU2 = ['su', 'su'], GIU2 = ['giu', 'giu']
export const SAGOME_MISTE = [
  // le colline alte: si sale e si scende di due, e il colore dice dove
  { chiave: 'colline-alte', carta: 'se', carte: ['se'], serve: [],
    nomi: ['Le colline alte', 'I colli', 'Su e giù per i colli'],
    fai(rnd) {
      return segnaletica(rnd, { motivo: ['destra'], rami: [GIU2, SU2], giri: tra(rnd, 7, 9), nessuno: 0.25,
                                fondo: scegli(rnd, ['bosco', 'prato']) })
    } },
  // le colline ripide: si scende di tre e si sale di due, e il colore
  // dice quale delle due
  { chiave: 'colline-ripide', carta: 'fino', carte: ['se'], serve: [],
    nomi: ['Le colline ripide', 'Il monte e la valle', 'Le balze'],
    fai(rnd) {
      return segnaletica(rnd, { motivo: ['destra'], rami: [['giu', 'giu', 'giu'], SU2], giri: tra(rnd, 7, 9), nessuno: 0.25,
                                fondo: scegli(rnd, ['bosco', 'prato']) })
    } },
  // il torrente gelato: le colline alte, ma fra un colle e l'altro si
  // scivola sul ghiaccio, ogni volta per un pezzo diverso
  { chiave: 'colline-gelate', carta: 'se', carte: ['se'], serve: ['ghiaccio'], tema: 'inverno', strada: 12,
    nomi: ['Il torrente gelato', 'I colli di ghiaccio', 'La valle gelata'],
    fai(rnd) {
      return segnaletica(rnd, { motivo: ['destra'], rami: [GIU2, SU2], giri: tra(rnd, 5, 6), nessuno: 0.15,
                                ghiaccio: 'motivo', blocchi: 3, fondo: scegli(rnd, ['stagno', 'bosco']) })
    } },
  // le terrazze dei fossi: si scende a gradini; il colore dice dove il
  // gradino è più lungo, dove è più fondo, e dove c'è il fosso da saltare
  { chiave: 'terrazze-salti', carta: 'ripeti', carte: ['se'], serve: ['salto'], strada: 12,
    nomi: ['Le terrazze dei fossi', 'La vigna dei fossi', 'I gradini del torrente'],
    fai(rnd) {
      return segnaletica(rnd, { motivo: ['giu', 'destra'], rami: [['destra'], ['giu'], ['salto-destra']], giri: tra(rnd, 5, 6),
                                nessuno: 0.1, almeno: 1, salti: true, fondo: 'siepe' })
    } },

  // le nicchie del cane, coi colori: semplici, fonde, sul ghiaccio
  { chiave: 'nicchie', carta: 'se', carte: ['se'], animale: 'cane', serve: [], strada: 12, cerca: 0, prove: 300,
    nomi: ['Le nicchie', 'Il corridoio delle stalle', 'Le stalle di qua e di là'],
    fai(rnd) { return nicchie(rnd, {}) } },
  { chiave: 'nicchie-fonde', carta: 'se', carte: ['se'], animale: 'cane', serve: [], strada: 12, cerca: 0, prove: 300,
    nomi: ['Le nicchie fonde', 'Le stalle profonde', 'Il corridoio lungo'],
    fai(rnd) { return nicchie(rnd, { fonde: true }) } },
  { chiave: 'nicchie-gelate', carta: 'ripeti', carte: ['se'], animale: 'cane', serve: ['ghiaccio'], tema: 'inverno', strada: 12, cerca: 0, prove: 300,
    nomi: ['Le nicchie gelate', 'Le stalle sul ghiaccio', 'Il corridoio d\'inverno'],
    fai(rnd) { return nicchie(rnd, { gelate: true }) } },
]

// Da una tappa a una domanda: funzioni pure, senza schermo. Il caso si
// passa da fuori (`rnd`). Come nasce una domanda, il perché della griglia
// e i casi per verbo: docs/conta/domande.md.
//
// Una domanda, per qualunque verbo, ha sempre questa forma:
//   { verbo, modo, consegna: { icone, frase }, nominate, gruppi, opzioni,
//     rispostaGiusta }
//   nominate  le chiavi delle specie nominate in questa domanda: la
//             domanda dopo le evita quando sceglie le sue (`sceltaSpecie`)
//   gruppi    [{ chiave, gettoni }], gettoni: [{ id, x, y, specie,
//             bersaglio }] — x/y sono percentuali dell'area, non pixel;
//             `bersaglio: false` è un distrattore, non conta nella risposta
import { mondo, specieDi } from '../dati/mondi.js'
import { VERBI } from '../dati/verbi.js'

export const MIN_DIST = 16   // percento dell'area: un gettone grosso non ne tocca un altro

const AREA = { xMin: 6, xMax: 94, yMin: 10, yMax: 90 }
const RECINTI = {
  sinistra: { xMin: 6, xMax: 46, yMin: 10, yMax: 90 },
  destra:   { xMin: 54, xMax: 94, yMin: 10, yMax: 90 },
}

function mescola(lista, rnd) {
  const a = lista.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const interoIn = (rnd, min, max) => (max < min ? min : min + Math.floor(rnd() * (max - min + 1)))

// La griglia sicura (nessuna sovrapposizione), non un tentativo a caso:
// vedi docs/conta/domande.md.
function posizioni(n, rnd, area, { ordinate = false } = {}) {
  if (n <= 0) return []
  const larghezza = area.xMax - area.xMin, altezza = area.yMax - area.yMin
  const colsMax = Math.max(1, Math.floor(larghezza / MIN_DIST))
  const rowsMax = Math.max(1, Math.floor(altezza / MIN_DIST))
  const cols = ordinate
    ? Math.min(n, colsMax)
    : Math.max(1, Math.min(Math.round(Math.sqrt(n * larghezza / altezza)), colsMax))
  const rows = Math.min(Math.ceil(n / cols), rowsMax)
  if (cols * rows < n)
    throw new Error(`conta: ${n} gettoni non ci stanno nell'area a distanza ${MIN_DIST} (capacità ${cols * rows})`)

  const celle = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) celle.push({ r, c })
  const scelte = (ordinate ? celle : mescola(celle, rnd)).slice(0, n)

  const cellW = larghezza / cols, cellH = altezza / rows
  const jitterX = ordinate ? 0 : Math.max(0, (cellW - MIN_DIST) / 2)
  const jitterY = ordinate ? 0 : Math.max(0, (cellH - MIN_DIST) / 2)
  return scelte.map(({ r, c }) => ({
    x: area.xMin + cellW * (c + 0.5) + (rnd() * 2 - 1) * jitterX,
    y: area.yMin + cellH * (r + 0.5) + (rnd() * 2 - 1) * jitterY,
  }))
}

// `escludi` è un divieto, `evita` un desiderio: vedi docs/conta/domande.md.
function sceltaSpecie(m, categoria, quante, rnd, escludi = [], evita = []) {
  const pool = specieDi(m, categoria).filter(s => !escludi.includes(s.chiave))
  if (pool.length < quante)
    throw new Error(`conta: il mondo "${m.chiave}" non ha ${quante} specie "${categoria}" (ne ha ${pool.length})`)
  const inGioco = evita.filter(c => pool.some(s => s.chiave === c))
  const evitate = inGioco.slice(0, Math.max(0, pool.length - quante))
  const fresche = mescola(pool.filter(s => !evitate.includes(s.chiave)), rnd)
  const riviste = mescola(pool.filter(s => evitate.includes(s.chiave)), rnd)
  return [...fresche, ...riviste].slice(0, quante)
}

// Le cifre fra cui si sceglie: sempre vicine al valore vero.
function opzioniNumeriche(corretta, rnd, { quante = 4, minimo = 0 } = {}) {
  const scarti = mescola([1, -1, 2, -2, 3, -3, 4, -4], rnd)
  const valori = new Set([corretta])
  for (const s of scarti) {
    if (valori.size >= quante) break
    const v = corretta + s
    if (v >= minimo) valori.add(v)
  }
  let riempitivo = minimo
  while (valori.size < quante) { if (!valori.has(riempitivo)) valori.add(riempitivo); riempitivo++ }
  return mescola([...valori], rnd).map(v => ({ valore: v, etichetta: String(v) }))
}

// Un mucchio di gettoni da più specie insieme (bersaglio o distrattore),
// piazzati in un colpo solo così non si sovrappongono fra loro.
function costruisciGruppo(chiave, voci, rnd, area) {
  const piatti = []
  for (const { specie, quanti, bersaglio } of voci)
    for (let i = 0; i < quanti; i++) piatti.push({ specie, bersaglio })
  const pos = posizioni(piatti.length, rnd, area)
  return { chiave, gettoni: piatti.map((g, i) => ({ id: `${chiave}-${i}`, x: pos[i].x, y: pos[i].y, ...g })) }
}

const creaGettone = (gruppo, i, pos, specie, extra = {}) =>
  ({ id: `${gruppo}-${i}`, x: pos.x, y: pos.y, specie, bersaglio: true, ...extra })

function genQuanti(tappa, m, rnd, evita) {
  const n = interoIn(rnd, tappa.min, tappa.max)
  const [specie] = sceltaSpecie(m, 'qualunque', 1, rnd, [], evita)
  const pos = posizioni(n, rnd, AREA, { ordinate: tappa.disposizione === 'fila' })
  return {
    verbo: 'quanti', modo: 'cifre',
    consegna: VERBI.quanti.consegna({ specie }),
    nominate: [specie.chiave],
    gruppi: [{ chiave: 'unico', gettoni: pos.map((p, i) => creaGettone('unico', i, p, specie)) }],
    opzioni: opzioniNumeriche(n, rnd, { quante: interoIn(rnd, 3, 4) }),
    rispostaGiusta: n,
  }
}

function genPorta(tappa, m, rnd, evita) {
  const n = interoIn(rnd, tappa.min, tappa.max)
  const [specie] = sceltaSpecie(m, 'qualunque', 1, rnd, [], evita)
  // più gettoni di quanti servano: senza, «portamene tre» si vince
  // toccandoli tutti senza avere scelto niente
  const pos = posizioni(n + interoIn(rnd, 1, 3), rnd, AREA)
  return {
    verbo: 'porta', modo: 'porta',
    consegna: VERBI.porta.consegna({ specie, n }),
    nominate: [specie.chiave],
    gruppi: [{ chiave: 'unico', gettoni: pos.map((p, i) => creaGettone('unico', i, p, specie)) }],
    opzioni: null, rispostaGiusta: n, n,
  }
}

function genDipiu(tappa, m, rnd, evita) {
  const [specieA, specieB] = sceltaSpecie(m, 'animali', 2, rnd, [], evita)
  let a = interoIn(rnd, tappa.min, tappa.max)
  let b = interoIn(rnd, tappa.min, tappa.max)
  if (rnd() < 0.3) b = a   // «sono uguali» deve capitare davvero, non solo per caso raro
  const posA = posizioni(a, rnd, RECINTI.sinistra)
  const posB = posizioni(b, rnd, RECINTI.destra)
  return {
    verbo: 'dipiu', modo: 'confronto',
    consegna: VERBI.dipiu.consegna({ specieA, specieB }),
    nominate: [specieA.chiave, specieB.chiave],
    gruppi: [
      { chiave: 'sinistra', gettoni: posA.map((p, i) => creaGettone('sinistra', i, p, specieA)) },
      { chiave: 'destra',   gettoni: posB.map((p, i) => creaGettone('destra', i, p, specieB)) },
    ],
    opzioni: [
      { valore: 'sinistra', etichetta: specieA.tanti, icone: [specieA.emoji] },
      { valore: 'uguale',   etichetta: 'uguali',       icone: ['⚖️'] },
      { valore: 'destra',   etichetta: specieB.tanti,  icone: [specieB.emoji] },
    ],
    rispostaGiusta: a === b ? 'uguale' : a > b ? 'sinistra' : 'destra',
  }
}

// La conservazione del numero: due file di posizioni per gli stessi
// gettoni, «prima» e «dopo». Chi disegna anima il passaggio, ma il conto
// è deciso qui, una volta sola.
function genStessi(tappa, m, rnd, evita) {
  const n = interoIn(rnd, tappa.min, tappa.max)
  const [specie] = sceltaSpecie(m, 'qualunque', 1, rnd, [], evita)
  const fila = posizioni(n, rnd, AREA, { ordinate: true })
  const sparsa = posizioni(n, rnd, AREA, { ordinate: false })
  const gettoni = fila.map((p, i) => ({
    id: `unico-${i}`, x: p.x, y: p.y, xAlt: sparsa[i].x, yAlt: sparsa[i].y,
    specie, bersaglio: true,
  }))
  return {
    verbo: 'stessi', modo: 'cifre',
    consegna: VERBI.stessi.consegna({ specie }),
    nominate: [specie.chiave],
    gruppi: [{ chiave: 'unico', gettoni }],
    opzioni: opzioniNumeriche(n, rnd, { quante: interoIn(rnd, 3, 4) }),
    rispostaGiusta: n,
  }
}

function genQuantiDi(tappa, m, rnd, evita) {
  const [specie] = sceltaSpecie(m, 'animali', 1, rnd, [], evita)
  const n = interoIn(rnd, tappa.min, tappa.max)
  const distrSpecie = sceltaSpecie(m, 'qualunque', interoIn(rnd, 1, 2), rnd, [specie.chiave])
  const voci = [
    { specie, quanti: n, bersaglio: true },
    ...distrSpecie.map(ds => ({ specie: ds, quanti: interoIn(rnd, 1, 3), bersaglio: false })),
  ]
  return {
    verbo: 'quantiDi', modo: 'cifre',
    consegna: VERBI.quantiDi.consegna({ specie }),
    nominate: [specie.chiave],
    gruppi: [costruisciGruppo('unico', voci, rnd, AREA)],
    opzioni: opzioniNumeriche(n, rnd, { quante: interoIn(rnd, 3, 4) }),
    rispostaGiusta: n,
  }
}

function genInsieme(tappa, m, rnd, evita) {
  const [specieA, specieB] = sceltaSpecie(m, 'animali', 2, rnd, [], evita)
  const a = interoIn(rnd, tappa.min, tappa.max)
  const b = interoIn(rnd, tappa.min, tappa.max)
  const distrSpecie = sceltaSpecie(m, 'cose', interoIn(rnd, 1, 2), rnd)
  const voci = [
    { specie: specieA, quanti: a, bersaglio: true },
    { specie: specieB, quanti: b, bersaglio: true },
    ...distrSpecie.map(ds => ({ specie: ds, quanti: interoIn(rnd, 1, 3), bersaglio: false })),
  ]
  return {
    verbo: 'insieme', modo: 'cifre',
    consegna: VERBI.insieme.consegna(),
    // la consegna non nomina nessuna specie ma in scena si vedono, e due
    // schermate uguali di fila stancano come due domande uguali di fila
    nominate: [specieA.chiave, specieB.chiave],
    gruppi: [costruisciGruppo('unico', voci, rnd, AREA)],
    opzioni: opzioniNumeriche(a + b, rnd, { quante: interoIn(rnd, 3, 4) }),
    rispostaGiusta: a + b,
  }
}

function genInclusione(tappa, m, rnd, evita) {
  // due pescate invece di una: la specie nominata deve poter cambiare
  // indipendentemente dalla compagna, vedi docs/conta/domande.md
  const [specie] = sceltaSpecie(m, 'animali', 1, rnd, [], evita)
  const [altraSpecie] = sceltaSpecie(m, 'animali', 1, rnd, [specie.chiave], evita)
  const target = interoIn(rnd, tappa.min, tappa.max)
  const altro = interoIn(rnd, Math.max(1, tappa.min), tappa.max)
  const distrSpecie = rnd() < 0.6 ? sceltaSpecie(m, 'cose', interoIn(rnd, 1, 2), rnd) : []
  const voci = [
    { specie, quanti: target, bersaglio: true },
    { specie: altraSpecie, quanti: altro, bersaglio: true },
    ...distrSpecie.map(ds => ({ specie: ds, quanti: interoIn(rnd, 1, 3), bersaglio: false })),
  ]
  return {
    verbo: 'inclusione', modo: 'inclusione',
    consegna: VERBI.inclusione.consegna({ specie }),
    nominate: [specie.chiave],
    gruppi: [costruisciGruppo('unico', voci, rnd, AREA)],
    opzioni: mescola([
      { valore: 'sottoinsieme', etichetta: specie.tanti, icone: [specie.emoji] },
      { valore: 'insieme',      etichetta: 'animali',    icone: ['🐾'] },
    ], rnd),
    rispostaGiusta: 'insieme',
  }
}

function genPiuUno(tappa, m, rnd, evita) {
  const [specie] = sceltaSpecie(m, 'qualunque', 1, rnd, [], evita)
  const iniziale = interoIn(rnd, Math.max(1, tappa.min), tappa.max)
  const direzione = rnd() < 0.5 ? 'arriva' : 'scappa'
  const totale = direzione === 'arriva' ? iniziale + 1 : iniziale
  const pos = posizioni(totale, rnd, AREA)
  const gettoni = pos.map((p, i) => creaGettone('unico', i, p, specie,
    direzione === 'arriva' && i === totale - 1 ? { nuovo: true } : {}))
  if (direzione === 'scappa') gettoni[Math.floor(rnd() * gettoni.length)].via = true
  const rispostaGiusta = direzione === 'arriva' ? iniziale + 1 : iniziale - 1
  return {
    verbo: 'piuUno', modo: 'cifre',
    consegna: VERBI.piuUno.consegna({ specie, direzione }),
    nominate: [specie.chiave],
    gruppi: [{ chiave: 'unico', gettoni }],
    opzioni: opzioniNumeriche(rispostaGiusta, rnd, { quante: interoIn(rnd, 3, 4) }),
    rispostaGiusta, direzione,
  }
}

function genUnisci(tappa, m, rnd, evita) {
  const [specieA, specieB] = sceltaSpecie(m, 'qualunque', 2, rnd, [], evita)
  const a = interoIn(rnd, tappa.min, tappa.max)
  const b = interoIn(rnd, tappa.min, tappa.max)
  const posA = posizioni(a, rnd, RECINTI.sinistra)
  const posB = posizioni(b, rnd, RECINTI.destra)
  return {
    verbo: 'unisci', modo: 'cifre',
    consegna: VERBI.unisci.consegna({ specieA, specieB }),
    nominate: [specieA.chiave, specieB.chiave],
    gruppi: [
      { chiave: 'sinistra', gettoni: posA.map((p, i) => creaGettone('sinistra', i, p, specieA)) },
      { chiave: 'destra',   gettoni: posB.map((p, i) => creaGettone('destra', i, p, specieB)) },
    ],
    opzioni: opzioniNumeriche(a + b, rnd, { quante: interoIn(rnd, 3, 4) }),
    rispostaGiusta: a + b,
  }
}

const GENERATORI = {
  quanti: genQuanti, porta: genPorta, dipiu: genDipiu, stessi: genStessi,
  quantiDi: genQuantiDi, insieme: genInsieme, inclusione: genInclusione,
  piuUno: genPiuUno, unisci: genUnisci,
}

// Quale verbo tocca adesso: una tappa ne ha uno, ma se dichiara `alterna`
// dopo il verbo della tappa arriva sempre uno degli altri, mai due volte
// di fila lo stesso — vedi docs/conta/regole.md.
function verboDellaDomanda(tappa, precedente, rnd) {
  const alterna = tappa.alterna || []
  if (!alterna.length || !precedente || precedente.verbo !== tappa.verbo) return tappa.verbo
  return alterna[Math.floor(rnd() * alterna.length)]
}

// Il punto d'ingresso: una tappa, il caso, e una domanda pronta per lo
// schermo. `precedente` è la domanda appena giocata (può mancare, la
// prima di una tappa non ha un prima): serve solo a non ripetersi.
export function generaDomanda(tappa, rnd = Math.random, precedente = null) {
  const chiave = verboDellaDomanda(tappa, precedente, rnd)
  const gen = GENERATORI[chiave]
  if (!gen) throw new Error(`conta: nessun generatore per il verbo "${chiave}"`)
  const d = gen(tappa, mondo(tappa.mondo), rnd, precedente?.recenti || [])
  // la memoria che passa alla prossima domanda: le sue specie in testa,
  // poi quelle di prima — l'ordine conta, non la lunghezza
  d.recenti = [...new Set([...d.nominate, ...(precedente?.recenti || [])])].slice(0, 4)
  return d
}

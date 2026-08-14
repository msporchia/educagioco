/* ═══════════════════════════════════════════════════════════════════
   LA SCENA — da una tappa a una domanda

   Funzioni pure, senza schermo: girano uguale nel browser e in Node.
   Il caso si passa da fuori (`rnd`), come nel Codice Segreto — è quello
   che permette al banco di prova di giocare mille tappe e dire se sono
   giuste, e a un test di rifare la stessa domanda due volte.

   Una domanda, per qualunque verbo, ha sempre questa forma:

     { verbo, modo, consegna: { icone, frase }, gruppi, opzioni,
       rispostaGiusta }

     modo     come si risponde (lo dichiara il verbo, vedi `dati/verbi.js`)
     gruppi   [{ chiave, gettoni }] — uno per i verbi con un mucchio solo,
              due (sinistra/destra) per quelli con due recinti affiancati
     gettoni  [{ id, x, y, specie, bersaglio }] — `x`/`y` sono percentuali
              dell'area di gioco, non pixel: chi disegna li usa così come
              sono. `bersaglio: false` è un distrattore: sta in scena ma
              non conta nella risposta.
     opzioni  le cifre (o le due/tre scelte) fra cui si sceglie — assente
              nel modo «porta», dove la risposta è quanti gettoni si sono
              toccati.

   LE POSIZIONI. Il motore piazza i gettoni su una griglia con celle
   larghe almeno `MIN_DIST`, poi aggiunge un tremolio piccolo quanto
   basta a non farli sembrare un quadernone a quadretti — ma mai tanto
   da fare toccare due celle vicine. È una griglia matematicamente
   sicura (nessuna sovrapposizione), non un tentativo che a volte
   fallisce: chi ha già provato posizioni a caso finché non si toccano
   sa quanto è lento e quanto prima o poi fallisce comunque. «In fila»
   è la stessa griglia senza rimescolare le celle: si riempie in ordine
   di lettura, non a caso — è quello che la rende leggibile come «uno
   dopo l'altro» invece che come uno sparpaglio con meno buchi.
   ═══════════════════════════════════════════════════════════════════ */
import { mondo, specieDi } from '../dati/mondi.js'
import { VERBI } from '../dati/verbi.js'

export const MIN_DIST = 16   // percento dell'area: un gettone grosso non ne tocca un altro

const AREA = { xMin: 6, xMax: 94, yMin: 10, yMax: 90 }
const RECINTI = {
  sinistra: { xMin: 6, xMax: 46, yMin: 10, yMax: 90 },
  destra:   { xMin: 54, xMax: 94, yMin: 10, yMax: 90 },
}

/* ═══════════ le basi: caso, griglia, scelte ═══════════ */

function mescola(lista, rnd) {
  const a = lista.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const interoIn = (rnd, min, max) => (max < min ? min : min + Math.floor(rnd() * (max - min + 1)))

/* La griglia sicura. `ordinate` sceglie fra due letture della stessa
   idea: la fila (celle in ordine, riga più corta possibile) e lo
   sparpaglio (celle mescolate, il più possibile quadrate). */
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
  /* il tremolio non può mai valere più della metà dello spazio che
     avanza in una cella, o due gettoni di celle vicine si toccherebbero */
  const jitterX = ordinate ? 0 : Math.max(0, (cellW - MIN_DIST) / 2)
  const jitterY = ordinate ? 0 : Math.max(0, (cellH - MIN_DIST) / 2)
  return scelte.map(({ r, c }) => ({
    x: area.xMin + cellW * (c + 0.5) + (rnd() * 2 - 1) * jitterX,
    y: area.yMin + cellH * (r + 0.5) + (rnd() * 2 - 1) * jitterY,
  }))
}

function sceltaSpecie(m, categoria, quante, rnd, escludi = []) {
  const pool = specieDi(m, categoria).filter(s => !escludi.includes(s.chiave))
  if (pool.length < quante)
    throw new Error(`conta: il mondo "${m.chiave}" non ha ${quante} specie "${categoria}" (ne ha ${pool.length})`)
  return mescola(pool, rnd).slice(0, quante)
}

/* Le cifre fra cui si sceglie: sempre quella giusta, mai un doppione,
   vicine al valore vero — un 40 fra le opzioni di un 3 non mette alla
   prova il conteggio, mette alla prova l'indovinare. */
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

/* Un mucchio di gettoni da più specie insieme (bersaglio o distrattore):
   li costruisce e li piazza in un colpo solo, così non si sovrappongono
   fra loro anche se appartengono a specie diverse. */
function costruisciGruppo(chiave, voci, rnd, area) {
  const piatti = []
  for (const { specie, quanti, bersaglio } of voci)
    for (let i = 0; i < quanti; i++) piatti.push({ specie, bersaglio })
  const pos = posizioni(piatti.length, rnd, area)
  return { chiave, gettoni: piatti.map((g, i) => ({ id: `${chiave}-${i}`, x: pos[i].x, y: pos[i].y, ...g })) }
}

const creaGettone = (gruppo, i, pos, specie, extra = {}) =>
  ({ id: `${gruppo}-${i}`, x: pos.x, y: pos.y, specie, bersaglio: true, ...extra })

/* ═══════════ un generatore per verbo ═══════════ */

function genQuanti(tappa, m, rnd) {
  const n = interoIn(rnd, tappa.min, tappa.max)
  const [specie] = sceltaSpecie(m, 'qualunque', 1, rnd)
  const pos = posizioni(n, rnd, AREA, { ordinate: tappa.disposizione === 'fila' })
  return {
    verbo: 'quanti', modo: 'cifre',
    consegna: VERBI.quanti.consegna({ specie }),
    gruppi: [{ chiave: 'unico', gettoni: pos.map((p, i) => creaGettone('unico', i, p, specie)) }],
    opzioni: opzioniNumeriche(n, rnd, { quante: interoIn(rnd, 3, 4) }),
    rispostaGiusta: n,
  }
}

function genPorta(tappa, m, rnd) {
  const n = interoIn(rnd, tappa.min, tappa.max)
  const [specie] = sceltaSpecie(m, 'qualunque', 1, rnd)
  /* più gettoni di quanti servano: senza, «portamene tre» si vince
     toccandoli tutti senza avere scelto niente */
  const pos = posizioni(n + interoIn(rnd, 1, 3), rnd, AREA)
  return {
    verbo: 'porta', modo: 'porta',
    consegna: VERBI.porta.consegna({ specie, n }),
    gruppi: [{ chiave: 'unico', gettoni: pos.map((p, i) => creaGettone('unico', i, p, specie)) }],
    opzioni: null, rispostaGiusta: n, n,
  }
}

function genDipiu(tappa, m, rnd) {
  const [specieA, specieB] = sceltaSpecie(m, 'animali', 2, rnd)
  let a = interoIn(rnd, tappa.min, tappa.max)
  let b = interoIn(rnd, tappa.min, tappa.max)
  if (rnd() < 0.3) b = a   // «sono uguali» deve capitare davvero, non solo per caso raro
  const posA = posizioni(a, rnd, RECINTI.sinistra)
  const posB = posizioni(b, rnd, RECINTI.destra)
  return {
    verbo: 'dipiu', modo: 'confronto',
    consegna: VERBI.dipiu.consegna({ specieA, specieB }),
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

/* la conservazione del numero: due file di posizioni per gli stessi
   gettoni, «prima» e «dopo». Chi disegna anima il passaggio, ma il
   conto — quello che conta — è deciso qui, una volta sola. */
function genStessi(tappa, m, rnd) {
  const n = interoIn(rnd, tappa.min, tappa.max)
  const [specie] = sceltaSpecie(m, 'qualunque', 1, rnd)
  const fila = posizioni(n, rnd, AREA, { ordinate: true })
  const sparsa = posizioni(n, rnd, AREA, { ordinate: false })
  const gettoni = fila.map((p, i) => ({
    id: `unico-${i}`, x: p.x, y: p.y, xAlt: sparsa[i].x, yAlt: sparsa[i].y,
    specie, bersaglio: true,
  }))
  return {
    verbo: 'stessi', modo: 'cifre',
    consegna: VERBI.stessi.consegna({ specie }),
    gruppi: [{ chiave: 'unico', gettoni }],
    opzioni: opzioniNumeriche(n, rnd, { quante: interoIn(rnd, 3, 4) }),
    rispostaGiusta: n,
  }
}

function genQuantiDi(tappa, m, rnd) {
  const [specie] = sceltaSpecie(m, 'animali', 1, rnd)
  const n = interoIn(rnd, tappa.min, tappa.max)
  const distrSpecie = sceltaSpecie(m, 'qualunque', interoIn(rnd, 1, 2), rnd, [specie.chiave])
  const voci = [
    { specie, quanti: n, bersaglio: true },
    ...distrSpecie.map(ds => ({ specie: ds, quanti: interoIn(rnd, 1, 3), bersaglio: false })),
  ]
  return {
    verbo: 'quantiDi', modo: 'cifre',
    consegna: VERBI.quantiDi.consegna({ specie }),
    gruppi: [costruisciGruppo('unico', voci, rnd, AREA)],
    opzioni: opzioniNumeriche(n, rnd, { quante: interoIn(rnd, 3, 4) }),
    rispostaGiusta: n,
  }
}

function genInsieme(tappa, m, rnd) {
  const [specieA, specieB] = sceltaSpecie(m, 'animali', 2, rnd)
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
    gruppi: [costruisciGruppo('unico', voci, rnd, AREA)],
    opzioni: opzioniNumeriche(a + b, rnd, { quante: interoIn(rnd, 3, 4) }),
    rispostaGiusta: a + b,
  }
}

/* l'inclusione di classe: `altro` non è mai zero, o la specie bersaglio
   varrebbe quanto «animali» e la domanda non avrebbe una risposta giusta */
function genInclusione(tappa, m, rnd) {
  const [specie, altraSpecie] = sceltaSpecie(m, 'animali', 2, rnd)
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
    gruppi: [costruisciGruppo('unico', voci, rnd, AREA)],
    opzioni: [
      { valore: 'sottoinsieme', etichetta: specie.tanti, icone: [specie.emoji] },
      { valore: 'insieme',      etichetta: 'animali',    icone: ['🐾'] },
    ],
    rispostaGiusta: 'insieme',
  }
}

/* successore/predecessore: si genera un gettone in più (che «arriva») o
   se ne segna uno da far sparire (che «scappa») — l'animazione la fa la
   vista, qui ci sono solo i fatti già decisi */
function genPiuUno(tappa, m, rnd) {
  const [specie] = sceltaSpecie(m, 'qualunque', 1, rnd)
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
    gruppi: [{ chiave: 'unico', gettoni }],
    opzioni: opzioniNumeriche(rispostaGiusta, rnd, { quante: interoIn(rnd, 3, 4) }),
    rispostaGiusta, direzione,
  }
}

function genUnisci(tappa, m, rnd) {
  const [specieA, specieB] = sceltaSpecie(m, 'qualunque', 2, rnd)
  const a = interoIn(rnd, tappa.min, tappa.max)
  const b = interoIn(rnd, tappa.min, tappa.max)
  const posA = posizioni(a, rnd, RECINTI.sinistra)
  const posB = posizioni(b, rnd, RECINTI.destra)
  return {
    verbo: 'unisci', modo: 'cifre',
    consegna: VERBI.unisci.consegna({ specieA, specieB }),
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

/* Il punto d'ingresso: una tappa della campagna, il caso, e fuori esce
   una domanda pronta per lo schermo. */
export function generaDomanda(tappa, rnd = Math.random) {
  const gen = GENERATORI[tappa.verbo]
  if (!gen) throw new Error(`conta: nessun generatore per il verbo "${tappa.verbo}"`)
  return gen(tappa, mondo(tappa.mondo), rnd)
}

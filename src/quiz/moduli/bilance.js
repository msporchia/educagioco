// l'algebra prima dell'algebra: un'uguaglianza è una bilancia in pari, e tutta l'algebra sta in "quello che fai da una parte lo fai dall'altra". Sta in alto apposta: il numero nascosto (□+7=15) è di seconda-terza, tutto il resto (dividere in parti uguali, togliere da entrambi i piatti, scambiare) è di quarta-quinta, le due incognite sono l'ultimo gradino prima di "equazione". Si ragiona, non si ricorda: nessuna risposta è scritta da qualche parte, ci si arriva con un conto o due, numeri piccoli a mente. I falsi sono gli errori veri: fare l'operazione che si vede invece di disfarla, fermarsi a metà, guardare una sola bilancia quando sono due, "non si può sapere" quando invece si toglie la cosa comune, la risposta vicina di uno con perché che rifà la prova (mai due vicini insieme, o quella in mezzo si indovina). Ogni scena nasce dalla risposta ed è un sistema con una sola soluzione: `unaSola` lo ricontrolla, e se non torna la domanda non parte.
import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo, scena } from '../nucleo/domanda.js'
import { PITTORI_BILANCE } from '../grafica/pittori/bilance.js'

// tre famiglie per la varietà; `f` è il genere (serve agli articoli); `taglia` serve solo allo SCAMBIO (si prende dalla più grossa alla più piccola: «una fragola pesa come tre angurie» fa solo ridere)
const FAMIGLIE = [
  [
    { e: '🍉', f: true, taglia: 9 }, { e: '🍍', f: false, taglia: 7 },
    { e: '🥥', f: false, taglia: 6 }, { e: '🍎', f: true, taglia: 4 },
    { e: '🍐', f: true, taglia: 4 }, { e: '🍊', f: true, taglia: 4 },
    { e: '🍋', f: false, taglia: 3 }, { e: '🍑', f: true, taglia: 3 },
    { e: '🥝', f: false, taglia: 2 }, { e: '🍓', f: true, taglia: 1 },
  ],
  [
    { e: '🐷', f: false, taglia: 9 }, { e: '🐶', f: false, taglia: 7 },
    { e: '🐱', f: false, taglia: 5 }, { e: '🐰', f: false, taglia: 4 },
    { e: '🐔', f: true, taglia: 3 }, { e: '🐹', f: false, taglia: 2 },
    { e: '🐥', f: false, taglia: 1 },
  ],
  [
    { e: '🍆', f: true, taglia: 6 }, { e: '🌽', f: true, taglia: 5 },
    { e: '🥦', f: false, taglia: 4 }, { e: '🥔', f: true, taglia: 3 },
    { e: '🧅', f: true, taglia: 3 }, { e: '🥕', f: true, taglia: 2 },
  ],
]
const TUTTE = FAMIGLIE.flat()

const un = c => (c.f ? 'una' : 'un')
const Un = c => (c.f ? 'Una' : 'Un')
const quanti = c => (c.f ? 'Quante' : 'Quanti')
const solo = c => (c.f ? 'sola' : 'solo')
const suoi = c => (c.f ? 'le sue' : 'i suoi')

function dueCose(sorte) {
  const [x, y] = sorte.alcuni(TUTTE, 2)
  return [x, y]
}

// piccola prima: se la bilancia dice che una pesa più dell'altra, deve essere quella più grossa (o fa ridere guardandola)
function piccolaEGrossa(sorte) {
  for (;;) {
    const [x, y] = sorte.alcuni(TUTTE, 2)
    if (x.taglia !== y.taglia) return x.taglia < y.taglia ? [x, y] : [y, x]
  }
}

// tre cose della stessa famiglia, dalla più grossa alla più piccola, tutte di taglia diversa: la catena dello scambio
function catena(sorte) {
  for (;;) {
    const fam = sorte.uno(FAMIGLIE)
    const tre = sorte.alcuni(fam, 3).sort((a, b) => b.taglia - a.taglia)
    if (tre[0].taglia > tre[1].taglia && tre[1].taglia > tre[2].taglia) return tre
  }
}

const cose = (c, n) => ({ e: c.e, n })
const pesi = (...quanti) => quanti.map(q => ({ peso: q }))

// un peso in uno-tre pezzi, nessuno più piccolo di 2: con due pesi si deve anche sommare, un gradino in più
function spezza(totale, quanti, sorte) {
  if (quanti <= 1 || totale < 2 * quanti + 2) return [totale]
  const parti = []
  let resto = totale
  for (let i = quanti; i > 1; i--) {
    const q = sorte.fra(2, resto - 2 * (i - 1))
    parti.push(q)
    resto -= q
  }
  parti.push(resto)
  return parti.sort((a, b) => b - a)
}

// il piatto con le cose e quello coi pesi non stanno sempre dalla stessa parte: chi ha imparato «a sinistra» deve rileggere
const giraSe = (gira, b) => (gira ? { sx: b.dx, dx: b.sx } : b)

// { v, perche }: si tengono quelli diversi dalla buona e fra loro, interi e positivi, nell'ordine di importanza fino a `quanti`
function falsi(buona, candidati, quanti = 3) {
  const visti = new Set([String(buona)])
  const out = []
  for (const c of candidati) {
    if (!c) continue
    const ok = typeof c.v === 'string' || (Number.isInteger(c.v) && c.v > 0)
    if (!ok || visti.has(String(c.v))) continue
    // mai due vicini di uno per parte, o la buona starebbe in mezzo — anche se il secondo arriva da un errore vero
    if (typeof c.v === 'number' && Math.abs(c.v - buona) === 1 && visti.has(String(2 * buona - c.v))) continue
    visti.add(String(c.v))
    out.push(testo(c.v, c.perche))
    if (out.length >= quanti) break
  }
  return out
}

// il vicino di uno, da una parte sola: `prova` dice perché quel numero non torna, rifacendo il conto con lui
const vicino = (v, sorte, prova) => {
  const w = v <= 2 || sorte.forse(0.5) ? v + 1 : v - 1
  return { v: w, perche: prova(w) }
}

const intero = (a, b) => (b && a % b === 0 ? a / b : null)
const NON_SI_SA = 'Non si può sapere'

// righe: elenco di { x, y, k } che vuol dire x·A + y·B = k (B assente con un'incognita sola). Si controlla anche che la soluzione trovata sia quella promessa: così si scopre una bilancia costruita storta, che a schermo sembrerebbe normale.
function unaSola(righe, attese) {
  if (righe.length === 1) {
    const [{ x, k }] = righe
    return x !== 0 && k / x === attese[0]
  }
  const [r1, r2] = righe
  const det = r1.x * r2.y - r2.x * r1.y
  if (det === 0) return false
  const a = (r1.k * r2.y - r2.k * r1.y) / det
  const b = (r1.x * r2.k - r2.x * r1.k) / det
  return a === attese[0] && b === attese[1]
}

function controllata(righe, attese) {
  if (!unaSola(righe, attese))
    throw new Error(`bilancia senza una soluzione sola: ${JSON.stringify(righe)} → ${attese}`)
}

// un'incognita sola e coefficiente uno: soluzione unica per forza, quello che si può sbagliare è la scritta
function regge(forma, x, a, b) {
  const vale = { 'x+a': x + a, 'a+x': a + x, 'x-a': x - a, 'a-x': a - x }[forma]
  if (vale !== b) throw new Error(`il numero nascosto non torna: ${forma} con x=${x}, a=${a}, b=${b}`)
}

const SCALETTA = [
  'il numero nascosto nei più e nei meno, fino a venti',
  'il numero nascosto fino a cento, e nelle tabelline',
  'quanto pesa uno, e togliere dai due piatti',
  'togliere dai due piatti, e scambiare',
  'scambi lunghi, e due cose da pesare',
]

// tutte sotto `bilance` (pezzo di scuola nuovo: un genitore le toglie tutte insieme); quelle con divisione/tabellina lo dichiarano in più. Livelli sulla scala comune: 44-50 il numero nascosto nei più/meno (seconda-terza), 56-63 nelle tabelline (fine terza-inizio quarta), 63-69 quanto pesa uno, 69-75 togliere dai due piatti (la mossa vera dell'algebra), 75-81 lo scambio (quinta), 88 le due incognite (in cima, dove finisce il programma della primaria)
const TIPI = [
  { chiave: 'bil:nascosto', nome: 'Il numero nascosto nei più e nei meno (□ + 7 = 15)',
    sa: 'bilance', livello: { 1: 44, 2: 50 }, gradi: { 1: 1, 2: 0.5 } },
  { chiave: 'bil:nascosto-per', nome: 'Il numero nascosto nelle tabelline (□ × 6 = 42)',
    sa: ['moltiplicazioni', 'bilance', 'divisioni'], livello: { 2: 56, 3: 63 }, gradi: { 2: 0.5, 3: 0.25 } },
  { chiave: 'bil:uno', nome: 'Quanto pesa uno, sulla bilancia in pari',
    sa: ['bilance', 'divisioni'], livello: { 3: 63, 4: 69 }, gradi: { 3: 0.45, 4: 0.25 } },
  { chiave: 'bil:togli', nome: 'Togliere la stessa cosa dai due piatti',
    sa: ['bilance', 'divisioni'], livello: { 3: 69, 4: 75 }, gradi: { 3: 0.3, 4: 0.4 } },
  { chiave: 'bil:scambia', nome: 'Una cosa pesa come tante altre: lo scambio',
    sa: ['moltiplicazioni', 'bilance'], livello: { 4: 75, 5: 81 }, gradi: { 4: 0.35, 5: 0.45 } },
  { chiave: 'bil:due', nome: 'Due cose da pesare, con due bilance',
    sa: ['bilance', 'divisioni'], livello: 88, gradi: { 5: 0.55 } },
]

const COME_BILANCIA = 'Come una bilancia: quello che fai da una parte lo fai dall\'altra.'
const IN_PARI = ['La bilancia è in pari.', 'I due piatti pesano uguale.']

class Bilance extends Modulo {
  constructor() {
    super({
      id: 'bilance',
      nome: 'Le bilance',
      icona: '⚖️',
      materia: 'matematica',
      chiaro: 'trovare quanto pesa quello che non si sa, tenendo la bilancia in pari',
      scaletta: SCALETTA,
      livelli: [44, 53, 65, 73, 85], // conta poco: ogni tipologia dichiara il suo (vedi TIPI), qui è solo la media di quello che un grado mescola
      tipi: TIPI,
      pittori: PITTORI_BILANCE,
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'bil:nascosto-per': return this.nascostoPer(grado, sorte)
      case 'bil:uno': return this.uno(grado, sorte)
      case 'bil:togli': return this.togli(grado, sorte)
      case 'bil:scambia': return this.scambia(grado, sorte)
      case 'bil:due': return this.due(sorte)
      default: return this.nascosto(grado, sorte)
    }
  }

  // senza bilancia, come sul quaderno. Quattro forme non costano uguale: 30-□=12 è la difficile (il □ è quello che si toglie, l'istinto di sommare è fortissimo) e arriva solo dal grado 2
  nascosto(grado, sorte) {
    const forma = sorte.uno(grado <= 1 ? ['x+a', 'a+x', 'x-a'] : ['x+a', 'a+x', 'x-a', 'a-x', 'a-x'])
    const tetto = grado <= 1 ? 20 : 100
    const piccolo = grado <= 1 ? 2 : 6
    let x, a, b, scritto, aiuto, cand
    if (forma === 'x+a' || forma === 'a+x') {
      b = sorte.fra(piccolo * 2 + 1, tetto)
      a = sorte.fra(piccolo, b - piccolo)
      x = b - a
      scritto = forma === 'x+a' ? `□ + ${a} = ${b}` : `${a} + □ = ${b}`
      aiuto = `${COME_BILANCIA} Togli ${a} da tutte e due le parti: □ = ${b} − ${a} = ${x}`
      cand = [
        { v: b + a, perche: `hai fatto ${b} + ${a}: ma ${a} è già dentro ${b}, e va tolto` },
        grado > 1 && senzaPrestito(b, a) !== x
          ? { v: senzaPrestito(b, a), perche: `in ${b} − ${a} le unità non bastano: serve il prestito dalle decine` }
          : null,
        vicino(x, sorte, w => `prova: ${forma === 'x+a' ? `${w} + ${a}` : `${a} + ${w}`} fa ${w + a}, non ${b}`),
        { v: a, perche: `${a} c'era già: cerca il numero che, insieme a ${a}, fa ${b}` },
        { v: b, perche: `${b} è il totale: □ è il pezzo che manca per arrivarci` },
      ]
    } else if (forma === 'x-a') {
      x = sorte.fra(piccolo * 2 + 2, tetto)
      a = sorte.fra(piccolo, x - piccolo)
      b = x - a
      scritto = `□ − ${a} = ${b}`
      aiuto = `${COME_BILANCIA} Aggiungi ${a} a tutte e due le parti: □ = ${b} + ${a} = ${x}`
      cand = [
        { v: b - a, perche: `hai tolto ancora: ma se da □ togli ${a} restano ${b}, quindi □ è più grande di ${b}` },
        vicino(x, sorte, w => `prova: ${w} − ${a} fa ${w - a}, non ${b}`),
        { v: b, perche: `${b} è quello che resta dopo aver tolto ${a}: □ è più grande` },
        { v: a, perche: `${a} è quello che si toglie: □ è il numero da cui si parte` },
      ]
    } else {
      a = sorte.fra(piccolo * 2 + 2, tetto)
      x = sorte.fra(piccolo, a - piccolo)
      b = a - x
      scritto = `${a} − □ = ${b}`
      aiuto = `${COME_BILANCIA} Aggiungi □ a tutte e due le parti: ${a} = ${b} + □, quindi □ = ${a} − ${b} = ${x}`
      cand = [
        { v: a + b, perche: `hai sommato: ma da ${a} si toglie □, quindi □ è più piccolo di ${a}` },
        senzaPrestito(a, b) !== x
          ? { v: senzaPrestito(a, b), perche: `in ${a} − ${b} le unità non bastano: serve il prestito dalle decine` }
          : null,
        vicino(x, sorte, w => `prova: ${a} − ${w} fa ${a - w}, non ${b}`),
        { v: b, perche: `${b} è quello che resta, non quello che hai tolto` },
      ]
    }
    regge(forma, x, a, b)
    return domanda({
      testo: sorte.uno(['Che numero c\'è nel quadratino?', 'Che numero si nasconde nel □?',
        'Quale numero va al posto del □?']),
      soggetto: { testo: scritto },
      buona: testo(x),
      falsi: falsi(x, cand),
      chiave: 'bil:nascosto',
      aiuto,
      sorte,
    })
  }

  // □×6=42 è la divisione vista dall'altra parte («quante volte il 6 sta nel 42»); le forme col diviso arrivano al grado 3
  nascostoPer(grado, sorte) {
    const forma = sorte.uno(grado <= 2 ? ['x*a', 'a*x'] : ['x*a', 'a*x', 'x:a', 'a:x'])
    let x, scritto, aiuto, cand
    if (forma === 'x*a' || forma === 'a*x') {
      x = sorte.fra(2, 10)
      const a = sorte.fra(2, 10)
      const b = x * a
      scritto = forma === 'x*a' ? `□ × ${a} = ${b}` : `${a} × □ = ${b}`
      aiuto = `${COME_BILANCIA} Dividi tutte e due le parti per ${a}: □ = ${b} : ${a} = ${x}`
      cand = [
        { v: b - a, perche: `hai tolto ${a}: ma «× ${a}» vuol dire ${a} volte, e si disfa dividendo` },
        vicino(x, sorte, w => `prova: ${forma === 'x*a' ? `${w} × ${a}` : `${a} × ${w}`} fa ${w * a}, non ${b}`),
        { v: a, perche: `${a} c'era già: cerca il numero che, per ${a}, fa ${b}` },
        { v: b + a, perche: `hai aggiunto ${a}: ma «× ${a}» vuol dire ${a} volte, e si disfa dividendo` },
      ]
    } else if (forma === 'x:a') {
      const a = sorte.fra(2, 9)
      const c = sorte.fra(2, 10)
      x = a * c
      scritto = `□ : ${a} = ${c}`
      aiuto = `${COME_BILANCIA} Moltiplica tutte e due le parti per ${a}: □ = ${c} × ${a} = ${x}`
      cand = [
        { v: c + a, perche: `hai sommato: ma «: ${a}» vuol dire diviso in ${a} parti, e si disfa moltiplicando` },
        vicino(c, sorte, w => `prova: ${w * a} : ${a} fa ${w}, non ${c}`),
        { v: c, perche: `${c} è quello che viene dopo aver diviso: □ è più grande` },
        { v: c - a, perche: `hai tolto: ma «: ${a}» si disfa moltiplicando per ${a}` },
      ]
      // il vicino qui è una tacca della tabellina, non un'unità: 34:4 non si fa, 36±1 si scarterebbe senza pensare
      cand[1] = { v: cand[1].v * a, perche: cand[1].perche }
    } else {
      x = sorte.fra(2, 9)
      const c = sorte.fra(2, 10)
      const a = x * c
      scritto = `${a} : □ = ${c}`
      aiuto = `${COME_BILANCIA} Moltiplica tutte e due le parti per □: ${a} = ${c} × □, quindi □ = ${a} : ${c} = ${x}`
      cand = [
        { v: a * c, perche: `hai moltiplicato: ma ${a} diviso □ fa ${c}, quindi □ è più piccolo di ${a}` },
        { v: a - c, perche: `hai tolto ${c}: ma diviso non vuol dire meno` },
        vicino(x, sorte, w => `prova: ${c} × ${w} fa ${c * w}, non ${a}`),
      ]
    }
    return domanda({
      testo: sorte.uno(['Che numero c\'è nel quadratino?', 'Che numero si nasconde nel □?',
        'Quale numero va al posto del □?']),
      soggetto: { testo: scritto },
      buona: testo(x),
      falsi: falsi(x, cand),
      chiave: 'bil:nascosto-per',
      aiuto,
      sorte,
    })
  }

  // un piatto con cose uguali, l'altro con pesi: «in pari» vuol dire uguale, il resto è dividere in parti uguali
  uno(grado, sorte) {
    const c = sorte.uno(TUTTE)
    const k = sorte.fra(2, grado <= 3 ? 4 : 5)
    const v = sorte.fra(grado <= 3 ? 2 : 3, grado <= 3 ? 9 : 12)
    const N = k * v
    if (sorte.forse(0.3)) return this.qualePeso(grado, c, k, v, sorte)
    const quantiPesi = grado <= 3 ? sorte.fra(1, 2) : sorte.fra(2, 3)
    const ps = spezza(N, quantiPesi, sorte)
    controllata([{ x: k, k: N }], [v])
    const somma = ps.length > 1 ? `I pesi fanno ${ps.join(' + ')} = ${N}. ` : ''
    return domanda({
      testo: `${sorte.uno(IN_PARI)} Quanto pesa ${un(c)} ${c.e}?`,
      soggetto: scena({ che: 'bilance', bilance: [giraSe(sorte.forse(0.4), { sx: [cose(c, k)], dx: pesi(...ps) })] }),
      buona: testo(v),
      falsi: falsi(v, [
        { v: N - k, perche: `hai fatto ${N} − ${k}: ma ${k} dice quante cose ci sono sul piatto, non quanto pesano` },
        { v: N, perche: `${N} è il peso di ${k} ${c.e} insieme, non di ${un(c)} ${c.e} ${solo(c)}` },
        vicino(v, sorte, w => `prova: ${k} ${c.e} da ${w} pesano ${k * w}, non ${N}`),
      ]),
      chiave: 'bil:uno',
      aiuto: `${somma}In pari vuol dire che ${k} ${c.e} insieme pesano ${N}: dividi in ${k} parti uguali, ${N} : ${k} = ${v}`,
      sorte,
    })
  }

  // la stessa bilancia girata: quanto pesa una cosa si sa, manca il peso che la mette in pari («?»); serve a non far diventare «quanto pesa uno» un riflesso invece di un ragionamento
  qualePeso(grado, c, k, v, sorte) {
    const N = k * v
    const a = grado >= 4 && sorte.forse(0.5) ? sorte.fra(2, Math.min(9, N - 2)) : 0
    const giusto = N - a
    controllata([{ x: 1, k: N - a }], [giusto])
    const dove = a ? [{ peso: '?' }, ...pesi(a)] : [{ peso: '?' }]
    return domanda({
      testo: `Ogni ${c.e} pesa ${v}. Che numero va sul peso col «?» perché la bilancia sia in pari?`,
      soggetto: scena({ che: 'bilance', bilance: [giraSe(sorte.forse(0.4), { sx: [cose(c, k)], dx: dove })] }),
      buona: testo(giusto),
      falsi: falsi(giusto, [
        a ? null : { v: k + v, perche: `hai sommato ${k} e ${v}: ma sono ${k} ${c.e} da ${v} ${c.f ? 'l\'una' : 'l\'uno'}, cioè ${k} volte ${v}` },
        a ? { v: N, perche: `${N} è il peso di ${k} ${c.e} insieme: ma dalla parte del «?» c'è già ${a}` } : null,
        a ? { v: N + a, perche: `hai aggiunto ${a}: ma ${a} c'è già, e il «?» deve solo arrivare a ${N}` } : null,
        { v: v, perche: `${v} è il peso di ${un(c)} ${c.e} ${solo(c)}: sul piatto ce ne sono ${k}` },
        { v: giusto + (sorte.forse(0.5) ? v : -v), perche: `conta bene: sul piatto ${c.e} sono ${k}` },
        vicino(giusto, sorte, u => `prova: ${k} volte ${v} non fa ${u + a}`),
      ]),
      chiave: 'bil:uno',
      aiuto: `${k} ${c.e} da ${v} pesano ${k} × ${v} = ${N}, e dall'altra parte ci vuole lo stesso peso`
        + (a ? `: c'è già ${a}, quindi il «?» vale ${N} − ${a} = ${giusto}` : ''),
      sorte,
    })
  }

  // la mossa che regge tutto il resto: la cosa ignota su entrambi i piatti (non serve saperla), un peso dalla parte delle cose, o (grado 4) le cose su entrambi i piatti
  togli(grado, sorte) {
    const scene = grado <= 3 ? ['ignota', 'peso'] : ['ignota', 'peso', 'tutte', 'tutte']
    const come = sorte.uno(scene)
    const gira = sorte.forse(0.4)
    const IN = sorte.uno(IN_PARI)

    if (come === 'ignota') {
      const [x, c] = dueCose(sorte)
      const k = sorte.fra(1, 4)
      const v = sorte.fra(2, 9)
      const N = k * v
      const ps = spezza(N, grado <= 3 ? 1 : sorte.fra(1, 2), sorte)
      // la pera sparisce: resta k·A = N, soluzione unica per A (la pera può pesare qualunque cosa, non si chiede)
      controllata([{ x: k, k: N }], [v])
      const quanto = ps.length > 1 ? `${ps.join(' + ')} = ${N}` : `${N}`
      return domanda({
        testo: `${IN} Quanto pesa ${un(c)} ${c.e}?`,
        soggetto: scena({ che: 'bilance', bilance: [giraSe(gira,
          { sx: [cose(x, 1), cose(c, k)], dx: [cose(x, 1), ...pesi(...ps)] })] }),
        buona: testo(v),
        falsi: falsi(v, [
          { v: NON_SI_SA, perche: `quanto pesa ${x.e} non serve saperlo: è su tutti e due i piatti, e se si toglie da tutti e due la bilancia resta in pari` },
          k > 1 ? { v: N, perche: `${N} è il peso di ${k} ${c.e} insieme, non di ${un(c)} ${c.e} ${solo(c)}` } : null,
          vicino(v, sorte, w => k > 1
            ? `prova: ${k} ${c.e} da ${w} pesano ${k * w}, non ${N}`
            : `prova: ${x.e} + ${w} contro ${x.e} + ${N} non pesano uguale`),
        ]),
        chiave: 'bil:togli',
        aiuto: `Togli ${un(x)} ${x.e} da tutti e due i piatti: la bilancia resta in pari, `
          + (k > 1 ? `e ${k} ${c.e} pesano ${quanto}. ${N} : ${k} = ${v}`
                   : `e ${un(c)} ${c.e} pesa ${quanto}`),
        sorte,
      })
    }

    if (come === 'peso') {
      const c = sorte.uno(TUTTE)
      const k = sorte.fra(1, 4)
      const v = sorte.fra(2, 9)
      const a = sorte.fra(2, 9)
      const b = k * v + a
      controllata([{ x: k, k: b - a }], [v])
      return domanda({
        testo: `${IN} Quanto pesa ${un(c)} ${c.e}?`,
        soggetto: scena({ che: 'bilance', bilance: [giraSe(gira,
          { sx: [cose(c, k), ...pesi(a)], dx: pesi(b) })] }),
        buona: testo(v),
        falsi: falsi(v, [
          { v: intero(b + a, k), perche: `hai aggiunto ${a} invece di toglierlo: sta dalla parte di ${c.e}, e va tolto da tutti e due i piatti` },
          { v: intero(b, k), perche: `hai lasciato il peso da ${a} insieme a ${c.e}: prima va tolto da tutti e due i piatti` },
          k > 1 ? { v: b - a, perche: `${b - a} è il peso di ${k} ${c.e} insieme, non di ${un(c)} ${c.e} ${solo(c)}` } : null,
          vicino(v, sorte, w => k > 1
            ? `prova: ${k} ${c.e} da ${w} pesano ${k * w}, più ${a} fa ${k * w + a}, non ${b}`
            : `prova: ${w} + ${a} fa ${w + a}, non ${b}`),
        ]),
        chiave: 'bil:togli',
        aiuto: `Togli ${a} da tutti e due i piatti: restano ${k} ${c.e} contro ${b} − ${a} = ${b - a}`
          + (k > 1 ? `, e ${b - a} : ${k} = ${v}` : ''),
        sorte,
      })
    }

    // le cose su tutti e due i piatti
    const c = sorte.uno(TUTTE)
    const k2 = sorte.fra(1, 2)
    const d = sorte.fra(1, 3)
    const k1 = Math.min(4, k2 + d)
    const dd = k1 - k2
    const v = sorte.fra(2, 9)
    const a = sorte.forse(0.35) ? 0 : sorte.fra(2, 9)
    const b = dd * v + a
    // k1·A + a = k2·A + b → (k1 − k2)·A = b − a
    controllata([{ x: dd, k: b - a }], [v])
    const sinistra = a ? [cose(c, k1), ...pesi(a)] : [cose(c, k1)]
    const togliPeso = a ? `, poi togli ${a} da tutti e due` : ''
    return domanda({
      testo: `${IN} Quanto pesa ${un(c)} ${c.e}?`,
      soggetto: scena({ che: 'bilance', bilance: [giraSe(gira, { sx: sinistra, dx: [cose(c, k2), ...pesi(b)] })] }),
      buona: testo(v),
      falsi: falsi(v, [
        { v: intero(b - a, k1 + k2), perche: `hai sommato ${k1} e ${k2}: ma ${c.e} dell'altro piatto si tolgono, non si aggiungono` },
        { v: intero(b - a, k1), perche: `hai tolto il peso ma non ${c.e}: ${k2} si tolgono anche dall'altro piatto` },
        dd > 1 ? { v: b - a, perche: `${b - a} è il peso di ${dd} ${c.e} insieme, non di ${un(c)} ${c.e} ${solo(c)}` } : null,
        { v: NON_SI_SA, perche: `${c.e} è su tutti e due i piatti, ma da una parte ce n'è di più: ${k2 > 1 ? `se ne tolgono ${k2}` : 'se ne toglie una'} da tutti e due, e il conto torna` },
        vicino(v, sorte, w => `prova: con ${c.e} da ${w} un piatto pesa ${k1 * w + a} e l'altro ${k2 * w + b}`),
      ]),
      chiave: 'bil:togli',
      aiuto: `Togli ${k2} ${c.e} da tutti e due i piatti${togliPeso}: restano ${dd} ${c.e} contro `
        + (a ? `${b} − ${a} = ${b - a}` : `${b}`)
        + (dd > 1 ? `, e ${b - a} : ${dd} = ${v}` : ''),
      sorte,
    })
  }

  // due bilance: sopra una cosa grossa pesa come tante medie, sotto una media pesa come tante piccole. La mossa è "mettere al posto": ogni media diventa le sue piccole, il conto è una moltiplicazione (il falso vero è sommare). Al grado 5 si allunga: due grosse, o la domanda girata.
  scambia(grado, sorte) {
    const [X, Y, Z] = catena(sorte)
    const come = sorte.uno(grado <= 4 ? ['conta', 'conta', 'peso'] : ['conta', 'peso', 'due', 'girata'])
    // due numeri diversi: con 4 e 4 il falso sarebbe uguale da sopra e da sotto; con 2 e 2 sommare e moltiplicare farebbero 4 tutti e due
    const a = sorte.fra(2, 4)
    const b = sorte.uno([2, 3, 4, 5].filter(n => n !== a))
    const sopra = { sx: [cose(X, 1)], dx: [cose(Y, a)] }
    const ab = a * b
    // le due bilance, con la piccola (o il peso) come unità: X − a·Y = 0 e Y = b — due incognite, due bilance, una soluzione
    const sistema = quantoY => controllata([{ x: 1, y: -a, k: 0 }, { x: 0, y: 1, k: quantoY }], [a * quantoY, quantoY])

    if (come === 'peso') {
      const w = sorte.fra(2, 9)
      const giusto = a * w
      sistema(w)
      return domanda({
        testo: `Guarda le due bilance. Quanto pesa ${un(X)} ${X.e}?`,
        soggetto: scena({ che: 'bilance', bilance: [sopra, { sx: [cose(Y, 1)], dx: pesi(w) }] }),
        buona: testo(giusto),
        falsi: falsi(giusto, [
          { v: a + w, perche: `hai sommato ${a} e ${w}: ma ogni ${Y.e} pesa ${w}, e di ${Y.e} ce ne sono ${a}` },
          { v: w, perche: `${w} è il peso di ${un(Y)} ${Y.e} ${solo(Y)}: ${X.e} pesa come ${a} di loro` },
          { v: giusto + (sorte.forse(0.5) ? w : -w), perche: `conta bene: nella bilancia di sopra ${Y.e} sono ${a}` },
          { v: a, perche: `${a} dice quante cose ci sono sul piatto, non quanto pesano` },
          vicino(giusto, sorte, u => `prova: ${a} volte ${w} non fa ${u}`),
        ]),
        chiave: 'bil:scambia',
        aiuto: `Nella bilancia di sopra metti al posto di ogni ${Y.e} il suo peso, ${w}: sono ${a} volte ${w}, cioè ${a} × ${w} = ${giusto}`,
        sorte,
      })
    }

    const sotto = { sx: [cose(Y, 1)], dx: [cose(Z, b)] }
    const bil = scena({ che: 'bilance', bilance: [sopra, sotto] })

    if (come === 'due') {
      const m = sorte.fra(2, 3)
      const giusto = m * ab
      sistema(b)
      return domanda({
        testo: `Guarda le due bilance. ${quanti(Z)} ${Z.e} pesano come ${m} ${X.e}?`,
        soggetto: bil,
        buona: testo(giusto),
        falsi: falsi(giusto, [
          { v: ab, perche: `${ab} ${Z.e} pesano come ${un(X)} ${X.e} ${solo(X)}: qui ${X.e} sono ${m}` },
          { v: m * (a + b), perche: `hai sommato ${a} e ${b}: ma ogni ${Y.e} vale ${b} ${Z.e}, quindi si moltiplica` },
          { v: m + a + b, perche: 'hai sommato tutti i numeri: in uno scambio si moltiplica' },
          vicino(giusto, sorte, u => `prova: ${m} volte ${ab} non fa ${u}`),
        ]),
        chiave: 'bil:scambia',
        aiuto: `${Un(X)} ${X.e} pesa come ${a} ${Y.e}, cioè ${a} × ${b} = ${ab} ${Z.e}: `
          + `${m} ${X.e} pesano come ${m} × ${ab} = ${giusto} ${Z.e}`,
        sorte,
      })
    }

    if (come === 'girata') {
      const m = sorte.fra(2, 3)
      const N = m * ab
      sistema(b)
      controllata([{ x: ab, k: N }], [m])
      return domanda({
        testo: `Guarda le due bilance. ${quanti(X)} ${X.e} pesano come ${N} ${Z.e}?`,
        soggetto: bil,
        buona: testo(m),
        falsi: falsi(m, [
          { v: intero(N, a), perche: `hai usato solo la bilancia di sopra: prima conta ${quanti(Z).toLowerCase()} ${Z.e} vale ${un(X)} ${X.e}` },
          { v: intero(N, b), perche: `hai usato solo la bilancia di sotto: così hai contato ${Y.e}, non ${X.e}` },
          { v: intero(N, a + b), perche: `hai sommato ${a} e ${b}: ma ${un(X)} ${X.e} vale ${a} × ${b} ${Z.e}` },
          vicino(m, sorte, w => `prova: ${w} ${X.e} pesano come ${w * ab} ${Z.e}, non ${N}`),
        ]),
        chiave: 'bil:scambia',
        aiuto: `Prima quanto vale ${un(X)} ${X.e}: ${a} × ${b} = ${ab} ${Z.e}. `
          + `Poi quante volte ${ab} sta in ${N}: ${N} : ${ab} = ${m}`,
        sorte,
      })
    }

    sistema(b)
    return domanda({
      testo: `Guarda le due bilance. ${quanti(Z)} ${Z.e} pesano come ${un(X)} ${X.e}?`,
      soggetto: bil,
      buona: testo(ab),
      falsi: falsi(ab, [
        { v: a + b, perche: `hai sommato ${a} e ${b}: ma ogni ${Y.e} vale ${b} ${Z.e}, e di ${Y.e} ce ne sono ${a}` },
        { v: a, perche: `hai guardato solo la bilancia di sopra: ${a} è il numero di ${Y.e}, non di ${Z.e}` },
        { v: b, perche: `hai guardato solo la bilancia di sotto: vale per ${un(Y)} ${Y.e} ${solo(Y)}` },
      ]),
      chiave: 'bil:scambia',
      aiuto: `Nella bilancia di sopra metti al posto di ogni ${Y.e} ${suoi(Z)} ${b} ${Z.e}: `
        + `sono ${a} volte ${b}, cioè ${a} × ${b} = ${ab}`,
      sorte,
    })
  }

  // sopra le due cose insieme contro un peso, sotto cosa le lega (una pesa l'altra più qualcosa, o volte); la mossa è scambio + togliere/dividere
  due(sorte) {
    const [X, Y] = piccolaEGrossa(sorte)
    const chiedeY = sorte.forse(0.4)
    const IN = 'Le due bilance sono in pari.'

    if (sorte.forse(0.5)) {
      // Y = X + D, X + Y = S
      const x = sorte.fra(2, 9)
      const D = sorte.fra(1, 6)
      const y = x + D
      const S = x + y
      controllata([{ x: 1, y: 1, k: S }, { x: -1, y: 1, k: D }], [x, y])
      const sotto = sorte.forse(0.5)
        ? { sx: [cose(Y, 1)], dx: [cose(X, 1), ...pesi(D)] }
        : { sx: [cose(X, 1), ...pesi(D)], dx: [cose(Y, 1)] }
      const [c, giusto] = chiedeY ? [Y, y] : [X, x]
      const passi = `Nella bilancia di sopra metti al posto di ${Y.e} quello che pesa nella bilancia di sotto: `
        + `${X.e} + ${X.e} + ${D} pesano ${S}. Togli ${D}: 2 ${X.e} pesano ${S - D}, e ${un(X)} ${X.e} pesa ${x}`
        + (chiedeY ? `. ${Y.e} pesa ${x} + ${D} = ${y}` : '')
      return domanda({
        testo: `${IN} Quanto pesa ${un(c)} ${c.e}?`,
        soggetto: scena({ che: 'bilance', bilance: [{ sx: [cose(X, 1), cose(Y, 1)], dx: pesi(S) }, sotto] }),
        buona: testo(giusto),
        falsi: falsi(giusto, [
          { v: intero(S, 2), perche: `hai diviso ${S} a metà: ma ${Y.e} pesa ${D} più di ${X.e}, lo dice la bilancia di sotto` },
          chiedeY
            ? { v: x, perche: `questo è il peso di ${un(X)} ${X.e}, non di ${un(Y)} ${Y.e}` }
            : { v: y, perche: `questo è il peso di ${un(Y)} ${Y.e}, non di ${un(X)} ${X.e}` },
          { v: S - D, perche: `${S - D} è il peso di 2 ${X.e} insieme${chiedeY ? `, non di ${Y.e}` : ''}` },
          chiedeY ? { v: S, perche: `${S} è il peso di ${X.e} e ${Y.e} insieme` } : null,
          vicino(giusto, sorte, w => chiedeY
            ? `prova: se ${Y.e} pesa ${w}, ${X.e} pesa ${w - D} e insieme fanno ${2 * w - D}, non ${S}`
            : `prova: se ${X.e} pesa ${w}, ${Y.e} pesa ${w + D} e insieme fanno ${2 * w + D}, non ${S}`),
        ]),
        chiave: 'bil:due',
        aiuto: passi,
        sorte,
      })
    }

    // Y = r·X, X + Y = S
    const r = sorte.fra(2, 3)
    const x = sorte.fra(2, 8)
    const y = r * x
    const S = x + y
    controllata([{ x: 1, y: 1, k: S }, { x: -r, y: 1, k: 0 }], [x, y])
    const sotto = sorte.forse(0.5) ? { sx: [cose(Y, 1)], dx: [cose(X, r)] } : { sx: [cose(X, r)], dx: [cose(Y, 1)] }
    const [c, giusto] = chiedeY ? [Y, y] : [X, x]
    return domanda({
      testo: `${IN} Quanto pesa ${un(c)} ${c.e}?`,
      soggetto: scena({ che: 'bilance', bilance: [{ sx: [cose(X, 1), cose(Y, 1)], dx: pesi(S) }, sotto] }),
      buona: testo(giusto),
      falsi: falsi(giusto, [
        { v: intero(S, 2), perche: `hai diviso ${S} a metà: ma ${Y.e} pesa come ${r} ${X.e}, lo dice la bilancia di sotto` },
        chiedeY
          ? { v: x, perche: `questo è il peso di ${un(X)} ${X.e}, non di ${un(Y)} ${Y.e}` }
          : { v: y, perche: `questo è il peso di ${un(Y)} ${Y.e}, non di ${un(X)} ${X.e}` },
        !chiedeY ? { v: intero(S, r), perche: `hai diviso per ${r}: ma sopra, con ${X.e} che c'era già, i pezzi uguali sono ${r + 1}` } : null,
        chiedeY ? { v: S, perche: `${S} è il peso di ${X.e} e ${Y.e} insieme` } : null,
        vicino(giusto, sorte, w => !chiedeY
          ? `prova: se ${X.e} pesa ${w}, ${Y.e} pesa ${r * w} e insieme fanno ${(r + 1) * w}, non ${S}`
          : w % r === 0
            ? `prova: se ${Y.e} pesa ${w}, ${X.e} pesa ${w / r} e insieme fanno ${w + w / r}, non ${S}`
            : `prova: ${Y.e} pesa come ${r} ${X.e}, e ${w} non si divide in ${r} parti uguali`),
      ]),
      chiave: 'bil:due',
      aiuto: `Nella bilancia di sopra metti al posto di ${Y.e} ${suoi(X)} ${r} ${X.e}: `
        + `sono ${r + 1} ${X.e} contro ${S}, e ${un(X)} ${X.e} pesa ${S} : ${r + 1} = ${x}`
        + (chiedeY ? `. ${Y.e} pesa ${r} × ${x} = ${y}` : ''),
      sorte,
    })
  }
}

// errore comune in colonna: nelle unità si fa «il più grande meno il più piccolo» (52−17 fa 45 invece di 35); un falso solo quando serve davvero il prestito, altrimenti `falsi` lo scarta da sé
function senzaPrestito(a, b) {
  const ua = a % 10, ub = b % 10
  const da = Math.floor(a / 10), db = Math.floor(b / 10)
  if (ua >= ub || da < db) return a - b
  return (da - db) * 10 + (ub - ua)
}

export default new Bilance()

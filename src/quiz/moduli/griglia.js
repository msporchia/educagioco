/* ═══════════════════════════════════════════════════════════════════
   LA GRIGLIA — orientarsi a quadretti: caselle, percorsi, area, bordo.

   È il primo pezzo di geometria che serve davvero, e sta tutto su un
   foglio a quadretti: dire *dove* è una cosa (B3, non «lì»), muoversi
   di tante caselle in una direzione, e contare due cose diverse che i
   bambini confondono per anni — i quadretti dentro (l'area) e i lati
   del contorno (il perimetro).

   PERCHÉ SI DISEGNA. Una griglia raccontata a parole è un indovinello;
   guardata è una domanda di geometria. Il modulo decide i fatti — quali
   caselle sono piene, cosa c'è posato dove — e il pittore li dipinge:
   qui dentro non c'è una riga di canvas, e in `grafica/pittori/griglia.js`
   non c'è una riga di difficoltà.

   I FALSI SONO GLI ERRORI VERI, e in questa materia sono sempre gli
   stessi quattro:
     · riga e colonna scambiate (3B invece di B3);
     · il perimetro contato al posto dell'area, e viceversa;
     · ogni quadretto conta quattro lati anche quando è attaccato a un
       altro (il perimetro come 4 × area);
     · un passo di troppo, o la direzione ribaltata.
   Una casella presa a caso si scarterebbe a occhio; queste no, perché
   sono esattamente il conto che il bambino ha appena sbagliato.

   LE FIGURE SONO SEMPRE INTERE. Le celle di area e perimetro nascono da
   una passeggiata a caso che le attacca una all'altra e non lascia
   buchi (`buchi()` lo verifica): una figura in pezzi sparsi renderebbe
   la domanda sul bordo senza risposta.

   IL CONFRONTO SI PAGA DUE VOLTE. Chiedere l'area di una figura storta
   è un conto solo; chiedere *quale di quattro* ha lo stesso bordo e
   quadretti diversi sono otto conti, tutti a dito, tutti su figure che
   non hanno una forma da cui dedurre niente. Il concetto — area e
   perimetro non vanno insieme — si vede uguale su rettangoli e
   quadrati, dove i due numeri si *calcolano* (righe per colonne, due
   volte la base più due volte l'altezza) invece di contarli; e lì
   compare anche il distrattore migliore che le figure storte non
   sanno dare: LO STESSO RETTANGOLO GIRATO, uguale in tutte e due le
   cose. Quello è il grado 6. Il confronto fra figure qualsiasi resta,
   ma sale in cima alla scaletta (grado 7), dove va incontrato solo
   chi ha già capito il resto.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo, emoji, scena } from '../nucleo/domanda.js'
import { PITTORI_GRIGLIA } from '../grafica/pittori/griglia.js'

/* ── il vocabolario della griglia ──
   x cresce verso destra (le lettere), y verso il basso (i numeri):
   [0,0] è A1, in alto a sinistra. */
const LETTERE = 'ABCDEF'
const casella = (x, y) => LETTERE[x] + (y + 1)
const alRovescio = (x, y) => String(y + 1) + LETTERE[x]

const PASSI = [[1, 0], [-1, 0], [0, 1], [0, -1]]

const VERSI = [
  { come: 'destra', d: [1, 0], freccia: '→', giro: [0, 1] },
  { come: 'sinistra', d: [-1, 0], freccia: '←', giro: [0, 1] },
  { come: 'sopra', d: [0, -1], freccia: '↑', giro: [1, 0] },
  { come: 'sotto', d: [0, 1], freccia: '↓', giro: [1, 0] },
]

/* le cose che si posano nelle caselle: emoji nette, che a 20 pixel si
   distinguono ancora una dall'altra */
const COSE = ['🐶', '🦴', '⭐', '🍎', '🐟', '🎈', '🌵', '🐌', '🍄', '🔑', '🐝', '🧸', '🚗', '🌻', '🐢', '🍩', '🐞', '🎁']

const SCALETTA = [
  'le caselle: lettera e numero',
  'destra, sinistra, sopra e sotto',
  'i percorsi a frecce',
  'l\'area: i quadretti dentro',
  'il perimetro: il giro del bordo',
  'area e perimetro nei rettangoli',
  'area e perimetro, figure qualsiasi',
]

/* Le tipologie. I primi quattro tipi si giocano guardando la griglia e
   stanno in un gruppo loro; area e perimetro sono due parole di scuola
   e stanno nel gruppo che c'era già. Il confronto è diviso in due
   perché sono due difficoltà diverse della stessa domanda: nei
   rettangoli i conti si fanno moltiplicando, in una figura storta si
   contano i quadretti a uno a uno. */
const TIPI = [
  { chiave: 'gri:coordinate', nome: 'Le caselle: lettera e numero', sa: 'griglia', gradi: { 1: 1 } },
  { chiave: 'gri:direzioni', nome: 'Destra, sinistra, sopra e sotto', sa: 'griglia', gradi: { 2: 1 } },
  { chiave: 'gri:mosse', nome: 'Quante mosse servono', sa: 'griglia', gradi: { 3: 0.45 } },
  { chiave: 'gri:percorso', nome: 'Dove si arriva seguendo le frecce', sa: 'griglia', gradi: { 3: 0.55 } },
  { chiave: 'gri:area', nome: "L'area: i quadretti dentro", sa: 'area-perimetro', gradi: { 4: 1 } },
  { chiave: 'gri:perimetro', nome: 'Il perimetro: il giro del bordo', sa: 'area-perimetro', gradi: { 5: 1 } },
  { chiave: 'gri:confronto', nome: 'Area e perimetro nei rettangoli', sa: 'area-perimetro', gradi: { 6: 1 } },
  { chiave: 'gri:confronto-libero', nome: 'Area e perimetro, figure qualsiasi', sa: 'area-perimetro', gradi: { 7: 1 } },
]

/* le due consegne del confronto, uguali per i rettangoli e per le
   figure storte: cambia quanto costa rispondere, non cosa si chiede */
const CHIESTE = {
  giro: 'Quale figura ha il bordo lungo uguale a questa, ma un numero diverso di quadretti?',
  area: 'Quale figura ha gli stessi quadretti di questa, ma il bordo di lunghezza diversa?',
}

const somma = ([x, y], [dx, dy], k = 1) => [x + dx * k, y + dy * k]
const dentro = (l, a, [x, y]) => x >= 0 && y >= 0 && x < l && y < a
const uguali = (a, b) => a[0] === b[0] && a[1] === b[1]
const firma = celle => celle.map(c => c.join(',')).join(' ')

/* ── le figure a quadretti ── */

function normalizza(celle) {
  const mx = Math.min(...celle.map(c => c[0]))
  const my = Math.min(...celle.map(c => c[1]))
  return celle.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0])
}

const ingombro = celle => [
  Math.max(...celle.map(c => c[0])) + 1,
  Math.max(...celle.map(c => c[1])) + 1,
]

/* il giro del bordo: ogni lato che non ha un vicino vale uno */
function perimetro(celle) {
  const pieno = new Set(celle.map(c => c.join(',')))
  let giro = 0
  for (const cella of celle)
    for (const p of PASSI) if (!pieno.has(somma(cella, p).join(','))) giro++
  return giro
}

/* un buco è un vuoto circondato: il bordo che si vede non sarebbe più
   quello che si conta, quindi le figure con buchi si scartano */
function buchi(celle) {
  const [w, h] = ingombro(celle)
  const pieno = new Set(celle.map(c => c.join(',')))
  const visti = new Set(['-1,-1'])
  const coda = [[-1, -1]]
  while (coda.length) {
    const q = coda.pop()
    for (const p of PASSI) {
      const n = somma(q, p)
      const k = n.join(',')
      if (n[0] < -1 || n[1] < -1 || n[0] > w || n[1] > h) continue
      if (visti.has(k) || pieno.has(k)) continue
      visti.add(k)
      coda.push(n)
    }
  }
  return visti.size < (w + 2) * (h + 2) - celle.length
}

/* la passeggiata a caso: si parte da una casella e se ne attacca una
   vicina alla volta, dentro un ingombro massimo. Esce sempre una figura
   sola, e i buchi li scarta chi chiama. */
function passeggiata(quante, sorte, latoMax) {
  const celle = [[0, 0]]
  const prese = new Set(['0,0'])
  for (let giri = 0; celle.length < quante && giri < 160; giri++) {
    const c = somma(sorte.uno(celle), sorte.uno(PASSI))
    const k = c.join(',')
    if (prese.has(k)) continue
    const [w, h] = ingombro([...celle, c])
    if (w > latoMax || h > latoMax) continue
    celle.push(c)
    prese.add(k)
  }
  return celle.length === quante ? normalizza(celle) : null
}

/* una figura buona: intera, senza buchi, dell'area chiesta */
function figura(quante, sorte, latoMax = 4) {
  for (let prova = 0; prova < 20; prova++) {
    const c = passeggiata(quante, sorte, latoMax)
    if (c && !buchi(c)) return c
  }
  /* ripiego che non fallisce mai: righe piene una sotto l'altra */
  return normalizza(Array.from({ length: quante }, (_, i) => [i % latoMax, Math.floor(i / latoMax)]))
}

/* ── i rettangoli ──
   Il confronto si gioca in una griglia 6×6 uguale per tutte e quattro
   le figure: più stretta e le coppie «stessa area, bordo diverso»
   sarebbero quasi solo A=4, più larga i quadretti diventerebbero
   macchie nel riquadro di una risposta (118 pixel). */
const LATO_CONFRONTO = 6

const rettangolo = (w, h) => {
  const celle = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) celle.push([x, y])
  return celle
}

const RETTANGOLI = (() => {
  const fuori = []
  for (let w = 1; w <= LATO_CONFRONTO; w++)
    for (let h = 1; h <= LATO_CONFRONTO; h++)
      fuori.push({ w, h, area: w * h, giro: 2 * (w + h), celle: rettangolo(w, h) })
  return fuori
})()

/* la scena di una figura, centrata in una griglia della misura data */
function scenaFigura(celle, larghezza, altezza) {
  const [w, h] = ingombro(celle)
  const dx = Math.floor((larghezza - w) / 2)
  const dy = Math.floor((altezza - h) / 2)
  return {
    che: 'griglia', larghezza, altezza,
    celle: celle.map(([x, y]) => [x + dx, y + dy]),
  }
}

/* ── il modulo ── */

class Griglia extends Modulo {
  constructor() {
    super({
      id: 'griglia',
      nome: 'La griglia',
      icona: '🗺️',
      materia: 'spazio',
      chiaro: 'trovare le caselle, seguire i percorsi, contare area e perimetro a quadretti',
      scaletta: SCALETTA,
      /* i primi tre gradi si giocano guardando: caselle, direzioni,
         percorsi. Gli ultimi quattro chiamano per nome due cose che si
         fanno a scuola — area e perimetro — e senza quei nomi la
         domanda non si capisce nemmeno. */
      tipi: TIPI,
      pittori: PITTORI_GRIGLIA,
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'gri:direzioni': return this.direzione(sorte)
      case 'gri:mosse': return this.mosse(sorte)
      case 'gri:percorso': return this.arrivo(sorte)
      case 'gri:area': return this.area(sorte)
      case 'gri:perimetro': return this.bordo(sorte)
      case 'gri:confronto': return this.rettangoli(sorte)
      case 'gri:confronto-libero': return this.confronto(sorte)
      default: return sorte.forse(0.45) ? this.chiCi(sorte) : this.dove(sorte)
    }
  }

  /* ── grado 1: in che casella è? ── */
  dove(sorte) {
    const lato = sorte.fra(4, 6)
    const x = sorte.fra(0, lato - 1)
    const y = sorte.fra(0, lato - 1)
    const em = sorte.uno(COSE)

    const proposte = [
      { t: alRovescio(x, y), perche: 'prima la lettera della colonna, poi il numero della riga' },
      { t: casella(x + (x > 0 ? -1 : 1), y), perche: 'la lettera è quella della colonna, in cima' },
      { t: casella(x, y + (y > 0 ? -1 : 1)), perche: 'il numero è quello della riga, di lato' },
      { t: casella(lato - 1 - x, y), perche: 'le lettere si contano da sinistra' },
    ]
    const buona = casella(x, y)
    const visti = new Set([buona])
    const falsi = []
    for (const p of proposte) {
      if (visti.has(p.t)) continue
      visti.add(p.t)
      falsi.push(p)
    }

    return domanda({
      testo: `In che casella è ${em}?`,
      soggetto: scena({ che: 'griglia', larghezza: lato, altezza: lato, etichette: true, segni: [{ x, y, em }] }),
      buona: testo(buona),
      falsi: [testo(falsi[0].t, falsi[0].perche), ...sorte.mescola(falsi.slice(1)).slice(0, 2).map(p => testo(p.t, p.perche))],
      chiave: 'gri:coordinate',
      aiuto: 'prima la lettera scritta in cima alla colonna, poi il numero scritto di lato',
      sorte,
    })
  }

  /* ── grado 1, al contrario: cosa c'è in quella casella? ──
     I falsi stanno nelle caselle degli sbagli: quella con lettera e
     numero scambiati, quella della riga accanto, quella della colonna
     accanto. Chi sbaglia il modo di leggere finisce esattamente lì. */
  chiCi(sorte) {
    const lato = sorte.fra(4, 6)
    const x = sorte.fra(0, lato - 1)
    const y = sorte.fra(0, lato - 1)

    const candidate = [
      [y, x],                                   // lettera e numero scambiati
      [x, y + (y > 0 ? -1 : 1)],                // riga accanto
      [x + (x > 0 ? -1 : 1), y],                // colonna accanto
      [lato - 1 - x, y],                        // colonna specchiata
      [x, lato - 1 - y],                        // riga specchiata
    ]
    const prese = [[x, y]]
    for (const c of candidate) {
      if (!dentro(lato, lato, c)) continue
      if (prese.some(q => uguali(q, c))) continue
      prese.push(c)
      if (prese.length === 4) break
    }
    /* se la griglia era stretta si riempie con caselle libere */
    for (let i = 0; prese.length < 4 && i < lato * lato; i++) {
      const c = [i % lato, Math.floor(i / lato)]
      if (!prese.some(q => uguali(q, c))) prese.push(c)
    }

    const emj = sorte.alcuni(COSE, prese.length)
    const segni = prese.map(([cx, cy], i) => ({ x: cx, y: cy, em: emj[i] }))

    return domanda({
      testo: `Cosa c'è nella casella ${casella(x, y)}?`,
      soggetto: scena({ che: 'griglia', larghezza: lato, altezza: lato, etichette: true, segni }),
      buona: emoji(emj[0]),
      falsi: emj.slice(1).map(e => emoji(e, 'la lettera dice la colonna, il numero dice la riga')),
      chiave: 'gri:coordinate',
      aiuto: 'scendi lungo la colonna della lettera finché arrivi alla riga del numero',
      sorte,
    })
  }

  /* ── grado 2: destra, sinistra, sopra, sotto ──
     La casella di partenza si sceglie fra quelle che tengono dentro la
     griglia sia la risposta sia tre sbagli: senza il distrattore
     «direzione ribaltata» la domanda si risolverebbe per esclusione.
     Gli sbagli però non sono sempre gli stessi tre — con due caselle di
     passo una griglia da cinque non tiene insieme «due indietro» e «tre
     avanti» — quindi si sceglie fra quelli che ci stanno, uno per uno.
     Cablare le posizioni non si può: erano quelle di «una casella a
     destra», e finivano sotto la domanda «due caselle sotto». */
  direzione(sorte) {
    const lato = sorte.fra(5, 6)
    const verso = sorte.uno(VERSI)
    const segno = sorte.forse() ? 1 : -1
    const giri = [
      [verso.giro[0] * segno, verso.giro[1] * segno],
      [verso.giro[0] * -segno, verso.giro[1] * -segno],
    ]

    /* gli sbagli veri, in ordine di importanza: la parte opposta, il
       passo contato male, la riga al posto della colonna. Ne servono
       tre; quelli che escono dal foglio o che cadono su una casella già
       presa si saltano. */
    const sbagli = (qui, quante, dice) => {
      const meta = somma(qui, verso.d, quante)
      const perpendicolare = 'destra e sinistra si contano lungo la riga, sopra e sotto lungo la colonna'
      const candidati = [
        { c: somma(qui, verso.d, -quante), perche: `questo sta dalla parte opposta: ${verso.come} è dall'altro lato` },
        { c: somma(qui, verso.d, quante + 1), perche: `hai contato una casella in più: sono ${dice}` },
        { c: somma(qui, verso.d, quante - 1), perche: `hai contato una casella in meno: sono ${dice}` },
        ...giri.map(g => ({ c: somma(qui, g, quante), perche: perpendicolare })),
      ]
      const prese = [qui, meta]
      const falsi = []
      for (const p of candidati) {
        if (!dentro(lato, lato, p.c) || prese.some(q => uguali(q, p.c))) continue
        prese.push(p.c)
        falsi.push(p)
        if (falsi.length === 3) break
      }
      return falsi.length === 3 ? { meta, falsi } : null
    }

    /* due caselle se la griglia le regge, se no una: meglio un passo
       corto che una domanda senza risposta a schermo */
    const quanti = sorte.fra(1, 2) === 2 ? [2, 1] : [1]
    let scelta = null
    for (const quante of quanti) {
      const dice = quante === 1 ? 'una casella' : 'due caselle'
      const buone = []
      for (let x = 0; x < lato; x++) for (let y = 0; y < lato; y++) {
        if (!dentro(lato, lato, somma([x, y], verso.d, quante))) continue
        const s = sbagli([x, y], quante, dice)
        if (s) buone.push({ qui: [x, y], dice, ...s })
      }
      if (buone.length) { scelta = sorte.uno(buone); break }
    }
    if (!scelta) return this.dove(sorte)

    const emj = sorte.alcuni(COSE, 5)
    const posti = [scelta.qui, scelta.meta, ...scelta.falsi.map(f => f.c)]
    const segni = posti.map((c, i) => ({ x: c[0], y: c[1], em: emj[i] }))

    const dove = verso.come === 'destra' || verso.come === 'sinistra'
      ? `a ${verso.come} di ${emj[0]}`
      : `${verso.come} a ${emj[0]}`

    return domanda({
      testo: `Cosa c'è ${scelta.dice} ${dove}?`,
      soggetto: scena({ che: 'griglia', larghezza: lato, altezza: lato, segni }),
      buona: emoji(emj[1]),
      falsi: scelta.falsi.map((f, i) => emoji(emj[i + 2], f.perche)),
      chiave: 'gri:direzioni',
      aiuto: 'metti il dito sulla casella di partenza e spostalo di una casella per volta',
      sorte,
    })
  }

  /* ── grado 3: dove arriva chi segue le frecce ── */
  arrivo(sorte) {
    const lato = sorte.fra(5, 6)
    const partenza = [sorte.fra(1, lato - 2), sorte.fra(1, lato - 2)]
    const em = sorte.uno(COSE)

    let qui = partenza
    let ultimo = null
    const mosse = []
    for (let i = 0; i < 3; i++) {
      const scelte = VERSI.filter(v =>
        dentro(lato, lato, somma(qui, v.d)) &&
        (!ultimo || !(v.d[0] === -ultimo.d[0] && v.d[1] === -ultimo.d[1])))
      const v = sorte.uno(scelte)
      mosse.push(v)
      qui = somma(qui, v.d)
      ultimo = v
    }
    const meta = qui
    const primaTappa = mosse.slice(0, 2).reduce((c, v) => somma(c, v.d), partenza)
    const inPiu = somma(meta, ultimo.d)
    const specchiato = mosse.reduce((c, v) => somma(c, v.d[1] ? [0, -v.d[1]] : v.d), partenza)

    const proposte = [
      { t: alRovescio(meta[0], meta[1]), perche: 'prima la lettera della colonna, poi il numero della riga' },
      { t: casella(primaTappa[0], primaTappa[1]), perche: 'ti sei fermato prima: le frecce sono tre' },
      ...(dentro(lato, lato, inPiu) ? [{ t: casella(inPiu[0], inPiu[1]), perche: 'un passo di troppo: una casella per ogni freccia' }] : []),
      ...(dentro(lato, lato, specchiato) ? [{ t: casella(specchiato[0], specchiato[1]), perche: '↑ va verso l\'alto e ↓ verso il basso' }] : []),
    ]
    const buona = casella(meta[0], meta[1])
    const visti = new Set([buona])
    const falsi = []
    for (const p of proposte) {
      if (visti.has(p.t)) continue
      visti.add(p.t)
      falsi.push(p)
    }
    while (falsi.length < 3) {
      const c = [sorte.fra(0, lato - 1), sorte.fra(0, lato - 1)]
      const t = casella(c[0], c[1])
      if (visti.has(t)) continue
      visti.add(t)
      falsi.push({ t, perche: 'segui una freccia per volta, partendo dalla casella giusta' })
    }

    return domanda({
      testo: `${em} parte da ${casella(partenza[0], partenza[1])} e fa ${mosse.map(v => v.freccia).join('')} : dove arriva?`,
      soggetto: scena({
        che: 'griglia', larghezza: lato, altezza: lato, etichette: true,
        segni: [{ x: partenza[0], y: partenza[1], em }],
      }),
      buona: testo(buona),
      falsi: falsi.slice(0, 3).map(p => testo(p.t, p.perche)),
      chiave: 'gri:percorso',
      aiuto: 'una freccia, una casella: ↑ in alto, ↓ in basso, → a destra, ← a sinistra',
      sorte,
    })
  }

  /* ── grado 3, al contrario: quali frecce ci portano ──
     Ogni falso finisce in una casella diversa dall'osso: si controlla
     dove arriva, non come è scritto. */
  mosse(sorte) {
    const lato = sorte.fra(5, 6)
    const dx = (sorte.forse() ? 1 : -1) * sorte.fra(1, 3)
    const dy = (sorte.forse() ? 1 : -1) * sorte.fra(1, 2)

    const partenze = []
    for (let x = 0; x < lato; x++) for (let y = 0; y < lato; y++)
      if (dentro(lato, lato, [x + dx, y + dy])) partenze.push([x, y])
    const via = sorte.uno(partenze)
    const meta = somma(via, [dx, dy])

    const oriz = dx > 0 ? '→' : '←'
    const vert = dy > 0 ? '↓' : '↑'
    const contrarioO = dx > 0 ? '←' : '→'
    const passo = f => f === '→' ? [1, 0] : f === '←' ? [-1, 0] : f === '↓' ? [0, 1] : [0, -1]
    const finisce = s => [...s].reduce((c, f) => somma(c, passo(f)), via)

    const buona = oriz.repeat(Math.abs(dx)) + vert.repeat(Math.abs(dy))
    const proposte = [
      { t: contrarioO.repeat(Math.abs(dx)) + vert.repeat(Math.abs(dy)), perche: 'quella freccia va dalla parte opposta' },
      { t: oriz.repeat(Math.abs(dy)) + vert.repeat(Math.abs(dx)), perche: 'hai scambiato i due conti: prima quante di lato, poi quante su o giù' },
      { t: buona + oriz, perche: 'una freccia di troppo: si finisce una casella più in là' },
      { t: buona.slice(0, -1), perche: 'manca una freccia per arrivarci' },
      { t: vert.repeat(Math.abs(dy)) + contrarioO.repeat(Math.abs(dx)), perche: 'controlla da che parte va la freccia di lato' },
    ]
    const visti = new Set([buona])
    const falsi = []
    for (const p of proposte) {
      if (visti.has(p.t) || !p.t) continue
      if (uguali(finisce(p.t), meta)) continue
      visti.add(p.t)
      falsi.push(p)
    }

    const emj = sorte.alcuni(COSE, 2)
    return domanda({
      testo: `Quali frecce portano ${emj[0]} fino a ${emj[1]}?`,
      soggetto: scena({
        che: 'griglia', larghezza: lato, altezza: lato,
        segni: [{ x: via[0], y: via[1], em: emj[0] }, { x: meta[0], y: meta[1], em: emj[1] }],
      }),
      buona: testo(buona),
      falsi: falsi.slice(0, 3).map(p => testo(p.t, p.perche)),
      chiave: 'gri:mosse',
      aiuto: 'conta prima quante caselle di lato, poi quante su o giù',
      sorte,
    })
  }

  /* ── grado 4: l'area, i quadretti dentro ── */
  area(sorte) {
    const quante = sorte.fra(4, 9)
    const celle = figura(quante, sorte, 4)
    const [w, h] = ingombro(celle)
    const giro = perimetro(celle)
    const lato = Math.max(w, h, 4) + 1

    const proposte = [
      { v: giro, perche: 'quello è il giro del bordo, non i quadretti colorati' },
      { v: w * h, perche: 'quello è il rettangolo intorno: contano solo i quadretti colorati' },
      { v: quante + 1, perche: 'uno l\'hai contato due volte' },
      { v: quante - 1, perche: 'te n\'è sfuggito uno' },
    ]
    const visti = new Set([quante])
    const falsi = []
    for (const p of proposte) {
      if (p.v < 1 || visti.has(p.v)) continue
      visti.add(p.v)
      falsi.push(p)
    }

    return domanda({
      testo: 'Quanti quadretti formano questa figura?',
      soggetto: scena(scenaFigura(celle, lato, lato)),
      buona: testo(quante),
      falsi: falsi.slice(0, 3).map(p => testo(p.v, p.perche)),
      chiave: 'gri:area',
      aiuto: 'l\'area sono i quadretti colorati: contali uno per uno, anche quelli in mezzo',
      sorte,
    })
  }

  /* ── grado 5: il perimetro, il giro del bordo ── */
  bordo(sorte) {
    const quante = sorte.fra(4, 8)
    const celle = figura(quante, sorte, 4)
    const [w, h] = ingombro(celle)
    const giro = perimetro(celle)
    const lato = Math.max(w, h, 4) + 1

    const proposte = [
      { v: quante, perche: 'quelli sono i quadretti dentro: quella è l\'area' },
      { v: 4 * quante, perche: 'i lati fra due quadretti attaccati non stanno sul bordo' },
      { v: 2 * (w + h), perche: 'quello è il giro del rettangolo intorno, non della figura' },
      { v: giro - 2, perche: 'ne hai saltati due: segui il contorno senza staccare il dito' },
      { v: giro + 2, perche: 'ne hai contati due in più: ogni lato si conta una volta sola' },
    ]
    const visti = new Set([giro])
    const falsi = []
    for (const p of proposte) {
      if (p.v < 1 || visti.has(p.v)) continue
      visti.add(p.v)
      falsi.push(p)
    }

    return domanda({
      testo: 'Quanto è lungo il bordo arancione?',
      soggetto: scena(scenaFigura(celle, lato, lato)),
      buona: testo(giro),
      falsi: sorte.mescola(falsi).slice(0, 3).map(p => testo(p.v, p.perche)),
      chiave: 'gri:perimetro',
      aiuto: 'segui il contorno e conta un lato di quadretto per volta, fino a tornare al via',
      sorte,
    })
  }

  /* ── grado 6: area e perimetro non vanno insieme, sui rettangoli ──
     Due figure con lo stesso bordo possono avere dentro un numero
     diverso di quadretti, ed è il punto in cui i due conti smettono di
     sembrare la stessa cosa. Qui si vede senza contare a dito: in un
     rettangolo i quadretti sono righe × colonne e il bordo è 2(b+h),
     quindi 2×4 e 1×5 hanno lo stesso giro (12) e dentro 8 quadretti
     contro 5 — e si può verificare a mente invece che con l'indice
     sullo schermo.
     I TRE FALSI SONO I TRE MODI DI SBAGLIARE:
       · lo STESSO rettangolo girato (4×2 per 2×4): uguale in tutte e
         due le cose, e sembra la risposta a chi guarda «è diverso da
         quello di sopra?» invece di contare;
       · quello che condivide l'altra grandezza — se si chiede lo
         stesso bordo, uno con gli stessi quadretti;
       · uno diverso in tutte e due.
     Le quattro figure stanno tutte nella stessa griglia, altrimenti si
     confronterebbero disegni di misura diversa. */
  rettangoli(sorte) {
    const lato = LATO_CONFRONTO
    const modoA = sorte.forse(0.6)       // stesso bordo / stessi quadretti
    const stesso = (a, b) => a.w === b.w && a.h === b.h

    for (const soggetto of sorte.mescola(RETTANGOLI.filter(r => r.w !== r.h))) {
      const prese = [soggetto]
      const prendi = tieni => {
        const buoni = RETTANGOLI.filter(r => !prese.some(p => stesso(p, r)) && tieni(r))
        if (!buoni.length) return null
        const scelto = sorte.uno(buoni)
        prese.push(scelto)
        return scelto
      }

      const buona = modoA
        ? prendi(r => r.giro === soggetto.giro && r.area !== soggetto.area)
        : prendi(r => r.area === soggetto.area && r.giro !== soggetto.giro)
      if (!buona) continue
      /* il girato c'è sempre: il soggetto non è mai un quadrato */
      const girato = prendi(r => r.w === soggetto.h && r.h === soggetto.w)
      const altra = modoA
        ? prendi(r => r.area === soggetto.area && r.giro !== soggetto.giro)
        : prendi(r => r.giro === soggetto.giro && r.area !== soggetto.area)
      const diversa = r => r.area !== soggetto.area && r.giro !== soggetto.giro
      /* per certi rettangoli l'altra grandezza non è condivisa da
         nessuno (8 quadretti, dentro sei caselle, li fa solo 2×4):
         invece di scartare il soggetto si mette un secondo lontano */
      const spaiata = altra || prendi(diversa)
      const lontana = prendi(diversa)
      if (!girato || !spaiata || !lontana) continue

      const perche = altra
        ? (modoA ? 'questo ha gli stessi quadretti, non lo stesso bordo'
          : 'questo ha lo stesso bordo, non gli stessi quadretti')
        : 'questo è diverso in tutte e due le cose'

      return domanda({
        testo: modoA ? CHIESTE.giro : CHIESTE.area,
        soggetto: scena(scenaFigura(soggetto.celle, lato, lato)),
        buona: scena(scenaFigura(buona.celle, lato, lato)),
        falsi: [
          scena(scenaFigura(girato.celle, lato, lato),
            'questo è lo stesso rettangolo girato: stesso bordo e stessi quadretti'),
          scena(scenaFigura(spaiata.celle, lato, lato), perche),
          scena(scenaFigura(lontana.celle, lato, lato),
            'questo è diverso in tutte e due le cose'),
        ],
        chiave: 'gri:confronto',
        aiuto: 'in un rettangolo i quadretti sono le righe per le colonne, il bordo è due volte la base più due volte l\'altezza',
        sorte,
      })
    }
    /* non capita: se capitasse, meglio il bordo che niente */
    return this.bordo(sorte)
  }

  /* ── grado 7: lo stesso confronto, su figure qualsiasi ──
     Qui non c'è formula: area e bordo si contano a dito su quattro
     figure storte. È la stessa domanda del grado 6 ma costa il doppio,
     e per questo sta in cima alla scaletta invece che in mezzo. */
  confronto(sorte) {
    const lato = 5
    const raccolta = []
    const viste = new Set()
    const aggiungi = celle => {
      const f = firma(celle)
      if (viste.has(f) || buchi(celle)) return
      viste.add(f)
      raccolta.push({ celle, f, area: celle.length, giro: perimetro(celle) })
    }
    /* qualche figura sicura, perché le coppie giuste ci siano sempre */
    aggiungi(normalizza([[0, 0], [1, 0], [0, 1], [1, 1]]))                       // 4 · 8
    aggiungi(normalizza([[0, 0], [1, 0], [2, 0], [3, 0]]))                       // 4 · 10
    aggiungi(normalizza([[0, 0], [0, 1], [1, 1], [2, 1]]))                       // 4 · 10
    aggiungi(normalizza([[0, 0], [1, 0], [0, 1], [1, 1], [2, 1]]))               // 5 · 10
    aggiungi(normalizza([[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]]))               // 5 · 12
    aggiungi(normalizza([[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]]))               // 5 · 12
    aggiungi(normalizza([[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]]))       // 6 · 10
    aggiungi(normalizza([[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1]]))  // 8 · 12
    for (let i = 0; i < 26; i++) {
      const c = passeggiata(sorte.fra(4, 8), sorte, 4)
      if (c) aggiungi(c)
    }

    const modoA = sorte.forse()          // stesso perimetro / stessa area
    for (const soggetto of sorte.mescola(raccolta)) {
      const altre = raccolta.filter(f => f.f !== soggetto.f)
      const stessoGiro = altre.filter(f => f.giro === soggetto.giro)
      const stessaArea = altre.filter(f => f.area === soggetto.area)

      const cerca = (lista, tieni) => {
        const buoni = lista.filter(tieni)
        return buoni.length ? sorte.uno(buoni) : null
      }
      const buona = modoA
        ? cerca(stessoGiro, f => f.area !== soggetto.area)
        : cerca(stessaArea, f => f.giro !== soggetto.giro)
      const gemella = cerca(stessoGiro, f => f.area === soggetto.area)          // uguale in tutto e due
      const altra = modoA
        ? cerca(stessaArea, f => f.giro !== soggetto.giro)
        : cerca(stessoGiro, f => f.area !== soggetto.area)
      const lontana = cerca(altre, f => f.giro !== soggetto.giro && f.area !== soggetto.area)
      const quattro = [buona, gemella, altra, lontana]
      if (quattro.some(f => !f)) continue
      if (new Set(quattro.map(f => f.f)).size !== 4) continue

      return domanda({
        testo: modoA ? CHIESTE.giro : CHIESTE.area,
        soggetto: scena(scenaFigura(soggetto.celle, lato, lato)),
        buona: scena(scenaFigura(buona.celle, lato, lato)),
        falsi: [
          scena(scenaFigura(gemella.celle, lato, lato),
            'questa ha lo stesso bordo, ma anche gli stessi quadretti'),
          scena(scenaFigura(altra.celle, lato, lato), modoA
            ? 'questa ha gli stessi quadretti, non lo stesso bordo'
            : 'questa ha lo stesso bordo, non gli stessi quadretti'),
          scena(scenaFigura(lontana.celle, lato, lato),
            'questa è diversa in tutte e due le cose'),
        ],
        chiave: 'gri:confronto-libero',
        aiuto: 'il bordo è il perimetro, i quadretti dentro sono l\'area: si contano separati',
        sorte,
      })
    }
    /* se la raccolta non ha offerto una quaterna, si chiede il bordo */
    return this.bordo(sorte)
  }
}

export default new Griglia()

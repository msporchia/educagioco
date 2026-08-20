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

   IL CONFRONTO NON C'È PIÙ, ed è la cosa più importante di questo
   file. «Quale di queste quattro ha gli stessi quadretti ma il bordo
   diverso?» sono otto conti a dito su figure che non hanno una forma
   da cui dedurre niente: il concetto si afferra in tre secondi, il
   minuto dopo lo occupa l'indice sullo schermo. Chi ha capito e chi
   non ha capito ci mettono lo stesso tempo, e sbaglia chi perde il
   conto — cioè la domanda misurava la pazienza. Era stata spostata in
   cima alla scaletta invece che tolta, e spostare non era la cura.

   QUELLO CHE RESTA È MISURARE, e per lo più su figure dove il conto si
   fa **a mente**: in un quadrato l'area è lato × lato e il giro è
   lato × 4, in un rettangolo righe × colonne e due volte la base più
   due volte l'altezza. Le figure storte restano dove servono davvero —
   il primo incontro, dove area e perimetro si imparano contando — e
   sono piccole, da quattro a nove quadretti.

   LA SCORCIATOIA SI INSEGNA QUANDO SERVE. Una domanda che si può fare
   con la formula porta una `dritta`, e la dritta si legge in due casi:
   se hai sbagliato, e se hai indovinato ma **ci hai messo troppo** —
   che è il segno che l'hai contata a dito. «6 × 6 = 36: in un quadrato
   l'area è lato per lato» detto a chi ha appena contato trentasei
   quadretti vale dieci volte lo stesso avviso letto prima.
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
  'area e perimetro a mente, sui rettangoli',
]

/* Le tipologie. I primi quattro tipi si giocano guardando la griglia e
   stanno in un gruppo loro; area e perimetro sono due parole di scuola
   e stanno nel gruppo che c'era già. Sono **due chiavi in tutto**, e
   ognuna torna due volte: al primo incontro si conta a dito una figura
   storta, al grado 6 si misura un rettangolo moltiplicando. È la
   stessa cosa da saper fare — la chiave del ripasso è il concetto, non
   la forma della figura — e a cambiare è solo come ci si arriva. */
const TIPI = [
  { chiave: 'gri:coordinate', nome: 'Le caselle: lettera e numero', sa: 'griglia', gradi: { 1: 1 } },
  { chiave: 'gri:direzioni', nome: 'Destra, sinistra, sopra e sotto', sa: 'griglia', gradi: { 2: 1 } },
  { chiave: 'gri:mosse', nome: 'Quante mosse servono', sa: 'griglia', gradi: { 3: 0.45 } },
  { chiave: 'gri:percorso', nome: 'Dove si arriva seguendo le frecce', sa: 'griglia', gradi: { 3: 0.55 } },
  { chiave: 'gri:area', nome: "L'area: i quadretti dentro", sa: 'area-perimetro', gradi: { 4: 1, 6: 0.5 } },
  { chiave: 'gri:perimetro', nome: 'Il perimetro: il giro del bordo', sa: 'area-perimetro', gradi: { 5: 1, 6: 0.5 } },
]

const somma = ([x, y], [dx, dy], k = 1) => [x + dx * k, y + dy * k]
const dentro = (l, a, [x, y]) => x >= 0 && y >= 0 && x < l && y < a
const uguali = (a, b) => a[0] === b[0] && a[1] === b[1]

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

/* ── le figure che si misurano a mente ── */

const rettangolo = (w, h) => {
  const celle = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) celle.push([x, y])
  return celle
}

/* Un rettangolo, o un quadrato — che è il caso in cui i due lati sono
   uguali, e l'unico che porta con sé una scorciatoia in più. Mai un
   lato solo: un 1×6 è una riga, e lì moltiplicare non si distingue dal
   contare. */
function rettangoloDa(sorte, min, max) {
  const w = sorte.fra(min, max)
  if (sorte.forse(0.45)) return misure(w, w)
  const h = sorte.fra(min, max)
  return misure(w, h === w ? (w === max ? w - 1 : w + 1) : h)
}

const misure = (w, h) => ({
  w, h, quadrato: w === h, celle: rettangolo(w, h),
  area: w * h, giro: 2 * (w + h),
})

/* Le scorciatoie, col conto già fatto dentro: «6 × 6 = 36» e non «lato
   per lato». Una regola senza il suo esempio si legge e non si ricorda,
   e questa arriva addosso a un numero che il bambino ha appena avuto
   sotto gli occhi. */
const DRITTE = {
  area: r => r.quadrato
    ? `in un quadrato l'area è lato per lato: ${r.w} × ${r.w} = ${r.area}`
    : `l'area di un rettangolo è le righe per le colonne: ${r.w} × ${r.h} = ${r.area}`,
  giro: r => r.quadrato
    ? `il giro di un quadrato è lato per 4: ${r.w} × 4 = ${r.giro}`
    : `il giro di un rettangolo è due volte la base più due volte l'altezza: ${r.w} + ${r.h} = ${r.w + r.h}, e il doppio fa ${r.giro}`,
}

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
      /* QUANTO È COMPLICATO OGNI GRADO, da 0 a 100 — la scala è una
         sola per tutte le materie, e serve a confrontare questa riga
         con quelle di tutti gli altri moduli. Zero è il primo giorno
         di materna, cento la fine della primaria: dodici punti e mezzo
         per anno di scuola. Non dice a chi arriva — quello lo decide
         la finestra dell'età di chi gioca (`nucleo/classi.js`). */
      /* il grado 6 sta a 69 (nove anni e mezzo) e non a 75: misurare
         un rettangolo moltiplicando è di terza-quarta, mentre il
         confronto che stava qui prima era roba da dieci anni e mezzo
         — e non perché fosse più profondo, ma perché era più lungo. */
      livelli: [25, 29, 33, 56, 63, 69],
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
      /* al grado 6 la stessa cosa si misura invece di contarla, e la
         figura è sempre un rettangolo o un quadrato. Sotto, un terzo
         delle volte, il rettangolo compare lo stesso: è lì che la
         formula si incontra la prima volta, mentre contare è ancora
         una strada onesta. */
      case 'gri:area': return grado >= 6 ? this.misura(sorte, 'area') : this.area(sorte, sorte.forse(0.35))
      case 'gri:perimetro': return grado >= 6 ? this.misura(sorte, 'giro') : this.bordo(sorte, sorte.forse(0.35))
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

  /* ── grado 4: l'area, i quadretti dentro ──
     Un terzo delle volte la figura è un rettangolo piccolo: la domanda
     si risolve uguale contando, ma la dritta in coda dice che c'era
     una strada più corta. È il primo posto dove quella strada si vede,
     e si vede **dopo** aver contato — che è l'unico momento in cui una
     scorciatoia significa qualcosa. */
  area(sorte, rett = false) {
    const r = rett ? rettangoloDa(sorte, 2, 4) : null
    const quante = r ? r.area : sorte.fra(4, 9)
    const celle = r ? r.celle : figura(quante, sorte, 4)
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
      testo: r ? `Quanti quadretti formano questo ${r.quadrato ? 'quadrato' : 'rettangolo'}?`
        : 'Quanti quadretti formano questa figura?',
      soggetto: scena(scenaFigura(celle, lato, lato)),
      buona: testo(quante),
      falsi: falsi.slice(0, 3).map(p => testo(p.v, p.perche)),
      chiave: 'gri:area',
      aiuto: r ? DRITTE.area(r)
        : 'l\'area sono i quadretti colorati: contali uno per uno, anche quelli in mezzo',
      dritta: r ? DRITTE.area(r) : undefined,
      sorte,
    })
  }

  /* ── grado 5: il perimetro, il giro del bordo ── */
  bordo(sorte, rett = false) {
    const r = rett ? rettangoloDa(sorte, 2, 4) : null
    const quante = r ? r.area : sorte.fra(4, 8)
    const celle = r ? r.celle : figura(quante, sorte, 4)
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
      aiuto: r ? DRITTE.giro(r)
        : 'segui il contorno e conta un lato di quadretto per volta, fino a tornare al via',
      dritta: r ? DRITTE.giro(r) : undefined,
      sorte,
    })
  }

  /* ── grado 6: misurare, non contare ──
     Qui la figura è sempre un rettangolo o un quadrato, e i lati
     arrivano a otto: l'area può fare 64, e nessuno conta 64 quadretti
     — si moltiplica. È la sola differenza col grado 4, ed è tutta la
     progressione: la stessa cosa da sapere, con dei numeri che
     costringono alla strada corta.

     I FALSI SONO I TRE MODI VERI DI SBAGLIARE: dare l'altro dei due
     numeri (l'area quando si chiede il giro, e viceversa) — che è
     l'errore che questa materia porta da sempre — sommare invece di
     moltiplicare, e perdere per strada un lato o una riga. */
  misura(sorte, quale) {
    const r = rettangoloDa(sorte, 2, 8)
    const lato = Math.max(r.w, r.h) + 1
    const cosa = r.quadrato ? 'questo quadrato' : 'questo rettangolo'
    const giusto = quale === 'area' ? r.area : r.giro

    const proposte = quale === 'area' ? [
      { v: r.giro, perche: 'quello è il giro del bordo, non i quadretti dentro' },
      { v: r.w + r.h, perche: 'i quadretti si moltiplicano, non si sommano' },
      { v: r.area - r.w, perche: 'ti è sfuggita una riga intera' },
      { v: r.area + r.w, perche: 'una riga l\'hai contata due volte' },
      /* per le figure piccole i due di sopra cadono spesso addosso a
         un altro candidato: questi tengono la quaterna piena */
      { v: r.area - 1, perche: 'ricontrolla: te n\'è sfuggito uno' },
      { v: r.area + 1, perche: 'ricontrolla: uno l\'hai contato due volte' },
    ] : [
      { v: r.area, perche: 'quelli sono i quadretti dentro: quella è l\'area' },
      { v: r.w + r.h, perche: 'quella è la base più l\'altezza: il giro le conta tutte e due due volte' },
      { v: r.giro - r.w, perche: 'manca un lato: il giro ne ha quattro' },
      { v: r.giro + 2, perche: 'un angolo contato due volte: ogni lato si conta una volta sola' },
      { v: r.giro - 2, perche: 'due lati saltati: segui il contorno senza staccare il dito' },
    ]

    const visti = new Set([giusto])
    const falsi = []
    for (const c of proposte) {
      if (c.v < 1 || visti.has(c.v)) continue
      visti.add(c.v)
      falsi.push(c)
    }

    return domanda({
      testo: quale === 'area' ? `Quanti quadretti ci sono dentro ${cosa}?`
        : `Quanto è lungo il bordo di ${cosa}?`,
      soggetto: scena(scenaFigura(r.celle, lato, lato)),
      buona: testo(giusto),
      falsi: falsi.slice(0, 3).map(c => testo(c.v, c.perche)),
      chiave: quale === 'area' ? 'gri:area' : 'gri:perimetro',
      aiuto: DRITTE[quale](r),
      dritta: DRITTE[quale](r),
      sorte,
    })
  }
}

export default new Griglia()

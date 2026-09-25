/* ═══════════════════════════════════════════════════════════════════
   SOLDI E DECIMALI — gli euro sono il modo in cui un bambino incontra
   i numeri con la virgola, prima ancora di sapere che esistono.

   SEI GRADI, e non è un crescendo di una sola cosa:
     1. quanto fanno queste monete e banconote (i conti tondi);
     2. il resto — pagare con una banconota e capire quanto torna;
     3. quanto costano più cose, e quale costa di più;
     4. lo stesso confronto, ma sui numeri con la virgola senza euro;
     5. il valore delle cifre dopo la virgola (decimi, centesimi);
     6. i decimali in ordine — sulla linea, e arrotondare.

   NIENTE VIRGOLA MOBILE. Ogni conto è fatto in centesimi (interi):
   `340` e non `3.4`. Si divide per 100 **solo per scrivere** il
   risultato, con `euro()` — mai per calcolare — e per questo non esce
   mai un «2,9999999999996» al posto di «3».

   IL FALSO PIÙ VERO DI TUTTI È IL RIPORTO PERSO: 1 € + 80 c + 70 c
   fanno 2,50 €, ma chi somma gli euro e i centesimi separatamente
   senza riportare scrive «1,150 €» — la stessa identica dimenticanza
   ricompare nel resto (si scorda l'euro preso in prestito) e in
   «quanto costano N cose» (si moltiplicano euro e centesimi a parte).
   Non sono tre errori: è lo stesso, vestito da tre domande diverse.

   L'ALTRO FALSO VERO, dal grado 3 in su, è la cifra che inganna:
   «3,45 è più di 3,5» perché 45 sembra più grande di 5 — e non è
   vero, perché il decimo conta più del centesimo. `trappolaCifre()`
   lo costruisce apposta, con e senza il simbolo dell'euro.

   DUE SAPERI, PERCHÉ SONO DUE COSE DIVERSE. `denaro` (riconoscere le
   monete, contare, dare il resto: nasce spento e si accende in terza,
   quando a scuola si comincia con l'euro) e `decimali` (il numero con
   la virgola come numero, non come prezzo: si accende in quarta). Un
   bambino può sapere contare le monete senza sapere cos'è un decimo, e
   il contrario capita raramente ma capita — sono due gradini diversi
   della stessa scala, e li spegne chi ne ha bisogno.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo, scena, emoji } from '../nucleo/domanda.js'
import { PITTORI_SOLDI } from '../grafica/pittori/soldi.js'

/* ── scrivere un euro, senza virgola mobile ──
   `cents` è sempre un intero. Zero centesimi non si scrive («5 €» e
   non «5,00 €», come si legge un cartellino vero); altrimenti sempre
   due cifre dopo la virgola, perché un euro ne ha sempre due. */
function euro(cents) {
  const n = Math.round(cents)
  const neg = n < 0
  const c = Math.abs(n)
  const intero = Math.floor(c / 100)
  const resto = c % 100
  const s = resto === 0 ? `${intero}` : `${intero},${String(resto).padStart(2, '0')}`
  return `${neg ? '-' : ''}${s} €`
}

const capitalizza = s => s.charAt(0).toUpperCase() + s.slice(1)

/* «un cornetto» → «il cornetto», «l'adesivo» se comincia per vocale;
   «una mela» → «la mela». L'articolo indeterminato «un» non si elide
   mai (è sempre «un», anche davanti a vocale): quello determinato sì. */
function conArticolo(s) {
  const femminile = s.startsWith('una ')
  const resto = femminile ? s.slice(4) : s.slice(3)
  const vocale = /^[aeiouAEIOU]/.test(resto)
  return (vocale ? "l'" : femminile ? 'la ' : 'il ') + resto
}

/* «un cornetto» → «l'uno», «una mela» → «l'una»: non dipende dalla
   parola che segue, sempre le stesse due forme. */
const pezzoDi = s => s.startsWith('una ') ? "l'una" : "l'uno"

/* ── una cassa a due valori: filtra i doppioni contro la risposta
   buona e fra loro, e si ferma quando ne ha presi abbastanza. Ogni
   generatore di errori qui dentro produce candidati anche ridondanti
   apposta — è più semplice scriverli così — e questa è l'unica cosa
   che deve ricordarsi di scartare i ripetuti. */
function scartaDoppi(candidati, buonaStr, quanti) {
  const visti = new Set([buonaStr])
  const out = []
  for (const [str, perche] of candidati) {
    if (visti.has(str)) continue
    visti.add(str)
    out.push(testo(str, perche))
    if (out.length >= quanti) break
  }
  return out
}

/* ── le cose che si comprano ──
   Dodici oggetti di tutti i giorni, con la loro forma già scritta
   (singolare, plurale) invece che derivata: «un peluche» fa «i
   peluche» e non «i peluchi», e una regola di grammatica dentro un
   generatore è il modo più corto di scrivere «i gattoi». */
const COSE = [
  { emoji: '🥐', singolare: 'un cornetto', plurale: 'i cornetti' },
  { emoji: '📓', singolare: 'un quaderno', plurale: 'i quaderni' },
  { emoji: '🍎', singolare: 'una mela', plurale: 'le mele' },
  { emoji: '🍦', singolare: 'un gelato', plurale: 'i gelati' },
  { emoji: '⚽', singolare: 'un pallone', plurale: 'i palloni' },
  { emoji: '📗', singolare: 'un fumetto', plurale: 'i fumetti' },
  { emoji: '🥤', singolare: 'una bibita', plurale: 'le bibite' },
  { emoji: '⭐', singolare: 'un adesivo', plurale: 'gli adesivi' },
  { emoji: '✏️', singolare: 'una matita', plurale: 'le matite' },
  { emoji: '🍬', singolare: 'una caramella', plurale: 'le caramelle' },
  { emoji: '🎈', singolare: 'un palloncino', plurale: 'i palloncini' },
  { emoji: '🧸', singolare: 'un peluche', plurale: 'i peluche' },
]

/* prezzi tipici di una cosa piccola, in centesimi: né due centesimi né
   duecento euro, quello che costa davvero una merenda o un fumetto */
const PREZZI = [60, 75, 80, 90, 95, 110, 120, 130, 150, 175, 180, 199, 220, 250, 280, 300]

/* ══════════════ grado 1-2 — le monete e il resto ══════════════ */

/* i tagli di monete e banconote che esistono davvero. `facile` è il
   sottoinsieme del grado 1: niente centesimi piccoli, che è quello che
   fa sballare i conti tondi promessi da quel grado. */
const TAGLI = [
  { cents: 1, testo: '1 c' }, { cents: 2, testo: '2 c' }, { cents: 5, testo: '5 c' },
  { cents: 10, testo: '10 c' }, { cents: 20, testo: '20 c' }, { cents: 50, testo: '50 c' },
  { cents: 100, testo: '1 €' }, { cents: 200, testo: '2 €' },
  { cents: 500, testo: '5 €' }, { cents: 1000, testo: '10 €' }, { cents: 2000, testo: '20 €' },
]
const TAGLI_FACILI = TAGLI.filter(t => t.cents >= 10 && t.cents <= 500)

/* quanto fanno queste monete e banconote — con o senza riporto */
function conta(sorte, grado) {
  const facile = grado <= 1
  const pool = facile ? TAGLI_FACILI : TAGLI
  const n = facile ? sorte.fra(2, 3) : sorte.fra(3, 5)
  const pezzi = Array.from({ length: n }, () => sorte.uno(pool))
  const totale = pezzi.reduce((s, t) => s + t.cents, 0)
  const buonaStr = euro(totale)

  /* il riporto perso: euro e centesimi sommati separatamente, scritti
     uno dopo l'altro senza controllare che i centesimi non sfondino il
     99 — «1,150 €» al posto di «2,50 €» */
  const euroPz = pezzi.filter(t => t.cents >= 100).reduce((s, t) => s + t.cents, 0) / 100
  const centPz = pezzi.filter(t => t.cents < 100).reduce((s, t) => s + t.cents, 0)
  const candidati = [
    [euro(totale - sorte.uno(pezzi).cents), 'hai contato un pezzo di meno'],
    [euro(totale + sorte.uno(pool).cents), 'hai contato un pezzo che non c\'era, o uno di troppo'],
  ]
  /* il riporto perso si vede solo quando i centesimi sfondano il 99:
     sotto quella soglia «euroPz,centPz» è la stessa scrittura corretta
     senza lo zero davanti, non un errore — e presentarlo come una
     risposta diversa sarebbe un refuso, non un tranello */
  if (centPz >= 100)
    candidati.unshift([`${euroPz},${centPz} €`,
      'hai contato gli euro e i centesimi separati: quando i centesimi superano 99 se ne va un euro in più'])

  const elenco = pezzi.map(t => t.testo).join(' + ')
  return domanda({
    testo: sorte.forse(0.5) ? 'Quanto fanno in tutto?' : 'Quante monete e banconote hai in mano: quanto fanno?',
    soggetto: sorte.forse(0.5)
      ? { testo: elenco }
      : scena({ che: 'monete', pezzi }),
    buona: testo(buonaStr),
    falsi: scartaDoppi(candidati, buonaStr, 2),
    chiave: 'sol:conta',
    aiuto: 'somma prima gli euro, poi i centesimi: se i centesimi arrivano a 100 o più, un euro passa dall\'altra parte',
    sorte,
  })
}

/* il resto: si paga con una banconota, e torna la differenza */
function resto(sorte, grado) {
  const item = sorte.uno(COSE)
  const paid = sorte.uno(grado <= 2 ? [5, 10] : [5, 10, 20])
  const costEuro = sorte.fra(0, paid - 1)
  /* mai una cosa gratis: se il grado facile pesca 0 € e 0 c insieme, il
     prezzo sarebbe zero e la domanda non ha più senso */
  let costCent = grado <= 2 ? sorte.uno([0, 10, 20, 25, 50, 75]) : sorte.fra(1, 99)
  if (costEuro === 0 && costCent === 0) costCent = sorte.uno([10, 20, 25, 50, 75])
  const costoCents = costEuro * 100 + costCent
  const restoCents = paid * 100 - costoCents
  const buonaStr = euro(restoCents)

  const candidati = []
  if (costCent > 0) {
    /* il prestito scordato: si toglie il resto dei centesimi ma non si
       leva l'euro preso in prestito per farlo — 2,60 € al posto di
       1,60 €, pagando 5 € una cosa da 3,40 € */
    candidati.push([`${paid - costEuro},${String(100 - costCent).padStart(2, '0')} €`,
      'hai scordato il prestito: per togliere i centesimi ne hai preso uno in prestito dagli euro, e quell\'euro va tolto anche là'])
    candidati.push([euro((paid - costEuro) * 100),
      'hai ignorato i centesimi del prezzo, e hai sottratto solo gli euro'])
  } else {
    candidati.push([euro(restoCents + 100), 'hai sbagliato di un euro'])
  }
  candidati.push([euro(restoCents + 10), 'hai sbagliato il conto di dieci centesimi'])

  return domanda({
    testo: `Paghi con ${euro(paid * 100)} ${item.singolare} che costa ${euro(costoCents)}. Quanto resto ricevi?`,
    soggetto: emoji(item.emoji),
    buona: testo(buonaStr),
    falsi: scartaDoppi(candidati, buonaStr, 2),
    chiave: 'sol:resto',
    aiuto: 'arriva prima all\'euro tondo sopra il prezzo, poi conta quanto manca fino ai soldi che hai dato',
    sorte,
  })
}

/* ══════════════ grado 3-4 — quanto costano, e chi costa di più ══════════════ */

/* quanto costano N cose */
function costo(sorte, grado) {
  const item = sorte.uno(COSE)
  const prezzo = sorte.uno(PREZZI)
  const n = sorte.fra(2, grado <= 3 ? 4 : 6)
  const totale = prezzo * n
  const buonaStr = euro(totale)

  const eu = Math.floor(prezzo / 100), ce = prezzo % 100
  const candidati = [
    [euro(prezzo * (n - 1)), `hai contato ${n - 1}, non ${n}`],
    [euro(prezzo * (n + 1)), `hai contato ${n + 1}, non ${n}`],
  ]
  /* stesso guasto della «riporto perso» qui sopra: sotto i 100
     centesimi la scrittura separata è quella corretta, non un errore */
  if (ce * n >= 100)
    candidati.unshift([`${eu * n},${ce * n} €`,
      'hai moltiplicato gli euro e i centesimi separati: se i centesimi sfondano il 99, un euro passa dall\'altra parte'])

  return domanda({
    testo: `${capitalizza(item.plurale)} costano ${euro(prezzo)} ${pezzoDi(item.singolare)}. `
         + `Quanto costano ${n} ${item.plurale.replace(/^(i|le|gli)\s+/, '')}?`,
    soggetto: emoji(item.emoji),
    buona: testo(buonaStr),
    falsi: scartaDoppi(candidati, buonaStr, 2),
    chiave: 'sol:costo',
    aiuto: 'moltiplica gli euro per N e i centesimi per N: se il totale dei centesimi passa i 99, quell\'euro in più va aggiunto',
    sorte,
  })
}

/* ── la trappola delle cifre: «3,45» sembra più grande di «3,5»
   perché ha più cifre, ma vale meno. Stesso intero, un numero scritto
   con un decimale solo (il vero maggiore) e uno con due (il finto
   maggiore, sempre appena sotto). `d1` va da 2 in su: con `d1` a 1 il
   confronto sarebbe con un numero a due cifre che comincia per 0, e
   non è la stessa trappola. */
function trappolaCifre(sorte, interoMax) {
  const intero = sorte.fra(0, interoMax)
  const d1 = sorte.fra(2, 9)
  const d2 = sorte.fra((d1 - 1) * 10 + 1, d1 * 10 - 1)
  return {
    intero,
    maggiore: String(d1),
    minore: String(d2).padStart(2, '0'),
  }
}

/* quale prezzo è più alto */
function confronto(sorte) {
  const { intero, maggiore, minore } = trappolaCifre(sorte, 25)
  const [itemA, itemB] = sorte.alcuni(COSE, 2)
  const aMaggiore = sorte.forse(0.5)
  const prezzoA = aMaggiore ? maggiore : minore
  const prezzoB = aMaggiore ? minore : maggiore
  const vincente = aMaggiore ? itemA : itemB
  const perdente = aMaggiore ? itemB : itemA
  const prezzoPerdente = aMaggiore ? prezzoB : prezzoA

  return domanda({
    testo: `${capitalizza(conArticolo(itemA.singolare))} costa ${intero},${prezzoA} €, `
         + `${conArticolo(itemB.singolare)} costa ${intero},${prezzoB} €. Quale costa di più?`,
    buona: testo(capitalizza(conArticolo(vincente.singolare))),
    falsi: [testo(capitalizza(conArticolo(perdente.singolare)),
      `${capitalizza(conArticolo(perdente.singolare))} costa ${intero},${prezzoPerdente} €: ha più cifre dopo la virgola, ma la prima cifra dopo la virgola conta più delle altre`)],
    chiave: 'sol:confronto',
    aiuto: 'guarda la prima cifra dopo la virgola: chi ce l\'ha più grande costa di più, anche se il numero dell\'altro sembra più lungo',
    sorte,
  })
}

/* ══════════════ grado 4 — lo stesso confronto, sui numeri ══════════════ */

/* la stessa trappola, senza il vestito dei soldi: qui a ingannare non
   c'è nemmeno il contesto del negozio, solo il numero */
function confrontoNumeri(sorte) {
  const { intero, maggiore, minore } = trappolaCifre(sorte, 30)
  const numMaggiore = `${intero},${maggiore}`
  const numMinore = `${intero},${minore}`
  const chiediMaggiore = sorte.forse(0.5)

  /* un terzo numero, chiaramente più piccolo di tutti e due — non è
     un secondo tranello, serve solo a non far diventare la domanda una
     scelta fra due tasti sempre uguale */
  const terzo = sorte.fra(0, Math.max(0, intero - 1))
  const numTerzo = `${terzo},${sorte.fra(1, 89).toString().padStart(2, '0')}`

  const target = chiediMaggiore ? numMaggiore : numMinore
  const altro = chiediMaggiore ? numMinore : numMaggiore

  return domanda({
    testo: chiediMaggiore ? 'Quale numero è il più grande?' : 'Quale numero è il più piccolo?',
    buona: testo(target),
    falsi: scartaDoppi([
      [altro, `${altro} ha ${chiediMaggiore ? 'più' : 'meno'} cifre dopo la virgola, ma non è quello che conta: guarda la prima cifra dopo la virgola`],
      [numTerzo, 'guarda prima la parte intera, prima della virgola'],
    ], target, 2),
    chiave: 'sol:confronto-numeri',
    aiuto: 'confronta prima la parte intera, poi la prima cifra dopo la virgola: quella conta più di tutte le altre insieme',
    sorte,
  })
}

/* ══════════════ grado 5 — il valore delle cifre ══════════════ */

const valoreDi = (cifra, posizione) => posizione === 'decimi' ? `0,${cifra}` : `0,0${cifra}`

/* «1 decimo», non «1 decimi»: l'unica cifra che cambia l'accordo è 1,
   ed è anche la più facile da pescare — quindi la più probabile di
   incontrare storta se non ci si pensa apposta. */
const SINGOLARE = { decimi: 'decimo', centesimi: 'centesimo' }
const paroleDi = (cifra, posizione) => cifra === 1 ? SINGOLARE[posizione] : posizione

/* in 4,37 quanto vale il 3? Decimi o centesimi, e non è la stessa cosa:
   un bambino che confonde le due posizioni sbaglia di dieci volte.
   Decimi e centesimi partono da 1 e non da 0: con uno zero in una
   delle due posizioni «quanto vale» avrebbe la stessa risposta —
   zero — chiesto in due posti diversi, e la domanda smetterebbe di
   avere un verso giusto e uno storto. */
function cifre(sorte) {
  const intero = sorte.fra(0, 9)
  let decimi, centesimi
  do { decimi = sorte.fra(1, 9) } while (decimi === intero)
  do { centesimi = sorte.fra(1, 9) } while (centesimi === intero || centesimi === decimi)
  const numero = `${intero},${decimi}${centesimi}`

  const chiediDecimi = sorte.forse(0.5)
  const cifraChiesta = chiediDecimi ? decimi : centesimi
  const posizione = chiediDecimi ? 'decimi' : 'centesimi'
  const altraCifra = chiediDecimi ? centesimi : decimi
  const altraPosizione = chiediDecimi ? 'centesimi' : 'decimi'
  const dice = (cifra, pos) => `${cifra} ${paroleDi(cifra, pos)} (${valoreDi(cifra, pos)})`
  const buonaStr = dice(cifraChiesta, posizione)

  return domanda({
    testo: `Nel numero ${numero}, quanto vale la cifra ${cifraChiesta}?`,
    buona: testo(buonaStr),
    falsi: scartaDoppi([
      [dice(cifraChiesta, altraPosizione),
        `in ${numero} il ${cifraChiesta} è ${chiediDecimi ? 'la prima' : 'la seconda'} cifra dopo la virgola: sono i ${posizione}, non i ${altraPosizione}`],
      [dice(altraCifra, posizione),
        `guarda bene ${numero}: il numero dei ${posizione} è ${cifraChiesta}, non ${altraCifra}`],
      [`${cifraChiesta} unità`, 'dopo la virgola non ci sono più le unità: si chiamano decimi e centesimi'],
    ], buonaStr, 2),
    chiave: 'sol:cifre',
    aiuto: `dopo la virgola la prima cifra sono i decimi e la seconda i centesimi: in ${numero} il ${decimi} vale 0,${decimi} e il ${centesimi} vale 0,0${centesimi}`,
    sorte,
  })
}

/* ══════════════ grado 6 — in ordine, e arrotondare ══════════════ */

/* la linea dei numeri: tre punti su un segmento intero diviso in
   decimi, e si chiede quale sia un decimale preciso */
function linea(sorte) {
  const da = sorte.fra(0, 9)
  const posizioni = new Set()
  while (posizioni.size < 3) posizioni.add(sorte.fra(1, 9))
  const scelte = [...posizioni]
  const lettere = ['A', 'B', 'C']
  const punti = scelte.map((pos, i) => ({ lettera: lettere[i], pos: pos / 10, decimo: pos }))
  const target = sorte.uno(punti)

  return domanda({
    testo: `Quale punto sulla linea è il numero ${da},${target.decimo}?`,
    soggetto: scena({ che: 'linea-numeri', da, a: da + 1, punti }),
    buona: testo(target.lettera),
    falsi: punti.filter(pt => pt !== target).map(pt =>
      testo(pt.lettera, `il punto ${pt.lettera} è a ${da},${pt.decimo}, non a ${da},${target.decimo}`)),
    chiave: 'sol:linea',
    aiuto: `ogni tacca fra ${da} e ${da + 1} vale un decimo: si contano le tacche a partire da ${da}`,
    sorte,
  })
}

/* la stessa cosa messa in fila, senza disegno */
function ordina(sorte) {
  const intero = sorte.fra(0, 9)
  const fracs = new Set()
  while (fracs.size < 3) fracs.add(sorte.fra(1, 99))
  const arr = [...fracs]
  const chiediMin = sorte.forse(0.5)
  const target = chiediMin ? Math.min(...arr) : Math.max(...arr)
  const numDi = f => `${intero},${String(f).padStart(2, '0')}`

  return domanda({
    testo: chiediMin ? 'Quale di questi numeri è il più piccolo?' : 'Quale di questi numeri è il più grande?',
    buona: testo(numDi(target)),
    falsi: arr.filter(f => f !== target).map(f =>
      testo(numDi(f), `${numDi(f)} non è ${chiediMin ? 'il più piccolo' : 'il più grande'}: guarda le due cifre dopo la virgola, non solo una`)),
    chiave: 'sol:linea',
    aiuto: 'con la stessa parte intera, confronta prima i decimi e poi i centesimi, come si fa con le decine e le unità',
    sorte,
  })
}

/* arrotondare — all'euro, o alla prima cifra decimale. Tutta la
   matematica resta sugli interi: `frac` sono i centesimi (0-99) e
   la soglia del riporto è 50, mai un `Math.round` su un numero con la
   virgola. */
function arrotonda(sorte) {
  const intero = sorte.fra(0, 8)
  const decimi = sorte.fra(0, 9)
  const centesimi = sorte.fra(0, 9)
  const frac = decimi * 10 + centesimi

  if (sorte.forse(0.5)) {
    /* all'euro più vicino */
    const su = frac >= 50
    const rotondo = su ? intero + 1 : intero
    const altro = su ? intero : intero + 1
    const numero = `${intero},${decimi}${centesimi} €`
    return domanda({
      testo: `Circa quanto costa: arrotonda ${numero} all'euro più vicino.`,
      buona: testo(`${rotondo} €`),
      falsi: scartaDoppi([
        [`${altro} €`, su
          ? `${numero} ha almeno 50 centesimi: si arrotonda su, a ${rotondo} €`
          : `${numero} ha meno di 50 centesimi: si arrotonda giù, a ${rotondo} €`],
        [`${rotondo + (su ? 1 : -1)} €`, 'sei andato di un euro di troppo'],
      ], `${rotondo} €`, 2),
      chiave: 'sol:arrotonda',
      aiuto: 'guarda i centesimi: da 50 in su si arrotonda all\'euro sopra, sotto 50 a quello sotto',
      sorte,
    })
  }

  /* alla prima cifra decimale: se i centesimi arrivano a 5 o più, il
     decimo sale di uno — e se il decimo era già 9, sale anche l'intero */
  const su = centesimi >= 5
  let decimiR = su ? decimi + 1 : decimi
  let interoR = intero
  if (decimiR === 10) { decimiR = 0; interoR += 1 }
  const numero = `${intero},${decimi}${centesimi}`
  const buonaStr = `${interoR},${decimiR}`
  const troncato = `${intero},${decimi}`

  return domanda({
    testo: `Arrotonda ${numero} alla prima cifra dopo la virgola.`,
    buona: testo(buonaStr),
    falsi: scartaDoppi([
      [troncato, 'hai solo tolto i centesimi, senza controllare se dovevano far salire il decimo'],
      [`${interoR},${(decimiR + 1) % 10}`, 'hai arrotondato di un decimo di troppo'],
    ], buonaStr, 2),
    chiave: 'sol:arrotonda',
    aiuto: 'guarda il numero dopo il decimo, cioè i centesimi: da 5 in su il decimo sale di uno',
    sorte,
  })
}

/* ── che cosa si chiede a ogni grado ── */
const SCALETTA = [
  'quanto fanno queste monete e banconote',
  'il resto',
  'quanto costano più cose, e quale costa di più',
  'i numeri con la virgola: quale è più grande',
  'il valore delle cifre dopo la virgola',
  'i decimali in ordine, e arrotondare',
]

/* Le tipologie. `denaro` e `decimali` sono due sapere diversi apposta
   (vedi il cappello del file): le prime quattro chiedono di saper
   maneggiare i soldi, le ultime quattro di sapere cos'è un numero con
   la virgola — e un bambino può avere l'uno senza l'altro. */
const TIPI = [
  { chiave: 'sol:conta', nome: 'Quanto fanno monete e banconote', sa: 'denaro', gradi: { 1: 1, 2: 0.3 } },
  { chiave: 'sol:resto', nome: 'Il resto', sa: 'denaro', gradi: { 2: 0.7, 3: 0.3 } },
  { chiave: 'sol:costo', nome: 'Quanto costano più cose', sa: 'denaro', gradi: { 3: 0.45, 4: 0.2 } },
  { chiave: 'sol:confronto', nome: 'Quale prezzo è più alto', sa: 'denaro', gradi: { 3: 0.25, 4: 0.3 } },
  { chiave: 'sol:confronto-numeri', nome: 'Quale numero con la virgola è più grande', sa: 'decimali', gradi: { 4: 0.5, 5: 0.35 } },
  { chiave: 'sol:cifre', nome: 'Il valore delle cifre dopo la virgola', sa: 'decimali', gradi: { 5: 0.65, 6: 0.2 } },
  { chiave: 'sol:linea', nome: 'I decimali sulla linea e in ordine', sa: 'decimali', gradi: { 6: 0.45 } },
  { chiave: 'sol:arrotonda', nome: "Arrotondare all'euro o al decimo", sa: 'decimali', gradi: { 6: 0.35 } },
]

class Soldi extends Modulo {
  constructor() {
    super({
      id: 'soldi',
      nome: 'Soldi e decimali',
      icona: '💶',
      materia: 'matematica',
      chiaro: 'contare le monete, dare il resto, confrontare prezzi, e i numeri con la virgola',
      scaletta: SCALETTA,
      /* QUANTO È COMPLICATO OGNI GRADO, da 0 a 100 — la scala è una
         sola per tutte le materie. Zero è il primo giorno di materna,
         cento la fine della primaria: dodici punti e mezzo per anno.
         Il conto tondo delle monete è di seconda-terza (38-44), il
         resto e i confronti di terza-quarta (50-57), i numeri con la
         virgola senza euro di quarta-quinta (57-72) — la stessa
         scaletta di cui parla `CLAUDE.md` per questo modulo. */
      livelli: [38, 44, 50, 57, 64, 72],
      tipi: TIPI,
      pittori: PITTORI_SOLDI,
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'sol:conta': return conta(sorte, grado)
      case 'sol:resto': return resto(sorte, grado)
      case 'sol:costo': return costo(sorte, grado)
      case 'sol:confronto': return confronto(sorte)
      case 'sol:confronto-numeri': return confrontoNumeri(sorte)
      case 'sol:cifre': return cifre(sorte)
      case 'sol:linea': return sorte.forse(0.5) ? linea(sorte) : ordina(sorte)
      case 'sol:arrotonda': return arrotonda(sorte)
      default: return conta(sorte, grado)
    }
  }
}

export default new Soldi()

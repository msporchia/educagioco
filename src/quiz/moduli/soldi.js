/* ═══════════════════════════════════════════════════════════════════
   SOLDI E DECIMALI — gli euro sono il modo in cui un bambino incontra
   i numeri con la virgola, prima ancora di sapere che esistono.

   UNDICI GRADI, e non è un crescendo di una sola cosa:
     1. quanto fanno queste monete e banconote (i conti tondi);
     2. il resto — pagare con una banconota e capire quanto torna;
     3. quanto costano più cose, e quale costa di più;
     4. lo stesso confronto, ma sui numeri con la virgola senza euro;
     5. il valore delle cifre dopo la virgola (decimi, centesimi);
     6. i decimali in ordine — sulla linea, e arrotondare;
     7. quanto costa una sola cosa, dal prezzo di più (la divisione);
     8. quanto costano tante cose, dal prezzo di poche (la proporzione);
     9. cosa conviene comprare, a parità di quantità o di soldi;
     10. lo stesso confronto quando il peso è in grammi e non in chili;
     11. quale offerta conviene — «prendi 3 paghi 2» contro uno sconto.

   LA SPESA FURBA (7-11) è un salto: non basta più sapere fare il conto,
   bisogna scegliere QUALE conto fare. «2 kg a 5 €» contro «1 kg a 3 €»
   non è un'operazione — è capire che il numero da guardare è il prezzo
   per kg, non quello scritto sul cartellino né la quantità. Per questo
   dal grado 9 in su tre risposte sono sempre le stesse forme — la prima
   confezione, la seconda, «costano uguale» — e **«costano uguale» è la
   giusta una volta su cinque circa**: se non capitasse mai, un bambino
   imparerebbe a scartarla senza guardare i numeri, come già visto con
   «non si può sapere» nelle bilance.

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

   L'ALTRO FALSO VERO, dal grado 4 in su, è la cifra che inganna:
   «3,45 è più di 3,5» perché 45 sembra più grande di 5 — e non è
   vero, perché il decimo conta più del centesimo. `trappolaCifre()`
   lo costruisce apposta, sui numeri nudi: un prezzo vero ha sempre due
   cifre dopo la virgola, e sui cartellini l'errore vero è un altro —
   guardare i centesimi prima degli euro (vedi `confronto`).

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

/* quanto costa davvero ogni cosa, in centesimi: la fascia di un negozio
   vero. Serve a tutte le domande che mettono un prezzo accanto a una
   cosa — una caramella da quindici euro, o un peluche da dieci
   centesimi, fanno ridere invece di far pensare. */
const FASCE = {
  'un cornetto': [80, 250], 'un quaderno': [100, 400], 'una mela': [40, 120],
  'un gelato': [150, 400], 'un pallone': [600, 2500], 'un fumetto': [300, 800],
  'una bibita': [100, 300], 'un adesivo': [30, 200], 'una matita': [50, 200],
  'una caramella': [10, 100], 'un palloncino': [50, 300], 'un peluche': [600, 3000],
}

/* un prezzo per `item` fra `da` e `a` (oltre alla sua fascia), a passi
   di `passo` centesimi; `null` se la sua fascia non ci entra */
function prezzoPer(sorte, item, da, a, passo = 1) {
  const [lo, hi] = FASCE[item.singolare]
  const min = Math.ceil(Math.max(lo, da) / passo), max = Math.floor(Math.min(hi, a) / passo)
  return min <= max ? sorte.fra(min, max) * passo : null
}

/* prezzi tipici di una cosa piccola, in centesimi: né due centesimi né
   duecento euro, quello che costa davvero una merenda o un fumetto */
const PREZZI = [60, 75, 80, 90, 95, 110, 120, 130, 150, 175, 180, 199, 220, 250, 280, 300]

/* ══════════════ grado 1-2 — le monete e il resto ══════════════ */

/* i tagli di monete e banconote che esistono davvero. `testo` è come
   si scrive nella domanda («20 cent», come sui cartellini: «20 c» non lo
   scrive nessuno), `sulla` quello che c'è stampato sulla moneta, dove
   una parola in più non ci sta. `facile` è il
   sottoinsieme del grado 1: niente centesimi piccoli, che è quello che
   fa sballare i conti tondi promessi da quel grado. */
const TAGLI = [
  { cents: 1, testo: '1 cent', sulla: '1' }, { cents: 2, testo: '2 cent', sulla: '2' }, { cents: 5, testo: '5 cent', sulla: '5' },
  { cents: 10, testo: '10 cent', sulla: '10' }, { cents: 20, testo: '20 cent', sulla: '20' }, { cents: 50, testo: '50 cent', sulla: '50' },
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
    testo: sorte.forse(0.5) ? 'Quanto fanno in tutto?' : 'Hai in mano questi soldi: quanto fanno in tutto?',
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
  const paid = sorte.uno(grado <= 2 ? [5, 10] : [5, 10, 20])
  /* la cosa costa quello che costa nel suo negozio, e meno della
     banconota; nel grado facile i centesimi vanno a decine, che è il
     conto tondo promesso lì */
  const passo = grado <= 2 ? 10 : 1
  const buone = COSE.filter(c => prezzoPer(sorte, c, 10, paid * 100 - 10, passo) !== null)
  const item = sorte.uno(buone)
  const costoCents = prezzoPer(sorte, item, 10, paid * 100 - 10, passo)
  const costEuro = Math.floor(costoCents / 100), costCent = costoCents % 100
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
  /* i prezzi tondi di `PREZZI`, ma solo quelli che la cosa può avere
     davvero: niente fumetti da sessanta centesimi */
  const nella = c => PREZZI.filter(x => x >= FASCE[c.singolare][0] && x <= FASCE[c.singolare][1])
  const item = sorte.uno(COSE.filter(c => nella(c).length))
  const prezzo = sorte.uno(nella(item))
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

/* ── quale prezzo è più alto ──
   Un prezzo vero ha sempre due cifre dopo la virgola, quindi la
   trappola del «3,45 contro 3,5» qui non esiste: sta nel grado 4, sui
   numeri nudi. Quella dei cartellini è un'altra, ed è vera: **guardare
   i centesimi prima degli euro**. 2,90 € contro 3,05 € — novanta è più
   di cinque, e chi legge da destra compra la cosa sbagliata. La sua
   sorella è «5 €» contro «4,95 €», dove il numero più lungo sembra il
   più grande. Tutte e due si costruiscono attorno a un euro tondo: la
   cosa che costa meno sta poco sotto, con tanti centesimi, quella che
   costa di più poco sopra, con pochi o nessuno.

   I prezzi restano quelli di un negozio vero (`FASCE`): una caramella
   non costa quindici euro, e una domanda con un prezzo assurdo fa
   ridere invece di far pensare. Si scelgono due cose le cui fasce
   hanno un euro tondo in comune, con il margine per starci sotto e
   sopra. */

/* gli euro tondi dove due cose si possono incontrare: la più economica
   deve poter costare fino a 45 centesimi meno, la più cara 20 in più */
function eurTondiComuni(a, b) {
  const [la, ha] = FASCE[a.singolare], [lb, hb] = FASCE[b.singolare]
  const lo = Math.max(la, lb) + 45, hi = Math.min(ha, hb) - 20
  const out = []
  /* da 2 € in su: sotto, la cosa economica costerebbe «0 euro e qualche
     centesimo», e il confronto fra euro non c'è più */
  for (let e = Math.max(200, Math.ceil(lo / 100) * 100); e <= hi; e += 100) out.push(e)
  return out
}

function confronto(sorte) {
  const coppie = []
  for (const a of COSE) for (const b of COSE)
    if (a !== b && eurTondiComuni(a, b).length) coppie.push([a, b])
  const [itemA, itemB] = sorte.uno(coppie)
  const tondo = sorte.uno(eurTondiComuni(itemA, itemB))
  const basso = tondo - sorte.fra(5, 45)
  /* una volta su tre la cosa cara costa l'euro tondo e basta: «5 €»
     contro «4,95 €», il più corto che vale di più */
  const alto = sorte.forse(1 / 3) ? tondo : tondo + sorte.fra(1, 20)
  const aCara = sorte.forse(0.5)
  const cara = aCara ? itemA : itemB, economica = aCara ? itemB : itemA
  const prezzoDi = it => euro(it === cara ? alto : basso)
  const nome = it => capitalizza(conArticolo(it.singolare))
  const euroInteri = c => Math.floor(c / 100)

  return domanda({
    testo: `${nome(itemA)} costa ${prezzoDi(itemA)}, `
         + `${conArticolo(itemB.singolare)} costa ${prezzoDi(itemB)}. Quale costa di più?`,
    buona: testo(nome(cara)),
    falsi: [testo(nome(economica),
      alto % 100 === 0
        ? `${prezzoDi(economica)} sembra più lungo, ma non arriva a ${prezzoDi(cara)}: ${conArticolo(cara.singolare)} sì`
        : `hai guardato i centesimi: prima si guardano gli euro, e ${euroInteri(alto)} è più di ${euroInteri(basso)}`)],
    chiave: 'sol:confronto',
    aiuto: 'prima guarda gli euro, il numero prima della virgola: chi ne ha di più costa di più. I centesimi contano solo quando gli euro sono uguali',
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

/* ══════════════ grado 7-11 — la spesa furba ══════════════
   Le cose di prima (`COSE`) si comprano a pezzo: una caramella, un
   pallone. Qui si comprano a peso o a numero di confezioni — le mele a
   kg, le uova a scatola — perché «cosa conviene» ha senso solo quando
   la stessa cosa si vende in quantità diverse, e i prezzi sono quelli
   di un negozio vero: mele e banane 1,50-3 €/kg, formaggio 10-20 €/kg,
   pane 2-5 €/kg, pasta 1-2,50 €/kg, latte 1-2 €/l, uova 25-50 cent
   l'una, yogurt 40-90 cent l'uno. */
const AL_PESO = [
  { nome: 'le mele', un: 'kg', fascia: [150, 300] },
  { nome: 'le banane', un: 'kg', fascia: [150, 250] },
  { nome: 'il formaggio', un: 'kg', fascia: [1000, 2000] },
  { nome: 'il pane', un: 'kg', fascia: [200, 500] },
  { nome: 'la pasta', un: 'kg', fascia: [100, 250] },
  { nome: 'il latte', un: 'litro', fascia: [100, 200] },
]
const A_PEZZO = [
  { nome: 'le uova', pezzo: 'un uovo', confezioni: [6, 10, 12], fascia: [25, 50] },
  { nome: 'gli yogurt', pezzo: 'uno yogurt', confezioni: [4, 6, 8], fascia: [40, 90] },
]

/* «2 kg» o «1 litro» / «2 litri»: il chilo non cambia forma al plurale,
   il litro sì */
function pesoLabel(item, n) {
  if (item.un === 'litro') return n === 1 ? '1 litro' : `${n} litri`
  return `${n} kg`
}
const pesoUnitLabel = item => item.un === 'litro' ? 'un litro' : 'un kg'

/* «le uova» → «uova»: il nome senza l'articolo, per metterlo dopo un
   numero («6 uova») o dopo «di» («di formaggio») */
const senzaArticolo = nome => nome.replace(/^(le|gli|i|il|la)\s+/, '')

/* un prezzo diverso da `base` di almeno il 5%, dalla stessa fascia:
   sotto quella soglia nessuno dei due verdetti («questa conviene») è
   onesto — sarebbe un pareggio presentato come se non lo fosse. Un
   tetto ai tentativi invece di un ciclo che confida sempre di trovarlo:
   con una fascia stretta (le uova, 25 centesimi di ampiezza) è più
   pulito arrendersi che girare a vuoto. */
function prezzoDiverso(sorte, base, lo, hi) {
  for (let i = 0; i < 20; i++) {
    const p = sorte.fra(lo, hi)
    if (Math.abs(base - p) / Math.min(base, p) >= 0.05) return p
  }
  return Math.min(hi, base + Math.max(2, Math.round(base * 0.1)))
}

/* ── grado 7: quanto costa una sola cosa ──
   Si dà il totale di N pezzi o di N kg, e si chiede il prezzo di uno
   solo: la divisione all'incontrario di «costo» qui sopra. */
function unitario(sorte) {
  const usaPezzo = sorte.forse(0.5)
  const item = usaPezzo ? sorte.uno(A_PEZZO) : sorte.uno(AL_PESO)
  const [lo, hi] = item.fascia
  const prezzoUnitario = sorte.fra(lo, hi)
  const n = usaPezzo ? sorte.uno(item.confezioni) : sorte.uno([2, 3, 4, 5])
  const totale = prezzoUnitario * n
  const buonaStr = euro(prezzoUnitario)
  const nomeCosa = senzaArticolo(item.nome)

  const testoDomanda = usaPezzo
    ? `Una confezione da ${n} ${nomeCosa} costa ${euro(totale)}: quanto costa ${item.pezzo}?`
    : `${pesoLabel(item, n)} di ${nomeCosa} costano ${euro(totale)}: quanto costa ${pesoUnitLabel(item)}?`

  const candidati = [
    [euro(totale * n), 'hai moltiplicato per il numero invece di dividere'],
    [euro(Math.round(totale / (n + 1))), `hai diviso per ${n + 1}, non per ${n}`],
  ]
  if (n > 2) candidati.push([euro(Math.round(totale / (n - 1))), `hai diviso per ${n - 1}, non per ${n}`])
  candidati.push([euro(prezzoUnitario + (sorte.forse(0.5) ? 10 : -10)),
    'hai sbagliato il conto dei centesimi nella divisione'])

  return domanda({
    testo: testoDomanda,
    buona: testo(buonaStr),
    falsi: scartaDoppi(candidati, buonaStr, 2),
    chiave: 'sol:unitario',
    aiuto: `dividi il prezzo totale per il numero: ${euro(totale)} diviso ${n} fa ${buonaStr}`,
    sorte,
  })
}

/* ── grado 8: quanto costano tanti, dal prezzo di pochi ──
   IL FALSO PIÙ VERO: aggiungere la differenza di quantità al prezzo
   invece di moltiplicare — «2 kg costano 5 €, quindi 6 kg (4 in più)
   costano 5 + 4 = 9 €» — che confonde una quantità di kg con una di
   euro, e non è un caso raro: è la reazione naturale di chi non ha
   ancora capito che il prezzo cresce proporzionalmente. */
function tanti(sorte) {
  const usaPezzo = sorte.forse(0.5)
  const item = usaPezzo ? sorte.uno(A_PEZZO) : sorte.uno(AL_PESO)
  const [lo, hi] = item.fascia
  const prezzoUnitario = sorte.fra(lo, hi)
  const confPossibili = usaPezzo ? item.confezioni.filter(c => c <= 6) : [1, 2, 3]
  const m = sorte.uno(confPossibili)
  const k = usaPezzo ? sorte.uno([2, 3]) : sorte.uno([2, 3, 4])
  const n = m * k
  const totaleM = prezzoUnitario * m
  const totaleN = totaleM * k
  const buonaStr = euro(totaleN)
  const nomeCosa = senzaArticolo(item.nome)
  const descM = usaPezzo ? `${m} ${nomeCosa}` : `${pesoLabel(item, m)} di ${nomeCosa}`
  const descN = usaPezzo ? `${n} ${nomeCosa}` : `${pesoLabel(item, n)} di ${nomeCosa}`

  const falsi = scartaDoppi([
    [euro(totaleM + (n - m) * 100), `hai aggiunto ${n - m} al prezzo invece di moltiplicarlo per ${k}`],
    [euro(Math.round(totaleM / k)), 'hai diviso invece di moltiplicare'],
    [euro(totaleM * (k + 1)), `hai moltiplicato per ${k + 1}, non per ${k}`],
  ], buonaStr, 2)

  return domanda({
    testo: `${capitalizza(descM)} costano ${euro(totaleM)}. Quanto costano ${descN}?`,
    buona: testo(buonaStr),
    falsi,
    chiave: 'sol:tanti',
    aiuto: `${descN} sono ${k} volte ${descM}: moltiplica ${euro(totaleM)} per ${k}, non aggiungere la differenza`,
    sorte,
  })
}

/* ── grado 9-10: cosa conviene ──
   Tre risposte sempre delle stesse tre forme — la confezione A, la B,
   «costano uguale» — e la scelta sbagliata non è mai a caso: chi
   guarda il totale scritto prende quella che costa meno in tutto anche
   se costa più al kg, chi guarda la quantità prende quella più grande
   anche se costa più al kg. `grammi` sceglie i pesi in grammi invece
   che in kg interi (grado 10, e dichiara anche `conversioni`). */
function conviene(sorte, grammi = false) {
  const usaPezzo = !grammi && sorte.forse(0.5)
  const item = usaPezzo ? sorte.uno(A_PEZZO)
    : sorte.uno(grammi ? AL_PESO.filter(it => it.un === 'kg') : AL_PESO)
  const [lo, hi] = item.fascia
  const quantitaPossibili = usaPezzo ? item.confezioni : grammi ? [250, 500, 750, 1000, 1500] : [1, 2, 3]
  const qA = sorte.uno(quantitaPossibili)
  const qB = sorte.uno(quantitaPossibili.filter(q => q !== qA))
  const pA = sorte.fra(lo, hi)
  const uguale = sorte.forse(0.2)
  const pB = uguale ? pA : prezzoDiverso(sorte, pA, lo, hi)
  const arrotonda2 = c => Math.round(c)
  const totA = arrotonda2(grammi ? pA * qA / 1000 : pA * qA)
  const totB = arrotonda2(grammi ? pB * qB / 1000 : pB * qB)
  const nomeCosa = senzaArticolo(item.nome)
  const gramLabel = g => g % 1000 === 0 ? `${g / 1000} kg` : `${g} g`
  const descrivi = q => usaPezzo ? `${q} ${nomeCosa}` : grammi ? gramLabel(q) : pesoLabel(item, q)
  const descA = `${descrivi(qA)} a ${euro(totA)}`
  const descB = `${descrivi(qB)} a ${euro(totB)}`
  const unitaLbl = usaPezzo ? (item.pezzo || 'a pezzo') : `al ${item.un}`

  const esito = uguale ? 'uguale' : pA < pB ? 'A' : 'B'
  const opz = { A: descA, B: descB, uguale: 'Costano uguale' }
  const buonaStr = opz[esito]

  const falsi = []
  for (const k of ['A', 'B', 'uguale']) {
    if (k === esito) continue
    let perche
    if (k === 'uguale') {
      perche = `non costano uguale: dividi ogni prezzo per la quantità e confronta quanto costa ${unitaLbl}`
    } else {
      const suaTot = k === 'A' ? totA : totB, altraTot = k === 'A' ? totB : totA
      const suaQ = k === 'A' ? qA : qB, altraQ = k === 'A' ? qB : qA
      perche = suaTot < altraTot
        ? `${opz[k]} costa meno in tutto, ma è il prezzo per ${item.pezzo ? 'pezzo' : item.un} che conta, non il totale scritto`
        : suaQ > altraQ
          ? `${opz[k]} è di più, ma non è la quantità che conta: guarda quanto costa ${unitaLbl}`
          : `guarda quanto costa ${unitaLbl}, non il totale`
    }
    falsi.push(testo(opz[k], perche))
  }

  return domanda({
    testo: `${capitalizza(item.nome)}: ${descA} oppure ${descB}. Cosa conviene?`,
    buona: testo(buonaStr),
    falsi,
    chiave: grammi ? 'sol:conviene-grammi' : 'sol:conviene',
    aiuto: uguale
      ? `dividi ogni prezzo per la quantità: sono tutti e due ${euro(pA)} ${unitaLbl}, quindi costano uguale`
      : `dividi ogni prezzo per la quantità: ${descA} è ${euro(pA)} ${unitaLbl}, ${descB} è ${euro(pB)} ${unitaLbl}`,
    sorte,
  })
}

/* ── grado 11: quale offerta conviene ──
   «Prendi N, paghi M» (M = N-1: un pezzo gratis ogni tanti) contro uno
   sconto in euro sul totale. Le due promesse si confrontano solo
   calcolando quanto si paga davvero — non c'è una cifra scritta più
   grande o più piccola da cui indovinare, ed è quello che le rende
   oneste anche senza un «perché» per ogni singola scelta sbagliata. */
function offerta(sorte) {
  const item = sorte.uno(COSE)
  const [lo, hi] = FASCE[item.singolare]
  const p = sorte.fra(lo, hi)
  const [N, M] = sorte.uno([[2, 1], [3, 2], [4, 3]])
  const totaleA = p * M
  const uguale = sorte.forse(0.2)
  let D
  if (uguale) {
    D = p
  } else {
    const scarti = [-0.4, -0.2, 0.2, 0.4].map(f => Math.round(p + p * f))
    const validi = scarti.filter(d => d >= 5 && Math.abs(p - d) / totaleA >= 0.05)
    D = sorte.uno(validi.length ? validi : [Math.max(5, p - Math.round(p * 0.3))])
  }
  const totaleB = p * N - D
  const esito = uguale ? 'uguale' : totaleA < totaleB ? 'A' : 'B'
  const descA = `«Prendi ${N}, paghi ${M}»`
  const descB = `${euro(D)} di sconto sul totale`
  const opz = { A: descA, B: descB, uguale: 'Costano uguale' }
  const buonaStr = opz[esito]

  const falsi = []
  for (const k of ['A', 'B', 'uguale']) {
    if (k === esito) continue
    falsi.push(testo(opz[k], k === 'uguale'
      ? 'non è uguale: calcola quanto paghi davvero in tutti e due i casi'
      : `con questa scelta paghi ${euro(k === 'A' ? totaleA : totaleB)}: calcola quanto paghi davvero in tutti e due i casi, e confronta`))
  }

  return domanda({
    testo: `Compri ${N} ${senzaArticolo(item.plurale)} da ${euro(p)} ${pezzoDi(item.singolare)}. `
         + `C'è l'offerta ${descA}, oppure ${descB}. Quale conviene?`,
    buona: testo(buonaStr),
    falsi,
    chiave: 'sol:offerta',
    aiuto: uguale
      ? `calcola quanto paghi davvero: in tutti e due i casi sono ${euro(totaleA)}`
      : `calcola quanto paghi davvero: «prendi ${N} paghi ${M}» costa ${euro(totaleA)}, lo sconto lascia ${euro(totaleB)}`,
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
  'quanto costa una sola cosa, dal prezzo di più',
  'quanto costano tante cose, dal prezzo di poche',
  'cosa conviene comprare',
  'cosa conviene, quando il peso è in grammi',
  'quale offerta conviene',
]

/* Le tipologie. `denaro` e `decimali` sono due sapere diversi apposta
   (vedi il cappello del file): le prime quattro chiedono di saper
   maneggiare i soldi, le quattro dopo di sapere cos'è un numero con
   la virgola — e un bambino può avere l'uno senza l'altro. La spesa
   furba (7-11) torna sul denaro: chiede di dividere (`divisioni`), e
   nel grado 10 anche di passare dai grammi ai chili (`conversioni`). */
const TIPI = [
  { chiave: 'sol:conta', nome: 'Quanto fanno monete e banconote', sa: 'denaro', gradi: { 1: 1, 2: 0.3 } },
  { chiave: 'sol:resto', nome: 'Il resto', sa: 'denaro', gradi: { 2: 0.7, 3: 0.3 } },
  { chiave: 'sol:costo', nome: 'Quanto costano più cose', sa: 'denaro', gradi: { 3: 0.45, 4: 0.2 } },
  { chiave: 'sol:confronto', nome: 'Quale prezzo è più alto', sa: 'denaro', gradi: { 3: 0.25, 4: 0.3 } },
  { chiave: 'sol:confronto-numeri', nome: 'Quale numero con la virgola è più grande', sa: 'decimali', gradi: { 4: 0.5, 5: 0.35 } },
  { chiave: 'sol:cifre', nome: 'Il valore delle cifre dopo la virgola', sa: 'decimali', gradi: { 5: 0.65, 6: 0.2 } },
  { chiave: 'sol:linea', nome: 'I decimali sulla linea e in ordine', sa: 'decimali', gradi: { 6: 0.45 } },
  { chiave: 'sol:arrotonda', nome: "Arrotondare all'euro o al decimo", sa: 'decimali', gradi: { 6: 0.35 } },
  { chiave: 'sol:unitario', nome: 'Quanto costa una sola cosa', sa: ['denaro', 'divisioni'], gradi: { 7: 1 } },
  { chiave: 'sol:tanti', nome: 'Quanto costano tante cose', sa: ['denaro', 'divisioni'], gradi: { 8: 1 } },
  { chiave: 'sol:conviene', nome: 'Cosa conviene comprare', sa: ['denaro', 'divisioni'], gradi: { 9: 1 } },
  { chiave: 'sol:conviene-grammi', nome: 'Cosa conviene, coi grammi', sa: ['denaro', 'divisioni', 'conversioni'], gradi: { 10: 1 } },
  { chiave: 'sol:offerta', nome: 'Quale offerta conviene', sa: ['denaro', 'divisioni'], gradi: { 11: 1 } },
]

class Soldi extends Modulo {
  constructor() {
    super({
      id: 'soldi',
      nome: 'Soldi e decimali',
      icona: '💶',
      materia: 'matematica',
      chiaro: 'contare le monete, dare il resto, confrontare prezzi, i numeri con la virgola, e la spesa furba',
      scaletta: SCALETTA,
      /* QUANTO È COMPLICATO OGNI GRADO, da 0 a 100 — la scala è una
         sola per tutte le materie. Zero è il primo giorno di materna,
         cento la fine della primaria: dodici punti e mezzo per anno.
         Il conto tondo delle monete è di seconda-terza (38-44), il
         resto e i confronti di terza-quarta (50-57), i numeri con la
         virgola senza euro di quarta-quinta (57-72) — la stessa
         scaletta di cui parla `CLAUDE.md` per questo modulo. La spesa
         furba (76-94) viene dopo: non è più complicato dividere o
         moltiplicare, è capire QUALE conto fare, e quello arriva più
         tardi dei conti stessi. */
      livelli: [38, 44, 50, 57, 64, 72, 76, 81, 85, 90, 94],
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
      case 'sol:unitario': return unitario(sorte)
      case 'sol:tanti': return tanti(sorte)
      case 'sol:conviene': return conviene(sorte)
      case 'sol:conviene-grammi': return conviene(sorte, true)
      case 'sol:offerta': return offerta(sorte)
      default: return conta(sorte, grado)
    }
  }
}

export default new Soldi()

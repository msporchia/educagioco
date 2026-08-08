/* ═══════════════════════════════════════════════════════════════════
   SENSO DEL NUMERO — quanto vale un numero, prima di saperci fare i
   conti.

   Nel repo il calcolo c'è già (`data/calcolo.js`: le strategie, i
   riporti, le tabelline). Qui non si calcola niente: si allena il
   *sentire* i numeri, che è un'altra cosa e viene prima. Un bambino
   che scrive 42 + 17 = 590 non ha sbagliato un riporto: non ha in
   testa quanto è grande 42. E chi non sa che il 47 sta poco prima
   della metà di cento non capirà mai perché 47 + 47 fa quasi 100.

   LE CINQUE COSE CHE SI ALLENANO, dalla più antica alla più astratta:

     · il colpo d'occhio — quanti sono senza contarli, e quale mucchio
       ne ha di più. È l'unica di tutta la matematica che non si
       impara: si nasce con quella, e poi si arrugginisce;
     · la linea dei numeri — dove sta un numero fra gli altri, che è il
       modo in cui il cervello i numeri se li tiene davvero;
     · prima, dopo, in mezzo — il numero come posto in una fila;
     · le decine — la cifra a sinistra non è «un tre», è trenta;
     · la stima — a occhio e croce, e sapere quando un risultato è
       impossibile senza rifare il conto.

   I FALSI SONO GLI ERRORI VERI, e in questa materia sono sempre gli
   stessi quattro: le cifre girate (74 per 47), la cifra letta al posto
   sbagliato (il 7 di 372 letto come sette), l'arrotondamento dalla
   parte sbagliata, e l'uno di troppo o di meno sul confine. Un numero
   preso a caso si scarterebbe a occhio, e la domanda si risolverebbe
   senza guardare niente.

   IL DISEGNO NON È UN ORNAMENTO. La linea dei numeri *è* la domanda:
   in tre gradi su sei si sceglie fra quattro disegni, non fra quattro
   parole. I pittori stanno in `grafica/pittori/numero.js` e ricevono
   solo fatti — `{ che: 'linea', da: 0, a: 100, segna: 47, tacche: 10 }` —
   senza sapere se quella è la risposta buona o il tranello.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo, scena } from '../nucleo/domanda.js'
import { PITTORI_NUMERO } from '../grafica/pittori/numero.js'

const SCALETTA = [
  'il colpo d\'occhio: quanti sono, senza contarli',
  'la linea dei numeri fino a 20',
  'prima, dopo, in mezzo e in ordine',
  'la linea fino a 100 e il numero più vicino',
  'le decine e il valore delle cifre',
  'la stima: circa quanto fa, e cosa è impossibile',
]

/* Le tipologie. Tre gruppi: quello che si fa contando e confrontando,
   quello che vuole il valore posizionale (in 47 il 4 vale quaranta), e
   la stima, che è l'unico posto dove rispondere «circa» è la risposta
   giusta. Sono tre pezzi di scuola diversi e si spengono separati. */
const TIPI = [
  { chiave: 'num:colpo-docchio', nome: "Il colpo d'occhio: quanti sono", sa: 'numeri', gradi: { 1: 0.58 } },
  { chiave: 'num:confronto', nome: 'Chi è di più, chi è di meno', sa: 'numeri', gradi: { 1: 0.42 } },
  { chiave: 'num:linea', nome: 'Leggere la linea dei numeri', sa: 'numeri', gradi: { 2: 0.62, 4: 0.4 } },
  { chiave: 'num:posiziona', nome: 'Mettere un numero al suo posto', sa: 'numeri', gradi: { 2: 0.38, 4: 0.32 } },
  { chiave: 'num:ordine', nome: 'Prima, dopo, in mezzo e in ordine', sa: 'numeri', gradi: { 3: 1 } },
  { chiave: 'num:vicino', nome: 'Il numero più vicino', sa: 'numeri', gradi: { 4: 0.28 } },
  { chiave: 'num:decine', nome: 'Le decine', sa: 'decine', gradi: { 5: 0.5 } },
  { chiave: 'num:cifre', nome: 'Quanto vale ogni cifra', sa: 'decine', gradi: { 5: 0.5 } },
  { chiave: 'num:stima', nome: 'Circa quanto fa', sa: 'stima', gradi: { 6: 0.3 } },
  { chiave: 'num:arrotonda', nome: 'Arrotondare', sa: 'stima', gradi: { 6: 0.25 } },
  { chiave: 'num:grandezza', nome: "L'ordine di grandezza, e cosa è impossibile", sa: 'stima', gradi: { 6: 0.45 } },
]

/* le cifre girate: l'errore principe di tutta questa materia. Un
   numero che finisce per zero girato perde una cifra (50 → 05 → 5) e
   diventa un falso che si scarta a occhio: meglio nessun falso che uno
   regalato, e `pescaFalsi` scarta da sé quello che non è un numero. */
const inverti = n => Number(String(n).split('').reverse().join(''))
const girate = n => (n % 10 === 0 ? NaN : inverti(n))
const decina = n => Math.round(n / 10) * 10
const riga = lista => lista.join(', ')

/* «il 47» ma «l'8»: i numeri che si dicono con la vocale davanti sono
   uno, otto, undici, gli ottanta e gli ottocento. Una domanda scritta
   male la legge un bambino, non un compilatore. */
const vocale = n => n === 1 || n === 8 || n === 11 || /^8\d\d?$/.test(String(n))
const il = n => vocale(n) ? `l'${n}` : `il ${n}`
const del = n => vocale(n) ? `dell'${n}` : `del ${n}`
const nel = n => vocale(n) ? `nell'${n}` : `nel ${n}`

/* un falso è un valore più il motivo per cui ci si casca */
const F = (v, perche) => ({ v, perche })

/* ── i falsi, scelti uno per uno ──
   Prende i candidati in ordine (il primo della lista è quello che
   insegna di più) e tiene i primi che non ripetono, che stanno nei
   limiti e — quando i falsi sono *disegnati* — che non finiscono così
   vicini al vero da sembrare lo stesso disegno. Due frecce a tre pixel
   di distanza il banco non le prende, il bambino sì. */
function pescaFalsi(candidati, quanti, { escludi = [], distanza = 0, dentro = () => true } = {}) {
  const presi = []
  const visti = new Set(escludi)
  for (const c of candidati) {
    if (!Number.isFinite(c.v) || visti.has(c.v) || !dentro(c.v)) continue
    if (distanza && [...visti].some(v => Math.abs(v - c.v) < distanza)) continue
    visti.add(c.v)
    presi.push(c)
    if (presi.length >= quanti) break
  }
  return presi
}

class SensoDelNumero extends Modulo {
  constructor() {
    super({
      id: 'numero',
      nome: 'Senso del numero',
      icona: '🔢',
      materia: 'matematica',
      chiaro: 'sentire quanto vale un numero: a colpo d\'occhio, sulla linea, a occhio e croce',
      scaletta: SCALETTA,
      tipi: TIPI,
      pittori: PITTORI_NUMERO,
    })
  }

  /* La linea dei numeri torna due volte — fino a 20 al grado 2, fino a
     100 al grado 4 — ed è la stessa cosa da saper fare: stessa chiave,
     e a cambiare è solo fin dove arriva la riga. Il grado serve
     esattamente a questo. */
  genera(grado, sorte, tipo) {
    const fine = grado >= 4 ? 100 : sorte.uno([10, 10, 20])
    switch (tipo) {
      case 'num:confronto': return this.confronto(sorte)
      case 'num:linea': return this.leggiLinea(0, fine, sorte)
      case 'num:posiziona': return this.posiziona(0, fine, sorte)
      case 'num:ordine': {
        const q = sorte.frazione
        return q < 0.34 ? this.inMezzo(sorte) : q < 0.67 ? this.subito(sorte) : this.ordine(sorte)
      }
      case 'num:vicino': return this.vicino(sorte)
      case 'num:decine': return sorte.forse(0.6) ? this.mucchiDiDieci(sorte) : this.quanteDecine(sorte)
      case 'num:cifre': return sorte.forse(0.5) ? this.cifra(sorte) : this.scomponi(sorte)
      case 'num:stima': return this.stima(sorte)
      case 'num:arrotonda': return this.arrotonda(sorte)
      case 'num:grandezza': return sorte.forse(0.55) ? this.grandezza(sorte) : this.sbagliatoDiSicuro(sorte)
      default: return this.quanti(sorte)
    }
  }

  /* ── grado 1: il colpo d'occhio ─────────────────────────────────── */

  /* quanti pallini, senza contarli uno per uno */
  quanti(sorte) {
    const dado = sorte.forse(0.5)
    const quanti = dado ? sorte.fra(3, 9) : sorte.fra(4, 12)
    const disposizione = dado ? 'dado' : 'sparsi'
    const seme = sorte.fra(1, 99999)
    const falsi = pescaFalsi([
      F(quanti + 1, 'uno di troppo: uno l\'hai contato due volte'),
      F(quanti - 1, 'uno di meno: uno è rimasto fuori dal conto'),
      ...sorte.mescola([
        F(quanti + 2, 'guarda meglio: sono due di meno'),
        F(quanti - 2, 'guarda meglio: sono due di più'),
        F(quanti + 3, 'sono parecchi di meno'),
      ]),
    ], 3, { escludi: [quanti], dentro: v => v >= 1 && v <= 16 })

    return domanda({
      testo: 'Quanti pallini ci sono?',
      soggetto: scena({ che: 'pallini', quanti, disposizione, seme }),
      buona: testo(quanti),
      falsi: falsi.map(f => testo(f.v, f.perche)),
      chiave: 'num:colpo-docchio',
      aiuto: dado
        ? 'a dado si vedono a gruppi: quattro agli angoli e uno in mezzo fa cinque'
        : 'guardali a due a due o a tre a tre, è più veloce che uno per uno',
      sorte,
    })
  }

  /* quale mucchio ne ha di più (o di meno) */
  confronto(sorte) {
    const quanti = sorte.forse(0.35) ? 3 : 2
    const disposizione = sorte.forse(0.5) ? 'dado' : 'sparsi'
    const numeri = []
    for (let giro = 0; giro < 60 && numeri.length < quanti; giro++) {
      const n = sorte.fra(2, 9)
      if (numeri.every(m => Math.abs(m - n) >= 2)) numeri.push(n)
    }
    if (numeri.length < 2) return this.quanti(sorte)

    const piu = sorte.forse(0.5)
    const bersaglio = piu ? Math.max(...numeri) : Math.min(...numeri)
    const carta = n => scena(
      { che: 'pallini', quanti: n, disposizione, seme: sorte.fra(1, 99999) },
      n === bersaglio ? undefined : (piu ? 'qui ce ne sono di meno' : 'qui ce ne sono di più'))

    return domanda({
      testo: `Quale mucchio ha ${piu ? 'più' : 'meno'} pallini?`,
      buona: carta(bersaglio),
      falsi: numeri.filter(n => n !== bersaglio).map(carta),
      chiave: 'num:confronto',
      aiuto: 'non serve contarli tutti: accoppiali a due a due, quello che avanza ne ha di più',
      sorte,
    })
  }

  /* ── gradi 2 e 4: la linea dei numeri ───────────────────────────── */

  /* la freccia indica un numero: quale? */
  leggiLinea(da, fine, sorte) {
    const larga = fine - da > 20
    const tacche = larga ? 10 : fine - da
    const segna = larga ? sorte.fra(2, 19) * 5 : sorte.fra(1, fine - 1)
    const passo = larga ? 10 : 1
    const falsi = pescaFalsi([
      F(girate(segna), `${inverti(segna)} sono le stesse cifre girate, e sta in un altro posto`),
      ...sorte.mescola([
        F(fine - segna, 'sulla linea si conta da sinistra, partendo da 0'),
        F(segna + passo, 'una tacca più in là di dove punta la freccia'),
        F(segna - passo, 'una tacca più indietro di dove punta la freccia'),
        F(segna + 2 * passo, 'guarda meglio: la freccia è più indietro'),
        F(segna - 2 * passo, 'guarda meglio: la freccia è più avanti'),
      ]),
    ], 3, { escludi: [segna], distanza: larga ? 10 : 1, dentro: v => v >= da && v <= fine })

    return domanda({
      testo: 'Che numero indica la freccia?',
      soggetto: scena({ che: 'linea', da, a: fine, segna, tacche }),
      buona: testo(segna),
      falsi: falsi.map(f => testo(f.v, f.perche)),
      chiave: 'num:linea',
      aiuto: larga
        ? 'ogni tacca vale 10, e la tacca grossa in mezzo è il 50'
        : 'parti da 0 e conta le tacche una per una',
      sorte,
    })
  }

  /* il contrario: dato il numero, quale linea lo indica */
  posiziona(da, fine, sorte) {
    const larga = fine - da > 20
    const tacche = larga ? 10 : fine - da
    const bersaglio = larga ? sorte.fra(6, 94) : sorte.fra(1, fine - 1)
    const lontano = Math.max(2, Math.round((fine - da) * 0.18))

    const altri = []
    for (let v = da; v <= fine; v++) altri.push(F(v, 'questa freccia indica un altro numero'))
    const falsi = pescaFalsi([
      F(girate(bersaglio), `attenzione alle cifre girate: ${il(inverti(bersaglio))} sta in un altro posto`),
      ...sorte.mescola(altri),
    ], 3, { escludi: [bersaglio], distanza: lontano })

    return domanda({
      testo: `Dove va ${il(bersaglio)}?`,
      buona: scena({ che: 'linea', da, a: fine, segna: bersaglio, tacche }),
      falsi: falsi.map(f => scena({ che: 'linea', da, a: fine, segna: f.v, tacche }, f.perche)),
      chiave: 'num:posiziona',
      aiuto: `parti da ${da} e conta le tacche: ${il(bersaglio)} sta ${bersaglio > (da + fine) / 2 ? 'dopo' : 'prima'} della metà`,
      sorte,
    })
  }

  /* ── grado 3: il numero come posto in fila ──────────────────────── */

  /* che numero viene fra 68 e 70 */
  inMezzo(sorte) {
    const n = sorte.fra(11, 98)
    const falsi = pescaFalsi([
      F(girate(n), 'sono le stesse cifre, ma girate'),
      ...sorte.mescola([
        F(n + 10, 'quella è la decina dopo'),
        F(n - 10, 'quella è la decina prima'),
        F(n + 2, 'è troppo in là: fra due numeri vicini ce n\'è uno solo'),
        F(n - 2, 'è troppo indietro: fra due numeri vicini ce n\'è uno solo'),
      ]),
    ], 3, { escludi: [n, n - 1, n + 1], dentro: v => v > 0 && v < 130 })

    return domanda({
      testo: `Che numero viene fra ${n - 1} e ${n + 1}?`,
      buona: testo(n),
      falsi: falsi.map(f => testo(f.v, f.perche)),
      chiave: 'num:ordine',
      aiuto: `dopo ${il(n - 1)} viene ${il(n)}, e subito dopo ${il(n + 1)}`,
      sorte,
    })
  }

  /* subito prima, subito dopo — e quasi sempre sul confine di decina,
     che è dove i bambini inciampano davvero */
  subito(sorte) {
    const dopo = sorte.forse(0.5)
    const confine = sorte.forse(0.6)
    const n = confine
      ? sorte.fra(2, 9) * 10 + (dopo ? 9 : 0)
      : sorte.fra(11, 97)
    const buona = dopo ? n + 1 : n - 1
    const falsi = pescaFalsi([
      F(dopo ? n - 1 : n + 1, `quello viene ${dopo ? 'prima' : 'dopo'}, non ${dopo ? 'dopo' : 'prima'}`),
      ...sorte.mescola([
        F(buona + 10, 'quella è la decina dopo'),
        F(buona - 10, 'quella è la decina prima'),
        F(girate(buona), 'sono le stesse cifre, ma girate'),
        F(buona + 2, 'è un numero più in là'),
      ]),
    ], 3, { escludi: [n, buona], dentro: v => v > 0 && v < 130 })

    return domanda({
      testo: `Quale numero viene subito ${dopo ? `dopo ${il(n)}` : `prima ${del(n)}`}?`,
      buona: testo(buona),
      falsi: falsi.map(f => testo(f.v, f.perche)),
      chiave: 'num:ordine',
      aiuto: confine
        ? 'sul confine cambia la decina: dopo il 39 viene il 40, prima del 40 c\'è il 39'
        : 'basta contare avanti o indietro di uno',
      sorte,
    })
  }

  /* tre numeri da mettere in fila */
  ordine(sorte) {
    let scelti = [23, 31, 45]
    for (let giro = 0; giro < 40; giro++) {
      const tre = [sorte.fra(11, 96), sorte.fra(11, 96), sorte.fra(11, 96)]
      if (new Set(tre.map(n => Math.floor(n / 10))).size < 3) continue
      if (new Set(tre.map(n => n % 10)).size < 3) continue
      const su = tre.slice().sort((x, y) => x - y)
      const perUnita = tre.slice().sort((x, y) => x % 10 - y % 10)
      if (riga(perUnita) === riga(su) || riga(perUnita) === riga(su.slice().reverse())) continue
      scelti = tre
      break
    }

    const su = scelti.slice().sort((x, y) => x - y)
    const giu = su.slice().reverse()
    const crescente = sorte.forse(0.5)
    const buona = crescente ? su : giu
    const scambio = buona.slice()
    ;[scambio[0], scambio[1]] = [scambio[1], scambio[0]]
    const perUnita = scelti.slice().sort((x, y) => x % 10 - y % 10)

    const proposte = [
      [riga(crescente ? giu : su), 'questa è in ordine, ma dalla parte opposta'],
      [riga(perUnita), 'hai guardato l\'ultima cifra: si guardano prima le decine'],
      [riga(scambio), 'i primi due sono scambiati'],
    ]
    const visti = new Set([riga(buona)])
    const falsi = []
    for (const [t, perche] of proposte) {
      if (visti.has(t)) continue
      visti.add(t)
      falsi.push(testo(t, perche))
    }

    return domanda({
      testo: `Quale fila è in ordine, dal più ${crescente ? 'piccolo al più grande' : 'grande al più piccolo'}?`,
      buona: testo(riga(buona)),
      falsi,
      chiave: 'num:ordine',
      aiuto: 'si guardano prima le decine; le unità contano solo se le decine sono uguali',
      sorte,
    })
  }

  /* ── grado 4: il più vicino ─────────────────────────────────────── */

  vicino(sorte) {
    const bersaglio = sorte.uno([20, 30, 40, 50, 60, 70, 80, 100])
    const scarto = sorte.fra(1, 4)
    const buona = bersaglio + (sorte.forse(0.5) ? scarto : -scarto)
    const falsi = pescaFalsi(sorte.mescola([
      F(bersaglio + scarto + 4, null),
      F(bersaglio - scarto - 4, null),
      F(bersaglio + scarto + 9, null),
      F(bersaglio - scarto - 9, null),
      F(bersaglio + scarto + 15, null),
      F(bersaglio - scarto - 15, null),
    ]), 3, { escludi: [buona, bersaglio], dentro: v => v > 0 && v < 130 })

    return domanda({
      testo: `Quale numero è più vicino a ${bersaglio}?`,
      buona: testo(buona),
      falsi: falsi.map(f => testo(f.v, `da qui a ${bersaglio} ce ne sono ${Math.abs(f.v - bersaglio)}, e ce n'è uno più vicino`)),
      chiave: 'num:vicino',
      aiuto: `guarda quanto manca a ${bersaglio} da ognuno: vince chi ne ha di meno`,
      sorte,
    })
  }

  /* ── grado 5: le decine e le cifre ──────────────────────────────── */

  /* le barre da dieci più i cubetti che avanzano */
  mucchiDiDieci(sorte) {
    const decine = sorte.fra(2, 6)
    const unita = sorte.fra(1, 9)
    const n = decine * 10 + unita
    const falsi = pescaFalsi([
      F(unita * 10 + decine, 'le barre sono le decine: la cifra delle decine va per prima'),
      F(decine + unita, 'non è 4 + 3: ogni barra vale 10, non 1'),
      ...sorte.mescola([
        F(decine * 10, 'ti sei dimenticato i cubetti che avanzano'),
        F(n + 10, 'una barra di troppo'),
        F(n - 10, 'una barra di meno'),
      ]),
    ], 3, { escludi: [n], dentro: v => v > 0 })

    return domanda({
      testo: 'Quanti cubetti ci sono in tutto?',
      soggetto: scena({ che: 'barre', decine, unita }),
      buona: testo(n),
      falsi: falsi.map(f => testo(f.v, f.perche)),
      chiave: 'num:decine',
      aiuto: `${decine} barre da 10 fanno ${decine * 10}, più ${unita} cubetti fa ${n}`,
      sorte,
    })
  }

  quanteDecine(sorte) {
    const n = sorte.fra(11, 99)
    const buona = Math.floor(n / 10)
    const falsi = pescaFalsi([
      F(n % 10, 'quella è la cifra delle unità, non delle decine'),
      F(n, 'quello è tutto il numero, non quante decine ha'),
      ...sorte.mescola([
        F(buona * 10, 'quello è quanto valgono le decine, non quante sono'),
        F(buona + 1, 'una decina di troppo'),
        F(buona - 1, 'una decina di meno'),
      ]),
    ], 3, { escludi: [buona], dentro: v => v >= 1 })

    return domanda({
      testo: `Quante decine ci sono ${nel(n)}?`,
      buona: testo(buona),
      falsi: falsi.map(f => testo(f.v, f.perche)),
      chiave: 'num:decine',
      aiuto: 'le decine sono la cifra a sinistra: nel 63 ci sono 6 decine e avanzano 3',
      sorte,
    })
  }

  /* qual è la cifra delle decine di 372 */
  cifra(sorte) {
    const [a, b, c] = sorte.alcuni([1, 2, 3, 4, 5, 6, 7, 8, 9], 3)
    const n = a * 100 + b * 10 + c
    const posti = [
      /* `quanto` è l'altro tranello: una cosa è la *cifra* delle
         centinaia (il 3 di 372), un'altra quanto vale (300) */
      { dice: 'centinaia', v: a, quanto: a * 100 },
      { dice: 'decine', v: b, quanto: b * 10 },
      { dice: 'unità', v: c, quanto: b * 10 + c },
    ]
    const scelto = sorte.uno(posti)
    const falsi = posti.filter(p => p !== scelto)
      .map(p => testo(p.v, `il ${p.v} è la cifra delle ${p.dice}`))
    falsi.push(testo(scelto.quanto, scelto.dice === 'unità'
      ? 'quelle sono due cifre: la domanda ne chiede una sola'
      : `${scelto.quanto} è quanto valgono le ${scelto.dice}, la cifra è una sola`))

    return domanda({
      testo: `Qual è la cifra delle ${scelto.dice} di ${n}?`,
      buona: testo(scelto.v),
      falsi,
      chiave: 'num:cifre',
      aiuto: 'si contano da destra: prima le unità, poi le decine, poi le centinaia',
      sorte,
    })
  }

  /* scomporre 245 in 200 + 40 + 5, e rimetterlo insieme */
  scomponi(sorte) {
    const [a, b, c] = sorte.alcuni([1, 2, 3, 4, 5, 6, 7, 8, 9], 3)
    const n = a * 100 + b * 10 + c

    if (sorte.forse(0.5)) {
      return domanda({
        testo: `Come si scompone ${il(n)}?`,
        buona: testo(`${a * 100} + ${b * 10} + ${c}`),
        falsi: [
          testo(`${a} + ${b} + ${c}`, `sono le cifre da sole: ma quel ${a} vale ${a * 100}`),
          testo(`${a * 100} + ${b} + ${c}`, `il ${b} sta al posto delle decine, quindi vale ${b * 10}`),
          testo(`${a * 10} + ${b * 10} + ${c}`, `il ${a} sta al posto delle centinaia, quindi vale ${a * 100}`),
        ],
        chiave: 'num:cifre',
        aiuto: `${a} centinaia, ${b} decine e ${c} unità: ${a * 100} + ${b * 10} + ${c}`,
        sorte,
      })
    }

    const falsi = pescaFalsi([
      F(girate(n), 'sono le stesse cifre, ma girate'),
      F(a * 100 + c * 10 + b, 'le ultime due cifre sono scambiate'),
      F(a * 10 + b * 10 + c, `${a * 100} sono ${a} centinaia, non ${a} decine`),
    ], 3, { escludi: [n], dentro: v => v > 0 })

    return domanda({
      testo: `Quale numero è ${a * 100} + ${b * 10} + ${c}?`,
      buona: testo(n),
      falsi: falsi.map(f => testo(f.v, f.perche)),
      chiave: 'num:cifre',
      aiuto: `${a * 100} + ${b * 10} + ${c} si scrive con le tre cifre in fila: ${n}`,
      sorte,
    })
  }

  /* ── grado 6: la stima ──────────────────────────────────────────── */

  stima(sorte) {
    const a = sorte.fra(12, 89)
    const b = sorte.fra(12, 89)
    const tondo = decina(a) + decina(b)
    const falsi = pescaFalsi([
      F(tondo * 10, 'troppo grande: guarda quante decine hai in mano'),
      F(Math.round(tondo / 10), 'troppo piccolo: hai contato le decine, non quanto valgono'),
      F(decina(Math.round(tondo / 2)), 'è come se ne avessi sommato uno solo'),
      F(tondo + 100, 'cento di troppo'),
    ], 3, { escludi: [tondo], dentro: v => v > 0 })

    return domanda({
      testo: `${a} + ${b} fa circa quanto?`,
      buona: testo(tondo),
      falsi: falsi.map(f => testo(f.v, f.perche)),
      chiave: 'num:stima',
      aiuto: `${a} è vicino a ${decina(a)} e ${b} è vicino a ${decina(b)}: insieme circa ${tondo}`,
      sorte,
    })
  }

  arrotonda(sorte) {
    const unita = sorte.uno([1, 2, 3, 4, 6, 7, 8, 9])
    const n = sorte.fra(1, 9) * 10 + unita
    const buona = decina(n)
    const sotto = unita < 5
    const falsi = pescaFalsi([
      F(sotto ? buona + 10 : buona - 10, `${unita} è ${sotto ? 'meno' : 'più'} di 5, quindi si va ${sotto ? 'giù' : 'su'}`),
      F(unita * 10, 'hai guardato solo l\'ultima cifra'),
      ...sorte.mescola([
        F(n, 'quello è il numero di partenza, non arrotondato'),
        F(buona + 10, 'quella è la decina dopo'),
        F(buona - 10, 'quella è la decina prima'),
      ]),
    ], 3, { escludi: [buona], dentro: v => v > 0 })

    return domanda({
      testo: `Arrotonda ${n} alla decina più vicina.`,
      buona: testo(buona),
      falsi: falsi.map(f => testo(f.v, f.perche)),
      chiave: 'num:arrotonda',
      aiuto: `${n} sta fra ${Math.floor(n / 10) * 10} e ${Math.floor(n / 10) * 10 + 10}: l'ultima cifra è ${unita}, quindi si va ${sotto ? 'giù' : 'su'}`,
      sorte,
    })
  }

  /* l'ordine di grandezza: dove casca il risultato, senza farlo */
  grandezza(sorte) {
    const a = sorte.fra(21, 78)
    const b = sorte.fra(21, 78)
    const base = Math.floor((a + b) / 10) * 10
    const fascia = x => `fra ${x} e ${x + 10}`
    /* l'ordine di grandezza sbagliato: dieci volte tanto, o dieci
       volte poco quando il dieci volte tanto diventerebbe una scritta
       lunga il doppio delle altre (e si riconoscerebbe da quello) */
    const fuoriMisura = base < 100 ? base * 10 : decina(base / 10)

    return domanda({
      testo: `Senza fare il conto: dove sta il risultato di ${a} + ${b}?`,
      buona: testo(fascia(base)),
      falsi: [
        testo(fascia(base - 20), 'troppo poco: solo le decine fanno già di più'),
        testo(fascia(base + 20), 'troppo: le unità non aggiungono mai una decina intera'),
        testo(fascia(fuoriMisura), `quello è dieci volte ${base < 100 ? 'tanto' : 'meno'}`),
      ],
      chiave: 'num:grandezza',
      aiuto: `le decine sono ${Math.floor(a / 10)} e ${Math.floor(b / 10)}: siamo già a ${(Math.floor(a / 10) + Math.floor(b / 10)) * 10}, e le unità aggiungono poco`,
      sorte,
    })
  }

  /* uno di questi conti è sbagliato di sicuro: si vede dalla misura,
     senza rifarlo. Gli altri tre sono veri davvero, così non c'è
     niente da discutere */
  sbagliatoDiSicuro(sorte) {
    const piccolo = sorte.forse(0.5)
    const a = sorte.fra(24, 46)
    const b = sorte.fra(24, 46)
    const finto = piccolo ? Math.min(a, b) - sorte.fra(3, 12) : a + b + 100
    const scritta = (x, y, r) => `${x} + ${y} = ${r}`

    const visti = new Set([scritta(a, b, finto)])
    const veri = []
    for (let giro = 0; giro < 40 && veri.length < 3; giro++) {
      const x = sorte.fra(21, 46)
      const y = sorte.fra(21, 46)
      const t = scritta(x, y, x + y)
      if (visti.has(t)) continue
      visti.add(t)
      veri.push(t)
    }

    return domanda({
      testo: 'Uno di questi conti è sbagliato di sicuro. Quale?',
      buona: testo(scritta(a, b, finto)),
      falsi: veri.map(t => testo(t, 'questo torna: rifallo e vedrai')),
      chiave: 'num:grandezza',
      aiuto: piccolo
        ? 'una somma non può venire più piccola dei numeri che sommi'
        : 'due numeri sotto il 50 messi insieme non arrivano a 100',
      sorte,
    })
  }
}

export default new SensoDelNumero()

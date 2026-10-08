// problemi a parole: qui il conto non è scritto, c'è una storia, e la sola cosa che si allena è capire CHE conto chiede. Si sceglie fra quattro numeri come ovunque: i tre falsi sono presi dagli errori veri (operazione girata, passo dimenticato, dato in più usato lo stesso al grado 6, uno di troppo), così azzeccare a caso costa più fatica che ragionare. La CATENA ({ base, passi:[{segno,n}] }) è la fonte unica: da lì escono sia il conto (esito()) sia la frase, così il testo non può raccontare numeri diversi da quelli del conto (test/unita/problemi.test.mjs lo ricontrolla rileggendo le cifre). Nessuna figura sopra la storia: in Domanda.vue un soggetto sta in un riquadro largo come i tasti delle risposte, e su un telefono sembrerebbe un quinto tasto.
import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'

// nomi corti, che si leggono in un colpo: il problema è già una cosa da leggere
const CHI = ['Nina', 'Teo', 'Milo', 'Zoe', 'Bruno', 'Lea', 'Gigi', 'Vera']

// `f` è il genere del plurale («Quante mele»/«Quanti pastelli»); il resto è scritto per NON dover accordare («ne», invariabile). `piu`/`meno` sono coerenti con la cosa (si raccolgono le mele, si vincono le biglie). `gruppo` è il contenitore per moltiplicazioni/divisioni. `con` è la seconda specie del dato-in-più al grado 6: sta di casa con la prima, se no si scarta senza leggerlo.
const COSE = [
  {
    uno: 'mela', tanti: 'mele', f: true, em: '🍎',
    piu: ['ne raccoglie', 'gliene regalano'], meno: ['ne mangia', 'ne regala'],
    gruppo: { uno: 'cesto', tanti: 'cesti', f: false },
    con: { tanti: 'pere', f: true },
  },
  {
    uno: 'caramella', tanti: 'caramelle', f: true, em: '🍬',
    piu: ['ne compra', 'gliene regalano'], meno: ['ne mangia', 'ne regala'],
    gruppo: { uno: 'sacchetto', tanti: 'sacchetti', f: false },
    con: { tanti: 'cioccolatini', f: false },
  },
  {
    uno: 'biscotto', tanti: 'biscotti', f: false, em: '🍪',
    piu: ['ne cuoce', 'gliene regalano'], meno: ['ne mangia', 'ne regala'],
    gruppo: { uno: 'scatola', tanti: 'scatole', f: true },
    con: { tanti: 'merendine', f: true },
  },
  {
    uno: 'figurina', tanti: 'figurine', f: true, em: '🃏',
    piu: ['ne compra', 'ne vince'], meno: ['ne regala', 'ne perde'],
    gruppo: { uno: 'pacchetto', tanti: 'pacchetti', f: false },
    con: { tanti: 'adesivi', f: false },
  },
  {
    uno: 'biglia', tanti: 'biglie', f: true, em: '🔮',
    piu: ['ne vince', 'gliene regalano'], meno: ['ne perde', 'ne regala'],
    gruppo: { uno: 'barattolo', tanti: 'barattoli', f: false },
    con: { tanti: 'trottole', f: true },
  },
  {
    uno: 'pastello', tanti: 'pastelli', f: false, em: '🖍️',
    piu: ['ne compra', 'gliene regalano'], meno: ['ne rompe', 'ne regala'],
    gruppo: { uno: 'astuccio', tanti: 'astucci', f: false },
    con: { tanti: 'gomme', f: true },
  },
  {
    uno: 'fiore', tanti: 'fiori', f: false, em: '🌼',
    piu: ['ne coglie', 'gliene regalano'], meno: ['ne regala', 'ne perde'],
    gruppo: { uno: 'vaso', tanti: 'vasi', f: false },
    con: { tanti: 'foglie', f: true },
  },
  {
    uno: 'sasso', tanti: 'sassi', f: false, em: '🪨',
    piu: ['ne raccoglie', 'ne trova'], meno: ['ne regala', 'ne perde'],
    gruppo: { uno: 'secchiello', tanti: 'secchielli', f: false },
    con: { tanti: 'conchiglie', f: true },
  },
  {
    uno: 'uovo', tanti: 'uova', f: true, em: '🥚',
    piu: ['ne raccoglie', 'ne trova'], meno: ['ne rompe', 'ne regala'],
    gruppo: { uno: 'cestino', tanti: 'cestini', f: false },
    con: { tanti: 'piume', f: true },
  },
  {
    uno: 'libro', tanti: 'libri', f: false, em: '📗',
    piu: ['ne compra', 'gliene regalano'], meno: ['ne presta', 'ne regala'],
    gruppo: { uno: 'scaffale', tanti: 'scaffali', f: false },
    con: { tanti: 'riviste', f: true },
  },
  {
    uno: 'palloncino', tanti: 'palloncini', f: false, em: '🎈',
    // «ne scoppia 9» no: scoppiare non regge un complemento oggetto, li fa scoppiare
    piu: ['ne gonfia', 'gliene regalano'], meno: ['ne fa scoppiare', 'ne regala'],
    gruppo: { uno: 'mazzo', tanti: 'mazzi', f: false },
    con: { tanti: 'candeline', f: true },
  },
  {
    uno: 'conchiglia', tanti: 'conchiglie', f: true, em: '🐚',
    piu: ['ne raccoglie', 'ne trova'], meno: ['ne regala', 'ne perde'],
    gruppo: { uno: 'secchiello', tanti: 'secchielli', f: false },
    con: { tanti: 'sassi', f: false },
  },
]

const COMPAGNI = ['amici', 'cugini', 'compagni', 'fratelli']

// due forme, perché l'aggettivo deve concordare con c.tanti (mele rosse, sassi rossi)
const COLORI = [
  { f: 'rosse', m: 'rossi' },
  { f: 'blu', m: 'blu' },
  { f: 'verdi', m: 'verdi' },
  { f: 'gialle', m: 'gialli' },
  { f: 'viola', m: 'viola' },
]
const coloreDi = (col, c) => (c.f ? col.f : col.m)

// le uniche concordanze che restano: il resto delle frasi è scritto apposta per non averne bisogno
const Q = c => (c.f ? 'Quante' : 'Quanti')
const LI = c => (c.f ? 'le' : 'li')

// il verbo che aggiunge non può somigliare a quello che toglie («ne regala 5, poi gliene regalano ancora 5» si rilegge tre volte); si confronta l'ultima parola, «regalano» conta come «regala»
const radice = v => v.split(' ').pop().replace(/no$/, '')
function verboPiu(c, sorte, evita = []) {
  const male = new Set(evita.map(radice))
  const buoni = c.piu.filter(v => !male.has(radice(v)))
  return sorte.uno(buoni.length ? buoni : c.piu)
}

// da qui escono risultato e frase: non esiste un posto dove il testo dica 8 mentre il conto usa 9
function esito({ base, passi }) {
  let n = base
  for (const p of passi) {
    if (p.segno === '+') n += p.n
    else if (p.segno === '-') n -= p.n
    else if (p.segno === '×') n *= p.n
    else n /= p.n
  }
  return n
}

// servono a due cose: controllare che la storia non passi da un negativo (impossibile, non difficile) e costruire il falso di chi si è fermato a metà
function tappe({ base, passi }) {
  const fuori = []
  let n = base
  for (const p of passi) {
    n = esito({ base: n, passi: [p] })
    fuori.push(n)
  }
  return fuori
}

// candidati in ordine di bontà: prima gli errori che dicono qualcosa, poi i tappabuchi. Chi non è intero positivo, o è già in tavola, cade da solo.
function falsi(buona, candidati, sorte) {
  const visti = new Set([buona])
  const fuori = []
  for (const c of candidati) {
    if (fuori.length === 3) break
    const n = c.n
    if (!Number.isInteger(n) || n < 0 || visti.has(n)) continue
    visti.add(n)
    fuori.push(testo(n, c.perche))
  }
  // la rete: due numeri vicini al giusto (il conto contato male di uno è l'errore più comune, ma dice meno, arriva per ultimo)
  for (const d of sorte.mescola([1, 2, -1, -2, 3])) {
    if (fuori.length === 3) break
    const n = buona + d
    if (n < 0 || visti.has(n)) continue
    visti.add(n)
    fuori.push(testo(n, 'Il conto è quello giusto, ma il risultato no: rifallo con calma.'))
  }
  return fuori
}

// una funzione per tipologia: ognuna torna il problema grezzo (testo, catena, falsi candidati, `inutili`); vestirlo da domanda() è un passo dopo uguale per tutte, e il test può guardare il grezzo senza leggere un testo per bambini
const chi = sorte => sorte.uno(CHI)
const cosa = sorte => sorte.uno(COSE)

// «Nina ha 4 mele. Poi ne raccoglie ancora 3. Quante ha adesso?» Il grado 1 tiene il totale entro la decina (si conta ancora con le dita).
function somma(sorte, grado) {
  const c = cosa(sorte)
  const tetto = grado <= 1 ? 10 : 25
  const a = sorte.fra(3, tetto - 3)
  // i due addendi non si allontanano troppo: «ha 2 e gliene regalano 21» è un conto giusto e una storia che non succede
  const b = sorte.fra(2, Math.min(tetto - a, a + 5))
  const catena = { base: a, passi: [{ segno: '+', n: b }] }
  const buona = esito(catena)
  return {
    chiave: 'prob:somma',
    cosa: c,
    testo: `${chi(sorte)} ha ${a} ${c.tanti}. Poi ${sorte.uno(c.piu)} ancora ${b}. ` +
           `${Q(c)} ${c.tanti} ha adesso?`,
    catena,
    inutili: [],
    candidati: [
      { n: a - b, perche: 'Qui si aggiunge, non si toglie: alla fine ne ha di più di prima.' },
      { n: Math.max(a, b), perche: 'Quello è uno dei due numeri della storia, non il totale: vanno messi insieme.' },
      { n: a * b, perche: 'Non sono gruppi uguali da moltiplicare: sono le sue e quelle che arrivano dopo.' },
    ],
    aiuto: 'quello che arriva si somma a quello che c\'era già',
    buona,
  }
}

// «Teo ha 9 biglie. Ne perde 4. Quante gliene restano?»
function resto(sorte, grado) {
  const c = cosa(sorte)
  const tetto = grado <= 2 ? 20 : 40
  const a = sorte.fra(6, tetto)
  const b = sorte.fra(2, a - 2)
  const catena = { base: a, passi: [{ segno: '-', n: b }] }
  return {
    chiave: 'prob:resto',
    cosa: c,
    testo: `${chi(sorte)} ha ${a} ${c.tanti}. ${maiuscola(sorte.uno(c.meno))} ${b}. ` +
           `${Q(c)} gliene restano?`,
    catena,
    inutili: [],
    candidati: [
      { n: a + b, perche: 'Qui se ne vanno: alla fine ne ha di meno di prima, non di più.' },
      { n: b, perche: 'Quelle sono quelle andate via: la domanda chiede quelle rimaste.' },
      { n: a, perche: 'Quelle erano all\'inizio: la storia non è ancora finita lì.' },
    ],
    aiuto: 'quello che va via si toglie da quello che c\'era',
    buona: esito(catena),
  }
}

// «Teo ha 4 scatole di biscotti, in ogni scatola ce ne sono 6. Quanti in tutto?» I gruppi restano nelle tabelline: la difficoltà è riconoscere che è una moltiplicazione, non moltiplicare numeri grossi.
function volte(sorte) {
  const c = cosa(sorte)
  const g = c.gruppo
  const quanti = sorte.fra(2, 9)
  const dentro = sorte.fra(2, 9)
  const catena = { base: dentro, passi: [{ segno: '×', n: quanti }] }
  // due ordini della stessa storia, se no la tipologia avrebbe solo dodici stampi
  const primaHa = sorte.forse(0.5)
  const testoDomanda = primaHa
    ? `${chi(sorte)} ha ${quanti} ${g.tanti} di ${c.tanti}. In ogni ${g.uno} ci sono ${dentro} ${c.tanti}. ${Q(c)} ${c.tanti} ha in tutto?`
    : `In ogni ${g.uno} ci sono ${dentro} ${c.tanti}. ${chi(sorte)} ne compra ${quanti} ${g.tanti}. ${Q(c)} ${c.tanti} ha in tutto?`
  return {
    chiave: 'prob:volte',
    cosa: c,
    testo: testoDomanda,
    catena,
    inutili: [],
    candidati: [
      { n: dentro + quanti, perche: `Non è una somma: ${g.uno} per ${g.uno}, quelle di dentro si contano ogni volta da capo.` },
      { n: dentro * quanti - dentro, perche: `Hai contato un ${g.uno} di meno: sono ${quanti}.` },
      { n: dentro * (quanti + 1), perche: `Hai contato un ${g.uno} di troppo: sono ${quanti}.` },
    ],
    aiuto: 'gruppi tutti uguali: quanti ce n\'è in uno, per quanti gruppi sono',
    buona: esito(catena),
  }
}

// due modi di dividere, stesso conto: fra quante persone o in quanti contenitori. Si alternano perché la divisione a scuola arriva con tutte e due le facce.
function parti(sorte) {
  const c = cosa(sorte)
  const quante = sorte.fra(2, 9)          // quante ne riceve ognuno
  const parti_ = sorte.fra(2, 6)          // in quante parti
  const tot = quante * parti_
  const catena = { base: tot, passi: [{ segno: '÷', n: parti_ }] }
  const fraPersone = sorte.forse(0.5)
  const g = c.gruppo
  const testoDomanda = fraPersone
    ? `${chi(sorte)} ha ${tot} ${c.tanti} e ${LI(c)} divide in parti uguali fra ${parti_} ` +
      `${sorte.uno(COMPAGNI)}. ${Q(c)} ne riceve ciascuno?`
    : `${chi(sorte)} mette ${tot} ${c.tanti} in ${parti_} ${g.tanti}, lo stesso numero in ognuno. ` +
      `${Q(c)} ${c.tanti} ci sono in ogni ${g.uno}?`
  return {
    chiave: 'prob:parti',
    cosa: c,
    testo: testoDomanda,
    catena,
    inutili: [],
    candidati: [
      { n: tot - parti_, perche: 'Qui non se ne va via nessuna: si spartiscono tutte, in parti uguali.' },
      { n: parti_, perche: `Quello è in quante parti si divide, non quante ne tocca per parte.` },
      { n: quante + 1, perche: 'Contale di nuovo: tante volte tante devono tornare esattamente il totale.' },
    ],
    aiuto: 'si spartisce tutto in parti uguali: nessuna avanza e nessuna manca',
    buona: esito(catena),
  }
}

// «Milo ha 14 biglie. Ne perde 6, poi ne vince ancora 9. Quante gliene restano?» Il falso che conta è il primo passo lasciato lì.
function due(sorte) {
  const c = cosa(sorte)
  const a = sorte.fra(10, 30)
  const via = sorte.fra(2, a - 4)
  const torna = sorte.fra(2, 15)
  const primaViaPoiSu = sorte.forse(0.6)
  const catena = primaViaPoiSu
    ? { base: a, passi: [{ segno: '-', n: via }, { segno: '+', n: torna }] }
    : { base: a, passi: [{ segno: '+', n: torna }, { segno: '-', n: via }] }
  const [dopoUno] = tappe(catena)
  const giu = sorte.uno(c.meno)
  const su = verboPiu(c, sorte, [giu])
  const testoDomanda = primaViaPoiSu
    ? `${chi(sorte)} ha ${a} ${c.tanti}. ${maiuscola(giu)} ${via}, ` +
      `poi ${su} ancora ${torna}. ${Q(c)} gliene restano?`
    : `${chi(sorte)} ha ${a} ${c.tanti}. ${maiuscola(su)} ancora ${torna}, ` +
      `poi ${giu} ${via}. ${Q(c)} gliene restano?`
  return {
    chiave: 'prob:due',
    cosa: c,
    testo: testoDomanda,
    catena,
    inutili: [],
    candidati: [
      { n: dopoUno, perche: 'Ti sei fermato a metà: dopo la prima cosa ne succede un\'altra.' },
      { n: a + via + torna, perche: 'Uno dei due numeri va tolto, non sommato: rileggi cosa succede prima.' },
      { n: a - via - torna, perche: 'Uno dei due numeri va sommato, non tolto: rileggi cosa succede dopo.' },
    ],
    aiuto: 'un passo per volta: prima cosa succede, e solo dopo cosa succede ancora',
    buona: esito(catena),
  }
}

// «In ogni sacchetto ci sono 5 caramelle. Nina compra 3 sacchetti, poi ne mangia 4. Quante gliene restano?»
function dueVolte(sorte) {
  const c = cosa(sorte)
  const g = c.gruppo
  const dentro = sorte.fra(2, 6)
  const quanti = sorte.fra(2, 5)
  const tot = dentro * quanti
  const via = sorte.fra(2, tot - 2)
  const catena = { base: dentro, passi: [{ segno: '×', n: quanti }, { segno: '-', n: via }] }
  return {
    chiave: 'prob:due-volte',
    cosa: c,
    testo: `In ogni ${g.uno} ci sono ${dentro} ${c.tanti}. ${chi(sorte)} compra ${quanti} ${g.tanti}, ` +
           `poi ${sorte.uno(c.meno)} ${via}. ${Q(c)} gliene restano?`,
    catena,
    inutili: [],
    candidati: [
      { n: tot, perche: 'Ti sei fermato a metà: dopo averle comprate ne succede ancora una.' },
      { n: dentro + quanti - via, perche: `Non è una somma: ${g.uno} per ${g.uno}, quelle di dentro si contano ogni volta da capo.` },
      { n: tot + via, perche: 'L\'ultima cosa che succede le porta via, non le aggiunge.' },
    ],
    aiuto: 'prima quante sono in tutto, e solo dopo quante ne vanno via',
    buona: esito(catena),
  }
}

// stessa storia di prob:due con un passo in più: il falso «fermato a metà» qui è doppio (dopo il primo o il secondo passo)
function tre(sorte) {
  const c = cosa(sorte)
  const a = sorte.fra(15, 40)
  const via1 = sorte.fra(2, Math.max(3, Math.floor(a / 2)))
  const su = sorte.fra(2, 15)
  const via2 = sorte.fra(2, Math.max(3, a - via1 + su - 2))
  const catena = {
    base: a,
    passi: [{ segno: '-', n: via1 }, { segno: '+', n: su }, { segno: '-', n: via2 }],
  }
  const [uno_, due_] = tappe(catena)
  const meno = sorte.mescola(c.meno)
  const piu = verboPiu(c, sorte, meno)
  return {
    chiave: 'prob:tre',
    cosa: c,
    testo: `${chi(sorte)} ha ${a} ${c.tanti}. ${maiuscola(meno[0])} ${via1}, ` +
           `poi ${piu} ancora ${su}, poi ${meno[1] || meno[0]} ${via2}. ` +
           `${Q(c)} gliene restano?`,
    catena,
    inutili: [],
    candidati: [
      { n: due_, perche: 'Ti sei fermato al secondo passo: dopo ne succede ancora una.' },
      { n: uno_, perche: 'Ti sei fermato al primo passo: la storia va avanti ancora due volte.' },
      { n: a - via1 - su - via2, perche: 'Una delle tre cose le aggiunge, non le porta via: rileggi quella in mezzo.' },
    ],
    aiuto: 'una cosa per volta, in ordine: il totale cambia a ogni passo',
    buona: esito(catena),
  }
}

function treVolte(sorte) {
  const c = cosa(sorte)
  const g = c.gruppo
  const dentro = sorte.fra(2, 6)
  const quanti = sorte.fra(2, 5)
  const tot = dentro * quanti
  const su = sorte.fra(2, 12)
  const via = sorte.fra(2, tot + su - 2)
  const catena = {
    base: dentro,
    passi: [{ segno: '×', n: quanti }, { segno: '+', n: su }, { segno: '-', n: via }],
  }
  const [, due_] = tappe(catena)
  const giu = sorte.uno(c.meno)
  const piu = verboPiu(c, sorte, [giu])
  return {
    chiave: 'prob:tre-volte',
    cosa: c,
    testo: `In ogni ${g.uno} ci sono ${dentro} ${c.tanti}. ${chi(sorte)} compra ${quanti} ${g.tanti}, ` +
           `poi ${piu} ancora ${su}, poi ${giu} ${via}. ` +
           `${Q(c)} gliene restano?`,
    catena,
    inutili: [],
    candidati: [
      { n: due_, perche: 'Ti sei fermato al secondo passo: alla fine ne va via ancora qualcuna.' },
      { n: tot, perche: `Quelle sono solo quelle dei ${g.tanti}: dopo la storia va avanti.` },
      { n: dentro + quanti + su - via, perche: `Non è una somma: ${g.uno} per ${g.uno}, quelle di dentro si contano ogni volta da capo.` },
    ],
    aiuto: 'prima quante sono in tutto, poi quelle che arrivano, poi quelle che se ne vanno',
    buona: esito(catena),
  }
}

// capire cosa serve e cosa no: sei storie, il numero in più è sempre plausibile (l'età di chi racconta, un'altra specie di cose, il giorno del mese, un colore, un prezzo...) o si scarta senza leggerlo. Due regole: il dato in più non è MAI uguale a un numero che serve o alla risposta (trovata dal test, non dall'occhio); fra i falsi c'è sempre il risultato di chi l'ha usato lo stesso — il falso che vale tutta la domanda.

// un numero libero: null se sono tutti occupati, e allora si cambia storia
function fuoriDaiPiedi(sorte, da, a, usati) {
  const liberi = []
  for (let n = da; n <= a; n++) if (!usati.has(n)) liberi.push(n)
  return liberi.length ? sorte.uno(liberi) : null
}
function inutili(sorte) {
  const c = cosa(sorte)
  const quale = sorte.fra(1, 6)
  const nome = chi(sorte)

  if (quale === 1) { // l'età di chi racconta: il classico dei quaderni di seconda
    const a = sorte.fra(8, 30)
    const via = sorte.fra(2, a - 2)
    const catena = { base: a, passi: [{ segno: '-', n: via }] }
    const buona = esito(catena)
    const eta = fuoriDaiPiedi(sorte, 5, 11, new Set([a, via, buona]))
    if (eta === null) return inutiliDiRipiego(sorte, c, nome)
    return {
      chiave: 'prob:inutili',
      cosa: c,
      testo: `${nome} ha ${eta} anni e ${a} ${c.tanti}. ${maiuscola(sorte.uno(c.meno))} ${via}. ` +
             `${Q(c)} gliene restano?`,
      catena,
      inutili: [eta],
      candidati: [
        { n: a - via + eta, perche: 'Gli anni non si sommano alle cose che ha: quel numero va lasciato dov\'è.' },
        { n: a - via - eta, perche: 'Gli anni non c\'entrano niente con le cose che ha: non si tolgono.' },
        { n: a - eta, perche: 'Hai tolto gli anni invece di quelle andate via: rileggi cosa chiede la domanda.' },
        { n: a + via, perche: 'Quelle se ne vanno: alla fine ne ha di meno, non di più.' },
      ],
      aiuto: 'nella storia c\'è un numero che non serve: cerca prima cosa chiede la domanda',
      buona,
    }
  }

  if (quale === 2) { // due specie nello stesso posto: si contano solo quelle chieste
    const a = sorte.fra(8, 30)
    const via = sorte.fra(2, a - 2)
    const catena = { base: a, passi: [{ segno: '-', n: via }] }
    const buona = esito(catena)
    const altre = fuoriDaiPiedi(sorte, 3, 20, new Set([a, via, buona]))
    if (altre === null) return inutiliDiRipiego(sorte, c, nome)
    return {
      chiave: 'prob:inutili',
      cosa: c,
      // qui il «ne» non si può usare: con due specie «ne prende 5» non dice di quali. Il verbo si scrive per esteso, col suo complemento oggetto.
      testo: `Sul tavolo ci sono ${a} ${c.tanti} e ${altre} ${c.con.tanti}. ` +
             `${nome} prende ${via} ${via === 1 ? c.uno : c.tanti}. ${Q(c)} ${c.tanti} restano sul tavolo?`,
      catena,
      inutili: [altre],
      candidati: [
        { n: a + altre - via, perche: `Le ${c.con.tanti} non sono ${c.tanti}: la domanda chiede solo queste ultime.` },
        { n: altre, perche: `Quelle sono le ${c.con.tanti}, e non c'entrano con quello che chiede la domanda.` },
        { n: a + via, perche: 'Quelle se ne vanno: alla fine ne restano di meno, non di più.' },
      ],
      aiuto: 'sul tavolo c\'è anche altro: conta solo quello che la domanda nomina',
      buona,
    }
  }

  if (quale === 3) { // dentro un problema a gruppi: i giorni passati, che sembrano parte della storia e non lo sono
    const g = c.gruppo
    const dentro = sorte.fra(2, 6)
    const quanti = sorte.fra(2, 5)
    const catena = { base: dentro, passi: [{ segno: '×', n: quanti }] }
    const buona = esito(catena)
    const giorni = fuoriDaiPiedi(sorte, 2, 9, new Set([dentro, quanti, buona]))
    if (giorni === null) return inutiliDiRipiego(sorte, c, nome)
    return {
      chiave: 'prob:inutili',
      cosa: c,
      testo: `${nome} ha ${quanti} ${g.tanti} di ${c.tanti}, ${g.f ? 'comprate' : 'comprati'} ${giorni} giorni fa. ` +
             `In ogni ${g.uno} ci sono ${dentro} ${c.tanti}. ${Q(c)} ${c.tanti} ha in tutto?`,
      catena,
      inutili: [giorni],
      candidati: [
        { n: dentro * quanti * giorni, perche: 'I giorni non moltiplicano niente: le cose sono sempre quelle.' },
        { n: dentro * quanti + giorni, perche: 'I giorni non si sommano alle cose: quel numero va lasciato dov\'è.' },
        { n: dentro + quanti, perche: `Non è una somma: ${g.uno} per ${g.uno}, quelle di dentro si contano ogni volta da capo.` },
      ],
      aiuto: 'un numero della storia non serve al conto: trova prima cosa si chiede',
      buona,
    }
  }

  if (quale === 4) { // una data: un'etichetta buttata lì sopra, non un numero della storia
    const a = sorte.fra(8, 30)
    const via = sorte.fra(2, a - 2)
    const catena = { base: a, passi: [{ segno: '-', n: via }] }
    const buona = esito(catena)
    const giorno = fuoriDaiPiedi(sorte, 1, 28, new Set([a, via, buona]))
    if (giorno === null) return inutiliDiRipiego(sorte, c, nome)
    return {
      chiave: 'prob:inutili',
      cosa: c,
      testo: `Il ${giorno} del mese, ${nome} ha ${a} ${c.tanti}. ${maiuscola(sorte.uno(c.meno))} ${via}. ` +
             `${Q(c)} gliene restano?`,
      catena,
      inutili: [giorno],
      candidati: [
        { n: a - via + giorno, perche: 'Il giorno del mese non si somma alle cose che ha: quel numero va lasciato dov\'è.' },
        { n: a - via - giorno, perche: 'Il giorno del mese non c\'entra niente con le cose che ha: non si toglie.' },
        { n: a - giorno, perche: 'Hai tolto il giorno del mese invece di quelle andate via: rileggi cosa chiede la domanda.' },
        { n: a + via, perche: 'Quelle se ne vanno: alla fine ne ha di meno, non di più.' },
      ],
      aiuto: 'nella storia c\'è un numero che non serve: cerca prima cosa chiede la domanda',
      buona,
    }
  }

  if (quale === 5) { // un colore: parte del mucchio, ma la domanda chiede il totale non «quante di quel colore»
    const colore = sorte.uno(COLORI)
    const a = sorte.fra(10, 30)
    const via = sorte.fra(2, a - 2)
    const catena = { base: a, passi: [{ segno: '-', n: via }] }
    const buona = esito(catena)
    const colorate = fuoriDaiPiedi(sorte, 2, a - 2, new Set([a, via, buona]))
    if (colorate === null) return inutiliDiRipiego(sorte, c, nome)
    const agg = coloreDi(colore, c)
    return {
      chiave: 'prob:inutili',
      cosa: c,
      testo: `${nome} ha ${a} ${c.tanti}, e ${colorate} sono ${agg}. ` +
             `${maiuscola(sorte.uno(c.meno))} ${via}. ${Q(c)} gliene restano in tutto?`,
      catena,
      inutili: [colorate],
      candidati: [
        { n: buona - colorate, perche: `Quante sono ${agg} non conta: la domanda chiede il totale che resta.` },
        { n: colorate, perche: `Quelle sono solo quelle ${agg}: la domanda chiede tutte quelle che restano.` },
        { n: a + via, perche: 'Quelle se ne vanno: alla fine ne restano di meno, non di più.' },
      ],
      aiuto: 'nella storia c\'è un numero che non serve: cerca prima cosa chiede la domanda',
      buona,
    }
  }

  // 6. un prezzo: la domanda chiede quante ne restano, non quanto costano
  const a = sorte.fra(8, 30)
  const via = sorte.fra(2, a - 2)
  const catena = { base: a, passi: [{ segno: '-', n: via }] }
  const buona = esito(catena)
  const prezzo = fuoriDaiPiedi(sorte, 1, 9, new Set([a, via, buona]))
  if (prezzo === null) return inutiliDiRipiego(sorte, c, nome)
  return {
    chiave: 'prob:inutili',
    cosa: c,
    testo: `Ogni ${c.uno} costa ${prezzo} euro. ${nome} ha ${a} ${c.tanti}. ` +
           `${maiuscola(sorte.uno(c.meno))} ${via}. ${Q(c)} gliene restano?`,
    catena,
    inutili: [prezzo],
    candidati: [
      { n: a - via + prezzo, perche: 'Il prezzo non si somma alle cose che ha: quel numero va lasciato dov\'è.' },
      { n: a - via - prezzo, perche: 'Il prezzo non c\'entra niente con quante ne restano: non si toglie.' },
      { n: prezzo, perche: 'Quello è il prezzo di una, non quante gliene restano.' },
      { n: a + via, perche: 'Quelle se ne vanno: alla fine ne ha di meno, non di più.' },
    ],
    aiuto: 'nella storia c\'è un numero che non serve: cerca prima cosa chiede la domanda',
    buona,
  }
}

// scappatoia dei rari casi in cui il dato in più capiterebbe uguale alla risposta: meglio una storia in meno che una risposta sbagliata difendibile
function inutiliDiRipiego(sorte, c, nome) {
  const a = sorte.fra(12, 30)
  const via = sorte.fra(2, 6)
  const eta = a + sorte.fra(1, 5)      // più grande del totale: non può essere il resto
  const catena = { base: a, passi: [{ segno: '-', n: via }] }
  return {
    chiave: 'prob:inutili',
    cosa: c,
    testo: `${nome} ha ${a} ${c.tanti} e ${LI(c)} tiene in una scatola che pesa ${eta} grammi. ` +
           `${maiuscola(sorte.uno(c.meno))} ${via}. ${Q(c)} gliene restano?`,
    catena,
    inutili: [eta],
    candidati: [
      { n: a - via - eta, perche: 'Il peso della scatola non c\'entra con quante ce ne sono dentro.' },
      { n: eta - via, perche: 'Hai fatto il conto sui grammi: la domanda parla di quante ne restano.' },
      { n: a + via, perche: 'Quelle se ne vanno: alla fine ne ha di meno, non di più.' },
    ],
    aiuto: 'nella storia c\'è un numero che non serve: cerca prima cosa chiede la domanda',
    buona: esito(catena),
  }
}

const maiuscola = s => s.charAt(0).toUpperCase() + s.slice(1)

// dal grezzo alla domanda, uguale per tutte le storie
function vesti(p, sorte) {
  // niente `soggetto`: la domanda è tutta nella storia, un riquadro sopra i numeri si leggerebbe come una quinta risposta
  return domanda({
    testo: p.testo,
    buona: testo(p.buona),
    falsi: falsi(p.buona, p.candidati, sorte),
    chiave: p.chiave,
    aiuto: p.aiuto,
    sorte,
  })
}

// costruzione grezza, esportata per il test: la storia prima che diventi domanda, così test/unita/problemi.test.mjs rilegge le cifre senza interpretare l'italiano
export function costruisci(tipo, grado, sorte) {
  switch (tipo) {
    case 'prob:somma': return somma(sorte, grado)
    case 'prob:resto': return resto(sorte, grado)
    case 'prob:volte': return volte(sorte)
    case 'prob:parti': return parti(sorte)
    case 'prob:due': return due(sorte)
    case 'prob:due-volte': return dueVolte(sorte)
    case 'prob:tre': return tre(sorte)
    case 'prob:tre-volte': return treVolte(sorte)
    case 'prob:inutili': return inutili(sorte)
    default: return somma(sorte, grado)
  }
}

// non è una scala di numeri più grandi: è una scala di passi da fare (uno, uno, uno, due, tre), e in cima un passo da NON fare (il dato che non serve)
const SCALETTA = [
  'una storia sola: quello che arriva si somma',
  'quello che va via si toglie',
  'i gruppi uguali: tante volte tanti, e le parti uguali',
  'due conti di fila',
  'tre conti di fila',
  'i dati che non servono',
]

// moltiplicazioni/divisioni sono le uniche che dichiarano un altro pezzo di scuola: chi non le ha fatte non legge «in ogni scatola ce ne sono 6» come un conto. Tutto il resto sta sotto `problemi`, che spegne il modulo intero.
const TIPI = [
  { chiave: 'prob:somma', nome: 'Quello che arriva si somma', sa: 'problemi',
    gradi: { 1: 1, 2: 0.3 } },
  { chiave: 'prob:resto', nome: 'Quello che va via si toglie', sa: 'problemi',
    gradi: { 2: 0.7 } },
  { chiave: 'prob:volte', nome: 'Tante volte tanti', sa: ['moltiplicazioni', 'problemi'],
    gradi: { 3: 0.5 } },
  { chiave: 'prob:parti', nome: 'Le parti uguali', sa: ['problemi', 'divisioni'],
    gradi: { 3: 0.5 } },
  { chiave: 'prob:due', nome: 'Due conti di fila', sa: 'problemi',
    gradi: { 4: 0.6 } },
  { chiave: 'prob:due-volte', nome: 'Due conti, con i gruppi', sa: ['moltiplicazioni', 'problemi'],
    gradi: { 4: 0.4 } },
  { chiave: 'prob:tre', nome: 'Tre conti di fila', sa: 'problemi',
    gradi: { 5: 0.7 } },
  { chiave: 'prob:tre-volte', nome: 'Tre conti, con i gruppi', sa: ['moltiplicazioni', 'problemi'],
    gradi: { 5: 0.3 } },
  { chiave: 'prob:inutili', nome: 'I dati che non servono', sa: 'problemi',
    gradi: { 6: 1 } },
]

class Problemi extends Modulo {
  constructor() {
    super({
      id: 'problemi',
      nome: 'Problemi',
      icona: '📝',
      materia: 'matematica',
      chiaro: 'leggere una storia con dei numeri dentro e capire da solo che conto chiede',
      scaletta: SCALETTA,
      livelli: [38, 44, 56, 63, 75, 81], // scala 0-100 comune a tutte le materie (vedi docs/apprendimento/quiz-livelli.md)
      tipi: TIPI,
    })
  }

  genera(grado, sorte, tipo) {
    return vesti(costruisci(tipo, grado, sorte), sorte)
  }
}

export default new Problemi()

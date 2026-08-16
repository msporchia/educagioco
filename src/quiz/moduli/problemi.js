/* ═══════════════════════════════════════════════════════════════════
   I PROBLEMI A PAROLE — la matematica che smette di essere una
   tabellina.

   Tutti gli altri moduli di matematica chiedono un conto: `7 × 8`, «5 m
   quanti cm sono?», «quale numero sta fra 40 e 60?». Qui il conto non
   c'è scritto da nessuna parte: c'è una storia, e la prima cosa da fare
   — l'unica che questo modulo allena davvero — è **capire che conto
   chiede**. Un bambino che sa tutte le tabelline e non sa che «in ogni
   scatola ce ne sono 6, le scatole sono 4» è una moltiplicazione, alla
   scuola vera si ferma lì.

   SI RISPONDE SCEGLIENDO FRA QUATTRO NUMERI, come in tutti gli altri
   quiz. Chiedere di *scrivere* il risultato vorrebbe dire una tastiera,
   una conferma, un modo di cancellare: un'interfaccia tutta sua, dentro
   una scheda che oggi sa mostrare qualunque materia proprio perché non
   ne conosce nessuna. Il prezzo è che una risposta si può azzeccare, e
   si paga volentieri: i tre falsi sono presi dagli errori veri, e
   azzeccare tirando a caso costa più fatica che ragionare.

   LA CATENA È LA FONTE UNICA. Un problema qui dentro non è un testo con
   accanto un risultato scritto a mano — quello è il modo di scrivere
   due cose che un giorno non si somigliano più. È una **catena**:

     { base: 14, passi: [{ segno: '-', n: 6 }, { segno: '+', n: 9 }] }

   Da lì escono tutte e due le cose: il conto (`esito()`) e la frase
   («Ne perde 6, poi ne vince ancora 9»). Il testo non può raccontare
   numeri diversi da quelli che il conto usa, perché è la stessa catena
   a dettarli — e `test/unita/problemi.test.mjs` lo ricontrolla dal lato
   opposto, rileggendo le cifre scritte nel testo per un bambino.

   I FALSI SONO I QUATTRO ERRORI DI SEMPRE, e sono gli stessi che fa un
   bambino a un compito in classe:

     · **l'operazione girata** — ha sommato dove si toglieva. È il
       primo, ed è quello che dice se ha capito la storia o se ha visto
       due numeri e li ha messi insieme;
     · **il passo dimenticato** — ha fatto il primo conto e si è
       fermato, che nei problemi a due e tre passi è l'errore numero uno;
     · **il dato in più usato lo stesso** — al grado 6, dove c'è un
       numero che non serve: chi lo somma dà proprio quella risposta;
     · **l'uno di troppo** — il conto giusto contato male.

   Un distrattore preso a caso si scarterebbe a occhio e la domanda si
   risolverebbe per esclusione invece che leggendola, che è esattamente
   il contrario di quello che serve qui.

   NESSUNA FIGURA SOPRA LA STORIA, ed è stato deciso guardando lo
   schermo e non prima. C'era: l'emoji della cosa di cui si parla, messa
   lì per aiutare chi legge piano. In `Domanda.vue` un soggetto sta
   dentro un riquadro **largo uguale ai tasti delle risposte**, appena
   sopra i quattro numeri — e su un telefono un bambino non ha nessun
   modo di sapere che quello non è il quinto tasto. Negli altri moduli
   il rischio si paga volentieri perché la figura *è* la domanda
   (l'orologio, la fila di figure); qui non porta niente: la storia
   nomina già i pastelli tre righe sopra.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'

/* ═══════════════════════════════════════════════════════════════════
   IL MONDO — chi, e che cosa.

   Nomi corti, di quelli che si leggono in un colpo: il problema è già
   una cosa da leggere, e un nome lungo è fatica spesa dove non insegna
   niente.
   ═══════════════════════════════════════════════════════════════════ */
const CHI = ['Nina', 'Teo', 'Milo', 'Zoe', 'Bruno', 'Lea', 'Gigi', 'Vera']

/* Una cosa porta con sé la sua lingua, e i suoi verbi. `f` è il genere
   del plurale — serve a «Quante mele» contro «Quanti pastelli», e non
   c'è modo di evitarlo in italiano. Tutto il resto è scritto per NON
   dover accordare: i verbi cominciano con «ne», che è invariabile, e la
   domanda finale è «quante gliene restano», che vale per un maschio e
   per una femmina.

   `piu` e `meno` sono coerenti con la cosa: si raccolgono le mele e si
   vincono le biglie, non il contrario. Un verbo storto in un problema
   non è un dettaglio di stile — è una frase che il bambino rilegge tre
   volte pensando di non aver capito.

   `gruppo` è il contenitore per le moltiplicazioni e le divisioni, con
   il suo genere. `con` è la seconda specie che compare al grado 6 come
   dato che non serve: sta di casa insieme alla prima (le mele con le
   pere, i pastelli con le gomme), se no il dato in più si scarta senza
   nemmeno leggerlo. */
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
    /* «ne scoppia 9» no: scoppiare non regge un complemento oggetto,
       li fa scoppiare — ed è il genere di frase che un bambino rilegge
       due volte credendo di non aver capito */
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

/* con chi si divide, al grado delle parti uguali */
const COMPAGNI = ['amici', 'cugini', 'compagni', 'fratelli']

/* ── la lingua, in tre righe ──
   Sono le uniche concordanze che restano: il resto delle frasi è
   scritto apposta per non averne bisogno. */
const Q = c => (c.f ? 'Quante' : 'Quanti')
const LI = c => (c.f ? 'le' : 'li')

/* Il verbo che aggiunge non può somigliare a quello che toglie: «ne
   regala 5, poi gliene regalano ancora 5» è una storia che si rilegge
   tre volte per capire da che parte vanno le cose. Si confronta
   l'ultima parola — il verbo vero — e «regalano» conta come «regala». */
const radice = v => v.split(' ').pop().replace(/no$/, '')
function verboPiu(c, sorte, evita = []) {
  const male = new Set(evita.map(radice))
  const buoni = c.piu.filter(v => !male.has(radice(v)))
  return sorte.uno(buoni.length ? buoni : c.piu)
}

/* ═══════════════════════════════════════════════════════════════════
   LA CATENA — il conto, in forma di dato.

   Da qui escono il risultato e la frase, e questo è tutto il punto: non
   esiste un posto dove il testo possa dire 8 mentre il conto ne usa 9.
   ═══════════════════════════════════════════════════════════════════ */
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

/* i risultati intermedi, che servono a due cose: controllare che una
   storia non passi mai da un numero negativo («ne regala 9» quando ne
   ha 4 non è una storia difficile, è una storia impossibile) e
   costruire il falso di chi si è fermato a metà */
function tappe({ base, passi }) {
  const fuori = []
  let n = base
  for (const p of passi) {
    n = esito({ base: n, passi: [p] })
    fuori.push(n)
  }
  return fuori
}

/* ═══════════════════════════════════════════════════════════════════
   I FALSI — dagli errori veri, e mai due uguali.

   Si passano i candidati in ordine di bontà: i primi sono gli errori
   che dicono qualcosa («hai sommato invece di togliere»), gli ultimi
   sono i tappabuchi. Chi non è un numero intero positivo, o è già in
   tavola, cade da solo.
   ═══════════════════════════════════════════════════════════════════ */
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
  /* la rete: due numeri vicini al giusto. Non sono presi a caso — «il
     conto contato male di uno» è l'errore più comune che ci sia — ma
     dicono meno degli altri, e per questo arrivano per ultimi. */
  for (const d of sorte.mescola([1, 2, -1, -2, 3])) {
    if (fuori.length === 3) break
    const n = buona + d
    if (n < 0 || visti.has(n)) continue
    visti.add(n)
    fuori.push(testo(n, 'Il conto è quello giusto, ma il risultato no: rifallo con calma.'))
  }
  return fuori
}

/* ═══════════════════════════════════════════════════════════════════
   LE STORIE — una funzione per tipologia.

   Ognuna torna il problema **grezzo**: il testo, la catena, i falsi
   candidati, e i numeri che nel testo compaiono senza entrare nel conto
   (`inutili`). Vestirlo da `domanda()` è un passo dopo, uguale per
   tutte, ed è anche il motivo per cui il test può guardare il grezzo
   senza doversi leggere un testo per bambini.
   ═══════════════════════════════════════════════════════════════════ */

const chi = sorte => sorte.uno(CHI)
const cosa = sorte => sorte.uno(COSE)

/* ── prob:somma — quello che arriva si somma ──
   «Nina ha 4 mele. Poi ne raccoglie ancora 3. Quante mele ha adesso?»
   Il grado 1 tiene il totale entro la decina, che è il posto dove un
   bambino di sei anni conta ancora con le dita e ci arriva. */
function somma(sorte, grado) {
  const c = cosa(sorte)
  const tetto = grado <= 1 ? 10 : 25
  const a = sorte.fra(3, tetto - 3)
  /* i due addendi non si allontanano troppo: «ha 2 pastelli e gliene
     regalano ancora 21» è un conto giusto e una storia che non succede,
     e la storia è metà di quello che si sta allenando */
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

/* ── prob:resto — quello che va via si toglie ──
   «Teo ha 9 biglie. Ne perde 4. Quante gliene restano?» */
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

/* ── prob:volte — tante volte tanti ──
   «Teo ha 4 scatole di biscotti. In ogni scatola ci sono 6 biscotti.
   Quanti biscotti ha in tutto?»
   I gruppi restano dentro le tabelline: la difficoltà da allenare è
   riconoscere che è una moltiplicazione, non moltiplicare numeri
   grossi — quello lo fa già il castello. */
function volte(sorte) {
  const c = cosa(sorte)
  const g = c.gruppo
  const quanti = sorte.fra(2, 9)
  const dentro = sorte.fra(2, 9)
  const catena = { base: dentro, passi: [{ segno: '×', n: quanti }] }
  return {
    chiave: 'prob:volte',
    cosa: c,
    testo: `${chi(sorte)} ha ${quanti} ${g.tanti} di ${c.tanti}. ` +
           `In ogni ${g.uno} ci sono ${dentro} ${c.tanti}. ${Q(c)} ${c.tanti} ha in tutto?`,
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

/* ── prob:parti — le parti uguali ──
   Due modi di dividere, e sono lo stesso conto visto da due parti: fra
   quante persone (quante ne tocca a ciascuno) e in quanti contenitori
   (quante ne stanno in ognuno). Si alternano perché la divisione a
   scuola arriva con tutte e due le facce, e chi ne riconosce una sola
   davanti all'altra si blocca. */
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

/* ── prob:due — due conti di fila ──
   «Milo ha 14 biglie. Ne perde 6, poi ne vince ancora 9. Quante gliene
   restano?»
   Il falso che conta è il primo passo lasciato lì: è l'errore di chi
   legge fino a metà, e a scuola è il più frequente di tutti. */
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

/* ── prob:due-volte — due conti, e il primo sono i gruppi ──
   «In ogni sacchetto ci sono 5 caramelle. Nina compra 3 sacchetti, poi
   ne mangia 4. Quante gliene restano?» */
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

/* ── prob:tre — tre conti di fila ──
   Stessa storia di `prob:due` con un passo in più, e proprio per questo
   il falso «fermato a metà» qui è doppio: chi si ferma dopo il primo e
   chi si ferma dopo il secondo sbagliano in due modi diversi, e
   meritano due risposte diverse. */
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

/* ── prob:tre-volte — tre conti, e in mezzo ci sono i gruppi ── */
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

/* ── prob:inutili — i dati che non servono ──
   È la cosa che davvero si impara, e l'unica del modulo che non si può
   allenare col conto: **capire cosa serve e cosa no**. Tre storie, e in
   tutte e tre il numero in più è plausibile — l'età di chi racconta,
   un'altra specie di cose nello stesso cesto, il giorno del mese — se
   no si scarta senza nemmeno leggerlo, e la lezione non c'è.

   Due regole tenute a mano qui dentro, perché sono quelle che rendono
   la domanda onesta:
     · il dato in più non è MAI uguale a un numero che serve, né alla
       risposta. «Zoe ha 5 anni e 30 caramelle, ne regala 5» ha due
       cinque dentro, uno buono e uno no: non è una storia difficile, è
       una storia confusa — e l'ha trovata il test, non l'occhio;
     · fra i falsi c'è sempre il risultato di chi il dato in più l'ha
       usato lo stesso. È il falso che vale tutta la domanda. */

/* un numero dell'intervallo che non sia già in ballo nella storia:
   `null` se sono tutti occupati, e allora si cambia storia */
function fuoriDaiPiedi(sorte, da, a, usati) {
  const liberi = []
  for (let n = da; n <= a; n++) if (!usati.has(n)) liberi.push(n)
  return liberi.length ? sorte.uno(liberi) : null
}
function inutili(sorte) {
  const c = cosa(sorte)
  const quale = sorte.fra(1, 3)
  const nome = chi(sorte)

  /* 1. l'età di chi racconta: il classico dei quaderni di seconda */
  if (quale === 1) {
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

  /* 2. due specie nello stesso posto: si contano solo quelle chieste */
  if (quale === 2) {
    const a = sorte.fra(8, 30)
    const via = sorte.fra(2, a - 2)
    const catena = { base: a, passi: [{ segno: '-', n: via }] }
    const buona = esito(catena)
    const altre = fuoriDaiPiedi(sorte, 3, 20, new Set([a, via, buona]))
    if (altre === null) return inutiliDiRipiego(sorte, c, nome)
    return {
      chiave: 'prob:inutili',
      cosa: c,
      /* qui il «ne» dei verbi non si può usare: con due specie sul
         tavolo «ne prende 5» non dice di quali, e la storia diventa
         ambigua invece che difficile. Il verbo si scrive per esteso,
         con il suo complemento oggetto. */
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

  /* 3. il dato in più dentro un problema a gruppi: il numero dei giorni
     passati, che sembra parte della storia e non lo è */
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

/* la scappatoia dei rari casi in cui il dato in più capiterebbe uguale
   alla risposta: si racconta la stessa storia con numeri scelti perché
   non possano coincidere. Meglio una storia in meno che una domanda in
   cui la risposta sbagliata è difendibile. */
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

/* ═══════════════════════════════════════════════════════════════════
   DAL GREZZO ALLA DOMANDA — uguale per tutte le storie.
   ═══════════════════════════════════════════════════════════════════ */
function vesti(p, sorte) {
  /* niente `soggetto`: qui la domanda è tutta nella storia, e un
     riquadro sopra i numeri si legge come una quinta risposta (vedi in
     testa al file) */
  return domanda({
    testo: p.testo,
    buona: testo(p.buona),
    falsi: falsi(p.buona, p.candidati, sorte),
    chiave: p.chiave,
    aiuto: p.aiuto,
    sorte,
  })
}

/* la costruzione grezza, esportata per il test: restituisce la storia
   prima che diventi una domanda — con la catena, la risposta e i numeri
   che nel testo ci sono ma nel conto no. È così che
   `test/unita/problemi.test.mjs` può rileggere le cifre scritte nel
   testo e controllare che siano esattamente quelle raccontate, senza
   dover interpretare l'italiano. */
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

/* ═══════════════════════════════════════════════════════════════════
   LA SCALA DEI GRADI

   Non è una scala di numeri più grandi: è una scala di **passi da
   fare**. Uno, uno, uno, due, tre, e in cima quello che non è un passo
   in più ma un passo da non fare — il dato che non serve.
   ═══════════════════════════════════════════════════════════════════ */
const SCALETTA = [
  'una storia sola: quello che arriva si somma',
  'quello che va via si toglie',
  'i gruppi uguali: tante volte tanti, e le parti uguali',
  'due conti di fila',
  'tre conti di fila',
  'i dati che non servono',
]

/* Le moltiplicazioni e le divisioni sono le uniche tipologie che
   dichiarano un pezzo di scuola oltre ai problemi: chi a scuola non le
   ha ancora fatte non può leggere «in ogni scatola ce ne sono 6» come
   un conto — e il grado 3 non si chiude, si assottiglia, perché le due
   metà si spengono una per volta. Tutto il resto sta sotto `problemi`,
   che spegne il modulo intero: un problema a parole è una storia da
   leggere, e prima di saperla leggere non è una domanda difficile, è
   una domanda muta. */
const TIPI = [
  { chiave: 'prob:somma', nome: 'Quello che arriva si somma', sa: 'problemi',
    gradi: { 1: 1, 2: 0.3 } },
  { chiave: 'prob:resto', nome: 'Quello che va via si toglie', sa: 'problemi',
    gradi: { 2: 0.7 } },
  { chiave: 'prob:volte', nome: 'Tante volte tanti', sa: ['problemi', 'moltiplicazioni'],
    gradi: { 3: 0.5 } },
  { chiave: 'prob:parti', nome: 'Le parti uguali', sa: ['problemi', 'divisioni'],
    gradi: { 3: 0.5 } },
  { chiave: 'prob:due', nome: 'Due conti di fila', sa: 'problemi',
    gradi: { 4: 0.6 } },
  { chiave: 'prob:due-volte', nome: 'Due conti, con i gruppi', sa: ['problemi', 'moltiplicazioni'],
    gradi: { 4: 0.4 } },
  { chiave: 'prob:tre', nome: 'Tre conti di fila', sa: 'problemi',
    gradi: { 5: 0.7 } },
  { chiave: 'prob:tre-volte', nome: 'Tre conti, con i gruppi', sa: ['problemi', 'moltiplicazioni'],
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
      tipi: TIPI,
    })
  }

  genera(grado, sorte, tipo) {
    return vesti(costruisci(tipo, grado, sorte), sorte)
  }
}

export default new Problemi()

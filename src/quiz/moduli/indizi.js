/* ═══════════════════════════════════════════════════════════════════
   INDIZI — chi sono, dedotto da quello che è vero e da quello che no.

   Viene da `poc/indovinelli.html`, dove sono due famiglie che sembrano
   giochi diversi e sono la stessa macchina: date certe informazioni,
   fra le cose in ballo ne resta esattamente una.

     LE FIGURE     «non è azzurro · è grande · non ce n'è una sola»
                   → di tutte le figure sul tavolo ne resta una sola
     L'INDOVINELLO  «sono giallo · cresco sull'albero · la scimmia mi adora»
                   → la banana

   Le figure riusano gli attributi e il pittore già in casa
   (`grafica/pittori/figure.js`, condiviso con `sequenze`), quindi
   costano poco: la parte nuova è tutta nella scelta degli indizi.

   NESSUN INDIZIO INUTILE. Un indizio che si può togliere senza che la
   risposta torni ambigua è un indizio decorativo, ed è quello che fa
   perdere fiducia al bambino: se dice «non è azzurro» e bastava già il
   resto, ha appena imparato che gli indizi si possono ignorare.
   `gruppiMinimi` prova ogni sottoinsieme di indizi candidati a forza
   bruta — esattamente come il prototipo — e lo tiene solo se isola una
   cosa sola *e* se togliendone uno qualunque torna ambiguo. Non è un
   controllo a posteriori: è così che il gruppo di indizi viene scelto,
   quindi una domanda con un indizio superfluo non può proprio uscire.

   E una terza, più giù, che è la stessa macchina girata di lato: LA
   TABELLA, le griglie logiche in piccolo — «Bruno ha il pesce, Anna
   non ha il cane: che animale ha Carla?» — dove quello che si scarta
   non sono cose sul tavolo ma sistemazioni, e la fila e le due cose
   collegate sono la stessa tabella con un altro vestito.

   `costruisciForme`/`costruisciCose`/`costruisciTabella` restano
   esportate (oltre al modulo di default) apposta: restituiscono il
   materiale grezzo — le candidate sul tavolo, il bersaglio, gli indizi
   con la loro `verifica` — prima che diventi una `domanda()`. È quello
   che il test di unità usa per ricontrollare l'unicità e la minimalità
   senza fidarsi del modulo (la tabella, lì, si rilegge dal testo).
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, scena, emoji, testo } from '../nucleo/domanda.js'
import { PITTORI_FIGURE, FORME_FIGURE } from '../grafica/pittori/figure.js'
import { COLORI } from '../grafica/pittori/tinte.js'

/* ═══════════════════════════════════════════════════════════════════
   LE FIGURE — stesso vocabolario di `sequenze`: forma, colore, quante
   copie, grande o piccola. Qui non c'è rotazione: non serve, «gira» non
   è un indizio che un bambino direbbe di sé.
   ═══════════════════════════════════════════════════════════════════ */
const FORME = FORME_FIGURE.filter(f => f !== 'freccia')
const VALORI = {
  colore: COLORI,
  forma: FORME,
  quante: [1, 2, 3, 4],
  grande: [true, false],
}
const NOMEFORMA = {
  cerchio: 'un cerchio', quadrato: 'un quadrato', triangolo: 'un triangolo',
  rombo: 'un rombo', stella: 'una stella', cuore: 'un cuore',
}
const NOMEQUANTI = { 2: 'due', 3: 'tre', 4: 'quattro' }

/* un indizio su una figura è vero per il bersaglio per costruzione:
   `positivo` dice se il valore è proprio quello del bersaglio o se è
   uno degli altri che il bersaglio NON ha */
function soddisfaForma(ind, f) {
  return ind.positivo ? f[ind.asse] === ind.val : f[ind.asse] !== ind.val
}
function testoIndizioForma(ind) {
  const neg = ind.positivo ? '' : 'non '
  if (ind.asse === 'colore') return neg + 'è ' + ind.val
  if (ind.asse === 'forma') return neg + 'è ' + NOMEFORMA[ind.val]
  /* «grande» ha solo due valori: si dice sempre riferendosi a «grande»,
     mai a «piccola», così non esce mai un doppio-negativo come «non è
     piccola» — «non è grande» dice la stessa cosa ed è più diretto */
  if (ind.asse === 'grande') return neg + 'è grande'
  return ind.val === 1 ? neg + "ce n'è una sola" : neg + 'ce ne sono ' + NOMEQUANTI[ind.val]
}

/* ═══════════════════════════════════════════════════════════════════
   LE COSE DEL MONDO — banana, mucca, sole: ogni cosa porta le sue
   etichette (`tag`), e un indizio è proprio un'etichetta letta a voce
   alta in prima persona. Dati puri, portati dal prototipo.
   `astratto: true` su un'etichetta vuol dire che descrive un
   comportamento invece di un fatto che si vede (essere lenti, essere
   grandi): ai gradi bassi si scartano quando restano abbastanza
   etichette concrete, perché un bambino piccolo le comincia a leggere
   dalle cose che vede, non da quelle che deduce.
   ═══════════════════════════════════════════════════════════════════ */
const SEGNI = {
  giallo: { testo: 'sono giallo' }, rosso: { testo: 'sono rosso' },
  verde: { testo: 'sono verde' }, marrone: { testo: 'sono marrone' },
  bianco: { testo: 'sono bianco' }, nero: { testo: 'sono nero' },
  blu: { testo: 'sono blu' }, arancione: { testo: 'sono arancione' },
  viola: { testo: 'sono viola' },
  albero: { testo: "cresco sull'albero" }, orto: { testo: "cresco nell'orto" },
  mare: { testo: "vivo nell'acqua" }, cielo: { testo: 'sto nel cielo' },
  casa: { testo: 'sto in casa' }, bosco: { testo: 'vivo nel bosco' },
  fattoria: { testo: 'vivo nella fattoria' },
  vola: { testo: 'volo' }, nuota: { testo: 'nuoto' },
  corre: { testo: 'corro veloce' }, salta: { testo: 'salto' },
  lento: { testo: 'sono lento', astratto: true },
  mangiare: { testo: 'mi puoi mangiare' }, dolce: { testo: 'sono dolce' },
  grande: { testo: 'sono grande', astratto: true },
  piccolo: { testo: 'sono piccolo', astratto: true },
  ruote: { testo: 'ho le ruote' }, zampe: { testo: 'ho quattro zampe' },
  freddo: { testo: 'sono freddo' }, caldo: { testo: 'sono caldo' },
  scimmia: { testo: 'la scimmia mi adora' }, coniglio: { testo: 'il coniglio mi adora' },
  notte: { testo: 'si vede di notte' }, suona: { testo: 'faccio musica' },
  legge: { testo: 'si legge' },
}
const COSE = [
  { em: '🍌', nome: 'la banana', tag: ['giallo', 'albero', 'dolce', 'mangiare', 'scimmia'] },
  { em: '🍎', nome: 'la mela', tag: ['rosso', 'albero', 'dolce', 'mangiare'] },
  { em: '🍓', nome: 'la fragola', tag: ['rosso', 'orto', 'dolce', 'mangiare', 'piccolo'] },
  { em: '🍇', nome: "l'uva", tag: ['viola', 'albero', 'dolce', 'mangiare', 'piccolo'] },
  { em: '🍊', nome: "l'arancia", tag: ['arancione', 'albero', 'dolce', 'mangiare'] },
  { em: '🍉', nome: "l'anguria", tag: ['verde', 'orto', 'dolce', 'mangiare', 'grande'] },
  { em: '🍋', nome: 'il limone', tag: ['giallo', 'albero', 'mangiare'] },
  { em: '🥕', nome: 'la carota', tag: ['arancione', 'orto', 'mangiare', 'coniglio'] },
  { em: '🥦', nome: 'il broccolo', tag: ['verde', 'orto', 'mangiare'] },
  { em: '🌽', nome: 'il mais', tag: ['giallo', 'orto', 'mangiare', 'fattoria'] },
  { em: '🍅', nome: 'il pomodoro', tag: ['rosso', 'orto', 'mangiare'] },
  { em: '🥔', nome: 'la patata', tag: ['marrone', 'orto', 'mangiare'] },
  { em: '🍫', nome: 'il cioccolato', tag: ['marrone', 'dolce', 'mangiare', 'casa'] },
  { em: '🍪', nome: 'il biscotto', tag: ['marrone', 'dolce', 'mangiare', 'piccolo'] },
  { em: '🐘', nome: "l'elefante", tag: ['grande', 'zampe', 'lento'] },
  { em: '🐁', nome: 'il topo', tag: ['piccolo', 'casa', 'zampe', 'corre'] },
  { em: '🐟', nome: 'il pesce', tag: ['mare', 'nuota', 'piccolo', 'blu'] },
  { em: '🐦', nome: "l'uccellino", tag: ['cielo', 'vola', 'piccolo'] },
  { em: '🐝', nome: "l'ape", tag: ['giallo', 'vola', 'piccolo', 'corre'] },
  { em: '🐄', nome: 'la mucca', tag: ['bianco', 'fattoria', 'zampe', 'grande'] },
  { em: '🐖', nome: 'il maiale', tag: ['fattoria', 'zampe', 'mangiare'] },
  { em: '🐔', nome: 'la gallina', tag: ['fattoria', 'bianco'] },
  { em: '🐧', nome: 'il pinguino', tag: ['nero', 'nuota', 'freddo'] },
  { em: '🦁', nome: 'il leone', tag: ['giallo', 'zampe', 'grande', 'corre'] },
  { em: '🐢', nome: 'la tartaruga', tag: ['verde', 'lento', 'mare'] },
  { em: '🐇', nome: 'il coniglio', tag: ['bianco', 'bosco', 'salta', 'zampe', 'piccolo'] },
  { em: '🐿️', nome: 'lo scoiattolo', tag: ['marrone', 'bosco', 'salta', 'piccolo', 'zampe'] },
  { em: '🦉', nome: 'il gufo', tag: ['bosco', 'vola', 'notte'] },
  { em: '🚗', nome: "l'automobile", tag: ['ruote', 'corre'] },
  { em: '🚲', nome: 'la bicicletta', tag: ['ruote'] },
  { em: '🚜', nome: 'il trattore', tag: ['ruote', 'fattoria', 'lento'] },
  { em: '⚽', nome: 'il pallone', tag: ['bianco', 'salta'] },
  { em: '🛏️', nome: 'il letto', tag: ['casa', 'grande'] },
  { em: '🪑', nome: 'la sedia', tag: ['casa', 'marrone'] },
  { em: '☀️', nome: 'il sole', tag: ['giallo', 'cielo', 'caldo', 'grande'] },
  { em: '🌙', nome: 'la luna', tag: ['bianco', 'cielo', 'notte'] },
  { em: '⭐', nome: 'la stella', tag: ['giallo', 'cielo', 'notte', 'piccolo'] },
  { em: '❄️', nome: 'il fiocco di neve', tag: ['bianco', 'freddo', 'cielo', 'piccolo'] },
  { em: '🔥', nome: 'il fuoco', tag: ['rosso', 'caldo'] },
  { em: '🎸', nome: 'la chitarra', tag: ['marrone', 'suona', 'casa'] },
  { em: '📖', nome: 'il libro', tag: ['casa', 'legge'] },
  { em: '🕯️', nome: 'la candela', tag: ['caldo', 'casa', 'notte', 'bianco'] },
  { em: '🐺', nome: 'il lupo', tag: ['bosco', 'zampe', 'corre', 'grande'] },
  { em: '🦊', nome: 'la volpe', tag: ['arancione', 'bosco', 'zampe', 'corre'] },
  { em: '🐻', nome: "l'orso", tag: ['marrone', 'bosco', 'zampe', 'grande'] },
  { em: '🦋', nome: 'la farfalla', tag: ['viola', 'vola', 'piccolo'] },
  { em: '🐌', nome: 'la lumaca', tag: ['marrone', 'lento', 'piccolo', 'orto'] },
  { em: '🦆', nome: "l'anatra", tag: ['bianco', 'nuota', 'vola', 'fattoria'] },
  { em: '🐬', nome: 'il delfino', tag: ['mare', 'nuota', 'grande', 'blu'] },
  { em: '🦈', nome: 'lo squalo', tag: ['mare', 'nuota', 'grande', 'corre'] },
  { em: '🌻', nome: 'il girasole', tag: ['giallo', 'orto', 'grande'] },
  { em: '🌹', nome: 'la rosa', tag: ['rosso', 'orto', 'piccolo'] },
  { em: '🍄', nome: 'il fungo', tag: ['marrone', 'bosco', 'piccolo', 'mangiare'] },
  { em: '🥚', nome: "l'uovo", tag: ['bianco', 'fattoria', 'mangiare', 'piccolo'] },
  { em: '⛄', nome: 'il pupazzo di neve', tag: ['bianco', 'freddo', 'grande'] },
  { em: '🎈', nome: 'il palloncino', tag: ['rosso', 'vola', 'cielo'] },
  { em: '🚂', nome: 'il treno', tag: ['ruote', 'corre', 'grande', 'nero'] },
  { em: '🥁', nome: 'il tamburo', tag: ['suona', 'casa', 'grande'] },
  { em: '🦅', nome: "l'aquila", tag: ['marrone', 'vola', 'cielo', 'grande'] },
  { em: '🐳', nome: 'la balena', tag: ['mare', 'nuota', 'grande', 'blu', 'lento'] },
  { em: '🌵', nome: 'il cactus', tag: ['verde', 'orto', 'lento'] },
  { em: '🍐', nome: 'la pera', tag: ['verde', 'albero', 'dolce', 'mangiare'] },
]
function passaTag(tag, cosa) { return cosa.tag.includes(tag) }

/* ═══════════════════════════════════════════════════════════════════
   LA FORZA BRUTA — ogni sottoinsieme di `cand`, di taglia `quanti`, che
   isola un solo candidato E in cui nessun elemento è superfluo.
   ═══════════════════════════════════════════════════════════════════ */
function gruppiMinimi(candidati, passa, cand, quanti) {
  const buoni = []
  const prova = sub => {
    const superstiti = candidati.filter(c => sub.every(ind => passa(ind, c)))
    if (superstiti.length !== 1) return
    for (let i = 0; i < sub.length; i++) {
      const senza = sub.filter((_, k) => k !== i)
      const s2 = candidati.filter(c => senza.every(ind => passa(ind, c)))
      if (s2.length === 1) return               // quell'indizio non serviva
    }
    buoni.push(sub)
  }
  const n = cand.length
  if (quanti === 1) for (let i = 0; i < n; i++) prova([cand[i]])
  else if (quanti === 2) for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) prova([cand[i], cand[j]])
  else for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) prova([cand[i], cand[j], cand[k]])
  return buoni
}

const risolvi = (sorte, x) => (Array.isArray(x) ? sorte.fra(x[0], x[1]) : x)
const prodotto = (assi, usati) => assi.reduce((n, a) => n * usati[a].length, 1)

/* ── indizi:forme — costruisce il tavolo, il bersaglio e il gruppo di
   indizi minimo. Non restituisce mai `null`: se la forza bruta non
   trova niente in `tentativi` prove (può succedere con assi e valori
   sfortunati) c'è `ripiegoForme`, una domanda più semplice ma sempre
   valida. ── */
export function costruisciForme(sorte, cfg) {
  for (let tentativo = 0; tentativo < 50; tentativo++) {
    const nCandidati = risolvi(sorte, cfg.nCandidati)
    const nAssi = Math.min(risolvi(sorte, cfg.nAssi), cfg.poolAssi.length)
    const assi = sorte.alcuni(cfg.poolAssi, nAssi)
    const usati = {}
    for (const a of assi) usati[a] = sorte.alcuni(VALORI[a], Math.min(2, VALORI[a].length))
    let giri = 0
    while (prodotto(assi, usati) < nCandidati && giri++ < 8) {
      const cresce = assi.filter(a => usati[a].length < VALORI[a].length)
      if (!cresce.length) break
      const a = sorte.uno(cresce)
      usati[a] = sorte.alcuni(VALORI[a], usati[a].length + 1)
    }
    if (prodotto(assi, usati) < nCandidati) continue

    /* gli assi non scelti restano fissi per tutte le figure: un
       attributo uguale per tutti sul tavolo non può fare da indizio,
       quindi non c'è modo di costruire per sbaglio una domanda ambigua */
    const base = { colore: sorte.uno(VALORI.colore), forma: sorte.uno(VALORI.forma), quante: 1, grande: true }
    let tutte = [base]
    for (const a of assi) {
      const dopo = []
      for (const f of tutte) for (const v of usati[a]) dopo.push({ ...f, [a]: v })
      tutte = dopo
    }
    const candidati = sorte.alcuni(tutte, nCandidati)
    const bersaglio = sorte.uno(candidati)

    const cand = []
    for (const a of assi) for (const v of usati[a]) {
      if (a === 'grande' && v !== true) continue    // vedi testoIndizioForma
      cand.push({ asse: a, val: v, positivo: bersaglio[a] === v })
    }

    let gruppo = null
    for (const quanti of cfg.quantiProva) {
      let buoni = gruppiMinimi(candidati, soddisfaForma, cand, quanti)
      if (!buoni.length) continue
      if (cfg.filtro === 'positivi') {
        const solo = buoni.filter(g => g.every(ind => ind.positivo))
        if (solo.length) buoni = solo
      } else if (cfg.filtro === 'negazione') {
        const solo = buoni.filter(g => g.some(ind => !ind.positivo))
        if (solo.length) buoni = solo
      }
      gruppo = sorte.uno(buoni)
      break
    }
    if (!gruppo) continue

    const indizi = sorte.mescola(gruppo).map(ind => ({
      ...ind, testo: testoIndizioForma(ind), verifica: f => soddisfaForma(ind, f),
    }))
    return { candidati, bersaglio, indizi }
  }
  return ripiegoForme(sorte)
}

/* la rete di sicurezza: una griglia 2×2 di colore e forma, due indizi
   positivi, e sono entrambi necessari (uno solo lascerebbe due figure
   in piedi) — non è la domanda più ricca, ma non fallisce mai */
function ripiegoForme(sorte) {
  const colori = sorte.alcuni(VALORI.colore, 2)
  const forme = sorte.alcuni(VALORI.forma, 2)
  const candidati = []
  for (const c of colori) for (const f of forme) candidati.push({ colore: c, forma: f, quante: 1, grande: true })
  const bersaglio = sorte.uno(candidati)
  const gruppo = sorte.mescola([
    { asse: 'colore', val: bersaglio.colore, positivo: true },
    { asse: 'forma', val: bersaglio.forma, positivo: true },
  ])
  const indizi = gruppo.map(ind => ({ ...ind, testo: testoIndizioForma(ind), verifica: f => soddisfaForma(ind, f) }))
  return { candidati, bersaglio, indizi }
}

/* ── indizi:cose — stessa forza bruta, sugli oggetti del mondo invece
   che sulle figure ── */
export function costruisciCose(sorte, cfg) {
  for (let tentativo = 0; tentativo < 60; tentativo++) {
    const nCandidati = risolvi(sorte, cfg.nCandidati)
    const bersaglio = sorte.uno(COSE)
    const condivisi = c => c.tag.filter(t => bersaglio.tag.includes(t)).length
    /* i distrattori si pescano fra chi condivide POCHE etichette col
       bersaglio: troppo simile e la domanda diventa ambigua, troppo
       lontano e basta un indizio a occhio per escluderlo */
    const possibili = COSE.filter(c => c !== bersaglio && condivisi(c) >= cfg.vicini[0] && condivisi(c) <= cfg.vicini[1])
    if (possibili.length < nCandidati - 1) continue
    const candidati = sorte.mescola([bersaglio, ...sorte.alcuni(possibili, nCandidati - 1)])

    let cand = bersaglio.tag.slice()
    if (cfg.soloConcreti) {
      const concreti = cand.filter(t => !SEGNI[t].astratto)
      if (concreti.length >= 2) cand = concreti
    }

    let gruppo = null
    for (const quanti of cfg.quantiProva) {
      const buoni = gruppiMinimi(candidati, passaTag, cand, quanti)
      if (buoni.length) { gruppo = sorte.uno(buoni); break }
    }
    if (!gruppo) continue

    const indizi = sorte.mescola(gruppo).map(tag => ({
      tag, testo: SEGNI[tag].testo, verifica: c => c.tag.includes(tag),
    }))
    return { candidati, bersaglio, indizi }
  }
  return ripiegoCose(sorte)
}

/* la rete di sicurezza: si parte da un'etichetta del bersaglio e si
   cercano due cose che non ce l'hanno — con oltre sessanta voci in
   `COSE` ce ne sono quasi sempre, e un solo indizio basta ed è
   necessario per forza (senza, resterebbero tre candidate) */
function ripiegoCose(sorte) {
  const bersaglio = sorte.uno(COSE)
  for (const tag of sorte.mescola(bersaglio.tag)) {
    const senzaTag = COSE.filter(c => c !== bersaglio && !c.tag.includes(tag))
    if (senzaTag.length < 2) continue
    const altre = sorte.alcuni(senzaTag, 2)
    const candidati = sorte.mescola([bersaglio, ...altre])
    const indizi = [{ tag, testo: SEGNI[tag].testo, verifica: c => c.tag.includes(tag) }]
    return { candidati, bersaglio, indizi }
  }
  /* non dovrebbe mai servire (il dataset è troppo vario perché un
     bersaglio non trovi due estranei), ma qui c'è comunque un'uscita
     che non lancia mai: le prime due cose della lista, distinte */
  const [a, b] = COSE
  const tag = a.tag.find(t => !b.tag.includes(t)) || a.tag[0]
  return {
    candidati: [a, b],
    bersaglio: a,
    indizi: [{ tag, testo: SEGNI[tag].testo, verifica: c => c.tag.includes(tag) }],
  }
}

/* ═══════════════════════════════════════════════════════════════════
   LA TABELLA DEGLI INDIZI — le «griglie logiche» in piccolo.

   Tre bambini, tre animali, uno a testa. «Bruno ha il pesce. Anna non
   ha il cane. Che animale ha Carla?» È la stessa macchina delle figure
   girata di novanta gradi: là si scarta fra le cose sul tavolo, qui si
   scarta fra le **sistemazioni** — chi ha cosa — e le sistemazioni non
   si vedono, si scrivono. Il metodo che si insegna è la tabellina: una
   ✗ per ogni «non», e dove in una riga resta un posto solo è quello.

   COME NASCE UNA DOMANDA, ed è il punto di tutta la sezione:

     1. si pesca la soluzione (una permutazione per ogni cosa in ballo);
     2. si pescano indizi veri, di forme diverse, finché le sistemazioni
        possibili non sono **una sola** — lo dice un risolutore a forza
        bruta, che con tre persone ha sei casi da guardare (trentasei
        con due cose collegate, ventiquattro in fila per quattro);
     3. si tolgono gli indizi che non servono: ognuno di quelli rimasti
        è necessario, come nelle figure;
     4. si sceglie **la domanda** fra quelle che chiedono tutti gli
        indizi — togliendone uno qualunque la risposta non è più una
        sola — e la cui risposta non sta scritta pari pari in un indizio.

   I FALSI SI CALCOLANO. Sono le risposte a cui arriva chi si è fermato a
   metà: si toglie un indizio, si guarda cosa diventa possibile, e il
   `perche` dice quale indizio è stato lasciato indietro e cosa, senza
   di lui, non torna più («con questa risposta Anna avrebbe il cane»).
   Con tre persone
   le risposte sono tutte e tre le cose in ballo, quindi i falsi sono
   tutti gli altri valori: nessuno scelto a caso, nessuno da scartare a
   occhio.

   Le quattro forme, dalla più facile:

     indizi:tabella     «ha» e «non ha»                       ~8 anni
     indizi:esclusione  solo «non» e «né… né», nessun sì       ~9 anni
     indizi:fila        chi sta in testa, subito dopo, vicino  ~10 anni
     indizi:collegati   due cose a testa, e «chi ha il gatto
                        ama il blu» che le lega                ~11 anni

   `costruisciTabella` è esportata come le sorelle: il test rilegge il
   testo scritto per il bambino, rimette in piedi le sistemazioni da
   solo e ricontrolla unicità, minimalità e falsi senza fidarsi del
   risolutore di qui.
   ═══════════════════════════════════════════════════════════════════ */

/* I bambini, col genere perché «Giulia non è la prima» si concorda.
   Nomi italiani vari, nessuno che sia anche una cosa del gioco (niente
   Rosa, Viola, Bianca: «Viola ama il viola» è un inciampo gratis). */
const PERSONE = [
  ['Anna', 'f'], ['Bruno', 'm'], ['Carla', 'f'], ['Leo', 'm'], ['Mia', 'f'],
  ['Sara', 'f'], ['Tommaso', 'm'], ['Giulia', 'f'], ['Pietro', 'm'], ['Marta', 'f'],
  ['Paolo', 'm'], ['Elena', 'f'], ['Davide', 'm'], ['Chiara', 'f'], ['Matteo', 'm'],
  ['Irene', 'f'], ['Filippo', 'm'], ['Alice', 'f'], ['Nicola', 'm'], ['Sofia', 'f'],
  ['Giorgio', 'm'], ['Lucia', 'f'], ['Ettore', 'm'], ['Greta', 'f'], ['Fabio', 'm'],
  ['Nora', 'f'], ['Samuele', 'm'], ['Ilaria', 'f'], ['Dario', 'm'], ['Emma', 'f'],
  ['Michele', 'm'], ['Agnese', 'f'], ['Enrico', 'm'], ['Teresa', 'f'], ['Gabriele', 'm'],
].map(([nome, g]) => ({ nome, g }))

/* Le cose da dividersi. Ogni tema sa dire le sue frasi: il verbo al
   singolare («Anna ha»), al plurale («né Anna né Bruno hanno»), al
   condizionale per i `perche` («Anna avrebbe il cane»), e come
   si chiede; `apre` è il verbo della prima riga, se non è lo stesso
   («hanno un colore preferito», ma «né Anna né Bruno amano il blu»).
   Le voci con `em` rispondono col disegno; i colori con la
   parola, perché un pallino rosso è un'emoji chiara ma «rosso» è
   quello che c'è scritto negli indizi. */
const TEMI = [
  { cosa: 'un animale', diversi: 'tutti diversi', verbo: 'ha', verboPl: 'hanno', cond: 'avrebbe',
    chiedi: 'Che animale ha', nomi: 'gli animali',
    voci: [['🐱', 'il gatto'], ['🐶', 'il cane'], ['🐟', 'il pesce'], ['🐰', 'il coniglio'],
      ['🐹', 'il criceto'], ['🐢', 'la tartaruga'], ['🦜', 'il pappagallo'], ['🐴', 'il cavallo']] },
  { cosa: 'un gelato', diversi: 'tutti diversi', verbo: 'prende', verboPl: 'prendono', cond: 'prenderebbe',
    chiedi: 'Che gusto prende', nomi: 'i gusti',
    voci: [['🍓', 'la fragola'], ['🍫', 'il cioccolato'], ['🍋', 'il limone'], ['🍌', 'la banana'],
      ['🥥', 'il cocco'], ['🍑', 'la pesca'], ['🍉', "l'anguria"]] },
  { cosa: 'uno sport', diversi: 'tutti diversi', verbo: 'fa', verboPl: 'fanno', cond: 'farebbe',
    chiedi: 'Che sport fa', nomi: 'gli sport',
    voci: [['⚽', 'calcio'], ['🏀', 'basket'], ['🎾', 'tennis'], ['🏊', 'nuoto'],
      ['🥋', 'judo'], ['🤸', 'ginnastica'], ['🩰', 'danza'], ['🏐', 'pallavolo']] },
  { cosa: 'uno strumento', diversi: 'tutti diversi', verbo: 'suona', verboPl: 'suonano', cond: 'suonerebbe',
    chiedi: 'Che strumento suona', nomi: 'gli strumenti',
    voci: [['🎸', 'la chitarra'], ['🥁', 'il tamburo'], ['🎹', 'il pianoforte'], ['🎺', 'la tromba'],
      ['🎻', 'il violino'], ['🎷', 'il sassofono']] },
  { cosa: 'una merenda', diversi: 'tutte diverse', verbo: 'porta', verboPl: 'portano', cond: 'porterebbe',
    chiedi: 'Che merenda porta', nomi: 'le merende',
    voci: [['🍎', 'la mela'], ['🍌', 'la banana'], ['🥪', 'il panino'], ['🍪', 'i biscotti'],
      ['🥐', 'il cornetto'], ['🧃', 'il succo'], ['🍐', 'la pera']] },
  { cosa: 'un gioco', diversi: 'tutti diversi', verbo: 'ha', verboPl: 'hanno', cond: 'avrebbe',
    chiedi: 'Che gioco ha', nomi: 'i giochi',
    voci: [['🪁', "l'aquilone"], ['🧸', "l'orsetto"], ['🧩', 'il puzzle'], ['🚂', 'il trenino'],
      ['🎈', 'il palloncino'], ['🎲', 'i dadi'], ['🪀', 'lo yo-yo']] },
  { cosa: 'un colore preferito', diversi: 'tutti diversi', verbo: 'ama', verboPl: 'amano', apre: 'hanno', cond: 'amerebbe',
    chiedi: 'Che colore ama', nomi: 'i colori',
    voci: [[null, 'il rosso'], [null, 'il blu'], [null, 'il verde'], [null, 'il giallo'],
      [null, 'il viola'], [null, "l'arancione"]] },
].map(t => ({ ...t, voci: t.voci.map(([em, ogg]) => ({ em, ogg, nudo: ogg.replace(/^(il|lo|la|i|gli|le) |^l'/, '') })) }))

/* la fila: i posti si dicono concordati, «Giulia è la prima» */
const POSTI = [
  { m: 'il primo', f: 'la prima', r: { m: 'primo', f: 'prima' } },
  { m: 'il secondo', f: 'la seconda', r: { m: 'secondo', f: 'seconda' } },
  { m: 'il terzo', f: 'la terza', r: { m: 'terzo', f: 'terza' } },
  { m: 'il quarto', f: 'la quarta', r: { m: 'quarto', f: 'quarta' } },
]
const ULTIMO = { m: "l'ultimo", f: "l'ultima" }
const posto = (i, n, g) => (i === n - 1 ? ULTIMO[g] : POSTI[i][g])

/* ── il risolutore: tutte le sistemazioni, e quelle che reggono ── */
function permutazioni(n) {
  if (n === 1) return [[0]]
  const out = []
  for (const p of permutazioni(n - 1))
    for (let i = 0; i <= p.length; i++) out.push([...p.slice(0, i), n - 1, ...p.slice(i)])
  return out
}
/* una sistemazione è un array con una permutazione per cosa in ballo:
   `s[a][persona]` è il valore che quella persona ha per la cosa `a` */
function sistemazioni(n, cose) {
  const perm = permutazioni(n)
  let tutte = [[]]
  for (let a = 0; a < cose; a++) tutte = tutte.flatMap(s => perm.map(p => [...s, p]))
  return tutte
}
const reggono = (tutte, indizi) => tutte.filter(s => indizi.every(i => i.vale(s)))

/* «Anna, Bruno ed Elena»: la d eufonica davanti alla stessa vocale */
const unisci = nomi => nomi.length === 1 ? nomi[0]
  : nomi.slice(0, -1).join(', ') + (/^[eE]/.test(nomi[nomi.length - 1]) ? ' ed ' : ' e ') + nomi[nomi.length - 1]
const parole = t => t.trim().split(/\s+/).filter(Boolean).length
const senzaPunto = t => t.replace(/\.$/, '')
/* il nodo di un fatto: una persona, o un valore di una cosa. Un indizio
   positivo dichiara quali coppie di nodi lega (`lega`), ed è così che si
   riconosce una domanda con la risposta scritta dentro un indizio */
const P = p => 'p' + p
const V = (a, v) => `a${a}v${v}`

/* ── gli indizi, forma per forma ──
   Ognuno porta: `forma`, `testo`, `vale(s)` (vero in quella
   sistemazione?), `lega` (le coppie che afferma pari pari) e
   `smentita(s)`, che dice a parole cosa non torna in una sistemazione
   dove l'indizio è falso — è il pezzo che finisce nei `perche`. */
function indiziDelleCose(persone, temi, forme) {
  const n = persone.length
  const out = []
  const nome = p => persone[p].nome
  const ogg = (a, v) => temi[a].voci[v].ogg
  const cond = (a, s, p) => `${nome(p)} ${temi[a].cond} ${ogg(a, s[a][p])}`
  for (let a = 0; a < temi.length; a++) {
    const T = temi[a]
    for (let p = 0; p < n; p++) for (let v = 0; v < n; v++) {
      if (forme.includes('ha')) out.push({
        forma: 'ha', testo: `${nome(p)} ${T.verbo} ${ogg(a, v)}.`,
        vale: s => s[a][p] === v, lega: [[P(p), V(a, v)]],
        smentita: () => `${nome(p)} non ${T.cond} ${ogg(a, v)}`,
      })
      if (forme.includes('non')) out.push({
        forma: 'non', testo: `${nome(p)} non ${T.verbo} ${ogg(a, v)}.`,
        vale: s => s[a][p] !== v, lega: [], nega: [`${p}:${a}:${v}`], smentita: s => cond(a, s, p),
      })
      if (forme.includes('ne')) for (let w = v + 1; w < n; w++) out.push({
        forma: 'ne', testo: `${nome(p)} non ${T.verbo} né ${ogg(a, v)} né ${ogg(a, w)}.`,
        vale: s => s[a][p] !== v && s[a][p] !== w, lega: [], nega: [`${p}:${a}:${v}`, `${p}:${a}:${w}`],
        smentita: s => cond(a, s, p),
      })
    }
    if (forme.includes('neCosa'))
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) for (let v = 0; v < n; v++) out.push({
        forma: 'neCosa', testo: `Né ${nome(p)} né ${nome(q)} ${T.verboPl} ${ogg(a, v)}.`,
        vale: s => s[a][p] !== v && s[a][q] !== v, lega: [], nega: [`${p}:${a}:${v}`, `${q}:${a}:${v}`],
        smentita: s => cond(a, s, s[a][p] === v ? p : q),
      })
  }
  /* il ponte fra le due cose: «chi ha il gatto ama il blu» */
  if (temi.length === 2) {
    const [T0, T1] = temi
    for (let v = 0; v < n; v++) for (let w = 0; w < n; w++) {
      const chi = s => s[0].indexOf(v)
      if (forme.includes('lega')) out.push({
        forma: 'lega', testo: `Chi ${T0.verbo} ${ogg(0, v)} ${T1.verbo} ${ogg(1, w)}.`,
        vale: s => s[1][chi(s)] === w, lega: [[V(0, v), V(1, w)]],
        smentita: s => `chi ${T0.verbo} ${ogg(0, v)} ${T1.cond} ${ogg(1, s[1][chi(s)])}`,
      })
      if (forme.includes('slega')) out.push({
        forma: 'slega', testo: `Chi ${T0.verbo} ${ogg(0, v)} non ${T1.verbo} ${ogg(1, w)}.`,
        vale: s => s[1][chi(s)] !== w, lega: [],
        smentita: () => `chi ${T0.verbo} ${ogg(0, v)} ${T1.cond} ${ogg(1, w)}`,
      })
    }
  }
  return out
}

/* In fila: la «cosa» è il posto, `s[0][persona]` è quanti ne ha
   davanti. «Subito dopo» e «subito prima» sono lo stesso indizio detto
   dai due capi, e si pesca uno dei due modi di dirlo. «Vicini» vuol
   dire uno attaccato all'altro: non c'è un «prima di» a distanza, che
   un bambino leggerebbe come «subito prima» — e la domanda avrebbe due
   risposte difendibili. */
function indiziDellaFila(persone, forme, sorte) {
  const n = persone.length
  const out = []
  const nome = p => persone[p].nome
  const g = p => persone[p].g
  for (let p = 0; p < n; p++) {
    const primo = posto(0, n, g(p))
    const ultimo = posto(n - 1, n, g(p))
    if (forme.includes('testa')) out.push({
      forma: 'testa', testo: `${nome(p)} è ${primo}.`, vale: s => s[0][p] === 0,
      lega: [[P(p), V(0, 0)]], smentita: () => `${nome(p)} non sarebbe ${primo}`,
    })
    if (forme.includes('fondo')) out.push({
      forma: 'fondo', testo: `${nome(p)} è ${ultimo}.`, vale: s => s[0][p] === n - 1,
      lega: [[P(p), V(0, n - 1)]], smentita: () => `${nome(p)} non sarebbe ${ultimo}`,
    })
    if (forme.includes('nonTesta')) out.push({
      forma: 'nonTesta', testo: `${nome(p)} non è ${primo}.`, vale: s => s[0][p] !== 0,
      lega: [], smentita: () => `${nome(p)} sarebbe ${primo}`,
    })
    if (forme.includes('nonFondo')) out.push({
      forma: 'nonFondo', testo: `${nome(p)} non è ${ultimo}.`, vale: s => s[0][p] !== n - 1,
      lega: [], smentita: () => `${nome(p)} sarebbe ${ultimo}`,
    })
    if (forme.includes('mezzo') && n === 3) out.push({
      forma: 'mezzo', testo: `${nome(p)} sta in mezzo.`, vale: s => s[0][p] === 1,
      lega: [[P(p), V(0, 1)]], smentita: () => `${nome(p)} non sarebbe in mezzo`,
    })
  }
  for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) {
    if (p === q) continue
    /* la smentita si dice con le parole dell'indizio: se era «Lucia
       è subito prima di Marta», non torna «Lucia subito prima di
       Marta», non il suo rovescio */
    if (forme.includes('dopo')) {
      const dopo = sorte.forse(0.5)
      out.push({
        forma: 'dopo', p, q,
        testo: dopo ? `${nome(p)} è subito dopo ${nome(q)}.` : `${nome(q)} è subito prima di ${nome(p)}.`,
        vale: s => s[0][p] === s[0][q] + 1, lega: [],
        smentita: () => dopo ? `${nome(p)} non sarebbe più subito dopo ${nome(q)}`
          : `${nome(q)} non sarebbe più subito prima di ${nome(p)}`,
      })
    }
    if (forme.includes('lontani') && p < q) {
      const vicini = g(p) === 'f' && g(q) === 'f' ? 'vicine' : 'vicini'
      out.push({
        forma: 'lontani', testo: `${nome(p)} e ${nome(q)} non sono ${vicini}.`,
        vale: s => Math.abs(s[0][p] - s[0][q]) !== 1, lega: [],
        smentita: () => `${nome(p)} e ${nome(q)} sarebbero ${vicini}`,
      })
    }
  }
  return out
}

/* ── le domande possibili ──
   Ognuna sa da dove parte (`da`, un nodo), cosa chiede (`opzioni`, i
   nodi fra cui scegliere) e come si legge la risposta in una
   sistemazione (`chiedi`). Le risposte sono tutte le cose di quel tipo:
   con tre persone, tutte e tre. */
function domandeDelleCose(persone, temi) {
  const n = persone.length
  const tutti = [...Array(n).keys()]
  const nome = p => persone[p].nome
  const voce = (a, v) => temi[a].voci[v]
  const rispostaVoce = (a, v) => (voce(a, v).em ? emoji(voce(a, v).em) : testo(voce(a, v).nudo))
  const out = []
  for (let a = 0; a < temi.length; a++) {
    const T = temi[a]
    for (let p = 0; p < n; p++) out.push({
      testo: `${T.chiedi} ${nome(p)}?`, da: P(p),
      opzioni: tutti.map(v => ({ nodo: V(a, v), risposta: rispostaVoce(a, v) })),
      chiedi: s => V(a, s[a][p]),
    })
    for (let v = 0; v < n; v++) out.push({
      testo: `Chi ${T.verbo} ${voce(a, v).ogg}?`, da: V(a, v),
      opzioni: tutti.map(p => ({ nodo: P(p), risposta: testo(nome(p)) })),
      chiedi: s => P(s[a].indexOf(v)),
    })
  }
  if (temi.length === 2) for (let a = 0; a < 2; a++) {
    const b = 1 - a
    for (let v = 0; v < n; v++) out.push({
      testo: `${temi[b].chiedi.replace(/ \S+$/, '')} ${temi[b].verbo} chi ${temi[a].verbo} ${voce(a, v).ogg}?`,
      da: V(a, v),
      opzioni: tutti.map(w => ({ nodo: V(b, w), risposta: rispostaVoce(b, w) })),
      chiedi: s => V(b, s[b][s[a].indexOf(v)]),
    })
  }
  return out
}
function domandeDellaFila(persone) {
  const n = persone.length
  const tutti = [...Array(n).keys()]
  const nome = p => persone[p].nome
  const out = []
  const chi = i => i === 0 ? 'Chi è il primo della fila?'
    : i === n - 1 ? "Chi è l'ultimo della fila?"
      : n === 3 ? 'Chi sta in mezzo?' : `Chi è ${POSTI[i].m} della fila?`
  for (let i = 0; i < n; i++) out.push({
    testo: chi(i), da: V(0, i),
    opzioni: tutti.map(p => ({ nodo: P(p), risposta: testo(nome(p)) })),
    chiedi: s => P(s[0].indexOf(i)),
  })
  for (let p = 0; p < n; p++) out.push({
    testo: `In che posto della fila è ${nome(p)}?`, da: P(p),
    opzioni: tutti.map(i => ({ nodo: V(0, i), risposta: testo(POSTI[i].r[persone[p].g]) })),
    chiedi: s => V(0, s[0][p]),
  })
  return out
}

/* la risposta sta scritta pari pari in un indizio? */
const scritta = (dom, giusta, indizi) =>
  indizi.some(i => i.lega.some(([x, y]) => (x === dom.da && y === giusta) || (y === dom.da && x === giusta)))

/* ── i falsi, calcolati ──
   Per ogni risposta sbagliata si cerca l'indizio che l'avrebbe fermata,
   e il `perche` lo nomina. Tre casi, in quest'ordine:

     · un indizio che la esclude da solo e lo dice pari pari («Leo non
       prende il cioccolato», «Bruno ha il pesce») → «lo esclude già»:
       chi l'ha scelta quell'indizio non l'ha letto;
     · un indizio che, dimenticato, la rende possibile → «hai lasciato
       indietro»: è chi si è fermato a metà, l'errore vero di questa
       domanda. Si preferiscono i «non», i legami e i «subito dopo» ai
       fatti che fanno da àncora («Bruno ha il pesce», «Sara è la
       prima»), perché quelli sono gli ultimi che si dimenticano — ed è
       così che nell'esempio dei due colori il falso è di chi non ha
       collegato il gatto al blu; e se senza
       di lui la sistemazione è una sola, si dice anche cosa non torna
       («con questa risposta Anna avrebbe il cane»);
     · niente di tutto questo (capita di rado: la escludono due indizi
       insieme) → la frase generica, riempi la tabella.

   Due falsi della stessa domanda citano, se possono, due indizi
   diversi: «hai lasciato indietro la stessa cosa» detto due volte
   insegna meno di due errori distinti. */
const DIRETTE = ['ha', 'non', 'ne', 'testa', 'fondo', 'nonTesta', 'nonFondo', 'mezzo']
const ANCORE = ['ha', 'testa', 'fondo', 'mezzo']
const ancora = i => ANCORE.includes(i.forma)

function falsiCalcolati(tutte, indizi, dom, giusta, fila = false) {
  const citati = new Set()
  const cita = (o, i, perche) => { if (i) citati.add(i); return { ...o.risposta, perche, dimentica: i } }
  return dom.opzioni.filter(o => o.nodo !== giusta).map(o => {
    const conQuesta = tutte.filter(s => dom.chiedi(s) === o.nodo)
    const soli = indizi.filter(i => conQuesta.every(s => !i.vale(s)))
    const nuovo = lista => lista.find(x => !citati.has(x.i ?? x)) || lista[0]

    const diretti = soli.filter(i => DIRETTE.includes(i.forma))
    if (diretti.length) {
      const i = nuovo(diretti)
      return cita(o, i, `lo esclude già l'indizio «${senzaPunto(i.testo)}»`)
    }

    const mezzi = indizi.map(i => ({ i, resta: reggono(conQuesta, indizi.filter(x => x !== i)) }))
      .filter(c => c.resta.length)
      .map(c => ({ ...c, chiaro: new Set(c.resta.map(s => c.i.smentita(s))).size === 1 }))
      .sort((a, b) => (ancora(a.i) - ancora(b.i)) || (b.chiaro - a.chiaro))
    if (mezzi.length) {
      const { i, resta } = nuovo(mezzi)
      /* cosa non torna si dice quando è una cosa sola: una
         sistemazione, o tante che rompono l'indizio allo stesso modo */
      const come = new Set(resta.map(s => i.smentita(s)))
      return cita(o, i, come.size === 1
        ? `hai lasciato indietro «${senzaPunto(i.testo)}»: con questa risposta ${[...come][0]}`
        : `va bene solo se ti dimentichi di «${senzaPunto(i.testo)}»`)
    }

    if (soli.length) {
      const i = nuovo(soli)
      return cita(o, i, `lo esclude già l'indizio «${senzaPunto(i.testo)}»`)
    }
    return cita(o, null, fila
      ? 'con questa risposta qualche indizio non torna: mettili tutti in fila e controlla gli indizi uno per uno'
      : 'con questa risposta qualche indizio non torna: riempi la tabella e controllali tutti')
  })
}

/* ── la costruzione, una sola per tutte e tre le famiglie ──
   `cfg` dice quante persone, quante cose (0 = la fila), quali forme di
   indizio, quanti indizi, e cosa il gruppo finale deve contenere
   (`vuole`: almeno una forma per ogni elenco). */
export function costruisciTabella(sorte, cfg) {
  const fila = cfg.cose === 0
  const tutte = sistemazioni(cfg.persone, fila ? 1 : cfg.cose)
  for (let tentativo = 0; tentativo < 400; tentativo++) {
    const persone = sorte.alcuni(PERSONE, cfg.persone)
    const temi = []
    if (!fila) for (const t of sorte.alcuni(TEMI, cfg.cose)) {
      /* due cose che condividono una voce (la banana è un gusto e una
         merenda) non si mettono insieme: «chi prende la banana porta la
         banana» non è un indizio, è un inciampo */
      const gia = temi.flatMap(x => x.voci.map(v => v.nudo))
      const libere = t.voci.filter(v => !gia.includes(v.nudo))
      if (libere.length < cfg.persone) break
      temi.push({ ...t, voci: sorte.alcuni(libere, cfg.persone) })
    }
    if (!fila && temi.length < cfg.cose) continue
    const soluzione = fila ? [sorte.mescola([...Array(cfg.persone).keys()])] : temi.map(() => sorte.mescola([...Array(cfg.persone).keys()]))
    /* in fila si dice «non in quest'ordine», quindi l'ordine in cui si
       elencano i nomi non può essere quello vero */
    if (fila && soluzione[0].every((pos, p) => pos === p)) continue

    const vere = sorte.mescola((fila ? indiziDellaFila(persone, cfg.forme, sorte) : indiziDelleCose(persone, temi, cfg.forme))
      .filter(i => i.vale(soluzione)))
    /* 2. si aggiunge finché la sistemazione non è una sola: un indizio
       che non toglie niente a quello che c'è già non entra nemmeno */
    let scelti = []
    let restano = tutte
    for (const i of vere) {
      if (restano.length === 1) break
      const dopo = reggono(restano, [i])
      if (dopo.length < restano.length) { scelti.push(i); restano = dopo }
    }
    if (restano.length !== 1) continue
    /* 3. si toglie quello che non serve, in ordine sparso */
    for (const i of sorte.mescola(scelti)) {
      const senza = scelti.filter(x => x !== i)
      if (reggono(tutte, senza).length === 1) scelti = senza
    }
    if (scelti.length < cfg.indizi[0] || scelti.length > cfg.indizi[1]) continue
    if (!cfg.vuole.every(gruppo => scelti.some(i => gruppo.includes(i.forma)))) continue
    if (cfg.vieta && scelti.some(i => cfg.vieta.includes(i.forma))) continue
    /* lo stesso «non» detto due volte («Né Michele né Elena hanno il
       trenino. Elena non ha né i dadi né il trenino.») non è sbagliato,
       ma si legge come un indizio ripetuto per distrazione */
    const negati = scelti.flatMap(i => i.nega || [])
    if (new Set(negati).size < negati.length) continue

    /* 4. la domanda: tutti gli indizi servono a lei, e la risposta non
       è scritta in nessuno */
    const domande = (fila ? domandeDellaFila(persone) : domandeDelleCose(persone, temi)).filter(d => {
      const giusta = d.chiedi(soluzione)
      if (scritta(d, giusta, scelti)) return false
      return scelti.every(i => new Set(reggono(tutte, scelti.filter(x => x !== i)).map(d.chiedi)).size > 1)
    })
    if (!domande.length) continue
    const dom = sorte.uno(domande)
    const indizi = sorte.mescola(scelti)

    const nomi = unisci(persone.map(p => p.nome))
    const apertura = fila
      ? `${nomi} sono in fila, ma non in quest'ordine.`
      : temi.length === 1
        ? `${nomi} ${apre(temi[0])} ${temi[0].cosa} a testa, ${temi[0].diversi}: ${elenco(temi[0])}.`
        : `${nomi} ${apre(temi[0])} ${temi[0].cosa} e ${apre(temi[1]) === apre(temi[0]) ? '' : apre(temi[1]) + ' '}${temi[1].cosa}, tutti diversi: ${elenco(temi[0], true)} e ${elenco(temi[1], true)}.`
    const righe = [apertura, ...indizi.map(i => i.testo), dom.testo]
    if (parole(righe.join(' ')) > cfg.parole) continue

    const giusta = dom.chiedi(soluzione)
    return {
      persone, temi, soluzione, indizi, righe, domanda: dom, giusta,
      buona: dom.opzioni.find(o => o.nodo === giusta).risposta,
      falsi: falsiCalcolati(tutte, indizi, dom, giusta, fila),
    }
  }
  return ripiegoTabella(sorte, cfg)
}
const apre = T => T.apre || T.verboPl

/* le cose in ballo, come si leggono nella prima riga: i disegni in fila,
   le parole con la virgola */
function elenco(T, accanto = false) {
  if (T.voci[0].em) return T.voci.map(v => v.em).join(' ')
  return accanto ? T.voci.map(v => v.nudo).join(', ') : unisci(T.voci.map(v => v.nudo))
}

/* La rete di sicurezza, con la forma dell'esempio che fa da metro:
   tre persone, «B ha y», «A non ha z», e si chiede di C. Tutti e due gli
   indizi servono (senza il primo ad A resta la scelta fra x e y, senza
   il secondo a C resta la scelta fra x e z), e la risposta non è
   scritta da nessuna parte. Per la fila è «B non è il primo», «C è
   subito dopo A», e si chiede l'ultimo — l'esempio della fila. Non è la
   domanda più ricca, ma non fallisce mai: il test la forza. */
function ripiegoTabella(sorte, cfg) {
  const persone = sorte.alcuni(PERSONE, 3)
  const tutte = sistemazioni(3, 1)
  if (cfg.cose === 0) {
    /* A, C, B in fila: A primo, C secondo, B ultimo */
    const soluzione = [[0, 2, 1]]
    const vere = indiziDellaFila(persone, ['nonTesta', 'dopo'], sorte)
    const indizi = [vere.find(i => i.forma === 'nonTesta' && i.testo.startsWith(persone[1].nome + ' ')),
      vere.find(i => i.forma === 'dopo' && i.p === 2 && i.q === 0)]
    const dom = domandeDellaFila(persone)[2]
    const giusta = dom.chiedi(soluzione)
    return {
      ripiego: true, persone, temi: [], soluzione, indizi, domanda: dom, giusta,
      righe: [`${unisci(persone.map(p => p.nome))} sono in fila, ma non in quest'ordine.`, ...indizi.map(i => i.testo), dom.testo],
      buona: dom.opzioni.find(o => o.nodo === giusta).risposta,
      falsi: falsiCalcolati(tutte, indizi, dom, giusta, true),
    }
  }
  const T = { ...sorte.uno(TEMI.filter(t => t.voci[0].em)) }
  T.voci = sorte.alcuni(T.voci, 3)
  /* A ha x, B ha y, C ha z */
  const soluzione = [[0, 1, 2]]
  const vere = indiziDelleCose(persone, [T], ['ha', 'non'])
  const indizi = [vere.find(i => i.forma === 'ha' && i.testo === `${persone[1].nome} ${T.verbo} ${T.voci[1].ogg}.`),
    vere.find(i => i.forma === 'non' && i.testo === `${persone[0].nome} non ${T.verbo} ${T.voci[2].ogg}.`)]
  const dom = domandeDelleCose(persone, [T])[2]
  const giusta = dom.chiedi(soluzione)
  return {
    ripiego: true, persone, temi: [T], soluzione, indizi, domanda: dom, giusta,
    righe: [`${unisci(persone.map(p => p.nome))} ${apre(T)} ${T.cosa} a testa, ${T.diversi}: ${elenco(T)}.`, ...indizi.map(i => i.testo), dom.testo],
    buona: dom.opzioni.find(o => o.nodo === giusta).risposta,
    falsi: falsiCalcolati(tutte, indizi, dom, giusta),
  }
}

/* ═══════════════════════════════════════════════════════════════════
   DALLA COSTRUZIONE ALLA DOMANDA — testo per un bambino, scene per il
   pittore, e il `perche` di ogni risposta sbagliata: sempre il primo
   indizio che quella candidata non rispetta, mai «sbagliato» e basta.
   ═══════════════════════════════════════════════════════════════════ */
const maiuscola = s => s.charAt(0).toUpperCase() + s.slice(1)
const frasi = (...righe) => righe.join('\n')

function domandaForme({ candidati, bersaglio, indizi }, sorte) {
  const buona = scena({ che: 'cella', fig: bersaglio })
  const falsi = candidati.filter(f => f !== bersaglio).map(f => {
    const i = indizi.findIndex(ind => !ind.verifica(f))
    return scena({ che: 'cella', fig: f }, `quella figura non rispetta l'indizio «${indizi[i].testo}»`)
  })
  return domanda({
    testo: frasi(...indizi.map(ind => maiuscola(ind.testo) + '.'), 'Chi sono io?'),
    buona,
    falsi,
    chiave: 'indizi:forme',
    aiuto: 'scarta le figure che un indizio esclude: alla fine ne resta una sola',
    sorte,
  })
}
function domandaCose({ candidati, bersaglio, indizi }, sorte) {
  const buona = emoji(bersaglio.em)
  const falsi = candidati.filter(c => c !== bersaglio).map(c => {
    const i = indizi.findIndex(ind => !ind.verifica(c))
    return emoji(c.em, `${c.nome} non rispetta l'indizio «${indizi[i].testo}»`)
  })
  return domanda({
    testo: frasi(...indizi.map(ind => maiuscola(ind.testo) + '.'), 'Chi sono?'),
    buona,
    falsi,
    chiave: 'indizi:cose',
    aiuto: "leggi ogni indizio e scarta chi non ci sta: alla fine resta uno solo",
    sorte,
  })
}

/* La tabella degli indizi diventa una domanda: le premesse una per
   riga (come in `logica`: separate si vedono per quello che sono), i
   falsi già calcolati, e un `aiuto` che dice il metodo con le parole di
   quella domanda — nomi e animali, i posti della fila, le due tabelline
   collegate. */
function domandaTabella(t, cfg, sorte) {
  const falsi = t.falsi.map(({ dimentica, ...r }) => r)   // eslint-disable-line no-unused-vars
  return domanda({
    testo: frasi(...t.righe),
    buona: t.buona,
    falsi,
    chiave: cfg.chiave,
    aiuto: aiutoTabella(t, cfg),
    sorte,
  })
}
function aiutoTabella(t, cfg) {
  if (cfg.cose === 0)
    return `disegna ${t.persone.length === 3 ? 'tre' : 'quattro'} caselle, dalla prima all'ultima, e prova a metterci i nomi: scarta ogni sistemazione che un indizio vieta, finché ne resta una sola`
  if (cfg.cose === 2) {
    const [A, B] = t.temi
    return `fai la tabellina con i nomi, ${A.nomi} e ${B.nomi}: una ✗ per ogni «non», e «chi ${A.verbo}… ${B.verbo}…» porta la ✓ da una parte all'altra; dove resta un posto solo, è quello`
  }
  const T = t.temi[0]
  const cose = T.nomi.replace(/^\S+ /, '')
  return cfg.vieta?.includes('ha')
    ? `fai la tabellina, nomi e ${cose}: una ✗ per ogni «non», due per ogni «né… né»; dove in una riga o in una colonna resta un posto solo, è quello`
    : `fai la tabellina, nomi e ${cose}: una ✓ per ogni «${T.verbo}», una ✗ per ogni «non»; dove in una riga resta un posto solo, è quello`
}

/* ═══════════════════════════════════════════════════════════════════
   LA SCALA DEI GRADI — cresce su tre assi: quante figure sul tavolo,
   quanti indizi, e se un indizio può dire di no. Le due famiglie si
   alternano come sequenze alterna «cosa viene dopo» e «chi non
   c'entra»: gradi dispari le figure, pari l'indovinello, sempre più
   difficili tutti e due. `quantiProva` è la stessa idea del
   prototipo — quante taglie di gruppo provare, in ordine — e
   `filtro` sceglie fra i gruppi minimi trovati quelli che vogliono
   solo indizi che dicono di sì (i gradi facili) o almeno uno che dice
   di no (l'ultimo grado).

   LA TABELLA NON HA GRADI SUOI, e non è una dimenticanza. Un grado è
   una classe, e una classe in più a dieci anni — dove il catalogo è
   magro — si prende da sola un tiro su dieci: messa in gradi propri, la
   tabella faceva degli indizi quasi un quarto di tutte le domande di un
   bambino di quell'età (misurato: 23% contro il 6% di prima), e anche
   un grado solo in più, in cima, lo raddoppiava. Invece entra nei gradi
   che ci sono, accanto a chi sta alla stessa altezza, e divide lo
   spazio con loro: «ha e non ha» e «solo non» accanto all'indovinello
   dell'ottavo anno, la fila e le due cose collegate accanto alle figure
   col tavolo pieno. Quanto pesano gli indizi a ogni età resta quello
   di prima; cambia cosa c'è dentro. Ogni tipologia della tabella
   dichiara il suo `livello`, perché in un grado condiviso non sta per
   forza all'altezza del vicino.

   La fila sa stare anche in quattro (`persone: 4`, tre o quattro
   indizi, sotto le 45 parole): non è in nessun grado perché non c'è un
   posto dove metterla senza aggiungere una classe, e vale la regola di
   sopra.
   ═══════════════════════════════════════════════════════════════════ */
const SCALETTA = [
  'chi sono io: poche figure sul tavolo, indizi che dicono solo di sì',
  'indovinello: cose di ogni giorno, un paio di indizi facili',
  'chi sono io: più figure, e può esserci un indizio che dice di no',
  'indovinello: indizi meno ovvi; la tabella: chi ha cosa, dai «non» e dai «né… né»',
  'chi sono io: il tavolo pieno, con un indizio in negativo; la fila; due tabelle collegate',
]

/* la cfg è esportata perché il test la riusa: è la stessa che gioca il
   bambino, non una copia scritta a mano che può disallinearsi */
export const CONFIG_GRADI = [
  { famiglia: 'forme', cfg: { nCandidati: [3, 4], poolAssi: ['colore', 'forma'], nAssi: 2, quantiProva: [2, 1], filtro: 'positivi' } },
  { famiglia: 'cose', cfg: { nCandidati: [3, 4], vicini: [1, 2], soloConcreti: true, quantiProva: [2, 1] } },
  { famiglia: 'forme', cfg: { nCandidati: [4, 5], poolAssi: ['colore', 'forma', 'quante'], nAssi: [2, 3], quantiProva: [2, 3], filtro: null } },
  { famiglia: 'cose', cfg: { nCandidati: [4, 5], vicini: [1, 3], soloConcreti: false, quantiProva: [2, 3] } },
  { famiglia: 'forme', cfg: { nCandidati: [5, 6], poolAssi: ['colore', 'forma', 'quante', 'grande'], nAssi: 3, quantiProva: [3, 2], filtro: 'negazione' } },
]

/* La tabella, tipologia per tipologia e grado per grado: `persone` e
   `cose` (0 = la fila), le `forme` di indizio che si possono pescare,
   quanti `indizi` alla fine, `vuole` (per ogni elenco, almeno un
   indizio di una di quelle forme: è quello che rende le forme diverse,
   «ha» *e* «non ha»), `vieta`, e il tetto di `parole` di tutta la
   domanda — è il pedaggio di una porta in un gioco d'azione, non un
   compito in classe. Esportata per lo stesso motivo di sopra. */
export const CONFIG_TABELLA = {
  'indizi:tabella': {
    4: { persone: 3, cose: 1, forme: ['ha', 'non'], indizi: [2, 3], vuole: [['ha'], ['non']], parole: 45 },
  },
  'indizi:esclusione': {
    4: { persone: 3, cose: 1, forme: ['non', 'ne', 'neCosa'], indizi: [2, 3], vuole: [['ne', 'neCosa']], vieta: ['ha'], parole: 45 },
  },
  'indizi:fila': {
    5: { persone: 3, cose: 0, forme: ['testa', 'fondo', 'nonTesta', 'nonFondo', 'mezzo', 'dopo', 'lontani'],
      indizi: [2, 3], vuole: [['dopo', 'lontani'], ['nonTesta', 'nonFondo']], parole: 45 },
  },
  'indizi:collegati': {
    5: { persone: 3, cose: 2, forme: ['ha', 'non', 'lega', 'slega'], indizi: [3, 4], vuole: [['lega', 'slega']], parole: 45 },
  },
}
/* la cfg di una tabella con la sua chiave dentro, che è quella che la
   domanda emette; `null` se il tipo non è della tabella */
export function cfgTabella(tipo, grado) {
  const perGrado = CONFIG_TABELLA[tipo]
  if (!perGrado) return null
  return { chiave: tipo, ...(perGrado[grado] || Object.values(perGrado)[0]) }
}

/* I livelli della tabella stanno sulla tipologia, perché il grado lo
   divide con altri: «ha e non ha» a otto anni (50), senza nessun sì a
   nove (63), la fila a dieci (75), le due cose collegate a undici (88).
   Le due di undici anni stanno nel grado dei dieci: a nove anni la
   finestra si ferma a 87,5, e le cose collegate restano fuori da sole. */
const TIPI = [
  { chiave: 'indizi:forme', nome: 'Chi sono io: le figure', sa: 'deduzione', gradi: { 1: 1, 3: 1, 5: 0.34 } },
  { chiave: 'indizi:cose', nome: 'Indovinello: le cose del mondo', sa: 'deduzione', gradi: { 2: 1, 4: 0.4 } },
  { chiave: 'indizi:tabella', nome: 'La tabella: chi ha cosa', sa: 'deduzione', livello: 50, gradi: { 4: 0.3 } },
  { chiave: 'indizi:esclusione', nome: 'La tabella per esclusione: solo «non»', sa: 'deduzione', livello: 63, gradi: { 4: 0.3 } },
  { chiave: 'indizi:fila', nome: 'La fila: chi sta dove', sa: 'deduzione', livello: 75, gradi: { 5: 0.33 } },
  { chiave: 'indizi:collegati', nome: 'Due tabelle collegate', sa: 'deduzione', livello: 88, gradi: { 5: 0.33 } },
]

class Indizi extends Modulo {
  constructor() {
    super({
      id: 'indizi',
      nome: 'Indizi',
      icona: '🔎',
      materia: 'logica',
      chiaro: 'restringere il campo con quello che è vero e quello che non lo è, finché non resta una sola risposta',
      scaletta: SCALETTA,
      /* QUANTO È COMPLICATO OGNI GRADO, da 0 a 100 — la scala è una
         sola per tutte le materie, e serve a confrontare questa riga
         con quelle di tutti gli altri moduli. Zero è il primo giorno
         di materna, cento la fine della primaria: dodici punti e mezzo
         per anno di scuola. Non dice a chi arriva — quello lo decide
         la finestra dell'età di chi gioca (`nucleo/classi.js`). */
      livelli: [12, 25, 38, 56, 75],
      tipi: TIPI,
      pittori: PITTORI_FIGURE,
    })
  }

  genera(grado, sorte, tipo) {
    const tabella = cfgTabella(tipo, grado)
    if (tabella) return domandaTabella(costruisciTabella(sorte, tabella), tabella, sorte)
    const { famiglia, cfg } = CONFIG_GRADI[Math.min(grado, CONFIG_GRADI.length) - 1]
    if (famiglia === 'forme') return domandaForme(costruisciForme(sorte, cfg), sorte)
    return domandaCose(costruisciCose(sorte, cfg), sorte)
  }
}

export default new Indizi()

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

   `costruisciForme`/`costruisciCose` restano esportate (oltre al
   modulo di default) apposta: restituiscono il materiale grezzo — le
   candidate sul tavolo, il bersaglio, gli indizi con la loro `verifica`
   — prima che diventi una `domanda()`. È quello che il test di unità
   usa per ricontrollare l'unicità e la minimalità senza dover rileggere
   il testo scritto per un bambino.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, scena, emoji } from '../nucleo/domanda.js'
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
   ═══════════════════════════════════════════════════════════════════ */
const SCALETTA = [
  'chi sono io: poche figure sul tavolo, indizi che dicono solo di sì',
  'indovinello: cose di ogni giorno, un paio di indizi facili',
  'chi sono io: più figure, e può esserci un indizio che dice di no',
  'indovinello: indizi meno ovvi, anche su come si comporta',
  'chi sono io: il tavolo pieno, e ci vuole un indizio in negativo',
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

const TIPI = [
  { chiave: 'indizi:forme', nome: 'Chi sono io: le figure', sa: 'deduzione', gradi: { 1: 1, 3: 1, 5: 1 } },
  { chiave: 'indizi:cose', nome: 'Indovinello: le cose del mondo', sa: 'deduzione', gradi: { 2: 1, 4: 1 } },
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
      tipi: TIPI,
      pittori: PITTORI_FIGURE,
    })
  }

  genera(grado, sorte) {
    const { famiglia, cfg } = CONFIG_GRADI[Math.min(grado, CONFIG_GRADI.length) - 1]
    if (famiglia === 'forme') return domandaForme(costruisciForme(sorte, cfg), sorte)
    return domandaCose(costruisciCose(sorte, cfg), sorte)
  }
}

export default new Indizi()

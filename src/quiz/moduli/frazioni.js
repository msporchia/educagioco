/* ═══════════════════════════════════════════════════════════════════
   FRAZIONI — torte, barrette e tavolette divise in pezzi uguali.

   È il pezzo di matematica che a scuola arriva in terza e non se ne va
   più, e quello dove il disegno fa più differenza: «3/4» scritto è un
   numero sopra un altro, «3/4» disegnato è una torta a cui manca una
   fetta. Per questo le prime tre tipologie si guardano — il modulo
   decide i fatti (`{ che: 'frazione', forma, parti, colorate }`) e il
   pittore li disegna — e il conto nudo arriva solo in fondo, quando
   dietro al conto c'è già un'immagine.

   SI RAGIONA, NON SI RICORDA. Nessuna domanda chiede un nome o una
   regola da recitare: si contano i pezzi, si confrontano due fette, si
   divide un mucchio di figurine. Chi sbaglia ha fatto un passo storto,
   e il `perche` gli dice quale.

   I FALSI SONO GLI ERRORI VERI, e in questa materia sono pochi e
   sempre gli stessi — per questo contano tanto:
     · sopra e sotto scambiati (4/3 per tre quarti);
     · sotto i pezzi VUOTI invece di tutti i pezzi (3 colorati e 1 vuoto
       letti 3/1) — il più comune in assoluto;
     · la figura divisa in pezzi NON UGUALI presa per quarti: il falso
       che insegna di più, perché la regola «pezzi uguali» si dice sempre
       e non si guarda mai;
     · «1/4 è più di 1/3 perché 4 è più di 3»: il numero sotto letto
       come una quantità invece che come una grandezza di pezzo;
     · nella frazione di un numero, fermarsi a 1/4 invece di prenderne
       3, o dividere per il numero sopra;
     · nelle equivalenti, aggiungere lo stesso numero sopra e sotto
       invece di moltiplicare (2/3 = 4/5).

   UNA DOMANDA CON DUE RISPOSTE DIFENDIBILI È UN GUASTO, e qui il modo
   di farne una è sottile: «che parte è colorata?» davanti a 2/4 ha
   anche 1/2 come risposta vera. Nessun falso può quindi valere quanto
   la buona — lo controlla `falsiDi`, sul valore e non sulla scritta —
   e la figura coi pezzi storti è costruita in modo che la sua parte
   colorata stia lontana almeno un decimo da quella chiesta: se per caso
   facesse tre quarti dell'area, un bambino sveglio avrebbe ragione a
   sceglierla.

   NIENTE DECIMALI: 3/10 = 0,3 lo fa un altro modulo. E niente frazioni
   più grandi dell'intero: 5/4 è di quinta, e senza una torta e un
   quarto da disegnare sarebbe una domanda muta.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo, scena, emoji } from '../nucleo/domanda.js'
import { PITTORI_FRAZIONI } from '../grafica/pittori/frazioni.js'

/* ── come si dice ──
   «3/4» si legge «tre quarti», e l'aiuto lo dice: chi non ha mai visto
   la scrittura con la barra impara lì come si pronuncia. */
const PARTE = {
  2: ['mezzo', 'mezzi'], 3: ['terzo', 'terzi'], 4: ['quarto', 'quarti'],
  5: ['quinto', 'quinti'], 6: ['sesto', 'sesti'], 7: ['settimo', 'settimi'],
  8: ['ottavo', 'ottavi'], 9: ['nono', 'noni'], 10: ['decimo', 'decimi'],
  11: ['undicesimo', 'undicesimi'], 12: ['dodicesimo', 'dodicesimi'],
}
const NUMERI = ['zero', 'un', 'due', 'tre', 'quattro', 'cinque', 'sei',
  'sette', 'otto', 'nove', 'dieci', 'undici', 'dodici']
const siLegge = (a, b) => PARTE[b]
  ? (a === 1 ? `un ${PARTE[b][0]}` : `${NUMERI[a]} ${PARTE[b][1]}`)
  : `${a}/${b}`

const fr = (a, b) => `${a}/${b}`
/* «1 pezzo», «3 pezzi»: le frasi generate col numero dentro sono il
   posto dove nasce «i pezzi colorati sono 1», e a schermo si legge */
const pezzi = k => k === 1 ? '1 pezzo' : `${k} pezzi`
const stessoValore = ([a, b], [c, d]) => a * d === b * c

/* ── le figure ──
   La torta e la barra si dividono in qualunque numero di pezzi; la
   tavoletta solo dove la griglia viene bella (due righe da tre, tre da
   quattro). Solo torta e barra sanno fare i pezzi storti. */
const RIGHE = { 4: 2, 6: 2, 8: 2, 9: 3, 10: 2, 12: 3 }
const NOME_FORMA = { torta: 'torta', barra: 'barretta', tavoletta: 'tavoletta' }
const PLURALE_FORMA = { torta: 'torte', barra: 'barrette', tavoletta: 'tavolette' }

/* il giallo pieno sul velo chiaro non si distingue abbastanza (vedi il
   pittore): qui non si sceglie nemmeno */
const TINTE_FR = ['azzurro', 'verde', 'rosso', 'viola', 'arancione']

const intervallo = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

/* una figura: la forma, il colore e com'è girata si scelgono una volta
   per domanda e valgono per tutti i disegni di quella domanda — se no
   il bambino confronta i colori invece delle parti */
function figura(sorte, { forme = ['torta', 'barra'], parti }) {
  const possibili = forme.filter(f => f !== 'tavoletta' || RIGHE[parti])
  const forma = sorte.uno(possibili.length ? possibili : ['barra'])
  const f = { forma, tinta: sorte.uno(TINTE_FR) }
  if (forma === 'torta') f.giro = sorte.forse(0.5) ? 0 : 0.5
  if (forma === 'barra') f.verso = sorte.forse(0.65) ? 'o' : 'v'
  return f
}

/* la scena di una figura con `parti` pezzi e quelli in `colorate`.
   `giro` qui è in mezze parti, e diventa frazione di giro solo adesso:
   mezza parte di una torta da tre non è mezza parte di una da otto. */
function disegno(f, parti, colorate, pezzi = null) {
  const s = { che: 'frazione', forma: f.forma, parti, colorate, tinta: f.tinta }
  if (f.forma === 'torta') s.giro = Math.round(f.giro / parti * 1000) / 1000
  if (f.forma === 'barra') s.verso = f.verso
  if (f.forma === 'tavoletta') s.righe = RIGHE[parti]
  if (pezzi) s.pezzi = pezzi
  return s
}

/* quali pezzi colorare: in fila (dal primo, o da un punto a caso) o
   sparsi. Sparsi obbligano a contare invece di stimare a occhio, ed è
   un gradino in più: si danno dal secondo grado. */
function qualiColorare(sorte, parti, quanti, { sparsi = false } = {}) {
  if (sparsi) return sorte.alcuni(intervallo(0, parti - 1), quanti).sort((a, b) => a - b)
  const da = sorte.fra(0, parti - quanti)
  return intervallo(da, da + quanti - 1)
}

/* ── i falsi, scelti con due guardie ──
   `candidati` sono coppie [sopra, sotto] con il loro perché, in ordine
   d'importanza. Si scartano quelli fuori forma (zero, negativi, oltre
   l'intero), quelli scritti uguale a un altro e — la guardia che conta —
   quelli che VALGONO quanto la buona: 1/2 fra i falsi di 2/4 è una
   seconda risposta giusta. I primi `fissi` restano sempre, gli altri si
   pescano: così l'errore principale c'è ogni volta e il resto gira. */
function falsiDi(buona, candidati, sorte, { quanti = 3, fissi = 1 } = {}) {
  const viste = new Set([fr(...buona)])
  const buoni = []
  for (const c of candidati) {
    const [a, b] = c.v
    if (!(Number.isInteger(a) && Number.isInteger(b) && a > 0 && b > 0)) continue
    if (a >= b && !c.fuori) continue          // oltre l'intero solo se è l'errore stesso (4/3)
    const k = fr(a, b)
    if (viste.has(k) || stessoValore(c.v, buona)) continue
    viste.add(k)
    buoni.push(c)
  }
  const testa = buoni.slice(0, fissi)
  return [...testa, ...sorte.mescola(buoni.slice(fissi))].slice(0, quanti)
}

/* i numeri come falsi (la frazione di un numero, il pezzo che manca):
   stesse guardie, sulla scritta */
function numeriFalsi(giusto, candidati, sorte, { quanti = 3, fissi = 1 } = {}) {
  const viste = new Set([giusto])
  const buoni = []
  for (const c of candidati) {
    if (!(Number.isInteger(c.n) && c.n > 0) || viste.has(c.n)) continue
    viste.add(c.n)
    buoni.push(c)
  }
  const testa = buoni.slice(0, fissi)
  return [...testa, ...sorte.mescola(buoni.slice(fissi))].slice(0, quanti)
}

const NOMI = ['Anna', 'Bruno', 'Carla', 'Dario', 'Elsa', 'Gino', 'Ivo', 'Luca',
  'Marta', 'Nico', 'Olga', 'Pia', 'Sara', 'Teo', 'Zoe', 'Rita']
const CIBI = [
  { nome: 'torta', em: '🎂' }, { nome: 'pizza', em: '🍕' },
  { nome: 'focaccia', em: '🫓' }, { nome: 'crostata', em: '🥧' },
]

/* ── la frazione di un numero, nelle cose di tutti i giorni ──
   `max` tiene il totale verosimile: una classe da novanta bambini è una
   domanda che si scarta ridendo, e il conto non si fa più sul serio. */
const COSE = [
  { em: '🃏', max: 100, dice: (chi, N, f) => `${chi} ha ${N} figurine e ne regala ${f}. Quante ne regala?` },
  { em: '🍬', max: 60, dice: (chi, N, f) => `${chi} ha ${N} caramelle e ne mangia ${f}. Quante ne mangia?` },
  { em: '📖', max: 100, dice: (chi, N, f) => `Un libro ha ${N} pagine, e ${chi} ne ha lette ${f}. Quante pagine ha letto?` },
  { em: '🔵', max: 60, dice: (chi, N, f) => `${chi} ha ${N} biglie e ne perde ${f}. Quante biglie perde?` },
  { em: '🐑', max: 80, dice: (_, N, f) => `In un recinto ci sono ${N} pecore, e ${f} sono nere. Quante sono le pecore nere?` },
  { em: '💶', max: 100, dice: (chi, N, f) => `${chi} ha ${N} euro e ne spende ${f}. Quanti euro spende?` },
  { em: '🌷', max: 50, dice: (_, N, f) => `In un vaso ci sono ${N} fiori, e ${f} sono rossi. Quanti sono i fiori rossi?` },
  { em: '🧒', max: 30, dice: (_, N, f) => `In una classe ci sono ${N} bambini, e ${f} vanno a scuola a piedi. Quanti vanno a piedi?` },
]

/* ── che cosa si chiede a ogni grado ── */
const SCALETTA = [
  'la metà, un terzo, un quarto, sul disegno',
  'più pezzi colorati, fino agli ottavi',
  'fino ai dodicesimi, chi è più grande e quanto manca',
  'lo stesso numero sopra, e la frazione di un numero',
  'le frazioni equivalenti, e i tre quarti di un numero',
]

/* ── LE TIPOLOGIE, E PERCHÉ STANNO LÌ ──
   La scala è quella di sempre: 0 = quattro anni, 12,5 punti per anno,
   quindi la seconda elementare sta a 37,5, la terza a 50, la quarta a
   62,5 e la quinta a 75. Il programma (Indicazioni nazionali, e i libri
   di testo che le seguono) dice:
     · in SECONDA le frazioni non ci sono. Sulla carta le Indicazioni
       fanno incontrare la metà e il quarto sul disegno già lì, e il
       primo gradino stava a 38; in classe (la seconda di casa, settembre
       2026) non si sono viste, e arrivano in terza. Si guarda la classe
       e non il libro: il primo gradino è a 50, cioè il primo giorno di
       terza, e sta tutto sulla figura — l'aiuto insegna anche come si
       legge «1/4»;
     · in TERZA la frazione vera: l'unità frazionaria, più pezzi
       colorati, la figura da riconoscere e il confronto quando il numero
       sotto è lo stesso (che si vede contando) — da 50 a 59;
     · a FINE TERZA la complementare («quanto manca per fare l'intero»,
       sul disegno 60) e il confronto con lo stesso numero sopra, che è
       il primo che chiede di ragionare sulla grandezza dei pezzi (63);
     · in QUARTA la frazione di un numero (64 l'unitaria, 70 quella con
       più pezzi, che chiede due passi), le equivalenti viste sul disegno
       (68) e il complementare senza disegno (64–68);
     · a cavallo fra QUARTA e QUINTA le equivalenti col conto (74):
       moltiplicare sopra e sotto per lo stesso numero.
   Spostando il primo gradino di dodici punti gli altri si sono stretti
   invece di scorrere tutti: la fine resta in quinta, dov'era.
   La frazione di un numero dà per scontate anche le divisioni: 1/4 di
   20 è 20 : 4, e a chi non divide ancora quella domanda arriva muta. I
   numeri restano dentro le tabelline, ma il gesto è quello. */
const TIPI = [
  { chiave: 'fraz:leggi', nome: 'Che parte è colorata', sa: 'frazioni',
    livello: { 1: 50, 2: 54, 3: 58 },
    gradi: { 1: 0.6, 2: 0.4, 3: 0.25 } },
  { chiave: 'fraz:disegno', nome: 'Il disegno di una frazione (e i pezzi non uguali)', sa: 'frazioni',
    livello: { 1: 52, 2: 56, 3: 60 },
    gradi: { 1: 0.4, 2: 0.35, 3: 0.2 } },
  { chiave: 'fraz:confronta-den', nome: 'Chi è più grande, con lo stesso numero sotto', sa: 'frazioni',
    livello: { 2: 56, 3: 59 },
    gradi: { 2: 0.25, 3: 0.2 } },
  { chiave: 'fraz:confronta-num', nome: 'Chi è più grande, con lo stesso numero sopra', sa: 'frazioni',
    livello: { 3: 63, 4: 66 },
    gradi: { 3: 0.2, 4: 0.25 } },
  { chiave: 'fraz:intero', nome: 'Quanto manca per fare un intero', sa: 'frazioni',
    livello: { 3: 60, 4: 64, 5: 68 },
    gradi: { 3: 0.15, 4: 0.2, 5: 0.25 } },
  { chiave: 'fraz:di-numero', nome: 'La frazione di un numero (1/4 di 20)', sa: ['frazioni', 'divisioni'],
    livello: { 4: 64, 5: 70 },
    gradi: { 4: 0.35, 5: 0.35 } },
  { chiave: 'fraz:equivalenti', nome: 'Le frazioni equivalenti (2/4 = 1/2)', sa: 'frazioni',
    livello: { 4: 68, 5: 74 },
    gradi: { 4: 0.2, 5: 0.4 } },
]

class Frazioni extends Modulo {
  constructor() {
    super({
      id: 'frazioni',
      nome: 'Frazioni',
      icona: '🍕',
      materia: 'matematica',
      chiaro: 'dividere in pezzi uguali: leggere, disegnare e confrontare le frazioni',
      scaletta: SCALETTA,
      /* QUANTO È COMPLICATO OGNI GRADO, da 0 a 100 — la scala è una
         sola per tutte le materie (vedi `nucleo/classi.js`). Sono le
         medie delle tipologie qui sopra, che dicono ognuna il suo: il
         perché dei numeri sta in testa a `TIPI`. */
      livelli: [51, 55, 60, 65, 71],
      tipi: TIPI,
      pittori: PITTORI_FRAZIONI,
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'fraz:disegno': return this.disegno(grado, sorte)
      case 'fraz:confronta-den': return this.confrontaDen(grado, sorte)
      case 'fraz:confronta-num': return this.confrontaNum(grado, sorte)
      case 'fraz:intero': return this.intero(grado, sorte)
      case 'fraz:di-numero': return this.diNumero(grado, sorte)
      case 'fraz:equivalenti': return this.equivalenti(grado, sorte)
      default: return this.leggi(grado, sorte)
    }
  }

  /* quanti pezzi e quanti colorati, grado per grado: al primo solo un
     pezzo di due, tre o quattro; poi più pezzi colorati, e in fondo
     fino ai dodicesimi */
  quantiPezzi(grado, sorte) {
    if (grado <= 1) return [sorte.fra(2, 4), 1]
    const n = grado === 2 ? sorte.fra(3, 8) : sorte.fra(5, 12)
    const unitaria = sorte.forse(grado === 2 ? 0.2 : 0.12)
    return [n, unitaria ? 1 : sorte.fra(2, n - 1)]
  }

  /* ── che parte è colorata ── */
  leggi(grado, sorte) {
    const [n, k] = this.quantiPezzi(grado, sorte)
    const f = figura(sorte, { forme: grado >= 2 ? ['torta', 'barra', 'tavoletta'] : ['torta', 'barra'], parti: n })
    const colorate = qualiColorare(sorte, n, k, { sparsi: grado >= 2 && sorte.forse(0.45) })
    const falsi = falsiDi([k, n], [
      { v: [n, k], fuori: true, perche: 'sopra e sotto sono scambiati: sotto va il numero di tutti i pezzi, sopra quello dei colorati' },
      { v: [k, n - k], fuori: true, perche: `sotto vanno tutti i pezzi, anche quelli colorati: sono ${n}, `
          + (n - k === 1 ? 'non solo quello vuoto' : `non solo i ${n - k} vuoti`) },
      { v: [n - k, n], perche: 'questa è la parte vuota: '
          + (k === 1 ? 'il pezzo colorato è uno solo' : `i pezzi colorati sono ${k}`) },
      { v: [k, n + 1], perche: `conta di nuovo tutti i pezzi: sono ${n}, non ${n + 1}` },
      { v: [k, n - 1], perche: `conta di nuovo tutti i pezzi: sono ${n}, non ${n - 1}` },
    ], sorte)
    return domanda({
      testo: sorte.uno([
        `Che parte della ${NOME_FORMA[f.forma]} è colorata?`,
        'Quale frazione è colorata?',
        `Che frazione della ${NOME_FORMA[f.forma]} è colorata?`,
      ]),
      soggetto: scena(disegno(f, n, colorate)),
      buona: testo(fr(k, n)),
      falsi: falsi.map(c => testo(fr(...c.v), c.perche)),
      chiave: 'fraz:leggi',
      aiuto: `sotto si scrive in quanti pezzi uguali è divisa (${n}), sopra quanti sono colorati (${k}): `
           + `${fr(k, n)}, che si legge «${siLegge(k, n)}»`,
      sorte,
    })
  }

  /* ── quale disegno mostra la frazione ──
   Il falso che non manca mai è la figura coi pezzi storti: la regola
   «pezzi uguali» si ripete sempre e non si guarda mai, e questo è il
   posto dove si guarda. */
  disegno(grado, sorte) {
    /* al terzo grado non si va oltre i decimi: una torta da dodici con
       i pezzi storti non si legge più a 148 pixel */
    const n = grado <= 1 ? sorte.fra(2, 4) : grado === 2 ? sorte.fra(3, 8) : sorte.fra(4, 10)
    const k = grado <= 1 ? 1 : sorte.fra(1, n - 1)
    const f = figura(sorte, { parti: n })
    const primi = q => intervallo(0, q - 1)
    const candidati = [
      { storta: true, perche: `qui ci sono ${n} pezzi, ma non sono grandi uguali: in una frazione i pezzi devono essere tutti uguali` },
      { v: [k, n + k], perche: `qui ${k === 1 ? 'c\'è 1 pezzo colorato' : `ci sono ${k} pezzi colorati`} e ${n} vuoti: `
          + `ma il ${n} di sotto conta tutti i pezzi, non solo quelli vuoti` },
      { v: [n - k, n], perche: `qui ${n - k === 1 ? 'il pezzo colorato è uno' : `i pezzi colorati sono ${n - k}`}: `
          + `il numero sopra, ${k}, dice quanti colorarne` },
      { v: [k, n - 1], perche: `qui la ${NOME_FORMA[f.forma]} è divisa in ${n - 1} pezzi, non in ${n}` },
      { v: [k, n + 1], perche: `qui la ${NOME_FORMA[f.forma]} è divisa in ${n + 1} pezzi, non in ${n}` },
    ].filter(c => c.storta || (c.v[1] >= 2 && c.v[1] <= 12 && c.v[0] < c.v[1]))
    const scelti = [candidati[0], ...falsiDi([k, n], candidati.slice(1), sorte, { quanti: 2, fissi: 0 })]
    return domanda({
      testo: sorte.uno([
        `In quale ${NOME_FORMA[f.forma]} è colorato ${fr(k, n)}?`,
        `Quale disegno mostra ${fr(k, n)}?`,
        `Dove si vede ${fr(k, n)}?`,
      ]),
      buona: scena(disegno(f, n, primi(k))),
      falsi: scelti.map(c => c.storta
        ? scena(disegno(f, n, primi(k), storti(n, k, sorte)), c.perche)
        : scena(disegno(f, c.v[1], primi(c.v[0])), c.perche)),
      chiave: 'fraz:disegno',
      aiuto: `${fr(k, n)} vuol dire: la ${NOME_FORMA[f.forma]} divisa in ${n} pezzi tutti uguali, `
           + `e ${k} ${k === 1 ? 'colorato' : 'colorati'}`,
      sorte,
    })
  }

  /* ── chi è più grande, con lo stesso numero sotto ──
     Qui i pezzi sono grandi uguali, e vince chi ne prende di più: è il
     confronto che si fa contando, ed è il gradino prima dell'altro. */
  confrontaDen(grado, sorte) {
    const n = grado <= 2 ? sorte.fra(4, 8) : sorte.fra(5, 12)
    const piu = sorte.forse(0.55)
    const aiuto = 'quando sotto c\'è lo stesso numero, i pezzi sono grandi uguali: '
                + 'conta quanti se ne prendono, cioè il numero sopra'
    const dritta = 'stesso numero sotto: basta guardare il numero sopra'

    if (sorte.forse(grado >= 3 ? 0.45 : 0.3)) {
      const [a, b] = sorte.alcuni(intervallo(1, n - 1), 2)
      const [x, y] = sorte.alcuni(NOMI, 2)
      const cibo = sorte.uno(CIBI)
      const vince = (piu ? a > b : a < b) ? x : y
      const perde = vince === x ? y : x
      const pezziDi = nome => nome === x ? a : b
      return domanda({
        testo: `${x} mangia ${fr(a, n)} di una ${cibo.nome}, ${y} ${fr(b, n)} di una ${cibo.nome} uguale. `
             + `Chi ne mangia ${piu ? 'di più' : 'di meno'}?`,
        soggetto: emoji(cibo.em),
        buona: testo(vince),
        falsi: [
          testo(perde, `tutti e due hanno pezzi da ${fr(1, n)}: ${x} ne mangia ${a}, ${y} ne mangia ${b}`),
          testo('Ne mangiano uguale', `i pezzi sono grandi uguali, ma non ne mangiano lo stesso numero: ${a} contro ${b}`),
        ],
        chiave: 'fraz:confronta-den',
        aiuto, dritta, sorte,
      })
    }

    const nums = sorte.alcuni(intervallo(1, n - 1), 3)
    const meglio = piu ? Math.max(...nums) : Math.min(...nums)
    return domanda({
      testo: `Quale frazione è più ${piu ? 'grande' : 'piccola'}?`,
      buona: testo(fr(meglio, n)),
      falsi: nums.filter(a => a !== meglio).map(a => testo(fr(a, n), piu
        ? `${fr(a, n)} vuol dire ${pezzi(a)} e ${fr(meglio, n)} ${pezzi(meglio)}, tutti grandi uguali: vince chi ne ha di più`
        : `${fr(a, n)} vuol dire ${pezzi(a)} e ${fr(meglio, n)} solo ${pezzi(meglio)}, tutti grandi uguali: meno pezzi, meno parte`)),
      chiave: 'fraz:confronta-den',
      aiuto, dritta, sorte,
    })
  }

  /* ── chi è più grande, con lo stesso numero sopra ──
     Il falso che non manca mai è quello col numero sotto più grande,
     scelto come più grande: «1/4 è più di 1/3 perché 4 è più di 3». La
     storia delle fette lo fa vedere senza scrivere una frazione: chi
     taglia più fette fa fette più piccole. */
  confrontaNum(grado, sorte) {
    const piu = sorte.forse(0.6)
    const aiuto = d => `sopra c'è lo stesso numero di pezzi: più è grande il numero sotto, più i pezzi sono piccoli. `
                     + `Una torta tagliata in ${d[1]} fa fette più piccole di una tagliata in ${d[0]}`
    const dritta = 'stesso numero sopra: vince il numero sotto più piccolo'

    if (sorte.forse(0.4)) {
      const a = grado <= 3 ? 1 : sorte.uno([1, 1, 2, 3])
      const [d1, d2] = sorte.alcuni(intervallo(Math.max(3, a + 1), grado <= 3 ? 10 : 12), 2).sort((p, q) => p - q)
      const [x, y] = sorte.alcuni(NOMI, 2)
      const cibo = sorte.uno(CIBI)
      /* chi taglia in meno fette le ha più grandi; l'ordine dei due nella
         storia è a caso, così «il primo» non è mai la risposta di comodo */
      const [primo, dPrimo, secondo, dSecondo] = sorte.forse(0.5) ? [x, d1, y, d2] : [x, d2, y, d1]
      const grande = dPrimo < dSecondo ? primo : secondo
      const piccolo = grande === primo ? secondo : primo
      const fette = a === 1 ? 'una' : NUMERI[a]
      return domanda({
        testo: `${primo} taglia una ${cibo.nome} in ${dPrimo} fette uguali e ne mangia ${fette}. `
             + `${secondo} taglia una ${cibo.nome} uguale in ${dSecondo} fette uguali e ne mangia ${fette}. `
             + `Chi mangia ${piu ? 'più' : 'meno'} ${cibo.nome}?`,
        soggetto: emoji(cibo.em),
        buona: testo(piu ? grande : piccolo),
        falsi: [
          testo(piu ? piccolo : grande, piu
            ? `${piccolo} ha tagliato più fette, quindi più piccole: ${fr(a, d2)} è meno di ${fr(a, d1)}`
            : `${grande} ha tagliato meno fette, quindi più grandi: ${fr(a, d1)} è più di ${fr(a, d2)}`),
          testo('Ne mangiano uguale', `${fette === 'una' ? 'una fetta' : fette + ' fette'} ciascuno, ma le fette non sono grandi uguali: più fette vuol dire fette più piccole`),
        ],
        chiave: 'fraz:confronta-num',
        aiuto: aiuto([d1, d2]), dritta, sorte,
      })
    }

    const a = grado <= 3 ? sorte.uno([1, 1, 2]) : sorte.uno([1, 2, 3])
    const dens = sorte.alcuni(intervallo(a + 1, grado <= 3 ? 10 : 12), 3).sort((p, q) => p - q)
    const [dMin, , dMax] = dens
    const meglio = piu ? dMin : dMax
    return domanda({
      testo: `Quale frazione è più ${piu ? 'grande' : 'piccola'}?`,
      buona: testo(fr(a, meglio)),
      falsi: dens.filter(d => d !== meglio).map(d => testo(fr(a, d), piu
        ? `${d} è più di ${dMin}, ma dividere in ${d} fa pezzi più piccoli: ${fr(a, d)} è meno di ${fr(a, dMin)}`
        : `dividere in ${d} fa pezzi più grandi che dividere in ${dMax}: ${fr(a, d)} è più di ${fr(a, dMax)}`)),
      chiave: 'fraz:confronta-num',
      aiuto: aiuto([dMin, dMax]), dritta, sorte,
    })
  }

  /* ── quanto manca per fare un intero ──
     Sul disegno al primo gradino (i pezzi vuoti si contano), poi senza:
     un intero sono tanti pezzi quanti ne dice il numero sotto, e la
     domanda vera è accorgersene. */
  intero(grado, sorte) {
    const n = grado <= 3 ? sorte.fra(3, 10) : sorte.fra(3, 12)
    const k = sorte.fra(1, n - 1)
    const aiuto = `un intero sono ${fr(n, n)}: se ${k === 1 ? 'ce n\'è 1' : `ce ne sono ${k}`}, `
                + `ne ${n - k === 1 ? 'manca' : 'mancano'} ${n} − ${k} = ${n - k}, cioè ${fr(n - k, n)}`
    const mancano = `conta di nuovo: da ${k} a ${n} ${n - k === 1 ? 'manca 1 pezzo' : `mancano ${n - k} pezzi`}`
    const comuni = [
      { v: [n - k, k], fuori: true, perche: `sotto va il numero di tutti i pezzi, ${n}, non di quelli che ci sono già` },
      { v: [1, n], perche: `ne manca più di uno: da ${k} a ${n} i pezzi sono ${n - k}` },
      { v: [n - k + 1, n], perche: mancano },
      { v: [n - k - 1, n], perche: mancano },
    ]

    if (grado <= 3) {
      const f = figura(sorte, { forme: ['torta', 'barra', 'tavoletta'], parti: n })
      const falsi = falsiDi([n - k, n], [
        { v: [k, n], perche: 'questa è la parte già colorata: la domanda chiede quella che manca' },
        ...comuni,
      ], sorte)
      return domanda({
        testo: `Quanto manca per colorare tutta la ${NOME_FORMA[f.forma]}?`,
        soggetto: scena(disegno(f, n, qualiColorare(sorte, n, k, { sparsi: sorte.forse(0.3) }))),
        buona: testo(fr(n - k, n)),
        falsi: falsi.map(c => testo(fr(...c.v), c.perche)),
        chiave: 'fraz:intero',
        aiuto, sorte,
      })
    }

    /* senza disegno: il conto nudo, oppure una storia */
    const dieci = { v: [10 - k, n], perche: `un intero non è sempre 10: è ${fr(n, n)}, tanti pezzi quanti ne dice il numero sotto` }
    const storia = sorte.forse(0.5)
    const [x] = sorte.alcuni(NOMI, 1)
    const cibo = sorte.uno(CIBI)
    const falsi = falsiDi([n - k, n], [
      { v: [k, n], perche: storia
        ? `questa è quella che ${x} ha mangiato, non quella che resta`
        : `${fr(k, n)} c'è già: la domanda chiede quanto manca` },
      ...comuni.slice(0, 1), dieci, ...comuni.slice(1),
    ], sorte, { fissi: 2 })
    const consegna = storia
      ? { testo: `${x} ha mangiato ${fr(k, n)} della ${cibo.nome}. Quanta ${cibo.nome} è rimasta?`, soggetto: emoji(cibo.em) }
      : sorte.forse(0.5)
        ? { testo: `Quanto manca a ${fr(k, n)} per fare un intero?` }
        : { testo: 'Che frazione va al posto del punto di domanda?', soggetto: { testo: `${fr(k, n)} + ? = 1 intero` } }
    return domanda({
      ...consegna,
      buona: testo(fr(n - k, n)),
      falsi: falsi.map(c => testo(fr(...c.v), c.perche)),
      chiave: 'fraz:intero',
      aiuto, sorte,
    })
  }

  /* ── la frazione di un numero ──
     Prima l'unitaria — 1/4 di 20 è dividere in quattro — poi quella con
     più pezzi, che sono due passi. I numeri restano dentro le
     tabelline: il gesto che si impara è l'ordine dei passi, non la
     divisione lunga. */
  diNumero(grado, sorte) {
    const n = sorte.fra(grado <= 4 ? 2 : 3, 10)
    const unitaria = grado <= 4 || sorte.forse(0.15)
    const a = unitaria ? 1 : sorte.fra(2, n - 1)
    const storia = sorte.forse(0.55)
    const cosa = sorte.uno(COSE)
    const qMax = Math.min(10, Math.floor((storia ? cosa.max : 100) / n))
    const q = sorte.fra(2, Math.max(2, qMax))
    const N = n * q
    const giusto = a * q

    const candidati = unitaria ? [
      { n: N - n, perche: `hai tolto ${n}: 1/${n} vuol dire dividere ${N} in ${n} parti uguali` },
      { n: n !== 2 && N % 2 === 0 ? N / 2 : NaN, perche: `questa è la metà, 1/2: qui le parti sono ${n}` },
      { n: N - q, perche: `questi sono gli altri ${n - 1} pezzi: 1/${n} è uno solo` },
      { n, perche: `${n} è il numero delle parti, non quanto c'è in ognuna` },
      { n: N * n <= 200 ? N * n : NaN, perche: `hai moltiplicato per ${n}: prendere una parte vuol dire dividere` },
    ] : [
      { n: q, perche: `questo è solo ${fr(1, n)}: di pezzi così ne servono ${a}` },
      { n: N % a === 0 ? N / a : NaN, perche: `hai diviso per ${a}: si divide per il numero sotto, ${n}, e poi si moltiplica per quello sopra` },
      { n: N - giusto, perche: `questa è la parte che resta, cioè ${fr(n - a, n)}: la domanda chiede ${fr(a, n)}` },
      { n: N % a === 0 && (N / a) * n <= 300 ? (N / a) * n : NaN, perche: `sopra e sotto scambiati: si divide per ${n} e si moltiplica per ${a}` },
      { n: q + a, perche: `dopo aver diviso si moltiplica per ${a}, non si aggiunge ${a}` },
      /* un pezzo di troppo, o di meno — ma mai il mucchio intero: quello
         non è un conto sbagliato, è un'altra risposta, e merita un altro
         perché */
      { n: giusto + q < N ? giusto + q : giusto - q, perche: `conta di nuovo: sono ${a} pezzi da ${q}` },
    ]
    const falsi = numeriFalsi(giusto, candidati, sorte, { fissi: unitaria ? 0 : 1 })
    const f = fr(a, n)
    const chi = sorte.uno(NOMI)
    return domanda({
      testo: storia ? cosa.dice(chi, N, f) : `Quanto fa ${f} di ${N}?`,
      soggetto: storia ? emoji(cosa.em) : undefined,
      buona: testo(giusto),
      falsi: falsi.map(c => testo(c.n, c.perche)),
      chiave: 'fraz:di-numero',
      aiuto: unitaria
        ? `${f} di ${N} vuol dire dividere ${N} in ${n} parti uguali e prenderne una: ${N} : ${n} = ${q}`
        : `prima ${fr(1, n)}: ${N} : ${n} = ${q}. Poi ${f} sono ${a} pezzi così: ${q} × ${a} = ${giusto}`,
      sorte,
    })
  }

  /* ── le frazioni equivalenti ──
     Prima sul disegno, dove si vede che la parte colorata è lunga uguale
     anche se i pezzi sono di più; poi col conto, dove si moltiplica (o
     si divide) sopra e sotto per lo stesso numero. */
  equivalenti(grado, sorte) {
    if (grado <= 4 || sorte.forse(0.25)) return this.equivalentiDisegno(sorte)
    return sorte.forse(0.5) ? this.equivalentiQuale(sorte) : this.equivalentiBuco(sorte)
  }

  equivalentiDisegno(sorte) {
    /* una frazione ridotta e la sua gemella con più pezzi, tutte e due
       disegnabili (fino a 12 pezzi); una va nel soggetto e l'altra fra
       le risposte, a caso */
    const b = sorte.fra(2, 6)
    const a = sorte.uno(intervallo(1, b - 1).filter(x => mcd(x, b) === 1))
    const m = sorte.fra(2, Math.floor(12 / b))
    const [[p, q], [r, s]] = sorte.forse(0.5) ? [[a, b], [a * m, b * m]] : [[a * m, b * m], [a, b]]
    const f = figura(sorte, { parti: Math.max(q, s) })
    /* le torte partono tutte dalle dodici: la parte colorata si
       confronta a occhio, e mezza fetta di scarto la sposterebbe */
    if (f.forma === 'torta') f.giro = 0
    const primi = x => intervallo(0, x - 1)
    const nomi = PLURALE_FORMA[f.forma]
    const altri = intervallo(2, 12).filter(d => d !== q && d !== s)
    const candidati = [
      ...sorte.mescola(altri).filter(d => d > p).slice(0, 2).map(d => ({ v: [p, d],
        perche: `ha ${p} ${p === 1 ? 'pezzo colorato' : 'pezzi colorati'} come quella, ma i pezzi sono di un'altra grandezza: guarda quanta parte è colorata, non quanti pezzi` })),
      { v: [r + 1, s], perche: `metti le due ${nomi} una sopra l'altra: qui la parte colorata è più grande` },
      { v: [r - 1, s], perche: `metti le due ${nomi} una sopra l'altra: qui la parte colorata è più piccola` },
      { v: [q - p, q], perche: 'qui è colorata la parte che nell\'altra è vuota' },
    ].filter(c => c.v[1] <= 12)
    const falsi = falsiDi([p, q], candidati, sorte)
      .filter(c => fr(...c.v) !== fr(r, s))
    return domanda({
      testo: `Quale ${NOME_FORMA[f.forma]} ha colorata la stessa parte di questa?`,
      soggetto: scena(disegno(f, q, primi(p))),
      buona: scena(disegno(f, s, primi(r))),
      falsi: falsi.map(c => scena(disegno(f, c.v[1], primi(c.v[0])), c.perche)),
      chiave: 'fraz:equivalenti',
      aiuto: `non conta quanti pezzi sono colorati ma quanto è grande la parte colorata: `
           + `${fr(p, q)} e ${fr(r, s)} coprono lo stesso pezzo di ${NOME_FORMA[f.forma]}`,
      sorte,
    })
  }

  /* «quale frazione è uguale a 2/3?», verso l'alto o verso il basso */
  equivalentiQuale(sorte) {
    const b = sorte.fra(2, 9)
    const a = sorte.uno(intervallo(1, b - 1).filter(x => mcd(x, b) === 1))
    const m = sorte.fra(2, b <= 5 ? 5 : 3)
    const su = sorte.forse(0.55)
    const [dato, buona] = su ? [[a, b], [a * m, b * m]] : [[a * m, b * m], [a, b]]
    const candidati = su ? [
      { v: [a + m, b + m], perche: `hai aggiunto ${m} sopra e sotto: per restare uguale una frazione si moltiplica, non si aggiunge` },
      { v: [a, b * m], perche: 'hai moltiplicato solo il numero sotto: i pezzi diventano più piccoli, e allora ne servono di più' },
      { v: [a * m, b], fuori: true, perche: 'hai moltiplicato solo il numero sopra: va fatto sopra e sotto' },
      { v: [a * m, b * (m + 1)], perche: `sopra hai moltiplicato per ${m} e sotto per ${m + 1}: il numero dev'essere lo stesso` },
    ] : [
      { v: [a, b * m - (a * m - a)], perche: `hai tolto ${a * m - a} sopra e sotto: per restare uguale una frazione si divide, non si toglie` },
      { v: [a, b * m], perche: 'hai diviso solo il numero sopra: va fatto sopra e sotto' },
      { v: [a * m, b], fuori: true, perche: 'hai diviso solo il numero sotto: va fatto sopra e sotto' },
      { v: [b - a, b], perche: `questa è la parte che manca per fare un intero, non la stessa` },
    ]
    const falsi = falsiDi(buona, candidati, sorte, { fissi: 1 })
    return domanda({
      testo: `Quale frazione è uguale a ${fr(...dato)}?`,
      buona: testo(fr(...buona)),
      falsi: falsi.map(c => testo(fr(...c.v), c.perche)),
      chiave: 'fraz:equivalenti',
      aiuto: su
        ? `una frazione resta uguale se moltiplichi sopra e sotto per lo stesso numero: `
          + `${a} × ${m} = ${a * m} e ${b} × ${m} = ${b * m}`
        : `una frazione resta uguale se dividi sopra e sotto per lo stesso numero: `
          + `${a * m} : ${m} = ${a} e ${b * m} : ${m} = ${b}`,
      sorte,
    })
  }

  /* «2/3 = ?/12»: il numero che manca, nei due versi */
  equivalentiBuco(sorte) {
    const b = sorte.fra(2, 9)
    const a = sorte.uno(intervallo(1, b - 1).filter(x => mcd(x, b) === 1))
    const m = sorte.fra(2, b <= 5 ? 6 : 4)
    const su = sorte.forse(0.6)
    const [A, B] = [a * m, b * m]
    const giusto = su ? A : a
    const candidati = su ? [
      { n: a + (B - b), perche: `da ${b} a ${B} non si aggiunge ${B - b}: si moltiplica per ${m}, sopra e sotto` },
      { n: m, perche: `${m} è quante volte ${b} sta in ${B}: adesso moltiplica anche il ${a}` },
      { n: B - A, perche: 'questo è quanto manca per fare un intero, non la stessa frazione' },
      { n: A + a, perche: `conta di nuovo: ${a} × ${m} = ${A}` },
    ] : [
      { n: A - (B - b), perche: `da ${B} a ${b} non si toglie ${B - b}: si divide per ${m}, sopra e sotto` },
      /* prima del `m`: quando i due coincidono (4/16 = ?/4) il perché
         giusto è questo, e l'altro direbbe «dividi anche il 4» a chi
         il 4 l'ha lasciato com'era */
      { n: A, perche: `il numero sotto è diventato ${b}: anche quello sopra va diviso per ${m}` },
      { n: m, perche: `${m} è quante volte ${b} sta in ${B}: adesso dividi anche il ${A}` },
      { n: b - a, perche: 'questo è quanto manca per fare un intero, non la stessa frazione' },
    ]
    const falsi = numeriFalsi(giusto, candidati, sorte, { fissi: 1 })
    return domanda({
      testo: 'Che numero va al posto del punto di domanda?',
      soggetto: { testo: su ? `${fr(a, b)} = ?/${B}` : `${fr(A, B)} = ?/${b}` },
      buona: testo(giusto),
      falsi: falsi.map(c => testo(c.n, c.perche)),
      chiave: 'fraz:equivalenti',
      aiuto: su
        ? `${B} è ${b} × ${m}: sopra si fa lo stesso, ${a} × ${m} = ${A}`
        : `${b} è ${B} : ${m}: sopra si fa lo stesso, ${A} : ${m} = ${a}`,
      sorte,
    })
  }
}

function mcd(x, y) { return y ? mcd(y, x % y) : x }

/* ── i pezzi storti ──
   `n` pesi: i primi `k` (quelli colorati) di una grandezza e gli altri
   di un'altra, con un po' di tremolio perché sembrino tagliati a mano.
   Due condizioni, e si riprova finché non valgono tutte e due: i pezzi
   devono **sembrare** diversi (il più grande almeno una volta e mezza
   il più piccolo) e la parte colorata deve stare **lontana** da k/n —
   almeno un decimo dell'intero — se no la figura storta mostrerebbe
   davvero quella frazione, e il bambino che la sceglie avrebbe ragione.

   Il verso si sceglie dove c'è spazio: con poco colorato (1/10) i
   pezzi colorati si fanno grandi, con tanto (9/10) piccoli. Al
   contrario la parte si schiaccerebbe contro lo zero o contro l'intero
   e non si allontanerebbe abbastanza — 9/10 coi colorati piccoli la
   metà dei vuoti fa ancora 0,8.

   I pesi si arrotondano al centesimo: la scena va in un JSON, e un
   numero con sedici decimali ci sta male e non disegna niente di più. */
function storti(n, k, sorte) {
  const colorGrandi = k / n < 0.5
  const peso = (i, r) => ((i < k) === colorGrandi ? r : 1)
  let r = sorte.uno([2, 2.5, 3])
  for (let prova = 0; prova < 30; prova++, r = Math.min(4, r + 0.1)) {
    const w = Array.from({ length: n }, (_, i) =>
      Math.round(peso(i, r) * (0.9 + sorte.frazione * 0.2) * 100) / 100)
    const tot = w.reduce((s, x) => s + x, 0)
    const parte = w.slice(0, k).reduce((s, x) => s + x, 0) / tot
    if (Math.max(...w) / Math.min(...w) >= 1.5 && Math.abs(parte - k / n) >= 0.1) return w
  }
  /* il ripiego, senza tremolio: col rapporto tre la parte si sposta di
     almeno 0,13 per ogni k fra 1 e n−1 fino a dodici pezzi */
  return Array.from({ length: n }, (_, i) => peso(i, 3))
}

export default new Frazioni()

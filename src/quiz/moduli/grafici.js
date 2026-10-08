/* Grafici e tabelle: leggere i dati prima di farci i conti («relazioni,
   dati e previsioni» delle Indicazioni). I dati sono inventati, le storie
   no: otto storie riconoscibili (gelati venduti, voti in classe, libri
   letti...) con numeri diversi ogni volta, e la stessa domanda torna
   dentro pittogramma, istogramma e tabella — è la stessa idea vista in
   tre modi. I falsi sono gli errori veri e sempre gli stessi: la voce
   accanto, la legenda dimenticata, le tacche contate come se valessero
   uno, il totale al posto della differenza, il riporto dimenticato, la
   moda confusa con quante volte compare. Il disegno è la domanda: i
   pittori (grafica/pittori/dati.js) ricevono solo fatti già decisi. */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo, emoji, scena } from '../nucleo/domanda.js'
import { PITTORI_DATI, TACCHE } from '../grafica/pittori/dati.js'

// una voce è quello che sta su una fila o una barra, in quattro forme (etichetta, nome, a/di già con la preposizione)
// per evitare di ritrovarsi «la fila di il cane» costruendo un nome a pezzi
const aPrep = n => (/^[aA]/.test(n) ? 'ad ' : 'a ')

const figura = ([em, nome, a, di]) =>
  ({ etichetta: em, em, nome: `${nome} ${em}`, a: `${a} ${em}`, di: `${di} ${em}` })
const persona = nome =>
  ({ etichetta: nome, nome, a: aPrep(nome) + nome, di: `di ${nome}` })
const calendario = nome =>
  ({ etichetta: nome.slice(0, 3), nome, a: aPrep(nome) + nome, di: `di ${nome}` })

const GIORNI = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'].map(calendario)
const MESI = ['settembre', 'ottobre', 'novembre', 'dicembre', 'gennaio', 'febbraio', // l'anno di scuola
  'marzo', 'aprile', 'maggio', 'giugno'].map(calendario)
// nomi corti apposta: sulla tabella stanno in una casella larga un quarto del riquadro
const NOMI = ['Ada', 'Leo', 'Eva', 'Ugo', 'Bea', 'Teo', 'Lia', 'Ivo', 'Noa', 'Gio',
  'Sara', 'Luca', 'Anna', 'Nico', 'Omar', 'Rita', 'Dino', 'Mia', 'Zoe', 'Tom'].map(persona)
const ANIMALI = [
  ['🐶', 'il cane', 'al cane', 'del cane'], ['🐱', 'il gatto', 'al gatto', 'del gatto'],
  ['🐰', 'il coniglio', 'al coniglio', 'del coniglio'], ['🐢', 'la tartaruga', 'alla tartaruga', 'della tartaruga'],
  ['🐹', 'il criceto', 'al criceto', 'del criceto'], ['🦜', 'il pappagallo', 'al pappagallo', 'del pappagallo'],
].map(figura)
const SQUADRE = [
  ['🔴', 'i Rossi', 'ai Rossi', 'dei Rossi'], ['🔵', 'i Blu', 'ai Blu', 'dei Blu'],
  ['🟢', 'i Verdi', 'ai Verdi', 'dei Verdi'], ['🟡', 'i Gialli', 'ai Gialli', 'dei Gialli'],
  ['🟣', 'i Viola', 'ai Viola', 'dei Viola'],
].map(figura)
const FRUTTI = [
  ['🍎', 'mele', 'alle mele', 'delle mele'], ['🍐', 'pere', 'alle pere', 'delle pere'],
  ['🍊', 'arance', 'alle arance', 'delle arance'], ['🍋', 'limoni', 'ai limoni', 'dei limoni'],
  ['🍑', 'pesche', 'alle pesche', 'delle pesche'], ['🍒', 'ciliegie', 'alle ciliegie', 'delle ciliegie'],
].map(figura)

const PAROLE = { 2: 'due', 3: 'tre', 4: 'quattro', 5: 'cinque', 6: 'sei', 7: 'sette', 8: 'otto', 9: 'nove', 10: 'dieci' }
const volte = n => (n === 1 ? 'una volta' : `${n} volte`)

// fila: true = le voci hanno un ordine, se ne prende un pezzo di seguito; tetto = il numero più grande sensato per la storia
// l'icona è tonda e larga: una forma stretta o asimmetrica letta a metà sembrerebbe una fettina, non un mezzo disegno
const STORIE = [
  {
    id: 'gelati', icona: '🍨', voci: GIORNI, fila: true, tetto: 100,
    quanti: v => `Quanti gelati ha venduto il gelataio ${v.nome}?`,
    chi: piu => `In che giorno il gelataio ha venduto ${piu ? 'più' : 'meno'} gelati?`,
    confronta: (a, b, w) => `Quanti gelati in ${w} ha venduto il gelataio ${a.nome} rispetto ${b.a}?`,
    tutto: n => `Quanti gelati ha venduto il gelataio in tutto, in questi ${PAROLE[n]} giorni?`,
    media: () => 'In media, quanti gelati ha venduto il gelataio ogni giorno?',
  },
  {
    id: 'voti', icona: '🙂', voci: ANIMALI, tetto: 30,
    quanti: v => `In classe si vota l'animale preferito: quanti bambini hanno votato ${v.nome}?`,
    chi: piu => `Quale animale hanno votato ${piu ? 'più' : 'meno'} bambini?`,
    confronta: (a, b, w) => `Quanti bambini in ${w} hanno votato ${a.nome} rispetto ${b.a}?`,
    tutto: () => 'Quanti bambini hanno votato in tutto?',
    media: null,
  },
  {
    id: 'libri', icona: '📕', voci: NOMI, tetto: 30,
    quanti: v => `Quanti libri ha letto ${v.nome} quest'anno?`,
    chi: piu => `Chi ha letto ${piu ? 'più' : 'meno'} libri?`,
    confronta: (a, b, w) => `Quanti libri in ${w} ha letto ${a.nome} rispetto ${b.a}?`,
    tutto: n => `Quanti libri hanno letto in tutto questi ${PAROLE[n]} amici?`,
    media: () => 'In media, quanti libri ha letto ognuno?',
  },
  {
    id: 'figurine', icona: '🃏', voci: NOMI, tetto: 100,
    quanti: v => `Quante figurine ha ${v.nome}?`,
    chi: piu => `Chi ha ${piu ? 'più' : 'meno'} figurine?`,
    confronta: (a, b, w) => `Quante figurine in ${w} ha ${a.nome} rispetto ${b.a}?`,
    tutto: n => `Quante figurine hanno in tutto questi ${PAROLE[n]} amici?`,
    media: () => 'In media, quante figurine ha ognuno?',
  },
  {
    id: 'pioggia', icona: '☔', voci: MESI, fila: true, tetto: 20,
    quanti: v => `Quanti giorni di pioggia ci sono stati in ${v.nome}?`,
    chi: piu => `In che mese ci sono stati ${piu ? 'più' : 'meno'} giorni di pioggia?`,
    confronta: (a, b, w) => `Quanti giorni di pioggia in ${w} ci sono stati in ${a.nome} rispetto ${b.a}?`,
    tutto: n => `Quanti giorni di pioggia ci sono stati in tutto, in questi ${PAROLE[n]} mesi?`,
    media: () => 'In media, quanti giorni di pioggia ci sono stati ogni mese?',
  },
  {
    id: 'gol', icona: '⚽', voci: SQUADRE, tetto: 50,
    quanti: v => `Quanti gol hanno segnato ${v.nome} nel torneo?`,
    chi: piu => `Quale squadra ha segnato ${piu ? 'più' : 'meno'} gol?`,
    confronta: (a, b, w) => `Quanti gol in ${w} hanno segnato ${a.nome} rispetto ${b.a}?`,
    tutto: n => `Quanti gol hanno segnato in tutto le ${PAROLE[n]} squadre?`,
    media: () => 'In media, quanti gol ha segnato ogni squadra?',
  },
  {
    id: 'uccellini', icona: '🐦', voci: GIORNI, fila: true, tetto: 100,
    quanti: v => `Quanti uccellini sono venuti alla mangiatoia ${v.nome}?`,
    chi: piu => `In che giorno sono venuti ${piu ? 'più' : 'meno'} uccellini alla mangiatoia?`,
    confronta: (a, b, w) => `Quanti uccellini in ${w} sono venuti alla mangiatoia ${a.nome} rispetto ${b.a}?`,
    tutto: n => `Quanti uccellini sono venuti alla mangiatoia in tutto, in questi ${PAROLE[n]} giorni?`,
    media: () => 'In media, quanti uccellini sono venuti alla mangiatoia ogni giorno?',
  },
  {
    id: 'frutta', icona: '🧺', voci: FRUTTI, tetto: 50,
    quanti: v => `Quanti cesti di ${v.nome} ha raccolto il nonno?`,
    chi: piu => `Di quale frutto il nonno ha raccolto ${piu ? 'più' : 'meno'} cesti?`,
    confronta: (a, b, w) => `Quanti cesti di ${a.nome} in ${w} ha raccolto il nonno rispetto ${b.a}?`,
    tutto: () => 'Quanti cesti di frutta ha raccolto il nonno in tutto?',
    media: null,
  },
]

// righe × colonne, una frase per ogni modo di leggerle; le colonne hanno il loro `di` per il perche («la colonna di 🦖»)
const colonna = ([etichetta, nome, di]) => ({ etichetta, nome, di })

const TABELLE = [
  {
    id: 'figurine', righe: NOMI, tetto: 60,
    colonne: [['⚽', 'di calcio ⚽', 'di ⚽'], ['🦖', 'di dinosauri 🦖', 'di 🦖'],
      ['🚗', 'di automobili 🚗', 'di 🚗'], ['🦄', 'di unicorni 🦄', 'di 🦄'],
      ['🚀', 'di astronavi 🚀', 'di 🚀']].map(colonna),
    cella: (r, c) => `Quante figurine ${c.nome} ha ${r.nome}?`,
    riga: r => `Quante figurine ha ${r.nome} in tutto?`,
    colonna: c => `Quante figurine ${c.nome} hanno tutti insieme?`,
    confronta: (c, a, b, w) => `Quante figurine ${c.nome} in ${w} ha ${a.nome} rispetto ${b.a}?`,
  },
  {
    id: 'punti', righe: NOMI, tetto: 50,
    colonne: [['🎯', 'alle freccette 🎯', 'di 🎯'], ['🏀', 'a canestro 🏀', 'di 🏀'],
      ['🎳', 'ai birilli 🎳', 'di 🎳'], ['🥏', 'al frisbee 🥏', 'di 🥏']].map(colonna),
    cella: (r, c) => `Quanti punti ha fatto ${r.nome} ${c.nome}?`,
    riga: r => `Quanti punti ha fatto ${r.nome} in tutto?`,
    colonna: c => `Quanti punti hanno fatto tutti insieme ${c.nome}?`,
    confronta: (c, a, b, w) => `Quanti punti in ${w} ha fatto ${a.nome} rispetto ${b.a}, ${c.nome}?`,
  },
  {
    id: 'frutta', righe: NOMI, tetto: 14,
    colonne: [['🍎', 'mele 🍎', 'di 🍎'], ['🍌', 'banane 🍌', 'di 🍌'], ['🍐', 'pere 🍐', 'di 🍐'],
      ['🍊', 'arance 🍊', 'di 🍊'], ['🍓', 'fragole 🍓', 'di 🍓']].map(colonna),
    cella: (r, c) => `Quante ${c.nome} ha mangiato ${r.nome} questo mese?`,
    riga: r => `Quanti frutti ha mangiato ${r.nome} in tutto, questo mese?`,
    colonna: c => `Quante ${c.nome} hanno mangiato tutti insieme, questo mese?`,
    confronta: (c, a, b, w) => `Quante ${c.nome} in ${w} ha mangiato ${a.nome} rispetto ${b.a}?`,
  },
  {
    id: 'gita', righe: GIORNI.slice(0, 5), fila: true, tetto: 40,
    colonne: [['🦋', 'farfalle 🦋', 'di 🦋'], ['🐞', 'coccinelle 🐞', 'di 🐞'],
      ['🐌', 'lumache 🐌', 'di 🐌'], ['🐸', 'rane 🐸', 'di 🐸']].map(colonna),
    cella: (r, c) => `Quante ${c.nome} hanno visto i bambini in gita ${r.nome}?`,
    riga: r => `Quanti animaletti hanno visto i bambini in gita ${r.nome}, in tutto?`,
    colonna: c => `Quante ${c.nome} hanno visto i bambini in tutto, in questi giorni di gita?`,
    confronta: (c, a, b, w) => `Quante ${c.nome} in ${w} hanno visto i bambini ${a.nome} rispetto ${b.a}?`,
  },
  {
    id: 'libri', righe: NOMI, tetto: 15, colonneInFila: true,
    colonne: MESI.map(m => ({ etichetta: m.etichetta, nome: `in ${m.nome}`, di: m.di })),
    cella: (r, c) => `Quanti libri ha letto ${r.nome} ${c.nome}?`,
    riga: r => `Quanti libri ha letto ${r.nome} in tutto, in questi mesi?`,
    colonna: c => `Quanti libri hanno letto tutti insieme ${c.nome}?`,
    confronta: (c, a, b, w) => `Quanti libri in ${w} ha letto ${a.nome} rispetto ${b.a}, ${c.nome}?`,
  },
]

// qui i dati sono una fila, non ancora un grafico: la moda si trova contando, non leggendo «la barra più alta»
const MODA_NUMERI = [
  { che: 'Le età dei bambini alla festa di compleanno', da: 6, a: 11 },
  { che: 'Il numero di scarpe dei giocatori della squadra', da: 30, a: 37 },
  { che: 'I punti usciti lanciando un dado', da: 1, a: 6 },
  { che: 'I gol segnati dalla squadra in ogni partita', da: 0, a: 5 },
  { che: 'Quanti fratelli e sorelle ha ogni bambino della classe', da: 0, a: 4 },
  { che: 'I voti dei giudici a una gara di tuffi', da: 4, a: 10 },
]
const MODA_FIGURE = [
  { che: 'Il tempo di una settimana', quale: 'il tempo che è capitato più volte', n: [7, 7],
    figure: ['☀️', '🌧️', '⛅', '❄️'] },
  { che: 'I gusti di gelato scelti dai bambini', quale: 'il gusto scelto più volte', n: [8, 10],
    figure: ['🍓', '🍫', '🍋', '🍌', '🥥'] },
  { che: 'Gli animali preferiti dei bambini della classe', quale: "l'animale scelto più volte", n: [8, 10],
    figure: ['🐶', '🐱', '🐰', '🐢', '🐹'] },
  { che: 'Le merende portate a scuola', quale: 'la merenda che compare più volte', n: [8, 10],
    figure: ['🍎', '🍌', '🥪', '🍪', '🧃'] },
  { che: 'Come arriva a scuola ogni bambino della classe', quale: 'il modo di arrivare che compare più volte', n: [8, 10],
    figure: ['🚶', '🚲', '🚗', '🚌', '🛴'] },
]

// una storia coi numeri dentro, non un conto e basta; numeri piccoli apposta: la divisione è dentro le tabelline
const MEDIA_STORIE = [
  { da: 3, a: 12, dice: (l, n, chi) => `${chi} ha letto ${l} pagine in ${PAROLE[n]} sere. Quante pagine ha letto in media ogni sera?` },
  { da: 0, a: 5, dice: (l, n) => `In ${PAROLE[n]} partite la squadra ha segnato ${l} gol. Quanti gol ha segnato in media a partita?` },
  { da: 8, a: 20, dice: (l, n) => `In ${PAROLE[n]} mattine il termometro ha segnato ${l} gradi. Quanti gradi ha segnato in media?` },
  { da: 2, a: 15, dice: (l, n, chi) => `${chi} ha fatto ${l} punti in ${PAROLE[n]} giochi. Quanti punti ha fatto in media a gioco?` },
  { da: 4, a: 14, dice: (l, n) => `${PAROLE[n][0].toUpperCase() + PAROLE[n].slice(1)} piantine di fagioli sono alte ${l} centimetri. Quanto sono alte in media?` },
  { da: 1, a: 9, dice: (l, n, chi) => `${chi} ha trovato ${l} conchiglie in ${PAROLE[n]} giorni al mare. Quante conchiglie ha trovato in media al giorno?` },
]

// «4, 6 e 5»: l'ultima con la «e», come si dice
const elenco = l => (l.length < 2 ? String(l[0]) : `${l.slice(0, -1).join(', ')} e ${l[l.length - 1]}`)
const somma = l => l.reduce((s, x) => s + x, 0)
const piu = l => l.join(' + ')

// il riporto dimenticato: si sommano le colonne e si butta quello che va oltre il nove; è l'errore di somma vero
function senzaRiporto(l) {
  if (l.every(x => x < 10)) return NaN
  let tot = 0
  for (let peso = 1; l.some(x => x >= peso); peso *= 10)
    tot += (somma(l.map(x => Math.floor(x / peso) % 10)) % 10) * peso
  return tot
}

// candidati [numero, perché] in ordine: il primo resta sempre, gli altri si mescolano; via doppioni, negativi, zero (salvo `zero`)
function falsiDi(sorte, buona, candidati, { zero = false } = {}) {
  const visti = new Set([buona])
  const ok = []
  for (const [v, perche] of candidati) {
    if (!Number.isInteger(v) || v < (zero ? 0 : 1) || visti.has(v)) continue
    visti.add(v)
    ok.push(testo(v, perche))
  }
  const [primo, ...resto] = ok
  return primo ? [primo, ...sorte.mescola(resto)].slice(0, 3) : []
}

function diversi(sorte, n, da, a) {
  const tutti = []
  for (let v = da; v <= a; v++) tutti.push(v)
  return sorte.alcuni(tutti, n)
}

// le voci di un grafico: un pezzo di seguito se hanno un ordine, a caso se no
function prendiVoci(sorte, lista, n, fila) {
  if (!fila) return sorte.alcuni(lista, n)
  const da = sorte.fra(0, lista.length - n)
  return lista.slice(da, da + n)
}

/* ── i grafici ──
   Tre forme, e i fatti che ognuna disegna:
     · il pittogramma semplice — un disegno per cosa;
     · il pittogramma con la legenda — un disegno per `vale` cose, e
       dove il valore è pari anche il mezzo disegno;
     · l'istogramma — una barra, su una scala a dieci tacche che va di
       `passo` in `passo`.
   Le voci hanno valori tutti diversi: «chi ne ha di più» deve avere un
   vincitore solo, e un falso uguale alla risposta sparirebbe. */
function unGrafico(sorte, forma, { n = 4, max = 6, passo = 1, vale = 1, mezzi = false } = {}) {
  const tetto = forma === 'barre' ? passo * TACCHE : max * vale
  const storia = sorte.uno(STORIE.filter(s => s.tetto >= tetto))
  const voci = prendiVoci(sorte, storia.voci, n, storia.fila)

  if (forma === 'barre') {
    const valori = diversi(sorte, n, 1, TACCHE).map(k => k * passo)
    return {
      forma, storia, voci, valori, passo,
      scena: { che: 'istogramma', voci: voci.map(v => v.etichetta), valori, passo },
    }
  }
  // i mezzi disegni: almeno uno se la legenda li permette, ma non su tutte le file (sarebbe la norma, non l'eccezione)
  let icone = diversi(sorte, n, 1, max)
  if (mezzi) {
    const conMezzo = icone.map(() => sorte.forse(0.4))
    conMezzo[sorte.fra(0, n - 1)] = true
    icone = icone.map((c, i) => (conMezzo[i] && c < max ? c + 0.5 : c))
    // si rifà il giro senza mezzi piuttosto che consegnare due valori uguali
    if (new Set(icone).size < n) icone = icone.map(Math.floor)
  }
  const valori = icone.map(c => c * vale)
  return {
    forma, storia, voci, valori, icone, vale, passo: vale,
    scena: { che: 'pittogramma', voci: voci.map(v => v.etichetta), icona: storia.icona, icone, vale },
  }
}

const rispostaDi = (v, perche) => (v.em ? emoji(v.em, perche) : testo(v.nome, perche)) // la stessa cosa che si legge sul grafico
const segno = g => (g.forma === 'barre' ? 'la barra' : 'la fila')

function unaTabella(sorte, grado, colonne = 3) {
  const t = sorte.uno(TABELLE)
  const righe = prendiVoci(sorte, t.righe, 3, t.fila)
  const cols = prendiVoci(sorte, t.colonne, colonne, t.colonneInFila)
  const tetto = Math.min(t.tetto, grado >= 5 ? 45 : 15)
  const tutti = diversi(sorte, righe.length * cols.length, 1, Math.max(tetto, righe.length * cols.length))
  const celle = righe.map((_, i) => tutti.slice(i * cols.length, (i + 1) * cols.length))
  return {
    t, righe, colonne: cols, celle,
    scena: { che: 'tabella', righe: righe.map(r => r.etichetta), colonne: cols.map(c => c.etichetta), celle },
  }
}

/* ── che cosa si chiede a ogni grado ── */
const SCALETTA = [
  'il pittogramma: contare e confrontare',
  'la legenda e il grafico a barre',
  'quanti in più, quanti in tutto',
  'la tabella a doppia entrata',
  'moda e media',
]

// livelli tarati sul programma (Indicazioni 2012, «relazioni, dati e previsioni»): vedi docs/apprendimento/quiz-livelli.md
// la media dichiara anche `divisioni`, così chi non le ha fatte non la vede
const TIPI = [
  { chiave: 'dati:pittogramma', nome: 'Contare nel pittogramma', sa: 'dati',
    livello: 28, gradi: { 1: 1, 2: 0.3 } },
  { chiave: 'dati:legenda', nome: 'Il pittogramma con la legenda', sa: 'dati',
    livello: { 2: 41, 3: 50, 4: 56 }, gradi: { 2: 0.35, 3: 0.15, 4: 0.1 } },
  { chiave: 'dati:barre', nome: 'Leggere il grafico a barre', sa: 'dati',
    livello: { 2: 38, 3: 47, 4: 56 }, gradi: { 2: 0.35, 3: 0.25, 4: 0.15 } },
  { chiave: 'dati:differenza', nome: 'Quanti in più, quanti in meno', sa: 'dati',
    livello: { 3: 50, 4: 56, 5: 63 }, gradi: { 3: 0.35, 4: 0.2, 5: 0.12 } },
  { chiave: 'dati:totale', nome: 'Quanti in tutto', sa: 'dati',
    livello: { 3: 47, 4: 55, 5: 63 }, gradi: { 3: 0.25, 4: 0.15, 5: 0.1 } },
  { chiave: 'dati:tabella', nome: 'La tabella a doppia entrata', sa: 'dati',
    livello: { 4: 56, 5: 63 }, gradi: { 4: 0.4, 5: 0.13 } },
  { chiave: 'dati:moda', nome: 'La moda: quello che compare più volte', sa: 'dati',
    livello: 75, gradi: { 5: 0.3 } },
  { chiave: 'dati:media', nome: 'La media', sa: ['divisioni', 'dati'],
    livello: 81, gradi: { 5: 0.35 } },
]

class Grafici extends Modulo {
  constructor() {
    super({
      id: 'grafici',
      nome: 'Grafici e tabelle',
      icona: '📊',
      materia: 'matematica',
      chiaro: 'leggere pittogrammi, grafici a barre e tabelle, e ricavarne quanti in più, quanti in tutto, la moda e la media',
      scaletta: SCALETTA,
      livelli: [28, 38, 47, 55, 63], // il fondo di ogni grado: vale quanto la sua tipologia più facile
      tipi: TIPI,
      pittori: PITTORI_DATI,
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'dati:legenda': return this.legenda(grado, sorte)
      case 'dati:barre': return this.barre(grado, sorte)
      case 'dati:differenza': return this.differenza(grado, sorte)
      case 'dati:totale': return this.totale(grado, sorte)
      case 'dati:tabella': return this.tabella(grado, sorte)
      case 'dati:moda': return this.moda(sorte)
      case 'dati:media': return this.media(sorte)
      default: return this.pittogramma(grado, sorte)
    }
  }

  pittogramma(grado, sorte) {
    const g = unGrafico(sorte, 'pittogramma', { n: sorte.fra(3, 4), max: grado <= 1 ? 6 : 8 })
    if (sorte.forse(0.4)) return this.chi(g, sorte, 'dati:pittogramma')
    const i = sorte.fra(0, g.voci.length - 1)
    const v = g.voci[i], quanti = g.valori[i]
    const vicino = i > 0 && (i === g.voci.length - 1 || sorte.forse(0.5)) ? i - 1 : i + 1
    return domanda({
      testo: g.storia.quanti(v),
      soggetto: scena(g.scena),
      buona: testo(quanti),
      falsi: falsiDi(sorte, quanti, [
        [g.valori[vicino], `questa è la fila ${g.voci[vicino].di}: quella ${v.di} è accanto`],
        [quanti + 1, 'ne hai contato uno due volte: toccali col dito, uno per uno'],
        [quanti - 1, 'ne hai saltato uno: toccali col dito, uno per uno'],
        [quanti + 2, 'conta di nuovo, toccando i disegni uno per uno'],
      ]),
      chiave: 'dati:pittogramma',
      aiuto: `ogni ${g.storia.icona} è uno: trova la fila ${v.di} e conta i disegni col dito, uno per uno`,
      sorte,
    })
  }

  // chi ne ha di più/meno: stessa domanda su pittogramma e barre, la risposta è una voce, i falsi le altre voci
  chi(g, sorte, chiave) {
    const piu = sorte.forse(0.6)
    const ordine = g.voci.map((v, i) => i).sort((a, b) => (piu ? g.valori[b] - g.valori[a] : g.valori[a] - g.valori[b]))
    const [primo, secondo, ...altri] = ordine
    const ultimo = altri.length ? altri.pop() : null
    const barre = g.forma === 'barre'
    // il perché dice cosa si vede («la barra di giovedì arriva a 5»), non cosa vuol dire
    const quanto = i => barre
      ? `la barra ${g.voci[i].di} arriva a ${g.valori[i]}`
      : `la fila ${g.voci[i].di} ha ${g.valori[i]} disegni`
    const estremo = piu ? (barre ? 'più bassa' : 'più corta') : (barre ? 'più alta' : 'più lunga')
    const falsi = [
      rispostaDi(g.voci[secondo], `${quanto(secondo)}, ma quella ${g.voci[primo].di} ${barre ? 'arriva a' : 'ne ha'} ${g.valori[primo]}`),
      ...altri.map(i => rispostaDi(g.voci[i], `${quanto(i)}: confrontala con tutte le altre`)),
    ]
    if (ultimo !== null)
      falsi.push(rispostaDi(g.voci[ultimo], `questa è ${segno(g)} ${estremo}: la domanda chiede chi ne ha ${piu ? 'di più' : 'di meno'}`))
    const aiuto = g.forma === 'barre'
      ? `la barra più ${piu ? 'alta' : 'bassa'} è quella che ne ha ${piu ? 'di più' : 'di meno'}: guarda dove arriva la cima di ognuna`
      : `i disegni stanno in colonna, uno sotto l'altro: la fila più ${piu ? 'lunga' : 'corta'} è quella che ne ha ${piu ? 'di più' : 'di meno'}`
    return domanda({
      testo: g.storia.chi(piu),
      soggetto: scena(g.scena),
      buona: rispostaDi(g.voci[primo]),
      falsi,
      chiave,
      aiuto,
      sorte,
    })
  }

  // l'errore principe è contare i disegni e fermarsi lì; il mezzo disegno ne porta altri due, opposti (fuori, o intero)
  legenda(grado, sorte) {
    const scelta = grado <= 2 ? { vale: 2, mezzi: false, max: 6 }
      : grado === 3 ? sorte.uno([{ vale: 2, mezzi: true, max: 6 }, { vale: 5, mezzi: false, max: 6 }, { vale: 10, mezzi: false, max: 6 }])
      : sorte.uno([{ vale: 4, mezzi: true, max: 7 }, { vale: 10, mezzi: true, max: 7 }, { vale: 5, mezzi: false, max: 7 }, { vale: 3, mezzi: false, max: 7 }])
    const g = unGrafico(sorte, 'legenda', { n: sorte.fra(3, 4), ...scelta })
    // se c'è un mezzo disegno, di solito si chiede proprio quella fila: è la cosa nuova del grafico
    const conMezzo = g.icone.map((c, i) => (c % 1 ? i : -1)).filter(i => i >= 0)
    const i = conMezzo.length && sorte.forse(0.7) ? sorte.uno(conMezzo) : sorte.fra(0, g.voci.length - 1)
    const v = g.voci[i], c = g.icone[i], V = g.vale, em = g.storia.icona
    const quanti = g.valori[i]
    const intere = Math.floor(c), mezzo = c % 1 > 0
    const vicino = i > 0 ? i - 1 : i + 1
    const parti = [...Array(intere).fill(V), ...(mezzo ? [V / 2] : [])]
    const aiuto = mezzo
      ? `guarda la legenda: ogni ${em} vale ${V}, e mezzo ${em} vale la metà, ${V / 2}. Nella fila ${v.di}: ${piu(parti)} = ${quanti}`
      : intere === 1
        ? `guarda la legenda: ogni ${em} vale ${V}, e nella fila ${v.di} c'è un disegno solo: vale ${quanti}, non 1`
        : `guarda la legenda: ogni ${em} vale ${V}. Nella fila ${v.di} ci sono ${intere} disegni: ${parti.length <= 6 ? piu(parti) : `${intere} × ${V}`} = ${quanti}`
    return domanda({
      testo: g.storia.quanti(v),
      soggetto: scena(g.scena),
      buona: testo(quanti),
      falsi: falsiDi(sorte, quanti, [
        [Math.ceil(c), `hai contato i disegni, ma ogni ${em} vale ${V}: guarda la legenda`],
        ...(mezzo ? [
          [intere * V, `hai lasciato fuori il mezzo ${em}: vale la metà di ${V}, cioè ${V / 2}`],
          [Math.ceil(c) * V, `il mezzo ${em} vale la metà, ${V / 2}, non ${V}`],
        ] : [
          [(intere + 1) * V, `hai contato un ${em} di troppo: toccali col dito, uno per uno`],
        ]),
        [g.valori[vicino], `questa è la fila ${g.voci[vicino].di}: quella ${v.di} è accanto`],
        [quanti + V, `hai contato un ${em} di troppo: toccali col dito, uno per uno`],
      ]),
      chiave: 'dati:legenda',
      aiuto,
      // la strada corta è una tabellina; col mezzo disegno no, lì la somma è la strada
      dritta: mezzo ? undefined : `c'è una strada corta: ${intere} disegni da ${V} sono ${intere} × ${V} = ${quanti}`,
      sorte,
    })
  }

  // col passo di uno la tentazione è la tacca accanto; col passo di due o cinque, contarle come se valessero uno
  barre(grado, sorte) {
    const passo = grado <= 2 ? 1 : grado === 3 ? sorte.uno([1, 2, 2]) : sorte.uno([2, 5, 10])
    const g = unGrafico(sorte, 'barre', { n: sorte.fra(3, grado <= 2 ? 4 : 5), passo })
    if (sorte.forse(0.3)) return this.chi(g, sorte, 'dati:barre')
    const i = sorte.fra(0, g.voci.length - 1)
    const v = g.voci[i], quanti = g.valori[i]
    const vicino = i > 0 && (i === g.voci.length - 1 || sorte.forse(0.5)) ? i - 1 : i + 1
    const tacche = quanti / passo
    const scritto = quanti % (2 * passo) === 0
    const candidati = [
      [g.valori[vicino], `questa è la barra ${g.voci[vicino].di}, quella accanto`],
      [quanti - passo, 'la cima arriva una tacca più su: seguila dritta fino ai numeri'],
      [quanti + passo, 'la cima si ferma una tacca più giù: seguila dritta fino ai numeri'],
    ]
    if (passo > 1) candidati.unshift([tacche, `hai contato le tacche, ma ogni tacca vale ${passo}`])
    return domanda({
      testo: g.storia.quanti(v),
      soggetto: scena(g.scena),
      buona: testo(quanti),
      falsi: falsiDi(sorte, quanti, candidati),
      chiave: 'dati:barre',
      aiuto: `parti dalla cima della barra ${v.di} e vai dritto a sinistra, fino ai numeri`
        + (passo > 1 ? `: ogni tacca vale ${passo}` : '')
        + (scritto ? '' : `. La cima sta a metà fra ${quanti - passo} e ${quanti + passo}, quindi ${quanti}`),
      sorte,
    })
  }

  // la stessa domanda su tutte le forme che quel grado conosce: fa vedere che «quanti in più» è un'idea sola
  graficoPerConto(grado, sorte, n) {
    if (grado <= 3) return sorte.forse(0.5)
      ? unGrafico(sorte, 'pittogramma', { n, max: 8 })
      : unGrafico(sorte, 'barre', { n, passo: sorte.uno([1, 2]) })
    if (grado === 4 && sorte.forse(0.5))
      return unGrafico(sorte, 'legenda', { n, ...sorte.uno([{ vale: 2, max: 7 }, { vale: 5, max: 7 }, { vale: 10, max: 7 }]) })
    return unGrafico(sorte, 'barre', { n, passo: grado === 4 ? sorte.uno([2, 5]) : sorte.uno([5, 10]) })
  }

  // l'errore che si fa di più è sommare («in più» suona come «più»); il secondo è rispondere con un solo numero
  differenza(grado, sorte) {
    const tabella = grado >= 4 && sorte.forse(grado === 4 ? 0.3 : 0.5)
    if (tabella) return this.differenzaTabella(grado, sorte)
    const g = this.graficoPerConto(grado, sorte, sorte.fra(3, 4))
    const [ia, ib] = sorte.alcuni(g.voci.map((_, i) => i), 2).sort((x, y) => g.valori[y] - g.valori[x])
    const a = g.voci[ia], b = g.voci[ib], va = g.valori[ia], vb = g.valori[ib]
    const d = va - vb
    const inPiu = sorte.forse(0.6)
    const consegna = inPiu ? g.storia.confronta(a, b, 'più') : g.storia.confronta(b, a, 'meno')
    const [chi, altro] = inPiu ? [a, b] : [b, a]
    const candidati = [
      [va + vb, `hai sommato: «quanti in ${inPiu ? 'più' : 'meno'}» chiede quanti ne mancano per arrivare da ${vb} a ${va}`],
      [inPiu ? va : vb, `${inPiu ? va : vb} è il numero ${chi.di}: la domanda chiede la differenza con quello ${altro.di}`],
      [inPiu ? vb : va, `${inPiu ? vb : va} è il numero ${altro.di}: la domanda chiede la differenza fra i due`],
      [d + g.passo, `rifai il conto: ${va} − ${vb}`],
      [d - g.passo, `rifai il conto: ${va} − ${vb}`],
    ]
    if (g.forma === 'legenda')
      candidati.unshift([(g.icone[ia] - g.icone[ib]), `hai contato i disegni in più, ma ogni ${g.storia.icona} vale ${g.vale}`])
    if (g.forma === 'barre' && g.passo > 1)
      candidati.splice(1, 0, [d / g.passo, `hai contato le tacche fra le due cime, ma ogni tacca vale ${g.passo}`])
    const dritta = g.forma === 'barre'
      ? `c'è una strada corta: conta le tacche fra le due cime${g.passo > 1 ? `, ${g.passo} per tacca` : ''}`
      : g.forma === 'pittogramma'
        ? "c'è una strada corta: i disegni stanno in colonna, guarda quanti ne ha in più la fila lunga"
        : undefined
    return domanda({
      testo: consegna,
      soggetto: scena(g.scena),
      buona: testo(d),
      falsi: falsiDi(sorte, d, candidati),
      chiave: 'dati:differenza',
      aiuto: `trova i due numeri, ${va} e ${vb}, e togli il più piccolo dal più grande: ${va} − ${vb} = ${d}`,
      dritta,
      sorte,
    })
  }

  differenzaTabella(grado, sorte) {
    const tb = unaTabella(sorte, grado, grado >= 5 && sorte.forse(0.4) ? 4 : 3)
    const j = sorte.fra(0, tb.colonne.length - 1)
    const [ia, ib] = sorte.alcuni([0, 1, 2], 2).sort((x, y) => tb.celle[y][j] - tb.celle[x][j])
    const c = tb.colonne[j], a = tb.righe[ia], b = tb.righe[ib]
    const va = tb.celle[ia][j], vb = tb.celle[ib][j], d = va - vb
    const inPiu = sorte.forse(0.6)
    const [chi, altro] = inPiu ? [a, b] : [b, a]
    const jAltra = j > 0 ? j - 1 : j + 1
    return domanda({
      testo: inPiu ? tb.t.confronta(c, a, b, 'più') : tb.t.confronta(c, b, a, 'meno'),
      soggetto: scena(tb.scena),
      buona: testo(d),
      falsi: falsiDi(sorte, d, [
        [va + vb, `hai sommato: «quanti in ${inPiu ? 'più' : 'meno'}» chiede quanti ne mancano per arrivare da ${vb} a ${va}`],
        [inPiu ? va : vb, `è il numero ${chi.di}: la domanda chiede la differenza con ${altro.nome}`],
        [Math.abs(tb.celle[ia][jAltra] - tb.celle[ib][jAltra]), `questa è la differenza nella colonna ${tb.colonne[jAltra].di}: scendi dalla colonna ${c.di}`],
        [inPiu ? vb : va, `è il numero ${altro.di}: la domanda chiede la differenza`],
        [d + 1, `rifai il conto: ${va} − ${vb}`],
      ]),
      chiave: 'dati:differenza',
      aiuto: `nella colonna ${c.di} trova il numero ${a.di} (${va}) e quello ${b.di} (${vb}), e togli il più piccolo: ${va} − ${vb} = ${d}`,
      sorte,
    })
  }

  // l'errore è nel leggere: una voce lasciata fuori, solo la più grande, o (con la legenda) i disegni invece dei valori
  totale(grado, sorte) {
    if (grado >= 4 && sorte.forse(grado === 4 ? 0.3 : 0.5)) return this.totaleTabella(grado, sorte)
    const n = grado <= 3 ? 3 : sorte.fra(3, 4)
    const g = this.graficoPerConto(grado, sorte, n)
    const tot = somma(g.valori)
    const k = sorte.fra(0, n - 1)
    const candidati = [
      [tot - g.valori[k], `hai lasciato fuori il numero ${g.voci[k].di}, ${g.valori[k]}: «in tutto» li vuole tutti`],
      [senzaRiporto(g.valori), `hai dimenticato il riporto: rifai ${piu(g.valori)}`],
      [Math.max(...g.valori), 'questo è solo il più grande: «in tutto» vuol dire metterli insieme tutti'],
      [tot + g.passo, `rifai la somma: ${piu(g.valori)}`],
      [tot - g.passo, `rifai la somma: ${piu(g.valori)}`],
    ]
    if (g.forma === 'legenda') {
      candidati.unshift([somma(g.icone), `hai contato i disegni, ma ogni ${g.storia.icona} vale ${g.vale}`])
    }
    const aiuto = g.forma === 'legenda'
      ? `ogni ${g.storia.icona} vale ${g.vale}: i disegni sono ${somma(g.icone)} in tutto, e ${somma(g.icone)} × ${g.vale} = ${tot}`
      : `leggi il numero di ogni ${g.forma === 'barre' ? 'barra' : 'fila'} e sommali tutti: ${piu(g.valori)} = ${tot}`
    return domanda({
      testo: g.storia.tutto(n),
      soggetto: scena(g.scena),
      buona: testo(tot),
      falsi: falsiDi(sorte, tot, candidati),
      chiave: 'dati:totale',
      aiuto,
      dritta: g.forma === 'legenda'
        ? `c'è una strada corta: conta tutti i disegni insieme e fai × ${g.vale}`
        : undefined,
      sorte,
    })
  }

  // il falso che conta è l'altro verso: sommare una colonna invece della riga
  totaleTabella(grado, sorte) {
    const tb = unaTabella(sorte, grado, grado >= 5 && sorte.forse(0.4) ? 4 : 3)
    const perRiga = sorte.forse(0.6)
    let consegna, numeri, dove, altroTot, altroDove
    if (perRiga) {
      const i = sorte.fra(0, 2)
      numeri = tb.celle[i]
      consegna = tb.t.riga(tb.righe[i])
      dove = `nella riga ${tb.righe[i].di}, da sinistra a destra`
      const j = sorte.fra(0, tb.colonne.length - 1)
      altroTot = somma(tb.celle.map(r => r[j]))
      altroDove = `questo è il totale della colonna ${tb.colonne[j].di}: la riga ${tb.righe[i].di} va da sinistra a destra`
    } else {
      const j = sorte.fra(0, tb.colonne.length - 1)
      numeri = tb.celle.map(r => r[j])
      consegna = tb.t.colonna(tb.colonne[j])
      dove = `nella colonna ${tb.colonne[j].di}, dall'alto in basso`
      const i = sorte.fra(0, 2)
      altroTot = somma(tb.celle[i])
      altroDove = `questo è il totale della riga ${tb.righe[i].di}: la colonna ${tb.colonne[j].di} va dall'alto in basso`
    }
    const tot = somma(numeri)
    const k = sorte.fra(0, numeri.length - 1)
    return domanda({
      testo: consegna,
      soggetto: scena(tb.scena),
      buona: testo(tot),
      falsi: falsiDi(sorte, tot, [
        [altroTot, altroDove],
        [tot - numeri[k], `ne hai lasciato fuori uno, il ${numeri[k]}: ${dove}, i numeri da sommare sono ${PAROLE[numeri.length]}`],
        [senzaRiporto(numeri), `hai dimenticato il riporto: rifai ${piu(numeri)}`],
        [Math.max(...numeri), 'questo è solo il numero più grande: «in tutto» vuol dire sommarli'],
        [tot + 1, `rifai la somma: ${piu(numeri)}`],
      ]),
      chiave: 'dati:totale',
      aiuto: `somma i numeri ${dove}: ${piu(numeri)} = ${tot}`,
      sorte,
    })
  }

  // tre errori sono tre caselle: quella accanto nella riga giusta, quella nella colonna giusta, quella in nessuna delle due
  tabella(grado, sorte) {
    const tb = unaTabella(sorte, grado, grado >= 5 && sorte.forse(0.4) ? 4 : 3)
    const i = sorte.fra(0, 2), j = sorte.fra(0, tb.colonne.length - 1)
    const r = tb.righe[i], c = tb.colonne[j]
    const i2 = i > 0 && (i === 2 || sorte.forse(0.5)) ? i - 1 : i + 1
    const j2 = j > 0 && (j === tb.colonne.length - 1 || sorte.forse(0.5)) ? j - 1 : j + 1
    const giusto = tb.celle[i][j]
    return domanda({
      testo: tb.t.cella(r, c),
      soggetto: scena(tb.scena),
      buona: testo(giusto),
      falsi: falsiDi(sorte, giusto, [
        [tb.celle[i][j2], `la riga è quella giusta, ma la colonna è quella ${tb.colonne[j2].di}`],
        [tb.celle[i2][j], `la colonna è quella giusta, ma la riga è quella ${tb.righe[i2].di}`],
        [tb.celle[i2][j2], 'qui né la riga né la colonna sono quelle giuste'],
      ]),
      chiave: 'dati:tabella',
      aiuto: `parti dalla riga ${r.di} a sinistra e dalla colonna ${c.di} in alto: il numero giusto è dove si incontrano`,
      sorte,
    })
  }

  // la moda è unica per costruzione (una volta di più della seconda); i falsi: la seconda, quante volte compare, il più grande
  moda(sorte) {
    return sorte.forse(0.5) ? this.modaNumeri(sorte) : this.modaFigure(sorte)
  }

  // la fila: la moda f volte, la seconda f−1, gli altri sotto la seconda, così la seconda resta la vera tentazione
  filaConModa(sorte, valori, n) {
    for (let t = 0; t < 40; t++) {
      const f = sorte.fra(3, 4)
      const k = sorte.fra(1, Math.min(3, valori.length - 2))
      const resto = n - (2 * f - 1)
      if (resto < k || resto > k * (f - 2)) continue
      const [m, s, ...altri] = sorte.alcuni(valori, 2 + k)
      const volteAltri = altri.map(() => 1)
      for (let r = resto - k; r > 0; r--) {
        const liberi = volteAltri.map((c, i) => (c < f - 2 ? i : -1)).filter(i => i >= 0)
        volteAltri[sorte.uno(liberi)]++
      }
      const fila = sorte.mescola([...Array(f).fill(m), ...Array(f - 1).fill(s),
        ...altri.flatMap((x, i) => Array(volteAltri[i]).fill(x))])
      return { m, s, altri, f, fila }
    }
    const [m, s, x] = sorte.alcuni(valori, 3)
    return { m, s, altri: [x], f: 3, fila: sorte.mescola([m, m, m, s, s, x]) }
  }

  modaNumeri(sorte) {
    const st = sorte.uno(MODA_NUMERI)
    const valori = []
    for (let v = st.da; v <= st.a; v++) valori.push(v)
    const { m, s, f, fila } = this.filaConModa(sorte, valori, sorte.fra(7, 9))
    const max = Math.max(...fila)
    const conta = x => fila.filter(y => y === x).length
    return domanda({
      testo: `${st.che}. Qual è la moda, cioè il numero che compare più volte?`,
      soggetto: { testo: fila.join(', ') },
      buona: testo(m),
      falsi: falsiDi(sorte, m, [
        [s, `${s} compare ${volte(f - 1)}, ma ${m} compare ${volte(f)}`],
        [f, `${f} è quante volte compare ${m}: la moda è il numero che si ripete, non quante volte`],
        [max, `${max} è il più grande, ma compare ${volte(conta(max))}: la moda è quello che si ripete di più`],
        [fila.length, `${fila.length} è quanti numeri ci sono in tutto`],
      ], { zero: st.da === 0 }),
      chiave: 'dati:moda',
      aiuto: `conta quante volte compare ogni numero: ${m} compare ${volte(f)}, più di tutti gli altri, quindi la moda è ${m}`,
      sorte,
    })
  }

  modaFigure(sorte) {
    const st = sorte.uno(MODA_FIGURE)
    const { m, s, altri, fila } = this.filaConModa(sorte, st.figure, sorte.fra(st.n[0], st.n[1]))
    const conta = x => fila.filter(y => y === x).length
    return domanda({
      testo: `${st.che}. Qual è la moda, cioè ${st.quale}?`,
      soggetto: { testo: fila.join(' ') },
      buona: emoji(m),
      falsi: [
        emoji(s, `compare ${volte(conta(s))}, ma ${m} compare ${volte(conta(m))}`),
        ...altri.map(x => emoji(x, `compare ${volte(conta(x))}: conta quante volte c'è ognuno`)),
      ],
      chiave: 'dati:moda',
      aiuto: `conta quante volte compare ognuno: ${m} compare ${volte(conta(m))}, più di tutti gli altri`,
      sorte,
    })
  }

  // i falsi: la somma senza divisione, il più alto/basso, il numero in mezzo alla fila; i dati sono tirati finché la media è intera
  media(sorte) {
    const n = sorte.fra(3, 5)
    const dalGrafico = sorte.forse(0.4)
    let consegna, soggetto, valori
    if (dalGrafico) {
      const storie = STORIE.filter(s => s.media && s.tetto >= 20)
      const storia = sorte.uno(storie)
      const passo = sorte.uno([1, 2])
      const k = this.tiroIntero(sorte, n, 1, TACCHE)
      valori = k.map(x => x * passo)
      const voci = prendiVoci(sorte, storia.voci, n, storia.fila)
      consegna = storia.media(n)
      soggetto = scena({ che: 'istogramma', voci: voci.map(v => v.etichetta), valori, passo })
    } else {
      const st = sorte.uno(MEDIA_STORIE)
      valori = this.tiroIntero(sorte, n, st.da, st.a)
      consegna = st.dice(elenco(valori), n, sorte.uno(NOMI).nome)
    }
    // la parola da sola non si indovina: o la sai o tiri a caso, e il caso porta lontano. Si dice cosa vuol dire, il conto resta da fare
    consegna += '\n«In media» vuol dire: metti tutto insieme e dividilo in parti uguali.'
    const tot = somma(valori), m = tot / n
    const candidati = [
      [tot, `${tot} è la somma: la media è la somma divisa per quanti sono, ${tot} : ${n}`],
      [Math.max(...valori), 'è il più alto: la media sta sempre fra il più basso e il più alto'],
      [Math.min(...valori), 'è il più basso: la media sta sempre fra il più basso e il più alto'],
      [tot / (n - 1), `hai diviso per ${n - 1}, ma i numeri sono ${n}`],
      [tot / (n + 1), `hai diviso per ${n + 1}, ma i numeri sono ${n}`],
    ]
    if (!dalGrafico && n % 2)
      candidati.splice(1, 0, [valori[(n - 1) / 2], 'è il numero che sta in mezzo alla fila, ma la media non si legge: si calcola'])
    return domanda({
      testo: consegna,
      soggetto,
      buona: testo(m),
      falsi: falsiDi(sorte, m, candidati, { zero: true }),
      chiave: 'dati:media',
      aiuto: (dalGrafico ? 'leggi dove arriva ogni barra, poi ' : '')
        + `somma tutti i numeri e dividi per quanti sono: ${piu(valori)} = ${tot}, e ${tot} : ${n} = ${m}`,
      sorte,
    })
  }

  // n numeri con somma divisibile per n, non tutti uguali; dopo 100 tentativi una fila fatta a mano che rispetta la regola
  tiroIntero(sorte, n, da, a) {
    for (let t = 0; t < 100; t++) {
      const l = Array.from({ length: n }, () => sorte.fra(da, a))
      if (somma(l) % n === 0 && new Set(l).size > 1) return l
    }
    const c = Math.round((da + a) / 2)
    return [c - 1, c + 1, ...Array(n - 2).fill(c)]
  }
}

export default new Grafici()
